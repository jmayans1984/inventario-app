<template>
  <MainLayout>
    <div class="db-container">

      <PageHeader
        title="Despachos de Bodega"
        description="Órdenes de traslado con doble verificación por scanner"
        :crumbs="['Almacén', 'Procesos', 'Despachos de Bodega']"
      >
        <template #actions>
          <v-btn variant="tonal" @click="abrirAnalisisFaltantes">
            <v-icon start>mdi-chart-line</v-icon>Análisis de Faltantes
          </v-btn>
          <v-btn color="success" variant="flat" @click="abrirNuevo">
            <v-icon start>mdi-plus</v-icon>Nueva Orden
          </v-btn>
        </template>
      </PageHeader>

      <!-- KPIs -->
      <div class="kpi-grid">
        <KpiCard :index="0" label="Pendientes" :value="String(despachos.filter(d=>d.estado==='PENDIENTE').length)" icon="mdi-clock-outline" color="var(--gold)" hint="órdenes por iniciar" />
        <KpiCard :index="1" label="En Proceso" :value="String(despachos.filter(d=>d.estado==='EN_PICKING'||d.estado==='EN_PACKING').length)" icon="mdi-hand-pointing-right" color="var(--indigo)" hint="en picking / packing" />
        <KpiCard :index="2" label="Completados" :value="String(despachos.filter(d=>d.estado==='COMPLETADO').length)" icon="mdi-check-circle-outline" color="var(--success)" hint="órdenes finalizadas" />
        <KpiCard :index="3" label="Unidades Hoy" :value="String(totalUnidades)" icon="mdi-package-variant-closed" color="var(--indigo)" hint="total despachado" />
      </div>

      <!-- FILTROS -->
      <div class="db-filtros">
        <CampoFecha
          v-model="filtroFecha"
          label="Fecha"
          density="compact"
          variant="outlined"
          hide-details
          style="max-width:180px"
        />
        <v-select
          v-model="filtroEstado"
          :items="estadoOpts"
          item-title="label"
          item-value="value"
          label="Estado"
          density="compact"
          variant="outlined"
          hide-details
          style="max-width:180px"
          @update:model-value="cargar"
        />
        <v-select
          v-model="filtroDestino"
          :items="[{codigo:'',nombre:'Todos los destinos'},...ccostos]"
          item-title="nombre"
          item-value="codigo"
          label="CC Destino"
          density="compact"
          variant="outlined"
          hide-details
          style="max-width:220px"
          @update:model-value="cargar"
        />
      </div>

      <!-- TABLA -->
      <div class="db-tabla-wrap">
        <div v-if="loading" class="db-loading">
          <v-progress-circular indeterminate color="success" size="36" />
          <span>Cargando despachos...</span>
        </div>
        <table v-else class="db-table">
          <thead>
            <tr>
              <th style="width:60px"># ORD.</th>
              <th style="width:100px">FECHA</th>
              <th>CC DESTINO</th>
              <th style="width:100px;text-align:center">ITEMS</th>
              <th style="width:110px;text-align:center">UNIDADES</th>
              <th style="width:130px;text-align:center">ESTADO</th>
              <th style="width:100px;text-align:center">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!despachosFiltrados.length">
              <td colspan="7" class="db-empty">No hay órdenes para los filtros seleccionados</td>
            </tr>
            <tr v-for="d in despachosFiltrados" :key="d.id" class="db-row">
              <td><span class="badge-id">#{{ d.id }}</span></td>
              <td class="td-fecha">{{ fmtFecha(d.fecha) }}</td>
              <td>
                <div class="td-destino">
                  <template v-if="d.tipo === 'VENTA'">
                    <span class="tipo-venta-badge"><v-icon size="12">mdi-cart-arrow-up</v-icon> VENTA</span>
                    <span class="td-oc">{{ d.cliente_nombre || d.destino_nombre || d.orden_compra }}</span>
                  </template>
                  <template v-else>
                    <v-icon size="14" color="success">mdi-store-outline</v-icon>
                    {{ d.cc_destino_nombre || d.cc_destino }}
                  </template>
                </div>
              </td>
              <td class="ta-c">{{ d.total_items }}</td>
              <td class="ta-c">{{ parseFloat(d.total_unidades || 0).toFixed(0) }}</td>
              <td class="ta-c"><span class="estado-chip" :class="`est-${d.estado}`">{{ estadoLabel(d.estado) }}</span></td>
              <td class="ta-c">
                <div class="acc-btns">
                  <v-btn icon size="x-small" variant="text" color="success" title="Ver / Editar" @click="abrirDetalle(d)">
                    <v-icon>{{ d.estado === 'PENDIENTE' && d.tipo !== 'VENTA' ? 'mdi-pencil' : 'mdi-eye' }}</v-icon>
                  </v-btn>
                  <v-btn icon size="x-small" variant="text" color="#6b7280" title="Imprimir"
                    :loading="imprimiendo === d.id"
                    @click="imprimirDesdeTabla(d)">
                    <v-icon>mdi-printer-outline</v-icon>
                  </v-btn>
                  <v-btn icon size="x-small" variant="text" color="error" title="Eliminar"
                    v-if="d.estado !== 'COMPLETADO' && d.tipo !== 'VENTA'"
                    :loading="eliminando === d.id"
                    @click="eliminar(d)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                  <v-btn icon size="x-small" variant="text" color="warning" title="Reversar (deshace los movimientos de inventario y vuelve a Packing)"
                    v-if="d.estado === 'COMPLETADO' && d.tipo !== 'VENTA'"
                    :loading="reversando === d.id"
                    @click="reversar(d)">
                    <v-icon>mdi-undo-variant</v-icon>
                  </v-btn>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ═══════════════ DIALOG CREAR / EDITAR ═══════════════ -->
      <v-dialog v-model="dlgForm" max-width="1000" scrollable>
        <v-card rounded="lg" class="dlg-card">
          <div class="dlg-header">
            <div class="dlg-header-left">
              <div class="dlg-header-icon"><v-icon color="white" size="20">mdi-truck-delivery-outline</v-icon></div>
              <div>
                <div class="dlg-title">{{ editandoId ? 'Editar Orden #' + editandoId : 'Nueva Orden de Despacho' }}</div>
                <div class="dlg-sub">Bodega principal → Punto de venta</div>
              </div>
            </div>
            <v-btn icon variant="text" color="white" size="small" @click="dlgForm=false"><v-icon>mdi-close</v-icon></v-btn>
          </div>

          <v-card-text class="pa-5" style="max-height:75vh;overflow-y:auto">
            <!-- Cabecera de la orden -->
            <div class="form-sheet mb-4">
              <div class="sheet-hdr"><v-icon size="15" color="success">mdi-information-outline</v-icon><span class="sheet-ttl">Información de la Orden</span></div>
              <v-row dense class="mt-2">
                <v-col cols="12" sm="3">
                  <CampoFecha v-model="form.fecha" label="Fecha *" density="compact" variant="outlined"
                    :error-messages="errFecha" />
                </v-col>
                <v-col cols="12" sm="3">
                  <v-text-field :model-value="ccOrigenNombre" label="CC Origen (Bodega)" density="compact"
                    variant="outlined" readonly disabled />
                </v-col>
                <v-col cols="12" sm="3">
                  <v-select v-model="form.cc_destino" :items="ccostosDestino" item-title="nombre" item-value="codigo"
                    label="CC Destino *" density="compact" variant="outlined"
                    :error-messages="errDestino" />
                </v-col>
                <v-col cols="12" sm="3">
                  <v-text-field v-model="form.observaciones" label="Observaciones" density="compact" variant="outlined" />
                </v-col>
              </v-row>
            </div>

            <!-- Verificación de inventario -->
            <div v-if="verificandoInventario" class="inv-check inv-check--loading">
              <v-progress-circular indeterminate size="14" width="2" color="#6b7280" />
              <span>Verificando inventario del día anterior...</span>
            </div>
            <div v-else-if="inventarioStatus === 'ok'" class="inv-check inv-check--ok">
              <v-icon size="16" color="success">mdi-check-circle</v-icon>
              <span>Inventario verificado — ventas del día anterior registradas</span>
            </div>
            <div v-else-if="inventarioStatus === 'warning'" class="inv-check inv-check--warn">
              <v-icon size="16" color="error">mdi-alert-circle</v-icon>
              <span>El inventario se encuentra desactualizado — no se encontraron ventas del día anterior</span>
            </div>

            <!-- Grid de productos -->
            <div class="form-sheet">
              <div class="sheet-hdr mb-3">
                <v-icon size="15" color="success">mdi-package-variant</v-icon>
                <span class="sheet-ttl">Productos a Despachar</span>
                <span class="sheet-count">{{ productosConCantidad }} con cantidad</span>
                <span v-if="totalUnidadesForm > 0" class="sheet-count sheet-count-alt">{{ totalUnidadesForm.toFixed(0) }} und. en total</span>
                <v-btn v-if="productosConCantidad > 0" variant="text" size="x-small" color="grey" class="ml-2"
                  prepend-icon="mdi-eraser" @click="cantidades={}">
                  Limpiar
                </v-btn>
                <v-spacer />
                <v-text-field
                  v-model="busquedaProducto"
                  density="compact"
                  variant="outlined"
                  hide-details
                  clearable
                  autocomplete="off"
                  placeholder="Buscar producto..."
                  prepend-inner-icon="mdi-magnify"
                  style="max-width:260px"
                />
              </div>

              <!-- Filtros y orden del grid -->
              <div v-if="form.cc_destino && !loadingGrid" class="grid-filtros">
                <v-select
                  v-model="filtroGrupo"
                  :items="gruposDisponibles"
                  item-title="nombre"
                  item-value="codigo"
                  density="compact"
                  variant="outlined"
                  hide-details
                  label="Categoría"
                  prepend-inner-icon="mdi-folder-outline"
                  style="max-width:230px"
                />
                <v-select
                  v-model="modoOrden"
                  :items="[
                    { value: 'grupo',      title: 'Agrupar por categoría' },
                    { value: 'alfabetico', title: 'Orden alfabético' },
                  ]"
                  density="compact"
                  variant="outlined"
                  hide-details
                  label="Ordenar"
                  prepend-inner-icon="mdi-sort"
                  style="max-width:210px"
                />

                <div class="gf-chips">
                  <button class="gf-chip" :class="filtroRapido==='todos' && 'gf-chip-on'" @click="filtroRapido='todos'">
                    Todos
                  </button>
                  <button class="gf-chip" :class="filtroRapido==='faltante' && 'gf-chip-on'" @click="filtroRapido='faltante'">
                    Con faltante
                  </button>
                  <button class="gf-chip" :class="filtroRapido==='concantidad' && 'gf-chip-on'" @click="filtroRapido='concantidad'">
                    Ya cargados
                  </button>
                </div>

                <v-spacer />

                <button v-if="busquedaProducto || filtroGrupo !== 'TODOS' || filtroRapido !== 'todos'"
                  class="gf-link" @click="limpiarFiltros">
                  <v-icon size="14">mdi-filter-remove-outline</v-icon> Quitar filtros
                </button>
                <v-btn v-if="faltantesSinCantidad > 0" size="small" variant="tonal" color="success"
                  prepend-icon="mdi-auto-fix" @click="llenarFaltantes"
                  title="Llena la cantidad sugerida (el faltante) en los productos visibles. Si supera el stock disponible en bodega, la fila queda marcada en rojo.">
                  Llenar {{ faltantesSinCantidad }} faltante{{ faltantesSinCantidad !== 1 ? 's' : '' }}
                </v-btn>
              </div>

              <div v-if="form.cc_destino && !loadingGrid" class="grid-resumen-filtro">
                Mostrando <strong>{{ productosFiltrados.length }}</strong> de {{ productosGrid.length }} productos
              </div>

              <!-- Sin CC destino -->
              <div v-if="!form.cc_destino" class="grid-placeholder">
                <v-icon size="32" color="rgba(var(--v-theme-on-surface),.2)">mdi-store-search-outline</v-icon>
                <p>Selecciona el CC Destino para cargar los productos</p>
              </div>

              <!-- Cargando -->
              <div v-else-if="loadingGrid" class="grid-placeholder">
                <v-progress-circular indeterminate color="success" size="28" />
                <p>Cargando productos y stock...</p>
              </div>

              <!-- Grid agrupado -->
              <table v-else class="prod-grid">
                <thead>
                  <tr>
                    <th class="pg-cod">CÓDIGO</th>
                    <th class="pg-nom">PRODUCTO</th>
                    <th class="pg-desc">DESCRIPCIÓN</th>
                    <th class="pg-stock-bodega">STOCK BODEGA</th>
                    <th class="pg-und">UND</th>
                    <th class="pg-stock">STOCK DESTINO</th>
                    <th class="pg-promedio">
                      PROMEDIO VENTAS
                      <span v-if="pctImprevistoActual > 0" class="pg-th-hint">(+{{ pctImprevistoActual }}% imprev.)</span>
                    </th>
                    <th class="pg-faltante">FALTANTE</th>
                    <th class="pg-cant">CANTIDAD A ENVIAR</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-if="productosAgrupados.length === 0">
                    <tr><td colspan="9" class="grid-empty">{{ busquedaProducto || filtroGrupo !== 'TODOS' || filtroRapido !== 'todos' ? 'Sin resultados con los filtros aplicados' : 'No hay productos con control de inventario' }}</td></tr>
                  </template>
                  <template v-for="grupo in productosAgrupados" :key="grupo.key">
                    <!-- Cabecera de grupo (se omite en orden alfabético) -->
                    <tr v-if="!grupo.plano" class="pg-grupo-row">
                      <td colspan="9" class="pg-grupo-cell">
                        <v-icon size="13" class="mr-1" style="color:#8b5cf6">mdi-folder-outline</v-icon>
                        <span class="pg-grupo-name">{{ grupo.nombre }}</span>
                        <span class="pg-grupo-count">{{ grupo.items.length }} producto{{ grupo.items.length !== 1 ? 's' : '' }}</span>
                      </td>
                    </tr>
                    <!-- Filas de productos -->
                    <tr v-for="p in grupo.items" :key="p.codigo" class="pg-prod-row"
                      :class="{
                        'pg-highlighted': cantidades[p.codigo] > 0 && cantidades[p.codigo] <= (stockDisponiblePorCodigo[p.codigo] || 0),
                        'pg-insufficient-stock': cantidades[p.codigo] > (stockDisponiblePorCodigo[p.codigo] || 0)
                      }"
                      :style="hoveredRow === p.codigo ? { background: rowHoverBg } : {}"
                      @focusin="hoveredRow = p.codigo"
                      @focusout="hoveredRow = null">
                      <td><span class="badge-cod">{{ p.codigo }}</span></td>
                      <td class="pg-td-nom">{{ p.nombre }}</td>
                      <td class="pg-td-desc">{{ p.descripcion || '—' }}</td>
                      <td class="pg-td-stock-bodega">
                        <div style="font-size:11px;color:rgba(var(--v-theme-on-surface),.5);margin-bottom:2px">Actual: <strong :class="stockPorCodigo[p.codigo] > 0 ? 'stock-pos' : 'stock-zero'">{{ parseFloat(stockPorCodigo[p.codigo] || 0).toFixed(0) }}</strong></div>
                        <div style="font-size:10px;color:rgba(var(--v-theme-on-surface),.4)">Disponible: <strong :class="stockDisponiblePorCodigo[p.codigo] > 0 ? 'stock-pos' : 'stock-zero'">{{ parseFloat(stockDisponiblePorCodigo[p.codigo] || 0).toFixed(0) }}</strong></div>
                      </td>
                      <td><span class="badge-und">{{ p.und }}</span></td>
                      <td class="pg-td-stock">
                        <span :class="(stockDestinoPorCodigo[p.codigo] || 0) > 0 ? 'stock-pos' : 'stock-zero'">
                          {{ parseFloat(stockDestinoPorCodigo[p.codigo] || 0).toFixed(0) }}
                        </span>
                      </td>
                      <td class="pg-td-promedio">
                        <template v-if="loadingPromedioVentas">
                          <v-progress-circular indeterminate size="14" width="2" color="primary" />
                        </template>
                        <template v-else-if="promedioVentas(p.codigo) !== null">
                          <span class="pg-promedio-val">{{ promedioVentas(p.codigo).toFixed(1) }}</span>
                          <v-btn icon size="x-small" variant="text" color="primary"
                            @click="abrirVentasDetalle(p)" title="Ver ventas usadas en el cálculo">
                            <v-icon size="15">mdi-eye-outline</v-icon>
                          </v-btn>
                        </template>
                        <span v-else class="pg-promedio-sin-datos">—</span>
                      </td>
                      <td class="pg-td-faltante">
                        <span v-if="faltante(p.codigo) === null" class="pg-promedio-sin-datos">—</span>
                        <span v-else-if="faltante(p.codigo) > 0" class="pg-faltante-val">{{ faltante(p.codigo).toFixed(1) }}</span>
                        <span v-else class="pg-faltante-ok">0</span>
                      </td>
                      <td class="pg-td-cant">
                        <input
                          :value="cantidades[p.codigo] || ''"
                          type="text"
                          inputmode="decimal"
                          class="pg-cant-input"
                          :class="{ 'pg-cant-active': cantidades[p.codigo] > 0 }"
                          placeholder="0"
                          @input="setCantidad(p.codigo, $event.target.value)"
                          @keydown="navegarGrid($event)"
                        />
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>

            <v-alert v-if="formError" type="error" variant="tonal" density="compact" class="mt-4">{{ formError }}</v-alert>
          </v-card-text>

          <v-divider />
          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn variant="text" @click="dlgForm=false" :disabled="guardando">Cancelar</v-btn>
            <v-btn color="success" variant="elevated" :loading="guardando" @click="guardar"
              :disabled="productosConCantidad === 0 || !form.cc_destino">
              {{ editandoId ? 'Guardar Cambios' : 'Crear Orden' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- ═══════════════ DIALOG DETALLE PROMEDIO DE VENTAS ═══════════════ -->
      <v-dialog v-model="dlgVentasDetalle" max-width="420">
        <v-card rounded="lg">
          <div class="ventas-dlg-header">
            <v-icon color="white" size="18" class="mr-2">mdi-chart-line</v-icon>
            <div>
              <div style="font-size:14px;font-weight:700;color:white">{{ ventasDetalleActivo?.nombre }}</div>
              <div style="font-size:11px;color:rgba(255,255,255,.8)">{{ ventasDetalleActivo?.codigo }}</div>
            </div>
            <v-spacer />
            <v-btn icon variant="text" color="white" size="small" @click="dlgVentasDetalle=false"><v-icon>mdi-close</v-icon></v-btn>
          </div>
          <v-card-text class="pa-4">
            <template v-if="ventasDetalleActivo && promedioVentasPorCodigo[ventasDetalleActivo.codigo]">
              <div class="ventas-dlg-sub">Ventas de los últimos {{ diasVentasUsados.length }} días con el mismo día de la semana</div>
              <table class="ventas-dlg-table">
                <thead>
                  <tr><th>FECHA</th><th class="col-r">CANTIDAD</th></tr>
                </thead>
                <tbody>
                  <tr v-for="d in promedioVentasPorCodigo[ventasDetalleActivo.codigo].detalle" :key="d.fecha">
                    <td>{{ new Date(d.fecha).toLocaleDateString('es', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' }) }}</td>
                    <td class="col-r mono">{{ parseFloat(d.cantidad).toFixed(1) }}</td>
                  </tr>
                  <tr v-if="!promedioVentasPorCodigo[ventasDetalleActivo.codigo].detalle.length">
                    <td colspan="2" style="text-align:center;padding:16px;color:rgba(var(--v-theme-on-surface),.4)">Sin ventas en esos días</td>
                  </tr>
                </tbody>
              </table>
              <div class="ventas-dlg-resumen">
                <div class="ventas-dlg-resumen-row">
                  <span>Promedio base</span>
                  <strong>{{ promedioVentasPorCodigo[ventasDetalleActivo.codigo].promedio_base.toFixed(2) }}</strong>
                </div>
                <div class="ventas-dlg-resumen-row" v-if="pctImprevistoActual > 0">
                  <span>+ {{ pctImprevistoActual }}% imprevisto</span>
                  <strong>{{ promedioVentasPorCodigo[ventasDetalleActivo.codigo].promedio.toFixed(2) }}</strong>
                </div>
              </div>
            </template>
          </v-card-text>
        </v-card>
      </v-dialog>

      <!-- ═══════════════ DIALOG DETALLE (VER / ESTADO) ═══════════════ -->
      <v-dialog v-model="dlgDetalle" max-width="680" scrollable>
        <v-card rounded="lg" class="dlg-card" v-if="detalleActivo">
          <div class="dlg-header" :style="`background:linear-gradient(135deg,${estadoColor(detalleActivo.estado)},${estadoColor(detalleActivo.estado)}cc)`">
            <div class="dlg-header-left">
              <div class="dlg-header-icon"><v-icon color="white" size="20">mdi-clipboard-text-outline</v-icon></div>
              <div>
                <div class="dlg-title">Orden #{{ detalleActivo.id }} — {{ estadoLabel(detalleActivo.estado) }}</div>
                <div class="dlg-sub">{{ fmtFecha(detalleActivo.fecha) }} · {{ detalleActivo.tipo === 'VENTA' ? (detalleActivo.cliente_nombre || detalleActivo.orden_compra) : detalleActivo.cc_destino_nombre }}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <v-btn v-if="detalleActivo.estado === 'PENDIENTE' && detalleActivo.tipo !== 'VENTA'" variant="flat"
                style="background:rgba(255,255,255,.2);color:white" size="small"
                prepend-icon="mdi-pencil" :loading="cargandoEditar" :disabled="cargandoEditar" @click="abrirEditar(detalleActivo)">
                Editar
              </v-btn>
              <v-btn icon variant="text" color="white" size="small" :disabled="cargandoEditar" @click="cerrarDetalle"><v-icon>mdi-close</v-icon></v-btn>
            </div>
          </div>

          <v-card-text class="pa-5" style="max-height:65vh;overflow-y:auto">
            <!-- Info -->
            <div class="det-info-row mb-4">
              <div class="det-info-item">
                <span class="det-lbl">CC Origen</span>
                <span class="det-val">{{ detalleActivo.cc_origen_nombre }}</span>
              </div>
              <div class="det-info-item">
                <span class="det-lbl">{{ detalleActivo.tipo === 'VENTA' ? 'Destino (Venta)' : 'CC Destino' }}</span>
                <span class="det-val">
                  <span v-if="detalleActivo.tipo === 'VENTA'" class="tipo-venta-badge" style="margin-right:6px"><v-icon size="12">mdi-cart-arrow-up</v-icon> VENTA</span>
                  {{ detalleActivo.tipo === 'VENTA' ? (detalleActivo.cliente_nombre || detalleActivo.orden_compra) : detalleActivo.cc_destino_nombre }}
                </span>
              </div>
              <div class="det-info-item">
                <span class="det-lbl">Estado</span>
                <span class="estado-chip" :class="`est-${detalleActivo.estado}`">{{ estadoLabel(detalleActivo.estado) }}</span>
              </div>
            </div>
            <div v-if="detalleActivo.observaciones" class="det-obs mb-4">{{ detalleActivo.observaciones }}</div>

            <!-- Barra de edición de cantidades. La versión light llena las
                 cantidades escaneando; acá se escriben a mano, y este botón
                 evita tener que teclear una por una cuando salió todo completo. -->
            <div v-if="puedeEditarCantidades" class="cant-toolbar mb-3">
              <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-flash"
                title="Pone la cantidad requerida en todas las líneas"
                @click="autocompletarCantidades">
                Completar todo
              </v-btn>
              <v-btn v-if="hayCambiosCantidades" size="small" variant="text" color="grey"
                prepend-icon="mdi-undo" @click="resetCantidades">
                Descartar
              </v-btn>
              <v-spacer />
              <span v-if="hayCambiosCantidades" class="cant-dirty">
                <v-icon size="13">mdi-circle-medium</v-icon>Cambios sin guardar
              </span>
            </div>

            <!-- Tabla de detalle agrupada por grupo -->
            <table class="detalle-table">
              <thead>
                <tr>
                  <th>PRODUCTO</th>
                  <th style="width:70px;text-align:center">REQ.</th>
                  <th style="width:80px;text-align:center">DESPACHADO</th>
                  <th style="width:80px;text-align:center">DIF.</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="grupo in detalleAgrupado" :key="grupo.nombre">
                  <tr class="det-grupo-row">
                    <td colspan="4" class="det-grupo-cell">{{ grupo.nombre }}</td>
                  </tr>
                  <tr v-for="item in grupo.items" :key="item.id" :class="difClass(item)">
                    <td><div class="item-nom">{{ item.producto_nombre }}</div></td>
                    <td class="ta-c num-cell">{{ item.cant_requerida }}</td>
                    <td class="ta-c num-cell">
                      <input v-if="puedeEditarCantidades && cantEdit[item.producto_codigo]"
                        v-model="cantEdit[item.producto_codigo].packing"
                        type="number" min="0" step="any" class="cant-input"
                        @focus="$event.target.select()" />
                      <template v-else>{{ item.cant_packing || 0 }}</template>
                    </td>
                    <td class="ta-c">
                      <span v-if="detalleActivo.estado==='COMPLETADO' || cantPack(item) > 0"
                        :class="difValClass(item)">
                        {{ difVal(item) }}
                      </span>
                      <span v-else class="dif-na">—</span>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </v-card-text>

          <v-divider />
          <v-card-actions class="pa-4">
            <v-btn variant="tonal" color="success" prepend-icon="mdi-printer-outline" @click="imprimirDespacho(detalleActivo)">
              Imprimir Reporte
            </v-btn>
            <v-btn v-if="puedeEditarCantidades" variant="flat" color="primary" style="color:white"
              prepend-icon="mdi-content-save-outline" :disabled="!hayCambiosCantidades"
              :loading="guardandoCantidades" @click="guardarCantidades">
              Guardar cantidades
            </v-btn>
            <v-spacer />
            <!-- Completar despacho por VENTA: genera salida por venta y pasa la orden de compra a EN REPARTO -->
            <v-btn v-if="detalleActivo.tipo === 'VENTA' && detalleActivo.estado !== 'COMPLETADO' && detalleActivo.estado !== 'CANCELADO'"
              variant="flat" color="success" style="color:white" prepend-icon="mdi-truck-check-outline"
              :loading="completandoVenta" @click="completarDespachoVenta(detalleActivo)">
              Despachar (Salida por Venta)
            </v-btn>
            <v-btn v-if="detalleActivo.estado === 'COMPLETADO' && detalleActivo.tipo !== 'VENTA'"
              variant="tonal" color="warning" prepend-icon="mdi-undo-variant"
              :loading="reversando === detalleActivo.id" @click="reversar(detalleActivo)">
              Reversar
            </v-btn>
            <v-btn variant="flat" color="error" @click="cerrarDetalle" style="color:white">Cerrar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- ═══════════════ DIALOG ANÁLISIS DE FALTANTES ═══════════════ -->
      <v-dialog v-model="dlgAnalisis" max-width="900" scrollable>
        <v-card rounded="lg" class="dlg-card">
          <div class="dlg-header" style="background:linear-gradient(135deg,#3b82f6,#2563eb)">
            <div class="dlg-header-left">
              <div class="dlg-header-icon"><v-icon color="white" size="20">mdi-chart-line</v-icon></div>
              <div>
                <div class="dlg-title">Análisis de Faltantes</div>
                <div class="dlg-sub">Qué falta para cumplir despachos PENDIENTE</div>
              </div>
            </div>
            <div style="display:flex;gap:8px">
              <v-btn icon variant="text" color="white" size="small" title="Imprimir reporte de faltantes" @click="imprimirFaltantes">
                <v-icon>mdi-printer-outline</v-icon>
              </v-btn>
              <v-btn icon variant="text" color="white" size="small" @click="dlgAnalisis=false"><v-icon>mdi-close</v-icon></v-btn>
            </div>
          </div>

          <v-card-text class="pa-5" style="max-height:75vh;overflow-y:auto">
            <div v-if="cargandoAnalisis" style="text-align:center;padding:40px">
              <v-progress-circular indeterminate color="primary" size="36" />
              <p style="margin-top:12px;color:rgba(var(--v-theme-on-surface),.5)">Analizando despachos pendientes...</p>
            </div>

            <div v-else-if="analisisFaltantes.length === 0" style="text-align:center;padding:40px;color:rgba(var(--v-theme-on-surface),.4)">
              <v-icon size="40" style="opacity:.3">mdi-check-circle-outline</v-icon>
              <p style="margin-top:12px">No hay despachos pendientes</p>
            </div>

            <div v-else>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:24px">
                <div class="ana-stat" style="--color:#ef4444">
                  <div class="ana-stat-label">CON FALTANTE</div>
                  <div class="ana-stat-val">{{ analisisFaltantes.filter(a => !a.ok).length }}</div>
                </div>
                <div class="ana-stat" style="--color:#10b981">
                  <div class="ana-stat-label">CUMPLIBLES</div>
                  <div class="ana-stat-val">{{ analisisFaltantes.filter(a => a.ok).length }}</div>
                </div>
                <div class="ana-stat" style="--color:#f59e0b">
                  <div class="ana-stat-label">UNIDADES FALTANTES</div>
                  <div class="ana-stat-val">{{ analisisFaltantes.reduce((s,a) => s + a.faltante, 0).toFixed(0) }}</div>
                </div>
              </div>

              <table class="ana-table">
                <thead>
                  <tr>
                    <th style="width:80px">CÓDIGO</th>
                    <th>PRODUCTO</th>
                    <th style="width:70px;text-align:center">UND</th>
                    <th style="width:100px;text-align:center">REQUERIDO</th>
                    <th style="width:100px;text-align:center">DISPONIBLE</th>
                    <th style="width:90px;text-align:center">FALTANTE</th>
                    <th style="width:50px;text-align:center">ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in analisisFaltantes" :key="item.codigo" :class="item.ok ? 'ana-row-ok' : 'ana-row-falta'">
                    <td><span class="badge-cod">{{ item.codigo }}</span></td>
                    <td>
                      <div style="font-weight:500;font-size:13px">{{ item.nombre }}</div>
                      <div style="font-size:11px;color:rgba(var(--v-theme-on-surface),.4)">{{ item.grupo_nombre }}</div>
                    </td>
                    <td style="text-align:center"><span class="badge-und">{{ item.und }}</span></td>
                    <td style="text-align:center;font-weight:600">{{ item.requerido.toFixed(0) }}</td>
                    <td style="text-align:center" :class="item.disponible > 0 ? 'stock-pos' : 'stock-zero'">
                      {{ item.disponible.toFixed(0) }}
                    </td>
                    <td style="text-align:center">
                      <span v-if="item.faltante > 0" style="font-weight:700;color:#ef4444">{{ item.faltante.toFixed(0) }}</span>
                      <span v-else style="color:#10b981;font-weight:700">✓</span>
                    </td>
                    <td style="text-align:center">
                      <span v-if="item.ok" style="font-size:11px;background:rgba(16,185,129,.15);color:#10b981;padding:2px 8px;border-radius:12px;font-weight:700">OK</span>
                      <span v-else style="font-size:11px;background:rgba(239,68,68,.15);color:#ef4444;padding:2px 8px;border-radius:12px;font-weight:700">FALTA</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </v-card-text>
        </v-card>
      </v-dialog>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useAuthStore } from '../../stores/auth'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import KpiCard from '../../components/common/KpiCard.vue'
import api from '../../services/api'

const auth    = useAuthStore()
const empresa = computed(() => auth.empresa)
const usuario = computed(() => localStorage.getItem('usuarioNombre') || '')

const theme      = useTheme()
const rowHoverBg = computed(() =>
  theme.current.value.dark ? 'rgba(251,191,36,.2)' : '#fee2e2'
)
const hoveredRow = ref(null)

// ── Estado ────────────────────────────────────────────────────
const despachos  = ref([])
const ccostos    = ref([])
const loading    = ref(false)
const eliminando = ref(null)
const reversando = ref(null)
const imprimiendo = ref(null)
const completandoVenta = ref(null)

// Filtros
const filtroFecha   = ref('')
const filtroEstado  = ref('')
const filtroDestino = ref('')

const estadoOpts = [
  { label: 'Todos los estados', value: '' },
  { label: 'Pendiente',   value: 'PENDIENTE' },
  { label: 'En Picking',  value: 'EN_PICKING' },
  { label: 'En Packing',  value: 'EN_PACKING' },
  { label: 'Completado',  value: 'COMPLETADO' },
  { label: 'Cancelado',   value: 'CANCELADO' },
]

// Dialog formulario
const dlgForm    = ref(false)
const editandoId = ref(null)
const guardando  = ref(false)
const formError  = ref('')
const errFecha   = ref('')
const errDestino = ref('')
const form = ref({ fecha: '', cc_origen: '', cc_destino: '', observaciones: '' })

// Grid de productos
const todosProductos  = ref([])   // lista completa control='SI' con descripcion
const stockPorCodigo  = ref({})   // { [codigo]: stock_actual } en bodega_maestra (cc_origen)
const stockDisponiblePorCodigo = ref({}) // { [codigo]: disponible } = stock_actual - reservado en PENDIENTE
const stockDestinoPorCodigo = ref({})   // { [codigo]: stock_actual } en cc_destino
const cantidades      = ref({})   // { [codigo]: number }
const loadingGrid     = ref(false)
const busquedaProducto = ref('')
const filtroGrupo     = ref('TODOS')      // codigo de grupo o 'TODOS'
const modoOrden       = ref('grupo')      // 'grupo' | 'alfabetico'
const filtroRapido    = ref('todos')      // 'todos' | 'faltante' | 'concantidad'

// Promedio de ventas (mismo día de la semana, últimos 5 con venta) + % imprevisto
const promedioVentasPorCodigo = ref({}) // { [codigo]: { promedio, promedio_base, detalle: [{fecha,cantidad}] } }
const diasVentasUsados        = ref([]) // fechas usadas para el cálculo
const pctImprevistoActual     = ref(0)
const loadingPromedioVentas   = ref(false)
const dlgVentasDetalle        = ref(false)
const ventasDetalleActivo     = ref(null) // { codigo, nombre }

// Dialog detalle
const dlgDetalle    = ref(false)
const detalleActivo = ref(null)
const cargandoEditar = ref(false)

// Edición manual de picking/packing desde la versión completa. En la light
// estas cantidades se llenan escaneando; acá se escriben a mano y se guardan
// todas juntas con el botón.
// { [producto_codigo]: { picking: '3', packing: '0' } } — se guardan como
// texto porque salen de <input>; se convierten a número al comparar y enviar.
const cantEdit            = ref({})
const guardandoCantidades = ref(false)

// Dialog análisis de faltantes
const dlgAnalisis = ref(false)
const analisisFaltantes = ref([])
const cargandoAnalisis = ref(false)

// Verificación de inventario
const inventarioStatus = ref(null) // null | 'ok' | 'warning'
const verificandoInventario = ref(false)

// ── Computed ──────────────────────────────────────────────────
const ccOrigenNombre = computed(() => {
  const cc = ccostos.value.find(c => String(c.codigo) === String(form.value.cc_origen))
  return cc ? cc.nombre : (form.value.cc_origen || '—')
})

const ccostosDestino = computed(() =>
  ccostos.value.filter(c => String(c.codigo) !== String(form.value.cc_origen))
)

const productosGrid = computed(() =>
  todosProductos.value.map(p => ({
    ...p,
    stock_actual: stockPorCodigo.value[p.codigo] ?? 0,
  }))
)

// Categorías presentes en el grid, para el selector de filtro
const gruposDisponibles = computed(() => {
  const mapa = new Map()
  for (const p of productosGrid.value) {
    const codigo = p.grupo_codigo || '__sin_grupo__'
    if (!mapa.has(codigo)) mapa.set(codigo, { codigo, nombre: p.grupo_nombre || 'Sin Grupo' })
  }
  const lista = Array.from(mapa.values()).sort((a, b) => {
    const na = parseInt(a.codigo) || 999999
    const nb = parseInt(b.codigo) || 999999
    return na - nb
  })
  return [{ codigo: 'TODOS', nombre: 'Todas las categorías' }, ...lista]
})

const productosFiltrados = computed(() => {
  const q = busquedaProducto.value?.trim().toLowerCase()
  return productosGrid.value.filter(p => {
    if (q && !(p.nombre?.toLowerCase().includes(q) || p.codigo?.toLowerCase().includes(q))) return false
    if (filtroGrupo.value !== 'TODOS' && (p.grupo_codigo || '__sin_grupo__') !== filtroGrupo.value) return false
    if (filtroRapido.value === 'faltante'    && !(faltante(p.codigo) > 0)) return false
    if (filtroRapido.value === 'concantidad' && !(parseFloat(cantidades.value[p.codigo]) > 0)) return false
    return true
  })
})

const productosAgrupados = computed(() => {
  // Modo alfabético: una sola "pseudo-categoría" con todo ordenado por nombre,
  // para poder reutilizar el mismo render agrupado de la tabla.
  if (modoOrden.value === 'alfabetico') {
    const items = [...productosFiltrados.value].sort((a, b) =>
      (a.nombre || '').localeCompare(b.nombre || '', 'es')
    )
    return items.length ? [{ key: '__todos__', nombre: '', items, plano: true }] : []
  }

  const mapa = new Map()
  for (const p of productosFiltrados.value) {
    const key    = p.grupo_codigo || '__sin_grupo__'
    const nombre = p.grupo_nombre || 'Sin Grupo'
    if (!mapa.has(key)) mapa.set(key, { key, nombre, items: [] })
    mapa.get(key).items.push(p)
  }
  for (const g of mapa.values()) {
    g.items.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'))
  }
  return Array.from(mapa.values()).sort((a, b) => {
    const na = parseInt(a.key) || 999999
    const nb = parseInt(b.key) || 999999
    return na - nb
  })
})

const productosConCantidad = computed(() =>
  Object.values(cantidades.value).filter(v => parseFloat(v) > 0).length
)

// Unidades cargadas en el formulario que se está editando/creando
// (distinto de `totalUnidades`, que es el KPI de despachado hoy)
const totalUnidadesForm = computed(() =>
  Object.values(cantidades.value).reduce((s, v) => s + (parseFloat(v) || 0), 0)
)

// Productos visibles con faltante que aún no tienen cantidad asignada
const faltantesSinCantidad = computed(() =>
  productosFiltrados.value.filter(p =>
    faltante(p.codigo) > 0 && !(parseFloat(cantidades.value[p.codigo]) > 0)
  ).length
)

// Llena la cantidad de los productos visibles con faltante. No se limita al
// stock disponible en bodega: la fila queda marcada en rojo cuando la cantidad
// supera lo disponible, para que se vea qué hay que reponer aunque no alcance.
function llenarFaltantes() {
  const next = { ...cantidades.value }
  for (const p of productosFiltrados.value) {
    const falta = faltante(p.codigo)
    if (!(falta > 0)) continue
    if (parseFloat(next[p.codigo]) > 0) continue
    next[p.codigo] = Math.ceil(falta)
  }
  cantidades.value = next
}

function limpiarFiltros() {
  busquedaProducto.value = ''
  filtroGrupo.value = 'TODOS'
  filtroRapido.value = 'todos'
}

function promedioVentas(codigo) {
  return promedioVentasPorCodigo.value[codigo]?.promedio ?? null
}

function faltante(codigo) {
  const promedio = promedioVentas(codigo)
  if (promedio === null) return null
  const stockDestino = stockDestinoPorCodigo.value[codigo] || 0
  const diff = promedio - stockDestino
  return diff > 0 ? diff : 0
}

function abrirVentasDetalle(p) {
  ventasDetalleActivo.value = { codigo: p.codigo, nombre: p.nombre }
  dlgVentasDetalle.value = true
}

const detalleAgrupado = computed(() => {
  if (!detalleActivo.value?.detalle) return []
  const mapa = new Map()
  for (const item of detalleActivo.value.detalle) {
    const key    = item.grupo_codigo || '__sin_grupo__'
    const nombre = item.grupo_nombre || 'Sin Grupo'
    if (!mapa.has(key)) mapa.set(key, { key, nombre, items: [] })
    mapa.get(key).items.push(item)
  }
  return Array.from(mapa.values()).sort((a, b) => {
    const na = parseInt(a.key) || 999999
    const nb = parseInt(b.key) || 999999
    return na - nb
  })
})

const despachosFiltrados = computed(() => {
  let lista = despachos.value
  if (filtroFecha.value)   lista = lista.filter(d => String(d.fecha).startsWith(filtroFecha.value))
  if (filtroEstado.value)  lista = lista.filter(d => d.estado === filtroEstado.value)
  if (filtroDestino.value) lista = lista.filter(d => String(d.cc_destino) === String(filtroDestino.value))
  return lista
})

const totalUnidades = computed(() => {
  const hoy = new Date().toISOString().split('T')[0]
  return despachos.value
    .filter(d => String(d.fecha).startsWith(hoy))
    .reduce((s, d) => s + parseFloat(d.total_unidades || 0), 0)
    .toFixed(0)
})

// ── Helpers ───────────────────────────────────────────────────
function fmtFecha(f) {
  if (!f) return '—'
  const d = new Date(String(f).substring(0, 10) + 'T12:00:00')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yy = d.getFullYear()
  return `${mm}/${dd}/${yy}`
}

function estadoLabel(e) {
  return { PENDIENTE:'Pendiente', EN_PICKING:'En Picking', EN_PACKING:'En Packing', COMPLETADO:'Completado', CANCELADO:'Cancelado' }[e] || e
}

function estadoColor(e) {
  return { PENDIENTE:'#f59e0b', EN_PICKING:'#3b82f6', EN_PACKING:'#8b5cf6', COMPLETADO:'#10b981', CANCELADO:'#6b7280' }[e] || '#047857'
}

// ── Edición de cantidades (picking / packing) ─────────────────
// Una orden COMPLETADA ya generó sus movimientos de inventario y una CANCELADA
// está cerrada: en ambas el backend rechaza el cambio, así que tampoco se
// ofrece acá.
const puedeEditarCantidades = computed(() =>
  !!detalleActivo.value &&
  detalleActivo.value.estado !== 'COMPLETADO' &&
  detalleActivo.value.estado !== 'CANCELADO'
)

// Cantidad efectiva: mientras se edita vale lo que hay en el formulario, no lo
// último guardado — así la columna DIF. y el color de la fila se mueven en vivo
// mientras se escribe.
//
// Solo packing. La light tiene modoEscaneo fijo en 'packing' ("siempre
// 'packing' (no hay picking)"), así que en la práctica cant_picking no se usa:
// el proceso es un solo conteo al despachar. Mostrar dos columnas acá era
// pedir un dato que nadie llena.
function cantPack(item) {
  const e = cantEdit.value[item.producto_codigo]
  return parseFloat(e ? e.packing : item.cant_packing) || 0
}

function iniciarCantEdit(orden) {
  const mapa = {}
  for (const item of orden?.detalle || []) {
    mapa[item.producto_codigo] = { packing: String(parseFloat(item.cant_packing) || 0) }
  }
  cantEdit.value = mapa
}

const hayCambiosCantidades = computed(() => {
  if (!puedeEditarCantidades.value) return false
  for (const item of detalleActivo.value?.detalle || []) {
    const e = cantEdit.value[item.producto_codigo]
    if (!e) continue
    if ((parseFloat(e.packing) || 0) !== (parseFloat(item.cant_packing) || 0)) return true
  }
  return false
})

function autocompletarCantidades() {
  for (const item of detalleActivo.value?.detalle || []) {
    const e = cantEdit.value[item.producto_codigo]
    if (!e) continue
    e.packing = String(parseFloat(item.cant_requerida) || 0)
  }
}

function resetCantidades() {
  iniciarCantEdit(detalleActivo.value)
}

async function guardarCantidades() {
  if (!detalleActivo.value || !hayCambiosCantidades.value) return
  guardandoCantidades.value = true
  try {
    // Solo se mandan las líneas que cambiaron: si alguien está escaneando en
    // paralelo desde la light, no se pisan las que acá no se tocaron.
    const items = []
    for (const item of detalleActivo.value.detalle || []) {
      const e = cantEdit.value[item.producto_codigo]
      if (!e) continue
      const pack = parseFloat(e.packing) || 0
      if (pack !== (parseFloat(item.cant_packing) || 0)) {
        items.push({ producto_codigo: item.producto_codigo, cant_packing: pack })
      }
    }
    if (!items.length) return

    await api.patch(`/almacen/despachos/${detalleActivo.value.id}/cantidades`,
      { empresa: empresa.value, items })

    // Se recarga desde el servidor en vez de parchear el objeto local: así lo
    // que queda en pantalla es lo que de verdad quedó guardado, incluidos los
    // escaneos que hayan entrado mientras tanto desde la versión light.
    const res = await api.get(`/almacen/despachos/${detalleActivo.value.id}`,
      { params: { empresa: empresa.value } })
    detalleActivo.value = res.data?.data
    iniciarCantEdit(detalleActivo.value)
    await cargar()   // los totales de la tabla de atrás dependen de estas cantidades
  } catch (e) {
    alert(e?.response?.data?.error || 'Error al guardar las cantidades')
  } finally {
    guardandoCantidades.value = false
  }
}

function difVal(item) {
  const base = cantPack(item)
  const req  = parseFloat(item.cant_requerida) || 0
  const dif  = base - req
  if (dif === 0) return '✓'
  return (dif > 0 ? '+' : '') + dif
}

function difValClass(item) {
  const base = cantPack(item)
  const req  = parseFloat(item.cant_requerida) || 0
  const dif  = base - req
  if (dif === 0) return 'dif-ok'
  return dif > 0 ? 'dif-sobre' : 'dif-falta'
}

function difClass(item) {
  const base = cantPack(item)
  const req  = parseFloat(item.cant_requerida) || 0
  if (base === 0) return ''
  const dif  = base - req
  if (dif < 0) return 'row-falta'
  if (dif > 0) return 'row-sobre'
  return ''
}

function setCantidad(codigo, val) {
  if (!val || val === '-' || val.endsWith('.') || val.endsWith(',')) return
  const n = parseFloat(String(val).replace(',', '.'))
  const nuevo = { ...cantidades.value }
  if (isNaN(n) || n <= 0) delete nuevo[codigo]
  else nuevo[codigo] = n
  cantidades.value = nuevo
}

function navegarGrid(event) {
  const { key } = event
  if (key !== 'Enter' && key !== 'ArrowDown' && key !== 'ArrowUp') return
  event.preventDefault()
  const inputs = Array.from(document.querySelectorAll('.pg-cant-input'))
  const idx    = inputs.indexOf(event.target)
  if (idx === -1) return
  const delta  = key === 'ArrowUp' ? -1 : 1
  const target = inputs[idx + delta]
  if (target) { target.focus(); target.select() }
}

// ── Carga de datos ────────────────────────────────────────────
async function cargar() {
  loading.value = true
  try {
    const res = await api.get('/almacen/despachos', { params: { empresa: empresa.value } })
    despachos.value = res.data?.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function cargarCcostos() {
  try {
    const res = await api.get('/ccostos', { params: { empresa: empresa.value } })
    ccostos.value = res.data?.data || res.data?.ccostos || []
  } catch { /* */ }
}

async function cargarGrid(ccDestino) {
  if (!ccDestino) { todosProductos.value = []; stockPorCodigo.value = {}; stockDisponiblePorCodigo.value = {}; stockDestinoPorCodigo.value = {}; return }
  loadingGrid.value = true
  try {
    const ccOrigen = form.value.cc_origen
    const fechaHoy = new Date().toISOString().split('T')[0]

    const [resProds, resStockBodega, resDespachos, resStockDestino] = await Promise.all([
      api.get('/almacen/productos', { params: { empresa: empresa.value } }),
      api.get('/almacen/ajuste-inventario/stock', { params: { empresa: empresa.value, ccosto: ccOrigen } }),
      api.get('/almacen/despachos', { params: { empresa: empresa.value, estado: 'PENDIENTE', fecha: fechaHoy, include_detalle: '1' } }),
      api.get('/almacen/ajuste-inventario/stock', { params: { empresa: empresa.value, ccosto: ccDestino } }),
    ])

    // Productos con control='SI' y sus datos
    const todos = resProds.data?.data || []
    todosProductos.value = todos
      .filter(p => p.control === 'SI')
      .map(p => ({
        codigo:      p.codigo,
        nombre:      p.nombre,
        descripcion: p.descripcion || '',
        und:         p.und,
        grupo_codigo: p.grupo || '__sin_grupo__',
        grupo_nombre: p.grupo_nombre || 'Sin Grupo',
      }))

    // Stock de bodega_maestra (cc_origen)
    const stockRows = resStockBodega.data?.data || []
    stockPorCodigo.value = {}
    for (const r of stockRows) {
      stockPorCodigo.value[r.codigo] = parseFloat(r.stock_actual) || 0
    }

    // Calcular cantidad reservada en órdenes PENDIENTE del mismo día
    const reservadoPorCodigo = {}
    const despachosPendientes = resDespachos.data?.data || []
    for (const despacho of despachosPendientes) {
      for (const item of despacho.detalle || []) {
        const cod = item.producto_codigo
        reservadoPorCodigo[cod] = (reservadoPorCodigo[cod] || 0) + parseFloat(item.cant_requerida || 0)
      }
    }

    // Stock disponible = actual - reservado
    stockDisponiblePorCodigo.value = {}
    for (const codigo of Object.keys(stockPorCodigo.value)) {
      const actual = stockPorCodigo.value[codigo]
      const reservado = reservadoPorCodigo[codigo] || 0
      stockDisponiblePorCodigo.value[codigo] = Math.max(0, actual - reservado)
    }

    // Stock del cc_destino
    stockDestinoPorCodigo.value = {}
    for (const r of (resStockDestino.data?.data || [])) {
      stockDestinoPorCodigo.value[r.codigo] = parseFloat(r.stock_actual) || 0
    }
  } catch (e) {
    console.error('Error cargando grid:', e)
  } finally {
    loadingGrid.value = false
  }
}

async function verificarInventario(ccDestino) {
  if (!ccDestino || !form.value.fecha) { inventarioStatus.value = null; return }
  // Calcular fecha anterior (fecha del formulario - 1 día)
  const d = new Date(form.value.fecha + 'T12:00:00')
  d.setDate(d.getDate() - 1)
  const fechaAnterior = d.toISOString().split('T')[0]
  verificandoInventario.value = true
  inventarioStatus.value = null
  try {
    const res = await api.get('/almacen/verificar-inventario', {
      params: { empresa: empresa.value, ccosto: ccDestino, fecha: fechaAnterior }
    })
    inventarioStatus.value = res.data?.existe ? 'ok' : 'warning'
  } catch { inventarioStatus.value = null }
  finally { verificandoInventario.value = false }
}

async function cargarPromedioVentas(ccDestino, fecha) {
  if (!ccDestino || !fecha) {
    promedioVentasPorCodigo.value = {}
    diasVentasUsados.value = []
    return
  }
  loadingPromedioVentas.value = true
  try {
    const res = await api.get('/almacen/promedio-ventas-dia-semana', {
      params: { empresa: empresa.value, ccosto: ccDestino, fecha }
    })
    const data = res.data?.data || {}
    promedioVentasPorCodigo.value = data.productos || {}
    diasVentasUsados.value = data.dias || []
    pctImprevistoActual.value = parseFloat(data.pct_imprevisto) || 0
  } catch (e) {
    console.error('Error cargando promedio de ventas:', e)
    promedioVentasPorCodigo.value = {}
    diasVentasUsados.value = []
  } finally {
    loadingPromedioVentas.value = false
  }
}

// Recargar grid cuando cambia cc_destino
watch(() => form.value.cc_destino, (val) => {
  cantidades.value = {}
  cargarGrid(val)
  verificarInventario(val)
  cargarPromedioVentas(val, form.value.fecha)
})

// Recalcular promedio de ventas cuando cambia la fecha (el día de la semana cambia)
watch(() => form.value.fecha, (val) => {
  if (form.value.cc_destino) cargarPromedioVentas(form.value.cc_destino, val)
})

// ── CRUD ──────────────────────────────────────────────────────
function abrirNuevo() {
  editandoId.value = null
  formError.value  = ''
  errFecha.value   = ''
  errDestino.value = ''
  cantidades.value = {}
  busquedaProducto.value = ''
  filtroGrupo.value  = 'TODOS'
  filtroRapido.value = 'todos'
  todosProductos.value  = []
  stockPorCodigo.value  = {}
  stockDisponiblePorCodigo.value = {}
  stockDestinoPorCodigo.value = {}
  promedioVentasPorCodigo.value = {}
  diasVentasUsados.value = []
  inventarioStatus.value = null
  const bodega = ccostos.value[0]
  form.value = {
    fecha: new Date().toISOString().split('T')[0],
    cc_origen: bodega?.codigo || '',
    cc_destino: '',
    observaciones: '',
  }
  dlgForm.value = true
}

async function abrirEditar(d) {
  // El popup de resumen se queda abierto (con el botón "Editar" en estado de
  // carga) mientras se trae el detalle y el grid de productos — antes se
  // cerraba de inmediato y quedaban 6-7 segundos sin ningún dialogo abierto
  // ni indicio de que algo estaba pasando.
  cargandoEditar.value = true
  editandoId.value = d.id
  formError.value  = ''
  errFecha.value   = ''
  errDestino.value = ''
  cantidades.value = {}
  busquedaProducto.value = ''
  filtroGrupo.value  = 'TODOS'
  filtroRapido.value = 'todos'
  todosProductos.value = []
  stockPorCodigo.value = {}
  stockDisponiblePorCodigo.value = {}
  try {
    const res = await api.get(`/almacen/despachos/${d.id}`, { params: { empresa: empresa.value } })
    const orden = res.data?.data
    form.value = {
      fecha: String(orden.fecha).split('T')[0],
      cc_origen: orden.cc_origen,
      cc_destino: orden.cc_destino,
      observaciones: orden.observaciones || '',
    }
    // Pre-popular cantidades desde el detalle existente
    const prevCant = {}
    for (const item of orden.detalle) {
      prevCant[item.producto_codigo] = parseFloat(item.cant_requerida)
    }
    // Cargar grid del cc_destino y luego restaurar cantidades
    await cargarGrid(orden.cc_destino)
    cantidades.value = prevCant
    cargarPromedioVentas(orden.cc_destino, form.value.fecha)
    dlgDetalle.value = false
    dlgForm.value = true
  } catch (e) {
    console.error(e)
  } finally {
    cargandoEditar.value = false
  }
}

function validar() {
  errFecha.value   = !form.value.fecha      ? 'Requerido' : ''
  errDestino.value = !form.value.cc_destino ? 'Requerido' : ''
  return !errFecha.value && !errDestino.value
}

async function guardar() {
  if (!validar()) return
  guardando.value = true
  formError.value = ''
  try {
    const detalle = Object.entries(cantidades.value)
      .filter(([, v]) => parseFloat(v) > 0)
      .map(([codigo, cant]) => ({ producto_codigo: codigo, cant_requerida: parseFloat(cant) }))

    const payload = {
      empresa: empresa.value,
      fecha: form.value.fecha,
      cc_origen: form.value.cc_origen,
      cc_destino: form.value.cc_destino,
      observaciones: form.value.observaciones,
      creado_por: usuario.value,
      detalle,
    }
    if (editandoId.value) {
      await api.put(`/almacen/despachos/${editandoId.value}`, payload)
    } else {
      await api.post('/almacen/despachos', payload)
    }
    dlgForm.value = false
    await cargar()
  } catch (e) {
    formError.value = e?.response?.data?.error || e.message || 'Error al guardar'
  } finally {
    guardando.value = false
  }
}

async function abrirAnalisisFaltantes() {
  dlgAnalisis.value = true
  cargandoAnalisis.value = true
  analisisFaltantes.value = []
  try {
    const ccOrigen = ccostos.value[0]?.codigo
    const [resDespachos, resStock] = await Promise.all([
      api.get('/almacen/despachos', { params: { empresa: empresa.value, estado: 'PENDIENTE', include_detalle: '1' } }),
      api.get('/almacen/ajuste-inventario/stock', { params: { empresa: empresa.value, ccosto: ccOrigen } }),
    ])

    const despachosPendientes = resDespachos.data?.data || []
    const stockBodega = {}
    const stockRows = resStock.data?.data || []
    for (const r of stockRows) {
      stockBodega[r.codigo] = parseFloat(r.stock_actual) || 0
    }

    // Agrupar por producto: cantidad total requerida en pendientes
    const requeridoPorCodigo = {}
    const productoInfo = {}
    for (const despacho of despachosPendientes) {
      for (const item of despacho.detalle || []) {
        const cod = item.producto_codigo
        requeridoPorCodigo[cod] = (requeridoPorCodigo[cod] || 0) + parseFloat(item.cant_requerida || 0)
        if (!productoInfo[cod]) {
          productoInfo[cod] = {
            codigo: item.producto_codigo,
            nombre: item.producto_nombre,
            und: item.und,
            grupo_nombre: item.grupo_nombre || 'Sin Grupo',
          }
        }
      }
    }

    // Armar análisis
    analisisFaltantes.value = Object.keys(requeridoPorCodigo)
      .map(cod => {
        const requerido = requeridoPorCodigo[cod]
        const disponible = stockBodega[cod] || 0
        const faltante = Math.max(0, requerido - disponible)
        return {
          ...productoInfo[cod],
          requerido,
          disponible,
          faltante,
          ok: faltante === 0,
        }
      })
      .sort((a, b) => {
        if (a.ok !== b.ok) return a.ok ? 1 : -1
        return b.faltante - a.faltante
      })
  } catch (e) {
    console.error('Error cargando análisis:', e)
  } finally {
    cargandoAnalisis.value = false
  }
}

async function abrirDetalle(d) {
  dlgDetalle.value  = true
  detalleActivo.value = null
  cantEdit.value = {}
  try {
    const res = await api.get(`/almacen/despachos/${d.id}`, { params: { empresa: empresa.value } })
    detalleActivo.value = res.data?.data
    iniciarCantEdit(detalleActivo.value)
  } catch (e) {
    console.error(e)
  }
}

// Cerrar el diálogo con cantidades escritas y sin guardar las perdería sin
// aviso — justo el caso de quien usa "Completar todo" y no se fija en el botón.
function cerrarDetalle() {
  if (hayCambiosCantidades.value &&
      !confirm('Hay cantidades sin guardar. ¿Cerrar y descartar los cambios?')) return
  dlgDetalle.value = false
}

async function completarDespachoVenta(d) {
  if (!confirm(`¿Confirmar el despacho por venta #${d.id}? Se generará la salida por venta desde la bodega maestra y la orden de compra pasará a EN REPARTO.`)) return
  completandoVenta.value = true
  try {
    await api.post(`/almacen/despachos/${d.id}/confirmar`, { empresa: empresa.value })
    dlgDetalle.value = false
    await cargar()
  } catch (e) {
    alert(e?.response?.data?.error || 'Error al completar el despacho')
  } finally {
    completandoVenta.value = null
  }
}

async function eliminar(d) {
  if (!confirm(`¿Eliminar la orden #${d.id}?`)) return
  eliminando.value = d.id
  try {
    await api.delete(`/almacen/despachos/${d.id}`, { params: { empresa: empresa.value } })
    await cargar()
  } catch (e) {
    alert(e?.response?.data?.error || 'Error al eliminar')
  } finally {
    eliminando.value = null
  }
}

// Deshace los movimientos de inventario que generó una orden COMPLETADA y la
// regresa a EN_PACKING — el picking/packing quedan como estaban, solo hay que
// volver a confirmar. No aplica a despachos de VENTA (afectan también la
// Orden de Compra asociada).
async function reversar(d) {
  if (!confirm(`¿Reversar la orden #${d.id}? Se eliminarán los movimientos de inventario que generó (traslado ${d.cc_origen_nombre || d.cc_origen} → ${d.cc_destino_nombre || d.cc_destino}) y la orden volverá a EN PACKING para poder confirmarla de nuevo.`)) return
  reversando.value = d.id
  try {
    const res = await api.post(`/almacen/despachos/${d.id}/revertir`, { empresa: empresa.value })
    dlgDetalle.value = false
    await cargar()
    alert(`Orden #${d.id} reversada — ${res.data?.movimientos_eliminados ?? 0} movimiento(s) de inventario eliminado(s).`)
  } catch (e) {
    alert(e?.response?.data?.error || 'Error al reversar la orden')
  } finally {
    reversando.value = null
  }
}

// ── Imprimir ──────────────────────────────────────────────────
async function imprimirDesdeTabla(d) {
  imprimiendo.value = d.id
  try {
    const res = await api.get(`/almacen/despachos/${d.id}`, { params: { empresa: empresa.value } })
    imprimirDespacho(res.data?.data)
  } catch (e) {
    console.error(e)
  } finally {
    imprimiendo.value = null
  }
}

function imprimirDespacho(o) {
  if (!o) o = detalleActivo.value
  if (!o) return

  // Agrupar detalle por grupo_nombre
  const gruposMap = new Map()
  for (const item of o.detalle) {
    const key = item.grupo_codigo || '__sin_grupo__'
    const nombre = item.grupo_nombre || 'Sin Grupo'
    if (!gruposMap.has(key)) gruposMap.set(key, { nombre, items: [] })
    gruposMap.get(key).items.push(item)
  }

  let filas = ''
  for (const [, grupo] of gruposMap) {
    filas += `<tr>
      <td colspan="6" style="padding:3px 8px;background:#f3f0ff;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#7c3aed;border-bottom:1px solid #e5e7eb">
        ${grupo.nombre}
      </td>
    </tr>`
    for (const item of grupo.items) {
      const despachado = parseFloat(item.cant_packing) > 0
        ? parseFloat(item.cant_packing)
        : parseFloat(item.cant_picking || 0)
      filas += `<tr>
        <td style="padding:3px 8px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:10px">${item.producto_codigo}</td>
        <td style="padding:3px 8px;border-bottom:1px solid #e5e7eb;font-weight:600;font-size:10px">${item.producto_nombre}</td>
        <td style="padding:3px 8px;border-bottom:1px solid #e5e7eb;color:#555;font-size:9px">${item.descripcion || '—'}</td>
        <td style="padding:3px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:10px">${item.und}</td>
        <td style="padding:3px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700;font-size:10px">${parseFloat(item.cant_requerida)}</td>
        <td style="padding:3px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700;font-size:10px;color:#047857">${despachado}</td>
      </tr>`
    }
  }

  const color = estadoColor(o.estado)
  const estadoNames = { PENDIENTE:'Pendiente', EN_PICKING:'En Picking', EN_PACKING:'En Packing', COMPLETADO:'Completado', CANCELADO:'Cancelado' }

  const ventana = window.open('', '_blank')
  ventana.document.write(`<!DOCTYPE html><html><head>
  <meta charset="UTF-8">
  <title>Reporte Despacho #${o.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 30px; }
    .encabezado { border-left: 5px solid ${color}; padding: 0 0 0 14px; margin-bottom: 24px; }
    .encabezado h1 { font-size: 20px; font-weight: 800; }
    .encabezado p  { font-size: 12px; color: #555; margin-top: 3px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; background: ${color}22; color: ${color}; }
    .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 20px; }
    .meta-item label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #6b7280; display: block; }
    .meta-item span  { font-size: 13px; font-weight: 600; margin-top: 2px; display: block; }
    table { width: 100%; border-collapse: collapse; }
    thead th { padding: 5px 8px; background: #f3f4f6; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; text-align: left; border-bottom: 2px solid #d1d5db; }
    .firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 50px; }
    .firma-linea { border-top: 1px solid #000; padding-top: 8px; text-align: center; font-size: 12px; color: #555; }
    @media print { body { padding: 15px; } }
  </style>
  </head><body>
  <div class="encabezado">
    <h1>REPORTE DE DESPACHO</h1>
    <p>Orden #${o.id} &nbsp;·&nbsp; ${fmtFecha(o.fecha)} &nbsp;·&nbsp; <span class="badge">${estadoNames[o.estado] || o.estado}</span></p>
  </div>
  <div class="meta-grid">
    <div class="meta-item"><label>CC Origen</label><span>${o.cc_origen_nombre}</span></div>
    <div class="meta-item"><label>CC Destino</label><span>${o.cc_destino_nombre}</span></div>
    <div class="meta-item"><label>Observaciones</label><span>${o.observaciones || '—'}</span></div>
  </div>
  <table>
    <thead><tr>
      <th style="width:90px">CÓDIGO</th>
      <th>PRODUCTO</th>
      <th>DESCRIPCIÓN</th>
      <th style="width:55px;text-align:center">UND</th>
      <th style="width:80px;text-align:center">REQUERIDO</th>
      <th style="width:80px;text-align:center">DESPACHADO</th>
    </tr></thead>
    <tbody>${filas}</tbody>
  </table>
  <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`)
  ventana.document.close()
}

function imprimirFaltantes() {
  const faltantesFilt = analisisFaltantes.value.filter(a => a.faltante > 0)
  if (faltantesFilt.length === 0) {
    alert('No hay productos con faltante para imprimir')
    return
  }

  // Agrupar por grupo_nombre
  const gruposMap = new Map()
  for (const item of faltantesFilt) {
    const key = item.grupo_nombre || 'Sin Grupo'
    if (!gruposMap.has(key)) gruposMap.set(key, [])
    gruposMap.get(key).push(item)
  }

  let filas = ''
  for (const [, items] of gruposMap) {
    filas += `<tr>
      <td colspan="5" style="padding:3px 8px;background:#f3f0ff;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#7c3aed;border-bottom:1px solid #e5e7eb">
        ${items[0].grupo_nombre || 'Sin Grupo'}
      </td>
    </tr>`
    for (const item of items) {
      filas += `<tr>
        <td style="padding:3px 8px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:10px">${item.codigo}</td>
        <td style="padding:3px 8px;border-bottom:1px solid #e5e7eb;font-weight:600;font-size:10px">${item.nombre}</td>
        <td style="padding:3px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:10px">${item.und}</td>
        <td style="padding:3px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700;font-size:10px">${item.faltante.toFixed(0)}</td>
        <td style="padding:3px 8px;border-bottom:1px solid #e5e7eb;text-align:center;color:#dc2626;font-weight:700;font-size:10px">FALTA</td>
      </tr>`
    }
  }

  const ventana = window.open('', '_blank')
  ventana.document.write(`<!DOCTYPE html><html><head>
  <meta charset="UTF-8">
  <title>Reporte Faltantes</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 30px; }
    .encabezado { border-left: 5px solid #3b82f6; padding: 0 0 0 14px; margin-bottom: 24px; }
    .encabezado h1 { font-size: 20px; font-weight: 800; }
    .encabezado p  { font-size: 12px; color: #555; margin-top: 3px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; background: #3b82f622; color: #3b82f6; }
    .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 20px; }
    .meta-item label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #6b7280; display: block; }
    .meta-item span  { font-size: 13px; font-weight: 600; margin-top: 2px; display: block; }
    table { width: 100%; border-collapse: collapse; }
    thead th { padding: 5px 8px; background: #f3f4f6; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; text-align: left; border-bottom: 2px solid #d1d5db; }
    tbody td { padding: 5px 8px; }
    .firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 50px; }
    .firma-linea { border-top: 1px solid #000; padding-top: 8px; text-align: center; font-size: 12px; color: #555; }
    @media print { body { padding: 15px; } }
  </style>
  </head><body>
  <div class="encabezado">
    <h1>REPORTE DE FALTANTES</h1>
    <p>Productos necesarios para cumplir despachos pendientes &nbsp;·&nbsp; <span class="badge">Análisis</span></p>
  </div>
  <div class="meta-grid">
    <div class="meta-item"><label>Productos Faltantes</label><span>${faltantesFilt.length}</span></div>
    <div class="meta-item"><label>Unidades Faltantes</label><span>${faltantesFilt.reduce((s,a) => s + a.faltante, 0).toFixed(0)}</span></div>
  </div>
  <table>
    <thead><tr>
      <th style="width:90px">CÓDIGO</th>
      <th>PRODUCTO</th>
      <th style="width:55px;text-align:center">UND</th>
      <th style="width:80px;text-align:center">FALTANTE</th>
      <th style="width:70px;text-align:center">ESTADO</th>
    </tr></thead>
    <tbody>${filas}</tbody>
  </table>
  <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`)
  ventana.document.close()
}

onMounted(async () => {
  await cargarCcostos()
  if (ccostos.value.length) form.value.cc_origen = ccostos.value[0].codigo
  await cargar()
})
</script>

<style scoped>
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }

.db-container { padding: 24px; max-width: 1200px; margin: 0 auto; }

/* Breadcrumb */
.db-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root    { font-size: 12px; font-weight: 700; color: var(--success); text-transform: uppercase; letter-spacing: .5px; }
.bc-sep     { color: rgba(var(--v-theme-on-surface),.3); }
.bc-cat     { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface),.8); font-weight: 500; }

/* Header */
.db-header      { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.db-header-left { display: flex; align-items: center; gap: 16px; }
.db-icon-wrap   { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,var(--success),var(--success)); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(4,120,87,.35); flex-shrink: 0; }
.db-title       { font-size: 20px; font-weight: 800; letter-spacing: .5px; margin: 0; }
.db-sub         { font-size: 13px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }

/* KPIs */

/* Filtros */
.db-filtros { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }

/* Tabla principal */
.db-tabla-wrap { background: rgb(var(--v-theme-surface)); border-radius: 12px; border: 1px solid rgba(var(--v-theme-on-surface),.08); overflow: hidden; }
.db-loading    { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 50px; color: rgba(var(--v-theme-on-surface),.5); }
.db-table      { width: 100%; border-collapse: collapse; font-size: 13px; }
.db-table thead { background: rgba(var(--v-theme-on-surface),.04); }
.db-table thead th { padding: 11px 14px; text-align: left; font-weight: 700; font-size: 11px; letter-spacing: .5px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.6); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); }
.db-row { border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); }
.db-row:hover { background: rgba(var(--v-theme-on-surface),.02); }
.db-table tbody td { padding: 10px 14px; vertical-align: middle; }
.db-empty { text-align: center !important; padding: 50px 20px !important; color: rgba(var(--v-theme-on-surface),.4); font-size: 13px; }
.ta-c { text-align: center; }

