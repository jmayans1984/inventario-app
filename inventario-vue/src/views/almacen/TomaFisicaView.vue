<template>
  <MainLayout>
    <div class="tf-container">

      <PageHeader
        title="Toma Física / Ajuste de Inventario"
        description="Registra el conteo físico y genera los ajustes automáticos en el inventario"
        :crumbs="['Almacén', 'Procesos', 'Toma Física']"
      >
        <template #actions>
          <v-btn icon size="small" variant="text" title="¿Cómo funciona este módulo?" @click="dlgAyuda = true">
            <v-icon size="20">mdi-help-circle-outline</v-icon>
          </v-btn>
        </template>
      </PageHeader>

      <!-- DIALOG AYUDA -->
      <v-dialog v-model="dlgAyuda" max-width="560">
        <v-card>
          <v-card-title class="d-flex align-center gap-2 pa-4 pb-2">
            <v-icon color="primary">mdi-help-circle-outline</v-icon>
            ¿Cómo funciona la Toma Física?
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4" style="font-size:14px;line-height:1.7">

            <div class="ayuda-bloque">
              <div class="ayuda-icon"><v-icon color="primary" size="20">mdi-numeric-1-circle</v-icon></div>
              <div>
                <strong>¿Qué hace este módulo?</strong><br>
                Compara el stock que tiene el sistema con el conteo real que hiciste en bodega.
                La diferencia se registra automáticamente en el inventario como <em>AJUSTE DE INVENTARIO</em>.
              </div>
            </div>

            <div class="ayuda-bloque">
              <div class="ayuda-icon"><v-icon color="warning" size="20">mdi-numeric-2-circle</v-icon></div>
              <div>
                <strong>Filas sin conteo → se omiten</strong><br>
                Si dejas un producto en blanco, el sistema <strong>no asume que tiene cero</strong> — simplemente lo omite.
                En un conteo normal solo se ajustan los productos donde escribiste un conteo físico
                <em>y</em> ese conteo difiere del stock actual.
                Con <strong>Cierre de Inventario Final de Periodo</strong> activado se guarda todo lo que digites,
                cuadre o no, porque ese conteo es el que valoriza el inventario del mes.
              </div>
            </div>

            <div class="ayuda-bloque">
              <div class="ayuda-icon"><v-icon color="success" size="20">mdi-numeric-3-circle</v-icon></div>
              <div>
                <strong>¿Qué fecha usar?</strong><br>
                Usa la fecha en que <strong>se cerró el inventario</strong>, no la fecha de hoy.
                <br><br>
                <em>Ejemplo:</em> Si hoy es 25 de mayo pero el conteo lo hiciste anoche después del
                cierre de ventas, registra la toma con fecha <strong>24 de mayo</strong>.
                Así el ajuste queda en el momento exacto del conteo, no después de los movimientos del día siguiente.
              </div>
            </div>

            <div class="ayuda-bloque">
              <div class="ayuda-icon"><v-icon color="primary" size="20">mdi-numeric-4-circle</v-icon></div>
              <div>
                <strong>¿Qué registra en el inventario?</strong><br>
                • Diferencia <span style="color:#10b981;font-weight:700">positiva</span> (conteo &gt; sistema) → va a <strong>Entrada</strong><br>
                • Diferencia <span style="color:#ef4444;font-weight:700">negativa</span> (conteo &lt; sistema) → va a <strong>Salida</strong>
              </div>
            </div>

          </v-card-text>
          <v-divider />
          <v-card-actions class="pa-3 justify-end">
            <v-btn color="primary" variant="elevated" @click="dlgAyuda = false">Entendido</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- FORMULARIO CABECERA -->
      <div class="tf-form-card">
        <div class="tf-form-row">

          <div class="tf-field">
            <v-text-field
              v-model="fecha"
              label="Fecha *"
              type="date"
              variant="outlined"
              density="compact"
              hide-details="auto"
              :error-messages="errFecha"
            />
          </div>

          <div class="tf-field">
            <v-select
              v-model="ccosto"
              :items="ccostos"
              item-title="nombre"
              item-value="codigo"
              label="Centro de Costo *"
              variant="outlined"
              density="compact"
              hide-details="auto"
              :error-messages="errCcosto"
              @update:model-value="onCcostoChange"
            />
          </div>

          <div class="tf-field tf-field--obs">
            <v-text-field
              :model-value="observaciones"
              @update:model-value="observaciones = $event.toUpperCase()"
              label="Observaciones"
              variant="outlined"
              density="compact"
              hide-details
              placeholder="Opcional"
            />
          </div>

          <div class="tf-field tf-field--btn">
            <v-btn
              color="primary"
              variant="elevated"
              prepend-icon="mdi-database-search"
              :loading="loadingStock"
              :disabled="!fecha || !ccosto"
              @click="cargarStock"
            >
              Cargar Inventario
            </v-btn>
          </div>

        </div>

        <div class="tf-cierre-row">
          <v-switch
            v-model="modoCierre"
            color="primary"
            density="compact"
            hide-details
            @update:model-value="onCierreChange"
          />
          <div class="tf-cierre-text">
            <strong>Cierre de Inventario Final de Periodo</strong>
            <span v-if="!modoCierre">Muestra TODOS los productos con control de inventario activo, sin importar el centro de costo — úsalo para el conteo global de fin de mes.</span>
            <span v-else class="tf-cierre-on">
              Se guardará todo lo que digites, cuadre o no, y este conteo será el que valorice
              el inventario final del periodo en la Valoración Mensual.
            </span>
          </div>
        </div>
      </div>

      <!-- MENSAJES -->
      <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-4" closable @click:close="errorMsg=''">{{ errorMsg }}</v-alert>
      <v-alert v-if="exitoMsg" type="success" variant="tonal" class="mb-4" closable @click:close="exitoMsg=''">{{ exitoMsg }}</v-alert>

      <!-- GRID -->
      <div v-if="totalProductos > 0" class="tf-grid-card">

        <!-- KPIs rápidos -->
        <div class="tf-kpis">
          <div class="tf-kpi">
            <span class="tf-kpi-val">{{ totalProductos }}</span>
            <span class="tf-kpi-lbl">Productos</span>
          </div>
          <div class="tf-kpi">
            <span class="tf-kpi-val">{{ productosContados }}</span>
            <span class="tf-kpi-lbl">Contados</span>
          </div>
          <div class="tf-kpi tf-kpi--warn">
            <span class="tf-kpi-val">{{ productosConDiferencia }}</span>
            <span class="tf-kpi-lbl">Con diferencia</span>
          </div>
          <div class="tf-kpi tf-kpi--ok">
            <span class="tf-kpi-val">{{ productosSinDiferencia }}</span>
            <span class="tf-kpi-lbl">Sin diferencia</span>
          </div>
          <v-spacer />
          <v-text-field
            v-model="busquedaProducto"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            placeholder="Buscar producto..."
            prepend-inner-icon="mdi-magnify"
            style="max-width:240px"
          />
        </div>

        <div class="tf-table-wrap">
          <table class="tf-table">
            <thead>
              <tr>
                <th>CÓD</th>
                <th class="th-nom">PRODUCTO</th>
                <th>UND</th>
                <th class="th-num">STOCK ACTUAL</th>
                <th class="th-num">CONTEO FÍSICO</th>
                <th class="th-num">DIFERENCIA</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="productosAgrupados.length === 0">
                <td colspan="6" style="text-align:center;padding:24px;color:rgba(var(--v-theme-on-surface),.4)">
                  Sin resultados para la búsqueda
                </td>
              </tr>
              <template v-for="grupo in productosAgrupados" :key="grupo.key">
                <!-- Fila de grupo -->
                <tr class="tf-grupo-row">
                  <td colspan="6">
                    <v-icon size="14" class="mr-1" style="opacity:.6">mdi-folder-outline</v-icon>
                    {{ grupo.nombre }}
                  </td>
                </tr>
                <!-- Filas de productos -->
                <tr
                  v-for="p in grupo.items"
                  :key="p.codigo"
                  class="tf-prod-row"
                  :class="{ 'tf-row-diff': getDiferencia(p.codigo) !== 0 && getFisico(p.codigo) !== null }"
                  :style="hoveredRow === p.codigo ? { background: rowHoverBg } : {}"
                  @focusin="hoveredRow = p.codigo"
                  @focusout="hoveredRow = null"
                >
                  <td><span class="badge-cod">{{ p.codigo }}</span></td>
                  <td class="td-nom">{{ p.nombre }}</td>
                  <td><span class="badge-und">{{ p.und }}</span></td>
                  <td class="td-num">
                    <span :class="p.stock_actual < 0 ? 'stock-neg' : 'stock-pos'">
                      {{ formatNum(p.stock_actual) }}
                    </span>
                  </td>
                  <td class="td-num">
                    <input
                      :value="getFisico(p.codigo) ?? ''"
                      type="text"
                      inputmode="decimal"
                      class="tf-cant-input"
                      :class="{ 'tf-cant-active': getFisico(p.codigo) !== null }"
                      placeholder="—"
                      @input="setFisico(p.codigo, $event.target.value)"
                      @keydown.enter.prevent="siguienteInput($event)"
                    />
                  </td>
                  <td class="td-num">
                    <template v-if="getFisico(p.codigo) !== null">
                      <span
                        class="diff-badge"
                        :class="{
                          'diff-pos': getDiferencia(p.codigo) > 0,
                          'diff-neg': getDiferencia(p.codigo) < 0,
                          'diff-zero': getDiferencia(p.codigo) === 0
                        }"
                      >
                        {{ getDiferencia(p.codigo) > 0 ? '+' : '' }}{{ formatNum(getDiferencia(p.codigo)) }}
                      </span>
                    </template>
                    <span v-else class="diff-empty">—</span>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- FOOTER ACCIONES -->
        <div class="tf-footer">
          <div class="tf-footer-info">
            <v-icon size="16" color="primary" class="mr-1">mdi-information-outline</v-icon>
            <span v-if="productosContados === 0" style="color:rgba(var(--v-theme-on-surface),.5)">
              Ingresa el conteo físico de los productos
            </span>
            <span v-else style="color:#0891b2;font-weight:600">
              {{ productosContados }} producto{{ productosContados !== 1 ? 's' : '' }} contados —
              {{ productosConDiferencia }} con diferencia
              <span v-if="modoCierre" style="color:var(--indigo)"> · se guardarán los {{ productosContados }}</span>
            </span>
          </div>
          <div class="tf-footer-btns">
            <v-btn
              color="primary"
              variant="elevated"
              prepend-icon="mdi-content-save"
              :loading="guardando"
              :disabled="!puedeGuardar"
              :title="tituloBotonGuardar"
              @click="guardar()"
            >
              {{ modoCierre ? 'Guardar Cierre de Periodo' : 'Guardar Ajuste' }}
            </v-btn>
          </div>
        </div>
      </div>

      <!-- EMPTY STATE -->
      <div v-else-if="!loadingStock && stockCargado" class="tf-empty">
        <v-icon size="48" color="rgba(var(--v-theme-on-surface),.2)">mdi-package-variant</v-icon>
        <p>No hay productos con control de inventario activo</p>
      </div>

      <!-- DIALOG CONFLICTO -->
      <v-dialog v-model="dlgConflicto" max-width="460">
        <v-card>
          <v-card-title class="d-flex align-center gap-2 pa-4">
            <v-icon color="warning">mdi-alert-circle-outline</v-icon>
            Ajuste ya existe
          </v-card-title>
          <v-card-text class="pa-4 pt-0">
            Ya existe un ajuste de inventario para <strong>{{ fecha }}</strong> en el CC <strong>{{ ccosto }}</strong>
            con <strong>{{ conflictCount }}</strong> registro(s). ¿Qué deseas hacer?
          </v-card-text>
          <v-divider />
          <v-card-actions class="pa-4" style="flex-direction:column;gap:8px;align-items:stretch">
            <v-btn color="error" variant="elevated" prepend-icon="mdi-delete-sweep" :loading="guardando" @click="guardar('replace')">
              Eliminar ajuste previo y reemplazar
            </v-btn>
            <v-btn color="primary" variant="outlined" prepend-icon="mdi-plus-circle-outline" :loading="guardando" @click="guardar('add')">
              Adicionar al ajuste existente
            </v-btn>
            <v-btn variant="text" :disabled="guardando" @click="dlgConflicto=false">Cancelar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTheme } from 'vuetify'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'
