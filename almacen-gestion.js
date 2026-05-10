// ================================================================
// ALMACÉN - GESTIÓN DE INVENTARIO
// Registrar movimientos: Ajustes, Entradas, Salidas, Traslados
// ================================================================

const API_BASE_ALMACEN = 'https://inventario-app-production-e8c8.up.railway.app/api';
let productosActivos = [];

// ================================================================
// CARGAR MÓDULO DE GESTIÓN
// ================================================================

function cargarGestionInventario() {
    const contentDiv = document.getElementById('gestionContent');
    
    contentDiv.innerHTML = `
        <div class="table-container">
            <div class="filters-container">
                <div class="filter-group">
                    <label class="filter-label">Fecha *</label>
                    <input type="date" id="fechaMovimiento" class="filter-input">
                </div>
                
                <div class="filter-group">
                    <label class="filter-label">Tipo de Operación *</label>
                    <select id="tipoOperacion" onchange="cambiarTipoOperacion()" class="filter-select">
                        <option value="">Seleccione...</option>
                        <option value="ENTRADA A ALMACEN">ENTRADA A ALMACEN</option>
                        <option value="SALIDA DE ALMACEN">SALIDA DE ALMACEN</option>
                        <option value="TRANSFERENCIA ENTRE ALMACENES">TRANSFERENCIA ENTRE ALMACENES</option>
                    </select>
                </div>
                
                <div class="filter-group" id="ccOrigenGroup">
                    <label class="filter-label">Centro de Costo Origen *</label>
                    <select id="ccOrigen" onchange="cargarGridGestion()" class="filter-select">
                        <option value="">Seleccione...</option>
                    </select>
                </div>
                
                <div class="filter-group" id="ccDestinoGroup" style="display: none;">
                    <label class="filter-label">Centro de Costo Destino *</label>
                    <select id="ccDestino" class="filter-select">
                        <option value="">Seleccione...</option>
                    </select>
                </div>
                
                <div class="filter-group full-width">
                    <label class="filter-label">Observaciones</label>
                    <input type="text" id="observaciones" class="filter-input" placeholder="Comentarios del movimiento...">
                </div>
            </div>

            <div style="overflow-x: auto;">
                <table class="grid-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Producto</th>
                            <th>Unidad</th>
                            <th style="text-align: right;">Stock Actual</th>
                            <th style="text-align: right;">Cantidad</th>
                        </tr>
                    </thead>
                    <tbody id="gridBodyGestion">
                        <tr>
                            <td colspan="5" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                                Seleccione fecha, tipo de operación y centro de costo para comenzar
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div style="padding: 1.5rem; border-top: 2px solid var(--border); display: flex; justify-content: flex-end; gap: 1rem;">
                <button class="btn btn-secondary" onclick="limpiarGridGestion()">❌ Cancelar</button>
                <button class="btn btn-primary" onclick="guardarMovimiento()">💾 Registrar Movimiento</button>
            </div>
        </div>
    `;
    
    // Establecer fecha de hoy
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaMovimiento').value = hoy;
    
    cargarCCostosGestion();
}

// ================================================================
// CAMBIAR TIPO DE OPERACIÓN
// ================================================================

function cambiarTipoOperacion() {
    const tipo = document.getElementById('tipoOperacion').value;
    const ccDestinoGroup = document.getElementById('ccDestinoGroup');
    
    // Mostrar CC Destino solo si es TRANSFERENCIA
    if (tipo === 'TRANSFERENCIA ENTRE ALMACENES') {
        ccDestinoGroup.style.display = 'block';
    } else {
        ccDestinoGroup.style.display = 'none';
    }
    
    // Limpiar grid
    const gridBody = document.getElementById('gridBodyGestion');
    gridBody.innerHTML = `
        <tr>
            <td colspan="5" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                Seleccione el centro de costo origen para cargar productos
            </td>
        </tr>
    `;
}

// ================================================================
// CARGAR CENTROS DE COSTO
// ================================================================

