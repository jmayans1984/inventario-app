<template>
  <MainLayout>
    <div class="nom-wrap">
      <!-- HEADER -->
      <div class="nom-header">
        <div class="nom-header-icon"><v-icon size="20" color="white">mdi-calendar-week</v-icon></div>
        <div class="flex-1">
          <h1 class="nom-title">HORARIO SEMANAL</h1>
          <p class="nom-sub" v-if="semanaActual">
            {{ fmtFecha(semanaActual.semana_inicio) }} — {{ fmtFecha(semanaActual.semana_fin) }}
            <span class="estado-badge" :class="`estado-${semanaActual.estado?.toLowerCase()}`">
              {{ semanaActual.estado }}
            </span>
          </p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <select v-model="semanaSelId" class="drw-select" @change="cargarDetalle" style="width:210px">
            <option value="">— Seleccionar semana —</option>
            <option v-for="s in semanas" :key="s.id" :value="s.id">
              {{ fmtFecha(s.semana_inicio) }} al {{ fmtFecha(s.semana_fin) }}
            </option>
          </select>
          <v-btn size="small" variant="outlined" color="#06b6d4" @click="dlgNuevaSemana=true">
            <v-icon size="14" class="mr-1">mdi-plus</v-icon> Nueva Semana
          </v-btn>
          <v-btn v-if="semanaActual && semanaActual.estado==='BORRADOR'"
                 size="small" color="#f59e0b" variant="flat" @click="publicar">
            <v-icon size="14" class="mr-1">mdi-send</v-icon> Publicar
          </v-btn>
          <v-btn v-if="semanaActual" size="small" color="#8b5cf6" variant="flat"
                 @click="abrirDialogImprimir">
            <v-icon size="14" class="mr-1">mdi-printer</v-icon> Imprimir
          </v-btn>
          <v-btn v-if="semanaActual" size="small" color="#ef4444" variant="outlined"
                 :loading="borrando" @click="borrarSemana">
            <v-icon size="14" class="mr-1">mdi-trash-can</v-icon> Eliminar Semana
          </v-btn>
        </div>
      </div>

      <!-- UN GRID POR CADA CENTRO DE COSTOS -->
      <template v-if="semanaActual && semanaActual.semana_inicio">
        <div v-for="cc in ccostos" :key="cc.codigo" class="ccosto-bloque">
          <!-- Título del centro -->
          <div class="ccosto-titulo-bar">
            <div class="ccosto-dot"></div>
            <span class="ccosto-nombre">{{ cc.nombre }}</span>
            <span class="ccosto-codigo">{{ cc.codigo }}</span>
            <div class="ccosto-resumen">
              <span>{{ empleadosParaCcosto(cc.codigo).length }} empleados</span>
              <span>·</span>
              <span>{{ totalHorasCcosto(cc.codigo) }}h esta semana</span>
            </div>
            <div style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap">
              <v-btn v-if="horarioConfigs.length > 1" size="x-small" variant="outlined" color="#8b5cf6" @click="abrirDialogPlantillaParaCC(cc)">
                <v-icon size="12" class="mr-1">mdi-file-document</v-icon> Plantilla
              </v-btn>
              <v-btn v-if="semanaActual && semanaActual.estado==='BORRADOR'" size="x-small" variant="outlined" color="#06b6d4" :loading="copiando" @click="copiarSemanaAnteriorPorCC(cc.codigo)">
                <v-icon size="12" class="mr-1">mdi-content-copy</v-icon> Copiar
              </v-btn>
              <v-btn v-if="semanaActual && semanaActual.estado==='BORRADOR'" size="x-small" variant="outlined" color="#ef4444" @click="limpiarHorariosPorCC(cc.codigo)">
                <v-icon size="12" class="mr-1">mdi-trash-can</v-icon> Limpiar
              </v-btn>
            </div>
          </div>

          <!-- Grid del centro -->
          <div class="nom-card">
            <div v-if="empleadosParaCcosto(cc.codigo).length"
                 class="semana-grid"
                 :style="`grid-template-columns: 190px repeat(${DIAS.length}, 1fr)`">
              <!-- Header días -->
              <div class="sg-header-emp">EMPLEADO</div>
              <div v-for="d in DIAS" :key="d.offset" class="sg-header-dia">
                <div class="sg-dia-nombre">{{ d.label }}</div>
                <div class="sg-dia-fecha">{{ fmtDiaMes(semanaActual.semana_inicio, d.offset) }}</div>
              </div>

              <!-- Filas por empleado -->
              <template v-for="emp in empleadosParaCcosto(cc.codigo)" :key="emp.id">
                <div class="sg-emp-cell">
                  <div class="sg-emp-nombre">{{ getNombreDisplay(emp) }}</div>
                  <span class="sg-emp-badge" :class="emp.tipo_empleado==='W2'?'badge-w2':'badge-1099'">
                    {{ emp.tipo_empleado }}
                  </span>
                </div>
                <div v-for="d in DIAS" :key="d.offset" class="sg-turno-cell"
                     @click="abrirEditar(emp, d.offset, cc.codigo)">
                  <template v-for="t in [getTurnoCcosto(emp.id, semanaActual.semana_inicio, d.offset, cc.codigo)]" :key="0">
                    <template v-if="t">
                      <div v-if="!t.es_dia_libre" style="width:100%;text-align:center">
                        <div class="sg-turno-horas">
                          {{ (t.real_inicio || t.prog_inicio || '—').slice(0,5) }}
                          – {{ (t.real_fin || t.prog_fin || '—').slice(0,5) }}
                        </div>
                        <div class="sg-turno-total" :class="t.ajustado ? 'ajustado':''">
                          {{ fmtHoras(t.real_horas ?? t.prog_horas) }}h
                        </div>
                        <v-icon size="10" style="opacity:0.2;margin-top:2px">mdi-pencil</v-icon>
                      </div>
                      <div v-else class="sg-libre">{{ t.ausencia_tipo || 'LIBRE' }}</div>
                    </template>
                    <template v-else>
                      <div class="sg-sin-turno">+</div>
                    </template>
                  </template>
                </div>
              </template>
            </div>

            <!-- Sin empleados -->
            <div v-else class="ccosto-vacio">
              <v-icon size="28" color="rgba(var(--v-theme-on-surface),0.2)">mdi-account-group-outline</v-icon>
              <div>Sin empleados asignados a este centro</div>
            </div>

            <!-- Footer: solo botón agregar -->
            <div class="sg-footer-simple">
              <v-btn v-if="semanaActual.estado !== 'CERRADO'"
                     color="#06b6d4" variant="flat" size="small"
                     @click="abrirAgregarEmp(cc.codigo)">
                <v-icon size="14" class="mr-1">mdi-account-plus</v-icon> Agregar Empleado
              </v-btn>
            </div>
          </div>
        </div>
      </template>

      <!-- RESUMEN TOTAL DE HORAS -->
      <div v-if="semanaActual && resumenEmpleados.length" class="nom-card resumen-card">
        <div class="resumen-titulo" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <span>
            <v-icon size="16" color="#8b5cf6" class="mr-1">mdi-chart-bar</v-icon>
            RESUMEN SEMANAL — HORAS TOTALES POR EMPLEADO
          </span>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:rgba(var(--v-theme-on-surface),0.6);cursor:pointer">
            <input type="checkbox" v-model="resumenAgrupadoPorCC" style="width:14px;height:14px;accent-color:#8b5cf6;cursor:pointer" />
            Agrupar por Centro de Costo
          </label>
        </div>
        <table class="resumen-tabla">
          <thead>
            <tr>
              <th style="text-align:left">EMPLEADO</th>
              <th>TIPO</th>
              <th>CENTROS</th>
              <th>HRS REG.</th>
              <th>HRS OT</th>
              <th>TOTAL HRS</th>
              <th>VALOR/HR</th>
              <th>TOTAL A PAGAR</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="resumenAgrupadoPorCC">
              <template v-for="cc in resumenCCOrdenados" :key="cc">
                <tr class="resumen-cc-header">
                  <td colspan="8" style="padding:8px 12px;background:rgba(139,92,246,0.1);font-weight:700;color:#8b5cf6">
                    📍 {{ getNombreCC(cc) }}
                  </td>
                </tr>
                <tr v-for="r in resumenPorCC[cc]" :key="r.id" :class="r.overtime > 0 ? 'row-ot' : ''">
              <td class="resumen-nombre">
                {{ r.apellido }}, {{ r.nombre }}
                <span v-if="r.empresa_contratista" class="resumen-empresa">{{ r.empresa_contratista }}</span>
              </td>
              <td class="ta-c">
                <span class="sg-emp-badge" :class="r.tipo_empleado==='W2'?'badge-w2':'badge-1099'">{{ r.tipo_empleado }}</span>
              </td>
              <td class="ta-c">
                <span v-for="ccost in r.centros" :key="ccost" class="ccosto-chip">{{ ccost }}</span>
              </td>
              <td class="ta-c resumen-reg">{{ r.regular.toFixed(2) }}h</td>
              <td class="ta-c">
                <span v-if="r.overtime > 0" class="ot-badge">+{{ r.overtime.toFixed(2) }}h</span>
                <span v-else style="color:rgba(var(--v-theme-on-surface),0.25)">—</span>
              </td>
              <td class="ta-c resumen-total">{{ r.total.toFixed(2) }}h</td>
              <td class="ta-c resumen-rate">
                <span v-if="r.tipo_pago==='DIA_LABORADO'">{{ fmtMoney(r.valor_dia) }}/día · {{ r.diasTrabajados }}d</span>
                <span v-else-if="r.es_por_horas">{{ fmtMoney(r.valor_hora) }}/h</span>
                <span v-else class="resumen-fijo">FIJO</span>
              </td>
              <td class="ta-c resumen-pagar">{{ fmtMoney(r.totalPagar) }}</td>
            </tr>
                <tr class="resumen-cc-footer">
                  <td colspan="3" style="text-align:left;padding:6px 12px;background:rgba(139,92,246,0.05);font-weight:600;color:rgba(var(--v-theme-on-surface),0.6);font-size:12px">
                    Subtotal {{ getNombreCC(cc) }}
                  </td>
                  <td class="ta-c" style="background:rgba(139,92,246,0.05);font-weight:600;font-size:12px">{{ resumenTotalesPorCC[cc].regular.toFixed(2) }}h</td>
                  <td class="ta-c" style="background:rgba(139,92,246,0.05);font-weight:600;font-size:12px;color:#ef4444">{{ resumenTotalesPorCC[cc].overtime.toFixed(2) }}h</td>
                  <td class="ta-c" style="background:rgba(139,92,246,0.05);font-weight:600;font-size:12px">{{ resumenTotalesPorCC[cc].total.toFixed(2) }}h</td>
                  <td style="background:rgba(139,92,246,0.05)"></td>
                  <td class="ta-c" style="background:rgba(139,92,246,0.05);font-weight:600;font-size:12px;color:#10b981">{{ fmtMoney(resumenTotalesPorCC[cc].totalPagar) }}</td>
                </tr>
              </template>
            </template>
            <template v-else>
              <tr v-for="r in resumenEmpleados" :key="r.id" :class="r.overtime > 0 ? 'row-ot' : ''">
                <td class="resumen-nombre">
                  {{ r.apellido }}, {{ r.nombre }}
                  <span v-if="r.empresa_contratista" class="resumen-empresa">{{ r.empresa_contratista }}</span>
                </td>
                <td class="ta-c">
                  <span class="sg-emp-badge" :class="r.tipo_empleado==='W2'?'badge-w2':'badge-1099'">{{ r.tipo_empleado }}</span>
                </td>
                <td class="ta-c">
                  <span v-for="cc in r.centros" :key="cc" class="ccosto-chip">{{ cc }}</span>
                </td>
                <td class="ta-c resumen-reg">{{ r.regular.toFixed(2) }}h</td>
                <td class="ta-c">
                  <span v-if="r.overtime > 0" class="ot-badge">+{{ r.overtime.toFixed(2) }}h</span>
                  <span v-else style="color:rgba(var(--v-theme-on-surface),0.25)">—</span>
                </td>
                <td class="ta-c resumen-total">{{ r.total.toFixed(2) }}h</td>
                <td class="ta-c resumen-rate">
                  <span v-if="r.tipo_pago==='DIA_LABORADO'">{{ fmtMoney(r.valor_dia) }}/día · {{ r.diasTrabajados }}d</span>
                  <span v-else-if="r.es_por_horas">{{ fmtMoney(r.valor_hora) }}/h</span>
                  <span v-else class="resumen-fijo">FIJO</span>
                </td>
                <td class="ta-c resumen-pagar">{{ fmtMoney(r.totalPagar) }}</td>
              </tr>
            </template>
          </tbody>
          <tfoot>
            <tr class="resumen-footer">
              <td colspan="3"><strong>TOTAL EMPRESA</strong></td>
              <td class="ta-c"><strong>{{ resumenTotales.regular.toFixed(2) }}h</strong></td>
              <td class="ta-c"><strong style="color:#ef4444">{{ resumenTotales.overtime.toFixed(2) }}h OT</strong></td>
              <td class="ta-c"><strong>{{ resumenTotales.total.toFixed(2) }}h</strong></td>
              <td></td>
              <td class="ta-c"><strong style="color:#10b981;font-size:14px">{{ fmtMoney(resumenTotales.totalPagar) }}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div v-else-if="!semanaSelId" class="nom-card" style="padding:32px;text-align:center;color:rgba(var(--v-theme-on-surface),0.4)">
        Selecciona una semana o crea una nueva.
      </div>

      <!-- Version -->
      <div style="text-align:center;font-size:10px;color:rgba(var(--v-theme-on-surface),0.2);margin-top:4px">
        v2.6.0 · {{ ccostos.length }} centros · {{ empleadosActivos.length }} empleados activos
      </div>
    </div>

    <!-- Dialog nueva semana -->
    <v-dialog v-model="dlgNuevaSemana" max-width="380">
      <v-card rounded="lg">
        <v-card-title class="pa-4" style="font-size:15px;font-weight:700">Nueva Semana</v-card-title>
        <v-card-text>
          <div class="drw-field mb-3">
            <label>Semana que inicia (Lunes)</label>
            <input v-model="nuevaSemanaInicio" type="date" class="drw-input" />
          </div>
          <div v-if="nuevaSemanaFin" style="font-size:12px;color:rgba(var(--v-theme-on-surface),0.5)">
            Período: {{ fmtFecha(nuevaSemanaInicio) }} — {{ fmtFecha(nuevaSemanaFin) }}
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="dlgNuevaSemana=false">Cancelar</v-btn>
          <v-btn color="#06b6d4" variant="flat" :loading="creandoSemana" @click="crearSemana">Crear</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog AGREGAR EMPLEADO al centro -->
    <v-dialog v-model="dlgAgregarEmp" max-width="420" scrollable>
      <v-card rounded="lg">
        <v-card-title class="pa-4 d-flex align-center justify-space-between" style="font-size:14px;font-weight:700">
          <span>Agregar a {{ ccostoNombreActual }}</span>
          <v-btn icon="mdi-close" size="x-small" variant="text" @click="dlgAgregarEmp=false"/>
        </v-card-title>
        <v-card-text class="pa-3 pt-0">
          <input v-model="buscarEmp" class="drw-input mb-3" placeholder="Buscar empleado..." style="width:100%" />
          <div class="emp-list">
            <div v-if="empleadosParaAgregarComputed.length === 0"
                 style="text-align:center;padding:20px;color:rgba(var(--v-theme-on-surface),0.4);font-size:12px">
              Todos los empleados ya están en este centro
            </div>
            <div v-for="e in empleadosParaAgregarComputed" :key="e.id"
                 class="emp-list-item" @click="agregarEmpleadoAVista(e)">
              <div>
                <div style="font-size:13px;font-weight:600">{{ e.apellido }}, {{ e.nombre }}</div>
                <div style="font-size:10px;color:rgba(var(--v-theme-on-surface),0.45)">
                  {{ e.cargo_nombre || 'Sin cargo' }} · {{ e.ccosto_nombre || e.ccosto || '—' }}
                </div>
              </div>
              <span class="sg-emp-badge" :class="e.tipo_empleado==='W2'?'badge-w2':'badge-1099'">{{ e.tipo_empleado }}</span>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Dialog editar/crear turno -->
    <v-dialog v-model="dlgEditar" max-width="380">
      <v-card rounded="lg" v-if="turnoEdit">
        <v-card-title class="pa-4 pb-2" style="font-size:14px;font-weight:700">
          {{ editEmp?.apellido }}, {{ editEmp?.nombre }}
          <div style="font-size:11px;color:rgba(var(--v-theme-on-surface),0.45);font-weight:400;margin-top:2px">
            {{ fmtFechaLarga(editFecha) }} · {{ editCcostoNombre }}
          </div>
        </v-card-title>
        <v-card-text class="pa-4 pt-2">
          <label class="cfg-edit-check mb-3">
            <input type="checkbox" v-model="turnoEdit.es_dia_libre" />
            <span style="font-size:13px;margin-left:8px">Día libre / Ausencia</span>
          </label>
          <template v-if="!turnoEdit.es_dia_libre">
            <div class="drw-grid-2 mt-3">
              <div class="drw-field">
                <label>Entrada</label>
                <input v-model="turnoEdit.real_inicio" type="time" class="drw-input" @change="calcularHorasAuto" />
              </div>
              <div class="drw-field">
                <label>Salida</label>
                <input v-model="turnoEdit.real_fin" type="time" class="drw-input" @change="calcularHorasAuto" />
              </div>
            </div>
            <div v-if="turnoEdit.real_horas > 0" class="horas-calculadas mt-2">
              <v-icon size="14" color="#10b981">mdi-clock-check</v-icon>
              <span>{{ fmtHoras(turnoEdit.real_horas) }} horas calculadas</span>
            </div>
          </template>
          <template v-else>
            <div class="drw-field mt-3">
              <label>Tipo de ausencia</label>
              <select v-model="turnoEdit.ausencia_tipo" class="drw-select">
                <option value="">Libre / Descanso</option>
                <option value="ENFERMEDAD">Enfermedad</option>
                <option value="VACACIONES">Vacaciones</option>
                <option value="SIN_PAGO">Sin pago</option>
                <option value="FERIADO">Feriado</option>
              </select>
            </div>
          </template>
          <div class="drw-field mt-3">
            <label>Notas</label>
            <input v-model="turnoEdit.notas" class="drw-input" placeholder="Opcional..." />
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-btn v-if="turnoEdit.id" color="#ef4444" variant="text" size="small"
                 :loading="eliminandoTurno" @click="eliminarTurno">
            <v-icon size="14" class="mr-1">mdi-delete</v-icon> Eliminar
          </v-btn>
          <v-spacer/>
          <v-btn variant="text" @click="dlgEditar=false">Cancelar</v-btn>
          <v-btn color="#8b5cf6" variant="flat" :loading="guardandoTurno" @click="guardarTurno">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog IMPRIMIR -->
    <v-dialog v-model="dlgImprimir" max-width="460">
      <v-card rounded="lg">
        <v-card-title class="pa-4 d-flex align-center justify-space-between" style="font-size:14px;font-weight:700">
          <span><v-icon size="16" class="mr-1">mdi-printer-settings</v-icon> Opciones de Impresión</span>
          <v-btn icon="mdi-close" size="x-small" variant="text" @click="dlgImprimir=false"/>
        </v-card-title>
        <v-card-text class="pa-4 pt-0">
          <!-- Centros de costo -->
          <div style="font-size:11px;font-weight:800;letter-spacing:1px;color:rgba(var(--v-theme-on-surface),0.5);margin-bottom:8px">
            CENTROS DE COSTO A IMPRIMIR
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:18px">
            <label v-for="cc in ccostos" :key="cc.codigo"
                   style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px">
              <input type="checkbox" :value="cc.codigo" v-model="imprimirCCSeleccionados"
                     style="width:15px;height:15px;accent-color:#8b5cf6;cursor:pointer" />
              <span>{{ cc.nombre }}</span>
              <span style="font-size:11px;color:rgba(var(--v-theme-on-surface),0.4)">{{ cc.codigo }}</span>
            </label>
          </div>

          <!-- Modo de impresión -->
          <div style="font-size:11px;font-weight:800;letter-spacing:1px;color:rgba(var(--v-theme-on-surface),0.5);margin-bottom:8px">
            MODO DE IMPRESIÓN
          </div>
          <div style="display:flex;gap:10px;margin-bottom:18px">
            <div @click="imprimirModo='detalle'"
                 :style="imprimirModo==='detalle' ? 'border-color:#8b5cf6;background:rgba(139,92,246,0.08)' : ''"
                 style="flex:1;border:2px solid rgba(var(--v-theme-on-surface),0.15);border-radius:10px;padding:12px;cursor:pointer;transition:all 0.15s">
              <div style="font-size:12px;font-weight:700;margin-bottom:4px">
                <v-icon size="14" :color="imprimirModo==='detalle'?'#8b5cf6':''" class="mr-1">mdi-clock-outline</v-icon>
                Detalle
              </div>
              <div style="font-size:11px;color:rgba(var(--v-theme-on-surface),0.5)">Muestra horario de entrada/salida y horas trabajadas</div>
            </div>
            <div @click="imprimirModo='verde'"
                 :style="imprimirModo==='verde' ? 'border-color:#10b981;background:rgba(16,185,129,0.08)' : ''"
                 style="flex:1;border:2px solid rgba(var(--v-theme-on-surface),0.15);border-radius:10px;padding:12px;cursor:pointer;transition:all 0.15s">
              <div style="font-size:12px;font-weight:700;margin-bottom:4px">
                <v-icon size="14" :color="imprimirModo==='verde'?'#10b981':''" class="mr-1">mdi-format-color-fill</v-icon>
                Solo color
              </div>
              <div style="font-size:11px;color:rgba(var(--v-theme-on-surface),0.5)">Pinta de verde el día que trabaja, sin mostrar horas</div>
            </div>
          </div>

          <!-- Separación de páginas -->
          <div style="font-size:11px;font-weight:800;letter-spacing:1px;color:rgba(var(--v-theme-on-surface),0.5);margin-bottom:8px">
            SEPARACIÓN DE PÁGINAS
          </div>
          <div style="display:flex;gap:10px">
            <div @click="imprimirSeparacion='cc'"
                 :style="imprimirSeparacion==='cc' ? 'border-color:#06b6d4;background:rgba(6,182,212,0.08)' : ''"
                 style="flex:1;border:2px solid rgba(var(--v-theme-on-surface),0.15);border-radius:10px;padding:12px;cursor:pointer;transition:all 0.15s">
              <div style="font-size:12px;font-weight:700;margin-bottom:4px">
                <v-icon size="14" :color="imprimirSeparacion==='cc'?'#06b6d4':''" class="mr-1">mdi-file-multiple</v-icon>
                Por Centro de Costo
              </div>
              <div style="font-size:11px;color:rgba(var(--v-theme-on-surface),0.5)">Cada centro en página separada</div>
            </div>
            <div @click="imprimirSeparacion='todo'"
                 :style="imprimirSeparacion==='todo' ? 'border-color:#06b6d4;background:rgba(6,182,212,0.08)' : ''"
                 style="flex:1;border:2px solid rgba(var(--v-theme-on-surface),0.15);border-radius:10px;padding:12px;cursor:pointer;transition:all 0.15s">
              <div style="font-size:12px;font-weight:700;margin-bottom:4px">
                <v-icon size="14" :color="imprimirSeparacion==='todo'?'#06b6d4':''" class="mr-1">mdi-file-document</v-icon>
                Todo junto
              </div>
              <div style="font-size:11px;color:rgba(var(--v-theme-on-surface),0.5)">Sin separación entre centros</div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="dlgImprimir=false">Cancelar</v-btn>
          <v-btn color="#8b5cf6" variant="flat" :disabled="!imprimirCCSeleccionados.length" @click="confirmarImprimir">
            <v-icon size="14" class="mr-1">mdi-printer</v-icon> Imprimir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog SELECCIONAR PLANTILLA -->
    <v-dialog v-model="dlgSeleccionarPlantilla" max-width="420">
      <v-card rounded="lg">
        <v-card-title class="pa-4 d-flex align-center justify-space-between" style="font-size:14px;font-weight:700">
          <span><v-icon size="16" class="mr-1">mdi-calendar-check</v-icon> Seleccionar Plantilla de Horario</span>
          <v-btn icon="mdi-close" size="x-small" variant="text" @click="dlgSeleccionarPlantilla=false"/>
        </v-card-title>
        <v-card-text class="pa-4">
          <div style="display:flex;flex-direction:column;gap:8px">
            <label v-for="cfg in horarioConfigs" :key="cfg.id"
                   style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px;border:2px solid rgba(var(--v-theme-on-surface),0.1);border-radius:8px;transition:all 0.15s"
                   :style="plantillaSeleccionadaId === cfg.id ? 'border-color:#8b5cf6;background:rgba(139,92,246,0.08)' : ''">
              <input type="radio" :value="cfg.id" v-model="plantillaSeleccionadaId" style="width:16px;height:16px;cursor:pointer;accent-color:#8b5cf6" />
              <div>
                <div style="font-size:13px;font-weight:700">{{ cfg.nombre || 'Plantilla ' + cfg.id }}</div>
                <div v-if="cfg.descripcion" style="font-size:11px;color:rgba(var(--v-theme-on-surface),0.5)">{{ cfg.descripcion }}</div>
              </div>
            </label>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="dlgSeleccionarPlantilla=false">Cancelar</v-btn>
          <v-btn color="#8b5cf6" variant="flat" :disabled="!plantillaSeleccionadaId" @click="confirmarGenerarHorario(plantillaSeleccionadaId)">
            <v-icon size="14" class="mr-1">mdi-check</v-icon> Generar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog PLANTILLAS POR CC -->
    <v-dialog v-model="dlgPlantillaParaCC" max-width="340">
      <v-card rounded="lg">
        <v-card-title class="pa-4" style="font-size:14px;font-weight:700">
          <v-icon size="16" class="mr-1">mdi-file-document</v-icon> {{ ccActualSeleccionado?.nombre || 'Selecciona Plantilla' }}
        </v-card-title>
        <v-card-text class="pa-4">
          <select v-if="ccActualSeleccionado" @change="aplicarPlantillaYCerrar" style="width:100%;padding:10px 8px;border:1px solid rgba(var(--v-theme-on-surface),0.2);border-radius:6px;font-size:13px;background:rgb(var(--v-theme-surface));color:rgb(var(--v-theme-on-surface))">
            <option value="">— Selecciona plantilla —</option>
            <option v-for="cfg in horarioConfigs" :key="cfg.id" :value="cfg.id">
              {{ cfg.nombre || 'Plantilla ' + cfg.id }}
            </option>
          </select>
        </v-card-text>
      </v-card>
    </v-dialog>
  </MainLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { formatFecha } from '../../utils/formatters'

