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

    <!-- ── PANEL DE FILTROS ───────────────────────────────────────── -->
    <div class="filters-panel mb-5">
      <div class="filters-grid">

        <!-- Fechas -->
        <div class="filter-group dates-group">
          <div class="filter-label">
            <v-icon size="14" color="var(--sidebar-accent)">mdi-calendar-range</v-icon>
            <span>Período</span>
          </div>
          <div class="dates-row">
            <input v-model="filtros.fechaInicial" type="date" class="date-input" title="Fecha inicial" />
            <v-icon size="16" color="rgba(255,255,255,0.3)">mdi-arrow-right</v-icon>
            <input v-model="filtros.fechaFinal" type="date" class="date-input" title="Fecha final" />
          </div>
        </div>

        <!-- Proveedor -->
        <div class="filter-group">
          <div class="filter-label">
            <v-icon size="14" color="var(--sidebar-accent)">mdi-truck-outline</v-icon>
            <span>Proveedor</span>
          </div>
          <select v-model="filtros.proveedor" class="filter-select">
            <option value="">TODOS LOS PROVEEDORES</option>
            <option v-for="p in proveedores" :key="p.codigo" :value="p.codigo">
              {{ p.nombre }}
            </option>
          </select>
        </div>

        <!-- Cuenta Bancaria -->
        <div class="filter-group">
          <div class="filter-label">
            <v-icon size="14" color="var(--sidebar-accent)">mdi-bank-outline</v-icon>
            <span>Cuenta Bancaria</span>
          </div>
          <select v-model="filtros.cuentaBancaria" class="filter-select">
            <option value="">TODAS LAS CUENTAS BANCARIAS</option>
            <option v-for="cb in cuentasBancarias" :key="cb.codigo" :value="cb.codigo">
              {{ cb.nombre_cta }}
            </option>
          </select>
        </div>

        <!-- Cuenta Contable -->
        <div class="filter-group">
          <div class="filter-label">
            <v-icon size="14" color="var(--sidebar-accent)">mdi-book-outline</v-icon>
            <span>Cuenta Contable</span>
          </div>
          <select v-model="filtros.cuentaContable" class="filter-select">
            <option value="">TODAS LAS CUENTAS</option>
            <option v-for="c in cuentasContables" :key="c.codigo" :value="c.codigo">
              {{ c.nombre_cta || c.nombre || c.cuenta }}
            </option>
          </select>
        </div>

      </div>

      <!-- Botón consultar -->
      <div class="filters-footer">
        <button class="btn-consultar" :disabled="loading" @click="consultar">
          <v-icon v-if="!loading" size="18">mdi-magnify</v-icon>
          <v-progress-circular v-else size="16" width="2" indeterminate color="white" />
          <span>{{ loading ? 'Consultando...' : 'Consultar' }}</span>
        </button>
      </div>
    </div>

    <!-- ── KPI CARDS ──────────────────────────────────────────────── -->
    <div v-if="gastos.length > 0" class="kpi-row mb-5">
      <KpiCard :index="0" label="Total Registros" :value="gastos.length" icon="mdi-receipt-text-outline" color="var(--indigo)" />
      <KpiCard :index="1" label="Total Período" :value="formatMoneda(totalGeneral)" icon="mdi-cash-multiple" color="var(--success)" />
      <KpiCard :index="2" label="Cuentas Contables" :value="grupos.length" icon="mdi-book-outline" color="var(--gold)" />
    </div>

    <!-- ── PREVIEW DE DATOS ───────────────────────────────────────── -->
    <div v-if="gastos.length > 0" class="preview-section">

      <div v-for="grupo in grupos" :key="grupo.cuenta" class="grupo-block">

        <!-- Encabezado de grupo -->
        <div class="grupo-header">
          <div class="grupo-header-left">
            <div class="cuenta-badge">{{ grupo.cuenta }}</div>
            <span class="cuenta-nombre">{{ grupo.cuenta_nombre }}</span>
            <span class="grupo-count">{{ grupo.items.length }} registros</span>
          </div>
        </div>

        <!-- Tabla del grupo -->
        <div class="grupo-table-wrap">
          <table class="preview-table">
            <colgroup>
              <col style="width: 130px" />
              <col style="width: 100px" />
              <col style="width: 18%" />
              <col style="width: auto" />
              <col style="width: 15%" />
              <col style="width: 14%" />
              <col style="width: 120px" />
            </colgroup>
            <thead>
              <tr>
                <th>CÓDIGO</th>
                <th>FECHA</th>
                <th>PROVEEDOR</th>
                <th>CONCEPTO</th>
                <th>FORMA PAGO</th>
                <th>C. COSTO</th>
                <th class="col-right">VALOR</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="g in grupo.items" :key="g.codigo">
                <td><span class="badge-cod">{{ g.codigo }}</span></td>
                <td class="td-center">{{ formatFecha(g.fecha) }}</td>
                <td>{{ (!g.proveedor || g.proveedor === '0') ? '' : (g.proveedor_nombre || g.proveedor) }}</td>
                <td class="td-concepto">{{ g.concepto || '-' }}</td>
                <td class="td-center">{{ g.forma_pago_nombre || g.forma_pago || '-' }}</td>
                <td class="td-center">{{ g.ccosto_nombre || g.ccosto || '-' }}</td>
                <td class="td-right td-total">{{ formatMoneda(g.total) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="subtotal-row">
                <td colspan="6" class="subtotal-label">SUBTOTAL {{ grupo.cuenta_nombre.toUpperCase() }}</td>
                <td class="subtotal-val">{{ formatMoneda(grupo.subtotal) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>

      <!-- Total General -->
      <div class="total-general-bar">
        <span class="tg-label">TOTAL GENERAL</span>
        <span class="tg-val">{{ formatMoneda(totalGeneral) }}</span>
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
    const HDR_H  = 22   // altura del header
    const FTR_H  = 10   // espacio reservado para pie de página

    // ── Paleta moderna: índigo profundo + emerald ─────────────────
    const C_INDIGO  = [30,  27,  75 ]   // #1E1B4B  fondo header
    const C_IND2    = [79,  70,  229]   // #4F46E5  acento indigo vivo
    const C_IND3    = [99,  102, 241]   // #6366F1  indigo claro
    const C_IND_BG  = [238, 240, 255]   // #EEF0FF  fondo grupo / subtotal
    const C_EMERALD = [16,  185, 129]   // #10B981  valor total general
    const C_DARK    = [30,  27,  75 ]   // texto oscuro (mismo indigo)
    const C_BODY    = [55,  65,  81 ]   // #374151  texto de filas
    const C_MID     = [107, 114, 128]   // #6B7280  secundario
    const C_GREY    = [156, 163, 175]   // #9CA3AF  footer
    const C_LGREY   = [209, 213, 219]   // #D1D5DB  bordes
    const C_ALTROW  = [249, 250, 255]   // casi blanco con tinte indigo
    const C_WHITE   = [255, 255, 255]

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
      doc.setDrawColor(...C_LGREY)
      doc.setLineWidth(0.3)
      doc.line(ML, yL, PW - MR, yL)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.setTextColor(...C_GREY)
      doc.text(`Informe generado por ${usuario} el ${fechaHoraGen}`, ML, yTx)
      doc.text(`Pagina ${pg} de ${TOTAL_PGS}`, PW - 3, yTx, { align: 'right' })
    }

    // ── ENCABEZADO ────────────────────────────────────────────────
    // Alineado con márgenes ML/MR, con margen superior MT
    function drawHeader(isFirstPage = false) {
      const MT       = 5              // margen superior (espacio en blanco arriba)
      const SPLIT_LW = TW * 0.58
      const SPLIT_RW = TW * 0.42
      const SPLIT_X  = ML + SPLIT_LW
      const rCX      = SPLIT_X + SPLIT_RW / 2
      const BH       = HDR_H - MT    // altura real del bloque de color

      // ── Bloque izquierdo (empieza en MT, no en 0) ────────────
      doc.setFillColor(...C_INDIGO)
      doc.rect(ML, MT, SPLIT_LW, BH, 'F')

      // ── Bloque derecho ────────────────────────────────────────
      doc.setFillColor(...C_IND2)
      doc.rect(SPLIT_X, MT, SPLIT_RW, BH, 'F')

      // ── Barra inferior: indigo claro ──────────────────────────
      doc.setFillColor(...C_IND3)
      doc.rect(ML, MT + BH - 2, TW, 2, 'F')

      // ── Nombre empresa ────────────────────────────────────────
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11.5)
      doc.setTextColor(...C_WHITE)
      doc.text(empNombre, ML + 5, MT + 7)

      // Dirección y teléfono
      const contactLine = [empDir, empTel].filter(Boolean).join('   |   ')
      if (contactLine) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6.5)
        doc.setTextColor(180, 190, 230)
        doc.text(contactLine, ML + 5, MT + 13)
      }

      // ── Título del reporte ────────────────────────────────────
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...C_WHITE)
      doc.text('REPORTE DE GASTOS', rCX, MT + 7, { align: 'center' })

      // Período
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(200, 210, 255)
      doc.text(
        `${fmtF(filtros.value.fechaInicial)}  al  ${fmtF(filtros.value.fechaFinal)}`,
        rCX, MT + 13, { align: 'center' }
      )

      y = HDR_H + 5

      // ── Filtros (solo primera página) ─────────────────────────
      if (isFirstPage) {
        doc.setFillColor(...C_IND_BG)
        doc.rect(ML, y, TW, 7, 'F')
        doc.setDrawColor(...C_IND3)
        doc.setLineWidth(0.2)
        doc.rect(ML, y, TW, 7, 'S')
        doc.setFillColor(...C_IND2)
        doc.rect(ML, y, 2.5, 7, 'F')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(5)
        doc.setTextColor(...C_IND2)
        doc.text('FILTROS APLICADOS', ML + 5, y + 2.8)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6)
        doc.setTextColor(...C_DARK)
        const cw = TW / 3
        doc.text(`Proveedor: ${filtroProveedorLabel()}`,    ML + 5,        y + 5.5)
        doc.text(`Banco: ${filtroBancoLabel()}`,            ML + 5 + cw,   y + 5.5)
        doc.text(`Cuenta: ${filtroCuentaLabel()}`,          ML + 5 + cw*2, y + 5.5)
        // Espacio generoso entre filtros y primer grupo
        y += 14
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
      doc.setFillColor(...C_IND_BG)
      doc.rect(ML, y, TW, 6.5, 'F')
      doc.setFillColor(...C_IND2)
      doc.rect(ML, y, 3, 6.5, 'F')
      doc.setDrawColor(...C_IND3)
      doc.setLineWidth(0.2)
      doc.line(ML, y + 6.5, ML + TW, y + 6.5)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(...C_INDIGO)
      doc.text(`${grupo.cuenta}  —  ${grupo.cuenta_nombre}`, ML + 6, y + 4.4)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.setTextColor(...C_MID)
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
          { content: g.codigo,                                   styles: { halign: 'center', fontStyle: 'bold', textColor: C_IND2 } },
          { content: fmtF(g.fecha),                              styles: { halign: 'center' } },
          { content: (!g.proveedor || g.proveedor === '0') ? '' : (g.proveedor_nombre || g.proveedor), styles: { halign: 'left' } },
          { content: g.concepto          || '-',                 styles: { halign: 'left'   } },
          { content: g.forma_pago_nombre || g.forma_pago || '-', styles: { halign: 'center' } },
          { content: g.ccosto_nombre     || g.ccosto     || '-', styles: { halign: 'center' } },
          { content: formatMoneda(g.total),                      styles: { halign: 'right', fontStyle: 'bold', textColor: C_INDIGO } },
        ]),
        foot: [[
          { content: `SUBTOTAL  ${grupo.cuenta_nombre.toUpperCase()}`,
            colSpan: 6,
            styles: { halign: 'right', fontStyle: 'bold', fontSize: 6.5,
                      fillColor: C_IND_BG, textColor: C_INDIGO, cellPadding: cellPad }
          },
          { content: formatMoneda(grupo.subtotal),
            styles: { halign: 'right', fontStyle: 'bold', fontSize: 6.5,
                      fillColor: C_IND_BG, textColor: C_IND2, cellPadding: cellPad }
          },
        ]],
        showFoot: 'lastPage',
        headStyles: {
          fillColor: C_INDIGO,
          textColor: C_WHITE,
          fontStyle: 'bold',
          fontSize: 6,
          cellPadding: { top: 2.5, right: 2.5, bottom: 2.5, left: 2.5 },
        },
        bodyStyles: { fontSize: 6.5, textColor: C_BODY, cellPadding: cellPad },
        alternateRowStyles: { fillColor: C_ALTROW },
        columnStyles: colStyles,
        tableLineColor: C_LGREY,
        tableLineWidth: 0.15,
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

    doc.setFillColor(...C_INDIGO)
    doc.rect(ML, y, TW, 9, 'F')
    doc.setFillColor(...C_IND2)
    doc.rect(ML, y, 4, 9, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...C_WHITE)
    doc.text('TOTAL GENERAL', ML + 8, y + 5.8)
    doc.setFontSize(10)
    doc.setTextColor(...C_EMERALD)
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
      doc.setTextColor(...C_MID)
      doc.text('RESUMEN POR CUENTA CONTABLE', ML, y)
      y += 3

      autoTable(doc, {
        startY: y,
        margin: { left: ML, right: MR, top: HDR_H + 0.8 + 3, bottom: FTR_H + 2 },
        head: [['CUENTA', 'DESCRIPCION', 'REGISTROS', 'SUBTOTAL']],
        body: grupos.value.map(g => [
          { content: g.cuenta,              styles: { fontStyle: 'bold', textColor: C_DARK } },
          g.cuenta_nombre,
          { content: g.items.length,        styles: { halign: 'center' } },
          { content: formatMoneda(g.subtotal), styles: { halign: 'right', fontStyle: 'bold' } },
        ]),
        headStyles: { fillColor: C_INDIGO, textColor: C_WHITE, fontSize: 6,
                      cellPadding: { top: 2, right: 2.5, bottom: 2, left: 2.5 } },
        bodyStyles: { fontSize: 6.5, textColor: C_BODY, cellPadding: cellPad },
        alternateRowStyles: { fillColor: C_ALTROW },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 27, halign: 'right' },   // mismo ancho que columna VALOR
        },
        tableLineColor: C_LGREY,
        tableLineWidth: 0.15,
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
/* ── Filtros ────────────────────────────────────────────────────── */
.filters-panel {
  background: linear-gradient(135deg, var(--sidebar-bg) 0%, #241d13 100%);
  border-radius: 16px;
  padding: 22px 24px 18px;
  border: 1px solid var(--gold-wash);
  box-shadow: 0 4px 24px rgba(0,0,0,0.15);
}

.filters-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr;
  gap: 20px;
  align-items: end;
  margin-bottom: 18px;
}

