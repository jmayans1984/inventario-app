// ================================================================
// DESPACHOS DE BODEGA — Scanner · Picking · Packing · Confirmación
// ================================================================

const APP_VERSION = '2.8.0'; // Versión actual de la app
const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api';

// ── Estado global ─────────────────────────────────────────────
let ordenActiva      = null;   // orden completa con detalle[]
let modoEscaneo      = 'packing';   // siempre 'packing' (no hay picking)
let scanBuffer       = '';     // acumula chars del scanner BT
let scanTimeout      = null;   // limpia buffer si el scanner tarda
let barcodeNoEncontrado = null; // barcode pendiente de asociar
let estadoCambiado   = false;  // evita actualizar estado antes del primer scan
let scanEnProceso    = false;  // evita scans concurrentes (FIX 2)
let ultimoBarcode    = null;   // para reintentar (FIX 2)
let itemsOcultos     = new Set(); // productos completados y ocultos (FIX 6)
let mostrandoOcultos = false;  // toggle para ver ocultos (FIX 6)
let barcodeCache     = {};     // cache de barcodes registrados con sus factores
let mostrarCompletadas = false; // mostrar órdenes completadas en lista
let modoVisualizacion  = 'categoria'; // 'ubicacion' | 'categoria'

// ── Buffer/cola de escaneos (evita perder códigos si se escanea rápido) ──
let scanQueue          = [];      // cola de códigos pendientes de procesar
let procesandoCola     = false;   // flag para procesar secuencialmente
const DELAY_ENTRE_SCANS = 600;   // ms entre cada escaneo procesado

// ── LOCAL-FIRST: sincronización en segundo plano ──────────────
// Cada escaneo incrementa localmente al instante y se sincroniza con el
// servidor en lote (debounce). El input NUNCA se bloquea.
let barcodesPrecargados = false;  // ya se cargaron los barcodes en memoria
let pendingDeltas       = {};     // codigo -> delta acumulado sin enviar al server
let sessionSentDeltas   = {};     // deltas confirmados por el server en esta sesión (para cancelar)
let recentlyCompleted   = new Set(); // codigos completados en los últimos POPUP_BLOCK_MS ms
let syncTimer           = null;   // debounce del flush
let syncEnVuelo         = false;  // evita flushes concurrentes
const SYNC_DEBOUNCE      = 500;   // ms de espera antes de enviar el lote
const POPUP_BLOCK_MS     = 1600;  // ms que se ignoran re-escaneos del mismo producto al completar

// ── Init ──────────────────────────────────────────────────────
window.addEventListener('load', () => {
    if (!localStorage.getItem('empresaActual') || !localStorage.getItem('usuario')) {
        window.location.href = 'index.html';
        return;
    }
    // Sin fecha por defecto — muestra solo órdenes activas
    cargarOrdenes();
});

function hoy() {
    return new Date().toISOString().split('T')[0];
}

function getEmpresa() {
    return localStorage.getItem('empresaActual') || '';
}

// FIX 2: fetch con timeout para evitar cuelgues en Railway
function fetchConTimeout(url, opts = {}, ms = 12000) {
    const ctrl = new AbortController();
    const id   = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(id));
}

// ── Navegación entre pantallas ────────────────────────────────
function mostrarScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + id).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ══════════════════════════════════════════════════════════════
// PANTALLA 1 — LISTA DE ÓRDENES
// ══════════════════════════════════════════════════════════════
async function cargarOrdenes() {
    const empresa = getEmpresa();
    document.getElementById('listaOrdenes').innerHTML =
        '<div class="empty-state"><div class="empty-icon">⏳</div><p>Cargando...</p></div>';
    try {
        const res  = await fetchConTimeout(`${API_BASE}/almacen/despachos?empresa=${empresa}`);
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        renderLista(data.data || []);
    } catch (e) {
        console.error('[CARGAR ÓRDENES ERROR]', e);
        const errMsg = e.message || 'Error de conexión';
        document.getElementById('listaOrdenes').innerHTML =
            `<div class="empty-state"><div class="empty-icon">❌</div><p>Error cargando órdenes</p><p style="font-size:12px;color:var(--text-secondary);margin-top:8px">${errMsg}</p></div>`;
    }
}

// Cambiar filtro de órdenes (solo activas / todas)
function filtrarOrdenes(mostrarAll) {
    mostrarCompletadas = mostrarAll;

    // Actualizar estilos de botones
    const btnActivas = document.getElementById('btnOrdenesSoloActivas');
    const btnAll = document.getElementById('btnOrdenesAll');
    if (mostrarAll) {
        btnActivas.style.background = 'transparent';
        btnActivas.style.color = 'var(--text-secondary)';
        btnAll.style.background = 'var(--accent)';
        btnAll.style.color = 'white';
    } else {
        btnActivas.style.background = 'var(--accent)';
        btnActivas.style.color = 'white';
        btnAll.style.background = 'transparent';
        btnAll.style.color = 'var(--text-secondary)';
    }

    // Recargar ordenes
    cargarOrdenes();
}

