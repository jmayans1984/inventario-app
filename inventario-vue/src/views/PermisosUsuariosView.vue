<template>
  <MainLayout>
    <div class="pc-container">

      <!-- BREADCRUMB -->
      <div class="pc-breadcrumb">
        <span class="bc-root">CONFIGURACIÓN</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Permisos de Usuarios</span>
      </div>

      <!-- HEADER -->
      <div class="pc-header">
        <div class="pc-header-left">
          <div class="pc-icon-wrap">
            <v-icon size="22" color="white">mdi-account-lock-outline</v-icon>
          </div>
          <div>
            <h1 class="pc-title">PERMISOS DE USUARIOS</h1>
            <p class="pc-sub">Activa o desactiva módulos para cada usuario individual</p>
          </div>
        </div>
      </div>

      <!-- BODY — dos columnas -->
      <div class="pc-body">

        <!-- COLUMNA IZQUIERDA: empresa activa + usuarios -->
        <div class="pc-col-left">
          <div class="pc-section-title">
            <v-icon size="15" color="#f59e0b">mdi-domain</v-icon>
            Empresa
          </div>

          <div class="pc-empresa-activa">
            <v-icon size="16" color="#f59e0b">mdi-domain</v-icon>
            {{ authStore.empresaNombre || authStore.empresaCodigo }}
          </div>

          <div class="pc-section-title">
            <v-icon size="15" color="#f59e0b">mdi-account-multiple-outline</v-icon>
            Usuarios
          </div>

          <div v-if="loadingUsuarios" class="pc-loading">
            <v-progress-circular indeterminate color="#f59e0b" size="28" />
          </div>

          <div v-else-if="usuarios.length === 0" class="pc-empty">
            No hay usuarios registrados para esta empresa.
          </div>

          <div v-else class="pc-clientes-list">
            <div
              v-for="u in usuarios"
              :key="u.codigo"
              class="pc-cliente-card"
              :class="{ 'pc-cliente-card--active': usuarioSeleccionado?.codigo === u.codigo }"
              @click="seleccionarUsuario(u)"
            >
              <v-icon size="18" class="pc-cliente-icon">mdi-account-outline</v-icon>
              <div class="pc-cliente-info">
                <div class="pc-cliente-nombre">{{ u.nombre || u.usuario }}</div>
                <div class="pc-cliente-cod">{{ u.usuario }}</div>
              </div>
              <v-icon v-if="usuarioSeleccionado?.codigo === u.codigo" size="16" color="#f59e0b">mdi-chevron-right</v-icon>
            </div>
          </div>
        </div>

        <!-- COLUMNA DERECHA: árbol de módulos -->
        <div class="pc-col-right">
          <div v-if="!usuarioSeleccionado" class="pc-placeholder">
            <v-icon size="48" color="rgba(var(--v-theme-on-surface), 0.2)">mdi-account-lock-outline</v-icon>
            <p>Selecciona un usuario para configurar sus permisos</p>
          </div>

          <template v-else>
            <div class="pc-panel-header">
              <div>
                <div class="pc-panel-title">{{ usuarioSeleccionado.nombre || usuarioSeleccionado.usuario }}</div>
                <div class="pc-panel-sub">Usuario: {{ usuarioSeleccionado.usuario }}</div>
              </div>
              <v-btn
                color="#f59e0b"
                variant="flat"
                rounded="lg"
                :loading="guardando"
                @click="guardarPermisos"
              >
                <v-icon start>mdi-content-save-outline</v-icon>
                Guardar Permisos
              </v-btn>
            </div>

            <v-progress-linear v-if="loadingPermisos" indeterminate color="#f59e0b" height="3" class="mb-4" />

            <div v-else class="pc-modulos-list">
              <div
                v-for="mod in modulosVisibles"
                :key="mod.id"
                class="pc-modulo-block"
              >
                <!-- Módulo top-level -->
                <div class="pc-modulo-header">
                  <v-icon size="18" class="pc-modulo-icon">{{ mod.icon }}</v-icon>
                  <span class="pc-modulo-nombre">{{ mod.name }}</span>
                  <v-select
                    v-if="!isModuloDeshabilitado(mod.path)"
                    :model-value="estadoPlataforma(mod.path)"
                    @update:model-value="(val) => setEstadoPlataforma(mod.path, val)"
                    :items="PLATAFORMA_OPTS"
                    item-title="title"
                    item-value="value"
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="pc-select-plataforma"
                  />
                  <v-switch
                    :model-value="!isModuloDeshabilitado(mod.path)"
                    @update:model-value="(val) => toggleModulo(mod, val)"
                    hide-details
                    density="compact"
                    color="#f59e0b"
                    class="pc-switch-mod"
                  />
                </div>

                <!-- Items del módulo -->
                <div v-if="!isModuloDeshabilitado(mod.path)" class="pc-items-list">
                  <template v-for="cat in mod.children" :key="cat.name">
                    <template v-for="item in cat.items" :key="item.path">
                      <div class="pc-item-row">
                        <v-icon size="13" class="pc-item-icon">{{ item.icon }}</v-icon>
                        <span class="pc-item-nombre">{{ item.name }}</span>
                        <span class="pc-item-cat">{{ cat.name }}</span>
                        <v-select
                          v-if="!isItemDeshabilitado(item.path)"
                          :model-value="estadoPlataforma(item.path)"
                          @update:model-value="(val) => setEstadoPlataforma(item.path, val)"
                          :items="PLATAFORMA_OPTS"
                          item-title="title"
                          item-value="value"
                          variant="outlined"
                          density="compact"
                          hide-details
                          class="pc-select-plataforma"
                        />
                        <v-switch
                          :model-value="!isItemDeshabilitado(item.path)"
                          @update:model-value="(val) => toggleItem(item.path, val)"
                          hide-details
                          density="compact"
                          color="#f59e0b"
                          class="pc-switch-item"
                        />
                      </div>
                    </template>
                  </template>
                </div>

                <div v-else class="pc-modulo-disabled-msg">
                  <v-icon size="13" color="rgba(0,0,0,0.3)">mdi-lock-outline</v-icon>
                  Módulo completo deshabilitado
                </div>
              </div>
            </div>

            <!-- Snackbar feedback -->
            <v-snackbar v-model="snack.show" :color="snack.color" :timeout="3000" location="bottom right">
              {{ snack.text }}
            </v-snackbar>
          </template>
        </div>

      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../components/layouts/MainLayout.vue'
