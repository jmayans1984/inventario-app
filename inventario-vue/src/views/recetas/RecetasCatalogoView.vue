<template>
  <MainLayout>
    <div class="rc-container">

      <PageHeader
        title="Catálogo de Recetas"
        description="Crea, edita y gestiona las recetas con sus ingredientes"
        :crumbs="['Recetas', 'Procesos', 'Catálogo de Recetas']"
      >
        <template #actions>
          <v-btn color="primary" variant="flat" rounded="lg" :loading="recalculando" @click="recalcularTodos">
            <v-icon start>mdi-refresh</v-icon> Recalcular Costos
          </v-btn>
          <v-btn color="warning" variant="flat" rounded="lg" @click="abrirNuevaReceta">
            <v-icon start>mdi-plus</v-icon> Nueva Receta
          </v-btn>
        </template>
      </PageHeader>

      <!-- FILTROS -->
      <div class="rc-filters">
        <v-text-field v-model="busqueda" placeholder="Buscar receta..." prepend-inner-icon="mdi-magnify"
          variant="outlined" density="compact" hide-details clearable style="max-width:320px" />
        <v-select v-model="filtroGrupo" :items="gruposFilter" item-title="label" item-value="val"
          variant="outlined" density="compact" hide-details style="max-width:200px" />
        <v-btn-toggle v-model="filtroSubprod" density="compact" rounded="lg" color="warning">
          <v-btn value="TODOS" size="small">Todas</v-btn>
          <v-btn value="NO" size="small">Recetas</v-btn>
          <v-btn value="SI" size="small">Subproductos</v-btn>
        </v-btn-toggle>
      </div>

      <!-- KPI MINI -->
      <div class="kpi-grid">
        <KpiCard v-for="(k, i) in kpis" :key="k.label" :index="i" :label="k.label" :value="k.val" :icon="k.icon" :color="k.color" />
      </div>

      <!-- TABLA -->
      <div class="rc-table-card">
        <v-progress-linear v-if="loading" indeterminate color="#f59e0b" height="3" />
        <v-data-table :headers="headers" :items="recetasFiltradas" :search="busqueda"
          density="compact" hover :items-per-page="20" class="rc-table"
          v-model:expanded="expandedRows" item-value="codigo" show-expand>

          <template #item.subproducto="{ item }">
            <v-chip v-if="item.subproducto === 'SI'" color="purple" size="x-small" variant="tonal" label>
              SUBPRODUCTO
            </v-chip>
            <v-chip v-else color="cyan" size="x-small" variant="tonal" label>RECETA</v-chip>
          </template>

          <template #item.grupo_receta="{ item }">
            <span class="text-caption">{{ item.grupo_nombre || item.grupo_receta || '—' }}</span>
          </template>

          <template #item.valor="{ item }">
            <span class="font-mono text-error">{{ fmt(item.valor) }}</span>
          </template>

          <template #item.precio_venta="{ item }">
            <span class="font-mono">{{ fmt(item.precio_venta) }}</span>
          </template>

          <template #item.porcentaje_costo="{ item }">
            <v-chip v-if="item.precio_venta > 0" :color="colorPct(item.porcentaje_costo)" size="x-small" variant="tonal">
              {{ item.porcentaje_costo }}%
            </v-chip>
            <span v-else class="text-caption text-disabled">—</span>
          </template>

          <template #item.num_ingredientes="{ item }">
            <v-chip color="blue-grey" size="x-small" variant="tonal">{{ item.num_ingredientes }}</v-chip>
          </template>

          <!-- Columna expand nativa: oculta visualmente, la manejamos en acciones -->
          <template #item.data-table-expand></template>

          <template #item.acciones="{ item, internalItem, isExpanded, toggleExpand }">
            <div class="d-flex" style="gap:2px">
              <!-- AMARILLO: ingredientes -->
              <v-tooltip :text="isExpanded(internalItem) && rowMode[item.codigo]==='ingredientes' ? 'Cerrar ingredientes' : 'Ingredientes'">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon size="x-small"
                    :variant="isExpanded(internalItem) && rowMode[item.codigo]==='ingredientes' ? 'flat' : 'tonal'"
                    :color="isExpanded(internalItem) && rowMode[item.codigo]==='ingredientes' ? '#d97706' : '#f59e0b'"
                    @click="onClickIngredientes(item, internalItem, isExpanded, toggleExpand)">
                    <v-icon size="16">mdi-format-list-bulleted</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
              <!-- VERDE: productos vinculados -->
              <v-tooltip :text="isExpanded(internalItem) && rowMode[item.codigo]==='productos' ? 'Cerrar productos' : 'Productos vinculados'">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon size="x-small"
                    :variant="isExpanded(internalItem) && rowMode[item.codigo]==='productos' ? 'flat' : 'tonal'"
                    :color="isExpanded(internalItem) && rowMode[item.codigo]==='productos' ? '#0d9488' : 'teal'"
                    @click="onClickExpand(item, internalItem, isExpanded, toggleExpand)">
                    <v-icon size="16">mdi-package-variant-closed</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Editar receta">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon size="x-small" variant="tonal" color="blue"
                    @click="abrirEditar(item)">
                    <v-icon size="16">mdi-pencil-outline</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Eliminar receta">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon size="x-small" variant="tonal" color="error"
                    @click="confirmarEliminar(item)">
                    <v-icon size="16">mdi-trash-can-outline</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
            </div>
          </template>
          <!-- FILA EXPANDIDA -->
          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" style="padding:0">

                <!-- ══ MODO: INGREDIENTES ══ -->
                <template v-if="rowMode[item.codigo] === 'ingredientes'">
                  <div style="border-bottom:2px solid rgba(245,158,11,.25); background:rgba(245,158,11,.03)">

                    <!-- Barra superior -->
                    <div class="exp-ing-topbar">
                      <div class="exp-ing-info">
                        <v-icon size="15" color="#f59e0b">mdi-format-list-bulleted</v-icon>
                        <span class="exp-ing-nombre">{{ recetaActual?.nombre }}</span>
                        <v-chip :color="recetaActual?.subproducto==='SI' ? 'purple' : 'cyan'" size="x-small" variant="tonal" label>
                          {{ recetaActual?.subproducto === 'SI' ? 'SUBPRODUCTO' : 'RECETA' }}
                        </v-chip>
                        <v-chip color="amber" size="x-small" variant="tonal" label>
                          {{ ingredientes.length }} ingrediente{{ ingredientes.length !== 1 ? 's' : '' }}
                        </v-chip>
                      </div>
                      <v-btn icon size="x-small" variant="text" color="warning" title="Imprimir receta" @click="imprimirReceta">
                        <v-icon size="16">mdi-printer-outline</v-icon>
                      </v-btn>
                    </div>

                    <!-- Agregar ingrediente -->
                    <div class="exp-panel" style="padding-bottom:8px">
                      <div class="exp-add-bar">
                        <v-btn-toggle v-model="tipoIngredienteNuevo" rounded="lg" density="compact" color="warning" style="flex-shrink:0">
                          <v-btn value="ARTICULO" size="small"><v-icon size="14" class="mr-1">mdi-food-apple-outline</v-icon>Artículo</v-btn>
                          <v-btn value="RECETA"   size="small"><v-icon size="14" class="mr-1">mdi-link-variant</v-icon>Subreceta</v-btn>
                        </v-btn-toggle>
                        <v-autocomplete v-if="tipoIngredienteNuevo==='ARTICULO'"
                          ref="refArticuloAC"
                          v-model="articuloSeleccionado" :items="articulos"
                          item-title="nombre" return-object
                          :label="'Artículo... (' + articulos.length + ')'"
                          variant="outlined" density="compact" hide-details clearable style="flex:1;min-width:200px"
                          @update:modelValue="val => val && $nextTick(() => refCantidadAdd?.focus())">
                          <template #item="{ props, item: ai }">
                            <v-list-item v-bind="props" :subtitle="ai.raw.und + ' · ' + fmt(ai.raw.valor)" />
                          </template>
                        </v-autocomplete>
                        <v-autocomplete v-else
                          ref="refSubrecetaAC"
                          v-model="recetaSeleccionada" :items="subrecetas"
                          item-title="nombre" return-object
                          :label="'Subreceta... (' + subrecetas.length + ')'"
                          variant="outlined" density="compact" hide-details clearable style="flex:1;min-width:200px"
                          @update:modelValue="val => val && $nextTick(() => refCantidadAdd?.focus())">
                          <template #item="{ props, item: ri }">
                            <v-list-item v-bind="props" :subtitle="ri.raw.und + ' · ' + fmt(ri.raw.valor)" />
                          </template>
                        </v-autocomplete>
                        <v-text-field ref="refCantidadAdd" v-model="ingNuevo.cantidad" label="Cant." type="number" min="0.001"
                          variant="outlined" density="compact" hide-details style="width:90px;flex-shrink:0"
                          @keydown.enter.prevent="onCantidadEnterAdd" />
                        <v-btn ref="refAgregarBtn" color="warning" variant="flat" size="small" height="36"
                          :disabled="(tipoIngredienteNuevo==='ARTICULO' && !articuloSeleccionado)||(tipoIngredienteNuevo==='RECETA' && !recetaSeleccionada)||!ingNuevo.cantidad"
                          @click="agregarIngrediente">
                          <v-icon size="15" class="mr-1">mdi-plus</v-icon>Agregar
                        </v-btn>
                      </div>
                    </div>

                    <v-divider />

                    <!-- Tabla ingredientes -->
                    <div style="max-height:340px; overflow-y:auto">
                      <div class="ing-tbl-head">
                        <span class="col-nombre">INGREDIENTE / ARTÍCULO</span>
                        <span class="col-tipo">TIPO</span>
                        <span class="col-cant">CANTIDAD</span>
                        <span class="col-und">UND</span>
                        <span class="col-vunit">VALOR UNIT.</span>
                        <span class="col-sub">SUBTOTAL</span>
                        <span class="col-del"></span>
                      </div>
                      <div v-if="ingredientes.length === 0" class="ing-tbl-empty" style="padding:24px">
                        <v-icon size="32" color="rgba(var(--v-theme-on-surface),.15)" class="mb-1">mdi-text-box-plus-outline</v-icon>
                        <div>Sin ingredientes — agrega con el buscador</div>
                      </div>
                      <template v-for="(ing, idx) in ingredientes" :key="idx">
                        <div class="ing-tbl-row" :class="{ 'ing-tbl-row--sub': ing.tipo==='RECETA', 'ing-tbl-row--alt': idx%2===1 }">
                          <div class="col-nombre ing-item-nombre">
                            <v-icon v-if="ing.tipo==='RECETA'" size="13" color="#8b5cf6">mdi-link-variant</v-icon>
                            <v-icon v-else size="13" color="#14b8a6">mdi-food-apple-outline</v-icon>
                            <span>{{ ing.nombre_item || ing.articulo_nombre || ing.articulo }}</span>
                            <v-btn v-if="ing.tipo==='RECETA'" icon size="x-small" variant="text"
                              :color="subprodExpandido[idx] ? '#8b5cf6' : 'rgba(139,92,246,0.35)'"
                              @click="toggleSubprod(ing, idx)" class="expand-btn">
                              <v-icon size="13">{{ subprodExpandido[idx] ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                            </v-btn>
                          </div>
                          <div class="col-tipo">
                            <span v-if="ing.tipo==='RECETA'" class="badge-sub">SUBPRODUCTO</span>
                            <span v-else class="badge-art">ARTÍCULO</span>
                          </div>
                          <div class="col-cant">
                            <v-text-field v-model="ing.cantidad" type="number" min="0" variant="outlined"
                              density="compact" hide-details class="cant-field" @change="recalcSubtotal(ing)" />
                          </div>
                          <div class="col-und">{{ ing.und || '—' }}</div>
                          <div class="col-vunit font-mono">{{ fmt(ing.precio_unit) }}</div>
                          <div class="col-sub font-mono subtotal-val">{{ fmt((parseFloat(ing.precio_unit)||0)*(parseFloat(ing.cantidad)||0)) }}</div>
                          <div class="col-del">
                            <v-btn icon size="x-small" variant="text" color="error" @click="quitarIngrediente(idx)">
                              <v-icon size="16">mdi-delete-outline</v-icon>
                            </v-btn>
                          </div>
                        </div>
                        <div v-if="ing.tipo==='RECETA' && subprodExpandido[idx]" class="subprod-expand">
                          <div v-if="subprodLoading[idx]" class="subprod-loading">
                            <v-progress-circular size="14" width="2" indeterminate color="#8b5cf6" />
                            <span>Cargando...</span>
                          </div>
                          <template v-else-if="subprodIngredientes[idx]?.length">
                            <div class="subprod-header-title"><v-icon size="12" color="#8b5cf6">mdi-link-variant</v-icon> INGREDIENTES DE {{ ing.nombre_item?.toUpperCase() }} (x{{ ing.cantidad }})</div>
                            <div class="subprod-grid-head"><span class="sg-cod">CÓD.</span><span class="sg-nom">ARTÍCULO</span><span class="sg-cant">CANT.</span><span class="sg-und">UND.</span><span class="sg-vunit">VR. UNIT.</span><span class="sg-sub">SUBTOTAL</span></div>
                            <div v-for="sub in subprodIngredientes[idx]" :key="sub.articulo" class="subprod-grid-row">
                              <span class="sg-cod"><v-icon size="10" :color="sub.tipo==='RECETA'?'#8b5cf6':'#14b8a6'">{{ sub.tipo==='RECETA'?'mdi-link-variant':'mdi-food-apple-outline' }}</v-icon>{{ sub.articulo }}</span>
                              <span class="sg-nom">{{ sub.nombre_item || sub.articulo }}</span>
                              <span class="sg-cant">{{ Number((parseFloat(sub.cantidad)*parseFloat(ing.cantidad)).toFixed(4)) }}</span>
                              <span class="sg-und">{{ sub.und || '—' }}</span>
                              <span class="sg-vunit">{{ fmt(parseFloat(sub.precio_unit)||0) }}</span>
                              <span class="sg-sub">{{ fmt((parseFloat(sub.precio_unit)||0)*parseFloat(sub.cantidad)*parseFloat(ing.cantidad)) }}</span>
                            </div>
                          </template>
                          <div v-else class="subprod-loading">Sin ingredientes registrados</div>
                        </div>
                      </template>
                      <div v-if="ingredientes.length > 0" class="ing-tbl-total">
                        <span class="col-nombre" style="grid-column:1/6;font-weight:700;font-size:13px;">COSTO TOTAL ({{ ingredientes.length }} ingredientes)</span>
                        <span class="col-sub font-mono" style="font-weight:800;font-size:16px;color:#f59e0b;">{{ fmt(costoTotal) }}</span>
                        <span class="col-del"></span>
                      </div>
                    </div>

                    <!-- Resumen + footer -->
                    <div v-if="recetaActual?.precio_venta > 0" class="ing-resumen-bar">
                      <div class="resumen-item"><span class="resumen-lbl">COSTO</span><span class="resumen-val" style="color:#ef4444">{{ fmt(costoTotal) }}</span></div>
                      <div class="resumen-sep">→</div>
                      <div class="resumen-item"><span class="resumen-lbl">PRECIO VENTA</span><span class="resumen-val">{{ fmt(recetaActual.precio_venta) }}</span></div>
                      <div class="resumen-sep">=</div>
                      <div class="resumen-item"><span class="resumen-lbl">MARGEN</span><span class="resumen-val" style="color:#22c55e">{{ fmt(recetaActual.precio_venta - costoTotal) }}</span></div>
                      <div class="resumen-sep">|</div>
                      <div class="resumen-item"><span class="resumen-lbl">% COSTO</span><span class="resumen-val" :style="{ color: colorPctStr(pctCosto) }">{{ pctCosto.toFixed(1) }}%</span></div>
                    </div>
                    <div class="ing-dlg-footer">
                      <v-btn color="warning" variant="flat" rounded="lg" :loading="guardandoIng" @click="guardarIngredientes">
                        <v-icon start size="16">mdi-content-save-outline</v-icon>Guardar Ingredientes
                      </v-btn>
                    </div>

                  </div>
                </template>

                <!-- ══ MODO: PRODUCTOS ══ -->
                <template v-else>
                  <div style="border-bottom:2px solid rgba(13,148,136,.18); background:rgba(13,148,136,.04)">
                    <div class="exp-panel">
                      <v-progress-linear v-if="rowLoading[item.codigo]" indeterminate color="teal" height="2" />
                      <div class="exp-add-bar">
                        <v-autocomplete v-model="rowProdSel[item.codigo]" :items="prodCatalogo"
                          item-title="nombre" return-object label="Buscar producto con control..."
                          density="compact" variant="outlined" hide-details clearable
                          :loading="loadingProdCatalogo" style="flex:1;min-width:200px"
                          @update:search="buscarProdCatalogo" />
                        <v-text-field v-model="rowProdCant[item.codigo]" label="Cant." type="number"
                          min="0.01" step="0.01" density="compact" variant="outlined" hide-details
                          style="width:90px;flex-shrink:0"
                          @blur="rowProdCant[item.codigo]=parseFloat(parseFloat(rowProdCant[item.codigo]||0).toFixed(2))" />
                        <v-btn color="teal" variant="flat" size="small" height="36"
                          :disabled="!rowProdSel[item.codigo]||!rowProdCant[item.codigo]"
                          :loading="rowGuardando[item.codigo]"
                          @click="agregarProductoFila(item.codigo)">
                          <v-icon size="15" class="mr-1">mdi-plus</v-icon>Agregar
                        </v-btn>
                      </div>
                      <div v-if="rowProductos[item.codigo]?.length > 0" class="exp-prod-list">
                        <div class="exp-prod-head"><span>CÓDIGO</span><span>NOMBRE</span><span>GRUPO</span><span class="text-center">CANT</span><span>UND</span><span></span></div>
                        <div v-for="(p, idx) in rowProductos[item.codigo]" :key="p.codigo"
                          class="exp-prod-row" :class="{ 'exp-prod-row--alt': idx%2===1 }">
                          <span class="text-caption font-mono" style="color:rgba(var(--v-theme-on-surface),.45)">{{ p.codigo }}</span>
                          <span style="font-weight:500">{{ p.nombre }}</span>
                          <span class="text-caption" style="color:rgba(var(--v-theme-on-surface),.4)">{{ p.grupo_nombre || p.grupo || '—' }}</span>
                          <span class="text-center font-mono text-caption">{{ parseFloat(p.cant||0).toFixed(2) }}</span>
                          <span class="text-caption">{{ p.und || '—' }}</span>
                          <span style="display:flex;justify-content:flex-end">
                            <v-btn icon size="x-small" variant="text" color="error"
                              :loading="rowEliminando[item.codigo+p.codigo]"
                              @click="eliminarProductoFila(item.codigo, p.codigo)">
                              <v-icon size="14">mdi-delete-outline</v-icon>
                            </v-btn>
                          </span>
                        </div>
                      </div>
                      <div v-else-if="!rowLoading[item.codigo]" class="exp-empty">
                        <v-icon size="16" color="rgba(var(--v-theme-on-surface),.2)">mdi-package-variant</v-icon>
                        <span>Sin productos vinculados — usa el buscador para agregar</span>
                      </div>
                    </div>
                  </div>
                </template>

              </td>
            </tr>
          </template>

        </v-data-table>
      </div>
    </div>

    <!-- DIALOG: NUEVA / EDITAR RECETA -->
    <v-dialog v-model="dlgReceta" max-width="500">
      <v-card rounded="xl" style="overflow:hidden">

        <!-- Header -->
        <div class="form-dlg-header">
          <div class="form-dlg-icon">
            <v-icon size="18" color="white">mdi-chef-hat</v-icon>
          </div>
          <div>
            <div class="form-dlg-title">{{ editando ? 'Editar Receta' : 'Nueva Receta' }}</div>
            <div class="form-dlg-sub">{{ editando ? `Cód. ${form.codigo}` : 'Completa los datos de la receta' }}</div>
          </div>
        </div>

        <!-- Formulario -->
        <div class="form-dlg-body">

          <!-- Fila 1: Código + Nombre -->
          <div class="form-field-label">Identificación</div>
          <div class="form-row-2" style="grid-template-columns: 140px 1fr">
            <div>
              <div class="form-field-sublabel">Código *</div>
              <v-text-field v-model="form.codigo" placeholder="ej. 5001"
                variant="outlined" density="compact" hide-details
                :disabled="editando" :error-messages="errCodigo"
                class="form-field-sm" />
            </div>
            <div>
              <div class="form-field-sublabel">Nombre *</div>
              <v-text-field v-model="form.nombre" placeholder="ej. Hamburguesa de Carne"
                variant="outlined" density="compact" hide-details
                :error-messages="errNombre" class="form-field-sm" />
            </div>
          </div>

          <v-divider class="my-4" />

          <!-- Fila 2: Grupo + Unidad + Precio -->
          <div class="form-field-label">Clasificación</div>
          <div class="form-row-3">
            <div>
              <div class="form-field-sublabel">Grupo</div>
              <v-autocomplete v-model="form.grupo_receta"
                :items="gruposReceta" item-title="nombre" item-value="codigo"
                placeholder="Sin grupo" variant="outlined" density="compact"
                hide-details clearable class="form-field-sm" />
            </div>
            <div>
              <div class="form-field-sublabel">Unidad</div>
              <v-text-field v-model="form.und" placeholder="UND, KG, LT..."
                variant="outlined" density="compact" hide-details class="form-field-sm" />
            </div>
            <div>
              <div class="form-field-sublabel">Precio Venta</div>
              <v-text-field v-model="form.precio_venta" type="number" min="0"
                placeholder="0.00" variant="outlined" density="compact"
                hide-details prefix="$" class="form-field-sm" />
            </div>
          </div>

          <v-divider class="my-4" />

          <!-- Toggle subproducto -->
          <div class="form-subprod-row" :class="{ 'form-subprod-row--on': form.es_subproducto }"
            @click="form.es_subproducto = !form.es_subproducto">
            <div class="form-subprod-left">
              <v-icon size="18" :color="form.es_subproducto ? '#f59e0b' : 'rgba(var(--v-theme-on-surface),.3)'">
                mdi-link-variant
              </v-icon>
              <div>
                <div class="form-subprod-title">¿Es subproducto?</div>
                <div class="form-subprod-desc">Salsas, bases, preparaciones — se puede usar como ingrediente en otras recetas</div>
              </div>
            </div>
            <v-switch v-model="form.es_subproducto" color="#f59e0b" density="compact"
              hide-details @click.stop />
          </div>

          <!-- Info box cuando es subproducto -->
          <div v-if="form.es_subproducto" class="form-info-box">
            <v-icon size="14" color="#f59e0b">mdi-information-outline</v-icon>
            <span>Al guardar, se registrará en <strong>Artículos</strong> con su costo calculado para usarse como ingrediente.</span>
          </div>

        </div>

        <!-- Footer -->
        <div class="form-dlg-footer">
          <v-btn variant="flat" color="#ef4444" @click="dlgReceta=false">
            <v-icon start size="16">mdi-close</v-icon>Cancelar
          </v-btn>
          <v-btn color="warning" variant="flat" rounded="lg" :loading="guardando" @click="guardarReceta">
            <v-icon start size="16">mdi-content-save-outline</v-icon>
            {{ editando ? 'Guardar Cambios' : 'Crear Receta' }}
          </v-btn>
        </div>

      </v-card>
    </v-dialog>

    <!-- DIALOG RECALCULAR COSTOS -->
    <v-dialog v-model="dlgRecalcular" max-width="420" persistent>
      <v-card rounded="xl">
        <v-card-text class="pa-6">
          <div class="d-flex align-center mb-4" style="gap:12px">
            <v-icon size="32" color="teal">mdi-calculator-variant-outline</v-icon>
            <div>
              <div class="text-subtitle-1 font-weight-bold">Recalculando Costos</div>
              <div class="text-caption text-medium-emphasis">{{ recalcFase }}</div>
            </div>
          </div>
          <v-progress-linear
            :model-value="recalcTotal > 0 ? (recalcHecho / recalcTotal * 100) : 0"
            color="teal" height="8" rounded bg-color="rgba(13,148,136,.12)" class="mb-3" />
          <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-caption text-medium-emphasis" style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              {{ recalcActualNombre || '...' }}
            </span>
            <span class="text-caption font-weight-bold" style="flex-shrink:0">
              {{ recalcHecho }} / {{ recalcTotal }}
            </span>
          </div>
          <div v-if="recalcDone" class="d-flex align-center justify-center mt-4" style="gap:8px">
            <v-icon color="teal">mdi-check-circle-outline</v-icon>
            <span class="text-body-2 font-weight-medium" style="color:#0d9488">¡Costos actualizados!</span>
          </div>
        </v-card-text>
        <v-card-actions v-if="recalcDone" class="pa-4 justify-end">
          <v-btn color="teal" variant="flat" rounded="lg" @click="dlgRecalcular=false">
            <v-icon start>mdi-check</v-icon>Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIALOG ELIMINAR -->
    <v-dialog v-model="dlgEliminar" max-width="400">
      <v-card rounded="xl">
        <v-card-text class="pa-6 text-center">
          <v-icon size="48" color="error" class="mb-3">mdi-alert-circle-outline</v-icon>
          <p class="text-subtitle-1 font-weight-bold mb-1">¿Eliminar receta?</p>
          <p class="text-caption text-medium-emphasis">
            <strong>{{ recetaAEliminar?.nombre }}</strong> será eliminada con todos sus ingredientes.
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 justify-end gap-2">
          <v-btn variant="text" @click="dlgEliminar=false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" rounded="lg" :loading="eliminando" @click="eliminarReceta">
            <v-icon start>mdi-trash-can-outline</v-icon>Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3500" location="bottom right">
      {{ snack.msg }}
    </v-snackbar>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import KpiCard from '../../components/common/KpiCard.vue'
import { API_BASE } from '../../utils/constants.js'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Header de empresa para que el backend resuelva costos por empresa
// (COALESCE capa_empresa / costo_base). Estas vistas usan fetch directo,
// que no pasa por el interceptor de axios.
const empHeaders = () => {
  const e = localStorage.getItem('empresaActual')
  return e ? { 'X-Empresa': e } : {}
}

const recetas      = ref([])
const articulos    = ref([])
const gruposReceta = ref([])   // grupos únicos de recetas para el combobox
const loading      = ref(false)
const busqueda     = ref('')
const filtroGrupo   = ref('TODOS')
const filtroSubprod = ref('TODOS')

const headers = [
  { title: 'CÓDIGO',    key: 'codigo',          width: 90 },
  { title: 'NOMBRE',    key: 'nombre',          minWidth: 160 },
  { title: 'TIPO',      key: 'subproducto',     width: 120 },
  { title: 'GRUPO',     key: 'grupo_receta',    width: 90,  align: 'center' },
  { title: 'UND',       key: 'und',             width: 70,  align: 'center' },
  { title: 'ING.',      key: 'num_ingredientes',width: 65,  align: 'center' },
  { title: 'COSTO',     key: 'valor',           width: 110, align: 'end' },
  { title: 'P.VENTA',   key: 'precio_venta',    width: 110, align: 'end' },
  { title: '% COSTO',   key: 'porcentaje_costo',width: 115, align: 'center' },
  { title: '',          key: 'acciones',        width: 110, sortable: false },
]

// Dialog receta
const dlgReceta  = ref(false)
const editando   = ref(false)
const guardando  = ref(false)
const errCodigo  = ref('')
const errNombre  = ref('')
const form       = ref(formVacio())

function formVacio() {
  return { codigo: '', nombre: '', grupo_receta: '', und: '', precio_venta: 0, es_subproducto: false }
}

// Dialog ingredientes
const dlgIng              = ref(false)
const recetaActual        = ref(null)
const ingredientes        = ref([])
const guardandoIng        = ref(false)
// Expansión de subproductos
const subprodExpandido    = ref({})   // idx → bool
const subprodLoading      = ref({})   // idx → bool
const subprodIngredientes = ref({})   // idx → array
const ingNuevo            = ref({ cantidad: 1 })
const tipoIngredienteNuevo = ref('ARTICULO')  // ARTICULO o RECETA
const articuloSeleccionado = ref(null)   // objeto completo del articulo elegido
const recetaSeleccionada  = ref(null)    // objeto completo de la subreceta elegida
const subrecetas          = ref([])      // lista de subrecetas disponibles

// Refs para navegación con Enter en la barra de agregar
const refArticuloAC  = ref(null)
const refSubrecetaAC = ref(null)
const refCantidadAdd = ref(null)

// ── Estado inline expandible (por fila) ──
const expandedRows        = ref([])          // array de item-values (codigos)
const rowMode             = ref({})          // codigo → 'ingredientes' | 'productos'
const rowProductos        = ref({})          // codigo → array de productos
const rowLoading          = ref({})          // codigo → bool
const rowProdSel          = ref({})          // codigo → objeto producto seleccionado
const rowProdCant         = ref({})          // codigo → número
const rowGuardando        = ref({})          // codigo → bool
const rowEliminando       = ref({})          // (codigo+articulo) → bool
const prodCatalogo        = ref([])
const loadingProdCatalogo = ref(false)

// Recalcular costos
const recalculando     = ref(false)
const dlgRecalcular    = ref(false)
const recalcTotal      = ref(0)
const recalcHecho      = ref(0)
const recalcActualNombre = ref('')
const recalcFase       = ref('')
const recalcDone       = ref(false)

// Dialog eliminar
const dlgEliminar     = ref(false)
const recetaAEliminar = ref(null)
const eliminando      = ref(false)

const snack = ref({ show: false, msg: '', color: 'success' })
function ok(msg)  { snack.value = { show: true, msg, color: 'success' } }
function err(msg) { snack.value = { show: true, msg, color: 'error' } }

// Computed
const gruposFilter = computed(() => [
  { label: 'Todos los grupos', val: 'TODOS' },
  ...gruposReceta.value.map(g => ({ label: g.nombre, val: g.codigo }))
])

const recetasFiltradas = computed(() => {
  let r = recetas.value
  if (filtroGrupo.value !== 'TODOS') r = r.filter(x => x.grupo_receta === filtroGrupo.value)
  if (filtroSubprod.value !== 'TODOS') r = r.filter(x => (x.subproducto || 'NO') === filtroSubprod.value)
  return r
})

const kpis = computed(() => {
  const r = recetasFiltradas.value
  const conPV = r.filter(x => parseFloat(x.precio_venta) > 0)
  const promVenta = conPV.length > 0
    ? conPV.reduce((s, x) => s + parseFloat(x.precio_venta), 0) / conPV.length : 0
  const promPct = conPV.length > 0
    ? conPV.reduce((s, x) => s + parseFloat(x.porcentaje_costo), 0) / conPV.length : 0
  return [
    { label: 'Total',              val: r.length,                                     icon: 'mdi-chef-hat',                  color: 'var(--gold)' },
    { label: 'Recetas',            val: r.filter(x => x.subproducto !== 'SI').length, icon: 'mdi-book-open-variant-outline', color: 'var(--indigo)' },
    { label: 'Valor Prom. Venta',  val: fmt(promVenta),                               icon: 'mdi-tag-outline',               color: 'var(--success)' },
    { label: '% Prom. Mat. Prima', val: promPct.toFixed(1) + '%',                     icon: 'mdi-percent',                   color: 'var(--error)' },
  ]
})

const costoTotal = computed(() =>
  ingredientes.value.reduce((s, i) => s + (parseFloat(i.precio_unit)||0) * (parseFloat(i.cantidad)||0), 0)
)
const pctCosto = computed(() => {
  const pv = parseFloat(recetaActual.value?.precio_venta) || 0
  return pv > 0 ? (costoTotal.value / pv * 100) : 0
})

// Métodos
async function cargarRecetas() {
  loading.value = true
  try {
    const [rr, rg] = await Promise.all([
      fetch(`${API_BASE}/recetas`, { headers: empHeaders() }).then(r => r.json()),
      fetch(`${API_BASE}/recetas/grupos`).then(r => r.json()),
    ])
    recetas.value      = rr.data || []
    gruposReceta.value = rg.data || []
  } catch { err('Error al cargar recetas') }
  finally { loading.value = false }
}

async function cargarArticulos() {
  try {
    const [ra, rs] = await Promise.all([
      fetch(`${API_BASE}/articulos`, { headers: empHeaders() }).then(r => r.json()),
      fetch(`${API_BASE}/recetas/para-selector`).then(r => r.json()),
    ])
    articulos.value = ra.data || []
    subrecetas.value = rs.data || []
  } catch { /* silencioso */ }
}

async function recalcularTodos() {
  recalcTotal.value        = recetas.value.length
  recalcHecho.value        = 0
  recalcActualNombre.value = ''
  recalcDone.value         = false
  dlgRecalcular.value      = true
  recalculando.value       = true
  recalcFase.value         = 'Recalculando en orden de dependencias…'

  try {
    // Recalcula la capa de costos de la empresa activa (el backend rutea
    // principal→base, cliente→su capa). Sin empresa, el backend usa el principal.
    const empresa = localStorage.getItem('empresaActual') || ''
    const qs = empresa ? `?empresa=${encodeURIComponent(empresa)}` : ''
    const r = await fetch(`${API_BASE}/recetas/recalcular-todos${qs}`, { method: 'POST' })
    const j = await r.json()
    if (!j.success) throw new Error(j.error || 'Error al recalcular')
    recalcHecho.value = j.recalculadas || recetas.value.length
    if (Array.isArray(j.ciclos_detectados) && j.ciclos_detectados.length > 0) {
      err(`Atención: se detectaron ciclos en ${j.ciclos_detectados.length} receta(s). Revisa ingredientes auto-referenciados.`)
    }
  } catch (e) {
    err(e.message || 'Error al recalcular costos')
  }

  recalcDone.value   = true
  recalcFase.value   = ''
  recalculando.value = false
  recalcActualNombre.value = ''
  await cargarRecetas()
}

function abrirNuevaReceta() {
  editando.value = false
  form.value = formVacio()
  errCodigo.value = ''; errNombre.value = ''
  dlgReceta.value = true
}

function abrirEditar(receta) {
  editando.value = true
  form.value = {
    codigo:       receta.codigo,
    nombre:       receta.nombre,
    grupo_receta: receta.grupo_receta,
    und:          receta.und,
    precio_venta: receta.precio_venta,
    es_subproducto: receta.subproducto === 'SI',
  }
  errCodigo.value = ''; errNombre.value = ''
  dlgReceta.value = true
}

async function guardarReceta() {
  errCodigo.value = ''; errNombre.value = ''
  if (!form.value.codigo?.trim()) { errCodigo.value = 'Requerido'; return }
  if (!form.value.nombre?.trim()) { errNombre.value = 'Requerido'; return }
  guardando.value = true
  try {
    const payload = {
      codigo:       form.value.codigo.trim(),
      nombre:       form.value.nombre.trim(),
      grupo_receta: form.value.grupo_receta || null,
      und:          form.value.und || null,
      precio_venta: parseFloat(form.value.precio_venta) || 0,
      subproducto:  form.value.es_subproducto ? 'SI' : 'NO',
    }
    const url    = editando.value ? `${API_BASE}/recetas/${payload.codigo}` : `${API_BASE}/recetas`
    const method = editando.value ? 'PUT' : 'POST'
    const r = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    ok(editando.value ? 'Receta actualizada' : 'Receta creada')
    dlgReceta.value = false
    await cargarRecetas(); await cargarArticulos()
  } catch (e) { err(e.message) }
  finally { guardando.value = false }
}

async function abrirIngredientes(receta) {
  // Mantenida por compatibilidad (imprimirReceta la usa indirectamente)
  await cargarIngredientesFila(receta)
}

function onCantidadEnterAdd() {
  const tieneArt = tipoIngredienteNuevo.value === 'ARTICULO' ? !!articuloSeleccionado.value : !!recetaSeleccionada.value
  if (!tieneArt || !ingNuevo.value.cantidad) return
  agregarIngrediente()
  nextTick(() => {
    const ac = tipoIngredienteNuevo.value === 'ARTICULO' ? refArticuloAC.value : refSubrecetaAC.value
    ac?.focus()
  })
}

function agregarIngrediente() {
  let item, tipo

  if (tipoIngredienteNuevo.value === 'ARTICULO') {
    item = articuloSeleccionado.value
    if (!item) { err('Selecciona un artículo de la lista'); return }

    // Si el artículo existe también como subproducto en recetas, guardarlo como RECETA
    // para que el cálculo de costos sea siempre recursivo y actualizado
    const esSubprod = subrecetas.value.some(r => r.codigo === item.codigo)
    tipo = esSubprod ? 'RECETA' : 'ARTICULO'
  } else {
    item = recetaSeleccionada.value
    if (!item) { err('Selecciona una subreceta de la lista'); return }
    tipo = 'RECETA'
  }

  if (ingredientes.value.find(i => i.articulo === item.codigo)) {
    err('Este ingrediente ya está en la receta'); return
  }

  ingredientes.value.push({
    articulo:        item.codigo,
    nombre_item:     item.nombre,
    cantidad:        parseFloat(ingNuevo.value.cantidad) || 1,
    und:             item.und || '',
    precio_unit:     parseFloat(item.valor) || 0,
    tipo:            tipo,
  })
  ingredientes.value.sort((a, b) => (a.nombre_item || '').localeCompare(b.nombre_item || '', 'es'))
  articuloSeleccionado.value = null
  recetaSeleccionada.value = null
  tipoIngredienteNuevo.value = 'ARTICULO'
  ingNuevo.value = { cantidad: 1 }
}

function quitarIngrediente(idx) { ingredientes.value.splice(idx, 1) }

async function toggleSubprod(ing, idx) {
  // Si ya está expandido, colapsar
  if (subprodExpandido.value[idx]) {
    subprodExpandido.value = { ...subprodExpandido.value, [idx]: false }
    return
  }
  // Expandir y cargar si no se cargó aún
  subprodExpandido.value = { ...subprodExpandido.value, [idx]: true }
  if (subprodIngredientes.value[idx]) return // ya cargado

  subprodLoading.value = { ...subprodLoading.value, [idx]: true }
  try {
    const r = await fetch(`${API_BASE}/recetas/${ing.articulo}`, { headers: empHeaders() })
    const j = await r.json()
    subprodIngredientes.value = {
      ...subprodIngredientes.value,
      [idx]: j.data?.ingredientes || []
    }
  } catch (e) {
    subprodIngredientes.value = { ...subprodIngredientes.value, [idx]: [] }
  } finally {
    subprodLoading.value = { ...subprodLoading.value, [idx]: false }
  }
}
function recalcSubtotal(ing) { ing.cantidad = parseFloat(ing.cantidad) || 0 }

async function guardarIngredientes() {
  guardandoIng.value = true
  try {
    const payload = ingredientes.value.map(i => ({
      articulo:    i.articulo,
      cantidad:    parseFloat(i.cantidad) || 0,
      precio_unit: parseFloat(i.precio_unit) || 0,
      tipo:        i.tipo || 'ARTICULO',
    }))
    const r = await fetch(`${API_BASE}/recetas/${recetaActual.value.codigo}/ingredientes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredientes: payload })
    })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    // Recalcular costo automáticamente (ahora con lógica recursiva)
    await fetch(`${API_BASE}/recetas/${recetaActual.value.codigo}/calcular-costo`, { method: 'POST' })
    ok('Ingredientes guardados y costo actualizado')
    expandedRows.value = []   // colapsa la fila
    await cargarRecetas()
  } catch (e) { err(e.message) }
  finally { guardandoIng.value = false }
}

// ── Inline expandible: funciones ──
async function onClickExpand(item, internalItem, isExpanded, toggleExpand) {
  const cod = item.codigo
  const expanded = isExpanded(internalItem)
  const currentMode = rowMode.value[cod]
  if (!expanded) {
    rowMode.value = { ...rowMode.value, [cod]: 'productos' }
    toggleExpand(internalItem)
    if (rowProductos.value[cod] === undefined) {
      rowProdSel.value  = { ...rowProdSel.value,  [cod]: null }
      rowProdCant.value = { ...rowProdCant.value, [cod]: 1    }
    }
    await Promise.all([cargarProductosFila(cod), buscarProdCatalogo('')])
  } else if (currentMode === 'productos') {
    toggleExpand(internalItem)   // colapsar
  } else {
    // Estaba en ingredientes → cambiar a productos sin colapsar
    rowMode.value = { ...rowMode.value, [cod]: 'productos' }
    if (rowProductos.value[cod] === undefined) {
      rowProdSel.value  = { ...rowProdSel.value,  [cod]: null }
      rowProdCant.value = { ...rowProdCant.value, [cod]: 1    }
    }
    await Promise.all([cargarProductosFila(cod), buscarProdCatalogo('')])
  }
}

async function onClickIngredientes(item, internalItem, isExpanded, toggleExpand) {
  const cod = item.codigo
  const expanded = isExpanded(internalItem)
  const currentMode = rowMode.value[cod]
  if (!expanded) {
    rowMode.value = { ...rowMode.value, [cod]: 'ingredientes' }
    toggleExpand(internalItem)
    await cargarIngredientesFila(item)
  } else if (currentMode === 'ingredientes') {
    toggleExpand(internalItem)   // colapsar
  } else {
    // Estaba en productos → cambiar a ingredientes sin colapsar
    rowMode.value = { ...rowMode.value, [cod]: 'ingredientes' }
    await cargarIngredientesFila(item)
  }
}

async function cargarIngredientesFila(item) {
  recetaActual.value        = item
  ingredientes.value        = []
  ingNuevo.value            = { cantidad: 1 }
  tipoIngredienteNuevo.value = 'ARTICULO'
  articuloSeleccionado.value = null
  recetaSeleccionada.value   = null
  subprodExpandido.value     = {}
  subprodLoading.value       = {}
  subprodIngredientes.value  = {}
  try {
    const r = await fetch(`${API_BASE}/recetas/${item.codigo}`, { headers: empHeaders() })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const j = await r.json()
    if (!j.success) throw new Error(j.error || 'Respuesta inválida')
    ingredientes.value = (j.data.ingredientes || [])
      .map(i => ({ ...i, cantidad: parseFloat(i.cantidad)||0, precio_unit: parseFloat(i.precio_unit)||0, tipo: i.tipo||'ARTICULO' }))
      .sort((a, b) => (a.nombre_item||a.articulo_nombre||'').localeCompare(b.nombre_item||b.articulo_nombre||'', 'es'))
  } catch (e) { err(`Error: ${e.message}`) }
}

async function cargarProductosFila(cod) {
  rowLoading.value = { ...rowLoading.value, [cod]: true }
  try {
    const r = await fetch(`${API_BASE}/recetas/${cod}/productos`)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    rowProductos.value = { ...rowProductos.value, [cod]: j.data || [] }
  } catch (e) {
    err(`Error cargando productos: ${e.message}`)
    rowProductos.value = { ...rowProductos.value, [cod]: [] }
  } finally {
    rowLoading.value = { ...rowLoading.value, [cod]: false }
  }
}

let _buscarTimer = null
function buscarProdCatalogo(q) {
  clearTimeout(_buscarTimer)
  _buscarTimer = setTimeout(async () => {
    loadingProdCatalogo.value = true
    try {
      const url = `${API_BASE}/productos/controlados${q ? '?q=' + encodeURIComponent(q) : ''}`
      const r = await fetch(url)
      const j = await r.json()
      prodCatalogo.value = j.data || []
    } catch { /* silencioso */ }
    finally { loadingProdCatalogo.value = false }
  }, 260)
}

async function agregarProductoFila(cod) {
  const prod = rowProdSel.value[cod]
  if (!prod) return
  rowGuardando.value = { ...rowGuardando.value, [cod]: true }
  try {
    const r = await fetch(`${API_BASE}/recetas/${cod}/productos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articulo: prod.codigo, cant: parseFloat(rowProdCant.value[cod]) || 1 })
    })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    rowProdSel.value  = { ...rowProdSel.value,  [cod]: null }
    rowProdCant.value = { ...rowProdCant.value, [cod]: 1    }
    ok('Producto vinculado')
    await cargarProductosFila(cod)
  } catch (e) { err(e.message) }
  finally { rowGuardando.value = { ...rowGuardando.value, [cod]: false } }
}

