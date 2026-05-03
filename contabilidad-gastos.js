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
            cargarCuentasBancarias(),
            generarCodigoGasto()
        ]);
    } catch (error) {
        console.error('Error cargando datos:', error);
        alert('❌ Error al cargar datos iniciales');
    }
}

// ================================================================
// CARGAR PROVEEDORES
// ================================================================

async function cargarProveedores() {
    try {
        const response = await fetch(`${API_BASE_GASTOS}/proveedores?empresa=${sesion.empresa}`);
        const data = await response.json();
        
        const select = document.getElementById('proveedor');
        select.innerHTML = '<option value="">Seleccione...</option>';
        
        if (data.success && data.proveedores) {
            data.proveedores.forEach(prov => {
                const option = document.createElement('option');
                option.value = prov.codigo;
                option.textContent = `${prov.codigo} - ${prov.nombre}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando proveedores:', error);
    }
}

// ================================================================
// CARGAR CENTROS DE COSTO
// ================================================================

async function cargarCCostos() {
    try {
        const response = await fetch(`${API_BASE_GASTOS}/ccostos?empresa=${sesion.empresa}`);
        const data = await response.json();
        
        const select = document.getElementById('ccosto');
        select.innerHTML = '<option value="">Seleccione...</option>';
        
        if (data.success && data.ccostos) {
            data.ccostos.forEach(cc => {
                const option = document.createElement('option');
                option.value = cc.codigo;
                option.textContent = `${cc.codigo} - ${cc.nombre}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando centros de costo:', error);
    }
}

// ================================================================
// CARGAR CUENTAS CONTABLES
// ================================================================

async function cargarCuentasContables() {
    try {
        const response = await fetch(`${API_BASE_GASTOS}/cuentas-contables?empresa=${sesion.empresa}`);
        const data = await response.json();
        
        const select = document.getElementById('cuenta');
        select.innerHTML = '<option value="">Seleccione...</option>';
        
        if (data.success && data.cuentas) {
            data.cuentas.forEach(cuenta => {
                const option = document.createElement('option');
                option.value = cuenta.codigo;
                option.textContent = `${cuenta.codigo} - ${cuenta.cuenta}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando cuentas contables:', error);
    }
}

// ================================================================
// CARGAR CUENTAS BANCARIAS (FORMA PAGO)
// ================================================================

async function cargarCuentasBancarias() {
    try {
        const response = await fetch(`${API_BASE_GASTOS}/cuentas-bancarias?empresa=${sesion.empresa}`);
        const data = await response.json();
        
        const select = document.getElementById('formaPago');
        select.innerHTML = '<option value="">Seleccione...</option>';
        
        if (data.success && data.cuentas) {
            data.cuentas.forEach(cta => {
                const option = document.createElement('option');
                option.value = cta.nombre_cta;
                option.textContent = `${cta.nombre_banco} - ${cta.nombre_cta}`;
                option.dataset.codigoBanco = cta.codigo; // Guardar código para el moviban
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando cuentas bancarias:', error);
    }
}

// ================================================================
// GENERAR CÓDIGO GASTO
// ================================================================

async function generarCodigoGasto() {
    try {
        const response = await fetch(`${API_BASE_GASTOS}/siguiente-codigo?empresa=${sesion.empresa}`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('codigo').value = data.codigo;
        }
    } catch (error) {
        console.error('Error generando código:', error);
    }
}

// ================================================================
// GUARDAR GASTO
// ================================================================

document.getElementById('formGasto').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validar campos
    const fecha = document.getElementById('fecha').value;
    const proveedor = document.getElementById('proveedor').value;
    const concepto = document.getElementById('concepto').value;
    const cuenta = document.getElementById('cuenta').value;
    const ccosto = document.getElementById('ccosto').value;
    const formaPago = document.getElementById('formaPago').value;
    const subtotal = parseFloat(document.getElementById('subtotal').value) || 0;
    const impuestos = parseFloat(document.getElementById('impuestos').value) || 0;
    
    if (!proveedor || !concepto || !cuenta || !ccosto || !formaPago) {
        alert('❌ Por favor completa todos los campos obligatorios (*)');
        return;
    }
    
    if (subtotal <= 0) {
        alert('❌ El valor base debe ser mayor a 0');
        return;
    }
    
    const total = subtotal + impuestos;
    
    // Obtener código del banco desde el option seleccionado
    const selectFormaPago = document.getElementById('formaPago');
    const optionSeleccionada = selectFormaPago.options[selectFormaPago.selectedIndex];
    const codigoBanco = optionSeleccionada.dataset.codigoBanco;
    
    // Confirmar
    if (!confirm(`¿Confirmas crear el gasto por ${formatMoney(total)}?`)) {
        return;
    }
    
    // Preparar datos
    const datosGasto = {
        fecha: fecha,
        proveedor: proveedor,
        concepto: concepto,
        cuenta: cuenta,
        factura: document.getElementById('factura').value || null,
        subtotal: subtotal,
        impuestos: impuestos,
        total: total,
        ccosto: ccosto,
        forma_pago: formaPago,
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
            alert(`✅ Gasto creado exitosamente\n\nCódigo Gasto: ${data.codigoGasto}\nMovimiento: ${data.numeroMovimiento}`);
            
            // Limpiar formulario
            document.getElementById('formGasto').reset();
            const hoy = new Date().toISOString().split('T')[0];
            document.getElementById('fecha').value = hoy;
            document.getElementById('totalDisplay').textContent = '$0.00';
            
            // Generar nuevo código
            generarCodigoGasto();
        } else {
            alert(`❌ Error: ${data.error}`);
        }
        
    } catch (error) {
        console.error('Error guardando gasto:', error);
        alert('❌ Error al guardar el gasto');
    }
});
