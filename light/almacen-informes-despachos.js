// ================================================================
// ALMACÉN — INFORMES — IMPRESIÓN DE DESPACHOS DE BODEGA
// ================================================================

const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api';

function getEmpresa() {
    const sesion = JSON.parse(localStorage.getItem('usuario') || '{}');
    return localStorage.getItem('empresaActual') || sesion.empresa;
}

function fmtFecha(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    const ano = d.getFullYear();
    return `${mes}/${dia}/${ano}`;
}

async function buscarDespachos() {
    const empresa = getEmpresa();

    const el = document.getElementById('listaDespachos');
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div><p>Cargando despachos...</p></div>';

    try {
        const url = `${API_BASE}/almacen/despachos?empresa=${empresa}`;
        const res = await fetch(url, { timeout: 15000 });
        const data = await res.json();
        renderDespachos(data.data || []);
    } catch (e) {
        el.innerHTML = '<div class="empty-state"><div class="empty-icon">❌</div><p>Error cargando despachos</p></div>';
    }
}

function renderDespachos(despachos) {
    const el = document.getElementById('listaDespachos');

    if (!despachos.length) {
        el.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>No hay despachos</p></div>';
        return;
    }

    el.innerHTML = despachos.map(d => `
        <div class="inf-item">
            <div class="inf-item-info">
                <div class="inf-item-id">#${d.id} · ${fmtFecha(d.fecha)}</div>
                <div class="inf-item-dest">🏪 ${d.cc_destino_nombre || d.cc_destino}</div>
                <div class="inf-item-meta">${d.total_items} productos · ${parseFloat(d.total_unidades || 0).toFixed(0)} unidades · <span style="color:var(--text-tertiary)">${estadoLabel(d.estado)}</span></div>
            </div>
            <button class="inf-item-btn" onclick="imprimirDespacho(${d.id})">
                🖨️ Imprimir
            </button>
        </div>
    `).join('');
}

function estadoLabel(estado) {
    const map = {
        'PENDIENTE': 'Pendiente',
        'EN_PICKING': 'En Picking',
        'EN_PACKING': 'En Packing',
        'COMPLETADO': 'Completado',
        'CANCELADO': 'Cancelado'
    };
    return map[estado] || estado;
}

async function imprimirDespacho(id) {
    try {
        const res = await fetch(`${API_BASE}/almacen/despachos/${id}?empresa=${getEmpresa()}`);
        const data = await res.json();
        const o = data.data;

        // Generar reporte
        const color = '#047857';
        const filas = o.detalle.map(i => {
            const e = parseFloat(i.cant_packing) > 0 ? parseFloat(i.cant_packing)
                    : parseFloat(i.cant_picking) > 0 ? parseFloat(i.cant_picking)
                    : parseFloat(i.cant_requerida);
            return `<tr>
                <td style="padding:3px 5px;border-bottom:1px solid #e5e7eb;font-size:9px">${i.producto_codigo}</td>
                <td style="padding:3px 5px;border-bottom:1px solid #e5e7eb;font-size:9px">${i.producto_nombre}</td>
                <td style="padding:3px 5px;border-bottom:1px solid #e5e7eb;font-size:9px">${i.descripcion || '—'}</td>
                <td style="padding:3px 5px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:9px">${i.und}</td>
                <td style="padding:3px 5px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700;font-size:9px">${e}</td>
            </tr>`;
        }).join('');

        const ventana = window.open('', '_blank');
        ventana.document.write(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reporte Despacho #${o.id}</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .encabezado { border-left: 5px solid ${color}; padding: 0 0 0 14px; margin-bottom: 24px; }
        .encabezado h1 { font-size: 20px; font-weight: 800; }
        .encabezado p  { font-size: 12px; color: #555; margin-top: 3px; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; background: ${color}22; color: ${color}; }
        .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 20px; }
        .meta-item label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #6b7280; display: block; }
        .meta-item span  { font-size: 13px; font-weight: 600; margin-top: 2px; display: block; }
        table { width: 100%; border-collapse: collapse; }
        thead th { padding: 5px 8px; background: #f3f4f6; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; text-align: left; border-bottom: 2px solid #d1d5db; }
        @media print { body { padding: 15px; } }
    </style>
</head>
<body>
    <div class="encabezado">
        <h1>REPORTE DE DESPACHO</h1>
        <p>Orden #${o.id} &nbsp;·&nbsp; ${fmtFecha(o.fecha)}</p>
    </div>
    <div class="meta-grid">
        <div class="meta-item"><label>CC Origen</label><span>${o.cc_origen_nombre}</span></div>
        <div class="meta-item"><label>CC Destino</label><span>${o.cc_destino_nombre}</span></div>
        <div class="meta-item"><label>Fecha</label><span>${fmtFecha(o.fecha)}</span></div>
    </div>
    <table>
        <thead><tr>
            <th style="width:90px">CÓDIGO</th>
            <th>PRODUCTO</th>
            <th>DESCRIPCIÓN</th>
            <th style="width:55px;text-align:center">UND</th>
            <th style="width:80px;text-align:center">REQUERIDO</th>
        </tr></thead>
        <tbody>${filas}</tbody>
    </table>
    <div style="margin-top:20px;padding:10px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#6b7280;margin-bottom:6px">Otros</div>
        <div style="font-size:9px;color:#333">${o.observaciones || '—'}</div>
    </div>
    <script>window.onload=()=>{window.print();}<\/script>
</body>
</html>`);
        ventana.document.close();
    } catch (e) {
        alert('Error cargando despacho: ' + e.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        buscarDespachos();
    }, 300);
});
