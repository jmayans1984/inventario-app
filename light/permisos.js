// ================================================================
// Permisos por usuario/empresa — versión móvil (light)
//
// Aplica aquí los mismos permisos que ya rigen en la versión de escritorio.
// Sin esto, "Solo Móvil" no restringía nada en esta versión: el menú de
// light/ está escrito a mano en cada HTML y no consultaba permisos en
// absoluto, así que un usuario limitado en escritorio veía todo el menú
// completo apenas entraba por acá.
//
// Regla de combinación (espejo de PermisosUsuariosView.vue):
//   rutas_deshabilitadas          -> bloqueada en TODAS las plataformas
//   rutas_deshabilitadas_movil    -> bloqueada específicamente AQUÍ (en móvil)
//   rutas_deshabilitadas_completa -> bloqueada solo en escritorio, NO aplica acá
//
// Uso en cada página:
//   1. En el menú (almacen.html): cada <a> lleva data-permiso="/ruta/canonica"
//      (la misma ruta que usa PermisosUsuariosView.vue). Los bloqueados se quitan.
//   2. En la página de destino: <meta name="permiso" content="/ruta/canonica">
//      redirige a almacen.html si esa ruta está bloqueada — así no basta con
//      ocultar el enlace, entrar por URL directa también queda cerrado.
// ================================================================

