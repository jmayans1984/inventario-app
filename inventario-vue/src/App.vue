<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useAuthStore } from './stores/auth'
import { useAppStore } from './stores/app'
import MiniCalculadora from './components/MiniCalculadora.vue'
import { useCalculadora } from './composables/useCalculadora'

const authStore = useAuthStore()
const appStore  = useAppStore()

const { openCalc } = useCalculadora()
const lastFocused  = ref(null)

function onFocusIn(e) {
  const el = e.target
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
    lastFocused.value = el
  }
}

function onKeyDown(e) {
  if (e.key === 'F9') {
    e.preventDefault()
    e.stopPropagation()
    openCalc(lastFocused.value)
  }
}

onMounted(() => {
  authStore.loadFromLocalStorage()
  appStore.loadFromLocalStorage()
  document.addEventListener('focusin', onFocusIn, true)
  document.addEventListener('keydown', onKeyDown, true)
})

onUnmounted(() => {
  document.removeEventListener('focusin', onFocusIn, true)
  document.removeEventListener('keydown', onKeyDown, true)
})
</script>

<template>
  <v-app :theme="appStore.tema">
    <router-view />
    <MiniCalculadora />
  </v-app>
</template>

<style>
/* ══════════════════════════════════════════════════════════════
   RESPONSIVE GLOBAL — aplica a todas las vistas dentro de .page-body
   (layout principal). No afecta a v-table/v-data-table de Vuetify,
   que ya manejan su propio responsive.
   ══════════════════════════════════════════════════════════════ */

/* Tablas HTML planas (no-Vuetify): scroll horizontal en vez de
   aplastar columnas cuando la pantalla es angosta */
@media (max-width: 900px) {
  .page-body table:not(.v-table) {
    display: block;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    white-space: nowrap;
  }
}

/* Filas de filtros/herramientas (búsqueda + selects + botones) que
   normalmente van en una sola línea: permitir que se envuelvan y
   ocupen todo el ancho en pantallas de celular */
@media (max-width: 700px) {
  .page-body [class$="-controles"],
  .page-body [class$="-grid-header"],
  .page-body [class$="-toolbar"],
  .page-body [class$="-header-actions"] {
    flex-wrap: wrap;
    row-gap: 8px;
  }
  .page-body [class$="-controles"] > *,
  .page-body [class$="-grid-header"] > .d-flex,
  .page-body [class$="-toolbar"] > * {
    width: 100%;
  }
}

/* Headers de módulo (icono + título + acción) que van en fila:
   apilar en celular para que no se corten */
@media (max-width: 600px) {
  .page-body [class$="-header"] {
    flex-wrap: wrap;
    row-gap: 10px;
  }
}
</style>
