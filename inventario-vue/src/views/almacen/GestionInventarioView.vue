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
              :model-value="observaciones"
              @update:model-value="observaciones = $event.toUpperCase()"
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
          <div class="d-flex gap-2">
            <v-btn variant="tonal" size="small" color="#8b5cf6" prepend-icon="mdi-camera-outline" @click="abrirOcr">
              Leer foto
            </v-btn>
            <v-btn variant="text" size="small" prepend-icon="mdi-eraser" @click="limpiarCantidades">
              Limpiar
            </v-btn>
          </div>
        </div>

      <!-- ═══════════ DIALOG OCR ═══════════ -->
      <v-dialog v-model="dlgOcr" max-width="860" persistent scrollable>
        <v-card rounded="xl">
          <!-- Header -->
          <div class="ocr-dlg-header">
            <div class="d-flex align-center gap-3">
              <div class="ocr-icon-wrap"><v-icon size="20" color="white">mdi-text-recognition</v-icon></div>
              <div>
                <div class="ocr-dlg-title">IMPORTAR POR FOTO / OCR</div>
                <div class="ocr-dlg-sub">Fotografía la remisión o lista de entrega</div>
              </div>
            </div>
            <v-btn icon size="small" variant="text" @click="cerrarOcr"><v-icon>mdi-close</v-icon></v-btn>
          </div>

          <!-- Stepper visual -->
          <div class="ocr-steps">
            <div class="ocr-step" :class="{ active: ocrPaso === 1, done: ocrPaso > 1 }">
              <div class="ocr-step-num">{{ ocrPaso > 1 ? '✓' : '1' }}</div>
              <span>Capturar</span>
            </div>
            <div class="ocr-step-line" :class="{ done: ocrPaso > 1 }" />
            <div class="ocr-step" :class="{ active: ocrPaso === 2, done: ocrPaso > 2 }">
              <div class="ocr-step-num">{{ ocrPaso > 2 ? '✓' : '2' }}</div>
              <span>Procesar</span>
            </div>
            <div class="ocr-step-line" :class="{ done: ocrPaso > 2 }" />
            <div class="ocr-step" :class="{ active: ocrPaso === 3 }">
              <div class="ocr-step-num">3</div>
              <span>Revisar</span>
            </div>
          </div>

          <v-card-text class="pa-5">

            <!-- ── PASO 1: Captura ── -->
            <div v-if="ocrPaso === 1">
              <div
                class="ocr-dropzone"
                :class="{ 'ocr-dropzone--preview': ocrPreview }"
                @click="$refs.ocrFileInput.click()"
                @dragover.prevent
                @drop.prevent="onOcrDrop"
              >
                <img v-if="ocrPreview" :src="ocrPreview" class="ocr-img-preview" alt="preview" />
                <div v-else class="ocr-dropzone-inner">
                  <v-icon size="48" color="#8b5cf6" class="mb-3">mdi-image-plus</v-icon>
                  <p class="ocr-drop-txt">Haz clic o arrastra la foto aquí</p>
                  <p class="ocr-drop-sub">JPG, PNG, WEBP · también puedes usar la cámara</p>
                  <v-btn class="mt-4" color="#8b5cf6" variant="tonal" size="small" prepend-icon="mdi-camera">
                    Abrir cámara
                  </v-btn>
                </div>
              </div>

              <!-- Inputs ocultos -->
              <input ref="ocrFileInput" type="file" accept="image/*" style="display:none"
                @change="onOcrFile" />

              <div v-if="ocrPreview" class="d-flex gap-2 mt-3 justify-center">
                <v-btn variant="tonal" color="grey" size="small" prepend-icon="mdi-refresh"
                  @click="ocrPreview=''; ocrImagen=null">
                  Cambiar imagen
                </v-btn>
                <v-btn color="#8b5cf6" variant="flat" size="small" prepend-icon="mdi-text-recognition"
                  @click="procesarOcr">
                  Procesar OCR
                </v-btn>
              </div>

              <v-alert type="info" variant="tonal" density="compact" class="mt-4" icon="mdi-lightbulb-outline">
                <strong>Consejo:</strong> Fotografía la remisión de frente, con buena luz y sin sombras.
                Funciona mejor con texto impreso que con manuscrito.
              </v-alert>
            </div>

            <!-- ── PASO 2: Procesando ── -->
            <div v-if="ocrPaso === 2" class="ocr-processing">
              <v-icon size="56" color="#8b5cf6" class="mb-4">mdi-text-recognition</v-icon>
              <p class="ocr-proc-txt">Reconociendo texto...</p>
              <v-progress-linear :model-value="ocrProgreso" color="#8b5cf6" height="8" rounded class="mt-4" style="max-width:400px" />
              <p class="ocr-proc-sub mt-2">{{ ocrProgreso }}% completado</p>
            </div>

            <!-- ── PASO 3: Revisión ── -->
            <div v-if="ocrPaso === 3">
              <div class="ocr-review-header">
                <div class="ocr-review-stats">
                  <v-chip color="#8b5cf6" size="small" variant="tonal" prepend-icon="mdi-format-list-bulleted">
                    {{ ocrItems.length }} líneas detectadas
                  </v-chip>
                  <v-chip color="success" size="small" variant="tonal" prepend-icon="mdi-check-circle">
                    {{ ocrItems.filter(i => i.productoEdit).length }} coincidencias
                  </v-chip>
                  <v-chip color="warning" size="small" variant="tonal" prepend-icon="mdi-alert">
                    {{ ocrItems.filter(i => !i.productoEdit).length }} sin coincidencia
                  </v-chip>
                </div>
                <v-btn variant="text" size="small" prepend-icon="mdi-arrow-left" @click="ocrPaso=1">
                  Nueva foto
                </v-btn>
              </div>

              <div v-if="ocrItems.length === 0" class="ocr-empty">
                <v-icon size="40" color="warning">mdi-text-search</v-icon>
                <p>No se detectaron productos. Intenta con otra foto.</p>
              </div>

              <table v-else class="ocr-table">
                <thead>
                  <tr>
                    <th>TEXTO OCR</th>
                    <th>PRODUCTO DEL SISTEMA</th>
                    <th style="width:100px">CANTIDAD</th>
                    <th style="width:90px">CONFIANZA</th>
                    <th style="width:44px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, i) in ocrItems" :key="i"
                    :class="{ 'ocr-row-ok': item.productoEdit, 'ocr-row-warn': !item.productoEdit }">
                    <td class="ocr-td-raw">{{ item.textoOcr }}</td>
                    <td class="ocr-td-prod">
                      <v-autocomplete
                        v-model="item.productoEdit"
                        :items="productosConControl"
                        item-title="nombre"
                        return-object
                        variant="outlined"
                        density="compact"
                        hide-details
                        clearable
                        placeholder="Seleccionar producto..."
                        style="min-width:200px"
                      />
                    </td>
                    <td class="ocr-td-cant">
                      <input v-model.number="item.cantidadEdit" type="number" min="0" step="0.01"
                        class="ocr-cant-input" />
                    </td>
                    <td class="ocr-td-conf">
                      <v-chip
                        :color="item.confianza >= 0.7 ? 'success' : item.confianza >= 0.4 ? 'warning' : 'error'"
                        size="x-small" variant="tonal">
                        {{ item.productoEdit ? Math.round(item.confianza * 100) + '%' : 'Manual' }}
                      </v-chip>
                    </td>
                    <td>
                      <v-btn icon size="x-small" variant="text" color="error"
                        @click="ocrItems.splice(i, 1)">
                        <v-icon size="14">mdi-delete-outline</v-icon>
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </v-card-text>

          <!-- Footer del dialog -->
          <v-divider />
          <v-card-actions class="pa-4 d-flex gap-2">
            <v-btn variant="text" @click="cerrarOcr">Cancelar</v-btn>
            <v-spacer />
            <v-btn v-if="ocrPaso === 3 && ocrItems.some(i => i.productoEdit && i.cantidadEdit > 0)"
              color="#8b5cf6" variant="flat" rounded="lg" prepend-icon="mdi-table-arrow-down"
              @click="aplicarOcr">
              Aplicar al Grid ({{ ocrItems.filter(i => i.productoEdit && i.cantidadEdit > 0).length }} productos)
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

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

