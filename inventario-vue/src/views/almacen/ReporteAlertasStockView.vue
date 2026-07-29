<template>
  <MainLayout>
    <div class="as-container">

      <PageHeader
        title="Alertas de Stock"
        description="Productos bajo stock mínimo en la Bodega Maestra"
        :crumbs="['Almacén', 'Reportes', 'Alertas de Stock']"
      >
        <template #actions>
          <v-btn
            color="var(--error)"
            variant="elevated"
            prepend-icon="mdi-magnify"
            :loading="loading"
            @click="generar"
          >Generar</v-btn>
          <v-btn
            v-if="grupos.length"
            color="error"
            variant="outlined"
            prepend-icon="mdi-file-pdf-box"
            class="ml-2"
            @click="exportarPDF"
          >PDF</v-btn>
        </template>
      </PageHeader>

      <!-- MENSAJES -->
      <v-alert v-if="advertencia" type="warning" variant="tonal" class="mb-4" closable @click:close="advertencia=''">
        {{ advertencia }}
      </v-alert>
      <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-4" closable @click:close="errorMsg=''">
        {{ errorMsg }}
      </v-alert>

      <!-- LOADING -->
      <div v-if="loading" class="as-loading">
        <v-progress-circular indeterminate color="var(--error)" size="36" />
        <span>Consultando stock...</span>
      </div>

      <!-- SIN DATOS GENERADOS -->
      <div v-else-if="!generado" class="as-empty-state">
        <v-icon size="56" color="var(--ink-400)">mdi-alert-circle-outline</v-icon>
        <p>Presiona <strong>Generar</strong> para consultar los productos bajo stock mínimo</p>
      </div>

      <!-- SIN ALERTAS -->
      <div v-else-if="grupos.length === 0" class="as-empty-state as-ok">
        <v-icon size="56" color="var(--success)">mdi-check-circle-outline</v-icon>
        <p style="color:var(--success);font-weight:700">¡Todo en orden!</p>
        <p>No hay productos por debajo del stock mínimo en la Bodega Maestra<span v-if="bodega"> ({{ bodega }})</span>.</p>
      </div>

      <!-- TABLA DE RESULTADOS -->
      <template v-else>

        <!-- Resumen -->
        <div class="as-resumen">
          <div class="as-res-chip as-res-total">
            <v-icon size="15">mdi-package-variant</v-icon>
            <span>{{ totalProductos }} producto{{ totalProductos !== 1 ? 's' : '' }} en alerta</span>
          </div>
          <div class="as-res-chip as-res-cero">
            <v-icon size="15">mdi-alert</v-icon>
            <span>{{ totalCero }} con stock cero o negativo</span>
          </div>
          <div v-if="bodega" class="as-res-chip as-res-bodega">
            <v-icon size="15">mdi-warehouse</v-icon>
            <span>Bodega: {{ bodega }}</span>
          </div>
        </div>

        <!-- Grupos -->
        <div v-for="grupo in grupos" :key="grupo.nombre" class="as-grupo-block">
          <div class="as-grupo-header">
            <v-icon size="14" color="var(--error)" class="mr-1">mdi-folder-outline</v-icon>
            <span class="as-grupo-nombre">{{ grupo.nombre }}</span>
            <span class="as-grupo-count">{{ grupo.items.length }} producto{{ grupo.items.length !== 1 ? 's' : '' }}</span>
          </div>

          <table class="as-table">
            <thead>
              <tr>
                <th class="th-cod">CÓDIGO</th>
                <th class="th-nom">NOMBRE</th>
                <th class="th-desc">DESCRIPCIÓN</th>
                <th class="th-und">UND</th>
                <th class="th-num">STOCK MÍN</th>
                <th class="th-num">STOCK ACTUAL</th>
                <th class="th-num">FALTANTE</th>
                <th class="th-barra">NIVEL</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in grupo.items" :key="p.codigo"
                class="as-row"
                :class="{ 'as-row-cero': parseFloat(p.stock_actual) <= 0 }">
                <td><span class="badge-cod">{{ p.codigo }}</span></td>
                <td class="td-nom">{{ p.nombre }}</td>
                <td class="td-desc">{{ p.descripcion || '—' }}</td>
                <td><span class="badge-und">{{ p.und }}</span></td>
                <td class="td-num">{{ fmtNum(p.stock_minimo) }}</td>
                <td class="td-num" :class="parseFloat(p.stock_actual) <= 0 ? 'td-cero' : 'td-bajo'">
                  {{ fmtNum(p.stock_actual) }}
                </td>
                <td class="td-num td-faltante">{{ fmtNum(p.faltante) }}</td>
                <td class="td-barra">
                  <div class="nivel-bar-bg">
                    <div class="nivel-bar-fill"
                      :class="parseFloat(p.stock_actual) <= 0 ? 'nivel-cero' : 'nivel-bajo'"
                      :style="{ width: nivelPct(p) + '%' }">
                    </div>
                  </div>
                  <span class="nivel-pct">{{ nivelPct(p) }}%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </template>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { alignReportCell, detailTableOptions, drawReportFooter, drawReportHeader } from '../../utils/pdfReportStyle'

