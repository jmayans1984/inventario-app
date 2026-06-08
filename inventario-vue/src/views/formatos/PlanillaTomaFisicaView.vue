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

function imprimir() { window.print() }

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

<style>
/* ── IMPRESIÓN ── */
@media print {
  /* Ocultar TODO excepto el documento */
  body > *:not(.v-application) { display: none !important; }

  .v-navigation-drawer,
  .v-app-bar,
  .v-app-bar--fixed,
  .v-toolbar,
  .v-system-bar,
  header, nav, aside,
  [class*="app-bar"],
  [class*="v-toolbar"],
  .no-print { display: none !important; }

  /* Quitar padding del layout de Vuetify */
  body, html { background: white !important; margin: 0; padding: 0; }
  .v-application { background: white !important; }
  .v-application__wrap { padding: 0 !important; }
  .v-main,
  .v-main__wrap { padding: 0 !important; margin: 0 !important; padding-top: 0 !important; }
  .ptf-container { padding: 0 !important; max-width: 100% !important; margin: 0 !important; }

  .doc-wrapper {
    box-shadow: none !important;
    border-radius: 0 !important;
    padding: 8mm 10mm !important;
  }

  .doc-grupo { page-break-inside: avoid; }

  .doc-grupo-header { background: #000 !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .doc-tabla thead th { background: #e8e8e8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  @page { size: letter portrait; margin: 8mm; }
}
</style>
