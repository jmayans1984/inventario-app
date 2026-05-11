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
                        <option value="POR FACTURAR">POR FACTURAR</option>
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
                    <button class="btn btn-secondary" onclick="editarOrden('${orden.codigo}')" style="font-size: 0.9rem; padding: 0.5rem;">✏️ Editar</button>
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
        case 'POR FACTURAR':
            return 'var(--accent)';
        case 'FACTURADA':
            return 'var(--success)';
        default:
            return 'var(--text-secondary)';
    }
}

// ================================================================
// ACCIONES DE BOTONES
// ================================================================

function verDetallesOrden(codigo) {
    alert(`Ver detalles de orden: ${codigo}\n\n(Funcionalidad pendiente)`);
}

function mostrarSoporteEntrega(codigo) {
    alert(`Soporte entrega para: ${codigo}\n\n(Funcionalidad pendiente)`);
}

function editarOrden(codigo) {
    alert(`Editar orden: ${codigo}\n\n(Funcionalidad pendiente)`);
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