import { formatFecha } from '../../utils/formatters'

const auth    = useAuthStore()
const empresa = computed(() => auth.empresa)

const theme = useTheme()
const rowHoverBg = computed(() =>
  theme.current.value.dark ? 'rgba(251,191,36,.2)' : '#fee2e2'
)
const hoveredRow = ref(null)

function fechaInputLocal() {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

// ── Formulario cabecera ───────────────────────────────────────
const fecha        = ref(fechaInputLocal())
const ccosto       = ref(null)
const observaciones = ref('')
const errFecha     = ref('')
const errCcosto    = ref('')

// ── Datos ─────────────────────────────────────────────────────
const ccostos       = ref([])
const productos     = ref([])   // [{ codigo, nombre, und, grupo_nombre, grupo_codigo, stock_actual }]
const fisico        = ref({})   // { [codigo]: number }
const loadingStock  = ref(false)
const stockCargado  = ref(false)

// ── UI ────────────────────────────────────────────────────────
const guardando      = ref(false)
const dlgConflicto   = ref(false)
const dlgAyuda       = ref(false)
const conflictCount  = ref(0)
const errorMsg       = ref('')
const exitoMsg       = ref('')
const modoCierre     = ref(false)

function onCierreChange() {
  productos.value    = []
  fisico.value       = {}
  stockCargado.value = false
  exitoMsg.value     = ''
  errorMsg.value     = ''
}

// ── Cargar centros de costo ───────────────────────────────────
async function cargarCcostos() {
  try {
    const res = await api.get('/ccostos', { params: { empresa: empresa.value } })
    ccostos.value = res.data?.data || res.data?.ccostos || []
  } catch (e) {
    console.error('Error cargando ccostos:', e)
  }
}
cargarCcostos()

// ── Cuando cambia el CC, resetear grid ───────────────────────
function onCcostoChange() {
  productos.value  = []
  fisico.value     = {}
  stockCargado.value = false
  exitoMsg.value   = ''
  errorMsg.value   = ''
}

// ── Cargar stock actual ───────────────────────────────────────
async function cargarStock() {
  errFecha.value  = fecha.value  ? '' : 'Requerido'
  errCcosto.value = ccosto.value ? '' : 'Requerido'
  if (errFecha.value || errCcosto.value) return

  loadingStock.value = true
  fisico.value       = {}
  busquedaProducto.value = ''
  exitoMsg.value     = ''
  errorMsg.value     = ''
  try {
    const res = await api.get('/almacen/ajuste-inventario/stock', {
      params: { empresa: empresa.value, ccosto: ccosto.value, cierre: modoCierre.value }
    })
    productos.value    = res.data?.data || []
    stockCargado.value = true
  } catch (e) {
    errorMsg.value = e?.response?.data?.error || e.message || 'Error al cargar stock'
  } finally {
    loadingStock.value = false
  }
}

// ── Conteo físico ─────────────────────────────────────────────
function getFisico(codigo) {
  return fisico.value[codigo] ?? null
}

function setFisico(codigo, val) {
  // Estado intermedio: usuario escribiendo
  if (val === '-' || val === '.' || val === ',' || val === '-.' || val === '-,' ||
      val.endsWith('.') || val.endsWith(',')) return

  const nuevo = { ...fisico.value }
  if (val === '' || val === null || val === undefined) {
    delete nuevo[codigo]
  } else {
    const n = parseFloat(val.replace(',', '.'))
    if (isNaN(n)) delete nuevo[codigo]
    else nuevo[codigo] = n
  }
  fisico.value = nuevo
}

function getDiferencia(codigo) {
  const f = getFisico(codigo)
  if (f === null) return 0
  const p = productos.value.find(x => x.codigo === codigo)
  const actual = parseFloat(p?.stock_actual || 0)
  return Math.round((f - actual) * 10000000) / 10000000  // evitar floating point
}

// ── Enter navega al siguiente input ──────────────────────────
function siguienteInput(event) {
  const inputs = Array.from(document.querySelectorAll('.tf-cant-input'))
  const idx    = inputs.indexOf(event.target)
  if (idx !== -1 && idx < inputs.length - 1) {
    inputs[idx + 1].focus()
    inputs[idx + 1].select()
  }
}

// ── Agrupación ───────────────────────────────────────────────
const busquedaProducto = ref('')

const productosFiltrados = computed(() => {
  const q = busquedaProducto.value?.trim().toLowerCase()
  if (!q) return productos.value
  return productos.value.filter(p =>
    p.nombre?.toLowerCase().includes(q) || p.codigo?.toLowerCase().includes(q)
  )
})

const productosAgrupados = computed(() => {
  const mapa = new Map()
  for (const p of productosFiltrados.value) {
    const key    = p.grupo_codigo || '__sin_grupo__'
    const nombre = p.grupo_nombre || 'Sin Grupo'
    if (!mapa.has(key)) mapa.set(key, { key, nombre, items: [] })
    mapa.get(key).items.push(p)
  }
  return Array.from(mapa.values())
})

// ── KPIs ─────────────────────────────────────────────────────
const totalProductos       = computed(() => productos.value.length)
const productosContados    = computed(() => Object.keys(fisico.value).length)
const productosConDiferencia = computed(() =>
  productos.value.filter(p => {
    const f = getFisico(p.codigo)
    return f !== null && getDiferencia(p.codigo) !== 0
  }).length
)
// En un cierre basta con haber contado: un conteo donde todo cuadra sigue siendo
// el respaldo del inventario del periodo y debe poder guardarse. En un conteo
// normal solo tiene sentido guardar si hay algo que ajustar.
const puedeGuardar = computed(() =>
  modoCierre.value ? productosContados.value > 0 : productosConDiferencia.value > 0
)

const tituloBotonGuardar = computed(() => {
  if (puedeGuardar.value) return ''
  return modoCierre.value
    ? 'Ingresa el conteo físico de al menos un producto'
    : 'No hay diferencias que ajustar — activa "Cierre de Inventario Final de Periodo" si quieres registrar el conteo completo'
})

const productosSinDiferencia = computed(() =>
  productos.value.filter(p => {
    const f = getFisico(p.codigo)
    return f !== null && getDiferencia(p.codigo) === 0
  }).length
)

// ── Formato número ────────────────────────────────────────────
function formatNum(n) {
  if (n === null || n === undefined) return '—'
  const num = parseFloat(n)
  if (isNaN(num)) return '—'
  return num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
}

// ── Guardar ───────────────────────────────────────────────────
async function guardar(mode = 'new') {
  errorMsg.value = ''
  exitoMsg.value = ''
  guardando.value = true

  // Conteo parcial (modo normal): solo interesan los productos que difieren, que
  // son los que generan ajuste.
  // Cierre de periodo: se envía TODO lo digitado, aunque cuadre o quede en cero,
  // porque ese conteo es el que respalda el inventario final del mes.
  const ajustes = productos.value
    .filter(p => getFisico(p.codigo) !== null &&
                 (modoCierre.value || getDiferencia(p.codigo) !== 0))
    .map(p => ({ codigo: p.codigo, diferencia: getDiferencia(p.codigo) }))

  if (ajustes.length === 0) {
    errorMsg.value = modoCierre.value
      ? 'Escribe el conteo físico de al menos un producto antes de cerrar el periodo.'
      : 'No hay diferencias que ajustar — todos los productos contados coinciden con el sistema.'
    guardando.value = false
    return
  }

  try {
    const res = await api.post('/almacen/ajuste-inventario', {
      empresa:       empresa.value,
      fecha:         fecha.value,
      ccosto:        ccosto.value,
      observaciones: observaciones.value,
      ajustes,
      mode,
      es_cierre: modoCierre.value,
    })

    if (res.data?.conflict) {
      conflictCount.value = res.data.count || 0
      dlgConflicto.value  = true
      return
    }

    if (!res.data?.success) throw new Error(res.data?.error || 'Error al guardar')

    dlgConflicto.value = false
    exitoMsg.value = modoCierre.value
      ? `✓ Cierre de periodo guardado — ${res.data.contados} producto(s) contado(s), ${res.data.registros} con ajuste. Este conteo valoriza el inventario final.`
      : `✓ Ajuste guardado — ${res.data.registros} producto(s) ajustado(s)`
    fisico.value = {}
    // Recargar stock para reflejar el ajuste
    await cargarStock()

  } catch (e) {
    errorMsg.value = e?.response?.data?.error || e.message || 'Error al guardar'
  } finally {
    guardando.value = false
  }
}
</script>

<style scoped>
.tf-container { padding: 24px; max-width: 1400px; margin: 0 auto; }

.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 12px; font-weight: 700; color: var(--indigo); text-transform: uppercase; letter-spacing: 0.5px; }
.bc-sep  { color: rgba(var(--v-theme-on-surface), 0.3); }
.bc-cat  { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.8); font-weight: 500; }

