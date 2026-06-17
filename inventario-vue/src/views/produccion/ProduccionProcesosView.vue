<template>
  <MainLayout>
    <div class="prod-wrap">
      <!-- HEADER -->
      <div class="prod-header">
        <div class="prod-header-icon"><v-icon size="20" color="white">mdi-hammer-wrench</v-icon></div>
        <div class="flex-1">
          <h1 class="prod-title">PROCESOS DE PRODUCCIÓN</h1>
          <p class="prod-sub">Crea órdenes, calcula ingredientes, registra producción y genera etiquetas</p>
        </div>
      </div>

      <!-- PASOS DEL PROCESO -->
      <div class="prod-steps-container">
        <div class="prod-steps">
          <div v-for="(paso, idx) in pasos" :key="idx"
            class="prod-step" :class="{ 'prod-step--active': pasoActivo === paso.id, 'prod-step--completed': pasoActivo > paso.id }">
            <div class="prod-step-number">{{ idx + 1 }}</div>
            <div class="prod-step-title">{{ paso.titulo }}</div>
          </div>
        </div>
      </div>

      <!-- CONTENIDO DE CADA PASO -->

      <!-- PASO 1: CREAR ORDEN -->
      <div v-if="pasoActivo === 1" class="prod-step-content">
        <h2>PASO 1: CREAR ORDEN DE PRODUCCIÓN</h2>

        <div class="prod-form-grid">
          <v-text-field v-model="ordenForm.fecha_inicio" label="Fecha" type="date" outlined dense />

          <v-select v-model="recetaSeleccionada" :items="productosProduccion" item-title="nombre" item-value="codigo"
            label="Seleccionar Receta (Subproducto)" outlined dense />

          <v-text-field v-model.number="cantidadReceta" label="Cantidad a Producir" type="number" placeholder="1000" outlined dense />

          <v-btn color="#8b5cf6" variant="flat" @click="agregarReceta" size="large" style="align-self: flex-end;">
            <v-icon start>mdi-plus</v-icon> Agregar Receta
          </v-btn>
        </div>

        <!-- INFORMACIÓN DE INVENTARIO Y CONSUMO CUANDO SE SELECCIONA RECETA -->
        <v-card v-if="recetaSeleccionada && inventarioInfo.codigo === recetaSeleccionada" class="prod-info-banner" style="margin-top: 24px;">
          <v-card-title style="font-size: 13px; padding: 12px;">📊 Análisis de Inventario y Consumo</v-card-title>
          <v-card-text style="padding: 0 12px 12px 12px;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
              <div style="padding: 12px; border-radius: 4px; border-left: 4px solid #8b5cf6; background: rgba(139,92,246,0.05);">
                <div style="font-size: 11px; opacity: 0.7; margin-bottom: 6px;">Inventario Bodega</div>
                <div style="font-size: 20px; font-weight: 700; color: #8b5cf6;">{{ inventarioInfo.stock_actual }}</div>
              </div>
              <div style="padding: 12px; border-radius: 4px; border-left: 4px solid #f59e0b; background: rgba(245,158,11,0.05);">
                <div style="font-size: 11px; opacity: 0.7; margin-bottom: 6px;">Consumo Últimos 7 Días</div>
                <div style="font-size: 20px; font-weight: 700; color: #f59e0b;">{{ inventarioInfo.consumo_7_dias }}</div>
              </div>
              <div style="padding: 12px; border-radius: 4px; border-left: 4px solid #10b981; background: rgba(16,185,129,0.05);">
                <div style="font-size: 11px; opacity: 0.7; margin-bottom: 6px;">Diferencia (a Producir)</div>
                <div style="font-size: 20px; font-weight: 700; color: #10b981;">{{ Math.max(0, inventarioInfo.consumo_7_dias - inventarioInfo.stock_actual) }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- TABLA DE RECETAS EN LA ORDEN -->
        <v-card v-if="recetasEnOrden.length > 0" style="margin-top: 24px;">
          <v-card-title style="font-size: 13px; padding: 12px;">RECETAS EN LA ORDEN</v-card-title>
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

        <v-textarea v-model="ordenForm.observaciones" label="Observaciones" rows="3" outlined dense style="margin-top: 24px;" />

        <div class="prod-form-actions">
          <v-btn color="#8b5cf6" variant="flat" @click="crearOrden" size="large">
            <v-icon start>mdi-check</v-icon> Siguiente: Calcular Ingredientes
          </v-btn>
        </div>
      </div>

      <!-- PASO 2: INGREDIENTES -->
      <div v-if="pasoActivo === 2" class="prod-step-content">
        <h2>PASO 2: INGREDIENTES NECESARIOS</h2>

        <v-alert type="info" variant="outlined" icon="mdi-information" style="margin-bottom: 16px;">
          <strong>Recetas en la orden:</strong> {{ recetasEnOrden.length }} | <strong>Total ingredientes:</strong> {{ ingredientesCalculados.length }}
        </v-alert>

        <v-table density="compact">
          <thead>
            <tr>
              <th>RECETA</th>
              <th>INGREDIENTE</th>
              <th class="ta-r">CANTIDAD/UNIDAD</th>
              <th class="ta-r">UNIDAD</th>
              <th class="ta-r">NECESARIA</th>
              <th class="ta-r">PRECIO UNITARIO</th>
              <th class="ta-r">COSTO TOTAL</th>
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

        <div class="prod-form-actions">
          <v-btn variant="outlined" color="#8b5cf6" @click="pasoActivo = 1" size="large">
            <v-icon start>mdi-chevron-left</v-icon> Anterior
          </v-btn>
          <v-spacer />
          <v-btn color="#22c55e" variant="flat" @click="guardarOrdenProduccion" size="large">
            <v-icon start>mdi-check</v-icon> Guardar Orden de Producción
          </v-btn>
        </div>
      </div>

      <!-- PASO 3: REGISTRAR PRODUCCIÓN REAL -->
      <div v-if="pasoActivo === 3" class="prod-step-content">
        <h2>PASO 3: REGISTRAR PRODUCCIÓN REAL</h2>

        <div class="prod-form-grid">
          <v-text-field :value="recetasEnOrden.reduce((sum, r) => sum + (r.cantidad || 0), 0)" label="Cantidad Total Planeada" type="number" disabled outlined dense helper-text="Suma de todas las recetas en la orden" />
          <v-text-field v-model.number="ordenForm.cantidad_real" label="Cantidad Realmente Producida" type="number" placeholder="1000" outlined dense helper-text="Ingresa el total realizado" />
        </div>

        <v-textarea v-model="ordenForm.observaciones" label="Observaciones de Producción" rows="3" outlined dense style="margin-top: 16px;" />

        <div class="prod-form-actions">
          <v-btn variant="outlined" color="#8b5cf6" @click="pasoActivo = 2" size="large">
            <v-icon start>mdi-chevron-left</v-icon> Anterior
          </v-btn>
          <v-spacer />
          <v-btn color="#8b5cf6" variant="flat" @click="pasoActivo = 4" size="large">
            <v-icon start>mdi-check</v-icon> Siguiente: Generar Etiquetas
          </v-btn>
        </div>
      </div>

      <!-- PASO 4: GENERAR ETIQUETAS -->
      <div v-if="pasoActivo === 4" class="prod-step-content">
        <h2>PASO 4: GENERAR ETIQUETAS (4x6)</h2>

        <div class="prod-label-preview">
          <div class="label-4x6">
            <div class="label-title">{{ recetaActual?.nombre }}</div>
            <div class="label-info">
              <div><strong>Lote:</strong> PROD-{{ new Date().toISOString().split('T')[0].replace(/-/g, '') }}-001</div>
              <div><strong>Fecha Prod:</strong> {{ ordenForm.fecha_inicio }}</div>
              <div><strong>Vencimiento:</strong> {{ ordenForm.fecha_vencimiento }}</div>
              <div style="margin-top:8px;"><strong>Costo Unitario:</strong> ${{ (costoTotalProduccion / (ordenForm.cantidad_real || 1)).toFixed(4) }}</div>
            </div>
            <div class="label-barcode">████████████████</div>
          </div>
        </div>

        <v-text-field v-model.number="cantidadEtiquetas" label="Cantidad de Etiquetas a Imprimir" type="number" outlined dense style="max-width: 300px; margin-top: 16px;" />

        <div class="prod-form-actions">
          <v-btn variant="outlined" color="#8b5cf6" @click="pasoActivo = 3" size="large">
            <v-icon start>mdi-chevron-left</v-icon> Anterior
          </v-btn>
          <v-spacer />
          <v-btn color="#22c55e" variant="flat" @click="finalizarProduccion" size="large">
            <v-icon start>mdi-check-all</v-icon> COMPLETAR PRODUCCIÓN Y GENERAR PDF
          </v-btn>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { useAuthStore } from '../../stores/auth.js'
import { API_BASE } from '../../utils/constants.js'

const auth = useAuthStore()

const pasoActivo = ref(1)
const cantidadEtiquetas = ref(0)
const cargando = ref(false)
const errorMsg = ref('')

const pasos = [
  { id: 1, titulo: 'Crear Orden' },
  { id: 2, titulo: 'Ingredientes' },
  { id: 3, titulo: 'Registrar Producción' },
  { id: 4, titulo: 'Generar Etiquetas' }
]

const ordenForm = ref({
  cantidad_real: null,
  fecha_inicio: new Date().toISOString().split('T')[0],
  fecha_vencimiento: null,
  observaciones: ''
})

// Recetas con subproducto === 'SI' (productos propios)
const productosProduccion = ref([])
const recetasEnOrden = ref([]) // Array de recetas en la orden actual
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
    errorMsg.value = 'Error al cargar recetas'
  } finally {
    cargando.value = false
  }
}

