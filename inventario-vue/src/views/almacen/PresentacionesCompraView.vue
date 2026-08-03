<template>
  <MainLayout>
    <div class="pg-container">

      <PageHeader
        title="Presentaciones de Compra"
        description="Guarda cómo viene empacado un producto o artículo (paquete, frasco, bulto...) para no convertir de cabeza al registrar una entrada de almacén"
        :crumbs="['Almacén', 'Configuración', 'Presentaciones de Compra']"
      >
        <template #actions>
          <v-btn color="var(--success)" variant="flat" prepend-icon="mdi-plus" @click="abrirModal()">
            Nueva Presentación
          </v-btn>
        </template>
      </PageHeader>

      <!-- BUSCADOR + CONTADOR -->
      <div class="toolbar">
        <div class="search-wrap">
          <v-icon size="17" color="rgba(var(--v-theme-on-surface),.4)">mdi-magnify</v-icon>
          <input v-model="busqueda" type="text" placeholder="Buscar por producto o artículo..." class="search-input" />
        </div>
        <span class="count-badge">{{ filasFiltradas.length }} presentaciones</span>
      </div>

      <!-- TABLA -->
      <div class="tabla-card">
        <div v-if="loading" class="loading-wrap">
          <v-progress-circular indeterminate color="var(--success)" size="36" />
        </div>
        <table v-else class="crud-table">
          <thead>
            <tr>
              <th>PRODUCTO / ARTÍCULO</th>
              <th class="col-center">ORIGEN</th>
              <th>PRESENTACIÓN</th>
              <th class="col-center">CONTENIDO</th>
              <th class="col-acc">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filasFiltradas.length === 0">
              <td colspan="5" class="empty-row">
                <v-icon size="40" color="rgba(var(--v-theme-on-surface),.15)">mdi-package-variant-closed</v-icon>
                <p>No hay presentaciones registradas</p>
              </td>
            </tr>
            <tr v-for="p in filasFiltradas" :key="p.id" class="data-row">
              <td class="nombre-cell">{{ p.item_nombre }} <span class="text-dim">({{ p.codigo }})</span></td>
              <td class="col-center">
                <span class="origen-chip" :class="p.origen === 'ARTICULO' ? 'chip-articulo' : 'chip-producto'">
                  {{ p.origen === 'ARTICULO' ? 'Artículo' : 'Producto' }}
                </span>
              </td>
              <td>{{ p.nombre_presentacion }}</td>
              <td class="col-center tabular">{{ formatNum(p.contenido) }} {{ p.item_und }}</td>
              <td class="col-acc">
                <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" color="primary" @click="abrirModal(p)" />
                <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" :loading="eliminando === p.id" @click="eliminar(p)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MODAL CREAR / EDITAR -->
      <v-dialog v-model="modal" max-width="460">
        <v-card class="modal-card">
          <div class="modal-header">
            <v-icon color="var(--success)" class="mr-2">mdi-package-variant-closed</v-icon>
            <span>{{ editando ? 'Editar Presentación' : 'Nueva Presentación' }}</span>
            <v-spacer />
            <v-btn icon="mdi-close" size="small" variant="text" @click="modal = false" />
          </div>
          <div class="modal-body">
            <!-- PRODUCTO / ARTÍCULO -->
            <div class="field-group">
              <label class="field-label">Producto / Artículo *</label>
              <v-autocomplete
                v-model="form.key"
                :items="itemsOptions"
                :loading="itemsLoading"
                item-title="nombre"
                item-value="key"
                :custom-filter="filtroItem"
                variant="outlined"
                density="comfortable"
                hide-details
                autocomplete="off"
                :disabled="editando"
                placeholder="Escribe para buscar..."
                no-data-text="Sin productos ni artículos"
              >
                <template #item="{ item: it, props: p }">
                  <v-list-item v-bind="p">
                    <template #append>
                      <span class="item-meta">
                        <span class="origen-tag" :class="it.raw.origen === 'ARTICULO' ? 'tag-art' : 'tag-prod'">
                          {{ it.raw.origen === 'ARTICULO' ? 'ARTÍCULO' : 'PRODUCTO' }}
                        </span>
                        {{ it.raw.codigo }} · {{ it.raw.und }}
                      </span>
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>
              <span v-if="errores.key" class="error-txt">{{ errores.key }}</span>
              <span v-if="editando" class="hint-txt">
                {{ itemSeleccionadoInfo }}
              </span>
            </div>
            <!-- NOMBRE PRESENTACIÓN -->
            <div class="field-group">
              <label class="field-label">Nombre de la presentación *</label>
              <input
                v-model="form.nombre_presentacion"
                type="text"
                maxlength="60"
                placeholder="Ej: Paquete, Frasco, Bulto..."
                class="field-input"
                :class="{ 'field-error': errores.nombre_presentacion }"
                @input="form.nombre_presentacion = form.nombre_presentacion.toUpperCase()"
              />
              <span v-if="errores.nombre_presentacion" class="error-txt">{{ errores.nombre_presentacion }}</span>
            </div>
            <!-- CONTENIDO -->
            <div class="field-group">
              <label class="field-label">Contenido ({{ unidadDelItemSeleccionado || 'unidad del ítem' }}) *</label>
              <input
                v-model="form.contenido"
                type="number"
                min="0"
                step="0.0001"
                placeholder="Ej: 3.2"
                class="field-input"
                :class="{ 'field-error': errores.contenido }"
              />
              <span v-if="errores.contenido" class="error-txt">{{ errores.contenido }}</span>
              <span v-else class="hint-txt">
                Cuánto trae UNA de estas presentaciones, en la unidad con la que se maneja el ítem en el sistema.
              </span>
            </div>
            <div v-if="msgError" class="api-error">{{ msgError }}</div>
          </div>
          <div class="modal-footer">
            <v-btn variant="text" @click="modal = false">Cancelar</v-btn>
            <v-btn color="var(--success)" variant="flat" :loading="guardando" @click="guardar">
              {{ editando ? 'Guardar Cambios' : 'Crear Presentación' }}
            </v-btn>
          </div>
        </v-card>
      </v-dialog>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { presentacionesCompraService } from '../../services/presentaciones-compra.service'

