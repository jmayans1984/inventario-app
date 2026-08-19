<template>
  <MainLayout>
    <div class="ivc-wrap">

      <PageHeader
        title="Importar Ventas Consolidado"
        description="Un solo archivo de Square con todas las sedes: se importan todas juntas"
        :crumbs="['Tesorería', 'Procesos', 'Importar Ventas Consolidado']"
      />

      <!-- ═══════════ CONFIGURACIÓN ═══════════ -->
      <div class="ivc-card mb-4">
        <div class="ivc-card-hdr">
          <v-icon size="15" color="var(--indigo)">mdi-tune</v-icon>
          <span class="ivc-card-ttl">CONFIGURACIÓN</span>
          <span class="ivc-card-sub">Se aplica a todas las sedes del archivo</span>
        </div>
        <div class="ivc-cfg-grid">
          <div class="ivc-field">
            <label class="ivc-label">FECHA DE LOS MOVIMIENTOS</label>
            <input v-model="configFecha" type="date" class="ivc-input" />
            <span v-if="periodo.desde && configFecha !== periodo.desde" class="ivc-hint ivc-hint-warn">
              El día de operación del archivo es {{ periodo.desde }}
              <button class="ivc-link" @click="configFecha = periodo.desde">usar esa</button>
            </span>
            <span v-else-if="periodo.desde" class="ivc-hint ivc-hint-ok">
              Día de operación {{ periodo.desde }}<template v-if="periodo.hasta !== periodo.desde"> (cierre {{ periodo.hasta }})</template>
            </span>
          </div>
          <div class="ivc-field">
            <label class="ivc-label">CUENTA OTROS PAGOS</label>
            <v-select v-model="configCtaOtros" :items="cuentasBancarias" item-title="nombre_cta" item-value="codigo"
              density="compact" variant="outlined" hide-details placeholder="Selecciona…" />
          </div>
          <div class="ivc-field">
            <label class="ivc-label">CUENTA EFECTIVO</label>
            <v-select v-model="configCtaEfectivo" :items="cuentasBancarias" item-title="nombre_cta" item-value="codigo"
              density="compact" variant="outlined" hide-details placeholder="Selecciona…" />
          </div>
        </div>
        <div class="ivc-cfg-nota">
          <v-icon size="13" color="var(--info)">mdi-information-outline</v-icon>
          La <strong>cuenta de Square es distinta por sede</strong>, así que se elige en cada tarjeta más abajo.
          Efectivo y Otros pagos sí son los mismos para toda la empresa.
        </div>
        <div v-if="sedes.length && !ctaOtrasComisiones && hayOtrasComisiones" class="ivc-cfg-nota ivc-cfg-nota-warn">
          <v-icon size="13" color="var(--warning)">mdi-alert-outline</v-icon>
          Hay <strong>{{ fmt(totalOtrasComisiones) }}</strong> de sobreprecio de plataformas, pero no está
          definida la <strong>cuenta contable de otras comisiones</strong> en Configuración → General:
          el valor se guardará en la venta pero <strong>no se creará el gasto</strong>.
        </div>
      </div>

      <!-- ═══════════ CARGA DEL ARCHIVO ═══════════ -->
      <div v-if="!sedes.length" class="ivc-drop" :class="{ 'ivc-drop-on': dragging }"
        @dragover.prevent="dragging = true" @dragleave.prevent="dragging = false" @drop.prevent="onDrop"
        @click="$refs.fileInput.click()">
        <input ref="fileInput" type="file" accept=".csv,.txt" hidden @change="onPick" />
        <v-icon size="40" color="var(--indigo)">mdi-file-delimited-outline</v-icon>
        <div class="ivc-drop-ttl">Arrastra el reporte de <strong>Ventas Totales</strong> de Square</div>
        <div class="ivc-drop-sub">
          Debe estar exportado con <strong>“Display By Location”</strong> activado, para que traiga todas las sedes.
        </div>
        <div class="ivc-drop-sub2">o haz clic para buscarlo</div>
      </div>

      <div v-if="parseError" class="ivc-alert ivc-alert-err">
        <v-icon size="18" color="var(--error)">mdi-alert-circle-outline</v-icon>
        <span>{{ parseError }}</span>
      </div>

      <!-- ═══════════ SEDES DETECTADAS ═══════════ -->
      <template v-if="sedes.length">
        <div class="ivc-file-row">
          <v-icon size="16" color="var(--success)">mdi-file-check-outline</v-icon>
          <span class="ivc-file-name">{{ fileName }}</span>
          <span class="ivc-file-meta">{{ sedes.length }} sede{{ sedes.length !== 1 ? 's' : '' }} detectada{{ sedes.length !== 1 ? 's' : '' }}</span>
          <v-spacer />
          <button class="ivc-link" @click="limpiar">Cargar otro archivo</button>
        </div>

        <div v-if="avisoParser" class="ivc-alert ivc-alert-warn">
          <v-icon size="18" color="var(--warning)">mdi-alert-outline</v-icon>
          <span>{{ avisoParser }}</span>
        </div>

        <div class="ivc-sedes">
          <div v-for="s in sedes" :key="s.location" class="ivc-sede"
            :class="{ 'ivc-sede-off': !s.incluir, 'ivc-sede-mal': !s.control.cuadra }">

            <!-- Cabecera de la sede -->
            <div class="ivc-sede-hdr">
              <label class="ivc-check">
                <input type="checkbox" v-model="s.incluir" />
              </label>
              <div class="ivc-sede-id">
                <div class="ivc-sede-loc">{{ s.location }}</div>
                <div class="ivc-sede-meta">
                  {{ s.items.length }} artículos · {{ s.modificadores.length }} modificadores
                </div>
              </div>

              <div class="ivc-sede-cc">
                <label class="ivc-label-sm">CENTRO DE COSTO</label>
                <v-select v-model="s.ccosto" :items="ccostos" item-title="nombre" item-value="codigo"
                  density="compact" variant="outlined" hide-details placeholder="Sin asignar"
                  @update:model-value="onCambioCcosto(s)" />
              </div>

              <div class="ivc-sede-cc">
                <label class="ivc-label-sm">CUENTA SQUARE (TARJETA)</label>
                <v-select v-model="s.ctaSquare" :items="cuentasSquare" item-title="nombre_cta" item-value="codigo"
                  density="compact" variant="outlined" hide-details placeholder="Sin asignar"
                  @update:model-value="guardarCtaSquare(s)" />
              </div>

              <div class="ivc-sede-total">
                <div class="ivc-sede-total-lbl">TOTAL RECIBIDO</div>
                <div class="ivc-sede-total-val">{{ fmt(s.pagos.totalRecibido) }}</div>
              </div>
            </div>

            <!-- Avisos por sede -->
            <div v-if="!s.ccosto" class="ivc-sede-aviso ivc-sede-aviso-err">
              <v-icon size="14" color="var(--error)">mdi-alert-circle-outline</v-icon>
              No se pudo asociar “{{ s.location }}” a un centro de costo. Selecciónalo arriba.
            </div>
            <div v-else-if="s.autoAsignado || s.ctaSquareAuto" class="ivc-sede-aviso ivc-sede-aviso-info">
              <v-icon size="14" color="var(--info)">mdi-information-outline</v-icon>
              <div>
                Asignado automáticamente:
                <template v-if="s.autoAsignado">centro de costo <strong>{{ nombreCcosto(s.ccosto) }}</strong></template>
                <template v-if="s.autoAsignado && s.ctaSquareAuto"> · </template>
                <template v-if="s.ctaSquareAuto">cuenta <strong>{{ nombreCuenta(s.ctaSquare) }}</strong></template>.
                Cámbialo si no corresponde; se guarda para la próxima vez.
              </div>
            </div>

            <div v-if="!s.ctaSquare && s.ccosto" class="ivc-sede-aviso ivc-sede-aviso-err">
              <v-icon size="14" color="var(--error)">mdi-bank-off-outline</v-icon>
              Falta la cuenta de Square de esta sede. Selecciónala arriba.
            </div>

            <div v-if="!s.control.cuadra" class="ivc-sede-aviso ivc-sede-aviso-err">
              <v-icon size="14" color="var(--error)">mdi-scale-balance</v-icon>
              <div>
                <strong>El archivo no cuadra en esta sede:</strong>
                <div v-for="d in s.control.diferencias" :key="d">· {{ d }}</div>
              </div>
            </div>

            <div v-if="s.yaImportado" class="ivc-sede-aviso ivc-sede-aviso-warn">
              <v-icon size="14" color="var(--warning)">mdi-database-alert-outline</v-icon>
              Ya hay {{ s.yaImportado }} registros para esta fecha y centro de costo.
              <label class="ivc-check-inline">
                <input type="checkbox" v-model="s.force" /> Reemplazar
              </label>
            </div>

            <!-- Desglose, agrupado para que se lea de corrido -->
            <div class="ivc-grupos">
              <div class="ivc-grupo">
                <div class="ivc-grupo-ttl">VENTAS</div>
                <div class="ivc-sede-body">
                  <div class="ivc-mini">
                    <span class="ivc-mini-lbl">Ventas brutas</span>
                    <span class="ivc-mini-val">{{ fmt(s.ventas.ventasBrutas) }}</span>
                  </div>
                  <div class="ivc-mini">
                    <span class="ivc-mini-lbl">Descuentos</span>
                    <span class="ivc-mini-val ivc-neg">−{{ fmt(s.ventas.descuentos) }}</span>
                  </div>
                  <div class="ivc-mini">
                    <span class="ivc-mini-lbl">Devoluciones</span>
                    <span class="ivc-mini-val" :class="s.ventas.devoluciones > 0 && 'ivc-neg'">
                      {{ s.ventas.devoluciones > 0 ? '−' + fmt(s.ventas.devoluciones) : fmt(0) }}
                    </span>
                  </div>
                  <div class="ivc-mini">
                    <span class="ivc-mini-lbl">Ventas netas</span>
                    <span class="ivc-mini-val">{{ fmt(s.ventas.ventasNetas) }}</span>
                  </div>
                  <div class="ivc-mini">
                    <span class="ivc-mini-lbl">Impuestos</span>
                    <span class="ivc-mini-val">{{ fmt(s.ventas.impuestos) }}</span>
                  </div>
                  <div class="ivc-mini">
                    <span class="ivc-mini-lbl">Propinas</span>
                    <span class="ivc-mini-val">{{ fmt(s.ventas.propinas) }}</span>
                  </div>
                </div>
              </div>

              <div class="ivc-grupo">
                <div class="ivc-grupo-ttl">FORMAS DE PAGO</div>
                <div class="ivc-sede-body">
                  <div class="ivc-mini">
                    <span class="ivc-mini-lbl">Efectivo</span>
                    <span class="ivc-mini-val">{{ fmt(s.pagos.efectivo) }}</span>
                  </div>
                  <div class="ivc-mini">
                    <span class="ivc-mini-lbl">Tarjeta</span>
                    <span class="ivc-mini-val">{{ fmt(s.pagos.tarjeta) }}</span>
                  </div>
                  <div class="ivc-mini">
                    <span class="ivc-mini-lbl">Otros</span>
                    <span class="ivc-mini-val">{{ fmt(s.pagos.otro) }}</span>
                  </div>
                  <div class="ivc-mini">
                    <span class="ivc-mini-lbl">Comisiones Square</span>
                    <span class="ivc-mini-val ivc-neg">−{{ fmt(s.pagos.comisiones) }}</span>
                  </div>
                </div>
              </div>

              <div class="ivc-grupo">
                <div class="ivc-grupo-ttl">VALORACIÓN E INVENTARIO</div>
                <div class="ivc-sede-body">
                  <div class="ivc-mini">
                    <span class="ivc-mini-lbl">Venta a precio de lista</span>
                    <span class="ivc-mini-val">{{ fmt(valoracion(s).listaTotal) }}</span>
                  </div>
                  <div class="ivc-mini">
                    <span class="ivc-mini-lbl">Otras comisiones (delivery)</span>
                    <span class="ivc-mini-val" :class="otrasComisionesDe(s) > 0 && 'ivc-neg'">
                      {{ otrasComisionesDe(s) > 0 ? '−' + fmt(otrasComisionesDe(s)) : fmt(0) }}
                    </span>
                  </div>
                  <div class="ivc-mini">
                    <span class="ivc-mini-lbl">Consumo de inventario</span>
                    <span class="ivc-mini-val">
                      <template v-if="s.consumoLoading">
                        <v-progress-circular indeterminate size="12" width="2" />
                      </template>
                      <template v-else-if="s.consumo.length">{{ s.consumo.length }} artículos</template>
                      <template v-else>—</template>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Ver detalle antes de guardar -->
            <div class="ivc-det-toggle">
              <button class="ivc-det-btn" @click="s.verDetalle = !s.verDetalle">
                <v-icon size="14">{{ s.verDetalle ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                {{ s.verDetalle ? 'Ocultar' : 'Ver' }} lo que se va a guardar
              </button>
              <span v-if="s.recetasError" class="ivc-det-warn ivc-det-err">
                <v-icon size="13" color="var(--error)">mdi-alert-circle-outline</v-icon>
                No se pudieron consultar las recetas ({{ s.recetasError }}): los precios que ves son
                los del reporte, no los de tu lista. La comparación no es válida.
              </span>
              <span v-else-if="s.itemsSinReceta" class="ivc-det-warn">
                <v-icon size="13" color="var(--warning)">mdi-alert-outline</v-icon>
                {{ s.itemsSinReceta }} producto(s) sin receta: se usa el precio del reporte
              </span>
            </div>

            <div v-if="s.verDetalle" class="ivc-det">
              <div class="ivc-tabs">
                <button class="ivc-tab" :class="s.tab === 'items' && 'ivc-tab-on'" @click="s.tab = 'items'">
                  Productos vendidos <span class="ivc-tab-n">{{ s.items.length }}</span>
                </button>
                <button class="ivc-tab" :class="s.tab === 'mods' && 'ivc-tab-on'" @click="s.tab = 'mods'">
                  Modificadores <span class="ivc-tab-n">{{ s.modificadores.length }}</span>
                </button>
                <button class="ivc-tab" :class="s.tab === 'consumo' && 'ivc-tab-on'" @click="s.tab = 'consumo'">
                  Consumo de inventario <span class="ivc-tab-n">{{ s.consumo.length }}</span>
                </button>
              </div>

              <!-- Productos vendidos -->
              <div v-if="s.tab === 'items'" class="ivc-tabla-wrap">
                <table class="ivc-tabla">
                  <thead>
                    <tr>
                      <th>SKU</th><th>PRODUCTO</th><th>VARIANTE</th>
                      <th class="r">CANT</th><th class="r">VR. UNIT<br><span class="ivc-th-sub">receta</span></th>
                      <th class="r">SUBTOTAL<br><span class="ivc-th-sub">a precio de lista</span></th>
                      <th class="r">VENTAS BRUTAS<br><span class="ivc-th-sub">lo cobrado</span></th>
                      <th class="r">SOBREPRECIO<br><span class="ivc-th-sub">delivery +30%</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="it in s.items" :key="it.sku + it.nombre + it.variante">
                      <td><span class="ivc-sku">{{ it.sku || '—' }}</span></td>
                      <td class="ivc-td-nom">
                        {{ it.nombre }}
                        <span v-if="it.nombreReceta && it.nombreReceta !== it.nombre" class="ivc-td-alias">({{ it.nombreReceta }})</span>
                      </td>
                      <td class="dim">{{ it.variante || '—' }}</td>
                      <td class="r">{{ it.cantidad }}</td>
                      <td class="r">{{ fmt(it.precioVenta) }}</td>
                      <td class="r b">{{ fmt(it.subtotal) }}</td>
                      <td class="r dim">{{ fmt(it.ventasBrutas) }}</td>
                      <td class="r" :class="(it.ventasBrutas - it.subtotal) > 0.005 && 'ivc-sobre'">
                        {{ (it.ventasBrutas - it.subtotal) > 0.005 ? '+' + fmt(it.ventasBrutas - it.subtotal) : '—' }}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="3" class="r">TOTALES</td>
                      <td class="r b">{{ sumaCant(s.items) }}</td>
                      <td></td>
                      <td class="r b">{{ fmt(sumaCampo(s.items, 'subtotal')) }}</td>
                      <td class="r b">{{ fmt(sumaCampo(s.items, 'ventasBrutas')) }}</td>
                      <td class="r b ivc-sobre">
                        +{{ fmt(sumaCampo(s.items, 'ventasBrutas') - sumaCampo(s.items, 'subtotal')) }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <!-- Conciliación: venta a precio de lista vs venta real de Square -->
              <div v-if="s.tab === 'items'" class="ivc-conc">
                <div class="ivc-conc-ttl">
                  <v-icon size="14" color="var(--indigo)">mdi-scale-balance</v-icon>
                  LAS DOS VALORACIONES DE ESTA VENTA
                </div>
                <div class="ivc-conc-body">
                  <div class="ivc-conc-col">
                    <div class="ivc-conc-lbl">A PRECIO DE LISTA (RECETAS)</div>
                    <div class="ivc-conc-row">
                      <span>Productos (precio de menú × cantidad)</span>
                      <span>{{ fmt(valoracion(s).lista) }}</span>
                    </div>
                    <div class="ivc-conc-row">
                      <span>Adiciones y modificadores cobrados</span>
                      <span>{{ fmt(valoracion(s).mods) }}</span>
                    </div>
                    <div class="ivc-conc-row ivc-conc-row-tot">
                      <span>Total a precio de lista</span>
                      <span>{{ fmt(valoracion(s).listaTotal) }}</span>
                    </div>
                  </div>
                  <div class="ivc-conc-col">
                    <div class="ivc-conc-lbl">SEGÚN SQUARE (LO COBRADO)</div>
                    <div class="ivc-conc-row ivc-conc-row-tot">
                      <span>Ventas brutas del reporte</span>
                      <span>{{ fmt(valoracion(s).csv) }}</span>
                    </div>
                    <div class="ivc-conc-row ivc-conc-dif"
                      :class="Math.abs(valoracion(s).brecha) < 0.01 && 'ivc-conc-dif-ok'">
                      <span>Diferencia</span>
                      <span>{{ fmt(valoracion(s).brecha) }}</span>
                    </div>
                    <div class="ivc-conc-nota">
                      <template v-if="valoracion(s).brecha > 0.01">
                        Es el <strong>+30%</strong> con que se publican los platos en las plataformas
                        de domicilio para cubrir su comisión. Entra a Square como venta, así que se
                        provisiona como <strong>otras comisiones</strong>.
                        Los pedidos <em>para recoger</em> llegan al precio normal y no suman aquí.
                      </template>
                      <template v-else-if="valoracion(s).brecha < -0.01">
                        Square cobró por debajo de tu lista de precios. No hay sobreprecio que
                        provisionar en esta sede.
                      </template>
                      <template v-else>
                        No hubo ventas con sobreprecio de delivery en esta sede.
                      </template>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Consumo de inventario -->
              <div v-else-if="s.tab === 'consumo'" class="ivc-tabla-wrap">
                <div v-if="s.consumoLoading" class="ivc-tabla-vacia">
                  <v-progress-circular indeterminate size="18" width="2" /> Calculando consumo…
                </div>
                <div v-else-if="s.consumoError" class="ivc-tabla-vacia ivc-tabla-err">
                  <v-icon size="16" color="var(--error)">mdi-alert-circle-outline</v-icon>
                  {{ s.consumoError }}
                </div>
                <div v-else-if="!s.consumo.length" class="ivc-tabla-vacia">
                  No se calculó consumo para esta sede.
                </div>
                <table v-else class="ivc-tabla">
                  <thead>
                    <tr>
                      <th>CÓDIGO</th><th>ARTÍCULO</th><th>GRUPO</th>
                      <th>UND</th><th class="r">CONSUMO</th><th>ORIGEN</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="c in s.consumo" :key="c.codigo">
                      <td><span class="ivc-sku">{{ c.codigo }}</span></td>
                      <td class="ivc-td-nom">{{ c.nombre }}</td>
                      <td class="dim">{{ c.grupoNombre }}</td>
                      <td class="dim">{{ c.und || '—' }}</td>
                      <td class="r b" :class="c.totalConsumo < 0 && 'ivc-neg'">{{ num(c.totalConsumo) }}</td>
                      <td class="ivc-td-origen">
                        <span v-for="(r, i) in c.recetas" :key="i" class="ivc-chip"
                          :title="`${r.cantPorUnidad} × ${r.vendidos} = ${num(r.subtotal)}`">
                          {{ r.nombreReceta }} ×{{ r.vendidos }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="4" class="r">ARTÍCULOS AFECTADOS</td>
                      <td class="r b">{{ s.consumo.length }}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <!-- Modificadores -->
              <div v-else class="ivc-tabla-wrap">
                <div v-if="!s.modificadores.length" class="ivc-tabla-vacia">Sin modificadores en el archivo.</div>
                <table v-else class="ivc-tabla">
                  <thead>
                    <tr>
                      <th>GRUPO</th><th>MODIFICADOR</th>
                      <th class="r">CANT</th>
                      <th class="r">VR. UNIT<br><span class="ivc-th-sub">receta</span></th>
                      <th class="r">A PRECIO DE LISTA</th>
                      <th class="r">COBRADO</th>
                      <th class="r">SOBREPRECIO<br><span class="ivc-th-sub">delivery +30%</span></th>
                      <th>AFECTA INVENTARIO</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(m, i) in s.modificadores" :key="i">
                      <td class="dim">{{ m.grupo }}</td>
                      <td class="ivc-td-nom">{{ m.modificador }}</td>
                      <td class="r">{{ m.cantidadNeta }}</td>
                      <td class="r">
                        <template v-if="m.precioLista">{{ fmt(m.precioLista) }}</template>
                        <span v-else class="dim" title="Sin receta con ese nombre: se usa lo cobrado">—</span>
                      </td>
                      <td class="r b">{{ fmt(m.subtotalLista) }}</td>
                      <td class="r dim">{{ fmt(m.ventasBrutas) }}</td>
                      <td class="r" :class="(m.ventasBrutas - m.subtotalLista) > 0.005 && 'ivc-sobre'">
                        {{ (m.ventasBrutas - m.subtotalLista) > 0.005 ? '+' + fmt(m.ventasBrutas - m.subtotalLista) : '—' }}
                      </td>
                      <td>
                        <span v-if="mapeoDeMod(m.modificador).length" class="ivc-chip ivc-chip-ok">
                          {{ mapeoDeMod(m.modificador).length }} artículo(s)
                        </span>
                        <span v-else class="dim">—</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Resultado del guardado -->
            <div v-if="s.resultado" class="ivc-sede-aviso" :class="s.resultado.ok ? 'ivc-sede-aviso-ok' : 'ivc-sede-aviso-err'">
              <v-icon size="14" :color="s.resultado.ok ? 'var(--success)' : 'var(--error)'">
                {{ s.resultado.ok ? 'mdi-check-circle-outline' : 'mdi-close-circle-outline' }}
              </v-icon>
              {{ s.resultado.msg }}
            </div>
          </div>
        </div>

        <!-- ═══════════ TOTALES Y ACCIÓN ═══════════ -->
        <div class="ivc-footer">
          <div class="ivc-footer-tot">
            <div class="ivc-footer-item">
              <span class="ivc-footer-lbl">SEDES A IMPORTAR</span>
              <span class="ivc-footer-val">{{ sedesListas.length }} de {{ sedes.length }}</span>
            </div>
            <div class="ivc-footer-item">
              <span class="ivc-footer-lbl">A PRECIO DE LISTA</span>
              <span class="ivc-footer-val">{{ fmt(totalLista) }}</span>
            </div>
            <div class="ivc-footer-item">
              <span class="ivc-footer-lbl">VENTAS BRUTAS (SQUARE)</span>
              <span class="ivc-footer-val">{{ fmt(totalBrutas) }}</span>
            </div>
            <div class="ivc-footer-item">
              <span class="ivc-footer-lbl">TOTAL RECIBIDO</span>
              <span class="ivc-footer-val ivc-footer-val-big">{{ fmt(totalRecibido) }}</span>
            </div>
          </div>
          <div class="ivc-footer-act">
            <div v-if="!bloqueo && sedesQueReemplazan.length" class="ivc-aviso-reemplazo">
              <v-icon size="14" color="var(--error)">mdi-database-refresh-outline</v-icon>
              Se <strong>reemplazarán</strong> los datos de
              {{ sedesQueReemplazan.map(s => s.location).join(', ') }} en esta fecha.
            </div>
            <div v-if="bloqueo" class="ivc-bloqueo">
              <v-icon size="14" color="var(--warning)">mdi-alert-outline</v-icon>
              <div>
                {{ bloqueo }}
                <button v-if="sedesPorReemplazar.length" class="ivc-btn-reemplazar" @click="autorizarReemplazo">
                  <v-icon size="14">mdi-database-refresh-outline</v-icon>
                  Reemplazar {{ sedesPorReemplazar.length === 1 ? 'esa sede' : 'las ' + sedesPorReemplazar.length + ' sedes' }}
                </button>
              </div>
            </div>
            <v-btn color="success" variant="elevated" size="large" :loading="importando"
              :disabled="!!bloqueo || importando" @click="importarTodas">
              Importar {{ sedesListas.length }} sede{{ sedesListas.length !== 1 ? 's' : '' }}
            </v-btn>
          </div>
        </div>

        <div v-if="progreso" class="ivc-progreso">{{ progreso }}</div>
      </template>

      <!-- ═══════════ PROGRESO DE LA IMPORTACIÓN ═══════════ -->
      <v-dialog v-model="dlgProgreso" max-width="620" persistent :scrim="'rgba(10,10,15,.6)'">
        <div class="prg-card">
          <div class="prg-hdr">
            <div class="prg-hdr-icon" :class="terminado && (fallaron ? 'prg-icon-err' : 'prg-icon-ok')">
              <v-progress-circular v-if="!terminado" indeterminate size="20" width="2" color="white" />
              <v-icon v-else size="22" color="white">
                {{ fallaron ? 'mdi-alert-circle-outline' : 'mdi-check-bold' }}
              </v-icon>
            </div>
            <div>
              <div class="prg-ttl">
                {{ terminado ? (fallaron ? 'Importación con errores' : 'Importación completada') : 'Importando ventas…' }}
              </div>
              <div class="prg-sub">
                {{ configFecha }} · {{ pasoActual }} de {{ totalPasos }} sede{{ totalPasos !== 1 ? 's' : '' }}
              </div>
            </div>
            <div class="prg-pct">{{ Math.round(100 * pasoActual / (totalPasos || 1)) }}%</div>
          </div>

          <div class="prg-barra">
            <div class="prg-barra-fill" :class="terminado && fallaron && 'prg-barra-err'"
              :style="{ width: (100 * pasoActual / (totalPasos || 1)) + '%' }"></div>
          </div>

          <div class="prg-lista">
            <div v-for="(s, i) in sedesEnProceso" :key="s.location"
              class="prg-paso" :class="'prg-paso-' + s.estado"
              :style="{ '--d': (i * 45) + 'ms' }">
              <div class="prg-paso-icon">
                <v-progress-circular v-if="s.estado === 'guardando'" indeterminate size="15" width="2" color="var(--indigo)" />
                <v-icon v-else-if="s.estado === 'ok'" size="17" color="var(--success)">mdi-check-circle</v-icon>
                <v-icon v-else-if="s.estado === 'error'" size="17" color="var(--error)">mdi-close-circle</v-icon>
                <span v-else class="prg-punto"></span>
              </div>
              <div class="prg-paso-txt">
                <div class="prg-paso-loc">
                  {{ s.location }}
                  <span class="prg-paso-cc">→ {{ nombreCcosto(s.ccosto) }}</span>
                </div>
                <div class="prg-paso-det">
                  <template v-if="s.estado === 'pendiente'">En espera</template>
                  <template v-else-if="s.estado === 'guardando'">Guardando venta, gastos, inventario y banco…</template>
                  <template v-else-if="s.estado === 'ok' && s.detalleGuardado">
                    <span class="prg-chip">{{ s.detalleGuardado.total }} asientos</span>
                    <span class="prg-chip">{{ s.detalleGuardado.detalles }} productos</span>
                    <span class="prg-chip">{{ s.detalleGuardado.inventario }} artículos</span>
                    <span class="prg-chip">{{ s.detalleGuardado.moviban }} mov. banco</span>
                  </template>
                  <template v-else-if="s.estado === 'ok'">Guardado</template>
                  <template v-else class="prg-paso-err">{{ s.resultado?.msg }}</template>
                </div>
              </div>
              <div class="prg-paso-monto">{{ fmt(s.pagos.totalRecibido) }}</div>
            </div>
          </div>

          <div v-if="terminado" class="prg-resumen" :class="fallaron && 'prg-resumen-err'">
            <template v-if="fallaron">
              Se importaron {{ importadasOk }} de {{ totalPasos }} sedes. Las que fallaron no
              escribieron nada: cada sede se guarda en su propia transacción.
            </template>
            <template v-else>
              Se importaron las {{ totalPasos }} sedes por {{ fmt(totalRecibidoProceso) }} en total.
            </template>
          </div>

          <div class="prg-pie">
            <span v-if="!terminado" class="prg-espera">No cierres esta ventana…</span>
            <v-spacer />
            <v-btn v-if="terminado" :color="fallaron ? 'error' : 'success'" variant="flat"
              @click="dlgProgreso = false">
              Cerrar
            </v-btn>
          </div>
        </div>
      </v-dialog>

      <v-snackbar v-model="snackOk" color="success" timeout="4000">
        Importación terminada
      </v-snackbar>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { parseConsolidado, normalizar } from '../../utils/squareConsolidado'

const authStore = useAuthStore()
const empresaCodigo = computed(() => authStore.empresa || '')

// ─── Config ───────────────────────────────────────────
const configFecha       = ref(new Date().toISOString().slice(0, 10))
const configCtaOtros    = ref(null)
const ctaOtrasComisiones = ref('')   // solo lectura: se configura en Configuración → General
const configCtaEfectivo = ref(null)
const ccostos           = ref([])
const cuentasBancarias  = ref([])
const modInventario     = ref([])

// ─── Archivo ──────────────────────────────────────────
const fileName    = ref('')
const parseError  = ref('')
const avisoParser = ref(null)
const dragging    = ref(false)
const sedes       = ref([])
const periodo     = ref({ desde: '', hasta: '' })

const importando = ref(false)
const progreso   = ref('')
const snackOk    = ref(false)

const nombreCcosto = (cod) => ccostos.value.find(c => c.codigo === cod)?.nombre || cod
const nombreCuenta = (cod) => cuentasBancarias.value.find(c => c.codigo === cod)?.nombre_cta || cod

// Cuentas de Square activas: cada sede liquida en la suya
const cuentasSquare = computed(() =>
  cuentasBancarias.value.filter(c =>
    c.estado !== 'INACTIVA' &&
    (String(c.nombre_banco || '').toUpperCase().includes('SQUARE') ||
     String(c.tipo_cuenta || '').toUpperCase().includes('SQUARE'))
  )
)

/** Cuenta Square de una sede: la del centro de costo, o adivinada por nombre. */
function adivinarCtaSquare(ccosto, location) {
  const cc = ccostos.value.find(c => c.codigo === ccosto)
  if (cc?.cta_square && cuentasBancarias.value.some(b => b.codigo === cc.cta_square)) {
    return { codigo: cc.cta_square, auto: false }
  }
  // "SQUARE ALTAMONTE" ↔ sede "ALTAMONTE SPRINGS" / ccosto "ALTAMONTE"
  const refs = [normalizar(cc?.nombre || ''), normalizar(location || '')].filter(Boolean)
  for (const ref of refs) {
    const hit = cuentasSquare.value.find(b => {
      const n = normalizar(b.nombre_cta).replace(/^SQUARE ?/, '').trim()
      return n && (ref === n || ref.startsWith(n + ' ') || n.startsWith(ref + ' ') || ref.includes(n) || n.includes(ref))
    })
    if (hit) return { codigo: hit.codigo, auto: true }
  }
  return { codigo: null, auto: false }
}

/** Guarda la cuenta Square en el centro de costo, para no repetirlo cada vez. */
async function guardarCtaSquare(sede) {
  if (!sede.ccosto) return
  const cc = ccostos.value.find(c => c.codigo === sede.ccosto)
  if (cc) cc.cta_square = sede.ctaSquare || ''
  try {
    await api.put(`/contabilidad/centrocostos/${sede.ccosto}`, {
      nombre: cc?.nombre || nombreCcosto(sede.ccosto),
      empresa: empresaCodigo.value,
      cta_square: sede.ctaSquare || '',
    })
  } catch (e) { console.error('guardarCtaSquare:', e) }
}

/** Al cambiar el centro de costo, se recuerda el mapeo y se recalcula la cuenta. */
function onCambioCcosto(sede) {
  recordarMapeo(sede)
  const m = adivinarCtaSquare(sede.ccosto, sede.location)
  sede.ctaSquare = m.codigo
}

function fmt(v) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(parseFloat(v || 0))
}
/** Cantidades: hasta 3 decimales, sin ceros de relleno. */
function num(v) {
  const n = parseFloat(v || 0)
  return (Math.round(n * 1000) / 1000).toLocaleString('en-US', { maximumFractionDigits: 3 })
}
const sumaCampo = (arr, campo) => arr.reduce((a, x) => a + (parseFloat(x[campo]) || 0), 0)
const sumaCant  = (arr) => arr.reduce((a, x) => a + (parseFloat(x.cantidad) || 0), 0)

// Dos valoraciones de la misma venta:
//  · LISTA  = precio de la tabla de recetas × cantidad, más las adiciones
//             (modificadores) cobradas. Es la venta a precio de menú.
//  · SQUARE = lo realmente cobrado según el CSV.
// La diferencia entre ambas es, sobre todo, el sobreprecio de las plataformas
// de domicilio (DoorDash/Uber), que no viene identificado en el archivo.
// Lo que se registra como "otras comisiones". Solo cuenta cuando Square cobro
// MAS que el precio de lista (sobreprecio de plataformas). Si cobro menos, no
// es una comision: son descuentos o ajustes de precio en caja, y no se registra.
// El importador y la tarjeta usan esta misma funcion para que nunca muestren
// una cifra distinta de la que se guarda.
function otrasComisionesDe(sede) {
  return Math.max(0, valoracion(sede).brecha)
}

function valoracion(sede) {
  const lista = sumaCampo(sede.items, 'subtotal')          // receta x cantidad
  const mods  = sumaCampo(sede.modificadores, 'subtotalLista') // receta x cantidad
  const csv   = sede.ventas.ventasBrutas
  return { lista, mods, listaTotal: lista + mods, csv, brecha: csv - (lista + mods) }
}
const mapeoDeMod = (nombre) =>
  modInventario.value.filter(m => m.modificador === (nombre || '').trim())

// ─── Carga de catálogos ───────────────────────────────
async function fetchCcostos() {
  if (!empresaCodigo.value) return
  try {
    const r = await api.get('/ccostos', { params: { empresa: empresaCodigo.value } })
    if (r.data?.success) ccostos.value = r.data.data
  } catch (e) { console.error('fetchCcostos:', e) }
}
async function fetchCuentas() {
  if (!empresaCodigo.value) return
  try {
    const r = await api.get('/cuentas-bancarias', { params: { empresa: empresaCodigo.value } })
    if (r.data?.success) cuentasBancarias.value = r.data.data
  } catch (e) { console.error('fetchCuentas:', e) }
}
async function fetchConfigGeneral() {
  if (!empresaCodigo.value) return
  try {
    const r = await api.get('/config-general', { params: { empresa: empresaCodigo.value } })
    if (r.data?.success) {
      const cfg = r.data.data
      if (cfg.cta_bancaria_otros)    configCtaOtros.value    = cfg.cta_bancaria_otros
      if (cfg.cta_bancaria_efectivo) configCtaEfectivo.value = cfg.cta_bancaria_efectivo
      ctaOtrasComisiones.value = cfg.cta_otras_comisiones || ''
    }
  } catch (e) { console.error('fetchConfigGeneral:', e) }
}
// Se guarda la promesa: si el usuario suelta el archivo antes de que termine
// esta carga, el consumo se calcularía SIN los modificadores y quedaría
// silenciosamente incompleto. calcularConsumo() la espera.
let modInvPromise = null
function fetchModInventario() {
  modInvPromise = (async () => {
    try {
      const r = await api.get('/modificadores-inventario')
      if (r.data?.success) modInventario.value = r.data.data
    } catch (e) { console.error('fetchModInventario:', e) }
  })()
  return modInvPromise
}

onMounted(() => {
  fetchCcostos()
  fetchCuentas()
  fetchConfigGeneral()
  fetchModInventario()
})

// ─── Mapeo sede → centro de costo ─────────────────────
// Se recuerda lo que el usuario elija, porque los nombres de Square no siempre
// coinciden con los del centro de costo (ej. "ALTAMONTE SPRINGS" vs "ALTAMONTE").
const claveMapeo = () => `_sqMapeoCcosto_${empresaCodigo.value}`

function leerMapeos() {
  try { return JSON.parse(localStorage.getItem(claveMapeo()) || '{}') } catch { return {} }
}
function recordarMapeo(sede) {
  sede.autoAsignado = false
  const m = leerMapeos()
  if (sede.ccosto) m[normalizar(sede.location)] = sede.ccosto
  else delete m[normalizar(sede.location)]
  localStorage.setItem(claveMapeo(), JSON.stringify(m))
}

/** Asocia el nombre de sede de Square con un centro de costo. */
function adivinarCcosto(location) {
  const guardado = leerMapeos()[normalizar(location)]
  if (guardado && ccostos.value.some(c => c.codigo === guardado)) {
    return { codigo: guardado, auto: false }
  }
  const loc = normalizar(location)
  const cands = ccostos.value.filter(c => c.activo !== 'NO')

  let hit = cands.find(c => normalizar(c.nombre) === loc)
  if (hit) return { codigo: hit.codigo, auto: true }

  // "ALTAMONTE SPRINGS" ↔ "ALTAMONTE": uno empieza con el otro
  hit = cands.find(c => {
    const n = normalizar(c.nombre)
    return n && (loc.startsWith(n + ' ') || n.startsWith(loc + ' '))
  })
  if (hit) return { codigo: hit.codigo, auto: true }

  hit = cands.find(c => {
    const n = normalizar(c.nombre)
    return n && (loc.includes(n) || n.includes(loc))
  })
  if (hit) return { codigo: hit.codigo, auto: true }

  return { codigo: null, auto: false }
}

// ─── Lectura del archivo ──────────────────────────────
function onDrop(e) {
  dragging.value = false
  const f = e.dataTransfer.files?.[0]
  if (f) leerArchivo(f)
}
function onPick(e) {
  const f = e.target.files?.[0]
  if (f) leerArchivo(f)
}

function decodificar(buffer) {
  const bytes = new Uint8Array(buffer)
  // BOM UTF-8
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    return new TextDecoder('utf-8').decode(bytes.subarray(3))
  }
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
  // Si aparecen caracteres de reemplazo, probablemente sea latin1
  if (utf8.includes('�')) return new TextDecoder('windows-1252').decode(bytes)
  return utf8
}

async function leerArchivo(file) {
  parseError.value = ''
  avisoParser.value = null
  fileName.value = file.name
  try {
    const buffer = await file.arrayBuffer()
    const texto = decodificar(buffer)
    const r = parseConsolidado(texto, file.name)

    periodo.value = r.periodo
    // Se usa la fecha INICIAL: el reporte cubre una ventana de 12:00 pm a 3:00 am,
    // es decir un día de operación que cruza la medianoche. El archivo
    // "2026-08-16-2026-08-17" corresponde al día de negocio del 16.
    if (r.periodo.desde) configFecha.value = r.periodo.desde
    avisoParser.value = r.aviso

    sedes.value = r.sedes.map(s => {
      const m = adivinarCcosto(s.location)
      const cta = adivinarCtaSquare(m.codigo, s.location)
      return {
        ...s,
        ccosto: m.codigo,
        autoAsignado: m.auto,
        ctaSquare: cta.codigo,
        ctaSquareAuto: cta.auto,
        incluir: true,
        force: false,
        yaImportado: 0,
        consumo: [],
        consumoLoading: false,
        consumoError: '',
        recetasError: '',
        itemsSinReceta: 0,
        resultado: null,
        estado: 'pendiente',   // pendiente | guardando | ok | error
        detalleGuardado: null, // conteos que devuelve el backend
        verDetalle: false,
        tab: 'items',
      }
    })

    if (!sedes.value.length) {
      parseError.value = 'El archivo se leyó pero no trae sedes en la sección de resumen.'
      return
    }

    for (const s of sedes.value) {
      await enriquecerConRecetas(s)   // debe correr antes: fija precio y subtotal
      await enriquecerModificadores(s)
      calcularConsumo(s)
    }
    verificarYaImportado()
  } catch (e) {
    console.error(e)
    sedes.value = []
    parseError.value = e.message || 'No se pudo leer el archivo'
  }
}

function limpiar() {
  sedes.value = []
  fileName.value = ''
  parseError.value = ''
  avisoParser.value = null
  progreso.value = ''
  periodo.value = { desde: '', hasta: '' }
}

// ─── Precio de venta desde las recetas ────────────────
// El CSV de Square NO trae precio unitario, y detalle_ventas lo necesita
// (vr_unit y subtotal). Se toma el precio de venta de la receta del SKU, igual
// que hace el importador por sede; sin esto los productos vendidos quedarían
// guardados en cero.
async function enriquecerConRecetas(sede) {
  const skus = [...new Set(sede.items.map(i => (i.sku || '').trim()).filter(Boolean))]
  if (!skus.length) return
  try {
    const r = await api.get('/recetas/por-skus', { params: { skus: skus.join(',') } })
    const mapa = {}
    for (const rec of (r.data?.success ? r.data.data || [] : [])) {
      mapa[String(rec.codigo || '').trim()] = rec
    }
    let sinReceta = 0
    for (const item of sede.items) {
      const sku = (item.sku || '').trim()
      const rec = sku ? mapa[sku] : null
      if (rec) {
        item.nombreReceta = rec.nombre
        item.precioVenta  = parseFloat(rec.precio_venta) || 0
        item.subtotal     = item.cantidad * item.precioVenta
      } else {
        // Sin receta: se cae al precio implícito del propio reporte
        item.precioVenta = item.cantidad ? item.ventasBrutas / item.cantidad : 0
        item.subtotal    = item.ventasBrutas
        if (sku) sinReceta++
      }
    }
    sede.itemsSinReceta = sinReceta
  } catch (e) {
    console.error('enriquecerConRecetas:', e)
    // Antes esto caía en silencio al precio del CSV y la comparación quedaba
    // inservible (la venta "a precio de lista" salía igual al bruto de Square).
    sede.recetasError = e?.response?.data?.error || e.message || 'No se pudieron consultar las recetas'
    for (const item of sede.items) {
      if (item.precioVenta === undefined) {
        item.precioVenta = item.cantidad ? item.ventasBrutas / item.cantidad : 0
        item.subtotal    = item.ventasBrutas
      }
    }
  }
}

// Precio de lista de los modificadores. En el reporte de Square vienen por
// NOMBRE, así que se buscan así en la tabla de recetas. Los que no existan
// (o valgan 0, como "NO LECHUGA") se quedan con lo que cobró Square.
async function enriquecerModificadores(sede) {
  const nombres = [...new Set(sede.modificadores.map(m => (m.modificador || '').trim()).filter(Boolean))]
  if (!nombres.length) return
  try {
    const r = await api.post('/recetas/por-nombres', { nombres })
    const mapa = {}
    for (const rec of (r.data?.success ? r.data.data || [] : [])) {
      mapa[String(rec.nombre || '').trim().toUpperCase()] = parseFloat(rec.precio_venta) || 0
    }
    for (const m of sede.modificadores) {
      const pv = mapa[(m.modificador || '').trim().toUpperCase()]
      if (pv > 0) {
        m.precioLista = pv
        m.subtotalLista = (m.cantidadNeta || 0) * pv
      } else {
        m.precioLista = null
        m.subtotalLista = m.ventasBrutas
      }
    }
  } catch (e) {
    console.error('enriquecerModificadores:', e)
    for (const m of sede.modificadores) {
      if (m.subtotalLista === undefined) { m.precioLista = null; m.subtotalLista = m.ventasBrutas }
    }
  }
}

// ─── Consumo de inventario por sede ───────────────────
// Misma lógica que el importador por sede: se expanden las recetas de los SKUs
// vendidos y luego se aplican los modificadores mapeados a inventario.
async function calcularConsumo(sede) {
  sede.consumoError = ''
  const itemsConSku = sede.items.filter(i => i.sku && i.sku.trim() !== '')
  if (!itemsConSku.length) {
    sede.consumoError = 'Ningún producto del archivo trae SKU, así que no se puede calcular el consumo.'
    return
  }
  sede.consumoLoading = true
  try {
    await modInvPromise            // los modificadores deben estar cargados
    const skus = [...new Set(itemsConSku.map(i => i.sku.trim()))]
    const r = await api.get('/detalle-productos/por-recetas', { params: { recetas: skus.join(',') } })
    const filas = r.data?.success ? (r.data.data || []) : []
    if (!filas.length) {
      sede.consumoError = `Ninguno de los ${skus.length} SKU del reporte tiene receta con artículos de inventario (o los artículos no están marcados con control = SÍ).`
    }

    const cantPorSku = {}
    const nombrePorSku = {}
    for (const it of itemsConSku) {
      const sku = it.sku.trim()
      cantPorSku[sku] = (cantPorSku[sku] || 0) + it.cantidad
      if (!nombrePorSku[sku]) nombrePorSku[sku] = it.nombre || sku
    }

    const mapa = {}
    for (const dp of filas) {
      const receta = (dp.receta || '').trim()
      const codArt = (dp.articulo || '').trim()
      const vendidos = cantPorSku[receta] || 0
      const total = (parseFloat(dp.cant) || 0) * vendidos
      if (!mapa[codArt]) {
        mapa[codArt] = {
          codigo: codArt,
          nombre: (dp.articulo_nombre || codArt).trim(),
          und: (dp.und || '').trim(),
          grupo: (dp.grupo || '').trim(),
          grupoNombre: (dp.grupo_nombre || dp.grupo || 'SIN GRUPO').trim(),
          totalConsumo: 0,
          recetas: [],
        }
      }
      mapa[codArt].totalConsumo += total
      mapa[codArt].recetas.push({
        sku: receta,
        nombreReceta: nombrePorSku[receta] || receta,
        cantPorUnidad: parseFloat(dp.cant) || 0,
        vendidos,
        subtotal: total,
      })
    }

    for (const mod of sede.modificadores) {
      const nombreMod = (mod.modificador || '').trim()
      for (const mp of modInventario.value.filter(m => m.modificador === nombreMod)) {
        const codArt = (mp.articulo || '').trim()
        const cantMp = parseFloat(mp.cant) || 0
        const vendidos = mod.cantidadNeta || 0
        const delta = (mp.tipo === '-' ? -1 : 1) * cantMp * vendidos
        if (!mapa[codArt]) {
          mapa[codArt] = {
            codigo: codArt,
            nombre: (mp.articulo_nombre || codArt).trim(),
            und: (mp.und || '').trim(),
            grupo: (mp.grupo || '').trim(),
            grupoNombre: (mp.grupo || 'SIN GRUPO').trim(),
            totalConsumo: 0,
            recetas: [],
          }
        }
        mapa[codArt].totalConsumo += delta
        mapa[codArt].recetas.push({
          sku: mp.tipo === '-' ? 'MOD−' : 'MOD+',
          nombreReceta: (mp.tipo === '-' ? '[RESTA] ' : '') + nombreMod,
          cantPorUnidad: cantMp,
          vendidos,
          subtotal: delta,
        })
      }
    }

    sede.consumo = Object.values(mapa)
  } catch (e) {
    console.error('calcularConsumo:', e)
    sede.consumoError = e?.response?.data?.error || e.message || 'Error al calcular el consumo de inventario'
  } finally {
    sede.consumoLoading = false
  }
}

// ─── Detección de importaciones previas ───────────────
// Se hace con una llamada en seco al mismo endpoint de guardado: si ya existen
// registros responde `conflict` sin escribir nada.
async function verificarYaImportado() {
  for (const s of sedes.value) {
    s.yaImportado = 0
    if (!s.ccosto) continue
    try {
      const r = await api.post('/square/importar-resumen', {
        ...payloadDe(s), soloVerificar: true, force: false,
      })
      if (r.data?.conflict) s.yaImportado = r.data.total || r.data.count || 0
    } catch { /* si el endpoint no soporta la verificación, se avisa al guardar */ }
  }
}

function payloadDe(sede) {
  return {
    empresa: empresaCodigo.value,
    fecha: configFecha.value,
    ccosto: sede.ccosto,
    ccostoNombre: nombreCcosto(sede.ccosto),
    ventas: sede.ventas,
    pagos: sede.pagos,
    items: sede.items,
    consumoItems: sede.consumo || [],
    ctaSquare: sede.ctaSquare,          // propia de cada sede
    ctaOtros: configCtaOtros.value,     // global de la empresa
    ctaEfectivo: configCtaEfectivo.value,
    // Sobreprecio de plataformas: se guarda en ventas.otras_comisiones y genera
    // un gasto con la cuenta parametrizada en Configuración → General.
    otrasComisiones: otrasComisionesDe(sede),
  }
}

// ─── Totales y validaciones ───────────────────────────
const sedesListas = computed(() => sedes.value.filter(s => s.incluir && s.ccosto && s.ctaSquare))
const totalBrutas = computed(() => sedesListas.value.reduce((a, s) => a + s.ventas.ventasBrutas, 0))
const totalLista  = computed(() => sedesListas.value.reduce((a, s) => a + valoracion(s).listaTotal, 0))
const totalOtrasComisiones = computed(() =>
  sedesListas.value.reduce((a, s) => a + otrasComisionesDe(s), 0)
)
const hayOtrasComisiones = computed(() => totalOtrasComisiones.value > 0.01)
const totalRecibido = computed(() => sedesListas.value.reduce((a, s) => a + s.pagos.totalRecibido, 0))

// Sedes marcadas para importar que ya tienen datos y aún no autorizaron el
// reemplazo. El aviso de bloqueo sale en el pie, así que la acción para
// resolverlo va ahí mismo en vez de obligar a buscar las casillas arriba.
const sedesPorReemplazar = computed(() =>
  sedes.value.filter(s => s.incluir && s.ccosto && s.yaImportado && !s.force)
)
function autorizarReemplazo() {
  for (const s of sedesPorReemplazar.value) s.force = true
}
// Sedes que efectivamente van a sobreescribir datos existentes
const sedesQueReemplazan = computed(() =>
  sedes.value.filter(s => s.incluir && s.ccosto && s.yaImportado && s.force)
)

const bloqueo = computed(() => {
  if (!sedes.value.length) return ''
  if (!configFecha.value) return 'Falta la fecha de los movimientos.'
  if (!configCtaOtros.value || !configCtaEfectivo.value) {
    return 'Selecciona las cuentas de Efectivo y Otros pagos en la configuración.'
  }
  const sinCta = sedes.value.filter(s => s.incluir && s.ccosto && !s.ctaSquare)
  if (sinCta.length) {
    return `Falta la cuenta de Square de ${sinCta.map(s => s.location).join(', ')}.`
  }
  if (!sedesListas.value.length) return 'Ninguna sede está lista: revisa los centros de costo.'
  // Sin esta espera se podría guardar con `consumo` todavía vacío y el descargue
  // de inventario no quedaría registrado, sin ningún aviso.
  const calculando = sedesListas.value.filter(s => s.consumoLoading)
  if (calculando.length) {
    return `Calculando el consumo de inventario de ${calculando.map(s => s.location).join(', ')}…`
  }
  const dupCc = new Set()
  const dupCta = new Set()
  for (const s of sedesListas.value) {
    if (dupCc.has(s.ccosto)) return `Hay dos sedes asignadas al mismo centro de costo (${nombreCcosto(s.ccosto)}).`
    dupCc.add(s.ccosto)
    if (dupCta.has(s.ctaSquare)) return `Hay dos sedes usando la misma cuenta de Square (${nombreCuenta(s.ctaSquare)}).`
    dupCta.add(s.ctaSquare)
  }
  const noCuadra = sedesListas.value.filter(s => !s.control.cuadra)
  if (noCuadra.length) return `Los totales de ${noCuadra.map(s => s.location).join(', ')} no cuadran. Revisa el archivo.`
  const pendientes = sedesListas.value.filter(s => s.yaImportado && !s.force)
  if (pendientes.length) {
    return `${pendientes.map(s => s.location).join(', ')} ya está importado. Marca "Reemplazar" o desmarca la sede.`
  }
  return ''
})

// Cambiar la fecha invalida la comprobación de "ya importado" y, sobre todo,
// la casilla "Reemplazar": dejarla marcada de una fecha anterior haría que la
// importación BORRARA los datos de la fecha nueva. Se reinicia y se revisa otra vez.
watch(configFecha, () => {
  for (const s of sedes.value) {
    s.yaImportado = 0
    s.force = false
    s.resultado = null
  }
  if (sedes.value.length) verificarYaImportado()
})

// ─── Importación ──────────────────────────────────────
// El popup va mostrando el avance sede por sede. Se trabaja sobre una copia
// porque el bucle muta `incluir`, que es el campo por el que filtra `sedesListas`.
const dlgProgreso    = ref(false)
const sedesEnProceso = ref([])
const pasoActual     = ref(0)
const terminado      = ref(false)

const totalPasos           = computed(() => sedesEnProceso.value.length)
const importadasOk         = computed(() => sedesEnProceso.value.filter(s => s.estado === 'ok').length)
const fallaron             = computed(() => sedesEnProceso.value.some(s => s.estado === 'error'))
const totalRecibidoProceso = computed(() =>
  sedesEnProceso.value.filter(s => s.estado === 'ok').reduce((a, s) => a + s.pagos.totalRecibido, 0)
)

// Pausa mínima para que cada paso se alcance a ver. Guardar una sede suele
// tardar más que esto, así que en la práctica no agrega espera perceptible.
const respiro = (ms = 260) => new Promise(r => setTimeout(r, ms))

async function importarTodas() {
  const aImportar = [...sedesListas.value]
  if (!aImportar.length) return

  for (const s of aImportar) {
    s.estado = 'pendiente'
    s.resultado = null
    s.detalleGuardado = null
  }
  sedesEnProceso.value = aImportar
  pasoActual.value = 0
  terminado.value  = false
  dlgProgreso.value = true
  importando.value = true
  progreso.value = ''

  let ok = 0
  try {
    await respiro(320)   // deja entrar el popup antes del primer paso
    for (const s of aImportar) {
      s.estado = 'guardando'
      progreso.value = `Importando ${s.location}…`
      try {
        const r = await api.post('/square/importar-resumen', { ...payloadDe(s), force: !!s.force })
        if (r.data?.conflict) {
          s.yaImportado = r.data.total || r.data.count || 0
          s.estado = 'error'
          s.resultado = { ok: false, msg: 'Ya existía; marca "Reemplazar" para sobreescribir.' }
        } else if (r.data?.success) {
          s.detalleGuardado = r.data.data || null
          s.estado = 'ok'
          s.resultado = { ok: true, msg: `Importado en ${nombreCcosto(s.ccosto)}.` }
          s.incluir = false
          ok++
        } else {
          s.estado = 'error'
          s.resultado = { ok: false, msg: r.data?.error || 'Error al guardar' }
        }
      } catch (e) {
        s.estado = 'error'
        s.resultado = { ok: false, msg: e?.response?.data?.error || e.message || 'Error al guardar' }
      }
      pasoActual.value++
      await respiro()
    }
    progreso.value = `Listo: ${ok} de ${aImportar.length} sede(s) importada(s).`
    if (ok > 0) snackOk.value = true
  } finally {
    terminado.value = true
    importando.value = false
  }
}
</script>

<style scoped>
.ivc-wrap { padding: 24px; max-width: 1280px; margin: 0 auto; }

.ivc-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), .08);
  border-radius: 12px; padding: 16px;
}
.ivc-card-hdr { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.ivc-card-ttl { font-size: 12px; font-weight: 800; letter-spacing: .5px; }
.ivc-card-sub { font-size: 11px; color: rgba(var(--v-theme-on-surface), .45); margin-left: auto; }
.ivc-cfg-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; }
.ivc-cfg-nota {
  display: flex; align-items: flex-start; gap: 7px;
  margin-top: 12px; padding: 9px 11px; border-radius: 8px;
  background: var(--indigo-wash); color: var(--indigo);
  font-size: 11.5px; line-height: 1.45;
}
.ivc-cfg-nota-warn { background: rgba(180,83,9,.12); color: var(--warning); }
.ivc-field { display: flex; flex-direction: column; gap: 5px; }
.ivc-label {
  font-size: 9.5px; font-weight: 800; letter-spacing: .8px;
  color: rgba(var(--v-theme-on-surface), .5);
}
.ivc-label-sm { font-size: 9px; font-weight: 800; letter-spacing: .7px; color: rgba(var(--v-theme-on-surface), .45); }
.ivc-input {
  border: 1px solid rgba(var(--v-theme-on-surface), .18);
  background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface));
  border-radius: 8px; padding: 8px 10px; font-size: 13px; width: 100%;
}
.ivc-hint { font-size: 10.5px; }
.ivc-hint-ok { color: var(--success); }
.ivc-hint-warn { color: var(--warning); }
.ivc-link {
  border: none; background: transparent; cursor: pointer; padding: 0 2px;
  font-size: 11.5px; font-weight: 700; color: var(--indigo); text-decoration: underline;
}

