<template>
  <MainLayout>
    <div class="ptf-container">

      <!-- BREADCRUMB -->
      <div class="ptf-breadcrumb no-print">
        <span class="bc-root">FORMATOS / DOCS</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Planilla Toma Física</span>
      </div>

      <!-- CONTROLES -->
      <div class="ptf-controls no-print">
        <div class="ptf-controls-left">
          <div class="ptf-icon-wrap">
            <v-icon size="22" color="white">mdi-clipboard-list-outline</v-icon>
          </div>
          <div>
            <h1 class="ptf-title">PLANILLA TOMA FÍSICA</h1>
            <p class="ptf-sub">Control de inventario físico — Bodega Maestra</p>
          </div>
        </div>
        <v-btn
          v-if="!loading && productosAgrupados.length > 0"
          color="#8b5cf6"
          variant="elevated"
          prepend-icon="mdi-printer"
          @click="imprimir"
        >
          Imprimir / PDF
        </v-btn>
      </div>

      <!-- CARGANDO -->
      <div v-if="loading" class="ptf-loading no-print">
        <v-progress-circular indeterminate color="#8b5cf6" size="36" />
        <span>Cargando planilla...</span>
      </div>

      <!-- DOCUMENTO -->
      <div v-else-if="productosAgrupados.length > 0" class="doc-wrapper">

        <!-- ENCABEZADO SIMPLIFICADO -->
        <div class="doc-header">
          <div class="doc-empresa-nombre">{{ empresaNombre }}</div>
          <div class="doc-header-fecha">
            <span class="doc-fecha-label">FECHA:</span>
            <span class="doc-fecha-linea"></span>
          </div>
        </div>
        <div class="doc-titulo">PLANILLA DE TOMA FÍSICA DE INVENTARIO</div>
        <div class="doc-divider"></div>

        <!-- TABLA POR GRUPO -->
        <div v-for="grupo in productosAgrupados" :key="grupo.key" class="doc-grupo">
          <div class="doc-grupo-header">
            <span>{{ grupo.nombre }}</span>
            <span class="doc-grupo-count">{{ grupo.items.length }} producto{{ grupo.items.length !== 1 ? 's' : '' }}</span>
          </div>
          <table class="doc-tabla">
            <thead>
              <tr>
                <th class="col-cod">CÓD.</th>
                <th class="col-nom">NOMBRE</th>
                <th class="col-desc">DESCRIPCIÓN</th>
                <th class="col-und">UND</th>
                <th class="col-mov">ENTRADA</th>
                <th class="col-mov">BAJA</th>
                <th v-for="cc in centrosCosto" :key="cc.codigo" class="col-cc">{{ cc.nombre }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in grupo.items" :key="p.codigo">
                <td class="col-cod">{{ p.codigo }}</td>
                <td class="col-nom">{{ p.nombre }}</td>
                <td class="col-desc">{{ p.descripcion || '' }}</td>
                <td class="col-und">{{ p.und }}</td>
                <td class="col-mov"></td>
                <td class="col-mov"></td>
                <td v-for="cc in centrosCosto" :key="cc.codigo" class="col-cc"></td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      <div v-else-if="!loading" class="ptf-empty no-print">
        <v-icon size="48" color="rgba(var(--v-theme-on-surface),.2)">mdi-package-variant-closed</v-icon>
        <p>No hay productos en la Bodega Maestra</p>
        <span>Activa productos con "Bodega Maestra = SÍ" en Gestión de Productos</span>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const authStore = useAuthStore()
const loading       = ref(false)
const productos     = ref([])
const centrosCosto  = ref([])
const bodegaMaestraCC = ref(null)

const empresaNombre = computed(() => authStore.empresaNombre || '')

const productosAgrupados = computed(() => {
  const mapa = new Map()
  for (const p of productos.value) {
    const key    = p.grupo || '__sin_grupo__'
    const nombre = p.grupo_nombre || 'Sin Grupo'
    if (!mapa.has(key)) mapa.set(key, { key, nombre, items: [] })
    mapa.get(key).items.push(p)
  }
  return Array.from(mapa.values())
})

async function cargar() {
  loading.value = true
  try {
    const resBodega = await api.get('/empresas/bodega-maestra')
    bodegaMaestraCC.value = resBodega.data?.data?.bodega_maestra || null

    const resProds = await api.get('/almacen/productos')
    productos.value = (resProds.data?.data || []).filter(p => p.control === 'SI')

    const resCc = await api.get('/contabilidad/centrocostos', {
      params: { empresa: authStore.empresa, limit: 100 }
    })
    centrosCosto.value = (resCc.data?.data || [])
      .filter(cc => cc.codigo !== bodegaMaestraCC.value)
  } catch (e) {
    console.error('Error cargando planilla:', e)
  } finally {
    loading.value = false
  }
}

function imprimir() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const PW = doc.internal.pageSize.getWidth()
  const ML = 8, MR = 8

  // ── Encabezado ─────────────────────────────────────────────
  function drawHeader() {
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(empresaNombre.value.toUpperCase(), ML, 12)

    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text('PLANILLA DE TOMA FÍSICA DE INVENTARIO', ML, 17)

    // FECHA: _________ (derecha)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    const fechaLabel = 'FECHA: '
    const fechaX = PW - MR - 55
    doc.text(fechaLabel, fechaX, 12)
    doc.setFont('helvetica', 'normal')
    doc.line(fechaX + doc.getTextWidth(fechaLabel), 12, PW - MR, 12)

    // Línea separadora
    doc.setLineWidth(0.5)
    doc.line(ML, 20, PW - MR, 20)
  }

  drawHeader()

  // ── Construir tabla ────────────────────────────────────────
  const ccHeaders = centrosCosto.value.map(cc => cc.nombre)
  const head = [['CÓD.', 'NOMBRE', 'DESCRIPCIÓN', 'UND', 'ENTRADA', 'BAJA', ...ccHeaders]]

  const body = []
  for (const grupo of productosAgrupados.value) {
    // Fila de grupo
    body.push([{
      content: `${grupo.nombre.toUpperCase()}   (${grupo.items.length} productos)`,
      colSpan: 6 + centrosCosto.value.length,
      styles: {
        fontStyle: 'bold',
        fontSize: 7,
        fillColor: [30, 30, 30],
        textColor: [255, 255, 255],
        cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      }
    }])
    // Filas de productos
    for (const p of grupo.items) {
      body.push([
        p.codigo,
        p.nombre,
        p.descripcion || '',
        p.und,
        '', // ENTRADA
        '', // BAJA
        ...centrosCosto.value.map(() => '') // CC
      ])
    }
  }

  // Calcular ancho dinámico de columnas CC
  const totalCcWidth = centrosCosto.value.length > 0 ? centrosCosto.value.length * 18 : 0
  const colStyles = {
    0: { cellWidth: 12, halign: 'center' },                          // CÓD
    1: { cellWidth: 38 },                                             // NOMBRE
    2: { cellWidth: 30, textColor: [80, 80, 80] },                   // DESCRIPCIÓN
    3: { cellWidth: 10, halign: 'center' },                           // UND
    4: { cellWidth: 16, halign: 'center' },                           // ENTRADA
    5: { cellWidth: 14, halign: 'center' },                           // BAJA
  }
  // Añadir estilos para CCs
  centrosCosto.value.forEach((_, i) => {
    colStyles[6 + i] = { cellWidth: 18, halign: 'center' }
  })

  // Rastrear grupo activo para redibujarlo en saltos de página
  autoTable(doc, {
    head,
    body,
    startY: 23,
    margin: { left: ML, right: MR, top: 23 },
    styles: {
      fontSize: 7,
      cellPadding: { top: 2, bottom: 2, left: 1.5, right: 1.5 },
      lineColor: [180, 180, 180],
      lineWidth: 0.2,
      overflow: 'ellipsize',
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
      cellPadding: { top: 2, bottom: 2, left: 1.5, right: 1.5 },
    },
    alternateRowStyles: { fillColor: [252, 252, 252] },
    columnStyles: colStyles,
    rowPageBreak: 'avoid',
    didDrawPage(data) {
      if (data.pageNumber > 1) drawHeader()
    },
  })

  // Abrir en nueva pestaña en vez de descargar
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

onMounted(cargar)
</script>

<style scoped>
/* ── CONTROLES (pantalla) ── */
.ptf-container { padding: 24px; max-width: 1000px; margin: 0 auto; }
.ptf-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 12px; font-weight: 700; color: #8b5cf6; text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface),.3); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface),.8); font-weight: 500; }
.ptf-controls { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
.ptf-controls-left { display: flex; align-items: center; gap: 16px; }
.ptf-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#8b5cf6,#7c3aed); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(139,92,246,.35); flex-shrink: 0; }
.ptf-title { font-size: 20px; font-weight: 800; margin: 0; }
.ptf-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }
.ptf-loading { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 80px; font-size: 13px; color: rgba(var(--v-theme-on-surface),.5); }
.ptf-empty { text-align: center; padding: 80px 20px; color: rgba(var(--v-theme-on-surface),.4); }
.ptf-empty p { font-size: 16px; font-weight: 600; margin: 12px 0 6px; }

/* ── DOCUMENTO ── */
.doc-wrapper {
  background: white;
  color: #000;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 16px rgba(0,0,0,.1);
  font-family: Arial, sans-serif;
}

/* Encabezado */
.doc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 4px;
}
.doc-empresa-nombre { font-size: 16px; font-weight: 900; text-transform: uppercase; color: #000; }
.doc-header-fecha { display: flex; align-items: center; gap: 8px; }
.doc-fecha-label { font-size: 11px; font-weight: 700; color: #000; white-space: nowrap; }
.doc-fecha-linea { width: 140px; border-bottom: 1px solid #000; height: 14px; display: inline-block; }
.doc-titulo { font-size: 9px; font-weight: 600; color: #555; letter-spacing: .5px; text-transform: uppercase; margin-bottom: 6px; }
.doc-divider { height: 1.5px; background: #000; margin-bottom: 8px; }

/* Grupos */
.doc-grupo { margin-bottom: 6px; }
.doc-grupo-header {
  background: #000;
  color: #fff;
  padding: 3px 8px;
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .4px;
}
.doc-grupo-count { opacity: .7; font-weight: 400; }

/* Tabla */
.doc-tabla { width: 100%; border-collapse: collapse; font-size: 9px; table-layout: fixed; }

.doc-tabla thead th {
  background: #f0f0f0;
  color: #000;
  padding: 3px 4px;
  text-align: center;
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  border: 1px solid #aaa;
  white-space: nowrap;
  overflow: hidden;
}

.doc-tabla tbody td {
  padding: 3px 4px;
  border: 1px solid #ccc;
  color: #000;
  vertical-align: middle;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  height: 18px;
}

.col-cod  { width: 40px; }
.col-nom  { width: 130px; font-weight: 500; }
.col-desc { width: 110px; font-size: 8px; color: #444; }
.col-und  { width: 30px; text-align: center; }
.col-mov  { width: 55px; }
.col-cc   { width: 70px; }
</style>

