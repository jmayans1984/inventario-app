<template>
  <MainLayout>
    <div class="vv-wrap">

      <PageHeader
        title="Ventas en Vivo"
        description="Ventas y consumo de inventario en tiempo real desde Square"
        :crumbs="['Tesorería', 'Procesos', 'Ventas en Vivo']"
      >
        <template #actions>
          <span class="vv-estado" :class="'vv-estado-' + conexion">
            <span class="vv-punto"></span>
            {{ textoConexion }}
          </span>
        </template>
      </PageHeader>

      <!-- Sin configurar -->
      <div v-if="datos && !datos.configurado" class="vv-aviso">
        <v-icon size="20" color="var(--warning)">mdi-alert-outline</v-icon>
        <div>
          <strong>La conexión con Square todavía no está configurada.</strong>
          Falta definir las variables de entorno en el servidor y registrar la URL del webhook
          en el panel de desarrollador de Square. Mientras tanto esta pantalla no recibirá ventas.
        </div>
      </div>

      <!-- Sedes sin asociar -->
      <div v-if="sedesSinAsociar.length" class="vv-aviso">
        <v-icon size="20" color="var(--warning)">mdi-store-off-outline</v-icon>
        <div>
          Estas sedes no tienen asociado su identificador de Square, así que sus ventas no se
          podrán atribuir: <strong>{{ sedesSinAsociar.map(s => s.nombre).join(', ') }}</strong>.
        </div>
      </div>

      <!-- Totales del día -->
      <div class="vv-kpis">
        <KpiCard :index="0" label="Ventas de hoy" :value="fmt(totales.ventas)"
          icon="mdi-cash-multiple" color="var(--success)" value-color="var(--success)" />
        <KpiCard :index="1" label="Órdenes" :value="String(totales.ordenes)"
          icon="mdi-receipt-text-outline" color="var(--indigo)" />
        <KpiCard :index="2" label="Artículos vendidos" :value="num(totales.articulos)"
          icon="mdi-package-variant" color="var(--gold)" />
        <KpiCard :index="3" label="Insumos afectados" :value="String(consumo.length)"
          icon="mdi-fire" color="var(--warning)" />
      </div>

      <div class="vv-cols">

        <!-- Órdenes que van entrando -->
        <div class="vv-card">
          <div class="vv-card-hdr">
            <v-icon size="16" color="var(--indigo)">mdi-timeline-clock-outline</v-icon>
            <span class="vv-card-ttl">ÓRDENES RECIENTES</span>
            <span class="vv-card-sub">{{ ordenes.length }} en pantalla</span>
          </div>

          <div v-if="!ordenes.length" class="vv-vacio">
            <v-icon size="38" color="rgba(var(--v-theme-on-surface),.15)">mdi-clock-outline</v-icon>
            <p>Esperando la primera venta del día…</p>
          </div>

          <TransitionGroup v-else name="vv-lista" tag="div" class="vv-ordenes">
            <div v-for="o in ordenes" :key="o.id" class="vv-orden" :class="{ 'vv-orden-cancelada': o.estado === 'CANCELED' }">
              <div class="vv-orden-top">
                <span class="vv-sede-chip">{{ o.sede }}</span>
                <span class="vv-hora">{{ hora(o.creada) }}</span>
                <v-spacer />
                <span class="vv-orden-total">{{ fmt(o.total) }}</span>
              </div>
              <div class="vv-orden-items">
                <span v-for="(it, i) in o.items" :key="i" class="vv-item">
                  {{ num(it.cantidad) }}× {{ it.nombre }}
                  <span v-if="it.variante" class="vv-item-var">{{ it.variante }}</span>
                </span>
              </div>
              <div v-if="o.estado === 'CANCELED'" class="vv-cancelada-tag">Cancelada — no cuenta en los totales</div>
            </div>
          </TransitionGroup>
        </div>

        <div class="vv-col-der">

          <!-- Por sede -->
          <div class="vv-card">
            <div class="vv-card-hdr">
              <v-icon size="16" color="var(--success)">mdi-store-outline</v-icon>
              <span class="vv-card-ttl">POR SEDE</span>
            </div>
            <div v-if="!sedes.length" class="vv-vacio vv-vacio-sm">
              <p>Sin ventas todavía</p>
            </div>
            <div v-else class="vv-sedes">
              <div v-for="s in sedes" :key="s.codigo" class="vv-sede">
                <div class="vv-sede-fila">
                  <span class="vv-sede-nom">{{ s.nombre }}</span>
                  <span class="vv-sede-val">{{ fmt(s.ventas) }}</span>
                </div>
                <div class="vv-barra">
                  <div class="vv-barra-fill" :style="{ width: pctSede(s) + '%' }"></div>
                </div>
                <div class="vv-sede-meta">
                  {{ s.ordenes }} órden{{ s.ordenes !== 1 ? 'es' : '' }} · {{ num(s.articulos) }} artículos
                </div>
              </div>
            </div>
          </div>

          <!-- Consumo de inventario -->
          <div class="vv-card">
            <div class="vv-card-hdr">
              <v-icon size="16" color="var(--warning)">mdi-fire</v-icon>
              <span class="vv-card-ttl">CONSUMO DE INVENTARIO</span>
              <span class="vv-card-sub">estimado</span>
            </div>
            <div v-if="!consumo.length" class="vv-vacio vv-vacio-sm">
              <p>Sin consumo calculado</p>
            </div>
            <div v-else class="vv-tabla-wrap">
              <table class="vv-tabla">
                <thead>
                  <tr><th>ARTÍCULO</th><th class="r">CANTIDAD</th><th>UND</th></tr>
                </thead>
                <tbody>
                  <tr v-for="c in consumo" :key="c.codigo">
                    <td>{{ c.nombre }}</td>
                    <td class="r b">{{ num(c.cantidad) }}</td>
                    <td class="dim">{{ c.und || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="vv-nota">
              Cálculo informativo a partir de las recetas. El descargue real de inventario
              lo sigue haciendo la importación del archivo de Square al cierre del día.
            </div>
          </div>

        </div>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import KpiCard from '../../components/common/KpiCard.vue'
import api from '../../services/api'
import { API_BASE } from '../../utils/constants.js'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const empresa = computed(() => auth.empresaCodigo || auth.empresa || '')

const datos     = ref(null)
const conexion  = ref('conectando')   // conectando | vivo | caido
const sedesSinAsociar = ref([])
let fuente = null
let reintento = null

const totales = computed(() => datos.value?.totales || { ventas: 0, ordenes: 0, articulos: 0 })
const sedes   = computed(() => datos.value?.sedes || [])
const ordenes = computed(() => datos.value?.ordenes || [])
const consumo = computed(() => datos.value?.consumo || [])

const textoConexion = computed(() => ({
  conectando: 'Conectando…',
  vivo: 'En vivo',
  caido: 'Sin conexión — reintentando',
}[conexion.value]))

const fmt = (v) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(parseFloat(v) || 0)

const num = (v) => {
  const n = parseFloat(v) || 0
  return (Math.round(n * 1000) / 1000).toLocaleString('en-US', { maximumFractionDigits: 3 })
}

const hora = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function pctSede(s) {
  const max = sedes.value.reduce((m, x) => Math.max(m, x.ventas), 0)
  return max > 0 ? Math.max(3, (s.ventas / max) * 100) : 0
}

// El navegador mantiene abierta una conexión por la que el servidor empuja
// cada cambio. Si se cae (proxy, suspensión del equipo) se reintenta sola.
function conectar() {
  if (!empresa.value) return
  cerrar()
  conexion.value = 'conectando'
  fuente = new EventSource(`${API_BASE}/square/vivo/stream?empresa=${encodeURIComponent(empresa.value)}`)

  fuente.onopen = () => { conexion.value = 'vivo' }
  fuente.onmessage = (ev) => {
    try {
      datos.value = JSON.parse(ev.data)
      conexion.value = 'vivo'
    } catch { /* mensaje no válido, se ignora */ }
  }
  fuente.onerror = () => {
    conexion.value = 'caido'
    cerrar()
    clearTimeout(reintento)
    reintento = setTimeout(conectar, 5000)
  }
}

function cerrar() {
  if (fuente) { try { fuente.close() } catch {} fuente = null }
}

async function cargarDiagnostico() {
  try {
    const r = await api.get('/square/vivo/diagnostico', { params: { empresa: empresa.value } })
    sedesSinAsociar.value = r.data?.data?.sedesSinLocationId || []
  } catch { /* el aviso es opcional */ }
}

onMounted(() => { conectar(); cargarDiagnostico() })
onBeforeUnmount(() => { cerrar(); clearTimeout(reintento) })
</script>

<style scoped>
.vv-wrap { padding: 0 0 32px; }

/* Indicador de conexión */
.vv-estado {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 11.5px; font-weight: 700;
  padding: 6px 12px; border-radius: 20px;
}
.vv-punto { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.vv-estado-vivo { background: rgba(21,128,61,.12); color: var(--success); }
.vv-estado-vivo .vv-punto { animation: vvLatido 1.8s ease-in-out infinite; }
.vv-estado-conectando { background: rgba(var(--v-theme-on-surface),.07); color: rgba(var(--v-theme-on-surface),.55); }
.vv-estado-caido { background: rgba(180,83,9,.12); color: var(--warning); }
@keyframes vvLatido { 0%,100% { opacity: 1; } 50% { opacity: .25; } }

.vv-aviso {
  display: flex; align-items: flex-start; gap: 10px;
  background: rgba(180,83,9,.1); color: var(--warning);
  border-radius: 10px; padding: 12px 15px;
  font-size: 12.5px; line-height: 1.5; margin-bottom: 16px;
}

.vv-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 18px; }

.vv-cols { display: grid; grid-template-columns: 1.15fr 1fr; gap: 16px; align-items: start; }
@media (max-width: 1000px) { .vv-cols { grid-template-columns: 1fr; } }
.vv-col-der { display: flex; flex-direction: column; gap: 16px; }

.vv-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface),.08);
  border-radius: 12px; padding: 16px;
}
.vv-card-hdr { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.vv-card-ttl { font-size: 11.5px; font-weight: 800; letter-spacing: .5px; }
.vv-card-sub { font-size: 10.5px; color: rgba(var(--v-theme-on-surface),.45); margin-left: auto; }

.vv-vacio {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 40px 10px; text-align: center;
  color: rgba(var(--v-theme-on-surface),.45); font-size: 12.5px;
}
.vv-vacio-sm { padding: 20px 10px; }
.vv-vacio p { margin: 0; }

/* Órdenes */
.vv-ordenes { display: flex; flex-direction: column; gap: 8px; max-height: 62vh; overflow-y: auto; }
.vv-orden {
  border: 1px solid rgba(var(--v-theme-on-surface),.08);
  border-left: 3px solid var(--success);
  border-radius: 9px; padding: 10px 12px;
}
.vv-orden-cancelada { border-left-color: var(--error); opacity: .6; }
.vv-orden-top { display: flex; align-items: center; gap: 8px; }
.vv-sede-chip {
  font-size: 10px; font-weight: 800; letter-spacing: .3px;
  background: var(--indigo-wash); color: var(--indigo);
  padding: 2px 8px; border-radius: 10px;
}
.vv-hora { font-size: 11px; color: rgba(var(--v-theme-on-surface),.45); }
.vv-orden-total { font-size: 14.5px; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--success); }
.vv-orden-items { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 7px; }
.vv-item {
  font-size: 11px; background: rgba(var(--v-theme-on-surface),.05);
  padding: 2px 8px; border-radius: 6px;
}
.vv-item-var { color: rgba(var(--v-theme-on-surface),.45); margin-left: 3px; }
.vv-cancelada-tag { font-size: 10.5px; color: var(--error); font-weight: 700; margin-top: 6px; }

