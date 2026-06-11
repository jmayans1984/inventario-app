// ================================================================
// ALMACÉN - GESTIÓN DE INVENTARIO
// Registra movimientos: Entradas, Salidas, Bajas, Traslados
// Filtra productos según bodega maestra o punto venta
// ================================================================

const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api';

// Auto-init cuando carga la página
window.addEventListener('load', () => {
    if (!localStorage.getItem('empresaActual') || !localStorage.getItem('usuario')) {
        window.location.href = 'index.html';
        return;
    }
    cargarGestionInventario();
});

let productos = [];
let bodegaMaestraCC = null;
let centrosCosto = [];
let cantidades = {};

function getEmpresa() {
    return localStorage.getItem('empresaActual') || (window.sesion && getEmpresa()) || '';
}

const TIPOS_OP = [
    { label: 'ENTRADA DE ALMACÉN',       value: 'ENTRADA' },
    { label: 'SALIDA DE ALMACÉN',        value: 'SALIDA' },
    { label: 'SALIDA POR BAJA',          value: 'BAJA' },
    { label: 'TRASLADO ENTRE ALMACENES', value: 'TRASLADO' },
];

async function cargarGestionInventario() {
    console.log('🔄 Cargando Gestión de Inventario...');

    await Promise.all([
        cargarCentrosCosto(),
        cargarBodegaMaestra(),
    ]);

    renderFormulario();
}

async function cargarCentrosCosto() {
    try {
        const res = await fetch(`${API_BASE}/ccostos?empresa=${getEmpresa()}`);
        const data = await res.json();
        centrosCosto = data.data || [];
        console.log('✓ Centros de costo cargados:', centrosCosto.length);
    } catch (e) {
        console.error('Error cargando CC:', e);
    }
}

async function cargarBodegaMaestra() {
    try {
        const res = await fetch(`${API_BASE}/empresas/bodega-maestra?empresa=${getEmpresa()}`);
        const data = await res.json();
        if (data.success) {
            bodegaMaestraCC = data.data.bodega_maestra;
            console.log('✓ Bodega maestra:', bodegaMaestraCC);
        }
    } catch (e) {
        console.error('Error cargando bodega maestra:', e);
    }
}

async function cargarProductos() {
    const ccSel = document.getElementById('ccOrigen').value;

    if (!ccSel) {
        document.getElementById('gridProductos').innerHTML =
            '<div style="padding:20px;text-align:center;color:var(--text-tertiary)">Selecciona un Centro de Costo</div>';
        return;
    }

    document.getElementById('gridProductos').innerHTML =
        '<div style="padding:20px;text-align:center;color:var(--text-secondary)">⏳ Cargando productos...</div>';

    try {
        const res = await fetch(`${API_BASE}/almacen/productos`, {
            headers: { 'x-empresa': getEmpresa() }
        });
        const data = await res.json();
        let todos = data.data || [];

        // Filtrar según bodega maestra o punto venta
        const esBodegaMaestra = bodegaMaestraCC && (bodegaMaestraCC === ccSel);
        if (esBodegaMaestra) {
            productos = todos.filter(p => p.control === 'SI');
            console.log('📦 Bodega Maestra: filtrando por control=SI', productos.length, 'items');
        } else {
            productos = todos.filter(p => p.visible_operacional === 'SI');
            console.log('🏪 Punto de Venta: filtrando por para_venta=SI', productos.length, 'items');
        }

        cantidades = {};
        renderProductos();
    } catch (e) {
        console.error('Error cargando productos:', e);
        document.getElementById('gridProductos').innerHTML =
            '<div style="padding:20px;text-align:center;color:#ef4444">❌ Error cargando productos</div>';
    }
}

function renderProductos() {
    if (productos.length === 0) {
        document.getElementById('gridProductos').innerHTML =
            '<div style="padding:20px;text-align:center;color:var(--text-tertiary)">No hay productos disponibles</div>';
        return;
    }

    // Agrupar por grupo de productos
    const grupos = {};
    productos.forEach(p => {
        const key = p.grupo || '__sin_grupo__';
        const nombre = p.grupo_nombre || 'Sin Categoría';
        if (!grupos[key]) grupos[key] = { nombre, items: [] };
        grupos[key].items.push(p);
    });

    let html = '<table class="grid-table">';
    html += '<thead><tr><th style="width:70px">CÓDIGO</th><th>NOMBRE</th><th style="width:50px">UND</th><th style="width:80px">CANTIDAD</th></tr></thead><tbody>';

    Object.entries(grupos).forEach(([key, grupo]) => {
        html += `<tr>
            <td colspan="4" style="background:var(--bg-secondary);padding:10px;font-weight:600;font-size:12px;border-bottom:2px solid var(--border)">
                📁 ${grupo.nombre}
            </td>
        </tr>`;

        grupo.items.forEach(p => {
            const cant = cantidades[p.codigo] || '';
            html += `<tr>
                <td><span style="background:var(--bg-tertiary);padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600">${p.codigo}</span></td>
                <td style="padding:8px">${p.nombre}</td>
                <td style="text-align:center;font-size:12px;font-weight:600;padding:8px">${p.und}</td>
                <td style="padding:8px">
                    <input type="number"
                        class="cant-input"
                        data-codigo="${p.codigo}"
                        value="${cant}"
                        placeholder="0"
                        step="0.01"
                        min="0"
                        onchange="guardarCantidad(this)"
                        style="width:100%;padding:6px;border:1px solid var(--border);border-radius:6px;font-size:14px">
                </td>
            </tr>`;
        });
    });

    html += '</tbody></table>';
    document.getElementById('gridProductos').innerHTML = html;
    actualizarFooter();
}

