<template>
  <MainLayout>
    <div class="pv-container">

      <!-- BREADCRUMB -->
      <div class="pv-breadcrumb">
        <span class="bc-root">PROVEEDURÍA</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Configuración</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Productos para Venta</span>
      </div>

      <!-- HEADER -->
      <div class="pv-header">
        <div class="pv-header-left">
          <div class="pv-icon-wrap"><v-icon size="22" color="white">mdi-store-outline</v-icon></div>
          <div>
            <h1 class="pv-title">PRODUCTOS PARA VENTA</h1>
            <p class="pv-sub">Catálogo completo de productos disponibles para clientes</p>
          </div>
        </div>
        <div class="d-flex gap-2">
          <v-btn color="#f59e0b" variant="tonal" rounded="lg" @click="dlgRecalc=true">
            <v-icon start>mdi-calculator-variant-outline</v-icon>Recalcular Precios
          </v-btn>
          <v-btn color="#06b6d4" variant="flat" rounded="lg" @click="abrirModal()">
            <v-icon start>mdi-plus</v-icon>Nuevo Producto
          </v-btn>
        </div>
      </div>

      <!-- KPIs -->
      <div class="pv-kpi-row">
        <div class="pv-kpi" style="--kc:#06b6d4">
          <div class="kpi-icon"><v-icon size="18" color="#06b6d4">mdi-package-variant-closed</v-icon></div>
          <div class="kpi-body">
            <div class="kpi-val">{{ productos.length }}</div>
            <div class="kpi-lbl">TOTAL</div>
          </div>
        </div>
        <div class="pv-kpi" style="--kc:#22c55e">
          <div class="kpi-icon"><v-icon size="18" color="#22c55e">mdi-check-circle-outline</v-icon></div>
          <div class="kpi-body">
            <div class="kpi-val">{{ activos }}</div>
            <div class="kpi-lbl">ACTIVOS</div>
          </div>
        </div>
        <div class="pv-kpi" style="--kc:#f59e0b">
          <div class="kpi-icon"><v-icon size="18" color="#f59e0b">mdi-folder-multiple-outline</v-icon></div>
          <div class="kpi-body">
            <div class="kpi-val">{{ grupos.length }}</div>
            <div class="kpi-lbl">GRUPOS</div>
          </div>
        </div>
        <div class="pv-kpi" style="--kc:#8b5cf6">
          <div class="kpi-icon"><v-icon size="18" color="#8b5cf6">mdi-currency-usd</v-icon></div>
          <div class="kpi-body">
            <div class="kpi-val">{{ fmt(precioPromedioVenta1) }}</div>
            <div class="kpi-lbl">PRECIO VTA. PROM.</div>
          </div>
        </div>
      </div>

      <!-- FILTROS -->
      <div class="pv-filters">
        <div class="pv-search">
          <v-icon size="16" color="rgba(var(--v-theme-on-surface),.4)">mdi-magnify</v-icon>
          <input v-model="busqueda" type="text" placeholder="Buscar por código o nombre..." class="pv-search-input" />
        </div>
        <select v-model="filtroGrupo" class="pv-select">
          <option value="">Todos los grupos</option>
          <option v-for="g in grupos" :key="g.codigo" :value="g.codigo">{{ g.nombre }}</option>
        </select>
        <select v-model="filtroControl" class="pv-select">
          <option value="">Todos</option>
          <option value="SI">Activos</option>
          <option value="NO">Inactivos</option>
        </select>
        <span class="pv-count">{{ filasFiltradas.length }} producto{{ filasFiltradas.length !== 1 ? 's' : '' }}</span>
      </div>

      <!-- TABLA -->
      <div class="pv-table-card">
        <v-progress-linear v-if="loading" indeterminate color="#06b6d4" height="3" />

        <div v-if="!loading && filasFiltradas.length === 0" class="pv-empty">
          <v-icon size="48" color="rgba(var(--v-theme-on-surface),.12)" class="mb-2">mdi-package-variant-closed</v-icon>
          <div>No hay productos que mostrar</div>
        </div>

        <table v-else class="pv-table">
          <thead>
            <tr>
              <th>CÓDIGO</th>
              <th>NOMBRE / DESCRIPCIÓN</th>
              <th>GRUPO</th>
              <th class="ta-c">UND</th>
              <th class="ta-r">P. COSTO</th>
              <th class="ta-r">P. VENTA 1</th>
              <th class="ta-r">P. VENTA 2</th>
              <th class="ta-r">P. VENTA 3</th>
              <th class="ta-c">ACTIVO</th>
              <th class="ta-c">ACCIONES</th>
            </tr>
          </thead>
          <template v-for="([grpNombre, items]) in gruposAgrupados" :key="grpNombre">
            <tbody>
              <tr class="pv-group-row">
                <td colspan="10">
                  <v-icon size="13" color="#06b6d4" class="mr-1">mdi-folder-outline</v-icon>
                  {{ grpNombre }}
                  <span class="pv-group-count">{{ items.length }} ítem{{ items.length !== 1 ? 's' : '' }}</span>
                </td>
              </tr>
              <tr v-for="p in items" :key="p.codigo" class="pv-row">
                <td><span class="cod-badge">{{ p.codigo }}</span></td>
                <td>
                  <div class="pv-nombre">{{ p.nombre }}</div>
                  <div v-if="p.descripcion" class="pv-desc">{{ p.descripcion }}</div>
                </td>
                <td class="text-caption dim-text">{{ p.grupo_nombre || p.grupo || '—' }}</td>
                <td class="ta-c dim-text">{{ p.unidad || '—' }}</td>
                <td class="ta-r font-mono dim-text">{{ fmt(p.precio_costo) }}</td>
                <td class="ta-r font-mono text-success">{{ fmt(p.precio_venta1) }}</td>
                <td class="ta-r font-mono dim-text">{{ fmt(p.precio_venta2) }}</td>
                <td class="ta-r font-mono dim-text">{{ fmt(p.precio_venta3) }}</td>
                <td class="ta-c">
                  <v-btn :icon="p.control === 'SI' ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
                    size="x-small" variant="text"
                    :color="p.control === 'SI' ? '#22c55e' : 'rgba(var(--v-theme-on-surface),.3)'"
                    :loading="toggling === p.codigo"
                    @click="toggleControl(p)" />
                </td>
                <td class="ta-c">
                  <v-btn icon="mdi-pencil-outline" size="x-small" variant="tonal" color="#06b6d4" class="mr-1" @click="abrirModal(p)" />
                  <v-btn icon="mdi-delete-outline" size="x-small" variant="tonal" color="error" @click="confirmarEliminar(p)" />
                </td>
              </tr>
            </tbody>
          </template>
        </table>
      </div>
    </div>

    <!-- ══ DIALOG CREAR / EDITAR ══ -->
    <v-dialog v-model="dlg" max-width="680" persistent scrollable>
      <v-card rounded="xl" style="overflow:hidden">

        <!-- Header -->
        <div class="dlg-header">
          <div class="dlg-icon"><v-icon size="20" color="white">mdi-store-outline</v-icon></div>
          <div class="dlg-titles">
            <div class="dlg-title">{{ editando ? 'Editar Producto' : 'Nuevo Producto' }}</div>
            <div class="dlg-sub">{{ editando ? `Cód: ${form.codigo}` : 'Completa los datos del producto' }}</div>
          </div>
          <v-btn icon="mdi-close" size="small" variant="text" color="white" @click="dlg=false" />
        </div>

        <!-- Body -->
        <v-card-text class="pa-5">
          <!-- Fila 1: Código + Nombre -->
          <div class="dlg-section-label">IDENTIFICACIÓN</div>
          <div class="dlg-row" style="grid-template-columns:110px 1fr">
            <div>
              <div class="dlg-field-label">Código *</div>
              <v-text-field v-model="form.codigo" :disabled="editando" variant="outlined" density="compact"
                hide-details maxlength="10" :error="!!errores.codigo"
                @input="form.codigo = form.codigo.toUpperCase()" />
              <div v-if="errores.codigo" class="dlg-err">{{ errores.codigo }}</div>
            </div>
            <div>
              <div class="dlg-field-label">Nombre *</div>
              <v-text-field v-model="form.nombre" variant="outlined" density="compact"
                hide-details maxlength="200" :error="!!errores.nombre"
                @input="form.nombre = form.nombre.toUpperCase()" />
              <div v-if="errores.nombre" class="dlg-err">{{ errores.nombre }}</div>
            </div>
          </div>

          <!-- Descripción -->
          <div class="mt-3">
            <div class="dlg-field-label">Descripción</div>
            <v-textarea v-model="form.descripcion" variant="outlined" density="compact"
              hide-details rows="2" placeholder="Descripción opcional del producto" />
          </div>

          <v-divider class="my-4" />

          <!-- Fila 2: Grupo + Unidad + Stock mínimo -->
          <div class="dlg-section-label">CLASIFICACIÓN</div>
          <div class="dlg-row" style="grid-template-columns:1fr 100px 130px">
            <div>
              <div class="dlg-field-label">Grupo</div>
              <v-autocomplete v-model="form.grupo" :items="gruposItems"
                item-title="nombre" item-value="codigo"
                variant="outlined" density="compact" hide-details clearable />
            </div>
            <div>
              <div class="dlg-field-label">Unidad</div>
              <v-text-field v-model="form.unidad" variant="outlined" density="compact"
                hide-details maxlength="20" @input="form.unidad = form.unidad.toUpperCase()" />
            </div>
            <div>
              <div class="dlg-field-label">Stock Mínimo</div>
              <v-text-field v-model="form.stock_minimo" type="number" min="0"
                variant="outlined" density="compact" hide-details />
            </div>
          </div>

          <v-divider class="my-4" />

          <!-- Precios -->
          <div class="dlg-section-label" style="display:flex;align-items:center;justify-content:space-between">
            <span>PRECIOS</span>
            <v-btn v-if="margenesConfig.m1 > 0 || margenesConfig.m2 > 0 || margenesConfig.m3 > 0"
              size="x-small" variant="tonal" color="#f59e0b" @click="calcularPrecios">
              <v-icon start size="13">mdi-calculator-variant-outline</v-icon>Auto-calcular
            </v-btn>
          </div>
          <div class="dlg-row" style="grid-template-columns:repeat(4,1fr)">
            <div>
              <div class="dlg-field-label">Costo</div>
              <v-text-field v-model="form.precio_costo" type="number" min="0"
                variant="outlined" density="compact" hide-details prefix="$" />
            </div>
            <div>
              <div class="dlg-field-label">Venta 1 *</div>
              <v-text-field v-model="form.precio_venta1" type="number" min="0"
                variant="outlined" density="compact" hide-details prefix="$" />
            </div>
            <div>
              <div class="dlg-field-label">Venta 2</div>
              <v-text-field v-model="form.precio_venta2" type="number" min="0"
                variant="outlined" density="compact" hide-details prefix="$" />
            </div>
            <div>
              <div class="dlg-field-label">Venta 3</div>
              <v-text-field v-model="form.precio_venta3" type="number" min="0"
                variant="outlined" density="compact" hide-details prefix="$" />
            </div>
          </div>

          <!-- Margen automático -->
          <div v-if="form.precio_costo > 0 && form.precio_venta1 > 0" class="pv-margen-info">
            <span>Margen Venta 1:</span>
            <span :class="margen1 >= 0 ? 'text-success' : 'text-error'">
              {{ fmt(form.precio_venta1 - form.precio_costo) }}
              ({{ margen1.toFixed(1) }}%)
            </span>
          </div>

          <v-divider class="my-4" />

          <!-- Estado -->
          <div class="dlg-section-label">ESTADO</div>
          <div class="dlg-row" style="grid-template-columns:1fr 1fr">
            <div class="pv-toggle-card" :class="{ 'pv-toggle-on': form.control === 'SI' }"
              @click="form.control = form.control === 'SI' ? 'NO' : 'SI'">
              <div>
                <div class="dlg-field-label" style="margin-bottom:2px">Control / Activo</div>
                <div class="pv-toggle-desc">El producto aparece en listas y pedidos</div>
              </div>
              <v-switch v-model="formControlBool" color="#06b6d4" density="compact" hide-details @click.stop />
            </div>
          </div>

          <div v-if="msgError" class="pv-msg-error mt-3">
            <v-icon size="15" class="mr-1">mdi-alert-circle-outline</v-icon>{{ msgError }}
          </div>
        </v-card-text>

        <!-- Footer -->
        <div class="dlg-footer">
          <v-btn variant="text" @click="dlg=false"><v-icon start size="16">mdi-close</v-icon>Cancelar</v-btn>
          <v-btn color="#06b6d4" variant="flat" rounded="lg" :loading="guardando" @click="guardar">
            <v-icon start size="16">mdi-content-save-outline</v-icon>
            {{ editando ? 'Guardar Cambios' : 'Crear Producto' }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- ══ CONFIRM ELIMINAR ══ -->
    <v-dialog v-model="dlgEliminar" max-width="400">
      <v-card rounded="xl" class="pa-6 text-center">
        <v-icon size="48" color="error" class="mb-3">mdi-delete-alert-outline</v-icon>
        <p class="text-subtitle-1 font-weight-bold mb-1">¿Eliminar producto?</p>
        <p class="text-caption text-medium-emphasis mb-4">
          <strong>{{ eliminando?.nombre }}</strong> ({{ eliminando?.codigo }}) será eliminado permanentemente.
        </p>
        <div class="d-flex gap-2 justify-center">
          <v-btn variant="text" @click="dlgEliminar=false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" rounded="lg" :loading="guardando" @click="eliminar">
            <v-icon start>mdi-delete-outline</v-icon>Eliminar
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- ══ DIALOG RECALCULAR PRECIOS ══ -->
    <v-dialog v-model="dlgRecalc" max-width="520" persistent>
      <v-card rounded="xl" style="overflow:hidden">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#b45309,#92400e);padding:16px 20px;display:flex;align-items:center;gap:12px">
          <div style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <v-icon size="20" color="white">mdi-calculator-variant-outline</v-icon>
          </div>
          <div style="flex:1">
            <div style="font-size:15px;font-weight:700;color:white">Recalcular Precios de Venta</div>
            <div style="font-size:11px;color:rgba(255,255,255,.55)">Asigna una lista de precios a cada nivel</div>
          </div>
          <v-btn icon="mdi-close" size="small" variant="text" color="white" @click="dlgRecalc=false" />
        </div>

        <v-card-text class="pa-5">

          <div v-if="listas.length === 0" class="text-center py-4 text-medium-emphasis text-body-2">
            No hay listas configuradas. Ve a Proveeduría → Lista de Precios para crear una.
          </div>

          <div v-else>
            <!-- Los 3 niveles -->
            <div v-for="n in [1,2,3]" :key="n" class="recalc-nivel-row">
              <div class="recalc-nivel-left">
                <span :class="`nivel-badge nivel-${n}`">Precio {{ n }}</span>
                <div>
                  <div class="recalc-nivel-label">precio_venta{{ n }}</div>
                  <div v-if="recalcSel[n]" class="recalc-nivel-formula">
                    costo ÷ {{ (1 - recalcSel[n].margen).toFixed(4) }}
                    = {{ fmtPct(recalcSel[n].margen) }} margen
                  </div>
                  <div v-else class="recalc-nivel-formula text-medium-emphasis">No actualizar</div>
                </div>
              </div>
              <v-select
                v-model="recalcSel[n]"
                :items="[{ id: null, lista: 'No actualizar' }, ...listas]"
                item-title="lista"
                item-value="id"
                return-object
                variant="outlined"
                density="compact"
                hide-details
                style="max-width:220px;flex-shrink:0"
                color="#f59e0b"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template v-if="item.raw.id" #subtitle>
                      {{ fmtPct(item.raw.margen) }} margen · {{ item.raw.dias_credito ?? 0 }}d crédito
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </div>

            <v-alert v-if="algunSeleccionado" type="warning" variant="tonal" density="compact" class="mt-4" icon="mdi-alert-outline">
              Se actualizarán los precios de <strong>todos</strong> los productos con costo mayor a 0.
            </v-alert>
          </div>
        </v-card-text>

        <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:12px 20px;border-top:1px solid rgba(var(--v-theme-on-surface),.08)">
          <v-btn variant="text" @click="dlgRecalc=false">Cancelar</v-btn>
          <v-btn color="#f59e0b" variant="flat" rounded="lg"
            :disabled="!algunSeleccionado"
            :loading="recalculando"
            @click="ejecutarRecalculo">
            <v-icon start>mdi-refresh</v-icon>Recalcular
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom right">
      {{ snack.msg }}
    </v-snackbar>

  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'

const productos   = ref([])
const grupos      = ref([])
const loading     = ref(false)
const guardando   = ref(false)
const toggling    = ref(null)
const busqueda    = ref('')
const filtroGrupo  = ref('')
const filtroControl = ref('')
const dlg          = ref(false)
const dlgEliminar  = ref(false)
const dlgRecalc    = ref(false)
const editando     = ref(false)
const eliminando   = ref(null)
const recalculando = ref(false)
// Selección de listas para recalcular: { 1: listaObj|null, 2: ..., 3: ... }
const recalcSel    = ref({ 1: null, 2: null, 3: null })
const algunSeleccionado = computed(() => Object.values(recalcSel.value).some(v => v?.id))
const msgError    = ref('')
const errores     = ref({})
const snack = ref({ show: false, msg: '', color: 'success' })

const formVacio = () => ({
  codigo: '', nombre: '', descripcion: '', unidad: 'UND', grupo: '',
  stock_minimo: 0, precio_costo: 0, precio_venta1: 0, precio_venta2: 0, precio_venta3: 0,
  control: 'SI'
})
const form = ref(formVacio())

// Computed
const activos = computed(() => productos.value.filter(p => p.control === 'SI').length)
const precioPromedioVenta1 = computed(() => {
  const con = productos.value.filter(p => parseFloat(p.precio_venta1) > 0)
  return con.length ? con.reduce((s, p) => s + parseFloat(p.precio_venta1), 0) / con.length : 0
})
const margen1 = computed(() => {
  const c = parseFloat(form.value.precio_costo) || 0
  const v = parseFloat(form.value.precio_venta1) || 0
  return v > 0 ? ((v - c) / v * 100) : 0
})

// Márgenes de la lista de precios activa
const margenesConfig = ref({ m1: 0, m2: 0, m3: 0 })

function calcularPrecios() {
  const costo = parseFloat(form.value.precio_costo) || 0
  if (!costo) return
  const { m1, m2, m3 } = margenesConfig.value
  if (m1 > 0 && m1 < 1) form.value.precio_venta1 = Math.round(costo / (1 - m1) * 100) / 100
  if (m2 > 0 && m2 < 1) form.value.precio_venta2 = Math.round(costo / (1 - m2) * 100) / 100
  if (m3 > 0 && m3 < 1) form.value.precio_venta3 = Math.round(costo / (1 - m3) * 100) / 100
}
const formControlBool = computed({
  get: () => form.value.control === 'SI',
  set: (v) => { form.value.control = v ? 'SI' : 'NO' }
})
const gruposItems = computed(() => [
  { codigo: '', nombre: 'Sin grupo' },
  ...grupos.value
])
const filasFiltradas = computed(() => {
  const q = busqueda.value.toLowerCase()
  return productos.value.filter(p => {
    const mq = !q || p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q)
    const mg = !filtroGrupo.value || p.grupo === filtroGrupo.value
    const mc = !filtroControl.value || p.control === filtroControl.value
    return mq && mg && mc
  })
})
const gruposAgrupados = computed(() => {
  const map = {}
  filasFiltradas.value.forEach(p => {
    const key = p.grupo_nombre || (p.grupo ? p.grupo : 'SIN GRUPO')
    if (!map[key]) map[key] = []
    map[key].push(p)
  })
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b, 'es'))
})