/* Zona de carga */
.ivc-drop {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 46px 24px; border-radius: 14px; cursor: pointer;
  border: 2px dashed rgba(var(--v-theme-on-surface), .18);
  background: rgba(var(--v-theme-on-surface), .02);
  transition: border-color 150ms var(--ease-out), background-color 150ms var(--ease-out);
}
.ivc-drop:hover, .ivc-drop-on { border-color: var(--indigo); background: var(--indigo-wash); }
.ivc-drop-ttl { font-size: 14px; font-weight: 700; }
.ivc-drop-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface), .6); text-align: center; max-width: 520px; }
.ivc-drop-sub2 { font-size: 11px; color: rgba(var(--v-theme-on-surface), .4); }

.ivc-alert {
  display: flex; align-items: flex-start; gap: 9px;
  padding: 11px 14px; border-radius: 10px; font-size: 12.5px; margin-bottom: 14px;
}
.ivc-alert-err  { background: rgba(220,38,38,.1);  color: var(--error); }
.ivc-alert-warn { background: rgba(180,83,9,.12);  color: var(--warning); }

.ivc-file-row {
  display: flex; align-items: center; gap: 9px; margin-bottom: 14px;
  padding: 10px 14px; border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), .03);
}
.ivc-file-name { font-size: 12.5px; font-weight: 700; }
.ivc-file-meta { font-size: 11px; color: rgba(var(--v-theme-on-surface), .5); }