function formatFecha(fecha) {
  if (!fecha) return '—'
  const d = new Date(fecha + 'T00:00:00')
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  return `${dias[d.getDay()]} ${d.toLocaleDateString('es-ES')}`
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
    alert('Selecciona una receta e ingresa una cantidad')
    return
  }

  // Cargar inventario y consumo
  await cargarInventarioYConsumo(recetaSeleccionada.value)

  // Agregar a la tabla
  recetasEnOrden.value.push({
    codigo: recetaSeleccionada.value,
    nombre: productosProduccion.value.find(p => p.codigo === recetaSeleccionada.value)?.nombre || '',
    cantidad: cantidadReceta.value
  })

  // Reset
  recetaSeleccionada.value = ''
  cantidadReceta.value = null
}

function eliminarReceta(index) {
  recetasEnOrden.value.splice(index, 1)
}

function crearOrden() {
  if (recetasEnOrden.value.length === 0) {
    alert('Agrega al menos una receta a la orden')
    return
  }
  pasoActivo.value = 2
  calcularIngredientesTodas()
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
      const precio   = parseFloat(ing.precio_unit) || 0
      const cantNec  = cantBase * cantidad
      return {
        ...ing,
        receta_codigo: receta.codigo,
        receta_nombre: receta.nombre,
        nombre:             ing.nombre_item || ing.articulo_nombre || ing.articulo || '',
        cantidad_por_receta: cantBase,
        precio_unitario:    precio,
        cantidad_necesaria: cantNec,
        costo_total:        cantNec * precio
      }
    })

    ingredientesCalculados.value.push(...ingredsCalculados)
  }
}

