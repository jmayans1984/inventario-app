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
            <p class="rf-sub">Visualiza e imprime las fichas técnicas completas de tus recetas</p>
          </div>
        </div>
        <div class="d-flex gap-3 flex-wrap align-center">
          <v-btn color="#ef4444" variant="flat" rounded="lg"
            :disabled="seleccionadas.length === 0" @click="exportarPDF">
            <v-icon start>mdi-file-pdf-box</v-icon>
            PDF ({{ seleccionadas.length }})
          </v-btn>
          <v-btn color="blue-grey" variant="tonal" rounded="lg" @click="seleccionarTodas">
            {{ seleccionadas.length === recetasFiltradas.length ? 'Deseleccionar todo' : 'Seleccionar todo' }}
          </v-btn>
        </div>
      </div>

      <!-- FILTROS -->
      <div class="rf-filters">
        <v-text-field v-model="busqueda" placeholder="Buscar receta..." prepend-inner-icon="mdi-magnify"
          variant="outlined" density="compact" hide-details clearable style="max-width:280px" />
        <v-select v-model="filtroTipo" :items="tiposFiltro" item-title="label" item-value="val"
          variant="outlined" density="compact" hide-details style="max-width:200px" />
      </div>

      <!-- LISTA DE FICHAS -->
      <v-progress-linear v-if="loading" indeterminate color="#f59e0b" height="3" class="mb-2" />

      <div v-if="recetasFiltradas.length === 0 && !loading" class="rf-empty">
        <v-icon size="48" color="rgba(var(--v-theme-on-surface),.2)" class="mb-3">mdi-chef-hat</v-icon>
        <p>No hay recetas que mostrar</p>
      </div>

      <div class="rf-cards-grid">
        <div v-for="receta in recetasFiltradas" :key="receta.codigo"
          class="rf-ficha-card" :class="{ 'rf-selected': seleccionadas.includes(receta.codigo) }"
          @click="toggleSeleccion(receta.codigo)">

          <!-- Header de la ficha -->
          <div class="ficha-top" :class="receta.subproducto === 'SI' ? 'tipo-subproducto' : 'tipo-receta'">
            <div class="d-flex align-center justify-space-between">
              <v-chip :color="receta.subproducto === 'SI' ? 'purple' : 'cyan'" size="x-small" variant="elevated" label class="ficha-tipo-chip">
                {{ receta.subproducto === 'SI' ? 'SUBPRODUCTO' : 'RECETA' }}
              </v-chip>
              <v-checkbox-btn
                :model-value="seleccionadas.includes(receta.codigo)"
                color="white"
                @click.stop="toggleSeleccion(receta.codigo)"
                density="compact" />
            </div>
            <p class="ficha-nombre">{{ receta.nombre }}</p>
            <p class="ficha-codigo">Cód. {{ receta.codigo }}</p>
          </div>

          <!-- Body -->
          <div class="ficha-body">
            <!-- Info general -->
            <div class="ficha-info-row">
              <div class="fi-item" v-if="receta.und">
                <span class="fi-lbl">Unidad</span>
                <span class="fi-val">{{ receta.und }}</span>
              </div>
              <div class="fi-item" v-if="receta.grupo_receta">
                <span class="fi-lbl">Grupo</span>
                <span class="fi-val">{{ receta.grupo_receta }}</span>
              </div>
            </div>

            <!-- Ingredientes del detalle cargado -->
            <div v-if="detalles[receta.codigo]">
              <p class="ficha-section-title">Ingredientes ({{ detalles[receta.codigo].length }})</p>
              <div class="ficha-ing-list">
                <div v-for="ing in detalles[receta.codigo].slice(0,5)" :key="ing.articulo"
                  class="ficha-ing-row">
                  <span class="ing-name">
                    <v-icon v-if="ing.es_subreceta" size="10" color="#f59e0b">mdi-chef-hat</v-icon>
                    {{ ing.articulo_nombre }}
                  </span>
                  <span class="ing-cant">{{ ing.cantidad }} {{ ing.und }}</span>
                  <span class="ing-sub">{{ fmt(ing.precio_unit * ing.cantidad) }}</span>
                </div>
                <div v-if="detalles[receta.codigo].length > 5" class="ficha-ing-more">
                  + {{ detalles[receta.codigo].length - 5 }} más...
                </div>
              </div>
            </div>
            <div v-else-if="loadingDetalle[receta.codigo]" class="text-center py-2">
              <v-progress-circular size="16" width="2" indeterminate color="#f59e0b" />
            </div>

            <!-- Costos -->
            <div class="ficha-costos">
              <div class="fc-row">
                <span class="fc-lbl">Costo</span>
                <span class="fc-val error">{{ fmt(receta.valor) }}</span>
              </div>
              <div class="fc-row" v-if="receta.precio_venta > 0">
                <span class="fc-lbl">Precio Venta</span>
                <span class="fc-val">{{ fmt(receta.precio_venta) }}</span>
              </div>
              <div class="fc-row" v-if="receta.precio_venta > 0">
                <span class="fc-lbl">% Costo</span>
                <span class="fc-val" :style="{ color: colorPctStr(receta.porcentaje_costo) }">
                  {{ receta.porcentaje_costo }}%
                </span>
              </div>
            </div>
          </div>
        </div>
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

