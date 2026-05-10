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
        let estadoTexto = factura.estado;

        if (factura.estado === 'PENDIENTE') {
            if (diasVencidos > 0) {
                estadoColor = 'var(--danger)';
                estadoIcon = '🔴';
                estadoTexto = 'VENCIDA';
            } else {
                estadoColor = 'var(--warning)';
                estadoIcon = '🟡';
            }
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
                        <div style="font-size: ${estadoTexto === 'VENCIDA' ? '1.1rem' : '0.85rem'}; font-weight: 800; color: ${estadoColor};">${estadoIcon} ${estadoTexto}</div>
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

                <!-- BOTONES -->
                <div style="margin-top: 1rem; display: grid; grid-template-columns: ${factura.estado === 'PENDIENTE' ? '1fr 1fr' : '1fr 1fr'}; gap: 0.75rem;">
                    <button onclick="verDetalleFactura('${factura.codigo}')" style="width: 100%; padding: 0.75rem; background: rgba(139, 92, 246, 0.1); color: var(--primary); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 6px; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.background='rgba(139, 92, 246, 0.2)'" onmouseout="this.style.background='rgba(139, 92, 246, 0.1)'">
                        👁️ Ver Detalles
                    </button>
                    ${factura.estado === 'PENDIENTE' ? `
                    <button onclick="abrirSubirSoporte('${factura.codigo}')" style="width: 100%; padding: 0.75rem; background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 6px; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.background='rgba(16, 185, 129, 0.2)'" onmouseout="this.style.background='rgba(16, 185, 129, 0.1)'">
                        📷 Subir Pago
                    </button>
                    ` : ''}
                    ${factura.estado === 'POR VERIFICAR' || factura.estado === 'PAGADA' ? `
                    <button onclick="verSoportePago('${factura.codigo}')" style="width: 100%; padding: 0.75rem; background: rgba(96, 165, 250, 0.1); color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.3); border-radius: 6px; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.background='rgba(96, 165, 250, 0.2)'" onmouseout="this.style.background='rgba(96, 165, 250, 0.1)'">
                        🖼️ Ver Soporte
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    });

    htmlGrid += `</div>`;

    // Resumen
    const totalFacturas = facturasCompraData.length;
    const totalMonto = facturasCompraData.reduce((sum, f) => sum + parseFloat(f.total || 0), 0);
    const pendientes = facturasCompraData.filter(f => f.estado === 'PENDIENTE').length;

    // Calcular monto pendiente y vencido
    let montoPendiente = 0;
    let montoVencido = 0;
    const hoy = new Date();

    facturasCompraData.forEach(f => {
        if (f.estado === 'PENDIENTE') {
            montoPendiente += parseFloat(f.total || 0);
            const vencimiento = new Date(f.fecha_vencimiento);
            if (hoy > vencimiento) {
                montoVencido += parseFloat(f.total || 0);
            }
        }
    });

    htmlGrid = `
        <div style="background: var(--bg-card); border-radius: 12px; padding: 1rem; border: 1px solid var(--border); margin-bottom: 1.5rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
            <div style="text-align: center;">
                <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem;">Total Facturas</div>
                <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary);">${totalFacturas}</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem;">Monto Pendiente</div>
                <div style="font-size: 1.2rem; font-weight: 800; font-family: 'Courier New', monospace; color: var(--warning);">${formatMoneyFC(montoPendiente)}</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem;">Monto Vencido</div>
                <div style="font-size: 1.2rem; font-weight: 800; font-family: 'Courier New', monospace; color: var(--danger);">${formatMoneyFC(montoVencido)}</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem;">Monto Total</div>
                <div style="font-size: 1.2rem; font-weight: 800; font-family: 'Courier New', monospace; color: var(--success);">${formatMoneyFC(totalMonto)}</div>
            </div>
        </div>
    ` + htmlGrid;

    gridDiv.innerHTML = htmlGrid;
}

function verDetalleFactura(codigo) {
    cargarDetalleFactura(codigo);
}

async function cargarDetalleFactura(codigoFactura) {
    try {
        const response = await fetch(
            `${API_BASE_FACTURAS}/facturas-compra/detalle?factura=${codigoFactura}`
        );
        const data = await response.json();

        if (data.success) {
            mostrarModalDetalle(data.factura, data.detalle);
        } else {
            alert('❌ Error al cargar detalle de factura');
        }
    } catch (error) {
        console.error('Error cargando detalle:', error);
        alert('❌ Error al cargar detalle de factura');
    }
}

function mostrarModalDetalle(factura, detalle) {
    const fechaParts = factura.fecha.split('T')[0].split('-');
    const fechaFactura = `${fechaParts[2]}/${fechaParts[1]}/${fechaParts[0]}`;

    const venceParts = factura.fecha_vencimiento.split('T')[0].split('-');
    const fechaVence = `${venceParts[2]}/${venceParts[1]}/${venceParts[0]}`;

    const hoy = new Date();
    const vencimiento = new Date(factura.fecha_vencimiento);
    const diffTime = hoy - vencimiento;
    const diasVencidos = Math.floor(diffTime / (1000 * 60 * 60 * 24));

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

    const modalHTML = `
        <div id="modalDetalle" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(10, 10, 15, 0.95); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; backdrop-filter: blur(4px);" onclick="cerrarModalDetalle(event)">
            <div style="background: var(--bg-card); border-radius: 12px; max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto; border: 2px solid var(--primary); box-shadow: 0 20px 60px rgba(139, 92, 246, 0.3);" onclick="event.stopPropagation()">
                
                <div style="padding: 1.5rem; border-bottom: 2px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.05));">
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.5rem;">📋 Factura de Compra</div>
                        <h2 style="font-size: 2rem; font-weight: 900; font-family: 'Courier New', monospace; color: var(--primary); margin: 0;">${factura.codigo}</h2>
                    </div>
                    <button onclick="cerrarModalDetalle()" style="background: rgba(139, 92, 246, 0.1); border: 2px solid var(--primary); color: var(--primary); width: 44px; height: 44px; border-radius: 8px; font-size: 1.5rem; cursor: pointer; font-weight: 700; transition: all 0.3s;" onmouseover="this.style.background='rgba(139, 92, 246, 0.2)'" onmouseout="this.style.background='rgba(139, 92, 246, 0.1)'">✕</button>
                </div>

                <div style="padding: 1.5rem; border-bottom: 1px solid var(--border);">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem;">
                        <div>
                            <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem; font-weight: 600;">📅 Fecha Factura</div>
                            <div style="font-size: 1rem; font-weight: 700;">${fechaFactura}</div>
                        </div>
                        ${factura.orden_compra ? `<div><div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem; font-weight: 600;">🧾 Orden de Compra</div><div style="font-size: 0.95rem; font-weight: 700; font-family: 'Courier New', monospace;">${factura.orden_compra}</div></div>` : ''}
                        <div>
                            <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem; font-weight: 600;">📆 Vencimiento</div>
                            <div style="font-size: 1rem; font-weight: 700;">${fechaVence}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem; font-weight: 600;">Estado</div>
                            <div style="display: inline-block; background: ${estadoColor}15; padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid ${estadoColor}30;"><span style="font-size: 0.95rem; font-weight: 700; color: ${estadoColor};">${estadoIcon} ${factura.estado}</span></div>
                        </div>
                    </div>
                    ${factura.observaciones ? `<div style="margin-top: 1rem; padding: 1rem; background: var(--bg); border-radius: 8px; border: 1px solid var(--border);"><div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem; font-weight: 600;">📝 Observaciones</div><div style="font-size: 0.9rem; line-height: 1.5;">${factura.observaciones}</div></div>` : ''}
                </div>

                <div style="padding: 1.5rem;">
                    <h3 style="font-size: 1rem; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 1rem;">📦 Detalle de Productos</h3>
                    <div style="overflow-x: auto; border-radius: 8px; border: 1px solid var(--border);">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                            <thead style="background: var(--bg);">
                                <tr>
                                    <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; border-bottom: 2px solid var(--border);">Producto</th>
                                    <th style="padding: 0.75rem 1rem; text-align: right; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; border-bottom: 2px solid var(--border);">Cantidad</th>
                                    <th style="padding: 0.75rem 1rem; text-align: right; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; border-bottom: 2px solid var(--border);">Precio Unit.</th>
                                    <th style="padding: 0.75rem 1rem; text-align: right; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; border-bottom: 2px solid var(--border);">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${detalle.map((item, index) => `<tr style="background: ${index % 2 === 0 ? 'rgba(30, 58, 138, 0.08)' : 'transparent'};"><td style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border);">${item.producto_nombre}</td><td style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); text-align: right; font-family: 'Courier New', monospace; font-weight: 600;">${parseFloat(item.cantidad).toFixed(2)}</td><td style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); text-align: right; font-family: 'Courier New', monospace; font-weight: 600;">${formatMoneyFC(item.precio_unitario)}</td><td style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); text-align: right; font-family: 'Courier New', monospace; font-weight: 700; color: var(--primary);">${formatMoneyFC(item.subtotal)}</td></tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style="padding: 1.5rem; background: linear-gradient(to bottom, transparent, rgba(139,92,246,0.05)); border-top: 2px solid var(--border);">
                    <div style="max-width: 400px; margin-left: auto;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border);"><span style="font-size: 0.95rem; color: var(--text-secondary); font-weight: 600;">Subtotal:</span><span style="font-size: 1rem; font-weight: 700; font-family: 'Courier New', monospace;">${formatMoneyFC(factura.subtotal)}</span></div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border);"><span style="font-size: 0.95rem; color: var(--text-secondary); font-weight: 600;">Impuestos:</span><span style="font-size: 1rem; font-weight: 700; font-family: 'Courier New', monospace;">${formatMoneyFC(factura.impuestos)}</span></div>
                        <div style="display: flex; justify-content: space-between; padding: 1rem; background: var(--bg); border-radius: 8px; border: 2px solid var(--primary);"><span style="font-size: 1.1rem; font-weight: 800; text-transform: uppercase;">Total:</span><span style="font-size: 1.5rem; font-weight: 800; font-family: 'Courier New', monospace; color: var(--primary);">${formatMoneyFC(factura.total)}</span></div>
                    </div>
                </div>

                <div style="padding: 1rem 1.5rem; border-top: 1px solid var(--border); text-align: right; background: linear-gradient(to top, rgba(139,92,246,0.05), transparent);">
                    <button onclick="cerrarModalDetalle()" style="padding: 0.75rem 2rem; background: rgba(139, 92, 246, 0.1); color: var(--primary); border: 2px solid var(--primary); border-radius: 8px; font-size: 0.9rem; font-weight: 700; cursor: pointer; text-transform: uppercase; transition: all 0.3s;" onmouseover="this.style.background='rgba(139, 92, 246, 0.2)'" onmouseout="this.style.background='rgba(139, 92, 246, 0.1)'">Cerrar</button>
                </div>

            </div>
        </div>
    `;

    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHTML;
    document.body.appendChild(modalDiv);
}

function cerrarModalDetalle(event) {
    if (!event || event.target.id === 'modalDetalle') {
        const modal = document.getElementById('modalDetalle');
        if (modal) modal.remove();
    }
}

// ================================================================
// SUBIR SOPORTE DE PAGO
// ================================================================

function abrirSubirSoporte(codigoFactura) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => procesarImagenSoporte(e.target.files[0], codigoFactura);
    input.click();
}

async function procesarImagenSoporte(file, codigoFactura) {
    if (!file) return;
    
    // Mostrar loading
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingUpload';
    loadingDiv.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center;">
            <div style="background: var(--bg-card); padding: 2rem; border-radius: 12px; text-align: center; border: 1px solid var(--border);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⏳</div>
                <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">Procesando imagen...</p>
                <p style="font-size: 0.9rem; color: var(--text-secondary);">Convirtiendo a B&N y comprimiendo</p>
            </div>
        </div>
    `;
    document.body.appendChild(loadingDiv);
    
    try {
        // Crear imagen
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = (e) => {
            img.onload = async () => {
                // Calcular nuevas dimensiones (max 800x600)
                let width = img.width;
                let height = img.height;
                const maxWidth = 800;
                const maxHeight = 600;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = width * ratio;
                    height = height * ratio;
                }
                
                // Crear canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                
                // Dibujar imagen redimensionada
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convertir a escala de grises
                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;
                
                for (let i = 0; i < data.length; i += 4) {
                    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                    data[i] = gray;
                    data[i + 1] = gray;
                    data[i + 2] = gray;
                }
                
                ctx.putImageData(imageData, 0, 0);
                
                // Convertir a base64 JPEG con 70% calidad
                const base64 = canvas.toDataURL('image/jpeg', 0.7);
                
                // Subir al servidor
                await subirSoporteAlServidor(codigoFactura, base64, file.name);
                
            };
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
        
    } catch (error) {
        console.error('Error procesando imagen:', error);
        document.getElementById('loadingUpload').remove();
        alert('❌ Error al procesar la imagen');
    }
}

async function subirSoporteAlServidor(factura, base64, nombreArchivo) {
    try {
        const response = await fetch(`${API_BASE_FACTURAS}/soporte-pago/subir`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                factura: factura,
                archivo_base64: base64,
                nombre_archivo: nombreArchivo,
                empresa: sesion.empresa
            })
        });
        
        const data = await response.json();
        
        document.getElementById('loadingUpload').remove();
        
        if (data.success) {
            alert('✅ Comprobante de pago subido exitosamente\n\nEstado cambiado a: POR VERIFICAR');
            buscarFacturasCompra(); // Recargar facturas
        } else {
            alert(`❌ Error: ${data.error}`);
        }
        
    } catch (error) {
        console.error('Error subiendo soporte:', error);
        document.getElementById('loadingUpload').remove();
        alert('❌ Error al subir el comprobante');
    }
}

// ================================================================
// VER SOPORTE DE PAGO
// ================================================================

async function verSoportePago(codigoFactura) {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingSoporte';
    loadingDiv.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center;">
            <div style="background: var(--bg-card); padding: 2rem; border-radius: 12px; text-align: center; border: 1px solid var(--border);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⏳</div>
                <p style="font-size: 1.1rem; font-weight: 600;">Cargando comprobante...</p>
            </div>
        </div>
    `;
    document.body.appendChild(loadingDiv);
    
    try {
        const response = await fetch(`${API_BASE_FACTURAS}/soporte-pago/obtener?factura=${codigoFactura}`);
        const data = await response.json();
        
        document.getElementById('loadingSoporte').remove();
        
        if (data.success && data.soporte) {
            mostrarModalSoporte(data.soporte, codigoFactura);
        } else {
            alert('❌ No se encontró comprobante de pago para esta factura');
        }
        
    } catch (error) {
        console.error('Error cargando soporte:', error);
        document.getElementById('loadingSoporte').remove();
        alert('❌ Error al cargar el comprobante');
    }
}

function mostrarModalSoporte(soporte, factura) {
    const modalHTML = `
        <div id="modalSoporte" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1rem;" onclick="cerrarModalSoporte(event)">
            <div style="background: var(--bg-card); border-radius: 12px; max-width: 1000px; width: 100%; max-height: 90vh; overflow-y: auto; border: 1px solid var(--border);" onclick="event.stopPropagation()">
                
                <div style="padding: 1.5rem; border-bottom: 2px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Comprobante de Pago</div>
                        <h2 style="font-size: 1.5rem; font-weight: 800; font-family: 'Courier New', monospace; color: var(--primary); margin: 0;">🖼️ ${factura}</h2>
                    </div>
                    <button onclick="cerrarModalSoporte()" style="background: transparent; border: 2px solid var(--border); color: var(--text-secondary); width: 40px; height: 40px; border-radius: 8px; font-size: 1.5rem; cursor: pointer;">✕</button>
                </div>

                <div style="padding: 1.5rem;">
                    <div style="background: var(--bg); padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem;">
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">📄 Archivo</div>
                        <div style="font-size: 0.9rem; font-weight: 600;">${soporte.nombre_archivo}</div>
                    </div>
                    
                    <div style="background: var(--bg); padding: 0.75rem; border-radius: 8px; margin-bottom: 1.5rem;">
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">📅 Fecha de subida</div>
                        <div style="font-size: 0.9rem; font-weight: 600;">${new Date(soporte.fecha_subida).toLocaleString('es-CO')}</div>
                    </div>

                    <div style="text-align: center; background: var(--bg); padding: 1rem; border-radius: 8px; border: 2px dashed var(--border);">
                        <img src="${soporte.archivo_data}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" alt="Comprobante de pago">
                    </div>
                </div>

                <div style="padding: 1rem 1.5rem; border-top: 1px solid var(--border); text-align: right;">
                    <button onclick="cerrarModalSoporte()" style="padding: 0.75rem 2rem; background: var(--bg); color: var(--text); border: 2px solid var(--border); border-radius: 8px; font-size: 0.9rem; font-weight: 700; cursor: pointer; text-transform: uppercase;">Cerrar</button>
                </div>

            </div>
        </div>
    `;
    
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHTML;
    document.body.appendChild(modalDiv);
}

function cerrarModalSoporte(event) {
    if (!event || event.target.id === 'modalSoporte') {
        const modal = document.getElementById('modalSoporte');
        if (modal) modal.remove();
    }
}

function formatMoneyFC(value) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(parseFloat(value || 0));
}
