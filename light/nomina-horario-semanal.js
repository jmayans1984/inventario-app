// ================================================================
// NÓMINA - HORARIO SEMANAL
// Grid por centro de costo, turnos por empleado/día
// ================================================================

const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api';

window.addEventListener('load', () => {
    if (!localStorage.getItem('empresaActual') || !localStorage.getItem('usuario')) {
        window.location.href = 'index.html';
        return;
    }
    cargarSemanas();
});

const DIAS = [
    { label: 'Lun', offset: 0 }, { label: 'Mar', offset: 1 }, { label: 'Mié', offset: 2 },
    { label: 'Jue', offset: 3 }, { label: 'Vie', offset: 4 }, { label: 'Sáb', offset: 5 }, { label: 'Dom', offset: 6 }
];

let semanas = [];
let semanaSelId = '';
let semanaActual = null;
let detalle = [];
let empleadosActivos = [];
let ccostos = [];
let horarioConfigs = [];
let empleadosAgregados = {};   // { [ccostoId]: [emp, ...] }

// Estado del modal de turno
let editEmp = null, editFecha = '', editCcosto = '', turnoEdit = null;
let agregarEmpCcosto = '';

function getEmpresa() {
    return localStorage.getItem('empresaActual') || (window.sesion && window.sesion.empresa) || '';
}

