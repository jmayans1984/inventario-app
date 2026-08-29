<template>
  <MainLayout>
    <div class="iv-wrap">

      <PageHeader
        title="Importar Ventas Square"
        description="Carga el CSV exportado desde Square para ver el resumen del período"
        :crumbs="['Tesorería', 'Procesos', 'Importar Ventas Square']"
      />

      <!-- ═══════════════════════════════════════════════
           CONFIGURACIÓN DE IMPORTACIÓN
      ═══════════════════════════════════════════════ -->
      <div class="imp-cfg-card">
        <div class="imp-cfg-header">
          <div class="imp-cfg-icon">
            <v-icon size="16" color="white">mdi-tune</v-icon>
          </div>
          <span class="imp-cfg-title">CONFIGURACIÓN DE IMPORTACIÓN</span>
          <span class="imp-cfg-sub">Parámetros que se aplicarán al generar los movimientos contables</span>
        </div>
        <div class="imp-cfg-fields">

          <!-- Fecha -->
          <div class="imp-cfg-field">
            <label class="imp-cfg-label">
              <v-icon size="12" color="primary" class="mr-1">mdi-calendar-outline</v-icon>
              FECHA
            </label>
            <div class="imp-cfg-input-wrap">
              <CampoFecha
                v-model="configFecha"
                class="imp-cfg-date"
              />
              <v-icon v-if="fechaMatch" size="18" color="success" class="cfg-ok-icon" title="Fecha coincide con el archivo">mdi-check-circle</v-icon>
              <v-icon v-else-if="fechaMismatch" size="18" color="error" class="cfg-ok-icon" title="La fecha no coincide con el archivo">mdi-close-circle</v-icon>
            </div>
          </div>

          <!-- Centro de Costo -->
          <div class="imp-cfg-field">
            <label class="imp-cfg-label">
              <v-icon size="12" color="warning" class="mr-1">mdi-map-marker-outline</v-icon>
              CENTRO DE COSTO
            </label>
            <div class="imp-cfg-input-wrap">
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
              >
                <template #prepend-inner>
                  <span v-if="configCcosto" class="imp-cfg-code-chip">{{ configCcosto }}</span>
                </template>
              </v-select>
              <v-icon v-if="ccostoMatch" size="18" color="success" class="cfg-ok-icon" title="Centro de costo coincide con el archivo">mdi-check-circle</v-icon>
              <v-icon v-else-if="ubicacionMismatch" size="18" color="error" class="cfg-ok-icon" title="El centro de costo no coincide con el archivo">mdi-close-circle</v-icon>
            </div>
          </div>

          <!-- CTA. SQUARE -->
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

          <!-- CTA. OTROS -->
          <div class="imp-cfg-field">
            <label class="imp-cfg-label">
              <v-icon size="12" color="primary" class="mr-1">mdi-bank-transfer-out</v-icon>
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

          <!-- CTA. EFECTIVO -->
          <div class="imp-cfg-field">
            <label class="imp-cfg-label">
              <v-icon size="12" color="success" class="mr-1">mdi-cash</v-icon>
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

      <!-- ZONA DE CARGA (archivo único combinado) -->
      <div class="iv-upload-row">

        <div
          class="drop-zone drop-zone--single"
          :class="{ 'drop-zone--active': dragging[0], 'drop-zone--loaded': resumen || articulos }"
          @dragover.prevent="dragging[0] = true"
          @dragleave="dragging[0] = false"
          @drop.prevent="onDrop($event)"
          @click="$refs.inputArchivo.click()"
        >
          <input ref="inputArchivo" type="file" accept=".csv" hidden @change="onFileInput($event)" />
          <div v-if="!resumen && !articulos" class="drop-content">
            <div class="drop-icon-wrap drop-icon-blue">
              <v-icon size="28" color="white">mdi-file-chart-outline</v-icon>
            </div>
            <div class="drop-title">Reporte de Ventas Square (CSV)</div>
            <div class="drop-sub">Arrastra o haz click para cargar el archivo</div>
            <div class="drop-hint"><code>ventas-YYYY-MM-DD-YYYY-MM-DD.csv</code></div>
          </div>
          <div v-else class="drop-loaded">
            <v-icon size="32" color="success">mdi-check-circle</v-icon>
            <div class="drop-loaded-name">{{ archivoFileName }}</div>
            <div class="drop-loaded-sub">{{ (resumen || articulos)?.periodo }}</div>
            <div class="drop-loaded-stats" v-if="articulos">
              <span class="drop-stat"><v-icon size="11" color="primary">mdi-package-variant-closed</v-icon> {{ articulos.items.length }} artículos</span>
              <span class="drop-stat"><v-icon size="11" color="warning">mdi-tune-variant</v-icon> {{ articulos.modificadores.length }} modificadores</span>
            </div>
            <div v-if="(resumen || articulos)?.ubicacion" class="drop-loaded-loc">
              <v-icon size="11" color="primary">mdi-map-marker-outline</v-icon>
              {{ (resumen || articulos).ubicacion }}
            </div>
            <v-btn size="x-small" variant="text" color="#94a3b8" @click.stop="limpiar()">
              <v-icon size="14">mdi-close</v-icon> Quitar
            </v-btn>
          </div>
        </div>

      </div>

      <!-- BARRA DE ACCIONES (visible cuando hay resumen cargado) -->
      <div v-if="resumen" class="iv-action-bar">
        <div class="iv-action-bar-left">
          <v-icon size="15" color="primary" class="mr-1">mdi-information-outline</v-icon>
          <span v-if="saveResumenSuccess" class="iv-action-ok">
            <v-icon size="14" color="success">mdi-check-circle</v-icon>
            {{ saveResumenResult?.total }} registros guardados en Gastos
          </span>
          <span v-else class="iv-action-hint">
            Archivo de resumen listo · Selecciona Fecha y CCosto para registrar
          </span>
        </div>
        <div class="iv-action-bar-right">
          <v-btn
            variant="outlined"
            color="#94a3b8"
            size="small"
            @click="limpiar()"
          >
            <v-icon size="15" class="mr-1">mdi-close</v-icon>
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            size="small"
            @click="abrirGuardarResumen"
          >
            <v-icon size="15" class="mr-1">mdi-database-import-outline</v-icon>
            Guardar
          </v-btn>
        </div>
      </div>

      <!-- ERROR DE PARSEO -->
      <div v-if="parseError" class="iv-error">
        <v-icon size="20" color="error">mdi-alert-circle-outline</v-icon>
        <span>{{ parseError }}</span>
      </div>

      <!-- ═══════════════════════════════════════════════
           CONTENEDOR TABS ESTILO SPREADSHEET
      ═══════════════════════════════════════════════ -->
      <div v-if="resumen || articulos" class="sheets-container">

        <!-- ── Barra de pestañas ── -->
        <div class="sheets-tabbar">
          <button
            v-if="resumen"
            class="sheet-tab"
            :class="{ 'sheet-tab--active': activeTab === 'resumen' }"
            @click="activeTab = 'resumen'"
          >
            <v-icon size="13">mdi-file-chart-outline</v-icon>
            Resumen
          </button>
          <button
            v-if="articulos"
            class="sheet-tab"
            :class="{ 'sheet-tab--active': activeTab === 'articulos' }"
            @click="activeTab = 'articulos'"
          >
            <v-icon size="13">mdi-package-variant-closed</v-icon>
            Artículos
            <span class="sheet-badge sheet-badge-purple">{{ articulos.items.length }}</span>
          </button>
          <button
            v-if="articulos"
            class="sheet-tab"
            :class="{ 'sheet-tab--active': activeTab === 'modificadores' }"
            @click="activeTab = 'modificadores'"
          >
            <v-icon size="13">mdi-tune-variant</v-icon>
            Modificadores
            <span class="sheet-badge sheet-badge-orange">{{ articulos.modificadores.length }}</span>
          </button>
          <button
            v-if="articulos"
            class="sheet-tab"
            :class="{ 'sheet-tab--active': activeTab === 'consumo', 'sheet-tab--loading': consumoLoading }"
            @click="activeTab = 'consumo'"
          >
            <v-icon size="13">mdi-package-down</v-icon>
            Consumo
            <span v-if="consumo.length" class="sheet-badge sheet-badge-red">{{ consumo.length }}</span>
            <v-progress-circular v-if="consumoLoading" size="10" width="2" indeterminate color="error" class="ml-1" />
          </button>
          <div class="sheets-tabbar-line"></div>
        </div>

        <!-- ── Contenido de los tabs ── -->
        <div class="sheet-content">

          <!-- ─────────────────────────────────────────
               TAB: RESUMEN
          ───────────────────────────────────────── -->
          <div v-show="activeTab === 'resumen'" class="iv-section">
            <template v-if="resumen">

              <div class="iv-section-header">
                <div class="iv-section-icon" style="background:rgba(59,130,246,0.1)">
                  <v-icon size="16" color="#3b82f6">mdi-file-chart-outline</v-icon>
                </div>
                <div>
                  <div class="iv-section-title">RESUMEN DE VENTAS</div>
                  <div class="iv-section-sub">{{ resumen.ubicacion }} · {{ resumen.periodo }}</div>
                </div>
              </div>

              <!-- Layout de dos columnas: VENTAS + PAGOS -->
              <div class="rs-two-col">

                <!-- ── COLUMNA VENTAS ── -->
                <div class="iv-card rs-card">
                  <div class="iv-card-header">
                    <div class="iv-card-title">
                      <v-icon size="14" color="#3b82f6" class="mr-1">mdi-cash-register</v-icon>
                      VENTAS
                    </div>
                  </div>
                  <div class="rs-rows">
                    <div class="rs-row rs-total-row">
                      <span class="rs-lbl rs-lbl-bold">Ventas Brutas</span>
                      <span class="rs-val rs-val-big rs-pos">{{ fmt(resumen.ventas.ventasBrutas) }}</span>
                    </div>
                    <div class="rs-row rs-sep"></div>
                    <div class="rs-row">
                      <span class="rs-lbl">Devoluciones</span>
                      <span class="rs-val rs-neg">{{ fmt(resumen.ventas.devoluciones) }}</span>
                    </div>
                    <div class="rs-row">
                      <span class="rs-lbl">Descuentos</span>
                      <span class="rs-val rs-neg">{{ fmt(resumen.ventas.descuentos) }}</span>
                    </div>
                    <div class="rs-row rs-sep"></div>
                    <div class="rs-row rs-total-row">
                      <span class="rs-lbl rs-lbl-bold">Ventas Netas</span>
                      <span class="rs-val rs-val-big rs-pos">{{ fmt(resumen.ventas.ventasNetas) }}</span>
                    </div>
                    <div class="rs-row rs-sep"></div>
                    <div class="rs-row">
                      <span class="rs-lbl">Tarjetas de Regalo</span>
                      <span class="rs-val">{{ fmt(resumen.ventas.ventasTarjetaRegalo) }}</span>
                    </div>
                    <div class="rs-row">
                      <span class="rs-lbl">Impuestos</span>
                      <span class="rs-val">{{ fmt(resumen.ventas.impuestos) }}</span>
                    </div>
                    <div class="rs-row">
                      <span class="rs-lbl">Propinas</span>
                      <span class="rs-val rs-purple">{{ fmt(resumen.ventas.propinas) }}</span>
                    </div>
                    <div class="rs-row">
                      <span class="rs-lbl">Reembolsos</span>
                      <span class="rs-val rs-neg">{{ fmt(resumen.ventas.reembolsos) }}</span>
                    </div>
                    <div class="rs-row rs-sep"></div>
                    <div class="rs-row rs-grand-total">
                      <span class="rs-lbl rs-lbl-bold">TOTAL</span>
                      <span class="rs-val rs-val-grand rs-pos">{{ fmt(resumen.ventas.total) }}</span>
                    </div>
                  </div>
                </div>

                <!-- ── COLUMNA PAGOS ── -->
                <div class="iv-card rs-card">
                  <div class="iv-card-header">
                    <div class="iv-card-title">
                      <v-icon size="14" color="success" class="mr-1">mdi-credit-card-outline</v-icon>
                      PAGOS
                    </div>
                  </div>
                  <div class="rs-rows">
                    <div class="rs-row rs-total-row">
                      <span class="rs-lbl rs-lbl-bold">Total Recibido</span>
                      <span class="rs-val rs-val-big rs-pos">{{ fmt(resumen.pagos.totalRecibido) }}</span>
                    </div>
                    <div class="rs-row rs-sep"></div>
                    <div class="rs-row rs-indent">
                      <span class="rs-lbl">Efectivo</span>
                      <span class="rs-val rs-green">{{ fmt(resumen.pagos.efectivo) }}</span>
                    </div>
                    <div class="rs-row rs-indent">
                      <span class="rs-lbl">Tarjeta</span>
                      <span class="rs-val rs-purple">{{ fmt(resumen.pagos.tarjeta) }}</span>
                    </div>
                    <div class="rs-row rs-indent">
                      <span class="rs-lbl">Otro</span>
                      <span class="rs-val">{{ fmt(resumen.pagos.otro) }}</span>
                    </div>
                    <div class="rs-row rs-indent">
                      <span class="rs-lbl">Tarjeta de Regalo</span>
                      <span class="rs-val rs-pink">{{ fmt(resumen.pagos.tarjetaRegalo) }}</span>
                    </div>
                    <div class="rs-row rs-sep"></div>
                    <div class="rs-row">
                      <span class="rs-lbl">Comisiones</span>
                      <span class="rs-val rs-neg">{{ fmt(resumen.pagos.comisiones) }}</span>
                    </div>
                    <div class="rs-row rs-sep"></div>
                    <div class="rs-row rs-grand-total">
                      <span class="rs-lbl rs-lbl-bold">TOTAL NETO</span>
                      <span class="rs-val rs-val-grand rs-pos">{{ fmt(resumen.pagos.totalNeto) }}</span>
                    </div>
                  </div>
                </div>

              </div><!-- /.rs-two-col -->


            </template>
            <div v-else class="tab-empty">
              <v-icon size="40" color="rgba(var(--v-theme-on-surface),0.15)">mdi-file-chart-outline</v-icon>
              <span>Carga el archivo <strong>Resumen de Ventas</strong> para ver este panel</span>
            </div>
          </div>

          <!-- ─────────────────────────────────────────
               TAB: ARTÍCULOS
          ───────────────────────────────────────── -->
          <div v-show="activeTab === 'articulos'" class="iv-section">
            <template v-if="articulos">

              <div class="iv-section-header">
                <div class="iv-section-icon" style="background:rgba(139,92,246,0.1)">
                  <v-icon size="16" color="primary">mdi-package-variant-closed</v-icon>
                </div>
                <div>
                  <div class="iv-section-title">ARTÍCULOS VENDIDOS</div>
                  <div class="iv-section-sub">{{ articulos.ubicacion }} · {{ articulos.periodo }}</div>
                </div>
                <div v-if="enrichLoading" class="enrich-badge">
                  <v-progress-circular size="14" width="2" indeterminate color="primary" />
                  <span>Cargando precios...</span>
                </div>
              </div>

              <!-- KPIs artículos -->
              <div class="kpi-grid kpi-grid-4">
                <div class="kpi-card kpi-purple">
                  <div class="kpi-top">
                    <span class="kpi-lbl">Artículos Distintos</span>
                    <v-icon size="16" color="primary">mdi-format-list-bulleted</v-icon>
                  </div>
                  <div class="kpi-val kpi-val-purple">{{ articulos.items.length }}</div>
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
                    <v-icon size="16" color="success">mdi-cash</v-icon>
                  </div>
                  <div class="kpi-val kpi-val-green">{{ fmt(totalVentasBrutas) }}</div>
                </div>
                <div class="kpi-card kpi-green-dark">
                  <div class="kpi-top">
                    <span class="kpi-lbl">Ventas Netas</span>
                    <v-icon size="16" color="#059669">mdi-trending-up</v-icon>
                  </div>
                  <div class="kpi-val kpi-val-green-dark">{{ fmt(totalVentasNetas) }}</div>
                </div>
              </div>

              <!-- Tabla artículos por categoría -->
              <div class="iv-card">
                <div class="iv-card-header">
                  <div class="iv-card-title">
                    <v-icon size="14" color="primary" class="mr-1">mdi-table</v-icon>
                    Detalle por Artículo
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
                        <th style="width:80px">SKU</th>
                        <th>ARTÍCULO</th>
                        <th class="col-right" style="width:70px">CANT.</th>
                        <th class="col-right" style="width:130px">VR. UNITARIO</th>
                        <th class="col-right" style="width:140px">SUBTOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-for="(grp, cat) in itemsAgrupados" :key="cat">
                        <tr class="tr-cat-header">
                          <td colspan="5">
                            <span class="cat-badge">{{ cat }}</span>
                          </td>
                        </tr>
                        <tr v-for="(item, idx) in grp" :key="item.sku + idx" class="tr-item">
                          <td class="td-sku">{{ item.sku }}</td>
                          <td class="td-nombre">
                            {{ item.nombreReceta || item.nombre }}
                            <span v-if="item.variante && item.variante !== 'Regular'" class="variante-tag">{{ item.variante }}</span>
                          </td>
                          <td class="td-num col-right">{{ item.cantidad }}</td>
                          <td class="td-monto col-right txt-dim">{{ item.precioVenta != null ? fmt(item.precioVenta) : (item.cantidad > 0 ? fmt(item.ventasBrutas / item.cantidad) : '—') }}</td>
                          <td class="td-monto col-right txt-green">{{ fmt(itemSubtotal(item)) }}</td>
                        </tr>
                        <tr class="tr-subtotal">
                          <td colspan="2" class="subtotal-lbl">Subtotal {{ cat }}</td>
                          <td class="col-right subtotal-val">{{ subtotalCat(cat).cantidad }}</td>
                          <td class="col-right subtotal-val txt-dim">—</td>
                          <td class="col-right subtotal-val txt-green">{{ fmt(subtotalCat(cat).netas) }}</td>
                        </tr>
                      </template>
                    </tbody>
                    <tfoot>
                      <tr class="tr-total">
                        <td colspan="2" class="total-lbl">TOTAL GENERAL</td>
                        <td class="col-right total-val">{{ totalUnidades }}</td>
                        <td class="col-right total-val txt-dim">—</td>
                        <td class="col-right total-val txt-green">{{ fmt(totalVentasNetas) }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

            </template>
          </div>

          <!-- ─────────────────────────────────────────
               TAB: MODIFICADORES
          ───────────────────────────────────────── -->
          <div v-show="activeTab === 'modificadores'" class="iv-section">
            <template v-if="articulos">

              <div class="iv-section-header">
                <div class="iv-section-icon" style="background:rgba(245,158,11,0.1)">
                  <v-icon size="16" color="warning">mdi-tune-variant</v-icon>
                </div>
                <div>
                  <div class="iv-section-title">MODIFICADORES VENDIDOS</div>
                  <div class="iv-section-sub">{{ articulos.modificadores.length }} modificadores en {{ Object.keys(modificadoresAgrupados).length }} grupos</div>
                </div>
              </div>

              <div class="iv-card">
                <div class="iv-card-header">
                  <div class="iv-card-title">
                    <v-icon size="14" color="warning" class="mr-1">mdi-tune-variant</v-icon>
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
                      <template v-for="(mods, grupo) in modificadoresAgrupados" :key="grupo">
                        <tr class="tr-cat-header tr-cat-orange">
                          <td colspan="5">
                            <span class="cat-badge cat-badge-orange">{{ grupo }}</span>
                          </td>
                        </tr>
                        <tr v-for="(m, i) in mods" :key="i" class="tr-item">
                          <td class="td-nombre">{{ m.modificador }}</td>
                          <td class="td-num col-right">{{ m.cantidadNeta }}</td>
                          <td class="td-monto col-right txt-dim">{{ m.cantidadNeta > 0 ? fmt(m.ventasNetas / m.cantidadNeta) : '—' }}</td>
                          <td class="td-monto col-right txt-orange">{{ m.ventasNetas > 0 ? fmt(m.ventasNetas) : '—' }}</td>
                          <td class="col-center">
                            <div class="mod-inv-cell">
                              <span
                                class="mod-inv-badge"
                                :class="modificadoresConfigurados.has(m.modificador) ? 'mod-inv-ok' : 'mod-inv-warn'"
                              >
                                <v-icon size="11">{{ modificadoresConfigurados.has(m.modificador) ? 'mdi-check-circle' : 'mdi-alert-circle-outline' }}</v-icon>
                                {{ modificadoresConfigurados.has(m.modificador) ? 'Configurado' : 'Sin config' }}
                              </span>
                              <button class="btn-config-mod" @click="openConfigDialog(m)" title="Configurar impacto en inventario">
                                <v-icon size="14">mdi-cog-outline</v-icon>
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr class="tr-subtotal">
                          <td class="subtotal-lbl">Subtotal {{ grupo }}</td>
                          <td class="col-right subtotal-val">{{ mods.reduce((s,m) => s + m.cantidadNeta, 0) }}</td>
                          <td class="col-right subtotal-val txt-dim">—</td>
                          <td class="col-right subtotal-val txt-orange">{{ fmt(mods.reduce((s,m) => s + m.ventasNetas, 0)) }}</td>
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

            </template>
          </div>

          <!-- ─────────────────────────────────────────
               TAB: CONSUMO DE INVENTARIO
          ───────────────────────────────────────── -->
          <div v-show="activeTab === 'consumo'" class="iv-section">
            <template v-if="articulos">

              <div class="iv-section-header">
                <div class="iv-section-icon" style="background:rgba(239,68,68,0.1)">
                  <v-icon size="16" color="error">mdi-package-down</v-icon>
                </div>
                <div>
                  <div class="iv-section-title">CONSUMO DE INVENTARIO</div>
                  <div class="iv-section-sub">Productos descontados del inventario según ventas del período</div>
                </div>
                <div v-if="consumoLoading" class="enrich-badge" style="color:#ef4444; margin-left:auto">
                  <v-progress-circular size="14" width="2" indeterminate color="error" />
                  <span>Calculando...</span>
                </div>
              </div>

              <!-- Error -->
              <div v-if="consumoError" class="iv-error">
                <v-icon size="18" color="error">mdi-alert-circle-outline</v-icon>
                <span>{{ consumoError }}</span>
              </div>

              <!-- Vacío sin error -->
              <div v-else-if="!consumoLoading && !consumo.length" class="consumo-empty">
                <v-icon size="32" color="rgba(var(--v-theme-on-surface),0.2)">mdi-package-variant-closed-remove</v-icon>
                <span>No se encontraron componentes de inventario para los SKUs vendidos</span>
                <span class="consumo-empty-hint">Verifica que los SKUs del CSV existen en la tabla <code>detalle_productos</code></span>
              </div>

              <!-- KPIs consumo -->
              <div v-if="!consumoLoading && consumo.length" class="kpi-grid kpi-grid-3">
                <div class="kpi-card kpi-red">
                  <div class="kpi-top">
                    <span class="kpi-lbl">Productos Afectados</span>
                    <v-icon size="16" color="error">mdi-package-variant-closed</v-icon>
                  </div>
                  <div class="kpi-val kpi-val-red">{{ consumo.length }}</div>
                </div>
                <div class="kpi-card kpi-orange">
                  <div class="kpi-top">
                    <span class="kpi-lbl">Recetas Involucradas</span>
                    <v-icon size="16" color="warning">mdi-chef-hat</v-icon>
                  </div>
                  <div class="kpi-val kpi-val-orange">
                    {{ new Set(consumo.flatMap(c => c.recetas.map(r => r.sku))).size }}
                  </div>
                </div>
                <div class="kpi-card kpi-purple">
                  <div class="kpi-top">
                    <span class="kpi-lbl">Mayor Consumo</span>
                    <v-icon size="16" color="primary">mdi-trending-up</v-icon>
                  </div>
                  <div class="kpi-val kpi-val-purple" style="font-size:15px">
                    {{ consumo[0]?.nombre || '—' }}
                  </div>
                </div>
              </div>

              <!-- Tabla de consumo -->
              <div v-if="!consumoLoading && consumo.length" class="iv-card">
                <div class="iv-card-header">
                  <div class="iv-card-title">
                    <v-icon size="14" color="error" class="mr-1">mdi-clipboard-list-outline</v-icon>
                    Detalle de Consumo por Producto
                  </div>
                  <div style="font-size:11px;color:rgba(var(--v-theme-on-surface),0.4)">
                    Ordenado por mayor consumo
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
                        <!-- Encabezado de grupo -->
                        <tr class="tr-cat-header tr-cat-teal">
                          <td colspan="6">
                            <span class="cat-badge cat-badge-teal">
                              {{ grp.grupo }} · {{ grp.grupoNombre }}
                            </span>
                          </td>
                        </tr>
                        <!-- Filas del grupo -->
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
                              <v-icon size="15" color="primary">mdi-eye-outline</v-icon>
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

        </div><!-- /.sheet-content -->
      </div><!-- /.sheets-container -->

    </div><!-- /.iv-wrap -->

    <!-- ═══════════════════════════════════════════════
         DIALOG: CONFIRMAR REGISTRO EN CONTABILIDAD
    ═══════════════════════════════════════════════ -->
    <v-dialog v-model="showSaveResumenDlg" max-width="680" scrollable>
      <v-card class="rcpopup">

        <!-- Header -->
        <div class="rcpopup-header" style="background: linear-gradient(135deg,#0891b2,#0e7490)">
          <div class="rcpopup-icon">
            <v-icon size="18" color="white">mdi-database-import-outline</v-icon>
          </div>
          <div class="rcpopup-title-wrap">
            <div class="rcpopup-title">REGISTRAR EN CONTABILIDAD</div>
            <div class="rcpopup-sub">
              Fecha: {{ configFecha }} · {{ ccostos.find(c => c.codigo === configCcosto)?.nombre || configCcosto }} · {{ authStore.empresaNombre || empresaCodigo }}
            </div>
          </div>
          <v-btn icon variant="text" size="small" title="Configurar cuentas contables" @click="abrirCfgEditor">
            <v-icon size="18" color="rgba(255,255,255,0.7)">mdi-cog-outline</v-icon>
          </v-btn>
          <v-btn icon variant="text" size="small" @click="showSaveResumenDlg = false">
            <v-icon size="18" color="white">mdi-close</v-icon>
          </v-btn>
        </div>

        <!-- Advertencia: ubicación del CSV vs centro de costo seleccionado -->
        <div v-if="ubicacionMismatch" class="rs-loc-warn">
          <v-icon size="15" color="warning">mdi-alert-outline</v-icon>
          <div>
            <strong>Verificar centro de costo:</strong>
            el archivo dice <em>"{{ resumen?.ubicacion }}"</em>
            pero el CCosto seleccionado es <em>"{{ ccostos.find(c => c.codigo === configCcosto)?.nombre }}"</em>.
          </div>
        </div>

        <!-- Error de configuración o de API -->
        <div v-if="saveResumenError" class="iv-error" style="margin:16px 16px 0; border-radius:8px">
          <v-icon size="16" color="error">mdi-alert-circle-outline</v-icon>
          <span>{{ saveResumenError }}</span>
        </div>

        <!-- Preview / Conflicto / Cargando -->
        <template v-if="!saveResumenError && configGeneral">

          <!-- ⚠️ AVISO DE DUPLICADOS — reemplaza la tabla cuando hay conflicto -->
          <div v-if="conflictInfo" class="rcpopup-body">
            <div class="rs-conflict-banner">
              <div class="rs-conflict-banner-top">
                <v-icon size="28" color="warning">mdi-alert-circle</v-icon>
                <span class="rs-conflict-banner-title">¡Ya existen registros para esta importación!</span>
              </div>
              <div class="rs-conflict-banner-msg">
                Se encontraron registros existentes para la misma <strong>fecha</strong>,
                <strong>centro de costo</strong> y <strong>empresa</strong>:
                <template v-if="conflictInfo.count > 0"><strong>{{ conflictInfo.count }}</strong> en GASTOS — </template>
                <template v-if="conflictInfo.countVentas > 0"><strong>{{ conflictInfo.countVentas }}</strong> en VENTAS — </template>
                <template v-if="conflictInfo.countDetalle > 0"><strong>{{ conflictInfo.countDetalle }}</strong> en DETALLE_VENTAS — </template>
                <template v-if="conflictInfo.countInventario > 0"><strong>{{ conflictInfo.countInventario }}</strong> en DETALLE_INVENTARIO — </template>
                <template v-if="conflictInfo.countMoviban > 0"><strong>{{ conflictInfo.countMoviban }}</strong> en MOVIBAN</template>
                <br><br>
                <template v-if="conflictInfo.sampleRow">
                  <span style="font-size:11px;color:#94a3b8;">
                    🔍 Diagnóstico — fila real en BD:
                    fecha=<strong>{{ conflictInfo.sampleRow.fecha }}</strong>
                    ccosto=<strong>{{ conflictInfo.sampleRow.ccosto }}</strong>
                    empresa=<strong>{{ conflictInfo.sampleRow.empresa }}</strong>
                  </span>
                  <br><br>
                </template>
                Si confirmas, todos esos registros serán <strong style="color:#ef4444">eliminados</strong>
                y se insertarán los nuevos datos.
              </div>
            </div>
          </div>

          <!-- Sin conflictos: solo mensaje simple -->
          <div v-else class="rcpopup-body" style="padding:24px 20px; text-align:center; color:rgba(var(--v-theme-on-surface),0.6); font-size:14px">
            <v-icon size="20" color="primary" class="mr-1">mdi-information-outline</v-icon>
            Se guardarán <strong>{{ previewResumen.filter(r => r.cuenta).length }}</strong> movimientos contables para el período seleccionado.
          </div>

          <!-- Botones — cambian según si hay conflicto o no -->
          <div class="rs-dlg-actions">
            <v-btn variant="flat" color="error" @click="conflictInfo ? conflictInfo = null : showSaveResumenDlg = false">
              Cancelar
            </v-btn>
            <!-- Botón conflicto -->
            <v-btn
              v-if="conflictInfo"
              color="warning"
              variant="flat"
              :loading="savingResumen"
              @click="confirmarGuardarResumenForce"
            >
              <v-icon size="16" class="mr-1">mdi-delete-sweep-outline</v-icon>
              Sí, eliminar y reimportar
            </v-btn>
            <!-- Botón normal -->
            <v-btn
              v-else
              color="#0891b2"
              variant="flat"
              :loading="savingResumen"
              :disabled="previewResumen.filter(r => r.cuenta).length === 0"
              @click="confirmarGuardarResumen()"
            >
              <v-icon size="16" class="mr-1">mdi-content-save-outline</v-icon>
              Confirmar y Guardar
            </v-btn>
          </div>
        </template>

        <!-- Cargando config -->
        <div v-if="!saveResumenError && !configGeneral" class="rs-dlg-loading">
          <v-progress-circular indeterminate color="primary" size="32" />
          <span>Cargando configuración...</span>
        </div>

      </v-card>
    </v-dialog>

    <!-- ═══════════════════════════════════════════════
         DIALOG: CONFIGURAR CUENTAS CONFIG_GENERAL
    ═══════════════════════════════════════════════ -->
    <v-dialog v-model="showCfgEditor" max-width="560" scrollable>
      <v-card class="rcpopup">

        <!-- Header -->
        <div class="rcpopup-header" style="background: linear-gradient(135deg,#475569,#334155)">
          <div class="rcpopup-icon">
            <v-icon size="18" color="white">mdi-cog-outline</v-icon>
          </div>
          <div class="rcpopup-title-wrap">
            <div class="rcpopup-title">CONFIGURAR CUENTAS CONTABLES</div>
            <div class="rcpopup-sub">Asigna una cuenta a cada concepto de importación Square</div>
          </div>
          <v-btn icon variant="text" size="small" @click="showCfgEditor = false">
            <v-icon size="18" color="white">mdi-close</v-icon>
          </v-btn>
        </div>

        <!-- Campos -->
        <div class="rcpopup-body" style="padding:16px">
          <div v-if="cuentasLoading2" class="rs-dlg-loading">
            <v-progress-circular indeterminate color="#475569" size="28" />
            <span>Cargando cuentas...</span>
          </div>
          <template v-else>
            <div
              v-for="f in CFG_FIELDS"
              :key="f.key"
              class="cfg-editor-row"
            >
              <div class="cfg-editor-lbl">{{ f.label }}</div>
              <v-autocomplete
                v-model="editCfg[f.key]"
                :items="cuentasContables"
                item-title="cuenta"
                item-value="codigo"
                density="compact"
                variant="outlined"
                hide-details
                clearable
                placeholder="Sin asignar"
                class="cfg-editor-select"
                bg-color="rgb(var(--v-theme-surface))"
              >
                <template #prepend-inner>
                  <span v-if="editCfg[f.key]" class="rs-dlg-cta-badge">{{ editCfg[f.key] }}</span>
                </template>
                <template #item="{ item, props }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <span style="font-family:monospace;font-size:11px;font-weight:700;color:#06b6d4;margin-right:8px">{{ item.raw.codigo }}</span>
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </div>

            <!-- Error -->
            <div v-if="saveCfgError" class="iv-error" style="margin-top:10px;border-radius:8px">
              <v-icon size="15" color="error">mdi-alert-circle-outline</v-icon>
              <span>{{ saveCfgError }}</span>
            </div>
          </template>
        </div>

        <!-- Acciones -->
        <div class="rs-dlg-actions">
          <v-btn variant="text" @click="showCfgEditor = false">Cancelar</v-btn>
          <v-btn
            color="#475569"
            variant="flat"
            :loading="savingCfg"
            :disabled="cuentasLoading2"
            @click="guardarCfg"
          >
            <v-icon size="15" class="mr-1">mdi-content-save-outline</v-icon>
            Guardar Configuración
          </v-btn>
        </div>

      </v-card>
    </v-dialog>

    <!-- ═══════════════════════════════════════════════
         POPUP: RECETAS QUE USAN EL PRODUCTO
    ═══════════════════════════════════════════════ -->
    <v-dialog v-model="showRecetasDialog" max-width="620" scrollable>
      <v-card v-if="recetasDialogItem" class="rcpopup">
        <!-- Header -->
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

        <!-- Total -->
        <div class="rcpopup-total-row">
          <span class="rcpopup-total-lbl">CONSUMO TOTAL DEL PERÍODO</span>
          <span class="rcpopup-total-val">{{ fmtDec(recetasDialogItem.totalConsumo) }} {{ recetasDialogItem.und }}</span>
        </div>

        <!-- Tabla de recetas -->
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

    <!-- ═══════════════════════════════════════════════
         POPUP: CONFIGURAR MODIFICADOR → INVENTARIO
    ═══════════════════════════════════════════════ -->
    <v-dialog v-model="showConfigDialog" max-width="660" scrollable>
      <v-card v-if="configDialogMod" class="rcpopup">

        <!-- Header -->
        <div class="rcpopup-header" style="background: linear-gradient(135deg,#f59e0b,#d97706)">
          <div class="rcpopup-icon">
            <v-icon size="18" color="white">mdi-cog-outline</v-icon>
          </div>
          <div class="rcpopup-title-wrap">
            <div class="rcpopup-title">{{ configDialogMod.modificador }}</div>
            <div class="rcpopup-sub">Grupo: {{ configDialogMod.grupo }} · Configura qué ingredientes impacta este modificador</div>
          </div>
          <v-btn icon variant="text" size="small" @click="showConfigDialog = false">
            <v-icon size="18" color="white">mdi-close</v-icon>
          </v-btn>
        </div>

        <!-- Filas existentes -->
        <div class="rcpopup-body">
          <div v-if="configLines.length === 0" class="config-empty">
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
              <tr v-for="ln in configLines" :key="ln.id" class="tr-item">
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
                    icon size="x-small" variant="text" color="error"
                    :loading="deletingId === ln.id"
                    @click="deleteLine(ln.id)"
                  >
                    <v-icon size="15">mdi-delete-outline</v-icon>
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Error al guardar -->
        <div v-if="saveLineError" class="iv-error" style="margin:8px 16px 0; border-radius:8px">
          <v-icon size="16" color="error">mdi-alert-circle-outline</v-icon>
          <span>{{ saveLineError }}</span>
        </div>

        <!-- Formulario nueva línea -->
        <div class="config-new-row">
          <div class="config-new-title">
            <v-icon size="13" color="warning" class="mr-1">mdi-plus-circle-outline</v-icon>
            AGREGAR INGREDIENTE
          </div>
          <div class="config-new-fields">
            <v-autocomplete
              v-model="newLine.articulo"
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
              v-model="newLine.cant"
              label="Cant/Unidad"
              density="compact"
              variant="outlined"
              hide-details
              type="number"
              min="0"
              step="0.0001"
              class="config-field-cant"
            />

            <v-btn-toggle v-model="newLine.tipo" mandatory density="compact" class="config-tipo-toggle">
              <v-btn value="+" color="success" size="small">+ SUMA</v-btn>
              <v-btn value="-" color="error" size="small">− RESTA</v-btn>
            </v-btn-toggle>

            <v-btn
              color="warning"
              :loading="savingLine"
              :disabled="!newLine.articulo || !newLine.cant"
              @click="saveNewLine"
              size="small"
            >
              <v-icon size="16" class="mr-1">mdi-content-save-outline</v-icon>
              Guardar
            </v-btn>
          </div>
        </div>

      </v-card>
    </v-dialog>

    <!-- ⚠️ POPUP: Ubicaciones distintas entre archivos -->
    <v-dialog v-model="dlgUbicDiferente" max-width="420">
      <v-card rounded="lg">
        <v-card-text class="pa-6">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px">
            <div style="width:44px;height:44px;border-radius:12px;background:rgba(245,158,11,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <v-icon size="24" color="warning">mdi-alert-outline</v-icon>
            </div>
            <div>
              <div style="font-size:15px;font-weight:700;color:rgb(var(--v-theme-on-surface))">Centros de costo distintos</div>
              <div style="font-size:12px;color:rgba(var(--v-theme-on-surface),0.5);margin-top:2px">Los dos archivos tienen ubicaciones diferentes</div>
            </div>
          </div>
          <div style="background:rgba(var(--v-theme-on-surface),0.04);border-radius:10px;padding:12px 14px;font-size:13px;display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;align-items:center;gap:8px">
              <v-icon size="13" color="primary">mdi-file-chart-outline</v-icon>
              <span style="color:rgba(var(--v-theme-on-surface),0.55);min-width:80px">Resumen:</span>
              <strong>{{ resumen?.ubicacion }}</strong>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <v-icon size="13" color="primary">mdi-package-variant-closed</v-icon>
              <span style="color:rgba(var(--v-theme-on-surface),0.55);min-width:80px">Artículos:</span>
              <strong>{{ articulos?.ubicacion }}</strong>
            </div>
          </div>
          <p style="font-size:12px;color:rgba(var(--v-theme-on-surface),0.5);margin-top:14px;margin-bottom:0">
            Verifica que estés cargando los archivos correctos para el mismo local antes de continuar.
          </p>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn color="warning" variant="flat" @click="dlgUbicDiferente = false">Entendido</v-btn>
          <v-spacer />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar de confirmación -->
    <v-snackbar
      v-model="snackbarSuccess"
      color="success"
      :timeout="3500"
      location="bottom center"
      rounded="pill"
    >
      <v-icon size="18" class="mr-2">mdi-check-circle</v-icon>
      <strong>¡Guardado correctamente!</strong>
    </v-snackbar>

  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { formatFecha } from '../../utils/formatters'

// ─── Auth ─────────────────────────────────────────────────────
const authStore   = useAuthStore()
const empresaCodigo = computed(() => authStore.empresa || authStore.user?.empresa || '')

// Detecta si el nombre de ubicación del CSV no coincide con el CCosto seleccionado
const ubicacionMismatch = computed(() => {
  if (!resumen.value?.ubicacion || !configCcosto.value) return false
  const ccObj = ccostos.value.find(c => c.codigo === configCcosto.value)
  if (!ccObj) return false
  const normalize = s => String(s).toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '')
  return !normalize(ccObj.nombre).includes(normalize(resumen.value.ubicacion)) &&
         !normalize(resumen.value.ubicacion).includes(normalize(ccObj.nombre))
})