import { API_BASE, MODULES } from '../utils/constants'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

// ─── Estado ───────────────────────────────────────────────────────
const usuarios = ref([])
const loadingUsuarios = ref(false)
const usuarioSeleccionado = ref(null)
const rutasDeshabilitadas = ref([])
const rutasDeshabilitadasMovil = ref([])
const rutasDeshabilitadasCompleta = ref([])
const loadingPermisos = ref(false)
const guardando = ref(false)

const snack = ref({ show: false, color: '#22c55e', text: '' })

const PLATAFORMA_OPTS = [
  { title: 'Ambas plataformas', value: 'AMBAS' },
  { title: 'Solo Completa (escritorio)', value: 'COMPLETA' },
  { title: 'Solo Móvil', value: 'MOVIL' },
]

// ─── Módulos visibles en el árbol (excluir 'inicio' y 'configuracion') ──
const modulosVisibles = computed(() =>
  MODULES.filter(m => m.id !== 'inicio' && m.id !== 'configuracion')
)

// ─── Helpers de permisos ──────────────────────────────────────────
function isModuloDeshabilitado(path) {
  return rutasDeshabilitadas.value.includes(path)
}

function isItemDeshabilitado(path) {
  return rutasDeshabilitadas.value.some(d => path === d || path.startsWith(d + '/'))
}

function estadoPlataforma(path) {
  if (rutasDeshabilitadasMovil.value.includes(path)) return 'COMPLETA'
  if (rutasDeshabilitadasCompleta.value.includes(path)) return 'MOVIL'
  return 'AMBAS'
}

