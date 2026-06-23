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
        <div style="display:flex;gap:10px">
          <v-btn color="#047857" variant="flat" rounded="lg" @click="abrirAnalisisFaltantes">
            <v-icon start>mdi-chart-line</v-icon>Análisis de Faltantes
          </v-btn>
          <v-btn color="#047857" variant="flat" rounded="lg" @click="abrirNuevo">
            <v-icon start>mdi-plus</v-icon>Nueva Orden
          </v-btn>
        </div>
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
                  <v-btn icon size="x-small" variant="text" color="#6b7280" title="Imprimir"
                    :loading="imprimiendo === d.id"
                    @click="imprimirDesdeTabla(d)">
                    <v-icon>mdi-printer-outline</v-icon>
                  </v-btn>
                  <v-btn icon size="x-small" variant="text" color="#ef4444" title="Eliminar"
                    v-if="d.estado !== 'COMPLETADO'"
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
      <v-dialog v-model="dlgForm" max-width="1000" scrollable>
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

          <v-card-text class="pa-5" style="max-height:75vh;overflow-y:auto">
            <!-- Cabecera de la orden -->
            <div class="form-sheet mb-4">
              <div class="sheet-hdr"><v-icon size="15" color="#047857">mdi-information-outline</v-icon><span class="sheet-ttl">Información de la Orden</span></div>
              <v-row dense class="mt-2">
                <v-col cols="12" sm="3">
                  <v-text-field v-model="form.fecha" type="date" label="Fecha *" density="compact" variant="outlined"
                    :error-messages="errFecha" />
                </v-col>
                <v-col cols="12" sm="3">
                  <v-text-field :model-value="ccOrigenNombre" label="CC Origen (Bodega)" density="compact"
                    variant="outlined" readonly disabled />
                </v-col>
                <v-col cols="12" sm="3">
                  <v-select v-model="form.cc_destino" :items="ccostosDestino" item-title="nombre" item-value="codigo"
                    label="CC Destino *" density="compact" variant="outlined"
                    :error-messages="errDestino" />
                </v-col>
                <v-col cols="12" sm="3">
                  <v-text-field v-model="form.observaciones" label="Observaciones" density="compact" variant="outlined" />
                </v-col>
              </v-row>
            </div>

            <!-- Grid de productos -->
            <div class="form-sheet">
              <div class="sheet-hdr mb-3">
                <v-icon size="15" color="#047857">mdi-package-variant</v-icon>
                <span class="sheet-ttl">Productos a Despachar</span>
                <span class="sheet-count">{{ productosConCantidad }} con cantidad</span>
                <v-btn v-if="productosConCantidad > 0" variant="text" size="x-small" color="grey" class="ml-2"
                  prepend-icon="mdi-eraser" @click="cantidades={}">
                  Limpiar
                </v-btn>
              </div>

              <!-- Sin CC destino -->
              <div v-if="!form.cc_destino" class="grid-placeholder">
                <v-icon size="32" color="rgba(var(--v-theme-on-surface),.2)">mdi-store-search-outline</v-icon>
                <p>Selecciona el CC Destino para cargar los productos</p>
              </div>

              <!-- Cargando -->
              <div v-else-if="loadingGrid" class="grid-placeholder">
                <v-progress-circular indeterminate color="#047857" size="28" />
                <p>Cargando productos y stock...</p>
              </div>

              <!-- Grid agrupado -->
              <table v-else class="prod-grid">
                <thead>
                  <tr>
                    <th class="pg-cod">CÓDIGO</th>
                    <th class="pg-nom">PRODUCTO</th>
                    <th class="pg-desc">DESCRIPCIÓN</th>
                    <th class="pg-stock-bodega">STOCK BODEGA</th>
                    <th class="pg-und">UND</th>
                    <th class="pg-stock">STOCK DESTINO</th>
                    <th class="pg-cant">CANTIDAD A ENVIAR</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-if="productosAgrupados.length === 0">
                    <tr><td colspan="6" class="grid-empty">No hay productos con control de inventario</td></tr>
                  </template>
                  <template v-for="grupo in productosAgrupados" :key="grupo.key">
                    <!-- Cabecera de grupo -->
                    <tr class="pg-grupo-row">
                      <td colspan="6" class="pg-grupo-cell">
                        <v-icon size="13" class="mr-1" style="color:#8b5cf6">mdi-folder-outline</v-icon>
                        <span class="pg-grupo-name">{{ grupo.nombre }}</span>
                        <span class="pg-grupo-count">{{ grupo.items.length }} producto{{ grupo.items.length !== 1 ? 's' : '' }}</span>
                      </td>
                    </tr>
                    <!-- Filas de productos -->
                    <tr v-for="p in grupo.items" :key="p.codigo" class="pg-prod-row"
                      :class="{ 'pg-highlighted': cantidades[p.codigo] > 0 }"
                      :style="hoveredRow === p.codigo ? { background: rowHoverBg } : {}"
                      @focusin="hoveredRow = p.codigo"
                      @focusout="hoveredRow = null">
                      <td><span class="badge-cod">{{ p.codigo }}</span></td>
                      <td class="pg-td-nom">{{ p.nombre }}</td>
                      <td class="pg-td-desc">{{ p.descripcion || '—' }}</td>
                      <td class="pg-td-stock-bodega">
                        <div style="font-size:11px;color:rgba(var(--v-theme-on-surface),.5);margin-bottom:2px">Actual: <strong :class="stockPorCodigo[p.codigo] > 0 ? 'stock-pos' : 'stock-zero'">{{ parseFloat(stockPorCodigo[p.codigo] || 0).toFixed(0) }}</strong></div>
                        <div style="font-size:10px;color:rgba(var(--v-theme-on-surface),.4)">Disponible: <strong :class="stockDisponiblePorCodigo[p.codigo] > 0 ? 'stock-pos' : 'stock-zero'">{{ parseFloat(stockDisponiblePorCodigo[p.codigo] || 0).toFixed(0) }}</strong></div>
                      </td>
                      <td><span class="badge-und">{{ p.und }}</span></td>
                      <td class="pg-td-stock">
                        <span :class="p.stock_actual > 0 ? 'stock-pos' : 'stock-zero'">
                          {{ parseFloat(p.stock_actual || 0).toFixed(0) }}
                        </span>
                      </td>
                      <td class="pg-td-cant">
                        <input
                          :value="cantidades[p.codigo] || ''"
                          type="text"
                          inputmode="decimal"
                          class="pg-cant-input"
                          :class="{ 'pg-cant-active': cantidades[p.codigo] > 0 }"
                          placeholder="0"
                          @input="setCantidad(p.codigo, $event.target.value)"
                          @keydown="navegarGrid($event)"
                        />
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>

            <v-alert v-if="formError" type="error" variant="tonal" density="compact" class="mt-4">{{ formError }}</v-alert>
          </v-card-text>

          <v-divider />
          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn variant="text" @click="dlgForm=false" :disabled="guardando">Cancelar</v-btn>
            <v-btn color="#047857" variant="elevated" :loading="guardando" @click="guardar"
              :disabled="productosConCantidad === 0 || !form.cc_destino">
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
            <div style="display:flex;align-items:center;gap:6px">
              <v-btn v-if="detalleActivo.estado === 'PENDIENTE'" variant="flat"
                style="background:rgba(255,255,255,.2);color:white" size="small"
                prepend-icon="mdi-pencil" @click="abrirEditar(detalleActivo)">
                Editar
              </v-btn>
              <v-btn icon variant="text" color="white" size="small" @click="dlgDetalle=false"><v-icon>mdi-close</v-icon></v-btn>
            </div>
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

            <!-- Tabla de detalle agrupada por grupo -->
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
                <template v-for="grupo in detalleAgrupado" :key="grupo.nombre">
                  <tr class="det-grupo-row">
                    <td colspan="5" class="det-grupo-cell">{{ grupo.nombre }}</td>
                  </tr>
                  <tr v-for="item in grupo.items" :key="item.id" :class="difClass(item)">
                    <td><div class="item-nom">{{ item.producto_nombre }}</div></td>
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
                </template>
              </tbody>
            </table>
          </v-card-text>

          <v-divider />
          <v-card-actions class="pa-4">
            <v-btn variant="tonal" color="#047857" prepend-icon="mdi-printer-outline" @click="imprimirDespacho(detalleActivo)">
              Imprimir Reporte
            </v-btn>
            <v-spacer />
            <v-btn variant="flat" color="#ef4444" @click="dlgDetalle=false" style="color:white">Cerrar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- ═══════════════ DIALOG ANÁLISIS DE FALTANTES ═══════════════ -->
      <v-dialog v-model="dlgAnalisis" max-width="900" scrollable>
        <v-card rounded="lg" class="dlg-card">
          <div class="dlg-header" style="background:linear-gradient(135deg,#3b82f6,#2563eb)">
            <div class="dlg-header-left">
              <div class="dlg-header-icon"><v-icon color="white" size="20">mdi-chart-line</v-icon></div>
              <div>
                <div class="dlg-title">Análisis de Faltantes</div>
                <div class="dlg-sub">Qué falta para cumplir despachos PENDIENTE</div>
              </div>
            </div>
            <v-btn icon variant="text" color="white" size="small" @click="dlgAnalisis=false"><v-icon>mdi-close</v-icon></v-btn>
          </div>

          <v-card-text class="pa-5" style="max-height:75vh;overflow-y:auto">
            <div v-if="cargandoAnalisis" style="text-align:center;padding:40px">
              <v-progress-circular indeterminate color="#3b82f6" size="36" />
              <p style="margin-top:12px;color:rgba(var(--v-theme-on-surface),.5)">Analizando despachos pendientes...</p>
            </div>

            <div v-else-if="analisisFaltantes.length === 0" style="text-align:center;padding:40px;color:rgba(var(--v-theme-on-surface),.4)">
              <v-icon size="40" style="opacity:.3">mdi-check-circle-outline</v-icon>
              <p style="margin-top:12px">No hay despachos pendientes</p>
            </div>

            <div v-else>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:24px">
                <div class="ana-stat" style="--color:#ef4444">
                  <div class="ana-stat-label">CON FALTANTE</div>
                  <div class="ana-stat-val">{{ analisisFaltantes.filter(a => !a.ok).length }}</div>
                </div>
                <div class="ana-stat" style="--color:#10b981">
                  <div class="ana-stat-label">CUMPLIBLES</div>
                  <div class="ana-stat-val">{{ analisisFaltantes.filter(a => a.ok).length }}</div>
                </div>
                <div class="ana-stat" style="--color:#f59e0b">
                  <div class="ana-stat-label">UNIDADES FALTANTES</div>
                  <div class="ana-stat-val">{{ analisisFaltantes.reduce((s,a) => s + a.faltante, 0).toFixed(0) }}</div>
                </div>
              </div>

              <table class="ana-table">
                <thead>
                  <tr>
                    <th style="width:80px">CÓDIGO</th>
                    <th>PRODUCTO</th>
                    <th style="width:70px;text-align:center">UND</th>
                    <th style="width:100px;text-align:center">REQUERIDO</th>
                    <th style="width:100px;text-align:center">DISPONIBLE</th>
                    <th style="width:90px;text-align:center">FALTANTE</th>
                    <th style="width:50px;text-align:center">ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in analisisFaltantes" :key="item.codigo" :class="item.ok ? 'ana-row-ok' : 'ana-row-falta'">
                    <td><span class="badge-cod">{{ item.codigo }}</span></td>
                    <td>
                      <div style="font-weight:500;font-size:13px">{{ item.nombre }}</div>
                      <div style="font-size:11px;color:rgba(var(--v-theme-on-surface),.4)">{{ item.grupo_nombre }}</div>
                    </td>
                    <td style="text-align:center"><span class="badge-und">{{ item.und }}</span></td>
                    <td style="text-align:center;font-weight:600">{{ item.requerido.toFixed(0) }}</td>
                    <td style="text-align:center" :class="item.disponible > 0 ? 'stock-pos' : 'stock-zero'">
                      {{ item.disponible.toFixed(0) }}
                    </td>
                    <td style="text-align:center">
                      <span v-if="item.faltante > 0" style="font-weight:700;color:#ef4444">{{ item.faltante.toFixed(0) }}</span>
                      <span v-else style="color:#10b981;font-weight:700">✓</span>
                    </td>
                    <td style="text-align:center">
                      <span v-if="item.ok" style="font-size:11px;background:rgba(16,185,129,.15);color:#10b981;padding:2px 8px;border-radius:12px;font-weight:700">OK</span>
                      <span v-else style="font-size:11px;background:rgba(239,68,68,.15);color:#ef4444;padding:2px 8px;border-radius:12px;font-weight:700">FALTA</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </v-card-text>
        </v-card>
      </v-dialog>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useAuthStore } from '../../stores/auth'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'

