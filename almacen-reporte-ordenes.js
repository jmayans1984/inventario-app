// ================================================================
// ALMACÉN - REPORTE ÓRDENES DE COMPRA
// ================================================================

const API_BASE_REPORTE_OC = 'https://inventario-app-production-e8c8.up.railway.app/api';

// ================================================================
// CARGAR MÓDULO DE REPORTE
// ================================================================

function cargarReporteOrdenes() {
    const contentDiv = document.getElementById('gestionContent');

    contentDiv.innerHTML = `
        <div class="table-container">
            <div class="filters-container">
                <div class="filter-group">
                    <label class="filter-label">Fecha Desde</label>
                    <input type="date" id="fechaDesdeOrdenes" class="filter-input">
                </div>

                <div class="filter-group">
                    <label class="filter-label">Fecha Hasta</label>
                    <input type="date" id="fechaHastaOrdenes" class="filter-input">
                </div>

                <div class="filter-group">
                    <label class="filter-label">Estado</label>
                    <select id="estadoOrdenes" class="filter-select">
                        <option value="">Todos</option>
                        <option value="PENDIENTE">PENDIENTE</option>
                        <option value="ENTREGADA">ENTREGADA</option>
                        <option value="FACTURADA">FACTURADA</option>
                    </select>
                </div>

                <div style="display: flex; gap: 1rem;">
                    <button class="btn btn-primary" onclick="filtrarOrdenesCompra()" style="flex: 1;">🔍 Buscar</button>
                    <button class="btn btn-secondary" onclick="limpiarFiltrosOrdenes()" style="flex: 1;">🔄 Limpiar</button>
                </div>
            </div>

            <div id="gridOrdenesCompra" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
                <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-secondary);">
                    Selecciona filtros y presiona Buscar
                </div>
            </div>
        </div>
    `;

    // Establecer fechas por defecto (mes actual)
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    document.getElementById('fechaDesdeOrdenes').value = primerDia.toISOString().split('T')[0];
    document.getElementById('fechaHastaOrdenes').value = hoy.toISOString().split('T')[0];
}

// ================================================================
// FILTRAR ÓRDENES DE COMPRA
// ================================================================

async function filtrarOrdenesCompra() {
    const fechaDesde = document.getElementById('fechaDesdeOrdenes').value;
    const fechaHasta = document.getElementById('fechaHastaOrdenes').value;
    const estado = document.getElementById('estadoOrdenes').value;
    const grid = document.getElementById('gridOrdenesCompra');

    grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-secondary);">
            Cargando órdenes...
        </div>
    `;

    try {
        let url = `${API_BASE_REPORTE_OC}/ordenes-compra?empresa=${sesion.empresa}`;

        if (fechaDesde) url += `&fechaDesde=${fechaDesde}`;
        if (fechaHasta) url += `&fechaHasta=${fechaHasta}`;
        if (estado) url += `&estado=${estado}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
            renderizarTarjetasOrdenes(data.data);
        } else {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No se encontraron órdenes de compra
                </div>
            `;
        }
    } catch (error) {
        console.error('Error filtrando órdenes:', error);
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--danger);">
                Error al cargar órdenes
            </div>
        `;
    }
}

// ================================================================
// RENDERIZAR TARJETAS
// ================================================================

