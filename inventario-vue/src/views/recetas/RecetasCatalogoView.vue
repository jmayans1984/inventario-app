<template>
  <MainLayout>
    <div class="rc-container">

      <div class="rc-breadcrumb">
        <span class="bc-root">RECETAS</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Configuración</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Catálogo de Recetas</span>
      </div>

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
        <v-select v-model="filtroGrupo" :items="gruposFilter" item-title="label" item-value="val"
          variant="outlined" density="compact" hide-details style="max-width:200px" />
        <v-btn-toggle v-model="filtroSubprod" density="compact" rounded="lg" color="#f59e0b">
          <v-btn value="TODOS" size="small">Todas</v-btn>
          <v-btn value="NO" size="small">Recetas</v-btn>
          <v-btn value="SI" size="small">Subproductos</v-btn>
        </v-btn-toggle>
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
        <v-data-table :headers="headers" :items="recetasFiltradas" :search="busqueda"
          density="compact" hover :items-per-page="20" class="rc-table">

          <template #item.subproducto="{ item }">
            <v-chip v-if="item.subproducto === 'SI'" color="purple" size="x-small" variant="tonal" label>
              SUBPRODUCTO
            </v-chip>
            <v-chip v-else color="cyan" size="x-small" variant="tonal" label>RECETA</v-chip>
          </template>

          <template #item.grupo_receta="{ item }">
            <span class="text-caption">{{ item.grupo_nombre || item.grupo_receta || '—' }}</span>
          </template>

          <template #item.valor="{ item }">
            <span class="font-mono text-error">{{ fmt(item.valor) }}</span>
          </template>

          <template #item.precio_venta="{ item }">
            <span class="font-mono">{{ fmt(item.precio_venta) }}</span>
          </template>

          <template #item.porcentaje_costo="{ item }">
            <v-chip v-if="item.precio_venta > 0" :color="colorPct(item.porcentaje_costo)" size="x-small" variant="tonal">
              {{ item.porcentaje_costo }}%
            </v-chip>
            <span v-else class="text-caption text-disabled">—</span>
          </template>

          <template #item.num_ingredientes="{ item }">
            <v-chip color="blue-grey" size="x-small" variant="tonal">{{ item.num_ingredientes }}</v-chip>
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

    <!-- DIALOG: NUEVA / EDITAR RECETA -->
    <v-dialog v-model="dlgReceta" max-width="520" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center gap-3 pa-5 pb-3">
          <div class="dlg-icon-wrap"><v-icon size="18" color="white">mdi-chef-hat</v-icon></div>
          {{ editando ? 'Editar Receta' : 'Nueva Receta' }}
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-5">
          <v-row dense>
            <v-col cols="4">
              <v-text-field v-model="form.codigo" label="Código *" variant="outlined"
                density="compact" hide-details :disabled="editando" :error-messages="errCodigo" />
            </v-col>
            <v-col cols="8">
              <v-text-field v-model="form.nombre" label="Nombre *" variant="outlined"
                density="compact" hide-details :error-messages="errNombre" />
            </v-col>
            <v-col cols="4">
              <v-autocomplete v-model="form.grupo_receta"
                :items="gruposReceta"
                item-title="nombre"
                item-value="codigo"
                label="Grupo"
                variant="outlined" density="compact" hide-details
                clearable placeholder="Seleccionar grupo..." />
            </v-col>
            <v-col cols="4">
              <v-text-field v-model="form.und" label="Unidad" variant="outlined"
                density="compact" hide-details />
            </v-col>
            <v-col cols="4">
              <v-text-field v-model="form.precio_venta" label="Precio Venta" type="number"
                min="0" variant="outlined" density="compact" hide-details prefix="$" />
            </v-col>
            <v-col cols="12">
              <v-switch v-model="form.es_subproducto" color="#f59e0b" density="compact" hide-details
                label="¿Es subproducto? (salsa, base, carne, etc. — se usa como ingrediente en otras recetas)" />
            </v-col>
          </v-row>
          <div v-if="form.es_subproducto" class="info-box mt-2">
            <v-icon size="15" color="#f59e0b">mdi-information-outline</v-icon>
            Al guardar, esta receta también se registrará en <strong>Artículos</strong> con su costo calculado, permitiendo usarla como ingrediente en otras recetas.
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4 justify-end gap-2">
          <v-btn variant="text" @click="dlgReceta=false">Cancelar</v-btn>
          <v-btn color="#f59e0b" variant="flat" rounded="lg" :loading="guardando" @click="guardarReceta">
            <v-icon start>mdi-content-save-outline</v-icon>
            {{ editando ? 'Guardar Cambios' : 'Crear Receta' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIALOG: INGREDIENTES -->
    <v-dialog v-model="dlgIng" max-width="820" persistent scrollable>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center gap-3 pa-5 pb-3">
          <div class="dlg-icon-wrap"><v-icon size="18" color="white">mdi-format-list-bulleted</v-icon></div>
          <div>
            <div>Ingredientes — <strong>{{ recetaActual?.nombre }}</strong></div>
            <div class="text-caption text-medium-emphasis">Cód: {{ recetaActual?.codigo }} · {{ recetaActual?.grupo_receta || '—' }}</div>
          </div>
          <v-spacer />
          <v-chip :color="recetaActual?.subproducto==='SI' ? 'purple' : 'cyan'" size="small" variant="tonal" label>
            {{ recetaActual?.subproducto === 'SI' ? 'SUBPRODUCTO' : 'RECETA' }}
          </v-chip>
        </v-card-title>
        <v-divider />

        <v-card-text class="pa-4">
          <!-- AGREGAR INGREDIENTE -->
          <div class="add-ing-group">
            <!-- SELECTOR TIPO -->
            <div class="type-selector">
              <v-btn-toggle v-model="tipoIngredienteNuevo" rounded="lg" density="compact" color="#f59e0b">
                <v-btn value="ARTICULO" size="small" class="btn-type">
                  <v-icon start size="16">mdi-food-apple-outline</v-icon>Artículo
                </v-btn>
                <v-btn value="RECETA" size="small" class="btn-type">
                  <v-icon start size="16">mdi-link-variant</v-icon>Subreceta
                </v-btn>
              </v-btn-toggle>
            </div>

            <!-- BÚSQUEDA ARTÍCULOS O RECETAS -->
            <div class="add-ing-row">
              <v-autocomplete
                v-if="tipoIngredienteNuevo === 'ARTICULO'"
                v-model="articuloSeleccionado" :items="articulos"
                item-title="nombre" return-object
                label="Buscar artículo..." variant="outlined" density="compact"
                hide-details clearable style="flex:1;min-width:200px">
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #append>
                      <span class="text-caption text-medium-emphasis">{{ item.raw.und }} · {{ fmt(item.raw.valor) }}</span>
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>

              <v-autocomplete
                v-else
                v-model="recetaSeleccionada" :items="subrecetas"
                item-title="nombre" return-object
                label="Buscar subreceta..." variant="outlined" density="compact"
                hide-details clearable style="flex:1;min-width:200px">
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #append>
                      <span class="text-caption text-medium-emphasis">{{ item.raw.und }} · {{ fmt(item.raw.valor) }}</span>
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>

              <v-text-field v-model="ingNuevo.cantidad" label="Cant." type="number" min="0.001"
                variant="outlined" density="compact" hide-details style="max-width:100px" />
              <v-btn color="#f59e0b" variant="flat" icon size="small"
                :disabled="(tipoIngredienteNuevo === 'ARTICULO' && !articuloSeleccionado) || (tipoIngredienteNuevo === 'RECETA' && !recetaSeleccionada) || !ingNuevo.cantidad"
                @click="agregarIngrediente">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </div>
          </div>

          <!-- TABLA INGREDIENTES -->
          <div class="ing-table mt-3" style="max-height:380px;overflow-y:auto">
            <div class="ing-header">
              <span>ARTÍCULO / INGREDIENTE</span>
              <span class="text-center">TIPO</span>
              <span class="text-right">CANT</span>
              <span>UND</span>
              <span class="text-right">VALOR UNIT</span>
              <span class="text-right">SUBTOTAL</span>
              <span></span>
            </div>
            <div v-if="ingredientes.length === 0" class="ing-empty">
              Sin ingredientes — agrega usando el buscador de arriba
            </div>
            <div v-for="(ing, idx) in ingredientes" :key="idx" class="ing-row"
              :class="{ 'ing-subreceta': ing.tipo === 'RECETA' }">
              <div class="ing-nombre">
                <v-icon v-if="ing.tipo === 'RECETA'" size="12" color="#8b5cf6" class="mr-1">mdi-link-variant</v-icon>
                {{ ing.nombre_item || ing.articulo_nombre || ing.articulo }}
              </div>
              <div class="text-center">
                <v-chip v-if="ing.tipo === 'RECETA'" color="purple" size="x-small" variant="tonal">SUBRECETA</v-chip>
                <v-chip v-else color="teal" size="x-small" variant="tonal">ARTÍCULO</v-chip>
              </div>
              <div class="text-right">
                <v-text-field v-model="ing.cantidad" type="number" min="0" variant="plain"
                  density="compact" hide-details class="cant-input" @change="recalcSubtotal(ing)" />
              </div>
              <div class="text-caption text-medium-emphasis">{{ ing.und }}</div>
              <div class="text-right text-caption font-mono">{{ fmt(ing.precio_unit) }}</div>
              <div class="text-right font-mono subtotal-col">{{ fmt((parseFloat(ing.precio_unit)||0) * (parseFloat(ing.cantidad)||0)) }}</div>
              <div class="text-center">
                <v-btn icon size="x-small" variant="text" color="error" @click="quitarIngrediente(idx)">
                  <v-icon size="14">mdi-close</v-icon>
                </v-btn>
              </div>
            </div>
            <!-- TOTAL -->
            <div v-if="ingredientes.length > 0" class="ing-total-row">
              <span class="font-weight-bold" style="grid-column:1/6">COSTO TOTAL</span>
              <span class="text-right font-mono font-weight-bold total-val">{{ fmt(costoTotal) }}</span>
              <span></span>
            </div>
          </div>

          <!-- RESUMEN -->
          <div v-if="recetaActual?.precio_venta > 0" class="costo-resumen mt-3">
            <div class="cr-item">
              <span class="cr-lbl">Costo</span>
              <span class="cr-val" style="color:#ef4444">{{ fmt(costoTotal) }}</span>
            </div>
            <div class="cr-item">
              <span class="cr-lbl">Precio Venta</span>
              <span class="cr-val">{{ fmt(recetaActual.precio_venta) }}</span>
            </div>
            <div class="cr-item">
              <span class="cr-lbl">Margen $</span>
              <span class="cr-val" style="color:#22c55e">{{ fmt(recetaActual.precio_venta - costoTotal) }}</span>
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
          <v-btn color="#f59e0b" variant="flat" rounded="lg" :loading="guardandoIng" @click="guardarIngredientes">
            <v-icon start>mdi-content-save-outline</v-icon>Guardar Ingredientes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIALOG ELIMINAR -->
    <v-dialog v-model="dlgEliminar" max-width="400">
      <v-card rounded="xl">
        <v-card-text class="pa-6 text-center">
          <v-icon size="48" color="error" class="mb-3">mdi-alert-circle-outline</v-icon>
          <p class="text-subtitle-1 font-weight-bold mb-1">¿Eliminar receta?</p>
          <p class="text-caption text-medium-emphasis">
            <strong>{{ recetaAEliminar?.nombre }}</strong> será eliminada con todos sus ingredientes.
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 justify-end gap-2">
          <v-btn variant="text" @click="dlgEliminar=false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" rounded="lg" :loading="eliminando" @click="eliminarReceta">
            <v-icon start>mdi-trash-can-outline</v-icon>Eliminar
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
import { API_BASE } from '../../utils/constants.js'

const recetas      = ref([])
const articulos    = ref([])
const gruposReceta = ref([])   // grupos únicos de recetas para el combobox
const loading      = ref(false)
const busqueda     = ref('')
const filtroGrupo   = ref('TODOS')
const filtroSubprod = ref('TODOS')

const headers = [
  { title: 'CÓDIGO',    key: 'codigo',          width: 90 },
  { title: 'NOMBRE',    key: 'nombre',          minWidth: 160 },
  { title: 'TIPO',      key: 'subproducto',     width: 120 },
  { title: 'GRUPO',     key: 'grupo_receta',    width: 90 },
  { title: 'UND',       key: 'und',             width: 70 },
  { title: 'ING.',      key: 'num_ingredientes',width: 65, align: 'center' },
  { title: 'COSTO',     key: 'valor',           width: 110, align: 'end' },
  { title: 'P.VENTA',   key: 'precio_venta',    width: 110, align: 'end' },
  { title: '% COSTO',   key: 'porcentaje_costo',width: 90, align: 'center' },
  { title: '',          key: 'acciones',        width: 110, sortable: false },
]

// Dialog receta
const dlgReceta  = ref(false)
const editando   = ref(false)
const guardando  = ref(false)
const errCodigo  = ref('')
const errNombre  = ref('')
const form       = ref(formVacio())

function formVacio() {
  return { codigo: '', nombre: '', grupo_receta: '', und: '', precio_venta: 0, es_subproducto: false }
}

// Dialog ingredientes
const dlgIng              = ref(false)
const recetaActual        = ref(null)
const ingredientes        = ref([])
const guardandoIng        = ref(false)
const ingNuevo            = ref({ cantidad: 1 })
const tipoIngredienteNuevo = ref('ARTICULO')  // ARTICULO o RECETA
const articuloSeleccionado = ref(null)   // objeto completo del articulo elegido
const recetaSeleccionada  = ref(null)    // objeto completo de la subreceta elegida
const subrecetas          = ref([])      // lista de subrecetas disponibles

// Dialog eliminar
const dlgEliminar     = ref(false)
const recetaAEliminar = ref(null)
const eliminando      = ref(false)

const snack = ref({ show: false, msg: '', color: 'success' })
function ok(msg)  { snack.value = { show: true, msg, color: 'success' } }
function err(msg) { snack.value = { show: true, msg, color: 'error' } }

// Computed
const gruposFilter = computed(() => [
  { label: 'Todos los grupos', val: 'TODOS' },
  ...gruposReceta.value.map(g => ({ label: g.nombre, val: g.codigo }))
])

const recetasFiltradas = computed(() => {
  let r = recetas.value
  if (filtroGrupo.value !== 'TODOS') r = r.filter(x => x.grupo_receta === filtroGrupo.value)
  if (filtroSubprod.value !== 'TODOS') r = r.filter(x => (x.subproducto || 'NO') === filtroSubprod.value)
  return r
})

const kpis = computed(() => [
  { label: 'Total',        val: recetas.value.length },
  { label: 'Recetas',      val: recetas.value.filter(r => r.subproducto !== 'SI').length },
  { label: 'Subproductos', val: recetas.value.filter(r => r.subproducto === 'SI').length },
  { label: 'Sin ingred.',  val: recetas.value.filter(r => +r.num_ingredientes === 0).length },
])

const costoTotal = computed(() =>
  ingredientes.value.reduce((s, i) => s + (parseFloat(i.precio_unit)||0) * (parseFloat(i.cantidad)||0), 0)
)
const pctCosto = computed(() => {
  const pv = parseFloat(recetaActual.value?.precio_venta) || 0
  return pv > 0 ? (costoTotal.value / pv * 100) : 0
})

// Métodos
async function cargarRecetas() {
  loading.value = true
  try {
    const [rr, rg] = await Promise.all([
      fetch(`${API_BASE}/recetas`).then(r => r.json()),
      fetch(`${API_BASE}/recetas/grupos`).then(r => r.json()),
    ])
    recetas.value      = rr.data || []
    gruposReceta.value = rg.data || []
  } catch { err('Error al cargar recetas') }
  finally { loading.value = false }
}

async function cargarArticulos() {
  try {
    const [ra, rs] = await Promise.all([
      fetch(`${API_BASE}/articulos`).then(r => r.json()),
      fetch(`${API_BASE}/recetas/para-selector`).then(r => r.json()),
    ])
    articulos.value = ra.data || []
    subrecetas.value = rs.data || []
  } catch { /* silencioso */ }
}

function abrirNuevaReceta() {
  editando.value = false
  form.value = formVacio()
  errCodigo.value = ''; errNombre.value = ''
  dlgReceta.value = true
}

function abrirEditar(receta) {
  editando.value = true
  form.value = {
    codigo:       receta.codigo,
    nombre:       receta.nombre,
    grupo_receta: receta.grupo_receta,
    und:          receta.und,
    precio_venta: receta.precio_venta,
    es_subproducto: receta.subproducto === 'SI',
  }
  errCodigo.value = ''; errNombre.value = ''
  dlgReceta.value = true
}

async function guardarReceta() {
  errCodigo.value = ''; errNombre.value = ''
  if (!form.value.codigo?.trim()) { errCodigo.value = 'Requerido'; return }
  if (!form.value.nombre?.trim()) { errNombre.value = 'Requerido'; return }
  guardando.value = true
  try {
    const payload = {
      codigo:       form.value.codigo.trim(),
      nombre:       form.value.nombre.trim(),
      grupo_receta: form.value.grupo_receta || null,
      und:          form.value.und || null,
      precio_venta: parseFloat(form.value.precio_venta) || 0,
      subproducto:  form.value.es_subproducto ? 'SI' : 'NO',
    }
    const url    = editando.value ? `${API_BASE}/recetas/${payload.codigo}` : `${API_BASE}/recetas`
    const method = editando.value ? 'PUT' : 'POST'
    const r = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    ok(editando.value ? 'Receta actualizada' : 'Receta creada')
    dlgReceta.value = false
    await cargarRecetas(); await cargarArticulos()
  } catch (e) { err(e.message) }
  finally { guardando.value = false }
}

async function abrirIngredientes(receta) {
  recetaActual.value     = receta
  ingredientes.value     = []
  ingNuevo.value         = { cantidad: 1 }
  tipoIngredienteNuevo.value = 'ARTICULO'
  articuloSeleccionado.value = null
  recetaSeleccionada.value = null
  dlgIng.value = true
  try {
    const r = await fetch(`${API_BASE}/recetas/${receta.codigo}`)
    const j = await r.json()
    if (j.success) {
      ingredientes.value = (j.data.ingredientes || [])
        .map(i => ({
          ...i,
          cantidad:    parseFloat(i.cantidad) || 0,
          precio_unit: parseFloat(i.precio_unit) || 0,
          tipo:        i.tipo || 'ARTICULO',
        }))
        .sort((a, b) => (a.nombre_item || '').localeCompare(b.nombre_item || '', 'es'))
    }
  } catch { err('Error al cargar ingredientes') }
}

function agregarIngrediente() {
  let item, tipo

  if (tipoIngredienteNuevo.value === 'ARTICULO') {
    item = articuloSeleccionado.value
    if (!item) { err('Selecciona un artículo de la lista'); return }
    tipo = 'ARTICULO'
  } else {
    item = recetaSeleccionada.value
    if (!item) { err('Selecciona una subreceta de la lista'); return }
    tipo = 'RECETA'
  }

  if (ingredientes.value.find(i => i.articulo === item.codigo && i.tipo === tipo)) {
    err('Este ingrediente ya está en la receta'); return
  }

  ingredientes.value.push({
    articulo:        item.codigo,
    nombre_item:     item.nombre,
    cantidad:        parseFloat(ingNuevo.value.cantidad) || 1,
    und:             item.und || '',
    precio_unit:     parseFloat(item.valor) || 0,
    tipo:            tipo,
  })
  ingredientes.value.sort((a, b) => (a.nombre_item || '').localeCompare(b.nombre_item || '', 'es'))
  articuloSeleccionado.value = null
  recetaSeleccionada.value = null
  tipoIngredienteNuevo.value = 'ARTICULO'
  ingNuevo.value = { cantidad: 1 }
}

function quitarIngrediente(idx) { ingredientes.value.splice(idx, 1) }
function recalcSubtotal(ing) { ing.cantidad = parseFloat(ing.cantidad) || 0 }

async function guardarIngredientes() {
  guardandoIng.value = true
  try {
    const payload = ingredientes.value.map(i => ({
      articulo:    i.articulo,
      cantidad:    parseFloat(i.cantidad) || 0,
      precio_unit: parseFloat(i.precio_unit) || 0,
      tipo:        i.tipo || 'ARTICULO',
    }))
    const r = await fetch(`${API_BASE}/recetas/${recetaActual.value.codigo}/ingredientes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredientes: payload })
    })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    // Recalcular costo automáticamente (ahora con lógica recursiva)
    await fetch(`${API_BASE}/recetas/${recetaActual.value.codigo}/calcular-costo`, { method: 'POST' })
    ok('Ingredientes guardados y costo actualizado')
    dlgIng.value = false
    await cargarRecetas()
  } catch (e) { err(e.message) }
  finally { guardandoIng.value = false }
}

function confirmarEliminar(receta) {
  recetaAEliminar.value = receta; dlgEliminar.value = true
}

async function eliminarReceta() {
  eliminando.value = true
  try {
    const r = await fetch(`${API_BASE}/recetas/${recetaAEliminar.value.codigo}`, { method: 'DELETE' })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    ok('Receta eliminada'); dlgEliminar.value = false
    await cargarRecetas(); await cargarArticulos()
  } catch (e) { err(e.message) }
  finally { eliminando.value = false }
}

function fmt(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function colorPct(pct) {
  const p = parseFloat(pct) || 0
  return p <= 30 ? 'green' : p <= 45 ? 'warning' : 'error'
}
function colorPctStr(pct) {
  const p = parseFloat(pct) || 0
  return p <= 30 ? '#22c55e' : p <= 45 ? '#f59e0b' : '#ef4444'
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
.rc-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.rc-header-left { display: flex; align-items: center; gap: 16px; }
.rc-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#f59e0b,#d97706); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(245,158,11,0.35); }
.rc-title { font-size: 20px; font-weight: 800; margin: 0; }
.rc-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 2px 0 0; }
.rc-filters { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
.rc-kpi-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.rc-kpi { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 12px; padding: 12px 20px; display: flex; flex-direction: column; align-items: center; min-width: 110px; }
.kpi-val { font-size: 22px; font-weight: 800; color: #f59e0b; }
.kpi-lbl { font-size: 11px; color: rgba(var(--v-theme-on-surface),.5); text-align: center; }
.rc-table-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 16px; overflow: hidden; }
.font-mono { font-family: monospace; }
.dlg-icon-wrap { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg,#f59e0b,#d97706); display: flex; align-items: center; justify-content: center; }
.info-box { background: rgba(245,158,11,.08); border: 1px solid rgba(245,158,11,.25); border-radius: 8px; padding: 10px 12px; font-size: 12px; display: flex; align-items: flex-start; gap: 6px; color: rgba(var(--v-theme-on-surface),.7); }
.add-ing-group { display: flex; flex-direction: column; gap: 12px; }
.type-selector { display: flex; align-items: center; }
.btn-type { font-size: 12px; }
.add-ing-row { display: flex; gap: 8px; align-items: flex-start; flex-wrap: wrap; }
.ing-table { border: 1px solid rgba(var(--v-theme-on-surface),.1); border-radius: 12px; overflow: hidden; }
.ing-header { display: grid; grid-template-columns: 1fr 70px 80px 60px 100px 100px 32px; padding: 8px 12px; background: rgba(var(--v-theme-on-surface),.04); font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface),.5); text-transform: uppercase; letter-spacing: .5px; }
.ing-row { display: grid; grid-template-columns: 1fr 70px 80px 60px 100px 100px 32px; padding: 5px 12px; border-top: 1px solid rgba(var(--v-theme-on-surface),.06); align-items: center; font-size: 13px; }
.ing-subreceta { background: rgba(139,92,246,.04); }
.ing-nombre { display: flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ing-empty { padding: 24px; text-align: center; color: rgba(var(--v-theme-on-surface),.4); font-size: 13px; }
.cant-input :deep(.v-field__input) { padding: 2px 4px; font-size: 13px; }
.subtotal-col { color: rgba(var(--v-theme-on-surface),.8); }
.ing-total-row { display: grid; grid-template-columns: 1fr 70px 80px 60px 100px 100px 32px; padding: 8px 12px; border-top: 2px solid rgba(var(--v-theme-on-surface),.12); background: rgba(var(--v-theme-on-surface),.03); font-size: 13px; align-items: center; }
.total-val { color: #f59e0b; font-size: 15px; }
.costo-resumen { display: flex; gap: 0; border: 1px solid rgba(var(--v-theme-on-surface),.1); border-radius: 12px; overflow: hidden; }
.cr-item { flex: 1; padding: 12px 16px; text-align: center; border-right: 1px solid rgba(var(--v-theme-on-surface),.08); }
.cr-item:last-child { border-right: none; }
.cr-lbl { display: block; font-size: 11px; color: rgba(var(--v-theme-on-surface),.5); margin-bottom: 4px; text-transform: uppercase; letter-spacing: .5px; }
.cr-val { font-size: 15px; font-weight: 700; font-family: monospace; }
</style>
