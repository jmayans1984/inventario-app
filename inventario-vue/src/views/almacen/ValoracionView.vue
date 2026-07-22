<template>
  <MainLayout>
    <div class="vm-wrap">

      <!-- BREADCRUMB -->
      <div class="vm-breadcrumb">
        <span class="bc-root">ALMACÉN</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Procesos</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Valoración Mensual de Inventario</span>
      </div>

      <!-- HEADER -->
      <div class="vm-header">
        <div class="vm-header-left">
          <div class="vm-icon-wrap">
            <v-icon size="24" color="white">mdi-calculator-variant</v-icon>
          </div>
          <div>
            <h1 class="vm-title">VALORACIÓN MENSUAL DE INVENTARIO</h1>
            <p class="vm-sub">Consumo real de materia prima por juego de inventarios (Inv. Inicial + Compras − Inv. Final)</p>
          </div>
        </div>
        <div class="vm-header-right">
          <input type="month" v-model="mesSel" class="mes-input" />
          <v-btn color="#06b6d4" variant="flat" prepend-icon="mdi-refresh" :loading="loading" rounded="lg" @click="cargar">
            Actualizar
          </v-btn>
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="loading" class="vm-loading">
        <v-progress-circular indeterminate color="#06b6d4" size="48" />
        <p>Valorizando inventario de todos los centros de costo...</p>
      </div>

      <template v-else-if="data">

        <!-- AVISO: cuenta de materia prima no configurada -->
        <div v-if="!data.ctaMateriaPrima" class="vm-warning">
          <v-icon size="20" color="#ef4444">mdi-alert-circle-outline</v-icon>
          <span>No hay configurada la <b>Cuenta Contable Materia Prima (Entrada de Almacén)</b> en Configuración General. Las compras del período se calcularán en $0 hasta que la configures.</span>
        </div>

        <!-- KPI CARDS -->
        <div class="vm-kpis">
          <div class="vm-kpi">
            <div class="vm-kpi-accent" style="background:#8b5cf6"></div>
            <div class="vm-kpi-icon" style="background:rgba(139,92,246,0.12)">
              <v-icon size="20" color="#8b5cf6">mdi-archive-outline</v-icon>
            </div>
            <div class="vm-kpi-body">
              <div class="vm-kpi-lbl">Inventario Inicial</div>
              <div class="vm-kpi-val" style="color:#8b5cf6">{{ fmt(data.kpis.valorInicial) }}</div>
              <div class="vm-kpi-sub">toma física al {{ fechaCorteInicialTxt }}</div>
            </div>
            <button class="vm-kpi-detail-btn" @click="showDetalleInicial = true" title="Ver detalle">
              <v-icon size="16">mdi-eye-outline</v-icon>
              <span>Detalles</span>
            </button>
          </div>
          <div class="vm-kpi">
            <div class="vm-kpi-accent" style="background:#0ea5e9"></div>
            <div class="vm-kpi-icon" style="background:rgba(14,165,233,0.12)">
              <v-icon size="20" color="#0ea5e9">mdi-truck-fast-outline</v-icon>
            </div>
            <div class="vm-kpi-body">
              <div class="vm-kpi-lbl">Compras del Mes</div>
              <div class="vm-kpi-val" style="color:#0ea5e9">{{ fmt(data.kpis.compras) }}</div>
              <div class="vm-kpi-sub">cuenta materia prima · {{ data.gastosMP.length }} gastos</div>
            </div>
            <button class="vm-kpi-detail-btn" @click="showDetalleCompras = true" title="Ver detalle">
              <v-icon size="16">mdi-eye-outline</v-icon>
              <span>Detalles</span>
            </button>
          </div>
          <div class="vm-kpi">
            <div class="vm-kpi-accent" style="background:#8b5cf6"></div>
            <div class="vm-kpi-icon" style="background:rgba(139,92,246,0.12)">
              <v-icon size="20" color="#8b5cf6">mdi-archive-check-outline</v-icon>
            </div>
            <div class="vm-kpi-body">
              <div class="vm-kpi-lbl">Inventario Final</div>
              <div class="vm-kpi-val" style="color:#8b5cf6">{{ fmt(data.kpis.valorFinal) }}</div>
              <div class="vm-kpi-sub">toma física al {{ data.periodo.hasta }}</div>
            </div>
            <button class="vm-kpi-detail-btn" @click="showDetalleFinal = true" title="Ver detalle">
              <v-icon size="16">mdi-eye-outline</v-icon>
              <span>Detalles</span>
            </button>
          </div>
          <div class="vm-kpi">
            <div class="vm-kpi-accent" style="background:#f97316"></div>
            <div class="vm-kpi-icon" style="background:rgba(249,115,22,0.12)">
              <v-icon size="20" color="#f97316">mdi-fire</v-icon>
            </div>
            <div class="vm-kpi-body">
              <div class="vm-kpi-lbl">Consumo Real MP</div>
              <div class="vm-kpi-val" style="color:#f97316">{{ fmt(data.kpis.consumoReal) }}</div>
              <div class="vm-kpi-sub">inicial + compras − final</div>
            </div>
          </div>
          <div class="vm-kpi">
            <div class="vm-kpi-accent" :style="{ background: data.kpis.itemsSinCosto > 0 ? '#ef4444' : '#22c55e' }"></div>
            <div class="vm-kpi-icon" :style="{ background: data.kpis.itemsSinCosto > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)' }">
              <v-icon size="20" :color="data.kpis.itemsSinCosto > 0 ? '#ef4444' : '#22c55e'">mdi-alert-outline</v-icon>
            </div>
            <div class="vm-kpi-body">
              <div class="vm-kpi-lbl">Items Sin Costo</div>
              <div class="vm-kpi-val" :style="{ color: data.kpis.itemsSinCosto > 0 ? '#ef4444' : '#22c55e' }">{{ data.kpis.itemsSinCosto }}</div>
              <div class="vm-kpi-sub">precio_costo = 0</div>
            </div>
          </div>
        </div>

        <!-- FILA 1: Fórmula visual + gráfica -->
        <div class="vm-card vm-card-full">
          <div class="vm-card-header">
            <v-icon size="18" color="#06b6d4">mdi-scale-balance</v-icon>
            <span class="vm-card-title">Juego de Inventarios — {{ mesLabel }}</span>
          </div>

          <!-- Fórmula visual: Inv. Inicial + Compras − Inv. Final = Consumo Real -->
          <div class="vm-formula">
            <div class="vm-formula-item">
              <div class="vm-formula-bar" style="background:#8b5cf6">
                <span class="vm-formula-val">{{ fmt(data.kpis.valorInicial) }}</span>
              </div>
              <div class="vm-formula-lbl">Inv. Inicial</div>
            </div>
            <div class="vm-formula-op">+</div>
            <div class="vm-formula-item">
              <div class="vm-formula-bar" style="background:#0ea5e9">
                <span class="vm-formula-val">{{ fmt(data.kpis.compras) }}</span>
              </div>
              <div class="vm-formula-lbl">Compras</div>
            </div>
            <div class="vm-formula-op">−</div>
            <div class="vm-formula-item">
              <div class="vm-formula-bar" style="background:#8b5cf6">
                <span class="vm-formula-val">{{ fmt(data.kpis.valorFinal) }}</span>
              </div>
              <div class="vm-formula-lbl">Inv. Final</div>
            </div>
            <div class="vm-formula-op">=</div>
            <div class="vm-formula-item vm-formula-result">
              <div class="vm-formula-bar" style="background:#f97316">
                <span class="vm-formula-val">{{ fmt(data.kpis.consumoReal) }}</span>
              </div>
              <div class="vm-formula-lbl">Consumo Real</div>
            </div>
          </div>

          <div ref="chartWaterfallRef" class="chart-area"></div>
        </div>

        <!-- DIALOGS DE DETALLE -->
        <v-dialog v-model="showDetalleInicial" max-width="700" scrollable>
          <v-card rounded="lg">
            <v-card-title class="d-flex align-center ga-2 pa-4" style="background:rgba(139,92,246,0.08)">
              <v-icon color="#8b5cf6">mdi-archive-outline</v-icon>
              Detalle — Inventario Inicial
            </v-card-title>
            <v-card-text class="pa-4">
              <p class="text-body-2 mb-3" style="color:rgba(var(--v-theme-on-surface),0.6)">
                Valor del inventario según la <b>toma física</b> vigente al <b>{{ fechaCorteInicialTxt }}</b> (día anterior al inicio del período).
                Se suma el valor (stock × precio_costo) de cada producto en cada centro de costo / bodega.
              </p>
              <table class="vm-table" v-if="data">
                <thead>
                  <tr>
                    <th>CENTRO DE COSTO</th>
                    <th class="tr">VALOR INICIAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="c in data.centros" :key="'di-' + c.ccosto" class="vm-tr">
                    <td class="font-weight-medium">
                      {{ c.nombre }}
                      <span v-if="c.esBodegaMaestra" class="badge-info">BODEGA MAESTRA</span>
                    </td>
                    <td class="tr">{{ fmt(c.valorInicial) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="vm-tr-total">
                    <td class="font-weight-bold">TOTAL</td>
                    <td class="tr font-weight-bold" style="color:#8b5cf6">{{ fmt(data.kpis.valorInicial) }}</td>
                  </tr>
                </tfoot>
              </table>
            </v-card-text>
            <v-card-actions class="pa-4 pt-0">
              <v-spacer />
              <v-btn variant="flat" color="#8b5cf6" @click="showDetalleInicial = false">Cerrar</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-dialog v-model="showDetalleFinal" max-width="700" scrollable>
          <v-card rounded="lg">
            <v-card-title class="d-flex align-center ga-2 pa-4" style="background:rgba(139,92,246,0.08)">
              <v-icon color="#8b5cf6">mdi-archive-check-outline</v-icon>
              Detalle — Inventario Final
            </v-card-title>
            <v-card-text class="pa-4">
              <p class="text-body-2 mb-3" style="color:rgba(var(--v-theme-on-surface),0.6)">
                Valor del inventario según la <b>toma física</b> vigente al <b>{{ data?.periodo?.hasta }}</b> (último día del período).
                Se suma el valor (stock × precio_costo) de cada producto en cada centro de costo / bodega.
              </p>
              <table class="vm-table" v-if="data">
                <thead>
                  <tr>
                    <th>CENTRO DE COSTO</th>
                    <th class="tr">VALOR FINAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="c in data.centros" :key="'df-' + c.ccosto" class="vm-tr">
                    <td class="font-weight-medium">
                      {{ c.nombre }}
                      <span v-if="c.esBodegaMaestra" class="badge-info">BODEGA MAESTRA</span>
                    </td>
                    <td class="tr">{{ fmt(c.valorFinal) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="vm-tr-total">
                    <td class="font-weight-bold">TOTAL</td>
                    <td class="tr font-weight-bold" style="color:#8b5cf6">{{ fmt(data.kpis.valorFinal) }}</td>
                  </tr>
                </tfoot>
              </table>
            </v-card-text>
            <v-card-actions class="pa-4 pt-0">
              <v-spacer />
              <v-btn variant="flat" color="#8b5cf6" @click="showDetalleFinal = false">Cerrar</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-dialog v-model="showDetalleCompras" max-width="850" scrollable>
          <v-card rounded="lg">
            <v-card-title class="d-flex align-center ga-2 pa-4" style="background:rgba(14,165,233,0.08)">
              <v-icon color="#0ea5e9">mdi-truck-fast-outline</v-icon>
              Detalle — Compras del Mes
            </v-card-title>
            <v-card-text class="pa-4">
              <p class="text-body-2 mb-3" style="color:rgba(var(--v-theme-on-surface),0.6)">
                Suma de todos los gastos registrados en la <b>cuenta contable de materia prima</b> durante el período.
                Incluye {{ data?.gastosMP?.length || 0 }} gasto(s).
              </p>
              <div class="vm-table-wrap">
                <table class="vm-table" v-if="data?.gastosMP?.length">
                  <thead>
                    <tr>
                      <th>FECHA</th>
                      <th>CÓDIGO</th>
                      <th>PROVEEDOR</th>
                      <th>CONCEPTO</th>
                      <th>FACTURA</th>
                      <th class="tr">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="g in data.gastosMP" :key="'dc-' + g.codigo" class="vm-tr">
                      <td>{{ g.fecha?.slice(0, 10) }}</td>
                      <td class="text-dim">{{ g.codigo }}</td>
                      <td>{{ g.proveedor_nombre }}</td>
                      <td class="text-dim">{{ g.concepto }}</td>
                      <td class="text-dim">{{ g.factura || '—' }}</td>
                      <td class="tr">{{ fmt(g.total) }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="vm-tr-total">
                      <td colspan="5" class="font-weight-bold">TOTAL COMPRAS MP</td>
                      <td class="tr font-weight-bold" style="color:#0ea5e9">{{ fmt(data.kpis.compras) }}</td>
                    </tr>
                  </tfoot>
                </table>
                <p v-else class="text-body-2" style="color:rgba(var(--v-theme-on-surface),0.45)">No hay gastos registrados en esta cuenta para el período.</p>
              </div>
            </v-card-text>
            <v-card-actions class="pa-4 pt-0">
              <v-spacer />
              <v-btn variant="flat" color="#0ea5e9" @click="showDetalleCompras = false">Cerrar</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- FILA 2: Asignación de consumo MP por centro de costo -->
        <div class="vm-card vm-card-full">
          <div class="vm-card-header">
            <v-icon size="18" color="#8b5cf6">mdi-store-outline</v-icon>
            <span class="vm-card-title">Consumo de Materia Prima por Centro de Costo</span>
            <span class="vm-card-badge">asignado proporcional a % de ventas</span>
          </div>
          <p class="vm-card-note">
            El consumo real total (<b>{{ fmt(data.kpis.consumoReal) }}</b>) se distribuye entre los centros de costo
            que tuvieron ventas en el período, en proporción a su participación sobre el total de ventas netas
            (<b>{{ fmt(data.kpis.totalVentasBase) }}</b>). La bodega maestra y los centros sin ventas (p.ej. administración) no reciben asignación.
          </p>
          <div class="vm-table-wrap">
            <table class="vm-table">
              <thead>
                <tr>
                  <th>CENTRO DE COSTO</th>
                  <th class="tr">VENTAS NETAS</th>
                  <th class="tr">% VENTAS</th>
                  <th class="tr">CONSUMO MP ASIGNADO</th>
                  <th class="tr">FOOD COST %</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in data.centros" :key="c.ccosto" class="vm-tr">
                  <td class="font-weight-medium">
                    {{ c.nombre }}
                    <span v-if="c.esBodegaMaestra" class="badge-info">BODEGA MAESTRA</span>
                    <span v-else-if="!c.incluidoEnAsignacion" class="badge-dim-tag">SIN VENTAS</span>
                  </td>
                  <td class="tr">{{ fmt(c.ventas) }}</td>
                  <td class="tr">{{ c.incluidoEnAsignacion ? c.pctVentas.toFixed(1) + '%' : '—' }}</td>
                  <td class="tr font-weight-bold" style="color:#f97316">{{ c.incluidoEnAsignacion ? fmt(c.consumoMP) : '—' }}</td>
                  <td class="tr font-weight-bold" :style="{ color: foodCostColor(c.foodCostPct) }">
                    {{ c.foodCostPct === null ? '—' : c.foodCostPct.toFixed(1) + '%' }}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="vm-tr-total">
                  <td class="font-weight-bold">TOTAL ASIGNADO</td>
                  <td class="tr font-weight-bold">{{ fmt(data.kpis.totalVentasBase) }}</td>
                  <td class="tr font-weight-bold">100%</td>
                  <td class="tr font-weight-bold" style="color:#f97316">{{ fmt(data.kpis.consumoReal) }}</td>
                  <td class="tr"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- FILA 3: Valorización de inventario por CC (toma física) -->
        <div class="vm-card vm-card-full">
          <div class="vm-card-header">
            <v-icon size="18" color="#8b5cf6">mdi-clipboard-check-outline</v-icon>
            <span class="vm-card-title">Valorización de Toma Física por Centro de Costo / Bodega</span>
          </div>
          <div class="vm-table-wrap">
            <table class="vm-table">
              <thead>
                <tr>
                  <th>CENTRO DE COSTO</th>
                  <th class="tr">VALOR INICIAL</th>
                  <th class="tr">VALOR FINAL</th>
                  <th class="tr">DIFERENCIA</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in data.centros" :key="'inv-' + c.ccosto" class="vm-tr">
                  <td class="font-weight-medium">
                    {{ c.nombre }}
                    <span v-if="c.esBodegaMaestra" class="badge-info">BODEGA MAESTRA</span>
                  </td>
                  <td class="tr">{{ fmt(c.valorInicial) }}</td>
                  <td class="tr">{{ fmt(c.valorFinal) }}</td>
                  <td class="tr font-weight-bold" :style="{ color: c.diferencia >= 0 ? '#22c55e' : '#ef4444' }">
                    {{ c.diferencia >= 0 ? '+' : '' }}{{ fmt(c.diferencia) }}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="vm-tr-total">
                  <td class="font-weight-bold">TOTAL EMPRESA</td>
                  <td class="tr font-weight-bold">{{ fmt(data.kpis.valorInicial) }}</td>
                  <td class="tr font-weight-bold">{{ fmt(data.kpis.valorFinal) }}</td>
                  <td class="tr font-weight-bold" :style="{ color: (data.kpis.valorFinal - data.kpis.valorInicial) >= 0 ? '#22c55e' : '#ef4444' }">
                    {{ (data.kpis.valorFinal - data.kpis.valorInicial) >= 0 ? '+' : '' }}{{ fmt(data.kpis.valorFinal - data.kpis.valorInicial) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- FILA 4: Detalle por producto (informativo) -->
        <div class="vm-card vm-card-full">
          <div class="vm-card-header">
            <v-icon size="18" color="#f97316">mdi-table</v-icon>
            <span class="vm-card-title">Valorización por Producto — Toma Física</span>
            <input v-model="filtroProducto" placeholder="Buscar producto..." class="vm-search" />
          </div>
          <div class="vm-table-wrap">
            <table class="vm-table">
              <thead>
                <tr>
                  <th>CÓDIGO</th>
                  <th>PRODUCTO</th>
                  <th>GRUPO</th>
                  <th class="tr">COSTO UNIT.</th>
                  <th class="tr">STOCK INICIAL</th>
                  <th class="tr">VALOR INICIAL</th>
                  <th class="tr">STOCK FINAL</th>
                  <th class="tr">VALOR FINAL</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in productosFiltrados" :key="p.codigo" class="vm-tr">
                  <td class="text-dim">{{ p.codigo }}</td>
                  <td class="font-weight-medium">
                    {{ p.nombre }}
                    <span v-if="p.precio_costo <= 0" class="badge-warn">SIN COSTO</span>
                  </td>
                  <td class="text-dim">{{ p.grupo_nombre }}</td>
                  <td class="tr">{{ fmt(p.precio_costo) }}</td>
                  <td class="tr">{{ numFmt(p.stockInicial) }} {{ p.und }}</td>
                  <td class="tr">{{ fmt(p.valorInicial) }}</td>
                  <td class="tr">{{ numFmt(p.stockFinal) }} {{ p.und }}</td>
                  <td class="tr">{{ fmt(p.valorFinal) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- FILA 5: Gastos incluidos en la cuenta de materia prima -->
        <div class="vm-card vm-card-full">
          <div class="vm-card-header">
            <v-icon size="18" color="#0ea5e9">mdi-receipt-text-outline</v-icon>
            <span class="vm-card-title">Gastos del Mes en Cuenta Materia Prima</span>
          </div>
          <div v-if="!data.gastosMP.length" class="vm-empty-inline">No hay gastos registrados en esta cuenta para el período seleccionado.</div>
          <div v-else class="vm-table-wrap">
            <table class="vm-table">
              <thead>
                <tr>
                  <th>FECHA</th>
                  <th>CÓDIGO</th>
                  <th>PROVEEDOR</th>
                  <th>CONCEPTO</th>
                  <th>FACTURA</th>
                  <th class="tr">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="g in data.gastosMP" :key="g.codigo" class="vm-tr">
                  <td>{{ g.fecha?.slice(0, 10) }}</td>
                  <td class="text-dim">{{ g.codigo }}</td>
                  <td>{{ g.proveedor_nombre }}</td>
                  <td class="text-dim">{{ g.concepto }}</td>
                  <td class="text-dim">{{ g.factura || '—' }}</td>
                  <td class="tr">{{ fmt(g.total) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="vm-tr-total">
                  <td colspan="5" class="font-weight-bold">TOTAL COMPRAS MP</td>
                  <td class="tr font-weight-bold">{{ fmt(data.kpis.compras) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </template>

      <div v-else-if="!loading" class="vm-empty">
        <v-icon size="56" color="#94a3b8">mdi-calculator-variant</v-icon>
        <p>Selecciona un mes y presiona Actualizar para calcular la valoración.</p>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { API_BASE } from '../../utils/constants.js'
import { useAuthStore } from '../../stores/auth'
import ApexCharts from 'apexcharts'

const authStore = useAuthStore()
const empresa = computed(() =>
  authStore.empresaCodigo || authStore.empresa || localStorage.getItem('empresaActual') || ''
)

// ── Estado ──────────────────────────────────────────────────────────────────
const loading = ref(false)
const data    = ref(null)
const filtroProducto = ref('')
const showDetalleInicial = ref(false)
const showDetalleFinal   = ref(false)
const showDetalleCompras = ref(false)

function mesActualStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
const mesSel = ref(mesActualStr())

const mesLabel = computed(() => {
  if (!mesSel.value) return ''
  const [y, m] = mesSel.value.split('-').map(Number)
  const nombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return `${nombres[m - 1]} ${y}`
})

const fechaCorteInicialTxt = computed(() => {
  if (!data.value) return ''
  const d = new Date(data.value.periodo.desde + 'T00:00:00')
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
})

const productosFiltrados = computed(() => {
  if (!data.value) return []
  const q = filtroProducto.value.trim().toLowerCase()
  if (!q) return data.value.productos
  return data.value.productos.filter(p =>
    p.nombre.toLowerCase().includes(q) || String(p.codigo).toLowerCase().includes(q)
  )
})

// ── Formatters ──────────────────────────────────────────────────────────────
function fmt(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function numFmt(v) {
  return (parseFloat(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function foodCostColor(v) {
  if (v === null || v === undefined) return '#94a3b8'
  if (v > 40) return '#ef4444'
  if (v > 30) return '#f97316'
  return '#22c55e'
}

// ── Carga ───────────────────────────────────────────────────────────────────
function rangoMes(mesStr) {
  const [y, m] = mesStr.split('-').map(Number)
  const desde = `${y}-${String(m).padStart(2, '0')}-01`
  const ultimoDia = new Date(y, m, 0).getDate()
  const hasta = `${y}-${String(m).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
  return { desde, hasta }
}

async function cargar() {
  if (!empresa.value || !mesSel.value) return
  loading.value = true
  try {
    const { desde, hasta } = rangoMes(mesSel.value)
    const params = new URLSearchParams({ empresa: empresa.value, desde, hasta })
    const res = await fetch(`${API_BASE}/almacen/valoracion-mensual?${params}`)
    const j   = await res.json()
    if (!j.success) throw new Error(j.error)
    data.value = j
    loading.value = false
    await nextTick()
    renderCharts()
  } catch (e) {
    console.error('valoracion-mensual:', e)
    loading.value = false
  }
}

// ── Gráficas ─────────────────────────────────────────────────────────────────
function isDark() {
  return document.documentElement.classList.contains('v-theme--dark') ||
         document.body.classList.contains('v-theme--dark')
}
function themeColors() {
  return isDark()
    ? { fg: '#94a3b8', grid: 'rgba(255,255,255,0.06)' }
    : { fg: '#64748b', grid: 'rgba(0,0,0,0.06)' }
}

let chartWaterfall = null
function destroyAll() {
  chartWaterfall?.destroy(); chartWaterfall = null
}

function renderCharts() {
  destroyAll()
  if (!data.value) return
  renderWaterfall()
}

function renderWaterfall() {
  if (!chartWaterfallRef.value || !data.value) return
  const { fg, grid } = themeColors()
  const k = data.value.kpis

  const categorias = ['Inv. Inicial', 'Compras', 'Inv. Final', 'Consumo Real']
  const colores      = ['#8b5cf6', '#0ea5e9', '#8b5cf6', '#f97316']

  chartWaterfall = new ApexCharts(chartWaterfallRef.value, {
    chart: { type: 'bar', height: 340, toolbar: { show: false }, fontFamily: 'Inter,sans-serif', background: 'transparent', animations: { enabled: true, speed: 600, animateGradually: { enabled: true, delay: 80 } } },
    theme: { mode: isDark() ? 'dark' : 'light' },
    series: [{ name: 'Valor', data: [k.valorInicial, k.compras, k.valorFinal, k.consumoReal] }],
    colors: colores,
    plotOptions: { bar: { columnWidth: '45%', borderRadius: 6, distributed: true, borderRadiusApplication: 'end' } },
    dataLabels: { enabled: true, formatter: v => fmt(v), style: { fontSize: '12px', fontWeight: 700 }, offsetY: -22 },
    xaxis: {
      categories: categorias,
      labels: { style: { colors: fg, fontSize: '12px', fontWeight: 700 } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: fg }, formatter: v => fmt(v) } },
    grid:  { borderColor: grid, strokeDashArray: 4, padding: { top: 20 } },
    legend: { show: false },
    tooltip: { y: { formatter: v => fmt(v) } },
  })
  chartWaterfall.render()
}

const chartWaterfallRef = ref(null)

onMounted(cargar)
onBeforeUnmount(destroyAll)
</script>

<style scoped>
.vm-wrap { padding: 0 0 32px; }

/* BREADCRUMB */
.vm-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: rgba(var(--v-theme-on-surface), 0.4); text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.25); }
.bc-cat { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-current { font-size: 11px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }

/* HEADER */
.vm-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.vm-header-left { display: flex; align-items: center; gap: 16px; }
.vm-icon-wrap {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  display: flex; align-items: center; justify-content: center;
}
.vm-title { font-size: 22px; font-weight: 800; margin: 0 0 2px; color: rgb(var(--v-theme-on-surface)); }
.vm-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 0; }
.vm-header-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.mes-input {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
  border-radius: 10px; padding: 8px 12px; font-size: 13px; font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

/* AVISO */
.vm-warning {
  display: flex; align-items: center; gap: 10px;
  background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25);
  color: rgb(var(--v-theme-on-surface)); border-radius: 10px;
  padding: 12px 16px; font-size: 13px; margin-bottom: 18px;
}

/* LOADING / EMPTY */
.vm-loading, .vm-empty {
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  padding: 80px 0; color: rgba(var(--v-theme-on-surface), 0.5); font-size: 14px;
}
.vm-empty-inline { padding: 24px 0; color: rgba(var(--v-theme-on-surface), 0.45); font-size: 13px; text-align: center; }

/* KPIs */
.vm-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 20px; }
.vm-kpi {
  position: relative; display: flex; align-items: center; gap: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px; padding: 16px 18px; overflow: hidden;
}
.vm-kpi-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
.vm-kpi-icon { width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.vm-kpi-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.45); }
.vm-kpi-val { font-size: 19px; font-weight: 800; line-height: 1.2; margin: 2px 0; }
.vm-kpi-sub { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.4); }

/* CARDS */
.vm-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px; padding: 18px 20px; margin-bottom: 18px;
}
.vm-card-full { width: 100%; }
.vm-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.vm-card-title { font-size: 13.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: rgb(var(--v-theme-on-surface)); flex: 1; }
.vm-card-badge {
  font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px;
  background: rgba(139,92,246,0.1); color: #8b5cf6; white-space: nowrap;
}
.vm-card-note {
  font-size: 12.5px; color: rgba(var(--v-theme-on-surface), 0.55);
  margin: -4px 0 14px; line-height: 1.5;
}

.vm-search {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-radius: 8px; padding: 6px 12px; font-size: 12.5px;
  color: rgb(var(--v-theme-on-surface)); width: 220px;
}

/* FORMULA VISUAL */
.vm-formula {
  display: flex; align-items: center; justify-content: center; gap: 0;
  padding: 24px 12px 18px; flex-wrap: wrap;
}
.vm-formula-item {
  display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 120px; flex: 1; max-width: 200px;
}
.vm-formula-bar {
  width: 100%; border-radius: 10px; padding: 16px 10px; text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
}
.vm-formula-val {
  font-size: 16px; font-weight: 800; color: #fff; white-space: nowrap;
}
.vm-formula-lbl {
  font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;
  color: rgba(var(--v-theme-on-surface), 0.55);
}
.vm-formula-result .vm-formula-bar {
  box-shadow: 0 2px 12px rgba(249,115,22,0.3);
}
.vm-formula-op {
  font-size: 36px; font-weight: 900; color: rgba(var(--v-theme-on-surface), 0.3);
  padding: 0 16px; line-height: 1; margin-bottom: 22px; user-select: none;
}

/* KPI DETAIL BUTTON */
.vm-kpi-detail-btn {
  position: absolute; top: 8px; right: 8px;
  display: flex; align-items: center; gap: 4px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: none; border-radius: 8px; padding: 4px 10px;
  font-size: 11px; font-weight: 700; cursor: pointer;
  color: rgba(var(--v-theme-on-surface), 0.5);
  transition: all 0.15s ease;
}
.vm-kpi-detail-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.12);
  color: rgba(var(--v-theme-on-surface), 0.8);
}

.chart-area { min-height: 340px; }

/* TABLA */
.vm-table-wrap { overflow-x: auto; }
.vm-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.vm-table th {
  text-align: left; font-size: 10.5px; font-weight: 800; letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.45); text-transform: uppercase;
  padding: 10px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  white-space: nowrap;
}
.vm-table td { padding: 10px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); white-space: nowrap; }
.vm-table .tr { text-align: right; }
.vm-tr:hover { background: rgba(var(--v-theme-on-surface), 0.03); }
.vm-tr-total td { border-top: 2px solid rgba(var(--v-theme-on-surface), 0.15); border-bottom: none; }
.text-dim { color: rgba(var(--v-theme-on-surface), 0.45); }

.badge-info {
  background: rgba(6,182,212,0.12); color: #06b6d4;
  font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 8px; margin-left: 6px;
}
.badge-warn {
  background: rgba(239,68,68,0.12); color: #ef4444;
  font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 8px; margin-left: 6px;
}
.badge-dim-tag {
  background: rgba(148,163,184,0.12); color: #94a3b8;
  font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 8px; margin-left: 6px;
}
</style>
