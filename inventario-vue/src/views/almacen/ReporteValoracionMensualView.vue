<template>
  <MainLayout>
    <div class="vm-wrap">

      <PageHeader
        title="Valoración Mensual de Inventario"
        description="Consumo real de materia prima por juego de inventarios (Inv. Inicial + Compras − Inv. Final)"
        :crumbs="crumbs"
      >
        <template #actions>
          <v-btn-toggle v-model="modo" mandatory density="compact" variant="outlined" divided>
            <v-btn value="mes"   size="small">Mes</v-btn>
            <v-btn value="rango" size="small">Corte</v-btn>
          </v-btn-toggle>

          <input v-if="modo === 'mes'" type="month" v-model="mesSel" class="mes-input" />
          <template v-else>
            <input type="date" v-model="fDesde" class="mes-input" title="Desde" />
            <span class="rango-sep">→</span>
            <input type="date" v-model="fHasta" class="mes-input" title="Hasta (día del corte)" />
          </template>

          <v-btn color="primary" variant="flat" prepend-icon="mdi-refresh" :loading="loading" @click="cargar">
            Actualizar
          </v-btn>
        </template>
      </PageHeader>

      <!-- ERROR -->
      <div v-if="errorMsg" class="vm-warning">
        <v-icon size="20" color="error">mdi-alert-circle-outline</v-icon>
        <span>{{ errorMsg }}</span>
      </div>

      <!-- LOADING -->
      <div v-if="loading" class="vm-loading">
        <v-progress-circular indeterminate color="primary" size="48" />
        <p>Valorizando inventario de todos los centros de costo...</p>
      </div>

      <template v-else-if="data">

        <!-- PERÍODO CONSULTADO -->
        <div class="vm-periodo">
          <v-icon size="15">mdi-calendar-range</v-icon>
          <span>
            Período <b>{{ fmtFecha(data.periodo.desde) }} → {{ fmtFecha(data.periodo.hasta) }}</b>
            ({{ diasPeriodo }} {{ diasPeriodo === 1 ? 'día' : 'días' }})
          </span>
          <span class="vm-periodo-sep">·</span>
          <span>
            Toma de cierre esperada entre
            <b>{{ fmtFecha(data.ventanas.final.ini) }}</b> y <b>{{ fmtFecha(data.ventanas.final.fin) }}</b>
          </span>
        </div>

        <!-- AVISO: cuenta de materia prima no configurada -->
        <div v-if="!data.ctaMateriaPrima" class="vm-warning">
          <v-icon size="20" color="error">mdi-alert-circle-outline</v-icon>
          <span>No hay configurada la <b>Cuenta Contable Materia Prima (Entrada de Almacén)</b> en Configuración General. Las compras del período se calcularán en $0 hasta que la configures.</span>
        </div>

        <!-- AVISO: centros de costo sin toma física en la ventana de cierre -->
        <div v-if="data.avisos.sinTomaInicial.length || data.avisos.sinTomaFinal.length" class="vm-warning">
          <v-icon size="20" color="error">mdi-clipboard-alert-outline</v-icon>
          <div>
            <div class="vm-warning-title">Faltan tomas físicas — el inventario de estos centros va en $0</div>
            <div v-if="data.avisos.sinTomaInicial.length" class="vm-warning-line">
              <b>Inventario inicial</b> (toma esperada entre {{ fmtFecha(data.ventanas.inicial.ini) }} y {{ fmtFecha(data.ventanas.inicial.fin) }}):
              {{ data.avisos.sinTomaInicial.join(' · ') }}
            </div>
            <div v-if="data.avisos.sinTomaFinal.length" class="vm-warning-line">
              <b>Inventario final</b> (toma esperada entre {{ fmtFecha(data.ventanas.final.ini) }} y {{ fmtFecha(data.ventanas.final.fin) }}):
              {{ data.avisos.sinTomaFinal.join(' · ') }}
            </div>
            <div v-if="!data.kpis.inventarioFinalEsEstimado" class="vm-warning-note">
              El consumo real de estos centros queda distorsionado hasta que registres la toma física.
              Como el servicio es nocturno, la toma del cierre puede hacerse la mañana del día siguiente.
            </div>
            <div v-else class="vm-warning-note">
              Como ningún centro tiene toma física de cierre todavía, el <b>Inventario Final</b> y el
              <b>Consumo Real MP</b> se están calculando con el <b>valor estimado</b> configurado en
              Configuración General · Almacén ({{ fmt(data.kpis.valorEstimadoInventarioFinal) }}) en vez de $0.
              En cuanto registres la toma física de cierre, el sistema usará el valor real.
            </div>
          </div>
        </div>

        <!-- AVISO: cortes calculados en vivo (sin costo congelado) -->
        <div v-if="data.avisos.noCongelados.length" class="vm-note-info">
          <v-icon size="18" color="warning">mdi-lock-open-variant-outline</v-icon>
          <span>
            Estos centros usan tomas físicas anteriores al congelado de costos, así que su valor todavía
            cambia si editas los precios: <b>{{ data.avisos.noCongelados.join(' · ') }}</b>.
            Las tomas nuevas quedan congeladas automáticamente.
          </span>
        </div>

        <!-- KPI CARDS -->
        <div class="vm-kpis">
          <div class="vm-kpi">
            <div class="vm-kpi-top">
              <div class="vm-kpi-icon" style="background:var(--indigo-wash)">
                <v-icon size="20" color="primary">mdi-archive-outline</v-icon>
              </div>
              <button class="vm-kpi-detail-btn" @click="showDetalleInicial = true">
                <v-icon size="13">mdi-eye-outline</v-icon><span>Detalle</span>
              </button>
            </div>
            <div class="vm-kpi-lbl">Inventario Inicial</div>
            <div class="vm-kpi-val" style="color:var(--indigo)">{{ fmt(data.kpis.valorInicial) }}</div>
            <div class="vm-kpi-sub" :class="{ 'vm-kpi-sub-warn': data.kpis.ccSinTomaInicial > 0 }">
              {{ coberturaInicial }}
            </div>
          </div>
          <div class="vm-kpi">
            <div class="vm-kpi-top">
              <div class="vm-kpi-icon" style="background:var(--indigo-wash)">
                <v-icon size="20" color="primary">mdi-truck-fast-outline</v-icon>
              </div>
              <button class="vm-kpi-detail-btn" @click="showDetalleCompras = true">
                <v-icon size="13">mdi-eye-outline</v-icon><span>Detalle</span>
              </button>
            </div>
            <div class="vm-kpi-lbl">Compras del Mes</div>
            <div class="vm-kpi-val" style="color:var(--indigo)">{{ fmt(data.kpis.compras) }}</div>
            <div class="vm-kpi-sub">cuenta materia prima · {{ data.gastosMP.length }} gastos</div>
          </div>
          <div class="vm-kpi">
            <div class="vm-kpi-top">
              <div class="vm-kpi-icon" style="background:var(--indigo-wash)">
                <v-icon size="20" color="primary">mdi-archive-check-outline</v-icon>
              </div>
              <button class="vm-kpi-detail-btn" @click="showDetalleFinal = true">
                <v-icon size="13">mdi-eye-outline</v-icon><span>Detalle</span>
              </button>
            </div>
            <div class="vm-kpi-lbl">
              Inventario Final
              <span v-if="data.kpis.inventarioFinalEsEstimado" class="vm-kpi-badge-estimado">ESTIMADO</span>
            </div>
            <div class="vm-kpi-val" style="color:var(--indigo)">{{ fmt(data.kpis.valorFinal) }}</div>
            <div class="vm-kpi-sub" :class="{ 'vm-kpi-sub-warn': data.kpis.ccSinTomaFinal > 0 && !data.kpis.inventarioFinalEsEstimado }">
              {{ data.kpis.inventarioFinalEsEstimado ? 'valor estimado — sin toma física registrada' : coberturaFinal }}
            </div>
          </div>
          <div class="vm-kpi">
            <div class="vm-kpi-top">
              <div class="vm-kpi-icon" style="background:var(--gold-wash)">
                <v-icon size="20" color="warning">mdi-fire</v-icon>
              </div>
            </div>
            <div class="vm-kpi-lbl">Consumo Real MP</div>
            <div class="vm-kpi-val" style="color:var(--gold)">{{ fmt(data.kpis.consumoReal) }}</div>
            <div class="vm-kpi-sub">inicial + compras − final</div>
          </div>
          <div class="vm-kpi">
            <div class="vm-kpi-top">
              <div class="vm-kpi-icon" :style="{ background: data.kpis.itemsSinCosto > 0 ? 'color-mix(in srgb, var(--error) 10%, transparent)' : 'color-mix(in srgb, var(--success) 10%, transparent)' }">
                <v-icon size="20" :color="data.kpis.itemsSinCosto > 0 ? 'error' : 'success'">mdi-alert-outline</v-icon>
              </div>
            </div>
            <div class="vm-kpi-lbl">Items Sin Costo</div>
            <div class="vm-kpi-val" :style="{ color: data.kpis.itemsSinCosto > 0 ? 'var(--error)' : 'var(--success)' }">{{ data.kpis.itemsSinCosto }}</div>
            <div class="vm-kpi-sub">precio_costo = 0</div>
          </div>
        </div>

        <!-- FILA 1: Fórmula visual -->
        <!-- Fórmula visual: Inv. Inicial + Compras − Inv. Final = Consumo Real -->
        <div class="vm-formula">
          <div class="vm-formula-item">
            <div class="vm-formula-bar" style="background:var(--indigo)">
              <span class="vm-formula-val">{{ fmt(data.kpis.valorInicial) }}</span>
            </div>
            <div class="vm-formula-lbl">Inv. Inicial</div>
          </div>
          <div class="vm-formula-op">+</div>
          <div class="vm-formula-item">
            <div class="vm-formula-bar" style="background:var(--indigo)">
              <span class="vm-formula-val">{{ fmt(data.kpis.compras) }}</span>
            </div>
            <div class="vm-formula-lbl">Compras</div>
          </div>
          <div class="vm-formula-op">−</div>
          <div class="vm-formula-item">
            <div class="vm-formula-bar" style="background:var(--indigo)">
              <span class="vm-formula-val">{{ fmt(data.kpis.valorFinal) }}</span>
            </div>
            <div class="vm-formula-lbl">Inv. Final</div>
          </div>
          <div class="vm-formula-op">=</div>
          <div class="vm-formula-item vm-formula-result">
            <div class="vm-formula-bar" style="background:var(--gold)">
              <span class="vm-formula-val">{{ fmt(data.kpis.consumoReal) }}</span>
            </div>
            <div class="vm-formula-lbl">Consumo Real</div>
          </div>
        </div>

        <!-- DIALOGS DE DETALLE -->
        <v-dialog v-model="showDetalleInicial" max-width="700" scrollable>
          <v-card rounded="lg">
            <v-card-title class="d-flex align-center ga-2 pa-4" style="background:rgba(139,92,246,0.08)">
              <v-icon color="primary">mdi-archive-outline</v-icon>
              Detalle — Inventario Inicial
            </v-card-title>
            <v-card-text class="pa-4">
              <p class="text-body-2 mb-3" style="color:rgba(var(--v-theme-on-surface),0.6)">
                Es el cierre del mes anterior: la <b>toma física</b> registrada entre el
                <b>{{ fmtFecha(data?.ventanas?.inicial?.ini) }}</b> y el <b>{{ fmtFecha(data?.ventanas?.inicial?.fin) }}</b>.
                Los centros sin toma en esa ventana van en <b>$0</b>.
              </p>
              <table class="vm-table" v-if="data">
                <thead>
                  <tr>
                    <th class="th-expand"></th>
                    <th>CENTRO DE COSTO</th>
                    <th>TOMA</th>
                    <th class="tr">VALOR INICIAL</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="c in data.centros" :key="'di-' + c.ccosto">
                    <tr class="vm-tr vm-tr-expandible" @click="toggleExpand('inicial', c.ccosto)">
                      <td class="td-expand">
                        <v-icon v-if="centroTieneDetalle('inicial', c.ccosto)" size="18">
                          {{ expandido('inicial', c.ccosto) ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
                        </v-icon>
                      </td>
                      <td class="font-weight-medium">
                        {{ c.nombre }}
                        <span v-if="c.esBodegaMaestra" class="badge-info">BODEGA MAESTRA</span>
                      </td>
                      <td>
                        <span v-if="c.tomaInicial" class="text-dim">{{ fmtFecha(c.tomaInicial) }}</span>
                        <span v-else class="badge-missing">SIN TOMA</span>
                      </td>
                      <td class="tr" :class="{ 'td-missing': !c.tomaInicial }">{{ fmt(c.valorInicial) }}</td>
                    </tr>
                    <tr v-if="expandido('inicial', c.ccosto)" class="vm-tr-detalle">
                      <td colspan="4">
                        <table class="vm-table vm-table-nested">
                          <thead>
                            <tr>
                              <th>PRODUCTO</th>
                              <th class="tr">STOCK</th>
                              <th class="tr">COSTO UNIT.</th>
                              <th class="tr">VALOR</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="p in productosDeCentro('inicial', c.ccosto)" :key="p.codigo" class="vm-tr">
                              <td>{{ p.nombre }} <span class="text-dim">({{ p.codigo }})</span></td>
                              <td class="tr">{{ numFmt(p.stock) }} {{ p.und }}</td>
                              <td class="tr">{{ fmt(p.precio_costo) }}</td>
                              <td class="tr font-weight-medium">{{ fmt(p.valor) }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </template>
                </tbody>
                <tfoot>
                  <tr class="vm-tr-total">
                    <td></td>
                    <td class="font-weight-bold">TOTAL</td>
                    <td></td>
                    <td class="tr font-weight-bold" style="color:var(--indigo)">{{ fmt(data.kpis.valorInicial) }}</td>
                  </tr>
                </tfoot>
              </table>
            </v-card-text>
            <v-card-actions class="pa-4 pt-0">
              <v-spacer />
              <v-btn variant="flat" color="primary" @click="showDetalleInicial = false">Cerrar</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-dialog v-model="showDetalleFinal" max-width="700" scrollable>
          <v-card rounded="lg">
            <v-card-title class="d-flex align-center ga-2 pa-4" style="background:rgba(139,92,246,0.08)">
              <v-icon color="primary">mdi-archive-check-outline</v-icon>
              Detalle — Inventario Final
            </v-card-title>
            <v-card-text class="pa-4">
              <p class="text-body-2 mb-3" style="color:rgba(var(--v-theme-on-surface),0.6)">
                Es el cierre del mes: la <b>toma física</b> registrada entre el
                <b>{{ fmtFecha(data?.ventanas?.final?.ini) }}</b> y el <b>{{ fmtFecha(data?.ventanas?.final?.fin) }}</b>.
                Como el servicio es nocturno, la toma puede hacerse la mañana siguiente al cierre.
                Los centros sin toma en esa ventana van en <b>$0</b>.
              </p>
              <table class="vm-table" v-if="data">
                <thead>
                  <tr>
                    <th class="th-expand"></th>
                    <th>CENTRO DE COSTO</th>
                    <th>TOMA</th>
                    <th class="tr">VALOR FINAL</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="c in data.centros" :key="'df-' + c.ccosto">
                    <tr class="vm-tr vm-tr-expandible" @click="toggleExpand('final', c.ccosto)">
                      <td class="td-expand">
                        <v-icon v-if="centroTieneDetalle('final', c.ccosto)" size="18">
                          {{ expandido('final', c.ccosto) ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
                        </v-icon>
                      </td>
                      <td class="font-weight-medium">
                        {{ c.nombre }}
                        <span v-if="c.esBodegaMaestra" class="badge-info">BODEGA MAESTRA</span>
                      </td>
                      <td>
                        <span v-if="c.tomaFinal" class="text-dim">{{ fmtFecha(c.tomaFinal) }}</span>
                        <span v-else class="badge-missing">SIN TOMA</span>
                      </td>
                      <td class="tr" :class="{ 'td-missing': !c.tomaFinal }">{{ fmt(c.valorFinal) }}</td>
                    </tr>
                    <tr v-if="expandido('final', c.ccosto)" class="vm-tr-detalle">
                      <td colspan="4">
                        <table class="vm-table vm-table-nested">
                          <thead>
                            <tr>
                              <th>PRODUCTO</th>
                              <th class="tr">STOCK</th>
                              <th class="tr">COSTO UNIT.</th>
                              <th class="tr">VALOR</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="p in productosDeCentro('final', c.ccosto)" :key="p.codigo" class="vm-tr">
                              <td>{{ p.nombre }} <span class="text-dim">({{ p.codigo }})</span></td>
                              <td class="tr">{{ numFmt(p.stock) }} {{ p.und }}</td>
                              <td class="tr">{{ fmt(p.precio_costo) }}</td>
                              <td class="tr font-weight-medium">{{ fmt(p.valor) }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </template>
                </tbody>
                <tfoot>
                  <tr class="vm-tr-total">
                    <td></td>
                    <td class="font-weight-bold">TOTAL</td>
                    <td></td>
                    <td class="tr font-weight-bold" style="color:var(--indigo)">{{ fmt(data.kpis.valorFinal) }}</td>
                  </tr>
                </tfoot>
              </table>
            </v-card-text>
            <v-card-actions class="pa-4 pt-0">
              <v-spacer />
              <v-btn variant="flat" color="primary" @click="showDetalleFinal = false">Cerrar</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-dialog v-model="showDetalleCompras" max-width="850" scrollable>
          <v-card rounded="lg">
            <v-card-title class="d-flex align-center ga-2 pa-4" style="background:rgba(14,165,233,0.08)">
              <v-icon color="primary">mdi-truck-fast-outline</v-icon>
              Detalle — Compras del Mes
            </v-card-title>
            <v-card-text class="pa-4">
              <p class="text-body-2 mb-3" style="color:rgba(var(--v-theme-on-surface),0.6)">
                Suma de todos los gastos registrados en la <b>cuenta contable de materia prima</b> durante el período.
                Incluye {{ data?.gastosMP?.length || 0 }} gasto(s).
              </p>
              <div class="vm-table-wrap">
                <table class="vm-table" v-if="data?.gastosMP?.length">
                  <thead>
                    <tr>
                      <th>FECHA</th>
                      <th>CÓDIGO</th>
                      <th>PROVEEDOR</th>
                      <th>CONCEPTO</th>
                      <th>FACTURA</th>
                      <th class="tr">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="g in data.gastosMP" :key="'dc-' + g.codigo" class="vm-tr">
                      <td>{{ g.fecha?.slice(0, 10) }}</td>
                      <td class="text-dim">{{ g.codigo }}</td>
                      <td>{{ g.proveedor_nombre }}</td>
                      <td class="text-dim">{{ g.concepto }}</td>
                      <td class="text-dim">{{ g.factura || '—' }}</td>
                      <td class="tr">{{ fmt(g.total) }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="vm-tr-total">
                      <td colspan="5" class="font-weight-bold">TOTAL COMPRAS MP</td>
                      <td class="tr font-weight-bold" style="color:var(--indigo)">{{ fmt(data.kpis.compras) }}</td>
                    </tr>
                  </tfoot>
                </table>
                <p v-else class="text-body-2" style="color:rgba(var(--v-theme-on-surface),0.45)">No hay gastos registrados en esta cuenta para el período.</p>
              </div>
            </v-card-text>
            <v-card-actions class="pa-4 pt-0">
              <v-spacer />
              <v-btn variant="flat" color="primary" @click="showDetalleCompras = false">Cerrar</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- FILA 2: Asignación de consumo MP por centro de costo -->
        <div class="vm-card vm-card-full">
          <div class="vm-card-header">
            <v-icon size="18" color="primary">mdi-store-outline</v-icon>
            <span class="vm-card-title">Consumo de Materia Prima por Centro de Costo</span>
            <span class="vm-card-badge">asignado proporcional a % de ventas</span>
          </div>
          <p class="vm-card-note">
            El consumo real total (<b>{{ fmt(data.kpis.consumoReal) }}</b>) se distribuye entre los centros de costo
            que tuvieron ventas en el período, en proporción a su participación sobre el total de ventas netas
            (<b>{{ fmt(data.kpis.totalVentasBase) }}</b>). La bodega maestra y los centros sin ventas (p.ej. administración) no reciben asignación.
          </p>
          <div class="vm-table-wrap">
            <table class="vm-table">
              <thead>
                <tr>
                  <th>CENTRO DE COSTO</th>
                  <th class="tr">VENTAS NETAS</th>
                  <th class="tr">% VENTAS</th>
                  <th class="tr">CONSUMO MP ASIGNADO</th>
                  <th class="tr">FOOD COST %</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in data.centros" :key="c.ccosto" class="vm-tr">
                  <td class="font-weight-medium">
                    {{ c.nombre }}
                    <span v-if="c.esBodegaMaestra" class="badge-info">BODEGA MAESTRA</span>
                    <span v-else-if="!c.incluidoEnAsignacion" class="badge-dim-tag">SIN VENTAS</span>
                  </td>
                  <td class="tr">{{ fmt(c.ventas) }}</td>
                  <td class="tr">{{ c.incluidoEnAsignacion ? c.pctVentas.toFixed(1) + '%' : '—' }}</td>
                  <td class="tr font-weight-bold" style="color:var(--gold)">{{ c.incluidoEnAsignacion ? fmt(c.consumoMP) : '—' }}</td>
                  <td class="tr font-weight-bold" :style="{ color: foodCostColor(c.foodCostPct) }">
                    {{ c.foodCostPct === null ? '—' : c.foodCostPct.toFixed(1) + '%' }}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="vm-tr-total">
                  <td class="font-weight-bold">TOTAL ASIGNADO</td>
                  <td class="tr font-weight-bold">{{ fmt(data.kpis.totalVentasBase) }}</td>
                  <td class="tr font-weight-bold">100%</td>
                  <td class="tr font-weight-bold" style="color:var(--gold)">{{ fmt(data.kpis.consumoReal) }}</td>
                  <td class="tr"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- FILA 3: Valorización de inventario por CC (toma física) -->
        <div class="vm-card vm-card-full">
          <div class="vm-card-header">
            <v-icon size="18" color="primary">mdi-clipboard-check-outline</v-icon>
            <span class="vm-card-title">Valorización de Toma Física por Centro de Costo / Bodega</span>
          </div>
          <p class="vm-card-note">
            Cada valor proviene de una <b>toma física real</b>. Si el centro no registró toma en la ventana de
            cierre, su valor es <b>$0</b> y aparece marcado como <b>SIN TOMA</b>.
            El candado indica que el costo quedó congelado y ya no cambia si editas precios.
          </p>
          <div class="vm-table-wrap">
            <table class="vm-table">
              <thead>
                <tr>
                  <th>CENTRO DE COSTO</th>
                  <th>TOMA INICIAL</th>
                  <th class="tr">VALOR INICIAL</th>
                  <th>TOMA FINAL</th>
                  <th class="tr">VALOR FINAL</th>
                  <th class="tr">DIFERENCIA</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in data.centros" :key="'inv-' + c.ccosto" class="vm-tr">
                  <td class="font-weight-medium">
                    {{ c.nombre }}
                    <span v-if="c.esBodegaMaestra" class="badge-info">BODEGA MAESTRA</span>
                  </td>
                  <td>
                    <template v-if="c.tomaInicial">
                      <span class="text-dim">{{ fmtFecha(c.tomaInicial) }}</span>
                      <v-icon v-if="c.congeladoInicial" size="13" class="ml-1" color="success" title="Costo congelado">mdi-lock</v-icon>
                      <v-icon v-else size="13" class="ml-1" color="warning" title="Calculado en vivo — cambia si editas precios">mdi-lock-open-variant-outline</v-icon>
                    </template>
                    <span v-else class="badge-missing">SIN TOMA</span>
                  </td>
                  <td class="tr" :class="{ 'td-missing': !c.tomaInicial }">{{ fmt(c.valorInicial) }}</td>
                  <td>
                    <template v-if="c.tomaFinal">
                      <span class="text-dim">{{ fmtFecha(c.tomaFinal) }}</span>
                      <v-icon v-if="c.congeladoFinal" size="13" class="ml-1" color="success" title="Costo congelado">mdi-lock</v-icon>
                      <v-icon v-else size="13" class="ml-1" color="warning" title="Calculado en vivo — cambia si editas precios">mdi-lock-open-variant-outline</v-icon>
                      <span v-if="c.conteoFinal" class="conteo-tag" :class="{ 'conteo-parcial': esParcial(c.conteoFinal) }"
                            :title="`${c.conteoFinal.contados} de ${c.conteoFinal.total} productos contados físicamente`">
                        {{ c.conteoFinal.contados }}/{{ c.conteoFinal.total }}
                      </span>
                    </template>
                    <span v-else class="badge-missing">SIN TOMA</span>
                  </td>
                  <td class="tr" :class="{ 'td-missing': !c.tomaFinal }">{{ fmt(c.valorFinal) }}</td>
                  <td class="tr font-weight-bold" :style="{ color: c.diferencia >= 0 ? 'var(--success)' : 'var(--error)' }">
                    {{ c.diferencia >= 0 ? '+' : '' }}{{ fmt(c.diferencia) }}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="vm-tr-total">
                  <td class="font-weight-bold">TOTAL EMPRESA</td>
                  <td></td>
                  <td class="tr font-weight-bold">{{ fmt(data.kpis.valorInicial) }}</td>
                  <td></td>
                  <td class="tr font-weight-bold">{{ fmt(data.kpis.valorFinal) }}</td>
                  <td class="tr font-weight-bold" :style="{ color: (data.kpis.valorFinal - data.kpis.valorInicial) >= 0 ? 'var(--success)' : 'var(--error)' }">
                    {{ (data.kpis.valorFinal - data.kpis.valorInicial) >= 0 ? '+' : '' }}{{ fmt(data.kpis.valorFinal - data.kpis.valorInicial) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- FILA 4: Detalle por producto (informativo) -->
        <div class="vm-card vm-card-full">
          <div class="vm-card-header">
            <v-icon size="18" color="warning">mdi-table</v-icon>
            <span class="vm-card-title">Valorización por Producto — Toma Física</span>
            <input v-model="filtroProducto" placeholder="Buscar producto..." class="vm-search" />
          </div>
          <div class="vm-table-wrap">
            <table class="vm-table">
              <thead>
                <tr>
                  <th>CÓDIGO</th>
                  <th>PRODUCTO</th>
                  <th>GRUPO</th>
                  <th class="tr">COSTO UNIT.</th>
                  <th colspan="2" class="th-section-inicial">INVENTARIO INICIAL</th>
                  <th colspan="2" class="th-section-final">INVENTARIO FINAL</th>
                </tr>
                <tr>
                  <th colspan="4"></th>
                  <th class="tr th-stock-inicial">STOCK</th>
                  <th class="tr th-valor-inicial">VALOR</th>
                  <th class="tr th-stock-final">STOCK</th>
                  <th class="tr th-valor-final">VALOR</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in productosFiltrados" :key="p.codigo" class="vm-tr">
                  <td class="text-dim">{{ p.codigo }}</td>
                  <td class="font-weight-medium">
                    {{ p.nombre }}
                    <span v-if="p.precio_costo <= 0" class="badge-warn">SIN COSTO</span>
                  </td>
                  <td class="text-dim">{{ p.grupo_nombre }}</td>
                  <td class="tr">{{ fmt(p.precio_costo) }}</td>
                  <td class="tr td-stock-inicial">{{ numFmt(p.stockInicial) }} {{ p.und }}</td>
                  <td class="tr td-valor-inicial">{{ fmt(p.valorInicial) }}</td>
                  <td class="tr td-stock-final">{{ numFmt(p.stockFinal) }} {{ p.und }}</td>
                  <td class="tr td-valor-final">{{ fmt(p.valorFinal) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- FILA 5: Gastos incluidos en la cuenta de materia prima -->
        <div class="vm-card vm-card-full">
          <div class="vm-card-header">
            <v-icon size="18" color="primary">mdi-receipt-text-outline</v-icon>
            <span class="vm-card-title">Gastos del Mes en Cuenta Materia Prima</span>
          </div>
          <div v-if="!data.gastosMP.length" class="vm-empty-inline">No hay gastos registrados en esta cuenta para el período seleccionado.</div>
          <div v-else class="vm-table-wrap">
            <table class="vm-table">
              <thead>
                <tr>
                  <th>FECHA</th>
                  <th>CÓDIGO</th>
                  <th>PROVEEDOR</th>
                  <th>CONCEPTO</th>
                  <th>FACTURA</th>
                  <th class="tr">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="g in data.gastosMP" :key="g.codigo" class="vm-tr">
                  <td>{{ g.fecha?.slice(0, 10) }}</td>
                  <td class="text-dim">{{ g.codigo }}</td>
                  <td>{{ g.proveedor_nombre }}</td>
                  <td class="text-dim">{{ g.concepto }}</td>
                  <td class="text-dim">{{ g.factura || '—' }}</td>
                  <td class="tr">{{ fmt(g.total) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="vm-tr-total">
                  <td colspan="5" class="font-weight-bold">TOTAL COMPRAS MP</td>
                  <td class="tr font-weight-bold">{{ fmt(data.kpis.compras) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </template>

      <div v-else-if="!loading" class="vm-empty">
        <v-icon size="56" color="#94a3b8">mdi-calculator-variant</v-icon>
        <p>Selecciona un mes y presiona Actualizar para calcular la valoración.</p>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import { API_BASE } from '../../utils/constants.js'
import { useAuthStore } from '../../stores/auth'

// La pantalla se sirve tanto desde Procesos como desde Reportes
const route = useRoute()
const crumbs = computed(() => route.path.includes('/procesos/')
  ? ['Almacén', 'Procesos', 'Valoración Mensual']
  : ['Almacén', 'Reportes', 'Valoración Mensual'])

const authStore = useAuthStore()
const empresa = computed(() =>
  authStore.empresaCodigo || authStore.empresa || localStorage.getItem('empresaActual') || ''
)

// ── Estado ──────────────────────────────────────────────────────────────────
const loading  = ref(false)
const data     = ref(null)
const errorMsg = ref('')
const filtroProducto = ref('')
const showDetalleInicial = ref(false)
const showDetalleFinal   = ref(false)
const showDetalleCompras = ref(false)

// Fila expandida por centro dentro de cada diálogo (inicial/final), para ver
// el detalle de producto que compone el total de ESE centro puntual.
const expandidoInicial = ref(new Set())
const expandidoFinal   = ref(new Set())

function centroTieneDetalle(corte, ccosto) {
  const lista = data.value?.productosPorCentro?.[corte]?.[ccosto]
  return !!(lista && lista.length)
}
function expandido(corte, ccosto) {
  return (corte === 'inicial' ? expandidoInicial : expandidoFinal).value.has(ccosto)
}
function toggleExpand(corte, ccosto) {
  if (!centroTieneDetalle(corte, ccosto)) return
  const ref_ = corte === 'inicial' ? expandidoInicial : expandidoFinal
  const nuevo = new Set(ref_.value)
  if (nuevo.has(ccosto)) nuevo.delete(ccosto)
  else nuevo.add(ccosto)
  ref_.value = nuevo
}
function productosDeCentro(corte, ccosto) {
  return data.value?.productosPorCentro?.[corte]?.[ccosto] || []
}

function mesActualStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
const mesSel = ref(mesActualStr())

// 'mes' = mes calendario completo · 'rango' = corte parcial (7, 15, 20 días…)
// El backend no asume mes: solo necesita desde/hasta y busca la toma física de
// cierre en la ventana [hasta, hasta + días de gracia].
const modo   = ref('mes')
const hoyStr = new Date().toISOString().slice(0, 10)
const fDesde = ref(hoyStr.slice(0, 8) + '01')
const fHasta = ref(hoyStr)

const mesLabel = computed(() => {
  if (!mesSel.value) return ''
  const [y, m] = mesSel.value.split('-').map(Number)
  const nombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return `${nombres[m - 1]} ${y}`
})

const fechaCorteInicialTxt = computed(() => {
  if (!data.value) return ''
  const d = new Date(data.value.periodo.desde + 'T00:00:00')
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
})

const diasPeriodo = computed(() => {
  if (!data.value) return 0
  const a = new Date(data.value.periodo.desde + 'T00:00:00Z')
  const b = new Date(data.value.periodo.hasta + 'T00:00:00Z')
  return Math.round((b - a) / 86400000) + 1
})

// Cobertura de tomas físicas: cuántos centros respaldan cada corte
const totalCentros = computed(() => data.value?.centros?.length || 0)

const coberturaInicial = computed(() => {
  if (!data.value) return ''
  const falt = data.value.kpis.ccSinTomaInicial
  const con  = totalCentros.value - falt
  return falt === 0
    ? `${con} de ${totalCentros.value} centros con toma física`
    : `${con} de ${totalCentros.value} centros — faltan ${falt} sin toma`
})

const coberturaFinal = computed(() => {
  if (!data.value) return ''
  const falt = data.value.kpis.ccSinTomaFinal
  const con  = totalCentros.value - falt
  return falt === 0
    ? `${con} de ${totalCentros.value} centros con toma física`
    : `${con} de ${totalCentros.value} centros — faltan ${falt} sin toma`
})

// Una toma es parcial si quedaron productos sin contar: su stock viene del saldo
// teórico del kardex, no de un conteo real.
function esParcial(conteo) {
  return !!conteo && conteo.contados < conteo.total
}

function fmtFecha(f) {
  if (!f) return '—'
  const [y, m, d] = String(f).slice(0, 10).split('-')
  return `${m}/${d}/${y}`
}

const productosFiltrados = computed(() => {
  if (!data.value) return []
  const q = filtroProducto.value.trim().toLowerCase()
  let filtrados = data.value.productos
  if (q) {
    filtrados = filtrados.filter(p =>
      p.nombre.toLowerCase().includes(q) || String(p.codigo).toLowerCase().includes(q)
    )
  }
  // Ordenar por grupo_nombre, luego por codigo
  return filtrados.sort((a, b) => {
    if (a.grupo_nombre !== b.grupo_nombre) {
      return a.grupo_nombre.localeCompare(b.grupo_nombre)
    }
    return String(a.codigo).localeCompare(String(b.codigo))
  })
})

// ── Formatters ──────────────────────────────────────────────────────────────
function fmt(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function numFmt(v) {
  return (parseFloat(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function foodCostColor(v) {
  if (v === null || v === undefined) return '#94a3b8'
  if (v > 40) return 'var(--error)'
  if (v > 30) return 'var(--gold)'
  return 'var(--success)'
}

// ── Carga ───────────────────────────────────────────────────────────────────
function rangoMes(mesStr) {
  const [y, m] = mesStr.split('-').map(Number)
  const desde = `${y}-${String(m).padStart(2, '0')}-01`
  const ultimoDia = new Date(y, m, 0).getDate()
  const hasta = `${y}-${String(m).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
  return { desde, hasta }
}

// Período efectivo según el modo seleccionado
function periodoActivo() {
  if (modo.value === 'rango') {
    if (!fDesde.value || !fHasta.value) return null
    if (fHasta.value < fDesde.value) return null
    return { desde: fDesde.value, hasta: fHasta.value }
  }
  return mesSel.value ? rangoMes(mesSel.value) : null
}

async function cargar() {
  if (!empresa.value) return
  const periodo = periodoActivo()
  if (!periodo) {
    errorMsg.value = 'Revisa las fechas: la fecha final no puede ser anterior a la inicial.'
    return
  }
  errorMsg.value = ''
  loading.value = true
  try {
    const { desde, hasta } = periodo
    const params = new URLSearchParams({ empresa: empresa.value, desde, hasta })
    const res = await fetch(`${API_BASE}/almacen/valoracion-mensual?${params}`)
    const j   = await res.json()
    if (!j.success) throw new Error(j.error)
    data.value = j
    loading.value = false
  } catch (e) {
    console.error('valoracion-mensual:', e)
    errorMsg.value = e?.message || 'No se pudo cargar la valoración. Intenta de nuevo.'
    loading.value = false
  }
}

onMounted(cargar)
</script>

<style scoped>
.vm-wrap { padding: 0 0 32px; }

/* BREADCRUMB */
.vm-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: rgba(var(--v-theme-on-surface), 0.4); text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.25); }
.bc-cat { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-current { font-size: 11px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }

/* HEADER */
.vm-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.vm-header-left { display: flex; align-items: center; gap: 16px; }
.vm-icon-wrap {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
  background: linear-gradient(135deg, var(--indigo), var(--indigo));
  display: flex; align-items: center; justify-content: center;
}
.vm-title { font-size: 22px; font-weight: 800; margin: 0 0 2px; color: rgb(var(--v-theme-on-surface)); }
.vm-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 0; }
.vm-header-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.mes-input {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
  border-radius: 10px; padding: 8px 12px; font-size: 13px; font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

/* AVISO */
.vm-warning {
  display: flex; align-items: flex-start; gap: 10px;
  background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25);
  color: rgb(var(--v-theme-on-surface)); border-radius: 10px;
  padding: 12px 16px; font-size: 13px; margin-bottom: 18px;
}
.vm-periodo {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  font-size: 12.5px; color: rgba(var(--v-theme-on-surface), 0.6);
  margin-bottom: 16px;
}
.vm-periodo-sep { color: rgba(var(--v-theme-on-surface), 0.25); }
.rango-sep { color: rgba(var(--v-theme-on-surface), 0.4); font-size: 13px; }

.vm-warning-title { font-weight: 700; margin-bottom: 4px; }
.vm-warning-line  { margin-bottom: 2px; }
.vm-warning-note  { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.6); margin-top: 6px; }

.vm-note-info {
  display: flex; align-items: flex-start; gap: 10px;
  background: var(--gold-wash); border: 1px solid color-mix(in srgb, var(--gold) 30%, transparent);
  color: rgb(var(--v-theme-on-surface)); border-radius: 10px;
  padding: 10px 14px; font-size: 12.5px; margin-bottom: 18px;
}

/* LOADING / EMPTY */
.vm-loading, .vm-empty {
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  padding: 80px 0; color: rgba(var(--v-theme-on-surface), 0.5); font-size: 14px;
}
.vm-empty-inline { padding: 24px 0; color: rgba(var(--v-theme-on-surface), 0.45); font-size: 13px; text-align: center; }

/* KPIs */
.vm-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 20px; }
.vm-kpi { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-md); }
.vm-kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-sm); }
.vm-kpi-icon { width: 40px; height: 40px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.vm-kpi-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--ink-600); }
.vm-kpi-val { font-size: var(--text-2xl); font-weight: 700; line-height: 1.2; margin: 4px 0; font-variant-numeric: tabular-nums; }
.vm-kpi-sub { font-size: 11px; color: var(--ink-400); }
.vm-kpi-sub-warn { color: var(--error); font-weight: 600; }
.vm-kpi-badge-estimado {
  display: inline-block; margin-left: 6px; padding: 1px 6px; border-radius: var(--radius-sm, 4px);
  font-size: 9px; font-weight: 700; letter-spacing: 0.5px; color: var(--warning); background: var(--gold-wash);
  vertical-align: middle;
}

/* CARDS */
.vm-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px; padding: 18px 20px; margin-bottom: 18px;
}
.vm-card-full { width: 100%; }
.vm-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.vm-card-title { font-size: 13.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: rgb(var(--v-theme-on-surface)); flex: 1; }
.vm-card-badge {
  font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px;
  background: rgba(139,92,246,0.1); color: var(--indigo); white-space: nowrap;
}
.vm-card-note {
  font-size: 12.5px; color: rgba(var(--v-theme-on-surface), 0.55);
  margin: -4px 0 14px; line-height: 1.5;
}

.vm-search {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-radius: 8px; padding: 6px 12px; font-size: 12.5px;
  color: rgb(var(--v-theme-on-surface)); width: 220px;
}

/* FORMULA VISUAL */
.vm-formula {
  display: flex; align-items: center; justify-content: center; gap: 0;
  padding: 40px 16px; flex-wrap: wrap;
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-radius: 12px; margin-bottom: 20px;
}
.vm-formula-item {
  display: flex; flex-direction: column; align-items: center; gap: 10px; min-width: 140px; flex: 1; max-width: 220px;
}
.vm-formula-bar {
  width: 100%; border-radius: 12px; padding: 18px 12px; text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
}
.vm-formula-val {
  font-size: 17px; font-weight: 800; color: #fff; white-space: nowrap;
}
.vm-formula-lbl {
  font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.55);
}
.vm-formula-result .vm-formula-bar {
  box-shadow: 0 2px 12px rgba(249,115,22,0.3);
  transform: scaleY(1.08);
}
.vm-formula-op {
  font-size: 42px; font-weight: 900; color: rgba(var(--v-theme-on-surface), 0.25);
  padding: 0 20px; line-height: 1; margin-bottom: 24px; user-select: none;
}

/* KPI DETAIL BUTTON */
.vm-kpi-detail-btn {
  display: flex; align-items: center; gap: 3px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: none; border-radius: 8px; padding: 4px 8px;
  font-size: 11px; font-weight: 600; cursor: pointer;
  color: var(--ink-400); transition: all 0.15s ease;
}
.vm-kpi-detail-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.10);
  color: var(--ink-700);
}

/* TABLA */
.vm-table-wrap { overflow-x: auto; }
.vm-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.vm-table th {
  text-align: left; font-size: 10.5px; font-weight: 800; letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.45); text-transform: uppercase;
  padding: 10px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  white-space: nowrap;
}
.vm-table td { padding: 10px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); white-space: nowrap; }
.vm-table .tr { text-align: right; }
.vm-tr:hover { background: rgba(var(--v-theme-on-surface), 0.03); }
.vm-tr-total td { border-top: 2px solid rgba(var(--v-theme-on-surface), 0.15); border-bottom: none; }

/* EXPANSIÓN POR CENTRO (detalle de producto dentro de cada corte) */
.th-expand { width: 28px; }
.td-expand { width: 28px; padding: 10px 0 10px 12px !important; color: rgba(var(--v-theme-on-surface), 0.4); }
.vm-tr-expandible { cursor: pointer; }
.vm-tr-detalle td {
  padding: 0 !important; background: rgba(var(--v-theme-on-surface), 0.02);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.vm-table-nested { margin: 8px 12px 8px 40px; width: calc(100% - 52px); }
.vm-table-nested th {
  font-size: 9.5px; padding: 6px 10px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.vm-table-nested td { padding: 6px 10px; font-size: 12px; }
.vm-table-nested .vm-tr:last-child td { border-bottom: none; }
.text-dim { color: rgba(var(--v-theme-on-surface), 0.45); }

.badge-info {
  background: rgba(6,182,212,0.12); color: var(--indigo);
  font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 8px; margin-left: 6px;
}
.badge-warn {
  background: rgba(239,68,68,0.12); color: var(--error);
  font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 8px; margin-left: 6px;
}
.conteo-tag {
  margin-left: 6px; padding: 1px 6px; border-radius: 7px;
  font-size: 10px; font-weight: 700; font-variant-numeric: tabular-nums;
  background: color-mix(in srgb, var(--success) 12%, transparent); color: var(--success);
}
.conteo-tag.conteo-parcial {
  background: var(--gold-wash); color: var(--gold);
}
.badge-missing {
  background: rgba(239,68,68,0.12); color: var(--error);
  font-size: 10px; font-weight: 800; letter-spacing: .4px;
  padding: 2px 7px; border-radius: 8px;
}
.td-missing { color: var(--error); font-weight: 600; }
.badge-dim-tag {
  background: rgba(148,163,184,0.12); color: #94a3b8;
  font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 8px; margin-left: 6px;
}

/* COLOREO DE TABLA PRODUCTOS */
.th-section-inicial {
  background: rgba(139,92,246,0.12) !important; color: var(--indigo) !important; font-weight: 800;
}
.th-section-final {
  background: color-mix(in srgb, var(--success) 10%, transparent) !important; color: var(--success) !important; font-weight: 800;
}
.th-stock-inicial, .th-valor-inicial {
  background: rgba(139,92,246,0.08) !important; border-bottom: 2px solid rgba(139,92,246,0.25) !important;
}
.th-stock-final, .th-valor-final {
  background: rgba(34,197,94,0.08) !important; border-bottom: 2px solid rgba(34,197,94,0.25) !important;
}
.td-stock-inicial, .td-valor-inicial {
  background: rgba(139,92,246,0.04); color: var(--indigo); font-weight: 600;
}
.td-stock-final, .td-valor-final {
  background: color-mix(in srgb, var(--success) 5%, transparent); color: var(--success); font-weight: 600;
}
</style>