// ── OCR ────────────────────────────────────────────────────────
const dlgOcr      = ref(false)
const ocrPaso     = ref(1)
const ocrImagen   = ref(null)
const ocrPreview  = ref('')
const ocrProgreso = ref(0)
const ocrItems    = ref([])   // { textoOcr, productoEdit, cantidadEdit, confianza }

function abrirOcr() {
  dlgOcr.value      = true
  ocrPaso.value     = 1
  ocrImagen.value   = null
  ocrPreview.value  = ''
  ocrProgreso.value = 0
  ocrItems.value    = []
}

function cerrarOcr() {
  dlgOcr.value = false
}

function onOcrFile(e) {
  const f = e.target.files[0]
  if (!f) return
  ocrImagen.value  = f
  ocrPreview.value = URL.createObjectURL(f)
  e.target.value   = ''
}

function onOcrDrop(e) {
  const f = e.dataTransfer.files[0]
  if (!f || !f.type.startsWith('image/')) return
  ocrImagen.value  = f
  ocrPreview.value = URL.createObjectURL(f)
}

async function procesarOcr() {
  if (!ocrImagen.value) return
  ocrPaso.value     = 2
  ocrProgreso.value = 0
  try {
    const { createWorker } = await import('tesseract.js')
    const worker = await createWorker('spa', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          ocrProgreso.value = Math.round(m.progress * 100)
        }
      },
    })
    const { data: { text } } = await worker.recognize(ocrImagen.value)
    await worker.terminate()
    ocrItems.value = parsearTextoOcr(text)
    ocrPaso.value  = 3
  } catch (err) {
    console.error('OCR error:', err)
    ocrPaso.value = 1
  }
}

