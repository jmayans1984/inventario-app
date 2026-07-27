<template>
  <v-layout>
    <!-- ═══════════════════════════════════════════ SIDEBAR -->
    <v-navigation-drawer
      v-model="drawer"
      :permanent="!isMobile"
      :temporary="isMobile"
      :width="isMobile ? 300 : (collapsed ? 76 : 264)"
      class="sidebar"
      :class="{ 'sidebar--collapsed': !isMobile && collapsed }"
    >
      <!-- Mobile: cabecera del drawer con usuario -->
      <div v-if="isMobile" class="drawer-mobile-header">
        <div class="drawer-mobile-user">
          <v-avatar color="var(--sidebar-accent)" size="40">
            <span style="font-size:14px;font-weight:800;color:#111">{{ avatarInitials }}</span>
          </v-avatar>
          <div class="drawer-mobile-user-info">
            <div class="drawer-mobile-username">{{ authStore.userName }}</div>
            <div class="drawer-mobile-empresa">{{ authStore.empresaNombre }}</div>
          </div>
        </div>
        <button class="drawer-close-btn" @click="drawer = false">
          <v-icon size="20" color="rgba(255,255,255,0.5)">mdi-close</v-icon>
        </button>
      </div>

      <!-- Desktop: logo -->
      <div v-else class="sidebar-logo">
        <img :src="logoSrc" class="sidebar-logo-img" alt="Logo" />
        <div v-if="!collapsed" class="sidebar-logo-text">
          <div class="sidebar-logo-title">RestManager Pro</div>
          <div class="sidebar-logo-sub">Sistema ERP · v{{ APP_VERSION }}</div>
        </div>
        <button class="sidebar-collapse-btn" :class="{ 'sidebar-collapse-btn--collapsed': collapsed }" @click="toggleCollapsed" :title="collapsed ? 'Expandir menú' : 'Colapsar menú'">
          <v-icon size="16">mdi-chevron-left</v-icon>
        </button>
      </div>

      <v-divider color="white" opacity="0.1" class="mb-1"></v-divider>

      <!-- Menu -->
      <div class="sidebar-menu">
        <template v-for="mod in modules" :key="mod.id">

          <!-- Sin submenús (INICIO) -->
          <router-link
            v-if="!mod.children.length"
            :to="mod.path"
            custom
            v-slot="{ isActive, navigate }"
          >
            <div
              class="menu-item"
              :class="{ 'menu-item-active': isActive }"
              :style="{ '--mod-color': mod.color }"
              @click="() => { navigate(); if (isMobile) drawer = false }"
            >
              <v-icon size="17" class="menu-icon">{{ mod.icon }}</v-icon>
              <span class="menu-label">{{ mod.name }}</span>
            </div>
          </router-link>

          <!-- Con submenús -->
          <div v-else :style="{ '--mod-color': mod.color }">
            <router-link
              :to="mod.path"
              custom
              v-slot="{ isActive, navigate }"
            >
              <div
                class="menu-item"
                :class="{ 'menu-item-active': isActive, 'menu-item-open': openModules[mod.id] }"
                :title="collapsed ? mod.name : null"
                @click="onModuleClick(mod, navigate)"
              >
                <v-icon size="17" class="menu-icon">{{ mod.icon }}</v-icon>
                <span v-if="!collapsed" class="menu-label">{{ mod.name }}</span>
                <v-icon
                  v-if="!collapsed"
                  size="14"
                  class="menu-chevron"
                  :class="{ rotated: openModules[mod.id] }"
                  @click.stop="toggleModule(mod.id)"
                >
                  mdi-chevron-down
                </v-icon>
              </div>
            </router-link>

            <!-- Categorías (nivel 2) -->
            <div v-show="openModules[mod.id] && !collapsed">
              <div v-for="cat in mod.children" :key="cat.name">
                <div
                  class="menu-cat"
                  :class="{ 'menu-cat-open': openCats[mod.id + cat.name] }"
                  @click="toggleCat(mod.id + cat.name)"
                >
                  <v-icon size="14" class="cat-icon">{{ cat.icon }}</v-icon>
                  <span class="cat-label">{{ cat.name }}</span>
                  <v-icon size="12" class="menu-chevron" :class="{ rotated: openCats[mod.id + cat.name] }">
                    mdi-chevron-down
                  </v-icon>
                </div>

                <!-- Ítems (nivel 3) -->
                <div v-show="openCats[mod.id + cat.name]">
                  <router-link
                    v-for="item in cat.items"
                    :key="item.path"
                    :to="item.path"
                    custom
                    v-slot="{ isActive, navigate }"
                  >
                    <div
                      class="menu-leaf"
                      :class="{ 'menu-leaf-active': isActive }"
                      @click="() => { navigate(); if (isMobile) drawer = false }"
                    >
                      <span class="leaf-dot"></span>
                      <span class="leaf-label">{{ item.name }}</span>
                    </div>
                  </router-link>
                </div>
              </div>
            </div>
          </div>

        </template>
      </div>

      <!-- Footer -->
      <template #append>
        <v-divider color="white" opacity="0.1"></v-divider>
        <!-- Desktop footer con usuario -->
        <div v-if="!isMobile" class="sidebar-footer" :title="collapsed ? authStore.userName : null">
          <v-avatar color="var(--sidebar-accent)" size="32">
            <span style="font-size:12px;font-weight:800;color:#1b1508">{{ avatarInitials }}</span>
          </v-avatar>
          <div v-if="!collapsed" class="sidebar-footer-info">
            <div class="sidebar-footer-user">{{ authStore.userName }}</div>
            <div class="sidebar-footer-empresa">{{ authStore.empresaNombre }}</div>
          </div>
        </div>
        <!-- Mobile footer con logout -->
        <div v-else class="mobile-drawer-footer">
          <button class="mobile-logout-btn" @click="handleLogout">
            <v-icon size="18">mdi-logout-variant</v-icon>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- ═══════════════════════════════════════════ MAIN -->
    <v-main class="main-content">

      <!-- MOBILE HEADER -->
      <div v-if="isMobile" class="mobile-header">
        <span class="mobile-page-title">{{ currentModuleTitle }}</span>

        <div class="mobile-header-actions">
          <!-- Notificaciones móvil -->
          <v-menu location="bottom end" :close-on-content-click="false">
            <template #activator="{ props }">
              <button v-bind="props" class="mobile-action-btn">
                <v-icon size="21">mdi-bell-outline</v-icon>
                <span v-if="notificacionesSinLeer > 0" class="mobile-badge">{{ notificacionesSinLeer > 9 ? '9+' : notificacionesSinLeer }}</span>
              </button>
            </template>
            <div class="notif-panel">
              <div class="notif-panel-header">
                <span class="notif-panel-title">Notificaciones</span>
                <div v-if="notificaciones.length > 0" class="notif-header-btns">
                  <button class="notif-hbtn notif-hbtn-red" @mousedown.stop.prevent="eliminarTodas">Limpiar</button>
                </div>
              </div>
              <div v-if="notificaciones.length === 0" class="notif-empty">
                <v-icon size="32" color="#ccc">mdi-bell-off-outline</v-icon>
                <p>Sin notificaciones</p>
              </div>
              <div v-else class="notif-list">
                <div
                  v-for="n in notificaciones"
                  :key="n.id"
                  class="notif-item"
                  :class="{ 'notif-sin-leer': n.leida === 'NO' }"
                >
                  <v-icon :color="obtenerColorTipo(n.tipo)" size="18" class="notif-icon">{{ obtenerIconoTipo(n.tipo) }}</v-icon>
                  <div class="notif-body">
                    <div class="notif-titulo">{{ n.titulo }}</div>
                    <div class="notif-mensaje">{{ n.mensaje }}</div>
                    <div class="notif-fecha">{{ formatFecha(n.fecha_creacion) }}</div>
                  </div>
                  <button class="notif-action-btn notif-action-del" @mousedown.stop.prevent="descartarNotificacion(n)">✕</button>
                </div>
              </div>
            </div>
          </v-menu>

          <!-- Tema -->
          <button class="mobile-action-btn" @click="toggleTema">
            <v-icon size="20">{{ appStore.isDarkMode ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
          </button>
        </div>
      </div>

      <!-- DESKTOP HEADER -->
      <div v-else class="app-header">
        <div class="header-left">
          <h1 class="header-page-title">{{ currentModuleTitle }}</h1>
          <p class="header-date">{{ currentDate }}</p>
        </div>

        <div class="header-right">
          <!-- Notificaciones desktop -->
          <v-menu location="bottom end" :close-on-content-click="false">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                icon
                variant="text"
                size="small"
                class="header-btn"
                :color="notificacionesSinLeer > 0 ? 'warning' : 'inherit'"
              >
                <v-icon>mdi-bell-outline</v-icon>
                <v-badge
                  v-if="notificacionesSinLeer > 0"
                  color="error"
                  floating
                  :content="notificacionesSinLeer > 9 ? '9+' : notificacionesSinLeer"
                />
              </v-btn>
            </template>

            <div class="notif-panel">
              <div class="notif-panel-header">
                <span class="notif-panel-title">Notificaciones</span>
                <div v-if="notificaciones.length > 0" class="notif-header-btns">
                  <button class="notif-hbtn notif-hbtn-red" @mousedown.stop.prevent="eliminarTodas">Limpiar todo</button>
                </div>
              </div>
              <div v-if="notificaciones.length === 0" class="notif-empty">
                <v-icon size="32" color="#ccc">mdi-bell-off-outline</v-icon>
                <p>Sin notificaciones</p>
              </div>
              <div v-else class="notif-list">
                <div
                  v-for="n in notificaciones"
                  :key="n.id"
                  class="notif-item"
                  :class="{ 'notif-sin-leer': n.leida === 'NO' }"
                >
                  <v-icon :color="obtenerColorTipo(n.tipo)" size="18" class="notif-icon">{{ obtenerIconoTipo(n.tipo) }}</v-icon>
                  <div class="notif-body">
                    <div class="notif-titulo">{{ n.titulo }}</div>
                    <div class="notif-mensaje">{{ n.mensaje }}</div>
                    <div class="notif-fecha">{{ formatFecha(n.fecha_creacion) }}</div>
                  </div>
                  <button class="notif-action-btn notif-action-del" @mousedown.stop.prevent="descartarNotificacion(n)">✕</button>
                </div>
              </div>
            </div>
          </v-menu>

          <!-- Tema -->
          <v-btn
            :icon="appStore.isDarkMode ? 'mdi-weather-sunny' : 'mdi-weather-night'"
            variant="text"
            size="small"
            class="header-btn"
            @click="toggleTema"
          ></v-btn>

          <v-divider vertical class="mx-3 border-opacity-20"></v-divider>

          <!-- Usuario + Empresa -->
          <div class="header-user">
            <div class="header-user-texts">
              <span class="header-username">{{ authStore.userName }}</span>
              <span class="header-empresa">{{ authStore.empresaNombre || 'Sin empresa' }}</span>
            </div>
            <v-avatar color="var(--sidebar-accent)" size="38">
              <span style="font-size:14px;font-weight:800;color:#111">{{ avatarInitials }}</span>
            </v-avatar>
          </div>

          <v-btn
            variant="tonal"
            color="error"
            size="small"
            class="ml-2 logout-btn"
            prepend-icon="mdi-logout-variant"
            @click="handleLogout"
          >
            Salir
          </v-btn>
        </div>
      </div>

      <!-- Línea separadora -->
      <div class="header-divider"></div>

      <!-- CONTENIDO -->
      <div class="page-body" :class="{ 'has-bottom-nav': isMobile }">
        <slot />
      </div>

    </v-main>

    <!-- ═══════════════════════════════════ BOTTOM NAVIGATION (mobile) -->
    <div v-if="isMobile" class="bottom-nav">
      <button
        v-for="b in bottomNavButtons"
        :key="b.id"
        class="bn-btn"
        :class="{ 'bn-btn-active': bottomNavActiveId === b.id }"
        :style="{ '--bn-color': b.color }"
        @click="onBottomNavClick(b)"
      >
        <v-icon size="21">{{ b.icon }}</v-icon>
        <span class="bn-label">{{ bottomNavLabel(b) }}</span>
      </button>
      <button class="bn-btn" :class="{ 'bn-btn-active': moreSheet || (activeModuleForSheet && !bottomNavPriority.includes(activeModuleForSheet.id)) }" @click="moreSheet = true">
        <v-icon size="21">mdi-dots-horizontal</v-icon>
        <span class="bn-label">Más</span>
      </button>
    </div>

    <!-- Sheet: grid de módulos restantes -->
    <v-bottom-sheet v-model="moreSheet">
      <div class="sheet-card">
        <div class="sheet-handle"></div>
        <div class="sheet-title">Más Módulos</div>
        <div class="more-grid">
          <button
            v-for="mod in moreModules"
            :key="mod.id"
            class="more-tile"
            :style="{ '--mod-color': mod.color }"
            @click="onMoreTileClick(mod)"
          >
            <div class="more-tile-icon"><v-icon size="22" color="white">{{ mod.icon }}</v-icon></div>
            <span class="more-tile-label">{{ mod.name }}</span>
          </button>
        </div>
      </div>
    </v-bottom-sheet>

    <!-- Sheet: contenido (categorías/ítems) del módulo seleccionado -->
    <v-bottom-sheet v-model="moduleSheet">
      <div class="sheet-card sheet-card--module" v-if="activeModuleForSheet">
        <div class="sheet-handle"></div>
        <div class="sheet-module-header" :style="{ '--mod-color': activeModuleForSheet.color }">
          <div class="sheet-module-icon"><v-icon size="19" color="white">{{ activeModuleForSheet.icon }}</v-icon></div>
          <span class="sheet-module-title">{{ activeModuleForSheet.name }}</span>
        </div>
        <div class="sheet-module-body">
          <div v-for="cat in activeModuleForSheet.children" :key="cat.name" class="sheet-cat-block">
            <div class="sheet-cat-header" @click="toggleSheetCat(cat.name)">
              <v-icon size="15" color="rgba(var(--v-theme-on-surface),.5)">{{ cat.icon }}</v-icon>
              <span>{{ cat.name }}</span>
              <v-icon size="13" class="sheet-chevron" :class="{ rotated: sheetOpenCats[cat.name] }">mdi-chevron-down</v-icon>
            </div>
            <div v-show="sheetOpenCats[cat.name]" class="sheet-items">
              <button
                v-for="item in cat.items"
                :key="item.path"
                class="sheet-item"
                :class="{ 'sheet-item-active': route.path === item.path }"
                @click="goToItem(item.path)"
              >
                {{ item.name }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </v-bottom-sheet>

    <!-- Popup automático de actualizaciones (una vez por usuario, hasta que haya una nueva) -->
    <ActualizacionesModal v-model:mostrar="mostrarActualizacionesAuto" @update:mostrar="onCerrarActualizacionesAuto" />
  </v-layout>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '../../stores/auth'
import { useAppStore } from '../../stores/app'
import { MODULES, APP_VERSION } from '../../utils/constants'
import { formatFechaLarga } from '../../utils/formatters'
import { notificacionesService } from '../../services/notificaciones.service'
import ActualizacionesModal from '../ActualizacionesModal.vue'
import { useCalculadora } from '../../composables/useCalculadora'
import logoSrc from '../../assets/logo.png'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()
const display = useDisplay()

const isMobile = computed(() => display.mobile.value)
const drawer = ref(true)
const collapsed = ref(localStorage.getItem('_sidebarCollapsed') === '1')
function toggleCollapsed() {
  collapsed.value = !collapsed.value
  localStorage.setItem('_sidebarCollapsed', collapsed.value ? '1' : '0')
}

// En mobile el drawer empieza cerrado
watch(isMobile, (val) => {
  drawer.value = !val
}, { immediate: true })

const currentDate = ref('')

function rutaPermitida(path) {
  if (!path) return true
  const dis = authStore.modulosDeshabilitados
  if (!dis || !dis.length) return true
  return !dis.some(d => path === d || path.startsWith(d + '/'))
}

const modules = computed(() => {
  const tipo = authStore.empresaTipo
  return MODULES
    .filter(mod => rutaPermitida(mod.path) && (!mod.requiredTipo || mod.requiredTipo === tipo))
    .map(mod => ({
      ...mod,
      children: (mod.children || []).map(cat => ({
        ...cat,
        items: (cat.items || []).filter(item =>
          (!item.requiredTipo || item.requiredTipo === tipo) &&
          !item.hidden &&
          rutaPermitida(item.path)
        ),
      })).filter(cat => cat.keepEmpty || !cat.items || cat.items.length > 0),
    }))
})

const openModules = reactive({})
const openCats = reactive({})

const toggleModule = (id) => { openModules[id] = !openModules[id] }
const toggleCat = (key) => { openCats[key] = !openCats[key] }

function onModuleClick(mod, navigate) {
  if (collapsed.value) {
    // En modo colapsado, un click expande el sidebar y abre el módulo en vez de navegar de inmediato
    collapsed.value = false
    localStorage.setItem('_sidebarCollapsed', '0')
    openModules[mod.id] = true
    return
  }
  navigate()
}

const currentModuleTitle = computed(() => {
  const found = MODULES.find(m => route.path === m.path || route.path.startsWith(m.path + '/'))
  return found?.name || 'INICIO'
})

// ─── Bottom Navigation (mobile) ─────────────────────────────────────────────
const bottomNavPriority = ['contabilidad', 'tesoreria', 'almacen', 'nomina']
const BOTTOM_NAV_LABELS = { contabilidad: 'Contab.', tesoreria: 'Tesorería', almacen: 'Almacén', nomina: 'Nómina' }

const moreSheet     = ref(false)
const moduleSheet   = ref(false)
const activeModuleId = ref(null)
const sheetOpenCats  = reactive({})

const bottomNavButtons = computed(() =>
  bottomNavPriority.map(id => modules.value.find(m => m.id === id)).filter(Boolean)
)
const moreModules = computed(() =>
  modules.value.filter(m => !bottomNavPriority.includes(m.id))
)
const activeModuleForSheet = computed(() =>
  modules.value.find(m => m.id === activeModuleId.value) || null
)
const bottomNavActiveId = computed(() => {
  const found = modules.value.find(m => m.path && m.path !== '/' && (route.path === m.path || route.path.startsWith(m.path + '/')))
  return found?.id || null
})

function bottomNavLabel(mod) {
  return BOTTOM_NAV_LABELS[mod.id] || mod.name
}

function openModuleSheet(mod) {
  activeModuleId.value = mod.id
  Object.keys(sheetOpenCats).forEach(k => delete sheetOpenCats[k])
  const firstCat = mod.children?.find(c => c.items?.length)
  if (firstCat) sheetOpenCats[firstCat.name] = true
  moduleSheet.value = true
}

function onBottomNavClick(mod) {
  if (!mod.children?.length) {
    router.push(mod.path)
    return
  }
  openModuleSheet(mod)
}

function onMoreTileClick(mod) {
  moreSheet.value = false
  if (!mod.children?.length) {
    router.push(mod.path)
    return
  }
  openModuleSheet(mod)
}

function toggleSheetCat(name) {
  sheetOpenCats[name] = !sheetOpenCats[name]
}

function goToItem(path) {
  router.push(path)
  moduleSheet.value = false
  moreSheet.value = false
}

const avatarInitials = computed(() => {
  const name = authStore.userNombre || authStore.userName || 'US'
  return name.split(' ').map(p => p.charAt(0)).join('').toUpperCase().slice(0, 2)
})

onMounted(() => {
  currentDate.value = formatFechaLarga()
  MODULES.forEach(mod => {
    const modActive = mod.path !== '/' && (route.path === mod.path || route.path.startsWith(mod.path + '/'))
    if (modActive) {
      openModules[mod.id] = true
      mod.children?.forEach(cat => {
        const catActive = cat.items?.some(item => route.path === item.path || route.path.startsWith(item.path))
        if (catActive) openCats[mod.id + cat.name] = true
      })
    }
  })
  cargarNotificaciones(true)
  setInterval(() => cargarNotificaciones(false), 60000)
})

const notificaciones = ref([])
const notificacionesSinLeer = ref(0)
const mostrarActualizacionesAuto = ref(false)
const actualizacionesAutoIds = ref([])

function obtenerIconoTipo(tipo) {
  const iconos = {
    'stock_bajo': 'mdi-alert-circle-outline',
    'success': 'mdi-check-circle-outline',
    'info': 'mdi-information-outline',
    'warning': 'mdi-alert-outline',
    'error': 'mdi-close-circle-outline'
  }
  return iconos[tipo] || 'mdi-bell-outline'
}

function obtenerColorTipo(tipo) {
  const colores = {
    'stock_bajo': 'error',
    'success': 'success',
    'info': 'info',
    'warning': 'warning',
    'error': 'error'
  }
  return colores[tipo] || 'inherit'
}

async function cargarNotificaciones(chequearActualizaciones = false) {
  try {
    const res = await notificacionesService.obtenerNotificaciones()
    notificaciones.value = res.data || []
    const count = await notificacionesService.obtenerCountSinLeer()
    notificacionesSinLeer.value = count.data.total

    if (chequearActualizaciones) {
      const pendientes = notificaciones.value.filter(n => n.tipo === 'actualizaciones' && n.leida === 'NO')
      if (pendientes.length > 0) {
        actualizacionesAutoIds.value = pendientes.map(n => n.id)
        mostrarActualizacionesAuto.value = true
      }
    }
  } catch (e) {
    console.error('Error cargando notificaciones:', e)
  }
}

async function onCerrarActualizacionesAuto(abierto) {
  if (abierto) return
  const ids = actualizacionesAutoIds.value
  actualizacionesAutoIds.value = []
  await Promise.all(ids.map(id => notificacionesService.marcarComoLeida(id).catch(() => {})))
  notificaciones.value = notificaciones.value.map(n =>
    ids.includes(n.id) ? { ...n, leida: 'SI' } : n
  )
  try {
    const count = await notificacionesService.obtenerCountSinLeer()
    notificacionesSinLeer.value = count.data.total
  } catch { /* silencioso */ }
}

async function descartarNotificacion(n) {
  const idx = notificaciones.value.findIndex(x => x.id === n.id)
  if (idx !== -1) {
    if (n.leida === 'NO') notificacionesSinLeer.value = Math.max(0, notificacionesSinLeer.value - 1)
    notificaciones.value.splice(idx, 1)
  }
  notificacionesService.marcarComoLeida(n.id).catch(() => {})
  notificacionesService.eliminarNotificacion(n.id).catch(() => {})
}

async function eliminarTodas() {
  notificaciones.value = []
  notificacionesSinLeer.value = 0
  notificacionesService.eliminarTodasNotificaciones().catch(() => {})
}

function formatFecha(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  const ahora = new Date()
  const diff = Math.floor((ahora - d) / 1000)
  if (diff < 60) return 'Ahora'
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short' })
}

const toggleTema = () => appStore.toggleTema()

const { openCalc } = useCalculadora()

const handleLogout = () => {
  if (confirm('¿Estás seguro de cerrar sesión?')) {
    authStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
/* ─── SIDEBAR ─── */
.sidebar {
  background: var(--sidebar-bg) !important;
  border-right: 1px solid var(--sidebar-border) !important;
  transition: width var(--dur-slow) var(--ease-out) !important;
  overflow-x: hidden;
}
@media (prefers-reduced-motion: reduce) {
  .sidebar { transition: none !important; }
}

/* Mobile: header del drawer */
.drawer-mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px 16px;
  padding-top: calc(20px + env(safe-area-inset-top));
}
.drawer-mobile-user {
  display: flex;
  align-items: center;
  gap: 12px;
}
.drawer-mobile-user-info { flex: 1; }
.drawer-mobile-username {
  color: rgba(255,255,255,0.9);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.3px;
}
.drawer-mobile-empresa {
  color: rgba(255,255,255,0.4);
  font-size: 11px;
  margin-top: 1px;
}
.drawer-close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255,255,255,0.08);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* Desktop: logo */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 12px 14px;
  position: relative;
}
.sidebar-logo-img {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  flex-shrink: 0;
  object-fit: cover;
  box-shadow: 0 0 0 1px var(--gold-wash), 0 4px 12px rgba(240,168,60,0.15);
}
.sidebar-logo-text { flex: 1; min-width: 0; }
.sidebar-logo-title {
  color: var(--sidebar-text-active);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.2px;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sidebar-logo-sub {
  color: var(--sidebar-text);
  font-size: 10px;
  letter-spacing: 0.4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sidebar-collapse-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid var(--sidebar-border);
  background: var(--sidebar-surface);
  color: var(--sidebar-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform var(--dur-base) var(--ease-out), color var(--dur-base) ease, background-color var(--dur-base) ease;
}
.sidebar-collapse-btn:hover { color: var(--sidebar-text-active); background: var(--surface-hover); }
.sidebar-collapse-btn--collapsed { transform: rotate(180deg); }


/* ─── MENÚ ─── */
.sidebar-menu {
  padding: 6px 8px;
  overflow-y: auto;
  flex: 1;
}

/* Nivel 1 */
.menu-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 10px;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--sidebar-text);
  margin-bottom: 2px;
  transition: background-color var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out);
  user-select: none;
  min-height: 40px;
  border-left: 3px solid transparent;
}
.sidebar--collapsed .menu-item { justify-content: center; padding-inline: 0; }
.menu-item:hover {
  background: var(--sidebar-surface);
  color: var(--sidebar-text-hover);
}
.menu-item-active {
  background: linear-gradient(90deg, color-mix(in srgb, var(--sidebar-accent) 15%, transparent) 0%, transparent 100%);
  color: var(--sidebar-text-active);
  border-left-color: var(--sidebar-accent);
  padding-left: 7px;
}
.sidebar--collapsed .menu-item-active { padding-left: 0; border-left-color: transparent; box-shadow: inset 3px 0 0 var(--sidebar-accent); }
.menu-item-open { color: rgba(255,255,255,0.85); border-left-color: var(--mod-color, rgba(255,255,255,0.25)); }
.menu-icon { flex-shrink: 0; }
.menu-label {
  flex: 1;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.menu-chevron { flex-shrink: 0; transition: transform 0.25s ease; opacity: .6; }
.menu-chevron.rotated { transform: rotate(180deg); }

.menu-item-open + div {
  border-left: 1px solid rgba(255,255,255,0.06);
  margin-left: 18px;
  padding-left: 2px;
}

/* Nivel 2 — categoría */
.menu-cat {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 8px 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  color: rgba(255,255,255,0.6);
  margin-bottom: 1px;
  margin-top: 6px;
  transition: background-color 150ms var(--ease-out), color 150ms var(--ease-out), opacity 150ms var(--ease-out);
  user-select: none;
  min-height: 30px;
  border-left: 3px solid var(--mod-color, rgba(255,255,255,0.2));
  background: rgba(255,255,255,0.03);
  opacity: 0.65;
}
.menu-cat:hover { color: rgba(255,255,255,0.95); background: rgba(255,255,255,0.06); opacity: 1; }
.menu-cat-open { color: rgba(255,255,255,0.92); opacity: 1; }
.cat-icon { flex-shrink: 0; opacity: .8; }
.cat-label {
  flex: 1;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Nivel 3 — hoja */
.menu-leaf {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 6px 20px;
  border-radius: 6px;
  cursor: pointer;
  color: rgba(255,255,255,0.42);
  margin-bottom: 1px;
  transition: background-color 150ms var(--ease-out), color 150ms var(--ease-out), opacity 150ms var(--ease-out);
  user-select: none;
  min-height: 34px;
  border-left: 2px solid var(--mod-color, rgba(255,255,255,0.1));
  opacity: 0.7;
}
.menu-leaf:hover {
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.8);
  opacity: 1;
}
.menu-leaf-active {
  color: white !important;
  background: rgba(255,255,255,0.07) !important;
  font-weight: 600 !important;
  opacity: 1 !important;
}
.menu-leaf-active .leaf-dot {
  background: var(--mod-color, #67e8f9) !important;
  box-shadow: 0 0 6px var(--mod-color, rgba(103,232,249,0.6));
}
.leaf-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(255,255,255,0.25);
  flex-shrink: 0;
  transition: background-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out);
}
.leaf-label {
  font-size: 11px;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Footer desktop */
.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
}
.sidebar-footer-info { flex: 1; min-width: 0; }
.sidebar-footer-user {
  color: rgba(255,255,255,0.8);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sidebar-footer-empresa {
  color: rgba(255,255,255,0.35);
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Footer mobile: logout */
.mobile-drawer-footer {
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
}
.mobile-logout-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  border: none;
  border-radius: 10px;
  background: rgba(239,68,68,0.12);
  color: #f87171;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.mobile-logout-btn:hover { background: rgba(239,68,68,0.2); }

/* ─── MOBILE HEADER ─── */
.mobile-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 16px;
  padding-top: env(safe-area-inset-top);
  height: calc(56px + env(safe-area-inset-top));
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  position: sticky;
  top: 0;
  z-index: 10;
}

.mobile-page-title {
  flex: 1;
  font-size: 16px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 4px;
}

.mobile-header-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.mobile-action-btn {
  position: relative;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgb(var(--v-theme-on-surface));
}
.mobile-action-btn:active { background: rgba(var(--v-theme-on-surface), 0.08); }

.mobile-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 16px;
  height: 16px;
  background: #ef4444;
  border-radius: 8px;
  font-size: 9px;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  border: 1.5px solid rgb(var(--v-theme-surface));
}

/* ─── DESKTOP HEADER ─── */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
  background: rgb(var(--v-theme-surface));
  transition: background 0.3s;
}
.header-page-title {
  font-size: 18px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
  letter-spacing: 0.8px;
  text-transform: uppercase;
  line-height: 1.2;
}
.header-date {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.45);
  font-weight: 400;
  text-transform: capitalize;
  margin-top: 1px;
}
.header-right { display: flex; align-items: center; }
.header-btn { color: rgba(var(--v-theme-on-surface), 0.5) !important; }
.header-user { display: flex; align-items: center; gap: 10px; }
.header-user-texts { display: flex; flex-direction: column; text-align: right; }
.header-username {
  font-size: 13px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.3;
}
.header-empresa {
  font-size: 11px;
  color: var(--gold);
  font-weight: 600;
  line-height: 1.3;
}
.logout-btn { font-size: 12px !important; font-weight: 700 !important; letter-spacing: 0.8px !important; }

