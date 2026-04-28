// ================================================================
// TESORERÍA - FACTURAS DE COMPRA (CLIENTE)
// ================================================================

const API_BASE_FACTURAS = 'https://inventario-app-production-e8c8.up.railway.app/api';
let facturasCompraData = [];

function cargarFacturasCompra() {
    const contentDiv = document.getElementById('facturasCompraContent');
    
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), 0, 1); // 1 de enero del año actual
    const ultimoDia = new Date(hoy.getFullYear(), 11, 31); // 31 de diciembre
    
    const fechaDesdeStr = primerDia.toISOString().split('T')[0];
    const fechaHastaStr = ultimoDia.toISOString().split('T')[0];
    
    contentDiv.innerHTML = `
        <!-- FILTROS -->
        <div style="background: var(--bg-card); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; border: 1px solid var(--border);">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                <div>
                    <label style="display: block; margin-bottom: 0.4rem; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Fecha Desde</label>
                    <input type="date" id="fechaDesdeFC" value="${fechaDesdeStr}" style="width: 100%; padding: 0.7rem; background: var(--bg); border: 2px solid var(--border); border-radius: 6px; color: var(--text); font-size: 0.9rem;">
                </div>

                <div>
                    <label style="display: block; margin-bottom: 0.4rem; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Fecha Hasta</label>
                    <input type="date" id="fechaHastaFC" value="${fechaHastaStr}" style="width: 100%; padding: 0.7rem; background: var(--bg); border: 2px solid var(--border); border-radius: 6px; color: var(--text); font-size: 0.9rem;">
                </div>

                <div>
                    <label style="display: block; margin-bottom: 0.4rem; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Estado</label>
                    <select id="estadoFC" style="width: 100%; padding: 0.7rem; background: var(--bg); border: 2px solid var(--border); border-radius: 6px; color: var(--text); font-size: 0.9rem;">
                        <option value="TODOS">TODOS</option>
                        <option value="PENDIENTE" selected>PENDIENTE</option>
                        <option value="PAGADA">PAGADA</option>
                        <option value="POR VERIFICAR">POR VERIFICAR</option>
                    </select>
                </div>

                <div style="display: flex; align-items: flex-end;">
                    <button onclick="buscarFacturasCompra()" style="width: 100%; padding: 0.7rem 1.5rem; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; border: none; border-radius: 6px; font-size: 0.9rem; font-weight: 700; cursor: pointer; text-transform: uppercase; transition: all 0.3s;">
                        🔍 Buscar
                    </button>
                </div>
            </div>
        </div>

        <!-- GRID DE FACTURAS -->
        <div id="gridFacturasCompra"></div>
    `;

    // Cargar facturas pendientes por defecto
    buscarFacturasCompra();
}

async function buscarFacturasCompra() {
    const fechaDesde = document.getElementById('fechaDesdeFC').value;
    const fechaHasta = document.getElementById('fechaHastaFC').value;
    const estado = document.getElementById('estadoFC').value;

    try {
        const response = await fetch(
            `${API_BASE_FACTURAS}/facturas-compra?empresa=${sesion.empresa}&fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}&estado=${estado}`
        );
        const data = await response.json();

        if (data.success) {
            facturasCompraData = data.data;
            renderFacturasCompra();
        }
    } catch (error) {
        console.error('Error cargando facturas:', error);
    }
}

