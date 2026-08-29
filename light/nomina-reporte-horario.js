// ================================================================
// NÓMINA - HORARIO SEMANAL PARA PUBLICAR
// Una hoja por centro de costo al imprimir
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
    { label: 'Lunes', offset: 0 }, { label: 'Martes', offset: 1 }, { label: 'Miércoles', offset: 2 },
    { label: 'Jueves', offset: 3 }, { label: 'Viernes', offset: 4 }, { label: 'Sábado', offset: 5 }, { label: 'Domingo', offset: 6 }
];

let semanas = [];
let semanaSelId = '';
let semanaActual = null;
let detalle = [];
let ccostos = [];

function getEmpresa() {
    return localStorage.getItem('empresaActual') || (window.sesion && window.sesion.empresa) || '';
}

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

// ── Carga ─────────────────────────────────────────────────────────
async function cargarSemanas() {
    const emp = getEmpresa();
    try {
        const [semsR, ccR] = await Promise.all([
            fetch(`${API_BASE}/nomina/semanas?empresa=${emp}`).then(r => r.json()),
            fetch(`${API_BASE}/ccostos?empresa=${emp}`).then(r => r.json()),
        ]);
        semanas = semsR.data || [];
        ccostos = ccR.data || [];
    } catch (e) { console.error('Error:', e); }

    if (semanas.length) {
        semanaSelId = semanas[0].id;
        await cargarDetalle();
    } else {
        renderTodo();
    }
}

async function cargarDetalle() {
    if (!semanaSelId) { renderTodo(); return; }
    try {
        const r = await fetch(`${API_BASE}/nomina/semanas/${semanaSelId}/detalle`).then(r => r.json());
        semanaActual = r.semana;
        detalle = r.detalle || [];
    } catch (e) { console.error('Error detalle:', e); }
    renderTodo();
}

function cambiarSemana(id) {
    semanaSelId = id;
    cargarDetalle();
}

// ── Helpers ───────────────────────────────────────────────────────
function ccostosConEmpleados() {
    const ccostosEnDetalle = new Set(detalle.map(d => d.ccosto));
    return ccostos.filter(c => ccostosEnDetalle.has(c.codigo));
}

function empleadosDelCcosto(ccostoId) {
    const map = {};
    detalle
        .filter(d => d.ccosto === ccostoId)
        .forEach(d => {
            if (!map[d.empleado_id]) {
                map[d.empleado_id] = {
                    id: d.empleado_id,
                    nombre: d.nombre,
                    apellido: d.apellido,
                    tipo_empleado: d.tipo_empleado,
                    empresa_contratista: d.empresa_contratista
                };
            }
        });
    return Object.values(map).sort((a, b) => a.apellido.localeCompare(b.apellido));
}

function getTurnoCcosto(empId, offset, ccostoId) {
    if (!semanaActual) return null;
    const fecha = addDays(semanaActual.semana_inicio, offset);
    if (!fecha) return null;
    return detalle.find(d =>
        d.empleado_id === empId &&
        d.fecha?.split('T')[0] === fecha &&
        d.ccosto === ccostoId
    ) || null;
}

