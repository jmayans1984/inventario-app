// ================================================================
// campo-fecha.js — fecha siempre en MM/DD/AAAA
//
// El <input type="date"> nativo se dibuja según el idioma del NAVEGADOR, no
// el de la página: el mismo campo sale 08/26/2026 en un Chrome en inglés y
// 26/08/2026 en uno en español. El atributo lang no lo cambia. Por eso dos
// usuarios de la misma empresa veían formatos distintos.
//
// Este script convierte cada campo de fecha en uno de texto con máscara que
// muestra siempre MM/DD/AAAA, y hace algo importante para no tocar los 17
// archivos que los usan: INTERCEPTA la propiedad `value` del elemento, de
// modo que leer `input.value` sigue devolviendo 'YYYY-MM-DD' y asignarlo
// sigue aceptando 'YYYY-MM-DD'. Todo el código existente sigue funcionando
// sin un solo cambio, y el backend recibe exactamente lo mismo que antes.
//
// En teléfono se conserva el selector nativo: al tocar el campo vuelve a ser
// type="date" un instante para abrir la rueda del sistema, y al terminar
// regresa a texto. Escribir 8 dígitos en un teclado de celular sería peor.
// ================================================================
(function () {
    'use strict';

    // Descriptor original de `value`. Se guarda antes de sombrearlo porque es
    // la única forma de seguir leyendo y escribiendo lo que el campo muestra.
    var NATIVO = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

    // ── Conversión, siempre con cadenas ─────────────────────────────────
    // Nunca se construye un Date: new Date('2026-08-26') es medianoche UTC y
    // en cualquier zona negativa (Colombia UTC-5, Orlando UTC-4) cae el día
    // anterior. Es la causa clásica de la fecha corrida en un día.
    function isoAUsuario(iso) {
        if (!iso) return '';
        var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso).split('T')[0]);
        return m ? (m[2] + '/' + m[3] + '/' + m[1]) : '';
    }

    function diasDelMes(anio, mes) {
        if (mes === 2) {
            var bis = (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;
            return bis ? 29 : 28;
        }
        return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mes - 1] || 31;
    }

    function usuarioAIso(texto) {
        var p = String(texto || '').trim().split('/');
        if (p.length !== 3 || p[2].length !== 4) return '';
        var mes = parseInt(p[0], 10), dia = parseInt(p[1], 10), anio = parseInt(p[2], 10);
        if (!mes || !dia || !anio) return '';
        if (mes < 1 || mes > 12) return '';
        // Se valida contra los días reales del mes: sin esto un 02/31 llegaría
        // al backend y reventaría recién al guardar.
        if (dia < 1 || dia > diasDelMes(anio, mes)) return '';
        var dos = function (n) { return (n < 10 ? '0' : '') + n; };
        return anio + '-' + dos(mes) + '-' + dos(dia);
    }

    // Pone las barras mientras se escribe. No valida nada a media digitación:
    // corregir ahí impediría llegar a un valor válido, porque "1" sería un mes
    // imposible antes de poder escribir el "2" de "12".
    function enmascarar(texto) {
        var d = String(texto || '').replace(/\D/g, '').slice(0, 8);
        if (d.length <= 2) return d;
        if (d.length <= 4) return d.slice(0, 2) + '/' + d.slice(2);
        return d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4);
    }

    // El selector nativo solo se ofrece donde de verdad ayuda: pantalla táctil
    // y navegador que sepa abrirlo a pedido.
    var HAY_PICKER = typeof HTMLInputElement !== 'undefined' &&
                     typeof HTMLInputElement.prototype.showPicker === 'function';
    var ES_TACTIL = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

    function convertir(input) {
        if (!input || input.dataset.campoFecha) return;

        var isoInicial = NATIVO.get.call(input);

        input.dataset.campoFecha = '1';   // marca para el CSS y para no repetir
        input.type = 'text';
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('maxlength', '10');
        if (!input.getAttribute('placeholder')) input.setAttribute('placeholder', 'MM/DD/AAAA');

        // El resto de la app sigue hablando ISO con este campo. Mientras está
        // en modo date (selector abierto) el valor nativo YA es ISO, así que
        // se devuelve tal cual.
        Object.defineProperty(input, 'value', {
            configurable: true,
            get: function () {
                var crudo = NATIVO.get.call(input);
                return input.type === 'date' ? crudo : usuarioAIso(crudo);
            },
            set: function (v) {
                NATIVO.set.call(input, input.type === 'date' ? (v || '') : isoAUsuario(v));
            }
        });

        input.value = isoInicial;   // pasa por el setter: ya se ve MM/DD/AAAA

        input.addEventListener('input', function () {
            var pos = input.selectionStart;
            var antes = NATIVO.get.call(input);
            var despues = enmascarar(antes);
            if (antes !== despues) {
                NATIVO.set.call(input, despues);
                // Al agregar una barra el cursor debe saltarla, si no queda
                // detrás y el siguiente dígito entra en el lugar equivocado.
                try { input.setSelectionRange(pos + (despues.length - antes.length), pos + (despues.length - antes.length)); } catch (e) {}
            }
        });

        // Lo que quedó a medias o no existe (un 02/31) se descarta al salir.
        // Dejarlo escrito haría creer que se guardó algo que nunca se envió.
        input.addEventListener('blur', function () {
            if (input.type === 'date') return;
            var t = NATIVO.get.call(input);
            if (t && !usuarioAIso(t)) NATIVO.set.call(input, '');
        });

        if (HAY_PICKER && ES_TACTIL) {
            input.addEventListener('focus', function () {
                if (input.type === 'date') return;
                var iso = input.value;                 // por el getter: ISO
                input.type = 'date';
                NATIVO.set.call(input, iso || '');
                try { input.showPicker(); } catch (e) { /* el navegador puede negarse */ }
            });
            // Al elegir una fecha o al salir se vuelve a texto. El evento
            // 'change' original sigue su curso solo: no se relanza, o el código
            // que escucha el filtro lo recibiría dos veces.
            var aTexto = function () {
                if (input.type !== 'date') return;
                var iso = NATIVO.get.call(input);
                input.type = 'text';
                NATIVO.set.call(input, isoAUsuario(iso));
            };
            input.addEventListener('change', aTexto);
            input.addEventListener('blur', aTexto);
        }
    }

    function convertirTodos(raiz) {
        var campos = (raiz || document).querySelectorAll('input[type="date"]');
        for (var i = 0; i < campos.length; i++) convertir(campos[i]);
    }

    // Doce de los diecisiete archivos arman estos campos con innerHTML después
    // de cargar la página, así que una sola pasada al inicio no alcanza.
    function observar() {
        if (!window.MutationObserver) return;
        new MutationObserver(function (mutaciones) {
            for (var i = 0; i < mutaciones.length; i++) {
                var nodos = mutaciones[i].addedNodes;
                for (var j = 0; j < nodos.length; j++) {
                    var n = nodos[j];
                    if (n.nodeType !== 1) continue;
                    if (n.tagName === 'INPUT' && n.type === 'date') convertir(n);
                    else if (n.querySelectorAll) convertirTodos(n);
                }
            }
        }).observe(document.documentElement, { childList: true, subtree: true });
    }

    function iniciar() { convertirTodos(document); observar(); }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }

    // Se exponen por si alguna pantalla necesita formatear por su cuenta.
    window.fechaISOaUsuario = isoAUsuario;
    window.fechaUsuarioAISO = usuarioAIso;
})();