.badge-id  { background: rgba(4,120,87,.12); color: var(--success); padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 12px; font-family: monospace; }
.badge-cod { background: rgba(6,182,212,.12); color: var(--indigo); padding: 2px 7px; border-radius: 6px; font-weight: 700; font-size: 11px; font-family: monospace; }
.badge-und { background: rgba(139,92,246,.12); color: var(--indigo); padding: 2px 7px; border-radius: 5px; font-size: 11px; font-weight: 600; }
.td-fecha   { font-size: 12px; color: rgba(var(--v-theme-on-surface),.7); }
.td-destino { display: flex; align-items: center; gap: 6px; font-weight: 500; flex-wrap: wrap; }
.tipo-venta-badge { display: inline-flex; align-items: center; gap: 3px; background: rgba(217,119,6,.14); color: #b45309; font-size: 10px; font-weight: 800; letter-spacing: .5px; padding: 2px 7px; border-radius: 10px; }
.td-oc { font-size: 12px; color: rgba(var(--v-theme-on-surface),.7); }
.acc-btns   { display: inline-flex; align-items: center; gap: 2px; }

/* Estado chips */
.estado-chip { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .3px; display: inline-block; }
.est-PENDIENTE  { background: rgba(245,158,11,.12); color: var(--gold); }
.est-EN_PICKING { background: rgba(59,130,246,.12); color: var(--indigo); }
.est-EN_PACKING { background: rgba(139,92,246,.12); color: var(--indigo); }
.est-COMPLETADO { background: rgba(16,185,129,.12); color: var(--success); }
.est-CANCELADO  { background: rgba(107,114,128,.12); color: #6b7280; }

/* Dialog */
.dlg-card { overflow: visible !important; }
.dlg-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; background: linear-gradient(135deg,var(--success),var(--success)); }

.ventas-dlg-header { display: flex; align-items: center; padding: 14px 16px; background: linear-gradient(135deg,var(--indigo),var(--indigo)); }
.ventas-dlg-sub { font-size: 11px; color: rgba(var(--v-theme-on-surface),.5); margin-bottom: 10px; }
.ventas-dlg-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.ventas-dlg-table th { text-align: left; padding: 6px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.45); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); }
.ventas-dlg-table td { padding: 6px 8px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); }
.ventas-dlg-table .col-r { text-align: right; }
.ventas-dlg-table .mono { font-family: monospace; }
.ventas-dlg-resumen { margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(var(--v-theme-on-surface),.08); }
.ventas-dlg-resumen-row { display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; color: rgba(var(--v-theme-on-surface),.65); }
.ventas-dlg-resumen-row strong { color: var(--indigo); font-family: monospace; }
.dlg-header-left { display: flex; align-items: center; gap: 12px; }
.dlg-header-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(255,255,255,.2); display: flex; align-items: center; justify-content: center; }
.dlg-title { font-size: 16px; font-weight: 700; color: white; }
.dlg-sub   { font-size: 12px; color: rgba(255,255,255,.8); margin-top: 2px; }