const router = useRouter()
const authStore = useAuthStore()
const empresa = computed(() => authStore.empresa || authStore.user?.empresa || localStorage.getItem('empresaActual') || '')

const DIAS = [
  { label:'Lun', offset:0 }, { label:'Mar', offset:1 }, { label:'Mié', offset:2 },
  { label:'Jue', offset:3 }, { label:'Vie', offset:4 }, { label:'Sáb', offset:5 }, { label:'Dom', offset:6 }
]

const semanas          = ref([])
const semanaSelId      = ref('')
const semanaActual     = ref(null)
const detalle          = ref([])
const empleadosActivos = ref([])
const ccostos          = ref([])
const horarioConfigs   = ref([])
const cargando         = ref(false)
const copiando         = ref(false)
const borrando         = ref(false)

// empleadosAgregados: { [ccostoId]: [emp, ...] }
const empleadosAgregados = ref({})

// Dialog imprimir
const dlgImprimir            = ref(false)
const imprimirCCSeleccionados = ref([])
const imprimirModo           = ref('detalle')
const imprimirSeparacion     = ref('cc')

// Agrupación del resumen
const resumenAgrupadoPorCC = ref(false)

// Dialog seleccionar plantilla
const dlgSeleccionarPlantilla = ref(false)
const plantillaSeleccionadaId = ref(null)

