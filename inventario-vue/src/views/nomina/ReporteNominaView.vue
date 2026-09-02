<template>
  <MainLayout>
    <div class="rn-container">

      <PageHeader
        title="Reporte de Nómina"
        description="Análisis de costos por período, empleado, centro de costo e impuestos"
        :crumbs="['Nómina', 'Reportes', 'Reporte de Nómina']"
      />

      <!-- FILTROS -->
      <div class="rn-filters-card">
        <div class="rn-filters-row">
          <div class="filter-group">
            <div class="filter-label">FECHA INICIO</div>
            <CampoFecha v-model="filtros.fechaInicio" variant="outlined" density="compact"
              hide-details style="min-width:160px" />
          </div>
          <div class="filter-group">
            <div class="filter-label">FECHA FIN</div>
            <CampoFecha v-model="filtros.fechaFin" variant="outlined" density="compact"
              hide-details style="min-width:160px" />
          </div>
          <v-btn color="secondary" variant="flat" rounded="lg" :loading="cargando" @click="cargar" height="40">
            <v-icon start>mdi-magnify</v-icon>Generar Reporte
          </v-btn>
          <v-spacer />
          <v-btn v-if="kpis" variant="flat" color="secondary" rounded="lg" height="40"
            :loading="generandoPDF" :disabled="pdfFila !== null" @click="exportarPDF"
            title="Informe consolidado de todo el período filtrado">
            <v-icon start>mdi-file-pdf-box</v-icon>Exportar todo el período
          </v-btn>
        </div>
      </div>

      <v-progress-linear v-if="cargando" indeterminate color="secondary" height="3" class="mb-4" />

      <!-- KPIs -->
      <div v-if="kpis" class="kpi-grid">
        <KpiCard :index="0" label="Bruto Pagado" :value="fmt(kpis.total_bruto)" icon="mdi-cash-multiple" color="var(--indigo)" />
        <KpiCard :index="1" label="Deducciones Emp." :value="fmt(kpis.total_deducciones)" icon="mdi-minus-circle-outline" color="var(--error)" value-color="var(--error)" />
        <KpiCard :index="2" label="Neto Pagado" :value="fmt(kpis.total_neto)" icon="mdi-bank-transfer-out" color="var(--success)" value-color="var(--success)" />
        <KpiCard :index="3" label="Aportes Empleador" :value="fmt(kpis.total_aportes_er)" icon="mdi-office-building-outline" color="var(--gold)" value-color="var(--gold)" />
        <KpiCard :index="4" label="Costo Total Empresa" :value="fmt(kpis.costo_total_empresa)" icon="mdi-domain" color="var(--indigo)" value-color="var(--indigo)" />
        <KpiCard :index="5" label="Nóminas / Empleados" :value="`${kpis.total_nominas} / ${kpis.total_empleados}`" icon="mdi-account-group-outline" color="var(--indigo)" value-color="var(--indigo)" />
      </div>

      <!-- TABS DE VISTA -->
      <div v-if="kpis || datos.length" class="rn-tabs-card">
        <div class="rn-tabs-header">
          <button v-for="t in tabs" :key="t.val"
            class="rn-tab" :class="{ 'rn-tab--active': vistaActiva === t.val }"
            @click="cambiarVista(t.val)">
            <v-icon size="15" class="mr-1">{{ t.icon }}</v-icon>{{ t.label }}
          </button>
        </div>

        <!-- ESTADO VACÍO -->
        <div v-if="!cargando && datos.length === 0" class="rn-empty">
          <v-icon size="40" color="rgba(var(--v-theme-on-surface),.15)" class="mb-2">mdi-file-search-outline</v-icon>
          <div>No hay nóminas aprobadas en el período seleccionado</div>
        </div>

        <!-- VISTA: POR PERÍODO -->
        <div v-else-if="vistaActiva === 'periodo' && datos.length" class="rn-table-wrap">
          <table class="rn-table">
            <thead>
              <tr>
                <th>PERÍODO</th>
                <th class="ta-r">EMPLEADOS</th>
                <th class="ta-r">BRUTO</th>
                <th class="ta-r">DEDUCCIONES</th>
                <th class="ta-r">APORTES ER</th>
                <th class="ta-r">NETO</th>
                <th class="ta-r">COSTO EMPRESA</th>
                <th class="ta-c">PDF</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in datos" :key="r.id">
                <td>
                  <div class="periodo-label">{{ fmtFecha(r.semana_inicio) }}</div>
                  <div class="periodo-sub">al {{ fmtFecha(r.semana_fin) }}</div>
                </td>
                <td class="ta-r">{{ r.empleados }}</td>
                <td class="ta-r font-mono">{{ fmt(r.total_bruto) }}</td>
                <td class="ta-r font-mono text-error">{{ fmt(r.total_deducciones) }}</td>
                <td class="ta-r font-mono text-warning">{{ fmt(r.total_aportes_er) }}</td>
                <td class="ta-r font-mono text-success">{{ fmt(r.total_neto) }}</td>
                <td class="ta-r font-mono text-purple">{{ fmt(r.costo_empresa) }}</td>
                <td class="ta-c">
                  <!-- Imprime SOLO esta nomina. Antes habia que estrechar el
                       filtro de fechas hasta dejar una sola fila y recien
                       entonces exportar. -->
                  <v-btn
                    icon
                    variant="text"
                    size="x-small"
                    color="secondary"
                    :loading="pdfFila === r.id"
                    :disabled="generandoPDF || (pdfFila !== null && pdfFila !== r.id)"
                    :title="`PDF de la nómina del ${fmtFecha(r.semana_inicio)} al ${fmtFecha(r.semana_fin)}`"
                    @click="exportarPDFNomina(r)"
                  >
                    <v-icon size="19">mdi-file-pdf-box</v-icon>
                  </v-btn>
                  <!-- Horas trabajadas de esta nómina: quién trabajó, con qué
                       salario base y en qué centros de costo. -->
                  <v-btn
                    icon
                    variant="text"
                    size="x-small"
                    color="primary"
                    :loading="horasFila === r.id"
                    :disabled="horasFila !== null && horasFila !== r.id"
                    :title="`Horas trabajadas del ${fmtFecha(r.semana_inicio)} al ${fmtFecha(r.semana_fin)}`"
                    @click="exportarHoras(r)"
                  >
                    <v-icon size="19">mdi-clock-outline</v-icon>
                  </v-btn>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="rn-tfoot">
                <td><strong>TOTAL</strong></td>
                <td class="ta-r">{{ kpis.total_empleados }}</td>
                <td class="ta-r font-mono">{{ fmt(kpis.total_bruto) }}</td>
                <td class="ta-r font-mono text-error">{{ fmt(kpis.total_deducciones) }}</td>
                <td class="ta-r font-mono text-warning">{{ fmt(kpis.total_aportes_er) }}</td>
                <td class="ta-r font-mono text-success">{{ fmt(kpis.total_neto) }}</td>
                <td class="ta-r font-mono text-purple">{{ fmt(kpis.costo_total_empresa) }}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- VISTA: POR MES (reparto contable de semanas que cruzan meses) -->
        <div v-else-if="vistaActiva === 'meses' && datos.length" class="rn-table-wrap">
          <div class="rn-nota">
            <v-icon size="15" color="var(--indigo)">mdi-information-outline</v-icon>
            <span>
              Las nóminas que cruzan dos meses se reparten entre ellos según las
              <strong>horas trabajadas en cada mes</strong>. Cuando la nómina no
              tiene horario cargado, el reparto se hace por días calendario.
            </span>
          </div>

          <table class="rn-table">
            <thead>
              <tr>
                <th>MES / NÓMINA</th>
                <th class="ta-r">DÍAS</th>
                <th class="ta-r">HORAS</th>
                <th class="ta-r">% NÓMINA</th>
                <th class="ta-r">BRUTO</th>
                <th class="ta-r">DEDUCCIONES</th>
                <th class="ta-r">APORTES ER</th>
                <th class="ta-r">NETO</th>
                <th class="ta-r">COSTO EMPRESA</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="g in mesesAgrupados" :key="g.mes">
                <!-- Subtotal del mes: es la cifra que se lleva a contabilidad -->
                <tr class="rn-mes-head">
                  <td>
                    <v-icon size="15" class="mr-1">mdi-calendar-month-outline</v-icon>
                    <strong>{{ g.nombre }}</strong>
                    <span class="mes-sub">{{ g.filas.length }} nómina{{ g.filas.length !== 1 ? 's' : '' }}</span>
                  </td>
                  <td class="ta-r font-mono">{{ g.dias }}</td>
                  <td class="ta-r font-mono">{{ fmtNum(g.horas) }}</td>
                  <td class="ta-r">—</td>
                  <td class="ta-r font-mono">{{ fmt(g.totales.total_bruto) }}</td>
                  <td class="ta-r font-mono text-error">{{ fmt(g.totales.total_deducciones) }}</td>
                  <td class="ta-r font-mono text-warning">{{ fmt(g.totales.total_aportes_er) }}</td>
                  <td class="ta-r font-mono text-success">{{ fmt(g.totales.total_neto) }}</td>
                  <td class="ta-r font-mono text-purple">{{ fmt(g.totales.costo_empresa) }}</td>
                </tr>

                <!-- Detalle: qué nómina aportó cuánto a este mes -->
                <tr v-for="r in g.filas" :key="g.mes + '_' + r.liquidacion_id" class="rn-mes-detalle">
                  <td>
                    <div class="periodo-label">
                      {{ fmtFecha(r.semana_inicio) }} — {{ fmtFecha(r.semana_fin) }}
                      <span v-if="r.periodo_partido" class="badge-partido"
                        title="Esta nómina cruza dos meses: solo se muestra la parte que corresponde a este mes">
                        <v-icon size="10">mdi-call-split</v-icon>PARCIAL
                      </span>
                    </div>
                    <div class="periodo-sub">
                      {{ r.prorrateo_por_horas ? 'Repartido por horas trabajadas' : 'Repartido por días calendario' }}
                    </div>
                  </td>
                  <td class="ta-r font-mono">{{ r.dias_en_mes }}</td>
                  <td class="ta-r font-mono">{{ fmtNum(r.horas_en_mes) }}</td>
                  <td class="ta-r font-mono">{{ fmtNum(r.porcentaje) }}%</td>
                  <td class="ta-r font-mono">{{ fmt(r.total_bruto) }}</td>
                  <td class="ta-r font-mono text-error">{{ fmt(r.total_deducciones) }}</td>
                  <td class="ta-r font-mono text-warning">{{ fmt(r.total_aportes_er) }}</td>
                  <td class="ta-r font-mono text-success">{{ fmt(r.total_neto) }}</td>
                  <td class="ta-r font-mono text-purple">{{ fmt(r.costo_empresa) }}</td>
                </tr>
              </template>
            </tbody>
            <tfoot>
              <tr class="rn-tfoot">
                <td colspan="4"><strong>TOTAL</strong></td>
                <td class="ta-r font-mono">{{ fmt(kpis.total_bruto) }}</td>
                <td class="ta-r font-mono text-error">{{ fmt(kpis.total_deducciones) }}</td>
                <td class="ta-r font-mono text-warning">{{ fmt(kpis.total_aportes_er) }}</td>
                <td class="ta-r font-mono text-success">{{ fmt(kpis.total_neto) }}</td>
                <td class="ta-r font-mono text-purple">{{ fmt(kpis.costo_total_empresa) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- VISTA: POR EMPLEADO -->
        <div v-else-if="vistaActiva === 'empleado' && datos.length" class="rn-table-wrap">
          <table class="rn-table">
            <thead>
              <tr>
                <th>EMPLEADO</th>
                <th class="ta-c">TIPO</th>
                <th class="ta-r">NÓMINAS</th>
                <th class="ta-r">HRS REG</th>
                <th class="ta-r">HRS OT</th>
                <th class="ta-r">BRUTO</th>
                <th class="ta-r">DEDUCCIONES</th>
                <th class="ta-r">APORTES ER</th>
                <th class="ta-r">NETO</th>
                <th class="ta-r">COSTO EMP.</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in datos" :key="r.empleado_id">
                <td class="font-weight-medium">{{ r.nombre }}</td>
                <td class="ta-c">
                  <span :class="r.tipo_empleado === 'W2' ? 'badge-w2' : 'badge-1099'">{{ r.tipo_empleado }}</span>
                </td>
                <td class="ta-r">{{ r.total_nominas }}</td>
                <td class="ta-r font-mono">{{ fmtNum(r.horas_regulares) }}</td>
                <td class="ta-r font-mono">{{ fmtNum(r.horas_overtime) }}</td>
                <td class="ta-r font-mono">{{ fmt(r.total_bruto) }}</td>
                <td class="ta-r font-mono text-error">{{ fmt(r.total_deducciones) }}</td>
                <td class="ta-r font-mono text-warning">{{ fmt(r.total_aportes_er) }}</td>
                <td class="ta-r font-mono text-success">{{ fmt(r.total_neto) }}</td>
                <td class="ta-r font-mono text-purple">{{ fmt(r.costo_empresa) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="rn-tfoot">
                <td colspan="5"><strong>TOTAL</strong></td>
                <td class="ta-r font-mono">{{ fmt(kpis.total_bruto) }}</td>
                <td class="ta-r font-mono text-error">{{ fmt(kpis.total_deducciones) }}</td>
                <td class="ta-r font-mono text-warning">{{ fmt(kpis.total_aportes_er) }}</td>
                <td class="ta-r font-mono text-success">{{ fmt(kpis.total_neto) }}</td>
                <td class="ta-r font-mono text-purple">{{ fmt(kpis.costo_total_empresa) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- VISTA: POR CENTRO DE COSTO -->
        <div v-else-if="vistaActiva === 'ccosto' && datos.length" class="rn-table-wrap">
          <table class="rn-table">
            <thead>
              <tr>
                <th>CENTRO DE COSTO</th>
                <th class="ta-c">CÓD.</th>
                <th class="ta-r">EMPLEADOS</th>
                <th class="ta-r">HORAS</th>
                <th class="ta-r">COSTO BRUTO</th>
                <th class="ta-r">COSTO TOTAL</th>
                <th class="ta-r">% DEL TOTAL</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in datos" :key="r.ccosto">
                <td class="font-weight-medium">{{ r.ccosto_nombre }}</td>
                <td class="ta-c text-caption font-mono" style="color:rgba(var(--v-theme-on-surface),.5)">{{ r.ccosto }}</td>
                <td class="ta-r">{{ r.empleados }}</td>
                <td class="ta-r font-mono">{{ fmtNum(r.horas) }}</td>
                <td class="ta-r font-mono">{{ fmt(r.costo_bruto) }}</td>
                <td class="ta-r font-mono text-purple">{{ fmt(r.costo_total) }}</td>
                <td class="ta-r">
                  <div class="pct-bar-wrap">
                    <div class="pct-bar" :style="{ width: pctCcosto(r.costo_total) + '%' }"></div>
                    <span class="pct-label">{{ pctCcosto(r.costo_total).toFixed(1) }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="rn-tfoot">
                <td colspan="4"><strong>TOTAL</strong></td>
                <td class="ta-r font-mono">{{ fmt(totalCcostoBruto) }}</td>
                <td class="ta-r font-mono text-purple">{{ fmt(totalCcostoTotal) }}</td>
                <td class="ta-r">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- VISTA: IMPUESTOS -->
        <div v-else-if="vistaActiva === 'impuestos' && datos.length" class="rn-table-wrap">
          <table class="rn-table">
            <thead>
              <tr>
                <th>PERÍODO</th>
                <th class="ta-r">FED. INC. TAX</th>
                <th class="ta-r">SS EMP.</th>
                <th class="ta-r">SS ER</th>
                <th class="ta-r">MEDICARE EMP.</th>
                <th class="ta-r">MEDICARE ER</th>
                <th class="ta-r">FUTA</th>
                <th class="ta-r">SUTA</th>
                <th class="ta-r">W.COMP</th>
                <th class="ta-r text-error">TOTAL IMP.</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in datos" :key="r.semana_inicio">
                <td>
                  <div class="periodo-label">{{ fmtFecha(r.semana_inicio) }}</div>
                  <div class="periodo-sub">al {{ fmtFecha(r.semana_fin) }}</div>
                </td>
                <td class="ta-r font-mono">{{ fmt(r.federal_income_tax) }}</td>
                <td class="ta-r font-mono">{{ fmt(r.ss_emp) }}</td>
                <td class="ta-r font-mono">{{ fmt(r.ss_er) }}</td>
                <td class="ta-r font-mono">{{ fmt(r.medicare_emp) }}</td>
                <td class="ta-r font-mono">{{ fmt(r.medicare_er) }}</td>
                <td class="ta-r font-mono">{{ fmt(r.futa) }}</td>
                <td class="ta-r font-mono">{{ fmt(r.suta) }}</td>
                <td class="ta-r font-mono">{{ fmt(r.workers_comp) }}</td>
                <td class="ta-r font-mono text-error font-weight-bold">{{ fmt(r.total_impuestos) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="rn-tfoot">
                <td><strong>TOTAL</strong></td>
                <td class="ta-r font-mono">{{ fmt(kpis.federal_income_tax) }}</td>
                <td class="ta-r font-mono">{{ fmt(kpis.social_security_emp) }}</td>
                <td class="ta-r font-mono">{{ fmt(kpis.social_security_er) }}</td>
                <td class="ta-r font-mono">{{ fmt(kpis.medicare_emp) }}</td>
                <td class="ta-r font-mono">{{ fmt(kpis.medicare_er) }}</td>
                <td class="ta-r font-mono">{{ fmt(kpis.futa) }}</td>
                <td class="ta-r font-mono">{{ fmt(kpis.suta) }}</td>
                <td class="ta-r font-mono">{{ fmt(kpis.workers_comp) }}</td>
                <td class="ta-r font-mono text-error font-weight-bold">
                  {{ fmt(+kpis.federal_income_tax + +kpis.social_security_emp + +kpis.social_security_er + +kpis.medicare_emp + +kpis.medicare_er + +kpis.futa + +kpis.suta + +kpis.workers_comp) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import KpiCard from '../../components/common/KpiCard.vue'
import { API_BASE } from '../../utils/constants.js'
import { useAuthStore } from '../../stores/auth.js'
import { formatFecha } from '../../utils/formatters'

const authStore = useAuthStore()
const getEmpresa = () => authStore.empresaCodigo || authStore.empresa || localStorage.getItem('empresaActual')

const cargando = ref(false)
const generandoPDF = ref(false)
// Guarda el id de la nomina que se esta imprimiendo, para que gire solo el
// boton de esa fila y no los de todas.
const pdfFila = ref(null)

// ── Horas trabajadas: informe listo para imprimir en pestaña nueva ──
// Mismo camino que el PDF de la nómina: se arma el HTML y se abre en otra
// pestaña, donde el usuario hace Ctrl+P / Guardar como PDF.
const horasFila = ref(null)

async function exportarHoras(fila) {
  if (!fila) return
  horasFila.value = fila.id
  try {
    const desde = String(fila.semana_inicio).split('T')[0]
    const hasta = String(fila.semana_fin).split('T')[0]
    const base  = { empresa: getEmpresa(), fechaInicio: desde, fechaFin: hasta }

    const [rEmp, rCc] = await Promise.all([
      fetch(`${API_BASE}/nomina/reporte?${new URLSearchParams({ ...base, vista: 'horas' })}`).then(r => r.json()),
      fetch(`${API_BASE}/nomina/reporte?${new URLSearchParams({ ...base, vista: 'horas_ccosto' })}`).then(r => r.json()),
    ])
    const empleados = rEmp?.data || []
    const porCc     = rCc?.data  || []

    // ── Cuadro 1: por trabajador ──
    const tot = empleados.reduce((t, e) => ({
      reg:   t.reg   + (parseFloat(e.horas_regulares) || 0),
      ot:    t.ot    + (parseFloat(e.horas_overtime)  || 0),
      dias:  t.dias  + (parseFloat(e.dias_trabajados) || 0),
      bruto: t.bruto + (parseFloat(e.total_bruto)     || 0),
    }), { reg: 0, ot: 0, dias: 0, bruto: 0 })

    const filasEmp = empleados.map(e => `
      <tr>
        <td>${e.nombre}</td>
        <td class="c"><span class="badge ${e.tipo_empleado === 'W2' ? 'w2' : 'c1099'}">${e.tipo_empleado}</span></td>
        <td class="c"><span class="badge tipo">${e.tipo_salario}</span></td>
        <td>${fmt(e.salario_base)}</td>
        <td>${+e.horas_regulares ? fmtNum(e.horas_regulares) : '—'}</td>
        <td class="text-amber">${+e.horas_overtime ? fmtNum(e.horas_overtime) : '—'}</td>
        <td>${+e.dias_trabajados || '—'}</td>
        <td class="b">${fmt(e.total_bruto)}</td>
      </tr>`).join('')

    // ── Cuadro 2: matriz trabajador × centro de costo ──
    // En matriz y no en lista plana: así se ve de una quién se reparte entre
    // sedes y cuánto pone en cada una.
    const sumaCc = {}
    for (const r of porCc) {
      const cc = r.ccosto_nombre || r.ccosto
      sumaCc[cc] = (sumaCc[cc] || 0) + (parseFloat(r.horas) || 0)
    }
    const ccs = Object.keys(sumaCc).sort((a, b) => sumaCc[b] - sumaCc[a])

    const mapa = new Map()
    for (const r of porCc) {
      if (!mapa.has(r.empleado_id)) mapa.set(r.empleado_id, { nombre: r.nombre, horas: {}, total: 0 })
      const f = mapa.get(r.empleado_id)
      const cc = r.ccosto_nombre || r.ccosto
      const h  = parseFloat(r.horas) || 0
      f.horas[cc] = (f.horas[cc] || 0) + h
      f.total += h
    }
    const matriz = [...mapa.values()].sort((a, b) => b.total - a.total)
    const totalGeneral = matriz.reduce((s, f) => s + f.total, 0)

    const filasCc = matriz.map(f => `
      <tr>
        <td>${f.nombre}</td>
        ${ccs.map(cc => `<td class="${f.horas[cc] ? '' : 'cero'}">${f.horas[cc] ? fmtNum(f.horas[cc]) : '—'}</td>`).join('')}
        <td class="b">${fmtNum(f.total)}</td>
      </tr>`).join('')

    const css = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 24px; background: white; }
      h1 { font-size: 18px; font-weight: 900; color: #be185d; margin-bottom: 4px; }
      .sub { font-size: 11px; color: #888; margin-bottom: 22px; }
      .section { margin-bottom: 30px; }
      .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .8px; color: #be185d; border-bottom: 2px solid #ec4899; padding-bottom: 4px; margin-bottom: 10px; }
      table { width: 100%; border-collapse: collapse; font-size: 10px; }
      th { background: #fdf2f8; padding: 5px 9px; text-align: right; font-size: 9px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; color: #9ca3af; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
      th:first-child { text-align: left; }
      td { padding: 4px 9px; text-align: right; border-bottom: 1px solid #f3f4f6; }
      td:first-child { text-align: left; font-weight: 500; }
      td.c { text-align: center; }
      td.b { font-weight: 700; }
      td.cero { color: #d1d5db; }
      tr:nth-child(even) { background: #fafafa; }
      .tfoot td { background: #fdf2f8; font-weight: 700; font-size: 10.5px; border-top: 2px solid #f9a8d4; padding: 5px 9px; }
      .badge { font-size: 8.5px; font-weight: 700; padding: 1px 6px; border-radius: 3px; white-space: nowrap; }
      .w2    { background: #dcfce7; color: #15803d; }
      .c1099 { background: #ede9fe; color: #7c3aed; }
      .tipo  { background: #f3f4f6; color: #4b5563; }
      .text-amber { color: #b45309; }
      @media print { body { padding: 12px; } .section { page-break-inside: avoid; } }
    `

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>Horas Trabajadas ${fmtFecha(desde)} - ${fmtFecha(hasta)}</title>
      <style>${css}</style></head>
      <body>
        <h1>HORAS TRABAJADAS</h1>
        <div class="sub">Semana del ${fmtFecha(desde)} al ${fmtFecha(hasta)}</div>

        <div class="section">
          <div class="section-title">Por Trabajador</div>
          <table>
            <thead><tr>
              <th>TRABAJADOR</th><th style="text-align:center">TIPO</th>
              <th style="text-align:center">SALARIO BASE</th><th>VALOR</th>
              <th>H. REG.</th><th>H. EXTRA</th><th>DÍAS</th><th>BRUTO</th>
            </tr></thead>
            <tbody>${filasEmp || '<tr><td colspan="8">Sin datos</td></tr>'}</tbody>
            <tfoot><tr class="tfoot">
              <td colspan="4">TOTAL ${empleados.length} TRABAJADORES</td>
              <td>${fmtNum(tot.reg)}</td>
              <td class="text-amber">${fmtNum(tot.ot)}</td>
              <td>${tot.dias || '—'}</td>
              <td>${fmt(tot.bruto)}</td>
            </tr></tfoot>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Horas por Centro de Costo</div>
          <table>
            <thead><tr>
              <th>TRABAJADOR</th>${ccs.map(cc => `<th>${cc}</th>`).join('')}<th>TOTAL</th>
            </tr></thead>
            <tbody>${filasCc || `<tr><td colspan="${ccs.length + 2}">Sin datos</td></tr>`}</tbody>
            <tfoot><tr class="tfoot">
              <td>TOTAL</td>
              ${ccs.map(cc => `<td>${fmtNum(sumaCc[cc])}</td>`).join('')}
              <td>${fmtNum(totalGeneral)}</td>
            </tr></tfoot>
          </table>
        </div>
      </body></html>`

    const win = window.open('', '_blank')
    if (!win) { alert('Activa los pop-ups para generar el informe'); return }
    win.document.write(html)
    win.document.close()
    win.focus()
  } catch (e) {
    console.error('Error generando el informe de horas:', e)
    alert('No se pudo generar el informe. Revisa la consola para el detalle.')
  } finally {
    horasFila.value = null
  }
}

// Dias que abarca un rango ISO. Se cuenta en UTC a proposito: con fechas
// locales, un cambio de horario de verano dentro del rango deja un resultado
// con decimales y el redondeo suma o resta un dia.
function rangoDias(desde, hasta) {
  if (!desde || !hasta) return 0
  const [y1, m1, d1] = String(desde).split('T')[0].split('-').map(Number)
  const [y2, m2, d2] = String(hasta).split('T')[0].split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000) + 1
}
const kpis = ref(null)
const datos = ref([])
const vistaActiva = ref('periodo')
// Datos para PDF (todas las vistas cargadas a la vez)
const pdfDatos = ref({ periodo: [], empleado: [], ccosto: [], impuestos: [] })

// Período por defecto: año actual
const hoy = new Date()
const anoActual = hoy.getFullYear()
const filtros = ref({
  fechaInicio: `${anoActual}-01-01`,
  fechaFin: `${anoActual}-12-31`,
})

const tabs = [
  { val: 'periodo',   label: 'Por Período',         icon: 'mdi-calendar-range-outline' },
  { val: 'meses',     label: 'Por Mes',              icon: 'mdi-calendar-month-outline' },
  { val: 'empleado',  label: 'Por Empleado',         icon: 'mdi-account-group-outline' },
  { val: 'ccosto',    label: 'Por Centro de Costo',  icon: 'mdi-sitemap-outline' },
  { val: 'impuestos', label: 'Impuestos y Taxes',    icon: 'mdi-receipt-text-outline' },
]

// ─── Reparto por mes ──────────────────────────────────────────────
// El backend devuelve un renglón por (nómina, mes): una semana que cruza
// dos meses viene partida en dos. Aquí se agrupan por mes para mostrar el
// subtotal contable de cada uno junto al detalle de qué nómina lo compone.
const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function nombreMes(ym) {
  if (!ym) return '—'
  const [y, m] = String(ym).split('-')
  return `${MESES_ES[parseInt(m, 10) - 1] || m} ${y}`
}

const CAMPOS_MES = ['total_bruto', 'total_deducciones', 'total_aportes_er',
                    'total_neto', 'costo_empresa']

function agruparPorMes(rows) {
  const grupos = new Map()
  for (const r of rows) {
    if (!grupos.has(r.mes)) {
      grupos.set(r.mes, {
        mes: r.mes,
        nombre: nombreMes(r.mes),
        filas: [],
        totales: Object.fromEntries(CAMPOS_MES.map(c => [c, 0])),
        dias: 0,
        horas: 0,
      })
    }
    const g = grupos.get(r.mes)
    g.filas.push(r)
    for (const c of CAMPOS_MES) g.totales[c] += parseFloat(r[c] || 0)
    g.dias  += parseFloat(r.dias_en_mes || 0)
    g.horas += parseFloat(r.horas_en_mes || 0)
  }
  return [...grupos.values()]
}

const mesesAgrupados = computed(() => agruparPorMes(datos.value))

const totalCcostoBruto = computed(() => datos.value.reduce((s, r) => s + parseFloat(r.costo_bruto || 0), 0))
const totalCcostoTotal = computed(() => datos.value.reduce((s, r) => s + parseFloat(r.costo_total || 0), 0))

function pctCcosto(val) {
  const tot = totalCcostoTotal.value
  return tot > 0 ? (parseFloat(val) / tot * 100) : 0
}

async function cargar() {
  cargando.value = true
  try {
    const empresa = getEmpresa()
    const params = new URLSearchParams({
      empresa,
      fechaInicio: filtros.value.fechaInicio,
      fechaFin:    filtros.value.fechaFin,
      vista:       vistaActiva.value,
    })
    const r = await fetch(`${API_BASE}/nomina/reporte?${params}`)
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    kpis.value  = j.kpis
    datos.value = j.data || []
  } catch (e) {
    console.error(e)
  } finally {
    cargando.value = false
  }
}

async function cambiarVista(v) {
  vistaActiva.value = v
  await cargar()
}

function fmt(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtNum(v) {
  return (parseFloat(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtFecha(s) {
  if (!s) return '—'
  const [y,m,d] = String(s).split('T')[0].split('-')
  return `${m}/${d}/${y}`
}

// Consolidado de todo el periodo filtrado.
async function exportarPDF() {
  if (!kpis.value) return
  generandoPDF.value = true
  try {
    await generarPDF(filtros.value.fechaInicio, filtros.value.fechaFin)
  } finally {
    generandoPDF.value = false
  }
}

// Una sola nomina, la de la fila. Reusa el mismo generador acotando el rango
// a esa semana: el informe sale con la estructura y los totales que el
// usuario ya conoce, pero de una unica liquidacion.
async function exportarPDFNomina(fila) {
  if (!fila) return
  pdfFila.value = fila.id
  try {
    await generarPDF(
      String(fila.semana_inicio).split('T')[0],
      String(fila.semana_fin).split('T')[0],
    )
  } finally {
    pdfFila.value = null
  }
}

async function generarPDF(fechaInicio, fechaFin) {
  try {
    const empresa = getEmpresa()
    const base = { empresa, fechaInicio, fechaFin }
    // Una liquidacion cabe en una semana; el consolidado abarca varias.
    const esUnaNomina = rangoDias(fechaInicio, fechaFin) <= 7

    // Cargar todas las vistas en paralelo
    const [rPer, rMes, rEmp, rCc, rImp] = await Promise.all([
      fetch(`${API_BASE}/nomina/reporte?${new URLSearchParams({ ...base, vista: 'periodo' })}`).then(r => r.json()),
      fetch(`${API_BASE}/nomina/reporte?${new URLSearchParams({ ...base, vista: 'meses' })}`).then(r => r.json()),
      fetch(`${API_BASE}/nomina/reporte?${new URLSearchParams({ ...base, vista: 'empleado' })}`).then(r => r.json()),
      fetch(`${API_BASE}/nomina/reporte?${new URLSearchParams({ ...base, vista: 'ccosto' })}`).then(r => r.json()),
      fetch(`${API_BASE}/nomina/reporte?${new URLSearchParams({ ...base, vista: 'impuestos' })}`).then(r => r.json()),
    ])

    // Los KPIs se toman de la respuesta, no del estado de la pantalla: al
    // imprimir una sola fila el rango es otro y los de arriba no corresponden.
    const k = rPer.kpis || kpis.value
    const periodo   = rPer.data   || []
    const meses     = agruparPorMes(rMes.data || [])
    const empleados = rEmp.data   || []
    const ccostos   = rCc.data    || []
    const impuestos = rImp.data   || []

    const totCcBruto = ccostos.reduce((s, r) => s + parseFloat(r.costo_bruto || 0), 0)
    const totCcTotal = ccostos.reduce((s, r) => s + parseFloat(r.costo_total || 0), 0)
    const totImp     = impuestos.reduce((s, r) => s + parseFloat(r.total_impuestos || 0), 0)

    const css = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 24px; background: white; }
      h1 { font-size: 18px; font-weight: 900; color: #be185d; margin-bottom: 4px; }
      .sub { font-size: 11px; color: #888; margin-bottom: 20px; }
      .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 28px; }
      .kpi { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; border-left: 3px solid #ec4899; }
      .kpi-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: #9ca3af; margin-bottom: 3px; }
      .kpi-val { font-size: 15px; font-weight: 800; font-family: monospace; }
      .section { margin-bottom: 36px; }
      .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .8px; color: #be185d; border-bottom: 2px solid #ec4899; padding-bottom: 4px; margin-bottom: 10px; }
      table { width: 100%; border-collapse: collapse; font-size: 10px; }
      th { background: #fdf2f8; padding: 4px 10px; text-align: right; font-size: 9px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; color: #9ca3af; border-bottom: 1px solid #e5e7eb; }
      th:first-child { text-align: left; }
      td { padding: 4px 10px; text-align: right; border-bottom: 1px solid #f3f4f6; }
      td:first-child { text-align: left; font-weight: 500; }
      tr:nth-child(even) { background: #fafafa; }
      .tfoot td { background: #fdf2f8; font-weight: 700; font-size: 11px; border-top: 2px solid #f9a8d4; padding: 5px 10px; }
      .text-red  { color: #ef4444; }
      .text-green{ color: #22c55e; }
      .text-amber{ color: #f59e0b; }
      .text-purple{color: #8b5cf6; }
      .badge { font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 3px; }
      .w2    { background: #ede9fe; color: #7c3aed; }
      .c1099 { background: #fef3c7; color: #b45309; }
      .parcial { background: #fef3c7; color: #b45309; margin-left: 6px; }
      .nota { font-size: 9.5px; color: #6b7280; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 5px; padding: 5px 8px; margin-bottom: 8px; }
      tr.mes-head td { background: #f5f3ff; font-weight: 700; border-top: 1.5px solid #c4b5fd; }
      tr.mes-head td:first-child { color: #6d28d9; }
      .pct-bar { height: 5px; border-radius: 3px; background: linear-gradient(90deg,#ec4899,#8b5cf6); display: inline-block; min-width: 2px; }
      @media print { body { padding: 12px; } }
    `

    // ── Por Período ──
    const tPeriodo = `
      <div class="section">
        <div class="section-title">Por Período</div>
        <table>
          <thead><tr>
            <th>PERÍODO</th><th>EMPL.</th><th>BRUTO</th><th>DEDUCCIONES</th><th>APORTES ER</th><th>NETO</th><th>COSTO EMPRESA</th>
          </tr></thead>
          <tbody>
            ${periodo.map(r => `<tr>
              <td>${fmtFecha(r.semana_inicio)} — ${fmtFecha(r.semana_fin)}</td>
              <td>${r.empleados}</td>
              <td>${fmt(r.total_bruto)}</td>
              <td class="text-red">${fmt(r.total_deducciones)}</td>
              <td class="text-amber">${fmt(r.total_aportes_er)}</td>
              <td class="text-green">${fmt(r.total_neto)}</td>
              <td class="text-purple">${fmt(r.costo_empresa)}</td>
            </tr>`).join('')}
          </tbody>
          <tfoot><tr class="tfoot">
            <td>TOTAL</td><td>${k.total_empleados}</td>
            <td>${fmt(k.total_bruto)}</td>
            <td class="text-red">${fmt(k.total_deducciones)}</td>
            <td class="text-amber">${fmt(k.total_aportes_er)}</td>
            <td class="text-green">${fmt(k.total_neto)}</td>
            <td class="text-purple">${fmt(k.costo_total_empresa)}</td>
          </tr></tfoot>
        </table>
      </div>`

    // ── Por Mes (reparto contable de semanas que cruzan meses) ──
    const tMeses = `
      <div class="section">
        <div class="section-title">Reparto por Mes</div>
        <div class="nota">Las nóminas que cruzan dos meses se reparten según las horas trabajadas en cada mes; si no hay horario cargado, por días calendario.</div>
        <table>
          <thead><tr>
            <th>MES / NÓMINA</th><th>DÍAS</th><th>HORAS</th><th>% NÓM.</th><th>BRUTO</th><th>DEDUCCIONES</th><th>APORTES ER</th><th>NETO</th><th>COSTO EMPRESA</th>
          </tr></thead>
          <tbody>
            ${meses.map(g => `
              <tr class="mes-head">
                <td>${g.nombre} <span style="font-weight:400;color:#9ca3af">(${g.filas.length} nómina${g.filas.length !== 1 ? 's' : ''})</span></td>
                <td>${g.dias}</td>
                <td>${fmtNum(g.horas)}</td>
                <td>—</td>
                <td>${fmt(g.totales.total_bruto)}</td>
                <td class="text-red">${fmt(g.totales.total_deducciones)}</td>
                <td class="text-amber">${fmt(g.totales.total_aportes_er)}</td>
                <td class="text-green">${fmt(g.totales.total_neto)}</td>
                <td class="text-purple">${fmt(g.totales.costo_empresa)}</td>
              </tr>
              ${g.filas.map(r => `<tr>
                <td style="padding-left:24px">
                  ${fmtFecha(r.semana_inicio)} — ${fmtFecha(r.semana_fin)}
                  ${r.periodo_partido ? '<span class="badge parcial">PARCIAL</span>' : ''}
                </td>
                <td>${r.dias_en_mes}</td>
                <td>${fmtNum(r.horas_en_mes)}</td>
                <td>${fmtNum(r.porcentaje)}%</td>
                <td>${fmt(r.total_bruto)}</td>
                <td class="text-red">${fmt(r.total_deducciones)}</td>
                <td class="text-amber">${fmt(r.total_aportes_er)}</td>
                <td class="text-green">${fmt(r.total_neto)}</td>
                <td class="text-purple">${fmt(r.costo_empresa)}</td>
              </tr>`).join('')}
            `).join('')}
          </tbody>
          <tfoot><tr class="tfoot">
            <td colspan="4">TOTAL</td>
            <td>${fmt(k.total_bruto)}</td>
            <td class="text-red">${fmt(k.total_deducciones)}</td>
            <td class="text-amber">${fmt(k.total_aportes_er)}</td>
            <td class="text-green">${fmt(k.total_neto)}</td>
            <td class="text-purple">${fmt(k.costo_total_empresa)}</td>
          </tr></tfoot>
        </table>
      </div>`

    // ── Por Empleado ──
    const tEmpleado = `
      <div class="section">
        <div class="section-title">Por Empleado</div>
        <table>
          <thead><tr>
            <th>EMPLEADO</th><th>TIPO</th><th>NÓM.</th><th>HRS REG</th><th>HRS OT</th><th>BRUTO</th><th>DEDUCCIONES</th><th>APORTES ER</th><th>NETO</th><th>COSTO EMP.</th>
          </tr></thead>
          <tbody>
            ${empleados.map(r => `<tr>
              <td>${r.nombre || '—'}</td>
              <td><span class="badge ${r.tipo_empleado === 'W2' ? 'w2' : 'c1099'}">${r.tipo_empleado || '—'}</span></td>
              <td>${r.total_nominas}</td>
              <td>${fmtNum(r.horas_regulares)}</td>
              <td>${fmtNum(r.horas_overtime)}</td>
              <td>${fmt(r.total_bruto)}</td>
              <td class="text-red">${fmt(r.total_deducciones)}</td>
              <td class="text-amber">${fmt(r.total_aportes_er)}</td>
              <td class="text-green">${fmt(r.total_neto)}</td>
              <td class="text-purple">${fmt(r.costo_empresa)}</td>
            </tr>`).join('')}
          </tbody>
          <tfoot><tr class="tfoot">
            <td colspan="5">TOTAL</td>
            <td>${fmt(k.total_bruto)}</td>
            <td class="text-red">${fmt(k.total_deducciones)}</td>
            <td class="text-amber">${fmt(k.total_aportes_er)}</td>
            <td class="text-green">${fmt(k.total_neto)}</td>
            <td class="text-purple">${fmt(k.costo_total_empresa)}</td>
          </tr></tfoot>
        </table>
      </div>`

    // ── Por Centro de Costo ──
    const tCcosto = `
      <div class="section">
        <div class="section-title">Por Centro de Costo</div>
        <table>
          <thead><tr>
            <th>CENTRO DE COSTO</th><th>CÓD.</th><th>EMPL.</th><th>HORAS</th><th>COSTO BRUTO</th><th>COSTO TOTAL</th><th>% DEL TOTAL</th>
          </tr></thead>
          <tbody>
            ${ccostos.map(r => {
              const pct = totCcTotal > 0 ? (parseFloat(r.costo_total) / totCcTotal * 100).toFixed(1) : '0.0'
              const barW = Math.max(2, Math.round(parseFloat(pct)))
              return `<tr>
                <td>${r.ccosto_nombre}</td>
                <td>${r.ccosto}</td>
                <td>${r.empleados}</td>
                <td>${fmtNum(r.horas)}</td>
                <td>${fmt(r.costo_bruto)}</td>
                <td class="text-purple">${fmt(r.costo_total)}</td>
                <td><span class="pct-bar" style="width:${barW}px"></span> ${pct}%</td>
              </tr>`
            }).join('')}
          </tbody>
          <tfoot><tr class="tfoot">
            <td colspan="4">TOTAL</td>
            <td>${fmt(totCcBruto)}</td>
            <td class="text-purple">${fmt(totCcTotal)}</td>
            <td>100%</td>
          </tr></tfoot>
        </table>
      </div>`

    // ── Impuestos ──
    const tImpuestos = `
      <div class="section">
        <div class="section-title">Impuestos y Taxes</div>
        <table>
          <thead><tr>
            <th>PERÍODO</th><th>FED.INC.TAX</th><th>SS EMP.</th><th>SS ER</th><th>MED.EMP.</th><th>MED.ER</th><th>FUTA</th><th>SUTA</th><th>W.COMP</th><th class="text-red">TOTAL IMP.</th>
          </tr></thead>
          <tbody>
            ${impuestos.map(r => `<tr>
              <td>${fmtFecha(r.semana_inicio)} — ${fmtFecha(r.semana_fin)}</td>
              <td>${fmt(r.federal_income_tax)}</td>
              <td>${fmt(r.ss_emp)}</td>
              <td>${fmt(r.ss_er)}</td>
              <td>${fmt(r.medicare_emp)}</td>
              <td>${fmt(r.medicare_er)}</td>
              <td>${fmt(r.futa)}</td>
              <td>${fmt(r.suta)}</td>
              <td>${fmt(r.workers_comp)}</td>
              <td class="text-red" style="font-weight:700">${fmt(r.total_impuestos)}</td>
            </tr>`).join('')}
          </tbody>
          <tfoot><tr class="tfoot">
            <td>TOTAL</td>
            <td>${fmt(k.federal_income_tax)}</td>
            <td>${fmt(k.social_security_emp)}</td>
            <td>${fmt(k.social_security_er)}</td>
            <td>${fmt(k.medicare_emp)}</td>
            <td>${fmt(k.medicare_er)}</td>
            <td>${fmt(k.futa)}</td>
            <td>${fmt(k.suta)}</td>
            <td>${fmt(k.workers_comp)}</td>
            <td class="text-red">${fmt(+k.federal_income_tax + +k.social_security_emp + +k.social_security_er + +k.medicare_emp + +k.medicare_er + +k.futa + +k.suta + +k.workers_comp)}</td>
          </tr></tfoot>
        </table>
      </div>`

    const kpiHTML = `
      <div class="kpi-row">
        <div class="kpi"><div class="kpi-lbl">BRUTO PAGADO</div><div class="kpi-val">${fmt(k.total_bruto)}</div></div>
        <div class="kpi"><div class="kpi-lbl">DEDUCCIONES EMP.</div><div class="kpi-val text-red">${fmt(k.total_deducciones)}</div></div>
        <div class="kpi"><div class="kpi-lbl">NETO PAGADO</div><div class="kpi-val text-green">${fmt(k.total_neto)}</div></div>
        <div class="kpi"><div class="kpi-lbl">APORTES EMPLEADOR</div><div class="kpi-val text-amber">${fmt(k.total_aportes_er)}</div></div>
        <div class="kpi"><div class="kpi-lbl">COSTO TOTAL EMPRESA</div><div class="kpi-val text-purple">${fmt(k.costo_total_empresa)}</div></div>
        <div class="kpi"><div class="kpi-lbl">NÓMINAS / EMPLEADOS</div><div class="kpi-val">${k.total_nominas} / ${k.total_empleados}</div></div>
      </div>`

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>Reporte de Nómina</title>
      <style>${css}</style></head>
      <body>
        <h1>${esUnaNomina ? 'NÓMINA' : 'REPORTE DE NÓMINA'}</h1>
        <div class="sub">${esUnaNomina
          ? `Semana del ${fmtFecha(fechaInicio)} al ${fmtFecha(fechaFin)}`
          : `Período: ${fmtFecha(fechaInicio)} — ${fmtFecha(fechaFin)}`}</div>
        ${kpiHTML}
        ${tPeriodo}
        ${tMeses}
        ${tEmpleado}
        ${tCcosto}
        ${tImpuestos}
      </body></html>`

    const win = window.open('', '_blank')
    if (!win) { alert('Activa los pop-ups para generar el PDF'); return }
    win.document.write(html)
    win.document.close()
    win.focus()
  } catch (e) {
    console.error('Error generando el PDF de nómina:', e)
    alert('No se pudo generar el PDF. Revisa la consola para el detalle.')
  }
}

onMounted(cargar)
</script>

<style scoped>
/* Columna del botón de PDF por fila */
.ta-c { text-align: center; }

/* El informe de horas se imprime en una pestaña nueva con sus propios
   estilos embebidos (ver exportarHoras), así que acá no lleva CSS. */

.rn-container { padding: 24px; max-width: 1400px; margin: 0 auto; }

.rn-filters-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 14px; padding: 16px 20px; margin-bottom: 20px; }
.rn-filters-row { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
.filter-group { display: flex; flex-direction: column; gap: 4px; }
.filter-label { font-size: 10px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.4); }

/* KPIs */
.kpi-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; margin-bottom: 24px; }

/* Tabs */
.rn-tabs-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 14px; overflow: hidden; }
.rn-tabs-header { display: flex; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); overflow-x: auto; }
.rn-tab { display: flex; align-items: center; padding: 12px 18px; font-size: 12px; font-weight: 600; color: rgba(var(--v-theme-on-surface),.5); background: none; border: none; cursor: pointer; white-space: nowrap; border-bottom: 2px solid transparent; transition: all .15s; }
.rn-tab:hover { color: var(--indigo); background: color-mix(in srgb, var(--indigo) 4%, transparent); }
.rn-tab--active { color: var(--indigo); border-bottom-color: var(--indigo); background: color-mix(in srgb, var(--indigo) 5%, transparent); }

.rn-empty { padding: 48px 24px; text-align: center; color: rgba(var(--v-theme-on-surface),.4); font-size: 13px; display: flex; flex-direction: column; align-items: center; }

/* Tabla */
.rn-table-wrap { overflow-x: auto; }
.rn-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.rn-table th { padding: 10px 14px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.45); background: rgba(var(--v-theme-on-surface),.03); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); white-space: nowrap; }
.rn-table th.ta-r { text-align: right; }
.rn-table th.ta-c { text-align: center; }
.rn-table td { padding: 10px 14px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); }
.rn-table tbody tr:hover { background: rgba(var(--v-theme-on-surface),.03); }
.rn-tfoot td { padding: 10px 14px; background: rgba(var(--v-theme-on-surface),.04); border-top: 2px solid rgba(var(--v-theme-on-surface),.12); font-size: 13px; }
.ta-r { text-align: right; }
.ta-c { text-align: center; }
.font-mono { font-family: 'Courier New', monospace; }
.font-weight-medium { font-weight: 500; }
.font-weight-bold { font-weight: 700; }
.text-error { color: var(--error); }
.text-success { color: var(--success); }
.text-warning { color: var(--warning); }
.text-purple { color: var(--indigo); }

.periodo-label { font-weight: 600; font-size: 12px; }
.periodo-sub { font-size: 11px; color: rgba(var(--v-theme-on-surface),.45); }

/* Vista por mes */
.rn-nota {
  display: flex; align-items: flex-start; gap: 8px;
  margin: 14px 14px 4px; padding: 9px 12px;
  border-radius: 9px; font-size: 11.5px; line-height: 1.45;
  background: color-mix(in srgb, var(--indigo) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--indigo) 18%, transparent);
  color: rgba(var(--v-theme-on-surface),.7);
}
.rn-mes-head td {
  background: color-mix(in srgb, var(--indigo) 7%, transparent);
  border-top: 2px solid color-mix(in srgb, var(--indigo) 25%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--indigo) 15%, transparent);
  font-size: 13px; font-weight: 700;
}
.rn-mes-head .mes-sub {
  margin-left: 8px; font-size: 11px; font-weight: 500;
  color: rgba(var(--v-theme-on-surface),.5);
}
.rn-mes-detalle td { padding-top: 8px; padding-bottom: 8px; }
.rn-mes-detalle td:first-child { padding-left: 30px; }
.badge-partido {
  display: inline-flex; align-items: center; gap: 2px;
  margin-left: 8px; padding: 1px 6px 1px 4px; border-radius: 5px;
  font-size: 9px; font-weight: 800; letter-spacing: .4px;
  background: color-mix(in srgb, var(--gold) 18%, transparent);
  color: var(--gold);
  cursor: default;
}

.badge-w2 { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: color-mix(in srgb, var(--indigo) 12%, transparent); color: var(--indigo); }
.badge-1099 { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: color-mix(in srgb, var(--gold) 12%, transparent); color: var(--gold); }

.pct-bar-wrap { display: flex; align-items: center; gap: 6px; }
.pct-bar { height: 6px; border-radius: 3px; background: linear-gradient(90deg, var(--indigo), var(--gold)); min-width: 2px; }
.pct-label { font-size: 11px; color: rgba(var(--v-theme-on-surface),.6); white-space: nowrap; }
</style>