/* Form sheets */
.form-sheet { padding: 16px; background: rgba(var(--v-theme-on-surface),.02); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 10px; }
.sheet-hdr  { display: flex; align-items: center; gap: 8px; }
.sheet-ttl  { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: rgba(var(--v-theme-on-surface),.8); }
.sheet-count{ font-size: 11px; color: rgba(var(--v-theme-on-surface),.4); margin-left: auto; }

.sheet-count-alt { margin-left: 0; padding-left: 8px; border-left: 1px solid rgba(var(--v-theme-on-surface),.15); }

/* Filtros del grid */
.grid-filtros {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 10px 0 12px; margin-bottom: 10px;
  border-bottom: 1px dashed rgba(var(--v-theme-on-surface),.12);
}
.gf-chips { display: flex; gap: 5px; flex-wrap: wrap; }
.gf-chip {
  border: 1px solid rgba(var(--v-theme-on-surface),.14);
  background: transparent; color: rgba(var(--v-theme-on-surface),.6);
  font-size: 11.5px; font-weight: 600;
  padding: 5px 11px; border-radius: 20px; cursor: pointer;
  transition: border-color 150ms var(--ease-out), background-color 150ms var(--ease-out), color 150ms var(--ease-out);
}
.gf-chip:hover { border-color: var(--success); color: var(--success); }
.gf-chip-on {
  background: color-mix(in srgb, var(--success) 14%, transparent);
  border-color: var(--success); color: var(--success);
}
.gf-link {
  display: flex; align-items: center; gap: 4px;
  border: none; background: transparent; cursor: pointer;
  font-size: 11.5px; font-weight: 600; color: rgba(var(--v-theme-on-surface),.5);
  padding: 4px 8px; border-radius: 7px;
}
.gf-link:hover { background: rgba(var(--v-theme-on-surface),.06); color: rgb(var(--v-theme-on-surface)); }
.grid-resumen-filtro { font-size: 11px; color: rgba(var(--v-theme-on-surface),.45); margin-bottom: 8px; }

