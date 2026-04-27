// ================================================================
// TESORERÍA - MOVIMIENTOS BANCARIOS (MOBILE OPTIMIZED)
// ================================================================

const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api';
let movimientosData = [];

function cargarMovimientosBancarios() {
    const contentDiv = document.getElementById('movibanContent');
    
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    const fechaInicialStr = primerDia.toISOString().split('T')[0];
    const fechaFinalStr = ultimoDia.toISOString().split('T')[0];
    
    contentDiv.innerHTML = `
        <div class="filtros">
            <div class="filtro-group">
                <label>Cuenta Bancaria</label>
                <select id="cuentaBancaria" onchange="generarReporte()">
                    <option value="">Cargando...</option>
                </select>
            </div>
            
            <div class="filtro-group">
                <label>Fecha Inicial</label>
                <input type="date" id="fechaInicial" value="${fechaInicialStr}" onchange="generarReporte()">
            </div>
            
            <div class="filtro-group">
                <label>Fecha Final</label>
                <input type="date" id="fechaFinal" value="${fechaFinalStr}" onchange="generarReporte()">
            </div>
        </div>

        <div id="resumenMoviban" style="display: none;"></div>
        <div id="tablaMoviban" style="display: none;"></div>
    `;

    cargarCuentasBancarias();
}

async function cargarCuentasBancarias() {
    try {
        const response = await fetch(`${API_BASE}/cuentas-bancarias?empresa=${sesion.empresa}`);
        const data = await response.json();

        if (data.success) {
            const select = document.getElementById('cuentaBancaria');
            let html = '<option value="">-- Seleccione --</option>';
            data.data.forEach(cuenta => {
                html += `<option value="${cuenta.codigo}">${cuenta.nombre_cta}</option>`;
            });
            select.innerHTML = html;
        }
    } catch (error) {
        console.error('Error cargando cuentas:', error);
    }
}

async function generarReporte() {
    const cuenta = document.getElementById('cuentaBancaria').value;
    const fechaInicial = document.getElementById('fechaInicial').value;
    const fechaFinal = document.getElementById('fechaFinal').value;

    if (!cuenta || !fechaInicial || !fechaFinal) {
        document.getElementById('resumenMoviban').style.display = 'none';
        document.getElementById('tablaMoviban').style.display = 'none';
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE}/movimientos-bancarios?empresa=${sesion.empresa}&cuenta=${cuenta}&fecha_inicial=${fechaInicial}&fecha_final=${fechaFinal}`
        );
        const data = await response.json();

        if (data.success) {
            movimientosData = data.data;
            renderReporte(data.resumen);
        }
    } catch (error) {
        console.error('Error cargando movimientos:', error);
    }
}

function renderReporte(resumen) {
    // RESUMEN - Grid 2x2
    const resumenDiv = document.getElementById('resumenMoviban');
    resumenDiv.style.display = 'block';
    resumenDiv.innerHTML = `
        <div class="resumen">
            <div class="resumen-item">
                <div class="resumen-label">Saldo Inicial</div>
                <div class="resumen-value" style="color: #60a5fa;">${formatShort(resumen.saldo_inicial)}</div>
            </div>
            <div class="resumen-item">
                <div class="resumen-label">Saldo Final</div>
                <div class="resumen-value" style="color: #a78bfa;">${formatShort(resumen.saldo_final)}</div>
            </div>
            <div class="resumen-item">
                <div class="resumen-label">Ingresos</div>
                <div class="resumen-value" style="color: var(--success);">+${formatShort(resumen.total_ingresos)}</div>
            </div>
            <div class="resumen-item">
                <div class="resumen-label">Egresos</div>
                <div class="resumen-value" style="color: var(--danger);">-${formatShort(resumen.total_egresos)}</div>
            </div>
        </div>
    `;

    // TABLA
    const tablaDiv = document.getElementById('tablaMoviban');
    tablaDiv.style.display = 'block';

    if (movimientosData.length === 0) {
        tablaDiv.innerHTML = `
            <div style="background: var(--bg-card); border-radius: 12px; padding: 2rem 1rem; border: 1px solid var(--border); text-align: center;">
                <p style="color: var(--text-secondary); font-size: 0.85rem;">No hay movimientos</p>
            </div>
        `;
        return;
    }

    let htmlTabla = `
        <div class="tabla-container">
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Beneficiario</th>
                        <th>Concepto</th>
                        <th class="text-right">Ingreso</th>
                        <th class="text-right">Egreso</th>
                    </tr>
                </thead>
                <tbody>
    `;

    movimientosData.forEach((mov, index) => {
        const bgColor = index % 2 === 0 ? 'rgba(30, 58, 138, 0.08)' : 'transparent';
        
        // Arreglar fecha corrida - parsear en UTC
        const fechaParts = mov.fecha.split('T')[0].split('-');
        const fecha = `${fechaParts[2]}/${fechaParts[1]}`;
        
        const ingreso = parseFloat(mov.ingreso || 0);
        const egreso = parseFloat(mov.egreso || 0);

        htmlTabla += `
            <tr style="background: ${bgColor};">
                <td>${fecha}</td>
                <td style="max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${mov.beneficiario || '-'}</td>
                <td style="max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${mov.concepto || '-'}</td>
                <td class="text-right monospace" style="color: var(--success);">${ingreso > 0 ? formatShort(ingreso) : ''}</td>
                <td class="text-right monospace" style="color: var(--danger);">${egreso > 0 ? formatShort(egreso) : ''}</td>
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

function formatShort(value) {
    const num = parseFloat(value || 0);
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'K';
    }
    return num.toFixed(0);
}