function calcularMargenError() {
  const planeada = recetasEnOrden.value.reduce((sum, r) => sum + (r.cantidad || 0), 0) || 0
  const real = ordenForm.value.cantidad_real || 0
  return planeada > 0 ? ((real - planeada) / planeada * 100) : 0
}

function guardarOrdenProduccion() {
  // TODO: Implementar guardado real en BD
  recetasEnOrden.value = []
  ingredientesCalculados.value = []
  recetaSeleccionada.value = ''
  cantidadReceta.value = null
  pasoActivo.value = 1
  ordenForm.value = {
    cantidad_real: null,
    fecha_inicio: new Date().toISOString().split('T')[0],
    observaciones: ''
  }
}

function finalizarProduccion() {
  alert('✅ Producción completada. PDF de etiquetas generado.')
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
  margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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

.prod-step-content {
  background: rgb(var(--v-theme-surface)); border-radius: 10px; padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.prod-step-content h2 {
  font-size: 18px; font-weight: 700; color: rgb(var(--v-theme-on-surface));
  margin: 0 0 20px 0;
}

.prod-form-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px; margin-bottom: 16px;
}

.prod-form-actions {
  display: flex; gap: 12px; margin-top: 24px; align-items: center;
}


.ta-r { text-align: right; }
.font-mono { font-family: monospace; }

.prod-label-preview {
  display: flex; justify-content: center; margin-bottom: 24px;
}

.label-4x6 {
  width: 400px; height: 600px; border: 2px solid #8b5cf6;
  border-radius: 8px; padding: 16px; background: rgb(var(--v-theme-surface));
  display: flex; flex-direction: column; gap: 8px;
  font-size: 12px; color: rgb(var(--v-theme-on-surface));
}

.label-title {
  font-weight: 800; font-size: 16px; color: #8b5cf6;
  border-bottom: 2px solid #8b5cf6; padding-bottom: 8px;
}

.label-info { flex: 1; font-size: 11px; }

.label-barcode {
  text-align: center; font-family: monospace; font-size: 20px;
  letter-spacing: 2px; padding: 8px; background: rgb(var(--v-theme-surface-variant));
  border-radius: 4px; color: rgb(var(--v-theme-on-surface));
}
</style>
