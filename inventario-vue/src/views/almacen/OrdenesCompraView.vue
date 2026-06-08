<template>
  <MainLayout>
    <div class="oc-container">

      <!-- BREADCRUMB -->
      <div class="oc-breadcrumb">
        <span class="bc-root">ALMACÉN</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Procesos</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Órdenes de Compra</span>
      </div>

      <!-- HEADER -->
      <div class="oc-header">
        <div class="oc-header-left">
          <div class="oc-icon-wrap"><v-icon size="22" color="white">mdi-clipboard-list-outline</v-icon></div>
          <div>
            <h1 class="oc-title">ÓRDENES DE COMPRA</h1>
            <p class="oc-sub">
              Pedidos a <strong>{{ proveedor?.nombre || '...' }}</strong>
              <span v-if="listaPrecio" class="lista-chip">{{ listaPrecio.lista }}</span>
            </p>
          </div>
        </div>
        <v-btn color="#10b981" variant="flat" rounded="lg" @click="abrirNuevoPedido">
          <v-icon start>mdi-plus</v-icon>Nueva Orden
        </v-btn>
      </div>

      <!-- KPIs -->
      <div class="oc-kpi-row">
        <div class="oc-kpi" style="--kc:#f59e0b">
          <v-icon size="18" color="#f59e0b">mdi-clock-outline</v-icon>
          <div><div class="kpi-val">{{ ordenes.filter(o => o.estado==='PENDIENTE').length }}</div><div class="kpi-lbl">PENDIENTES</div></div>
        </div>
        <div class="oc-kpi" style="--kc:#3b82f6">
          <v-icon size="18" color="#3b82f6">mdi-truck-check-outline</v-icon>
          <div><div class="kpi-val">{{ ordenes.filter(o => o.estado==='ENTREGADA').length }}</div><div class="kpi-lbl">ENTREGADAS</div></div>
        </div>
        <div class="oc-kpi" style="--kc:#22c55e">
          <v-icon size="18" color="#22c55e">mdi-receipt-text-check-outline</v-icon>
          <div><div class="kpi-val">{{ ordenes.filter(o => o.estado==='FACTURADA').length }}</div><div class="kpi-lbl">FACTURADAS</div></div>
        </div>
        <div class="oc-kpi" style="--kc:#10b981">
          <v-icon size="18" color="#10b981">mdi-currency-usd</v-icon>
          <div><div class="kpi-val">{{ fmt(totalPendiente) }}</div><div class="kpi-lbl">TOTAL PENDIENTE</div></div>
        </div>
      </div>

      <!-- HISTORIAL -->
      <div class="oc-table-card">
        <div class="oc-filter-bar">
          <span class="oc-filter-label">Filtrar por estado:</span>
          <div class="oc-estado-chips">
            <button v-for="est in estadoOpciones" :key="est.val"
              :class="['estado-chip', `estado-chip--${est.val.toLowerCase()}`, { active: filtroEstados.includes(est.val) }]"
              @click="toggleEstado(est.val)">
              {{ est.label }}
            </button>
          </div>
        </div>

        <v-progress-linear v-if="loading" indeterminate color="#10b981" height="3" />

        <div v-if="!loading && ordenesFiltradas.length === 0" class="oc-empty">
          <v-icon size="48" color="rgba(var(--v-theme-on-surface),.12)" class="mb-2">mdi-clipboard-text-off-outline</v-icon>
          <div>No hay órdenes con los filtros seleccionados</div>
        </div>

        <table v-else class="oc-table">
          <thead>
            <tr>
              <th>CÓDIGO</th>
              <th>FECHA</th>
              <th>FECHA ENTREGA</th>
              <th class="ta-c">TIPO PRECIO</th>
              <th class="ta-c">DÍAS CRÉDITO</th>
              <th class="ta-r">TOTAL</th>
              <th class="ta-c">ESTADO</th>
              <th class="ta-c">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in ordenesFiltradas" :key="o.codigo" class="oc-row">
              <td><span class="cod-badge">{{ o.codigo }}</span></td>
              <td class="dim-text">{{ fmtFecha(o.fecha) }}</td>
              <td class="dim-text">{{ o.fecha_entrega ? fmtFecha(o.fecha_entrega) : '—' }}</td>
              <td class="ta-c">
                <span class="precio-badge">{{ o.tipo_precio }}</span>
              </td>
              <td class="ta-c dim-text">{{ o.dias_credito ?? 0 }}d</td>
              <td class="ta-r font-mono">{{ fmt(o.total) }}</td>
              <td class="ta-c">
                <span :class="`estado-badge estado-${(o.estado||'').toLowerCase()}`">
                  {{ o.estado }}
                </span>
              </td>
              <td class="ta-c">
                <div class="d-flex gap-1 justify-center">
                  <v-tooltip text="Ver detalle">
                    <template #activator="{ props }">
                      <v-btn v-bind="props" icon="mdi-eye-outline" size="x-small" variant="tonal" color="#10b981"
                        @click="verDetalle(o)" />
                    </template>
                  </v-tooltip>
                  <v-tooltip text="Soportes de entrega">
                    <template #activator="{ props }">
                      <v-btn v-bind="props" icon="mdi-file-image-outline" size="x-small" variant="tonal" color="#06b6d4"
                        @click="abrirSoportes(o)" />
                    </template>
                  </v-tooltip>
                  <v-tooltip v-if="o.estado === 'PENDIENTE'" text="Editar orden">
                    <template #activator="{ props }">
                      <v-btn v-bind="props" icon="mdi-pencil-outline" size="x-small" variant="tonal" color="#f59e0b"
                        @click="abrirEditar(o)" />
                    </template>
                  </v-tooltip>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══ DIALOG NUEVA ORDEN ══ -->
    <v-dialog v-model="dlgNueva" max-width="1100" persistent scrollable>
      <v-card rounded="xl" style="overflow:hidden;display:flex;flex-direction:column;max-height:88vh">

        <!-- Header -->
        <div class="nueva-header">
          <div class="nueva-header-left">
            <div class="nueva-icon"><v-icon size="20" color="white">mdi-clipboard-plus-outline</v-icon></div>
            <div>
              <div class="nueva-title">NUEVA ORDEN DE COMPRA</div>
              <div class="nueva-sub">Proveedor: {{ proveedor?.nombre }} · Lista: {{ listaPrecio?.lista || 'Sin lista asignada' }}</div>
            </div>
          </div>
          <div class="nueva-header-right">
            <div class="nueva-total-label">TOTAL PEDIDO</div>
            <div class="nueva-total-val">{{ fmt(totalPedido) }}</div>
          </div>
          <v-btn icon="mdi-close" size="small" variant="text" color="white" @click="dlgNueva=false" />
        </div>

        <!-- Filtros de búsqueda -->
        <div class="nueva-filters">
          <div class="nueva-search">
            <v-icon size="16" color="rgba(var(--v-theme-on-surface),.4)">mdi-magnify</v-icon>
            <input v-model="busquedaProducto" type="text" placeholder="Buscar producto..." class="nueva-search-input" />
          </div>
          <select v-model="filtroGrupoPedido" class="nueva-select">
            <option value="">Todos los grupos</option>
            <option v-for="g in gruposProducto" :key="g" :value="g">{{ g }}</option>
          </select>
          <v-btn v-if="itemsPedido > 0" size="small" variant="tonal" color="error" @click="limpiarPedido">
            <v-icon start size="14">mdi-broom</v-icon>Limpiar
          </v-btn>
          <span v-if="itemsPedido > 0" class="items-badge">
            {{ itemsPedido }} producto{{ itemsPedido !== 1 ? 's' : '' }} en pedido
          </span>
        </div>

        <!-- Grid de productos -->
        <div style="flex:1;overflow-y:auto;min-height:0">

          <!-- Encabezado sticky -->
          <div class="prod-grid-head">
            <span class="col-prod-nombre">PRODUCTO</span>
            <span class="col-prod-grupo">GRUPO</span>
            <span class="col-prod-detalles">DETALLES</span>
            <span class="col-prod-und ta-c">UND</span>
            <span class="col-prod-precio ta-r">PRECIO</span>
            <span class="col-prod-cant ta-c">CANTIDAD</span>
            <span class="col-prod-sub ta-r">SUBTOTAL</span>
          </div>

          <!-- Vacío -->
          <div v-if="productosFiltrados.length === 0" class="prod-grid-empty">
            <v-icon size="36" color="rgba(var(--v-theme-on-surface),.2)">mdi-package-variant-closed</v-icon>
            <div class="mt-2">Sin productos que mostrar</div>
          </div>

          <!-- Grupos con productos -->
          <template v-for="([grupo, items]) in productosAgrupados" :key="grupo">
            <div class="prod-grupo-header">
              <v-icon size="13" color="#10b981" class="mr-1">mdi-folder-outline</v-icon>
              {{ grupo }}
              <span class="prod-grupo-count">{{ items.length }} ítem{{ items.length !== 1 ? 's' : '' }}</span>
            </div>
            <div v-for="p in items" :key="p.codigo"
              class="prod-row" :class="{ 'prod-row--selected': (cantidades[p.codigo] || 0) > 0 }">
              <div class="col-prod-nombre">
                <div class="prod-nombre">{{ p.nombre }}</div>
              </div>
              <div class="col-prod-grupo dim-text text-caption">{{ p.grupo_nombre || p.grupo || '—' }}</div>
              <div class="col-prod-detalles dim-text text-caption">{{ p.descripcion || '—' }}</div>
              <div class="col-prod-und ta-c dim-text">{{ p.unidad || '—' }}</div>
              <div class="col-prod-precio ta-r font-mono text-success">{{ fmt(getPrecio(p)) }}</div>
              <div class="col-prod-cant ta-c">
                <div class="cant-control">
                  <button class="cant-btn" @click="ajustarCant(p.codigo, -1)">−</button>
                  <input
                    :value="cantidades[p.codigo] || ''"
                    type="number" min="0" step="1"
                    class="cant-input"
                    :class="{ 'cant-input--active': (cantidades[p.codigo] || 0) > 0 }"
                    :data-codigo="p.codigo"
                    @input="setCant(p.codigo, $event.target.value)"
                    @focus="$event.target.select()"
                    @keydown.enter="navegarEnter($event, p.codigo)"
                    placeholder="0"
                  />
                  <button class="cant-btn" @click="ajustarCant(p.codigo, 1)">+</button>
                </div>
              </div>
              <div class="col-prod-sub ta-r font-mono"
                :class="(cantidades[p.codigo]||0) > 0 ? 'text-success' : 'dim-text'">
                {{ (cantidades[p.codigo]||0) > 0 ? fmt(getPrecio(p) * (cantidades[p.codigo]||0)) : '—' }}
              </div>
            </div>
          </template>

        </div>

        <!-- Footer -->
        <div class="nueva-footer">

          <!-- Fila 1: campos -->
          <div class="nueva-footer-campos">
            <div class="footer-field">
              <div class="footer-field-label">Fecha de entrega <span style="color:#ef4444">*</span></div>
              <v-text-field v-model="nuevaFechaEntrega" type="date" variant="outlined" density="compact"
                hide-details :error="fechaError" style="min-width:180px" />
            </div>
            <div class="footer-field" style="flex:1">
              <div class="footer-field-label">Observaciones</div>
              <v-text-field v-model="nuevaObservaciones" variant="outlined" density="compact"
                hide-details placeholder="Notas adicionales para el proveedor..." />
            </div>
          </div>

          <!-- Fila 2: resumen + acciones -->
          <div class="nueva-footer-actions">
            <div v-if="itemsPedido > 0" class="footer-resumen">
              <span class="footer-items">{{ itemsPedido }} producto{{ itemsPedido !== 1 ? 's' : '' }}</span>
              <span class="footer-sep">·</span>
              <span class="footer-total">{{ fmt(totalPedido) }}</span>
            </div>
            <v-spacer />
            <v-btn color="error" variant="tonal" rounded="lg" @click="dlgNueva=false">
              <v-icon start size="16">mdi-close</v-icon>Cancelar
            </v-btn>
            <v-btn color="#10b981" variant="flat" rounded="lg"
              :disabled="itemsPedido === 0"
              :loading="enviando"
              @click="enviarOrden">
              <v-icon start size="16">mdi-send-outline</v-icon>Enviar Orden
            </v-btn>
          </div>

        </div>

      </v-card>
    </v-dialog>

    <!-- ══ DIALOG DETALLE ORDEN ══ -->
    <v-dialog v-model="dlgDetalle" max-width="900" scrollable>
      <v-card rounded="xl" style="overflow:hidden;display:flex;flex-direction:column;max-height:88vh">
        <div class="det-header">
          <div class="det-header-left">
            <div class="det-icon"><v-icon size="20" color="white">mdi-clipboard-text-outline</v-icon></div>
            <div>
              <div class="det-title">{{ ordenDetalle?.codigo }}</div>
              <div class="det-sub">{{ fmtFecha(ordenDetalle?.fecha) }} · {{ proveedor?.nombre }} · {{ ordenDetalle?.tipo_precio }}</div>
            </div>
          </div>
          <span :class="`estado-badge estado-${(ordenDetalle?.estado||'').toLowerCase()}`">{{ ordenDetalle?.estado }}</span>
          <div style="display:flex;gap:8px">
            <v-btn icon="mdi-printer-outline" size="small" variant="text" color="white" @click="imprimirDetalle" title="Imprimir" />
          </div>
        </div>
        <v-card-text class="pa-4" style="flex:1;overflow-y:auto">
          <v-progress-linear v-if="loadingDetalle" indeterminate color="#10b981" height="3" class="mb-3" />
          <div v-if="detalleLineas.length">
            <template v-for="(grupo, nombre) in detalleAgrupado" :key="nombre">
              <div class="det-grupo-header">
                <v-icon size="13" color="#10b981" class="mr-1">mdi-folder-outline</v-icon>
                {{ nombre }}
              </div>
              <table class="det-table">
                <tbody>
                  <tr v-for="d in grupo" :key="d.id">
                    <td class="font-weight-medium" style="width:50%">{{ d.producto_nombre || d.nombre_producto || d.producto_venta }}</td>
                    <td class="ta-r" style="width:12%">{{ d.cantidad }}</td>
                    <td class="ta-r font-mono" style="width:19%">{{ fmt(d.precio_unitario) }}</td>
                    <td class="ta-r font-mono text-success" style="width:19%">{{ fmt(d.subtotal) }}</td>
                  </tr>
                </tbody>
              </table>
            </template>
            <div class="det-total-section">
              <div class="det-total-row">
                <span class="det-total-label">TOTAL</span>
                <span class="det-total-value">{{ fmt(ordenDetalle?.total) }}</span>
              </div>
            </div>
          </div>
          <div v-if="ordenDetalle?.observaciones" class="det-obs mt-4">
            <v-icon size="14" class="mr-1">mdi-note-outline</v-icon>
            <strong>Observaciones:</strong> {{ ordenDetalle.observaciones }}
          </div>
        </v-card-text>
        <div style="display:flex;justify-content:flex-end;padding:12px 16px;border-top:1px solid rgba(var(--v-theme-on-surface),.08);gap:8px">
          <v-btn color="error" variant="flat" rounded="lg" @click="dlgDetalle=false">
            <v-icon start size="15">mdi-close</v-icon>Cerrar
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- ══ DIALOG SOPORTES DE ENTREGA ══ -->
    <v-dialog v-model="dlgSoportes" max-width="640" scrollable>
      <v-card rounded="xl" style="overflow:hidden">
        <div class="det-header">
          <div>
            <div class="det-title">Soportes de Entrega</div>
            <div class="det-sub">{{ ordenSoportes?.codigo }}</div>
          </div>
        </div>

        <v-card-text class="pa-4">
          <v-progress-linear v-if="loadingSoportes" indeterminate color="#06b6d4" height="3" class="mb-3" />

          <div v-if="!loadingSoportes && soportes.length === 0" class="det-obs text-center py-6">
            <v-icon size="40" color="rgba(var(--v-theme-on-surface),.15)" class="mb-2 d-block">mdi-file-image-off-outline</v-icon>
            No hay soportes de entrega para esta orden
          </div>

          <div v-else class="soporte-grid">
            <div v-for="s in soportes" :key="s.id" class="soporte-item">
              <div class="soporte-img-wrap">
                <img v-if="s.tipo_mime?.startsWith('image')" :src="s.url" class="soporte-img"
                  @click="abrirImagen(s.url)" />
                <div v-else class="soporte-file">
                  <v-icon size="28" color="#06b6d4">mdi-file-pdf-box</v-icon>
                  <div class="soporte-name">{{ s.nombre_archivo }}</div>
                </div>
                <!-- Botón descargar encima de la imagen -->
                <v-btn
                  icon="mdi-download"
                  size="x-small"
                  variant="flat"
                  color="#06b6d4"
                  class="soporte-download-btn"
                  @click.stop="descargarSoporte(s)"
                />
              </div>
              <div class="soporte-fecha">{{ fmtFecha(s.fecha_subida) }}</div>
            </div>
          </div>
        </v-card-text>

        <!-- Footer con botón cerrar rojo -->
        <div style="display:flex;justify-content:flex-end;padding:12px 16px;border-top:1px solid rgba(var(--v-theme-on-surface),.08)">
          <v-btn color="error" variant="flat" rounded="lg" @click="dlgSoportes=false">
            <v-icon start size="15">mdi-close</v-icon>Cerrar
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- ══ LIGHTBOX IMAGEN ══ -->
    <v-dialog v-model="dlgImagen" max-width="800">
      <v-card rounded="xl" style="overflow:hidden;background:#000">
        <img :src="imagenActual" style="width:100%;max-height:80vh;object-fit:contain" />
        <v-btn icon="mdi-close" size="small" variant="flat" color="white" style="position:absolute;top:8px;right:8px"
          @click="dlgImagen=false" />
      </v-card>
    </v-dialog>

    <!-- ══ DIALOG EDITAR ORDEN ══ -->
    <v-dialog v-model="dlgEditar" max-width="1100" persistent scrollable>
      <v-card rounded="xl" style="overflow:hidden;display:flex;flex-direction:column;max-height:88vh">

        <!-- Header -->
        <div class="nueva-header">
          <div class="nueva-header-left">
            <div class="nueva-icon"><v-icon size="20" color="white">mdi-pencil-outline</v-icon></div>
            <div>
              <div class="nueva-title">EDITAR ORDEN — {{ ordenEditando?.codigo }}</div>
              <div class="nueva-sub">Solo se pueden editar órdenes en estado PENDIENTE</div>
            </div>
          </div>
          <div class="nueva-header-right">
            <div class="nueva-total-label">TOTAL</div>
            <div class="nueva-total-val">{{ fmt(totalEdicion) }}</div>
          </div>
          <v-btn icon="mdi-close" size="small" variant="text" color="white" @click="dlgEditar=false" />
        </div>

        <!-- Filtros -->
        <div class="nueva-filters">
          <div class="nueva-search">
            <v-icon size="16" color="rgba(var(--v-theme-on-surface),.4)">mdi-magnify</v-icon>
            <input v-model="busquedaEdicion" type="text" placeholder="Buscar producto..." class="nueva-search-input" />
          </div>
          <select v-model="filtroGrupoEdicion" class="nueva-select">
            <option value="">Todos los grupos</option>
            <option v-for="g in gruposProducto" :key="g" :value="g">{{ g }}</option>
          </select>
          <span v-if="itemsEdicion > 0" class="items-badge">
            {{ itemsEdicion }} producto{{ itemsEdicion !== 1 ? 's' : '' }} en pedido
          </span>
        </div>

        <!-- Grid productos (mismo estilo) -->
        <div style="flex:1;overflow-y:auto;min-height:0">
          <div class="prod-grid-head">
            <span class="col-prod-nombre">PRODUCTO</span>
            <span class="col-prod-grupo">GRUPO</span>
            <span class="col-prod-detalles">DETALLES</span>
            <span class="col-prod-und ta-c">UND</span>
            <span class="col-prod-precio ta-r">PRECIO</span>
            <span class="col-prod-cant ta-c">CANTIDAD</span>
            <span class="col-prod-sub ta-r">SUBTOTAL</span>
          </div>

          <template v-for="([grupo, items]) in productosAgrupadosEdicion" :key="grupo">
            <div class="prod-grupo-header">
              <v-icon size="13" color="#10b981" class="mr-1">mdi-folder-outline</v-icon>
              {{ grupo }}
              <span class="prod-grupo-count">{{ items.length }} ítem{{ items.length !== 1 ? 's' : '' }}</span>
            </div>
            <div v-for="p in items" :key="p.codigo"
              class="prod-row" :class="{ 'prod-row--selected': (cantEdicion[p.codigo] || 0) > 0 }">
              <div class="col-prod-nombre">
                <div class="prod-nombre">{{ p.nombre }}</div>
              </div>
              <div class="col-prod-grupo dim-text text-caption">{{ p.grupo_nombre || p.grupo || '—' }}</div>
              <div class="col-prod-detalles dim-text text-caption">{{ p.descripcion || '—' }}</div>
              <div class="col-prod-und ta-c dim-text">{{ p.unidad || '—' }}</div>
              <div class="col-prod-precio ta-r font-mono text-success">{{ fmt(getPrecio(p)) }}</div>
              <div class="col-prod-cant ta-c">
                <div class="cant-control">
                  <button class="cant-btn" @click="ajustarCantEdit(p.codigo, -1)">−</button>
                  <input
                    :value="cantEdicion[p.codigo] || ''"
                    type="number" min="0"
                    class="cant-input"
                    :class="{ 'cant-input--active': (cantEdicion[p.codigo] || 0) > 0 }"
                    :data-codigo="`edit-${p.codigo}`"
                    @input="setCantEdit(p.codigo, $event.target.value)"
                    @focus="$event.target.select()"
                    @keydown.enter="navegarEnterEdit($event, p.codigo)"
                    placeholder="0"
                  />
                  <button class="cant-btn" @click="ajustarCantEdit(p.codigo, 1)">+</button>
                </div>
              </div>
              <div class="col-prod-sub ta-r font-mono"
                :class="(cantEdicion[p.codigo]||0) > 0 ? 'text-success' : 'dim-text'">
                {{ (cantEdicion[p.codigo]||0) > 0 ? fmt(getPrecio(p) * (cantEdicion[p.codigo]||0)) : '—' }}
              </div>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="nueva-footer">
          <div class="nueva-footer-campos">
            <div class="footer-field">
              <div class="footer-field-label">Fecha de entrega <span style="color:#ef4444">*</span></div>
              <v-text-field v-model="editFechaEntrega" type="date" variant="outlined" density="compact"
                hide-details style="min-width:180px" />
            </div>
            <div class="footer-field" style="flex:1">
              <div class="footer-field-label">Observaciones</div>
              <v-text-field v-model="editObservaciones" variant="outlined" density="compact"
                hide-details placeholder="Notas adicionales..." />
            </div>
          </div>
          <div class="nueva-footer-actions">
            <div v-if="itemsEdicion > 0" class="footer-resumen">
              <span class="footer-items">{{ itemsEdicion }} productos</span>
              <span class="footer-sep">·</span>
              <span class="footer-total">{{ fmt(totalEdicion) }}</span>
            </div>
            <v-spacer />
            <v-btn color="error" variant="tonal" rounded="lg" @click="dlgEditar=false">
              <v-icon start size="16">mdi-close</v-icon>Cancelar
            </v-btn>
            <v-btn color="#f59e0b" variant="flat" rounded="lg"
              :disabled="itemsEdicion === 0"
              :loading="guardandoEdicion"
              @click="guardarEdicion">
              <v-icon start size="16">mdi-content-save-outline</v-icon>Guardar Cambios
            </v-btn>
          </div>
        </div>

      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="4000" location="bottom right">
      {{ snack.msg }}
    </v-snackbar>

  </MainLayout>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { API_BASE } from '../../utils/constants.js'
