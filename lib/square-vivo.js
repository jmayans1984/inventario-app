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
// Cuántas órdenes se envían al navegador por sede. En memoria se conservan
// TODAS las del día: los totales se calculan sobre la lista completa, así que
// recortarla ahí falsearía las ventas de la jornada.
const MAX_ORDENES_ENVIADAS = 30;

// ─── Utilidades ────────────────────────────────────────────────

/** Descompone un instante en la zona horaria del negocio. Es necesario porque
 *  el servidor corre en UTC: usar la hora local del proceso daría un día de
 *  operación equivocado. */
function partesEnZona(fecha, zona) {
    const fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const p = {};
    for (const { type, value } of fmt.formatToParts(fecha)) p[type] = value;
    return { anio: +p.year, mes: +p.month, dia: +p.day, hora: +p.hour };
}

/** Día de operación: la jornada va de mediodía a ~3am, así que antes de las
 *  5am seguimos contando el día anterior (igual criterio que el importador).
 *  Se evalúa siempre en la zona del negocio, no en la del servidor. */
function diaOperacion(fecha = new Date(), zona = process.env.SQUARE_TZ || 'America/New_York') {
    let { anio, mes, dia, hora } = partesEnZona(fecha, zona);
    if (hora < 5) {
        // Restar un día usando UTC puro para no reintroducir la zona local
        const d = new Date(Date.UTC(anio, mes - 1, dia));
        d.setUTCDate(d.getUTCDate() - 1);
        anio = d.getUTCFullYear(); mes = d.getUTCMonth() + 1; dia = d.getUTCDate();
    }
    return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

const dinero = (m) => (m && typeof m.amount === 'number') ? m.amount / 100 : 0;

// Plataformas de delivery conocidas. Square reporta en `source.name` el nombre
// de la aplicación que creó la orden, así que la plataforma llega por ahí.
const PLATAFORMAS = [
    { patron: /door\s*dash/i, nombre: 'DoorDash' },
    { patron: /uber\s*eats/i, nombre: 'Uber Eats' },
    { patron: /grubhub/i,      nombre: 'Grubhub' },
    { patron: /postmates/i,    nombre: 'Postmates' },
    { patron: /deliveroo/i,    nombre: 'Deliveroo' },
    { patron: /rappi/i,        nombre: 'Rappi' },
    { patron: /seamless/i,     nombre: 'Seamless' },
    { patron: /chow\s*now/i,   nombre: 'ChowNow' },
];

/** De dónde entró la orden. Square lo cuenta en dos partes: `source.name` es
 *  quién la creó (el POS o la plataforma de delivery) y `fulfillments[].type`
 *  dice cómo se entrega. Se combinan porque ninguna alcanza sola: el mismo POS
 *  toma pedidos en mostrador y para recoger. */
function canalDe(orden) {
    const fuente = String(orden.source && orden.source.name || '').trim();
    const tipo = String(((orden.fulfillments || [])[0] || {}).type || '').toUpperCase();

    for (const p of PLATAFORMAS) {
        if (p.patron.test(fuente)) return { canal: p.nombre, grupo: 'delivery' };
    }
    if (/online|ecom|web/i.test(fuente)) return { canal: 'En línea', grupo: 'online' };
    if (tipo === 'DELIVERY') return { canal: 'Domicilio', grupo: 'delivery' };
    if (tipo === 'SHIPMENT') return { canal: 'Envío', grupo: 'online' };
    if (tipo === 'PICKUP')   return { canal: 'Para recoger', grupo: 'mostrador' };
    return { canal: 'Mostrador', grupo: 'mostrador' };
}

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
    let modificadores = { mapa: new Map(), cargadoEn: 0 };
    let costos = { mapa: new Map(), cargadoEn: 0 };
    let promedios = { mapa: new Map(), cargadoEn: 0, dia: null };
    let sedesPorLocation = { mapa: new Map(), cargadoEn: 0 };

    const configurado = () => Boolean(token && claveFirma);

    // ── Estado del día ─────────────────────────────────────────
    function estadoDe(empresa) {
        const dia = diaOperacion();
        let e = estados.get(empresa);
        if (!e || e.dia !== dia) {
            e = { dia, sedes: new Map(), ordenes: [], consumo: new Map(),
                  desde: new Date().toISOString(), sincronizadoEn: 0, sincronizando: false };
            estados.set(empresa, e);
        }
        return e;
    }

    function snapshot(empresa) {
        const e = estadoDe(empresa);
        const porCantidad = (a, b) => b.cantidad - a.cantidad;
        const porNombre   = (a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es');
        // Cada sede se entrega completa (ventas, productos, consumo y sus
        // órdenes) para poder pintar un panel independiente por centro de costo.
        const sedes = [...e.sedes.values()]
            .map(s => ({
                codigo: s.codigo,
                nombre: s.nombre,
                ventas: s.ventas,
                ordenes: s.ordenes,
                articulos: s.articulos,
                productos: [...s.productos.values()].sort(porCantidad),
                consumo:   [...s.consumo.values()].sort(porNombre),
                // Solo las más recientes viajan al navegador; los totales de
                // arriba ya vienen calculados sobre la jornada completa.
                listaOrdenes: e.ordenes
                    .filter(o => o.sedeCodigo === s.codigo)
                    .slice(0, MAX_ORDENES_ENVIADAS),
                totalOrdenesDia: e.ordenes.filter(o => o.sedeCodigo === s.codigo).length,
                modificadores: [...s.modificadores.values()].sort(porCantidad),
                pagos: s.pagos,
                canales: [...s.canales.values()].sort((a, b) => b.ventas - a.ventas),
                ticket: s.ticket,
                costoMP: s.costoMP,
                margen: s.margen,
                pctCosto: s.pctCosto,
                pctMargen: s.pctMargen,
                articulosSinCosto: s.articulosSinCosto,
                ritmoHora: s.ritmoHora,
                horasRestantes: s.horasRestantes,
                promedioDia: s.promedioDia,
                muestrasDia: s.muestrasDia,
                pctDelPromedio: s.pctDelPromedio,
            }))
            .sort((a, b) => b.ventas - a.ventas);
        return {
            configurado: configurado(),
            dia: e.dia,
            desde: e.desde,
            sincronizadoEn: e.sincronizadoEn ? new Date(e.sincronizadoEn).toISOString() : null,
            totales: {
                ventas:  sedes.reduce((s, x) => s + x.ventas, 0),
                ordenes: sedes.reduce((s, x) => s + x.ordenes, 0),
                articulos: sedes.reduce((s, x) => s + x.articulos, 0),
                costoMP: sedes.reduce((s, x) => s + (x.costoMP || 0), 0),
                margen:  sedes.reduce((s, x) => s + (x.margen  || 0), 0),
                propinas: sedes.reduce((s, x) => s + (x.pagos?.propinas || 0), 0),
                promedioDia: sedes.reduce((s, x) => s + (x.promedioDia || 0), 0),
            },
            sedes,
            ordenes: e.ordenes.slice(0, MAX_ORDENES_ENVIADAS),
            consumo: [...e.consumo.values()].sort(porNombre),
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

    /** Mapeo modificador -> artículos de inventario, igual que usa el importador
     *  del CSV. Un modificador puede sumar o restar (tipo '+' o '-'): "NO QUESO"
     *  devuelve el insumo al inventario. Se cachea 5 minutos. */
    async function mapaModificadores() {
        if (modificadores.mapa.size && Date.now() - modificadores.cargadoEn < 300000) {
            return modificadores.mapa;
        }
        const r = await pool.query(
            `SELECT mi.modificador, TRIM(mi.articulo::text) AS articulo, mi.cant, mi.tipo,
                    COALESCE(p.nombre, mi.articulo) AS articulo_nombre, COALESCE(p.und,'') AS und
             FROM modificadores_inventario mi
             LEFT JOIN productos p ON TRIM(p.codigo::text) = TRIM(mi.articulo::text)`
        );
        const mapa = new Map();
        for (const row of r.rows) {
            const clave = String(row.modificador || '').trim().toUpperCase();
            if (!clave) continue;
            const lista = mapa.get(clave) || [];
            lista.push({
                articulo: row.articulo,
                nombre: row.articulo_nombre,
                und: row.und,
                cant: parseFloat(row.cant) || 0,
                signo: row.tipo === '-' ? -1 : 1,
            });
            mapa.set(clave, lista);
        }
        modificadores = { mapa, cargadoEn: Date.now() };
        return mapa;
    }

    /** Existencias con las que arranca el servicio, por sede y artículo.
     *  Toma todo lo anterior al día de operación MÁS los movimientos de hoy que
     *  no sean salidas por venta (por ejemplo un despacho recibido durante la
     *  jornada), para no restar dos veces lo que aquí se está proyectando. */
    async function inventarioInicial(empresa, ccostos, articulos, dia) {
        const mapa = new Map();
        if (!ccostos.length || !articulos.length) return mapa;
        const r = await pool.query(
            `SELECT ccosto, TRIM(codigo::text) AS codigo,
                    COALESCE(SUM(entrada), 0) - COALESCE(SUM(salida), 0) AS stock
             FROM detalle_inventario
             WHERE empresa = $1
               AND ccosto = ANY($2)
               AND TRIM(codigo::text) = ANY($3)
               AND (fecha < $4::date
                    OR (fecha = $4::date AND COALESCE(tipo,'') <> 'SALIDA POR VENTA'))
             GROUP BY ccosto, TRIM(codigo::text)`,
            [parseInt(empresa), ccostos, articulos, dia]
        );
        for (const row of r.rows) mapa.set(`${row.ccosto}|${row.codigo}`, parseFloat(row.stock) || 0);
        return mapa;
    }

    /** Costo unitario de cada artículo de inventario. Permite valorizar en
     *  vivo lo que se lleva consumido y, con eso, el margen del turno. Se
     *  cachea 10 minutos: los costos cambian de un día para otro, no dentro
     *  del servicio. */
    async function mapaCostos() {
        if (costos.mapa.size && Date.now() - costos.cargadoEn < 600000) return costos.mapa;
        const r = await pool.query(
            `SELECT TRIM(codigo::text) AS codigo, COALESCE(precio_costo, 0) AS costo
             FROM productos
             WHERE UPPER(TRIM(COALESCE(control,''))) = 'SI'`
        );
        const mapa = new Map();
        for (const row of r.rows) mapa.set(row.codigo, parseFloat(row.costo) || 0);
        costos = { mapa, cargadoEn: Date.now() };
        return mapa;
    }

    /** Venta bruta promedio de este mismo día de la semana, por sede, en las
     *  últimas 8 semanas. Sirve para responder "¿vamos bien?" — un sábado y un
     *  lunes no se parecen en nada, así que comparar contra el promedio general
     *  no diría nada útil.
     *
     *  Ojo: la tabla `ventas` guarda totales POR DÍA, no por hora. Por eso la
     *  comparación honesta es contra el cierre proyectado del día, no contra
     *  "lo que llevábamos a esta hora" — ese dato no existe. */
    async function promedioDiaSemana(empresa, dia) {
        if (promedios.mapa.size && promedios.dia === dia && Date.now() - promedios.cargadoEn < 3600000) {
            return promedios.mapa;
        }
        const r = await pool.query(
            `SELECT ccosto, ROUND(AVG(ventas_brutas)::numeric, 2) AS promedio, COUNT(*)::int AS muestras
             FROM ventas
             WHERE empresa = $1
               AND EXTRACT(DOW FROM fecha) = EXTRACT(DOW FROM $2::date)
               AND fecha < $2::date
               AND fecha >= $2::date - 56
             GROUP BY ccosto`,
            [parseInt(empresa), dia]
        );
        const mapa = new Map();
        for (const row of r.rows) {
            mapa.set(String(row.ccosto), { promedio: parseFloat(row.promedio) || 0, muestras: row.muestras });
        }
        promedios = { mapa, cargadoEn: Date.now(), dia };
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

    /** Pagos completados de una sede en la ventana dada (API de Payments: los
     *  "tenders" del Order están deprecados y ya no se llenan para órdenes
     *  nuevas). Se usan para desglosar tarjeta/efectivo/otros y propinas. */
    async function traerPagos(locationId, desdeISO) {
        const pagos = [];
        let cursor = null;
        do {
            const q = new URLSearchParams({ location_id: locationId, begin_time: desdeISO, sort_order: 'ASC', limit: '100' });
            if (cursor) q.set('cursor', cursor);
            const j = await square(`/payments?${q}`);
            pagos.push(...(j.payments || []));
            cursor = j.cursor || null;
        } while (cursor);
        return pagos;
    }

    /** Mapa order_id -> {tarjeta, efectivo, otros, propinas} para el día de
     *  operación en curso, consultando cada sede por separado (Payments no
     *  acepta varias location_id en una sola llamada, a diferencia de Orders). */
    async function pagosPorOrdenDelDia(locations, desdeISO, dia) {
        const mapa = new Map();
        for (const loc of locations) {
            try {
                const pagos = await traerPagos(loc, desdeISO);
                for (const p of pagos) {
                    if (p.status !== 'COMPLETED' || !p.order_id) continue;
                    if (diaOperacion(new Date(p.created_at)) !== dia) continue;
                    const acc = mapa.get(p.order_id) || { tarjeta: 0, efectivo: 0, otros: 0, propinas: 0 };
                    const monto = dinero(p.amount_money);
                    if (p.source_type === 'CARD') acc.tarjeta += monto;
                    else if (p.source_type === 'CASH') acc.efectivo += monto;
                    else acc.otros += monto;
                    acc.propinas += dinero(p.tip_money);
                    mapa.set(p.order_id, acc);
                }
            } catch (err) {
                console.error('[square-vivo] error trayendo pagos de', loc, err.message);
            }
        }
        return mapa;
    }

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
    async function agregarOrden(empresa, orden, { recalcular: recalc = true } = {}) {
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

        const items = lineas.map(li => {
            const cantLinea = parseFloat(li.quantity) || 0;
            return {
                sku: li.catalog_object_id ? (cat.get(li.catalog_object_id) || '') : '',
                nombre: li.name || '(sin nombre)',
                variante: li.variation_name || '',
                cantidad: cantLinea,
                total: dinero(li.total_money),
                // Adiciones de la línea. Square trae una cantidad propia solo a
                // veces; si no viene, el modificador aplica a cada unidad.
                modificadores: (li.modifiers || []).map(m => ({
                    nombre: (m.name || '').trim(),
                    cantidad: (parseFloat(m.quantity) || 0) > 0
                        ? parseFloat(m.quantity)
                        : cantLinea,
                })).filter(m => m.nombre),
            };
        });

        const totalOrden = dinero(orden.total_money);
        // Venta bruta = lo cobrado menos impuestos y propina: esas dos partidas
        // no son ingreso por venta, y sumarlas infla el "vendido" de la sede.
        const bruto = totalOrden - dinero(orden.total_tax_money) - dinero(orden.total_tip_money);
        const canal = canalDe(orden);
        const nueva = {
            id: orden.id,
            sedeCodigo: claveSede,
            sede: nombreSede,
            estado: orden.state || '',
            creada: orden.created_at || new Date().toISOString(),
            total: totalOrden,
            bruto,
            canal: canal.canal,
            canalGrupo: canal.grupo,
            ticket: String(orden.ticket_name || '').trim(),
            items,
        };

        // Se reemplaza si ya estaba, o se agrega; luego se ordena por hora
        // descendente. Ordenar explícitamente evita depender del orden de
        // llegada, que difiere entre los webhooks y la sincronización inicial.
        if (previa) {
            e.ordenes = e.ordenes.map(o => (o.id === orden.id ? nueva : o));
        } else {
            e.ordenes.push(nueva);
        }
        e.ordenes.sort((a, b) => new Date(b.creada) - new Date(a.creada));

        // Recalcular agregados desde las órdenes vigentes (evita descuadres si
        // una orden llega repetida o cambia de monto). Durante la sincronización
        // inicial se omite y se hace una sola vez al final.
        if (recalc) await recalcular(empresa);
        return true;
    }

    /** Un webhook trae una orden suelta: se agrega y se recalcula. */
    const procesarOrden = (empresa, orden) => agregarOrden(empresa, orden);

    /** Hora local (con decimales) de un instante, en la zona del negocio. */
    function horaLocal(fecha, zona = process.env.SQUARE_TZ || 'America/New_York') {
        const fmt = new Intl.DateTimeFormat('en-CA', {
            timeZone: zona, hour: '2-digit', minute: '2-digit', hour12: false,
        });
        const p = {};
        for (const { type, value } of fmt.formatToParts(fecha)) p[type] = value;
        const h = +p.hour === 24 ? 0 : +p.hour;
        return h + (+p.minute) / 60;
    }

    /** Día de la semana (0=domingo) en la zona del negocio. */
    function diaSemanaLocal(fecha, zona = process.env.SQUARE_TZ || 'America/New_York') {
        const nombre = new Intl.DateTimeFormat('en-US', { timeZone: zona, weekday: 'short' }).format(fecha);
        return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(nombre);
    }

    /** Horas que faltan para cerrar. El horario no es el mismo todos los días:
     *  de domingo a miércoles se cierra a las 11pm, y de jueves a sábado a las
     *  12. Usar una hora fija daba horas de más y hacía que el aviso de
     *  agotamiento se disparara antes de tiempo.
     *
     *  Se puede ajustar sin tocar código con SQUARE_CIERRE_SEMANA (dom-mié) y
     *  SQUARE_CIERRE_FINDE (jue-sáb), en horas de 0 a 24. */
    function horasHastaCierre(ahora) {
        const dow = diaSemanaLocal(ahora);
        const esFinde = dow >= 4;   // jueves(4), viernes(5), sábado(6)
        const cierre = parseFloat(
            esFinde ? (process.env.SQUARE_CIERRE_FINDE || '24')
                    : (process.env.SQUARE_CIERRE_SEMANA || '23')
        );
        const h = horaLocal(ahora);
        // Pasada la medianoche ya se cerró: el día de operación se extiende
        // hasta las 5am solo para contar las ventas rezagadas, no porque el
        // turno siga abierto.
        if (h < 5) return 0;
        return Math.max(0, cierre - h);
    }

    /** Ritmo de venta y agotamiento estimado.
     *
     *  Aquí hubo una proyección de cierre y se quitó: extrapolaba el ritmo de
     *  la hora pico hasta el cierre y sobreestimaba hasta 3x (una sede daba
     *  +306% contra su promedio). Sin la curva por hora del día no hay forma
     *  honesta de proyectar, así que se muestra el hecho -cuánto se lleva del
     *  promedio de este día- en vez de una adivinanza. */
    function aplicarRitmo(e, porSede) {
        const ahora = new Date();
        const restante = horasHastaCierre(ahora);
        const haceUnaHora = new Date(ahora.getTime() - 3600 * 1000);

        for (const s of porSede.values()) {
            const suyas = e.ordenes.filter(o => o.sedeCodigo === s.codigo && o.estado !== 'CANCELED');
            if (!suyas.length) {
                s.ritmoHora = 0; s.horasRestantes = restante;
                continue;
            }

            // Horas transcurridas desde la primera venta de la sede
            const primera = new Date(Math.min(...suyas.map(o => new Date(o.creada).getTime())));
            const transcurridas = Math.max(0.25, (ahora - primera) / 3600000);

            const ventaUltimaHora = suyas
                .filter(o => new Date(o.creada) >= haceUnaHora)
                .reduce((a, o) => a + (o.bruto ?? o.total), 0);

            // Si la última hora está floja (o apenas se abrió), el promedio de
            // la jornada es una base menos volátil que una hora suelta.
            const promedioJornada = s.ventas / transcurridas;
            s.ritmoHora = ventaUltimaHora > 0 ? ventaUltimaHora : promedioJornada;
            s.ritmoPromedio = promedioJornada;
            s.horasRestantes = restante;

            // Agotamiento: a este ritmo de consumo, ¿a qué hora se acaba?
            // Solo tiene sentido para lo que ya se está consumiendo y tiene
            // saldo conocido y positivo.
            for (const c of s.consumo.values()) {
                c.horasParaAgotar = null;
                c.agotaEn = null;
                if (c.saldo == null || c.saldo <= 0 || !(c.cantidad > 0)) continue;
                const porHora = c.cantidad / transcurridas;
                if (porHora <= 0) continue;
                const horas = c.saldo / porHora;
                c.horasParaAgotar = horas;
                // Solo se avisa si se acabaría ANTES de cerrar: si aguanta toda
                // la jornada, la hora exacta es ruido.
                if (horas <= restante) {
                    c.agotaEn = new Date(ahora.getTime() + horas * 3600000).toISOString();
                }
            }
        }
    }

    async function recalcular(empresa) {
        const e = estadoDe(empresa);
        const porSede = new Map();
        const skus = new Set();

        for (const o of e.ordenes) {
            if (o.estado === 'CANCELED') continue;
            let s = porSede.get(o.sedeCodigo);
            if (!s) {
                s = { codigo: o.sedeCodigo, nombre: o.sede, ventas: 0, ordenes: 0, articulos: 0,
                      productos: new Map(), consumo: new Map(), modificadores: new Map(),
                      canales: new Map(),
                      pagos: { tarjeta: 0, efectivo: 0, otros: 0, propinas: 0 } };
                porSede.set(o.sedeCodigo, s);
            }
            s.ventas += (o.bruto ?? o.total);
            s.ordenes += 1;
            const ck = o.canal || 'Mostrador';
            const ca = s.canales.get(ck)
                || { canal: ck, grupo: o.canalGrupo || 'mostrador', ventas: 0, ordenes: 0 };
            ca.ventas += (o.bruto ?? o.total);
            ca.ordenes += 1;
            s.canales.set(ck, ca);
            const pago = e.pagosPorOrden?.get(o.id);
            if (pago) {
                s.pagos.tarjeta  += pago.tarjeta;
                s.pagos.efectivo += pago.efectivo;
                s.pagos.otros    += pago.otros;
                s.pagos.propinas += pago.propinas;
            }
            for (const it of o.items) {
                s.articulos += it.cantidad;
                for (const m of (it.modificadores || [])) {
                    const k = m.nombre.toUpperCase();
                    const acc = s.modificadores.get(k) || { nombre: m.nombre, cantidad: 0 };
                    acc.cantidad += m.cantidad;
                    s.modificadores.set(k, acc);
                }
                if (it.sku) skus.add(it.sku);
                const k = it.sku || it.nombre;
                const p = s.productos.get(k) || { sku: it.sku, nombre: it.nombre, cantidad: 0, total: 0 };
                p.cantidad += it.cantidad;
                p.total += it.total;
                s.productos.set(k, p);
            }
        }

        // Consumo de inventario: se expande cada SKU vendido por su receta.
        // Se lleva por sede (cada centro de costo descarga de su propio
        // inventario) y también consolidado para el resumen general.
        const consumoTotal = new Map();
        if (skus.size) {
            const mapaRec = await componentesDe([...skus]).catch(() => new Map());
            for (const s of porSede.values()) {
                for (const p of s.productos.values()) {
                    for (const c of (mapaRec.get(p.sku) || [])) {
                        const cant = c.cant * p.cantidad;

                        const propio = s.consumo.get(c.articulo)
                            || { codigo: c.articulo, nombre: c.nombre, und: c.und, cantidad: 0 };
                        propio.cantidad += cant;
                        s.consumo.set(c.articulo, propio);

                        const global = consumoTotal.get(c.articulo)
                            || { codigo: c.articulo, nombre: c.nombre, und: c.und, cantidad: 0 };
                        global.cantidad += cant;
                        consumoTotal.set(c.articulo, global);
                    }
                }
            }
        }

        // Adiciones: se aplican con el mismo criterio que el importador del CSV.
        // El signo importa: "NO QUESO" devuelve el insumo en vez de gastarlo.
        const hayMods = [...porSede.values()].some(s => s.modificadores.size);
        if (hayMods) {
            try {
                const mapaMod = await mapaModificadores();
                for (const s of porSede.values()) {
                    for (const m of s.modificadores.values()) {
                        for (const def of (mapaMod.get(m.nombre.toUpperCase()) || [])) {
                            const delta = def.signo * def.cant * m.cantidad;

                            const propio = s.consumo.get(def.articulo)
                                || { codigo: def.articulo, nombre: def.nombre, und: def.und, cantidad: 0 };
                            propio.cantidad += delta;
                            s.consumo.set(def.articulo, propio);

                            const global = consumoTotal.get(def.articulo)
                                || { codigo: def.articulo, nombre: def.nombre, und: def.und, cantidad: 0 };
                            global.cantidad += delta;
                            consumoTotal.set(def.articulo, global);
                        }
                    }
                }
            } catch (err) {
                console.error('[square-vivo] no se pudieron aplicar los modificadores:', err.message);
            }
        }

        // Saldo proyectado: existencias con las que abrió el servicio menos lo
        // que se lleva consumido según las ventas de esta sede.
        const codigosCc = [...porSede.keys()].filter(c => !String(c).startsWith('?'));
        const codigosArt = [...new Set(
            [...porSede.values()].flatMap(s => [...s.consumo.keys()])
        )];
        if (codigosCc.length && codigosArt.length) {
            try {
                const inicial = await inventarioInicial(empresa, codigosCc, codigosArt, e.dia);
                for (const s of porSede.values()) {
                    for (const c of s.consumo.values()) {
                        const ini = inicial.get(`${s.codigo}|${c.codigo}`);
                        c.inicial = ini === undefined ? null : ini;
                        c.saldo = ini === undefined ? null : ini - c.cantidad;
                    }
                }
            } catch (err) {
                console.error('[square-vivo] no se pudo traer el inventario inicial:', err.message);
            }
        }

        // Costo de la materia prima consumida y margen del turno. Es lo que
        // convierte "vendimos $1.850" en "nos quedaron $1.238": el dato que
        // normalmente no se conoce hasta el cierre de mes.
        try {
            const costoDe = await mapaCostos();
            for (const s of porSede.values()) {
                let costoMP = 0;
                let sinCosto = 0;
                for (const c of s.consumo.values()) {
                    const unit = costoDe.get(String(c.codigo).trim());
                    if (unit === undefined || unit <= 0) {
                        // Se cuenta aparte: si faltan costos, el margen que se
                        // muestra estaría inflado y hay que poder advertirlo.
                        if (c.cantidad > 0) sinCosto++;
                        c.costo = null;
                        continue;
                    }
                    c.costoUnit = unit;
                    c.costo = unit * c.cantidad;
                    costoMP += c.costo;
                }
                s.costoMP = costoMP;
                s.margen = s.ventas - costoMP;
                s.pctCosto  = s.ventas > 0 ? (costoMP / s.ventas) * 100 : 0;
                s.pctMargen = s.ventas > 0 ? (s.margen / s.ventas) * 100 : 0;
                s.articulosSinCosto = sinCosto;
            }
        } catch (err) {
            console.error('[square-vivo] no se pudo calcular el costo de materia prima:', err.message);
        }

        // Porcentajes de cada medio de pago. La base es lo efectivamente
        // cobrado (tarjeta+efectivo+otros), no la venta bruta: así siempre
        // suman 100% aunque falte el pago de alguna orden muy reciente.
        for (const s of porSede.values()) {
            const base = s.pagos.tarjeta + s.pagos.efectivo + s.pagos.otros;
            s.pagos.pctTarjeta  = base > 0 ? (s.pagos.tarjeta  / base) * 100 : 0;
            s.pagos.pctEfectivo = base > 0 ? (s.pagos.efectivo / base) * 100 : 0;
            s.pagos.pctOtros    = base > 0 ? (s.pagos.otros    / base) * 100 : 0;
            // La propina se mide contra la venta, no contra lo cobrado: es
            // "cuánto propinaron sobre lo que consumieron".
            s.pagos.pctPropinas = s.ventas > 0 ? (s.pagos.propinas / s.ventas) * 100 : 0;

            const totalCanal = [...s.canales.values()].reduce((a, c) => a + c.ventas, 0);
            for (const c of s.canales.values()) {
                c.pct = totalCanal > 0 ? (c.ventas / totalCanal) * 100 : 0;
            }

            // Ticket promedio: la división más barata del panel y de las más
            // reveladoras — si cae, dejaron de vender adiciones.
            s.ticket = s.ordenes > 0 ? s.ventas / s.ordenes : 0;
        }

        // Ritmo, proyección de cierre y agotamiento estimado
        aplicarRitmo(e, porSede);

        // Comparación contra el mismo día de la semana
        try {
            const prom = await promedioDiaSemana(empresa, e.dia);
            for (const s of porSede.values()) {
                const h = prom.get(String(s.codigo));
                s.promedioDia = h ? h.promedio : null;
                s.muestrasDia = h ? h.muestras : 0;
                // Cuánto del promedio de este día se lleva alcanzado. Es un
                // hecho verificable, no una extrapolación: proyectar el cierre
                // exigiría saber la curva por hora del día, y esa no existe
                // (la tabla `ventas` guarda totales diarios).
                s.pctDelPromedio = (h && h.promedio > 0)
                    ? (s.ventas / h.promedio) * 100
                    : null;
            }
        } catch (err) {
            console.error('[square-vivo] no se pudo traer el promedio del día:', err.message);
        }

        e.sedes = porSede;
        e.consumo = consumoTotal;
    }

    /** Trae del API todas las órdenes del día de operación en curso.
     *  Los webhooks solo avisan de lo que pasa de ahora en adelante y el
     *  estado vive en memoria, así que sin esto se perdería todo lo vendido
     *  antes de abrir la pantalla (o antes del último reinicio del servidor). */
    async function sincronizarDia(empresa, { forzar = false } = {}) {
        if (!configurado()) return false;
        const e = estadoDe(empresa);
        if (e.sincronizando) return false;
        if (!forzar && e.sincronizadoEn && Date.now() - e.sincronizadoEn < 60000) return false;

        e.sincronizando = true;
        try {
            const sedes = await mapaSedes(empresa);
            const locations = [...sedes.keys()];
            if (!locations.length) return false;

            // Ventana amplia en UTC (36 h) y luego se filtra por día de
            // operación: evita hacer aritmética de husos horarios.
            const desde = new Date(Date.now() - 36 * 3600 * 1000).toISOString();
            const dia = e.dia;
            const recogidas = [];
            let cursor = null;

            do {
                const cuerpo = {
                    location_ids: locations,
                    limit: 500,
                    query: {
                        filter: {
                            date_time_filter: { created_at: { start_at: desde } },
                            state_filter: { states: ['OPEN', 'COMPLETED'] },
                        },
                        sort: { sort_field: 'CREATED_AT', sort_order: 'DESC' },
                    },
                };
                if (cursor) cuerpo.cursor = cursor;
                const j = await square('/orders/search', { method: 'POST', body: JSON.stringify(cuerpo) });
                for (const o of (j.orders || [])) {
                    if (diaOperacion(new Date(o.created_at)) === dia) recogidas.push(o);
                }
                cursor = j.cursor || null;
            } while (cursor);

            // Desglose por medio de pago (tarjeta/efectivo/otros/propinas), en
            // la misma ventana ya usada para las órdenes.
            e.pagosPorOrden = await pagosPorOrdenDelDia(locations, desde, dia).catch(() => new Map());

            // Se reconstruye la lista completa del día de una sola vez
            e.ordenes = [];
            for (const orden of recogidas) await agregarOrden(empresa, orden, { recalcular: false });
            await recalcular(empresa);
            e.sincronizadoEn = Date.now();
            console.log(`[square-vivo] sincronizadas ${recogidas.length} órdenes del día ${dia}`);
            return true;
        } catch (err) {
            console.error('[square-vivo] error sincronizando el día:', err.message);
            return false;
        } finally {
            e.sincronizando = false;
        }
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

            // Traer lo que ya se vendió hoy antes de que llegue el primer
            // webhook: si no, la pantalla arrancaría en cero aunque la jornada
            // lleve horas abierta (o el servidor se haya reiniciado).
            sincronizarDia(empresa).then(ok => { if (ok) emitir(empresa); }).catch(() => {});

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
    // Red de seguridad: si Square no entregó algún evento (caída, reintento
    // fallido), cada 5 minutos se reconcilia contra el API mientras haya
    // alguien mirando la pantalla.
    const reloj = setInterval(() => {
        for (const [empresa, lista] of clientes) {
            if (!lista.size) continue;
            sincronizarDia(empresa, { forzar: true })
                .then(ok => { if (ok) emitir(empresa); })
                .catch(() => {});
        }
    }, 300000);
    if (reloj.unref) reloj.unref();

    return { registrar, procesarOrden, sincronizarDia, snapshot, emitir, firmaValida, diaOperacion };
}

module.exports = { crearSquareVivo, firmaValida, diaOperacion, canalDe };