/* Sedes */
.ivc-sedes { display: flex; flex-direction: column; gap: 12px; }
.ivc-sede {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), .09);
  border-left: 3px solid var(--success);
  border-radius: 12px; padding: 14px 16px;
  transition: opacity 150ms var(--ease-out);
}
.ivc-sede-off { opacity: .5; border-left-color: rgba(var(--v-theme-on-surface), .2); }
.ivc-sede-mal { border-left-color: var(--error); }
.ivc-sede-hdr { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.ivc-check input, .ivc-check-inline input { width: 16px; height: 16px; accent-color: var(--success); cursor: pointer; }
.ivc-check-inline { display: inline-flex; align-items: center; gap: 5px; margin-left: 8px; font-weight: 700; cursor: pointer; }
.ivc-sede-id { min-width: 150px; }
.ivc-sede-loc { font-size: 15px; font-weight: 800; }
.ivc-sede-meta { font-size: 11px; color: rgba(var(--v-theme-on-surface), .5); margin-top: 1px; }
.ivc-sede-cc { min-width: 210px; display: flex; flex-direction: column; gap: 4px; }
.ivc-sede-total { margin-left: auto; text-align: right; }
.ivc-sede-total-lbl { font-size: 9.5px; font-weight: 800; letter-spacing: .7px; color: rgba(var(--v-theme-on-surface), .45); }
.ivc-sede-total-val { font-size: 19px; font-weight: 900; font-variant-numeric: tabular-nums; color: var(--success); }

.ivc-sede-aviso {
  display: flex; align-items: flex-start; gap: 7px;
  margin-top: 10px; padding: 8px 11px; border-radius: 8px; font-size: 11.5px; line-height: 1.45;
}
.ivc-sede-aviso-err  { background: rgba(220,38,38,.1);  color: var(--error); }
.ivc-sede-aviso-warn { background: rgba(180,83,9,.12);  color: var(--warning); }
.ivc-sede-aviso-info { background: var(--indigo-wash);  color: var(--indigo); }
.ivc-sede-aviso-ok   { background: rgba(21,128,61,.12); color: var(--success); }

/* Rejilla de indicadores: etiqueta arriba y valor abajo, para que todas las
   celdas queden alineadas aunque las etiquetas tengan largos muy distintos
   (antes se comparaban en la misma línea y unas saltaban a dos renglones). */
.ivc-grupos {
  margin-top: 12px; padding-top: 12px;
  border-top: 1px dashed rgba(var(--v-theme-on-surface), .1);
  display: flex; flex-direction: column; gap: 14px;
}
.ivc-grupo-ttl {
  font-size: 9px; font-weight: 800; letter-spacing: .9px;
  color: rgba(var(--v-theme-on-surface), .35); margin-bottom: 7px;
}
.ivc-sede-body {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(136px, 1fr));
  gap: 12px 16px;
}
.ivc-mini { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.ivc-mini-lbl {
  font-size: 10px; font-weight: 600; line-height: 1.3;
  letter-spacing: .2px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .45);
}
.ivc-mini-val {
  font-size: 13.5px; font-weight: 700; line-height: 1.25;
  font-variant-numeric: tabular-nums;
}
/* Separador antes del bloque de formas de pago */
.ivc-mini-sep { border-left: 1px solid rgba(var(--v-theme-on-surface), .1); padding-left: 14px; }
@media (max-width: 700px) { .ivc-mini-sep { border-left: none; padding-left: 0; } }
.ivc-neg { color: var(--error); }