function renderizarTarjetasOrdenes(ordenes) {
    const grid = document.getElementById('gridOrdenesCompra');
    let html = '';

    ordenes.forEach(orden => {
        const colorEstado = obtenerColorEstado(orden.estado);
        const fechaFormato = new Date(orden.fecha).toLocaleDateString('es-CO');
        const fechaEntregaFormato = orden.fecha_entrega ? new Date(orden.fecha_entrega).toLocaleDateString('es-CO') : '-';

        html += `
            <div style="
                background: var(--bg-secondary);
                border: 1px solid var(--border);
                border-radius: 8px;
                padding: 1.5rem;
                position: relative;
                overflow: hidden;
            ">
                <!-- ESTADO EN ESQUINA SUPERIOR -->
                <div style="
                    position: absolute;
                    top: 0;
                    right: 0;
                    background: ${colorEstado};
                    color: white;
                    padding: 0.5rem 1rem;
                    font-size: 0.8rem;
                    font-weight: 700;
                    border-radius: 0 8px 0 8px;
                ">
                    ${orden.estado}
                </div>

                <!-- CÓDIGO ORDEN -->
                <div style="
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: var(--success);
                    margin-bottom: 1rem;
                    margin-right: 6rem;
                ">
                    ${orden.codigo}
                </div>

                <!-- INFORMACIÓN -->
                <div style="display: grid; gap: 0.75rem; margin-bottom: 1.5rem;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <span style="font-size: 0.85rem; color: var(--text-secondary);">Fecha</span>
                            <div style="font-weight: 600; color: var(--text-primary);">${fechaFormato}</div>
                        </div>
                        <div>
                            <span style="font-size: 0.85rem; color: var(--text-secondary);">Entrega</span>
                            <div style="font-weight: 600; color: var(--text-primary);">${fechaEntregaFormato}</div>
                        </div>
                    </div>
                    <div>
                        <span style="font-size: 0.85rem; color: var(--text-secondary);">Total</span>
                        <div style="font-size: 1.2rem; font-weight: 700; color: var(--accent); font-family: 'JetBrains Mono', monospace;">
                            ${parseFloat(orden.total).toFixed(2)}
                        </div>
                    </div>
                </div>

                <!-- BOTONES -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                    <button class="btn btn-primary" onclick="verDetallesOrden('${orden.codigo}')" style="font-size: 0.9rem; padding: 0.5rem;">Ver Detalles</button>
                    <button class="btn btn-secondary" onclick="mostrarSoporteEntrega('${orden.codigo}')" style="font-size: 0.9rem; padding: 0.5rem;">📦 Soporte</button>
                    <button class="btn btn-secondary" onclick="editarOrden('${orden.codigo}')" style="font-size: 0.9rem; padding: 0.5rem; ${orden.estado !== 'PENDIENTE' ? 'opacity: 0.5; cursor: not-allowed;' : ''}" ${orden.estado !== 'PENDIENTE' ? 'disabled' : ''}>✏️ Editar</button>
                    <button class="btn btn-secondary" onclick="verFacturaOrden('${orden.codigo}')" style="font-size: 0.9rem; padding: 0.5rem;">📄 Factura</button>
                    <button class="btn btn-danger" onclick="eliminarOrden('${orden.codigo}')" style="font-size: 0.9rem; padding: 0.5rem; grid-column: 1/-1;">🗑️ Eliminar</button>
                </div>
            </div>
        `;
    });

    grid.innerHTML = html;
}

// ================================================================
// OBTENER COLOR DEL ESTADO
// ================================================================

function obtenerColorEstado(estado) {
    switch (estado) {
        case 'PENDIENTE':
            return 'var(--warning)';
        case 'ENTREGADA':
            return 'var(--info)';
        case 'FACTURADA':
            return 'var(--success)';
        default:
            return 'var(--text-secondary)';
    }
}

// ================================================================
// ACCIONES DE BOTONES
// ================================================================

