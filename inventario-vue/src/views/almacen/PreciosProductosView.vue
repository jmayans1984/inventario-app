<template>
  <MainLayout>
    <div class="prx-container">

      <!-- BREADCRUMB -->
      <div class="prx-breadcrumb">
        <span class="bc-root">ALMACÉN</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Configuración</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Precios de Compra / Venta</span>
      </div>

      <!-- HEADER -->
      <div class="prx-header">
        <div class="prx-header-left">
          <div class="prx-icon-wrap">
            <v-icon size="22" color="white">mdi-currency-usd</v-icon>
          </div>
          <div>
            <h1 class="prx-title">PRECIOS DE COMPRA / VENTA</h1>
            <p class="prx-sub">Actualice el precio de costo de cada artículo y vea los precios de venta calculados automáticamente</p>
          </div>
        </div>
      </div>

      <!-- CONTROLES EN UNA FILA -->
      <div class="prx-controles">
        <div class="prx-search">
          <v-icon size="18" style="color:rgba(var(--v-theme-on-surface),.4)">mdi-magnify</v-icon>
          <input v-model="search" type="text" placeholder="Buscar producto..." class="prx-search-input" @keyup.escape="search=''" />
          <v-icon v-if="search" size="16" style="cursor:pointer;color:rgba(var(--v-theme-on-surface),.4)" @click="search=''">mdi-close</v-icon>
        </div>

        <v-select
          v-model="listaSeleccionada"
          :items="listasPrecios"
          item-title="lista"
          item-value="id"
          label="Lista de Precios"
          variant="outlined"
          density="compact"
          hide-details
          style="min-width:220px"
          @update:model-value="recalcularTodos"
        />

        <v-btn color="#0891b2" variant="elevated" prepend-icon="mdi-content-save-all" :loading="guardandoTodos" @click="guardarTodos">
          Guardar Todo
        </v-btn>
      </div>

      <!-- INFO LISTA SELECCIONADA -->
      <div v-if="listaActual" class="lista-info">
        <v-icon size="18" color="#0891b2">mdi-information-outline</v-icon>
        <span>Lista: <strong>{{ listaActual.lista }}</strong> — Margen: <strong>{{ (listaActual.margen * 100).toFixed(1) }}%</strong> — Fórmula: Precio Venta = Precio Costo ÷ (1 - {{ (listaActual.margen * 100).toFixed(1) }}%)</span>
      </div>

      <!-- TABLA AGRUPADA -->
      <div class="prx-table-wrap">
        <div v-if="loading" class="prx-loading">
          <v-progress-circular indeterminate color="#0891b2" size="36" />
        </div>

        <template v-else-if="productosAgrupados.length === 0">
          <div class="prx-empty">No hay productos</div>
        </template>

        <template v-else>
          <template v-for="grupo in productosAgrupados" :key="grupo.key">
            <!-- HEADER DE GRUPO -->
            <div class="grupo-header">
              <v-icon size="15" style="color:#8b5cf6">mdi-folder-outline</v-icon>
              <span class="grupo-nombre">{{ grupo.nombre }}</span>
              <span class="grupo-count">{{ grupo.items.length }} producto{{ grupo.items.length !== 1 ? 's' : '' }}</span>
            </div>

            <!-- TABLA DE PRODUCTOS -->
            <table class="prx-table">
              <thead>
                <tr>
                  <th>CÓDIGO</th>
                  <th>NOMBRE</th>
                  <th>DESCRIPCIÓN</th>
                  <th>UND</th>
                  <th>PRECIO COSTO</th>
                  <th>PRECIO VENTA 1</th>
                  <th>PRECIO VENTA 2</th>
                  <th>PRECIO VENTA 3</th>
                  <th>ACCIÓN</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in grupo.items" :key="p.codigo" :class="{ 'fila-modificada': p._modificado }">
                  <td class="cod-cell"><span class="badge-cod">{{ p.codigo }}</span></td>
                  <td class="nombre-cell">{{ p.nombre }}</td>
                  <td class="desc-cell" :title="p.descripcion">{{ p.descripcion || '—' }}</td>
                  <td class="und-cell">{{ p.und }}</td>
                  <td class="precio-input-cell">
                    <div class="input-wrap">
                      <span class="currency">$</span>
                      <input
                        v-model.number="p.precio_costo"
                        type="number"
                        step="0.01"
                        min="0"
                        class="precio-input"
                        @input="calcularPreciosFila(p)"
                        @keydown.enter="saltarSiguiente(grupo, p)"
                      />
                    </div>
                  </td>
                  <td class="precio-venta-cell">{{ calcPrecio(p.precio_costo, 1) }}</td>
                  <td class="precio-venta-cell">{{ calcPrecio(p.precio_costo, 2) }}</td>
                  <td class="precio-venta-cell">{{ calcPrecio(p.precio_costo, 3) }}</td>
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

      <div v-if="!loading && productosFiltrados.length > 0" class="prx-total">
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
const listasPrecios   = ref([])
const listaSeleccionada = ref(null)
const loading         = ref(false)
const guardandoTodos  = ref(false)
const search          = ref('')
const snack           = ref({ show: false, msg: '', color: 'success' })

