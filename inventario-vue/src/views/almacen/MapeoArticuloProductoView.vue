<template>
  <MainLayout>
    <div class="ap-wrap">

      <!-- BREADCRUMB -->
      <div class="ap-breadcrumb">
        <span class="bc-root">ALMACÉN</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Configuración</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Artículos ↔ Productos</span>
      </div>

      <!-- HEADER -->
      <div class="ap-header">
        <div class="ap-header-left">
          <div class="ap-icon-wrap">
            <v-icon size="24" color="white">mdi-link-variant</v-icon>
          </div>
          <div>
            <h1 class="ap-title">ARTÍCULOS ↔ PRODUCTOS</h1>
            <p class="ap-sub">Declara qué artículo de receta y qué producto de bodega son el mismo ítem, para que el costo de compra llegue a las recetas</p>
          </div>
        </div>
        <div class="ap-header-right">
          <v-btn
            variant="tonal" color="#047857" rounded="lg"
            prepend-icon="mdi-sync" :loading="sincronizando"
            :disabled="!mapeos.length"
            @click="sincronizarTodos"
          >
            Sincronizar costos
          </v-btn>
          <v-btn color="#047857" variant="flat" rounded="lg" prepend-icon="mdi-plus" @click="abrirNuevo">
            Vincular manualmente
          </v-btn>
        </div>
      </div>

      <!-- EXPLICACIÓN -->
      <div class="ap-explica">
        <v-icon size="17" color="#047857">mdi-information-outline</v-icon>
        <div>
          El costo de una receta se calcula con los precios de la tabla de <strong>artículos</strong>.
          Si un insumo lo compras registrándolo como <strong>producto</strong> (porque lo controlas en bodega),
          su precio se guarda en el catálogo de productos y el artículo queda congelado — y las recetas
          que lo usan nunca actualizan su costo. Al vincularlos aquí, cualquier compra que actualice
          un lado actualiza el otro automáticamente.
          <div class="ap-explica-fac">
            Si no miden en la misma unidad — la receta gasta <strong>kilos</strong> y bodega compra
            <strong>bultos</strong> — define el <strong>factor</strong>: cuántas unidades del artículo
            trae una unidad del producto. El costo se convierte antes de escribirlo
            (<code>costo artículo = costo producto ÷ factor</code>).
          </div>
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="loading" class="ap-loading">
        <v-progress-circular indeterminate color="#047857" size="44" />
        <p>Cargando mapeos...</p>
      </div>

      <template v-else>
        <!-- KPIs -->
        <div class="ap-kpis">
          <div class="ap-kpi">
            <div class="ap-kpi-accent" style="background:#047857"></div>
            <div class="ap-kpi-lbl">Vínculos activos</div>
            <div class="ap-kpi-val">{{ mapeos.length }}</div>
            <div class="ap-kpi-foot">ítems declarados como el mismo</div>
          </div>
          <div class="ap-kpi">
            <div class="ap-kpi-accent" :style="`background:${desalineados.length ? '#ef4444' : '#22c55e'}`"></div>
            <div class="ap-kpi-lbl">Costos desalineados</div>
            <div class="ap-kpi-val" :style="`color:${desalineados.length ? '#ef4444' : '#22c55e'}`">
              {{ desalineados.length }}
            </div>
            <div class="ap-kpi-foot">
              {{ desalineados.length ? 'usa Sincronizar costos' : 'todo cuadrado' }}
            </div>
          </div>
          <div class="ap-kpi">
            <div class="ap-kpi-accent" style="background:#f0a83c"></div>
            <div class="ap-kpi-lbl">Sugerencias</div>
            <div class="ap-kpi-val" style="color:#f0a83c">{{ sugerencias.length }}</div>
            <div class="ap-kpi-foot">artículos con posible producto gemelo</div>
          </div>
        </div>

        <!-- TABS -->
        <div class="ap-tabs">
          <button class="ap-tab" :class="{ active: tab === 'mapeos' }" @click="tab = 'mapeos'">
            <v-icon size="15">mdi-link-variant</v-icon>
            Vínculos ({{ mapeos.length }})
          </button>
          <button class="ap-tab" :class="{ active: tab === 'sugerencias' }" @click="tab = 'sugerencias'">
            <v-icon size="15">mdi-lightbulb-outline</v-icon>
            Sugerencias ({{ sugerencias.length }})
          </button>
        </div>

        <!-- ══ VÍNCULOS ══ -->
        <div v-if="tab === 'mapeos'" class="ap-card">
          <div v-if="!mapeos.length" class="ap-empty">
            <v-icon size="44" color="rgba(var(--v-theme-on-surface),0.2)">mdi-link-variant-off</v-icon>
            <p>Todavía no hay artículos vinculados a productos.</p>
            <span class="ap-empty-hint">
              Revisa la pestaña <strong>Sugerencias</strong>: ahí aparecen los artículos que
              probablemente ya existen como producto.
            </span>
          </div>
          <div v-else class="ap-table-scroll">
            <table class="ap-table">
              <thead>
                <tr>
                  <th class="th-nom">ARTÍCULO (RECETAS)</th>
                  <th class="th-num">COSTO</th>
                  <th class="th-num">FACTOR</th>
                  <th class="th-nom">PRODUCTO (BODEGA)</th>
                  <th class="th-num">COSTO</th>
                  <th class="th-nom">ESTADO</th>
                  <th class="th-mini"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in mapeos" :key="m.articulo" class="ap-tr">
                  <td class="td-nom">
                    {{ m.articulo_nombre || '(artículo borrado)' }}
                    <span class="ap-cod">{{ m.articulo }}{{ m.articulo_und ? ' · ' + m.articulo_und : '' }}</span>
                  </td>
                  <td class="td-num">{{ money(m.articulo_costo) }}</td>
                  <td class="td-num">
                    <button class="ap-factor" :class="{ 'ap-factor--uno': m.factor === 1 }"
                            title="Editar el factor de conversión"
                            @click="abrirFactor(m)">
                      ÷ {{ num(m.factor) }}
                      <v-icon size="12">mdi-pencil</v-icon>
                    </button>
                  </td>
                  <td class="td-nom">
                    {{ m.producto_nombre || '(producto borrado)' }}
                    <span class="ap-cod">{{ m.producto }}{{ m.producto_und ? ' · ' + m.producto_und : '' }}</span>
                  </td>
                  <td class="td-num">{{ money(m.producto_costo) }}</td>
                  <td class="td-nom">
                    <span v-if="m.desalineado" class="ap-badge ap-badge--warn">DESALINEADO</span>
                    <span v-else class="ap-badge ap-badge--ok">OK</span>
                    <span v-if="m.desalineado" class="ap-cod">esperado {{ money(m.articulo_costo_esperado) }}</span>
                  </td>
                  <td class="td-mini">
                    <v-btn
                      icon variant="text" size="x-small" color="error"
                      title="Quitar el vínculo (no cambia ningún costo)"
                      @click="confirmarEliminar(m)"
                    >
                      <v-icon size="16">mdi-link-variant-off</v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ══ SUGERENCIAS ══ -->
        <div v-else class="ap-card">
          <div v-if="!sugerencias.length" class="ap-empty">
            <v-icon size="44" color="rgba(var(--v-theme-on-surface),0.2)">mdi-check-circle-outline</v-icon>
            <p>No hay sugerencias.</p>
            <span class="ap-empty-hint">
              Ningún artículo sin vincular se parece por nombre a un producto libre.
              Si sabes de alguno, usa <strong>Vincular manualmente</strong>.
            </span>
          </div>
          <div v-else class="ap-sug-list">
            <div class="ap-sug-nota">
              <v-icon size="14" color="#f0a83c">mdi-alert-outline</v-icon>
              Son coincidencias por parecido de nombre — revísalas antes de aceptar.
              Vincular mal escribiría un costo equivocado en las recetas.
            </div>
            <div v-for="s in sugerencias" :key="s.articulo" class="ap-sug">
              <div class="ap-sug-art">
                <span class="ap-sug-art-nom">{{ s.articulo_nombre }}</span>
                <span class="ap-cod">{{ s.articulo }}{{ s.articulo_und ? ' · ' + s.articulo_und : '' }} · costo actual {{ money(s.articulo_costo) }}</span>
              </div>
              <div class="ap-sug-cands">
                <div v-for="c in s.candidatos" :key="c.codigo" class="ap-cand">
                  <div class="ap-cand-score" :style="`--sc:${c.score}%`">
                    <span>{{ c.score }}%</span>
                  </div>
                  <div class="ap-cand-info">
                    <span class="ap-cand-nom">{{ c.nombre }}</span>
                    <span class="ap-cod">{{ c.codigo }}{{ c.und ? ' · ' + c.und : '' }} · {{ money(c.precio_costo) }}</span>
                    <span v-if="unidadDistinta(s, c)" class="ap-cand-und">
                      <v-icon size="11">mdi-scale-balance</v-icon>
                      Unidades distintas ({{ s.articulo_und }} vs {{ c.und }}) — confirma el factor
                    </span>
                  </div>
                  <v-btn
                    size="small" variant="tonal" color="#047857" rounded="lg"
                    :loading="vinculando === `${s.articulo}::${c.codigo}`"
                    @click="pedirVincular(s, c)"
                  >
                    Vincular
                  </v-btn>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ══ DIÁLOGO: VINCULAR MANUALMENTE ══ -->
      <v-dialog v-model="dlgNuevo" max-width="560">
        <v-card class="ap-dlg">
          <div class="ap-dlg-head">
            <v-icon size="19" color="#047857">mdi-link-variant-plus</v-icon>
            <span>Vincular artículo con producto</span>
          </div>
          <div class="ap-dlg-body">
            <v-autocomplete
              v-model="nuevoArticulo"
              label="Artículo (el que usan las recetas) *"
              variant="outlined" density="comfortable" hide-details class="mb-3"
              :items="articulosLibres"
              item-title="label" item-value="codigo"
              prepend-inner-icon="mdi-silverware-fork-knife"
              no-data-text="No hay artículos sin vincular"
              clearable
            />
            <v-autocomplete
              v-model="nuevoProducto"
              label="Producto (el que compras y controlas en bodega) *"
              variant="outlined" density="comfortable" hide-details
              :items="productosLibres"
              item-title="label" item-value="codigo"
              prepend-inner-icon="mdi-package-variant"
              no-data-text="No hay productos sin vincular"
              clearable
            />

            <v-text-field
              v-model.number="nuevoFactor"
              label="Factor: unidades del artículo por unidad del producto"
              type="number" min="0.0001" step="any"
              variant="outlined" density="comfortable" class="mt-3"
              prepend-inner-icon="mdi-scale"
              hide-details persistent-placeholder
            />
            <div class="ap-dlg-nota">
              <v-icon size="14" color="#047857">mdi-information-outline</v-icon>
              <span>
                Deja <strong>1</strong> si ambos miden igual. Si la receta gasta kilos y el
                producto viene en bultos de 25 kilos, pon <strong>25</strong>.
              </span>
            </div>

            <div v-if="nuevoProductoObj" class="ap-dlg-nota">
              <v-icon size="14" color="#047857">mdi-function-variant</v-icon>
              <span>
                Al vincular, el artículo quedará en
                <strong>{{ money(nuevoFactorOk ? nuevoProductoObj.precio_costo / nuevoFactor : 0) }}</strong>
                ({{ money(nuevoProductoObj.precio_costo) }} ÷ {{ num(nuevoFactor) }}),
                y las recetas que lo usen tomarán ese valor en el próximo recálculo.
              </span>
            </div>

            <v-alert v-if="errorNuevo" type="error" variant="tonal" density="compact" class="mt-3">
              {{ errorNuevo }}
            </v-alert>
          </div>
          <div class="ap-dlg-foot">
            <v-btn variant="text" @click="dlgNuevo = false">Cancelar</v-btn>
            <v-btn
              color="#047857" variant="flat"
              :loading="guardandoNuevo"
              :disabled="!nuevoArticulo || !nuevoProducto || !nuevoFactorOk"
              @click="guardarNuevo"
            >
              Vincular
            </v-btn>
          </div>
        </v-card>
      </v-dialog>

      <!-- ══ DIÁLOGO: FACTOR DE CONVERSIÓN ══ -->
      <v-dialog v-model="dlgFactor" max-width="520">
        <v-card class="ap-dlg">
          <div class="ap-dlg-head">
            <v-icon size="19" color="#047857">mdi-scale-balance</v-icon>
            <span>{{ conv.modo === 'crear' ? 'Confirmar conversión de unidades' : 'Editar factor de conversión' }}</span>
          </div>
          <div class="ap-dlg-body">
            <div class="ap-conv">
              <div class="ap-conv-lado">
                <span class="ap-conv-rol">ARTÍCULO · RECETAS</span>
                <span class="ap-conv-nom">{{ conv.articulo_nombre }}</span>
                <span class="ap-cod">se consume por {{ conv.articulo_und || '—' }}</span>
              </div>
              <v-icon size="17" color="rgba(var(--v-theme-on-surface),0.3)">mdi-arrow-left</v-icon>
              <div class="ap-conv-lado">
                <span class="ap-conv-rol">PRODUCTO · BODEGA</span>
                <span class="ap-conv-nom">{{ conv.producto_nombre }}</span>
                <span class="ap-cod">se compra por {{ conv.producto_und || '—' }} a {{ money(conv.producto_costo) }}</span>
              </div>
            </div>

            <v-text-field
              v-model.number="conv.factor"
              :label="`¿Cuántos ${conv.articulo_und || 'unidades del artículo'} trae un ${conv.producto_und || 'unidad del producto'}?`"
              type="number" min="0.0001" step="any"
              variant="outlined" density="comfortable" class="mt-4"
              prepend-inner-icon="mdi-scale"
              hide-details="auto"
              :hint="conv.factor === 1 ? 'Factor 1 = ambos miden en la misma unidad' : ' '"
              persistent-hint
            />

            <div class="ap-conv-calc" :class="{ 'ap-conv-calc--bad': !factorOk }">
              <template v-if="factorOk">
                <v-icon size="15" color="#047857">mdi-function-variant</v-icon>
                <span>
                  {{ money(conv.producto_costo) }} ÷ {{ num(conv.factor) }} =
                  <strong>{{ money(costoConvertido) }}</strong> por {{ conv.articulo_und || 'unidad' }}
                  <span v-if="conv.articulo_costo_actual" class="ap-conv-antes">
                    (hoy el artículo vale {{ money(conv.articulo_costo_actual) }})
                  </span>
                </span>
              </template>
              <template v-else>
                <v-icon size="15" color="#ef4444">mdi-alert-circle-outline</v-icon>
                <span>El factor debe ser mayor que cero.</span>
              </template>
            </div>

            <v-alert v-if="errorFactor" type="error" variant="tonal" density="compact" class="mt-3">
              {{ errorFactor }}
            </v-alert>
          </div>
          <div class="ap-dlg-foot">
            <v-btn variant="text" @click="dlgFactor = false">Cancelar</v-btn>
            <v-btn color="#047857" variant="flat" :loading="guardandoFactor" :disabled="!factorOk" @click="guardarFactor">
              {{ conv.modo === 'crear' ? 'Vincular' : 'Guardar y recalcular' }}
            </v-btn>
          </div>
        </v-card>
      </v-dialog>

      <!-- ══ DIÁLOGO: ELIMINAR ══ -->
      <v-dialog v-model="dlgEliminar" max-width="440">
        <v-card class="ap-dlg">
          <div class="ap-dlg-head">
            <v-icon size="19" color="#ef4444">mdi-link-variant-off</v-icon>
            <span>Quitar vínculo</span>
          </div>
          <div class="ap-dlg-body">
            <p class="ap-dlg-texto">
              <strong>{{ aEliminar?.articulo_nombre }}</strong> dejará de estar vinculado con
              <strong>{{ aEliminar?.producto_nombre }}</strong>.
              Los costos actuales no cambian, pero de aquí en adelante las compras
              registradas como producto ya no actualizarán el artículo.
            </p>
          </div>
          <div class="ap-dlg-foot">
            <v-btn variant="text" @click="dlgEliminar = false">Cancelar</v-btn>
            <v-btn color="error" variant="flat" :loading="eliminando" @click="eliminar">Quitar vínculo</v-btn>
          </div>
        </v-card>
      </v-dialog>

      <v-snackbar v-model="snackOpen" :color="snackColor" timeout="4000">{{ snackMsg }}</v-snackbar>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'