// Extrae la primera fecha YYYY-MM-DD del nombre de archivo
function extractEndDateFromFilename(filename) {
  const matches = filename.match(/\d{4}-\d{2}-\d{2}/g)
  return matches?.length ? matches[0] : null
}

// ✓ La fecha del DTP coincide con la primera fecha del nombre del archivo
const fechaMatch = computed(() => {
  if (!configFecha.value) return false
  const file = articulosFileName.value || resumenFileName.value
  if (!file) return false
  return extractEndDateFromFilename(file) === configFecha.value
})

// ✗ Hay archivo cargado pero la fecha no coincide
const fechaMismatch = computed(() => {
  const file = articulosFileName.value || resumenFileName.value
  if (!file || !configFecha.value) return false
  return extractEndDateFromFilename(file) !== configFecha.value
})

// ✓ El centro de costo seleccionado coincide con la ubicación del CSV
const ccostoMatch = computed(() => {
  const ubicacion = resumen.value?.ubicacion || articulos.value?.ubicacion
  if (!ubicacion || !configCcosto.value) return false
  return !ubicacionMismatch.value
})

// ─── Config importación ───────────────────────────────────────
const configFecha      = ref(new Date().toISOString().slice(0, 10))  // hoy por defecto
const configCcosto     = ref(null)
const configCtaSquare  = ref(null)
const configCtaOtros   = ref(null)
const configCtaEfectivo = ref(null)
const ccostos          = ref([])
const ccostosLoading   = ref(false)
const cuentasBancarias = ref([])
const cuentasLoading   = ref(false)

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
    const resp = await api.get('/cuentas-bancarias', {
      params: { empresa: empresaCodigo.value }
    })
    if (resp.data?.success) cuentasBancarias.value = resp.data.data
  } catch (e) { console.error('fetchCuentasBancarias:', e) }
  finally { cuentasLoading.value = false }
}