// ── Render ────────────────────────────────────────────────────────
function renderTodo() {
    let html = `
        <div style="background:linear-gradient(135deg,#0c2340,#1a3a6e);border-radius:16px;padding:16px;margin-bottom:14px;color:white">
            <div style="font-size:15px;font-weight:800;margin-bottom:2px">🕐 HORARIO — PARA PUBLICAR</div>
            <div style="font-size:11px;opacity:.6">Una hoja por centro de costo al imprimir</div>
            <select onchange="cambiarSemana(this.value)" style="width:100%;height:42px;margin-top:10px;padding:0 10px;border-radius:10px;border:none;font-size:14px;background:rgba(255,255,255,.95)">
                <option value="">— Seleccionar semana —</option>
                ${semanas.map(s => `<option value="${s.id}" ${String(s.id) === String(semanaSelId) ? 'selected' : ''}>${fmtFecha(s.semana_inicio)} — ${s.estado}</option>`).join('')}
            </select>
            ${semanaActual ? `<button onclick="imprimirPDF()" style="width:100%;margin-top:10px;background:rgba(139,92,246,.5);color:white;border:none;padding:11px;border-radius:10px;font-size:13px;font-weight:700">🖨 Imprimir</button>` : ''}
        </div>`;

    if (!semanaActual || !semanaActual.semana_inicio) {
        html += '<div style="padding:32px;text-align:center;color:var(--text-tertiary)">Selecciona una semana para ver el horario</div>';
        document.getElementById('rhContent').innerHTML = html;
        return;
    }

    ccostosConEmpleados().forEach(cc => {
        const emps = empleadosDelCcosto(cc.codigo);
        html += `
        <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:16px;padding:16px;margin-bottom:14px">
            <div style="text-align:center;margin-bottom:12px">
                <div style="font-size:16px;font-weight:900;letter-spacing:1px">HORARIO DE TRABAJO</div>
                <div style="font-size:13px;font-weight:800;color:#06b6d4;text-transform:uppercase">${cc.nombre}</div>
                <div style="font-size:11px;color:var(--text-tertiary)">${fmtFecha(semanaActual.semana_inicio)} — ${fmtFecha(semanaActual.semana_fin)}</div>
            </div>`;

        if (emps.length) {
            html += '<div style="overflow-x:auto"><table style="border-collapse:collapse;font-size:10px;min-width:640px;width:100%">';
            html += `<thead><tr>
                <th style="background:#1e3a5f;color:white;padding:6px 8px;text-align:left;font-size:9px;min-width:120px;border:1px solid rgba(255,255,255,.15)">EMPLEADO</th>
                ${DIAS.map(d => `<th style="background:#1e3a5f;color:white;padding:6px 4px;text-align:center;font-size:9px;border:1px solid rgba(255,255,255,.15)">${d.label}<br><span style="font-weight:400;font-size:7px;opacity:.75">${fmtDiaMes(semanaActual.semana_inicio, d.offset)}</span></th>`).join('')}
            </tr></thead><tbody>`;

            emps.forEach(emp => {
                html += `<tr>
                    <td style="border:1px solid var(--border);padding:6px 8px">
                        <div style="font-weight:700;font-size:10px">${emp.apellido}, ${emp.nombre}</div>
                        <div style="font-size:8px;color:var(--text-tertiary)">${emp.empresa_contratista ? emp.empresa_contratista + ' · ' : ''}${emp.tipo_empleado}</div>
                    </td>`;
                DIAS.forEach(d => {
                    const t = getTurnoCcosto(emp.id, d.offset, cc.codigo);
                    let cell;
                    if (t && !t.es_dia_libre) {
                        cell = `<div style="font-size:9px;font-weight:700;color:#06b6d4;line-height:1.3">${(t.real_inicio || t.prog_inicio || '').slice(0,5)}<br>${(t.real_fin || t.prog_fin || '').slice(0,5)}</div>
                                <div style="font-size:8px;color:var(--text-tertiary)">${fmtHoras(t.real_horas ?? t.prog_horas)}h</div>`;
                    } else if (t && t.es_dia_libre) {
                        cell = `<span style="font-size:8px;color:var(--text-tertiary);font-style:italic;text-transform:uppercase">${t.ausencia_tipo || 'LIBRE'}</span>`;
                    } else {
                        cell = '<span style="color:var(--border)">—</span>';
                    }
                    html += `<td style="border:1px solid var(--border);text-align:center;padding:5px 3px;min-width:62px">${cell}</td>`;
                });
                html += '</tr>';
            });
            html += '</tbody></table></div>';
        } else {
            html += '<div style="padding:18px;text-align:center;color:var(--text-tertiary);font-size:12px">Sin empleados asignados a este centro esta semana.</div>';
        }

        html += `<div style="font-size:9px;color:var(--text-tertiary);text-align:center;padding-top:8px;border-top:1px solid var(--border);margin-top:10px">
            ${cc.nombre} · ${fmtFecha(semanaActual.semana_inicio)} al ${fmtFecha(semanaActual.semana_fin)} · ${emps.length} empleado(s) · Generado ${fmtHoy()}
        </div></div>`;
    });

    document.getElementById('rhContent').innerHTML = html;
}