async function verDetallesOrden(codigo) {
    try {
        const response = await fetch(`${API_BASE_REPORTE_OC}/ordenes-compra/${codigo}/detalles`);
        const data = await response.json();

        if (data.success) {
            mostrarModalDetallesOrden(data.orden, data.detalles);
        } else {
            alert('❌ Error al obtener detalles');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al obtener detalles');
    }
}

function mostrarModalDetallesOrden(orden, detalles) {
    const fechaFormato = new Date(orden.fecha).toLocaleDateString('es-CO');
    const fechaEntregaFormato = orden.fecha_entrega ? new Date(orden.fecha_entrega).toLocaleDateString('es-CO') : '-';

    let detallesHTML = '';

    detalles.forEach(detalle => {
        const subtotal = parseFloat(detalle.subtotal) || 0;

        detallesHTML += `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 0.75rem; font-family: 'JetBrains Mono', monospace; font-weight: 600;">${detalle.producto_venta}</td>
                <td style="padding: 0.75rem;">${detalle.producto_nombre || '-'}</td>
                <td style="padding: 0.75rem; text-align: right;">${parseFloat(detalle.cantidad).toFixed(2)}</td>
                <td style="padding: 0.75rem; text-align: right; font-family: 'JetBrains Mono', monospace;">${parseFloat(detalle.precio_unitario).toFixed(2)}</td>
                <td style="padding: 0.75rem; text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 600;">${subtotal.toFixed(2)}</td>
            </tr>
        `;
    });

    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: var(--bg-primary);
        border-radius: 8px;
        padding: 2rem;
        max-width: 900px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;

    content.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2 style="color: var(--text-primary); margin: 0;">Detalles de Orden</h2>
            <button style="
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: var(--text-secondary);
            ">✕</button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 2px solid var(--border);">
            <div>
                <span style="font-size: 0.85rem; color: var(--text-secondary);">Código Orden</span>
                <div style="font-size: 1.1rem; font-weight: 700; color: var(--success); font-family: 'JetBrains Mono', monospace;">${orden.codigo}</div>
            </div>
            <div>
                <span style="font-size: 0.85rem; color: var(--text-secondary);">Fecha</span>
                <div style="font-weight: 600; color: var(--text-primary);">${fechaFormato}</div>
            </div>
            <div>
                <span style="font-size: 0.85rem; color: var(--text-secondary);">Fecha Entrega</span>
                <div style="font-weight: 600; color: var(--text-primary);">${fechaEntregaFormato}</div>
            </div>
        </div>

        <h3 style="color: var(--text-primary); margin: 1.5rem 0 1rem;">Productos</h3>
        <div style="overflow-x: auto; margin-bottom: 1.5rem;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: var(--bg-secondary); font-weight: 700;">
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--border);">Código</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--border);">Producto</th>
                        <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid var(--border);">Cantidad</th>
                        <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid var(--border);">Precio</th>
                        <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid var(--border);">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${detallesHTML}
                </tbody>
            </table>
        </div>

        <div style="text-align: right; padding-top: 1rem; border-top: 2px solid var(--border);">
            <div style="font-size: 1.3rem; font-weight: 700; color: var(--accent); font-family: 'JetBrains Mono', monospace;">
                Total: ${parseFloat(orden.total).toFixed(2)}
            </div>
        </div>

        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
            <button class="btn btn-secondary" style="flex: 1;">Cerrar</button>
        </div>
    `;

    modal.appendChild(content);

    // Cerrar al hacer click en X
    content.querySelector('button:first-of-type').addEventListener('click', () => {
        modal.remove();
    });

    // Cerrar al hacer click en el overlay
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // Cerrar al hacer click en botón Cerrar
    content.querySelector('button:last-of-type').addEventListener('click', () => {
        modal.remove();
    });

    document.body.appendChild(modal);
}

function mostrarSoporteEntrega(codigo) {
    alert(`Soporte entrega para: ${codigo}\n\n(Funcionalidad pendiente)`);
}

async function editarOrden(codigo) {
    try {
        const response = await fetch(`${API_BASE_REPORTE_OC}/ordenes-compra/${codigo}`);
        const data = await response.json();

        if (data.success) {
            mostrarModalEditarOrden(data.orden);
        } else {
            console.error('Error del servidor:', data);
            alert(`❌ ${data.error || 'Error al obtener orden'}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert(`❌ Error al obtener orden: ${error.message}`);
    }
}

