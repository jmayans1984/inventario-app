<template>
  <MainLayout>
    <div class="pv-wrap">

      <!-- BREADCRUMB -->
      <div class="pv-breadcrumb">
        <span class="bc-root">GERENCIA</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Análisis de Proveedores</span>
      </div>

      <!-- HEADER -->
      <div class="pv-header">
        <div class="pv-header-left">
          <div class="pv-icon-wrap">
            <v-icon size="24" color="white">mdi-truck-outline</v-icon>
          </div>
          <div>
            <h1 class="pv-title">ANÁLISIS DE PROVEEDORES</h1>
            <p class="pv-sub">Cuánto le compras a cada uno, cómo evolucionó y qué tan concentrado está tu gasto</p>
          </div>
        </div>
        <div class="pv-header-right">
          <div class="pv-fechas">
            <input type="date" v-model="desde" class="pv-date" />
            <span class="pv-date-sep">→</span>
            <input type="date" v-model="hasta" class="pv-date" />
          </div>
          <v-btn color="#b45309" variant="flat" prepend-icon="mdi-refresh" :loading="loading" rounded="lg" @click="cargar">
            Actualizar
          </v-btn>
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="loading" class="pv-loading">
        <v-progress-circular indeterminate color="#b45309" size="48" />
        <p>Analizando compras por proveedor...</p>
      </div>

      <div v-else-if="!data || !data.proveedores.length" class="pv-empty">
        <v-icon size="48" color="rgba(var(--v-theme-on-surface),0.2)">mdi-database-off-outline</v-icon>
        <p>No hay compras registradas en el período</p>
      </div>

      <template v-else>

        <!-- KPIs -->
        <div class="pv-kpis">
          <div class="pv-kpi">
            <div class="pv-kpi-accent" style="background:#b45309"></div>
            <div class="pv-kpi-body">
              <div class="pv-kpi-lbl">Gasto Total</div>
              <div class="pv-kpi-val">{{ money(k.total_gasto) }}</div>
              <div class="pv-kpi-foot">{{ k.total_compras }} compras</div>
            </div>
          </div>
          <div class="pv-kpi">
            <div class="pv-kpi-accent" style="background:#0ea5e9"></div>
            <div class="pv-kpi-body">
              <div class="pv-kpi-lbl">Proveedores</div>
              <div class="pv-kpi-val">{{ k.num_proveedores }}</div>
              <div class="pv-kpi-foot">activos en el período</div>
            </div>
          </div>
          <div class="pv-kpi">
            <div class="pv-kpi-accent" :style="`background:${colorConc(k.pct_top1)}`"></div>
            <div class="pv-kpi-body">
              <div class="pv-kpi-lbl">Mayor Proveedor</div>
              <div class="pv-kpi-val" :style="`color:${colorConc(k.pct_top1)}`">{{ pct(k.pct_top1) }}</div>
              <div class="pv-kpi-foot">del gasto total</div>
            </div>
          </div>
          <div class="pv-kpi">
            <div class="pv-kpi-accent" style="background:#8b5cf6"></div>
            <div class="pv-kpi-body">
              <div class="pv-kpi-lbl">Top 5</div>
              <div class="pv-kpi-val">{{ pct(k.pct_top5) }}</div>
              <div class="pv-kpi-foot">del gasto total</div>
            </div>
          </div>
          <div class="pv-kpi">
            <div class="pv-kpi-accent" :style="`background:${colorNivel(k.concentracion)}`"></div>
            <div class="pv-kpi-body">
              <div class="pv-kpi-lbl">Concentración</div>
              <div class="pv-kpi-val" :style="`color:${colorNivel(k.concentracion)}`">{{ k.concentracion }}</div>
              <div class="pv-kpi-foot">índice {{ Math.round(k.hhi) }}</div>
            </div>
          </div>
        </div>

        <!-- ALERTA DE CONCENTRACIÓN -->
        <div v-if="k.concentracion === 'ALTA'" class="pv-alerta">
          <v-icon size="17" color="#ef4444">mdi-alert-outline</v-icon>
          <div>
            <strong>Tu gasto está muy concentrado.</strong>
            {{ data.proveedores[0].proveedor_nombre }} representa {{ pct(k.pct_top1) }} de todo lo que compras.
            Si ese proveedor sube precios, falla o se cae, tienes poco margen de reacción.
          </div>
        </div>
        <div v-if="k.inactivos_60d > 0" class="pv-alerta pv-alerta--info">
          <v-icon size="17" color="#f59e0b">mdi-clock-outline</v-icon>
          <div>
            <strong>{{ k.inactivos_60d }} proveedor(es)</strong> sin compras hace más de 60 días.
            Revisa si siguen activos o si quedaron precios desactualizados.
          </div>
        </div>

        <!-- TABLA -->
        <div class="pv-card">
          <div class="pv-card-head">
            <v-icon size="16" color="#b45309">mdi-format-list-numbered</v-icon>
            Ranking de proveedores
            <span class="pv-card-note">
              vs período anterior ({{ data.periodo_anterior.desde }} → {{ data.periodo_anterior.hasta }})
            </span>
          </div>
          <div class="pv-table-scroll">
            <table class="pv-table">
              <thead>
                <tr>
                  <th class="th-rank"></th>
                  <th class="th-rank">#</th>
                  <th class="th-nom">PROVEEDOR</th>
                  <th class="th-num">TOTAL</th>
                  <th class="th-num">% TOTAL</th>
                  <th class="th-num">% ACUM.</th>
                  <th class="th-num">COMPRAS</th>
                  <th class="th-num">TICKET PROM.</th>
                  <th class="th-num">ARTÍCULOS</th>
                  <th class="th-num">vs ANTERIOR</th>
                  <th class="th-num">ÚLTIMA COMPRA</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(p, i) in data.proveedores" :key="p.proveedor">
                  <tr :class="{ 'fila-pareto': p.pct_acumulado <= 80 }"
                      class="pv-tr-click" @click="toggleExpand(p.proveedor)">
                    <td class="td-rank">
                      <v-icon size="16" class="pv-expand-icon" :class="{ 'pv-expand-icon--open': expandido === p.proveedor }">
                        mdi-chevron-right
                      </v-icon>
                    </td>
                    <td class="td-rank">{{ i + 1 }}</td>
                    <td class="td-nom">
                      {{ p.proveedor_nombre }}
                      <span v-if="p.num_sedes > 1" class="pv-chip-sedes">{{ p.num_sedes }} sedes</span>
                    </td>
                    <td class="td-num td-total">{{ money(p.total) }}</td>
                    <td class="td-num">
                      <div class="pv-bar-wrap">
                        <div class="pv-bar" :style="`width:${Math.min(100, p.pct_del_total)}%`"></div>
                        <span>{{ pct(p.pct_del_total) }}</span>
                      </div>
                    </td>
                    <td class="td-num td-acum">{{ pct(p.pct_acumulado) }}</td>
                    <td class="td-num">{{ p.num_compras }}</td>
                    <td class="td-num">{{ money(p.ticket_promedio) }}</td>
                    <td class="td-num">{{ p.articulos_distintos || '—' }}</td>
                    <td class="td-num">
                      <span v-if="p.variacion_pct === null" class="pv-nuevo">NUEVO</span>
                      <span v-else :style="`color:${p.variacion_pct >= 0 ? '#ef4444' : '#22c55e'}`">
                        {{ p.variacion_pct >= 0 ? '+' : '' }}{{ pct(p.variacion_pct) }}
                      </span>
                    </td>
                    <td class="td-num">
                      {{ fecha(p.ultima) }}
                      <span v-if="p.dias_sin_comprar > 60" class="pv-chip-inactivo">{{ p.dias_sin_comprar }}d</span>
                    </td>
                  </tr>
                  <tr v-if="expandido === p.proveedor" class="pv-tr-detalle">
                    <td colspan="10">
                      <div v-if="!p.gastos || !p.gastos.length" class="pv-detalle-vacio">
                        Sin gastos individuales registrados en el período.
                      </div>
                      <table v-else class="pv-subtable">
                        <thead>
                          <tr>
                            <th class="th-nom">FECHA</th>
                            <th class="th-nom">CONCEPTO</th>
                            <th class="th-nom">FACTURA</th>
                            <th class="th-nom">CENTRO DE COSTO</th>
                            <th class="th-num">TOTAL</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(gto, gi) in p.gastos" :key="gi">
                            <td>{{ fecha(gto.fecha) }}</td>
                            <td>{{ gto.concepto || '—' }}</td>
                            <td>{{ gto.factura || '—' }}</td>
                            <td>{{ gto.ccosto_nombre || '—' }}</td>
                            <td class="td-num">{{ money(gto.total) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <div class="pv-nota">
            <v-icon size="13">mdi-information-outline</v-icon>
            Las filas resaltadas son el 80% de tu gasto (regla de Pareto): son los proveedores donde
            negociar mueve la aguja. "vs anterior" en rojo significa que le estás comprando más que antes.
          </div>
        </div>

        <!-- EVOLUCIÓN MENSUAL TOP 8 -->
        <div class="pv-card" v-if="data.meses.length > 1">
          <div class="pv-card-head">
            <v-icon size="16" color="#b45309">mdi-chart-line</v-icon>
            Evolución mensual — top 8 proveedores
          </div>
          <div class="pv-table-scroll">
            <table class="pv-table">
              <thead>
                <tr>
                  <th class="th-nom">PROVEEDOR</th>
                  <th v-for="m in data.meses" :key="m" class="th-num">{{ mesLabel(m) }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in data.proveedores.slice(0, 8)" :key="p.proveedor">
                  <td class="td-nom">{{ p.proveedor_nombre }}</td>
                  <td v-for="(v, idx) in p.serie" :key="idx" class="td-num"
                      :style="`opacity:${v > 0 ? 1 : 0.25}`">
                    {{ v > 0 ? money(v) : '—' }}
                  </td>
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
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const empresa = computed(() => authStore.empresa || authStore.user?.empresa || localStorage.getItem('empresaActual') || '')

const loading = ref(false)
const data = ref(null)
const expandido = ref(null)
function toggleExpand(proveedor) {
  expandido.value = expandido.value === proveedor ? null : proveedor
}

function haceMeses(n) {
  const d = new Date(); d.setMonth(d.getMonth() - n + 1); d.setDate(1)
  return d.toISOString().slice(0, 10)
}
const desde = ref(haceMeses(6))
const hasta = ref(new Date().toISOString().slice(0, 10))

const k = computed(() => data.value?.kpis || {})

function money(v) {
  if (v === null || v === undefined) return '—'
  return '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function pct(v) {
  if (v === null || v === undefined) return '—'
  return Number(v).toFixed(1) + '%'
}
function fecha(f) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
}
function mesLabel(m) {
  const [y, mm] = m.split('-')
  const MESES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']
  return `${MESES[parseInt(mm) - 1]} ${y.slice(2)}`
}
function colorConc(v) {
  if (v === null || v === undefined) return 'inherit'
  return v >= 40 ? '#ef4444' : v >= 25 ? '#f59e0b' : '#22c55e'
}
function colorNivel(n) {
  return n === 'ALTA' ? '#ef4444' : n === 'MEDIA' ? '#f59e0b' : '#22c55e'
}

async function cargar() {
  loading.value = true
  try {
    const r = await api.get('/gerencia/analisis-proveedores', {
      params: { empresa: empresa.value, desde: desde.value, hasta: hasta.value },
    })
    data.value = r.data
  } catch (e) {
    console.error('Error cargando análisis de proveedores:', e)
    data.value = null
  } finally {
    loading.value = false
  }
}

onMounted(cargar)
</script>

<style scoped>
.pv-wrap { display: flex; flex-direction: column; gap: 16px; }

.pv-breadcrumb { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; }
.bc-root { color: #b45309; text-transform: uppercase; }
.bc-sep, .bc-cat { color: rgba(var(--v-theme-on-surface), 0.35); text-transform: uppercase; }
.bc-current { color: rgba(var(--v-theme-on-surface), 0.55); text-transform: uppercase; }

.pv-header {
  display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  padding: 18px 22px; background: rgb(var(--v-theme-surface));
  border-radius: 14px; border-left: 4px solid #b45309;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.pv-header-left { display: flex; align-items: center; gap: 14px; }
.pv-icon-wrap {
  width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0;
  background: linear-gradient(135deg, #b45309, #92400e);
  display: flex; align-items: center; justify-content: center;
}
.pv-title { font-size: 17px; font-weight: 800; letter-spacing: 0.6px; line-height: 1.2; }
.pv-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.45); margin-top: 2px; }
.pv-header-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.pv-fechas { display: flex; align-items: center; gap: 6px; }
.pv-date {
  height: 34px; padding: 0 10px; border-radius: 8px; font-size: 12px; outline: none;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.2);
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: rgb(var(--v-theme-on-surface));
}
.pv-date-sep { color: rgba(var(--v-theme-on-surface), 0.35); font-size: 12px; }

.pv-loading, .pv-empty {
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  padding: 60px 20px; color: rgba(var(--v-theme-on-surface), 0.4); font-size: 13px;
}

.pv-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr)); gap: 12px; }
.pv-kpi {
  position: relative; overflow: hidden;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-radius: 12px; padding: 16px 18px;
}
.pv-kpi-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
.pv-kpi-lbl { font-size: 10px; font-weight: 800; letter-spacing: 0.7px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface), 0.45); }
.pv-kpi-val { font-size: 22px; font-weight: 800; margin-top: 4px; font-variant-numeric: tabular-nums; }
.pv-kpi-foot { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.4); margin-top: 2px; }

