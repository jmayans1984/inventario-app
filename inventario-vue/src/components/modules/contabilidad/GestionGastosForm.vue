<template>
  <v-dialog
    :model-value="open"
    max-width="1180"
    scrollable
    persistent
    @update:model-value="$emit('update:open', $event)"
  >
    <v-card rounded="xl" elevation="0" class="wiz-card" @keydown.esc.stop="pedirConfirmarCierre">

      <!-- ══ HEADER ══════════════════════════════════════════════════════ -->
      <div class="wiz-header">
        <div class="wiz-header-icon">
          <v-icon size="24" color="white">mdi-receipt-text-outline</v-icon>
        </div>
        <div class="wiz-header-text">
          <p class="wiz-header-title">{{ esEdicion ? 'Editar Gasto' : 'Nuevo Gasto' }}</p>
          <p class="wiz-header-sub">
            {{ esEdicion
              ? `Modificando comprobante #${form.codigo}`
              : 'Una factura de compra · distribuida en uno o varios centros de costo y cuentas' }}
          </p>
        </div>
        <v-spacer />
        <span v-if="esEdicion" class="codigo-badge"># {{ form.codigo }}</span>
        <span v-else class="codigo-badge auto">AUTO</span>
        <v-btn icon="mdi-close" variant="text" size="small" color="white" @click="cerrar" class="ml-2" />
      </div>

      <!-- ══ BODY: SIDEBAR + CONTENIDO ══════════════════════════════════ -->
      <div class="wiz-body">

        <!-- ── SIDEBAR DE PASOS ── -->
        <div class="wiz-sidebar">
          <button
            v-for="(st, i) in stepsInfo"
            :key="i"
            class="wiz-step"
            :class="{ 'wiz-step-active': step === i, 'wiz-step-done': step > i }"
            @click="irAPaso(i)"
          >
            <div class="wiz-step-num">
              <v-icon v-if="step > i" size="14">mdi-check</v-icon>
              <span v-else>{{ i + 1 }}</span>
            </div>
            <div class="wiz-step-text">
              <div class="wiz-step-title">{{ st.title }}</div>
              <div class="wiz-step-sub">{{ st.sub }}</div>
            </div>
          </button>
        </div>

        <!-- ── CONTENIDO DEL PASO ── -->
        <div class="wiz-content" ref="contentRef" @keydown.enter="onEnterMain">

          <!-- ═══ PASO 1: COMPROBANTE ═══ -->
          <div v-show="step === 0" class="wiz-pane">
            <div class="wiz-pane-title">
              <v-icon size="17" color="var(--indigo)">mdi-file-document-outline</v-icon>
              Datos de la Factura
            </div>

            <div class="field-row">
              <div class="field-col-3">
                <v-text-field
                  v-model="form.fecha"
                  autocomplete="off"
                  label="Fecha *"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  prepend-inner-icon="mdi-calendar"
                />
              </div>
              <div class="field-col-3">
                <v-text-field
                  v-model="form.factura"
                  autocomplete="off"
                  label="N° Factura"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  placeholder="FAC-2026-001"
                  maxlength="50"
                  prepend-inner-icon="mdi-pound"
                  @input="form.factura = form.factura.toUpperCase()"
                />
              </div>
            </div>

            <div class="field-row">
              <div class="field-col-full prov-field">
                <v-autocomplete
                  v-model="form.proveedor"
                  autocomplete="off"
                  label="Proveedor *"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  :items="proveedoresOptions"
                  item-title="nombre"
                  item-value="codigo"
                  :custom-filter="filtroProveedor"
                  placeholder="Escribe para buscar un proveedor..."
                  prepend-inner-icon="mdi-account-tie-outline"
                  clearable
                >
                  <!-- Si la búsqueda no encuentra nada, se puede crear ahí mismo -->
                  <template #no-data>
                    <div class="prov-nodata">
                      <span>No hay proveedores con ese nombre</span>
                      <v-btn size="small" variant="tonal" color="primary"
                        prepend-icon="mdi-plus" @click="abrirNuevoProveedor()">
                        Crear proveedor
                      </v-btn>
                    </div>
                  </template>
                </v-autocomplete>
                <v-btn
                  class="prov-add-btn"
                  variant="tonal"
                  color="primary"
                  icon="mdi-account-plus-outline"
                  size="small"
                  title="Crear un proveedor nuevo sin salir del formulario"
                  @click="abrirNuevoProveedor()"
                />
              </div>
            </div>

            <div class="field-row">
              <div :class="muestraCheque ? 'field-col-half' : 'field-col-full'">
                <v-autocomplete
                  v-model="form.forma_pago"
                  autocomplete="off"
                  label="Forma de Pago *"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  :items="formasPagoOptions"
                  item-title="nombre_cta"
                  item-value="codigo"
                  placeholder="Cuenta bancaria con la que se pagó..."
                  prepend-inner-icon="mdi-credit-card-outline"
                  no-data-text="No hay formas de pago"
                  clearable
                />
              </div>
              <div v-if="muestraCheque" class="field-col-half">
                <v-text-field
                  v-model="form.numero_cheque"
                  autocomplete="off"
                  label="N° Cheque"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  type="text"
                  inputmode="numeric"
                  placeholder="0"
                  prepend-inner-icon="mdi-checkbook"
                  @input="form.numero_cheque = form.numero_cheque.replace(/[^0-9]/g, '')"
                />
              </div>
            </div>
          </div>

          <!-- ═══ PASO 2: DISTRIBUCIÓN ═══ -->
          <div v-show="step === 1" class="wiz-pane">
            <div class="wiz-pane-title">
              <v-icon size="17" color="#0ea5e9">mdi-call-split</v-icon>
              Distribución del Gasto
              <span class="wiz-pane-hint">divide la factura entre centros de costo y cuentas contables</span>
            </div>

            <div v-for="(ln, idx) in form.lineas" :key="ln.uid" class="dist-card">
              <div class="dist-card-head">
                <div class="dist-card-num">{{ idx + 1 }}</div>
                <span class="dist-card-total">{{ formatMoneda(totalLinea(ln)) }}</span>
                <v-btn
                  v-if="!esEdicion && form.lineas.length > 1"
                  icon variant="text" size="x-small" color="var(--error)"
                  title="Quitar línea"
                  @click="quitarLinea(idx)"
                >
                  <v-icon size="16">mdi-delete-outline</v-icon>
                </v-btn>
              </div>

              <div class="field-row">
                <div class="field-col-half">
                  <v-autocomplete
                    v-model="ln.ccosto"
                    autocomplete="off"
                    label="Centro de Costos *"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    :items="centrosCostosOptions"
                    item-title="nombre"
                    item-value="codigo"
                    no-data-text="Sin centros"
                    clearable
                  />
                </div>
                <div class="field-col-half">
                  <v-autocomplete
                    v-model="ln.cuenta"
                    autocomplete="off"
                    label="Cuenta Contable *"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    :items="cuentasContablesOptions"
                    item-title="nombre"
                    item-value="codigo"
                    no-data-text="Sin cuentas"
                    clearable
                  />
                </div>
              </div>

              <div class="field-row">
                <div class="field-col-full">
                  <v-text-field
                    v-model="ln.concepto"
                    autocomplete="off"
                    label="Concepto / Descripción"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    placeholder="Opcional"
                    maxlength="100"
                    prepend-inner-icon="mdi-text-short"
                    @input="ln.concepto = ln.concepto.toUpperCase()"
                  />
                </div>
              </div>

              <div class="field-row montos-row">
                <div class="field-col-amt-full">
                  <v-text-field
                    v-model="ln.subtotal"
                    @blur="ln.subtotal = toNum(ln.subtotal)"
                    autocomplete="off"
                    label="Subtotal *"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    type="text"
                    inputmode="decimal"
                    placeholder="0.00"
                    prefix="$"
                  />
                </div>
                <div class="field-col-amt-full">
                  <v-text-field
                    v-model="ln.impuestos"
                    @blur="ln.impuestos = toNum(ln.impuestos)"
                    autocomplete="off"
                    label="Impuestos / Tax"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    type="text"
                    inputmode="decimal"
                    placeholder="0.00"
                    prefix="$"
                  />
                </div>
              </div>

              <!-- Chip de materia prima cuando la cuenta coincide (opcional) -->
              <div v-if="esMateriaPrima(ln)" class="mp-chip-row">
                <button class="mp-chip" :class="{ 'mp-chip-ok': ln.materiaPrima?.items?.length }" @click="abrirMateriaPrima(idx)">
                  <v-icon size="13">{{ ln.materiaPrima?.items?.length ? 'mdi-check-circle' : 'mdi-package-variant-plus' }}</v-icon>
                  <template v-if="ln.materiaPrima?.items?.length">
                    {{ ln.materiaPrima.items.length }} producto{{ ln.materiaPrima.items.length !== 1 ? 's' : '' }} · {{ formatMoneda(totalItemsMp(ln.materiaPrima)) }}
                    <span v-if="ln.materiaPrima.afectaInventario" class="mp-chip-tag">+INVENTARIO</span>
                    <span v-if="ln.materiaPrima.actualizaCosto" class="mp-chip-tag">+COSTO</span>
                  </template>
                  <template v-else>
                    <span class="mp-chip-label">Entrada de almacén (opcional)</span>
                  </template>
                </button>
              </div>
            </div>

            <v-btn
              v-if="!esEdicion"
              variant="tonal"
              color="#0ea5e9"
              size="small"
              class="mt-1"
              prepend-icon="mdi-plus"
              @click="agregarLinea"
            >
              Agregar línea
            </v-btn>
          </div>

          <!-- ═══ PASO 3: CONFIRMAR ═══ -->
          <div v-show="step === 2" class="wiz-pane">
            <div class="wiz-pane-title">
              <v-icon size="17" color="var(--gold)" />
              <v-icon size="17" color="var(--gold)">mdi-clipboard-check-outline</v-icon>
              Revisar y Confirmar
            </div>

            <!-- Resumen comprobante -->
            <div class="resumen-card">
              <div class="resumen-row">
                <span class="resumen-lbl">Fecha</span>
                <span class="resumen-val">{{ form.fecha }}</span>
              </div>
              <div class="resumen-row">
                <span class="resumen-lbl">Factura</span>
                <span class="resumen-val">{{ form.factura || '—' }}</span>
              </div>
              <div class="resumen-row">
                <span class="resumen-lbl">Proveedor</span>
                <span class="resumen-val">{{ nombreProveedor }}</span>
              </div>
              <div class="resumen-row">
                <span class="resumen-lbl">Forma de Pago</span>
                <span class="resumen-val">{{ nombreFormaPago }}</span>
              </div>
              <div v-if="muestraCheque && form.numero_cheque" class="resumen-row">
                <span class="resumen-lbl">N° Cheque</span>
                <span class="resumen-val">{{ form.numero_cheque }}</span>
              </div>
            </div>

            <!-- Tabla de líneas -->
            <table class="lineas-tabla">
              <thead>
                <tr>
                  <th>CENTRO DE COSTOS</th>
                  <th>CUENTA CONTABLE</th>
                  <th>CONCEPTO</th>
                  <th class="col-right">SUBTOTAL</th>
                  <th class="col-right">IMPUESTOS</th>
                  <th class="col-right">TOTAL</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ln in form.lineas" :key="ln.uid">
                  <td>{{ nombreCcosto(ln.ccosto) }}</td>
                  <td>{{ nombreCuenta(ln.cuenta) }}</td>
                  <td>{{ ln.concepto || '—' }}</td>
                  <td class="col-right">{{ formatMoneda(ln.subtotal) }}</td>
                  <td class="col-right">{{ formatMoneda(ln.impuestos) }}</td>
                  <td class="col-right font-weight-bold">{{ formatMoneda(totalLinea(ln)) }}</td>
                  <td class="col-center">
                    <v-icon v-if="ln.materiaPrima?.items?.length" size="16" color="var(--gold)" title="Incluye entrada de almacén">
                      mdi-package-variant-plus
                    </v-icon>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Totales -->
            <div class="tot-grid">
              <div class="tot-item">
                <span class="tot-lbl">SUBTOTAL</span>
                <span class="tot-val">{{ formatMoneda(sumSubtotal) }}</span>
              </div>
              <div class="tot-item">
                <span class="tot-lbl">IMPUESTOS</span>
                <span class="tot-val">{{ formatMoneda(sumImpuestos) }}</span>
              </div>
              <div class="tot-item tot-item-final">
                <span class="tot-lbl">TOTAL PAGADO</span>
                <span class="tot-val tot-val-final">{{ formatMoneda(sumTotal) }}</span>
              </div>
            </div>
            <div v-if="!esEdicion" class="tot-nota">
              <v-icon size="13" color="#0ea5e9">mdi-information-outline</v-icon>
              Se registrará{{ form.lineas.length > 1 ? `n ${form.lineas.length} gastos` : ' 1 gasto' }} y
              <strong>un solo movimiento bancario</strong> por {{ formatMoneda(sumTotal) }}
            </div>
          </div>

          <!-- ERROR -->
          <v-alert
            v-if="errorMsg"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
            closable
            @click:close="errorMsg = ''"
          >
            {{ errorMsg }}
          </v-alert>

        </div>
      </div>

      <!-- ══ FOOTER ═══════════════════════════════════════════════════════ -->
      <div class="wiz-footer">
        <v-btn variant="text" color="error" size="large" @click="cerrar" prepend-icon="mdi-close">
          Cancelar
        </v-btn>
        <div class="wiz-footer-right">
          <v-btn v-if="step > 0" variant="outlined" size="large" prepend-icon="mdi-arrow-left" @click="step--">
            Atrás
          </v-btn>
          <v-btn
            v-if="step < 2"
            color="primary"
            variant="elevated"
            size="large"
            append-icon="mdi-arrow-right"
            @click="siguientePaso"
          >
            Siguiente
          </v-btn>
          <v-btn
            v-else
            color="primary"
            variant="elevated"
            size="large"
            :loading="store.loading || guardando"
            prepend-icon="mdi-content-save-outline"
            @click="handleSubmit"
            class="btn-save"
          >
            {{ esEdicion ? 'Actualizar Gasto' : 'Guardar Gasto' }}
          </v-btn>
        </div>
      </div>

    </v-card>

    <!-- ═══════════════════════════════════════════════════════════════════
         SUB-DIALOG: FACTURA DUPLICADA
    ═══════════════════════════════════════════════════════════════════ -->
    <v-dialog v-model="dlgFacturaDuplicada" max-width="480" persistent>
      <v-card rounded="lg">
        <div class="dlg-dup-header">
          <v-icon size="22" color="var(--gold)" class="mr-2">mdi-alert-circle-outline</v-icon>
          Posible Factura Duplicada
        </div>
        <v-card-text class="pa-5">
          <p style="font-size:14px;margin-bottom:12px">
            Ya existe{{ facturasDuplicadas.length > 1 ? 'n' : '' }} <strong>{{ facturasDuplicadas.length }}</strong>
            gasto{{ facturasDuplicadas.length > 1 ? 's' : '' }} registrado{{ facturasDuplicadas.length > 1 ? 's' : '' }}
            para el proveedor <strong>{{ nombreProveedor }}</strong> con la factura
            <strong>{{ form.factura }}</strong>:
          </p>
          <div class="dup-list">
            <div v-for="d in facturasDuplicadas" :key="d.codigo" class="dup-item">
              <span class="dup-cod">{{ d.codigo }}</span>
              <span class="dup-fecha">{{ (d.fecha || '').split('T')[0] }}</span>
              <span class="dup-total">{{ formatMoneda(d.total) }}</span>
            </div>
          </div>
          <p style="font-size:13px;margin-top:14px;color:rgba(var(--v-theme-on-surface),.7)">
            ¿Deseas continuar de todos modos y guardar este gasto?
          </p>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4" style="flex-direction:column;gap:8px;align-items:stretch">
          <v-btn color="var(--gold)" variant="elevated" prepend-icon="mdi-content-save-outline" :loading="guardando" @click="continuarGuardarDeTodosModos">
            Guardar Igualmente
          </v-btn>
          <v-btn variant="text" :disabled="guardando" @click="dlgFacturaDuplicada = false">Cancelar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ═══════════════════════════════════════════════════════════════════
         SUB-DIALOG: ENTRADA DE ALMACÉN — MATERIA PRIMA
    ═══════════════════════════════════════════════════════════════════ -->
    <v-dialog v-model="mpDialogOpen" max-width="800" scrollable persistent>
      <v-card rounded="xl" class="wiz-card" @keydown.esc.stop="pedirConfirmarCierreMp">
        <div class="wiz-header" style="background: linear-gradient(135deg,var(--gold),var(--gold-strong))">
          <div class="wiz-header-icon">
            <v-icon size="22" color="white">mdi-package-variant-plus</v-icon>
          </div>
          <div class="wiz-header-text">
            <p class="wiz-header-title">Entrada de Almacén — Materia Prima</p>
            <p class="wiz-header-sub">Detalla los productos comprados en esta línea de la factura</p>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" color="white" @click="mpDialogOpen = false" />
        </div>

        <v-card-text class="wiz-content-simple" ref="mpContentRef" @keydown.enter="onEnterMp">

          <!-- Opciones -->
          <div class="mp-opts">
            <v-checkbox
              v-model="mpDraft.afectaInventario"
              density="compact"
              hide-details
              color="var(--gold)"
            >
              <template #label>
                <span class="mp-opt-lbl">
                  <strong>Afectar inventario de la bodega maestra</strong>
                  — registra la entrada de estas cantidades en el inventario
                </span>
              </template>
            </v-checkbox>
            <!-- El inventario de almacén solo maneja productos; los artículos de
                 receta se compran y se costean, pero no llevan control de stock. -->
            <div v-if="mpDraft.afectaInventario && mpArticulosSinStock.length" class="mp-aviso">
              <v-icon size="15" color="var(--gold)">mdi-information-outline</v-icon>
              <span>
                <strong>{{ mpArticulosSinStock.length }}</strong>
                {{ mpArticulosSinStock.length === 1 ? 'ítem es materia prima y no' : 'ítems son materia prima y no' }}
                mueve{{ mpArticulosSinStock.length === 1 ? '' : 'n' }} inventario:
                <strong>{{ mpArticulosSinStock.join(', ') }}</strong>.
                Su compra y su costo sí quedan registrados.
              </span>
            </div>
            <v-checkbox
              v-model="mpDraft.actualizaCosto"
              density="compact"
              hide-details
              color="var(--gold)"
            >
              <template #label>
                <span class="mp-opt-lbl">
                  <strong>Actualizar precio de costo</strong>
                  — el costo unitario de esta compra reemplaza el precio de costo del producto
                  o el valor del artículo (materia prima), afectando el costo de las recetas
                </span>
              </template>
            </v-checkbox>
          </div>

          <!-- Items -->
          <div class="mp-items">
            <div v-for="(item, i) in mpDraft.items" :key="i" class="mp-item-card">

              <!-- Fila 1: qué se compró -->
              <div class="mp-item-top">
                <v-autocomplete
                  v-model="item.key"
                  :items="itemsOptions"
                  :loading="productosLoading"
                  item-title="nombre"
                  item-value="key"
                  :custom-filter="filtroItemCompra"
                  label="Producto / Artículo *"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  autocomplete="off"
                  class="mp-item-prod"
                  @update:model-value="onItemSeleccionado(item)"
                >
                  <template #item="{ item: it, props: p }">
                    <v-list-item v-bind="p">
                      <template #append>
                        <span class="mp-prod-meta">
                          <span
                            class="mp-origen-tag"
                            :class="it.raw.origen === 'ARTICULO' ? 'tag-art' : 'tag-prod'"
                          >{{ it.raw.origen === 'ARTICULO' ? 'MATERIA PRIMA' : 'PRODUCTO' }}</span>
                          {{ it.raw.codigo }} · {{ it.raw.und }}
                        </span>
                      </template>
                    </v-list-item>
                  </template>
                  <!-- Si no existe todavía, se puede crear ahí mismo sin perder el gasto que ya se está capturando -->
                  <template #no-data>
                    <div class="prov-nodata">
                      <span>No hay productos ni artículos con ese nombre</span>
                      <v-btn size="small" variant="tonal" color="var(--gold)"
                        prepend-icon="mdi-plus" @click="abrirNuevoItem(item)">
                        Crear producto/artículo
                      </v-btn>
                    </div>
                  </template>
                </v-autocomplete>
                <v-btn icon variant="text" size="small" color="var(--error)" class="mp-item-del"
                  @click="mpDraft.items.splice(i, 1)">
                  <v-icon size="18">mdi-delete-outline</v-icon>
                </v-btn>
              </div>

              <!-- Fila 2: presentaciones guardadas para este ítem (Almacén > Configuración).
                   Abre un popup para digitar cuántas se compraron y calcula la cantidad sola. -->
              <div v-if="presentacionesDe(item.key).length" class="mp-item-presentaciones">
                <span class="mp-pres-lbl">Por presentación:</span>
                <v-btn
                  v-for="pres in presentacionesDe(item.key)"
                  :key="pres.id"
                  size="x-small"
                  variant="tonal"
                  color="var(--gold)"
                  class="mp-pres-chip"
                  @click="abrirPresentacion(item, pres)"
                >
                  {{ pres.nombre_presentacion }} ({{ formatNumPres(pres.contenido) }} {{ undItem(item) }})
                </v-btn>
              </div>

              <!-- Fila 3: cuánto y a qué costo -->
              <div class="mp-item-bottom">
                <v-text-field
                  v-model.number="item.cantidad"
                  label="Cantidad *"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  type="number"
                  step="0.01"
                  min="0"
                  autocomplete="off"
                  class="mp-item-cant"
                  :suffix="undItem(item)"
                />
                <v-text-field
                  v-model.number="item.costoUnit"
                  label="Costo Unit. *"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  type="number"
                  step="0.0001"
                  min="0"
                  autocomplete="off"
                  class="mp-item-costo"
                  prefix="$"
                />
                <div class="mp-item-subtotal">
                  <span class="mp-item-subtotal-lbl">Subtotal</span>
                  <span class="mp-item-subtotal-val">{{ formatMoneda((item.cantidad || 0) * (item.costoUnit || 0)) }}</span>
                </div>
              </div>
            </div>

            <v-btn variant="tonal" color="var(--gold)" size="small" prepend-icon="mdi-plus" @click="agregarItemMp" class="mp-add-btn">
              Agregar producto
            </v-btn>
          </div>

          <!-- Total items vs línea -->
          <div class="mp-total-row">
            <span>TOTAL PRODUCTOS</span>
            <span class="mp-total-val">{{ formatMoneda(totalItemsMp(mpDraft)) }}</span>
          </div>
          <div
            v-if="mpLineaRef && Math.abs(totalItemsMp(mpDraft) - (mpLineaRef.subtotal || 0)) > 0.01 && mpDraft.items.length"
            class="mp-warn"
          >
            <v-icon size="14" color="var(--gold)">mdi-alert-outline</v-icon>
            El total de productos no coincide con el subtotal de la línea ({{ formatMoneda(mpLineaRef.subtotal || 0) }})
          </div>

        </v-card-text>

        <div class="wiz-footer">
          <v-btn variant="text" @click="mpDialogOpen = false">Cancelar</v-btn>
          <v-btn color="var(--gold)" variant="elevated" prepend-icon="mdi-check" @click="confirmarMateriaPrima">
            Aceptar
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- ═══ COMPRAR POR PRESENTACIÓN (calcula la cantidad automáticamente) ═══ -->
    <v-dialog v-model="dlgPresentacion" max-width="360" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pa-4 pb-2">
          <v-icon color="var(--gold)" class="mr-2">mdi-package-variant-closed</v-icon>
          {{ presDialogPres?.nombre_presentacion }}
        </v-card-title>
        <v-card-text class="pt-0">
          <p class="pres-dlg-sub">
            Cada {{ presDialogPres ? formatNumPres(presDialogPres.contenido) : '' }}
            {{ presDialogItem ? undItem(presDialogItem) : '' }}. ¿Cuántas compraste?
          </p>
          <v-text-field
            v-model.number="presDialogCantidad"
            label="Cantidad comprada"
            type="number"
            min="0"
            step="1"
            variant="outlined"
            density="comfortable"
            autofocus
            hide-details
            @keydown.enter.prevent="confirmarPresentacion"
          />
          <div v-if="presDialogPres" class="pres-dlg-preview">
            = {{ formatNumPres((parseFloat(presDialogCantidad) || 0) * parseFloat(presDialogPres.contenido)) }}
            {{ presDialogItem ? undItem(presDialogItem) : '' }}
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="dlgPresentacion = false">Cancelar</v-btn>
          <v-btn color="var(--gold)" variant="elevated" @click="confirmarPresentacion">Aplicar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ═══ NUEVO PROVEEDOR (sin salir del gasto) ═══ -->
    <v-dialog v-model="provDialogOpen" max-width="480" persistent>
      <v-card rounded="lg">
        <v-card-title class="prov-dlg-header">
          <v-icon size="18" class="mr-2">mdi-account-plus-outline</v-icon>
          Nuevo proveedor
        </v-card-title>
        <v-card-text class="pt-4">
          <p class="prov-dlg-sub">
            Queda seleccionado en el gasto al crearlo. Puedes completar el resto de
            los datos después en Contabilidad → Proveedores.
          </p>
          <v-text-field
            v-model="provDraft.nombre"
            label="Nombre *"
            variant="outlined"
            density="comfortable"
            autofocus
            @keydown.enter.prevent="guardarNuevoProveedor"
            @input="provDraft.nombre = provDraft.nombre.toUpperCase(); provError = ''"
          />
          <v-text-field
            v-model="provDraft.codigo"
            label="Código *"
            variant="outlined"
            density="comfortable"
            maxlength="10"
            counter="10"
            hint="Sugerido automáticamente — puedes reemplazarlo por el NIT o identificación real"
            persistent-hint
            class="mb-2"
            @keydown.enter.prevent="guardarNuevoProveedor"
            @input="provError = ''"
          />
          <v-alert v-if="provError" type="error" variant="tonal" density="compact" class="mb-3">
            {{ provError }}
          </v-alert>
          <div class="d-flex" style="gap:12px">
            <v-text-field
              v-model="provDraft.telefono1"
              label="Teléfono"
              variant="outlined"
              density="comfortable"
              hide-details
            />
            <v-text-field
              v-model="provDraft.direccion"
              label="Dirección"
              variant="outlined"
              density="comfortable"
              hide-details
              @input="provDraft.direccion = provDraft.direccion.toUpperCase()"
            />
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" :disabled="provGuardando" @click="provDialogOpen = false">Cancelar</v-btn>
          <v-btn color="primary" variant="elevated" prepend-icon="mdi-content-save"
            :loading="provGuardando" @click="guardarNuevoProveedor">
            Crear y seleccionar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ═══ NUEVO PRODUCTO / ARTÍCULO (sin salir de la entrada de almacén) ═══ -->
    <v-dialog v-model="dlgNuevoItemOpen" max-width="480" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pa-4 pb-2">
          <v-icon size="18" class="mr-2" color="var(--gold)">mdi-plus-box-outline</v-icon>
          Nuevo Producto / Artículo
        </v-card-title>
        <v-card-text class="pt-2">
          <p class="prov-dlg-sub">
            Queda seleccionado en esta línea al crearlo. El resto de sus datos (grupo,
            precios de venta, etc.) se completan luego en Almacén o Recetas si hace falta.
          </p>

          <!-- TIPO -->
          <div class="ni-origen-toggle">
            <button
              type="button" class="ni-origen-btn" :class="{ active: nuevoItemDraft.origen === 'ARTICULO' }"
              @click="cambiarOrigenNuevoItem('ARTICULO')"
            >
              <v-icon size="14">mdi-food-drumstick-outline</v-icon> Artículo (materia prima)
            </button>
            <button
              type="button" class="ni-origen-btn" :class="{ active: nuevoItemDraft.origen === 'PRODUCTO' }"
              @click="cambiarOrigenNuevoItem('PRODUCTO')"
            >
              <v-icon size="14">mdi-package-variant</v-icon> Producto (con stock)
            </button>
          </div>

          <v-text-field
            v-model="nuevoItemDraft.nombre"
            label="Nombre *"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            autofocus
            @keydown.enter.prevent="guardarNuevoItem"
            @input="nuevoItemDraft.nombre = nuevoItemDraft.nombre.toUpperCase(); nuevoItemError = ''"
          />

          <div class="d-flex" style="gap:12px">
            <v-text-field
              v-model="nuevoItemDraft.codigo"
              :label="nuevoItemDraft.origen === 'PRODUCTO' ? 'Código *' : 'Código (opcional)'"
              variant="outlined"
              density="comfortable"
              hide-details
              maxlength="20"
            />
            <v-text-field
              v-model="nuevoItemDraft.und"
              label="Unidad"
              variant="outlined"
              density="comfortable"
              hide-details
              @input="nuevoItemDraft.und = nuevoItemDraft.und.toUpperCase()"
            />
          </div>

          <v-select
            v-model="nuevoItemDraft.grupo"
            :items="gruposNuevoItemOptions"
            item-title="nombre"
            item-value="codigo"
            label="Grupo"
            variant="outlined"
            density="comfortable"
            clearable
            class="mt-3"
            hide-details
          />

          <v-text-field
            v-model="nuevoItemDraft.precio"
            label="Costo unitario"
            type="number"
            min="0"
            step="0.0001"
            variant="outlined"
            density="comfortable"
            prefix="$"
            class="mt-3"
            hide-details
          />

          <v-alert v-if="nuevoItemError" type="error" variant="tonal" density="compact" class="mt-3">
            {{ nuevoItemError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" :disabled="nuevoItemGuardando" @click="dlgNuevoItemOpen = false">Cancelar</v-btn>
          <v-btn color="var(--gold)" variant="elevated" prepend-icon="mdi-content-save"
            :loading="nuevoItemGuardando" @click="guardarNuevoItem">
            Crear y seleccionar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ═══ CONFIRMAR CIERRE (ESC en el gasto) — persistent: ESC no la cierra ═══ -->
    <v-dialog v-model="dlgConfirmCerrar" max-width="420" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pa-4 pb-2">
          <v-icon color="warning" class="mr-2">mdi-alert-circle-outline</v-icon>
          ¿Cerrar sin guardar?
        </v-card-title>
        <v-card-text class="pt-0">
          Vas a perder los datos capturados en este gasto.
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="dlgConfirmCerrar = false">Seguir editando</v-btn>
          <v-btn color="error" variant="flat" @click="dlgConfirmCerrar = false; cerrar()">
            Cerrar sin guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ═══ CONFIRMAR CIERRE (ESC en Entrada de Almacén) ═══ -->
    <v-dialog v-model="dlgConfirmCerrarMp" max-width="420" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pa-4 pb-2">
          <v-icon color="warning" class="mr-2">mdi-alert-circle-outline</v-icon>
          ¿Cerrar sin guardar?
        </v-card-title>
        <v-card-text class="pt-0">
          Vas a perder los productos capturados en esta entrada de almacén.
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="dlgConfirmCerrarMp = false">Seguir editando</v-btn>
          <v-btn color="error" variant="flat" @click="dlgConfirmCerrarMp = false; mpDialogOpen = false">
            Cerrar sin guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useGestionGastosStore } from '../../../stores/gestiongastos'
import { gestionGastosService } from '../../../services/gestiongastos.service'
import { proveedoresService } from '../../../services/proveedores.service'
import { centroCostosService } from '../../../services/centrocostos.service'
import { cuentasContablesService } from '../../../services/cuentascontables.service'
import { cuentasBancariasService } from '../../../services/cuentasbancarias.service'
import { formatMoneda } from '../../../utils/formatters'
import api from '../../../services/api'
import { useAuthStore } from '../../../stores/auth'
import { presentacionesCompraService } from '../../../services/presentaciones-compra.service'
import { productosAlmacenService } from '../../../services/productos-almacen.service'

const props = defineProps({
  open: Boolean,
  gasto: Object,
})

const emit = defineEmits(['update:open', 'close', 'guardar'])

const store = useGestionGastosStore()
const authStore = useAuthStore()
const empresa = computed(() => authStore.empresa || authStore.user?.empresa || '')

// ─── Alta rápida de proveedor ────────────────────────
// Evita tener que abandonar el gasto a medio capturar para ir a crear el
// proveedor en otra pantalla y volver a empezar.
const provDialogOpen = ref(false)
const provGuardando  = ref(false)
const provError      = ref('')
const provDraft      = ref({ codigo: '', nombre: '', telefono1: '', direccion: '' })

async function abrirNuevoProveedor() {
  provError.value = ''
  provDraft.value = { codigo: '', nombre: '', telefono1: '', direccion: '' }
  provDialogOpen.value = true
  // Se sugiere el siguiente código libre (serie desde 1000000000), pero el campo
  // queda editable por si se prefiere usar el NIT/identificación real.
  try {
    const r = await api.get('/contabilidad/proveedores/proximo-codigo', {
      params: { empresa: empresa.value }
    })
    if (r.data?.codigo) provDraft.value.codigo = r.data.codigo
  } catch { /* si falla, se escribe a mano */ }
}

async function guardarNuevoProveedor() {
  const nombre = (provDraft.value.nombre || '').trim().toUpperCase()
  const codigo = (provDraft.value.codigo || '').trim()

  if (!nombre) { provError.value = 'El nombre es requerido'; return }
  if (!codigo)  { provError.value = 'El código es requerido'; return }
  if (codigo.length > 10) { provError.value = 'El código no puede superar 10 caracteres'; return }
  if (proveedoresOptions.value.some(p => String(p.codigo).trim() === codigo)) {
    provError.value = `El código ${codigo} ya está en uso`
    return
  }
  if (proveedoresOptions.value.some(p => (p.nombre || '').trim().toUpperCase() === nombre)) {
    provError.value = 'Ya existe un proveedor con ese nombre'
    return
  }

  provGuardando.value = true
  try {
    const resp = await proveedoresService.crearProveedor({
      codigo,
      nombre,
      telefono1: (provDraft.value.telefono1 || '').trim() || null,
      direccion: (provDraft.value.direccion || '').trim().toUpperCase() || null,
      empresa:   empresa.value,
    })
    const nuevo = resp?.data || resp
    if (!nuevo?.codigo) throw new Error('El proveedor se creó sin código')

    // Queda disponible en el selector y seleccionado en el gasto
    proveedoresOptions.value = [nuevo, ...proveedoresOptions.value]
    form.value.proveedor = nuevo.codigo
    provDialogOpen.value = false
  } catch (e) {
    provError.value = e?.response?.data?.error || e.message || 'No se pudo crear el proveedor'
  } finally {
    provGuardando.value = false
  }
}

// ─── Alta rápida de producto/artículo en Entrada de Almacén ──
// Evita que, al no encontrar el ítem que se está comprando, haya que
// abandonar el gasto a medio capturar para crearlo en otra pantalla.
const dlgNuevoItemOpen   = ref(false)
const nuevoItemGuardando = ref(false)
const nuevoItemError     = ref('')
const nuevoItemTarget    = ref(null)   // la fila (item) del mpDraft que disparó la creación
const nuevoItemDraft     = ref({ origen: 'ARTICULO', codigo: '', nombre: '', und: 'UND', grupo: null, precio: 0 })
const gruposProductosNI  = ref([])
const gruposArticulosNI  = ref([])

const gruposNuevoItemOptions = computed(() =>
  nuevoItemDraft.value.origen === 'PRODUCTO' ? gruposProductosNI.value : gruposArticulosNI.value
)

async function cargarGruposNuevoItem() {
  try {
    const [gp, ga] = await Promise.all([
      productosAlmacenService.getGrupos().catch(() => ({ data: [] })),
      api.get('/articulos/grupos').catch(() => ({ data: { data: [] } })),
    ])
    gruposProductosNI.value = gp?.data || []
    gruposArticulosNI.value = ga?.data?.data || []
  } catch (e) {
    console.error('cargarGruposNuevoItem:', e)
  }
}

async function sugerirCodigoProducto() {
  try {
    const r = await productosAlmacenService.getProximoCodigo()
    nuevoItemDraft.value.codigo = r?.codigo || ''
  } catch {
    nuevoItemDraft.value.codigo = ''
  }
}

function cambiarOrigenNuevoItem(origen) {
  nuevoItemDraft.value.origen = origen
  nuevoItemDraft.value.grupo = null
  if (origen === 'PRODUCTO') sugerirCodigoProducto()
  else nuevoItemDraft.value.codigo = ''
}

function abrirNuevoItem(item) {
  nuevoItemError.value = ''
  nuevoItemTarget.value = item
  nuevoItemDraft.value = { origen: 'ARTICULO', codigo: '', nombre: '', und: 'UND', grupo: null, precio: 0 }
  dlgNuevoItemOpen.value = true
  cargarGruposNuevoItem()
}

async function guardarNuevoItem() {
  const nombre = (nuevoItemDraft.value.nombre || '').trim().toUpperCase()
  const codigo = (nuevoItemDraft.value.codigo || '').trim()
  const und    = (nuevoItemDraft.value.und || 'UND').trim().toUpperCase()
  const precio = parseFloat(nuevoItemDraft.value.precio) || 0
  const origen = nuevoItemDraft.value.origen

  if (!nombre) { nuevoItemError.value = 'El nombre es requerido'; return }
  if (origen === 'PRODUCTO' && !codigo) { nuevoItemError.value = 'El código es requerido para un producto'; return }
  if (itemsOptions.value.some(o => o.origen === origen && String(o.codigo).trim() === codigo && codigo)) {
    nuevoItemError.value = `El código ${codigo} ya está en uso`
    return
  }

  nuevoItemGuardando.value = true
  try {
    let data
    if (origen === 'PRODUCTO') {
      const r = await api.post('/almacen/productos', {
        codigo, nombre, und,
        grupo: nuevoItemDraft.value.grupo || null,
        control: 'SI', visible_operacional: 'SI', para_venta: 'NO',
        precio_costo: precio,
      })
      data = r.data?.data
      data.precio = parseFloat(data.precio_costo) || 0
    } else {
      const r = await api.post('/articulos', {
        codigo: codigo || undefined, nombre, und,
        valor: precio, grupo: nuevoItemDraft.value.grupo || null,
      })
      data = r.data?.data
      data.precio = parseFloat(data.valor) || 0
    }
    if (!data?.codigo) throw new Error(`El ${origen === 'PRODUCTO' ? 'producto' : 'artículo'} se creó sin código`)

    const key = `${origen}::${data.codigo}`
    const opt = { key, codigo: data.codigo, origen, nombre: data.nombre, und: data.und || und, precio: data.precio }
    itemsOptions.value = [opt, ...itemsOptions.value]

    // Selecciona el ítem recién creado en la fila que disparó la creación
    if (nuevoItemTarget.value) {
      nuevoItemTarget.value.key = key
      onItemSeleccionado(nuevoItemTarget.value)
    }
    dlgNuevoItemOpen.value = false
  } catch (e) {
    nuevoItemError.value = e?.response?.data?.error || e.message || 'No se pudo crear el ítem'
  } finally {
    nuevoItemGuardando.value = false
  }
}

const errorMsg = ref('')
const guardando = ref(false)
const step = ref(0)

// ─── ESC no cierra directamente: pide confirmación ───────────
// v-dialog queda `persistent` (bloquea el cierre automático de Vuetify por ESC
// o clic afuera) y este @keydown.esc propio abre un popup de confirmación —
// que a su vez es `persistent`, así que ESC no lo cierra a él tampoco.
const dlgConfirmCerrar   = ref(false)
const dlgConfirmCerrarMp = ref(false)
function pedirConfirmarCierre()   { dlgConfirmCerrar.value   = true }
function pedirConfirmarCierreMp() { dlgConfirmCerrarMp.value = true }

// ─── Navegación con Enter: salta al siguiente campo visible ──
const contentRef = ref(null)     // panel principal (pasos 1 y 2)
const mpContentRef = ref(null)   // sub-diálogo de materia prima

function focusableEls(containerRef) {
  const raw = containerRef?.value
  const el = raw?.$el || raw   // v-card-text expone el DOM en $el; un <div ref> ya es el DOM
  if (!el) return []
  return Array.from(el.querySelectorAll('input:not([type=hidden]):not([disabled]), textarea:not([disabled])'))
    .filter(node => node.offsetParent !== null)
}

function onEnterNav(e, containerRef, onLast) {
  const target = e.target
  // Si el autocomplete/select tiene el menú abierto, dejar que Vuetify seleccione el ítem
  if (target?.getAttribute && target.getAttribute('aria-expanded') === 'true') return
  e.preventDefault()
  const els = focusableEls(containerRef)
  const idx = els.indexOf(target)
  if (idx === -1) return
  if (idx < els.length - 1) {
    els[idx + 1].focus()
    els[idx + 1].select?.()
  } else {
    onLast?.()
  }
}

function onEnterMain(e) {
  onEnterNav(e, contentRef, () => {
    if (step.value < 2) siguientePaso()
    else handleSubmit()
  })
}

function onEnterMp(e) {
  onEnterNav(e, mpContentRef, () => confirmarMateriaPrima())
}

const proveedoresOptions = ref([])
const centrosCostosOptions = ref([])
const cuentasContablesOptions = ref([])
const formasPagoOptions = ref([])

// Filtro de proveedor: ignora acentos/mayúsculas y busca por nombre o código,
// sin importar el orden de las palabras (ej: "TEPUI F" encuentra "FERRETERIA TEPUI")
function normalizarTexto(s) {
  return (s ?? '').toString()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase().trim()
}
function filtroProveedor(_value, query, item) {
  const q = normalizarTexto(query)
  if (!q) return true
  const nombre = normalizarTexto(item?.raw?.nombre)
  const codigo = normalizarTexto(item?.raw?.codigo)
  const palabras = q.split(/\s+/).filter(Boolean)
  return palabras.every(p => nombre.includes(p) || codigo.includes(p))
}

// Cuenta contable configurada como "materia prima" (config_general.cta_materia_prima)
const ctaMateriaPrima = ref(null)

// Valor por defecto de los checkboxes del diálogo de materia prima, configurable
// en Configuración > Configuración General. Solo define con qué queda marcado
// el checkbox al abrir — se puede cambiar libremente en cada línea sin que eso
// afecte la preferencia guardada.
const mpAfectaInventarioDefault = ref(true)
const mpActualizaCostoDefault   = ref(true)

let uidSeq = 1
const lineaVacia = () => ({
  uid: uidSeq++,
  ccosto: '',
  cuenta: '',
  concepto: '',
  subtotal: 0,
  impuestos: 0,
  materiaPrima: null,   // { afectaInventario, actualizaCosto, items: [{codigo, cantidad, costoUnit}] }
})

const formVacio = () => {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return {
    codigo: '',
    fecha: `${y}-${m}-${d}`,
    factura: '',
    proveedor: '',
    forma_pago: '',
    numero_cheque: '',
    lineas: [lineaVacia()],
  }
}

const form = ref(formVacio())
const esEdicion = computed(() => !!props.gasto?.codigo)

// ─── Número de cheque ─────────────────────────────────
// Solo se pide si la cuenta seleccionada lleva un consecutivo de cheque
// configurado (cuentas_bancarias.cheque > 0). Se sugiere ese consecutivo,
// editable, y al guardar el gasto la cuenta avanza al siguiente número.
const cuentaSeleccionada = computed(() =>
  formasPagoOptions.value.find(c => c.codigo === form.value.forma_pago) || null
)
const muestraCheque = computed(() => {
  const v = parseInt(cuentaSeleccionada.value?.cheque)
  return (!isNaN(v) && v > 0) || !!form.value.numero_cheque
})
watch(() => form.value.forma_pago, () => {
  if (muestraCheque.value) {
    if (!form.value.numero_cheque) form.value.numero_cheque = String(cuentaSeleccionada.value.cheque)
  } else {
    form.value.numero_cheque = ''
  }
})

// ─── Totales ─────────────────────────────────────────
// Acepta coma o punto como separador decimal (el campo se escribe como texto libre)
function toNum(v) { return parseFloat(String(v ?? '').replace(',', '.')) || 0 }
const totalLinea = (ln) => toNum(ln.subtotal) + toNum(ln.impuestos)
const sumSubtotal  = computed(() => form.value.lineas.reduce((s, l) => s + toNum(l.subtotal), 0))
const sumImpuestos = computed(() => form.value.lineas.reduce((s, l) => s + toNum(l.impuestos), 0))
const sumTotal     = computed(() => sumSubtotal.value + sumImpuestos.value)

// ─── Nombres para el resumen (paso 3) ────────────────
const nombreProveedor = computed(() => proveedoresOptions.value.find(p => p.codigo === form.value.proveedor)?.nombre || '—')
const nombreFormaPago = computed(() => formasPagoOptions.value.find(c => c.codigo === form.value.forma_pago)?.nombre_cta || '—')
function nombreCcosto(codigo) { return centrosCostosOptions.value.find(c => c.codigo === codigo)?.nombre || codigo || '—' }
function nombreCuenta(codigo) { return cuentasContablesOptions.value.find(c => c.codigo === codigo)?.nombre || codigo || '—' }

// ─── Pasos del wizard ────────────────────────────────
const stepsInfo = computed(() => [
  { title: 'Comprobante', sub: form.value.proveedor ? nombreProveedor.value : 'Fecha, factura y proveedor' },
  { title: 'Distribución', sub: `${form.value.lineas.length} línea${form.value.lineas.length !== 1 ? 's' : ''} · ${formatMoneda(sumTotal.value)}` },
  { title: 'Confirmar', sub: 'Revisar y guardar' },
])

function validarPaso(n) {
  if (n === 0) {
    if (!form.value.fecha)      return 'La fecha es requerida'
    if (!form.value.proveedor)  return 'Debe seleccionar un proveedor'
    if (!form.value.forma_pago) return 'Debe seleccionar una forma de pago'
  }
  if (n === 1) {
    for (const [i, ln] of form.value.lineas.entries()) {
      if (!ln.ccosto) return `Línea ${i + 1}: selecciona el centro de costos`
      if (!ln.cuenta) return `Línea ${i + 1}: selecciona la cuenta contable`
      if (!(toNum(ln.subtotal) > 0)) return `Línea ${i + 1}: el subtotal debe ser mayor a 0`
    }
  }
  return null
}

function siguientePaso() {
  const err = validarPaso(step.value)
  if (err) { errorMsg.value = err; return }
  errorMsg.value = ''
  step.value++
}

function irAPaso(i) {
  if (i <= step.value) { step.value = i; return }
  // Avanzar directo requiere validar los pasos intermedios
  for (let s = step.value; s < i; s++) {
    const err = validarPaso(s)
    if (err) { errorMsg.value = err; return }
  }
  errorMsg.value = ''
  step.value = i
}

// ─── Líneas ──────────────────────────────────────────
function agregarLinea() {
  const prev = form.value.lineas[form.value.lineas.length - 1]
  const nueva = lineaVacia()
  if (prev) nueva.ccosto = prev.ccosto   // hereda el CC para agilizar captura
  form.value.lineas.push(nueva)
}

function quitarLinea(idx) {
  form.value.lineas.splice(idx, 1)
}

function esMateriaPrima(ln) {
  return !!ctaMateriaPrima.value && ln.cuenta === ctaMateriaPrima.value
}

// ─── Sub-dialog materia prima ────────────────────────
const mpDialogOpen = ref(false)
const mpLineaIdx = ref(-1)
const mpDraft = ref({ afectaInventario: false, actualizaCosto: false, items: [] })
const mpLineaRef = computed(() => form.value.lineas[mpLineaIdx.value] || null)

// Lista combinada: productos controlados en inventario + artículos (materia prima).
// Cada opción lleva `key` = `${origen}::${codigo}` para desambiguar posibles
// colisiones de código entre ambas tablas.
const itemsOptions = ref([])
const productosLoading = ref(false)

// Presentaciones de compra (Almacén > Configuración > Presentaciones de Compra),
// indexadas por la misma key `${origen}::${codigo}` que usan los ítems, para
// mostrar chips de conversión rápida en la fila del producto/artículo.
const presentacionesPorKey = ref({})

async function cargarPresentaciones() {
  if (Object.keys(presentacionesPorKey.value).length) return
  try {
    const r = await presentacionesCompraService.getPresentaciones()
    const mapa = {}
    for (const p of (r.data || [])) {
      const key = `${p.origen}::${p.codigo}`
      if (!mapa[key]) mapa[key] = []
      mapa[key].push(p)
    }
    presentacionesPorKey.value = mapa
  } catch (e) {
    console.error('cargarPresentaciones:', e)
  }
}

function presentacionesDe(key) {
  return presentacionesPorKey.value[key] || []
}

// Comprar por presentación: en vez de convertir de cabeza, se digita cuántas
// unidades de compra entraron (ej. "3" frascos) y se multiplica por el
// contenido de la presentación (2.26 KL) para poner el resultado en Cantidad.
const dlgPresentacion   = ref(false)
const presDialogItem     = ref(null)
const presDialogPres     = ref(null)
const presDialogCantidad = ref(1)

function abrirPresentacion(item, pres) {
  presDialogItem.value = item
  presDialogPres.value = pres
  presDialogCantidad.value = 1
  dlgPresentacion.value = true
}

function confirmarPresentacion() {
  const qty = parseFloat(presDialogCantidad.value) || 0
  if (presDialogItem.value && presDialogPres.value && qty > 0) {
    const total = qty * parseFloat(presDialogPres.value.contenido)
    presDialogItem.value.cantidad = Math.round(total * 10000) / 10000
  }
  dlgPresentacion.value = false
}

function formatNumPres(n) {
  const v = parseFloat(n)
  if (isNaN(v)) return '—'
  return v.toLocaleString('es-CO', { maximumFractionDigits: 4 })
}

async function cargarItemsCompra() {
  if (itemsOptions.value.length || productosLoading.value) return
  productosLoading.value = true
  try {
    const [resProd, resArt] = await Promise.all([
      api.get('/almacen/productos', { params: { empresa: empresa.value } }),
      api.get('/articulos'),
    ])
    const productos = (resProd.data?.data || [])
      .filter(p => p.control === 'SI')   // solo los que maneja la bodega maestra
      .map(p => ({
        key: `PRODUCTO::${p.codigo}`,
        codigo: p.codigo,
        origen: 'PRODUCTO',
        nombre: p.nombre,
        und: p.und || '',
        precio: parseFloat(p.precio_costo) || 0,
      }))
    const articulos = (resArt.data?.data || []).map(a => ({
      key: `ARTICULO::${a.codigo}`,
      codigo: a.codigo,
      origen: 'ARTICULO',
      nombre: a.nombre,
      und: a.und || '',
      precio: parseFloat(a.valor) || 0,
    }))
    itemsOptions.value = [...productos, ...articulos]
  } catch (e) {
    console.error('cargarItemsCompra:', e)
  } finally {
    productosLoading.value = false
  }
}

// Búsqueda tolerante a acentos/orden de palabras, por nombre o código
function filtroItemCompra(_value, query, item) {
  const q = normalizarTexto(query)
  if (!q) return true
  const nombre = normalizarTexto(item?.raw?.nombre)
  const codigo = normalizarTexto(item?.raw?.codigo)
  return q.split(/\s+/).filter(Boolean).every(p => nombre.includes(p) || codigo.includes(p))
}

const itemVacio = () => ({ key: '', codigo: '', origen: '', cantidad: 0, costoUnit: 0 })

// Ítems del borrador que son materia prima de recetas: el inventario de almacén
// solo lleva stock de productos, así que estos no generan movimiento aunque se
// marque "afectar inventario".
const mpArticulosSinStock = computed(() =>
  (mpDraft.value.items || [])
    .filter(it => it.origen === 'ARTICULO' && it.codigo)
    .map(it => itemsOptions.value.find(o => o.key === it.key)?.nombre || it.codigo)
)

function abrirMateriaPrima(idx) {
  mpLineaIdx.value = idx
  const existente = form.value.lineas[idx].materiaPrima
  mpDraft.value = existente
    ? JSON.parse(JSON.stringify(existente))
    : {
        // Solo aplica el default a un borrador nuevo — una línea ya guardada
        // conserva lo que el usuario eligió esa vez, sin importar si luego
        // cambia la preferencia general.
        afectaInventario: mpAfectaInventarioDefault.value,
        actualizaCosto:   mpActualizaCostoDefault.value,
        items: [itemVacio()],
      }
  if (!mpDraft.value.items.length) mpDraft.value.items.push(itemVacio())
  mpDialogOpen.value = true
  cargarItemsCompra()
  cargarPresentaciones()
}

function agregarItemMp() {
  mpDraft.value.items.push(itemVacio())
}

function onItemSeleccionado(item) {
  const opt = itemsOptions.value.find(o => o.key === item.key)
  if (!opt) return
  item.codigo = opt.codigo
  item.origen = opt.origen
  if (!item.costoUnit || item.costoUnit === 0) {
    item.costoUnit = opt.precio || 0
  }
}

function undItem(item) {
  return itemsOptions.value.find(o => o.key === item?.key)?.und || ''
}

const totalItemsMp = (mp) =>
  (mp?.items || []).reduce((s, it) => s + (parseFloat(it.cantidad) || 0) * (parseFloat(it.costoUnit) || 0), 0)

function confirmarMateriaPrima() {
  const items = mpDraft.value.items.filter(it => it.codigo && (parseFloat(it.cantidad) || 0) > 0)

  // Fila con datos capturados (producto elegido, cantidad o costo) que no
  // califica para guardarse — antes se perdía sin avisar, que es justo lo que
  // pasó con un artículo mal cargado sin código.
  const incompletas = mpDraft.value.items.filter(it =>
    !(it.codigo && (parseFloat(it.cantidad) || 0) > 0) &&
    (it.key || (parseFloat(it.cantidad) || 0) > 0 || (parseFloat(it.costoUnit) || 0) > 0)
  )
  if (incompletas.length) {
    const nombres = incompletas
      .map(it => itemsOptions.value.find(o => o.key === it.key)?.nombre || it.key || '(sin producto)')
      .join(', ')
    const seguir = confirm(
      `Estas filas no se van a guardar porque les falta producto o cantidad: ${nombres}.\n\n` +
      `¿Continuar de todas formas? (Cancelar para corregirlas)`
    )
    if (!seguir) return
  }

  if (mpLineaIdx.value >= 0) {
    form.value.lineas[mpLineaIdx.value].materiaPrima = items.length
      ? { afectaInventario: mpDraft.value.afectaInventario, actualizaCosto: mpDraft.value.actualizaCosto, items }
      : null
    // Refleja el total de la entrada de almacén como subtotal de la línea de distribución
    if (items.length) {
      form.value.lineas[mpLineaIdx.value].subtotal = Math.round(totalItemsMp({ items }) * 100) / 100
    }
  }
  mpDialogOpen.value = false
}

// ─── Carga de opciones ───────────────────────────────
onMounted(async () => {
  try {
    const [prov, centros, cuentas, cuentasBank, cfg] = await Promise.all([
      proveedoresService.getProveedores({ limit: 2000 }),
      centroCostosService.getCentrosCostos({ limit: 2000 }),
      cuentasContablesService.getCuentasContables({ limit: 500 }),
      cuentasBancariasService.getCuentas({ limit: 500, estado: 'ACTIVA' }),
      api.get('/config-general', { params: { empresa: empresa.value } }).catch(() => null),
    ])
    const proveedoresCrudos = prov?.data || (Array.isArray(prov) ? prov : [])
    const codigosVistos = new Set()
    proveedoresOptions.value = proveedoresCrudos.filter(p => {
      if (codigosVistos.has(p.codigo)) return false
      codigosVistos.add(p.codigo)
      return true
    })
    centrosCostosOptions.value    = centros?.data || (Array.isArray(centros) ? centros : [])
    cuentasContablesOptions.value = cuentas?.data || (Array.isArray(cuentas) ? cuentas : [])
    formasPagoOptions.value       = cuentasBank?.data || (Array.isArray(cuentasBank) ? cuentasBank : (cuentasBank || []))
    const cfgData = cfg?.data?.data || {}
    ctaMateriaPrima.value            = cfgData.cta_materia_prima || null
    mpAfectaInventarioDefault.value  = (cfgData.mp_afecta_inventario_default ?? 'SI') === 'SI'
    mpActualizaCostoDefault.value    = (cfgData.mp_actualiza_costo_default   ?? 'SI') === 'SI'
  } catch (err) {
    console.error('Error cargando opciones:', err)
  }
})

// ─── Sincronizar al abrir ────────────────────────────
watch(() => props.open, async (val) => {
  if (!val) return
  errorMsg.value = ''
  step.value = 0
  if (props.gasto?.codigo) {
    try {
      const gastoFresco = await gestionGastosService.getGasto(props.gasto.codigo)
      const gasto = gastoFresco.data || gastoFresco
      form.value = {
        codigo: gasto.codigo || '',
        fecha: (gasto.fecha || '').split('T')[0],
        factura: gasto.factura || '',
        proveedor: gasto.proveedor || '',
        forma_pago: gasto.forma_pago || '',
        numero_cheque: gasto.numero_cheque ? String(gasto.numero_cheque) : '',
        lineas: [{
          uid: uidSeq++,
          ccosto: gasto.ccosto || '',
          cuenta: gasto.cuenta || '',
          concepto: (gasto.concepto || '').toUpperCase(),
          subtotal: Math.round(parseFloat(gasto.subtotal || 0) * 100) / 100,
          impuestos: Math.round(parseFloat(gasto.impuestos || 0) * 100) / 100,
          materiaPrima: null,
        }],
      }
      // Si la forma de pago del gasto ya no está activa, se agrega igual a las
      // opciones (solo para esta edición) para que el campo no quede en blanco.
      if (gasto.forma_pago && !formasPagoOptions.value.some(c => c.codigo === gasto.forma_pago)) {
        formasPagoOptions.value = [
          ...formasPagoOptions.value,
          { codigo: gasto.forma_pago, nombre_cta: gasto.forma_pago_nombre || gasto.forma_pago },
        ]
      }
    } catch (err) {
      console.error('Error cargando gasto:', err)
      errorMsg.value = 'No se pudo cargar el gasto'
    }
  } else {
    form.value = formVacio()
  }
})

// ─── Verificación de factura duplicada ────────────────
const dlgFacturaDuplicada = ref(false)
const facturasDuplicadas  = ref([])

async function handleSubmit() {
  const err = validarPaso(0) || validarPaso(1)
  if (err) { errorMsg.value = err; return }
  errorMsg.value = ''

  const factura = form.value.factura.trim()
  if (factura && form.value.proveedor) {
    try {
      const chk = await gestionGastosService.verificarFactura({
        proveedor: form.value.proveedor,
        factura,
        excluirCodigo: esEdicion.value ? props.gasto.codigo : null,
      })
      if (chk?.existe) {
        facturasDuplicadas.value = chk.data || []
        dlgFacturaDuplicada.value = true
        return
      }
    } catch (e) {
      console.error('Error verificando factura duplicada:', e)
    }
  }

  await guardarGasto()
}

async function continuarGuardarDeTodosModos() {
  dlgFacturaDuplicada.value = false
  await guardarGasto()
}

// ─── Guardar ─────────────────────────────────────────
async function guardarGasto() {
  guardando.value = true
  try {
    let resultado
    if (esEdicion.value) {
      // Edición: comportamiento clásico sobre un solo gasto
      const ln = form.value.lineas[0]
      resultado = await store.actualizarGasto(props.gasto.codigo, {
        fecha: form.value.fecha,
        factura: form.value.factura.trim() || null,
        proveedor: form.value.proveedor,
        ccosto: ln.ccosto,
        forma_pago: form.value.forma_pago,
        numero_cheque: muestraCheque.value ? (form.value.numero_cheque || null) : null,
        cuenta: ln.cuenta,
        concepto: (ln.concepto || '').trim(),
        subtotal: toNum(ln.subtotal),
        impuestos: toNum(ln.impuestos),
        total: totalLinea(ln),
      })
    } else {
      // Creación: N líneas → N gastos + 1 solo moviban
      resultado = await store.crearGastoMultiple({
        fecha: form.value.fecha,
        factura: form.value.factura.trim() || null,
        proveedor: form.value.proveedor,
        forma_pago: form.value.forma_pago,
        numero_cheque: muestraCheque.value ? (form.value.numero_cheque || null) : null,
        lineas: form.value.lineas.map(ln => ({
          ccosto: ln.ccosto,
          cuenta: ln.cuenta,
          concepto: (ln.concepto || '').trim(),
          subtotal: toNum(ln.subtotal),
          impuestos: toNum(ln.impuestos),
          total: totalLinea(ln),
          materiaPrima: esMateriaPrima(ln) ? ln.materiaPrima : null,
        })),
      })
    }
    emit('guardar', resultado)
    cerrar()
  } catch (err2) {
    errorMsg.value = err2.response?.data?.error || err2.response?.data?.message || err2.message || 'Error al guardar'
  } finally {
    guardando.value = false
  }
}

function cerrar() {
  form.value = formVacio()
  errorMsg.value = ''
  step.value = 0
  mpDialogOpen.value = false
  emit('update:open', false)
  emit('close')
}
</script>

<style scoped>
/* ═══ CARD ═══════════════════════════════════════════════════════════ */
.wiz-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  overflow: hidden;
}