/* Línea separadora */
.header-divider {
  height: 1px;
  background: var(--border);
}

/* ─── CONTENT ─── */
.main-content { background: rgb(var(--v-theme-background)) !important; transition: background 0.3s; }

.page-body {
  padding: 24px;
}

@media (max-width: 600px) {
  .page-body {
    padding: 14px 14px calc(24px + env(safe-area-inset-bottom));
  }
}
.page-body.has-bottom-nav {
  padding-bottom: calc(88px + env(safe-area-inset-bottom));
}

/* ─── BOTTOM NAVIGATION (mobile) ─── */
.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  display: flex;
  background: var(--sidebar-bg);
  border-top: 1px solid rgba(255,255,255,0.06);
  padding-bottom: env(safe-area-inset-bottom);
}
.bn-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 8px 2px 7px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.45);
  cursor: pointer;
  min-width: 0;
}
.bn-btn:active { background: rgba(255,255,255,0.05); }
.bn-btn-active { color: var(--bn-color, var(--sidebar-accent)); }
.bn-label {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* ─── BOTTOM SHEETS ─── */
.sheet-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 20px 20px 0 0;
  padding: 10px 16px calc(20px + env(safe-area-inset-bottom));
  max-height: 78vh;
  overflow-y: auto;
}
.sheet-handle {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: rgba(var(--v-theme-on-surface), 0.18);
  margin: 4px auto 14px;
}
.sheet-title {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin-bottom: 14px;
}

