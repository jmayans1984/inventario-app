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
            <p class="lp-sub">Define márgenes de ganancia para calcular automáticamente los 3 precios de venta</p>
          </div>
        </div>
        <v-btn color="#06b6d4" variant="flat" rounded="lg" @click="abrirModal()">
          <v-icon start>mdi-plus</v-icon>Nueva Lista
        </v-btn>
      </div>

      <!-- NOTA INFORMATIVA -->
      <v-alert type="info" variant="tonal" density="compact" class="mb-5" icon="mdi-information-outline">
        <strong>Fórmula:</strong> Precio Venta = Precio Costo ÷ (1 − Margen%)
        &nbsp;·&nbsp; Ej: costo $100 con margen 35% → $100 / 0.65 = <strong>$153.85</strong>
        &nbsp;·&nbsp; El margen es sobre el precio de venta, no sobre el costo.
      </v-alert>

      <!-- TABLA -->
      <div class="lp-table-card">
        <v-progress-linear v-if="loading" indeterminate color="#06b6d4" height="3" />

        <div v-if="!loading && listas.length === 0" class="lp-empty">
          <v-icon size="48" color="rgba(var(--v-theme-on-surface),.12)" class="mb-2">mdi-tag-off-outline</v-icon>
          <div>No hay listas de precios configuradas</div>
        </div>

        <table v-else class="lp-table">
          <thead>
            <tr>
              <th>NOMBRE DE LISTA</th>
              <th class="ta-c">DÍAS CRÉDITO</th>
              <th class="ta-c">% VENTA 1</th>
              <th class="ta-c">PRECIO VENTA 1</th>
              <th class="ta-c">% VENTA 2</th>
              <th class="ta-c">PRECIO VENTA 2</th>
              <th class="ta-c">% VENTA 3</th>
              <th class="ta-c">PRECIO VENTA 3</th>
              <th class="ta-c">ESTADO</th>
              <th class="ta-c">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lp in listas" :key="lp.id" class="lp-row">
              <td class="lp-nombre">{{ lp.lista }}</td>
              <td class="ta-c">
                <span class="dias-badge">{{ lp.dias_credito ?? 0 }} días</span>
              </td>
              <!-- Venta 1 -->
              <td class="ta-c">
                <span class="pct-badge pct-1">{{ fmtPct(lp.margen_venta1) }}</span>
              </td>
              <td class="ta-c preview-price">
                {{ lp.margen_venta1 > 0 ? '÷ ' + (1 - lp.margen_venta1).toFixed(2) : '—' }}
              </td>
              <!-- Venta 2 -->
              <td class="ta-c">
                <span class="pct-badge pct-2">{{ fmtPct(lp.margen_venta2) }}</span>
              </td>
              <td class="ta-c preview-price">
                {{ lp.margen_venta2 > 0 ? '÷ ' + (1 - lp.margen_venta2).toFixed(2) : '—' }}
              </td>
              <!-- Venta 3 -->
              <td class="ta-c">
                <span class="pct-badge pct-3">{{ fmtPct(lp.margen_venta3) }}</span>
              </td>
              <td class="ta-c preview-price">
                {{ lp.margen_venta3 > 0 ? '÷ ' + (1 - lp.margen_venta3).toFixed(2) : '—' }}
              </td>
              <!-- Estado -->
              <td class="ta-c">
                <span :class="lp.activo === 'SI' ? 'chip-activo' : 'chip-inactivo'">
                  {{ lp.activo === 'SI' ? 'ACTIVO' : 'INACTIVO' }}
                </span>
              </td>
              <!-- Acciones -->
              <td class="ta-c">
                <v-tooltip text="Recalcular precios de todos los productos con esta lista">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-calculator-variant-outline" size="x-small"
                      variant="tonal" color="#f59e0b" class="mr-1"
                      :loading="recalculando === lp.id"
                      :disabled="!lp.margen_venta1 && !lp.margen_venta2 && !lp.margen_venta3"
                      @click="recalcular(lp)" />
                  </template>
                </v-tooltip>
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
    <v-dialog v-model="dlg" max-width="560" persistent scrollable>
      <v-card rounded="xl" style="overflow:hidden">

        <div class="dlg-header">
          <div class="dlg-icon"><v-icon size="20" color="white">mdi-tag-multiple-outline</v-icon></div>
          <div class="dlg-titles">
            <div class="dlg-title">{{ editando ? 'Editar Lista de Precios' : 'Nueva Lista de Precios' }}</div>
            <div class="dlg-sub">Define márgenes sobre precio de venta</div>
          </div>
          <v-btn icon="mdi-close" size="small" variant="text" color="white" @click="dlg=false" />
        </div>

        <v-card-text class="pa-5">

          <!-- Nombre + Días -->
          <div class="dlg-section-label">IDENTIFICACIÓN</div>
          <div class="dlg-row-2" style="grid-template-columns:1fr 130px">
            <div>
              <div class="dlg-field-label">Nombre *</div>
              <v-text-field v-model="form.lista" variant="outlined" density="compact" hide-details
                maxlength="80" placeholder="Ej: PRECIO CONTADO"
                :error="!!errores.lista" @input="form.lista = form.lista.toUpperCase()" />
              <div v-if="errores.lista" class="dlg-err">{{ errores.lista }}</div>
            </div>
            <div>
              <div class="dlg-field-label">Días Crédito</div>
              <v-text-field v-model.number="form.dias_credito" type="number" min="0"
                variant="outlined" density="compact" hide-details placeholder="0" />
            </div>
          </div>

          <v-divider class="my-4" />

          <!-- Márgenes -->
          <div class="dlg-section-label">MÁRGENES SOBRE PRECIO DE VENTA</div>
          <div class="dlg-row-3">
            <div>
              <div class="dlg-field-label">% Venta 1</div>
              <v-text-field v-model.number="form.margen_venta1_pct" type="number" min="0" max="99"
                variant="outlined" density="compact" hide-details suffix="%" placeholder="0"
                @update:model-value="syncMargen(1)" />
              <div class="dlg-preview" v-if="form.margen_venta1_pct > 0">
                ÷ {{ (1 - form.margen_venta1_pct/100).toFixed(4) }}
              </div>
            </div>
            <div>
              <div class="dlg-field-label">% Venta 2</div>
              <v-text-field v-model.number="form.margen_venta2_pct" type="number" min="0" max="99"
                variant="outlined" density="compact" hide-details suffix="%" placeholder="0"
                @update:model-value="syncMargen(2)" />
              <div class="dlg-preview" v-if="form.margen_venta2_pct > 0">
                ÷ {{ (1 - form.margen_venta2_pct/100).toFixed(4) }}
              </div>
            </div>
            <div>
              <div class="dlg-field-label">% Venta 3</div>
              <v-text-field v-model.number="form.margen_venta3_pct" type="number" min="0" max="99"
                variant="outlined" density="compact" hide-details suffix="%" placeholder="0"
                @update:model-value="syncMargen(3)" />
              <div class="dlg-preview" v-if="form.margen_venta3_pct > 0">
                ÷ {{ (1 - form.margen_venta3_pct/100).toFixed(4) }}
              </div>
            </div>
          </div>

          <!-- Simulador de precio -->
          <div v-if="form.margen_venta1_pct > 0 || form.margen_venta2_pct > 0 || form.margen_venta3_pct > 0"
            class="dlg-simulator">
            <div class="sim-title">
              <v-icon size="15" color="#f59e0b" class="mr-1">mdi-calculator-variant-outline</v-icon>
              Simulador — costo de ejemplo:
              <input v-model.number="simCosto" type="number" min="0" class="sim-input" />
            </div>
            <div class="sim-prices">
              <div v-if="form.margen_venta1_pct > 0" class="sim-price sim-p1">
                <span class="sim-lbl">Venta 1 ({{ form.margen_venta1_pct }}%)</span>
                <span class="sim-val">{{ simPrecio(form.margen_venta1_pct) }}</span>
              </div>
              <div v-if="form.margen_venta2_pct > 0" class="sim-price sim-p2">
                <span class="sim-lbl">Venta 2 ({{ form.margen_venta2_pct }}%)</span>
                <span class="sim-val">{{ simPrecio(form.margen_venta2_pct) }}</span>
              </div>
              <div v-if="form.margen_venta3_pct > 0" class="sim-price sim-p3">
                <span class="sim-lbl">Venta 3 ({{ form.margen_venta3_pct }}%)</span>
                <span class="sim-val">{{ simPrecio(form.margen_venta3_pct) }}</span>
              </div>
            </div>
          </div>

          <v-divider class="my-4" />

          <!-- Estado -->
          <div class="dlg-section-label">ESTADO</div>
          <div class="lp-toggle" :class="{ 'lp-toggle--on': form.activo === 'SI' }"
            @click="form.activo = form.activo === 'SI' ? 'NO' : 'SI'">
            <div>
              <div class="dlg-field-label" style="margin-bottom:1px">Lista activa</div>
              <div style="font-size:11px;color:rgba(var(--v-theme-on-surface),.45)">Disponible para usar en productos</div>
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

    <!-- ══ CONFIRM RECALCULAR ══ -->
    <v-dialog v-model="dlgRecalc" max-width="440">
      <v-card rounded="xl" class="pa-6 text-center">
        <v-icon size="48" color="#f59e0b" class="mb-3">mdi-calculator-variant-outline</v-icon>
        <p class="text-subtitle-1 font-weight-bold mb-1">¿Recalcular todos los precios?</p>
        <p class="text-caption text-medium-emphasis mb-1">
          Lista: <strong>{{ listaPendiente?.lista }}</strong>
        </p>
        <p class="text-caption text-medium-emphasis mb-4">
          Se actualizarán los precios de venta de <strong>todos</strong> los productos que tengan
          precio de costo mayor a 0, usando la fórmula:<br>
          <code>precio_venta = costo ÷ (1 − margen)</code>
        </p>
        <div class="d-flex gap-2 justify-center">
          <v-btn variant="text" @click="dlgRecalc=false">Cancelar</v-btn>
          <v-btn color="#f59e0b" variant="flat" rounded="lg" :loading="recalculando === listaPendiente?.id" @click="confirmarRecalcular">
            <v-icon start>mdi-calculator-variant-outline</v-icon>Recalcular
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- ══ CONFIRM ELIMINAR ══ -->
    <v-dialog v-model="dlgEliminar" max-width="380">
      <v-card rounded="xl" class="pa-6 text-center">
        <v-icon size="48" color="error" class="mb-3">mdi-delete-alert-outline</v-icon>
        <p class="text-subtitle-1 font-weight-bold mb-1">¿Eliminar lista?</p>
        <p class="text-caption text-medium-emphasis mb-4">
          <strong>{{ eliminando?.lista }}</strong> será eliminada permanentemente.
        </p>
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
const recalculando = ref(null)
const dlg         = ref(false)
const dlgRecalc   = ref(false)
const dlgEliminar = ref(false)
const editando    = ref(false)
const eliminando  = ref(null)
const listaPendiente = ref(null)
const msgError    = ref('')
const errores     = ref({})
const simCosto    = ref(100)
const snack = ref({ show: false, msg: '', color: 'success' })