/* ═══ HEADER ═════════════════════════════════════════════════════════ */
.wiz-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 24px;
  background: linear-gradient(135deg, var(--indigo) 0%, var(--gold) 100%);
}
.wiz-header-icon {
  width: 46px;
  height: 46px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.wiz-header-text { flex: 1; }
.wiz-header-title {
  color: white;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.3px;
  margin: 0;
}
.wiz-header-sub {
  color: rgba(255, 255, 255, 0.65);
  font-size: 12px;
  margin: 3px 0 0;
}
.codigo-badge {
  background: rgba(255,255,255,0.18);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  border: 1px solid rgba(255,255,255,0.3);
  white-space: nowrap;
}
.codigo-badge.auto {
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.7);
  font-style: italic;
  letter-spacing: 1px;
}

/* ═══ BODY: SIDEBAR + CONTENIDO ══════════════════════════════════════ */
.wiz-body {
  display: flex;
  min-height: 460px;
  max-height: 62vh;
}

/* Sidebar */
.wiz-sidebar {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  background: rgba(var(--v-theme-on-surface), 0.015);
  padding: 16px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.wiz-step {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 10px;
  border-radius: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background .15s;
}
.wiz-step:hover { background: rgba(var(--v-theme-on-surface), 0.05); }
.wiz-step-active { background: rgba(102,126,234,0.1); }
.wiz-step-num {
  width: 26px; height: 26px; border-radius: 50%;
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.5);
  font-size: 12px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.wiz-step-active .wiz-step-num { background: var(--indigo); color: white; }
.wiz-step-done .wiz-step-num { background: var(--success); color: white; }
.wiz-step-title { font-size: 12.5px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }
.wiz-step-active .wiz-step-title { color: var(--indigo); }
.wiz-step-sub {
  font-size: 10.5px; color: rgba(var(--v-theme-on-surface), 0.45);
  margin-top: 2px; line-height: 1.3;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 168px;
}

/* Contenido */
.wiz-content {
  flex: 1;
  min-width: 0;
  padding: 22px 28px;
  overflow-y: auto;
}
.wiz-content-simple {
  padding: 18px 24px !important;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.wiz-pane { display: flex; flex-direction: column; gap: 18px; }
.wiz-pane-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 15px; font-weight: 800; color: rgb(var(--v-theme-on-surface));
}
.wiz-pane-hint {
  font-size: 12px; font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.45);
  margin-left: 4px;
}

