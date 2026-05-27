<template>
  <MainLayout>
    <div class="ra-container">

      <!-- BREADCRUMB -->
      <div class="ra-breadcrumb">
        <span class="bc-root">RECETAS</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Configuración</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Artículos e Insumos</span>
      </div>

      <!-- HEADER -->
      <div class="ra-header">
        <div class="ra-header-left">
          <div class="ra-icon-wrap"><v-icon size="22" color="white">mdi-food-apple-outline</v-icon></div>
          <div>
            <h1 class="ra-title">ARTÍCULOS E INSUMOS</h1>
            <p class="ra-sub">Gestiona los ingredientes y sus precios de compra</p>
          </div>
        </div>
        <v-btn color="#f59e0b" variant="flat" rounded="lg" @click="abrirNuevo">
          <v-icon start>mdi-plus</v-icon> Nuevo Artículo
        </v-btn>
      </div>

      <!-- ALERTA INFO -->
      <v-alert type="info" variant="tonal" density="compact" class="mb-4" icon="mdi-lightbulb-outline">
        Los precios ingresados aquí son los precios de <strong>compra/costo</strong> por unidad.
        Estos precios se usan para calcular el costo de las recetas.
        Las <strong>subrecetas</strong> actualizan su precio automáticamente al recalcular costos.
      </v-alert>

      <!-- FILTROS -->
      <div class="ra-filters">
        <v-text-field
          v-model="busqueda"
          placeholder="Buscar artículo..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined" density="compact" hide-details clearable
          style="max-width:320px"
        />
        <v-select
          v-model="filtroGrupo"
          :items="filtroItems"
          item-title="label"
          item-value="val"
          variant="outlined" density="compact" hide-details
          style="max-width:240px"
        />
      </div>

      <!-- TABLA -->
      <div class="ra-table-card">
        <v-progress-linear v-if="loading" indeterminate color="#f59e0b" height="3" />

        <!-- Vista AGRUPADA (Todos los grupos) -->
        <v-table v-if="filtroGrupo === 'TODOS'" density="compact" class="ra-table">
          <thead>
            <tr>
              <th style="width:100px">CÓDIGO</th>
              <th>NOMBRE</th>
              <th style="width:80px">UND</th>
              <th style="width:120px;text-align:center">SUBRECETA</th>
              <th style="width:150px;text-align:right">PRECIO COMPRA</th>
              <th style="width:90px"></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="group in articulosAgrupados" :key="group.nombre">
              <!-- Cabecera de grupo -->
              <tr class="group-header-tr">
                <td colspan="6">
                  <div class="d-flex align-center gap-2">
                    <v-icon size="14" color="#d97706">mdi-tag-outline</v-icon>
                    <span class="group-nombre">{{ group.nombre }}</span>
                    <v-chip size="x-small" color="#f59e0b" variant="tonal" class="ml-1">
                      {{ group.items.length }}
                    </v-chip>
                  </div>
                </td>
              </tr>
              <!-- Filas del grupo -->
              <tr v-for="item in group.items" :key="item.codigo" class="ra-row">
                <td class="text-caption text-medium-emphasis">{{ item.codigo }}</td>
                <td class="font-weight-medium">{{ item.nombre }}</td>
                <td class="text-caption text-medium-emphasis">{{ item.und }}</td>
                <td style="text-align:center">
                  <v-chip v-if="item.es_subreceta" size="x-small" color="purple" variant="tonal">
                    <v-icon start size="10">mdi-chef-hat</v-icon>Subreceta
                  </v-chip>
                </td>
                <td style="text-align:right">
                  <div class="d-flex align-center justify-end gap-1">
                    <span class="font-mono">{{ fmt(item.valor) }}</span>
                    <v-btn icon size="x-small" variant="text" color="#f59e0b"
                      @click.stop="editarPrecio(item)">
                      <v-icon size="13">mdi-pencil-outline</v-icon>
                    </v-btn>
                  </div>
                </td>
                <td>
                  <div class="d-flex gap-1 justify-end">
                    <v-btn icon size="x-small" variant="tonal" color="blue"
                      @click.stop="abrirEditar(item)">
                      <v-icon size="15">mdi-pencil-outline</v-icon>
                    </v-btn>
                    <v-btn icon size="x-small" variant="tonal" color="error"
                      :disabled="item.es_subreceta"
                      @click.stop="confirmarEliminar(item)">
                      <v-icon size="15">mdi-trash-can-outline</v-icon>
                    </v-btn>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="articulosAgrupados.length === 0">
              <td colspan="6" class="text-center py-8 text-medium-emphasis">
                <v-icon size="36" class="mb-2 d-block">mdi-magnify-remove-outline</v-icon>
                Sin resultados
              </td>
            </tr>
          </tbody>
        </v-table>

        <!-- Vista FILTRADA (un grupo específico) -->
        <v-data-table
          v-else
          :headers="headers"
          :items="articulosFiltrados"
          :search="busqueda"
          density="compact"
          hover
          :items-per-page="25"
          class="ra-table"
        >
          <template #item.valor="{ item }">
            <div class="d-flex align-center justify-end gap-1">
              <span class="font-mono">{{ fmt(item.valor) }}</span>
              <v-btn icon size="x-small" variant="text" color="#f59e0b"
                @click="editarPrecio(item)">
                <v-icon size="14">mdi-pencil-outline</v-icon>
              </v-btn>
            </div>
          </template>

          <template #item.es_subreceta="{ item }">
            <v-chip v-if="item.es_subreceta" size="x-small" color="purple" variant="tonal">
              <v-icon start size="10">mdi-chef-hat</v-icon>Subreceta
            </v-chip>
          </template>

          <template #item.acciones="{ item }">
            <div class="d-flex gap-1 justify-end">
              <v-btn icon size="x-small" variant="tonal" color="blue"
                @click="abrirEditar(item)">
                <v-icon size="16">mdi-pencil-outline</v-icon>
              </v-btn>
              <v-btn icon size="x-small" variant="tonal" color="error"
                :disabled="item.es_subreceta"
                @click="confirmarEliminar(item)">
                <v-icon size="16">mdi-trash-can-outline</v-icon>
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </div>
    </div>

    <!-- ══════════ DIALOG NUEVO / EDITAR ══════════ -->
    <v-dialog v-model="dlg" max-width="480" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center gap-3 pa-5 pb-3">
          <div class="dlg-icon-wrap"><v-icon size="18" color="white">mdi-food-apple-outline</v-icon></div>
          {{ editando ? 'Editar Artículo' : 'Nuevo Artículo' }}
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
            <v-col cols="4">
              <v-text-field v-model="form.und" label="Unidad" variant="outlined"
                density="compact" hide-details />
            </v-col>
            <v-col cols="4">
              <v-text-field v-model="form.valor" label="Precio Compra" type="number"
                min="0" variant="outlined" density="compact" hide-details prefix="$" />
            </v-col>
            <v-col cols="4">
              <v-select
                v-model="form.grupo"
                :items="grupos"
                item-title="nombre"
                item-value="codigo"
                label="Grupo"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                placeholder="Sin grupo"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4 justify-end gap-2">
          <v-btn variant="text" @click="dlg=false">Cancelar</v-btn>
          <v-btn color="#f59e0b" variant="flat" rounded="lg" :loading="guardando" @click="guardar">
            <v-icon start>mdi-content-save-outline</v-icon>
            {{ editando ? 'Guardar' : 'Crear' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ══════════ DIALOG PRECIO RÁPIDO ══════════ -->
    <v-dialog v-model="dlgPrecio" max-width="360" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center gap-3 pa-5 pb-3">
          <div class="dlg-icon-wrap"><v-icon size="18" color="white">mdi-cash-edit</v-icon></div>
          Actualizar Precio
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-5">
          <p class="text-caption text-medium-emphasis mb-3">
            <strong>{{ articuloPrecio?.nombre }}</strong> — {{ articuloPrecio?.und }}
          </p>
          <v-text-field v-model="nuevoPrecio" label="Nuevo precio de compra" type="number"
            min="0" variant="outlined" density="compact" hide-details prefix="$"
            autofocus @keyup.enter="guardarPrecio" />
          <p class="text-caption text-medium-emphasis mt-2">
            Precio actual: <strong>{{ fmt(articuloPrecio?.valor) }}</strong>
          </p>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4 justify-end gap-2">
          <v-btn variant="text" @click="dlgPrecio=false">Cancelar</v-btn>
          <v-btn color="#f59e0b" variant="flat" rounded="lg" :loading="guardandoPrecio" @click="guardarPrecio">
            <v-icon start>mdi-check</v-icon>Actualizar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ══════════ DIALOG ELIMINAR ══════════ -->
    <v-dialog v-model="dlgEliminar" max-width="400">
      <v-card rounded="xl">
        <v-card-text class="pa-6 text-center">
          <v-icon size="48" color="error" class="mb-3">mdi-alert-circle-outline</v-icon>
          <p class="text-subtitle-1 font-weight-bold mb-1">¿Eliminar artículo?</p>
          <p class="text-caption text-medium-emphasis">
            <strong>{{ artAEliminar?.nombre }}</strong> será eliminado permanentemente.
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 justify-end gap-2">
          <v-btn variant="text" @click="dlgEliminar=false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" rounded="lg" :loading="eliminando" @click="eliminar">
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

const articulos   = ref([])
const grupos      = ref([])   // [{ codigo, nombre }] desde grupo_articulos
const loading     = ref(false)
const busqueda    = ref('')
const filtroGrupo = ref('TODOS')

// Headers para la vista filtrada (v-data-table)
const headers = [
  { title: 'CÓDIGO',        key: 'codigo',      width: 100 },
  { title: 'NOMBRE',        key: 'nombre',      minWidth: 180 },
  { title: 'UND',           key: 'und',         width: 80  },
  { title: 'SUBRECETA',     key: 'es_subreceta',width: 120, align: 'center' },
  { title: 'PRECIO COMPRA', key: 'valor',       width: 150, align: 'end' },
  { title: '',              key: 'acciones',    width: 90,  sortable: false, align: 'end' },
]

// ── Computed ──────────────────────────────────────────────────

const articulosConFlag = computed(() =>
  articulos.value.map(a => ({
    ...a,
    es_subreceta: a.prod_propio === 'SI',
  }))
)

// Items del filtro CBB: Todos + grupos reales de grupo_articulos
const filtroItems = computed(() => [
  { label: 'Todos los grupos', val: 'TODOS' },
  ...grupos.value.map(g => ({ label: g.nombre, val: g.codigo })),
])

// Items filtrados por búsqueda + grupo seleccionado
const articulosFiltrados = computed(() => {
  let items = articulosConFlag.value
  const q = busqueda.value?.toLowerCase()
  if (q) items = items.filter(x =>
    x.nombre?.toLowerCase().includes(q) ||
    x.codigo?.toLowerCase().includes(q)
  )
  if (filtroGrupo.value !== 'TODOS') {
    items = items.filter(x => x.grupo === filtroGrupo.value)
  }
  return items
})

// Artículos agrupados por grupo_nombre para la vista "Todos"
const articulosAgrupados = computed(() => {
  const map = {}
  articulosFiltrados.value.forEach(a => {
    const key = a.grupo_nombre || '(Sin grupo)'
    if (!map[key]) map[key] = []
    map[key].push(a)
  })
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b, 'es'))
    .map(([nombre, items]) => ({ nombre, items }))
})

