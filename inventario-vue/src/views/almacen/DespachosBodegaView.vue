<template>
  <MainLayout>
    <div class="db-container">

      <!-- BREADCRUMB -->
      <div class="db-breadcrumb">
        <span class="bc-root">ALMACÉN</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Procesos</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Despachos de Bodega</span>
      </div>

      <!-- HEADER -->
      <div class="db-header">
        <div class="db-header-left">
          <div class="db-icon-wrap"><v-icon size="22" color="white">mdi-truck-delivery-outline</v-icon></div>
          <div>
            <h1 class="db-title">DESPACHOS DE BODEGA</h1>
            <p class="db-sub">Órdenes de traslado con doble verificación por scanner</p>
          </div>
        </div>
        <v-btn color="#047857" variant="flat" rounded="lg" @click="abrirNuevo">
          <v-icon start>mdi-plus</v-icon>Nueva Orden
        </v-btn>
      </div>

      <!-- KPIs -->
      <div class="db-kpi-row">
        <div class="db-kpi" style="--kc:#f59e0b">
          <v-icon size="18" color="#f59e0b">mdi-clock-outline</v-icon>
          <div><div class="kpi-val">{{ despachos.filter(d=>d.estado==='PENDIENTE').length }}</div><div class="kpi-lbl">PENDIENTES</div></div>
        </div>
        <div class="db-kpi" style="--kc:#3b82f6">
          <v-icon size="18" color="#3b82f6">mdi-hand-pointing-right</v-icon>
          <div><div class="kpi-val">{{ despachos.filter(d=>d.estado==='EN_PICKING'||d.estado==='EN_PACKING').length }}</div><div class="kpi-lbl">EN PROCESO</div></div>
        </div>
        <div class="db-kpi" style="--kc:#10b981">
          <v-icon size="18" color="#10b981">mdi-check-circle-outline</v-icon>
          <div><div class="kpi-val">{{ despachos.filter(d=>d.estado==='COMPLETADO').length }}</div><div class="kpi-lbl">COMPLETADOS</div></div>
        </div>
        <div class="db-kpi" style="--kc:#0891b2">
          <v-icon size="18" color="#0891b2">mdi-package-variant-closed</v-icon>
          <div><div class="kpi-val">{{ totalUnidades }}</div><div class="kpi-lbl">UNIDADES HOY</div></div>
        </div>
      </div>

      <!-- FILTROS -->
      <div class="db-filtros">
        <v-text-field
          v-model="filtroFecha"
          type="date"
          label="Fecha"
          density="compact"
          variant="outlined"
          hide-details
          style="max-width:180px"
          @update:model-value="cargar"
        />
        <v-select
          v-model="filtroEstado"
          :items="estadoOpts"
          item-title="label"
          item-value="value"
          label="Estado"
          density="compact"
          variant="outlined"
          hide-details
          style="max-width:180px"
          @update:model-value="cargar"
        />
        <v-select
          v-model="filtroDestino"
          :items="[{codigo:'',nombre:'Todos los destinos'},...ccostos]"
          item-title="nombre"
          item-value="codigo"
          label="CC Destino"
          density="compact"
          variant="outlined"
          hide-details
          style="max-width:220px"
          @update:model-value="cargar"
        />
      </div>

      <!-- TABLA -->
      <div class="db-tabla-wrap">
        <div v-if="loading" class="db-loading">
          <v-progress-circular indeterminate color="#047857" size="36" />
          <span>Cargando despachos...</span>
        </div>
        <table v-else class="db-table">
          <thead>
            <tr>
              <th style="width:60px"># ORD.</th>
              <th style="width:100px">FECHA</th>
              <th>CC DESTINO</th>
              <th style="width:100px;text-align:center">ITEMS</th>
              <th style="width:110px;text-align:center">UNIDADES</th>
              <th style="width:130px;text-align:center">ESTADO</th>
              <th style="width:100px;text-align:center">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!despachosFiltrados.length">
              <td colspan="7" class="db-empty">No hay órdenes para los filtros seleccionados</td>
            </tr>
            <tr v-for="d in despachosFiltrados" :key="d.id" class="db-row">
              <td><span class="badge-id">#{{ d.id }}</span></td>
              <td class="td-fecha">{{ fmtFecha(d.fecha) }}</td>
              <td>
                <div class="td-destino">
                  <v-icon size="14" color="#047857">mdi-store-outline</v-icon>
                  {{ d.cc_destino_nombre || d.cc_destino }}
                </div>
              </td>
              <td class="ta-c">{{ d.total_items }}</td>
              <td class="ta-c">{{ parseFloat(d.total_unidades || 0).toFixed(0) }}</td>
              <td class="ta-c"><span class="estado-chip" :class="`est-${d.estado}`">{{ estadoLabel(d.estado) }}</span></td>
              <td class="ta-c">
                <div class="acc-btns">
                  <v-btn icon size="x-small" variant="text" color="#047857" title="Ver / Editar" @click="abrirDetalle(d)">
                    <v-icon>{{ d.estado === 'PENDIENTE' ? 'mdi-pencil' : 'mdi-eye' }}</v-icon>
                  </v-btn>
                  <v-btn icon size="x-small" variant="text" color="#ef4444" title="Eliminar"
                    v-if="d.estado === 'PENDIENTE'"
                    :loading="eliminando === d.id"
                    @click="eliminar(d)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ═══════════════ DIALOG CREAR / EDITAR ═══════════════ -->
      <v-dialog v-model="dlgForm" max-width="800" scrollable>
        <v-card rounded="lg" class="dlg-card">
          <div class="dlg-header">
            <div class="dlg-header-left">
              <div class="dlg-header-icon"><v-icon color="white" size="20">mdi-truck-delivery-outline</v-icon></div>
              <div>
                <div class="dlg-title">{{ editandoId ? 'Editar Orden #' + editandoId : 'Nueva Orden de Despacho' }}</div>
                <div class="dlg-sub">Bodega principal → Punto de venta</div>
              </div>
            </div>
            <v-btn icon variant="text" color="white" size="small" @click="dlgForm=false"><v-icon>mdi-close</v-icon></v-btn>
          </div>

          <v-card-text class="pa-5" style="max-height:70vh;overflow-y:auto">
            <!-- Cabecera de la orden -->
            <div class="form-sheet mb-4">
              <div class="sheet-hdr"><v-icon size="15" color="#047857">mdi-information-outline</v-icon><span class="sheet-ttl">Información de la Orden</span></div>
              <v-row dense class="mt-2">
                <v-col cols="12" sm="4">
                  <v-text-field v-model="form.fecha" type="date" label="Fecha *" density="compact" variant="outlined"
                    :error-messages="errFecha" />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field :model-value="ccOrigenNombre" label="CC Origen (Bodega)" density="compact"
                    variant="outlined" readonly disabled />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-select v-model="form.cc_destino" :items="ccostosDestino" item-title="nombre" item-value="codigo"
                    label="CC Destino (Punto de Venta) *" density="compact" variant="outlined"
                    :error-messages="errDestino" />
                </v-col>
                <v-col cols="12">
                  <v-text-field v-model="form.observaciones" label="Observaciones" density="compact" variant="outlined" />
                </v-col>
              </v-row>
            </div>

            <!-- Líneas de productos -->
            <div class="form-sheet">
              <div class="sheet-hdr mb-3">
                <v-icon size="15" color="#047857">mdi-package-variant</v-icon>
                <span class="sheet-ttl">Productos a Despachar</span>
                <span class="sheet-count">{{ form.detalle.length }} item(s)</span>
              </div>

              <!-- Buscador de productos -->
              <div class="prod-search-wrap mb-3">
                <v-autocomplete
                  v-model="prodSeleccionado"
                  :items="productosDisponibles"
                  :item-title="p => `${p.codigo} – ${p.nombre} (${p.und})`"
                  item-value="codigo"
                  label="Buscar y agregar producto..."
                  density="compact"
                  variant="outlined"
                  clearable
                  hide-details
                  return-object
                  @update:model-value="agregarProducto"
                />
              </div>

              <!-- Tabla de líneas -->
              <table class="detalle-table" v-if="form.detalle.length">
                <thead>
                  <tr>
                    <th>PRODUCTO</th>
                    <th style="width:80px">UND</th>
                    <th style="width:120px;text-align:center">CANTIDAD</th>
                    <th style="width:40px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in form.detalle" :key="item.producto_codigo">
                    <td>
                      <div class="item-cod">{{ item.producto_codigo }}</div>
                      <div class="item-nom">{{ item.producto_nombre }}</div>
                    </td>
                    <td><span class="badge-und">{{ item.und }}</span></td>
                    <td class="ta-c">
                      <input type="number" class="cant-input" v-model.number="item.cant_requerida"
                        min="0.01" step="1" @keydown.enter.prevent="$event.target.blur()" />
                    </td>
                    <td class="ta-c">
                      <v-btn icon size="x-small" variant="text" color="#ef4444" @click="quitarProducto(idx)">
                        <v-icon size="16">mdi-close</v-icon>
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div v-else class="detalle-empty">
                <v-icon size="32" color="rgba(var(--v-theme-on-surface),0.2)">mdi-package-variant-closed</v-icon>
                <p>Agrega productos usando el buscador de arriba</p>
              </div>
            </div>

            <v-alert v-if="formError" type="error" variant="tonal" density="compact" class="mt-4">{{ formError }}</v-alert>
          </v-card-text>

          <v-divider />
          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn variant="text" @click="dlgForm=false" :disabled="guardando">Cancelar</v-btn>
            <v-btn color="#047857" variant="elevated" :loading="guardando" @click="guardar"
              :disabled="!form.detalle.length">
              {{ editandoId ? 'Guardar Cambios' : 'Crear Orden' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- ═══════════════ DIALOG DETALLE (VER / ESTADO) ═══════════════ -->
      <v-dialog v-model="dlgDetalle" max-width="680" scrollable>
        <v-card rounded="lg" class="dlg-card" v-if="detalleActivo">
          <div class="dlg-header" :style="`background:linear-gradient(135deg,${estadoColor(detalleActivo.estado)},${estadoColor(detalleActivo.estado)}cc)`">
            <div class="dlg-header-left">
              <div class="dlg-header-icon"><v-icon color="white" size="20">mdi-clipboard-text-outline</v-icon></div>
              <div>
                <div class="dlg-title">Orden #{{ detalleActivo.id }} — {{ estadoLabel(detalleActivo.estado) }}</div>
                <div class="dlg-sub">{{ fmtFecha(detalleActivo.fecha) }} · {{ detalleActivo.cc_destino_nombre }}</div>
              </div>
            </div>
            <v-btn icon variant="text" color="white" size="small" @click="dlgDetalle=false"><v-icon>mdi-close</v-icon></v-btn>
          </div>

          <v-card-text class="pa-5" style="max-height:65vh;overflow-y:auto">
            <!-- Info -->
            <div class="det-info-row mb-4">
              <div class="det-info-item">
                <span class="det-lbl">CC Origen</span>
                <span class="det-val">{{ detalleActivo.cc_origen_nombre }}</span>
              </div>
              <div class="det-info-item">
                <span class="det-lbl">CC Destino</span>
                <span class="det-val">{{ detalleActivo.cc_destino_nombre }}</span>
              </div>
              <div class="det-info-item">
                <span class="det-lbl">Estado</span>
                <span class="estado-chip" :class="`est-${detalleActivo.estado}`">{{ estadoLabel(detalleActivo.estado) }}</span>
              </div>
            </div>
            <div v-if="detalleActivo.observaciones" class="det-obs mb-4">{{ detalleActivo.observaciones }}</div>

            <!-- Tabla de detalle -->
            <table class="detalle-table">
              <thead>
                <tr>
                  <th>PRODUCTO</th>
                  <th style="width:70px;text-align:center">REQ.</th>
                  <th style="width:70px;text-align:center">PICKING</th>
                  <th style="width:70px;text-align:center">PACKING</th>
                  <th style="width:80px;text-align:center">DIF.</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in detalleActivo.detalle" :key="item.id" :class="difClass(item)">
                  <td>
                    <div class="item-cod">{{ item.producto_codigo }}</div>
                    <div class="item-nom">{{ item.producto_nombre }}</div>
                  </td>
                  <td class="ta-c num-cell">{{ item.cant_requerida }}</td>
                  <td class="ta-c num-cell">{{ item.cant_picking || 0 }}</td>
                  <td class="ta-c num-cell">{{ item.cant_packing || 0 }}</td>
                  <td class="ta-c">
                    <span v-if="detalleActivo.estado==='COMPLETADO' || parseFloat(item.cant_packing)>0"
                      :class="difValClass(item)">
                      {{ difVal(item) }}
                    </span>
                    <span v-else class="dif-na">—</span>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Acciones de estado (solo para PENDIENTE y si no está completado/cancelado) -->
            <div v-if="detalleActivo.estado === 'PENDIENTE'" class="det-acciones mt-4">
              <v-btn variant="tonal" color="#047857" @click="abrirEditar(detalleActivo)">
                <v-icon start size="16">mdi-pencil</v-icon>Editar Orden
              </v-btn>
            </div>
          </v-card-text>

          <v-divider />
          <v-card-actions class="pa-4">
            <v-btn variant="tonal" color="#047857" prepend-icon="mdi-printer-outline" @click="imprimirDespacho">
              Imprimir Reporte
            </v-btn>
            <v-spacer />
            <v-btn variant="text" @click="dlgDetalle=false">Cerrar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'

const empresa    = computed(() => localStorage.getItem('empresaCodigo') || '')
const usuario    = computed(() => localStorage.getItem('usuarioNombre') || '')

// ── Estado ────────────────────────────────────────────────────
const despachos  = ref([])
const ccostos    = ref([])
const productos  = ref([])
const loading    = ref(false)
const eliminando = ref(null)

// Filtros
const filtroFecha   = ref(new Date().toISOString().split('T')[0])
const filtroEstado  = ref('')
const filtroDestino = ref('')

const estadoOpts = [
  { label: 'Todos los estados', value: '' },
  { label: 'Pendiente',   value: 'PENDIENTE' },
  { label: 'En Picking',  value: 'EN_PICKING' },
  { label: 'En Packing',  value: 'EN_PACKING' },
  { label: 'Completado',  value: 'COMPLETADO' },
  { label: 'Cancelado',   value: 'CANCELADO' },
]

// Dialog formulario
const dlgForm       = ref(false)
const editandoId    = ref(null)
const guardando     = ref(false)
const formError     = ref('')
const errFecha      = ref('')
const errDestino    = ref('')
const prodSeleccionado = ref(null)
const form = ref({ fecha: '', cc_origen: '', cc_destino: '', observaciones: '', detalle: [] })

// Dialog detalle
const dlgDetalle    = ref(false)
const detalleActivo = ref(null)
const cargandoDet   = ref(false)

// ── Computed ──────────────────────────────────────────────────
const ccOrigenNombre = computed(() => {
  const cc = ccostos.value.find(c => c.codigo === form.value.cc_origen)
  return cc ? cc.nombre : form.value.cc_origen
})

const ccostosDestino = computed(() =>
  ccostos.value.filter(c => c.codigo !== form.value.cc_origen)
)

const productosDisponibles = computed(() =>
  productos.value.filter(p => !form.value.detalle.find(d => d.producto_codigo === p.codigo))
)

const despachosFiltrados = computed(() => {
  let lista = despachos.value
  if (filtroEstado.value)  lista = lista.filter(d => d.estado === filtroEstado.value)
  if (filtroDestino.value) lista = lista.filter(d => d.cc_destino === filtroDestino.value)
  return lista
})

const totalUnidades = computed(() => {
  const hoy = new Date().toISOString().split('T')[0]
  return despachos.value
    .filter(d => String(d.fecha).startsWith(hoy))
    .reduce((s, d) => s + parseFloat(d.total_unidades || 0), 0)
    .toFixed(0)
})

// ── Helpers ───────────────────────────────────────────────────
function fmtFecha(f) {
  if (!f) return '—'
  const d = new Date(f + (f.includes('T') ? '' : 'T12:00:00'))
  return d.toLocaleDateString('es', { day:'2-digit', month:'short', year:'numeric' })
}

function estadoLabel(e) {
  return { PENDIENTE:'Pendiente', EN_PICKING:'En Picking', EN_PACKING:'En Packing', COMPLETADO:'Completado', CANCELADO:'Cancelado' }[e] || e
}

function estadoColor(e) {
  return { PENDIENTE:'#f59e0b', EN_PICKING:'#3b82f6', EN_PACKING:'#8b5cf6', COMPLETADO:'#10b981', CANCELADO:'#6b7280' }[e] || '#047857'
}

function difVal(item) {
  const base = parseFloat(item.cant_packing) || parseFloat(item.cant_picking) || 0
  const req  = parseFloat(item.cant_requerida) || 0
  const dif  = base - req
  if (dif === 0) return '✓'
  return (dif > 0 ? '+' : '') + dif
}

function difValClass(item) {
  const base = parseFloat(item.cant_packing) || parseFloat(item.cant_picking) || 0
  const req  = parseFloat(item.cant_requerida) || 0
  const dif  = base - req
  if (dif === 0) return 'dif-ok'
  return dif > 0 ? 'dif-sobre' : 'dif-falta'
}

function difClass(item) {
  const base = parseFloat(item.cant_packing) || parseFloat(item.cant_picking) || 0
  const req  = parseFloat(item.cant_requerida) || 0
  if (base === 0) return ''
  const dif  = base - req
  if (dif < 0) return 'row-falta'
  if (dif > 0) return 'row-sobre'
  return ''
}

// ── Carga de datos ────────────────────────────────────────────
async function cargar() {
  loading.value = true
  try {
    const params = { empresa: empresa.value }
    if (filtroFecha.value) params.fecha = filtroFecha.value
    const res = await api.get('/api/almacen/despachos', { params })
    despachos.value = res.data?.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function cargarCcostos() {
  try {
    const res = await api.get('/ccostos', { params: { empresa: empresa.value } })
    ccostos.value = res.data?.data || res.data?.ccostos || []
  } catch { /* */ }
}

async function cargarProductos() {
  try {
    const res = await api.get('/api/almacen/productos', { params: { empresa: empresa.value } })
    productos.value = res.data?.data || []
  } catch { /* */ }
}

// ── CRUD ──────────────────────────────────────────────────────
function abrirNuevo() {
  editandoId.value   = null
  formError.value    = ''
  errFecha.value     = ''
  errDestino.value   = ''
  prodSeleccionado.value = null
  // CC origen = primer CC con control='SI' (bodega principal)
  const bodega = ccostos.value.find(c => c.codigo) // fallback: primero
  form.value = {
    fecha: new Date().toISOString().split('T')[0],
    cc_origen: bodega?.codigo || '',
    cc_destino: '',
    observaciones: '',
    detalle: []
  }
  dlgForm.value = true
}

async function abrirEditar(d) {
  dlgDetalle.value = false
  editandoId.value = d.id
  formError.value  = ''
  errFecha.value   = ''
  errDestino.value = ''
  prodSeleccionado.value = null
  // Cargar detalle completo
  try {
    const res = await api.get(`/api/almacen/despachos/${d.id}`, { params: { empresa: empresa.value } })
    const orden = res.data?.data
    form.value = {
      fecha: String(orden.fecha).split('T')[0],
      cc_origen: orden.cc_origen,
      cc_destino: orden.cc_destino,
      observaciones: orden.observaciones || '',
      detalle: orden.detalle.map(i => ({
        producto_codigo: i.producto_codigo,
        producto_nombre: i.producto_nombre,
        und: i.und,
        cant_requerida: parseFloat(i.cant_requerida)
      }))
    }
    dlgForm.value = true
  } catch (e) {
    console.error(e)
  }
}

function agregarProducto(prod) {
  if (!prod) return
  form.value.detalle.push({
    producto_codigo: prod.codigo,
    producto_nombre: prod.nombre,
    und: prod.und,
    cant_requerida: 1
  })
  prodSeleccionado.value = null
}

function quitarProducto(idx) {
  form.value.detalle.splice(idx, 1)
}

function validar() {
  errFecha.value   = !form.value.fecha    ? 'Requerido' : ''
  errDestino.value = !form.value.cc_destino ? 'Requerido' : ''
  return !errFecha.value && !errDestino.value
}

async function guardar() {
  if (!validar()) return
  guardando.value = true
  formError.value = ''
  try {
    const payload = {
      empresa: empresa.value,
      fecha: form.value.fecha,
      cc_origen: form.value.cc_origen,
      cc_destino: form.value.cc_destino,
      observaciones: form.value.observaciones,
      creado_por: usuario.value,
      detalle: form.value.detalle.map(i => ({
        producto_codigo: i.producto_codigo,
        cant_requerida: parseFloat(i.cant_requerida) || 1
      }))
    }
    if (editandoId.value) {
      await api.put(`/api/almacen/despachos/${editandoId.value}`, payload)
    } else {
      await api.post('/api/almacen/despachos', payload)
    }
    dlgForm.value = false
    await cargar()
  } catch (e) {
    formError.value = e?.response?.data?.error || e.message || 'Error al guardar'
  } finally {
    guardando.value = false
  }
}

async function abrirDetalle(d) {
  cargandoDet.value = true
  dlgDetalle.value  = true
  try {
    const res = await api.get(`/api/almacen/despachos/${d.id}`, { params: { empresa: empresa.value } })
    detalleActivo.value = res.data?.data
  } catch (e) {
    console.error(e)
  } finally {
    cargandoDet.value = false
  }
}

function imprimirDespacho() {
  const o = detalleActivo.value
  if (!o) return

  const filas = o.detalle.map(item => {
    const enviado = parseFloat(item.cant_packing) > 0 ? parseFloat(item.cant_packing)
                  : parseFloat(item.cant_picking) > 0  ? parseFloat(item.cant_picking)
                  : parseFloat(item.cant_requerida)
    const req = parseFloat(item.cant_requerida)
    const dif = enviado - req
    const difStr = dif === 0 ? '✓' : (dif > 0 ? '+' : '') + dif
    const difColor = dif === 0 ? '#10b981' : dif < 0 ? '#ef4444' : '#f59e0b'
    return `<tr>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb">${item.producto_nombre}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:center;font-family:monospace">${item.producto_codigo}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:center">${item.und}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700">${req}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700">${enviado}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700;color:${difColor}">${difStr}</td>
    </tr>`
  }).join('')

  const totalReq = o.detalle.reduce((s, i) => s + parseFloat(i.cant_requerida), 0)
  const totalEnv = o.detalle.reduce((s, i) => {
    return s + (parseFloat(i.cant_packing) > 0 ? parseFloat(i.cant_packing)
               : parseFloat(i.cant_picking) > 0  ? parseFloat(i.cant_picking)
               : parseFloat(i.cant_requerida))
  }, 0)

  const estadoColors = { PENDIENTE:'#f59e0b', EN_PICKING:'#3b82f6', EN_PACKING:'#8b5cf6', COMPLETADO:'#10b981', CANCELADO:'#6b7280' }
  const estadoNames  = { PENDIENTE:'Pendiente', EN_PICKING:'En Picking', EN_PACKING:'En Packing', COMPLETADO:'Completado', CANCELADO:'Cancelado' }
  const color = estadoColors[o.estado] || '#047857'

  const ventana = window.open('', '_blank')
  ventana.document.write(`<!DOCTYPE html><html><head>
  <meta charset="UTF-8">
  <title>Reporte Despacho #${o.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 30px; }
    .encabezado { border-left: 5px solid ${color}; padding: 0 0 0 14px; margin-bottom: 24px; }
    .encabezado h1 { font-size: 20px; font-weight: 800; }
    .encabezado p  { font-size: 12px; color: #555; margin-top: 3px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; background: ${color}22; color: ${color}; }
    .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 20px; }
    .meta-item label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #6b7280; display: block; }
    .meta-item span  { font-size: 13px; font-weight: 600; margin-top: 2px; display: block; }
    table { width: 100%; border-collapse: collapse; }
    thead th { padding: 9px 10px; background: #f3f4f6; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; text-align: left; border-bottom: 2px solid #d1d5db; }
    tfoot td { padding: 9px 10px; font-weight: 700; border-top: 2px solid #d1d5db; background: #f9fafb; }
    .firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 50px; }
    .firma-linea { border-top: 1px solid #000; padding-top: 8px; text-align: center; font-size: 12px; color: #555; }
    @media print { body { padding: 15px; } }
  </style>
  </head><body>
  <div class="encabezado">
    <h1>REPORTE DE DESPACHO</h1>
    <p>Orden #${o.id} &nbsp;·&nbsp; ${fmtFecha(o.fecha)} &nbsp;·&nbsp; <span class="badge">${estadoNames[o.estado] || o.estado}</span></p>
  </div>
  <div class="meta-grid">
    <div class="meta-item"><label>CC Origen</label><span>${o.cc_origen_nombre}</span></div>
    <div class="meta-item"><label>CC Destino</label><span>${o.cc_destino_nombre}</span></div>
    <div class="meta-item"><label>Observaciones</label><span>${o.observaciones || '—'}</span></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>PRODUCTO</th>
        <th style="text-align:center">CÓDIGO</th>
        <th style="text-align:center">UND</th>
        <th style="text-align:center">REQUERIDO</th>
        <th style="text-align:center">ENVIADO</th>
        <th style="text-align:center">DIF.</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
    <tfoot>
      <tr>
        <td colspan="3">TOTAL</td>
        <td style="text-align:center">${totalReq}</td>
        <td style="text-align:center">${totalEnv}</td>
        <td style="text-align:center;color:${totalEnv===totalReq?'#10b981':totalEnv<totalReq?'#ef4444':'#f59e0b'}">${totalEnv===totalReq?'✓':(totalEnv>totalReq?'+':'')+(totalEnv-totalReq)}</td>
      </tr>
    </tfoot>
  </table>
  <div class="firmas">
    <div class="firma-linea">Firma Despachador</div>
    <div class="firma-linea">Firma Receptor</div>
  </div>
  <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`)
  ventana.document.close()
}

async function eliminar(d) {
  if (!confirm(`¿Eliminar la orden #${d.id}?`)) return
  eliminando.value = d.id
  try {
    await api.delete(`/api/almacen/despachos/${d.id}`, { params: { empresa: empresa.value } })
    await cargar()
  } catch (e) {
    alert(e?.response?.data?.error || 'Error al eliminar')
  } finally {
    eliminando.value = null
  }
}

onMounted(async () => {
  await Promise.all([cargarCcostos(), cargarProductos()])
  // CC origen default = primer ccosto disponible (bodega principal)
  if (ccostos.value.length) form.value.cc_origen = ccostos.value[0].codigo
  await cargar()
})
</script>

<style scoped>
.db-container { padding: 24px; max-width: 1200px; margin: 0 auto; }

/* Breadcrumb */
.db-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root    { font-size: 12px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: .5px; }
.bc-sep     { color: rgba(var(--v-theme-on-surface),.3); }
.bc-cat     { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface),.8); font-weight: 500; }

/* Header */
.db-header      { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.db-header-left { display: flex; align-items: center; gap: 16px; }
.db-icon-wrap   { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#047857,#10b981); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(4,120,87,.35); flex-shrink: 0; }
.db-title       { font-size: 20px; font-weight: 800; letter-spacing: .5px; margin: 0; }
.db-sub         { font-size: 13px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }

/* KPIs */
.db-kpi-row { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.db-kpi     { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-left: 3px solid var(--kc); border-radius: 10px; padding: 14px 18px; display: flex; align-items: center; gap: 12px; flex: 1; min-width: 140px; }
.kpi-val    { font-size: 22px; font-weight: 800; line-height: 1; }
.kpi-lbl    { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.5); margin-top: 2px; }

/* Filtros */
.db-filtros { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }

/* Tabla */
.db-tabla-wrap { background: rgb(var(--v-theme-surface)); border-radius: 12px; border: 1px solid rgba(var(--v-theme-on-surface),.08); overflow: hidden; }
.db-loading    { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 50px; color: rgba(var(--v-theme-on-surface),.5); }
.db-table      { width: 100%; border-collapse: collapse; font-size: 13px; }
.db-table thead { background: rgba(var(--v-theme-on-surface),.04); }
.db-table thead th { padding: 11px 14px; text-align: left; font-weight: 700; font-size: 11px; letter-spacing: .5px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.6); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); }
.db-row { border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); }
.db-row:hover { background: rgba(var(--v-theme-on-surface),.02); }
.db-table tbody td { padding: 10px 14px; vertical-align: middle; }
.db-empty { text-align: center !important; padding: 50px 20px !important; color: rgba(var(--v-theme-on-surface),.4); font-size: 13px; }
.ta-c { text-align: center; }

.badge-id   { background: rgba(4,120,87,.12); color: #047857; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 12px; font-family: monospace; }
.badge-und  { background: rgba(139,92,246,.12); color: #8b5cf6; padding: 2px 7px; border-radius: 5px; font-size: 11px; font-weight: 600; }
.td-fecha   { font-size: 12px; color: rgba(var(--v-theme-on-surface),.7); }
.td-destino { display: flex; align-items: center; gap: 6px; font-weight: 500; }
.acc-btns   { display: inline-flex; align-items: center; gap: 2px; }

/* Estado chips */
.estado-chip { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .3px; display: inline-block; }
.est-PENDIENTE  { background: rgba(245,158,11,.12); color: #f59e0b; }
.est-EN_PICKING { background: rgba(59,130,246,.12); color: #3b82f6; }
.est-EN_PACKING { background: rgba(139,92,246,.12); color: #8b5cf6; }
.est-COMPLETADO { background: rgba(16,185,129,.12); color: #10b981; }
.est-CANCELADO  { background: rgba(107,114,128,.12); color: #6b7280; }

/* Dialog */
.dlg-card { overflow: visible !important; }
.dlg-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; background: linear-gradient(135deg,#047857,#10b981); }
.dlg-header-left { display: flex; align-items: center; gap: 12px; }
.dlg-header-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(255,255,255,.2); display: flex; align-items: center; justify-content: center; }
.dlg-title { font-size: 16px; font-weight: 700; color: white; }
.dlg-sub   { font-size: 12px; color: rgba(255,255,255,.8); margin-top: 2px; }

/* Form sheets */
.form-sheet { padding: 16px; background: rgba(var(--v-theme-on-surface),.02); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 10px; }
.sheet-hdr  { display: flex; align-items: center; gap: 8px; }
.sheet-ttl  { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: rgba(var(--v-theme-on-surface),.8); }
.sheet-count{ font-size: 11px; color: rgba(var(--v-theme-on-surface),.4); margin-left: auto; }

/* Tabla de detalle */
.detalle-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 4px; }
.detalle-table thead th { padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: rgba(var(--v-theme-on-surface),.5); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); }
.detalle-table tbody tr { border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); }
.detalle-table tbody td { padding: 8px 10px; vertical-align: middle; }
.item-cod { font-size: 11px; color: rgba(var(--v-theme-on-surface),.4); font-family: monospace; }
.item-nom { font-weight: 600; font-size: 13px; }
.num-cell { font-family: monospace; font-size: 13px; }
.cant-input { width: 80px; text-align: center; border: 1px solid rgba(var(--v-theme-on-surface),.2); border-radius: 6px; padding: 4px 8px; font-size: 13px; background: transparent; color: rgb(var(--v-theme-on-surface)); outline: none; }
.cant-input:focus { border-color: #047857; }

.detalle-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 30px; color: rgba(var(--v-theme-on-surface),.4); font-size: 13px; }

/* Diferencias */
.dif-ok    { color: #10b981; font-weight: 700; }
.dif-falta { color: #ef4444; font-weight: 700; }
.dif-sobre { color: #f59e0b; font-weight: 700; }
.dif-na    { color: rgba(var(--v-theme-on-surface),.3); }
.row-falta { background: rgba(239,68,68,.04); }
.row-sobre { background: rgba(245,158,11,.04); }

/* Detalle dialog */
.det-info-row  { display: flex; gap: 24px; flex-wrap: wrap; padding: 12px; background: rgba(var(--v-theme-on-surface),.03); border-radius: 8px; }
.det-info-item { display: flex; flex-direction: column; gap: 2px; }
.det-lbl       { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: rgba(var(--v-theme-on-surface),.5); }
.det-val       { font-size: 13px; font-weight: 600; }
.det-obs       { font-size: 13px; color: rgba(var(--v-theme-on-surface),.6); font-style: italic; padding: 8px 12px; background: rgba(var(--v-theme-on-surface),.03); border-radius: 6px; }
.det-acciones  { display: flex; gap: 8px; }
</style>
