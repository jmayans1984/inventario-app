// ================================================================
// CONTABILIDAD - REPORTE DE GASTOS
// ================================================================

const API_BASE_REPORTES = 'https://inventario-app-production-e8c8.up.railway.app/api/gastos';

// ================================================================
// CARGAR DATOS INICIALES
// ================================================================

async function cargarDatosReporte() {
    try {
        // Establecer fechas del mes actual
        const hoy = new Date();
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        
        document.getElementById('fechaInicial').value = primerDia.toISOString().split('T')[0];
        document.getElementById('fechaFinal').value = ultimoDia.toISOString().split('T')[0];
        
        await Promise.all([
            cargarCCostosReporte(),
            cargarCuentasReporte()
        ]);
    } catch (error) {
        console.error('Error cargando datos:', error);
        alert('❌ Error al cargar datos iniciales');
    }
}

// ================================================================
// CARGAR CENTROS DE COSTO
// ================================================================

async function cargarCCostosReporte() {
    try {
        const response = await fetch(`${API_BASE_REPORTES}/ccostos?empresa=${sesion.empresa}`);
        const data = await response.json();
        
        const select = document.getElementById('centroCosto');
        select.innerHTML = '<option value="">TODOS LOS CENTROS DE COSTOS</option>';
        
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
    }
}

// ================================================================
// CARGAR CUENTAS CONTABLES
// ================================================================

async function cargarCuentasReporte() {
    try {
        const response = await fetch(`${API_BASE_REPORTES}/cuentas-contables?empresa=${sesion.empresa}`);
        const data = await response.json();
        
        const select = document.getElementById('cuentaContable');
        select.innerHTML = '<option value="">TODAS LAS CUENTAS</option>';
        
        if (data.success && data.cuentas) {
            data.cuentas.forEach(cuenta => {
                const option = document.createElement('option');
                option.value = cuenta.codigo;
                option.textContent = cuenta.cuenta;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando cuentas:', error);
    }
}

// ================================================================
// GENERAR REPORTE
// ================================================================

async function generarReporte() {
    const fechaInicial = document.getElementById('fechaInicial').value;
    const fechaFinal = document.getElementById('fechaFinal').value;
    const centroCosto = document.getElementById('centroCosto').value;
    const cuentaContable = document.getElementById('cuentaContable').value;
    
    if (!fechaInicial || !fechaFinal) {
        alert('❌ Las fechas inicial y final son obligatorias');
        return;
    }
    
    try {
        // Construir query params
        let url = `${API_BASE_REPORTES}/reporte?empresa=${sesion.empresa}&fechaInicial=${fechaInicial}&fechaFinal=${fechaFinal}`;
        
        if (centroCosto) {
            url += `&centroCosto=${centroCosto}`;
        }
        
        if (cuentaContable) {
            url += `&cuentaContable=${cuentaContable}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            mostrarReporte(data.gastos, fechaInicial, fechaFinal);
        } else {
            alert(`❌ Error: ${data.error}`);
        }
        
    } catch (error) {
        console.error('Error generando reporte:', error);
        alert('❌ Error al generar el reporte');
    }
}

// ================================================================
// MOSTRAR REPORTE
// ================================================================

function mostrarReporte(gastos, fechaInicial, fechaFinal) {
    const container = document.getElementById('reporteContainer');
    
    if (gastos.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; background: var(--bg-card); border-radius: 12px; border: 2px dashed var(--border);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                <p style="font-size: 1.1rem; font-weight: 600; color: var(--text-secondary);">No se encontraron gastos con los filtros seleccionados</p>
            </div>
        `;
        return;
    }
    
    // Ordenar por fecha
    gastos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    let totalGeneral = 0;
    let tablaHTML = '';
    
    gastos.forEach((gasto, index) => {
        const bgColor = index % 2 === 0 ? 'rgba(30, 58, 138, 0.08)' : 'transparent';
        const fechaParts = gasto.fecha.split('T')[0].split('-');
        const fechaFormat = `${fechaParts[2]}/${fechaParts[1]}/${fechaParts[0]}`;
        
        totalGeneral += parseFloat(gasto.total);
        
        tablaHTML += `
            <tr style="background: ${bgColor};">
                <td style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); font-family: 'Courier New', monospace;">${gasto.codigo}</td>
                <td style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border);">${fechaFormat}</td>
                <td style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border);">${gasto.proveedor_nombre || gasto.proveedor}</td>
                <td style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border);">${gasto.concepto || '-'}</td>
                <td style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border);">${gasto.cuenta_nombre || gasto.cuenta}</td>
                <td style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border);">${gasto.forma_pago_nombre || gasto.forma_pago}</td>
                <td style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border);">${gasto.ccosto_nombre || gasto.ccosto}</td>
                <td style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); text-align: right; font-family: 'Courier New', monospace; font-weight: 700; color: var(--danger);">${formatMoney(gasto.total)}</td>
            </tr>
        `;
    });
    
    const fechaInicialParts = fechaInicial.split('-');
    const fechaInicialFormat = `${fechaInicialParts[2]}/${fechaInicialParts[1]}/${fechaInicialParts[0]}`;
    
    const fechaFinalParts = fechaFinal.split('-');
    const fechaFinalFormat = `${fechaFinalParts[2]}/${fechaFinalParts[1]}/${fechaFinalParts[0]}`;
    
    container.innerHTML = `
        <!-- HEADER DEL REPORTE -->
        <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), transparent); padding: 2rem; border-radius: 12px; border: 2px solid var(--border); margin-bottom: 2rem;">
            <div style="text-align: center;">
                <h2 style="font-size: 1.8rem; font-weight: 800; color: var(--primary); margin-bottom: 0.5rem;">REPORTE DE GASTOS</h2>
                <p style="font-size: 1rem; color: var(--text-secondary); font-weight: 600;">PERÍODO: ${fechaInicialFormat} al ${fechaFinalFormat}</p>
            </div>
        </div>

        <!-- TABLA -->
        <div style="background: var(--bg-card); border-radius: 12px; border: 2px solid var(--border); overflow: hidden;">
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                    <thead style="background: var(--bg); border-bottom: 2px solid var(--border);">
                        <tr>
                            <th style="padding: 1rem; text-align: left; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem;">CÓDIGO</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem;">FECHA</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem;">PROVEEDOR</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem;">CONCEPTO</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem;">CUENTA</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem;">F. PAGO</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem;">C. COSTO</th>
                            <th style="padding: 1rem; text-align: right; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem;">VALOR</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tablaHTML}
                    </tbody>
                    <tfoot style="background: var(--bg); border-top: 3px solid var(--primary);">
                        <tr>
                            <td colspan="7" style="padding: 1rem; text-align: right; font-weight: 800; font-size: 1rem; text-transform: uppercase; color: var(--text);">TOTAL:</td>
                            <td style="padding: 1rem; text-align: right; font-weight: 800; font-size: 1.3rem; font-family: 'Courier New', monospace; color: var(--danger);">${formatMoney(totalGeneral)}</td>
                        </tr>
                        <tr>
                            <td colspan="7" style="padding: 0.5rem 1rem; text-align: right; font-weight: 600; font-size: 0.9rem; color: var(--text-secondary);">REGISTROS TOTALES:</td>
                            <td style="padding: 0.5rem 1rem; text-align: right; font-weight: 700; font-size: 1rem; color: var(--text);">${gastos.length}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    `;
}

function formatMoney(value) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}
