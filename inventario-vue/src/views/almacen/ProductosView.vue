<template>
  <MainLayout>
    <div class="prd-container">

      <PageHeader
        title="Gestión de Productos"
        description="Catálogo de productos de inventario"
        :crumbs="['Almacén', 'Configuración', 'Productos']"
      >
        <template #actions>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="abrirCrear">
            Nuevo Producto
          </v-btn>
        </template>
      </PageHeader>

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
              <p class="kpi-label">BODEGA MAESTRA</p>
              <p class="kpi-value" style="color:#10b981">{{ conControl }}</p>
            </div>
            <div class="kpi-icon" style="background:#10b98118;color:#10b981">
              <v-icon size="22">mdi-warehouse</v-icon>
            </div>
          </div>
        </div>
        <div class="prd-kpi-card" style="border-top:3px solid #f59e0b">
          <div class="kpi-top">
            <div>
              <p class="kpi-label">PUNTO DE VENTA</p>
              <p class="kpi-value" style="color:#f59e0b">{{ conPuntoVenta }}</p>
            </div>
            <div class="kpi-icon" style="background:#f59e0b18;color:#f59e0b">
              <v-icon size="22">mdi-store-outline</v-icon>
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
          <v-progress-circular indeterminate color="primary" size="36" />
          <p class="mt-3" style="color:rgba(var(--v-theme-on-surface),.5)">Cargando productos...</p>
        </div>

        <table v-else class="prd-table">
          <thead>
            <tr>
              <th class="th-cod">CÓDIGO</th>
              <th class="th-nom">NOMBRE</th>
              <th class="th-desc">DESCRIPCIÓN</th>
              <th class="th-und">UNIDAD</th>
              <th class="th-ctrl" title="Visible en Bodega Maestra (Kardex y Control de Inventario)">BODEGA MAESTRA</th>
              <th class="th-venta" title="Visible en Puntos de Venta (bodegas distintas a la maestra)">PUNTO DE VENTA</th>
              <th class="th-venta" title="Disponible para empresas franquiciadas">FRANQUICIA</th>
              <th class="th-acc">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="productosAgrupados.length === 0">
              <tr>
                <td colspan="8" class="prd-empty">
                  <v-icon size="36" style="color:rgba(var(--v-theme-on-surface),.2)">mdi-inbox-outline</v-icon>
                  <p style="color:rgba(var(--v-theme-on-surface),.4);margin:8px 0 0">No hay productos</p>
                </td>
              </tr>
            </template>

            <template v-for="grupo in productosAgrupados" :key="grupo.key">
              <!-- FILA DE GRUPO -->
              <tr class="grupo-header-row">
                <td colspan="8" class="grupo-header-cell">
                  <v-icon size="15" class="mr-1" style="color:#8b5cf6">mdi-folder-outline</v-icon>
                  <span class="grupo-header-name">{{ grupo.nombre }}</span>
                  <span class="grupo-header-count">{{ grupo.items.length }} producto{{ grupo.items.length !== 1 ? 's' : '' }}</span>
                </td>
              </tr>
              <!-- FILAS DE PRODUCTOS DEL GRUPO -->
              <tr v-for="p in grupo.items" :key="p.codigo" class="prd-row">
                <td><span class="badge-cod">{{ p.codigo }}</span></td>
                <td class="td-nom">{{ p.nombre }}</td>
                <td class="td-desc">
                  <span v-if="p.descripcion" class="desc-text" :title="p.descripcion">{{ p.descripcion }}</span>
                  <span v-else class="desc-empty">—</span>
                </td>
                <td><span class="badge-und">{{ p.und }}</span></td>
                <!-- Chip Bodega Maestra -->
                <td>
                  <v-chip
                    :color="p.control === 'SI' ? 'success' : 'default'"
                    variant="flat"
                    size="small"
                  >
                    {{ p.control === 'SI' ? 'SÍ' : 'NO' }}
                  </v-chip>
                </td>
                <!-- Chip Punto de Venta -->
                <td>
                  <v-chip
                    :color="p.visible_operacional === 'SI' ? 'warning' : 'default'"
                    variant="flat"
                    size="small"
                  >
                    {{ p.visible_operacional === 'SI' ? 'SÍ' : 'NO' }}
                  </v-chip>
                </td>
                <!-- Chip Franquicia -->
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
                    <!-- Toggle Bodega Maestra (verde) -->
                    <v-btn
                      icon
                      size="x-small"
                      variant="text"
                      :color="p.control === 'SI' ? '#10b981' : '#9ca3af'"
                      :title="p.control === 'SI' ? 'Quitar de Bodega Maestra' : 'Activar en Bodega Maestra'"
                      :loading="toggling === p.codigo"
                      @click="toggleControl(p)"
                    >
                      <v-icon>{{ p.control === 'SI' ? 'mdi-warehouse' : 'mdi-warehouse' }}</v-icon>
                    </v-btn>
                    <!-- Toggle Punto de Venta (amarillo) — INDEPENDIENTE -->
                    <v-btn
                      icon
                      size="x-small"
                      variant="text"
                      :color="p.visible_operacional === 'SI' ? '#f59e0b' : '#9ca3af'"
                      :title="p.visible_operacional === 'SI' ? 'Quitar de Puntos de Venta' : 'Activar en Puntos de Venta'"
                      :loading="toggling === `${p.codigo}-operacional`"
                      @click="toggleVisibleOperacional(p)"
                    >
                      <v-icon>{{ p.visible_operacional === 'SI' ? 'mdi-store' : 'mdi-store-off' }}</v-icon>
                    </v-btn>
                    <!-- Toggle Franquicia (azul) — INDEPENDIENTE -->
                    <v-btn
                      icon
                      size="x-small"
                      variant="text"
                      :color="p.para_venta === 'SI' ? '#06b6d4' : '#9ca3af'"
                      :title="p.para_venta === 'SI' ? 'Quitar de Franquicia' : 'Activar en Franquicia'"
                      :loading="toggling === `${p.codigo}-venta`"
                      @click="toggleParaVenta(p)"
                    >
                      <v-icon>{{ p.para_venta === 'SI' ? 'mdi-shopping-outline' : 'mdi-shopping-outline' }}</v-icon>
                    </v-btn>
                    <!-- Códigos de Barra -->
                    <v-btn
                      icon
                      size="x-small"
                      variant="text"
                      color="primary"
                      title="Códigos de Barra"
                      @click="abrirBarcodes(p)"
                    >
                      <v-icon>mdi-barcode-scan</v-icon>
                    </v-btn>
                    <!-- Editar -->
                    <v-btn
                      icon
                      size="x-small"
                      variant="text"
                      color="primary"
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
      <v-dialog v-model="dlgForm" max-width="700">
        <v-card rounded="lg" class="dlg-card">
          <!-- HEADER -->
          <div class="dlg-header">
            <div class="dlg-header-left">
              <div class="dlg-header-icon">
                <v-icon size="28" color="white">{{ editando ? 'mdi-pencil-outline' : 'mdi-package-plus-outline' }}</v-icon>
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
                <v-icon size="20" color="primary">mdi-information-outline</v-icon>
                <span class="sheet-title">Información Básica</span>
              </div>
              <v-divider class="my-3" />

              <v-row dense>
                <v-col cols="12" sm="3">
                  <v-text-field
                    :model-value="editando ? form.codigo : 'AUTO'"
                    label="Código"
                    variant="outlined"
                    density="compact"
                    readonly
                    hide-details
                  />
                </v-col>
                <v-col cols="12" sm="9">
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
                <v-col cols="12">
                  <v-text-field
                    :model-value="form.descripcion"
                    @update:model-value="v => form.descripcion = v ? v.toUpperCase() : ''"
                    label="Descripción (Opcional)"
                    variant="outlined"
                    density="compact"
                    hide-details
                    placeholder="BOLSA X 3700 GRMS..."
                    style="text-transform: uppercase;"
                  />
                </v-col>
              </v-row>
            </v-sheet>

            <!-- SECCIÓN 2: CONFIGURACIÓN -->
            <v-sheet class="dlg-sheet mt-5">
              <div class="sheet-header">
                <v-icon size="20" color="success">mdi-tune-outline</v-icon>
                <span class="sheet-title">Configuración</span>
              </div>
              <v-divider class="my-3" />

              <v-row dense>
                <!-- Bodega Maestra -->
                <v-col cols="12" md="6">
                  <div class="config-box">
                    <div class="config-label">
                      <v-icon size="18" color="success">mdi-warehouse</v-icon>
                      Bodega Maestra
                    </div>
                    <v-select
                      v-model="form.control"
                      :items="[{title: 'SI (Activo en Bodega Maestra)', value: 'SI'}, {title: 'NO (Inactivo)', value: 'NO'}]"
                      item-title="title"
                      item-value="value"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                    <div class="config-hint">Visible en Kardex y Control de Inventario de la Bodega Maestra</div>
                  </div>
                </v-col>

                <!-- Puntos de Venta -->
                <v-col cols="12" md="6">
                  <div class="config-box">
                    <div class="config-label">
                      <v-icon size="18" color="warning">mdi-store-outline</v-icon>
                      Punto de Venta
                    </div>
                    <v-select
                      v-model="form.visible_operacional"
                      :items="[{title: 'SI (Visible en Punto de Venta)', value: 'SI'}, {title: 'NO (No visible)', value: 'NO'}]"
                      item-title="title"
                      item-value="value"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                    <div class="config-hint">Visible en Kardex y Toma Física de bodegas distintas a la Bodega Maestra</div>
                  </div>
                </v-col>

                <!-- Franquicia -->
                <v-col cols="12" md="6">
                  <div class="config-box">
                    <div class="config-label">
                      <v-icon size="18" color="primary">mdi-shopping-outline</v-icon>
                      Franquicia
                    </div>
                    <v-select
                      v-model="form.para_venta"
                      :items="[{title: 'SI (Disponible para Franquiciados)', value: 'SI'}, {title: 'NO (No disponible)', value: 'NO'}]"
                      item-title="title"
                      item-value="value"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                    <div class="config-hint">Disponible para empresas cliente franquiciadas</div>
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
            <v-btn color="primary" variant="elevated" size="large" :loading="guardando" @click="guardar">
              {{ editando ? 'Guardar Cambios' : 'Crear Producto' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- ═══════════════════ DIALOG CÓDIGOS DE BARRA ═══════════════════ -->
      <v-dialog v-model="dlgBarcodes" max-width="560">
        <v-card rounded="lg" class="dlg-card">
          <div class="dlg-header" style="background: linear-gradient(135deg,#7c3aed,#8b5cf6)">
            <div class="dlg-header-left">
              <div class="dlg-header-icon"><v-icon color="white" size="22">mdi-barcode-scan</v-icon></div>
              <div>
                <div class="dlg-header-title">Códigos de Barra</div>
                <div class="dlg-header-sub">{{ bcProducto?.nombre }}</div>
              </div>
            </div>
            <v-btn icon variant="text" color="white" size="small" @click="dlgBarcodes=false"><v-icon>mdi-close</v-icon></v-btn>
          </div>

          <v-card-text class="pa-5">
            <!-- Lista de barcodes existentes -->
            <div class="bc-list" v-if="barcodes.length">
              <div v-for="bc in barcodes" :key="bc.id" class="bc-item">
                <div class="bc-item-left">
                  <v-icon size="16" :color="bc.es_principal ? '#8b5cf6' : 'rgba(var(--v-theme-on-surface),0.3)'">
                    {{ bc.es_principal ? 'mdi-star' : 'mdi-star-outline' }}
                  </v-icon>
                  <div>
                    <div class="bc-code">
                      {{ bc.barcode }}
                      <span v-if="bc.factor && parseFloat(bc.factor) !== 1" class="bc-factor">×{{ bc.factor }}</span>
                    </div>
                    <div class="bc-desc" v-if="bc.descripcion">{{ bc.descripcion }}</div>
                  </div>
                </div>
                <div class="bc-item-right">
                  <v-btn icon size="x-small" variant="text"
                    :color="bc.es_principal ? '#8b5cf6' : '#9ca3af'"
                    :title="bc.es_principal ? 'Es el principal' : 'Marcar como principal'"
                    :loading="bcToggling === bc.id"
                    @click="marcarPrincipal(bc)"
                  ><v-icon size="16">mdi-star</v-icon></v-btn>
                  <v-btn icon size="x-small" variant="text" color="error" title="Eliminar"
                    :loading="bcDeleting === bc.id"
                    @click="eliminarBarcode(bc)"
                  ><v-icon size="16">mdi-delete</v-icon></v-btn>
                </div>
              </div>
            </div>
            <div v-else-if="!bcLoading" class="bc-empty">
              <v-icon size="36" color="rgba(var(--v-theme-on-surface),0.2)">mdi-barcode-off</v-icon>
              <p>Sin códigos de barra registrados</p>
            </div>
            <div v-if="bcLoading" class="bc-empty">
              <v-progress-circular indeterminate color="primary" size="28" />
            </div>

            <v-divider class="my-4" />

            <!-- Formulario agregar -->
            <div class="bc-form">
              <div class="sheet-header mb-3">
                <v-icon size="16" color="primary">mdi-plus-circle</v-icon>
                <span class="sheet-title">Agregar Código</span>
              </div>
              <v-row dense>
                <v-col cols="12" sm="8">
                  <v-text-field
                    v-model="bcNuevo.barcode"
                    label="Código de Barra *"
                    density="compact"
                    variant="outlined"
                    hint="Puedes escribirlo o escanearlo directamente aquí"
                    persistent-hint
                    @keydown.enter.prevent="agregarBarcode"
                  />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model.number="bcNuevo.factor"
                    label="Factor (unidades)"
                    density="compact"
                    variant="outlined"
                    type="number"
                    min="1"
                    step="1"
                    hint="Ej: 120 para caja"
                    persistent-hint
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="bcNuevo.descripcion"
                    label="Descripción (opcional)"
                    density="compact"
                    variant="outlined"
                    placeholder="Ej: Caja × 120 unidades"
                    @keydown.enter.prevent="agregarBarcode"
                  />
                </v-col>
                <v-col cols="12">
                  <v-checkbox
                    v-model="bcNuevo.es_principal"
                    label="Marcar como código principal"
                    density="compact"
                    color="primary"
                    hide-details
                  />
                </v-col>
              </v-row>
              <v-alert v-if="bcError" type="error" variant="tonal" density="compact" class="mt-3 mb-0">{{ bcError }}</v-alert>
            </div>
          </v-card-text>

          <v-divider />
          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn variant="text" @click="dlgBarcodes=false">Cerrar</v-btn>
            <v-btn color="primary" variant="elevated" :loading="bcGuardando" @click="agregarBarcode"
              :disabled="!bcNuevo.barcode.trim()">
              Agregar Código
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import { productosAlmacenService } from '../../services/productos-almacen.service'
import api from '../../services/api'

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
  visible_operacional: 'SI',
  precio_costo: 0
})

