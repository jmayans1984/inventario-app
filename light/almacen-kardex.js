// ================================================================
// ALMACÉN - KARDEX POR PERÍODO
// Movimiento de inventario del día por Centro de Costo
// ================================================================

const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api';

window.addEventListener('load', () => {
    if (!localStorage.getItem('empresaActual') || !localStorage.getItem('usuario')) {
        window.location.href = 'index.html';
        return;
    }
    initKardex();
});

let centrosCosto = [];
let filas = [];
let totalEfectivo = 0;
let generado = false;

function getEmpresa() {
    return localStorage.getItem('empresaActual') || (window.sesion && window.sesion.empresa) || '';
}

function formatNum(n) {
    const num = parseFloat(n);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtFechaUS(str) {
    if (!str) return '';
    const [y, m, d] = str.split('-');
    return `${m}/${d}/${y}`;
}

function nombreCcosto() {
    const sel = document.getElementById('kxCcosto');
    const cc = centrosCosto.find(c => c.codigo === sel.value);
    return cc ? cc.nombre : (sel ? sel.value : '');
}

// ── Init ──────────────────────────────────────────────────────────
async function initKardex() {
    try {
        const res  = await fetch(`${API_BASE}/ccostos?empresa=${getEmpresa()}`);
        const data = await res.json();
        centrosCosto = data.data || [];
    } catch (e) { console.error('Error cargando CC:', e); }
    renderFormulario();
}

function renderFormulario() {
    document.getElementById('kardexContent').innerHTML = `
        <div class="filters-container">
            <div class="filter-group">
                <label class="filter-label">Fecha *</label>
                <input type="date" id="kxFecha" class="filter-input"
                    value="${new Date().toISOString().slice(0, 10)}">
            </div>
            <div class="filter-group">
                <label class="filter-label">Centro de Costo *</label>
                <select id="kxCcosto" class="filter-select">
                    <option value="">— Selecciona —</option>
                    ${centrosCosto.map(cc => `<option value="${cc.codigo}">${cc.nombre}</option>`).join('')}
                </select>
            </div>
            <div class="filter-group" style="display:flex;gap:8px">
                <button class="btn btn-primary" style="flex:1" onclick="generarKardex()">🔍 Generar</button>
                <button class="btn btn-secondary" id="kxBtnPdf" style="flex:1;display:none" onclick="exportarPDF()">📄 PDF</button>
            </div>
        </div>
        <div id="kxError" style="display:none;margin-top:12px;padding:12px;background:rgba(239,68,68,.1);color:#ef4444;border-radius:10px;font-size:13px"></div>
        <div id="kxReporte" style="margin-top:16px"></div>
    `;
}

// ── Generar ───────────────────────────────────────────────────────
async function generarKardex() {
    const fecha  = document.getElementById('kxFecha').value;
    const ccosto = document.getElementById('kxCcosto').value;
    const errEl  = document.getElementById('kxError');
    errEl.style.display = 'none';

    if (!fecha || !ccosto) {
        errEl.textContent = '❌ Fecha y Centro de Costo son requeridos';
        errEl.style.display = 'block';
        return;
    }

    document.getElementById('kxReporte').innerHTML =
        '<div style="padding:20px;text-align:center;color:var(--text-secondary)">⏳ Generando kardex...</div>';
    filas = [];
    generado = false;

    try {
        const res  = await fetch(`${API_BASE}/almacen/kardex?empresa=${getEmpresa()}&ccosto=${ccosto}&fecha=${fecha}`);
        const data = await res.json();

        if (!data.success && data.error) throw new Error(data.error);

        totalEfectivo = parseFloat(data.total_efectivo || 0);
        filas = (data.data || []).map(p => ({
            ...p,
            stock_anterior: parseFloat(p.stock_anterior) || 0,
            entradas_dia:   parseFloat(p.entradas_dia)   || 0,
            salidas_dia:    parseFloat(p.salidas_dia)     || 0,
            ventas_dia:     parseFloat(p.ventas_dia)      || 0,
            stock_final:    parseFloat(p.stock_anterior) + parseFloat(p.entradas_dia)
                            - parseFloat(p.salidas_dia)  - parseFloat(p.ventas_dia),
        }));
        generado = true;
        renderReporte();
    } catch (e) {
        console.error('Error kardex:', e);
        errEl.textContent = '❌ ' + (e.message || 'Error al generar el kardex');
        errEl.style.display = 'block';
        document.getElementById('kxReporte').innerHTML = '';
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

// ── Render reporte (móvil: oculta CÓD, UND y CANTIDAD) ────────────
function renderReporte() {
    document.getElementById('kxBtnPdf').style.display = filas.length ? 'block' : 'none';

    if (filas.length === 0) {
        document.getElementById('kxReporte').innerHTML =
            '<div style="padding:40px 20px;text-align:center;color:var(--text-tertiary)">📦 No hay movimientos para esta fecha y Centro de Costo</div>';
        return;
    }

    let html = '<div class="table-container"><div style="overflow-x:auto"><table class="grid-table" style="min-width:560px">';
    html += `<thead><tr>
        <th style="text-align:left">PRODUCTO</th>
        <th style="text-align:right">ANT.</th>
        <th style="text-align:right;color:#10b981">ENT.</th>
        <th style="text-align:right;color:#f59e0b">SAL.</th>
        <th style="text-align:right;color:#ef4444">VEN.</th>
        <th style="text-align:right;color:#0891b2">FINAL</th>
    </tr></thead><tbody>`;

    productosAgrupados().forEach(grupo => {
        html += `<tr><td colspan="6" style="background:var(--bg-secondary);padding:8px 10px;font-weight:700;font-size:11px;text-transform:uppercase;color:var(--text-secondary)">📁 ${grupo.nombre}</td></tr>`;
        grupo.items.forEach(p => {
            html += `<tr>
                <td style="padding:6px 10px;font-size:12px;font-weight:500">${p.nombre}<span style="display:block;font-size:10px;color:var(--text-tertiary)">${p.codigo} · ${p.und}</span></td>
                <td style="padding:6px 8px;text-align:right;font-family:monospace;font-size:12px;${p.stock_anterior < 0 ? 'color:#ef4444;font-weight:700' : ''}">${formatNum(p.stock_anterior)}</td>
                <td style="padding:6px 8px;text-align:right;font-family:monospace;font-size:12px;color:${p.entradas_dia > 0 ? '#10b981;font-weight:600' : 'var(--text-tertiary)'}">${p.entradas_dia > 0 ? '+' + formatNum(p.entradas_dia) : '—'}</td>
                <td style="padding:6px 8px;text-align:right;font-family:monospace;font-size:12px;color:${p.salidas_dia > 0 ? '#f59e0b;font-weight:600' : 'var(--text-tertiary)'}">${p.salidas_dia > 0 ? formatNum(p.salidas_dia) : '—'}</td>
                <td style="padding:6px 8px;text-align:right;font-family:monospace;font-size:12px;color:${p.ventas_dia > 0 ? '#ef4444;font-weight:600' : 'var(--text-tertiary)'}">${p.ventas_dia > 0 ? formatNum(p.ventas_dia) : '—'}</td>
                <td style="padding:6px 8px;text-align:right;font-family:monospace;font-size:12px;font-weight:700;color:${p.stock_final < 0 ? '#ef4444' : '#0891b2'}">${formatNum(p.stock_final)}</td>
            </tr>`;
        });
    });

    html += '</tbody></table></div></div>';
    document.getElementById('kxReporte').innerHTML = html;
}

// ── Exportar PDF (misma lógica que versión web: barcode + autoTable) ──
function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const fecha = document.getElementById('kxFecha').value;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const ML = 8, MR = 8;
    const HEADER_H = 30;

    // Barcode: MMDDYY + efectivo en centavos (9 dígitos)
    const [y, m, d] = fecha.split('-');
    const mmddyy = `${m}${d}${y.slice(-2)}`;
    const efectivoCents = Math.round(totalEfectivo * 100);
    const codigoBarras = mmddyy + String(efectivoCents).padStart(9, '0');
    const barcodeCanvas = document.createElement('canvas');
    JsBarcode(barcodeCanvas, codigoBarras, {
        format: 'CODE128', displayValue: true,
        fontSize: 10, textMargin: 2, height: 38, width: 1.4, margin: 3,
    });
    const barcodeImg = barcodeCanvas.toDataURL('image/png');

    const hoy = new Date();
    const hoyStr = `${String(hoy.getMonth()+1).padStart(2,'0')}/${String(hoy.getDate()).padStart(2,'0')}/${hoy.getFullYear()}`;
    const ccNombre = nombreCcosto();
    const fechaFmt = fmtFechaUS(fecha);

    function drawHeader(pageNum) {
        doc.setFillColor(26, 26, 46);
        doc.rect(0, 0, 52, HEADER_H, 'F');
        doc.setFillColor(248, 250, 252);
        doc.rect(52, 0, PW - 52, HEADER_H, 'F');
        doc.setDrawColor(8, 145, 178);
        doc.setLineWidth(0.5);
        doc.line(0, HEADER_H, PW, HEADER_H);

        doc.setTextColor(148, 163, 184);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.text('REPORTE', ML, 8);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('KARDEX', ML, 15);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(56, 189, 248);
        doc.text('INVENTARIO', ML, 21);

        doc.setTextColor(100, 116, 139);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.text('CENTRO DE COSTO:', 56, 8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(26, 26, 46);
        doc.setFontSize(8);
        doc.text(ccNombre, 56, 14);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text('FECHA:', 140, 8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(26, 26, 46);
        doc.setFontSize(8);
        doc.text(fechaFmt, 140, 14);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text('PRODUCTOS:', 56, 21);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(26, 26, 46);
        doc.text(String(filas.length), 56 + doc.getTextWidth('PRODUCTOS:') + 2, 21);

        doc.setTextColor(0, 0, 0);
    }

    function drawFooter() {
        doc.setFontSize(6.5);
        doc.setTextColor(150);
        doc.text(`Impreso: ${hoyStr}`, ML, PH - 4);
        const bW = 55, bH = 12;
        doc.addImage(barcodeImg, 'PNG', PW - MR - bW, PH - bH - 2, bW, bH);
        doc.setTextColor(0, 0, 0);
    }

    drawHeader(1);

    const CP = { top: 1.2, bottom: 1.2, left: 3, right: 3 };
    const body = [];
    for (const grupo of productosAgrupados()) {
        body.push([{
            content: grupo.nombre.toUpperCase(),
            colSpan: 9,
            styles: {
                fontStyle: 'bold', fontSize: 7, textColor: [8,100,140],
                fillColor: [240,249,255], halign: 'left',
                cellPadding: { top: 1.2, bottom: 1.2, left: 4, right: 4 }
            }
        }]);
        for (const p of grupo.items) {
            body.push([
                p.codigo,
                p.nombre,
                p.und,
                formatNum(p.stock_anterior),
                p.entradas_dia > 0 ? formatNum(p.entradas_dia) : '—',
                p.salidas_dia  > 0 ? formatNum(p.salidas_dia)  : '—',
                p.ventas_dia   > 0 ? formatNum(p.ventas_dia)   : '—',
                formatNum(p.stock_final),
                '__________',
            ]);
        }
    }

    doc.autoTable({
        startY: HEADER_H + 3,
        showHead: 'everyPage',
        head: [[
            { content: 'CÓD',      styles: { halign: 'center' } },
            { content: 'PRODUCTO' },
            { content: 'UNIDAD',   styles: { halign: 'center' } },
            { content: 'ANT.',     styles: { halign: 'right' } },
            { content: 'ENT.',     styles: { halign: 'right' } },
            { content: 'SAL.',     styles: { halign: 'right' } },
            { content: 'VEN.',     styles: { halign: 'right' } },
            { content: 'FINAL',    styles: { halign: 'right' } },
            { content: 'CANT.',    styles: { halign: 'center' } },
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
            0: { cellWidth: 12,  halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 16,  halign: 'center' },
            3: { cellWidth: 17,  halign: 'right' },
            4: { cellWidth: 14,  halign: 'right', textColor: [16,185,129] },
            5: { cellWidth: 14,  halign: 'right', textColor: [245,158,11] },
            6: { cellWidth: 14,  halign: 'right', textColor: [239,68,68] },
            7: { cellWidth: 17,  halign: 'right', textColor: [8,145,178] },
            8: { cellWidth: 26,  halign: 'center', textColor: [160,160,160] },
        },
        margin: { left: ML, right: MR, bottom: 20, top: HEADER_H + 2 },
        didDrawPage: (data) => { drawHeader(data.pageNumber); },
    });

    const totalPgs = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPgs; i++) {
        doc.setPage(i);
        drawFooter();
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`Pág. ${i} / ${totalPgs}`, PW - MR - 18, 14);
        doc.setTextColor(0, 0, 0);
    }

    const blob = doc.output('blob');
    window.open(URL.createObjectURL(blob), '_blank');
}
