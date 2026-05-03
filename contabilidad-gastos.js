// ================================================================
// CONTABILIDAD - MÓDULO GASTOS
// ================================================================

const API_BASE_GASTOS = 'https://inventario-app-production-e8c8.up.railway.app/api/gastos';

// ================================================================
// CARGAR DATOS INICIALES
// ================================================================

async function cargarDatosGastos() {
    try {
        await Promise.all([
            cargarProveedores(),
            cargarCCostos(),
            cargarCuentasContables(),
            cargarCuentasBancarias()
        ]);
    } catch (error) {
        console.error('Error cargando datos:', error);
        alert('❌ Error al cargar datos iniciales');
    }
}

// ================================================================
// CARGAR PROVEEDORES
// ================================================================

let proveedoresData = {}; // Guardar mapeo nombre -> codigo

async function cargarProveedores() {
    try {
        const response = await fetch(`${API_BASE_GASTOS}/proveedores?empresa=${sesion.empresa}`);
        const data = await response.json();
        
        const datalist = document.getElementById('listaProveedores');
        datalist.innerHTML = '';
        proveedoresData = {};
        
        if (data.success && data.proveedores) {
            data.proveedores.forEach(prov => {
                const option = document.createElement('option');
                option.value = prov.nombre;
                datalist.appendChild(option);
                
                // Guardar mapeo nombre -> codigo
                proveedoresData[prov.nombre] = prov.codigo;
            });
        }
    } catch (error) {
        console.error('Error cargando proveedores:', error);
    }
}

// ================================================================
// CARGAR CENTROS DE COSTO
// ================================================================

let ccostosData = {}; // Guardar mapeo nombre -> codigo

async function cargarCCostos() {
    try {
        const response = await fetch(`${API_BASE_GASTOS}/ccostos?empresa=${sesion.empresa}`);
        const data = await response.json();
        
        const datalist = document.getElementById('listaCCostos');
        datalist.innerHTML = '';
        ccostosData = {};
        
        if (data.success && data.ccostos) {
            data.ccostos.forEach(cc => {
                const option = document.createElement('option');
                option.value = cc.nombre;
                datalist.appendChild(option);
                
                // Guardar mapeo nombre -> codigo
                ccostosData[cc.nombre] = cc.codigo;
            });
        }
    } catch (error) {
        console.error('Error cargando centros de costo:', error);
    }
}

// ================================================================
// CARGAR CUENTAS CONTABLES
// ================================================================

let cuentasData = {}; // Guardar mapeo cuenta -> codigo

async function cargarCuentasContables() {
    try {
        const response = await fetch(`${API_BASE_GASTOS}/cuentas-contables?empresa=${sesion.empresa}`);
        const data = await response.json();
        
        const datalist = document.getElementById('listaCuentas');
        datalist.innerHTML = '';
        cuentasData = {};
        
        if (data.success && data.cuentas) {
            data.cuentas.forEach(cuenta => {
                const option = document.createElement('option');
                option.value = cuenta.cuenta;
                datalist.appendChild(option);
                
                // Guardar mapeo cuenta -> codigo
                cuentasData[cuenta.cuenta] = cuenta.codigo;
            });
        }
    } catch (error) {
        console.error('Error cargando cuentas contables:', error);
    }
}

// ================================================================
// CARGAR CUENTAS BANCARIAS (FORMA PAGO)
// ================================================================

let cuentasBancariasData = {}; // Guardar mapeo nombre_cta -> codigo

async function cargarCuentasBancarias() {
    try {
        const response = await fetch(`${API_BASE_GASTOS}/cuentas-bancarias?empresa=${sesion.empresa}`);
        const data = await response.json();
        
        const datalist = document.getElementById('listaFormaPago');
        datalist.innerHTML = '';
        cuentasBancariasData = {};
        
        if (data.success && data.cuentas) {
            data.cuentas.forEach(cta => {
                const option = document.createElement('option');
                option.value = cta.nombre_cta;
                datalist.appendChild(option);
                
                // Guardar mapeo nombre_cta -> codigo
                cuentasBancariasData[cta.nombre_cta] = cta.codigo;
            });
        }
    } catch (error) {
        console.error('Error cargando cuentas bancarias:', error);
    }
}

