// ================================================================
// ALMACÉN - GESTIÓN DE INVENTARIO
// Módulo para entradas, salidas y transferencias
// ================================================================

let productosGestion = [];
let movimientosTemporales = [];

function cargarGestionInventario() {
    const contentDiv = document.getElementById('gestionInventarioContent');
    
    contentDiv.innerHTML = `
        <!-- ENCABEZADO -->
        <div style="background: var(--bg-card); padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem; border: 1px solid var(--border);">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                <!-- FECHA -->
                <div>
                    <label style="display: block; margin-bottom: 0.4rem; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Fecha</label>
                    <input type="date" id="fechaMovimiento" value="${new Date().toISOString().split('T')[0]}" style="width: 100%; padding: 0.7rem; background: var(--bg); border: 2px solid var(--border); border-radius: 6px; color: var(--text); font-size: 0.9rem;">
                </div>

                <!-- TIPO DE OPERACIÓN -->
                <div>
                    <label style="display: block; margin-bottom: 0.4rem; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Tipo Operación</label>
                    <select id="tipoOperacion" onchange="cambiarTipoOperacion()" style="width: 100%; padding: 0.7rem; background: var(--bg); border: 2px solid var(--border); border-radius: 6px; color: var(--text); font-size: 0.9rem;">
                        <option value="">OPCIÓN...</option>
                        <option value="ENTRADA A ALMACEN">ENTRADA A ALMACEN</option>
                        <option value="SALIDA DE ALMACEN">SALIDA DE ALMACEN</option>
                        <option value="TRANSFERENCIA ENTRE ALMACENES">TRANSFERENCIA ENTRE ALMACENES</option>
                    </select>
                </div>

                <!-- C. COSTO ORIGEN -->
                <div id="divCcostoOrigen">
                    <label style="display: block; margin-bottom: 0.4rem; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">C. Costo Origen</label>
                    <select id="ccostoOrigen" onchange="cargarProductosGestion()" style="width: 100%; padding: 0.7rem; background: var(--bg); border: 2px solid var(--border); border-radius: 6px; color: var(--text); font-size: 0.9rem;">
                        <option value="">OPCIÓN...</option>
                    </select>
                </div>

                <!-- C. COSTO DESTINO (solo para transferencias) -->
                <div id="divCcostoDestino" style="display: none;">
                    <label style="display: block; margin-bottom: 0.4rem; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">C. Costo Destino</label>
                    <select id="ccostoDestino" style="width: 100%; padding: 0.7rem; background: var(--bg); border: 2px solid var(--border); border-radius: 6px; color: var(--text); font-size: 0.9rem;">
                        <option value="">OPCIÓN...</option>
                    </select>
                </div>
            </div>

            <!-- OBSERVACIONES -->
            <div>
                <label style="display: block; margin-bottom: 0.4rem; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Observaciones</label>
                <input type="text" id="observaciones" placeholder="Observaciones del movimiento (opcional)" style="width: 100%; padding: 0.7rem; background: var(--bg); border: 2px solid var(--border); border-radius: 6px; color: var(--text); font-size: 0.9rem;">
            </div>
        </div>

        <!-- TABLA DE PRODUCTOS -->
        <div style="background: var(--bg-card); border-radius: 12px; padding: 1rem; border: 1px solid var(--border); margin-bottom: 1rem;">
            <div style="overflow-x: auto; border-radius: 8px; border: 1px solid var(--border);">
                <table id="tablaGestion" style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                    <thead style="background: var(--bg);">
                        <tr>
                            <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; border-bottom: 2px solid var(--border);">Código</th>
                            <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; border-bottom: 2px solid var(--border);">Producto</th>
                            <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; border-bottom: 2px solid var(--border);">Unidad</th>
                            <th style="padding: 0.75rem 1rem; text-align: right; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; border-bottom: 2px solid var(--border);">Stock Actual</th>
                            <th style="padding: 0.75rem 1rem; text-align: right; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; border-bottom: 2px solid var(--border);">Cantidad</th>
                        </tr>
                    </thead>
                    <tbody id="gestionBody">
                        <tr>
                            <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-secondary);">Selecciona tipo de operación y centro de costo</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- BOTÓN GUARDAR -->
        <div style="text-align: right;">
            <button id="btnGuardarMovimientos" onclick="guardarMovimientos()" disabled style="padding: 1rem 2rem; background: var(--success); color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 700; cursor: pointer; text-transform: uppercase; opacity: 0.5;">
                💾 Guardar Movimientos
            </button>
        </div>
    `;

    cargarCCostosGestion();
}

