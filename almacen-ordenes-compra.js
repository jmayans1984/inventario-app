// ================================================================
// ALMACÉN - CREACIÓN DE ÓRDENES DE COMPRA
// ================================================================

const API_BASE_ORDENES = 'https://inventario-app-production-e8c8.up.railway.app/api';
let productosOrdenCompra = [];

// ================================================================
// CARGAR MÓDULO DE ÓRDENES DE COMPRA
// ================================================================

function cargarOrdenesCompra() {
    const contentDiv = document.getElementById('gestionContent');

    contentDiv.innerHTML = `
        <div class="table-container">
            <div class="filters-container">
                <div class="filter-group">
                    <label class="filter-label">Tipo de Precio *</label>
                    <select id="tipoPrecioOrden" onchange="cargarGridOrdenesCompra(); cargarDiasCreditoOrden()" class="filter-select">
                        <option value="">Seleccione...</option>
                        <option value="precio_venta1">Precio Venta 1</option>
                        <option value="precio_venta2">Precio Venta 2</option>
                        <option value="precio_venta3">Precio Venta 3</option>
                    </select>
                </div>

                <div class="filter-group">
                    <label class="filter-label">Fecha de Entrega</label>
                    <input type="date" id="fechaEntregaOrden" class="filter-input">
                </div>

                <div class="filter-group">
                    <label class="filter-label">Días de Crédito</label>
                    <input type="number" id="diasCreditoOrden" class="filter-input" min="0" value="0" readonly style="background-color: var(--bg-secondary); cursor: not-allowed;">
                </div>

                <div class="filter-group full-width">
                    <label class="filter-label">Observaciones</label>
                    <input type="text" id="observacionesOrden" class="filter-input" placeholder="Comentarios de la orden..." style="text-transform: uppercase;">
                </div>
            </div>

            <div style="overflow-x: auto;">
                <table class="grid-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Producto</th>
                            <th>Unidad</th>
                            <th style="text-align: right;">Precio Unitario</th>
                            <th style="text-align: right;">Cantidad</th>
                            <th style="text-align: right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody id="gridBodyOrdenesCompra">
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                                Seleccione tipo de precio para cargar productos
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div style="padding: 1.5rem; border-top: 2px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary);">
                    Total: <span id="totalOrden" style="color: var(--accent); font-family: 'JetBrains Mono', monospace;">0.00</span>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button class="btn btn-secondary" onclick="limpiarGridOrdenesCompra()">❌ Cancelar</button>
                    <button class="btn btn-primary" onclick="guardarOrdenCompra()">💾 Crear Orden</button>
                </div>
            </div>
        </div>
    `;

    cargarProductosOrdenesCompra();
}

// ================================================================
// CARGAR DÍAS DE CRÉDITO POR TIPO DE PRECIO
// ================================================================

async function cargarDiasCreditoOrden() {
    const tipoPrecio = document.getElementById('tipoPrecioOrden').value;

    if (!tipoPrecio) {
        document.getElementById('diasCreditoOrden').value = '0';
        return;
    }

    try {
        const tipoMapeado = tipoPrecio === 'precio_venta1' ? 'PRECIO1' :
                            tipoPrecio === 'precio_venta2' ? 'PRECIO2' : 'PRECIO3';

        const response = await fetch(`${API_BASE_ORDENES}/config-listas-precios/${tipoMapeado}`);
        const data = await response.json();

        if (data.success) {
            document.getElementById('diasCreditoOrden').value = data.dias_credito || 0;
        } else {
            document.getElementById('diasCreditoOrden').value = '0';
        }
    } catch (error) {
        console.error('Error cargando días de crédito:', error);
        document.getElementById('diasCreditoOrden').value = '0';
    }
}

// ================================================================
// CARGAR PRODUCTOS DISPONIBLES
// ================================================================