/* Grid de "Más módulos" */
.more-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.more-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 6px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 14px;
  background: transparent;
  cursor: pointer;
}
.more-tile:active { background: rgba(var(--v-theme-on-surface), 0.05); }
.more-tile-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--mod-color, #64748b);
  display: flex;
  align-items: center;
  justify-content: center;
}
.more-tile-label {
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.25;
}

/* Contenido de módulo (categorías/ítems) */
.sheet-module-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.sheet-module-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--mod-color, #64748b);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.sheet-module-title {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface));
}
.sheet-cat-block { margin-bottom: 6px; }
.sheet-cat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 4px;
  cursor: pointer;
  user-select: none;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.6);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
.sheet-chevron { margin-left: auto; transition: transform 0.2s ease; opacity: 0.6; }
.sheet-chevron.rotated { transform: rotate(180deg); }
.sheet-items { padding: 4px 0 8px; }
.sheet-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 11px 12px 11px 24px;
  border: none;
  background: transparent;
  border-radius: 9px;
  font-size: 13.5px;
  color: rgba(var(--v-theme-on-surface), 0.75);
  cursor: pointer;
}
.sheet-item:active { background: rgba(var(--v-theme-on-surface), 0.06); }
.sheet-item-active {
  background: rgba(245,166,35,0.1) !important;
  color: var(--gold) !important;
  font-weight: 700;
}

