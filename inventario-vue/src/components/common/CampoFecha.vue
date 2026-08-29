<!--
  CampoFecha — reemplazo del campo de fecha nativo

  El control nativo muestra la fecha según el idioma del NAVEGADOR, no según
  el de la página: en un Chrome en inglés se ve 08/26/2026 y en uno en español
  26/08/2026, con el mismo código. El atributo lang no lo cambia. Por eso dos
  usuarios de la misma empresa veían formatos distintos en el mismo informe.

  Este componente muestra siempre MM/DD/AAAA y sigue guardando 'YYYY-MM-DD',
  así que para el resto de la app y para el backend nada cambia.

  Rinde de dos formas según cómo se lo llame, porque en la app conviven dos
  estilos de campo y ninguno debía cambiar de aspecto:

  · Con props de Vuetify (label, variant, density…) rinde un v-text-field,
    que es lo que había en los formularios. Así conserva su etiqueta, su
    contorno y los mensajes de error.

  · Sin ellas rinde un <input> pelado y le pasa la clase tal cual. Los filtros
    de los informes llevan clases propias (.cp-date, .rm-date, .mes-input…)
    que controlan ancho y posición dentro de un flex; meterlos en un
    contenedor las habría dejado sin efecto.

  El calendario va en un v-menu, que Vuetify saca a su capa de overlay: no
  ocupa lugar en el flujo y por eso tampoco altera ningún layout.

  Sobre cómo se abre ese calendario: el campo nativo lo abría al pulsar su
  iconito, no al hacer clic en cualquier parte, porque el resto del campo es
  para escribir. Aquí se respeta lo mismo — en el modo Vuetify con el icono
  del propio componente, y en el modo pelado con un icono dibujado de fondo
  cuya zona de clic se detecta por la posición del puntero. Así no hace falta
  envolver el input en nada.
-->
<template>
  <v-text-field
    v-if="esVuetify"
    ref="campoV"
    type="text"
    inputmode="numeric"
    autocomplete="off"
    placeholder="MM/DD/AAAA"
    append-inner-icon="mdi-calendar"
    :model-value="texto"
    :disabled="disabled"
    v-bind="$attrs"
    @update:model-value="alEscribirTexto"
    @click:append-inner="abrir = !abrir"
    @blur="alSalir"
    @keydown.down.prevent="abrir = true"
    @keydown.esc="abrir = false"
  />

  <input
    v-else
    ref="campo"
    type="text"
    inputmode="numeric"
    autocomplete="off"
    placeholder="MM/DD/AAAA"
    class="cf-input"
    :value="texto"
    :disabled="disabled"
    v-bind="$attrs"
    @input="alEscribirInput"
    @mousedown="quizasAbrir"
    @blur="alSalir"
    @keydown.down.prevent="abrir = true"
    @keydown.esc="abrir = false"
  />

  <v-menu
    v-model="abrir"
    :target="anclaMenu"
    :close-on-content-click="false"
    location="bottom start"
    origin="top start"
  >
    <v-date-picker
      :model-value="fechaPicker"
      hide-header
      show-adjacent-months
      @update:model-value="alElegirEnCalendario"
    />
  </v-menu>
</template>

<script setup>
import { ref, computed, useAttrs, watch, getCurrentInstance, onMounted } from 'vue'
import { isoAUsuario, usuarioAIso, enmascarar } from '../../utils/fechaUS.js'

// Las clases y demás atributos deben caer sobre el campo, no sobre la raíz
// del componente, porque junto al campo se renderiza también el v-menu.
defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: String, default: '' },   // siempre 'YYYY-MM-DD'
  disabled:   { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'change'])

const attrs = useAttrs()

// Props que solo entiende Vuetify. Si viene alguna, el campo tiene que ser un
// v-text-field: en un <input> pelado se perderían la etiqueta, el contorno y
// los mensajes de error, sin que nada avise.
const PROPS_VUETIFY = ['label', 'variant', 'density', 'hide-details', 'hideDetails',
                       'error-messages', 'errorMessages', 'prepend-inner-icon',
                       'prependInnerIcon', 'clearable', 'rules']
const esVuetify = computed(() => PROPS_VUETIFY.some(p => p in attrs))

const campo   = ref(null)
const campoV  = ref(null)
const abrir   = ref(false)
const texto   = ref(isoAUsuario(props.modelValue))

// El componente rinde el campo junto al v-menu del calendario, así que para
// Vue son dos raíces (un fragmento). Vue solo copia el atributo de estilos
// "scoped" del padre a la raíz cuando el hijo tiene una única raíz — con dos
// nunca lo hace. Por eso las clases propias de cada pantalla (.ivc-input,
// .drw-input, .rm-date…) se aplicaban al campo pero su selector, que exige
// ese atributo, no encontraba con qué hacer match: el campo se quedaba sin
// borde, sin fondo, sin nada de lo que esa clase define.
// Vue sí deja ese atributo disponible en el vnode aunque no lo copie solo,
// así que se copia a mano al elemento real del campo.
const instancia    = getCurrentInstance()
const scopeIdPadre = instancia?.vnode?.scopeId
function aplicarScopeDelPadre() {
  if (!scopeIdPadre) return
  const el = esVuetify.value ? campoV.value?.$el : campo.value
  if (el && !el.hasAttribute(scopeIdPadre)) el.setAttribute(scopeIdPadre, '')
}
onMounted(aplicarScopeDelPadre)