@media (prefers-reduced-motion: reduce) {
  .gf-chip { transition: none; }
}

/* Placeholders del grid */
.grid-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 40px; color: rgba(var(--v-theme-on-surface),.4); font-size: 13px; }

/* Grid de productos */
.prod-grid { width: 100%; border-collapse: collapse; font-size: 12px; }
.prod-grid thead { background: rgba(var(--v-theme-on-surface),.04); }
.prod-grid thead th { padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: rgba(var(--v-theme-on-surface),.5); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); }
.pg-cod   { width: 90px; }
.pg-nom   { width: 200px; }
.pg-desc  { }
.pg-stock-bodega { width: 140px; }
.pg-und   { width: 60px; }
.pg-stock { width: 110px; text-align: center !important; }
.pg-promedio { width: 130px; text-align: center !important; }
.pg-faltante { width: 90px; text-align: center !important; }
.pg-cant  { width: 130px; text-align: right !important; }
.pg-th-hint { display: block; font-size: 9px; font-weight: 600; color: var(--indigo); text-transform: none; letter-spacing: 0; margin-top: 1px; }

.pg-grupo-row  { background: rgba(139,92,246,.06); }
.pg-grupo-cell { padding: 6px 10px !important; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.06) !important; }
.pg-grupo-name { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--indigo); }
.pg-grupo-count{ font-size: 11px; color: rgba(var(--v-theme-on-surface),.4); margin-left: 8px; }