// Precarga las cuentas bancarias predeterminadas (Otros / Efectivo) definidas
// en Configuración → Configuración General (Tesorería).
async function precargarCuentasDefault() {
  try {
    const resp = await api.get('/config-general', { params: { empresa: empresaCodigo.value } })
    const cfg = resp.data?.data || {}
    if (cfg.cta_bancaria_otros)    configCtaOtros.value    = cfg.cta_bancaria_otros
    if (cfg.cta_bancaria_efectivo) configCtaEfectivo.value = cfg.cta_bancaria_efectivo
  } catch (e) { console.error('precargarCuentasDefault:', e) }
}

onMounted(() => {
  fetchCcostos()
  fetchCuentasBancarias()
  precargarCuentasDefault()
})

// ─── State ───────────────────────────────────────────────────
const resumen          = ref(null)
const articulos        = ref(null)
const resumenFileName  = ref('')
const articulosFileName= ref('')
const archivoFileName  = ref('')
const parseError       = ref('')
const dragging         = ref([false, false])
const catFiltro        = ref('')
const enrichLoading    = ref(false)
const consumo          = ref([])
const consumoLoading   = ref(false)
const consumoError     = ref('')
const activeTab        = ref('resumen')
const showRecetasDialog  = ref(false)
const recetasDialogItem  = ref(null)

