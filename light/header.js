// ================================================================
// HEADER.JS - Bottom nav + auth check
// ================================================================

(function () {
    'use strict';

    const PAGE_MAP = {
        'principal.html':                   { title: 'Inicio',               back: null,                     module: null,          nav: 'inicio' },
        'contabilidad.html':                { title: 'Contabilidad',         back: 'principal.html',         module: 'contabilidad', nav: null },
        'tesoreria.html':                   { title: 'Tesorería',            back: 'principal.html',         module: 'tesoreria',    nav: null },
        'almacen.html':                     { title: 'Almacén',              back: 'principal.html',         module: 'almacen',      nav: null },
        'nomina.html':                      { title: 'Nómina',               back: 'principal.html',         module: 'nomina',       nav: null },
        'inventario.html':                  { title: 'Inventario',           back: 'principal.html',         module: 'inventario',   nav: null },
        'inventario-stock.html':            { title: 'Stock por Centro',     back: 'inventario.html',        module: 'inventario',   nav: null },
        'facturacion.html':                 { title: 'Facturación',          back: 'principal.html',         module: 'facturacion',  nav: null },
        'contabilidad-gastos.html':         { title: 'Gestión de Gastos',   back: 'contabilidad.html',      module: 'contabilidad', nav: null },
        'contabilidad-reportes.html':       { title: 'Reportes Contables',  back: 'contabilidad.html',      module: 'contabilidad', nav: null },
        'tesoreria-movimientos.html':       { title: 'Movimientos',          back: 'tesoreria.html',         module: 'tesoreria',    nav: null },
        'tesoreria-facturas-compra.html':   { title: 'Facturas de Compra',  back: 'tesoreria.html',         module: 'tesoreria',    nav: null },
        'tesoreria-reporte.html':           { title: 'Reporte Tesorería',   back: 'tesoreria.html',         module: 'tesoreria',    nav: null },
        'almacen-gestion.html':             { title: 'Gestión Inventario',  back: 'almacen.html',           module: 'almacen',      nav: null },
        'almacen-kardex.html':              { title: 'Kardex por Período',  back: 'almacen.html',           module: 'almacen',      nav: null },
        'almacen-consumos.html':            { title: 'Consumos Productos',  back: 'almacen.html',           module: 'almacen',      nav: null },
        'almacen-consumo-insumos.html':     { title: 'Consumo Insumos',     back: 'almacen.html',           module: 'almacen',      nav: null },
        'almacen-movimiento-producto.html': { title: 'Movimiento Producto', back: 'almacen.html',           module: 'almacen',      nav: null },
        'almacen-ordenes-compra.html':      { title: 'Órdenes de Compra',  back: 'almacen.html',           module: 'almacen',      nav: null },
        'almacen-reporte-ordenes.html':     { title: 'Reporte Órdenes',    back: 'almacen.html',           module: 'almacen',      nav: null },
        'almacen-toma-fisica.html':         { title: 'Toma Física',         back: 'almacen.html',           module: 'almacen',      nav: null },
        'almacen-despachos.html':           { title: 'Despachos de Bodega', back: 'almacen.html',           module: 'almacen',      nav: null },
        'almacen-config-barcodes.html':     { title: 'Códigos de Barras',  back: 'almacen.html',           module: 'almacen',      nav: null },
        'nomina-horario-semanal.html':      { title: 'Horario Semanal',     back: 'nomina.html',            module: 'nomina',       nav: null },
        'nomina-liquidacion.html':          { title: 'Liquidación',          back: 'nomina.html',            module: 'nomina',       nav: null },
        'nomina-reporte-horario.html':      { title: 'Horario Publicar',    back: 'nomina.html',            module: 'nomina',       nav: null },
        'nomina-recibos.html':              { title: 'Recibos de Pago',     back: 'nomina.html',            module: 'nomina',       nav: null },
        'ordenes-recepcion.html':           { title: 'Recepción OC',        back: 'almacen.html',           module: 'almacen',      nav: null },
        'entrega-ordenes.html':             { title: 'Entregas',             back: 'principal.html',         module: null,           nav: null },
        'plantillas.html':                  { title: 'Plantillas',           back: 'principal.html',         module: null,           nav: null },
    };

    function getCurrentPage() {
        return location.pathname.split('/').pop() || 'principal.html';
    }

    // ── Inject top bar (back button + title) for internal pages ───
    function renderTopBar() {
        const page = getCurrentPage();
        const info = PAGE_MAP[page] || { title: 'Menú', back: 'principal.html' };

        if (!info.back) return; // principal.html has no top bar

        // Remove existing header if legacy markup present
        const legacyHeader = document.querySelector('header.header');
        if (legacyHeader) legacyHeader.style.display = 'none';

        const topBar = document.createElement('header');
        topBar.className = 'top-bar';
        topBar.innerHTML = `
            <div class="top-bar-inner">
                <a href="${info.back}" class="top-bar-back">
                    <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
                        <path d="M8.5 1L1.5 8.5L8.5 16" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Inicio
                </a>
                <span class="top-bar-title">${info.title}</span>
                <button class="top-bar-theme-btn" onclick="cambiarTema()" aria-label="Cambiar tema">
                    <span class="theme-icon-light">☀️</span>
                    <span class="theme-icon-dark">🌙</span>
                </button>
            </div>
        `;

        document.body.insertBefore(topBar, document.body.firstChild);
    }

    // ── Inject bottom nav ──────────────────────────────────────────
    function renderBottomNav() {
        const page = getCurrentPage();
        const info = PAGE_MAP[page] || {};
        const activeNav = info.nav || null;

        const nav = document.createElement('nav');
        nav.className = 'bottom-nav';
        nav.id = 'bottomNav';
        nav.innerHTML = `
            <a href="principal.html" class="nav-item ${activeNav === 'inicio' ? 'active' : ''}" id="navInicio">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <span>Inicio</span>
            </a>
            <a href="#" class="nav-item" id="navAlertas">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                <span>Alertas</span>
            </a>
            <a href="#" class="nav-item" id="navBuscar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span>Buscar</span>
            </a>
            <a href="#" class="nav-item nav-item-danger" id="navPerfil" onclick="cerrarSesion(); return false;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span>Salir</span>
            </a>
        `;

        document.body.appendChild(nav);

        // Agregar evento al botón buscar
        document.getElementById('navBuscar').addEventListener('click', (e) => {
            e.preventDefault();
            abrirBusqueda();
        });
    }

    // ── Búsqueda global ───────────────────────────────────────────
    function abrirBusqueda() {
        const modal = document.getElementById('searchModal') || crearModalBusqueda();
        const input = modal.querySelector('#searchInput');
        modal.style.display = 'flex';
        input.focus();
    }

    function crearModalBusqueda() {
        const modal = document.createElement('div');
        modal.id = 'searchModal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            flex-direction: column;
            align-items: flex-start;
            justify-content: flex-start;
            padding-top: 10px;
        `;

        modal.innerHTML = `
            <div style="width: 100%; max-width: 100%; background: var(--bg-primary); border-radius: 0 0 16px 16px; padding: 16px; margin-bottom: 0;">
                <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                    <input type="text" id="searchInput" placeholder="🔍 Busca módulos, reportes..." style="flex: 1; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 14px; background: var(--bg-card);" />
                    <button onclick="cerrarBusqueda()" style="width: 36px; height: 36px; border: none; background: var(--bg-card); border-radius: 8px; cursor: pointer; font-size: 18px;">✕</button>
                </div>
                <div id="searchResults" style="max-height: 60vh; overflow-y: auto;"></div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        const input = modal.querySelector('#searchInput');
        input.addEventListener('input', (e) => buscarModulos(e.target.value));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') cerrarBusqueda();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrarBusqueda();
        });

        return modal;
    }

    function buscarModulos(query) {
        const resultados = document.getElementById('searchResults');

        if (!query.trim()) {
            resultados.innerHTML = '<p style="color: var(--text-secondary); padding: 16px; font-size: 14px;">Escribe para buscar módulos y reportes</p>';
            return;
        }

        const modulos = [
            { nombre: 'Almacén', icon: '📦', url: 'almacen.html', desc: 'Gestión de inventario' },
            { nombre: 'Despachos de Bodega', icon: '🚚', url: 'almacen-despachos.html', desc: 'Órdenes de despacho' },
            { nombre: 'Kardex por Período', icon: '📈', url: 'almacen-kardex.html', desc: 'Historial de movimientos' },
            { nombre: 'Consumos de Productos', icon: '📉', url: 'almacen-consumos.html', desc: 'Salidas por venta' },
            { nombre: 'Consumo de Insumos', icon: '📦', url: 'almacen-consumo-insumos.html', desc: 'Traslados desde bodega' },
            { nombre: 'Movimiento por Producto', icon: '🔄', url: 'almacen-movimiento-producto.html', desc: 'Detalle diario' },
            { nombre: 'Órdenes de Compra', icon: '🛒', url: 'almacen-ordenes-compra.html', desc: 'Gestión de compras' },
            { nombre: 'Imprimir Despachos', icon: '🖨️', url: 'almacen-informes-despachos.html', desc: 'Reportes de despachos' },
            { nombre: 'Contabilidad', icon: '📊', url: 'contabilidad.html', desc: 'Gestión contable' },
            { nombre: 'Tesorería', icon: '💰', url: 'tesoreria.html', desc: 'Gestión de tesorería' },
            { nombre: 'Nómina', icon: '👥', url: 'nomina.html', desc: 'Gestión de personal' },
            { nombre: 'Facturación', icon: '🧾', url: 'facturacion.html', desc: 'Gestión de facturas' }
        ];

        const filtered = modulos.filter(m =>
            m.nombre.toLowerCase().includes(query.toLowerCase()) ||
            m.desc.toLowerCase().includes(query.toLowerCase())
        );

        if (filtered.length === 0) {
            resultados.innerHTML = '<p style="color: var(--text-secondary); padding: 16px; font-size: 14px;">No encontramos módulos con ese nombre</p>';
            return;
        }

        resultados.innerHTML = filtered.map(m => `
            <a href="${m.url}" style="display: flex; align-items: center; gap: 12px; padding: 12px 12px; border-bottom: 1px solid var(--border-color); text-decoration: none; color: inherit; transition: background 0.15s;" onclick="cerrarBusqueda()">
                <span style="font-size: 24px;">${m.icon}</span>
                <div style="flex: 1;">
                    <p style="font-size: 14px; font-weight: 500; color: var(--text-primary); margin: 0;">${m.nombre}</p>
                    <p style="font-size: 12px; color: var(--text-secondary); margin: 2px 0 0;">${m.desc}</p>
                </div>
            </a>
        `).join('');
    }

    function cerrarBusqueda() {
        const modal = document.getElementById('searchModal');
        if (modal) modal.style.display = 'none';
    }

    // ── Initialize session ─────────────────────────────────────────
    async function inicializarSesion() {
        const usuario    = JSON.parse(localStorage.getItem('usuario') || 'null');
        const empresaCod = localStorage.getItem('empresaActual');

        if (!usuario || !empresaCod) {
            window.location.href = 'index.html';
            return null;
        }

        const empresaData   = usuario.empresas?.find(e => String(e.empresa) === String(empresaCod));
        const empresaNombre = empresaData ? empresaData.empresa_nombre : empresaCod;

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
        renderTopBar();
        renderBottomNav();
        await inicializarSesion();
    });

    // ── Global helpers ─────────────────────────────────────────────
    window.cerrarSesion = function () {
        if (confirm('¿Estás seguro de cerrar sesión?')) {
            localStorage.removeItem('usuario');
            localStorage.removeItem('empresaActual');
            window.location.href = 'index.html';
        }
    };

    window.cambiarTema = function () {
        const html    = document.documentElement;
        const current = html.getAttribute('data-theme') || localStorage.getItem('theme') || 'light';
        const next    = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    };

})();