function fmtMoney(v) { return '$' + parseFloat(v ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtHoras(v) { return parseFloat(v ?? 0).toFixed(1); }

function addDays(dateStr, days) {
    if (!dateStr) return null;
    try {
        const dateOnly = String(dateStr).split('T')[0];
        const d = new Date(dateOnly + 'T00:00:00');
        if (isNaN(d.getTime())) return null;
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
    } catch { return null; }
}

function fmtFecha(f) {
    if (!f) return '—';
    const s = String(f).split('T')[0]; const [y, m, d] = s.split('-');
    const meses = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${parseInt(d)} ${meses[parseInt(m)]} ${y}`;
}

function fmtDiaMes(inicio, offset) {
    if (!inicio) return '—';
    try { const f = addDays(inicio, offset); const [, m, d] = f.split('-'); return `${parseInt(d)}/${parseInt(m)}`; }
    catch { return '—'; }
}

function fmtFechaLarga(f) {
    if (!f) return '';
    const dias = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const dateOnly = String(f).split('T')[0];
    const d = new Date(dateOnly + 'T00:00:00');
    const [, m, dd] = dateOnly.split('-');
    return `${dias[d.getDay()]} ${parseInt(dd)}/${parseInt(m)}`;
}

function getNombreDisplay(emp) {
    if (emp.tipo_empleado === '1099' && emp.empresa_contratista) {
        return `${emp.apellido}, ${emp.nombre} - ${emp.empresa_contratista}`;
    }
    return `${emp.apellido}, ${emp.nombre}`;
}

// ── Carga ─────────────────────────────────────────────────────────
async function cargarSemanas() {
    const emp = getEmpresa();
    try {
        const [semsR, ccR, hcR, empR] = await Promise.all([
            fetch(`${API_BASE}/nomina/semanas?empresa=${emp}`).then(r => r.json()),
            fetch(`${API_BASE}/ccostos?empresa=${emp}`).then(r => r.json()),
            fetch(`${API_BASE}/nomina/horario-config?empresa=${emp}`).then(r => r.json()),
            fetch(`${API_BASE}/nomina/empleados?empresa=${emp}&estado=ACTIVO`).then(r => r.json()),
        ]);
        semanas          = semsR.data || [];
        ccostos          = ccR.data || [];
        horarioConfigs   = hcR.data || [];
        empleadosActivos = empR.data || [];
    } catch (e) { console.error('Error cargando datos:', e); }

    if (semanas.length && !semanaSelId) {
        semanaSelId = semanas[0].id;
        await cargarDetalle();
    } else {
        renderTodo();
    }
}

async function cargarDetalle() {
    if (!semanaSelId) { semanaActual = null; detalle = []; renderTodo(); return; }
    try {
        const r = await fetch(`${API_BASE}/nomina/semanas/${semanaSelId}/detalle`).then(r => r.json());
        semanaActual = r.semana;
        detalle = r.detalle || [];
    } catch (e) { console.error('Error detalle:', e); }
    renderTodo();
}

function cambiarSemana(id) {
    semanaSelId = id;
    empleadosAgregados = {};
    cargarDetalle();
}

// ── Helpers de turnos ─────────────────────────────────────────────
function empleadosParaCcosto(ccostoId) {
    const conTurnos = new Set(detalle.filter(d => d.ccosto === ccostoId).map(d => d.empleado_id));
    const agregadosIds = new Set((empleadosAgregados[ccostoId] || []).map(e => e.id));
    return empleadosActivos
        .filter(e => e.ccosto === ccostoId || conTurnos.has(e.id) || agregadosIds.has(e.id))
        .sort((a, b) => a.apellido.localeCompare(b.apellido));
}

function getTurnoCcosto(empId, semanaInicio, offset, ccostoId) {
    if (!semanaInicio) return null;
    const fecha = addDays(semanaInicio, offset);
    if (!fecha) return null;
    return detalle.find(d =>
        d.empleado_id === empId &&
        d.fecha?.split('T')[0] === fecha &&
        d.ccosto === ccostoId
    ) || null;
}

function totalHorasCcosto(ccostoId) {
    return detalle
        .filter(d => d.ccosto === ccostoId && !d.es_dia_libre)
        .reduce((s, d) => s + parseFloat(d.real_horas ?? d.prog_horas ?? 0), 0)
        .toFixed(0);
}

// ── Resumen semanal (misma lógica con dedup) ──────────────────────
function resumenEmpleados() {
    const map = {};
    const seen = new Set();
    const deduped = [];
    detalle.filter(d => !d.es_dia_libre).forEach(d => {
        const key = `${d.empleado_id}-${String(d.fecha).split('T')[0]}-${d.ccosto}`;
        if (!seen.has(key)) { seen.add(key); deduped.push(d); }
    });

    deduped.forEach(d => {
        if (!map[d.empleado_id]) {
            const empInfo = empleadosActivos.find(e => e.id === d.empleado_id);
            map[d.empleado_id] = {
                id: d.empleado_id,
                nombre: d.nombre,
                apellido: d.apellido,
                empresa_contratista: d.empresa_contratista,
                tipo_empleado: d.tipo_empleado,
                valor_hora:  parseFloat(empInfo?.valor_hora ?? 0),
                monto_fijo:  parseFloat(empInfo?.monto_fijo_semanal ?? 0),
                es_por_horas: empInfo?.es_por_horas !== false,
                total: 0,
                centros: new Set()
            };
        }
        map[d.empleado_id].total += parseFloat(d.real_horas ?? d.prog_horas ?? 0);
        if (d.ccosto) map[d.empleado_id].centros.add(d.ccosto);
    });

    return Object.values(map).map(e => {
        const regular  = Math.min(e.total, 40);
        const overtime = Math.max(e.total - 40, 0);
        const totalPagar = e.es_por_horas
            ? (regular * e.valor_hora) + (overtime * e.valor_hora * 1.5)
            : e.monto_fijo;
        return { ...e, centros: [...e.centros], regular, overtime, totalPagar };
    }).sort((a, b) => a.apellido.localeCompare(b.apellido));
}

// ── Render ────────────────────────────────────────────────────────
function renderTodo() {
    const esBorrador = semanaActual?.estado === 'BORRADOR';

    let html = `
        <div style="background:linear-gradient(135deg,#0c2340,#1a3a6e);border-radius:16px;padding:16px;margin-bottom:14px;color:white">
            <div style="font-size:16px;font-weight:800;margin-bottom:4px">📅 HORARIO SEMANAL</div>
            ${semanaActual ? `<div style="font-size:12px;opacity:.7">${fmtFecha(semanaActual.semana_inicio)} — ${fmtFecha(semanaActual.semana_fin)}
                <span style="background:rgba(255,255,255,.15);padding:2px 8px;border-radius:5px;font-size:10px;font-weight:800;margin-left:6px">${semanaActual.estado}</span></div>` : ''}
            <select onchange="cambiarSemana(this.value)" style="width:100%;height:42px;margin-top:10px;padding:0 10px;border-radius:10px;border:none;font-size:14px;background:rgba(255,255,255,.95)">
                <option value="">— Seleccionar semana —</option>
                ${semanas.map(s => `<option value="${s.id}" ${String(s.id) === String(semanaSelId) ? 'selected' : ''}>${fmtFecha(s.semana_inicio)} al ${fmtFecha(s.semana_fin)}</option>`).join('')}
            </select>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
                <button onclick="abrirNuevaSemana()" style="background:rgba(6,182,212,.3);color:white;border:none;padding:8px 12px;border-radius:10px;font-size:12px;font-weight:700">＋ Semana</button>
                ${esBorrador ? `
                    <button onclick="generarHorario()" style="background:rgba(16,185,129,.4);color:white;border:none;padding:8px 12px;border-radius:10px;font-size:12px;font-weight:700">✨ Plantilla</button>
                    <button onclick="copiarSemanaAnterior()" style="background:rgba(139,92,246,.4);color:white;border:none;padding:8px 12px;border-radius:10px;font-size:12px;font-weight:700">📋 Copiar Ant.</button>
                    <button onclick="publicar()" style="background:rgba(245,158,11,.4);color:white;border:none;padding:8px 12px;border-radius:10px;font-size:12px;font-weight:700">📤 Publicar</button>
                ` : ''}
                ${semanaActual ? `
                    <button onclick="window.location.href='nomina-reporte-horario.html'" style="background:rgba(139,92,246,.4);color:white;border:none;padding:8px 12px;border-radius:10px;font-size:12px;font-weight:700">🖨 Imprimir</button>
                    <button onclick="borrarSemana()" style="background:rgba(239,68,68,.4);color:white;border:none;padding:8px 12px;border-radius:10px;font-size:12px;font-weight:700">🗑 Borrar</button>
                ` : ''}
            </div>
        </div>`;

    if (!semanaSelId || !semanaActual) {
        html += '<div style="padding:32px;text-align:center;color:var(--text-tertiary)">Selecciona una semana o crea una nueva.</div>';
        document.getElementById('hsContent').innerHTML = html;
        return;
    }

    // Un grid por CC
    ccostos.forEach(cc => {
        const emps = empleadosParaCcosto(cc.codigo);
        html += `
        <div style="margin-bottom:18px">
            <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--bg-secondary);border:1px solid var(--border);border-bottom:none;border-radius:14px 14px 0 0">
                <span style="width:8px;height:8px;border-radius:50%;background:#06b6d4"></span>
                <span style="font-size:13px;font-weight:800">${cc.nombre}</span>
                <span style="font-size:10px;color:var(--text-tertiary);margin-left:auto">${emps.length} emp · ${totalHorasCcosto(cc.codigo)}h</span>
            </div>
            <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:0 0 14px 14px;overflow:hidden">`;

        if (emps.length) {
            html += '<div style="overflow-x:auto"><table class="hs-grid-table" style="width:100%">';
            html += `<thead><tr>
                <th style="text-align:left;min-width:130px;padding-left:10px">EMPLEADO</th>
                ${DIAS.map(d => `<th>${d.label}<br><span style="font-weight:400;font-size:8px">${fmtDiaMes(semanaActual.semana_inicio, d.offset)}</span></th>`).join('')}
            </tr></thead><tbody>`;

            emps.forEach(emp => {
                html += `<tr>
                    <td style="text-align:left;padding:6px 10px;background:var(--bg-secondary)">
                        <div style="font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px">${getNombreDisplay(emp)}</div>
                        <span style="font-size:8px;font-weight:800;padding:1px 4px;border-radius:3px;background:${emp.tipo_empleado === 'W2' ? 'rgba(139,92,246,.15)' : 'rgba(245,158,11,.15)'};color:${emp.tipo_empleado === 'W2' ? '#8b5cf6' : '#f59e0b'}">${emp.tipo_empleado}</span>
                    </td>`;
                DIAS.forEach(d => {
                    const t = getTurnoCcosto(emp.id, semanaActual.semana_inicio, d.offset, cc.codigo);
                    let cell;
                    if (t && !t.es_dia_libre) {
                        cell = `<div style="font-size:9px;font-weight:600;color:#06b6d4">${(t.real_inicio || t.prog_inicio || '—').slice(0,5)}–${(t.real_fin || t.prog_fin || '—').slice(0,5)}</div>
                                <div style="font-size:11px;font-weight:700;${t.ajustado ? 'color:#f59e0b' : ''}">${fmtHoras(t.real_horas ?? t.prog_horas)}h</div>`;
                    } else if (t && t.es_dia_libre) {
                        cell = `<div style="font-size:9px;color:var(--text-tertiary)">${t.ausencia_tipo || 'LIBRE'}</div>`;
                    } else {
                        cell = '<div style="font-size:18px;color:var(--border)">+</div>';
                    }
                    html += `<td class="hs-turno-cell" onclick='abrirEditarTurno(${emp.id}, ${d.offset}, "${cc.codigo}")'>${cell}</td>`;
                });
                html += '</tr>';
            });
            html += '</tbody></table></div>';
        } else {
            html += '<div style="padding:18px;text-align:center;color:var(--text-tertiary);font-size:12px">Sin empleados asignados a este centro</div>';
        }

        if (semanaActual.estado !== 'CERRADO') {
            html += `<div style="padding:8px 12px;border-top:1px solid var(--border);text-align:right">
                <button onclick="abrirAgregarEmp('${cc.codigo}')" style="background:rgba(6,182,212,.1);color:#06b6d4;border:none;padding:8px 12px;border-radius:10px;font-size:12px;font-weight:700">＋ Agregar Empleado</button>
            </div>`;
        }
        html += '</div></div>';
    });

    // Resumen
    const resumen = resumenEmpleados();
    if (resumen.length) {
        const totReg   = resumen.reduce((s, e) => s + e.regular, 0);
        const totOT    = resumen.reduce((s, e) => s + e.overtime, 0);
        const totHrs   = resumen.reduce((s, e) => s + e.total, 0);
        const totPagar = resumen.reduce((s, e) => s + e.totalPagar, 0);

        html += `
        <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:14px;overflow:hidden;margin-bottom:18px">
            <div style="padding:12px 16px;font-size:11px;font-weight:800;letter-spacing:.8px;color:var(--text-secondary);border-bottom:1px solid var(--border)">📊 RESUMEN SEMANAL — HORAS POR EMPLEADO</div>
            <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11px;min-width:520px">
                <thead><tr style="background:var(--bg-secondary)">
                    <th style="padding:7px 10px;text-align:left;font-size:9px;color:var(--text-tertiary)">EMPLEADO</th>
                    <th style="padding:7px 6px;font-size:9px;color:var(--text-tertiary)">REG.</th>
                    <th style="padding:7px 6px;font-size:9px;color:var(--text-tertiary)">OT</th>
                    <th style="padding:7px 6px;font-size:9px;color:var(--text-tertiary)">TOTAL</th>
                    <th style="padding:7px 6px;font-size:9px;color:var(--text-tertiary)">$/HR</th>
                    <th style="padding:7px 10px;text-align:right;font-size:9px;color:var(--text-tertiary)">A PAGAR</th>
                </tr></thead><tbody>`;

        resumen.forEach(r => {
            html += `<tr style="border-bottom:1px solid var(--border);${r.overtime > 0 ? 'background:rgba(239,68,68,.03)' : ''}">
                <td style="padding:7px 10px;font-weight:600">${r.apellido}, ${r.nombre}${r.empresa_contratista ? `<span style="font-size:9px;color:var(--text-tertiary)"> · ${r.empresa_contratista}</span>` : ''}</td>
                <td style="padding:7px 6px;text-align:center;color:#10b981;font-weight:700">${r.regular.toFixed(1)}h</td>
                <td style="padding:7px 6px;text-align:center">${r.overtime > 0 ? `<span style="background:rgba(239,68,68,.12);color:#ef4444;font-weight:800;padding:1px 6px;border-radius:5px;font-size:10px">+${r.overtime.toFixed(1)}h</span>` : '—'}</td>
                <td style="padding:7px 6px;text-align:center;font-weight:700">${r.total.toFixed(1)}h</td>
                <td style="padding:7px 6px;text-align:center;font-size:10px">${r.es_por_horas ? fmtMoney(r.valor_hora) : '<span style="background:rgba(139,92,246,.1);color:#8b5cf6;padding:1px 5px;border-radius:4px;font-weight:700;font-size:9px">FIJO</span>'}</td>
                <td style="padding:7px 10px;text-align:right;font-weight:800;color:#10b981">${fmtMoney(r.totalPagar)}</td>
            </tr>`;
        });

        html += `<tr style="background:var(--bg-secondary);border-top:2px solid var(--border)">
                <td style="padding:9px 10px;font-weight:800">TOTAL EMPRESA</td>
                <td style="padding:9px 6px;text-align:center;font-weight:800">${totReg.toFixed(1)}h</td>
                <td style="padding:9px 6px;text-align:center;font-weight:800;color:#ef4444">${totOT.toFixed(1)}h</td>
                <td style="padding:9px 6px;text-align:center;font-weight:800">${totHrs.toFixed(1)}h</td>
                <td></td>
                <td style="padding:9px 10px;text-align:right;font-weight:800;color:#10b981;font-size:13px">${fmtMoney(totPagar)}</td>
            </tr></tbody></table></div>
        </div>`;
    }

    document.getElementById('hsContent').innerHTML = html;
}

