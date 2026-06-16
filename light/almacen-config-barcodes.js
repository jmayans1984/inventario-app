// ================================================================
// IMPRESIÓN DE CÓDIGOS DE BARRAS — Almacén / Configuración
// ================================================================

const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api';

let productos = [];      // lista completa cargada
let seleccionados = new Set(); // codigos seleccionados

window.addEventListener('load', () => {
    if (!localStorage.getItem('empresaActual') || !localStorage.getItem('usuario')) {
        window.location.href = 'index.html';
        return;
    }
    cargarProductos();
});

function getEmpresa() {
    return localStorage.getItem('empresaActual') || '';
}

async function cargarProductos() {
    document.getElementById('bcListaWrap').innerHTML =
        '<div class="bc-empty">⏳ Cargando productos...</div>';
    try {
        const res  = await fetch(`${API_BASE}/almacen/productos?empresa=${getEmpresa()}`);
        const data = await res.json();
        productos = data.data || [];
        renderLista(productos);
    } catch (e) {
        document.getElementById('bcListaWrap').innerHTML =
            '<div class="bc-empty">❌ Error cargando productos</div>';
    }
}

function filtrarProductos() {
    const q = document.getElementById('bcBuscar').value.trim().toUpperCase();
    if (!q) { renderLista(productos); return; }
    const filtrados = productos.filter(p =>
        p.nombre.toUpperCase().includes(q) || String(p.codigo).toUpperCase().includes(q)
    );
    renderLista(filtrados);
}

function renderLista(lista) {
    const wrap = document.getElementById('bcListaWrap');
    document.getElementById('bcContador').textContent = `${lista.length} producto(s)`;

    if (!lista.length) {
        wrap.innerHTML = '<div class="bc-empty">📭 No se encontraron productos</div>';
        actualizarContadorSeleccion();
        return;
    }

    wrap.innerHTML = `<div class="bc-lista">${lista.map(p => `
        <div class="bc-item ${seleccionados.has(p.codigo) ? 'sel' : ''}" onclick="toggleProducto('${p.codigo}')">
            <input type="checkbox" ${seleccionados.has(p.codigo) ? 'checked' : ''} onclick="event.stopPropagation();toggleProducto('${p.codigo}')">
            <div>
                <div class="bc-item-nombre">${p.nombre}</div>
                <div class="bc-item-cod">${p.codigo}${p.und ? ' · ' + p.und : ''}</div>
            </div>
        </div>
    `).join('')}</div>`;

    actualizarContadorSeleccion();
}

function toggleProducto(codigo) {
    if (seleccionados.has(codigo)) seleccionados.delete(codigo);
    else seleccionados.add(codigo);
    filtrarProductos();
}

function toggleSeleccionarTodos() {
    const visibles = document.getElementById('bcBuscar').value.trim()
        ? productos.filter(p => {
            const q = document.getElementById('bcBuscar').value.trim().toUpperCase();
            return p.nombre.toUpperCase().includes(q) || String(p.codigo).toUpperCase().includes(q);
          })
        : productos;

    const todosYaSeleccionados = visibles.every(p => seleccionados.has(p.codigo));
    if (todosYaSeleccionados) {
        visibles.forEach(p => seleccionados.delete(p.codigo));
    } else {
        visibles.forEach(p => seleccionados.add(p.codigo));
    }
    filtrarProductos();
}

function actualizarContadorSeleccion() {
    document.getElementById('bcSelCount').textContent = seleccionados.size;
}

// ── Impresión ───────────────────────────────────────────────
function imprimirSeleccionados() {
    if (seleccionados.size === 0) {
        alert('Selecciona al menos un producto para imprimir.');
        return;
    }

    const cantidad = Math.max(1, parseInt(document.getElementById('bcCantidad').value) || 1);
    const porFila  = parseInt(document.getElementById('bcPorFila').value) || 3;

    const elegidos = productos.filter(p => seleccionados.has(p.codigo));

    let etiquetasHtml = '';
    elegidos.forEach(p => {
        const canvas = document.createElement('canvas');
        try {
            JsBarcode(canvas, String(p.codigo), {
                format: 'CODE128', displayValue: true,
                fontSize: 12, textMargin: 2, height: 40, width: 1.6, margin: 4,
            });
        } catch (e) {
            return; // código inválido para barcode, omitir
        }
        const img = canvas.toDataURL('image/png');

        for (let i = 0; i < cantidad; i++) {
            etiquetasHtml += `
                <div class="etiqueta">
                    <div class="etiqueta-nombre">${p.nombre}</div>
                    <img src="${img}" class="etiqueta-img" />
                </div>`;
        }
    });

    const ventana = window.open('', '_blank');
    ventana.document.write(`
        <!DOCTYPE html><html><head>
        <meta charset="UTF-8">
        <title>Códigos de Barras</title>
        <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; margin: 10px; }
            .grid {
                display: grid;
                grid-template-columns: repeat(${porFila}, 1fr);
                gap: 8px;
            }
            .etiqueta {
                border: 1px dashed #999;
                border-radius: 6px;
                padding: 8px 6px;
                text-align: center;
                page-break-inside: avoid;
            }
            .etiqueta-nombre {
                font-size: 11px;
                font-weight: 700;
                margin-bottom: 4px;
                line-height: 1.2;
                min-height: 26px;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }
            .etiqueta-img { width: 100%; max-width: 220px; }
            @media print {
                .etiqueta { border: none; }
            }
        </style>
        </head><body>
        <div class="grid">${etiquetasHtml}</div>
        <script>window.onload=()=>{window.print();}<\/script>
        </body></html>
    `);
    ventana.document.close();
}