// ── Configuración modificadores → inventario ──────────
const allMappings          = ref([])     // todas las filas de modificadores_inventario
const mappingsLoading      = ref(false)
const showConfigDialog     = ref(false)
const configDialogMod      = ref(null)   // modificador que se está editando
const configLines          = ref([])     // mappings del modificador actual
const productosControlados = ref([])     // para autocomplete
const newLine              = ref({ articulo: null, cant: '', tipo: '+' })
const savingLine           = ref(false)
const deletingId           = ref(null)
const saveLineError        = ref('')

// ─── Formatting ──────────────────────────────────────────────
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

// Siempre 2 decimales fijos (para columnas de consumo)
function fmtDec(val) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(parseFloat(val || 0))
}

// ─── Aviso de ubicación distinta entre archivos ───────────────
const dlgUbicDiferente = ref(false)

function verificarUbicaciones() {
  if (!resumen.value?.ubicacion || !articulos.value?.ubicacion) return false
  const norm = s => String(s).toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (norm(resumen.value.ubicacion) !== norm(articulos.value.ubicacion)) {
    dlgUbicDiferente.value = true
    return true
  }
  return false
}

// ─── Guardar Resumen en Contabilidad ─────────────────────────
const configGeneral       = ref(null)
const showSaveResumenDlg  = ref(false)
const savingResumen       = ref(false)
const saveResumenError    = ref('')
const conflictInfo        = ref(null)   // { count } cuando el backend detecta duplicados
const saveResumenSuccess  = ref(false)
const saveResumenResult   = ref(null)
const snackbarSuccess     = ref(false)

// ── Config General: editor de cuentas ─────────────────
const showCfgEditor    = ref(false)
const cuentasContables = ref([])        // lista para el select
const cuentasLoading2  = ref(false)
const editCfg          = ref({})        // copia editable de config_general
const savingCfg        = ref(false)
const saveCfgError     = ref('')

const CFG_FIELDS = [
  { key: 'cta_ventas',            label: 'Ventas Brutas − Devoluciones' },
  { key: 'cta_descuentos_ventas', label: 'Descuentos en Ventas' },
  { key: 'cta_impuestos',         label: 'Impuestos' },
  { key: 'cta_propinas',          label: 'Propinas' },
  { key: 'cta_comisiones',        label: 'Comisiones Square' },
  { key: 'cta_egresos_impuestos', label: 'Egreso Impuestos' },
  { key: 'cta_egresos_propinas',  label: 'Egreso Propinas' },
]

async function abrirCfgEditor() {
  saveCfgError.value = ''
  // Cargar cuentas si no están cargadas
  if (!cuentasContables.value.length) {
    cuentasLoading2.value = true
    try {
      const resp = await api.get('/gastos/cuentas-contables', { params: { empresa: empresaCodigo.value } })
      if (resp.data?.success) cuentasContables.value = resp.data.cuentas
    } catch (e) { console.error('fetchCuentasContables:', e) }
    finally { cuentasLoading2.value = false }
  }
  // Copiar valores actuales para editar
  editCfg.value = configGeneral.value ? { ...configGeneral.value } : {}
  showCfgEditor.value = true
}

async function guardarCfg() {
  savingCfg.value  = true
  saveCfgError.value = ''
  try {
    const payload = { empresa: empresaCodigo.value }
    for (const f of CFG_FIELDS) payload[f.key] = editCfg.value[f.key] || null
    const resp = await api.put('/config-general', payload)
    if (!resp.data?.success) throw new Error(resp.data?.error || 'Error al guardar')
    // Recargar config y cerrar editor
    const r2 = await api.get('/config-general', { params: { empresa: empresaCodigo.value } })
    if (r2.data?.success) configGeneral.value = r2.data.data
    showCfgEditor.value = false
  } catch (e) {
    saveCfgError.value = e?.response?.data?.error || e.message || 'Error al guardar'
  } finally { savingCfg.value = false }
}

async function abrirGuardarResumen() {
  if (!resumen.value) return

  // 1º paso: verificar que ambos archivos correspondan al mismo centro de costo
  if (verificarUbicaciones()) return

  saveResumenError.value   = ''
  saveResumenSuccess.value = false
  saveResumenResult.value  = null
  configGeneral.value      = null
  conflictInfo.value       = null

  // Validar config mínima
  if (!configFecha.value || !configCcosto.value) {
    saveResumenError.value = 'Debes seleccionar Fecha y Centro de Costo antes de guardar.'
    showSaveResumenDlg.value = true
    return
  }

  try {
    const resp = await api.get('/config-general', { params: { empresa: empresaCodigo.value } })
    if (!resp.data?.success) throw new Error(resp.data?.error || 'Error al leer configuración')
    configGeneral.value = resp.data.data
  } catch (e) {
    saveResumenError.value = e?.response?.data?.error || e.message || 'Error al cargar config_general'
  }
  showSaveResumenDlg.value = true
}

// Preview de los 7 registros calculados con los datos actuales
const previewResumen = computed(() => {
  if (!resumen.value || !configGeneral.value) return []
  const v   = resumen.value.ventas
  const p   = resumen.value.pagos
  const cfg = configGeneral.value
  const ventasNetas  = Math.abs((v.ventasBrutas || 0) - (v.devoluciones || 0))
  const descuentos   = Math.abs(v.descuentos  || 0)
  const impuestos    = Math.abs(v.impuestos   || 0)
  const propinas     = Math.abs(v.propinas    || 0)
  const comisiones   = Math.abs(p.comisiones  || 0)
  return [
    { label: 'Ventas Brutas − Devoluciones', campo: 'cta_ventas',           cuenta: cfg.cta_ventas,            valor: ventasNetas },
    { label: 'Descuentos en Ventas',         campo: 'cta_descuentos_ventas', cuenta: cfg.cta_descuentos_ventas, valor: descuentos  },
    { label: 'Impuestos',                    campo: 'cta_impuestos',         cuenta: cfg.cta_impuestos,         valor: impuestos   },
    { label: 'Propinas',                     campo: 'cta_propinas',          cuenta: cfg.cta_propinas,          valor: propinas    },
    { label: 'Comisiones Square',            campo: 'cta_comisiones',        cuenta: cfg.cta_comisiones,        valor: comisiones  },
    { label: 'Egreso Impuestos',             campo: 'cta_egresos_impuestos', cuenta: cfg.cta_egresos_impuestos, valor: impuestos   },
    { label: 'Egreso Propinas',              campo: 'cta_egresos_propinas',  cuenta: cfg.cta_egresos_propinas,  valor: propinas    },
  ]
})

async function confirmarGuardarResumen(force = false) {
  savingResumen.value    = true
  saveResumenError.value = ''
  conflictInfo.value     = null
  try {
    const ccostoObj   = ccostos.value.find(c => c.codigo === configCcosto.value)
    const resp = await api.post('/square/importar-resumen', {
      empresa:       empresaCodigo.value,
      fecha:         configFecha.value,
      ccosto:        configCcosto.value,
      ccostoNombre:  ccostoObj?.nombre || configCcosto.value,
      ventas:        resumen.value.ventas,
      pagos:         resumen.value.pagos,
      items:         articulos.value?.items || [],
      consumoItems:  consumo.value || [],
      ctaSquare:     configCtaSquare.value,
      ctaOtros:      configCtaOtros.value,
      ctaEfectivo:   configCtaEfectivo.value,
      force,
    })
    // Conflicto de duplicados — mostrar advertencia al usuario
    if (resp.data?.conflict) {
      conflictInfo.value = { count: resp.data.count || 0, countVentas: resp.data.countVentas || 0, countDetalle: resp.data.countDetalle || 0, countInventario: resp.data.countInventario || 0, countMoviban: resp.data.countMoviban || 0, sampleRow: resp.data.sampleRow || null }
      return
    }
    if (!resp.data?.success) throw new Error(resp.data?.error || 'Error al guardar')
    saveResumenResult.value  = resp.data.data
    saveResumenSuccess.value = true
    showSaveResumenDlg.value = false
    snackbarSuccess.value    = true
    limpiarFormularioImportacion()
  } catch (e) {
    saveResumenError.value = e?.response?.data?.error || e.message || 'Error al guardar'
  } finally {
    savingResumen.value = false
  }
}

