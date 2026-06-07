<template>
  <MainLayout>
    <div class="admin-notif-container">

      <!-- BREADCRUMB -->
      <div class="admin-notif-breadcrumb">
        <span class="bc-root">CONFIGURACIÓN</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Tipos de Notificaciones</span>
      </div>

      <!-- HEADER -->
      <div class="admin-notif-header">
        <div class="admin-notif-header-left">
          <div class="admin-notif-icon-wrap">
            <v-icon size="22" color="white">mdi-bell-alert</v-icon>
          </div>
          <div>
            <h1 class="admin-notif-title">ADMINISTRACIÓN DE NOTIFICACIONES</h1>
            <p class="admin-notif-sub">Gestiona los tipos de notificaciones disponibles en el sistema</p>
          </div>
        </div>
        <v-btn
          color="#0891b2"
          variant="elevated"
          prepend-icon="mdi-plus"
          @click="abrirFormulario()"
        >
          Nuevo Tipo
        </v-btn>
      </div>

      <!-- TABLA -->
      <div class="admin-notif-table-wrap">
        <div v-if="loading" class="admin-notif-loading">
          <v-progress-circular indeterminate color="#0891b2" size="36" />
        </div>

        <template v-else-if="tipos.length === 0">
          <div class="admin-notif-empty">
            <v-icon size="48" color="#ccc">mdi-bell-off-outline</v-icon>
            <p>No hay tipos de notificaciones configurados</p>
          </div>
        </template>

        <table v-else class="admin-notif-table">
          <thead>
            <tr>
              <th>ICONO</th>
              <th>TIPO</th>
              <th>ETIQUETA</th>
              <th>DESCRIPCIÓN</th>
              <th>ESTADO</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tipo in tipos" :key="tipo.id">
              <td class="icon-cell">
                <div class="icon-preview">
                  <v-icon :icon="tipo.icon" color="#0891b2" size="20"></v-icon>
                </div>
              </td>
              <td class="valor-cell"><span class="badge-valor">{{ tipo.valor }}</span></td>
              <td class="label-cell">{{ tipo.label }}</td>
              <td class="desc-cell">{{ tipo.descripcion || '—' }}</td>
              <td class="estado-cell">
                <v-chip
                  :color="tipo.activo === 'SI' ? '#10b981' : '#ef4444'"
                  text-color="white"
                  size="small"
                >
                  {{ tipo.activo === 'SI' ? 'Activo' : 'Inactivo' }}
                </v-chip>
              </td>
              <td class="action-cell">
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  color="#0891b2"
                  @click="editarTipo(tipo)"
                >
                  <v-icon size="18">mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  color="#ef4444"
                  @click="confirmarEliminar(tipo)"
                >
                  <v-icon size="18">mdi-delete</v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- DIÁLOGO DE FORMULARIO -->
      <v-dialog v-model="mostrarFormulario" max-width="600">
        <v-card>
          <v-card-title class="bg-cyan-50">
            {{ editando ? 'Editar Tipo de Notificación' : 'Nuevo Tipo de Notificación' }}
          </v-card-title>

          <v-card-text class="pt-6">
            <div class="form-group">
              <label class="form-label">Código (valor)</label>
              <v-text-field
                v-model="formulario.valor"
                placeholder="stock_bajo"
                variant="outlined"
                density="compact"
                :disabled="editando"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Etiqueta</label>
              <v-text-field
                v-model="formulario.label"
                placeholder="Stock Bajo (bajo mínimo)"
                variant="outlined"
                density="compact"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Descripción</label>
              <v-textarea
                v-model="formulario.descripcion"
                placeholder="Descripción detallada de este tipo de notificación"
                variant="outlined"
                density="compact"
                rows="3"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Icono (MDI)</label>
              <v-text-field
                v-model="formulario.icon"
                placeholder="mdi-alert"
                variant="outlined"
                density="compact"
                hint="Usa iconos de Material Design Icons"
              />
              <div class="icon-preview-form">
                <v-icon :icon="formulario.icon" size="32" color="#0891b2"></v-icon>
              </div>
            </div>

            <div v-if="editando" class="form-group">
              <label class="form-label">Estado</label>
              <v-select
                v-model="formulario.activo"
                :items="[
                  { value: 'SI', title: 'Activo' },
                  { value: 'NO', title: 'Inactivo' }
                ]"
                variant="outlined"
                density="compact"
              />
            </div>

            <div v-if="errorForm" class="error-message">
              {{ errorForm }}
            </div>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="cerrarFormulario">Cancelar</v-btn>
            <v-btn
              color="#0891b2"
              variant="elevated"
              :loading="guardando"
              @click="guardar"
            >
              {{ editando ? 'Actualizar' : 'Crear' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- DIÁLOGO DE CONFIRMACIÓN -->
      <v-dialog v-model="mostrarConfirm" max-width="400">
        <v-card>
          <v-card-title class="bg-red-50">Confirmar eliminación</v-card-title>
          <v-card-text class="pt-4">
            ¿Estás seguro de que deseas eliminar el tipo de notificación
            <strong>{{ tipoAEliminar?.label }}</strong>?
            <br><br>
            <span style="font-size: 12px; color: #999">
              Esta acción no se puede deshacer. Las notificaciones de este tipo existentes se conservarán.
            </span>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="mostrarConfirm = false">Cancelar</v-btn>
            <v-btn color="#ef4444" variant="elevated" :loading="eliminando" @click="eliminarTipo">
              Eliminar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- SNACKBAR -->
      <v-snackbar v-model="snack.show" :color="snack.color" :timeout="3000" location="bottom right">
        {{ snack.msg }}
      </v-snackbar>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '../components/layouts/MainLayout.vue'
import { adminNotificacionesService } from '../services/admin-notificaciones.service'

const tipos = ref([])
const loading = ref(false)
const guardando = ref(false)
const eliminando = ref(false)

const mostrarFormulario = ref(false)
const mostrarConfirm = ref(false)
const editando = ref(false)
const errorForm = ref('')

const formulario = ref({
  valor: '',
  label: '',
  descripcion: '',
  icon: 'mdi-bell',
  activo: 'SI'
})

const tipoAEliminar = ref(null)
const tipoEditandoId = ref(null)

const snack = ref({ show: false, msg: '', color: 'success' })

async function cargar() {
  loading.value = true
  try {
    const res = await adminNotificacionesService.obtenerTiposNotificaciones()
    tipos.value = res || []
  } catch (e) {
    console.error('Error cargando tipos:', e)
    mostrarSnack('Error al cargar tipos de notificaciones', 'error')
  } finally {
    loading.value = false
  }
}

function abrirFormulario() {
  editando.value = false
  tipoEditandoId.value = null
  formulario.value = {
    valor: '',
    label: '',
    descripcion: '',
    icon: 'mdi-bell',
    activo: 'SI'
  }
  errorForm.value = ''
  mostrarFormulario.value = true
}

function editarTipo(tipo) {
  editando.value = true
  tipoEditandoId.value = tipo.id
  formulario.value = {
    valor: tipo.valor,
    label: tipo.label,
    descripcion: tipo.descripcion,
    icon: tipo.icon,
    activo: tipo.activo
  }
  errorForm.value = ''
  mostrarFormulario.value = true
}

function cerrarFormulario() {
  mostrarFormulario.value = false
}

async function guardar() {
  errorForm.value = ''

  if (!formulario.value.valor || !formulario.value.label) {
    errorForm.value = 'El código y la etiqueta son requeridos'
    return
  }

  guardando.value = true
  try {
    if (editando.value) {
      await adminNotificacionesService.actualizarTipo(tipoEditandoId.value, {
        label: formulario.value.label,
        descripcion: formulario.value.descripcion,
        icon: formulario.value.icon,
        activo: formulario.value.activo
      })
      mostrarSnack('Tipo actualizado correctamente', 'success')
    } else {
      await adminNotificacionesService.crearTipo({
        valor: formulario.value.valor,
        label: formulario.value.label,
        descripcion: formulario.value.descripcion,
        icon: formulario.value.icon
      })
      mostrarSnack('Tipo creado correctamente', 'success')
    }
    cerrarFormulario()
    await cargar()
  } catch (e) {
    console.error('Error guardando tipo:', e)
    errorForm.value = e.response?.data?.error || 'Error al guardar'
  } finally {
    guardando.value = false
  }
}

function confirmarEliminar(tipo) {
  tipoAEliminar.value = tipo
  mostrarConfirm.value = true
}

async function eliminarTipo() {
  if (!tipoAEliminar.value) return

  eliminando.value = true
  try {
    await adminNotificacionesService.eliminarTipo(tipoAEliminar.value.id)
    mostrarSnack('Tipo eliminado correctamente', 'success')
    mostrarConfirm.value = false
    await cargar()
  } catch (e) {
    console.error('Error eliminando tipo:', e)
    mostrarSnack('Error al eliminar tipo de notificación', 'error')
  } finally {
    eliminando.value = false
  }
}

function mostrarSnack(msg, color = 'success') {
  snack.value = { show: true, msg, color }
}

onMounted(cargar)
</script>

<style scoped>
.admin-notif-container { padding: 24px; max-width: 1200px; margin: 0 auto; }

.admin-notif-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 12px; font-weight: 700; color: #06b6d4; text-transform: uppercase; letter-spacing: .5px; }
.bc-sep { color: rgba(var(--v-theme-on-surface),.3); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface),.8); font-weight: 500; }

