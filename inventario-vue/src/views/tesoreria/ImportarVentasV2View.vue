<template>
  <MainLayout>
    <div class="iv-wrap">

      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">TESORERÍA</span>
        <v-icon size="13" color="#06b6d4">mdi-chevron-right</v-icon>
        <span class="bc-cat">Procesos</span>
        <v-icon size="13" color="#475569">mdi-chevron-right</v-icon>
        <span class="bc-cur">Importar Ventas V 2.0</span>
      </div>

      <!-- HEADER -->
      <div class="iv-header">
        <div class="iv-header-left">
          <div class="iv-icon-wrap">
            <v-icon size="26" color="white">mdi-file-excel-outline</v-icon>
          </div>
          <div>
            <h1 class="iv-title">IMPORTAR VENTAS V 2.0</h1>
            <p class="iv-sub">Carga el archivo XLSX exportado desde Square con todas las pestañas del día</p>
          </div>
        </div>
      </div>

      <!-- ═══ CONFIGURACIÓN DE IMPORTACIÓN ═══ -->
      <div class="imp-cfg-card">
        <div class="imp-cfg-header">
          <div class="imp-cfg-icon">
            <v-icon size="16" color="white">mdi-tune</v-icon>
          </div>
          <span class="imp-cfg-title">CONFIGURACIÓN DE IMPORTACIÓN</span>
          <span class="imp-cfg-sub">Parámetros para los movimientos contables</span>
        </div>
        <div class="imp-cfg-fields">
          <div class="imp-cfg-field">
            <label class="imp-cfg-label">
              <v-icon size="12" color="#06b6d4" class="mr-1">mdi-calendar-outline</v-icon>
              FECHA
            </label>
            <input v-model="configFecha" type="date" class="imp-cfg-date" />
          </div>
          <div class="imp-cfg-field">
            <label class="imp-cfg-label">
              <v-icon size="12" color="#f59e0b" class="mr-1">mdi-map-marker-outline</v-icon>
              CENTRO DE COSTO
            </label>
            <v-select
              v-model="configCcosto"
              :items="ccostos"
              item-title="nombre"
              item-value="codigo"
              density="compact"
              variant="outlined"
              hide-details
              placeholder="Seleccionar..."
              :loading="ccostosLoading"
              class="imp-cfg-select"
              bg-color="rgb(var(--v-theme-surface))"
              style="min-width:180px"
            />
          </div>
          <div class="imp-cfg-field">
            <label class="imp-cfg-label">
              <v-icon size="12" color="#7c3aed" class="mr-1">mdi-credit-card-outline</v-icon>
              CTA. SQUARE
            </label>
            <v-select
              v-model="configCtaSquare"
              :items="cuentasBancarias"
              item-title="nombre_cta"
              item-value="codigo"
              density="compact"
              variant="outlined"
              hide-details
              placeholder="Cuenta tarjeta..."
              :loading="cuentasLoading"
              clearable
              class="imp-cfg-select"
              bg-color="rgb(var(--v-theme-surface))"
              style="min-width:180px"
            />
          </div>
          <div class="imp-cfg-field">
            <label class="imp-cfg-label">
              <v-icon size="12" color="#06b6d4" class="mr-1">mdi-bank-transfer-out</v-icon>
              CTA. OTROS
            </label>
            <v-select
              v-model="configCtaOtros"
              :items="cuentasBancarias"
              item-title="nombre_cta"
              item-value="codigo"
              density="compact"
              variant="outlined"
              hide-details
              placeholder="Cuenta otros..."
              :loading="cuentasLoading"
              clearable
              class="imp-cfg-select"
              bg-color="rgb(var(--v-theme-surface))"
              style="min-width:180px"
            />
          </div>
          <div class="imp-cfg-field">
            <label class="imp-cfg-label">
              <v-icon size="12" color="#10b981" class="mr-1">mdi-cash</v-icon>
              CTA. EFECTIVO
            </label>
            <v-select
              v-model="configCtaEfectivo"
              :items="cuentasBancarias"
              item-title="nombre_cta"
              item-value="codigo"
              density="compact"
              variant="outlined"
              hide-details
              placeholder="Cuenta efectivo..."
              :loading="cuentasLoading"
              clearable
              class="imp-cfg-select"
              bg-color="rgb(var(--v-theme-surface))"
              style="min-width:180px"
            />
          </div>
        </div>
      </div>

      <!-- ═══ ZONA DE CARGA ═══ -->
      <div
        class="drop-zone"
        :class="{ 'drop-zone--active': dragging, 'drop-zone--loaded': xlsxData }"
        @dragover.prevent="dragging = true"
        @dragleave="dragging = false"
        @drop.prevent="onDrop"
        @click="$refs.inputFile.click()"
      >
        <input ref="inputFile" type="file" accept=".xlsx,.xls" hidden @change="onFileInput" />
        <div v-if="!xlsxData" class="drop-content">
          <div class="drop-icon-wrap drop-icon-green">
            <v-icon size="28" color="white">mdi-file-excel-outline</v-icon>
          </div>
          <div class="drop-title">Reporte de Ventas Square (XLSX)</div>
          <div class="drop-sub">Arrastra o haz click para cargar el archivo Excel</div>
          <div class="drop-hint">Debe contener las pestañas: Sales Summary, Items, Modifiers, Payments, Fees, Taxes</div>
        </div>
        <div v-else class="drop-loaded">
          <v-icon size="32" color="#10b981">mdi-check-circle</v-icon>
          <div class="drop-loaded-name">{{ fileName }}</div>
          <div class="drop-loaded-sub">
            {{ xlsxData.location }} · {{ xlsxData.dateRange }}
          </div>
          <div class="drop-loaded-stats">
            <span class="drop-stat"><v-icon size="11" color="#3b82f6">mdi-package-variant-closed</v-icon> {{ xlsxData.items.length }} artículos</span>
            <span class="drop-stat"><v-icon size="11" color="#f59e0b">mdi-tune-variant</v-icon> {{ xlsxData.modifiers.length }} modificadores</span>
            <span class="drop-stat"><v-icon size="11" color="#8b5cf6">mdi-credit-card-outline</v-icon> {{ xlsxData.payments.length }} pagos</span>
          </div>
          <v-btn size="x-small" variant="text" color="#94a3b8" @click.stop="limpiar">
            <v-icon size="14">mdi-close</v-icon> Quitar
          </v-btn>
        </div>
      </div>

      <!-- BARRA DE ACCIONES -->
      <div v-if="xlsxData" class="iv-action-bar">
        <div class="iv-action-bar-left">
          <v-icon size="15" color="#06b6d4" class="mr-1">mdi-information-outline</v-icon>
          <span v-if="unmappedCount > 0" class="iv-action-warn">
            <v-icon size="14" color="#f59e0b">mdi-alert-outline</v-icon>
            {{ unmappedCount }} artículo{{ unmappedCount !== 1 ? 's' : '' }} sin mapear SKU
          </span>
          <span v-else class="iv-action-ok">
            <v-icon size="14" color="#10b981">mdi-check-circle</v-icon>
            Todos los artículos mapeados
          </span>
        </div>
        <div class="iv-action-bar-right">
          <v-btn variant="outlined" color="#94a3b8" size="small" @click="limpiar">
            <v-icon size="15" class="mr-1">mdi-close</v-icon> Cancelar
          </v-btn>
          <v-btn color="#06b6d4" variant="flat" size="small" @click="abrirGuardarResumen">
            <v-icon size="15" class="mr-1">mdi-database-import-outline</v-icon> Guardar
          </v-btn>
        </div>
      </div>

      <!-- ERROR DE PARSEO -->
      <div v-if="parseError" class="iv-error">
        <v-icon size="20" color="#ef4444">mdi-alert-circle-outline</v-icon>
        <span>{{ parseError }}</span>
      </div>

      <!-- ═══ TABS ═══ -->
      <div v-if="xlsxData" class="sheets-container">
        <div class="sheets-tabbar">
          <button class="sheet-tab" :class="{ 'sheet-tab--active': activeTab === 'resumen' }" @click="activeTab = 'resumen'">
            <v-icon size="13">mdi-file-chart-outline</v-icon> Resumen
          </button>
          <button class="sheet-tab" :class="{ 'sheet-tab--active': activeTab === 'items' }" @click="activeTab = 'items'">
            <v-icon size="13">mdi-package-variant-closed</v-icon> Artículos
            <span class="sheet-badge sheet-badge-purple">{{ xlsxData.items.length }}</span>
          </button>
          <button class="sheet-tab" :class="{ 'sheet-tab--active': activeTab === 'modifiers' }" @click="activeTab = 'modifiers'">
            <v-icon size="13">mdi-tune-variant</v-icon> Modificadores
            <span class="sheet-badge sheet-badge-orange">{{ xlsxData.modifiers.length }}</span>
          </button>
          <button class="sheet-tab" :class="{ 'sheet-tab--active': activeTab === 'payments' }" @click="activeTab = 'payments'">
            <v-icon size="13">mdi-credit-card-outline</v-icon> Pagos
            <span class="sheet-badge sheet-badge-green">{{ xlsxData.payments.length }}</span>
          </button>
          <button class="sheet-tab" :class="{ 'sheet-tab--active': activeTab === 'fees' }" @click="activeTab = 'fees'">
            <v-icon size="13">mdi-percent-outline</v-icon> Comisiones
          </button>
          <button class="sheet-tab" :class="{ 'sheet-tab--active': activeTab === 'consumo', 'sheet-tab--loading': consumoLoading }" @click="activeTab = 'consumo'">
            <v-icon size="13">mdi-package-down</v-icon> Consumo
            <span v-if="consumo.length" class="sheet-badge sheet-badge-red">{{ consumo.length }}</span>
            <v-progress-circular v-if="consumoLoading" size="10" width="2" indeterminate color="#ef4444" class="ml-1" />
          </button>
          <div class="sheets-tabbar-line"></div>
        </div>

        <div class="sheet-content">

          <!-- TAB: RESUMEN -->
          <div v-show="activeTab === 'resumen'" class="iv-section">
            <div class="iv-section-header">
              <div class="iv-section-icon" style="background:rgba(59,130,246,0.1)">
                <v-icon size="16" color="#3b82f6">mdi-file-chart-outline</v-icon>
              </div>
              <div>
                <div class="iv-section-title">RESUMEN DE VENTAS</div>
                <div class="iv-section-sub">{{ xlsxData.location }} · {{ xlsxData.dateRange }}</div>
              </div>
            </div>

            <div class="rs-two-col">
              <!-- VENTAS -->
              <div class="iv-card rs-card">
                <div class="iv-card-header">
                  <div class="iv-card-title">
                    <v-icon size="14" color="#3b82f6" class="mr-1">mdi-cash-register</v-icon> VENTAS
                  </div>
                </div>
                <div class="rs-rows">
                  <div class="rs-row rs-total-row">
                    <span class="rs-lbl rs-lbl-bold">Ventas Brutas</span>
                    <span class="rs-val rs-val-big rs-pos">{{ fmt(xlsxData.summary.grossSales) }}</span>
                  </div>
                  <div class="rs-row rs-sep"></div>
                  <div class="rs-row">
                    <span class="rs-lbl">Devoluciones</span>
                    <span class="rs-val rs-neg">{{ fmt(xlsxData.summary.returns) }}</span>
                  </div>
                  <div class="rs-row">
                    <span class="rs-lbl">Descuentos</span>
                    <span class="rs-val rs-neg">{{ fmt(xlsxData.summary.discounts) }}</span>
                  </div>
                  <div class="rs-row">
                    <span class="rs-lbl">Comps</span>
                    <span class="rs-val rs-neg">{{ fmt(xlsxData.summary.comps) }}</span>
                  </div>
                  <div class="rs-row rs-sep"></div>
                  <div class="rs-row rs-total-row">
                    <span class="rs-lbl rs-lbl-bold">Ventas Netas</span>
                    <span class="rs-val rs-val-big rs-pos">{{ fmt(xlsxData.summary.netSales) }}</span>
                  </div>
                  <div class="rs-row rs-sep"></div>
                  <div class="rs-row">
                    <span class="rs-lbl">Impuestos</span>
                    <span class="rs-val">{{ fmt(xlsxData.summary.salesTax) }}</span>
                  </div>
                  <div class="rs-row">
                    <span class="rs-lbl">Propinas</span>
                    <span class="rs-val rs-purple">{{ fmt(xlsxData.summary.tips) }}</span>
                  </div>
                  <div class="rs-row rs-sep"></div>
                  <div class="rs-row rs-grand-total">
                    <span class="rs-lbl rs-lbl-bold">TOTAL RECAUDADO</span>
                    <span class="rs-val rs-val-grand rs-pos">{{ fmt(xlsxData.summary.totalCollected) }}</span>
                  </div>
                </div>
              </div>

              <!-- PAGOS -->
              <div class="iv-card rs-card">
                <div class="iv-card-header">
                  <div class="iv-card-title">
                    <v-icon size="14" color="#10b981" class="mr-1">mdi-credit-card-outline</v-icon> PAGOS Y COMISIONES
                  </div>
                </div>
                <div class="rs-rows">
                  <div class="rs-row">
                    <span class="rs-lbl">Tarjetas</span>
                    <span class="rs-val rs-purple">{{ fmt(paymentTotals.card) }}</span>
                  </div>
                  <div class="rs-row">
                    <span class="rs-lbl">Efectivo</span>
                    <span class="rs-val rs-green">{{ fmt(paymentTotals.cash) }}</span>
                  </div>
                  <div class="rs-row">
                    <span class="rs-lbl">Otros</span>
                    <span class="rs-val">{{ fmt(paymentTotals.other) }}</span>
                  </div>
                  <div class="rs-row rs-sep"></div>
                  <div class="rs-row rs-total-row">
                    <span class="rs-lbl rs-lbl-bold">Total Pagos</span>
                    <span class="rs-val rs-val-big rs-pos">{{ fmt(paymentTotals.total) }}</span>
                  </div>
                  <div class="rs-row rs-sep"></div>
                  <div class="rs-row">
                    <span class="rs-lbl">Propinas (en pagos)</span>
                    <span class="rs-val rs-purple">{{ fmt(paymentTotals.tips) }}</span>
                  </div>
                  <div class="rs-row rs-sep"></div>
                  <div v-for="fee in xlsxData.fees" :key="fee.subtype" class="rs-row">
                    <span class="rs-lbl">Fee: {{ fee.subtype }}</span>
                    <span class="rs-val rs-neg">{{ fmt(fee.amount) }}</span>
                  </div>
                  <div class="rs-row rs-sep"></div>
                  <div class="rs-row rs-grand-total">
                    <span class="rs-lbl rs-lbl-bold">TOTAL COMISIONES</span>
                    <span class="rs-val rs-val-grand rs-neg">{{ fmt(totalFees) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB: ARTÍCULOS -->
          <div v-show="activeTab === 'items'" class="iv-section">
            <div class="iv-section-header">
              <div class="iv-section-icon" style="background:rgba(139,92,246,0.1)">
                <v-icon size="16" color="#8b5cf6">mdi-package-variant-closed</v-icon>
              </div>
              <div>
                <div class="iv-section-title">ARTÍCULOS VENDIDOS</div>
                <div class="iv-section-sub">{{ xlsxData.items.length }} artículos · {{ unmappedCount }} sin SKU</div>
              </div>
              <div v-if="mappingsLoading" class="enrich-badge">
                <v-progress-circular size="14" width="2" indeterminate color="#8b5cf6" />
                <span>Cargando mapeos...</span>
              </div>
            </div>

            <!-- KPIs -->
            <div class="kpi-grid kpi-grid-4">
              <div class="kpi-card kpi-purple">
                <div class="kpi-top">
                  <span class="kpi-lbl">Artículos Distintos</span>
                  <v-icon size="16" color="#8b5cf6">mdi-format-list-bulleted</v-icon>
                </div>
                <div class="kpi-val kpi-val-purple">{{ xlsxData.items.length }}</div>
              </div>
              <div class="kpi-card kpi-blue">
                <div class="kpi-top">
                  <span class="kpi-lbl">Unidades Vendidas</span>
                  <v-icon size="16" color="#3b82f6">mdi-counter</v-icon>
                </div>
                <div class="kpi-val kpi-val-blue">{{ totalUnidades }}</div>
              </div>
              <div class="kpi-card kpi-green">
                <div class="kpi-top">
                  <span class="kpi-lbl">Ventas Brutas</span>
                  <v-icon size="16" color="#10b981">mdi-cash</v-icon>
                </div>
                <div class="kpi-val kpi-val-green">{{ fmt(totalGrossSales) }}</div>
              </div>
              <div class="kpi-card kpi-green-dark">
                <div class="kpi-top">
                  <span class="kpi-lbl">Mapeados</span>
                  <v-icon size="16" color="#059669">mdi-link-variant</v-icon>
                </div>
                <div class="kpi-val kpi-val-green-dark">{{ mappedCount }}/{{ xlsxData.items.length }}</div>
              </div>
            </div>

            <!-- Tabla artículos -->
            <div class="iv-card">
              <div class="iv-card-header">
                <div class="iv-card-title">
                  <v-icon size="14" color="#8b5cf6" class="mr-1">mdi-table</v-icon> Detalle por Artículo
                </div>
                <div class="iv-card-chips">
                  <div
                    v-for="cat in categorias"
                    :key="cat"
                    class="cat-chip"
                    :class="{ 'cat-chip--active': catFiltro === cat }"
                    @click="catFiltro = catFiltro === cat ? '' : cat"
                  >{{ cat }}</div>
                </div>
              </div>
              <div class="art-tabla-wrap">
                <table class="art-tabla">
                  <thead>
                    <tr>
                      <th>ARTÍCULO</th>
                      <th style="width:100px">VARIANTE</th>
                      <th class="col-right" style="width:70px">CANT.</th>
                      <th class="col-right" style="width:120px">BRUTAS</th>
                      <th class="col-right" style="width:120px">NETAS</th>
                      <th class="col-center" style="width:200px">SKU RECETA</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="(grp, cat) in itemsAgrupados" :key="cat">
                      <tr class="tr-cat-header">
                        <td colspan="6"><span class="cat-badge">{{ cat }}</span></td>
                      </tr>
                      <tr v-for="item in grp" :key="item.key" class="tr-item">
                        <td class="td-nombre">{{ item.name }}</td>
                        <td class="td-variante">{{ item.variation || '—' }}</td>
                        <td class="td-num col-right">{{ item.qty }}</td>
                        <td class="td-monto col-right">{{ fmt(item.grossSales) }}</td>
                        <td class="td-monto col-right txt-green">{{ fmt(item.netSales) }}</td>
                        <td class="col-center">
                          <div class="mapping-cell">
                            <span v-if="item.mappedSku" class="mapping-badge mapping-ok" @click="openMappingDialog(item)">
                              <v-icon size="11">mdi-check-circle</v-icon>
                              {{ item.mappedSku }}
                              <span v-if="item.mappedRecetaNombre" class="mapping-nombre">{{ item.mappedRecetaNombre }}</span>
                            </span>
                            <button v-else class="mapping-badge mapping-warn" @click="openMappingDialog(item)">
                              <v-icon size="11">mdi-alert-circle-outline</v-icon>
                              Sin mapear
                            </button>
                          </div>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- TAB: MODIFICADORES -->
          <div v-show="activeTab === 'modifiers'" class="iv-section">
            <div class="iv-section-header">
              <div class="iv-section-icon" style="background:rgba(245,158,11,0.1)">
                <v-icon size="16" color="#f59e0b">mdi-tune-variant</v-icon>
              </div>
              <div>
                <div class="iv-section-title">MODIFICADORES VENDIDOS</div>
                <div class="iv-section-sub">{{ xlsxData.modifiers.length }} modificadores en {{ Object.keys(modifiersGrouped).length }} grupos</div>
              </div>
            </div>
            <div class="iv-card">
              <div class="iv-card-header">
                <div class="iv-card-title">
                  <v-icon size="14" color="#f59e0b" class="mr-1">mdi-tune-variant</v-icon>
                  Detalle por Grupo
                </div>
                <div style="font-size:11px; color:rgba(var(--v-theme-on-surface),0.4)">
                  Total: {{ fmt(totalModNetas) }} · {{ totalModUnidades }} uds
                </div>
              </div>
              <div class="art-tabla-wrap">
                <table class="art-tabla">
                  <thead>
                    <tr>
                      <th>NOMBRE</th>
                      <th class="col-right" style="width:70px">CANT.</th>
                      <th class="col-right" style="width:130px">VR. ARTÍCULO</th>
                      <th class="col-right" style="width:140px">SUBTOTAL</th>
                      <th class="col-center" style="width:160px">INVENTARIO</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="(mods, grupo) in modifiersGrouped" :key="grupo">
                      <tr class="tr-cat-header tr-cat-orange">
                        <td colspan="5"><span class="cat-badge cat-badge-orange">{{ grupo }}</span></td>
                      </tr>
                      <tr v-for="(m, i) in mods" :key="i" class="tr-item">
                        <td class="td-nombre">{{ m.name }}</td>
                        <td class="td-num col-right">{{ m.netQty }}</td>
                        <td class="td-monto col-right txt-dim">{{ m.netQty > 0 ? fmt(m.netSales / m.netQty) : '—' }}</td>
                        <td class="td-monto col-right txt-orange">{{ m.netSales > 0 ? fmt(m.netSales) : '—' }}</td>
                        <td class="col-center">
                          <div class="mod-inv-cell">
                            <span
                              class="mod-inv-badge"
                              :class="modificadoresConfigurados.has(m.name) ? 'mod-inv-ok' : 'mod-inv-warn'"
                            >
                              <v-icon size="11">{{ modificadoresConfigurados.has(m.name) ? 'mdi-check-circle' : 'mdi-alert-circle-outline' }}</v-icon>
                              {{ modificadoresConfigurados.has(m.name) ? 'Configurado' : 'Sin config' }}
                            </span>
                            <button class="btn-config-mod" @click="openModConfigDialog(m)" title="Configurar impacto en inventario">
                              <v-icon size="14">mdi-cog-outline</v-icon>
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr class="tr-subtotal">
                        <td class="subtotal-lbl">Subtotal {{ grupo }}</td>
                        <td class="col-right subtotal-val">{{ mods.reduce((s,m) => s + m.netQty, 0) }}</td>
                        <td class="col-right subtotal-val txt-dim">—</td>
                        <td class="col-right subtotal-val txt-orange">{{ fmt(mods.reduce((s,m) => s + m.netSales, 0)) }}</td>
                        <td></td>
                      </tr>
                    </template>
                  </tbody>
                  <tfoot>
                    <tr class="tr-total">
                      <td class="total-lbl">TOTAL MODIFICADORES</td>
                      <td class="col-right total-val">{{ totalModUnidades }}</td>
                      <td class="col-right total-val txt-dim">—</td>
                      <td class="col-right total-val txt-orange">{{ fmt(totalModNetas) }}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <!-- TAB: PAGOS -->
          <div v-show="activeTab === 'payments'" class="iv-section">
            <div class="iv-section-header">
              <div class="iv-section-icon" style="background:rgba(139,92,246,0.1)">
                <v-icon size="16" color="#8b5cf6">mdi-credit-card-outline</v-icon>
              </div>
              <div>
                <div class="iv-section-title">DETALLE DE PAGOS</div>
                <div class="iv-section-sub">{{ xlsxData.payments.length }} transacciones</div>
              </div>
            </div>
            <div class="kpi-grid kpi-grid-4">
              <div class="kpi-card kpi-purple">
                <div class="kpi-top"><span class="kpi-lbl">Tarjeta</span><v-icon size="16" color="#8b5cf6">mdi-credit-card</v-icon></div>
                <div class="kpi-val kpi-val-purple">{{ fmt(paymentTotals.card) }}</div>
              </div>
              <div class="kpi-card kpi-green">
                <div class="kpi-top"><span class="kpi-lbl">Efectivo</span><v-icon size="16" color="#10b981">mdi-cash</v-icon></div>
                <div class="kpi-val kpi-val-green">{{ fmt(paymentTotals.cash) }}</div>
              </div>
              <div class="kpi-card kpi-blue">
                <div class="kpi-top"><span class="kpi-lbl">Otros</span><v-icon size="16" color="#3b82f6">mdi-bank-transfer-out</v-icon></div>
                <div class="kpi-val kpi-val-blue">{{ fmt(paymentTotals.other) }}</div>
              </div>
              <div class="kpi-card kpi-orange">
                <div class="kpi-top"><span class="kpi-lbl">Propinas</span><v-icon size="16" color="#f59e0b">mdi-gift-outline</v-icon></div>
                <div class="kpi-val kpi-val-orange">{{ fmt(paymentTotals.tips) }}</div>
              </div>
            </div>
            <div class="iv-card">
              <div class="art-tabla-wrap">
                <table class="art-tabla">
                  <thead>
                    <tr>
                      <th style="width:80px">MÉTODO</th>
                      <th>PAYMENT ID</th>
                      <th class="col-right" style="width:120px">TOTAL</th>
                      <th class="col-right" style="width:100px">REEMBOLSO</th>
                      <th class="col-right" style="width:120px">NETO</th>
                      <th class="col-right" style="width:100px">PROPINA</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="p in xlsxData.payments" :key="p.paymentId" class="tr-item">
                      <td>
                        <span class="pay-method-badge" :class="'pay-' + p.method.toLowerCase()">{{ p.method }}</span>
                      </td>
                      <td class="td-sku" style="font-size:10px">{{ p.paymentId }}</td>
                      <td class="td-monto col-right">{{ fmt(p.totalAmount) }}</td>
                      <td class="td-monto col-right" :class="{ 'rs-neg': p.refunded }">{{ fmt(p.refunded) }}</td>
                      <td class="td-monto col-right txt-green">{{ fmt(p.amount) }}</td>
                      <td class="td-monto col-right" :class="{ 'rs-purple': p.tips > 0 }">{{ fmt(p.tips) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- TAB: COMISIONES -->
          <div v-show="activeTab === 'fees'" class="iv-section">
            <div class="iv-section-header">
              <div class="iv-section-icon" style="background:rgba(239,68,68,0.1)">
                <v-icon size="16" color="#ef4444">mdi-percent-outline</v-icon>
              </div>
              <div>
                <div class="iv-section-title">COMISIONES SQUARE</div>
                <div class="iv-section-sub">Total: {{ fmt(totalFees) }}</div>
              </div>
            </div>
            <div class="iv-card">
              <div class="art-tabla-wrap">
                <table class="art-tabla">
                  <thead>
                    <tr>
                      <th>TIPO</th>
                      <th class="col-right" style="width:140px">MONTO</th>
                      <th class="col-right" style="width:100px">ENTRADAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="f in xlsxData.fees" :key="f.subtype" class="tr-item">
                      <td class="td-nombre">{{ f.subtype }}</td>
                      <td class="td-monto col-right rs-neg">{{ fmt(f.amount) }}</td>
                      <td class="td-num col-right">{{ f.entries }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="tr-total">
                      <td class="total-lbl">TOTAL</td>
                      <td class="col-right total-val rs-neg">{{ fmt(totalFees) }}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <!-- TAB: CONSUMO -->
          <div v-show="activeTab === 'consumo'" class="iv-section">
            <div class="iv-section-header">
              <div class="iv-section-icon" style="background:rgba(239,68,68,0.1)">
                <v-icon size="16" color="#ef4444">mdi-package-down</v-icon>
              </div>
              <div>
                <div class="iv-section-title">CONSUMO DE INVENTARIO</div>
                <div class="iv-section-sub">Productos descontados según ventas del período</div>
              </div>
            </div>
            <div v-if="consumoLoading" class="rs-dlg-loading">
              <v-progress-circular indeterminate color="#ef4444" size="28" />
              <span>Calculando consumo...</span>
            </div>
            <div v-else-if="!consumo.length" class="consumo-empty">
              <v-icon size="32" color="rgba(var(--v-theme-on-surface),0.2)">mdi-package-variant-closed-remove</v-icon>
              <span v-if="unmappedCount > 0">Mapea los artículos a SKUs para calcular el consumo</span>
              <span v-else>No se encontraron componentes de inventario</span>
            </div>
            <template v-else>
              <!-- KPIs consumo -->
              <div class="kpi-grid kpi-grid-3">
                <div class="kpi-card kpi-red">
                  <div class="kpi-top">
                    <span class="kpi-lbl">Productos Afectados</span>
                    <v-icon size="16" color="#ef4444">mdi-package-variant-closed</v-icon>
                  </div>
                  <div class="kpi-val kpi-val-red">{{ consumo.length }}</div>
                </div>
                <div class="kpi-card kpi-orange">
                  <div class="kpi-top">
                    <span class="kpi-lbl">Recetas Involucradas</span>
                    <v-icon size="16" color="#f59e0b">mdi-chef-hat</v-icon>
                  </div>
                  <div class="kpi-val kpi-val-orange">
                    {{ new Set(consumo.flatMap(c => c.recetas.map(r => r.sku))).size }}
                  </div>
                </div>
                <div class="kpi-card kpi-purple">
                  <div class="kpi-top">
                    <span class="kpi-lbl">Mayor Consumo</span>
                    <v-icon size="16" color="#8b5cf6">mdi-trending-up</v-icon>
                  </div>
                  <div class="kpi-val kpi-val-purple" style="font-size:15px">
                    {{ consumo[0]?.nombre || '—' }}
                  </div>
                </div>
              </div>

              <div class="iv-card">
                <div class="iv-card-header">
                  <div class="iv-card-title">
                    <v-icon size="14" color="#ef4444" class="mr-1">mdi-clipboard-list-outline</v-icon>
                    Detalle de Consumo por Producto
                  </div>
                  <div style="font-size:11px;color:rgba(var(--v-theme-on-surface),0.4)">
                    Agrupado por grupo de producto
                  </div>
                </div>
                <div class="art-tabla-wrap">
                  <table class="art-tabla">
                    <thead>
                      <tr>
                        <th style="width:40px">#</th>
                        <th style="width:70px">CÓDIGO</th>
                        <th>DESCRIPCIÓN</th>
                        <th style="width:70px" class="col-right">UND</th>
                        <th style="width:140px" class="col-right">CONSUMO TOTAL</th>
                        <th style="width:130px" class="col-center">RECETAS</th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-for="grp in consumoAgrupado" :key="grp.grupo">
                        <tr class="tr-cat-header tr-cat-teal">
                          <td colspan="6">
                            <span class="cat-badge cat-badge-teal">
                              {{ grp.grupo }} · {{ grp.grupoNombre }}
                            </span>
                          </td>
                        </tr>
                        <tr
                          v-for="(c, idx) in grp.items"
                          :key="c.codigo"
                          class="tr-item tr-consumo"
                        >
                          <td class="td-idx">{{ idx + 1 }}</td>
                          <td class="td-sku">{{ c.codigo }}</td>
                          <td class="td-nombre">{{ c.nombre }}</td>
                          <td class="col-right td-und">{{ c.und || '—' }}</td>
                          <td class="col-right">
                            <span class="consumo-total-val">{{ fmtDec(c.totalConsumo) }}</span>
                          </td>
                          <td class="col-center">
                            <button class="btn-ver-recetas" @click="verRecetas(c)">
                              <v-icon size="15" color="#8b5cf6">mdi-eye-outline</v-icon>
                              <span>{{ c.recetas.length }} receta{{ c.recetas.length !== 1 ? 's' : '' }}</span>
                            </button>
                          </td>
                        </tr>
                      </template>
                    </tbody>
                  </table>
                </div>
              </div>
            </template>
          </div>

        </div>
      </div>

    </div>

    <!-- ═══ DIALOG: RECETAS QUE USAN EL PRODUCTO ═══ -->
    <v-dialog v-model="showRecetasDialog" max-width="620" scrollable>
      <v-card v-if="recetasDialogItem" class="rcpopup">
        <div class="rcpopup-header">
          <div class="rcpopup-icon">
            <v-icon size="18" color="white">mdi-package-variant-closed</v-icon>
          </div>
          <div class="rcpopup-title-wrap">
            <div class="rcpopup-title">{{ recetasDialogItem.nombre }}</div>
            <div class="rcpopup-sub">Código: {{ recetasDialogItem.codigo }} · {{ recetasDialogItem.und || '—' }}</div>
          </div>
          <v-btn icon variant="text" size="small" @click="showRecetasDialog = false">
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="rcpopup-total-row">
          <span class="rcpopup-total-lbl">CONSUMO TOTAL DEL PERÍODO</span>
          <span class="rcpopup-total-val">{{ fmtDec(recetasDialogItem.totalConsumo) }} {{ recetasDialogItem.und }}</span>
        </div>

        <div class="rcpopup-body">
          <table class="art-tabla">
            <thead>
              <tr>
                <th>RECETA</th>
                <th class="col-right" style="width:100px">CANT/UNIDAD</th>
                <th class="col-right" style="width:80px">VENDIDOS</th>
                <th class="col-right" style="width:110px">CONSUMO</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in recetasDialogItem.recetas" :key="r.sku" class="tr-item">
                <td>
                  <div class="rcpopup-receta-nombre">{{ r.nombreReceta || r.sku }}</div>
                  <div class="rcpopup-receta-sku">{{ r.sku }}</div>
                </td>
                <td class="col-right td-monto txt-dim">{{ fmtNum(r.cantPorUnidad) }}</td>
                <td class="col-right td-num">{{ r.vendidos }}</td>
                <td class="col-right">
                  <span class="consumo-total-val" style="font-size:13px">{{ fmtDec(r.subtotal) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card>
    </v-dialog>

    <!-- ═══ DIALOG: MAPEAR ARTÍCULO → SKU ═══ -->
    <v-dialog v-model="showMappingDlg" max-width="560" scrollable>
      <v-card class="rcpopup">
        <div class="rcpopup-header" style="background: linear-gradient(135deg,#8b5cf6,#7c3aed)">
          <div class="rcpopup-icon">
            <v-icon size="18" color="white">mdi-link-variant</v-icon>
          </div>
          <div class="rcpopup-title-wrap">
            <div class="rcpopup-title">MAPEAR ARTÍCULO</div>
            <div class="rcpopup-sub">{{ mappingItem?.name }}{{ mappingItem?.variation ? ' · ' + mappingItem.variation : '' }}</div>
          </div>
          <v-btn icon variant="text" size="small" @click="showMappingDlg = false">
            <v-icon size="18" color="white">mdi-close</v-icon>
          </v-btn>
        </div>
        <div class="rcpopup-body" style="padding:20px">
          <div style="font-size:12px;color:rgba(var(--v-theme-on-surface),0.5);margin-bottom:12px">
            Selecciona la receta (SKU) que corresponde a este artículo de Square
          </div>
          <v-autocomplete
            v-model="mappingSku"
            :items="recetasList"
            :item-title="r => r.codigo + ' — ' + r.nombre"
            item-value="codigo"
            label="Buscar receta por nombre o código..."
            density="compact"
            variant="outlined"
            hide-details
            clearable
            :loading="recetasLoading"
          >
            <template #item="{ item, props }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <span style="font-family:monospace;font-size:11px;font-weight:700;color:#8b5cf6;margin-right:8px">{{ item.raw.codigo }}</span>
                </template>
                <template #append>
                  <span v-if="item.raw.precio_venta" style="font-size:11px;color:#10b981;font-weight:600">{{ fmt(item.raw.precio_venta) }}</span>
                </template>
              </v-list-item>
            </template>
          </v-autocomplete>
          <div v-if="mappingError" class="iv-error" style="margin-top:10px;border-radius:8px">
            <v-icon size="14" color="#ef4444">mdi-alert-circle-outline</v-icon>
            <span>{{ mappingError }}</span>
          </div>
        </div>
        <div class="rs-dlg-actions">
          <v-btn v-if="mappingItem?.mappedSku" variant="text" color="#ef4444" :loading="mappingDeleting" @click="deleteMapping">
            <v-icon size="15" class="mr-1">mdi-link-variant-off</v-icon> Quitar mapeo
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="showMappingDlg = false">Cancelar</v-btn>
          <v-btn color="#8b5cf6" variant="flat" :loading="mappingSaving" :disabled="!mappingSku" @click="saveMapping">
            <v-icon size="15" class="mr-1">mdi-content-save-outline</v-icon> Guardar
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- ═══ DIALOG: CONFIGURAR MODIFICADOR → INVENTARIO ═══ -->
    <v-dialog v-model="showModConfigDlg" max-width="660" scrollable>
      <v-card v-if="modConfigMod" class="rcpopup">
        <div class="rcpopup-header" style="background: linear-gradient(135deg,#f59e0b,#d97706)">
          <div class="rcpopup-icon">
            <v-icon size="18" color="white">mdi-cog-outline</v-icon>
          </div>
          <div class="rcpopup-title-wrap">
            <div class="rcpopup-title">{{ modConfigMod.name }}</div>
            <div class="rcpopup-sub">Grupo: {{ modConfigMod.group }} · Configura qué ingredientes impacta este modificador</div>
          </div>
          <v-btn icon variant="text" size="small" @click="showModConfigDlg = false">
            <v-icon size="18" color="white">mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="rcpopup-body">
          <div v-if="modConfigLines.length === 0" class="config-empty">
            <v-icon size="28" color="rgba(var(--v-theme-on-surface),0.2)">mdi-package-variant-closed-remove</v-icon>
            <span>Sin configuración — agrega un ingrediente abajo</span>
          </div>

          <table v-else class="art-tabla">
            <thead>
              <tr>
                <th>INGREDIENTE</th>
                <th class="col-right" style="width:90px">CANT/UNIDAD</th>
                <th class="col-center" style="width:80px">TIPO</th>
                <th style="width:44px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ln in modConfigLines" :key="ln.id" class="tr-item">
                <td>
                  <div class="td-nombre">{{ ln.articulo_nombre }}</div>
                  <div class="td-sku">{{ ln.articulo }} · {{ ln.und }}</div>
                </td>
                <td class="col-right td-monto">{{ fmtNum(ln.cant) }}</td>
                <td class="col-center">
                  <span class="tipo-badge" :class="ln.tipo === '+' ? 'tipo-suma' : 'tipo-resta'">
                    {{ ln.tipo === '+' ? '+ SUMA' : '− RESTA' }}
                  </span>
                </td>
                <td class="col-center">
                  <v-btn
                    icon size="x-small" variant="text" color="#ef4444"
                    :loading="modDeletingId === ln.id"
                    @click="deleteModLine(ln.id)"
                  >
                    <v-icon size="15">mdi-delete-outline</v-icon>
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="modSaveLineError" class="iv-error" style="margin:8px 16px 0; border-radius:8px">
          <v-icon size="16" color="#ef4444">mdi-alert-circle-outline</v-icon>
          <span>{{ modSaveLineError }}</span>
        </div>

        <div class="config-new-row">
          <div class="config-new-title">
            <v-icon size="13" color="#f59e0b" class="mr-1">mdi-plus-circle-outline</v-icon>
            AGREGAR INGREDIENTE
          </div>
          <div class="config-new-fields">
            <v-autocomplete
              v-model="modNewLine.articulo"
              :items="productosControlados"
              item-title="nombre"
              item-value="codigo"
              return-object
              label="Producto (ingrediente)"
              density="compact"
              variant="outlined"
              hide-details
              class="config-field-art"
              @update:search="val => fetchProductosControlados(val)"
            >
              <template #item="{ item, props }">
                <v-list-item v-bind="props">
                  <template #append>
                    <span style="font-size:10px;color:rgba(var(--v-theme-on-surface),0.4)">{{ item.raw.codigo }} · {{ item.raw.und }}</span>
                  </template>
                </v-list-item>
              </template>
            </v-autocomplete>

            <v-text-field
              v-model="modNewLine.cant"
              label="Cant/Unidad"
              density="compact"
              variant="outlined"
              hide-details
              type="number"
              min="0"
              step="0.0001"
              class="config-field-cant"
            />

            <v-btn-toggle v-model="modNewLine.tipo" mandatory density="compact" class="config-tipo-toggle">
              <v-btn value="+" color="#10b981" size="small">+ SUMA</v-btn>
              <v-btn value="-" color="#ef4444" size="small">− RESTA</v-btn>
            </v-btn-toggle>

            <v-btn
              color="#f59e0b"
              :loading="modSavingLine"
              :disabled="!modNewLine.articulo || !modNewLine.cant"
              @click="saveModNewLine"
              size="small"
            >
              <v-icon size="16" class="mr-1">mdi-content-save-outline</v-icon>
              Guardar
            </v-btn>
          </div>
        </div>
      </v-card>
    </v-dialog>

    <!-- ═══ DIALOG: CONFIRMAR GUARDAR ═══ -->
    <v-dialog v-model="showSaveDlg" max-width="680" scrollable>
      <v-card class="rcpopup">
        <div class="rcpopup-header" style="background: linear-gradient(135deg,#0891b2,#0e7490)">
          <div class="rcpopup-icon">
            <v-icon size="18" color="white">mdi-database-import-outline</v-icon>
          </div>
          <div class="rcpopup-title-wrap">
            <div class="rcpopup-title">REGISTRAR EN CONTABILIDAD</div>
            <div class="rcpopup-sub">
              Fecha: {{ configFecha }} · {{ ccostos.find(c => c.codigo === configCcosto)?.nombre || configCcosto }}
            </div>
          </div>
          <v-btn icon variant="text" size="small" @click="showSaveDlg = false">
            <v-icon size="18" color="white">mdi-close</v-icon>
          </v-btn>
        </div>

        <div v-if="saveError" class="iv-error" style="margin:16px 16px 0;border-radius:8px">
          <v-icon size="16" color="#ef4444">mdi-alert-circle-outline</v-icon>
          <span>{{ saveError }}</span>
        </div>

        <div v-if="!saveError" class="rcpopup-body" style="padding:24px 20px;text-align:center;color:rgba(var(--v-theme-on-surface),0.6);font-size:14px">
          <v-icon size="20" color="#06b6d4" class="mr-1">mdi-information-outline</v-icon>
          Se guardarán los movimientos contables del período.<br>
          <strong>{{ xlsxData?.location }}</strong> · {{ xlsxData?.dateRange }}
        </div>

        <div class="rs-dlg-actions">
          <v-btn variant="flat" color="#ef4444" @click="showSaveDlg = false">Cancelar</v-btn>
          <v-btn color="#0891b2" variant="flat" :loading="saving" @click="confirmarGuardar()">
            <v-icon size="16" class="mr-1">mdi-content-save-outline</v-icon> Confirmar y Guardar
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbarSuccess" color="#10b981" :timeout="3500" location="bottom center" rounded="pill">
      <v-icon size="18" class="mr-2">mdi-check-circle</v-icon>
      <strong>¡Guardado correctamente!</strong>
    </v-snackbar>

  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { read, utils } from 'xlsx'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const empresaCodigo = computed(() => authStore.empresa || authStore.user?.empresa || '')

// ─── Config ──────────────────────────────────────────
const configFecha = ref(new Date().toISOString().slice(0, 10))
const configCcosto = ref(null)
const configCtaSquare = ref(null)
const configCtaOtros = ref(null)
const configCtaEfectivo = ref(null)
const ccostos = ref([])
const ccostosLoading = ref(false)
const cuentasBancarias = ref([])
const cuentasLoading = ref(false)

async function fetchCcostos() {
  if (!empresaCodigo.value) return
  ccostosLoading.value = true
  try {
    const resp = await api.get('/ccostos', { params: { empresa: empresaCodigo.value } })
    if (resp.data?.success) ccostos.value = resp.data.data
  } catch (e) { console.error('fetchCcostos:', e) }
  finally { ccostosLoading.value = false }
}

async function fetchCuentasBancarias() {
  if (!empresaCodigo.value) return
  cuentasLoading.value = true
  try {
    const resp = await api.get('/cuentas-bancarias', { params: { empresa: empresaCodigo.value } })
    if (resp.data?.success) cuentasBancarias.value = resp.data.data
  } catch (e) { console.error('fetchCuentasBancarias:', e) }
  finally { cuentasLoading.value = false }
}

onMounted(() => {
  fetchCcostos()
  fetchCuentasBancarias()
  fetchRecetas()
  fetchMappings()
  fetchModInventario()
})

// ─── State ───────────────────────────────────────────
const xlsxData = ref(null)
const fileName = ref('')
const parseError = ref('')
const dragging = ref(false)
const activeTab = ref('resumen')
const catFiltro = ref('')

// ─── Mappings ────────────────────────────────────────
const mappings = ref([])
const mappingsLoading = ref(false)
const recetasList = ref([])
const recetasLoading = ref(false)
const showMappingDlg = ref(false)
const mappingItem = ref(null)
const mappingSku = ref(null)
const mappingSaving = ref(false)
const mappingDeleting = ref(false)
const mappingError = ref('')

async function fetchMappings() {
  if (!empresaCodigo.value) return
  mappingsLoading.value = true
  try {
    const resp = await api.get('/square/item-mappings', { params: { empresa: empresaCodigo.value } })
    if (resp.data?.success) mappings.value = resp.data.data
  } catch (e) { console.error('fetchMappings:', e) }
  finally { mappingsLoading.value = false }
}

async function fetchRecetas() {
  recetasLoading.value = true
  try {
    const resp = await api.get('/recetas', { params: { empresa: empresaCodigo.value } })
    if (resp.data?.success) recetasList.value = resp.data.data
  } catch (e) { console.error('fetchRecetas:', e) }
  finally { recetasLoading.value = false }
}

function getMappingForItem(itemName, itemVariation) {
  const name = (itemName || '').trim().toUpperCase()
  const variation = (itemVariation || '').trim().toUpperCase()
  return mappings.value.find(m =>
    (m.item_name || '').trim().toUpperCase() === name &&
    (m.item_variation || '').trim().toUpperCase() === variation
  )
}

function openMappingDialog(item) {
  mappingItem.value = item
  mappingSku.value = item.mappedSku || null
  mappingError.value = ''
  showMappingDlg.value = true
}

async function saveMapping() {
  if (!mappingSku.value || !mappingItem.value) return
  mappingSaving.value = true
  mappingError.value = ''
  try {
    await api.post('/square/item-mappings', {
      empresa: empresaCodigo.value,
      item_name: mappingItem.value.name,
      item_variation: mappingItem.value.variation || '',
      sku: mappingSku.value
    })
    await fetchMappings()
    applyMappingsToItems()
    showMappingDlg.value = false
    await calcularConsumo()
  } catch (e) {
    mappingError.value = e?.response?.data?.error || e.message
  } finally { mappingSaving.value = false }
}

async function deleteMapping() {
  if (!mappingItem.value) return
  mappingDeleting.value = true
  try {
    const m = getMappingForItem(mappingItem.value.name, mappingItem.value.variation)
    if (m) await api.delete(`/square/item-mappings/${m.id}`)
    await fetchMappings()
    applyMappingsToItems()
    showMappingDlg.value = false
    await calcularConsumo()
  } catch (e) {
    mappingError.value = e?.response?.data?.error || e.message
  } finally { mappingDeleting.value = false }
}

function applyMappingsToItems() {
  if (!xlsxData.value) return
  for (const item of xlsxData.value.items) {
    const m = getMappingForItem(item.name, item.variation)
    item.mappedSku = m?.sku || null
    item.mappedRecetaNombre = m?.receta_nombre || null
  }
}

// ─── Configuración modificadores → inventario ────────
const showModConfigDlg = ref(false)
const modConfigMod = ref(null)
const modConfigLines = ref([])
const productosControlados = ref([])
const modNewLine = ref({ articulo: null, cant: '', tipo: '+' })
const modSavingLine = ref(false)
const modDeletingId = ref(null)
const modSaveLineError = ref('')

const modificadoresConfigurados = computed(() =>
  new Set(allModInventario.value.map(m => m.modificador))
)

async function fetchProductosControlados(q = '') {
  try {
    const resp = await api.get('/productos/controlados', { params: q ? { q } : {} })
    if (resp.data?.success) productosControlados.value = resp.data.data
  } catch (e) { console.error('fetchProductosControlados:', e) }
}

function openModConfigDialog(mod) {
  modConfigMod.value = mod
  modConfigLines.value = allModInventario.value.filter(m => m.modificador === mod.name)
  modNewLine.value = { articulo: null, cant: '', tipo: '+' }
  modSaveLineError.value = ''
  showModConfigDlg.value = true
  fetchProductosControlados()
}

async function saveModNewLine() {
  if (!modNewLine.value.articulo || !modNewLine.value.cant) return
  modSavingLine.value = true
  modSaveLineError.value = ''
  try {
    const codigo = typeof modNewLine.value.articulo === 'object'
      ? modNewLine.value.articulo.codigo
      : modNewLine.value.articulo
    const resp = await api.post('/modificadores-inventario', {
      modificador: modConfigMod.value.name,
      articulo: codigo,
      cant: parseFloat(modNewLine.value.cant),
      tipo: modNewLine.value.tipo
    })
    if (!resp.data?.success) throw new Error(resp.data?.error || 'Error al guardar')
    await fetchModInventario()
    modConfigLines.value = allModInventario.value.filter(m => m.modificador === modConfigMod.value.name)
    modNewLine.value = { articulo: null, cant: '', tipo: '+' }
    if (xlsxData.value) await calcularConsumo()
  } catch (e) {
    modSaveLineError.value = e?.response?.data?.error || e.message || 'Error al guardar'
  } finally { modSavingLine.value = false }
}

async function deleteModLine(id) {
  modDeletingId.value = id
  try {
    await api.delete(`/modificadores-inventario/${id}`)
    await fetchModInventario()
    modConfigLines.value = allModInventario.value.filter(m => m.modificador === modConfigMod.value.name)
    if (xlsxData.value) await calcularConsumo()
  } catch (e) { console.error('deleteModLine:', e) }
  finally { modDeletingId.value = null }
}

// ─── Consumo ─────────────────────────────────────────
const consumo = ref([])
const consumoLoading = ref(false)
const allModInventario = ref([])

async function fetchModInventario() {
  try {
    const resp = await api.get('/modificadores-inventario')
    if (resp.data?.success) allModInventario.value = resp.data.data
  } catch (e) { console.error('fetchModInventario:', e) }
}

async function calcularConsumo() {
  if (!xlsxData.value) return
  const mappedItems = xlsxData.value.items.filter(i => i.mappedSku)
  if (!mappedItems.length) { consumo.value = []; return }

  const skus = [...new Set(mappedItems.map(i => i.mappedSku))]
  consumoLoading.value = true
  consumo.value = []
  try {
    const resp = await api.get('/detalle-productos/por-recetas', { params: { recetas: skus.join(',') } })
    if (!resp.data?.success || !resp.data.data?.length) return

    const cantMap = {}
    for (const item of mappedItems) {
      cantMap[item.mappedSku] = (cantMap[item.mappedSku] || 0) + item.qty
    }

    const nombreRecetaMap = {}
    for (const item of mappedItems) {
      if (!nombreRecetaMap[item.mappedSku]) {
        nombreRecetaMap[item.mappedSku] = item.mappedRecetaNombre || item.name || item.mappedSku
      }
    }

    const consumoMap = {}
    for (const dp of resp.data.data) {
      const receta = (dp.receta || '').trim()
      const codArt = (dp.articulo || '').trim()
      const nombre = (dp.articulo_nombre || codArt).trim()
      const und = (dp.und || '').trim()
      const cantRec = parseFloat(dp.cant) || 0
      const vendidos = cantMap[receta] || 0
      const total = cantRec * vendidos

      const grupo = (dp.grupo || '').trim()
      const grupoNombre = (dp.grupo_nombre || grupo || 'SIN GRUPO').trim()

      if (!consumoMap[codArt]) {
        consumoMap[codArt] = { codigo: codArt, nombre, und, grupo, grupoNombre, totalConsumo: 0, recetas: [] }
      }
      consumoMap[codArt].totalConsumo += total
      consumoMap[codArt].recetas.push({
        sku: receta,
        nombreReceta: nombreRecetaMap[receta] || receta,
        cantPorUnidad: cantRec,
        vendidos,
        subtotal: total
      })
    }

    // Modificadores de inventario
    for (const mod of (xlsxData.value?.modifiers || [])) {
      const modNombre = (mod.name || '').trim()
      const modMappings = allModInventario.value.filter(m => m.modificador === modNombre)
      for (const mp of modMappings) {
        const codArt = (mp.articulo || '').trim()
        const nombre = (mp.articulo_nombre || codArt).trim()
        const und = (mp.und || '').trim()
        const grupo = (mp.grupo || '').trim()
        const cantMp = parseFloat(mp.cant) || 0
        const vendidos = mod.netQty || 0
        const total = cantMp * vendidos
        const delta = mp.tipo === '-' ? -total : total

        if (!consumoMap[codArt]) {
          consumoMap[codArt] = { codigo: codArt, nombre, und, grupo, grupoNombre: grupo || 'SIN GRUPO', totalConsumo: 0, recetas: [] }
        }
        consumoMap[codArt].totalConsumo += delta
        consumoMap[codArt].recetas.push({
          sku: mp.tipo === '-' ? 'MOD−' : 'MOD+',
          nombreReceta: (mp.tipo === '-' ? '[RESTA] ' : '') + modNombre,
          cantPorUnidad: cantMp,
          vendidos,
          subtotal: delta
        })
      }
    }

    consumo.value = Object.values(consumoMap).sort((a, b) => {
      const g = a.grupo.localeCompare(b.grupo)
      return g !== 0 ? g : a.nombre.localeCompare(b.nombre)
    })
  } catch (e) {
    console.error('Error calcularConsumo:', e)
  } finally { consumoLoading.value = false }
}

const consumoAgrupado = computed(() => {
  const groups = {}
  for (const c of consumo.value) {
    const key = c.grupo || 'ZZZ'
    if (!groups[key]) groups[key] = { grupo: c.grupo, grupoNombre: c.grupoNombre, items: [] }
    groups[key].items.push(c)
  }
  return Object.values(groups).sort((a, b) => a.grupo.localeCompare(b.grupo))
})

const showRecetasDialog = ref(false)
const recetasDialogItem = ref(null)

function verRecetas(item) {
  recetasDialogItem.value = item
  showRecetasDialog.value = true
}

// ─── Guardar ─────────────────────────────────────────
const showSaveDlg = ref(false)
const saving = ref(false)
const saveError = ref('')
const snackbarSuccess = ref(false)

function abrirGuardarResumen() {
  if (!xlsxData.value) return
  saveError.value = ''
  if (!configFecha.value || !configCcosto.value) {
    saveError.value = 'Debes seleccionar Fecha y Centro de Costo antes de guardar.'
  }
  showSaveDlg.value = true
}

async function confirmarGuardar(force = false) {
  saving.value = true
  saveError.value = ''
  try {
    const s = xlsxData.value.summary
    const ccostoObj = ccostos.value.find(c => c.codigo === configCcosto.value)

    const ventas = {
      ventasBrutas: s.grossSales,
      devoluciones: Math.abs(s.returns),
      descuentos: Math.abs(s.discounts),
      ventasNetas: s.netSales,
      ventasTarjetaRegalo: 0,
      impuestos: s.salesTax,
      propinas: s.tips,
      reembolsos: 0,
      total: s.totalCollected
    }
    const pagos = {
      totalRecibido: s.totalCollected,
      efectivo: paymentTotals.value.cash,
      tarjeta: paymentTotals.value.card,
      otro: paymentTotals.value.other,
      tarjetaRegalo: 0,
      comisiones: totalFees.value,
      totalNeto: s.totalCollected + totalFees.value
    }

    const mappedItems = xlsxData.value.items.filter(i => i.mappedSku).map(i => ({
      sku: i.mappedSku,
      nombre: i.name,
      variante: i.variation || '',
      categoria: i.category,
      cantidad: i.qty,
      ventasBrutas: i.grossSales,
      ventasNetas: i.netSales
    }))

    const resp = await api.post('/square/importar-resumen', {
      empresa: empresaCodigo.value,
      fecha: configFecha.value,
      ccosto: configCcosto.value,
      ccostoNombre: ccostoObj?.nombre || configCcosto.value,
      ventas,
      pagos,
      items: mappedItems,
      consumoItems: consumo.value || [],
      ctaSquare: configCtaSquare.value,
      ctaOtros: configCtaOtros.value,
      ctaEfectivo: configCtaEfectivo.value,
      force,
    })

    if (resp.data?.conflict) {
      saveError.value = `Ya existen ${resp.data.count || 0} registros para esta fecha/ccosto/empresa. Usa la versión anterior para reimportar con force.`
      return
    }
    if (!resp.data?.success) throw new Error(resp.data?.error || 'Error al guardar')

    showSaveDlg.value = false
    snackbarSuccess.value = true
    limpiar()
  } catch (e) {
    saveError.value = e?.response?.data?.error || e.message || 'Error al guardar'
  } finally { saving.value = false }
}

// ─── Formatting ──────────────────────────────────────
function fmt(val) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(parseFloat(val || 0))
}

function fmtNum(val) {
  const n = parseFloat(val || 0)
  const decimals = n % 1 === 0 ? 0 : Math.min(4,
    (n.toString().split('.')[1] || '').replace(/0+$/, '').length
  )
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals > 0 ? 2 : 0,
    maximumFractionDigits: 4
  }).format(n)
}

function fmtDec(val) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(parseFloat(val || 0))
}

// ─── Computed ────────────────────────────────────────
const categorias = computed(() => {
  if (!xlsxData.value) return []
  return [...new Set(xlsxData.value.items.map(i => i.category))]
})

const itemsFiltrados = computed(() => {
  if (!xlsxData.value) return []
  if (!catFiltro.value) return xlsxData.value.items
  return xlsxData.value.items.filter(i => i.category === catFiltro.value)
})

const itemsAgrupados = computed(() => {
  const groups = {}
  for (const item of itemsFiltrados.value) {
    if (!groups[item.category]) groups[item.category] = []
    groups[item.category].push(item)
  }
  return groups
})

const totalUnidades = computed(() => (xlsxData.value?.items || []).reduce((s, i) => s + i.qty, 0))
const totalGrossSales = computed(() => (xlsxData.value?.items || []).reduce((s, i) => s + i.grossSales, 0))
const mappedCount = computed(() => (xlsxData.value?.items || []).filter(i => i.mappedSku).length)
const unmappedCount = computed(() => (xlsxData.value?.items || []).filter(i => !i.mappedSku).length)

const modifiersGrouped = computed(() => {
  const groups = {}
  for (const m of (xlsxData.value?.modifiers || [])) {
    const g = m.group || 'SIN GRUPO'
    if (!groups[g]) groups[g] = []
    groups[g].push(m)
  }
  return groups
})

const paymentTotals = computed(() => {
  const payments = xlsxData.value?.payments || []
  const card = payments.filter(p => p.method === 'Card').reduce((s, p) => s + p.amount, 0)
  const cash = payments.filter(p => p.method === 'Cash').reduce((s, p) => s + p.amount, 0)
  const other = payments.filter(p => p.method === 'Other').reduce((s, p) => s + p.amount, 0)
  const tips = payments.reduce((s, p) => s + (p.tips || 0), 0)
  return { card, cash, other, total: card + cash + other, tips }
})

const totalFees = computed(() => (xlsxData.value?.fees || []).reduce((s, f) => s + f.amount, 0))

const totalModUnidades = computed(() =>
  (xlsxData.value?.modifiers || []).reduce((s, m) => s + m.netQty, 0)
)
const totalModNetas = computed(() =>
  (xlsxData.value?.modifiers || []).reduce((s, m) => s + m.netSales, 0)
)

// ─── XLSX Parser ─────────────────────────────────────
function parseNum(val) {
  if (val == null || val === '') return 0
  if (typeof val === 'number') return val
  let s = String(val).trim().replace(/^\$/, '').replace(/,/g, '')
  return parseFloat(s) || 0
}

function parseQty(val) {
  if (val == null) return 0
  if (typeof val === 'number') return val
  const m = String(val).match(/(\d+)/)
  return m ? parseInt(m[1]) : 0
}

function parseXLSX(buffer) {
  const wb = read(buffer, { type: 'array' })
  const result = {
    location: '',
    dateRange: '',
    summary: {},
    items: [],
    modifiers: [],
    payments: [],
    fees: [],
    taxes: {}
  }

  // Sales Summary
  const ss = wb.Sheets['Sales Summary']
  if (ss) {
    const data = utils.sheet_to_json(ss, { header: 1 })
    for (const row of data) {
      const key = String(row[0] || '').toLowerCase()
      if (key === 'locations') result.location = row[1] || ''
      if (key === 'date range') result.dateRange = row[1] || ''
    }
    const metricMap = {}
    let inMetrics = false
    for (const row of data) {
      if (String(row[0] || '').toLowerCase() === 'metric') { inMetrics = true; continue }
      if (inMetrics && row[0]) metricMap[String(row[0]).toLowerCase()] = parseNum(row[1])
    }
    result.summary = {
      grossSales: metricMap['gross sales'] || 0,
      totalItemSales: metricMap['total item sales'] || 0,
      returns: metricMap['returns'] || 0,
      discounts: metricMap['discounts'] || 0,
      comps: metricMap['comps'] || 0,
      netSales: metricMap['net sales'] || 0,
      salesTax: metricMap['sales tax'] || 0,
      tips: metricMap['tips (non-cash)'] || metricMap['tips'] || 0,
      totalCollected: metricMap['total collected'] || 0
    }
  }

  // Items
  const is = wb.Sheets['Items']
  if (is) {
    const data = utils.sheet_to_json(is, { header: 1 })
    let headerIdx = -1
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][0] || '').toLowerCase() === 'category') { headerIdx = i; break }
    }
    if (headerIdx >= 0) {
      for (let i = headerIdx + 1; i < data.length; i++) {
        const row = data[i]
        if (!row[0] && !row[1]) continue
        result.items.push({
          category: row[0] || '',
          name: row[1] || '',
          variation: row[2] || '',
          grossSales: parseNum(row[3]),
          netSales: parseNum(row[4]),
          qty: parseQty(row[5]),
          key: `${row[0]}-${row[1]}-${row[2] || ''}`,
          mappedSku: null,
          mappedRecetaNombre: null
        })
      }
    }
  }

  // Modifiers
  const ms = wb.Sheets['Modifiers']
  if (ms) {
    const data = utils.sheet_to_json(ms, { header: 1 })
    let headerIdx = -1
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][0] || '').toLowerCase().includes('modifier list')) { headerIdx = i; break }
    }
    if (headerIdx >= 0) {
      for (let i = headerIdx + 1; i < data.length; i++) {
        const row = data[i]
        if (!row[0] && !row[1]) continue
        result.modifiers.push({
          group: row[0] || '',
          name: row[1] || '',
          grossSales: parseNum(row[2]),
          netSales: parseNum(row[3]),
          netQty: parseQty(row[4]),
          orders: parseQty(row[5])
        })
      }
    }
  }

  // Payments
  const ps = wb.Sheets['Payments']
  if (ps) {
    const data = utils.sheet_to_json(ps, { header: 1 })
    let headerIdx = -1
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][0] || '').toLowerCase().includes('payment method')) { headerIdx = i; break }
    }
    if (headerIdx >= 0) {
      for (let i = headerIdx + 1; i < data.length; i++) {
        const row = data[i]
        if (!row[0]) continue
        result.payments.push({
          method: row[0] || '',
          paymentId: row[1] || '',
          totalAmount: parseNum(row[2]),
          refunded: parseNum(row[3]),
          amount: parseNum(row[4]),
          transferable: parseNum(row[5]),
          tips: parseNum(row[6])
        })
      }
    }
  }

  // Fees
  const fs = wb.Sheets['Fees']
  if (fs) {
    const data = utils.sheet_to_json(fs, { header: 1 })
    let headerIdx = -1
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][0] || '').toLowerCase().includes('fee subtype')) { headerIdx = i; break }
    }
    if (headerIdx >= 0) {
      for (let i = headerIdx + 1; i < data.length; i++) {
        const row = data[i]
        if (!row[0]) continue
        result.fees.push({
          subtype: row[0] || '',
          amount: parseNum(row[1]),
          entries: parseQty(row[2])
        })
      }
    }
  }

  // Taxes
  const ts = wb.Sheets['Taxes']
  if (ts) {
    const data = utils.sheet_to_json(ts, { header: 1 })
    let inMetrics = false
    for (const row of data) {
      if (String(row[0] || '').toLowerCase() === 'metric') { inMetrics = true; continue }
      if (inMetrics && row[0]) {
        result.taxes[String(row[0])] = row[1]
      }
    }
  }

  return result
}