const auth    = useAuthStore()
const empresa = computed(() => auth.empresa)
const usuario = computed(() => localStorage.getItem('usuarioNombre') || '')

const theme      = useTheme()
const rowHoverBg = computed(() =>
  theme.current.value.dark ? 'rgba(251,191,36,.2)' : '#fee2e2'
)
const hoveredRow = ref(null)

// ── Estado ────────────────────────────────────────────────────
const despachos  = ref([])
const ccostos    = ref([])
const loading    = ref(false)
const eliminando = ref(null)
const imprimiendo = ref(null)

// Filtros
const filtroFecha   = ref('')
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
const dlgForm    = ref(false)
const editandoId = ref(null)
const guardando  = ref(false)
const formError  = ref('')
const errFecha   = ref('')
const errDestino = ref('')
const form = ref({ fecha: '', cc_origen: '', cc_destino: '', observaciones: '' })

// Grid de productos
const todosProductos  = ref([])   // lista completa control='SI' con descripcion
const stockPorCodigo  = ref({})   // { [codigo]: stock_actual } en bodega_maestra
const stockDisponiblePorCodigo = ref({}) // { [codigo]: disponible } = stock_actual - reservado en PENDIENTE
const cantidades      = ref({})   // { [codigo]: number }
const loadingGrid     = ref(false)