async function confirmarGuardarResumenForce() {
  await confirmarGuardarResumen(true)
}

// ─── Computed — artículos ─────────────────────────────────────
const categorias = computed(() => {
  if (!articulos.value) return []
  return [...new Set(articulos.value.items.map(i => i.categoria))]
})

const itemsFiltrados = computed(() => {
  if (!articulos.value) return []
  if (!catFiltro.value) return articulos.value.items
  return articulos.value.items.filter(i => i.categoria === catFiltro.value)
})

const itemsAgrupados = computed(() => {
  const groups = {}
  for (const item of itemsFiltrados.value) {
    if (!groups[item.categoria]) groups[item.categoria] = []
    groups[item.categoria].push(item)
  }
  return groups
})

function itemSubtotal(item) {
  return item.subtotal != null ? item.subtotal : item.ventasNetas
}

function subtotalCat(cat) {
  const items = itemsAgrupados.value[cat] || []
  return {
    cantidad:   items.reduce((s, i) => s + i.cantidad, 0),
    brutas:     items.reduce((s, i) => s + i.ventasBrutas, 0),
    descuentos: items.reduce((s, i) => s + i.descuentos, 0),
    netas:      items.reduce((s, i) => s + itemSubtotal(i), 0),
    impuestos:  items.reduce((s, i) => s + i.impuestos, 0),
  }
}

const totalUnidades     = computed(() => (articulos.value?.items || []).reduce((s, i) => s + i.cantidad, 0))
const totalVentasBrutas = computed(() => (articulos.value?.items || []).reduce((s, i) => s + i.ventasBrutas, 0))
const totalVentasNetas  = computed(() => (articulos.value?.items || []).reduce((s, i) => s + itemSubtotal(i), 0))

// ─── Computed — modificadores ────────────────────────────────
const modificadoresAgrupados = computed(() => {
  const groups = {}
  for (const m of (articulos.value?.modificadores || [])) {
    const g = m.grupo || 'SIN GRUPO'
    if (!groups[g]) groups[g] = []
    groups[g].push(m)
  }
  return groups
})

const totalModUnidades = computed(() =>
  (articulos.value?.modificadores || []).reduce((s, m) => s + m.cantidadNeta, 0)
)
const totalModNetas = computed(() =>
  (articulos.value?.modificadores || []).reduce((s, m) => s + m.ventasNetas, 0)
)

// ─── Computed — pagos ─────────────────────────────────────────
const pagoItems = computed(() => {
  if (!resumen.value) return []
  const p = resumen.value.pagos
  return [
    { label: 'Total Recibido',    valor: p.totalRecibido,  color: '#1d4ed8' },
    { label: 'Efectivo',          valor: p.efectivo,       color: '#059669' },
    { label: 'Tarjeta',           valor: p.tarjeta,        color: '#7c3aed' },
    { label: 'Otro',              valor: p.otro,           color: '#0891b2' },
    { label: 'Tarjeta de Regalo', valor: p.tarjetaRegalo,  color: '#db2777' },
    { label: 'Comisiones',        valor: p.comisiones,     color: '#dc2626' },
    { label: 'Total Neto',        valor: p.totalNeto,      color: '#15803d' },
  ]
})

// ─── Parser helpers ───────────────────────────────────────────

/** Decodifica buffer: UTF-16 con BOM → TSV (archivos Square en español)
 *  o bien UTF-8 → CSV con comas (archivos Square en inglés)          */
function decodeAny(buffer) {
  const bytes = new Uint8Array(buffer)
  // Detectar BOM UTF-16: FF FE (LE) o FE FF (BE)
  if ((bytes[0] === 0xFF && bytes[1] === 0xFE) || (bytes[0] === 0xFE && bytes[1] === 0xFF)) {
    const isBE = bytes[0] === 0xFE && bytes[1] === 0xFF
    let text = new TextDecoder(isBE ? 'utf-16be' : 'utf-16le').decode(buffer)
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)
    return text
  }
  return new TextDecoder('utf-8').decode(buffer)
}

