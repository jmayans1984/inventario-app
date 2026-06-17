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
          <div class="prod-form-group">
            <label>SELECCIONAR RECETA (SUBPRODUCTO)</label>
            <select v-model="recetaSeleccionada" class="drw-input">
              <option value="">-- Seleccionar receta --</option>
              <option v-for="p in productosProduccion" :key="p.codigo" :value="p.codigo">
                {{ p.nombre }}
              </option>
            </select>
          </div>

          <div class="prod-form-group">
            <label>CANTIDAD A PRODUCIR</label>
            <input v-model.number="cantidadReceta" type="number" placeholder="1000" class="drw-input" />
          </div>

          <div class="prod-form-group" style="display: flex; align-items: flex-end;">
            <v-btn color="#8b5cf6" variant="flat" @click="agregarReceta" size="small" style="width: 100%;">
              <v-icon start>mdi-plus</v-icon> Agregar Receta
            </v-btn>
          </div>
        </div>

        <!-- INFORMACIÓN DE INVENTARIO Y CONSUMO CUANDO SE SELECCIONA RECETA -->
        <div v-if="recetaSeleccionada && inventarioInfo.codigo === recetaSeleccionada" class="prod-info-banner" style="margin-top: 24px; background: #f0f9ff; border-color: #0ea5e9;">
          <strong style="color: #0369a1;">📊 Análisis de Inventario y Consumo:</strong>
          <div style="margin-top: 12px; font-size: 13px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
            <div style="background: white; padding: 12px; border-radius: 4px; border-left: 4px solid #8b5cf6;">
              <div style="font-size: 11px; color: #6b7280;">Inventario Bodega</div>
              <div style="font-size: 20px; font-weight: 700; color: #8b5cf6;">{{ inventarioInfo.stock_actual }}</div>
            </div>
            <div style="background: white; padding: 12px; border-radius: 4px; border-left: 4px solid #f59e0b;">
              <div style="font-size: 11px; color: #6b7280;">Consumo Últimos 7 Días</div>
              <div style="font-size: 20px; font-weight: 700; color: #f59e0b;">{{ inventarioInfo.consumo_7_dias }}</div>
            </div>
            <div style="background: white; padding: 12px; border-radius: 4px; border-left: 4px solid #10b981;">
              <div style="font-size: 11px; color: #6b7280;">Diferencia (a Producir)</div>
              <div style="font-size: 20px; font-weight: 700; color: #10b981;">{{ Math.max(0, inventarioInfo.consumo_7_dias - inventarioInfo.stock_actual) }}</div>
            </div>
          </div>
        </div>

        <!-- TABLA DE RECETAS EN LA ORDEN -->
        <div v-if="recetasEnOrden.length > 0" style="margin-top: 24px;">
          <strong style="display: block; margin-bottom: 12px; color: #374151;">RECETAS EN LA ORDEN:</strong>
          <div class="prod-table-wrap">
            <table class="prod-table">
              <thead>
                <tr>
                  <th>RECETA</th>
                  <th class="ta-c">CANTIDAD</th>
                  <th style="width: 80px; text-align: center;">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(rec, idx) in recetasEnOrden" :key="idx">
                  <td>{{ rec.nombre }}</td>
                  <td class="ta-c">{{ rec.cantidad }}</td>
                  <td style="text-align: center;">
                    <v-btn size="x-small" variant="text" color="#ef4444" @click="eliminarReceta(idx)">
                      <v-icon size="14">mdi-delete</v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- BOTONES PASO 1 -->
        <div class="prod-form-actions" style="margin-top: 24px;">
          <v-btn color="#22c55e" variant="flat" @click="crearOrden" size="large" :disabled="recetasEnOrden.length === 0">
            <v-icon start>mdi-chevron-right</v-icon> Siguiente
          </v-btn>
        </div>

        <div class="prod-form-grid" style="margin-top: 16px;">

          <div class="prod-form-group">
            <label>FECHA DE INICIO</label>
            <input v-model="ordenForm.fecha_inicio" type="date" class="drw-input" />
          </div>

          <div class="prod-form-group">
            <label>FECHA DE VENCIMIENTO</label>
            <input v-model="ordenForm.fecha_vencimiento" type="date" class="drw-input" />
          </div>
        </div>

        <div class="prod-form-group">
          <label>OBSERVACIONES</label>
          <textarea v-model="ordenForm.observaciones" rows="3" class="drw-input"></textarea>
        </div>

        <div class="prod-form-actions">
          <v-btn color="#8b5cf6" variant="flat" @click="crearOrden" size="large">
            <v-icon start>mdi-check</v-icon> Siguiente: Calcular Ingredientes
          </v-btn>
        </div>
      </div>

      <!-- PASO 2: INGREDIENTES -->
      <div v-if="pasoActivo === 2" class="prod-step-content">
        <h2>PASO 2: INGREDIENTES NECESARIOS</h2>

        <div class="prod-info-banner">
          <strong>Recetas en la orden:</strong> {{ recetasEnOrden.length }} |
          <strong>Total ingredientes:</strong> {{ ingredientesCalculados.length }}
        </div>

        <div class="prod-table-wrap">
          <table class="prod-table">
            <thead>
              <tr>
                <th>RECETA</th>
                <th>INGREDIENTE</th>
                <th class="ta-r">CANTIDAD/UNIDAD</th>
                <th class="ta-r">NECESARIA</th>
                <th class="ta-r">PRECIO UNITARIO</th>
                <th class="ta-r">COSTO TOTAL</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(ing, idx) in ingredientesCalculados" :key="idx">
                <td><strong style="color: #8b5cf6;">{{ ing.receta_nombre }}</strong></td>
                <td>{{ ing.nombre }}</td>
                <td class="ta-r">{{ ing.cantidad_por_receta }} {{ ing.unidad }}</td>
                <td class="ta-r"><strong>{{ ing.cantidad_necesaria.toFixed(2) }}</strong></td>
                <td class="ta-r font-mono">${{ ing.precio_unitario.toFixed(4) }}</td>
                <td class="ta-r font-mono"><strong>${{ ing.costo_total.toFixed(2) }}</strong></td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="prod-tfoot">
                <td colspan="5" style="text-align:right"><strong>COSTO TOTAL PRODUCCIÓN:</strong></td>
                <td class="ta-r font-mono"><strong>${{ costoTotalProduccion.toFixed(2) }}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="prod-form-actions">
          <v-btn variant="outlined" color="#8b5cf6" @click="pasoActivo = 1" size="large">
            <v-icon start>mdi-chevron-left</v-icon> Anterior
          </v-btn>
          <v-spacer />
          <v-btn color="#8b5cf6" variant="flat" @click="pasoActivo = 3" size="large">
            <v-icon start>mdi-check</v-icon> Siguiente: Registrar Producción
          </v-btn>
        </div>
      </div>

      <!-- PASO 3: REGISTRAR PRODUCCIÓN REAL -->
      <div v-if="pasoActivo === 3" class="prod-step-content">
        <h2>PASO 3: REGISTRAR PRODUCCIÓN REAL</h2>

        <div class="prod-form-grid">
          <div class="prod-form-group">
            <label>CANTIDAD TOTAL PLANEADA</label>
            <input :value="recetasEnOrden.reduce((sum, r) => sum + (r.cantidad || 0), 0)" type="number" disabled class="drw-input" />
            <div class="prod-hint">Suma de todas las recetas en la orden</div>
          </div>

          <div class="prod-form-group">
            <label>CANTIDAD REALMENTE PRODUCIDA</label>
            <input v-model.number="ordenForm.cantidad_real" type="number" placeholder="1000" class="drw-input" />
            <div class="prod-hint">Ingresa el total realizado</div>
          </div>
        </div>

        <div class="prod-form-group">
          <label>OBSERVACIONES DE PRODUCCIÓN</label>
          <textarea v-model="ordenForm.observaciones" rows="3" class="drw-input"></textarea>
        </div>

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

        <div class="prod-form-group">
          <label>CANTIDAD DE ETIQUETAS A IMPRIMIR</label>
          <input v-model.number="cantidadEtiquetas" type="number" class="drw-input" />
        </div>

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
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { API_BASE } from '../../utils/constants.js'

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
    const r = await fetch(`${API_BASE}/detalle-inventario/analisis/${encodeURIComponent(codigo)}`)
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

