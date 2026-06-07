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
        <div style="display:flex; gap:10px; align-items:center;">
          <v-select
            v-model="listaSeleccionada"
            :items="listasPrecios"
            item-title="lista"
            item-value="id"
            label="Lista de Precios"
            variant="outlined"
            density="compact"
            hide-details
            style="min-width:200px"
            @update:model-value="recalcularTodos"
          />
          <v-btn color="#0891b2" variant="elevated" prepend-icon="mdi-content-save-all" :loading="guardandoTodos" @click="guardarTodos">
            Guardar Todo
          </v-btn>
        </div>
      </div>

      <!-- FILTRO -->
      <div class="prx-filtros">
        <div class="prx-search">
          <v-icon size="18" style="color:rgba(var(--v-theme-on-surface),.4)">mdi-magnify</v-icon>
          <input v-model="search" type="text" placeholder="Buscar producto..." class="prx-search-input" />
          <v-icon v-if="search" size="16" style="cursor:pointer;color:rgba(var(--v-theme-on-surface),.4)" @click="search=''">mdi-close</v-icon>
        </div>
        <v-select
          v-model="filtroGrupo"
          :items="[{codigo:'TODOS',nombre:'Todos los grupos'},...grupos]"
          item-title="nombre"
          item-value="codigo"
          label="Grupo"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width:220px"
        />
        <v-btn variant="text" prepend-icon="mdi-refresh" :loading="loading" @click="cargar">Actualizar</v-btn>
      </div>

      <!-- INFO LISTA SELECCIONADA -->
      <div v-if="listaActual" class="lista-info">
        <v-icon size="18" color="#0891b2">mdi-information-outline</v-icon>
        <span>Lista: <strong>{{ listaActual.lista }}</strong> — Margen: <strong>{{ (listaActual.margen * 100).toFixed(1) }}%</strong> — Fórmula: Precio Venta = Precio Costo ÷ (1 - {{ (listaActual.margen * 100).toFixed(1) }}%)</span>
      </div>

      <!-- TABLA -->
      <div class="prx-tabla-wrap">
        <div v-if="loading" class="prx-loading">
          <v-progress-circular indeterminate color="#0891b2" size="36" />
        </div>

        <table v-else class="prx-table">
          <thead>
            <tr>
              <th style="width:80px">CÓDIGO</th>
              <th>NOMBRE</th>
              <th style="width:70px">UND</th>
              <th style="width:160px">PRECIO COSTO ($)</th>
              <th style="width:130px; text-align:center">PRECIO VENTA 1</th>
              <th style="width:130px; text-align:center">PRECIO VENTA 2</th>
              <th style="width:130px; text-align:center">PRECIO VENTA 3</th>
              <th style="width:60px; text-align:center">ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="productosFiltrados.length === 0">
              <tr><td colspan="8" class="prx-empty">No hay productos</td></tr>
            </template>
            <tr v-for="p in productosFiltrados" :key="p.codigo" class="prx-row" :class="{ 'row-modificado': p._modificado }">
              <td><span class="badge-cod">{{ p.codigo }}</span></td>
              <td class="td-nom">{{ p.nombre }}</td>
              <td><span class="badge-und">{{ p.und }}</span></td>
              <td>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="color:rgba(var(--v-theme-on-surface),.5); font-size:13px;">$</span>
                  <input
                    v-model.number="p.precio_costo"
                    type="number"
                    step="0.01"
                    min="0"
                    class="precio-input"
                    @input="calcularPreciosFila(p)"
                  />
                </div>
              </td>
              <td class="td-precio">
                <span class="precio-calc">${{ calcPrecio(p.precio_costo, 1) }}</span>
              </td>
              <td class="td-precio">
                <span class="precio-calc">${{ calcPrecio(p.precio_costo, 2) }}</span>
              </td>
              <td class="td-precio">
                <span class="precio-calc">${{ calcPrecio(p.precio_costo, 3) }}</span>
              </td>
              <td style="text-align:center">
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  :color="p._modificado ? '#10b981' : '#cbd5e1'"
                  :loading="p._guardando"
                  @click="guardarFila(p)"
                  :title="p._modificado ? 'Guardar cambio' : 'Sin cambios'"
                >
                  <v-icon>{{ p._modificado ? 'mdi-content-save' : 'mdi-check' }}</v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </table>
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
const filtroGrupo     = ref('TODOS')
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
  if (filtroGrupo.value !== 'TODOS') lista = lista.filter(p => p.grupo === filtroGrupo.value)
  return lista
})

