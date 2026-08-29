<template>
  <MainLayout>
    <div class="cp-wrap">

      <!-- BREADCRUMB -->
      <div class="cp-breadcrumb">
        <span class="bc-root">TESORERÍA</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Procesos</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Cuentas por Pagar</span>
      </div>

      <!-- HEADER -->
      <div class="cp-header">
        <div class="cp-header-left">
          <div class="cp-icon-wrap">
            <v-icon size="24" color="white">mdi-cash-clock</v-icon>
          </div>
          <div>
            <h1 class="cp-title">CUENTAS POR PAGAR</h1>
            <p class="cp-sub">Gastos registrados sin pagar · Abona total o parcialmente y el banco se mueve en la fecha real del pago</p>
          </div>
        </div>
        <div class="cp-header-right">
          <select v-model="filtroEstado" class="cp-select" @change="cargar">
            <option value="ABIERTAS">Pendientes y parciales</option>
            <option value="PENDIENTE">Solo pendientes</option>
            <option value="PARCIAL">Solo parciales</option>
            <option value="PAGADA">Pagadas</option>
            <option value="">Todas</option>
          </select>
          <select v-model="filtroProveedor" class="cp-select" @change="cargar">
            <option value="">Todos los proveedores</option>
            <option v-for="p in proveedoresConSaldo" :key="p.proveedor" :value="p.proveedor">
              {{ p.proveedor_nombre }}
            </option>
          </select>
          <div class="cp-fechas">
            <CampoFecha v-model="desde" class="cp-date" autocomplete="off" />
            <span class="cp-date-sep">→</span>
            <CampoFecha v-model="hasta" class="cp-date" autocomplete="off" />
          </div>
          <v-btn color="#0369a1" variant="flat" prepend-icon="mdi-refresh" :loading="loading" rounded="lg" @click="cargar">
            Actualizar
          </v-btn>
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="loading" class="cp-loading">
        <v-progress-circular indeterminate color="#0369a1" size="48" />
        <p>Cargando cuentas por pagar...</p>
      </div>

      <template v-else>

        <!-- KPIs -->
        <div class="cp-kpis">
          <div class="cp-kpi">
            <div class="cp-kpi-accent" style="background:#ef4444"></div>
            <div class="cp-kpi-body">
              <div class="cp-kpi-lbl">Total por Pagar</div>
              <div class="cp-kpi-val" style="color:#ef4444">{{ money(k.total_por_pagar) }}</div>
              <div class="cp-kpi-foot">{{ k.num_cuentas }} cuenta(s) abiertas</div>
            </div>
          </div>
          <div class="cp-kpi">
            <div class="cp-kpi-accent" style="background:#0369a1"></div>
            <div class="cp-kpi-body">
              <div class="cp-kpi-lbl">Proveedores</div>
              <div class="cp-kpi-val">{{ k.num_proveedores }}</div>
              <div class="cp-kpi-foot">con saldo pendiente</div>
            </div>
          </div>
          <div class="cp-kpi">
            <div class="cp-kpi-accent" style="background:#22c55e"></div>
            <div class="cp-kpi-body">
              <div class="cp-kpi-lbl">Abonado</div>
              <div class="cp-kpi-val" style="color:#22c55e">{{ money(k.total_abonado) }}</div>
              <div class="cp-kpi-foot">de {{ money(k.total_facturado) }} facturado</div>
            </div>
          </div>
          <div class="cp-kpi">
            <div class="cp-kpi-accent" style="background:#f0a83c"></div>
            <div class="cp-kpi-body">
              <div class="cp-kpi-lbl">Mayor Acreedor</div>
              <div class="cp-kpi-val" style="font-size:15px">
                {{ k.mayor_saldo ? money(k.mayor_saldo.saldo) : '—' }}
              </div>
              <div class="cp-kpi-foot">{{ k.mayor_saldo?.proveedor_nombre || 'Sin saldos' }}</div>
            </div>
          </div>
        </div>

        <!-- ANTIGÜEDAD DEL SALDO -->
        <div v-if="k.total_por_pagar > 0" class="cp-card">
          <div class="cp-card-head">
            <v-icon size="16" color="#0369a1">mdi-timer-sand</v-icon>
            Antigüedad del saldo
            <span class="cp-card-note">días transcurridos desde la fecha del gasto</span>
          </div>
          <div class="cp-aging">
            <div v-for="b in agingBuckets" :key="b.lbl" class="cp-aging-item">
              <div class="cp-aging-bar-wrap">
                <div class="cp-aging-bar" :style="{ height: alturaBucket(b.val), background: b.color }"></div>
              </div>
              <div class="cp-aging-val" :style="{ color: b.val > 0 ? b.color : undefined }">{{ money(b.val) }}</div>
              <div class="cp-aging-lbl">{{ b.lbl }}</div>
            </div>
          </div>
        </div>

        <!-- EMPTY -->
        <div v-if="!cuentas.length" class="cp-empty">
          <v-icon size="48" color="rgba(var(--v-theme-on-surface),0.2)">mdi-check-circle-outline</v-icon>
          <p>No hay cuentas por pagar con estos filtros.</p>
          <span class="cp-empty-hint">
            Para crear una, ve a Contabilidad → Gestión de Gastos y marca
            <strong>“Dejar como cuenta por pagar”</strong> al registrar el gasto.
          </span>
        </div>

        <!-- TABLA -->
        <div v-else class="cp-card">
          <div class="cp-card-head">
            <v-icon size="16" color="#0369a1">mdi-format-list-bulleted</v-icon>
            Cuentas por pagar
            <input v-model="busqueda" placeholder="Buscar proveedor o factura..." class="cp-search" autocomplete="off" />
          </div>

          <!-- BARRA DE SELECCIÓN MÚLTIPLE -->
          <div v-if="seleccion.size > 0" class="cp-selbar">
            <span class="cp-selbar-txt">
              <strong>{{ seleccion.size }}</strong> factura{{ seleccion.size !== 1 ? 's' : '' }} seleccionada{{ seleccion.size !== 1 ? 's' : '' }}
              · {{ money(totalSeleccion) }}
            </span>
            <v-btn size="small" variant="text" @click="limpiarSeleccion">Quitar selección</v-btn>
            <v-btn size="small" variant="flat" color="#0369a1" rounded="lg" prepend-icon="mdi-cash-multiple" @click="abrirPagoMultiple">
              Pagar seleccionadas
            </v-btn>
          </div>

          <div class="cp-table-scroll">
            <table class="cp-table">
              <thead>
                <tr>
                  <th class="th-mini">
                    <input
                      type="checkbox" class="cp-checkbox"
                      :checked="todasSeleccionadas" :indeterminate.prop="algunasSeleccionadas"
                      :disabled="!cuentasSeleccionables.length"
                      @click.stop="toggleSeleccionTodas"
                    />
                  </th>
                  <th class="th-mini"></th>
                  <th class="th-nom">PROVEEDOR</th>
                  <th class="th-nom">FACTURA</th>
                  <th class="th-nom">FECHA</th>
                  <th class="th-num">DÍAS</th>
                  <th class="th-num">TOTAL</th>
                  <th class="th-num">ABONADO</th>
                  <th class="th-num">SALDO</th>
                  <th class="th-nom">ESTADO</th>
                  <th class="th-mini"></th>
                </tr>
              </thead>
              <tbody>
                <template v-for="c in cuentasFiltradas" :key="c.grupo">
                  <tr class="cp-tr" :class="{ 'cp-tr-open': expandido === c.grupo }" @click="toggle(c)">
                    <td class="td-mini">
                      <input
                        v-if="c.estado !== 'PAGADA'"
                        type="checkbox" class="cp-checkbox"
                        :checked="seleccion.has(c.grupo)"
                        @click.stop="toggleSeleccion(c)"
                      />
                    </td>
                    <td class="td-mini">
                      <v-icon size="16" class="cp-chevron" :class="{ 'cp-chevron--open': expandido === c.grupo }">
                        mdi-chevron-right
                      </v-icon>
                    </td>
                    <td class="td-nom">
                      {{ c.proveedor_nombre }}
                      <span v-if="c.num_lineas > 1" class="cp-chip">{{ c.num_lineas }} líneas</span>
                    </td>
                    <td class="td-nom td-dim">{{ c.factura || '—' }}</td>
                    <td class="td-nom td-dim">{{ fecha(c.fecha) }}</td>
                    <td class="td-num" :style="{ color: colorDias(c) }">{{ c.estado === 'PAGADA' ? '—' : c.dias }}</td>
                    <td class="td-num">{{ money(c.total) }}</td>
                    <td class="td-num" :style="{ color: c.pagado > 0 ? '#22c55e' : undefined }">
                      {{ c.pagado > 0 ? money(c.pagado) : '—' }}
                    </td>
                    <td class="td-num td-saldo" :style="{ color: c.saldo > 0.01 ? '#ef4444' : '#22c55e' }">
                      {{ money(c.saldo) }}
                    </td>
                    <td class="td-nom">
                      <span class="cp-badge" :class="`cp-badge--${c.estado.toLowerCase()}`">{{ c.estado }}</span>
                    </td>
                    <td class="td-mini">
                      <v-btn
                        v-if="c.estado !== 'PAGADA'"
                        size="small" variant="tonal" color="#0369a1" rounded="lg"
                        @click.stop="abrirPago(c)"
                      >
                        Abonar
                      </v-btn>
                    </td>
                  </tr>

                  <!-- DETALLE -->
                  <tr v-if="expandido === c.grupo" class="cp-tr-detalle">
                    <td colspan="11">
                      <div v-if="loadingDetalle" class="cp-detalle-load">
                        <v-progress-circular indeterminate color="#0369a1" size="22" />
                        <span>Cargando detalle...</span>
                      </div>
                      <div v-else-if="detalle" class="cp-detalle">

                        <!-- Líneas del gasto -->
                        <div class="cp-sub-title">
                          <v-icon size="14" color="#0369a1">mdi-call-split</v-icon>
                          Distribución del gasto
                        </div>
                        <table class="cp-subtable">
                          <thead>
                            <tr>
                              <th class="th-nom">CÓDIGO</th>
                              <th class="th-nom">CENTRO DE COSTO</th>
                              <th class="th-nom">CUENTA CONTABLE</th>
                              <th class="th-nom">CONCEPTO</th>
                              <th class="th-num">TOTAL</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="l in detalle.lineas" :key="l.codigo">
                              <td class="td-dim">{{ l.codigo }}</td>
                              <td>{{ l.ccosto_nombre || '—' }}</td>
                              <td>{{ l.cuenta_nombre || '—' }}</td>
                              <td>{{ l.concepto || '—' }}</td>
                              <td class="td-num">{{ money(l.total) }}</td>
                            </tr>
                          </tbody>
                        </table>

                        <!-- Historial de abonos -->
                        <div class="cp-sub-title">
                          <v-icon size="14" color="#22c55e">mdi-cash-multiple</v-icon>
                          Abonos registrados
                        </div>
                        <div v-if="!detalle.pagos.length" class="cp-sin-pagos">
                          Todavía no se le ha abonado nada a esta cuenta.
                        </div>
                        <table v-else class="cp-subtable">
                          <thead>
                            <tr>
                              <th class="th-nom">FECHA</th>
                              <th class="th-nom">CUENTA BANCARIA</th>
                              <th class="th-nom">CHEQUE</th>
                              <th class="th-nom">MOVIMIENTO</th>
                              <th class="th-nom">OBSERVACIONES</th>
                              <th class="th-num">VALOR</th>
                              <th class="th-mini"></th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="p in detalle.pagos" :key="p.id">
                              <td>{{ fecha(p.fecha) }}</td>
                              <td>{{ p.banco_nombre || '—' }}</td>
                              <td class="td-dim">{{ p.cheque || '—' }}</td>
                              <td class="td-dim">{{ p.moviban || '—' }}</td>
                              <td class="td-dim">{{ p.observaciones || '—' }}</td>
                              <td class="td-num" style="color:#22c55e">{{ money(p.valor) }}</td>
                              <td class="td-mini">
                                <v-btn
                                  icon variant="text" size="x-small" color="error"
                                  title="Reversar este abono (borra su movimiento bancario)"
                                  @click.stop="confirmarReverso(p)"
                                >
                                  <v-icon size="15">mdi-undo-variant</v-icon>
                                </v-btn>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
              <tfoot>
                <tr class="cp-tfoot">
                  <td colspan="6">TOTALES ({{ cuentasFiltradas.length }})</td>
                  <td class="td-num">{{ money(totales.total) }}</td>
                  <td class="td-num" style="color:#22c55e">{{ money(totales.pagado) }}</td>
                  <td class="td-num" style="color:#ef4444">{{ money(totales.saldo) }}</td>
                  <td colspan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </template>

      <!-- ══ DIÁLOGO: REGISTRAR ABONO ══ -->
      <v-dialog v-model="dlgPago" max-width="520" persistent>
        <v-card class="cp-dlg">
          <div class="cp-dlg-head">
            <v-icon size="19" color="#0369a1">mdi-cash-plus</v-icon>
            <span>Registrar abono</span>
          </div>

          <div v-if="pagoCuenta" class="cp-dlg-body">
            <div class="cp-dlg-resumen">
              <div class="cp-dlg-row">
                <span>Proveedor</span>
                <strong>{{ pagoCuenta.proveedor_nombre }}</strong>
              </div>
              <div class="cp-dlg-row">
                <span>Factura</span>
                <strong>{{ pagoCuenta.factura || '—' }}</strong>
              </div>
              <div class="cp-dlg-row">
                <span>Saldo pendiente</span>
                <strong style="color:#ef4444">{{ money(pagoCuenta.saldo) }}</strong>
              </div>
            </div>

            <CampoFecha
              v-model="pagoForm.fecha" label="Fecha del pago *" autocomplete="off"
              variant="outlined" density="comfortable" hide-details class="mb-3"
            />

            <v-autocomplete
              v-model="pagoForm.banco"
              label="Cuenta bancaria *" autocomplete="off"
              variant="outlined" density="comfortable" hide-details class="mb-3"
              :items="cuentasBancarias"
              item-title="nombre_cta" item-value="codigo"
              prepend-inner-icon="mdi-bank-outline"
              no-data-text="No hay cuentas bancarias"
              clearable
            />

            <div class="cp-dlg-monto">
              <v-text-field
                v-model="pagoForm.valor"
                label="Valor del abono *" prefix="$" autocomplete="off"
                variant="outlined" density="comfortable" hide-details
                type="text" inputmode="decimal"
              />
              <v-btn variant="tonal" color="#0369a1" size="small" @click="pagoForm.valor = pagoCuenta.saldo">
                Todo el saldo
              </v-btn>
            </div>

            <v-text-field
              v-if="muestraCheque"
              v-model="pagoForm.cheque"
              label="N° Cheque (sugerido, editable)" autocomplete="off"
              variant="outlined" density="comfortable" hide-details class="mt-3"
              type="text" inputmode="numeric"
              prepend-inner-icon="mdi-checkbook"
              @input="pagoForm.cheque = pagoForm.cheque.replace(/[^0-9]/g, '')"
            />

            <v-text-field
              v-model="pagoForm.observaciones"
              label="Observaciones" autocomplete="off"
              variant="outlined" density="comfortable" hide-details class="mt-3"
              maxlength="200" placeholder="Opcional"
            />

            <v-alert v-if="pagoError" type="error" variant="tonal" density="compact" class="mt-3">
              {{ pagoError }}
            </v-alert>

            <div class="cp-dlg-nota">
              <v-icon size="13" color="#0369a1">mdi-information-outline</v-icon>
              Se creará un movimiento bancario de egreso por {{ money(toNum(pagoForm.valor)) }}
              en la cuenta seleccionada.
            </div>
          </div>

          <div class="cp-dlg-foot">
            <v-btn variant="text" @click="dlgPago = false">Cancelar</v-btn>
            <v-btn color="#0369a1" variant="flat" :loading="guardandoPago" @click="guardarPago">
              Registrar abono
            </v-btn>
          </div>
        </v-card>
      </v-dialog>

      <!-- ══ DIÁLOGO: PAGO MÚLTIPLE ══ -->
      <v-dialog v-model="dlgPagoMultiple" max-width="640" persistent scrollable>
        <v-card class="cp-dlg">
          <div class="cp-dlg-head">
            <v-icon size="19" color="#0369a1">mdi-cash-multiple</v-icon>
            <span>Pago múltiple · {{ pagoMultipleLineas.length }} factura{{ pagoMultipleLineas.length !== 1 ? 's' : '' }}</span>
          </div>

          <v-card-text class="cp-dlg-body">
            <table class="cp-subtable cp-multi-tabla">
              <thead>
                <tr>
                  <th class="th-nom">PROVEEDOR</th>
                  <th class="th-nom">FACTURA</th>
                  <th class="th-num">SALDO</th>
                  <th class="th-num">A PAGAR</th>
                  <th class="th-mini"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(l, i) in pagoMultipleLineas" :key="l.grupo">
                  <td class="td-nom">{{ l.proveedor_nombre }}</td>
                  <td class="td-dim">{{ l.factura || '—' }}</td>
                  <td class="td-num td-dim">{{ money(l.saldo) }}</td>
                  <td class="td-num">
                    <input
                      v-model="l.valor" type="text" inputmode="decimal"
                      class="cp-multi-input" autocomplete="off"
                    />
                  </td>
                  <td class="td-mini">
                    <v-btn icon variant="text" size="x-small" color="error" title="Quitar de la selección"
                      @click="quitarDePagoMultiple(i)">
                      <v-icon size="15">mdi-close</v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="font-weight:800">TOTAL DEL PAGO</td>
                  <td class="td-num" style="font-weight:800">{{ money(totalPagoMultiple) }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>

            <CampoFecha
              v-model="pagoMultipleForm.fecha" label="Fecha del pago *" autocomplete="off"
              variant="outlined" density="comfortable" hide-details class="mt-4 mb-3"
            />

            <v-autocomplete
              v-model="pagoMultipleForm.banco"
              label="Cuenta bancaria *" autocomplete="off"
              variant="outlined" density="comfortable" hide-details class="mb-3"
              :items="cuentasBancarias"
              item-title="nombre_cta" item-value="codigo"
              prepend-inner-icon="mdi-bank-outline"
              no-data-text="No hay cuentas bancarias"
              clearable
            />

            <v-text-field
              v-if="muestraChequeMultiple"
              v-model="pagoMultipleForm.cheque"
              label="N° Cheque (sugerido, editable)" autocomplete="off"
              variant="outlined" density="comfortable" hide-details class="mb-3"
              type="text" inputmode="numeric"
              prepend-inner-icon="mdi-checkbook"
              @input="pagoMultipleForm.cheque = pagoMultipleForm.cheque.replace(/[^0-9]/g, '')"
            />

            <v-text-field
              v-model="pagoMultipleForm.observaciones"
              label="Observaciones" autocomplete="off"
              variant="outlined" density="comfortable" hide-details
              maxlength="200" placeholder="Opcional"
            />

            <v-alert v-if="pagoMultipleError" type="error" variant="tonal" density="compact" class="mt-3">
              {{ pagoMultipleError }}
            </v-alert>

            <div class="cp-dlg-nota">
              <v-icon size="13" color="#0369a1">mdi-information-outline</v-icon>
              Se creará un único movimiento bancario de egreso por {{ money(totalPagoMultiple) }},
              repartido entre las {{ pagoMultipleLineas.length }} factura{{ pagoMultipleLineas.length !== 1 ? 's' : '' }} de arriba.
            </div>
          </v-card-text>

          <div class="cp-dlg-foot">
            <v-btn variant="text" @click="dlgPagoMultiple = false">Cancelar</v-btn>
            <v-btn
              color="#0369a1" variant="flat" :loading="guardandoPago"
              :disabled="!pagoMultipleLineas.length"
              @click="guardarPagoMultiple"
            >
              Registrar pago
            </v-btn>
          </div>
        </v-card>
      </v-dialog>

      <!-- ══ DIÁLOGO: CONFIRMAR REVERSO ══ -->
      <v-dialog v-model="dlgReverso" max-width="440">
        <v-card class="cp-dlg">
          <div class="cp-dlg-head">
            <v-icon size="19" color="#ef4444">mdi-undo-variant</v-icon>
            <span>Reversar abono</span>
          </div>
          <div class="cp-dlg-body">
            <p class="cp-dlg-texto">
              Se eliminará el movimiento bancario
              <strong>{{ pagoAReversar?.moviban || '—' }}</strong>
              por <strong>{{ money(pagoAReversar?.valor) }}</strong>
              y la cuenta volverá a quedar con saldo pendiente.
            </p>
            <v-alert v-if="pagoError" type="error" variant="tonal" density="compact" class="mt-3">
              {{ pagoError }}
            </v-alert>
          </div>
          <div class="cp-dlg-foot">
            <v-btn variant="text" @click="dlgReverso = false">Cancelar</v-btn>
            <v-btn color="error" variant="flat" :loading="guardandoPago" @click="reversarPago">
              Reversar
            </v-btn>
          </div>
        </v-card>
      </v-dialog>

      <v-snackbar v-model="snackOpen" :color="snackColor" timeout="3500">{{ snackMsg }}</v-snackbar>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { cuentasPorPagarService } from '../../services/cuentas-por-pagar.service'
import { cuentasBancariasService } from '../../services/cuentasbancarias.service'

// ─── Estado ───────────────────────────────────────────────────────
const loading  = ref(false)
const cuentas  = ref([])
const kpis     = ref({})
const ranking  = ref([])
const busqueda = ref('')

const filtroEstado    = ref('ABIERTAS')
const filtroProveedor = ref('')

function haceMeses(n) {
  const d = new Date(); d.setMonth(d.getMonth() - n); d.setDate(1)
  return d.toISOString().slice(0, 10)
}
const desde = ref(haceMeses(11))
const hasta = ref(new Date().toISOString().slice(0, 10))

const k = computed(() => kpis.value || {})
// El select de proveedores se llena con el ranking de la última carga sin filtro
// de proveedor, para no perder las opciones al filtrar por uno.
const proveedoresConSaldo = ref([])

const cuentasFiltradas = computed(() => {
  if (busqueda.value.trim().length < 2) return cuentas.value
  const q = busqueda.value.trim().toLowerCase()
  return cuentas.value.filter(c =>
    (c.proveedor_nombre || '').toLowerCase().includes(q) ||
    (c.factura || '').toLowerCase().includes(q)
  )
})

const totales = computed(() => ({
  total:  cuentasFiltradas.value.reduce((s, c) => s + c.total, 0),
  pagado: cuentasFiltradas.value.reduce((s, c) => s + c.pagado, 0),
  saldo:  cuentasFiltradas.value.reduce((s, c) => s + c.saldo, 0),
}))

const agingBuckets = computed(() => {
  const a = k.value.antiguedad || {}
  return [
    { lbl: '0-30 días',  val: a.d0_30   || 0, color: '#22c55e' },
    { lbl: '31-60 días', val: a.d31_60  || 0, color: '#f0a83c' },
    { lbl: '61-90 días', val: a.d61_90  || 0, color: '#f97316' },
    { lbl: '+90 días',   val: a.d90_mas || 0, color: '#ef4444' },
  ]
})
function alturaBucket(v) {
  const max = Math.max(...agingBuckets.value.map(b => b.val), 1)
  return `${Math.max(4, (v / max) * 100)}%`
}
function colorDias(c) {
  if (c.estado === 'PAGADA') return undefined
  if (c.dias > 90) return '#ef4444'
  if (c.dias > 60) return '#f97316'
  if (c.dias > 30) return '#f0a83c'
  return undefined
}

// ─── Carga ────────────────────────────────────────────────────────
async function cargar() {
  loading.value = true
  try {
    const params = { desde: desde.value, hasta: hasta.value }
    if (filtroProveedor.value) params.proveedor = filtroProveedor.value
    // 'ABIERTAS' no es un estado del backend: se pide todo y se filtra aquí.
    if (filtroEstado.value && filtroEstado.value !== 'ABIERTAS') params.estado = filtroEstado.value

    const r = await cuentasPorPagarService.getCuentas(params)
    let lista = r.cuentas || []
    if (filtroEstado.value === 'ABIERTAS') lista = lista.filter(c => c.estado !== 'PAGADA')

    cuentas.value = lista
    kpis.value    = r.kpis || {}
    ranking.value = r.rankingProveedores || []
    if (!filtroProveedor.value) proveedoresConSaldo.value = r.rankingProveedores || []

    // Quita de la selección lo que ya no está pendiente (p.ej. quedó pagado)
    const vigentes = new Set(lista.filter(c => c.estado !== 'PAGADA').map(c => c.grupo))
    seleccion.value = new Set([...seleccion.value].filter(g => vigentes.has(g)))
  } catch (e) {
    console.error('Error cargando cuentas por pagar:', e)
    snack(e.response?.data?.error || 'No se pudieron cargar las cuentas por pagar', 'error')
  } finally {
    loading.value = false
  }
}

// ─── Detalle expandible ───────────────────────────────────────────
const expandido      = ref(null)
const detalle        = ref(null)
const loadingDetalle = ref(false)

async function toggle(c) {
  if (expandido.value === c.grupo) { expandido.value = null; detalle.value = null; return }
  expandido.value = c.grupo
  detalle.value = null
  loadingDetalle.value = true
  try {
    const r = await cuentasPorPagarService.getDetalle(c.grupo)
    detalle.value = r
  } catch (e) {
    console.error('Error cargando detalle CxP:', e)
    snack('No se pudo cargar el detalle', 'error')
    expandido.value = null
  } finally {
    loadingDetalle.value = false
  }
}

// ─── Abonos ───────────────────────────────────────────────────────
const cuentasBancarias = ref([])
const dlgPago       = ref(false)
const pagoCuenta    = ref(null)
const pagoError     = ref('')
const guardandoPago = ref(false)
const pagoForm = ref({ fecha: '', banco: '', valor: '', cheque: '', observaciones: '' })

// El N° de cheque solo se pide si la cuenta bancaria lleva consecutivo configurado
const muestraCheque = computed(() => {
  const cta = cuentasBancarias.value.find(c => c.codigo === pagoForm.value.banco)
  const v = parseInt(cta?.cheque)
  return !isNaN(v) && v > 0
})

// Al elegir la cuenta, se sugiere el siguiente consecutivo de cheque; el
// usuario lo puede editar si va a usar uno distinto (p.ej. quemó uno a mano).
watch(() => pagoForm.value.banco, (codigo) => {
  const cta = cuentasBancarias.value.find(c => c.codigo === codigo)
  const v = parseInt(cta?.cheque)
  pagoForm.value.cheque = (!isNaN(v) && v > 0) ? String(v) : ''
})

function toNum(v) { return parseFloat(String(v ?? '').replace(',', '.')) || 0 }

function abrirPago(c) {
  pagoCuenta.value = c
  pagoError.value  = ''
  pagoForm.value = {
    fecha: new Date().toISOString().slice(0, 10),
    banco: '',
    valor: c.saldo,
    cheque: '',
    observaciones: '',
  }
  dlgPago.value = true
}

async function guardarPago() {
  pagoError.value = ''
  const valor = toNum(pagoForm.value.valor)
  if (!pagoForm.value.fecha) { pagoError.value = 'La fecha es requerida'; return }
  if (!pagoForm.value.banco) { pagoError.value = 'Selecciona la cuenta bancaria'; return }
  if (!(valor > 0))          { pagoError.value = 'El valor del abono debe ser mayor a 0'; return }
  if (valor > pagoCuenta.value.saldo + 0.01) {
    pagoError.value = `El abono supera el saldo pendiente (${money(pagoCuenta.value.saldo)})`
    return
  }

  guardandoPago.value = true
  try {
    const r = await cuentasPorPagarService.registrarPago(pagoCuenta.value.grupo, {
      fecha: pagoForm.value.fecha,
      banco: pagoForm.value.banco,
      valor,
      cheque: muestraCheque.value ? (pagoForm.value.cheque || null) : null,
      observaciones: pagoForm.value.observaciones || null,
    })
    dlgPago.value = false
    snack(
      r.data?.estado === 'PAGADA'
        ? 'Cuenta pagada por completo'
        : `Abono registrado · saldo restante ${money(r.data?.saldo_restante)}`,
      'success'
    )
    const grupoAbierto = expandido.value
    await cargar()
    if (grupoAbierto) {
      const c = cuentas.value.find(x => x.grupo === grupoAbierto)
      expandido.value = null
      if (c) await toggle(c)
    }
  } catch (e) {
    pagoError.value = e.response?.data?.error || e.message || 'No se pudo registrar el abono'
  } finally {
    guardandoPago.value = false
  }
}

// ─── Selección múltiple ─────────────────────────────────────────────
const seleccion = ref(new Set())

const cuentasSeleccionables = computed(() => cuentasFiltradas.value.filter(c => c.estado !== 'PAGADA'))
const todasSeleccionadas = computed(() =>
  cuentasSeleccionables.value.length > 0 &&
  cuentasSeleccionables.value.every(c => seleccion.value.has(c.grupo))
)
const algunasSeleccionadas = computed(() =>
  !todasSeleccionadas.value && cuentasSeleccionables.value.some(c => seleccion.value.has(c.grupo))
)
const totalSeleccion = computed(() =>
  cuentasSeleccionables.value
    .filter(c => seleccion.value.has(c.grupo))
    .reduce((s, c) => s + c.saldo, 0)
)

function toggleSeleccion(c) {
  const nuevo = new Set(seleccion.value)
  if (nuevo.has(c.grupo)) nuevo.delete(c.grupo)
  else nuevo.add(c.grupo)
  seleccion.value = nuevo
}
function toggleSeleccionTodas() {
  const nuevo = new Set(seleccion.value)
  if (todasSeleccionadas.value) {
    for (const c of cuentasSeleccionables.value) nuevo.delete(c.grupo)
  } else {
    for (const c of cuentasSeleccionables.value) nuevo.add(c.grupo)
  }
  seleccion.value = nuevo
}
function limpiarSeleccion() {
  seleccion.value = new Set()
}

// ─── Pago múltiple ──────────────────────────────────────────────────
const dlgPagoMultiple    = ref(false)
const pagoMultipleLineas = ref([])   // [{ grupo, factura, proveedor_nombre, saldo, valor }]
const pagoMultipleForm   = ref({ fecha: '', banco: '', cheque: '', observaciones: '' })
const pagoMultipleError  = ref('')

const muestraChequeMultiple = computed(() => {
  const cta = cuentasBancarias.value.find(c => c.codigo === pagoMultipleForm.value.banco)
  const v = parseInt(cta?.cheque)
  return !isNaN(v) && v > 0
})
watch(() => pagoMultipleForm.value.banco, (codigo) => {
  const cta = cuentasBancarias.value.find(c => c.codigo === codigo)
  const v = parseInt(cta?.cheque)
  pagoMultipleForm.value.cheque = (!isNaN(v) && v > 0) ? String(v) : ''
})
const totalPagoMultiple = computed(() =>
  pagoMultipleLineas.value.reduce((s, l) => s + toNum(l.valor), 0)
)

function abrirPagoMultiple() {
  pagoMultipleError.value = ''
  pagoMultipleLineas.value = cuentasSeleccionables.value
    .filter(c => seleccion.value.has(c.grupo))
    .map(c => ({
      grupo: c.grupo, factura: c.factura, proveedor_nombre: c.proveedor_nombre,
      saldo: c.saldo, valor: c.saldo,
    }))
  pagoMultipleForm.value = {
    fecha: new Date().toISOString().slice(0, 10),
    banco: '', cheque: '', observaciones: '',
  }
  dlgPagoMultiple.value = true
}

function quitarDePagoMultiple(i) {
  pagoMultipleLineas.value.splice(i, 1)
  if (!pagoMultipleLineas.value.length) dlgPagoMultiple.value = false
}

async function guardarPagoMultiple() {
  pagoMultipleError.value = ''
  if (!pagoMultipleForm.value.fecha) { pagoMultipleError.value = 'La fecha es requerida'; return }
  if (!pagoMultipleForm.value.banco) { pagoMultipleError.value = 'Selecciona la cuenta bancaria'; return }

  const pagos = []
  for (const l of pagoMultipleLineas.value) {
    const valor = toNum(l.valor)
    if (!(valor > 0)) { pagoMultipleError.value = `El valor a pagar de ${l.factura || l.grupo} debe ser mayor a 0`; return }
    if (valor > l.saldo + 0.01) {
      pagoMultipleError.value = `El pago a ${l.factura || l.grupo} supera su saldo pendiente (${money(l.saldo)})`
      return
    }
    pagos.push({ grupo: l.grupo, valor })
  }

  guardandoPago.value = true
  try {
    const r = await cuentasPorPagarService.registrarPagoMultiple({
      fecha: pagoMultipleForm.value.fecha,
      banco: pagoMultipleForm.value.banco,
      cheque: muestraChequeMultiple.value ? (pagoMultipleForm.value.cheque || null) : null,
      observaciones: pagoMultipleForm.value.observaciones || null,
      pagos,
    })
    dlgPagoMultiple.value = false
    snack(`Pago registrado · ${r.data?.num_facturas || pagos.length} factura(s) por ${money(r.data?.valor_total)}`, 'success')
    limpiarSeleccion()
    await cargar()
  } catch (e) {
    pagoMultipleError.value = e.response?.data?.error || e.message || 'No se pudo registrar el pago múltiple'
  } finally {
    guardandoPago.value = false
  }
}

// ─── Reverso ──────────────────────────────────────────────────────
const dlgReverso    = ref(false)
const pagoAReversar = ref(null)

function confirmarReverso(p) {
  pagoAReversar.value = p
  pagoError.value = ''
  dlgReverso.value = true
}

async function reversarPago() {
  guardandoPago.value = true
  try {
    await cuentasPorPagarService.reversarPago(pagoAReversar.value.id)
    dlgReverso.value = false
    snack('Abono reversado', 'success')
    const grupoAbierto = expandido.value
    await cargar()
    if (grupoAbierto) {
      const c = cuentas.value.find(x => x.grupo === grupoAbierto)
      expandido.value = null
      if (c) await toggle(c)
    }
  } catch (e) {
    pagoError.value = e.response?.data?.error || e.message || 'No se pudo reversar el abono'
  } finally {
    guardandoPago.value = false
  }
}

// ─── Snackbar ─────────────────────────────────────────────────────
const snackOpen  = ref(false)
const snackMsg   = ref('')
const snackColor = ref('success')
function snack(msg, color = 'success') {
  snackMsg.value = msg; snackColor.value = color; snackOpen.value = true
}

// ─── Formatters ───────────────────────────────────────────────────
function money(v) {
  if (v === null || v === undefined) return '—'
  return '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fecha(f) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
}

onMounted(async () => {
  try {
    const cb = await cuentasBancariasService.getCuentas({ estado: 'ACTIVA', limit: 200 })
    cuentasBancarias.value = cb?.data || (Array.isArray(cb) ? cb : [])
  } catch (e) {
    console.error('Error cargando cuentas bancarias:', e)
  }
  cargar()
})
</script>

<style scoped>
.cp-wrap { display: flex; flex-direction: column; gap: 16px; }

/* BREADCRUMB */
.cp-breadcrumb { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; }
.bc-root { color: #0369a1; text-transform: uppercase; }
.bc-sep, .bc-cat { color: rgba(var(--v-theme-on-surface), 0.35); text-transform: uppercase; }
.bc-current { color: rgba(var(--v-theme-on-surface), 0.55); text-transform: uppercase; }

/* HEADER */
.cp-header {
  display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  padding: 18px 22px; background: rgb(var(--v-theme-surface));
  border-radius: 14px; border-left: 4px solid #0369a1;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.cp-header-left { display: flex; align-items: center; gap: 14px; }
.cp-icon-wrap {
  width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0;
  background: linear-gradient(135deg, #0369a1, #075985);
  display: flex; align-items: center; justify-content: center;
}
.cp-title { font-size: 17px; font-weight: 800; letter-spacing: 0.6px; line-height: 1.2; }
.cp-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.45); margin-top: 2px; }
.cp-header-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.cp-select, .cp-date {
  height: 34px; padding: 0 10px; border-radius: 8px; font-size: 12px; outline: none;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.2);
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
}
.cp-fechas { display: flex; align-items: center; gap: 6px; }
.cp-date-sep { color: rgba(var(--v-theme-on-surface), 0.35); font-size: 12px; }

/* LOADING / EMPTY */
.cp-loading, .cp-empty {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 60px 20px; color: rgba(var(--v-theme-on-surface), 0.4); font-size: 13px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-radius: 14px;
}
.cp-empty-hint { font-size: 12px; max-width: 460px; text-align: center; line-height: 1.6; }

/* KPIs */
.cp-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; }
.cp-kpi {
  position: relative; overflow: hidden;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-radius: 12px; padding: 16px 18px;
}
.cp-kpi-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
.cp-kpi-lbl { font-size: 10px; font-weight: 800; letter-spacing: 0.7px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface), 0.45); }
.cp-kpi-val { font-size: 22px; font-weight: 800; margin-top: 4px; font-variant-numeric: tabular-nums; }
.cp-kpi-foot { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.4); margin-top: 2px; }

