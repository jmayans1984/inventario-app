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
        <label class="toggle-proveedor" :title="store.filtroSoloConProveedor ? 'Mostrando solo gastos ingresados por usuario. Activa para ver todos.' : 'Mostrando todos los registros incluyendo los automáticos'">
          <input type="checkbox" v-model="store.filtroSoloConProveedor" @change="currentPage = 1" />
          <span class="toggle-proveedor-label">
            <v-icon size="13" :color="store.filtroSoloConProveedor ? 'var(--ink-400)' : 'var(--gold)'" class="mr-1">{{ store.filtroSoloConProveedor ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}</v-icon>
            {{ store.filtroSoloConProveedor ? 'Ocultar automáticos' : 'Mostrar todos' }}
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
                  :color="gastosConEntradas.has(gasto.codigo) ? 'var(--indigo)' : undefined"
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
          <v-progress-circular indeterminate color="var(--indigo)" size="32" />
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
              <td class="tr fw" style="color:var(--indigo)">{{ formatMoneda(e.subtotal) }}</td>
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
  const win = window.open('', '_blank', 'width=800,height=600')
  if (!win) return

  const gasto = gastoDlg.value || {}
  const empresaNombre = (auth.empresaNombre || auth.empresa || 'EMPRESA').toUpperCase()
  const fechaImpresion = new Date().toLocaleString('es-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  const totalEntradas = entradasDlg.value.reduce((sum, e) => sum + (parseFloat(e.subtotal) || 0), 0)
  const diferencia = (parseFloat(gasto.total) || 0) - totalEntradas
  const esc = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
  const rows = entradasDlg.value.map((e, idx) => `
    <tr>
      <td class="tc">${idx + 1}</td>
      <td class="tc">${esc(formatFecha(e.fecha))}</td>
      <td class="tc strong">${esc(e.entrada_codigo)}</td>
      <td class="tc">${esc(e.producto_codigo)}</td>
      <td>${esc(e.producto_nombre)}</td>
      <td class="tc">${esc(e.und || '-')}</td>
      <td class="tr strong">${esc(formatNum(e.cantidad))}</td>
      <td class="tr">${esc(formatMoneda(e.precio_unitario))}</td>
      <td class="tr strong">${esc(formatMoneda(e.subtotal))}</td>
    </tr>`).join('')

  win.document.write(`<!DOCTYPE html><html><head><title>Reporte contable de entradas</title>
<style>
  @page { size: letter landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #111; background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 10.5px; line-height: 1.35; }
  .report { width: 100%; }
  .top-rule { border-top: 2px solid #111; margin-bottom: 8px; }
  .header { display: grid; grid-template-columns: 1fr 280px; gap: 24px; border-bottom: 1px solid #111; padding-bottom: 8px; }
  .company { font-size: 16px; font-weight: 800; letter-spacing: .02em; text-transform: uppercase; }
  .subtitle, .report-code, .footer { color: #333; font-size: 8.5px; }
  .subtitle { margin-top: 3px; text-transform: uppercase; letter-spacing: .08em; }
  .title-box { text-align: right; }
  .report-title { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
  .report-code { margin-top: 3px; }
  .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid #111; border-left: 1px solid #111; margin-top: 12px; }
  .meta-cell { min-height: 36px; padding: 7px 8px; border-right: 1px solid #111; border-bottom: 1px solid #111; }
  .wide { grid-column: span 2; }
  .label { display: block; margin-bottom: 3px; font-size: 7.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
  .value { font-size: 10.5px; font-weight: 600; }
  .section-title { margin-top: 14px; padding-bottom: 4px; border-bottom: 1px solid #111; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { padding: 6px 5px; border-top: 1px solid #111; border-bottom: 1.5px solid #111; font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; text-align: left; }
  td { padding: 6px 5px; border-bottom: 1px solid #999; vertical-align: top; }
  .tc { text-align: center; }
  .tr { text-align: right; }
  .strong { font-weight: 800; }
  .total-row td { border-top: 1.5px solid #111; border-bottom: 2px solid #111; font-weight: 800; font-size: 11px; }
  .notes { display: grid; grid-template-columns: 1.25fr 1fr; gap: 14px; margin-top: 16px; }
  .note-box { min-height: 58px; border: 1px solid #111; padding: 8px; }
  .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 28px; }
  .signature { padding-top: 24px; border-top: 1px solid #111; text-align: center; font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
  .footer { display: flex; justify-content: space-between; gap: 16px; margin-top: 16px; padding-top: 6px; border-top: 1px solid #111; }
</style></head><body>
  <main class="report">
    <div class="top-rule"></div>
    <section class="header">
      <div>
        <div class="company">${esc(empresaNombre)}</div>
        <div class="subtitle">Modulo de contabilidad | Gestion de gastos</div>
      </div>
      <div class="title-box">
        <div class="report-title">Reporte contable de entradas</div>
        <div class="report-code">Gasto No. ${esc(gasto.codigo || '')}</div>
      </div>
    </section>
    <section class="meta-grid">
      <div class="meta-cell"><span class="label">Fecha gasto</span><span class="value">${esc(formatFecha(gasto.fecha))}</span></div>
      <div class="meta-cell"><span class="label">Factura</span><span class="value">${esc(gasto.factura || '-')}</span></div>
      <div class="meta-cell"><span class="label">Forma pago</span><span class="value">${esc(gasto.forma_pago_nombre || gasto.forma_pago || '-')}</span></div>
      <div class="meta-cell"><span class="label">Total gasto</span><span class="value">${esc(formatMoneda(gasto.total))}</span></div>
      <div class="meta-cell wide"><span class="label">Proveedor</span><span class="value">${esc(gasto.proveedor_nombre || gasto.proveedor || '-')}</span></div>
      <div class="meta-cell"><span class="label">Centro costo</span><span class="value">${esc(gasto.ccosto_nombre || gasto.ccosto || '-')}</span></div>
      <div class="meta-cell"><span class="label">Cuenta contable</span><span class="value">${esc(gasto.cuenta_nombre || gasto.cuenta || '-')}</span></div>
      <div class="meta-cell wide"><span class="label">Concepto</span><span class="value">${esc(gasto.concepto || '-')}</span></div>
      <div class="meta-cell"><span class="label">Registros almacen</span><span class="value">${entradasDlg.value.length}</span></div>
      <div class="meta-cell"><span class="label">Fecha impresion</span><span class="value">${esc(fechaImpresion)}</span></div>
    </section>
    <div class="section-title">Detalle de entradas asociadas</div>
    <table>
      <thead><tr><th class="tc">Item</th><th class="tc">Fecha</th><th class="tc">Entrada</th><th class="tc">Codigo</th><th>Producto</th><th class="tc">Und</th><th class="tr">Cantidad</th><th class="tr">P. unit</th><th class="tr">Subtotal</th></tr></thead>
      <tbody>
        ${rows || '<tr><td colspan="9" class="tc">No hay entradas de almacen registradas.</td></tr>'}
        <tr class="total-row"><td colspan="8" class="tr">TOTAL ENTRADAS DE ALMACEN</td><td class="tr">${esc(formatMoneda(totalEntradas))}</td></tr>
      </tbody>
    </table>
    <section class="notes">
      <div class="note-box"><span class="label">Observaciones contables</span>Documento generado desde el gasto registrado. Verificar cantidades, costo unitario y cuenta contable antes del cierre.</div>
      <div class="note-box"><span class="label">Conciliacion</span>Diferencia gasto vs entradas: ${esc(formatMoneda(diferencia))}</div>
    </section>
    <section class="signatures">
      <div class="signature">Elaborado por</div>
      <div class="signature">Revisado por almacen</div>
      <div class="signature">Aprobado contabilidad</div>
    </section>
    <footer class="footer"><span>Usuario: ${esc(auth.userName || auth.userNombre || 'Usuario')}</span><span>Pagina 1 de 1</span></footer>
  </main>
</body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 400)
}

function imprimirEntradasLegacy() {
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

// Filtrado
const filteredGastos = computed(() => {
  let list = [...store.gastos]

  // Ocultar registros automáticos (sin proveedor) a menos que el usuario los pida
  if (store.filtroSoloConProveedor) {
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
/* ════════════════════════════════════════════════════════════════ */
/* TABLA MODERNA CON ANIMACIONES                                   */
/* ════════════════════════════════════════════════════════════════ */

/* ── Contenedor ── */
.table-container {
  background: rgb(var(--v-theme-surface));
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  animation: containerFadeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes containerFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Header búsqueda moderno ── */
.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
  border-bottom: 1.5px solid rgba(var(--v-theme-on-surface), 0.08);
}

.search-bar {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 10px;
  padding: 11px 14px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 10px;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.12);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-bar:focus-within {
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-color: var(--indigo);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.search-icon { color: rgba(var(--v-theme-on-surface), 0.4); flex-shrink: 0; }

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.search-input::placeholder {
  color: rgba(var(--v-theme-on-surface), 0.45);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ── TOGGLE MODERNO ── */
.toggle-proveedor {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 6px;
}

.toggle-proveedor input[type="checkbox"] {
  display: none;
}

.toggle-proveedor-label {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.6);
  padding: 7px 12px;
  border-radius: 8px;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.15);
  background: rgba(var(--v-theme-on-surface), 0.04);
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  letter-spacing: 0.3px;
}

.toggle-proveedor:hover .toggle-proveedor-label {
  border-color: rgba(var(--v-theme-on-surface), 0.25);
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.85);
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

/* ── ENCABEZADOS MODERNOS ── */
.data-table thead {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(99, 102, 241, 0.02) 100%);
}

.data-table thead th {
  padding: 0;
  border-bottom: 1.5px solid rgba(var(--v-theme-on-surface), 0.1);
}

.th-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 10px;
  font-weight: 800;
  font-size: 10px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.65);
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.th-inner:hover:not(.col-acciones .th-inner) {
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.col-acciones .th-inner {
  cursor: default;
}

.col-acciones .th-inner:hover {
  background: none;
  color: rgba(var(--v-theme-on-surface), 0.65);
}

.sort-icon {
  color: var(--indigo);
  font-size: 12px;
}

.sort-icon-inactive {
  color: rgba(var(--v-theme-on-surface), 0.15);
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
}

.th-inner:hover .sort-icon-inactive {
  opacity: 1;
}

/* ── FILAS CON ANIMACIÓN ── */
.data-table tbody tr {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  animation: rowSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes rowSlideIn {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.data-table tbody tr:hover {
  background: rgba(var(--v-theme-on-surface), 0.06);
  box-shadow: inset 0 0 0 1px rgba(var(--v-theme-on-surface), 0.1);
}

.data-table tbody td {
  padding: 13px 10px;
  color: rgb(var(--v-theme-on-surface));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

/* Empty state */
.table-empty {
  text-align: center !important;
  padding: 40px !important;
  white-space: normal !important;
}
.empty-icon { color: rgba(var(--v-theme-on-surface), 0.2); display: block; margin: 0 auto 8px; }
.empty-text { color: rgba(var(--v-theme-on-surface), 0.4); font-size: 14px; margin: 0; }

/* ── CELDAS MODERNAS ── */
.td-codigo { text-align: center; }

.badge-codigo {
  background: rgba(79, 70, 229, 0.15);
  color: var(--indigo);
  padding: 4px 10px;
  border-radius: 7px;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.3px;
  display: inline-block;
}

.td-fecha {
  text-align: center;
  font-variant-numeric: tabular-nums;
  color: rgba(var(--v-theme-on-surface), 0.75);
}

.td-proveedor {
  text-align: left;
  font-weight: 500;
}

.td-centro { text-align: center; }

.badge-centro {
  background: rgba(240, 168, 60, 0.15);
  color: #b8720b;
  padding: 4px 10px;
  border-radius: 7px;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.3px;
  display: inline-block;
}

.td-forma-pago { text-align: center; }

.badge-forma-pago {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  padding: 4px 10px;
  border-radius: 7px;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.3px;
  display: inline-block;
}

.td-concepto {
  text-align: left;
  color: rgba(var(--v-theme-on-surface), 0.8);
}

.td-factura {
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.td-total { text-align: right; }

.total-bold {
  font-weight: 800;
  color: var(--indigo);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 13px;
}

.td-acciones { text-align: center; }

.action-buttons {
  display: flex;
  gap: -8px;
  justify-content: center;
  align-items: center;
}

.action-buttons :deep(.v-btn) {
  margin: 0 -6px;
  padding: 0 4px;
}

.text-muted {
  color: rgba(var(--v-theme-on-surface), 0.4);
}

/* ── PAGINACIÓN MODERNA ── */
.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-top: 1.5px solid rgba(var(--v-theme-on-surface), 0.08);
  flex-wrap: wrap;
  gap: 16px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.pagination {
  display: flex;
  align-items: center;
  gap: 6px;
}

.page-info {
  font-size: 13px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.7);
  min-width: 140px;
  text-align: center;
  letter-spacing: 0.2px;
}

/* Selector de registros por página */
.page-size-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-size-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.6);
  white-space: nowrap;
  letter-spacing: 0.2px;
}

.page-size-options {
  display: flex;
  gap: 4px;
}

.page-size-btn {
  padding: 5px 11px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 7px;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.18);
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.65);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.3px;
}

.page-size-btn:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.35);
  color: rgba(var(--v-theme-on-surface), 0.9);
  background: rgba(var(--v-theme-on-surface), 0.06);
}

.page-size-btn--active {
  background: linear-gradient(135deg, var(--indigo), #6366f1);
  border-color: var(--indigo);
  color: #fff;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
}

/* ── POPUP ENTRADAS MODERNO ── */
.dlg-card {
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15) !important;
}

.dlg-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  background: linear-gradient(135deg, var(--indigo) 0%, #6366f1 100%);
}

.dlg-header-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(8px);
}

.dlg-title {
  font-size: 16px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.3px;
}

.dlg-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 2px;
  font-weight: 500;
}

.dlg-body {
  padding: 24px !important;
  min-height: 120px;
}

.dlg-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 0;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.dlg-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 0;
  color: rgba(var(--v-theme-on-surface), 0.45);
  font-size: 14px;
}

.dlg-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.dlg-table thead {
  background: rgba(var(--v-theme-on-surface), 0.05);
}

.dlg-table th {
  padding: 12px 10px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  color: rgba(var(--v-theme-on-surface), 0.65);
  border-bottom: 1.5px solid rgba(var(--v-theme-on-surface), 0.1);
  text-align: center;
}

.dlg-table td {
  padding: 12px 10px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  color: rgb(var(--v-theme-on-surface));
}

.badge-cc-dlg {
  background: rgba(79, 70, 229, 0.15);
  color: var(--indigo);
  padding: 3px 9px;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.tc {
  text-align: center !important;
}

.tr {
  text-align: right !important;
}

.fw {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.text-muted-sm {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.dlg-print-head {
  display: none;
}
</style>
