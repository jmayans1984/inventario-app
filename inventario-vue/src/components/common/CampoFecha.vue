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
-->
<template>
  <v-text-field
    v-if="esVuetify"
    ref="campoV"
    type="text"
    inputmode="numeric"
    autocomplete="off"
    placeholder="MM/DD/AAAA"
    :model-value="texto"
    :disabled="disabled"
    v-bind="$attrs"
    @update:model-value="alEscribirTexto"
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
    :value="texto"
    :disabled="disabled"
    v-bind="$attrs"
    @input="alEscribirInput"
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
import { ref, computed, useAttrs, watch } from 'vue'
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

// El menú se ancla al elemento real del campo, sea el <input> o la raíz del
// v-text-field.
const anclaMenu = computed(() => (esVuetify.value ? campoV.value?.$el : campo.value) || undefined)

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