.pg-prod-row { border-bottom: 1px solid rgba(var(--v-theme-on-surface),.04); }
.pg-prod-row:hover { background: rgba(var(--v-theme-on-surface),.02); }
.pg-highlighted { background: rgba(4,120,87,.04) !important; }
.pg-highlighted:hover { background: rgba(4,120,87,.07) !important; }
.pg-insufficient-stock { background: rgba(239, 68, 68, .08) !important; }
.pg-insufficient-stock:hover { background: rgba(239, 68, 68, .12) !important; }
.prod-grid tbody td { padding: 6px 10px; vertical-align: middle; }
.pg-td-nom   { font-weight: 500; }
.pg-td-desc  { font-size: 11px; color: rgba(var(--v-theme-on-surface),.5); }
.pg-td-stock-bodega { font-size: 11px; }
.pg-td-stock { text-align: center; font-family: monospace; font-size: 13px; font-weight: 600; }
.pg-td-promedio { text-align: center; white-space: nowrap; }
.pg-td-faltante { text-align: center; font-family: monospace; font-size: 13px; font-weight: 700; }
.pg-td-cant  { text-align: right; }
.stock-pos  { color: var(--success); }
.stock-zero { color: rgba(var(--v-theme-on-surface),.35); }
.pg-promedio-val { font-family: monospace; font-size: 13px; font-weight: 600; color: var(--indigo); }
.pg-promedio-sin-datos { color: rgba(var(--v-theme-on-surface),.3); font-size: 12px; }
.pg-faltante-val { color: var(--error); }
.pg-faltante-ok  { color: rgba(var(--v-theme-on-surface),.35); }