import { articuloProductoService } from '../../services/articulo-producto.service'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const empresa = computed(() => authStore.empresa || localStorage.getItem('empresaActual') || '')

const loading      = ref(false)
const mapeos       = ref([])
const sugerencias  = ref([])
const tab          = ref('mapeos')
const sincronizando = ref(false)
const vinculando   = ref('')

const desalineados = computed(() => mapeos.value.filter(m => m.desalineado))

async function cargar() {
  loading.value = true
  try {
    const [mp, sg] = await Promise.all([
      articuloProductoService.getMapeos(),
      articuloProductoService.getSugerencias(3),
    ])
    mapeos.value      = mp.data || []
    sugerencias.value = sg.data || []
    // Si no hay nada vinculado pero sí sugerencias, arranca en esa pestaña
    if (!mapeos.value.length && sugerencias.value.length) tab.value = 'sugerencias'
  } catch (e) {
    console.error('Error cargando mapeos:', e)
    snack(e.response?.data?.error || 'No se pudieron cargar los mapeos', 'error')
  } finally {
    loading.value = false
  }
}

function und(x) { return String(x || '').trim().toUpperCase() }
function unidadDistinta(s, c) { return und(s.articulo_und) !== und(c.und) }

// Vincular sin pensar solo es seguro cuando ambos lados miden igual y el backend
// no propuso conversión; en cualquier otro caso se pide confirmar el factor,
// porque copiar el precio de un bulto como precio del kilo daña las recetas.
function pedirVincular(s, c) {
  const factorSugerido = Number(c.factor_sugerido) || 1
  if (!unidadDistinta(s, c) && factorSugerido === 1) return vincular(s.articulo, c.codigo, 1)
  abrirConversion({
    modo: 'crear',
    articulo: s.articulo, articulo_nombre: s.articulo_nombre, articulo_und: s.articulo_und,
    articulo_costo_actual: s.articulo_costo,
    producto: c.codigo, producto_nombre: c.nombre, producto_und: c.und,
    producto_costo: c.precio_costo,
    factor: factorSugerido,
  })
}

