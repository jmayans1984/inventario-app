// ================================================================
// Square en vivo — ventas y consumo de inventario en tiempo real
//
// Square avisa por webhook cada vez que se crea o actualiza una orden.
// Este módulo recibe esos avisos, trae el detalle de la orden por la API,
// traduce cada producto a su receta y acumula en memoria el estado del día.
// Los navegadores conectados reciben cada cambio por Server-Sent Events.
//
// IMPORTANTE: esto NO escribe en la base de datos. La contabilidad sigue
// saliendo de la importación del CSV al cierre del día, que es la fuente
// conciliada. Aquí solo se muestra lo que está pasando ahora.
//
// Sin dependencias externas: fetch y crypto son nativos de Node.
// ================================================================

const crypto = require('crypto');

const API = 'https://connect.squareup.com/v2';
const MAX_ORDENES_RECIENTES = 40;

// ─── Utilidades ────────────────────────────────────────────────

/** Día de operación: la jornada va de mediodía a ~3am, así que antes de las
 *  5am seguimos contando el día anterior (igual criterio que el importador). */
function diaOperacion(fecha = new Date()) {
    const d = new Date(fecha);
    if (d.getHours() < 5) d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const dinero = (m) => (m && typeof m.amount === 'number') ? m.amount / 100 : 0;

/** Compara dos strings en tiempo constante (evita filtrar información por
 *  la duración de la comparación al validar la firma). */
function igualSeguro(a, b) {
    const ba = Buffer.from(String(a || ''), 'utf8');
    const bb = Buffer.from(String(b || ''), 'utf8');
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
}

/** Firma de Square: HMAC-SHA256 sobre (url de notificación + cuerpo crudo). */
function firmaValida(rawBody, firmaRecibida, urlNotificacion, claveFirma) {
    if (!claveFirma || !firmaRecibida || !rawBody) return false;
    const esperada = crypto
        .createHmac('sha256', claveFirma)
        .update(urlNotificacion + rawBody.toString('utf8'))
        .digest('base64');
    return igualSeguro(esperada, firmaRecibida);
}

// ─── Módulo ────────────────────────────────────────────────────

function crearSquareVivo({ pool }) {
    const token       = process.env.SQUARE_ACCESS_TOKEN || '';
    const claveFirma  = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || '';
    const urlWebhook  = process.env.SQUARE_WEBHOOK_URL || '';

    // Estado en memoria por empresa: { dia, sedes, ordenes, consumo, ... }
    const estados = new Map();
    // Navegadores conectados (SSE), por empresa
    const clientes = new Map();
    // Caché catalog_object_id -> sku, y eventos ya procesados (idempotencia)
    let catalogo = { mapa: new Map(), cargadoEn: 0 };
    const eventosVistos = new Set();
    // Caché de recetas: sku -> [{ articulo, nombre, und, cant }]
    let recetas = { mapa: new Map(), cargadoEn: 0 };
    let sedesPorLocation = { mapa: new Map(), cargadoEn: 0 };

    const configurado = () => Boolean(token && claveFirma);

    // ── Estado del día ─────────────────────────────────────────
    function estadoDe(empresa) {
        const dia = diaOperacion();
        let e = estados.get(empresa);
        if (!e || e.dia !== dia) {
            e = { dia, sedes: new Map(), ordenes: [], consumo: new Map(), desde: new Date().toISOString() };
            estados.set(empresa, e);
        }
        return e;
    }

    function snapshot(empresa) {
        const e = estadoDe(empresa);
        const sedes = [...e.sedes.values()]
            .map(s => ({ ...s, productos: [...s.productos.values()].sort((a, b) => b.cantidad - a.cantidad) }))
            .sort((a, b) => b.ventas - a.ventas);
        return {
            configurado: configurado(),
            dia: e.dia,
            desde: e.desde,
            totales: {
                ventas:  sedes.reduce((s, x) => s + x.ventas, 0),
                ordenes: sedes.reduce((s, x) => s + x.ordenes, 0),
                articulos: sedes.reduce((s, x) => s + x.articulos, 0),
            },
            sedes,
            ordenes: e.ordenes,
            consumo: [...e.consumo.values()].sort((a, b) => b.cantidad - a.cantidad),
        };
    }

    // ── Caché de datos propios (sede y recetas) ────────────────
    async function mapaSedes(empresa) {
        if (sedesPorLocation.mapa.size && Date.now() - sedesPorLocation.cargadoEn < 300000) {
            return sedesPorLocation.mapa;
        }
        const r = await pool.query(
            `SELECT codigo, nombre, TRIM(COALESCE(square_location_id,'')) AS loc
             FROM ccostos WHERE empresa = $1 AND COALESCE(activo,'SI') <> 'NO'`,
            [empresa]
        );
        const mapa = new Map();
        for (const row of r.rows) if (row.loc) mapa.set(row.loc, { codigo: row.codigo, nombre: row.nombre });
        sedesPorLocation = { mapa, cargadoEn: Date.now() };
        return mapa;
    }

    /** Componentes de inventario de un SKU (misma consulta que usa el importador). */
    async function componentesDe(skus) {
        const faltantes = skus.filter(s => !recetas.mapa.has(s));
        if (faltantes.length) {
            const r = await pool.query(
                `SELECT TRIM(dp.receta::text) AS receta, TRIM(dp.articulo::text) AS articulo, dp.cant,
                        COALESCE(p.nombre, dp.articulo) AS articulo_nombre, COALESCE(p.und,'') AS und
                 FROM detalle_productos dp
                 INNER JOIN productos p ON TRIM(p.codigo::text) = TRIM(dp.articulo::text)
                 WHERE TRIM(dp.receta::text) = ANY($1)
                   AND UPPER(TRIM(COALESCE(p.control,''))) = 'SI'`,
                [faltantes]
            );
            for (const sku of faltantes) recetas.mapa.set(sku, []);
            for (const row of r.rows) {
                const lista = recetas.mapa.get(row.receta) || [];
                lista.push({
                    articulo: row.articulo,
                    nombre: row.articulo_nombre,
                    und: row.und,
                    cant: parseFloat(row.cant) || 0,
                });
                recetas.mapa.set(row.receta, lista);
            }
        }
        return recetas.mapa;
    }

    // ── Llamadas a la API de Square ────────────────────────────
    async function square(ruta, opciones = {}) {
        const r = await fetch(API + ruta, {
            ...opciones,
            headers: {
                'Square-Version': '2024-10-17',
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...(opciones.headers || {}),
            },
        });
        if (!r.ok) throw new Error(`Square ${ruta} respondió ${r.status}`);
        return r.json();
    }

    /** Mapa catalog_object_id -> SKU. Square manda el id de la variante en la
     *  orden, pero las recetas están indexadas por SKU. Se cachea 10 min. */
    async function mapaCatalogo() {
        if (catalogo.mapa.size && Date.now() - catalogo.cargadoEn < 600000) return catalogo.mapa;
        const mapa = new Map();
        let cursor = null;
        do {
            const q = new URLSearchParams({ types: 'ITEM_VARIATION' });
            if (cursor) q.set('cursor', cursor);
            const j = await square(`/catalog/list?${q}`);
            for (const obj of (j.objects || [])) {
                const sku = obj.item_variation_data?.sku;
                if (sku) mapa.set(obj.id, String(sku).trim());
            }
            cursor = j.cursor || null;
        } while (cursor);
        catalogo = { mapa, cargadoEn: Date.now() };
        return mapa;
    }

    const traerOrden = (id) => square(`/orders/${id}`).then(j => j.order);

    // ── Envío a los navegadores conectados ─────────────────────
    function emitir(empresa) {
        const lista = clientes.get(empresa);
        if (!lista || !lista.size) return;
        const payload = `data: ${JSON.stringify(snapshot(empresa))}\n\n`;
        for (const res of lista) {
            try { res.write(payload); } catch { lista.delete(res); }
        }
    }

    // ── Procesar una orden ─────────────────────────────────────
    async function procesarOrden(empresa, orden) {
        if (!orden || !orden.id) return false;

        const e = estadoDe(empresa);
        // Una orden puede llegar varias veces (created + updated). Se reemplaza
        // la versión anterior en vez de sumarla otra vez.
        const previa = e.ordenes.find(o => o.id === orden.id);

        const sedes = await mapaSedes(empresa);
        const sede  = sedes.get(orden.location_id) || null;
        const claveSede = sede ? sede.codigo : `?${orden.location_id}`;
        const nombreSede = sede ? sede.nombre : 'Sede sin asociar';

        const lineas = (orden.line_items || []).filter(li => li.catalog_object_id || li.name);
        const cat = await mapaCatalogo().catch(() => new Map());

        const items = lineas.map(li => ({
            sku: li.catalog_object_id ? (cat.get(li.catalog_object_id) || '') : '',
            nombre: li.name || '(sin nombre)',
            variante: li.variation_name || '',
            cantidad: parseFloat(li.quantity) || 0,
            total: dinero(li.total_money),
        }));

        const totalOrden = dinero(orden.total_money);
        const nueva = {
            id: orden.id,
            sedeCodigo: claveSede,
            sede: nombreSede,
            estado: orden.state || '',
            creada: orden.created_at || new Date().toISOString(),
            total: totalOrden,
            items,
        };

        // Reemplazar o insertar al inicio
        if (previa) {
            e.ordenes = e.ordenes.map(o => (o.id === orden.id ? nueva : o));
        } else {
            e.ordenes.unshift(nueva);
            if (e.ordenes.length > MAX_ORDENES_RECIENTES) e.ordenes.length = MAX_ORDENES_RECIENTES;
        }

        // Recalcular agregados desde las órdenes vigentes (evita descuadres si
        // una orden llega repetida o cambia de monto).
        await recalcular(empresa);
        return true;
    }

    async function recalcular(empresa) {
        const e = estadoDe(empresa);
        const porSede = new Map();
        const skus = new Set();

        for (const o of e.ordenes) {
            if (o.estado === 'CANCELED') continue;
            let s = porSede.get(o.sedeCodigo);
            if (!s) {
                s = { codigo: o.sedeCodigo, nombre: o.sede, ventas: 0, ordenes: 0, articulos: 0, productos: new Map() };
                porSede.set(o.sedeCodigo, s);
            }
            s.ventas += o.total;
            s.ordenes += 1;
            for (const it of o.items) {
                s.articulos += it.cantidad;
                if (it.sku) skus.add(it.sku);
                const k = it.sku || it.nombre;
                const p = s.productos.get(k) || { sku: it.sku, nombre: it.nombre, cantidad: 0, total: 0 };
                p.cantidad += it.cantidad;
                p.total += it.total;
                s.productos.set(k, p);
            }
        }

        // Consumo de inventario: expandir cada SKU vendido por su receta
        const consumo = new Map();
        if (skus.size) {
            const mapaRec = await componentesDe([...skus]).catch(() => new Map());
            for (const s of porSede.values()) {
                for (const p of s.productos.values()) {
                    for (const c of (mapaRec.get(p.sku) || [])) {
                        const acc = consumo.get(c.articulo) || { codigo: c.articulo, nombre: c.nombre, und: c.und, cantidad: 0 };
                        acc.cantidad += c.cant * p.cantidad;
                        consumo.set(c.articulo, acc);
                    }
                }
            }
        }

        e.sedes = porSede;
        e.consumo = consumo;
    }

    // ── Registro de rutas ──────────────────────────────────────
    function registrar(app) {
        // Webhook de Square. La firma se valida sobre el cuerpo CRUDO, que se
        // captura en el express.json() del servidor (req.rawBody).
        app.post('/api/square/webhook', async (req, res) => {
            try {
                if (!configurado()) return res.status(503).json({ error: 'Square en vivo no está configurado' });

                const firma = req.get('x-square-hmacsha256-signature');
                const url = urlWebhook || `https://${req.get('host')}${req.originalUrl}`;
                if (!firmaValida(req.rawBody, firma, url, claveFirma)) {
                    console.warn('[square-vivo] firma inválida, evento descartado');
                    return res.status(401).json({ error: 'firma inválida' });
                }

                // Se responde de inmediato: Square reintenta si tardamos.
                res.status(200).json({ ok: true });

                const ev = req.body || {};
                if (ev.event_id) {
                    if (eventosVistos.has(ev.event_id)) return;
                    eventosVistos.add(ev.event_id);
                    if (eventosVistos.size > 5000) eventosVistos.clear();
                }

                const tipo = ev.type || '';
                if (!tipo.startsWith('order.')) return;

                const orderId = ev.data?.id
                    || ev.data?.object?.order_created?.order_id
                    || ev.data?.object?.order_updated?.order_id;
                if (!orderId) return;

                const empresa = String(process.env.SQUARE_EMPRESA || '').trim();
                if (!empresa) { console.warn('[square-vivo] falta SQUARE_EMPRESA'); return; }

                const orden = await traerOrden(orderId);
                if (await procesarOrden(empresa, orden)) emitir(empresa);
            } catch (e) {
                console.error('[square-vivo] error procesando webhook:', e.message);
            }
        });

        // Estado actual (lo que ya se acumuló hoy)
        app.get('/api/square/vivo/estado', (req, res) => {
            const empresa = String(req.query.empresa || '').trim();
            if (!empresa) return res.status(400).json({ success: false, error: 'empresa requerida' });
            res.json({ success: true, data: snapshot(empresa) });
        });

        // Flujo en vivo (Server-Sent Events)
        app.get('/api/square/vivo/stream', (req, res) => {
            const empresa = String(req.query.empresa || '').trim();
            if (!empresa) return res.status(400).end();

            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no',
            });
            res.write(`data: ${JSON.stringify(snapshot(empresa))}\n\n`);

            if (!clientes.has(empresa)) clientes.set(empresa, new Set());
            clientes.get(empresa).add(res);

            // Latido: mantiene viva la conexión detrás de proxies
            const latido = setInterval(() => { try { res.write(': ping\n\n'); } catch {} }, 25000);
            req.on('close', () => {
                clearInterval(latido);
                clientes.get(empresa)?.delete(res);
            });
        });

        // Diagnóstico: ayuda a saber por qué no llegan datos
        app.get('/api/square/vivo/diagnostico', async (req, res) => {
            const empresa = String(req.query.empresa || '').trim();
            const out = {
                tokenConfigurado: Boolean(token),
                claveFirmaConfigurada: Boolean(claveFirma),
                empresaConfigurada: Boolean(process.env.SQUARE_EMPRESA),
                urlWebhook: urlWebhook || '(se deduce del request)',
                sedesConLocationId: [],
                sedesSinLocationId: [],
            };
            if (empresa) {
                try {
                    const r = await pool.query(
                        `SELECT codigo, nombre, TRIM(COALESCE(square_location_id,'')) AS loc
                         FROM ccostos WHERE empresa = $1 AND COALESCE(activo,'SI') <> 'NO' ORDER BY codigo`,
                        [empresa]
                    );
                    for (const row of r.rows) {
                        (row.loc ? out.sedesConLocationId : out.sedesSinLocationId)
                            .push({ codigo: row.codigo, nombre: row.nombre, location_id: row.loc || null });
                    }
                } catch (e) { out.errorSedes = e.message; }
            }
            res.json({ success: true, data: out });
        });
    }

    // Se exponen las internas para poder probarlas sin depender de Square
    return { registrar, procesarOrden, snapshot, emitir, firmaValida, diaOperacion };
}

module.exports = { crearSquareVivo, firmaValida, diaOperacion };
