<template>
  <MainLayout>
    <div class="cst-container">

      <PageHeader
        title="Control de Stock"
        description="Asigne stock mínimo a cada producto y monitoree su disponibilidad"
        :crumbs="['Almacén', 'Configuración', 'Control de Stock']"
      >
        <template #actions>
          <v-btn v-if="!sinBodegaMaestra" color="primary" variant="flat" size="large" prepend-icon="mdi-content-save-all" :loading="guardandoTodos" @click="guardarTodos">
            Guardar Todo
          </v-btn>
        </template>
      </PageHeader>

      <!-- KPI CARDS -->
      <div class="kpi-grid mb-5">
        <KpiCard v-for="(kpi, i) in kpis" :key="kpi.label" :index="i" :label="kpi.label" :value="kpi.value" :icon="kpi.icon" :color="kpi.color" :value-color="kpi.color" />
      </div>

      <!-- INFORMACIÓN DE BODEGA MAESTRA -->
      <div v-if="!loading && bodegaMaestraCC" class="bodega-info">
        <v-icon size="18" color="var(--indigo)">mdi-warehouse</v-icon>
        <span>Centro de Costo: <strong>{{ bodegaMaestraCC }} - {{ bodegaMaestraNombre }}</strong></span>
      </div>

      <!-- CONTROLES -->
      <div v-if="!sinBodegaMaestra" class="cst-controles">
        <div class="cst-search">
          <v-icon size="18" style="color:rgba(var(--v-theme-on-surface),.4)">mdi-magnify</v-icon>
          <input v-model="search" type="text" placeholder="Buscar producto..." class="cst-search-input" @keyup.escape="search=''" />
          <v-icon v-if="search" size="16" style="cursor:pointer;color:rgba(var(--v-theme-on-surface),.4)" @click="search=''">mdi-close</v-icon>
        </div>

        <v-select
          v-model="filtroEstado"
          :items="opcionesEstado"
          item-title="label"
          item-value="value"
          label="Estado"
          variant="outlined"
          density="compact"
          hide-details
          style="min-width:160px"
        />
      </div>

      <!-- TABLA AGRUPADA -->
      <div class="cst-table-wrap">
        <div v-if="loading" class="cst-loading">
          <v-progress-circular indeterminate color="var(--error)" size="36" />
        </div>

        <template v-else-if="sinBodegaMaestra">
          <div class="cst-empty-bodega">
            <v-icon size="48" color="var(--warning)">mdi-alert-outline</v-icon>
            <p><strong>⚠ No hay Bodega Maestra asignada</strong></p>
            <p style="font-size:13px;color:rgba(var(--v-theme-on-surface),.6)">
              Debes asignar un Centro de Costo como Bodega Maestra en <strong>CONFIGURACIÓN > Bodega Maestra / Proveeduría</strong> para poder gestionar el control de stock.
            </p>
            <router-link to="/configuracion/bodega-maestra" style="text-decoration:none">
              <v-btn color="var(--indigo)" variant="elevated" size="small" prepend-icon="mdi-warehouse">
                Ir a Bodega Maestra
              </v-btn>
            </router-link>
          </div>
        </template>

        <template v-else-if="productosAgrupados.length === 0">
          <div class="cst-empty">No hay productos con estos filtros</div>
        </template>

        <template v-else>
          <template v-for="grupo in productosAgrupados" :key="grupo.key">
            <!-- HEADER DE GRUPO -->
            <div class="grupo-header">
              <v-icon size="15" style="color:var(--error)">mdi-folder-outline</v-icon>
              <span class="grupo-nombre">{{ grupo.nombre }}</span>
              <span class="grupo-count">{{ grupo.items.length }} producto{{ grupo.items.length !== 1 ? 's' : '' }}</span>
            </div>

            <!-- TABLA DE PRODUCTOS -->
            <table class="cst-table">
              <thead>
                <tr>
                  <th>CÓDIGO</th>
                  <th>NOMBRE</th>
                  <th>DESCRIPCIÓN</th>
                  <th>UND</th>
                  <th>STOCK ACTUAL</th>
                  <th>STOCK MÍNIMO</th>
                  <th>ESTADO</th>
                  <th>ACCIÓN</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in grupo.items" :key="p.codigo"
                  :class="{ 'fila-modificada': p._modificado, 'fila-error': p.stock_actual <= 0, 'fila-warning': p.stock_actual < p.stock_minimo }"
                  :style="hoveredRow === p.codigo ? { background: rowHoverBg } : {}"
                  @focusin="hoveredRow = p.codigo"
                  @focusout="hoveredRow = null"
                >
                  <td class="cod-cell"><span class="badge-cod">{{ p.codigo }}</span></td>
                  <td class="nombre-cell">{{ p.nombre }}</td>
                  <td class="desc-cell" :title="p.descripcion">{{ p.descripcion || '—' }}</td>
                  <td class="und-cell">{{ p.und }}</td>
                  <td class="stock-cell" :style="{ color: obtenerColorStock(p) }">{{ p.stock_actual || 0 }}</td>
                  <td class="minimo-cell">
                    <div class="input-wrap-minimo">
                      <input
                        v-model.number="p.stock_minimo"
                        type="number"
                        step="0.01"
                        min="0"
                        class="minimo-input"
                        :data-codigo="p.codigo"
                        @input="marcarModificado(p)"
                        @keydown.enter="saltarSiguiente(p)"
                      />
                    </div>
                  </td>
                  <td class="estado-cell">
                    <span class="estado-badge" :class="obtenerClaseEstado(p)">
                      {{ obtenerEstado(p) }}
                    </span>
                  </td>
                  <td class="action-cell">
                    <v-btn
                      icon
                      size="x-small"
                      variant="text"
                      :color="p._modificado ? 'var(--success)' : 'var(--ink-400)'"
                      :loading="p._guardando"
                      @click="guardarFila(p)"
                      :title="p._modificado ? 'Guardar cambio' : 'Sin cambios'"
                    >
                      <v-icon size="18">{{ p._modificado ? 'mdi-content-save' : 'mdi-check' }}</v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </template>
      </div>

      <div v-if="!loading && productosFiltrados.length > 0" class="cst-total">
        {{ productosFiltrados.length }} productos — {{ productosModificados }} modificados sin guardar
      </div>

      <!-- SNACKBAR -->
      <v-snackbar v-model="snack.show" :color="snack.color" :timeout="3000" location="bottom right">
        {{ snack.msg }}
      </v-snackbar>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import KpiCard from '../../components/common/KpiCard.vue'