// ── Dialogs ───────────────────────────────────────────────────
const dlg       = ref(false)
const editando  = ref(false)
const guardando = ref(false)
const errNombre = ref('')
const form      = ref(formVacio())

function formVacio() {
  return { codigo: '', nombre: '', und: 'UND', valor: 0, grupo: null }
}

const dlgPrecio       = ref(false)
const articuloPrecio  = ref(null)
const nuevoPrecio     = ref(0)
const guardandoPrecio = ref(false)

const dlgEliminar  = ref(false)
const artAEliminar = ref(null)
const eliminando   = ref(false)

const snack = ref({ show: false, msg: '', color: 'success' })
function ok(msg)  { snack.value = { show: true, msg, color: 'success' } }
function err(msg) { snack.value = { show: true, msg, color: 'error' } }

// ── Carga ─────────────────────────────────────────────────────
async function cargar() {
  loading.value = true
  try {
    const [ra, rg] = await Promise.all([
      fetch(`${API_BASE}/articulos`).then(r => r.json()),
      fetch(`${API_BASE}/articulos/grupos`).then(r => r.json()),
    ])
    articulos.value = ra.data || []
    grupos.value    = rg.data || []
  } catch { err('Error al cargar datos') }
  finally { loading.value = false }
}

// ── CRUD ──────────────────────────────────────────────────────
function abrirNuevo() {
  editando.value  = false
  form.value      = formVacio()
  errNombre.value = ''
  dlg.value       = true
}