// Dialog detalle
const dlgDetalle    = ref(false)
const detalleActivo = ref(null)

// Dialog análisis de faltantes
const dlgAnalisis = ref(false)
const analisisFaltantes = ref([])
const cargandoAnalisis = ref(false)

// ── Computed ──────────────────────────────────────────────────
const ccOrigenNombre = computed(() => {
  const cc = ccostos.value.find(c => String(c.codigo) === String(form.value.cc_origen))
  return cc ? cc.nombre : (form.value.cc_origen || '—')
})

const ccostosDestino = computed(() =>
  ccostos.value.filter(c => String(c.codigo) !== String(form.value.cc_origen))
)

const productosGrid = computed(() =>
  todosProductos.value.map(p => ({
    ...p,
    stock_actual: stockPorCodigo.value[p.codigo] ?? 0,
  }))
)

const productosAgrupados = computed(() => {
  const mapa = new Map()
  for (const p of productosGrid.value) {
    const key    = p.grupo_codigo || '__sin_grupo__'
    const nombre = p.grupo_nombre || 'Sin Grupo'
    if (!mapa.has(key)) mapa.set(key, { key, nombre, items: [] })
    mapa.get(key).items.push(p)
  }
  return Array.from(mapa.values()).sort((a, b) => {
    const na = parseInt(a.key) || 999999
    const nb = parseInt(b.key) || 999999
    return na - nb
  })
})

