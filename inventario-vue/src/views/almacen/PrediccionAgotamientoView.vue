<template>
  <MainLayout>
    <div class="pa-container">
      <!-- BREADCRUMB -->
      <div class="pa-breadcrumb">
        <span class="bc-root">ALMACÉN</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Predicción Agotamiento</span>
      </div>

      <!-- HEADER -->
      <div class="pa-header">
        <div class="pa-header-left">
          <div class="pa-icon-wrap"><v-icon size="22" color="white">mdi-chart-line</v-icon></div>
          <div>
            <h1 class="pa-title">PREDICCIÓN DE AGOTAMIENTO</h1>
            <p class="pa-sub">Cuándo se acabará el stock de cada producto en bodega maestra</p>
          </div>
        </div>
        <div class="pa-header-right">
          <span class="pa-vent-lbl">Analizar consumo de:</span>
          <div class="pa-vent-group">
            <button
              v-for="opt in opcionesDias"
              :key="opt"
              :class="['pa-vent-btn', { active: ventanaDias === opt }]"
              @click="cambiarVentana(opt)"
            >{{ opt }} días</button>
          </div>
        </div>
      </div>

      <!-- KPIs -->
      <div class="pa-kpi-row">
        <div class="pa-kpi" style="--kc:#dc2626">
          <v-icon size="18" color="#dc2626">mdi-alert-circle-outline</v-icon>
          <div><div class="kpi-val">{{ enPeligro }}</div><div class="kpi-lbl">EN PELIGRO (< 7 DÍAS)</div></div>
        </div>
        <div class="pa-kpi" style="--kc:#f59e0b">
          <v-icon size="18" color="#f59e0b">mdi-alert-outline</v-icon>
          <div><div class="kpi-val">{{ enAlerta }}</div><div class="kpi-lbl">EN ALERTA (7-14 DÍAS)</div></div>
        </div>
        <div class="pa-kpi" style="--kc:#10b981">
          <v-icon size="18" color="#10b981">mdi-check-circle-outline</v-icon>
          <div><div class="kpi-val">{{ enOk }}</div><div class="kpi-lbl">SIN PELIGRO (> 14 DÍAS)</div></div>
        </div>
      </div>

      <!-- TABLA -->
      <div class="pa-tabla-wrap" v-if="!cargando">
        <table class="pa-table">
          <thead>
            <tr>
              <th style="width:90px">CÓDIGO</th>
              <th>PRODUCTO</th>
              <th style="width:60px;text-align:center">UND</th>
              <th style="width:80px;text-align:right">STOCK</th>
              <th style="width:100px;text-align:center">CONSUMO DIARIO</th>
              <th style="width:160px;text-align:center">CONSUMO POR DÍA SEM.</th>
              <th style="width:120px;text-align:center">FECHA AGOTAMIENTO</th>
              <th style="width:70px;text-align:center">DÍAS</th>
              <th style="width:80px;text-align:center">ESTADO</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in datos"
              :key="p.codigo"
              :class="`pa-row pa-row-${p.alerta.toLowerCase()} pa-row-click`"
              @click="abrirDetalle(p)"
            >
              <td class="pa-codigo">{{ p.codigo }}</td>
              <td class="pa-nombre">{{ p.nombre }}</td>
              <td class="pa-und">{{ p.und }}</td>
              <td class="pa-stock">{{ parseFloat(p.stock_actual).toFixed(2) }}</td>
              <td class="pa-consumo">{{ p.consumo_diario_estimado }}</td>
              <td class="pa-semana">
                <div class="sem-bars" v-if="p.consumo_por_dia">
                  <div
                    v-for="(val, i) in p.consumo_por_dia"
                    :key="i"
                    class="sem-col"
                    :title="`${diasSem[i]}: ${val}`"
                  >
                    <div class="sem-bar-track">
                      <div
                        class="sem-bar-fill"
                        :class="{ 'sem-fin-semana': i === 5 || i === 6 }"
                        :style="{ height: barH(val, p.consumo_por_dia) + '%' }"
                      ></div>
                    </div>
                    <span class="sem-lbl">{{ diasSemCorto[i] }}</span>
                  </div>
                </div>
                <span v-else class="sem-vacio">—</span>
              </td>
              <td class="pa-fecha">
                <span v-if="p.fecha_agotamiento" class="fecha-badge">{{ fmtFecha(p.fecha_agotamiento) }}</span>
                <span v-else class="fecha-ok">∞</span>
              </td>
              <td class="pa-dias">
                <span v-if="p.dias_restantes" :class="`dias-badge dias-${p.alerta.toLowerCase()}`">{{ p.dias_restantes }}</span>
                <span v-else class="dias-ok">∞</span>
              </td>
              <td class="pa-alerta">
                <span :class="`badge-${p.alerta.toLowerCase()}`">{{ p.alerta }}</span>
              </td>
            </tr>
            <tr v-if="datos.length === 0" class="pa-row-vacio">
              <td colspan="9" style="text-align:center;padding:20px;color:#999">No hay datos para mostrar</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="pa-loading">
        <v-progress-circular indeterminate color="#047857"></v-progress-circular>
        <p>Analizando consumo y calculando predicciones...</p>
      </div>
    </div>

    <!-- POPUP: GRÁFICOS DE CONSUMO -->
    <v-dialog v-model="dlgDetalle" max-width="640" scrollable>
      <v-card v-if="productoDetalle" class="dt-card">
        <div class="dt-header">
          <div class="dt-icon-wrap"><v-icon size="18" color="white">mdi-chart-bar</v-icon></div>
          <div class="dt-title-wrap">
            <div class="dt-title">{{ productoDetalle.nombre }}</div>
            <div class="dt-sub">{{ productoDetalle.codigo }}</div>
          </div>
          <v-btn icon variant="text" size="small" @click="dlgDetalle = false">
            <v-icon size="18" color="white">mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="dt-body">
          <div v-if="cargandoDetalle" class="dt-loading">
            <v-progress-circular indeterminate color="#047857" size="28"></v-progress-circular>
            <span>Cargando detalle...</span>
          </div>

          <template v-else>
            <!-- ── GRÁFICO 1: consumo diario de los últimos X días ── -->
            <div class="dt-section-header">
              <span class="dt-section-title">CONSUMO DIARIO DE LOS ÚLTIMOS {{ ventanaDias }} DÍAS</span>
              <v-btn size="x-small" variant="tonal" color="#047857" @click="dlgGridDetalle = true">
                <v-icon size="13" class="mr-1">mdi-table</v-icon>
                Ver detalle
              </v-btn>
            </div>
            <div class="dt-chart-wrap">
              <div class="dt-chart-row">
                <!-- Eje Y: escala de cantidades -->
                <div class="dt-y-axis">
                  <span v-for="(lbl, i) in yAxisLabels" :key="i">{{ lbl }}</span>
                </div>
                <!-- Barras -->
                <div class="dt-chart">
                  <div
                    v-for="(d, i) in detalleDias"
                    :key="i"
                    class="dt-bar-col"
                    :title="`${fmtFechaLarga(d.fecha)}: ${d.salida.toFixed(2)}`"
                  >
                    <div class="dt-bar-track">
                      <div
                        class="dt-bar-fill"
                        :class="{ 'dt-bar-hoy': i === detalleDias.length - 1 }"
                        :style="{ height: barHDetalle(d.salida) + '%' }"
                      ></div>
                    </div>
                    <span class="dt-bar-lbl">{{ numeroDia(d.fecha) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- ── GRÁFICO 2: promedio de consumo por día de semana ── -->
            <div class="dt-section-header dt-section-header-2">
              <span class="dt-section-title">PROMEDIO DE CONSUMO POR DÍA DE SEMANA</span>
            </div>
            <div class="dt-chart-wrap">
              <div class="dt-chart-row">
                <div class="dt-y-axis">
                  <span v-for="(lbl, i) in yAxisLabelsSemana" :key="i">{{ lbl }}</span>
                </div>
                <div class="dt-chart dt-chart-semana">
                  <div
                    v-for="(val, i) in (productoDetalle.consumo_por_dia || [0,0,0,0,0,0,0])"
                    :key="i"
                    class="dt-bar-col"
                    :title="`${diasSem[i]}: ${val.toFixed(2)}`"
                  >
                    <div class="dt-bar-track">
                      <div
                        class="dt-bar-fill"
                        :class="{ 'dt-bar-finde': i === 0 || i === 6 }"
                        :style="{ height: barHSemana(val) + '%' }"
                      ></div>
                    </div>
                    <span class="dt-bar-lbl">{{ diasSemCorto[i] }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </v-card>
    </v-dialog>

    <!-- POPUP: GRID DE DETALLE (consumo día a día) -->
    <v-dialog v-model="dlgGridDetalle" max-width="560" scrollable>
      <v-card v-if="productoDetalle" class="dt-card">
        <div class="dt-header">
          <div class="dt-icon-wrap"><v-icon size="18" color="white">mdi-table</v-icon></div>
          <div class="dt-title-wrap">
            <div class="dt-title">{{ productoDetalle.nombre }}</div>
            <div class="dt-sub">{{ productoDetalle.codigo }} · Salidas de los últimos {{ ventanaDias }} días</div>
          </div>
          <v-btn icon variant="text" size="small" @click="dlgGridDetalle = false">
            <v-icon size="18" color="white">mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="dt-body">
          <table class="dt-tabla">
            <thead>
              <tr>
                <th>FECHA</th>
                <th style="text-align:center">DÍA</th>
                <th style="text-align:right">SALIDA</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(d, i) in [...detalleDias].reverse()" :key="i" :class="{ 'dt-fila-vacia': d.salida === 0 }">
                <td>{{ fmtFechaLarga(d.fecha) }}</td>
                <td style="text-align:center">{{ nombreDiaSemana(d.fecha) }}</td>
                <td style="text-align:right" class="dt-val">{{ d.salida.toFixed(2) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" class="dt-total-lbl">TOTAL</td>
                <td style="text-align:right" class="dt-total-val">{{ totalDetalle.toFixed(2) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </v-card>
    </v-dialog>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import MainLayout from '../../components/layouts/MainLayout.vue';
import { useAuthStore } from '../../stores/auth';
import { API_BASE } from '../../utils/constants';

const auth = useAuthStore();
const empresa = computed(() => auth.empresa);
const datos = ref([]);
const cargando = ref(false);
const ventanaDias = ref(30);
const opcionesDias = [15, 30, 60];

// consumo_por_dia viene en orden [dom, lun, mar, mié, jue, vie, sáb]
const diasSem = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const diasSemCorto = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

function barH(val, arr) {
  const max = Math.max(...arr);
  if (!max || max <= 0) return 0;
  const pct = (val / max) * 100;
  return val > 0 && pct < 8 ? 8 : pct; // mínimo visible si hay consumo
}

function cambiarVentana(d) {
  if (ventanaDias.value === d) return;
  ventanaDias.value = d;
  cargar();
}

const enPeligro = computed(() => datos.value.filter(d => d.alerta === 'PELIGRO').length);
const enAlerta = computed(() => datos.value.filter(d => d.alerta === 'ALERTA').length);
const enOk = computed(() => datos.value.filter(d => d.alerta === 'OK').length);

function fmtFecha(f) {
  if (!f) return '—';
  const d = new Date(String(f).substring(0, 10) + 'T12:00:00');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

async function cargar() {
  if (!empresa.value) {
    alert('Empresa no configurada');
    return;
  }

  cargando.value = true;
  try {
    const res = await fetch(`${API_BASE}/almacen/prediccion-agotamiento?empresa=${empresa.value}&dias=${ventanaDias.value}`);
    const json = await res.json();

    if (json.success === false) {
      console.error('Error:', json.error);
      alert('Error al cargar datos: ' + json.error);
      return;
    }

    datos.value = json.data || [];
  } catch (error) {
    console.error('Error:', error);
    alert('Error: ' + error.message);
  } finally {
    cargando.value = false;
  }
}

onMounted(() => {
  cargar();
});

// ─── Popup: detalle de salidas diarias ────────────────────────
const dlgDetalle = ref(false);
const dlgGridDetalle = ref(false);
const productoDetalle = ref(null);
const detalleDias = ref([]);
const cargandoDetalle = ref(false);

const totalDetalle = computed(() => detalleDias.value.reduce((s, d) => s + d.salida, 0));

async function abrirDetalle(p) {
  productoDetalle.value = p;
  dlgDetalle.value = true;
  cargandoDetalle.value = true;
  detalleDias.value = [];
  try {
    const res = await fetch(`${API_BASE}/almacen/prediccion-agotamiento/detalle?empresa=${empresa.value}&codigo=${encodeURIComponent(p.codigo)}&dias=${ventanaDias.value}`);
    const json = await res.json();
    if (json.success === false) {
      console.error('Error:', json.error);
      alert('Error al cargar detalle: ' + json.error);
      return;
    }
    detalleDias.value = json.data || [];
  } catch (error) {
    console.error('Error:', error);
    alert('Error: ' + error.message);
  } finally {
    cargandoDetalle.value = false;
  }
}

function maxSalidaDetalle() {
  const max = Math.max(...detalleDias.value.map(d => d.salida));
  return !max || max <= 0 ? 0 : max;
}

function barHDetalle(val) {
  const max = maxSalidaDetalle();
  if (!max) return 0;
  const pct = (val / max) * 100;
  return val > 0 && pct < 6 ? 6 : pct;
}

// ── Gráfico 2: promedio de consumo por día de semana ──
function maxSemana() {
  const arr = productoDetalle.value?.consumo_por_dia || [];
  const max = Math.max(...arr);
  return !max || max <= 0 ? 0 : max;
}

function barHSemana(val) {
  const max = maxSemana();
  if (!max) return 0;
  const pct = (val / max) * 100;
  return val > 0 && pct < 6 ? 6 : pct;
}

const yAxisLabelsSemana = computed(() => {
  const max = maxSemana();
  const pasos = 4;
  const labels = [];
  for (let i = pasos; i >= 0; i--) {
    labels.push((max * i / pasos).toFixed(1));
  }
  return labels;
});

// Etiquetas del eje Y: 5 escalones de 0 al máximo, de arriba (mayor) a abajo (0)
const yAxisLabels = computed(() => {
  const max = maxSalidaDetalle();
  const pasos = 4;
  const labels = [];
  for (let i = pasos; i >= 0; i--) {
    labels.push((max * i / pasos).toFixed(0));
  }
  return labels;
});

function numeroDia(f) {
  const d = new Date(f + 'T12:00:00');
  return d.getDate();
}

function fmtFechaLarga(f) {
  const d = new Date(f + 'T12:00:00');
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function nombreDiaSemana(f) {
  const d = new Date(f + 'T12:00:00');
  return diasSem[d.getDay()];
}
</script>

<style scoped>
.pa-container { padding: 24px; max-width: 1400px; margin: 0 auto; }

/* Breadcrumb */
.pa-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 12px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: .5px; }
.bc-sep { color: rgba(var(--v-theme-on-surface),.3); }
.bc-cat { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface),.8); font-weight: 500; }

/* Header */
.pa-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.pa-header-left { display: flex; align-items: center; gap: 16px; }
.pa-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #047857, #10b981); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(4, 120, 87, .35); flex-shrink: 0; }
.pa-title { font-size: 20px; font-weight: 800; letter-spacing: .5px; margin: 0; }
.pa-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), .5); margin: 2px 0 0; }

/* Selector de ventana */
.pa-header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.pa-vent-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface), .4); }
.pa-vent-group { display: inline-flex; background: rgba(var(--v-theme-on-surface), .05); border-radius: 8px; padding: 3px; gap: 2px; }
.pa-vent-btn { border: none; background: transparent; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; color: rgba(var(--v-theme-on-surface), .6); cursor: pointer; transition: all .15s; }
.pa-vent-btn:hover { color: rgba(var(--v-theme-on-surface), .9); }
.pa-vent-btn.active { background: linear-gradient(135deg, #047857, #10b981); color: white; box-shadow: 0 2px 8px rgba(4, 120, 87, .3); }

/* KPIs */
.pa-kpi-row { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.pa-kpi { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface), .08); border-left: 3px solid var(--kc); border-radius: 10px; padding: 14px 18px; display: flex; align-items: center; gap: 12px; flex: 1; min-width: 140px; }
.kpi-val { font-size: 22px; font-weight: 800; line-height: 1; }
.kpi-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface), .5); margin-top: 2px; }

