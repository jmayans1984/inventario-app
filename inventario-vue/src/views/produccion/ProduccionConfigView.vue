<template>
  <MainLayout>
    <div class="prod-wrap">
      <!-- HEADER -->
      <div class="prod-header">
        <div class="prod-header-icon"><v-icon size="20" color="white">mdi-cog</v-icon></div>
        <div class="flex-1">
          <h1 class="prod-title">CONFIGURACIÓN</h1>
          <p class="prod-sub">Gestiona recetas, artículos y lotes de producción</p>
        </div>
      </div>

      <!-- TABS DE SECCIONES -->
      <div class="prod-tabs-card">
        <div class="prod-tabs-header">
          <button v-for="t in tabs" :key="t.val"
            class="prod-tab" :class="{ 'prod-tab--active': tabActiva === t.val }"
            @click="tabActiva = t.val">
            <v-icon size="15" class="mr-1">{{ t.icon }}</v-icon>{{ t.label }}
          </button>
        </div>

        <!-- TAB: RECETAS PRODUCTOS PROPIOS -->
        <div v-if="tabActiva === 'recetas'" class="prod-tab-content">
          <div class="prod-actions-bar">
            <v-btn color="#8b5cf6" variant="flat" size="small" @click="dlgNuevaReceta=true">
              <v-icon size="14" class="mr-1">mdi-plus</v-icon> Nueva Receta
            </v-btn>
            <v-spacer />
            <v-text-field v-model="searchRecetas" placeholder="Buscar receta..."
              variant="outlined" density="compact" style="max-width:250px"
              prepend-inner-icon="mdi-magnify" hide-details />
          </div>

          <div class="prod-table-wrap">
            <table class="prod-table">
              <thead>
                <tr>
                  <th>CÓDIGO</th>
                  <th>NOMBRE</th>
                  <th class="ta-r">COSTO UNITARIO</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in recetas" :key="r.codigo">
                  <td><strong>{{ r.codigo }}</strong></td>
                  <td>{{ r.nombre }}</td>
                  <td class="ta-r font-mono">${{ parseFloat(r.valor || 0).toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- TAB: ARTÍCULOS INGREDIENTES -->
        <div v-if="tabActiva === 'articulos'" class="prod-tab-content">
          <div class="prod-actions-bar">
            <v-btn color="#8b5cf6" variant="flat" size="small" @click="dlgNuevoArticulo=true">
              <v-icon size="14" class="mr-1">mdi-plus</v-icon> Nuevo Artículo
            </v-btn>
            <v-spacer />
            <v-text-field v-model="searchArticulos" placeholder="Buscar artículo..."
              variant="outlined" density="compact" style="max-width:250px"
              prepend-inner-icon="mdi-magnify" hide-details />
          </div>

          <div class="prod-table-wrap">
            <table class="prod-table">
              <thead>
                <tr>
                  <th>ARTÍCULO</th>
                  <th>UNIDAD</th>
                  <th class="ta-r">PRECIO</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="a in articulos" :key="a.codigo || a.nombre">
                  <td>{{ a.nombre }}</td>
                  <td>{{ a.und || '—' }}</td>
                  <td class="ta-r font-mono">${{ parseFloat(a.valor || 0).toFixed(4) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- TAB: LOTES ACTIVOS -->
        <div v-if="tabActiva === 'lotes'" class="prod-tab-content">
          <div class="prod-actions-bar">
            <v-btn color="#8b5cf6" variant="flat" size="small" @click="generarNuevoLote">
              <v-icon size="14" class="mr-1">mdi-plus</v-icon> Generar Lote
            </v-btn>
            <v-spacer />
            <select v-model="filtroEstadoLote" class="drw-select" style="width:150px">
              <option value="">Todos los estados</option>
              <option value="ACTIVO">Activo</option>
              <option value="VENCIDO">Vencido</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>

          <div class="prod-table-wrap">
            <table class="prod-table">
              <thead>
                <tr>
                  <th>CÓDIGO LOTE</th>
                  <th>PRODUCTO</th>
                  <th>FECHA VENCIMIENTO</th>
                  <th>CANTIDAD</th>
                  <th>ESTADO</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="l in lotes" :key="l.id">
                  <td><strong>{{ l.codigo_lote }}</strong></td>
                  <td>{{ l.producto_nombre }}</td>
                  <td>{{ formatFecha(l.fecha_vencimiento) }}</td>
                  <td class="ta-r">{{ l.cantidad_producida }}</td>
                  <td>
                    <span class="badge" :class="`badge-${l.estado.toLowerCase()}`">
                      {{ l.estado }}
                    </span>
                  </td>
                  <td class="ta-c">
                    <v-btn size="x-small" variant="text" color="#06b6d4" @click="verLote(l)">
                      <v-icon size="14">mdi-eye</v-icon>
                    </v-btn>
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
import { ref, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { API_BASE } from '../../utils/constants.js'

const tabActiva = ref('recetas')
const searchRecetas = ref('')
const searchArticulos = ref('')
const filtroEstadoLote = ref('')
const dlgNuevaReceta = ref(false)
const dlgNuevoArticulo = ref(false)
const cargando = ref(false)

const recetas = ref([])
const articulos = ref([])
const lotes = ref([])

const tabs = [
  { val: 'recetas', label: 'Recetas', icon: 'mdi-chef-hat' },
  { val: 'articulos', label: 'Artículos', icon: 'mdi-package' },
  { val: 'lotes', label: 'Lotes', icon: 'mdi-package-variant' }
]

function formatFecha(fecha) {
  if (!fecha) return '—'
  const [y, m, d] = fecha.split('-')
  return `${m}/${d}/${y}`
}

function editarReceta(r) { console.log('Editar receta:', r) }
function eliminarReceta(id) { console.log('Eliminar receta:', id) }
function editarArticulo(a) { console.log('Editar artículo:', a) }
function generarNuevoLote() { console.log('Generar nuevo lote') }
function verLote(l) { console.log('Ver lote:', l) }

onMounted(async () => {
  cargando.value = true
  try {
    const [rr, ra] = await Promise.all([
      fetch(`${API_BASE}/recetas`).then(r => r.json()),
      fetch(`${API_BASE}/articulos`).then(r => r.json()),
    ])
    recetas.value = (rr.data || []).filter(r => r.subproducto === 'SI')
    articulos.value = (ra.data || []).filter(a => a.prod_propio !== 'SI')
  } catch (e) {
    console.error('Error cargando datos:', e)
  } finally {
    cargando.value = false
  }
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

.prod-tabs-card { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

.prod-tabs-header {
  display: flex; gap: 0; border-bottom: 1px solid #e5e7eb; background: #fafafa;
}

.prod-tab {
  flex: 1; padding: 14px 16px; border: none; background: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  font-size: 13px; font-weight: 600; color: #6b7280;
  transition: all 0.2s ease; border-bottom: 3px solid transparent;
}

.prod-tab:hover { color: #8b5cf6; background: rgba(139,92,246,0.05); }
.prod-tab--active { color: #8b5cf6; border-bottom-color: #8b5cf6; background: white; }

.prod-tab-content { padding: 20px; }

.prod-actions-bar {
  display: flex; gap: 12px; align-items: center; margin-bottom: 16px;
}

.prod-table-wrap { overflow-x: auto; }

.prod-table {
  width: 100%; border-collapse: collapse; font-size: 13px;
}

.prod-table thead { background: #f9fafb; }

.prod-table th {
  padding: 12px 14px; font-weight: 700; text-align: left;
  color: #6b7280; border-bottom: 2px solid #e5e7eb;
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;
}

.prod-table th.ta-r { text-align: right; }

.prod-table td {
  padding: 12px 14px; border-bottom: 1px solid #f3f4f6; color: #374151;
}

.prod-table tbody tr:hover { background: #f9fafb; }

.ta-r { text-align: right; }
.ta-c { text-align: center; }
.font-mono { font-family: monospace; }
.mr-1 { margin-right: 6px; }

.badge {
  display: inline-block; padding: 4px 8px; border-radius: 4px;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
}

.badge-activo { background: #d1fae5; color: #065f46; }
.badge-vencido { background: #fee2e2; color: #991b1b; }
.badge-cancelado { background: #f3f4f6; color: #374151; }

.drw-select {
  padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;
  font-size: 13px; background: white; cursor: pointer;
}
</style>
