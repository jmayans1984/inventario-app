<template>
  <MainLayout>
    <div class="tn-wrap">
      <PageHeader
        title="Tags NFC"
        description="Puntos de marcaje físicos. Cada tag queda atado a un centro de costo."
        :crumbs="['Nómina', 'Configuración', 'Tags NFC']"
      >
        <template #actions>
          <v-btn color="secondary" variant="flat" size="small" prepend-icon="mdi-plus" @click="abrirNuevo">
            NUEVO TAG
          </v-btn>
        </template>
      </PageHeader>

      <div v-if="modoPrueba" class="tn-banner">
        <v-icon size="16" color="warning">mdi-flask-outline</v-icon>
        Modo prueba activo: puedes crear tags sin clave AES, con un UID inventado, para probar el flujo
        sin comprar hardware. Un tag sin clave no verifica firma — desactiva el modo prueba antes de usarlo de verdad.
      </div>

      <div class="tn-card">
        <div v-if="cargando" class="tn-loading">
          <v-progress-circular indeterminate color="secondary" size="28" /><span>CARGANDO...</span>
        </div>
        <table v-else class="tn-table">
          <thead>
            <tr>
              <th>ETIQUETA</th><th>UID DEL TAG</th><th>CENTRO DE COSTO</th><th>FIRMA</th><th>CONTADOR</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!tags.length">
              <td colspan="6" class="tn-empty">SIN TAGS REGISTRADOS</td>
            </tr>
            <tr v-for="t in tags" :key="t.id">
              <td class="tn-etiqueta">{{ t.etiqueta || '—' }}</td>
              <td class="tn-uid">{{ t.tag_uid }}</td>
              <td>{{ t.ccosto_nombre }}</td>
              <td>
                <span class="tn-chip" :class="t.tiene_clave ? 'chip-ok' : 'chip-warn'">
                  {{ t.tiene_clave ? 'VERIFICADA' : 'SIN CLAVE' }}
                </span>
              </td>
              <td class="tn-contador">{{ t.ultimo_contador }}</td>
              <td @click.stop>
                <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" @click="eliminar(t)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- DIALOG NUEVO TAG -->
    <v-dialog v-model="dialogo" max-width="440">
      <v-card class="tn-dialog">
        <div class="tn-dialog-title">NUEVO TAG NFC</div>
        <div class="tn-dialog-body">
          <div class="tn-field">
            <label>ETIQUETA (referencia interna)</label>
            <input v-model="form.etiqueta" class="tn-input" placeholder="Ej: Entrada cocina" />
          </div>
          <div class="tn-field">
            <label>UID DEL TAG *</label>
            <input v-model="form.tag_uid" class="tn-input" placeholder="7 bytes hex del chip. Ej: 04A1B2C3D4E580" />
            <span class="tn-hint">Viene impreso o lo lee cualquier app de NFC. En modo prueba puedes inventarlo.</span>
          </div>
          <div class="tn-field">
            <label>CENTRO DE COSTO *</label>
            <v-select v-model="form.ccosto" :items="ccostos" item-title="nombre" item-value="codigo" density="compact" variant="outlined" />
          </div>
          <div class="tn-field">
            <label>CLAVE AES DEL TAG {{ modoPrueba ? '(opcional en modo prueba)' : '*' }}</label>
            <input v-model="form.aes_key" class="tn-input" placeholder="32 caracteres hexadecimales" autocomplete="off" />
            <span class="tn-hint">
              Te la entrega el proveedor con los tags. Se guarda cifrada y no se puede volver a consultar.
            </span>
          </div>
          <div v-if="formErr" class="tn-error">{{ formErr }}</div>
        </div>
        <div class="tn-dialog-footer">
          <v-btn variant="text" @click="dialogo = false">CANCELAR</v-btn>
          <v-btn color="secondary" variant="flat" :loading="guardando" @click="guardar">CREAR TAG</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack" color="success" timeout="3000">{{ snackMsg }}</v-snackbar>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const empresa = computed(() => authStore.empresa || authStore.user?.empresa || localStorage.getItem('empresaActual') || '')
const modoPrueba = ref(false) // lo informa el backend según ASISTENCIA_MODO_PRUEBA