function renderLista(ordenes) {
    const el = document.getElementById('listaOrdenes');

    // Filtrar según preferencia del usuario
    if (!mostrarCompletadas) {
        // Solo mostrar órdenes activas (excluir completadas y canceladas)
        const ACTIVAS = ['PENDIENTE','EN_PICKING','EN_PACKING'];
        ordenes = ordenes.filter(o => ACTIVAS.includes(o.estado));
    }

    if (!ordenes.length) {
        el.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>No hay órdenes activas</p></div>`;
        return;
    }

    const prioridad = ['EN_PICKING','EN_PACKING','PENDIENTE','COMPLETADO','CANCELADO'];
    ordenes.sort((a,b) => prioridad.indexOf(a.estado) - prioridad.indexOf(b.estado));

    el.innerHTML = ordenes.map(o => `
        <div class="orden-card est-${o.estado}" onclick="abrirOrden(${o.id})">
            <div class="orden-card-header">
                <div>
                    <div class="orden-id">#${o.id} · ${fmtFecha(o.fecha)}</div>
                    <div class="orden-dest">${o.tipo === 'VENTA' ? '🛒' : '🏪'} ${o.destino_nombre || o.cc_destino_nombre || o.cc_destino || o.orden_compra || '—'}</div>
                    <div class="orden-meta">${o.total_items} productos · ${parseFloat(o.total_unidades||0).toFixed(0)} unidades</div>
                </div>
                <span class="estado-badge est-${o.estado}">${estadoLabel(o.estado)}</span>
            </div>
        </div>
    `).join('');
}

// ══════════════════════════════════════════════════════════════
// PANTALLA 2 — DETALLE DE ORDEN
// ══════════════════════════════════════════════════════════════
async function abrirOrden(id) {
    try {
        const res  = await fetchConTimeout(`${API_BASE}/almacen/despachos/${id}?empresa=${getEmpresa()}`);
        const data = await res.json();
        ordenActiva = data.data;
        renderDetalle();
        mostrarScreen('detalle');
    } catch (e) {
        alert('Error cargando la orden');
    }
}

function renderDetalle() {
    const o   = ordenActiva;
    const est = o.estado;
    const algoPicado    = o.detalle.some(i => parseFloat(i.cant_picking) > 0);
    const puedePickear  = est === 'PENDIENTE' || est === 'EN_PICKING';
    const puedePackear  = (est === 'EN_PICKING' && algoPicado) || est === 'EN_PACKING';
    const puedeConfirmar= est === 'EN_PACKING' || (est === 'EN_PICKING' && algoPicado);

    // Agrupar por grupo_nombre, ordenar por grupo_codigo
    const grupos = {};
    o.detalle.forEach(item => {
        const grupoNombre = item.grupo_nombre || 'Sin grupo';
        const grupoCodigo = item.grupo_codigo || '';
        const grupoKey = `${grupoCodigo}|${grupoNombre}`;
        if (!grupos[grupoKey]) grupos[grupoKey] = [];
        grupos[grupoKey].push(item);
    });

    const gruposOrdenados = Object.keys(grupos).sort();

    let filasHtml = '';
    gruposOrdenados.forEach(grupoKey => {
        const [, grupoNombre] = grupoKey.split('|');
        filasHtml += `<tr><td colspan="4" style="padding-top:12px;padding-bottom:6px;font-weight:600;color:var(--text-secondary);font-size:12px;border-bottom:2px solid var(--border-color)">${grupoNombre}</td></tr>`;

        grupos[grupoKey].forEach(item => {
            const req  = parseFloat(item.cant_requerida) || 0;
            const pack = parseFloat(item.cant_packing)   || 0;
            const dif  = pack - req;
            const rowCls = pack === 0 ? '' : dif < 0 ? 'row-falta' : dif > 0 ? 'row-sobre' : 'row-ok';
            const difStr = pack === 0 ? '<span style="color:var(--text-tertiary)">—</span>'
                         : dif === 0 ? '<span class="dif-ok">✓</span>'
                         : dif  < 0  ? `<span class="dif-falta">${dif}</span>`
                                     : `<span class="dif-sobre">+${dif}</span>`;
            filasHtml += `<tr class="${rowCls}">
                <td><div class="prod-nombre">${item.producto_nombre}</div></td>
                <td class="num-cell">${req}</td>
                <td class="num-cell">${pack || '—'}</td>
                <td class="num-cell">${difStr}</td>
            </tr>`;
        });
    });

    const filas = filasHtml;

    document.getElementById('detalleContenido').innerHTML = `
        <button class="btn btn-secondary no-print" onclick="mostrarScreen('lista');cargarOrdenes()" style="margin-bottom:14px">
            ← Volver a la lista
        </button>

        <div class="det-header-band">
            <h2>🚚 Orden #${o.id}</h2>
            <p>${fmtFecha(o.fecha)} · ${o.cc_origen_nombre} → ${o.tipo === 'VENTA' ? (o.destino_nombre || o.orden_compra) : o.cc_destino_nombre}</p>
            <p style="margin-top:6px"><span class="estado-badge est-${est}">${estadoLabel(est)}</span></p>
        </div>

        <div style="overflow-x:auto;margin-bottom:16px">
            <table class="det-table">
                <thead><tr>
                    <th>Producto</th>
                    <th style="text-align:center">Req.</th>
                    <th style="text-align:center">Pack.</th>
                    <th style="text-align:center">Dif.</th>
                </tr></thead>
                <tbody>${filas}</tbody>
            </table>
        </div>

        <div style="margin-bottom:16px">
            <label style="display:block;font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.3px;margin-bottom:8px">📝 Otros</label>
            <textarea id="detalleObservacionesField"
                style="width:100%;padding:12px;border-radius:10px;border:1px solid var(--border-color);background:var(--bg-input);color:var(--text-primary);font-size:14px;font-family:inherit;resize:vertical;min-height:80px;outline:none;box-sizing:border-box"
                placeholder="Agrega notas o comentarios sobre este despacho..."
                onchange="guardarObservacionesDetalle()">${o.observaciones || ''}</textarea>
        </div>

        <button class="btn-accion btn-picking" onclick="iniciarEscaneo('packing')" style="width:100%">
            📦 Iniciar Packing
        </button>

        ${puedeConfirmar ? `
        <button class="btn-accion btn-confirmar" onclick="mostrarConfirmacion()">
            ✅ Confirmar y Despachar
        </button>` : ''}

        ${est === 'COMPLETADO' ? `
        <button class="btn-accion btn-confirmar" onclick="imprimirReporte()">
            🖨️ Imprimir Reporte
        </button>` : ''}
    `;
}

// ══════════════════════════════════════════════════════════════
// PANTALLA 3 — ESCANEO (PICKING O PACKING)
// ══════════════════════════════════════════════════════════════
function iniciarEscaneo(modo) {
    // Mostrar popup para elegir método de visualización
    const overlay = document.getElementById('bsOverlay');
    const panel   = overlay.querySelector('.bs-panel');

    panel.innerHTML = `
      <div style="padding:28px 20px 24px;text-align:center">
        <div style="font-size:2.2rem;margin-bottom:10px">📦</div>
        <div style="font-size:19px;font-weight:800;margin-bottom:6px;color:var(--text-primary)">Iniciar Packing</div>
        <div style="font-size:14px;color:var(--text-secondary);margin-bottom:24px;line-height:1.5">¿Cómo quieres visualizar los productos?</div>

        <button onclick="confirmarIniciarEscaneo('ubicacion')"
          style="width:100%;padding:18px 16px;border-radius:14px;border:none;cursor:pointer;
                 background:#0ea5e9;color:white;font-size:15px;font-weight:700;margin-bottom:12px;
                 display:flex;align-items:center;gap:14px;text-align:left">
          <span style="font-size:26px;flex-shrink:0">📍</span>
          <div>
            <div style="font-size:15px;font-weight:800;letter-spacing:.3px">UBICACIÓN EN ALMACÉN</div>
            <div style="font-size:12px;font-weight:400;opacity:.9;margin-top:2px">Agrupado por posición física en bodega</div>
          </div>
        </button>

        <button onclick="confirmarIniciarEscaneo('categoria')"
          style="width:100%;padding:18px 16px;border-radius:14px;border:none;cursor:pointer;
                 background:#8b5cf6;color:white;font-size:15px;font-weight:700;margin-bottom:20px;
                 display:flex;align-items:center;gap:14px;text-align:left">
          <span style="font-size:26px;flex-shrink:0">📂</span>
          <div>
            <div style="font-size:15px;font-weight:800;letter-spacing:.3px">CATEGORÍA DE PRODUCTOS</div>
            <div style="font-size:12px;font-weight:400;opacity:.9;margin-top:2px">Agrupado por tipo/categoría</div>
          </div>
        </button>

        <button onclick="document.getElementById('bsOverlay').classList.remove('open')"
          style="width:100%;padding:12px;border-radius:14px;border:1px solid rgba(239,68,68,.3);
                 background:rgba(239,68,68,.1);color:#ef4444;font-size:14px;font-weight:600;cursor:pointer">
          Cancelar
        </button>
      </div>
    `;

    overlay.classList.add('open');
}

async function confirmarIniciarEscaneo(modoViz) {
    document.getElementById('bsOverlay').classList.remove('open');
    modoVisualizacion = modoViz;

    modoEscaneo        = 'packing';
    scanBuffer         = '';
    estadoCambiado     = false;
    scanEnProceso      = false;
    itemsOcultos       = new Set();
    mostrandoOcultos   = false;
    pendingDeltas      = {};
    sessionSentDeltas  = {};
    recentlyCompleted  = new Set();
    syncEnVuelo        = false;

    // LOCAL-FIRST: precargar todos los barcodes en memoria (una sola consulta)
    await precargarBarcodes();

    // Cargar productos ya completados en packing desde la BD
    if (ordenActiva && ordenActiva.detalle) {
        ordenActiva.detalle.forEach(item => {
            const req = parseFloat(item.cant_requerida) || 0;
            const pack = parseFloat(item.cant_packing) || 0;
            if (pack > 0 && pack >= req) {
                itemsOcultos.add(item.producto_codigo);
            }
        });
    }

    renderEscaneo();
    mostrarScreen('escaneo');
}

function renderEscaneo() {
    const campo = 'cant_packing';

    document.getElementById('scanHero').innerHTML = `
        <div class="scan-hero-icon">📦</div>
        <div class="scan-hero-info">
            <div class="scan-hero-title">📦 PACKING — Despacho</div>
            <div class="scan-hero-sub">${ordenActiva.destino_nombre || ordenActiva.cc_destino_nombre || ordenActiva.cc_destino || ordenActiva.orden_compra} · #${ordenActiva.id}</div>
        </div>
        <div class="scan-hero-stats">
            <div class="scan-hero-count" id="scanHeroCount">0/0</div>
            <div class="scan-hero-pct" id="scanHeroPct">0%</div>
        </div>
    `;

    const inp = document.getElementById('scannerInput');
    inp.value = '';
    inp.className = 'packing-mode';

    // Ocultar tarjeta de último escaneo al (re)entrar
    const lastCard = document.getElementById('scanLastCard');
    if (lastCard) { lastCard.className = 'scan-last-card'; lastCard.innerHTML = ''; }

    renderScanList(campo);
    actualizarStatsBanner(campo); // pinta contador + barra de progreso iniciales
    setupScannerAutoFocus();

    const obsField = document.getElementById('observacionesField');
    if (obsField) {
        obsField.value = ordenActiva.observaciones || '';
    }
}

function renderScanList(campo) {
    campo = campo || (modoEscaneo === 'packing' ? 'cant_packing' : 'cant_picking');
    const el = document.getElementById('scanList');

    const visibles = mostrandoOcultos
        ? ordenActiva.detalle
        : ordenActiva.detalle.filter(item => !itemsOcultos.has(item.producto_codigo));

    const grupos = {};
    let gruposOrdenados;

    if (modoVisualizacion === 'ubicacion') {
        visibles.forEach(item => {
            const ub = (item.ubicacion || '').trim();
            // Prefijo ~ garantiza que "sin ubicación" quede al final en el sort
            const grupoKey = ub ? ub : '~~~SIN_UBICACION';
            if (!grupos[grupoKey]) grupos[grupoKey] = [];
            grupos[grupoKey].push(item);
        });
        // Dentro de cada grupo, ordenar alfabéticamente por nombre
        gruposOrdenados = Object.keys(grupos).sort();
        gruposOrdenados.forEach(k => grupos[k].sort((a, b) => a.producto_nombre.localeCompare(b.producto_nombre)));
    } else {
        visibles.forEach(item => {
            const grupoNombre = item.grupo_nombre || 'Sin grupo';
            const grupoCodigo = item.grupo_codigo || '';
            const grupoKey = `${grupoCodigo}|${grupoNombre}`;
            if (!grupos[grupoKey]) grupos[grupoKey] = [];
            grupos[grupoKey].push(item);
        });
        gruposOrdenados = Object.keys(grupos).sort();
    }

    const ocCnt = itemsOcultos.size;
    const ocBanner = ocCnt > 0 ? `
        <div class="scan-ocultos-banner" onclick="toggleOcultos()">
            ${mostrandoOcultos ? '🙈' : '👁️'}
            ${ocCnt} producto${ocCnt > 1 ? 's' : ''} completado${ocCnt > 1 ? 's' : ''}
            ${mostrandoOcultos ? '— toca para ocultar' : '— toca para ver'}
        </div>` : '';

    let html = ocBanner;
    gruposOrdenados.forEach(grupoKey => {
        let grupoLabel;
        if (modoVisualizacion === 'ubicacion') {
            grupoLabel = grupoKey === '~~~SIN_UBICACION'
                ? '📦 Sin ubicación específica'
                : `📍 ${grupoKey}`;
        } else {
            const [, grupoNombre] = grupoKey.split('|');
            grupoLabel = grupoNombre;
        }
        html += `<div class="scan-grupo-header">${grupoLabel}</div>`;
        html += grupos[grupoKey].map(item => renderScanItem(item, campo)).join('');
    });

    el.innerHTML = html;
    actualizarStatsBanner(campo); // mantener contador + progreso sincronizados
}

function renderScanStats(campo) {
    const totalAll    = ordenActiva.detalle.length;
    const completados = itemsOcultos.size;
    const enProgreso  = ordenActiva.detalle.filter(i => {
        const esc = parseFloat(i[campo]) || 0;
        const req = parseFloat(i.cant_requerida) || 0;
        return esc > 0 && esc < req && !itemsOcultos.has(i.producto_codigo);
    }).length;
    const pct = totalAll > 0 ? Math.round((completados / totalAll) * 100) : 0;
    return `<div id="scanStatsBanner" class="scan-stats-banner">
        <div>
            <div class="stat-num stat-completados">${completados}/${totalAll}</div>
            <div class="stat-lbl">Completados</div>
        </div>
        <div style="text-align:center">
            <div class="stat-pct-num stat-pct">${pct}%</div>
            <div class="stat-lbl">Avance</div>
        </div>
        <div style="text-align:right">
            <div class="stat-num stat-progreso">${enProgreso}</div>
            <div class="stat-lbl">En progreso</div>
        </div>
    </div>`;
}

function actualizarStatsBanner(campo) {
    const totalAll    = ordenActiva.detalle.length;
    const completados = itemsOcultos.size;
    const pct = totalAll > 0 ? Math.round((completados / totalAll) * 100) : 0;
    const c = document.getElementById('scanHeroCount');
    const p = document.getElementById('scanHeroPct');
    const f = document.getElementById('scanProgressFill');
    if (c) c.textContent = `${completados}/${totalAll}`;
    if (p) p.textContent = `${pct}%`;
    if (f) f.style.width = pct + '%';
}

// Tarjeta grande de confirmación del último producto escaneado/ajustado
function mostrarUltimoEscaneo(item, campo, delta) {
    const card = document.getElementById('scanLastCard');
    if (!card) return;
    const req = parseFloat(item.cant_requerida) || 0;
    const esc = parseFloat(item[campo]) || 0;
    const dif = esc - req;
    let cls, icon, color;
    if (req === 0)      { cls = 'ok';   icon = '✅'; color = '#10b981'; }
    else if (dif < 0)   { cls = 'warn'; icon = '⚠️'; color = '#d97706'; }
    else if (dif === 0) { cls = 'ok';   icon = '✅'; color = '#10b981'; }
    else                { cls = 'over'; icon = '🔴'; color = '#d97706'; }

    const signo = delta > 0 ? `+${delta}` : `${delta}`;
    const meta  = req === 0 ? `Último escaneo · ${signo}`
                : dif  < 0  ? `Último escaneo · ${signo} · faltan ${req - esc}`
                : dif === 0 ? `Último escaneo · ${signo} · ¡Completo!`
                :             `Último escaneo · ${signo} · sobran ${dif}`;

    card.innerHTML = `
        <div class="scan-last-icon">${icon}</div>
        <div class="scan-last-body">
            <div class="scan-last-name">${item.producto_nombre}</div>
            <div class="scan-last-meta">${meta}</div>
        </div>
        <div class="scan-last-count" style="color:${color}">${esc}${req > 0 ? `<small>/${req}</small>` : ''}</div>
    `;
    // Reiniciar animación de aparición en cada escaneo
    card.className = 'scan-last-card';
    void card.offsetWidth;
    card.className = `scan-last-card show ${cls}`;
}

function renderScanItem(item, campo) {
    const req  = parseFloat(item.cant_requerida) || 0;
    const esc  = parseFloat(item[campo]) || 0;
    const dif  = esc - req;
    let cls = '', icon = '', colorBarra = '#e5e7eb', colorContador = 'var(--text-tertiary)';
    if (esc === 0)    { cls = '';           icon = '⬜'; }
    else if (dif < 0) { cls = 'item-falta'; icon = '⚠️'; colorBarra = '#ef4444'; colorContador = '#ef4444'; }
    else if (dif > 0) { cls = 'item-sobre'; icon = '🔴'; colorBarra = '#f59e0b'; colorContador = '#f59e0b'; }
    else              { cls = 'item-ok';    icon = '✅'; colorBarra = '#10b981'; colorContador = '#10b981'; }

    const cod        = item.producto_codigo;
    const pct        = req > 0 ? Math.min(100, Math.round((esc / req) * 100)) : 0;
    const enProgreso = esc > 0 && dif < 0;
    const ocultoCls  = itemsOcultos.has(cod) ? ' item-oculto' : '';

    return `<div class="scan-item ${cls}${ocultoCls}" id="si-${cod}">
        <div class="scan-item-header">
            <div class="scan-item-icon">${icon}</div>
            <div class="scan-item-body" onclick="mostrarEntradaManual('${cod}','${campo}')">
                <div class="scan-item-name">${item.producto_nombre}</div>
            </div>
            <div class="scan-counter">
                <button class="scan-adj-btn" onclick="ajustarCantidad('${cod}','${campo}',-1)">−</button>
                <div class="scan-count-display">
                    <span class="scan-count-val" style="color:${colorContador}">${esc}</span>
                    <span class="scan-count-req">/${req}</span>
                </div>
                <button class="scan-adj-btn scan-adj-plus" onclick="ajustarCantidad('${cod}','${campo}',+1)">+</button>
            </div>
        </div>
        <div class="scan-item-progress">
            <div class="scan-item-progress-bar" style="width:${pct}%;background:${colorBarra}"></div>
        </div>
        ${enProgreso ? `<button class="btn-tap-completar" onclick="tapParaCompletar('${cod}','${campo}')">⚡ Tap para completar — faltan ${req - esc}</button>` : ''}
    </div>`;
}

// FIX 6: toggle mostrar/ocultar completados
function toggleOcultos() {
    mostrandoOcultos = !mostrandoOcultos;
    const campo = modoEscaneo === 'packing' ? 'cant_packing' : 'cant_picking';
    renderScanList(campo);
}

async function guardarObservaciones() {
    const obsField = document.getElementById('observacionesField');
    if (!obsField || !ordenActiva) return;

    const nuevasObs = obsField.value.trim();
    if (nuevasObs === (ordenActiva.observaciones || '')) return;

    try {
        const res = await fetchConTimeout(`${API_BASE}/almacen/despachos/${ordenActiva.id}/observaciones`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                empresa: getEmpresa(),
                observaciones: nuevasObs
            })
        });
        const data = await res.json();
        if (data.success) {
            ordenActiva.observaciones = nuevasObs;
        }
    } catch (e) {
        console.error('Error guardando observaciones:', e);
    }
}

async function guardarObservacionesDetalle() {
    const obsField = document.getElementById('detalleObservacionesField');
    if (!obsField || !ordenActiva) return;

    const nuevasObs = obsField.value.trim();
    if (nuevasObs === (ordenActiva.observaciones || '')) return;

    try {
        const res = await fetchConTimeout(`${API_BASE}/almacen/despachos/${ordenActiva.id}/observaciones`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                empresa: getEmpresa(),
                observaciones: nuevasObs
            })
        });
        const data = await res.json();
        if (data.success) {
            ordenActiva.observaciones = nuevasObs;
        }
    } catch (e) {
        console.error('Error guardando observaciones:', e);
    }
}

// ══════════════════════════════════════════════════════════════
// CAPTURA DEL SCANNER — LOCAL-FIRST (instantáneo, sin bloqueos)
// ══════════════════════════════════════════════════════════════

// Precargar TODOS los barcodes de la empresa en memoria (una sola consulta).
// Así cada escaneo se resuelve localmente al instante, sin esperar a la red.
async function precargarBarcodes() {
    try {
        const res  = await fetchConTimeout(`${API_BASE}/almacen/barcodes-all?empresa=${getEmpresa()}`);
        const data = await res.json();
        barcodeCache = {};
        (data.data || []).forEach(b => {
            barcodeCache[String(b.barcode).trim()] = {
                productoCodigo: b.producto_codigo,
                nombre:         b.nombre,
                factor:         parseFloat(b.factor) || 1
            };
        });
        barcodesPrecargados = true;
    } catch (e) {
        console.error('[PRECARGA BARCODES] Error:', e);
        barcodesPrecargados = false;
    }
    // Además: mapear el código interno de cada producto de la orden (factor 1)
    // para que escanear el código del producto también funcione al instante.
    if (ordenActiva && ordenActiva.detalle) {
        ordenActiva.detalle.forEach(item => {
            const cod = String(item.producto_codigo).trim();
            if (!barcodeCache[cod]) {
                barcodeCache[cod] = { productoCodigo: item.producto_codigo, nombre: item.producto_nombre, factor: 1 };
            }
        });
    }
}

function onScanInput(e) {
    hideFeedback();
}

function onScanKeydown(e) {
    // El scanner envía Enter al final de cada código
    if (e.key === 'Enter') {
        e.preventDefault();
        const inp = document.getElementById('scannerInput');
        const codigo = inp.value.trim();
        inp.value = '';                 // limpiar de inmediato para el siguiente
        if (codigo) registrarScanLocal(codigo);
    }
}

// FIX 3: botón manual de búsqueda — mismo camino local-first
function ejecutarScanManual() {
    const inp    = document.getElementById('scannerInput');
    const codigo = inp.value.trim();
    if (!codigo) { inp.focus(); return; }
    inp.value = '';
    registrarScanLocal(codigo);
}

// Procesa un escaneo de forma LOCAL e INSTANTÁNEA. Nunca bloquea el input.
function registrarScanLocal(barcode) {
    barcode = String(barcode).trim();
    const info = barcodeCache[barcode];

    // Código no reconocido → popup para asociarlo a un producto (preservado)
    if (!info) {
        mostrarAsociadorBarcode(barcode);
        return;
    }

    const codigo = info.productoCodigo;
    const nombre = info.nombre;
    const factor = info.factor || 1;
    const campo  = modoEscaneo === 'packing' ? 'cant_packing' : 'cant_picking';

    // FIX 1: si el producto se acaba de completar (popup visible), ignorar re-escaneos
    if (recentlyCompleted.has(codigo)) return;

    // ¿Está en la orden? Si no, agregarlo localmente
    let item = ordenActiva.detalle.find(d => d.producto_codigo === codigo);
    if (!item) {
        item = { producto_codigo: codigo, producto_nombre: nombre, cant_requerida: 0, cant_picking: 0, cant_packing: 0 };
        ordenActiva.detalle.push(item);
        renderScanList(campo);
    }

    // Si estaba oculto (ya completado), mostrarlo de nuevo para que se vea el cambio
    if (itemsOcultos.has(codigo)) {
        itemsOcultos.delete(codigo);
        renderScanList(campo);
    }

    // INCREMENTO OPTIMISTA INMEDIATO
    item[campo] = (parseFloat(item[campo]) || 0) + factor;
    const nuevo = parseFloat(item[campo]);
    const req   = parseFloat(item.cant_requerida) || 0;

    // Confirmación visual en la tarjeta grande de "último escaneo"
    hideFeedback();
    mostrarUltimoEscaneo(item, campo, factor);
    actualizarFilaScan(item, campo);

    // Si completó exactamente, bloquear re-escaneos del mismo producto durante el popup
    if (req > 0 && nuevo === req) {
        recentlyCompleted.add(codigo);
        setTimeout(() => recentlyCompleted.delete(codigo), POPUP_BLOCK_MS);
        verificarCompletoYOcultar(item, campo);
        mostrarPopupCompletado(item);
    }

    // Acumular delta para sincronizar con el servidor en segundo plano
    pendingDeltas[codigo] = (pendingDeltas[codigo] || 0) + factor;
    programarSync();

    // Cambiar estado de la orden al primer scan (fire-and-forget, una sola vez)
    cambiarEstadoPrimerScan();
}

// Cambia el estado de la orden a EN_PACKING en el primer escaneo (una vez)
function cambiarEstadoPrimerScan() {
    if (estadoCambiado) return;
    estadoCambiado = true;
    const nuevoEst = modoEscaneo === 'picking' ? 'EN_PICKING' : 'EN_PACKING';
    fetchConTimeout(`${API_BASE}/almacen/despachos/${ordenActiva.id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa: getEmpresa(), estado: nuevoEst })
    }).then(() => { ordenActiva.estado = nuevoEst; })
      .catch(() => { estadoCambiado = false; }); // reintentar en el próximo scan
}

