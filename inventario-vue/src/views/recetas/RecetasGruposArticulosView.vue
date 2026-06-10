<template>
  <MainLayout>
    <div class="ga-container">

      <!-- BREADCRUMB -->
      <div class="ga-breadcrumb">
        <span class="bc-root">RECETAS</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Configuración</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Grupos de Artículos</span>
      </div>

      <!-- HEADER -->
      <div class="ga-header">
        <div class="ga-header-left">
          <div class="ga-icon-wrap"><v-icon size="22" color="white">mdi-tag-multiple-outline</v-icon></div>
          <div>
            <h1 class="ga-title">GRUPOS DE ARTÍCULOS</h1>
            <p class="ga-sub">Administra las categorías de artículos e insumos</p>
          </div>
        </div>
        <v-btn color="#f59e0b" variant="flat" rounded="lg" @click="abrirNuevo">
          <v-icon start>mdi-plus</v-icon> Nuevo Grupo
        </v-btn>
      </div>

      <!-- BUSCADOR -->
      <div class="ga-filters">
        <v-text-field v-model="busqueda" placeholder="Buscar grupo..." prepend-inner-icon="mdi-magnify"
          variant="outlined" density="compact" hide-details clearable style="max-width:340px" />
        <v-spacer />
        <div class="ga-hint text-caption text-medium-emphasis">
          <v-icon size="14">mdi-information-outline</v-icon>
          Los grupos son compartidos para todas las empresas
        </div>
      </div>

      <!-- TABLA -->
      <div class="ga-card">
        <v-progress-linear v-if="loading" indeterminate color="#f59e0b" height="3" />

        <table class="ga-table">
          <thead>
            <tr>
              <th class="col-cod">CÓDIGO</th>
              <th class="col-nom">NOMBRE</th>
              <th class="col-art">ARTÍCULOS</th>
              <th class="col-acc"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="gruposFiltrados.length === 0 && !loading">
              <td colspan="4" class="text-center pa-8 text-disabled">
                <v-icon size="40" class="d-block mb-2">mdi-tag-off-outline</v-icon>
                No hay grupos{{ busqueda ? ' con ese criterio' : '' }}
              </td>
            </tr>
            <tr v-for="g in gruposFiltrados" :key="g.codigo" class="ga-row">
              <td class="col-cod">
                <span class="cod-chip">{{ g.codigo }}</span>
              </td>
              <td class="col-nom font-weight-medium">{{ g.nombre }}</td>
              <td class="col-art">
                <v-chip v-if="g.num_articulos > 0" size="x-small" color="cyan" variant="tonal">
                  {{ g.num_articulos }} artículo{{ g.num_articulos !== 1 ? 's' : '' }}
                </v-chip>
                <span v-else class="text-caption text-disabled">Vacío</span>
              </td>
              <td class="col-acc">
                <div class="d-flex gap-1 justify-end">
                  <v-btn icon size="x-small" variant="tonal" color="blue" @click="abrirEditar(g)">
                    <v-icon size="15">mdi-pencil-outline</v-icon>
                  </v-btn>
                  <v-btn icon size="x-small" variant="tonal" color="error"
                    :disabled="g.num_articulos > 0"
                    :title="g.num_articulos > 0 ? 'Tiene artículos asociados' : 'Eliminar'"
                    @click="confirmarEliminar(g)">
                    <v-icon size="15">mdi-trash-can-outline</v-icon>
                  </v-btn>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <!-- DIALOG NUEVO / EDITAR -->
    <v-dialog v-model="dlg" max-width="420">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center gap-3 pa-5 pb-3">
          <div class="dlg-icon-wrap"><v-icon size="18" color="white">mdi-tag-multiple-outline</v-icon></div>
          {{ editando ? 'Editar Grupo' : 'Nuevo Grupo' }}
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-5">
          <v-row dense>
            <v-col cols="4">
              <v-text-field v-model="form.codigo" label="Código *" variant="outlined"
                density="compact" hide-details :disabled="editando"
                :error-messages="errCodigo"
                @input="form.codigo = form.codigo.toUpperCase()" />
            </v-col>
            <v-col cols="8">
              <v-text-field v-model="form.nombre" label="Nombre *" variant="outlined"
                density="compact" hide-details :error-messages="errNombre"
                autofocus @keyup.enter="guardar" />
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4 justify-end gap-2">
          <v-btn variant="text" @click="dlg = false">Cancelar</v-btn>
          <v-btn color="#f59e0b" variant="flat" rounded="lg" :loading="guardando" @click="guardar">
            <v-icon start>mdi-content-save-outline</v-icon>
            {{ editando ? 'Guardar' : 'Crear' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIALOG ELIMINAR -->
    <v-dialog v-model="dlgEliminar" max-width="380">
      <v-card rounded="xl">
        <v-card-text class="pa-6 text-center">
          <v-icon size="48" color="error" class="mb-3">mdi-alert-circle-outline</v-icon>
          <p class="text-subtitle-1 font-weight-bold mb-1">¿Eliminar grupo?</p>
          <p class="text-caption text-medium-emphasis">
            <strong>{{ grupoAEliminar?.nombre }}</strong> ({{ grupoAEliminar?.codigo }}) será eliminado.
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 justify-end gap-2">
          <v-btn variant="text" @click="dlgEliminar = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" rounded="lg" :loading="eliminando" @click="eliminar">
            <v-icon start>mdi-trash-can-outline</v-icon>Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom right">
      {{ snack.msg }}
    </v-snackbar>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { API_BASE } from '../../utils/constants.js'

const grupos  = ref([])
const loading = ref(false)
const busqueda = ref('')

const snack = ref({ show: false, msg: '', color: 'success' })
function ok(msg)  { snack.value = { show: true, msg, color: 'success' } }
function err(msg) { snack.value = { show: true, msg, color: 'error'   } }

// ── Carga ──────────────────────────────────────────────────────────────────────
async function cargar() {
  loading.value = true
  try {
    const [rg, ra] = await Promise.all([
      fetch(`${API_BASE}/articulos/grupos`).then(r => r.json()),
      fetch(`${API_BASE}/articulos`).then(r => r.json()),
    ])
    const artList = ra.data || []
    const cuentaMap = {}
    artList.forEach(a => {
      const g = a.grupo || ''
      cuentaMap[g] = (cuentaMap[g] || 0) + 1
    })
    grupos.value = (rg.data || []).map(g => ({
      ...g,
      num_articulos: cuentaMap[g.codigo] || 0,
    }))
  } catch { err('Error al cargar grupos') }
  finally { loading.value = false }
}

const gruposFiltrados = computed(() => {
  if (!busqueda.value.trim()) return grupos.value
  const q = busqueda.value.trim().toLowerCase()
  return grupos.value.filter(g =>
    g.nombre.toLowerCase().includes(q) || g.codigo.toLowerCase().includes(q)
  )
})

// ── CRUD ───────────────────────────────────────────────────────────────────────
const dlg      = ref(false)
const editando = ref(false)
const guardando = ref(false)
const errCodigo = ref('')
const errNombre = ref('')
const form      = ref({ codigo: '', nombre: '' })

function abrirNuevo() {
  editando.value = false
  form.value     = { codigo: '', nombre: '' }
  errCodigo.value = ''
  errNombre.value = ''
  dlg.value      = true
}

function abrirEditar(g) {
  editando.value = true
  form.value     = { codigo: g.codigo, nombre: g.nombre }
  errCodigo.value = ''
  errNombre.value = ''
  dlg.value      = true
}

async function guardar() {
  errCodigo.value = ''
  errNombre.value = ''
  if (!editando.value && !form.value.codigo?.trim()) { errCodigo.value = 'Requerido'; return }
  if (!form.value.nombre?.trim()) { errNombre.value = 'Requerido'; return }
  guardando.value = true
  try {
    const url    = editando.value ? `${API_BASE}/articulos/grupos/${form.value.codigo}` : `${API_BASE}/articulos/grupos`
    const method = editando.value ? 'PUT' : 'POST'
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value),
    })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    ok(editando.value ? 'Grupo actualizado' : 'Grupo creado')
    dlg.value = false
    await cargar()
  } catch (e) { err(e.message) }
  finally { guardando.value = false }
}