/* Detalle antes de guardar */
.ivc-det-toggle {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  margin-top: 10px; padding-top: 9px;
  border-top: 1px dashed rgba(var(--v-theme-on-surface), .1);
}
.ivc-det-btn {
  display: flex; align-items: center; gap: 5px;
  border: none; background: transparent; cursor: pointer;
  font-size: 11.5px; font-weight: 700; color: var(--indigo);
  padding: 4px 6px; border-radius: 7px;
}
.ivc-det-btn:hover { background: var(--indigo-wash); }
.ivc-det-warn { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--warning); }

.ivc-det { margin-top: 10px; }
.ivc-tabs { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 9px; }
.ivc-tab {
  display: flex; align-items: center; gap: 6px;
  border: 1px solid rgba(var(--v-theme-on-surface), .12);
  background: transparent; color: rgba(var(--v-theme-on-surface), .6);
  font-size: 11.5px; font-weight: 600;
  padding: 6px 11px; border-radius: 8px; cursor: pointer;
}
.ivc-tab:hover { border-color: var(--indigo); color: var(--indigo); }
.ivc-tab-on { background: var(--indigo-wash); border-color: var(--indigo); color: var(--indigo); }
.ivc-tab-n {
  font-size: 10px; font-weight: 800;
  background: rgba(var(--v-theme-on-surface), .1);
  padding: 1px 6px; border-radius: 9px;
}
.ivc-tabla-wrap {
  max-height: 340px; overflow: auto;
  border: 1px solid rgba(var(--v-theme-on-surface), .08); border-radius: 9px;
}
.ivc-tabla { width: 100%; border-collapse: collapse; font-size: 11.5px; }
.ivc-tabla thead th {
  position: sticky; top: 0; z-index: 1;
  background: rgb(var(--v-theme-surface));
  text-align: left; padding: 8px 10px;
  font-size: 9.5px; font-weight: 800; letter-spacing: .5px;
  color: rgba(var(--v-theme-on-surface), .5);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .1);
  white-space: nowrap;
}
.ivc-tabla tbody td {
  padding: 6px 10px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .04);
}
.ivc-tabla tbody tr:hover { background: rgba(var(--v-theme-on-surface), .025); }
.ivc-tabla tfoot td {
  position: sticky; bottom: 0;
  background: rgba(var(--v-theme-on-surface), .04);
  padding: 8px 10px; font-size: 10px; font-weight: 800; letter-spacing: .4px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), .12);
}
.ivc-tabla .r { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.ivc-tabla .b { font-weight: 800; }
.ivc-tabla .dim { color: rgba(var(--v-theme-on-surface), .5); }
.ivc-td-nom { font-weight: 600; }
.ivc-td-alias { font-weight: 400; font-size: 10.5px; color: rgba(var(--v-theme-on-surface), .45); margin-left: 4px; }
.ivc-td-origen { max-width: 320px; }
.ivc-sku {
  font-family: var(--font-mono, monospace); font-size: 10.5px; font-weight: 700;
  background: rgba(var(--v-theme-on-surface), .07);
  padding: 1px 6px; border-radius: 4px;
}
.ivc-chip {
  display: inline-block; margin: 1px 3px 1px 0;
  font-size: 10px; font-weight: 600;
  background: rgba(var(--v-theme-on-surface), .07);
  color: rgba(var(--v-theme-on-surface), .7);
  padding: 1px 6px; border-radius: 4px;
}
.ivc-chip-ok { background: rgba(21,128,61,.14); color: var(--success); }
.ivc-tabla-vacia {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 24px; font-size: 12px; color: rgba(var(--v-theme-on-surface), .5); text-align: center;
}
.ivc-tabla-err { color: var(--error); }
.ivc-th-sub { font-weight: 600; opacity: .65; text-transform: none; letter-spacing: 0; }
.ivc-sobre { color: var(--warning); font-weight: 700; }
.ivc-det-err { color: var(--error); }

/* Conciliación de las dos valoraciones */
.ivc-conc {
  margin-top: 10px; padding: 12px 14px; border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), .03);
  border: 1px solid rgba(var(--v-theme-on-surface), .08);
}
.ivc-conc-ttl {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px; font-weight: 800; letter-spacing: .7px;
  color: rgba(var(--v-theme-on-surface), .55); margin-bottom: 10px;
}
.ivc-conc-body { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; }
.ivc-conc-lbl {
  font-size: 9.5px; font-weight: 800; letter-spacing: .6px;
  color: var(--indigo); margin-bottom: 6px;
}
.ivc-conc-row {
  display: flex; align-items: baseline; justify-content: space-between; gap: 12px;
  padding: 3px 0; font-size: 11.5px; color: rgba(var(--v-theme-on-surface), .7);
}
.ivc-conc-row span:last-child { font-variant-numeric: tabular-nums; font-weight: 600; }
.ivc-conc-row-tot {
  border-top: 1px solid rgba(var(--v-theme-on-surface), .1);
  margin-top: 4px; padding-top: 6px; font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
}
.ivc-conc-row-tot span:last-child { font-weight: 800; }
.ivc-conc-dif { color: var(--warning); font-weight: 700; }
.ivc-conc-dif-ok { color: var(--success); }
.ivc-conc-nota {
  font-size: 10.5px; line-height: 1.45;
  color: rgba(var(--v-theme-on-surface), .45); margin-top: 6px;
}