async function vincular(articulo, producto, factor = 1) {
  vinculando.value = `${articulo}::${producto}`
  try {
    const r = await articuloProductoService.crear({ articulo, producto, factor, sincronizar: true })
    snack(
      r.data?.sincronizado
        ? `Vinculado · el artículo quedó en ${money(r.data.sincronizado)}`
        : 'Vinculado',
      'success'
    )
    await cargar()
  } catch (e) {
    snack(e.response?.data?.error || 'No se pudo vincular', 'error')
  } finally {
    vinculando.value = ''
  }
}

// ─── Factor de conversión ─────────────────────────────────────────
const dlgFactor       = ref(false)
const errorFactor     = ref('')
const guardandoFactor = ref(false)
const conv = ref({
  modo: 'crear', articulo: '', articulo_nombre: '', articulo_und: '', articulo_costo_actual: 0,
  producto: '', producto_nombre: '', producto_und: '', producto_costo: 0, factor: 1,
})

const factorOk = computed(() => Number(conv.value.factor) > 0)
const costoConvertido = computed(() =>
  factorOk.value ? Number(conv.value.producto_costo) / Number(conv.value.factor) : 0
)

function abrirConversion(ctx) {
  errorFactor.value = ''
  conv.value = { ...ctx }
  dlgFactor.value = true
}

