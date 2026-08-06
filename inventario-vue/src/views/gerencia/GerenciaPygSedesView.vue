<template>
  <MainLayout>
    <div class="pg-wrap">

      <!-- BREADCRUMB -->
      <div class="pg-breadcrumb">
        <span class="bc-root">GERENCIA</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">P&amp;G por Sede</span>
      </div>

      <!-- HEADER -->
      <div class="pg-header">
        <div class="pg-header-left">
          <div class="pg-icon-wrap">
            <v-icon size="24" color="white">mdi-scale-balance</v-icon>
          </div>
          <div>
            <h1 class="pg-title">P&amp;G COMPARATIVO POR SEDE</h1>
            <p class="pg-sub">Ventas, food cost, labor cost y resultado de cada local, lado a lado</p>
          </div>
        </div>
        <div class="pg-header-right">
          <div class="pg-fechas">
            <input type="date" v-model="desde" class="pg-date" />
            <span class="pg-date-sep">→</span>
            <input type="date" v-model="hasta" class="pg-date" />
          </div>
          <div class="pg-presets">
            <button v-for="p in PRESETS" :key="p.label" class="pg-preset-btn" @click="aplicarPreset(p)">
              {{ p.label }}
            </button>
          </div>
          <v-btn color="#0ea5e9" variant="flat" prepend-icon="mdi-refresh" :loading="loading" rounded="lg" @click="cargar">
            Actualizar
          </v-btn>
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="loading" class="pg-loading">
        <v-progress-circular indeterminate color="#0ea5e9" size="48" />
        <p>Consolidando ventas, recetas, nómina y gastos...</p>
      </div>

      <div v-else-if="!data || !data.sedes.length" class="pg-empty">
        <v-icon size="48" color="rgba(var(--v-theme-on-surface),0.2)">mdi-database-off-outline</v-icon>
        <p>No hay datos en el período seleccionado</p>
      </div>

      <template v-else>

        <!-- KPIs CONSOLIDADOS -->
        <div class="pg-kpis">
          <div class="pg-kpi">
            <div class="pg-kpi-accent" style="background:#22c55e"></div>
            <div class="pg-kpi-body">
              <div class="pg-kpi-lbl">Ventas Netas</div>
              <div class="pg-kpi-val">{{ money(t.ventas_netas) }}</div>
              <div class="pg-kpi-foot">{{ t.num_sedes }} sede(s)</div>
            </div>
          </div>
          <div class="pg-kpi">
            <div class="pg-kpi-accent" style="background:#f59e0b"></div>
            <div class="pg-kpi-body">
              <div class="pg-kpi-lbl">Food Cost</div>
              <div class="pg-kpi-val">{{ pct(t.food_pct) }}</div>
              <div class="pg-kpi-foot">{{ money(t.food_cost) }}</div>
            </div>
          </div>
          <div class="pg-kpi">
            <div class="pg-kpi-accent" style="background:#8b5cf6"></div>
            <div class="pg-kpi-body">
              <div class="pg-kpi-lbl">Labor Cost</div>
              <div class="pg-kpi-val">{{ pct(t.labor_pct) }}</div>
              <div class="pg-kpi-foot">{{ money(t.labor_cost) }}</div>
            </div>
          </div>
          <div class="pg-kpi pg-kpi-destacado">
            <div class="pg-kpi-accent" :style="`background:${colorPrime(t.prime_pct)}`"></div>
            <div class="pg-kpi-body">
              <div class="pg-kpi-lbl">Prime Cost</div>
              <div class="pg-kpi-val" :style="`color:${colorPrime(t.prime_pct)}`">{{ pct(t.prime_pct) }}</div>
              <div class="pg-kpi-foot">Food + Labor · meta &lt; 65%</div>
            </div>
          </div>
          <div class="pg-kpi">
            <div class="pg-kpi-accent" :style="`background:${t.resultado >= 0 ? '#22c55e' : '#ef4444'}`"></div>
            <div class="pg-kpi-body">
              <div class="pg-kpi-lbl">Resultado</div>
              <div class="pg-kpi-val" :style="`color:${t.resultado >= 0 ? '#22c55e' : '#ef4444'}`">
                {{ money(t.resultado) }}
              </div>
              <div class="pg-kpi-foot">{{ pct(t.margen_pct) }} de margen</div>
            </div>
          </div>
        </div>

        <!-- JUEGO DE INVENTARIOS QUE SUSTENTA EL FOOD COST -->
        <div v-if="mp" class="pg-mp">
          <div class="pg-mp-head">
            <v-icon size="15" color="#f59e0b">mdi-calculator-variant-outline</v-icon>
            Costo de materia prima — juego de inventarios
            <span class="pg-mp-note">Misma fórmula del Estado de Resultados</span>
          </div>
          <div class="pg-mp-row">
            <div class="pg-mp-item">
              <span>Inventario inicial</span>
              <strong>{{ money(mp.inventario_inicial) }}</strong>
            </div>
            <span class="pg-mp-op">+</span>
            <div class="pg-mp-item">
              <span>Compras MP<template v-if="mp.cuenta"> (cta. {{ mp.cuenta }})</template></span>
              <strong>{{ money(mp.compras) }}</strong>
            </div>
            <span class="pg-mp-op">−</span>
            <div class="pg-mp-item">
              <span>Inventario final</span>
              <strong>{{ money(mp.inventario_final) }}</strong>
            </div>
            <span class="pg-mp-op">=</span>
            <div class="pg-mp-item pg-mp-item--total">
              <span>Consumo</span>
              <strong>{{ money(mp.consumo) }}</strong>
            </div>
          </div>
          <div class="pg-mp-foot">
            <v-icon size="13">mdi-information-outline</v-icon>
            El consumo se reparte entre sedes en proporción a sus ventas.
            <template v-if="mp.bodega_maestra">
              La bodega maestra ({{ mp.bodega_maestra }}) queda excluida del reparto: es un almacén, no un
              punto de venta.
            </template>
          </div>
        </div>

        <!-- MEJOR / PEOR -->
        <div v-if="t.mejor && t.peor" class="pg-extremos">
          <div class="pg-extremo pg-extremo--bueno">
            <v-icon size="16" color="#22c55e">mdi-trophy-outline</v-icon>
            <span class="pg-extremo-lbl">Mejor margen</span>
            <span class="pg-extremo-nom">{{ t.mejor.nombre }}</span>
            <span class="pg-extremo-val">{{ pct(t.mejor.margen_pct) }}</span>
          </div>
          <div class="pg-extremo pg-extremo--malo">
            <v-icon size="16" color="#ef4444">mdi-alert-outline</v-icon>
            <span class="pg-extremo-lbl">Menor margen</span>
            <span class="pg-extremo-nom">{{ t.peor.nombre }}</span>
            <span class="pg-extremo-val">{{ pct(t.peor.margen_pct) }}</span>
          </div>
        </div>

        <!-- TABLA COMPARATIVA -->
        <div class="pg-card">
          <div class="pg-card-head">
            <v-icon size="16" color="#0ea5e9">mdi-table-large</v-icon>
            Estado de resultados por sede
          </div>
          <div class="pg-table-scroll">
            <table class="pg-table">
              <thead>
                <tr>
                  <th class="th-concepto">CONCEPTO</th>
                  <th v-for="s in data.sedes" :key="s.ccosto" class="th-sede">{{ s.nombre }}</th>
                  <th class="th-total">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                <tr class="fila-ventas">
                  <td class="td-concepto">Ventas netas</td>
                  <td v-for="s in data.sedes" :key="s.ccosto" class="td-num">{{ money(s.ventas_netas) }}</td>
                  <td class="td-num td-total">{{ money(t.ventas_netas) }}</td>
                </tr>

                <tr>
                  <td class="td-concepto td-indent">Food cost</td>
                  <td v-for="s in data.sedes" :key="s.ccosto" class="td-num td-costo">({{ money(s.food_cost) }})</td>
                  <td class="td-num td-costo td-total">({{ money(t.food_cost) }})</td>
                </tr>
                <tr class="fila-pct">
                  <td class="td-concepto td-indent td-pct-lbl">% sobre ventas</td>
                  <td v-for="s in data.sedes" :key="s.ccosto" class="td-num td-pct" :style="`color:${colorFood(s.food_pct)}`">
                    {{ pct(s.food_pct) }}
                  </td>
                  <td class="td-num td-pct td-total">{{ pct(t.food_pct) }}</td>
                </tr>

                <tr>
                  <td class="td-concepto td-indent">Labor cost</td>
                  <td v-for="s in data.sedes" :key="s.ccosto" class="td-num td-costo">({{ money(s.labor_cost) }})</td>
                  <td class="td-num td-costo td-total">({{ money(t.labor_cost) }})</td>
                </tr>
                <tr class="fila-pct">
                  <td class="td-concepto td-indent td-pct-lbl">% sobre ventas</td>
                  <td v-for="s in data.sedes" :key="s.ccosto" class="td-num td-pct" :style="`color:${colorLabor(s.labor_pct)}`">
                    {{ pct(s.labor_pct) }}
                  </td>
                  <td class="td-num td-pct td-total">{{ pct(t.labor_pct) }}</td>
                </tr>

                <tr class="fila-subtotal">
                  <td class="td-concepto">Prime cost</td>
                  <td v-for="s in data.sedes" :key="s.ccosto" class="td-num">
                    {{ money(s.prime_cost) }}
                    <span class="td-pct-inline" :style="`color:${colorPrime(s.prime_pct)}`">{{ pct(s.prime_pct) }}</span>
                  </td>
                  <td class="td-num td-total">
                    {{ money(t.prime_cost) }}
                    <span class="td-pct-inline" :style="`color:${colorPrime(t.prime_pct)}`">{{ pct(t.prime_pct) }}</span>
                  </td>
                </tr>

                <tr>
                  <td class="td-concepto td-indent">Gastos operativos</td>
                  <td v-for="s in data.sedes" :key="s.ccosto" class="td-num td-costo">({{ money(s.gastos_operativos) }})</td>
                  <td class="td-num td-costo td-total">({{ money(t.gastos_operativos) }})</td>
                </tr>
                <tr class="fila-pct">
                  <td class="td-concepto td-indent td-pct-lbl">% sobre ventas</td>
                  <td v-for="s in data.sedes" :key="s.ccosto" class="td-num td-pct">{{ pct(s.gastos_pct) }}</td>
                  <td class="td-num td-pct td-total">{{ pct(t.gastos_pct) }}</td>
                </tr>

                <tr class="fila-resultado">
                  <td class="td-concepto">RESULTADO</td>
                  <td v-for="s in data.sedes" :key="s.ccosto" class="td-num"
                      :style="`color:${s.resultado >= 0 ? '#22c55e' : '#ef4444'}`">
                    {{ money(s.resultado) }}
                  </td>
                  <td class="td-num td-total" :style="`color:${t.resultado >= 0 ? '#22c55e' : '#ef4444'}`">
                    {{ money(t.resultado) }}
                  </td>
                </tr>
                <tr class="fila-pct fila-margen">
                  <td class="td-concepto td-pct-lbl">Margen %</td>
                  <td v-for="s in data.sedes" :key="s.ccosto" class="td-num td-pct"
                      :style="`color:${s.margen_pct >= 0 ? '#22c55e' : '#ef4444'}`">
                    {{ pct(s.margen_pct) }}
                  </td>
                  <td class="td-num td-pct td-total">{{ pct(t.margen_pct) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="pg-nota">
            <v-icon size="13">mdi-information-outline</v-icon>
            <span>
              El food cost sale del juego de inventarios (igual que el Estado de Resultados) y el labor
              cost de las liquidaciones de nómina. Por eso los gastos operativos excluyen
              <template v-if="data.excluye_cuenta_mp">la cuenta de materia prima ({{ data.excluye_cuenta_mp }})</template>
              <template v-if="data.excluye_cuenta_mp && data.excluye_cuenta_nomina"> y </template>
              <template v-if="data.excluye_cuenta_nomina">la cuenta de nómina ({{ data.excluye_cuenta_nomina }})</template>:
              si se dejaran, ese gasto se contaría dos veces. Solo se suman grupos contables de tipo EGRESO.
            </span>
          </div>
        </div>

        <!-- OPERACIÓN -->
        <div class="pg-card">
          <div class="pg-card-head">
            <v-icon size="16" color="#0ea5e9">mdi-store-outline</v-icon>
            Indicadores de operación
          </div>
          <div class="pg-table-scroll">
            <table class="pg-table pg-table-op">
              <thead>
                <tr>
                  <th class="th-concepto">SEDE</th>
                  <th>DÍAS OPERADOS</th>
                  <th>VENTA / DÍA</th>
                  <th>HORAS NÓMINA</th>
                  <th>VENTA / HORA</th>
                  <th>UNIDADES VENDIDAS</th>
                  <th>PLATOS DISTINTOS</th>
                  <th>VENTA DESGLOSADA</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in data.sedes" :key="s.ccosto">
                  <td class="td-concepto">{{ s.nombre }}</td>
                  <td class="td-num">{{ s.dias_operados }}</td>
                  <td class="td-num">{{ money(s.venta_dia) }}</td>
                  <td class="td-num">{{ num(s.horas) }}</td>
                  <td class="td-num">{{ money(s.venta_hora) }}</td>
                  <td class="td-num">{{ num(s.unidades_vendidas) }}</td>
                  <td class="td-num">{{ s.platos_distintos }}</td>
                  <td class="td-num" :style="`color:${colorCobertura(s.cobertura_detalle_pct)}`">
                    {{ pct(s.cobertura_detalle_pct) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- DESGLOSE DE GASTOS -->
        <div class="pg-card" v-if="gruposGasto.length">
          <div class="pg-card-head">
            <v-icon size="16" color="#0ea5e9">mdi-format-list-bulleted</v-icon>
            Gastos operativos por grupo
          </div>
          <div class="pg-table-scroll">
            <table class="pg-table">
              <thead>
                <tr>
                  <th class="th-concepto">GRUPO</th>
                  <th v-for="s in data.sedes" :key="s.ccosto" class="th-sede">{{ s.nombre }}</th>
                  <th class="th-total">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="g in gruposGasto" :key="g">
                  <td class="td-concepto">{{ g }}</td>
                  <td v-for="s in data.sedes" :key="s.ccosto" class="td-num">
                    {{ s.gastos_por_grupo[g] ? money(s.gastos_por_grupo[g]) : '—' }}
                  </td>
                  <td class="td-num td-total">{{ money(totalGrupo(g)) }}</td>
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

function primerDiaMes() {
  const d = new Date(); d.setDate(1)
  return d.toISOString().slice(0, 10)
}
const desde = ref(primerDiaMes())
const hasta = ref(new Date().toISOString().slice(0, 10))

const PRESETS = [
  { label: 'Este mes', meses: 0 },
  { label: 'Mes pasado', mesPasado: true },
  { label: '3 meses', meses: 3 },
  { label: '12 meses', meses: 12 },
]

function aplicarPreset(p) {
  const hoy = new Date()
  if (p.mesPasado) {
    const ini = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
    desde.value = ini.toISOString().slice(0, 10)
    hasta.value = fin.toISOString().slice(0, 10)
  } else if (p.meses === 0) {
    desde.value = primerDiaMes()
    hasta.value = hoy.toISOString().slice(0, 10)
  } else {
    const ini = new Date(hoy.getFullYear(), hoy.getMonth() - p.meses + 1, 1)
    desde.value = ini.toISOString().slice(0, 10)
    hasta.value = hoy.toISOString().slice(0, 10)
  }
  cargar()
}

const t = computed(() => data.value?.totales || {})
const mp = computed(() => data.value?.materia_prima || null)

const gruposGasto = computed(() => {
  if (!data.value) return []
  const set = new Set()
  for (const s of data.value.sedes) Object.keys(s.gastos_por_grupo || {}).forEach(g => set.add(g))
  return [...set].sort((a, b) => totalGrupo(b) - totalGrupo(a))
})

function totalGrupo(g) {
  if (!data.value) return 0
  return data.value.sedes.reduce((s, sede) => s + (sede.gastos_por_grupo?.[g] || 0), 0)
}

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
  return Number(v).toLocaleString('en-US', { maximumFractionDigits: 1 })
}

// Umbrales de referencia de la industria restaurantera
function colorFood(v) {
  if (v === null) return 'inherit'
  return v <= 30 ? '#22c55e' : v <= 35 ? '#f59e0b' : '#ef4444'
}
function colorLabor(v) {
  if (v === null) return 'inherit'
  return v <= 30 ? '#22c55e' : v <= 35 ? '#f59e0b' : '#ef4444'
}
function colorPrime(v) {
  if (v === null) return 'inherit'
  return v <= 60 ? '#22c55e' : v <= 65 ? '#f59e0b' : '#ef4444'
}
// Cuanto menos venta llegue desglosada, menos confiable es el food cost
function colorCobertura(v) {
  if (v === null || v === undefined) return 'inherit'
  return v >= 97 ? '#22c55e' : v >= 90 ? '#f59e0b' : '#ef4444'
}

async function cargar() {
  loading.value = true
  try {
    const r = await api.get('/gerencia/pyg-sedes', {
      params: { empresa: empresa.value, desde: desde.value, hasta: hasta.value },
    })
    data.value = r.data
  } catch (e) {
    console.error('Error cargando P&G por sede:', e)
    data.value = null
  } finally {
    loading.value = false
  }
}

onMounted(cargar)
</script>

<style scoped>
.pg-wrap { display: flex; flex-direction: column; gap: 16px; }

.pg-breadcrumb { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; }
.bc-root { color: #0ea5e9; text-transform: uppercase; }
.bc-sep, .bc-cat { color: rgba(var(--v-theme-on-surface), 0.35); text-transform: uppercase; }
.bc-current { color: rgba(var(--v-theme-on-surface), 0.55); text-transform: uppercase; }

.pg-header {
  display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  padding: 18px 22px; background: rgb(var(--v-theme-surface));
  border-radius: 14px; border-left: 4px solid #0ea5e9;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.pg-header-left { display: flex; align-items: center; gap: 14px; }
.pg-icon-wrap {
  width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0;
  background: linear-gradient(135deg, #0ea5e9, #0369a1);
  display: flex; align-items: center; justify-content: center;
}
.pg-title { font-size: 17px; font-weight: 800; letter-spacing: 0.6px; line-height: 1.2; }
.pg-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.45); margin-top: 2px; }
.pg-header-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.pg-fechas { display: flex; align-items: center; gap: 6px; }
.pg-date {
  height: 34px; padding: 0 10px; border-radius: 8px; font-size: 12px; outline: none;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.2);
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: rgb(var(--v-theme-on-surface));
}
.pg-date-sep { color: rgba(var(--v-theme-on-surface), 0.35); font-size: 12px; }

.pg-presets { display: flex; gap: 4px; }
.pg-preset-btn {
  padding: 6px 11px; border-radius: 7px; font-size: 11px; font-weight: 700; cursor: pointer;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.15);
  background: transparent; color: rgba(var(--v-theme-on-surface), 0.6);
  transition: all 0.15s;
}
.pg-preset-btn:hover { border-color: #0ea5e9; color: #0ea5e9; background: rgba(14,165,233,0.07); }

.pg-loading, .pg-empty {
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  padding: 60px 20px; color: rgba(var(--v-theme-on-surface), 0.4); font-size: 13px;
}

/* KPIs */
.pg-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
.pg-kpi {
  position: relative; overflow: hidden;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-radius: 12px; padding: 16px 18px;
}
.pg-kpi-destacado { border-color: rgba(14,165,233,0.3); }
.pg-kpi-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
.pg-kpi-lbl { font-size: 10px; font-weight: 800; letter-spacing: 0.7px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface), 0.45); }
.pg-kpi-val { font-size: 22px; font-weight: 800; margin-top: 4px; font-variant-numeric: tabular-nums; }
.pg-kpi-foot { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.4); margin-top: 2px; }

