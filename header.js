// ================================================================
// HEADER UNIVERSAL - GESTIÓN CENTRALIZADA
// ================================================================

// Verificar sesión y cargar header
async function inicializarHeader() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const empresaCodigo = localStorage.getItem('empresaActual');
    
    if (!usuario || !empresaCodigo) {
        window.location.href = 'index.html';
        return null;
    }
    
    // Buscar el nombre de la empresa en la lista de empresas del usuario
    const empresaData = usuario.empresas.find(e => e.empresa === empresaCodigo);
    const empresaNombre = empresaData ? empresaData.empresa_nombre : empresaCodigo;
    
    console.log('Empresa seleccionada:', empresaCodigo);
    console.log('Nombre de empresa:', empresaNombre);
    
    // Actualizar header
    const userNameElement = document.getElementById('userName');
    const empresaCodeElement = document.getElementById('empresaCode');
    
    if (userNameElement) {
        userNameElement.textContent = `👤 ${usuario.usuario}`;
    }
    
    if (empresaCodeElement) {
        empresaCodeElement.textContent = empresaNombre;
    }
    
    // Retornar objeto de sesión
    return {
        usuario: usuario.usuario,
        nombre: usuario.nombre,
        empresa: empresaCodigo,
        empresaNombre: empresaNombre
    };
}

// Cerrar sesión
function cerrarSesion() {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
        localStorage.removeItem('usuario');
        localStorage.removeItem('empresaActual');
        window.location.href = 'index.html';
    }
}

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', async () => {
    const sesion = await inicializarHeader();
    
    // Hacer sesión global
    if (sesion) {
        window.sesion = sesion;
    }
});
