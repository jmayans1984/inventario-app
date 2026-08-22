// ================================================================
// Iconos SVG — versión móvil (light)
//
// Reemplazan los emoji que se usaban como iconos. Un emoji se dibuja
// distinto en cada teléfono (Android, iOS y Windows tienen sus propios
// juegos), no hereda el color del tema y da un aire de prototipo. Estos
// son trazos vectoriales: mismo grosor, mismo tamaño y toman el color
// del contenedor, así que se ven igual en todas partes.
//
// Uso:  <i data-icono="paquete"></i>
// El hidratador corre al cargar la página y reemplaza cada <i> por su SVG.
//
// Trazo de 1.75 y viewBox de 24 en todos: si se agrega uno nuevo, respetar
// esas dos cosas o se notará más grueso o más chico que el resto.
// ================================================================

(function () {
    const TRAZOS = {
        // ── Módulos ──────────────────────────────────────────────
        contabilidad: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><rect x="7" y="10" width="3" height="7" rx="1"/><rect x="13" y="6" width="3" height="11" rx="1"/>',
        tesoreria:    '<path d="M3 10h18M5 10V7l7-4 7 4v3M6 10v7M10 10v7M14 10v7M18 10v7M3 21h18"/>',
        almacen:      '<path d="M21 8V6a2 2 0 0 0-1.1-1.8l-7-3.5a2 2 0 0 0-1.8 0l-7 3.5A2 2 0 0 0 3 6v12a2 2 0 0 0 1.1 1.8l7 3.5a2 2 0 0 0 1.8 0l7-3.5A2 2 0 0 0 21 18v-2"/><path d="m3.3 5.1 8.7 4.4 8.7-4.4M12 22V9.5"/>',
        nomina:       '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
        facturacion:  '<path d="M4 2v20l2-1.5L8 22l2-1.5L12 22l2-1.5L16 22l2-1.5L20 22V2l-2 1.5L16 2l-2 1.5L12 2l-2 1.5L8 2 6 3.5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',

        // ── Procesos ─────────────────────────────────────────────
        editar:       '<path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11"/><path d="M13.5 10.5 20 4a1.4 1.4 0 0 1 2 2l-6.5 6.5-2.8.8z"/>',
        conteo:       '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h4"/>',
        listaCompra:  '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 2h6v4H9z"/><path d="m9 13 2 2 4-4"/>',
        camion:       '<path d="M2 7h11v10H2zM13 10h4.5l3.5 3.5V17h-8"/><circle cx="6.5" cy="18.5" r="2"/><circle cx="17" cy="18.5" r="2"/>',
        fabrica:      '<path d="M3 21V9l5 3V9l5 3V9l5 3v9z"/><path d="M3 21h18M8 17h2M14 17h2"/>',

        // ── Informes ─────────────────────────────────────────────
        subida:       '<path d="m3 17 6-6 4 4 7-7"/><path d="M14 7h6v6"/>',
        bajada:       '<path d="m3 7 6 6 4-4 7 7"/><path d="M14 17h6v-6"/>',
        salidaCaja:   '<path d="M21 8V6a2 2 0 0 0-1.1-1.8l-7-3.5a2 2 0 0 0-1.8 0l-7 3.5A2 2 0 0 0 3 6v12a2 2 0 0 0 1.1 1.8l7 3.5a2 2 0 0 0 1.8 0l7-3.5A2 2 0 0 0 21 18v-2"/><path d="M15 12H9"/>',
        intercambio:  '<path d="M7 4 3 8l4 4"/><path d="M3 8h13a4 4 0 0 1 0 8H9"/>',
        carrito:      '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.1a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 7H6"/>',
        impresora:    '<path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
        alerta:       '<path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
        balanza:      '<path d="M12 3v18M7 21h10M5 7h14"/><path d="m5 7-3 6h6zM19 7l-3 6h6z"/>',
        grafico:      '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m7 14 3-4 3 3 5-6"/>',
        recibo:       '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>',
        calendario:   '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>',
        calculadora:  '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h4"/>',
        reloj:        '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        banco:        '<path d="M3 10h18M5 10V7l7-4 7 4v3M6 10v7M10 10v7M14 10v7M18 10v7M3 21h18"/>',

        // ── Despachos / packing ──────────────────────────────────
        escaner:      '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M3 12h18"/>',
        ok:           '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
        pendiente:    '<circle cx="12" cy="12" r="9"/>',
        sobrante:     '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
        rayo:         '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
        ojo:          '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
        ojoTachado:   '<path d="M10.7 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a18 18 0 0 1-2.5 3.4M6.6 6.6A18 18 0 0 0 2 12s3.6 7 10 7a10.7 10.7 0 0 0 4.2-.8"/><path d="m2 2 20 20"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
        lupa:         '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
        equis:        '<path d="M18 6 6 18M6 6l12 12"/>',
        camara:       '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
        nota:         '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
        pin:          '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
        reloj_arena:  '<path d="M6 2h12M6 22h12M6 2c0 4 3 5 6 10-3 5-6 6-6 10M18 2c0 4-3 5-6 10 3 5 6 6 6 10"/>',
    };

    function hidratar(raiz) {
        (raiz || document).querySelectorAll('i[data-icono]').forEach(el => {
            const nombre = el.getAttribute('data-icono');
            const trazo = TRAZOS[nombre];
            if (!trazo) return;
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 24 24');
            // Tamaño por defecto en 1em: un SVG sin width/height se estira al
            // tamaño por defecto del navegador (300x150) y aparece gigante.
            // Al ir en em, el icono acompaña al texto que tiene al lado. Son
            // atributos de presentación, la prioridad más baja: cualquier
            // regla CSS de tamaño los sigue ganando.
            svg.setAttribute('width', '1em');
            svg.setAttribute('height', '1em');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
            svg.setAttribute('stroke-width', '1.75');
            svg.setAttribute('stroke-linecap', 'round');
            svg.setAttribute('stroke-linejoin', 'round');
            svg.setAttribute('aria-hidden', 'true');
            svg.innerHTML = trazo;
            el.replaceWith(svg);
        });
    }

    // Se expone por si alguna pantalla dibuja filas después de cargar.
    window.hidratarIconos = hidratar;
    document.addEventListener('DOMContentLoaded', () => hidratar());
})();
