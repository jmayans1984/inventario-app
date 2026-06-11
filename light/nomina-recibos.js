// ================================================================
// NÓMINA - RECIBOS DE PAGO (PAY STUBS)
// ================================================================

const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api';

window.addEventListener('load', () => {
    if (!localStorage.getItem('empresaActual') || !localStorage.getItem('usuario')) {
        window.location.href = 'index.html';
        return;
    }
    cargarLiquidaciones();
});

let liquidaciones = [];
let liqSelId = '';
let liqActual = null;
let lineas = [];

function getEmpresa() {
    return localStorage.getItem('empresaActual') || (window.sesion && window.sesion.empresa) || '';
}

function getEmpresaNombre() {
    if (window.sesion?.empresaNombre) return window.sesion.empresaNombre;
    try {
        const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
        const emp = usuario?.empresas?.find(e => String(e.empresa) === String(getEmpresa()));
        return emp?.empresa_nombre || 'Mi Empresa';
    } catch { return 'Mi Empresa'; }
}

function fmtFecha(f) {
    if (!f) return '—';
    try {
        const dateStr = String(f).split('T')[0];
        const [y, m, d] = dateStr.split('-');
        const meses = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        return `${parseInt(d)} ${meses[parseInt(m)]} ${y}`;
    } catch { return String(f); }
}