// ── Imprimir (misma lógica que versión web: ventana + print) ──────
function imprimirPDF() {
    const ventana = window.open('', '_blank');
    if (!ventana) { alert('Activa los pop-ups para abrir el reporte en nueva pestaña'); return; }

    const estilos = `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, Helvetica, sans-serif; background: white; color: #111; }
        .pagina { padding: 24px 20px; page-break-after: always; }
        .pagina:last-child { page-break-after: auto; }
        .encabezado { text-align: center; margin-bottom: 14px; }
        .titulo { font-size: 20px; font-weight: 900; letter-spacing: 1px; margin-bottom: 4px; }
        .ccosto-nombre { font-size: 14px; font-weight: 800; color: #0088aa; margin-bottom: 3px; text-transform: uppercase; }
        .periodo { font-size: 11px; color: #666; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px; }
        th { background: #1e3a5f; color: white; padding: 6px 5px; text-align: center; font-size: 9px; font-weight: 700; border: 1px solid rgba(255,255,255,0.2); }
        th.th-emp { text-align: left; min-width: 130px; padding-left: 8px; }
        .rh-fecha { font-size: 7px; font-weight: 400; display: block; }
        td { border: 1px solid #ddd; padding: 5px 4px; vertical-align: middle; text-align: center; }
        td.td-emp { text-align: left; padding: 6px 8px; min-width: 130px; }
        .emp-nombre { font-weight: 700; font-size: 10px; }
        .emp-sub { font-size: 8px; color: #888; margin-top: 1px; }
        .turno-horas { font-size: 9px; font-weight: 700; color: #006688; line-height: 1.3; }
        .turno-h { font-size: 8px; color: #888; }
        .libre { font-size: 8px; color: #aaa; font-style: italic; text-transform: uppercase; }
        .vacio { font-size: 11px; color: #ccc; }
        .pie { font-size: 8px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 6px; margin-top: 6px; }
        @media print {
            .pagina { page-break-after: always; }
            table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    `;

    const genTurno = (t) => {
        if (!t) return `<span class="vacio">—</span>`;
        if (t.es_dia_libre) return `<span class="libre">${t.ausencia_tipo || 'LIBRE'}</span>`;
        const ini = (t.real_inicio || t.prog_inicio || '').slice(0, 5);
        const fin = (t.real_fin   || t.prog_fin   || '').slice(0, 5);
        const hrs = parseFloat(t.real_horas ?? t.prog_horas ?? 0).toFixed(1);
        return `<div class="turno-horas">${ini}<br/>${fin}</div><div class="turno-h">${hrs}h</div>`;
    };

    let body = '';
    ccostosConEmpleados().forEach(cc => {
        const emps = empleadosDelCcosto(cc.codigo);
        body += `<div class="pagina">
            <div class="encabezado">
                <div class="titulo">HORARIO DE TRABAJO</div>
                <div class="ccosto-nombre">${cc.nombre}</div>
                <div class="periodo">${fmtFecha(semanaActual.semana_inicio)} &mdash; ${fmtFecha(semanaActual.semana_fin)}</div>
            </div>`;

        if (emps.length) {
            body += `<table><thead><tr>
                <th class="th-emp">EMPLEADO</th>
                ${DIAS.map(d => `<th>${d.label}<span class="rh-fecha">${fmtDiaMes(semanaActual.semana_inicio, d.offset)}</span></th>`).join('')}
                </tr></thead><tbody>`;

            emps.forEach(emp => {
                body += `<tr>
                    <td class="td-emp">
                        <div class="emp-nombre">${emp.apellido}, ${emp.nombre}</div>
                        <div class="emp-sub">${emp.empresa_contratista ? emp.empresa_contratista + ' · ' : ''}${emp.tipo_empleado}</div>
                    </td>
                    ${DIAS.map(d => `<td>${genTurno(getTurnoCcosto(emp.id, d.offset, cc.codigo))}</td>`).join('')}
                </tr>`;
            });

            body += `</tbody></table>`;
        } else {
            body += `<p style="text-align:center;color:#aaa;padding:20px;font-size:11px">Sin empleados asignados a este centro esta semana.</p>`;
        }

        body += `<div class="pie">${cc.nombre} &nbsp;·&nbsp; ${fmtFecha(semanaActual.semana_inicio)} al ${fmtFecha(semanaActual.semana_fin)} &nbsp;·&nbsp; ${emps.length} empleado(s) &nbsp;·&nbsp; Generado ${fmtHoy()}</div>
        </div>`;
    });

    ventana.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
        <title>Horario de Trabajo — ${fmtFecha(semanaActual.semana_inicio)}</title>
        <style>${estilos}</style></head><body>${body}</body></html>`);
    ventana.document.close();
    ventana.focus();
    setTimeout(() => ventana.print(), 500);
}

// Sello del pie del informe. 'es-US' acierta el orden pero omite el cero a la
// izquierda ("8/26/2026"), asi que no queda igual al resto de los informes.
function fmtHoy() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getMonth() + 1)}/${p(d.getDate())}/${d.getFullYear()}`;
}
