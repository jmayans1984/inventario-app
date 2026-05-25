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
              v-model="cabecera.fecha"
              label="Fecha *"
              type="date"
              variant="outlined"
              density="compact"
              hide-details="auto"
              :error-messages="errores.fecha"
            />
          </v-col>

          <!-- TIPO DE OPERACIÓN -->
          <v-col cols="12" sm="3">
            <v-select
              v-model="cabecera.tipo"
              :items="TIPOS"
              item-title="label"
              item-value="value"
              label="Tipo de Operación *"
              variant="outlined"
              density="compact"
              hide-details="auto"
              :error-messages="errores.tipo"
              @update:model-value="cabecera.ccDestino = null"
            />
          </v-col>

          <!-- CC ORIGEN -->
          <v-col cols="12" sm="3">
            <v-select
              v-model="cabecera.ccOrigen"
              :items="ccostos"
              item-title="nombre"
              item-value="codigo"
              :label="isTraslado ? 'CC Origen *' : 'Centro de Costo *'"
              variant="outlined"
              density="compact"
              hide-details="auto"
              :error-messages="errores.ccOrigen"
            />
          </v-col>

          <!-- CC DESTINO (solo traslado) -->
          <v-col v-if="isTraslado" cols="12" sm="3">
            <v-select
              v-model="cabecera.ccDestino"
              :items="ccostosDestino"
              item-title="nombre"
              item-value="codigo"
              label="CC Destino *"
              variant="outlined"
              density="compact"
              hide-details="auto"
              :error-messages="errores.ccDestino"
            />
          </v-col>

          <!-- OBSERVACIONES -->
          <v-col cols="12" :sm="isTraslado ? 12 : 4">
            <v-text-field
              v-model="cabecera.observaciones"
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
          <div class="gi-grid-actions">
            <v-btn variant="text" size="small" prepend-icon="mdi-eraser" @click="limpiarCantidades">
              Limpiar cantidades
            </v-btn>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loadingProductos" class="gi-loading">
          <v-progress-circular indeterminate color="#0891b2" size="32" />
          <span class="ml-3" style="font-size:13px;color:rgba(var(--v-theme-on-surface),.5)">Cargando productos...</span>
        </div>

        <!-- Tabla agrupada -->
        <template v-else>
          <table class="gi-table">
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
                    <p style="color:rgba(var(--v-theme-on-surface),.4);margin:6px 0 0;font-size:13px">No hay productos con control de inventario</p>
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
                <tr v-for="p in grupo.items" :key="p.codigo"
                    class="gi-prod-row"
                    :class="{ 'gi-prod-highlighted': (cantidades[p.codigo] || 0) > 0 }">
                  <td><span class="badge-cod">{{ p.codigo }}</span></td>
                  <td class="td-nom">{{ p.nombre }}</td>
                  <td><span class="badge-und">{{ p.und }}</span></td>
                  <td class="td-cant">
                    <input
                      :value="cantidades[p.codigo] || ''"
                      type="number"
                      min="0"
                      step="0.001"
                      class="gi-cant-input"
                      :class="{ 'gi-cant-active': (cantidades[p.codigo] || 0) > 0 }"
                      placeholder="0"
                      @input="setCantidad(p.codigo, $event.target.value)"
                    />
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </template>
      </div>

      <!-- FOOTER DE ACCIONES -->
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
          <v-btn variant="text" :disabled="guardando" @click="resetForm">Limpiar todo</v-btn>
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

      <!-- Alerta de error general -->
      <v-alert v-if="errorGuardar" type="error" variant="tonal" density="compact" class="mt-3" closable @click:close="errorGuardar=''">
        {{ errorGuardar }}
      </v-alert>

      <!-- Alerta de éxito -->
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
                <span class="conflict-val">{{ cabecera.fecha }}</span>
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
              ¿Qué deseas hacer con los datos existentes?
            </p>
          </v-card-text>
          <v-divider />
          <v-card-actions class="pa-4" style="flex-direction:column;gap:8px;align-items:stretch">
            <v-btn
              color="error"
              variant="elevated"
              prepend-icon="mdi-delete-sweep"
              :loading="guardando"
              @click="guardar('replace')"
            >
              Eliminar registros previos y reemplazar
            </v-btn>
            <v-btn
              color="#0891b2"
              variant="outlined"
              prepend-icon="mdi-plus-circle-outline"
              :loading="guardando"
              @click="guardar('add')"
            >
              Adicionar a las cantidades existentes
            </v-btn>
            <v-btn variant="text" :disabled="guardando" @click="dlgConflicto=false">
              Cancelar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'

const auth = useAuthStore()
const empresa = computed(() => auth.empresa)

// ── Tipos de operación ────────────────────────────────────────
const TIPOS = [
  { label: 'ENTRADA DE ALMACEN',       value: 'ENTRADA'  },
  { label: 'SALIDA DE ALMACEN',        value: 'SALIDA'   },
  { label: 'SALIDA POR BAJA',          value: 'BAJA'     },
  { label: 'TRASLADO ENTRE ALMACENES', value: 'TRASLADO' },
]

// ── Estado ────────────────────────────────────────────────────
const ccostos          = ref([])
const productos        = ref([])
const loadingProductos = ref(false)

const cabecera = reactive({
  fecha:        new Date().toISOString().slice(0, 10),
  tipo:         null,
  ccOrigen:     null,
  ccDestino:    null,
  observaciones: '',
})

const errores = reactive({ fecha: '', tipo: '', ccOrigen: '', ccDestino: '' })
const cantidades   = reactive({})   // { [codigo]: number }
const guardando    = ref(false)
const errorGuardar = ref('')
const exitoMsg     = ref('')

// Conflicto
const dlgConflicto  = ref(false)
const conflictCount = ref(0)

