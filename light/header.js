// ================================================================
// HEADER.JS - Mobile-first header + slide-in drawer
// ================================================================

(function () {
    'use strict';

    const PAGE_MAP = {
        'principal.html':               { title: 'RestManager Pro',    back: null,                    module: null },
        'contabilidad.html':            { title: 'Contabilidad',       back: 'principal.html',        module: 'contabilidad' },
        'tesoreria.html':               { title: 'Tesorería',          back: 'principal.html',        module: 'tesoreria' },
        'almacen.html':                 { title: 'Almacén',            back: 'principal.html',        module: 'almacen' },
        'nomina.html':                  { title: 'Nómina',             back: 'principal.html',        module: 'nomina' },
        'inventario.html':              { title: 'Inventario',         back: 'principal.html',        module: 'inventario' },
        'facturacion.html':             { title: 'Facturación',        back: 'principal.html',        module: 'facturacion' },
        'contabilidad-gastos.html':     { title: 'Gestión de Gastos',  back: 'contabilidad.html',     module: 'contabilidad' },
        'contabilidad-reportes.html':   { title: 'Reportes Contables', back: 'contabilidad.html',     module: 'contabilidad' },
        'tesoreria-movimientos.html':   { title: 'Movimientos',        back: 'tesoreria.html',        module: 'tesoreria' },
        'tesoreria-facturas-compra.html':{ title: 'Facturas de Compra',back: 'tesoreria.html',        module: 'tesoreria' },
        'tesoreria-reporte.html':       { title: 'Reporte Tesorería',  back: 'tesoreria.html',        module: 'tesoreria' },
        'almacen-gestion.html':         { title: 'Gestión Inventario', back: 'almacen.html',          module: 'almacen' },
        'almacen-kardex.html':          { title: 'Kardex',             back: 'almacen.html',          module: 'almacen' },
        'almacen-ordenes-compra.html':  { title: 'Órdenes de Compra',  back: 'almacen.html',          module: 'almacen' },
        'almacen-reporte-ordenes.html': { title: 'Reporte Órdenes',    back: 'almacen.html',          module: 'almacen' },
        'almacen-toma-fisica.html':     { title: 'Toma Física',        back: 'almacen.html',          module: 'almacen' },
        'ordenes-recepcion.html':       { title: 'Recepción OC',       back: 'almacen.html',          module: 'almacen' },
        'entrega-ordenes.html':         { title: 'Entregas',           back: 'principal.html',        module: null },
        'plantillas.html':              { title: 'Plantillas',         back: 'principal.html',        module: null },
    };

    const NAV_MODULES = [
        { id: 'contabilidad', title: 'Contabilidad',  icon: '📊', url: 'contabilidad.html' },
        { id: 'tesoreria',    title: 'Tesorería',     icon: '💰', url: 'tesoreria.html' },
        { id: 'almacen',      title: 'Almacén',       icon: '📦', url: 'almacen.html' },
        { id: 'nomina',       title: 'Nómina',        icon: '👥', url: 'nomina.html' },
        { id: 'inventario',   title: 'Inventario',    icon: '📋', url: 'inventario.html' },
        { id: 'facturacion',  title: 'Facturación',   icon: '🧾', url: 'facturacion.html' },
    ];

    function getCurrentPage() {
        return location.pathname.split('/').pop() || 'principal.html';
    }

    function getThemeIcon() {
        return (localStorage.getItem('theme') || 'light') === 'dark' ? '☀️' : '🌙';
    }

    // ── Render the compact mobile header ──────────────────────────
    function renderHeader() {
        const header = document.querySelector('.header');
        if (!header) return;

        const page = getCurrentPage();
        const info = PAGE_MAP[page] || { title: 'Menú', back: 'principal.html', module: null };

        const backBtn = info.back
            ? `<a href="${info.back}" class="header-icon-btn header-back-btn" title="Atrás">
                   <svg width="10" height="17" viewBox="0 0 10 17" fill="none" style="flex-shrink:0">
                       <path d="M8.5 1L1.5 8.5L8.5 16" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
                   </svg>
                   <span>Atrás</span>
               </a>`
            : `<div style="min-width:44px;flex-shrink:0;"></div>`;

        header.innerHTML = `
            <div class="header-inner">
                ${backBtn}
                <span class="header-title">${info.title}</span>
                <div class="header-right">
                    <button class="header-icon-btn" id="headerThemeBtn" title="Cambiar tema" onclick="cambiarTema()">
                        <span id="headerThemeIcon">${getThemeIcon()}</span>
                    </button>
                    <button class="header-icon-btn" id="drawerToggle" title="Menú">
                        <span class="hamburger-icon"><span></span><span></span><span></span></span>
                    </button>
                </div>
            </div>
        `;

        document.getElementById('drawerToggle')?.addEventListener('click', openDrawer);

        // Patch cambiarTema to also update the header icon
        const _orig = window.cambiarTema;
        window.cambiarTema = function () {
            if (_orig) _orig();
            const el = document.getElementById('headerThemeIcon');
            if (el) el.textContent = getThemeIcon();
        };
    }

    // ── Inject the slide-in drawer ─────────────────────────────────
    function renderDrawer() {
        const page = getCurrentPage();
        const info = PAGE_MAP[page] || { module: null };

        const isHome = !info.module;

        const overlay = document.createElement('div');
        overlay.className = 'app-overlay';
        overlay.id = 'appOverlay';
        overlay.addEventListener('click', closeDrawer);

        const drawer = document.createElement('div');
        drawer.className = 'app-drawer';
        drawer.id = 'appDrawer';
        drawer.innerHTML = `
            <div class="drawer-header">
                <div class="drawer-avatar" id="drawerAvatar">?</div>
                <div class="drawer-username" id="drawerUser">Cargando…</div>
                <div class="drawer-empresa" id="drawerEmpresa"></div>
            </div>
            <nav class="drawer-nav">
                <a href="principal.html" class="drawer-link ${isHome ? 'active' : ''}">
                    <span class="drawer-link-icon">🏠</span>
                    <span>Inicio</span>
                </a>
                <div class="drawer-separator"></div>
                <div class="drawer-section-title">Módulos</div>
                ${NAV_MODULES.map(m => `
                    <a href="${m.url}" class="drawer-link ${info.module === m.id ? 'active' : ''}">
                        <span class="drawer-link-icon">${m.icon}</span>
                        <span>${m.title}</span>
                    </a>
                `).join('')}
            </nav>
            <div class="drawer-footer">
                <div class="drawer-separator"></div>
                <button class="drawer-logout-btn" onclick="cerrarSesion()">
                    <span class="drawer-link-icon">🚪</span>
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(drawer);
    }

    function openDrawer() {
        document.getElementById('appDrawer')?.classList.add('open');
        document.getElementById('appOverlay')?.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        document.getElementById('appDrawer')?.classList.remove('open');
        document.getElementById('appOverlay')?.classList.remove('open');
        document.body.style.overflow = '';
    }

    // Close drawer with Escape key
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeDrawer();
    });

    // ── Initialize session and fill user info ─────────────────────
    async function inicializarHeader() {
        const usuario    = JSON.parse(localStorage.getItem('usuario') || 'null');
        const empresaCod = localStorage.getItem('empresaActual');

        if (!usuario || !empresaCod) {
            window.location.href = 'index.html';
            return null;
        }

        const empresaData = usuario.empresas?.find(e => String(e.empresa) === String(empresaCod));
        const empresaNombre = empresaData ? empresaData.empresa_nombre : empresaCod;

        // Fill drawer
        const drawerUser    = document.getElementById('drawerUser');
        const drawerEmpresa = document.getElementById('drawerEmpresa');
        const drawerAvatar  = document.getElementById('drawerAvatar');

        if (drawerUser)    drawerUser.textContent    = (usuario.usuario || '').toUpperCase();
        if (drawerEmpresa) drawerEmpresa.textContent = empresaNombre;
        if (drawerAvatar) {
            const name = usuario.nombre || usuario.usuario || 'U';
            drawerAvatar.textContent = name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
        }

        window.sesion = {
            usuario:      usuario.usuario,
            nombre:       usuario.nombre,
            nivel:        usuario.nivel,
            empresa:      empresaCod,
            empresaNombre,
        };
        window.modoApp = localStorage.getItem('modoApp') || 'light';

        return window.sesion;
    }

    // ── Boot ───────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', async () => {
        renderHeader();
        renderDrawer();
        await inicializarHeader();
    });

    // ── Global helpers ─────────────────────────────────────────────
    window.cerrarSesion = function () {
        if (confirm('¿Estás seguro de cerrar sesión?')) {
            localStorage.removeItem('usuario');
            localStorage.removeItem('empresaActual');
            window.location.href = 'index.html';
        }
    };

})();