const dlgEliminar  = ref(false)
const grupoAEliminar = ref(null)
const eliminando   = ref(false)

function confirmarEliminar(g) {
  grupoAEliminar.value = g
  dlgEliminar.value    = true
}

async function eliminar() {
  eliminando.value = true
  try {
    const r = await fetch(`${API_BASE}/articulos/grupos/${grupoAEliminar.value.codigo}`, { method: 'DELETE' })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    ok('Grupo eliminado')
    dlgEliminar.value = false
    await cargar()
  } catch (e) { err(e.message) }
  finally { eliminando.value = false }
}

onMounted(cargar)
</script>

<style scoped>
.ga-container { padding: 24px; max-width: 900px; margin: 0 auto; }

.ga-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root    { font-size: 12px; font-weight: 700; color: #f59e0b; text-transform: uppercase; }
.bc-sep     { color: rgba(var(--v-theme-on-surface), 0.3); }
.bc-cat     { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.8); font-weight: 500; }

.ga-header      { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.ga-header-left { display: flex; align-items: center; gap: 16px; }
.ga-icon-wrap   { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#f59e0b,#d97706); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(245,158,11,.35); flex-shrink: 0; }
.ga-title  { font-size: 20px; font-weight: 800; margin: 0; }
.ga-sub    { font-size: 13px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }

.ga-filters { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.ga-hint    { display: flex; align-items: center; gap: 4px; }

.ga-card  { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 16px; overflow: hidden; }

.ga-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.ga-table thead tr { background: rgba(var(--v-theme-on-surface),.04); }
.ga-table th {
  padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 700;
  letter-spacing: .04em; color: rgba(var(--v-theme-on-surface),.55);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); white-space: nowrap;
}
.ga-table td { padding: 9px 16px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); vertical-align: middle; }

.col-cod { width: 120px; }
.col-nom { min-width: 220px; }
.col-art { width: 140px; }
.col-acc { width: 90px; text-align: right; }

.ga-row { transition: background .15s; }
.ga-row:hover td { background: rgba(var(--v-theme-on-surface),.03); }
.ga-row:last-child td { border-bottom: none; }

.cod-chip {
  display: inline-block; background: rgba(var(--v-theme-on-surface),.07);
  border-radius: 6px; padding: 2px 8px; font-family: monospace;
  font-size: 12px; font-weight: 700; letter-spacing: .5px;
}

.dlg-icon-wrap { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg,#f59e0b,#d97706); display: flex; align-items: center; justify-content: center; }
</style>
