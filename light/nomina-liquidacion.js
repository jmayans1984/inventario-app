// ================================================================
// NÓMINA - LIQUIDACIÓN
// Crear → Calcular → Aprobar nómina semanal
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
let semanasDisponibles = [];
let liqSelId = '';
let liqActual = null;
let lineas = [];
let expandido = new Set();
let cuentasBancarias = [];

function getEmpresa() {
    return localStorage.getItem('empresaActual') || (window.sesion && window.sesion.empresa) || '';
}

function fmtFecha(f) {
    if (!f) return '—';
    const s = String(f).split('T')[0]; const [y, m, d] = s.split('-');
    const meses = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${parseInt(d)} ${meses[parseInt(m)]} ${y}`;
}
function fmtMoney(v) { return '$' + parseFloat(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtNum(v) { return parseFloat(v || 0).toFixed(1); }

// ── Carga ─────────────────────────────────────────────────────────
async function cargarLiquidaciones() {
    const emp = getEmpresa();
    try {
        const [liqR, semR] = await Promise.all([
            fetch(`${API_BASE}/nomina/liquidaciones?empresa=${emp}`).then(r => r.json()),
            fetch(`${API_BASE}/nomina/semanas?empresa=${emp}`).then(r => r.json()),
        ]);
        liquidaciones      = liqR.data || [];
        semanasDisponibles = semR.data || [];
    } catch (e) { console.error('Error cargando:', e); }

    if (liquidaciones.length && !liqSelId) {
        liqSelId = liquidaciones[0].id;
        await cargarDetalle();
    } else {
        renderTodo();
    }
}

async function cargarDetalle() {
    if (!liqSelId) { liqActual = null; lineas = []; expandido = new Set(); renderTodo(); return; }
    try {
        const r = await fetch(`${API_BASE}/nomina/liquidaciones/${liqSelId}`).then(r => r.json());
        liqActual = r.liquidacion;
        lineas = r.lineas || [];
        expandido = new Set();
    } catch (e) { console.error('Error detalle:', e); }
    renderTodo();
}

function cambiarLiq(id) {
    liqSelId = id;
    cargarDetalle();
}

function toggleExpand(id) {
    if (expandido.has(id)) expandido.delete(id);
    else expandido.add(id);
    renderTodo();
}

function cruzaMeses() {
    if (!liqActual) return false;
    const ini = String(liqActual.semana_inicio).split('T')[0];
    const fin = String(liqActual.semana_fin).split('T')[0];
    return ini.slice(0, 7) !== fin.slice(0, 7);
}

// ── Render ────────────────────────────────────────────────────────
function renderTodo() {
    const esBorrador = liqActual?.estado === 'BORRADOR';
    const esAprobada = liqActual?.estado === 'APROBADA';

    let html = `
        <div style="background:linear-gradient(135deg,#1a0a2e,#3b1a5e);border-radius:16px;padding:16px;margin-bottom:14px;color:white">
            <div style="font-size:16px;font-weight:800;margin-bottom:4px">🧮 LIQUIDACIÓN DE NÓMINA</div>
            ${liqActual ? `<div style="font-size:12px;opacity:.7">${fmtFecha(liqActual.semana_inicio)} — ${fmtFecha(liqActual.semana_fin)}
                <span style="background:rgba(255,255,255,.15);padding:2px 8px;border-radius:5px;font-size:10px;font-weight:800;margin-left:6px">${liqActual.estado}</span></div>` : ''}
            <select onchange="cambiarLiq(this.value)" style="width:100%;height:42px;margin-top:10px;padding:0 10px;border-radius:10px;border:none;font-size:14px;background:rgba(255,255,255,.95)">
                <option value="">— Seleccionar nómina —</option>
                ${liquidaciones.map(l => `<option value="${l.id}" ${String(l.id) === String(liqSelId) ? 'selected' : ''}>${fmtFecha(l.semana_inicio)} · ${l.estado}</option>`).join('')}
            </select>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
                <button onclick="abrirNueva()" style="background:rgba(139,92,246,.4);color:white;border:none;padding:8px 12px;border-radius:10px;font-size:12px;font-weight:700">＋ Nueva</button>
                ${esBorrador ? `<button onclick="calcular()" style="background:rgba(139,92,246,.5);color:white;border:none;padding:8px 12px;border-radius:10px;font-size:12px;font-weight:700">🧮 Calcular</button>` : ''}
                ${esBorrador && lineas.length ? `<button onclick="abrirAprobar()" style="background:rgba(16,185,129,.5);color:white;border:none;padding:8px 12px;border-radius:10px;font-size:12px;font-weight:700">✓ Aprobar</button>` : ''}
                ${esAprobada ? `<button onclick="window.location.href='nomina-recibos.html'" style="background:rgba(6,182,212,.5);color:white;border:none;padding:8px 12px;border-radius:10px;font-size:12px;font-weight:700">📄 Recibos</button>` : ''}
                ${esBorrador ? `<button onclick="borrarLiq()" style="background:rgba(239,68,68,.4);color:white;border:none;padding:8px 12px;border-radius:10px;font-size:12px;font-weight:700">🗑</button>` : ''}
            </div>
        </div>`;

    // Pasos
    if (liqActual) {
        const p2 = lineas.length > 0;
        const p3 = liqActual.estado === 'APROBADA';
        html += `
        <div style="display:flex;align-items:center;background:var(--bg-primary);border:1px solid var(--border);border-radius:12px;padding:10px 16px;margin-bottom:12px;font-size:11px;font-weight:700">
            <span style="color:#10b981">① Crear</span>
            <span style="flex:1;height:1px;background:var(--border);margin:0 10px"></span>
            <span style="color:${p2 ? '#10b981' : 'var(--text-tertiary)'}">② Calcular</span>
            <span style="flex:1;height:1px;background:var(--border);margin:0 10px"></span>
            <span style="color:${p3 ? '#10b981' : 'var(--text-tertiary)'}">③ Aprobar</span>
        </div>`;
    }

    // KPIs
    if (liqActual && lineas.length) {
        const costoTotal = parseFloat(liqActual.total_bruto || 0) + parseFloat(liqActual.total_aportes_er || 0);
        html += `
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:14px">
            <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:12px;padding:12px">
                <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text-tertiary)">Bruto Total</div>
                <div style="font-size:16px;font-weight:800;color:#8b5cf6">${fmtMoney(liqActual.total_bruto)}</div>
            </div>
            <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:12px;padding:12px">
                <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text-tertiary)">Deducciones</div>
                <div style="font-size:16px;font-weight:800;color:#ef4444">${fmtMoney(liqActual.total_deducciones_emp)}</div>
            </div>
            <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:12px;padding:12px">
                <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text-tertiary)">Neto a Pagar</div>
                <div style="font-size:16px;font-weight:800;color:#10b981">${fmtMoney(liqActual.total_neto)}</div>
            </div>
            <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:12px;padding:12px">
                <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text-tertiary)">Costo Empresa</div>
                <div style="font-size:16px;font-weight:800;color:#06b6d4">${fmtMoney(costoTotal)}</div>
            </div>
        </div>`;

        // Lista de líneas (cards expandibles)
        lineas.forEach(l => {
            const exp = expandido.has(l.id);
            const esW2 = l.tipo_empleado === 'W2';
            html += `
            <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:14px;margin-bottom:10px;overflow:hidden">
                <div onclick="toggleExpand(${l.id})" style="padding:12px 14px;cursor:pointer">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                        <div style="min-width:0">
                            <div style="font-weight:700;font-size:13px">${l.apellido}, ${l.nombre}</div>
                            ${l.empresa_contratista ? `<div style="font-size:10px;color:var(--text-tertiary)">${l.empresa_contratista}</div>` : ''}
                        </div>
                        <span style="font-size:9px;font-weight:800;padding:2px 6px;border-radius:4px;background:${esW2 ? 'rgba(139,92,246,.15)' : 'rgba(245,158,11,.15)'};color:${esW2 ? '#8b5cf6' : '#f59e0b'}">${l.tipo_empleado}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-secondary)">
                        <span>${fmtNum(l.horas_regulares)}h reg${parseFloat(l.horas_overtime) > 0 ? ` <b style="color:#ef4444">+${fmtNum(l.horas_overtime)}h OT</b>` : ''}</span>
                        <span>${l.es_monto_fijo ? 'FIJO' : fmtMoney(l.valor_hora) + '/h'}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
                        <span style="font-size:11px;color:var(--text-secondary)">Bruto: <b>${fmtMoney(l.total_bruto)}</b> · Ded: <b style="color:#ef4444">-${fmtMoney(l.total_deducciones)}</b></span>
                        <span style="font-weight:800;color:#10b981;font-size:15px">${fmtMoney(l.total_neto)}</span>
                    </div>
                    <div style="text-align:center;font-size:10px;color:var(--text-tertiary);margin-top:4px">${exp ? '▲ ocultar detalle' : '▼ ver detalle'}</div>
                </div>`;

            if (exp) {
                html += '<div style="background:var(--bg-secondary);padding:12px 14px;border-top:1px solid var(--border)">';
                // Deducciones empleado
                html += '<div style="font-size:9px;font-weight:800;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:6px">DEDUCCIONES EMPLEADO</div>';
                if (!esW2) {
                    html += '<div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0"><span>Sin deducciones (1099)</span><span>—</span></div>';
                } else {
                    const ded = [
                        ['Federal Income Tax (FIT)', l.federal_income_tax],
                        ['Social Security (6.2%)',   l.social_security_emp],
                        ['Medicare (1.45%)',         l.medicare_emp],
                        ['Medicare Adicional (0.9%)',l.medicare_adicional],
                        ["Workers' Comp",            l.workers_comp],
                        ['Otras Deducciones',        l.otras_deducciones],
                    ];
                    ded.forEach(([lbl, v]) => {
                        if (parseFloat(v) > 0) html += `<div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0"><span>${lbl}</span><span style="font-weight:600">-${fmtMoney(v)}</span></div>`;
                    });
                    html += `<div style="display:flex;justify-content:space-between;font-size:11px;padding:4px 0;border-top:1px solid var(--border);margin-top:4px;font-weight:800"><span>TOTAL DEDUCCIONES</span><span>-${fmtMoney(l.total_deducciones)}</span></div>`;
                }

                // Aportes empleador
                html += '<div style="font-size:9px;font-weight:800;text-transform:uppercase;color:var(--text-tertiary);margin:10px 0 6px">APORTES EMPLEADOR (informativo)</div>';
                html += `<div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0"><span>Social Security (6.2%)</span><span style="font-weight:600">${fmtMoney(l.social_security_er)}</span></div>`;
                html += `<div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0"><span>Medicare (1.45%)</span><span style="font-weight:600">${fmtMoney(l.medicare_er)}</span></div>`;
                if (parseFloat(l.futa) > 0) html += `<div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0"><span>FUTA</span><span style="font-weight:600">${fmtMoney(l.futa)}</span></div>`;
                if (parseFloat(l.suta) > 0) html += `<div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0"><span>FL Reemployment Tax</span><span style="font-weight:600">${fmtMoney(l.suta)}</span></div>`;
                html += `<div style="display:flex;justify-content:space-between;font-size:11px;padding:4px 0;border-top:1px solid var(--border);margin-top:4px;font-weight:800"><span>TOTAL APORTES</span><span>${fmtMoney(l.total_aportes_er)}</span></div>`;

                // Desglose por ccosto
                if (l.ccostos?.length) {
                    html += '<div style="font-size:9px;font-weight:800;text-transform:uppercase;color:var(--text-tertiary);margin:10px 0 6px">DESGLOSE POR CENTRO DE COSTO</div>';
                    l.ccostos.forEach(cc => {
                        html += `<div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0"><span>${cc.ccosto_nombre || cc.ccosto} — ${fmtNum(cc.horas)}h</span><span style="font-weight:600">${fmtMoney(cc.costo_bruto)}</span></div>`;
                    });
                }

                // Resumen
                html += `<div style="display:flex;justify-content:space-between;font-size:12px;padding:6px 0;border-top:1px solid var(--border);margin-top:8px;font-weight:800;color:#10b981"><span>NETO A PAGAR</span><span>${fmtMoney(l.total_neto)}</span></div>`;
                html += `<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-tertiary)"><span>YTD Bruto acumulado</span><span>${fmtMoney(l.ytd_bruto)}</span></div>`;
                html += '</div>';
            }
            html += '</div>';
        });
    } else if (liqSelId) {
        html += `
        <div style="padding:40px 20px;text-align:center;color:var(--text-tertiary)">
            <div style="font-size:36px;margin-bottom:10px">🧮</div>
            <div style="font-weight:700;color:var(--text-primary)">Nómina sin calcular</div>
            <div style="font-size:12px;margin-top:4px">Haz clic en <b>"Calcular"</b> para procesar las horas del horario y generar los valores de pago.</div>
        </div>`;
    } else {
        html += `
        <div style="padding:40px 20px;text-align:center;color:var(--text-tertiary)">
            <div style="font-size:36px;margin-bottom:10px">💰</div>
            <div style="font-weight:700;color:var(--text-primary)">Selecciona una nómina</div>
            <div style="font-size:12px;margin-top:4px">O crea una nueva con el botón <b>"＋ Nueva"</b></div>
        </div>`;
    }

    document.getElementById('lqContent').innerHTML = html;
}