const productosConCantidad = computed(() =>
  Object.values(cantidades.value).filter(v => parseFloat(v) > 0).length
)

const detalleAgrupado = computed(() => {
  if (!detalleActivo.value?.detalle) return []
  const mapa = new Map()
  for (const item of detalleActivo.value.detalle) {
    const key    = item.grupo_codigo || '__sin_grupo__'
    const nombre = item.grupo_nombre || 'Sin Grupo'
    if (!mapa.has(key)) mapa.set(key, { key, nombre, items: [] })
    mapa.get(key).items.push(item)
  }
  return Array.from(mapa.values()).sort((a, b) => {
    const na = parseInt(a.key) || 999999
    const nb = parseInt(b.key) || 999999
    return na - nb
  })
})

const despachosFiltrados = computed(() => {
  let lista = despachos.value
  if (filtroFecha.value)   lista = lista.filter(d => String(d.fecha).startsWith(filtroFecha.value))
  if (filtroEstado.value)  lista = lista.filter(d => d.estado === filtroEstado.value)
  if (filtroDestino.value) lista = lista.filter(d => String(d.cc_destino) === String(filtroDestino.value))
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
  const d = new Date(String(f).substring(0, 10) + 'T12:00:00')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yy = d.getFullYear()
  return `${mm}/${dd}/${yy}`
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

function setCantidad(codigo, val) {
  if (!val || val === '-' || val.endsWith('.') || val.endsWith(',')) return
  const n = parseFloat(String(val).replace(',', '.'))
  const nuevo = { ...cantidades.value }
  if (isNaN(n) || n <= 0) delete nuevo[codigo]
  else nuevo[codigo] = n
  cantidades.value = nuevo
}

function navegarGrid(event) {
  const { key } = event
  if (key !== 'Enter' && key !== 'ArrowDown' && key !== 'ArrowUp') return
  event.preventDefault()
  const inputs = Array.from(document.querySelectorAll('.pg-cant-input'))
  const idx    = inputs.indexOf(event.target)
  if (idx === -1) return
  const delta  = key === 'ArrowUp' ? -1 : 1
  const target = inputs[idx + delta]
  if (target) { target.focus(); target.select() }
}

// ── Carga de datos ────────────────────────────────────────────
async function cargar() {
  loading.value = true
  try {
    const res = await api.get('/almacen/despachos', { params: { empresa: empresa.value } })
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

async function cargarGrid(ccDestino) {
  if (!ccDestino) { todosProductos.value = []; stockPorCodigo.value = {}; stockDisponiblePorCodigo.value = {}; return }
  loadingGrid.value = true
  try {
    const ccOrigen = form.value.cc_origen
    const fechaHoy = new Date().toISOString().split('T')[0]

    const [resProds, resStockBodega, resDespachos] = await Promise.all([
      api.get('/almacen/productos', { params: { empresa: empresa.value } }),
      api.get('/almacen/ajuste-inventario/stock', { params: { empresa: empresa.value, ccosto: ccOrigen } }),
      api.get('/almacen/despachos', { params: { empresa: empresa.value, estado: 'PENDIENTE', fecha: fechaHoy, include_detalle: '1' } }),
    ])

    // Productos con control='SI' y sus datos
    const todos = resProds.data?.data || []
    todosProductos.value = todos
      .filter(p => p.control === 'SI')
      .map(p => ({
        codigo:      p.codigo,
        nombre:      p.nombre,
        descripcion: p.descripcion || '',
        und:         p.und,
        grupo_codigo: p.grupo || '__sin_grupo__',
        grupo_nombre: p.grupo_nombre || 'Sin Grupo',
      }))

    // Stock de bodega_maestra (cc_origen)
    const stockRows = resStockBodega.data?.data || []
    stockPorCodigo.value = {}
    for (const r of stockRows) {
      stockPorCodigo.value[r.codigo] = parseFloat(r.stock_actual) || 0
    }

    // Calcular cantidad reservada en órdenes PENDIENTE del mismo día
    const reservadoPorCodigo = {}
    const despachosPendientes = resDespachos.data?.data || []
    for (const despacho of despachosPendientes) {
      for (const item of despacho.detalle || []) {
        const cod = item.producto_codigo
        reservadoPorCodigo[cod] = (reservadoPorCodigo[cod] || 0) + parseFloat(item.cant_requerida || 0)
      }
    }

    // Stock disponible = actual - reservado
    stockDisponiblePorCodigo.value = {}
    for (const codigo of Object.keys(stockPorCodigo.value)) {
      const actual = stockPorCodigo.value[codigo]
      const reservado = reservadoPorCodigo[codigo] || 0
      stockDisponiblePorCodigo.value[codigo] = Math.max(0, actual - reservado)
    }
  } catch (e) {
    console.error('Error cargando grid:', e)
  } finally {
    loadingGrid.value = false
  }
}

// Recargar grid cuando cambia cc_destino
watch(() => form.value.cc_destino, (val) => {
  cantidades.value = {}
  cargarGrid(val)
})

// ── CRUD ──────────────────────────────────────────────────────
function abrirNuevo() {
  editandoId.value = null
  formError.value  = ''
  errFecha.value   = ''
  errDestino.value = ''
  cantidades.value = {}
  todosProductos.value  = []
  stockPorCodigo.value  = {}
  stockDisponiblePorCodigo.value = {}
  const bodega = ccostos.value[0]
  form.value = {
    fecha: new Date().toISOString().split('T')[0],
    cc_origen: bodega?.codigo || '',
    cc_destino: '',
    observaciones: '',
  }
  dlgForm.value = true
}

async function abrirEditar(d) {
  dlgDetalle.value = false
  editandoId.value = d.id
  formError.value  = ''
  errFecha.value   = ''
  errDestino.value = ''
  cantidades.value = {}
  todosProductos.value = []
  stockPorCodigo.value = {}
  stockDisponiblePorCodigo.value = {}
  try {
    const res = await api.get(`/almacen/despachos/${d.id}`, { params: { empresa: empresa.value } })
    const orden = res.data?.data
    form.value = {
      fecha: String(orden.fecha).split('T')[0],
      cc_origen: orden.cc_origen,
      cc_destino: orden.cc_destino,
      observaciones: orden.observaciones || '',
    }
    // Pre-popular cantidades desde el detalle existente
    const prevCant = {}
    for (const item of orden.detalle) {
      prevCant[item.producto_codigo] = parseFloat(item.cant_requerida)
    }
    // Cargar grid del cc_destino y luego restaurar cantidades
    await cargarGrid(orden.cc_destino)
    cantidades.value = prevCant
    dlgForm.value = true
  } catch (e) {
    console.error(e)
  }
}

function validar() {
  errFecha.value   = !form.value.fecha      ? 'Requerido' : ''
  errDestino.value = !form.value.cc_destino ? 'Requerido' : ''
  return !errFecha.value && !errDestino.value
}

async function guardar() {
  if (!validar()) return
  guardando.value = true
  formError.value = ''
  try {
    const detalle = Object.entries(cantidades.value)
      .filter(([, v]) => parseFloat(v) > 0)
      .map(([codigo, cant]) => ({ producto_codigo: codigo, cant_requerida: parseFloat(cant) }))

    const payload = {
      empresa: empresa.value,
      fecha: form.value.fecha,
      cc_origen: form.value.cc_origen,
      cc_destino: form.value.cc_destino,
      observaciones: form.value.observaciones,
      creado_por: usuario.value,
      detalle,
    }
    if (editandoId.value) {
      await api.put(`/almacen/despachos/${editandoId.value}`, payload)
    } else {
      await api.post('/almacen/despachos', payload)
    }
    dlgForm.value = false
    await cargar()
  } catch (e) {
    formError.value = e?.response?.data?.error || e.message || 'Error al guardar'
  } finally {
    guardando.value = false
  }
}

async function abrirAnalisisFaltantes() {
  dlgAnalisis.value = true
  cargandoAnalisis.value = true
  analisisFaltantes.value = []
  try {
    const ccOrigen = ccostos.value[0]?.codigo
    const [resDespachos, resStock] = await Promise.all([
      api.get('/almacen/despachos', { params: { empresa: empresa.value, estado: 'PENDIENTE', include_detalle: '1' } }),
      api.get('/almacen/ajuste-inventario/stock', { params: { empresa: empresa.value, ccosto: ccOrigen } }),
    ])

    const despachosPendientes = resDespachos.data?.data || []
    const stockBodega = {}
    const stockRows = resStock.data?.data || []
    for (const r of stockRows) {
      stockBodega[r.codigo] = parseFloat(r.stock_actual) || 0
    }

    // Agrupar por producto: cantidad total requerida en pendientes
    const requeridoPorCodigo = {}
    const productoInfo = {}
    for (const despacho of despachosPendientes) {
      for (const item of despacho.detalle || []) {
        const cod = item.producto_codigo
        requeridoPorCodigo[cod] = (requeridoPorCodigo[cod] || 0) + parseFloat(item.cant_requerida || 0)
        if (!productoInfo[cod]) {
          productoInfo[cod] = {
            codigo: item.producto_codigo,
            nombre: item.producto_nombre,
            und: item.und,
            grupo_nombre: item.grupo_nombre || 'Sin Grupo',
          }
        }
      }
    }

    // Armar análisis
    analisisFaltantes.value = Object.keys(requeridoPorCodigo)
      .map(cod => {
        const requerido = requeridoPorCodigo[cod]
        const disponible = stockBodega[cod] || 0
        const faltante = Math.max(0, requerido - disponible)
        return {
          ...productoInfo[cod],
          requerido,
          disponible,
          faltante,
          ok: faltante === 0,
        }
      })
      .sort((a, b) => {
        if (a.ok !== b.ok) return a.ok ? 1 : -1
        return b.faltante - a.faltante
      })
  } catch (e) {
    console.error('Error cargando análisis:', e)
  } finally {
    cargandoAnalisis.value = false
  }
}

async function abrirDetalle(d) {
  dlgDetalle.value  = true
  detalleActivo.value = null
  try {
    const res = await api.get(`/almacen/despachos/${d.id}`, { params: { empresa: empresa.value } })
    detalleActivo.value = res.data?.data
  } catch (e) {
    console.error(e)
  }
}

async function eliminar(d) {
  if (!confirm(`¿Eliminar la orden #${d.id}?`)) return
  eliminando.value = d.id
  try {
    await api.delete(`/almacen/despachos/${d.id}`, { params: { empresa: empresa.value } })
    await cargar()
  } catch (e) {
    alert(e?.response?.data?.error || 'Error al eliminar')
  } finally {
    eliminando.value = null
  }
}

// ── Imprimir ──────────────────────────────────────────────────
async function imprimirDesdeTabla(d) {
  imprimiendo.value = d.id
  try {
    const res = await api.get(`/almacen/despachos/${d.id}`, { params: { empresa: empresa.value } })
    imprimirDespacho(res.data?.data)
  } catch (e) {
    console.error(e)
  } finally {
    imprimiendo.value = null
  }
}

function imprimirDespacho(o) {
  if (!o) o = detalleActivo.value
  if (!o) return

  // Agrupar detalle por grupo_nombre
  const gruposMap = new Map()
  for (const item of o.detalle) {
    const key = item.grupo_codigo || '__sin_grupo__'
    const nombre = item.grupo_nombre || 'Sin Grupo'
    if (!gruposMap.has(key)) gruposMap.set(key, { nombre, items: [] })
    gruposMap.get(key).items.push(item)
  }

  let filas = ''
  for (const [, grupo] of gruposMap) {
    filas += `<tr>
      <td colspan="5" style="padding:3px 8px;background:#f3f0ff;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#7c3aed;border-bottom:1px solid #e5e7eb">
        ${grupo.nombre}
      </td>
    </tr>`
    for (const item of grupo.items) {
      filas += `<tr>
        <td style="padding:3px 8px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:10px">${item.producto_codigo}</td>
        <td style="padding:3px 8px;border-bottom:1px solid #e5e7eb;font-weight:600;font-size:10px">${item.producto_nombre}</td>
        <td style="padding:3px 8px;border-bottom:1px solid #e5e7eb;color:#555;font-size:9px">${item.descripcion || '—'}</td>
        <td style="padding:3px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:10px">${item.und}</td>
        <td style="padding:3px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700;font-size:10px">${parseFloat(item.cant_requerida)}</td>
      </tr>`
    }
  }

  const color = estadoColor(o.estado)
  const estadoNames = { PENDIENTE:'Pendiente', EN_PICKING:'En Picking', EN_PACKING:'En Packing', COMPLETADO:'Completado', CANCELADO:'Cancelado' }

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
    thead th { padding: 5px 8px; background: #f3f4f6; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; text-align: left; border-bottom: 2px solid #d1d5db; }
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
    <thead><tr>
      <th style="width:90px">CÓDIGO</th>
      <th>PRODUCTO</th>
      <th>DESCRIPCIÓN</th>
      <th style="width:55px;text-align:center">UND</th>
      <th style="width:80px;text-align:center">REQUERIDO</th>
    </tr></thead>
    <tbody>${filas}</tbody>
  </table>
  <div class="firmas">
    <div class="firma-linea">Firma Despachador</div>
    <div class="firma-linea">Firma Receptor</div>
  </div>
  <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`)
  ventana.document.close()
}

onMounted(async () => {
  await cargarCcostos()
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

/* Tabla principal */
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

.badge-id  { background: rgba(4,120,87,.12); color: #047857; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 12px; font-family: monospace; }
.badge-cod { background: rgba(6,182,212,.12); color: #0891b2; padding: 2px 7px; border-radius: 6px; font-weight: 700; font-size: 11px; font-family: monospace; }
.badge-und { background: rgba(139,92,246,.12); color: #8b5cf6; padding: 2px 7px; border-radius: 5px; font-size: 11px; font-weight: 600; }
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

/* Placeholders del grid */
.grid-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 40px; color: rgba(var(--v-theme-on-surface),.4); font-size: 13px; }

/* Grid de productos */
.prod-grid { width: 100%; border-collapse: collapse; font-size: 12px; }
.prod-grid thead { background: rgba(var(--v-theme-on-surface),.04); }
.prod-grid thead th { padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: rgba(var(--v-theme-on-surface),.5); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); }
.pg-cod   { width: 90px; }
.pg-nom   { width: 200px; }
.pg-desc  { }
.pg-stock-bodega { width: 140px; }
.pg-und   { width: 60px; }
.pg-stock { width: 110px; text-align: center !important; }
.pg-cant  { width: 130px; text-align: right !important; }

.pg-grupo-row  { background: rgba(139,92,246,.06); }
.pg-grupo-cell { padding: 6px 10px !important; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.06) !important; }
.pg-grupo-name { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #8b5cf6; }
.pg-grupo-count{ font-size: 11px; color: rgba(var(--v-theme-on-surface),.4); margin-left: 8px; }

.pg-prod-row { border-bottom: 1px solid rgba(var(--v-theme-on-surface),.04); }
.pg-prod-row:hover { background: rgba(var(--v-theme-on-surface),.02); }
.pg-highlighted { background: rgba(4,120,87,.04) !important; }
.pg-highlighted:hover { background: rgba(4,120,87,.07) !important; }
.prod-grid tbody td { padding: 6px 10px; vertical-align: middle; }
.pg-td-nom   { font-weight: 500; }
.pg-td-desc  { font-size: 11px; color: rgba(var(--v-theme-on-surface),.5); }
.pg-td-stock-bodega { font-size: 11px; }
.pg-td-stock { text-align: center; font-family: monospace; font-size: 13px; font-weight: 600; }
.pg-td-cant  { text-align: right; }
.stock-pos  { color: #10b981; }
.stock-zero { color: rgba(var(--v-theme-on-surface),.35); }

.grid-empty { text-align: center !important; padding: 30px !important; color: rgba(var(--v-theme-on-surface),.4); }

.pg-cant-input {
  width: 100px; padding: 5px 10px;
  border: 1px solid rgba(var(--v-theme-on-surface),.15);
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface),.03);
  color: rgb(var(--v-theme-on-surface));
  font-size: 13px; text-align: right; outline: none;
  transition: border-color .15s, background .15s;
}
.pg-cant-input:focus { border-color: #047857; background: rgba(4,120,87,.06); }
.pg-cant-active { border-color: #047857; background: rgba(4,120,87,.08); font-weight: 700; color: #047857; }

/* Detalle dialog */
.detalle-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 4px; }
.detalle-table thead th { padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: rgba(var(--v-theme-on-surface),.5); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); }
.detalle-table tbody tr { border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); }
.detalle-table tbody td { padding: 3px 10px; vertical-align: middle; }
.item-cod { font-size: 11px; color: rgba(var(--v-theme-on-surface),.4); font-family: monospace; }
.item-nom { font-weight: 600; font-size: 13px; }
.num-cell { font-family: monospace; font-size: 13px; }

.dif-ok    { color: #10b981; font-weight: 700; }
.dif-falta { color: #ef4444; font-weight: 700; }
.dif-sobre { color: #f59e0b; font-weight: 700; }
.dif-na    { color: rgba(var(--v-theme-on-surface),.3); }
.row-falta { background: rgba(239,68,68,.04); }
.row-sobre { background: rgba(245,158,11,.04); }

.det-info-row  { display: flex; gap: 24px; flex-wrap: wrap; padding: 12px; background: rgba(var(--v-theme-on-surface),.03); border-radius: 8px; }
.det-info-item { display: flex; flex-direction: column; gap: 2px; }
.det-lbl       { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: rgba(var(--v-theme-on-surface),.5); }
.det-val       { font-size: 13px; font-weight: 600; }
.det-obs       { font-size: 13px; color: rgba(var(--v-theme-on-surface),.6); font-style: italic; padding: 8px 12px; background: rgba(var(--v-theme-on-surface),.03); border-radius: 6px; }
.det-acciones  { display: flex; gap: 8px; }
.det-grupo-row { background: rgba(139,92,246,.07); }
.det-grupo-cell { padding: 5px 10px !important; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #7c3aed; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.06) !important; }

/* Análisis de faltantes */
.ana-stat { background: rgba(var(--v-theme-on-surface),.03); border-radius: 10px; padding: 14px; border-left: 3px solid var(--color); }
.ana-stat-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.4); }
.ana-stat-val { font-size: 24px; font-weight: 800; color: var(--color); margin-top: 4px; }
.ana-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.ana-table thead th { padding: 10px; text-align: left; background: rgba(var(--v-theme-on-surface),.05); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.1); }
.ana-table tbody td { padding: 10px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); }
.ana-row-ok { background: rgba(16,185,129,.04); }
.ana-row-falta { background: rgba(239,68,68,.04); }
.ana-table tbody tr:hover { background: rgba(59,130,246,.08); }
.badge-cod { font-family: monospace; font-size: 11px; font-weight: 700; background: rgba(99,102,241,.1); color: #6366f1; padding: 3px 8px; border-radius: 4px; }
.badge-und { font-size: 10px; font-weight: 700; background: rgba(59,130,246,.1); color: #3b82f6; padding: 2px 6px; border-radius: 4px; }
.stock-pos { color: #10b981; font-weight: 600; }
.stock-zero { color: #6b7280; }
</style>
