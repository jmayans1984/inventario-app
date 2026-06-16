// ================================================================
// DESPACHOS DE BODEGA — Scanner · Picking · Packing · Confirmación
// ================================================================

const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api';

// ── Estado global ─────────────────────────────────────────────
let ordenActiva  = null;   // orden completa con detalle[]
let modoEscaneo  = null;   // 'picking' | 'packing'
let scanBuffer   = '';     // acumula chars del scanner BT
let scanTimeout  = null;   // limpia buffer si el scanner tarda

// ── Init ──────────────────────────────────────────────────────
window.addEventListener('load', () => {
    if (!localStorage.getItem('empresaActual') || !localStorage.getItem('usuario')) {
        window.location.href = 'index.html';
        return;
    }
    document.getElementById('filtrFecha').value = hoy();
    cargarOrdenes();
});

function hoy() {
    return new Date().toISOString().split('T')[0];
}

function getEmpresa() {
    return localStorage.getItem('empresaActual') || '';
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
    const fecha   = document.getElementById('filtrFecha').value;
    const empresa = getEmpresa();
    document.getElementById('listaOrdenes').innerHTML =
        '<div class="empty-state"><div class="empty-icon">⏳</div><p>Cargando...</p></div>';
    try {
        const params = `empresa=${empresa}${fecha ? '&fecha=' + fecha : ''}`;
        const res  = await fetch(`${API_BASE}/almacen/despachos?${params}`);
        const data = await res.json();
        renderLista(data.data || []);
    } catch (e) {
        document.getElementById('listaOrdenes').innerHTML =
            '<div class="empty-state"><div class="empty-icon">❌</div><p>Error cargando órdenes</p></div>';
    }
}