const formVacio = () => ({
  id: null, lista: '', dias_credito: 0, activo: 'SI',
  margen_venta1: 0, margen_venta2: 0, margen_venta3: 0,
  margen_venta1_pct: 0, margen_venta2_pct: 0, margen_venta3_pct: 0,
})
const form = ref(formVacio())

const formActivoBool = computed({
  get: () => form.value.activo === 'SI',
  set: (v) => { form.value.activo = v ? 'SI' : 'NO' }
})

function syncMargen(n) {
  const pct = parseFloat(form.value[`margen_venta${n}_pct`]) || 0
  form.value[`margen_venta${n}`] = pct / 100
}

function fmtPct(val) {
  const v = parseFloat(val) || 0
  return v > 0 ? (v * 100).toFixed(1) + '%' : '—'
}

function simPrecio(pct) {
  const c = parseFloat(simCosto.value) || 0
  const m = parseFloat(pct) / 100
  if (!c || m <= 0 || m >= 1) return '—'
  return '$' + (c / (1 - m)).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
    form.value = {
      id: lp.id, lista: lp.lista, dias_credito: lp.dias_credito ?? 0, activo: lp.activo || 'SI',
      margen_venta1: parseFloat(lp.margen_venta1) || 0,
      margen_venta2: parseFloat(lp.margen_venta2) || 0,
      margen_venta3: parseFloat(lp.margen_venta3) || 0,
      margen_venta1_pct: Math.round((parseFloat(lp.margen_venta1) || 0) * 10000) / 100,
      margen_venta2_pct: Math.round((parseFloat(lp.margen_venta2) || 0) * 10000) / 100,
      margen_venta3_pct: Math.round((parseFloat(lp.margen_venta3) || 0) * 10000) / 100,
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
  try {
    // Sincronizar márgenes desde porcentajes antes de guardar
    syncMargen(1); syncMargen(2); syncMargen(3)
    const payload = {
      lista: form.value.lista.trim().toUpperCase(),
      dias_credito: parseInt(form.value.dias_credito) || 0,
      activo: form.value.activo,
      margen_venta1: form.value.margen_venta1,
      margen_venta2: form.value.margen_venta2,
      margen_venta3: form.value.margen_venta3,
    }
    if (editando.value) {
      await api.put(`/produccion/lista-precios/${form.value.id}`, payload)
      ok('Lista actualizada')
    } else {
      const r = await api.post('/produccion/lista-precios', payload)
      listas.value.push(r.data.data)
      ok('Lista creada')
    }
    dlg.value = false
    await cargar()
  } catch (e) {
    msgError.value = e?.response?.data?.error || e.message
  } finally { guardando.value = false }
}

function recalcular(lp) { listaPendiente.value = lp; dlgRecalc.value = true }

async function confirmarRecalcular() {
  recalculando.value = listaPendiente.value.id
  try {
    const r = await api.post(`/produccion/lista-precios/${listaPendiente.value.id}/recalcular`)
    ok(`✅ ${r.data.actualizados} producto(s) actualizados con los nuevos precios`)
    dlgRecalc.value = false
  } catch (e) {
    err(e?.response?.data?.error || e.message)
  } finally { recalculando.value = null }
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
.lp-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
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
.lp-table thead th { padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.45); background: rgba(var(--v-theme-on-surface),.03); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); white-space: nowrap; }
.lp-table thead th.ta-c { text-align: center; }
.lp-row td { padding: 10px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); }
.lp-row:hover td { background: rgba(var(--v-theme-on-surface),.02); }
.lp-nombre { font-weight: 600; font-size: 13px; }
.ta-c { text-align: center !important; }
.dias-badge { background: rgba(var(--v-theme-on-surface),.08); padding: 2px 8px; border-radius: 5px; font-size: 11px; font-family: monospace; }
.pct-badge { padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 700; }
.pct-1 { background: rgba(34,197,94,.12); color: #16a34a; }
.pct-2 { background: rgba(6,182,212,.12); color: #0891b2; }
.pct-3 { background: rgba(139,92,246,.12); color: #7c3aed; }
.preview-price { font-size: 11px; color: rgba(var(--v-theme-on-surface),.45); font-family: monospace; }
.chip-activo   { background: rgba(34,197,94,.12); color: #16a34a; padding: 2px 8px; border-radius: 5px; font-size: 10px; font-weight: 700; }
.chip-inactivo { background: rgba(var(--v-theme-on-surface),.08); color: rgba(var(--v-theme-on-surface),.4); padding: 2px 8px; border-radius: 5px; font-size: 10px; font-weight: 700; }

/* Dialog */
.dlg-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; background: linear-gradient(135deg,#0891b2,#0e7490); }
.dlg-icon { width: 38px; height: 38px; border-radius: 10px; background: rgba(255,255,255,.18); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dlg-titles { flex: 1; }
.dlg-title { font-size: 15px; font-weight: 700; color: white; }
.dlg-sub { font-size: 11px; color: rgba(255,255,255,.55); margin-top: 1px; }
.dlg-section-label { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.4); margin-bottom: 10px; }
.dlg-row-2 { display: grid; gap: 12px; }
.dlg-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.dlg-field-label { font-size: 11px; color: rgba(var(--v-theme-on-surface),.55); margin-bottom: 4px; font-weight: 500; }
.dlg-err { font-size: 11px; color: #ef4444; margin-top: 2px; }
.dlg-preview { font-size: 10px; color: rgba(var(--v-theme-on-surface),.45); font-family: monospace; margin-top: 4px; text-align: center; }
.dlg-footer { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid rgba(var(--v-theme-on-surface),.08); }
.dlg-error { display: flex; align-items: center; font-size: 12px; color: #ef4444; background: rgba(239,68,68,.07); border-radius: 8px; padding: 8px 12px; }

/* Simulador */
.dlg-simulator { background: rgba(245,158,11,.06); border: 1px solid rgba(245,158,11,.2); border-radius: 10px; padding: 12px 14px; margin-top: 12px; }
.sim-title { display: flex; align-items: center; gap: 6px; font-size: 12px; color: rgba(var(--v-theme-on-surface),.7); margin-bottom: 10px; flex-wrap: wrap; }
.sim-input { width: 90px; border: 1px solid rgba(var(--v-theme-on-surface),.2); border-radius: 6px; padding: 3px 8px; font-size: 13px; background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); outline: none; }
.sim-prices { display: flex; gap: 10px; flex-wrap: wrap; }
.sim-price { display: flex; flex-direction: column; align-items: center; padding: 8px 14px; border-radius: 8px; }
.sim-p1 { background: rgba(34,197,94,.1); }
.sim-p2 { background: rgba(6,182,212,.1); }
.sim-p3 { background: rgba(139,92,246,.1); }
.sim-lbl { font-size: 10px; color: rgba(var(--v-theme-on-surface),.5); font-weight: 600; text-transform: uppercase; letter-spacing: .4px; }
.sim-val { font-size: 16px; font-weight: 800; font-family: monospace; margin-top: 2px; }

/* Toggle activo */
.lp-toggle { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border: 1px solid rgba(var(--v-theme-on-surface),.1); border-radius: 10px; cursor: pointer; transition: all .15s; }
.lp-toggle--on { border-color: rgba(6,182,212,.4); background: rgba(6,182,212,.04); }
</style>