// Debounce: agrupa los escaneos rápidos en un solo envío por producto
function programarSync() {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(flushSync, SYNC_DEBOUNCE);
}

// Envía al servidor los deltas acumulados (en lote) y reconcilia con la respuesta
async function flushSync() {
    if (syncEnVuelo) { programarSync(); return; }
    const lote = pendingDeltas;
    pendingDeltas = {};
    const codigos = Object.keys(lote);
    if (codigos.length === 0) return;

    syncEnVuelo = true;
    const campo = modoEscaneo === 'packing' ? 'cant_packing' : 'cant_picking';

    try {
        for (const codigo of codigos) {
            const delta = lote[codigo];
            if (!delta) continue;
            try {
                const res  = await fetchConTimeout(`${API_BASE}/almacen/despachos/${ordenActiva.id}/scan`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ empresa: getEmpresa(), producto_codigo: codigo, tipo: modoEscaneo, delta })
                });
                const data = await res.json();
                if (data.success) {
                    // Reconciliar SOLO si no llegaron más escaneos de este producto
                    const item = ordenActiva.detalle.find(d => d.producto_codigo === codigo);
                    if (item && !pendingDeltas[codigo]) {
                        item[campo] = parseFloat(data.data[campo]) || 0;
                        if (data.data.cant_requerida != null) item.cant_requerida = parseFloat(data.data.cant_requerida) || 0;
                    }
                    // FIX 3: registrar lo confirmado para poder deshacer en cancel
                    sessionSentDeltas[codigo] = (sessionSentDeltas[codigo] || 0) + delta;
                } else {
                    // Falló: devolver el delta a la cola para reintentar
                    pendingDeltas[codigo] = (pendingDeltas[codigo] || 0) + delta;
                }
            } catch (e) {
                console.error('[SYNC] Error con', codigo, e);
                pendingDeltas[codigo] = (pendingDeltas[codigo] || 0) + delta;
            }
        }
    } finally {
        syncEnVuelo = false;
        // Si quedaron deltas pendientes (nuevos scans o reintentos), reprogramar
        if (Object.keys(pendingDeltas).length > 0) programarSync();
    }
}

// Procesar un código con cantidad agrupada (múltiples escaneos del mismo producto)
async function procesarScanAgrupado(barcode, cantidadEscaneos) {
    if (scanEnProceso) return;
    scanEnProceso = true;
    ultimoBarcode = barcode;
    let completado = false;

    try {
        // 1. Lookup del barcode → producto
        const res  = await fetchConTimeout(`${API_BASE}/almacen/barcode-lookup?barcode=${encodeURIComponent(barcode)}&empresa=${getEmpresa()}`);
        const data = await res.json();

        const codigo   = data.found ? data.data.producto_codigo : (barcodeCache[barcode]?.productoCodigo || null);
        const nombre   = data.found ? data.data.nombre : (barcodeCache[barcode]?.nombre || barcode);
        const factor   = data.found ? (parseFloat(data.data.factor) || 1) : (barcodeCache[barcode]?.factor || 1);
        const esCodigo = data.found ? (data.data.barcode_desc === undefined) : true;

        if (!codigo) {
            scanEnProceso = false;
            mostrarAsociadorBarcode(barcode);
            return;
        }

        // 2. ¿Está en esta orden?
        let item = ordenActiva.detalle.find(d => d.producto_codigo === codigo);
        if (!item) {
            item = {
                producto_codigo: codigo,
                producto_nombre: nombre,
                cant_requerida: 0,
                cant_picking: 0,
                cant_packing: 0
            };
            ordenActiva.detalle.push(item);
        }

        // 3. Calcular delta: factor × cantidad de escaneos agrupados
        const delta = factor * cantidadEscaneos;
        const sufijo = cantidadEscaneos > 1 ? ` (×${cantidadEscaneos} escaneos)` : '';

        // 4. Cambiar estado al primer scan real
        if (!estadoCambiado) {
            const nuevoEst = modoEscaneo === 'picking' ? 'EN_PICKING' : 'EN_PACKING';
            try {
                await fetchConTimeout(`${API_BASE}/almacen/despachos/${ordenActiva.id}/estado`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ empresa: getEmpresa(), estado: nuevoEst })
                });
                ordenActiva.estado = nuevoEst;
                estadoCambiado = true;
            } catch(e) { /* continuar */ }
        }

        // 5. Registrar el scan agrupado en backend
        const campo = modoEscaneo === 'packing' ? 'cant_packing' : 'cant_picking';
        const resS  = await fetchConTimeout(`${API_BASE}/almacen/despachos/${ordenActiva.id}/scan`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empresa: getEmpresa(), producto_codigo: codigo, tipo: modoEscaneo, delta })
        });
        const dataS = await resS.json();
        if (dataS.success) {
            item[campo] = parseFloat(dataS.data[campo]) || 0;
            const nuevo = parseFloat(item[campo]);
            const req   = parseFloat(item.cant_requerida);
            const msg   = nuevo < req  ? `⚠️ ${item.producto_nombre}${sufijo} — ${nuevo}/${req} (falta ${req-nuevo})`
                        : nuevo === req ? `✅ ${item.producto_nombre}${sufijo} — ¡Completo! (${nuevo}/${req})`
                        :                 `🔴 ${item.producto_nombre}${sufijo} — Sobrante: ${nuevo}/${req}`;
            showFeedback(nuevo <= req ? (nuevo < req ? 'warn' : 'ok') : 'warn', msg);
            actualizarFilaScan(item, campo);
            if (nuevo === req) {
                completado = true;
                await verificarCompletoYOcultar(item, campo);
            }
        }
    } catch(e) {
        console.error('[SCAN AGRUPADO] Error:', e);
        showFeedback('error', `❌ Error procesando ${barcode}: ${e.message}`);
    } finally {
        scanEnProceso = false;
    }
}

async function procesarScan(barcode) {
    // FIX 2: bloquear scans concurrentes
    if (scanEnProceso) return;
    scanEnProceso = true;
    ultimoBarcode = barcode;
    let completado = false;

    try {
        // 1. Lookup del barcode → producto
        const res  = await fetchConTimeout(`${API_BASE}/almacen/barcode-lookup?barcode=${encodeURIComponent(barcode)}&empresa=${getEmpresa()}`);
        const data = await res.json();

        if (!data.found) {
            console.log('[SCAN] Barcode no encontrado en API. Cache:', barcodeCache[barcode]);
            const cached = barcodeCache[barcode];
            if (cached) {
                console.log('[SCAN] Usando factor de cache:', cached);
                const codigo = cached.productoCodigo;
                const factor = cached.factor;
                const item = ordenActiva.detalle.find(d => d.producto_codigo === codigo);
                if (item) {
                    const campo = modoEscaneo === 'packing' ? 'cant_packing' : 'cant_picking';
                    try {
                        const resS  = await fetchConTimeout(`${API_BASE}/almacen/despachos/${ordenActiva.id}/scan`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ empresa: getEmpresa(), producto_codigo: codigo, tipo: modoEscaneo, delta: factor })
                        });
                        const dataS = await resS.json();
                        if (dataS.success) {
                            item[campo] = parseFloat(dataS.data[campo]) || 0;
                            const nuevo = parseFloat(item[campo]);
                            const req   = parseFloat(item.cant_requerida);
                            const sufijo = factor > 1 ? ` (×${factor})` : '';
                            const msg   = nuevo < req  ? `⚠️ ${item.producto_nombre}${sufijo} — ${nuevo}/${req} (falta ${req-nuevo})`
                                        : nuevo === req ? `✅ ${item.producto_nombre}${sufijo} — ¡Completo! (${nuevo}/${req})`
                                        :                 `🔴 ${item.producto_nombre}${sufijo} — Sobrante: ${nuevo}/${req}`;
                            showFeedback(nuevo <= req ? (nuevo < req ? 'warn' : 'ok') : 'warn', msg);
                            actualizarFilaScan(item, campo);
                            if (nuevo === req) {
                                completado = true;
                                await verificarCompletoYOcultar(item, campo);
                                mostrarPopupCompletado(item, () => { scanEnProceso = false; refocusInput(); });
                                return;
                            }
                        }
                    } catch(e) { /* continuar */ }
                    scanEnProceso = false;
                    refocusInput();
                    return;
                }
            }
            scanEnProceso = false;
            mostrarAsociadorBarcode(barcode);
            return;
        }

        const codigo   = data.data.producto_codigo;
        const nombre   = data.data.nombre;
        const factor   = parseFloat(data.data.factor) || 1;
        // FIX 1: detectar si se encontró por código interno (no por barcode registrado)
        const esCodigo = data.data.barcode_desc === undefined;

        // 2. ¿Está en esta orden?
        let item = ordenActiva.detalle.find(d => d.producto_codigo === codigo);
        if (!item) {
            // Producto no está en la orden, pero existe en el catálogo
            // Agregarlo a la orden
            item = {
                producto_codigo: codigo,
                producto_nombre: nombre,
                cant_requerida: 0,  // No tiene cantidad requerida (es adicional)
                cant_picking: 0,
                cant_packing: 0
            };
            ordenActiva.detalle.push(item);
            showFeedback('ok', `✅ ${nombre} agregado a la orden`);
        }

        // FIX: usar factor registrado en BD sin preguntar
        // Solo mostrar diálogo si: factor=1 Y se escaneó código (no barcode registrado)
        let delta = factor;
        if (factor === 1 && esCodigo) {
            scanEnProceso = false; // liberar mientras espera interacción
            const elegido = await mostrarDialogoFactor(nombre, factor, esCodigo);
            if (elegido === null) { refocusInput(); return; }
            delta = elegido;
            scanEnProceso = true; // retomar
        }

        // 3. Cambiar estado al primer scan real
        if (!estadoCambiado) {
            const nuevoEst = modoEscaneo === 'picking' ? 'EN_PICKING' : 'EN_PACKING';
            try {
                await fetchConTimeout(`${API_BASE}/almacen/despachos/${ordenActiva.id}/estado`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ empresa: getEmpresa(), estado: nuevoEst })
                });
                ordenActiva.estado = nuevoEst;
                estadoCambiado = true;
            } catch(e) { /* continuar igualmente */ }
        }

        // 4. Registrar el scan en backend
        const campo = modoEscaneo === 'packing' ? 'cant_packing' : 'cant_picking';
        const resS  = await fetchConTimeout(`${API_BASE}/almacen/despachos/${ordenActiva.id}/scan`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empresa: getEmpresa(), producto_codigo: codigo, tipo: modoEscaneo, delta })
        });
        const dataS = await resS.json();
        if (!dataS.success) { showFeedback('error', '❌ Error al registrar scan'); return; }

        // 5. Actualizar estado local
        item[campo] = parseFloat(dataS.data[campo]) || 0;
        if (dataS.data.cant_requerida != null) item.cant_requerida = parseFloat(dataS.data.cant_requerida) || 0;

        // 6. Feedback visual
        const nuevo = parseFloat(item[campo]);
        const req   = parseFloat(item.cant_requerida);
        const sufijo = delta > 1 ? ` (×${delta})` : '';
        if (req === 0)         showFeedback('ok',   `✅ ${nombre}${sufijo} — agregado (${nuevo})`);
        else if (nuevo < req)  showFeedback('warn', `⚠️ ${nombre}${sufijo} — ${nuevo}/${req} (falta ${req-nuevo})`);
        else if (nuevo === req) showFeedback('ok',   `✅ ${nombre}${sufijo} — ¡Completo! (${nuevo}/${req})`);
        else                   showFeedback('warn',  `🔴 ${nombre}${sufijo} — Sobrante: ${nuevo}/${req}`);

        // 7. Actualizar solo la fila del producto escaneado
        actualizarFilaScan(item, campo);

        // FIX 6: si completó exactamente, preguntar packing y ocultar
        if (nuevo === req) {
            completado = true;
            await verificarCompletoYOcultar(item, campo);
            mostrarPopupCompletado(item, () => { scanEnProceso = false; refocusInput(); });
            return;
        }

    } catch (e) {
        const esTiempo = e.name === 'AbortError';
        const esRed    = esTiempo || e.name === 'TypeError';
        console.error('[SCAN ERROR]', { name: e.name, message: e.message, barcode: barcode });
        const titulo = esTiempo ? 'Tiempo de espera agotado'
                     : esRed    ? 'Error de conexión'
                     :            'Error: ' + (e.message || e.name);
        showFeedbackHTML('error',
            `❌ ${titulo} &nbsp;` +
            `<button onclick="reintentarScan()" style="padding:4px 10px;border-radius:8px;border:1.5px solid currentColor;background:transparent;color:inherit;font-size:12px;font-weight:700;cursor:pointer;">🔄 Reintentar</button>`
        );
    } finally {
        if (!completado) {
            scanEnProceso = false;
            refocusInput();
        }
    }
}