const listaActual = computed(() =>
  listasPrecios.value.find(l => l.id === listaSeleccionada.value) || null
)

const margenes = computed(() => {
  if (!listaActual.value) return { m1: 0, m2: 0, m3: 0 }
  const m = parseFloat(listaActual.value.margen) || 0
  return { m1: m, m2: m, m3: m }
})

function calcPrecio(costo, nivel) {
  const c = parseFloat(costo) || 0
  if (c <= 0) return '0.00'
  const m = margenes.value[`m${nivel}`]
  if (m <= 0 || m >= 1) return c.toFixed(2)
  return (c / (1 - m)).toFixed(2)
}

const productosFiltrados = computed(() => {
  let lista = productos.value
  const q = search.value.trim().toUpperCase()
  if (q) lista = lista.filter(p => p.nombre?.toUpperCase().includes(q) || p.codigo?.includes(q))
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

function calcularPreciosFila(p) {
  p._modificado = true
}

function saltarSiguiente(grupo, actual) {
  const idx = grupo.items.indexOf(actual)
  if (idx < grupo.items.length - 1) {
    setTimeout(() => {
      const inputs = document.querySelectorAll('.precio-input')
      const actualInput = Array.from(inputs).find(inp => inp.value === String(actual.precio_costo))
      const actualIdx = Array.from(inputs).indexOf(actualInput)
      if (actualIdx >= 0 && actualIdx + 1 < inputs.length) {
        inputs[actualIdx + 1].focus()
        inputs[actualIdx + 1].select()
      }
    }, 0)
  }
}

function recalcularTodos() {
  // solo reactivo, los calculos se hacen en calcPrecio()
}

async function cargar() {
  loading.value = true
  try {
    const [resP, resL] = await Promise.all([
      productosAlmacenService.getProductosPrecios(),
      productosAlmacenService.getListasPrecios(),
    ])
    productos.value = (resP.data || []).map(p => ({
      ...p,
      precio_costo:  parseFloat(p.precio_costo)  || 0,
      precio_venta1: parseFloat(p.precio_venta1) || 0,
      precio_venta2: parseFloat(p.precio_venta2) || 0,
      precio_venta3: parseFloat(p.precio_venta3) || 0,
      _modificado: false,
      _guardando: false,
    }))
    listasPrecios.value = resL.data || []
    if (listasPrecios.value.length > 0 && !listaSeleccionada.value) {
      listaSeleccionada.value = listasPrecios.value[0].id
    }
  } catch (e) {
    console.error('Error cargando precios:', e)
    const msg = e.response?.data?.error || e.message || 'Error desconocido'
    mostrarSnack(`Error al cargar: ${msg}`, 'error')
  } finally {
    loading.value = false
  }
}

async function guardarFila(p) {
  if (!p._modificado) return
  p._guardando = true
  try {
    const pv1 = parseFloat(calcPrecio(p.precio_costo, 1))
    const pv2 = parseFloat(calcPrecio(p.precio_costo, 2))
    const pv3 = parseFloat(calcPrecio(p.precio_costo, 3))
    await productosAlmacenService.actualizarProducto(p.codigo, {
      ...p,
      precio_costo: p.precio_costo,
      precio_venta1: pv1,
      precio_venta2: pv2,
      precio_venta3: pv3,
    })
    p._modificado = false
    mostrarSnack('Precio guardado', 'success')
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
.prx-container { padding: 24px; max-width: 1600px; margin: 0 auto; }

.prx-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root    { font-size: 12px; font-weight: 700; color: #06b6d4; text-transform: uppercase; letter-spacing: .5px; }
.bc-sep     { color: rgba(var(--v-theme-on-surface),.3); }
.bc-cat     { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface),.8); font-weight: 500; }

.prx-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.prx-header-left { display: flex; align-items: center; gap: 16px; }
.prx-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#f59e0b,#d97706); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(245,158,11,.35); flex-shrink: 0; }
.prx-title { font-size: 20px; font-weight: 800; letter-spacing: .5px; margin: 0; }
.prx-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }

.prx-controles { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
.prx-search  { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: rgba(var(--v-theme-on-surface),.03); border-radius: 8px; border: 1px solid rgba(var(--v-theme-on-surface),.08); flex: 1; min-width: 260px; }
.prx-search-input { flex: 1; border: none; background: transparent; outline: none; font-size: 14px; color: rgb(var(--v-theme-on-surface)); }
.prx-search-input::placeholder { color: rgba(var(--v-theme-on-surface),.4); }

.lista-info {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; margin-bottom: 16px;
  background: rgba(8,145,178,.08); border-left: 3px solid #0891b2;
  border-radius: 8px; font-size: 13px; color: rgba(var(--v-theme-on-surface),.8);
}

.prx-table-wrap { margin-bottom: 16px; }
.prx-loading { display: flex; justify-content: center; padding: 60px; }
.prx-empty { text-align: center; padding: 50px 20px; color: rgba(var(--v-theme-on-surface),.4); }

.grupo-header {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px;
  background: rgba(139,92,246,.08);
  border-left: 3px solid #8b5cf6;
  border-radius: 8px;
  margin: 20px 0 12px 0;
}
.grupo-nombre { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #8b5cf6; }
.grupo-count { font-size: 11px; color: rgba(var(--v-theme-on-surface),.4); margin-left: auto; }

.prx-table {
  width: 100%;
  border-collapse: collapse;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface),.08);
  border-radius: 8px;
  overflow: hidden;
}

.prx-table thead {
  background: rgba(var(--v-theme-on-surface),.05);
  border-bottom: 2px solid rgba(var(--v-theme-on-surface),.1);
}

.prx-table th {
  padding: 12px 14px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .4px;
  color: rgba(var(--v-theme-on-surface),.6);
  text-align: left;
  border-right: 1px solid rgba(var(--v-theme-on-surface),.05);
}

.prx-table th:last-child { border-right: none; }

.prx-table tbody tr {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05);
  transition: background-color .15s;
}

.prx-table tbody tr:hover {
  background: rgba(var(--v-theme-on-surface),.03);
}

.fila-modificada {
  background: rgba(245,158,11,.08) !important;
}

.prx-table td {
  padding: 12px 14px;
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
  border-right: 1px solid rgba(var(--v-theme-on-surface),.05);
}

.prx-table td:last-child { border-right: none; }

.cod-cell {
  font-weight: 600;
  width: 70px;
}

.badge-cod { background: rgba(6,182,212,.15); color: #0891b2; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; font-family: monospace; display: inline-block; }

.nombre-cell { font-weight: 500; min-width: 160px; }
.desc-cell { font-size: 12px; color: rgba(var(--v-theme-on-surface),.55); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: help; }
.und-cell { width: 60px; text-align: center; font-weight: 500; }

.precio-input-cell { width: 130px; }
.precio-venta-cell { width: 110px; text-align: right; color: #10b981; font-weight: 600; }

.input-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(var(--v-theme-on-surface),.05);
  border: 1px solid rgba(var(--v-theme-on-surface),.15);
  border-radius: 6px;
  padding: 6px;
}

.currency { color: rgba(var(--v-theme-on-surface),.5); font-size: 13px; font-weight: 600; }

.precio-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  text-align: right;
  padding: 0;
}

.precio-input::-webkit-outer-spin-button,
.precio-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

.action-cell { width: 50px; text-align: center; }

.prx-total { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); text-align: right; margin-top: 12px; }
</style>
