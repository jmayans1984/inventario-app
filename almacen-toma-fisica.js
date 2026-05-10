// ================================================================
// ALMACÉN - TOMA FÍSICA DE INVENTARIO
// Registrar conteos físicos de productos
// ================================================================

const API_BASE_TOMA = 'https://inventario-app-production-e8c8.up.railway.app/api';
let productosTomaFisica = [];

// ================================================================
// CARGAR MÓDULO DE TOMA FÍSICA
// ================================================================

function cargarTomaFisica() {
    const contentDiv = document.getElementById('gestionContent');

    contentDiv.innerHTML = `
        <div class="table-container">
            <div class="filters-container">
                <div class="filter-group">
                    <label class="filter-label">Fecha *</label>
                    <input type="date" id="fechaTomaFisica" class="filter-input">
                </div>

                <div class="filter-group">
                    <label class="filter-label">Centro de Costo *</label>
                    <select id="ccCostoTomaFisica" onchange="cargarGridTomaFisica()" class="filter-select">
                        <option value="">Seleccione...</option>
                    </select>
                </div>

                <div class="filter-group">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="checkbox" id="tomaFisicaParcial" checked onchange="">
                        <span class="filter-label" style="margin: 0;">Toma Física de Inventario Parcial</span>
                    </label>
                </div>

                <div class="filter-group full-width">
                    <label class="filter-label">Observaciones</label>
                    <input type="text" id="observacionesTomaFisica" class="filter-input" placeholder="Comentarios del conteo...">
                </div>
            </div>

            <div style="overflow-x: auto;">
                <table class="grid-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Producto</th>
                            <th>Unidad</th>
                            <th style="text-align: right;">Stock Sistema</th>
                            <th style="text-align: right;">Cantidad Física</th>
                            <th style="text-align: right;">Diferencia</th>
                        </tr>
                    </thead>
                    <tbody id="gridBodyTomaFisica">
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                                Seleccione fecha y centro de costo para comenzar
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div style="padding: 1.5rem; border-top: 2px solid var(--border); display: flex; justify-content: flex-end; gap: 1rem;">
                <button class="btn btn-secondary" onclick="limpiarGridTomaFisica()">❌ Cancelar</button>
                <button class="btn btn-primary" onclick="guardarTomaFisica()">💾 Registrar Toma Física</button>
            </div>
        </div>
    `;

    // Establecer fecha de hoy
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaTomaFisica').value = hoy;

    cargarCCostosTomaFisica();
}

// ================================================================
// CARGAR CENTROS DE COSTO
// ================================================================

