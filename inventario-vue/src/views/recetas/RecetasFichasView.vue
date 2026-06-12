<template>
  <MainLayout>
    <div class="rf-container">

      <!-- BREADCRUMB -->
      <div class="rf-breadcrumb">
        <span class="bc-root">RECETAS</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Fichas Técnicas</span>
      </div>

      <!-- HEADER -->
      <div class="rf-header">
        <div class="rf-header-left">
          <div class="rf-icon-wrap"><v-icon size="22" color="white">mdi-file-document-outline</v-icon></div>
          <div>
            <h1 class="rf-title">FICHAS TÉCNICAS</h1>
            <p class="rf-sub">Selecciona las recetas y genera las fichas técnicas en PDF</p>
          </div>
        </div>
        <div class="rf-header-actions">
          <v-btn color="blue-grey" variant="tonal" rounded="lg" size="small" @click="seleccionarTodas">
            {{ seleccionadas.length === recetasFiltradas.length && recetasFiltradas.length > 0
               ? 'Deseleccionar todo' : 'Seleccionar todo' }}
          </v-btn>
          <v-btn color="#f59e0b" variant="flat" rounded="lg"
            :disabled="seleccionadas.length === 0" :loading="generando" @click="exportarPDF">
            <v-icon start>mdi-file-pdf-box</v-icon>
            Generar PDF ({{ seleccionadas.length }})
          </v-btn>
        </div>
      </div>

      <!-- FILTROS -->
      <div class="rf-filters">
        <v-text-field v-model="busqueda" placeholder="Buscar receta..." prepend-inner-icon="mdi-magnify"
          variant="outlined" density="compact" hide-details clearable style="max-width:280px" />
        <v-select v-model="filtroGrupo" :items="gruposFiltro" item-title="label" item-value="val"
          variant="outlined" density="compact" hide-details style="max-width:220px" />
        <v-select v-model="filtroTipo" :items="tiposFiltro" item-title="label" item-value="val"
          variant="outlined" density="compact" hide-details style="max-width:180px" />
        <span v-if="seleccionadas.length > 0" class="sel-badge">
          {{ seleccionadas.length }} seleccionada{{ seleccionadas.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <!-- TABLA -->
      <v-progress-linear v-if="loading" indeterminate color="#f59e0b" height="3" class="mb-2" />

      <div v-if="recetasFiltradas.length === 0 && !loading" class="rf-empty">
        <v-icon size="48" color="rgba(var(--v-theme-on-surface),.2)" class="mb-3">mdi-chef-hat</v-icon>
        <p>No hay recetas que mostrar</p>
      </div>

      <div v-else class="rf-table-wrap">
        <!-- Cabecera de la tabla -->
        <div class="rf-thead">
          <div class="col-check">
            <v-checkbox-btn
              :model-value="seleccionadas.length === recetasFiltradas.length && recetasFiltradas.length > 0"
              :indeterminate="seleccionadas.length > 0 && seleccionadas.length < recetasFiltradas.length"
              color="#f59e0b" density="compact"
              @click="seleccionarTodas" />
          </div>
          <div class="col-tipo">TIPO</div>
          <div class="col-cod">CÓDIGO</div>
          <div class="col-nom">NOMBRE</div>
          <div class="col-grupo">GRUPO</div>
          <div class="col-und">UND</div>
          <div class="col-costo">COSTO</div>
          <div class="col-pventa">P. VENTA</div>
          <div class="col-pct">% COSTO</div>
          <div class="col-ings">INGS.</div>
          <div class="col-exp"></div>
        </div>

        <!-- Filas -->
        <template v-for="receta in recetasFiltradas" :key="receta.codigo">
          <div class="rf-row"
            :class="{ 'rf-row--sel': seleccionadas.includes(receta.codigo), 'rf-row--sub': receta.subproducto === 'SI' }"
            @click="toggleSeleccion(receta.codigo)">

            <div class="col-check" @click.stop>
              <v-checkbox-btn
                :model-value="seleccionadas.includes(receta.codigo)"
                color="#f59e0b" density="compact"
                @click="toggleSeleccion(receta.codigo)" />
            </div>

            <div class="col-tipo">
              <span v-if="receta.subproducto === 'SI'" class="badge-sub">SUBPROD.</span>
              <span v-else class="badge-rec">RECETA</span>
            </div>

            <div class="col-cod"><span class="mono-cod">{{ receta.codigo }}</span></div>
            <div class="col-nom fw-500">{{ receta.nombre }}</div>
            <div class="col-grupo text-muted">{{ receta.grupo_receta || '—' }}</div>
            <div class="col-und text-muted">{{ receta.und || '—' }}</div>
            <div class="col-costo font-mono text-error">{{ fmt(receta.valor) }}</div>
            <div class="col-pventa font-mono">{{ receta.precio_venta > 0 ? fmt(receta.precio_venta) : '—' }}</div>
            <div class="col-pct">
              <span v-if="receta.precio_venta > 0" class="pct-badge"
                :style="{ background: colorPctBg(receta.porcentaje_costo), color: colorPctStr(receta.porcentaje_costo) }">
                {{ receta.porcentaje_costo }}%
              </span>
              <span v-else class="text-muted">—</span>
            </div>
            <div class="col-ings">
              <span v-if="detalles[receta.codigo]" class="ings-count">
                {{ detalles[receta.codigo].length }}
              </span>
              <v-progress-circular v-else-if="loadingDetalle[receta.codigo]" size="12" width="2" indeterminate color="#f59e0b" />
              <span v-else class="text-muted">—</span>
            </div>

            <div class="col-exp" @click.stop>
              <v-btn icon size="x-small" variant="text"
                :color="expandido[receta.codigo] ? '#f59e0b' : 'rgba(var(--v-theme-on-surface),.3)'"
                :title="expandido[receta.codigo] ? 'Colapsar ingredientes' : 'Ver ingredientes'"
                @click="toggleExpand(receta)">
                <v-icon size="15">{{ expandido[receta.codigo] ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
              </v-btn>
            </div>
          </div>

          <!-- Panel expandido de ingredientes -->
          <div v-if="expandido[receta.codigo] && detalles[receta.codigo]" class="rf-ing-panel">
            <div class="ing-panel-head">
              <span class="iph-ing">INGREDIENTE</span>
              <span class="iph-tipo">TIPO</span>
              <span class="iph-cant">CANTIDAD</span>
              <span class="iph-und">UND.</span>
              <span class="iph-vunit">VR. UNIT.</span>
              <span class="iph-sub">SUBTOTAL</span>
              <span class="iph-pct">% COSTO</span>
            </div>
            <div v-for="ing in detalles[receta.codigo]" :key="ing.articulo" class="ing-panel-row">
              <span class="iph-ing">
                <v-icon size="11" :color="ing.es_subreceta ? '#8b5cf6' : '#14b8a6'">
                  {{ ing.es_subreceta ? 'mdi-link-variant' : 'mdi-food-apple-outline' }}
                </v-icon>
                {{ ing.articulo_nombre || ing.nombre_item || ing.articulo }}
              </span>
              <span class="iph-tipo">
                <span :class="ing.es_subreceta ? 'badge-sub-sm' : 'badge-art-sm'">
                  {{ ing.es_subreceta ? 'Subproducto' : 'Artículo' }}
                </span>
              </span>
              <span class="iph-cant mono">{{ parseFloat(ing.cantidad) }}</span>
              <span class="iph-und text-muted">{{ ing.und || '—' }}</span>
              <span class="iph-vunit mono">{{ fmt(ing.precio_unit) }}</span>
              <span class="iph-sub mono text-amber">{{ fmt((parseFloat(ing.precio_unit)||0)*(parseFloat(ing.cantidad)||0)) }}</span>
              <span class="iph-pct mono text-muted">
                {{ costoTotalReceta(receta.codigo) > 0
                  ? (((parseFloat(ing.precio_unit)||0)*(parseFloat(ing.cantidad)||0)) / costoTotalReceta(receta.codigo) * 100).toFixed(1) + '%'
                  : '—' }}
              </span>
            </div>
            <!-- Total -->
            <div class="ing-panel-total">
              <span style="grid-column:1/6; font-weight:700; font-size:11.5px;">COSTO TOTAL</span>
              <span class="iph-sub mono" style="font-weight:800; color:#f59e0b; font-size:13px;">
                {{ fmt(costoTotalReceta(receta.codigo)) }}
              </span>
              <span></span>
            </div>
          </div>
        </template>
      </div>

    </div>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3500" location="bottom right">
      {{ snack.msg }}
    </v-snackbar>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { API_BASE } from '../../utils/constants.js'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const recetas       = ref([])
const grupos        = ref([])
const detalles      = ref({})
const loadingDetalle = ref({})
const loading       = ref(false)
const generando     = ref(false)
const busqueda      = ref('')
const filtroTipo    = ref('TODOS')
const filtroGrupo   = ref('TODOS')
const seleccionadas = ref([])
const expandido     = ref({})

const tiposFiltro = computed(() => [
  { label: 'Todos', val: 'TODOS' },
  { label: 'Solo Recetas', val: 'NO' },
  { label: 'Solo Subproductos', val: 'SI' },
])

const gruposFiltro = computed(() => [
  { label: 'Todos los grupos', val: 'TODOS' },
  ...grupos.value.map(g => ({ label: g.nombre, val: g.codigo }))
])

const recetasFiltradas = computed(() => {
  let r = recetas.value
  if (filtroTipo.value !== 'TODOS') r = r.filter(x => x.subproducto === filtroTipo.value)
  if (filtroGrupo.value !== 'TODOS') r = r.filter(x => x.grupo_receta === filtroGrupo.value)
  if (busqueda.value) {
    const q = busqueda.value.toLowerCase()
    r = r.filter(x => x.nombre.toLowerCase().includes(q) || x.codigo.toLowerCase().includes(q))
  }
  return r
})

const snack = ref({ show: false, msg: '', color: 'success' })
function err(msg) { snack.value = { show: true, msg, color: 'error' } }

function fmt(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function colorPctStr(pct) {
  const p = parseFloat(pct) || 0
  return p <= 30 ? '#16a34a' : p <= 45 ? '#d97706' : '#dc2626'
}
function colorPctBg(pct) {
  const p = parseFloat(pct) || 0
  return p <= 30 ? 'rgba(22,163,74,.1)' : p <= 45 ? 'rgba(217,119,6,.1)' : 'rgba(220,38,38,.1)'
}
function costoTotalReceta(codigo) {
  const ings = detalles.value[codigo] || []
  return ings.reduce((s, i) => s + (parseFloat(i.precio_unit)||0)*(parseFloat(i.cantidad)||0), 0)
}

async function cargarDetalles(codigo) {
  if (detalles.value[codigo] || loadingDetalle.value[codigo]) return
  loadingDetalle.value[codigo] = true
  try {
    const r = await fetch(`${API_BASE}/recetas/${codigo}`)
    const j = await r.json()
    if (j.success) detalles.value[codigo] = j.data.ingredientes || []
  } catch { /* silencioso */ }
  finally { loadingDetalle.value[codigo] = false }
}

async function cargar() {
  loading.value = true
  try {
    const [rr, rg] = await Promise.all([
      fetch(`${API_BASE}/recetas`).then(r => r.json()),
      fetch(`${API_BASE}/recetas/grupos`).then(r => r.json()),
    ])
    recetas.value = rr.data || []
    grupos.value  = rg.data || []
    recetas.value.slice(0, 15).forEach(r => cargarDetalles(r.codigo))
  } catch (e) { err(e.message) }
  finally { loading.value = false }
}

watch(recetasFiltradas, () => {
  recetasFiltradas.value.slice(0, 20).forEach(r => cargarDetalles(r.codigo))
})

function toggleSeleccion(codigo) {
  const idx = seleccionadas.value.indexOf(codigo)
  if (idx === -1) {
    seleccionadas.value.push(codigo)
    cargarDetalles(codigo)
  } else {
    seleccionadas.value.splice(idx, 1)
  }
}

function seleccionarTodas() {
  if (seleccionadas.value.length === recetasFiltradas.value.length) {
    seleccionadas.value = []
  } else {
    seleccionadas.value = recetasFiltradas.value.map(r => r.codigo)
    recetasFiltradas.value.forEach(r => cargarDetalles(r.codigo))
  }
}

function toggleExpand(receta) {
  expandido.value[receta.codigo] = !expandido.value[receta.codigo]
  if (expandido.value[receta.codigo]) cargarDetalles(receta.codigo)
}

async function exportarPDF() {
  if (seleccionadas.value.length === 0) return
  generando.value = true
  try {
    // Cargar todos los detalles necesarios
    await Promise.all(seleccionadas.value.map(c => cargarDetalles(c)))

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
    const PW = doc.internal.pageSize.getWidth()
    const PH = doc.internal.pageSize.getHeight()
    const ML = 12, MR = 12

    const recetasSelec = recetas.value.filter(r => seleccionadas.value.includes(r.codigo))

    recetasSelec.forEach((receta, idx) => {
      if (idx > 0) doc.addPage()

      const ings = detalles.value[receta.codigo] || []
      const costoTotal = ings.reduce((s, i) => s + (parseFloat(i.precio_unit)||0)*(parseFloat(i.cantidad)||0), 0)
      const grupotxt = receta.grupo_receta || ''
      const tipoTxt  = receta.subproducto === 'SI' ? 'SUBPRODUCTO' : 'RECETA'

      // ── Encabezado minimalista ──
      doc.setFontSize(15)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(receta.nombre?.toUpperCase() || '', ML, 13)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text(`Código: ${receta.codigo}${grupotxt ? '  ·  ' + grupotxt : ''}  ·  ${tipoTxt}  ·  Unidad: ${receta.und || '—'}`, ML, 19)

      doc.setLineWidth(0.5)
      doc.setDrawColor(0, 0, 0)
      doc.line(ML, 22, PW - MR, 22)
      doc.setTextColor(0, 0, 0)

      // ── Tabla ingredientes ──
      const body = ings.map(ing => {
        const sub = (parseFloat(ing.precio_unit)||0)*(parseFloat(ing.cantidad)||0)
        const pct = costoTotal > 0 ? (sub / costoTotal * 100).toFixed(1) + '%' : '—'
        return [
          { content: ing.articulo_nombre || ing.nombre_item || ing.articulo, styles: { fontStyle: 'normal' } },
          { content: ing.es_subreceta ? 'Subproducto' : 'Artículo', styles: { halign: 'center', fontSize: 7 } },
          { content: String(parseFloat(ing.cantidad) || 0), styles: { halign: 'center' } },
          { content: ing.und || '', styles: { halign: 'center' } },
          { content: fmt(ing.precio_unit), styles: { halign: 'right' } },
          { content: fmt(sub), styles: { halign: 'right', fontStyle: 'bold' } },
          { content: pct, styles: { halign: 'right' } },
        ]
      })

      autoTable(doc, {
        head: [['INGREDIENTE', 'TIPO', 'CANTIDAD', 'UND.', 'VR. UNIT.', 'SUBTOTAL', '% COSTO']],
        body,
        startY: 26,
        margin: { left: ML, right: MR },
        styles: {
          fontSize: 8,
          cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
          lineColor: [210, 210, 210],
          lineWidth: 0.15,
        },
        headStyles: {
          fillColor: [30, 30, 30],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
          halign: 'center',
          cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
        },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 22, halign: 'center' },
          2: { cellWidth: 18, halign: 'center' },
          3: { cellWidth: 12, halign: 'center' },
          4: { cellWidth: 24, halign: 'right' },
          5: { cellWidth: 24, halign: 'right' },
          6: { cellWidth: 16, halign: 'right' },
        },
        rowPageBreak: 'avoid',
        foot: [[
          { content: `COSTO TOTAL  (${ings.length} ingredientes)`, colSpan: 5, styles: { fontStyle: 'bold', halign: 'right', fillColor: [240,240,240] } },
          { content: fmt(costoTotal), styles: { fontStyle: 'bold', halign: 'right', fillColor: [240,240,240] } },
          { content: '100%', styles: { fontStyle: 'bold', halign: 'right', fillColor: [240,240,240] } },
        ]],
        footStyles: { textColor: [0,0,0], fontSize: 8 },
        didDrawPage(data) {
          if (doc.internal.getCurrentPageInfo().pageNumber > 1) {
            doc.setFontSize(8)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(80, 80, 80)
            doc.text(`${receta.nombre?.toUpperCase()} (continuación)`, ML, 10)
            doc.setTextColor(0, 0, 0)
          }
        }
      })

      // ── Resumen financiero ──
      const finalY = doc.lastAutoTable?.finalY || 120
      if (parseFloat(receta.precio_venta) > 0) {
        const pv = parseFloat(receta.precio_venta)
        const margen = pv - costoTotal
        doc.setLineWidth(0.2)
        doc.setDrawColor(180, 180, 180)
        doc.line(ML, finalY + 5, PW - MR, finalY + 5)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(80, 80, 80)
        doc.text(
          `Precio Venta: ${fmt(pv)}   |   Margen: ${fmt(margen)}   |   % Costo: ${receta.porcentaje_costo}%`,
          PW - MR, finalY + 10, { align: 'right' }
        )
      }

      // Fecha
      doc.setFontSize(7)
      doc.setTextColor(160, 160, 160)
      doc.text(`Generado: ${new Date().toLocaleString('es')}`, ML, PH - 6)
      doc.setTextColor(0, 0, 0)
    })

    const blob = doc.output('blob')
    window.open(URL.createObjectURL(blob), '_blank')
  } catch (e) { err('Error generando PDF: ' + e.message) }
  finally { generando.value = false }
}

onMounted(cargar)
</script>

<style scoped>
.rf-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
.rf-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 12px; font-weight: 700; color: #f59e0b; text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.3); }
.bc-cat { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.8); font-weight: 500; }

.rf-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.rf-header-left { display: flex; align-items: center; gap: 14px; }
.rf-icon-wrap { width: 46px; height: 46px; border-radius: 12px; background: linear-gradient(135deg,#f59e0b,#d97706); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(245,158,11,.3); flex-shrink: 0; }
.rf-title { font-size: 18px; font-weight: 800; margin: 0; }
.rf-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }
.rf-header-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

.rf-filters { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; flex-wrap: wrap; }
.sel-badge { font-size: 12px; font-weight: 700; color: #f59e0b; background: rgba(245,158,11,.1); padding: 4px 10px; border-radius: 20px; }

.rf-empty { text-align: center; padding: 80px 20px; color: rgba(var(--v-theme-on-surface),.4); }
.rf-empty p { font-size: 14px; margin: 8px 0 0; }

/* ── TABLA ── */
.rf-table-wrap { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 10px; overflow: hidden; }

.rf-thead, .rf-row {
  display: grid;
  grid-template-columns: 36px 80px 70px 1fr 120px 50px 90px 90px 70px 50px 36px;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
}

.rf-thead {
  background: rgba(var(--v-theme-on-surface),.05);
  border-bottom: 2px solid rgba(var(--v-theme-on-surface),.08);
  height: 38px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .4px;
  color: rgba(var(--v-theme-on-surface),.5);
}

.rf-row {
  min-height: 44px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05);
  cursor: pointer;
  transition: background .12s;
  font-size: 12px;
}
.rf-row:hover { background: rgba(var(--v-theme-on-surface),.03); }
.rf-row--sel { background: rgba(245,158,11,.06) !important; }
.rf-row--sel:hover { background: rgba(245,158,11,.09) !important; }
.rf-row--sub { border-left: 3px solid rgba(139,92,246,.3); }
.rf-row:last-child { border-bottom: none; }

.mono-cod { font-family: monospace; font-size: 11px; color: rgba(var(--v-theme-on-surface),.6); }
.fw-500 { font-weight: 500; }
.text-muted { color: rgba(var(--v-theme-on-surface),.45); font-size: 11px; }
.text-error { color: #ef4444; }
.text-amber { color: #f59e0b; }
.font-mono { font-family: monospace; }

.badge-rec  { background: rgba(6,182,212,.12); color: #06b6d4; font-size: 9.5px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
.badge-sub  { background: rgba(139,92,246,.12); color: #8b5cf6; font-size: 9.5px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
.ings-count { background: rgba(var(--v-theme-on-surface),.08); font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 12px; }
.pct-badge  { font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 12px; }

/* Panel expandido */
.rf-ing-panel {
  background: rgba(var(--v-theme-on-surface),.02);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),.07);
  border-left: 3px solid #f59e0b;
  padding: 6px 12px 8px 20px;
}

.ing-panel-head, .ing-panel-row, .ing-panel-total {
  display: grid;
  grid-template-columns: 1fr 90px 70px 50px 80px 90px 70px;
  gap: 4px;
  align-items: center;
  font-size: 11px;
}
.ing-panel-head {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .4px;
  color: rgba(var(--v-theme-on-surface),.45);
  padding: 3px 0 5px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),.07);
  margin-bottom: 2px;
}
.ing-panel-row {
  padding: 3.5px 0;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),.04);
  color: rgba(var(--v-theme-on-surface),.8);
}
.ing-panel-row:last-of-type { border-bottom: none; }
.ing-panel-total {
  padding: 5px 0 2px;
  border-top: 1px solid rgba(var(--v-theme-on-surface),.1);
  margin-top: 3px;
  font-weight: 700;
}

.iph-cant, .iph-vunit, .iph-sub, .iph-pct { text-align: right; }
.iph-und, .iph-tipo { text-align: center; }

.mono { font-family: monospace; }

.badge-sub-sm { font-size: 9px; color: #8b5cf6; background: rgba(139,92,246,.1); padding: 1px 5px; border-radius: 3px; }
.badge-art-sm { font-size: 9px; color: #14b8a6; background: rgba(20,184,166,.1); padding: 1px 5px; border-radius: 3px; }
</style>
