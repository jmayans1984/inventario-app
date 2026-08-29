<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getActivePinia } from 'pinia'
import { useAuthStore } from './stores/auth'
import { useAppStore } from './stores/app'
import MiniCalculadora from './components/MiniCalculadora.vue'
import CommandPalette from './components/common/CommandPalette.vue'
import { useCalculadora } from './composables/useCalculadora'
import { useCommandPalette } from './composables/useCommandPalette'

const route = useRoute()
const lastFocused = ref(null)
const appTheme = ref('light')

// Estos dos composables son refs propios de Vue (singletons), sin ninguna
// dependencia de Pinia: se inicializan siempre, aquí mismo. Antes se copiaba
// "open" a un ref local dentro del guard de abajo — pero copiar un ref
// COMO VALOR de otro ref (en vez de usarlo directamente) dejaba ese ref
// local con un objeto adentro, que en la plantilla siempre es verdadero:
// por eso el buscador se abría solo al cargar la página.
const { openCalc } = useCalculadora()
const { open: commandPaletteOpen } = useCommandPalette()

// Los stores sí dependen de Pinia: se inicializan solo cuando está listo.
let authStore = null
let appStore = null
if (getActivePinia()) {
  authStore = useAuthStore()
  appStore = useAppStore()
  appTheme.value = appStore.tema
}

const appClasses = computed(() => ({
  'treasury-module': route.path.startsWith('/tesoreria'),
  'accounting-module': route.path.startsWith('/contabilidad'),
  'warehouse-module': route.path.startsWith('/almacen'),
  'production-module': route.path.startsWith('/produccion'),
  'recipes-module': route.path.startsWith('/recetas'),
  'payroll-module': route.path.startsWith('/nomina'),
}))

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
    return
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    e.stopPropagation()
    if (authStore && authStore.isAuthenticated) commandPaletteOpen.value = true
  }
}

onMounted(() => {
  // Re-inicializa si no se pudo hacer en setup
  if (!authStore || !appStore) {
    try {
      authStore = useAuthStore()
      appStore = useAppStore()
      if (appStore) appTheme.value = appStore.tema
    } catch {
      // Si aún no está listo, continúa
    }
  }

  if (authStore) authStore.loadFromLocalStorage()
  if (appStore) appStore.loadFromLocalStorage()
  document.addEventListener('focusin', onFocusIn, true)
  document.addEventListener('keydown', onKeyDown, true)
})

onUnmounted(() => {
  document.removeEventListener('focusin', onFocusIn, true)
  document.removeEventListener('keydown', onKeyDown, true)
})
</script>

<template>
  <v-app :theme="appTheme" :class="appClasses">
    <router-view />
    <MiniCalculadora />
    <CommandPalette v-model="commandPaletteOpen" />
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
