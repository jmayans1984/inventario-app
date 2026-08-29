<template>
  <MainLayout>
    <div class="op-container">

      <PageHeader
        title="Órdenes de Producción"
        description="Producción de subproductos según consumo · Cálculo de materia prima a comprar"
        :crumbs="['Almacén', 'Procesos', 'Órdenes de Producción']"
      >
        <template #actions>
          <v-btn color="primary" variant="flat" size="large" prepend-icon="mdi-plus" @click="abrirNueva">
            Nueva Orden
          </v-btn>
        </template>
      </PageHeader>

      <!-- TABLA DE ÓRDENES -->
      <div class="op-card">
        <div v-if="loading" class="op-loading">
          <v-progress-circular indeterminate color="var(--success)" size="40" />
        </div>
        <div v-else class="op-table-wrap">
          <table class="op-table">
            <thead>
              <tr>
                <th>#</th>
                <th>FECHA</th>
                <th>SUBPRODUCTO</th>
                <th class="tr">CANTIDAD</th>
                <th class="tr">CONSUMO ({{ '' }}VENTANA)</th>
                <th class="tr">COSTO MP ESTIMADO</th>
                <th class="tc">ESTADO</th>
                <th class="tc">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!ordenes.length">
                <td colspan="8" class="empty-row">
                  <v-icon size="40" color="var(--ink-400)">mdi-factory</v-icon>
                  <p>No hay órdenes de producción registradas</p>
                </td>
              </tr>
              <tr v-for="o in ordenes" :key="o.id" class="op-tr">
                <td><span class="cod-badge">{{ o.id }}</span></td>
                <td>{{ fmtFecha(o.fecha) }}</td>
                <td class="fw600">{{ o.receta_nombre || o.receta }}</td>
                <td class="tr fw600">{{ fmtNum(o.cantidad) }} {{ o.und }}</td>
                <td class="tr text-dim">{{ fmtNum(o.consumo_periodo) }} en {{ o.dias_ventana }} días</td>
                <td class="tr">{{ fmt(o.costo_total) }}</td>
                <td class="tc">
                  <span :class="o.estado === 'COMPLETADA' ? 'chip-ok' : 'chip-pend'">{{ o.estado }}</span>
                </td>
                <td class="tc">
                  <v-btn icon="mdi-eye-outline" size="x-small" variant="text" color="var(--indigo)" @click="verOrden(o)" />
                  <v-btn :icon="o.estado === 'COMPLETADA' ? 'mdi-undo-variant' : 'mdi-check-circle-outline'"
                    size="x-small" variant="text" color="var(--success)" @click="toggleEstado(o)" />
                  <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error"
                    :loading="eliminando === o.id" @click="eliminar(o)" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ══════════ DIALOG NUEVA ORDEN ══════════ -->
      <v-dialog v-model="dlgNueva" max-width="980" persistent>
        <v-card class="modal-card">
          <div class="modal-header">
            <v-icon color="var(--success)" class="mr-2">mdi-factory</v-icon>
            <span>Nueva Orden de Producción</span>
            <v-spacer />
            <v-btn icon="mdi-close" size="small" variant="text" @click="dlgNueva = false" />
          </div>
          <div class="modal-body">

            <!-- Paso 1: receta + ventana -->
            <div class="form-row">
              <div class="field-group field-grow">
                <label class="field-label">Subproducto a producir *</label>
                <select v-model="form.receta" class="field-input field-select" @change="calcularSugerencia">
                  <option value="">— Seleccionar subproducto —</option>
                  <option v-for="r in subproductos" :key="r.codigo" :value="r.codigo">
                    {{ r.nombre }} ({{ r.und }})
                  </option>
                </select>
              </div>
              <div class="field-group">
                <label class="field-label">Ventana de consumo</label>
                <div class="ventana-toggle">
                  <button v-for="d in [8, 15, 30]" :key="d"
                    :class="['ventana-btn', { active: form.dias === d }]"
                    @click="form.dias = d; calcularSugerencia()">
                    {{ d }} días
                  </button>
                </div>
              </div>
            </div>

            <!-- Loading sugerencia -->
            <div v-if="calculando" class="sug-loading">
              <v-progress-circular indeterminate color="var(--success)" size="28" />
              <span>Calculando consumo de los últimos {{ form.dias }} días...</span>
            </div>

            <template v-else-if="sugerencia">
              <!-- Paso 2: consumo calculado -->
              <div class="sug-cards">
                <div class="sug-card">
                  <div class="sug-lbl">Vendido Directo</div>
                  <div class="sug-val">{{ fmtNum(sugerencia.consumo.directo) }} {{ sugerencia.receta.und }}</div>
                </div>
                <div class="sug-card">
                  <div class="sug-lbl">Usado en Platos</div>
                  <div class="sug-val">{{ fmtNum(sugerencia.consumo.como_ingrediente) }} {{ sugerencia.receta.und }}</div>
                </div>
                <div class="sug-card sug-card--main">
                  <div class="sug-lbl">Consumo Total ({{ sugerencia.dias }} días)</div>
                  <div class="sug-val">{{ fmtNum(sugerencia.consumo.total) }} {{ sugerencia.receta.und }}</div>
                </div>
                <div class="sug-card">
                  <div class="sug-lbl">Promedio Diario</div>
                  <div class="sug-val">{{ fmtNum(sugerencia.consumo.promedio_diario) }} {{ sugerencia.receta.und }}/día</div>
                </div>
              </div>

              <!-- Paso 3: cantidad a producir -->
              <div class="form-row">
                <div class="field-group">
                  <label class="field-label">Cantidad a producir * ({{ sugerencia.receta.und }})</label>
                  <input v-model.number="form.cantidad" type="number" min="0" step="any"
                    class="field-input cant-input" />
                </div>
                <div class="field-group field-grow">
                  <label class="field-label">Notas</label>
                  <input v-model="form.notas" type="text" class="field-input" placeholder="Opcional..." />
                </div>
              </div>

              <!-- Paso 4: materia prima necesaria -->
              <div class="mp-section">
                <div class="mp-title">
                  <v-icon size="16" color="var(--success)">mdi-basket-outline</v-icon>
                  Materia prima necesaria para producir {{ fmtNum(form.cantidad) }} {{ sugerencia.receta.und }}
                </div>
                <div v-if="!sugerencia.ingredientes.length" class="mp-empty">
                  Esta receta no tiene ingredientes registrados en detalle de recetas.
                </div>
                <table v-else class="op-table mp-table">
                  <thead>
                    <tr>
                      <th>CÓDIGO</th>
                      <th>INGREDIENTE</th>
                      <th>UND</th>
                      <th class="tr">CANT × UND</th>
                      <th class="tr">CANT TOTAL A COMPRAR</th>
                      <th class="tr">COSTO UNIT</th>
                      <th class="tr">COSTO TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="ing in ingredientesCalculados" :key="ing.articulo">
                      <td><span class="cod-badge">{{ ing.articulo }}</span></td>
                      <td class="fw500">
                        {{ ing.nombre }}
                        <span v-if="ing.es_subreceta" class="chip-sub">SUBRECETA</span>
                      </td>
                      <td>{{ ing.und }}</td>
                      <td class="tr text-dim">{{ fmtNum(ing.cant_unitaria) }}</td>
                      <td class="tr fw600">{{ fmtNum(ing.cant_total) }}</td>
                      <td class="tr text-dim">{{ fmt(ing.costo_unit) }}</td>
                      <td class="tr">{{ fmt(ing.costo_total) }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="6" class="tr fw600">COSTO TOTAL MATERIA PRIMA:</td>
                      <td class="tr total-cell">{{ fmt(costoTotalMP) }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </template>

          </div>
          <div class="modal-footer">
            <v-btn variant="text" @click="dlgNueva = false">Cancelar</v-btn>
            <v-btn color="var(--success)" variant="flat" prepend-icon="mdi-content-save-outline"
              :disabled="!puedeGuardar" :loading="guardando" @click="guardarOrden">
              Guardar Orden
            </v-btn>
          </div>
        </v-card>
      </v-dialog>

      <!-- ══════════ DIALOG VER ORDEN ══════════ -->
      <v-dialog v-model="dlgVer" max-width="900">
        <v-card class="modal-card">
          <div class="modal-header">
            <v-icon color="var(--indigo)" class="mr-2">mdi-clipboard-text-outline</v-icon>
            <span>Orden de Producción #{{ ordenVer?.orden?.id }}</span>
            <v-spacer />
            <v-btn icon="mdi-printer-outline" size="small" variant="text" color="var(--success)" @click="imprimirOrden" />
            <v-btn icon="mdi-close" size="small" variant="text" @click="dlgVer = false" />
          </div>
          <div class="modal-body" v-if="ordenVer">
            <div class="ver-info">
              <div><span class="ver-lbl">Fecha:</span> {{ fmtFecha(ordenVer.orden.fecha) }}</div>
              <div><span class="ver-lbl">Subproducto:</span> <strong>{{ ordenVer.orden.receta_nombre }}</strong></div>
              <div><span class="ver-lbl">Cantidad:</span> {{ fmtNum(ordenVer.orden.cantidad) }} {{ ordenVer.orden.und }}</div>
              <div><span class="ver-lbl">Consumo base:</span> {{ fmtNum(ordenVer.orden.consumo_periodo) }} en {{ ordenVer.orden.dias_ventana }} días</div>
              <div><span class="ver-lbl">Estado:</span>
                <span :class="ordenVer.orden.estado === 'COMPLETADA' ? 'chip-ok' : 'chip-pend'">{{ ordenVer.orden.estado }}</span>
              </div>
              <div v-if="ordenVer.orden.notas"><span class="ver-lbl">Notas:</span> {{ ordenVer.orden.notas }}</div>
            </div>
            <table class="op-table mp-table">
              <thead>
                <tr>
                  <th>CÓDIGO</th>
                  <th>INGREDIENTE</th>
                  <th>UND</th>
                  <th class="tr">CANT TOTAL</th>
                  <th class="tr">COSTO UNIT</th>
                  <th class="tr">COSTO TOTAL</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in ordenVer.detalles" :key="d.id">
                  <td><span class="cod-badge">{{ d.articulo }}</span></td>
                  <td class="fw500">
                    {{ d.nombre }}
                    <span v-if="d.es_subreceta" class="chip-sub">SUBRECETA</span>
                  </td>
                  <td>{{ d.und }}</td>
                  <td class="tr fw600">{{ fmtNum(d.cant_total) }}</td>
                  <td class="tr text-dim">{{ fmt(d.costo_unit) }}</td>
                  <td class="tr">{{ fmt(d.costo_total) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="5" class="tr fw600">COSTO TOTAL:</td>
                  <td class="tr total-cell">{{ fmt(ordenVer.orden.costo_total) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </v-card>
      </v-dialog>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import { API_BASE } from '../../utils/constants.js'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const empresa = computed(() =>
  authStore.empresaCodigo || authStore.empresa || localStorage.getItem('empresaActual') || ''
)

// ── Estado ──────────────────────────────────────────────────────────────────
const loading      = ref(false)
const ordenes      = ref([])
const subproductos = ref([])
const eliminando   = ref(null)

const dlgNueva   = ref(false)
const calculando = ref(false)
const guardando  = ref(false)
const sugerencia = ref(null)
const form = ref({ receta: '', dias: 15, cantidad: 0, notas: '' })

const dlgVer   = ref(false)
const ordenVer = ref(null)

// ── Formatters ──────────────────────────────────────────────────────────────
function fmt(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtNum(v) {
  return (parseFloat(v) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })
}
function fmtFecha(s) {
  if (!s) return '—'
  const [y, m, d] = String(s).split('T')[0].split('-')
  return `${m}/${d}/${y}`
}

// ── Ingredientes recalculados según cantidad ────────────────────────────────
const ingredientesCalculados = computed(() => {
  if (!sugerencia.value) return []
  const cant = parseFloat(form.value.cantidad) || 0
  return sugerencia.value.ingredientes.map(ing => {
    const cantTotal = (parseFloat(ing.cant_unitaria) || 0) * cant
    const costoUnit = parseFloat(ing.costo_unit) || 0
    return { ...ing, cant_total: cantTotal, costo_total: cantTotal * costoUnit }
  })
})
const costoTotalMP = computed(() =>
  ingredientesCalculados.value.reduce((s, i) => s + i.costo_total, 0))

const puedeGuardar = computed(() =>
  !!form.value.receta && (parseFloat(form.value.cantidad) || 0) > 0 && !!sugerencia.value)

// ── Carga inicial ───────────────────────────────────────────────────────────
async function cargarOrdenes() {
  if (!empresa.value) return
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/almacen/ordenes-produccion?empresa=${empresa.value}`)
    const j = await res.json()
    ordenes.value = j.data || []
  } catch (e) {
    console.error('ordenes-produccion:', e)
  } finally {
    loading.value = false
  }
}

async function cargarSubproductos() {
  try {
    const res = await fetch(`${API_BASE}/recetas/para-selector`)
    const j = await res.json()
    subproductos.value = j.data || []
  } catch (e) {
    console.error('subproductos:', e)
  }
}

// ── Nueva orden ─────────────────────────────────────────────────────────────
function abrirNueva() {
  form.value = { receta: '', dias: 15, cantidad: 0, notas: '' }
  sugerencia.value = null
  dlgNueva.value = true
}

async function calcularSugerencia() {
  if (!form.value.receta) { sugerencia.value = null; return }
  calculando.value = true
  try {
    const params = new URLSearchParams({
      empresa: empresa.value, receta: form.value.receta, dias: String(form.value.dias),
    })
    const res = await fetch(`${API_BASE}/almacen/ordenes-produccion/sugerencia?${params}`)
    const j = await res.json()
    if (!j.success) throw new Error(j.error)
    sugerencia.value = j
    form.value.cantidad = Math.ceil(j.consumo.total)
  } catch (e) {
    console.error('sugerencia:', e)
    sugerencia.value = null
  } finally {
    calculando.value = false
  }
}

async function guardarOrden() {
  if (!puedeGuardar.value) return
  guardando.value = true
  try {
    const res = await fetch(`${API_BASE}/almacen/ordenes-produccion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa: empresa.value,
        receta: form.value.receta,
        receta_nombre: sugerencia.value.receta.nombre,
        und: sugerencia.value.receta.und,
        cantidad: form.value.cantidad,
        dias_ventana: form.value.dias,
        consumo_periodo: sugerencia.value.consumo.total,
        notas: form.value.notas,
        detalles: ingredientesCalculados.value,
      }),
    })
    const j = await res.json()
    if (!j.success) throw new Error(j.error)
    dlgNueva.value = false
    cargarOrdenes()
  } catch (e) {
    console.error('guardar orden:', e)
    alert('Error al guardar la orden: ' + e.message)
  } finally {
    guardando.value = false
  }
}

// ── Acciones sobre órdenes ──────────────────────────────────────────────────
async function verOrden(o) {
  try {
    const res = await fetch(`${API_BASE}/almacen/ordenes-produccion/${o.id}`)
    const j = await res.json()
    if (!j.success) throw new Error(j.error)
    ordenVer.value = j
    dlgVer.value = true
  } catch (e) {
    console.error('ver orden:', e)
  }
}

async function toggleEstado(o) {
  const nuevo = o.estado === 'COMPLETADA' ? 'PENDIENTE' : 'COMPLETADA'
  try {
    await fetch(`${API_BASE}/almacen/ordenes-produccion/${o.id}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevo }),
    })
    o.estado = nuevo
  } catch (e) {
    console.error('estado:', e)
  }
}

async function eliminar(o) {
  if (!confirm(`¿Eliminar la orden de producción #${o.id} (${o.receta_nombre})?`)) return
  eliminando.value = o.id
  try {
    await fetch(`${API_BASE}/almacen/ordenes-produccion/${o.id}`, { method: 'DELETE' })
    ordenes.value = ordenes.value.filter(x => x.id !== o.id)
  } catch (e) {
    console.error('eliminar:', e)
  } finally {
    eliminando.value = null
  }
}

// ── Impresión ───────────────────────────────────────────────────────────────
function imprimirOrden() {
  if (!ordenVer.value) return
  const o = ordenVer.value.orden
  const dets = ordenVer.value.detalles
  const filas = dets.map(d => `
    <tr>
      <td>${d.articulo}</td>
      <td>${d.nombre}${d.es_subreceta ? ' <em>(subreceta)</em>' : ''}</td>
      <td>${d.und || ''}</td>
      <td class="tr">${fmtNum(d.cant_total)}</td>
      <td class="tr">${fmt(d.costo_unit)}</td>
      <td class="tr">${fmt(d.costo_total)}</td>
    </tr>`).join('')

  const w = window.open('', '_blank')
  w.document.write(`<!DOCTYPE html><html><head><title>Orden de Producción #${o.id}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
      h1 { font-size: 18px; margin: 0 0 4px; }
      .sub { color: #666; font-size: 12px; margin-bottom: 16px; }
      .info { font-size: 13px; margin-bottom: 16px; line-height: 1.7; }
      .info strong { display: inline-block; min-width: 130px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { background: #f1f5f9; text-align: left; padding: 7px 9px; border: 1px solid #cbd5e1; font-size: 10.5px; }
      td { padding: 6px 9px; border: 1px solid #e2e8f0; }
      .tr { text-align: right; }
      tfoot td { font-weight: bold; background: #f8fafc; }
    </style></head><body>
    <h1>ORDEN DE PRODUCCIÓN #${o.id}</h1>
    <div class="sub">Generada: ${fmtFecha(o.fecha)} · Estado: ${o.estado}</div>
    <div class="info">
      <div><strong>Subproducto:</strong> ${o.receta_nombre} (${o.receta})</div>
      <div><strong>Cantidad a producir:</strong> ${fmtNum(o.cantidad)} ${o.und}</div>
      <div><strong>Consumo base:</strong> ${fmtNum(o.consumo_periodo)} ${o.und} en los últimos ${o.dias_ventana} días</div>
      ${o.notas ? `<div><strong>Notas:</strong> ${o.notas}</div>` : ''}
    </div>
    <table>
      <thead><tr><th>CÓDIGO</th><th>INGREDIENTE</th><th>UND</th><th class="tr">CANT A COMPRAR</th><th class="tr">COSTO UNIT</th><th class="tr">COSTO TOTAL</th></tr></thead>
      <tbody>${filas}</tbody>
      <tfoot><tr><td colspan="5" class="tr">COSTO TOTAL MATERIA PRIMA:</td><td class="tr">${fmt(o.costo_total)}</td></tr></tfoot>
    </table>
    <script>window.onload = () => window.print()<\/script>
    </body></html>`)
  w.document.close()
}

onMounted(() => {
  cargarOrdenes()
  cargarSubproductos()
})
</script>

<style scoped>
.op-container { padding: 0 0 32px; }


/* CARD / TABLA */
.op-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px; padding: 6px 0; overflow: hidden;
}
.op-loading { display: flex; justify-content: center; padding: 60px 0; }
.op-table-wrap { overflow-x: auto; }
.op-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.op-table th {
  text-align: left; font-size: 10.5px; font-weight: 800; letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.45); text-transform: uppercase;
  padding: 12px 14px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  white-space: nowrap;
}
.op-table td { padding: 10px 14px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); white-space: nowrap; }
.op-table .tr { text-align: right; }
.op-table .tc { text-align: center; }
.op-tr:hover { background: rgba(var(--v-theme-on-surface), 0.03); }
.empty-row { text-align: center; padding: 48px 0 !important; color: rgba(var(--v-theme-on-surface), 0.4); }
.empty-row p { margin: 8px 0 0; font-size: 13px; }
.fw500 { font-weight: 500; }
.fw600 { font-weight: 600; }
.text-dim { color: rgba(var(--v-theme-on-surface), 0.45); }
.cod-badge {
  font-family: monospace; font-size: 12px; font-weight: 700;
  background: rgba(var(--v-theme-on-surface), 0.06); padding: 2px 8px; border-radius: 6px;
}
.chip-ok {
  background: rgba(34,197,94,0.12); color: #16a34a;
  font-size: 10.5px; font-weight: 800; padding: 3px 10px; border-radius: 10px; letter-spacing: 0.4px;
}
.chip-pend {
  background: rgba(245,158,11,0.12); color: var(--gold);
  font-size: 10.5px; font-weight: 800; padding: 3px 10px; border-radius: 10px; letter-spacing: 0.4px;
}
.chip-sub {
  background: rgba(139,92,246,0.12); color: var(--indigo);
  font-size: 9.5px; font-weight: 800; padding: 2px 7px; border-radius: 8px; margin-left: 6px; letter-spacing: 0.3px;
}