function renderFacturasCompra() {
    const gridDiv = document.getElementById('gridFacturasCompra');

    if (facturasCompraData.length === 0) {
        gridDiv.innerHTML = `
            <div style="background: var(--bg-card); border-radius: 12px; padding: 3rem; border: 1px solid var(--border); text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
                <h3 style="color: var(--text-secondary); font-weight: 600;">No se encontraron facturas</h3>
                <p style="color: var(--text-secondary); margin-top: 0.5rem; font-size: 0.9rem;">Intenta con otros filtros</p>
            </div>
        `;
        return;
    }

    let htmlGrid = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
    `;

    facturasCompraData.forEach(factura => {
        const fechaParts = factura.fecha.split('T')[0].split('-');
        const fechaFactura = `${fechaParts[2]}/${fechaParts[1]}/${fechaParts[0]}`;

        const venceParts = factura.fecha_vencimiento.split('T')[0].split('-');
        const fechaVence = `${venceParts[2]}/${venceParts[1]}/${venceParts[0]}`;

        // Calcular días vencidos
        const hoy = new Date();
        const vencimiento = new Date(factura.fecha_vencimiento);
        const diffTime = hoy - vencimiento;
        const diasVencidos = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Color del estado
        let estadoColor = '';
        let estadoIcon = '';
        if (factura.estado === 'PENDIENTE') {
            estadoColor = diasVencidos > 0 ? 'var(--danger)' : 'var(--warning)';
            estadoIcon = diasVencidos > 0 ? '🔴' : '🟡';
        } else if (factura.estado === 'PAGADA') {
            estadoColor = 'var(--success)';
            estadoIcon = '🟢';
        } else {
            estadoColor = '#60a5fa';
            estadoIcon = '🔵';
        }

        htmlGrid += `
            <div style="background: var(--bg-card); border-radius: 12px; padding: 1.5rem; border: 1px solid var(--border); transition: all 0.3s; cursor: pointer;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 24px rgba(139,92,246,0.2)'" onmouseout="this.style.transform=''; this.style.boxShadow=''">
                <!-- HEADER -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
                    <div>
                        <div style="font-size: 0.7rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem;">Factura</div>
                        <div style="font-size: 1.1rem; font-weight: 800; font-family: 'Courier New', monospace; color: var(--primary);">${factura.codigo}</div>
                    </div>
                    <div style="background: ${estadoColor}15; padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid ${estadoColor}30;">
                        <div style="font-size: 0.85rem; font-weight: 700; color: ${estadoColor};">${estadoIcon} ${factura.estado}</div>
                    </div>
                </div>

                <!-- DETALLES -->
                <div style="display: grid; gap: 0.75rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1rem;">📅</span>
                        <div>
                            <div style="font-size: 0.7rem; color: var(--text-secondary);">Fecha</div>
                            <div style="font-size: 0.9rem; font-weight: 600;">${fechaFactura}</div>
                        </div>
                    </div>

                    ${factura.orden_compra ? `
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1rem;">🧾</span>
                        <div>
                            <div style="font-size: 0.7rem; color: var(--text-secondary);">Orden de Compra</div>
                            <div style="font-size: 0.85rem; font-weight: 600; font-family: 'Courier New', monospace;">${factura.orden_compra}</div>
                        </div>
                    </div>
                    ` : ''}

                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1rem;">📆</span>
                        <div>
                            <div style="font-size: 0.7rem; color: var(--text-secondary);">Fecha Vencimiento</div>
                            <div style="font-size: 0.9rem; font-weight: 600;">${fechaVence}</div>
                        </div>
                    </div>

                    ${diasVencidos > 0 && factura.estado === 'PENDIENTE' ? `
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1rem;">⏰</span>
                        <div>
                            <div style="font-size: 0.7rem; color: var(--text-secondary);">Días Vencidos</div>
                            <div style="font-size: 0.9rem; font-weight: 700; color: var(--danger);">${diasVencidos} día${diasVencidos !== 1 ? 's' : ''}</div>
                        </div>
                    </div>
                    ` : ''}

                    <div style="margin-top: 0.5rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;">Total</div>
                            <div style="font-size: 1.5rem; font-weight: 800; font-family: 'Courier New', monospace; color: var(--primary);">${formatMoneyFC(factura.total)}</div>
                        </div>
                    </div>
                </div>

                ${factura.observaciones ? `
                <div style="margin-top: 1rem; padding: 0.75rem; background: var(--bg); border-radius: 6px; border: 1px solid var(--border);">
                    <div style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 0.25rem; text-transform: uppercase;">Observaciones</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">${factura.observaciones}</div>
                </div>
                ` : ''}

                <!-- BOTÓN VER -->
                <div style="margin-top: 1rem;">
                    <button onclick="verDetalleFactura('${factura.codigo}')" style="width: 100%; padding: 0.75rem; background: rgba(139, 92, 246, 0.1); color: var(--primary); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 6px; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.background='rgba(139, 92, 246, 0.2)'" onmouseout="this.style.background='rgba(139, 92, 246, 0.1)'">
                        👁️ Ver Detalles
                    </button>
                </div>
            </div>
        `;
    });

    htmlGrid += `</div>`;

    // Resumen
    const totalFacturas = facturasCompraData.length;
    const totalMonto = facturasCompraData.reduce((sum, f) => sum + parseFloat(f.total || 0), 0);
    const pendientes = facturasCompraData.filter(f => f.estado === 'PENDIENTE').length;

    htmlGrid = `
        <div style="background: var(--bg-card); border-radius: 12px; padding: 1rem; border: 1px solid var(--border); margin-bottom: 1.5rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
            <div style="text-align: center;">
                <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem;">Total Facturas</div>
                <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary);">${totalFacturas}</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem;">Pendientes</div>
                <div style="font-size: 1.5rem; font-weight: 800; color: var(--warning);">${pendientes}</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem;">Monto Total</div>
                <div style="font-size: 1.25rem; font-weight: 800; font-family: 'Courier New', monospace; color: var(--success);">${formatMoneyFC(totalMonto)}</div>
            </div>
        </div>
    ` + htmlGrid;

    gridDiv.innerHTML = htmlGrid;
}

function verDetalleFactura(codigo) {
    alert(`Ver detalle de factura ${codigo}\n\n(Módulo de detalles en desarrollo)`);
}

function formatMoneyFC(value) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(parseFloat(value || 0));
}
