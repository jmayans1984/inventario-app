<template>
  <MainLayout>
    <div class="rg-container">

      <PageHeader
        title="Gestión de Costos"
        description="Recalcula los costos de tus recetas según los precios actuales de artículos"
        :crumbs="['Recetas', 'Procesos', 'Gestión de Costos']"
      >
        <template #actions>
          <v-btn color="warning" variant="flat" rounded="lg" :loading="recalculandoTodos"
            @click="recalcularTodos">
            <v-icon start>mdi-refresh</v-icon> Recalcular TODOS
          </v-btn>
        </template>
      </PageHeader>

      <!-- EXPLICACIÓN -->
      <v-alert type="warning" variant="tonal" density="compact" class="mb-4" icon="mdi-information-outline">
        <strong>¿Cómo funciona?</strong> El sistema recalcula primero las <strong>subrecetas</strong> y artículos de
        tipo <strong>PRODUCTO PROPIO</strong> (actualizando su precio en la tabla de artículos),
        y luego recalcula los platos principales que las usan. Así se evita el caos de precios.
      </v-alert>

      <!-- RESULTADO RECALCULO -->
      <v-expand-transition>
        <v-alert v-if="resultadoRecalculo" type="success" variant="tonal" class="mb-4" closable
          @click:close="resultadoRecalculo=null">
          <strong>{{ resultadoRecalculo.recalculadas }} recetas</strong> actualizadas correctamente.
        </v-alert>
      </v-expand-transition>

      <!-- KPI MINI -->
      <div class="kpi-grid">
        <KpiCard :index="0" label="Total Recetas" :value="String(kpis.total)" icon="mdi-chef-hat" color="var(--gold)" />
        <KpiCard :index="1" label="Artículos" :value="String(kpis.articulos)" icon="mdi-food-apple-outline" color="var(--indigo)" />
        <KpiCard :index="2" label="Subrecetas" :value="String(kpis.subrecetas)" icon="mdi-link-variant" color="var(--indigo)" />
        <KpiCard :index="3" label="% Costo Prom." :value="`${kpis.pctPromedio}%`" icon="mdi-percent" color="var(--success)" />
      </div>

      <!-- TABLA RECETAS CON COSTOS -->
      <div class="rg-table-card">
        <div class="rg-table-header">
          <span class="rg-table-title">Recetas y sus costos actuales</span>
          <div class="d-flex gap-2">
            <v-text-field v-model="busqueda" placeholder="Buscar..." prepend-inner-icon="mdi-magnify"
              variant="outlined" density="compact" hide-details clearable style="max-width:240px" />
            <v-select v-model="filtroTipo" :items="tiposFiltro" item-title="label" item-value="val"
              variant="outlined" density="compact" hide-details style="max-width:180px" />
          </div>
        </div>

        <v-progress-linear v-if="loading || recalculandoTodos" indeterminate color="#f59e0b" height="3" />

        <v-data-table
          :headers="headers"
          :items="recetasFiltradas"
          :search="busqueda"
          density="compact"
          hover
          :items-per-page="20"
        >
          <template #item.subproducto="{ item }">
            <v-chip :color="item.subproducto === 'SI' ? 'purple' : 'cyan'" size="x-small" variant="tonal" label>
              {{ item.subproducto === 'SI' ? 'SUBPRODUCTO' : 'RECETA' }}
            </v-chip>
          </template>

          <template #item.valor="{ item }">
            <span class="font-mono font-weight-bold" :style="{ color: '#ef4444' }">
              {{ fmt(item.valor) }}
            </span>
          </template>

          <template #item.precio_venta="{ item }">
            <span class="font-mono">{{ fmt(item.precio_venta) }}</span>
          </template>

          <template #item.margen="{ item }">
            <span class="font-mono" :style="{ color: margenColor(item) }">
              {{ fmt(parseFloat(item.precio_venta) - parseFloat(item.valor)) }}
            </span>
          </template>

          <template #item.porcentaje_costo="{ item }">
            <div class="d-flex align-center gap-2">
              <v-progress-linear
                :model-value="Math.min(parseFloat(item.porcentaje_costo)||0, 100)"
                :color="colorPct(item.porcentaje_costo)"
                height="6" rounded style="min-width:50px; max-width:80px" />
              <span class="text-caption font-weight-bold" :style="{ color: colorPctStr(item.porcentaje_costo) }">
                {{ item.porcentaje_costo }}%
              </span>
            </div>
          </template>

          <template #item.acciones="{ item }">
            <v-tooltip text="Recalcular costo de esta receta">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon size="x-small" variant="tonal" color="warning"
                  :loading="recalculando[item.codigo]"
                  @click="recalcularUna(item)">
                  <v-icon size="16">mdi-refresh</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
          </template>
        </v-data-table>
      </div>
    </div>

    <!-- DIALOG RECALCULAR COSTOS -->
    <v-dialog v-model="dlgRecalcular" max-width="420" persistent>
      <v-card rounded="xl">
        <v-card-text class="pa-6">
          <div class="d-flex align-center mb-4" style="gap:12px">
            <v-icon size="32" color="#f59e0b">mdi-calculator-variant-outline</v-icon>
            <div>
              <div class="text-subtitle-1 font-weight-bold">Recalculando Costos</div>
              <div class="text-caption text-medium-emphasis">{{ recalcFase }}</div>
            </div>
          </div>
          <v-progress-linear
            :model-value="recalcTotal > 0 ? (recalcHecho / recalcTotal * 100) : 0"
            color="#f59e0b" height="8" rounded bg-color="rgba(245,158,11,.12)" class="mb-3" />
          <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-caption text-medium-emphasis" style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              {{ recalcActualNombre || '...' }}
            </span>
            <span class="text-caption font-weight-bold" style="flex-shrink:0">
              {{ recalcHecho }} / {{ recalcTotal }}
            </span>
          </div>
          <div v-if="recalcDone" class="d-flex align-center justify-center mt-4" style="gap:8px">
            <v-icon color="#f59e0b">mdi-check-circle-outline</v-icon>
            <span class="text-body-2 font-weight-medium" style="color:#d97706">¡Costos actualizados!</span>
          </div>
        </v-card-text>
        <v-card-actions v-if="recalcDone" class="pa-4 justify-end">
          <v-btn color="warning" variant="flat" rounded="lg" @click="dlgRecalcular=false">
            <v-icon start>mdi-check</v-icon>Cerrar
          </v-btn>
        </v-card-actions>
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
import PageHeader from '../../components/common/PageHeader.vue'
import KpiCard from '../../components/common/KpiCard.vue'
import { API_BASE } from '../../utils/constants.js'