// El menú se ancla al elemento real del campo, sea el <input> o la raíz del
// v-text-field.
const anclaMenu = computed(() => (esVuetify.value ? campoV.value?.$el : campo.value) || undefined)

// Ancho de la zona del icono, en píxeles. Coincide con el padding derecho que
// le pone el estilo de abajo.
const ZONA_ICONO = 32

// Solo abre el calendario si el clic cayó sobre el icono. En el resto del
// campo el clic tiene que colocar el cursor para escribir, como en cualquier
// caja de texto.
function quizasAbrir(e) {
  if (props.disabled) return
  const el = e.currentTarget
  if (e.offsetX >= el.clientWidth - ZONA_ICONO) {
    e.preventDefault()          // que no se pierda el foco al abrir el menú
    abrir.value = !abrir.value
  }
}

// Si el valor cambia desde afuera (se carga un registro, se limpia un filtro),
// el texto lo sigue. Mientras se escribe no se toca: reformatear a media
// digitación movería el cursor.
watch(() => props.modelValue, (nuevo) => {
  if (usuarioAIso(texto.value) === (nuevo || '')) return
  texto.value = isoAUsuario(nuevo)
})

function propagar(valor) {
  texto.value = enmascarar(valor)
  const iso = usuarioAIso(texto.value)
  // Se avisa cuando la fecha ya está completa, y también cuando se vacía el
  // campo: borrar un filtro tiene que llegar igual que elegir una fecha.
  if (iso || texto.value === '') {
    emit('update:modelValue', iso)
    emit('change', iso)
  }
}

function alEscribirInput(e) {
  propagar(e.target.value)
  // El <input> no va con v-model, así que hay que devolverle el valor ya
  // enmascarado; si no, se queda mostrando lo que se tecleó en crudo.
  e.target.value = texto.value
}

function alEscribirTexto(v) { propagar(v) }

// Al salir, lo que quedó a medias o no existe (un 02/31) se descarta y vuelve
// la última fecha válida. Dejarlo escrito haría creer que se guardó algo que
// el backend nunca recibió.
function alSalir() {
  const iso = usuarioAIso(texto.value)
  if (!iso && texto.value !== '') {
    texto.value = isoAUsuario(props.modelValue)
    if (campo.value) campo.value.value = texto.value
  }
}

// v-date-picker trabaja con objetos Date. Se arma en hora local para que la
// conversión no corra un día.
const fechaPicker = ref(null)
watch(() => props.modelValue, (v) => {
  if (!v) { fechaPicker.value = null; return }
  const [y, m, d] = String(v).split('T')[0].split('-').map(Number)
  fechaPicker.value = (y && m && d) ? new Date(y, m - 1, d) : null
}, { immediate: true })

function alElegirEnCalendario(fecha) {
  if (!fecha) return
  const p = (n) => String(n).padStart(2, '0')
  const iso = `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}`
  texto.value = isoAUsuario(iso)
  if (campo.value) campo.value.value = texto.value
  emit('update:modelValue', iso)
  emit('change', iso)
  abrir.value = false
}
</script>

<style scoped>
/* El icono va de fondo, no como elemento: agregar un <span> obligaría a
   envolver el input en un contenedor y eso anularía las clases que cada
   pantalla usa para dar ancho y posición al campo dentro de su flex.
   El SVG lleva currentColor codificado como %23 para que el color siga al
   texto y funcione igual en tema claro y oscuro.

   Todo con !important: ahora que el campo también hace match con la clase
   propia de cada pantalla (.ivc-input, .drw-input…, ver el comentario sobre
   scopeIdPadre más arriba), esa clase suele traer su propio "background:"
   o "padding:" en forma abreviada — y una forma abreviada reinicia TODAS
   las propiedades que no menciona, borrando el icono aunque nunca haya
   tenido intención de tocarlo. El icono y su zona de clic son un contrato
   de este componente, no algo que una clase ajena deba poder pisar sin
   querer. */
.cf-input {
  padding-right: 32px !important;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='1.8' stroke-linecap='round'%3E%3Crect x='3' y='4.5' width='18' height='17' rx='2'/%3E%3Cpath d='M3 9.5h18M8 2.5v4M16 2.5v4'/%3E%3C/svg%3E") !important;
  background-repeat: no-repeat !important;
  background-position: right 9px center !important;
  background-size: 17px 17px !important;
  cursor: text;
}
.cf-input:disabled { background-image: none !important; padding-right: 14px !important; }
</style>
