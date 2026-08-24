<template>
  <div class="ed-wrap">
    <div class="ed-barra">
      <button
        v-for="h in HERRAMIENTAS"
        :key="h.cmd + (h.valor || '')"
        type="button"
        class="ed-btn"
        :class="{ 'ed-btn-on': activos[h.cmd + (h.valor || '')] }"
        :title="h.titulo"
        @mousedown.prevent
        @click="aplicar(h)"
      >
        <v-icon size="16">{{ h.icono }}</v-icon>
      </button>

      <span class="ed-sep"></span>

      <button
        v-for="c in COLORES"
        :key="c.clase"
        type="button"
        class="ed-color"
        :class="c.clase"
        :title="c.titulo"
        @mousedown.prevent
        @click="pintar(c.clase)"
      >A</button>

      <span class="ed-sep"></span>

      <button type="button" class="ed-btn" title="Quitar el formato de lo seleccionado"
        @mousedown.prevent @click="limpiarFormato">
        <v-icon size="16">mdi-format-clear</v-icon>
      </button>
    </div>

    <div
      ref="caja"
      class="ed-caja"
      contenteditable="true"
      role="textbox"
      aria-multiline="true"
      :data-vacio="vacio ? 'Detalla los cambios, mejoras o nuevas características…' : ''"
      @input="emitir"
      @blur="emitir"
      @keyup="revisarActivos"
      @mouseup="revisarActivos"
      @paste="pegarSinFormato"
    ></div>

    <div class="ed-pie">
      Se ve igual para todos: los colores se adaptan solos al tema claro u oscuro.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { sanitizarHtml, textoPlano } from '../utils/sanitizarHtml.js'

const props = defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])

const caja = ref(null)
const vacio = ref(true)
const activos = ref({})

const HERRAMIENTAS = [
  { cmd: 'bold',            icono: 'mdi-format-bold',           titulo: 'Negrita' },
  { cmd: 'italic',          icono: 'mdi-format-italic',         titulo: 'Cursiva' },
  { cmd: 'formatBlock', valor: 'h3', icono: 'mdi-format-header-3', titulo: 'Título' },
  { cmd: 'formatBlock', valor: 'h4', icono: 'mdi-format-header-4', titulo: 'Subtítulo' },
  { cmd: 'insertUnorderedList', icono: 'mdi-format-list-bulleted', titulo: 'Lista' },
]

// Colores con significado, no una paleta libre: una paleta libre termina en
// avisos ilegibles y, sobre todo, en colores fijos que se pierden en el tema
// oscuro. Estas cuatro clases se adaptan solas.
const COLORES = [
  { clase: 'av-destacado', titulo: 'Destacado' },
  { clase: 'av-alerta',    titulo: 'Advertencia' },
  { clase: 'av-exito',     titulo: 'Novedad' },
  { clase: 'av-tenue',     titulo: 'Nota al margen' },
]

onMounted(() => {
  caja.value.innerHTML = sanitizarHtml(props.modelValue)
  vacio.value = !textoPlano(caja.value.innerHTML)
})

// Si el formulario se limpia desde afuera (al publicar), el editor debe seguirlo
watch(() => props.modelValue, (nuevo) => {
  if (!caja.value) return
  if (nuevo === caja.value.innerHTML) return
  if (!nuevo) {
    caja.value.innerHTML = ''
    vacio.value = true
  }
})

function emitir() {
  const html = sanitizarHtml(caja.value.innerHTML)
  vacio.value = !textoPlano(html)
  emit('update:modelValue', vacio.value ? '' : html)
}

function aplicar(h) {
  caja.value.focus()
  // Volver a pulsar un título lo devuelve a párrafo, que es lo que uno espera
  if (h.cmd === 'formatBlock' && activos.value[h.cmd + h.valor]) {
    document.execCommand('formatBlock', false, 'p')
  } else {
    document.execCommand(h.cmd, false, h.valor || null)
  }
  emitir()
  revisarActivos()
}

function pintar(clase) {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed) return   // sin nada seleccionado no hay qué pintar
  const rango = sel.getRangeAt(0)
  const span = document.createElement('span')
  span.className = clase
  try {
    span.appendChild(rango.extractContents())
    rango.insertNode(span)
    sel.removeAllRanges()
  } catch {
    // Si la selección cruza varios bloques el navegador no deja envolverla;
    // se deja como estaba en vez de romper el contenido.
  }
  emitir()
}

function limpiarFormato() {
  caja.value.focus()
  document.execCommand('removeFormat')
  // removeFormat no quita los span de color, hay que sacarlos a mano
  const sel = window.getSelection()
  if (sel && !sel.isCollapsed) {
    const rango = sel.getRangeAt(0)
    const frag = rango.cloneContents()
    frag.querySelectorAll('span').forEach(s => s.replaceWith(...s.childNodes))
    rango.deleteContents()
    rango.insertNode(frag)
  }
  emitir()
}