const productosModificados = computed(() =>
  productos.value.filter(p => p._modificado).length
)

function calcularPreciosFila(p) {
  p._modificado = true
}

function recalcularTodos() {
  // solo reactivo, los calculos se hacen en calcPrecio()
}

async function cargar() {
  loading.value = true
  try {
    const [resP, resG, resL] = await Promise.all([
      productosAlmacenService.getProductos(),
      productosAlmacenService.getGrupos(),
      productosAlmacenService.getListasPrecios(),
    ])
    productos.value = (resP.data || []).map(p => ({
      ...p,
      precio_costo: parseFloat(p.precio_costo) || 0,
      _modificado: false,
      _guardando: false,
    }))
    grupos.value       = resG.data || []
    listasPrecios.value = resL.data || []
    if (listasPrecios.value.length > 0 && !listaSeleccionada.value) {
      listaSeleccionada.value = listasPrecios.value[0].id
    }
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
    const m = margenes.value
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
.prx-container { padding: 24px; max-width: 1400px; margin: 0 auto; }

.prx-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root    { font-size: 12px; font-weight: 700; color: #06b6d4; text-transform: uppercase; letter-spacing: .5px; }
.bc-sep     { color: rgba(var(--v-theme-on-surface),.3); }
.bc-cat     { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface),.8); font-weight: 500; }

.prx-header      { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }
.prx-header-left { display: flex; align-items: center; gap: 16px; }
.prx-icon-wrap   { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#f59e0b,#d97706); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(245,158,11,.35); flex-shrink: 0; }
.prx-title       { font-size: 20px; font-weight: 800; letter-spacing: .5px; margin: 0; }
.prx-sub         { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }

.prx-filtros { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
.prx-search  { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: rgba(var(--v-theme-on-surface),.03); border-radius: 8px; border: 1px solid rgba(var(--v-theme-on-surface),.08); flex: 1; min-width: 260px; }
.prx-search-input { flex: 1; border: none; background: transparent; outline: none; font-size: 14px; color: rgb(var(--v-theme-on-surface)); }
.prx-search-input::placeholder { color: rgba(var(--v-theme-on-surface),.4); }

.lista-info {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; margin-bottom: 16px;
  background: rgba(8,145,178,.08); border-left: 3px solid #0891b2;
  border-radius: 8px; font-size: 13px; color: rgba(var(--v-theme-on-surface),.8);
}

.prx-tabla-wrap { background: rgb(var(--v-theme-surface)); border-radius: 12px; border: 1px solid rgba(var(--v-theme-on-surface),.08); overflow: auto; }
.prx-loading    { display: flex; justify-content: center; padding: 60px; }

.prx-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.prx-table thead { background: rgba(var(--v-theme-on-surface),.04); }
.prx-table thead th { padding: 10px 12px; text-align: left; font-weight: 700; font-size: 11px; letter-spacing: .5px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.6); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); white-space: nowrap; }

.prx-row { border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); transition: background .15s; }
.prx-row:hover { background: rgba(var(--v-theme-on-surface),.02); }
.prx-table tbody td { padding: 8px 12px; vertical-align: middle; }

.row-modificado { background: rgba(245,158,11,.05) !important; }
.row-modificado:hover { background: rgba(245,158,11,.08) !important; }

.td-nom { font-weight: 500; }
.td-precio { text-align: center; }

.badge-cod { background: rgba(6,182,212,.15); color: #0891b2; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 12px; font-family: monospace; }
.badge-und { background: rgba(139,92,246,.12); color: #8b5cf6; padding: 2px 7px; border-radius: 5px; font-size: 12px; font-weight: 600; }

.precio-input {
  width: 100%; max-width: 110px;
  background: rgba(var(--v-theme-on-surface),.05);
  border: 1px solid rgba(var(--v-theme-on-surface),.15);
  border-radius: 6px; padding: 5px 8px;
  font-size: 13px; font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  outline: none; text-align: right;
}
.precio-input:focus { border-color: #f59e0b; background: rgba(245,158,11,.06); }
.precio-input::-webkit-outer-spin-button,
.precio-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

.precio-calc { font-size: 14px; font-weight: 700; color: #10b981; }

.prx-empty { text-align: center !important; padding: 50px 20px !important; color: rgba(var(--v-theme-on-surface),.4); }
.prx-total { margin-top: 10px; font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); text-align: right; }
</style>
