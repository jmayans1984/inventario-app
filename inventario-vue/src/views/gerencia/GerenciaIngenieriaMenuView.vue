<template>
  <MainLayout>
    <div class="im-wrap">

      <!-- BREADCRUMB -->
      <div class="im-breadcrumb">
        <span class="bc-root">GERENCIA</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Ingeniería de Menú</span>
      </div>

      <!-- HEADER -->
      <div class="im-header">
        <div class="im-header-left">
          <div class="im-icon-wrap">
            <v-icon size="24" color="white">mdi-silverware-fork-knife</v-icon>
          </div>
          <div>
            <h1 class="im-title">INGENIERÍA DE MENÚ</h1>
            <p class="im-sub">Qué plato proteger, cuál re-precificar, cuál promover y cuál sacar de la carta</p>
          </div>
        </div>
        <div class="im-header-right">
          <div class="im-fechas">
            <input type="date" v-model="desde" class="im-date" />
            <span class="im-date-sep">→</span>
            <input type="date" v-model="hasta" class="im-date" />
          </div>
          <v-btn color="#d97706" variant="flat" prepend-icon="mdi-refresh" :loading="loading" rounded="lg" @click="cargar">
            Actualizar
          </v-btn>
        </div>
      </div>

      <!-- FILTROS -->
      <div v-if="data" class="im-filtros">
        <div class="im-filtro">
          <label>SEDE</label>
          <select v-model="ccosto" class="im-select" @change="cargar">
            <option value="">Todas</option>
            <option v-for="c in data.ccostos" :key="c.codigo" :value="c.codigo">{{ c.nombre }}</option>
          </select>
        </div>
        <div class="im-filtro">
          <label>GRUPO</label>
          <select v-model="grupo" class="im-select" @change="cargar">
            <option value="">Todos</option>
            <option v-for="g in data.grupos" :key="g.codigo" :value="g.codigo">{{ g.nombre }}</option>
          </select>
        </div>
        <label class="im-check">
          <input type="checkbox" v-model="incluirSub" @change="cargar" />
          Incluir subproductos
        </label>
      </div>

      <!-- LOADING -->
      <div v-if="loading" class="im-loading">
        <v-progress-circular indeterminate color="#d97706" size="48" />
        <p>Cruzando ventas contra costo de recetas...</p>
      </div>

      <div v-else-if="!data || !data.platos.length" class="im-empty">
        <v-icon size="48" color="rgba(var(--v-theme-on-surface),0.2)">mdi-database-off-outline</v-icon>
        <p>No hay platos con costo de receta en el período</p>
      </div>

      <template v-else>

        <!-- AVISO DE COSTOS INCONSISTENTES -->
        <div v-if="data.food_cost_sospechoso" class="im-aviso">
          <v-icon size="18" color="#ef4444">mdi-alert-outline</v-icon>
          <div>
            <strong>Los costos de receta no cuadran (food cost global {{ pct(t.food_cost_pct) }}).</strong>
            Lo más probable es que algunas recetas tengan el costo del lote completo en vez del costo por
            porción. <strong>La clasificación en cuadrantes sigue sirviendo</strong> porque compara cada
            plato contra la mediana del menú, no contra un valor absoluto — pero solo si el error es
            parejo. Los <em>montos</em> de margen y los <em>%</em> de food cost no son confiables hasta
            corregir las recetas en <strong>Recetas → Gestión de Costos</strong>.
          </div>
        </div>

        <!-- RESUMEN POR CUADRANTE -->
        <div class="im-cuadrantes">
          <div v-for="c in CUADRANTES" :key="c.key" class="im-cuad" :style="`--c:${c.color}`">
            <div class="im-cuad-head">
              <v-icon size="17" :color="c.color">{{ c.icon }}</v-icon>
              <span class="im-cuad-nom">{{ c.label }}</span>
              <span class="im-cuad-num">{{ data.resumen[c.key].num }}</span>
            </div>
            <div class="im-cuad-desc">{{ c.desc }}</div>
            <div class="im-cuad-stats">
              <div><span>Margen</span><strong>{{ money(data.resumen[c.key].margen) }}</strong></div>
              <div><span>Unidades</span><strong>{{ num(data.resumen[c.key].unidades) }}</strong></div>
            </div>
          </div>
        </div>

        <!-- SCATTER -->
        <div class="im-card">
          <div class="im-card-head">
            <v-icon size="16" color="#d97706">mdi-chart-scatter-plot</v-icon>
            Matriz popularidad vs. margen
            <span class="im-card-note">
              Umbrales: popularidad {{ pct(data.umbrales.popularidad_pct) }} del mix ·
              margen {{ money(data.umbrales.margen_unitario) }} por unidad
            </span>
          </div>
          <div ref="scatterRef" class="im-chart"></div>
        </div>

        <!-- TABLA -->
        <div class="im-card">
          <div class="im-card-head">
            <v-icon size="16" color="#d97706">mdi-format-list-bulleted</v-icon>
            Detalle por plato
            <div class="im-tabs">
              <button v-for="f in FILTROS_CLASE" :key="f.key" class="im-tab"
                      :class="{ active: filtroClase === f.key }" @click="filtroClase = f.key">
                {{ f.label }}
              </button>
            </div>
          </div>
          <div class="im-table-scroll">
            <table class="im-table">
              <thead>
                <tr>
                  <th class="th-nom">PLATO</th>
                  <th class="th-cls">CLASIFICACIÓN</th>
                  <th class="th-num">UNIDADES</th>
                  <th class="th-num">MIX %</th>
                  <th class="th-num">P. PROM.</th>
                  <th class="th-num">COSTO U.</th>
                  <th class="th-num">MARGEN U.</th>
                  <th class="th-num">FOOD %</th>
                  <th class="th-num">MARGEN TOTAL</th>
                  <th class="th-acc">QUÉ HACER</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in platosFiltrados" :key="p.codigo">
                  <td class="td-nom">
                    {{ p.nombre }}
                    <span class="td-grupo">{{ p.grupo_nombre }}</span>
                  </td>
                  <td>
                    <span class="im-chip" :style="`background:${claseColor(p.clase)}22;color:${claseColor(p.clase)}`">
                      {{ claseLabel(p.clase) }}
                    </span>
                  </td>
                  <td class="td-num">{{ num(p.unidades) }}</td>
                  <td class="td-num">{{ pct(p.mix_pct) }}</td>
                  <td class="td-num">{{ money(p.precio_promedio) }}</td>
                  <td class="td-num">{{ money(p.costo_unitario) }}</td>
                  <td class="td-num" :style="`color:${p.margen_unitario >= 0 ? '#22c55e' : '#ef4444'}`">
                    {{ money(p.margen_unitario) }}
                  </td>
                  <td class="td-num" :style="`color:${colorFood(p.food_cost_pct)}`">{{ pct(p.food_cost_pct) }}</td>
                  <td class="td-num td-margen">{{ money(p.margen_total) }}</td>
                  <td class="td-acc">{{ p.accion }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- PLATOS SIN COSTO -->
        <div class="im-card" v-if="data.platos_sin_costo.length">
          <div class="im-card-head">
            <v-icon size="16" color="#f59e0b">mdi-help-circle-outline</v-icon>
            {{ data.platos_sin_costo.length }} plato(s) vendidos sin costo de receta
            <span class="im-card-note">No se pueden clasificar: falta cargarles la receta o su costo</span>
          </div>
          <div class="im-table-scroll">
            <table class="im-table">
              <thead>
                <tr>
                  <th class="th-nom">PLATO</th>
                  <th class="th-num">UNIDADES</th>
                  <th class="th-num">INGRESOS</th>
                  <th class="th-num">P. PROMEDIO</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in data.platos_sin_costo" :key="p.codigo">
                  <td class="td-nom">{{ p.nombre }}</td>
                  <td class="td-num">{{ num(p.unidades) }}</td>
                  <td class="td-num">{{ money(p.ingresos) }}</td>
                  <td class="td-num">{{ money(p.precio_promedio) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </template>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import ApexCharts from 'apexcharts'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const empresa = computed(() => authStore.empresa || authStore.user?.empresa || localStorage.getItem('empresaActual') || '')

const loading = ref(false)
const data = ref(null)
const scatterRef = ref(null)
let scatter = null

function haceMeses(n) {
  const d = new Date(); d.setMonth(d.getMonth() - n + 1); d.setDate(1)
  return d.toISOString().slice(0, 10)
}
const desde = ref(haceMeses(3))
const hasta = ref(new Date().toISOString().slice(0, 10))
const ccosto = ref('')
const grupo = ref('')
const incluirSub = ref(false)
const filtroClase = ref('TODOS')

const CUADRANTES = [
  { key: 'ESTRELLA', label: 'Estrellas',          color: '#22c55e', icon: 'mdi-star-outline',        desc: 'Se venden mucho y dejan mucho. No les toques el precio.' },
  { key: 'CABALLO',  label: 'Caballos de batalla', color: '#0ea5e9', icon: 'mdi-horse-variant',      desc: 'Se venden mucho pero dejan poco. Sube precio o baja costo.' },
  { key: 'ENIGMA',   label: 'Enigmas',             color: '#8b5cf6', icon: 'mdi-help-rhombus-outline', desc: 'Dejan mucho pero se venden poco. Promociónalos.' },
  { key: 'PERRO',    label: 'Perros',              color: '#ef4444', icon: 'mdi-thumb-down-outline', desc: 'Ni se venden ni dejan. Candidatos a salir.' },
]
const FILTROS_CLASE = [
  { key: 'TODOS', label: 'Todos' },
  ...CUADRANTES.map(c => ({ key: c.key, label: c.label })),
]

const t = computed(() => data.value?.totales || {})

const platosFiltrados = computed(() => {
  if (!data.value) return []
  if (filtroClase.value === 'TODOS') return data.value.platos
  return data.value.platos.filter(p => p.clase === filtroClase.value)
})

function claseColor(c) { return CUADRANTES.find(x => x.key === c)?.color || '#888' }
function claseLabel(c) { return CUADRANTES.find(x => x.key === c)?.label || c }

function money(v) {
  if (v === null || v === undefined) return '—'
  return '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function pct(v) {
  if (v === null || v === undefined) return '—'
  return Number(v).toFixed(1) + '%'
}
function num(v) {
  if (v === null || v === undefined) return '—'
  return Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })
}
function colorFood(v) {
  if (v === null || v === undefined) return 'inherit'
  return v <= 30 ? '#22c55e' : v <= 35 ? '#f59e0b' : '#ef4444'
}
function isDark() {
  return document.documentElement.classList.contains('v-theme--dark') ||
         document.body.classList.contains('v-theme--dark') ||
         window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

function pintarScatter() {
  scatter?.destroy(); scatter = null
  if (!scatterRef.value || !data.value?.platos.length) return

  const series = CUADRANTES.map(c => ({
    name: c.label,
    data: data.value.platos
      .filter(p => p.clase === c.key)
      .map(p => ({ x: +p.mix_pct.toFixed(2), y: +p.margen_unitario.toFixed(2), nombre: p.nombre })),
  }))

  scatter = new ApexCharts(scatterRef.value, {
    chart: { type: 'scatter', height: 420, toolbar: { show: false }, fontFamily: 'Inter,sans-serif', background: 'transparent', zoom: { enabled: true } },
    theme: { mode: isDark() ? 'dark' : 'light' },
    series,
    colors: CUADRANTES.map(c => c.color),
    markers: { size: 7, strokeWidth: 0, hover: { size: 10 } },
    xaxis: {
      title: { text: 'Popularidad — % del mix de unidades' },
      tickAmount: 8,
      labels: { formatter: v => Number(v).toFixed(1) + '%' },
    },
    yaxis: {
      title: { text: 'Margen de contribución por unidad' },
      labels: { formatter: v => '$' + Number(v).toFixed(2) },
    },
    // Las líneas de umbral son lo que define los cuatro cuadrantes
    annotations: {
      xaxis: [{
        x: data.value.umbrales.popularidad_pct,
        borderColor: '#94a3b8', strokeDashArray: 5,
        label: { text: 'Popularidad media', style: { fontSize: '10px', background: '#94a3b8', color: '#fff' } },
      }],
      yaxis: [{
        y: data.value.umbrales.margen_unitario,
        borderColor: '#94a3b8', strokeDashArray: 5,
        label: { text: 'Margen medio', style: { fontSize: '10px', background: '#94a3b8', color: '#fff' } },
      }],
    },
    tooltip: {
      custom: ({ seriesIndex, dataPointIndex, w }) => {
        const p = w.config.series[seriesIndex].data[dataPointIndex]
        return `<div style="padding:8px 11px;font-size:12px">
                  <strong>${p.nombre}</strong><br/>
                  Mix: ${p.x}%<br/>
                  Margen unitario: $${p.y}
                </div>`
      },
    },
    legend: { position: 'top', horizontalAlign: 'left', markers: { radius: 12 } },
    grid: { borderColor: 'rgba(148,163,184,0.18)' },
  })
  scatter.render()
}

async function cargar() {
  loading.value = true
  try {
    const r = await api.get('/gerencia/ingenieria-menu', {
      params: {
        empresa: empresa.value, desde: desde.value, hasta: hasta.value,
        ccosto: ccosto.value || undefined,
        grupo: grupo.value || undefined,
        incluir_subproductos: incluirSub.value ? 'true' : undefined,
      },
    })
    data.value = r.data
    await nextTick()
    pintarScatter()
  } catch (e) {
    console.error('Error cargando ingeniería de menú:', e)
    data.value = null
  } finally {
    loading.value = false
  }
}

watch(filtroClase, () => {})
onBeforeUnmount(() => { scatter?.destroy() })
onMounted(cargar)
</script>

<style scoped>
.im-wrap { display: flex; flex-direction: column; gap: 16px; }

.im-breadcrumb { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; }
.bc-root { color: #d97706; text-transform: uppercase; }
.bc-sep, .bc-cat { color: rgba(var(--v-theme-on-surface), 0.35); text-transform: uppercase; }
.bc-current { color: rgba(var(--v-theme-on-surface), 0.55); text-transform: uppercase; }

.im-header {
  display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  padding: 18px 22px; background: rgb(var(--v-theme-surface));
  border-radius: 14px; border-left: 4px solid #d97706;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.im-header-left { display: flex; align-items: center; gap: 14px; }
.im-icon-wrap {
  width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0;
  background: linear-gradient(135deg, #d97706, #b45309);
  display: flex; align-items: center; justify-content: center;
}
.im-title { font-size: 17px; font-weight: 800; letter-spacing: 0.6px; line-height: 1.2; }
.im-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.45); margin-top: 2px; }
.im-header-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.im-fechas { display: flex; align-items: center; gap: 6px; }
.im-date, .im-select {
  height: 34px; padding: 0 10px; border-radius: 8px; font-size: 12px; outline: none;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.2);
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: rgb(var(--v-theme-on-surface));
}
.im-date-sep { color: rgba(var(--v-theme-on-surface), 0.35); font-size: 12px; }

.im-filtros {
  display: flex; align-items: flex-end; gap: 14px; flex-wrap: wrap;
  padding: 13px 18px; background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07); border-radius: 12px;
}
.im-filtro { display: flex; flex-direction: column; gap: 4px; }
.im-filtro label { font-size: 10px; font-weight: 800; letter-spacing: 0.6px; color: rgba(var(--v-theme-on-surface), 0.45); }
.im-select { min-width: 170px; }
.im-check { display: flex; align-items: center; gap: 7px; font-size: 12px; cursor: pointer; height: 34px; }
.im-check input { width: 15px; height: 15px; accent-color: #d97706; cursor: pointer; }

.im-loading, .im-empty {
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  padding: 60px 20px; color: rgba(var(--v-theme-on-surface), 0.4); font-size: 13px;
}

.im-aviso {
  display: flex; align-items: flex-start; gap: 11px;
  padding: 14px 18px; border-radius: 11px; font-size: 12.5px; line-height: 1.6;
  background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.22);
  color: rgba(var(--v-theme-on-surface), 0.8);
}

/* Cuadrantes */
.im-cuadrantes { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 12px; }
.im-cuad {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-top: 3px solid var(--c);
  border-radius: 12px; padding: 14px 16px;
  display: flex; flex-direction: column; gap: 7px;
}
.im-cuad-head { display: flex; align-items: center; gap: 7px; }
.im-cuad-nom { font-size: 12px; font-weight: 800; letter-spacing: 0.3px; }
.im-cuad-num {
  margin-left: auto; font-size: 17px; font-weight: 800; color: var(--c);
  font-variant-numeric: tabular-nums;
}
.im-cuad-desc { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5); line-height: 1.45; min-height: 30px; }
.im-cuad-stats { display: flex; gap: 16px; padding-top: 7px; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06); }
.im-cuad-stats > div { display: flex; flex-direction: column; gap: 1px; }
.im-cuad-stats span { font-size: 9px; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface), 0.35); }
.im-cuad-stats strong { font-size: 12px; font-variant-numeric: tabular-nums; }