/* ─── NOTIFICACIONES ─── */
.notif-panel {
  width: 340px;
  max-height: 480px;
  display: flex;
  flex-direction: column;
  background: rgb(var(--v-theme-surface));
}

@media (max-width: 600px) {
  .notif-panel {
    width: 300px;
  }
}

.notif-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  flex-shrink: 0;
}
.notif-panel-title {
  font-size: 13px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}
.notif-header-btns { display: flex; gap: 4px; }
.notif-hbtn {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
  transition: background .15s;
}
.notif-hbtn-red { color: #ef4444; }
.notif-hbtn-red:hover { background: rgba(239,68,68,.1); }
.notif-action-btn {
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  transition: background .15s;
  flex-shrink: 0;
}
.notif-action-del { color: #ef4444; }
.notif-action-del:hover { background: rgba(239,68,68,.15); }
.notif-empty {
  text-align: center;
  padding: 40px 20px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  font-size: 12px;
}
.notif-empty p { margin: 8px 0 0; }
.notif-list { overflow-y: auto; flex: 1; }
.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  transition: background .15s;
}
.notif-item:hover { background: rgba(var(--v-theme-on-surface), 0.03); }
.notif-sin-leer {
  background: rgba(8,145,178,0.05) !important;
  border-left: 3px solid #0891b2;
}
.notif-icon { flex-shrink: 0; margin-top: 2px; }
.notif-body { flex: 1; min-width: 0; }
.notif-titulo {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.notif-mensaje {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-top: 2px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.notif-fecha {
  font-size: 10px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  margin-top: 4px;
}
</style>
