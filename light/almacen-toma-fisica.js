// ================================================================
// ALMACÉN - TOMA FÍSICA DE INVENTARIO
// ================================================================

const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api';

window.addEventListener('load', () => {
    if (!localStorage.getItem('empresaActual') || !localStorage.getItem('usuario')) {
        window.location.href = 'index.html';
        return;
    }
    cargarTomaFisica();
});

let productos = [];
let centrosCosto = [];
let fisico = {};
let bodegaMaestre    = null;   // código CC de la bodega principal de la empresa
let modoVisualizacion = 'categoria'; // 'ubicacion' | 'categoria'

function getEmpresa() {
    return localStorage.getItem('empresaActual') || (window.sesion && window.sesion.empresa) || '';
}

// ── Init ──────────────────────────────────────────────────────────
function cargarTomaFisica() {
    cargarCentrosCosto().then(() => renderFormulario());
}

async function cargarCentrosCosto() {
    try {
        const [resCC, resBodega] = await Promise.all([
            fetch(`${API_BASE}/ccostos?empresa=${getEmpresa()}`),
            fetch(`${API_BASE}/empresas/bodega-maestra?empresa=${getEmpresa()}`)
        ]);
        const dataCC     = await resCC.json();
        const dataBodega = await resBodega.json();
        centrosCosto  = dataCC.data || [];
        bodegaMaestre = dataBodega.data?.centro_costo_codigo || null;
    } catch (e) {
        console.error('Error cargando CC:', e);
    }
}

// ── Cargar productos con stock real por CC ────────────────────────
async function cargarProductos() {
    const ccSel = document.getElementById('ccOrigen').value;

    if (!ccSel) {
        document.getElementById('gridProductos').innerHTML =
            '<div style="padding:20px;text-align:center;color:var(--text-tertiary)">Selecciona un Centro de Costo</div>';
        return;
    }

    document.getElementById('gridProductos').innerHTML =
        '<div style="padding:20px;text-align:center;color:var(--text-secondary)">⏳ Cargando productos...</div>';

    try {
        const res  = await fetch(
            `${API_BASE}/almacen/ajuste-inventario/stock?empresa=${getEmpresa()}&ccosto=${ccSel}`
        );
        const data = await res.json();
        productos = data.data || [];
        fisico = {};

        // Solo mostrar popup de visualización si es la bodega principal
        if (bodegaMaestre && ccSel === bodegaMaestre) {
            mostrarPopupVisualizacion();
        } else {
            modoVisualizacion = 'categoria';
            renderProductos();
        }
    } catch (e) {
        console.error('Error cargando productos:', e);
        document.getElementById('gridProductos').innerHTML =
            '<div style="padding:20px;text-align:center;color:#ef4444">❌ Error cargando productos</div>';
    }
}

// ── Popup: método de visualización (solo bodega principal) ────────
function mostrarPopupVisualizacion() {
    const overlay = document.getElementById('bsOverlay');
    const panel   = overlay.querySelector('.bs-panel');

    panel.innerHTML = `
      <div style="padding:28px 20px 24px;text-align:center">
        <div style="font-size:2.2rem;margin-bottom:10px">📦</div>
        <div style="font-size:19px;font-weight:800;margin-bottom:6px;color:var(--text-primary)">Toma Física</div>
        <div style="font-size:14px;color:var(--text-secondary);margin-bottom:24px;line-height:1.5">¿Cómo quieres visualizar los productos?</div>

        <button onclick="confirmarVisualizacion('ubicacion')"
          style="width:100%;padding:18px 16px;border-radius:14px;border:none;cursor:pointer;
                 background:#0ea5e9;color:white;font-size:15px;font-weight:700;margin-bottom:12px;
                 display:flex;align-items:center;gap:14px;text-align:left">
          <span style="font-size:26px;flex-shrink:0">📍</span>
          <div>
            <div style="font-size:15px;font-weight:800;letter-spacing:.3px">UBICACIÓN EN ALMACÉN</div>
            <div style="font-size:12px;font-weight:400;opacity:.9;margin-top:2px">Agrupado por posición física en bodega</div>
          </div>
        </button>

        <button onclick="confirmarVisualizacion('categoria')"
          style="width:100%;padding:18px 16px;border-radius:14px;border:none;cursor:pointer;
                 background:#8b5cf6;color:white;font-size:15px;font-weight:700;margin-bottom:20px;
                 display:flex;align-items:center;gap:14px;text-align:left">
          <span style="font-size:26px;flex-shrink:0">📂</span>
          <div>
            <div style="font-size:15px;font-weight:800;letter-spacing:.3px">CATEGORÍA DE PRODUCTOS</div>
            <div style="font-size:12px;font-weight:400;opacity:.9;margin-top:2px">Agrupado por tipo/categoría</div>
          </div>
        </button>

        <button onclick="cerrarBsOverlay()"
          style="width:100%;padding:12px;border-radius:14px;border:1px solid rgba(239,68,68,.3);
                 background:rgba(239,68,68,.1);color:#ef4444;font-size:14px;font-weight:600;cursor:pointer">
          Cancelar
        </button>
      </div>
    `;

    overlay.classList.add('open');
}

