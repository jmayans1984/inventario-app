<template>
  <MainLayout>
    <div class="gi-container">

      <!-- BREADCRUMB -->
      <div class="gi-breadcrumb">
        <span class="bc-root">ALMACÉN</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Procesos</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Gestión de Inventario</span>
      </div>

      <!-- HEADER -->
      <div class="gi-header">
        <div class="gi-header-left">
          <div class="gi-icon-wrap">
            <v-icon size="22" color="white">mdi-history</v-icon>
          </div>
          <div>
            <h1 class="gi-title">GESTIÓN DE INVENTARIO</h1>
            <p class="gi-sub">Registro de entradas, salidas y traslados de productos</p>
          </div>
        </div>
      </div>

      <!-- FORMULARIO DE CABECERA -->
      <div class="gi-form-card">
        <v-row dense>

          <!-- FECHA -->
          <v-col cols="12" sm="2">
            <v-text-field
              v-model="fecha"
              label="Fecha *"
              type="date"
              variant="outlined"
              density="compact"
              hide-details="auto"
              :error-messages="errFecha"
            />
          </v-col>

          <!-- TIPO DE OPERACIÓN -->
          <v-col cols="12" sm="3">
            <v-select
              v-model="tipoOp"
              :items="TIPOS"
              item-title="label"
              item-value="value"
              label="Tipo de Operación *"
              variant="outlined"
              density="compact"
              hide-details="auto"
              :error-messages="errTipo"
              @update:model-value="ccDestino = null"
            />
          </v-col>

          <!-- CC ORIGEN -->
          <v-col cols="12" sm="3">
            <v-select
              v-model="ccOrigen"
              :items="ccostos"
              item-title="nombre"
              item-value="codigo"
              :label="tipoOp === 'TRASLADO' ? 'CC Origen *' : 'Centro de Costo *'"
              variant="outlined"
              density="compact"
              hide-details="auto"
              :error-messages="errCcOrigen"
            />
          </v-col>

          <!-- CC DESTINO (solo traslado) -->
          <v-col v-if="tipoOp === 'TRASLADO'" cols="12" sm="3">
            <v-select
              v-model="ccDestino"
              :items="ccostos.filter(c => c.codigo !== ccOrigen)"
              item-title="nombre"
              item-value="codigo"
              label="CC Destino *"
              variant="outlined"
              density="compact"
              hide-details="auto"
              :error-messages="errCcDestino"
            />
          </v-col>

          <!-- OBSERVACIONES -->
          <v-col cols="12" :sm="tipoOp === 'TRASLADO' ? 12 : 4">
            <v-text-field
              v-model="observaciones"
              label="Observaciones"
              variant="outlined"
              density="compact"
              hide-details
              maxlength="120"
              placeholder="Descripción del movimiento..."
            />
          </v-col>

        </v-row>
      </div>

      <!-- GRID DE PRODUCTOS -->
      <div class="gi-grid-card">

        <!-- Barra superior del grid -->
        <div class="gi-grid-header">
          <div class="gi-grid-title">
            <v-icon size="18" class="mr-1" color="#0891b2">mdi-package-variant</v-icon>
            Productos de Inventario
            <span class="gi-grid-sub">— ingresa las cantidades del movimiento</span>
          </div>
          <v-btn variant="text" size="small" prepend-icon="mdi-eraser" @click="limpiarCantidades">
            Limpiar cantidades
          </v-btn>
        </div>

        <!-- Loading -->
        <div v-if="loadingProductos" class="gi-loading">
          <v-progress-circular indeterminate color="#0891b2" size="32" />
          <span class="ml-3" style="font-size:13px;color:rgba(var(--v-theme-on-surface),.5)">Cargando productos...</span>
        </div>

        <!-- Error carga -->
        <div v-else-if="errorProductos" class="gi-loading">
          <v-icon color="error" size="28">mdi-alert-circle</v-icon>
          <span class="ml-2" style="font-size:13px;color:#ef4444">{{ errorProductos }}</span>
          <v-btn variant="text" size="small" class="ml-3" @click="cargarProductos">Reintentar</v-btn>
        </div>

        <!-- Tabla agrupada -->
        <table v-else class="gi-table">
          <thead>
            <tr>
              <th class="th-cod">CÓDIGO</th>
              <th class="th-nom">NOMBRE DEL PRODUCTO</th>
              <th class="th-und">UND</th>
              <th class="th-cant">CANTIDAD</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="productosAgrupados.length === 0">
              <tr>
                <td colspan="4" class="gi-empty">
                  <v-icon size="32" style="color:rgba(var(--v-theme-on-surface),.2)">mdi-inbox-outline</v-icon>
                  <p style="color:rgba(var(--v-theme-on-surface),.4);margin:6px 0 0;font-size:13px">
                    No hay productos con control de inventario registrados
                  </p>
                </td>
              </tr>
            </template>

            <template v-for="grupo in productosAgrupados" :key="grupo.key">
              <!-- CABECERA DE GRUPO -->
              <tr class="gi-grupo-row">
                <td colspan="4" class="gi-grupo-cell">
                  <v-icon size="14" class="mr-1" style="color:#8b5cf6">mdi-folder-outline</v-icon>
                  <span class="gi-grupo-name">{{ grupo.nombre }}</span>
                  <span class="gi-grupo-count">{{ grupo.items.length }} producto{{ grupo.items.length !== 1 ? 's' : '' }}</span>
                </td>
              </tr>

              <!-- FILAS DE PRODUCTOS -->
              <tr
                v-for="p in grupo.items"
                :key="p.codigo"
                class="gi-prod-row"
                :class="{ 'gi-prod-highlighted': getCantidad(p.codigo) !== 0 }"
              >
                <td><span class="badge-cod">{{ p.codigo }}</span></td>
                <td class="td-nom">{{ p.nombre }}</td>
                <td><span class="badge-und">{{ p.und }}</span></td>
                <td class="td-cant">
                  <input
                    :value="getCantidad(p.codigo) || ''"
                    type="text"
                    inputmode="decimal"
                    class="gi-cant-input"
                    :class="{ 'gi-cant-active': getCantidad(p.codigo) !== null && getCantidad(p.codigo) !== 0 }"
                    placeholder="0"
                    @input="setCantidad(p.codigo, $event.target.value)"
                    @keydown.enter.prevent="siguienteInput($event)"
                  />
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- FOOTER -->
      <div class="gi-footer">
        <div class="gi-footer-info">
          <v-icon size="16" color="#0891b2" class="mr-1">mdi-information-outline</v-icon>
          <span v-if="productosConCantidad === 0" style="color:rgba(var(--v-theme-on-surface),.5)">
            Ingresa cantidades para los productos del movimiento
          </span>
          <span v-else style="color:#0891b2;font-weight:600">
            {{ productosConCantidad }} producto{{ productosConCantidad !== 1 ? 's' : '' }} con cantidad ingresada
          </span>
        </div>
        <div class="gi-footer-btns">
          <v-btn variant="text" :disabled="guardando" @click="resetTodo">Limpiar todo</v-btn>
          <v-btn
            color="#0891b2"
            variant="elevated"
            prepend-icon="mdi-content-save"
            :loading="guardando"
            :disabled="productosConCantidad === 0"
            @click="guardar()"
          >
            Guardar Movimiento
          </v-btn>
        </div>
      </div>

      <!-- Alertas -->
      <v-alert v-if="errorGuardar" type="error" variant="tonal" density="compact" class="mt-3" closable @click:close="errorGuardar=''">
        {{ errorGuardar }}
      </v-alert>
      <v-alert v-if="exitoMsg" type="success" variant="tonal" density="compact" class="mt-3" closable @click:close="exitoMsg=''">
        {{ exitoMsg }}
      </v-alert>

      <!-- ══════════════ DIALOG DE CONFLICTO ══════════════ -->
      <v-dialog v-model="dlgConflicto" max-width="480" persistent>
        <v-card rounded="lg">
          <v-card-title class="dlg-title">
            <v-icon size="22" class="mr-2" color="#f59e0b">mdi-alert-circle</v-icon>
            Registros Existentes
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-5">
            <p style="font-size:14px;margin-bottom:12px">
              Ya existen <strong>{{ conflictCount }}</strong> registro(s) en inventario para:
            </p>
            <div class="conflict-info">
              <div class="conflict-row">
                <span class="conflict-label">Fecha</span>
                <span class="conflict-val">{{ fecha }}</span>
              </div>
              <div class="conflict-row">
                <span class="conflict-label">Centro de Costo</span>
                <span class="conflict-val">{{ nombreCcOrigen }}</span>
              </div>
              <div class="conflict-row">
                <span class="conflict-label">Tipo</span>
                <span class="conflict-val">{{ tipoLabel }}</span>
              </div>
            </div>
            <p style="font-size:13px;margin-top:16px;color:rgba(var(--v-theme-on-surface),.7)">
              ¿Qué deseas hacer?
            </p>
          </v-card-text>
          <v-divider />
          <v-card-actions class="pa-4" style="flex-direction:column;gap:8px;align-items:stretch">
            <v-btn color="error" variant="elevated" prepend-icon="mdi-delete-sweep" :loading="guardando" @click="guardar('replace')">
              Eliminar registros previos y reemplazar
            </v-btn>
            <v-btn color="#0891b2" variant="outlined" prepend-icon="mdi-plus-circle-outline" :loading="guardando" @click="guardar('add')">
              Adicionar a las cantidades existentes
            </v-btn>
            <v-btn variant="text" :disabled="guardando" @click="dlgConflicto=false">Cancelar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'

