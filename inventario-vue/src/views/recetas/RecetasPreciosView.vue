<template>
  <MainLayout>
    <div class="rp-container">

      <PageHeader
        title="Precios de Venta"
        description="Actualiza los precios de venta · Navega con Enter o ↓↑"
        :crumbs="['Recetas', 'Configuración', 'Precios de Venta']"
      >
        <template #actions>
          <v-chip v-if="pendientes.size" color="warning" variant="tonal" size="small" prepend-icon="mdi-circle-edit-outline">
            {{ pendientes.size }} cambio{{ pendientes.size > 1 ? 's' : '' }} sin guardar
          </v-chip>
          <v-btn color="grey" variant="tonal" rounded="lg" :disabled="!pendientes.size" @click="descartarTodo">
            <v-icon start>mdi-close</v-icon>Descartar
          </v-btn>
          <v-btn color="warning" variant="flat" rounded="lg" :loading="guardandoTodo"
            :disabled="!pendientes.size" @click="guardarTodo">
            <v-icon start>mdi-content-save-all-outline</v-icon>Guardar Todo
          </v-btn>
        </template>
      </PageHeader>

      <!-- FILTROS -->
      <div class="rp-filters">
        <v-text-field v-model="busqueda" placeholder="Buscar receta..." prepend-inner-icon="mdi-magnify"
          variant="outlined" density="compact" hide-details clearable style="max-width:300px" />
        <v-select v-model="filtroGrupo" :items="gruposFilter" item-title="label" item-value="val"
          variant="outlined" density="compact" hide-details style="max-width:200px" />
        <v-btn-toggle v-model="filtroTipo" density="compact" rounded="lg" color="warning">
          <v-btn value="TODOS" size="small">Todas</v-btn>
          <v-btn value="NO"   size="small">Recetas</v-btn>
          <v-btn value="SI"   size="small">Subproductos</v-btn>
        </v-btn-toggle>
        <v-spacer />
        <div class="rp-hint">
          <v-icon size="15" color="grey">mdi-keyboard-return</v-icon>
          <span>Enter guarda y baja · Esc descarta fila</span>
        </div>
      </div>

      <!-- KPI MINI -->
      <div class="kpi-grid">
        <KpiCard :index="0" label="Recetas visibles" :value="String(recetasFiltradas.length)" icon="mdi-book-open-variant-outline" color="var(--gold)" />
        <KpiCard :index="1" label="Con precio" :value="String(conPrecio)" icon="mdi-tag-check-outline" color="var(--success)" />
        <KpiCard :index="2" label="Sin precio" :value="String(sinPrecio)" icon="mdi-tag-off-outline" color="var(--error)" />
        <KpiCard :index="3" label="Pendientes" :value="String(pendientes.size)" icon="mdi-circle-edit-outline" color="var(--gold)" />
      </div>

      <!-- GRID -->
      <div class="rp-grid-card">
        <v-progress-linear v-if="loading || guardandoTodo" indeterminate color="#f59e0b" height="3" />

        <div class="rp-grid-scroll">
          <table class="rp-grid">
            <thead>
              <tr>
                <th class="col-cod">CÓDIGO</th>
                <th class="col-nom">NOMBRE</th>
                <th class="col-grp">GRUPO</th>
                <th class="col-tipo">TIPO</th>
                <th class="col-costo">COSTO</th>
                <th class="col-pct">% COSTO</th>
                <th class="col-pv">PRECIO VENTA</th>
                <th class="col-est">ESTADO</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="recetasFiltradas.length === 0">
                <td colspan="8" class="text-center pa-6 text-disabled">No hay recetas</td>
              </tr>
              <tr
                v-for="(item, idx) in recetasFiltradas"
                :key="item.codigo"
                :class="['rp-row', {
                  'rp-row--modified': pendientes.has(item.codigo),
                  'rp-row--saved':    guardadosOk.has(item.codigo),
                  'rp-row--focused':  filaActiva === idx,
                }]"
                :style="filaActiva === idx ? { background: rowHoverBg } : {}"
                @click="enfocar(idx)"
              >
                <td class="col-cod font-mono">{{ item.codigo }}</td>
                <td class="col-nom">
                  <span class="nombre-cell">{{ item.nombre }}</span>
                </td>
                <td class="col-grp">
                  <span class="text-caption text-medium-emphasis">{{ item.grupo_nombre || item.grupo_receta || '—' }}</span>
                </td>
                <td class="col-tipo">
                  <v-chip :color="item.subproducto === 'SI' ? 'purple' : 'cyan'" size="x-small" variant="tonal" label>
                    {{ item.subproducto === 'SI' ? 'SUB' : 'REC' }}
                  </v-chip>
                </td>
                <td class="col-costo font-mono text-right">
                  <span style="color:#ef4444;font-weight:600">{{ fmt(item.valor) }}</span>
                </td>
                <td class="col-pct">
                  <div class="pct-wrap">
                    <div class="pct-bar-bg">
                      <div class="pct-bar-fill"
                        :style="{ width: Math.min(pctActual(item),100)+'%', background: colorPct(item) }" />
                    </div>
                    <span class="pct-label" :style="{ color: colorPct(item) }">
                      {{ pctActualStr(item) }}
                    </span>
                  </div>
                </td>
                <td class="col-pv">
                  <div class="pv-input-wrap">
                    <span class="pv-prefix">$</span>
                    <input
                      :ref="el => { if (el) inputRefs[idx] = el }"
                      type="text"
                      inputmode="decimal"
                      class="pv-input"
                      :class="{ 'pv-input--modified': pendientes.has(item.codigo) }"
                      :value="editValues[item.codigo]"
                      @input="onInput(item, $event)"
                      @keydown.enter.prevent="onEnter(item, idx)"
                      @keydown.down.prevent="onEnter(item, idx)"
                      @keydown.up.prevent="onUp(item, idx)"
                      @keydown.escape.prevent="onEscape(item)"
                      @focus="filaActiva = idx"
                      @blur="filaActiva = -1"
                    />
                  </div>
                </td>
                <td class="col-est">
                  <span v-if="guardadosOk.has(item.codigo)" class="estado-ok">
                    <v-icon size="14" color="success">mdi-check-circle</v-icon>
                  </span>
                  <span v-else-if="pendientes.has(item.codigo)" class="estado-pend">
                    <v-icon size="14" color="warning">mdi-circle-edit-outline</v-icon>
                  </span>
                  <span v-else class="estado-none">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom right">
      {{ snack.msg }}
    </v-snackbar>
  </MainLayout>
