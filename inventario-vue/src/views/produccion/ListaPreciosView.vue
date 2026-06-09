<template>
  <MainLayout>
    <div class="lp-container">

      <!-- BREADCRUMB -->
      <div class="lp-breadcrumb">
        <span class="bc-root">PROVEEDURÍA</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Configuración</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Lista de Precios</span>
      </div>

      <!-- HEADER -->
      <div class="lp-header">
        <div class="lp-header-left">
          <div class="lp-icon-wrap"><v-icon size="22" color="white">mdi-tag-multiple-outline</v-icon></div>
          <div>
            <h1 class="lp-title">LISTAS DE PRECIOS</h1>
            <p class="lp-sub">Configura las condiciones de precio y crédito para tus clientes</p>
          </div>
        </div>
        <v-btn color="#06b6d4" variant="flat" rounded="lg" @click="abrirModal()">
          <v-icon start>mdi-plus</v-icon>Nueva Lista
        </v-btn>
      </div>

      <!-- TABLA -->
      <div class="lp-table-card">
        <v-progress-linear v-if="loading" indeterminate color="#06b6d4" height="3" />

        <div v-if="!loading && listas.length === 0" class="lp-empty">
          <v-icon size="48" color="rgba(var(--v-theme-on-surface),.12)" class="mb-2">mdi-tag-off-outline</v-icon>
          <div>No hay listas de precios configuradas</div>
          <div class="text-caption mt-1" style="color:rgba(var(--v-theme-on-surface),.35)">
            Crea listas como "PRECIO MOSTRADOR", "PRECIO CRÉDITO 30", etc.
          </div>
        </div>

        <table v-else class="lp-table">
          <thead>
            <tr>
              <th>NOMBRE DE LISTA</th>
              <th class="ta-c">% MARGEN</th>
              <th class="ta-c">DÍAS CRÉDITO</th>
              <th class="ta-c">ESTADO</th>
              <th class="ta-c">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lp in listas" :key="lp.id" class="lp-row">
              <td class="lp-nombre">{{ lp.lista }}</td>
              <td class="ta-c">
                <span class="pct-badge">{{ fmtPct(lp.margen) }}</span>
              </td>
              <td class="ta-c">
                <span class="dias-badge">{{ lp.dias_credito ?? 0 }} días</span>
              </td>
              <td class="ta-c">
                <span :class="lp.activo === 'SI' ? 'chip-activo' : 'chip-inactivo'">
                  {{ lp.activo === 'SI' ? 'ACTIVO' : 'INACTIVO' }}
                </span>
              </td>
              <td class="ta-c">
                <v-btn icon="mdi-pencil-outline" size="x-small" variant="tonal" color="#06b6d4" class="mr-1"
                  @click="abrirModal(lp)" />
                <v-btn icon="mdi-delete-outline" size="x-small" variant="tonal" color="error"
                  @click="confirmarEliminar(lp)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <!-- ══ DIALOG CREAR / EDITAR ══ -->
    <v-dialog v-model="dlg" max-width="500">
      <v-card rounded="xl" style="overflow:hidden">

        <div class="dlg-header">
          <div class="dlg-icon"><v-icon size="20" color="white">mdi-tag-multiple-outline</v-icon></div>
          <div class="dlg-titles">
            <div class="dlg-title">{{ editando ? 'Editar Lista' : 'Nueva Lista de Precios' }}</div>
            <div class="dlg-sub">Configura el nombre, margen y días de crédito</div>
          </div>
          <v-btn icon="mdi-close" size="small" variant="text" color="white" @click="dlg=false" />
        </div>

        <v-card-text class="pa-5">

          <!-- Nombre -->
          <div class="dlg-field-label">Nombre de la lista *</div>
          <v-text-field v-model="form.lista" variant="outlined" density="compact" hide-details
            maxlength="80" placeholder="Ej: PRECIO MOSTRADOR, PRECIO CRÉDITO 30 DÍAS"
            :error="!!errores.lista" class="mb-4"
            @input="form.lista = form.lista.toUpperCase()" />
          <div v-if="errores.lista" class="dlg-err mb-3">{{ errores.lista }}</div>

          <v-divider class="mb-4" />

          <!-- Margen + Días -->
          <div class="dlg-section-label">CONDICIONES</div>
          <div class="dlg-row-2">
            <div>
              <div class="dlg-field-label">% Margen sobre precio de venta</div>
              <v-text-field v-model.number="form.margen_pct" type="number" min="0" max="99"
                variant="outlined" density="compact" hide-details suffix="%" placeholder="0"
                @update:model-value="syncMargen" />
            </div>
            <div>
              <div class="dlg-field-label">Días Crédito</div>
              <v-text-field v-model.number="form.dias_credito" type="number" min="0"
                variant="outlined" density="compact" hide-details placeholder="0" />
            </div>
          </div>

          <!-- Simulador compacto -->
          <div v-if="form.margen_pct > 0" class="dlg-simulator mt-3">
            <div class="sim-row">
              <span class="sim-lbl">Ejemplo con costo:</span>
              <input v-model.number="simCosto" type="number" min="0" class="sim-input" />
              <span class="sim-result">→ <strong>{{ simPrecio }}</strong></span>
            </div>
          </div>

          <v-divider class="my-4" />

          <!-- Estado -->
          <div class="dlg-section-label">ESTADO</div>
          <div class="lp-toggle" :class="{ 'lp-toggle--on': form.activo === 'SI' }"
            @click="form.activo = form.activo === 'SI' ? 'NO' : 'SI'">
            <div>
              <div class="dlg-field-label" style="margin-bottom:1px">Lista activa</div>
              <div class="dlg-hint">Disponible para asignar a clientes</div>
            </div>
            <v-switch v-model="formActivoBool" color="#06b6d4" density="compact" hide-details @click.stop />
          </div>

          <div v-if="msgError" class="dlg-error mt-3">
            <v-icon size="14" class="mr-1">mdi-alert-circle-outline</v-icon>{{ msgError }}
          </div>
        </v-card-text>

        <div class="dlg-footer">
          <v-btn variant="text" @click="dlg=false"><v-icon start size="15">mdi-close</v-icon>Cancelar</v-btn>
          <v-btn color="#06b6d4" variant="flat" rounded="lg" :loading="guardando" @click="guardar">
            <v-icon start size="15">mdi-content-save-outline</v-icon>
            {{ editando ? 'Guardar Cambios' : 'Crear Lista' }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>


    <!-- CONFIRM ELIMINAR -->
    <v-dialog v-model="dlgEliminar" max-width="360">
      <v-card rounded="xl" class="pa-6 text-center">
        <v-icon size="48" color="error" class="mb-3">mdi-delete-alert-outline</v-icon>
        <p class="text-subtitle-1 font-weight-bold mb-1">¿Eliminar lista?</p>
        <p class="text-caption text-medium-emphasis mb-4"><strong>{{ eliminando?.lista }}</strong></p>
        <div class="d-flex gap-2 justify-center">
          <v-btn variant="text" @click="dlgEliminar=false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" rounded="lg" :loading="guardando" @click="eliminar">Eliminar</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3500" location="bottom right">
      {{ snack.msg }}
    </v-snackbar>

  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'

const listas      = ref([])
const loading     = ref(false)
const guardando   = ref(false)
const dlg         = ref(false)
const dlgEliminar = ref(false)
const editando    = ref(false)
const eliminando  = ref(null)
const msgError    = ref('')
const errores      = ref({})
const simCosto     = ref(100)
const snack = ref({ show: false, msg: '', color: 'success' })

const niveles = [
  { val: 1, label: 'Nivel 1 — precio_venta1' },
  { val: 2, label: 'Nivel 2 — precio_venta2' },
  { val: 3, label: 'Nivel 3 — precio_venta3' },
]

const formVacio = () => ({
  id: null, lista: '', dias_credito: 0, activo: 'SI',
  margen: 0, margen_pct: 0, nivel: 1,
})
const form = ref(formVacio())

const formActivoBool = computed({
  get: () => form.value.activo === 'SI',
  set: (v) => { form.value.activo = v ? 'SI' : 'NO' }
})

const simPrecio = computed(() => {
  const c = parseFloat(simCosto.value) || 0
  const m = parseFloat(form.value.margen) || 0
  if (!c || m <= 0 || m >= 1) return '—'
  return '$' + (c / (1 - m)).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
})

function syncMargen() {
  form.value.margen = (parseFloat(form.value.margen_pct) || 0) / 100
}

function fmtPct(val) {
  const v = parseFloat(val) || 0
  return v > 0 ? (v * 100).toFixed(1) + '%' : '—'
}

function ok(msg)  { snack.value = { show: true, msg, color: 'success' } }
function err(msg) { snack.value = { show: true, msg, color: 'error' } }

async function cargar() {
  loading.value = true
  try {
    const r = await api.get('/produccion/lista-precios')
    listas.value = r.data?.data || []
  } catch (e) { err('Error al cargar listas') }
  finally { loading.value = false }
}

function abrirModal(lp = null) {
  errores.value = {}; msgError.value = ''
  editando.value = !!lp
  if (lp) {
    const m = parseFloat(lp.margen) || 0
    form.value = {
      id: lp.id, lista: lp.lista, dias_credito: lp.dias_credito ?? 0,
      activo: lp.activo || 'SI', margen: m,
      margen_pct: Math.round(m * 10000) / 100,
      nivel: parseInt(lp.nivel) || 1,
    }
  } else {
    form.value = formVacio()
  }
  dlg.value = true
}

function validar() {
  const e = {}
  if (!form.value.lista?.trim()) e.lista = 'Requerido'
  errores.value = e
  return !Object.keys(e).length
}

async function guardar() {
  if (!validar()) return
  guardando.value = true; msgError.value = ''
  syncMargen()
  try {
    const payload = {
      lista:       form.value.lista.trim().toUpperCase(),
      dias_credito: parseInt(form.value.dias_credito) || 0,
      activo:      form.value.activo,
      margen:      form.value.margen,
      nivel:       form.value.nivel,
    }
    if (editando.value) {
      await api.put(`/produccion/lista-precios/${form.value.id}`, payload)
      ok('Lista actualizada')
    } else {
      await api.post('/produccion/lista-precios', payload)
      ok('Lista creada')
    }
    dlg.value = false
    await cargar()
  } catch (e) {
    msgError.value = e?.response?.data?.error || e.message
  } finally { guardando.value = false }
}

function confirmarEliminar(lp) { eliminando.value = lp; dlgEliminar.value = true }
async function eliminar() {
  guardando.value = true
  try {
    await api.delete(`/produccion/lista-precios/${eliminando.value.id}`)
    ok('Lista eliminada')
    listas.value = listas.value.filter(l => l.id !== eliminando.value.id)
    dlgEliminar.value = false
  } catch (e) { err(e?.response?.data?.error || e.message) }
  finally { guardando.value = false }
}

onMounted(cargar)
</script>

<style scoped>
.lp-container { padding: 24px; max-width: 1100px; margin: 0 auto; }
.lp-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 12px; font-weight: 700; color: #06b6d4; text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface),.3) !important; }
.bc-cat { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface),.8); font-weight: 500; }