const auth    = useAuthStore()
const empresa = computed(() => auth.empresa)

// ── Tipos de operación ────────────────────────────────────────
const TIPOS = [
  { label: 'ENTRADA DE ALMACEN',       value: 'ENTRADA'  },
  { label: 'SALIDA DE ALMACEN',        value: 'SALIDA'   },
  { label: 'SALIDA POR BAJA',          value: 'BAJA'     },
  { label: 'TRASLADO ENTRE ALMACENES', value: 'TRASLADO' },
]

// ── Datos externos ────────────────────────────────────────────
const ccostos          = ref([])
const productos        = ref([])
const loadingProductos = ref(false)
const errorProductos   = ref('')

// ── Campos del formulario (ref individuales, más confiables) ──
const fecha         = ref(new Date().toISOString().slice(0, 10))
const tipoOp        = ref(null)
const ccOrigen      = ref(null)
const ccDestino     = ref(null)
const observaciones = ref('')

// Errores validación
const errFecha     = ref('')
const errTipo      = ref('')
const errCcOrigen  = ref('')
const errCcDestino = ref('')

// ── Cantidades por producto ───────────────────────────────────
const cantidades = ref({})   // { [codigo]: number }

function getCantidad(codigo) {
  return cantidades.value[codigo] || 0
}
function setCantidad(codigo, val) {
  // Estados intermedios: el usuario aún está escribiendo el número
  // No actualizar cantidades para que Vue no borre lo que está escribiendo
  if (!val || val === '-' || val === '.' || val === ',' ||
      val === '-.' || val === '-,' ||
      val.endsWith('.') || val.endsWith(',')) return

  // Normalizar coma como separador decimal (ej: "1,5" → "1.5")
  const normalizado = val.replace(',', '.')
  const n = parseFloat(normalizado)

  const nuevo = { ...cantidades.value }
  if (isNaN(n) || n === 0) delete nuevo[codigo]
  else nuevo[codigo] = n
  cantidades.value = nuevo
}
function limpiarCantidades() {
  cantidades.value = {}
}