(function () {
    const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api';
    // Si el fetch de permisos tarda o falla, no se deja el menú invisible para
    // siempre: se falla "abierto" (se muestra todo), igual que en escritorio
    // cuando el fetch de permisos no responde.
    const TIMEOUT_MS = 4000;

    function coincide(lista, ruta) {
        return lista.some(d => ruta === d || ruta.startsWith(d + '/'));
    }

    function conTimeout(promesa, ms) {
        return Promise.race([
            promesa,
            new Promise(resolve => setTimeout(() => resolve(null), ms)),
        ]);
    }

    async function permisosBloqueadosMovil() {
        const usuarioRaw = JSON.parse(localStorage.getItem('usuario') || 'null');
        const empresaCod = localStorage.getItem('empresaActual');
        if (!usuarioRaw || !empresaCod) return [];

        // El código de usuario correcto es el de la fila de ESTA empresa, no el
        // que vino "suelto" en la respuesta del login (que puede ser el de otra
        // empresa si el mismo usuario/clave tiene fila en varias — igual criterio
        // que ya usa authStore.setUsuarioCodigo en la versión de escritorio).
        const empresaData = (usuarioRaw.empresas || []).find(e => String(e.empresa) === String(empresaCod));
        const usuarioCodigo = empresaData?.codigo ?? usuarioRaw.codigo;
        const tipo = empresaData?.tipo || '';

        const combinadas = new Set();

        // Permisos de EMPRESA (lo que un proveedor le habilita a su cliente):
        // solo aplican a empresas CLIENTE, igual que en escritorio.
        if (tipo !== 'PROVEEDOR') {
            try {
                const r = await conTimeout(fetch(`${API_BASE}/permisos-modulos/${empresaCod}`), TIMEOUT_MS);
                const j = r && await r.json();
                if (j && j.success) {
                    [...(j.data?.rutas_deshabilitadas || []), ...(j.data?.rutas_deshabilitadas_movil || [])]
                        .forEach(p => combinadas.add(p));
                }
            } catch { /* sin permisos de empresa */ }
        }

        // Permisos de USUARIO: aplican siempre.
        if (usuarioCodigo) {
            try {
                const r = await conTimeout(fetch(`${API_BASE}/permisos-usuarios/${empresaCod}/${usuarioCodigo}`), TIMEOUT_MS);
                const j = r && await r.json();
                if (j && j.success) {
                    [...(j.data?.rutas_deshabilitadas || []), ...(j.data?.rutas_deshabilitadas_movil || [])]
                        .forEach(p => combinadas.add(p));
                }
            } catch { /* sin permisos de usuario */ }
        }

        return Array.from(combinadas);
    }

    // Submódulos que EXISTEN en la versión móvil, por módulo. Si todos los de
    // un módulo quedan bloqueados, el módulo entero desaparece del inicio:
    // llevar al usuario a un menú vacío es peor que no mostrarle la opción.
    //
    // Ojo: si algún día se agrega una pantalla nueva a light/, hay que sumarla
    // aquí además de ponerle su data-permiso — si no, el módulo podría ocultarse
    // aunque esa pantalla nueva sí esté permitida.
    const SUBMODULOS = {
        almacen: [
            '/almacen/procesos/gestion-inventario',
            '/almacen/procesos/toma-fisica',
            '/almacen/procesos/ordenes-compra',
            '/almacen/procesos/despachos',
            '/almacen/reportes/kardex',
            '/almacen/reportes/consumos',
            '/almacen/reportes/consumo-insumos',
            '/almacen/reportes/movimiento-producto',
            '/almacen/reportes/alertas-stock',
            '/almacen/reportes/toma-fisica',
        ],
        contabilidad: [
            '/contabilidad/procesos/gastos',
            '/contabilidad/reportes/gastos',
        ],
        tesoreria: [
            '/tesoreria/procesos/movimientos-bancarios',
            '/tesoreria/procesos/facturas-compra',
            '/tesoreria/reportes/movimiento-cuentas',
        ],
        nomina: [
            '/nomina/procesos/horario',
            '/nomina/procesos/liquidacion',
            '/nomina/reportes/horario',
            '/nomina/reportes/recibos',
        ],
        // Facturación es una pantalla "en desarrollo", sin submódulos reales:
        // con la regla de arriba queda oculta siempre, que es lo correcto.
        facturacion: [],
    };

    function moduloTieneAlgoActivo(modulo, bloqueadas) {
        const subs = SUBMODULOS[modulo] || [];
        return subs.some(ruta => !coincide(bloqueadas, ruta));
    }

    // A qué página "hub" (el menú del módulo) volver si esta página está
    // bloqueada. Se deduce del nombre del archivo para no tener que declararlo
    // en cada meta tag por separado.
    function paginaHub() {
        const archivo = (location.pathname.split('/').pop() || '');
        if (archivo.startsWith('contabilidad-')) return 'contabilidad.html';
        if (archivo.startsWith('tesoreria-'))    return 'tesoreria.html';
        if (archivo.startsWith('nomina-'))       return 'nomina.html';
        return 'almacen.html';
    }

    async function aplicarPermisos() {
        const bloqueadas = await permisosBloqueadosMovil();

        // Guard de la propia página: si esta página requiere una ruta bloqueada,
        // no se entra ni escribiéndola directo en la barra de direcciones.
        const metaPermiso = document.querySelector('meta[name="permiso"]');
        if (metaPermiso && coincide(bloqueadas, metaPermiso.content)) {
            window.location.replace(paginaHub());
            return;
        }

        // Filtrar el menú: se quita cada enlace cuya ruta esté bloqueada y se
        // revela el resto (estaban ocultos por CSS para evitar el parpadeo de
        // ver el menú completo y que luego desaparezcan ítems).
        document.querySelectorAll('[data-permiso]').forEach(el => {
            const ruta = el.getAttribute('data-permiso')
            if (coincide(bloqueadas, ruta)) {
                el.remove()
            } else {
                el.style.visibility = 'visible'
            }
        })

        // Inicio: un módulo sin ningún submódulo disponible se oculta entero.
        document.querySelectorAll('[data-modulo]').forEach(el => {
            const modulo = el.getAttribute('data-modulo')
            if (moduloTieneAlgoActivo(modulo, bloqueadas)) {
                el.style.visibility = 'visible'
            } else {
                el.remove()
            }
        })
    }

    document.addEventListener('DOMContentLoaded', aplicarPermisos)
})();
