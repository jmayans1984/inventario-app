<template>
  <MainLayout>
    <div class="view-container">
      <PageHeader
        title="Facturas de Compra"
        description="Gestión de facturas recibidas y soportes de pago"
        :crumbs="['Tesorería', 'Procesos', 'Facturas de Compra']"
      />

      <!-- KPI CARDS -->
      <div class="kpi-grid">
        <KpiCard :index="0" label="Pendiente por Pagar" :value="formatMoneda(store.totalPendiente)" icon="mdi-currency-usd-circle-outline" color="var(--indigo)" :hint="`${store.cantidadPendientes} facturas`" />
        <KpiCard :index="1" label="Vencido" :value="formatMoneda(store.totalVencido)" icon="mdi-alert-circle-outline" color="var(--error)" :hint="`${store.facturasVencidas.length} facturas`" />
        <KpiCard :index="2" label="Próximas a Vencer" :value="String(store.facturasProximas.length)" icon="mdi-calendar-alert-outline" color="var(--gold)" hint="en los próximos 30 días" />
        <KpiCard :index="3" label="% Cobrado" :value="`${store.porcentajeCobro}%`" icon="mdi-percent-outline" color="var(--success)" hint="del total de facturas" />
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
            <div class="tab-content">
              <div class="tab-header">
                <v-icon size="14">{{ tab.icon }}</v-icon>
                {{ tab.label }}
                <span v-if="tab.badge > 0" class="tab-badge">{{ tab.badge }}</span>
              </div>
              <!-- Mostrar total pendiente para PENDIENTE, total para POR VERIFICAR -->
              <div v-if="tab.value === 'PENDIENTE' && store.totalPendiente > 0" class="tab-subtext">
                {{ formatMoneda(store.totalPendiente) }}
              </div>
              <div v-if="tab.value === 'POR VERIFICAR' && totalPorVerificar > 0" class="tab-subtext">
                {{ formatMoneda(totalPorVerificar) }}
              </div>
            </div>
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
                  <span class="header-text">
                    CÓDIGO
                    <v-icon v-if="ordenActual.campo === 'codigo'" size="12" class="sort-icon">
                      {{ ordenActual.desc ? 'mdi-arrow-down' : 'mdi-arrow-up' }}
                    </v-icon>
                  </span>
                </th>
                <th class="col-fecha sortable" @click="ordenar('fecha')">
                  FECHA
                  <v-icon v-if="ordenActual.campo === 'fecha'" size="12" class="sort-icon">
                    {{ ordenActual.desc ? 'mdi-arrow-down' : 'mdi-arrow-up' }}
                  </v-icon>
                </th>
                <th class="col-monto sortable" @click="ordenar('total')">
                  MONTO
                  <v-icon v-if="ordenActual.campo === 'total'" size="12" class="sort-icon">
                    {{ ordenActual.desc ? 'mdi-arrow-down' : 'mdi-arrow-up' }}
                  </v-icon>
                </th>
                <th class="col-pagado sortable" @click="ordenar('valor_pagado')">
                  PAGADO
                  <v-icon v-if="ordenActual.campo === 'valor_pagado'" size="12" class="sort-icon">
                    {{ ordenActual.desc ? 'mdi-arrow-down' : 'mdi-arrow-up' }}
                  </v-icon>
                </th>
                <th class="col-pendiente sortable" @click="ordenar('pendiente')">
                  PENDIENTE
                  <v-icon v-if="ordenActual.campo === 'pendiente'" size="12" class="sort-icon">
                    {{ ordenActual.desc ? 'mdi-arrow-down' : 'mdi-arrow-up' }}
                  </v-icon>
                </th>
                <th class="col-vencimiento sortable" @click="ordenar('fecha_vencimiento')">
                  VENCIMIENTO
                  <v-icon v-if="ordenActual.campo === 'fecha_vencimiento'" size="12" class="sort-icon">
                    {{ ordenActual.desc ? 'mdi-arrow-down' : 'mdi-arrow-up' }}
                  </v-icon>
                </th>
                <th class="col-dias">DÍAS</th>
                <th class="col-estado sortable" @click="ordenar('estado')">
                  ESTADO
                  <v-icon v-if="ordenActual.campo === 'estado'" size="12" class="sort-icon">
                    {{ ordenActual.desc ? 'mdi-arrow-down' : 'mdi-arrow-up' }}
                  </v-icon>
                </th>
                <th class="col-soportes">SOPORTES</th>
                <th class="col-acciones">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="fact in getFacturasOrdenadasYFiltradas()"
                :key="fact.codigo"
                class="tabla-row"
                :class="{ 'row-vencido': isVencido(fact) }"
              >
                <td class="col-codigo">
                  <span class="codigo-badge">{{ fact.codigo }}</span>
                </td>
                <td class="col-fecha">{{ formatFecha(fact.fecha) }}</td>
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
                    {{ formatMoneda(parseFloat(fact.total) - parseFloat(fact.valor_pagado)) }}
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
                  <div style="display:flex;align-items:center;justify-content:center;gap:2px">
                    <v-btn icon size="x-small" variant="text" @click="abrirDetalle(fact)" title="Ver detalle">
                      <v-icon size="18">mdi-eye-outline</v-icon>
                    </v-btn>
                    <v-btn icon size="x-small" variant="text" color="#06b6d4" @click="imprimirFactura(fact.codigo)" title="Ver PDF">
                      <v-icon size="18">mdi-file-pdf-box</v-icon>
                    </v-btn>
                  </div>
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

    <!-- MODAL DETALLE FACTURA -->
    <v-dialog v-model="dialogOpen" max-width="700">
      <v-card class="form-card">
        <div class="form-header">
          <div class="form-header-left">
            <div class="form-header-icon">
              <v-icon size="18" color="white">mdi-file-invoice-outline</v-icon>
            </div>
            <span class="form-title">DETALLE DE FACTURA</span>
          </div>
          <v-btn icon size="small" variant="text" @click="cerrarDetalle">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="form-body">
          <!-- Info Factura -->
          <div v-if="facturaActual" class="detalle-section">
            <div class="section-title">INFORMACIÓN FACTURA</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">CÓDIGO</span>
                <span class="info-value">{{ facturaActual.codigo }}</span>
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
                  {{ formatMoneda(parseFloat(facturaActual.total) - parseFloat(facturaActual.valor_pagado)) }}
                </span>
              </div>
            </div>

            <div v-if="facturaActual.observaciones" class="observaciones">
              <span class="info-label">OBSERVACIONES</span>
              <p class="obs-text">{{ facturaActual.observaciones }}</p>
            </div>
          </div>

          <!-- Soportes de Pago -->
          <div class="detalle-section mt-4">
            <div class="section-title">SOPORTES DE PAGO</div>

            <!-- Subir Soporte (solo si PENDIENTE) -->
            <div v-if="facturaActual?.estado === 'PENDIENTE'" class="subir-soporte-wrap">
              <div class="file-input-area">
                <input
                  ref="fileInput"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif"
                  style="display: none"
                  @change="onArchivoSeleccionado"
                />
                <button
                  class="btn-subir"
                  @click="$refs.fileInput.click()"
                  :disabled="cargandoArchivo"
                >
                  <v-icon size="20">mdi-cloud-upload-outline</v-icon>
                  <span>Seleccionar archivo</span>
                </button>
                <p class="file-help">PDF, JPG, PNG o GIF (máx 10MB)</p>
              </div>

              <div v-if="archivoSeleccionado" class="archivo-preview">
                <v-icon size="16">mdi-check-circle</v-icon>
                <span>{{ archivoSeleccionado.name }}</span>
                <button class="btn-limpiar" @click="archivoSeleccionado = null">
                  <v-icon size="14">mdi-close</v-icon>
                </button>
              </div>

              <button
                v-if="archivoSeleccionado"
                class="btn-guardar-soporte"
                @click="guardarSoportePago"
                :disabled="cargandoArchivo"
              >
                <v-progress-circular
                  v-if="cargandoArchivo"
                  indeterminate
                  size="16"
                  class="mr-2"
                />
                {{ cargandoArchivo ? 'Subiendo...' : 'Guardar Soporte' }}
              </button>
            </div>

            <!-- Listado Soportes -->
            <div v-if="store.soportesPagoActual.length > 0" class="soportes-list">
              <div class="soportes-title">Soportes cargados ({{ store.soportesPagoActual.length }})</div>
              <div v-for="soporte in store.soportesPagoActual" :key="soporte.id" class="soporte-item">
                <div class="soporte-info">
                  <v-icon size="16">mdi-file-document-outline</v-icon>
                  <div class="soporte-details">
                    <div class="soporte-nombre">{{ soporte.nombre_archivo }}</div>
                    <div class="soporte-fecha">{{ formatFecha(soporte.fecha_subida) }}</div>
                  </div>
                </div>
                <div class="soporte-actions">
                  <button class="btn-previsualizar" @click="previsualizarSoporte(soporte.id)" title="Previsualizar">
                    <v-icon size="16">mdi-eye-outline</v-icon>
                  </button>
                  <button class="btn-descargar" @click="descargarSoporte(soporte.id)" title="Descargar">
                    <v-icon size="16">mdi-download</v-icon>
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="no-soportes">
              <v-icon size="32">mdi-file-upload-outline</v-icon>
              <p>No hay soportes cargados</p>
            </div>
          </div>
        </div>

        <div class="form-footer">
          <v-btn variant="text" @click="cerrarDetalle" :disabled="cargandoArchivo">
            Cerrar
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
import PageHeader from '../../components/common/PageHeader.vue'
import KpiCard from '../../components/common/KpiCard.vue'
import FilePreviewModal from '../../components/modules/tesoreria/FilePreviewModal.vue'
import { useFacturasCompraClienteStore } from '../../stores/facturas-compra-cliente'
import api from '../../services/api'
import { formatMoneda, formatFecha } from '../../utils/formatters'