.grid-empty { text-align: center !important; padding: 30px !important; color: rgba(var(--v-theme-on-surface),.4); }

.pg-cant-input {
  width: 100px; padding: 5px 10px;
  border: 1px solid rgba(var(--v-theme-on-surface),.15);
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface),.03);
  color: rgb(var(--v-theme-on-surface));
  font-size: 13px; text-align: right; outline: none;
  transition: border-color .15s, background .15s;
}
.pg-cant-input:focus { border-color: var(--success); background: rgba(4,120,87,.06); }
.pg-cant-active { border-color: var(--success); background: rgba(4,120,87,.08); font-weight: 700; color: var(--success); }

/* Detalle dialog */
.detalle-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 4px; }
.detalle-table thead th { padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: rgba(var(--v-theme-on-surface),.5); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); }
.detalle-table tbody tr { border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); }
.detalle-table tbody td { padding: 3px 10px; vertical-align: middle; }
.item-cod { font-size: 11px; color: rgba(var(--v-theme-on-surface),.4); font-family: monospace; }
.item-nom { font-weight: 600; font-size: 13px; }
.num-cell { font-family: monospace; font-size: 13px; }

/* Edición de cantidades */
.cant-toolbar { display: flex; align-items: center; gap: 8px; }
.cant-dirty {
  display: inline-flex; align-items: center; gap: 2px;
  font-size: 11px; font-weight: 600; color: var(--warning);
}
.cant-input {
  width: 60px; padding: 3px 6px; text-align: center;
  font-family: monospace; font-size: 13px;
  border: 1px solid rgba(var(--v-theme-on-surface),.2); border-radius: 6px;
  background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface));
}
.cant-input:focus { outline: none; border-color: var(--indigo); }
/* Las flechitas del input numérico no caben en una celda de 70px y encima
   dejan el número descentrado. */
