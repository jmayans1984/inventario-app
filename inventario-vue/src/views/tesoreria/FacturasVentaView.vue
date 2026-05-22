<template>
  <MainLayout>
    <div class="view-container">
      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">TESORERÍA</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Procesos</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Facturas de Venta</span>
      </div>

      <!-- HEADER -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon-wrap">
            <v-icon size="22" color="white">mdi-receipt-outline</v-icon>
          </div>
          <div>
            <h1 class="page-title">FACTURAS DE VENTA</h1>
            <p class="page-sub">Revisión y aprobación de pagos recibidos de clientes</p>
          </div>
        </div>
      </div>

      <!-- KPI CARDS -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-icon-cyan">
            <v-icon size="20" color="white">mdi-currency-usd-circle-outline</v-icon>
          </div>
          <div class="kpi-body">
            <div class="kpi-label">TOTAL POR COBRAR</div>
            <div class="kpi-value cyan-text">{{ formatMoneda(store.totalPendiente) }}</div>
            <div class="kpi-sub">{{ store.facturasPendientes.length }} facturas pendientes</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-icon-amber">
            <v-icon size="20" color="white">mdi-clock-alert-outline</v-icon>
          </div>
          <div class="kpi-body">
            <div class="kpi-label">POR VERIFICAR</div>
            <div class="kpi-value amber-text">{{ store.totalPorVerificar }}</div>
            <div class="kpi-sub">soportes pendientes de revisión</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-icon-green">
            <v-icon size="20" color="white">mdi-check-circle-outline</v-icon>
          </div>
          <div class="kpi-body">
            <div class="kpi-label">PAGADAS</div>
            <div class="kpi-value green-text">{{ store.facturasPagadas.length }}</div>
            <div class="kpi-sub">facturas cobradas</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-icon-purple">
            <v-icon size="20" color="white">mdi-percent-outline</v-icon>
          </div>
          <div class="kpi-body">
            <div class="kpi-label">% COBRADO</div>
            <div class="kpi-value purple-text">{{ store.porcentajeCobrado }}%</div>
            <div class="kpi-sub">del total de facturas</div>
          </div>
        </div>
      </div>

      <!-- FILTROS -->
      <div class="filtros-bar">
        <div class="tipo-tabs">
          <button
            v-for="tab in estadoTabs"
            :key="tab.value"
            class="tipo-tab"
            :class="{ active: store.filtroEstado === tab.value }"
            @click="store.setFiltroEstado(tab.value)"
          >
            <v-icon size="14">{{ tab.icon }}</v-icon>
            {{ tab.label }}
            <span v-if="tab.badge > 0" class="tab-badge">{{ tab.badge }}</span>
          </button>
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="store.loading" class="loading-wrap">
        <v-progress-circular indeterminate color="primary" size="40" />
        <p class="loading-text">Cargando facturas...</p>
      </div>

      <!-- EMPTY STATE -->
      <div v-else-if="store.facturasFiltradas.length === 0" class="empty-state">
        <v-icon size="48" class="empty-icon">mdi-file-document-outline</v-icon>
        <p class="empty-title">No hay facturas para mostrar</p>
        <p class="empty-sub">No se encontraron facturas con el filtro seleccionado</p>
      </div>

      <!-- TABLA -->
      <div v-else class="tabla-container">
        <div class="tabla-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-codigo sortable" @click="ordenar('codigo')">
                  CÓDIGO
                  <v-icon v-if="ordenActual.campo === 'codigo'" size="12">
                    {{ ordenActual.desc ? 'mdi-arrow-down' : 'mdi-arrow-up' }}
                  </v-icon>
                </th>
                <th class="col-fecha sortable" @click="ordenar('fecha')">
                  FECHA
                  <v-icon v-if="ordenActual.campo === 'fecha'" size="12">
                    {{ ordenActual.desc ? 'mdi-arrow-down' : 'mdi-arrow-up' }}
                  </v-icon>
                </th>
                <th class="col-cliente sortable" @click="ordenar('cliente_nombre')">
                  CLIENTE
                  <v-icon v-if="ordenActual.campo === 'cliente_nombre'" size="12">
                    {{ ordenActual.desc ? 'mdi-arrow-down' : 'mdi-arrow-up' }}
                  </v-icon>
                </th>
                <th class="col-monto sortable" @click="ordenar('total')">MONTO</th>
                <th class="col-pagado sortable" @click="ordenar('valor_pagado')">PAGADO</th>
                <th class="col-pendiente">PENDIENTE</th>
                <th class="col-vencimiento sortable" @click="ordenar('fecha_vencimiento')">VENCIMIENTO</th>
                <th class="col-dias">DÍAS</th>
                <th class="col-estado sortable" @click="ordenar('estado')">ESTADO</th>
                <th class="col-soportes">SOPORTES</th>
                <th class="col-acciones">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="fact in getFacturasOrdenadas()"
                :key="fact.codigo"
                class="tabla-row"
                :class="{ 'row-por-verificar': fact.estado === 'POR VERIFICAR' }"
              >
                <td class="col-codigo">
                  <span class="codigo-badge">{{ fact.codigo }}</span>
                </td>
                <td class="col-fecha">{{ formatFecha(fact.fecha) }}</td>
                <td class="col-cliente">
                  <span class="cliente-nombre">{{ fact.cliente_nombre || fact.cliente }}</span>
                </td>
                <td class="col-monto">
                  <span class="monto-text">{{ formatMoneda(fact.total) }}</span>
                </td>
                <td class="col-pagado">
                  <span v-if="parseFloat(fact.valor_pagado) > 0" class="pagado-text">
                    {{ formatMoneda(fact.valor_pagado) }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td class="col-pendiente">
                  <span class="pendiente-text">
                    {{ formatMoneda(parseFloat(fact.total) - parseFloat(fact.valor_pagado || 0)) }}
                  </span>
                </td>
                <td class="col-vencimiento">{{ formatFecha(fact.fecha_vencimiento) }}</td>
                <td class="col-dias">
                  <v-chip
                    v-if="fact.estado === 'PENDIENTE'"
                    :color="getDiasColor(fact.fecha_vencimiento)"
                    variant="flat"
                    size="small"
                  >
                    {{ calcularDias(fact.fecha_vencimiento) }}
                  </v-chip>
                  <span v-else class="text-muted">-</span>
                </td>
                <td class="col-estado">
                  <v-chip
                    :color="getEstadoColor(fact.estado)"
                    variant="flat"
                    size="x-small"
                  >
                    {{ fact.estado }}
                  </v-chip>
                </td>
                <td class="col-soportes">
                  <span v-if="fact.soportes_count > 0" class="badge-soportes">
                    <v-icon size="14">mdi-file-check</v-icon>
                    {{ fact.soportes_count }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td class="col-acciones">
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="abrirDetalle(fact)"
                    title="Ver detalle y soportes"
                  >
                    <v-icon size="18">mdi-eye-outline</v-icon>
                  </v-btn>
                  <v-btn
                    v-if="fact.estado === 'POR VERIFICAR'"
                    icon
                    size="x-small"
                    variant="text"
                    color="success"
                    @click="abrirAprobacion(fact)"
                    title="Aprobar pago"
                  >
                    <v-icon size="18">mdi-check-circle-outline</v-icon>
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ERROR -->
      <v-alert
        v-if="store.error"
        type="error"
        closable
        class="mt-4"
        @click:close="store.clearError()"
      >
        {{ store.error }}
      </v-alert>
    </div>

    <!-- ══════════════════════ MODAL DETALLE FACTURA ══════════════════════ -->
    <v-dialog v-model="dialogOpen" max-width="720" persistent>
      <v-card class="form-card">
        <div class="form-header">
          <div class="form-header-left">
            <div class="form-header-icon">
              <v-icon size="18" color="white">mdi-receipt-outline</v-icon>
            </div>
            <span class="form-title">DETALLE DE FACTURA</span>
          </div>
          <v-btn icon size="small" variant="text" color="white" @click="cerrarDetalle">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="form-body">
          <div v-if="facturaActual" class="detalle-section">
            <div class="section-title">INFORMACIÓN FACTURA</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">CÓDIGO</span>
                <span class="info-value">{{ facturaActual.codigo }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">CLIENTE</span>
                <span class="info-value">{{ facturaActual.cliente_nombre || facturaActual.cliente }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">FECHA</span>
                <span class="info-value">{{ formatFecha(facturaActual.fecha) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">VENCIMIENTO</span>
                <span class="info-value">{{ formatFecha(facturaActual.fecha_vencimiento) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">ESTADO</span>
                <v-chip :color="getEstadoColor(facturaActual.estado)" variant="flat" size="small">
                  {{ facturaActual.estado }}
                </v-chip>
              </div>
            </div>

            <div class="info-grid mt-4">
              <div class="info-item">
                <span class="info-label">MONTO TOTAL</span>
                <span class="info-value monto">{{ formatMoneda(facturaActual.total) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">PAGADO</span>
                <span class="info-value pagado">{{ formatMoneda(facturaActual.valor_pagado) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">PENDIENTE</span>
                <span class="info-value pendiente">
                  {{ formatMoneda(parseFloat(facturaActual.total) - parseFloat(facturaActual.valor_pagado || 0)) }}
                </span>
              </div>
            </div>

            <div v-if="facturaActual.observaciones" class="observaciones mt-4">
              <span class="info-label">OBSERVACIONES</span>
              <p class="obs-text">{{ facturaActual.observaciones }}</p>
            </div>
          </div>

          <!-- Soportes de Pago -->
          <div class="detalle-section mt-4">
            <div class="section-title">SOPORTES DE PAGO DEL CLIENTE</div>

            <div v-if="store.soportesPagoActual.length > 0" class="soportes-list">
              <div class="soportes-title">
                Comprobantes cargados ({{ store.soportesPagoActual.length }})
              </div>
              <div
                v-for="soporte in store.soportesPagoActual"
                :key="soporte.id"
                class="soporte-item"
              >
                <div class="soporte-info">
                  <v-icon size="16" color="primary">mdi-file-document-outline</v-icon>
                  <div class="soporte-details">
                    <div class="soporte-nombre">{{ soporte.nombre_archivo }}</div>
                    <div class="soporte-fecha">{{ formatFecha(soporte.fecha_subida) }}</div>
                  </div>
                </div>
                <div class="soporte-actions">
                  <button class="btn-previsualizar" @click="previsualizarSoporte(soporte.id)" title="Previsualizar">
                    <v-icon size="16">mdi-eye-outline</v-icon>
                  </button>
                  <button class="btn-descargar" @click="store.descargarSoporte(soporte.id)" title="Descargar">
                    <v-icon size="16">mdi-download</v-icon>
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="no-soportes">
              <v-icon size="32">mdi-file-upload-outline</v-icon>
              <p>El cliente aún no ha cargado soportes de pago</p>
            </div>
          </div>
        </div>

        <div class="form-footer">
          <v-btn variant="text" @click="cerrarDetalle">Cerrar</v-btn>
          <v-btn
            v-if="facturaActual?.estado === 'POR VERIFICAR'"
            color="success"
            variant="elevated"
            prepend-icon="mdi-check-circle-outline"
            @click="pasarAAprobacion"
          >
            Aprobar Pago
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- ══════════════════════ MODAL APROBAR PAGO ══════════════════════ -->
    <v-dialog v-model="aprobacionOpen" max-width="520" persistent>
      <v-card class="form-card">
        <div class="form-header form-header-green">
          <div class="form-header-left">
            <div class="form-header-icon">
              <v-icon size="18" color="white">mdi-check-circle-outline</v-icon>
            </div>
            <span class="form-title">APROBAR PAGO — {{ facturaActual?.codigo }}</span>
          </div>
          <v-btn icon size="small" variant="text" color="white" @click="cerrarAprobacion">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="form-body">
          <!-- Saldo a favor del cliente - SIEMPRE VISIBLE -->
          <div class="saldo-favor-box">
            <div class="saldo-favor-row">
              <span class="saldo-favor-label">
                <v-icon size="16">mdi-wallet-outline</v-icon>
                Saldo a favor del cliente:
              </span>
              <span class="saldo-favor-valor" :class="store.saldoFavorActual > 0 ? 'has-saldo' : 'no-saldo'">
                {{ formatMoneda(store.saldoFavorActual) }}
              </span>
            </div>
            <div v-if="store.saldoFavorActual > 0" class="saldo-favor-check">
              <input type="checkbox" id="usar-saldo" v-model="formPago.usar_saldo_favor" />
              <label for="usar-saldo">Aplicar saldo a favor a este pago</label>
            </div>
          </div>

          <!-- Resumen factura -->
          <div class="resumen-factura">
            <div class="resumen-row">
              <span class="resumen-label">Cliente</span>
              <span class="resumen-valor">{{ facturaActual?.cliente_nombre || facturaActual?.cliente }}</span>
            </div>
            <div class="resumen-row">
              <span class="resumen-label">Monto factura</span>
              <span class="resumen-valor monto">{{ formatMoneda(facturaActual?.total) }}</span>
            </div>
            <div class="resumen-row">
              <span class="resumen-label">Ya pagado</span>
              <span class="resumen-valor pagado">{{ formatMoneda(facturaActual?.valor_pagado) }}</span>
            </div>
            <div class="resumen-row">
              <span class="resumen-label">Saldo pendiente</span>
              <span class="resumen-valor pendiente">
                {{ formatMoneda(parseFloat(facturaActual?.total || 0) - parseFloat(facturaActual?.valor_pagado || 0)) }}
              </span>
            </div>
          </div>

          <v-divider class="my-4" />

          <!-- Campos del formulario -->
          <div class="form-fields">
            <div class="field-group">
              <label class="field-label">Fecha de pago <span class="req">*</span></label>
              <input v-model="formPago.fecha" type="date" class="field-input" :max="hoy" />
            </div>

            <div class="field-group">
              <label class="field-label">Cuenta bancaria donde se recibió <span class="req">*</span></label>
              <select v-model="formPago.banco" class="field-select">
                <option value="">-- Seleccionar cuenta --</option>
                <option
                  v-for="cuenta in cuentasActivas"
                  :key="cuenta.codigo"
                  :value="cuenta.codigo"
                >
                  {{ cuenta.nombre_cta }}
                </option>
              </select>
            </div>

            <div class="field-group">
              <label class="field-label">Valor del pago recibido <span class="req">*</span></label>
              <input
                v-model.number="formPago.valor_pagado"
                type="number"
                min="0.01"
                step="0.01"
                class="field-input"
                placeholder="0.00"
              />
            </div>
          </div>

          <!-- Preview resultado -->
          <div v-if="formPago.valor_pagado > 0 || (formPago.usar_saldo_favor && store.saldoFavorActual > 0)" class="preview-resultado">
            <div class="preview-title">💡 Resultado del pago</div>

            <!-- Si usa saldo a favor -->
            <div v-if="formPago.usar_saldo_favor && store.saldoFavorActual > 0" class="preview-desglose">
              <div class="desglose-row">
                <span>Pago por banco:</span>
                <span class="monto">{{ formatMoneda(formPago.valor_pagado || 0) }}</span>
              </div>
              <div class="desglose-row">
                <span>+ Saldo a favor:</span>
                <span class="monto">{{ formatMoneda(store.saldoFavorActual) }}</span>
              </div>
              <div class="desglose-row desglose-total">
                <span>= Total pago:</span>
                <span class="monto">{{ formatMoneda((formPago.valor_pagado || 0) + store.saldoFavorActual) }}</span>
              </div>
            </div>

            <!-- Casos de pago -->
            <div
              v-if="Math.abs(((formPago.valor_pagado || 0) + (formPago.usar_saldo_favor ? store.saldoFavorActual : 0)) - parseFloat(facturaActual?.total || 0)) < 0.01"
              class="preview-caso pagada"
            >
              <v-icon size="16" color="success">mdi-check-circle</v-icon>
              Pago completo → Factura marcada como <strong>PAGADA</strong>
              <span v-if="formPago.usar_saldo_favor && store.saldoFavorActual > 0" class="caso-sub">(saldo a favor: se anula)</span>
            </div>
            <div
              v-else-if="((formPago.valor_pagado || 0) + (formPago.usar_saldo_favor ? store.saldoFavorActual : 0)) < parseFloat(facturaActual?.total || 0)"
              class="preview-caso parcial"
            >
              <v-icon size="16" color="warning">mdi-alert-circle</v-icon>
              Pago parcial → Factura queda en <strong>PENDIENTE</strong>
              <span v-if="formPago.usar_saldo_favor && store.saldoFavorActual > 0" class="caso-sub">(saldo a favor se consume completamente)</span>
              <span v-else class="caso-sub">(abono de {{ formatMoneda(formPago.valor_pagado) }})</span>
            </div>
            <div v-else class="preview-caso sobrepago">
              <v-icon size="16" color="info">mdi-information</v-icon>
              Sobrepago → Factura <strong>PAGADA</strong> +
              nuevo saldo a favor de <strong>{{ formatMoneda(((formPago.valor_pagado || 0) + (formPago.usar_saldo_favor ? store.saldoFavorActual : 0)) - parseFloat(facturaActual?.total || 0)) }}</strong>
            </div>
          </div>
        </div>

        <div class="form-footer">
          <v-btn variant="text" @click="cerrarAprobacion" :disabled="store.loading">Cancelar</v-btn>
          <v-btn
            color="success"
            variant="elevated"
            prepend-icon="mdi-check-circle-outline"
            @click="confirmarPago"
            :loading="store.loading"
            :disabled="!formPagoValido"
          >
            Confirmar Pago
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- FILE PREVIEW MODAL -->
    <FilePreviewModal
      :open="previewModalOpen"
      :file-name="previewFileName"
      :file-data="previewFileData"
      :file-size="previewFileSize"
      :download-function="descargarDesdePreview"
      @close="previewModalOpen = false"
    />
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import FilePreviewModal from '../../components/modules/tesoreria/FilePreviewModal.vue'
import { useFacturasVentaProveedorStore } from '../../stores/facturas-venta-proveedor'
import { useCuentasBancariasStore } from '../../stores/cuentasbancarias'
import api from '../../services/api'
import { formatMoneda, formatFecha } from '../../utils/formatters'

const store        = useFacturasVentaProveedorStore()
const cuentasStore = useCuentasBancariasStore()

// ── Estado modales ────────────────────────────────────────────────────────
const dialogOpen     = ref(false)
const aprobacionOpen = ref(false)
const facturaActual  = ref(null)

// ── Preview modal ─────────────────────────────────────────────────────────
const previewModalOpen = ref(false)
const previewFileName  = ref('')
const previewFileData  = ref('')
const previewFileSize  = ref(0)
const previewSoporteId = ref(null)

// ── Formulario pago ───────────────────────────────────────────────────────
const formPago = ref({ fecha: '', banco: '', valor_pagado: null, usar_saldo_favor: false })
const hoy = new Date().toISOString().split('T')[0]

// ── Tabs de estado ────────────────────────────────────────────────────────
const estadoTabs = computed(() => [
  { value: 'TODOS',         label: 'Todos',         icon: 'mdi-view-list',            badge: 0 },
  { value: 'PENDIENTE',     label: 'Pendientes',    icon: 'mdi-alert-circle-outline',  badge: 0 },
  { value: 'POR VERIFICAR', label: 'Por Verificar', icon: 'mdi-clock-outline',         badge: store.totalPorVerificar },
  { value: 'PAGADA',        label: 'Pagadas',       icon: 'mdi-check-circle-outline',  badge: 0 },
])

// ── Cuentas bancarias activas ─────────────────────────────────────────────
const cuentasActivas = computed(() =>
  cuentasStore.cuentas.filter(c => c.estado === 'ACTIVA')
)

// ── Validación formulario ─────────────────────────────────────────────────
const formPagoValido = computed(() =>
  formPago.value.fecha &&
  formPago.value.banco &&
  formPago.value.valor_pagado > 0
)

// ── Ordenamiento ──────────────────────────────────────────────────────────
const ordenActual = ref({ campo: 'codigo', desc: true })

function ordenar(campo) {
  if (ordenActual.value.campo === campo) {
    ordenActual.value.desc = !ordenActual.value.desc
  } else {
    ordenActual.value.campo = campo
    ordenActual.value.desc = true
  }
}

function getFacturasOrdenadas() {
  const lista = [...store.facturasFiltradas]
  lista.sort((a, b) => {
    let valA = a[ordenActual.value.campo]
    let valB = b[ordenActual.value.campo]
    if (typeof valA === 'string' && !isNaN(parseFloat(valA))) valA = parseFloat(valA)
    if (typeof valB === 'string' && !isNaN(parseFloat(valB))) valB = parseFloat(valB)
    if (valA < valB) return ordenActual.value.desc ? 1 : -1
    if (valA > valB) return ordenActual.value.desc ? -1 : 1
    return 0
  })
  return lista
}

// ── Helpers ───────────────────────────────────────────────────────────────
function calcularDias(fecha_vencimiento) {
  const hoyDate = new Date()
  const venc = new Date(fecha_vencimiento)
  return Math.floor((venc - hoyDate) / (1000 * 60 * 60 * 24))
}

function getDiasColor(fecha_vencimiento) {
  const dias = calcularDias(fecha_vencimiento)
  if (dias < 0) return 'error'
  if (dias <= 7) return 'warning'
  return 'success'
}

function getEstadoColor(estado) {
  const map = { 'PENDIENTE': 'warning', 'PAGADA': 'success', 'POR VERIFICAR': 'info' }
  return map[estado] || 'default'
}

// ── Modal Detalle ─────────────────────────────────────────────────────────
async function abrirDetalle(factura) {
  facturaActual.value = factura
  await store.fetchSoportesPago(factura.codigo)
  dialogOpen.value = true
}

function cerrarDetalle() {
  dialogOpen.value = false
  facturaActual.value = null
  store.limpiarSoportes()
}

// ── Modal Aprobación ──────────────────────────────────────────────────────
async function abrirAprobacion(factura) {
  facturaActual.value = factura
  formPago.value = { fecha: hoy, banco: '', valor_pagado: null, usar_saldo_favor: false }
  await store.fetchSaldoFavor(factura.cliente)
  aprobacionOpen.value = true
}

function pasarAAprobacion() {
  // Desde el modal detalle al modal de aprobación
  dialogOpen.value = false
  formPago.value = { fecha: hoy, banco: '', valor_pagado: null, usar_saldo_favor: false }
  store.fetchSaldoFavor(facturaActual.value.cliente)
  aprobacionOpen.value = true
}

function cerrarAprobacion() {
  aprobacionOpen.value = false
  store.limpiarSoportes()
  facturaActual.value = null
}

async function confirmarPago() {
  if (!formPagoValido.value) return
  try {
    const result = await store.aprobarPago(facturaActual.value.codigo, formPago.value)
    cerrarAprobacion()
    await store.fetchFacturas()
    alert(result.message || 'Pago aprobado exitosamente')
  } catch (err) {
    console.error('Error confirmando pago:', err)
    alert('Error al aprobar el pago: ' + (err.response?.data?.error || err.message))
  }
}

// ── Previsualizar Soporte ─────────────────────────────────────────────────
async function previsualizarSoporte(soporteId) {
  try {
    const infoResponse = await api.get(`/tesoreria/soportes/${soporteId}/info`)
    const infoData = infoResponse.data
    if (!infoData.success) throw new Error('No se pudo obtener información del archivo')

    const fileSize = infoData.data.archivo_size
    const MAX_MODAL_SIZE = 5 * 1024 * 1024

    if (fileSize > MAX_MODAL_SIZE) {
      window.open(`${api.defaults.baseURL}/tesoreria/soportes/${soporteId}/descargar`, '_blank')
      return
    }

    const fileResponse = await api.get(`/tesoreria/soportes/${soporteId}/preview`, {
      responseType: 'blob'
    })
    const fileUrl = URL.createObjectURL(fileResponse.data)
    const soporteInfo = store.soportesPagoActual.find(s => s.id === soporteId)

    previewFileName.value  = soporteInfo?.nombre_archivo || 'archivo'
    previewFileData.value  = fileUrl
    previewFileSize.value  = fileSize
    previewSoporteId.value = soporteId
    previewModalOpen.value = true
  } catch (err) {
    console.error('Error previsualizando archivo:', err)
    alert('Error al previsualizar el archivo')
  }
}

async function descargarDesdePreview() {
  try {
    await store.descargarSoporte(previewSoporteId.value)
    previewModalOpen.value = false
  } catch (err) {
    console.error('Error descargando:', err)
    alert('Error al descargar el archivo')
  }
}

// ── Inicialización ────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([
    store.fetchFacturas(),
    cuentasStore.fetchCuentas()
  ])
})
</script>

<style scoped>
.view-container { padding: 24px; max-width: 1400px; margin: 0 auto; }

/* Breadcrumb */
.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 12px; font-weight: 700; color: #8b5cf6; text-transform: uppercase; letter-spacing: 0.5px; }
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.3); }
.bc-cat { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.8); font-weight: 500; }

/* Header */
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.header-left { display: flex; align-items: center; gap: 16px; }
.header-icon-wrap {
  width: 48px; height: 48px; border-radius: 12px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 14px rgba(139, 92, 246, 0.35);
}
.page-title { font-size: 20px; font-weight: 800; letter-spacing: 0.5px; margin: 0; }
.page-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 2px 0 0; }

/* KPI Cards */
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 20px; }
.kpi-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px; padding: 16px 20px;
  display: flex; align-items: center; gap: 16px;
}
.kpi-icon-wrap { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.kpi-icon-cyan   { background: linear-gradient(135deg, #06b6d4, #0891b2); box-shadow: 0 4px 12px rgba(6,182,212,0.3); }
.kpi-icon-amber  { background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 4px 12px rgba(245,158,11,0.3); }
.kpi-icon-green  { background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
.kpi-icon-purple { background: linear-gradient(135deg, #8b5cf6, #7c3aed); box-shadow: 0 4px 12px rgba(139,92,246,0.3); }
.kpi-body { flex: 1; min-width: 0; }
.kpi-label { font-size: 10px; font-weight: 700; color: rgba(var(--v-theme-on-surface), 0.5); text-transform: uppercase; letter-spacing: 0.5px; }
.kpi-value { font-size: 22px; font-weight: 800; margin: 2px 0; }
.kpi-sub { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5); }
.cyan-text   { color: #06b6d4 !important; }
.amber-text  { color: #f59e0b !important; }
.green-text  { color: #10b981 !important; }
.purple-text { color: #8b5cf6 !important; }

/* Filtros */
.filtros-bar { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
.tipo-tabs { display: flex; gap: 4px; }
.tipo-tab {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 8px; border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  font-size: 12px; font-weight: 600; cursor: pointer;
  background: transparent; color: rgba(var(--v-theme-on-surface), 0.6);
  transition: all 0.15s;
}
.tipo-tab:hover { background: rgba(var(--v-theme-on-surface), 0.04); }
.tipo-tab.active { background: #8b5cf6; border-color: #8b5cf6; color: #fff; }
.tab-badge {
  background: #ef4444; color: #fff; border-radius: 10px;
  padding: 1px 6px; font-size: 10px; font-weight: 700; min-width: 18px; text-align: center;
}

/* Loading / Empty */
.loading-wrap { text-align: center; padding: 60px; }
.loading-text { color: rgba(var(--v-theme-on-surface), 0.5); font-size: 13px; margin-top: 12px; }
.empty-state {
  text-align: center; padding: 80px 24px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08); border-radius: 12px;
}
.empty-icon { color: rgba(var(--v-theme-on-surface), 0.15); display: block; margin: 0 auto 12px; }
.empty-title { font-size: 16px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); margin: 0 0 4px; }
.empty-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.4); margin: 0; }

/* Tabla */
.tabla-container { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface), 0.08); border-radius: 12px; overflow: hidden; }
.tabla-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table thead { background: rgba(var(--v-theme-on-surface), 0.04); }
.data-table thead th {
  padding: 12px 10px; text-align: left; font-weight: 700;
  font-size: 11px; letter-spacing: 0.5px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.6);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  white-space: nowrap; vertical-align: middle;
}
.data-table thead th.sortable { cursor: pointer; user-select: none; transition: color 0.15s; }
.data-table thead th.sortable:hover { color: #8b5cf6; }
.data-table tbody tr { border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); }
.data-table tbody tr:hover { background: rgba(var(--v-theme-on-surface), 0.02); }
.data-table tbody tr.row-por-verificar { background: rgba(245, 158, 11, 0.05); }
.data-table tbody td { padding: 11px 10px; color: rgb(var(--v-theme-on-surface)); }

.col-codigo      { width: 100px; }
.col-fecha       { width: 90px; white-space: nowrap; }
.col-cliente     { min-width: 150px; }
.col-monto       { width: 115px; text-align: right; }
.col-pagado      { width: 100px; text-align: right; }
.col-pendiente   { width: 100px; text-align: right; }
.col-vencimiento { width: 90px; white-space: nowrap; }
.col-dias        { width: 70px; text-align: center; }
.col-estado      { width: 115px; }
.col-soportes    { width: 80px; text-align: center; }
.col-acciones    { width: 90px; text-align: center; }

.codigo-badge { background: rgba(139,92,246,0.12); color: #8b5cf6; padding: 3px 8px; border-radius: 6px; font-weight: 600; font-size: 11px; font-family: 'Courier New', monospace; }
.cliente-nombre { font-weight: 600; font-size: 13px; }
.monto-text   { color: #8b5cf6; font-weight: 600; font-family: 'Courier New', monospace; }
.pagado-text  { color: #10b981; font-weight: 600; }
.pendiente-text { color: #f59e0b; font-weight: 600; }
.badge-soportes { display: inline-flex; align-items: center; gap: 4px; background: rgba(16,185,129,0.12); color: #10b981; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; }
.text-muted { color: rgba(var(--v-theme-on-surface), 0.3); }

/* Modales */
.form-card { border-radius: 16px !important; overflow: hidden; }
.form-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}
.form-header-green { background: linear-gradient(135deg, #10b981, #059669) !important; }
.form-header-left { display: flex; align-items: center; gap: 10px; }
.form-header-icon { width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; }
.form-title { font-size: 14px; font-weight: 700; letter-spacing: 0.5px; color: #fff; }

.form-body { padding: 20px; display: flex; flex-direction: column; gap: 12px; max-height: 75vh; overflow-y: auto; }

.detalle-section { padding: 0 0 16px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08); }
.section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: rgba(var(--v-theme-on-surface), 0.6); margin-bottom: 12px; letter-spacing: 0.5px; }

.info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
.info-item { display: flex; flex-direction: column; gap: 4px; }
.info-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: rgba(var(--v-theme-on-surface), 0.5); letter-spacing: 0.5px; }
.info-value { font-size: 14px; font-weight: 600; color: rgb(var(--v-theme-on-surface)); }
.info-value.monto    { color: #8b5cf6; font-family: 'Courier New', monospace; }
.info-value.pagado   { color: #10b981; }
.info-value.pendiente { color: #f59e0b; }

.observaciones { padding: 12px; background: rgba(var(--v-theme-on-surface), 0.03); border-radius: 8px; }
.obs-text { margin: 8px 0 0; font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.7); line-height: 1.4; }

.soportes-list { margin-top: 12px; }
.soportes-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: rgba(var(--v-theme-on-surface), 0.6); margin-bottom: 12px; letter-spacing: 0.5px; }
.soporte-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 8px; background: rgba(var(--v-theme-on-surface), 0.03); border: 1px solid rgba(var(--v-theme-on-surface), 0.08); margin-bottom: 8px; }
.soporte-info { display: flex; align-items: flex-start; gap: 10px; flex: 1; min-width: 0; }
.soporte-details { min-width: 0; }
.soporte-nombre { font-size: 13px; font-weight: 600; word-break: break-word; }
.soporte-fecha { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5); margin-top: 2px; }
.soporte-actions { display: flex; gap: 4px; flex-shrink: 0; }
.btn-previsualizar, .btn-descargar { background: transparent; border: none; cursor: pointer; padding: 4px 8px; color: #8b5cf6; transition: all 0.15s; }
.btn-previsualizar:hover, .btn-descargar:hover { color: #7c3aed; }
.no-soportes { text-align: center; padding: 32px 24px; color: rgba(var(--v-theme-on-surface), 0.3); }
.no-soportes p { margin: 8px 0 0; font-size: 13px; }

/* Modal Aprobación */
.saldo-favor-box { padding: 14px 16px; background: linear-gradient(135deg, rgba(139,92,246,0.08), rgba(139,92,246,0.04)); border: 1px solid rgba(139,92,246,0.2); border-radius: 10px; }
.saldo-favor-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.saldo-favor-label { font-size: 13px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.8); display: flex; align-items: center; gap: 6px; }
.saldo-favor-valor { font-size: 16px; font-weight: 700; }
.saldo-favor-valor.has-saldo { color: #8b5cf6; }
.saldo-favor-valor.no-saldo { color: rgba(var(--v-theme-on-surface), 0.4); }
.saldo-favor-check { margin-top: 10px; display: flex; align-items: center; gap: 8px; font-size: 12px; }
.saldo-favor-check input[type="checkbox"] { cursor: pointer; width: 16px; height: 16px; accent-color: #8b5cf6; }
.saldo-favor-check label { cursor: pointer; color: rgba(var(--v-theme-on-surface), 0.7); }

.saldo-favor-alert { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: rgba(6,182,212,0.08); border: 1px solid rgba(6,182,212,0.2); border-radius: 10px; font-size: 13px; }

.resumen-factura { background: rgba(var(--v-theme-on-surface), 0.03); border-radius: 10px; padding: 14px 16px; }
.resumen-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06); }
.resumen-row:last-child { border-bottom: none; }
.resumen-label { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.6); }
.resumen-valor { font-size: 13px; font-weight: 600; }
.resumen-valor.monto    { color: #8b5cf6; }
.resumen-valor.pagado   { color: #10b981; }
.resumen-valor.pendiente { color: #f59e0b; }

.form-fields { display: flex; flex-direction: column; gap: 14px; }
.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 12px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.7); }
.req { color: #ef4444; }
.field-input, .field-select {
  width: 100%; padding: 9px 12px; border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.18);
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  font-size: 14px; outline: none; transition: border-color 0.15s;
  box-sizing: border-box;
}
.field-input:focus, .field-select:focus { border-color: #10b981; }

.preview-resultado { background: rgba(var(--v-theme-on-surface), 0.03); border-radius: 10px; padding: 14px 16px; }
.preview-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: rgba(var(--v-theme-on-surface), 0.5); letter-spacing: 0.5px; margin-bottom: 8px; }
.preview-caso { display: flex; align-items: center; gap: 8px; font-size: 13px; padding: 6px 0; flex-wrap: wrap; }
.preview-caso.pagada   { color: #10b981; }
.preview-caso.parcial  { color: #f59e0b; }
.preview-caso.sobrepago { color: #06b6d4; }
.caso-sub { display: block; width: 100%; font-size: 11px; margin-top: 4px; opacity: 0.9; }

.preview-desglose { padding: 10px; background: rgba(139,92,246,0.06); border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #8b5cf6; }
.desglose-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; padding: 5px 0; }
.desglose-row .monto { font-weight: 600; font-family: 'Courier New', monospace; color: #8b5cf6; }
.desglose-total { padding: 8px 0; margin-top: 5px; border-top: 1px solid rgba(139,92,246,0.2); font-weight: 600; }

.form-footer { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08); }

.mt-4 { margin-top: 16px; }
.my-4 { margin: 16px 0; }
</style>
