<template>
  <MainLayout>

    <PageHeader
      title="Reporte de Gastos"
      description="Análisis detallado agrupado por cuenta contable"
      :crumbs="['Contabilidad', 'Reportes', 'Reporte de Gastos']"
    >
      <template #actions>
        <v-btn
          v-if="gastos.length > 0"
          size="large"
          color="error"
          variant="flat"
          prepend-icon="mdi-file-pdf-box"
          :loading="generandoPdf"
          @click="generarPDF"
        >
          Generar PDF
        </v-btn>
      </template>
    </PageHeader>

    <!-- ── PANEL DE FILTROS MODERNO ───────────────────────────────── -->
    <div class="filters-panel-modern mb-6">
      <div class="filters-header">
        <div class="filters-title-group">
          <v-icon size="20" color="var(--indigo)">mdi-filter-outline</v-icon>
          <h3 class="filters-title">Filtros de Búsqueda</h3>
        </div>
        <span class="filters-subtitle">Selecciona los parámetros para consultar gastos</span>
      </div>

      <div class="filters-grid-modern">

        <!-- Fechas -->
        <div class="filter-group-modern dates-group-modern">
          <label class="filter-label-modern">
            <v-icon size="16" color="var(--indigo)">mdi-calendar-range</v-icon>
            <span>Período</span>
          </label>
          <div class="dates-row-modern">
            <div class="date-input-wrapper">
              <input v-model="filtros.fechaInicial" type="date" class="date-input-modern" title="Fecha inicial" />
              <v-icon size="14" color="rgba(var(--v-theme-on-surface), 0.4)" class="input-icon">mdi-calendar</v-icon>
            </div>
            <div class="dates-separator">
              <v-icon size="14" color="rgba(var(--v-theme-on-surface), 0.3)">mdi-arrow-right</v-icon>
            </div>
            <div class="date-input-wrapper">
              <input v-model="filtros.fechaFinal" type="date" class="date-input-modern" title="Fecha final" />
              <v-icon size="14" color="rgba(var(--v-theme-on-surface), 0.4)" class="input-icon">mdi-calendar</v-icon>
            </div>
          </div>
        </div>

        <!-- Proveedor -->
        <div class="filter-group-modern">
          <label class="filter-label-modern">
            <v-icon size="16" color="var(--success)">mdi-truck-outline</v-icon>
            <span>Proveedor</span>
          </label>
          <div class="select-wrapper">
            <select v-model="filtros.proveedor" class="filter-select-modern">
              <option value="">TODOS LOS PROVEEDORES</option>
              <option v-for="p in proveedores" :key="p.codigo" :value="p.codigo">
                {{ p.nombre }}
              </option>
            </select>
            <v-icon size="16" color="var(--success)" class="select-icon">mdi-chevron-down</v-icon>
          </div>
        </div>

        <!-- Cuenta Bancaria -->
        <div class="filter-group-modern">
          <label class="filter-label-modern">
            <v-icon size="16" color="var(--gold)">mdi-bank-outline</v-icon>
            <span>Cuenta Bancaria</span>
          </label>
          <div class="select-wrapper">
            <select v-model="filtros.cuentaBancaria" class="filter-select-modern">
              <option value="">TODAS LAS CUENTAS</option>
              <option v-for="cb in cuentasBancarias" :key="cb.codigo" :value="cb.codigo">
                {{ cb.nombre_cta }}
              </option>
            </select>
            <v-icon size="16" color="var(--gold)" class="select-icon">mdi-chevron-down</v-icon>
          </div>
        </div>

        <!-- Cuenta Contable -->
        <div class="filter-group-modern">
          <label class="filter-label-modern">
            <v-icon size="16" color="var(--purple)">mdi-book-outline</v-icon>
            <span>Cuenta Contable</span>
          </label>
          <div class="select-wrapper">
            <select v-model="filtros.cuentaContable" class="filter-select-modern">
              <option value="">TODAS LAS CUENTAS</option>
              <option v-for="c in cuentasContables" :key="c.codigo" :value="c.codigo">
                {{ c.nombre_cta || c.nombre || c.cuenta }}
              </option>
            </select>
            <v-icon size="16" color="var(--purple)" class="select-icon">mdi-chevron-down</v-icon>
          </div>
        </div>

      </div>

      <!-- Botón consultar mejorado -->
      <div class="filters-actions">
        <button class="btn-consultar-modern" :disabled="loading" @click="consultar">
          <span class="btn-icon" v-if="!loading">
            <v-icon size="18">mdi-magnify</v-icon>
          </span>
          <span class="btn-icon" v-else>
            <v-progress-circular size="16" width="2" indeterminate color="white" />
          </span>
          <span class="btn-text">{{ loading ? 'Consultando...' : 'Consultar' }}</span>
        </button>
      </div>
    </div>

    <!-- ── KPI CARDS ──────────────────────────────────────────────── -->
    <div v-if="gastos.length > 0" class="kpi-row mb-5">
      <KpiCard :index="0" label="Total Registros" :value="gastos.length" icon="mdi-receipt-text-outline" color="var(--indigo)" />
      <KpiCard :index="1" label="Total Período" :value="formatMoneda(totalGeneral)" icon="mdi-cash-multiple" color="var(--success)" />
      <KpiCard :index="2" label="Cuentas Contables" :value="grupos.length" icon="mdi-book-outline" color="var(--gold)" />
    </div>

    <!-- ── DATOS: TABLAS MODERNAS ───────────────────────────────────── -->
    <div v-if="gastos.length > 0" class="data-section-modern">

      <div v-for="(grupo, idx) in grupos" :key="grupo.cuenta" class="grupo-block-modern" :style="{ '--stagger': idx * 50 + 'ms' }">

        <!-- Encabezado de grupo animado -->
        <div class="grupo-header-modern">
          <div class="grupo-header-left-modern">
            <div class="cuenta-badge-modern">{{ grupo.cuenta }}</div>
            <div class="grupo-info">
              <span class="cuenta-nombre-modern">{{ grupo.cuenta_nombre }}</span>
              <span class="grupo-count-modern">{{ grupo.items.length }} gasto{{ grupo.items.length !== 1 ? 's' : '' }}</span>
            </div>
          </div>
          <div class="grupo-subtotal-pill">{{ formatMoneda(grupo.subtotal) }}</div>
        </div>

        <!-- Tabla moderna -->
        <div class="tabla-wrapper-modern">
          <table class="preview-table-modern">
            <colgroup>
              <col style="width: 100px" />
              <col style="width: 100px" />
              <col style="width: 14%" />
              <col style="width: 120px" />
              <col style="width: 150px" />
              <col style="width: 110px" />
              <col style="width: 110px" />
            </colgroup>
            <thead>
              <tr class="table-header-modern">
                <th class="th-left">CÓDIGO</th>
                <th class="th-center">FECHA</th>
                <th class="th-left">PROVEEDOR</th>
                <th class="th-left">CONCEPTO</th>
                <th class="th-center">FORMA PAGO</th>
                <th class="th-center">C. COSTO</th>
                <th class="th-right">VALOR</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(g, rowIdx) in grupo.items" :key="g.codigo" class="table-row-modern" :style="{ '--row-delay': rowIdx * 30 + 'ms' }">
                <td class="td-left">
                  <span class="badge-codigo-moderno">{{ g.codigo }}</span>
                </td>
                <td class="td-center td-date">{{ formatFecha(g.fecha) }}</td>
                <td class="td-left td-provider">
                  <span class="provider-name">{{ (!g.proveedor || g.proveedor === '0') ? '-' : (g.proveedor_nombre || g.proveedor) }}</span>
                </td>
                <td class="td-left td-concept">{{ g.concepto || '-' }}</td>
                <td class="td-center">
                  <span class="badge-pill">{{ g.forma_pago_nombre || g.forma_pago || '-' }}</span>
                </td>
                <td class="td-center">
                  <span class="badge-pill-secondary">{{ g.ccosto_nombre || g.ccosto || '-' }}</span>
                </td>
                <td class="td-right td-amount">
                  <strong class="amount-value">{{ formatMoneda(g.total) }}</strong>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="subtotal-row-modern">
                <td colspan="6" class="subtotal-label-modern">
                  SUBTOTAL <strong>{{ grupo.cuenta_nombre.toUpperCase() }}</strong>
                </td>
                <td class="subtotal-value-modern">
                  <strong>{{ formatMoneda(grupo.subtotal) }}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>

      <!-- Total General mejorado -->
      <div class="total-general-modern">
        <div class="tg-content">
          <span class="tg-label-modern">TOTAL GENERAL</span>
          <span class="tg-value-modern">{{ formatMoneda(totalGeneral) }}</span>
        </div>
      </div>

    </div>

    <!-- ── EMPTY STATE ────────────────────────────────────────────── -->
    <div v-else-if="consultado && !loading" class="empty-state">
      <v-icon size="52" color="rgba(var(--v-theme-on-surface),0.15)">mdi-file-search-outline</v-icon>
      <p class="empty-title">Sin resultados</p>
      <p class="empty-sub">No se encontraron gastos con los filtros seleccionados.</p>
    </div>

    <!-- ── INICIAL STATE ──────────────────────────────────────────── -->
    <div v-else-if="!consultado && !loading" class="initial-state">
      <div class="initial-card">
        <v-icon size="48" color="var(--gold)" class="mb-3">mdi-filter-outline</v-icon>
        <p class="initial-title">Selecciona los filtros y presiona <strong>Consultar</strong></p>
        <p class="initial-sub">El reporte se generará agrupado por cuenta contable</p>
      </div>
    </div>

  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import KpiCard from '../../components/common/KpiCard.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import { useAuthStore } from '../../stores/auth'
