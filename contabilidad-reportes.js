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
            
            // Ordenar alfabéticamente por nombre de cuenta
            const cuentasOrdenadas = Object.entries(gastosPorCuenta).sort((a, b) => {
                return a[1].nombre.localeCompare(b[1].nombre);
            });
            
            let html = '';
            let totalGeneral = 0;
            let cantidadTotal = 0;
            
            // Recorrer cada cuenta
            cuentasOrdenadas.forEach(([codigoCuenta, datosGrupo], index) => {
                const nombreCuenta = datosGrupo.nombre;
                const gastosGrupo = datosGrupo.gastos;
                const totalCuenta = datosGrupo.total;
                const cantidadCuenta = gastosGrupo.length;
                
                totalGeneral += totalCuenta;
                cantidadTotal += cantidadCuenta;
                
                const grupoId = `grupo-${index}`;
                
                // Header de la cuenta (clickeable para expandir/colapsar)
                html += `
                    <tr style="background-color: var(--bg-tertiary); font-weight: 600; cursor: pointer;" onclick="toggleGrupo('${grupoId}')">
                        <td colspan="6" style="padding: 0.75rem;">
                            <span id="icono-${grupoId}" style="display: inline-block; width: 20px; transition: transform 0.2s;">▶</span>
                            📁 ${nombreCuenta}
                            <span style="float: right;">
                                ${cantidadCuenta} registro${cantidadCuenta !== 1 ? 's' : ''} | Total: $${formatearNumero(totalCuenta)}
                            </span>
                        </td>
                    </tr>
                `;
                
                // Contenedor de gastos (oculto por defecto)
                html += `<tbody id="${grupoId}" style="display: none;">`;
                
                // Gastos de esta cuenta
                gastosGrupo.forEach(gasto => {
                    html += `
                        <tr>
                            <td style="font-family: var(--font-mono); font-size: 0.8rem; padding-left: 2rem;">${gasto.codigo}</td>
                            <td style="font-size: 0.8rem;">${formatearFecha(gasto.fecha)}</td>
                            <td style="font-size: 0.8rem;">${gasto.proveedor_nombre || gasto.proveedor}</td>
                            <td style="font-size: 0.8rem;">${gasto.concepto || '-'}</td>
                            <td style="font-size: 0.75rem;">${gasto.ccosto_nombre || gasto.ccosto}</td>
                            <td style="text-align: right; font-family: var(--font-mono); font-weight: 600; font-size: 0.85rem;">$${formatearNumero(gasto.total)}</td>
                        </tr>
                    `;
                });
                
                html += `</tbody>`;
            });
            
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
// TOGGLE GRUPO (EXPANDIR/COLAPSAR)
// ================================================================

function toggleGrupo(grupoId) {
    const grupo = document.getElementById(grupoId);
    const icono = document.getElementById(`icono-${grupoId}`);
    
    if (grupo.style.display === 'none') {
        grupo.style.display = 'table-row-group';
        icono.textContent = '▼';
    } else {
        grupo.style.display = 'none';
        icono.textContent = '▶';
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
    
    try {
        // Extraer solo la parte YYYY-MM-DD del string (ignorar la hora)
        let fechaLimpia = fecha;
        
        // Si tiene formato ISO (con T y Z), extraer solo la fecha
        if (fecha.includes('T')) {
            fechaLimpia = fecha.split('T')[0];
        }
        
        // Separar por guiones: YYYY-MM-DD
        const partes = fechaLimpia.split('-');
        
        if (partes.length === 3) {
            const año = partes[0];
            const mes = partes[1];
            const dia = partes[2];
            
            // Retornar en formato MM/DD/YYYY
            return `${mes}/${dia}/${año}`;
        }
        
        return fecha; // Si no se pudo parsear, devolver original
        
    } catch (e) {
        console.error('Error formateando fecha:', fecha, e);
        return fecha;
    }
}

function formatearNumero(numero) {
    const num = parseFloat(numero);
    
    // Formato: 1.000,05 (punto para miles, coma para decimales)
    return num.toLocaleString('es-ES', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });
}