// ── Semanas ───────────────────────────────────────────────────────
function abrirNuevaSemana() {
    document.getElementById('hsNuevaSemanaInicio').value = '';
    document.getElementById('hsModalNuevaSemana').classList.add('open');
}

async function crearSemana() {
    const inicio = document.getElementById('hsNuevaSemanaInicio').value;
    if (!inicio) return;
    const d = new Date(inicio + 'T00:00:00');
    if (d.getDay() !== 1) { alert('La fecha debe ser un lunes'); return; }
    const fin = addDays(inicio, 6);

    try {
        const r = await fetch(`${API_BASE}/nomina/semanas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empresa: getEmpresa(), semana_inicio: inicio, semana_fin: fin }),
        }).then(r => r.json());
        document.getElementById('hsModalNuevaSemana').classList.remove('open');
        await cargarSemanasSolo();
        semanaSelId = r.data?.id;
        await cargarDetalle();
    } catch (e) { alert('❌ ' + (e.message || 'Error creando semana')); }
}

async function cargarSemanasSolo() {
    try {
        const r = await fetch(`${API_BASE}/nomina/semanas?empresa=${getEmpresa()}`).then(r => r.json());
        semanas = r.data || [];
    } catch (e) { console.error(e); }
}

async function borrarSemana() {
    if (!semanaSelId || !semanaActual) return;
    const label = `${fmtFecha(semanaActual.semana_inicio)} — ${fmtFecha(semanaActual.semana_fin)}`;
    if (!confirm(`⚠️ ¿Borrar COMPLETAMENTE la semana "${label}"?\n\nEsto eliminará la semana y TODOS sus turnos.\nEsta acción no se puede deshacer.`)) return;
    try {
        await fetch(`${API_BASE}/nomina/semanas/${semanaSelId}`, { method: 'DELETE' });
        semanaSelId = '';
        semanaActual = null;
        detalle = [];
        await cargarSemanasSolo();
        renderTodo();
    } catch (e) { alert('❌ Error al borrar: ' + e.message); }
}

async function copiarSemanaAnterior() {
    if (!semanaSelId) return;
    if (!confirm('¿Copiar el horario completo de la semana anterior?\n\nSolo se copiarán los días que aún no tengan turno asignado.')) return;
    try {
        const r = await fetch(`${API_BASE}/nomina/semanas/${semanaSelId}/copiar-anterior`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empresa: getEmpresa() }),
        }).then(r => r.json());
        alert(r.message || '✅ Semana copiada correctamente');
        await cargarDetalle();
    } catch (e) { alert('❌ ' + e.message); }
}

async function generarHorario() {
    if (!semanaSelId) return;
    const cfgId = horarioConfigs[0]?.id || null;
    if (!cfgId) { alert('⚠️ No hay plantillas de horario. Crea una primero.'); return; }
    try {
        await fetch(`${API_BASE}/nomina/semanas/${semanaSelId}/generar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empresa: getEmpresa(), config_id: cfgId }),
        });
        await cargarDetalle();
    } catch (e) { alert('❌ Error: ' + e.message); }
}

