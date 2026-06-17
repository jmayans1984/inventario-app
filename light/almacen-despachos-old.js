// ================================================================
// DESPACHOS DE BODEGA — Scanner · Picking · Packing · Confirmación
// ================================================================

const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api';

// ── Estado global ─────────────────────────────────────────────
let ordenActiva      = null;   // orden completa con detalle[]
let modoEscaneo      = null;   // 'picking' | 'packing'
let scanBuffer       = '';     // acumula chars del scanner BT
let scanTimeout      = null;   // limpia buffer si el scanner tarda
let barcodeNoEncontrado = null; // barcode pendiente de asociar
let estadoCambiado   = false;  // evita actualizar estado antes del primer scan
let scanEnProceso    = false;  // evita scans concurrentes (FIX 2)
let ultimoBarcode    = null;   // para reintentar (FIX 2)
let itemsOcultos     = new Set(); // productos completados y ocultos (FIX 6)
let mostrandoOcultos = false;  // toggle para ver ocultos (FIX 6)
let barcodeCache     = {};     // cache de barcodes registrados con sus factores

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
    const fecha   = document.getElementById('filtrFecha').value;
    const empresa = getEmpresa();
    document.getElementById('listaOrdenes').innerHTML =
        '<div class="empty-state"><div class="empty-icon">⏳</div><p>Cargando...</p></div>';
    try {
        const params = `empresa=${empresa}${fecha ? '&fecha=' + fecha : ''}`;
        const res  = await fetchConTimeout(`${API_BASE}/almacen/despachos?${params}`);
        const data = await res.json();
        renderLista(data.data || []);
    } catch (e) {
        document.getElementById('listaOrdenes').innerHTML =
            '<div class="empty-state"><div class="empty-icon">❌</div><p>Error cargando órdenes</p></div>';
    }
}

