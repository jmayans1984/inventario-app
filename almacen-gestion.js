// ================================================================
// ALMACÉN - GESTIÓN DE INVENTARIO
// Actualización de cantidades por centro de costo
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
                    <label class="filter-label">Centro de Costo</label>
                    <select id="ccostoGestion" onchange="cargarGrid()" class="filter-select">
                        <option value="">Seleccione un centro de costo...</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Buscar Producto</label>
                    <input type="text" id="buscarProducto" onkeyup="filtrarGrid(this.value)" class="filter-input" placeholder="Nombre o código...">
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
                    <tbody id="gridBody">
                        <tr>
                            <td colspan="5" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                                Seleccione un centro de costo para comenzar
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div style="padding: 1.5rem; border-top: 2px solid var(--border); display: flex; justify-content: flex-end; gap: 1rem;">
                <button class="btn btn-secondary" onclick="limpiarGrid()">❌ Cancelar</button>
                <button class="btn btn-primary" onclick="guardarCambios()">💾 Guardar Cambios</button>
            </div>
        </div>
    `;
    
    cargarCCostosGestion();
}

// ================================================================
// CARGAR CENTROS DE COSTO
// ================================================================

async function cargarCCostosGestion() {
    try {
        const response = await fetch(`${API_BASE_ALMACEN}/ccostos?empresa=${sesion.empresa}`);
        const data = await response.json();
        
        const select = document.getElementById('ccostoGestion');
        select.innerHTML = '<option value="">Seleccione un centro de costo...</option>';
        
        if (data.success && data.ccostos) {
            data.ccostos.forEach(cc => {
                const option = document.createElement('option');
                option.value = cc.codigo;
                option.textContent = cc.nombre;
                select.appendChild(option);
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

async function cargarGrid() {
    const ccosto = document.getElementById('ccostoGestion').value;
    const gridBody = document.getElementById('gridBody');
    
    if (!ccosto) {
        gridBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    Seleccione un centro de costo para comenzar
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
        // Cargar TODOS los productos ACTIVOS
        const response = await fetch(`${API_BASE_ALMACEN}/productos?empresa=${sesion.empresa}&estado=ACTIVO`);
        const data = await response.json();
        
        if (data.success && data.productos) {
            productosActivos = data.productos;
            
            // Cargar stock actual del ccosto
            const stockResponse = await fetch(`${API_BASE_ALMACEN}/inventario?empresa=${sesion.empresa}&ccosto=${ccosto}`);
            const stockData = await stockResponse.json();
            
            // Crear mapa de stock
            const stockMap = {};
            if (stockData.success && stockData.inventario) {
                stockData.inventario.forEach(item => {
                    stockMap[item.producto] = parseFloat(item.cantidad) || 0;
                });
            }
            
            // Renderizar grid
            renderizarGrid(productosActivos, stockMap);
        } else {
            gridBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                        No se encontraron productos activos
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

function renderizarGrid(productos, stockMap) {
    const gridBody = document.getElementById('gridBody');
    
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
        const stockActual = stockMap[producto.codigo] || 0;
        
        html += `
            <tr data-codigo="${producto.codigo}">
                <td style="font-family: 'JetBrains Mono', monospace; font-weight: 600;">${producto.codigo}</td>
                <td>${producto.descripcion}</td>
                <td>${producto.unidad || '-'}</td>
                <td style="text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 600; color: var(--text-secondary);">
                    ${formatearNumero(stockActual)}
                </td>
                <td style="text-align: right;">
                    <input 
                        type="text" 
                        class="input-cantidad" 
                        data-codigo="${producto.codigo}"
                        placeholder=""
                        onblur="formatearInput(this)"
                        onfocus="limpiarFormato(this)"
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

function formatearInput(input) {
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

function limpiarFormato(input) {
    // No hace nada, deja el valor tal cual para que el usuario lo edite
}

// ================================================================
// FORMATEAR NÚMERO PARA DISPLAY
// ================================================================

function formatearNumero(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
}

// ================================================================
// FILTRAR GRID
// ================================================================

function filtrarGrid(busqueda) {
    const termino = busqueda.toLowerCase().trim();
    const filas = document.querySelectorAll('#gridBody tr[data-codigo]');
    
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

function limpiarGrid() {
    const inputs = document.querySelectorAll('.input-cantidad');
    inputs.forEach(input => {
        input.value = '';
    });
}

// ================================================================
// GUARDAR CAMBIOS
// ================================================================

async function guardarCambios() {
    const ccosto = document.getElementById('ccostoGestion').value;
    
    if (!ccosto) {
        alert('❌ Debe seleccionar un centro de costo');
        return;
    }
    
    // Recolectar cambios
    const inputs = document.querySelectorAll('.input-cantidad');
    const cambios = [];
    
    inputs.forEach(input => {
        const value = input.value.trim();
        if (value !== '') {
            const cantidad = parseFloat(value);
            if (!isNaN(cantidad) && cantidad !== 0) {
                cambios.push({
                    producto: input.dataset.codigo,
                    cantidad: cantidad
                });
            }
        }
    });
    
    if (cambios.length === 0) {
        alert('❌ No hay cambios para guardar');
        return;
    }
    
    if (!confirm(`¿Confirmas guardar ${cambios.length} cambio(s) en el inventario?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_ALMACEN}/inventario/actualizar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                empresa: sesion.empresa,
                ccosto: ccosto,
                cambios: cambios
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`✅ Inventario actualizado exitosamente\n\n${cambios.length} producto(s) actualizados`);
            cargarGrid(); // Recargar grid
        } else {
            alert(`❌ Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error guardando cambios:', error);
        alert('❌ Error al guardar cambios');
    }
}