const store = useFacturasCompraClienteStore()

// Estado del modal
const dialogOpen = ref(false)
const facturaActual = ref(null)
const fileInput = ref(null)
const archivoSeleccionado = ref(null)
const cargandoArchivo = ref(false)

// Estado del preview modal
const previewModalOpen = ref(false)
const previewFileName = ref('')
const previewFileData = ref('')
const previewFileSize = ref(0)
const previewSoporteId = ref(null)

// Total pendiente en facturas POR VERIFICAR
const totalPorVerificar = computed(() =>
  store.facturasPorVerificar.reduce(
    (sum, f) => sum + (parseFloat(f.total || 0) - parseFloat(f.valor_pagado || 0)), 0
  )
)

// Tabs de estado con badges
const estadoTabs = computed(() => [
  { value: 'TODOS', label: 'Todos', icon: 'mdi-view-list', badge: 0 },
  { value: 'PENDIENTE', label: 'Pendientes', icon: 'mdi-alert-circle-outline', badge: store.facturasPendientes.length },
  { value: 'PAGADA', label: 'Pagadas', icon: 'mdi-check-circle-outline', badge: 0 },
  { value: 'POR VERIFICAR', label: 'Por Verificar', icon: 'mdi-clock-outline', badge: store.facturasPorVerificar.length },
])

