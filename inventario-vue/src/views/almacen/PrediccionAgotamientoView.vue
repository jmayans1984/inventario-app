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
              <th style="width:120px;text-align:center">FECHA AGOTAMIENTO</th>
              <th style="width:70px;text-align:center">DÍAS</th>
              <th style="width:80px;text-align:center">ESTADO</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in datos" :key="p.codigo" :class="`pa-row pa-row-${p.alerta.toLowerCase()}`">
              <td class="pa-codigo">{{ p.codigo }}</td>
              <td class="pa-nombre">{{ p.nombre }}</td>
              <td class="pa-und">{{ p.und }}</td>
              <td class="pa-stock">{{ parseFloat(p.stock_actual).toFixed(2) }}</td>
              <td class="pa-consumo">{{ p.consumo_diario_estimado }}</td>
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
              <td colspan="8" style="text-align:center;padding:20px;color:#999">No hay datos para mostrar</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="pa-loading">
        <v-progress-circular indeterminate color="#047857"></v-progress-circular>
        <p>Analizando consumo y calculando predicciones...</p>
      </div>
    </div>
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
</style>
