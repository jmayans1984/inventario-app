<template>
  <MainLayout>
    <div class="pcv-container">

      <PageHeader
        title="Precios Compra/Venta"
        description="Navega con Enter o ↓↑ · Esc descarta fila"
        :crumbs="['Recetas', 'Configuración', 'Precios Compra/Venta']"
      >
        <template #actions>
          <v-chip v-if="pendientes.size" color="#f59e0b" variant="tonal" size="small" prepend-icon="mdi-circle-edit-outline">
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

      <!-- TABS -->
      <v-tabs v-model="tab" color="#f59e0b" class="mb-4">
        <v-tab value="compra" prepend-icon="mdi-cart-outline">Compra (Artículos)</v-tab>
        <v-tab value="venta" prepend-icon="mdi-tag-outline">Venta (Recetas)</v-tab>
      </v-tabs>

      <!-- TAB COMPRA -->
      <div v-show="tab === 'compra'">
        <!-- FILTROS -->
        <div class="pcv-filters">
          <v-text-field v-model="busquedaC" placeholder="Buscar artículo..." prepend-inner-icon="mdi-magnify"
            variant="outlined" density="compact" hide-details clearable style="max-width:300px" />
          <v-select v-model="filtroGrupoC" :items="gruposArticulosFilter" item-title="label" item-value="val"
            variant="outlined" density="compact" hide-details style="max-width:200px" />
          <v-spacer />
          <div class="pcv-hint">
            <v-icon size="15" color="grey">mdi-keyboard-return</v-icon>
            <span>Enter guarda y baja · Esc descarta</span>
          </div>
        </div>

        <!-- KPI -->
        <div class="pcv-kpi-row">
          <div class="pcv-kpi" style="border-color:#3b82f6">
            <span class="kpi-val" style="color:#3b82f6">{{ articulosFiltrados.length }}</span>
            <span class="kpi-lbl">Artículos visibles</span>
          </div>
          <div class="pcv-kpi" style="border-color:#22c55e">
            <span class="kpi-val" style="color:#22c55e">{{ artConPrecio }}</span>
            <span class="kpi-lbl">Con precio</span>
          </div>
          <div class="pcv-kpi" style="border-color:#ef4444">
            <span class="kpi-val" style="color:#ef4444">{{ artSinPrecio }}</span>
            <span class="kpi-lbl">Sin precio</span>
          </div>
          <div class="pcv-kpi" style="border-color:#f59e0b">
            <span class="kpi-val" style="color:#f59e0b">{{ pendientesCompra.size }}</span>
            <span class="kpi-lbl">Pendientes</span>
          </div>
        </div>

        <!-- GRID COMPRA -->
        <div class="pcv-grid-card">
          <v-progress-linear v-if="loadingC || guardandoTodo" indeterminate color="#3b82f6" height="3" />
          <div class="pcv-grid-scroll">
            <table class="pcv-grid">
              <thead>
                <tr>
                  <th class="col-cod">CÓDIGO</th>
                  <th class="col-nom">NOMBRE</th>
                  <th class="col-grp">GRUPO</th>
                  <th class="col-und">UND</th>
                  <th class="col-usos">EN RECETAS</th>
                  <th class="col-pv" style="color:#3b82f6">PRECIO COMPRA</th>
                  <th class="col-est">EST</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="articulosFiltrados.length === 0">
                  <td colspan="7" class="text-center pa-6 text-disabled">No hay artículos</td>
                </tr>
                <tr
                  v-for="(item, idx) in articulosFiltrados"
                  :key="item.codigo"
                  :class="['pcv-row', {
                    'pcv-row--modified': pendientesCompra.has(item.codigo),
                    'pcv-row--saved':    guardadosOkC.has(item.codigo),
                    'pcv-row--focused':  filaActivaC === idx && tab === 'compra',
                  }]"
                  :style="filaActivaC === idx && tab === 'compra' ? { background: rowHoverBg } : {}"
                  @click="enfocarC(idx)"
                >
                  <td class="col-cod font-mono">{{ item.codigo }}</td>
                  <td class="col-nom">
                    <span class="nombre-cell">{{ item.nombre }}</span>
                  </td>
                  <td class="col-grp">
                    <span class="text-caption text-medium-emphasis">{{ item.grupo_nombre || item.grupo || '—' }}</span>
                  </td>
                  <td class="col-und">
                    <span class="text-caption">{{ item.und || '—' }}</span>
                  </td>
                  <td class="col-usos text-center">
                    <v-chip v-if="item.num_recetas > 0" size="x-small" color="cyan" variant="tonal">{{ item.num_recetas }}</v-chip>
                    <span v-else class="text-disabled text-caption">—</span>
                  </td>
                  <td class="col-pv">
                    <div class="pv-input-wrap">
                      <span class="pv-prefix">$</span>
                      <input
                        :ref="el => { if (el) inputRefsC[idx] = el }"
                        type="text"
                        inputmode="decimal"
                        class="pv-input pv-input--compra"
                        :class="{ 'pv-input--modified': pendientesCompra.has(item.codigo) }"
                        :value="editValuesC[item.codigo]"
                        @input="onInputC(item, $event)"
                        @keydown.enter.prevent="onEnterC(item, idx)"
                        @keydown.down.prevent="onEnterC(item, idx)"
                        @keydown.up.prevent="onUpC(item, idx)"
                        @keydown.escape.prevent="onEscapeC(item)"
                        @focus="filaActivaC = idx"
                        @blur="filaActivaC = -1"
                      />
                    </div>
                  </td>
                  <td class="col-est">
                    <span v-if="guardadosOkC.has(item.codigo)" class="estado-ok">
                      <v-icon size="14" color="success">mdi-check-circle</v-icon>
                    </span>
                    <span v-else-if="pendientesCompra.has(item.codigo)" class="estado-pend">
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

      <!-- TAB VENTA -->
      <div v-show="tab === 'venta'">
        <!-- FILTROS -->
        <div class="pcv-filters">
          <v-text-field v-model="busquedaV" placeholder="Buscar receta..." prepend-inner-icon="mdi-magnify"
            variant="outlined" density="compact" hide-details clearable style="max-width:300px" />
          <v-select v-model="filtroGrupoV" :items="gruposRecetasFilter" item-title="label" item-value="val"
            variant="outlined" density="compact" hide-details style="max-width:200px" />
          <v-btn-toggle v-model="filtroTipoV" density="compact" rounded="lg" color="warning">
            <v-btn value="TODOS" size="small">Todas</v-btn>
            <v-btn value="NO"    size="small">Recetas</v-btn>
            <v-btn value="SI"    size="small">Subproductos</v-btn>
          </v-btn-toggle>
          <v-spacer />
          <div class="pcv-hint">
            <v-icon size="15" color="grey">mdi-keyboard-return</v-icon>
            <span>Enter guarda y baja · Esc descarta</span>
          </div>
        </div>

        <!-- KPI -->
        <div class="pcv-kpi-row">
          <div class="pcv-kpi" style="border-color:#f59e0b">
            <span class="kpi-val" style="color:#f59e0b">{{ recetasFiltradas.length }}</span>
            <span class="kpi-lbl">Recetas visibles</span>
          </div>
          <div class="pcv-kpi" style="border-color:#22c55e">
            <span class="kpi-val" style="color:#22c55e">{{ recConPrecio }}</span>
            <span class="kpi-lbl">Con precio</span>
          </div>
          <div class="pcv-kpi" style="border-color:#ef4444">
            <span class="kpi-val" style="color:#ef4444">{{ recSinPrecio }}</span>
            <span class="kpi-lbl">Sin precio</span>
          </div>
          <div class="pcv-kpi" style="border-color:#f59e0b">
            <span class="kpi-val" style="color:#f59e0b">{{ pendientesVenta.size }}</span>
            <span class="kpi-lbl">Pendientes</span>
          </div>
        </div>

        <!-- GRID VENTA -->
        <div class="pcv-grid-card">
          <v-progress-linear v-if="loadingV || guardandoTodo" indeterminate color="#f59e0b" height="3" />
          <div class="pcv-grid-scroll">
            <table class="pcv-grid">
              <thead>
                <tr>
                  <th class="col-cod">CÓDIGO</th>
                  <th class="col-nom">NOMBRE</th>
                  <th class="col-grp">GRUPO</th>
                  <th class="col-tipo">TIPO</th>
                  <th class="col-costo">COSTO</th>
                  <th class="col-pct">% COSTO</th>
                  <th class="col-pv" style="color:#f59e0b">PRECIO VENTA</th>
                  <th class="col-est">EST</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="recetasFiltradas.length === 0">
                  <td colspan="8" class="text-center pa-6 text-disabled">No hay recetas</td>
                </tr>
                <tr
                  v-for="(item, idx) in recetasFiltradas"
                  :key="item.codigo"
                  :class="['pcv-row', {
                    'pcv-row--modified': pendientesVenta.has(item.codigo),
                    'pcv-row--saved':    guardadosOkV.has(item.codigo),
                    'pcv-row--focused':  filaActivaV === idx && tab === 'venta',
                  }]"
                  :style="filaActivaV === idx && tab === 'venta' ? { background: rowHoverBg } : {}"
                  @click="enfocarV(idx)"
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
                      <span class="pct-label" :style="{ color: colorPct(item) }">{{ pctActualStr(item) }}</span>
                    </div>
                  </td>
                  <td class="col-pv">
                    <div class="pv-input-wrap">
                      <span class="pv-prefix">$</span>
                      <input
                        :ref="el => { if (el) inputRefsV[idx] = el }"
                        type="text"
                        inputmode="decimal"
                        class="pv-input pv-input--venta"
                        :class="{ 'pv-input--modified': pendientesVenta.has(item.codigo) }"
                        :value="editValuesV[item.codigo]"
                        @input="onInputV(item, $event)"
                        @keydown.enter.prevent="onEnterV(item, idx)"
                        @keydown.down.prevent="onEnterV(item, idx)"
                        @keydown.up.prevent="onUpV(item, idx)"
                        @keydown.escape.prevent="onEscapeV(item)"
                        @focus="filaActivaV = idx"
                        @blur="filaActivaV = -1"
                      />
                    </div>
                  </td>
                  <td class="col-est">
                    <span v-if="guardadosOkV.has(item.codigo)" class="estado-ok">
                      <v-icon size="14" color="success">mdi-check-circle</v-icon>
                    </span>
                    <span v-else-if="pendientesVenta.has(item.codigo)" class="estado-pend">
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

    </div>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom right">
      {{ snack.msg }}
    </v-snackbar>
  </MainLayout>