</template>

<script setup>
import { ref, computed, reactive, onMounted, nextTick } from 'vue'
import { useTheme } from 'vuetify'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import KpiCard from '../../components/common/KpiCard.vue'
import { API_BASE } from '../../utils/constants.js'

const theme = useTheme()
const rowHoverBg = computed(() =>
  theme.current.value.dark ? 'rgba(251,191,36,.2)' : '#fee2e2'
)

// ── Estado ────────────────────────────────────────────────────────────────────
const recetas     = ref([])
const grupos      = ref([])
const loading     = ref(false)
const busqueda    = ref('')
const filtroGrupo = ref('TODOS')
const filtroTipo  = ref('TODOS')
const filaActiva  = ref(-1)
const guardandoTodo = ref(false)

// mapa codigo → valor editado (siempre string para el input)
const editValues  = reactive({})
// set de codigos con cambios sin guardar
const pendientes  = ref(new Set())
// set de codigos recién guardados (para mostrar ✓ brevemente)
const guardadosOk = ref(new Set())

const inputRefs   = ref([])

const snack = ref({ show: false, msg: '', color: 'success' })
function ok(msg)  { snack.value = { show: true, msg, color: 'success' } }
function err(msg) { snack.value = { show: true, msg, color: 'error' } }

// ── Carga ─────────────────────────────────────────────────────────────────────
async function cargar() {
  loading.value = true
  try {
    const [rr, rg] = await Promise.all([
      fetch(`${API_BASE}/recetas`).then(r => r.json()),
      fetch(`${API_BASE}/recetas/grupos`).then(r => r.json()),
    ])
    recetas.value = rr.data || []
    grupos.value  = rg.data || []
    // inicializar editValues con el precio actual (como texto)
    recetas.value.forEach(r => {
      editValues[r.codigo] = String(parseFloat(r.precio_venta) || 0)
    })
    pendientes.value  = new Set()
    guardadosOk.value = new Set()
  } catch { err('Error al cargar recetas') }
  finally { loading.value = false }
}