function renderLista(ordenes) {
    const el    = document.getElementById('listaOrdenes');
    const fecha = document.getElementById('filtrFecha').value;

    // Sin fecha → solo activas (excluir completadas y canceladas)
    const ACTIVAS = ['PENDIENTE','EN_PICKING','EN_PACKING'];
    if (!fecha) ordenes = ordenes.filter(o => ACTIVAS.includes(o.estado));

    if (!ordenes.length) {
        const msg = fecha ? 'No hay órdenes para esta fecha' : 'No hay órdenes activas';
        el.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>${msg}</p></div>`;
        return;
    }

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
    modoEscaneo    = modo;
    scanBuffer     = '';
    estadoCambiado = false;
    scanEnProceso  = false;
    itemsOcultos   = new Set(); // FIX 6: reset al entrar
    mostrandoOcultos = false;

    renderEscaneo();
    mostrarScreen('escaneo');
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

    // FIX 6: filtrar productos ocultos
    const visibles = mostrandoOcultos
        ? ordenActiva.detalle
        : ordenActiva.detalle.filter(item => !itemsOcultos.has(item.producto_codigo));

    const ocCnt = itemsOcultos.size;
    const ocBanner = ocCnt > 0 ? `
        <div class="scan-ocultos-banner" onclick="toggleOcultos()">
            ${mostrandoOcultos ? '🙈' : '👁️'}
            ${ocCnt} producto${ocCnt > 1 ? 's' : ''} completado${ocCnt > 1 ? 's' : ''}
            ${mostrandoOcultos ? '— toca para ocultar' : '— toca para ver'}
        </div>` : '';

    el.innerHTML = ocBanner + visibles.map(item => renderScanItem(item, campo)).join('');
}

function renderScanItem(item, campo) {
    const req  = parseFloat(item.cant_requerida) || 0;
    const esc  = parseFloat(item[campo]) || 0;
    const dif  = esc - req;
    let cls = '', icon = '';
    if (esc === 0)     { cls = '';           icon = '⬜'; }
    else if (dif < 0)  { cls = 'item-falta'; icon = '⚠️'; }
    else if (dif > 0)  { cls = 'item-sobre'; icon = '🔴'; }
    else               { cls = 'item-ok';    icon = '✅'; }

    const cod   = item.producto_codigo;
    const color = esc === 0 ? 'var(--text-tertiary)' : dif < 0 ? '#ef4444' : dif > 0 ? '#f59e0b' : '#10b981';

    // FIX 6: si está oculto (mostrandoOcultos=true), mostrar con estilo tenue
    const ocultoCls = itemsOcultos.has(cod) ? ' item-oculto' : '';

    return `<div class="scan-item ${cls}${ocultoCls}" id="si-${cod}">
        <div class="scan-item-info" onclick="mostrarEntradaManual('${cod}','${campo}')">
            <div class="scan-item-name">${item.producto_nombre}</div>
            <div class="scan-item-cod">${cod} · ✏️ entrada manual</div>
        </div>
        <div class="scan-counter">
            <button class="scan-adj-btn" onclick="ajustarCantidad('${cod}','${campo}',-1)">−</button>
            <div class="scan-count-info">
                <span class="scan-count-val" style="color:${color}">${esc}</span>
                <span class="scan-count-req">/ ${req}</span>
                <span class="scan-status-icon">${icon}</span>
            </div>
            <button class="scan-adj-btn scan-adj-plus" onclick="ajustarCantidad('${cod}','${campo}',+1)">+</button>
        </div>
    </div>`;
}

// FIX 6: toggle mostrar/ocultar completados
function toggleOcultos() {
    mostrandoOcultos = !mostrandoOcultos;
    const campo = modoEscaneo === 'packing' ? 'cant_packing' : 'cant_picking';
    renderScanList(campo);
}

// ── Captura del scanner ───────────────────────────────────────
function onScanKeydown(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        ejecutarScanManual();
        return;
    }
    hideFeedback();
}

// FIX 3: botón manual de búsqueda
function ejecutarScanManual() {
    const inp    = document.getElementById('scannerInput');
    const codigo = inp.value.trim();
    if (!codigo) { inp.focus(); return; }
    inp.value = '';
    procesarScan(codigo);
}

async function procesarScan(barcode) {
    // FIX 2: bloquear scans concurrentes
    if (scanEnProceso) return;
    scanEnProceso = true;
    ultimoBarcode = barcode;

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
                                scanEnProceso = false;
                                await verificarCompletoYOcultar(item, campo);
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
        const item = ordenActiva.detalle.find(d => d.producto_codigo === codigo);
        if (!item) {
            showFeedback('warn', `⚠️ ${nombre} no está en esta orden`);
            scanEnProceso = false;
            refocusInput();
            return;
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

        // 6. Feedback visual
        const nuevo = parseFloat(item[campo]);
        const req   = parseFloat(item.cant_requerida);
        const sufijo = delta > 1 ? ` (×${delta})` : '';
        if (nuevo < req)       showFeedback('warn', `⚠️ ${nombre}${sufijo} — ${nuevo}/${req} (falta ${req-nuevo})`);
        else if (nuevo === req) showFeedback('ok',   `✅ ${nombre}${sufijo} — ¡Completo! (${nuevo}/${req})`);
        else                   showFeedback('warn',  `🔴 ${nombre}${sufijo} — Sobrante: ${nuevo}/${req}`);

        // 7. Actualizar solo la fila del producto escaneado
        actualizarFilaScan(item, campo);

        // FIX 6: si completó exactamente, preguntar packing y ocultar
        if (nuevo === req) {
            scanEnProceso = false;
            await verificarCompletoYOcultar(item, campo);
            return;
        }

    } catch (e) {
        // FIX 2: mostrar error con botón de reintento; refocus para no romper el flujo
        const esTiempo = e.name === 'AbortError';
        console.error('[SCAN ERROR]', {
            name: e.name,
            message: e.message,
            status: e.status,
            barcode: barcode,
            timestamp: new Date().toISOString()
        });
        showFeedbackHTML('error',
            `❌ ${esTiempo ? 'Tiempo de espera agotado' : 'Error de conexión'} &nbsp;` +
            `<button onclick="reintentarScan()" style="padding:4px 10px;border-radius:8px;border:1.5px solid currentColor;background:transparent;color:inherit;font-size:12px;font-weight:700;cursor:pointer;">🔄 Reintentar</button>`
        );
    } finally {
        scanEnProceso = false;
        refocusInput();
    }
}

// FIX 2: reintentar último scan
function reintentarScan() {
    hideFeedback();
    if (ultimoBarcode) procesarScan(ultimoBarcode);
}

// ── FIX 4 + 5: ajustar cantidad manualmente ──────────────────
async function ajustarCantidad(codigo, campo, delta) {
    if (scanEnProceso) return;
    scanEnProceso = true;
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

        const nuevo = parseFloat(item[campo]);
        const req   = parseFloat(item.cant_requerida);
        if (nuevo < req)       showFeedback('warn', `⚠️ ${item.producto_nombre} — ${nuevo}/${req} (falta ${req-nuevo})`);
        else if (nuevo === req) showFeedback('ok',   `✅ ${item.producto_nombre} — ¡Completo!`);
        else                   showFeedback('warn',  `🔴 ${item.producto_nombre} — Sobrante: ${nuevo-req} de más`);

        if (nuevo === req) {
            scanEnProceso = false;
            await verificarCompletoYOcultar(item, campo);
            return;
        }
    } catch(e) {
        showFeedback('error', '❌ Error de conexión');
    } finally {
        scanEnProceso = false;
        refocusInput();
    }
}

// FIX 5: entrada manual por producto (bottom sheet)
function mostrarEntradaManual(codigo, campo) {
    const item = ordenActiva.detalle.find(d => d.producto_codigo === codigo);
    if (!item) return;

    const esc = parseFloat(item[campo]) || 0;
    const req = parseFloat(item.cant_requerida) || 0;

    const overlay = document.getElementById('bsOverlay');
    const panel   = overlay.querySelector('.bs-panel');

    panel.innerHTML = `
      <div style="padding:20px 16px 20px">
        <div class="bs-drag" style="width:40px;height:4px;background:var(--border-color);border-radius:2px;margin:0 auto 16px"></div>
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--text-secondary);margin-bottom:4px">✏️ Entrada manual</div>
        <div style="font-size:17px;font-weight:800;margin-bottom:4px;line-height:1.2">${item.producto_nombre}</div>
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:20px">
          Registrado: <strong style="color:var(--text-primary)">${esc}</strong> / Requerido: <strong>${req}</strong>
        </div>
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">Cantidad a agregar (usa número negativo para quitar):</div>
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:20px">
          <button onclick="ajustarCantidadManual('${codigo}','${campo}',-1)" style="width:52px;height:52px;border-radius:12px;border:2px solid var(--border-color);background:var(--bg-input);color:var(--text-primary);font-size:24px;font-weight:700;cursor:pointer;flex-shrink:0">−</button>
          <input id="manualCantInput" type="number" inputmode="decimal"
            value=""
            placeholder="Ej: 5"
            style="flex:1;padding:14px;border-radius:12px;border:2px solid var(--border-color);
                   background:var(--bg-input);color:var(--text-primary);font-size:22px;
                   font-weight:700;text-align:center;outline:none;box-sizing:border-box" />
          <button onclick="ajustarCantidadManual('${codigo}','${campo}',+1)" style="width:52px;height:52px;border-radius:12px;border:2px solid var(--border-color);background:var(--bg-input);color:var(--text-primary);font-size:24px;font-weight:700;cursor:pointer;flex-shrink:0">+</button>
        </div>
        <button id="btnConfirmarManual"
          style="width:100%;padding:14px;border-radius:12px;border:none;cursor:pointer;
                 background:#047857;color:white;font-size:15px;font-weight:700;margin-bottom:8px">
          ✅ Registrar cantidad
        </button>
        <button onclick="cancelarManual()"
          style="width:100%;padding:10px;border-radius:12px;border:none;cursor:pointer;
                 background:transparent;color:var(--text-secondary);font-size:13px">
          Cancelar
        </button>
      </div>
    `;

    overlay.classList.add('open');
    setTimeout(() => document.getElementById('manualCantInput')?.focus(), 100);

    document.getElementById('btnConfirmarManual').onclick = () => {
        const val = parseFloat(document.getElementById('manualCantInput').value);
        if (!val || isNaN(val)) { document.getElementById('manualCantInput').focus(); return; }
        overlay.classList.remove('open');
        ajustarCantidad(codigo, campo, val);
    };
    document.getElementById('manualCantInput').onkeydown = (e) => {
        if (e.key === 'Enter') document.getElementById('btnConfirmarManual').click();
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

// FIX 6: verificar si completó y preguntar packing + ocultar
async function verificarCompletoYOcultar(item, campo) {
    try {
        const isPicking = modoEscaneo === 'picking';

        if (isPicking) {
            // preguntar si también hacer packing
            const hacerPacking = await preguntarPacking(item);
            if (hacerPacking) {
                const req = parseFloat(item.cant_requerida);
                try {
                    const res  = await fetchConTimeout(`${API_BASE}/almacen/despachos/${ordenActiva.id}/scan`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ empresa: getEmpresa(), producto_codigo: item.producto_codigo, tipo: 'packing', delta: req })
                    });
                    const data = await res.json();
                    if (data.success) item.cant_packing = parseFloat(data.data.cant_packing) || 0;
                } catch(e) { console.error('[PACKING ERROR]', e); }
            }
        }

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
        if (!el) return;
        const req   = parseFloat(item.cant_requerida) || 0;
        const esc   = parseFloat(item[campo]) || 0;
        const dif   = esc - req;
        let cls = '', icon = '';
        if (esc === 0)    { cls = '';           icon = '⬜'; }
        else if (dif < 0) { cls = 'item-falta'; icon = '⚠️'; }
        else if (dif > 0) { cls = 'item-sobre'; icon = '🔴'; }
        else              { cls = 'item-ok';    icon = '✅'; }

        const color = esc===0 ? 'var(--text-tertiary)' : dif<0 ? '#ef4444' : dif>0 ? '#f59e0b' : '#10b981';

        el.className = `scan-item ${cls}${itemsOcultos.has(item.producto_codigo) ? ' item-oculto' : ''}`;
        const countVal  = el.querySelector('.scan-count-val');
        const statusIcon = el.querySelector('.scan-status-icon');
        if (countVal) { countVal.textContent = esc; countVal.style.color = color; }
        if (statusIcon) { statusIcon.textContent = icon; }

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
        const i = document.getElementById('scannerInput');
        if (i) { i.focus(); i.select(); }
    }, 120);
}

function finalizarEscaneo() {
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
        const res  = await fetchConTimeout(`${API_BASE}/almacen/despachos/${ordenActiva.id}/confirmar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empresa: getEmpresa() })
        }, 30000);
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

