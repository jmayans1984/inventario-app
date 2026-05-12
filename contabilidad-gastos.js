// ================================================================
// CONTABILIDAD - CREAR GASTOS
// ================================================================

const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api';

// Almacenar datos para autocomplete
let autosearchData = {
    proveedores: [],
    ccostos: [],
    formaPago: [],
    cuentas: []
};

// Esperar a que header.js inicialice la sesión
window.addEventListener('load', () => {
    if (!window.sesion) {
        window.location.href = 'index.html';
        return;
    }

    // Continuar con la inicialización
    inicializarFormulario();
});

// ================================================================
// INICIALIZACIÓN DEL FORMULARIO
// ================================================================

async function inicializarFormulario() {
    // Establecer fecha de hoy
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = hoy;
    
    // Cargar datos
    await cargarSiguienteCodigo();
    await cargarProveedores();
    await cargarCuentasContables();
    await cargarCentrosCosto();
    await cargarCuentasBancarias();
}

// ================================================================
// CARGAR SIGUIENTE CÓDIGO
// ================================================================

async function cargarSiguienteCodigo() {
    try {
        const response = await fetch(`${API_BASE}/gastos/siguiente-codigo?empresa=${window.sesion.empresa}`);
        const data = await response.json();

        if (data.success) {
            document.getElementById('codigoGasto').value = data.codigo;
        }
    } catch (error) {
        console.error('Error cargando código:', error);
    }
}

// ================================================================
// CARGAR PROVEEDORES
// ================================================================

async function cargarProveedores() {
    try {
        const response = await fetch(`${API_BASE}/gastos/proveedores?empresa=${window.sesion.empresa}`);
        const data = await response.json();

        if (data.success) {
            autosearchData.proveedores = data.proveedores;
            inicializarAutocomplete('proveedor', 'proveedores', 'nombre', 'codigo');
        }
    } catch (error) {
        console.error('Error cargando proveedores:', error);
        alert('❌ Error al cargar proveedores');
    }
}

// ================================================================
// CARGAR CUENTAS CONTABLES
// ================================================================

async function cargarCuentasContables() {
    try {
        const response = await fetch(`${API_BASE}/gastos/cuentas-contables?empresa=${window.sesion.empresa}`);
        const data = await response.json();

        if (data.success) {
            autosearchData.cuentas = data.cuentas;
            inicializarAutocomplete('cuenta', 'cuentas', 'cuenta', 'codigo');
        }
    } catch (error) {
        console.error('Error cargando cuentas:', error);
        alert('❌ Error al cargar cuentas contables');
    }
}

// ================================================================
// CARGAR CENTROS DE COSTO
// ================================================================

async function cargarCentrosCosto() {
    try {
        const response = await fetch(`${API_BASE}/gastos/ccostos?empresa=${window.sesion.empresa}`);
        const data = await response.json();

        if (data.success) {
            autosearchData.ccostos = data.ccostos;
            inicializarAutocomplete('ccosto', 'ccostos', 'nombre', 'codigo');
        }
    } catch (error) {
        console.error('Error cargando centros de costo:', error);
        alert('❌ Error al cargar centros de costo');
    }
}

// ================================================================
// CARGAR CUENTAS BANCARIAS
// ================================================================

async function cargarCuentasBancarias() {
    try {
        const response = await fetch(`${API_BASE}/gastos/cuentas-bancarias?empresa=${window.sesion.empresa}`);
        const data = await response.json();

        if (data.success) {
            autosearchData.formaPago = data.cuentas;
            inicializarAutocomplete('formaPago', 'formaPago', 'nombre_cta', 'codigo');
        }
    } catch (error) {
        console.error('Error cargando cuentas bancarias:', error);
        alert('❌ Error al cargar cuentas bancarias');
    }
}

// ================================================================
// AUTOCOMPLETE FUNCTIONALITY
// ================================================================