// ── Watchers ──────────────────────────────────────────────────
watch(() => form.value.nombre, (newVal) => {
  if (newVal) form.value.nombre = newVal.toUpperCase()
})
watch(() => form.value.und, (newVal) => {
  if (newVal) form.value.und = newVal.toUpperCase()
})

// ── Computed ──────────────────────────────────────────────────
const conControl    = computed(() => productos.value.filter(p => p.control === 'SI').length)
const sinControl    = computed(() => productos.value.filter(p => p.control !== 'SI').length)
const conPuntoVenta = computed(() => productos.value.filter(p => p.visible_operacional === 'SI').length)

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
    visible_operacional: 'SI',
    precio_costo: 0,
    descripcion: ''
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
    visible_operacional: p.visible_operacional || 'SI',
    precio_costo: p.precio_costo || 0,
    descripcion: p.descripcion || ''
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
      visible_operacional: form.value.visible_operacional || 'SI',
      precio_costo: parseFloat(form.value.precio_costo) || 0,
      descripcion: form.value.descripcion || null,
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
  p.control = p.control === 'SI' ? 'NO' : 'SI'
  try {
    const res = await productosAlmacenService.toggleControl(p.codigo)
    p.control = res.control
  } catch {
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

async function toggleVisibleOperacional(p) {
  toggling.value = `${p.codigo}-operacional`
  const anterior = p.visible_operacional
  // Optimistic update
  p.visible_operacional = p.visible_operacional === 'SI' ? 'NO' : 'SI'
  try {
    const res = await productosAlmacenService.toggleVisibleOperacional(p.codigo)
    p.visible_operacional = res.visible_operacional
  } catch {
    // Revertir si falla
    p.visible_operacional = anterior
  } finally {
    toggling.value = null
  }
}

// Los 3 controles son independientes — no hay cascada

// ── Barcodes ──────────────────────────────────────────────────
const dlgBarcodes   = ref(false)
const bcProducto    = ref(null)
const barcodes      = ref([])
const bcLoading     = ref(false)
const bcGuardando   = ref(false)
const bcDeleting    = ref(null)
const bcToggling    = ref(null)
const bcError       = ref('')
const bcNuevo       = ref({ barcode: '', descripcion: '', es_principal: false, factor: 1 })

async function abrirBarcodes(p) {
  bcProducto.value = p
  bcNuevo.value    = { barcode: '', descripcion: '', es_principal: false, factor: 1 }
  bcError.value    = ''
  dlgBarcodes.value = true
  await cargarBarcodes()
}

async function cargarBarcodes() {
  bcLoading.value = true
  try {
    const res = await api.get(`/almacen/productos/${bcProducto.value.codigo}/barcodes`)
    barcodes.value = res.data?.data || []
  } catch { /* silencioso */ } finally {
    bcLoading.value = false
  }
}

async function agregarBarcode() {
  if (!bcNuevo.value.barcode.trim()) return
  bcGuardando.value = true
  bcError.value = ''
  try {
    const res = await api.post(`/almacen/productos/${bcProducto.value.codigo}/barcodes`, bcNuevo.value)
    if (!res.data?.success) { bcError.value = res.data?.error || 'Error al guardar'; return }
    await cargarBarcodes()
    bcNuevo.value = { barcode: '', descripcion: '', es_principal: false, factor: 1 }
  } catch (e) {
    bcError.value = e.response?.data?.error || e.message
  } finally {
    bcGuardando.value = false
  }
}

async function eliminarBarcode(bc) {
  bcDeleting.value = bc.id
  try {
    await api.delete(`/almacen/barcodes/${bc.id}`)
    await cargarBarcodes()
  } catch { /* silencioso */ } finally {
    bcDeleting.value = null
  }
}

async function marcarPrincipal(bc) {
  if (bc.es_principal) return
  bcToggling.value = bc.id
  try {
    // Eliminar y re-crear con es_principal=true — más simple que un PATCH específico
    await api.delete(`/almacen/barcodes/${bc.id}`)
    await api.post(`/almacen/productos/${bcProducto.value.codigo}/barcodes`, {
      barcode: bc.barcode, descripcion: bc.descripcion, es_principal: true
    })
    await cargarBarcodes()
  } catch { /* silencioso */ } finally {
    bcToggling.value = null
  }
}

onMounted(cargar)
</script>

<style scoped>
.prd-container { padding: 24px; max-width: 1200px; margin: 0 auto; }

/* Breadcrumb */
.prd-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root    { font-size: 12px; font-weight: 700; color: var(--indigo); text-transform: uppercase; letter-spacing: .5px; }
.bc-sep     { color: rgba(var(--v-theme-on-surface),.3); }
.bc-cat     { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface),.8); font-weight: 500; }