async function publicar() {
    if (!semanaSelId) return;
    try {
        await fetch(`${API_BASE}/nomina/semanas/${semanaSelId}/publicar`, { method: 'PUT' });
        await cargarDetalle();
    } catch (e) { alert('❌ Error al publicar: ' + e.message); }
}

// ── Agregar empleado a un centro ──────────────────────────────────
function abrirAgregarEmp(ccostoId) {
    agregarEmpCcosto = ccostoId;
    const ccNombre = ccostos.find(c => c.codigo === ccostoId)?.nombre || ccostoId;
    document.getElementById('hsAgregarTitulo').textContent = `Agregar a ${ccNombre}`;
    document.getElementById('hsBuscarEmp').value = '';
    renderListaEmpAgregar();
    document.getElementById('hsModalAgregarEmp').classList.add('open');
}

function renderListaEmpAgregar() {
    const yaEnGrilla = new Set(empleadosParaCcosto(agregarEmpCcosto).map(e => e.id));
    const q = (document.getElementById('hsBuscarEmp').value || '').toLowerCase();
    const disponibles = empleadosActivos
        .filter(e => !yaEnGrilla.has(e.id))
        .filter(e => !q || `${e.apellido} ${e.nombre}`.toLowerCase().includes(q))
        .sort((a, b) => a.apellido.localeCompare(b.apellido));

    if (disponibles.length === 0) {
        document.getElementById('hsListaEmpAgregar').innerHTML =
            '<div style="text-align:center;padding:20px;color:var(--text-tertiary);font-size:12px">Todos los empleados ya están en este centro</div>';
        return;
    }

    document.getElementById('hsListaEmpAgregar').innerHTML = disponibles.map(e => `
        <div onclick='agregarEmpleadoAVista(${e.id})' style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border:1px solid var(--border);border-radius:10px;margin-bottom:6px;cursor:pointer">
            <div>
                <div style="font-size:13px;font-weight:600">${e.apellido}, ${e.nombre}</div>
                <div style="font-size:10px;color:var(--text-tertiary)">${e.cargo_nombre || 'Sin cargo'} · ${e.ccosto_nombre || e.ccosto || '—'}</div>
            </div>
            <span style="font-size:9px;font-weight:800;padding:2px 5px;border-radius:3px;background:${e.tipo_empleado === 'W2' ? 'rgba(139,92,246,.15)' : 'rgba(245,158,11,.15)'};color:${e.tipo_empleado === 'W2' ? '#8b5cf6' : '#f59e0b'}">${e.tipo_empleado}</span>
        </div>
    `).join('');
}