async function cargarCCostosGestion() {
    try {
        const response = await fetch(`${API_BASE}/ccostos?empresa=${sesion.empresa}`);
        const data = await response.json();

        if (data.success) {
            const selectOrigen = document.getElementById('ccostoOrigen');
            const selectDestino = document.getElementById('ccostoDestino');
            
            let html = '<option value="">OPCIÓN...</option>';
            data.data.forEach(cc => {
                html += `<option value="${cc.codigo}">${cc.codigo} - ${cc.nombre}</option>`;
            });
            
            selectOrigen.innerHTML = html;
            selectDestino.innerHTML = html;
        }
    } catch (error) {
        console.error('Error cargando ccostos:', error);
    }
}

function cambiarTipoOperacion() {
    const tipo = document.getElementById('tipoOperacion').value;
    const divDestino = document.getElementById('divCcostoDestino');
    const labelOrigen = document.querySelector('#divCcostoOrigen label');
    
    // Limpiar productos
    productosGestion = [];
    movimientosTemporales = [];
    document.getElementById('gestionBody').innerHTML = `
        <tr>
            <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-secondary);">Selecciona centro de costo</td>
        </tr>
    `;
    
    if (tipo === 'TRANSFERENCIA ENTRE ALMACENES') {
        divDestino.style.display = 'block';
        labelOrigen.textContent = 'C. Costo Origen';
    } else {
        divDestino.style.display = 'none';
        labelOrigen.textContent = 'C. Costo';
    }
    
    habilitarBotonGuardar();
}

