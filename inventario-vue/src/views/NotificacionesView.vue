<template>
  <MainLayout>
    <div class="notif-wrap">

      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">CONFIGURACIÓN</span>
        <v-icon size="13" color="#06b6d4">mdi-chevron-right</v-icon>
        <span class="bc-cur">Preferencias de Notificaciones</span>
      </div>

      <!-- HEADER -->
      <div class="notif-header">
        <div class="notif-header-icon">
          <v-icon size="26" color="white">mdi-bell-cog</v-icon>
        </div>
        <div>
          <h1 class="notif-title">PREFERENCIAS DE NOTIFICACIONES</h1>
          <p class="notif-sub">Configura qué notificaciones recibir y quién las recibe</p>
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="loading" class="notif-loading">
        <v-progress-circular indeterminate color="#06b6d4" size="32" />
        <span>Cargando preferencias...</span>
      </div>

      <!-- CONTENIDO -->
      <div v-else>
        <div class="notif-card">
          <div class="notif-section-hdr">
            <div class="notif-section-icon" style="background:rgba(6,182,212,0.12)">
              <v-icon size="16" color="#06b6d4">mdi-cog-outline</v-icon>
            </div>
            <span class="notif-section-title">TIPOS DE NOTIFICACIONES</span>
          </div>

          <div v-if="!tipos.length" class="notif-empty">
            No hay tipos de notificaciones configurados
          </div>

          <div v-else class="notif-tipos-list">
            <div v-for="tipo in tipos" :key="tipo.valor" class="notif-tipo-card">
              <!-- Encabezado del tipo -->
              <div class="notif-tipo-header">
                <div class="notif-tipo-left">
                  <v-icon size="20" :color="tipo.activa === 'SI' ? '#06b6d4' : '#94a3b8'">
                    {{ tipo.icon }}
                  </v-icon>
                  <div class="notif-tipo-info">
                    <h3 class="notif-tipo-label">{{ tipo.label }}</h3>
                    <p class="notif-tipo-desc">{{ tipo.descripcion }}</p>
                  </div>
                </div>
                <v-switch
                  v-model="tipoActivo[tipo.valor]"
                  true-value="SI"
                  false-value="NO"
                  color="#06b6d4"
                  hide-details
                  @update:model-value="onTipoActivoChange(tipo.valor)"
                />
              </div>

              <!-- Selector de usuarios (solo si está activo) -->
              <div v-if="tipoActivo[tipo.valor] === 'SI'" class="notif-usuarios-section">
                <label class="notif-usuarios-label">USUARIOS QUE RECIBEN ESTA NOTIFICACIÓN</label>

                <div v-if="!usuarios.length" class="notif-usuarios-empty">
                  No hay usuarios disponibles
                </div>

                <div v-else class="notif-usuarios-grid">
                  <div
                    v-for="usuario in usuarios"
                    :key="usuario.codigo"
                    class="notif-usuario-check"
                  >
                    <v-checkbox
                      :model-value="tipoUsuarios[tipo.valor]?.includes(usuario.codigo)"
                      :label="`${usuario.nombre} (${usuario.usuario})`"
                      color="#06b6d4"
                      hide-details
                      @update:model-value="onUsuarioChange(tipo.valor, usuario.codigo, $event)"
                    />
                  </div>
                </div>

                <div class="notif-usuarios-actions">
                  <v-btn
                    size="small"
                    variant="text"
                    color="#06b6d4"
                    @click="selectAllUsuarios(tipo.valor)"
                  >
                    Seleccionar todos
                  </v-btn>
                  <v-btn
                    size="small"
                    variant="text"
                    color="#ef4444"
                    @click="deselectAllUsuarios(tipo.valor)"
                  >
                    Desseleccionar todos
                  </v-btn>
                </div>
              </div>

              <!-- Mensaje si está desactivo -->
              <div v-else class="notif-tipo-disabled">
                Esta notificación está desactivada
              </div>
            </div>
          </div>

          <!-- Acciones -->
          <div class="notif-actions">
            <span v-if="saveOk" class="notif-ok-msg">
              <v-icon size="14" color="#10b981">mdi-check-circle</v-icon> Guardado correctamente
            </span>
            <span v-if="saveErr" class="notif-err-msg">{{ saveErr }}</span>
            <v-btn
              color="#06b6d4"
              variant="flat"
              size="small"
              :loading="saving"
              @click="guardarTodos"
            >
              <v-icon size="15" class="mr-1">mdi-content-save-outline</v-icon>
              Guardar Preferencias
            </v-btn>
          </div>
        </div>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import MainLayout from '../components/layouts/MainLayout.vue'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const empresa = computed(() => authStore.empresa || authStore.user?.empresa || localStorage.getItem('empresaActual') || '')

const loading = ref(false)
const saving = ref(false)
const saveOk = ref(false)
const saveErr = ref('')

const tipos = ref([])
const usuarios = ref([])

const tipoActivo = reactive({})
const tipoUsuarios = reactive({})

async function cargarDatos() {
  loading.value = true
  try {
    const [prefsRes, usrsRes] = await Promise.all([
      api.get('/preferencias-notificaciones', { params: { empresa: empresa.value } }),
      api.get('/configuracion/usuarios', { params: { empresa: empresa.value } })
    ])

    tipos.value = prefsRes.data?.data || []
    usuarios.value = usrsRes.data?.data || []

    tipos.value.forEach(tipo => {
      tipoActivo[tipo.valor] = tipo.activa || 'NO'
      tipoUsuarios[tipo.valor] = tipo.usuarios_receptores ? [...tipo.usuarios_receptores] : []
    })
  } catch (e) {
    console.error('cargarDatos:', e)
    saveErr.value = 'Error al cargar datos'
  } finally {
    loading.value = false
  }
}