// Dialog plantilla para CC individual
const dlgPlantillaParaCC = ref(false)
const plantillasPorCC = reactive({})
const ccActualSeleccionado = ref(null)
const plantillaParaCCActual = ref(null)

function abrirDialogImprimir() {
  imprimirCCSeleccionados.value = ccostos.value.map(c => c.codigo)
  imprimirModo.value = 'detalle'
  imprimirSeparacion.value = 'cc'
  dlgImprimir.value = true
}

function confirmarImprimir() {
  dlgImprimir.value = false
  router.push({
    path: '/nomina/reportes/horario',
    query: {
      semana: semanaSelId.value,
      ccostos: imprimirCCSeleccionados.value.join(','),
      modo: imprimirModo.value,
      separacion: imprimirSeparacion.value
    }
  })
}

const dlgNuevaSemana   = ref(false)
const nuevaSemanaInicio = ref('')
const nuevaSemanaFin   = computed(() => {
  if (!nuevaSemanaInicio.value) return ''
  const d = new Date(nuevaSemanaInicio.value + 'T00:00:00')
  d.setDate(d.getDate() + 6)
  return d.toISOString().split('T')[0]
})
const creandoSemana = ref(false)

// Dialog agregar empleado
const dlgAgregarEmp      = ref(false)
const dlgAgregarEmpCcosto = ref('')
const buscarEmp          = ref('')
const ccostoNombreActual = computed(() =>
  ccostos.value.find(c => c.codigo === dlgAgregarEmpCcosto.value)?.nombre || dlgAgregarEmpCcosto.value
)