import { productosAlmacenService } from '../../services/productos-almacen.service'
import { bodegaMaestraService } from '../../services/bodega-maestra.service'
import api from '../../services/api'

const router = useRouter()

const theme = useTheme()
const rowHoverBg = computed(() =>
  theme.current.value.dark ? 'rgba(251,191,36,.2)' : '#fee2e2'
)
const hoveredRow = ref(null)

const productos       = ref([])
const grupos          = ref([])
const loading         = ref(false)
const guardandoTodos  = ref(false)
const search          = ref('')
const filtroEstado    = ref('todos')
const snack           = ref({ show: false, msg: '', color: 'success' })
const bodegaMaestraCC = ref(null)
const bodegaMaestraNombre = ref('')
const sinBodegaMaestra = ref(false)

const opcionesEstado = [
  { value: 'todos', label: 'Todos' },
  { value: 'fuera', label: '🔴 Fuera de Stock' },
  { value: 'bajo', label: '🟡 Bajo Stock' },
  { value: 'normal', label: '🟢 Normal' },
]

const kpis = computed(() => {
  const fuera  = productos.value.filter(p => (p.stock_actual || 0) <= 0).length
  const bajo   = productos.value.filter(p => (p.stock_actual || 0) > 0 && (p.stock_actual || 0) < (p.stock_minimo || 0)).length
  const normal = productos.value.filter(p => (p.stock_actual || 0) >= (p.stock_minimo || 0)).length
  return [
    { label: 'Total Productos', value: productos.value.length, icon: 'mdi-package-variant-closed', color: 'var(--indigo)' },
    { label: 'Fuera de Stock', value: fuera, icon: 'mdi-close-circle-outline', color: 'var(--error)' },
    { label: 'Bajo Stock', value: bajo, icon: 'mdi-alert-outline', color: 'var(--warning)' },
    { label: 'Normal', value: normal, icon: 'mdi-check-circle-outline', color: 'var(--success)' },
  ]
})

function obtenerColorStock(p) {
  const actual = p.stock_actual || 0
  const minimo = p.stock_minimo || 0
  if (actual <= 0) return 'var(--error)'
  if (actual < minimo) return 'var(--warning)'
  return 'var(--success)'
}

