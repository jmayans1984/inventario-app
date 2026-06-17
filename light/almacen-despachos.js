// ================================================================
// DESPACHOS DE BODEGA v2 — Barcode Scanner + Packing + Traslado
// ================================================================

const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api';

let ordenActiva = null;
let productosEscaneados = {};
let scanEnProceso = false;

window.addEventListener('load', () => {
    if (!localStorage.getItem('empresaActual') || !localStorage.getItem('usuario')) {
        window.location.href = 'index.html';
        return;
    }
    cargarOrdenes();
});

function getEmpresa() {
    return localStorage.getItem('empresaActual') || '';
}

function fetchConTimeout(url, opts = {}, ms = 12000) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(id));
}

function mostrarScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + id).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ══════════════════════════════════════════════════════════════
// PANTALLA 1 — LISTA DE ÓRDENES
// ══════════════════════════════════════════════════════════════
async function cargarOrdenes() {
    const fecha = document.getElementById('filtrFecha')?.value || '';
    const empresa = getEmpresa();
    const el = document.getElementById('listaOrdenes');

    if (!el) return;
    el.innerHTML = '<div class="empty-state"><p>⏳ Cargando...</p></div>';

    try {
        const params = `empresa=${empresa}${fecha ? '&fecha=' + fecha : ''}`;
        const res = await fetchConTimeout(`${API_BASE}/almacen/despachos?${params}`);
        const data = await res.json();
        renderOrdenes(data.data || []);
    } catch (e) {
        el.innerHTML = '<div class="empty-state"><p>❌ Error cargando</p></div>';
    }
}

function renderOrdenes(ordenes) {
    const ACTIVAS = ['PENDIENTE', 'EN_PICKING', 'EN_PACKING'];
    const fecha = document.getElementById('filtrFecha')?.value || '';
    if (!fecha) ordenes = ordenes.filter(o => ACTIVAS.includes(o.estado));

    const el = document.getElementById('listaOrdenes');
    if (!el) return;

    if (!ordenes.length) {
        el.innerHTML = '<div class="empty-state"><p>📭 No hay órdenes</p></div>';
        return;
    }

    el.innerHTML = ordenes.map(o => `
        <div class="orden-card" onclick="abrirOrden(${o.id})" style="padding:16px;background:var(--bg-card);border-radius:12px;margin-bottom:12px;cursor:pointer;border:2px solid var(--border-color)">
            <div style="font-weight:700;font-size:15px;margin-bottom:4px">#${o.id}</div>
            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">📍 ${o.cc_destino_nombre || o.cc_destino}</div>
            <div style="font-size:13px">${o.total_items} productos · ${parseFloat(o.total_unidades||0).toFixed(0)} unidades</div>
        </div>
    `).join('');
}

async function abrirOrden(id) {
    try {
        const res = await fetchConTimeout(`${API_BASE}/almacen/despachos/${id}?empresa=${getEmpresa()}`);
        const data = await res.json();
        ordenActiva = data.data;
        productosEscaneados = {};
        renderDetalle();
        mostrarScreen('detalle');
    } catch (e) {
        alert('Error cargando orden');
    }
}