// Dialog editar turno
const dlgEditar       = ref(false)
const editEmp         = ref(null)
const editFecha       = ref('')
const editCcosto      = ref('')
const turnoEdit       = ref(null)
const guardandoTurno  = ref(false)
const eliminandoTurno = ref(false)
const editCcostoNombre = computed(() =>
  ccostos.value.find(c => c.codigo === editCcosto.value)?.nombre || editCcosto.value
)

// Resetear empleados agregados al cambiar semana
watch(semanaSelId, () => { empleadosAgregados.value = {} })

// Resumen total de horas por empleado (todos los centros combinados)
const resumenEmpleados = computed(() => {
  const map = {}

  // DEDUPLICAR: solo un registro por empleado+fecha+ccosto
  const seen = new Set()
  const deduped = []
  detalle.value.filter(d => !d.es_dia_libre).forEach(d => {
    const key = `${d.empleado_id}-${String(d.fecha).split('T')[0]}-${d.ccosto}`
    if (!seen.has(key)) { seen.add(key); deduped.push(d) }
  })

  // Contar días distintos por empleado (para DIA_LABORADO)
  const diasMap = {}
  deduped.forEach(d => {
    const horas = parseFloat(d.real_horas ?? d.prog_horas ?? 0)
    if (horas > 0) {
      const fecha = String(d.fecha).split('T')[0]
      if (!diasMap[d.empleado_id]) diasMap[d.empleado_id] = new Set()
      diasMap[d.empleado_id].add(fecha)
    }
  })

  deduped.forEach(d => {
    if (!map[d.empleado_id]) {
      const empInfo = empleadosActivos.value.find(e => e.id === d.empleado_id)
      const tipoPago = empInfo?.tipo_pago || (empInfo?.es_por_horas !== false ? 'HORAS' : 'FIJO_SEMANAL')
      map[d.empleado_id] = {
        id: d.empleado_id,
        nombre: d.nombre,
        apellido: d.apellido,
        empresa_contratista: d.empresa_contratista,
        tipo_empleado: d.tipo_empleado,
        tipo_pago: tipoPago,
        valor_hora:  parseFloat(empInfo?.valor_hora  ?? 0),
        valor_dia:   parseFloat(empInfo?.valor_dia   ?? 0),
        monto_fijo:  parseFloat(empInfo?.monto_fijo_semanal ?? 0),
        es_por_horas: tipoPago === 'HORAS',
        total: 0,
        centros: new Set()
      }
    }
    map[d.empleado_id].total += parseFloat(d.real_horas ?? d.prog_horas ?? 0)
    if (d.ccosto) map[d.empleado_id].centros.add(d.ccosto)
  })

  return Object.values(map).map(e => {
    const regular  = Math.min(e.total, 40)
    const overtime = Math.max(e.total - 40, 0)
    const diasTrabajados = diasMap[e.id]?.size ?? 0
    let totalPagar
    if (e.tipo_pago === 'DIA_LABORADO') {
      totalPagar = diasTrabajados * e.valor_dia
    } else if (e.tipo_pago === 'HORAS') {
      totalPagar = (regular * e.valor_hora) + (overtime * e.valor_hora * 1.5)
    } else {
      totalPagar = e.monto_fijo
    }
    return { ...e, centros: [...e.centros], regular, overtime, diasTrabajados, totalPagar }
  }).sort((a,b) => a.apellido.localeCompare(b.apellido))
})