/** Parsea una línea CSV con soporte para valores entre comillas */
function splitCSVLine(line) {
  const result = []
  let current  = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

/** Detecta si el archivo usa tabs (TSV) o comas (CSV) y divide en columnas.
 *  IMPORTANTE: muestreamos las primeras 15 líneas con contenido, no solo la primera,
 *  porque en archivos TSV la primera línea ("Resumen de Ventas") puede no tener tabs. */
function splitLines(text) {
  const rawLines = text.split(/\r?\n/)
  const sampleLines = rawLines.filter(l => l.trim().length > 0).slice(0, 15)
  const isTab = sampleLines.some(l => l.includes('\t'))
  if (isTab) {
    return rawLines.map(l => l.split('\t').map(c => c.trim()))
  }
  return rawLines.map(l => splitCSVLine(l))
}

/** Parsea números tanto en formato inglés ($1,108.06) como español (1108,06) */
function parseNum(str) {
  if (!str || str.trim() === '') return 0
  let s = str.trim()
    .replace(/\s/g, '')
    .replace(/^\$/, '')       // quita $ al inicio: $1,108.06 → 1,108.06
    .replace(/^-\$/, '-')     // maneja -$79.00 → -79.00
    .replace(/\$\s*$/, '')    // quita $ al final (formato español)

  // Determinar si la coma es miles (inglés) o decimal (español/europeo)
  if (s.includes(',') && s.includes('.')) {
    const lastComma  = s.lastIndexOf(',')
    const lastPeriod = s.lastIndexOf('.')
    if (lastPeriod > lastComma) {
      s = s.replace(/,/g, '')         // 1,108.06 → 1108.06 (coma = miles)
    } else {
      s = s.replace(/\./g, '').replace(',', '.')  // 1.108,06 → 1108.06 (punto = miles)
    }
  } else if (s.includes(',')) {
    s = s.replace(',', '.')           // 1108,06 → 1108.06 (solo coma = decimal español)
  }

  return parseFloat(s) || 0
}

function extractDatesFromName(filename) {
  const m = filename.match(/(\d{4}-\d{2}-\d{2})-(\d{4}-\d{2}-\d{2})/)
  if (m) return `${fmtDate(m[1])} — ${fmtDate(m[2])}`
  return filename
}

function fmtDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${d} ${meses[parseInt(m)-1]} ${y}`
}

function extractLocation(lines) {
  for (const line of lines) {
    const text  = line[0] || ''
    const lower = text.toLowerCase()
    // Español: "Filtrado por ubicación: X"  |  Inglés: "Filtered By Location: X"
    if (lower.includes('ubicaci') || lower.includes('location')) {
      const parts = text.split(':')
      return parts[1]?.trim() || ''
    }
  }
  return ''
}

// ─── Parser: resumen_ventas (ES + EN) ────────────────────────
function parseResumen(buffer, filename) {
  const text  = decodeAny(buffer)
  const lines = splitLines(text)

  const result = {
    periodo:   extractDatesFromName(filename),
    ubicacion: extractLocation(lines),
    ventas: {
      ventasBrutas: 0, articulos: 0, cargosServicio: 0,
      devoluciones: 0, descuentos: 0, ventasNetas: 0,
      ventasTarjetaRegalo: 0, impuestos: 0, propinas: 0,
      reembolsos: 0, total: 0
    },
    pagos: {
      totalRecibido: 0, efectivo: 0, tarjeta: 0,
      otro: 0, tarjetaRegalo: 0, comisiones: 0, totalNeto: 0
    }
  }

  let section = ''
  for (const line of lines) {
    const key = (line[0] || '').toLowerCase().trim()
    const val = line[1] || ''

    // ── Encabezados de sección (ES / EN) ──────────────
    if (key === 'ventas'   || key === 'sales')    { section = 'ventas'; continue }
    if (key === 'pagos'    || key === 'payments')  { section = 'pagos';  continue }

    if (section === 'ventas') {
      // Ventas brutas / Gross Sales
      if (key.includes('ventas brutas') || key === 'gross sales')
        result.ventas.ventasBrutas = parseNum(val)
      // Artículos / Items (subtotal de artículos)
      else if (key === 'artículos' || key === 'articulos' || key === 'items')
        result.ventas.articulos = parseNum(val)
      // Cargos de servicio / Service Charges
      else if (key.includes('cargos') || key.includes('service charges'))
        result.ventas.cargosServicio = parseNum(val)
      // Devoluciones / Returns
      else if (key.includes('devoluciones') || key === 'returns')
        result.ventas.devoluciones = parseNum(val)
      // Descuentos / Discounts & Comps
      else if (key.includes('descuentos') || key.includes('discounts'))
        result.ventas.descuentos = parseNum(val)
      // Ventas netas / Net Sales
      else if (key.includes('ventas netas') || key === 'net sales')
        result.ventas.ventasNetas = parseNum(val)
      // Tarjetas de regalo / Gift Card Sales
      else if (key.includes('tarjetas de regalo') || key === 'gift card sales')
        result.ventas.ventasTarjetaRegalo = parseNum(val)
      // Impuestos / Tax
      else if (key.includes('impuestos') || key === 'tax')
        result.ventas.impuestos = parseNum(val)
      // Propinas / Tip
      else if (key.includes('propinas') || key === 'tip')
        result.ventas.propinas = parseNum(val)
      // Reembolsos / Refunds
      else if (key.includes('reembolsos') || key.includes('refunds'))
        result.ventas.reembolsos = parseNum(val)
      // Total
      else if (key === 'total')
        result.ventas.total = parseNum(val)

    } else if (section === 'pagos') {
      // Total recibido / Total Collected
      if (key.includes('total recibido') || key === 'total collected')
        result.pagos.totalRecibido = parseNum(val)
      // Efectivo / Cash
      else if (key === 'efectivo' || key === 'cash')
        result.pagos.efectivo = parseNum(val)
      // Tarjeta / Card
      else if (key === 'tarjeta' || key === 'card')
        result.pagos.tarjeta = parseNum(val)
      // Otro / Other
      else if (key === 'otro' || key === 'other')
        result.pagos.otro = parseNum(val)
      // Tarjeta de regalo / Gift Card
      else if (key.includes('tarjeta de regalo') || key === 'gift card')
        result.pagos.tarjetaRegalo = parseNum(val)
      // Comisiones / Fees
      else if (key.includes('comisiones') || key === 'fees')
        result.pagos.comisiones = parseNum(val)
      // Total neto / Net Total
      else if (key.includes('total neto') || key === 'net total')
        result.pagos.totalNeto = parseNum(val)
    }
  }
  return result
}

// ─── Parser: ventas_articulos (ES + EN) ───────────────────────
function parseArticulos(buffer, filename) {
  const text  = decodeAny(buffer)
  const lines = splitLines(text)

  const result = {
    periodo:       extractDatesFromName(filename),
    ubicacion:     extractLocation(lines),
    items:         [],
    modificadores: []
  }

  let itemsHeaderIdx = -1
  let modsHeaderIdx  = -1

  for (let i = 0; i < lines.length; i++) {
    const first = (lines[i][0] || '').toLowerCase()

    // Fila de encabezado de artículos: ES "Nombre del Artículo" | EN "Item Name"
    if (first.includes('nombre del art') || first === 'item name') {
      itemsHeaderIdx = i
    }

    // Fila de encabezado de modificadores: ES "Grupo de Modificadores" | EN "Modifier Set"
    if (first.includes('grupo de modificadores') || first.includes('modificador') ||
        first === 'modifier set') {
      if (itemsHeaderIdx >= 0 && i > itemsHeaderIdx) {
        modsHeaderIdx = i
      }
    }
  }

  // ── Parsear artículos ─────────────────────────────────────
  if (itemsHeaderIdx >= 0) {
    const hdr = lines[itemsHeaderIdx].map(h => h.toLowerCase())

    // ES: "Nombre del Artículo"  |  EN: "Item Name"
    const iNombre    = hdr.findIndex(h => h.includes('nombre del art') || h === 'item name')
    // ES: "Variante"             |  EN: "Item Variation"
    const iVariante  = hdr.findIndex(h => h.includes('variante') || h === 'item variation')
    // SKU (igual en ambos idiomas, pero puede tener espacios o variaciones)
    const iSKU       = hdr.findIndex(h => h.includes('sku'))
    // ES: "Categoría"            |  EN: "Category"
    const iCat       = hdr.findIndex(h => h.includes('categor'))
    // ES: "Artículos Vendidos"   |  EN: "Items Sold"
    const iCant      = hdr.findIndex(h =>
      (h.includes('vendidos') || h === 'items sold') && !h.includes('ventas')
    )
    // ES: "Ventas Brutas"        |  EN: "Gross Sales"
    const iBrutas    = hdr.findIndex(h => h.includes('ventas brutas') || h === 'gross sales')
    // ES: "Descuentos"           |  EN: "Discounts & Comps"
    const iDesc      = hdr.findIndex(h => h.includes('descuentos') || h.includes('discounts'))
    // ES: "Ventas Netas"         |  EN: "Net Sales"
    const iNetas     = hdr.findIndex(h => h.includes('ventas netas') || h === 'net sales')
    // ES: "Impuestos"            |  EN: "Tax"
    const iImpuestos = hdr.findIndex(h => h.includes('impuesto') || h === 'tax')
    // Subtotal (solo archivos ES con esa columna)
    const iSubtotal  = hdr.findIndex(h => h.includes('subtotal'))
    // Precio unitario (solo archivos ES)
    const iVrUnit    = hdr.findIndex(h =>
      h.includes('precio por') || h.includes('unitario') || (h.includes('vr') && h.includes('unit'))
    )

    for (let i = itemsHeaderIdx + 1; i < lines.length; i++) {
      const line  = lines[i]
      if (!line[0] || line[0].trim() === '') continue
      const first = (line[0] || '').toLowerCase()

      // Fin de sección artículos (ES o EN)
      if (first.includes('ventas con modificadores') || first.includes('grupo de modificadores') ||
          first.includes('modifier sales')           || first === 'modifier set') break

      const item = {
        nombre:       line[iNombre]    || '',
        variante:     iVariante  >= 0 ? (line[iVariante]  || '') : '',
        sku:          iSKU       >= 0 ? (line[iSKU]       || '') : '',
        categoria:    iCat       >= 0 ? (line[iCat]       || 'SIN CATEGORÍA') : 'SIN CATEGORÍA',
        cantidad:     parseInt(iCant >= 0 ? (line[iCant]  || '0') : '0') || 0,
        ventasBrutas: iBrutas    >= 0 ? parseNum(line[iBrutas])    : 0,
        descuentos:   iDesc      >= 0 ? parseNum(line[iDesc])      : 0,
        ventasNetas:  iNetas     >= 0 ? parseNum(line[iNetas])     : 0,
        impuestos:    iImpuestos >= 0 ? parseNum(line[iImpuestos]) : 0,
        subtotal:     iSubtotal  >= 0 ? parseNum(line[iSubtotal])  : null,
        vrUnit:       iVrUnit    >= 0 ? parseNum(line[iVrUnit])    : null,
      }
      if (item.nombre) result.items.push(item)
    }
  }

  // ── Parsear modificadores ─────────────────────────────────
  if (modsHeaderIdx >= 0) {
    const hdr = lines[modsHeaderIdx].map(h => h.toLowerCase())

    // ES: "Grupo de Modificadores"  |  EN: "Modifier Set"
    const iGrupo    = hdr.findIndex(h => h.includes('grupo') || h === 'modifier set')
    // ES: "Modificador"             |  EN: "Modifier" (no "Modifier Set")
    const iMod      = hdr.findIndex(h =>
      (h.includes('modificador') || h === 'modifier') && !h.includes('grupo') && !h.includes('set')
    )
    // ES: "Monto Neto Vendido"      |  EN: "Net Qty Sold"
    const iCantNeta = hdr.findIndex(h =>
      h.includes('monto neto') || h.includes('neto vendido') || h === 'net qty sold'
    )
    // ES: "Ventas Netas"            |  EN: "Net Sales"
    const iNetas    = hdr.findIndex(h => h.includes('ventas netas') || h === 'net sales')
    // ES: "Monto Vendido"           |  EN: "Qty Sold"
    const iCantB    = hdr.findIndex(h => h.includes('monto vendido') || h === 'qty sold')
    // ES: "Ventas Brutas"           |  EN: "Gross Sales"
    const iBrutas   = hdr.findIndex(h => h.includes('ventas brutas') || h === 'gross sales')

    for (let i = modsHeaderIdx + 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line[0] || line[0].trim() === '') continue
      const mod = {
        grupo:        iGrupo    >= 0 ? (line[iGrupo]    || '') : '',
        modificador:  iMod      >= 0 ? (line[iMod]      || '') : '',
        cantidadNeta: parseInt(iCantNeta >= 0 ? (line[iCantNeta] || '0') : '0') || 0,
        ventasNetas:  iNetas    >= 0 ? parseNum(line[iNetas])   : 0,
        cantidadB:    parseInt(iCantB    >= 0 ? (line[iCantB]   || '0') : '0') || 0,
        ventasBrutas: iBrutas   >= 0 ? parseNum(line[iBrutas])  : 0,
      }
      if (mod.modificador) result.modificadores.push(mod)
    }
  }

  return result
}

// ─── Recetas enrichment ───────────────────────────────────────
async function enrichWithRecetas() {
  if (!articulos.value?.items?.length) return
  const skus = [...new Set(
    articulos.value.items.map(i => i.sku).filter(s => s && s.trim() !== '')
  )]
  if (skus.length === 0) return
  enrichLoading.value = true
  try {
    const resp = await api.get('/recetas/por-skus', { params: { skus: skus.join(',') } })
    if (resp.data?.success && resp.data.data?.length) {
      const recetaMap = {}
      for (const r of resp.data.data) {
        recetaMap[(r.codigo || '').toString().trim()] = r
      }
      for (const item of articulos.value.items) {
        const sku = (item.sku || '').trim()
        if (sku && recetaMap[sku]) {
          item.nombreReceta = recetaMap[sku].nombre
          item.precioVenta  = parseFloat(recetaMap[sku].precio_venta) || 0
          item.subtotal     = item.cantidad * item.precioVenta
        }
      }
    }
  } catch (e) {
    console.error('Error al cargar recetas por SKU:', e)
  } finally {
    enrichLoading.value = false
  }
}

// ─── Consumo de materia prima ─────────────────────────────────
async function calcularConsumo() {
  if (!articulos.value?.items?.length) return
  const itemsConSku = articulos.value.items.filter(i => i.sku && i.sku.trim() !== '')
  if (itemsConSku.length === 0) return

  const skus = [...new Set(itemsConSku.map(i => i.sku.trim()))]

  consumoLoading.value = true
  consumoError.value = ''
  consumo.value = []
  try {
    const resp = await api.get('/detalle-productos/por-recetas', {
      params: { recetas: skus.join(',') }
    })
    if (!resp.data?.success || !resp.data.data?.length) return

    const cantMap = {}
    for (const item of itemsConSku) {
      const sku = item.sku.trim()
      cantMap[sku] = (cantMap[sku] || 0) + item.cantidad
    }

    const nombreRecetaMap = {}
    for (const item of itemsConSku) {
      const sku = item.sku.trim()
      if (!nombreRecetaMap[sku]) nombreRecetaMap[sku] = item.nombreReceta || item.nombre || sku
    }

    const consumoMap = {}
    for (const dp of resp.data.data) {
      const receta   = (dp.receta   || '').trim()
      const codArt   = (dp.articulo || '').trim()
      const nombre   = (dp.articulo_nombre || codArt).trim()
      const und      = (dp.und || '').trim()
      const cantRec  = parseFloat(dp.cant) || 0
      const vendidos = cantMap[receta] || 0
      const total    = cantRec * vendidos

      const grupo      = (dp.grupo       || '').trim()
      const grupoNombre= (dp.grupo_nombre || grupo || 'SIN GRUPO').trim()

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

    // ── Aplica mappings de modificadores ─────────────
    for (const mod of (articulos.value?.modificadores || [])) {
      const modNombre = (mod.modificador || '').trim()
      const mappings  = allMappings.value.filter(m => m.modificador === modNombre)
      for (const mp of mappings) {
        const codArt   = (mp.articulo || '').trim()
        const nombre   = (mp.articulo_nombre || codArt).trim()
        const und      = (mp.und || '').trim()
        const grupo    = (mp.grupo || '').trim()
        const cantMp   = parseFloat(mp.cant) || 0
        const vendidos = mod.cantidadNeta || 0
        const total    = cantMp * vendidos
        const delta    = mp.tipo === '-' ? -total : total

        if (!consumoMap[codArt]) {
          consumoMap[codArt] = { codigo: codArt, nombre, und, grupo, grupoNombre: grupo || 'SIN GRUPO', totalConsumo: 0, recetas: [] }
        }
        consumoMap[codArt].totalConsumo += delta
        consumoMap[codArt].recetas.push({
          sku:          mp.tipo === '-' ? 'MOD−' : 'MOD+',
          nombreReceta: (mp.tipo === '-' ? '[RESTA] ' : '') + modNombre,
          cantPorUnidad: cantMp,
          vendidos,
          subtotal:     delta
        })
      }
    }

    consumo.value = Object.values(consumoMap).sort((a, b) => {
      const g = a.grupo.localeCompare(b.grupo)
      return g !== 0 ? g : a.nombre.localeCompare(b.nombre)
    })
  } catch (e) {
    console.error('Error al calcular consumo:', e)
    consumoError.value = e?.response?.data?.error || e.message || 'Error al consultar detalle_productos'
  } finally {
    consumoLoading.value = false
  }
}

const maxConsumo = computed(() =>
  consumo.value.reduce((m, c) => Math.max(m, c.totalConsumo), 0)
)

// Set de nombres de modificadores que tienen al menos 1 mapping configurado
const modificadoresConfigurados = computed(() =>
  new Set(allMappings.value.map(m => m.modificador))
)

// Agrupa consumo por grupo de producto (ya viene ordenado por grupo)
const consumoAgrupado = computed(() => {
  const groups = {}
  for (const c of consumo.value) {
    const key = c.grupo || 'ZZZ'
    if (!groups[key]) groups[key] = { grupo: c.grupo, grupoNombre: c.grupoNombre, items: [] }
    groups[key].items.push(c)
  }
  // Retorna array ordenado por clave de grupo
  return Object.values(groups).sort((a, b) => a.grupo.localeCompare(b.grupo))
})

function verRecetas(item) {
  recetasDialogItem.value = item
  showRecetasDialog.value = true
}

// ── Mappings modificadores ────────────────────────────
async function fetchMappings() {
  mappingsLoading.value = true
  try {
    const resp = await api.get('/modificadores-inventario')
    if (resp.data?.success) allMappings.value = resp.data.data
  } catch (e) { console.error('fetchMappings:', e) }
  finally { mappingsLoading.value = false }
}

async function fetchProductosControlados(q = '') {
  try {
    const resp = await api.get('/productos/controlados', { params: q ? { q } : {} })
    if (resp.data?.success) productosControlados.value = resp.data.data
  } catch (e) { console.error('fetchProductosControlados:', e) }
}

function openConfigDialog(mod) {
  configDialogMod.value = mod
  configLines.value = allMappings.value.filter(m => m.modificador === mod.modificador)
  newLine.value = { articulo: null, cant: '', tipo: '+' }
  saveLineError.value = ''
  showConfigDialog.value = true
  fetchProductosControlados()
}

async function saveNewLine() {
  if (!newLine.value.articulo || !newLine.value.cant) return
  savingLine.value = true
  saveLineError.value = ''
  try {
    const codigo = typeof newLine.value.articulo === 'object'
      ? newLine.value.articulo.codigo
      : newLine.value.articulo
    const resp = await api.post('/modificadores-inventario', {
      modificador: configDialogMod.value.modificador,
      articulo:    codigo,
      cant:        parseFloat(newLine.value.cant),
      tipo:        newLine.value.tipo
    })
    if (!resp.data?.success) throw new Error(resp.data?.error || 'Error al guardar')
    await fetchMappings()
    configLines.value = allMappings.value.filter(m => m.modificador === configDialogMod.value.modificador)
    newLine.value = { articulo: null, cant: '', tipo: '+' }
    if (articulos.value) await calcularConsumo()
  } catch (e) {
    console.error('saveNewLine:', e)
    saveLineError.value = e?.response?.data?.error || e.message || 'Error al guardar'
  } finally { savingLine.value = false }
}

async function deleteLine(id) {
  deletingId.value = id
  try {
    await api.delete(`/modificadores-inventario/${id}`)
    await fetchMappings()
    configLines.value = allMappings.value.filter(m => m.modificador === configDialogMod.value.modificador)
    if (articulos.value) await calcularConsumo()
  } catch (e) { console.error('deleteLine:', e) }
  finally { deletingId.value = null }
}

// ─── File handling ────────────────────────────────────────────
// Procesa un ÚNICO archivo CSV combinado (Square exporta todas las secciones
// en un solo archivo: Key Stats, Sales Summary, Payments, Item Sales, Modifier
// Sales). Los dos parsers escanean el archivo completo y extraen su sección,
// funcionando tanto en inglés como en español.
async function processFile(file) {
  parseError.value = ''
  try {
    const buffer = await file.arrayBuffer()
    archivoFileName.value   = file.name
    resumenFileName.value   = file.name
    articulosFileName.value = file.name

    resumen.value   = parseResumen(buffer, file.name)
    articulos.value = parseArticulos(buffer, file.name)

    await enrichWithRecetas()
    await fetchMappings()
    await calcularConsumo()

    activeTab.value = 'resumen'
  } catch (e) {
    parseError.value = `Error al parsear "${file.name}": ${e.message}`
    console.error(e)
  }
}

function onDrop(e) {
  dragging.value = [false, false]
  const file = e.dataTransfer.files[0]
  if (file) processFile(file)
}

function onFileInput(e) {
  const file = e.target.files[0]
  if (file) processFile(file)
  e.target.value = ''
}

function limpiar() {
  resumen.value = null
  articulos.value = null
  resumenFileName.value = ''
  articulosFileName.value = ''
  archivoFileName.value = ''
  consumo.value = []
  consumoError.value = ''
  activeTab.value = 'resumen'
  parseError.value = ''
}

// Tras guardar exitosamente: limpiar los CSV cargados y los selects
// de Centro de Costo / Cta. Square para el siguiente día a importar
function limpiarFormularioImportacion() {
  limpiar()
  configCcosto.value    = null
  configCtaSquare.value = null
}
</script>

<style scoped>
/* ── Wrapper ───────────────────────────────────────── */
.iv-wrap { padding: 24px; max-width: 1280px; margin: 0 auto; }

/* ── Breadcrumb ────────────────────────────────────── */
.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 11px; font-weight: 700; color: var(--indigo); text-transform: uppercase; letter-spacing: 0.5px; }
.bc-cat  { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.4); }
.bc-cur  { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.7); font-weight: 600; }

/* ── Header ────────────────────────────────────────── */
.iv-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.iv-header-left { display: flex; align-items: center; gap: 16px; }
.iv-icon-wrap {
  width: 52px; height: 52px; border-radius: 16px;
  background: linear-gradient(135deg, var(--gold), var(--gold));
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 20px rgba(245,158,11,0.38); flex-shrink: 0;
}
.iv-title { font-size: 21px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); letter-spacing: 0.4px; margin: 0; }
.iv-sub   { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.45); margin: 3px 0 0; }

/* ── Drop zones ────────────────────────────────────── */
.iv-upload-row {
  display: grid; grid-template-columns: 1fr; gap: 16px;
  margin-bottom: 24px;
}

.drop-zone {
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.18);
  border-radius: 16px; padding: 32px 24px; cursor: pointer;
  transition: all 0.2s; background: rgb(var(--v-theme-surface));
  text-align: center; min-height: 160px;
  display: flex; align-items: center; justify-content: center;
}
.drop-zone:hover { border-color: var(--indigo); background: rgba(6,182,212,0.03); }
.drop-zone--active { border-color: var(--indigo); background: rgba(6,182,212,0.06); }
.drop-zone--loaded { border-style: solid; border-color: var(--success); background: rgba(16,185,129,0.04); }

.drop-content { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.drop-icon-wrap {
  width: 56px; height: 56px; border-radius: 16px;
  display: flex; align-items: center; justify-content: center; margin-bottom: 4px;
}
.drop-icon-blue   { background: linear-gradient(135deg,#3b82f6,#2563eb); }
.drop-icon-purple { background: linear-gradient(135deg,var(--indigo),var(--indigo)); }
.drop-title { font-size: 15px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }
.drop-sub   { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.45); }
.drop-hint  { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.3); margin-top: 4px; }
.drop-hint code { background: rgba(var(--v-theme-on-surface),0.06); padding: 2px 6px; border-radius: 4px; }

.drop-loaded { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.drop-loaded-name { font-size: 13px; font-weight: 600; color: var(--success); word-break: break-all; }
.drop-loaded-sub  { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5); }
.drop-loaded-loc {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--indigo);
  background: rgba(6,182,212,0.08);
  padding: 2px 8px;
  border-radius: 10px;
}
.drop-loaded-stats { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; margin-top: 2px; }
.drop-stat {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

/* Advertencia de mismatch en el diálogo */
.rs-loc-warn {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 12px 16px 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(245,158,11,0.08);
  border: 1px solid rgba(245,158,11,0.25);
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.75);
  line-height: 1.5;
}

/* ── Error ─────────────────────────────────────────── */
.iv-error {
  display: flex; align-items: center; gap: 10px;
  background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.25);
  border-radius: 10px; padding: 12px 16px; margin-bottom: 20px;
  font-size: 13px; color: var(--error);
}

/* ── Sheets (tabs) ─────────────────────────────────── */
.sheets-container { margin-top: 4px; }

.sheets-tabbar {
  display: flex; align-items: flex-end; gap: 0;
  position: relative;
}

.sheet-tab {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 8px 14px; font-size: 12px; font-weight: 600;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.12);
  border-bottom: none; border-radius: 8px 8px 0 0;
  background: rgba(var(--v-theme-on-surface), 0.03);
  color: rgba(var(--v-theme-on-surface), 0.45);
  cursor: pointer; margin-right: 3px;
  transition: all 0.15s;
  position: relative; bottom: -1.5px;
  outline: none;
}
.sheet-tab:hover {
  color: rgba(var(--v-theme-on-surface), 0.75);
  background: rgba(var(--v-theme-on-surface), 0.06);
}
.sheet-tab--active {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  border-color: rgba(var(--v-theme-on-surface), 0.18);
  border-bottom-color: rgb(var(--v-theme-surface));
  z-index: 2;
  font-weight: 700;
}
.sheet-tab--loading { opacity: 0.75; }

.sheets-tabbar-line {
  flex: 1;
  border-bottom: 1.5px solid rgba(var(--v-theme-on-surface), 0.18);
  position: relative; bottom: -1.5px;
}

.sheet-badge {
  font-size: 9px; font-weight: 800;
  padding: 1px 6px; border-radius: 20px;
}
.sheet-badge-purple { background: rgba(139,92,246,0.13); color: var(--indigo); }
.sheet-badge-orange { background: rgba(245,158,11,0.13); color: var(--gold); }
.sheet-badge-red    { background: rgba(239,68,68,0.13);  color: var(--error); }

.sheet-content {
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.18);
  border-top: none;
  border-radius: 0 8px 8px 8px;
  padding: 20px 20px 28px;
  background: rgb(var(--v-theme-surface));
  position: relative; z-index: 1;
}

/* Tab vacío */
.tab-empty {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 48px 24px; text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.35);
  font-size: 13px;
}

/* ── Sections ──────────────────────────────────────── */
.iv-section { display: flex; flex-direction: column; gap: 16px; }
.iv-section-header { display: flex; align-items: center; gap: 12px; }
.iv-section-icon {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.iv-section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: rgb(var(--v-theme-on-surface)); }
.iv-section-sub   { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.45); margin-top: 2px; }

/* ── KPI Grid ──────────────────────────────────────── */
.kpi-grid { display: grid; gap: 12px; }
.kpi-grid-3 { grid-template-columns: repeat(3, 1fr); }
.kpi-grid-4 { grid-template-columns: repeat(4, 1fr); }
@media (max-width: 900px) { .kpi-grid-3, .kpi-grid-4 { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .kpi-grid-3, .kpi-grid-4 { grid-template-columns: 1fr; } }

.kpi-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px; padding: 14px 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.kpi-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.5); }
.kpi-val { font-size: 20px; font-weight: 800; font-variant-numeric: tabular-nums; }

.kpi-blue      { border-left: 3px solid #3b82f6; } .kpi-val-blue      { color: #3b82f6; }
.kpi-green     { border-left: 3px solid var(--success); } .kpi-val-green     { color: var(--success); }
.kpi-green-dark{ border-left: 3px solid var(--success); } .kpi-val-green-dark{ color: var(--success); }
.kpi-orange    { border-left: 3px solid var(--gold); } .kpi-val-orange    { color: var(--gold); }
.kpi-purple    { border-left: 3px solid var(--indigo); } .kpi-val-purple    { color: var(--indigo); }
.kpi-gray      { border-left: 3px solid #64748b; } .kpi-val-gray      { color: #64748b; }
.kpi-blue-dark { border-left: 3px solid #1d4ed8; } .kpi-val-blue-dark { color: #1d4ed8; }
.kpi-red       { border-left: 3px solid var(--error); } .kpi-val-red       { color: var(--error); }

/* ── Card ──────────────────────────────────────────── */
.iv-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 14px; overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.iv-card-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  flex-wrap: wrap; gap: 8px;
}
.iv-card-title {
  font-size: 12px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.7);
  display: flex; align-items: center;
}
.mr-1 { margin-right: 4px; }
.ml-1 { margin-left: 4px; }
.iv-card-chips { display: flex; gap: 6px; flex-wrap: wrap; }

/* ── Resumen vertical layout ───────────────────────── */
.rs-two-col {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}
@media (max-width: 760px) { .rs-two-col { grid-template-columns: 1fr; } }

.rs-card { display: flex; flex-direction: column; }

.rs-rows { display: flex; flex-direction: column; padding: 4px 0; }

.rs-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 18px; gap: 12px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.04);
  transition: background 0.1s;
}
.rs-row:hover { background: rgba(var(--v-theme-on-surface), 0.025); }

.rs-indent { padding-left: 32px; }
.rs-indent .rs-lbl { color: rgba(var(--v-theme-on-surface), 0.5); font-size: 12px; }

.rs-sep {
  height: 1px; background: rgba(var(--v-theme-on-surface), 0.1);
  margin: 4px 18px; padding: 0; border: none;
}
.rs-sep:hover { background: rgba(var(--v-theme-on-surface), 0.1); }

.rs-total-row { background: rgba(var(--v-theme-on-surface), 0.03); }
.rs-grand-total {
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-top: 2px solid rgba(var(--v-theme-on-surface), 0.12) !important;
}

.rs-lbl { font-size: 12.5px; color: rgba(var(--v-theme-on-surface), 0.75); flex: 1; }
.rs-lbl-bold { font-weight: 700; color: rgb(var(--v-theme-on-surface)); }

.rs-val {
  font-variant-numeric: tabular-nums; font-size: 13px;
  font-weight: 600; text-align: right; white-space: nowrap;
  color: rgba(var(--v-theme-on-surface), 0.7);
}
.rs-val-big   { font-size: 15px; font-weight: 800; }
.rs-val-grand { font-size: 17px; font-weight: 800; }

.rs-pos    { color: var(--success); }
.rs-neg    { color: var(--error); }
.rs-green  { color: var(--success); }
.rs-purple { color: var(--indigo); }
.rs-pink   { color: #db2777; }

/* ── Categoría chips ───────────────────────────────── */
.cat-chip {
  font-size: 10px; font-weight: 700; padding: 3px 10px;
  border-radius: 20px; cursor: pointer;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.15);
  color: rgba(var(--v-theme-on-surface), 0.6);
  background: rgba(var(--v-theme-on-surface), 0.04);
  transition: all 0.15s; white-space: nowrap;
}
.cat-chip:hover { border-color: var(--indigo); color: var(--indigo); }
.cat-chip--active { background: rgba(139,92,246,0.12); border-color: var(--indigo); color: var(--indigo); }

/* ── Artículos tabla ───────────────────────────────── */
.art-tabla-wrap { overflow-x: auto; }
.art-tabla { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.art-tabla thead th {
  padding: 10px 12px; text-align: left;
  font-size: 9.5px; font-weight: 700; letter-spacing: 0.5px;
  text-transform: uppercase; color: rgba(var(--v-theme-on-surface), 0.5);
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  white-space: nowrap;
}
.art-tabla td { padding: 9px 12px; }

.tr-cat-header { background: rgba(139,92,246,0.04); border-top: 1px solid rgba(139,92,246,0.15); }
.tr-cat-header td { padding: 7px 12px; }
.cat-badge {
  font-size: 9.5px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.6px; color: var(--indigo);
  background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2);
  padding: 2px 10px; border-radius: 20px;
}

.tr-item { border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); }
.tr-item:hover { background: rgba(var(--v-theme-on-surface), 0.02); }

.tr-subtotal {
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-bottom: 2px solid rgba(var(--v-theme-on-surface), 0.08);
}
.tr-subtotal td { padding: 8px 12px; }
.subtotal-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: rgba(var(--v-theme-on-surface), 0.5); }
.subtotal-val { font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; color: rgba(var(--v-theme-on-surface), 0.7); }

.tr-total {
  background: rgba(var(--v-theme-on-surface), 0.07);
  border-top: 2px solid rgba(var(--v-theme-on-surface), 0.15);
}
.tr-total td { padding: 10px 12px; }
.total-lbl { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.7); }
.total-val { font-size: 13px; font-weight: 800; font-variant-numeric: tabular-nums; }

.col-right    { text-align: right !important; }
.td-nombre    { font-weight: 600; color: rgb(var(--v-theme-on-surface)); }
.td-sku       { font-variant-numeric: tabular-nums; font-size: 11.5px; color: rgba(var(--v-theme-on-surface), 0.5); }
.td-num       { font-weight: 700; color: rgb(var(--v-theme-on-surface)); }
.td-monto     { font-variant-numeric: tabular-nums; font-weight: 500; }
.variante-tag { font-size: 10px; font-weight: 600; color: var(--indigo); background: rgba(139,92,246,0.1); padding: 1px 6px; border-radius: 4px; margin-left: 6px; vertical-align: middle; }

.txt-green  { color: var(--success); }
.txt-orange { color: var(--gold); }
.txt-dim    { color: rgba(var(--v-theme-on-surface), 0.4); }

.tr-cat-orange { background: rgba(245,158,11,0.04); border-top: 1px solid rgba(245,158,11,0.15); }
.cat-badge-orange {
  color: var(--gold);
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.25);
}

.tr-cat-teal { background: rgba(20,184,166,0.04); border-top: 1px solid rgba(20,184,166,0.2); }
.cat-badge-teal {
  color: #0d9488;
  background: rgba(20,184,166,0.1);
  border: 1px solid rgba(20,184,166,0.25);
}

/* ── Consumo ───────────────────────────────────────── */
.consumo-empty {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 40px 24px; text-align: center;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 14px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  font-size: 13px;
}
.consumo-empty-hint { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.25); }
.consumo-empty-hint code { background: rgba(var(--v-theme-on-surface), 0.06); padding: 1px 5px; border-radius: 3px; font-size: 10.5px; }

.tr-consumo { vertical-align: middle; }
.td-idx { font-size: 11px; font-weight: 700; color: rgba(var(--v-theme-on-surface), 0.3); text-align: center; }
.td-und { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5); font-weight: 600; }
.consumo-total-val { font-variant-numeric: tabular-nums; font-size: 15px; font-weight: 800; color: var(--error); }

.td-recetas { padding: 8px 12px !important; }
.recetas-wrap { display: flex; flex-wrap: wrap; gap: 4px; }
.receta-chip {
  display: inline-flex; align-items: center; gap: 5px;
  background: rgba(139,92,246,0.07); border: 1px solid rgba(139,92,246,0.15);
  border-radius: 5px; padding: 2px 7px; font-size: 10.5px; cursor: default;
}
.receta-sku { font-variant-numeric: tabular-nums; font-weight: 700; color: var(--indigo); }
.receta-subtotal { color: rgba(var(--v-theme-on-surface), 0.55); font-weight: 500; }

/* ── Misc ──────────────────────────────────────────── */
.enrich-badge {
  display: flex; align-items: center; gap: 6px; margin-left: auto;
  font-size: 11px; color: var(--indigo); font-weight: 600;
}

.col-center { text-align: center !important; }

/* ── Botón ver recetas ─────────────────────────────── */
.btn-ver-recetas {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 20px; cursor: pointer;
  background: rgba(139,92,246,0.08);
  border: 1px solid rgba(139,92,246,0.2);
  color: var(--indigo); font-size: 11px; font-weight: 600;
  transition: all 0.15s; outline: none;
}
.btn-ver-recetas:hover {
  background: rgba(139,92,246,0.16);
  border-color: rgba(139,92,246,0.4);
}

/* ── Popup recetas ─────────────────────────────────── */
.rcpopup { border-radius: 16px !important; overflow: hidden; }

.rcpopup-header {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, var(--indigo), var(--indigo));
}
.rcpopup-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: rgba(255,255,255,0.15);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.rcpopup-title-wrap { flex: 1; min-width: 0; }
.rcpopup-title { font-size: 15px; font-weight: 800; color: white; }
.rcpopup-sub   { font-size: 11px; color: rgba(255,255,255,0.65); margin-top: 2px; }

.rcpopup-total-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px;
  background: rgba(139,92,246,0.06);
  border-bottom: 1px solid rgba(139,92,246,0.12);
}
.rcpopup-total-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface),0.5); }
.rcpopup-total-val { font-size: 18px; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--indigo); }

.rcpopup-body { padding: 0; }

.rcpopup-receta-nombre { font-weight: 700; font-size: 12.5px; color: rgb(var(--v-theme-on-surface)); }
.rcpopup-receta-sku    { font-variant-numeric: tabular-nums; font-size: 10px; color: rgba(var(--v-theme-on-surface),0.4); margin-top: 2px; }

/* ── Columna inventario en Modificadores ───────────── */
.mod-inv-cell {
  display: flex; align-items: center; justify-content: center; gap: 5px;
}
.mod-inv-badge {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 9.5px; font-weight: 700; padding: 2px 7px;
  border-radius: 20px;
}
.mod-inv-ok   { background: rgba(16,185,129,0.1);  color: var(--success); border: 1px solid rgba(16,185,129,0.2); }
.mod-inv-warn { background: rgba(245,158,11,0.1);  color: var(--gold); border: 1px solid rgba(245,158,11,0.2); }

.btn-config-mod {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 6px; cursor: pointer;
  background: rgba(var(--v-theme-on-surface),0.06);
  border: 1px solid rgba(var(--v-theme-on-surface),0.12);
  color: rgba(var(--v-theme-on-surface),0.6);
  transition: all 0.15s; outline: none;
}
.btn-config-mod:hover {
  background: rgba(245,158,11,0.12);
  border-color: rgba(245,158,11,0.3);
  color: var(--gold);
}

/* ── Config dialog ─────────────────────────────────── */
.config-empty {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 28px 24px; color: rgba(var(--v-theme-on-surface),0.35); font-size: 12px;
}

.config-new-row {
  border-top: 1px solid rgba(var(--v-theme-on-surface),0.08);
  padding: 14px 16px;
  background: rgba(var(--v-theme-on-surface),0.02);
}
.config-new-title {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface),0.5);
  margin-bottom: 10px; display: flex; align-items: center;
}
.config-new-fields {
  display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
}
.config-field-art  { flex: 1; min-width: 200px; }
.config-field-cant { width: 110px; flex-shrink: 0; }
.config-tipo-toggle { flex-shrink: 0; }

.tipo-badge {
  font-size: 9.5px; font-weight: 800; padding: 2px 8px;
  border-radius: 20px; letter-spacing: 0.3px;
}
.tipo-suma  { background: rgba(16,185,129,0.1);  color: var(--success); border: 1px solid rgba(16,185,129,0.2); }
.tipo-resta { background: rgba(239,68,68,0.1);   color: var(--error); border: 1px solid rgba(239,68,68,0.2); }

/* ── Configuración de importación ──────────────────── */
.imp-cfg-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 16px;
  margin-bottom: 20px;
  overflow: hidden;
}

.imp-cfg-header {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 18px;
  background: linear-gradient(135deg, rgba(6,182,212,0.08), rgba(6,182,212,0.03));
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.imp-cfg-icon {
  width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
  background: linear-gradient(135deg, var(--indigo), var(--indigo));
  display: flex; align-items: center; justify-content: center;
}

.imp-cfg-title {
  font-size: 11px; font-weight: 800; letter-spacing: 0.6px;
  color: var(--indigo); text-transform: uppercase;
}

.imp-cfg-sub {
  font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.35);
  margin-left: auto;
}

.imp-cfg-fields {
  display: grid;
  grid-template-columns: auto auto 1fr 1fr 1fr;
  gap: 14px;
  padding: 14px 18px;
  align-items: end;
}

@media (max-width: 1100px) {
  .imp-cfg-fields { grid-template-columns: 1fr 1fr 1fr; }
}
@media (max-width: 700px) {
  .imp-cfg-fields { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 480px) {
  .imp-cfg-fields { grid-template-columns: 1fr; }
}

.imp-cfg-field { display: flex; flex-direction: column; gap: 5px; }
.imp-cfg-field--wide { /* already wide via grid */ }
.imp-cfg-input-wrap { display: flex; align-items: center; gap: 6px; }
.cfg-ok-icon { flex-shrink: 0; animation: cfg-ok-pop 0.25s ease; }
@keyframes cfg-ok-pop {
  from { transform: scale(0.5); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}

.imp-cfg-label {
  font-size: 9.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.45);
  display: flex; align-items: center;
}

.imp-cfg-date {
  height: 40px; border-radius: 8px; padding: 0 10px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.2);
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  font-size: 13px; font-weight: 600; outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
}
.imp-cfg-date:focus { border-color: var(--indigo); box-shadow: 0 0 0 2px rgba(6,182,212,0.15); }

.imp-cfg-empresa {
  height: 40px; border-radius: 8px; padding: 0 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  background: rgba(var(--v-theme-on-surface), 0.03);
  display: flex; align-items: center;
  min-width: 80px;
}

.imp-cfg-empresa-code {
  font-variant-numeric: tabular-nums;
  font-size: 16px; font-weight: 800;
  color: var(--indigo);
}

.imp-cfg-select { font-size: 13px; }
/* ── Barra de acciones ─────────────────────────────── */
.iv-action-bar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; flex-wrap: wrap;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(6,182,212,0.25);
  border-radius: 12px;
  padding: 10px 16px;
  margin-bottom: 16px;
}
.iv-action-bar-left {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.45);
}
.iv-action-bar-right { display: flex; align-items: center; gap: 8px; }
.iv-action-ok {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 600; color: var(--success);
}
.iv-action-hint { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.45); }

/* ── Botón guardar resumen ─────────────────────────── */
.rs-save-row {
  display: flex; align-items: center; gap: 14px;
  padding: 20px 0 4px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  margin-top: 16px;
}
.rs-save-hint {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; color: var(--gold);
}
.rs-save-ok {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 600; color: var(--success);
}

/* ── Dialog guardar resumen ────────────────────────── */
.rs-dlg-info {
  font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.6);
  margin-bottom: 14px; display: flex; align-items: center;
}
.rs-dlg-cta-badge {
  font-variant-numeric: tabular-nums; font-size: 11px; font-weight: 800;
  background: rgba(6,182,212,0.1); color: var(--indigo);
  border: 1px solid rgba(6,182,212,0.25);
  border-radius: 4px; padding: 2px 6px;
}
.rs-dlg-nocta { font-size: 10px; color: var(--gold); display: flex; align-items: center; gap: 3px; }
.rs-dlg-estado {
  font-size: 9px; font-weight: 800; letter-spacing: 0.3px;
  background: rgba(245,158,11,0.1); color: var(--gold);
  border: 1px solid rgba(245,158,11,0.2); border-radius: 4px; padding: 2px 6px;
}
.rs-dlg-omitido {
  font-size: 9px; font-weight: 700; color: rgba(var(--v-theme-on-surface), 0.3);
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-radius: 4px; padding: 2px 6px;
}
.rs-dlg-row-warn { opacity: 0.5; }
.rs-dlg-warn-note {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; color: var(--gold);
  margin-top: 12px; padding: 8px 12px;
  background: rgba(245,158,11,0.06); border-radius: 8px;
}
.rs-dlg-actions {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 14px 16px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.rs-dlg-loading {
  display: flex; align-items: center; justify-content: center; gap: 14px;
  padding: 48px 24px; font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5);
}
/* ── Conflict banner ── */
.rs-conflict-banner {
  background: rgba(245, 158, 11, 0.10);
  border: 2px solid rgba(245, 158, 11, 0.50);
  border-radius: 10px;
  padding: 20px 22px;
}
.rs-conflict-banner-top {
  display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
}
.rs-conflict-banner-title {
  font-size: 15px; font-weight: 700; color: var(--gold);
}
.rs-conflict-banner-msg {
  font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.85); line-height: 1.7;
}
.rs-dlg-success {
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  padding: 32px 24px; text-align: center;
}
.rs-dlg-success-title { font-size: 16px; font-weight: 700; color: var(--success); }
.rs-dlg-success-sub   { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.5); margin-top: 4px; }
.rs-dlg-success-codigos {
  display: flex; flex-direction: column; gap: 4px; width: 100%;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 10px; padding: 12px 16px;
}
.rs-dlg-codigo-row {
  display: flex; align-items: center; gap: 12px;
  font-size: 12px;
}
.rs-dlg-codigo {
  font-variant-numeric: tabular-nums; font-weight: 700; font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.4);
}
.rs-dlg-ccta {
  font-variant-numeric: tabular-nums; font-weight: 800;
  color: var(--indigo); background: rgba(6,182,212,0.08);
  border-radius: 4px; padding: 1px 5px; font-size: 11px;
}
.rs-dlg-cval { margin-left: auto; font-weight: 700; color: var(--success); font-size: 12px; }
.txt-red { color: var(--error); }

/* ── Editor Config General ─────────────────────────── */
.cfg-editor-row {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
.cfg-editor-row:last-child { border-bottom: none; }
.cfg-editor-lbl {
  font-size: 12px; font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.65);
  min-width: 190px; flex-shrink: 0;
}
.cfg-editor-select { flex: 1; }

.imp-cfg-code-chip {
  font-variant-numeric: tabular-nums;
  font-size: 10px; font-weight: 700;
  background: rgba(245,158,11,0.1); color: var(--gold);
  border: 1px solid rgba(245,158,11,0.25);
  border-radius: 4px; padding: 1px 5px; margin-right: 4px;
}
</style>