/* Card */
.im-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-radius: 14px; overflow: hidden;
}
.im-card-head {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 13px 18px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  font-size: 11px; font-weight: 800; letter-spacing: 0.7px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
.im-card-note { font-weight: 500; text-transform: none; letter-spacing: 0; color: rgba(var(--v-theme-on-surface), 0.35); }
.im-chart { padding: 8px 12px 4px; }

.im-tabs { display: flex; gap: 4px; margin-left: auto; }
.im-tab {
  padding: 5px 10px; border-radius: 6px; font-size: 10px; font-weight: 700; cursor: pointer;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.15);
  background: transparent; color: rgba(var(--v-theme-on-surface), 0.55);
  text-transform: none; letter-spacing: 0; transition: all 0.15s;
}
.im-tab:hover { border-color: #d97706; color: #d97706; }
.im-tab.active { background: rgba(217,119,6,0.13); border-color: #d97706; color: #d97706; }

.im-table-scroll { overflow-x: auto; }
.im-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.im-table th {
  padding: 10px 13px; font-size: 10px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.45);
  border-bottom: 1.5px solid rgba(var(--v-theme-on-surface), 0.1);
  background: rgba(var(--v-theme-on-surface), 0.03);
  white-space: nowrap;
}
.th-nom { text-align: left; min-width: 190px; }
.th-cls { text-align: left; }
.th-num { text-align: right; }
.th-acc { text-align: left; min-width: 210px; }

.im-table td { padding: 9px 13px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.04); }
.td-nom { font-weight: 600; }
.td-grupo { display: block; font-size: 10px; color: rgba(var(--v-theme-on-surface), 0.35); margin-top: 1px; }
.td-num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.td-margen { font-weight: 800; }
.td-acc { font-size: 11.5px; color: rgba(var(--v-theme-on-surface), 0.6); }

.im-chip { font-size: 9px; font-weight: 800; padding: 3px 8px; border-radius: 5px; letter-spacing: 0.3px; white-space: nowrap; }
</style>