function renderLista(ordenes) {
    const el = document.getElementById('listaOrdenes');
    if (!ordenes.length) {
        el.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>No hay órdenes para esta fecha</p></div>';
        return;
    }

    // Separar por estado para mostrar primero las activas
    const prioridad = ['EN_PICKING','EN_PACKING','PENDIENTE','COMPLETADO','CANCELADO'];
    ordenes.sort((a,b) => prioridad.indexOf(a.estado) - prioridad.indexOf(b.estado));

    el.innerHTML = ordenes.map(o => `
        <div class="orden-card est-${o.estado}" onclick="abrirOrden(${o.id})">
            <div class="orden-card-header">
                <div>
                    <div class="orden-id">#${o.id} · ${fmtFecha(o.fecha)}</div>
                    <div class="orden-dest">🏪 ${o.cc_destino_nombre || o.cc_destino}</div>
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
        const res  = await fetch(`${API_BASE}/almacen/despachos/${id}?empresa=${getEmpresa()}`);
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
    const puedePickear  = est === 'PENDIENTE' || est === 'EN_PICKING';
    const puedePackear  = est === 'EN_PICKING' || est === 'EN_PACKING';
    const puedeConfirmar= est === 'EN_PACKING' || est === 'EN_PICKING';

    const filas = o.detalle.map(item => {
        const req  = parseFloat(item.cant_requerida) || 0;
        const pick = parseFloat(item.cant_picking)   || 0;
        const pack = parseFloat(item.cant_packing)   || 0;
        const base = pack > 0 ? pack : pick;
        const dif  = base - req;
        const rowCls = base === 0 ? '' : dif < 0 ? 'row-falta' : dif > 0 ? 'row-sobre' : 'row-ok';
        const difStr = base === 0 ? '<span style="color:var(--text-tertiary)">—</span>'
                     : dif === 0 ? '<span class="dif-ok">✓</span>'
                     : dif  < 0  ? `<span class="dif-falta">${dif}</span>`
                                 : `<span class="dif-sobre">+${dif}</span>`;
        return `<tr class="${rowCls}">
            <td><div class="prod-nombre">${item.producto_nombre}</div><div class="prod-cod">${item.producto_codigo}</div></td>
            <td class="num-cell">${req}</td>
            <td class="num-cell">${pick || '—'}</td>
            <td class="num-cell">${pack || '—'}</td>
            <td class="num-cell">${difStr}</td>
        </tr>`;
    }).join('');

    document.getElementById('detalleContenido').innerHTML = `
        <button class="btn btn-secondary no-print" onclick="mostrarScreen('lista');cargarOrdenes()" style="margin-bottom:14px">
            ← Volver a la lista
        </button>

        <div class="det-header-band">
            <h2>🚚 Orden #${o.id}</h2>
            <p>${fmtFecha(o.fecha)} · ${o.cc_origen_nombre} → ${o.cc_destino_nombre}</p>
            <p style="margin-top:6px"><span class="estado-badge est-${est}">${estadoLabel(est)}</span></p>
        </div>

        ${o.observaciones ? `<div style="background:var(--bg-card);border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:13px;color:var(--text-secondary);border:1px solid var(--border-color)">📝 ${o.observaciones}</div>` : ''}

        <div style="overflow-x:auto;margin-bottom:16px">
            <table class="det-table">
                <thead><tr>
                    <th>Producto</th>
                    <th style="text-align:center">Req.</th>
                    <th style="text-align:center">Pick.</th>
                    <th style="text-align:center">Pack.</th>
                    <th style="text-align:center">Dif.</th>
                </tr></thead>
                <tbody>${filas}</tbody>
            </table>
        </div>

        <!-- Botones de acción según estado -->
        ${puedePickear ? `
        <button class="btn-accion btn-picking" onclick="iniciarEscaneo('picking')">
            📦 ${est === 'EN_PICKING' ? 'Continuar Picking' : 'Iniciar Picking'}
        </button>` : ''}

        ${puedePackear ? `
        <button class="btn-accion btn-packing" onclick="iniciarEscaneo('packing')">
            📦 ${est === 'EN_PACKING' ? 'Continuar Packing' : 'Iniciar Packing'}
        </button>` : ''}

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
async function iniciarEscaneo(modo) {
    modoEscaneo  = modo;
    scanBuffer   = '';

    // Cambiar estado en backend
    const nuevoEst = modo === 'picking' ? 'EN_PICKING' : 'EN_PACKING';
    try {
        await fetch(`${API_BASE}/almacen/despachos/${ordenActiva.id}/estado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empresa: getEmpresa(), estado: nuevoEst })
        });
        ordenActiva.estado = nuevoEst;
    } catch(e) { /* continuar igualmente */ }

    renderEscaneo();
    mostrarScreen('escaneo');

    // Focus automático al input del scanner
    setTimeout(() => {
        const inp = document.getElementById('scannerInput');
        if (inp) { inp.focus(); inp.select(); }
    }, 200);
}

function renderEscaneo() {
    const isPacking = modoEscaneo === 'packing';
    const campo     = isPacking ? 'cant_packing' : 'cant_picking';
    const color     = isPacking ? 'packing' : '';

    document.getElementById('scanHeader').innerHTML = `
        <div class="scan-header ${color}">
            <div class="scan-icon">${isPacking ? '📦' : '🔍'}</div>
            <div>
                <h2>${isPacking ? 'PACKING — Verificación' : 'PICKING — Recolección'}</h2>
                <p>${ordenActiva.cc_destino_nombre || ordenActiva.cc_destino} · #${ordenActiva.id}</p>
            </div>
        </div>
    `;

    const inp = document.getElementById('scannerInput');
    inp.value = '';
    inp.className = isPacking ? 'packing-mode' : '';

    renderScanList(campo);
}

function renderScanList(campo) {
    campo = campo || (modoEscaneo === 'packing' ? 'cant_packing' : 'cant_picking');
    const el = document.getElementById('scanList');
    el.innerHTML = ordenActiva.detalle.map(item => {
        const req  = parseFloat(item.cant_requerida) || 0;
        const esc  = parseFloat(item[campo]) || 0;
        const dif  = esc - req;
        let cls = '', icon = '';
        if (esc === 0) { cls = ''; icon = '⬜'; }
        else if (dif < 0) { cls = 'item-falta'; icon = '⚠️'; }
        else if (dif > 0) { cls = 'item-sobre';  icon = '🔴'; }
        else               { cls = 'item-ok';     icon = '✅'; }

        return `<div class="scan-item ${cls}" id="si-${item.producto_codigo}">
            <div>
                <div class="scan-item-name">${item.producto_nombre}</div>
                <div class="scan-item-cod">${item.producto_codigo}</div>
            </div>
            <div class="scan-counter">
                <span class="scan-count-val" style="color:${esc===0?'var(--text-tertiary)':dif<0?'#ef4444':dif>0?'#f59e0b':'#10b981'}">${esc}</span>
                <span class="scan-count-req">/ ${req}</span>
                <span class="scan-status-icon">${icon}</span>
            </div>
        </div>`;
    }).join('');
}

// ── Captura del scanner ───────────────────────────────────────
function onScanKeydown(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const codigo = document.getElementById('scannerInput').value.trim();
        if (codigo) procesarScan(codigo);
        document.getElementById('scannerInput').value = '';
        return;
    }
    // Limpiar feedback al empezar a tipear
    hideFeedback();
}

async function procesarScan(barcode) {
    try {
        // 1. Lookup del barcode → producto
        const res  = await fetch(`${API_BASE}/almacen/barcode-lookup?barcode=${encodeURIComponent(barcode)}&empresa=${getEmpresa()}`);
        const data = await res.json();

        if (!data.found) {
            showFeedback('error', `❌ Código no reconocido: ${barcode}`);
            return;
        }

        const codigo = data.data.producto_codigo;
        const nombre = data.data.nombre;

        // 2. ¿Está en esta orden?
        const item = ordenActiva.detalle.find(d => d.producto_codigo === codigo);
        if (!item) {
            showFeedback('warn', `⚠️ ${nombre} no está en esta orden`);
            return;
        }

        // 3. Registrar el scan en backend (+1)
        const campo = modoEscaneo === 'packing' ? 'cant_packing' : 'cant_picking';
        const resS  = await fetch(`${API_BASE}/almacen/despachos/${ordenActiva.id}/scan`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empresa: getEmpresa(), producto_codigo: codigo, tipo: modoEscaneo, delta: 1 })
        });
        const dataS = await resS.json();
        if (!dataS.success) { showFeedback('error', '❌ Error al registrar scan'); return; }

        // 4. Actualizar estado local
        item[campo] = parseFloat(dataS.data[campo]) || 0;

        // 5. Feedback visual
        const nuevo = parseFloat(item[campo]);
        const req   = parseFloat(item.cant_requerida);
        if (nuevo < req)       showFeedback('warn', `⚠️ ${nombre} — ${nuevo}/${req} (falta ${req-nuevo})`);
        else if (nuevo === req) showFeedback('ok',   `✅ ${nombre} — ¡Completo! (${nuevo}/${req})`);
        else                   showFeedback('warn',  `🔴 ${nombre} — Sobrante: ${nuevo}/${req}`);

        // 6. Actualizar solo la fila del producto escaneado
        actualizarFilaScan(item, campo);

        // 7. Re-focus al input
        setTimeout(() => { const i = document.getElementById('scannerInput'); if(i){i.focus();i.select();} }, 100);

    } catch (e) {
        showFeedback('error', '❌ Error de conexión');
    }
}

function actualizarFilaScan(item, campo) {
    const el = document.getElementById('si-' + item.producto_codigo);
    if (!el) return;
    const req = parseFloat(item.cant_requerida) || 0;
    const esc = parseFloat(item[campo]) || 0;
    const dif = esc - req;
    let cls = '', icon = '';
    if (esc === 0) { cls = ''; icon = '⬜'; }
    else if (dif < 0) { cls = 'item-falta'; icon = '⚠️'; }
    else if (dif > 0) { cls = 'item-sobre';  icon = '🔴'; }
    else               { cls = 'item-ok';     icon = '✅'; }

    el.className = `scan-item ${cls}`;
    el.querySelector('.scan-count-val').textContent = esc;
    el.querySelector('.scan-count-val').style.color = esc===0?'var(--text-tertiary)':dif<0?'#ef4444':dif>0?'#f59e0b':'#10b981';
    el.querySelector('.scan-status-icon').textContent = icon;

    // Scroll suave al item
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Animación flash
    el.style.transition = 'box-shadow .15s';
    el.style.boxShadow  = '0 0 0 3px rgba(16,185,129,.5)';
    setTimeout(() => { el.style.boxShadow = ''; }, 600);
}

function showFeedback(tipo, msg) {
    const el = document.getElementById('scanFeedback');
    el.textContent = msg;
    el.className   = `scan-feedback ${tipo}`;
    clearTimeout(window._fbTimer);
    window._fbTimer = setTimeout(() => hideFeedback(), 4000);
}

function hideFeedback() {
    document.getElementById('scanFeedback').className = 'scan-feedback';
}

function finalizarEscaneo() {
    // Recargar detalle desde backend antes de mostrar detalle
    abrirOrden(ordenActiva.id).then(() => mostrarScreen('detalle'));
}

function volverAlDetalle() {
    abrirOrden(ordenActiva.id).then(() => mostrarScreen('detalle'));
}

// ══════════════════════════════════════════════════════════════
// PANTALLA 4 — CONFIRMACIÓN + IMPRESIÓN
// ══════════════════════════════════════════════════════════════
function mostrarConfirmacion() {
    const o    = ordenActiva;
    const campo= o.estado === 'EN_PACKING' ? 'cant_packing' : 'cant_picking';

    // Separar en: OK, faltantes, sobrantes
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
        <button class="btn-accion btn-secondary-act no-print" onclick="mostrarScreen('detalle')">
            Cancelar
        </button>
    `;

    mostrarScreen('confirmacion');
}

async function confirmarDespacho() {
    const btn = document.getElementById('btnConfirmarFinal');
    btn.disabled = true;
    btn.textContent = '⏳ Procesando...';

    try {
        const res  = await fetch(`${API_BASE}/almacen/despachos/${ordenActiva.id}/confirmar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empresa: getEmpresa() })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Error al confirmar');

        ordenActiva.estado = 'COMPLETADO';
        mostrarReporteExito();
    } catch (e) {
        btn.disabled    = false;
        btn.textContent = '🚚 Confirmar y Registrar Despacho';
        alert('Error: ' + e.message);
    }
}

function mostrarReporteExito() {
    const o     = ordenActiva;
    const campo = 'cant_packing';  // usar packing si existe, sino picking

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
    const area = document.getElementById('reporteImprimible') || document.getElementById('printArea');
    if (!area) return;

    const ventana = window.open('', '_blank');
    ventana.document.write(`
        <!DOCTYPE html><html><head>
        <meta charset="UTF-8">
        <title>Reporte Despacho #${ordenActiva?.id || ''}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width:100%; border-collapse:collapse; }
            th, td { padding:8px; border-bottom:1px solid #ccc; }
            th { background:#f0f0f0; font-weight:700; }
            @media print { body { margin:0; } }
        </style>
        </head><body>
        ${area.innerHTML}
        <script>window.onload=()=>{window.print();window.close();}<\/script>
        </body></html>
    `);
    ventana.document.close();
}

// ── Helpers ───────────────────────────────────────────────────
function fmtFecha(f) {
    if (!f) return '—';
    const d = new Date(f + (String(f).includes('T') ? '' : 'T12:00:00'));
    return d.toLocaleDateString('es', { day:'2-digit', month:'short', year:'numeric' });
}

function estadoLabel(e) {
    return { PENDIENTE:'Pendiente', EN_PICKING:'En Picking', EN_PACKING:'En Packing',
             COMPLETADO:'Completado', CANCELADO:'Cancelado' }[e] || e;
}
