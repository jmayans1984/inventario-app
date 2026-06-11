// ================================================================
// ALMACÉN - TOMA FÍSICA DE INVENTARIO
// Registra conteos físicos de productos
// Filtra productos según bodega maestra o punto venta
// Permite toma física parcial o completa
// ================================================================

const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api';

// Auto-init cuando carga la página
window.addEventListener('load', () => {
    if (!window.sesion) { window.location.href = 'index.html'; return; }
    cargarTomaFisica();
});
let productos = [];
let bodegaMaestraCC = null;
let centrosCosto = [];
let fisico = {};

function cargarTomaFisica() {
    console.log('🔄 Cargando Toma Física...');

    Promise.all([
        cargarCentrosCosto(),
        cargarBodegaMaestra(),
    ]).then(() => {
        renderFormulario();
    });
}

async function cargarCentrosCosto() {
    try {
        const res = await fetch(`${API_BASE}/ccostos?empresa=${window.sesion.empresa}`);
        const data = await res.json();
        centrosCosto = data.data || [];
        console.log('✓ Centros de costo cargados:', centrosCosto.length);
    } catch (e) {
        console.error('Error cargando CC:', e);
    }
}

async function cargarBodegaMaestra() {
    try {
        const res = await fetch(`${API_BASE}/empresas/bodega-maestra?empresa=${window.sesion.empresa}`);
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
            headers: { 'x-empresa': window.sesion.empresa }
        });
        const data = await res.json();
        let todos = data.data || [];

        // Filtrar según bodega maestra o punto venta
        const esBodegaMaestra = bodegaMaestraCC && (bodegaMaestraCC === ccSel);
        if (esBodegaMaestra) {
            productos = todos.filter(p => p.control === 'SI');
            console.log('📦 Bodega Maestra: filtrando por control=SI', productos.length, 'items');
        } else {
            productos = todos.filter(p => p.para_venta === 'SI');
            console.log('🏪 Punto de Venta: filtrando por para_venta=SI', productos.length, 'items');
        }

        fisico = {};
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
    html += '<thead><tr><th style="width:70px">CÓDIGO</th><th>NOMBRE</th><th style="width:50px">UND</th><th style="width:90px">STOCK SISTEMA</th><th style="width:90px">FÍSICO</th><th style="width:80px">DIFERENCIA</th></tr></thead><tbody>';

    Object.entries(grupos).forEach(([key, grupo]) => {
        html += `<tr>
            <td colspan="6" style="background:var(--bg-secondary);padding:10px;font-weight:600;font-size:12px;border-bottom:2px solid var(--border)">
                📁 ${grupo.nombre}
            </td>
        </tr>`;

        grupo.items.forEach(p => {
            const fis = fisico[p.codigo] || '';
            const stock = parseFloat(p.stock_minimo || 0);
            const diff = fis ? (parseFloat(fis) - stock) : null;
            const diffColor = diff === null ? 'var(--text-secondary)' : diff > 0 ? 'var(--success)' : diff < 0 ? 'var(--danger)' : 'var(--text-secondary)';
            const diffText = diff === null ? '—' : (diff > 0 ? '+' : '') + diff.toFixed(2);

            html += `<tr>
                <td><span style="background:var(--bg-tertiary);padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600">${p.codigo}</span></td>
                <td style="padding:8px">${p.nombre}</td>
                <td style="text-align:center;font-size:12px;font-weight:600;padding:8px">${p.und}</td>
                <td style="text-align:right;padding:8px;font-family:monospace;font-weight:600;color:var(--text-secondary)">${stock.toFixed(2)}</td>
                <td style="padding:8px">
                    <input type="number"
                        class="fisico-input"
                        data-codigo="${p.codigo}"
                        data-stock="${stock}"
                        value="${fis}"
                        placeholder="0"
                        step="0.01"
                        min="0"
                        onchange="actualizarDiferencia(this)"
                        style="width:100%;padding:6px;border:1px solid var(--border);border-radius:6px;font-size:14px">
                </td>
                <td style="text-align:right;padding:8px;font-family:monospace;font-weight:600;color:${diffColor}">
                    ${diffText}
                </td>
            </tr>`;
        });
    });

    html += '</tbody></table>';
    document.getElementById('gridProductos').innerHTML = html;
}

function actualizarDiferencia(el) {
    const codigo = el.dataset.codigo;
    const stock = parseFloat(el.dataset.stock);
    const val = el.value;

    if (val) {
        fisico[codigo] = parseFloat(val);
    } else {
        delete fisico[codigo];
    }

    // Actualizar visual
    const tr = el.closest('tr');
    const fis = fisico[codigo];
    const diff = fis !== undefined ? (fis - stock) : null;
    const diffColor = diff === null ? 'var(--text-secondary)' : diff > 0 ? 'var(--success)' : diff < 0 ? 'var(--danger)' : 'var(--text-secondary)';
    const diffText = diff === null ? '—' : (diff > 0 ? '+' : '') + diff.toFixed(2);

    const diffCell = tr.querySelector('td:last-child');
    diffCell.textContent = diffText;
    diffCell.style.color = diffColor;

    actualizarFooter();
}