// Estado del ordenamiento - por defecto CODIGO descendente
const ordenActual = ref({
  campo: 'codigo',
  desc: true
})

// Helpers
function calcularDias(fecha_vencimiento) {
  const hoy = new Date()
  const vencimiento = new Date(fecha_vencimiento)
  const diferencia = Math.floor((vencimiento - hoy) / (1000 * 60 * 60 * 24))
  return diferencia
}

function isVencido(factura) {
  return factura.estado === 'PENDIENTE' && calcularDias(factura.fecha_vencimiento) < 0
}

function getDiasColor(fecha_vencimiento) {
  const dias = calcularDias(fecha_vencimiento)
  if (dias < 0) return 'error'
  if (dias <= 7) return 'warning'
  return 'success'
}

function getEstadoColor(estado) {
  const map = {
    'PENDIENTE': 'warning',
    'PAGADA': 'success',
    'POR VERIFICAR': 'info'
  }
  return map[estado] || 'default'
}

// Ordenamiento y filtrado
function ordenar(campo) {
  if (ordenActual.value.campo === campo) {
    // Si ya está ordenado por este campo, cambiar dirección
    ordenActual.value.desc = !ordenActual.value.desc
  } else {
    // Si es un nuevo campo, ordenar descendente por defecto
    ordenActual.value.campo = campo
    ordenActual.value.desc = true
  }
}