// ══════════════════════════════════════════════════════════════
// BOTTOM SHEET — ASOCIAR BARCODE DESCONOCIDO A PRODUCTO
// ══════════════════════════════════════════════════════════════
function mostrarAsociadorBarcode(barcode) {
    barcodeNoEncontrado = barcode;

    document.getElementById('bsBarcode').textContent = barcode;

    const campo = modoEscaneo === 'packing' ? 'cant_packing' : 'cant_picking';
    const lista = document.getElementById('bsList');

    lista.innerHTML = ordenActiva.detalle.map(item => {
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

    document.getElementById('bsOverlay').classList.add('open');
}

async function seleccionarProductoParaBarcode(productoCodigo) {
    const barcode = barcodeNoEncontrado;
    const item    = ordenActiva.detalle.find(d => d.producto_codigo === productoCodigo);

    const overlay = document.getElementById('bsOverlay');
    const panel   = overlay.querySelector('.bs-panel');
    panel.innerHTML = `
      <div style="padding:20px 16px 16px">
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px">Código escaneado</div>
        <div style="font-size:15px;font-weight:700;font-family:monospace;margin-bottom:16px">${barcode}</div>
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">
          ¿Cuántas <strong>unidades</strong> representa este código de barras?
        </div>
        <div style="display:flex;gap:8px;margin-bottom:12px">
          <button onclick="setFactor(1)"  class="btn-factor" id="bf1">× 1</button>
          <button onclick="setFactor(6)"  class="btn-factor" id="bf6">× 6</button>
          <button onclick="setFactor(12)" class="btn-factor" id="bf12">× 12</button>
          <button onclick="setFactor(24)" class="btn-factor" id="bf24">× 24</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:16px">
          <button onclick="setFactor(40)"  class="btn-factor" id="bf40">× 40</button>
          <button onclick="setFactor(48)"  class="btn-factor" id="bf48">× 48</button>
          <button onclick="setFactor(120)" class="btn-factor" id="bf120">× 120</button>
          <button onclick="setFactor(0)"   class="btn-factor" id="bf0" style="background:var(--bg-input)">Otro</button>
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
            <button id="btnFactorOtroOk" onclick="factorOtroConfirmar()" disabled style="padding:0;height:72px;border-radius:14px;border:none;
                    background:#047857;color:white;font-size:28px;font-weight:700;opacity:.4;
                    cursor:pointer;touch-action:manipulation;user-select:none">✓</button>
          </div>
        </div>
        <button id="btnConfirmarFactor" onclick="confirmarFactorBarcode('${productoCodigo}', '${barcode}')"
          style="width:100%;padding:14px;border-radius:12px;border:none;cursor:pointer;
                 background:#047857;color:white;font-size:15px;font-weight:700;margin-bottom:8px">
          Confirmar y registrar
        </button>
        <button onclick="cancelarFactorBarcode()"
          style="width:100%;padding:10px;border-radius:12px;border:none;cursor:pointer;
                 background:transparent;color:var(--text-secondary);font-size:13px">
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
        otroWrap.style.display = 'block';
        _factorOtroVal = '';
        _actualizarFactorOtroDisplay();
        window._factorSeleccionado = 0;
        document.getElementById('bf0').style.background = '#047857';
        document.getElementById('bf0').style.color = 'white';
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

async function confirmarFactorBarcode(productoCodigo, barcode) {
    let factor = window._factorSeleccionado;
    if (factor === 0) {
        factor = parseInt(document.getElementById('factorOtroInput').value) || 1;
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
        barcodeCache[barcode] = { factor, productoCodigo };
    } catch(e) { /* continuar igualmente */ }

    const campo = modoEscaneo === 'packing' ? 'cant_packing' : 'cant_picking';
    const item  = ordenActiva.detalle.find(d => d.producto_codigo === productoCodigo);
    if (!item) { showFeedback('warn', '⚠️ Producto no encontrado en la orden'); return; }

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
        const nuevo = parseFloat(item[campo]);
        const req   = parseFloat(item.cant_requerida);
        const sufijo = factor > 1 ? ` (×${factor})` : '';
        const msg   = nuevo < req  ? `⚠️ ${item.producto_nombre}${sufijo} — ${nuevo}/${req} (falta ${req-nuevo})`
                    : nuevo === req ? `✅ ${item.producto_nombre}${sufijo} — ¡Completo! (${nuevo}/${req})`
                    :                 `🔴 ${item.producto_nombre}${sufijo} — Sobrante: ${nuevo}/${req}`;
        showFeedback(nuevo <= req ? (nuevo < req ? 'warn' : 'ok') : 'warn', msg);
        actualizarFilaScan(item, campo);

        if (nuevo === req) {
            await verificarCompletoYOcultar(item, campo);
            return;
        }
    } catch(e) {
        showFeedback('error', '❌ Error de conexión');
    }

    refocusInput();
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
              style="width:100%;padding:10px;border-radius:12px;border:none;cursor:pointer;
                     background:transparent;color:var(--text-secondary);font-size:13px">
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
                    document.getElementById('scannerInput').value = codigo;
                    procesarScan(codigo);
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
    const d = new Date(f + (String(f).includes('T') ? '' : 'T12:00:00'));
    return d.toLocaleDateString('es', { day:'2-digit', month:'short', year:'numeric' });
}

function estadoLabel(e) {
    return { PENDIENTE:'Pendiente', EN_PICKING:'En Picking', EN_PACKING:'En Packing',
             COMPLETADO:'Completado', CANCELADO:'Cancelado' }[e] || e;
}