function abrirFactor(m) {
  abrirConversion({
    modo: 'editar',
    articulo: m.articulo, articulo_nombre: m.articulo_nombre, articulo_und: m.articulo_und,
    articulo_costo_actual: m.articulo_costo,
    producto: m.producto, producto_nombre: m.producto_nombre, producto_und: m.producto_und,
    producto_costo: m.producto_costo,
    factor: Number(m.factor) || 1,
  })
}

async function guardarFactor() {
  errorFactor.value = ''
  guardandoFactor.value = true
  try {
    const c = conv.value
    const r = c.modo === 'crear'
      ? await articuloProductoService.crear({
          articulo: c.articulo, producto: c.producto, factor: c.factor, sincronizar: true,
        })
      : await articuloProductoService.actualizarFactor(c.articulo, c.factor)
    dlgFactor.value = false
    snack(
      r.data?.sincronizado
        ? `Listo · el artículo quedó en ${money(r.data.sincronizado)}`
        : 'Factor guardado',
      'success'
    )
    await cargar()
  } catch (e) {
    errorFactor.value = e.response?.data?.error || 'No se pudo guardar el factor'
  } finally {
    guardandoFactor.value = false
  }
}

// ─── Vincular manualmente ─────────────────────────────────────────
const dlgNuevo       = ref(false)
const nuevoArticulo  = ref(null)
const nuevoProducto  = ref(null)
const nuevoFactor    = ref(1)
const errorNuevo     = ref('')
const nuevoFactorOk  = computed(() => Number(nuevoFactor.value) > 0)
const guardandoNuevo = ref(false)
const todosArticulos = ref([])
const todosProductos = ref([])