function setEstadoPlataforma(path, val) {
  rutasDeshabilitadasMovil.value = rutasDeshabilitadasMovil.value.filter(r => r !== path)
  rutasDeshabilitadasCompleta.value = rutasDeshabilitadasCompleta.value.filter(r => r !== path)
  if (val === 'COMPLETA') {
    rutasDeshabilitadasMovil.value = [...rutasDeshabilitadasMovil.value, path]
  } else if (val === 'MOVIL') {
    rutasDeshabilitadasCompleta.value = [...rutasDeshabilitadasCompleta.value, path]
  }
}

// ─── Toggles ─────────────────────────────────────────────────────
function toggleModulo(mod, enabled) {
  if (!enabled) {
    const subPaths = []
    mod.children?.forEach(cat => {
      cat.items?.forEach(item => subPaths.push(item.path))
    })
    rutasDeshabilitadas.value = [
      ...rutasDeshabilitadas.value.filter(r => !subPaths.includes(r) && r !== mod.path),
      mod.path,
    ]
    rutasDeshabilitadasMovil.value = rutasDeshabilitadasMovil.value.filter(r => !subPaths.includes(r) && r !== mod.path)
    rutasDeshabilitadasCompleta.value = rutasDeshabilitadasCompleta.value.filter(r => !subPaths.includes(r) && r !== mod.path)
  } else {
    rutasDeshabilitadas.value = rutasDeshabilitadas.value.filter(r => r !== mod.path)
  }
}

function toggleItem(path, enabled) {
  if (!enabled) {
    if (!rutasDeshabilitadas.value.includes(path)) {
      rutasDeshabilitadas.value = [...rutasDeshabilitadas.value, path]
    }
    rutasDeshabilitadasMovil.value = rutasDeshabilitadasMovil.value.filter(r => r !== path)
    rutasDeshabilitadasCompleta.value = rutasDeshabilitadasCompleta.value.filter(r => r !== path)
  } else {
    rutasDeshabilitadas.value = rutasDeshabilitadas.value.filter(r => r !== path)
  }
}

// ─── API calls ───────────────────────────────────────────────────
async function cargarUsuarios() {
  usuarioSeleccionado.value = null
  usuarios.value = []
  const empresaCod = authStore.empresaCodigo
  if (!empresaCod) return
  loadingUsuarios.value = true
  try {
    const r = await fetch(`${API_BASE}/configuracion/usuarios?empresa=${empresaCod}`)
    const j = await r.json()
    if (j.success) usuarios.value = j.data
  } catch (e) {
    console.error('Error cargando usuarios:', e)
  } finally {
    loadingUsuarios.value = false
  }
}

async function seleccionarUsuario(usuario) {
  usuarioSeleccionado.value = usuario
  rutasDeshabilitadas.value = []
  rutasDeshabilitadasMovil.value = []
  rutasDeshabilitadasCompleta.value = []
  loadingPermisos.value = true
  try {
    const r = await fetch(`${API_BASE}/permisos-usuarios/${authStore.empresaCodigo}/${usuario.codigo}`)
    const j = await r.json()
    if (j.success) {
      rutasDeshabilitadas.value = j.data?.rutas_deshabilitadas || []
      rutasDeshabilitadasMovil.value = j.data?.rutas_deshabilitadas_movil || []
      rutasDeshabilitadasCompleta.value = j.data?.rutas_deshabilitadas_completa || []
    }
  } catch (e) {
    console.error('Error cargando permisos:', e)
  } finally {
    loadingPermisos.value = false
  }
}