// ── Filtros ───────────────────────────────────────────────────────────────────
const recetasFiltradas = computed(() => {
  let r = recetas.value
  if (filtroTipo.value !== 'TODOS') r = r.filter(x => x.subproducto === filtroTipo.value)
  if (filtroGrupo.value !== 'TODOS') r = r.filter(x => x.grupo_receta === filtroGrupo.value)
  if (busqueda.value.trim()) {
    const q = busqueda.value.trim().toLowerCase()
    r = r.filter(x => x.nombre.toLowerCase().includes(q) || x.codigo.toLowerCase().includes(q))
  }
  return r
})

const gruposFilter = computed(() => [
  { label: 'Todos los grupos', val: 'TODOS' },
  ...grupos.value.map(g => ({ label: g.nombre, val: g.codigo })),
])

const conPrecio = computed(() => recetasFiltradas.value.filter(r => parseFloat(r.precio_venta) > 0).length)
const sinPrecio = computed(() => recetasFiltradas.value.filter(r => !(parseFloat(r.precio_venta) > 0)).length)

// ── % costo en tiempo real ────────────────────────────────────────────────────
function toNum(raw) {
  // acepta punto y coma como separador decimal
  return parseFloat(String(raw).replace(',', '.')) || 0
}

function pctActual(item) {
  const pv = toNum(editValues[item.codigo])
  const c  = parseFloat(item.valor) || 0
  if (!pv) return 0
  return (c / pv) * 100
}
function pctActualStr(item) {
  const p = pctActual(item)
  return p > 0 ? p.toFixed(1) + '%' : '—'
}
function colorPct(item) {
  const p = pctActual(item)
  if (!p) return '#94a3b8'
  if (p <= 30) return '#22c55e'
  if (p <= 45) return '#f59e0b'
  return '#ef4444'
}

// ── Edición ───────────────────────────────────────────────────────────────────
function onInput(item, e) {
  const raw = e.target.value
  editValues[item.codigo] = raw          // guardar texto crudo (conserva el punto)
  const val      = toNum(raw)
  const original = toNum(item.precio_venta)
  if (val !== original) {
    pendientes.value = new Set([...pendientes.value, item.codigo])
  } else {
    const s = new Set(pendientes.value)
    s.delete(item.codigo)
    pendientes.value = s
  }
}

function onEscape(item) {
  // restaurar valor original
  editValues[item.codigo] = String(parseFloat(item.precio_venta) || 0)
  const s = new Set(pendientes.value)
  s.delete(item.codigo)
  pendientes.value = s
}

async function onEnter(item, idx) {
  // guardar si hay cambio
  if (pendientes.value.has(item.codigo)) {
    await guardarUna(item)
  }
  // mover al siguiente
  const next = idx + 1
  if (next < recetasFiltradas.value.length) {
    enfocar(next)
  }
}

async function onUp(item, idx) {
  if (pendientes.value.has(item.codigo)) {
    await guardarUna(item)
  }
  const prev = idx - 1
  if (prev >= 0) enfocar(prev)
}

function enfocar(idx) {
  filaActiva.value = idx
  nextTick(() => {
    const el = inputRefs.value[idx]
    if (el) { el.focus(); el.select() }
  })
}

