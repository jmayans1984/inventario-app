<template>
  <MainLayout>
    <div class="prod-wrap">
      <!-- HEADER -->
      <div class="prod-header">
        <div class="prod-header-icon"><v-icon size="20" color="white">mdi-hammer-wrench</v-icon></div>
        <div class="flex-1">
          <h1 class="prod-title">PROCESOS DE PRODUCCIÓN</h1>
          <p class="prod-sub">Gestiona órdenes de producción, cálculo de ingredientes y registra lo producido</p>
        </div>
        <v-btn color="#22c55e" variant="flat" rounded="lg" @click="abrirNuevaOrden" size="small">
          <v-icon start>mdi-plus</v-icon> Nuevo Orden
        </v-btn>
      </div>

      <!-- GRID DE ÓRDENES -->
      <v-card style="margin-top: 24px;">
        <v-card-title style="font-size: 12px; padding: 12px; font-weight: 600;">ÓRDENES DE PRODUCCIÓN</v-card-title>
        <v-card-text style="padding: 12px;">
          <v-data-table :items="ordenes" :headers="headersOrdenes" density="compact" hover>
            <template #item.acciones="{ item }">
              <div style="display: flex; gap: 4px;">
                <v-tooltip text="Editar orden">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon size="x-small" variant="tonal" color="blue"
                      @click="editarOrden(item)">
                      <v-icon size="14">mdi-pencil-outline</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
                <v-tooltip text="Registrar producción">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon size="x-small" variant="tonal" color="#8b5cf6"
                      @click="registrarProduccion(item)">
                      <v-icon size="14">mdi-check-circle-outline</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
                <v-tooltip text="Generar etiquetas">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon size="x-small" variant="tonal" color="#f59e0b"
                      @click="generarEtiquetas(item)">
                      <v-icon size="14">mdi-tag-multiple-outline</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
                <v-tooltip text="Actualizar precios">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon size="x-small" variant="tonal" color="#06b6d4"
                      @click="actualizarPrecios(item)">
                      <v-icon size="14">mdi-currency-usd</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
                <v-tooltip text="Eliminar orden">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon size="x-small" variant="tonal" color="error"
                      @click="confirmarEliminar(item)">
                      <v-icon size="14">mdi-delete-outline</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
              </div>
            </template>
          </v-data-table>

          <div v-if="ordenes.length === 0" style="text-align: center; padding: 40px; color: rgba(var(--v-theme-on-surface), 0.5);">
            <v-icon size="48" style="margin-bottom: 12px;">mdi-inbox-outline</v-icon>
            <p>No hay órdenes de producción. Crea la primera haciendo clic en "Nuevo Orden".</p>
          </div>
        </v-card-text>
      </v-card>

      <!-- MODAL: NUEVA ORDEN -->
      <v-dialog v-model="modalAbierto" max-width="1000px" scrollable>
        <v-card>
          <v-card-title style="padding: 20px; background: linear-gradient(135deg, #6d28d9, #8b5cf6); color: white;">
            {{ modoEdicion ? 'Editar Orden de Producción' : 'Nueva Orden de Producción' }}
          </v-card-title>

          <!-- PASOS DEL PROCESO -->
          <div class="prod-steps-container" style="margin: 16px;">
            <div class="prod-steps">
              <div v-for="(paso, idx) in pasos" :key="idx"
                class="prod-step" :class="{ 'prod-step--active': pasoActivo === paso.id, 'prod-step--completed': pasoActivo > paso.id }">
                <div class="prod-step-number">{{ idx + 1 }}</div>
                <div class="prod-step-title">{{ paso.titulo }}</div>
              </div>
            </div>
          </div>

          <v-card-text style="padding: 20px; font-size: 13px;">
            <!-- PASO 1: CREAR ORDEN -->
            <div v-if="pasoActivo === 1">
              <h3 style="font-size: 14px; margin-bottom: 16px;">PASO 1: CREAR ORDEN DE PRODUCCIÓN</h3>

              <div class="prod-form-grid" style="margin-top: 16px; align-items: flex-end;">
                <v-text-field v-model="ordenForm.fecha_inicio" label="Fecha" type="date" outlined dense style="font-size: 13px;" />

                <v-select v-model="recetaSeleccionada" :items="productosProduccion" item-title="nombre" item-value="codigo"
                  label="Seleccionar Receta (Subproducto)" outlined dense style="font-size: 13px;" />

                <v-text-field v-model.number="cantidadReceta" label="Cantidad a Producir" type="number" placeholder="1000" outlined dense style="font-size: 13px;" />

                <v-btn color="#8b5cf6" variant="flat" @click="agregarReceta" size="default">
                  <v-icon start>mdi-plus</v-icon> Agregar
                </v-btn>
              </div>

              <!-- INFORMACIÓN DE INVENTARIO -->
              <div v-if="recetaSeleccionada && inventarioInfo.codigo === recetaSeleccionada" class="inv-banner" style="margin-top: 16px;">
                <div class="inv-kpi" style="border-left-color: #a78bfa;">
                  <div class="inv-kpi-label">Inventario Bodega</div>
                  <div class="inv-kpi-val" style="color: #a78bfa;">{{ inventarioInfo.stock_actual }}</div>
                </div>
                <div class="inv-kpi" style="border-left-color: #f59e0b;">
                  <div class="inv-kpi-label">Consumo Últimos 7 Días</div>
                  <div class="inv-kpi-val" style="color: #f59e0b;">{{ inventarioInfo.consumo_7_dias }}</div>
                </div>
                <div class="inv-kpi" style="border-left-color: #10b981;">
                  <div class="inv-kpi-label">Diferencia (a Producir)</div>
                  <div class="inv-kpi-val" style="color: #10b981;">{{ Math.max(0, inventarioInfo.consumo_7_dias - inventarioInfo.stock_actual) }}</div>
                </div>
              </div>

              <!-- TABLA DE RECETAS EN LA ORDEN -->
              <v-card v-if="recetasEnOrden.length > 0" style="margin-top: 16px;">
                <v-card-title style="font-size: 11px; padding: 8px 12px; font-weight: 600;">RECETAS EN LA ORDEN</v-card-title>
                <v-data-table :items="recetasEnOrden" :headers="[
                  { title: 'RECETA', key: 'nombre' },
                  { title: 'CANTIDAD', key: 'cantidad' },
                  { title: 'ACCIONES', key: 'acciones', width: '80px' }
                ]" density="compact" hide-default-footer>
                  <template #item.acciones="{ item, index }">
                    <v-btn size="x-small" variant="text" color="#ef4444" @click="eliminarReceta(index)">
                      <v-icon size="14">mdi-delete</v-icon>
                    </v-btn>
                  </template>
                </v-data-table>
              </v-card>

              <v-textarea v-model="ordenForm.observaciones" label="Observaciones" rows="2" outlined dense style="margin-top: 16px; font-size: 13px;" />
            </div>

            <!-- PASO 2: INGREDIENTES -->
            <div v-if="pasoActivo === 2">
              <h3 style="font-size: 14px; margin-bottom: 16px;">PASO 2: INGREDIENTES NECESARIOS</h3>

              <v-alert type="info" variant="outlined" icon="mdi-information" style="margin: 16px 0; font-size: 12px;" density="compact">
                <strong>Recetas en la orden:</strong> {{ recetasEnOrden.length }} | <strong>Total ingredientes:</strong> {{ ingredientesCalculados.length }}
              </v-alert>

              <v-table density="compact" style="margin-top: 16px; font-size: 12px;">
                <thead style="background: rgba(var(--v-theme-on-surface), 0.05);">
                  <tr>
                    <th style="font-size: 11px; font-weight: 600; padding: 8px;">RECETA</th>
                    <th style="font-size: 11px; font-weight: 600; padding: 8px;">INGREDIENTE</th>
                    <th class="ta-r" style="font-size: 11px; font-weight: 600; padding: 8px;">CANTIDAD/UNIDAD</th>
                    <th class="ta-r" style="font-size: 11px; font-weight: 600; padding: 8px;">UNIDAD</th>
                    <th class="ta-r" style="font-size: 11px; font-weight: 600; padding: 8px;">NECESARIA</th>
                    <th class="ta-r" style="font-size: 11px; font-weight: 600; padding: 8px;">PRECIO UNITARIO</th>
                    <th class="ta-r" style="font-size: 11px; font-weight: 600; padding: 8px;">COSTO TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(ing, idx) in ingredientesCalculados" :key="idx">
                    <td><strong style="color: #8b5cf6;">{{ ing.receta_nombre }}</strong></td>
                    <td>{{ ing.nombre }}</td>
                    <td class="ta-r">{{ ing.cantidad_por_receta.toFixed(2) }}</td>
                    <td class="ta-r">{{ ing.unidad }}</td>
                    <td class="ta-r"><strong>{{ ing.cantidad_necesaria.toFixed(2) }} {{ ing.unidad }}</strong></td>
                    <td class="ta-r font-mono">${{ ing.precio_unitario.toFixed(4) }}</td>
                    <td class="ta-r font-mono"><strong>${{ ing.costo_total.toFixed(2) }}</strong></td>
                  </tr>
                  <tr style="font-weight: 700;">
                    <td colspan="6" style="text-align:right"><strong>COSTO TOTAL PRODUCCIÓN:</strong></td>
                    <td class="ta-r font-mono"><strong>${{ costoTotalProduccion.toFixed(2) }}</strong></td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </v-card-text>

          <v-card-actions style="padding: 16px; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);">
            <v-btn variant="text" @click="cerrarModal">Cancelar</v-btn>
            <v-spacer />
            <v-btn v-if="pasoActivo === 1" color="#8b5cf6" variant="flat" @click="irAlPaso2" :disabled="recetasEnOrden.length === 0">
              <v-icon start>mdi-chevron-right</v-icon> Siguiente
            </v-btn>
            <v-btn v-if="pasoActivo === 2" variant="outlined" color="#8b5cf6" @click="pasoActivo = 1">
              <v-icon start>mdi-chevron-left</v-icon> Anterior
            </v-btn>
            <v-btn v-if="pasoActivo === 2" color="#22c55e" variant="flat" @click="guardarOrdenProduccion">
              <v-icon start>mdi-check</v-icon> Guardar Orden
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { useAuthStore } from '../../stores/auth.js'
import { API_BASE } from '../../utils/constants.js'