const articulosLibres = computed(() => {
  const usados = new Set(mapeos.value.map(m => String(m.articulo).trim()))
  return todosArticulos.value.filter(a => !usados.has(String(a.codigo).trim()))
})
const productosLibres = computed(() => {
  const usados = new Set(mapeos.value.map(m => String(m.producto).trim()))
  return todosProductos.value.filter(p => !usados.has(String(p.codigo).trim()))
})
const nuevoProductoObj = computed(() =>
  todosProductos.value.find(p => p.codigo === nuevoProducto.value) || null
)

async function cargarCatalogos() {
  if (todosArticulos.value.length) return
  try {
    const [rp, ra] = await Promise.all([
      api.get('/almacen/productos', { params: { empresa: empresa.value } }),
      api.get('/articulos'),
    ])
    todosProductos.value = (rp.data?.data || []).map(p => ({
      codigo: p.codigo,
      label: `${p.nombre} — ${p.codigo}`,
      precio_costo: parseFloat(p.precio_costo) || 0,
    }))
    todosArticulos.value = (ra.data?.data || []).map(a => ({
      codigo: a.codigo,
      label: `${a.nombre} — ${a.codigo}`,
      valor: parseFloat(a.valor) || 0,
    }))
  } catch (e) {
    console.error('cargarCatalogos:', e)
  }
}