// FIX 2: reintentar — fuerza el envío de pendientes al servidor
function reintentarScan() {
    hideFeedback();
    programarSync();
}

// ── FIX 4 + 5: ajustar cantidad manualmente ──────────────────
async function ajustarCantidad(codigo, campo, delta) {
    if (scanEnProceso) return;
    scanEnProceso = true;
    let completado = false;
    try {
        const item = ordenActiva.detalle.find(d => d.producto_codigo === codigo);
        if (!item) return;

        // Asegurar que estado se actualice al primer ajuste manual
        if (!estadoCambiado) {
            const nuevoEst = modoEscaneo === 'picking' ? 'EN_PICKING' : 'EN_PACKING';
            try {
                await fetchConTimeout(`${API_BASE}/almacen/despachos/${ordenActiva.id}/estado`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ empresa: getEmpresa(), estado: nuevoEst })
                });
                ordenActiva.estado = nuevoEst;
                estadoCambiado = true;
            } catch(e) { /* continuar */ }
        }

        const tipo = campo === 'cant_packing' ? 'packing' : 'picking';
        const res  = await fetchConTimeout(`${API_BASE}/almacen/despachos/${ordenActiva.id}/scan`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empresa: getEmpresa(), producto_codigo: codigo, tipo, delta })
        });
        const data = await res.json();
        if (!data.success) { showFeedback('error', '❌ Error al ajustar'); return; }

        item[campo] = parseFloat(data.data[campo]) || 0;
        actualizarFilaScan(item, campo);
        // FIX 3: trackear lo confirmado por el server para poder deshacer en cancel
        sessionSentDeltas[codigo] = (sessionSentDeltas[codigo] || 0) + delta;

        const nuevo = parseFloat(item[campo]);
        const req   = parseFloat(item.cant_requerida);
        hideFeedback();
        mostrarUltimoEscaneo(item, campo, delta);

        if (nuevo === req) {
            completado = true;
            await verificarCompletoYOcultar(item, campo);
            mostrarPopupCompletado(item, () => { scanEnProceso = false; refocusInput(); });
            return;
        }
    } catch(e) {
        showFeedback('error', '❌ Error de conexión');
    } finally {
        if (!completado) {
            scanEnProceso = false;
            refocusInput();
        }
    }
}

// Entrada manual: popup modal flotante centrado
function mostrarEntradaManual(codigo, campo) {
    const item = ordenActiva.detalle.find(d => d.producto_codigo === codigo);
    if (!item) return;

    const esc = parseFloat(item[campo]) || 0;
    const req = parseFloat(item.cant_requerida) || 0;
    const popup = document.getElementById('popupEntradaManual');

    // Llenar datos
    document.getElementById('popupEntradaNombre').textContent = item.producto_nombre;
    document.getElementById('popupEntradaEsc').textContent = esc;
    document.getElementById('popupEntradaReq').textContent = req;
    const input = document.getElementById('popupEntradaInput');
    input.value = '';

    // Mostrar popup
    popup.style.display = 'flex';
    setTimeout(() => input.focus(), 100);

    // Botones +/-
    document.getElementById('popupEntradaMenos').onclick = () => {
        input.value = (parseFloat(input.value) || 0) - 1;
        input.focus();
    };
    document.getElementById('popupEntradaMas').onclick = () => {
        input.value = (parseFloat(input.value) || 0) + 1;
        input.focus();
    };

    // Confirmar
    document.getElementById('popupEntradaConfirmar').onclick = async () => {
        const val = parseFloat(input.value);
        if (isNaN(val)) { input.focus(); return; }
        popup.style.display = 'none';
        await ajustarCantidad(codigo, campo, val);
    };

    // Cancelar
    document.getElementById('popupEntradaCancelar').onclick = () => {
        popup.style.display = 'none';
        refocusInput();
    };

    // Tecla Enter
    input.onkeydown = (e) => {
        if (e.key === 'Enter') document.getElementById('popupEntradaConfirmar').click();
    };
}

function ajustarCantidadManual(codigo, campo, delta) {
    const inp = document.getElementById('manualCantInput');
    const v   = parseFloat(inp.value) || 0;
    inp.value = v + delta;
    inp.focus();
}

function cancelarManual() {
    document.getElementById('bsOverlay').classList.remove('open');
    refocusInput();
}

// Popup de confirmación para marcar producto como completo de un tap
function tapParaCompletar(codigo, campo) {
    const item = ordenActiva.detalle.find(d => d.producto_codigo === codigo);
    if (!item) return;

    const req   = parseFloat(item.cant_requerida);
    const esc   = parseFloat(item[campo]) || 0;
    const delta = req - esc;

    const overlay = document.getElementById('bsOverlay');
    const panel   = overlay.querySelector('.bs-panel');

    panel.innerHTML = `
      <div style="padding:28px 20px;text-align:center">
        <div style="font-size:3rem;margin-bottom:12px">⚡</div>
        <div style="font-size:17px;font-weight:800;margin-bottom:10px;line-height:1.3">${item.producto_nombre}</div>
        <div style="font-size:14px;color:var(--text-secondary);margin-bottom:24px;line-height:1.6">
          Escaneado: <strong style="color:#ef4444">${esc}</strong> / Requerido: <strong style="color:#10b981">${req}</strong><br>
          <span style="margin-top:6px;display:block">Se agregarán <strong style="color:var(--text-primary)">${delta}</strong> unidades para completar</span>
        </div>
        <button id="btnConfirmarTapCompletar"
          style="width:100%;padding:16px;border-radius:14px;border:none;cursor:pointer;
                 background:#10b981;color:white;font-size:16px;font-weight:700;margin-bottom:12px">
          ✅ Confirmar — Marcar como completo
        </button>
        <button id="btnCancelarTapCompletar"
          style="width:100%;padding:13px;border-radius:14px;border:1px solid rgba(239,68,68,.3);
                 background:rgba(239,68,68,.1);color:#ef4444;font-size:14px;font-weight:600;cursor:pointer">
          Cancelar
        </button>
      </div>
    `;

    overlay.classList.add('open');
    document.getElementById('btnConfirmarTapCompletar').onclick = async () => {
        overlay.classList.remove('open');
        await ajustarCantidad(codigo, campo, delta);
    };
    document.getElementById('btnCancelarTapCompletar').onclick = () => {
        overlay.classList.remove('open');
        refocusInput();
    };
}

// Auto-refocus del scanner: si el input pierde foco y no hay modal abierto, lo recupera
function setupScannerAutoFocus() {
    const inp = document.getElementById('scannerInput');
    if (!inp || inp._autoFocusSetup) return;
    inp._autoFocusSetup = true;

    const hint = document.getElementById('scannerFocusHint');

    inp.addEventListener('focus', () => {
        if (hint) { hint.textContent = '📡 Scanner activo — listo para escanear'; hint.className = 'scanner-focus-hint activo'; }
    });
    inp.addEventListener('blur', () => {
        if (hint) { hint.textContent = '⚠️ Scanner inactivo — toca aquí para activar'; hint.className = 'scanner-focus-hint inactivo'; }
        const escaneoActivo = document.getElementById('screen-escaneo').classList.contains('active');
        const bsOpen        = document.getElementById('bsOverlay').classList.contains('open');
        const camaraOpen    = document.getElementById('camaraOverlay').classList.contains('activo');
        const popupOpen     = document.getElementById('popupEntradaManual')?.style.display === 'flex';
        if (escaneoActivo && !bsOpen && !camaraOpen && !popupOpen) {
            setTimeout(() => {
                const i       = document.getElementById('scannerInput');
                const aun     = document.getElementById('screen-escaneo').classList.contains('active');
                const bs2     = document.getElementById('bsOverlay').classList.contains('open');
                const cam2    = document.getElementById('camaraOverlay').classList.contains('activo');
                const popup2  = document.getElementById('popupEntradaManual')?.style.display === 'flex';
                if (i && aun && !bs2 && !cam2 && !popup2) i.focus();
            }, 150);
        }
    });
}

// FIX 6: verificar si completó y preguntar packing + ocultar
async function verificarCompletoYOcultar(item, campo) {
    try {
        // Ocultar del listado
        itemsOcultos.add(item.producto_codigo);
        const el = document.getElementById('si-' + item.producto_codigo);
        if (el) el.style.display = 'none';

        // Actualizar banner de ocultos
        const campo2 = modoEscaneo === 'packing' ? 'cant_packing' : 'cant_picking';
        renderScanList(campo2);
    } catch(e) {
        console.error('[VERIFY COMPLETO ERROR]', e);
        scanEnProceso = false;
        refocusInput();
    }
}

function preguntarPacking(item) {
    return new Promise(resolve => {
        const overlay = document.getElementById('bsOverlay');
        const panel   = overlay.querySelector('.bs-panel');

        const cerrar = val => {
            overlay.classList.remove('open');
            resolve(val);
        };

        panel.innerHTML = `
          <div style="padding:24px 16px 24px;text-align:center">
            <div style="font-size:3.5rem;margin-bottom:10px">✅</div>
            <div style="font-size:18px;font-weight:800;margin-bottom:8px;line-height:1.3">${item.producto_nombre}</div>
            <div style="font-size:14px;color:var(--text-secondary);margin-bottom:26px">
              Picking completo — <strong style="color:#10b981">${parseFloat(item.cant_requerida)} unidades</strong><br><br>
              <strong style="color:var(--text-primary);font-size:15px">¿También hacer packing de este producto ahora?</strong>
            </div>
            <button id="btnSiPacking"
              style="width:100%;padding:16px;border-radius:14px;border:none;cursor:pointer;
                     background:#8b5cf6;color:white;font-size:16px;font-weight:700;margin-bottom:12px">
              📦 Sí, también packing
            </button>
            <button id="btnNoPacking"
              style="width:100%;padding:13px;border-radius:14px;border:2px solid var(--border-color);
                     background:transparent;color:var(--text-primary);font-size:14px;font-weight:600;cursor:pointer">
              No, solo picking por ahora
            </button>
          </div>
        `;

        overlay.classList.add('open');
        document.getElementById('btnSiPacking').onclick  = () => cerrar(true);
        document.getElementById('btnNoPacking').onclick  = () => cerrar(false);
    });
}

function actualizarFilaScan(item, campo) {
    try {
        const el = document.getElementById('si-' + item.producto_codigo);
        if (!el) { renderScanList(campo); return; }
        const req  = parseFloat(item.cant_requerida) || 0;
        const esc  = parseFloat(item[campo]) || 0;
        const dif  = esc - req;
        let cls = '', icon = '', colorBarra = '#e5e7eb', colorContador = 'var(--text-tertiary)';
        if (esc === 0)    { cls = '';           icon = '⬜'; }
        else if (dif < 0) { cls = 'item-falta'; icon = '⚠️'; colorBarra = '#ef4444'; colorContador = '#ef4444'; }
        else if (dif > 0) { cls = 'item-sobre'; icon = '🔴'; colorBarra = '#f59e0b'; colorContador = '#f59e0b'; }
        else              { cls = 'item-ok';    icon = '✅'; colorBarra = '#10b981'; colorContador = '#10b981'; }

        const pct        = req > 0 ? Math.min(100, Math.round((esc / req) * 100)) : 0;
        const enProgreso = esc > 0 && dif < 0;

        el.className = `scan-item ${cls}${itemsOcultos.has(item.producto_codigo) ? ' item-oculto' : ''}`;

        const iconEl      = el.querySelector('.scan-item-icon');
        const countVal    = el.querySelector('.scan-count-val');
        const progressBar = el.querySelector('.scan-item-progress-bar');
        if (iconEl)      { iconEl.textContent = icon; }
        if (countVal)    { countVal.textContent = esc; countVal.style.color = colorContador; }
        if (progressBar) { progressBar.style.width = pct + '%'; progressBar.style.background = colorBarra; }

        let tapBtn = el.querySelector('.btn-tap-completar');
        if (enProgreso) {
            if (!tapBtn) {
                tapBtn = document.createElement('button');
                tapBtn.className = 'btn-tap-completar';
                el.appendChild(tapBtn);
            }
            tapBtn.textContent = `⚡ Tap para completar — faltan ${req - esc}`;
            tapBtn.onclick = () => tapParaCompletar(item.producto_codigo, campo);
        } else if (tapBtn) {
            tapBtn.remove();
        }

        actualizarStatsBanner(campo);

        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        el.style.transition = 'box-shadow .15s';
        el.style.boxShadow  = '0 0 0 3px rgba(16,185,129,.5)';
        setTimeout(() => { if (el) el.style.boxShadow = ''; }, 600);
    } catch(e) {
        console.error('[ACTUALIZAR FILA SCAN ERROR]', e);
    }
}

function showFeedback(tipo, msg) {
    const el = document.getElementById('scanFeedback');
    if (!el) return;
    el.textContent = msg;
    el.className   = `scan-feedback ${tipo}`;
    clearTimeout(window._fbTimer);
    window._fbTimer = setTimeout(() => hideFeedback(), 5000);
}

function showFeedbackHTML(tipo, html) {
    const el = document.getElementById('scanFeedback');
    if (!el) return;
    el.innerHTML = html;
    el.className  = `scan-feedback ${tipo}`;
    clearTimeout(window._fbTimer);
    window._fbTimer = setTimeout(() => hideFeedback(), 8000);
}

function hideFeedback() {
    const el = document.getElementById('scanFeedback');
    if (el) el.className = 'scan-feedback';
}

function refocusInput() {
    setTimeout(() => {
        if (document.getElementById('popupEntradaManual')?.style.display === 'flex') return;
        const i = document.getElementById('scannerInput');
        if (i) { i.focus(); i.select(); }
    }, 120);
}

// Asegura que todos los escaneos pendientes lleguen al servidor antes de salir
async function sincronizarPendientesAntesDeSalir() {
    clearTimeout(syncTimer);
    let intentos = 0;
    while ((Object.keys(pendingDeltas).length > 0 || syncEnVuelo) && intentos < 20) {
        if (!syncEnVuelo) await flushSync();
        else await new Promise(r => setTimeout(r, 150));
        intentos++;
    }
}

// Cancelar sesión de escaneo: deshace TODO lo escaneado en esta sesión
async function cancelarEscaneo() {
    clearTimeout(syncTimer);
    // Capturar y limpiar antes de cualquier await para evitar condiciones de carrera
    const toUndo = { ...sessionSentDeltas };
    const stillPending = { ...pendingDeltas };
    pendingDeltas = {};
    sessionSentDeltas = {};
    recentlyCompleted = new Set();

    // Deshacer lo que ya llegó al servidor esta sesión
    const entries = Object.entries(toUndo).filter(([, d]) => d !== 0);
    if (entries.length > 0) {
        await Promise.allSettled(entries.map(([cod, delta]) =>
            fetchConTimeout(`${API_BASE}/almacen/despachos/${ordenActiva.id}/scan`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empresa: getEmpresa(), producto_codigo: cod, tipo: 'packing', delta: -delta })
            })
        ));
    }

    // Los pendingDeltas que no llegaron al server se descartan (no se envían)
    await abrirOrden(ordenActiva.id);
    mostrarScreen('detalle');
}