async function eliminarProductoFila(cod, articuloCod) {
  const key = cod + articuloCod
  rowEliminando.value = { ...rowEliminando.value, [key]: true }
  try {
    const r = await fetch(`${API_BASE}/recetas/${cod}/productos/${encodeURIComponent(articuloCod)}`, {
      method: 'DELETE'
    })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    ok('Producto desvinculado')
    await cargarProductosFila(cod)
  } catch (e) { err(e.message) }
  finally { rowEliminando.value = { ...rowEliminando.value, [key]: false } }
}

function confirmarEliminar(receta) {
  recetaAEliminar.value = receta; dlgEliminar.value = true
}

async function eliminarReceta() {
  eliminando.value = true
  try {
    const r = await fetch(`${API_BASE}/recetas/${recetaAEliminar.value.codigo}`, { method: 'DELETE' })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    ok('Receta eliminada'); dlgEliminar.value = false
    await cargarRecetas(); await cargarArticulos()
  } catch (e) { err(e.message) }
  finally { eliminando.value = false }
}

function fmt(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function colorPct(pct) {
  const p = parseFloat(pct) || 0
  return p <= 30 ? 'green' : p <= 45 ? 'warning' : 'error'
}
function colorPctStr(pct) {
  const p = parseFloat(pct) || 0
  return p <= 30 ? '#22c55e' : p <= 45 ? '#f59e0b' : '#ef4444'
}

async function imprimirReceta() {
  const receta = recetaActual.value
  if (!receta) return

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const PW = doc.internal.pageSize.getWidth()
  const PH = doc.internal.pageSize.getHeight()
  const ML = 12, MR = 12

  // ── Encabezado minimalista ──
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(receta.nombre?.toUpperCase() || '', ML, 14)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  const grupotxt = receta.grupo_nombre || receta.grupo_receta || ''
  const tipoTxt  = receta.subproducto === 'SI' ? 'SUBPRODUCTO' : 'RECETA'
  doc.text(`Código: ${receta.codigo}${grupotxt ? '  ·  ' + grupotxt : ''}  ·  ${tipoTxt}`, ML, 20)

  // Línea divisoria
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.line(ML, 23, PW - MR, 23)

  doc.setTextColor(0, 0, 0)

  // ── Construir filas: ingredientes + sub-ingredientes inline ──
  const body = []

  for (const ing of ingredientes.value) {
    const nombre  = ing.nombre_item || ing.articulo_nombre || ing.articulo || '—'
    const cant    = parseFloat(ing.cantidad) || 0
    const vunit   = parseFloat(ing.precio_unit) || 0
    const sub     = vunit * cant
    const esSubp  = ing.tipo === 'RECETA'

    // Fila principal del ingrediente
    body.push([
      { content: nombre, styles: { fontStyle: esSubp ? 'bold' : 'normal', textColor: esSubp ? [80,60,160] : [0,0,0] } },
      { content: esSubp ? 'Subproducto' : 'Artículo', styles: { halign: 'center', textColor: esSubp ? [80,60,160] : [60,60,60] } },
      { content: String(cant), styles: { halign: 'center' } },
      { content: ing.und || '', styles: { halign: 'center' } },
      { content: fmt(vunit), styles: { halign: 'right' } },
      { content: fmt(sub), styles: { halign: 'right', fontStyle: 'bold' } },
    ])

    // Si es subproducto y tiene ingredientes cargados, mostrarlos
    if (esSubp) {
      // Intentar obtener ingredientes del subproducto
      let subIngs = null
      // Buscar en cache de subprodIngredientes primero
      const idxCache = Object.keys(subprodIngredientes.value).find(
        idx => ingredientes.value[idx]?.articulo === ing.articulo
      )
      if (idxCache !== undefined) {
        subIngs = subprodIngredientes.value[idxCache]
      } else {
        // Cargar del API
        try {
          const r = await fetch(`${API_BASE}/recetas/${ing.articulo}`, { headers: empHeaders() })
          const j = await r.json()
          subIngs = j.data?.ingredientes || []
        } catch { subIngs = [] }
      }

      if (subIngs && subIngs.length > 0) {
        for (const sub of subIngs) {
          const subCant  = (parseFloat(sub.cantidad) || 0) * cant
          const subVunit = parseFloat(sub.precio_unit) || 0
          body.push([
            { content: `    ↳ ${sub.nombre_item || sub.articulo}`, styles: { fontSize: 7, textColor: [100,80,180], fontStyle: 'italic' } },
            { content: '', styles: {} },
            { content: String(Number(subCant.toFixed(3))), styles: { halign: 'center', fontSize: 7, textColor: [130,110,200] } },
            { content: sub.und || '', styles: { halign: 'center', fontSize: 7, textColor: [130,110,200] } },
            { content: fmt(subVunit), styles: { halign: 'right', fontSize: 7, textColor: [130,110,200] } },
            { content: fmt(subVunit * subCant), styles: { halign: 'right', fontSize: 7, textColor: [130,110,200] } },
          ])
        }
      }
    }
  }

  autoTable(doc, {
    head: [['INGREDIENTE', 'TIPO', 'CANTIDAD', 'UND', 'VALOR UNIT.', 'SUBTOTAL']],
    body,
    startY: 27,
    margin: { left: ML, right: MR },
    styles: {
      fontSize: 8.5,
      cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
      lineColor: [210, 210, 210],
      lineWidth: 0.15,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [30, 30, 30],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: {
      0: { cellWidth: 68 },
      1: { cellWidth: 24, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
    },
    rowPageBreak: 'avoid',
    didDrawPage() {
      // Encabezado en páginas siguientes
      if (doc.internal.getCurrentPageInfo().pageNumber > 1) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(80, 80, 80)
        doc.text(`${receta.nombre?.toUpperCase()} (continuación)`, ML, 10)
        doc.setTextColor(0, 0, 0)
      }
    }
  })

  // ── Pie: resumen financiero ──
  const finalY = doc.lastAutoTable?.finalY || 120
  const piY = finalY + 10

  doc.setLineWidth(0.3)
  doc.setDrawColor(180, 180, 180)
  doc.line(ML, piY - 3, PW - MR, piY - 3)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(`COSTO TOTAL: ${fmt(costoTotal.value)}`, PW - MR, piY + 4, { align: 'right' })

  if (receta.precio_venta > 0) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text(
      `Precio Venta: ${fmt(receta.precio_venta)}   Margen: ${fmt(receta.precio_venta - costoTotal.value)}   % Costo: ${pctCosto.value.toFixed(1)}%`,
      PW - MR, piY + 11, { align: 'right' }
    )
  }

  // Fecha de generación
  doc.setFontSize(7)
  doc.setTextColor(160, 160, 160)
  doc.text(`Generado: ${new Date().toLocaleString('en-US')}`, ML, PH - 6)

  doc.setTextColor(0, 0, 0)
  const blob = doc.output('blob')
  window.open(URL.createObjectURL(blob), '_blank')
}

onMounted(() => { cargarRecetas(); cargarArticulos() })
</script>

<style scoped>
.rc-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
.rc-filters { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.rc-table-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 16px; overflow: hidden; }
/* Oculta la columna expand nativa de Vuetify */
:deep(.v-data-table__th--expand),
:deep(.v-data-table__td--expand) { width: 0 !important; min-width: 0 !important; padding: 0 !important; overflow: hidden; }
.font-mono { font-family: 'Courier New', monospace; }

/* ── DIALOG INGREDIENTES ── */
.ing-dlg-header {
  display: flex; align-items: center; gap: 14px;
  padding: 18px 20px 16px;
  background: linear-gradient(135deg, #1e3a5f, #1a3050);
  flex-shrink: 0;
}
.ing-dlg-icon {
  width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
  background: linear-gradient(135deg,#f59e0b,#d97706);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(245,158,11,.35);
}
.ing-dlg-titles { flex: 1; min-width: 0; }
.ing-dlg-receta-nombre { font-size: 17px; font-weight: 800; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ing-dlg-receta-meta { font-size: 12px; color: rgba(255,255,255,.5); margin-top: 2px; }
.ing-dlg-header-right { display: flex; align-items: center; flex-shrink: 0; gap: 6px; }

/* ── PANEL AGREGAR ── */
.ing-add-panel {
  padding: 14px 20px;
  background: rgba(var(--v-theme-on-surface), .02);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .08);
  flex-shrink: 0;
}
.ing-add-label {
  font-size: 10px; font-weight: 700; letter-spacing: 1px;
  color: rgba(var(--v-theme-on-surface), .4); text-transform: uppercase;
  margin-bottom: 10px;
}
.ing-add-controls { display: flex; gap: 10px; align-items: flex-start; flex-wrap: wrap; }

/* ── TABLA ── */
/* Columnas: nombre | tipo | cantidad | und | valor | subtotal | delete */
.ing-tbl-head,
.ing-tbl-row,
.ing-tbl-total {
  display: grid;
  grid-template-columns: 1fr 108px 110px 60px 92px 110px 40px;
  align-items: center;
  padding: 0 20px;
}
.ing-tbl-head {
  padding-top: 10px; padding-bottom: 10px;
  font-size: 10px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .45);
  background: rgba(var(--v-theme-on-surface), .03);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .08);
  position: sticky; top: 0; z-index: 1;
}
.ing-tbl-row {
  padding-top: 9px; padding-bottom: 9px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .05);
  font-size: 13px;
  transition: background .12s;
}
.ing-tbl-row:hover { background: rgba(var(--v-theme-on-surface), .04); }
.ing-tbl-row--alt { background: rgba(var(--v-theme-on-surface), .02); }
.ing-tbl-row--sub { background: rgba(139,92,246,.04); }
.ing-tbl-row--sub:hover { background: rgba(139,92,246,.08); }

