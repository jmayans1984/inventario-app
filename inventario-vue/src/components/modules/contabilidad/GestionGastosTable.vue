<template>
  <div class="table-container">
    <!-- HEADER CON BÚSQUEDA Y ACCIONES -->
    <div class="table-header">
      <div class="search-bar">
        <v-icon size="18" class="search-icon">mdi-magnify</v-icon>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por código, factura, proveedor..."
          class="search-input"
          @input="handleSearch"
        />
      </div>
      <div class="header-actions">
        <!-- Toggle: mostrar todos vs solo con proveedor -->
        <label class="toggle-proveedor" :title="soloConProveedor ? 'Mostrando solo gastos ingresados por usuario. Activa para ver todos.' : 'Mostrando todos los registros incluyendo los automáticos'">
          <input type="checkbox" v-model="soloConProveedor" @change="currentPage = 1" />
          <span class="toggle-proveedor-label">
            <v-icon size="13" :color="soloConProveedor ? '#94a3b8' : '#f59e0b'" class="mr-1">{{ soloConProveedor ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}</v-icon>
            {{ soloConProveedor ? 'Ocultar automáticos' : 'Mostrar todos' }}
          </span>
        </label>
        <v-btn
          size="small"
          variant="outlined"
          prepend-icon="mdi-download-outline"
          @click="exportarExcel"
          :loading="store.loading"
        >
          Exportar
        </v-btn>
      </div>
    </div>

    <!-- TABLA -->
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-codigo" @click="ordenar('codigo')">
              <div class="th-inner">CÓDIGO <v-icon v-if="sortBy==='codigo'" size="13" class="sort-icon">{{ sortOrder==='asc'?'mdi-arrow-up':'mdi-arrow-down' }}</v-icon><v-icon v-else size="13" class="sort-icon-inactive">mdi-arrow-up-down</v-icon></div>
            </th>
            <th class="col-fecha" @click="ordenar('fecha')">
              <div class="th-inner">FECHA <v-icon v-if="sortBy==='fecha'" size="13" class="sort-icon">{{ sortOrder==='asc'?'mdi-arrow-up':'mdi-arrow-down' }}</v-icon><v-icon v-else size="13" class="sort-icon-inactive">mdi-arrow-up-down</v-icon></div>
            </th>
            <th class="col-proveedor" @click="ordenar('proveedor')">
              <div class="th-inner">PROVEEDOR <v-icon v-if="sortBy==='proveedor'" size="13" class="sort-icon">{{ sortOrder==='asc'?'mdi-arrow-up':'mdi-arrow-down' }}</v-icon><v-icon v-else size="13" class="sort-icon-inactive">mdi-arrow-up-down</v-icon></div>
            </th>
            <th class="col-centro" @click="ordenar('ccosto')">
              <div class="th-inner">CENTRO COSTOS <v-icon v-if="sortBy==='ccosto'" size="13" class="sort-icon">{{ sortOrder==='asc'?'mdi-arrow-up':'mdi-arrow-down' }}</v-icon><v-icon v-else size="13" class="sort-icon-inactive">mdi-arrow-up-down</v-icon></div>
            </th>
            <th class="col-forma-pago" @click="ordenar('forma_pago')">
              <div class="th-inner">FORMA PAGO <v-icon v-if="sortBy==='forma_pago'" size="13" class="sort-icon">{{ sortOrder==='asc'?'mdi-arrow-up':'mdi-arrow-down' }}</v-icon><v-icon v-else size="13" class="sort-icon-inactive">mdi-arrow-up-down</v-icon></div>
            </th>
            <th class="col-cuenta" @click="ordenar('cuenta_nombre')">
              <div class="th-inner">CUENTA <v-icon v-if="sortBy==='cuenta_nombre'" size="13" class="sort-icon">{{ sortOrder==='asc'?'mdi-arrow-up':'mdi-arrow-down' }}</v-icon><v-icon v-else size="13" class="sort-icon-inactive">mdi-arrow-up-down</v-icon></div>
            </th>
            <th class="col-concepto" @click="ordenar('concepto')">
              <div class="th-inner">CONCEPTO <v-icon v-if="sortBy==='concepto'" size="13" class="sort-icon">{{ sortOrder==='asc'?'mdi-arrow-up':'mdi-arrow-down' }}</v-icon><v-icon v-else size="13" class="sort-icon-inactive">mdi-arrow-up-down</v-icon></div>
            </th>
            <th class="col-factura" @click="ordenar('factura')">
              <div class="th-inner">FACTURA <v-icon v-if="sortBy==='factura'" size="13" class="sort-icon">{{ sortOrder==='asc'?'mdi-arrow-up':'mdi-arrow-down' }}</v-icon><v-icon v-else size="13" class="sort-icon-inactive">mdi-arrow-up-down</v-icon></div>
            </th>
            <th class="col-total" @click="ordenar('total')">
              <div class="th-inner">TOTAL <v-icon v-if="sortBy==='total'" size="13" class="sort-icon">{{ sortOrder==='asc'?'mdi-arrow-up':'mdi-arrow-down' }}</v-icon><v-icon v-else size="13" class="sort-icon-inactive">mdi-arrow-up-down</v-icon></div>
            </th>
            <th class="col-acciones">
              <div class="th-inner">ACCIONES</div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paginatedGastos.length === 0">
            <td colspan="10" class="table-empty">
              <v-icon size="32" class="empty-icon">mdi-inbox-outline</v-icon>
              <p class="empty-text">No hay gastos registrados</p>
            </td>
          </tr>
          <tr v-for="gasto in paginatedGastos" :key="gasto.codigo + '_' + gasto.fecha" class="table-row">
            <td class="td-codigo">
              <span class="badge-codigo">{{ gasto.codigo }}</span>
            </td>
            <td class="td-fecha">{{ formatFecha(gasto.fecha) }}</td>
            <td class="td-proveedor">
              <span v-if="gasto.proveedor && gasto.proveedor !== '0'">
                {{ gasto.proveedor_nombre || gasto.proveedor }}
              </span>
              <span v-else class="text-muted">-</span>
            </td>
            <td class="td-centro">
              <span class="badge-centro">{{ gasto.ccosto_nombre || gasto.ccosto }}</span>
            </td>
            <td class="td-forma-pago">
              <span class="badge-forma-pago">{{ gasto.forma_pago_nombre || gasto.forma_pago || '-' }}</span>
            </td>
            <td class="td-cuenta">{{ gasto.cuenta_nombre || gasto.cuenta || '-' }}</td>
            <td class="td-concepto">{{ gasto.concepto || '-' }}</td>
            <td class="td-factura">{{ gasto.factura || '-' }}</td>
            <td class="td-total">
              <span class="total-bold">{{ formatMoneda(gasto.total) }}</span>
            </td>
            <td class="td-acciones">
              <div class="action-buttons">
                <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" @click="$emit('edit', gasto)" title="Editar" />
                <v-btn
                  icon="mdi-package-down"
                  size="x-small"
                  variant="text"
                  :color="gastosConEntradas.has(gasto.codigo) ? '#0891b2' : undefined"
                  :style="gastosConEntradas.has(gasto.codigo) ? '' : 'opacity:0.25;cursor:default'"
                  @click="gastosConEntradas.has(gasto.codigo) && verEntradas(gasto)"
                  :title="gastosConEntradas.has(gasto.codigo) ? 'Ver entradas de almacén' : 'Sin entradas de almacén'"
                />
                <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="eliminar(gasto.codigo)" :loading="store.loading" title="Eliminar" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PAGINACIÓN -->
    <div class="table-footer">
      <!-- Selector de registros por página -->
      <div class="page-size-wrap">
        <span class="page-size-label">Mostrar</span>
        <div class="page-size-options">
          <button
            v-for="n in PAGE_SIZE_OPTIONS"
            :key="n"
            class="page-size-btn"
            :class="{ 'page-size-btn--active': itemsPerPage === n }"
            @click="itemsPerPage = n; currentPage = 1"
          >{{ n }}</button>
        </div>
        <span class="page-size-label">de {{ filteredGastos.length }} registros</span>
      </div>
      <!-- Navegación de páginas -->
      <div class="pagination">
        <v-btn icon="mdi-chevron-left" size="small" variant="text" :disabled="currentPage <= 1" @click="irAPagina(currentPage - 1)" />
        <span class="page-info">Página {{ currentPage }} de {{ totalPages }}</span>
        <v-btn icon="mdi-chevron-right" size="small" variant="text" :disabled="currentPage >= totalPages" @click="irAPagina(currentPage + 1)" />
      </div>
    </div>
  </div>

  <!-- POPUP ENTRADAS DE ALMACÉN -->
  <v-dialog v-model="dlgEntradas" max-width="780" scrollable>
    <v-card class="dlg-card">
      <div class="dlg-header">
        <div class="dlg-header-icon">
          <v-icon size="22" color="white">mdi-package-down</v-icon>
        </div>
        <div class="dlg-header-text">
          <div class="dlg-title">Entradas de Almacén</div>
          <div class="dlg-sub">
            Gasto {{ gastoDlg?.codigo }}
            <span v-if="gastoDlg?.factura"> · Fact. {{ gastoDlg.factura }}</span>
            <span v-if="gastoDlg?.proveedor_nombre"> · {{ gastoDlg.proveedor_nombre }}</span>
          </div>
        </div>
        <v-spacer />
        <v-btn icon="mdi-printer" size="small" variant="text" @click="imprimirEntradas" title="Imprimir" />
        <v-btn icon="mdi-close" size="small" variant="text" @click="dlgEntradas = false" />
      </div>

      <v-divider />

      <v-card-text class="dlg-body" ref="dlgPrintRef">
        <!-- Print header -->
        <div class="dlg-print-head">
          <strong>Entradas de Almacén</strong> — Gasto {{ gastoDlg?.codigo }}
          <span v-if="gastoDlg?.factura"> · Factura {{ gastoDlg.factura }}</span>
          <span v-if="gastoDlg?.proveedor_nombre"> · {{ gastoDlg.proveedor_nombre }}</span>
        </div>

        <div v-if="loadingEntradas" class="dlg-loading">
          <v-progress-circular indeterminate color="#0891b2" size="32" />
          <span>Cargando...</span>
        </div>
        <div v-else-if="entradasDlg.length === 0" class="dlg-empty">
          <v-icon size="36" color="rgba(0,0,0,0.2)">mdi-inbox-outline</v-icon>
          <p>Este gasto no tiene entradas de almacén registradas</p>
        </div>
        <table v-else class="dlg-table">
          <thead>
            <tr>
              <th>FECHA</th>
              <th># ENTRADA</th>
              <th>CÓDIGO</th>
              <th>PRODUCTO</th>
              <th>UND</th>
              <th>CANTIDAD</th>
              <th>P. UNIT</th>
              <th>SUBTOTAL</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(e, i) in entradasDlg" :key="i">
              <td class="tc">{{ formatFecha(e.fecha) }}</td>
              <td class="tc"><span class="badge-cc-dlg">{{ e.entrada_codigo }}</span></td>
              <td class="tc text-muted-sm">{{ e.producto_codigo }}</td>
              <td>{{ e.producto_nombre }}</td>
              <td class="tc text-muted-sm">{{ e.und || '-' }}</td>
              <td class="tr fw">{{ formatNum(e.cantidad) }}</td>
              <td class="tr text-muted-sm">{{ formatMoneda(e.precio_unitario) }}</td>
              <td class="tr fw" style="color:#0891b2">{{ formatMoneda(e.subtotal) }}</td>
            </tr>
          </tbody>
        </table>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useGestionGastosStore } from '../../../stores/gestiongastos'