function confirmarVisualizacion(modo) {
    modoVisualizacion = modo;
    cerrarBsOverlay();
    renderProductos();
}

function cerrarBsOverlay(event) {
    if (event && event.target !== document.getElementById('bsOverlay')) return;
    document.getElementById('bsOverlay').classList.remove('open');
}

// ── Render tabla ──────────────────────────────────────────────────
function renderProductos() {
    if (productos.length === 0) {
        document.getElementById('gridProductos').innerHTML =
            '<div style="padding:20px;text-align:center;color:var(--text-tertiary)">No hay productos disponibles</div>';
        return;
    }

    const grupos = {};
    if (modoVisualizacion === 'ubicacion') {
        productos.forEach(p => {
            const ub  = (p.ubicacion || '').trim();
            const key = ub || '~~~sin_ubicacion';
            if (!grupos[key]) grupos[key] = { nombre: ub ? `📍 ${ub}` : '📦 Sin ubicación específica', items: [] };
            grupos[key].items.push(p);
        });
        // Ordenar alfabéticamente, sin ubicación al final
        Object.values(grupos).forEach(g => g.items.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    } else {
        productos.forEach(p => {
            const key    = p.grupo_codigo || '__sin_grupo__';
            const nombre = p.grupo_nombre || 'Sin Categoría';
            if (!grupos[key]) grupos[key] = { nombre, items: [] };
            grupos[key].items.push(p);
        });
    }

    let html = '<table class="grid-table">';
    html += '<thead><tr>'
          + '<th style="width:70px">CÓDIGO</th>'
          + '<th>NOMBRE</th>'
          + '<th style="width:50px">UND</th>'
          + '<th style="width:90px">STOCK</th>'
          + '<th style="width:90px">FÍSICO</th>'
          + '<th style="width:80px">DIF</th>'
          + '</tr></thead><tbody>';

    const gruposOrdenados = Object.entries(grupos).sort(([ka], [kb]) => ka.localeCompare(kb));
    gruposOrdenados.forEach(([, grupo]) => {
        html += `<tr>
            <td colspan="6" style="background:var(--bg-secondary);padding:10px;font-weight:600;font-size:12px;border-bottom:2px solid var(--border)">
                📁 ${grupo.nombre}
            </td>
        </tr>`;

        grupo.items.forEach(p => {
            const stock = parseFloat(p.stock_actual ?? 0);
            const fis   = fisico[p.codigo] ?? '';
            const diff  = fis !== '' ? (parseFloat(fis) - stock) : null;
            const diffColor = diff === null ? 'var(--text-secondary)'
                            : diff > 0 ? 'var(--success)'
                            : diff < 0 ? 'var(--danger)'
                            : 'var(--text-secondary)';
            const diffText  = diff === null ? '—'
                            : (diff > 0 ? '+' : '') + diff.toFixed(2);

            html += `<tr>
                <td><span style="background:var(--bg-tertiary);padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600">${p.codigo}</span></td>
                <td style="padding:8px">${p.nombre}</td>
                <td style="text-align:center;font-size:12px;font-weight:600;padding:8px">${p.und}</td>
                <td style="text-align:right;padding:8px;font-family:monospace;font-weight:600;color:var(--text-secondary)">${stock.toFixed(2)}</td>
                <td style="padding:8px">
                    <input type="number"
                        class="fisico-input"
                        data-codigo="${p.codigo}"
                        data-stock="${stock}"
                        value="${fis}"
                        placeholder="0"
                        step="0.01"
                        min="0"
                        oninput="actualizarDiferencia(this)"
                        style="width:100%;padding:6px;border:1px solid var(--border);border-radius:6px;font-size:14px">
                </td>
                <td id="diff-${p.codigo}" style="text-align:right;padding:8px;font-family:monospace;font-weight:600;color:${diffColor}">
                    ${diffText}
                </td>
            </tr>`;
        });
    });

    html += '</tbody></table>';
    document.getElementById('gridProductos').innerHTML = html;
    actualizarFooter();
}

// ── Input handlers ────────────────────────────────────────────────
function actualizarDiferencia(el) {
    const codigo = el.dataset.codigo;
    const stock  = parseFloat(el.dataset.stock);
    const val    = el.value.trim();

    if (val !== '') {
        fisico[codigo] = parseFloat(val);
    } else {
        delete fisico[codigo];
    }

    const fis      = fisico[codigo];
    const diff     = fis !== undefined ? (fis - stock) : null;
    const diffColor = diff === null ? 'var(--text-secondary)'
                    : diff > 0 ? 'var(--success)'
                    : diff < 0 ? 'var(--danger)'
                    : 'var(--text-secondary)';
    const diffText  = diff === null ? '—'
                    : (diff > 0 ? '+' : '') + diff.toFixed(2);

    const cell = document.getElementById(`diff-${codigo}`);
    if (cell) { cell.textContent = diffText; cell.style.color = diffColor; }

    actualizarFooter();
}

function actualizarFooter() {
    const count    = Object.keys(fisico).length;
    const btn      = document.getElementById('btnGuardar');
    if (btn) btn.disabled = count === 0;
    const el = document.getElementById('productosContados');
    if (el) el.textContent = count;
}

function limpiarProductos() {
    fisico = {};
    document.querySelectorAll('.fisico-input').forEach(inp => {
        inp.value = '';
        actualizarDiferencia(inp);
    });
}

// ── Render formulario ─────────────────────────────────────────────
function renderFormulario() {
    document.getElementById('gestionContent').innerHTML = `
        <div class="filters-container">
            <div class="filter-group">
                <label class="filter-label">Fecha *</label>
                <input type="date" id="fecha" class="filter-input"
                    value="${new Date().toISOString().slice(0, 10)}">
            </div>
            <div class="filter-group">
                <label class="filter-label">Centro de Costo *</label>
                <select id="ccOrigen" class="filter-select" onchange="cargarProductos()">
                    <option value="">— Selecciona —</option>
                    ${centrosCosto.map(cc => `<option value="${cc.codigo}">${cc.nombre}</option>`).join('')}
                </select>
            </div>
            <div class="filter-group">
                <label class="filter-label">Observaciones</label>
                <input type="text" id="observaciones" class="filter-input"
                    placeholder="Comentarios del conteo..." maxlength="120">
            </div>
            <div class="filter-group" style="padding-top:0;margin-top:-8px">
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:var(--text-primary)">
                    <input type="checkbox" id="esParcial" checked style="width:18px;height:18px;cursor:pointer">
                    <span>Toma Física Parcial (solo productos contados)</span>
                </label>
            </div>
        </div>

        <div class="table-container" style="margin-top:20px">
            <div style="padding:16px;border-bottom:1px solid var(--border);font-weight:600;font-size:14px;display:flex;justify-content:space-between;align-items:center">
                <span>📦 Productos</span>
                <button class="btn btn-secondary" style="font-size:12px;padding:6px 12px" onclick="limpiarProductos()">Limpiar</button>
            </div>
            <div id="gridProductos" style="overflow-x:auto">
                <div style="padding:20px;text-align:center;color:var(--text-tertiary)">Selecciona un Centro de Costo</div>
            </div>
        </div>

        <div style="margin-top:20px;padding:16px;background:var(--bg-secondary);border-radius:var(--radius-md);display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:13px;color:var(--text-secondary)">
                <span id="productosContados">0</span> producto(s) contados
            </span>
            <button id="btnGuardar" class="btn btn-primary" disabled onclick="guardarTomaFisica()"
                style="padding:8px 16px;font-size:13px">
                💾 Guardar Toma Física
            </button>
        </div>
    `;
}

// ── Guardar ───────────────────────────────────────────────────────
async function guardarTomaFisica() {
    const fecha        = document.getElementById('fecha').value;
    const ccOrigen     = document.getElementById('ccOrigen').value;
    const observaciones = document.getElementById('observaciones').value;
    const esParcial    = document.getElementById('esParcial').checked;

    if (!fecha || !ccOrigen) {
        alert('❌ Completa los campos obligatorios');
        return;
    }

    // Construir ajustes según parcial / completa
    const ajustes = [];

    if (esParcial) {
        // Solo productos donde el usuario ingresó un valor
        Object.entries(fisico).forEach(([codigo, cantFisica]) => {
            const prod  = productos.find(p => p.codigo === codigo);
            const stock = parseFloat(prod?.stock_actual ?? 0);
            const diff  = cantFisica - stock;
            if (diff !== 0) ajustes.push({ codigo, diferencia: diff });
        });
    } else {
        // Todos los productos: blank = 0
        productos.forEach(p => {
            const stock      = parseFloat(p.stock_actual ?? 0);
            const cantFisica = fisico[p.codigo] !== undefined ? fisico[p.codigo] : 0;
            const diff       = cantFisica - stock;
            if (diff !== 0) ajustes.push({ codigo: p.codigo, diferencia: diff });
        });
    }

    if (ajustes.length === 0) {
        alert('❌ Ningún producto tiene diferencia de conteo');
        return;
    }

    const tipoTxt = esParcial ? 'Parcial' : 'Completa';
    if (!confirm(`¿Confirmas toma física ${tipoTxt} con ${ajustes.length} ajuste(s)?`)) return;

    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('active');
    document.querySelector('.popup-state-loading').classList.remove('hide');
    document.querySelector('.popup-state-success').classList.remove('show');

    try {
        const res  = await fetch(`${API_BASE}/almacen/ajuste-inventario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                empresa:      getEmpresa(),
                fecha,
                ccosto:       ccOrigen,
                observaciones,
                ajustes,
            }),
        });
        const data = await res.json();

        if (data.conflict) {
            mostrarAviso(`⚠️ Ya existe una toma física para esta fecha y CC. Se guardará como un nuevo registro.`);
            return guardarConMode('add', fecha, ccOrigen, observaciones, ajustes, tipoTxt);
        }

        if (data.success) {
            mostrarExitoPopup();
            fisico = {};
            document.getElementById('ccOrigen').value = '';
            document.getElementById('observaciones').value = '';
            document.getElementById('gridProductos').innerHTML =
                '<div style="padding:20px;text-align:center;color:var(--text-tertiary)">Selecciona un Centro de Costo</div>';
            actualizarFooter();
        } else {
            overlay.classList.remove('active');
            alert('❌ ' + (data.error || 'Error guardando'));
        }
    } catch (e) {
        console.error('Error:', e);
        overlay.classList.remove('active');
        alert('❌ Error de conexión');
    }
}

async function guardarConMode(mode, fecha, ccOrigen, observaciones, ajustes, tipoTxt) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('active');
    document.querySelector('.popup-state-loading').classList.remove('hide');
    document.querySelector('.popup-state-success').classList.remove('show');

    try {
        const res  = await fetch(`${API_BASE}/almacen/ajuste-inventario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                empresa: getEmpresa(),
                fecha,
                tipo: 'TOMA FISICA',
                ccosto:  ccOrigen,
                observaciones,
                ajustes,
                mode,
            }),
        });
        const data = await res.json();

        if (data.success) {
            mostrarExitoPopup();
            fisico = {};
            document.getElementById('ccOrigen').value = '';
            document.getElementById('gridProductos').innerHTML =
                '<div style="padding:20px;text-align:center;color:var(--text-tertiary)">Selecciona un Centro de Costo</div>';
            actualizarFooter();
        } else {
            overlay.classList.remove('active');
            alert('❌ ' + (data.error || 'Error guardando'));
        }
    } catch (e) {
        overlay.classList.remove('active');
        alert('❌ Error de conexión');
    }
}

function mostrarExitoPopup() {
    document.querySelector('.popup-state-loading').classList.add('hide');
    document.querySelector('.popup-state-success').classList.add('show');
}

function cerrarPopupExito() {
    document.getElementById('loadingOverlay').classList.remove('active');
    document.querySelector('.popup-state-loading').classList.remove('hide');
    document.querySelector('.popup-state-success').classList.remove('show');
}

function mostrarAviso(msg) {
    const aviso = document.createElement('div');
    aviso.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        padding: 14px 24px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 8px 20px rgba(0,0,0,0.25);
        animation: slideDown 0.3s ease;
        max-width: 90%;
    `;
    aviso.textContent = msg;
    document.body.appendChild(aviso);

    setTimeout(() => {
        aviso.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => aviso.remove(), 300);
    }, 3000);
}
