<template>
  <MainLayout>

    <!-- ── BREADCRUMB ─────────────────────────────────────────────── -->
    <div class="breadcrumb-bar mb-4">
      <span class="bc-root">CONTABILIDAD</span>
      <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
      <span class="bc-section">Reportes</span>
      <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
      <span class="bc-item">Reporte de Gastos</span>
    </div>

    <!-- ── HEADER ─────────────────────────────────────────────────── -->
    <div class="page-header mb-5">
      <div class="header-left">
        <div class="header-icon">
          <v-icon size="26" color="white">mdi-file-chart-outline</v-icon>
        </div>
        <div>
          <h1 class="page-title">Reporte de Gastos</h1>
          <p class="page-sub">Análisis detallado agrupado por cuenta contable</p>
        </div>
      </div>
      <div class="header-actions">
        <v-btn
          v-if="gastos.length > 0"
          size="large"
          class="btn-pdf"
          prepend-icon="mdi-file-pdf-box"
          :loading="generandoPdf"
          @click="generarPDF"
        >
          Generar PDF
        </v-btn>
      </div>
    </div>

    <!-- ── PANEL DE FILTROS ───────────────────────────────────────── -->
    <div class="filters-panel mb-5">
      <div class="filters-grid">

        <!-- Fechas -->
        <div class="filter-group dates-group">
          <div class="filter-label">
            <v-icon size="14" color="#667eea">mdi-calendar-range</v-icon>
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
            <v-icon size="14" color="#667eea">mdi-truck-outline</v-icon>
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
            <v-icon size="14" color="#667eea">mdi-bank-outline</v-icon>
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
            <v-icon size="14" color="#667eea">mdi-book-outline</v-icon>
            <span>Cuenta Contable</span>
          </div>
          <select v-model="filtros.cuentaContable" class="filter-select">
            <option value="">TODAS LAS CUENTAS</option>
            <option v-for="c in cuentasContables" :key="c.codigo" :value="c.codigo">
              {{ c.nombre }}
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
      <div class="kpi-card">
        <div class="kpi-icon" style="background: rgba(102,126,234,0.15)">
          <v-icon size="20" color="#667eea">mdi-receipt-text-outline</v-icon>
        </div>
        <div class="kpi-info">
          <span class="kpi-val">{{ gastos.length }}</span>
          <span class="kpi-label">Total Registros</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background: rgba(16,185,129,0.15)">
          <v-icon size="20" color="#10b981">mdi-cash-multiple</v-icon>
        </div>
        <div class="kpi-info">
          <span class="kpi-val">{{ formatMoneda(totalGeneral) }}</span>
          <span class="kpi-label">Total Período</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background: rgba(118,75,162,0.15)">
          <v-icon size="20" color="#764ba2">mdi-book-outline</v-icon>
        </div>
        <div class="kpi-info">
          <span class="kpi-val">{{ grupos.length }}</span>
          <span class="kpi-label">Cuentas Contables</span>
        </div>
      </div>
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
          <div class="grupo-subtotal">
            {{ formatMoneda(grupo.subtotal) }}
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
                <td>{{ g.proveedor_nombre || g.proveedor || '-' }}</td>
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
        <v-icon size="48" color="#667eea" class="mb-3">mdi-filter-outline</v-icon>
        <p class="initial-title">Selecciona los filtros y presiona <strong>Consultar</strong></p>
        <p class="initial-sub">El reporte se generará agrupado por cuenta contable</p>
      </div>
    </div>

  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
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