.tf-header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
.tf-header-icon { width: 52px; height: 52px; border-radius: 10px; background: linear-gradient(135deg,var(--indigo),var(--indigo)); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 4px 14px rgba(6,182,212,.3); }
.tf-header-text { flex: 1; }
.tf-title-row { display: flex; align-items: center; gap: 4px; }
.tf-title    { font-size: 20px; font-weight: 800; margin: 0; }
.tf-subtitle { font-size: 13px; color: rgba(var(--v-theme-on-surface),.55); margin: 2px 0 0; }

.ayuda-bloque { display: flex; gap: 12px; margin-bottom: 18px; }
.ayuda-bloque:last-child { margin-bottom: 0; }
.ayuda-icon { flex-shrink: 0; padding-top: 2px; }

.tf-form-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 10px; padding: 16px 20px; margin-bottom: 16px; }
.tf-form-row  { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
.tf-field     { min-width: 180px; flex: 1; }
.tf-field--obs { flex: 2; }
.tf-field--btn { flex: 0 0 auto; display: flex; align-items: center; padding-top: 2px; }

.tf-cierre-row { display: flex; align-items: flex-start; gap: 10px; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(var(--v-theme-on-surface),.07); }
.tf-cierre-text { display: flex; flex-direction: column; font-size: 12px; padding-top: 6px; }
.tf-cierre-text strong { font-size: 13px; color: var(--indigo); }
.tf-cierre-text span { color: rgba(var(--v-theme-on-surface),.55); margin-top: 2px; }
.tf-cierre-text .tf-cierre-on { color: var(--indigo); font-weight: 500; }

.tf-grid-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 10px; overflow: hidden; }