const auth = useAuthStore()

// STATE
const modalAbierto = ref(false)
const modoEdicion = ref(false)
const pasoActivo = ref(1)
const cargando = ref(false)

const pasos = [
  { id: 1, titulo: 'Crear Orden' },
  { id: 2, titulo: 'Ingredientes' }
]

const headersOrdenes = [
  { title: 'ID', key: 'id', width: '60px' },
  { title: 'RECETA', key: 'receta_nombre' },
  { title: 'CANTIDAD', key: 'cantidad_total', align: 'center' },
  { title: 'FECHA', key: 'fecha_inicio' },
  { title: 'ESTADO', key: 'estado' },
  { title: 'COSTO TOTAL', key: 'costo_total' },
  { title: 'ACCIONES', key: 'acciones', width: '200px' }
]

const ordenes = ref([])
const ordenForm = ref({
  cantidad_real: null,
  fecha_inicio: new Date().toISOString().split('T')[0],
  observaciones: ''
})

const productosProduccion = ref([])
const recetasEnOrden = ref([])
const recetaSeleccionada = ref('')
const cantidadReceta = ref(null)
const ingredientesCalculados = ref([])
const inventarioInfo = ref({ codigo: '', stock_actual: 0, consumo_7_dias: 0 })

watch(recetaSeleccionada, (codigo) => {
  if (codigo) cargarInventarioYConsumo(codigo)
  else inventarioInfo.value = { codigo: '', stock_actual: 0, consumo_7_dias: 0 }
})