import { useAuthStore } from '../../stores/auth.js'
import api from '../../services/api.js'

const authStore = useAuthStore()
const getEmpresa = () => authStore.empresaCodigo || authStore.empresa || localStorage.getItem('empresaActual')

// Estado principal
const ordenes       = ref([])
const productos     = ref([])
const proveedor     = ref(null)
const listaPrecio   = ref(null)
const loading       = ref(false)
const enviando      = ref(false)

// Dialog nueva orden
const dlgNueva          = ref(false)
const cantidades        = reactive({})
const busquedaProducto  = ref('')
const filtroGrupoPedido = ref('')
const nuevaFechaEntrega = ref('')
const nuevaObservaciones = ref('')

// Dialog detalle
const dlgDetalle    = ref(false)
const ordenDetalle  = ref(null)
const detalleLineas = ref([])
const loadingDetalle = ref(false)

// Dialog soportes
const dlgSoportes    = ref(false)
const ordenSoportes  = ref(null)
const soportes       = ref([])
const loadingSoportes = ref(false)
const dlgImagen      = ref(false)
const imagenActual   = ref('')

// Dialog edición
const dlgEditar       = ref(false)
const ordenEditando   = ref(null)
const cantEdicion     = reactive({})
const busquedaEdicion = ref('')
const filtroGrupoEdicion = ref('')
const editFechaEntrega  = ref('')
const editObservaciones = ref('')
const guardandoEdicion  = ref(false)