const recetas     = ref([])
const articulos   = ref([])
const loading     = ref(false)
const busqueda    = ref('')
const filtroTipo  = ref('TODOS')
const recalculandoTodos  = ref(false)
const recalculando       = ref({})
const resultadoRecalculo = ref(null)
const dlgRecalcular      = ref(false)
const recalcTotal        = ref(0)
const recalcHecho        = ref(0)
const recalcActualNombre = ref('')
const recalcFase         = ref('')
const recalcDone         = ref(false)

const headers = [
  { title: 'CÓDIGO',    key: 'codigo',          width: 90 },
  { title: 'NOMBRE',    key: 'nombre',          minWidth: 160 },
  { title: 'TIPO',      key: 'subproducto',     width: 130 },
  { title: 'GRUPO',     key: 'grupo_receta',    width: 120 },
  { title: 'INGRED.',   key: 'num_ingredientes',width: 80, align: 'center' },
  { title: 'COSTO',     key: 'valor',           width: 120, align: 'end' },
  { title: 'P.VENTA',   key: 'precio_venta',    width: 120, align: 'end' },
  { title: 'MARGEN',    key: 'margen',          width: 120, align: 'end' },
  { title: '% COSTO',   key: 'porcentaje_costo',width: 160 },
  { title: '',          key: 'acciones',        width: 60, sortable: false, align: 'center' },
]