.admin-notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.admin-notif-header-left { display: flex; align-items: center; gap: 16px; }
.admin-notif-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#0891b2,#06b6d4); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(8,145,178,.35); flex-shrink: 0; }
.admin-notif-title { font-size: 20px; font-weight: 800; letter-spacing: .5px; margin: 0; }
.admin-notif-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }

.admin-notif-table-wrap { margin-bottom: 24px; }
.admin-notif-loading { display: flex; justify-content: center; padding: 60px; }
.admin-notif-empty { text-align: center; padding: 60px 20px; color: rgba(var(--v-theme-on-surface),.4); }

.admin-notif-table {
  width: 100%;
  border-collapse: collapse;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface),.08);
  border-radius: 8px;
  overflow: hidden;
}

.admin-notif-table thead {
  background: rgba(var(--v-theme-on-surface),.05);
  border-bottom: 2px solid rgba(var(--v-theme-on-surface),.1);
}

.admin-notif-table th {
  padding: 12px 14px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .4px;
  color: rgba(var(--v-theme-on-surface),.6);
  text-align: left;
  border-right: 1px solid rgba(var(--v-theme-on-surface),.05);
}

.admin-notif-table th:last-child { border-right: none; }

.admin-notif-table tbody tr {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05);
  transition: background-color .15s;
}