// ── Computed ──────────────────────────────────────────────────
const isTraslado = computed(() => cabecera.tipo === 'TRASLADO')

// CC Destino no puede ser el mismo que el origen
const ccostosDestino = computed(() =>
  ccostos.value.filter(c => c.codigo !== cabecera.ccOrigen)
)

const nombreCcOrigen = computed(() => {
  const cc = ccostos.value.find(c => c.codigo === cabecera.ccOrigen)
  return cc ? cc.nombre : cabecera.ccOrigen
})

const tipoLabel = computed(() => {
  const t = TIPOS.find(t => t.value === cabecera.tipo)
  return t ? t.label : cabecera.tipo
})

// Solo productos con control='SI'
const productosConControl = computed(() =>
  productos.value.filter(p => p.control === 'SI')
)

// Agrupados (el backend ya devuelve ordenados por g.codigo, p.nombre)
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
  Object.values(cantidades).filter(v => parseFloat(v) > 0).length
)

// ── Métodos ───────────────────────────────────────────────────
function setCantidad(codigo, val) {
  const n = parseFloat(val)
  if (!val || isNaN(n) || n <= 0) {
    delete cantidades[codigo]
  } else {
    cantidades[codigo] = n
  }
}

function limpiarCantidades() {
  Object.keys(cantidades).forEach(k => delete cantidades[k])
}

function resetForm() {
  limpiarCantidades()
  cabecera.tipo = null
  cabecera.ccOrigen = null
  cabecera.ccDestino = null
  cabecera.observaciones = ''
  errorGuardar.value = ''
  exitoMsg.value = ''
}

function validar() {
  errores.fecha     = cabecera.fecha     ? '' : 'Requerido'
  errores.tipo      = cabecera.tipo      ? '' : 'Requerido'
  errores.ccOrigen  = cabecera.ccOrigen  ? '' : 'Requerido'
  errores.ccDestino = (isTraslado.value && !cabecera.ccDestino) ? 'Requerido' : ''
  return !errores.fecha && !errores.tipo && !errores.ccOrigen && !errores.ccDestino
}

async function guardar(mode = 'new') {
  if (mode === 'new') {
    if (!validar()) return
    if (productosConCantidad.value === 0) return
  }

  guardando.value = true
  errorGuardar.value = ''
  exitoMsg.value = ''

  const productosPayload = Object.entries(cantidades)
    .filter(([, v]) => parseFloat(v) > 0)
    .map(([codigo, cantidad]) => ({ codigo, cantidad: parseFloat(cantidad) }))

  try {
    const res = await api.post('/almacen/gestion-inventario', {
      empresa:       empresa.value,
      fecha:         cabecera.fecha,
      tipo:          cabecera.tipo,
      ccOrigen:      cabecera.ccOrigen,
      ccDestino:     cabecera.ccDestino || null,
      observaciones: cabecera.observaciones,
      productos:     productosPayload,
      mode,
    })

    if (res.data?.conflict) {
      conflictCount.value = res.data.count || 0
      dlgConflicto.value  = true
      return
    }

    if (!res.data?.success) throw new Error(res.data?.error || 'Error al guardar')

    // Éxito
    dlgConflicto.value = false
    const regs = res.data.registros || productosPayload.length
    exitoMsg.value = `✓ Movimiento guardado correctamente — ${regs} registro(s) en inventario`
    limpiarCantidades()

  } catch (e) {
    errorGuardar.value = e?.response?.data?.error || e.message || 'Error al guardar'
  } finally {
    guardando.value = false
  }
}

async function cargar() {
  loadingProductos.value = true
  try {
    const [resCC, resProd] = await Promise.all([
      api.get('/ccostos', { params: { empresa: empresa.value } }),
      api.get('/almacen/productos'),
    ])
    ccostos.value  = resCC.data?.ccostos || resCC.data || []
    productos.value = resProd.data?.data  || []
  } catch (e) {
    console.error('Error cargando datos:', e)
  } finally {
    loadingProductos.value = false
  }
}

onMounted(cargar)
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
.gi-grid-actions { display: flex; align-items: center; gap: 8px; }
.gi-loading     { display: flex; align-items: center; justify-content: center; padding: 40px 20px; }

/* Tabla */
.gi-table  { width: 100%; border-collapse: collapse; font-size: 13px; }
.gi-table thead { background: rgba(var(--v-theme-on-surface),.04); }
.gi-table thead th { padding: 10px 14px; text-align: left; font-weight: 700; font-size: 11px; letter-spacing: .5px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.6); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); }

/* Fila de grupo */
.gi-grupo-row  { background: rgba(139,92,246,.06); }
.gi-grupo-cell { padding: 7px 14px !important; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.06) !important; }
.gi-grupo-name { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #8b5cf6; }
.gi-grupo-count{ font-size: 11px; color: rgba(var(--v-theme-on-surface),.4); margin-left: 8px; }

/* Filas de producto */
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

/* Input de cantidad */
.gi-cant-input {
  width: 110px;
  padding: 5px 10px;
  border: 1px solid rgba(var(--v-theme-on-surface),.15);
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface),.03);
  color: rgb(var(--v-theme-on-surface));
  font-size: 13px;
  text-align: right;
  outline: none;
  transition: border-color .15s, background .15s;
}
.gi-cant-input:focus {
  border-color: #0891b2;
  background: rgba(8,145,178,.06);
}
.gi-cant-active {
  border-color: #0891b2;
  background: rgba(8,145,178,.08);
  font-weight: 600;
  color: #0891b2;
}
/* Quitar flechas del número */
.gi-cant-input::-webkit-outer-spin-button,
.gi-cant-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.gi-cant-input[type=number] { -moz-appearance: textfield; }

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