async function finalizarEscaneo() {
    await sincronizarPendientesAntesDeSalir();
    await abrirOrden(ordenActiva.id);
    mostrarScreen('detalle');
}

async function volverAlDetalle() {
    await sincronizarPendientesAntesDeSalir();
    await abrirOrden(ordenActiva.id);
    mostrarScreen('detalle');
}

// ══════════════════════════════════════════════════════════════
// PANTALLA 4 — CONFIRMACIÓN + IMPRESIÓN
// ══════════════════════════════════════════════════════════════
function mostrarConfirmacion() {
    const o    = ordenActiva;
    const campo= o.estado === 'EN_PACKING' ? 'cant_packing' : 'cant_picking';

    const faltantes = o.detalle.filter(i => {
        const e = parseFloat(i[campo]) || 0;
        return e < parseFloat(i.cant_requerida);
    });
    const sobrantes = o.detalle.filter(i => {
        const e = parseFloat(i[campo]) || 0;
        return e > parseFloat(i.cant_requerida);
    });
    const ok        = o.detalle.filter(i => {
        const e = parseFloat(i[campo]) || 0;
        return e === parseFloat(i.cant_requerida);
    });

    const filaDiff = (items, cls, prefijo) => items.map(i => {
        const e = parseFloat(i[campo]) || 0;
        const r = parseFloat(i.cant_requerida);
        return `<div class="diff-item">
            <div>
                <div class="diff-nombre">${i.producto_nombre}</div>
                <div class="diff-nums">${prefijo}: req ${r} · env ${e}</div>
            </div>
            <span class="${cls}">${e > r ? '+' : ''}${e - r}</span>
        </div>`;
    }).join('');

    document.getElementById('confirmContenido').innerHTML = `
        <button class="btn btn-secondary no-print" onclick="mostrarScreen('detalle')" style="margin-bottom:14px">
            ← Volver al detalle
        </button>

        <div class="det-header-band">
            <h2>✅ Confirmar Despacho</h2>
            <p>#${o.id} · ${o.cc_origen_nombre} → ${o.cc_destino_nombre}</p>
            <p style="margin-top:6px">${fmtFecha(o.fecha)}</p>
        </div>

        ${faltantes.length ? `
        <div class="confirm-section" style="border-color:rgba(239,68,68,.3)">
            <div class="confirm-title" style="color:#ef4444">⚠️ Faltantes (${faltantes.length})</div>
            ${filaDiff(faltantes, 'dif-falta', 'FALTA')}
        </div>` : ''}

        ${sobrantes.length ? `
        <div class="confirm-section" style="border-color:rgba(245,158,11,.3)">
            <div class="confirm-title" style="color:#d97706">🔴 Sobrantes (${sobrantes.length})</div>
            ${filaDiff(sobrantes, 'dif-sobre', 'SOBRA')}
        </div>` : ''}

        ${ok.length ? `
        <div class="confirm-section" style="border-color:rgba(16,185,129,.3)">
            <div class="confirm-title" style="color:#10b981">✅ Sin diferencias (${ok.length})</div>
            ${ok.map(i => `<div class="diff-item"><div class="diff-nombre">${i.producto_nombre}</div><span class="dif-ok">✓</span></div>`).join('')}
        </div>` : ''}

        ${faltantes.length || sobrantes.length ? `
        <div style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.3);border-radius:10px;padding:12px;margin-bottom:14px;font-size:13px;color:#d97706">
            ⚠️ Hay diferencias. El despacho se registrará con las cantidades escaneadas.
        </div>` : ''}

        <button class="btn-accion btn-confirmar" id="btnConfirmarFinal" onclick="confirmarDespacho()">
            🚚 Confirmar y Registrar Despacho
        </button>
        <button class="btn-accion btn-cancelar-confirm no-print" onclick="mostrarScreen('detalle')">
            Cancelar
        </button>
    `;

    mostrarScreen('confirmacion');
}