// Helpers
function fmt(n) { return '$' + (parseFloat(n) || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtPct(v) { const n = parseFloat(v) || 0; return n > 0 ? (n * 100).toFixed(1) + '%' : '—' }
function ok(msg)  { snack.value = { show: true, msg, color: 'success' } }
function err(msg) { snack.value = { show: true, msg, color: 'error' } }
function sigCodigo() {
  const nums = productos.value.map(p => parseInt(p.codigo)).filter(n => !isNaN(n) && n > 0)
  return String(nums.length ? Math.max(...nums) + 1 : 1).padStart(3, '0')
}

// Carga
async function cargar() {
  loading.value = true
  try {
    const [rp, rg, rl] = await Promise.all([
      api.get('/produccion/productos-venta'),
      api.get('/produccion/grupo-productos'),
      api.get('/produccion/lista-precios'),
    ])
    productos.value = rp.data?.data || []
    grupos.value    = rg.data?.data || []
    // Cargar márgenes de la primera lista activa
    const listaActiva = (rl.data?.data || []).find(l => l.activo === 'SI')
    if (listaActiva) {
      margenesConfig.value = {
        m1: parseFloat(listaActiva.margen_venta1) || 0,
        m2: parseFloat(listaActiva.margen_venta2) || 0,
        m3: parseFloat(listaActiva.margen_venta3) || 0,
      }
    }
  } catch (e) { err('Error al cargar productos') }
  finally { loading.value = false }
}

// Modal
function abrirModal(p = null) {
  errores.value = {}; msgError.value = ''
  editando.value = !!p
  form.value = p ? {
    codigo: p.codigo, nombre: p.nombre, descripcion: p.descripcion || '',
    unidad: p.unidad || 'UND', grupo: p.grupo || '',
    stock_minimo: p.stock_minimo || 0,
    precio_costo: p.precio_costo || 0,
    precio_venta1: p.precio_venta1 || 0,
    precio_venta2: p.precio_venta2 || 0,
    precio_venta3: p.precio_venta3 || 0,
    control: p.control || 'SI'
  } : { ...formVacio(), codigo: sigCodigo() }
  dlg.value = true
}

function validar() {
  const e = {}
  if (!form.value.codigo?.trim()) e.codigo = 'Requerido'
  if (!form.value.nombre?.trim()) e.nombre = 'Requerido'
  errores.value = e
  return !Object.keys(e).length
}

async function guardar() {
  if (!validar()) return
  guardando.value = true; msgError.value = ''
  try {
    const payload = {
      ...form.value,
      codigo: form.value.codigo.trim().toUpperCase(),
      nombre: form.value.nombre.trim().toUpperCase(),
      stock_minimo: parseFloat(form.value.stock_minimo) || 0,
      precio_costo: parseFloat(form.value.precio_costo) || 0,
      precio_venta1: parseFloat(form.value.precio_venta1) || 0,
      precio_venta2: parseFloat(form.value.precio_venta2) || 0,
      precio_venta3: parseFloat(form.value.precio_venta3) || 0,
    }
    if (editando.value) {
      await api.put(`/produccion/productos-venta/${payload.codigo}`, payload)
      ok('Producto actualizado')
    } else {
      await api.post('/produccion/productos-venta', payload)
      ok('Producto creado')
    }
    dlg.value = false
    await cargar()
  } catch (e) {
    msgError.value = e?.response?.data?.error || e.message
  } finally { guardando.value = false }
}

async function toggleControl(p) {
  toggling.value = p.codigo
  try {
    const nuevo = p.control === 'SI' ? 'NO' : 'SI'
    await api.put(`/produccion/productos-venta/${p.codigo}`, {
      nombre: p.nombre, descripcion: p.descripcion || '', unidad: p.unidad,
      grupo: p.grupo || null, stock_minimo: p.stock_minimo || 0,
      precio_costo: p.precio_costo || 0, precio_venta1: p.precio_venta1 || 0,
      precio_venta2: p.precio_venta2 || 0, precio_venta3: p.precio_venta3 || 0,
      control: nuevo
    })
    const idx = productos.value.findIndex(x => x.codigo === p.codigo)
    if (idx >= 0) productos.value[idx] = { ...productos.value[idx], control: nuevo }
  } catch (e) { err('Error al actualizar estado') }
  finally { toggling.value = null }
}

async function ejecutarRecalculo() {
  if (!algunSeleccionado.value) return
  recalculando.value = true
  try {
    const payload = {
      lista_id_1: recalcSel.value[1]?.id || null,
      lista_id_2: recalcSel.value[2]?.id || null,
      lista_id_3: recalcSel.value[3]?.id || null,
    }
    const r = await api.post('/produccion/productos-venta/recalcular-precios', payload)
    const resumen = r.data.detalle.map(d => `precio_venta${d.nivel}: ${d.actualizados} prods`).join(' · ')
    ok(`✅ Precios actualizados — ${resumen}`)
    dlgRecalc.value = false
    recalcSel.value = { 1: null, 2: null, 3: null }
    await cargar()
  } catch (e) {
    err(e?.response?.data?.error || e.message)
  } finally { recalculando.value = false }
}

function confirmarEliminar(p) { eliminando.value = p; dlgEliminar.value = true }
async function eliminar() {
  guardando.value = true
  try {
    await api.delete(`/produccion/productos-venta/${eliminando.value.codigo}`)
    ok('Producto eliminado')
    productos.value = productos.value.filter(p => p.codigo !== eliminando.value.codigo)
    dlgEliminar.value = false
  } catch (e) { err(e?.response?.data?.error || e.message) }
  finally { guardando.value = false }
}

onMounted(cargar)
</script>

<style scoped>
.pv-container { padding: 24px; max-width: 1300px; margin: 0 auto; }
.pv-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 12px; font-weight: 700; color: #06b6d4; text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface),.3) !important; }
.bc-cat { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface),.8); font-weight: 500; }