async function abrirNuevo() {
  errorNuevo.value = ''
  nuevoArticulo.value = null
  nuevoProducto.value = null
  nuevoFactor.value = 1
  dlgNuevo.value = true
  await cargarCatalogos()
}

async function guardarNuevo() {
  errorNuevo.value = ''
  guardandoNuevo.value = true
  try {
    const r = await articuloProductoService.crear({
      articulo: nuevoArticulo.value,
      producto: nuevoProducto.value,
      factor: nuevoFactor.value,
      sincronizar: true,
    })
    dlgNuevo.value = false
    snack(
      r.data?.sincronizado
        ? `Vinculado · el artículo quedó en ${money(r.data.sincronizado)}`
        : 'Vinculado',
      'success'
    )
    await cargar()
  } catch (e) {
    errorNuevo.value = e.response?.data?.error || 'No se pudo vincular'
  } finally {
    guardandoNuevo.value = false
  }
}

// ─── Eliminar ─────────────────────────────────────────────────────
const dlgEliminar = ref(false)
const aEliminar   = ref(null)
const eliminando  = ref(false)

function confirmarEliminar(m) {
  aEliminar.value = m
  dlgEliminar.value = true
}

async function eliminar() {
  eliminando.value = true
  try {
    await articuloProductoService.eliminar(aEliminar.value.articulo)
    dlgEliminar.value = false
    snack('Vínculo eliminado', 'success')
    await cargar()
  } catch (e) {
    snack(e.response?.data?.error || 'No se pudo eliminar', 'error')
  } finally {
    eliminando.value = false
  }
}

// ─── Sincronizar todos ────────────────────────────────────────────
async function sincronizarTodos() {
  sincronizando.value = true
  try {
    const r = await articuloProductoService.sincronizarTodos()
    snack(`${r.sincronizados} costo(s) sincronizados · ${r.recetas_recalculadas} recetas recalculadas`, 'success')
    await cargar()
  } catch (e) {
    snack(e.response?.data?.error || 'No se pudo sincronizar', 'error')
  } finally {
    sincronizando.value = false
  }
}

// ─── Utilidades ───────────────────────────────────────────────────
const snackOpen  = ref(false)
const snackMsg   = ref('')
const snackColor = ref('success')
function snack(msg, color = 'success') {
  snackMsg.value = msg; snackColor.value = color; snackOpen.value = true
}