/* MODAL */
.modal-card { border-radius: 14px !important; }
.modal-header {
  display: flex; align-items: center; padding: 16px 20px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  font-size: 15px; font-weight: 700;
}
.modal-body { padding: 20px; max-height: 72vh; overflow-y: auto; }
.modal-footer {
  display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

/* FORM */
.form-row { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; align-items: flex-end; }
.field-group { display: flex; flex-direction: column; gap: 5px; }
.field-grow { flex: 1; min-width: 240px; }
.field-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: rgba(var(--v-theme-on-surface), 0.5); }
.field-input {
  padding: 9px 12px; border-radius: 9px; font-size: 13.5px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.15);
  background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface));
  outline: none;
}
.field-input:focus { border-color: var(--success); }
.field-select { cursor: pointer; }
.cant-input { width: 160px; font-weight: 800; font-size: 16px; color: var(--success); }

.ventana-toggle {
  display: flex; border-radius: 9px; overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.15);
}
.ventana-btn {
  padding: 9px 16px; font-size: 12.5px; font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.55);
  background: transparent; border: none; cursor: pointer;
  transition: all 0.15s ease;
}
.ventana-btn + .ventana-btn { border-left: 1px solid rgba(var(--v-theme-on-surface), 0.1); }
.ventana-btn.active { background: var(--success); color: white; }