/* Tabla */
.pa-tabla-wrap { background: rgb(var(--v-theme-surface)); border-radius: 12px; border: 1px solid rgba(var(--v-theme-on-surface), .08); overflow: hidden; }
.pa-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 50px; color: rgba(var(--v-theme-on-surface), .5); }
.pa-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.pa-table thead { background: rgba(var(--v-theme-on-surface), .04); }
.pa-table thead th { padding: 12px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; border-bottom: 2px solid rgba(var(--v-theme-on-surface), .1); color: rgba(var(--v-theme-on-surface), .6); }
.pa-table tbody td { padding: 10px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), .04); }

.pa-row { transition: background .15s; }
.pa-row-click { cursor: pointer; }
.pa-row:hover { background: rgba(var(--v-theme-on-surface), .02); }
.pa-row-peligro { background: rgba(220, 38, 38, .03); }
.pa-row-peligro:hover { background: rgba(220, 38, 38, .06); }
.pa-row-alerta { background: rgba(245, 158, 11, .03); }
.pa-row-alerta:hover { background: rgba(245, 158, 11, .06); }
.pa-row-ok { background: rgba(16, 185, 129, .02); }
.pa-row-ok:hover { background: rgba(16, 185, 129, .05); }
.pa-row-vacio { background: transparent !important; }