/* Normaliza texto para comparación fuzzy: minúsculas, sin tildes, sin puntuación */
function normalizar(txt) {
  return String(txt || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/* Busca el mejor producto del sistema para un texto de OCR */
function buscarProducto(texto) {
  const normTexto  = normalizar(texto)
  const palabras   = normTexto.split(' ').filter(p => p.length > 2)
  if (!palabras.length) return { producto: null, confianza: 0 }

  let mejor      = null
  let mejorScore = 0

  for (const p of productosConControl.value) {
    const normNombre = normalizar(p.nombre)
    const normCodigo = normalizar(p.codigo)

    // Coincidencia exacta de código → confianza máxima
    if (normCodigo && normTexto.includes(normCodigo)) {
      return { producto: p, confianza: 1 }
    }

    // Contar palabras que coinciden en el nombre
    let coincidencias = 0
    const palabrasNombre = normNombre.split(' ').filter(w => w.length > 2)
    for (const pal of palabras) {
      if (palabrasNombre.some(w => w === pal || w.startsWith(pal) || pal.startsWith(w))) {
        coincidencias++
      }
    }

    const score = palabras.length > 0 ? coincidencias / palabras.length : 0
    if (score > mejorScore && score >= 0.35) {
      mejorScore = score
      mejor      = p
    }
  }

  return { producto: mejor, confianza: mejorScore }
}

/* Extrae nombre y cantidad de una línea de texto */
function parsearLinea(linea) {
  // Cantidad al final: "LECHE ENTERA 12" o "LECHE ENTERA 12.5 KG"
  let m = linea.match(/^(.+?)\s+([\d]+(?:[.,]\d+)?)\s*(?:und|un|pz|kg|gr|lt|l|unidad|unidades)?$/i)
  if (m) return { texto: m[1].trim(), cantidad: parseFloat(m[2].replace(',', '.')) }

  // Cantidad al inicio: "12 LECHE ENTERA"
  m = linea.match(/^([\d]+(?:[.,]\d+)?)\s+(.+)$/)
  if (m) return { texto: m[2].trim(), cantidad: parseFloat(m[1].replace(',', '.')) }

  // Patrón "x5" o "5x": "LECHE x12"
  m = linea.match(/^(.+?)\s*[xX]([\d]+(?:[.,]\d+)?)$/)
  if (m) return { texto: m[1].trim(), cantidad: parseFloat(m[2].replace(',', '.')) }

  // Sin cantidad → asumir 1
  return { texto: linea.trim(), cantidad: 1 }
}

/* Parsea el texto completo del OCR en una lista de ítems */
function parsearTextoOcr(texto) {
  const lineas = texto.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 3 && /[a-zA-ZáéíóúÁÉÍÓÚñÑ]{3,}/.test(l))

  const items = []
  const yaAgregado = new Set()

  for (const linea of lineas) {
    const { texto: textoItem, cantidad } = parsearLinea(linea)
    if (!textoItem || textoItem.length < 3) continue

    const { producto, confianza } = buscarProducto(textoItem)

    // Evitar duplicados del mismo producto (suma cantidades)
    if (producto) {
      if (yaAgregado.has(producto.codigo)) {
        const existing = items.find(i => i.productoEdit?.codigo === producto.codigo)
        if (existing) { existing.cantidadEdit += cantidad; continue }
      }
      yaAgregado.add(producto.codigo)
    }

    items.push({
      textoOcr:     linea,
      productoEdit: producto || null,
      cantidadEdit: cantidad,
      confianza,
    })
  }

  return items.slice(0, 60) // máximo 60 ítems
}

/* Aplica los ítems revisados al grid de cantidades */
function aplicarOcr() {
  const nuevasCantidades = { ...cantidades.value }
  for (const item of ocrItems.value) {
    if (item.productoEdit && item.cantidadEdit > 0) {
      const codigo = item.productoEdit.codigo
      nuevasCantidades[codigo] = (nuevasCantidades[codigo] || 0) + item.cantidadEdit
    }
  }
  cantidades.value = nuevasCantidades
  cerrarOcr()
}
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

/* ─── OCR Dialog ──────────────────────────────────────────────── */
.ocr-dlg-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(139,92,246,.12), rgba(139,92,246,.04));
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08);
}
.ocr-icon-wrap {
  width: 38px; height: 38px; border-radius: 10px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(139,92,246,.4);
  flex-shrink: 0;
}
.ocr-dlg-title { font-size: 15px; font-weight: 800; letter-spacing: .4px; }
.ocr-dlg-sub   { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); margin-top: 1px; }