const resumenTotales = computed(() => ({
  regular:     resumenEmpleados.value.reduce((s,e) => s + e.regular,     0),
  overtime:    resumenEmpleados.value.reduce((s,e) => s + e.overtime,    0),
  total:       resumenEmpleados.value.reduce((s,e) => s + e.total,       0),
  totalPagar:  resumenEmpleados.value.reduce((s,e) => s + e.totalPagar,  0)
}))

const resumenPorCC = computed(() => {
  const map = {}
  resumenEmpleados.value.forEach(emp => {
    emp.centros.forEach(cc => {
      if (!map[cc]) map[cc] = []
      map[cc].push(emp)
    })
  })
  return map
})

const resumenCCOrdenados = computed(() => {
  return Object.keys(resumenPorCC.value).sort()
})

const resumenTotalesPorCC = computed(() => {
  const totales = {}
  resumenCCOrdenados.value.forEach(cc => {
    const empleados = resumenPorCC.value[cc] || []
    totales[cc] = {
      regular: empleados.reduce((s,e) => s + e.regular, 0),
      overtime: empleados.reduce((s,e) => s + e.overtime, 0),
      total: empleados.reduce((s,e) => s + e.total, 0),
      totalPagar: empleados.reduce((s,e) => s + e.totalPagar, 0)
    }
  })
  return totales
})

function getNombreCC(codigo) {
  return ccostos.value.find(c => c.codigo === codigo)?.nombre || codigo
}

