<template>
  <MainLayout>
    <div class="view-container">
      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">TESORERÍA</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Procesos</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Facturas de Compra</span>
      </div>

      <!-- HEADER -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon-wrap">
            <v-icon size="22" color="white">mdi-file-invoice-outline</v-icon>
          </div>
          <div>
            <h1 class="page-title">FACTURAS DE COMPRA</h1>
            <p class="page-sub">Gestión de facturas recibidas y soportes de pago</p>
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
            <div class="kpi-label">PENDIENTE POR PAGAR</div>
            <div class="kpi-value">{{ formatMoneda(store.totalPendiente) }}</div>
            <div class="kpi-sub">{{ store.cantidadPendientes }} facturas</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-icon-red">
            <v-icon size="20" color="white">mdi-alert-circle-outline</v-icon>
          </div>
          <div class="kpi-body">
            <div class="kpi-label">VENCIDO</div>
            <div class="kpi-value red-text">{{ formatMoneda(store.totalVencido) }}</div>
            <div class="kpi-sub">{{ store.facturasVencidas.length }} facturas</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-icon-amber">
            <v-icon size="20" color="white">mdi-calendar-alert-outline</v-icon>
          </div>
          <div class="kpi-body">
            <div class="kpi-label">PRÓXIMAS A VENCER</div>
            <div class="kpi-value amber-text">{{ store.facturasProximas.length }}</div>
            <div class="kpi-sub">en los próximos 30 días</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-icon-green">
            <v-icon size="20" color="white">mdi-percent-outline</v-icon>
          </div>
          <div class="kpi-body">
            <div class="kpi-label">PORCENTAJE COBRADO</div>
            <div class="kpi-value green-text">{{ store.porcentajeCobro }}%</div>
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
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click="abrirDetalle(fact)"
                    title="Ver detalle"
                  >
                    <v-icon size="18">mdi-eye-outline</v-icon>
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

    <!-- MODAL DETALLE FACTURA -->
    <v-dialog v-model="dialogOpen" max-width="700" persistent>
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
                <button class="btn-descargar" @click="descargarSoporte(soporte.id)" title="Descargar">
                  <v-icon size="16">mdi-download</v-icon>
                </button>
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
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { useFacturasCompraClienteStore } from '../../stores/facturas-compra-cliente'
import { formatMoneda, formatFecha } from '../../utils/formatters'

const store = useFacturasCompraClienteStore()

// Estado del modal
const dialogOpen = ref(false)
const facturaActual = ref(null)
const fileInput = ref(null)
const archivoSeleccionado = ref(null)
const cargandoArchivo = ref(false)

// Tabs de estado
const estadoTabs = [
  { value: 'TODOS', label: 'Todos', icon: 'mdi-view-list' },
  { value: 'PENDIENTE', label: 'Pendientes', icon: 'mdi-alert-circle-outline' },
  { value: 'PAGADA', label: 'Pagadas', icon: 'mdi-check-circle-outline' },
  { value: 'POR_VERIFICAR', label: 'Por Verificar', icon: 'mdi-clock-outline' },
]

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
    'POR_VERIFICAR': 'info'
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
    facturaActual.value.estado = 'POR_VERIFICAR'

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

// Inicialización
onMounted(async () => {
  await store.fetchFacturasVenta()
})
</script>

<style scoped>
.view-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* ── Breadcrumb ── */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 20px;
}
.bc-root {
  font-size: 12px;
  font-weight: 700;
  color: #06b6d4;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.3); }
.bc-cat { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.8); font-weight: 500; }

