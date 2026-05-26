<template>
  <MainLayout>
    <div class="oc-container">

      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">PRODUCCIÓN</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Procesos</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Órdenes de Compra Recibidas</span>
      </div>

      <!-- HEADER -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <v-icon size="24" color="white">mdi-clipboard-list-outline</v-icon>
          </div>
          <div>
            <h1 class="page-title">ÓRDENES DE COMPRA RECIBIDAS</h1>
            <p class="page-sub">Órdenes de todas las empresas cliente</p>
          </div>
        </div>
        <v-btn color="#06b6d4" variant="flat" prepend-icon="mdi-refresh" :loading="loading" @click="cargar">
          Actualizar
        </v-btn>
      </div>

      <!-- KPI CARDS -->
      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(234,179,8,.15)">
            <v-icon color="#ca8a04">mdi-clock-outline</v-icon>
          </div>
          <div>
            <div class="kpi-val">{{ kpiPendientes }}</div>
            <div class="kpi-lbl">Pendientes</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(59,130,246,.15)">
            <v-icon color="#2563eb">mdi-truck-check-outline</v-icon>
          </div>
          <div>
            <div class="kpi-val">{{ kpiEntregadas }}</div>
            <div class="kpi-lbl">Entregadas (sin facturar)</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(34,197,94,.15)">
            <v-icon color="#16a34a">mdi-receipt-text-check-outline</v-icon>
          </div>
          <div>
            <div class="kpi-val">{{ kpiFacturadas }}</div>
            <div class="kpi-lbl">Facturadas</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(6,182,212,.15)">
            <v-icon color="#0891b2">mdi-cash-multiple</v-icon>
          </div>
          <div>
            <div class="kpi-val">{{ fmtMonto(kpiTotal) }}</div>
            <div class="kpi-lbl">Total (filtro actual)</div>
          </div>
        </div>
      </div>

      <!-- TABS DE ESTADO -->
      <div class="tabs-row">
        <button
          v-for="tab in tabs"
          :key="tab.val"
          class="tab-btn"
          :class="{ active: filtroEstado === tab.val }"
          @click="filtroEstado = tab.val"
        >
          {{ tab.label }}
          <span class="tab-count">{{ contarEstado(tab.val) }}</span>
        </button>
      </div>

      <!-- BUSCADOR -->
      <div class="toolbar">
        <div class="search-wrap">
          <v-icon size="17" color="rgba(var(--v-theme-on-surface),.4)">mdi-magnify</v-icon>
          <input v-model="busqueda" type="text" placeholder="Buscar por código, cliente, empresa..." class="search-input" />
        </div>
        <span class="count-badge">{{ filasFiltradas.length }} órdenes</span>
      </div>

      <!-- TABLA -->
      <div class="tabla-card">
        <div v-if="loading" class="loading-wrap">
          <v-progress-circular indeterminate color="#06b6d4" size="36" />
        </div>
        <div v-else-if="filasFiltradas.length === 0" class="empty-wrap">
          <v-icon size="48" color="rgba(var(--v-theme-on-surface),.15)">mdi-clipboard-off-outline</v-icon>
          <p>No hay órdenes para mostrar</p>
        </div>
        <table v-else class="crud-table">
          <thead>
            <tr>
              <th>CÓDIGO</th>
              <th>FECHA</th>
              <th>EMPRESA CLIENTE</th>
              <th>TIPO PRECIO</th>
              <th class="col-center">F. ENTREGA</th>
              <th class="col-right">TOTAL</th>
              <th class="col-center">ESTADO</th>
              <th class="col-center">SOPORTES</th>
              <th class="col-acc">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="oc in filasFiltradas" :key="oc.codigo" class="data-row">
              <td><span class="cod-badge">{{ oc.codigo }}</span></td>
              <td class="fecha-cell">{{ fmtFecha(oc.fecha) }}</td>
              <td class="empresa-cell">{{ oc.empresa_nombre || oc.empresa }}</td>
              <td class="tipo-cell">{{ oc.tipo_precio }}</td>
              <td class="col-center fecha-cell">{{ oc.fecha_entrega ? fmtFecha(oc.fecha_entrega) : '—' }}</td>
              <td class="col-right monto-cell">{{ fmtMonto(oc.total) }}</td>
              <td class="col-center">
                <span :class="chipClass(oc.estado)">{{ oc.estado }}</span>
              </td>
              <td class="col-center">
                <span v-if="parseInt(oc.soportes_count) > 0" class="soporte-badge-ok">
                  <v-icon size="13">mdi-paperclip</v-icon> {{ oc.soportes_count }}
                </span>
                <span v-else-if="oc.estado === 'ENTREGADA'" class="soporte-badge-warn" title="Sin soportes de entrega">
                  <v-icon size="13">mdi-alert-outline</v-icon> Sin soporte
                </span>
                <span v-else class="soporte-badge-none">—</span>
              </td>
              <td class="col-acc">
                <!-- Ver detalle -->
                <v-btn icon="mdi-eye-outline" size="x-small" variant="text" color="#06b6d4"
                       @click="verDetalle(oc)" />
                <!-- Editar (solo PENDIENTE) -->
                <v-btn v-if="oc.estado === 'PENDIENTE'"
                       icon="mdi-pencil-outline" size="x-small" variant="text" color="primary"
                       @click="abrirEditar(oc)" />
                <!-- Entregar (solo PENDIENTE) -->
                <v-btn v-if="oc.estado === 'PENDIENTE'"
                       icon="mdi-truck-delivery-outline" size="x-small" variant="text" color="#f59e0b"
                       :loading="entregando === oc.codigo"
                       @click="confirmarEntrega(oc)" />
                <!-- Generar Factura (solo ENTREGADA) -->
                <v-tooltip v-if="oc.estado === 'ENTREGADA'" :text="parseInt(oc.soportes_count) === 0 ? 'Debe tener al menos 1 soporte de entrega' : 'Generar Factura'" location="top">
                  <template #activator="{ props }">
                    <span v-bind="props">
                      <v-btn icon="mdi-receipt-text-plus-outline" size="x-small" variant="text"
                             :color="parseInt(oc.soportes_count) > 0 ? '#16a34a' : 'rgba(var(--v-theme-on-surface),.25)'"
                             :loading="facturando === oc.codigo"
                             :disabled="parseInt(oc.soportes_count) === 0"
                             @click="confirmarFactura(oc)" />
                    </span>
                  </template>
                </v-tooltip>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ===== MODAL VER DETALLE ===== -->
      <v-dialog v-model="modalVer" max-width="640" scrollable>
        <v-card class="modal-card">
          <div class="modal-header">
            <v-icon color="#06b6d4" class="mr-2">mdi-clipboard-text-outline</v-icon>
            <span>Detalle — {{ ocActual?.codigo }}</span>
            <v-spacer />
            <v-btn icon="mdi-close" size="small" variant="text" @click="modalVer = false" />
          </div>
          <div class="modal-body" v-if="ocActual">
            <!-- Info cabecera -->
            <div class="det-grid">
              <div class="det-field">
                <span class="det-lbl">Empresa Cliente</span>
                <span class="det-val">{{ ocActual.empresa_nombre || ocActual.empresa }}</span>
              </div>
              <div class="det-field">
                <span class="det-lbl">Fecha</span>
                <span class="det-val">{{ fmtFecha(ocActual.fecha) }}</span>
              </div>
              <div class="det-field">
                <span class="det-lbl">Tipo Precio</span>
                <span class="det-val">{{ ocActual.tipo_precio }}</span>
              </div>
              <div class="det-field">
                <span class="det-lbl">Días Crédito</span>
                <span class="det-val">{{ ocActual.dias_credito }}</span>
              </div>
              <div class="det-field">
                <span class="det-lbl">Fecha Entrega</span>
                <span class="det-val">{{ ocActual.fecha_entrega ? fmtFecha(ocActual.fecha_entrega) : '—' }}</span>
              </div>
              <div class="det-field">
                <span class="det-lbl">Estado</span>
                <span :class="chipClass(ocActual.estado)">{{ ocActual.estado }}</span>
              </div>
              <div class="det-field full-width" v-if="ocActual.observaciones">
                <span class="det-lbl">Observaciones</span>
                <span class="det-val">{{ ocActual.observaciones }}</span>
              </div>
            </div>

            <!-- Tabla de productos -->
            <div class="prod-section">
              <div class="prod-header">Productos de la Orden</div>
              <div v-if="loadingDetalles" class="loading-wrap-sm">
                <v-progress-circular indeterminate color="#06b6d4" size="24" />
              </div>
              <table v-else class="prod-table">
                <thead>
                  <tr>
                    <th>CÓDIGO</th>
                    <th>PRODUCTO</th>
                    <th class="col-right">CANT</th>
                    <th class="col-right">P. UNIT</th>
                    <th class="col-right">SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="detallesActuales.length === 0">
                    <td colspan="5" class="empty-row">Sin productos</td>
                  </tr>
                  <tr v-for="d in detallesActuales" :key="d.id">
                    <td><span class="cod-sm">{{ d.producto_venta }}</span></td>
                    <td>{{ d.nombre_producto || d.producto_nombre }}</td>
                    <td class="col-right">{{ d.cantidad }}</td>
                    <td class="col-right">{{ fmtMonto(d.precio_unitario) }}</td>
                    <td class="col-right fw-bold">{{ fmtMonto(d.subtotal) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td colspan="4" class="col-right fw-bold">TOTAL</td>
                    <td class="col-right fw-bold total-val">{{ fmtMonto(ocActual.total) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Soportes de Entrega -->
            <div class="prod-section">
              <div class="prod-header" style="display:flex;align-items:center;gap:8px;">
                <span>Soportes de Entrega</span>
                <span v-if="!loadingSoportes" class="soporte-count">{{ soportesEntrega.length }}</span>
              </div>
              <div v-if="loadingSoportes" class="loading-wrap-sm">
                <v-progress-circular indeterminate color="#06b6d4" size="24" />
              </div>
              <div v-else-if="soportesEntrega.length === 0" class="soporte-empty">
                <v-icon size="28" color="rgba(var(--v-theme-on-surface),.2)">mdi-image-off-outline</v-icon>
                <span>Sin soportes de entrega</span>
              </div>
              <div v-else class="soporte-grid">
                <div
                  v-for="s in soportesEntrega"
                  :key="s.id"
                  class="soporte-thumb"
                  @click="abrirSoporte(s)"
                >
                  <img
                    v-if="s.archivo_data && !s.archivo_data.includes('application/pdf')"
                    :src="s.archivo_data"
                    :alt="s.nombre_archivo"
                    class="thumb-img"
                  />
                  <div v-else class="thumb-pdf">
                    <v-icon size="32" color="#ef4444">mdi-file-pdf-box</v-icon>
                  </div>
                  <div class="thumb-info">
                    <span class="thumb-num">Soporte #{{ s.numero_soporte || s.id }}</span>
                    <span class="thumb-fecha">{{ fmtFecha(s.fecha_subida) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <v-btn variant="text" @click="modalVer = false">Cerrar</v-btn>
            <v-btn v-if="ocActual?.estado === 'PENDIENTE'" color="primary" variant="flat"
                   prepend-icon="mdi-pencil-outline" @click="modalVer = false; abrirEditar(ocActual)">
              Editar
            </v-btn>
            <v-btn v-if="ocActual?.estado === 'PENDIENTE'" color="#f59e0b" variant="flat"
                   prepend-icon="mdi-truck-delivery-outline" @click="modalVer = false; confirmarEntrega(ocActual)">
              Marcar Entregada
            </v-btn>
            <v-tooltip v-if="ocActual?.estado === 'ENTREGADA'"
                       :text="parseInt(ocActual?.soportes_count) === 0 ? 'Debe tener al menos 1 soporte de entrega' : 'Generar Factura'"
                       location="top">
              <template #activator="{ props }">
                <span v-bind="props">
                  <v-btn color="#16a34a" variant="flat"
                         prepend-icon="mdi-receipt-text-plus-outline"
                         :disabled="parseInt(ocActual?.soportes_count) === 0"
                         @click="modalVer = false; confirmarFactura(ocActual)">
                    Generar Factura
                  </v-btn>
                </span>
              </template>
            </v-tooltip>
          </div>
        </v-card>
      </v-dialog>

      <!-- ===== MODAL EDITAR ===== -->
      <v-dialog v-model="modalEditar" max-width="680" scrollable persistent>
        <v-card class="modal-card">
          <div class="modal-header">
            <v-icon color="primary" class="mr-2">mdi-pencil-outline</v-icon>
            <span>Editar Orden — {{ editForm.codigo }}</span>
            <v-spacer />
            <v-btn icon="mdi-close" size="small" variant="text" @click="modalEditar = false" />
          </div>
          <div class="modal-body">
            <div class="det-grid">
              <div class="det-field">
                <span class="det-lbl">Empresa Cliente</span>
                <span class="det-val">{{ ocActual?.empresa_nombre || ocActual?.empresa }}</span>
              </div>
              <div class="det-field">
                <span class="det-lbl">Tipo Precio</span>
                <span class="det-val">{{ ocActual?.tipo_precio }}</span>
              </div>
            </div>

            <!-- Fecha entrega -->
            <div class="field-group mt-3">
              <label class="field-label">Fecha de Entrega</label>
              <input v-model="editForm.fecha_entrega" type="date" class="field-input" />
            </div>

            <!-- Observaciones -->
            <div class="field-group">
              <label class="field-label">Observaciones</label>
              <textarea v-model="editForm.observaciones" rows="2" class="field-input" placeholder="Observaciones..."></textarea>
            </div>

            <!-- Productos editables -->
            <div class="prod-section">
              <div class="prod-header">Productos (editar cantidades)</div>
              <div v-if="loadingDetalles" class="loading-wrap-sm">
                <v-progress-circular indeterminate color="#06b6d4" size="24" />
              </div>
              <table v-else class="prod-table">
                <thead>
                  <tr>
                    <th>CÓDIGO</th>
                    <th>PRODUCTO</th>
                    <th class="col-right">P. UNIT</th>
                    <th class="col-right" style="width:110px">CANTIDAD</th>
                    <th class="col-right">SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(d, i) in editDetalles" :key="i">
                    <td><span class="cod-sm">{{ d.producto_venta }}</span></td>
                    <td>{{ d.nombre_producto || d.producto_nombre }}</td>
                    <td class="col-right">{{ fmtMonto(d.precio_unitario) }}</td>
                    <td class="col-right">
                      <input
                        v-model.number="d.cantidad"
                        type="number" min="0" step="1"
                        class="cant-input"
                        @input="recalcSubtotal(d)"
                      />
                    </td>
                    <td class="col-right fw-bold">{{ fmtMonto(d.subtotal) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td colspan="4" class="col-right fw-bold">TOTAL</td>
                    <td class="col-right fw-bold total-val">{{ fmtMonto(editTotal) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div v-if="errEditar" class="api-error mt-3">{{ errEditar }}</div>
          </div>
          <div class="modal-footer">
            <v-btn variant="text" @click="modalEditar = false">Cancelar</v-btn>
            <v-btn color="primary" variant="flat" :loading="guardandoEdit" @click="guardarEditar">
              Guardar Cambios
            </v-btn>
          </div>
        </v-card>
      </v-dialog>

      <!-- ===== MODAL CONFIRMAR ENTREGA ===== -->
      <v-dialog v-model="modalEntrega" max-width="420" persistent>
        <v-card class="modal-card">
          <div class="modal-header">
            <v-icon color="#f59e0b" class="mr-2">mdi-truck-delivery-outline</v-icon>
            <span>Confirmar Entrega</span>
            <v-spacer />
            <v-btn icon="mdi-close" size="small" variant="text" @click="modalEntrega = false" />
          </div>
          <div class="modal-body">
            <div class="confirm-msg">
              <p>¿Confirmas que la orden <strong>{{ ocActual?.codigo }}</strong> fue entregada completa al cliente
              <strong>{{ ocActual?.empresa_nombre || ocActual?.empresa }}</strong>?</p>
              <p class="sub-note">El estado cambiará a <span class="chip-entregada">ENTREGADA</span> y podrás generar la factura.</p>
            </div>
            <div v-if="errEntrega" class="api-error mt-3">{{ errEntrega }}</div>
          </div>
          <div class="modal-footer">
            <v-btn variant="text" @click="modalEntrega = false">Cancelar</v-btn>
            <v-btn color="#f59e0b" variant="flat" :loading="guardandoEntrega" @click="ejecutarEntrega">
              Confirmar Entrega
            </v-btn>
          </div>
        </v-card>
      </v-dialog>

      <!-- ===== MODAL GENERAR FACTURA ===== -->
      <v-dialog v-model="modalFactura" max-width="460" persistent>
        <v-card class="modal-card">
          <div class="modal-header">
            <v-icon color="#16a34a" class="mr-2">mdi-receipt-text-plus-outline</v-icon>
            <span>Generar Factura de Venta</span>
            <v-spacer />
            <v-btn icon="mdi-close" size="small" variant="text" @click="modalFactura = false" />
          </div>
          <div class="modal-body">
            <div class="confirm-msg">
              <p>Se generará una <strong>Factura de Venta</strong> para la orden
              <strong>{{ ocActual?.codigo }}</strong>.</p>
              <div class="fact-preview">
                <div class="fp-row">
                  <span>Cliente:</span>
                  <strong>{{ ocActual?.empresa_nombre || ocActual?.empresa }}</strong>
                </div>
                <div class="fp-row">
                  <span>Total Factura:</span>
                  <strong class="fp-total">{{ fmtMonto(ocActual?.total) }}</strong>
                </div>
                <div class="fp-row">
                  <span>Estado inicial:</span>
                  <span class="chip-pendiente">PENDIENTE</span>
                </div>
              </div>
              <p class="sub-note">La orden quedará marcada como <span class="chip-facturada">FACTURADA</span>. El cliente podrá ver y pagar esta factura desde su módulo de Tesorería.</p>
            </div>
            <div v-if="facturaGenerada" class="success-box">
              <v-icon color="#16a34a" size="20">mdi-check-circle</v-icon>
              Factura <strong>{{ facturaGenerada }}</strong> generada exitosamente
            </div>
            <div v-if="errFactura" class="api-error mt-3">{{ errFactura }}</div>
          </div>
          <div class="modal-footer">
            <v-btn variant="text" @click="cerrarModalFactura">{{ facturaGenerada ? 'Cerrar' : 'Cancelar' }}</v-btn>
            <v-btn v-if="!facturaGenerada" color="#16a34a" variant="flat" :loading="guardandoFactura" @click="ejecutarFactura">
              Generar Factura
            </v-btn>
          </div>
        </v-card>
      </v-dialog>

      <!-- ===== MODAL PREVISUALIZAR SOPORTE ===== -->
      <v-dialog v-model="modalSoporte" max-width="720">
        <v-card class="modal-card">
          <div class="modal-header">
            <v-icon color="#06b6d4" class="mr-2">mdi-image-outline</v-icon>
            <span>{{ soporteActual?.nombre_archivo }}</span>
            <v-spacer />
            <span class="soporte-num-badge" v-if="soporteActual">Soporte #{{ soporteActual.numero_soporte || soporteActual.id }}</span>
            <v-btn icon="mdi-close" size="small" variant="text" class="ml-2" @click="modalSoporte = false" />
          </div>
          <div class="soporte-preview-body" v-if="soporteActual">
            <img
              v-if="soporteActual.archivo_data && !soporteActual.archivo_data.includes('application/pdf')"
              :src="soporteActual.archivo_data"
              :alt="soporteActual.nombre_archivo"
              class="soporte-full-img"
            />
            <div v-else class="soporte-pdf-msg">
              <v-icon size="64" color="#ef4444">mdi-file-pdf-box</v-icon>
              <p>Archivo PDF — no se puede previsualizar</p>
            </div>
            <div class="soporte-meta">
              <span>Fecha: {{ fmtFechaHora(soporteActual.fecha_subida) }}</span>
              <a :href="soporteActual.archivo_data" :download="soporteActual.nombre_archivo" class="descargar-link">
                <v-icon size="16">mdi-download</v-icon> Descargar
              </a>
            </div>
          </div>
        </v-card>
      </v-dialog>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'

// ── Estado principal ──────────────────────────────────────────────
const ordenes        = ref([])
const loading        = ref(false)
const busqueda       = ref('')
const filtroEstado   = ref('TODAS')

// Detalle modal
const modalVer        = ref(false)
const ocActual        = ref(null)
const detallesActuales  = ref([])
const loadingDetalles   = ref(false)
const soportesEntrega   = ref([])
const loadingSoportes   = ref(false)

// Soporte preview
const modalSoporte    = ref(false)
const soporteActual   = ref(null)

// Editar modal
const modalEditar    = ref(false)
const editForm       = ref({ codigo: '', fecha_entrega: '', observaciones: '', estado: '' })
const editDetalles   = ref([])
const guardandoEdit  = ref(false)
const errEditar      = ref('')

// Entregar modal
const modalEntrega   = ref(false)
const guardandoEntrega = ref(false)
const errEntrega     = ref('')
const entregando     = ref(null)

// Factura modal
const modalFactura   = ref(false)
const guardandoFactura = ref(false)
const errFactura     = ref('')
const facturando     = ref(null)
const facturaGenerada = ref('')

// ── Tabs ──────────────────────────────────────────────────────────
const tabs = [
  { val: 'TODAS',     label: 'Todas' },
  { val: 'PENDIENTE', label: 'Pendientes' },
  { val: 'ENTREGADA', label: 'Entregadas' },
  { val: 'FACTURADA', label: 'Facturadas' },
]

// ── Computeds ─────────────────────────────────────────────────────
const filasFiltradas = computed(() => {
  const q = busqueda.value.toLowerCase()
  return ordenes.value.filter(oc => {
    const matchEstado = filtroEstado.value === 'TODAS' || oc.estado === filtroEstado.value
    const matchQ = !q ||
      oc.codigo.toLowerCase().includes(q) ||
      (oc.empresa_nombre || '').toLowerCase().includes(q) ||
      String(oc.empresa).toLowerCase().includes(q)
    return matchEstado && matchQ
  })
})

const kpiPendientes  = computed(() => ordenes.value.filter(o => o.estado === 'PENDIENTE').length)
const kpiEntregadas  = computed(() => ordenes.value.filter(o => o.estado === 'ENTREGADA').length)
const kpiFacturadas  = computed(() => ordenes.value.filter(o => o.estado === 'FACTURADA').length)
const kpiTotal       = computed(() => filasFiltradas.value.reduce((s, o) => s + parseFloat(o.total || 0), 0))

const editTotal = computed(() =>
  editDetalles.value.reduce((s, d) => s + parseFloat(d.subtotal || 0), 0)
)

// ── Helpers ───────────────────────────────────────────────────────
function fmtFecha(f) {
  if (!f) return '—'
  const d = new Date(f)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
}

function fmtMonto(v) {
  const n = parseFloat(v) || 0
  return '$' + n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function chipClass(estado) {
  if (estado === 'PENDIENTE')  return 'chip-pendiente'
  if (estado === 'ENTREGADA')  return 'chip-entregada'
  if (estado === 'FACTURADA')  return 'chip-facturada'
  return 'chip-pendiente'
}

function contarEstado(val) {
  if (val === 'TODAS') return ordenes.value.length
  return ordenes.value.filter(o => o.estado === val).length
}

function recalcSubtotal(d) {
  d.subtotal = (parseFloat(d.cantidad) || 0) * (parseFloat(d.precio_unitario) || 0)
}

// ── Cargar datos ──────────────────────────────────────────────────
async function cargar() {
  loading.value = true
  try {
    const r = await api.get('/ordenes-compra/todas')
    ordenes.value = r.data?.data || []
  } catch (e) { console.error(e) } finally { loading.value = false }
}

async function cargarDetalles(codigo) {
  loadingDetalles.value = true
  detallesActuales.value = []
  try {
    const r = await api.get(`/ordenes-compra/${codigo}/detalles`)
    detallesActuales.value = r.data?.detalles || []
  } catch (e) { console.error(e) } finally { loadingDetalles.value = false }
}

async function cargarSoportes(codigo) {
  loadingSoportes.value = true
  soportesEntrega.value = []
  try {
    const r = await api.get(`/soportes-entrega/${codigo}`)
    soportesEntrega.value = r.data?.data || []
  } catch (e) {
    soportesEntrega.value = []
  } finally { loadingSoportes.value = false }
}

function abrirSoporte(s) {
  soporteActual.value = s
  modalSoporte.value = true
}

function fmtFechaHora(f) {
  if (!f) return '—'
  const d = new Date(f)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Ver detalle ───────────────────────────────────────────────────
async function verDetalle(oc) {
  ocActual.value = oc
  soportesEntrega.value = []
  modalVer.value = true
  cargarDetalles(oc.codigo)
  cargarSoportes(oc.codigo)
}

// ── Editar ────────────────────────────────────────────────────────
async function abrirEditar(oc) {
  ocActual.value = oc
  errEditar.value = ''
  editForm.value = {
    codigo: oc.codigo,
    fecha_entrega: oc.fecha_entrega ? oc.fecha_entrega.substring(0, 10) : '',
    observaciones: oc.observaciones || '',
    estado: oc.estado,
  }
  modalEditar.value = true
  loadingDetalles.value = true
  editDetalles.value = []
  try {
    const r = await api.get(`/ordenes-compra/${oc.codigo}/detalles`)
    editDetalles.value = (r.data?.detalles || []).map(d => ({ ...d }))
  } catch (e) { console.error(e) } finally { loadingDetalles.value = false }
}

async function guardarEditar() {
  guardandoEdit.value = true
  errEditar.value = ''
  try {
    const payload = {
      fecha_entrega: editForm.value.fecha_entrega || null,
      observaciones: editForm.value.observaciones,
      estado: 'PENDIENTE',
      total: editTotal.value,
      detalles: editDetalles.value.filter(d => parseFloat(d.cantidad) > 0).map(d => ({
        producto_venta: d.producto_venta,
        cantidad: parseFloat(d.cantidad),
        precio_unitario: parseFloat(d.precio_unitario),
        subtotal: parseFloat(d.subtotal),
      })),
    }
    await api.put(`/ordenes-compra/${editForm.value.codigo}`, payload)
    // Actualizar local
    const idx = ordenes.value.findIndex(o => o.codigo === editForm.value.codigo)
    if (idx >= 0) {
      ordenes.value[idx] = {
        ...ordenes.value[idx],
        fecha_entrega: editForm.value.fecha_entrega || null,
        observaciones: editForm.value.observaciones,
        total: editTotal.value,
      }
    }
    modalEditar.value = false
  } catch (e) {
    errEditar.value = e?.response?.data?.error || e.message
  } finally { guardandoEdit.value = false }
}

// ── Entregar ──────────────────────────────────────────────────────
function confirmarEntrega(oc) {
  ocActual.value = oc
  errEntrega.value = ''
  modalEntrega.value = true
}

async function ejecutarEntrega() {
  guardandoEntrega.value = true
  errEntrega.value = ''
  entregando.value = ocActual.value.codigo
  try {
    await api.put(`/ordenes-compra/${ocActual.value.codigo}/procesar-recepcion`, { entrega_completa: true })
    const idx = ordenes.value.findIndex(o => o.codigo === ocActual.value.codigo)
    if (idx >= 0) ordenes.value[idx] = { ...ordenes.value[idx], estado: 'ENTREGADA' }
    modalEntrega.value = false
  } catch (e) {
    errEntrega.value = e?.response?.data?.error || e.message
  } finally { guardandoEntrega.value = false; entregando.value = null }
}

// ── Generar Factura ───────────────────────────────────────────────
function confirmarFactura(oc) {
  ocActual.value = oc
  errFactura.value = ''
  facturaGenerada.value = ''
  modalFactura.value = true
}

async function ejecutarFactura() {
  guardandoFactura.value = true
  errFactura.value = ''
  facturando.value = ocActual.value.codigo
  try {
    const r = await api.post(`/ordenes-compra/${ocActual.value.codigo}/generar-factura`, {})
    facturaGenerada.value = r.data?.factura || ''
    const idx = ordenes.value.findIndex(o => o.codigo === ocActual.value.codigo)
    if (idx >= 0) ordenes.value[idx] = { ...ordenes.value[idx], estado: 'FACTURADA' }
  } catch (e) {
    errFactura.value = e?.response?.data?.error || e.message
  } finally { guardandoFactura.value = false; facturando.value = null }
}

function cerrarModalFactura() {
  modalFactura.value = false
  facturaGenerada.value = ''
  errFactura.value = ''
}

onMounted(cargar)
</script>

<style scoped>
.oc-container { padding: 24px; max-width: 1200px; margin: 0 auto; }

/* Breadcrumb */
.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.45); }
.bc-root { color: #06b6d4; }
.bc-sep { color: rgba(var(--v-theme-on-surface),.25) !important; }
.bc-current { color: rgba(var(--v-theme-on-surface),.7); }

/* Header */
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
.header-left { display: flex; align-items: center; gap: 14px; }
.header-icon { width: 46px; height: 46px; border-radius: 12px; background: linear-gradient(135deg,#06b6d4,#0891b2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.page-title { font-size: 17px; font-weight: 800; letter-spacing: .5px; margin: 0; color: rgb(var(--v-theme-on-surface)); }
.page-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }

/* KPI Cards */
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
.kpi-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 12px; padding: 14px 16px; display: flex; align-items: center; gap: 14px; }
.kpi-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.kpi-val { font-size: 22px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); line-height: 1.1; }
.kpi-lbl { font-size: 11px; color: rgba(var(--v-theme-on-surface),.5); font-weight: 500; margin-top: 2px; }

/* Tabs */
.tabs-row { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }
.tab-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 20px; border: 1px solid rgba(var(--v-theme-on-surface),.12); background: transparent; cursor: pointer; font-size: 12px; font-weight: 600; color: rgba(var(--v-theme-on-surface),.6); transition: all .15s; }
.tab-btn:hover { background: rgba(var(--v-theme-on-surface),.04); }
.tab-btn.active { background: #06b6d4; border-color: #06b6d4; color: #fff; }
.tab-count { background: rgba(var(--v-theme-on-surface),.12); border-radius: 10px; padding: 1px 7px; font-size: 10px; }
.tab-btn.active .tab-count { background: rgba(255,255,255,.25); }

/* Toolbar */
.toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.search-wrap { display: flex; align-items: center; gap: 8px; flex: 1; padding: 8px 12px; background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.1); border-radius: 8px; }
.search-input { flex: 1; border: none; background: transparent; outline: none; font-size: 13px; color: rgb(var(--v-theme-on-surface)); }
.search-input::placeholder { color: rgba(var(--v-theme-on-surface),.35); }
.count-badge { font-size: 12px; font-weight: 600; color: rgba(var(--v-theme-on-surface),.45); white-space: nowrap; }

/* Table card */
.tabla-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 12px; overflow: hidden; }
.loading-wrap { display: flex; justify-content: center; padding: 48px; }
.empty-wrap { display: flex; flex-direction: column; align-items: center; padding: 56px; gap: 10px; color: rgba(var(--v-theme-on-surface),.35); font-size: 13px; }
.crud-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.crud-table thead th { padding: 11px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.45); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); text-align: left; white-space: nowrap; }
.col-center { text-align: center !important; }
.col-right { text-align: right !important; }
.col-acc { width: 130px; text-align: center !important; white-space: nowrap; }
.data-row td { padding: 9px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); color: rgb(var(--v-theme-on-surface)); vertical-align: middle; white-space: nowrap; }
.data-row:last-child td { border-bottom: none; }
.data-row:hover td { background: rgba(var(--v-theme-on-surface),.02); }

.cod-badge { background: rgba(6,182,212,.12); color: #06b6d4; padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 700; font-family: monospace; }
.cod-sm { background: rgba(6,182,212,.1); color: #06b6d4; padding: 1px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; font-family: monospace; }
.fecha-cell { font-size: 12px; color: rgba(var(--v-theme-on-surface),.7); }
.empresa-cell { font-weight: 600; max-width: 180px; overflow: hidden; text-overflow: ellipsis; }
.tipo-cell { font-size: 12px; color: rgba(var(--v-theme-on-surface),.65); }
.monto-cell { font-weight: 700; font-family: monospace; }
.fw-bold { font-weight: 700 !important; }

/* Estado chips */
.chip-pendiente { background: rgba(234,179,8,.15); color: #b45309; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; white-space: nowrap; }
.chip-entregada { background: rgba(59,130,246,.15); color: #2563eb; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; white-space: nowrap; }
.chip-facturada { background: rgba(34,197,94,.15); color: #16a34a; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; white-space: nowrap; }

/* Modal */
.modal-card { border-radius: 14px !important; overflow: hidden; }
.modal-header { display: flex; align-items: center; padding: 16px 20px; background: rgba(var(--v-theme-on-surface),.03); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); font-weight: 700; font-size: 15px; }
.modal-body { padding: 20px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid rgba(var(--v-theme-on-surface),.07); flex-wrap: wrap; }

/* Detail grid */
.det-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; }
.det-field { display: flex; flex-direction: column; gap: 3px; }
.det-field.full-width { grid-column: 1 / -1; }
.det-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.45); }
.det-val { font-size: 13px; font-weight: 500; color: rgb(var(--v-theme-on-surface)); }

/* Products table inside modal */
.prod-section { margin-top: 18px; }
.prod-header { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.45); margin-bottom: 8px; }
.loading-wrap-sm { display: flex; justify-content: center; padding: 20px; }
.prod-table { width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 8px; overflow: hidden; }
.prod-table thead th { padding: 8px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: rgba(var(--v-theme-on-surface),.45); background: rgba(var(--v-theme-on-surface),.03); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); text-align: left; }
.prod-table tbody td { padding: 8px 10px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); color: rgb(var(--v-theme-on-surface)); }
.prod-table tbody tr:last-child td { border-bottom: none; }
.prod-table tfoot td { padding: 8px 10px; border-top: 1px solid rgba(var(--v-theme-on-surface),.1); }
.total-row { background: rgba(var(--v-theme-on-surface),.02); }
.total-val { color: #06b6d4; font-size: 14px; }
.empty-row { text-align: center !important; padding: 20px !important; color: rgba(var(--v-theme-on-surface),.35); }

/* Form fields */
.field-group { margin-bottom: 14px; }
.field-label { display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.5); margin-bottom: 5px; }
.field-input { width: 100%; padding: 9px 12px; border: 1px solid rgba(var(--v-theme-on-surface),.15); border-radius: 8px; font-size: 13px; background: rgba(var(--v-theme-on-surface),.03); color: rgb(var(--v-theme-on-surface)); outline: none; transition: border-color .2s; box-sizing: border-box; resize: vertical; }
.field-input:focus { border-color: #06b6d4; }
.mt-3 { margin-top: 12px; }

/* Cantidad input inline */
.cant-input { width: 80px; padding: 4px 8px; border: 1px solid rgba(var(--v-theme-on-surface),.15); border-radius: 6px; font-size: 13px; background: rgba(var(--v-theme-on-surface),.03); color: rgb(var(--v-theme-on-surface)); outline: none; text-align: right; }
.cant-input:focus { border-color: #06b6d4; }

/* Confirm modals */
.confirm-msg { font-size: 13px; color: rgb(var(--v-theme-on-surface)); line-height: 1.6; }
.confirm-msg p { margin: 0 0 10px; }
.sub-note { color: rgba(var(--v-theme-on-surface),.6); font-size: 12px; }

/* Factura preview */
.fact-preview { background: rgba(var(--v-theme-on-surface),.04); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 8px; padding: 12px 14px; margin: 12px 0; display: flex; flex-direction: column; gap: 8px; }
.fp-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: rgba(var(--v-theme-on-surface),.7); }
.fp-total { color: #16a34a; font-size: 15px; }

/* Success / error */
.success-box { background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.25); border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #16a34a; display: flex; align-items: center; gap: 8px; margin-top: 10px; }
.api-error { background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.2); border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #ef4444; }

/* Badges de soporte en tabla */
.soporte-badge-ok   { display:inline-flex; align-items:center; gap:3px; background:rgba(34,197,94,.12); color:#16a34a; font-size:11px; font-weight:700; padding:2px 8px; border-radius:10px; white-space:nowrap; }
.soporte-badge-warn { display:inline-flex; align-items:center; gap:3px; background:rgba(239,68,68,.1); color:#dc2626; font-size:11px; font-weight:700; padding:2px 8px; border-radius:10px; white-space:nowrap; }
.soporte-badge-none { color:rgba(var(--v-theme-on-surface),.3); font-size:12px; }

/* Soportes de entrega */
.soporte-count { background: rgba(6,182,212,.15); color: #0891b2; font-size: 11px; font-weight: 700; padding: 1px 8px; border-radius: 10px; }
.soporte-empty { display: flex; align-items: center; gap: 8px; padding: 16px 0; color: rgba(var(--v-theme-on-surface),.35); font-size: 12px; }
.soporte-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; margin-top: 8px; }
.soporte-thumb { border: 1px solid rgba(var(--v-theme-on-surface),.1); border-radius: 8px; overflow: hidden; cursor: pointer; transition: box-shadow .15s, transform .15s; background: rgba(var(--v-theme-on-surface),.02); }
.soporte-thumb:hover { box-shadow: 0 4px 14px rgba(6,182,212,.2); transform: translateY(-2px); border-color: #06b6d4; }
.thumb-img { width: 100%; height: 100px; object-fit: cover; display: block; }
.thumb-pdf { width: 100%; height: 100px; display: flex; align-items: center; justify-content: center; background: rgba(239,68,68,.05); }
.thumb-info { padding: 6px 8px; display: flex; flex-direction: column; gap: 2px; }
.thumb-num { font-size: 11px; font-weight: 700; color: #06b6d4; }
.thumb-fecha { font-size: 10px; color: rgba(var(--v-theme-on-surface),.45); }

/* Preview modal */
.soporte-preview-body { padding: 16px 20px 20px; display: flex; flex-direction: column; gap: 12px; }
.soporte-full-img { width: 100%; max-height: 520px; object-fit: contain; border-radius: 8px; background: rgba(var(--v-theme-on-surface),.03); border: 1px solid rgba(var(--v-theme-on-surface),.08); }
.soporte-pdf-msg { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px; color: rgba(var(--v-theme-on-surface),.5); font-size: 13px; }
.soporte-meta { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); }
.soporte-num-badge { background: rgba(6,182,212,.12); color: #0891b2; font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 10px; }
.descargar-link { display: flex; align-items: center; gap: 4px; color: #06b6d4; text-decoration: none; font-weight: 600; font-size: 12px; }
.descargar-link:hover { text-decoration: underline; }

@media (max-width: 900px) {
  .kpi-row { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .kpi-row { grid-template-columns: 1fr; }
  .det-grid { grid-template-columns: 1fr; }
}
</style>
