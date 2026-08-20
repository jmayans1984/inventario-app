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

      <!-- Un panel independiente por centro de costo -->
      <div v-if="!sedes.length" class="vv-card">
        <div class="vv-vacio">
          <v-icon size="38" color="rgba(var(--v-theme-on-surface),.15)">mdi-clock-outline</v-icon>
          <p>Esperando la primera venta del día…</p>
        </div>
      </div>

      <div v-else class="vv-paneles">
        <div v-for="s in sedes" :key="s.codigo" class="vv-panel">

          <div class="vv-panel-hdr">
            <div class="vv-panel-nom">{{ s.nombre }}</div>
            <div class="vv-panel-total">{{ fmt(s.ventas) }}</div>
          </div>
          <div class="vv-panel-meta">
            {{ s.ordenes }} órden{{ s.ordenes !== 1 ? 'es' : '' }} ·
            {{ num(s.articulos) }} artículos ·
            {{ s.consumo.length }} insumo{{ s.consumo.length !== 1 ? 's' : '' }}
            <template v-if="s.modificadores?.length">
              · {{ s.modificadores.length }} adición{{ s.modificadores.length !== 1 ? 'es' : '' }}
            </template>
          </div>

          <div v-if="hayPagos(s)" class="vv-pagos">
            <div class="vv-pagos-barra">
              <span class="vv-pb vv-pb-tarjeta" :style="{ width: (s.pagos.pctTarjeta || 0) + '%' }"></span>
              <span class="vv-pb vv-pb-efectivo" :style="{ width: (s.pagos.pctEfectivo || 0) + '%' }"></span>
              <span class="vv-pb vv-pb-otros" :style="{ width: (s.pagos.pctOtros || 0) + '%' }"></span>
            </div>
            <div class="vv-pagos-leyenda">
              <span class="vv-pl"><i class="vv-pl-dot vv-pl-tarjeta"></i>Tarjeta {{ fmt(s.pagos.tarjeta) }} · {{ num(s.pagos.pctTarjeta) }}%</span>
              <span class="vv-pl"><i class="vv-pl-dot vv-pl-efectivo"></i>Efectivo {{ fmt(s.pagos.efectivo) }} · {{ num(s.pagos.pctEfectivo) }}%</span>
              <span v-if="s.pagos.otros" class="vv-pl"><i class="vv-pl-dot vv-pl-otros"></i>Otros {{ fmt(s.pagos.otros) }} · {{ num(s.pagos.pctOtros) }}%</span>
              <span v-if="s.pagos.propinas" class="vv-pl vv-pl-propina">Propinas {{ fmt(s.pagos.propinas) }}</span>
            </div>
          </div>

          <div class="vv-tabs">
            <button class="vv-tab" :class="tabDe(s.codigo) === 'ordenes' && 'vv-tab-on'"
              @click="setTab(s.codigo, 'ordenes')">
              Órdenes <span class="vv-tab-n">{{ s.totalOrdenesDia ?? s.listaOrdenes.length }}</span>
            </button>
            <button class="vv-tab" :class="tabDe(s.codigo) === 'productos' && 'vv-tab-on'"
              @click="setTab(s.codigo, 'productos')">
              Productos <span class="vv-tab-n">{{ s.productos.length }}</span>
            </button>
            <button class="vv-tab" :class="tabDe(s.codigo) === 'consumo' && 'vv-tab-on'"
              @click="setTab(s.codigo, 'consumo')">
              Inventario <span class="vv-tab-n">{{ s.consumo.length }}</span>
            </button>
          </div>

          <div v-if="tabDe(s.codigo) === 'ordenes'" class="vv-scroll">
            <div v-if="!s.listaOrdenes.length" class="vv-vacio vv-vacio-sm"><p>Sin órdenes</p></div>
            <template v-else>
              <div v-if="s.totalOrdenesDia > s.listaOrdenes.length" class="vv-recorte">
                Mostrando las {{ s.listaOrdenes.length }} más recientes de {{ s.totalOrdenesDia }}.
                Los totales de arriba sí incluyen toda la jornada.
              </div>
            </template>
            <TransitionGroup v-if="s.listaOrdenes.length" name="vv-lista" tag="div" class="vv-ordenes">
              <div v-for="o in s.listaOrdenes" :key="o.id" class="vv-orden"
                :class="{ 'vv-orden-cancelada': o.estado === 'CANCELED' }">
                <div class="vv-orden-top">
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
                <div v-if="o.estado === 'CANCELED'" class="vv-cancelada-tag">Cancelada — no suma</div>
              </div>
            </TransitionGroup>
          </div>

          <div v-else-if="tabDe(s.codigo) === 'productos'" class="vv-scroll">
            <div v-if="!s.productos.length" class="vv-vacio vv-vacio-sm"><p>Sin productos</p></div>
            <table v-else class="vv-tabla">
              <thead><tr><th>PRODUCTO</th><th class="r">CANT</th><th class="r">TOTAL</th></tr></thead>
              <tbody>
                <tr v-for="p in s.productos" :key="p.sku || p.nombre">
                  <td>{{ p.nombre }}</td>
                  <td class="r b">{{ num(p.cantidad) }}</td>
                  <td class="r dim">{{ fmt(p.total) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="vv-scroll">
            <div v-if="s.consumo.length" class="vv-filtros">
              <button class="vv-filtro" :class="filtroDe(s.codigo) === 'todos' && 'vv-filtro-on'"
                @click="setFiltro(s.codigo, 'todos')">
                Todos <span class="vv-tab-n">{{ s.consumo.length }}</span>
              </button>
              <button class="vv-filtro vv-filtro-critico" :class="filtroDe(s.codigo) === 'critico' && 'vv-filtro-on'"
                @click="setFiltro(s.codigo, 'critico')">
                Crítico <span class="vv-tab-n">{{ conteoNivel(s, 'critico') }}</span>
              </button>
              <button class="vv-filtro vv-filtro-bajo" :class="filtroDe(s.codigo) === 'bajo' && 'vv-filtro-on'"
                @click="setFiltro(s.codigo, 'bajo')">
                Bajo <span class="vv-tab-n">{{ conteoNivel(s, 'bajo') }}</span>
              </button>
              <button class="vv-filtro vv-filtro-normal" :class="filtroDe(s.codigo) === 'normal' && 'vv-filtro-on'"
                @click="setFiltro(s.codigo, 'normal')">
                Normal <span class="vv-tab-n">{{ conteoNivel(s, 'normal') }}</span>
              </button>
            </div>

            <div v-if="!s.consumo.length" class="vv-vacio vv-vacio-sm"><p>Sin consumo calculado</p></div>
            <div v-else-if="!consumoFiltrado(s).length" class="vv-vacio vv-vacio-sm"><p>Nada con este filtro</p></div>
            <table v-else class="vv-tabla">
              <thead>
                <tr>
                  <th class="vv-th" @click="ordenar(s.codigo, 'nombre')">ARTÍCULO<span class="vv-th-i">{{ flecha(s, 'nombre') }}</span></th>
                  <th class="r vv-th" @click="ordenar(s.codigo, 'inicial')">INICIAL<span class="vv-th-i">{{ flecha(s, 'inicial') }}</span></th>
                  <th class="r vv-th" @click="ordenar(s.codigo, 'cantidad')">CONSUMIDO<span class="vv-th-i">{{ flecha(s, 'cantidad') }}</span></th>
                  <th class="r vv-th" @click="ordenar(s.codigo, 'saldo')">SALDO<span class="vv-th-i">{{ flecha(s, 'saldo') }}</span></th>
                  <th class="vv-th" @click="ordenar(s.codigo, 'und')">UND<span class="vv-th-i">{{ flecha(s, 'und') }}</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in consumoFiltrado(s)" :key="c.codigo" :class="nivelSaldo(c) === 'critico' && 'vv-negativo'">
                  <td>{{ c.nombre }}</td>
                  <td class="r dim">{{ c.inicial === null ? '—' : num(c.inicial) }}</td>
                  <td class="r">−{{ num(c.cantidad) }}</td>
                  <td class="r b" :class="saldoClase(c)">
                    {{ c.saldo === null ? '—' : num(c.saldo) }}
                  </td>
                  <td class="dim">{{ c.und || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>

      <div class="vv-nota">
        <strong>Saldo proyectado</strong> = existencias con las que abrió el servicio, menos el
        consumo calculado a partir de las recetas de lo vendido hasta ahora. Es una proyección
        informativa e independiente por centro de costo: el descargue real de inventario lo sigue
        haciendo la importación del archivo de Square al cierre del día.
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

// Colorea el saldo proyectado: rojo si ya está en negativo, ámbar si queda
// menos de lo que se lleva consumido (va camino a agotarse en la jornada).
// Se marca en rojo cuando queda menos del 15% de lo que habia al abrir el
// servicio: esperar a que llegue a cero avisa demasiado tarde para reponer.
const UMBRAL_CRITICO = 0.15

function nivelSaldo(c) {
  if (c.saldo === null || c.saldo === undefined) return ''
  if (c.saldo < 0) return 'critico'
  if (c.inicial > 0 && c.saldo < c.inicial * UMBRAL_CRITICO) return 'critico'
  // Ambar: queda menos de lo ya consumido en la jornada
  if (c.cantidad > 0 && c.saldo < c.cantidad) return 'bajo'
  return ''
}

function saldoClase(c) {
  const n = nivelSaldo(c)
  return n === 'critico' ? 'vv-saldo-neg' : n === 'bajo' ? 'vv-saldo-bajo' : ''
}

// Pestaña activa de cada panel (por código de sede)
const tabs = ref({})
const tabDe  = (codigo) => tabs.value[codigo] || 'ordenes'
const setTab = (codigo, t) => { tabs.value = { ...tabs.value, [codigo]: t } }

const hayPagos = (s) => s.pagos && (s.pagos.tarjeta || s.pagos.efectivo || s.pagos.otros || s.pagos.propinas)

// Filtro por nivel de saldo (crítico/bajo/normal) y orden por columna,
// ambos independientes por centro de costo.
const filtroInv = ref({})
const filtroDe  = (codigo) => filtroInv.value[codigo] || 'todos'
const setFiltro = (codigo, f) => { filtroInv.value = { ...filtroInv.value, [codigo]: f } }

function conteoNivel(s, nivel) {
  return s.consumo.filter(c => (nivelSaldo(c) || 'normal') === nivel).length
}

const ordenInv = ref({})
const ordenDe  = (codigo) => ordenInv.value[codigo] || { col: 'nombre', dir: 1 }
function ordenar(codigo, col) {
  const actual = ordenDe(codigo)
  const dir = actual.col === col ? -actual.dir : 1
  ordenInv.value = { ...ordenInv.value, [codigo]: { col, dir } }
}
function flecha(s, col) {
  const o = ordenDe(s.codigo)
  if (o.col !== col) return ''
  return o.dir === 1 ? ' ▲' : ' ▼'
}

function consumoFiltrado(s) {
  const filtro = filtroDe(s.codigo)
  const lista = filtro === 'todos' ? s.consumo : s.consumo.filter(c => (nivelSaldo(c) || 'normal') === filtro)
  const { col, dir } = ordenDe(s.codigo)
  const arr = [...lista]
  arr.sort((a, b) => {
    if (col === 'nombre' || col === 'und') {
      return dir * String(a[col] || '').localeCompare(String(b[col] || ''), 'es')
    }
    const va = a[col] === null || a[col] === undefined ? -Infinity : parseFloat(a[col])
    const vb = b[col] === null || b[col] === undefined ? -Infinity : parseFloat(b[col])
    return dir * (va - vb)
  })
  return arr
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

/* Un panel por centro de costo */
.vv-paneles { display: grid; grid-template-columns: repeat(auto-fit, minmax(330px, 1fr)); gap: 16px; align-items: start; }
.vv-panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface),.08);
  border-left: 3px solid var(--success);
  border-radius: 12px; padding: 15px 16px;
}
.vv-panel-hdr { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.vv-panel-nom { font-size: 15px; font-weight: 800; }
.vv-panel-total { font-size: 19px; font-weight: 900; font-variant-numeric: tabular-nums; color: var(--success); }
.vv-panel-meta { font-size: 10.5px; color: rgba(var(--v-theme-on-surface),.45); margin-top: 2px; }

.vv-tabs { display: flex; gap: 5px; margin: 12px 0 10px; flex-wrap: wrap; }
.vv-tab {
  display: flex; align-items: center; gap: 5px;
  border: 1px solid rgba(var(--v-theme-on-surface),.12);
  background: transparent; color: rgba(var(--v-theme-on-surface),.6);
  font-size: 11px; font-weight: 600;
  padding: 5px 10px; border-radius: 8px; cursor: pointer;
}
.vv-tab:hover { border-color: var(--indigo); color: var(--indigo); }
.vv-tab-on { background: var(--indigo-wash); border-color: var(--indigo); color: var(--indigo); }
.vv-tab-n {
  font-size: 9.5px; font-weight: 800;
  background: rgba(var(--v-theme-on-surface),.1);
  padding: 1px 5px; border-radius: 8px;
}
.vv-scroll { max-height: 340px; overflow-y: auto; }

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


.vv-tabla { width: 100%; border-collapse: collapse; font-size: 11.5px; }
.vv-tabla thead th {
  position: sticky; top: 0; background: rgb(var(--v-theme-surface));
  text-align: left; padding: 6px 8px;
  font-size: 9.5px; font-weight: 800; letter-spacing: .4px;
  color: rgba(var(--v-theme-on-surface),.45);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),.1);
}
.vv-th { cursor: pointer; user-select: none; white-space: nowrap; }
.vv-th:hover { color: var(--indigo); }
.vv-th-i { display: inline-block; width: 10px; color: var(--indigo); }

/* Filtros por nivel de saldo */
.vv-filtros { display: flex; gap: 5px; margin-bottom: 8px; flex-wrap: wrap; }
.vv-filtro {
  display: flex; align-items: center; gap: 5px;
  border: 1px solid rgba(var(--v-theme-on-surface),.12);
  background: transparent; color: rgba(var(--v-theme-on-surface),.6);
  font-size: 10.5px; font-weight: 600;
  padding: 4px 9px; border-radius: 7px; cursor: pointer;
}
.vv-filtro:hover { border-color: rgba(var(--v-theme-on-surface),.3); }
.vv-filtro-on { color: rgb(var(--v-theme-surface)); border-color: transparent; }
.vv-filtro:not(.vv-filtro-critico):not(.vv-filtro-bajo):not(.vv-filtro-normal).vv-filtro-on { background: var(--indigo); }
.vv-filtro-critico.vv-filtro-on { background: var(--error); }
.vv-filtro-bajo.vv-filtro-on { background: var(--warning); }
.vv-filtro-normal.vv-filtro-on { background: var(--success); }

/* Desglose de medios de pago */
.vv-pagos { margin-top: 10px; }
.vv-pagos-barra {
  display: flex; height: 6px; border-radius: 4px; overflow: hidden;
  background: rgba(var(--v-theme-on-surface),.07);
}
.vv-pb { height: 100%; }
.vv-pb-tarjeta  { background: var(--indigo); }
.vv-pb-efectivo { background: var(--success); }
.vv-pb-otros    { background: var(--gold); }
.vv-pagos-leyenda {
  display: flex; flex-wrap: wrap; gap: 3px 12px; margin-top: 6px;
  font-size: 10.5px; color: rgba(var(--v-theme-on-surface),.55);
}
.vv-pl { display: inline-flex; align-items: center; gap: 5px; font-variant-numeric: tabular-nums; }
.vv-pl-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.vv-pl-tarjeta  { color: var(--indigo); }
.vv-pl-efectivo { color: var(--success); }
.vv-pl-otros    { color: var(--gold); }
.vv-pl-propina  { color: rgba(var(--v-theme-on-surface),.4); font-style: italic; }
.vv-tabla tbody td { padding: 5px 8px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.04); }
.vv-tabla .r { text-align: right; font-variant-numeric: tabular-nums; }
.vv-tabla .b { font-weight: 700; }
.vv-tabla .dim { color: rgba(var(--v-theme-on-surface),.5); }
.vv-recorte {
  font-size: 10.5px; line-height: 1.4;
  color: rgba(var(--v-theme-on-surface),.5);
  padding: 6px 8px; margin-bottom: 6px;
  background: rgba(var(--v-theme-on-surface),.04); border-radius: 7px;
}
.vv-saldo-neg  { color: var(--error); }
.vv-saldo-bajo { color: var(--warning); }
.vv-negativo td { background: rgba(220,38,38,.05); }
.vv-nota { font-size: 10.5px; line-height: 1.45; color: rgba(var(--v-theme-on-surface),.45); margin-top: 10px; }

@media (prefers-reduced-motion: reduce) {
  .vv-estado-vivo .vv-punto { animation: none; }
  .vv-lista-enter-active, .vv-lista-move { transition: none; }
}
</style>