.admin-notif-table tbody tr:hover {
  background: rgba(var(--v-theme-on-surface),.03);
}

.admin-notif-table td {
  padding: 12px 14px;
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
  border-right: 1px solid rgba(var(--v-theme-on-surface),.05);
}

.admin-notif-table td:last-child { border-right: none; }

.icon-cell { width: 60px; text-align: center; }
.icon-preview { padding: 4px 0; }
.valor-cell { width: 120px; }
.badge-valor { background: rgba(8,145,178,.15); color: #0891b2; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; font-family: monospace; display: inline-block; }
.label-cell { width: 180px; font-weight: 500; }
.desc-cell { max-width: 250px; color: rgba(var(--v-theme-on-surface),.6); font-size: 12px; }
.estado-cell { width: 100px; }
.action-cell { width: 100px; display: flex; gap: 4px; }

/* FORMULARIO */
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .3px; color: rgba(var(--v-theme-on-surface),.6); margin-bottom: 6px; }
.icon-preview-form { margin-top: 8px; padding: 12px; background: rgba(8,145,178,.08); border-radius: 6px; display: flex; align-items: center; justify-content: center; }
.error-message { padding: 8px 12px; background: rgba(239,68,68,.08); border-left: 3px solid #ef4444; border-radius: 4px; color: #ef4444; font-size: 12px; }
.bg-cyan-50 { background: rgba(8,145,178,.05) !important; }
.bg-red-50 { background: rgba(239,68,68,.05) !important; }
</style>
