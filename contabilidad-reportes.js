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
            <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
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
            // Agrupar por cuenta contable
            const gastosPorCuenta = agruparPorCuenta(data.gastos);
            
            let html = '';
            let totalGeneral = 0;
            let cantidadTotal = 0;
            
            // Recorrer cada cuenta
            for (const [codigoCuenta, datosGrupo] of Object.entries(gastosPorCuenta)) {
                const nombreCuenta = datosGrupo.nombre;
                const gastosGrupo = datosGrupo.gastos;
                const totalCuenta = datosGrupo.total;
                const cantidadCuenta = gastosGrupo.length;
                
                totalGeneral += totalCuenta;
                cantidadTotal += cantidadCuenta;
                
                // Header de la cuenta
                html += `
                    <tr style="background-color: var(--bg-tertiary); font-weight: 600;">
                        <td colspan="6" style="padding: 0.75rem;">
                            📁 ${codigoCuenta} - ${nombreCuenta}
                            <span style="float: right;">
                                ${cantidadCuenta} registro${cantidadCuenta !== 1 ? 's' : ''} | Total: $${formatearNumero(totalCuenta)}
                            </span>
                        </td>
                    </tr>
                `;
                
                // Gastos de esta cuenta
                gastosGrupo.forEach(gasto => {
                    html += `
                        <tr>
                            <td style="font-family: var(--font-mono); font-size: 0.8rem;">${gasto.codigo}</td>
                            <td style="font-size: 0.8rem;">${formatearFecha(gasto.fecha)}</td>
                            <td style="font-size: 0.8rem;">${gasto.proveedor_nombre || gasto.proveedor}</td>
                            <td style="font-size: 0.8rem;">${gasto.concepto || '-'}</td>
                            <td style="font-size: 0.75rem;">${gasto.ccosto_nombre || gasto.ccosto}</td>
                            <td style="text-align: right; font-family: var(--font-mono); font-weight: 600; font-size: 0.85rem;">$${formatearNumero(gasto.total)}</td>
                        </tr>
                    `;
                });
            }
            
            gridBody.innerHTML = html;
            
            // Mostrar totales
            document.getElementById('totales').style.display = 'block';
            document.getElementById('totalGastos').textContent = `$${formatearNumero(totalGeneral)}`;
            document.getElementById('cantidadGastos').textContent = cantidadTotal;
            
        } else {
            gridBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
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
                <td colspan="6" style="text-align: center; padding: 3rem; color: var(--danger);">
                    ❌ Error al cargar el reporte
                </td>
            </tr>
        `;
        alert('❌ Error al cargar el reporte');
    }
}

// ================================================================
// AGRUPAR GASTOS POR CUENTA CONTABLE
// ================================================================

function agruparPorCuenta(gastos) {
    const grupos = {};
    
    gastos.forEach(gasto => {
        const codigoCuenta = gasto.cuenta;
        const nombreCuenta = gasto.cuenta_nombre || gasto.cuenta;
        
        if (!grupos[codigoCuenta]) {
            grupos[codigoCuenta] = {
                nombre: nombreCuenta,
                gastos: [],
                total: 0
            };
        }
        
        grupos[codigoCuenta].gastos.push(gasto);
        grupos[codigoCuenta].total += parseFloat(gasto.total || 0);
    });
    
    return grupos;
}

// ================================================================
// UTILIDADES
// ================================================================

function formatearFecha(fecha) {
    if (!fecha) return '-';
    
    // Si la fecha ya tiene formato YYYY-MM-DD
    const partes = fecha.split('-');
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    
    // Fallback: intentar parsear normalmente
    try {
        const date = new Date(fecha + 'T00:00:00');
        if (isNaN(date.getTime())) return fecha; // Si falla, devolver el string original
        
        return date.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        });
    } catch (e) {
        return fecha;
    }
}

function formatearNumero(numero) {
    const num = parseFloat(numero);
    return num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