// ── Nueva nómina ──────────────────────────────────────────────────
function abrirNueva() {
    document.getElementById('lqNuevaSemana').innerHTML =
        '<option value="">— Sin vincular a horario —</option>' +
        semanasDisponibles.map(s => `<option value="${s.id}">${fmtFecha(s.semana_inicio)} — ${fmtFecha(s.semana_fin)} · ${s.estado}</option>`).join('');
    document.getElementById('lqNuevaInicio').value = '';
    document.getElementById('lqNuevaFin').value = '';
    document.getElementById('lqSemanaHint').style.display = 'none';
    document.getElementById('lqModalNueva').classList.add('open');
}

function onSemanaChange() {
    const id = document.getElementById('lqNuevaSemana').value;
    const sem = semanasDisponibles.find(s => String(s.id) === String(id));
    document.getElementById('lqSemanaHint').style.display = id ? 'block' : 'none';
    if (sem) {
        document.getElementById('lqNuevaInicio').value = String(sem.semana_inicio).split('T')[0];
        document.getElementById('lqNuevaFin').value    = String(sem.semana_fin).split('T')[0];
    }
}

function calcNuevaFin() {
    const inicio = document.getElementById('lqNuevaInicio').value;
    const semanaId = document.getElementById('lqNuevaSemana').value;
    if (!inicio || semanaId) return;
    const d = new Date(inicio + 'T00:00:00');
    d.setDate(d.getDate() + 6);
    document.getElementById('lqNuevaFin').value = d.toISOString().split('T')[0];
}

