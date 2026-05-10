// ================================================================
// MANEJO DE TEMA - DARK / LIGHT MODE
// ================================================================

// Obtener tema guardado o usar 'light' por defecto
function obtenerTema() {
    return localStorage.getItem('theme') || 'light';
}

// Guardar tema en localStorage
function guardarTema(theme) {
    localStorage.setItem('theme', theme);
}

// Aplicar tema al documento
function aplicarTema(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Actualizar todos los switches de tema en la página
    const switches = document.querySelectorAll('.theme-switch input');
    switches.forEach(sw => {
        sw.checked = (theme === 'dark');
    });
}

// Cambiar tema
function cambiarTema() {
    const temaActual = obtenerTema();
    const nuevoTema = temaActual === 'light' ? 'dark' : 'light';
    
    guardarTema(nuevoTema);
    aplicarTema(nuevoTema);
    
    console.log(`🎨 Tema cambiado a: ${nuevoTema}`);
}

// Inicializar tema al cargar la página
function inicializarTema() {
    const tema = obtenerTema();
    aplicarTema(tema);
    console.log(`🎨 Tema inicial: ${tema}`);
}

// Ejecutar al cargar el DOM
document.addEventListener('DOMContentLoaded', inicializarTema);
