// ================================================================
// ALMACÉN - REPORTE FALTANTES Y SOBRANTES (TOMA FÍSICA)
// Suma por producto las diferencias registradas en tomas físicas
// dentro de un rango de fechas y Centros de Costo
// ================================================================

const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api';

window.addEventListener('load', () => {
    if (!localStorage.getItem('empresaActual') || !localStorage.getItem('usuario')) {
        window.location.href = 'index.html';
        return;
    }
    initTomaFisica();
});

let centrosCosto = [];
let filas = [];
let ccostosSeleccionados = [];

function getEmpresa() {
    return localStorage.getItem('empresaActual') || (window.sesion && window.sesion.empresa) || '';
}

function formatNum(n) {
    const num = parseFloat(n);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtFecha(str) {
    if (!str) return '';
    const [y, m, d] = str.split('-');
    return `${m}/${d}/${y}`;
}

function nombresCcostos() {
    if (!ccostosSeleccionados.length) return '';
    if (ccostosSeleccionados.length === centrosCosto.length) return 'Todos los centros';
    return ccostosSeleccionados
        .map(cod => centrosCosto.find(c => c.codigo === cod)?.nombre || cod)
        .join(', ');
}

// ── Init ──────────────────────────────────────────────────────────
async function initTomaFisica() {
    try {
        const res  = await fetch(`${API_BASE}/ccostos?empresa=${getEmpresa()}`);
        const data = await res.json();
        centrosCosto = data.data || [];
    } catch (e) { console.error('Error cargando CC:', e); }
    renderFormulario();
}

function renderFormulario() {
    const hoy = new Date().toISOString().slice(0, 10);
    const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

    document.getElementById('tfContent').innerHTML = `
        <div class="filters-container">
            <div class="filter-group">
                <label class="filter-label">Fecha Desde *</label>
                <input type="date" id="tfFechaIni" class="filter-input" value="${primerDiaMes}">
            </div>
            <div class="filter-group">
                <label class="filter-label">Fecha Hasta *</label>
                <input type="date" id="tfFechaFin" class="filter-input" value="${hoy}">
            </div>
            <div class="filter-group">
                <label class="filter-label">Centros de Costo *</label>
                <div style="border:1px solid var(--border);border-radius:12px;padding:10px;background:var(--bg-primary);max-height:200px;overflow-y:auto">
                    <label style="display:flex;align-items:center;gap:8px;padding:6px 4px;cursor:pointer;font-size:14px;font-weight:600;border-bottom:1px solid var(--border)">
                        <input type="checkbox" id="tfTodos" onchange="toggleTodosCC(this.checked)" style="width:18px;height:18px">
                        <span>Seleccionar todos</span>
                    </label>
                    ${centrosCosto.map(cc => `
                        <label style="display:flex;align-items:center;gap:8px;padding:6px 4px;cursor:pointer;font-size:14px">
                            <input type="checkbox" class="tf-cc-check" value="${cc.codigo}" onchange="actualizarSeleccionCC()" style="width:18px;height:18px">
                            <span>${cc.nombre}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            <div class="filter-group" style="display:flex;gap:8px">
                <button class="btn btn-primary" style="flex:1" onclick="generarTomaFisica()">🔍 Generar</button>
                <button class="btn btn-secondary" id="tfBtnPdf" style="flex:1;display:none" onclick="exportarPDF()">📄 PDF</button>
            </div>
        </div>
        <div id="tfError" style="display:none;margin-top:12px;padding:12px;background:rgba(239,68,68,.1);color:#ef4444;border-radius:10px;font-size:13px"></div>
        <div id="tfReporte" style="margin-top:16px"></div>
    `;
}

function toggleTodosCC(checked) {
    document.querySelectorAll('.tf-cc-check').forEach(c => c.checked = checked);
    actualizarSeleccionCC();
}

function actualizarSeleccionCC() {
    ccostosSeleccionados = [...document.querySelectorAll('.tf-cc-check:checked')].map(c => c.value);
    const todos = document.getElementById('tfTodos');
    if (todos) todos.checked = ccostosSeleccionados.length === centrosCosto.length;
}

// ── Generar ───────────────────────────────────────────────────────
async function generarTomaFisica() {
    const fechaIni = document.getElementById('tfFechaIni').value;
    const fechaFin = document.getElementById('tfFechaFin').value;
    const errEl    = document.getElementById('tfError');
    errEl.style.display = 'none';

    if (!fechaIni || !fechaFin || !ccostosSeleccionados.length) {
        errEl.textContent = '❌ Fechas y al menos un Centro de Costo son requeridos';
        errEl.style.display = 'block';
        return;
    }

    document.getElementById('tfReporte').innerHTML =
        '<div style="padding:20px;text-align:center;color:var(--text-secondary)">⏳ Generando reporte...</div>';
    filas = [];

    try {
        const params = new URLSearchParams({
            empresa:   getEmpresa(),
            ccostos:   ccostosSeleccionados.join(','),
            fecha_ini: fechaIni,
            fecha_fin: fechaFin,
        });
        const res  = await fetch(`${API_BASE}/almacen/reporte-toma-fisica?${params}`);
        const data = await res.json();
        if (!data.success && data.error) throw new Error(data.error);
        filas = data.data || [];
        renderReporte(fechaIni, fechaFin);
    } catch (e) {
        console.error('Error toma física:', e);
        errEl.textContent = '❌ ' + (e.message || 'Error al generar el reporte');
        errEl.style.display = 'block';
        document.getElementById('tfReporte').innerHTML = '';
    }
}

function productosAgrupados() {
    const mapa = new Map();
    for (const p of filas) {
        const key    = p.grupo_codigo || '__sin__';
        const nombre = p.grupo_nombre || 'Sin Grupo';
        if (!mapa.has(key)) mapa.set(key, { key, nombre, items: [] });
        mapa.get(key).items.push(p);
    }
    return Array.from(mapa.values());
}

function totalFaltante() { return filas.reduce((s, p) => s + parseFloat(p.total_faltante), 0); }
function totalSobrante() { return filas.reduce((s, p) => s + parseFloat(p.total_sobrante), 0); }

// ── Render ────────────────────────────────────────────────────────
function renderReporte(fechaIni, fechaFin) {
    document.getElementById('tfBtnPdf').style.display = filas.length ? 'block' : 'none';

    if (filas.length === 0) {
        document.getElementById('tfReporte').innerHTML =
            '<div style="padding:40px 20px;text-align:center;color:var(--text-tertiary)">📋 No hay tomas físicas con diferencias para este período y Centro de Costo</div>';
        return;
    }

    // KPIs
    let html = `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
            <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center">
                <div style="font-size:18px;font-weight:800">${filas.length}</div>
                <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text-tertiary)">Productos</div>
            </div>
            <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center">
                <div style="font-size:18px;font-weight:800;color:#d97706">${formatNum(totalFaltante())}</div>
                <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text-tertiary)">Faltante</div>
            </div>
            <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center">
                <div style="font-size:18px;font-weight:800;color:#059669">${formatNum(totalSobrante())}</div>
                <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text-tertiary)">Sobrante</div>
            </div>
        </div>
        <div style="font-size:11px;color:var(--text-tertiary);margin-bottom:12px;text-align:center">
            ${fmtFecha(fechaIni)} → ${fmtFecha(fechaFin)} · ${nombresCcostos()}
        </div>`;

    html += '<div class="table-container"><table class="grid-table" style="width:100%">';
    html += `<thead><tr>
        <th style="text-align:left">PRODUCTO</th>
        <th style="text-align:right">FALTA</th>
        <th style="text-align:right">SOBRA</th>
        <th style="text-align:right">NETO</th>
    </tr></thead><tbody>`;

    productosAgrupados().forEach(grupo => {
        html += `<tr><td colspan="4" style="background:rgba(8,145,178,.06);padding:8px 10px;font-weight:700;font-size:11px;text-transform:uppercase;color:#0891b2">📁 ${grupo.nombre}</td></tr>`;
        grupo.items.forEach(p => {
            const neto = parseFloat(p.total_sobrante) - parseFloat(p.total_faltante);
            const netoColor = neto > 0 ? '#059669' : (neto < 0 ? '#d97706' : 'inherit');
            html += `<tr>
                <td style="padding:6px 10px;font-size:13px;font-weight:500">${p.nombre}<span style="display:block;font-size:10px;color:var(--text-tertiary)">${p.codigo} · ${p.und} · ${p.num_tomas} toma(s)</span></td>
                <td style="padding:6px 10px;text-align:right;font-family:monospace;font-weight:700;color:#d97706">${parseFloat(p.total_faltante) > 0 ? formatNum(p.total_faltante) : '—'}</td>
                <td style="padding:6px 10px;text-align:right;font-family:monospace;font-weight:700;color:#059669">${parseFloat(p.total_sobrante) > 0 ? formatNum(p.total_sobrante) : '—'}</td>
                <td style="padding:6px 10px;text-align:right;font-family:monospace;font-weight:700;color:${netoColor}">${formatNum(neto)}</td>
            </tr>`;
        });
    });

    html += `<tr style="border-top:2px solid var(--border);background:var(--bg-secondary)">
        <td style="padding:10px;font-weight:800">TOTALES</td>
        <td style="padding:10px;text-align:right;font-family:monospace;font-weight:800;color:#d97706">${formatNum(totalFaltante())}</td>
        <td style="padding:10px;text-align:right;font-family:monospace;font-weight:800;color:#059669">${formatNum(totalSobrante())}</td>
        <td style="padding:10px;text-align:right;font-family:monospace;font-weight:800">${formatNum(totalSobrante() - totalFaltante())}</td>
    </tr>`;
    html += '</tbody></table></div>';
    document.getElementById('tfReporte').innerHTML = html;
}

// ── Exportar PDF (misma lógica que versión web) ───────────────────
function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const fechaIni = document.getElementById('tfFechaIni').value;
    const fechaFin = document.getElementById('tfFechaFin').value;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const ML = 8, MR = 8;
    const HEADER_H = 30;

    const hoyDate = new Date();
    const hoyStr = `${String(hoyDate.getMonth()+1).padStart(2,'0')}/${String(hoyDate.getDate()).padStart(2,'0')}/${hoyDate.getFullYear()}`;
    const ccNombres = nombresCcostos();

    function drawHeader() {
        doc.setFillColor(26, 26, 46);
        doc.rect(0, 0, 55, HEADER_H, 'F');
        doc.setFillColor(248, 250, 252);
        doc.rect(55, 0, PW - 55, HEADER_H, 'F');
        doc.setDrawColor(8, 145, 178);
        doc.setLineWidth(0.5);
        doc.line(0, HEADER_H, PW, HEADER_H);

        doc.setTextColor(148, 163, 184);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.text('REPORTE', ML, 8);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('FALTANTES Y SOBRANTES', ML, 15);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(103, 232, 249);
        doc.text('TOMA FÍSICA', ML, 21);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text('CENTRO DE COSTO:', 59, 8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(26, 26, 46);
        doc.setFontSize(7.5);
        doc.text(ccNombres.slice(0, 70), 59, 14);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text('PERÍODO:', 130, 8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(26, 26, 46);
        doc.setFontSize(7.5);
        doc.text(`${fmtFecha(fechaIni)}  →  ${fmtFecha(fechaFin)}`, 130, 14);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text('FALTANTE:', 59, 21);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(26, 26, 46);
        doc.text(formatNum(totalFaltante()), 59 + doc.getTextWidth('FALTANTE:') + 2, 21);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text('SOBRANTE:', 130, 21);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(26, 26, 46);
        doc.text(formatNum(totalSobrante()), 130 + doc.getTextWidth('SOBRANTE:') + 2, 21);

        doc.setTextColor(0, 0, 0);
    }

    drawHeader();

    const CP = { top: 1.2, bottom: 1.2, left: 3, right: 3 };
    const body = [];
    for (const grupo of productosAgrupados()) {
        body.push([{
            content: grupo.nombre.toUpperCase(),
            colSpan: 7,
            styles: {
                fontStyle: 'bold', fontSize: 7, textColor: [8, 100, 140],
                fillColor: [240, 249, 255], halign: 'left',
                cellPadding: { top: 1.2, bottom: 1.2, left: 4, right: 4 }
            }
        }]);
        for (const p of grupo.items) {
            const neto = parseFloat(p.total_sobrante) - parseFloat(p.total_faltante);
            body.push([
                p.codigo,
                p.nombre,
                p.und,
                parseFloat(p.total_faltante) > 0 ? formatNum(p.total_faltante) : '—',
                parseFloat(p.total_sobrante) > 0 ? formatNum(p.total_sobrante) : '—',
                { content: formatNum(neto), styles: { textColor: neto < 0 ? [217,119,6] : (neto > 0 ? [5,150,105] : [0,0,0]) } },
                String(p.num_tomas),
            ]);
        }
    }

    body.push([
        { content: 'TOTALES', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [26,26,46], textColor: [255,255,255], halign: 'left', cellPadding: CP } },
        { content: formatNum(totalFaltante()), styles: { fontStyle: 'bold', fillColor: [26,26,46], textColor: [252,211,77], halign: 'right', cellPadding: CP } },
        { content: formatNum(totalSobrante()), styles: { fontStyle: 'bold', fillColor: [26,26,46], textColor: [110,231,183], halign: 'right', cellPadding: CP } },
        { content: formatNum(totalSobrante() - totalFaltante()), styles: { fontStyle: 'bold', fillColor: [26,26,46], textColor: [255,255,255], halign: 'right', cellPadding: CP } },
        { content: '', styles: { fillColor: [26,26,46] } },
    ]);

    doc.autoTable({
        startY: HEADER_H + 3,
        showHead: 'everyPage',
        head: [[
            { content: 'CÓD',        styles: { halign: 'center' } },
            { content: 'PRODUCTO' },
            { content: 'UNIDAD',     styles: { halign: 'center' } },
            { content: 'FALTANTE',   styles: { halign: 'right' } },
            { content: 'SOBRANTE',   styles: { halign: 'right' } },
            { content: 'NETO',       styles: { halign: 'right' } },
            { content: 'TOMAS',      styles: { halign: 'center' } },
        ]],
        body,
        theme: 'plain',
        headStyles: {
            fillColor: [26, 26, 46],
            textColor: [203, 213, 225],
            fontSize: 7, fontStyle: 'bold',
            cellPadding: { top: 1.5, bottom: 1.5, left: 3, right: 3 },
        },
        bodyStyles: { fontSize: 7, cellPadding: CP },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
            0: { cellWidth: 14,   halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 16,   halign: 'center' },
            3: { cellWidth: 22,   halign: 'right',  textColor: [217, 119, 6] },
            4: { cellWidth: 22,   halign: 'right',  textColor: [5, 150, 105] },
            5: { cellWidth: 20,   halign: 'right' },
            6: { cellWidth: 16,   halign: 'center' },
        },
        margin: { left: ML, right: MR, bottom: 16, top: HEADER_H + 2 },
        didDrawPage: () => { drawHeader(); },
    });

    const totalPgs = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPgs; i++) {
        doc.setPage(i);
        doc.setFontSize(6.5);
        doc.setTextColor(150);
        doc.text(`Impreso: ${hoyStr}`, ML, PH - 4);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`Pág. ${i} / ${totalPgs}`, PW - MR - 18, 14);
        doc.setTextColor(0, 0, 0);
    }

    window.open(URL.createObjectURL(doc.output('blob')), '_blank');
}