const authStore = useAuthStore()

const loading   = ref(false)
const generado  = ref(false)
const errorMsg  = ref('')
const advertencia = ref('')
const filas     = ref([])
const bodega    = ref('')

// Agrupar por grupo_nombre
const grupos = computed(() => {
  const map = {}
  for (const f of filas.value) {
    const k = f.grupo_nombre || 'Sin Grupo'
    if (!map[k]) map[k] = { nombre: k, items: [] }
    map[k].items.push(f)
  }
  return Object.values(map)
})

const totalProductos = computed(() => filas.value.length)
const totalCero      = computed(() => filas.value.filter(f => parseFloat(f.stock_actual) <= 0).length)

async function generar() {
  errorMsg.value = ''; advertencia.value = ''
  loading.value = true; generado.value = false; filas.value = []; bodega.value = ''
  try {
    const res = await api.get('/almacen/reporte-alertas-stock', {
      params: { empresa: authStore.empresaCodigo }
    })
    if (!res.data.success) throw new Error(res.data.error || 'Error al generar')
    filas.value  = res.data.data || []
    bodega.value = res.data.bodega || ''
    if (res.data.advertencia) advertencia.value = res.data.advertencia
    generado.value = true
  } catch (e) {
    errorMsg.value = e.response?.data?.error || e.message
  } finally {
    loading.value = false
  }
}