function fmtMoney(v) { return '$' + parseFloat(v ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

// Empleados que van en la grilla de un ccosto específico
function empleadosParaCcosto(ccostoId) {
  const conTurnos = new Set(
    detalle.value.filter(d => d.ccosto === ccostoId).map(d => d.empleado_id)
  )
  const agregadosIds = new Set((empleadosAgregados.value[ccostoId] || []).map(e => e.id))
  return empleadosActivos.value
    .filter(e => e.ccosto === ccostoId || conTurnos.has(e.id) || agregadosIds.has(e.id))
    .sort((a,b) => a.apellido.localeCompare(b.apellido))
}

// Empleados disponibles para agregar a un ccosto (los que no están ya en ese ccosto)
const empleadosParaAgregarComputed = computed(() => {
  if (!dlgAgregarEmpCcosto.value) return []
  const yaEnGrilla = new Set(empleadosParaCcosto(dlgAgregarEmpCcosto.value).map(e => e.id))
  const q = buscarEmp.value.toLowerCase()
  return empleadosActivos.value
    .filter(e => !yaEnGrilla.has(e.id))
    .filter(e => !q || `${e.apellido} ${e.nombre}`.toLowerCase().includes(q))
    .sort((a,b) => a.apellido.localeCompare(b.apellido))
})

function abrirAgregarEmp(ccostoId) {
  dlgAgregarEmpCcosto.value = ccostoId
  buscarEmp.value = ''
  dlgAgregarEmp.value = true
}

function agregarEmpleadoAVista(emp) {
  const ccId = dlgAgregarEmpCcosto.value
  if (!empleadosAgregados.value[ccId]) empleadosAgregados.value[ccId] = []
  if (!empleadosAgregados.value[ccId].find(e => e.id === emp.id)) {
    empleadosAgregados.value[ccId].push(emp)
  }
  dlgAgregarEmp.value = false
  buscarEmp.value = ''
}

function getNombreDisplay(emp) {
  if (emp.tipo_empleado === '1099' && emp.empresa_contratista) {
    return `${emp.apellido}, ${emp.nombre} - ${emp.empresa_contratista}`
  }
  return `${emp.apellido}, ${emp.nombre}`
}

function getTurnoCcosto(empId, semanaInicio, offset, ccostoId) {
  if (!semanaInicio) return null
  const fecha = addDays(semanaInicio, offset)
  if (!fecha) return null
  return detalle.value.find(d =>
    d.empleado_id === empId &&
    d.fecha?.split('T')[0] === fecha &&
    d.ccosto === ccostoId
  ) || null
}

function addDays(dateStr, days) {
  if (!dateStr) return null
  try {
    const dateOnly = String(dateStr).split('T')[0]
    const d = new Date(dateOnly + 'T00:00:00')
    if (isNaN(d.getTime())) return null
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
  } catch { return null }
}

function fmtHoras(v) { return parseFloat(v ?? 0).toFixed(2) }

function calcularHorasAuto() {
  if (!turnoEdit.value?.real_inicio || !turnoEdit.value?.real_fin) return
  const [h1, m1] = turnoEdit.value.real_inicio.split(':').map(Number)
  const [h2, m2] = turnoEdit.value.real_fin.split(':').map(Number)
  let mins = (h2 * 60 + m2) - (h1 * 60 + m1)
  if (mins <= 0) mins += 24 * 60
  turnoEdit.value.real_horas = parseFloat((mins / 60).toFixed(2))
}

function totalHorasEmpCcosto(empId, ccostoId) {
  return detalle.value
    .filter(d => d.empleado_id === empId && d.ccosto === ccostoId && !d.es_dia_libre)
    .reduce((s, d) => s + parseFloat(d.real_horas ?? d.prog_horas ?? 0), 0)
    .toFixed(2)
}

function totalHorasCcosto(ccostoId) {
  return detalle.value
    .filter(d => d.ccosto === ccostoId && !d.es_dia_libre)
    .reduce((s, d) => s + parseFloat(d.real_horas ?? d.prog_horas ?? 0), 0)
    .toFixed(2)
}

function fmtFecha(f) {
  if (!f) return '—'
  const s = String(f).split('T')[0]; const [y,m,d] = s.split('-')
  const meses = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${parseInt(d)} ${meses[parseInt(m)]} ${y}`
}
function fmtDiaMes(inicio, offset) {
  if (!inicio) return '—'
  try { const f = addDays(inicio, offset); const [,m,d] = f.split('-'); return `${parseInt(d)}/${parseInt(m)}` }
  catch { return '—' }
}
function fmtFechaLarga(f) {
  if (!f) return ''
  const dias = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
  const dateOnly = String(f).split('T')[0]
  const d = new Date(dateOnly + 'T00:00:00')
  const [,m,dd] = dateOnly.split('-')
  return `${dias[d.getDay()]} ${parseInt(dd)}/${parseInt(m)}`
}

async function cargarSemanas() {
  const [semsR, ccR, hcR, empR] = await Promise.all([
    api.get('/nomina/semanas',       { params: { empresa: empresa.value } }),
    api.get('/ccostos',              { params: { empresa: empresa.value } }),
    api.get('/nomina/horario-config',{ params: { empresa: empresa.value } }),
    api.get('/nomina/empleados',     { params: { empresa: empresa.value, estado: 'ACTIVO' } }),
  ])
  semanas.value        = semsR.data?.data || []
  ccostos.value        = ccR.data?.data || ccR.data || []
  horarioConfigs.value = hcR.data?.data || []
  empleadosActivos.value = empR.data?.data || []
  if (semanas.value.length && !semanaSelId.value) {
    semanaSelId.value = semanas.value[0].id
    cargarDetalle()
  }
}

async function cargarDetalle() {
  if (!semanaSelId.value) { semanaActual.value = null; detalle.value = []; return }
  cargando.value = true
  try {
    const r = await api.get(`/nomina/semanas/${semanaSelId.value}/detalle`)
    semanaActual.value = r.data.semana
    detalle.value      = r.data.detalle || []
  } finally { cargando.value = false }
}

async function crearSemana() {
  if (!nuevaSemanaInicio.value) return
  const d = new Date(nuevaSemanaInicio.value + 'T00:00:00')
  if (d.getDay() !== 1) { alert('La fecha debe ser un lunes'); return }
  creandoSemana.value = true
  try {
    const r = await api.post('/nomina/semanas', {
      empresa: empresa.value, semana_inicio: nuevaSemanaInicio.value, semana_fin: nuevaSemanaFin.value
    })
    dlgNuevaSemana.value = false
    await cargarSemanas()
    semanaSelId.value = r.data.data?.id
    cargarDetalle()
  } catch(e) { alert(e?.response?.data?.error || e.message) }
  finally { creandoSemana.value = false }
}

async function borrarSemana() {
  if (!semanaSelId.value || !semanaActual.value) return
  const label = `${fmtFecha(semanaActual.value.semana_inicio)} — ${fmtFecha(semanaActual.value.semana_fin)}`
  if (!confirm(`⚠️ ¿Borrar COMPLETAMENTE la semana "${label}"?\n\nEsto eliminará la semana y TODOS sus turnos.\nEsta acción no se puede deshacer.`)) return
  borrando.value = true
  try {
    await api.delete(`/nomina/semanas/${semanaSelId.value}`)
    semanaSelId.value = ''
    semanaActual.value = null
    detalle.value = []
    await cargarSemanas()
  } catch(e) {
    alert('❌ Error al borrar: ' + (e?.response?.data?.error || e.message))
  } finally { borrando.value = false }
}

async function copiarSemanaAnterior() {
  if (!semanaSelId.value) return
  if (!confirm('¿Copiar el horario completo de la semana anterior?\n\nSolo se copiarán los días que aún no tengan turno asignado.')) return
  copiando.value = true
  try {
    const r = await api.post(`/nomina/semanas/${semanaSelId.value}/copiar-anterior`, { empresa: empresa.value })
    alert(r.data.message || '✅ Semana copiada correctamente')
    await cargarDetalle()
  } catch(e) {
    alert('❌ ' + (e?.response?.data?.error || e.message))
  } finally { copiando.value = false }
}

function abrirDialogPlantillaParaCC(cc) {
  ccActualSeleccionado.value = cc
  plantillaParaCCActual.value = plantillasPorCC[cc.codigo] || ''
  dlgPlantillaParaCC.value = true
}

async function aplicarPlantillaYCerrar(event) {
  const cfgId = event.target.value
  if (!cfgId) return

  const ccCodigo = ccActualSeleccionado.value.codigo
  plantillasPorCC[ccCodigo] = cfgId
  dlgPlantillaParaCC.value = false

  // Generar turnos SOLO para este CC y sus empleados
  try {
    // Obtener la plantilla seleccionada
    const plantilla = horarioConfigs.value.find(h => String(h.id) === cfgId)
    if (!plantilla) throw new Error('Plantilla no encontrada')

    // Obtener empleados de este CC
    const empleados = empleadosParaCcosto(ccCodigo)
    if (!empleados.length) {
      alert('ℹ️ No hay empleados en este centro de costo')
      return
    }

    for (const emp of empleados) {
      for (const dia of DIAS) {
        const diaSemana = dia.offset + 1
        const diaConfig = plantilla.dias?.find(d => d.dia_semana === diaSemana)
        const fecha = addDays(semanaActual.value.semana_inicio, dia.offset)

        // Verificar si ya existe un turno para este empleado, fecha y ccosto
        const turnoExistente = detalle.value.find(d =>
          d.empleado_id === emp.id &&
          String(d.fecha).split('T')[0] === fecha &&
          d.ccosto === ccCodigo
        )

        if (!turnoExistente && diaConfig && diaConfig.activo) {
          // Crear turno
          await api.post('/nomina/semanas/detalle', {
            semana_id: semanaActual.value.id,
            empleado_id: emp.id,
            fecha: fecha,
            real_inicio: diaConfig.hora_inicio || null,
            real_fin: diaConfig.hora_fin || null,
            real_horas: diaConfig.horas_default || 0,
            ccosto: ccCodigo,
            es_dia_libre: false,
            ausencia_tipo: '',
            notas: ''
          })
        } else if (!turnoExistente && (!diaConfig || !diaConfig.activo)) {
          // Crear día libre
          await api.post('/nomina/semanas/detalle', {
            semana_id: semanaActual.value.id,
            empleado_id: emp.id,
            fecha: fecha,
            real_inicio: null,
            real_fin: null,
            real_horas: 0,
            ccosto: ccCodigo,
            es_dia_libre: true,
            ausencia_tipo: '',
            notas: ''
          })
        }
      }
    }

    await cargarDetalle()
  } catch(e) {
    alert('❌ Error: ' + (e?.response?.data?.error || e.message))
  }
}

async function copiarSemanaAnteriorPorCC(ccCodigo) {
  if (!semanaSelId.value) return
  const semanaIdx = semanas.value.findIndex(s => s.id === semanaSelId.value)
  if (semanaIdx <= 0) {
    alert('⚠️ No hay semana anterior para copiar')
    return
  }
  if (!confirm(`¿Copiar horarios de la semana anterior para ${ccostos.value.find(c => c.codigo === ccCodigo)?.nombre}?\n\nSolo se copiarán los días sin turno.`)) return

  copiando.value = true
  try {
    const semanaAnterior = semanas.value[semanaIdx - 1]
    const empleados = empleadosParaCcosto(ccCodigo)

    for (const emp of empleados) {
      for (const dia of DIAS) {
        const diaSemana = dia.offset + 1
        const fecha = addDays(semanaActual.value.semana_inicio, dia.offset)
        const fechaAnterior = addDays(semanaAnterior.semana_inicio, dia.offset)

        const turnoExistente = detalle.value.find(d =>
          d.empleado_id === emp.id &&
          String(d.fecha).split('T')[0] === fecha &&
          d.ccosto === ccCodigo
        )

        if (!turnoExistente) {
          const turnoAnterior = detalle.value.find(d =>
            d.empleado_id === emp.id &&
            String(d.fecha).split('T')[0] === fechaAnterior &&
            d.ccosto === ccCodigo
          )

          if (turnoAnterior) {
            await api.post('/nomina/semanas/detalle', {
              semana_id: semanaActual.value.id,
              empleado_id: emp.id,
              fecha: fecha,
              real_inicio: turnoAnterior.real_inicio || turnoAnterior.prog_inicio,
              real_fin: turnoAnterior.real_fin || turnoAnterior.prog_fin,
              real_horas: turnoAnterior.real_horas ?? turnoAnterior.prog_horas,
              ccosto: ccCodigo,
              es_dia_libre: turnoAnterior.es_dia_libre,
              ausencia_tipo: turnoAnterior.ausencia_tipo || '',
              notas: turnoAnterior.notas || ''
            })
          }
        }
      }
    }
    alert('✅ Semana anterior copiada para este centro de costo')
    await cargarDetalle()
  } catch(e) {
    alert('❌ Error: ' + (e?.response?.data?.error || e.message))
  } finally { copiando.value = false }
}

async function limpiarHorariosPorCC(ccCodigo) {
  if (!semanaSelId.value || !semanaActual.value?.id) return
  const ccNombre = ccostos.value.find(c => c.codigo === ccCodigo)?.nombre
  if (!confirm(`⚠️ ¿ELIMINAR TODOS los horarios de ${ccNombre}?\n\nEsta acción no se puede deshacer.`)) return

  try {
    const turnosPorEliminar = detalle.value.filter(d =>
      d.ccosto === ccCodigo &&
      d.semana_id === semanaActual.value.id
    )

    for (const turno of turnosPorEliminar) {
      if (turno.id) {
        await api.delete(`/nomina/semanas/detalle/${turno.id}`)
      }
    }

    await cargarDetalle()
  } catch(e) {
    alert('❌ Error: ' + (e?.response?.data?.error || e.message))
  }
}

async function publicar() {
  if (!semanaSelId.value) return
  try {
    await api.put(`/nomina/semanas/${semanaSelId.value}/publicar`)
    await cargarDetalle()
  } catch(e) { alert('❌ Error al publicar: ' + (e?.response?.data?.error || e.message)) }
}

function abrirEditar(emp, offset, ccostoId) {
  if (semanaActual.value?.estado === 'CERRADO') return
  const fecha = addDays(semanaActual.value.semana_inicio, offset)
  if (!fecha) return
  const diaSemana = offset + 1
  const t = getTurnoCcosto(emp.id, semanaActual.value.semana_inicio, offset, ccostoId)
  const diaConfig = horarioConfigs.value.length > 0
    ? horarioConfigs.value[0].dias?.find(d => d.dia_semana === diaSemana)
    : null

  editEmp.value    = emp
  editFecha.value  = fecha
  editCcosto.value = ccostoId
  turnoEdit.value  = t ? {
    id:           t.id,
    real_inicio:  t.real_inicio?.slice(0,5) || t.prog_inicio?.slice(0,5) || diaConfig?.hora_inicio || '',
    real_fin:     t.real_fin?.slice(0,5)    || t.prog_fin?.slice(0,5)    || diaConfig?.hora_fin    || '',
    real_horas:   t.real_horas ?? t.prog_horas ?? diaConfig?.horas_default ?? 0,
    ccosto:       t.ccosto || ccostoId,
    es_dia_libre: t.es_dia_libre || false,
    ausencia_tipo:t.ausencia_tipo || '',
    notas:        t.notas || ''
  } : {
    id:           null,
    semana_id:    semanaActual.value.id,
    empleado_id:  emp.id,
    fecha,
    real_inicio:  diaConfig?.hora_inicio || '',
    real_fin:     diaConfig?.hora_fin    || '',
    real_horas:   diaConfig?.horas_default || 0,
    ccosto:       ccostoId,
    es_dia_libre: !diaConfig,
    ausencia_tipo:'',
    notas:        ''
  }
  dlgEditar.value = true
}

async function guardarTurno() {
  if (!turnoEdit.value) return
  guardandoTurno.value = true
  try {
    if (!turnoEdit.value.id) {
      await api.post('/nomina/semanas/detalle', {
        semana_id:    turnoEdit.value.semana_id,
        empleado_id:  turnoEdit.value.empleado_id,
        fecha:        turnoEdit.value.fecha,
        real_inicio:  turnoEdit.value.real_inicio || null,
        real_fin:     turnoEdit.value.real_fin    || null,
        real_horas:   turnoEdit.value.real_horas  || 0,
        ccosto:       turnoEdit.value.ccosto      || '',
        es_dia_libre: turnoEdit.value.es_dia_libre || false,
        ausencia_tipo:turnoEdit.value.ausencia_tipo || '',
        notas:        turnoEdit.value.notas || ''
      })
    } else {
      await api.put(`/nomina/semanas/detalle/${turnoEdit.value.id}`, turnoEdit.value)
    }
    dlgEditar.value = false
    await cargarDetalle()
  } catch(e) {
    alert('❌ Error: ' + (e?.response?.data?.error || e.message))
  } finally { guardandoTurno.value = false }
}

async function eliminarTurno() {
  if (!turnoEdit.value?.id) return
  const emp = editEmp.value
  if (!confirm(`¿Eliminar turno de ${emp?.apellido}, ${emp?.nombre}?`)) return
  eliminandoTurno.value = true
  try {
    await api.delete(`/nomina/semanas/detalle/${turnoEdit.value.id}`)
    dlgEditar.value = false
    await cargarDetalle()
  } catch(e) {
    alert('❌ Error: ' + (e?.response?.data?.error || e.message))
  } finally { eliminandoTurno.value = false }
}

onMounted(cargarSemanas)
</script>

<style scoped>
.nom-wrap { display: flex; flex-direction: column; gap: 12px; }
.nom-header { display: flex; align-items: center; gap: 14px; background: linear-gradient(135deg,#0c2340,#1a3a6e); border-radius: 14px; padding: 20px 24px; flex-wrap: wrap; }
.nom-header-icon { width: 42px; height: 42px; border-radius: 10px; background: rgba(6,182,212,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nom-title { font-size: 17px; font-weight: 800; color: #fff; margin: 0; }
.nom-sub   { font-size: 12px; color: rgba(255,255,255,0.5); margin: 0; display: flex; align-items: center; gap: 8px; }
.flex-1 { flex: 1; }
.nom-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),0.07); border-radius: 0 0 12px 12px; overflow: hidden; }

.estado-badge { font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 4px; }
.estado-borrador  { background: rgba(148,163,184,0.15); color: #94a3b8; }
.estado-publicado { background: rgba(16,185,129,0.15); color: #10b981; }
.estado-cerrado   { background: rgba(239,68,68,0.15); color: #ef4444; }

/* Bloque por ccosto */
.ccosto-bloque { display: flex; flex-direction: column; }
.ccosto-titulo-bar {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px;
  background: rgba(var(--v-theme-on-surface),0.04);
  border: 1px solid rgba(var(--v-theme-on-surface),0.07);
  border-bottom: none;
  border-radius: 12px 12px 0 0;
}
.ccosto-dot { width: 8px; height: 8px; border-radius: 50%; background: #06b6d4; flex-shrink: 0; }
.ccosto-nombre { font-size: 13px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); }
.ccosto-codigo { font-size: 10px; font-weight: 700; color: rgba(var(--v-theme-on-surface),0.35); background: rgba(var(--v-theme-on-surface),0.06); padding: 2px 6px; border-radius: 4px; }
.ccosto-resumen { font-size: 11px; color: rgba(var(--v-theme-on-surface),0.4); margin-left: auto; }
.ccosto-vacio { padding: 20px; text-align: center; color: rgba(var(--v-theme-on-surface),0.3); font-size: 12px; display: flex; flex-direction: column; align-items: center; gap: 6px; }

/* Schedule grid */
.semana-grid { display: grid; }
.sg-header-emp, .sg-header-dia {
  padding: 8px; text-align: center;
  font-size: 10px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface),0.4);
  background: rgba(var(--v-theme-on-surface),0.04);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.08);
  border-right: 1px solid rgba(var(--v-theme-on-surface),0.06);
}
.sg-header-emp { text-align: left; padding-left: 14px; }
.sg-dia-nombre { font-weight: 800; }
.sg-dia-fecha  { font-size: 9px; color: rgba(var(--v-theme-on-surface),0.3); margin-top: 1px; }
.sg-emp-cell {
  display: flex; flex-direction: column; justify-content: center; padding: 8px 12px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.06);
  border-right: 1px solid rgba(var(--v-theme-on-surface),0.06);
  background: rgba(var(--v-theme-on-surface),0.02);
  min-width: 0;
}
.sg-emp-nombre { font-size: 11px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sg-emp-badge  { font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 3px; margin-top: 2px; align-self: flex-start; }
.badge-w2   { background: rgba(139,92,246,0.15); color: #8b5cf6; }
.badge-1099 { background: rgba(245,158,11,0.15); color: #f59e0b; }
.sg-turno-cell {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.06);
  border-right: 1px solid rgba(var(--v-theme-on-surface),0.06);
  padding: 5px 4px; text-align: center; cursor: pointer;
  transition: background 0.12s; min-height: 52px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.sg-turno-cell:hover { background: rgba(139,92,246,0.06); }
.sg-turno-horas { font-size: 9px; font-weight: 600; color: #06b6d4; line-height: 1.3; }
.sg-turno-total { font-size: 11px; font-weight: 700; margin-top: 1px; }
.ajustado { color: #f59e0b; }
.sg-libre     { font-size: 10px; color: rgba(var(--v-theme-on-surface),0.3); }
.sg-sin-turno { font-size: 20px; color: rgba(var(--v-theme-on-surface),0.12); }

/* Footer */
.sg-footer-simple { display: flex; align-items: center; justify-content: flex-end; padding: 8px 14px; border-top: 1px solid rgba(var(--v-theme-on-surface),0.07); background: rgba(var(--v-theme-on-surface),0.02); }

/* Dialog agregar empleado */
.emp-list { max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.emp-list-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; border-radius: 8px; cursor: pointer;
  border: 1px solid rgba(var(--v-theme-on-surface),0.08); transition: background 0.12s;
}
.emp-list-item:hover { background: rgba(6,182,212,0.08); border-color: rgba(6,182,212,0.3); }

.drw-select { height: 34px; padding: 0 8px; border-radius: 7px; border: 1px solid rgba(var(--v-theme-on-surface),0.15); background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); font-size: 12px; outline: none; }
.drw-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.drw-field { display: flex; flex-direction: column; gap: 4px; }
.drw-field label { font-size: 10px; font-weight: 700; color: rgba(var(--v-theme-on-surface),0.5); text-transform: uppercase; }
.drw-input { height: 34px; padding: 0 8px; border-radius: 7px; border: 1px solid rgba(var(--v-theme-on-surface),0.15); background: rgba(var(--v-theme-on-surface),0.03); color: rgb(var(--v-theme-on-surface)); font-size: 12px; outline: none; width: 100%; box-sizing: border-box; }
.mt-3 { margin-top: 12px; } .mb-3 { margin-bottom: 12px; } .mt-2 { margin-top: 8px; } .pt-2 { padding-top: 8px !important; } .pb-2 { padding-bottom: 8px !important; } .pt-0 { padding-top: 0 !important; }
.cfg-edit-check { display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; }
.horas-calculadas { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #10b981; font-weight: 700; padding: 6px 10px; background: rgba(16,185,129,0.08); border-radius: 8px; }
/* Resumen de horas */
.resumen-card { border-radius: 14px !important; overflow: hidden; }
.resumen-titulo { padding: 14px 18px; font-size: 11px; font-weight: 800; letter-spacing: 0.8px; color: rgba(var(--v-theme-on-surface),0.5); border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.07); display: flex; align-items: center; }
.resumen-tabla { width: 100%; border-collapse: collapse; font-size: 12px; }
.resumen-tabla th { padding: 8px 12px; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface),0.4); text-transform: uppercase; background: rgba(var(--v-theme-on-surface),0.03); border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.07); }
.resumen-tabla td { padding: 10px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.05); }
.resumen-tabla tbody tr:hover { background: rgba(var(--v-theme-on-surface),0.03); }
.row-ot { background: rgba(239,68,68,0.03) !important; }
.resumen-nombre { font-weight: 600; }
.resumen-empresa { font-size: 10px; color: rgba(var(--v-theme-on-surface),0.4); margin-left: 6px; font-weight: 400; }
.resumen-reg   { color: #10b981; font-weight: 700; }
.resumen-total { font-weight: 700; }
.resumen-rate  { color: rgba(var(--v-theme-on-surface),0.6); font-size: 11px; }
.resumen-fijo  { font-size: 10px; background: rgba(139,92,246,0.1); color: #8b5cf6; padding: 2px 6px; border-radius: 4px; font-weight: 700; }
.resumen-pagar { font-weight: 800; color: #10b981; font-size: 13px; }
.ta-c { text-align: center; }
.ot-badge { background: rgba(239,68,68,0.12); color: #ef4444; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 5px; }
.ccosto-chip { display: inline-block; font-size: 9px; font-weight: 700; background: rgba(var(--v-theme-on-surface),0.08); color: rgba(var(--v-theme-on-surface),0.5); padding: 1px 5px; border-radius: 3px; margin: 1px 2px; }
.resumen-footer td { padding: 10px 12px; font-size: 12px; background: rgba(var(--v-theme-on-surface),0.04); border-top: 2px solid rgba(var(--v-theme-on-surface),0.1); }

.d-flex { display: flex; } .align-center { align-items: center; } .justify-space-between { justify-content: space-between; }
.mr-1 { margin-right: 4px; } .pa-3 { padding: 12px; } .pa-4 { padding: 16px; }
</style>
