// ================================================================
// ALMACÉN - INVENTARIO ACTUAL
// Módulo de consulta de inventario con filtros
// ================================================================

const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api';
let inventarioData = [];

function cargarInventarioActual() {
    const contentDiv = document.getElementById('inventarioContent');
    
    contentDiv.innerHTML = `
        <div style="background: var(--bg-card); padding: 1rem; border-radius: 12px; margin-bottom: 1rem; border: 1px solid var(--border); display: flex; gap: 1rem; align-items: end; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
                <label style="display: block; margin-bottom: 0.4rem; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Centro de Costo</label>
                <select id="ccostoSelect" onchange="cargarInventario()" style="width: 100%; padding: 0.7rem; background: var(--bg); border: 2px solid var(--border); border-radius: 6px; color: var(--text); font-size: 0.9rem;">
                    <option value="">Cargando...</option>
                </select>
            </div>
            <div style="flex: 1; min-width: 200px;">
                <label style="display: block; margin-bottom: 0.4rem; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Buscar Producto</label>
                <input type="text" placeholder="Nombre o código..." onkeyup="filtrarInventario(this.value)" style="width: 100%; padding: 0.7rem; background: var(--bg); border: 2px solid var(--border); border-radius: 6px; color: var(--text); font-size: 0.9rem;">
            </div>
        </div>

        <div style="background: var(--bg-card); border-radius: 12px; padding: 1rem; border: 1px solid var(--border);">
            <div style="overflow-x: auto; border-radius: 8px; border: 1px solid var(--border);">
                <table id="tablaInventario" style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                    <thead style="background: var(--bg);">
                        <tr>
                            <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; border-bottom: 2px solid var(--border);">Código</th>
                            <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; border-bottom: 2px solid var(--border);">Producto</th>
                            <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; border-bottom: 2px solid var(--border);">Unidad</th>
                            <th style="padding: 0.75rem 1rem; text-align: right; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; border-bottom: 2px solid var(--border);">Stock Actual</th>
                        </tr>
                    </thead>
                    <tbody id="inventarioBody">
                        <tr>
                            <td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-secondary);">Cargando...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    cargarCCostos();
}

async function cargarCCostos() {
    try {
        const response = await fetch(`${API_BASE}/ccostos?empresa=${sesion.empresa}`);
        const data = await response.json();

        if (data.success) {
            const select = document.getElementById('ccostoSelect');
            let html = '<option value="">-- Todos los Centros de Costo --</option>';
            data.data.forEach(cc => {
                html += `<option value="${cc.codigo}">${cc.codigo} - ${cc.nombre}</option>`;
            });
            select.innerHTML = html;
            cargarInventario();
        }
    } catch (error) {
        console.error('Error cargando ccostos:', error);
    }
}

async function cargarInventario() {
    const ccosto = document.getElementById('ccostoSelect').value;

    try {
        let url = `${API_BASE}/inventario?empresa=${sesion.empresa}`;
        if (ccosto) {
            url += `&ccosto=${ccosto}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            inventarioData = data.data;
            renderInventario();
        }
    } catch (error) {
        console.error('Error cargando inventario:', error);
        document.getElementById('inventarioBody').innerHTML = `
            <tr><td colspan="4" style="text-align: center; color: var(--danger); padding: 2rem;">
                ❌ Error al cargar datos
            </td></tr>
        `;
    }
}

function renderInventario() {
    const tbody = document.getElementById('inventarioBody');

    if (inventarioData.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="4" style="text-align: center; padding: 2rem;">
                No hay productos en este centro de costo
            </td></tr>
        `;
        return;
    }

    let html = '';
    let currentGrupo = null;
    let grupoIndex = 0;

    inventarioData.forEach(item => {
        if (item.grupo_codigo !== currentGrupo) {
            currentGrupo = item.grupo_codigo;
            grupoIndex = grupoIndex === 0 ? 1 : 0;
        }

        const grupoClass = grupoIndex === 0 ? 'grupo-1' : 'grupo-2';
        const stockFormateado = parseFloat(item.stock_actual).toFixed(2);

        const bgGradient = grupoIndex === 0 
            ? 'background: linear-gradient(90deg, rgba(30, 58, 138, 0.25) 0%, rgba(30, 58, 138, 0.15) 100%);'
            : 'background: linear-gradient(90deg, rgba(124, 45, 18, 0.25) 0%, rgba(124, 45, 18, 0.15) 100%);';

        html += `
            <tr style="${bgGradient}">
                <td style="padding: 0.65rem 1rem; border-bottom: 1px solid var(--border);"><strong>${item.codigo}</strong></td>
                <td style="padding: 0.65rem 1rem; border-bottom: 1px solid var(--border);">${item.nombre}</td>
                <td style="padding: 0.65rem 1rem; border-bottom: 1px solid var(--border);">${item.unidad || '-'}</td>
                <td style="padding: 0.65rem 1rem; border-bottom: 1px solid var(--border); text-align: right; font-family: 'Courier New', monospace; font-weight: 600;"><strong style="color: #60a5fa;">${stockFormateado}</strong></td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function filtrarInventario(texto) {
    const filas = document.querySelectorAll('#tablaInventario tbody tr');
    const textoLower = texto.toLowerCase();

    filas.forEach(fila => {
        const contenido = fila.textContent.toLowerCase();
        fila.style.display = contenido.includes(textoLower) ? '' : 'none';
    });
}
