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
        <div class="ptf-controls-right">
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
      </div>

      <!-- CARGANDO -->
      <div v-if="loading" class="ptf-loading no-print">
        <v-progress-circular indeterminate color="#8b5cf6" size="36" />
        <span>Cargando planilla...</span>
      </div>

      <!-- DOCUMENTO -->
      <div v-else-if="productosAgrupados.length > 0" class="doc-wrapper" id="doc-planilla">

        <!-- ENCABEZADO -->
        <div class="doc-header">
          <div class="doc-header-top">
            <div class="doc-empresa">
              <div class="doc-empresa-nombre">{{ empresaNombre }}</div>
              <div class="doc-empresa-sub">PLANILLA DE TOMA FÍSICA DE INVENTARIO</div>
            </div>
            <div class="doc-meta">
              <table class="doc-meta-table">
                <tr>
                  <td class="meta-label">Bodega Maestra:</td>
                  <td class="meta-val">{{ bodegaMaestraCC }}</td>
                </tr>
                <tr>
                  <td class="meta-label">Fecha:</td>
                  <td class="meta-val">{{ fechaHoy }}</td>
                </tr>
                <tr>
                  <td class="meta-label">Responsable:</td>
                  <td class="meta-val meta-blank">__________________________</td>
                </tr>
              </table>
            </div>
          </div>
          <div class="doc-divider"></div>
        </div>

        <!-- TABLA POR GRUPO -->
        <div v-for="grupo in productosAgrupados" :key="grupo.key" class="doc-grupo">
          <div class="doc-grupo-header">
            <span class="doc-grupo-nombre">{{ grupo.nombre }}</span>
            <span class="doc-grupo-count">{{ grupo.items.length }} producto{{ grupo.items.length !== 1 ? 's' : '' }}</span>
          </div>

          <table class="doc-tabla">
            <thead>
              <tr>
                <th class="col-cod">CÓDIGO</th>
                <th class="col-nom">NOMBRE</th>
                <th class="col-desc">DESCRIPCIÓN</th>
                <th class="col-und">UND</th>
                <th class="col-entrada">ENTRADA</th>
                <th class="col-baja">BAJA</th>
                <th v-for="cc in centrosCosto" :key="cc.codigo" class="col-cc">
                  {{ cc.nombre }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in grupo.items" :key="p.codigo">
                <td class="col-cod">{{ p.codigo }}</td>
                <td class="col-nom">{{ p.nombre }}</td>
                <td class="col-desc">{{ p.descripcion || '' }}</td>
                <td class="col-und">{{ p.und }}</td>
                <td class="col-entrada"></td>
                <td class="col-baja"></td>
                <td v-for="cc in centrosCosto" :key="cc.codigo" class="col-cc"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PIE -->
        <div class="doc-footer">
          <div class="doc-footer-firmas">
            <div class="firma-box">
              <div class="firma-linea"></div>
              <div class="firma-label">Elaborado por</div>
            </div>
            <div class="firma-box">
              <div class="firma-linea"></div>
              <div class="firma-label">Revisado por</div>
            </div>
            <div class="firma-box">
              <div class="firma-linea"></div>
              <div class="firma-label">Aprobado por</div>
            </div>
          </div>
          <div class="doc-footer-info">
            Total productos: <strong>{{ totalProductos }}</strong> &nbsp;|&nbsp;
            Generado: {{ fechaHora }}
          </div>
        </div>

      </div>

      <div v-else class="ptf-empty no-print">
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

const authStore = useAuthStore()
const loading       = ref(false)
const productos     = ref([])
const centrosCosto  = ref([])   // CCs activos, sin la bodega maestra
const bodegaMaestraCC = ref(null)

const empresaNombre = computed(() => authStore.empresaNombre || '')

const fechaHoy = computed(() => {
  const d = new Date()
  return d.toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
})
const fechaHora = computed(() => new Date().toLocaleString('es'))
const totalProductos = computed(() => productos.value.length)

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
    // 1. Obtener bodega maestra
    const resBodega = await api.get('/empresas/bodega-maestra')
    bodegaMaestraCC.value = resBodega.data?.data?.bodega_maestra || null

    // 2. Cargar todos los productos y filtrar los que tienen Bodega Maestra = SI
    const resProds = await api.get('/almacen/productos')
    productos.value = (resProds.data?.data || []).filter(p => p.control === 'SI')

    // 3. Cargar centros de costo activos, excluir la bodega maestra
    const resCc = await api.get('/contabilidad/centrocostos', {
      params: { empresa: authStore.empresa, limit: 100 }
    })
    const todos = resCc.data?.data || []
    centrosCosto.value = todos.filter(cc => cc.codigo !== bodegaMaestraCC.value)

  } catch (e) {
    console.error('Error cargando planilla:', e)
  } finally {
    loading.value = false
  }
}