/* SUGERENCIA */
.sug-loading {
  display: flex; align-items: center; gap: 12px; padding: 24px 0;
  color: rgba(var(--v-theme-on-surface), 0.55); font-size: 13px;
}
.sug-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin-bottom: 18px; }
.sug-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 10px; padding: 12px 14px;
}
.sug-card--main { border-color: rgba(16,185,129,0.45); background: rgba(16,185,129,0.06); }
.sug-lbl { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: rgba(var(--v-theme-on-surface), 0.45); margin-bottom: 4px; }
.sug-val { font-size: 17px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); }
.sug-card--main .sug-val { color: var(--success); }

/* MP TABLE */
.mp-section { margin-top: 8px; }
.mp-title {
  display: flex; align-items: center; gap: 7px;
  font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px;
  color: rgb(var(--v-theme-on-surface)); margin-bottom: 10px;
}
.mp-empty { font-size: 13px; color: var(--gold); padding: 12px 0; }
.mp-table th { padding: 9px 12px; }
.mp-table td { padding: 8px 12px; }
.total-cell { font-weight: 800; color: var(--success); font-size: 14px; }

/* VER ORDEN */
.ver-info {
  display: flex; flex-direction: column; gap: 4px;
  font-size: 13.5px; margin-bottom: 16px;
  color: rgb(var(--v-theme-on-surface));
}
.ver-lbl { font-weight: 700; color: rgba(var(--v-theme-on-surface), 0.5); display: inline-block; min-width: 120px; }
</style>