/* ── Header ── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.header-left { display: flex; align-items: center; gap: 16px; }
.header-icon-wrap {
  width: 48px; height: 48px; border-radius: 12px;
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 14px rgba(6, 182, 212, 0.35);
}
.page-title { font-size: 20px; font-weight: 800; letter-spacing: 0.5px; margin: 0; }
.page-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 2px 0 0; }

/* ── KPI cards ── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}
.kpi-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.kpi-icon-wrap {
  width: 44px; height: 44px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.kpi-icon-cyan  { background: linear-gradient(135deg, #06b6d4, #0891b2); box-shadow: 0 4px 12px rgba(6,182,212,0.3); }
.kpi-icon-green { background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
.kpi-icon-amber { background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 4px 12px rgba(245,158,11,0.3); }
.kpi-icon-red   { background: linear-gradient(135deg, #ef4444, #dc2626); box-shadow: 0 4px 12px rgba(239,68,68,0.3); }
.kpi-body { flex: 1; min-width: 0; }
.kpi-label { font-size: 10px; font-weight: 700; color: rgba(var(--v-theme-on-surface), 0.5); text-transform: uppercase; letter-spacing: 0.5px; }
.kpi-value { font-size: 22px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); margin: 2px 0; }
.kpi-sub { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5); }
.green-text { color: #10b981 !important; }
.amber-text { color: #f59e0b !important; }
.red-text   { color: #ef4444 !important; }

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
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 8px; border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  font-size: 12px; font-weight: 600; cursor: pointer;
  background: transparent; color: rgba(var(--v-theme-on-surface), 0.6);
  transition: all 0.15s;
}
.tipo-tab:hover { background: rgba(var(--v-theme-on-surface), 0.04); }
.tipo-tab.active { background: #06b6d4; border-color: #06b6d4; color: #fff; }

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
  color: #06b6d4;
}
.header-text {
  display: inline;
  white-space: nowrap;
}
.sort-icon {
  color: #06b6d4;
  font-weight: 700;
  margin-left: 4px;
  vertical-align: middle;
  display: inline;
}
.data-table tbody tr { border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); }
.data-table tbody tr:hover { background: rgba(var(--v-theme-on-surface), 0.02); }
.data-table tbody tr.row-vencido { background: rgba(239, 68, 68, 0.05); }
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
  background: rgba(6, 182, 212, 0.12); color: #06b6d4;
  padding: 3px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;
  font-family: 'Courier New', monospace;
}
.monto-text { color: #06b6d4; font-weight: 600; font-family: 'Courier New', monospace; }
.pagado-text { color: #10b981; font-weight: 600; }
.pendiente-text { color: #f59e0b; font-weight: 600; }
.badge-soportes {
  display: inline-flex; align-items: center; gap: 4px;
  background: rgba(16, 185, 129, 0.12); color: #10b981;
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
  background: linear-gradient(135deg, #06b6d4, #0891b2);
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
.info-value.monto { color: #06b6d4; font-family: 'Courier New', monospace; }
.info-value.pagado { color: #10b981; }
.info-value.pendiente { color: #f59e0b; }

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
  border-color: #06b6d4;
  background: rgba(6, 182, 212, 0.03);
}

.btn-subir {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 16px; border-radius: 8px;
  background: #06b6d4; color: #fff; border: none;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.15s;
}
.btn-subir:hover:not(:disabled) { background: #0891b2; }
.btn-subir:disabled { opacity: 0.5; cursor: not-allowed; }

.file-help {
  font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5);
  margin: 8px 0 0;
}

.archivo-preview {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-radius: 8px;
  background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3);
  margin-top: 12px; font-size: 13px; color: #10b981;
}
.btn-limpiar {
  margin-left: auto; background: transparent; border: none;
  cursor: pointer; color: #10b981;
}

.btn-guardar-soporte {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; padding: 10px;
  background: #10b981; color: #fff; border: none; border-radius: 8px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.15s; margin-top: 12px;
}
.btn-guardar-soporte:hover:not(:disabled) { background: #059669; }
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
.btn-descargar {
  background: transparent; border: none; cursor: pointer;
  padding: 4px 8px; color: #06b6d4; transition: all 0.15s;
}
.btn-descargar:hover { color: #0891b2; }

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