async function confirmarDespacho() {
    // Mostrar diálogo de confirmación
    const confirm = await mostrarDialogoConfirmacion(
        `¿Registrar despacho #${ordenActiva.id}?`,
        `${ordenActiva.cc_origen_nombre} → ${ordenActiva.cc_destino_nombre}`
    );

    if (!confirm) return; // Usuario canceló

    // Si confirmó, proceder a guardar
    const btn = document.getElementById('btnConfirmarFinal');
    const overlay = document.getElementById('loadingOverlay');

    btn.disabled = true;
    overlay.classList.add('active');
    document.querySelector('.popup-state-loading').classList.remove('hide');
    document.querySelector('.popup-state-success').classList.remove('show');

    try {
        const res  = await fetchConTimeout(`${API_BASE}/almacen/despachos/${ordenActiva.id}/confirmar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empresa: getEmpresa() })
        }, 30000);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Error al confirmar');

        ordenActiva.estado = 'COMPLETADO';
        mostrarExitoPopup();
    } catch (e) {
        btn.disabled = false;
        overlay.classList.remove('active');
        alert('Error: ' + e.message);
    }
}

// Diálogo de confirmación reutilizable
function mostrarDialogoConfirmacion(titulo, mensaje) {
    return new Promise(resolve => {
        const html = `
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;">
                <div style="background: white; border-radius: 12px; padding: 24px; max-width: 300px; box-shadow: 0 20px 25px rgba(0,0,0,0.15); animation: slideUp 0.3s ease-out;">
                    <div style="font-size: 16px; font-weight: 700; margin-bottom: 8px; color: #1f2937;">${titulo}</div>
                    <div style="font-size: 13px; color: #6b7280; margin-bottom: 20px;">${mensaje}</div>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="this.closest('[data-dialog]').remove(); window._dialogResult = false;"
                                style="flex: 1; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; background: white; color: #374151; font-weight: 600; cursor: pointer;">
                            Cancelar
                        </button>
                        <button onclick="this.closest('[data-dialog]').remove(); window._dialogResult = true;"
                                style="flex: 1; padding: 10px; border-radius: 8px; background: #047857; color: white; font-weight: 600; cursor: pointer;">
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
            <style>
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            </style>
        `;

        const div = document.createElement('div');
        div.setAttribute('data-dialog', 'true');
        div.innerHTML = html;
        document.body.appendChild(div);

        // Esperar a que el usuario clickee
        const checkInterval = setInterval(() => {
            if (window._dialogResult !== undefined) {
                clearInterval(checkInterval);
                const result = window._dialogResult;
                window._dialogResult = undefined;
                resolve(result);
            }
        }, 50);
    });
}

function mostrarExitoPopup() {
    document.querySelector('.popup-state-loading').classList.add('hide');
    document.querySelector('.popup-state-success').classList.add('show');

    // Automáticamente volver al listado después de 2 segundos
    setTimeout(() => {
        cerrarPopupExito();
    }, 2000);
}

function cerrarPopupExito() {
    document.getElementById('loadingOverlay').classList.remove('active');
    document.querySelector('.popup-state-loading').classList.remove('hide');
    document.querySelector('.popup-state-success').classList.remove('show');
    // Volver a la pantalla de lista de órdenes de despacho
    cargarOrdenes();
    mostrarScreen('lista');
}

function mostrarReporteExito() {
    const o     = ordenActiva;
    const campo = 'cant_packing';

    const filas = o.detalle.map(i => {
        const e = parseFloat(i[campo]) > 0 ? parseFloat(i[campo])
                : parseFloat(i.cant_picking) > 0 ? parseFloat(i.cant_picking)
                : parseFloat(i.cant_requerida);
        return `<tr>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${i.producto_nombre}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center">${i.und}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700">${e}</td>
        </tr>`;
    }).join('');

    const html = `
        <div id="reporteImprimible" style="padding:16px">
            <div style="text-align:center;margin-bottom:16px">
                <h2 style="font-size:18px;font-weight:800;margin:0">REPORTE DE DESPACHO</h2>
                <p style="font-size:13px;color:#6b7280;margin:4px 0">Orden #${o.id} · ${fmtFecha(o.fecha)}</p>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;font-size:13px">
                <div><strong>Origen:</strong> ${o.cc_origen_nombre}</div>
                <div><strong>Destino:</strong> ${o.cc_destino_nombre}</div>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead>
                    <tr style="background:#f3f4f6">
                        <th style="padding:8px;text-align:left;border-bottom:2px solid #d1d5db">PRODUCTO</th>
                        <th style="padding:8px;text-align:center;border-bottom:2px solid #d1d5db">UND</th>
                        <th style="padding:8px;text-align:center;border-bottom:2px solid #d1d5db">CANTIDAD</th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
            <div style="margin-top:24px;display:grid;grid-template-columns:1fr 1fr;gap:30px;font-size:12px">
                <div style="border-top:1px solid #000;padding-top:8px;text-align:center">Firma Despachador</div>
                <div style="border-top:1px solid #000;padding-top:8px;text-align:center">Firma Receptor</div>
            </div>
        </div>
    `;

    document.getElementById('confirmContenido').innerHTML = `
        <div style="text-align:center;padding:30px 16px">
            <div style="font-size:4rem;margin-bottom:10px">✅</div>
            <h2 style="font-size:20px;font-weight:800;margin:0 0 6px">¡Despacho Confirmado!</h2>
            <p style="color:var(--text-secondary);font-size:14px">Los movimientos de inventario han sido registrados</p>
        </div>
        <button class="btn-accion btn-confirmar" onclick="imprimirReporte()" style="margin-bottom:10px">
            🖨️ Imprimir Reporte
        </button>
        <button class="btn-accion btn-secondary-act" onclick="mostrarScreen('lista');cargarOrdenes()">
            ← Volver a la lista
        </button>
    `;
    document.getElementById('printArea').innerHTML = html;
    mostrarScreen('confirmacion');
}

function imprimirReporte() {
    const o = ordenActiva;
    const color = '#047857';

    const filas = o.detalle.map(i => {
        const e = parseFloat(i.cant_packing) > 0 ? parseFloat(i.cant_packing)
                : parseFloat(i.cant_picking) > 0 ? parseFloat(i.cant_picking)
                : parseFloat(i.cant_requerida);
        return `<tr>
            <td style="padding:3px 5px;border-bottom:1px solid #e5e7eb;font-size:9px">${i.producto_codigo}</td>
            <td style="padding:3px 5px;border-bottom:1px solid #e5e7eb;font-size:9px">${i.producto_nombre}</td>
            <td style="padding:3px 5px;border-bottom:1px solid #e5e7eb;font-size:9px">${i.descripcion || '—'}</td>
            <td style="padding:3px 5px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:9px">${i.und}</td>
            <td style="padding:3px 5px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700;font-size:9px">${e}</td>
        </tr>`;
    }).join('');

    const html = `
        <button class="btn btn-secondary no-print" onclick="volverDelReporte()" style="margin-bottom:14px">
            ← Volver
        </button>
        <button class="btn btn-secondary no-print" onclick="abrirImpresion()" style="margin-bottom:14px;margin-left:8px">
            🖨️ Imprimir
        </button>

        <div style="border-left: 5px solid ${color}; padding: 0 0 0 14px; margin-bottom: 24px">
            <h2 style="font-size:20px;font-weight:800;margin:0 0 6px">REPORTE DE DESPACHO</h2>
            <p style="font-size:12px;color:#555;margin:0">Orden #${o.id} &nbsp;·&nbsp; ${fmtFecha(o.fecha)}</p>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-bottom:20px">
            <div><label style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#6b7280;display:block">CC Origen</label><span style="font-size:13px;font-weight:600;margin-top:2px;display:block">${o.cc_origen_nombre}</span></div>
            <div><label style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#6b7280;display:block">CC Destino</label><span style="font-size:13px;font-weight:600;margin-top:2px;display:block">${o.cc_destino_nombre}</span></div>
            <div><label style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#6b7280;display:block">Otros</label><span style="font-size:13px;font-weight:600;margin-top:2px;display:block">${o.observaciones || '—'}</span></div>
        </div>

        <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse">
                <thead><tr style="background:#f3f4f6">
                    <th style="padding:5px 8px;background:#f3f4f6;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;text-align:left;border-bottom:2px solid #d1d5db;width:90px">CÓDIGO</th>
                    <th style="padding:5px 8px;background:#f3f4f6;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;text-align:left;border-bottom:2px solid #d1d5db">PRODUCTO</th>
                    <th style="padding:5px 8px;background:#f3f4f6;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;text-align:left;border-bottom:2px solid #d1d5db">DESCRIPCIÓN</th>
                    <th style="padding:5px 8px;background:#f3f4f6;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;text-align:center;border-bottom:2px solid #d1d5db;width:55px">UND</th>
                    <th style="padding:5px 8px;background:#f3f4f6;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;text-align:center;border-bottom:2px solid #d1d5db;width:80px">REQUERIDO</th>
                </tr></thead>
                <tbody>${filas}</tbody>
            </table>
        </div>
    `;

    // Mostrar en ambos lados: confirmContenido para ver en pantalla, printArea para imprimir
    document.getElementById('confirmContenido').innerHTML = html;
    document.getElementById('printArea').innerHTML = html;
    document.querySelector('header').style.display = 'none';
    mostrarScreen('confirmacion');
}

function volverDelReporte() {
    document.getElementById('printArea').innerHTML = '';
    document.querySelector('header').style.display = 'block';
    mostrarScreen('lista');
    cargarOrdenes();
}

function abrirImpresion() {
    window.print();
}

// ══════════════════════════════════════════════════════════════
// BOTTOM SHEET — ASOCIAR BARCODE DESCONOCIDO A PRODUCTO
// ══════════════════════════════════════════════════════════════
function mostrarAsociadorBarcode(barcode) {
    barcodeNoEncontrado = barcode;

    const campo = modoEscaneo === 'packing' ? 'cant_packing' : 'cant_picking';

    const botonCargarTodos = `
        <button onclick="cargarTodosLosProductos()" style="width:100%;padding:12px;margin-bottom:12px;
                border-radius:12px;border:none;cursor:pointer;background:#3b82f6;color:white;
                font-size:13px;font-weight:700">
            📦 Cargar todos los productos de bodega
        </button>
    `;

    const productosOrden = ordenActiva.detalle.map(item => {
        const req = parseFloat(item.cant_requerida) || 0;
        const esc = parseFloat(item[campo]) || 0;
        const completo = esc >= req;
        return `
        <div class="bs-item" onclick="seleccionarProductoParaBarcode('${item.producto_codigo}')">
            <div class="bs-item-icon">${completo ? '✅' : '📦'}</div>
            <div>
                <div class="bs-item-name">${item.producto_nombre}</div>
                <div class="bs-item-cod">${item.producto_codigo}</div>
            </div>
            <div class="bs-item-qty">
                <div class="bs-item-qty-val" style="color:${completo?'#10b981':esc>0?'#f59e0b':'var(--text-tertiary)'}">${esc}/${req}</div>
                <div class="bs-item-qty-lbl">escaneado</div>
            </div>
        </div>`;
    }).join('');

    // Reconstruir TODO el panel cada vez. seleccionarProductoParaBarcode()
    // reemplaza el innerHTML del panel (destruye bsBarcode/bsList), así que
    // hay que regenerar la estructura completa o el siguiente scan crashea.
    const overlay = document.getElementById('bsOverlay');
    const panel   = overlay.querySelector('.bs-panel');
    panel.innerHTML = `
        <div class="bs-header">
            <div class="bs-drag"></div>
            <div class="bs-title">📡 Código no reconocido</div>
            <div><span class="bs-barcode" id="bsBarcode">${barcode}</span></div>
            <div class="bs-subtitle">Selecciona el producto para asociar este código de barras</div>
        </div>
        <div class="bs-list" id="bsList">${botonCargarTodos + productosOrden}</div>
        <div class="bs-footer">
            <button class="bs-cancel" onclick="cerrarAsociador()">Cancelar — ignorar este escaneo</button>
        </div>
    `;

    overlay.classList.add('open');
}

async function cargarTodosLosProductos() {
    const lista = document.getElementById('bsList');
    lista.innerHTML = '<div style="padding:20px;text-align:center">⏳ Cargando productos...</div>';

    try {
        const res = await fetch(`${API_BASE}/almacen/productos`, {
            headers: { 'x-empresa': getEmpresa() }
        });
        const data = await res.json();
        let productos = data.data || [];
        // Filtrar solo productos de bodega maestra (control=SI)
        productos = productos.filter(p => p.control === 'SI');

        if (productos.length === 0) {
            lista.innerHTML = '<div style="padding:20px;text-align:center">❌ No hay productos disponibles</div>';
            return;
        }

        // Guardar nombres para usarlos al asociar (evita problemas de comillas en onclick)
        window._catalogoNombres = {};
        productos.forEach(p => { window._catalogoNombres[p.codigo] = p.nombre; });

        const botonVolver = `
            <button onclick="mostrarAsociadorBarcode('${barcodeNoEncontrado}')" style="width:100%;padding:12px;margin-bottom:8px;
                    border-radius:12px;border:1px solid var(--border-color);cursor:pointer;background:transparent;color:var(--text-secondary);
                    font-size:13px;font-weight:700">
                ← Volver a productos de la orden
            </button>
            <input id="bsBuscarProd" type="text" placeholder="🔍 Buscar producto..." autocomplete="off"
                   oninput="filtrarCatalogoProductos()"
                   style="width:100%;padding:12px;margin-bottom:12px;border-radius:12px;border:1px solid var(--border-color);
                          background:var(--bg-input);color:var(--text-primary);font-size:14px;box-sizing:border-box">
        `;

        const productosList = productos.map(prod => `
            <div class="bs-item bs-prod-item" data-nombre="${(prod.nombre||'').toLowerCase()}" data-cod="${prod.codigo}" onclick="seleccionarProductoParaBarcode('${prod.codigo}')">
                <div class="bs-item-icon">📦</div>
                <div>
                    <div class="bs-item-name">${prod.nombre}</div>
                    <div class="bs-item-cod">${prod.codigo}</div>
                </div>
            </div>
        `).join('');

        lista.innerHTML = botonVolver + '<div id="bsProdContainer">' + productosList + '</div>';
    } catch(e) {
        console.error('Error cargarTodosLosProductos:', e);
        lista.innerHTML = '<div style="padding:20px;text-align:center">❌ Error cargando productos: ' + e.message + '</div>';
    }
}

function filtrarCatalogoProductos() {
    const q = (document.getElementById('bsBuscarProd')?.value || '').toLowerCase().trim();
    document.querySelectorAll('.bs-prod-item').forEach(el => {
        const nom = el.getAttribute('data-nombre') || '';
        const cod = (el.getAttribute('data-cod') || '').toLowerCase();
        el.style.display = (!q || nom.includes(q) || cod.includes(q)) ? '' : 'none';
    });
}

async function seleccionarProductoParaBarcode(productoCodigo) {
    const barcode = barcodeNoEncontrado;
    const item    = ordenActiva.detalle.find(d => d.producto_codigo === productoCodigo);
    // Guardar nombre del producto (de la orden o del catálogo) para mostrarlo al agregar
    window._nombreProductoBarcode = item ? item.producto_nombre
                                  : (window._catalogoNombres && window._catalogoNombres[productoCodigo]) || productoCodigo;

    const overlay = document.getElementById('bsOverlay');
    const panel   = overlay.querySelector('.bs-panel');
    panel.innerHTML = `
      <div style="padding:20px 16px 16px">
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px">Código escaneado</div>
        <div style="font-size:15px;font-weight:700;font-family:monospace;margin-bottom:16px">${barcode}</div>
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">
          ¿Cuántas <strong>unidades</strong> representa este código de barras?
        </div>
        <div id="factorPresetsWrap">
          <div style="display:flex;gap:8px;margin-bottom:12px">
            <button onclick="confirmarFactorBarcode('${productoCodigo}','${barcode}',1)"  class="btn-factor" id="bf1">× 1</button>
            <button onclick="confirmarFactorBarcode('${productoCodigo}','${barcode}',6)"  class="btn-factor" id="bf6">× 6</button>
            <button onclick="confirmarFactorBarcode('${productoCodigo}','${barcode}',12)" class="btn-factor" id="bf12">× 12</button>
            <button onclick="confirmarFactorBarcode('${productoCodigo}','${barcode}',24)" class="btn-factor" id="bf24">× 24</button>
          </div>
          <div style="display:flex;gap:8px;margin-bottom:16px">
            <button onclick="confirmarFactorBarcode('${productoCodigo}','${barcode}',40)"  class="btn-factor" id="bf40">× 40</button>
            <button onclick="confirmarFactorBarcode('${productoCodigo}','${barcode}',48)"  class="btn-factor" id="bf48">× 48</button>
            <button onclick="confirmarFactorBarcode('${productoCodigo}','${barcode}',120)" class="btn-factor" id="bf120">× 120</button>
            <button onclick="setFactor(0)" class="btn-factor" id="bf0" style="background:var(--bg-input)">Otro</button>
          </div>
        </div>
        <div id="factorOtroWrap" style="display:none;margin-bottom:12px">
          <div style="background:var(--bg-input);border-radius:14px;padding:18px 20px;
                      text-align:center;margin-bottom:16px;border:2px solid var(--border-color)">
            <div style="font-size:11px;color:var(--text-tertiary);margin-bottom:4px">Otra cantidad</div>
            <div id="factorOtroDisplay" style="font-size:48px;font-weight:900;color:var(--text-primary);
                 min-height:60px;line-height:1">—</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px">
            ${[1,2,3,4,5,6,7,8,9].map(n =>
              `<button onclick="factorOtroDigit(${n})" style="padding:0;height:72px;border-radius:14px;border:1.5px solid var(--border-color);
                      background:var(--bg-card);color:var(--text-primary);font-size:28px;font-weight:700;
                      cursor:pointer;transition:opacity .1s;touch-action:manipulation;user-select:none">${n}</button>`
            ).join('')}
            <button onclick="factorOtroBorrar()" style="padding:0;height:72px;border-radius:14px;border:none;
                    background:#7c3aed;color:white;font-size:28px;font-weight:700;
                    cursor:pointer;touch-action:manipulation;user-select:none">⌫</button>
            <button onclick="factorOtroDigit(0)" style="padding:0;height:72px;border-radius:14px;border:1.5px solid var(--border-color);
                    background:var(--bg-card);color:var(--text-primary);font-size:28px;font-weight:700;
                    cursor:pointer;touch-action:manipulation;user-select:none">0</button>
            <button id="btnFactorOtroOk" onclick="factorOtroConfirmar(); confirmarFactorBarcode('${productoCodigo}', '${barcode}')" disabled style="padding:0;height:72px;border-radius:14px;border:none;
                    background:#047857;color:white;font-size:28px;font-weight:700;opacity:.4;
                    cursor:pointer;touch-action:manipulation;user-select:none">✓</button>
          </div>
        </div>
        <button onclick="cancelarFactorBarcode()"
          style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(239,68,68,.3);cursor:pointer;
                 background:rgba(239,68,68,.1);color:#ef4444;font-size:13px">
          Cancelar
        </button>
      </div>
    `;

    window._factorSeleccionado = 1;
    document.getElementById('bf1').style.background = '#047857';
    document.getElementById('bf1').style.color = 'white';
}

let _factorOtroVal = '';

function setFactor(val) {
    document.querySelectorAll('.btn-factor').forEach(b => {
        b.style.background = 'var(--bg-input)';
        b.style.color = 'var(--text-primary)';
    });
    const otroWrap = document.getElementById('factorOtroWrap');
    if (val === 0) {
        // FIX 2: ocultar botones predefinidos, mostrar solo numpad
        const presetsWrap = document.getElementById('factorPresetsWrap');
        if (presetsWrap) presetsWrap.style.display = 'none';
        otroWrap.style.display = 'block';
        _factorOtroVal = '';
        _actualizarFactorOtroDisplay();
        window._factorSeleccionado = 0;
    } else {
        otroWrap.style.display = 'none';
        window._factorSeleccionado = val;
        const btn = document.getElementById('bf' + val);
        if (btn) { btn.style.background = '#047857'; btn.style.color = 'white'; }
    }
}

function factorOtroDigit(d) {
    if (_factorOtroVal.length >= 4) return;
    _factorOtroVal += String(d);
    _actualizarFactorOtroDisplay();
}

function factorOtroBorrar() {
    _factorOtroVal = _factorOtroVal.slice(0, -1);
    _actualizarFactorOtroDisplay();
}

function _actualizarFactorOtroDisplay() {
    const el = document.getElementById('factorOtroDisplay');
    if (el) el.textContent = _factorOtroVal || '—';
    const btn = document.getElementById('btnFactorOtroOk');
    if (btn) {
        const v = parseInt(_factorOtroVal);
        btn.disabled = !(v >= 1);
        btn.style.opacity = (v >= 1) ? '1' : '0.4';
    }
}

function factorOtroConfirmar() {
    const val = parseInt(_factorOtroVal);
    if (!val || val < 1) return;
    window._factorSeleccionado = val;
    _factorOtroVal = '';
}

async function confirmarFactorBarcode(productoCodigo, barcode, factorDirecto) {
    let factor = (factorDirecto != null) ? factorDirecto : window._factorSeleccionado;
    if (factor === 0) {
        factor = parseInt(_factorOtroVal) || 1;
    }
    if (factor < 1) factor = 1;

    document.getElementById('bsOverlay').classList.remove('open');
    barcodeNoEncontrado = null;

    try {
        await fetchConTimeout(`${API_BASE}/almacen/productos/${productoCodigo}/barcodes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empresa: getEmpresa(), barcode, es_principal: false, factor })
        });
        // 409 = ya existía ese barcode; no es un error fatal
        // Guardar también el nombre para que los escaneos locales posteriores lo muestren
        barcodeCache[String(barcode).trim()] = {
            factor,
            productoCodigo,
            nombre: window._nombreProductoBarcode || productoCodigo
        };
    } catch(e) { /* continuar igualmente */ }

    const campo = modoEscaneo === 'packing' ? 'cant_packing' : 'cant_picking';
    let item    = ordenActiva.detalle.find(d => d.producto_codigo === productoCodigo);
    if (!item) {
        // Producto no estaba en la orden: agregarlo localmente (backend lo acepta vía upsert)
        item = {
            producto_codigo: productoCodigo,
            producto_nombre: window._nombreProductoBarcode || productoCodigo,
            cant_requerida: 0,
            cant_picking: 0,
            cant_packing: 0
        };
        ordenActiva.detalle.push(item);
    }

    if (!estadoCambiado) {
        const nuevoEst = modoEscaneo === 'picking' ? 'EN_PICKING' : 'EN_PACKING';
        try {
            await fetchConTimeout(`${API_BASE}/almacen/despachos/${ordenActiva.id}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empresa: getEmpresa(), estado: nuevoEst })
            });
            ordenActiva.estado = nuevoEst;
            estadoCambiado = true;
        } catch(e) { /* continuar */ }
    }

    try {
        const res  = await fetchConTimeout(`${API_BASE}/almacen/despachos/${ordenActiva.id}/scan`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empresa: getEmpresa(), producto_codigo: productoCodigo, tipo: modoEscaneo, delta: factor })
        });
        const data = await res.json();
        if (!data.success) { showFeedback('error', '❌ Error al registrar scan'); return; }

        item[campo] = parseFloat(data.data[campo]) || 0;
        if (data.data.cant_requerida != null) item.cant_requerida = parseFloat(data.data.cant_requerida) || 0;
        // FIX 3: trackear lo confirmado por el server
        sessionSentDeltas[productoCodigo] = (sessionSentDeltas[productoCodigo] || 0) + factor;
        const nuevo = parseFloat(item[campo]);
        const req   = parseFloat(item.cant_requerida);
        hideFeedback();
        mostrarUltimoEscaneo(item, campo, factor);
        actualizarFilaScan(item, campo);

        if (req > 0 && nuevo === req) {
            recentlyCompleted.add(productoCodigo);
            setTimeout(() => recentlyCompleted.delete(productoCodigo), POPUP_BLOCK_MS);
            await verificarCompletoYOcultar(item, campo);
            mostrarPopupCompletado(item);
            return;
        }
    } catch(e) {
        console.error('[CONFIRMAR FACTOR ERROR]', e);
        const esRed = e.name === 'AbortError' || e.name === 'TypeError';
        showFeedback('error', esRed ? '❌ Error de conexión' : '❌ Error: ' + (e.message || e.name));
    } finally {
        scanEnProceso = false;
        refocusInput();
    }
}

function cancelarFactorBarcode() {
    console.log('[CANCEL] Cancelando factor barcode. scanEnProceso:', scanEnProceso);
    document.getElementById('bsOverlay').classList.remove('open');
    barcodeNoEncontrado = null;
    scanEnProceso = false;
    refocusInput();
}

function cerrarAsociador(e) {
    if (e && e.target !== document.getElementById('bsOverlay')) return;
    console.log('[CLOSE] Cerrando asociador. scanEnProceso:', scanEnProceso);
    document.getElementById('bsOverlay').classList.remove('open');
    barcodeNoEncontrado = null;
    scanEnProceso = false;
    refocusInput();
}

// ══════════════════════════════════════════════════════════════
// DIALOGO FACTOR — ¿Caja completa o cantidad personalizada?
// FIX 1: esCodigo=true cuando se escaneó el código del producto
// ══════════════════════════════════════════════════════════════
// ── Numpad interno — sin dependencia del teclado virtual ─────
let _numpadVal      = '';
let _numpadResolver = null;

function numpadDigit(d) {
    if (_numpadVal.length >= 4) return;
    _numpadVal += String(d);
    _numpadRefresh();
}
function numpadBorrar() {
    _numpadVal = _numpadVal.slice(0, -1);
    _numpadRefresh();
}
function _numpadRefresh() {
    const el = document.getElementById('numpadDisplay');
    if (el) el.textContent = _numpadVal || '—';
    const btn = document.getElementById('btnNumpadOk');
    if (btn) {
        const v = parseInt(_numpadVal);
        btn.disabled = !(v >= 1);
        btn.style.opacity = (v >= 1) ? '1' : '0.4';
    }
}
function numpadConfirmar() {
    const val = parseInt(_numpadVal);
    if (!val || val < 1) return;
    _numpadVal = '';
    document.getElementById('bsOverlay').classList.remove('open');
    const cb = _numpadResolver; _numpadResolver = null;
    if (cb) cb(val);
}
function numpadCancelar() {
    _numpadVal = '';
    _numpadResolver = null;
    document.getElementById('bsOverlay').classList.remove('open');
    refocusInput();
}

function mostrarDialogoFactor(nombre, factor, esCodigo = false) {
    return new Promise(resolve => {
        _numpadVal      = '';
        _numpadResolver = resolve;

        const overlay = document.getElementById('bsOverlay');
        const panel   = overlay.querySelector('.bs-panel');

        // Para factor>1 (caja de unidades), el botón rápido acepta sin numpad
        const btnRapidoHTML = !esCodigo ? `
            <button onclick="(() => { _numpadVal=''; document.getElementById('bsOverlay').classList.remove('open'); const cb=_numpadResolver;_numpadResolver=null;if(cb)cb(${factor}); })()"
              style="width:100%;padding:18px 16px;border-radius:14px;border:none;cursor:pointer;
                     background:#047857;color:white;font-size:20px;font-weight:900;
                     margin-bottom:14px;line-height:1.2;box-shadow:0 4px 14px rgba(4,120,87,.3)">
              ✅ ACEPTAR &nbsp;<span style="font-size:14px;font-weight:600;opacity:.85">· ${factor} unidades</span>
            </button>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
              <div style="flex:1;height:1px;background:var(--border-color)"></div>
              <span style="font-size:11px;color:var(--text-tertiary)">o ingresa otra cantidad</span>
              <div style="flex:1;height:1px;background:var(--border-color)"></div>
            </div>` : '';

        panel.innerHTML = `
          <div style="padding:16px 16px 20px">
            <div style="width:40px;height:4px;background:var(--border-color);border-radius:2px;margin:0 auto 14px"></div>
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);margin-bottom:3px">
              ${esCodigo ? 'Código de producto' : 'Código de caja'}
            </div>
            <div style="font-size:16px;font-weight:800;margin-bottom:14px;line-height:1.3">${nombre}</div>

            ${btnRapidoHTML}

            <!-- Display del numpad -->
            <div style="background:var(--bg-input);border-radius:14px;padding:18px 20px;
                        text-align:center;margin-bottom:16px;border:2px solid var(--border-color)">
              <div style="font-size:11px;color:var(--text-tertiary);margin-bottom:4px">
                ${esCodigo ? 'Cantidad a registrar' : 'Otra cantidad'}
              </div>
              <div id="numpadDisplay" style="font-size:48px;font-weight:900;color:var(--text-primary);
                   min-height:60px;line-height:1">—</div>
            </div>

            <!-- Grid numpad 3×4 -->
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px">
              ${[1,2,3,4,5,6,7,8,9].map(n =>
                `<button onclick="numpadDigit(${n})" style="${_npBtnStyle()}">${n}</button>`
              ).join('')}
              <button onclick="numpadBorrar()" style="${_npBtnStyle('#7c3aed')}">⌫</button>
              <button onclick="numpadDigit(0)"  style="${_npBtnStyle()}">0</button>
              <button id="btnNumpadOk" onclick="numpadConfirmar()" disabled
                style="${_npBtnStyle('#047857')};opacity:.4">✓</button>
            </div>

            <button onclick="numpadCancelar()"
              style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(239,68,68,.3);cursor:pointer;
                     background:rgba(239,68,68,.1);color:#ef4444;font-size:13px">
              Cancelar
            </button>
          </div>
        `;

        overlay.classList.add('open');
    });
}

function _npBtnStyle(bg) {
    const b = bg || 'var(--bg-card)';
    const c = bg ? 'white' : 'var(--text-primary)';
    const bdr = bg ? 'none' : '1.5px solid var(--border-color)';
    return `padding:0;height:72px;border-radius:14px;border:${bdr};
            background:${b};color:${c};font-size:28px;font-weight:700;
            cursor:pointer;transition:opacity .1s;-webkit-tap-highlight-color:transparent;
            touch-action:manipulation;user-select:none`;
}

// ══════════════════════════════════════════════════════════════
// AGREGAR PRODUCTO MANUAL — catálogo completo de Bodega Maestra
// (reemplaza el botón de cámara; permite agregar al despacho un
// producto que no aparece en el listado de la orden)
// ══════════════════════════════════════════════════════════════
let catalogoBodegaMaestra   = null; // cache de productos control=SI
let _manualProductoCodigo   = null;
let _manualCantVal          = '';

async function abrirCatalogoManual() {
    if (scanEnProceso) return;
    const overlay = document.getElementById('bsOverlay');
    const panel   = overlay.querySelector('.bs-panel');
    panel.innerHTML = `
        <div class="bs-header">
            <div class="bs-drag"></div>
            <div class="bs-title">📋 Agregar producto manualmente</div>
            <div class="bs-subtitle">Selecciona un producto de la Bodega Maestra para agregarlo al despacho</div>
        </div>
        <div class="bs-list" id="bsListManual">
            <div style="padding:20px;text-align:center">⏳ Cargando productos...</div>
        </div>
        <div class="bs-footer">
            <button class="bs-cancel" onclick="cerrarCatalogoManual()">Cancelar</button>
        </div>
    `;
    overlay.classList.add('open');
    await cargarCatalogoManual();
}

async function cargarCatalogoManual() {
    const lista = document.getElementById('bsListManual');
    try {
        if (!catalogoBodegaMaestra) {
            const res  = await fetchConTimeout(`${API_BASE}/almacen/productos`, { headers: { 'x-empresa': getEmpresa() } });
            const data = await res.json();
            catalogoBodegaMaestra = (data.data || []).filter(p => p.control === 'SI');
        }
        if (catalogoBodegaMaestra.length === 0) {
            lista.innerHTML = '<div style="padding:20px;text-align:center">❌ No hay productos activos en la Bodega Maestra</div>';
            return;
        }

        window._catalogoManualInfo = {};
        catalogoBodegaMaestra.forEach(p => { window._catalogoManualInfo[p.codigo] = { nombre: p.nombre, und: p.und }; });

        // Agrupar por grupo/categoría de producto
        const grupos = {};
        catalogoBodegaMaestra.forEach(p => {
            const grupoNombre = p.grupo_nombre || 'Sin grupo';
            const grupoCodigo = p.grupo || '';
            const key = `${grupoCodigo}|${grupoNombre}`;
            if (!grupos[key]) grupos[key] = { nombre: grupoNombre, items: [] };
            grupos[key].items.push(p);
        });
        Object.values(grupos).forEach(g => g.items.sort((a, b) => (a.nombre||'').localeCompare(b.nombre||'')));
        const gruposOrdenados = Object.keys(grupos).sort();

        const buscador = `
            <input id="bsBuscarManual" type="text" placeholder="🔍 Buscar producto..." autocomplete="off"
                   oninput="filtrarCatalogoManual()"
                   style="width:100%;padding:12px;margin-bottom:12px;border-radius:12px;border:1px solid var(--border-color);
                          background:var(--bg-input);color:var(--text-primary);font-size:14px;box-sizing:border-box">
        `;
        const items = gruposOrdenados.map(key => {
            const grupo = grupos[key];
            const header = `<div class="scan-grupo-header bs-grupo-header-manual">${grupo.nombre}</div>`;
            const filas = grupo.items.map(p => `
                <div class="bs-item bs-prod-item-manual" data-nombre="${(p.nombre||'').toLowerCase()}" data-cod="${p.codigo}"
                     onclick="seleccionarProductoManual('${p.codigo}')">
                    <div class="bs-item-icon">📦</div>
                    <div>
                        <div class="bs-item-name">${p.nombre}</div>
                        <div class="bs-item-cod">${p.codigo}${p.und ? ' · ' + p.und : ''}</div>
                    </div>
                </div>
            `).join('');
            return header + filas;
        }).join('');
        lista.innerHTML = buscador + `<div id="bsProdContainerManual">${items}</div>`;
    } catch(e) {
        lista.innerHTML = '<div style="padding:20px;text-align:center">❌ Error cargando productos: ' + e.message + '</div>';
    }
}

function filtrarCatalogoManual() {
    const q = (document.getElementById('bsBuscarManual')?.value || '').toLowerCase().trim();
    const contenedor = document.getElementById('bsProdContainerManual');
    if (!contenedor) return;

    // Mostrar/ocultar cada producto según el texto buscado
    contenedor.querySelectorAll('.bs-prod-item-manual').forEach(el => {
        const nom = el.getAttribute('data-nombre') || '';
        const cod = (el.getAttribute('data-cod') || '').toLowerCase();
        el.style.display = (!q || nom.includes(q) || cod.includes(q)) ? '' : 'none';
    });

    // Ocultar encabezados de grupo cuyos productos quedaron todos ocultos
    contenedor.querySelectorAll('.bs-grupo-header-manual').forEach(header => {
        let visibles = 0;
        let sib = header.nextElementSibling;
        while (sib && !sib.classList.contains('bs-grupo-header-manual')) {
            if (sib.style.display !== 'none') visibles++;
            sib = sib.nextElementSibling;
        }
        header.style.display = visibles > 0 ? '' : 'none';
    });
}

function cerrarCatalogoManual() {
    document.getElementById('bsOverlay').classList.remove('open');
    refocusInput();
}

function seleccionarProductoManual(codigo) {
    _manualProductoCodigo = codigo;
    _manualCantVal = '';
    const info = (window._catalogoManualInfo && window._catalogoManualInfo[codigo]) || { nombre: codigo, und: '' };

    const overlay = document.getElementById('bsOverlay');
    const panel   = overlay.querySelector('.bs-panel');
    panel.innerHTML = `
        <div style="padding:20px 16px 16px">
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px">Producto</div>
            <div style="font-size:15px;font-weight:700;margin-bottom:16px">${info.nombre}</div>
            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">¿Cuántas unidades vas a despachar?</div>
            <div style="background:var(--bg-input);border-radius:14px;padding:18px 20px;text-align:center;margin-bottom:16px;border:2px solid var(--border-color)">
                <div id="manualCantDisplay" style="font-size:48px;font-weight:900;color:var(--text-primary);min-height:60px;line-height:1">—</div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px">
                ${[1,2,3,4,5,6,7,8,9].map(n =>
                  `<button onclick="manualCantDigit(${n})" style="padding:0;height:72px;border-radius:14px;border:1.5px solid var(--border-color);
                          background:var(--bg-card);color:var(--text-primary);font-size:28px;font-weight:700;
                          cursor:pointer;touch-action:manipulation;user-select:none">${n}</button>`
                ).join('')}
                <button onclick="manualCantBorrar()" style="padding:0;height:72px;border-radius:14px;border:none;
                        background:#7c3aed;color:white;font-size:28px;font-weight:700;
                        cursor:pointer;touch-action:manipulation;user-select:none">⌫</button>
                <button onclick="manualCantDigit(0)" style="padding:0;height:72px;border-radius:14px;border:1.5px solid var(--border-color);
                        background:var(--bg-card);color:var(--text-primary);font-size:28px;font-weight:700;
                        cursor:pointer;touch-action:manipulation;user-select:none">0</button>
                <button id="btnManualCantOk" onclick="confirmarAgregarManual()" disabled style="padding:0;height:72px;border-radius:14px;border:none;
                        background:#10b981;color:white;font-size:22px;font-weight:800;cursor:pointer;opacity:.4;
                        touch-action:manipulation;user-select:none">✓</button>
            </div>
            <button onclick="abrirCatalogoManual()" style="width:100%;padding:12px;border-radius:12px;border:1px solid var(--border-color);
                    cursor:pointer;background:transparent;color:var(--text-secondary);font-size:13px;font-weight:700">
                ← Volver a la lista
            </button>
        </div>
    `;
}

function manualCantDigit(n) {
    if (_manualCantVal.length >= 6) return;
    _manualCantVal += String(n);
    actualizarManualCantDisplay();
}

function manualCantBorrar() {
    _manualCantVal = _manualCantVal.slice(0, -1);
    actualizarManualCantDisplay();
}

function actualizarManualCantDisplay() {
    const disp = document.getElementById('manualCantDisplay');
    const btn  = document.getElementById('btnManualCantOk');
    if (disp) disp.textContent = _manualCantVal === '' ? '—' : _manualCantVal;
    const val = parseInt(_manualCantVal) || 0;
    if (btn) { btn.disabled = val <= 0; btn.style.opacity = val > 0 ? '1' : '.4'; }
}

async function confirmarAgregarManual() {
    const cantidad = parseInt(_manualCantVal) || 0;
    if (cantidad <= 0 || !_manualProductoCodigo) return;
    const codigo = _manualProductoCodigo;
    const info   = (window._catalogoManualInfo && window._catalogoManualInfo[codigo]) || { nombre: codigo, und: '' };

    document.getElementById('bsOverlay').classList.remove('open');

    if (!estadoCambiado) {
        const nuevoEst = modoEscaneo === 'picking' ? 'EN_PICKING' : 'EN_PACKING';
        try {
            await fetchConTimeout(`${API_BASE}/almacen/despachos/${ordenActiva.id}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empresa: getEmpresa(), estado: nuevoEst })
            });
            ordenActiva.estado = nuevoEst;
            estadoCambiado = true;
        } catch(e) { /* continuar */ }
    }

    const campo = modoEscaneo === 'packing' ? 'cant_packing' : 'cant_picking';
    let item = ordenActiva.detalle.find(d => d.producto_codigo === codigo);
    if (!item) {
        item = {
            producto_codigo: codigo,
            producto_nombre: info.nombre,
            und: info.und || '',
            cant_requerida: 0,
            cant_picking: 0,
            cant_packing: 0
        };
        ordenActiva.detalle.push(item);
    }

    try {
        const res  = await fetchConTimeout(`${API_BASE}/almacen/despachos/${ordenActiva.id}/scan`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empresa: getEmpresa(), producto_codigo: codigo, tipo: modoEscaneo, delta: cantidad })
        });
        const data = await res.json();
        if (!data.success) { showFeedback('error', '❌ Error al agregar producto'); return; }

        item[campo] = parseFloat(data.data[campo]) || 0;
        if (data.data.cant_requerida != null) item.cant_requerida = parseFloat(data.data.cant_requerida) || 0;
        sessionSentDeltas[codigo] = (sessionSentDeltas[codigo] || 0) + cantidad;

        hideFeedback();
        mostrarUltimoEscaneo(item, campo, cantidad);
        actualizarFilaScan(item, campo);

        const nuevo = parseFloat(item[campo]);
        const req   = parseFloat(item.cant_requerida);
        if (req > 0 && nuevo === req) {
            await verificarCompletoYOcultar(item, campo);
            mostrarPopupCompletado(item);
        }
    } catch(e) {
        showFeedback('error', '❌ Error de conexión');
    } finally {
        refocusInput();
    }
}