function actualizarFooter() {
    const count = Object.keys(fisico).length;
    const btnGuardar = document.getElementById('btnGuardar');
    btnGuardar.disabled = count === 0;
    document.getElementById('productosContados').textContent = count;
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
                <label class="filter-label">Centro de Costo *</label>
                <select id="ccOrigen" class="filter-select" onchange="cargarProductos()">
                    <option value="">— Selecciona —</option>
                    ${centrosCosto.map(cc => `<option value="${cc.codigo}">${cc.nombre}</option>`).join('')}
                </select>
            </div>
            <div class="filter-group">
                <label class="filter-label">Observaciones</label>
                <input type="text" id="observaciones" class="filter-input"
                    placeholder="Comentarios del conteo..." maxlength="120">
            </div>
            <div class="filter-group" style="padding-top:0;margin-top:-8px">
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:var(--text-primary)">
                    <input type="checkbox" id="esParcial" checked style="width:18px;height:18px;cursor:pointer">
                    <span>Toma Física Parcial (solo productos contados)</span>
                </label>
            </div>
        </div>

        <div class="table-container" style="margin-top:20px">
            <div style="padding:16px;border-bottom:1px solid var(--border);font-weight:600;font-size:14px;display:flex;justify-content:space-between;align-items:center">
                <span>📦 Productos</span>
                <button class="btn btn-secondary" style="font-size:12px;padding:6px 12px" onclick="limpiarProductos()">Limpiar</button>
            </div>
            <div id="gridProductos" style="overflow-x:auto"></div>
        </div>

        <div style="margin-top:20px;padding:16px;background:var(--bg-secondary);border-radius:var(--radius-md);display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:13px;color:var(--text-secondary)">
                <span id="productosContados">0</span> producto(s) contados
            </span>
            <button id="btnGuardar" class="btn btn-primary" disabled onclick="guardarTomaFisica()"
                style="padding:8px 16px;font-size:13px">
                💾 Guardar Toma Física
            </button>
        </div>
    `;

    document.getElementById('gestionContent').innerHTML = html;
    actualizarFooter();
}

function limpiarProductos() {
    fisico = {};
    document.querySelectorAll('.fisico-input').forEach(inp => {
        inp.value = '';
        actualizarDiferencia(inp);
    });
}

async function guardarTomaFisica() {
    const fecha = document.getElementById('fecha').value;
    const ccOrigen = document.getElementById('ccOrigen').value;
    const observaciones = document.getElementById('observaciones').value;
    const esParcial = document.getElementById('esParcial').checked;

    if (!fecha || !ccOrigen) {
        alert('❌ Completa los campos obligatorios');
        return;
    }

    if (Object.keys(fisico).length === 0) {
        alert('❌ Ingresa conteos para al menos un producto');
        return;
    }

    // Procesar movimientos según parcial/completa
    const movimientos = [];

    Object.entries(fisico).forEach(([codigo, cantFisica]) => {
        const prod = productos.find(p => p.codigo === codigo);
        const stockSistema = parseFloat(prod?.stock_minimo || 0);
        const diferencia = cantFisica - stockSistema;

        if (diferencia !== 0) {
            movimientos.push({
                fecha,
                ccosto: ccOrigen,
                codigo,
                entrada: diferencia > 0 ? diferencia : 0,
                salida: diferencia < 0 ? Math.abs(diferencia) : 0,
                tipo: 'TOMA_FISICA',
                observaciones,
            });
        }
    });

    if (movimientos.length === 0) {
        alert('❌ Ningún producto tiene diferencia de conteo');
        return;
    }

    const tipoTxt = esParcial ? 'Parcial' : 'Completa';
    if (!confirm(`¿Confirmas toma física ${tipoTxt} con ${movimientos.length} movimiento(s)?`)) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/almacen/movimientos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-empresa': window.sesion.empresa,
            },
            body: JSON.stringify({
                fecha,
                tipo_op: 'TOMA_FISICA',
                cc_origen: ccOrigen,
                cc_destino: null,
                observaciones,
                lineas: movimientos.map(m => ({
                    producto_codigo: m.codigo,
                    cantidad: m.entrada || Math.abs(m.salida),
                })),
            }),
        });

        const data = await res.json();

        if (data.success) {
            alert(`✓ Toma Física ${tipoTxt} registrada\n${movimientos.length} movimiento(s)`);
            fisico = {};
            document.getElementById('ccOrigen').value = '';
            document.getElementById('observaciones').value = '';
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
