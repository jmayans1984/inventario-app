<template>
  <MainLayout>
    <div class="rc-container">

      <!-- BREADCRUMB -->
      <div class="rc-breadcrumb">
        <span class="bc-root">RECETAS</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Configuración</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Catálogo de Recetas</span>
      </div>

      <!-- HEADER -->
      <div class="rc-header">
        <div class="rc-header-left">
          <div class="rc-icon-wrap"><v-icon size="22" color="white">mdi-book-open-variant-outline</v-icon></div>
          <div>
            <h1 class="rc-title">CATÁLOGO DE RECETAS</h1>
            <p class="rc-sub">Crea, edita y gestiona las recetas con sus ingredientes</p>
          </div>
        </div>
        <v-btn color="#f59e0b" variant="flat" rounded="lg" @click="abrirNuevaReceta">
          <v-icon start>mdi-plus</v-icon> Nueva Receta
        </v-btn>
      </div>

      <!-- FILTROS -->
      <div class="rc-filters">
        <v-text-field v-model="busqueda" placeholder="Buscar receta..." prepend-inner-icon="mdi-magnify"
          variant="outlined" density="compact" hide-details clearable style="max-width:320px" />
        <v-select v-model="filtroTipo" :items="tiposFilter" item-title="label" item-value="val"
          variant="outlined" density="compact" hide-details style="max-width:200px" />
      </div>

      <!-- KPI MINI -->
      <div class="rc-kpi-row">
        <div class="rc-kpi" v-for="k in kpis" :key="k.label">
          <span class="kpi-val">{{ k.val }}</span>
          <span class="kpi-lbl">{{ k.label }}</span>
        </div>
      </div>

      <!-- TABLA -->
      <div class="rc-table-card">
        <v-progress-linear v-if="loading" indeterminate color="#f59e0b" height="3" />
        <v-data-table
          :headers="headers"
          :items="recetasFiltradas"
          :search="busqueda"
          density="compact"
          hover
          :items-per-page="20"
          class="rc-table"
        >
          <template #item.tipo="{ item }">
            <v-chip :color="colorTipo(item.tipo)" size="x-small" variant="tonal" label>
              {{ item.tipo }}
            </v-chip>
          </template>

          <template #item.costo="{ item }">
            <span class="font-mono">{{ fmt(item.costo) }}</span>
          </template>

          <template #item.precio_venta="{ item }">
            <span class="font-mono">{{ fmt(item.precio_venta) }}</span>
          </template>

          <template #item.porcentaje_costo="{ item }">
            <v-chip :color="colorPct(item.porcentaje_costo)" size="x-small" variant="tonal">
              {{ item.porcentaje_costo }}%
            </v-chip>
          </template>

          <template #item.num_ingredientes="{ item }">
            <v-chip color="blue-grey" size="x-small" variant="tonal">
              {{ item.num_ingredientes }}
            </v-chip>
          </template>

          <template #item.acciones="{ item }">
            <div class="d-flex gap-1">
              <v-tooltip text="Ver / Editar ingredientes">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon size="x-small" variant="tonal" color="#f59e0b"
                    @click="abrirIngredientes(item)">
                    <v-icon size="16">mdi-format-list-bulleted</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Editar receta">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon size="x-small" variant="tonal" color="blue"
                    @click="abrirEditar(item)">
                    <v-icon size="16">mdi-pencil-outline</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Eliminar receta">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon size="x-small" variant="tonal" color="error"
                    @click="confirmarEliminar(item)">
                    <v-icon size="16">mdi-trash-can-outline</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
            </div>
          </template>
        </v-data-table>
      </div>
    </div>

    <!-- ──────────────────────────────────────────── -->
    <!-- DIALOG: NUEVA / EDITAR RECETA               -->
    <!-- ──────────────────────────────────────────── -->
    <v-dialog v-model="dlgReceta" max-width="560" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center gap-3 pa-5 pb-3">
          <div class="dlg-icon-wrap">
            <v-icon size="18" color="white">mdi-chef-hat</v-icon>
          </div>
          {{ editando ? 'Editar Receta' : 'Nueva Receta' }}
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-5">
          <v-row dense>
            <v-col cols="4">
              <v-text-field v-model="form.codigo" label="Código" variant="outlined"
                density="compact" hide-details :disabled="editando" />
            </v-col>
            <v-col cols="8">
              <v-text-field v-model="form.nombre" label="Nombre *" variant="outlined"
                density="compact" hide-details :error-messages="errNombre" />
            </v-col>
            <v-col cols="6">
              <v-select v-model="form.tipo" :items="TIPOS_RECETA" label="Tipo *"
                variant="outlined" density="compact" hide-details />
            </v-col>
            <v-col cols="3">
              <v-text-field v-model="form.rendimiento" label="Rend." type="number" min="0.01"
                variant="outlined" density="compact" hide-details />
            </v-col>
            <v-col cols="3">
              <v-text-field v-model="form.und" label="Und" variant="outlined"
                density="compact" hide-details />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="form.precio_venta" label="Precio de Venta" type="number"
                min="0" variant="outlined" density="compact" hide-details prefix="$" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="form.categoria" label="Categoría" variant="outlined"
                density="compact" hide-details />
            </v-col>
            <v-col cols="12">
              <v-textarea v-model="form.descripcion" label="Descripción / Notas" rows="2"
                variant="outlined" density="compact" hide-details />
            </v-col>
          </v-row>
          <div v-if="form.tipo === 'PRODUCTO PROPIO'" class="info-box mt-3">
            <v-icon size="15" color="#f59e0b">mdi-information-outline</v-icon>
            Esta receta también se creará como artículo para poder usarla como ingrediente en otras recetas.
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4 justify-end gap-2">
          <v-btn variant="text" @click="dlgReceta=false">Cancelar</v-btn>
          <v-btn color="#f59e0b" variant="flat" rounded="lg" :loading="guardando"
            @click="guardarReceta">
            <v-icon start>mdi-content-save-outline</v-icon>
            {{ editando ? 'Guardar Cambios' : 'Crear Receta' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ──────────────────────────────────────────── -->
    <!-- DIALOG: INGREDIENTES DE UNA RECETA          -->
    <!-- ──────────────────────────────────────────── -->
    <v-dialog v-model="dlgIng" max-width="800" persistent scrollable>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center gap-3 pa-5 pb-3">
          <div class="dlg-icon-wrap">
            <v-icon size="18" color="white">mdi-format-list-bulleted</v-icon>
          </div>
          <div>
            <div>Ingredientes — <strong>{{ recetaActual?.nombre }}</strong></div>
            <div class="text-caption text-medium-emphasis">Código: {{ recetaActual?.codigo }}</div>
          </div>
          <v-spacer />
          <v-chip :color="colorTipo(recetaActual?.tipo)" size="small" variant="tonal" label>
            {{ recetaActual?.tipo }}
          </v-chip>
        </v-card-title>
        <v-divider />

        <!-- AGREGAR INGREDIENTE -->
        <v-card-text class="pa-4">
          <div class="add-ing-row">
            <v-autocomplete v-model="ingNuevo.articulo" :items="articulos"
              item-title="nombre" item-value="codigo"
              label="Buscar artículo/ingrediente..." variant="outlined" density="compact"
              hide-details clearable :filter="filtrarArticulo"
              @update:model-value="onSelectArticulo">
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <template #append>
                    <span class="text-caption text-medium-emphasis">{{ item.raw.und }} · {{ fmtPrecio(item.raw.precio) }}</span>
                  </template>
                </v-list-item>
              </template>
            </v-autocomplete>
            <v-text-field v-model="ingNuevo.cant" label="Cant." type="number" min="0.001"
              variant="outlined" density="compact" hide-details style="max-width:100px" />
            <v-text-field v-model="ingNuevo.und" label="Und." variant="outlined"
              density="compact" hide-details style="max-width:90px" />
            <v-btn color="#f59e0b" variant="flat" icon size="small" :disabled="!ingNuevo.articulo || !ingNuevo.cant"
              @click="agregarIngrediente">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </div>

          <!-- TABLA DE INGREDIENTES -->
          <div class="ing-table mt-3">
            <div class="ing-header">
              <span>ARTÍCULO / INGREDIENTE</span>
              <span class="text-right">CANT</span>
              <span>UND</span>
              <span class="text-right">PRECIO UNIT</span>
              <span class="text-right">SUBTOTAL</span>
              <span></span>
            </div>
            <div v-if="ingredientes.length === 0" class="ing-empty">
              Sin ingredientes — agrega usando el buscador de arriba
            </div>
            <div v-for="(ing, idx) in ingredientes" :key="idx" class="ing-row"
              :class="{ 'ing-subreceta': ing.es_subreceta }">
              <div class="ing-nombre">
                <v-icon v-if="ing.es_subreceta" size="12" color="#f59e0b" class="mr-1">mdi-chef-hat</v-icon>
                {{ ing.articulo_nombre || ing.articulo }}
                <span v-if="ing.es_subreceta" class="ing-badge">SUBRECETA</span>
              </div>
              <div class="text-right">
                <v-text-field v-model="ing.cant" type="number" min="0" variant="plain"
                  density="compact" hide-details class="cant-input" @change="recalcSubtotal(ing)" />
              </div>
              <div class="text-caption text-medium-emphasis">{{ ing.und }}</div>
              <div class="text-right text-caption">{{ fmtPrecio(ing.precio_unit) }}</div>
              <div class="text-right font-mono subtotal-col">{{ fmtPrecio(ing.precio_unit * ing.cant) }}</div>
              <div class="text-center">
                <v-btn icon size="x-small" variant="text" color="error" @click="quitarIngrediente(idx)">
                  <v-icon size="14">mdi-close</v-icon>
                </v-btn>
              </div>
            </div>
            <!-- TOTAL -->
            <div v-if="ingredientes.length > 0" class="ing-total-row">
              <span class="font-weight-bold">COSTO TOTAL</span>
              <span></span><span></span><span></span>
              <span class="text-right font-mono font-weight-bold total-val">{{ fmtPrecio(costoTotal) }}</span>
              <span></span>
            </div>
          </div>

          <!-- RESUMEN COSTO VS PRECIO VENTA -->
          <div v-if="recetaActual?.precio_venta > 0" class="costo-resumen mt-3">
            <div class="cr-item">
              <span class="cr-lbl">Costo</span>
              <span class="cr-val cost">{{ fmtPrecio(costoTotal) }}</span>
            </div>
            <div class="cr-item">
              <span class="cr-lbl">Precio Venta</span>
              <span class="cr-val">{{ fmtPrecio(recetaActual.precio_venta) }}</span>
            </div>
            <div class="cr-item">
              <span class="cr-lbl">Margen</span>
              <span class="cr-val margin">{{ fmtPrecio(recetaActual.precio_venta - costoTotal) }}</span>
            </div>
            <div class="cr-item">
              <span class="cr-lbl">% Costo</span>
              <span class="cr-val" :style="{ color: colorPctStr(pctCosto) }">{{ pctCosto.toFixed(1) }}%</span>
            </div>
          </div>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4 justify-end gap-2">
          <v-btn variant="text" @click="dlgIng=false">Cancelar</v-btn>
          <v-btn color="#f59e0b" variant="flat" rounded="lg" :loading="guardandoIng"
            @click="guardarIngredientes">
            <v-icon start>mdi-content-save-outline</v-icon>
            Guardar Ingredientes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIALOG CONFIRMAR ELIMINAR -->
    <v-dialog v-model="dlgEliminar" max-width="400">
      <v-card rounded="xl">
        <v-card-text class="pa-6 text-center">
          <v-icon size="48" color="error" class="mb-3">mdi-alert-circle-outline</v-icon>
          <p class="text-subtitle-1 font-weight-bold mb-1">¿Eliminar receta?</p>
          <p class="text-caption text-medium-emphasis">
            <strong>{{ recetaAEliminar?.nombre }}</strong> será eliminada junto con todos sus ingredientes.
            Esta acción no se puede deshacer.
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 justify-end gap-2">
          <v-btn variant="text" @click="dlgEliminar=false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" rounded="lg" :loading="eliminando"
            @click="eliminarReceta">
            <v-icon start>mdi-trash-can-outline</v-icon>Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- SNACKBAR -->
    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3500" location="bottom right">
      {{ snack.msg }}
    </v-snackbar>

  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { API_BASE } from '../../utils/constants.js'

// ── Estado ─────────────────────────────────────────────────────
const recetas    = ref([])
const articulos  = ref([])
const loading    = ref(false)
const busqueda   = ref('')
const filtroTipo = ref('TODOS')

const TIPOS_RECETA = ['PLATO', 'PRODUCTO PROPIO', 'SUBRECETA', 'BEBIDA', 'POSTRE', 'ENTRADA', 'OTRO']
const tiposFilter  = computed(() => [
  { label: 'Todos los tipos', val: 'TODOS' },
  ...TIPOS_RECETA.map(t => ({ label: t, val: t }))
])

const headers = [
  { title: 'CÓDIGO',      key: 'codigo',          width: 90 },
  { title: 'NOMBRE',      key: 'nombre',           minWidth: 160 },
  { title: 'TIPO',        key: 'tipo',             width: 120 },
  { title: 'CATEG.',      key: 'categoria',        width: 100 },
  { title: 'INGRED.',     key: 'num_ingredientes', width: 80, align: 'center' },
  { title: 'COSTO',       key: 'costo',            width: 110, align: 'end' },
  { title: 'PV',          key: 'precio_venta',     width: 110, align: 'end' },
  { title: '% COSTO',     key: 'porcentaje_costo', width: 90,  align: 'center' },
  { title: '',            key: 'acciones',         width: 110, sortable: false },
]

// ── Dialog receta ──────────────────────────────────────────────
const dlgReceta = ref(false)
const editando  = ref(false)
const guardando = ref(false)
const errNombre = ref('')
const form      = ref(formVacio())

function formVacio() {
  return { codigo: '', nombre: '', tipo: 'PLATO', rendimiento: 1, und: 'PORCION',
           precio_venta: 0, categoria: '', descripcion: '' }
}

// ── Dialog ingredientes ────────────────────────────────────────
const dlgIng       = ref(false)
const recetaActual = ref(null)
const ingredientes = ref([])
const guardandoIng = ref(false)
const ingNuevo     = ref({ articulo: null, cant: 1, und: '' })

// ── Dialog eliminar ────────────────────────────────────────────
const dlgEliminar    = ref(false)
const recetaAEliminar = ref(null)
const eliminando     = ref(false)

// ── Snack ─────────────────────────────────────────────────────
const snack = ref({ show: false, msg: '', color: 'success' })
function ok(msg)  { snack.value = { show: true, msg, color: 'success' } }
function err(msg) { snack.value = { show: true, msg, color: 'error' } }

// ── Computed ──────────────────────────────────────────────────
const recetasFiltradas = computed(() => {
  let r = recetas.value
  if (filtroTipo.value !== 'TODOS') r = r.filter(x => x.tipo === filtroTipo.value)
  return r
})

const kpis = computed(() => [
  { label: 'Total Recetas',   val: recetas.value.length },
  { label: 'Platos',          val: recetas.value.filter(r => r.tipo === 'PLATO').length },
  { label: 'Subrecetas',      val: recetas.value.filter(r => r.tipo === 'SUBRECETA' || r.tipo === 'PRODUCTO PROPIO').length },
  { label: 'Sin Ingredientes',val: recetas.value.filter(r => +r.num_ingredientes === 0).length },
])

const costoTotal = computed(() =>
  ingredientes.value.reduce((s, i) => s + (parseFloat(i.precio_unit) || 0) * (parseFloat(i.cant) || 0), 0)
)
const pctCosto = computed(() => {
  const pv = parseFloat(recetaActual.value?.precio_venta) || 0
  return pv > 0 ? (costoTotal.value / pv * 100) : 0
})

// ── Métodos ───────────────────────────────────────────────────
async function cargarRecetas() {
  loading.value = true
  try {
    const r = await fetch(`${API_BASE}/recetas`)
    const j = await r.json()
    recetas.value = j.data || []
  } catch { err('Error al cargar recetas') }
  finally { loading.value = false }
}

async function cargarArticulos() {
  try {
    const r = await fetch(`${API_BASE}/articulos`)
    const j = await r.json()
    articulos.value = j.data || []
  } catch { /* silencioso */ }
}

function abrirNuevaReceta() {
  editando.value = false
  form.value     = formVacio()
  errNombre.value = ''
  dlgReceta.value = true
}

function abrirEditar(receta) {
  editando.value = true
  form.value = {
    codigo:       receta.codigo,
    nombre:       receta.nombre,
    tipo:         receta.tipo,
    rendimiento:  receta.rendimiento,
    und:          receta.und,
    precio_venta: receta.precio_venta,
    categoria:    receta.categoria,
    descripcion:  receta.descripcion,
  }
  errNombre.value = ''
  dlgReceta.value = true
}

async function guardarReceta() {
  errNombre.value = ''
  if (!form.value.nombre.trim()) { errNombre.value = 'Requerido'; return }
  guardando.value = true
  try {
    const url    = editando.value ? `${API_BASE}/recetas/${form.value.codigo}` : `${API_BASE}/recetas`
    const method = editando.value ? 'PUT' : 'POST'
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    ok(editando.value ? 'Receta actualizada' : 'Receta creada')
    dlgReceta.value = false
    await cargarRecetas()
    await cargarArticulos()
  } catch (e) { err(e.message) }
  finally { guardando.value = false }
}

async function abrirIngredientes(receta) {
  recetaActual.value = receta
  ingredientes.value = []
  ingNuevo.value     = { articulo: null, cant: 1, und: '' }
  dlgIng.value       = true
  // Cargar ingredientes de la API
  try {
    const r = await fetch(`${API_BASE}/recetas/${receta.codigo}`)
    const j = await r.json()
    if (j.success) {
      ingredientes.value = (j.data.ingredientes || []).map(i => ({
        ...i,
        cant:       parseFloat(i.cant) || 0,
        precio_unit: parseFloat(i.precio_unit) || 0,
        es_subreceta: i.es_subreceta || false,
      }))
    }
  } catch { err('Error al cargar ingredientes') }
}

function filtrarArticulo(item, queryText) {
  const q = queryText.toLowerCase()
  return item.nombre?.toLowerCase().includes(q) || item.codigo?.toLowerCase().includes(q)
}

function onSelectArticulo(codigo) {
  const art = articulos.value.find(a => a.codigo === codigo)
  if (art) ingNuevo.value.und = art.und || 'UND'
}

function agregarIngrediente() {
  const art = articulos.value.find(a => a.codigo === ingNuevo.value.articulo)
  if (!art) return
  // Verificar si ya existe
  if (ingredientes.value.find(i => i.articulo === art.codigo)) {
    err('Este artículo ya está en la receta')
    return
  }
  // Verificar si es subreceta
  const esSubreceta = recetas.value.some(r => r.codigo === art.codigo && art.codigo !== recetaActual.value?.codigo)
  ingredientes.value.push({
    articulo:       art.codigo,
    articulo_nombre: art.nombre,
    cant:           parseFloat(ingNuevo.value.cant) || 1,
    und:            ingNuevo.value.und || art.und || 'UND',
    precio_unit:    parseFloat(art.precio) || 0,
    es_subreceta:   esSubreceta,
  })
  ingNuevo.value = { articulo: null, cant: 1, und: '' }
}

function quitarIngrediente(idx) {
  ingredientes.value.splice(idx, 1)
}

function recalcSubtotal(ing) {
  ing.cant = parseFloat(ing.cant) || 0
}

async function guardarIngredientes() {
  guardandoIng.value = true
  try {
    const payload = ingredientes.value.map(i => ({
      articulo: i.articulo, cant: parseFloat(i.cant) || 0, und: i.und
    }))
    const r = await fetch(`${API_BASE}/recetas/${recetaActual.value.codigo}/ingredientes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredientes: payload })
    })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    // Recalcular costo automáticamente
    await fetch(`${API_BASE}/recetas/${recetaActual.value.codigo}/calcular-costo`, { method: 'POST' })
    ok('Ingredientes guardados y costo actualizado')
    dlgIng.value = false
    await cargarRecetas()
  } catch (e) { err(e.message) }
  finally { guardandoIng.value = false }
}

function confirmarEliminar(receta) {
  recetaAEliminar.value = receta
  dlgEliminar.value = true
}

async function eliminarReceta() {
  eliminando.value = true
  try {
    const r = await fetch(`${API_BASE}/recetas/${recetaAEliminar.value.codigo}`, { method: 'DELETE' })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    ok('Receta eliminada')
    dlgEliminar.value = false
    await cargarRecetas()
    await cargarArticulos()
  } catch (e) { err(e.message) }
  finally { eliminando.value = false }
}

// ── Helpers ───────────────────────────────────────────────────
function fmt(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtPrecio(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function colorTipo(tipo) {
  const m = { 'PLATO': 'cyan', 'SUBRECETA': 'orange', 'PRODUCTO PROPIO': 'purple',
               'BEBIDA': 'blue', 'POSTRE': 'pink', 'ENTRADA': 'green', 'OTRO': 'grey' }
  return m[tipo] || 'grey'
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

onMounted(() => { cargarRecetas(); cargarArticulos() })
</script>

<style scoped>
.rc-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
.rc-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 12px; font-weight: 700; color: #f59e0b; text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.3); }
.bc-cat { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.8); font-weight: 500; }
.rc-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.rc-header-left { display: flex; align-items: center; gap: 16px; }
.rc-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#f59e0b,#d97706); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(245,158,11,0.35); }
.rc-title { font-size: 20px; font-weight: 800; margin: 0; }
.rc-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 2px 0 0; }
.rc-filters { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.rc-kpi-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.rc-kpi { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 12px; padding: 12px 20px; display: flex; flex-direction: column; align-items: center; min-width: 110px; }
.kpi-val { font-size: 22px; font-weight: 800; color: #f59e0b; }
.kpi-lbl { font-size: 11px; color: rgba(var(--v-theme-on-surface),.5); text-align: center; }
.rc-table-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 16px; overflow: hidden; }
.font-mono { font-family: monospace; }

/* Dialog icon */
.dlg-icon-wrap { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg,#f59e0b,#d97706); display: flex; align-items: center; justify-content: center; }
.info-box { background: rgba(245,158,11,.08); border: 1px solid rgba(245,158,11,.25); border-radius: 8px; padding: 10px 12px; font-size: 12px; display: flex; align-items: flex-start; gap: 6px; color: rgba(var(--v-theme-on-surface),.7); }

/* Ingredientes */
.add-ing-row { display: flex; gap: 8px; align-items: flex-start; flex-wrap: wrap; }
.add-ing-row > :first-child { flex: 1; min-width: 200px; }
.ing-table { border: 1px solid rgba(var(--v-theme-on-surface),.1); border-radius: 12px; overflow: hidden; }
.ing-header { display: grid; grid-template-columns: 1fr 80px 70px 100px 100px 36px; padding: 8px 12px; background: rgba(var(--v-theme-on-surface),.04); font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface),.5); text-transform: uppercase; letter-spacing: .5px; }
.ing-row { display: grid; grid-template-columns: 1fr 80px 70px 100px 100px 36px; padding: 6px 12px; border-top: 1px solid rgba(var(--v-theme-on-surface),.06); align-items: center; font-size: 13px; }
.ing-row:hover { background: rgba(var(--v-theme-on-surface),.03); }
.ing-subreceta { background: rgba(245,158,11,.04); }
.ing-nombre { display: flex; align-items: center; gap: 4px; }
.ing-badge { font-size: 9px; background: rgba(245,158,11,.15); color: #d97706; border-radius: 4px; padding: 1px 5px; font-weight: 700; }
.ing-empty { padding: 24px; text-align: center; color: rgba(var(--v-theme-on-surface),.4); font-size: 13px; }
.cant-input :deep(.v-field__input) { padding: 2px 4px; font-size: 13px; }
.subtotal-col { color: rgba(var(--v-theme-on-surface),.8); }
.ing-total-row { display: grid; grid-template-columns: 1fr 80px 70px 100px 100px 36px; padding: 8px 12px; border-top: 2px solid rgba(var(--v-theme-on-surface),.12); background: rgba(var(--v-theme-on-surface),.03); font-size: 13px; align-items: center; }
.total-val { color: #f59e0b; font-size: 15px; }

/* Costo resumen */
.costo-resumen { display: flex; gap: 0; border: 1px solid rgba(var(--v-theme-on-surface),.1); border-radius: 12px; overflow: hidden; }
.cr-item { flex: 1; padding: 12px 16px; text-align: center; border-right: 1px solid rgba(var(--v-theme-on-surface),.08); }
.cr-item:last-child { border-right: none; }
.cr-lbl { display: block; font-size: 11px; color: rgba(var(--v-theme-on-surface),.5); margin-bottom: 4px; text-transform: uppercase; letter-spacing: .5px; }
.cr-val { font-size: 15px; font-weight: 700; font-family: monospace; }
.cr-val.cost { color: #ef4444; }
.cr-val.margin { color: #22c55e; }
</style>