const costoTotalProduccion = computed(() => {
  return ingredientesCalculados.value.reduce((sum, ing) => sum + ing.costo_total, 0)
})

async function cargarRecetasSubproducto() {
  try {
    cargando.value = true
    const r = await fetch(`${API_BASE}/recetas`)
    const j = await r.json()
    const todas = j.data || []
    productosProduccion.value = todas.filter(rc => rc.subproducto === 'SI')
  } catch (e) {
    console.error('Error al cargar recetas:', e)
  } finally {
    cargando.value = false
  }
}

async function cargarInventarioYConsumo(codigo) {
  try {
    const r = await fetch(`${API_BASE}/detalle-inventario/analisis/${encodeURIComponent(codigo)}`, {
      headers: {
        'x-empresa': auth.empresaCodigo
      }
    })
    const j = await r.json()

    if (!j.success || !j.data) {
      inventarioInfo.value = { codigo, stock_actual: 0, consumo_7_dias: 0 }
      return
    }

    const { stock_actual, consumo_7_dias } = j.data

    inventarioInfo.value = {
      codigo,
      stock_actual: parseFloat(stock_actual) || 0,
      consumo_7_dias: parseFloat(consumo_7_dias) || 0
    }
  } catch (e) {
    console.error('Error cargando inventario/consumo:', e)
    inventarioInfo.value = { codigo, stock_actual: 0, consumo_7_dias: 0 }
  }
}

async function agregarReceta() {
  if (!recetaSeleccionada.value || !cantidadReceta.value) {
    return
  }

  await cargarInventarioYConsumo(recetaSeleccionada.value)

  recetasEnOrden.value.push({
    codigo: recetaSeleccionada.value,
    nombre: productosProduccion.value.find(p => p.codigo === recetaSeleccionada.value)?.nombre || '',
    cantidad: cantidadReceta.value
  })

  recetaSeleccionada.value = ''
  cantidadReceta.value = null
}

