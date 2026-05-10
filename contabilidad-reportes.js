// ================================================================
// CONTABILIDAD - REPORTE DE GASTOS
// ================================================================

const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api';

// Esperar a que header.js inicialice la sesión
window.addEventListener('load', () => {
    if (!window.sesion) {
        window.location.href = 'index.html';
        return;
    }
    
    // Continuar con la inicialización
    inicializarReporte();
});

// ================================================================
// INICIALIZACIÓN
// ================================================================

async function inicializarReporte() {
    // Establecer fechas del mes actual
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    document.getElementById('fechaInicial').value = primerDia.toISOString().split('T')[0];
    document.getElementById('fechaFinal').value = ultimoDia.toISOString().split('T')[0];
    
    // Cargar filtros
    await cargarCentrosCosto();
    await cargarCuentasContables();
}

// ================================================================
// CARGAR CENTROS DE COSTO
// ================================================================

async function cargarCentrosCosto() {
    try {
        const response = await fetch(`${API_BASE}/gastos/ccostos?empresa=${window.sesion.empresa}`);
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('centroCosto');
            select.innerHTML = '<option value="">Todos</option>';
            
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
        const response = await fetch(`${API_BASE}/gastos/cuentas-contables?empresa=${window.sesion.empresa}`);
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('cuentaContable');
            select.innerHTML = '<option value="">Todas</option>';
            
            data.cuentas.forEach(cuenta => {
                const option = document.createElement('option');
                option.value = cuenta.codigo;
                option.textContent = `${cuenta.codigo} - ${cuenta.cuenta}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando cuentas:', error);
    }
}

// ================================================================
// CARGAR REPORTE
// ================================================================

async function cargarReporte() {
    const fechaInicial = document.getElementById('fechaInicial').value;
    const fechaFinal = document.getElementById('fechaFinal').value;
    const centroCosto = document.getElementById('centroCosto').value;
    const cuentaContable = document.getElementById('cuentaContable').value;
    
    if (!fechaInicial || !fechaFinal) {
        alert('❌ Debes seleccionar las fechas');
        return;
    }
    
    const gridBody = document.getElementById('gridBody');
    gridBody.innerHTML = `
        <tr>
            <td colspan="11" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                Cargando...
            </td>
        </tr>
    `;
    
    try {
        let url = `${API_BASE}/gastos/reporte?empresa=${window.sesion.empresa}&fechaInicial=${fechaInicial}&fechaFinal=${fechaFinal}`;
        
        if (centroCosto) url += `&centroCosto=${centroCosto}`;
        if (cuentaContable) url += `&cuentaContable=${cuentaContable}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success && data.gastos.length > 0) {
            let html = '';
            let totalGeneral = 0;
            
            data.gastos.forEach(gasto => {
                totalGeneral += parseFloat(gasto.total || 0);
                
                html += `
                    <tr>
                        <td style="font-family: var(--font-mono); font-weight: 600;">${gasto.codigo}</td>
                        <td>${formatearFecha(gasto.fecha)}</td>
                        <td>${gasto.proveedor_nombre || gasto.proveedor}</td>
                        <td>${gasto.concepto || '-'}</td>
                        <td style="font-size: 0.85rem;">${gasto.cuenta_nombre || gasto.cuenta}</td>
                        <td>${gasto.factura || '-'}</td>
                        <td style="text-align: right; font-family: var(--font-mono);">$${formatearNumero(gasto.subtotal)}</td>
                        <td style="text-align: right; font-family: var(--font-mono);">$${formatearNumero(gasto.impuestos)}</td>
                        <td style="text-align: right; font-family: var(--font-mono); font-weight: 600;">$${formatearNumero(gasto.total)}</td>
                        <td style="font-size: 0.85rem;">${gasto.ccosto_nombre || gasto.ccosto}</td>
                        <td>
                            <span style="padding: 0.25rem 0.5rem; background-color: var(--${gasto.estado === 'PENDIENTE' ? 'warning' : 'success'}-light); color: var(--${gasto.estado === 'PENDIENTE' ? 'warning' : 'success'}); border-radius: 4px; font-size: 0.8rem; font-weight: 500;">
                                ${gasto.estado}
                            </span>
                        </td>
                    </tr>
                `;
            });
            
            gridBody.innerHTML = html;
            
            // Mostrar totales
            document.getElementById('totales').style.display = 'block';
            document.getElementById('totalGastos').textContent = `$${formatearNumero(totalGeneral)}`;
            document.getElementById('cantidadGastos').textContent = data.gastos.length;
            
        } else {
            gridBody.innerHTML = `
                <tr>
                    <td colspan="11" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                        No se encontraron gastos en el período seleccionado
                    </td>
                </tr>
            `;
            document.getElementById('totales').style.display = 'none';
        }
    } catch (error) {
        console.error('Error cargando reporte:', error);
        gridBody.innerHTML = `
            <tr>
                <td colspan="11" style="text-align: center; padding: 3rem; color: var(--danger);">
                    ❌ Error al cargar el reporte
                </td>
            </tr>
        `;
        alert('❌ Error al cargar el reporte');
    }
}

// ================================================================
// UTILIDADES
// ================================================================

function formatearFecha(fecha) {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    });
}

function formatearNumero(numero) {
    const num = parseFloat(numero);
    return num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