function getFacturasOrdenadasYFiltradas() {
  // Calcular fecha de hace 3 meses
  const hace3meses = new Date()
  hace3meses.setMonth(hace3meses.getMonth() - 3)

  // Filtrar: facturas del filtro actual AND últimos 3 meses
  let facturasFiltradas = store.facturasFiltradas.filter(f => {
    const fechaFactura = new Date(f.fecha)
    return fechaFactura >= hace3meses
  })

  // Ordenar
  facturasFiltradas.sort((a, b) => {
    let valA = a[ordenActual.value.campo]
    let valB = b[ordenActual.value.campo]

    // Convertir a números si es necesario
    if (typeof valA === 'string' && !isNaN(parseFloat(valA))) {
      valA = parseFloat(valA)
    }
    if (typeof valB === 'string' && !isNaN(parseFloat(valB))) {
      valB = parseFloat(valB)
    }

    if (valA < valB) return ordenActual.value.desc ? 1 : -1
    if (valA > valB) return ordenActual.value.desc ? -1 : 1
    return 0
  })

  return facturasFiltradas
}

// Modal
async function abrirDetalle(factura) {
  facturaActual.value = factura
  archivoSeleccionado.value = null
  cargandoArchivo.value = false
  await store.fetchSoportesPago(factura.codigo)
  dialogOpen.value = true
}