/* Botón expandir dentro del nombre, flotante a la derecha */
.ing-item-nombre { position: relative; }
.expand-btn { margin-left: auto; flex-shrink: 0; opacity: .7; }
.expand-btn:hover { opacity: 1; }

/* Panel de ingredientes del subproducto */
.subprod-expand {
  background: rgba(139,92,246,.05);
  border-left: 3px solid #8b5cf6;
  margin: 0 0 1px 0;
  padding: 6px 12px 8px 16px;
}
.subprod-header-title {
  font-size: 9px;
  font-weight: 700;
  color: #8b5cf6;
  text-transform: uppercase;
  letter-spacing: .6px;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Mini-grid encabezado */
.subprod-grid-head {
  display: grid;
  grid-template-columns: 70px 1fr 60px 45px 80px 80px;
  gap: 4px;
  padding: 3px 4px;
  background: rgba(139,92,246,.12);
  border-radius: 4px 4px 0 0;
  margin-bottom: 0;
}
.subprod-grid-head span {
  font-size: 8.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .4px;
  color: #8b5cf6;
}

/* Mini-grid filas */
.subprod-grid-row {
  display: grid;
  grid-template-columns: 70px 1fr 60px 45px 80px 80px;
  gap: 4px;
  padding: 3.5px 4px;
  font-size: 11px;
  border-bottom: 1px solid rgba(139,92,246,.08);
  align-items: center;
}
.subprod-grid-row:last-child { border-bottom: none; }

.sg-cod { color: rgba(var(--v-theme-on-surface),.4); font-size: 10px; display: flex; align-items: center; gap: 2px; }
.sg-nom { color: rgba(var(--v-theme-on-surface),.8); }
.sg-cant { text-align: center; color: rgba(var(--v-theme-on-surface),.7); }
.sg-und  { text-align: center; color: rgba(var(--v-theme-on-surface),.5); font-size: 10px; }
.sg-vunit { text-align: right; font-family: monospace; color: rgba(var(--v-theme-on-surface),.6); }
.sg-sub  { text-align: right; font-family: monospace; color: #f59e0b; font-weight: 600; }

.subprod-loading {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface),.4);
  padding: 4px 0;
}
.ing-tbl-total {
  padding-top: 12px; padding-bottom: 12px;
  background: rgba(var(--v-theme-on-surface), .04);
  border-top: 2px solid rgba(var(--v-theme-on-surface), .12);
}