async function crearLiq() {
    const inicio = document.getElementById('lqNuevaInicio').value;
    const fin    = document.getElementById('lqNuevaFin').value;
    const semId  = document.getElementById('lqNuevaSemana').value;
    if (!inicio || !fin) { alert('❌ Indica el período'); return; }

    try {
        const r = await fetch(`${API_BASE}/nomina/liquidaciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                empresa: getEmpresa(),
                semana_inicio: inicio,
                semana_fin: fin,
                semana_id: semId || null
            }),
        }).then(r => r.json());
        document.getElementById('lqModalNueva').classList.remove('open');
        await cargarLiquidacionesSolo();
        liqSelId = r.data?.id;
        await cargarDetalle();
    } catch (e) { alert('❌ ' + e.message); }
}

async function cargarLiquidacionesSolo() {
    try {
        const r = await fetch(`${API_BASE}/nomina/liquidaciones?empresa=${getEmpresa()}`).then(r => r.json());
        liquidaciones = r.data || [];
    } catch (e) { console.error(e); }
}

// ── Calcular ──────────────────────────────────────────────────────
async function calcular() {
    try {
        const r = await fetch(`${API_BASE}/nomina/liquidaciones/${liqSelId}/calcular`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empresa: getEmpresa() }),
        }).then(r => r.json());
        if (r.error) throw new Error(r.error);
        await cargarDetalle();
    } catch (e) { alert('❌ ' + e.message); }
}

// ── Aprobar ───────────────────────────────────────────────────────
async function abrirAprobar() {
    if (!cuentasBancarias.length) {
        try {
            const r = await fetch(`${API_BASE}/cuentas-bancarias?empresa=${getEmpresa()}`).then(r => r.json());
            cuentasBancarias = r.data || r || [];
        } catch (e) { cuentasBancarias = []; }
    }

    const costoTotal = parseFloat(liqActual?.total_bruto || 0) + parseFloat(liqActual?.total_aportes_er || 0);
    document.getElementById('lqAprobarResumen').innerHTML = `
        <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0"><span>Período</span><span style="font-weight:600">${fmtFecha(liqActual?.semana_inicio)} — ${fmtFecha(liqActual?.semana_fin)}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0"><span>Bruto empleados</span><span style="font-weight:600">${fmtMoney(liqActual?.total_bruto)}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0"><span>Aportes empleador</span><span style="font-weight:600">${fmtMoney(liqActual?.total_aportes_er)}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;padding:5px 0;border-top:1px solid var(--border);font-weight:700"><span>Costo total empresa</span><span style="color:#8b5cf6">${fmtMoney(costoTotal)}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0;font-weight:800;color:#10b981"><span>NETO A PAGAR</span><span>${fmtMoney(liqActual?.total_neto)}</span></div>
    `;
    document.getElementById('lqProrateInfo').style.display = cruzaMeses() ? 'block' : 'none';
    document.getElementById('lqFechaPago').value = '';
    document.getElementById('lqBanco').innerHTML =
        '<option value="">— Sin registrar movimiento bancario —</option>' +
        cuentasBancarias.map(c => `<option value="${c.codigo}">${c.nombre_cta}</option>`).join('');
    document.getElementById('lqModalAprobar').classList.add('open');
}

async function confirmarAprobar() {
    const banco = document.getElementById('lqBanco').value;
    const fechaPago = document.getElementById('lqFechaPago').value;

    if (!banco) {
        const continuar = confirm('⚠️ No seleccionaste una cuenta bancaria.\n\nSe creará el gasto contable pero NO se registrará movimiento bancario.\n\n¿Continuar de todas formas?');
        if (!continuar) return;
    }

    try {
        const r = await fetch(`${API_BASE}/nomina/liquidaciones/${liqSelId}/aprobar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                empresa: getEmpresa(),
                banco: banco || null,
                fechaPago: fechaPago || null
            }),
        }).then(r => r.json());
        if (r.error) throw new Error(r.error);
        document.getElementById('lqModalAprobar').classList.remove('open');
        alert(`✅ ${r.message}`);
        await cargarDetalle();
    } catch (e) { alert('❌ ' + e.message); }
}

// ── Borrar ────────────────────────────────────────────────────────
async function borrarLiq() {
    if (!confirm('¿Eliminar esta nómina en BORRADOR? Se borrarán todos los datos calculados.')) return;
    try {
        await fetch(`${API_BASE}/nomina/liquidaciones/${liqSelId}`, { method: 'DELETE' });
        liqSelId = '';
        await cargarLiquidacionesSolo();
        await cargarDetalle();
    } catch (e) { alert('❌ ' + e.message); }
}