function agregarEmpleadoAVista(empId) {
    const emp = empleadosActivos.find(e => e.id === empId);
    if (!emp) return;
    if (!empleadosAgregados[agregarEmpCcosto]) empleadosAgregados[agregarEmpCcosto] = [];
    if (!empleadosAgregados[agregarEmpCcosto].find(e => e.id === emp.id)) {
        empleadosAgregados[agregarEmpCcosto].push(emp);
    }
    document.getElementById('hsModalAgregarEmp').classList.remove('open');
    renderTodo();
}

// ── Editar / crear turno ──────────────────────────────────────────
function abrirEditarTurno(empId, offset, ccostoId) {
    if (semanaActual?.estado === 'CERRADO') return;
    const emp = empleadosActivos.find(e => e.id === empId);
    if (!emp) return;
    const fecha = addDays(semanaActual.semana_inicio, offset);
    if (!fecha) return;

    const diaSemana = offset + 1;
    const t = getTurnoCcosto(empId, semanaActual.semana_inicio, offset, ccostoId);
    const diaConfig = horarioConfigs.length > 0
        ? horarioConfigs[0].dias?.find(d => d.dia_semana === diaSemana)
        : null;

    editEmp = emp;
    editFecha = fecha;
    editCcosto = ccostoId;
    turnoEdit = t ? {
        id:            t.id,
        real_inicio:   t.real_inicio?.slice(0,5) || t.prog_inicio?.slice(0,5) || diaConfig?.hora_inicio || '',
        real_fin:      t.real_fin?.slice(0,5)    || t.prog_fin?.slice(0,5)    || diaConfig?.hora_fin    || '',
        real_horas:    t.real_horas ?? t.prog_horas ?? diaConfig?.horas_default ?? 0,
        ccosto:        t.ccosto || ccostoId,
        es_dia_libre:  t.es_dia_libre || false,
        ausencia_tipo: t.ausencia_tipo || '',
        notas:         t.notas || ''
    } : {
        id:            null,
        semana_id:     semanaActual.id,
        empleado_id:   emp.id,
        fecha,
        real_inicio:   diaConfig?.hora_inicio || '',
        real_fin:      diaConfig?.hora_fin    || '',
        real_horas:    diaConfig?.horas_default || 0,
        ccosto:        ccostoId,
        es_dia_libre:  !diaConfig,
        ausencia_tipo: '',
        notas:         ''
    };

    const ccNombre = ccostos.find(c => c.codigo === ccostoId)?.nombre || ccostoId;
    document.getElementById('hsTurnoTitulo').textContent = `${emp.apellido}, ${emp.nombre}`;
    document.getElementById('hsTurnoSub').textContent = `${fmtFechaLarga(fecha)} · ${ccNombre}`;
    document.getElementById('hsEsLibre').checked = turnoEdit.es_dia_libre;
    document.getElementById('hsInicio').value = turnoEdit.real_inicio;
    document.getElementById('hsFin').value = turnoEdit.real_fin;
    document.getElementById('hsAusenciaTipo').value = turnoEdit.ausencia_tipo;
    document.getElementById('hsNotas').value = turnoEdit.notas;
    document.getElementById('hsBtnEliminar').style.display = turnoEdit.id ? 'block' : 'none';
    toggleLibre();
    mostrarHorasCalc();
    document.getElementById('hsModalTurno').classList.add('open');
}