</template>

<script setup>
import { ref, computed, reactive, onMounted, nextTick, watch } from 'vue'
import { useTheme } from 'vuetify'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import { API_BASE } from '../../utils/constants.js'

const theme = useTheme()
const rowHoverBg = computed(() =>
  theme.current.value.dark ? 'rgba(251,191,36,.2)' : '#fee2e2'
)

// ── Tab activo ────────────────────────────────────────────────────────────────
const tab = ref('compra')

const snack = ref({ show: false, msg: '', color: 'success' })
function ok(msg)  { snack.value = { show: true, msg, color: 'success' } }
function err(msg) { snack.value = { show: true, msg, color: 'error'   } }

const guardandoTodo = ref(false)

// ═══════════════════════════════════════════════════════════════════════════════
// TAB COMPRA — Artículos
// ═══════════════════════════════════════════════════════════════════════════════
const articulos      = ref([])
const gruposArticulos = ref([])
const loadingC       = ref(false)
const busquedaC      = ref('')
const filtroGrupoC   = ref('TODOS')
const filaActivaC    = ref(-1)
const editValuesC    = reactive({})
const pendientesCompra = ref(new Set())
const guardadosOkC   = ref(new Set())
const inputRefsC     = ref([])

async function cargarArticulos() {
  loadingC.value = true
  try {
    const [ra, rg] = await Promise.all([
      fetch(`${API_BASE}/articulos`).then(r => r.json()),
      fetch(`${API_BASE}/articulos/grupos`).then(r => r.json()),
    ])
    articulos.value      = ra.data || []
    gruposArticulos.value = rg.data || []
    articulos.value.forEach(a => {
      editValuesC[a.codigo] = String(parseFloat(a.valor) || 0)
    })
    pendientesCompra.value = new Set()
    guardadosOkC.value     = new Set()
  } catch { err('Error al cargar artículos') }
  finally { loadingC.value = false }
}