.tf-kpis { display: flex; align-items: center; gap: 0; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.07); }
.tf-kpis .v-text-field { margin: 0 16px; }
.tf-kpi  { flex: 1; padding: 12px 16px; text-align: center; border-right: 1px solid rgba(var(--v-theme-on-surface),.07); }
.tf-kpi:last-child { border-right: none; }
.tf-kpi-val { display: block; font-size: 22px; font-weight: 800; color: var(--indigo); }
.tf-kpi-lbl { display: block; font-size: 10px; color: rgba(var(--v-theme-on-surface),.5); text-transform: uppercase; letter-spacing: .5px; margin-top: 2px; }
.tf-kpi--warn .tf-kpi-val { color: var(--gold); }
.tf-kpi--ok   .tf-kpi-val { color: var(--success); }

.tf-table-wrap { overflow-x: auto; }
.tf-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.tf-table thead th { background: rgba(var(--v-theme-surface),1); padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: rgba(var(--v-theme-on-surface),.5); text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); white-space: nowrap; }
.th-nom { width: 100%; }
.th-num { text-align: right !important; }

.tf-grupo-row td { padding: 8px 12px 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.45); background: rgba(var(--v-theme-on-surface),.02); }
.tf-prod-row td  { padding: 8px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); }
.tf-prod-row:hover { background: rgba(var(--v-theme-on-surface),.02); }
.tf-row-diff { background: rgba(245,158,11,.04) !important; }