async function cargarProductosGestion() {
    const tipoOp = document.getElementById('tipoOperacion').value;
    const ccosto = document.getElementById('ccostoOrigen').value;
    
    if (!tipoOp || !ccosto) {
        return;
    }

    try {
        let url = `${API_BASE}/inventario?empresa=${sesion.empresa}&ccosto=${ccosto}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            productosGestion = data.data;
            renderProductosGestion();
        }
    } catch (error) {
        console.error('Error cargando productos:', error);
    }
}

function renderProductosGestion() {
    const tbody = document.getElementById('gestionBody');

    if (productosGestion.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="5" style="text-align: center; padding: 2rem;">
                No hay productos en este centro de costo
            </td></tr>
        `;
        return;
    }

    let html = '';
    let currentGrupo = null;
    let grupoIndex = 0;

    productosGestion.forEach((item, index) => {
        if (item.grupo_codigo !== currentGrupo) {
            currentGrupo = item.grupo_codigo;
            grupoIndex = grupoIndex === 0 ? 1 : 0;
        }

        const bgGradient = grupoIndex === 0 
            ? 'background: linear-gradient(90deg, rgba(30, 58, 138, 0.25) 0%, rgba(30, 58, 138, 0.15) 100%);'
            : 'background: linear-gradient(90deg, rgba(124, 45, 18, 0.25) 0%, rgba(124, 45, 18, 0.15) 100%);';

        const stockFormateado = parseFloat(item.stock_actual).toFixed(2);

        html += `
            <tr style="${bgGradient}">
                <td style="padding: 0.65rem 1rem; border-bottom: 1px solid var(--border);"><strong>${item.codigo}</strong></td>
                <td style="padding: 0.65rem 1rem; border-bottom: 1px solid var(--border);">${item.nombre}</td>
                <td style="padding: 0.65rem 1rem; border-bottom: 1px solid var(--border);">${item.unidad || '-'}</td>
                <td style="padding: 0.65rem 1rem; border-bottom: 1px solid var(--border); text-align: right; font-family: 'Courier New', monospace; font-weight: 600;"><strong style="color: #60a5fa;">${stockFormateado}</strong></td>
                <td style="padding: 0.65rem 1rem; border-bottom: 1px solid var(--border); text-align: right;">
                    <input type="number" 
                           id="cant_${index}" 
                           data-codigo="${item.codigo}"
                           step="0.01" 
                           min="0" 
                           value="0.00"
                           onchange="actualizarMovimiento(${index}, '${item.codigo}')"
                           style="width: 120px; padding: 0.5rem; background: var(--bg); border: 2px solid var(--border); border-radius: 6px; color: var(--text); text-align: right; font-family: 'Courier New', monospace; font-weight: 600;">
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function actualizarMovimiento(index, codigo) {
    const cantidad = parseFloat(document.getElementById(`cant_${index}`).value) || 0;
    
    // Buscar si ya existe este código en movimientos temporales
    const existeIndex = movimientosTemporales.findIndex(m => m.codigo === codigo);
    
    if (cantidad > 0) {
        if (existeIndex >= 0) {
            movimientosTemporales[existeIndex].cantidad = cantidad;
        } else {
            movimientosTemporales.push({ codigo, cantidad });
        }
    } else {
        if (existeIndex >= 0) {
            movimientosTemporales.splice(existeIndex, 1);
        }
    }
    
    habilitarBotonGuardar();
}

function habilitarBotonGuardar() {
    const btn = document.getElementById('btnGuardarMovimientos');
    const tieneMovimientos = movimientosTemporales.length > 0;
    const tipoOp = document.getElementById('tipoOperacion').value;
    const ccostoOrigen = document.getElementById('ccostoOrigen').value;
    
    let ccostoDestino = true;
    if (tipoOp === 'TRANSFERENCIA ENTRE ALMACENES') {
        ccostoDestino = document.getElementById('ccostoDestino').value !== '';
    }
    
    if (tieneMovimientos && tipoOp && ccostoOrigen && ccostoDestino) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    } else {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    }
}

async function guardarMovimientos() {
    const fecha = document.getElementById('fechaMovimiento').value;
    const tipoOp = document.getElementById('tipoOperacion').value;
    const ccostoOrigen = document.getElementById('ccostoOrigen').value;
    const ccostoDestino = document.getElementById('ccostoDestino').value;
    const observaciones = document.getElementById('observaciones').value || '';
    
    if (movimientosTemporales.length === 0) {
        alert('No hay movimientos para guardar');
        return;
    }
    
    if (!confirm(`¿Guardar ${movimientosTemporales.length} movimiento(s)?`)) {
        return;
    }
    
    const btn = document.getElementById('btnGuardarMovimientos');
    btn.disabled = true;
    btn.textContent = '⏳ Guardando...';
    
    try {
        const movimientos = [];
        
        movimientosTemporales.forEach(mov => {
            if (tipoOp === 'ENTRADA A ALMACEN') {
                movimientos.push({
                    fecha,
                    ccosto: ccostoOrigen,
                    codigo: mov.codigo,
                    entrada: mov.cantidad,
                    salida: 0,
                    tipo: tipoOp,
                    empresa: sesion.empresa,
                    observaciones
                });
            } else if (tipoOp === 'SALIDA DE ALMACEN') {
                movimientos.push({
                    fecha,
                    ccosto: ccostoOrigen,
                    codigo: mov.codigo,
                    entrada: 0,
                    salida: mov.cantidad,
                    tipo: tipoOp,
                    empresa: sesion.empresa,
                    observaciones
                });
            } else if (tipoOp === 'TRANSFERENCIA ENTRE ALMACENES') {
                // SALIDA del origen
                movimientos.push({
                    fecha,
                    ccosto: ccostoOrigen,
                    codigo: mov.codigo,
                    entrada: 0,
                    salida: mov.cantidad,
                    tipo: 'TRANSFERENCIA (SALIDA)',
                    empresa: sesion.empresa,
                    observaciones: observaciones || `Transferencia a ${ccostoDestino}`
                });
                
                // ENTRADA al destino
                movimientos.push({
                    fecha,
                    ccosto: ccostoDestino,
                    codigo: mov.codigo,
                    entrada: mov.cantidad,
                    salida: 0,
                    tipo: 'TRANSFERENCIA (ENTRADA)',
                    empresa: sesion.empresa,
                    observaciones: observaciones || `Transferencia desde ${ccostoOrigen}`
                });
            }
        });
        
        const response = await fetch(`${API_BASE}/inventario/movimientos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ movimientos })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`✅ ${data.registros_creados} movimiento(s) guardado(s) exitosamente`);
            limpiarFormulario();
        } else {
            alert(`❌ Error: ${data.error}`);
            btn.disabled = false;
            btn.textContent = '💾 Guardar Movimientos';
        }
        
    } catch (error) {
        console.error('Error guardando movimientos:', error);
        alert('❌ Error al guardar movimientos');
        btn.disabled = false;
        btn.textContent = '💾 Guardar Movimientos';
    }
}

function limpiarFormulario() {
    document.getElementById('fechaMovimiento').value = new Date().toISOString().split('T')[0];
    document.getElementById('tipoOperacion').value = '';
    document.getElementById('ccostoOrigen').value = '';
    document.getElementById('ccostoDestino').value = '';
    document.getElementById('observaciones').value = '';
    
    movimientosTemporales = [];
    productosGestion = [];
    
    document.getElementById('gestionBody').innerHTML = `
        <tr>
            <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-secondary);">Selecciona tipo de operación y centro de costo</td>
        </tr>
    `;
    
    document.getElementById('divCcostoDestino').style.display = 'none';
    
    const btn = document.getElementById('btnGuardarMovimientos');
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.textContent = '💾 Guardar Movimientos';
}