import { proveedoresService } from '../../services/proveedores.service'
import { cuentasBancariasService } from '../../services/cuentasbancarias.service'
import { cuentasContablesService } from '../../services/cuentascontables.service'
import { gestionGastosService } from '../../services/gestiongastos.service'
import { formatMoneda, formatFecha } from '../../utils/formatters'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const auth = useAuthStore()

// ── Fecha inicial = primer día del mes actual ──────────────────────
const hoy = new Date()
const primerDiaMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`
const ultimoDiaMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()).padStart(2, '0')}`

const filtros = ref({
  fechaInicial: primerDiaMes,
  fechaFinal: ultimoDiaMes,
  proveedor: '',
  cuentaBancaria: '',
  cuentaContable: '',
})

const proveedores         = ref([])
const cuentasBancarias    = ref([])
const cuentasContables    = ref([])
const gastos              = ref([])
const loading             = ref(false)
const generandoPdf        = ref(false)
const consultado          = ref(false)
const empresaInfo         = ref({})

// ── Cargar listas de selectores al montar ────────────────────────
onMounted(async () => {
  try {
    const [prov, cb, cc, emp] = await Promise.all([
      proveedoresService.getProveedores({ limit: 2000 }),
      cuentasBancariasService.getCuentas({ limit: 500 }),
      cuentasContablesService.getCuentasContables({ limit: 500 }),
      import('../../services/api').then(m => m.default.get('/empresa/info', { params: { empresa: auth.empresa } })),
    ])
    proveedores.value      = Array.isArray(prov)      ? prov      : (prov.data      || [])
    cuentasBancarias.value = Array.isArray(cb)        ? cb        : (cb.data        || [])
    cuentasContables.value = Array.isArray(cc)        ? cc        : (cc.data        || [])
    empresaInfo.value      = emp.data?.data || {}
  } catch (err) {
    console.error('Error cargando opciones:', err)
  }
})