// Enter actúa como Tab — mueve al siguiente input de cantidad
function siguienteInput(event) {
  const inputs = Array.from(document.querySelectorAll('.gi-cant-input'))
  const idx    = inputs.indexOf(event.target)
  if (idx !== -1 && idx < inputs.length - 1) {
    inputs[idx + 1].focus()
    inputs[idx + 1].select()
  }
}

// ── Estado de guardado ────────────────────────────────────────
const guardando    = ref(false)
const errorGuardar = ref('')
const exitoMsg     = ref('')
const dlgConflicto = ref(false)
const conflictCount= ref(0)

// ── Computed ──────────────────────────────────────────────────
const nombreCcOrigen = computed(() => {
  const cc = ccostos.value.find(c => c.codigo === ccOrigen.value)
  return cc ? cc.nombre : ccOrigen.value
})

const nombreCcDestino = computed(() => {
  const cc = ccostos.value.find(c => c.codigo === ccDestino.value)
  return cc ? cc.nombre : ccDestino.value
})

const tipoLabel = computed(() => {
  const t = TIPOS.find(t => t.value === tipoOp.value)
  return t ? t.label : tipoOp.value
})

// Solo productos con control=SI, ya ordenados por el backend (g.codigo, p.nombre)
const productosConControl = computed(() =>
  productos.value.filter(p => p.control === 'SI')
)