.cant-input::-webkit-outer-spin-button,
.cant-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.cant-input { -moz-appearance: textfield; appearance: textfield; }

.dif-ok    { color: var(--success); font-weight: 700; }
.dif-falta { color: var(--error); font-weight: 700; }
.dif-sobre { color: var(--gold); font-weight: 700; }
.dif-na    { color: rgba(var(--v-theme-on-surface),.3); }
.row-falta { background: rgba(239,68,68,.04); }
.row-sobre { background: rgba(245,158,11,.04); }

.det-info-row  { display: flex; gap: 24px; flex-wrap: wrap; padding: 12px; background: rgba(var(--v-theme-on-surface),.03); border-radius: 8px; }
.det-info-item { display: flex; flex-direction: column; gap: 2px; }
.det-lbl       { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: rgba(var(--v-theme-on-surface),.5); }
.det-val       { font-size: 13px; font-weight: 600; }
.det-obs       { font-size: 13px; color: rgba(var(--v-theme-on-surface),.6); font-style: italic; padding: 8px 12px; background: rgba(var(--v-theme-on-surface),.03); border-radius: 6px; }
.det-acciones  { display: flex; gap: 8px; }
.det-grupo-row { background: rgba(139,92,246,.07); }
.det-grupo-cell { padding: 5px 10px !important; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--indigo); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.06) !important; }