// ── Consultar datos ──────────────────────────────────────────────
async function consultar() {
  if (!filtros.value.fechaInicial || !filtros.value.fechaFinal) return
  loading.value = true
  consultado.value = true
  try {
    const params = {
      empresa: auth.empresa,
      fechaInicial: filtros.value.fechaInicial,
      fechaFinal: filtros.value.fechaFinal,
    }
    if (filtros.value.proveedor)      params.proveedor      = filtros.value.proveedor
    if (filtros.value.cuentaBancaria) params.cuentaBancaria = filtros.value.cuentaBancaria
    if (filtros.value.cuentaContable) params.cuentaContable = filtros.value.cuentaContable

    const res = await gestionGastosService.getReporte(params)
    gastos.value = res.gastos || res.data || []
  } catch (err) {
    console.error('Error al consultar reporte:', err)
    gastos.value = []
  } finally {
    loading.value = false
  }
}

// ── Agrupar por cuenta contable ──────────────────────────────────
const grupos = computed(() => {
  const map = new Map()
  for (const g of gastos.value) {
    const key = g.cuenta || 'SIN-CUENTA'
    if (!map.has(key)) {
      map.set(key, {
        cuenta: g.cuenta || 'S/C',
        cuenta_nombre: g.cuenta_nombre || g.cuenta || 'Sin Cuenta Contable',
        items: [],
        subtotal: 0,
      })
    }
    const grp = map.get(key)
    grp.items.push(g)
    grp.subtotal += parseFloat(g.total) || 0
  }
  return Array.from(map.values()).sort((a, b) => a.cuenta.localeCompare(b.cuenta))
})

const totalGeneral = computed(() => grupos.value.reduce((s, g) => s + g.subtotal, 0))
const totalImpuestos = computed(() => gastos.value.reduce((s, g) => s + (parseFloat(g.impuestos) || 0), 0))

// ── Etiquetas descriptivas de los filtros ────────────────────────
function filtroProveedorLabel() {
  if (!filtros.value.proveedor) return 'TODOS LOS PROVEEDORES'
  const p = proveedores.value.find(x => x.codigo === filtros.value.proveedor)
  return p ? p.nombre : filtros.value.proveedor
}
function filtroBancoLabel() {
  if (!filtros.value.cuentaBancaria) return 'TODAS LAS CUENTAS BANCARIAS'
  const cb = cuentasBancarias.value.find(x => x.codigo === filtros.value.cuentaBancaria)
  return cb ? cb.nombre_cta : filtros.value.cuentaBancaria
}
function filtroCuentaLabel() {
  if (!filtros.value.cuentaContable) return 'TODAS LAS CUENTAS CONTABLES'
  const cc = cuentasContables.value.find(x => x.codigo === filtros.value.cuentaContable)
  return cc ? cc.cuenta : filtros.value.cuentaContable
}

