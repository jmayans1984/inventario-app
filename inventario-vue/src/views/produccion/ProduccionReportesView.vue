<template>
  <MainLayout>
    <div class="prod-wrap">
      <!-- HEADER -->
      <div class="prod-header">
        <div class="prod-header-icon"><v-icon size="20" color="white">mdi-chart-bar</v-icon></div>
        <div class="flex-1">
          <h1 class="prod-title">REPORTES DE PRODUCCIÓN</h1>
          <p class="prod-sub">Análisis de costos, márgenes y trazabilidad de lotes</p>
        </div>
      </div>

      <!-- FILTROS -->
      <v-card style="margin-bottom: 24px;">
        <v-card-text style="display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap;">
          <v-text-field v-model="filtros.fechaInicio" label="Fecha Inicio" type="date" density="compact" style="max-width: 180px" />
          <v-text-field v-model="filtros.fechaFin" label="Fecha Fin" type="date" density="compact" style="max-width: 180px" />
          <v-select v-model="filtros.estado" :items="[
            { title: 'Todos', value: '' },
            { title: 'Pendiente', value: 'PENDIENTE' },
            { title: 'En Proceso', value: 'EN_PROCESO' },
            { title: 'Completada', value: 'COMPLETADA' }
          ]" item-title="title" item-value="value" label="Estado" density="compact" style="max-width: 180px" />
          <v-btn color="#8b5cf6" variant="flat" @click="aplicarFiltros" size="small">
            <v-icon start>mdi-magnify</v-icon> Filtrar
          </v-btn>
        </v-card-text>
      </v-card>

      <!-- TABS DE REPORTES -->
      <div class="prod-tabs-card">
        <div class="prod-tabs-header">
          <button v-for="t in tabs" :key="t.val"
            class="prod-tab" :class="{ 'prod-tab--active': reporteActivo === t.val }"
            @click="reporteActivo = t.val">
            <v-icon size="15" class="mr-1">{{ t.icon }}</v-icon>{{ t.label }}
          </button>
        </div>

        <!-- REPORTE 1: ÓRDENES PRODUCCIÓN -->
        <div v-if="reporteActivo === 'ordenes'" class="prod-tab-content">
          <div class="prod-kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">ÓRDENES COMPLETADAS</div>
              <div class="kpi-value">{{ kpis.ordenesCompletadas }}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">COSTO TOTAL</div>
              <div class="kpi-value">${{ kpis.costoTotal.toFixed(2) }}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">PORCIONES PRODUCIDAS</div>
              <div class="kpi-value">{{ kpis.porcionesProducidas }}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">COSTO PROMEDIO</div>
              <div class="kpi-value">${{ kpis.costoPromedio.toFixed(4) }}</div>
            </div>
          </div>

          <div class="prod-table-wrap">
            <table class="prod-table">
              <thead>
                <tr>
                  <th>ORDEN ID</th>
                  <th>PRODUCTO</th>
                  <th class="ta-r">PLANEADA</th>
                  <th class="ta-r">REAL</th>
                  <th class="ta-r">COSTO TOTAL</th>
                  <th class="ta-r">COSTO UNITARIO</th>
                  <th>ESTADO</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="o in ordenesReporte" :key="o.id">
                  <td><strong>#{{ o.id }}</strong></td>
                  <td>{{ o.producto_nombre }}</td>
                  <td class="ta-r">{{ o.cantidad_planeada }}</td>
                  <td class="ta-r">{{ o.cantidad_real || '—' }}</td>
                  <td class="ta-r font-mono">${{ o.costo_total?.toFixed(2) || '0.00' }}</td>
                  <td class="ta-r font-mono">${{ o.precio_unitario?.toFixed(4) || '0.0000' }}</td>
                  <td>
                    <span class="badge" :class="`badge-${o.estado.toLowerCase()}`">
                      {{ o.estado }}
                    </span>
                  </td>
                  <td class="ta-c">
                    <v-btn size="x-small" variant="text" color="#06b6d4" @click="verDetalleOrden(o)">
                      <v-icon size="14">mdi-eye</v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- REPORTE 2: COSTOS POR RECETA -->
        <div v-if="reporteActivo === 'costos'" class="prod-tab-content">
          <div class="prod-table-wrap">
            <table class="prod-table">
              <thead>
                <tr>
                  <th>PRODUCTO</th>
                  <th class="ta-r">ÓRDENES</th>
                  <th class="ta-r">COSTO PROMEDIO</th>
                  <th class="ta-r">COSTO MÍNIMO</th>
                  <th class="ta-r">COSTO MÁXIMO</th>
                  <th class="ta-r">TOTAL INVERTIDO</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in costosReporte" :key="c.id">
                  <td><strong>{{ c.producto }}</strong></td>
                  <td class="ta-r">{{ c.ordenes }}</td>
                  <td class="ta-r font-mono">${{ c.costo_promedio.toFixed(4) }}</td>
                  <td class="ta-r font-mono">${{ c.costo_minimo.toFixed(4) }}</td>
                  <td class="ta-r font-mono">${{ c.costo_maximo.toFixed(4) }}</td>
                  <td class="ta-r font-mono"><strong>${{ c.total_invertido.toFixed(2) }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- REPORTE 3: TRAZABILIDAD DE LOTES -->
        <div v-if="reporteActivo === 'trazabilidad'" class="prod-tab-content">
          <div class="prod-table-wrap">
            <table class="prod-table">
              <thead>
                <tr>
                  <th>CÓDIGO LOTE</th>
                  <th>PRODUCTO</th>
                  <th>FECHA PRODUCCIÓN</th>
                  <th>FECHA VENCIMIENTO</th>
                  <th class="ta-r">CANTIDAD</th>
                  <th>ESTADO</th>
                  <th>ETIQUETAS</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="l in lotesReporte" :key="l.id">
                  <td><strong>{{ l.codigo_lote }}</strong></td>
                  <td>{{ l.producto_nombre }}</td>
                  <td>{{ formatFecha(l.fecha_produccion) }}</td>
                  <td :class="esVencido(l.fecha_vencimiento) ? 'text-red' : ''">
                    {{ formatFecha(l.fecha_vencimiento) }}
                  </td>
                  <td class="ta-r">{{ l.cantidad_producida }}</td>
                  <td>
                    <span class="badge" :class="`badge-${l.estado.toLowerCase()}`">
                      {{ l.estado }}
                    </span>
                  </td>
                  <td class="ta-c">
                    <v-btn size="x-small" variant="flat" color="#8b5cf6" @click="descargarEtiquetas(l)">
                      <v-icon size="12">mdi-download</v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- REPORTE 4: MÁRGENES POR PRODUCTO -->
        <div v-if="reporteActivo === 'margenes'" class="prod-tab-content">
          <div class="prod-table-wrap">
            <table class="prod-table">
              <thead>
                <tr>
                  <th>PRODUCTO</th>
                  <th class="ta-r">COSTO UNITARIO</th>
                  <th class="ta-r">PRECIO VENTA</th>
                  <th class="ta-r">MARGEN $</th>
                  <th class="ta-r">MARGEN %</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in margenesReporte" :key="m.id">
                  <td><strong>{{ m.producto }}</strong></td>
                  <td class="ta-r font-mono">${{ m.costo_unitario.toFixed(4) }}</td>
                  <td class="ta-r font-mono">${{ m.precio_venta.toFixed(2) }}</td>
                  <td class="ta-r font-mono" style="color:#22c55e"><strong>${{ m.margen_dinero.toFixed(2) }}</strong></td>
                  <td class="ta-r" style="color:#22c55e"><strong>{{ m.margen_porcentaje.toFixed(1) }}%</strong></td>
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
import { ref, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'

const reporteActivo = ref('ordenes')

const filtros = ref({
  fechaInicio: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
  fechaFin: new Date().toISOString().split('T')[0],
  estado: ''
})

const tabs = [
  { val: 'ordenes', label: 'Órdenes Producción', icon: 'mdi-package' },
  { val: 'costos', label: 'Costos por Receta', icon: 'mdi-currency-usd' },
  { val: 'trazabilidad', label: 'Trazabilidad', icon: 'mdi-barcode' },
  { val: 'margenes', label: 'Márgenes', icon: 'mdi-chart-line' }
]

const kpis = ref({
  ordenesCompletadas: 15,
  costoTotal: 15750.50,
  porcionesProducidas: 15000,
  costoPromedio: 1.05
})

const ordenesReporte = ref([
  { id: 1, producto_nombre: 'Carne Hamburguesa', cantidad_planeada: 1000, cantidad_real: 1050, costo_total: 2500.00, precio_unitario: 2.38, estado: 'COMPLETADA' },
  { id: 2, producto_nombre: 'Pan Hamburguesa', cantidad_planeada: 1000, cantidad_real: 980, costo_total: 300.00, precio_unitario: 0.31, estado: 'COMPLETADA' }
])

const costosReporte = ref([
  { id: 1, producto: 'Carne Hamburguesa', ordenes: 8, costo_promedio: 2.35, costo_minimo: 2.10, costo_maximo: 2.50, total_invertido: 18800.00 },
  { id: 2, producto: 'Pan Hamburguesa', ordenes: 7, costo_promedio: 0.30, costo_minimo: 0.28, costo_maximo: 0.32, total_invertido: 2100.00 }
])

const lotesReporte = ref([
  { id: 1, codigo_lote: 'PROD-20260617-001', producto_nombre: 'Carne Hamburguesa', fecha_produccion: '2026-06-17', fecha_vencimiento: '2026-07-17', cantidad_producida: 1050, estado: 'ACTIVO' },
  { id: 2, codigo_lote: 'PROD-20260615-001', producto_nombre: 'Pan Hamburguesa', fecha_produccion: '2026-06-15', fecha_vencimiento: '2026-07-15', cantidad_producida: 980, estado: 'ACTIVO' }
])

const margenesReporte = ref([
  { id: 1, producto: 'Carne Hamburguesa', costo_unitario: 2.35, precio_venta: 5.99, margen_dinero: 3.64, margen_porcentaje: 60.8 },
  { id: 2, producto: 'Pan Hamburguesa', costo_unitario: 0.30, precio_venta: 0.99, margen_dinero: 0.69, margen_porcentaje: 69.7 }
])

function formatFecha(fecha) {
  if (!fecha) return '—'
  const [y, m, d] = fecha.split('-')
  return `${m}/${d}/${y}`
}

function esVencido(fecha) {
  return new Date(fecha) < new Date()
}

function aplicarFiltros() {
  console.log('Aplicar filtros:', filtros.value)
}

function verDetalleOrden(orden) {
  console.log('Ver detalle orden:', orden)
}

function descargarEtiquetas(lote) {
  console.log('Descargar etiquetas:', lote)
  alert('📥 Generando PDF con etiquetas 4x6...')
}

onMounted(() => {
  // Cargar datos de reportes
})
</script>

<style scoped>
.prod-wrap { padding: 24px; max-width: 1400px; margin: 0 auto; }

.prod-header {
  display: flex; align-items: center; gap: 16px;
  background: linear-gradient(135deg, #6d28d9, #8b5cf6);
  border-radius: 12px; padding: 20px 24px; margin-bottom: 30px;
}

.prod-header-icon {
  width: 48px; height: 48px; border-radius: 10px;
  background: rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

.prod-title { font-size: 24px; font-weight: 800; color: white; margin: 0; }
.prod-sub { font-size: 13px; color: rgba(255,255,255,0.8); margin: 4px 0 0 0; }
.flex-1 { flex: 1; }


.prod-tabs-card {
  background: rgb(var(--v-theme-surface)); border-radius: 10px; overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.prod-tabs-header {
  display: flex; gap: 0; border-bottom: 1px solid rgb(var(--v-theme-outline)); background: rgb(var(--v-theme-surface-variant));
}

.prod-tab {
  flex: 1; padding: 14px 16px; border: none; background: none;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  gap: 6px; font-size: 13px; font-weight: 600; color: rgb(var(--v-theme-on-surface-variant));
  transition: all 0.2s ease; border-bottom: 3px solid transparent;
}

.prod-tab:hover { color: #8b5cf6; background: rgba(139,92,246,0.05); }
.prod-tab--active { color: #8b5cf6; border-bottom-color: #8b5cf6; background: rgb(var(--v-theme-surface)); }

.prod-tab-content { padding: 20px; }

.prod-kpi-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px; margin-bottom: 24px;
}

.kpi-card {
  background: linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.05));
  border: 1px solid rgba(139,92,246,0.2); border-radius: 10px;
  padding: 16px; text-align: center;
}

.kpi-label {
  font-size: 11px; font-weight: 700; color: rgb(var(--v-theme-on-surface-variant));
  text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;
}

.kpi-value {
  font-size: 24px; font-weight: 800; color: #8b5cf6;
}

.prod-table-wrap { overflow-x: auto; }

.prod-table {
  width: 100%; border-collapse: collapse; font-size: 13px;
}

.prod-table thead { background: rgb(var(--v-theme-surface-variant)); }

.prod-table th {
  padding: 12px; text-align: left; font-weight: 700;
  color: rgb(var(--v-theme-on-surface-variant)); border-bottom: 2px solid rgb(var(--v-theme-outline));
  font-size: 11px; text-transform: uppercase;
}

.prod-table td {
  padding: 12px; border-bottom: 1px solid rgb(var(--v-theme-outline-variant)); color: rgb(var(--v-theme-on-surface));
}

.prod-table tbody tr:hover { background: rgb(var(--v-theme-surface-variant)); }

.ta-r { text-align: right; }
.ta-c { text-align: center; }
.font-mono { font-family: monospace; }
.mr-1 { margin-right: 6px; }
.text-red { color: #ef4444; }

.badge {
  display: inline-block; padding: 4px 8px; border-radius: 4px;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
}

.badge-pendiente { background: #fef3c7; color: #b45309; }
.badge-en_proceso { background: #dbeafe; color: #1e40af; }
.badge-completada { background: #d1fae5; color: #065f46; }
.badge-activo { background: #d1fae5; color: #065f46; }
.badge-vencido { background: #fee2e2; color: #991b1b; }
</style>
