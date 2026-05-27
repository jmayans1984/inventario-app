<template>
  <v-layout>
    <!-- ═══════════════════════════════════════════ SIDEBAR -->
    <v-navigation-drawer permanent :width="270" class="sidebar">

      <!-- Logo -->
      <div class="sidebar-logo">
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
              @click="navigate"
            >
              <v-icon size="17" class="menu-icon">{{ mod.icon }}</v-icon>
              <span class="menu-label">{{ mod.name }}</span>
            </div>
          </router-link>

          <!-- Con submenús -->
          <div v-else>
            <!-- Módulo principal -->
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
                      @click="navigate"
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
        <div class="sidebar-footer">
          <v-avatar color="#667eea" size="32">
            <span class="text-white" style="font-size:12px;font-weight:700">{{ avatarInitials }}</span>
          </v-avatar>
          <div class="sidebar-footer-info">
            <div class="sidebar-footer-user">{{ authStore.userName }}</div>
            <div class="sidebar-footer-empresa">{{ authStore.empresaNombre }}</div>
          </div>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- ═══════════════════════════════════════════ MAIN -->
    <v-main class="main-content">

      <!-- HEADER -->
      <div class="app-header">
        <div class="header-left">
          <h1 class="header-page-title">{{ currentModuleTitle }}</h1>
          <p class="header-date">{{ currentDate }}</p>
        </div>

        <div class="header-right">
          <!-- Notificaciones -->
          <v-btn icon="mdi-bell-outline" variant="text" size="small" class="header-btn"></v-btn>

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
      <!-- Línea azul separadora -->
      <div class="header-divider"></div>

      <!-- CONTENIDO -->
      <div class="page-body">
        <slot />
      </div>

    </v-main>
  </v-layout>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useAppStore } from '../../stores/app'
import { MODULES } from '../../utils/constants'
import { formatFechaLarga } from '../../utils/formatters'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()

const currentDate = ref('')
// Verifica si una ruta está permitida según los permisos de módulos
function rutaPermitida(path) {
  if (!path) return true
  const dis = authStore.modulosDeshabilitados
  if (!dis || !dis.length) return true
  return !dis.some(d => path === d || path.startsWith(d + '/'))
}

// Filtra items con requiredTipo según el tipo de empresa activa y con permisos de módulos.
const modules = computed(() => {
  const tipo = authStore.empresaTipo
  return MODULES
    .filter(mod => rutaPermitida(mod.path))
    .map(mod => ({
      ...mod,
      children: (mod.children || []).map(cat => ({
        ...cat,
        items: (cat.items || []).filter(item =>
          // Sin requiredTipo → visible por tipo; con requiredTipo → debe coincidir
          (!item.requiredTipo || item.requiredTipo === tipo) &&
          // Verificar permisos de módulos
          rutaPermitida(item.path)
        ),
      })).filter(cat => !cat.items || cat.items.length > 0),
    }))
})

// Estado de apertura de menús
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
  // Abrir automáticamente el módulo y la categoría activa
  MODULES.forEach(mod => {
    const modActive = mod.path !== '/' && (route.path === mod.path || route.path.startsWith(mod.path + '/'))
    if (modActive) {
      openModules[mod.id] = true
      // Abrir la categoría que contiene la ruta actual
      mod.children?.forEach(cat => {
        const catActive = cat.items?.some(item => route.path === item.path || route.path.startsWith(item.path))
        if (catActive) openCats[mod.id + cat.name] = true
      })
    }
  })
})

const toggleTema = () => appStore.toggleTema()

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
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%) !important;
  border-right: 1px solid rgba(255,255,255,0.05) !important;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 14px 14px;
}

.sidebar-logo-icon {
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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

/* ─── MENÚ CUSTOM ─── */
.sidebar-menu {
  padding: 6px 10px;
  overflow-y: auto;
  flex: 1;
}

/* Nivel 1 - Módulo */
.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 8px;
  cursor: pointer;
  color: rgba(255,255,255,0.6);
  margin-bottom: 2px;
  transition: all 0.2s;
  user-select: none;
}
.menu-item:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.9); }
.menu-item-active { background: rgba(102,126,234,0.3); color: white; border-left: 3px solid #667eea; padding-left: 7px; }
.menu-item-open { color: rgba(255,255,255,0.9); }

.menu-icon { flex-shrink: 0; }
.menu-label {
  flex: 1;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.9px;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.menu-chevron { flex-shrink: 0; transition: transform 0.25s ease; }
.menu-chevron.rotated { transform: rotate(180deg); }

/* Nivel 2 - Categoría */
.menu-cat {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px 7px 22px;
  border-radius: 6px;
  cursor: pointer;
  color: rgba(255,255,255,0.45);
  margin-bottom: 1px;
  transition: all 0.2s;
  user-select: none;
}
.menu-cat:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.75); }
.menu-cat-open { color: rgba(255,255,255,0.75); }

.cat-icon { flex-shrink: 0; }
.cat-label {
  flex: 1;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Nivel 3 - Ítem */
.menu-leaf {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 6px 36px;
  border-radius: 6px;
  cursor: pointer;
  color: rgba(255,255,255,0.38);
  margin-bottom: 1px;
  transition: all 0.2s;
  user-select: none;
}
.menu-leaf:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.7); }
.menu-leaf-active { color: #93c5fd !important; background: rgba(147,197,253,0.1) !important; }

.leaf-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
  opacity: 0.6;
}
.leaf-label {
  font-size: 11.5px;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

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

/* ─── HEADER ─── */
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
.page-body { padding: 24px; }
</style>