// ── GENERAR PDF ──────────────────────────────────────────────────
async function generarPDF() {
  if (grupos.value.length === 0) return
  generandoPdf.value = true

  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
    const PW  = doc.internal.pageSize.getWidth()   // 279mm
    const PH  = doc.internal.pageSize.getHeight()  // 216mm
    const ML  = 8
    const MR  = 8
    const TW  = PW - ML - MR   // 263mm

    // ── Constantes de diseño ──────────────────────────────────────
    const HDR_H  = 31   // altura del header
    const FTR_H  = 10   // espacio reservado para pie de página

    // ── Paleta moderna: índigo profundo + emerald ─────────────────
    const C_BLACK = [0, 0, 0]
    const C_TEXT = [22, 22, 22]
    const C_MUTED = [72, 72, 72]
    const C_RULE = [0, 0, 0]
    const C_RULE_SOFT = [115, 115, 115]

    // ── Datos empresa y usuario ───────────────────────────────────
    const emp       = empresaInfo.value
    const empNombre = (emp.nombre   || auth.empresaNombre || 'EMPRESA').toUpperCase()
    const empDir    = emp.direccion || emp.dir || ''
    const empTel    = emp.telefono1 || emp.telefono || emp.tel || ''

    // PIE DE PÁGINA: mostrar USUARIO de login, no nombre completo
    const usuario   = auth.userName || auth.userNombre || 'Usuario'

    // ── Helper: formato fecha MM/DD/AAAA ─────────────────────────
    function fmtF(isoStr) {
      const d = (isoStr || '').split('T')[0]
      const p = d.split('-')
      return p.length === 3 ? `${p[1]}/${p[2]}/${p[0]}` : d
    }

    // ── Fecha+hora actual MM/DD/AAAA HH:MM ───────────────────────
    const ahora = new Date()
    const fechaHoraGen = `${String(ahora.getMonth()+1).padStart(2,'0')}/${String(ahora.getDate()).padStart(2,'0')}/${ahora.getFullYear()} ${String(ahora.getHours()).padStart(2,'0')}:${String(ahora.getMinutes()).padStart(2,'0')}`

    // ── Placeholder para total de páginas ─────────────────────────
    const TOTAL_PGS = '{total_pages_count_string}'

    let y = 0

    // ── PIE DE PÁGINA ─────────────────────────────────────────────
    function drawFooter() {
      const pg  = doc.internal.getCurrentPageInfo().pageNumber
      const yL  = PH - FTR_H + 2
      const yTx = PH - FTR_H + 6.5
      doc.setDrawColor(...C_RULE_SOFT)
      doc.setLineWidth(0.18)
      doc.line(ML, yL, PW - MR, yL)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.setTextColor(...C_MUTED)
      doc.text(`Informe generado por ${usuario} el ${fechaHoraGen}`, ML, yTx)
      doc.text(`Pagina ${pg} de ${TOTAL_PGS}`, PW - 3, yTx, { align: 'right' })
    }

    // ── ENCABEZADO ────────────────────────────────────────────────
    // Alineado con márgenes ML/MR, con margen superior MT
    function drawHeader(isFirstPage = false) {
      const MT       = 8              // margen superior (espacio en blanco arriba)
      const SPLIT_LW = TW * 0.58
      const SPLIT_RW = TW * 0.42
      const SPLIT_X  = ML + SPLIT_LW
      const rCX      = SPLIT_X + SPLIT_RW / 2
      const BH       = HDR_H - MT    // altura real del bloque de color

      // ── Bloque izquierdo (empieza en MT, no en 0) ────────────
      doc.setDrawColor(...C_RULE)
      doc.setLineWidth(0.45)
      doc.line(ML, MT, PW - MR, MT)

      // ── Bloque derecho ────────────────────────────────────────
      doc.setDrawColor(...C_RULE)
      doc.setLineWidth(0.32)
      doc.line(ML, MT + 19, PW - MR, MT + 19)

      // ── Barra inferior: indigo claro ──────────────────────────
      doc.setDrawColor(...C_RULE_SOFT)
      doc.setLineWidth(0.18)
      doc.line(ML, MT + 19.8, PW - MR, MT + 19.8)

      // ── Nombre empresa ────────────────────────────────────────
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...C_BLACK)
      doc.text(empNombre, ML, MT + 6)

      // Dirección y teléfono
      const contactLine = [empDir, empTel].filter(Boolean).join('   |   ')
      if (contactLine) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6.5)
        doc.setTextColor(...C_TEXT)
        doc.text(contactLine, ML, MT + 11.5)
      }

      // ── Título del reporte ────────────────────────────────────
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...C_BLACK)
      doc.text('REPORTE DE GASTOS', PW - MR, MT + 6, { align: 'right' })

      // Período
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(...C_TEXT)
      doc.text(
        `${fmtF(filtros.value.fechaInicial)}  al  ${fmtF(filtros.value.fechaFinal)}`,
        PW - MR, MT + 11.5, { align: 'right' }
      )

      doc.setFontSize(6)
      doc.setTextColor(...C_MUTED)
      doc.text(`Generado: ${fechaHoraGen}`, ML, MT + 16)
      doc.text(`Usuario: ${usuario}`, PW - MR, MT + 16, { align: 'right' })

      y = HDR_H + 2

      // ── Filtros (solo primera página) ─────────────────────────
      if (isFirstPage) {
        doc.setDrawColor(...C_RULE_SOFT)
        doc.setLineWidth(0.18)
        doc.line(ML, y, PW - MR, y)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(5)
        doc.setTextColor(...C_BLACK)
        doc.text('FILTROS APLICADOS', ML, y + 3)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6)
        doc.setTextColor(...C_TEXT)
        const cw = TW / 3
        doc.text(`Proveedor: ${filtroProveedorLabel()}`,    ML,        y + 6.2)
        doc.text(`Banco: ${filtroBancoLabel()}`,            ML + cw,   y + 6.2)
        doc.text(`Cuenta: ${filtroCuentaLabel()}`,          ML + cw*2, y + 6.2)
        doc.line(ML, y + 8.2, PW - MR, y + 8.2)
        // Espacio generoso entre filtros y primer grupo
        y += 13
      }
    }

    // ── SET de páginas donde ya se dibujó el header ───────────────
    const headerPages = new Set()

    function ensureHeader() {
      const pg = doc.internal.getCurrentPageInfo().pageNumber
      if (!headerPages.has(pg)) {
        drawHeader(false)
        headerPages.add(pg)
      }
    }

    // ── PÁGINA 1: header con filtros ──────────────────────────────
    drawHeader(true)
    headerPages.add(1)

    // ── Configuración de celdas ───────────────────────────────────
    // Columnas: suman exactamente TW = 263mm
    const colStyles = {
      0: { cellWidth: 22, halign: 'center' },   // CODIGO
      1: { cellWidth: 18, halign: 'center' },   // FECHA
      2: { cellWidth: 48, halign: 'left'   },   // PROVEEDOR
      3: { cellWidth: 70, halign: 'left'   },   // CONCEPTO
      4: { cellWidth: 42, halign: 'center' },   // FORMA PAGO
      5: { cellWidth: 36, halign: 'center' },   // C.COSTO
      6: { cellWidth: 27, halign: 'right'  },   // VALOR
    }                                            // Total: 263 ✓
    const cellPad = { top: 1.5, right: 2.5, bottom: 1.5, left: 2.5 }

    // ── ITERAR GRUPOS ─────────────────────────────────────────────
    for (let gi = 0; gi < grupos.value.length; gi++) {
      const grupo = grupos.value[gi]

      // Si no hay espacio (< 28mm) para barra de grupo + cabecera de tabla + 1 fila
      if (y > PH - FTR_H - 28) {
        drawFooter()
        doc.addPage()
        drawHeader(false)
        headerPages.add(doc.internal.getCurrentPageInfo().pageNumber)
      }

      // ── Barra de encabezado del grupo ────────────────────────
      doc.setDrawColor(...C_RULE)
      doc.setLineWidth(0.25)
      doc.line(ML, y, ML + TW, y)
      doc.line(ML, y + 6.5, ML + TW, y + 6.5)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(...C_BLACK)
      doc.text(`${grupo.cuenta}  —  ${grupo.cuenta_nombre}`, ML + 6, y + 4.4)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.setTextColor(...C_MUTED)
      doc.text(`${grupo.items.length} registros`, ML + TW, y + 4.4, { align: 'right' })

      y += 6

      // ── Tabla del grupo ──────────────────────────────────────
      autoTable(doc, {
        startY: y,
        margin: { left: ML, right: MR, top: HDR_H + 0.8 + 3, bottom: FTR_H + 2 },
        head: [[
          { content: 'CODIGO',     styles: { halign: 'center' } },
          { content: 'FECHA',      styles: { halign: 'center' } },
          { content: 'PROVEEDOR',  styles: { halign: 'left'   } },
          { content: 'CONCEPTO',   styles: { halign: 'left'   } },
          { content: 'FORMA PAGO', styles: { halign: 'center' } },
          { content: 'C. COSTO',   styles: { halign: 'center' } },
          { content: 'VALOR',      styles: { halign: 'right'  } },
        ]],
        body: grupo.items.map(g => [
          { content: g.codigo,                                   styles: { halign: 'center', fontStyle: 'bold', textColor: C_BLACK } },
          { content: fmtF(g.fecha),                              styles: { halign: 'center' } },
          { content: (!g.proveedor || g.proveedor === '0') ? '' : (g.proveedor_nombre || g.proveedor), styles: { halign: 'left' } },
          { content: g.concepto          || '-',                 styles: { halign: 'left'   } },
          { content: g.forma_pago_nombre || g.forma_pago || '-', styles: { halign: 'center' } },
          { content: g.ccosto_nombre     || g.ccosto     || '-', styles: { halign: 'center' } },
          { content: formatMoneda(g.total),                      styles: { halign: 'right', fontStyle: 'bold', textColor: C_BLACK } },
        ]),
        foot: [[
          { content: `SUBTOTAL  ${grupo.cuenta_nombre.toUpperCase()}`,
            colSpan: 6,
            styles: { halign: 'right', fontStyle: 'bold', fontSize: 6.5,
                      fillColor: false, textColor: C_BLACK, cellPadding: cellPad, lineWidth: { top: 0.35, bottom: 0.25 }, lineColor: C_RULE }
          },
          { content: formatMoneda(grupo.subtotal),
            styles: { halign: 'right', fontStyle: 'bold', fontSize: 6.5,
                      fillColor: false, textColor: C_BLACK, cellPadding: cellPad, lineWidth: { top: 0.35, bottom: 0.25 }, lineColor: C_RULE }
          },
        ]],
        showFoot: 'lastPage',
        headStyles: {
          fillColor: false,
          textColor: C_BLACK,
          fontStyle: 'bold',
          fontSize: 6,
          lineWidth: { top: 0.25, bottom: 0.35 },
          lineColor: C_RULE,
          cellPadding: { top: 2.5, right: 2.5, bottom: 2.5, left: 2.5 },
        },
        bodyStyles: { fontSize: 6.5, textColor: C_TEXT, fillColor: false, cellPadding: cellPad },
        alternateRowStyles: { fillColor: false },
        columnStyles: colStyles,
        tableLineColor: C_RULE_SOFT,
        tableLineWidth: 0.1,
        didParseCell: (data) => {
          data.cell.styles.fillColor = false
        },
        didDrawPage: (data) => {
          ensureHeader()   // Header en páginas creadas por autoTable
          drawFooter()
        },
      })

      y = doc.lastAutoTable.finalY + 9   // espacio entre grupos
    }

    // ── TOTAL GENERAL ─────────────────────────────────────────────
    if (y > PH - FTR_H - 18) {
      drawFooter()
      doc.addPage()
      drawHeader(false)
      headerPages.add(doc.internal.getCurrentPageInfo().pageNumber)
    }

    doc.setDrawColor(...C_RULE)
    doc.setLineWidth(0.45)
    doc.line(ML, y, ML + TW, y)
    doc.line(ML, y + 9, ML + TW, y + 9)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...C_BLACK)
    doc.text('TOTAL GENERAL', ML, y + 5.8)
    doc.setFontSize(10)
    doc.setTextColor(...C_BLACK)
    doc.text(formatMoneda(totalGeneral.value), ML + TW, y + 5.8, { align: 'right' })

    // ── RESUMEN POR CUENTA CONTABLE ───────────────────────────────
    if (grupos.value.length > 1) {
      y += 20
      if (y > PH - FTR_H - 30) {
        drawFooter()
        doc.addPage()
        drawHeader(false)
        headerPages.add(doc.internal.getCurrentPageInfo().pageNumber)
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(...C_BLACK)
      doc.text('RESUMEN POR CUENTA CONTABLE', ML, y)
      y += 3

      autoTable(doc, {
        startY: y,
        margin: { left: ML, right: MR, top: HDR_H + 0.8 + 3, bottom: FTR_H + 2 },
        head: [['CUENTA', 'DESCRIPCION', 'REGISTROS', 'SUBTOTAL']],
        body: grupos.value.map(g => [
          { content: g.cuenta,              styles: { fontStyle: 'bold', textColor: C_BLACK } },
          g.cuenta_nombre,
          { content: g.items.length,        styles: { halign: 'center' } },
          { content: formatMoneda(g.subtotal), styles: { halign: 'right', fontStyle: 'bold' } },
        ]),
        headStyles: { fillColor: false, textColor: C_BLACK, fontStyle: 'bold', fontSize: 6,
                      lineWidth: { top: 0.25, bottom: 0.35 }, lineColor: C_RULE,
                      cellPadding: { top: 2, right: 2.5, bottom: 2, left: 2.5 } },
        bodyStyles: { fontSize: 6.5, textColor: C_TEXT, fillColor: false, cellPadding: cellPad },
        alternateRowStyles: { fillColor: false },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 27, halign: 'right' },   // mismo ancho que columna VALOR
        },
        tableLineColor: C_RULE_SOFT,
        tableLineWidth: 0.1,
        didParseCell: (data) => {
          data.cell.styles.fillColor = false
        },
        didDrawPage: () => { ensureHeader(); drawFooter() },
      })
    }

    // ── Reemplazar placeholder de total páginas y abrir en ventana ─
    drawFooter()
    doc.putTotalPages(TOTAL_PGS)
    const blob = doc.output('blob')
    const url  = URL.createObjectURL(blob)
    window.open(url, '_blank')

  } catch (err) {
    console.error('Error generando PDF:', err)
  } finally {
    generandoPdf.value = false
  }
}
</script>