/* CARD */
.cp-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-radius: 14px; overflow: hidden;
}
.cp-card-head {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 13px 18px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  font-size: 11px; font-weight: 800; letter-spacing: 0.7px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
.cp-card-note { font-weight: 500; text-transform: none; letter-spacing: 0; color: rgba(var(--v-theme-on-surface), 0.35); }
.cp-search {
  margin-left: auto; width: 230px;
  padding: 6px 11px; border-radius: 8px; font-size: 12.5px; outline: none;
  text-transform: none; letter-spacing: 0; font-weight: 500;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  background: rgba(var(--v-theme-on-surface), 0.04);
  color: rgb(var(--v-theme-on-surface));
}

/* ANTIGÜEDAD */
.cp-aging { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; padding: 20px 18px 16px; }
.cp-aging-item { display: flex; flex-direction: column; align-items: center; gap: 7px; }
.cp-aging-bar-wrap { height: 76px; width: 100%; display: flex; align-items: flex-end; justify-content: center; }
.cp-aging-bar { width: 60%; max-width: 74px; border-radius: 5px 5px 0 0; transition: height 200ms cubic-bezier(0.23,1,0.32,1); }
.cp-aging-val { font-size: 13.5px; font-weight: 800; font-variant-numeric: tabular-nums; color: rgba(var(--v-theme-on-surface), 0.4); }
.cp-aging-lbl { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: rgba(var(--v-theme-on-surface), 0.42); }

/* SELECCIÓN MÚLTIPLE */
.cp-selbar {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  padding: 10px 18px;
  background: rgba(3,105,161,0.08); border-bottom: 1px solid rgba(3,105,161,0.15);
}
.cp-selbar-txt { font-size: 12.5px; color: rgba(var(--v-theme-on-surface), 0.75); }
.cp-selbar-txt strong { color: #0369a1; font-variant-numeric: tabular-nums; }
.cp-checkbox { width: 16px; height: 16px; cursor: pointer; accent-color: #0369a1; }

/* TABLA */
.cp-table-scroll { overflow-x: auto; }
.cp-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.cp-table th {
  padding: 10px 13px; font-size: 10px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.45);
  border-bottom: 1.5px solid rgba(var(--v-theme-on-surface), 0.1);
  background: rgba(var(--v-theme-on-surface), 0.03);
  white-space: nowrap;
}
.th-nom { text-align: left; }
.th-num { text-align: right; }
.th-mini { width: 34px; }

.cp-table td { padding: 9px 13px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.04); }
.td-nom { font-weight: 600; }
.td-num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.td-dim { font-weight: 500; color: rgba(var(--v-theme-on-surface), 0.5); }
.td-saldo { font-weight: 800; }
.td-mini { text-align: center; }

.cp-tr { cursor: pointer; transition: background 140ms ease-out; }
.cp-tr:hover { background: rgba(3,105,161,0.055); }
.cp-tr-open { background: rgba(3,105,161,0.07); }
.cp-chevron { color: rgba(var(--v-theme-on-surface), 0.4); transition: transform 150ms ease-out; }
.cp-chevron--open { transform: rotate(90deg); color: #0369a1; }

.cp-chip {
  font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; margin-left: 6px;
  background: rgba(3,105,161,0.13); color: #0369a1; letter-spacing: 0.3px;
}
.cp-badge {
  font-size: 9.5px; font-weight: 800; padding: 3px 8px; border-radius: 5px; letter-spacing: 0.4px;
}
.cp-badge--pendiente { background: rgba(239,68,68,0.13);  color: #ef4444; }
.cp-badge--parcial   { background: rgba(240,168,60,0.15); color: #d98613; }
.cp-badge--pagada    { background: rgba(34,197,94,0.13);  color: #16a34a; }

.cp-tfoot td {
  padding: 11px 13px; font-weight: 800; font-variant-numeric: tabular-nums;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-top: 2px solid rgba(var(--v-theme-on-surface), 0.12);
}

/* DETALLE EXPANDIDO */
.cp-tr-detalle td { padding: 0; background: rgba(var(--v-theme-on-surface), 0.02); }
.cp-detalle { padding: 14px 18px 18px 44px; display: flex; flex-direction: column; gap: 8px; }
.cp-detalle-load { display: flex; align-items: center; gap: 10px; padding: 18px 44px; font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.45); }
.cp-sub-title {
  display: flex; align-items: center; gap: 6px; margin-top: 6px;
  font-size: 10.5px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.5);
}
.cp-subtable { width: 100%; border-collapse: collapse; font-size: 12px; }
.cp-subtable th {
  padding: 6px 11px; font-size: 9.5px; background: transparent;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.cp-subtable td { padding: 6px 11px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.035); }
.cp-subtable tbody tr:last-child td { border-bottom: none; }
.cp-sin-pagos { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.4); padding: 6px 11px; }

/* DIÁLOGOS */
.cp-dlg { border-radius: 14px; overflow: hidden; }
.cp-dlg-head {
  display: flex; align-items: center; gap: 9px;
  padding: 16px 20px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  font-size: 14px; font-weight: 800; letter-spacing: 0.3px;
}
.cp-dlg-body { padding: 18px 20px; }
.cp-dlg-foot {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 13px 20px; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.cp-dlg-resumen {
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 10px; padding: 12px 14px; margin-bottom: 16px;
  display: flex; flex-direction: column; gap: 6px;
}
.cp-dlg-row { display: flex; justify-content: space-between; gap: 12px; font-size: 12.5px; }
.cp-dlg-row span { color: rgba(var(--v-theme-on-surface), 0.5); }
.cp-dlg-monto { display: flex; align-items: center; gap: 8px; }
.cp-dlg-monto > :first-child { flex: 1; }
.cp-dlg-nota {
  display: flex; align-items: flex-start; gap: 6px; margin-top: 14px;
  font-size: 11.5px; line-height: 1.5; color: rgba(var(--v-theme-on-surface), 0.5);
}
.cp-dlg-texto { font-size: 13px; line-height: 1.6; color: rgba(var(--v-theme-on-surface), 0.75); }

/* PAGO MÚLTIPLE */
.cp-multi-tabla { margin-bottom: 4px; }
.cp-multi-tabla tfoot td { padding: 8px 11px; border-top: 1.5px solid rgba(var(--v-theme-on-surface), 0.12); }
.cp-multi-input {
  width: 110px; padding: 5px 9px; text-align: right; font-variant-numeric: tabular-nums;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.18); border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.03); color: rgb(var(--v-theme-on-surface));
  font-size: 12.5px; font-weight: 600; outline: none;
}
.cp-multi-input:focus { border-color: #0369a1; background: rgba(3,105,161,0.06); }

@media (max-width: 700px) {
  .cp-aging { grid-template-columns: repeat(2, 1fr); }
  .cp-search { width: 100%; margin-left: 0; }
}
</style>