async function cargarCCostosTomaFisica() {
    try {
        const response = await fetch(`${API_BASE_TOMA}/ccostos?empresa=${sesion.empresa}`);
        const data = await response.json();

        const selectCCosto = document.getElementById('ccCostoTomaFisica');
        selectCCosto.innerHTML = '<option value="">Seleccione...</option>';

        if (data.success && data.data) {
            data.data.forEach(cc => {
                const option = document.createElement('option');
                option.value = cc.codigo;
                option.textContent = cc.nombre;
                selectCCosto.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando centros de costo:', error);
        alert('❌ Error al cargar centros de costo');
    }
}

// ================================================================
// CARGAR GRID CON TODOS LOS PRODUCTOS
// ================================================================

async function cargarGridTomaFisica() {
    const ccCosto = document.getElementById('ccCostoTomaFisica').value;
    const gridBody = document.getElementById('gridBodyTomaFisica');

    if (!ccCosto) {
        gridBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    Seleccione el centro de costo para cargar productos
                </td>
            </tr>
        `;
        return;
    }

    gridBody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                Cargando productos...
            </td>
        </tr>
    `;

    try {
        const url = `${API_BASE_TOMA}/inventario?ccosto=${ccCosto}&empresa=${sesion.empresa}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
            // Crear array de productos
            productosTomaFisica = data.data.map(item => ({
                codigo: item.codigo,
                nombre: item.nombre,
                unidad: item.und || 'UN',
                stock_actual: parseFloat(item.stock_actual) || 0,
                grupo: item.grupo,
                grupo_nombre: item.grupo_nombre
            }));

            // Crear mapa de stock
            const stockMap = {};
            data.data.forEach(item => {
                stockMap[item.codigo] = parseFloat(item.stock_actual) || 0;
            });

            // Renderizar grid
            renderizarGridTomaFisica(productosTomaFisica, stockMap);
        } else {
            gridBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                        No se encontraron productos
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error cargando grid:', error);
        gridBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem; color: var(--danger);">
                    Error al cargar productos
                </td>
            </tr>
        `;
    }
}

// ================================================================
// RENDERIZAR GRID
// ================================================================

function renderizarGridTomaFisica(productos, stockMap) {
    const gridBody = document.getElementById('gridBodyTomaFisica');

    if (productos.length === 0) {
        gridBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    No hay productos para mostrar
                </td>
            </tr>
        `;
        return;
    }

    // Agrupar productos por código de grupo
    const grupos = {};
    productos.forEach(producto => {
        const codigoGrupo = producto.grupo || 'SIN_GRUPO';
        const nombreGrupo = producto.grupo_nombre || 'Sin Grupo';

        if (!grupos[codigoGrupo]) {
            grupos[codigoGrupo] = {
                nombre: nombreGrupo,
                productos: []
            };
        }
        grupos[codigoGrupo].productos.push(producto);
    });

    let html = '';

    // Renderizar por grupo, ordenando por código de grupo numéricamente
    Object.keys(grupos)
        .sort((a, b) => {
            if (a === 'SIN_GRUPO') return 1;
            if (b === 'SIN_GRUPO') return -1;
            return parseInt(a) - parseInt(b);
        })
        .forEach(codigoGrupo => {
            const grupo = grupos[codigoGrupo];

            html += `
                <tr style="background: var(--bg-secondary); font-weight: 700; color: var(--text-primary);">
                    <td colspan="6" style="padding: 0.75rem 1rem; border-bottom: 2px solid var(--border);">
                        📦 ${grupo.nombre}
                    </td>
                </tr>
            `;

            grupo.productos.forEach(producto => {
                const stockActual = producto.stock_actual || stockMap[producto.codigo] || 0;

                html += `
                    <tr data-codigo="${producto.codigo}" style="border-bottom: 1px solid var(--border);">
                        <td style="font-family: 'JetBrains Mono', monospace; font-weight: 600; padding: 0.5rem 1rem;">${producto.codigo}</td>
                        <td style="padding: 0.5rem 1rem;">${producto.nombre}</td>
                        <td style="padding: 0.5rem 1rem;">${producto.unidad || '-'}</td>
                        <td style="text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 600; color: var(--text-secondary); padding: 0.5rem 1rem;">
                            ${formatearNumeroTomaFisica(stockActual)}
                        </td>
                        <td style="text-align: right; padding: 0.5rem 1rem;">
                            <input
                                type="text"
                                class="input-cantidad-fisica"
                                data-codigo="${producto.codigo}"
                                data-stock-sistema="${stockActual}"
                                placeholder=""
                                onblur="formatearInputTomaFisica(this)"
                                oninput="calcularDiferenciaTomaFisica(this)"
                                onfocus="limpiarFormatoTomaFisica(this)"
                                style="width: 80px; padding: 0.4rem; text-align: right;"
                            >
                        </td>
                        <td style="text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 600; padding: 0.5rem 1rem; color: var(--text-secondary);">
                            <span class="diferencia" data-codigo="${producto.codigo}">-</span>
                        </td>
                    </tr>
                `;
            });
        });

    gridBody.innerHTML = html;
}

// ================================================================
// CALCULAR DIFERENCIA AL INGRESAR CANTIDAD
// ================================================================

function calcularDiferenciaTomaFisica(input) {
    const codigo = input.dataset.codigo;
    const stockSistema = parseFloat(input.dataset.stockSistema) || 0;
    const cantidadFisica = parseFloat(input.value) || 0;
    const diferencia = cantidadFisica - stockSistema;

    const spanDiferencia = document.querySelector(`.diferencia[data-codigo="${codigo}"]`);
    if (spanDiferencia) {
        if (input.value === '') {
            spanDiferencia.textContent = '-';
            spanDiferencia.style.color = 'var(--text-secondary)';
        } else {
            spanDiferencia.textContent = (diferencia > 0 ? '+' : '') + diferencia.toFixed(2);
            spanDiferencia.style.color = diferencia > 0 ? 'var(--success)' : diferencia < 0 ? 'var(--danger)' : 'var(--text-secondary)';
        }
    }
}

// ================================================================
// FORMATEAR INPUT AL SALIR (onblur)
// ================================================================

function formatearInputTomaFisica(input) {
    const value = input.value.trim();

    if (value === '') {
        input.value = '';
        calcularDiferenciaTomaFisica(input);
        return;
    }

    const numero = parseFloat(value);

    if (isNaN(numero)) {
        input.value = '';
        calcularDiferenciaTomaFisica(input);
        return;
    }

    // Formato con 2 decimales (permite 0 como valor válido)
    input.value = numero.toFixed(2);
    calcularDiferenciaTomaFisica(input);
}

// ================================================================
// LIMPIAR FORMATO AL ENTRAR (onfocus)
// ================================================================

function limpiarFormatoTomaFisica(input) {
    // No hace nada, deja el valor tal cual para que el usuario lo edite
}

// ================================================================
// FORMATEAR NÚMERO PARA DISPLAY
// ================================================================

function formatearNumeroTomaFisica(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
}

// ================================================================
// LIMPIAR GRID
// ================================================================

function limpiarGridTomaFisica() {
    const inputs = document.querySelectorAll('.input-cantidad-fisica');
    inputs.forEach(input => {
        input.value = '';
        calcularDiferenciaTomaFisica(input);
    });
}

// ================================================================
// GUARDAR TOMA FÍSICA
// ================================================================

async function guardarTomaFisica() {
    const fecha = document.getElementById('fechaTomaFisica').value;
    const ccCosto = document.getElementById('ccCostoTomaFisica').value;
    const observaciones = document.getElementById('observacionesTomaFisica').value.trim();
    const esTomaFisicaParcial = document.getElementById('tomaFisicaParcial').checked;

    // Validar campos
    if (!fecha) {
        alert('❌ La fecha es obligatoria');
        return;
    }

    if (!ccCosto) {
        alert('❌ El centro de costo es obligatorio');
        return;
    }

    // Recolectar productos con diferencia y crear movimientos
    const inputs = document.querySelectorAll('.input-cantidad-fisica');
    const movimientos = [];

    inputs.forEach(input => {
        const value = input.value.trim();
        const stockSistema = parseFloat(input.dataset.stockSistema) || 0;

        // Determinar cantidad física según tipo de toma
        let cantidadFisica = null;

        if (esTomaFisicaParcial) {
            // Toma parcial: solo procesa si tiene valor ingresado
            if (value === '') {
                return; // Salta este producto
            }
            cantidadFisica = parseFloat(value);
        } else {
            // Toma total: campos en blanco se asumen como 0
            cantidadFisica = value === '' ? 0 : parseFloat(value);
        }

        if (!isNaN(cantidadFisica) && cantidadFisica >= 0) {
            const diferencia = cantidadFisica - stockSistema;

            // Si hay diferencia, crear movimiento
            if (diferencia !== 0) {
                movimientos.push({
                    fecha: fecha,
                    ccosto: ccCosto,
                    codigo: input.dataset.codigo,
                    entrada: diferencia > 0 ? diferencia : 0,
                    salida: diferencia < 0 ? Math.abs(diferencia) : 0,
                    tipo: 'TOMA FISICA',
                    empresa: sesion.empresa,
                    observaciones: observaciones
                });
            }
        }
    });

    if (movimientos.length === 0) {
        alert('❌ Debe ingresar cantidades que generen diferencias');
        return;
    }

    const tipoToma = esTomaFisicaParcial ? 'Parcial' : 'Total';
    if (!confirm(`¿Confirmas registrar toma física ${tipoToma} con ${movimientos.length} movimiento(s)?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_TOMA}/inventario/movimientos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                movimientos: movimientos
            })
        });

        const data = await response.json();

        if (data.success) {
            alert(`✅ Toma física ${tipoToma} registrada exitosamente\n\nMovimientos: ${data.registros_creados}`);
            limpiarGridTomaFisica();
            cargarGridTomaFisica(); // Recargar grid
        } else {
            alert(`❌ Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error guardando toma física:', error);
        alert('❌ Error al registrar toma física');
    }
}
