// ================================================================
// Sanitizador de HTML para los avisos de actualización
//
// Los avisos se escriben con formato (negrita, listas, colores) y se guardan
// como HTML, así que al mostrarlos hay que usar v-html. Eso abre la puerta a
// inyección: bastaría con guardar un <script> o un onclick para que se
// ejecutara en el panel de TODOS los usuarios de la empresa.
//
// Aquí se reconstruye el contenido desde cero permitiendo solo una lista
// cerrada de etiquetas y clases. Todo lo demás -scripts, iframes, atributos
// con eventos, estilos sueltos- se descarta. Es una lista blanca, no negra:
// lo que no está permitido explícitamente, no pasa.
//
// Sin dependencias externas, igual que el resto de los módulos propios.
// ================================================================

// Etiquetas de formato. Nada que cargue recursos ni ejecute código.
const ETIQUETAS = new Set([
    'B', 'STRONG', 'I', 'EM', 'U', 'S',
    'P', 'DIV', 'BR',
    'UL', 'OL', 'LI',
    'H3', 'H4',
    'SPAN',
]);

// Etiquetas cuyo CONTENIDO tambien se descarta. En el resto conviene
// conservar el texto interior (de un <div> raro se rescata lo que decia),
// pero el cuerpo de un <script> o un <style> es codigo: dejarlo como texto
// suelto ensuciaria el aviso con cosas como "alert(1)".
const DESCARTAR_CONTENIDO = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'IFRAME', 'OBJECT', 'EMBED']);

// Clases de color: se usan clases en vez de estilos con color libre para que
// los avisos sigan el tema de la app. Un color fijo escrito a mano se vería
// bien en claro y quedaría ilegible en oscuro.
const CLASES = new Set([
    'av-destacado',  // ámbar — lo importante
    'av-alerta',     // rojo — advertencias
    'av-exito',      // verde — algo que ya funciona
    'av-tenue',      // gris — notas al margen
]);

/** Limpia el HTML de un aviso dejando solo formato seguro. */
export function sanitizarHtml(sucio) {
    if (!sucio || typeof sucio !== 'string') return ''

    const doc = new DOMParser().parseFromString(`<body>${sucio}</body>`, 'text/html')

    const limpiar = (origen) => {
        const destino = document.createDocumentFragment()

        origen.childNodes.forEach(nodo => {
            // El texto siempre pasa: al insertarlo con createTextNode queda
            // escapado, así que no puede convertirse en etiquetas.
            if (nodo.nodeType === Node.TEXT_NODE) {
                destino.appendChild(document.createTextNode(nodo.textContent))
                return
            }
            if (nodo.nodeType !== Node.ELEMENT_NODE) return

            if (DESCARTAR_CONTENIDO.has(nodo.tagName)) return

            if (!ETIQUETAS.has(nodo.tagName)) {
                // Etiqueta no permitida: se descarta la etiqueta pero se
                // conserva lo que tenía dentro, para no perder el texto.
                destino.appendChild(limpiar(nodo))
                return
            }

            const nuevo = document.createElement(nodo.tagName.toLowerCase())

            // De todos los atributos solo sobrevive `class`, y solo con los
            // nombres de la lista blanca. Así no entran onclick, style, href
            // ni data-* que puedan usarse para algo raro.
            const clases = (nodo.getAttribute('class') || '')
                .split(/\s+/)
                .filter(c => CLASES.has(c))
            if (clases.length) nuevo.setAttribute('class', clases.join(' '))

            nuevo.appendChild(limpiar(nodo))
            destino.appendChild(nuevo)
        })

        return destino
    }

    const contenedor = document.createElement('div')
    contenedor.appendChild(limpiar(doc.body))
    return contenedor.innerHTML
}

/** Texto plano de un aviso, para vistas previas y para medir su longitud. */
export function textoPlano(html) {
    if (!html) return ''
    const d = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
    return (d.body.textContent || '').trim()
}

export default sanitizarHtml