// ================================================================
// GUARDAR GASTO
// ================================================================

document.getElementById('formGasto').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Obtener valores
    const fecha = document.getElementById('fecha').value;
    const proveedorNombre = document.getElementById('proveedor').value.trim();
    const cCostoNombre = document.getElementById('ccosto').value.trim();
    const formaPagoNombre = document.getElementById('formaPago').value.trim();
    const cuentaNombre = document.getElementById('cuenta').value.trim();
    const concepto = document.getElementById('concepto').value.trim() || '';
    const subtotal = parseFloat(document.getElementById('subtotal').value) || 0;
    const impuestos = parseFloat(document.getElementById('impuestos').value) || 0;
    
    // Validar campos obligatorios PRIMERO
    if (!fecha) {
        alert('❌ La fecha es obligatoria');
        return;
    }
    
    if (!proveedorNombre) {
        alert('❌ El proveedor es obligatorio');
        return;
    }
    
    if (!cCostoNombre) {
        alert('❌ El centro de costo es obligatorio');
        return;
    }
    
    if (!formaPagoNombre) {
        alert('❌ La forma de pago es obligatoria');
        return;
    }
    
    if (!cuentaNombre) {
        alert('❌ La cuenta es obligatoria');
        return;
    }
    
    if (subtotal <= 0) {
        alert('❌ El valor base debe ser mayor a 0');
        return;
    }
    
    // Obtener códigos desde los mapeos
    const proveedorCodigo = proveedoresData[proveedorNombre];
    const ccostoCodigo = ccostosData[cCostoNombre];
    const cuentaCodigo = cuentasData[cuentaNombre];
    const codigoBanco = cuentasBancariasData[formaPagoNombre];
    
    // Validar que se encontraron los códigos
    if (!proveedorCodigo) {
        alert('❌ Proveedor no válido. Por favor selecciona uno de la lista.');
        return;
    }
    
    if (!ccostoCodigo) {
        alert('❌ Centro de Costo no válido. Por favor selecciona uno de la lista.');
        return;
    }
    
    if (!cuentaCodigo) {
        alert('❌ Cuenta no válida. Por favor selecciona una de la lista.');
        return;
    }
    
    if (!codigoBanco) {
        alert('❌ Forma de Pago no válida. Por favor selecciona una de la lista.');
        return;
    }
    
    const total = subtotal + impuestos;
    
    // Confirmar
    if (!confirm(`¿Confirmas crear el gasto por ${formatMoney(total)}?`)) {
        return;
    }
    
    // Preparar datos
    const datosGasto = {
        fecha: fecha,
        proveedor: proveedorCodigo,
        concepto: concepto,
        cuenta: cuentaCodigo,
        factura: document.getElementById('factura').value || null,
        subtotal: subtotal,
        impuestos: impuestos,
        total: total,
        ccosto: ccostoCodigo,
        forma_pago: formaPagoNombre,
        codigo_banco: codigoBanco,
        empresa: sesion.empresa
    };
    
    try {
        const response = await fetch(`${API_BASE_GASTOS}/crear`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosGasto)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`✅ Gasto creado exitosamente\n\n📄 Código Gasto: ${data.codigoGasto}\n🏦 Movimiento: ${data.numeroMovimiento}`);
            
            // Limpiar formulario
            document.getElementById('formGasto').reset();
            const hoy = new Date().toISOString().split('T')[0];
            document.getElementById('fecha').value = hoy;
            document.getElementById('totalDisplay').value = '$0.00';
        } else {
            alert(`❌ Error: ${data.error}`);
        }
        
    } catch (error) {
        console.error('Error guardando gasto:', error);
        alert('❌ Error al guardar el gasto');
    }
});