/* Header */
.prd-header      { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.prd-header-left { display: flex; align-items: center; gap: 16px; }
.prd-icon-wrap   { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,var(--indigo),var(--indigo)); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(6,182,212,.35); flex-shrink: 0; }
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
.grupo-header-name { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: var(--indigo); }
.grupo-header-count{ font-size: 11px; color: rgba(var(--v-theme-on-surface),.4); margin-left: 10px; }

/* Filas de producto */
.prd-row { border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); }
.prd-row:hover { background: rgba(var(--v-theme-on-surface),.02); }
.prd-table tbody td { padding: 10px 14px; }

.th-cod  { width: 90px; }
.th-nom  { }
.th-desc { width: 200px; }
.td-desc { max-width: 200px; }
.desc-text { font-size: 12px; color: rgba(var(--v-theme-on-surface),.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; max-width: 190px; cursor: help; }
.desc-empty { font-size: 12px; color: rgba(var(--v-theme-on-surface),.25); }
.th-und  { width: 90px; }
.th-ctrl { width: 100px; }
.th-acc  { width: 80px; text-align: center; }
.td-nom  { font-weight: 500; }
.td-acc  { text-align: center; white-space: nowrap; }
.acc-btns { display: inline-flex; align-items: center; gap: 2px; }

.badge-cod { background: rgba(6,182,212,.15); color: var(--indigo); padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 12px; font-family: monospace; }
.badge-und { background: rgba(139,92,246,.12); color: var(--indigo); padding: 2px 7px; border-radius: 5px; font-size: 12px; font-weight: 600; }

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
  background: linear-gradient(135deg, var(--indigo), var(--indigo));
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
  display: flex;
  align-items: center;
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
  font-size: 14px;
  font-weight: 700;
  color: var(--indigo);
  font-variant-numeric: tabular-nums;
  padding: 6px 10px;
  background: rgba(8,145,178,.12);
  border-radius: 6px;
  border: 1px solid rgba(8,145,178,.3);
  display: flex;
  align-items: center;
  height: 36px;
  min-height: 36px;
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

.desc-field-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), .6);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: .3px;
}