const tags = ref([])
const ccostos = ref([])
const cargando = ref(false)
const dialogo = ref(false)
const guardando = ref(false)
const formErr = ref('')
const snack = ref(false)
const snackMsg = ref('')
const form = ref({ etiqueta: '', tag_uid: '', ccosto: '', aes_key: '' })

async function cargar() {
  cargando.value = true
  try {
    const [tagsR, ccR] = await Promise.all([
      api.get('/asistencia/tags', { params: { empresa: empresa.value } }),
      api.get('/ccostos', { params: { empresa: empresa.value } }),
    ])
    tags.value = tagsR.data?.data || []
    modoPrueba.value = !!tagsR.data?.modo_prueba
    ccostos.value = ccR.data?.data || ccR.data || []
  } catch (e) { console.error(e) }
  finally { cargando.value = false }
}

function abrirNuevo() {
  form.value = { etiqueta: '', tag_uid: '', ccosto: '', aes_key: '' }
  formErr.value = ''
  dialogo.value = true
}

async function guardar() {
  formErr.value = ''
  if (!form.value.tag_uid || !form.value.ccosto) {
    formErr.value = 'UID y centro de costo son requeridos'
    return
  }
  guardando.value = true
  try {
    await api.post('/asistencia/tags', { ...form.value, empresa: empresa.value })
    snackMsg.value = 'Tag creado'
    snack.value = true
    dialogo.value = false
    cargar()
  } catch (e) {
    formErr.value = e?.response?.data?.error || e.message
  } finally { guardando.value = false }
}

async function eliminar(t) {
  if (!confirm(`¿Desactivar el tag "${t.etiqueta || t.tag_uid}"?`)) return
  await api.delete(`/asistencia/tags/${t.id}`)
  cargar()
}

onMounted(cargar)
</script>

<style scoped>
.tn-wrap { display: flex; flex-direction: column; gap: 16px; }

.tn-banner {
  display: flex; align-items: center; gap: 8px;
  background: color-mix(in srgb, var(--warning) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--warning) 20%, transparent);
  border-radius: 10px; padding: 10px 14px; font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.tn-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-radius: 14px; overflow: hidden;
}
.tn-loading { display: flex; align-items: center; gap: 10px; padding: 24px; font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); }

.tn-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.tn-table thead { background: rgba(var(--v-theme-on-surface), 0.04); }
.tn-table th {
  padding: 10px 14px; text-align: left;
  font-size: 10px; font-weight: 800; letter-spacing: 0.8px;
  color: rgba(var(--v-theme-on-surface), 0.4); text-transform: uppercase;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.tn-table td { padding: 12px 14px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); }
.tn-empty { padding: 32px; text-align: center; color: rgba(var(--v-theme-on-surface), 0.3); }
.tn-etiqueta { font-weight: 600; }
.tn-uid { font-family: var(--font-mono); font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.6); }
.tn-contador { font-variant-numeric: tabular-nums; color: rgba(var(--v-theme-on-surface), 0.5); }

.tn-dialog { padding: 20px; }
.tn-dialog-title { font-size: 15px; font-weight: 800; margin-bottom: 16px; }
.tn-dialog-body { display: flex; flex-direction: column; gap: 12px; }
.tn-field { display: flex; flex-direction: column; gap: 4px; }
.tn-field label { font-size: 10px; font-weight: 700; color: rgba(var(--v-theme-on-surface), 0.5); text-transform: uppercase; letter-spacing: 0.4px; }
.tn-input {
  height: 38px; padding: 0 12px; border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.2);
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: rgb(var(--v-theme-on-surface)); font-size: 13px; outline: none;
}
.tn-input:focus { border-color: var(--indigo); }
.tn-hint { font-size: 10px; color: rgba(var(--v-theme-on-surface), 0.4); line-height: 1.4; }
.tn-error { color: var(--error); font-size: 12px; font-weight: 600; }
.tn-chip { font-size: 9px; font-weight: 800; padding: 3px 7px; border-radius: 5px; letter-spacing: 0.4px; }
.chip-ok { background: color-mix(in srgb, var(--success) 15%, transparent); color: var(--success); }
.chip-warn { background: color-mix(in srgb, var(--warning) 15%, transparent); color: var(--warning); }
.tn-dialog-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
</style>