// ══════════════════════════════════════════════════════════════
// CÁMARA — Escáner de barcode con cámara del celular
// ══════════════════════════════════════════════════════════════
let codeReader = null;

async function abrirCamara() {
    const overlay = document.getElementById('camaraOverlay');
    overlay.classList.add('activo');

    try {
        codeReader = new ZXing.BrowserMultiFormatReader();
        const video = document.getElementById('camaraVideo');

        await codeReader.decodeFromConstraints(
            { video: { facingMode: 'environment' } },
            video,
            (result, err) => {
                if (result) {
                    const codigo = result.getText();
                    cerrarCamara();
                    registrarScanLocal(codigo);
                }
            }
        );
    } catch (e) {
        cerrarCamara();
        const msg = e.name === 'NotAllowedError'
            ? 'Permiso de cámara denegado. Actívalo en la configuración del navegador.'
            : 'No se pudo acceder a la cámara: ' + e.message;
        alert(msg);
    }
}

function cerrarCamara() {
    if (codeReader) {
        codeReader.reset();
        codeReader = null;
    }
    document.getElementById('camaraOverlay').classList.remove('activo');
    refocusInput();
}

// ── Helpers ───────────────────────────────────────────────────
function fmtFecha(f) {
    if (!f) return '—';
    const d = new Date(String(f).substring(0, 10) + 'T12:00:00');
    return d.toLocaleDateString('es', { day:'2-digit', month:'short', year:'numeric' });
}