const auth = useAuthStore()
const empresa = computed(() => auth.empresa)

const presentaciones = ref([])
const itemsOptions   = ref([])
const busqueda   = ref('')
const loading    = ref(false)
const itemsLoading = ref(false)
const guardando  = ref(false)
const eliminando = ref(null)
const modal      = ref(false)
const editando   = ref(false)
const msgError   = ref('')
const form       = ref({ id: null, key: '', nombre_presentacion: '', contenido: '' })
const errores    = ref({})

const filasFiltradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q) return presentaciones.value
  return presentaciones.value.filter(p =>
    p.item_nombre.toLowerCase().includes(q) ||
    String(p.codigo).toLowerCase().includes(q) ||
    p.nombre_presentacion.toLowerCase().includes(q)
  )
})

const unidadDelItemSeleccionado = computed(() =>
  itemsOptions.value.find(o => o.key === form.value.key)?.und || ''
)
const itemSeleccionadoInfo = computed(() => {
  const it = itemsOptions.value.find(o => o.key === form.value.key)
  return it ? `${it.codigo} · ${it.und}` : ''
})

function filtroItem(_value, query, item) {
  const q = query.toLowerCase()
  if (!q) return true
  const nombre = (item?.raw?.nombre || '').toLowerCase()
  const codigo = String(item?.raw?.codigo || '').toLowerCase()
  return q.split(/\s+/).filter(Boolean).every(p => nombre.includes(p) || codigo.includes(p))
}

function formatNum(n) {
  const v = parseFloat(n)
  if (isNaN(v)) return '—'
  return v.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
}