const productosAgrupados = computed(() => {
  const mapa = new Map()
  for (const p of productosConControl.value) {
    const key    = p.grupo || '__sin_grupo__'
    const nombre = p.grupo_nombre || 'Sin Grupo'
    if (!mapa.has(key)) mapa.set(key, { key, nombre, items: [] })
    mapa.get(key).items.push(p)
  }
  return Array.from(mapa.values())
})

const productosConCantidad = computed(() =>
  Object.values(cantidades.value).filter(v => { const n = parseFloat(v); return !isNaN(n) && n !== 0 }).length
)

// ── Carga de datos (separadas para que un fallo no bloquee la otra) ──
async function cargarCcostos() {
  try {
    const res = await api.get('/ccostos', { params: { empresa: empresa.value } })
    // El endpoint devuelve { success, data: [...], total }
    ccostos.value = res.data?.data || res.data?.ccostos || []
  } catch (e) {
    console.error('Error cargando ccostos:', e)
  }
}

async function cargarProductos() {
  loadingProductos.value = true
  errorProductos.value   = ''
  try {
    // Sin filtro de empresa — devuelve TODOS los productos
    const res = await api.get('/almacen/productos')
    productos.value = res.data?.data || []
  } catch (e) {
    console.error('Error cargando productos:', e)
    errorProductos.value = e?.response?.data?.error || 'Error al cargar productos'
  } finally {
    loadingProductos.value = false
  }
}

// ── Validación ────────────────────────────────────────────────
function validar() {
  errFecha.value     = fecha.value    ? '' : 'Requerido'
  errTipo.value      = tipoOp.value   ? '' : 'Requerido'
  errCcOrigen.value  = ccOrigen.value ? '' : 'Requerido'
  errCcDestino.value = (tipoOp.value === 'TRASLADO' && !ccDestino.value) ? 'Requerido' : ''
  return !errFecha.value && !errTipo.value && !errCcOrigen.value && !errCcDestino.value
}

// ── Guardar ───────────────────────────────────────────────────
async function guardar(mode = 'new') {
  if (mode === 'new') {
    if (!validar()) return
    if (productosConCantidad.value === 0) return
  }

  guardando.value  = true
  errorGuardar.value = ''
  exitoMsg.value   = ''

  const productosPayload = Object.entries(cantidades.value)
    .map(([codigo, cantidad]) => ({ codigo, cantidad: parseFloat(cantidad) }))
    .filter(p => !isNaN(p.cantidad) && p.cantidad !== 0)

  try {
    const res = await api.post('/almacen/gestion-inventario', {
      empresa:          empresa.value,
      fecha:            fecha.value,
      tipo:             tipoOp.value,
      ccOrigen:         ccOrigen.value,
      ccOrigenNombre:   nombreCcOrigen.value,
      ccDestino:        ccDestino.value || null,
      ccDestinoNombre:  nombreCcDestino.value || null,
      observaciones:    observaciones.value,
      productos:     productosPayload,
      mode,
    })

    if (res.data?.conflict) {
      conflictCount.value = res.data.count || 0
      dlgConflicto.value  = true
      return
    }

    if (!res.data?.success) throw new Error(res.data?.error || 'Error al guardar')

    dlgConflicto.value = false
    exitoMsg.value = `✓ Movimiento guardado — ${res.data.registros || productosPayload.length} registro(s) en inventario`
    limpiarCantidades()

  } catch (e) {
    errorGuardar.value = e?.response?.data?.error || e.message || 'Error al guardar'
  } finally {
    guardando.value = false
  }
}

function resetTodo() {
  limpiarCantidades()
  tipoOp.value        = null
  ccOrigen.value      = null
  ccDestino.value     = null
  observaciones.value = ''
  errorGuardar.value  = ''
  exitoMsg.value      = ''
}

onMounted(() => {
  cargarCcostos()
  cargarProductos()
})
</script>

<style scoped>
.gi-container { padding: 24px; max-width: 1100px; margin: 0 auto; }

/* Breadcrumb */
.gi-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root    { font-size: 12px; font-weight: 700; color: #06b6d4; text-transform: uppercase; letter-spacing: .5px; }
.bc-sep     { color: rgba(var(--v-theme-on-surface),.3); }
.bc-cat     { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface),.8); font-weight: 500; }

