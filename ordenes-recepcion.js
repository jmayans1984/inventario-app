// ================================================================
// RECEPCIÓN DE ÓRDENES DE COMPRA
// Subir soportes de entrega y marcar órdenes como recibidas
// ================================================================

const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api';
let sesion = JSON.parse(localStorage.getItem('sesion'));
let ordenActual = null;

if (!sesion || !sesion.empresa) {
    alert('❌ No has iniciado sesión');
    window.location.href = 'index.html';
}

// ================================================================
// CARGAR ÓRDENES PENDIENTES
// ================================================================

async function cargarOrdenes() {
    try {
        let url;
        
        // Si es PROVEEDOR: ver TODAS las órdenes de TODOS los clientes
        if (sesion.tipo_empresa === 'PROVEEDOR') {
            url = `${API_BASE}/ordenes-compra/todas?estado=PENDIENTE`;
        } else {
            // Si es CLIENTE: ver solo SUS órdenes
            url = `${API_BASE}/ordenes-compra?empresa=${sesion.empresa}&estado=PENDIENTE`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success && data.data) {
            renderizarOrdenes(data.data);
        } else {
            document.getElementById('ordenesGrid').innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                    No hay órdenes pendientes de recepción
                </div>
            `;
        }
    } catch (error) {
        console.error('Error cargando órdenes:', error);
        alert('❌ Error al cargar órdenes');
    }
}

// ================================================================
// RENDERIZAR ÓRDENES
// ================================================================

function renderizarOrdenes(ordenes) {
    const grid = document.getElementById('ordenesGrid');
    
    let html = '';
    ordenes.forEach(orden => {
        const fechaFormat = formatearFecha(orden.fecha);
        const estadoClass = orden.estado === 'PENDIENTE' ? 'estado-pendiente' : 'estado-recibida';
        
        html += `
            <div class="orden-card" onclick="verDetalleOrden('${orden.codigo}')">
                <div class="orden-header">
                    <div class="orden-codigo">${orden.codigo}</div>
                    <div class="orden-estado ${estadoClass}">${orden.estado}</div>
                </div>
                <div class="orden-info">
                    <div class="orden-info-row">
                        <span class="orden-info-label">Fecha:</span>
                        <span class="orden-info-value">${fechaFormat}</span>
                    </div>`;
        
        // Si es PROVEEDOR, mostrar el nombre del cliente
        if (sesion.tipo_empresa === 'PROVEEDOR') {
            html += `
                    <div class="orden-info-row">
                        <span class="orden-info-label">Cliente:</span>
                        <span class="orden-info-value">${orden.empresa_nombre || orden.cliente || '-'}</span>
                    </div>`;
        }
        
        html += `
                    <div class="orden-info-row">
                        <span class="orden-info-label">Total:</span>
                        <span class="orden-info-value" style="color: var(--success);">${formatearMoneda(orden.total)}</span>
                    </div>
                </div>
                <div class="orden-actions">
                    <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); verDetalleOrden('${orden.codigo}')">
                        📋 Ver Detalle
                    </button>
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

// ================================================================
// VER DETALLE DE ORDEN
// ================================================================

async function verDetalleOrden(codigo) {
    ordenActual = codigo;
    
    try {
        const response = await fetch(`${API_BASE}/ordenes-compra/${codigo}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            const orden = data.data;
            
            // Construir información general
            let infoHTML = `
                <div style="margin-bottom: 0.75rem;">
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">FECHA</div>
                    <div style="font-weight: 600;">${formatearFecha(orden.fecha)}</div>
                </div>`;
            
            // Si es PROVEEDOR, mostrar el nombre del cliente
            if (sesion.tipo_empresa === 'PROVEEDOR') {
                infoHTML += `
                <div style="margin-bottom: 0.75rem;">
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">CLIENTE</div>
                    <div style="font-weight: 600;">${orden.empresa_nombre || orden.cliente || '-'}</div>
                </div>`;
            }
            
            infoHTML += `
                <div style="margin-bottom: 0.75rem;">
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">TOTAL</div>
                    <div style="font-weight: 700; font-size: 1.3rem; color: var(--success);">${formatearMoneda(orden.total)}</div>
                </div>
                <div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">ESTADO</div>
                    <div style="font-weight: 700; color: var(--warning);">${orden.estado}</div>
                </div>
            `;
            
            // Llenar información general
            document.getElementById('modalOrdenCodigo').textContent = codigo;
            document.getElementById('infoGeneral').innerHTML = infoHTML;
            
            // Cargar productos
            cargarProductosOrden(codigo);
            
            // Cargar soporte si existe
            cargarSoporteEntrega(codigo);
            
            // Mostrar modal
            document.getElementById('modalDetalle').classList.add('active');
        }
    } catch (error) {
        console.error('Error cargando detalle:', error);
        alert('❌ Error al cargar detalle de la orden');
    }
}

// ================================================================
// CARGAR PRODUCTOS DE LA ORDEN
// ================================================================

async function cargarProductosOrden(codigo) {
    try {
        const response = await fetch(`${API_BASE}/ordenes-compra/${codigo}/detalle`);
        const data = await response.json();
        
        if (data.success && data.data) {
            let html = '';
            data.data.forEach(item => {
                html += `
                    <tr>
                        <td style="font-family: 'JetBrains Mono', monospace; font-weight: 600;">${item.producto_venta}</td>
                        <td>${item.nombre_producto || item.producto_venta}</td>
                        <td style="text-align: right; font-family: 'JetBrains Mono', monospace;">${item.cantidad}</td>
                        <td style="text-align: right; font-family: 'JetBrains Mono', monospace;">${formatearMoneda(item.precio_unitario)}</td>
                        <td style="text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 700;">${formatearMoneda(item.subtotal)}</td>
                    </tr>
                `;
            });
            
            document.getElementById('tablaProductos').innerHTML = html;
        }
    } catch (error) {
        console.error('Error cargando productos:', error);
    }
}

// ================================================================
// CARGAR SOPORTE DE ENTREGA SI EXISTE
// ================================================================

async function cargarSoporteEntrega(codigo) {
    try {
        const response = await fetch(`${API_BASE}/soportes-entrega/${codigo}`);
        const data = await response.json();
        
        const soporteDiv = document.getElementById('soporteActual');
        
        if (data.success && data.data) {
            soporteDiv.innerHTML = `
                <div style="margin-top: 1rem; padding: 1rem; background: var(--bg); border-radius: 8px; border: 1px solid var(--success);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 700; color: var(--success); margin-bottom: 0.25rem;">✅ Soporte Cargado</div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary);">${data.data.nombre_archivo}</div>
                        </div>
                        <button class="btn btn-primary" onclick="verSoporte('${codigo}')">👁️ Ver</button>
                    </div>
                </div>
            `;
        } else {
            soporteDiv.innerHTML = '';
        }
    } catch (error) {
        console.error('Error cargando soporte:', error);
    }
}

// ================================================================
// VER SOPORTE EXISTENTE
// ================================================================

async function verSoporte(codigo) {
    try {
        const response = await fetch(`${API_BASE}/soportes-entrega/${codigo}/archivo`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    } catch (error) {
        console.error('Error abriendo soporte:', error);
        alert('❌ Error al abrir soporte');
    }
}

// ================================================================
// SUBIR SOPORTE DE ENTREGA
// ================================================================

async function subirSoporte(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validar tamaño
    if (file.size > 10 * 1024 * 1024) {
        alert('❌ El archivo no puede superar 10MB');
        return;
    }
    
    try {
        // Leer archivo
        const arrayBuffer = await file.arrayBuffer();
        
        if (file.type === 'application/pdf') {
            // Para PDF, convertir a base64 directamente
            const base64 = arrayBufferToBase64(arrayBuffer);
            await enviarSoporteAlServidor(base64, file.name, file.type);
        } else {
            // Para imágenes, procesar (B&N + compresión) y convertir a base64
            const base64 = await procesarImagenYConvertirBase64(arrayBuffer);
            await enviarSoporteAlServidor(base64, file.name, 'image/jpeg');
        }
    } catch (error) {
        console.error('Error subiendo soporte:', error);
        alert('❌ Error al subir soporte');
    }
}

// ================================================================
// CONVERTIR ARRAYBUFFER A BASE64
// ================================================================

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return 'data:application/pdf;base64,' + btoa(binary);
}

// ================================================================
// PROCESAR IMAGEN Y CONVERTIR A BASE64
// ================================================================

async function procesarImagenYConvertirBase64(arrayBuffer) {
    return new Promise((resolve, reject) => {
        const blob = new Blob([arrayBuffer]);
        const url = URL.createObjectURL(blob);
        const img = new Image();
        
        img.onload = () => {
            const canvas = document.getElementById('preview');
            const ctx = canvas.getContext('2d');
            
            // Calcular dimensiones (máximo 1200px de ancho)
            let width = img.width;
            let height = img.height;
            const maxWidth = 1200;
            
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Dibujar imagen
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convertir a escala de grises
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                data[i] = gray;
                data[i + 1] = gray;
                data[i + 2] = gray;
            }
            
            ctx.putImageData(imageData, 0, 0);
            
            // Convertir a base64 JPEG con 70% calidad
            const base64 = canvas.toDataURL('image/jpeg', 0.7);
            resolve(base64);
            
            URL.revokeObjectURL(url);
        };
        
        img.onerror = reject;
        img.src = url;
    });
}

// ================================================================
// ENVIAR SOPORTE AL SERVIDOR
// ================================================================

async function enviarSoporteAlServidor(base64, nombreArchivo, tipoArchivo) {
    try {
        console.log('=== ENVIANDO SOPORTE ===');
        console.log('Orden:', ordenActual);
        console.log('Nombre archivo:', nombreArchivo);
        console.log('Tipo archivo:', tipoArchivo);
        console.log('Base64 length:', base64.length);
        console.log('URL:', `${API_BASE}/soportes-entrega/subir`);
        
        const response = await fetch(`${API_BASE}/soportes-entrega/subir`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orden: ordenActual,
                archivo_base64: base64,
                nombre_archivo: nombreArchivo,
                tipo_archivo: tipoArchivo
            })
        });
        
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            alert('✅ Soporte cargado exitosamente');
            cargarSoporteEntrega(ordenActual);
        } else {
            alert(`❌ Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error completo:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        alert('❌ Error al subir soporte: ' + error.message);
    }
}

// ================================================================
// MARCAR ORDEN COMO RECIBIDA O INCOMPLETA
// ================================================================

async function marcarRecibida() {
    const entregaCompleta = document.getElementById('checkEntregaCompleta').checked;
    
    // Verificar que tenga soporte subido
    try {
        const response = await fetch(`${API_BASE}/soportes-entrega/${ordenActual}`);
        const data = await response.json();
        
        if (!data.success || !data.data) {
            alert('⚠️ Primero debes subir el soporte de entrega');
            return;
        }
    } catch (error) {
        console.error('Error verificando soporte:', error);
        alert('❌ Error al verificar soporte');
        return;
    }
    
    // Confirmar acción
    const mensaje = entregaCompleta
        ? '¿Confirmas que la orden fue entregada COMPLETA?\n\n' +
          '✅ Se cambiará el estado a ENTREGADA\n' +
          '✅ Se descargarán los productos del inventario\n' +
          '✅ Se calculará la fecha de vencimiento'
        : '¿Confirmas que la orden fue entregada INCOMPLETA?\n\n' +
          '⚠️ El estado seguirá como PENDIENTE\n' +
          '⚠️ NO se descargará inventario\n' +
          '⚠️ Se marcará como [ORDEN INCOMPLETA]';
    
    if (!confirm(mensaje)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/ordenes-compra/${ordenActual}/procesar-recepcion`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                entrega_completa: entregaCompleta
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const mensajeExito = entregaCompleta
                ? '✅ Orden marcada como ENTREGADA\n\n' +
                  'Inventario descargado correctamente'
                : '✅ Recepción registrada\n\n' +
                  'Orden marcada como INCOMPLETA\n' +
                  'Estado: PENDIENTE';
            
            alert(mensajeExito);
            cerrarModal();
            cargarOrdenes();
        } else {
            alert(`❌ Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error procesando recepción:', error);
        alert('❌ Error al procesar la recepción');
    }
}

// ================================================================
// CERRAR MODAL
// ================================================================

function cerrarModal() {
    document.getElementById('modalDetalle').classList.remove('active');
    ordenActual = null;
}

// ================================================================
// DRAG & DROP
// ================================================================

const uploadZone = document.getElementById('uploadZone');

uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragging');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragging');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragging');
    
    const file = e.dataTransfer.files[0];
    if (file) {
        document.getElementById('fileInput').files = e.dataTransfer.files;
        subirSoporte({ target: { files: [file] } });
    }
});

// ================================================================
// UTILIDADES
// ================================================================

function formatearFecha(fecha) {
    if (!fecha) return '-';
    const f = new Date(fecha);
    return `${f.getDate().toString().padStart(2, '0')}/${(f.getMonth() + 1).toString().padStart(2, '0')}/${f.getFullYear()}`;
}

function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 2
    }).format(valor);
}

// ================================================================
// INICIALIZAR
// ================================================================

cargarOrdenes();