.filter-group { display: flex; flex-direction: column; gap: 8px; }

.filter-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.5);
}

/* Fechas */
.dates-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.date-input {
  background: rgba(255,255,255,0.07);
  border: 1px solid color-mix(in srgb, var(--sidebar-accent) 35%, transparent);
  border-radius: 8px;
  padding: 9px 10px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  outline: none;
  transition: border 0.2s;
  width: 100%;
  color-scheme: dark;
}
.date-input:focus {
  border-color: var(--sidebar-accent);
  background: var(--gold-wash);
}

/* Select */
.filter-select {
  background: rgba(255,255,255,0.07);
  border: 1px solid color-mix(in srgb, var(--sidebar-accent) 35%, transparent);
  border-radius: 8px;
  padding: 9px 12px;
  color: white;
  font-size: 12.5px;
  outline: none;
  cursor: pointer;
  transition: border 0.2s;
  width: 100%;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%23f0a83c' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px;
}
.filter-select:focus { border-color: var(--sidebar-accent); background-color: var(--gold-wash); }
.filter-select option { background: #1e1e2f; color: white; }

/* Botón consultar */
.filters-footer { display: flex; justify-content: flex-end; }
.btn-consultar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--sidebar-accent);
  color: var(--on-gold);
  border: none;
  border-radius: var(--radius-md);
  padding: 11px 28px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  box-shadow: 0 4px 16px var(--gold-wash);
}
.btn-consultar:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.btn-consultar:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── KPI Cards ──────────────────────────────────────────────────── */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

