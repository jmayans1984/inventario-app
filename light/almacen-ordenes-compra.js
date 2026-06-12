// ================================================================
// ALMACÉN - ÓRDENES DE COMPRA (lado cliente)
// Pedidos al proveedor con lista de precios asignada
// ================================================================

const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api';

window.addEventListener('load', () => {
    if (!localStorage.getItem('empresaActual') || !localStorage.getItem('usuario')) {
        window.location.href = 'index.html';
        return;
    }
    cargarOC();
});

let ordenes = [];
let productos = [];
let proveedor = null;
let listaPrecio = null;
let stockMap = {};
let cantidades = {};
let filtroEstados = ['PENDIENTE', 'ENTREGADA'];
let modoEdicion = null;   // null = nueva orden, string = código de orden en edición

const ESTADOS = [
    { val: 'PENDIENTE', label: 'Pendiente' },
    { val: 'ENTREGADA', label: 'Entregada' },
    { val: 'FACTURADA', label: 'Facturada' },
    { val: 'ANULADA',   label: 'Anulada' },
];

function getEmpresa() {
    return localStorage.getItem('empresaActual') || (window.sesion && window.sesion.empresa) || '';
}

function fmt(v) { return '$' + (parseFloat(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function fmtFecha(s) {
    if (!s) return '—';
    const d = new Date(s + (String(s).includes('T') ? '' : 'T00:00:00'));
    return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}`;
}

function nivelPrecio() { return parseInt(listaPrecio?.nivel) || 1; }

function getPrecio(p) {
    const n = nivelPrecio();
    return parseFloat(n === 1 ? p.precio_venta1 : n === 2 ? p.precio_venta2 : p.precio_venta3) || 0;
}

// ── Carga inicial (misma lógica que versión web) ──────────────────
async function cargarOC() {
    const empresa = getEmpresa();
    document.getElementById('ocContent').innerHTML =
        '<div style="padding:20px;text-align:center;color:var(--text-secondary)">⏳ Cargando órdenes...</div>';

    try {
        const [rProv, rOrd] = await Promise.all([
            fetch(`${API_BASE}/empresas/proveedor`).then(r => r.json()),
            fetch(`${API_BASE}/ordenes-compra/mis-ordenes?cliente=${empresa}`).then(r => r.json()),
        ]);
        if (rProv.success) proveedor = rProv.data;
        if (rOrd.success)  ordenes = rOrd.data || [];

        const rClientes = await fetch(`${API_BASE}/empresas/clientes`).then(r => r.json());
        if (rClientes.success) {
            const miEmpresa = (rClientes.data || []).find(c => String(c.codigo) === String(empresa));
            if (miEmpresa?.lista_precio_id) {
                const rListas = await fetch(`${API_BASE}/produccion/lista-precios`).then(r => r.json());
                const lista = (rListas.data || []).find(l => l.id === miEmpresa.lista_precio_id);
                if (lista) listaPrecio = lista;
            }
        }
    } catch (e) {
        console.error('Error cargando OC:', e);
        document.getElementById('ocContent').innerHTML =
            '<div style="padding:20px;text-align:center;color:#ef4444">❌ Error al cargar datos</div>';
        return;
    }
    renderLista();
}

async function cargarProductos() {
    try {
        const r = await fetch(`${API_BASE}/almacen/productos`, {
            headers: { 'x-empresa': getEmpresa() }
        }).then(r => r.json());
        productos = (r.data || []).filter(p => p.para_venta === 'SI');
    } catch (e) {
        console.error('Error cargando productos:', e);
        alert('❌ Error cargando productos');
    }
}

async function cargarStock() {
    if (!proveedor?.codigo) return;
    try {
        const r = await fetch(`${API_BASE}/almacen/stock-bodega-maestra?empresa=${proveedor.codigo}`).then(r => r.json());
        if (r.success) stockMap = r.data || {};
    } catch (e) { console.error('Error cargando stock:', e); }
}

// ── Lista de órdenes ──────────────────────────────────────────────
function ordenesFiltradas() {
    return filtroEstados.length === 0
        ? ordenes
        : ordenes.filter(o => filtroEstados.includes(o.estado));
}

function toggleEstado(val) {
    const i = filtroEstados.indexOf(val);
    if (i >= 0) filtroEstados.splice(i, 1);
    else filtroEstados.push(val);
    renderLista();
}

function estadoColor(estado) {
    switch (estado) {
        case 'PENDIENTE': return '#f59e0b';
        case 'ENTREGADA': return '#3b82f6';
        case 'FACTURADA': return '#22c55e';
        case 'ANULADA':   return '#ef4444';
        default: return '#6C6C70';
    }
}

function renderLista() {
    const pendientes = ordenes.filter(o => o.estado === 'PENDIENTE');
    const totalPendiente = pendientes.reduce((s, o) => s + parseFloat(o.total || 0), 0);

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px">
            <div style="min-width:0">
                <div style="font-size:12px;color:var(--text-tertiary)">Proveedor</div>
                <div style="font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${proveedor?.nombre || '...'}${listaPrecio ? ` · <span style="color:#10b981">${listaPrecio.lista}</span>` : ''}</div>
            </div>
            <button class="btn btn-primary" style="background:#10b981;flex-shrink:0;padding:10px 14px" onclick="abrirNuevoPedido()">＋ Nueva</button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px">
            <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:12px;padding:10px;text-align:center">
                <div style="font-size:16px;font-weight:800;color:#f59e0b">${pendientes.length}</div>
                <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text-tertiary)">Pend.</div>
            </div>
            <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:12px;padding:10px;text-align:center">
                <div style="font-size:16px;font-weight:800;color:#3b82f6">${ordenes.filter(o => o.estado === 'ENTREGADA').length}</div>
                <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text-tertiary)">Entreg.</div>
            </div>
            <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:12px;padding:10px;text-align:center">
                <div style="font-size:16px;font-weight:800;color:#22c55e">${ordenes.filter(o => o.estado === 'FACTURADA').length}</div>
                <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text-tertiary)">Fact.</div>
            </div>
            <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:12px;padding:10px;text-align:center">
                <div style="font-size:13px;font-weight:800;color:#10b981">${fmt(totalPendiente)}</div>
                <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text-tertiary)">Pendiente</div>
            </div>
        </div>

        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
            ${ESTADOS.map(e => `<button class="oc-estado-chip ${filtroEstados.includes(e.val) ? 'active' : ''}" onclick="toggleEstado('${e.val}')">${e.label}</button>`).join('')}
        </div>`;

    const lista = ordenesFiltradas();
    if (lista.length === 0) {
        html += '<div style="padding:40px 20px;text-align:center;color:var(--text-tertiary)">📋 No hay órdenes con los filtros seleccionados</div>';
    } else {
        lista.forEach(o => {
            const color = estadoColor(o.estado);
            html += `
            <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:10px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                    <span style="background:var(--bg-tertiary);padding:3px 10px;border-radius:6px;font-size:12px;font-weight:700;font-family:monospace">${o.codigo}</span>
                    <span style="background:${color}1a;color:${color};padding:3px 10px;border-radius:6px;font-size:10px;font-weight:800">${o.estado}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-secondary);margin-bottom:4px">
                    <span>📅 ${fmtFecha(o.fecha)}</span>
                    <span>🚚 ${o.fecha_entrega ? fmtFecha(o.fecha_entrega) : '—'}</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <span style="font-family:monospace;font-weight:800;font-size:16px;color:#10b981">${fmt(o.total)}</span>
                    <div style="display:flex;gap:6px">
                        <button onclick="verDetalle('${o.codigo}')" style="background:rgba(16,185,129,.1);color:#10b981;border:none;padding:8px 12px;border-radius:10px;font-size:12px;font-weight:700">👁 Ver</button>
                        <button onclick="abrirSoportes('${o.codigo}')" style="background:rgba(6,182,212,.1);color:#06b6d4;border:none;padding:8px 12px;border-radius:10px;font-size:12px;font-weight:700">📷</button>
                        ${o.estado === 'PENDIENTE' ? `<button onclick="abrirEditar('${o.codigo}')" style="background:rgba(245,158,11,.1);color:#f59e0b;border:none;padding:8px 12px;border-radius:10px;font-size:12px;font-weight:700">✏️</button>` : ''}
                    </div>
                </div>
            </div>`;
        });
    }

    document.getElementById('ocContent').innerHTML = html;
}

// ── Nueva orden ───────────────────────────────────────────────────
async function abrirNuevoPedido() {
    if (!proveedor)   { alert('❌ No se encontró empresa proveedor'); return; }
    if (!listaPrecio) { alert('❌ No tienes una lista de precios asignada. Contacta al proveedor.'); return; }
    cantidades = {};
    modoEdicion = null;
    document.getElementById('ocModalTitle').textContent = 'NUEVA ORDEN';
    document.getElementById('ocModalSub').textContent = `${proveedor.nombre} · Lista: ${listaPrecio.lista}`;
    document.getElementById('ocBusqueda').value = '';
    document.getElementById('ocFechaEntrega').value = '';
    document.getElementById('ocObservaciones').value = '';
    document.getElementById('ocBtnEnviar').textContent = '📤 Enviar';

    if (!productos.length) await cargarProductos();
    cargarStock();
    poblarFiltroGrupos();
    renderGridProductos();
    actualizarResumenModal();
    document.getElementById('ocModal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

// ── Editar orden (solo PENDIENTE) ─────────────────────────────────
async function abrirEditar(codigo) {
    const o = ordenes.find(x => x.codigo === codigo);
    if (!o || o.estado !== 'PENDIENTE') return;
    cantidades = {};
    modoEdicion = codigo;
    document.getElementById('ocModalTitle').textContent = `EDITAR — ${codigo}`;
    document.getElementById('ocModalSub').textContent = 'Solo órdenes PENDIENTES';
    document.getElementById('ocBusqueda').value = '';
    document.getElementById('ocFechaEntrega').value = o.fecha_entrega ? String(o.fecha_entrega).substring(0, 10) : '';
    document.getElementById('ocObservaciones').value = o.observaciones || '';
    document.getElementById('ocBtnEnviar').textContent = '💾 Guardar';

    if (!productos.length) await cargarProductos();
    cargarStock();

    try {
        const r = await fetch(`${API_BASE}/ordenes-compra/${codigo}/detalles`).then(r => r.json());
        (r.detalles || r.data || []).forEach(d => {
            if (parseFloat(d.cantidad) > 0) cantidades[d.producto_venta] = parseFloat(d.cantidad);
        });
    } catch (e) { console.error(e); }

    poblarFiltroGrupos();
    renderGridProductos();
    actualizarResumenModal();
    document.getElementById('ocModal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function cerrarModalOrden() {
    document.getElementById('ocModal').classList.remove('open');
    document.body.style.overflow = '';
}

function poblarFiltroGrupos() {
    const gs = [...new Set(productos.map(p => p.grupo_nombre || p.grupo || 'SIN GRUPO'))].sort();
    document.getElementById('ocFiltroGrupo').innerHTML =
        '<option value="">Grupos</option>' + gs.map(g => `<option value="${g}">${g}</option>`).join('');
}

function excedido(codigo) {
    const cant = parseFloat(cantidades[codigo]) || 0;
    if (cant <= 0 || stockMap[codigo] === undefined) return false;
    return cant > stockMap[codigo];
}

function productosExcedidos() {
    return Object.keys(cantidades).filter(cod => excedido(cod) && parseFloat(cantidades[cod]) > 0);
}

// ── Grid de productos (modal) ─────────────────────────────────────
function renderGridProductos() {
    const q = (document.getElementById('ocBusqueda').value || '').toLowerCase();
    const grupoFiltro = document.getElementById('ocFiltroGrupo').value;

    const filtrados = productos.filter(p => {
        const mg = !grupoFiltro || (p.grupo_nombre || p.grupo) === grupoFiltro;
        const mq = !q || p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q);
        return mg && mq;
    });

    if (filtrados.length === 0) {
        document.getElementById('ocGridProductos').innerHTML =
            '<div style="padding:40px 20px;text-align:center;color:var(--text-tertiary)">Sin productos que mostrar</div>';
        return;
    }

    // Agrupar
    const map = {};
    filtrados.forEach(p => {
        const key = p.grupo_nombre || p.grupo || 'SIN GRUPO';
        if (!map[key]) map[key] = [];
        map[key].push(p);
    });
    const grupos = Object.entries(map).sort(([a], [b]) => a.localeCompare(b, 'es'));

    let html = `
        <div class="oc-prod-grid-head">
            <div>Código</div>
            <div>Producto</div>
            <div>Und</div>
            <div style="text-align:right">Precio</div>
            <div style="text-align:center">Cantidad</div>
        </div>
        <div class="oc-prod-grid-body">
    `;

    grupos.forEach(([grupo, items]) => {
        html += `<div style="grid-column:1/-1;padding:8px 14px;background:var(--bg-tertiary);font-size:11px;font-weight:700;text-transform:uppercase;color:#10b981;border-top:1px solid rgba(16,185,129,.2)">📁 ${grupo} <span style="color:var(--text-tertiary);font-weight:400">· ${items.length}</span></div>`;
        items.forEach(p => {
            const cant = cantidades[p.codigo] || 0;
            const precio = getPrecio(p);
            const warn = excedido(p.codigo);
            html += `
            <div class="oc-prod-row ${cant > 0 ? 'active' : ''}">
                <div class="oc-prod-col oc-prod-col-codigo">${p.codigo}</div>
                <div class="oc-prod-col oc-prod-col-nombre">
                    ${p.nombre}
                    <div class="oc-prod-col-desc">${p.descripcion || ''}</div>
                </div>
                <div class="oc-prod-col oc-prod-col-und">${p.und || '—'}</div>
                <div class="oc-prod-col oc-prod-col-precio">${fmt(precio)}</div>
                <input type="number" min="0" step="1" placeholder="0" inputmode="decimal"
                    class="oc-cant-input ${cant > 0 ? 'active' : ''} ${warn ? 'warn' : ''}"
                    value="${cant || ''}"
                    data-codigo="${p.codigo}"
                    oninput="setCant('${p.codigo}', this.value, this)"
                    onkeydown="navegarProductos(event, '${p.codigo}')">
            </div>`;
        });
    });

    html += `</div>`;
    document.getElementById('ocGridProductos').innerHTML = html;
}

function navegarProductos(e, codigo) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const inputs = Array.from(document.querySelectorAll('.oc-cant-input'));
    const idx = inputs.findIndex(i => i.dataset.codigo === codigo);
    if (idx >= 0 && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
        inputs[idx + 1].select();
    }
}

function setCant(codigo, val, el) {
    const n = parseFloat(val);
    if (isNaN(n) || n <= 0) { delete cantidades[codigo]; }
    else { cantidades[codigo] = n; }

    if (el) {
        el.classList.toggle('active', (cantidades[codigo] || 0) > 0);
        el.classList.toggle('warn', excedido(codigo));
    }
    actualizarResumenModal();
}

function itemsPedido() { return Object.values(cantidades).filter(c => parseFloat(c) > 0).length; }

function totalPedido() {
    return productos.reduce((s, p) => {
        const cant = parseFloat(cantidades[p.codigo]) || 0;
        return s + (cant > 0 ? cant * getPrecio(p) : 0);
    }, 0);
}

function actualizarResumenModal() {
    const items = itemsPedido();
    document.getElementById('ocModalTotal').textContent = fmt(totalPedido());
    document.getElementById('ocItemsResumen').textContent = items > 0 ? `${items} producto(s)` : '';
    document.getElementById('ocAlertaStock').style.display = productosExcedidos().length > 0 ? 'block' : 'none';
}

// ── Enviar / Guardar ──────────────────────────────────────────────
async function enviarOrden() {
    if (itemsPedido() === 0) { alert('❌ Agrega cantidades a por lo menos un producto'); return; }
    const fechaEntrega = document.getElementById('ocFechaEntrega').value;
    if (!fechaEntrega) { alert('❌ La fecha de entrega es obligatoria'); return; }

    let observaciones = document.getElementById('ocObservaciones').value;
    if (productosExcedidos().length > 0) {
        const aviso = 'Es posible que no se puedan suministrar la cantidad solicitada';
        if (!observaciones.includes(aviso)) {
            observaciones = observaciones ? `${observaciones} | ${aviso}` : aviso;
        }
    }

    const detalles = productos
        .filter(p => (parseFloat(cantidades[p.codigo]) || 0) > 0)
        .map(p => ({
            producto_venta: p.codigo,
            cantidad: parseFloat(cantidades[p.codigo]),
            precio_unitario: getPrecio(p),
            subtotal: parseFloat(cantidades[p.codigo]) * getPrecio(p),
        }));

    const btn = document.getElementById('ocBtnEnviar');
    btn.disabled = true;

    try {
        if (modoEdicion) {
            // PUT actualizar orden existente
            const res = await fetch(`${API_BASE}/ordenes-compra/${modoEdicion}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fecha_entrega: fechaEntrega,
                    observaciones,
                    detalles,
                    total: totalPedido(),
                }),
            });
            const j = await res.json();
            if (!j.success) throw new Error(j.details || j.error || 'Error al actualizar');
            alert('✓ Orden actualizada correctamente');
        } else {
            // POST nueva orden
            const tipoPrecio = `precio_venta${nivelPrecio()}`;
            const res = await fetch(`${API_BASE}/ordenes-compra/crear`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    empresa: proveedor.codigo,
                    cliente: getEmpresa(),
                    tipo_precio: tipoPrecio,
                    fecha_entrega: fechaEntrega || null,
                    dias_credito: listaPrecio?.dias_credito || 0,
                    observaciones,
                    total: totalPedido(),
                    detalles,
                }),
            });
            const j = await res.json();
            if (!j.success) throw new Error(j.error || j.details);
            alert(`✓ Orden ${j.codigo} enviada correctamente`);
        }
        cerrarModalOrden();
        await cargarOC();
    } catch (e) {
        alert('❌ ' + e.message);
    } finally {
        btn.disabled = false;
    }
}

// ── Detalle ───────────────────────────────────────────────────────
async function verDetalle(codigo) {
    const o = ordenes.find(x => x.codigo === codigo);
    if (!o) return;

    document.getElementById('ocDetTitle').textContent = o.codigo;
    document.getElementById('ocDetSub').textContent = `${fmtFecha(o.fecha)} · ${o.estado}`;
    document.getElementById('ocDetBody').innerHTML =
        '<div style="padding:20px;text-align:center;color:var(--text-secondary)">⏳ Cargando...</div>';
    document.getElementById('ocModalDetalle').classList.add('open');

    try {
        const r = await fetch(`${API_BASE}/ordenes-compra/${codigo}/detalles`).then(r => r.json());
        const lineas = r.detalles || r.data || [];

        // Agrupar por grupo
        const map = {};
        lineas.forEach(d => {
            const grupo = d.grupo_nombre || 'SIN GRUPO';
            if (!map[grupo]) map[grupo] = [];
            map[grupo].push(d);
        });
        const grupos = Object.entries(map).sort(([a], [b]) => a.localeCompare(b, 'es'));

        let html = '';
        grupos.forEach(([nombre, items]) => {
            html += `<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#10b981;padding:10px 4px 6px">📁 ${nombre}</div>`;
            items.forEach(d => {
                html += `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 4px;border-bottom:1px solid var(--border);gap:8px">
                    <div style="flex:1;min-width:0">
                        <div style="font-size:13px;font-weight:600">${d.producto_nombre || d.nombre_producto || d.producto_venta}</div>
                        <div style="font-size:11px;color:var(--text-tertiary)">${d.cantidad} × ${fmt(d.precio_unitario)}</div>
                    </div>
                    <span style="font-family:monospace;font-weight:700;color:#10b981">${fmt(d.subtotal)}</span>
                </div>`;
            });
        });

        html += `
        <div style="display:flex;justify-content:space-between;padding:14px 4px;margin-top:8px;border-top:2px solid var(--border)">
            <span style="font-weight:800;font-size:15px">TOTAL</span>
            <span style="font-family:monospace;font-weight:800;font-size:17px;color:#10b981">${fmt(o.total)}</span>
        </div>`;

        if (o.observaciones) {
            html += `<div style="margin-top:10px;padding:10px;background:var(--bg-secondary);border-radius:10px;font-size:12px;color:var(--text-secondary)">📝 <b>Observaciones:</b> ${o.observaciones}</div>`;
        }

        html += `<button class="btn btn-secondary" style="width:100%;margin-top:14px" onclick="imprimirDetalle('${codigo}')">🖨 Imprimir</button>`;
        document.getElementById('ocDetBody').innerHTML = html;
        window._ocDetLineas = lineas;
        window._ocDetOrden = o;
    } catch (e) {
        document.getElementById('ocDetBody').innerHTML =
            '<div style="padding:20px;text-align:center;color:#ef4444">❌ Error cargando detalle</div>';
    }
}

function imprimirDetalle(codigo) {
    const o = window._ocDetOrden;
    const lineas = window._ocDetLineas || [];
    if (!o) return;

    const ventana = window.open('', '_blank');
    if (!ventana) { alert('Activa los pop-ups para imprimir'); return; }

    const filas = lineas.map(d => `
        <tr>
            <td>${d.producto_nombre || d.nombre_producto || d.producto_venta}</td>
            <td style="text-align:right">${d.cantidad}</td>
            <td style="text-align:right">${fmt(d.precio_unitario)}</td>
            <td style="text-align:right">${fmt(d.subtotal)}</td>
        </tr>`).join('');

    ventana.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
        <title>${o.codigo}</title>
        <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family: Arial, sans-serif; font-size:13px; color:#1a1a2e; padding:30px; }
            .toolbar { background:#f1f5f9; padding:12px 20px; border-radius:6px; margin-bottom:20px; display:flex; gap:10px; }
            .toolbar button { padding:8px 16px; background:#ef4444; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600; }
            .toolbar button:hover { background:#dc2626; }
            .header { background:#1a1a2e; color:white; padding:16px 20px; border-radius:6px; margin-bottom:20px; }
            .header h1 { font-size:18px; }
            .header p { font-size:11px; color:#94a3b8; margin-top:4px; }
            table { width:100%; border-collapse:collapse; margin-top:10px; }
            th { background:#f1f5f9; padding:8px; text-align:left; font-size:11px; text-transform:uppercase; }
            th:not(:first-child) { text-align:right; }
            td { padding:7px 8px; border-bottom:1px solid #e2e8f0; }
            .total-row td { font-weight:800; font-size:15px; }
            .obs { margin-top:16px; padding:10px; background:#f8fafc; border-radius:6px; font-size:12px; }
            @media print { .toolbar { display:none; } .header { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
        </style></head><body>
        <div class="toolbar">
            <button onclick="window.close()">✕ Cerrar</button>
        </div>
        <div class="header">
            <h1>ORDEN DE COMPRA — ${o.codigo}</h1>
            <p>Fecha: ${fmtFecha(o.fecha)} · Entrega: ${o.fecha_entrega ? fmtFecha(o.fecha_entrega) : '—'} · Estado: ${o.estado}</p>
            <p>Proveedor: ${proveedor?.nombre || ''}</p>
        </div>
        <table>
            <thead><tr><th>PRODUCTO</th><th>CANT.</th><th>PRECIO</th><th>SUBTOTAL</th></tr></thead>
            <tbody>${filas}
            <tr class="total-row"><td colspan="3" style="text-align:right">TOTAL</td><td style="text-align:right">${fmt(o.total)}</td></tr>
            </tbody>
        </table>
        ${o.observaciones ? `<div class="obs"><b>Observaciones:</b> ${o.observaciones}</div>` : ''}
        </body></html>`);
    ventana.document.close();
    ventana.focus();
    setTimeout(() => ventana.print(), 400);
}

// ── Soportes de entrega ───────────────────────────────────────────
async function abrirSoportes(codigo) {
    document.getElementById('ocDetTitle').textContent = 'Soportes de Entrega';
    document.getElementById('ocDetSub').textContent = codigo;
    document.getElementById('ocDetBody').innerHTML =
        '<div style="padding:20px;text-align:center;color:var(--text-secondary)">⏳ Cargando...</div>';
    document.getElementById('ocModalDetalle').classList.add('open');

    try {
        const r = await fetch(`${API_BASE}/soportes-entrega/${codigo}`).then(r => r.json());
        const soportes = (r.data || []).map(s => {
            const url = s.archivo_data || null;
            const mime = s.tipo_archivo || (url ? url.split(';')[0].replace('data:', '') : 'image/jpeg');
            return { ...s, url, tipo_mime: mime };
        });

        if (soportes.length === 0) {
            document.getElementById('ocDetBody').innerHTML =
                '<div style="padding:40px 20px;text-align:center;color:var(--text-tertiary)">📷 No hay soportes de entrega para esta orden</div>';
            return;
        }

        let html = '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">';
        soportes.forEach((s, i) => {
            if (s.tipo_mime?.startsWith('image') && s.url) {
                html += `
                <div style="border:1px solid var(--border);border-radius:12px;overflow:hidden">
                    <img src="${s.url}" style="width:100%;height:140px;object-fit:cover;display:block" onclick="verImagenCompleta(${i})">
                    <div style="padding:6px 8px;font-size:10px;color:var(--text-tertiary);display:flex;justify-content:space-between;align-items:center">
                        <span>${fmtFecha(s.fecha_subida)}</span>
                        <a href="${s.url}" download="${s.nombre_archivo || 'soporte-' + s.id}" style="color:#06b6d4;font-weight:700;text-decoration:none">⬇</a>
                    </div>
                </div>`;
            } else {
                html += `
                <div style="border:1px solid var(--border);border-radius:12px;padding:14px;text-align:center">
                    <div style="font-size:28px">📄</div>
                    <div style="font-size:10px;word-break:break-all">${s.nombre_archivo || ''}</div>
                </div>`;
            }
        });
        html += '</div>';
        document.getElementById('ocDetBody').innerHTML = html;
        window._ocSoportes = soportes;
    } catch (e) {
        document.getElementById('ocDetBody').innerHTML =
            '<div style="padding:20px;text-align:center;color:#ef4444">❌ Error al cargar soportes</div>';
    }
}

function verImagenCompleta(idx) {
    const s = (window._ocSoportes || [])[idx];
    if (!s?.url) return;
    document.getElementById('ocImagenSrc').src = s.url;
    document.getElementById('ocModalImagen').classList.add('open');
}