function fmtNum(v) {
  const n = parseFloat(v) || 0
  return n.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function nivelPct(p) {
  const actual = parseFloat(p.stock_actual) || 0
  const min    = parseFloat(p.stock_minimo) || 1
  if (actual <= 0) return 0
  return Math.min(Math.round((actual / min) * 100), 99)
}

// ── PDF ──────────────────────────────────────────────────────────
function exportarPDF() {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
  const ML = 10
  const startY = drawReportHeader(doc, {
    title: 'REPORTE DE STOCK',
    subtitle: `Bodega Maestra: ${bodega.value || '-'}`,
    empresa: authStore.empresaNombre || authStore.empresaCodigo || 'EMPRESA',
    usuario: authStore.userName || authStore.userNombre,
    moduleName: 'Modulo de almacen | Reportes',
    margin: ML,
  })

  const body = []
  for (const grupo of grupos.value) {
    body.push([{
      content: String(grupo.nombre || 'Sin Grupo').toUpperCase(),
      colSpan: 7,
      styles: {
        fontStyle: 'bold', fontSize: 6.5, textColor: [0, 0, 0], fillColor: false,
        halign: 'left', lineWidth: { top: 0.25, bottom: 0.18 }, lineColor: [115, 115, 115],
        cellPadding: { top: 1.5, right: 1.8, bottom: 1.2, left: 1.8 },
      },
    }])
    for (const p of grupo.items) {
      body.push([
        p.codigo,
        p.nombre,
        p.descripcion || '-',
        p.und,
        fmtNum(p.stock_minimo),
        fmtNum(p.stock_actual),
        fmtNum(p.faltante),
      ])
    }
  }

  autoTable(doc, {
    startY,
    head: [['Cod', 'Nombre', 'Descripcion', 'Und', 'Stock Min.', 'Stock Actual', 'Faltante']],
    body,
    ...detailTableOptions(ML),
    columnStyles: {
      0: { cellWidth: 16, halign: 'center' },
      1: { cellWidth: 62 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 26, halign: 'right' },
      6: { cellWidth: 24, halign: 'right' },
    },
    didParseCell: (data) => {
      alignReportCell(data, { 0: 'center', 1: 'left', 2: 'left', 3: 'center', 4: 'right', 5: 'right', 6: 'right' })
      if (data.section === 'body' && data.row.raw?.[0]?.colSpan === 7) {
        data.cell.styles.halign = 'left'
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fontSize = 6.5
        data.cell.styles.lineWidth = { top: 0.25, bottom: 0.18 }
        data.cell.styles.lineColor = [115, 115, 115]
      }
    },
    didDrawPage: (data) => drawReportFooter(doc, { pageNumber: data.pageNumber, margin: ML }),
  })

  window.open(URL.createObjectURL(doc.output('blob')), '_blank')
}
</script>

<style scoped>
.as-container { padding: 20px 24px; max-width: 1200px; }

/* Loading / Empty */
.as-loading { display:flex; align-items:center; gap:12px; padding:48px; justify-content:center; color:rgba(var(--v-theme-on-surface),.5); font-size:14px; }
.as-empty-state { display:flex; flex-direction:column; align-items:center; gap:10px; padding:64px 24px; text-align:center; color:rgba(var(--v-theme-on-surface),.45); font-size:13px; }
.as-empty-state strong { color:rgba(var(--v-theme-on-surface),.7); }
.as-ok p { color:rgba(var(--v-theme-on-surface),.6); }

/* Resumen chips */
.as-resumen { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; }
.as-res-chip { display:flex; align-items:center; gap:5px; padding:5px 12px; border-radius:20px; font-size:11px; font-weight:700; }
.as-res-total  { background:var(--error-wash);  color:var(--error); border:1px solid color-mix(in srgb, var(--error) 25%, transparent); }
.as-res-cero   { background:color-mix(in srgb, var(--error) 6%, transparent); color:var(--error); border:1px solid color-mix(in srgb, var(--error) 15%, transparent); }
.as-res-bodega { background:rgba(var(--v-theme-on-surface),.06); color:rgba(var(--v-theme-on-surface),.6); border:1px solid rgba(var(--v-theme-on-surface),.12); }

/* Grupo */
.as-grupo-block  { margin-bottom:24px; border:1px solid rgba(var(--v-theme-on-surface),.08); border-radius:10px; overflow:hidden; }
.as-grupo-header { display:flex; align-items:center; gap:6px; padding:9px 16px; background:var(--error-wash); border-bottom:1px solid color-mix(in srgb, var(--error) 10%, transparent); }
.as-grupo-nombre { font-size:12px; font-weight:700; color:rgba(var(--v-theme-on-surface),.8); text-transform:uppercase; letter-spacing:.4px; }
.as-grupo-count  { font-size:11px; color:rgba(var(--v-theme-on-surface),.4); margin-left:6px; }

/* Tabla */
.as-table { width:100%; border-collapse:collapse; font-size:12.5px; }
.as-table thead th { padding:8px 12px; text-align:left; font-size:10px; font-weight:700; letter-spacing:.5px; text-transform:uppercase; color:rgba(var(--v-theme-on-surface),.5); background:rgba(var(--v-theme-on-surface),.03); border-bottom:1px solid rgba(var(--v-theme-on-surface),.07); white-space:nowrap; }

.as-row { border-bottom:1px solid rgba(var(--v-theme-on-surface),.05); }
.as-row:hover { background:rgba(var(--v-theme-on-surface),.03); }
.as-row-cero  { background:color-mix(in srgb, var(--error) 4%, transparent); }
.as-row-cero:hover { background:color-mix(in srgb, var(--error) 8%, transparent); }

.as-table td { padding:9px 12px; vertical-align:middle; }

.th-cod   { width:80px; }
.th-nom   { width:200px; }
.th-desc  { }
.th-und   { width:60px; }
.th-num   { width:100px; text-align:right !important; }
.th-barra { width:110px; }

.td-nom  { font-weight:600; }
.td-desc { color:rgba(var(--v-theme-on-surface),.5); font-size:12px; }
.td-num  { text-align:right; font-variant-numeric: tabular-nums; font-size:12px; }
.td-bajo    { color:var(--gold); font-weight:700; }
.td-cero    { color:var(--error); font-weight:700; }
.td-faltante { color:var(--error); font-weight:700; }

.badge-cod { background:rgba(var(--v-theme-on-surface),.07); border-radius:4px; padding:2px 7px; font-size:11px; font-weight:700; font-family:var(--font-mono); }
.badge-und { background:color-mix(in srgb, var(--indigo) 10%, transparent); color:var(--indigo); border-radius:4px; padding:2px 7px; font-size:10px; font-weight:700; }

/* Barra nivel */
.td-barra { vertical-align:middle; }
.nivel-bar-bg   { height:6px; background:rgba(var(--v-theme-on-surface),.1); border-radius:3px; overflow:hidden; display:inline-block; width:70px; vertical-align:middle; }
.nivel-bar-fill { height:100%; border-radius:3px; transition:width var(--dur-slow) var(--ease-out); }
.nivel-bajo { background:var(--gold); }
.nivel-cero { background:var(--error); width:0% !important; }
.nivel-pct  { font-size:10px; color:rgba(var(--v-theme-on-surface),.4); margin-left:6px; font-variant-numeric: tabular-nums; }
</style>