function money(v) {
  if (v === null || v === undefined) return '—'
  return '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// El factor puede ser entero (bulto de 25) o fraccionario (2.2727): sin decimales
// forzados para que el caso común no se lea como "25.0000".
function num(v) {
  const n = Number(v)
  if (!isFinite(n)) return '—'
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

onMounted(cargar)
</script>

<style scoped>
.ap-wrap { display: flex; flex-direction: column; gap: 16px; }

.ap-breadcrumb { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; }
.bc-root { color: #047857; text-transform: uppercase; }
.bc-sep, .bc-cat { color: rgba(var(--v-theme-on-surface), 0.35); text-transform: uppercase; }
.bc-current { color: rgba(var(--v-theme-on-surface), 0.55); text-transform: uppercase; }

.ap-header {
  display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  padding: 18px 22px; background: rgb(var(--v-theme-surface));
  border-radius: 14px; border-left: 4px solid #047857;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.ap-header-left { display: flex; align-items: center; gap: 14px; }
.ap-icon-wrap {
  width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0;
  background: linear-gradient(135deg, #047857, #065f46);
  display: flex; align-items: center; justify-content: center;
}
.ap-title { font-size: 17px; font-weight: 800; letter-spacing: 0.6px; line-height: 1.2; }
.ap-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.45); margin-top: 2px; max-width: 620px; }
.ap-header-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.ap-explica {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 14px 18px; border-radius: 12px; font-size: 12.5px; line-height: 1.6;
  background: rgba(4,120,87,0.07); border: 1px solid rgba(4,120,87,0.2);
  color: rgba(var(--v-theme-on-surface), 0.78);
}

.ap-loading, .ap-empty {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 56px 20px; color: rgba(var(--v-theme-on-surface), 0.4); font-size: 13px;
}
.ap-empty-hint { font-size: 12px; max-width: 460px; text-align: center; line-height: 1.6; }

/* KPIs */
.ap-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; }
.ap-kpi {
  position: relative; overflow: hidden;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-radius: 12px; padding: 16px 18px;
}
.ap-kpi-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
.ap-kpi-lbl { font-size: 10px; font-weight: 800; letter-spacing: 0.7px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface), 0.45); }
.ap-kpi-val { font-size: 22px; font-weight: 800; margin-top: 4px; font-variant-numeric: tabular-nums; }
.ap-kpi-foot { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.4); margin-top: 2px; }

/* TABS */
.ap-tabs { display: flex; gap: 6px; }
.ap-tab {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 9px; cursor: pointer;
  font-size: 12.5px; font-weight: 700;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: transparent; color: rgba(var(--v-theme-on-surface), 0.6);
  transition: background 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out;
}
.ap-tab:hover { background: rgba(var(--v-theme-on-surface), 0.04); }
.ap-tab.active { background: #047857; border-color: #047857; color: #fff; }

/* CARD */
.ap-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-radius: 14px; overflow: hidden;
}

/* TABLA */
.ap-table-scroll { overflow-x: auto; }
.ap-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.ap-table th {
  padding: 11px 13px; font-size: 10px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.45);
  border-bottom: 1.5px solid rgba(var(--v-theme-on-surface), 0.1);
  background: rgba(var(--v-theme-on-surface), 0.03);
  white-space: nowrap;
}
.th-nom { text-align: left; }
.th-num { text-align: right; }
.th-mini { width: 40px; }
.ap-table td { padding: 10px 13px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.04); }
.ap-tr:hover { background: rgba(4,120,87,0.04); }
.td-nom { font-weight: 600; }
.td-num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.td-mini { text-align: center; }
.ap-cod { display: block; font-size: 10.5px; font-weight: 500; color: rgba(var(--v-theme-on-surface), 0.42); margin-top: 1px; }