function estadoLabel(e) {
    return { PENDIENTE:'Pendiente', EN_PICKING:'En Picking', EN_PACKING:'En Packing',
             COMPLETADO:'Completado', CANCELADO:'Cancelado' }[e] || e;
}

// ══════════════════════════════════════════════════════════════
// ANÁLISIS DE FALTANTES
// ══════════════════════════════════════════════════════════════
async function abrirAnalisisFaltantes() {
    const overlay = document.getElementById('analisisFaltantesOverlay');
    overlay.style.display = 'flex';

    const content = document.getElementById('analisisContenido');
    content.innerHTML = '<div style="text-align:center;padding:40px"><div class="loading-spinner" style="margin:0 auto 16px;border-top-color:#3b82f6"></div><p style="color:var(--text-secondary);font-size:14px">Analizando despachos pendientes...</p></div>';

    try {
        const empresa = getEmpresa();

        const [resDespachos, resCcostos] = await Promise.all([
            fetchConTimeout(`${API_BASE}/almacen/despachos?empresa=${empresa}&estado=PENDIENTE&include_detalle=1`),
            fetchConTimeout(`${API_BASE}/ccostos?empresa=${empresa}`)
        ]);
        const dataDespachos = await resDespachos.json();
        const dataCcostos   = await resCcostos.json();

        const despachosPendientes = dataDespachos.data || [];

        if (despachosPendientes.length === 0) {
            content.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div><p>No hay despachos pendientes</p></div>';
            return;
        }

        // cc_origen = bodega maestra (primer CC de la lista o del primer despacho)
        const ccostos = dataCcostos.data || dataCcostos.ccostos || [];
        const ccOrigen = despachosPendientes[0].cc_origen || ccostos[0]?.codigo;

        const resStock = await fetchConTimeout(`${API_BASE}/almacen/ajuste-inventario/stock?empresa=${empresa}&ccosto=${ccOrigen}`);
        const dataStock = await resStock.json();

        const stockBodega = {};
        for (const r of (dataStock.data || [])) {
            stockBodega[r.codigo] = parseFloat(r.stock_actual) || 0;
        }

        // Agrupar requerido por producto
        const requeridoPorCodigo = {};
        const productoInfo = {};
        for (const despacho of despachosPendientes) {
            for (const item of despacho.detalle || []) {
                const cod = item.producto_codigo;
                requeridoPorCodigo[cod] = (requeridoPorCodigo[cod] || 0) + parseFloat(item.cant_requerida || 0);
                if (!productoInfo[cod]) {
                    productoInfo[cod] = {
                        codigo: cod,
                        nombre: item.producto_nombre,
                        und: item.und || '—',
                        grupo_nombre: item.grupo_nombre || 'Sin Grupo',
                    };
                }
            }
        }

        const analisis = Object.keys(requeridoPorCodigo).map(cod => {
            const requerido  = requeridoPorCodigo[cod];
            const disponible = stockBodega[cod] || 0;
            const faltante   = Math.max(0, requerido - disponible);
            return { ...productoInfo[cod], requerido, disponible, faltante, ok: faltante === 0 };
        }).sort((a, b) => {
            if (a.ok !== b.ok) return a.ok ? 1 : -1;
            return b.faltante - a.faltante;
        });

        // Guardar para imprimir
        window._analisisFaltantesData = analisis;

        const conFaltante   = analisis.filter(a => !a.ok).length;
        const cumplibles    = analisis.filter(a => a.ok).length;
        const totalFaltante = analisis.reduce((s, a) => s + a.faltante, 0);

        const filas = analisis.map(item => `
            <tr style="${item.ok ? 'background:rgba(16,185,129,.04)' : 'background:rgba(239,68,68,.04)'}">
                <td style="padding:10px 8px;font-family:monospace;font-size:11px;color:#6366f1;white-space:nowrap">${item.codigo}</td>
                <td style="padding:10px 8px">
                    <div style="font-weight:600;font-size:13px">${item.nombre}</div>
                    <div style="font-size:11px;color:var(--text-tertiary)">${item.grupo_nombre}</div>
                </td>
                <td style="padding:10px 8px;text-align:center;font-size:10px;font-weight:700;color:#3b82f6">${item.und}</td>
                <td style="padding:10px 8px;text-align:center;font-weight:700;font-size:13px">${item.requerido.toFixed(0)}</td>
                <td style="padding:10px 8px;text-align:center;font-weight:600;font-size:13px;color:${item.disponible > 0 ? '#10b981' : 'var(--text-tertiary)'}">${item.disponible.toFixed(0)}</td>
                <td style="padding:10px 8px;text-align:center">
                    ${item.faltante > 0
                        ? `<span style="font-weight:800;color:#ef4444;font-size:13px">${item.faltante.toFixed(0)}</span>`
                        : `<span style="color:#10b981;font-weight:700;font-size:16px">✓</span>`}
                </td>
                <td style="padding:10px 8px;text-align:center">
                    <span style="font-size:11px;padding:3px 8px;border-radius:12px;font-weight:700;${item.ok ? 'background:rgba(16,185,129,.15);color:#10b981' : 'background:rgba(239,68,68,.15);color:#ef4444'}">
                        ${item.ok ? 'OK' : 'FALTA'}
                    </span>
                </td>
            </tr>
        `).join('');

        content.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px">
                <div style="background:var(--bg-card);border-radius:10px;padding:14px;border-left:3px solid #ef4444">
                    <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-tertiary)">Con Faltante</div>
                    <div style="font-size:26px;font-weight:800;color:#ef4444;margin-top:4px">${conFaltante}</div>
                </div>
                <div style="background:var(--bg-card);border-radius:10px;padding:14px;border-left:3px solid #10b981">
                    <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-tertiary)">Cumplibles</div>
                    <div style="font-size:26px;font-weight:800;color:#10b981;margin-top:4px">${cumplibles}</div>
                </div>
                <div style="background:var(--bg-card);border-radius:10px;padding:14px;border-left:3px solid #f59e0b">
                    <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-tertiary)">Uds. Faltantes</div>
                    <div style="font-size:26px;font-weight:800;color:#f59e0b;margin-top:4px">${totalFaltante.toFixed(0)}</div>
                </div>
            </div>
            <div style="overflow-x:auto;border-radius:12px;border:1px solid var(--border-color)">
                <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:560px">
                    <thead>
                        <tr style="background:var(--bg-card)">
                            <th style="padding:10px 8px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);border-bottom:1px solid var(--border-color)">CÓDIGO</th>
                            <th style="padding:10px 8px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);border-bottom:1px solid var(--border-color)">PRODUCTO</th>
                            <th style="padding:10px 8px;text-align:center;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);border-bottom:1px solid var(--border-color)">UND</th>
                            <th style="padding:10px 8px;text-align:center;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);border-bottom:1px solid var(--border-color)">REQUERIDO</th>
                            <th style="padding:10px 8px;text-align:center;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);border-bottom:1px solid var(--border-color)">DISPONIBLE</th>
                            <th style="padding:10px 8px;text-align:center;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);border-bottom:1px solid var(--border-color)">FALTANTE</th>
                            <th style="padding:10px 8px;text-align:center;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-secondary);border-bottom:1px solid var(--border-color)">ESTADO</th>
                        </tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>
        `;
    } catch (e) {
        console.error('[ANÁLISIS FALTANTES]', e);
        content.innerHTML = '<div class="empty-state"><div class="empty-icon">❌</div><p>Error cargando análisis</p><p style="font-size:12px;color:var(--text-secondary);margin-top:8px">' + e.message + '</p></div>';
    }
}

function cerrarAnalisisFaltantes() {
    document.getElementById('analisisFaltantesOverlay').style.display = 'none';
}

function imprimirFaltantes() {
    const analisis = window._analisisFaltantesData;
    if (!analisis) return;

    const faltantesFilt = analisis.filter(a => a.faltante > 0);
    if (faltantesFilt.length === 0) {
        alert('No hay productos con faltante para imprimir');
        return;
    }

    // Agrupar por grupo_nombre
    const gruposMap = new Map();
    for (const item of faltantesFilt) {
        const key = item.grupo_nombre || 'Sin Grupo';
        if (!gruposMap.has(key)) gruposMap.set(key, []);
        gruposMap.get(key).push(item);
    }

    let filas = '';
    for (const [, items] of gruposMap) {
        filas += `<tr>
            <td colspan="5" style="padding:3px 8px;background:#f3f0ff;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#7c3aed;border-bottom:1px solid #e5e7eb">
                ${items[0].grupo_nombre || 'Sin Grupo'}
            </td>
        </tr>`;
        for (const item of items) {
            filas += `<tr>
                <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:10px">${item.codigo}</td>
                <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;font-weight:600;font-size:10px">${item.nombre}</td>
                <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:10px">${item.und}</td>
                <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700;font-size:10px">${item.faltante.toFixed(0)}</td>
                <td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;text-align:center;color:#dc2626;font-weight:700;font-size:10px">FALTA</td>
            </tr>`;
        }
    }

    const totalFaltante = faltantesFilt.reduce((s, a) => s + a.faltante, 0).toFixed(0);
    const ventana = window.open('', '_blank');
    ventana.document.write(`<!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <title>Reporte Faltantes</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 30px; }
        .encabezado { border-left: 5px solid #3b82f6; padding: 0 0 0 14px; margin-bottom: 24px; }
        .encabezado h1 { font-size: 20px; font-weight: 800; }
        .encabezado p  { font-size: 12px; color: #555; margin-top: 3px; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; background: #3b82f622; color: #3b82f6; }
        .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 20px; }
        .meta-item label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #6b7280; display: block; }
        .meta-item span  { font-size: 13px; font-weight: 600; margin-top: 2px; display: block; }
        table { width: 100%; border-collapse: collapse; }
        thead th { padding: 5px 8px; background: #f3f4f6; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; text-align: left; border-bottom: 2px solid #d1d5db; }
        tbody td { padding: 5px 8px; }
        @media print { body { padding: 15px; } }
    </style>
    </head><body>
    <div class="encabezado">
        <h1>REPORTE DE FALTANTES</h1>
        <p>Productos necesarios para cumplir despachos pendientes &nbsp;·&nbsp; <span class="badge">Análisis</span></p>
    </div>
    <div class="meta-grid">
        <div class="meta-item"><label>Productos Faltantes</label><span>${faltantesFilt.length}</span></div>
        <div class="meta-item"><label>Unidades Faltantes</label><span>${totalFaltante}</span></div>
    </div>
    <table>
        <thead><tr>
            <th style="width:90px">CÓDIGO</th>
            <th>PRODUCTO</th>
            <th style="width:55px;text-align:center">UND</th>
            <th style="width:80px;text-align:center">FALTANTE</th>
            <th style="width:70px;text-align:center">ESTADO</th>
        </tr></thead>
        <tbody>${filas}</tbody>
    </table>
    <script>window.onload=()=>{window.print();}<\/script>
    </body></html>`);
    ventana.document.close();
}

function mostrarPopupCompletado(item, onClose) {
    const popup = document.getElementById('popupPedidoCompletado');
    if (!popup) { if (onClose) onClose(); return; }
    const sub = document.getElementById('popupCompletadoSub');
    if (sub) {
        if (item) {
            const req = parseFloat(item.cant_requerida) || 0;
            sub.textContent = `${item.producto_nombre} · ${req}/${req}`;
        } else {
            sub.textContent = '';
        }
    }
    popup.classList.add('mostrar');
    clearTimeout(window._popCompTimer);
    window._popCompTimer = setTimeout(() => {
        popup.classList.remove('mostrar');
        if (onClose) onClose();
    }, 1600);
}