const recetas      = ref([])
const detalles     = ref({})        // { [codigo]: ingredientes[] }
const loadingDetalle = ref({})
const loading      = ref(false)
const busqueda     = ref('')
const filtroTipo   = ref('TODOS')
const seleccionadas = ref([])

const tiposFiltro = computed(() => [
  { label: 'Todos', val: 'TODOS' },
  { label: 'Solo Recetas', val: 'NO' },
  { label: 'Solo Subproductos', val: 'SI' },
])

const recetasFiltradas = computed(() => {
  let r = recetas.value
  if (filtroTipo.value !== 'TODOS') r = r.filter(x => x.subproducto === filtroTipo.value)
  if (busqueda.value) {
    const q = busqueda.value.toLowerCase()
    r = r.filter(x => x.nombre.toLowerCase().includes(q) || x.codigo.toLowerCase().includes(q))
  }
  return r
})

const snack = ref({ show: false, msg: '', color: 'success' })
function ok(msg)  { snack.value = { show: true, msg, color: 'success' } }
function err(msg) { snack.value = { show: true, msg, color: 'error' } }

async function cargar() {
  loading.value = true
  try {
    const r = await fetch(`${API_BASE}/recetas`)
    const j = await r.json()
    recetas.value = j.data || []
    // Cargar detalles de las primeras 10 recetas visibles
    cargarDetallesVisibles()
  } catch (e) { err(e.message) }
  finally { loading.value = false }
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

function cargarDetallesVisibles() {
  recetasFiltradas.value.slice(0, 12).forEach(r => cargarDetalles(r.codigo))
}

watch(recetasFiltradas, () => cargarDetallesVisibles())

function toggleSeleccion(codigo) {
  const idx = seleccionadas.value.indexOf(codigo)
  if (idx === -1) {
    seleccionadas.value.push(codigo)
    cargarDetalles(codigo) // Asegurarse de tener detalle para PDF
  } else {
    seleccionadas.value.splice(idx, 1)
  }
}

function seleccionarTodas() {
  if (seleccionadas.value.length === recetasFiltradas.value.length) {
    seleccionadas.value = []
  } else {
    seleccionadas.value = recetasFiltradas.value.map(r => r.codigo)
    // Cargar detalles de todas las seleccionadas
    recetasFiltradas.value.forEach(r => cargarDetalles(r.codigo))
  }
}

async function exportarPDF() {
  if (seleccionadas.value.length === 0) return

  // Esperar a que se carguen todos los detalles
  await Promise.all(seleccionadas.value.map(c => {
    if (!detalles.value[c]) return cargarDetalles(c)
  }))

  const { default: jsPDF } = await import('jspdf')
  await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', format: 'letter' })
  const pW = doc.internal.pageSize.width
  const pH = doc.internal.pageSize.height

  const recetasSelec = recetas.value.filter(r => seleccionadas.value.includes(r.codigo))

  recetasSelec.forEach((receta, idx) => {
    if (idx > 0) doc.addPage()

    const ings = detalles.value[receta.codigo] || []

    // Cabecera naranja
    doc.setFillColor(245, 158, 11)
    doc.rect(0, 0, pW, 22, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(255, 255, 255)
    doc.text(receta.nombre.toUpperCase(), 14, 13)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Código: ${receta.codigo}  ·  Tipo: ${receta.subproducto === 'SI' ? 'SUBPRODUCTO' : 'RECETA'}  ·  Grupo: ${receta.grupo_receta || '—'}`, 14, 19)

    // Info general
    doc.setTextColor(40, 40, 40)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('INFORMACIÓN GENERAL', 14, 30)
    doc.setLineWidth(0.3)
    doc.setDrawColor(245, 158, 11)
    doc.line(14, 31.5, pW - 14, 31.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    const infoY = 36
    doc.text(`Unidad: ${receta.und || '—'}  ·  Grupo: ${receta.grupo_receta || '—'}`, 14, infoY)
    doc.text(`Costo Total: ${fmt(receta.valor)}`, 80, infoY)
    if (parseFloat(receta.precio_venta) > 0) {
      doc.text(`Precio Venta: ${fmt(receta.precio_venta)}`, 14, infoY + 5)
      doc.text(`Margen: ${fmt(parseFloat(receta.precio_venta) - parseFloat(receta.valor))}  (${receta.porcentaje_costo}% costo)`, 80, infoY + 5)
    }

    // Tabla ingredientes
    const ingStartY = infoY + 10
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(40, 40, 40)
    doc.text(`INGREDIENTES (${ings.length})`, 14, ingStartY)
    doc.line(14, ingStartY + 1.5, pW - 14, ingStartY + 1.5)

    if (ings.length > 0) {
      const costoTotal = ings.reduce((s, i) => s + (parseFloat(i.precio_unit)||0) * (parseFloat(i.cantidad)||0), 0)
      doc.autoTable({
        startY: ingStartY + 3,
        head: [['INGREDIENTE / ARTÍCULO', 'TIPO', 'CANT.', 'UND.', 'PRECIO UNIT.', 'SUBTOTAL', '% COSTO']],
        body: ings.map(i => {
          const sub = (parseFloat(i.precio_unit)||0) * (parseFloat(i.cantidad)||0)
          const pct = costoTotal > 0 ? (sub / costoTotal * 100).toFixed(1) : '0.0'
          return [
            i.articulo_nombre || i.articulo,
            i.es_subreceta ? 'SUBRECETA' : 'INSUMO',
            parseFloat(i.cantidad).toFixed(3),
            i.und,
            fmt(i.precio_unit),
            fmt(sub),
            `${pct}%`
          ]
        }),
        foot: [[
          { content: 'COSTO TOTAL', colSpan: 5, styles: { fontStyle: 'bold', halign: 'right' } },
          { content: fmt(costoTotal), styles: { fontStyle: 'bold' } },
          { content: '100%', styles: { fontStyle: 'bold' } }
        ]],
        styles: { fontSize: 7.5, cellPadding: 1.5 },
        headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold', fontSize: 7 },
        footStyles: { fillColor: [252, 248, 240], textColor: [40, 40, 40] },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 22, halign: 'center' },
          2: { halign: 'right' },
          3: { cellWidth: 18, halign: 'center' },
          4: { halign: 'right' },
          5: { halign: 'right', fontStyle: 'bold' },
          6: { halign: 'right' },
        },
        alternateRowStyles: { fillColor: [255, 253, 248] },
        didDrawCell(data) {
          if (data.section === 'body' && data.column.index === 1) {
            if (ings[data.row.index]?.es_subreceta) {
              doc.setTextColor(245, 158, 11)
              doc.setFont('helvetica', 'bold')
              doc.text('SUBRECETA', data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: 'center' })
              doc.setTextColor(40, 40, 40)
              doc.setFont('helvetica', 'normal')
            }
          }
        }
      })
    } else {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text('Sin ingredientes registrados', 14, ingStartY + 8)
    }

    // Pie de página
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.setFont('helvetica', 'normal')
    doc.text(`Ficha técnica generada el ${new Date().toLocaleDateString('es-CO')}  ·  ${idx + 1} de ${recetasSelec.length}`, pW / 2, pH - 8, { align: 'center' })
  })

  doc.save(`fichas-tecnicas-${new Date().toISOString().slice(0,10)}.pdf`)
  ok(`PDF generado con ${recetasSelec.length} ficha(s)`)
}

function fmt(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function colorPctStr(pct) {
  const p = parseFloat(pct) || 0
  if (p <= 30) return '#22c55e'
  if (p <= 45) return '#f59e0b'
  return '#ef4444'
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
.rf-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.rf-header-left { display: flex; align-items: center; gap: 16px; }
.rf-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#f59e0b,#d97706); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(245,158,11,0.35); }
.rf-title { font-size: 20px; font-weight: 800; margin: 0; }
.rf-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 2px 0 0; }
.rf-filters { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.rf-empty { text-align: center; padding: 60px 20px; color: rgba(var(--v-theme-on-surface),.4); }
.rf-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }

/* Ficha card */
.rf-ficha-card { background: rgb(var(--v-theme-surface)); border: 2px solid rgba(var(--v-theme-on-surface),.08); border-radius: 16px; overflow: hidden; cursor: pointer; transition: transform .15s, box-shadow .15s, border-color .15s; }
.rf-ficha-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.1); }
.rf-selected { border-color: #f59e0b !important; box-shadow: 0 0 0 3px rgba(245,158,11,.2) !important; }

.ficha-top { padding: 14px 14px 12px; background: linear-gradient(135deg, #f59e0b, #d97706); }
.ficha-tipo-chip { margin-bottom: 8px; }
.ficha-nombre { font-size: 15px; font-weight: 800; color: white; margin: 6px 0 2px; line-height: 1.2; }
.ficha-codigo { font-size: 11px; color: rgba(255,255,255,.75); }

.ficha-body { padding: 12px 14px; }
.ficha-info-row { display: flex; gap: 16px; margin-bottom: 10px; flex-wrap: wrap; }
.fi-item { display: flex; flex-direction: column; }
.fi-lbl { font-size: 10px; color: rgba(var(--v-theme-on-surface),.45); text-transform: uppercase; letter-spacing: .4px; }
.fi-val { font-size: 13px; font-weight: 600; }

.ficha-section-title { font-size: 10px; font-weight: 700; color: rgba(var(--v-theme-on-surface),.45); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
.ficha-ing-list { border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 8px; overflow: hidden; margin-bottom: 10px; }
.ficha-ing-row { display: grid; grid-template-columns: 1fr auto auto; gap: 8px; padding: 5px 8px; font-size: 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); align-items: center; }
.ficha-ing-row:last-child { border-bottom: none; }
.ing-name { color: rgba(var(--v-theme-on-surface),.8); display: flex; align-items: center; gap: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ing-cant { font-size: 11px; color: rgba(var(--v-theme-on-surface),.5); }
.ing-sub { font-family: monospace; font-size: 11px; color: rgba(var(--v-theme-on-surface),.7); }
.ficha-ing-more { padding: 4px 8px; font-size: 11px; color: rgba(var(--v-theme-on-surface),.4); font-style: italic; }

.ficha-costos { background: rgba(var(--v-theme-on-surface),.03); border-radius: 8px; padding: 8px 10px; display: flex; gap: 0; }
.fc-row { flex: 1; text-align: center; border-right: 1px solid rgba(var(--v-theme-on-surface),.07); }
.fc-row:last-child { border-right: none; }
.fc-lbl { display: block; font-size: 10px; color: rgba(var(--v-theme-on-surface),.45); text-transform: uppercase; letter-spacing: .4px; margin-bottom: 2px; }
.fc-val { font-size: 13px; font-weight: 700; font-family: monospace; color: rgba(var(--v-theme-on-surface),.85); }
.fc-val.error { color: #ef4444; }
</style>