import { useAuthStore } from '../../../stores/auth'
import { gestionGastosService } from '../../../services/gestiongastos.service'
import { formatMoneda, formatFecha } from '../../../utils/formatters'
import api from '../../../services/api'

const emit = defineEmits(['edit'])
const store = useGestionGastosStore()
const auth = useAuthStore()

// ── Set de gastos con entradas de almacén ──
const gastosConEntradas = ref(new Set())

async function cargarGastosConEntradas() {
  try {
    const r = await api.get('/almacen/gastos-con-entradas', { params: { empresa: auth.empresa } })
    gastosConEntradas.value = new Set(r.data?.data || [])
  } catch {}
}

onMounted(cargarGastosConEntradas)

watch(() => store.gastos, cargarGastosConEntradas)

// ── Popup entradas de almacén ──
const dlgEntradas = ref(false)
const gastoDlg = ref(null)
const entradasDlg = ref([])
const loadingEntradas = ref(false)
const dlgPrintRef = ref(null)

async function verEntradas(gasto) {
  gastoDlg.value = gasto
  entradasDlg.value = []
  dlgEntradas.value = true
  loadingEntradas.value = true
  try {
    const r = await api.get(`/almacen/entradas-por-gasto/${gasto.codigo}`, { params: { empresa: auth.empresa } })
    entradasDlg.value = r.data?.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loadingEntradas.value = false
  }
}