/* ── Preview Section ────────────────────────────────────────────── */
.preview-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.grupo-block {
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  overflow: hidden;
}

.grupo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: var(--indigo-wash);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07);
}
.grupo-header-left { display: flex; align-items: center; gap: 10px; }
.cuenta-badge {
  background: var(--indigo);
  color: white;
  font-size: 11px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 20px;
  letter-spacing: 0.5px;
}
.cuenta-nombre { font-size: 14px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }
.grupo-count   { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.45); background: rgba(var(--v-theme-on-surface),0.05); padding: 2px 8px; border-radius: 20px; }
.grupo-subtotal{ font-size: 16px; font-weight: 800; color: var(--indigo); font-variant-numeric: tabular-nums; }

.grupo-table-wrap { overflow-x: auto; }

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  table-layout: fixed;
}
.preview-table thead th {
  background: rgba(var(--v-theme-on-surface), 0.04);
  color: rgba(var(--v-theme-on-surface), 0.5);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  padding: 8px 12px;
  text-align: center;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  white-space: nowrap;
}
.preview-table tbody tr {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.04);
  transition: background 0.12s;
}
.preview-table tbody tr:hover { background: rgba(var(--v-theme-on-surface), 0.03); }
.preview-table tbody td {
  padding: 8px 12px;
  color: rgb(var(--v-theme-on-surface));
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.preview-table tfoot td { padding: 8px 12px; }

.badge-cod {
  background: var(--indigo-wash);
  color: var(--indigo);
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 5px;
}
.td-center   { text-align: center; }
.td-right    { text-align: right; }
.td-concepto { max-width: 200px; }
.td-total    { font-weight: 700; color: var(--indigo); font-variant-numeric: tabular-nums; }

.subtotal-row { background: var(--indigo-wash); }
.subtotal-label {
  text-align: right;
  font-weight: 700;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  padding: 8px 12px;
}
.subtotal-val {
  text-align: right;
  font-weight: 800;
  font-size: 13px;
  color: var(--indigo);
  font-variant-numeric: tabular-nums;
  padding: 8px 12px;
}

.total-general-bar {
  background: linear-gradient(135deg, var(--sidebar-bg), #241d13);
  border-radius: 12px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid var(--gold-wash);
}
.tg-label {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 1px;
  color: rgba(255,255,255,0.7);
}
.tg-val {
  font-size: 22px;
  font-weight: 800;
  color: var(--sidebar-accent);
  font-variant-numeric: tabular-nums;
}

/* ── States ─────────────────────────────────────────────────────── */
.empty-state, .initial-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}
.empty-title, .initial-title { font-size: 16px; font-weight: 700; margin: 12px 0 4px; color: rgb(var(--v-theme-on-surface)); }
.empty-sub, .initial-sub     { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.45); }
.initial-card {
  background: rgb(var(--v-theme-surface));
  border: 1px dashed var(--gold-wash);
  border-radius: 16px;
  padding: 40px 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

@media (max-width: 900px) {
  .filters-grid { grid-template-columns: 1fr 1fr; }
  .kpi-row      { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 560px) {
  .filters-grid { grid-template-columns: 1fr; }
  .kpi-row      { grid-template-columns: 1fr 1fr; }
}
</style>