async function cargarCCostosGestion() {
    try {
        const response = await fetch(`${API_BASE_ALMACEN}/ccostos?empresa=${sesion.empresa}`);
        const data = await response.json();
        
        const selectOrigen = document.getElementById('ccOrigen');
        const selectDestino = document.getElementById('ccDestino');
        
        selectOrigen.innerHTML = '<option value="">Seleccione...</option>';
        selectDestino.innerHTML = '<option value="">Seleccione...</option>';
        
        if (data.success && data.data) {
            data.data.forEach(cc => {
                const optionOrigen = document.createElement('option');
                optionOrigen.value = cc.codigo;
                optionOrigen.textContent = cc.nombre;
                selectOrigen.appendChild(optionOrigen);
                
                const optionDestino = document.createElement('option');
                optionDestino.value = cc.codigo;
                optionDestino.textContent = cc.nombre;
                selectDestino.appendChild(optionDestino);
            });
        }
    } catch (error) {
        console.error('Error cargando centros de costo:', error);
        alert('❌ Error al cargar centros de costo');
    }
}

// ================================================================
// CARGAR GRID CON TODOS LOS PRODUCTOS ACTIVOS
// ================================================================

async function cargarGridGestion() {
    const tipo = document.getElementById('tipoOperacion').value;
    const ccOrigen = document.getElementById('ccOrigen').value;
    const gridBody = document.getElementById('gridBodyGestion');
    
    if (!tipo) {
        alert('❌ Debe seleccionar el tipo de operación');
        return;
    }
    
    if (!ccOrigen) {
        gridBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    Seleccione el centro de costo origen para cargar productos
                </td>
            </tr>
        `;
        return;
    }
    
    gridBody.innerHTML = `
        <tr>
            <td colspan="5" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                Cargando productos...
            </td>
        </tr>
    `;
    
    try {
        // Cargar inventario del ccOrigen (solo productos en estado ACTIVO)
        const stockResponse = await fetch(`${API_BASE_ALMACEN}/inventario?empresa=${sesion.empresa}&ccosto=${ccOrigen}&estado=ACTIVO`);
        const stockData = await stockResponse.json();
        
        if (stockData.success && stockData.data && stockData.data.length > 0) {
            // Crear array de productos desde el inventario
            productosActivos = stockData.data.map(item => ({
                codigo: item.codigo,
                nombre: item.nombre,
                unidad: item.unidad || 'UN',
                stock_actual: parseFloat(item.stock_actual) || 0
            }));
            
            // Crear mapa de stock
            const stockMap = {};
            stockData.data.forEach(item => {
                stockMap[item.codigo] = parseFloat(item.stock_actual) || 0;
            });
            
            // Renderizar grid
            renderizarGridGestion(productosActivos, stockMap);
        } else {
            gridBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                        No se encontraron productos en este centro de costo
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error cargando grid:', error);
        alert('❌ Error al cargar productos');
        gridBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 3rem; color: var(--danger);">
                    Error al cargar productos
                </td>
            </tr>
        `;
    }
}

// ================================================================
// RENDERIZAR GRID
// ================================================================