const articulosFiltrados = computed(() => {
  let r = articulos.value
  if (filtroGrupoC.value !== 'TODOS') r = r.filter(x => x.grupo === filtroGrupoC.value)
  if (busquedaC.value.trim()) {
    const q = busquedaC.value.trim().toLowerCase()
    r = r.filter(x => x.nombre.toLowerCase().includes(q) || x.codigo.toLowerCase().includes(q))
  }
  return r
})

const gruposArticulosFilter = computed(() => [
  { label: 'Todos los grupos', val: 'TODOS' },
  ...gruposArticulos.value.map(g => ({ label: g.nombre, val: g.codigo })),
])

const artConPrecio = computed(() => articulosFiltrados.value.filter(a => parseFloat(a.valor) > 0).length)
const artSinPrecio = computed(() => articulosFiltrados.value.filter(a => !(parseFloat(a.valor) > 0)).length)

function onInputC(item, e) {
  const raw = e.target.value
  editValuesC[item.codigo] = raw
  const val      = toNum(raw)
  const original = toNum(item.valor)
  if (val !== original) {
    pendientesCompra.value = new Set([...pendientesCompra.value, item.codigo])
  } else {
    const s = new Set(pendientesCompra.value); s.delete(item.codigo)
    pendientesCompra.value = s
  }
}