// ── Guardado ──────────────────────────────────────────────────────────────────
async function guardarUna(item) {
  const nuevoPrecio = toNum(editValues[item.codigo])
  try {
    const r = await fetch(`${API_BASE}/recetas/${item.codigo}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ precio_venta: nuevoPrecio }),
    })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    // actualizar el dato local y normalizar el texto del input
    item.precio_venta = nuevoPrecio
    editValues[item.codigo] = String(nuevoPrecio)
    const s = new Set(pendientes.value)
    s.delete(item.codigo)
    pendientes.value = s
    // ✓ visual
    guardadosOk.value = new Set([...guardadosOk.value, item.codigo])
    setTimeout(() => {
      const g = new Set(guardadosOk.value)
      g.delete(item.codigo)
      guardadosOk.value = g
    }, 2000)
  } catch (e) {
    err(`Error guardando ${item.nombre}: ${e.message}`)
  }
}

async function guardarTodo() {
  guardandoTodo.value = true
  const codigos = [...pendientes.value]
  let ok_count = 0
  for (const cod of codigos) {
    const item = recetas.value.find(r => r.codigo === cod)
    if (item) { await guardarUna(item); ok_count++ }
  }
  guardandoTodo.value = false
  if (ok_count) ok(`${ok_count} precio${ok_count > 1 ? 's' : ''} guardado${ok_count > 1 ? 's' : ''}`)
}

function descartarTodo() {
  pendientes.value.forEach(cod => {
    const item = recetas.value.find(r => r.codigo === cod)
    if (item) editValues[item.codigo] = parseFloat(item.precio_venta) || 0
  })
  pendientes.value = new Set()
}

function fmt(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(cargar)
</script>

<style scoped>
.rp-container { padding: 24px; max-width: 1300px; margin: 0 auto; }

/* filtros */
.rp-filters { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.rp-hint    { display: flex; align-items: center; gap: 4px; font-size: 11px; color: rgba(var(--v-theme-on-surface),.4); }

/* kpis */
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }

/* grid card */
.rp-grid-card   { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 16px; overflow: hidden; }
.rp-grid-scroll { overflow-x: auto; }

/* tabla */
.rp-grid { width: 100%; border-collapse: collapse; font-size: 13px; }
.rp-grid thead tr { background: rgba(var(--v-theme-on-surface),.04); }
.rp-grid th {
  padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700;
  letter-spacing: .04em; color: rgba(var(--v-theme-on-surface),.55);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08);
  white-space: nowrap;
}
.rp-grid td { padding: 5px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); vertical-align: middle; }

/* columnas */
.col-cod  { width: 80px; }
.col-nom  { min-width: 180px; }
.col-grp  { width: 130px; }
.col-tipo { width: 70px; }
.col-costo{ width: 110px; text-align: right; }
.col-pct  { width: 160px; }
.col-pv   { width: 160px; }
.col-est  { width: 50px; text-align: center; }

/* filas */
.rp-row { transition: background .15s; cursor: default; }
.rp-row:hover           { background: rgba(var(--v-theme-on-surface),.03); }
.rp-row--focused        { }
.rp-row--modified       { background: rgba(245,158,11,.04); }
.rp-row--modified td:first-child { border-left: 3px solid #f59e0b; }
.rp-row--saved          { background: rgba(34,197,94,.05); }
.rp-row--saved td:first-child    { border-left: 3px solid #22c55e; }

.nombre-cell { display: block; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }

/* barra % costo */
.pct-wrap     { display: flex; align-items: center; gap: 6px; }
.pct-bar-bg   { flex: 1; height: 6px; background: rgba(var(--v-theme-on-surface),.1); border-radius: 3px; overflow: hidden; min-width: 50px; }
.pct-bar-fill { height: 100%; border-radius: 3px; transition: width .3s, background .3s; }
.pct-label    { font-size: 11px; font-weight: 700; min-width: 38px; }

/* input precio */
.pv-input-wrap { display: flex; align-items: center; gap: 4px; }
.pv-prefix     { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); font-weight: 600; }
.pv-input {
  width: 120px; height: 30px; padding: 0 8px;
  background: rgba(var(--v-theme-on-surface),.05);
  border: 1px solid rgba(var(--v-theme-on-surface),.15);
  border-radius: 8px; font-size: 13px; font-family: monospace; font-weight: 600;
  color: rgb(var(--v-theme-on-surface)); outline: none;
  transition: border .15s, background .15s;
  text-align: right;
}
.pv-input:focus {
  border-color: #f59e0b;
  background: rgba(245,158,11,.07);
  box-shadow: 0 0 0 2px rgba(245,158,11,.2);
}
.pv-input--modified {
  border-color: #f59e0b;
  background: rgba(245,158,11,.07);
}

/* estado */
.estado-ok, .estado-pend, .estado-none { display: flex; justify-content: center; }
.estado-none { color: rgba(var(--v-theme-on-surface),.2); font-size: 12px; }

.font-mono { font-family: monospace; }
.text-right { text-align: right; }
</style>