function renderizarGridGestion(productos, stockMap) {
    const gridBody = document.getElementById('gridBodyGestion');
    
    if (productos.length === 0) {
        gridBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    No hay productos para mostrar
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    productos.forEach(producto => {
        const stockActual = producto.stock_actual || stockMap[producto.codigo] || 0;
        
        html += `
            <tr data-codigo="${producto.codigo}">
                <td style="font-family: 'JetBrains Mono', monospace; font-weight: 600;">${producto.codigo}</td>
                <td>${producto.nombre || producto.descripcion}</td>
                <td>${producto.unidad || '-'}</td>
                <td style="text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 600; color: var(--text-secondary);">
                    ${formatearNumeroGestion(stockActual)}
                </td>
                <td style="text-align: right;">
                    <input 
                        type="text" 
                        class="input-cantidad" 
                        data-codigo="${producto.codigo}"
                        placeholder=""
                        onblur="formatearInputGestion(this)"
                        onfocus="limpiarFormatoGestion(this)"
                    >
                </td>
            </tr>
        `;
    });
    
    gridBody.innerHTML = html;
}

// ================================================================
// FORMATEAR INPUT AL SALIR (onblur)
// ================================================================

function formatearInputGestion(input) {
    const value = input.value.trim();
    
    if (value === '' || value === '0' || value === '0.00') {
        input.value = '';
        return;
    }
    
    const numero = parseFloat(value);
    
    if (isNaN(numero)) {
        input.value = '';
        return;
    }
    
    // Formato con 2 decimales
    input.value = numero.toFixed(2);
}

// ================================================================
// LIMPIAR FORMATO AL ENTRAR (onfocus)
// ================================================================

function limpiarFormatoGestion(input) {
    // No hace nada, deja el valor tal cual para que el usuario lo edite
}

// ================================================================
// FORMATEAR NÚMERO PARA DISPLAY
// ================================================================

function formatearNumeroGestion(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
}

// ================================================================
// FILTRAR GRID
// ================================================================

function filtrarGridGestion(busqueda) {
    const termino = busqueda.toLowerCase().trim();
    const filas = document.querySelectorAll('#gridBodyGestion tr[data-codigo]');
    
    filas.forEach(fila => {
        const codigo = fila.querySelector('td:first-child').textContent.toLowerCase();
        const nombre = fila.querySelector('td:nth-child(2)').textContent.toLowerCase();
        
        if (codigo.includes(termino) || nombre.includes(termino)) {
            fila.style.display = '';
        } else {
            fila.style.display = 'none';
        }
    });
}

// ================================================================
// LIMPIAR GRID
// ================================================================

function limpiarGridGestion() {
    const inputs = document.querySelectorAll('.input-cantidad');
    inputs.forEach(input => {
        input.value = '';
    });
}

// ================================================================
// GUARDAR MOVIMIENTO
// ================================================================

async function guardarMovimiento() {
    const fecha = document.getElementById('fechaMovimiento').value;
    const tipo = document.getElementById('tipoOperacion').value;
    const ccOrigen = document.getElementById('ccOrigen').value;
    const ccDestino = document.getElementById('ccDestino').value;
    const observaciones = document.getElementById('observaciones').value.trim();
    
    // Validar campos
    if (!fecha) {
        alert('❌ La fecha es obligatoria');
        return;
    }
    
    if (!tipo) {
        alert('❌ El tipo de operación es obligatorio');
        return;
    }
    
    if (!ccOrigen) {
        alert('❌ El centro de costo origen es obligatorio');
        return;
    }
    
    if (tipo === 'TRANSFERENCIA ENTRE ALMACENES' && !ccDestino) {
        alert('❌ El centro de costo destino es obligatorio para transferencias');
        return;
    }
    
    if (tipo === 'TRANSFERENCIA ENTRE ALMACENES' && ccOrigen === ccDestino) {
        alert('❌ El centro de costo origen y destino no pueden ser iguales');
        return;
    }
    
    // Recolectar productos con cantidad
    const inputs = document.querySelectorAll('.input-cantidad');
    const productos = [];
    
    inputs.forEach(input => {
        const value = input.value.trim();
        if (value !== '') {
            const cantidad = parseFloat(value);
            if (!isNaN(cantidad) && cantidad > 0) {
                productos.push({
                    producto: input.dataset.codigo,
                    cantidad: cantidad
                });
            }
        }
    });
    
    if (productos.length === 0) {
        alert('❌ Debe ingresar al menos un producto con cantidad');
        return;
    }
    
    if (!confirm(`¿Confirmas registrar ${tipo} de ${productos.length} producto(s)?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_ALMACEN}/movimientos/registrar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                empresa: sesion.empresa,
                fecha: fecha,
                tipo: tipo,
                ccOrigen: ccOrigen,
                ccDestino: ccDestino || null,
                observaciones: observaciones,
                productos: productos
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`✅ Movimiento registrado exitosamente\n\nTipo: ${tipo}\nProductos: ${productos.length}`);
            limpiarGridGestion();
            cargarGridGestion(); // Recargar stock
        } else {
            alert(`❌ Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error guardando movimiento:', error);
        alert('❌ Error al registrar movimiento');
    }
}
