// ================================================================
// TESORERÍA - MOVIMIENTOS BANCARIOS (GESTIÓN - CREAR)
// ================================================================

const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api';

function cargarFormMovimientos() {
    const contentDiv = document.getElementById('movimientosContent');
    
    const hoy = new Date().toISOString().split('T')[0];
    
    contentDiv.innerHTML = `
        <div style="background: var(--bg-card); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 1rem;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                <!-- FECHA -->
                <div>
                    <label style="display: block; margin-bottom: 0.4rem; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Fecha</label>
                    <input type="date" id="fechaMovimiento" value="${hoy}" style="width: 100%; padding: 0.7rem; background: var(--bg); border: 2px solid var(--border); border-radius: 6px; color: var(--text); font-size: 0.9rem;">
                </div>

                <!-- TIPO -->
                <div>
                    <label style="display: block; margin-bottom: 0.4rem; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Tipo</label>
                    <select id="tipoMovimiento" onchange="cambiarTipo()" style="width: 100%; padding: 0.7rem; background: var(--bg); border: 2px solid var(--border); border-radius: 6px; color: var(--text); font-size: 0.9rem;">
                        <option value="">-- Seleccione --</option>
                        <option value="ING">INGRESO</option>
                        <option value="EGR">EGRESO</option>
                        <option value="TRA">TRANSFERENCIA</option>
                    </select>
                </div>

                <!-- CUENTA ORIGEN -->
                <div>
                    <label style="display: block; margin-bottom: 0.4rem; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Cuenta Origen</label>
                    <select id="cuentaOrigen" style="width: 100%; padding: 0.7rem; background: var(--bg); border: 2px solid var(--border); border-radius: 6px; color: var(--text); font-size: 0.9rem;">
                        <option value="">Cargando...</option>
                    </select>
                </div>

                <!-- CUENTA DESTINO (solo transferencias) -->
                <div id="divCuentaDestino" style="display: none;">
                    <label style="display: block; margin-bottom: 0.4rem; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Cuenta Destino</label>
                    <select id="cuentaDestino" style="width: 100%; padding: 0.7rem; background: var(--bg); border: 2px solid var(--border); border-radius: 6px; color: var(--text); font-size: 0.9rem;">
                        <option value="">-- Seleccione --</option>
                    </select>
                </div>

                <!-- VALOR -->
                <div>
                    <label style="display: block; margin-bottom: 0.4rem; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Valor</label>
                    <input type="number" id="valorMovimiento" step="0.01" min="0" value="0.00" style="width: 100%; padding: 0.7rem; background: var(--bg); border: 2px solid var(--border); border-radius: 6px; color: var(--text); font-size: 0.9rem; font-family: 'Courier New', monospace; font-weight: 600; text-align: right;">
                </div>
            </div>

            <!-- CONCEPTO -->
            <div>
                <label style="display: block; margin-bottom: 0.4rem; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Concepto</label>
                <input type="text" id="conceptoMovimiento" placeholder="Descripción del movimiento" style="width: 100%; padding: 0.7rem; background: var(--bg); border: 2px solid var(--border); border-radius: 6px; color: var(--text); font-size: 0.9rem; text-transform: uppercase;" onchange="this.value = this.value.toUpperCase()">
            </div>
        </div>

        <!-- BOTÓN GUARDAR -->
        <div style="text-align: right;">
            <button onclick="guardarMovimiento()" style="padding: 1rem 2rem; background: var(--success); color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 700; cursor: pointer; text-transform: uppercase; transition: all 0.3s;">
                💾 Guardar Movimiento
            </button>
        </div>
    `;

    cargarCuentasBancarias();
}

async function cargarCuentasBancarias() {
    try {
        const response = await fetch(`${API_BASE}/cuentas-bancarias?empresa=${sesion.empresa}`);
        const data = await response.json();

        if (data.success) {
            const selectOrigen = document.getElementById('cuentaOrigen');
            const selectDestino = document.getElementById('cuentaDestino');
            
            let html = '<option value="">-- Seleccione una cuenta --</option>';
            data.data.forEach(cuenta => {
                html += `<option value="${cuenta.codigo}">${cuenta.nombre_cta}</option>`;
            });
            
            selectOrigen.innerHTML = html;
            selectDestino.innerHTML = html;
        }
    } catch (error) {
        console.error('Error cargando cuentas:', error);
    }
}

function cambiarTipo() {
    const tipo = document.getElementById('tipoMovimiento').value;
    const divDestino = document.getElementById('divCuentaDestino');
    
    if (tipo === 'TRA') {
        divDestino.style.display = 'block';
    } else {
        divDestino.style.display = 'none';
    }
}

async function guardarMovimiento() {
    const fecha = document.getElementById('fechaMovimiento').value;
    const tipo = document.getElementById('tipoMovimiento').value;
    const cuentaOrigen = document.getElementById('cuentaOrigen').value;
    const cuentaDestino = document.getElementById('cuentaDestino').value;
    const valor = parseFloat(document.getElementById('valorMovimiento').value);
    const concepto = document.getElementById('conceptoMovimiento').value.trim();

    // VALIDACIONES
    if (!tipo) {
        alert('❌ Debe seleccionar un tipo de movimiento');
        return;
    }

    if (!cuentaOrigen) {
        alert('❌ Debe seleccionar una cuenta origen');
        return;
    }

    if (tipo === 'TRA' && !cuentaDestino) {
        alert('❌ Debe seleccionar una cuenta destino para transferencias');
        return;
    }

    if (valor <= 0) {
        alert('❌ El valor debe ser mayor a cero');
        return;
    }

    if (!concepto) {
        alert('❌ Debe ingresar un concepto');
        return;
    }

    if (tipo === 'TRA' && cuentaOrigen === cuentaDestino) {
        alert('❌ La cuenta origen y destino no pueden ser la misma');
        return;
    }

    if (!confirm(`¿Confirmar ${tipo === 'ING' ? 'INGRESO' : tipo === 'EGR' ? 'EGRESO' : 'TRANSFERENCIA'} por $${valor.toLocaleString('es-CO')}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/movimientos-bancarios/crear`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fecha,
                tipo,
                cuenta_origen: cuentaOrigen,
                cuenta_destino: cuentaDestino || null,
                valor,
                concepto,
                empresa: sesion.empresa
            })
        });

        const data = await response.json();

        if (data.success) {
            alert(`✅ ${data.message}`);
            limpiarFormMovimientos();
        } else {
            alert(`❌ Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error guardando movimiento:', error);
        alert('❌ Error al guardar el movimiento');
    }
}

function limpiarFormMovimientos() {
    document.getElementById('fechaMovimiento').value = new Date().toISOString().split('T')[0];
    document.getElementById('tipoMovimiento').value = '';
    document.getElementById('cuentaOrigen').value = '';
    document.getElementById('cuentaDestino').value = '';
    document.getElementById('valorMovimiento').value = '0.00';
    document.getElementById('conceptoMovimiento').value = '';
    document.getElementById('divCuentaDestino').style.display = 'none';
}