function imprimir() {
  window.print()
}

onMounted(cargar)
</script>

<style scoped>
.ptf-container { padding: 24px; max-width: 100%; margin: 0 auto; }
.ptf-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 12px; font-weight: 700; color: #8b5cf6; text-transform: uppercase; letter-spacing: .5px; }
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
.ptf-empty span { font-size: 13px; }

/* ── DOCUMENTO (fondo blanco siempre) ── */
.doc-wrapper {
  background: white;
  color: #1a1a1a;
  padding: 28px;
  border-radius: 8px;
  box-shadow: 0 2px 16px rgba(0,0,0,.12);
  font-family: Arial, sans-serif;
}

.doc-header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
.doc-empresa-nombre { font-size: 18px; font-weight: 800; color: #111827; text-transform: uppercase; }
.doc-empresa-sub { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }

.doc-meta-table { border-collapse: collapse; font-size: 12px; }
.doc-meta-table td { padding: 3px 8px; }
.meta-label { font-weight: 700; color: #374151; white-space: nowrap; }
.meta-val { color: #111827; font-weight: 500; min-width: 160px; }
.meta-blank { border-bottom: 1px solid #9ca3af; }

.doc-divider { height: 2px; background: #111827; margin: 10px 0 18px; }

.doc-grupo { margin-bottom: 20px; }
.doc-grupo-header {
  background: #1f2937;
  color: white;
  padding: 6px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.doc-grupo-nombre { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
.doc-grupo-count { font-size: 10px; opacity: .7; }

.doc-tabla { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; }

.doc-tabla thead th {
  background: #f3f4f6;
  color: #374151;
  padding: 6px 5px;
  text-align: center;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .2px;
  border: 1px solid #d1d5db;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-tabla tbody tr:nth-child(even) { background: #f9fafb; }
.doc-tabla tbody td {
  padding: 7px 5px;
  border: 1px solid #e5e7eb;
  color: #1a1a1a;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-cod   { width: 55px; }
.col-nom   { width: 150px; font-weight: 500; }
.col-desc  { width: 130px; font-size: 10px; color: #6b7280; }
.col-und   { width: 40px; text-align: center; }
.col-entrada { width: 70px; background: #eff6ff; text-align: center; }
.col-baja    { width: 70px; background: #fff7ed; text-align: center; }
.col-cc      { background: #f0fdf4; text-align: center; }

.doc-footer { margin-top: 36px; }
.doc-footer-firmas { display: flex; justify-content: space-around; margin-bottom: 28px; }
.firma-box { text-align: center; flex: 1; padding: 0 16px; }
.firma-linea { border-top: 1px solid #374151; margin-bottom: 6px; }
.firma-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: .5px; }
.doc-footer-info { text-align: center; font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
</style>

<style>
@media print {
  .no-print,
  .v-navigation-drawer,
  .v-app-bar,
  header, nav, aside { display: none !important; }

  body, html { background: white !important; }
  .v-main { padding: 0 !important; }
  .ptf-container { padding: 0 !important; max-width: 100% !important; }

  .doc-wrapper {
    box-shadow: none !important;
    border-radius: 0 !important;
    padding: 12px !important;
  }

  .doc-grupo { page-break-inside: avoid; }

  .doc-tabla thead th  { background: #e5e7eb !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .doc-grupo-header    { background: #1f2937 !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .doc-tabla tbody tr:nth-child(even) { background: #f9fafb !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .col-entrada { background: #eff6ff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .col-baja    { background: #fff7ed !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .col-cc      { background: #f0fdf4 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  @page { size: letter landscape; margin: 10mm; }
}
</style>