.pv-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.pv-header-left { display: flex; align-items: center; gap: 14px; }
.pv-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#06b6d4,#0891b2); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(6,182,212,.35); }
.pv-title { font-size: 20px; font-weight: 800; margin: 0; }
.pv-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }

/* KPIs */
.pv-kpi-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px,1fr)); gap: 12px; margin-bottom: 20px; }
.pv-kpi { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 12px; border-left: 3px solid var(--kc); }
.kpi-icon { width: 36px; height: 36px; border-radius: 9px; background: rgba(var(--v-theme-on-surface),.05); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.kpi-val { font-size: 18px; font-weight: 800; line-height: 1; }
.kpi-lbl { font-size: 9px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.4); margin-top: 2px; }

/* Filtros */
.pv-filters { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.pv-search { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 200px; padding: 8px 12px; background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.1); border-radius: 8px; }
.pv-search-input { flex: 1; border: none; background: transparent; outline: none; font-size: 13px; color: rgb(var(--v-theme-on-surface)); }
.pv-search-input::placeholder { color: rgba(var(--v-theme-on-surface),.35); }
.pv-select { padding: 8px 10px; border: 1px solid rgba(var(--v-theme-on-surface),.12); border-radius: 8px; font-size: 13px; background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); outline: none; }
.pv-count { font-size: 12px; font-weight: 600; color: rgba(var(--v-theme-on-surface),.4); white-space: nowrap; }