function guardarCantidad(el) {
    const codigo = el.dataset.codigo;
    const val = el.value;
    if (val && val !== '0') {
        cantidades[codigo] = parseFloat(val);
    } else {
        delete cantidades[codigo];
    }
    actualizarFooter();
}

function actualizarFooter() {
    const count = Object.keys(cantidades).length;
    const btnGuardar = document.getElementById('btnGuardar');
    btnGuardar.disabled = count === 0;
    document.getElementById('productosConCant').textContent = count;
}

function renderFormulario() {
    const html = `
        <div class="filters-container">
            <div class="filter-group">
                <label class="filter-label">Fecha *</label>
                <input type="date" id="fecha" class="filter-input"
                    value="${new Date().toISOString().slice(0, 10)}">
            </div>
            <div class="filter-group">
                <label class="filter-label">Tipo de Operación *</label>
                <select id="tipoOp" class="filter-select">
                    <option value="">— Selecciona —</option>
                    ${TIPOS_OP.map(t => `<option value="${t.value}">${t.label}</option>`).join('')}
                </select>
            </div>
            <div class="filter-group">
                <label class="filter-label">Centro de Costo *</label>
                <select id="ccOrigen" class="filter-select" onchange="cargarProductos()">
                    <option value="">— Selecciona —</option>
                    ${centrosCosto.map(cc => `<option value="${cc.codigo}">${cc.nombre}</option>`).join('')}
                </select>
            </div>
            <div class="filter-group">
                <label class="filter-label">Observaciones</label>
                <input type="text" id="observaciones" class="filter-input"
                    placeholder="Descripción del movimiento..." maxlength="120">
            </div>
        </div>

        <div class="table-container" style="margin-top:20px">
            <div style="padding:16px;border-bottom:1px solid var(--border);font-weight:600;font-size:14px;display:flex;justify-content:space-between;align-items:center">
                <span>📦 Productos de Inventario</span>
                <button class="btn btn-secondary" style="font-size:12px;padding:6px 12px" onclick="limpiarCantidades()">Limpiar</button>
            </div>
            <div id="gridProductos" style="overflow-x:auto"></div>
        </div>

        <div style="margin-top:20px;padding:16px;background:var(--bg-secondary);border-radius:var(--radius-md);display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:13px;color:var(--text-secondary)">
                <span id="productosConCant">0</span> producto(s) con cantidad
            </span>
            <button id="btnGuardar" class="btn btn-primary" disabled onclick="guardarMovimiento()"
                style="padding:8px 16px;font-size:13px">
                💾 Guardar Movimiento
            </button>
        </div>
    `;

    document.getElementById('gestionContent').innerHTML = html;
    actualizarFooter();
}

function limpiarCantidades() {
    cantidades = {};
    document.querySelectorAll('.cant-input').forEach(inp => inp.value = '');
    actualizarFooter();
}

async function guardarMovimiento() {
    const fecha = document.getElementById('fecha').value;
    const tipoOp = document.getElementById('tipoOp').value;
    const ccOrigen = document.getElementById('ccOrigen').value;
    const observaciones = document.getElementById('observaciones').value;

    if (!fecha || !tipoOp || !ccOrigen) {
        alert('❌ Completa los campos obligatorios');
        return;
    }

    if (Object.keys(cantidades).length === 0) {
        alert('❌ Ingresa cantidades para al menos un producto');
        return;
    }

    const payload = {
        empresa: localStorage.getItem('empresaActual'),
        fecha,
        tipo: tipoOp,
        ccOrigen: ccOrigen,
        ccDestino: null,
        observaciones,
        productos: Object.entries(cantidades).map(([codigo, cantidad]) => ({
            producto_venta: codigo,
            cantidad,
        })),
    };

    console.log('📤 Guardando:', payload);

    try {
        const res = await fetch(`${API_BASE}/almacen/gestion-inventario`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (data.success) {
            alert('✓ Movimiento guardado correctamente');
            document.getElementById('tipoOp').value = '';
            document.getElementById('ccOrigen').value = '';
            document.getElementById('observaciones').value = '';
            cantidades = {};
            document.getElementById('gridProductos').innerHTML = '';
            actualizarFooter();
        } else {
            alert('❌ ' + (data.error || 'Error guardando'));
        }
    } catch (e) {
        console.error('Error:', e);
        alert('❌ Error de conexión');
    }
}