async function cargarProductosOrdenesCompra() {
    try {
        const response = await fetch(`${API_BASE_ORDENES}/productos-venta?control=SI`);
        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
            productosOrdenCompra = data.data.map(item => ({
                codigo: item.codigo,
                nombre: item.nombre,
                unidad: item.unidad || 'UN',
                precio_venta1: parseFloat(item.precio_venta1) || 0,
                precio_venta2: parseFloat(item.precio_venta2) || 0,
                precio_venta3: parseFloat(item.precio_venta3) || 0,
                grupo: item.grupo,
                grupo_nombre: item.grupo_nombre
            }));
        }
    } catch (error) {
        console.error('Error cargando productos:', error);
        alert('❌ Error al cargar productos');
    }
}

// ================================================================
// CARGAR GRID CON PRODUCTOS
// ================================================================

async function cargarGridOrdenesCompra() {
    const tipoPrecio = document.getElementById('tipoPrecioOrden').value;
    const gridBody = document.getElementById('gridBodyOrdenesCompra');

    if (!tipoPrecio) {
        gridBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    Seleccione tipo de precio para cargar productos
                </td>
            </tr>
        `;
        return;
    }

    if (productosOrdenCompra.length === 0) {
        gridBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    No se encontraron productos
                </td>
            </tr>
        `;
        return;
    }

    renderizarGridOrdenesCompra(productosOrdenCompra, tipoPrecio);
}

// ================================================================
// RENDERIZAR GRID
// ================================================================

function renderizarGridOrdenesCompra(productos, tipoPrecio) {
    const gridBody = document.getElementById('gridBodyOrdenesCompra');

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

    // Agrupar productos por grupo
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

    // Renderizar por grupo
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
                const precioUnitario = producto[tipoPrecio] || 0;

                html += `
                    <tr data-codigo="${producto.codigo}" style="border-bottom: 1px solid var(--border);">
                        <td style="font-family: 'JetBrains Mono', monospace; font-weight: 600; padding: 0.5rem 1rem;">${producto.codigo}</td>
                        <td style="padding: 0.5rem 1rem;">${producto.nombre}</td>
                        <td style="padding: 0.5rem 1rem;">${producto.unidad || '-'}</td>
                        <td style="text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 600; color: var(--text-secondary); padding: 0.5rem 1rem;">
                            ${formatearNumeroOrden(precioUnitario)}
                        </td>
                        <td style="text-align: right; padding: 0.5rem 1rem;">
                            <input
                                type="text"
                                class="input-cantidad-orden"
                                data-codigo="${producto.codigo}"
                                data-precio="${precioUnitario}"
                                placeholder=""
                                onblur="formatearInputOrden(this)"
                                oninput="calcularSubtotalOrden(this)"
                                onfocus="limpiarFormatoOrden(this)"
                                style="width: 80px; padding: 0.4rem; text-align: right;"
                            >
                        </td>
                        <td style="text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 600; padding: 0.5rem 1rem; color: var(--text-secondary);">
                            <span class="subtotal-orden" data-codigo="${producto.codigo}">0.00</span>
                        </td>
                    </tr>
                `;
            });
        });

    gridBody.innerHTML = html;
}

// ================================================================
// CALCULAR SUBTOTAL AL INGRESAR CANTIDAD
// ================================================================

function calcularSubtotalOrden(input) {
    const codigo = input.dataset.codigo;
    const precioUnitario = parseFloat(input.dataset.precio) || 0;
    const cantidad = parseFloat(input.value) || 0;
    const subtotal = cantidad * precioUnitario;

    const spanSubtotal = document.querySelector(`.subtotal-orden[data-codigo="${codigo}"]`);
    if (spanSubtotal) {
        spanSubtotal.textContent = formatearNumeroOrden(subtotal);
    }

    calcularTotalOrden();
}

// ================================================================
// CALCULAR TOTAL GENERAL
// ================================================================