// ─── File handling ───────────────────────────────────
async function processFile(file) {
  parseError.value = ''
  try {
    const buffer = await file.arrayBuffer()
    xlsxData.value = parseXLSX(buffer)
    fileName.value = file.name
    activeTab.value = 'resumen'
    applyMappingsToItems()
    await calcularConsumo()
  } catch (e) {
    parseError.value = `Error al parsear "${file.name}": ${e.message}`
    console.error(e)
  }
}

function onDrop(e) {
  dragging.value = false
  const file = e.dataTransfer.files[0]
  if (file) processFile(file)
}

function onFileInput(e) {
  const file = e.target.files[0]
  if (file) processFile(file)
  e.target.value = ''
}

function limpiar() {
  xlsxData.value = null
  fileName.value = ''
  consumo.value = []
  parseError.value = ''
  activeTab.value = 'resumen'
}
</script>

<style scoped>
.iv-wrap { padding: 24px; max-width: 1280px; margin: 0 auto; }

.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 11px; font-weight: 700; color: #06b6d4; text-transform: uppercase; letter-spacing: 0.5px; }
.bc-cat  { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.4); }
.bc-cur  { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.7); font-weight: 600; }

.iv-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.iv-header-left { display: flex; align-items: center; gap: 16px; }
.iv-icon-wrap {
  width: 52px; height: 52px; border-radius: 16px;
  background: linear-gradient(135deg, #10b981, #059669);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 20px rgba(16,185,129,0.38); flex-shrink: 0;
}
.iv-title { font-size: 21px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); letter-spacing: 0.4px; margin: 0; }
.iv-sub   { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.45); margin: 3px 0 0; }