/* Stepper */
.ocr-steps { display: flex; align-items: center; justify-content: center; gap: 0; padding: 14px 20px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.06); }
.ocr-step  { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: rgba(var(--v-theme-on-surface),.4); }
.ocr-step.active { color: #8b5cf6; }
.ocr-step.done   { color: #22c55e; }
.ocr-step-num {
  width: 22px; height: 22px; border-radius: 50%;
  background: rgba(var(--v-theme-on-surface),.1);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
}
.ocr-step.active .ocr-step-num { background: #8b5cf6; color: white; }
.ocr-step.done   .ocr-step-num { background: #22c55e; color: white; }
.ocr-step-line { flex: 1; height: 2px; background: rgba(var(--v-theme-on-surface),.1); margin: 0 8px; max-width: 60px; }
.ocr-step-line.done { background: #22c55e; }

/* Dropzone */
.ocr-dropzone {
  border: 2px dashed rgba(139,92,246,.4);
  border-radius: 12px;
  min-height: 200px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: border-color .2s, background .2s;
  background: rgba(139,92,246,.03);
}
.ocr-dropzone:hover { border-color: #8b5cf6; background: rgba(139,92,246,.06); }
.ocr-dropzone--preview { border-style: solid; border-color: #8b5cf6; padding: 8px; }
.ocr-dropzone-inner { text-align: center; padding: 20px; }
.ocr-drop-txt { font-size: 15px; font-weight: 600; margin: 0; }
.ocr-drop-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); margin: 4px 0 0; }
.ocr-img-preview { max-width: 100%; max-height: 360px; border-radius: 8px; object-fit: contain; }

/* Processing */
.ocr-processing { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 220px; }
.ocr-proc-txt { font-size: 16px; font-weight: 700; margin: 0; }
.ocr-proc-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface),.5); margin: 0; }

/* Review */
.ocr-review-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
.ocr-review-stats  { display: flex; gap: 8px; flex-wrap: wrap; }
.ocr-empty { text-align: center; padding: 40px; color: rgba(var(--v-theme-on-surface),.5); }

/* Table de revisión */
.ocr-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.ocr-table thead { background: rgba(var(--v-theme-on-surface),.04); }
.ocr-table thead th {
  padding: 8px 10px; text-align: left;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px;
  color: rgba(var(--v-theme-on-surface),.5);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08);
}
.ocr-table tbody tr { border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); }
.ocr-table tbody td { padding: 6px 10px; vertical-align: middle; }
.ocr-row-ok   { background: rgba(34,197,94,.04); }
.ocr-row-warn { background: rgba(234,179,8,.04); }
.ocr-td-raw   { font-size: 12px; color: rgba(var(--v-theme-on-surface),.6); max-width: 180px; word-break: break-word; }
.ocr-td-prod  { min-width: 200px; }
.ocr-td-cant  { text-align: center; }
.ocr-td-conf  { text-align: center; }

.ocr-cant-input {
  width: 80px; padding: 5px 8px; text-align: center;
  border: 1px solid rgba(var(--v-theme-on-surface),.15);
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface),.03);
  color: rgb(var(--v-theme-on-surface));
  font-size: 13px; font-weight: 600;
  outline: none;
}
.ocr-cant-input:focus { border-color: #8b5cf6; background: rgba(139,92,246,.06); }
</style>