.config-hint {
  font-size: 10px;
  color: rgba(var(--v-theme-on-surface),.5);
  margin-top: 6px;
  font-style: italic;
}


/* Tamaño compacto para campos en diálogo */
.dlg-card :deep(.v-field__input) {
  font-size: 13px;
  padding: 0 8px;
}

.dlg-card :deep(.v-field__input input) {
  font-size: 13px;
}

.dlg-card :deep(.v-label) {
  font-size: 12px !important;
}

.dlg-card :deep(.v-selection-control__label) {
  font-size: 12px;
}

.dlg-card :deep(.v-list-item__content) {
  font-size: 13px;
}

.th-venta { width: 110px; text-align: center; }

/* Barcodes dialog */
.bc-list  { display: flex; flex-direction: column; gap: 8px; margin-bottom: 4px; }
.bc-item  { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: rgba(var(--v-theme-on-surface),.03); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 8px; }
.bc-item-left  { display: flex; align-items: center; gap: 10px; }
.bc-item-right { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
.bc-code   { font-variant-numeric: tabular-nums; font-size: 14px; font-weight: 700; letter-spacing: .5px; color: var(--indigo); display: flex; align-items: center; gap: 6px; }
.bc-factor { font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 10px; background: rgba(16,185,129,.12); color: var(--success); font-family: sans-serif; letter-spacing: 0; }
.bc-desc   { font-size: 11px; color: rgba(var(--v-theme-on-surface),.5); margin-top: 2px; }
.bc-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px; color: rgba(var(--v-theme-on-surface),.4); font-size: 13px; }
.bc-form  { }
</style>