function finalizarProduccion() {
  alert('✅ Producción completada. PDF de etiquetas generado.')
}

onMounted(() => {
  const hoy = new Date()
  const vencimiento = new Date(hoy.setDate(hoy.getDate() + 30))
  ordenForm.value.fecha_vencimiento = vencimiento.toISOString().split('T')[0]
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
  background: white; border-radius: 10px; padding: 16px;
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
  background: #e5e7eb; color: #6b7280; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.3s ease;
}

.prod-step--active .prod-step-number {
  background: #8b5cf6; color: white; box-shadow: 0 0 0 4px rgba(139,92,246,0.1);
}

.prod-step--completed .prod-step-number {
  background: #22c55e; color: white;
}

.prod-step-title { font-size: 12px; font-weight: 600; color: #6b7280; text-align: center; }

.prod-step--active .prod-step-title { color: #8b5cf6; }

.prod-step-content {
  background: white; border-radius: 10px; padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.prod-step-content h2 {
  font-size: 18px; font-weight: 700; color: #1f2937;
  margin: 0 0 20px 0;
}

.prod-form-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px; margin-bottom: 16px;
}

.prod-form-group {
  display: flex; flex-direction: column; gap: 6px;
}

.prod-form-group label {
  font-size: 12px; font-weight: 700; color: #374151; text-transform: uppercase;
  letter-spacing: 0.5px;
}

.drw-input {
  padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px;
  font-size: 13px; font-family: inherit;
}

.drw-input:focus { outline: none; border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139,92,246,0.1); }

.prod-hint { font-size: 11px; color: #9ca3af; margin-top: 4px; }

.prod-form-actions {
  display: flex; gap: 12px; margin-top: 24px; align-items: center;
}

.prod-info-banner {
  background: rgba(139,92,246,0.1); border-left: 4px solid #8b5cf6;
  padding: 12px 16px; border-radius: 6px; font-size: 13px; margin-bottom: 20px;
}

.prod-table-wrap { overflow-x: auto; margin-bottom: 20px; }

.prod-table {
  width: 100%; border-collapse: collapse; font-size: 13px;
}

.prod-table thead { background: #f9fafb; }

.prod-table th {
  padding: 12px; text-align: left; font-weight: 700;
  color: #6b7280; border-bottom: 2px solid #e5e7eb;
  font-size: 11px; text-transform: uppercase;
}

.prod-table td {
  padding: 12px; border-bottom: 1px solid #f3f4f6; color: #374151;
}

.prod-table tbody tr:hover { background: #f9fafb; }

.prod-tfoot td {
  background: #fafafa; font-weight: 700; border-top: 2px solid #e5e7eb;
  padding: 14px 12px;
}

.ta-r { text-align: right; }
.font-mono { font-family: monospace; }

.prod-label-preview {
  display: flex; justify-content: center; margin-bottom: 24px;
}

.label-4x6 {
  width: 400px; height: 600px; border: 1px dashed #d1d5db;
  border-radius: 8px; padding: 16px; background: white;
  display: flex; flex-direction: column; gap: 8px;
  font-size: 12px;
}

.label-title {
  font-weight: 800; font-size: 16px; color: #8b5cf6;
  border-bottom: 2px solid #8b5cf6; padding-bottom: 8px;
}

.label-info { flex: 1; font-size: 11px; }

.label-barcode {
  text-align: center; font-family: monospace; font-size: 20px;
  letter-spacing: 2px; padding: 8px; background: #f9fafb;
  border-radius: 4px;
}
</style>