/* Aviso de datos inconsistentes */
.pg-aviso {
  display: flex; align-items: flex-start; gap: 11px;
  padding: 14px 18px; border-radius: 11px; font-size: 12.5px; line-height: 1.6;
  background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.22);
  color: rgba(var(--v-theme-on-surface), 0.8);
}
.pg-aviso--warn { background: rgba(245,158,11,0.07); border-color: rgba(245,158,11,0.22); }

/* Juego de inventarios */
.pg-mp {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-left: 3px solid #f59e0b;
  border-radius: 12px; overflow: hidden;
}
.pg-mp-head {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 12px 18px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  font-size: 11px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
.pg-mp-note { font-weight: 500; text-transform: none; letter-spacing: 0; color: rgba(var(--v-theme-on-surface), 0.35); }
.pg-mp-row {
  display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  padding: 14px 18px;
}
.pg-mp-item { display: flex; flex-direction: column; gap: 2px; min-width: 120px; }
.pg-mp-item span {
  font-size: 10px; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.4);
}
.pg-mp-item strong { font-size: 15px; font-variant-numeric: tabular-nums; }
.pg-mp-item--total strong { color: #f59e0b; font-size: 17px; font-weight: 800; }
.pg-mp-op { font-size: 17px; font-weight: 700; color: rgba(var(--v-theme-on-surface), 0.3); }
.pg-mp-foot {
  display: flex; align-items: flex-start; gap: 7px;
  padding: 10px 18px; font-size: 11px; line-height: 1.5;
  color: rgba(var(--v-theme-on-surface), 0.45);
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.05);
}