function inicializarAutocomplete(fieldId, dataKey, displayField, valueField) {
    const inputId = fieldId + 'Input';
    const dropdownId = fieldId + 'Dropdown';

    const inputElement = document.getElementById(inputId);
    const hiddenElement = document.getElementById(fieldId);
    const dropdownElement = document.getElementById(dropdownId);

    if (!inputElement) return;

    // Input event para filtrar
    inputElement.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toUpperCase();
        const data = autosearchData[dataKey] || [];

        if (searchTerm.length === 0) {
            dropdownElement.classList.remove('show');
            dropdownElement.innerHTML = '';
            return;
        }

        const filtered = data.filter(item => {
            const displayValue = String(item[displayField]).toUpperCase();
            return displayValue.includes(searchTerm);
        });

        mostrarResultados(filtered, dropdownElement, displayField, valueField, inputElement, hiddenElement, dropdownElement);
    });

    // Hacer la entrada requerida basada en el campo oculto
    inputElement.addEventListener('blur', () => {
        if (!hiddenElement.value) {
            inputElement.value = '';
        }
    });

    // Cerrar dropdown cuando se hace click fuera
    document.addEventListener('click', (e) => {
        if (!inputElement.contains(e.target) && !dropdownElement.contains(e.target)) {
            dropdownElement.classList.remove('show');
        }
    });

    // Mostrar todos los items si el input se enfoca y está vacío
    inputElement.addEventListener('focus', () => {
        if (inputElement.value.length === 0) {
            const data = autosearchData[dataKey] || [];
            mostrarResultados(data.slice(0, 20), dropdownElement, displayField, valueField, inputElement, hiddenElement, dropdownElement);
        }
    });
}

function mostrarResultados(items, dropdownElement, displayField, valueField, inputElement, hiddenElement, dropdownElement) {
    if (items.length === 0) {
        dropdownElement.innerHTML = '<div class="autocomplete-no-results">Sin resultados</div>';
        dropdownElement.classList.add('show');
        return;
    }

    dropdownElement.innerHTML = items.map(item => `
        <div class="autocomplete-item" data-value="${item[valueField]}" data-display="${item[displayField]}">
            ${item[displayField]}
        </div>
    `).join('');

    dropdownElement.classList.add('show');

    // Agregar event listeners a los items
    dropdownElement.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
            const value = item.getAttribute('data-value');
            const display = item.getAttribute('data-display');

            hiddenElement.value = value;
            inputElement.value = display;
            dropdownElement.classList.remove('show');
        });

        item.addEventListener('mouseover', () => {
            dropdownElement.querySelectorAll('.autocomplete-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
        });
    });
}

// ================================================================
// CALCULAR TOTAL
// ================================================================

function calcularTotal() {
    const subtotal = parseFloat(document.getElementById('subtotal').value) || 0;
    const impuestos = parseFloat(document.getElementById('impuestos').value) || 0;
    const total = subtotal + impuestos;
    
    document.getElementById('total').value = total.toFixed(2);
}

// ================================================================
// GUARDAR GASTO
// ================================================================

document.getElementById('formGasto').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const datos = {
        fecha: document.getElementById('fecha').value,
        proveedor: document.getElementById('proveedor').value,
        concepto: document.getElementById('concepto').value,
        cuenta: document.getElementById('cuenta').value,
        factura: document.getElementById('factura').value,
        subtotal: parseFloat(document.getElementById('subtotal').value),
        impuestos: parseFloat(document.getElementById('impuestos').value) || 0,
        total: parseFloat(document.getElementById('total').value),
        ccosto: document.getElementById('ccosto').value,
        forma_pago: document.getElementById('formaPago').value,
        codigo_banco: document.getElementById('formaPago').value,
        empresa: window.sesion.empresa
    };
    
    if (!confirm(`¿Confirmar gasto por $${datos.total.toLocaleString()}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/gastos/crear`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`✅ Gasto creado exitosamente\n\nCódigo: ${data.codigoGasto}\nMovimiento: ${data.numeroMovimiento}`);
            window.location.href = 'contabilidad.html';
        } else {
            alert(`❌ Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error guardando gasto:', error);
        alert('❌ Error al guardar el gasto');
    }
});
