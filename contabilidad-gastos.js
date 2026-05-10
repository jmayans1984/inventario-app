// ================================================================
// CONTABILIDAD - CREAR GASTOS
// ================================================================

const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api';

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
        const response = await fetch(`${API_BASE}/gastos/siguiente-codigo?empresa=${window.window.sesion.empresa}`);
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
            const select = document.getElementById('proveedor');
            select.innerHTML = '<option value="">Seleccione...</option>';
            
            data.proveedores.forEach(prov => {
                const option = document.createElement('option');
                option.value = prov.codigo;
                option.textContent = prov.nombre;
                select.appendChild(option);
            });
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
            const select = document.getElementById('cuenta');
            select.innerHTML = '<option value="">Seleccione...</option>';
            
            data.cuentas.forEach(cuenta => {
                const option = document.createElement('option');
                option.value = cuenta.codigo;
                option.textContent = cuenta.cuenta;
                select.appendChild(option);
            });
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
            const select = document.getElementById('ccosto');
            select.innerHTML = '<option value="">Seleccione...</option>';
            
            data.ccostos.forEach(cc => {
                const option = document.createElement('option');
                option.value = cc.codigo;
                option.textContent = cc.nombre;
                select.appendChild(option);
            });
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
            const select = document.getElementById('formaPago');
            select.innerHTML = '<option value="">Seleccione...</option>';
            
            data.cuentas.forEach(cuenta => {
                const option = document.createElement('option');
                option.value = cuenta.codigo;
                option.textContent = cuenta.nombre_cta;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando cuentas bancarias:', error);
        alert('❌ Error al cargar cuentas bancarias');
    }
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