/* Header */
.gi-header      { display: flex; align-items: center; margin-bottom: 20px; }
.gi-header-left { display: flex; align-items: center; gap: 16px; }
.gi-icon-wrap   { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#06b6d4,#0891b2); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(6,182,212,.35); flex-shrink: 0; }
.gi-title       { font-size: 20px; font-weight: 800; letter-spacing: .5px; margin: 0; }
.gi-sub         { font-size: 13px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }

/* Form card */
.gi-form-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 12px; padding: 20px; margin-bottom: 16px; }

/* Grid card */
.gi-grid-card   { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 12px; overflow: hidden; margin-bottom: 16px; }
.gi-grid-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.06); background: rgba(var(--v-theme-on-surface),.02); }
.gi-grid-title  { font-size: 13px; font-weight: 700; display: flex; align-items: center; color: rgba(var(--v-theme-on-surface),.8); }
.gi-grid-sub    { font-size: 12px; font-weight: 400; color: rgba(var(--v-theme-on-surface),.4); margin-left: 4px; }
.gi-loading     { display: flex; align-items: center; justify-content: center; padding: 40px 20px; }

/* Tabla */
.gi-table  { width: 100%; border-collapse: collapse; font-size: 13px; }
.gi-table thead { background: rgba(var(--v-theme-on-surface),.04); }
.gi-table thead th { padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; letter-spacing: .5px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.6); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); }

.gi-grupo-row  { background: rgba(139,92,246,.06); }
.gi-grupo-cell { padding: 7px 14px !important; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.06) !important; }
.gi-grupo-name { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #8b5cf6; }
.gi-grupo-count{ font-size: 11px; color: rgba(var(--v-theme-on-surface),.4); margin-left: 8px; }

.gi-prod-row { border-bottom: 1px solid rgba(var(--v-theme-on-surface),.04); transition: background .1s; }
.gi-prod-row:hover { background: rgba(var(--v-theme-on-surface),.02); }
.gi-prod-highlighted { background: rgba(8,145,178,.04) !important; }
.gi-prod-highlighted:hover { background: rgba(8,145,178,.07) !important; }
.gi-table tbody td { padding: 7px 14px; }

.th-cod  { width: 90px; }
.th-nom  { }
.th-und  { width: 80px; }
.th-cant { width: 140px; text-align: right; }
.td-nom  { font-weight: 500; }
.td-cant { text-align: right; }

.gi-cant-input {
  width: 110px; padding: 5px 10px;
  border: 1px solid rgba(var(--v-theme-on-surface),.15);
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface),.03);
  color: rgb(var(--v-theme-on-surface));
  font-size: 13px; text-align: right; outline: none;
  transition: border-color .15s, background .15s;
}
.gi-cant-input:focus { border-color: #0891b2; background: rgba(8,145,178,.06); }
.gi-cant-active { border-color: #0891b2; background: rgba(8,145,178,.08); font-weight: 600; color: #0891b2; }
.gi-cant-input { text-align: right; }

.gi-empty { text-align: center !important; padding: 40px !important; }

/* Footer */
.gi-footer      { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; flex-wrap: wrap; gap: 12px; }
.gi-footer-info { display: flex; align-items: center; font-size: 13px; }
.gi-footer-btns { display: flex; align-items: center; gap: 10px; }

/* Badges */
.badge-cod { background: rgba(6,182,212,.15); color: #0891b2; padding: 2px 7px; border-radius: 6px; font-weight: 700; font-size: 12px; font-family: monospace; }
.badge-und { background: rgba(139,92,246,.12); color: #8b5cf6; padding: 2px 7px; border-radius: 5px; font-size: 12px; font-weight: 600; }

/* Dialog */
.dlg-title    { font-size: 16px; font-weight: 700; padding: 16px 20px; display: flex; align-items: center; }
.conflict-info { background: rgba(var(--v-theme-on-surface),.04); border-radius: 8px; padding: 12px 16px; }
.conflict-row  { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 13px; }
.conflict-row + .conflict-row { border-top: 1px solid rgba(var(--v-theme-on-surface),.06); }
.conflict-label { color: rgba(var(--v-theme-on-surface),.5); font-weight: 500; }
.conflict-val   { font-weight: 700; }
</style>