const snack = ref({ show: false, msg: '', color: 'success' })
const empresaProveedor = ref({})
const empresaCliente = ref({})

// ── Computed ────────────────────────────────────────────────
const estadoOpciones = [
  { val: 'PENDIENTE',  label: 'Pendiente' },
  { val: 'ENTREGADA',  label: 'Entregada' },
  { val: 'FACTURADA',  label: 'Facturada' },
  { val: 'ANULADA',    label: 'Anulada' },
]
const filtroEstados = ref(['PENDIENTE', 'ENTREGADA'])

function toggleEstado(val) {
  const i = filtroEstados.value.indexOf(val)
  if (i >= 0) filtroEstados.value.splice(i, 1)
  else filtroEstados.value.push(val)
}

const ordenesFiltradas = computed(() =>
  filtroEstados.value.length === 0
    ? ordenes.value
    : ordenes.value.filter(o => filtroEstados.value.includes(o.estado))
)

const totalPendiente = computed(() =>
  ordenes.value.filter(o => o.estado === 'PENDIENTE').reduce((s, o) => s + parseFloat(o.total || 0), 0)
)

const nivelPrecio = computed(() => parseInt(listaPrecio.value?.nivel) || 1)

function getPrecio(p) {
  const n = nivelPrecio.value
  return parseFloat(n === 1 ? p.precio_venta1 : n === 2 ? p.precio_venta2 : p.precio_venta3) || 0
}