.lp-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.lp-header-left { display: flex; align-items: center; gap: 14px; }
.lp-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#06b6d4,#0891b2); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(6,182,212,.35); }
.lp-title { font-size: 20px; font-weight: 800; margin: 0; }
.lp-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }

/* Tabla */
.lp-table-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 14px; overflow-x: auto; }
.lp-empty { padding: 48px; text-align: center; color: rgba(var(--v-theme-on-surface),.4); font-size: 13px; display: flex; flex-direction: column; align-items: center; }
.lp-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.lp-table thead th { padding: 10px 14px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.45); background: rgba(var(--v-theme-on-surface),.03); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); white-space: nowrap; }
.lp-table thead th.ta-c { text-align: center; }
.lp-row td { padding: 11px 14px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); }
.lp-row:hover td { background: rgba(var(--v-theme-on-surface),.02); }
.lp-nombre { font-weight: 600; font-size: 13px; }
.ta-c { text-align: center !important; }

.nivel-badge { padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; }
.nivel-1 { background: rgba(34,197,94,.12);  color: #16a34a; }
.nivel-2 { background: rgba(6,182,212,.12);  color: #0891b2; }
.nivel-3 { background: rgba(139,92,246,.12); color: #7c3aed; }

.pct-badge  { background: rgba(245,158,11,.12); color: #b45309; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; }
.dias-badge { background: rgba(var(--v-theme-on-surface),.08); padding: 2px 8px; border-radius: 5px; font-size: 11px; font-family: monospace; }
.divisor-text { font-size: 11px; color: rgba(var(--v-theme-on-surface),.45); font-family: monospace; }
.chip-activo   { background: rgba(34,197,94,.12); color: #16a34a; padding: 2px 8px; border-radius: 5px; font-size: 10px; font-weight: 700; }
.chip-inactivo { background: rgba(var(--v-theme-on-surface),.08); color: rgba(var(--v-theme-on-surface),.4); padding: 2px 8px; border-radius: 5px; font-size: 10px; font-weight: 700; }

/* Dialog */
.dlg-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; background: linear-gradient(135deg,#0891b2,#0e7490); }
.dlg-icon { width: 38px; height: 38px; border-radius: 10px; background: rgba(255,255,255,.18); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dlg-titles { flex: 1; }
.dlg-title { font-size: 15px; font-weight: 700; color: white; }
.dlg-sub { font-size: 11px; color: rgba(255,255,255,.55); margin-top: 1px; }
.dlg-section-label { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.4); margin-bottom: 10px; }
.dlg-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.dlg-field-label { font-size: 11px; color: rgba(var(--v-theme-on-surface),.55); margin-bottom: 4px; font-weight: 500; }
.dlg-hint { font-size: 10px; color: rgba(var(--v-theme-on-surface),.35); margin-top: 3px; }
.dlg-err { font-size: 11px; color: #ef4444; }
.dlg-footer { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid rgba(var(--v-theme-on-surface),.08); }
.dlg-error { display: flex; align-items: center; font-size: 12px; color: #ef4444; background: rgba(239,68,68,.07); border-radius: 8px; padding: 8px 12px; }

/* Simulador */
.dlg-simulator { background: rgba(6,182,212,.05); border: 1px solid rgba(6,182,212,.2); border-radius: 10px; padding: 12px 14px; }
.sim-row { display: flex; align-items: center; gap: 10px; font-size: 12px; flex-wrap: wrap; }
.sim-lbl { font-weight: 600; color: rgba(var(--v-theme-on-surface),.5); min-width: 100px; }
.sim-formula { font-family: monospace; font-size: 13px; color: rgba(var(--v-theme-on-surface),.7); }
.sim-input { width: 80px; border: 1px solid rgba(var(--v-theme-on-surface),.2); border-radius: 6px; padding: 3px 8px; font-size: 13px; background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); outline: none; }
.sim-result { font-size: 15px; font-weight: 800; color: #06b6d4; font-family: monospace; }
.sim-nivel { font-size: 11px; color: rgba(var(--v-theme-on-surface),.5); display: flex; align-items: center; gap: 4px; }

/* Toggle activo */
.lp-toggle { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border: 1px solid rgba(var(--v-theme-on-surface),.1); border-radius: 10px; cursor: pointer; transition: all .15s; }
.lp-toggle--on { border-color: rgba(6,182,212,.4); background: rgba(6,182,212,.04); }
</style>