/* Footer */
.ivc-footer {
  display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;
  margin-top: 16px; padding: 16px 18px; border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), .03);
  border: 1px solid rgba(var(--v-theme-on-surface), .08);
}
.ivc-footer-tot { display: flex; gap: 28px; flex-wrap: wrap; }
.ivc-footer-item { display: flex; flex-direction: column; gap: 2px; }
.ivc-footer-lbl { font-size: 9.5px; font-weight: 800; letter-spacing: .7px; color: rgba(var(--v-theme-on-surface), .45); }
.ivc-footer-val { font-size: 15px; font-weight: 800; font-variant-numeric: tabular-nums; }
.ivc-footer-val-big { font-size: 21px; font-weight: 900; color: var(--success); }
.ivc-footer-act { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.ivc-bloqueo {
  display: flex; align-items: flex-start; gap: 6px; max-width: 420px;
  font-size: 11.5px; line-height: 1.45; color: var(--warning);
}
.ivc-btn-reemplazar {
  display: inline-flex; align-items: center; gap: 5px; margin-top: 6px;
  border: 1px solid var(--warning); background: transparent; color: var(--warning);
  font-size: 11.5px; font-weight: 700; cursor: pointer;
  padding: 5px 11px; border-radius: 8px;
  transition: background-color 150ms var(--ease-out), color 150ms var(--ease-out);
}
.ivc-btn-reemplazar:hover { background: var(--warning); color: white; }
.ivc-aviso-reemplazo {
  display: flex; align-items: center; gap: 6px; max-width: 380px;
  font-size: 11.5px; line-height: 1.4; color: var(--error); font-weight: 600;
}
@media (prefers-reduced-motion: reduce) { .ivc-btn-reemplazar { transition: none; } }
.ivc-progreso { margin-top: 10px; font-size: 12px; color: rgba(var(--v-theme-on-surface), .6); }

/* ══════ POPUP DE PROGRESO ══════ */
.prg-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 16px; overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,.4);
  animation: prgEntra 240ms cubic-bezier(.23,1,.32,1);
}
/* Nunca desde scale(0): nada en la vida real aparece de la nada */
@keyframes prgEntra {
  from { opacity: 0; transform: scale(.96) translateY(8px); }
  to   { opacity: 1; transform: none; }
}