/* ═══ CAMPOS ══════════════════════════════════════════════════════════ */
.field-row { display: flex; gap: 16px; flex-wrap: wrap; }
.field-col-full { flex: 1 1 100%; min-width: 0; }
.field-col-half { flex: 1 1 260px; min-width: 220px; }
.field-col-3 { flex: 1 1 200px; min-width: 180px; }
.field-col-amt { width: 220px; flex-shrink: 0; }
.field-col-amt-full { flex: 1 1 180px; min-width: 160px; }
.montos-row { gap: 20px; }

/* ═══ LÍNEAS DE DISTRIBUCIÓN ═════════════════════════════════════════ */
.dist-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  border-left: 3px solid #0ea5e9;
  border-radius: 12px;
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.dist-card-head { display: flex; align-items: center; gap: 10px; }
.dist-card-num {
  width: 24px; height: 24px; border-radius: 50%;
  background: rgba(14,165,233,0.12); color: #0ea5e9;
  font-size: 11px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.dist-card-total {
  margin-left: auto;
  font-family: monospace; font-size: 15px; font-weight: 800; color: #0ea5e9;
}

/* Chip materia prima */
.mp-chip-row { width: 100%; }
.mp-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px dashed rgba(245,158,11,0.5);
  background: rgba(245,158,11,0.06);
  color: var(--gold-strong);
  border-radius: 18px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all .15s;
}
.mp-chip:hover { background: rgba(245,158,11,0.14); }
.mp-chip-ok {
  border-style: solid;
  background: rgba(16,185,129,0.07);
  border-color: rgba(16,185,129,0.4);
  color: #059669;
}
.mp-chip-tag {
  background: rgba(16,185,129,0.15);
  padding: 1px 7px;
  border-radius: 9px;
  font-size: 9px;
  font-weight: 800;
}