async function guardarPermisos() {
  if (!usuarioSeleccionado.value || !authStore.empresaCodigo) return
  guardando.value = true
  try {
    const r = await fetch(`${API_BASE}/permisos-usuarios/${authStore.empresaCodigo}/${usuarioSeleccionado.value.codigo}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rutas_deshabilitadas: rutasDeshabilitadas.value,
        rutas_deshabilitadas_movil: rutasDeshabilitadasMovil.value,
        rutas_deshabilitadas_completa: rutasDeshabilitadasCompleta.value,
      }),
    })
    const j = await r.json()
    if (j.success) {
      snack.value = { show: true, color: '#22c55e', text: 'Permisos guardados correctamente' }
    } else {
      snack.value = { show: true, color: '#ef4444', text: 'Error al guardar: ' + (j.error || 'desconocido') }
    }
  } catch (e) {
    snack.value = { show: true, color: '#ef4444', text: 'Error de conexión al guardar permisos' }
  } finally {
    guardando.value = false
  }
}

onMounted(() => {
  cargarUsuarios()
})
</script>

<style scoped>
.pc-container {
  max-width: 1200px;
}

/* ─── BREADCRUMB ─── */
.pc-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.bc-root { color: #f59e0b; text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.3); }
.bc-current { color: rgba(var(--v-theme-on-surface), 0.5); text-transform: uppercase; }

/* ─── HEADER ─── */
.pc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: rgb(var(--v-theme-surface));
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border-left: 4px solid #f59e0b;
}

.pc-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pc-icon-wrap {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pc-title {
  font-size: 18px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
  letter-spacing: 0.8px;
  line-height: 1.2;
}

.pc-sub {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.45);
  margin-top: 2px;
}

/* ─── BODY ─── */
.pc-body {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

/* ─── COLUMNA IZQUIERDA ─── */
.pc-col-left {
  width: 30%;
  flex-shrink: 0;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 14px;
  padding: 18px;
}

.pc-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.45);
  margin-bottom: 14px;
}

.pc-loading {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

.pc-empresa-activa {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  background: rgba(245,158,11,0.08);
  border: 1px solid rgba(245,158,11,0.25);
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 18px;
}

.pc-empty {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  text-align: center;
  padding: 20px 0;
}

.pc-clientes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pc-cliente-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.08);
  cursor: pointer;
  transition: all 0.2s;
}
.pc-cliente-card:hover {
  border-color: #f59e0b;
  background: rgba(245,158,11,0.07);
}
.pc-cliente-card--active {
  border-color: #f59e0b;
  background: rgba(245,158,11,0.12);
}

.pc-cliente-icon {
  color: rgba(var(--v-theme-on-surface), 0.3);
  flex-shrink: 0;
}
.pc-cliente-card--active .pc-cliente-icon {
  color: #f59e0b;
}

.pc-cliente-info {
  flex: 1;
  min-width: 0;
}

.pc-cliente-nombre {
  font-size: 12px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pc-cliente-cod {
  font-size: 10px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  letter-spacing: 0.5px;
}

/* ─── COLUMNA DERECHA ─── */
.pc-col-right {
  flex: 1;
  min-width: 0;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 14px;
  padding: 20px;
}

.pc-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 300px;
  color: rgba(var(--v-theme-on-surface), 0.3);
  font-size: 13px;
  text-align: center;
}

.pc-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1.5px solid rgba(var(--v-theme-on-surface), 0.08);
}

.pc-panel-title {
  font-size: 15px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
}

.pc-panel-sub {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  margin-top: 2px;
}

/* ─── MÓDULOS ─── */
.pc-modulos-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pc-modulo-block {
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 10px;
  overflow: hidden;
}

.pc-modulo-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.pc-modulo-icon {
  color: #f59e0b;
  flex-shrink: 0;
}

.pc-modulo-nombre {
  flex: 1;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface));
}

.pc-switch-mod {
  flex-shrink: 0;
}

.pc-select-plataforma {
  flex-shrink: 0;
  max-width: 190px;
  font-size: 11px;
}

.pc-items-list {
  padding: 4px 0;
}

.pc-item-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px 8px 32px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.04);
  transition: background 0.15s;
}
.pc-item-row:last-child {
  border-bottom: none;
}
.pc-item-row:hover {
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.pc-item-icon {
  color: rgba(var(--v-theme-on-surface), 0.3);
  flex-shrink: 0;
}

.pc-item-nombre {
  flex: 1;
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface));
}

.pc-item-cat {
  font-size: 10px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  background: rgba(var(--v-theme-on-surface), 0.07);
  padding: 2px 7px;
  border-radius: 20px;
  white-space: nowrap;
}

.pc-switch-item {
  flex-shrink: 0;
}

.pc-modulo-disabled-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px 10px 32px;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.35);
  font-style: italic;
}
</style>