function obtenerEstado(p) {
  const actual = p.stock_actual || 0
  const minimo = p.stock_minimo || 0
  if (actual <= 0) return 'FUERA'
  if (actual < minimo) return 'BAJO'
  return 'NORMAL'
}

function obtenerClaseEstado(p) {
  const actual = p.stock_actual || 0
  const minimo = p.stock_minimo || 0
  if (actual <= 0) return 'estado-fuera'
  if (actual < minimo) return 'estado-bajo'
  return 'estado-normal'
}

function cumpleEstado(p) {
  const actual = p.stock_actual || 0
  const minimo = p.stock_minimo || 0

  switch (filtroEstado.value) {
    case 'fuera':
      return actual <= 0
    case 'bajo':
      return actual > 0 && actual < minimo
    case 'normal':
      return actual >= minimo
    default:
      return true
  }
}

const productosFiltrados = computed(() => {
  let lista = productos.value
  const q = search.value.trim().toUpperCase()
  if (q) lista = lista.filter(p => p.nombre?.toUpperCase().includes(q) || p.codigo?.includes(q))
  lista = lista.filter(cumpleEstado)
  return lista
})

const productosAgrupados = computed(() => {
  const mapa = new Map()
  for (const p of productosFiltrados.value) {
    const key    = p.grupo || '__sin_grupo__'
    const nombre = p.grupo_nombre || 'Sin Grupo'
    if (!mapa.has(key)) mapa.set(key, { key, nombre, items: [] })
    mapa.get(key).items.push(p)
  }
  return Array.from(mapa.values())
})

const productosModificados = computed(() =>
  productos.value.filter(p => p._modificado).length
)

function marcarModificado(p) {
  p._modificado = true
}

function saltarSiguiente(actual) {
  setTimeout(() => {
    const inputs = Array.from(document.querySelectorAll('.minimo-input'))
    const actualIdx = inputs.findIndex(inp => inp.dataset.codigo === String(actual.codigo))
    if (actualIdx >= 0 && actualIdx + 1 < inputs.length) {
      inputs[actualIdx + 1].focus()
      inputs[actualIdx + 1].select()
    }
  }, 0)
}

async function cargar() {
  loading.value = true
  try {
    // Primero, obtener la bodega maestra
    const resBodega = await bodegaMaestraService.obtenerBodegaMaestra()
    const ccosto = resBodega.data.bodega_maestra

    if (!ccosto) {
      sinBodegaMaestra.value = true
      productos.value = []
      return
    }

    bodegaMaestraCC.value = ccosto
    bodegaMaestraNombre.value = resBodega.data.centro_costo_nombre || ccosto
    sinBodegaMaestra.value = false

    // Cargar productos del control-stock endpoint (filtrado por bodega maestra)
    const resP = await api.get(`/almacen/control-stock?ccosto=${ccosto}`)
    productos.value = (resP.data.data || []).map(p => ({
      ...p,
      stock_minimo: parseFloat(p.stock_minimo) || 0,
      stock_actual: parseFloat(p.stock_actual) || 0,
      _modificado: false,
      _guardando: false,
    }))
  } catch (e) {
    console.error('Error cargando:', e)
    const msg = e.response?.data?.error || e.message || 'Error al cargar datos'
    mostrarSnack(`Error: ${msg}`, 'error')
  } finally {
    loading.value = false
  }
}

async function guardarFila(p) {
  if (!p._modificado) return
  p._guardando = true
  try {
    await productosAlmacenService.actualizarProducto(p.codigo, {
      ...p,
      stock_minimo: p.stock_minimo,
    })
    p._modificado = false
    mostrarSnack('Stock mínimo guardado', 'success')
  } catch (e) {
    mostrarSnack('Error al guardar', 'error')
  } finally {
    p._guardando = false
  }
}

async function guardarTodos() {
  const modificados = productos.value.filter(p => p._modificado)
  if (modificados.length === 0) {
    mostrarSnack('No hay cambios pendientes', 'info')
    return
  }
  guardandoTodos.value = true
  try {
    await Promise.all(modificados.map(p => guardarFila(p)))
    mostrarSnack(`${modificados.length} productos guardados`, 'success')
  } catch {
    mostrarSnack('Error al guardar algunos productos', 'error')
  } finally {
    guardandoTodos.value = false
  }
}