/* ═══ RESUMEN (paso 3) ═══════════════════════════════════════════════ */
.resumen-card {
  background: rgba(var(--v-theme-on-surface), 0.025);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-radius: 12px;
  padding: 14px 18px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px 20px;
}
.resumen-row { display: flex; flex-direction: column; gap: 2px; }
.resumen-lbl { font-size: 10px; font-weight: 800; letter-spacing: 0.6px; color: rgba(var(--v-theme-on-surface), 0.45); text-transform: uppercase; }
.resumen-val { font-size: 13.5px; font-weight: 600; }

/* Tabla de líneas */
.lineas-tabla { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.lineas-tabla thead th {
  text-align: left; padding: 8px 10px;
  font-size: 10px; font-weight: 800; letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.45);
  border-bottom: 2px solid rgba(var(--v-theme-on-surface), 0.08);
}
.lineas-tabla tbody td { padding: 9px 10px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); }
.col-right { text-align: right; font-family: monospace; }
.col-center { text-align: center; }

/* ═══ TOTALES ════════════════════════════════════════════════════════ */
.tot-grid { display: flex; gap: 12px; flex-wrap: wrap; }
.tot-item {
  flex: 1;
  min-width: 140px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.tot-item-final {
  background: linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%);
  border: 1.5px solid rgba(102,126,234,0.5);
}
.tot-lbl {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.6px;
  color: rgba(var(--v-theme-on-surface), 0.45);
}
.tot-val {
  font-family: monospace;
  font-size: 17px;
  font-weight: 800;
}
.tot-val-final { color: var(--indigo); font-size: 20px; }
.tot-nota {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

/* ═══ MATERIA PRIMA (sub-dialog) ═════════════════════════════════════ */
.mp-opts {
  background: rgba(245,158,11,0.05);
  border: 1px solid rgba(245,158,11,0.2);
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mp-opt-lbl { font-size: 12.5px; line-height: 1.4; }

/* Alta rápida de proveedor */
.prov-field { display: flex; align-items: center; gap: 8px; }
.prov-field > .v-autocomplete { flex: 1; }
.prov-add-btn { flex: 0 0 auto; }
.prov-nodata {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 10px 14px; font-size: 12.5px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
.prov-dlg-header {
  display: flex; align-items: center;
  font-size: 14px; font-weight: 700;
  background: rgba(var(--v-theme-on-surface), 0.04);
  padding: 14px 18px;
}
.prov-dlg-sub {
  font-size: 12.5px; line-height: 1.45; margin-bottom: 14px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
.ni-origen-toggle { display: flex; gap: 8px; margin-bottom: 16px; }
.ni-origen-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 9px 10px; border-radius: 8px; font-size: 12px; font-weight: 700;
  cursor: pointer; border: 2px solid rgba(var(--v-theme-on-surface), 0.12);
  background: transparent; color: rgba(var(--v-theme-on-surface), 0.6);
  transition: all 0.15s;
}
.ni-origen-btn:hover { background: rgba(var(--v-theme-on-surface), 0.04); }
.ni-origen-btn.active { background: var(--gold); border-color: var(--gold); color: #fff; }
.mp-aviso {
  display: flex; align-items: flex-start; gap: 7px;
  margin-top: 6px; padding: 7px 10px; border-radius: 8px;
  background: rgba(245,158,11,0.12);
  font-size: 11.5px; line-height: 1.45;
  color: rgba(var(--v-theme-on-surface), 0.75);
}
.mp-items { display: flex; flex-direction: column; gap: 12px; }

/* Cada producto comprado es una tarjeta propia — separa visualmente dónde
   empieza y termina uno, en vez de un río continuo de campos envueltos. */
.mp-item-card {
  display: flex; flex-direction: column; gap: 10px;
  padding: 14px; border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.mp-item-top { display: flex; align-items: center; gap: 8px; }
.mp-item-prod { flex: 1; min-width: 0; }
.mp-item-del { flex-shrink: 0; }

.mp-item-presentaciones {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.mp-pres-lbl { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5); }
.mp-pres-chip { font-size: 11px !important; text-transform: none; letter-spacing: normal; }

.mp-item-bottom { display: flex; align-items: flex-end; gap: 10px; }
.mp-item-cant  { flex: 1; min-width: 110px; }
.mp-item-costo { flex: 1; min-width: 110px; }
.mp-item-subtotal {
  flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end;
  min-width: 90px; padding-bottom: 2px;
}
.mp-item-subtotal-lbl {
  font-size: 9px; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.4);
}
.mp-item-subtotal-val { font-family: monospace; font-size: 14px; font-weight: 800; color: var(--gold-strong); }

.mp-add-btn { align-self: flex-start; }

/* Popup "comprar por presentación" */
.pres-dlg-sub { font-size: 12.5px; line-height: 1.45; color: rgba(var(--v-theme-on-surface), 0.6); margin-bottom: 12px; }
.pres-dlg-preview {
  margin-top: 10px; padding: 8px 12px; border-radius: 8px;
  background: rgba(245,158,11,0.1); color: var(--gold-strong);
  font-family: monospace; font-size: 14px; font-weight: 700; text-align: center;
}
.mp-prod-meta { font-size: 10px; color: rgba(var(--v-theme-on-surface), 0.4); display: inline-flex; align-items: center; gap: 6px; }
.mp-origen-tag {
  font-size: 8.5px;
  font-weight: 800;
  letter-spacing: 0.3px;
  padding: 1px 6px;
  border-radius: 8px;
  text-transform: uppercase;
}
.mp-origen-tag.tag-prod { background: rgba(102,126,234,0.14); color: var(--indigo); }
.mp-origen-tag.tag-art  { background: rgba(245,158,11,0.16); color: var(--gold-strong); }
.mp-total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-top: 2px solid rgba(var(--v-theme-on-surface), 0.08);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.4px;
}
.mp-total-val { font-family: monospace; font-size: 15px; color: var(--gold-strong); }
.mp-warn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--gold-strong);
  background: rgba(245,158,11,0.07);
  border-radius: 8px;
  padding: 8px 12px;
}

/* ═══ DIALOG FACTURA DUPLICADA ══════════════════════════════════════ */
.dlg-dup-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  font-weight: 700;
  font-size: 15px;
  background: rgba(245,158,11,0.08);
  border-bottom: 1px solid rgba(245,158,11,0.2);
}
.dup-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(var(--v-theme-on-surface),.03);
  border-radius: 8px;
  padding: 8px 12px;
  max-height: 180px;
  overflow-y: auto;
}
.dup-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),.06);
}
.dup-item:last-child { border-bottom: none; }
.dup-cod { font-family: monospace; font-weight: 700; color: var(--gold); }
.dup-fecha { color: rgba(var(--v-theme-on-surface),.6); }
.dup-total { margin-left: auto; font-family: monospace; font-weight: 600; }

/* ═══ FOOTER ═════════════════════════════════════════════════════════ */
.wiz-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.01);
}
.wiz-footer-right { display: flex; gap: 10px; }
.btn-save {
  background: linear-gradient(135deg, var(--indigo) 0%, var(--gold) 100%) !important;
  font-weight: 600;
  letter-spacing: 0.3px;
  min-width: 160px;
}

@media (max-width: 700px) {
  .wiz-body { flex-direction: column; max-height: none; }
  .wiz-sidebar { width: 100%; flex-direction: row; overflow-x: auto; }
  .wiz-step-sub { display: none; }
}
</style>