/* Config */
.imp-cfg-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface), 0.08); border-radius: 16px; margin-bottom: 20px; overflow: hidden; }
.imp-cfg-header { display: flex; align-items: center; gap: 10px; padding: 12px 18px; background: linear-gradient(135deg, rgba(6,182,212,0.08), rgba(6,182,212,0.03)); border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06); }
.imp-cfg-icon { width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0; background: linear-gradient(135deg, #06b6d4, #0891b2); display: flex; align-items: center; justify-content: center; }
.imp-cfg-title { font-size: 11px; font-weight: 800; letter-spacing: 0.6px; color: #06b6d4; text-transform: uppercase; }
.imp-cfg-sub { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.35); margin-left: auto; }
.imp-cfg-fields { display: grid; grid-template-columns: auto 1fr 1fr 1fr 1fr; gap: 14px; padding: 14px 18px; align-items: end; }
@media (max-width: 1100px) { .imp-cfg-fields { grid-template-columns: 1fr 1fr 1fr; } }
@media (max-width: 700px) { .imp-cfg-fields { grid-template-columns: 1fr 1fr; } }
.imp-cfg-field { display: flex; flex-direction: column; gap: 5px; }
.imp-cfg-label { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.45); display: flex; align-items: center; }
.imp-cfg-date { height: 40px; border-radius: 8px; padding: 0 10px; border: 1px solid rgba(var(--v-theme-on-surface), 0.2); background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); font-size: 13px; font-weight: 600; outline: none; font-family: inherit; }
.imp-cfg-date:focus { border-color: #06b6d4; box-shadow: 0 0 0 2px rgba(6,182,212,0.15); }
.imp-cfg-select { font-size: 13px; }

/* Drop zone */
.drop-zone { border: 2px dashed rgba(var(--v-theme-on-surface), 0.18); border-radius: 16px; padding: 32px 24px; cursor: pointer; transition: all 0.2s; background: rgb(var(--v-theme-surface)); text-align: center; min-height: 140px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
.drop-zone:hover { border-color: #10b981; background: rgba(16,185,129,0.03); }
.drop-zone--active { border-color: #10b981; background: rgba(16,185,129,0.06); }
.drop-zone--loaded { border-style: solid; border-color: #10b981; background: rgba(16,185,129,0.04); }
.drop-content { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.drop-icon-wrap { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
.drop-icon-green { background: linear-gradient(135deg,#10b981,#059669); }
.drop-title { font-size: 15px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }
.drop-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.45); }
.drop-hint { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.3); margin-top: 4px; }
.drop-loaded { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.drop-loaded-name { font-size: 13px; font-weight: 600; color: #10b981; word-break: break-all; }
.drop-loaded-sub { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5); }
.drop-loaded-stats { display: flex; gap: 14px; margin-top: 4px; }
.drop-stat { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.6); }

/* Action bar */
.iv-action-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; background: rgb(var(--v-theme-surface)); border: 1px solid rgba(6,182,212,0.25); border-radius: 12px; padding: 10px 16px; margin-bottom: 16px; }
.iv-action-bar-left { display: flex; align-items: center; gap: 6px; font-size: 12px; }
.iv-action-bar-right { display: flex; align-items: center; gap: 8px; }
.iv-action-ok { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: #10b981; }
.iv-action-warn { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: #f59e0b; }

/* Error */
.iv-error { display: flex; align-items: center; gap: 10px; background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.25); border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #ef4444; }

/* Tabs */
.sheets-container { margin-top: 4px; }
.sheets-tabbar { display: flex; align-items: flex-end; gap: 0; position: relative; }
.sheet-tab { display: inline-flex; align-items: center; gap: 5px; padding: 8px 14px; font-size: 12px; font-weight: 600; border: 1.5px solid rgba(var(--v-theme-on-surface), 0.12); border-bottom: none; border-radius: 8px 8px 0 0; background: rgba(var(--v-theme-on-surface), 0.03); color: rgba(var(--v-theme-on-surface), 0.45); cursor: pointer; margin-right: 3px; transition: all 0.15s; position: relative; bottom: -1.5px; outline: none; }
.sheet-tab:hover { color: rgba(var(--v-theme-on-surface), 0.75); background: rgba(var(--v-theme-on-surface), 0.06); }
.sheet-tab--active { background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); border-color: rgba(var(--v-theme-on-surface), 0.18); border-bottom-color: rgb(var(--v-theme-surface)); z-index: 2; font-weight: 700; }
.sheet-tab--loading { opacity: 0.75; }
.sheets-tabbar-line { flex: 1; border-bottom: 1.5px solid rgba(var(--v-theme-on-surface), 0.18); position: relative; bottom: -1.5px; }
.sheet-badge { font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 20px; }
.sheet-badge-purple { background: rgba(139,92,246,0.13); color: #8b5cf6; }
.sheet-badge-orange { background: rgba(245,158,11,0.13); color: #d97706; }
.sheet-badge-green { background: rgba(16,185,129,0.13); color: #10b981; }
.sheet-badge-red { background: rgba(239,68,68,0.13); color: #ef4444; }
.sheet-content { border: 1.5px solid rgba(var(--v-theme-on-surface), 0.18); border-top: none; border-radius: 0 8px 8px 8px; padding: 20px 20px 28px; background: rgb(var(--v-theme-surface)); position: relative; z-index: 1; }

/* Sections */
.iv-section { display: flex; flex-direction: column; gap: 16px; }
.iv-section-header { display: flex; align-items: center; gap: 12px; }
.iv-section-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.iv-section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
.iv-section-sub { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.45); margin-top: 2px; }

/* KPI */
.kpi-grid { display: grid; gap: 12px; }
.kpi-grid-4 { grid-template-columns: repeat(4, 1fr); }
.kpi-grid-3 { grid-template-columns: repeat(3, 1fr); }
@media (max-width: 900px) { .kpi-grid-4, .kpi-grid-3 { grid-template-columns: repeat(2, 1fr); } }
.kpi-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface), 0.08); border-radius: 12px; padding: 14px 16px; }
.kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.kpi-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.5); }
.kpi-val { font-size: 20px; font-weight: 800; font-family: 'Courier New', monospace; }
.kpi-blue { border-left: 3px solid #3b82f6; } .kpi-val-blue { color: #3b82f6; }
.kpi-green { border-left: 3px solid #10b981; } .kpi-val-green { color: #10b981; }
.kpi-green-dark { border-left: 3px solid #059669; } .kpi-val-green-dark { color: #059669; }
.kpi-orange { border-left: 3px solid #f59e0b; } .kpi-val-orange { color: #f59e0b; }
.kpi-purple { border-left: 3px solid #8b5cf6; } .kpi-val-purple { color: #8b5cf6; }
.kpi-red { border-left: 3px solid #ef4444; } .kpi-val-red { color: #ef4444; }

/* Cards */
.iv-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface), 0.08); border-radius: 14px; overflow: hidden; }
.iv-card-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07); flex-wrap: wrap; gap: 8px; }
.iv-card-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.7); display: flex; align-items: center; }
.iv-card-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.mr-1 { margin-right: 4px; }
.ml-1 { margin-left: 4px; }

/* Resumen */
.rs-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 760px) { .rs-two-col { grid-template-columns: 1fr; } }
.rs-card { display: flex; flex-direction: column; }
.rs-rows { display: flex; flex-direction: column; padding: 4px 0; }
.rs-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 18px; gap: 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.04); }
.rs-sep { height: 1px; background: rgba(var(--v-theme-on-surface), 0.1); margin: 4px 18px; padding: 0; border: none; }
.rs-total-row { background: rgba(var(--v-theme-on-surface), 0.03); }
.rs-grand-total { background: rgba(var(--v-theme-on-surface), 0.06); border-top: 2px solid rgba(var(--v-theme-on-surface), 0.12) !important; }
.rs-lbl { font-size: 12.5px; color: rgba(var(--v-theme-on-surface), 0.75); flex: 1; }
.rs-lbl-bold { font-weight: 700; color: rgb(var(--v-theme-on-surface)); }
.rs-val { font-family: 'Courier New', monospace; font-size: 13px; font-weight: 600; text-align: right; white-space: nowrap; color: rgba(var(--v-theme-on-surface), 0.7); }
.rs-val-big { font-size: 15px; font-weight: 800; }
.rs-val-grand { font-size: 17px; font-weight: 800; }
.rs-pos { color: #10b981; }
.rs-neg { color: #ef4444; }
.rs-green { color: #10b981; }
.rs-purple { color: #8b5cf6; }

/* Table */
.art-tabla-wrap { overflow-x: auto; }
.art-tabla { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.art-tabla thead th { padding: 10px 12px; text-align: left; font-size: 9.5px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface), 0.5); background: rgba(var(--v-theme-on-surface), 0.04); border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08); white-space: nowrap; }
.art-tabla td { padding: 9px 12px; }
.tr-cat-header { background: rgba(139,92,246,0.04); border-top: 1px solid rgba(139,92,246,0.15); }
.tr-cat-header td { padding: 7px 12px; }
.cat-badge { font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; color: #8b5cf6; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2); padding: 2px 10px; border-radius: 20px; }
.tr-cat-orange { background: rgba(245,158,11,0.04); border-top: 1px solid rgba(245,158,11,0.15); }
.cat-badge-orange { color: #d97706; background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.25); }
.tr-cat-teal { background: rgba(20,184,166,0.04); border-top: 1px solid rgba(20,184,166,0.2); }
.cat-badge-teal { color: #0d9488; background: rgba(20,184,166,0.1); border: 1px solid rgba(20,184,166,0.25); }
.tr-consumo { vertical-align: middle; }

.btn-ver-recetas { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; cursor: pointer; background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.2); color: #8b5cf6; font-size: 11px; font-weight: 600; transition: all 0.15s; outline: none; }
.btn-ver-recetas:hover { background: rgba(139,92,246,0.16); border-color: rgba(139,92,246,0.4); }

.rcpopup-total-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; background: rgba(139,92,246,0.05); border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.06); }
.rcpopup-total-lbl { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface),0.5); }
.rcpopup-total-val { font-family: 'Courier New', monospace; font-size: 16px; font-weight: 800; color: #8b5cf6; }
.rcpopup-receta-nombre { font-weight: 600; font-size: 12.5px; }
.rcpopup-receta-sku { font-family: 'Courier New', monospace; font-size: 10.5px; color: rgba(var(--v-theme-on-surface),0.4); }
.tr-item { border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); }
.tr-item:hover { background: rgba(var(--v-theme-on-surface), 0.02); }
.tr-total { background: rgba(var(--v-theme-on-surface), 0.07); border-top: 2px solid rgba(var(--v-theme-on-surface), 0.15); }
.tr-total td { padding: 10px 12px; }
.total-lbl { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.7); }
.total-val { font-size: 13px; font-weight: 800; font-family: 'Courier New', monospace; }
.col-right { text-align: right !important; }
.col-center { text-align: center !important; }
.td-nombre { font-weight: 600; color: rgb(var(--v-theme-on-surface)); }
.td-variante { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5); }
.td-sku { font-family: 'Courier New', monospace; font-size: 11.5px; color: rgba(var(--v-theme-on-surface), 0.5); }
.td-num { font-weight: 700; color: rgb(var(--v-theme-on-surface)); }
.td-monto { font-family: 'Courier New', monospace; font-weight: 500; }
.td-idx { font-size: 11px; font-weight: 700; color: rgba(var(--v-theme-on-surface), 0.3); text-align: center; }
.td-und { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5); font-weight: 600; }
.txt-green { color: #10b981; }
.txt-orange { color: #f59e0b; }

.cat-chip { font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 20px; cursor: pointer; border: 1px solid rgba(var(--v-theme-on-surface), 0.15); color: rgba(var(--v-theme-on-surface), 0.6); background: rgba(var(--v-theme-on-surface), 0.04); transition: all 0.15s; white-space: nowrap; }
.cat-chip:hover { border-color: #8b5cf6; color: #8b5cf6; }
.cat-chip--active { background: rgba(139,92,246,0.12); border-color: #8b5cf6; color: #8b5cf6; }

/* Mapping badges */
.mapping-cell { display: flex; align-items: center; justify-content: center; }
.mapping-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 20px; cursor: pointer; transition: all 0.15s; border: none; outline: none; }
.mapping-ok { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
.mapping-ok:hover { background: rgba(16,185,129,0.2); }
.mapping-warn { background: rgba(245,158,11,0.1); color: #d97706; border: 1px solid rgba(245,158,11,0.2); }
.mapping-warn:hover { background: rgba(245,158,11,0.2); }
.mapping-nombre { font-size: 9px; font-weight: 500; color: rgba(var(--v-theme-on-surface), 0.5); margin-left: 4px; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Payment method badges */
.pay-method-badge { font-size: 9.5px; font-weight: 800; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.3px; }
.pay-card { background: rgba(139,92,246,0.1); color: #8b5cf6; }
.pay-cash { background: rgba(16,185,129,0.1); color: #10b981; }
.pay-other { background: rgba(59,130,246,0.1); color: #3b82f6; }

/* Modifier inventory config */
.mod-inv-cell { display: flex; align-items: center; justify-content: center; gap: 5px; }
.mod-inv-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 9.5px; font-weight: 700; padding: 2px 7px; border-radius: 20px; }
.mod-inv-ok   { background: rgba(16,185,129,0.1);  color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
.mod-inv-warn { background: rgba(245,158,11,0.1);  color: #d97706; border: 1px solid rgba(245,158,11,0.2); }
.btn-config-mod { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 6px; cursor: pointer; background: rgba(var(--v-theme-on-surface),0.06); border: 1px solid rgba(var(--v-theme-on-surface),0.12); color: rgba(var(--v-theme-on-surface),0.6); transition: all 0.15s; outline: none; }
.btn-config-mod:hover { background: rgba(245,158,11,0.12); border-color: rgba(245,158,11,0.3); color: #d97706; }
.config-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 28px 24px; color: rgba(var(--v-theme-on-surface),0.35); font-size: 12px; }
.config-new-row { border-top: 1px solid rgba(var(--v-theme-on-surface),0.08); padding: 14px 16px; background: rgba(var(--v-theme-on-surface),0.02); }
.config-new-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface),0.5); margin-bottom: 10px; display: flex; align-items: center; }
.config-new-fields { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.config-field-art  { flex: 1; min-width: 200px; }
.config-field-cant { width: 110px; flex-shrink: 0; }
.config-tipo-toggle { flex-shrink: 0; }
.tipo-badge { font-size: 9.5px; font-weight: 800; padding: 2px 8px; border-radius: 20px; letter-spacing: 0.3px; }
.tipo-suma  { background: rgba(16,185,129,0.1);  color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
.tipo-resta { background: rgba(239,68,68,0.1);   color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
.txt-dim { color: rgba(var(--v-theme-on-surface),0.4); }
.tr-subtotal { background: rgba(var(--v-theme-on-surface),0.03); border-top: 1px solid rgba(var(--v-theme-on-surface),0.08); }
.tr-subtotal td { padding: 7px 12px; }
.subtotal-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; color: rgba(var(--v-theme-on-surface),0.5); }
.subtotal-val { font-size: 12px; font-weight: 700; font-family: 'Courier New', monospace; }

/* Consumo */
.consumo-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 40px 24px; text-align: center; background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface), 0.08); border-radius: 14px; color: rgba(var(--v-theme-on-surface), 0.4); font-size: 13px; }
.consumo-total-val { font-family: 'Courier New', monospace; font-size: 15px; font-weight: 800; color: #ef4444; }

/* Enrich badge */
.enrich-badge { display: flex; align-items: center; gap: 6px; margin-left: auto; font-size: 11px; color: #8b5cf6; font-weight: 600; }

/* Dialogs */
.rcpopup { border-radius: 16px !important; overflow: hidden; }
.rcpopup-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.rcpopup-icon { width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.rcpopup-title-wrap { flex: 1; min-width: 0; }
.rcpopup-title { font-size: 15px; font-weight: 800; color: white; }
.rcpopup-sub { font-size: 11px; color: rgba(255,255,255,0.65); margin-top: 2px; }
.rcpopup-body { padding: 0; }
.rs-dlg-actions { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 16px; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08); }
.rs-dlg-loading { display: flex; align-items: center; justify-content: center; gap: 14px; padding: 48px 24px; font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); }
</style>