const gruposProducto = computed(() => {
  const gs = new Set(productos.value.map(p => p.grupo_nombre || p.grupo || 'SIN GRUPO'))
  return [...gs].sort()
})

const productosFiltrados = computed(() => {
  const q = busquedaProducto.value.toLowerCase()
  return productos.value.filter(p => {
    const mg = !filtroGrupoPedido.value || (p.grupo_nombre || p.grupo) === filtroGrupoPedido.value
    const mq = !q || p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q)
    return mg && mq
  })
})

const productosAgrupados = computed(() => {
  const map = {}
  productosFiltrados.value.forEach(p => {
    const key = p.grupo_nombre || p.grupo || 'SIN GRUPO'
    if (!map[key]) map[key] = []
    map[key].push(p)
  })
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b, 'es'))
})

const itemsPedido = computed(() =>
  Object.values(cantidades).filter(c => parseFloat(c) > 0).length
)
const fechaError = computed(() => !nuevaFechaEntrega.value && itemsPedido.value > 0)

const productosFiltradosEdicion = computed(() => {
  const q = busquedaEdicion.value.toLowerCase()
  return productos.value.filter(p => {
    const mg = !filtroGrupoEdicion.value || (p.grupo_nombre || p.grupo) === filtroGrupoEdicion.value
    const mq = !q || p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q)
    return mg && mq
  })
})
const productosAgrupadosEdicion = computed(() => {
  const map = {}
  productosFiltradosEdicion.value.forEach(p => {
    const key = p.grupo_nombre || p.grupo || 'SIN GRUPO'
    if (!map[key]) map[key] = []
    map[key].push(p)
  })
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b, 'es'))
})
const itemsEdicion = computed(() => Object.values(cantEdicion).filter(c => parseFloat(c) > 0).length)
const totalEdicion = computed(() =>
  productos.value.reduce((s, p) => {
    const cant = parseFloat(cantEdicion[p.codigo]) || 0
    return s + (cant > 0 ? cant * getPrecio(p) : 0)
  }, 0)
)

const totalPedido = computed(() =>
  productos.value.reduce((s, p) => {
    const cant = parseFloat(cantidades[p.codigo]) || 0
    return s + (cant > 0 ? cant * getPrecio(p) : 0)
  }, 0)
)

const detalleAgrupado = computed(() => {
  const map = {}
  detalleLineas.value.forEach(d => {
    const grupo = d.grupo_nombre || 'SIN GRUPO'
    if (!map[grupo]) map[grupo] = []
    map[grupo].push(d)
  })
  return Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b, 'es')))
})