.badge-cod { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; font-family: monospace; background: rgba(var(--v-theme-on-surface),.07); }
.badge-und { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 11px; background: rgba(8,145,178,.1); color: var(--indigo); font-weight: 600; }
.td-nom { font-weight: 500; }
.td-num { text-align: right; white-space: nowrap; }

.stock-pos { color: rgb(var(--v-theme-on-surface)); }
.stock-neg { color: var(--error); font-weight: 600; }

.tf-cant-input {
  width: 110px; padding: 5px 10px;
  border: 1px solid rgba(var(--v-theme-on-surface),.15);
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface),.03);
  color: rgb(var(--v-theme-on-surface));
  font-size: 13px;
  text-align: right;
  outline: none;
  transition: border-color .15s, background .15s;
}
.tf-cant-input:focus   { border-color: var(--indigo); background: rgba(8,145,178,.06); }
.tf-cant-active        { border-color: var(--indigo); background: rgba(8,145,178,.08); font-weight: 600; }

.diff-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 700; }
.diff-pos  { background: rgba(16,185,129,.12); color: var(--success); }
.diff-neg  { background: rgba(239,68,68,.12);  color: var(--error); }
.diff-zero { background: rgba(var(--v-theme-on-surface),.07); color: rgba(var(--v-theme-on-surface),.5); }
.diff-empty { color: rgba(var(--v-theme-on-surface),.25); font-size: 13px; }

.tf-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-top: 1px solid rgba(var(--v-theme-on-surface),.08); }
.tf-footer-info { display: flex; align-items: center; font-size: 13px; }
.tf-footer-btns { display: flex; gap: 8px; }

.tf-empty { text-align: center; padding: 60px 24px; color: rgba(var(--v-theme-on-surface),.4); display: flex; flex-direction: column; align-items: center; gap: 12px; font-size: 14px; }
</style>