function onEscapeC(item) {
  editValuesC[item.codigo] = String(parseFloat(item.valor) || 0)
  const s = new Set(pendientesCompra.value); s.delete(item.codigo)
  pendientesCompra.value = s
}

async function onEnterC(item, idx) {
  if (pendientesCompra.value.has(item.codigo)) await guardarUnaCompra(item)
  const next = idx + 1
  if (next < articulosFiltrados.value.length) enfocarC(next)
}

async function onUpC(item, idx) {
  if (pendientesCompra.value.has(item.codigo)) await guardarUnaCompra(item)
  const prev = idx - 1
  if (prev >= 0) enfocarC(prev)
}

function enfocarC(idx) {
  filaActivaC.value = idx
  nextTick(() => {
    const el = inputRefsC.value[idx]
    if (el) { el.focus(); el.select() }
  })
}

async function guardarUnaCompra(item) {
  const nuevoValor = toNum(editValuesC[item.codigo])
  try {
    const r = await fetch(`${API_BASE}/articulos/${item.codigo}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valor: nuevoValor }),
    })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    item.valor = nuevoValor
    editValuesC[item.codigo] = String(nuevoValor)
    const s = new Set(pendientesCompra.value); s.delete(item.codigo)
    pendientesCompra.value = s
    guardadosOkC.value = new Set([...guardadosOkC.value, item.codigo])
    setTimeout(() => {
      const g = new Set(guardadosOkC.value); g.delete(item.codigo)
      guardadosOkC.value = g
    }, 2000)
  } catch (e) { err(`Error guardando ${item.nombre}: ${e.message}`) }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB VENTA — Recetas
// ═══════════════════════════════════════════════════════════════════════════════
const recetas      = ref([])
const gruposRecetas = ref([])
const loadingV     = ref(false)
const busquedaV    = ref('')
const filtroGrupoV = ref('TODOS')
const filtroTipoV  = ref('TODOS')
const filaActivaV  = ref(-1)
const editValuesV  = reactive({})
const pendientesVenta = ref(new Set())
const guardadosOkV = ref(new Set())
const inputRefsV   = ref([])

async function cargarRecetas() {
  loadingV.value = true
  try {
    const [rr, rg] = await Promise.all([
      fetch(`${API_BASE}/recetas`).then(r => r.json()),
      fetch(`${API_BASE}/recetas/grupos`).then(r => r.json()),
    ])
    recetas.value      = rr.data || []
    gruposRecetas.value = rg.data || []
    recetas.value.forEach(r => {
      editValuesV[r.codigo] = String(parseFloat(r.precio_venta) || 0)
    })
    pendientesVenta.value = new Set()
    guardadosOkV.value    = new Set()
  } catch { err('Error al cargar recetas') }
  finally { loadingV.value = false }
}

const recetasFiltradas = computed(() => {
  let r = recetas.value
  if (filtroTipoV.value !== 'TODOS') r = r.filter(x => x.subproducto === filtroTipoV.value)
  if (filtroGrupoV.value !== 'TODOS') r = r.filter(x => x.grupo_receta === filtroGrupoV.value)
  if (busquedaV.value.trim()) {
    const q = busquedaV.value.trim().toLowerCase()
    r = r.filter(x => x.nombre.toLowerCase().includes(q) || x.codigo.toLowerCase().includes(q))
  }
  return r
})

const gruposRecetasFilter = computed(() => [
  { label: 'Todos los grupos', val: 'TODOS' },
  ...gruposRecetas.value.map(g => ({ label: g.nombre, val: g.codigo })),
])

const recConPrecio = computed(() => recetasFiltradas.value.filter(r => parseFloat(r.precio_venta) > 0).length)
const recSinPrecio = computed(() => recetasFiltradas.value.filter(r => !(parseFloat(r.precio_venta) > 0)).length)

function pctActual(item) {
  const pv = toNum(editValuesV[item.codigo])
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

function onInputV(item, e) {
  const raw = e.target.value
  editValuesV[item.codigo] = raw
  const val      = toNum(raw)
  const original = toNum(item.precio_venta)
  if (val !== original) {
    pendientesVenta.value = new Set([...pendientesVenta.value, item.codigo])
  } else {
    const s = new Set(pendientesVenta.value); s.delete(item.codigo)
    pendientesVenta.value = s
  }
}

function onEscapeV(item) {
  editValuesV[item.codigo] = String(parseFloat(item.precio_venta) || 0)
  const s = new Set(pendientesVenta.value); s.delete(item.codigo)
  pendientesVenta.value = s
}

async function onEnterV(item, idx) {
  if (pendientesVenta.value.has(item.codigo)) await guardarUnaVenta(item)
  const next = idx + 1
  if (next < recetasFiltradas.value.length) enfocarV(next)
}

async function onUpV(item, idx) {
  if (pendientesVenta.value.has(item.codigo)) await guardarUnaVenta(item)
  const prev = idx - 1
  if (prev >= 0) enfocarV(prev)
}

function enfocarV(idx) {
  filaActivaV.value = idx
  nextTick(() => {
    const el = inputRefsV.value[idx]
    if (el) { el.focus(); el.select() }
  })
}

async function guardarUnaVenta(item) {
  const nuevoPrecio = toNum(editValuesV[item.codigo])
  try {
    const r = await fetch(`${API_BASE}/recetas/${item.codigo}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ precio_venta: nuevoPrecio }),
    })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    item.precio_venta = nuevoPrecio
    editValuesV[item.codigo] = String(nuevoPrecio)
    const s = new Set(pendientesVenta.value); s.delete(item.codigo)
    pendientesVenta.value = s
    guardadosOkV.value = new Set([...guardadosOkV.value, item.codigo])
    setTimeout(() => {
      const g = new Set(guardadosOkV.value); g.delete(item.codigo)
      guardadosOkV.value = g
    }, 2000)
  } catch (e) { err(`Error guardando ${item.nombre}: ${e.message}`) }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Acciones globales
