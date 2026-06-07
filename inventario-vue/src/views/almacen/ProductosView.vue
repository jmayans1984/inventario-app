<template>
  <MainLayout>
    <div class="prd-container">

      <!-- BREADCRUMB -->
      <div class="prd-breadcrumb">
        <span class="bc-root">ALMACÉN</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Configuración</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Productos</span>
      </div>

      <!-- HEADER -->
      <div class="prd-header">
        <div class="prd-header-left">
          <div class="prd-icon-wrap">
            <v-icon size="22" color="white">mdi-package-variant</v-icon>
          </div>
          <div>
            <h1 class="prd-title">GESTIÓN DE PRODUCTOS</h1>
            <p class="prd-sub">Catálogo de productos de inventario</p>
          </div>
        </div>
        <v-btn color="#0891b2" variant="elevated" prepend-icon="mdi-plus" @click="abrirCrear">
          Nuevo Producto
        </v-btn>
      </div>

      <!-- KPI CARDS -->
      <div class="prd-kpis">
        <div class="prd-kpi-card" style="border-top:3px solid #0891b2">
          <div class="kpi-top">
            <div>
              <p class="kpi-label">TOTAL PRODUCTOS</p>
              <p class="kpi-value" style="color:#0891b2">{{ productos.length }}</p>
            </div>
            <div class="kpi-icon" style="background:#0891b218;color:#0891b2">
              <v-icon size="22">mdi-package-variant</v-icon>
            </div>
          </div>
        </div>
        <div class="prd-kpi-card" style="border-top:3px solid #10b981">
          <div class="kpi-top">
            <div>
              <p class="kpi-label">CON CONTROL</p>
              <p class="kpi-value" style="color:#10b981">{{ conControl }}</p>
            </div>
            <div class="kpi-icon" style="background:#10b98118;color:#10b981">
              <v-icon size="22">mdi-eye-outline</v-icon>
            </div>
          </div>
        </div>
        <div class="prd-kpi-card" style="border-top:3px solid #94a3b8">
          <div class="kpi-top">
            <div>
              <p class="kpi-label">SIN CONTROL</p>
              <p class="kpi-value" style="color:#94a3b8">{{ sinControl }}</p>
            </div>
            <div class="kpi-icon" style="background:#94a3b818;color:#94a3b8">
              <v-icon size="22">mdi-eye-off-outline</v-icon>
            </div>
          </div>
        </div>
        <div class="prd-kpi-card" style="border-top:3px solid #8b5cf6">
          <div class="kpi-top">
            <div>
              <p class="kpi-label">GRUPOS</p>
              <p class="kpi-value" style="color:#8b5cf6">{{ grupos.length }}</p>
            </div>
            <div class="kpi-icon" style="background:#8b5cf618;color:#8b5cf6">
              <v-icon size="22">mdi-folder-multiple-outline</v-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- FILTROS -->
      <div class="prd-filtros">
        <div class="prd-search">
          <v-icon size="18" style="color:rgba(var(--v-theme-on-surface),.4)">mdi-magnify</v-icon>
          <input
            v-model="search"
            type="text"
            placeholder="Buscar por código o nombre..."
            class="prd-search-input"
          />
          <v-icon v-if="search" size="16" style="cursor:pointer;color:rgba(var(--v-theme-on-surface),.4)" @click="search=''">mdi-close</v-icon>
        </div>

        <v-select
          v-model="filtroControl"
          :items="[{title:'Todos',value:'TODOS'},{title:'Con Control (SI)',value:'SI'},{title:'Sin Control (NO)',value:'NO'}]"
          item-title="title"
          item-value="value"
          label="Control"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width:200px"
        />

        <v-select
          v-model="filtroGrupo"
          :items="[{codigo:'TODOS',nombre:'Todos los grupos'},...grupos]"
          item-title="nombre"
          item-value="codigo"
          label="Grupo"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width:220px"
        />

        <v-btn variant="text" prepend-icon="mdi-refresh" :loading="loading" @click="cargar">
          Actualizar
        </v-btn>
      </div>

      <!-- TABLA AGRUPADA -->
      <div class="prd-tabla-wrap">
        <div v-if="loading" class="prd-loading">
          <v-progress-circular indeterminate color="#0891b2" size="36" />
          <p class="mt-3" style="color:rgba(var(--v-theme-on-surface),.5)">Cargando productos...</p>
        </div>

        <table v-else class="prd-table">
          <thead>
            <tr>
              <th class="th-cod">CÓDIGO</th>
              <th class="th-nom">NOMBRE</th>
              <th class="th-und">UNIDAD</th>
              <th class="th-ctrl">CONTROL</th>
              <th class="th-venta">FRANQUICIA</th>
              <th class="th-acc">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="productosAgrupados.length === 0">
              <tr>
                <td colspan="6" class="prd-empty">
                  <v-icon size="36" style="color:rgba(var(--v-theme-on-surface),.2)">mdi-inbox-outline</v-icon>
                  <p style="color:rgba(var(--v-theme-on-surface),.4);margin:8px 0 0">No hay productos</p>
                </td>
              </tr>
            </template>

            <template v-for="grupo in productosAgrupados" :key="grupo.key">
              <!-- FILA DE GRUPO -->
              <tr class="grupo-header-row">
                <td colspan="6" class="grupo-header-cell">
                  <v-icon size="15" class="mr-1" style="color:#8b5cf6">mdi-folder-outline</v-icon>
                  <span class="grupo-header-name">{{ grupo.nombre }}</span>
                  <span class="grupo-header-count">{{ grupo.items.length }} producto{{ grupo.items.length !== 1 ? 's' : '' }}</span>
                </td>
              </tr>
              <!-- FILAS DE PRODUCTOS DEL GRUPO -->
              <tr v-for="p in grupo.items" :key="p.codigo" class="prd-row">
                <td><span class="badge-cod">{{ p.codigo }}</span></td>
                <td class="td-nom">{{ p.nombre }}</td>
                <td><span class="badge-und">{{ p.und }}</span></td>
                <td>
                  <v-chip
                    :color="p.control === 'SI' ? 'success' : 'default'"
                    variant="flat"
                    size="small"
                  >
                    {{ p.control === 'SI' ? 'SÍ' : 'NO' }}
                  </v-chip>
                </td>
                <td>
                  <v-chip
                    :color="p.para_venta === 'SI' ? 'info' : 'default'"
                    variant="flat"
                    size="small"
                  >
                    {{ p.para_venta === 'SI' ? 'SÍ' : 'NO' }}
                  </v-chip>
                </td>
                <td class="td-acc">
                  <div class="acc-btns">
                    <!-- Toggle control con ojito -->
                    <v-btn
                      icon
                      size="x-small"
                      variant="text"
                      :color="p.control === 'SI' ? '#10b981' : '#94a3b8'"
                      :title="p.control === 'SI' ? 'Deshabilitar control' : 'Habilitar control'"
                      :loading="toggling === p.codigo"
                      @click="toggleControl(p)"
                    >
                      <v-icon>{{ p.control === 'SI' ? 'mdi-eye-outline' : 'mdi-eye-off-outline' }}</v-icon>
                    </v-btn>
                    <!-- Toggle para_venta (franquicia) -->
                    <v-btn
                      icon
                      size="x-small"
                      variant="text"
                      :color="p.para_venta === 'SI' ? '#06b6d4' : '#cbd5e1'"
                      :title="p.para_venta === 'SI' ? 'No vender a franquicia' : 'Vender a franquicia'"
                      :loading="toggling === `${p.codigo}-venta`"
                      @click="toggleParaVenta(p)"
                    >
                      <v-icon>{{ p.para_venta === 'SI' ? 'mdi-store-outline' : 'mdi-store-off-outline' }}</v-icon>
                    </v-btn>
                    <!-- Editar -->
                    <v-btn
                      icon
                      size="x-small"
                      variant="text"
                      color="#0891b2"
                      title="Editar"
                      @click="abrirEditar(p)"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- TOTAL -->
      <div v-if="!loading && productosFiltrados.length > 0" class="prd-total">
        Mostrando {{ productosFiltrados.length }} de {{ productos.length }} productos
      </div>

      <!-- ═══════════════════ DIALOG CREAR / EDITAR ═══════════════════ -->
      <v-dialog v-model="dlgForm" max-width="700" persistent>
        <v-card rounded="lg" class="dlg-card">
          <!-- HEADER -->
          <div class="dlg-header">
            <div class="dlg-header-left">
              <div class="dlg-header-icon">
                <v-icon size="24" color="white">{{ editando ? 'mdi-pencil-outline' : 'mdi-package-plus-outline' }}</v-icon>
              </div>
              <div>
                <div class="dlg-header-title">{{ editando ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO' }}</div>
                <div class="dlg-header-sub">{{ editando ? 'Código: ' + form.codigo : 'Crear nuevo artículo' }}</div>
              </div>
            </div>
            <v-btn icon="mdi-close" size="small" variant="text" @click="cerrarDlg" :disabled="guardando" />
          </div>

          <!-- CONTENT -->
          <v-card-text class="pa-6">
            <!-- SECCIÓN 1: INFORMACIÓN BÁSICA -->
            <v-sheet class="dlg-sheet">
              <div class="sheet-header">
                <v-icon size="20" color="#0891b2">mdi-information-outline</v-icon>
                <span class="sheet-title">Información Básica</span>
              </div>
              <v-divider class="my-3" />

              <v-row dense>
                <v-col cols="3">
                  <div class="field-label">Código</div>
                  <div class="field-value">{{ editando ? form.codigo : 'AUTO' }}</div>
                </v-col>
                <v-col cols="9">
                  <v-text-field
                    v-model="form.nombre"
                    label="Nombre del Producto *"
                    variant="outlined"
                    density="compact"
                    maxlength="60"
                    hide-details="auto"
                    :error-messages="errores.nombre"
                    autofocus
                  />
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="form.und"
                    label="Unidad de Medida *"
                    variant="outlined"
                    density="compact"
                    maxlength="10"
                    hide-details="auto"
                    :error-messages="errores.und"
                    placeholder="KG, UND, LT"
                  />
                </v-col>
                <v-col cols="6">
                  <v-select
                    v-model="form.grupo"
                    :items="grupos"
                    item-title="nombre"
                    item-value="codigo"
                    label="Grupo (Opcional)"
                    variant="outlined"
                    density="compact"
                    hide-details
                    clearable
                  />
                </v-col>
              </v-row>
            </v-sheet>

            <!-- SECCIÓN 2: CONFIGURACIÓN -->
            <v-sheet class="dlg-sheet mt-5">
              <div class="sheet-header">
                <v-icon size="20" color="#10b981">mdi-tune-outline</v-icon>
                <span class="sheet-title">Configuración</span>
              </div>
              <v-divider class="my-3" />

              <v-row dense>
                <!-- Control -->
                <v-col cols="12" md="6">
                  <div class="config-box">
                    <div class="config-label">
                      <v-icon size="18" color="#10b981">mdi-eye-outline</v-icon>
                      Control de Inventario
                    </div>
                    <v-select
                      v-model="form.control"
                      :items="[{title: 'SI (Controlar)', value: 'SI'}, {title: 'NO (No controlar)', value: 'NO'}]"
                      item-title="title"
                      item-value="value"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                    <div class="config-hint">Rastrear cantidad en almacén</div>
                  </div>
                </v-col>

                <!-- Franquicia -->
                <v-col cols="12" md="6">
                  <div class="config-box">
                    <div class="config-label">
                      <v-icon size="18" color="#06b6d4">mdi-store-outline</v-icon>
                      Vender a Franquiciados
                    </div>
                    <v-select
                      v-model="form.para_venta"
                      :items="[{title: 'SI (Vender)', value: 'SI'}, {title: 'NO (No vender)', value: 'NO'}]"
                      item-title="title"
                      item-value="value"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                    <div class="config-hint">Disponible para franquiciados</div>
                  </div>
                </v-col>
              </v-row>
            </v-sheet>

            <!-- SECCIÓN 3: COSTOS -->
            <v-sheet class="dlg-sheet mt-5">
              <div class="sheet-header">
                <v-icon size="20" color="#f59e0b">mdi-currency-usd</v-icon>
                <span class="sheet-title">Costos</span>
              </div>
              <v-divider class="my-3" />

              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="form.precio_costo"
                    label="Precio de Costo"
                    variant="outlined"
                    density="compact"
                    type="number"
                    step="0.01"
                    prefix="$"
                    hide-details
                  />
                </v-col>
                <v-col cols="12">
                  <div class="precio-hint mt-2">
                    <v-icon size="16">mdi-information-outline</v-icon>
                    <span>Los precios de venta se calculan automáticamente con los márgenes configurados</span>
                  </div>
                </v-col>
              </v-row>
            </v-sheet>

            <!-- ERRORES -->
            <v-alert v-if="formError" type="error" variant="tonal" density="compact" class="mt-5">
              {{ formError }}
            </v-alert>
          </v-card-text>

          <!-- FOOTER -->
          <v-divider />
          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn variant="text" @click="cerrarDlg" :disabled="guardando">Cancelar</v-btn>
            <v-btn color="#0891b2" variant="elevated" size="large" :loading="guardando" @click="guardar">
              {{ editando ? 'Guardar Cambios' : 'Crear Producto' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { productosAlmacenService } from '../../services/productos-almacen.service'

// ── Estado ────────────────────────────────────────────────────
const productos     = ref([])
const grupos        = ref([])
const loading       = ref(false)
const toggling      = ref(null)   // codigo del producto que está toggling
const search        = ref('')
const filtroControl = ref('TODOS')
const filtroGrupo   = ref('TODOS')

// ── Dialog formulario ─────────────────────────────────────────
const dlgForm   = ref(false)
const dlgTab    = ref('basico')
const editando  = ref(false)
const guardando = ref(false)
const formError = ref('')
const errores   = ref({ nombre: '', und: '' })
const form      = ref({
  codigo: '',
  nombre: '',
  und: '',
  grupo: null,
  control: 'SI',
  para_venta: 'NO',
  precio_costo: 0
})

// ── Computed ──────────────────────────────────────────────────
const conControl = computed(() => productos.value.filter(p => p.control === 'SI').length)
const sinControl = computed(() => productos.value.filter(p => p.control !== 'SI').length)

const productosFiltrados = computed(() => {
  let lista = productos.value
  const q = search.value.trim().toUpperCase()
  if (q) lista = lista.filter(p =>
    p.nombre.toUpperCase().includes(q) || p.codigo.includes(q)
  )
  if (filtroControl.value !== 'TODOS')
    lista = lista.filter(p => p.control === filtroControl.value)
  if (filtroGrupo.value !== 'TODOS')
    lista = lista.filter(p => p.grupo === filtroGrupo.value)
  return lista
})

// Agrupados por grupo, manteniendo el orden que devuelve el backend (por g.codigo)
const productosAgrupados = computed(() => {
  const mapa = new Map()   // mantiene orden de inserción = orden del backend

  for (const p of productosFiltrados.value) {
    const key    = p.grupo || '__sin_grupo__'
    const nombre = p.grupo_nombre || 'Sin Grupo'
    if (!mapa.has(key)) mapa.set(key, { key, nombre, items: [] })
    mapa.get(key).items.push(p)
  }

  return Array.from(mapa.values())
})

// ── Métodos ───────────────────────────────────────────────────
async function cargar() {
  loading.value = true
  try {
    const [resP, resG] = await Promise.all([
      productosAlmacenService.getProductos(),
      productosAlmacenService.getGrupos(),
    ])
    productos.value = resP.data || []
    grupos.value    = resG.data || []
  } catch (e) {
    console.error('Error cargando productos:', e)
  } finally {
    loading.value = false
  }
}

async function abrirCrear() {
  editando.value  = false
  formError.value = ''
  errores.value   = { nombre: '', und: '' }
  form.value      = {
    codigo: '',
    nombre: '',
    und: '',
    grupo: null,
    control: 'SI',
    para_venta: 'NO',
    precio_costo: 0
  }
  // Obtener próximo código internamente (no se muestra, solo para el POST)
  try {
    const res = await productosAlmacenService.getProximoCodigo()
    form.value.codigo = res.codigo || ''
  } catch {}
  dlgForm.value = true
}

function abrirEditar(p) {
  editando.value  = true
  formError.value = ''
  errores.value   = { nombre: '', und: '' }
  form.value = {
    codigo:  p.codigo,
    nombre:  p.nombre,
    und:     p.und,
    grupo:   p.grupo || null,
    control: p.control || 'NO',
    para_venta: p.para_venta || 'NO',
    precio_costo: p.precio_costo || 0,
  }
  dlgForm.value = true
}

function cerrarDlg() {
  dlgForm.value   = false
  formError.value = ''
}

function validar() {
  errores.value = { nombre: '', und: '' }
  let ok = true
  if (!form.value.nombre.trim()) { errores.value.nombre = 'Requerido'; ok = false }
  if (!form.value.und.trim())    { errores.value.und    = 'Requerido'; ok = false }
  return ok
}

async function guardar() {
  if (!validar()) return
  guardando.value = true
  formError.value = ''
  try {
    const payload = {
      codigo:  form.value.codigo,
      nombre:  form.value.nombre.trim(),
      und:     form.value.und.trim(),
      grupo:   form.value.grupo || null,
      control: form.value.control || 'NO',
      para_venta: form.value.para_venta || 'NO',
      precio_costo: parseFloat(form.value.precio_costo) || 0,
    }
    if (editando.value) {
      const res = await productosAlmacenService.actualizarProducto(payload.codigo, payload)
      const idx = productos.value.findIndex(p => p.codigo === payload.codigo)
      if (idx !== -1) productos.value[idx] = res.data
    } else {
      const res = await productosAlmacenService.crearProducto(payload)
      productos.value.push(res.data)
    }
    dlgForm.value = false
  } catch (e) {
    formError.value = e?.response?.data?.error || e.message || 'Error al guardar'
  } finally {
    guardando.value = false
  }
}

async function toggleControl(p) {
  toggling.value = p.codigo
  const anterior = p.control
  // Optimistic update
  p.control = p.control === 'SI' ? 'NO' : 'SI'
  try {
    const res = await productosAlmacenService.toggleControl(p.codigo)
    p.control = res.control
  } catch {
    // Revertir si falla
    p.control = anterior
  } finally {
    toggling.value = null
  }
}

async function toggleParaVenta(p) {
  toggling.value = `${p.codigo}-venta`
  const anterior = p.para_venta
  // Optimistic update
  p.para_venta = p.para_venta === 'SI' ? 'NO' : 'SI'
  try {
    const res = await productosAlmacenService.toggleParaVenta(p.codigo)
    p.para_venta = res.para_venta
  } catch {
    // Revertir si falla
    p.para_venta = anterior
  } finally {
    toggling.value = null
  }
}

onMounted(cargar)
</script>

<style scoped>
.prd-container { padding: 24px; max-width: 1200px; margin: 0 auto; }

/* Breadcrumb */
.prd-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root    { font-size: 12px; font-weight: 700; color: #06b6d4; text-transform: uppercase; letter-spacing: .5px; }
.bc-sep     { color: rgba(var(--v-theme-on-surface),.3); }
.bc-cat     { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface),.8); font-weight: 500; }

/* Header */
.prd-header      { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.prd-header-left { display: flex; align-items: center; gap: 16px; }
.prd-icon-wrap   { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#06b6d4,#0891b2); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(6,182,212,.35); flex-shrink: 0; }
.prd-title       { font-size: 20px; font-weight: 800; letter-spacing: .5px; margin: 0; }
.prd-sub         { font-size: 13px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }

/* KPIs */
.prd-kpis     { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
.prd-kpi-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 12px; padding: 18px 20px; }
.kpi-top      { display: flex; justify-content: space-between; align-items: flex-start; }
.kpi-label    { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.5); margin: 0 0 6px; }
.kpi-value    { font-size: 28px; font-weight: 800; margin: 0; line-height: 1; }
.kpi-icon     { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

/* Filtros */
.prd-filtros      { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
.prd-search       { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: rgba(var(--v-theme-on-surface),.03); border-radius: 8px; border: 1px solid rgba(var(--v-theme-on-surface),.08); flex: 1; min-width: 260px; }
.prd-search-input { flex: 1; border: none; background: transparent; outline: none; font-size: 14px; color: rgb(var(--v-theme-on-surface)); }
.prd-search-input::placeholder { color: rgba(var(--v-theme-on-surface),.4); }

/* Tabla */
.prd-tabla-wrap { background: rgb(var(--v-theme-surface)); border-radius: 12px; border: 1px solid rgba(var(--v-theme-on-surface),.08); overflow: hidden; }
.prd-loading    { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; }

.prd-table      { width: 100%; border-collapse: collapse; font-size: 13px; }
.prd-table thead { background: rgba(var(--v-theme-on-surface),.04); }
.prd-table thead th { padding: 12px 14px; text-align: left; font-weight: 700; font-size: 11px; letter-spacing: .5px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.6); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); }

/* Fila de encabezado de grupo */
.grupo-header-row  { background: rgba(139,92,246,.06); }
.grupo-header-cell { padding: 8px 14px !important; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.06) !important; }
.grupo-header-name { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #8b5cf6; }
.grupo-header-count{ font-size: 11px; color: rgba(var(--v-theme-on-surface),.4); margin-left: 10px; }

/* Filas de producto */
.prd-row { border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); }
.prd-row:hover { background: rgba(var(--v-theme-on-surface),.02); }
.prd-table tbody td { padding: 10px 14px; }

.th-cod  { width: 90px; }
.th-nom  { }
.th-und  { width: 90px; }
.th-ctrl { width: 100px; }
.th-acc  { width: 80px; text-align: center; }
.td-nom  { font-weight: 500; }
.td-acc  { text-align: center; white-space: nowrap; }
.acc-btns { display: inline-flex; align-items: center; gap: 2px; }

.badge-cod { background: rgba(6,182,212,.15); color: #0891b2; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 12px; font-family: monospace; }
.badge-und { background: rgba(139,92,246,.12); color: #8b5cf6; padding: 2px 7px; border-radius: 5px; font-size: 12px; font-weight: 600; }

.prd-empty { text-align: center !important; padding: 50px 20px !important; }
.prd-total { margin-top: 12px; font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); text-align: right; padding-right: 4px; }

/* Dialog */
.dlg-card {
  overflow: visible !important;
}

.dlg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #0891b2, #06b6d4);
}

.dlg-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.dlg-header-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(255,255,255,.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dlg-header-title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: white;
}

.dlg-header-sub {
  font-size: 12px;
  color: rgba(255,255,255,.8);
  margin-top: 3px;
}

/* Sheets */
.dlg-sheet {
  padding: 16px;
  background: rgba(var(--v-theme-on-surface),.02);
  border: 1px solid rgba(var(--v-theme-on-surface),.08);
  border-radius: 10px;
}

.sheet-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.sheet-title {
  font-size: 14px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface),.9);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.field-label {
  font-size: 10px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface),.5);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 6px;
}

.field-value {
  font-size: 15px;
  font-weight: 700;
  color: #0891b2;
  font-family: 'Courier New', monospace;
  padding: 8px 10px;
  background: rgba(8,145,178,.12);
  border-radius: 6px;
}

.config-box {
  padding: 12px;
  background: rgba(var(--v-theme-on-surface),.05);
  border-radius: 8px;
  border-left: 3px solid rgba(var(--v-theme-on-surface),.2);
}

.config-label {
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(var(--v-theme-on-surface),.8);
}

.config-hint {
  font-size: 10px;
  color: rgba(var(--v-theme-on-surface),.5);
  margin-top: 6px;
  font-style: italic;
}

.precio-hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  color: rgba(245,158,11,.8);
  padding: 10px;
  background: rgba(245,158,11,.08);
  border-radius: 8px;
  border-left: 3px solid rgba(245,158,11,.4);
}

.th-venta { width: 110px; text-align: center; }
</style>