/* Entrada de órdenes nuevas: aparecen desde arriba, sin rebote */
.vv-lista-enter-active { transition: opacity 260ms cubic-bezier(.23,1,.32,1), transform 260ms cubic-bezier(.23,1,.32,1); }
.vv-lista-enter-from { opacity: 0; transform: translateY(-8px); }
.vv-lista-move { transition: transform 260ms cubic-bezier(.23,1,.32,1); }

/* Sedes */
.vv-sedes { display: flex; flex-direction: column; gap: 13px; }
.vv-sede-fila { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.vv-sede-nom { font-size: 12.5px; font-weight: 700; }
.vv-sede-val { font-size: 13.5px; font-weight: 800; font-variant-numeric: tabular-nums; }
.vv-barra { height: 5px; border-radius: 3px; background: rgba(var(--v-theme-on-surface),.07); margin: 5px 0 3px; overflow: hidden; }
.vv-barra-fill {
  height: 100%; border-radius: 3px; background: var(--success);
  transition: width 420ms cubic-bezier(.23,1,.32,1);
}
.vv-sede-meta { font-size: 10.5px; color: rgba(var(--v-theme-on-surface),.45); }

/* Consumo */
.vv-tabla-wrap { max-height: 300px; overflow-y: auto; }
.vv-tabla { width: 100%; border-collapse: collapse; font-size: 11.5px; }
.vv-tabla thead th {
  position: sticky; top: 0; background: rgb(var(--v-theme-surface));
  text-align: left; padding: 6px 8px;
  font-size: 9.5px; font-weight: 800; letter-spacing: .4px;
  color: rgba(var(--v-theme-on-surface),.45);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),.1);
}
.vv-tabla tbody td { padding: 5px 8px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.04); }
.vv-tabla .r { text-align: right; font-variant-numeric: tabular-nums; }
.vv-tabla .b { font-weight: 700; }
.vv-tabla .dim { color: rgba(var(--v-theme-on-surface),.5); }
.vv-nota { font-size: 10.5px; line-height: 1.45; color: rgba(var(--v-theme-on-surface),.45); margin-top: 10px; }

@media (prefers-reduced-motion: reduce) {
  .vv-estado-vivo .vv-punto { animation: none; }
  .vv-lista-enter-active, .vv-lista-move, .vv-barra-fill { transition: none; }
}
</style>