function eliminarReceta(index) {
  recetasEnOrden.value.splice(index, 1)
}

async function cargarRecetaDetalle(codigo) {
  try {
    const r = await fetch(`${API_BASE}/recetas/${encodeURIComponent(codigo)}`)
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    return j.data
  } catch (e) {
    console.error('Error cargando receta:', e)
    return null
  }
}

async function calcularIngredientesTodas() {
  ingredientesCalculados.value = []

  for (const receta of recetasEnOrden.value) {
    const detalle = await cargarRecetaDetalle(receta.codigo)
    if (!detalle) continue

    const ingredientes = detalle.ingredientes || []
    const cantidad = receta.cantidad || 1

    const ingredsCalculados = ingredientes.map(ing => {
      const cantBase = parseFloat(ing.cantidad) || 0
      const precio = parseFloat(ing.precio_unit) || 0
      const cantNec = cantBase * cantidad
      return {
        ...ing,
        receta_codigo: receta.codigo,
        receta_nombre: receta.nombre,
        nombre: ing.nombre_item || ing.articulo_nombre || ing.articulo || '',
        cantidad_por_receta: cantBase,
        precio_unitario: precio,
        cantidad_necesaria: cantNec,
        costo_total: cantNec * precio
      }
    })

    ingredientesCalculados.value.push(...ingredsCalculados)
  }
}

function irAlPaso2() {
  if (recetasEnOrden.value.length === 0) return
  pasoActivo.value = 2
  calcularIngredientesTodas()
}

function abrirNuevaOrden() {
  modoEdicion.value = false
  pasoActivo.value = 1
  recetasEnOrden.value = []
  ingredientesCalculados.value = []
  recetaSeleccionada.value = ''
  cantidadReceta.value = null
  ordenForm.value = {
    cantidad_real: null,
    fecha_inicio: new Date().toISOString().split('T')[0],
    observaciones: ''
  }
  modalAbierto.value = true
}

function cerrarModal() {
  modalAbierto.value = false
}

function guardarOrdenProduccion() {
  // TODO: Guardar en BD
  cerrarModal()
  ordenes.value.push({
    id: ordenes.value.length + 1,
    receta_nombre: recetasEnOrden.value.map(r => r.nombre).join(', '),
    cantidad_total: recetasEnOrden.value.reduce((sum, r) => sum + r.cantidad, 0),
    fecha_inicio: ordenForm.value.fecha_inicio,
    estado: 'Pendiente',
    costo_total: costoTotalProduccion.value.toFixed(2)
  })
}

function editarOrden(item) {
  modoEdicion.value = true
  modalAbierto.value = true
  pasoActivo.value = 1
  // TODO: Cargar datos de la orden
}

function registrarProduccion(item) {
  // TODO: Abrir form para registrar producción real
}

function generarEtiquetas(item) {
  // TODO: Generar etiquetas PDF
}

function actualizarPrecios(item) {
  // TODO: Actualizar precios de compra
}

function confirmarEliminar(item) {
  if (confirm('¿Eliminar esta orden de producción?')) {
    // TODO: Eliminar en BD
    ordenes.value = ordenes.value.filter(o => o.id !== item.id)
  }
}

onMounted(() => {
  cargarRecetasSubproducto()
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

.prod-steps-container {
  background: rgb(var(--v-theme-surface)); border-radius: 10px; padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.prod-steps {
  display: flex; justify-content: space-between; gap: 12px;
}

.prod-step {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;
  opacity: 0.5; transition: all 0.3s ease;
}

.prod-step--active, .prod-step--completed { opacity: 1; }

.prod-step-number {
  width: 40px; height: 40px; border-radius: 50%;
  background: rgb(var(--v-theme-surface-variant)); color: rgb(var(--v-theme-on-surface-variant)); font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.3s ease;
}

.prod-step--active .prod-step-number {
  background: #8b5cf6; color: white; box-shadow: 0 0 0 4px rgba(139,92,246,0.1);
}

.prod-step--completed .prod-step-number {
  background: #22c55e; color: white;
}

.prod-step-title { font-size: 12px; font-weight: 600; color: rgb(var(--v-theme-on-surface-variant)); text-align: center; }

.prod-step--active .prod-step-title { color: #8b5cf6; }

.prod-form-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.inv-banner {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.inv-kpi {
  padding: 12px 14px;
  border-left: 3px solid;
  border-radius: 4px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-left-width: 3px;
}

.inv-kpi-label {
  font-size: 10px;
  opacity: 0.6;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.inv-kpi-val {
  font-size: 18px;
  font-weight: 700;
  font-family: monospace;
}

.ta-r { text-align: right; }
.font-mono { font-family: monospace; }
</style>