function toggleLibre() {
    const libre = document.getElementById('hsEsLibre').checked;
    document.getElementById('hsCamposHoras').style.display = libre ? 'none' : 'block';
    document.getElementById('hsCampoAusencia').style.display = libre ? 'block' : 'none';
}

function calcHorasAuto() {
    const ini = document.getElementById('hsInicio').value;
    const fin = document.getElementById('hsFin').value;
    if (!ini || !fin) return;
    const [h1, m1] = ini.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);
    let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (mins <= 0) mins += 24 * 60;
    turnoEdit.real_horas = parseFloat((mins / 60).toFixed(2));
    mostrarHorasCalc();
}

function mostrarHorasCalc() {
    const el = document.getElementById('hsHorasCalc');
    if (turnoEdit && turnoEdit.real_horas > 0) {
        el.textContent = `🕐 ${fmtHoras(turnoEdit.real_horas)} horas calculadas`;
        el.style.display = 'block';
    } else {
        el.style.display = 'none';
    }
}

function cerrarModalTurno() {
    document.getElementById('hsModalTurno').classList.remove('open');
}

function mostrarError(titulo, mensaje) {
    document.getElementById('hsErrorTitulo').textContent = titulo;
    document.getElementById('hsErrorMsg').textContent = mensaje;
    document.getElementById('hsModalError').classList.add('open');
}