// Pegar desde Word o una web traería estilos ajenos y HTML impredecible.
function pegarSinFormato(e) {
  e.preventDefault()
  const texto = (e.clipboardData || window.clipboardData).getData('text/plain')
  document.execCommand('insertText', false, texto)
}

function revisarActivos() {
  const est = {}
  for (const h of HERRAMIENTAS) {
    try {
      est[h.cmd + (h.valor || '')] = h.valor
        ? document.queryCommandValue('formatBlock').toLowerCase() === h.valor
        : document.queryCommandState(h.cmd)
    } catch { est[h.cmd + (h.valor || '')] = false }
  }
  activos.value = est
}
</script>

<style scoped>
.ed-wrap {
  border: 1px solid rgba(var(--v-theme-on-surface), .22);
  border-radius: 8px;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
}
.ed-wrap:focus-within { border-color: rgb(var(--v-theme-primary)); }

.ed-barra {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-wrap: wrap;
  padding: 6px 8px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .1);
  background: rgba(var(--v-theme-on-surface), .03);
}
.ed-btn {
  width: 30px; height: 30px;
  display: inline-flex; align-items: center; justify-content: center;
  border: none; border-radius: 6px;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), .7);
  cursor: pointer;
}
.ed-btn:hover { background: rgba(var(--v-theme-on-surface), .08); }
.ed-btn-on {
  background: rgba(var(--v-theme-primary), .14);
  color: rgb(var(--v-theme-primary));
}
.ed-sep {
  width: 1px; height: 18px; margin: 0 4px;
  background: rgba(var(--v-theme-on-surface), .14);
}
.ed-color {
  width: 26px; height: 26px;
  border-radius: 6px; cursor: pointer;
  font-weight: 900; font-size: 13px; line-height: 1;
  border: 1px solid rgba(var(--v-theme-on-surface), .16);
  background: transparent;
}
.ed-color:hover { border-color: currentColor; }

.ed-caja {
  min-height: 150px;
  max-height: 320px;
  overflow-y: auto;
  padding: 12px 14px;
  font-size: 14px;
  line-height: 1.6;
  outline: none;
  color: rgb(var(--v-theme-on-surface));
}
.ed-caja[data-vacio]:empty::before,
.ed-caja[data-vacio]:not(:empty):has(> br:only-child)::before {
  content: attr(data-vacio);
  color: rgba(var(--v-theme-on-surface), .38);
  pointer-events: none;
}
.ed-pie {
  padding: 6px 12px;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), .45);
  border-top: 1px solid rgba(var(--v-theme-on-surface), .08);
}
</style>

<!-- Los estilos del contenido no van con scope: se comparten con la vista del
     aviso, para que lo que se escribe se vea exactamente igual al publicarse. -->
<style>
.ed-caja h3, .aviso-fmt h3 { font-size: 16px; font-weight: 800; margin: 12px 0 4px; line-height: 1.3; }
.ed-caja h4, .aviso-fmt h4 { font-size: 14px; font-weight: 700; margin: 10px 0 3px; line-height: 1.3; }
.ed-caja h3:first-child, .aviso-fmt h3:first-child,
.ed-caja h4:first-child, .aviso-fmt h4:first-child { margin-top: 0; }
.ed-caja p, .aviso-fmt p { margin: 0 0 8px; }
.ed-caja ul, .ed-caja ol, .aviso-fmt ul, .aviso-fmt ol { margin: 6px 0 10px; padding-left: 22px; }
.ed-caja li, .aviso-fmt li { margin-bottom: 3px; }

/* Los cuatro colores con significado, definidos explicitamente por tema.
   Al principio salian de los tokens --gold/--error/--success, pero el ambar
   del tema claro (#b8720b) daba 3.85:1 sobre blanco y el gris tenue 3.94:1,
   los dos por debajo del minimo de 4.5. Estos valores si cumplen, y quedan
   fijados aqui para que un cambio de marca no los baje sin que nos demos
   cuenta. */
.av-destacado { color: #966008; font-weight: 700; }   /* 5.29:1 sobre blanco */
.av-alerta    { color: #c62828; font-weight: 700; }   /* 5.05:1 */
.av-exito     { color: #15803d; font-weight: 700; }   /* 5.02:1 */
.av-tenue     { color: rgba(27, 24, 21, .68); }       /* 6.08:1 */

.v-theme--dark .av-destacado, .v-theme--dark .ed-caja .av-destacado { color: #f0a83c; }
.v-theme--dark .av-alerta,    .v-theme--dark .ed-caja .av-alerta    { color: #f87171; }
.v-theme--dark .av-exito,     .v-theme--dark .ed-caja .av-exito     { color: #4ade80; }
.v-theme--dark .av-tenue,     .v-theme--dark .ed-caja .av-tenue     { color: rgba(245, 241, 232, .70); }
</style>
