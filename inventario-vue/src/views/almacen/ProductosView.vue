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
              <v-icon size="22">mdi-check-circle-outline</v-icon>
            </div>
          </div>
        </div>
        <div class="prd-kpi-card" style="border-top:3px solid #f59e0b">
          <div class="kpi-top">
            <div>
              <p class="kpi-label">SIN CONTROL</p>
              <p class="kpi-value" style="color:#f59e0b">{{ sinControl }}</p>
            </div>
            <div class="kpi-icon" style="background:#f59e0b18;color:#f59e0b">
              <v-icon size="22">mdi-minus-circle-outline</v-icon>
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
            @input="filtrar"
          />
          <v-icon v-if="search" size="16" style="cursor:pointer;color:rgba(var(--v-theme-on-surface),.4)" @click="search='';filtrar()">mdi-close</v-icon>
        </div>

        <v-select
          v-model="filtroControl"
          :items="[{title:'Todos',value:'TODOS'},{title:'Con Control',value:'SI'},{title:'Sin Control',value:'NO'}]"
          item-title="title"
          item-value="value"
          label="Control"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width:180px"
          @update:model-value="filtrar"
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
          @update:model-value="filtrar"
        />

        <v-btn variant="text" prepend-icon="mdi-refresh" :loading="loading" @click="cargar">
          Actualizar
        </v-btn>
      </div>

      <!-- TABLA -->
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
              <th class="th-grp">GRUPO</th>
              <th class="th-ctrl">CONTROL</th>
              <th class="th-acc">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="productosFiltrados.length === 0">
              <td colspan="6" class="prd-empty">
                <v-icon size="36" style="color:rgba(var(--v-theme-on-surface),.2)">mdi-inbox-outline</v-icon>
                <p style="color:rgba(var(--v-theme-on-surface),.4);margin:8px 0 0">No hay productos</p>
              </td>
            </tr>
            <tr v-for="p in productosFiltrados" :key="p.codigo" class="prd-row">
              <td><span class="badge-cod">{{ p.codigo }}</span></td>
              <td class="td-nom">{{ p.nombre }}</td>
              <td><span class="badge-und">{{ p.und }}</span></td>
              <td class="td-grp">{{ p.grupo_nombre || '—' }}</td>
              <td>
                <v-chip
                  :color="p.control === 'SI' ? 'success' : 'default'"
                  variant="flat"
                  size="small"
                >
                  {{ p.control === 'SI' ? 'SÍ' : 'NO' }}
                </v-chip>
              </td>
              <td class="td-acc">
                <v-btn icon size="x-small" variant="text" color="#0891b2" @click="abrirEditar(p)" title="Editar">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon size="x-small" variant="text" color="error" @click="abrirEliminar(p)" title="Eliminar">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- TOTAL FILTRADO -->
      <div v-if="!loading && productosFiltrados.length > 0" class="prd-total">
        Mostrando {{ productosFiltrados.length }} de {{ productos.length }} productos
      </div>

      <!-- ═══════════════════ DIALOG CREAR / EDITAR ═══════════════════ -->
      <v-dialog v-model="dlgForm" max-width="500" persistent>
        <v-card rounded="lg">
          <v-card-title class="dlg-title">
            <v-icon size="20" class="mr-2" color="#0891b2">{{ editando ? 'mdi-pencil' : 'mdi-plus-circle-outline' }}</v-icon>
            {{ editando ? 'Editar Producto' : 'Nuevo Producto' }}
          </v-card-title>
          <v-divider />

          <v-card-text class="pa-5">
            <v-row dense>
              <!-- CÓDIGO (solo lectura en edición) -->
              <v-col cols="4">
                <v-text-field
                  v-model="form.codigo"
                  label="Código *"
                  variant="outlined"
                  density="compact"
                  :readonly="editando"
                  :bg-color="editando ? 'rgba(var(--v-theme-on-surface),0.04)' : undefined"
                  maxlength="3"
                  hide-details="auto"
                  :error-messages="errores.codigo"
                />
              </v-col>

              <!-- NOMBRE -->
              <v-col cols="8">
                <v-text-field
                  v-model="form.nombre"
                  label="Nombre *"
                  variant="outlined"
                  density="compact"
                  maxlength="60"
                  hide-details="auto"
                  :error-messages="errores.nombre"
                />
              </v-col>

              <!-- UNIDAD -->
              <v-col cols="4">
                <v-text-field
                  v-model="form.und"
                  label="Unidad *"
                  variant="outlined"
                  density="compact"
                  maxlength="10"
                  hide-details="auto"
                  :error-messages="errores.und"
                  placeholder="KG, UND, LT..."
                />
              </v-col>

              <!-- GRUPO -->
              <v-col cols="8">
                <v-select
                  v-model="form.grupo"
                  :items="grupos"
                  item-title="nombre"
                  item-value="codigo"
                  label="Grupo"
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
                  placeholder="Seleccione un grupo..."
                />
              </v-col>

              <!-- CONTROL -->
              <v-col cols="12">
                <v-select
                  v-model="form.control"
                  :items="[{title:'SÍ — Este producto maneja stock',value:'SI'},{title:'NO — Solo referencia, sin stock',value:'NO'}]"
                  item-title="title"
                  item-value="value"
                  label="Control de Inventario *"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
            </v-row>

            <!-- Error general -->
            <v-alert v-if="formError" type="error" variant="tonal" density="compact" class="mt-3">
              {{ formError }}
            </v-alert>
          </v-card-text>

          <v-divider />
          <v-card-actions class="pa-4 gap-2">
            <v-spacer />
            <v-btn variant="text" @click="cerrarDlg" :disabled="guardando">Cancelar</v-btn>
            <v-btn color="#0891b2" variant="elevated" :loading="guardando" @click="guardar">
              {{ editando ? 'Guardar Cambios' : 'Crear Producto' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- ═══════════════════ DIALOG ELIMINAR ═══════════════════ -->
      <v-dialog v-model="dlgEliminar" max-width="400" persistent>
        <v-card rounded="lg">
          <v-card-title class="dlg-title">
            <v-icon size="20" class="mr-2" color="error">mdi-delete-alert</v-icon>
            Eliminar Producto
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-5">
            <p style="font-size:14px">¿Estás seguro de eliminar el producto?</p>
            <div class="elim-info">
              <span class="badge-cod">{{ productoAEliminar?.codigo }}</span>
              <span style="font-weight:600;margin-left:8px">{{ productoAEliminar?.nombre }}</span>
            </div>
            <v-alert type="warning" variant="tonal" density="compact" class="mt-3" icon="mdi-alert">
              Esta acción no se puede deshacer.
            </v-alert>
            <v-alert v-if="elimError" type="error" variant="tonal" density="compact" class="mt-2">
              {{ elimError }}
            </v-alert>
          </v-card-text>
          <v-divider />
          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn variant="text" @click="dlgEliminar=false" :disabled="eliminando">Cancelar</v-btn>
            <v-btn color="error" variant="elevated" :loading="eliminando" @click="confirmarEliminar">
              Sí, Eliminar
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

// ── Estado principal ──────────────────────────────────────────
const productos         = ref([])
const grupos            = ref([])
const loading           = ref(false)
const search            = ref('')
const filtroControl     = ref('TODOS')
const filtroGrupo       = ref('TODOS')

// ── Dialog formulario ─────────────────────────────────────────
const dlgForm   = ref(false)
const editando  = ref(false)
const guardando = ref(false)
const formError = ref('')
const errores   = ref({ codigo: '', nombre: '', und: '' })

const formVacio = () => ({ codigo: '', nombre: '', und: '', grupo: null, control: 'NO' })
const form = ref(formVacio())

// ── Dialog eliminar ───────────────────────────────────────────
const dlgEliminar       = ref(false)
const eliminando        = ref(false)
const elimError         = ref('')
const productoAEliminar = ref(null)

// ── Computed ──────────────────────────────────────────────────
const conControl = computed(() => productos.value.filter(p => p.control === 'SI').length)
const sinControl = computed(() => productos.value.filter(p => p.control !== 'SI').length)

const productosFiltrados = computed(() => {
  let lista = productos.value
  const q = search.value.trim().toUpperCase()
  if (q) lista = lista.filter(p => p.nombre.toUpperCase().includes(q) || p.codigo.includes(q))
  if (filtroControl.value !== 'TODOS') lista = lista.filter(p => p.control === filtroControl.value)
  if (filtroGrupo.value !== 'TODOS')   lista = lista.filter(p => p.grupo === filtroGrupo.value)
  return lista
})

// ── Métodos ───────────────────────────────────────────────────
function filtrar() { /* reactivo via computed */ }

async function cargar() {
  loading.value = true
  try {
    const [resP, resG] = await Promise.all([
      productosAlmacenService.getProductos(),
      productosAlmacenService.getGrupos(),
    ])
    productos.value = resP.data  || []
    grupos.value    = resG.data  || []
  } catch (e) {
    console.error('Error cargando productos:', e)
  } finally {
    loading.value = false
  }
}

async function abrirCrear() {
  editando.value  = false
  formError.value = ''
  errores.value   = { codigo: '', nombre: '', und: '' }
  form.value      = formVacio()
  // Cargar próximo código
  try {
    const res = await productosAlmacenService.getProximoCodigo()
    form.value.codigo = res.codigo || ''
  } catch {}
  dlgForm.value = true
}

function abrirEditar(p) {
  editando.value  = true
  formError.value = ''
  errores.value   = { codigo: '', nombre: '', und: '' }
  form.value = {
    codigo:  p.codigo,
    nombre:  p.nombre,
    und:     p.und,
    grupo:   p.grupo || null,
    control: p.control || 'NO',
  }
  dlgForm.value = true
}

function cerrarDlg() {
  dlgForm.value   = false
  formError.value = ''
}

function validar() {
  errores.value = { codigo: '', nombre: '', und: '' }
  let ok = true
  if (!form.value.codigo.trim()) { errores.value.codigo = 'Requerido'; ok = false }
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
      codigo:  form.value.codigo.trim().padStart(3, '0'),
      nombre:  form.value.nombre.trim(),
      und:     form.value.und.trim(),
      grupo:   form.value.grupo || null,
      control: form.value.control || 'NO',
    }
    if (editando.value) {
      const res = await productosAlmacenService.actualizarProducto(payload.codigo, payload)
      const idx = productos.value.findIndex(p => p.codigo === payload.codigo)
      if (idx !== -1) productos.value[idx] = res.data
    } else {
      const res = await productosAlmacenService.crearProducto(payload)
      productos.value.unshift(res.data)
    }
    dlgForm.value = false
  } catch (e) {
    formError.value = e?.response?.data?.error || e.message || 'Error al guardar'
  } finally {
    guardando.value = false
  }
}