const tiposFiltro = computed(() => [
  { label: 'Todas', val: 'TODOS' },
  { label: 'Solo Recetas', val: 'NO' },
  { label: 'Solo Subproductos', val: 'SI' },
])

const recetasFiltradas = computed(() => {
  let r = recetas.value
  if (filtroTipo.value !== 'TODOS') r = r.filter(x => x.subproducto === filtroTipo.value)
  return r
})

const kpis = computed(() => {
  const r = recetas.value
  const conPV = r.filter(x => parseFloat(x.precio_venta) > 0)
  return {
    total:      r.length,
    articulos:  articulos.value.length,
    subrecetas: r.filter(x => x.subproducto === 'SI').length,
    pctPromedio: conPV.length > 0
      ? (conPV.reduce((s, x) => s + parseFloat(x.porcentaje_costo), 0) / conPV.length).toFixed(1)
      : '0.0',
  }
})

const snack = ref({ show: false, msg: '', color: 'success' })
function ok(msg)  { snack.value = { show: true, msg, color: 'success' } }
function err(msg) { snack.value = { show: true, msg, color: 'error' } }

async function cargar() {
  loading.value = true
  try {
    const [rr, ra] = await Promise.all([
      fetch(`${API_BASE}/recetas`).then(r => r.json()),
      fetch(`${API_BASE}/articulos`).then(r => r.json()),
    ])
    recetas.value   = rr.data || []
    articulos.value = ra.data || []
  } catch { err('Error al cargar datos') }
  finally { loading.value = false }
}

async function recalcularTodos() {
  const lista = [
    ...recetas.value.filter(r => r.subproducto === 'SI'),
    ...recetas.value.filter(r => r.subproducto !== 'SI'),
  ]
  recalcTotal.value        = lista.length * 2
  recalcHecho.value        = 0
  recalcActualNombre.value = ''
  recalcDone.value         = false
  dlgRecalcular.value      = true
  recalculandoTodos.value  = true
  resultadoRecalculo.value = null

  const calcular = async (receta) => {
    recalcActualNombre.value = receta.nombre
    try {
      await fetch(`${API_BASE}/recetas/${encodeURIComponent(receta.codigo)}/calcular-costo`, { method: 'POST' })
    } catch { /* continuar */ }
    recalcHecho.value++
  }

  recalcFase.value = 'Pasada 1 de 2 — calculando costos base'
  for (const r of lista) await calcular(r)

  recalcFase.value = 'Pasada 2 de 2 — actualizando recetas con subrecetas'
  for (const r of lista) await calcular(r)

  recalcDone.value         = true
  recalcFase.value         = ''
  recalcActualNombre.value = ''
  recalculandoTodos.value  = false
  resultadoRecalculo.value = { recalculadas: lista.length }
  await cargar()
}

async function recalcularUna(receta) {
  recalculando.value[receta.codigo] = true
  try {
    const r = await fetch(`${API_BASE}/recetas/${receta.codigo}/calcular-costo`, { method: 'POST' })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    ok(`Costo recalculado: ${fmt(j.costo)}`)
    await cargar()
  } catch (e) { err(e.message) }
  finally { recalculando.value[receta.codigo] = false }
}

function fmt(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function colorPct(pct) {
  const p = parseFloat(pct) || 0
  if (p <= 30) return 'green'
  if (p <= 45) return 'warning'
  return 'error'
}
function colorPctStr(pct) {
  const p = parseFloat(pct) || 0
  if (p <= 30) return '#22c55e'
  if (p <= 45) return '#f59e0b'
  return '#ef4444'
}
function margenColor(item) {
  const m = parseFloat(item.precio_venta) - parseFloat(item.valor)
  return m >= 0 ? '#22c55e' : '#ef4444'
}

onMounted(cargar)
</script>

<style scoped>
.rg-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.rg-table-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 16px; overflow: hidden; }
.rg-table-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 16px 0; gap: 12px; flex-wrap: wrap; }
.rg-table-title { font-size: 14px; font-weight: 700; }
.font-mono { font-family: monospace; }
</style>