.pv-alerta {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 13px 18px; border-radius: 11px; font-size: 12.5px; line-height: 1.55;
  background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.2);
  color: rgba(var(--v-theme-on-surface), 0.8);
}
.pv-alerta--info { background: rgba(245,158,11,0.07); border-color: rgba(245,158,11,0.2); }

.pv-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-radius: 14px; overflow: hidden;
}
.pv-card-head {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 13px 18px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  font-size: 11px; font-weight: 800; letter-spacing: 0.7px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
.pv-card-note { font-weight: 500; text-transform: none; letter-spacing: 0; color: rgba(var(--v-theme-on-surface), 0.35); }

.pv-table-scroll { overflow-x: auto; }
.pv-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.pv-table th {
  padding: 10px 13px; font-size: 10px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.45);
  border-bottom: 1.5px solid rgba(var(--v-theme-on-surface), 0.1);
  background: rgba(var(--v-theme-on-surface), 0.03);
  white-space: nowrap;
}
.th-rank { width: 40px; text-align: center; }
.th-nom { text-align: left; min-width: 180px; }
.th-num { text-align: right; }

.pv-table td { padding: 9px 13px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.04); }
.td-rank { text-align: center; font-weight: 700; color: rgba(var(--v-theme-on-surface), 0.35); }
.td-nom { font-weight: 600; }
.td-num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.td-total { font-weight: 800; }
.td-acum { color: rgba(var(--v-theme-on-surface), 0.45); font-size: 11px; }