/* Extremos */
.pg-extremos { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
.pg-extremo {
  display: flex; align-items: center; gap: 8px; padding: 11px 16px; border-radius: 10px; font-size: 12px;
}
.pg-extremo--bueno { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); }
.pg-extremo--malo  { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); }
.pg-extremo-lbl { color: rgba(var(--v-theme-on-surface), 0.5); font-weight: 600; }
.pg-extremo-nom { font-weight: 800; }
.pg-extremo-val { margin-left: auto; font-weight: 800; font-variant-numeric: tabular-nums; }

/* Card / tabla */
.pg-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-radius: 14px; overflow: hidden;
}
.pg-card-head {
  display: flex; align-items: center; gap: 8px;
  padding: 13px 18px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  font-size: 11px; font-weight: 800; letter-spacing: 0.7px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
.pg-table-scroll { overflow-x: auto; }
.pg-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.pg-table th {
  padding: 10px 14px; font-size: 10px; font-weight: 800; letter-spacing: 0.7px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.45);
  border-bottom: 1.5px solid rgba(var(--v-theme-on-surface), 0.1);
  background: rgba(var(--v-theme-on-surface), 0.03);
  white-space: nowrap;
}
.th-concepto { text-align: left; min-width: 170px; }
.th-sede, .th-total { text-align: right; min-width: 120px; }
.th-total { color: #0ea5e9; }

.pg-table td { padding: 9px 14px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.04); }
.td-concepto { font-weight: 600; white-space: nowrap; }
.td-indent { padding-left: 28px !important; font-weight: 500; color: rgba(var(--v-theme-on-surface), 0.75); }
.td-num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.td-costo { color: rgba(var(--v-theme-on-surface), 0.7); }
.td-total { font-weight: 800; background: rgba(14,165,233,0.04); }