.pa-codigo { font-family: monospace; font-weight: 600; font-size: 11px; }
.pa-nombre { font-weight: 600; }
.pa-und { text-align: center; font-size: 10px; color: rgba(var(--v-theme-on-surface), .5); }
.pa-stock { text-align: right; font-family: monospace; font-weight: 600; }
.pa-consumo { text-align: center; font-family: monospace; }
.pa-fecha { text-align: center; }

/* Mini-barras consumo por día de semana */
.pa-semana { text-align: center; }
.sem-bars { display: inline-flex; align-items: flex-end; gap: 3px; height: 38px; }
.sem-col { display: flex; flex-direction: column; align-items: center; gap: 2px; width: 15px; }
.sem-bar-track { height: 26px; width: 100%; display: flex; align-items: flex-end; background: rgba(var(--v-theme-on-surface), .05); border-radius: 2px; overflow: hidden; }
.sem-bar-fill { width: 100%; background: #10b981; border-radius: 2px 2px 0 0; transition: height .2s; min-height: 0; }
.sem-bar-fill.sem-fin-semana { background: #f59e0b; }
.sem-lbl { font-size: 8px; font-weight: 700; color: rgba(var(--v-theme-on-surface), .45); }
.sem-vacio { color: rgba(var(--v-theme-on-surface), .3); }
.pa-dias { text-align: center; font-weight: 600; }
.pa-alerta { text-align: center; }

.fecha-badge { display: inline-block; padding: 3px 8px; background: #fee2e2; color: #dc2626; border-radius: 4px; font-weight: 600; font-size: 10px; }
.fecha-ok { color: #10b981; font-weight: 700; }

.dias-badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 11px; }
.dias-peligro { background: #fecaca; color: #dc2626; }
.dias-alerta { background: #fde047; color: #92400e; }
.dias-ok { color: #10b981; font-weight: 700; }

.badge-peligro { display: inline-block; padding: 4px 12px; background: #fecaca; color: #dc2626; border-radius: 20px; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: .3px; }
.badge-alerta { display: inline-block; padding: 4px 12px; background: #fde047; color: #92400e; border-radius: 20px; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: .3px; }
.badge-ok { display: inline-block; padding: 4px 12px; background: #d1fae5; color: #047857; border-radius: 20px; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: .3px; }

/* ── Popup: detalle de salidas diarias ──────────────────────── */
.dt-card { border-radius: 14px; overflow: hidden; }
.dt-header {
  display: flex; align-items: center; gap: 12px; padding: 16px 18px;
  background: linear-gradient(135deg, #047857, #10b981);
}
.dt-icon-wrap {
  width: 36px; height: 36px; border-radius: 10px;
  background: rgba(255,255,255,.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.dt-title-wrap { flex: 1; min-width: 0; }
.dt-title { font-size: 15px; font-weight: 700; color: white; }
.dt-sub { font-size: 11px; color: rgba(255,255,255,.8); margin-top: 2px; }

.dt-body { padding: 18px; }
.dt-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 40px; color: rgba(var(--v-theme-on-surface), .5); }

/* Encabezados de sección dentro del popup de gráficos */
.dt-section-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
.dt-section-header-2 { margin-top: 8px; }
.dt-section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: rgba(var(--v-theme-on-surface), .6); }

/* Gráfico de barras: eje Y (cantidad) + eje X (número de día) */
.dt-chart-wrap { margin-bottom: 20px; }
.dt-chart-row { display: flex; gap: 8px; }
.dt-y-axis {
  display: flex; flex-direction: column; justify-content: space-between;
  height: 110px; padding-bottom: 18px;
  font-size: 9px; font-weight: 600; color: rgba(var(--v-theme-on-surface), .4);
  text-align: right; flex-shrink: 0; min-width: 24px;
}
.dt-chart { display: flex; align-items: flex-end; gap: 3px; height: 128px; overflow-x: auto; padding-bottom: 4px; flex: 1; border-left: 1px solid rgba(var(--v-theme-on-surface), .1); padding-left: 6px; }
.dt-bar-col { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; min-width: 14px; height: 100%; justify-content: flex-end; }
.dt-bar-track { height: 110px; width: 100%; max-width: 16px; display: flex; align-items: flex-end; background: rgba(var(--v-theme-on-surface), .05); border-radius: 2px; overflow: hidden; }
.dt-bar-fill { width: 100%; background: #10b981; border-radius: 2px 2px 0 0; transition: height .2s; min-height: 0; }
.dt-bar-fill.dt-bar-hoy { background: #047857; }
.dt-bar-fill.dt-bar-finde { background: #f59e0b; }
.dt-bar-lbl { font-size: 9px; font-weight: 600; color: rgba(var(--v-theme-on-surface), .5); white-space: nowrap; }
.dt-chart-semana .dt-bar-col { flex: none; width: 13%; }

/* Tabla detalle */
.dt-tabla { width: 100%; border-collapse: collapse; font-size: 12px; }
.dt-tabla thead th { padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .3px; border-bottom: 2px solid rgba(var(--v-theme-on-surface), .1); color: rgba(var(--v-theme-on-surface), .5); }
.dt-tabla tbody td { padding: 7px 10px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), .04); }
.dt-fila-vacia { color: rgba(var(--v-theme-on-surface), .35); }
.dt-val { font-family: monospace; font-weight: 600; }
.dt-tabla tfoot td { padding: 10px; border-top: 2px solid rgba(var(--v-theme-on-surface), .1); font-weight: 700; }
.dt-total-lbl { text-transform: uppercase; font-size: 11px; letter-spacing: .3px; }
.dt-total-val { font-family: monospace; color: #047857; font-size: 13px; }
</style>
