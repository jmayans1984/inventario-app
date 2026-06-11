// ================================================================
// ALMACÉN - REPORTE MOVIMIENTO POR PRODUCTO
// Detalle día a día de entradas, salidas y ventas por rango
// ================================================================

const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api';

window.addEventListener('load', () => {
    if (!localStorage.getItem('empresaActual') || !localStorage.getItem('usuario')) {
        window.location.href = 'index.html';
        return;
    }
    initMovProducto();
});

let centrosCosto = [];
let rawRows = [];
let stockInicialMap = {};
let filtroProducto = '';

function getEmpresa() {
    return localStorage.getItem('empresaActual') || (window.sesion && window.sesion.empresa) || '';
}

function fmtNum(v) {
    const n = parseFloat(v) || 0;
    return n.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function fmtFecha(f) {
    if (!f) return '';
    const s = String(f).split('T')[0];
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
}

// ── Init ──────────────────────────────────────────────────────────
async function initMovProducto() {
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

    document.getElementById('movProductoContent').innerHTML = `
        <div class="filters-container">
            <div class="filter-group">
                <label class="filter-label">Fecha inicio *</label>
                <input type="date" id="mpFechaIni" class="filter-input" value="${primerDiaMes}">
            </div>
            <div class="filter-group">
                <label class="filter-label">Fecha fin *</label>
                <input type="date" id="mpFechaFin" class="filter-input" value="${hoy}">
            </div>
            <div class="filter-group">
                <label class="filter-label">Centro de Costo *</label>
                <select id="mpCcosto" class="filter-select">
                    <option value="">— Selecciona —</option>
                    ${centrosCosto.map(cc => `<option value="${cc.codigo}">${cc.nombre}</option>`).join('')}
                </select>
            </div>
            <div class="filter-group" id="mpFiltroProdWrap" style="display:none">
                <label class="filter-label">Producto (opcional)</label>
                <select id="mpFiltroProd" class="filter-select" onchange="filtroProducto=this.value;renderReporte()">
                    <option value="">Todos los productos</option>
                </select>
            </div>
            <div class="filter-group">
                <button class="btn btn-primary" style="width:100%" onclick="generarMovProducto()">🔍 Generar</button>
            </div>
        </div>
        <div id="mpError" style="display:none;margin-top:12px;padding:12px;background:rgba(239,68,68,.1);color:#ef4444;border-radius:10px;font-size:13px"></div>
        <div id="mpReporte" style="margin-top:16px"></div>
    `;
}

// ── Generar ───────────────────────────────────────────────────────
async function generarMovProducto() {
    const fechaIni = document.getElementById('mpFechaIni').value;
    const fechaFin = document.getElementById('mpFechaFin').value;
    const ccosto   = document.getElementById('mpCcosto').value;
    const errEl    = document.getElementById('mpError');
    errEl.style.display = 'none';

    if (!fechaIni || !fechaFin || !ccosto) {
        errEl.textContent = '❌ Fechas y Centro de Costo son requeridos';
        errEl.style.display = 'block';
        return;
    }

    document.getElementById('mpReporte').innerHTML =
        '<div style="padding:20px;text-align:center;color:var(--text-secondary)">⏳ Generando reporte...</div>';
    rawRows = [];
    stockInicialMap = {};
    filtroProducto = '';

    try {
        const params = new URLSearchParams({
            empresa:      getEmpresa(),
            ccosto:       ccosto,
            fecha_inicio: fechaIni,
            fecha_fin:    fechaFin,
        });
        const res  = await fetch(`${API_BASE}/almacen/reporte-movimiento-producto?${params}`);
        const data = await res.json();
        if (!data.success && data.error) throw new Error(data.error);
        rawRows = data.data || [];
        stockInicialMap = data.stock_inicial_map || {};

        // Poblar filtro de productos
        const seen = new Map();
        rawRows.forEach(r => { if (!seen.has(r.codigo)) seen.set(r.codigo, r.nombre); });
        const opts = [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
        const sel = document.getElementById('mpFiltroProd');
        sel.innerHTML = '<option value="">Todos los productos</option>' +
            opts.map(([cod, nom]) => `<option value="${cod}">${nom}</option>`).join('');
        document.getElementById('mpFiltroProdWrap').style.display = rawRows.length ? 'flex' : 'none';

        renderReporte();
    } catch (e) {
        console.error('Error mov producto:', e);
        errEl.textContent = '❌ ' + (e.message || 'Error al generar el reporte');
        errEl.style.display = 'block';
        document.getElementById('mpReporte').innerHTML = '';
    }
}

// ── Agrupar grupo → producto → días + saldos acumulados ──────────
function productosAgrupados() {
    if (!rawRows.length) return [];

    const rows = filtroProducto
        ? rawRows.filter(r => r.codigo === filtroProducto)
        : rawRows;

    const grupoMap = new Map();
    for (const row of rows) {
        const gKey = row.grupo_codigo || '999';
        const gNom = row.grupo_nombre || 'Sin Grupo';
        if (!grupoMap.has(gKey)) grupoMap.set(gKey, { key: gKey, nombre: gNom, productos: new Map() });

        const grupo = grupoMap.get(gKey);
        if (!grupo.productos.has(row.codigo)) {
            grupo.productos.set(row.codigo, {
                codigo: row.codigo,
                nombre: row.nombre,
                und: row.und,
                stockInicial: parseFloat(stockInicialMap[row.codigo] ?? 0),
                dias: [],
            });
        }
        grupo.productos.get(row.codigo).dias.push({
            fecha:    row.fecha,
            tipo:     row.tipo || '',
            entradas: parseFloat(row.entradas) || 0,
            salidas:  parseFloat(row.salidas)  || 0,
            ventas:   parseFloat(row.ventas)   || 0,
        });
    }

    const result = [];
    for (const [, grupo] of grupoMap) {
        const productos = [];
        for (const [, prod] of grupo.productos) {
            let saldo = prod.stockInicial;
            for (const dia of prod.dias) {
                dia.saldoAnterior = saldo;
                saldo = saldo + dia.entradas - dia.salidas - dia.ventas;
                dia.saldoFinal = saldo;
            }
            prod.stockFinal    = saldo;
            prod.totalEntradas = prod.dias.reduce((s, d) => s + d.entradas, 0);
            prod.totalSalidas  = prod.dias.reduce((s, d) => s + d.salidas,  0);
            prod.totalVentas   = prod.dias.reduce((s, d) => s + d.ventas,   0);
            productos.push(prod);
        }
        result.push({ key: grupo.key, nombre: grupo.nombre, productos });
    }
    return result;
}

function tipoBadgeColor(tipo) {
    const t = (tipo || '').toUpperCase();
    if (t.includes('COMPRA') || t.includes('ENTRADA')) return '#10b981';
    if (t.includes('VENTA'))    return '#ef4444';
    if (t.includes('SALIDA'))   return '#f59e0b';
    if (t.includes('AJUSTE'))   return '#8b5cf6';
    if (t.includes('DEVOL'))    return '#06b6d4';
    if (t.includes('TRASLADO')) return '#3b82f6';
    return '#6C6C70';
}

// ── Render (móvil: card por producto con sus días) ───────────────
function renderReporte() {
    const grupos = productosAgrupados();

    if (grupos.length === 0) {
        document.getElementById('mpReporte').innerHTML =
            '<div style="padding:40px 20px;text-align:center;color:var(--text-tertiary)">📦 No hay movimientos para el período y Centro de Costo seleccionados</div>';
        return;
    }

    // KPIs
    const totalProductos = grupos.reduce((s, g) => s + g.productos.length, 0);
    const totalEntradas  = grupos.reduce((s, g) => s + g.productos.reduce((ss, p) => ss + p.totalEntradas, 0), 0);
    const totalSalidas   = grupos.reduce((s, g) => s + g.productos.reduce((ss, p) => ss + p.totalSalidas, 0), 0);
    const totalVentas    = grupos.reduce((s, g) => s + g.productos.reduce((ss, p) => ss + p.totalVentas, 0), 0);

    let html = `
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:14px">
            <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:12px;padding:10px;text-align:center">
                <div style="font-size:16px;font-weight:800">${totalProductos}</div>
                <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text-tertiary)">Prods.</div>
            </div>
            <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:12px;padding:10px;text-align:center">
                <div style="font-size:16px;font-weight:800;color:#10b981">${fmtNum(totalEntradas)}</div>
                <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text-tertiary)">Entradas</div>
            </div>
            <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:12px;padding:10px;text-align:center">
                <div style="font-size:16px;font-weight:800;color:#f59e0b">${fmtNum(totalSalidas)}</div>
                <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text-tertiary)">Salidas</div>
            </div>
            <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:12px;padding:10px;text-align:center">
                <div style="font-size:16px;font-weight:800;color:#ef4444">${fmtNum(totalVentas)}</div>
                <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text-tertiary)">Ventas</div>
            </div>
        </div>`;

    grupos.forEach(grupo => {
        html += `<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-secondary);padding:10px 4px 6px">📁 ${grupo.nombre}</div>`;

        grupo.productos.forEach(prod => {
            html += `
            <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:14px;overflow:hidden;margin-bottom:12px">
                <div style="padding:12px 14px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:8px">
                    <div style="min-width:0">
                        <div style="font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${prod.nombre}</div>
                        <div style="font-size:11px;color:var(--text-tertiary)">${prod.codigo} · ${prod.und} · ${prod.dias.length} movimiento(s)</div>
                    </div>
                    <div style="text-align:right;flex-shrink:0">
                        <div style="font-size:10px;color:var(--text-tertiary)">INICIAL</div>
                        <div style="font-family:monospace;font-weight:700;font-size:13px">${fmtNum(prod.stockInicial)}</div>
                    </div>
                </div>
                <div style="overflow-x:auto">
                    <table style="width:100%;border-collapse:collapse;font-size:11px;min-width:480px">
                        <thead><tr style="background:var(--bg-secondary)">
                            <th style="padding:6px 8px;text-align:left;font-size:10px;color:var(--text-tertiary)">FECHA</th>
                            <th style="padding:6px 8px;text-align:left;font-size:10px;color:var(--text-tertiary)">TIPO</th>
                            <th style="padding:6px 8px;text-align:right;font-size:10px;color:var(--text-tertiary)">ANT.</th>
                            <th style="padding:6px 8px;text-align:right;font-size:10px;color:#10b981">ENT.</th>
                            <th style="padding:6px 8px;text-align:right;font-size:10px;color:#f59e0b">SAL.</th>
                            <th style="padding:6px 8px;text-align:right;font-size:10px;color:#ef4444">VEN.</th>
                            <th style="padding:6px 8px;text-align:right;font-size:10px;color:#0891b2">SALDO</th>
                        </tr></thead>
                        <tbody>`;

            prod.dias.forEach(dia => {
                html += `<tr style="border-bottom:1px solid var(--border)">
                    <td style="padding:5px 8px;white-space:nowrap">${fmtFecha(dia.fecha)}</td>
                    <td style="padding:5px 8px"><span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:4px;background:${tipoBadgeColor(dia.tipo)}1a;color:${tipoBadgeColor(dia.tipo)}">${dia.tipo}</span></td>
                    <td style="padding:5px 8px;text-align:right;font-family:monospace;color:var(--text-tertiary)">${fmtNum(dia.saldoAnterior)}</td>
                    <td style="padding:5px 8px;text-align:right;font-family:monospace;color:${dia.entradas > 0 ? '#10b981;font-weight:600' : 'var(--text-tertiary)'}">${dia.entradas > 0 ? '+' + fmtNum(dia.entradas) : '—'}</td>
                    <td style="padding:5px 8px;text-align:right;font-family:monospace;color:${dia.salidas > 0 ? '#f59e0b;font-weight:600' : 'var(--text-tertiary)'}">${dia.salidas > 0 ? fmtNum(dia.salidas) : '—'}</td>
                    <td style="padding:5px 8px;text-align:right;font-family:monospace;color:${dia.ventas > 0 ? '#ef4444;font-weight:600' : 'var(--text-tertiary)'}">${dia.ventas > 0 ? fmtNum(dia.ventas) : '—'}</td>
                    <td style="padding:5px 8px;text-align:right;font-family:monospace;font-weight:700;color:${dia.saldoFinal < 0 ? '#ef4444' : '#0891b2'}">${fmtNum(dia.saldoFinal)}</td>
                </tr>`;
            });

            html += `<tr style="background:var(--bg-secondary)">
                    <td colspan="2" style="padding:7px 8px;font-weight:700;font-size:10px;text-transform:uppercase">TOTAL</td>
                    <td style="padding:7px 8px;text-align:right;font-family:monospace;color:var(--text-tertiary)">${fmtNum(prod.stockInicial)}</td>
                    <td style="padding:7px 8px;text-align:right;font-family:monospace;font-weight:700;color:#10b981">${fmtNum(prod.totalEntradas)}</td>
                    <td style="padding:7px 8px;text-align:right;font-family:monospace;font-weight:700;color:#f59e0b">${fmtNum(prod.totalSalidas)}</td>
                    <td style="padding:7px 8px;text-align:right;font-family:monospace;font-weight:700;color:#ef4444">${fmtNum(prod.totalVentas)}</td>
                    <td style="padding:7px 8px;text-align:right;font-family:monospace;font-weight:800;color:${prod.stockFinal < 0 ? '#ef4444' : '#0891b2'}">${fmtNum(prod.stockFinal)}</td>
                </tr>
                        </tbody>
                    </table>
                </div>
            </div>`;
        });
    });

    document.getElementById('mpReporte').innerHTML = html;
}