async function guardarTurno() {
    if (!turnoEdit) return;
    turnoEdit.es_dia_libre  = document.getElementById('hsEsLibre').checked;
    turnoEdit.real_inicio   = document.getElementById('hsInicio').value;
    turnoEdit.real_fin      = document.getElementById('hsFin').value;
    turnoEdit.ausencia_tipo = document.getElementById('hsAusenciaTipo').value;
    turnoEdit.notas         = document.getElementById('hsNotas').value;

    try {
        if (!turnoEdit.id) {
            const r = await fetch(`${API_BASE}/nomina/semanas/${turnoEdit.semana_id}/detalle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    empleado_id:   turnoEdit.empleado_id,
                    fecha:         turnoEdit.fecha,
                    real_inicio:   turnoEdit.real_inicio || null,
                    real_fin:      turnoEdit.real_fin    || null,
                    real_horas:    turnoEdit.real_horas  || 0,
                    ccosto:        turnoEdit.ccosto      || '',
                    es_dia_libre:  turnoEdit.es_dia_libre || false,
                    ausencia_tipo: turnoEdit.ausencia_tipo || '',
                    notas:         turnoEdit.notas || ''
                }),
            });
            const j = await r.json();
            if (!r.ok) {
                const errMsg = j.error || j.message || 'Error al guardar el turno';
                const ccNombre = ccostos.find(c => c.codigo === turnoEdit.ccosto)?.nombre || turnoEdit.ccosto;
                const msgConCC = errMsg.replace(/centro\s+"[^"]*"/i, `centro "${ccNombre}"`);
                throw new Error(msgConCC);
            }
        } else {
            const r = await fetch(`${API_BASE}/nomina/semanas/${turnoEdit.semana_id}/detalle/${turnoEdit.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(turnoEdit),
            });
            const j = await r.json();
            if (!r.ok) {
                const errMsg = j.error || j.message || 'Error al actualizar el turno';
                const ccNombre = ccostos.find(c => c.codigo === turnoEdit.ccosto)?.nombre || turnoEdit.ccosto;
                const msgConCC = errMsg.replace(/centro\s+"[^"]*"/i, `centro "${ccNombre}"`);
                throw new Error(msgConCC);
            }
        }
        cerrarModalTurno();
        await cargarDetalle();
    } catch (e) {
        mostrarError('No se pudo guardar el turno', e.message);
    }
}

async function eliminarTurno() {
    if (!turnoEdit?.id) return;
    if (!confirm(`¿Eliminar turno de ${editEmp?.apellido}, ${editEmp?.nombre}?`)) return;
    try {
        await fetch(`${API_BASE}/nomina/semanas/detalle/${turnoEdit.id}`, { method: 'DELETE' });
        cerrarModalTurno();
        await cargarDetalle();
    } catch (e) { alert('❌ Error: ' + e.message); }
}