// ── Helpers ─────────────────────────────────────────────────
function fmt(v) { return '$' + (parseFloat(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtFecha(s) {
  if (!s) return '—'
  const d = new Date(s + (s.includes('T') ? '' : 'T00:00:00'))
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
}
function ok(msg)  { snack.value = { show: true, msg, color: 'success' } }
function err(msg) { snack.value = { show: true, msg, color: 'error' } }

function setCant(codigo, val) {
  const n = parseFloat(val)
  if (isNaN(n) || n <= 0) { delete cantidades[codigo] } else { cantidades[codigo] = n }
}
function ajustarCant(codigo, delta) {
  const actual = parseFloat(cantidades[codigo]) || 0
  const nuevo = Math.max(0, actual + delta)
  if (nuevo === 0) { delete cantidades[codigo] } else { cantidades[codigo] = nuevo }
}
function limpiarPedido() { Object.keys(cantidades).forEach(k => delete cantidades[k]) }

// ── Carga ────────────────────────────────────────────────────
async function cargar() {
  loading.value = true
  const empresa = getEmpresa()
  try {
    const [rProv, rOrd] = await Promise.all([
      fetch(`${API_BASE}/empresas/proveedor`).then(r => r.json()),
      fetch(`${API_BASE}/ordenes-compra/mis-ordenes?cliente=${empresa}`).then(r => r.json()),
    ])
    if (rProv.success) proveedor.value = rProv.data
    if (rOrd.success) ordenes.value = rOrd.data || []

    // Obtener lista de precios del cliente
    const rClientes = await fetch(`${API_BASE}/empresas/clientes`).then(r => r.json())
    if (rClientes.success) {
      const miEmpresa = (rClientes.data || []).find(c => String(c.codigo) === String(empresa))
      if (miEmpresa?.lista_precio_id) {
        const rListas = await fetch(`${API_BASE}/produccion/lista-precios`).then(r => r.json())
        const lista = (rListas.data || []).find(l => l.id === miEmpresa.lista_precio_id)
        if (lista) listaPrecio.value = lista
      }
    }
  } catch (e) { err('Error al cargar datos') }
  finally { loading.value = false }
}

async function cargarProductos() {
  try {
    const tipoEmpresa = authStore.empresaTipo
    if (tipoEmpresa !== 'CLIENTE') {
      err('Solo empresas CLIENTE pueden hacer órdenes de compra')
      return
    }
    const r = await api.get('/almacen/productos')
    productos.value = (r.data?.data || []).filter(p => p.para_venta === 'SI')
  } catch (e) {
    console.error('Error cargando productos:', e)
    err('Error cargando productos')
  }
}

// ── Acciones ─────────────────────────────────────────────────
async function abrirNuevoPedido() {
  if (!proveedor.value) { err('No se encontró empresa proveedor'); return }
  if (!listaPrecio.value) { err('No tienes una lista de precios asignada. Contacta al proveedor.'); return }
  limpiarPedido()
  busquedaProducto.value = ''
  filtroGrupoPedido.value = ''
  nuevaFechaEntrega.value = ''
  nuevaObservaciones.value = ''
  if (!productos.value.length) await cargarProductos()
  dlgNueva.value = true
}

// ── Soportes ─────────────────────────────────────────────────
async function abrirSoportes(o) {
  ordenSoportes.value = o
  soportes.value = []
  loadingSoportes.value = true
  dlgSoportes.value = true
  try {
    const r = await fetch(`${API_BASE}/soportes-entrega/${o.codigo}`).then(r => r.json())
    soportes.value = (r.data || []).map(s => {
      // El backend ya devuelve archivo_data como "data:mime;base64,..." completo
      const url = s.archivo_data || null
      const mime = s.tipo_archivo || (url ? url.split(';')[0].replace('data:', '') : 'image/jpeg')
      return { ...s, url, tipo_mime: mime }
    })
  } catch (e) { err('Error al cargar soportes') }
  finally { loadingSoportes.value = false }
}

function abrirImagen(url) { imagenActual.value = url; dlgImagen.value = true }

function descargarSoporte(s) {
  const a = document.createElement('a')
  a.href = s.url
  a.download = s.nombre_archivo || `soporte-${s.id}`
  a.click()
}

async function subirSoporte(e) {
  const file = e.target.files[0]
  if (!file || !ordenSoportes.value) return
  const empresa = getEmpresa()
  const reader = new FileReader()
  reader.onload = async (ev) => {
    const base64 = ev.target.result.split(',')[1]
    try {
      await fetch(`${API_BASE}/soportes-entrega/subir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orden: ordenSoportes.value.codigo,
          imagen_base64: base64,
          nombre_archivo: file.name,
          empresa,
        })
      })
      ok('Soporte subido correctamente')
      await abrirSoportes(ordenSoportes.value)
    } catch { err('Error al subir soporte') }
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

// ── Edición ───────────────────────────────────────────────────
async function abrirEditar(o) {
  if (o.estado !== 'PENDIENTE') return
  ordenEditando.value = o
  busquedaEdicion.value = ''
  filtroGrupoEdicion.value = ''
  editFechaEntrega.value = o.fecha_entrega ? o.fecha_entrega.substring(0, 10) : ''
  editObservaciones.value = o.observaciones || ''
  Object.keys(cantEdicion).forEach(k => delete cantEdicion[k])
  if (!productos.value.length) await cargarProductos()
  // Pre-cargar cantidades del pedido actual
  loadingDetalle.value = true
  try {
    const r = await fetch(`${API_BASE}/ordenes-compra/${o.codigo}/detalles`).then(r => r.json())
    ;(r.detalles || r.data || []).forEach(d => {
      if (parseFloat(d.cantidad) > 0) cantEdicion[d.producto_venta] = parseFloat(d.cantidad)
    })
  } catch (e) { console.error(e) }
  finally { loadingDetalle.value = false }
  dlgEditar.value = true
}

function setCantEdit(codigo, val) {
  const n = parseFloat(val)
  if (isNaN(n) || n <= 0) { delete cantEdicion[codigo] } else { cantEdicion[codigo] = n }
}
function ajustarCantEdit(codigo, delta) {
  const actual = parseFloat(cantEdicion[codigo]) || 0
  const nuevo = Math.max(0, actual + delta)
  if (nuevo === 0) { delete cantEdicion[codigo] } else { cantEdicion[codigo] = nuevo }
}
function navegarEnterEdit(e, codigo) {
  const inputs = [...document.querySelectorAll('[data-codigo^="edit-"]')]
  const idx = inputs.findIndex(el => el.dataset.codigo === `edit-${codigo}`)
  if (idx >= 0 && idx < inputs.length - 1) { e.preventDefault(); inputs[idx + 1].focus(); inputs[idx + 1].select() }
}

async function guardarEdicion() {
  if (itemsEdicion.value === 0) return
  if (!editFechaEntrega.value) { err('La fecha de entrega es obligatoria'); return }
  guardandoEdicion.value = true
  try {
    const detalles = productos.value
      .filter(p => (parseFloat(cantEdicion[p.codigo]) || 0) > 0)
      .map(p => ({
        producto_venta: p.codigo,
        cantidad: parseFloat(cantEdicion[p.codigo]),
        precio_unitario: getPrecio(p),
        subtotal: parseFloat(cantEdicion[p.codigo]) * getPrecio(p),
      }))
    const r = await fetch(`${API_BASE}/ordenes-compra/${ordenEditando.value.codigo}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fecha_entrega: editFechaEntrega.value,
        observaciones: editObservaciones.value,
        detalles,
        total: totalEdicion.value,
      })
    })
    const j = await r.json()
    if (!j.success) throw new Error(j.error || j.details)
    ok('Orden actualizada correctamente')
    dlgEditar.value = false
    await cargar()
  } catch (e) { err(e.message) }
  finally { guardandoEdicion.value = false }
}

function navegarEnter(e, codigo) {
  // Al presionar Enter en una celda de cantidad, salta a la siguiente
  const inputs = [...document.querySelectorAll('.cant-input')]
  const idx = inputs.findIndex(el => el.dataset.codigo === codigo)
  if (idx >= 0 && idx < inputs.length - 1) {
    e.preventDefault()
    inputs[idx + 1].focus()
    inputs[idx + 1].select()
  }
}

async function enviarOrden() {
  if (itemsPedido.value === 0) return
  if (!nuevaFechaEntrega.value) {
    err('La fecha de entrega es obligatoria')
    return
  }
  enviando.value = true
  try {
    const empresa = getEmpresa()
    const nivel = nivelPrecio.value
    const tipoPrecio = `precio_venta${nivel}`

    const detalles = productos.value
      .filter(p => (parseFloat(cantidades[p.codigo]) || 0) > 0)
      .map(p => ({
        producto_venta: p.codigo,
        cantidad: parseFloat(cantidades[p.codigo]),
        precio_unitario: getPrecio(p),
        subtotal: parseFloat(cantidades[p.codigo]) * getPrecio(p),
      }))

    const r = await fetch(`${API_BASE}/ordenes-compra/crear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa: proveedor.value.codigo,
        cliente: empresa,
        tipo_precio: tipoPrecio,
        fecha_entrega: nuevaFechaEntrega.value || null,
        dias_credito: listaPrecio.value?.dias_credito || 0,
        observaciones: nuevaObservaciones.value,
        total: totalPedido.value,
        detalles,
      })
    })
    const j = await r.json()
    if (!j.success) throw new Error(j.error || j.details)
    ok(`✅ Orden ${j.codigo} enviada correctamente`)
    dlgNueva.value = false
    await cargar()
  } catch (e) { err(e.message) }
  finally { enviando.value = false }
}

async function verDetalle(o) {
  ordenDetalle.value = o
  detalleLineas.value = []
  dlgDetalle.value = true
  loadingDetalle.value = true
  try {
    const r = await fetch(`${API_BASE}/ordenes-compra/${o.codigo}/detalles`).then(r => r.json())
    detalleLineas.value = r.detalles || r.data || []
    empresaProveedor.value = r.proveedor || {}
    empresaCliente.value = r.cliente || {}
  } catch (e) { console.error(e) }
  finally { loadingDetalle.value = false }
}

function imprimirDetalle() {
  const items = detalleLineas.value
  const subtotal = parseFloat(ordenDetalle.value.total) || 0
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${ordenDetalle.value.codigo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Inter', Arial, sans-serif; font-size:9px; color:#1a1a2e; background:#fff; }
    .page { width:8.5in; min-height:11in; margin:0 auto; padding:30px 35px; display:flex; flex-direction:column; }

    /* ── TOP BANNER ── */
    .top-banner { display:flex; align-items:stretch; margin-bottom:18px; border-radius:4px; overflow:hidden; border:1px solid #e2e8f0; }
    .banner-left { background:#1a1a2e; color:#fff; padding:14px 20px; min-width:220px; display:flex; flex-direction:column; justify-content:center; }
    .banner-doc-label { font-size:7px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#94a3b8; margin-bottom:4px; }
    .banner-doc-title { font-size:18px; font-weight:700; letter-spacing:1px; color:#fff; }
    .banner-doc-num { font-size:10px; font-weight:500; color:#38bdf8; margin-top:3px; }
    .banner-right { flex:1; padding:12px 20px; display:grid; grid-template-columns:1fr 1fr; gap:10px; align-items:center; background:#f8fafc; }
    .banner-field { display:flex; flex-direction:column; gap:2px; }
    .banner-field-label { font-size:6.5px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#94a3b8; }
    .banner-field-val { font-size:9px; font-weight:600; color:#1a1a2e; }
    .banner-field-val.accent { color:#0ea5e9; }

    /* ── PARTIES ── */
    .parties { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px; }
    .party-card { border:1px solid #e2e8f0; border-radius:4px; overflow:hidden; }
    .party-header { background:#1a1a2e; color:#fff; padding:4px 10px; font-size:6.5px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; }
    .party-body { padding:8px 10px; background:#fafafa; }
    .party-name { font-size:9px; font-weight:700; color:#1a1a2e; margin-bottom:2px; }
    .party-detail { font-size:7.5px; color:#64748b; line-height:1.5; }

    /* ── OBSERVACIONES ── */
    .obs-bar { border:1px solid #e2e8f0; border-radius:4px; padding:6px 10px; margin-bottom:14px; display:flex; gap:8px; align-items:flex-start; background:#fafafa; }
    .obs-label { font-size:6.5px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#94a3b8; white-space:nowrap; margin-top:1px; }
    .obs-val { font-size:8px; color:#374151; flex:1; }

    /* ── TABLA ── */
    .tabla-wrap { }
    .tabla { width:100%; border-collapse:collapse; }
    .tabla thead tr { background:#fff; }
    .tabla thead th { padding:5px 8px; font-size:7px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#1a1a2e; text-align:left; border-top:2px solid #1a1a2e; border-bottom:2px solid #1a1a2e; }
    .tabla thead th.ta-c { text-align:center; }
    .tabla thead th.ta-r { text-align:right; }
    .tabla tbody tr { border-bottom:none; }
    .tabla tbody tr.empty-row { background:#fff !important; }
    .tabla tbody tr.empty-row td { color:transparent; }
    .tabla tbody tr.last-row td { border-bottom:2px solid #1a1a2e; }
    .tabla td { padding:3px 8px; font-size:8px; color:#374151; }
    .tabla td.ta-c { text-align:center; }
    .tabla td.ta-r { text-align:right; font-variant-numeric:tabular-nums; }
    .tabla td.cod { font-weight:600; color:#0ea5e9; font-family:monospace; font-size:8px; }
    .tabla td.prod-name { font-weight:500; color:#1a1a2e; }
    .tabla td.det { color:#94a3b8; font-size:7.5px; font-style:italic; }
    .tabla td.qty { font-weight:600; color:#374151; }
    .tabla td.price { color:#374151; }
    .tabla td.total-cell { font-weight:600; color:#1a1a2e; }

    /* ── FOOTER ── */
    .footer { margin-top:8px; }
    .footer-top { display:flex; justify-content:flex-end; margin-bottom:20px; }
    .totals-box { width:260px; border:1px solid #e2e8f0; border-radius:4px; overflow:hidden; }
    .totals-row { display:flex; justify-content:space-between; padding:5px 12px; font-size:8px; border-bottom:1px solid #f1f5f9; }
    .totals-row .lbl { color:#64748b; font-weight:500; }
    .totals-row .val { font-weight:500; color:#374151; }
    .totals-row.grand { background:#1a1a2e; border-bottom:none; }
    .totals-row.grand .lbl { color:#94a3b8; font-weight:700; font-size:8.5px; letter-spacing:.5px; text-transform:uppercase; }
    .totals-row.grand .val { color:#38bdf8; font-weight:700; font-size:10px; }

    /* ── FIRMAS ── */
    .firmas { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-top:6px; }
    .firma { display:flex; flex-direction:column; }
    .firma-space { height:50px; border-bottom:1px solid #94a3b8; margin-bottom:4px; }
    .firma-label { font-size:6.5px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#64748b; text-align:center; }

    /* ── WATERMARK número ── */
    .doc-number-side { position:fixed; right:10px; top:50%; transform:rotate(90deg) translateX(-50%); font-size:7px; color:#e2e8f0; letter-spacing:2px; font-weight:700; }
  </style>
</head>
<body>
<div class="page">

  <!-- TOP BANNER -->
  <div class="top-banner">
    <div class="banner-left">
      <div class="banner-doc-label">Documento</div>
      <div class="banner-doc-title">ORDEN DE<br>COMPRA</div>
      <div class="banner-doc-num">${ordenDetalle.value.codigo}</div>
    </div>
    <div class="banner-right">
      <div class="banner-field">
        <span class="banner-field-label">Fecha de Orden</span>
        <span class="banner-field-val">${fmtFecha(ordenDetalle.value.fecha)}</span>
      </div>
      <div class="banner-field">
        <span class="banner-field-label">Fecha de Entrega</span>
        <span class="banner-field-val accent">${fmtFecha(ordenDetalle.value.fecha_entrega) || '—'}</span>
      </div>
      <div class="banner-field">
        <span class="banner-field-label">Tipo de Precio</span>
        <span class="banner-field-val">${ordenDetalle.value.tipo_precio || '—'}</span>
      </div>
      <div class="banner-field">
        <span class="banner-field-label">Estado</span>
        <span class="banner-field-val">${ordenDetalle.value.estado || '—'}</span>
      </div>
    </div>
  </div>

  <!-- PARTIES -->
  <div class="parties">
    <div class="party-card">
      <div class="party-header">Vendedor / Proveedor</div>
      <div class="party-body">
        <div class="party-name">${empresaProveedor.value?.nombre || 'N/A'}</div>
        <div class="party-detail">
          ${empresaProveedor.value?.direccion || ''}${empresaProveedor.value?.direccion ? '<br>' : ''}
          ${empresaProveedor.value?.telefono ? 'Tel: ' + empresaProveedor.value.telefono : ''}
        </div>
      </div>
    </div>
    <div class="party-card">
      <div class="party-header">Enviar A / Cliente</div>
      <div class="party-body">
        <div class="party-name">${empresaCliente.value?.nombre || 'N/A'}</div>
        <div class="party-detail">
          ${empresaCliente.value?.direccion || ''}${empresaCliente.value?.direccion ? '<br>' : ''}
          ${empresaCliente.value?.telefono ? 'Tel: ' + empresaCliente.value.telefono : ''}
        </div>
      </div>
    </div>
  </div>

  <!-- OBSERVACIONES -->
  <div class="obs-bar">
    <span class="obs-label">Observaciones</span>
    <span class="obs-val">${ordenDetalle.value.observaciones || '—'}</span>
  </div>

  <!-- TABLA PRODUCTOS -->
  <div class="tabla-wrap">
    <table class="tabla">
      <thead>
        <tr>
          <th style="width:7%">Código</th>
          <th style="width:38%">Producto</th>
          <th style="width:18%">Detalles</th>
          <th style="width:7%" class="ta-c">Cant.</th>
          <th style="width:13%" class="ta-r">Vr. Unitario</th>
          <th style="width:13%" class="ta-r">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((d, i) => `
        <tr${i === items.length - 1 ? ' class="last-row"' : ''}>
          <td class="cod ta-c">${d.producto_venta}</td>
          <td class="prod-name">${d.producto_nombre || d.nombre_producto || ''}</td>
          <td class="det">${d.producto_descripcion || d.descripcion || ''}</td>
          <td class="qty ta-c">${d.cantidad}</td>
          <td class="price ta-r">$${parseFloat(d.precio_unitario).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
          <td class="total-cell ta-r">$${parseFloat(d.subtotal).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-top">
      <div class="totals-box">
        <div class="totals-row">
          <span class="lbl">Subtotal</span>
          <span class="val">$${subtotal.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
        </div>
        <div class="totals-row">
          <span class="lbl">Impuestos</span>
          <span class="val">—</span>
        </div>
        <div class="totals-row grand">
          <span class="lbl">Total</span>
          <span class="val">$${subtotal.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
        </div>
      </div>
    </div>

    <div class="firmas">
      <div class="firma">
        <div class="firma-space"></div>
        <div class="firma-label">Entregado Por</div>
      </div>
      <div class="firma">
        <div class="firma-space"></div>
        <div class="firma-label">Recibido Por</div>
      </div>
      <div class="firma">
        <div class="firma-space"></div>
        <div class="firma-label">Fecha</div>
      </div>
      <div class="firma">
        <div class="firma-space"></div>
        <div class="firma-label">Observaciones</div>
      </div>
    </div>
  </div>

</div>
</body>
</html>`
  const ventana = window.open('', '_blank')
  ventana.document.write(html)
  ventana.document.close()
}

onMounted(cargar)
</script>

<style scoped>
.oc-container { padding: 24px; max-width: 1300px; margin: 0 auto; }
.oc-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 12px; font-weight: 700; color: #10b981; text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface),.3) !important; }
.bc-cat { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface),.8); font-weight: 500; }

.oc-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.oc-header-left { display: flex; align-items: center; gap: 14px; }
.oc-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#10b981,#059669); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(16,185,129,.35); }
.oc-title { font-size: 20px; font-weight: 800; margin: 0; }
.oc-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; display: flex; align-items: center; gap: 6px; }
.lista-chip { background: rgba(16,185,129,.12); color: #059669; font-size: 11px; font-weight: 700; padding: 1px 8px; border-radius: 5px; }

/* KPIs */
.oc-kpi-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px,1fr)); gap: 12px; margin-bottom: 20px; }
.oc-kpi { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 12px; border-left: 3px solid var(--kc); }
.kpi-val { font-size: 18px; font-weight: 800; }
.kpi-lbl { font-size: 9px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.4); margin-top: 2px; }

/* Filter bar */
.oc-filter-bar { display:flex; align-items:center; gap:12px; padding:10px 16px; border-bottom:1px solid rgba(var(--v-theme-on-surface),.06); flex-wrap:wrap; }
.oc-filter-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:rgba(var(--v-theme-on-surface),.4); white-space:nowrap; }
.oc-estado-chips { display:flex; gap:6px; flex-wrap:wrap; }
.estado-chip { padding:3px 12px; border-radius:20px; font-size:11px; font-weight:700; cursor:pointer; border:1.5px solid transparent; transition:all .15s; background:rgba(var(--v-theme-on-surface),.05); color:rgba(var(--v-theme-on-surface),.4); }
.estado-chip--pendiente.active  { background:rgba(245,158,11,.12);  color:#b45309; border-color:#f59e0b; }
.estado-chip--entregada.active  { background:rgba(59,130,246,.12);  color:#1d4ed8; border-color:#3b82f6; }
.estado-chip--facturada.active  { background:rgba(34,197,94,.12);   color:#15803d; border-color:#22c55e; }
.estado-chip--anulada.active    { background:rgba(239,68,68,.12);   color:#b91c1c; border-color:#ef4444; }

/* Tabla historial */
.oc-table-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 14px; overflow-x: auto; }
.oc-empty { padding: 48px; text-align: center; color: rgba(var(--v-theme-on-surface),.4); font-size: 13px; display: flex; flex-direction: column; align-items: center; }
.oc-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.oc-table thead th { padding: 10px 14px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.45); background: rgba(var(--v-theme-on-surface),.03); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); white-space: nowrap; }
.oc-table thead th.ta-r { text-align: right; }
.oc-table thead th.ta-c { text-align: center; }
.oc-row td { padding: 10px 14px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); }
.oc-row:hover td { background: rgba(var(--v-theme-on-surface),.02); }
.ta-r { text-align: right !important; }
.ta-c { text-align: center !important; }
.cod-badge { background: rgba(16,185,129,.1); color: #059669; padding: 2px 7px; border-radius: 5px; font-size: 11px; font-weight: 700; font-family: monospace; }
.precio-badge { background: rgba(var(--v-theme-on-surface),.08); padding: 2px 7px; border-radius: 5px; font-size: 10px; font-weight: 700; }
.dim-text { color: rgba(var(--v-theme-on-surface),.55); }
.font-mono { font-family: 'Courier New', monospace; }
.text-success { color: #22c55e; }

.estado-badge { padding: 3px 9px; border-radius: 5px; font-size: 10px; font-weight: 700; }
.estado-pendiente  { background: rgba(245,158,11,.12);  color: #b45309; }
.estado-entregada  { background: rgba(59,130,246,.12);  color: #1d4ed8; }
.estado-facturada  { background: rgba(34,197,94,.12);   color: #15803d; }
.estado-cancelada  { background: rgba(239,68,68,.12);   color: #b91c1c; }

/* ── DIALOG NUEVA ORDEN ─────────────────────────────── */
.nueva-header { display: flex; align-items: center; gap: 14px; padding: 16px 20px; background: linear-gradient(135deg,#065f46,#047857); flex-shrink: 0; }
.nueva-header-left { display: flex; align-items: center; gap: 12px; flex: 1; }
.nueva-icon { width: 38px; height: 38px; border-radius: 10px; background: rgba(255,255,255,.18); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nueva-title { font-size: 15px; font-weight: 700; color: white; }
.nueva-sub { font-size: 11px; color: rgba(255,255,255,.55); margin-top: 1px; }
.nueva-header-right { text-align: right; flex-shrink: 0; }
.nueva-total-label { font-size: 10px; color: rgba(255,255,255,.55); font-weight: 700; letter-spacing: .6px; }
.nueva-total-val { font-size: 20px; font-weight: 900; color: white; font-family: monospace; }

.nueva-filters { display: flex; align-items: center; gap: 10px; padding: 12px 20px; background: rgba(var(--v-theme-on-surface),.02); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); flex-shrink: 0; flex-wrap: wrap; }
.nueva-search { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 200px; padding: 7px 12px; background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.1); border-radius: 8px; }
.nueva-search-input { flex: 1; border: none; background: transparent; outline: none; font-size: 13px; color: rgb(var(--v-theme-on-surface)); }
.nueva-search-input::placeholder { color: rgba(var(--v-theme-on-surface),.35); }
.nueva-select { padding: 7px 10px; border: 1px solid rgba(var(--v-theme-on-surface),.12); border-radius: 8px; font-size: 13px; background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); outline: none; }
.items-badge { font-size: 12px; font-weight: 700; color: #10b981; }

/* Grid productos */
.prod-grid-head {
  display: grid;
  grid-template-columns: 1fr 90px 100px 50px 100px 120px 100px;
  padding: 8px 20px;
  font-size: 10px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface),.4);
  background: rgba(var(--v-theme-on-surface),.03);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08);
  position: sticky; top: 0; z-index: 1;
}
.prod-grupo-header { padding: 8px 20px; background: rgba(16,185,129,.05); border-top: 1px solid rgba(16,185,129,.12); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #059669; display: flex; align-items: center; }
.prod-grupo-count { margin-left: 8px; font-size: 10px; font-weight: 500; text-transform: none; letter-spacing: 0; color: rgba(var(--v-theme-on-surface),.4); }
.prod-row {
  display: grid;
  grid-template-columns: 1fr 90px 100px 50px 100px 120px 100px;
  padding: 9px 20px;
  align-items: center;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05);
  transition: background .1s;
}
.prod-row:hover { background: rgba(var(--v-theme-on-surface),.02); }
.prod-row--selected { background: rgba(16,185,129,.04); }
.prod-nombre { font-weight: 600; font-size: 13px; }
.prod-desc { font-size: 11px; color: rgba(var(--v-theme-on-surface),.4); margin-top: 1px; }
.prod-grid-empty { padding: 48px; text-align: center; color: rgba(var(--v-theme-on-surface),.35); font-size: 13px; display: flex; flex-direction: column; align-items: center; }

/* Aligns de columnas en grid */
.col-prod-nombre { }
.col-prod-grupo { font-size: 11px; }
.col-prod-detalles { font-size: 11px; }
.col-prod-und { }
.col-prod-precio { }
.col-prod-cant { }
.col-prod-sub { }

/* Control de cantidad */
.cant-control { display: flex; align-items: center; justify-content: center; gap: 4px; }
.cant-btn { width: 26px; height: 26px; border-radius: 6px; border: 1px solid rgba(var(--v-theme-on-surface),.15); background: rgba(var(--v-theme-on-surface),.05); font-size: 16px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .1s; color: rgb(var(--v-theme-on-surface)); }
.cant-btn:hover { background: rgba(16,185,129,.15); border-color: #10b981; color: #10b981; }
.cant-input { width: 64px; height: 26px; border: 1px solid rgba(var(--v-theme-on-surface),.15); border-radius: 6px; text-align: center; font-size: 13px; font-weight: 600; padding: 0 6px; background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); outline: none; }
.cant-input--active { border-color: #10b981; background: rgba(16,185,129,.06); color: #059669; }
.cant-input:focus { border-color: #10b981; }

/* Footer */
.nueva-footer { display: flex; flex-direction: column; gap: 10px; padding: 14px 20px; border-top: 1px solid rgba(var(--v-theme-on-surface),.1); background: rgba(var(--v-theme-on-surface),.02); flex-shrink: 0; }
.nueva-footer-campos { display: flex; gap: 14px; align-items: flex-end; flex-wrap: wrap; }
.nueva-footer-actions { display: flex; align-items: center; gap: 10px; }
.footer-field { display: flex; flex-direction: column; gap: 4px; }
.footer-field-label { font-size: 10px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.4); }
.footer-resumen { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.footer-items { font-weight: 600; color: rgba(var(--v-theme-on-surface),.7); }
.footer-sep { color: rgba(var(--v-theme-on-surface),.3); }
.footer-total { font-size: 16px; font-weight: 800; color: #10b981; font-family: monospace; }

/* Soportes */
.soporte-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
.soporte-item { display: flex; flex-direction: column; align-items: center; gap: 5px; }
.soporte-img-wrap { position: relative; width: 100%; }
.soporte-img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; cursor: pointer; border: 1px solid rgba(var(--v-theme-on-surface),.1); transition: opacity .15s; display: block; }
.soporte-img:hover { opacity: .85; }
.soporte-download-btn { position: absolute; top: 6px; right: 6px; opacity: 0; transition: opacity .15s; }
.soporte-img-wrap:hover .soporte-download-btn { opacity: 1; }
.soporte-file { width: 100%; aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 8px; border: 1px dashed rgba(var(--v-theme-on-surface),.2); background: rgba(var(--v-theme-on-surface),.02); }
.soporte-name { font-size: 10px; color: rgba(var(--v-theme-on-surface),.5); text-align: center; padding: 0 4px; word-break: break-all; }
.soporte-fecha { font-size: 10px; color: rgba(var(--v-theme-on-surface),.4); }

/* Dialog detalle */
.det-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; background: linear-gradient(135deg,#065f46,#047857); flex-shrink: 0; }
.det-header-left { display: flex; align-items: center; gap: 12px; flex: 1; }
.det-icon { width: 38px; height: 38px; border-radius: 10px; background: rgba(255,255,255,.18); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.det-title { font-size: 16px; font-weight: 700; color: white; }
.det-sub { font-size: 11px; color: rgba(255,255,255,.6); margin-top: 2px; }
.det-grupo-header { padding: 10px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #059669; display: flex; align-items: center; margin-top: 10px; border-top: 1px solid rgba(var(--v-theme-on-surface),.08); }
.det-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 4px; }
.det-table th { padding: 8px 12px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.45); background: rgba(var(--v-theme-on-surface),.03); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); }
.det-table th.ta-r { text-align: right; }
.det-table td { padding: 8px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); }
.det-table tr:hover td { background: rgba(var(--v-theme-on-surface),.02); }
.det-total-section { margin-top: 16px; padding-top: 12px; border-top: 2px solid rgba(var(--v-theme-on-surface),.12); }
.det-total-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 13px; }
.det-total-label { font-weight: 700; }
.det-total-value { font-weight: 700; color: #10b981; font-family: monospace; font-size: 15px; }
.det-obs { font-size: 12px; color: rgba(var(--v-theme-on-surface),.6); display: flex; align-items: flex-start; gap: 4px; padding: 10px 14px; background: rgba(var(--v-theme-on-surface),.03); border-radius: 8px; }
.font-weight-medium { font-weight: 500; }
</style>
