<template>
  <v-layout>
    <!-- ═══════════════════════════════════════════ SIDEBAR -->
    <v-navigation-drawer
      v-model="drawer"
      :permanent="!isMobile"
      :temporary="isMobile"
      :width="isMobile ? 300 : 270"
      class="sidebar"
    >
      <!-- Mobile: cabecera del drawer con usuario -->
      <div v-if="isMobile" class="drawer-mobile-header">
        <div class="drawer-mobile-user">
          <v-avatar color="#667eea" size="40">
            <span class="text-white" style="font-size:14px;font-weight:700">{{ avatarInitials }}</span>
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
        <div class="sidebar-logo-icon">
          <v-icon size="22" color="white">mdi-chart-donut-variant</v-icon>
        </div>
        <div>
          <div class="sidebar-logo-title">RestManager Pro</div>
          <div class="sidebar-logo-sub">Sistema ERP</div>
        </div>
      </div>

      <v-divider color="white" opacity="0.1" class="mb-1"></v-divider>

      <!-- Menu -->
      <div class="sidebar-menu">
        <template v-for="mod in modules" :key="mod.id">

          <!-- Sin submenús (INICIO, CONFIGURACIÓN) -->
          <router-link
            v-if="!mod.children.length"
            :to="mod.path"
            custom
            v-slot="{ isActive, navigate }"
          >
            <div
              class="menu-item"
              :class="{ 'menu-item-active': isActive }"
              @click="() => { navigate(); if (isMobile) drawer = false }"
            >
              <v-icon size="17" class="menu-icon">{{ mod.icon }}</v-icon>
              <span class="menu-label">{{ mod.name }}</span>
            </div>
          </router-link>

          <!-- Con submenús -->
          <div v-else>
            <router-link
              :to="mod.path"
              custom
              v-slot="{ isActive, navigate }"
            >
              <div
                class="menu-item"
                :class="{ 'menu-item-active': isActive, 'menu-item-open': openModules[mod.id] }"
                @click="navigate"
              >
                <v-icon size="17" class="menu-icon">{{ mod.icon }}</v-icon>
                <span class="menu-label">{{ mod.name }}</span>
                <v-icon
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
            <div v-show="openModules[mod.id]">
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
        <div v-if="!isMobile" class="sidebar-footer">
          <v-avatar color="#667eea" size="32">
            <span class="text-white" style="font-size:12px;font-weight:700">{{ avatarInitials }}</span>
          </v-avatar>
          <div class="sidebar-footer-info">
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
        <button class="mobile-menu-btn" @click="drawer = !drawer">
          <v-icon size="22">mdi-menu</v-icon>
          <span v-if="notificacionesSinLeer > 0" class="menu-btn-badge"></span>
        </button>

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
            <v-avatar color="primary" size="38">
              <span class="text-white font-weight-bold" style="font-size:14px">{{ avatarInitials }}</span>
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
      <div class="page-body">
        <slot />
      </div>

    </v-main>
  </v-layout>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '../../stores/auth'
import { useAppStore } from '../../stores/app'
import { MODULES } from '../../utils/constants'
import { formatFechaLarga } from '../../utils/formatters'
import { notificacionesService } from '../../services/notificaciones.service'
import { useCalculadora } from '../../composables/useCalculadora'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()
const display = useDisplay()

const isMobile = computed(() => display.mobile.value)
const drawer = ref(true)

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
          rutaPermitida(item.path)
        ),
      })).filter(cat => cat.keepEmpty || !cat.items || cat.items.length > 0),
    }))
})

const openModules = reactive({})
const openCats = reactive({})

const toggleModule = (id) => { openModules[id] = !openModules[id] }
const toggleCat = (key) => { openCats[key] = !openCats[key] }

const currentModuleTitle = computed(() => {
  const found = MODULES.find(m => route.path === m.path || route.path.startsWith(m.path + '/'))
  return found?.name || 'INICIO'
})

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
  cargarNotificaciones()
  setInterval(cargarNotificaciones, 60000)
})

const notificaciones = ref([])
const notificacionesSinLeer = ref(0)

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

async function cargarNotificaciones() {
  try {
    const res = await notificacionesService.obtenerNotificaciones()
    notificaciones.value = res.data || []
    const count = await notificacionesService.obtenerCountSinLeer()
    notificacionesSinLeer.value = count.data.total
  } catch (e) {
    console.error('Error cargando notificaciones:', e)
  }
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
  background: linear-gradient(180deg, #0c1426 0%, #0f1e35 60%, #0a1628 100%) !important;
  border-right: 1px solid rgba(255,255,255,0.06) !important;
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
  gap: 12px;
  padding: 18px 14px 14px;
}
.sidebar-logo-icon {
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(99,102,241,0.4);
}
.sidebar-logo-title {
  color: white;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.3px;
  line-height: 1.2;
}
.sidebar-logo-sub {
  color: rgba(255,255,255,0.4);
  font-size: 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

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
  border-radius: 8px;
  cursor: pointer;
  color: rgba(255,255,255,0.5);
  margin-bottom: 2px;
  transition: all 0.18s;
  user-select: none;
  min-height: 42px;
}
.menu-item:hover {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.9);
}
.menu-item-active {
  background: linear-gradient(90deg, rgba(102,126,234,0.25) 0%, rgba(102,126,234,0.08) 100%);
  color: #a5b4fc;
  border-left: 2px solid #818cf8;
  padding-left: 8px;
}
.menu-item-open { color: rgba(255,255,255,0.85); }
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

/* Nivel 2 */
.menu-cat {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 8px 6px 14px;
  border-radius: 5px;
  cursor: pointer;
  color: rgba(255,255,255,0.35);
  margin-bottom: 1px;
  margin-top: 4px;
  transition: all 0.15s;
  user-select: none;
  min-height: 36px;
}
.menu-cat:hover { color: rgba(255,255,255,0.65); }
.menu-cat-open { color: rgba(255,255,255,0.6); }
.cat-icon { flex-shrink: 0; opacity: .7; }
.cat-label {
  flex: 1;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Nivel 3 */
.menu-leaf {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px 7px 20px;
  border-radius: 6px;
  cursor: pointer;
  color: rgba(255,255,255,0.4);
  margin-bottom: 1px;
  transition: all 0.15s;
  user-select: none;
  min-height: 38px;
}
.menu-leaf:hover {
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.75);
  padding-left: 22px;
}
.menu-leaf-active {
  color: #67e8f9 !important;
  background: rgba(103,232,249,0.08) !important;
  font-weight: 600 !important;
}
.menu-leaf-active .leaf-dot {
  background: #67e8f9 !important;
  box-shadow: 0 0 6px rgba(103,232,249,0.6);
}
.leaf-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  flex-shrink: 0;
  transition: all 0.15s;
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

.mobile-menu-btn {
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
  flex-shrink: 0;
}
.mobile-menu-btn:active { background: rgba(var(--v-theme-on-surface), 0.08); }

.menu-btn-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  border: 2px solid rgb(var(--v-theme-surface));
}

.mobile-page-title {
  flex: 1;
  font-size: 16px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
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
  color: #667eea;
  font-weight: 600;
  line-height: 1.3;
}
.logout-btn { font-size: 12px !important; font-weight: 700 !important; letter-spacing: 0.8px !important; }

/* Línea separadora */
.header-divider {
  height: 3px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
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