function formatNum(v) {
  const n = parseFloat(v) || 0
  return n % 1 === 0 ? n.toLocaleString('es-US') : n.toLocaleString('es-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

function imprimirEntradas() {
  const el = dlgPrintRef.value?.$el || dlgPrintRef.value
  if (!el) return window.print()
  const win = window.open('', '_blank', 'width=800,height=600')
  win.document.write(`<!DOCTYPE html><html><head><title>Entradas de Almacén</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; margin: 24px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { background: #f1f5f9; padding: 8px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; border-bottom: 2px solid #cbd5e1; }
  td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
  .tc { text-align: center; }
  .tr { text-align: right; }
  .fw { font-weight: bold; }
  .print-head { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
  .print-sub { font-size: 12px; color: #64748b; }
</style></head><body>`)
  win.document.write(`<div class="print-head">Entradas de Almacén</div>`)
  win.document.write(`<div class="print-sub">Gasto: ${gastoDlg.value?.codigo || ''}`)
  if (gastoDlg.value?.factura) win.document.write(` · Factura: ${gastoDlg.value.factura}`)
  if (gastoDlg.value?.proveedor_nombre) win.document.write(` · ${gastoDlg.value.proveedor_nombre}`)
  win.document.write(`</div>`)
  win.document.write(`<table><thead><tr><th>Fecha</th><th># Entrada</th><th>Código</th><th>Producto</th><th>Und</th><th>Cantidad</th><th>P. Unit</th><th>Subtotal</th></tr></thead><tbody>`)
  for (const e of entradasDlg.value) {
    win.document.write(`<tr>
      <td class="tc">${formatFecha(e.fecha)}</td>
      <td class="tc">${e.entrada_codigo}</td>
      <td class="tc">${e.producto_codigo}</td>
      <td>${e.producto_nombre}</td>
      <td class="tc">${e.und || '-'}</td>
      <td class="tr fw">${formatNum(e.cantidad)}</td>
      <td class="tr">${formatMoneda(e.precio_unitario)}</td>
      <td class="tr fw">${formatMoneda(e.subtotal)}</td>
    </tr>`)
  }
  win.document.write(`</tbody></table></body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 400)
}

const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(25)
const PAGE_SIZE_OPTIONS = [25, 50, 100, 250]
const sortBy = ref('fecha')
const sortOrder = ref('desc')
const soloConProveedor = ref(true)   // por defecto oculta registros sin proveedor

// Filtrado
const filteredGastos = computed(() => {
  let list = [...store.gastos]

  // Ocultar registros automáticos (sin proveedor) a menos que el usuario los pida
  if (soloConProveedor.value) {
    list = list.filter(g => g.proveedor && g.proveedor.trim() !== '' && g.proveedor !== '0')
  }

  // Filtro de búsqueda
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(g =>
      g.codigo?.toLowerCase().includes(q) ||
      g.factura?.toLowerCase().includes(q) ||
      g.proveedor_nombre?.toLowerCase().includes(q) ||
      g.ccosto_nombre?.toLowerCase().includes(q) ||
      g.concepto?.toLowerCase().includes(q)
    )
  }

  // Ordenamiento local
  list.sort((a, b) => {
    let valA = a[sortBy.value] ?? ''
    let valB = b[sortBy.value] ?? ''
    if (sortBy.value === 'total') {
      valA = parseFloat(valA) || 0
      valB = parseFloat(valB) || 0
    } else if (sortBy.value === 'fecha') {
      valA = new Date(valA)
      valB = new Date(valB)
    } else {
      valA = String(valA).toLowerCase()
      valB = String(valB).toLowerCase()
    }
    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })

  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredGastos.value.length / itemsPerPage.value)))

const paginatedGastos = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredGastos.value.slice(start, start + itemsPerPage.value)
})

function handleSearch() {
  currentPage.value = 1
}

function ordenar(campo) {
  if (sortBy.value === campo) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = campo
    sortOrder.value = 'asc'
  }
  currentPage.value = 1
}

function irAPagina(p) {
  currentPage.value = p
}

async function eliminar(codigo) {
  if (confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
    try {
      await store.eliminarGasto(codigo)
    } catch (err) {
      console.error('Error al eliminar:', err)
    }
  }
}

async function exportarExcel() {
  try {
    await gestionGastosService.exportarExcel()
  } catch (err) {
    console.error('Error al exportar:', err)
  }
}
</script>

<style scoped>
/* ── Contenedor ── */
.table-container {
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  overflow: hidden;
}

/* ── Header búsqueda ── */
.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.search-bar {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.search-icon { color: rgba(var(--v-theme-on-surface), 0.4); flex-shrink: 0; }
.search-input {
  flex: 1; border: none; background: transparent; outline: none;
  font-size: 14px; color: rgb(var(--v-theme-on-surface));
}
.search-input::placeholder { color: rgba(var(--v-theme-on-surface), 0.4); }
.header-actions { display: flex; align-items: center; gap: 8px; }

/* Toggle ocultar automáticos */
.toggle-proveedor {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 6px;
}
.toggle-proveedor input[type="checkbox"] { display: none; }
.toggle-proveedor-label {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.55);
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-on-surface), 0.03);
  white-space: nowrap;
  transition: border-color 180ms var(--ease-out), background-color 180ms var(--ease-out), color 180ms var(--ease-out);
  user-select: none;
}
.toggle-proveedor:hover .toggle-proveedor-label {
  border-color: rgba(var(--v-theme-on-surface), 0.2);
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgba(var(--v-theme-on-surface), 0.8);
}

/* ── Tabla ── */
.table-wrapper { overflow-x: auto; }

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  table-layout: fixed;
}

/* Anchos de columnas */
.col-codigo   { width: 130px; }
.col-fecha    { width: 100px; }
.col-proveedor{ width: 16%; }
.col-centro   { width: 11%; }
.col-forma-pago { width: 12%; }
.col-cuenta     { width: 18%; }
.col-concepto   { width: 15%; }
.col-factura  { width: 100px; }
.col-total    { width: 110px; }
.col-acciones { width: 80px; }

/* ── ENCABEZADOS ── */
.data-table thead {
  background: rgba(var(--v-theme-on-surface), 0.04);
}
.data-table thead th {
  padding: 0;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.th-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 10px;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.6);
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}
.th-inner:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
}
.col-acciones .th-inner { cursor: default; }
.col-acciones .th-inner:hover { background: none; }

.sort-icon { color: #667eea; }
.sort-icon-inactive { color: rgba(var(--v-theme-on-surface), 0.2); }

/* ── FILAS ── */
.data-table tbody tr {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  transition: background 0.15s;
}
.data-table tbody tr:hover { background: rgba(var(--v-theme-on-surface), 0.03); }

.data-table tbody td {
  padding: 3px 10px;
  color: rgb(var(--v-theme-on-surface));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Empty state */
.table-empty {
  text-align: center !important;
  padding: 40px !important;
  white-space: normal !important;
}
.empty-icon { color: rgba(var(--v-theme-on-surface), 0.2); display: block; margin: 0 auto 8px; }
.empty-text { color: rgba(var(--v-theme-on-surface), 0.4); font-size: 14px; margin: 0; }

/* Celdas específicas */
.td-codigo { text-align: center; }
.badge-codigo {
  background: rgba(102, 126, 234, 0.15);
  color: #667eea;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 12px;
}
.td-fecha { text-align: center; }
.td-proveedor { text-align: left; }
.td-centro { text-align: center; }
.badge-centro {
  background: rgba(118, 75, 162, 0.15);
  color: #764ba2;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 11px;
}
.td-forma-pago { text-align: center; }
.badge-forma-pago {
  background: rgba(76, 175, 80, 0.15);
  color: #4caf50;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 11px;
}
.td-concepto { text-align: left; }
.td-factura { text-align: center; }
.td-total { text-align: right; }
.total-bold { font-weight: 700; color: #667eea; font-variant-numeric: tabular-nums; }
.td-acciones { text-align: center; }
.action-buttons { display: flex; gap: 0; justify-content: center; align-items: center; }
.action-buttons :deep(.v-btn) { margin: 0 -2px; }
.text-muted { color: rgba(var(--v-theme-on-surface), 0.35); }

/* ── Paginación ── */
.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  flex-wrap: wrap;
  gap: 10px;
}
.pagination { display: flex; align-items: center; gap: 8px; }
.page-info {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  min-width: 120px;
  text-align: center;
}

/* Selector de registros por página */
.page-size-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.page-size-label {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  white-space: nowrap;
}
.page-size-options {
  display: flex;
  gap: 3px;
}
.page-size-btn {
  padding: 3px 9px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 5px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.15);
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.55);
  cursor: pointer;
  transition: border-color 150ms var(--ease-out), background-color 150ms var(--ease-out), color 150ms var(--ease-out);
}
.page-size-btn:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.3);
  color: rgba(var(--v-theme-on-surface), 0.85);
  background: rgba(var(--v-theme-on-surface), 0.04);
}
.page-size-btn--active {
  background: #0891b2;
  border-color: #0891b2;
  color: #fff;
}

/* ── POPUP ENTRADAS ── */
.dlg-card { border-radius: 14px !important; overflow: hidden; }
.dlg-header {
  display: flex; align-items: center; gap: 12px; padding: 16px 20px;
  background: linear-gradient(135deg, #0c4a6e 0%, #0891b2 100%);
}
.dlg-header-icon {
  width: 38px; height: 38px; border-radius: 10px;
  background: rgba(255,255,255,0.15);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.dlg-title { font-size: 15px; font-weight: 700; color: #fff; }
.dlg-sub { font-size: 12px; color: rgba(255,255,255,0.75); margin-top: 1px; }
.dlg-body { padding: 20px !important; min-height: 120px; }
.dlg-loading { display: flex; align-items: center; gap: 12px; padding: 32px 0; color: rgba(var(--v-theme-on-surface), 0.5); }
.dlg-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px 0; color: rgba(var(--v-theme-on-surface), 0.4); font-size: 14px; }
.dlg-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.dlg-table thead { background: rgba(var(--v-theme-on-surface), 0.04); }
.dlg-table th {
  padding: 9px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.5);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08); text-align: center;
}
.dlg-table td { padding: 9px 10px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); color: rgb(var(--v-theme-on-surface)); }
.badge-cc-dlg { background: rgba(8,145,178,0.12); color: #0891b2; padding: 2px 7px; border-radius: 5px; font-size: 11px; font-weight: 700; }
.tc { text-align: center !important; }
.tr { text-align: right !important; }
.fw { font-weight: 700; font-variant-numeric: tabular-nums; }
.text-muted-sm { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.5); }
.dlg-print-head { display: none; }
</style>