async function imprimirFactura(codigo) {
  try {
    const res = await api.get(`/tesoreria/facturas-venta/${codigo}/pdf`)
    const { factura, detalles } = res.data
    const subtotal = parseFloat(factura.total) || 0
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Factura ${factura.codigo}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;font-size:9px;color:#1a1a2e;background:#fff}
  .page{width:8.5in;min-height:11in;margin:0 auto;padding:30px 35px;display:flex;flex-direction:column}
  .top-banner{display:flex;align-items:stretch;margin-bottom:18px;border-radius:4px;overflow:hidden;border:1px solid #e2e8f0}
  .banner-left{background:#1a1a2e;color:#fff;padding:14px 20px;min-width:220px;display:flex;flex-direction:column;justify-content:center}
  .banner-doc-label{font-size:7px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin-bottom:4px}
  .banner-doc-title{font-size:18px;font-weight:700;letter-spacing:1px;color:#fff}
  .banner-doc-num{font-size:10px;font-weight:500;color:#38bdf8;margin-top:3px}
  .banner-right{flex:1;padding:12px 20px;display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:center;background:#f8fafc}
  .banner-field{display:flex;flex-direction:column;gap:2px}
  .banner-field-label{font-size:6.5px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8}
  .banner-field-val{font-size:9px;font-weight:600;color:#1a1a2e}
  .banner-field-val.accent{color:#0ea5e9}
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
  .party-card{border:1px solid #e2e8f0;border-radius:4px;overflow:hidden}
  .party-header{background:#1a1a2e;color:#fff;padding:4px 10px;font-size:6.5px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase}
  .party-body{padding:8px 10px;background:#fafafa}
  .party-name{font-size:9px;font-weight:700;color:#1a1a2e;margin-bottom:2px}
  .party-detail{font-size:7.5px;color:#64748b;line-height:1.5}
  .tabla{width:100%;border-collapse:collapse;margin-bottom:16px}
  .tabla thead tr{background:#1a1a2e}
  .tabla thead th{padding:5px 8px;font-size:7px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#cbd5e1;text-align:left;border:none}
  .tabla thead th.ta-r{text-align:right}.tabla thead th.ta-c{text-align:center}
  .tabla tbody tr{border-bottom:1px solid #f1f5f9}
  .tabla td{padding:4px 8px;font-size:8px;color:#374151}
  .tabla td.ta-c{text-align:center}.tabla td.ta-r{text-align:right}
  .tabla tbody tr.last-row td{border-bottom:2px solid #1a1a2e}
  .totals-box{width:260px;margin-left:auto;border:1px solid #e2e8f0;border-radius:4px;overflow:hidden;margin-bottom:20px}
  .totals-row{display:flex;justify-content:space-between;padding:5px 12px;font-size:8px;border-bottom:1px solid #f1f5f9}
  .totals-row .lbl{color:#64748b;font-weight:500}.totals-row .val{font-weight:500;color:#374151}
  .totals-row.grand{background:#1a1a2e;border-bottom:none}
  .totals-row.grand .lbl{color:#94a3b8;font-weight:700;font-size:8.5px;text-transform:uppercase}
  .totals-row.grand .val{color:#38bdf8;font-weight:700;font-size:10px}
</style></head>
<body><div class="page">
  <div class="top-banner">
    <div class="banner-left">
      <div class="banner-doc-label">Documento</div>
      <div class="banner-doc-title">FACTURA<br>DE VENTA</div>
      <div class="banner-doc-num">${factura.codigo}</div>
    </div>
    <div class="banner-right">
      <div class="banner-field"><span class="banner-field-label">Fecha Emisión</span><span class="banner-field-val">${factura.fecha ? String(factura.fecha).substring(0,10).split('-').reverse().join('/') : '—'}</span></div>
      <div class="banner-field"><span class="banner-field-label">Fecha Vencimiento</span><span class="banner-field-val accent">${factura.fecha_vencimiento ? String(factura.fecha_vencimiento).substring(0,10).split('-').reverse().join('/') : '—'}</span></div>
      <div class="banner-field"><span class="banner-field-label">Orden de Compra</span><span class="banner-field-val">${factura.orden_compra || '—'}</span></div>
      <div class="banner-field"><span class="banner-field-label">Estado</span><span class="banner-field-val">${factura.estado}</span></div>
    </div>
  </div>
  <div class="parties">
    <div class="party-card"><div class="party-header">Proveedor / Emisor</div><div class="party-body"><div class="party-name">${factura.proveedor_nombre || '—'}</div><div class="party-detail">${factura.proveedor_direccion || ''}${factura.proveedor_telefono ? '<br>Tel: ' + factura.proveedor_telefono : ''}</div></div></div>
    <div class="party-card"><div class="party-header">Cliente / Receptor</div><div class="party-body"><div class="party-name">${factura.cliente_nombre || factura.cliente}</div><div class="party-detail">${factura.cliente_direccion || ''}${factura.cliente_telefono ? '<br>Tel: ' + factura.cliente_telefono : ''}</div></div></div>
  </div>
  <table class="tabla">
    <thead><tr>
      <th style="width:8%">Código</th><th style="width:42%">Producto</th>
      <th style="width:10%" class="ta-c">Cant.</th>
      <th style="width:18%" class="ta-r">Vr. Unitario</th>
      <th style="width:18%" class="ta-r">Subtotal</th>
    </tr></thead>
    <tbody>
      ${detalles.map((d, i) => `<tr${i === detalles.length - 1 ? ' class="last-row"' : ''}><td class="ta-c">${d.producto_venta}</td><td>${d.producto_nombre || d.producto_venta}</td><td class="ta-c">${parseFloat(d.cantidad)}</td><td class="ta-r">$${parseFloat(d.precio_unitario).toLocaleString('en-US',{minimumFractionDigits:2})}</td><td class="ta-r">$${parseFloat(d.subtotal).toLocaleString('en-US',{minimumFractionDigits:2})}</td></tr>`).join('')}
    </tbody>
  </table>
  <div class="totals-box">
    <div class="totals-row"><span class="lbl">Subtotal</span><span class="val">$${subtotal.toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>
    <div class="totals-row"><span class="lbl">Impuestos</span><span class="val">${parseFloat(factura.impuestos) > 0 ? '$'+parseFloat(factura.impuestos).toLocaleString('en-US',{minimumFractionDigits:2}) : '—'}</span></div>
    <div class="totals-row grand"><span class="lbl">Total</span><span class="val">$${subtotal.toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>
  </div>
  ${factura.observaciones ? `<div style="font-size:8px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:10px"><strong>Observaciones:</strong> ${factura.observaciones}</div>` : ''}
</div></body></html>`
    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
  } catch (e) {
    alert('Error al generar PDF: ' + (e?.response?.data?.error || e.message))
  }
}

function cerrarDetalle() {
  dialogOpen.value = false
  facturaActual.value = null
  archivoSeleccionado.value = null
  store.limpiarSoportes()
}

// Manejo de archivos
function onArchivoSeleccionado(event) {
  const archivo = event.target.files[0]
  if (archivo) {
    if (archivo.size > 10 * 1024 * 1024) {
      alert('El archivo no debe superar 10MB')
      return
    }
    archivoSeleccionado.value = archivo
  }
}

async function guardarSoportePago() {
  if (!archivoSeleccionado.value || !facturaActual.value) return

  cargandoArchivo.value = true
  try {
    await store.subirSoportePago(facturaActual.value.codigo, archivoSeleccionado.value)
    archivoSeleccionado.value = null

    // Actualizar estado de la factura actual
    facturaActual.value.estado = 'POR VERIFICAR'

    // Recargar todas las facturas para actualizar soportes_count en grid
    await store.fetchFacturasVenta()

    alert('Soporte de pago cargado exitosamente')

    // Cerrar el modal automáticamente después de guardar exitosamente
    cerrarDetalle()
  } catch (err) {
    console.error('Error guardando soporte:', err)
    alert('Error al guardar el soporte de pago')
  } finally {
    cargandoArchivo.value = false
  }
}

async function descargarSoporte(idSoporte) {
  try {
    await store.descargarSoporte(idSoporte)
  } catch (err) {
    console.error('Error descargando soporte:', err)
    alert('Error al descargar el archivo')
  }
}

async function previsualizarSoporte(soporteId) {
  try {
    // Obtener información del archivo (incluyendo tamaño)
    const infoResponse = await api.get(`/tesoreria/soportes/${soporteId}/info`)
    const infoData = infoResponse.data

    if (!infoData.success) {
      throw new Error('No se pudo obtener información del archivo')
    }

    const fileSize = infoData.data.archivo_size
    const MAX_MODAL_SIZE = 5 * 1024 * 1024 // 5MB

    // Si es mayor a 5MB, abrir en pestaña nueva
    if (fileSize > MAX_MODAL_SIZE) {
      // Abrir en pestaña nueva usando el endpoint de descarga
      const downloadUrl = `${api.defaults.baseURL}/tesoreria/soportes/${soporteId}/descargar`
      window.open(downloadUrl, '_blank')
      return
    }

    // Si es pequeño, mostrar en modal
    // Obtener el archivo como blob para previsualización
    const fileResponse = await api.get(`/tesoreria/soportes/${soporteId}/preview`, {
      responseType: 'blob'
    })
    const fileUrl = URL.createObjectURL(fileResponse.data)

    // Obtener información del soporte
    const soporteInfo = store.soportesPagoActual.find(s => s.id === soporteId)

    previewFileName.value = soporteInfo?.nombre_archivo || 'archivo'
    previewFileData.value = fileUrl
    previewFileSize.value = fileSize
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
    console.error('Error descargando desde preview:', err)
    alert('Error al descargar el archivo')
  }
}

// Inicialización
onMounted(async () => {
  await store.fetchFacturasVenta()
})
</script>

<style scoped>
.view-container { padding: 24px; max-width: 1400px; margin: 0 auto; }

/* KPI */
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 20px; }

/* ── Filtros ── */
.filtros-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.tipo-tabs { display: flex; gap: 4px; }
.tipo-tab {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
  padding: 7px 14px; border-radius: 8px; border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  font-size: 12px; font-weight: 600; cursor: pointer;
  background: transparent; color: rgba(var(--v-theme-on-surface), 0.6);
  transition: all 0.15s;
}
.tipo-tab:hover { background: rgba(var(--v-theme-on-surface), 0.04); }
.tipo-tab.active { background: var(--indigo); border-color: var(--indigo); color: #fff; }

.tab-content { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.tab-header { display: flex; align-items: center; gap: 6px; }
.tab-subtext { font-size: 10px; font-weight: 700; opacity: 0.8; color: inherit; }
.tab-badge { background: var(--error); color: #fff; border-radius: 10px; padding: 1px 6px; font-size: 10px; font-weight: 700; min-width: 18px; text-align: center; }

/* ── Loading / Empty ── */
.loading-wrap { text-align: center; padding: 60px; }
.loading-text { color: rgba(var(--v-theme-on-surface), 0.5); font-size: 13px; margin-top: 12px; }
.empty-state {
  text-align: center; padding: 80px 24px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
}
.empty-icon { color: rgba(var(--v-theme-on-surface), 0.15); display: block; margin: 0 auto 12px; }
.empty-title { font-size: 16px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); margin: 0 0 4px; }
.empty-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.4); margin: 0; }

/* ── Tabla ── */
.tabla-container {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px; overflow: hidden;
}
.tabla-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table thead { background: rgba(var(--v-theme-on-surface), 0.04); }
.data-table thead th {
  padding: 12px 10px; text-align: left; font-weight: 700;
  font-size: 11px; letter-spacing: 0.5px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.6);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  white-space: nowrap;
  vertical-align: middle;
}
.data-table thead th.sortable {
  cursor: pointer;
  user-select: none;
  transition: color 0.15s;
}
.data-table thead th.sortable:hover {
  color: var(--indigo);
}
.header-text {
  display: inline;
  white-space: nowrap;
}
.sort-icon {
  color: var(--indigo);
  font-weight: 700;
  margin-left: 4px;
  vertical-align: middle;
  display: inline;
}
.data-table tbody tr { border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); }
.data-table tbody tr:hover { background: rgba(var(--v-theme-on-surface), 0.02); }
.data-table tbody tr.row-vencido { background: color-mix(in srgb, var(--error) 8%, transparent); }
.data-table tbody td { padding: 11px 10px; color: rgb(var(--v-theme-on-surface)); }

.col-codigo       { width: 100px; }
.col-fecha        { width: 90px; white-space: nowrap; }
.col-monto        { width: 110px; text-align: right; }
.col-pagado       { width: 100px; text-align: right; }
.col-pendiente    { width: 100px; text-align: right; }
.col-vencimiento  { width: 90px; white-space: nowrap; }
.col-dias         { width: 70px; text-align: center; }
.col-estado       { width: 110px; }
.col-soportes     { width: 100px; text-align: center; }
.col-acciones     { width: 60px; text-align: center; }

.codigo-badge {
  background: var(--indigo-wash); color: var(--indigo);
  padding: 3px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;
  font-variant-numeric: tabular-nums;
}
.monto-text { color: var(--indigo); font-weight: 600; font-variant-numeric: tabular-nums; }
.pagado-text { color: var(--success); font-weight: 600; }
.pendiente-text { color: var(--gold); font-weight: 600; }
.badge-soportes {
  display: inline-flex; align-items: center; gap: 4px;
  background: var(--success-wash); color: var(--success);
  padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600;
}
.text-muted   { color: rgba(var(--v-theme-on-surface), 0.3); }

/* ── Modal ── */
.form-card {
  border-radius: 16px !important;
  overflow: hidden;
}
.form-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, var(--indigo), var(--indigo));
}
.form-header-left { display: flex; align-items: center; gap: 10px; }
.form-header-icon {
  width: 32px; height: 32px; border-radius: 8px;
  background: rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
}
.form-title { font-size: 14px; font-weight: 700; letter-spacing: 0.5px; color: #fff; }

.form-body { padding: 20px; display: flex; flex-direction: column; gap: 12px; max-height: 70vh; overflow-y: auto; }

.detalle-section {
  padding: 0 0 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.section-title {
  font-size: 12px; font-weight: 700; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-bottom: 12px; letter-spacing: 0.5px;
}

.info-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;
}
.info-item { display: flex; flex-direction: column; gap: 4px; }
.info-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: rgba(var(--v-theme-on-surface), 0.5); letter-spacing: 0.5px; }
.info-value { font-size: 14px; font-weight: 600; color: rgb(var(--v-theme-on-surface)); }
.info-value.monto { color: var(--indigo); font-variant-numeric: tabular-nums; }
.info-value.pagado { color: var(--success); }
.info-value.pendiente { color: var(--gold); }

.observaciones {
  margin-top: 12px; padding: 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-radius: 8px;
}
.obs-text { margin: 8px 0 0; font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.7); line-height: 1.4; }

/* Subir Soporte */
.subir-soporte-wrap { margin-bottom: 16px; }
.file-input-area {
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 8px; padding: 24px;
  text-align: center; cursor: pointer;
  transition: all 0.15s;
}
.file-input-area:hover {
  border-color: var(--indigo);
  background: var(--indigo-wash);
}

.btn-subir {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 16px; border-radius: 8px;
  background: var(--indigo); color: #fff; border: none;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.15s;
}
.btn-subir:hover:not(:disabled) { background: var(--indigo); }
.btn-subir:disabled { opacity: 0.5; cursor: not-allowed; }

.file-help {
  font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5);
  margin: 8px 0 0;
}

.archivo-preview {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-radius: 8px;
  background: var(--success-wash); border: 1px solid var(--success-wash);
  margin-top: 12px; font-size: 13px; color: var(--success);
}
.btn-limpiar {
  margin-left: auto; background: transparent; border: none;
  cursor: pointer; color: var(--success);
}

.btn-guardar-soporte {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; padding: 10px;
  background: var(--success); color: #fff; border: none; border-radius: 8px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.15s; margin-top: 12px;
}
.btn-guardar-soporte:hover:not(:disabled) { background: var(--success); }
.btn-guardar-soporte:disabled { opacity: 0.5; cursor: not-allowed; }

.mr-2 { margin-right: 8px; }

/* Soportes List */
.soportes-list { margin-top: 12px; }
.soportes-title {
  font-size: 12px; font-weight: 700; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-bottom: 12px; letter-spacing: 0.5px;
}
.soporte-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  margin-bottom: 8px;
}
.soporte-info { display: flex; align-items: flex-start; gap: 10px; flex: 1; min-width: 0; }
.soporte-details { min-width: 0; }
.soporte-nombre { font-size: 13px; font-weight: 600; color: rgb(var(--v-theme-on-surface)); word-break: break-word; }
.soporte-fecha { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5); margin-top: 2px; }
.soporte-actions {
  display: flex; gap: 4px; flex-shrink: 0;
}
.btn-previsualizar,
.btn-descargar {
  background: transparent; border: none; cursor: pointer;
  padding: 4px 8px; color: var(--indigo); transition: all 0.15s;
}
.btn-previsualizar:hover,
.btn-descargar:hover { color: var(--indigo); }

.no-soportes {
  text-align: center; padding: 32px 24px;
  color: rgba(var(--v-theme-on-surface), 0.3);
}
.no-soportes p { margin: 8px 0 0; font-size: 13px; }

.form-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.mt-4 { margin-top: 16px; }
</style>