// ── Cargar listas de selectores al montar ────────────────────────
onMounted(async () => {
  try {
    const [prov, cb, cc] = await Promise.all([
      proveedoresService.getProveedores({ limit: 2000 }),
      cuentasBancariasService.getCuentas({ limit: 500 }),
      cuentasContablesService.getCuentasContables({ limit: 500 }),
    ])
    proveedores.value      = Array.isArray(prov)      ? prov      : (prov.data      || [])
    cuentasBancarias.value = Array.isArray(cb)        ? cb        : (cb.data        || [])
    cuentasContables.value = Array.isArray(cc)        ? cc        : (cc.data        || [])
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
    const PW = doc.internal.pageSize.getWidth()
    const PH = doc.internal.pageSize.getHeight()
    const PURPLE = [102, 126, 234]
    const DARK   = [30, 30, 47]
    const GREY   = [100, 100, 120]
    const LIGHT  = [245, 245, 252]

    let y = 0

    // ── Función para dibujar encabezado de página ────────────────
    function drawHeader(isFirstPage = false) {
      // Fondo degradado del header
      doc.setFillColor(...PURPLE)
      doc.rect(0, 0, PW, 28, 'F')
      doc.setFillColor(118, 75, 162)
      doc.rect(PW - 60, 0, 60, 28, 'F')

      // Título
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(255, 255, 255)
      doc.text('REPORTE DE GASTOS', 12, 11)

      // Subtítulo
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(200, 200, 230)
      doc.text('Agrupado por Cuenta Contable', 12, 17)

      // Período
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(255, 255, 255)
      const periodoText = `${filtros.value.fechaInicial}  →  ${filtros.value.fechaFinal}`
      doc.text(periodoText, PW - 12, 11, { align: 'right' })

      // Fecha de emisión
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(200, 200, 230)
      doc.text(`Emitido: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, PW - 12, 17, { align: 'right' })

      // Línea decorativa
      doc.setFillColor(255, 255, 255)
      doc.rect(0, 28, PW, 0.5, 'F')

      y = 32

      if (isFirstPage) {
        // ── Bloque de filtros aplicados ──────────────────────────
        doc.setFillColor(...LIGHT)
        doc.roundedRect(10, y, PW - 20, 16, 2, 2, 'F')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(...GREY)
        doc.text('FILTROS APLICADOS', 15, y + 5)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(...DARK)
        const colW = (PW - 30) / 3
        doc.text(`Proveedor: ${filtroProveedorLabel()}`,    15,           y + 11)
        doc.text(`Cuenta Bancaria: ${filtroBancoLabel()}`,  15 + colW,    y + 11)
        doc.text(`Cuenta Contable: ${filtroCuentaLabel()}`, 15 + colW*2,  y + 11)

        y += 20
      }
    }

    // ── Primera página ───────────────────────────────────────────
    drawHeader(true)

    // ── Iterar grupos ────────────────────────────────────────────
    for (let gi = 0; gi < grupos.value.length; gi++) {
      const grupo = grupos.value[gi]

      // Verificar espacio — si queda poco, nueva página
      if (y > PH - 40) {
        doc.addPage()
        drawHeader(false)
      }

      // ── Encabezado del grupo ─────────────────────────────────
      doc.setFillColor(...PURPLE)
      doc.roundedRect(10, y, PW - 20, 8, 1.5, 1.5, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(255, 255, 255)
      doc.text(`${grupo.cuenta}  —  ${grupo.cuenta_nombre}`, 15, y + 5.5)
      doc.text(`${grupo.items.length} reg.`, PW - 60, y + 5.5, { align: 'right' })
      y += 10

      // ── Tabla del grupo ──────────────────────────────────────
      autoTable(doc, {
        startY: y,
        margin: { left: 10, right: 10 },
        head: [[
          { content: 'CÓDIGO',     styles: { halign: 'center' } },
          { content: 'FECHA',      styles: { halign: 'center' } },
          { content: 'PROVEEDOR',  styles: { halign: 'left'   } },
          { content: 'CONCEPTO',   styles: { halign: 'left'   } },
          { content: 'FORMA PAGO', styles: { halign: 'center' } },
          { content: 'C. COSTO',   styles: { halign: 'center' } },
          { content: 'VALOR',      styles: { halign: 'right'  } },
        ]],
        body: grupo.items.map(g => [
          { content: g.codigo,                                          styles: { halign: 'center', fontStyle: 'bold', textColor: PURPLE } },
          { content: (g.fecha || '').split('T')[0],                     styles: { halign: 'center' } },
          { content: g.proveedor_nombre || g.proveedor || '-',          styles: { halign: 'left'   } },
          { content: g.concepto || '-',                                 styles: { halign: 'left'   } },
          { content: g.forma_pago_nombre || g.forma_pago || '-',        styles: { halign: 'center' } },
          { content: g.ccosto_nombre || g.ccosto || '-',                styles: { halign: 'center' } },
          { content: formatMoneda(g.total),                             styles: { halign: 'right', fontStyle: 'bold' } },
        ]),
        foot: [[
          { content: `Subtotal — ${grupo.cuenta_nombre}`, colSpan: 6, styles: { halign: 'right', fontStyle: 'bold', fillColor: [235,235,250], textColor: DARK } },
          { content: formatMoneda(grupo.subtotal),                      styles: { halign: 'right', fontStyle: 'bold', fillColor: [235,235,250], textColor: PURPLE } },
        ]],
        showFoot: 'lastPage',
        headStyles: {
          fillColor: [50, 50, 70],
          textColor: [200, 200, 220],
          fontStyle: 'bold',
          fontSize: 7,
        },
        bodyStyles: { fontSize: 7.5, textColor: DARK },
        alternateRowStyles: { fillColor: LIGHT },
        columnStyles: {
          0: { cellWidth: 24 },
          1: { cellWidth: 22 },
          2: { cellWidth: 52 },
          3: { cellWidth: 62 },
          4: { cellWidth: 38 },
          5: { cellWidth: 28 },
          6: { cellWidth: 30 },
        },
        tableLineColor: [220, 220, 235],
        tableLineWidth: 0.1,
        didDrawPage: () => {
          // Footer en cada página
          const pageCount = doc.internal.getNumberOfPages()
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(7)
          doc.setTextColor(...GREY)
          doc.text(`Página ${doc.internal.getCurrentPageInfo().pageNumber} de ${pageCount}`, PW - 12, PH - 5, { align: 'right' })
          doc.text('Reporte de Gastos — Generado por el sistema', 12, PH - 5)
        },
      })

      y = doc.lastAutoTable.finalY + 8

      // Separador entre grupos
      if (gi < grupos.value.length - 1) {
        doc.setDrawColor(220, 220, 235)
        doc.setLineWidth(0.3)
        doc.line(10, y - 4, PW - 10, y - 4)
      }
    }

    // ── BARRA TOTAL GENERAL ──────────────────────────────────────
    if (y > PH - 25) {
      doc.addPage()
      drawHeader(false)
    }

    doc.setFillColor(...DARK)
    doc.roundedRect(10, y, PW - 20, 10, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text('TOTAL GENERAL', 18, y + 6.8)
    doc.setFontSize(11)
    doc.setTextColor(102, 234, 162)
    doc.text(formatMoneda(totalGeneral.value), PW - 18, y + 6.8, { align: 'right' })

    // ── Resumen final de grupos ──────────────────────────────────
    y += 14
    if (grupos.value.length > 1 && y < PH - 20) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(...GREY)
      doc.text('RESUMEN POR CUENTA CONTABLE', 12, y)
      y += 5

      autoTable(doc, {
        startY: y,
        margin: { left: 10, right: 10 },
        head: [['CUENTA', 'NOMBRE', 'REGISTROS', 'TOTAL']],
        body: grupos.value.map(g => [
          { content: g.cuenta,                         styles: { fontStyle: 'bold', textColor: PURPLE } },
          g.cuenta_nombre,
          { content: g.items.length,                   styles: { halign: 'center' } },
          { content: formatMoneda(g.subtotal),          styles: { halign: 'right', fontStyle: 'bold' } },
        ]),
        headStyles: { fillColor: [50, 50, 70], textColor: [200, 200, 220], fontSize: 7 },
        bodyStyles: { fontSize: 7.5, textColor: DARK },
        alternateRowStyles: { fillColor: LIGHT },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 35, halign: 'right' },
        },
        tableLineColor: [220, 220, 235],
        tableLineWidth: 0.1,
      })
    }

    // Guardar
    const nombreArchivo = `Reporte_Gastos_${filtros.value.fechaInicial}_${filtros.value.fechaFinal}.pdf`
    doc.save(nombreArchivo)

  } catch (err) {
    console.error('Error generando PDF:', err)
  } finally {
    generandoPdf.value = false
  }
}
</script>

<style scoped>
/* ── Breadcrumb ─────────────────────────────────────────────────── */
.breadcrumb-bar { display: flex; align-items: center; gap: 6px; }
.bc-root    { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: rgba(var(--v-theme-on-surface), 0.4); text-transform: uppercase; }
.bc-sep     { color: rgba(var(--v-theme-on-surface), 0.25); }
.bc-section { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-item    { font-size: 11px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }

/* ── Page Header ────────────────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.header-icon {
  width: 54px; height: 54px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.page-title { font-size: 22px; font-weight: 800; margin: 0; color: rgb(var(--v-theme-on-surface)); }
.page-sub   { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 2px 0 0; }

.btn-pdf {
  background: linear-gradient(135deg, #e53935, #c62828) !important;
  color: white !important;
  font-weight: 700 !important;
  letter-spacing: 0.3px;
  box-shadow: 0 4px 15px rgba(229,57,53,0.35) !important;
}

/* ── Filtros ────────────────────────────────────────────────────── */
.filters-panel {
  background: linear-gradient(135deg, #1e1e2f 0%, #2a2a45 100%);
  border-radius: 16px;
  padding: 22px 24px 18px;
  border: 1px solid rgba(102, 126, 234, 0.2);
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
  border: 1px solid rgba(102,126,234,0.35);
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
  border-color: #667eea;
  background: rgba(102,126,234,0.12);
}

/* Select */
.filter-select {
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(102,126,234,0.35);
  border-radius: 8px;
  padding: 9px 12px;
  color: white;
  font-size: 12.5px;
  outline: none;
  cursor: pointer;
  transition: border 0.2s;
  width: 100%;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%23667eea' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px;
}
.filter-select:focus { border-color: #667eea; background-color: rgba(102,126,234,0.12); }
.filter-select option { background: #1e1e2f; color: white; }

/* Botón consultar */
.filters-footer { display: flex; justify-content: flex-end; }
.btn-consultar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 11px 28px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  box-shadow: 0 4px 16px rgba(102,126,234,0.4);
}
.btn-consultar:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.btn-consultar:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── KPI Cards ──────────────────────────────────────────────────── */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.kpi-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.kpi-icon {
  width: 44px; height: 44px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.kpi-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.kpi-val  { font-size: 18px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); white-space: nowrap; }
.kpi-label{ font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5); }

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
  background: linear-gradient(135deg, rgba(102,126,234,0.12), rgba(118,75,162,0.08));
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07);
}
.grupo-header-left { display: flex; align-items: center; gap: 10px; }
.cuenta-badge {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 11px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 20px;
  letter-spacing: 0.5px;
}
.cuenta-nombre { font-size: 14px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }
.grupo-count   { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.45); background: rgba(var(--v-theme-on-surface),0.05); padding: 2px 8px; border-radius: 20px; }
.grupo-subtotal{ font-size: 16px; font-weight: 800; color: #667eea; font-family: 'Courier New', monospace; }

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
  background: rgba(102,126,234,0.12);
  color: #667eea;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 5px;
}
.td-center   { text-align: center; }
.td-right    { text-align: right; }
.td-concepto { max-width: 200px; }
.td-total    { font-weight: 700; color: #667eea; font-family: 'Courier New', monospace; }

.subtotal-row { background: rgba(102,126,234,0.06); }
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
  color: #667eea;
  font-family: 'Courier New', monospace;
  padding: 8px 12px;
}

.total-general-bar {
  background: linear-gradient(135deg, #1e1e2f, #2a2a45);
  border-radius: 12px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid rgba(102,126,234,0.25);
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
  color: #66ead8;
  font-family: 'Courier New', monospace;
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
  border: 1px dashed rgba(102,126,234,0.3);
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