.ap-badge { font-size: 9.5px; font-weight: 800; padding: 3px 8px; border-radius: 5px; letter-spacing: 0.4px; }
.ap-badge--ok   { background: rgba(34,197,94,0.13); color: #16a34a; }
.ap-badge--warn { background: rgba(239,68,68,0.13); color: #ef4444; }

/* SUGERENCIAS */
.ap-sug-list { display: flex; flex-direction: column; }
.ap-sug-nota {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 12px 18px; font-size: 11.5px; line-height: 1.55;
  color: rgba(var(--v-theme-on-surface), 0.55);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  background: rgba(240,168,60,0.06);
}
.ap-sug {
  display: grid; grid-template-columns: minmax(200px, 1fr) 2fr; gap: 18px;
  padding: 14px 18px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
}
.ap-sug:last-child { border-bottom: none; }
.ap-sug-art { display: flex; flex-direction: column; }
.ap-sug-art-nom { font-size: 13px; font-weight: 700; }
.ap-sug-cands { display: flex; flex-direction: column; gap: 7px; }
.ap-cand {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 12px; border-radius: 9px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
.ap-cand-score {
  flex-shrink: 0; width: 46px; height: 26px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800; color: #047857;
  background: linear-gradient(90deg, rgba(4,120,87,0.22) var(--sc), rgba(4,120,87,0.06) var(--sc));
}
.ap-cand-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.ap-cand-nom { font-size: 12.5px; font-weight: 600; }

/* DIÁLOGOS */
.ap-dlg { border-radius: 14px; overflow: hidden; }
.ap-dlg-head {
  display: flex; align-items: center; gap: 9px;
  padding: 16px 20px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  font-size: 14px; font-weight: 800; letter-spacing: 0.3px;
}
.ap-dlg-body { padding: 18px 20px; }
.ap-dlg-foot {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 13px 20px; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.ap-dlg-nota {
  display: flex; align-items: flex-start; gap: 7px; margin-top: 14px;
  font-size: 11.5px; line-height: 1.55; color: rgba(var(--v-theme-on-surface), 0.55);
}
.ap-dlg-texto { font-size: 13px; line-height: 1.6; color: rgba(var(--v-theme-on-surface), 0.78); }

/* FACTOR DE CONVERSIÓN */
.ap-explica-fac {
  margin-top: 8px; padding-top: 8px;
  border-top: 1px solid rgba(4,120,87,0.18);
  color: rgba(var(--v-theme-on-surface), 0.68);
}
.ap-explica-fac code {
  font-size: 11.5px; padding: 1px 5px; border-radius: 4px;
  background: rgba(4,120,87,0.12); color: #047857;
}

.ap-factor {
  display: inline-flex; align-items: center; gap: 4px; cursor: pointer;
  padding: 3px 8px; border-radius: 6px;
  font-size: 11.5px; font-weight: 800; font-variant-numeric: tabular-nums;
  background: rgba(240,168,60,0.14); color: #b06f10;
  border: 1px solid rgba(240,168,60,0.3);
  transition: background 150ms ease-out;
}
.ap-factor:hover { background: rgba(240,168,60,0.26); }
/* Factor 1 = sin conversión: no debe llamar la atención */
.ap-factor--uno {
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-color: rgba(var(--v-theme-on-surface), 0.1);
  color: rgba(var(--v-theme-on-surface), 0.45);
}
.ap-factor--uno:hover { background: rgba(var(--v-theme-on-surface), 0.1); }

.ap-cand-und {
  display: inline-flex; align-items: center; gap: 4px; margin-top: 3px;
  font-size: 10.5px; font-weight: 700; color: #b06f10;
}

.ap-conv {
  display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px;
  padding: 13px 15px; border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
}
.ap-conv-lado { display: flex; flex-direction: column; min-width: 0; }
.ap-conv-rol {
  font-size: 9px; font-weight: 800; letter-spacing: 0.6px;
  color: rgba(var(--v-theme-on-surface), 0.4);
}
.ap-conv-nom { font-size: 12.5px; font-weight: 700; margin-top: 2px; }

.ap-conv-calc {
  display: flex; align-items: flex-start; gap: 7px; margin-top: 14px;
  padding: 11px 13px; border-radius: 9px;
  font-size: 12px; line-height: 1.55;
  background: rgba(4,120,87,0.08); border: 1px solid rgba(4,120,87,0.2);
  color: rgba(var(--v-theme-on-surface), 0.8);
  font-variant-numeric: tabular-nums;
}
.ap-conv-calc--bad { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.25); }
.ap-conv-antes { color: rgba(var(--v-theme-on-surface), 0.45); }

@media (max-width: 760px) {
  .ap-sug { grid-template-columns: 1fr; gap: 10px; }
}
</style>