.fila-ventas td { font-weight: 700; background: rgba(34,197,94,0.05); }
.fila-pct td { padding-top: 0; padding-bottom: 7px; border-bottom: none; }
.td-pct-lbl { font-size: 10px; color: rgba(var(--v-theme-on-surface), 0.35); font-weight: 500; text-transform: uppercase; letter-spacing: 0.4px; }
.td-pct { font-size: 11px; font-weight: 700; }
.td-pct-inline { font-size: 11px; font-weight: 700; margin-left: 7px; }

.fila-subtotal td { font-weight: 800; background: rgba(139,92,246,0.06); border-top: 1px solid rgba(var(--v-theme-on-surface), 0.1); }
.fila-resultado td {
  font-weight: 900; font-size: 14px;
  border-top: 2px solid rgba(var(--v-theme-on-surface), 0.15);
  background: rgba(var(--v-theme-on-surface), 0.03);
}
.fila-margen td { background: rgba(var(--v-theme-on-surface), 0.03); padding-bottom: 11px; }

.pg-nota {
  display: flex; align-items: flex-start; gap: 7px;
  padding: 11px 18px; font-size: 11px; line-height: 1.5;
  color: rgba(var(--v-theme-on-surface), 0.45);
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.05);
}

.pg-table-op th:not(.th-concepto) { text-align: right; }
</style>