.prg-hdr {
  display: flex; align-items: center; gap: 13px;
  padding: 18px 20px 16px;
}
.prg-hdr-icon {
  width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--indigo);
  transition: background-color 260ms cubic-bezier(.23,1,.32,1);
}
.prg-icon-ok  { background: var(--success); animation: prgPop 320ms cubic-bezier(.23,1,.32,1); }
.prg-icon-err { background: var(--error);   animation: prgPop 320ms cubic-bezier(.23,1,.32,1); }
@keyframes prgPop {
  0%   { transform: scale(.88); }
  55%  { transform: scale(1.06); }
  100% { transform: scale(1); }
}
.prg-ttl { font-size: 15.5px; font-weight: 800; }
.prg-sub { font-size: 11.5px; color: rgba(var(--v-theme-on-surface),.5); margin-top: 2px; }
.prg-pct {
  margin-left: auto; font-size: 19px; font-weight: 900;
  font-variant-numeric: tabular-nums; color: rgba(var(--v-theme-on-surface),.35);
}

.prg-barra { height: 3px; background: rgba(var(--v-theme-on-surface),.08); }
.prg-barra-fill {
  height: 100%; background: var(--indigo);
  transition: width 340ms cubic-bezier(.23,1,.32,1), background-color 260ms ease-out;
}
.prg-barra-err { background: var(--error); }