function onTipoActivoChange(valor) {
  if (tipoActivo[valor] === 'NO') {
    tipoUsuarios[valor] = []
  }
}

function onUsuarioChange(tipoValor, usuarioCodigo, checked) {
  if (!tipoUsuarios[tipoValor]) {
    tipoUsuarios[tipoValor] = []
  }
  if (checked) {
    if (!tipoUsuarios[tipoValor].includes(usuarioCodigo)) {
      tipoUsuarios[tipoValor].push(usuarioCodigo)
    }
  } else {
    tipoUsuarios[tipoValor] = tipoUsuarios[tipoValor].filter(c => c !== usuarioCodigo)
  }
}

function selectAllUsuarios(tipoValor) {
  tipoUsuarios[tipoValor] = usuarios.value.map(u => u.codigo)
}

function deselectAllUsuarios(tipoValor) {
  tipoUsuarios[tipoValor] = []
}

async function guardarTodos() {
  saving.value = true
  saveOk.value = false
  saveErr.value = ''

  try {
    const promises = tipos.value.map(tipo =>
      api.put(`/preferencias-notificaciones/${tipo.valor}`, {
        activa: tipoActivo[tipo.valor] || 'NO',
        usuarios_receptores: tipoUsuarios[tipo.valor] || []
      }, {
        params: { empresa: empresa.value }
      })
    )

    await Promise.all(promises)
    saveOk.value = true
    setTimeout(() => { saveOk.value = false }, 3000)
  } catch (e) {
    saveErr.value = e?.response?.data?.error || e.message
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (empresa.value) cargarDatos()
})
</script>

<style scoped>
.notif-wrap { display: flex; flex-direction: column; gap: 20px; }

.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.bc-root { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: rgba(var(--v-theme-on-surface),0.4); text-transform: uppercase; }
.bc-cur  { font-size: 11px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }

.notif-header { display: flex; align-items: center; gap: 16px; }
.notif-header-icon {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
  background: linear-gradient(135deg,#06b6d4,#0891b2);
  display: flex; align-items: center; justify-content: center;
}
.notif-title { font-size: 22px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); margin: 0; letter-spacing: 0.3px; }
.notif-sub   { font-size: 13px; color: rgba(var(--v-theme-on-surface),0.45); margin: 2px 0 0; }

.notif-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface),0.07);
  border-radius: 16px;
  padding: 20px;
}

.notif-section-hdr { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
.notif-section-icon {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.notif-section-title {
  font-size: 11px; font-weight: 800; letter-spacing: 1.2px;
  color: rgba(var(--v-theme-on-surface),0.6); text-transform: uppercase;
}

.notif-loading { display: flex; align-items: center; gap: 10px; padding: 32px; font-size: 13px; color: rgba(var(--v-theme-on-surface),0.5); justify-content: center; }

.notif-empty { padding: 24px; text-align: center; color: rgba(var(--v-theme-on-surface),0.3); font-size: 13px; }

.notif-tipos-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }

.notif-tipo-card {
  border: 1px solid rgba(var(--v-theme-on-surface),0.08);
  border-radius: 12px;
  padding: 16px;
  transition: background 0.15s, border-color 0.15s;
}
.notif-tipo-card:hover { background: rgba(var(--v-theme-on-surface),0.02); border-color: rgba(var(--v-theme-on-surface),0.12); }

.notif-tipo-header {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}

.notif-tipo-left {
  display: flex; align-items: flex-start; gap: 12px; flex: 1;
}

.notif-tipo-info { flex: 1; }
.notif-tipo-label {
  font-size: 14px; font-weight: 700; color: rgb(var(--v-theme-on-surface));
  margin: 0; letter-spacing: 0.2px;
}
.notif-tipo-desc {
  font-size: 12px; color: rgba(var(--v-theme-on-surface),0.5);
  margin: 4px 0 0;
}

.notif-usuarios-section {
  margin-top: 16px; padding-top: 16px;
  border-top: 1px solid rgba(var(--v-theme-on-surface),0.08);
}

.notif-usuarios-label {
  font-size: 11px; font-weight: 800; letter-spacing: 0.8px;
  color: rgba(var(--v-theme-on-surface),0.5); text-transform: uppercase;
  display: block; margin-bottom: 12px;
}

.notif-usuarios-empty { font-size: 12px; color: rgba(var(--v-theme-on-surface),0.3); padding: 8px; }

.notif-usuarios-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px; margin-bottom: 12px;
}

.notif-usuario-check { padding: 4px; }

.notif-usuarios-actions {
  display: flex; gap: 8px; justify-content: flex-end;
}

.notif-tipo-disabled {
  font-size: 12px; color: rgba(var(--v-theme-on-surface),0.4);
  padding: 8px; font-style: italic;
}

.notif-actions {
  display: flex; align-items: center; justify-content: flex-end; gap: 12px;
  padding-top: 20px; border-top: 1px solid rgba(var(--v-theme-on-surface),0.07);
}

.notif-ok-msg  { font-size: 12px; font-weight: 600; color: #10b981; display: flex; align-items: center; gap: 4px; }
.notif-err-msg { font-size: 12px; font-weight: 600; color: #ef4444; }
</style>