.ing-tbl-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 48px 24px;
  color: rgba(var(--v-theme-on-surface), .35); font-size: 13px; text-align: center;
}

/* Alineaciones de columnas */
.col-nombre { display: flex; align-items: center; gap: 7px; min-width: 0; padding-right: 8px; }
.col-tipo { text-align: center; }
.col-cant { padding-right: 8px; text-align: center; }
.ing-tbl-head .col-tipo,
.ing-tbl-head .col-cant,
.ing-tbl-head .col-und { text-align: center; }
.ing-tbl-head .col-vunit,
.ing-tbl-head .col-sub { text-align: right; }
.col-und { font-size: 12px; color: rgba(var(--v-theme-on-surface), .5); text-align: center; }
.col-vunit { text-align: right; font-size: 12px; color: rgba(var(--v-theme-on-surface), .7); }
.col-sub { text-align: right; }
.col-del { display: flex; justify-content: center; }

.ing-item-nombre { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.badge-sub {
  font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px;
  background: rgba(139,92,246,.15); color: #8b5cf6; letter-spacing: .4px;
}
.badge-art {
  font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px;
  background: rgba(20,184,166,.12); color: #14b8a6; letter-spacing: .4px;
}

.cant-field { max-width: 90px; }
.cant-field :deep(.v-field__input) { padding: 4px 8px !important; font-size: 13px; text-align: center; }
.cant-field :deep(.v-field) { border-radius: 6px; }

.subtotal-val { color: rgba(var(--v-theme-on-surface), .85); font-size: 13px; }

/* ── RESUMEN BAR ── */
.ing-resumen-bar {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  padding: 12px 20px;
  background: rgba(var(--v-theme-on-surface), .03);
  border-top: 1px solid rgba(var(--v-theme-on-surface), .08);
  flex-shrink: 0;
}
.resumen-item { display: flex; flex-direction: column; align-items: center; }
.resumen-lbl { font-size: 10px; font-weight: 700; letter-spacing: .6px; color: rgba(var(--v-theme-on-surface), .4); text-transform: uppercase; margin-bottom: 1px; }
.resumen-val { font-size: 15px; font-weight: 800; font-family: 'Courier New', monospace; }
.resumen-sep { font-size: 18px; color: rgba(var(--v-theme-on-surface), .2); font-weight: 300; }

/* ── FOOTER ── */
.ing-dlg-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), .1);
  flex-shrink: 0;
}

