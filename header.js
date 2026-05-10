// ================================================================
// HEADER UNIVERSAL - GESTIÓN CENTRALIZADA
// ================================================================

// Verificar sesión y cargar header
function inicializarHeader() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const empresaCodigo = localStorage.getItem('empresaActual');
    
    if (!usuario || !empresaCodigo) {
        window.location.href = 'index.html';
        return null;
    }
    
    // Buscar el nombre de la empresa en la lista de empresas del usuario
    const empresaData = usuario.empresas.find(e => e.empresa === empresaCodigo);
    const empresaNombre = empresaData ? empresaData.empresa_nombre : empresaCodigo;
    
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

// Toggle menú hamburguesa
function toggleMenu() {
    const menu = document.getElementById('hamburgerMenu');
    const overlay = document.getElementById('menuOverlay');
    
    if (menu && overlay) {
        const isOpen = menu.classList.contains('open');
        
        if (isOpen) {
            menu.classList.remove('open');
            overlay.classList.remove('open');
        } else {
            menu.classList.add('open');
            overlay.classList.add('open');
        }
    }
}

// Cerrar menú al hacer click en overlay
function cerrarMenu() {
    const menu = document.getElementById('hamburgerMenu');
    const overlay = document.getElementById('menuOverlay');
    
    if (menu && overlay) {
        menu.classList.remove('open');
        overlay.classList.remove('open');
    }
}

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    const sesion = inicializarHeader();
    
    // Hacer sesión global
    if (sesion) {
        window.sesion = sesion;
    }
});
