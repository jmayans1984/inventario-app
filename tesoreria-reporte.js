// ================================================================
// TESORERÍA - REPORTE MOVIMIENTOS POR CUENTA
// ================================================================

const API_BASE_REPORTE = 'https://inventario-app-production-e8c8.up.railway.app/api';
let movimientosReporteData = [];

function cargarReporteMovimientos() {
    const contentDiv = document.getElementById('reporteMovibanContent');
    
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    const fechaInicialStr = primerDia.toISOString().split('T')[0];
    const fechaFinalStr = ultimoDia.toISOString().split('T')[0];
    
    contentDiv.innerHTML = `
        <div style="background: var(--bg-card); padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem; border: 1px solid var(--border);">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div>
                    <label style="display: block; margin-bottom: 0.4rem; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Cuenta Bancaria</label>
                    <select id="cuentaBancariaReporte" onchange="generarReporteMovimientos()">
                        <option value="">Cargando...</option>
                    </select>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 0.4rem; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Fecha Inicial</label>
                    <input type="date" id="fechaInicialReporte" value="${fechaInicialStr}" onchange="generarReporteMovimientos()">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 0.4rem; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Fecha Final</label>
                    <input type="date" id="fechaFinalReporte" value="${fechaFinalStr}" onchange="generarReporteMovimientos()">
                </div>
            </div>
        </div>

        <div id="resumenReporte" style="display: none;"></div>
        <div id="tablaReporte" style="display: none;"></div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        #cuentaBancariaReporte,
        #fechaInicialReporte,
        #fechaFinalReporte {
            width: 100%;
            padding: 0.7rem;
            background: var(--bg);
            border: 2px solid var(--border);
            border-radius: 6px;
            color: var(--text);
            font-size: 0.9rem;
        }
    `;
    document.head.appendChild(style);

    cargarCuentasReporte();
}

async function cargarCuentasReporte() {
    try {
        const response = await fetch(`${API_BASE_REPORTE}/cuentas-bancarias?empresa=${sesion.empresa}`);
        const data = await response.json();

        if (data.success) {
            const select = document.getElementById('cuentaBancariaReporte');
            let html = '<option value="">-- Seleccione una cuenta --</option>';
            data.data.forEach(cuenta => {
                html += `<option value="${cuenta.codigo}">${cuenta.nombre_cta} (${cuenta.nombre_banco})</option>`;
            });
            select.innerHTML = html;
        }
    } catch (error) {
        console.error('Error cargando cuentas:', error);
    }
}

async function generarReporteMovimientos() {
    const cuenta = document.getElementById('cuentaBancariaReporte').value;
    const fechaInicial = document.getElementById('fechaInicialReporte').value;
    const fechaFinal = document.getElementById('fechaFinalReporte').value;

    if (!cuenta || !fechaInicial || !fechaFinal) {
        document.getElementById('resumenReporte').style.display = 'none';
        document.getElementById('tablaReporte').style.display = 'none';
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_REPORTE}/movimientos-bancarios?empresa=${sesion.empresa}&cuenta=${cuenta}&fecha_inicial=${fechaInicial}&fecha_final=${fechaFinal}`
        );
        const data = await response.json();

        if (data.success) {
            movimientosReporteData = data.data;
            renderReporteMovimientos(data.resumen);
        }
    } catch (error) {
        console.error('Error cargando movimientos:', error);
    }
}

function renderReporteMovimientos(resumen) {
    const resumenDiv = document.getElementById('resumenReporte');
    resumenDiv.style.display = 'block';
    resumenDiv.innerHTML = `
        <div style="background: var(--bg-card); border-radius: 12px; padding: 1.5rem; border: 1px solid var(--border); margin-bottom: 1rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
            <div style="text-align: center;">
                <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem;">Saldo Inicial</div>
                <div style="font-size: 1.75rem; font-weight: 800; font-family: 'Courier New', monospace; color: #60a5fa;">${formatCurrency(resumen.saldo_inicial)}</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem;">Total Ingresos</div>
                <div style="font-size: 1.75rem; font-weight: 800; font-family: 'Courier New', monospace; color: var(--success);">+${formatCurrency(resumen.total_ingresos)}</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem;">Total Egresos</div>
                <div style="font-size: 1.75rem; font-weight: 800; font-family: 'Courier New', monospace; color: var(--danger);">-${formatCurrency(resumen.total_egresos)}</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem;">Saldo Final</div>
                <div style="font-size: 1.75rem; font-weight: 800; font-family: 'Courier New', monospace; color: #a78bfa;">${formatCurrency(resumen.saldo_final)}</div>
            </div>
        </div>
    `;

    const tablaDiv = document.getElementById('tablaReporte');
    tablaDiv.style.display = 'block';

    if (movimientosReporteData.length === 0) {
        tablaDiv.innerHTML = `
            <div style="background: var(--bg-card); border-radius: 12px; padding: 2rem; border: 1px solid var(--border); text-align: center;">
                <p style="color: var(--text-secondary);">No hay movimientos en el período seleccionado</p>
            </div>
        `;
        return;
    }

    let htmlTabla = `
        <div style="background: var(--bg-card); border-radius: 12px; padding: 1rem; border: 1px solid var(--border); overflow-x: auto; -webkit-overflow-scrolling: touch;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; min-width: 600px;">
                <thead style="background: var(--bg);">
                    <tr>
                        <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; border-bottom: 2px solid var(--border);">Fecha</th>
                        <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; border-bottom: 2px solid var(--border);">Beneficiario</th>
                        <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; border-bottom: 2px solid var(--border);">Concepto</th>
                        <th style="padding: 0.75rem 1rem; text-align: right; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; border-bottom: 2px solid var(--border);">Ingreso</th>
                        <th style="padding: 0.75rem 1rem; text-align: right; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; border-bottom: 2px solid var(--border);">Egreso</th>
                    </tr>
                </thead>
                <tbody>
    `;

    movimientosReporteData.forEach((mov, index) => {
        const bgColor = index % 2 === 0 ? 'rgba(30, 58, 138, 0.08)' : 'transparent';
        
        const fechaParts = mov.fecha.split('T')[0].split('-');
        const fecha = `${fechaParts[2]}/${fechaParts[1]}/${fechaParts[0].substring(2)}`;
        
        const ingreso = parseFloat(mov.ingreso || 0);
        const egreso = parseFloat(mov.egreso || 0);

        htmlTabla += `
            <tr style="background: ${bgColor};">
                <td style="padding: 0.65rem 1rem; border-bottom: 1px solid var(--border);">${fecha}</td>
                <td style="padding: 0.65rem 1rem; border-bottom: 1px solid var(--border);">${mov.beneficiario || '-'}</td>
                <td style="padding: 0.65rem 1rem; border-bottom: 1px solid var(--border);">${mov.concepto || '-'}</td>
                <td style="padding: 0.65rem 1rem; border-bottom: 1px solid var(--border); text-align: right; font-family: 'Courier New', monospace; font-weight: 600; color: var(--success);">${ingreso > 0 ? formatCurrency(ingreso) : ''}</td>
                <td style="padding: 0.65rem 1rem; border-bottom: 1px solid var(--border); text-align: right; font-family: 'Courier New', monospace; font-weight: 600; color: var(--danger);">${egreso > 0 ? formatCurrency(egreso) : ''}</td>
            </tr>
        `;
    });

    htmlTabla += `
                </tbody>
            </table>
        </div>
    `;

    tablaDiv.innerHTML = htmlTabla;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(parseFloat(value || 0));
}