<style scoped>
/* ════════════════════════════════════════════════════════════════ */
/* PANEL DE FILTROS MODERNO                                         */
/* ════════════════════════════════════════════════════════════════ */

.filters-panel-modern {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 18px;
  padding: 28px 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.filters-header {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filters-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filters-title {
  font-size: clamp(1rem, 1.2vw, 1.3rem);
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
  letter-spacing: -0.4px;
  margin: 0;
}

.filters-subtitle {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-weight: 500;
}

.filters-grid-modern {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.filter-group-modern {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-label-modern {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

/* ── Inputs de fecha con icono ──────────────────────────────────── */
.dates-group-modern {
  grid-column: 1;
}

.dates-row-modern {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-input-wrapper {
  position: relative;
  flex: 1;
}

.date-input-modern {
  width: 100%;
  padding: 11px 12px 11px 14px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  outline: none;
  color-scheme: dark;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-variant-numeric: tabular-nums;
}

.date-input-modern:focus {
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-color: var(--indigo);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.date-input-modern:hover:not(:focus) {
  border-color: rgba(var(--v-theme-on-surface), 0.16);
  background: rgba(var(--v-theme-on-surface), 0.05);
}

.input-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.dates-separator {
  display: flex;
  align-items: center;
  height: 40px;
}

/* ── Select moderno ────────────────────────────────────────────── */
.select-wrapper {
  position: relative;
}

.filter-select-modern {
  width: 100%;
  padding: 11px 36px 11px 14px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  outline: none;
  cursor: pointer;
  appearance: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-select-modern:hover:not(:focus) {
  border-color: rgba(var(--v-theme-on-surface), 0.16);
  background: rgba(var(--v-theme-on-surface), 0.05);
}

.filter-select-modern:focus {
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-color: var(--indigo);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.filter-select-modern option {
  background: #1e1e2f;
  color: white;
}

.select-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

/* ── Botón consultar ────────────────────────────────────────────── */
.filters-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-consultar-modern {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 32px;
  background: linear-gradient(135deg, var(--indigo) 0%, #5b5fc7 100%);
  color: white;
  border: none;
  border-radius: 11px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
  letter-spacing: 0.3px;
}

.btn-consultar-modern:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.35);
}

.btn-consultar-modern:active:not(:disabled) {
  transform: translateY(0);
}

.btn-consultar-modern:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-text {
  font-weight: 700;
}

/* ════════════════════════════════════════════════════════════════ */
/* KPI CARDS                                                        */
/* ════════════════════════════════════════════════════════════════ */

.kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  animation: staggerIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes staggerIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ════════════════════════════════════════════════════════════════ */
/* DATOS: TABLAS MODERNAS                                           */
/* ════════════════════════════════════════════════════════════════ */

.data-section-modern {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.grupo-block-modern {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  animation: slideInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation-delay: var(--stagger);
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.grupo-block-modern:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.16);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.grupo-header-modern {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%);
  border-bottom: 1.5px solid rgba(var(--v-theme-on-surface), 0.08);
  gap: 16px;
}

.grupo-header-left-modern {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.cuenta-badge-modern {
  background: var(--indigo);
  color: white;
  font-size: 11px;
  font-weight: 800;
  padding: 5px 12px;
  border-radius: 8px;
  letter-spacing: 0.6px;
  white-space: nowrap;
  flex-shrink: 0;
}

.grupo-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.cuenta-nombre-modern {
  font-size: 14px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.grupo-count-modern {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-weight: 500;
}

.grupo-subtotal-pill {
  background: linear-gradient(135deg, var(--indigo), #6366f1);
  color: white;
  font-size: 13px;
  font-weight: 800;
  padding: 6px 16px;
  border-radius: 20px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
  flex-shrink: 0;
}

/* ── Tabla moderna ──────────────────────────────────────────────── */
.tabla-wrapper-modern {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.preview-table-modern {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  table-layout: fixed;
}

.table-header-modern th {
  background: rgba(var(--v-theme-on-surface), 0.04);
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  padding: 12px;
  border-bottom: 1.5px solid rgba(var(--v-theme-on-surface), 0.08);
  white-space: nowrap;
}

.th-left {
  text-align: left;
}

.th-center {
  text-align: center;
}

.th-right {
  text-align: right;
}

.table-row-modern {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  animation: rowFadeIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation-delay: var(--row-delay);
  animation-fill-mode: both;
}

@keyframes rowFadeIn {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.table-row-modern:hover {
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.preview-table-modern td {
  padding: 13px 12px;
  color: rgb(var(--v-theme-on-surface));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td-left {
  text-align: left;
}

.td-center {
  text-align: center;
}

.td-right {
  text-align: right;
}

.badge-codigo-moderno {
  background: rgba(79, 70, 229, 0.15);
  color: var(--indigo);
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  letter-spacing: 0.3px;
}

.provider-name {
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.badge-pill,
.badge-pill-secondary {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 16px;
  white-space: nowrap;
}

.badge-pill {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.badge-pill-secondary {
  background: rgba(240, 168, 60, 0.15);
  color: #b8720b;
}

.td-date {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.td-provider {
  font-weight: 600;
}

.td-concept {
  color: rgba(var(--v-theme-on-surface), 0.8);
}

.td-amount {
  font-variant-numeric: tabular-nums;
}

.amount-value {
  font-size: 13px;
  color: var(--indigo);
  font-weight: 800;
}

.subtotal-row-modern {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(99, 102, 241, 0.06) 100%);
  border-top: 2px solid rgba(79, 70, 229, 0.2);
  border-bottom: 1.5px solid rgba(79, 70, 229, 0.15);
}

.subtotal-label-modern {
  text-align: right;
  font-weight: 700;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.8);
  padding: 13px 12px;
}

.subtotal-value-modern {
  text-align: right;
  font-size: 14px;
  color: var(--indigo);
  padding: 13px 12px;
  font-variant-numeric: tabular-nums;
}

/* ── Total General ──────────────────────────────────────────────── */
.total-general-modern {
  background: linear-gradient(135deg, var(--indigo) 0%, #6366f1 100%);
  border-radius: 14px;
  padding: 24px 28px;
  box-shadow: 0 8px 24px rgba(79, 70, 229, 0.3);
  animation: totalAppear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes totalAppear {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.tg-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tg-label-modern {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.8);
}

.tg-value-modern {
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  font-weight: 900;
  color: white;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.5px;
}

/* ════════════════════════════════════════════════════════════════ */
/* EMPTY & INITIAL STATES                                           */
/* ════════════════════════════════════════════════════════════════ */

.empty-state, .initial-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.empty-title, .initial-title {
  font-size: 18px;
  font-weight: 800;
  margin: 16px 0 8px;
  color: rgb(var(--v-theme-on-surface));
}

.empty-sub, .initial-sub {
  font-size: 14px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  max-width: 400px;
}

.initial-card {
  background: rgb(var(--v-theme-surface));
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.15);
  border-radius: 18px;
  padding: 50px 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  backdrop-filter: blur(8px);
}

/* ════════════════════════════════════════════════════════════════ */
/* RESPONSIVE                                                        */
/* ════════════════════════════════════════════════════════════════ */

@media (max-width: 1200px) {
  .filters-grid-modern {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .dates-group-modern {
    grid-column: span 2;
  }
}

@media (max-width: 900px) {
  .filters-grid-modern {
    grid-template-columns: 1fr 1fr;
  }

  .dates-group-modern {
    grid-column: span 2;
  }

  .kpi-row {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 680px) {
  .filters-panel-modern {
    padding: 20px 16px;
  }

  .filters-grid-modern {
    grid-template-columns: 1fr;
  }

  .dates-group-modern {
    grid-column: 1;
  }

  .dates-row-modern {
    flex-direction: column;
    gap: 8px;
  }

  .kpi-row {
    grid-template-columns: 1fr;
  }

  .grupo-header-modern {
    flex-direction: column;
    align-items: flex-start;
  }

  .grupo-subtotal-pill {
    align-self: flex-start;
  }

  .preview-table-modern {
    font-size: 12px;
  }

  .preview-table-modern th,
  .preview-table-modern td {
    padding: 10px 8px;
  }

  .tg-value-modern {
    font-size: 1.8rem;
  }
}

</style>