function mostrarModalEditarOrden(orden) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;

    const fechaEntrega = orden.fecha_entrega ? orden.fecha_entrega.split('T')[0] : '';

    modal.innerHTML = `
        <div style="
            background: var(--bg-primary);
            border-radius: 8px;
            padding: 2rem;
            max-width: 600px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="color: var(--text-primary); margin: 0;">Editar Orden</h2>
                <button onclick="this.closest('div').parentElement.remove()" style="
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: var(--text-secondary);
                ">✕</button>
            </div>

            <div style="display: grid; gap: 1.5rem; margin-bottom: 2rem;">
                <div>
                    <label style="display: block; font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Código</label>
                    <input type="text" value="${orden.codigo}" readonly style="
                        width: 100%;
                        padding: 0.75rem;
                        border: 1px solid var(--border);
                        border-radius: 6px;
                        background: var(--bg-secondary);
                        color: var(--text-primary);
                        font-family: 'JetBrains Mono', monospace;
                        font-weight: 600;
                        cursor: not-allowed;
                    ">
                </div>

                <div>
                    <label style="display: block; font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Fecha de Entrega</label>
                    <input type="date" id="editFechaEntrega" value="${fechaEntrega}" style="
                        width: 100%;
                        padding: 0.75rem;
                        border: 1px solid var(--border);
                        border-radius: 6px;
                        background: var(--bg-secondary);
                        color: var(--text-primary);
                    ">
                </div>

                <div>
                    <label style="display: block; font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Estado</label>
                    <select id="editEstado" style="
                        width: 100%;
                        padding: 0.75rem;
                        border: 1px solid var(--border);
                        border-radius: 6px;
                        background: var(--bg-secondary);
                        color: var(--text-primary);
                    ">
                        <option value="PENDIENTE" ${orden.estado === 'PENDIENTE' ? 'selected' : ''}>PENDIENTE</option>
                        <option value="ENTREGADA" ${orden.estado === 'ENTREGADA' ? 'selected' : ''}>ENTREGADA</option>
                        <option value="FACTURADA" ${orden.estado === 'FACTURADA' ? 'selected' : ''}>FACTURADA</option>
                    </select>
                </div>

                <div>
                    <label style="display: block; font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Observaciones</label>
                    <textarea id="editObservaciones" style="
                        width: 100%;
                        padding: 0.75rem;
                        border: 1px solid var(--border);
                        border-radius: 6px;
                        background: var(--bg-secondary);
                        color: var(--text-primary);
                        font-family: monospace;
                        min-height: 100px;
                        text-transform: uppercase;
                        resize: vertical;
                    ">${orden.observaciones || ''}</textarea>
                </div>
            </div>

            <div style="display: flex; gap: 1rem;">
                <button onclick="this.closest('div').parentElement.remove()" class="btn btn-secondary" style="flex: 1;">Cancelar</button>
                <button onclick="guardarEdicionOrden('${orden.codigo}')" class="btn btn-primary" style="flex: 1;">💾 Guardar Cambios</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

async function guardarEdicionOrden(codigo) {
    const fechaEntrega = document.getElementById('editFechaEntrega').value;
    const estado = document.getElementById('editEstado').value;
    const observaciones = document.getElementById('editObservaciones').value.toUpperCase();

    try {
        const response = await fetch(`${API_BASE_REPORTE_OC}/ordenes-compra/${codigo}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fecha_entrega: fechaEntrega || null,
                estado: estado,
                observaciones: observaciones
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Orden actualizada correctamente');
            document.querySelector('[style*="z-index: 1000"]').remove();
            filtrarOrdenesCompra(); // Recargar lista
        } else {
            alert(`❌ Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al guardar cambios');
    }
}

function verFacturaOrden(codigo) {
    alert(`Ver factura de orden: ${codigo}\n\n(Funcionalidad pendiente)`);
}

function eliminarOrden(codigo) {
    if (confirm(`¿Confirmas eliminar la orden ${codigo}?`)) {
        alert(`Eliminar orden: ${codigo}\n\n(Funcionalidad pendiente)`);
    }
}

// ================================================================
// LIMPIAR FILTROS
// ================================================================

function limpiarFiltrosOrdenes() {
    document.getElementById('fechaDesdeOrdenes').value = '';
    document.getElementById('fechaHastaOrdenes').value = '';
    document.getElementById('estadoOrdenes').value = '';
    document.getElementById('gridOrdenesCompra').innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-secondary);">
            Selecciona filtros y presiona Buscar
        </div>
    `;
}