function calcularTotalOrden() {
    const inputs = document.querySelectorAll('.input-cantidad-orden');
    let total = 0;

    inputs.forEach(input => {
        const cantidad = parseFloat(input.value) || 0;
        const precio = parseFloat(input.dataset.precio) || 0;
        total += cantidad * precio;
    });

    document.getElementById('totalOrden').textContent = formatearNumeroOrden(total);
}

// ================================================================
// FORMATEAR INPUT AL SALIR (onblur)
// ================================================================

function formatearInputOrden(input) {
    const value = input.value.trim();

    if (value === '') {
        input.value = '';
        calcularSubtotalOrden(input);
        return;
    }

    const numero = parseFloat(value);

    if (isNaN(numero)) {
        input.value = '';
        calcularSubtotalOrden(input);
        return;
    }

    // Formato con 2 decimales
    input.value = numero.toFixed(2);
    calcularSubtotalOrden(input);
}

// ================================================================
// LIMPIAR FORMATO AL ENTRAR (onfocus)
// ================================================================

function limpiarFormatoOrden(input) {
    // No hace nada, deja el valor tal cual para que el usuario lo edite
}

// ================================================================
// FORMATEAR NÚMERO PARA DISPLAY
// ================================================================

function formatearNumeroOrden(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
}

// ================================================================
// LIMPIAR GRID
// ================================================================

function limpiarGridOrdenesCompra() {
    const inputs = document.querySelectorAll('.input-cantidad-orden');
    inputs.forEach(input => {
        input.value = '';
        calcularSubtotalOrden(input);
    });
}

// ================================================================
// GUARDAR ORDEN DE COMPRA
// ================================================================

async function guardarOrdenCompra() {
    const tipoPrecio = document.getElementById('tipoPrecioOrden').value;
    const fechaEntrega = document.getElementById('fechaEntregaOrden').value;
    const diasCredito = parseInt(document.getElementById('diasCreditoOrden').value) || 0;
    const observaciones = document.getElementById('observacionesOrden').value.trim().toUpperCase();

    // Validar campos
    if (!tipoPrecio) {
        alert('❌ El tipo de precio es obligatorio');
        return;
    }

    // Recolectar productos con cantidad
    const inputs = document.querySelectorAll('.input-cantidad-orden');
    const detalles = [];

    inputs.forEach(input => {
        const value = input.value.trim();
        if (value !== '') {
            const cantidad = parseFloat(value);
            const precio = parseFloat(input.dataset.precio) || 0;

            if (!isNaN(cantidad) && cantidad > 0) {
                detalles.push({
                    producto_venta: input.dataset.codigo,
                    cantidad: cantidad,
                    precio_unitario: precio,
                    subtotal: cantidad * precio
                });
            }
        }
    });

    if (detalles.length === 0) {
        alert('❌ Debe ingresar al menos un producto con cantidad');
        return;
    }

    const total = detalles.reduce((sum, item) => sum + item.subtotal, 0);

    if (!confirm(`¿Confirmas crear orden de compra con ${detalles.length} producto(s) por ${formatearNumeroOrden(total)}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_ORDENES}/ordenes-compra/crear`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                empresa: sesion.empresa,
                tipo_precio: tipoPrecio,
                fecha_entrega: fechaEntrega || null,
                dias_credito: diasCredito,
                observaciones: observaciones,
                detalles: detalles,
                total: total
            })
        });

        const data = await response.json();

        if (data.success) {
            alert(`✅ Orden de compra creada exitosamente\n\nCódigo: ${data.codigo}\nProductos: ${detalles.length}\nTotal: ${formatearNumeroOrden(total)}`);
            limpiarGridOrdenesCompra();
            document.getElementById('tipoPrecioOrden').value = '';
            document.getElementById('fechaEntregaOrden').value = '';
            document.getElementById('diasCreditoOrden').value = '0';
            document.getElementById('observacionesOrden').value = '';
            document.getElementById('totalOrden').textContent = '0.00';
        } else {
            alert(`❌ Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error guardando orden:', error);
        alert('❌ Error al crear orden de compra');
    }
}