/* Verificación de inventario */
.inv-check { display: flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
.inv-check--loading { background: rgba(var(--v-theme-on-surface),.04); color: rgba(var(--v-theme-on-surface),.5); }
.inv-check--ok   { background: rgba(16,185,129,.1); color: var(--success); border: 1px solid rgba(16,185,129,.25); }
.inv-check--warn { background: rgba(239,68,68,.08); color: var(--error); border: 1px solid rgba(239,68,68,.2); }

/* Análisis de faltantes */
.ana-stat { background: rgba(var(--v-theme-on-surface),.03); border-radius: 10px; padding: 14px; border-left: 3px solid var(--color); }
.ana-stat-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.4); }
.ana-stat-val { font-size: 24px; font-weight: 800; color: var(--color); margin-top: 4px; }
.ana-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.ana-table thead th { padding: 10px; text-align: left; background: rgba(var(--v-theme-on-surface),.05); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.1); }
.ana-table tbody td { padding: 10px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); }
.ana-row-ok { background: rgba(16,185,129,.04); }
.ana-row-falta { background: rgba(239,68,68,.04); }
.ana-table tbody tr:hover { background: rgba(59,130,246,.08); }
.badge-cod { font-family: monospace; font-size: 11px; font-weight: 700; background: rgba(99,102,241,.1); color: #6366f1; padding: 3px 8px; border-radius: 4px; }
.badge-und { font-size: 10px; font-weight: 700; background: rgba(59,130,246,.1); color: var(--indigo); padding: 2px 6px; border-radius: 4px; }
.stock-pos { color: var(--success); font-weight: 600; }
.stock-zero { color: #6b7280; }
</style>