// ═══════════════════════════════════════════════════════════════════════════════
const pendientes = computed(() => {
  const s = new Set()
  pendientesCompra.value.forEach(c => s.add('C:' + c))
  pendientesVenta.value.forEach(c => s.add('V:' + c))
  return s
})

async function guardarTodo() {
  guardandoTodo.value = true
  let count = 0
  for (const cod of [...pendientesCompra.value]) {
    const item = articulos.value.find(a => a.codigo === cod)
    if (item) { await guardarUnaCompra(item); count++ }
  }
  for (const cod of [...pendientesVenta.value]) {
    const item = recetas.value.find(r => r.codigo === cod)
    if (item) { await guardarUnaVenta(item); count++ }
  }
  guardandoTodo.value = false
  if (count) ok(`${count} precio${count > 1 ? 's' : ''} guardado${count > 1 ? 's' : ''}`)
}

function descartarTodo() {
  pendientesCompra.value.forEach(cod => {
    const item = articulos.value.find(a => a.codigo === cod)
    if (item) editValuesC[item.codigo] = String(parseFloat(item.valor) || 0)
  })
  pendientesCompra.value = new Set()
  pendientesVenta.value.forEach(cod => {
    const item = recetas.value.find(r => r.codigo === cod)
    if (item) editValuesV[item.codigo] = String(parseFloat(item.precio_venta) || 0)
  })
  pendientesVenta.value = new Set()
}