/* Tabla */
.pv-table-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 14px; overflow-x: auto; }
.pv-empty { padding: 48px; text-align: center; color: rgba(var(--v-theme-on-surface),.4); font-size: 13px; display: flex; flex-direction: column; align-items: center; }
.pv-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.pv-table thead th { padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.45); background: rgba(var(--v-theme-on-surface),.03); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); white-space: nowrap; }
.pv-table thead th.ta-r { text-align: right; }
.pv-table thead th.ta-c { text-align: center; }

.pv-group-row td { padding: 7px 12px; background: rgba(6,182,212,.05); border-top: 1px solid rgba(6,182,212,.12); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #06b6d4; }
.pv-group-count { margin-left: 8px; font-size: 10px; font-weight: 500; text-transform: none; letter-spacing: 0; color: rgba(var(--v-theme-on-surface),.4); }

.pv-row td { padding: 9px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); vertical-align: middle; }
.pv-row:hover td { background: rgba(var(--v-theme-on-surface),.02); }
.pv-nombre { font-weight: 600; font-size: 13px; }
.pv-desc { font-size: 11px; color: rgba(var(--v-theme-on-surface),.45); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 280px; }
.cod-badge { background: rgba(6,182,212,.12); color: #06b6d4; padding: 2px 7px; border-radius: 5px; font-size: 11px; font-weight: 700; font-family: monospace; }
.dim-text { color: rgba(var(--v-theme-on-surface),.55); }
.ta-r { text-align: right !important; }
.ta-c { text-align: center !important; }
.font-mono { font-family: 'Courier New', monospace; }
.text-success { color: #22c55e; }
.text-error   { color: #ef4444; }

/* Dialog */
.dlg-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; background: linear-gradient(135deg,#0891b2,#0e7490); }
.dlg-icon { width: 38px; height: 38px; border-radius: 10px; background: rgba(255,255,255,.18); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dlg-titles { flex: 1; }
.dlg-title { font-size: 15px; font-weight: 700; color: white; }
.dlg-sub { font-size: 11px; color: rgba(255,255,255,.55); margin-top: 1px; }
.dlg-section-label { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.4); margin-bottom: 10px; }
.dlg-row { display: grid; gap: 12px; }
.dlg-field-label { font-size: 11px; color: rgba(var(--v-theme-on-surface),.55); margin-bottom: 4px; font-weight: 500; }
.dlg-err { font-size: 11px; color: #ef4444; margin-top: 2px; }
.dlg-footer { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid rgba(var(--v-theme-on-surface),.08); }
.pv-toggle-card { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border: 1px solid rgba(var(--v-theme-on-surface),.1); border-radius: 10px; cursor: pointer; transition: all .15s; }
.pv-toggle-card:hover { background: rgba(var(--v-theme-on-surface),.03); }
.pv-toggle-on { border-color: rgba(6,182,212,.4); background: rgba(6,182,212,.04); }
.pv-toggle-desc { font-size: 11px; color: rgba(var(--v-theme-on-surface),.45); margin-top: 2px; }
.pv-margen-info { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 12px; color: rgba(var(--v-theme-on-surface),.6); }
.pv-msg-error { display: flex; align-items: center; font-size: 12px; color: #ef4444; background: rgba(239,68,68,.07); border-radius: 8px; padding: 8px 12px; }

/* Recalcular dialog */
.recalc-nivel-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 0; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.06); }
.recalc-nivel-row:last-of-type { border-bottom: none; }
.recalc-nivel-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
.recalc-nivel-label { font-size: 12px; font-weight: 600; font-family: monospace; }
.recalc-nivel-formula { font-size: 11px; color: rgba(var(--v-theme-on-surface),.45); margin-top: 1px; }
.nivel-badge { padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; white-space: nowrap; flex-shrink: 0; }
.nivel-1 { background: rgba(34,197,94,.12);  color: #16a34a; }
.nivel-2 { background: rgba(6,182,212,.12);  color: #0891b2; }
.nivel-3 { background: rgba(139,92,246,.12); color: #7c3aed; }
</style>