function abrirEditar(art) {
  editando.value  = true
  form.value      = {
    codigo: art.codigo,
    nombre: art.nombre,
    und:    art.und   || '',
    valor:  art.valor || 0,
    grupo:  art.grupo || null,
  }
  errNombre.value = ''
  dlg.value       = true
}

async function guardar() {
  errNombre.value = ''
  if (!form.value.nombre?.trim()) { errNombre.value = 'Requerido'; return }
  guardando.value = true
  try {
    const url    = editando.value ? `${API_BASE}/articulos/${form.value.codigo}` : `${API_BASE}/articulos`
    const method = editando.value ? 'PUT' : 'POST'
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value),
    })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    ok(editando.value ? 'Artículo actualizado' : 'Artículo creado')
    dlg.value = false
    await cargar()
  } catch (e) { err(e.message) }
  finally { guardando.value = false }
}

function editarPrecio(art) {
  articuloPrecio.value = art
  nuevoPrecio.value    = art.valor || 0
  dlgPrecio.value      = true
}

async function guardarPrecio() {
  guardandoPrecio.value = true
  try {
    const r = await fetch(`${API_BASE}/articulos/${articuloPrecio.value.codigo}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valor: parseFloat(nuevoPrecio.value) || 0 }),
    })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    ok('Precio actualizado')
    dlgPrecio.value = false
    await cargar()
  } catch (e) { err(e.message) }
  finally { guardandoPrecio.value = false }
}

function confirmarEliminar(art) {
  artAEliminar.value = art
  dlgEliminar.value  = true
}

async function eliminar() {
  eliminando.value = true
  try {
    const r = await fetch(`${API_BASE}/articulos/${artAEliminar.value.codigo}`, { method: 'DELETE' })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    ok('Artículo eliminado')
    dlgEliminar.value = false
    await cargar()
  } catch (e) { err(e.message) }
  finally { eliminando.value = false }
}

function fmt(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(cargar)
</script>

<style scoped>
.ra-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
.ra-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 12px; font-weight: 700; color: #f59e0b; text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.3); }
.bc-cat { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.8); font-weight: 500; }
.ra-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.ra-header-left { display: flex; align-items: center; gap: 16px; }
.ra-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#f59e0b,#d97706); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(245,158,11,.35); }
.ra-title { font-size: 20px; font-weight: 800; margin: 0; }
.ra-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }
.ra-filters { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.ra-table-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 16px; overflow: hidden; }
.font-mono { font-family: monospace; font-size: 13px; }
.dlg-icon-wrap { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg,#f59e0b,#d97706); display: flex; align-items: center; justify-content: center; }

/* ── Tabla agrupada ── */
.ra-table thead th {
  font-size: 11px !important;
  font-weight: 700 !important;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: rgba(var(--v-theme-on-surface),.5) !important;
  background: rgb(var(--v-theme-surface)) !important;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08) !important;
  padding: 10px 16px !important;
}
.group-header-tr td {
  background: rgba(245,158,11,.07) !important;
  border-top: 2px solid rgba(245,158,11,.2) !important;
  border-bottom: 1px solid rgba(245,158,11,.12) !important;
  padding: 6px 16px !important;
}
.group-nombre {
  font-size: 12px;
  font-weight: 700;
  color: #d97706;
  text-transform: uppercase;
  letter-spacing: .6px;
}
.ra-row td {
  padding: 7px 16px !important;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05) !important;
  font-size: 13px;
}
.ra-row:hover td {
  background: rgba(var(--v-theme-on-surface),.03) !important;
}
.ra-row:last-of-type td {
  border-bottom: none !important;
}
</style>
