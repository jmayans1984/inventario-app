<template>
  <MainLayout>
    <div class="iv-wrap">

      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">TESORERÍA</span>
        <v-icon size="13" color="#06b6d4">mdi-chevron-right</v-icon>
        <span class="bc-cat">Procesos</span>
        <v-icon size="13" color="#475569">mdi-chevron-right</v-icon>
        <span class="bc-cur">Importar Ventas Square</span>
      </div>

      <!-- HEADER -->
      <div class="iv-header">
        <div class="iv-header-left">
          <div class="iv-icon-wrap">
            <v-icon size="26" color="white">mdi-storefront-outline</v-icon>
          </div>
          <div>
            <h1 class="iv-title">IMPORTAR VENTAS SQUARE</h1>
            <p class="iv-sub">Carga los dos CSV exportados desde Square para ver el resumen del período</p>
          </div>
        </div>
      </div>

      <!-- ZONA DE CARGA -->
      <div class="iv-upload-row">

        <!-- Resumen de ventas -->
        <div
          class="drop-zone"
          :class="{ 'drop-zone--active': dragging[0], 'drop-zone--loaded': resumen }"
          @dragover.prevent="dragging[0] = true"
          @dragleave="dragging[0] = false"
          @drop.prevent="onDrop($event, 'resumen')"
          @click="$refs.inputResumen.click()"
        >
          <input ref="inputResumen" type="file" accept=".csv" hidden @change="onFileInput($event, 'resumen')" />
          <div v-if="!resumen" class="drop-content">
            <div class="drop-icon-wrap drop-icon-blue">
              <v-icon size="28" color="white">mdi-file-chart-outline</v-icon>
            </div>
            <div class="drop-title">Resumen de Ventas</div>
            <div class="drop-sub">Arrastra o haz click para cargar</div>
            <div class="drop-hint"><code>resumen_ventas-YYYY-MM-DD.csv</code></div>
          </div>
          <div v-else class="drop-loaded">
            <v-icon size="32" color="#10b981">mdi-check-circle</v-icon>
            <div class="drop-loaded-name">{{ resumenFileName }}</div>
            <div class="drop-loaded-sub">{{ resumen.periodo }}</div>
            <v-btn size="x-small" variant="text" color="#94a3b8" @click.stop="limpiar('resumen')">
              <v-icon size="14">mdi-close</v-icon> Quitar
            </v-btn>
          </div>
        </div>

        <!-- Artículos vendidos -->
        <div
          class="drop-zone"
          :class="{ 'drop-zone--active': dragging[1], 'drop-zone--loaded': articulos }"
          @dragover.prevent="dragging[1] = true"
          @dragleave="dragging[1] = false"
          @drop.prevent="onDrop($event, 'articulos')"
          @click="$refs.inputArticulos.click()"
        >
          <input ref="inputArticulos" type="file" accept=".csv" hidden @change="onFileInput($event, 'articulos')" />
          <div v-if="!articulos" class="drop-content">
            <div class="drop-icon-wrap drop-icon-purple">
              <v-icon size="28" color="white">mdi-package-variant-closed</v-icon>
            </div>
            <div class="drop-title">Artículos Vendidos</div>
            <div class="drop-sub">Arrastra o haz click para cargar</div>
            <div class="drop-hint"><code>ventas_articulos-YYYY-MM-DD.csv</code></div>
          </div>
          <div v-else class="drop-loaded">
            <v-icon size="32" color="#10b981">mdi-check-circle</v-icon>
            <div class="drop-loaded-name">{{ articulosFileName }}</div>
            <div class="drop-loaded-sub">{{ articulos.items.length }} artículos · {{ articulos.modificadores.length }} modificadores</div>
            <v-btn size="x-small" variant="text" color="#94a3b8" @click.stop="limpiar('articulos')">
              <v-icon size="14">mdi-close</v-icon> Quitar
            </v-btn>
          </div>
        </div>

      </div>

      <!-- ERROR DE PARSEO -->
      <div v-if="parseError" class="iv-error">
        <v-icon size="20" color="#ef4444">mdi-alert-circle-outline</v-icon>
        <span>{{ parseError }}</span>
      </div>

      <!-- ═══════════════════════════════════════════════
           PREVIEW — RESUMEN
      ═══════════════════════════════════════════════ -->
      <div v-if="resumen" class="iv-section">

        <!-- Encabezado sección -->
        <div class="iv-section-header">
          <div class="iv-section-icon" style="background:rgba(59,130,246,0.1)">
            <v-icon size="16" color="#3b82f6">mdi-file-chart-outline</v-icon>
          </div>
          <div>
            <div class="iv-section-title">RESUMEN DE VENTAS</div>
            <div class="iv-section-sub">{{ resumen.ubicacion }} · {{ resumen.periodo }}</div>
          </div>
        </div>

        <!-- KPIs ventas -->
        <div class="kpi-grid kpi-grid-3">

          <div class="kpi-card kpi-blue">
            <div class="kpi-top">
              <span class="kpi-lbl">Ventas Brutas</span>
              <v-icon size="16" color="#3b82f6">mdi-cash-multiple</v-icon>
            </div>
            <div class="kpi-val kpi-val-blue">{{ fmt(resumen.ventas.ventasBrutas) }}</div>
          </div>

          <div class="kpi-card kpi-orange">
            <div class="kpi-top">
              <span class="kpi-lbl">Descuentos</span>
              <v-icon size="16" color="#f59e0b">mdi-tag-minus-outline</v-icon>
            </div>
            <div class="kpi-val kpi-val-orange">{{ fmt(resumen.ventas.descuentos) }}</div>
          </div>

          <div class="kpi-card kpi-green">
            <div class="kpi-top">
              <span class="kpi-lbl">Ventas Netas</span>
              <v-icon size="16" color="#10b981">mdi-trending-up</v-icon>
            </div>
            <div class="kpi-val kpi-val-green">{{ fmt(resumen.ventas.ventasNetas) }}</div>
          </div>

          <div class="kpi-card kpi-gray">
            <div class="kpi-top">
              <span class="kpi-lbl">Impuestos</span>
              <v-icon size="16" color="#64748b">mdi-percent-outline</v-icon>
            </div>
            <div class="kpi-val kpi-val-gray">{{ fmt(resumen.ventas.impuestos) }}</div>
          </div>

          <div class="kpi-card kpi-purple">
            <div class="kpi-top">
              <span class="kpi-lbl">Propinas</span>
              <v-icon size="16" color="#8b5cf6">mdi-hand-coin-outline</v-icon>
            </div>
            <div class="kpi-val kpi-val-purple">{{ fmt(resumen.ventas.propinas) }}</div>
          </div>

          <div class="kpi-card kpi-blue-dark">
            <div class="kpi-top">
              <span class="kpi-lbl">TOTAL</span>
              <v-icon size="16" color="#1d4ed8">mdi-sigma</v-icon>
            </div>
            <div class="kpi-val kpi-val-blue-dark">{{ fmt(resumen.ventas.total) }}</div>
          </div>

        </div>

        <!-- Tabla de pagos -->
        <div class="iv-card mt-16">
          <div class="iv-card-header">
            <div class="iv-card-title">
              <v-icon size="14" color="#10b981" class="mr-1">mdi-credit-card-outline</v-icon>
              Detalle de Pagos
            </div>
          </div>
          <div class="pagos-grid">
            <div class="pago-item" v-for="p in pagoItems" :key="p.label">
              <span class="pago-label">{{ p.label }}</span>
              <span class="pago-valor" :style="{ color: p.color }">{{ fmt(p.valor) }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- ═══════════════════════════════════════════════
           PREVIEW — ARTÍCULOS
      ═══════════════════════════════════════════════ -->
      <div v-if="articulos" class="iv-section">

        <div class="iv-section-header">
          <div class="iv-section-icon" style="background:rgba(139,92,246,0.1)">
            <v-icon size="16" color="#8b5cf6">mdi-package-variant-closed</v-icon>
          </div>
          <div>
            <div class="iv-section-title">ARTÍCULOS VENDIDOS</div>
            <div class="iv-section-sub">{{ articulos.ubicacion }} · {{ articulos.periodo }}</div>
          </div>
          <div v-if="enrichLoading" class="enrich-badge">
            <v-progress-circular size="14" width="2" indeterminate color="#8b5cf6" />
            <span>Cargando precios...</span>
          </div>
        </div>

        <!-- KPIs artículos -->
        <div class="kpi-grid kpi-grid-4">
          <div class="kpi-card kpi-purple">
            <div class="kpi-top">
              <span class="kpi-lbl">Artículos Distintos</span>
              <v-icon size="16" color="#8b5cf6">mdi-format-list-bulleted</v-icon>
            </div>
            <div class="kpi-val kpi-val-purple">{{ articulos.items.length }}</div>
          </div>
          <div class="kpi-card kpi-blue">
            <div class="kpi-top">
              <span class="kpi-lbl">Unidades Vendidas</span>
              <v-icon size="16" color="#3b82f6">mdi-counter</v-icon>
            </div>
            <div class="kpi-val kpi-val-blue">{{ totalUnidades }}</div>
          </div>
          <div class="kpi-card kpi-green">
            <div class="kpi-top">
              <span class="kpi-lbl">Ventas Brutas</span>
              <v-icon size="16" color="#10b981">mdi-cash</v-icon>
            </div>
            <div class="kpi-val kpi-val-green">{{ fmt(totalVentasBrutas) }}</div>
          </div>
          <div class="kpi-card kpi-green-dark">
            <div class="kpi-top">
              <span class="kpi-lbl">Ventas Netas</span>
              <v-icon size="16" color="#059669">mdi-trending-up</v-icon>
            </div>
            <div class="kpi-val kpi-val-green-dark">{{ fmt(totalVentasNetas) }}</div>
          </div>
        </div>

        <!-- Tabla de artículos agrupada por categoría -->
        <div class="iv-card">
          <div class="iv-card-header">
            <div class="iv-card-title">
              <v-icon size="14" color="#8b5cf6" class="mr-1">mdi-table</v-icon>
              Detalle por Artículo
            </div>
            <div class="iv-card-chips">
              <div
                v-for="cat in categorias"
                :key="cat"
                class="cat-chip"
                :class="{ 'cat-chip--active': catFiltro === cat }"
                @click="catFiltro = catFiltro === cat ? '' : cat"
              >{{ cat }}</div>
            </div>
          </div>

          <div class="art-tabla-wrap">
            <table class="art-tabla">
              <thead>
                <tr>
                  <th style="width:80px">SKU</th>
                  <th>ARTÍCULO</th>
                  <th class="col-right" style="width:70px">CANT.</th>
                  <th class="col-right" style="width:130px">VR. UNITARIO</th>
                  <th class="col-right" style="width:140px">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(grp, cat) in itemsAgrupados" :key="cat">
                  <tr class="tr-cat-header">
                    <td colspan="5">
                      <span class="cat-badge">{{ cat }}</span>
                    </td>
                  </tr>
                  <tr
                    v-for="(item, idx) in grp"
                    :key="item.sku + idx"
                    class="tr-item"
                  >
                    <td class="td-sku">{{ item.sku }}</td>
                    <td class="td-nombre">
                      {{ item.nombreReceta || item.nombre }}
                      <span v-if="item.variante && item.variante !== 'Regular'" class="variante-tag">{{ item.variante }}</span>
                    </td>
                    <td class="td-num col-right">{{ item.cantidad }}</td>
                    <td class="td-monto col-right txt-dim">{{ item.precioVenta != null ? fmt(item.precioVenta) : (item.cantidad > 0 ? fmt(item.ventasBrutas / item.cantidad) : '—') }}</td>
                    <td class="td-monto col-right txt-green">{{ fmt(itemSubtotal(item)) }}</td>
                  </tr>
                  <tr class="tr-subtotal">
                    <td colspan="2" class="subtotal-lbl">Subtotal {{ cat }}</td>
                    <td class="col-right subtotal-val">{{ subtotalCat(cat).cantidad }}</td>
                    <td class="col-right subtotal-val txt-dim">—</td>
                    <td class="col-right subtotal-val txt-green">{{ fmt(subtotalCat(cat).netas) }}</td>
                  </tr>
                </template>
              </tbody>
              <tfoot>
                <tr class="tr-total">
                  <td colspan="2" class="total-lbl">TOTAL GENERAL</td>
                  <td class="col-right total-val">{{ totalUnidades }}</td>
                  <td class="col-right total-val txt-dim">—</td>
                  <td class="col-right total-val txt-green">{{ fmt(totalVentasNetas) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Modificadores (colapsable) -->
        <div class="iv-card">
          <div class="iv-card-header" style="cursor:pointer" @click="mostrarMods = !mostrarMods">
            <div class="iv-card-title">
              <v-icon size="14" color="#f59e0b" class="mr-1">mdi-tune-variant</v-icon>
              Modificadores Vendidos
              <span class="mod-count">{{ articulos.modificadores.length }}</span>
            </div>
            <v-icon size="18" color="#94a3b8">{{ mostrarMods ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
          </div>
          <div v-if="mostrarMods" class="art-tabla-wrap">
            <table class="art-tabla">
              <thead>
                <tr>
                  <th>NOMBRE</th>
                  <th class="col-right" style="width:70px">CANT.</th>
                  <th class="col-right" style="width:130px">VR. ARTÍCULO</th>
                  <th class="col-right" style="width:140px">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(mods, grupo) in modificadoresAgrupados" :key="grupo">
                  <tr class="tr-cat-header tr-cat-orange">
                    <td colspan="4">
                      <span class="cat-badge cat-badge-orange">{{ grupo }}</span>
                    </td>
                  </tr>
                  <tr v-for="(m, i) in mods" :key="i" class="tr-item">
                    <td class="td-nombre">{{ m.modificador }}</td>
                    <td class="td-num col-right">{{ m.cantidadNeta }}</td>
                    <td class="td-monto col-right txt-dim">{{ m.cantidadNeta > 0 ? fmt(m.ventasNetas / m.cantidadNeta) : '—' }}</td>
                    <td class="td-monto col-right txt-orange">{{ m.ventasNetas > 0 ? fmt(m.ventasNetas) : '—' }}</td>
                  </tr>
                  <tr class="tr-subtotal">
                    <td class="subtotal-lbl">Subtotal {{ grupo }}</td>
                    <td class="col-right subtotal-val">{{ mods.reduce((s,m) => s + m.cantidadNeta, 0) }}</td>
                    <td class="col-right subtotal-val txt-dim">—</td>
                    <td class="col-right subtotal-val txt-orange">{{ fmt(mods.reduce((s,m) => s + m.ventasNetas, 0)) }}</td>
                  </tr>
                </template>
              </tbody>
              <tfoot>
                <tr class="tr-total">
                  <td class="total-lbl">TOTAL MODIFICADORES</td>
                  <td class="col-right total-val">{{ totalModUnidades }}</td>
                  <td class="col-right total-val txt-dim">—</td>
                  <td class="col-right total-val txt-orange">{{ fmt(totalModNetas) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </div>

      <!-- ═══════════════════════════════════════════════
           CONSUMO DE INVENTARIO
      ═══════════════════════════════════════════════ -->
      <div v-if="articulos" class="iv-section">

        <!-- Encabezado -->
        <div class="iv-section-header">
          <div class="iv-section-icon" style="background:rgba(239,68,68,0.1)">
            <v-icon size="16" color="#ef4444">mdi-package-down</v-icon>
          </div>
          <div>
            <div class="iv-section-title">CONSUMO DE INVENTARIO</div>
            <div class="iv-section-sub">Productos descontados del inventario según ventas del período</div>
          </div>
          <div v-if="consumoLoading" class="enrich-badge" style="color:#ef4444; margin-left:auto">
            <v-progress-circular size="14" width="2" indeterminate color="#ef4444" />
            <span>Calculando...</span>
          </div>
        </div>

        <!-- Error -->
        <div v-if="consumoError" class="iv-error">
          <v-icon size="18" color="#ef4444">mdi-alert-circle-outline</v-icon>
          <span>{{ consumoError }}</span>
        </div>

        <!-- Vacío sin error -->
        <div v-else-if="!consumoLoading && !consumo.length" class="consumo-empty">
          <v-icon size="32" color="rgba(var(--v-theme-on-surface),0.2)">mdi-package-variant-closed-remove</v-icon>
          <span>No se encontraron componentes de inventario para los SKUs vendidos</span>
          <span class="consumo-empty-hint">Verifica que los SKUs del CSV existen en la tabla <code>detalle_productos</code></span>
        </div>

        <!-- KPIs -->
        <div v-if="!consumoLoading && consumo.length" class="kpi-grid kpi-grid-3">
          <div class="kpi-card kpi-red">
            <div class="kpi-top">
              <span class="kpi-lbl">Productos Afectados</span>
              <v-icon size="16" color="#ef4444">mdi-package-variant-closed</v-icon>
            </div>
            <div class="kpi-val kpi-val-red">{{ consumo.length }}</div>
          </div>
          <div class="kpi-card kpi-orange">
            <div class="kpi-top">
              <span class="kpi-lbl">Recetas Involucradas</span>
              <v-icon size="16" color="#f59e0b">mdi-chef-hat</v-icon>
            </div>
            <div class="kpi-val kpi-val-orange">
              {{ new Set(consumo.flatMap(c => c.recetas.map(r => r.sku))).size }}
            </div>
          </div>
          <div class="kpi-card kpi-purple">
            <div class="kpi-top">
              <span class="kpi-lbl">Mayor Consumo</span>
              <v-icon size="16" color="#8b5cf6">mdi-trending-up</v-icon>
            </div>
            <div class="kpi-val kpi-val-purple" style="font-size:15px">
              {{ consumo[0]?.nombre || '—' }}
            </div>
          </div>
        </div>

        <!-- Tabla de consumo -->
        <div v-if="!consumoLoading && consumo.length" class="iv-card">
          <div class="iv-card-header">
            <div class="iv-card-title">
              <v-icon size="14" color="#ef4444" class="mr-1">mdi-clipboard-list-outline</v-icon>
              Detalle de Consumo por Producto
            </div>
            <div style="font-size:11px;color:rgba(var(--v-theme-on-surface),0.4)">
              Ordenado por mayor consumo
            </div>
          </div>

          <div class="art-tabla-wrap">
            <table class="art-tabla">
              <thead>
                <tr>
                  <th style="width:60px">#</th>
                  <th style="width:70px">CÓDIGO</th>
                  <th>DESCRIPCIÓN</th>
                  <th style="width:70px" class="col-right">UND</th>
                  <th style="width:140px" class="col-right">CONSUMO TOTAL</th>
                  <th style="width:220px">RECETAS QUE LO USAN</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(c, idx) in consumo"
                  :key="c.codigo"
                  class="tr-item tr-consumo"
                >
                  <!-- Número -->
                  <td class="td-idx">{{ idx + 1 }}</td>

                  <!-- Código -->
                  <td class="td-sku">{{ c.codigo }}</td>

                  <!-- Nombre + barra -->
                  <td class="td-nombre-consumo">
                    <div class="consumo-nombre">{{ c.nombre }}</div>
                    <div class="consumo-bar-wrap">
                      <div
                        class="consumo-bar"
                        :style="{ width: maxConsumo > 0 ? (c.totalConsumo / maxConsumo * 100).toFixed(1) + '%' : '0%' }"
                      ></div>
                    </div>
                  </td>

                  <!-- Unidad -->
                  <td class="col-right td-und">{{ c.und || '—' }}</td>

                  <!-- Consumo total -->
                  <td class="col-right">
                    <span class="consumo-total-val">{{ fmtNum(c.totalConsumo) }}</span>
                  </td>

                  <!-- Recetas que lo usan -->
                  <td class="td-recetas">
                    <div class="recetas-wrap">
                      <span
                        v-for="r in c.recetas"
                        :key="r.sku"
                        class="receta-chip"
                        :title="`${r.nombreReceta}: ${fmtNum(r.cantPorUnidad)} × ${r.vendidos} uds = ${fmtNum(r.subtotal)}`"
                      >
                        <span class="receta-sku">{{ r.sku }}</span>
                        <span class="receta-subtotal">{{ fmtNum(r.subtotal) }}</span>
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'

// ─── State ───────────────────────────────────────────────────
const resumen          = ref(null)
const articulos        = ref(null)
const resumenFileName  = ref('')
const articulosFileName= ref('')
const parseError       = ref('')
const dragging         = ref([false, false])
const catFiltro        = ref('')
const mostrarMods      = ref(false)
const enrichLoading    = ref(false)
const consumo          = ref([])
const consumoLoading   = ref(false)
const consumoError     = ref('')

// ─── Formatting ──────────────────────────────────────────────
function fmt(val) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(parseFloat(val || 0))
}

// Formateo numérico sin símbolo de moneda (para cantidades de consumo)
function fmtNum(val) {
  const n = parseFloat(val || 0)
  // Si el número tiene decimales significativos, los muestra (hasta 4)
  const decimals = n % 1 === 0 ? 0 : Math.min(4,
    (n.toString().split('.')[1] || '').replace(/0+$/, '').length
  )
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals > 0 ? 2 : 0,
    maximumFractionDigits: 4
  }).format(n)
}

// ─── Computed — artículos ─────────────────────────────────────
const categorias = computed(() => {
  if (!articulos.value) return []
  const cats = [...new Set(articulos.value.items.map(i => i.categoria))]
  return cats
})

const itemsFiltrados = computed(() => {
  if (!articulos.value) return []
  if (!catFiltro.value) return articulos.value.items
  return articulos.value.items.filter(i => i.categoria === catFiltro.value)
})

const itemsAgrupados = computed(() => {
  const groups = {}
  for (const item of itemsFiltrados.value) {
    if (!groups[item.categoria]) groups[item.categoria] = []
    groups[item.categoria].push(item)
  }
  return groups
})

function itemSubtotal(item) {
  return item.subtotal != null ? item.subtotal : item.ventasNetas
}

function subtotalCat(cat) {
  const items = itemsAgrupados.value[cat] || []
  return {
    cantidad:   items.reduce((s, i) => s + i.cantidad, 0),
    brutas:     items.reduce((s, i) => s + i.ventasBrutas, 0),
    descuentos: items.reduce((s, i) => s + i.descuentos, 0),
    netas:      items.reduce((s, i) => s + itemSubtotal(i), 0),
    impuestos:  items.reduce((s, i) => s + i.impuestos, 0),
  }
}

const totalUnidades     = computed(() => (articulos.value?.items || []).reduce((s, i) => s + i.cantidad, 0))
const totalVentasBrutas = computed(() => (articulos.value?.items || []).reduce((s, i) => s + i.ventasBrutas, 0))
const totalDescuentos   = computed(() => (articulos.value?.items || []).reduce((s, i) => s + i.descuentos, 0))
const totalVentasNetas  = computed(() => (articulos.value?.items || []).reduce((s, i) => s + itemSubtotal(i), 0))
const totalImpuestos    = computed(() => (articulos.value?.items || []).reduce((s, i) => s + i.impuestos, 0))

// ─── Computed — modificadores ────────────────────────────────
const modificadoresAgrupados = computed(() => {
  const groups = {}
  for (const m of (articulos.value?.modificadores || [])) {
    const g = m.grupo || 'SIN GRUPO'
    if (!groups[g]) groups[g] = []
    groups[g].push(m)
  }
  return groups
})

const totalModUnidades = computed(() =>
  (articulos.value?.modificadores || []).reduce((s, m) => s + m.cantidadNeta, 0)
)
const totalModNetas = computed(() =>
  (articulos.value?.modificadores || []).reduce((s, m) => s + m.ventasNetas, 0)
)

// ─── Computed — pagos ─────────────────────────────────────────
const pagoItems = computed(() => {
  if (!resumen.value) return []
  const p = resumen.value.pagos
  return [
    { label: 'Total Recibido',    valor: p.totalRecibido,  color: '#1d4ed8' },
    { label: 'Efectivo',          valor: p.efectivo,       color: '#059669' },
    { label: 'Tarjeta',           valor: p.tarjeta,        color: '#7c3aed' },
    { label: 'Otro',              valor: p.otro,           color: '#0891b2' },
    { label: 'Tarjeta de Regalo', valor: p.tarjetaRegalo,  color: '#db2777' },
    { label: 'Comisiones',        valor: p.comisiones,     color: '#dc2626' },
    { label: 'Total Neto',        valor: p.totalNeto,      color: '#15803d' },
  ]
})

// ─── Parser helpers ───────────────────────────────────────────
function decodeUTF16(buffer) {
  // Try with BOM detection
  const bytes = new Uint8Array(buffer)
  // BOM FF FE → little endian; FE FF → big endian
  const isLE = bytes[0] === 0xFF && bytes[1] === 0xFE
  const isBE = bytes[0] === 0xFE && bytes[1] === 0xFF
  const encoding = isBE ? 'utf-16be' : 'utf-16le'
  const decoder = new TextDecoder(encoding)
  let text = decoder.decode(buffer)
  // Remove BOM character if present
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)
  return text
}

function parseNum(str) {
  if (!str || str.trim() === '') return 0
  // Format: "2194,89 $"  or  "-7,79 $"  or  "0,00 $"
  const cleaned = str.trim().replace(/\s*\$\s*$/, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

function splitLines(text) {
  return text.split(/\r?\n/).map(l => l.split('\t').map(c => c.trim()))
}

function extractDatesFromName(filename) {
  // Pattern: something-YYYY-MM-DD-YYYY-MM-DD.csv
  const m = filename.match(/(\d{4}-\d{2}-\d{2})-(\d{4}-\d{2}-\d{2})/)
  if (m) return `${fmtDate(m[1])} — ${fmtDate(m[2])}`
  return filename
}

function fmtDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${d} ${meses[parseInt(m)-1]} ${y}`
}

function extractLocation(lines) {
  for (const line of lines) {
    const text = line[0] || ''
    if (text.toLowerCase().includes('ubicación') || text.toLowerCase().includes('ubicacion')) {
      const parts = text.split(':')
      return parts[1]?.trim() || ''
    }
  }
  return ''
}

// ─── Parser: resumen_ventas ───────────────────────────────────
function parseResumen(buffer, filename) {
  const text  = decodeUTF16(buffer)
  const lines = splitLines(text)

  const result = {
    periodo:  extractDatesFromName(filename),
    ubicacion: extractLocation(lines),
    ventas: {
      ventasBrutas: 0, articulos: 0, cargosServicio: 0,
      devoluciones: 0, descuentos: 0, ventasNetas: 0,
      ventasTarjetaRegalo: 0, impuestos: 0, propinas: 0,
      reembolsos: 0, total: 0
    },
    pagos: {
      totalRecibido: 0, efectivo: 0, tarjeta: 0,
      otro: 0, tarjetaRegalo: 0, comisiones: 0, totalNeto: 0
    }
  }

  let section = ''
  for (const line of lines) {
    const key = (line[0] || '').toLowerCase().trim()
    const val = line[1] || ''

    if (key === 'ventas') { section = 'ventas'; continue }
    if (key === 'pagos')  { section = 'pagos';  continue }

    if (section === 'ventas') {
      if (key.includes('ventas brutas'))               result.ventas.ventasBrutas        = parseNum(val)
      else if (key === 'artículos' || key === 'articulos') result.ventas.articulos        = parseNum(val)
      else if (key.includes('cargos'))                 result.ventas.cargosServicio       = parseNum(val)
      else if (key.includes('devoluciones'))           result.ventas.devoluciones         = parseNum(val)
      else if (key.includes('descuentos'))             result.ventas.descuentos           = parseNum(val)
      else if (key.includes('ventas netas'))           result.ventas.ventasNetas          = parseNum(val)
      else if (key.includes('tarjetas de regalo'))     result.ventas.ventasTarjetaRegalo  = parseNum(val)
      else if (key.includes('impuestos'))              result.ventas.impuestos            = parseNum(val)
      else if (key.includes('propinas'))               result.ventas.propinas             = parseNum(val)
      else if (key.includes('reembolsos'))             result.ventas.reembolsos           = parseNum(val)
      else if (key === 'total')                        result.ventas.total                = parseNum(val)
    } else if (section === 'pagos') {
      if (key.includes('total recibido'))              result.pagos.totalRecibido  = parseNum(val)
      else if (key === 'efectivo')                     result.pagos.efectivo       = parseNum(val)
      else if (key === 'tarjeta')                      result.pagos.tarjeta        = parseNum(val)
      else if (key === 'otro')                         result.pagos.otro           = parseNum(val)
      else if (key.includes('tarjeta de regalo'))      result.pagos.tarjetaRegalo  = parseNum(val)
      else if (key.includes('comisiones'))             result.pagos.comisiones     = parseNum(val)
      else if (key.includes('total neto'))             result.pagos.totalNeto      = parseNum(val)
    }
  }
  return result
}

// ─── Parser: ventas_articulos ─────────────────────────────────
function parseArticulos(buffer, filename) {
  const text  = decodeUTF16(buffer)
  const lines = splitLines(text)

  const result = {
    periodo:      extractDatesFromName(filename),
    ubicacion:    extractLocation(lines),
    items:        [],
    modificadores: []
  }

  // Find the items header row — contains "Artículos vendidos" or "Articulos vendidos"
  let itemsHeaderIdx = -1
  let modsHeaderIdx  = -1
  let modsSection    = false

  for (let i = 0; i < lines.length; i++) {
    const first = (lines[i][0] || '').toLowerCase()
    if (first.includes('nombre del art')) {
      itemsHeaderIdx = i
    }
    if (first.includes('grupo de modificadores') || first.includes('modificador')) {
      if (itemsHeaderIdx >= 0 && i > itemsHeaderIdx) {
        modsHeaderIdx = i
      }
    }
  }

  // Parse items
  if (itemsHeaderIdx >= 0) {
    const hdr = lines[itemsHeaderIdx].map(h => h.toLowerCase())
    const iNombre    = hdr.findIndex(h => h.includes('nombre del art'))
    const iVariante  = hdr.findIndex(h => h.includes('variante'))
    const iSKU       = hdr.findIndex(h => h.includes('sku'))
    const iCat       = hdr.findIndex(h => h.includes('categor'))
    const iCant      = hdr.findIndex(h => h.includes('vendidos') && !h.includes('ventas'))
    const iBrutas    = hdr.findIndex(h => h.includes('ventas brutas'))
    const iDesc      = hdr.findIndex(h => h.includes('descuentos'))
    const iNetas     = hdr.findIndex(h => h.includes('ventas netas'))
    const iImpuestos = hdr.findIndex(h => h.includes('impuesto'))

    for (let i = itemsHeaderIdx + 1; i < lines.length; i++) {
      const line = lines[i]
      // Stop at empty line or "Ventas con modificadores" section
      if (!line[0] || line[0].trim() === '') {
        // Check if next non-empty line is modifiers section
        continue
      }
      // Stop if we hit the modifiers section
      const first = (line[0] || '').toLowerCase()
      if (first.includes('ventas con modificadores') || first.includes('grupo de modificadores')) break

      const item = {
        nombre:      line[iNombre]    || '',
        variante:    line[iVariante]  || '',
        sku:         line[iSKU]       || '',
        categoria:   line[iCat]       || 'SIN CATEGORÍA',
        cantidad:    parseInt(line[iCant]   || '0') || 0,
        ventasBrutas: parseNum(line[iBrutas]),
        descuentos:   parseNum(line[iDesc]),
        ventasNetas:  parseNum(line[iNetas]),
        impuestos:    parseNum(line[iImpuestos]),
      }
      if (item.nombre) result.items.push(item)
    }
  }

  // Parse modificadores
  if (modsHeaderIdx >= 0) {
    const hdr = lines[modsHeaderIdx].map(h => h.toLowerCase())
    const iGrupo    = hdr.findIndex(h => h.includes('grupo'))
    const iMod      = hdr.findIndex(h => h.includes('modificador') && !h.includes('grupo'))
    const iCantNeta = hdr.findIndex(h => h.includes('monto neto') || h.includes('cantidad') || h.includes('neto vendido'))
    const iNetas    = hdr.findIndex(h => h.includes('ventas netas'))
    const iCantB    = hdr.findIndex(h => h.includes('monto vendido'))
    const iBrutas   = hdr.findIndex(h => h.includes('ventas brutas'))

    for (let i = modsHeaderIdx + 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line[0] || line[0].trim() === '') continue
      const mod = {
        grupo:        line[iGrupo]    || '',
        modificador:  line[iMod]      || '',
        cantidadNeta: parseInt(line[iCantNeta] || '0') || 0,
        ventasNetas:  parseNum(line[iNetas]),
        cantidadB:    parseInt(line[iCantB]    || '0') || 0,
        ventasBrutas: parseNum(line[iBrutas]),
      }
      if (mod.modificador) result.modificadores.push(mod)
    }
  }

  return result
}

// ─── Recetas enrichment ───────────────────────────────────────
async function enrichWithRecetas() {
  if (!articulos.value?.items?.length) return
  const skus = [...new Set(
    articulos.value.items.map(i => i.sku).filter(s => s && s.trim() !== '')
  )]
  if (skus.length === 0) return
  enrichLoading.value = true
  try {
    const resp = await api.get('/recetas/por-skus', { params: { skus: skus.join(',') } })
    if (resp.data?.success && resp.data.data?.length) {
      const recetaMap = {}
      for (const r of resp.data.data) {
        recetaMap[(r.codigo || '').toString().trim()] = r
      }
      for (const item of articulos.value.items) {
        const sku = (item.sku || '').trim()
        if (sku && recetaMap[sku]) {
          item.nombreReceta = recetaMap[sku].nombre
          item.precioVenta  = parseFloat(recetaMap[sku].precio_venta) || 0
          item.subtotal     = item.cantidad * item.precioVenta
        }
      }
    }
  } catch (e) {
    console.error('Error al cargar recetas por SKU:', e)
  } finally {
    enrichLoading.value = false
  }
}

// ─── Consumo de materia prima ─────────────────────────────────
async function calcularConsumo() {
  if (!articulos.value?.items?.length) return
  const itemsConSku = articulos.value.items.filter(i => i.sku && i.sku.trim() !== '')
  if (itemsConSku.length === 0) return

  // SKUs únicos del CSV (= campo RECETA en detalle_productos)
  const skus = [...new Set(itemsConSku.map(i => i.sku.trim()))]

  consumoLoading.value = true
  consumoError.value = ''
  consumo.value = []
  try {
    const resp = await api.get('/detalle-productos/por-recetas', {
      params: { recetas: skus.join(',') }
    })
    if (!resp.data?.success || !resp.data.data?.length) return

    // Mapa SKU → cantidad vendida (del CSV)
    const cantMap = {}
    for (const item of itemsConSku) {
      const sku = item.sku.trim()
      cantMap[sku] = (cantMap[sku] || 0) + item.cantidad
    }

    // Mapa SKU → nombre de la receta (para mostrar en detalle)
    const nombreRecetaMap = {}
    for (const item of itemsConSku) {
      const sku = item.sku.trim()
      if (!nombreRecetaMap[sku]) nombreRecetaMap[sku] = item.nombreReceta || item.nombre || sku
    }

    // Agrupa por ARTICULO acumulando: cant_detalle × cant_vendida
    const consumoMap = {}
    for (const dp of resp.data.data) {
      const receta   = (dp.receta   || '').trim()   // SKU que coincide con el CSV
      const codArt   = (dp.articulo || '').trim()   // ingrediente de inventario
      const nombre   = (dp.articulo_nombre || codArt).trim()
      const und      = (dp.und || '').trim()
      const cantRec  = parseFloat(dp.cant) || 0      // cant por unidad de receta
      const vendidos = cantMap[receta] || 0           // unidades vendidas según CSV
      const total    = cantRec * vendidos

      if (!consumoMap[codArt]) {
        consumoMap[codArt] = { codigo: codArt, nombre, und, totalConsumo: 0, recetas: [] }
      }
      consumoMap[codArt].totalConsumo += total
      consumoMap[codArt].recetas.push({
        sku: receta,
        nombreReceta: nombreRecetaMap[receta] || receta,
        cantPorUnidad: cantRec,
        vendidos,
        subtotal: total
      })
    }

    // Ordena de mayor a menor consumo
    consumo.value = Object.values(consumoMap).sort((a, b) => b.totalConsumo - a.totalConsumo)
  } catch (e) {
    console.error('Error al calcular consumo:', e)
    consumoError.value = e?.response?.data?.error || e.message || 'Error al consultar detalle_productos'
  } finally {
    consumoLoading.value = false
  }
}

// Max consumo para barra relativa
const maxConsumo = computed(() =>
  consumo.value.reduce((m, c) => Math.max(m, c.totalConsumo), 0)
)

// ─── File handling ────────────────────────────────────────────
function detectType(filename, buffer) {
  const name = filename.toLowerCase()
  if (name.includes('resumen')) return 'resumen'
  if (name.includes('articulo') || name.includes('artículo')) return 'articulos'
  // Fallback: peek at content
  const text = new TextDecoder('utf-16le').decode(buffer.slice(0, 200))
  if (text.toLowerCase().includes('resumen')) return 'resumen'
  return 'articulos'
}

async function processFile(file, forcedType) {
  parseError.value = ''
  try {
    const buffer = await file.arrayBuffer()
    const type   = forcedType || detectType(file.name, buffer)

    if (type === 'resumen') {
      resumenFileName.value = file.name
      resumen.value = parseResumen(buffer, file.name)
    } else {
      articulosFileName.value = file.name
      articulos.value = parseArticulos(buffer, file.name)
      await enrichWithRecetas()
      await calcularConsumo()
    }
  } catch (e) {
    parseError.value = `Error al parsear "${file.name}": ${e.message}`
    console.error(e)
  }
}

function onDrop(e, type) {
  dragging.value = [false, false]
  const file = e.dataTransfer.files[0]
  if (file) processFile(file, type)
}

function onFileInput(e, type) {
  const file = e.target.files[0]
  if (file) processFile(file, type)
  e.target.value = ''
}

function limpiar(type) {
  if (type === 'resumen')   { resumen.value = null;   resumenFileName.value = '' }
  if (type === 'articulos') { articulos.value = null; articulosFileName.value = ''; consumo.value = []; consumoError.value = '' }
  parseError.value = ''
}
</script>

<style scoped>
/* ── Wrapper ───────────────────────────────────────── */
.iv-wrap { padding: 24px; max-width: 1280px; margin: 0 auto; }

/* ── Breadcrumb ────────────────────────────────────── */
.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 11px; font-weight: 700; color: #06b6d4; text-transform: uppercase; letter-spacing: 0.5px; }
.bc-cat  { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.4); }
.bc-cur  { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.7); font-weight: 600; }

/* ── Header ────────────────────────────────────────── */
.iv-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.iv-header-left { display: flex; align-items: center; gap: 16px; }
.iv-icon-wrap {
  width: 52px; height: 52px; border-radius: 16px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 20px rgba(245,158,11,0.38); flex-shrink: 0;
}
.iv-title { font-size: 21px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); letter-spacing: 0.4px; margin: 0; }
.iv-sub   { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.45); margin: 3px 0 0; }

/* ── Drop zones ────────────────────────────────────── */
.iv-upload-row {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  margin-bottom: 24px;
}
@media (max-width: 640px) { .iv-upload-row { grid-template-columns: 1fr; } }

.drop-zone {
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.18);
  border-radius: 16px;
  padding: 32px 24px;
  cursor: pointer;
  transition: all 0.2s;
  background: rgb(var(--v-theme-surface));
  text-align: center;
  min-height: 160px;
  display: flex; align-items: center; justify-content: center;
}
.drop-zone:hover { border-color: #06b6d4; background: rgba(6,182,212,0.03); }
.drop-zone--active { border-color: #06b6d4; background: rgba(6,182,212,0.06); }
.drop-zone--loaded { border-style: solid; border-color: #10b981; background: rgba(16,185,129,0.04); }

.drop-content { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.drop-icon-wrap {
  width: 56px; height: 56px; border-radius: 16px;
  display: flex; align-items: center; justify-content: center; margin-bottom: 4px;
}
.drop-icon-blue   { background: linear-gradient(135deg,#3b82f6,#2563eb); }
.drop-icon-purple { background: linear-gradient(135deg,#8b5cf6,#7c3aed); }
.drop-title { font-size: 15px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }
.drop-sub   { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.45); }
.drop-hint  { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.3); margin-top: 4px; }
.drop-hint code { background: rgba(var(--v-theme-on-surface),0.06); padding: 2px 6px; border-radius: 4px; }

.drop-loaded { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.drop-loaded-name { font-size: 13px; font-weight: 600; color: #10b981; word-break: break-all; }
.drop-loaded-sub  { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5); }

/* ── Error ─────────────────────────────────────────── */
.iv-error {
  display: flex; align-items: center; gap: 10px;
  background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.25);
  border-radius: 10px; padding: 12px 16px; margin-bottom: 20px;
  font-size: 13px; color: #ef4444;
}

/* ── Sections ──────────────────────────────────────── */
.iv-section { margin-bottom: 32px; display: flex; flex-direction: column; gap: 16px; }
.iv-section-header { display: flex; align-items: center; gap: 12px; }
.iv-section-icon {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.iv-section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: rgb(var(--v-theme-on-surface)); }
.iv-section-sub   { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.45); margin-top: 2px; }

/* ── KPI Grid ──────────────────────────────────────── */
.kpi-grid { display: grid; gap: 12px; }
.kpi-grid-3 { grid-template-columns: repeat(3, 1fr); }
.kpi-grid-4 { grid-template-columns: repeat(4, 1fr); }
@media (max-width: 900px) { .kpi-grid-3, .kpi-grid-4 { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .kpi-grid-3, .kpi-grid-4 { grid-template-columns: 1fr; } }

.kpi-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px; padding: 14px 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.kpi-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.5); }
.kpi-val { font-size: 20px; font-weight: 800; font-family: 'Courier New', monospace; }

.kpi-blue      { border-left: 3px solid #3b82f6; } .kpi-val-blue      { color: #3b82f6; }
.kpi-green     { border-left: 3px solid #10b981; } .kpi-val-green     { color: #10b981; }
.kpi-green-dark{ border-left: 3px solid #059669; } .kpi-val-green-dark{ color: #059669; }
.kpi-orange    { border-left: 3px solid #f59e0b; } .kpi-val-orange    { color: #f59e0b; }
.kpi-purple    { border-left: 3px solid #8b5cf6; } .kpi-val-purple    { color: #8b5cf6; }
.kpi-gray      { border-left: 3px solid #64748b; } .kpi-val-gray      { color: #64748b; }
.kpi-blue-dark { border-left: 3px solid #1d4ed8; } .kpi-val-blue-dark { color: #1d4ed8; }

/* ── Card ──────────────────────────────────────────── */
.iv-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 14px; overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.iv-card-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  flex-wrap: wrap; gap: 8px;
}
.iv-card-title {
  font-size: 12px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.7);
  display: flex; align-items: center;
}
.mr-1 { margin-right: 4px; }
.mt-16 { margin-top: 0; }
.iv-card-chips { display: flex; gap: 6px; flex-wrap: wrap; }

/* ── Pagos grid ────────────────────────────────────── */
.pagos-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;
}
@media (max-width: 700px) { .pagos-grid { grid-template-columns: repeat(2, 1fr); } }
.pago-item {
  display: flex; flex-direction: column; gap: 4px;
  padding: 14px 18px;
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07);
}
.pago-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; color: rgba(var(--v-theme-on-surface), 0.45); }
.pago-valor { font-size: 16px; font-weight: 800; font-family: 'Courier New', monospace; }

/* ── Categoría chips ───────────────────────────────── */
.cat-chip {
  font-size: 10px; font-weight: 700; padding: 3px 10px;
  border-radius: 20px; cursor: pointer;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.15);
  color: rgba(var(--v-theme-on-surface), 0.6);
  background: rgba(var(--v-theme-on-surface), 0.04);
  transition: all 0.15s; white-space: nowrap;
}
.cat-chip:hover { border-color: #8b5cf6; color: #8b5cf6; }
.cat-chip--active { background: rgba(139,92,246,0.12); border-color: #8b5cf6; color: #8b5cf6; }

/* ── Artículos tabla ───────────────────────────────── */
.art-tabla-wrap { overflow-x: auto; }
.art-tabla { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.art-tabla thead th {
  padding: 10px 12px; text-align: left;
  font-size: 9.5px; font-weight: 700; letter-spacing: 0.5px;
  text-transform: uppercase; color: rgba(var(--v-theme-on-surface), 0.5);
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  white-space: nowrap;
}
.art-tabla td { padding: 9px 12px; }

/* Categoría header row */
.tr-cat-header { background: rgba(139,92,246,0.04); border-top: 1px solid rgba(139,92,246,0.15); }
.tr-cat-header td { padding: 7px 12px; }
.cat-badge {
  font-size: 9.5px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.6px; color: #8b5cf6;
  background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2);
  padding: 2px 10px; border-radius: 20px;
}

/* Item rows */
.tr-item { border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); }
.tr-item:hover { background: rgba(var(--v-theme-on-surface), 0.02); }
.tr-even { background: rgb(var(--v-theme-surface)); }
.tr-odd  { background: rgba(var(--v-theme-on-surface), 0.018); }

/* Subtotal row */
.tr-subtotal {
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-bottom: 2px solid rgba(var(--v-theme-on-surface), 0.08);
}
.tr-subtotal td { padding: 8px 12px; }
.subtotal-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: rgba(var(--v-theme-on-surface), 0.5); }
.subtotal-val { font-size: 12px; font-weight: 700; font-family: 'Courier New', monospace; color: rgba(var(--v-theme-on-surface), 0.7); }

/* Total row */
.tr-total {
  background: rgba(var(--v-theme-on-surface), 0.07);
  border-top: 2px solid rgba(var(--v-theme-on-surface), 0.15);
}
.tr-total td { padding: 10px 12px; }
.total-lbl { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.7); }
.total-val { font-size: 13px; font-weight: 800; font-family: 'Courier New', monospace; }

/* Cell styles */
.col-right    { text-align: right !important; }
.td-nombre    { font-weight: 600; color: rgb(var(--v-theme-on-surface)); }
.td-variante  { font-size: 11.5px; color: rgba(var(--v-theme-on-surface), 0.55); }
.td-sku       { font-family: 'Courier New', monospace; font-size: 11.5px; color: rgba(var(--v-theme-on-surface), 0.5); }
.td-cat       { }
.td-num       { font-weight: 700; color: rgb(var(--v-theme-on-surface)); }
.td-monto     { font-family: 'Courier New', monospace; font-weight: 500; }
.td-dim       { font-size: 11.5px; color: rgba(var(--v-theme-on-surface), 0.5); }
.cat-tag      { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; color: rgba(var(--v-theme-on-surface), 0.5); background: rgba(var(--v-theme-on-surface),0.06); padding: 2px 7px; border-radius: 4px; }
.variante-tag { font-size: 10px; font-weight: 600; color: #8b5cf6; background: rgba(139,92,246,0.1); padding: 1px 6px; border-radius: 4px; margin-left: 6px; vertical-align: middle; }

.txt-green  { color: #10b981; }
.txt-orange { color: #f59e0b; }
.txt-dim    { color: rgba(var(--v-theme-on-surface), 0.4); }

/* Modificadores grupo header */
.tr-cat-orange { background: rgba(245,158,11,0.04); border-top: 1px solid rgba(245,158,11,0.15); }
.cat-badge-orange {
  color: #d97706;
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.25);
}

/* KPI rojo */
.kpi-red     { border-left: 3px solid #ef4444; } .kpi-val-red     { color: #ef4444; }

/* Consumo vacío */
.consumo-empty {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 40px 24px; text-align: center;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 14px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  font-size: 13px;
}
.consumo-empty-hint {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.25);
}
.consumo-empty-hint code {
  background: rgba(var(--v-theme-on-surface), 0.06);
  padding: 1px 5px; border-radius: 3px; font-size: 10.5px;
}

/* Consumo tabla */
.tr-consumo { vertical-align: middle; }
.td-idx { font-size: 11px; font-weight: 700; color: rgba(var(--v-theme-on-surface), 0.3); text-align: center; }
.td-und { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5); font-weight: 600; }

.td-nombre-consumo { padding: 8px 12px !important; }
.consumo-nombre { font-weight: 700; font-size: 13px; color: rgb(var(--v-theme-on-surface)); margin-bottom: 5px; }
.consumo-bar-wrap {
  height: 4px; background: rgba(var(--v-theme-on-surface), 0.07);
  border-radius: 4px; overflow: hidden;
}
.consumo-bar {
  height: 100%; border-radius: 4px;
  background: linear-gradient(90deg, #ef4444, #f97316);
  transition: width 0.4s ease;
}

.consumo-total-val {
  font-family: 'Courier New', monospace;
  font-size: 15px; font-weight: 800; color: #ef4444;
}

/* Recetas chips */
.td-recetas { padding: 8px 12px !important; }
.recetas-wrap { display: flex; flex-wrap: wrap; gap: 4px; }
.receta-chip {
  display: inline-flex; align-items: center; gap: 5px;
  background: rgba(139,92,246,0.07);
  border: 1px solid rgba(139,92,246,0.15);
  border-radius: 5px; padding: 2px 7px; font-size: 10.5px;
  cursor: default;
}
.receta-sku { font-family: 'Courier New', monospace; font-weight: 700; color: #8b5cf6; }
.receta-subtotal { color: rgba(var(--v-theme-on-surface), 0.55); font-weight: 500; }
.txt-red { color: #ef4444; }

/* Enrich badge */
.enrich-badge {
  display: flex; align-items: center; gap: 6px; margin-left: auto;
  font-size: 11px; color: #8b5cf6; font-weight: 600;
}

/* Modificadores */
.mod-count {
  background: rgba(245,158,11,0.12); color: #f59e0b;
  font-size: 10px; font-weight: 700; border-radius: 20px;
  padding: 1px 8px; margin-left: 6px;
}
</style>