function fmtMoney(v) { return '$' + parseFloat(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtNum(v) { return parseFloat(v || 0).toFixed(2); }

function getNombreDisplay(emp) {
    if (emp.tipo_empleado === '1099' && emp.empresa_contratista) {
        return `${emp.apellido}, ${emp.nombre} — ${emp.empresa_contratista}`;
    }
    return `${emp.apellido}, ${emp.nombre}`;
}

// ── Carga ─────────────────────────────────────────────────────────
async function cargarLiquidaciones() {
    try {
        const r = await fetch(`${API_BASE}/nomina/liquidaciones?empresa=${getEmpresa()}`).then(r => r.json());
        liquidaciones = r.data || [];
        if (liquidaciones.length) {
            liqSelId = liquidaciones[0].id;
            await cargarLineas();
            return;
        }
    } catch (e) { console.error('Error cargando liquidaciones:', e); }
    renderTodo();
}

async function cargarLineas() {
    if (!liqSelId) { liqActual = null; lineas = []; renderTodo(); return; }
    try {
        const r = await fetch(`${API_BASE}/nomina/liquidaciones/${liqSelId}`).then(r => r.json());
        liqActual = r.liquidacion;
        lineas = r.lineas || [];
    } catch (e) {
        console.error('Error cargando líneas:', e);
        liqActual = null;
        lineas = [];
    }
    renderTodo();
}

function cambiarLiq(id) {
    liqSelId = id;
    cargarLineas();
}

// ── Render ────────────────────────────────────────────────────────
function renderTodo() {
    let html = `
        <div style="background:linear-gradient(135deg,#1a0a2e,#2d1b69);border-radius:16px;padding:16px;margin-bottom:14px;color:white">
            <div style="font-size:15px;font-weight:800;margin-bottom:2px">📄 RECIBOS DE PAGO — PAY STUBS</div>
            ${liqActual ? `<div style="font-size:11px;opacity:.7">${fmtFecha(liqActual.semana_inicio)} — ${fmtFecha(liqActual.semana_fin)}
                <span style="background:rgba(255,255,255,.15);padding:2px 8px;border-radius:5px;font-size:10px;font-weight:800;margin-left:6px">${liqActual.estado}</span></div>` : ''}
            <select onchange="cambiarLiq(this.value)" style="width:100%;height:42px;margin-top:10px;padding:0 10px;border-radius:10px;border:none;font-size:14px;background:rgba(255,255,255,.95)">
                <option value="">— Seleccionar nómina —</option>
                ${liquidaciones.map(l => `<option value="${l.id}" ${String(l.id) === String(liqSelId) ? 'selected' : ''}>${fmtFecha(l.semana_inicio)} · ${l.estado}</option>`).join('')}
            </select>
            ${lineas.length ? `<button onclick="imprimirTodos()" style="width:100%;margin-top:10px;background:rgba(139,92,246,.5);color:white;border:none;padding:11px;border-radius:10px;font-size:13px;font-weight:700">🖨 Imprimir Todos</button>` : ''}
        </div>`;

    if (liqActual && lineas.length) {
        const empresaNombre = getEmpresaNombre();
        lineas.forEach((l, idx) => {
            const esW2 = l.tipo_empleado === 'W2';
            html += `
            <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:14px;overflow:hidden;margin-bottom:14px">
                <div style="background:#1e3a5f;padding:12px 16px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
                    <div>
                        <div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.8px">${empresaNombre}</div>
                        <div style="font-size:14px;font-weight:800;color:white;margin:2px 0">RECIBO DE PAGO</div>
                        <div style="font-size:10px;color:rgba(255,255,255,.55)">${fmtFecha(liqActual.semana_inicio)} — ${fmtFecha(liqActual.semana_fin)}</div>
                    </div>
                    <button onclick="imprimirRecibo(${idx})" style="background:rgba(255,255,255,.15);border:none;color:white;width:34px;height:34px;border-radius:9px;font-size:14px;flex-shrink:0">🖨</button>
                </div>

                <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border)">
                    <div style="min-width:0">
                        <div style="font-size:13px;font-weight:700">${getNombreDisplay(l)}</div>
                        <div style="font-size:10px;color:var(--text-tertiary)">
                            <span style="font-size:9px;font-weight:800;padding:1px 5px;border-radius:3px;background:${esW2 ? 'rgba(139,92,246,.15)' : 'rgba(245,158,11,.15)'};color:${esW2 ? '#8b5cf6' : '#f59e0b'}">${l.tipo_empleado}</span>
                            ${esW2 ? 'Employee' : 'Independent Contractor'}
                        </div>
                    </div>
                    <div style="text-align:right;flex-shrink:0">
                        <div style="font-size:9px;color:var(--text-tertiary)">NET PAY</div>
                        <div style="font-size:18px;font-weight:800;color:#10b981">${fmtMoney(l.total_neto)}</div>
                    </div>
                </div>

                <div style="font-size:9px;font-weight:800;letter-spacing:.8px;color:var(--text-tertiary);text-transform:uppercase;padding:8px 16px 3px">EARNINGS</div>
                <table style="width:100%;border-collapse:collapse;font-size:11px">
                    <tbody>
                        ${parseFloat(l.horas_regulares) > 0 ? `<tr><td style="padding:4px 16px;border-bottom:1px solid var(--border)">Regular Pay <span style="color:var(--text-tertiary)">· ${fmtNum(l.horas_regulares)}h × ${fmtMoney(l.valor_hora)}</span></td><td style="padding:4px 16px;text-align:right;border-bottom:1px solid var(--border)">${fmtMoney(l.bruto_regular)}</td></tr>` : ''}
                        ${parseFloat(l.horas_overtime) > 0 ? `<tr><td style="padding:4px 16px;border-bottom:1px solid var(--border)">Overtime (1.5×) <span style="color:var(--text-tertiary)">· ${fmtNum(l.horas_overtime)}h × ${fmtMoney(l.valor_hora_ot)}</span></td><td style="padding:4px 16px;text-align:right;border-bottom:1px solid var(--border)">${fmtMoney(l.bruto_overtime)}</td></tr>` : ''}
                        ${parseFloat(l.bruto_base) > 0 ? `<tr><td style="padding:4px 16px;border-bottom:1px solid var(--border)">${l.es_monto_fijo ? 'Fixed Weekly Amount' : 'Base Salary'}</td><td style="padding:4px 16px;text-align:right;border-bottom:1px solid var(--border)">${fmtMoney(l.bruto_base)}</td></tr>` : ''}
                        <tr style="background:var(--bg-secondary)"><td style="padding:6px 16px;font-weight:700">Gross Pay</td><td style="padding:6px 16px;text-align:right;font-weight:700">${fmtMoney(l.total_bruto)}</td></tr>
                    </tbody>
                </table>`;

            if (esW2) {
                const ded = [
                    ['Federal Income Tax (FIT)',     l.federal_income_tax],
                    ['Social Security (6.2%)',       l.social_security_emp],
                    ['Medicare (1.45%)',             l.medicare_emp],
                    ['Additional Medicare (0.9%)',   l.medicare_adicional],
                    ["Workers' Compensation",        l.workers_comp],
                    ['Other Deductions',             l.otras_deducciones],
                ].filter(([, v]) => parseFloat(v) > 0);

                if (ded.length) {
                    html += `<div style="font-size:9px;font-weight:800;letter-spacing:.8px;color:var(--text-tertiary);text-transform:uppercase;padding:8px 16px 3px">DEDUCTIONS</div>
                    <table style="width:100%;border-collapse:collapse;font-size:11px"><tbody>
                        ${ded.map(([lbl, v]) => `<tr><td style="padding:4px 16px;border-bottom:1px solid var(--border)">${lbl}</td><td style="padding:4px 16px;text-align:right;border-bottom:1px solid var(--border)">-${fmtMoney(v)}</td></tr>`).join('')}
                        <tr style="background:var(--bg-secondary)"><td style="padding:6px 16px;font-weight:700">Total Deductions</td><td style="padding:6px 16px;text-align:right;font-weight:700;color:#ef4444">-${fmtMoney(l.total_deducciones)}</td></tr>
                    </tbody></table>`;
                }
            }

            html += `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:rgba(16,185,129,.06);border-top:1px solid rgba(16,185,129,.15)">
                    <div>
                        <div style="font-size:9px;color:var(--text-tertiary);text-transform:uppercase">YTD Gross</div>
                        <div style="font-size:13px;font-weight:700">${fmtMoney(l.ytd_bruto)}</div>
                    </div>
                    <div style="text-align:right">
                        <div style="font-size:9px;color:var(--text-tertiary)">NET PAY</div>
                        <div style="font-size:18px;font-weight:800;color:#10b981">${fmtMoney(l.total_neto)}</div>
                    </div>
                </div>
            </div>`;
        });
    } else if (liqSelId) {
        html += `
        <div style="padding:40px 20px;text-align:center;color:var(--text-tertiary)">
            <div style="font-size:36px;margin-bottom:10px">📄</div>
            <div style="font-weight:700;color:var(--text-primary)">Sin líneas de nómina</div>
            <div style="font-size:12px;margin-top:4px">Esta nómina no tiene recibos calculados. Calcula la nómina primero.</div>
        </div>`;
    } else {
        html += `
        <div style="padding:40px 20px;text-align:center;color:var(--text-tertiary)">
            <div style="font-size:36px;margin-bottom:10px">💰</div>
            <div style="font-weight:700;color:var(--text-primary)">Selecciona una nómina</div>
            <div style="font-size:12px;margin-top:4px">Elige una nómina aprobada del selector para ver los recibos de pago.</div>
        </div>`;
    }

    document.getElementById('recContent').innerHTML = html;
}

// ── Impresión (misma lógica que versión web) ──────────────────────
const ESTILOS_RECIBO = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; background: white; color: #111; padding: 20px; }
    .recibo { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; margin-bottom: 12px; break-inside: avoid; page-break-inside: avoid; }
    .rec-header { background: #1e3a5f; padding: 10px 14px; }
    .rec-empresa { font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.8px; }
    .rec-titulo  { font-size: 14px; font-weight: 800; color: white; margin: 2px 0; }
    .rec-periodo { font-size: 10px; color: rgba(255,255,255,0.55); }
    .rec-emp-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid #eee; }
    .rec-emp-nombre { font-size: 13px; font-weight: 700; }
    .rec-emp-tipo   { font-size: 10px; color: #888; margin-top: 2px; }
    .rec-badge { font-size: 8px; font-weight: 800; padding: 1px 5px; border-radius: 3px; margin-right: 4px; }
    .badge-w2   { background: #ede9fe; color: #7c3aed; }
    .badge-1099 { background: #fef3c7; color: #b45309; }
    .rec-neto-big { text-align: right; font-size: 20px; font-weight: 800; color: #059669; }
    .rec-neto-big .label { font-size: 9px; color: #888; }
    .sec-title { font-size: 8px; font-weight: 800; letter-spacing: 0.8px; color: #999; text-transform: uppercase; padding: 5px 14px 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { padding: 3px 8px; text-align: left; font-size: 8px; font-weight: 800; color: #999; text-transform: uppercase; background: #f9f9f9; }
    th.ta-r { text-align: right; }
    td { padding: 3px 8px; border-bottom: 1px solid #f0f0f0; }
    td.ta-r { text-align: right; }
    tr.total td { background: #f5f5f5; font-weight: 700; font-size: 11px; padding: 5px 8px; }
    .rec-footer { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #f0fdf4; border-top: 1px solid #bbf7d0; }
    .rec-ytd { font-size: 10px; color: #444; }
    .rec-net { font-size: 18px; font-weight: 800; color: #059669; text-align: right; }
    @media print { .recibo { page-break-inside: avoid; } .rec-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .rec-footer { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`;

function genReciboHTML(l) {
    const periodo = `${fmtFecha(liqActual.semana_inicio)} — ${fmtFecha(liqActual.semana_fin)}`;
    const nombre = getNombreDisplay(l);
    const esW2 = l.tipo_empleado === 'W2';
    const badge = `<span class="rec-badge ${esW2 ? 'badge-w2' : 'badge-1099'}">${l.tipo_empleado}</span>`;
    const tipo = esW2 ? 'Employee' : 'Independent Contractor';

    let earnings = '';
    if (parseFloat(l.horas_regulares) > 0) earnings += `
        <tr><td>Regular Pay</td><td class="ta-r">${fmtNum(l.horas_regulares)}</td>
        <td class="ta-r">${fmtMoney(l.valor_hora)}</td><td class="ta-r">${fmtMoney(l.bruto_regular)}</td></tr>`;
    if (parseFloat(l.horas_overtime) > 0) earnings += `
        <tr><td>Overtime (1.5×)</td><td class="ta-r">${fmtNum(l.horas_overtime)}</td>
        <td class="ta-r">${fmtMoney(l.valor_hora_ot)}</td><td class="ta-r">${fmtMoney(l.bruto_overtime)}</td></tr>`;
    if (parseFloat(l.bruto_base) > 0) earnings += `
        <tr><td>${l.es_monto_fijo ? 'Fixed Weekly' : 'Base Salary'}</td><td class="ta-r">—</td>
        <td class="ta-r">—</td><td class="ta-r">${fmtMoney(l.bruto_base)}</td></tr>`;

    let deductions = '';
    if (esW2) {
        if (parseFloat(l.federal_income_tax) > 0) deductions += `<tr><td>Federal Income Tax</td><td class="ta-r">-${fmtMoney(l.federal_income_tax)}</td></tr>`;
        if (parseFloat(l.social_security_emp) > 0) deductions += `<tr><td>Social Security (6.2%)</td><td class="ta-r">-${fmtMoney(l.social_security_emp)}</td></tr>`;
        if (parseFloat(l.medicare_emp) > 0) deductions += `<tr><td>Medicare (1.45%)</td><td class="ta-r">-${fmtMoney(l.medicare_emp)}</td></tr>`;
        if (parseFloat(l.workers_comp) > 0) deductions += `<tr><td>Workers' Comp</td><td class="ta-r">-${fmtMoney(l.workers_comp)}</td></tr>`;
    }

    return `
    <div class="recibo">
        <div class="rec-header">
            <div class="rec-empresa">${getEmpresaNombre()}</div>
            <div class="rec-titulo">RECIBO DE PAGO</div>
            <div class="rec-periodo">${periodo}</div>
        </div>
        <div class="rec-emp-row">
            <div>
                <div class="rec-emp-nombre">${nombre}</div>
                <div class="rec-emp-tipo">${badge} ${tipo}</div>
            </div>
            <div class="rec-neto-big">
                <div class="label">NET PAY</div>
                ${fmtMoney(l.total_neto)}
            </div>
        </div>
        <div class="sec-title">EARNINGS</div>
        <table><thead><tr><th>DESCRIPTION</th><th class="ta-r">HRS</th><th class="ta-r">RATE</th><th class="ta-r">AMOUNT</th></tr></thead>
        <tbody>${earnings}<tr class="total"><td colspan="3">Gross Pay</td><td class="ta-r">${fmtMoney(l.total_bruto)}</td></tr></tbody></table>
        ${esW2 && deductions ? `
        <div class="sec-title">DEDUCTIONS</div>
        <table><tbody>${deductions}
        <tr class="total"><td>Total Deductions</td><td class="ta-r">-${fmtMoney(l.total_deducciones)}</td></tr></tbody></table>` : ''}
        <div class="rec-footer">
            <div class="rec-ytd"><div style="font-size:8px;color:#888">YTD GROSS</div>${fmtMoney(l.ytd_bruto)}</div>
            <div class="rec-net"><div style="font-size:8px;color:#888">NET PAY</div>${fmtMoney(l.total_neto)}</div>
        </div>
    </div>`;
}

function imprimirRecibo(idx) {
    const l = lineas[idx];
    if (!l || !liqActual) return;

    const ventana = window.open('', '_blank');
    if (!ventana) { alert('Activa los pop-ups para imprimir el recibo'); return; }

    ventana.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
        <title>Recibo de Pago — ${getNombreDisplay(l)}</title>
        <style>${ESTILOS_RECIBO}</style></head>
        <body>${genReciboHTML(l)}</body></html>`);
    ventana.document.close();
    ventana.focus();
}

function imprimirTodos() {
    if (!lineas.length || !liqActual) return;

    const ventana = window.open('', '_blank');
    if (!ventana) { alert('Activa los pop-ups para imprimir los recibos'); return; }

    const periodo = `${fmtFecha(liqActual.semana_inicio)} — ${fmtFecha(liqActual.semana_fin)}`;
    ventana.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
        <title>Recibos de Pago — ${periodo}</title>
        <style>${ESTILOS_RECIBO}
        @media print { .recibo { page-break-after: always; } }
        </style></head>
        <body>${lineas.map(genReciboHTML).join('')}</body></html>`);
    ventana.document.close();
    ventana.focus();
}
