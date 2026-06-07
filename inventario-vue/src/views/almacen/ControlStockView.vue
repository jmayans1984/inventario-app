<template>
  <MainLayout>
    <div class="cst-container">

      <!-- BREADCRUMB -->
      <div class="cst-breadcrumb">
        <span class="bc-root">ALMACÉN</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Configuración</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Control de Stock</span>
      </div>

      <!-- HEADER -->
      <div class="cst-header">
        <div class="cst-header-left">
          <div class="cst-icon-wrap">
            <v-icon size="22" color="white">mdi-package-variant-closed</v-icon>
          </div>
          <div>
            <h1 class="cst-title">CONTROL DE STOCK</h1>
            <p class="cst-sub">Asigne stock mínimo a cada producto y monitoree su disponibilidad</p>
          </div>
        </div>
      </div>

      <!-- CONTROLES -->
      <div class="cst-controles">
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

        <v-btn color="#ef4444" variant="elevated" prepend-icon="mdi-content-save-all" :loading="guardandoTodos" @click="guardarTodos">
          Guardar Todo
        </v-btn>
      </div>

      <!-- TABLA AGRUPADA -->
      <div class="cst-table-wrap">
        <div v-if="loading" class="cst-loading">
          <v-progress-circular indeterminate color="#ef4444" size="36" />
        </div>

        <template v-else-if="productosAgrupados.length === 0">
          <div class="cst-empty">No hay productos con estos filtros</div>
        </template>

        <template v-else>
          <template v-for="grupo in productosAgrupados" :key="grupo.key">
            <!-- HEADER DE GRUPO -->
            <div class="grupo-header">
              <v-icon size="15" style="color:#ef4444">mdi-folder-outline</v-icon>
              <span class="grupo-nombre">{{ grupo.nombre }}</span>
              <span class="grupo-count">{{ grupo.items.length }} producto{{ grupo.items.length !== 1 ? 's' : '' }}</span>
            </div>

            <!-- TABLA DE PRODUCTOS -->
            <table class="cst-table">
              <thead>
                <tr>
                  <th>CÓDIGO</th>
                  <th>NOMBRE</th>
                  <th>UND</th>
                  <th>STOCK ACTUAL</th>
                  <th>STOCK MÍNIMO</th>
                  <th>ESTADO</th>
                  <th>ACCIÓN</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in grupo.items" :key="p.codigo" :class="{ 'fila-modificada': p._modificado, 'fila-error': p.stock_actual <= 0, 'fila-warning': p.stock_actual < p.stock_minimo }">
                  <td class="cod-cell"><span class="badge-cod">{{ p.codigo }}</span></td>
                  <td class="nombre-cell">{{ p.nombre }}</td>
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
                        @input="marcarModificado(p)"
                        @keydown.enter="saltarSiguiente(grupo, p)"
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
                      :color="p._modificado ? '#10b981' : '#cbd5e1'"
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
import MainLayout from '../../components/layouts/MainLayout.vue'
import { productosAlmacenService } from '../../services/productos-almacen.service'

const productos       = ref([])
const grupos          = ref([])
const loading         = ref(false)
const guardandoTodos  = ref(false)
const search          = ref('')
const filtroEstado    = ref('todos')
const snack           = ref({ show: false, msg: '', color: 'success' })

const opcionesEstado = [
  { value: 'todos', label: 'Todos' },
  { value: 'fuera', label: '🔴 Fuera de Stock' },
  { value: 'bajo', label: '🟡 Bajo Stock' },
  { value: 'normal', label: '🟢 Normal' },
]

function obtenerColorStock(p) {
  const actual = p.stock_actual || 0
  const minimo = p.stock_minimo || 0
  if (actual <= 0) return '#ef4444'
  if (actual < minimo) return '#f59e0b'
  return '#10b981'
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

function saltarSiguiente(grupo, actual) {
  const idx = grupo.items.indexOf(actual)
  if (idx < grupo.items.length - 1) {
    setTimeout(() => {
      const inputs = document.querySelectorAll('.minimo-input')
      const actualInput = Array.from(inputs).find(inp => inp.value === String(actual.stock_minimo))
      const actualIdx = Array.from(inputs).indexOf(actualInput)
      if (actualIdx >= 0 && actualIdx + 1 < inputs.length) {
        inputs[actualIdx + 1].focus()
        inputs[actualIdx + 1].select()
      }
    }, 0)
  }
}

async function cargar() {
  loading.value = true
  try {
    const [resP, resG] = await Promise.all([
      productosAlmacenService.getProductos(),
      productosAlmacenService.getGrupos(),
    ])
    productos.value = (resP.data || []).map(p => ({
      ...p,
      stock_minimo: parseFloat(p.stock_minimo) || 0,
      stock_actual: parseFloat(p.stock_actual) || 0,
      _modificado: false,
      _guardando: false,
    }))
    grupos.value = resG.data || []
  } catch (e) {
    console.error('Error cargando:', e)
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
.cst-container { padding: 24px; max-width: 1600px; margin: 0 auto; }

.cst-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root    { font-size: 12px; font-weight: 700; color: #06b6d4; text-transform: uppercase; letter-spacing: .5px; }
.bc-sep     { color: rgba(var(--v-theme-on-surface),.3); }
.bc-cat     { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface),.8); font-weight: 500; }

.cst-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.cst-header-left { display: flex; align-items: center; gap: 16px; }
.cst-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#ef4444,#dc2626); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(239,68,68,.35); flex-shrink: 0; }
.cst-title { font-size: 20px; font-weight: 800; letter-spacing: .5px; margin: 0; }
.cst-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }

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
  border-left: 3px solid #ef4444;
  border-radius: 8px;
  margin: 20px 0 12px 0;
}
.grupo-nombre { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #ef4444; }
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

.badge-cod { background: rgba(239,68,68,.15); color: #ef4444; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; font-family: monospace; display: inline-block; }

.nombre-cell { font-weight: 500; min-width: 180px; }
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

.estado-normal { background: rgba(16,185,129,.15); color: #10b981; }
.estado-bajo { background: rgba(245,158,11,.15); color: #f59e0b; }
.estado-fuera { background: rgba(239,68,68,.15); color: #ef4444; }

.cst-total { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); text-align: right; margin-top: 12px; }
</style>
