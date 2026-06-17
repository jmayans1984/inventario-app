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
                    <v-btn v-bind="props" icon size="x-small" variant="tonal" color="blue" @click="editarOrden(item)">
                      <v-icon size="14">mdi-pencil-outline</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
                <v-tooltip text="Registrar producción">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon size="x-small" variant="tonal" color="#8b5cf6" @click="registrarProduccion(item)">
                      <v-icon size="14">mdi-check-circle-outline</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
                <v-tooltip text="Generar etiquetas">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon size="x-small" variant="tonal" color="#f59e0b" @click="generarEtiquetas(item)">
                      <v-icon size="14">mdi-tag-multiple-outline</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
                <v-tooltip text="Actualizar precios">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon size="x-small" variant="tonal" color="#06b6d4" @click="actualizarPrecios(item)">
                      <v-icon size="14">mdi-currency-usd</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
                <v-tooltip text="Eliminar orden">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon size="x-small" variant="tonal" color="error" @click="confirmarEliminar(item)">
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

      <!-- ═══════════════════════════════════════════════════════════
           MODAL: NUEVA ORDEN — split-panel redesign
           ═══════════════════════════════════════════════════════════ -->
      <v-dialog v-model="modalAbierto" max-width="1100px">
        <div class="np-shell">

          <!-- ─── LEFT SIDEBAR ─────────────────────────────────── -->
          <div class="np-sidebar">

            <div class="np-brand">
              <div class="np-brand-icon">
                <v-icon color="white" size="18">mdi-hammer-wrench</v-icon>
              </div>
              <div>
                <div class="np-brand-title">{{ modoEdicion ? 'Editar Orden' : 'Nueva Orden' }}</div>
                <div class="np-brand-sub">de Producción</div>
              </div>
            </div>

            <!-- STEP NAV -->
            <div class="np-steps">
              <div v-for="(paso, idx) in pasos" :key="paso.id"
                class="np-step"
                :class="{ 'np-step--active': pasoActivo === paso.id, 'np-step--done': pasoActivo > paso.id }">
                <div class="np-step-track" v-if="idx > 0"></div>
                <div class="np-step-row">
                  <div class="np-step-dot">
                    <v-icon v-if="pasoActivo > paso.id" size="12" color="white">mdi-check</v-icon>
                    <span v-else>{{ idx + 1 }}</span>
                  </div>
                  <div class="np-step-label">{{ paso.titulo }}</div>
                </div>
              </div>
            </div>

            <!-- KPI BLOCK — visible when a recipe is selected -->
            <div v-if="recetaSeleccionada && inventarioInfo.codigo === recetaSeleccionada" class="np-kpis">
              <div class="np-kpi-title">ANÁLISIS DE STOCK</div>
              <div class="np-kpi" style="--kc: #a78bfa;">
                <div class="np-kpi-label">INVENTARIO BODEGA</div>
                <div class="np-kpi-val">{{ inventarioInfo.stock_actual }}</div>
              </div>
              <div class="np-kpi" style="--kc: #fbbf24;">
                <div class="np-kpi-label">CONSUMO 7 DÍAS</div>
                <div class="np-kpi-val">{{ inventarioInfo.consumo_7_dias }}</div>
              </div>
              <div class="np-kpi" style="--kc: #34d399;">
                <div class="np-kpi-label">A PRODUCIR</div>
                <div class="np-kpi-val">{{ Math.max(0, inventarioInfo.consumo_7_dias - inventarioInfo.stock_actual) }}</div>
              </div>
            </div>

            <div class="np-sidebar-footer">
              <button class="np-cancel-btn" @click="cerrarModal">
                <v-icon size="14">mdi-close</v-icon> Cancelar
              </button>
            </div>
          </div>

          <!-- ─── RIGHT CONTENT PANEL ───────────────────────────── -->
          <div class="np-content">

            <!-- ══ PASO 1 ══════════════════════════════════════════ -->
            <div v-if="pasoActivo === 1" class="np-pane">
              <div class="np-pane-header">
                <div class="np-pane-step-tag">PASO 1 / 2</div>
                <h2 class="np-pane-title">Crear Orden de Producción</h2>
              </div>

              <div class="np-field-row">
                <v-text-field
                  v-model="ordenForm.fecha_inicio"
                  label="Fecha"
                  type="date"
                  variant="outlined"
                  density="compact"
                  style="max-width: 200px;"
                  hide-details
                />
              </div>

              <div class="np-add-row">
                <v-select
                  v-model="recetaSeleccionada"
                  :items="productosProduccion"
                  item-title="nombre"
                  item-value="codigo"
                  label="Seleccionar Receta"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="np-add-select"
                />
                <v-text-field
                  v-model.number="cantidadReceta"
                  label="Cantidad"
                  type="number"
                  variant="outlined"
                  density="compact"
                  hide-details
                  style="width: 120px; flex-shrink: 0;"
                />
                <v-btn color="#8b5cf6" variant="flat" height="40" min-width="48" @click="agregarReceta">
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </div>

              <div v-if="recetasEnOrden.length > 0" class="np-recipe-list">
                <div class="np-recipe-list-title">RECETAS EN LA ORDEN</div>
                <div v-for="(rec, idx) in recetasEnOrden" :key="idx" class="np-recipe-row">
                  <v-icon size="16" color="#8b5cf6" style="flex-shrink:0;">mdi-chef-hat</v-icon>
                  <span class="np-recipe-name">{{ rec.nombre }}</span>
                  <span class="np-recipe-qty">{{ rec.cantidad }}</span>
                  <button class="np-recipe-del" @click="eliminarReceta(idx)">
                    <v-icon size="14">mdi-close</v-icon>
                  </button>
                </div>
              </div>
              <div v-else class="np-recipe-empty">
                <v-icon size="36" style="opacity:0.25; margin-bottom:6px;">mdi-chef-hat</v-icon>
                <span>Agrega al menos una receta para continuar</span>
              </div>

              <v-textarea
                v-model="ordenForm.observaciones"
                label="Observaciones (opcional)"
                rows="2"
                variant="outlined"
                density="compact"
                hide-details
              />

              <div class="np-actions">
                <v-btn
                  color="#8b5cf6"
                  variant="flat"
                  size="default"
                  :disabled="recetasEnOrden.length === 0"
                  @click="irAlPaso2"
                >
                  Ver Ingredientes <v-icon end>mdi-arrow-right</v-icon>
                </v-btn>
              </div>
            </div>

            <!-- ══ PASO 2 ══════════════════════════════════════════ -->
            <div v-if="pasoActivo === 2" class="np-pane">
              <div class="np-pane-header">
                <div class="np-pane-step-tag">PASO 2 / 2</div>
                <h2 class="np-pane-title">Ingredientes Necesarios</h2>
              </div>

              <div class="np-ing-meta">
                <span class="np-ing-badge">{{ recetasEnOrden.length }} receta(s)</span>
                <span class="np-ing-badge">{{ ingredientesCalculados.length }} ingredientes</span>
                <span class="np-ing-cost">Costo estimado: <strong>${{ costoTotalProduccion.toFixed(2) }}</strong></span>
              </div>

              <div class="np-table-wrap">
                <table class="np-table">
                  <thead>
                    <tr>
                      <th>RECETA</th>
                      <th>INGREDIENTE</th>
                      <th class="tr">CANT/RECETA</th>
                      <th class="tr">UNIDAD</th>
                      <th class="tr">NECESARIA</th>
                      <th class="tr">PRECIO UNIT.</th>
                      <th class="tr">COSTO</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(ing, idx) in ingredientesCalculados" :key="idx">
                      <td><span class="np-tag-receta">{{ ing.receta_nombre }}</span></td>
                      <td>{{ ing.nombre }}</td>
                      <td class="tr mono">{{ ing.cantidad_por_receta.toFixed(2) }}</td>
                      <td class="tr">{{ ing.unidad }}</td>
                      <td class="tr mono fw7">{{ ing.cantidad_necesaria.toFixed(2) }} {{ ing.unidad }}</td>
                      <td class="tr mono">${{ ing.precio_unitario.toFixed(4) }}</td>
                      <td class="tr mono fw7">${{ ing.costo_total.toFixed(2) }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="6" class="tr tf-label">COSTO TOTAL PRODUCCIÓN:</td>
                      <td class="tr mono fw7 tf-val">${{ costoTotalProduccion.toFixed(2) }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div class="np-actions">
                <v-btn variant="text" @click="pasoActivo = 1">
                  <v-icon start>mdi-arrow-left</v-icon> Anterior
                </v-btn>
                <v-btn color="#22c55e" variant="flat" size="default" @click="guardarOrdenProduccion">
                  <v-icon start>mdi-check</v-icon> Guardar Orden
                </v-btn>
              </div>
            </div>

          </div>
        </div>
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
      headers: { 'x-empresa': auth.empresaCodigo }
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
  if (!recetaSeleccionada.value || !cantidadReceta.value) return
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
}

function registrarProduccion(item) {}
function generarEtiquetas(item) {}
function actualizarPrecios(item) {}

function confirmarEliminar(item) {
  ordenes.value = ordenes.value.filter(o => o.id !== item.id)
}

onMounted(() => {
  cargarRecetasSubproducto()
})
</script>

<style scoped>
/* ═══ PAGE ═══════════════════════════════════════════════════════════════ */
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

/* ═══ MODAL SHELL ════════════════════════════════════════════════════════ */
.np-shell {
  display: flex;
  min-height: 540px;
  max-height: 88vh;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0,0,0,0.4);
}