function renderDetalle() {
    const o = ordenActiva;
    const el = document.getElementById('detalleContenido');
    if (!el) return;

    const filas = o.detalle.map(item => {
        const qty = productosEscaneados[item.producto_codigo] || 0;
        const req = parseFloat(item.cant_requerida) || 0;
        let estado = '⬜';
        if (qty > 0 && qty < req) estado = '⚠️';
        else if (qty === req) estado = '✅';
        else if (qty > req) estado = '🔴';

        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border-bottom:1px solid var(--border-color)">
            <div>
                <div style="font-weight:600;font-size:14px">${item.producto_nombre}</div>
                <div style="font-size:12px;color:var(--text-secondary)">${item.producto_codigo}</div>
            </div>
            <div style="text-align:right">
                <div style="font-size:18px;font-weight:700">${estado}</div>
                <div style="font-size:12px;color:var(--text-secondary)">${qty}/${req}</div>
            </div>
        </div>`;
    }).join('');

    el.innerHTML = `
        <button class="btn btn-secondary" onclick="mostrarScreen('lista');cargarOrdenes()" style="margin-bottom:16px;width:100%">
            ← Volver
        </button>

        <div style="background:var(--bg-card);border-radius:12px;padding:16px;margin-bottom:16px;border:2px solid var(--border-color)">
            <div style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;margin-bottom:4px">Orden #${o.id}</div>
            <div style="font-size:16px;font-weight:700;margin-bottom:8px">${o.cc_destino_nombre}</div>
            <div style="font-size:13px;color:var(--text-secondary)">${o.total_items} productos</div>
        </div>

        <div style="background:var(--bg-card);border-radius:12px;border:2px solid var(--border-color);margin-bottom:16px">
            ${filas}
        </div>

        <button class="btn-accion btn-confirmar" onclick="iniciarEscaneo()" style="width:100%;margin-bottom:12px">
            📦 Iniciar Packing
        </button>
    `;
}

// ══════════════════════════════════════════════════════════════
// PANTALLA 2 — ESCANEO SIMPLE
// ══════════════════════════════════════════════════════════════
function iniciarEscaneo() {
    const scanList = document.getElementById('scanList');
    const scanHeader = document.getElementById('scanHeader');
    const scanInput = document.getElementById('scannerInput');

    if (!scanList || !scanInput) return;

    const listaHtml = Object.entries(productosEscaneados).map(([cod, qty]) => {
        const item = ordenActiva.detalle.find(d => d.producto_codigo === cod);
        if (!item) return '';
        return `<div class="scan-item" style="background:var(--bg-input)">
            <div class="scan-item-info">
                <div class="scan-item-name">${item.producto_nombre}</div>
                <div class="scan-item-cod">${cod}</div>
            </div>
            <div class="scan-counter">
                <div style="text-align:center;font-size:20px;font-weight:700">${qty}</div>
            </div>
        </div>`;
    }).join('');

    scanHeader.innerHTML = `
        <div style="background:var(--bg-card);border-radius:12px;padding:16px;border:2px solid var(--border-color)">
            <div style="font-size:11px;color:var(--text-secondary);text-transform:uppercase">Despachando a</div>
            <div style="font-size:16px;font-weight:700">${ordenActiva.cc_destino_nombre}</div>
        </div>
    `;

    scanList.innerHTML = listaHtml || '<div style="text-align:center;color:var(--text-secondary);padding:20px">Escanea un producto para comenzar</div>';

    mostrarScreen('escaneo');
    scanInput.value = '';
    scanInput.focus();
}

async function procesarBarcode() {
    if (scanEnProceso) return;
    scanEnProceso = true;

    const input = document.getElementById('scannerInput');
    const barcode = input?.value?.trim();

    if (!barcode) {
        scanEnProceso = false;
        return;
    }

    try {
        const res = await fetchConTimeout(`${API_BASE}/almacen/barcode-lookup?barcode=${encodeURIComponent(barcode)}&empresa=${getEmpresa()}`);
        const data = await res.json();

        if (!data.found) {
            mostrarFeedback('⚠️ Barcode no encontrado', 'warn');
            scanEnProceso = false;
            input.value = '';
            input.focus();
            return;
        }

        const codigo = data.data.producto_codigo;
        const item = ordenActiva.detalle.find(d => d.producto_codigo === codigo);

        if (!item) {
            mostrarFeedback('⚠️ Producto no está en esta orden', 'warn');
            scanEnProceso = false;
            input.value = '';
            input.focus();
            return;
        }

        const factor = parseFloat(data.data.factor) || 1;
        productosEscaneados[codigo] = (productosEscaneados[codigo] || 0) + factor;

        mostrarFeedback(`✅ ${item.producto_nombre} (+${factor})`, 'ok');
        input.value = '';

        iniciarEscaneo();
        setTimeout(() => document.getElementById('scannerInput')?.focus(), 100);
    } catch (e) {
        mostrarFeedback('❌ Error de conexión', 'error');
        console.error('[BARCODE ERROR]', e);
    } finally {
        scanEnProceso = false;
    }
}

function onScanKeydown(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        procesarBarcode();
    }
}

function mostrarFeedback(msg, tipo) {
    const el = document.getElementById('scanFeedback');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    el.style.background = tipo === 'ok' ? '#d1fae5' : tipo === 'warn' ? '#fef3c7' : '#fee2e2';
    el.style.color = tipo === 'ok' ? '#047857' : tipo === 'warn' ? '#d97706' : '#dc2626';
    setTimeout(() => {
        el.style.display = 'none';
    }, 3000);
}

async function confirmarPacking() {
    const productos = Object.entries(productosEscaneados).map(([cod, qty]) => ({ cod, qty }));

    if (!productos.length) {
        alert('Escanea al menos un producto');
        return;
    }

    if (!confirm('¿Confirmar packing y hacer traslado entre bodegas?')) return;

    try {
        for (const { cod, qty } of productos) {
            await fetchConTimeout(`${API_BASE}/almacen/despachos/${ordenActiva.id}/scan`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empresa: getEmpresa(), producto_codigo: cod, tipo: 'packing', delta: qty })
            });
        }

        await fetchConTimeout(`${API_BASE}/almacen/despachos/${ordenActiva.id}/confirmar`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empresa: getEmpresa() })
        });

        mostrarConfirmacion();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

function mostrarConfirmacion() {
    const el = document.getElementById('confirmContenido');
    if (!el) return;

    el.innerHTML = `
        <div style="text-align:center;padding:40px 20px">
            <div style="font-size:4rem;margin-bottom:16px">✅</div>
            <h2 style="font-size:20px;font-weight:800;margin-bottom:8px">¡Packing Confirmado!</h2>
            <p style="color:var(--text-secondary);margin-bottom:24px">El traslado entre bodegas ha sido registrado</p>
            <button class="btn btn-secondary" onclick="mostrarScreen('lista');cargarOrdenes()" style="width:100%">
                ← Volver a órdenes
            </button>
        </div>
    `;
    mostrarScreen('confirmacion');
}

function volverAlDetalle() {
    mostrarScreen('detalle');
}

function finalizarEscaneo() {
    confirmarPacking();
}