function mostrarSnack(msg, color = 'success') {
  snack.value = { show: true, msg, color }
}

onMounted(cargar)
</script>

<style scoped>
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }

.cst-container { padding: 24px; max-width: 1600px; margin: 0 auto; }

.cst-controles { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
.cst-search  { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: rgba(var(--v-theme-on-surface),.03); border-radius: 8px; border: 1px solid rgba(var(--v-theme-on-surface),.08); flex: 1; min-width: 260px; }
.cst-search-input { flex: 1; border: none; background: transparent; outline: none; font-size: 14px; color: rgb(var(--v-theme-on-surface)); }
.cst-search-input::placeholder { color: rgba(var(--v-theme-on-surface),.4); }

.cst-table-wrap { margin-bottom: 16px; }
.cst-loading { display: flex; justify-content: center; padding: 60px; }
.cst-empty { text-align: center; padding: 50px 20px; color: rgba(var(--v-theme-on-surface),.4); }

.grupo-header {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px;
  background: rgba(239,68,68,.08);
  border-left: 3px solid var(--error);
  border-radius: 8px;
  margin: 20px 0 12px 0;
}
.grupo-nombre { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: var(--error); }
.grupo-count { font-size: 11px; color: rgba(var(--v-theme-on-surface),.4); margin-left: auto; }

.cst-table {
  width: 100%;
  border-collapse: collapse;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface),.08);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.cst-table thead {
  background: rgba(var(--v-theme-on-surface),.05);
  border-bottom: 2px solid rgba(var(--v-theme-on-surface),.1);
}

.cst-table th {
  padding: 12px 14px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .4px;
  color: rgba(var(--v-theme-on-surface),.6);
  text-align: left;
  border-right: 1px solid rgba(var(--v-theme-on-surface),.05);
}

.cst-table th:last-child { border-right: none; }

.cst-table tbody tr {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05);
  transition: background-color .15s;
}

.cst-table tbody tr:hover {
  background: rgba(var(--v-theme-on-surface),.03);
}

.fila-modificada {
  background: rgba(245,158,11,.08) !important;
}

.fila-error {
  background: rgba(239,68,68,.06) !important;
}

.fila-warning {
  background: rgba(245,158,11,.05) !important;
}

.cst-table td {
  padding: 12px 14px;
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
  border-right: 1px solid rgba(var(--v-theme-on-surface),.05);
}

.cst-table td:last-child { border-right: none; }

.cod-cell {
  font-weight: 600;
  width: 70px;
}

.badge-cod { background: rgba(239,68,68,.15); color: var(--error); padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; font-family: monospace; display: inline-block; }

.nombre-cell { font-weight: 500; min-width: 150px; }
.desc-cell { font-size: 12px; color: rgba(var(--v-theme-on-surface),.55); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: help; }
.und-cell { width: 60px; text-align: center; font-weight: 500; }
.stock-cell { width: 100px; text-align: right; font-weight: 700; font-size: 14px; }
.minimo-cell { width: 120px; }
.estado-cell { width: 100px; text-align: center; }
.action-cell { width: 50px; text-align: center; }

.input-wrap-minimo {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(var(--v-theme-on-surface),.05);
  border: 1px solid rgba(var(--v-theme-on-surface),.15);
  border-radius: 6px;
  padding: 6px;
}

.minimo-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  text-align: center;
  padding: 0;
}

.minimo-input::-webkit-outer-spin-button,
.minimo-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

.estado-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .2px;
}

.estado-normal { background: rgba(16,185,129,.15); color: var(--success); }
.estado-bajo { background: rgba(245,158,11,.15); color: var(--gold); }
.estado-fuera { background: rgba(239,68,68,.15); color: var(--error); }

.cst-total { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); text-align: right; margin-top: 12px; }

.bodega-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(8,145,178,.08);
  border-left: 3px solid var(--indigo);
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 16px;
}

.cst-empty-bodega {
  text-align: center;
  padding: 60px 20px;
  color: rgba(var(--v-theme-on-surface),.6);
}

.cst-empty-bodega p {
  margin: 12px 0;
}

.cst-empty-bodega p:first-of-type {
  font-size: 16px;
  margin-top: 16px;
  color: rgb(var(--v-theme-on-surface));
}
</style>