.fila-pareto { background: rgba(180,83,9,0.045); }
.fila-pareto .td-nom { color: #b45309; }

.pv-tr-click { cursor: pointer; }
.pv-tr-click:hover { background: rgba(180,83,9,0.06); }
.pv-expand-icon { transition: transform 0.15s ease-out; color: rgba(var(--v-theme-on-surface), 0.4); }
.pv-expand-icon--open { transform: rotate(90deg); color: #b45309; }

.pv-tr-detalle { background: rgba(var(--v-theme-on-surface), 0.02); }
.pv-tr-detalle td { padding: 0; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07); }
.pv-detalle-vacio { padding: 14px 18px 14px 46px; font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.4); }
.pv-subtable { width: 100%; border-collapse: collapse; font-size: 12px; }
.pv-subtable th {
  padding: 7px 13px 7px 46px; font-size: 9.5px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.4);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.pv-subtable th.th-num, .pv-subtable td.td-num { padding-left: 13px; }
.pv-subtable td { padding: 7px 13px 7px 46px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.04); color: rgba(var(--v-theme-on-surface), 0.75); }
.pv-subtable tbody tr:last-child td { border-bottom: none; }

.pv-bar-wrap { position: relative; display: flex; align-items: center; justify-content: flex-end; gap: 7px; }
.pv-bar {
  position: absolute; right: 100%; margin-right: 7px; height: 5px; border-radius: 3px;
  background: linear-gradient(90deg, rgba(180,83,9,0.35), #b45309);
  max-width: 90px;
}
.pv-chip-sedes {
  font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; margin-left: 6px;
  background: rgba(14,165,233,0.13); color: #0ea5e9; letter-spacing: 0.3px;
}
.pv-chip-inactivo {
  font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; margin-left: 6px;
  background: rgba(245,158,11,0.15); color: #f59e0b;
}
.pv-nuevo {
  font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 4px;
  background: rgba(34,197,94,0.13); color: #22c55e; letter-spacing: 0.4px;
}

.pv-nota {
  display: flex; align-items: flex-start; gap: 7px;
  padding: 11px 18px; font-size: 11px; line-height: 1.5;
  color: rgba(var(--v-theme-on-surface), 0.45);
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.05);
}
</style>