.prg-lista { padding: 8px 10px; max-height: 45vh; overflow-y: auto; }
.prg-paso {
  display: flex; align-items: flex-start; gap: 11px;
  padding: 11px 10px; border-radius: 10px;
  animation: prgFila 260ms cubic-bezier(.23,1,.32,1) both;
  animation-delay: var(--d, 0ms);
  transition: background-color 220ms ease-out, opacity 220ms ease-out;
}
@keyframes prgFila {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: none; }
}
.prg-paso-pendiente { opacity: .45; }
.prg-paso-guardando { background: var(--indigo-wash); }
.prg-paso-error     { background: rgba(220,38,38,.08); }

.prg-paso-icon {
  width: 20px; height: 20px; flex-shrink: 0; margin-top: 1px;
  display: flex; align-items: center; justify-content: center;
}
.prg-punto {
  width: 7px; height: 7px; border-radius: 50%;
  border: 1.5px solid rgba(var(--v-theme-on-surface),.28);
}
.prg-paso-txt { flex: 1; min-width: 0; }
.prg-paso-loc { font-size: 13px; font-weight: 700; }
.prg-paso-cc  { font-weight: 500; font-size: 11.5px; color: rgba(var(--v-theme-on-surface),.5); margin-left: 4px; }
.prg-paso-det {
  font-size: 11px; color: rgba(var(--v-theme-on-surface),.55);
  margin-top: 3px; display: flex; flex-wrap: wrap; gap: 4px; line-height: 1.5;
}
.prg-chip {
  font-size: 10px; font-weight: 700;
  background: rgba(21,128,61,.13); color: var(--success);
  padding: 1px 7px; border-radius: 10px;
  animation: prgFila 200ms ease-out both;
}
.prg-paso-monto {
  font-size: 13px; font-weight: 800; font-variant-numeric: tabular-nums;
  margin-top: 1px; white-space: nowrap;
}

.prg-resumen {
  margin: 4px 14px 0; padding: 11px 13px; border-radius: 10px;
  background: rgba(21,128,61,.1); color: var(--success);
  font-size: 12px; line-height: 1.5;
  animation: prgFila 300ms cubic-bezier(.23,1,.32,1) both;
}
.prg-resumen-err { background: rgba(180,83,9,.12); color: var(--warning); }

.prg-pie {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 18px 16px;
}
.prg-espera { font-size: 11.5px; color: rgba(var(--v-theme-on-surface),.45); }

/* Sin movimiento: se conserva el cambio de opacidad y color, se quitan los
   desplazamientos y los rebotes. */
@media (prefers-reduced-motion: reduce) {
  .prg-card, .prg-paso, .prg-chip, .prg-resumen { animation: none; }
  .prg-icon-ok, .prg-icon-err { animation: none; }
  .prg-barra-fill { transition: none; }
}

@media (prefers-reduced-motion: reduce) {
  .ivc-drop, .ivc-sede { transition: none; }
}
</style>