async function cargar() {
  loading.value = true
  try {
    const r = await presentacionesCompraService.getPresentaciones()
    presentaciones.value = r.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function cargarItems() {
  if (itemsOptions.value.length || itemsLoading.value) return
  itemsLoading.value = true
  try {
    const [resProd, resArt] = await Promise.all([
      api.get('/almacen/productos', { params: { empresa: empresa.value } }),
      api.get('/articulos'),
    ])
    const productos = (resProd.data?.data || [])
      .filter(p => p.control === 'SI')
      .map(p => ({
        key: `PRODUCTO::${p.codigo}`,
        codigo: p.codigo,
        origen: 'PRODUCTO',
        nombre: p.nombre,
        und: p.und || '',
      }))
    const articulos = (resArt.data?.data || []).map(a => ({
      key: `ARTICULO::${a.codigo}`,
      codigo: a.codigo,
      origen: 'ARTICULO',
      nombre: a.nombre,
      und: a.und || '',
    }))
    itemsOptions.value = [...productos, ...articulos]
  } catch (e) {
    console.error('cargarItems:', e)
  } finally {
    itemsLoading.value = false
  }
}

function abrirModal(p = null) {
  errores.value = {}
  msgError.value = ''
  editando.value = !!p
  if (p) {
    form.value = {
      id: p.id,
      key: `${p.origen}::${p.codigo}`,
      nombre_presentacion: p.nombre_presentacion,
      contenido: p.contenido,
    }
    // Asegura que el ítem editado aparezca seleccionable aunque ya no cargó la lista
    if (!itemsOptions.value.some(o => o.key === form.value.key)) {
      itemsOptions.value.push({ key: form.value.key, codigo: p.codigo, origen: p.origen, nombre: p.item_nombre, und: p.item_und })
    }
  } else {
    form.value = { id: null, key: '', nombre_presentacion: '', contenido: '' }
  }
  modal.value = true
  cargarItems()
}

function validar() {
  const e = {}
  if (!form.value.key) e.key = 'Selecciona un producto o artículo'
  if (!form.value.nombre_presentacion.trim()) e.nombre_presentacion = 'Requerido'
  const cont = parseFloat(form.value.contenido)
  if (!(cont > 0)) e.contenido = 'Debe ser mayor a 0'
  errores.value = e
  return Object.keys(e).length === 0
}

async function guardar() {
  if (!validar()) return
  guardando.value = true
  msgError.value = ''
  try {
    if (editando.value) {
      const r = await presentacionesCompraService.actualizar(form.value.id, {
        nombre_presentacion: form.value.nombre_presentacion,
        contenido: parseFloat(form.value.contenido),
      })
      const idx = presentaciones.value.findIndex(p => p.id === form.value.id)
      if (idx >= 0) presentaciones.value[idx] = { ...presentaciones.value[idx], ...r.data }
    } else {
      const [origen, codigo] = form.value.key.split('::')
      const r = await presentacionesCompraService.crear({
        origen, codigo,
        nombre_presentacion: form.value.nombre_presentacion,
        contenido: parseFloat(form.value.contenido),
      })
      const it = itemsOptions.value.find(o => o.key === form.value.key)
      presentaciones.value.push({ ...r.data, item_nombre: it?.nombre || codigo, item_und: it?.und || '' })
    }
    modal.value = false
  } catch (e) {
    msgError.value = e?.response?.data?.error || e.message
  } finally {
    guardando.value = false
  }
}

async function eliminar(p) {
  if (!confirm(`¿Eliminar la presentación "${p.nombre_presentacion}" de ${p.item_nombre}?`)) return
  eliminando.value = p.id
  try {
    await presentacionesCompraService.eliminar(p.id)
    presentaciones.value = presentaciones.value.filter(x => x.id !== p.id)
  } catch (e) {
    alert(e?.response?.data?.error || e.message)
  } finally {
    eliminando.value = null
  }
}

onMounted(cargar)
</script>

<style scoped>
.pg-container { padding: 24px; max-width: 1000px; margin: 0 auto; }

.toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.search-wrap { display: flex; align-items: center; gap: 8px; flex: 1; padding: 8px 12px; background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.1); border-radius: 8px; }
.search-input { flex: 1; border: none; background: transparent; outline: none; font-size: 13px; color: rgb(var(--v-theme-on-surface)); }
.search-input::placeholder { color: rgba(var(--v-theme-on-surface),.35); }
.count-badge { font-size: 12px; font-weight: 600; color: rgba(var(--v-theme-on-surface),.45); white-space: nowrap; }

.tabla-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 12px; overflow: hidden; }
.loading-wrap { display: flex; justify-content: center; padding: 40px; }
.crud-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.crud-table thead th { padding: 11px 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.45); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); text-align: left; }
.col-center { text-align: center !important; }
.col-acc { width: 100px; text-align: center !important; white-space: nowrap; }
.data-row td { padding: 10px 14px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); color: rgb(var(--v-theme-on-surface)); }
.data-row:last-child td { border-bottom: none; }
.data-row:hover td { background: rgba(var(--v-theme-on-surface),.02); }
.nombre-cell { font-weight: 500; }
.text-dim { color: rgba(var(--v-theme-on-surface),.45); font-weight: 400; }
.tabular { font-variant-numeric: tabular-nums; }
.empty-row { text-align: center !important; padding: 48px !important; color: rgba(var(--v-theme-on-surface),.35); }
.empty-row p { margin: 10px 0 0; font-size: 13px; }

.origen-chip { padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.chip-producto { background: var(--indigo-wash); color: var(--indigo); }
.chip-articulo { background: var(--gold-wash); color: var(--gold); }

/* Autocomplete item meta (modal) */
.item-meta { display: flex; align-items: center; gap: 6px; font-size: 11px; color: rgba(var(--v-theme-on-surface),.45); }
.origen-tag { font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 4px; letter-spacing: .3px; }
.tag-prod { background: var(--indigo-wash); color: var(--indigo); }
.tag-art  { background: var(--gold-wash); color: var(--gold); }

/* Modal */
.modal-card { border-radius: 14px !important; overflow: hidden; }
.modal-header { display: flex; align-items: center; padding: 16px 20px; background: rgba(var(--v-theme-on-surface),.03); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); font-weight: 700; font-size: 15px; }
.modal-body { padding: 20px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid rgba(var(--v-theme-on-surface),.07); }

.field-group { margin-bottom: 16px; }
.field-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.5); margin-bottom: 6px; }
.field-input { width: 100%; padding: 9px 12px; border: 1px solid rgba(var(--v-theme-on-surface),.15); border-radius: 8px; font-size: 13px; background: rgba(var(--v-theme-on-surface),.03); color: rgb(var(--v-theme-on-surface)); outline: none; transition: border-color 180ms var(--ease-out); box-sizing: border-box; }
.field-input:focus { border-color: var(--success); }
.field-input.field-error { border-color: var(--error); }
.error-txt { font-size: 11px; color: var(--error); margin-top: 3px; display: block; }
.hint-txt { font-size: 11px; color: rgba(var(--v-theme-on-surface),.4); margin-top: 3px; display: block; }
.api-error { background: var(--error-wash); border: 1px solid var(--error-wash); border-radius: 8px; padding: 10px 14px; font-size: 12px; color: var(--error); margin-top: 8px; }
</style>