/* ── DIALOG NUEVA/EDITAR RECETA ── */
.form-dlg-header {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 20px 14px;
  background: linear-gradient(135deg, #1e3a5f, #1a3050);
}
.form-dlg-icon {
  width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 3px 10px rgba(245,158,11,.3);
}
.form-dlg-title { font-size: 15px; font-weight: 700; color: white; line-height: 1.2; }
.form-dlg-sub { font-size: 11px; color: rgba(255,255,255,.45); margin-top: 2px; }

.form-dlg-body { padding: 20px 20px 16px; }

.form-field-label {
  font-size: 10px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .4); margin-bottom: 10px;
}
.form-field-sublabel {
  font-size: 11px; color: rgba(var(--v-theme-on-surface), .5);
  margin-bottom: 4px; font-weight: 500;
}
.form-field-sm :deep(.v-field__input) { font-size: 13px; }
.form-field-sm :deep(.v-label) { font-size: 13px; }

.form-row-2 { display: grid; gap: 12px; }
.form-row-3 { display: grid; grid-template-columns: 1fr 100px 130px; gap: 12px; }

.form-subprod-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px 14px; border-radius: 10px; cursor: pointer;
  border: 1px solid rgba(var(--v-theme-on-surface), .1);
  background: rgba(var(--v-theme-on-surface), .02);
  transition: all .15s;
}
.form-subprod-row:hover { background: rgba(var(--v-theme-on-surface), .04); }
.form-subprod-row--on { border-color: rgba(245,158,11,.35); background: rgba(245,158,11,.04); }
.form-subprod-left { display: flex; align-items: flex-start; gap: 10px; flex: 1; min-width: 0; }
.form-subprod-title { font-size: 13px; font-weight: 600; line-height: 1.3; }
.form-subprod-desc { font-size: 11px; color: rgba(var(--v-theme-on-surface), .5); margin-top: 2px; line-height: 1.4; }