/* ═══ SIDEBAR ════════════════════════════════════════════════════════════ */
.np-sidebar {
  width: 220px;
  min-width: 220px;
  background: #1e1b4b;
  display: flex;
  flex-direction: column;
  padding: 24px 18px;
}

.np-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 36px;
}
.np-brand-icon {
  width: 36px; height: 36px; border-radius: 8px;
  background: rgba(139,92,246,0.4);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.np-brand-title {
  font-size: 13px; font-weight: 700; color: white; line-height: 1.2;
}
.np-brand-sub {
  font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 2px;
}

.np-steps { display: flex; flex-direction: column; margin-bottom: 28px; }

.np-step { display: flex; flex-direction: column; opacity: 0.4; transition: opacity 0.2s; }
.np-step--active, .np-step--done { opacity: 1; }

.np-step-track {
  width: 2px; height: 16px;
  background: rgba(255,255,255,0.12);
  margin-left: 13px;
}
.np-step--done .np-step-track { background: #22c55e; }

.np-step-row { display: flex; align-items: center; gap: 12px; }

.np-step-dot {
  width: 28px; height: 28px; border-radius: 50%;
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.5);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800; flex-shrink: 0;
  transition: all 0.2s;
}
.np-step--active .np-step-dot {
  background: #8b5cf6;
  color: white;
  box-shadow: 0 0 0 4px rgba(139,92,246,0.25);
}
.np-step--done .np-step-dot { background: #22c55e; color: white; }

.np-step-label {
  font-size: 12px; font-weight: 600; color: white; letter-spacing: 0.2px;
}

.np-kpis {
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}
.np-kpi-title {
  font-size: 9px; font-weight: 700; letter-spacing: 1px;
  color: rgba(255,255,255,0.3); margin-bottom: 6px;
}
.np-kpi {
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(255,255,255,0.06);
  border-left: 3px solid var(--kc);
}
.np-kpi-label {
  font-size: 9px; font-weight: 600; letter-spacing: 0.7px;
  color: rgba(255,255,255,0.4); margin-bottom: 4px;
}
.np-kpi-val {
  font-size: 22px; font-weight: 800; font-family: monospace;
  color: var(--kc);
}

.np-sidebar-footer {
  padding-top: 16px;
  margin-top: auto;
}
.np-cancel-btn {
  display: flex; align-items: center; gap: 6px;
  background: none; border: 1px solid rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.5); cursor: pointer;
  font-size: 12px; padding: 7px 12px; border-radius: 6px;
  transition: all 0.15s; width: 100%; justify-content: center;
}
.np-cancel-btn:hover {
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.85);
}