function toNum(raw) {
  return parseFloat(String(raw).replace(',', '.')) || 0
}

function fmt(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Cargar datos solo cuando se abre el tab correspondiente
watch(tab, async (t) => {
  if (t === 'compra' && articulos.value.length === 0) await cargarArticulos()
  if (t === 'venta'  && recetas.value.length === 0)   await cargarRecetas()
})

onMounted(() => cargarArticulos())
</script>

<style scoped>
.pcv-container { padding: 24px; max-width: 1300px; margin: 0 auto; }

/* filtros */
.pcv-filters { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.pcv-hint   { display: flex; align-items: center; gap: 4px; font-size: 11px; color: rgba(var(--v-theme-on-surface),.4); }

/* kpis */
.pcv-kpi-row { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.pcv-kpi     { background: rgb(var(--v-theme-surface)); border: 2px solid; border-radius: 12px; padding: 10px 18px; display: flex; flex-direction: column; align-items: center; min-width: 110px; flex: 1; }
.kpi-val     { font-size: 22px; font-weight: 800; line-height: 1; }
.kpi-lbl     { font-size: 11px; color: rgba(var(--v-theme-on-surface),.5); text-align: center; margin-top: 2px; }

/* grid card */
.pcv-grid-card   { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 16px; overflow: hidden; }
.pcv-grid-scroll { overflow-x: auto; }

/* tabla */
.pcv-grid { width: 100%; border-collapse: collapse; font-size: 13px; }
.pcv-grid thead tr { background: rgba(var(--v-theme-on-surface),.04); }
.pcv-grid th {
  padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700;
  letter-spacing: .04em; color: rgba(var(--v-theme-on-surface),.55);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); white-space: nowrap;
}
.pcv-grid td { padding: 5px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); vertical-align: middle; }

/* columnas */
.col-cod  { width: 80px; }
.col-nom  { min-width: 180px; }
.col-grp  { width: 130px; }
.col-und  { width: 70px; }
.col-tipo { width: 70px; }
.col-usos { width: 80px; }
.col-costo{ width: 110px; text-align: right; }
.col-pct  { width: 150px; }
.col-pv   { width: 160px; }
.col-est  { width: 50px; text-align: center; }

/* filas */
.pcv-row { transition: background .15s; cursor: default; }
.pcv-row:hover           { background: rgba(var(--v-theme-on-surface),.03); }
.pcv-row--focused        { }
.pcv-row--modified       { background: rgba(245,158,11,.04); }
.pcv-row--modified td:first-child { border-left: 3px solid #f59e0b; }
.pcv-row--saved          { background: rgba(34,197,94,.05); }
.pcv-row--saved td:first-child    { border-left: 3px solid #22c55e; }

.nombre-cell { display: block; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }

/* barra % costo */
.pct-wrap     { display: flex; align-items: center; gap: 6px; }
.pct-bar-bg   { flex: 1; height: 6px; background: rgba(var(--v-theme-on-surface),.1); border-radius: 3px; overflow: hidden; min-width: 50px; }
.pct-bar-fill { height: 100%; border-radius: 3px; transition: width .3s, background .3s; }
.pct-label    { font-size: 11px; font-weight: 700; min-width: 38px; }

/* inputs */
.pv-input-wrap { display: flex; align-items: center; gap: 4px; }
.pv-prefix     { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); font-weight: 600; }
.pv-input {
  width: 120px; height: 30px; padding: 0 8px;
  background: rgba(var(--v-theme-on-surface),.05);
  border: 1px solid rgba(var(--v-theme-on-surface),.15);
  border-radius: 8px; font-size: 13px; font-family: monospace; font-weight: 600;
  color: rgb(var(--v-theme-on-surface)); outline: none;
  transition: border .15s, background .15s; text-align: right;
}
.pv-input--compra:focus {
  border-color: #3b82f6;
  background: rgba(59,130,246,.07);
  box-shadow: 0 0 0 2px rgba(59,130,246,.2);
}
.pv-input--venta:focus {
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

.font-mono  { font-family: monospace; }
.text-right { text-align: right; }
</style>