.form-info-box {
  display: flex; align-items: flex-start; gap: 7px;
  margin-top: 10px; padding: 10px 12px; border-radius: 8px;
  background: rgba(245,158,11,.07); border: 1px solid rgba(245,158,11,.2);
  font-size: 12px; color: rgba(var(--v-theme-on-surface), .7); line-height: 1.5;
}

.form-dlg-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), .08);
}

/* ── TABLA PRODUCTOS INVENTARIO ── */
.prod-tbl-head2,
.prod-tbl-row2 {
  display: grid;
  grid-template-columns: 80px 1fr 120px 60px 55px 36px;
  align-items: center;
  padding: 8px 20px;
  font-size: 12px;
  gap: 8px;
}
.prod-tbl-head2 {
  font-size: 10px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .4);
  background: rgba(var(--v-theme-on-surface), .03);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .08);
  position: sticky; top: 0; z-index: 1;
}
.prod-tbl-row2 {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .05);
  transition: background .1s;
}
.prod-tbl-row2:hover { background: rgba(var(--v-theme-on-surface), .04); }
.prod-tbl-row--alt { background: rgba(var(--v-theme-on-surface), .02); }

.info-box { background: rgba(245,158,11,.08); border: 1px solid rgba(245,158,11,.25); border-radius: 8px; padding: 10px 12px; font-size: 12px; display: flex; align-items: flex-start; gap: 6px; color: rgba(var(--v-theme-on-surface),.7); }
.dlg-icon-wrap { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg,#f59e0b,#d97706); display: flex; align-items: center; justify-content: center; }

/* ── BARRA SUPERIOR INGREDIENTES INLINE ── */
.exp-ing-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 20px 8px;
  border-bottom: 1px solid rgba(245,158,11,.15);
  background: rgba(245,158,11,.06);
}
.exp-ing-info { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.exp-ing-nombre { font-size: 13px; font-weight: 700; }

/* ── FILA EXPANDIDA INLINE ── */
.exp-panel {
  padding: 14px 20px 16px;
}
.exp-add-bar {
  display: flex; align-items: flex-start; gap: 10px; flex-wrap: wrap;
  margin-bottom: 14px;
}
.exp-prod-list {
  border: 1px solid rgba(var(--v-theme-on-surface),.08);
  border-radius: 8px;
  overflow: hidden;
}
.exp-prod-head,
.exp-prod-row {
  display: grid;
  grid-template-columns: 80px 1fr 120px 70px 60px 36px;
  align-items: center;
  padding: 6px 14px;
  gap: 8px;
  font-size: 12px;
}
.exp-prod-head {
  font-size: 10px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface),.4);
  background: rgba(13,148,136,.07);
  border-bottom: 1px solid rgba(13,148,136,.12);
}
.exp-prod-head span:nth-child(3),
.exp-prod-row span:nth-child(3) { text-align: center; }
.exp-prod-row {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05);
  transition: background .1s;
}
.exp-prod-row:last-child { border-bottom: none; }
.exp-prod-row:hover { background: rgba(13,148,136,.06); }
.exp-prod-row--alt { background: rgba(var(--v-theme-on-surface),.02); }
.exp-empty {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 0;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface),.35);
}
</style>