/* ═══ CONTENT PANEL ══════════════════════════════════════════════════════ */
.np-content {
  flex: 1;
  background: rgb(var(--v-theme-surface));
  overflow-y: auto;
}

.np-pane {
  padding: 28px 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
  box-sizing: border-box;
}

.np-pane-header { margin-bottom: 4px; }
.np-pane-step-tag {
  font-size: 10px; font-weight: 700; letter-spacing: 1px;
  color: #8b5cf6; margin-bottom: 4px;
}
.np-pane-title {
  font-size: 20px; font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  margin: 0 0 4px 0;
  padding-bottom: 14px;
  border-bottom: 2px solid rgba(var(--v-theme-on-surface), 0.07);
}

.np-field-row { display: flex; }

.np-add-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.np-add-select { flex: 1; }

.np-recipe-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.np-recipe-list-title {
  font-size: 10px; font-weight: 700; letter-spacing: 0.8px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  margin-bottom: 4px;
}
.np-recipe-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  background: rgba(139,92,246,0.07);
  border: 1px solid rgba(139,92,246,0.18);
}
.np-recipe-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}
.np-recipe-qty {
  font-size: 11px; font-weight: 700; font-family: monospace;
  color: #8b5cf6;
  background: rgba(139,92,246,0.15);
  padding: 2px 8px; border-radius: 4px;
}
.np-recipe-del {
  background: none; border: none; cursor: pointer;
  color: rgba(var(--v-theme-on-surface), 0.3); padding: 2px;
  border-radius: 4px; display: flex; align-items: center;
  transition: color 0.15s;
}
.np-recipe-del:hover { color: #ef4444; }

.np-recipe-empty {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 28px 16px;
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 10px;
  color: rgba(var(--v-theme-on-surface), 0.35);
  font-size: 12px; text-align: center;
  gap: 4px;
}

.np-ing-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.np-ing-badge {
  font-size: 11px; font-weight: 600;
  background: rgba(var(--v-theme-on-surface), 0.07);
  color: rgba(var(--v-theme-on-surface), 0.6);
  padding: 3px 9px; border-radius: 20px;
}
.np-ing-cost {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-left: auto;
}
.np-ing-cost strong { color: #22c55e; font-size: 14px; }

.np-table-wrap {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}
.np-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.np-table thead th {
  background: rgba(var(--v-theme-on-surface), 0.04);
  font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.45);
  padding: 9px 10px; white-space: nowrap;
}
.np-table tbody td {
  padding: 8px 10px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  color: rgb(var(--v-theme-on-surface));
}
.np-table tfoot td {
  padding: 10px;
  border-top: 2px solid rgba(var(--v-theme-on-surface), 0.1);
  background: rgba(var(--v-theme-on-surface), 0.03);
}
.np-tag-receta {
  background: rgba(139,92,246,0.1);
  color: #a78bfa;
  font-size: 10px; font-weight: 700;
  padding: 2px 7px; border-radius: 4px;
  white-space: nowrap;
}
.tr { text-align: right; }
.mono { font-family: monospace; }
.fw7 { font-weight: 700; }
.tf-label { font-weight: 700; font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.6); }
.tf-val { font-size: 14px; color: #22c55e; }

.np-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 16px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  margin-top: auto;
}
</style>