function abrirEliminar(p) {
  productoAEliminar.value = p
  elimError.value         = ''
  dlgEliminar.value       = true
}

async function confirmarEliminar() {
  eliminando.value = true
  elimError.value  = ''
  try {
    await productosAlmacenService.eliminarProducto(productoAEliminar.value.codigo)
    productos.value  = productos.value.filter(p => p.codigo !== productoAEliminar.value.codigo)
    dlgEliminar.value = false
  } catch (e) {
    elimError.value = e?.response?.data?.error || e.message || 'Error al eliminar'
  } finally {
    eliminando.value = false
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
.prd-header       { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.prd-header-left  { display: flex; align-items: center; gap: 16px; }
.prd-icon-wrap    { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#06b6d4,#0891b2); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(6,182,212,.35); flex-shrink: 0; }
.prd-title        { font-size: 20px; font-weight: 800; letter-spacing: .5px; margin: 0; }
.prd-sub          { font-size: 13px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }

/* KPIs */
.prd-kpis     { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
.prd-kpi-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 12px; padding: 18px 20px; }
.kpi-top      { display: flex; justify-content: space-between; align-items: flex-start; }
.kpi-label    { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.5); margin: 0 0 6px; }
.kpi-value    { font-size: 28px; font-weight: 800; margin: 0; line-height: 1; }
.kpi-icon     { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

/* Filtros */
.prd-filtros  { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
.prd-search   { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: rgba(var(--v-theme-on-surface),.03); border-radius: 8px; border: 1px solid rgba(var(--v-theme-on-surface),.08); flex: 1; min-width: 260px; }
.prd-search-input { flex: 1; border: none; background: transparent; outline: none; font-size: 14px; color: rgb(var(--v-theme-on-surface)); }
.prd-search-input::placeholder { color: rgba(var(--v-theme-on-surface),.4); }

/* Tabla */
.prd-tabla-wrap { background: rgb(var(--v-theme-surface)); border-radius: 12px; border: 1px solid rgba(var(--v-theme-on-surface),.08); overflow: hidden; }
.prd-loading    { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; }
.prd-table      { width: 100%; border-collapse: collapse; font-size: 13px; }
.prd-table thead { background: rgba(var(--v-theme-on-surface),.04); }
.prd-table thead th { padding: 12px 14px; text-align: left; font-weight: 700; font-size: 11px; letter-spacing: .5px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.6); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); }
.prd-table tbody tr { border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); }
.prd-table tbody tr:hover { background: rgba(var(--v-theme-on-surface),.02); }
.prd-table tbody td { padding: 11px 14px; }

.th-cod  { width: 90px; }
.th-nom  { }
.th-und  { width: 90px; }
.th-grp  { width: 200px; }
.th-ctrl { width: 100px; }
.th-acc  { width: 100px; text-align: center; }
.td-nom  { font-weight: 500; }
.td-grp  { color: rgba(var(--v-theme-on-surface),.7); }
.td-acc  { text-align: center; }

.badge-cod { background: rgba(6,182,212,.15); color: #0891b2; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 12px; font-family: monospace; }
.badge-und { background: rgba(139,92,246,.12); color: #8b5cf6; padding: 2px 7px; border-radius: 5px; font-size: 12px; font-weight: 600; }

.prd-empty { text-align: center !important; padding: 50px 20px !important; }

/* Total */
.prd-total { margin-top: 12px; font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); text-align: right; padding-right: 4px; }

/* Dialogs */
.dlg-title  { font-size: 16px; font-weight: 700; padding: 16px 20px; display: flex; align-items: center; }
.elim-info  { margin-top: 12px; padding: 12px 16px; background: rgba(var(--v-theme-on-surface),.04); border-radius: 8px; display: flex; align-items: center; }
.gap-2      { gap: 8px; }
</style>
