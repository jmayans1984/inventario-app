<template>
  <v-layout>
    <!-- ═══════════════════════════════════════════ SIDEBAR -->
    <v-navigation-drawer permanent :width="248" class="sidebar">

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
      <v-list density="compact" nav class="sidebar-menu">
        <template v-for="mod in modules" :key="mod.id">

          <!-- Sin submenús (INICIO, CONFIGURACIÓN) -->
          <v-list-item
            v-if="!mod.children.length"
            :to="mod.path"
            :prepend-icon="mod.icon"
            :title="mod.name"
            class="sidebar-item"
            active-class="sidebar-item-active"
            rounded="lg"
          ></v-list-item>

          <!-- Con submenús (3 niveles) -->
          <v-list-group v-else :value="mod.id">
            <template #activator="{ props }">
              <v-list-item
                v-bind="props"
                :prepend-icon="mod.icon"
                :title="mod.name"
                class="sidebar-item"
                rounded="lg"
              ></v-list-item>
            </template>

            <!-- Nivel 2: Configuración / Procesos / Reportes -->
            <v-list-group
              v-for="cat in mod.children"
              :key="cat.name"
              :value="mod.id + cat.name"
            >
              <template #activator="{ props }">
                <v-list-item
                  v-bind="props"
                  :prepend-icon="cat.icon"
                  :title="cat.name"
                  class="sidebar-cat"
                  rounded="lg"
                ></v-list-item>
              </template>

              <!-- Nivel 3: Ítems específicos -->
              <v-list-item
                v-for="item in cat.items"
                :key="item.path"
                :to="item.path"
                :prepend-icon="item.icon"
                :title="item.name"
                class="sidebar-leaf"
                active-class="sidebar-leaf-active"
                rounded="lg"
              ></v-list-item>
            </v-list-group>

          </v-list-group>
        </template>
      </v-list>

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

          <v-btn icon="mdi-logout-variant" variant="text" size="small" color="error" class="ml-1" @click="handleLogout"></v-btn>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useAppStore } from '../../stores/app'
import { MODULES } from '../../utils/constants'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()

const currentDate = ref('')
const modules = computed(() => MODULES)

const currentModuleTitle = computed(() => {
  const found = MODULES.find(m => route.path === m.path || route.path.startsWith(m.path + '/'))
  return found?.name || 'INICIO'
})

const avatarInitials = computed(() => {
  const name = authStore.userNombre || authStore.userName || 'US'
  return name.split(' ').map(p => p.charAt(0)).join('').toUpperCase().slice(0, 2)
})

onMounted(() => {
  currentDate.value = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
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

.sidebar-menu { padding: 6px 8px; }

/* Nivel 1 - Módulo */
.sidebar-item {
  color: rgba(255,255,255,0.6) !important;
  font-size: 11.5px !important;
  font-weight: 700 !important;
  letter-spacing: 0.8px !important;
  text-transform: uppercase !important;
  min-height: 40px !important;
  margin-bottom: 2px;
}
.sidebar-item:hover { color: white !important; background: rgba(255,255,255,0.07) !important; }
.sidebar-item-active {
  color: white !important;
  background: rgba(102,126,234,0.3) !important;
  border-left: 3px solid #667eea !important;
}

/* Nivel 2 - Categoría */
.sidebar-cat {
  color: rgba(255,255,255,0.5) !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px !important;
  min-height: 36px !important;
  margin-bottom: 1px;
  padding-left: 8px !important;
}
.sidebar-cat:hover { color: rgba(255,255,255,0.85) !important; background: rgba(255,255,255,0.05) !important; }

/* Nivel 3 - Ítem */
.sidebar-leaf {
  color: rgba(255,255,255,0.4) !important;
  font-size: 11px !important;
  font-weight: 400 !important;
  min-height: 32px !important;
  padding-left: 16px !important;
  margin-bottom: 1px;
}
.sidebar-leaf:hover { color: rgba(255,255,255,0.8) !important; background: rgba(255,255,255,0.04) !important; }
.sidebar-leaf-active { color: #93c5fd !important; background: rgba(147,197,253,0.1) !important; }

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
  background: white;
}

.header-left {}

.header-page-title {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  line-height: 1.2;
}

.header-date {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 400;
  text-transform: capitalize;
  margin-top: 1px;
}

.header-right {
  display: flex;
  align-items: center;
}

.header-btn { color: #64748b !important; }

.header-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-user-texts {
  display: flex;
  flex-direction: column;
  text-align: right;
}

.header-username {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.3;
}

.header-empresa {
  font-size: 11px;
  color: #667eea;
  font-weight: 500;
  line-height: 1.3;
}

/* Línea azul separadora */
.header-divider {
  height: 3px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

/* ─── CONTENT ─── */
.main-content { background: #f1f5f9 !important; }
.page-body { padding: 24px; }
</style>
