<template>
  <MainLayout>
    <div class="nom-wrap">

      <!-- ── HEADER ── -->
      <div class="nom-header">
        <div class="nom-header-icon"><v-icon size="20" color="white">mdi-calculator-variant</v-icon></div>
        <div class="flex-1">
          <h1 class="nom-title">LIQUIDACIÓN DE NÓMINA</h1>
          <p class="nom-sub" v-if="liqActual">
            {{ fmtFecha(liqActual.semana_inicio) }} — {{ fmtFecha(liqActual.semana_fin) }}
            <span class="estado-badge" :class="`estado-${liqActual.estado?.toLowerCase()}`">{{ liqActual.estado }}</span>
          </p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <select v-model="liqSelId" class="drw-select" @change="cargarDetalle" style="width:230px">
            <option value="">— Seleccionar nómina —</option>
            <option v-for="l in liquidaciones" :key="l.id" :value="l.id">
              {{ fmtFecha(l.semana_inicio) }} · {{ l.estado }}
            </option>
          </select>
          <v-btn size="small" color="#8b5cf6" variant="outlined" @click="dlgNueva=true">
            <v-icon size="14" class="mr-1">mdi-plus</v-icon> Nueva Nómina
          </v-btn>
          <v-btn v-if="liqActual?.estado==='BORRADOR'" size="small" color="#8b5cf6" variant="flat"
                 :loading="calculando" @click="calcular">
            <v-icon size="14" class="mr-1">mdi-calculator</v-icon> Calcular
          </v-btn>
          <v-btn v-if="liqActual?.estado==='BORRADOR' && lineas.length"
                 size="small" color="#10b981" variant="flat" @click="abrirAprobar">
            <v-icon size="14" class="mr-1">mdi-check-circle</v-icon> Aprobar
          </v-btn>
          <v-btn v-if="liqActual?.estado==='APROBADA'" size="small" color="#06b6d4" variant="flat"
                 @click="$router.push('/nomina/reportes/recibos')">
            <v-icon size="14" class="mr-1">mdi-file-document</v-icon> Ver Recibos
          </v-btn>
          <v-btn v-if="liqActual?.estado==='APROBADA'" size="small" color="#f59e0b" variant="outlined"
                 @click="dlgDesaprobar=true">
            <v-icon size="14" class="mr-1">mdi-undo-variant</v-icon> Desaprobar
          </v-btn>
          <v-btn v-if="liqActual?.estado==='BORRADOR'" size="small" color="#ef4444" variant="text"
                 :loading="borrando" @click="borrarLiq">
            <v-icon size="14">mdi-trash-can</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- ── FLUJO DE PASOS ── -->
      <div v-if="liqActual" class="pasos-bar">
        <div class="paso" :class="{ activo: true, completado: true }">
          <v-icon size="16">mdi-plus-circle</v-icon> <span>1. Crear</span>
        </div>
        <div class="paso-linea"></div>
        <div class="paso" :class="{ activo: lineas.length > 0, completado: lineas.length > 0 }">
          <v-icon size="16">mdi-calculator</v-icon> <span>2. Calcular</span>
        </div>
        <div class="paso-linea"></div>
        <div class="paso" :class="{ activo: liqActual.estado==='APROBADA', completado: liqActual.estado==='APROBADA' }">
          <v-icon size="16">mdi-check-circle</v-icon> <span>3. Aprobar</span>
        </div>
      </div>

      <!-- ── KPI CARDS ── -->
      <div v-if="liqActual && lineas.length" class="liq-kpis">
        <div class="lkpi">
          <div class="lkpi-icon" style="background:rgba(139,92,246,0.1)"><v-icon size="18" color="#8b5cf6">mdi-cash-multiple</v-icon></div>
          <div>
            <div class="lkpi-label">Bruto Total</div>
            <div class="lkpi-val" style="color:#8b5cf6">{{ fmtMoney(liqActual.total_bruto) }}</div>
          </div>
        </div>
        <div class="lkpi">
          <div class="lkpi-icon" style="background:rgba(239,68,68,0.1)"><v-icon size="18" color="#ef4444">mdi-minus-circle</v-icon></div>
          <div>
            <div class="lkpi-label">Deducciones Emp.</div>
            <div class="lkpi-val" style="color:#ef4444">{{ fmtMoney(liqActual.total_deducciones_emp) }}</div>
          </div>
        </div>
        <div class="lkpi">
          <div class="lkpi-icon" style="background:rgba(16,185,129,0.1)"><v-icon size="18" color="#10b981">mdi-cash-check</v-icon></div>
          <div>
            <div class="lkpi-label">Neto a Pagar</div>
            <div class="lkpi-val" style="color:#10b981">{{ fmtMoney(liqActual.total_neto) }}</div>
          </div>
        </div>
        <div class="lkpi">
          <div class="lkpi-icon" style="background:rgba(245,158,11,0.1)"><v-icon size="18" color="#f59e0b">mdi-office-building</v-icon></div>
          <div>
            <div class="lkpi-label">Aportes Empleador</div>
            <div class="lkpi-val" style="color:#f59e0b">{{ fmtMoney(liqActual.total_aportes_er) }}</div>
          </div>
        </div>
        <div class="lkpi">
          <div class="lkpi-icon" style="background:rgba(6,182,212,0.1)"><v-icon size="18" color="#06b6d4">mdi-domain</v-icon></div>
          <div>
            <div class="lkpi-label">Costo Total Empresa</div>
            <div class="lkpi-val" style="color:#06b6d4">{{ fmtMoney(parseFloat(liqActual.total_bruto||0)+parseFloat(liqActual.total_aportes_er||0)) }}</div>
          </div>
        </div>
        <div class="lkpi">
          <div class="lkpi-icon" style="background:rgba(var(--v-theme-on-surface),0.06)"><v-icon size="18">mdi-account-group</v-icon></div>
          <div>
            <div class="lkpi-label">Empleados</div>
            <div class="lkpi-val">{{ lineas.length }}</div>
          </div>
        </div>
      </div>

      <!-- ── TABLA DE LÍNEAS ── -->
      <div v-if="lineas.length" class="nom-card" style="overflow-x:auto">
        <table class="nom-table">
          <thead>
            <tr>
              <th style="width:28px"></th>
              <th>EMPLEADO</th>
              <th>TIPO</th>
              <th class="ta-r">HRS REG</th>
              <th class="ta-r">HRS OT</th>
              <th class="ta-r">$/HR</th>
              <th class="ta-r">BRUTO REG</th>
              <th class="ta-r">BRUTO OT</th>
              <th class="ta-r">BRUTO TOTAL</th>
              <th class="ta-r">DEDUCCIONES</th>
              <th class="ta-r">NETO</th>
              <th class="ta-r">COSTO EMP.</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="l in lineas" :key="l.id">
              <!-- Fila principal -->
              <tr class="nom-row" @click="toggleExpand(l.id)" style="cursor:pointer">
                <td class="ta-c">
                  <v-icon size="14" style="color:rgba(var(--v-theme-on-surface),0.3)">
                    {{ expandido.has(l.id) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                  </v-icon>
                </td>
                <td>
                  <div style="font-weight:700;font-size:12px">{{ l.apellido }}, {{ l.nombre }}</div>
                  <div v-if="l.empresa_contratista" style="font-size:10px;color:rgba(var(--v-theme-on-surface),0.4)">{{ l.empresa_contratista }}</div>
                </td>
                <td>
                  <span class="nom-badge" :class="l.tipo_empleado==='W2'?'badge-w2':'badge-1099'">{{ l.tipo_empleado }}</span>
                </td>
                <td class="ta-r">{{ fmtNum(l.horas_regulares) }}h</td>
                <td class="ta-r" :class="parseFloat(l.horas_overtime)>0?'ot-hrs':''">
                  {{ fmtNum(l.horas_overtime) }}h
                </td>
                <td class="ta-r dim">{{ l.es_monto_fijo && parseFloat(l.horas_regulares)>0 ? 'FIJO+H' : l.es_monto_fijo ? 'FIJO' : fmtMoney(l.valor_hora) }}</td>
                <td class="ta-r dim">{{ l.es_monto_fijo && parseFloat(l.horas_regulares)===0 ? fmtMoney(l.bruto_base) : fmtMoney(l.bruto_regular) }}</td>
                <td class="ta-r" :class="parseFloat(l.bruto_overtime)>0?'ot-hrs':''">
                  {{ parseFloat(l.bruto_overtime)>0 ? fmtMoney(l.bruto_overtime) : '—' }}
                </td>
                <td class="ta-r bold">{{ fmtMoney(l.total_bruto) }}</td>
                <td class="ta-r" style="color:#ef4444">-{{ fmtMoney(l.total_deducciones) }}</td>
                <td class="ta-r neto">{{ fmtMoney(l.total_neto) }}</td>
                <td class="ta-r dim">{{ fmtMoney(parseFloat(l.total_bruto||0)+parseFloat(l.total_aportes_er||0)) }}</td>
              </tr>

              <!-- Fila expandida: deducciones detalladas -->
              <tr v-if="expandido.has(l.id)" class="expand-row">
                <td colspan="12">
                  <div class="expand-grid">
                    <!-- DESGLOSE BRUTO para FIJO+HORAS -->
                    <div class="expand-section" v-if="l.es_monto_fijo && parseFloat(l.horas_regulares)>0">
                      <div class="expand-titulo">DESGLOSE DE PAGO</div>
                      <div class="expand-item">
                        <span>Salario fijo semanal</span><span>{{ fmtMoney(l.bruto_base) }}</span>
                      </div>
                      <div class="expand-item">
                        <span>Horas adicionales ({{ fmtNum(l.horas_regulares) }}h × {{ fmtMoney(l.valor_hora) }})</span>
                        <span>{{ fmtMoney(l.bruto_regular) }}</span>
                      </div>
                      <div class="expand-item" v-if="parseFloat(l.bruto_overtime)>0">
                        <span>Overtime ({{ fmtNum(l.horas_overtime) }}h × {{ fmtMoney(l.valor_hora_ot) }})</span>
                        <span class="ot-hrs">{{ fmtMoney(l.bruto_overtime) }}</span>
                      </div>
                      <div class="expand-item expand-total">
                        <span>TOTAL BRUTO</span><span>{{ fmtMoney(l.total_bruto) }}</span>
                      </div>
                    </div>
                    <!-- DEDUCCIONES EMPLEADO con total -->
                    <div class="expand-section">
                      <div class="expand-titulo">DEDUCCIONES EMPLEADO</div>
                      <template v-if="l.tipo_empleado==='1099'">
                        <div class="expand-item"><span>Sin deducciones (1099)</span><span>—</span></div>
                      </template>
                      <template v-else>
                        <div class="expand-item" v-if="parseFloat(l.federal_income_tax)>0">
                          <span>Federal Income Tax (FIT)</span><span>-{{ fmtMoney(l.federal_income_tax) }}</span>
                        </div>
                        <div class="expand-item" v-if="parseFloat(l.social_security_emp)>0">
                          <span>Social Security (6.2%)</span><span>-{{ fmtMoney(l.social_security_emp) }}</span>
                        </div>
                        <div class="expand-item" v-if="parseFloat(l.medicare_emp)>0">
                          <span>Medicare (1.45%)</span><span>-{{ fmtMoney(l.medicare_emp) }}</span>
                        </div>
                        <div class="expand-item" v-if="parseFloat(l.medicare_adicional)>0">
                          <span>Medicare Adicional (0.9%)</span><span>-{{ fmtMoney(l.medicare_adicional) }}</span>
                        </div>
                        <div class="expand-item" v-if="parseFloat(l.workers_comp)>0">
                          <span>Workers' Comp</span><span>-{{ fmtMoney(l.workers_comp) }}</span>
                        </div>
                        <div class="expand-item" v-if="parseFloat(l.otras_deducciones)>0">
                          <span>Otras Deducciones</span><span>-{{ fmtMoney(l.otras_deducciones) }}</span>
                        </div>
                        <div class="expand-item expand-total">
                          <span>TOTAL DEDUCCIONES</span><span>-{{ fmtMoney(l.total_deducciones) }}</span>
                        </div>
                      </template>
                    </div>

                    <!-- APORTES EMPLEADOR con total -->
                    <div class="expand-section">
                      <div class="expand-titulo">APORTES EMPLEADOR (informativo)</div>
                      <div class="expand-item">
                        <span>Social Security (6.2%)</span><span>{{ fmtMoney(l.social_security_er) }}</span>
                      </div>
                      <div class="expand-item">
                        <span>Medicare (1.45%)</span><span>{{ fmtMoney(l.medicare_er) }}</span>
                      </div>
                      <div class="expand-item" v-if="parseFloat(l.futa)>0">
                        <span>FUTA</span><span>{{ fmtMoney(l.futa) }}</span>
                      </div>
                      <div class="expand-item" v-if="parseFloat(l.suta)>0">
                        <span>FL Reemployment Tax</span><span>{{ fmtMoney(l.suta) }}</span>
                      </div>
                      <div class="expand-item expand-total">
                        <span>TOTAL APORTES</span><span>{{ fmtMoney(l.total_aportes_er) }}</span>
                      </div>
                    </div>

                    <!-- DESGLOSE POR CCOSTO con nombre -->
                    <div class="expand-section" v-if="l.ccostos?.length">
                      <div class="expand-titulo">DESGLOSE POR CENTRO DE COSTO</div>
                      <div class="expand-item" v-for="cc in l.ccostos" :key="cc.ccosto">
                        <span>{{ cc.ccosto_nombre || cc.ccosto }} — {{ fmtNum(cc.horas) }}h</span>
                        <span>{{ fmtMoney(cc.costo_bruto) }}</span>
                      </div>
                    </div>

                    <div class="expand-section resumen">
                      <div class="expand-titulo">RESUMEN</div>
                      <div class="expand-item"><span>Bruto</span><span>{{ fmtMoney(l.total_bruto) }}</span></div>
                      <div class="expand-item" style="color:#ef4444"><span>Deducciones</span><span>-{{ fmtMoney(l.total_deducciones) }}</span></div>
                      <div class="expand-item neto-resumen"><span>NETO A PAGAR</span><span>{{ fmtMoney(l.total_neto) }}</span></div>
                      <div class="expand-item" style="font-size:10px;color:rgba(var(--v-theme-on-surface),0.4);margin-top:4px">
                        <span>YTD Bruto acumulado</span><span>{{ fmtMoney(l.ytd_bruto) }}</span>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- ── ESTADO VACÍO ── -->
      <div v-else-if="liqSelId && !cargando" class="nom-card estado-vacio">
        <v-icon size="48" color="rgba(var(--v-theme-on-surface),0.15)">mdi-calculator-variant-outline</v-icon>
        <div style="margin-top:12px;font-weight:700">Nómina sin calcular</div>
        <div style="font-size:12px;color:rgba(var(--v-theme-on-surface),0.4);margin-top:4px">
          Haz clic en <strong>"Calcular"</strong> para procesar las horas del horario y generar los valores de pago.
        </div>
      </div>
      <div v-else-if="!liqSelId" class="nom-card estado-vacio">
        <v-icon size="48" color="rgba(var(--v-theme-on-surface),0.15)">mdi-cash-register</v-icon>
        <div style="margin-top:12px;font-weight:700">Selecciona una nómina</div>
        <div style="font-size:12px;color:rgba(var(--v-theme-on-surface),0.4);margin-top:4px">
          O crea una nueva con el botón <strong>"+ Nueva Nómina"</strong>
        </div>
      </div>
    </div>

    <!-- ── DIALOG APROBAR NÓMINA ── -->
    <v-dialog v-model="dlgAprobar" max-width="480">
      <v-card rounded="lg">
        <v-card-title class="pa-4 pb-2" style="font-size:15px;font-weight:700">
          <v-icon size="18" color="#10b981" class="mr-2">mdi-check-circle</v-icon>
          Aprobar Nómina
        </v-card-title>
        <v-card-text class="pa-4 pt-2">
          <!-- Resumen -->
          <div class="aprobar-resumen">
            <div class="aprobar-item"><span>Período</span><span>{{ fmtFecha(liqActual?.semana_inicio) }} — {{ fmtFecha(liqActual?.semana_fin) }}</span></div>
            <div class="aprobar-item"><span>Bruto empleados</span><span>{{ fmtMoney(liqActual?.total_bruto) }}</span></div>
            <div class="aprobar-item"><span>Aportes empleador</span><span>{{ fmtMoney(liqActual?.total_aportes_er) }}</span></div>
            <div class="aprobar-item bold"><span>Costo total empresa</span><span style="color:#8b5cf6">{{ fmtMoney(parseFloat(liqActual?.total_bruto||0)+parseFloat(liqActual?.total_aportes_er||0)) }}</span></div>
            <div class="aprobar-item neto"><span>NETO A PAGAR empleados</span><span>{{ fmtMoney(liqActual?.total_neto) }}</span></div>
          </div>

          <!-- Info prorrateo si cruza meses -->
          <div v-if="cruzaMeses" class="prorate-info mt-3">
            <v-icon size="14" color="#f59e0b">mdi-information</v-icon>
            <span>Esta semana cruza dos meses. El gasto se prorrateará en dos asientos contables.</span>
          </div>

          <!-- Fecha de pago -->
          <div class="drw-field mt-3">
            <label>Fecha de pago (cuando ADP pagó los empleados)</label>
            <input v-model="fechaPagoAprobar" type="date" class="drw-input" />
            <span style="font-size:10px;color:rgba(var(--v-theme-on-surface),0.4);margin-top:3px;display:block">
              Se usará como fecha en gastos y movimiento bancario. Si no la indicas, se usa la fecha fin del período.
            </span>
          </div>

          <!-- Cuenta bancaria -->
          <div class="drw-field mt-3">
            <label>Cuenta bancaria de pago</label>
            <v-select
              v-model="bancoSelAprobar"
              :items="cuentasBancarias"
              item-value="codigo"
              item-title="nombre_cta"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              placeholder="— Sin registrar movimiento bancario —"
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <template #title>
                    <span style="font-size:12px">{{ item.raw.nombre_cta }}</span>
                  </template>
                </v-list-item>
              </template>
              <template #selection="{ item }">
                <span style="font-size:12px">{{ item.raw.nombre_cta }}</span>
              </template>
            </v-select>
            <span style="font-size:10px;color:rgba(var(--v-theme-on-surface),0.4);margin-top:4px;display:block">
              Si seleccionas una cuenta, se registrará el egreso en MOVIBAN
            </span>
          </div>

          <div class="aprobar-advertencia mt-3">
            <v-icon size="14" color="#ef4444">mdi-alert</v-icon>
            <span>Al aprobar: se creará el gasto en contabilidad, se cerrará la semana del horario y no se podrá modificar la nómina.</span>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer/>
          <v-btn variant="text" @click="dlgAprobar=false">Cancelar</v-btn>
          <v-btn color="#10b981" variant="flat" :loading="aprobando" @click="confirmarAprobar">
            <v-icon size="14" class="mr-1">mdi-check-circle</v-icon> Confirmar y Aprobar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── DIALOG DESAPROBAR NÓMINA ── -->
    <v-dialog v-model="dlgDesaprobar" max-width="460">
      <v-card rounded="lg">
        <v-card-title class="pa-4 pb-2" style="font-size:15px;font-weight:700">
          <v-icon size="18" color="#f59e0b" class="mr-2">mdi-undo-variant</v-icon>
          Desaprobar Nómina
        </v-card-title>
        <v-card-text class="pa-4 pt-2">
          <div class="aprobar-resumen">
            <div class="aprobar-item"><span>Período</span><span>{{ fmtFecha(liqActual?.semana_inicio) }} — {{ fmtFecha(liqActual?.semana_fin) }}</span></div>
            <div class="aprobar-item"><span>Estado actual</span><span style="color:#10b981;font-weight:700">APROBADA</span></div>
            <div class="aprobar-item bold"><span>Estado resultante</span><span style="color:#f59e0b">BORRADOR</span></div>
          </div>
          <div class="aprobar-advertencia mt-3" style="border-color:rgba(245,158,11,.35);background:rgba(245,158,11,.07)">
            <v-icon size="14" color="#f59e0b">mdi-alert</v-icon>
            <span>Esta acción:</span>
          </div>
          <ul style="font-size:12px;margin:8px 0 0 18px;line-height:1.8;color:rgba(var(--v-theme-on-surface),.7)">
            <li>Eliminará los <strong>gastos contables</strong> creados al aprobar</li>
            <li>Eliminará los <strong>movimientos bancarios</strong> asociados (si los hubo)</li>
            <li>Reabrirá la semana del horario vinculada</li>
            <li>La nómina volverá a <strong>BORRADOR</strong> para que puedas recalcularla</li>
          </ul>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer/>
          <v-btn variant="text" @click="dlgDesaprobar=false">Cancelar</v-btn>
          <v-btn color="#f59e0b" variant="flat" :loading="desaprobando" @click="confirmarDesaprobar">
            <v-icon size="14" class="mr-1">mdi-undo-variant</v-icon> Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── DIALOG NUEVA NÓMINA ── -->
    <v-dialog v-model="dlgNueva" max-width="460">
      <v-card rounded="lg">
        <v-card-title class="pa-4 pb-2" style="font-size:15px;font-weight:700">
          Nueva Nómina Semanal
        </v-card-title>
        <v-card-text class="pa-4 pt-2">
          <!-- Vincular a semana -->
          <div class="drw-field mb-3">
            <label>Semana del horario (opcional)</label>
            <select v-model="nuevaLiqSemanaId" class="drw-select" @change="onSemanaChange">
              <option value="">— Sin vincular a horario —</option>
              <option v-for="s in semanasDisponibles" :key="s.id" :value="s.id">
                {{ fmtFecha(s.semana_inicio) }} — {{ fmtFecha(s.semana_fin) }} · {{ s.estado }}
              </option>
            </select>
            <span v-if="nuevaLiqSemanaId" style="font-size:10px;color:#10b981;margin-top:4px">
              ✅ Las horas se tomarán del horario seleccionado
            </span>
          </div>
          <!-- Fechas -->
          <div class="drw-grid-2">
            <div class="drw-field">
              <label>Inicio de período</label>
              <input v-model="nuevaLiqInicio" type="date" class="drw-input" @change="calcNuevaFin" />
            </div>
            <div class="drw-field">
              <label>Fin de período</label>
              <input v-model="nuevaLiqFin" type="date" class="drw-input" :readonly="!!nuevaLiqSemanaId" />
            </div>
          </div>
          <div v-if="nuevaLiqInicio && nuevaLiqFin" class="periodo-preview">
            <v-icon size="14" color="#8b5cf6">mdi-calendar-range</v-icon>
            {{ fmtFecha(nuevaLiqInicio) }} — {{ fmtFecha(nuevaLiqFin) }}
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer/>
          <v-btn variant="text" @click="dlgNueva=false">Cancelar</v-btn>
          <v-btn color="#8b5cf6" variant="flat" :loading="creandoLiq"
                 :disabled="!nuevaLiqInicio || !nuevaLiqFin"
                 @click="crearLiq">Crear Nómina</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { formatFecha } from '../../utils/formatters'

const authStore = useAuthStore()
const empresa = computed(() => authStore.empresa || authStore.user?.empresa || localStorage.getItem('empresaActual') || '')

const liquidaciones      = ref([])
const semanasDisponibles = ref([])
const liqSelId    = ref('')
const liqActual   = ref(null)
const lineas      = ref([])
const cargando    = ref(false)
const calculando  = ref(false)
const borrando    = ref(false)
const expandido   = ref(new Set())

const dlgNueva        = ref(false)
const nuevaLiqSemanaId = ref('')
const nuevaLiqInicio  = ref('')
const nuevaLiqFin     = ref('')
const creandoLiq      = ref(false)

const dlgAprobar      = ref(false)
const bancoSelAprobar = ref('')
const fechaPagoAprobar = ref('')
const cuentasBancarias = ref([])
const aprobando       = ref(false)

const dlgDesaprobar   = ref(false)
const desaprobando    = ref(false)

function toggleExpand(id) {
  if (expandido.value.has(id)) expandido.value.delete(id)
  else expandido.value.add(id)
  // Trigger reactivity
  expandido.value = new Set(expandido.value)
}

function onSemanaChange() {
  const sem = semanasDisponibles.value.find(s => s.id == nuevaLiqSemanaId.value)
  if (sem) {
    nuevaLiqInicio.value = String(sem.semana_inicio).split('T')[0]
    nuevaLiqFin.value    = String(sem.semana_fin).split('T')[0]
  }
}

function calcNuevaFin() {
  if (!nuevaLiqInicio.value || nuevaLiqSemanaId.value) return
  const d = new Date(nuevaLiqInicio.value + 'T00:00:00')
  d.setDate(d.getDate() + 6)
  nuevaLiqFin.value = d.toISOString().split('T')[0]
}

async function cargar() {
  const [liqR, semR] = await Promise.all([
    api.get('/nomina/liquidaciones', { params: { empresa: empresa.value } }),
    api.get('/nomina/semanas',        { params: { empresa: empresa.value } }),
  ])
  liquidaciones.value      = liqR.data?.data || []
  semanasDisponibles.value = semR.data?.data || []
  if (liquidaciones.value.length && !liqSelId.value) {
    liqSelId.value = liquidaciones.value[0].id
    cargarDetalle()
  }
}

async function cargarDetalle() {
  if (!liqSelId.value) { liqActual.value = null; lineas.value = []; expandido.value = new Set(); return }
  cargando.value = true
  try {
    const r = await api.get(`/nomina/liquidaciones/${liqSelId.value}`)
    liqActual.value = r.data.liquidacion
    lineas.value    = r.data.lineas || []
    expandido.value = new Set()
  } finally { cargando.value = false }
}

async function crearLiq() {
  if (!nuevaLiqInicio.value || !nuevaLiqFin.value) return
  creandoLiq.value = true
  try {
    const r = await api.post('/nomina/liquidaciones', {
      empresa: empresa.value,
      semana_inicio: nuevaLiqInicio.value,
      semana_fin:    nuevaLiqFin.value,
      semana_id:     nuevaLiqSemanaId.value || null
    })
    dlgNueva.value = false
    nuevaLiqSemanaId.value = ''
    nuevaLiqInicio.value = ''
    nuevaLiqFin.value = ''
    await cargar()
    liqSelId.value = r.data.data?.id
    cargarDetalle()
  } catch(e) { alert(e?.response?.data?.error || e.message) }
  finally { creandoLiq.value = false }
}

async function calcular() {
  calculando.value = true
  try {
    await api.post(`/nomina/liquidaciones/${liqSelId.value}/calcular`, { empresa: empresa.value })
    await cargarDetalle()
  } catch(e) { alert('❌ ' + (e?.response?.data?.error || e.message)) }
  finally { calculando.value = false }
}

const cruzaMeses = computed(() => {
  if (!liqActual.value) return false
  const ini = String(liqActual.value.semana_inicio).split('T')[0]
  const fin = String(liqActual.value.semana_fin).split('T')[0]
  return ini.slice(0,7) !== fin.slice(0,7) // diferentes año-mes
})

async function abrirAprobar() {
  // Cargar cuentas bancarias si no están cargadas
  if (!cuentasBancarias.value.length) {
    try {
      const r = await api.get('/cuentas-bancarias', { params: { empresa: empresa.value } })
      cuentasBancarias.value = r.data?.data || r.data || []
    } catch(e) { cuentasBancarias.value = [] }
  }
  bancoSelAprobar.value = ''
  fechaPagoAprobar.value = ''
  dlgAprobar.value = true
}

async function confirmarAprobar() {
  // Banco es OPCIONAL — solo advertir si está vacío, no bloquear
  if (!bancoSelAprobar.value) {
    const continuar = confirm('⚠️ No seleccionaste una cuenta bancaria.\n\nSe creará el gasto contable pero NO se registrará movimiento bancario.\n\n¿Continuar de todas formas?')
    if (!continuar) return
  }
  aprobando.value = true
  try {
    const r = await api.put(`/nomina/liquidaciones/${liqSelId.value}/aprobar`, {
      empresa: empresa.value,
      banco: bancoSelAprobar.value || null,
      fechaPago: fechaPagoAprobar.value || null
    })
    dlgAprobar.value = false
    alert(`✅ ${r.data.message}`)
    await cargarDetalle()
  } catch(e) { alert('❌ ' + (e?.response?.data?.error || e.message)) }
  finally { aprobando.value = false }
}

async function confirmarDesaprobar() {
  desaprobando.value = true
  try {
    const r = await api.put(`/nomina/liquidaciones/${liqSelId.value}/desaprobar`, { empresa: empresa.value })
    dlgDesaprobar.value = false
    alert(`✅ ${r.data.message}`)
    await cargar()
    await cargarDetalle()
  } catch(e) { alert('❌ ' + (e?.response?.data?.error || e.message)) }
  finally { desaprobando.value = false }
}

async function borrarLiq() {
  if (!confirm('¿Eliminar esta nómina en BORRADOR? Se borrarán todos los datos calculados.')) return
  borrando.value = true
  try {
    await api.delete(`/nomina/liquidaciones/${liqSelId.value}`)
    liqSelId.value = ''
    await cargar()
  } catch(e) { alert('❌ ' + (e?.response?.data?.error || e.message)) }
  finally { borrando.value = false }
}

function fmtFecha(f) {
  if (!f) return '—'
  const s = String(f).split('T')[0]; const [y,m,d] = s.split('-')
  const meses = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${parseInt(d)} ${meses[parseInt(m)]} ${y}`
}
function fmtMoney(v) {
  return '$' + parseFloat(v||0).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })
}
function fmtNum(v) { return parseFloat(v||0).toFixed(1) }

onMounted(cargar)
</script>

<style scoped>
.nom-wrap { display: flex; flex-direction: column; gap: 14px; }
.nom-header { display: flex; align-items: center; gap: 14px; background: linear-gradient(135deg,#1a0a2e,#3b1a5e); border-radius: 14px; padding: 20px 24px; flex-wrap: wrap; }
.nom-header-icon { width: 42px; height: 42px; border-radius: 10px; background: rgba(139,92,246,0.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nom-title { font-size: 17px; font-weight: 800; color: #fff; margin: 0; }
.nom-sub   { font-size: 12px; color: rgba(255,255,255,0.5); margin: 0; display: flex; align-items: center; gap: 8px; }
.flex-1 { flex: 1; }
.nom-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),0.07); border-radius: 14px; }

/* Pasos */
.pasos-bar { display: flex; align-items: center; gap: 0; background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),0.07); border-radius: 12px; padding: 12px 20px; }
.paso { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: rgba(var(--v-theme-on-surface),0.3); }
.paso.activo { color: rgba(var(--v-theme-on-surface),0.6); }
.paso.completado { color: #10b981; }
.paso-linea { flex: 1; height: 1px; background: rgba(var(--v-theme-on-surface),0.1); margin: 0 12px; }

/* Estado badges */
.estado-badge { font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 4px; }
.estado-borrador { background: rgba(148,163,184,0.15); color: #94a3b8; }
.estado-aprobada { background: rgba(16,185,129,0.15); color: #10b981; }
.estado-pagada   { background: rgba(6,182,212,0.15); color: #06b6d4; }

/* KPI */
.liq-kpis { display: grid; grid-template-columns: repeat(auto-fit,minmax(150px,1fr)); gap: 10px; }
.lkpi { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),0.07); border-radius: 12px; padding: 14px 16px; display: flex; align-items: center; gap: 12px; }
.lkpi-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.lkpi-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface),0.4); margin-bottom: 4px; }
.lkpi-val { font-size: 18px; font-weight: 800; }

/* Tabla */
.nom-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.nom-table thead { background: rgba(var(--v-theme-on-surface),0.04); }
.nom-table th { padding: 9px 10px; text-align: left; font-size: 9px; font-weight: 800; letter-spacing: 0.8px; color: rgba(var(--v-theme-on-surface),0.4); text-transform: uppercase; border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.08); white-space: nowrap; }
.nom-row td { padding: 10px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.05); transition: background 0.1s; }
.nom-row:hover td { background: rgba(139,92,246,0.04); }
.ta-r { text-align: right !important; }
.ta-c { text-align: center !important; }
.bold { font-weight: 700; }
.dim  { color: rgba(var(--v-theme-on-surface),0.5); }
.neto { color: #10b981; font-weight: 800; }
.ot-hrs { color: #ef4444; font-weight: 700; }
.nom-badge { font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; }
.badge-w2   { background: rgba(139,92,246,0.15); color: #8b5cf6; }
.badge-1099 { background: rgba(245,158,11,0.15); color: #f59e0b; }
.footer-row td { background: rgba(var(--v-theme-on-surface),0.04); border-top: 2px solid rgba(var(--v-theme-on-surface),0.1); padding: 8px 10px; }

/* Expandido */
.expand-row td { padding: 0; background: rgba(var(--v-theme-on-surface),0.02); border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.06); }
.expand-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0; padding: 16px 20px; }
.expand-section { padding: 0 12px; border-right: 1px solid rgba(var(--v-theme-on-surface),0.06); }
.expand-section:last-child { border-right: none; }
.expand-titulo { font-size: 9px; font-weight: 800; letter-spacing: 0.8px; color: rgba(var(--v-theme-on-surface),0.35); text-transform: uppercase; margin-bottom: 8px; }
.expand-item { display: flex; justify-content: space-between; font-size: 11px; padding: 3px 0; border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.04); }
.expand-item span:last-child { font-weight: 600; }
.neto-resumen { font-weight: 800 !important; color: #10b981; border-top: 1px solid rgba(var(--v-theme-on-surface),0.1); margin-top: 4px; padding-top: 6px; }
.expand-total { font-weight: 800 !important; border-top: 1px solid rgba(var(--v-theme-on-surface),0.1); margin-top: 4px; padding-top: 6px; color: rgba(var(--v-theme-on-surface),0.8); }
.resumen .expand-item { font-size: 12px; }

/* Empty state */
.estado-vacio { padding: 48px; text-align: center; display: flex; flex-direction: column; align-items: center; }

/* Dialog */
.drw-select { height: 34px; padding: 0 8px; border-radius: 7px; border: 1px solid rgba(var(--v-theme-on-surface),0.15); background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); font-size: 12px; outline: none; width: 100%; }
.drw-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.drw-field { display: flex; flex-direction: column; gap: 4px; }
.drw-field label { font-size: 10px; font-weight: 700; color: rgba(var(--v-theme-on-surface),0.5); text-transform: uppercase; }
.drw-input { height: 34px; padding: 0 8px; border-radius: 7px; border: 1px solid rgba(var(--v-theme-on-surface),0.15); background: rgba(var(--v-theme-on-surface),0.03); color: rgb(var(--v-theme-on-surface)); font-size: 12px; outline: none; width: 100%; box-sizing: border-box; }
.mb-3 { margin-bottom: 12px; } .mt-3 { margin-top: 12px; } .pt-2 { padding-top: 8px !important; } .pa-4 { padding: 16px; } .pb-2 { padding-bottom: 8px !important; } .pt-0 { padding-top: 0 !important; }
.periodo-preview { margin-top: 10px; font-size: 12px; font-weight: 700; color: #8b5cf6; display: flex; align-items: center; gap: 6px; }
/* Dialog aprobar */
.aprobar-resumen { background: rgba(var(--v-theme-on-surface),0.03); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; }
.aprobar-item { display: flex; justify-content: space-between; font-size: 12px; }
.aprobar-item span:last-child { font-weight: 600; }
.aprobar-item.bold { border-top: 1px solid rgba(var(--v-theme-on-surface),0.08); padding-top: 6px; margin-top: 2px; font-weight: 700; }
.aprobar-item.neto span { color: #10b981; font-weight: 800; font-size: 13px; }
.prorate-info { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #f59e0b; background: rgba(245,158,11,0.08); padding: 8px 12px; border-radius: 8px; }
.aprobar-advertencia { display: flex; align-items: flex-start; gap: 8px; font-size: 11px; color: rgba(var(--v-theme-on-surface),0.5); background: rgba(239,68,68,0.05); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(239,68,68,0.1); }
</style>
