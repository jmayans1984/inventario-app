<template>
  <MainLayout>
    <div class="dash-wrap">

      <!-- ══════════════════════════════════════════════════════
           HERO: SALUDO + RELOJ + CLIMA REAL
      ══════════════════════════════════════════════════════ -->
      <div class="dx-hero">
        <div class="dx-hero-glow"></div>
        <div class="dx-hero-grid"></div>

        <div class="dx-hero-main">
          <!-- Saludo -->
          <div class="dx-greet">
            <div class="dx-greet-emoji">{{ greetingEmoji }}</div>
            <div>
              <div class="dx-greet-lbl">{{ greeting }},</div>
              <div class="dx-greet-name">{{ (authStore.userNombre || 'Usuario').split(' ')[0] }}</div>
              <div class="dx-greet-empresa">{{ authStore.empresaNombre || '' }}</div>
            </div>
          </div>

          <!-- Reloj -->
          <div class="dx-clock">
            <div class="dx-clock-time">{{ horaActual }}</div>
            <div class="dx-clock-date">{{ fechaLarga }}</div>
          </div>

          <!-- Clima actual (real) -->
          <div class="dx-weather">
            <template v-if="clima">
              <div class="dx-weather-icon">{{ clima.icono }}</div>
              <div>
                <div class="dx-weather-temp">{{ clima.temp }}°F</div>
                <div class="dx-weather-cond">{{ clima.condicion }}</div>
                <div class="dx-weather-loc">
                  <v-icon size="10" color="rgba(255,255,255,.5)">mdi-map-marker-outline</v-icon>
                  Orlando, FL
                </div>
              </div>
            </template>
            <template v-else-if="climaError">
              <div class="dx-weather-icon">🌐</div>
              <div class="dx-weather-cond" style="opacity:.6">Clima no disponible</div>
            </template>
            <template v-else>
              <div class="dx-weather-skel"></div>
            </template>
          </div>
        </div>

      </div>

      <!-- ══════════════════════════════════════════════════════
           HOY EN VIVO — se alimenta del SSE de Square
      ══════════════════════════════════════════════════════ -->
      <div v-if="vivoSedes.length" class="dx-band">
        <div class="dx-band-head">
          <span class="dx-pulse" :class="{ 'dx-pulse-off': !vivoConectado }"></span>
          <span class="dx-band-title">HOY EN VIVO</span>
          <span class="dx-band-note">
            {{ vivoConectado ? 'Square · en tiempo real' : 'Reconectando…' }}
          </span>
          <button class="dx-band-link" @click="irA('/tesoreria/procesos/ventas-vivo')">Ver detalle</button>
        </div>
        <div class="dx-vivo">
          <div v-for="sd in vivoSedes" :key="sd.codigo" class="dx-vivo-sede">
            <div class="dx-vivo-nombre">{{ sd.nombre }}</div>
            <div class="dx-vivo-monto">{{ fmt(sd.ventas) }}</div>
            <div class="dx-vivo-pie">
              <span>{{ sd.ordenes }} {{ sd.ordenes === 1 ? 'orden' : 'órdenes' }}</span>
              <span v-if="sd.pctDelPromedio != null" class="dx-vivo-pct" :class="clasePct(sd.pctDelPromedio)">
                {{ Math.round(sd.pctDelPromedio) }}% de un {{ nombreDiaHoy }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════
           KPIs FINANCIEROS CON TENDENCIA
      ══════════════════════════════════════════════════════ -->
      <div class="dx-kpis">
        <div class="dx-kpi stagger-in" style="--kc:var(--success); --stagger-index:0" @click="irA('/tesoreria/reportes/ventas-periodo')">
          <div class="dx-kpi-head">
            <span class="dx-kpi-lbl">VENTAS DEL MES</span>
            <div class="dx-kpi-ic" style="background:var(--success-wash)">
              <v-icon size="17" color="var(--success)">mdi-cash-register</v-icon>
            </div>
          </div>
          <div class="dx-kpi-val">
            <span v-if="!cargando">{{ fmt(resumen?.ventasMes?.total) }}</span>
            <span v-else class="dx-skel"></span>
          </div>
          <div v-if="!cargando && resumen?.ventasMes?.variacion !== null" class="dx-kpi-trend" :class="trendClass(resumen?.ventasMes?.variacion)">
            <v-icon size="13">{{ trendIcon(resumen?.ventasMes?.variacion) }}</v-icon>
            {{ Math.abs(resumen?.ventasMes?.variacion || 0).toFixed(1) }}% vs mes anterior
          </div>
        </div>

        <div class="dx-kpi stagger-in" style="--kc:var(--error); --stagger-index:1" @click="irA('/contabilidad/procesos/gastos')">
          <div class="dx-kpi-head">
            <span class="dx-kpi-lbl">GASTOS DEL MES</span>
            <div class="dx-kpi-ic" style="background:var(--error-wash)">
              <v-icon size="17" color="var(--error)">mdi-cart-arrow-down</v-icon>
            </div>
          </div>
          <div class="dx-kpi-val">
            <span v-if="!cargando">{{ fmt(resumen?.gastos?.total) }}</span>
            <span v-else class="dx-skel"></span>
          </div>
          <div v-if="!cargando && resumen?.gastos?.variacion !== null" class="dx-kpi-trend" :class="trendClass(resumen?.gastos?.variacion, true)">
            <v-icon size="13">{{ trendIcon(resumen?.gastos?.variacion) }}</v-icon>
            {{ Math.abs(resumen?.gastos?.variacion || 0).toFixed(1) }}% vs mes anterior
          </div>
        </div>

        <div class="dx-kpi stagger-in" style="--kc:var(--gold); --stagger-index:3" @click="irA('/tesoreria/procesos/facturas-venta')">
          <div class="dx-kpi-head">
            <span class="dx-kpi-lbl">FACTURAS PENDIENTES</span>
            <div class="dx-kpi-ic" style="background:var(--gold-wash)">
              <v-icon size="17" color="var(--gold)">mdi-file-clock-outline</v-icon>
            </div>
          </div>
          <div class="dx-kpi-val">
            <span v-if="!cargando">{{ resumen?.facturasPend?.cantidad || 0 }}</span>
            <span v-else class="dx-skel"></span>
          </div>
          <div v-if="!cargando" class="dx-kpi-trend dx-trend-neutral">
            {{ fmt(resumen?.facturasPend?.valor) }} por cobrar
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════
           ANÁLISIS DE VENTAS
           Un solo filtro (centro de costo + meses) manda en los dos
           graficos. Duplicarlo obligaria a sincronizarlos y a que el
           usuario entienda que son el mismo filtro puesto dos veces.

           Solo cifras exactas de Square: materia prima y utilidad quedan
           fuera a proposito, porque dependen de la toma fisica de
           inventario y no son un dato cerrado.
      ══════════════════════════════════════════════════════ -->
      <div class="dx-band">
        <div class="dx-band-head">
          <span class="dx-band-title">ANÁLISIS DE VENTAS</span>
          <span v-if="comparativo" class="dx-band-note">
            Del 1 al {{ comparativo.hastaDia }} de cada mes
          </span>
        </div>

        <!-- Los controles van en su propia franja hundida. Metidos en la
             cabecera junto al titulo quedaban apretados contra el borde y
             se leian como parte del titulo, no como algo que se toca. -->
        <div class="dx-filtros">
          <select v-model="ccostoSel" class="dx-sel" title="Centro de costo">
            <option value="">Toda la empresa</option>
            <option v-for="c in centrosCostos" :key="c.codigo" :value="c.codigo">
              {{ c.nombre || c.codigo }}
            </option>
          </select>

          <span class="dx-filtros-sep"></span>

          <!-- Los chips SON la leyenda de los dos graficos: cada uno lleva el
               color de su serie. Por eso ApexCharts va sin leyenda propia. -->
          <div class="dx-meses">
            <span
              v-for="(k, i) in mesesSel"
              :key="k"
              class="dx-mes-chip"
              :class="{ 'dx-mes-ref': i === 0 }"
              :style="{ '--mc': colorSerie(i) }"
            >
              <i class="dx-mes-dot"></i>
              {{ etiquetaMes(k) }}
              <button
                v-if="mesesSel.length > 1"
                class="dx-mes-x"
                :title="`Quitar ${etiquetaMes(k)}`"
                @click="quitarMes(k)"
              >
                <v-icon size="12">mdi-close</v-icon>
              </button>
            </span>
          </div>

          <select
            v-if="mesesDisponibles.length && mesesSel.length < 6"
            class="dx-sel dx-sel-add"
            title="Agregar un mes a la comparación"
            @change="agregarMes($event.target.value); $event.target.value = ''"
          >
            <option value="">+ Comparar mes</option>
            <option v-for="mm in mesesDisponibles" :key="mm.key" :value="mm.key">
              {{ mm.label }}
            </option>
          </select>
        </div>

        <template v-if="comparativo">
          <!-- Las brutas van fuera del grafico: contra ellas, devoluciones o
               comisiones serian una linea de un pixel. -->
          <div class="dx-comp-titular">
            <div class="dx-comp-tit-izq">
              <div class="dx-comp-tit-lbl">
                Ventas brutas · {{ etiquetaMes(mesesSel[0]) }}
                <template v-if="ccostoSel"> · {{ nombreCcosto }}</template>
              </div>
              <div class="dx-comp-tit-val">{{ fmt(comparativo.brutas[0]) }}</div>
            </div>
            <div v-if="comparativo.brutas.length > 1" class="dx-comp-tit-der">
              <span class="dx-comp-delta" :class="claseVar(varBrutas)">
                <v-icon size="16">{{ (varBrutas || 0) >= 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}</v-icon>
                {{ textoVar(varBrutas) }}
              </span>
              <span class="dx-comp-tit-ant">
                {{ fmt(comparativo.brutas[1]) }} en {{ etiquetaMes(mesesSel[1]) }}
              </span>
            </div>
          </div>

          <!-- Cada grafico dice que es. Antes eran dos lienzos seguidos y
               habia que deducirlo del eje. -->
          <div class="dx-graf">
            <div class="dx-graf-cap">Acumulado día a día</div>
            <div ref="curvaRef" class="dx-curva"></div>
          </div>
          <div class="dx-graf">
            <div class="dx-graf-cap">Deducciones y recargos</div>
            <div ref="compRef" class="dx-comp"></div>
          </div>
        </template>

        <div v-else class="dx-panel-empty">
          <span>Sin ventas registradas en el período seleccionado</span>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════
           REQUIERE ATENCIÓN — ordenado por impacto en dinero
      ══════════════════════════════════════════════════════ -->
      <div v-if="atencion.length" class="dx-band">
        <div class="dx-band-head">
          <span class="dx-band-title">REQUIERE ATENCIÓN</span>
          <span class="dx-band-note">Ordenado por impacto en dinero</span>
        </div>
        <div
          v-for="a in atencion"
          :key="a.id"
          class="dx-atencion"
          :class="{ 'dx-atencion-click': a.ruta }"
          @click="a.ruta && irA(a.ruta)"
        >
          <span class="dx-atencion-sev" :style="{ background: a.color }"></span>
          <div class="dx-atencion-cuerpo">
            <div class="dx-atencion-titulo">{{ a.titulo }}</div>
            <div class="dx-atencion-desc">{{ a.descripcion }}</div>
          </div>
          <span class="dx-atencion-monto" :style="{ color: a.color }">
            {{ a.monto ? fmt(a.monto) : '—' }}
          </span>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════
           CUERPO: CENTRO DE ALERTAS + ACCESOS + ACTIVIDAD
      ══════════════════════════════════════════════════════ -->
      <div class="dx-body dx-body-solo">

        <!-- ── Centro de alertas ── -->
        <div class="dx-panel dx-alerts">
          <div class="dx-panel-header">
            <div class="dx-panel-title">
              <div class="dx-panel-title-ic" style="background:var(--error-wash)">
                <v-icon size="15" color="#ef4444">mdi-bell-ring-outline</v-icon>
              </div>
              CENTRO DE ALERTAS
              <span v-if="alertas.length" class="dx-alert-count">{{ alertas.length }}</span>
            </div>
          </div>

          <!-- Chips resumen por tipo (acciones rápidas) -->
          <div v-if="chipsAccion.length" class="dx-chips">
            <button
              v-for="ch in chipsAccion"
              :key="ch.tipo"
              class="dx-chip"
              :style="{ '--cc': ch.color }"
              @click="ch.accion"
            >
              <v-icon size="13" :color="ch.color">{{ ch.icono }}</v-icon>
              <span class="dx-chip-lbl">{{ ch.label }}</span>
              <span class="dx-chip-num">{{ ch.count }}</span>
            </button>
          </div>

          <!-- Lista -->
          <div v-if="alertas.length === 0" class="dx-alerts-empty">
            <div class="dx-alerts-empty-ic">
              <v-icon size="26" color="#10b981">mdi-check-all</v-icon>
            </div>
            <div class="dx-alerts-empty-title">Todo al día</div>
            <div class="dx-alerts-empty-sub">No tienes alertas pendientes</div>
          </div>
          <div v-else class="dx-alert-list">
            <div
              v-for="(a, idx) in alertasVisibles"
              :key="a.id || idx"
              class="dx-alert-row"
            >
              <div class="dx-alert-ic" :style="{ background: colorTipo(a.tipo) + '18' }">
                <v-icon size="15" :color="colorTipo(a.tipo)">{{ iconoTipo(a.tipo) }}</v-icon>
              </div>
              <div class="dx-alert-info">
                <div class="dx-alert-title">{{ a.titulo }}</div>
                <div v-if="a.descripcion" class="dx-alert-desc">{{ a.descripcion }}</div>
              </div>
              <span class="dx-alert-hora">{{ a.hora }}</span>
              <button class="dx-alert-x" title="Descartar" @click="eliminarAlerta(alertas.indexOf(a))">
                <v-icon size="14">mdi-close</v-icon>
              </button>
            </div>
            <button v-if="alertas.length > limiteAlertas" class="dx-alert-more" @click="limiteAlertas += 10">
              Ver {{ Math.min(alertas.length - limiteAlertas, 10) }} más
              <v-icon size="13">mdi-chevron-down</v-icon>
            </button>
          </div>
        </div>

      </div>

    </div>

    <ActualizacionesModal v-model:mostrar="mostrarActualizaciones" />
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import ApexCharts from 'apexcharts'
import { useRouter } from 'vue-router'
import MainLayout from '../components/layouts/MainLayout.vue'
import ActualizacionesModal from '../components/ActualizacionesModal.vue'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'
import { notificacionesService } from '../services/notificaciones.service'

const router    = useRouter()
const authStore = useAuthStore()
const irA = (ruta) => router.push(ruta)

// ── Reloj en tiempo real ──────────────────────────────────────
const ahora = ref(new Date())
let timerReloj = null
onMounted(() => { timerReloj = setInterval(() => { ahora.value = new Date() }, 1000) })
onUnmounted(() => { clearInterval(timerReloj) })

const horaActual = computed(() =>
  ahora.value.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
)
const fechaLarga = computed(() => {
  const s = ahora.value.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
})
const greeting = computed(() => {
  const h = ahora.value.getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
})
const greetingEmoji = computed(() => {
  const h = ahora.value.getHours()
  if (h < 12) return '🌤️'
  if (h < 18) return '☀️'
  return '🌙'
})

// ── Clima REAL — Open-Meteo (gratis, sin API key) ─────────────
// Coordenadas: Orlando, FL
const clima = ref(null)
const climaError = ref(false)

// Mapa de códigos WMO → icono + descripción en español
function wmo(code) {
  if (code === 0)                 return { icono: '☀️', condicion: 'Despejado' }
  if (code === 1)                 return { icono: '🌤️', condicion: 'Mayormente despejado' }
  if (code === 2)                 return { icono: '⛅', condicion: 'Parcialmente nublado' }
  if (code === 3)                 return { icono: '☁️', condicion: 'Nublado' }
  if (code === 45 || code === 48) return { icono: '🌫️', condicion: 'Niebla' }
  if (code >= 51 && code <= 57)   return { icono: '🌦️', condicion: 'Llovizna' }
  if (code >= 61 && code <= 67)   return { icono: '🌧️', condicion: 'Lluvia' }
  if (code >= 71 && code <= 77)   return { icono: '🌨️', condicion: 'Nieve' }
  if (code >= 80 && code <= 82)   return { icono: '🌧️', condicion: 'Aguaceros' }
  if (code >= 95)                 return { icono: '⛈️', condicion: 'Tormenta' }
  return { icono: '🌡️', condicion: '—' }
}

async function cargarClima() {
  try {
    const url = 'https://api.open-meteo.com/v1/forecast'
      + '?latitude=28.5384&longitude=-81.3789'
      + '&current=temperature_2m,weather_code'
      + '&temperature_unit=fahrenheit&timezone=America%2FNew_York&forecast_days=1'
    const res = await fetch(url)
    const json = await res.json()

    const w = wmo(json.current?.weather_code)
    clima.value = {
      temp: Math.round(json.current?.temperature_2m || 0),
      icono: w.icono,
      condicion: w.condicion,
    }

  } catch (e) {
    console.error('cargarClima:', e)
    climaError.value = true
  }
}

// ── Resumen financiero ────────────────────────────────────────
const resumen  = ref(null)
const cargando = ref(true)
const empresa = computed(() =>
  authStore.empresa || authStore.user?.empresa || localStorage.getItem('empresaActual') || ''
)

async function cargarResumen() {
  if (!empresa.value) { cargando.value = false; return }
  try {
    const res = await api.get('/dashboard/resumen', { params: { empresa: empresa.value } })
    if (res.data?.success) resumen.value = res.data.data
  } catch (e) { console.error('dashboard:', e) }
  finally { cargando.value = false }
}

function trendClass(v, invertir = false) {
  if (v === null || v === undefined) return 'dx-trend-neutral'
  const positivo = invertir ? v < 0 : v >= 0
  return positivo ? 'dx-trend-up' : 'dx-trend-down'
}
function trendIcon(v) {
  return (v || 0) >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'
}

// ══════════════════════════════════════════════════════════════
// CURVA DEL MES + NÓMINA PENDIENTE
// ══════════════════════════════════════════════════════════════
const panel    = ref(null)
const curvaRef = ref(null)
let chartCurva = null

// ── Filtro compartido por los dos graficos ────────────────────────────
const centrosCostos = ref([])
const ccostoSel = ref('')

const claveMes = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

// Por defecto, mes en curso y anterior. El primero manda: es el de
// referencia para el corte de dias y para el titular.
const mesesSel = ref([
  claveMes(new Date()),
  claveMes(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)),
])

const NOMBRE_MES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function etiquetaMes(k) {
  if (!k) return ''
  const [yy, mm] = k.split('-').map(Number)
  return `${NOMBRE_MES[mm - 1]} ${yy}`
}

// Dos años hacia atras: alcanza para comparar contra el mismo mes del año
// pasado, que es la comparacion que de verdad se usa en un negocio con
// temporadas.
const mesesDisponibles = computed(() => {
  const out = []
  const hoyD = new Date()
  for (let i = 0; i < 24; i++) {
    const d = new Date(hoyD.getFullYear(), hoyD.getMonth() - i, 1)
    const k = claveMes(d)
    if (!mesesSel.value.includes(k)) out.push({ key: k, label: etiquetaMes(k) })
  }
  return out
})

const nombreCcosto = computed(() => {
  const c = centrosCostos.value.find(x => x.codigo === ccostoSel.value)
  return c ? (c.nombre || c.codigo) : ''
})

function agregarMes(k) {
  if (!k || mesesSel.value.includes(k) || mesesSel.value.length >= 6) return
  mesesSel.value = [...mesesSel.value, k]
}
function quitarMes(k) {
  if (mesesSel.value.length <= 1) return
  mesesSel.value = mesesSel.value.filter(x => x !== k)
}

async function cargarCentros() {
  if (!empresa.value) return
  try {
    const r = await api.get('/ccostos', { params: { empresa: empresa.value } })
    const lista = r.data?.data || r.data || []
    centrosCostos.value = Array.isArray(lista) ? lista : []
  } catch (e) { console.error('ccostos:', e) }
}

// Cualquier cambio del filtro vuelve a pedir los datos y repinta.
watch([ccostoSel, mesesSel], () => { cargarPanel() }, { deep: true })

// Paleta de los graficos, hasta seis meses comparados a la vez. El primero
// es siempre el mes de referencia y va en naranja; el segundo en indigo, que
// es el par mas seguro para daltonismo (rojo-verde no los confunde).
//
// Los doce tonos estan medidos contra su fondo y ninguno baja de 3:1, que es
// el minimo para lineas y barras con significado:
//
//   claro   naranja 3.56 · indigo 6.29 · cian 5.36 · rosa 4.60 · verde 5.02 · violeta 5.70
//   oscuro  naranja 7.66 · indigo 5.81 · cian 9.60 · rosa 6.55 · verde 9.95 · violeta 6.56
//
// El gris que se usaba antes para el mes anterior daba 2.73:1 en claro — por
// debajo del minimo, y por eso la serie se perdia contra el fondo blanco.
const SERIES_CLARO  = ['#ea580c', '#4f46e5', '#0e7490', '#db2777', '#15803d', '#7c3aed']
const SERIES_OSCURO = ['#fb923c', '#818cf8', '#22d3ee', '#f472b6', '#4ade80', '#c084fc']

function colorSerie(i) {
  const p = esOscuro() ? SERIES_OSCURO : SERIES_CLARO
  return p[i % p.length]
}

// Etiqueta de eje. Redondear siempre a miles repite marcas: con topes de
// ~7k, Apex reparte las marcas cada ~650 y varias caen en el mismo millar,
// asi que el eje mostraba "$1k $1k $2k $2k". Con un decimal por debajo de
// 10k cada marca queda distinta.
function fmtEje(v) {
  const n = Number(v) || 0
  if (Math.abs(n) >= 10000) return '$' + Math.round(n / 1000) + 'k'
  if (Math.abs(n) >= 1000)  return '$' + (n / 1000).toFixed(1) + 'k'
  return '$' + Math.round(n)
}

function paletaGrafico() {
  const oscuro = esOscuro()
  return {
    oscuro,
    serie: oscuro ? SERIES_OSCURO : SERIES_CLARO,
    fg:    oscuro ? '#b3aa9a' : '#6b6459',
    grid:  oscuro ? 'rgba(245,241,232,.07)' : 'rgba(27,24,21,.07)',
  }
}

function esOscuro() {
  return document.documentElement.classList.contains('v-theme--dark') ||
         document.body.classList.contains('v-theme--dark')
}

function renderCurva() {
  const c = panel.value?.curva
  if (!curvaRef.value || !c?.series?.length) return
  chartCurva?.destroy()
  const { oscuro, serie, fg, grid } = paletaGrafico()

  chartCurva = new ApexCharts(curvaRef.value, {
    chart: {
      type: 'area', height: 240, toolbar: { show: false },
      fontFamily: "'Plus Jakarta Sans', sans-serif", background: 'transparent',
      animations: { enabled: true, speed: 500 },
    },
    theme: { mode: oscuro ? 'dark' : 'light' },
    series: c.series.map(x => ({ name: x.label, data: x.data })),
    xaxis: {
      categories: c.dias,
      labels: { style: { colors: fg, fontSize: '11px' } },
      axisBorder: { show: false }, axisTicks: { show: false },
      tickAmount: 10,
    },
    yaxis: {
      labels: {
        style: { colors: fg, fontSize: '11px' },
        formatter: (v) => fmtEje(v),
      },
    },
    // El mes de referencia va solido y con relleno; los demas son la
    // comparacion, asi que van punteados y sin relleno para que no compitan.
    // Que no dependan solo del color tambien ayuda a quien no distingue tonos.
    colors: c.series.map((_, i) => serie[i % serie.length]),
    stroke: {
      curve: 'smooth',
      width: c.series.map((_, i) => (i === 0 ? 3 : 2)),
      dashArray: c.series.map((_, i) => (i === 0 ? 0 : 5)),
    },
    fill: {
      type: c.series.map((_, i) => (i === 0 ? 'gradient' : 'solid')),
      opacity: c.series.map((_, i) => (i === 0 ? 1 : 0)),
      gradient: { shadeIntensity: 1, opacityFrom: 0.32, opacityTo: 0.03, stops: [0, 100] },
    },
    grid: { borderColor: grid, strokeDashArray: 4, padding: { left: 4, right: 8 } },
    // Sin leyenda: los chips del filtro ya dicen que color es cada mes, y
    // repetirlo aqui gasta alto util y obliga a leer lo mismo dos veces.
    legend: { show: false },
    dataLabels: { enabled: false },
    tooltip: {
      shared: true, intersect: false,
      x: { formatter: (v) => 'Día ' + v },
      y: { formatter: (v) => (v == null ? '—' : fmt(v)) },
    },
  })
  chartCurva.render()
}

async function cargarPanel() {
  if (!empresa.value) return
  try {
    const res = await api.get('/dashboard/panel', {
      params: {
        empresa: empresa.value,
        ccosto: ccostoSel.value || undefined,
        meses: mesesSel.value.join(','),
      },
    })
    if (res.data?.success) {
      panel.value = res.data.data
      await nextTick()
      renderCurva()
      renderComp()
    }
  } catch (e) { console.error('panel:', e) }
}

// ══════════════════════════════════════════════════════════════
// COMPARATIVO MES CONTRA MES
// ══════════════════════════════════════════════════════════════
const compRef = ref(null)
let chartComp = null

const comparativo = computed(() => panel.value?.comparativo || null)

// Solo tiene sentido contra el segundo mes de la lista: con seis series, un
// unico porcentaje en el titular tendria que elegir uno, y el natural es el
// que el usuario puso justo al lado del de referencia.
const varBrutas = computed(() => {
  const b = comparativo.value?.brutas
  if (!b || b.length < 2 || !b[1]) return null
  return ((b[0] - b[1]) / b[1]) * 100
})

function claseVar(v) {
  if (v === null || v === undefined) return 'dx-trend-neutral'
  return v >= 0 ? 'dx-trend-up' : 'dx-trend-down'
}
function textoVar(v) {
  if (v === null || v === undefined) return 'sin base para comparar'
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`
}

function renderComp() {
  const c = comparativo.value
  if (!compRef.value || !c?.conceptos?.length) return
  chartComp?.destroy()
  const { oscuro, serie, fg, grid } = paletaGrafico()

  // De mayor a menor segun el mes de referencia: lo que mas pesa, arriba.
  const ord = [...c.conceptos].sort((a, b) => (b.valores[0] || 0) - (a.valores[0] || 0))

  chartComp = new ApexCharts(compRef.value, {
    chart: {
      type: 'bar', height: 320, toolbar: { show: false },
      fontFamily: "'Plus Jakarta Sans', sans-serif", background: 'transparent',
      animations: { enabled: true, speed: 450 },
    },
    theme: { mode: oscuro ? 'dark' : 'light' },
    series: (c.meses || []).map((mi, i) => ({
      name: mi.label,
      data: ord.map(x => x.valores[i] ?? 0),
    })),
    // Barras horizontales: las etiquetas ("Comisiones delivery") no caben
    // bajo una barra vertical sin girarse o cortarse.
    plotOptions: { bar: { horizontal: true, barHeight: '62%', borderRadius: 3, borderRadiusApplication: 'end' } },
    colors: (c.meses || []).map((_, i) => serie[i % serie.length]),
    xaxis: {
      categories: ord.map(x => x.label),
      labels: {
        style: { colors: fg, fontSize: '11px' },
        formatter: (v) => fmtEje(v),
      },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: fg, fontSize: '11.5px' } } },
    grid: { borderColor: grid, strokeDashArray: 4 },
    legend: { show: false },
    // Sin cifras sobre las barras: caen encima del relleno y ningun color de
    // texto funciona a la vez sobre el naranja, el indigo y el fondo. El dato
    // exacto esta en el tooltip.
    dataLabels: { enabled: false },
    tooltip: {
      shared: true, intersect: false,
      y: { formatter: (v) => fmt(v) },
    },
  })
  chartComp.render()
}

// ══════════════════════════════════════════════════════════════
// REQUIERE ATENCIÓN — lo mismo de siempre, pero ordenado por plata
// ══════════════════════════════════════════════════════════════
const atencion = computed(() => {
  const out = []
  const np = panel.value?.nominaPendiente

  if (np?.semanas > 0) {
    const n = np.semanas
    out.push({
      id: 'nomina-pendiente',
      titulo: `${n} semana${n > 1 ? 's' : ''} de nómina sin liquidar`,
      descripcion: 'El gasto todavía no pesa en el mes, así que la utilidad se ve mejor de lo que es',
      monto: np.montoEstimado,
      color: 'var(--error)',
      ruta: '/nomina/procesos/liquidacion',
    })
  }

  const fp = resumen.value?.facturasPend
  if (fp?.cantidad > 0) {
    out.push({
      id: 'facturas',
      titulo: `${fp.cantidad} factura${fp.cantidad > 1 ? 's' : ''} pendiente${fp.cantidad > 1 ? 's' : ''} de cobro`,
      descripcion: 'Cuentas por cobrar abiertas',
      monto: fp.valor,
      color: 'var(--warning)',
      ruta: '/tesoreria/procesos/facturas-venta',
    })
  }

  // Las comisiones de delivery no existian el mes pasado y ahora si: es un
  // costo nuevo que conviene ver, no una desviacion contra una meta.
  const cd = comparativo.value?.conceptos?.find(x => x.clave === 'comDelivery')
  if (cd?.valores?.[0] > 0 && cd.valores.length > 1 && !cd.valores[1]) {
    out.push({
      id: 'com-delivery',
      titulo: 'Comisiones de delivery, nuevas este mes',
      descripcion: 'El mes pasado no hubo. Sale del sobreprecio de las plataformas',
      monto: cd.valores[0],
      color: 'var(--warning)',
      ruta: '/contabilidad/reportes/estado-resultados',
    })
  }

  return out.sort((a, b) => (b.monto || 0) - (a.monto || 0))
})

// ══════════════════════════════════════════════════════════════
// HOY EN VIVO — mismo SSE que alimenta Ventas en Vivo
// ══════════════════════════════════════════════════════════════
const vivoSedes     = ref([])
const vivoConectado = ref(false)
let fuenteVivo = null

const nombreDiaHoy = computed(() =>
  ahora.value.toLocaleDateString('es-CO', { weekday: 'long' })
)

function clasePct(p) {
  if (p >= 100) return 'dx-pct-ok'
  if (p >= 85)  return 'dx-pct-warn'
  return 'dx-pct-bad'
}

function conectarVivo() {
  if (!empresa.value) return
  const base = api.defaults.baseURL || ''
  try {
    fuenteVivo = new EventSource(`${base}/square/vivo/stream?empresa=${encodeURIComponent(empresa.value)}`)
    fuenteVivo.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data)
        vivoConectado.value = true
        vivoSedes.value = (d.sedes || []).filter(x => x.ventas > 0)
      } catch { /* trama incompleta: se ignora y se espera la siguiente */ }
    }
    // Si Square no esta configurado o la conexion cae, la franja simplemente
    // no aparece: es informacion extra, no debe romper el panel.
    fuenteVivo.onerror = () => { vivoConectado.value = false }
  } catch (e) {
    console.error('vivo:', e)
  }
}

// ── Alertas ───────────────────────────────────────────────────
const alertas = ref([])
const limiteAlertas = ref(6)
const mostrarActualizaciones = ref(false)

const alertasVisibles = computed(() => alertas.value.slice(0, limiteAlertas.value))

const TIPO_META = {
  'DESPACHO_BODEGA': { color: '#8b5cf6', icono: 'mdi-truck-outline' },
  'ORDEN_COMPRA':    { color: '#3b82f6', icono: 'mdi-clipboard-list-outline' },
  'stock_bajo':      { color: '#f59e0b', icono: 'mdi-package-down' },
  'stock_fuera':     { color: '#ef4444', icono: 'mdi-package-variant-remove' },
  'alerta_general':  { color: '#a855f7', icono: 'mdi-alert-outline' },
  'reportes':        { color: '#22c55e', icono: 'mdi-chart-bar' },
  'actualizaciones': { color: '#0ea5e9', icono: 'mdi-lightning-bolt-outline' },
  'CRÍTICO':         { color: '#ef4444', icono: 'mdi-alert-circle-outline' },
  'ADVERTENCIA':     { color: '#f59e0b', icono: 'mdi-alert-outline' },
  'INFO':            { color: '#06b6d4', icono: 'mdi-information-outline' },
}
const colorTipo = (t) => TIPO_META[t]?.color || '#06b6d4'
const iconoTipo = (t) => TIPO_META[t]?.icono || 'mdi-information-outline'

// Chips de acción rápida basados en los tipos presentes
const chipsAccion = computed(() => {
  const defs = [
    { tipo: 'DESPACHO_BODEGA', label: 'Despachos',     accion: () => irA('/almacen/procesos/despachos') },
    { tipo: 'ORDEN_COMPRA',    label: 'Órd. Compra',   accion: () => irA('/produccion/procesos/ordenes-compra') },
    { tipo: 'stock_fuera',     label: 'Sin stock',     accion: () => irA('/almacen/reportes/alertas-stock') },
    { tipo: 'stock_bajo',      label: 'Stock bajo',    accion: () => irA('/almacen/reportes/alertas-stock') },
    { tipo: 'reportes',        label: 'Reportes',      accion: () => irA('/almacen/reportes/kardex') },
    { tipo: 'actualizaciones', label: 'Novedades',     accion: () => { mostrarActualizaciones.value = true } },
  ]
  return defs
    .map(d => ({ ...d, count: alertas.value.filter(a => a.tipo === d.tipo).length, color: colorTipo(d.tipo), icono: iconoTipo(d.tipo) }))
    .filter(d => d.count > 0)
})

async function cargarAlertas() {
  try {
    const res = await notificacionesService.obtenerNotificaciones()
    const notificaciones = res.data || []
    if (Array.isArray(notificaciones)) {
      alertas.value = notificaciones.map(n => ({
        id: n.id,
        tipo: n.tipo || 'INFO',
        titulo: n.titulo,
        descripcion: n.mensaje,
        hora: formatHora(n.fecha_creacion),
      }))
    }
  } catch (e) {
    console.error('Error cargando alertas:', e)
    alertas.value = []
  }
}

function formatHora(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function eliminarAlerta(idx) {
  const alerta = alertas.value[idx]
  if (!alerta?.id) return
  try {
    await notificacionesService.eliminarNotificacion(alerta.id)
    alertas.value.splice(idx, 1)
  } catch (e) {
    console.error('Error eliminando alerta:', e)
  }
}


onMounted(() => {
  cargarResumen()
  cargarAlertas()
  cargarClima()
  cargarCentros()
  cargarPanel()
  conectarVivo()
})

onUnmounted(() => {
  // El SSE y el grafico sobreviven al desmontaje si no se sueltan a mano:
  // uno deja la conexion abierta, el otro un nodo y sus listeners.
  fuenteVivo?.close()
  chartCurva?.destroy()
  chartComp?.destroy()
})

// ── Formatters ────────────────────────────────────────────────
function fmt(val) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(parseFloat(val || 0))
}
</script>

<style scoped>
.dash-wrap { display: flex; flex-direction: column; gap: 18px; }

/* ══ HERO ═══════════════════════════════════════════════════ */
.dx-hero {
  position: relative; overflow: hidden;
  background: linear-gradient(130deg, var(--sidebar-bg) 0%, #241d13 55%, #1c1710 100%);
  border-radius: var(--radius-xl);
  padding: 26px 30px 20px;
  box-shadow: var(--shadow-lg);
}
.dx-hero-glow {
  position: absolute; top: -90px; right: -50px;
  width: 340px; height: 340px; border-radius: 50%;
  background: radial-gradient(circle, rgba(240,168,60,.18), transparent 65%);
  pointer-events: none;
}
.dx-hero-grid {
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: radial-gradient(ellipse at 30% 0%, black 30%, transparent 75%);
}

.dx-hero-main {
  position: relative;
  display: flex; align-items: center; justify-content: space-between;
  gap: 24px; flex-wrap: wrap; margin-bottom: 18px;
}

/* Saludo */
.dx-greet { display: flex; align-items: center; gap: 16px; }
.dx-greet-emoji { font-size: 40px; line-height: 1; filter: drop-shadow(0 2px 10px rgba(0,0,0,.4)); }
.dx-greet-lbl { font-size: 13px; font-weight: 500; color: rgba(255,255,255,.5); letter-spacing: .3px; }
.dx-greet-name { font-size: 26px; font-weight: 900; color: white; letter-spacing: -.3px; line-height: 1.15; }
.dx-greet-empresa { font-size: 11px; font-weight: 700; color: var(--sidebar-accent); letter-spacing: .8px; text-transform: uppercase; margin-top: 2px; }

/* Reloj */
.dx-clock { text-align: center; }
.dx-clock-time { font-size: 38px; font-weight: 800; color: white; letter-spacing: -1px; font-variant-numeric: tabular-nums; line-height: 1; }
.dx-clock-date { font-size: 12px; color: rgba(255,255,255,.45); margin-top: 5px; }

/* Clima actual */
.dx-weather {
  display: flex; align-items: center; gap: 14px;
  background: rgba(255,255,255,.06); backdrop-filter: blur(6px);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 14px; padding: 12px 18px;
  min-width: 190px; min-height: 72px;
}
.dx-weather-icon { font-size: 40px; line-height: 1; }
.dx-weather-temp { font-size: 24px; font-weight: 900; color: white; line-height: 1; }
.dx-weather-cond { font-size: 11px; font-weight: 600; color: rgba(255,255,255,.75); margin-top: 3px; }
.dx-weather-loc { display: flex; align-items: center; gap: 3px; font-size: 10px; color: rgba(255,255,255,.5); margin-top: 2px; }
.dx-weather-skel { width: 140px; height: 44px; border-radius: 8px; background: rgba(255,255,255,.08); animation: dxPulse 1.2s ease-in-out infinite; }
@keyframes dxPulse { 0%,100% { opacity: .4 } 50% { opacity: .9 } }

/* Pronóstico */

@media (max-width: 800px) {
  .dx-clock { display: none; }
}

/* ══ KPIs ═══════════════════════════════════════════════════ */
.dx-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
.dx-kpi {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 16px 18px;
  cursor: pointer; transition: transform 180ms var(--ease-out), box-shadow 180ms var(--ease-out), border-color 180ms var(--ease-out);
  overflow: hidden;
}
.dx-kpi::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: var(--kc); opacity: .8;
}
.dx-kpi:hover { transform: translateY(-3px); box-shadow: 0 10px 26px rgba(0,0,0,.08); border-color: var(--kc); }
.dx-kpi-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.dx-kpi-lbl { font-size: 10px; font-weight: 800; letter-spacing: .8px; color: rgba(var(--v-theme-on-surface), .45); }
.dx-kpi-ic { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.dx-kpi-val { font-size: 24px; font-weight: 800; letter-spacing: -.5px; line-height: 1; margin-bottom: 8px; }
.dx-kpi-trend { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; }
.dx-trend-up   { color: var(--success); }
.dx-trend-down { color: var(--error); }
.dx-trend-neutral { color: rgba(var(--v-theme-on-surface), .45); }
.dx-skel {
  display: inline-block; width: 90px; height: 22px; border-radius: 5px;
  background: linear-gradient(90deg, rgba(var(--v-theme-on-surface),.06) 25%, rgba(var(--v-theme-on-surface),.12) 50%, rgba(var(--v-theme-on-surface),.06) 75%);
  background-size: 200% 100%; animation: dxShimmer 1.4s infinite;
}
@keyframes dxShimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }

/* ══ CUERPO ═════════════════════════════════════════════════ */
.dx-body { display: grid; grid-template-columns: 1fr 330px; gap: 16px; align-items: start; }
@media (max-width: 1000px) { .dx-body { grid-template-columns: 1fr; } }

.dx-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px; padding: 18px;
}
.dx-panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.dx-panel-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 11px; font-weight: 800; letter-spacing: .8px;
  color: rgba(var(--v-theme-on-surface), .6);
}
.dx-panel-title-ic { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.dx-panel-link {
  border: none; background: transparent; cursor: pointer;
  font-size: 11px; font-weight: 700; color: var(--indigo);
  padding: 2px 6px; border-radius: 6px; transition: background .15s;
}
.dx-panel-link:hover { background: var(--indigo-wash); }
.dx-panel-loading { display: flex; justify-content: center; padding: 18px; }
.dx-panel-empty { text-align: center; padding: 14px 0; font-size: 12px; color: rgba(var(--v-theme-on-surface), .4); }

/* ── Alertas ── */
.dx-alert-count {
  background: var(--error); color: white;
  min-width: 22px; text-align: center;
  padding: 2px 8px; border-radius: 11px;
  font-size: 11px; font-weight: 900;
}
.dx-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.dx-chip {
  display: inline-flex; align-items: center; gap: 6px;
  border: 1px solid color-mix(in srgb, var(--cc) 30%, transparent);
  background: color-mix(in srgb, var(--cc) 7%, transparent);
  border-radius: 20px; padding: 5px 11px;
  font-size: 11px; font-weight: 700; color: var(--cc);
  cursor: pointer; transition: background-color 150ms var(--ease-out), transform 150ms var(--ease-out);
}
.dx-chip:hover { background: color-mix(in srgb, var(--cc) 15%, transparent); transform: translateY(-1px); }
.dx-chip-num {
  background: var(--cc); color: white;
  min-width: 18px; text-align: center;
  padding: 1px 6px; border-radius: 9px;
  font-size: 10px; font-weight: 900;
}

.dx-alerts-empty { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 32px 0; }
.dx-alerts-empty-ic {
  width: 52px; height: 52px; border-radius: 50%;
  background: var(--success-wash);
  display: flex; align-items: center; justify-content: center; margin-bottom: 6px;
}
.dx-alerts-empty-title { font-size: 14px; font-weight: 800; }
.dx-alerts-empty-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface), .45); }

.dx-alert-list { display: flex; flex-direction: column; gap: 4px; }
.dx-alert-row {
  display: flex; align-items: center; gap: 12px;
  padding: 9px 10px; border-radius: 11px;
  transition: background .15s;
}
.dx-alert-row:hover { background: rgba(var(--v-theme-on-surface), .035); }
.dx-alert-ic {
  width: 32px; height: 32px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.dx-alert-info { flex: 1; min-width: 0; }
.dx-alert-title { font-size: 12.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dx-alert-desc { font-size: 11px; color: rgba(var(--v-theme-on-surface), .5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
.dx-alert-hora { flex-shrink: 0; font-size: 10px; font-weight: 600; color: rgba(var(--v-theme-on-surface), .35); font-variant-numeric: tabular-nums; }
.dx-alert-x {
  flex-shrink: 0; width: 26px; height: 26px;
  border: none; border-radius: 7px; background: transparent;
  color: rgba(var(--v-theme-on-surface), .3);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 150ms var(--ease-out), background-color 150ms var(--ease-out), color 150ms var(--ease-out); padding: 0;
}
.dx-alert-row:hover .dx-alert-x { opacity: 1; }
.dx-alert-x:hover { background: var(--error-wash); color: var(--error); }
.dx-alert-more {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  border: none; background: rgba(var(--v-theme-on-surface), .04);
  border-radius: 9px; padding: 8px;
  font-size: 11px; font-weight: 700; color: rgba(var(--v-theme-on-surface), .55);
  cursor: pointer; transition: background .15s; margin-top: 4px;
}
.dx-alert-more:hover { background: rgba(var(--v-theme-on-surface), .08); }

/* ── Accesos directos ── */

/* ── Últimos gastos ── */
/* ══════════════════════════════════════════════════════════════
   BANDAS DEL PANEL (hoy en vivo · mes contra mes · curva · atención)
   Todas comparten el mismo marco para que el inicio se lea como una
   sola pieza y no como cuatro widgets pegados.
   ══════════════════════════════════════════════════════════════ */
.dx-band {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), .1);
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, .04);
  overflow: hidden;
}
.dx-band-head {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 15px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .08);
}
.dx-band-title {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .1em;
  color: rgba(var(--v-theme-on-surface), .78);
}
.dx-band-note {
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), .5);
}
.dx-band-link {
  margin-left: auto;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--gold);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 6px;
}
.dx-band-link:hover { text-decoration: underline; }
.dx-band-link:focus-visible { outline: 2px solid var(--gold); outline-offset: 1px; }

/* El punto late solo mientras la conexión está viva: si se cae, se apaga
   en vez de seguir animando y mintiendo sobre el estado. */
.dx-pulse {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--success);
  flex-shrink: 0;
  animation: dxPulse 2.4s cubic-bezier(.4, 0, .6, 1) infinite;
}
.dx-pulse-off { background: rgba(var(--v-theme-on-surface), .25); animation: none; }
@keyframes dxPulse {
  0%   { box-shadow: 0 0 0 0 rgba(21, 128, 61, .45); }
  70%  { box-shadow: 0 0 0 7px rgba(21, 128, 61, 0); }
  100% { box-shadow: 0 0 0 0 rgba(21, 128, 61, 0); }
}
@media (prefers-reduced-motion: reduce) { .dx-pulse { animation: none; } }

/* ── Hoy en vivo ───────────────────────────────────────────── */
.dx-vivo { display: grid; grid-template-columns: repeat(auto-fit, minmax(215px, 1fr)); }
.dx-vivo-sede {
  padding: 13px 15px;
  border-right: 1px solid rgba(var(--v-theme-on-surface), .08);
  display: flex; flex-direction: column; gap: 3px;
}
.dx-vivo-sede:last-child { border-right: none; }
.dx-vivo-nombre {
  font-size: 11px; font-weight: 800; letter-spacing: .08em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .58);
}
.dx-vivo-monto {
  font-family: var(--font-mono); font-variant-numeric: tabular-nums;
  font-size: 23px; font-weight: 600; letter-spacing: -.02em;
}
.dx-vivo-pie {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  font-size: 12px; color: rgba(var(--v-theme-on-surface), .6);
}
.dx-vivo-pct {
  font-family: var(--font-mono); font-variant-numeric: tabular-nums;
  font-weight: 700; font-size: 11.5px;
  padding: 1px 7px; border-radius: 999px;
}
.dx-pct-ok   { color: var(--success); background: var(--success-wash); }
.dx-pct-warn { color: var(--warning); background: var(--warning-wash); }
.dx-pct-bad  { color: var(--error);   background: var(--error-wash); }

/* La marca es la meta: sin ella el porcentaje es un número suelto. */

/* ── Curva del mes ─────────────────────────────────────────── */
.dx-curva-wrap { padding: 6px 8px 10px; }
.dx-curva { width: 100%; }
.dx-curva-delta {
  margin-left: auto;
  display: inline-flex; align-items: center; gap: 3px;
  font-family: var(--font-mono); font-variant-numeric: tabular-nums;
  font-size: 12px; font-weight: 700;
}

/* ── Requiere atención ─────────────────────────────────────── */
.dx-atencion {
  display: flex; align-items: center; gap: 13px;
  padding: 12px 15px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .07);
}
.dx-atencion:last-child { border-bottom: none; }
.dx-atencion-click { cursor: pointer; transition: background var(--dur-fast) var(--ease-out); }
.dx-atencion-click:hover { background: rgba(var(--v-theme-on-surface), .035); }
.dx-atencion-sev { width: 3px; align-self: stretch; border-radius: 2px; flex-shrink: 0; }
.dx-atencion-cuerpo { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.dx-atencion-titulo { font-size: 13.5px; font-weight: 700; }
.dx-atencion-desc { font-size: 12px; color: rgba(var(--v-theme-on-surface), .58); }
.dx-atencion-monto {
  font-family: var(--font-mono); font-variant-numeric: tabular-nums;
  font-size: 16px; font-weight: 800; white-space: nowrap;
}

/* Sin la columna derecha, el centro de alertas ocupa todo el ancho. */
.dx-body-solo { grid-template-columns: 1fr !important; }

@media (max-width: 640px) {
}




@media (max-width: 700px) {
}

/* ══════════════════════════════════════════════════════════════
   ANÁLISIS DE VENTAS
   ══════════════════════════════════════════════════════════════ */

/* Franja de controles. Va hundida y con su propio borde para que se lea
   como "esto se toca", separada del contenido que produce. */
.dx-filtros {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 15px;
  background: rgba(var(--v-theme-on-surface), .028);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .08);
}
.dx-filtros-sep {
  width: 1px;
  align-self: stretch;
  margin: 2px 2px;
  background: rgba(var(--v-theme-on-surface), .12);
}

.dx-sel {
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), .18);
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  max-width: 200px;
  transition: border-color var(--dur-fast) var(--ease-out);
}
.dx-sel:hover { border-color: rgba(var(--v-theme-on-surface), .34); }
.dx-sel:focus-visible { outline: 2px solid var(--gold); outline-offset: 1px; }
.dx-sel-add {
  color: var(--gold);
  border-color: rgba(var(--v-theme-on-surface), .22);
  border-style: dashed;
  margin-left: auto;
}
.dx-sel-add:hover { border-color: var(--gold); }

.dx-meses { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }

/* Cada chip lleva el color de su serie: es la leyenda de los dos gráficos,
   por eso ApexCharts va sin la suya. */
.dx-mes-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 6px 5px 9px;
  border-radius: 999px;
  /* Respaldo primero: si el navegador no soporta color-mix, la declaracion
     entera se invalida y el chip quedaria sin borde ni fondo. */
  border: 1px solid rgba(var(--v-theme-on-surface), .16);
  background: rgba(var(--v-theme-on-surface), .04);
  border-color: color-mix(in srgb, var(--mc) 35%, transparent);
  background: color-mix(in srgb, var(--mc) 9%, transparent);
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
}
/* El primero manda en el corte y en el orden: se marca con el borde lleno. */
.dx-mes-ref { border-color: var(--mc); }
.dx-mes-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--mc);
  flex-shrink: 0;
}
.dx-mes-x {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px; height: 18px;
  border: none;
  border-radius: 50%;
  background: none;
  cursor: pointer;
  color: rgba(var(--v-theme-on-surface), .45);
  transition: background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
}
.dx-mes-x:hover { background: var(--error-wash); color: var(--error); }
.dx-mes-x:focus-visible { outline: 2px solid var(--gold); outline-offset: 1px; }

/* ── Titular: la cifra grande a la izquierda, la comparación a la derecha,
   alineadas por su línea base para que se lean como una sola frase. ── */
.dx-comp-titular {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px 20px;
  padding: 16px 15px 10px;
}
.dx-comp-tit-izq { display: flex; flex-direction: column; gap: 2px; }
.dx-comp-tit-lbl {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .55);
}
.dx-comp-tit-val {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -.035em;
  line-height: 1.05;
}
.dx-comp-tit-der {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}
.dx-comp-delta {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -.02em;
}
.dx-comp-tit-ant {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), .5);
}

/* ── Cada gráfico con su rótulo ── */
.dx-graf { padding: 4px 8px 12px; }
.dx-graf-cap {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .07em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .48);
  padding: 6px 7px 0;
}
.dx-curva, .dx-comp { width: 100%; }

@media (max-width: 700px) {
  .dx-sel { max-width: 100%; }
  .dx-sel-add { margin-left: 0; }
  .dx-filtros-sep { display: none; }
  .dx-comp-tit-der { align-items: flex-start; }
}

</style>
