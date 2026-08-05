<template>
  <MainLayout>
    <div class="ca-wrap">

      <PageHeader
        title="Control de Asistencia"
        description="Marcajes por NFC, excepciones y correcciones auditadas"
        :crumbs="['Nómina', 'Configuración', 'Control de Asistencia']"
      >
        <template #actions>
          <v-btn size="small" variant="outlined" prepend-icon="mdi-plus" @click="abrirManual">
            MARCAJE MANUAL
          </v-btn>
          <v-btn size="small" color="secondary" variant="flat" prepend-icon="mdi-sync" :loading="consolidando" @click="consolidar">
            CONSOLIDAR DÍA
          </v-btn>
        </template>
      </PageHeader>

      <!-- PESTAÑAS -->
      <div class="ca-tabs">
        <button v-for="t in tabs" :key="t.value" class="ca-tab"
                :class="{ active: tab === t.value }" @click="tab = t.value">
          <v-icon size="14">{{ t.icon }}</v-icon>
          {{ t.label }}
          <span v-if="t.value === 'excepciones' && excepciones.length" class="ca-tab-badge">{{ excepciones.length }}</span>
        </button>
      </div>

      <!-- ── DÍA ── -->
      <div v-show="tab === 'dia'" class="ca-card">
        <div class="ca-card-head">
          <input v-model="fecha" type="date" class="ca-input-fecha" @change="cargarDia" />
          <span class="ca-card-sub">{{ marcajes.length }} marcajes</span>
        </div>
        <div v-if="cargandoDia" class="ca-loading">
          <v-progress-circular indeterminate color="secondary" size="24" /><span>CARGANDO...</span>
        </div>
        <table v-else class="ca-table">
          <thead>
            <tr><th>HORA</th><th>EMPLEADO</th><th>TIPO</th><th>C. COSTO</th><th>ORIGEN</th><th>ESTADO</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-if="!marcajes.length"><td colspan="7" class="ca-empty">SIN MARCAJES ESTE DÍA</td></tr>
            <tr v-for="m in marcajes" :key="m.id" :class="{ 'fila-anulada': m.estado === 'ANULADO' }">
              <td class="ca-hora">{{ soloHora(m.momento) }}</td>
              <td class="ca-nombre">{{ m.apellido }}, {{ m.nombre }}</td>
              <td>
                <span class="ca-chip" :class="m.tipo === 'ENTRADA' ? 'chip-entrada' : 'chip-salida'">{{ m.tipo }}</span>
              </td>
              <td class="ca-cc">{{ m.ccosto_nombre }}</td>
              <td class="ca-origen">{{ m.origen }}</td>
              <td>
                <span class="ca-chip" :class="claseEstado(m.estado)">{{ m.estado }}</span>
                <div v-if="m.anomalias" class="ca-anomalias">{{ m.anomalias }}</div>
              </td>
              <td @click.stop>
                <v-btn v-if="m.estado !== 'ANULADO'" icon="mdi-close-circle-outline" size="x-small"
                       variant="text" color="error" title="Anular" @click="abrirAnular(m)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── EXCEPCIONES ── -->
      <div v-show="tab === 'excepciones'" class="ca-card">
        <div class="ca-card-head">
          <span class="ca-card-sub">Marcajes sospechosos sin resolver (últimos 14 días)</span>
        </div>
        <table class="ca-table">
          <thead>
            <tr><th>FECHA</th><th>EMPLEADO</th><th>TIPO</th><th>C. COSTO</th><th>MOTIVO</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-if="!excepciones.length"><td colspan="6" class="ca-empty">NADA PENDIENTE — TODO EN ORDEN</td></tr>
            <tr v-for="m in excepciones" :key="m.id">
              <td class="ca-hora">{{ fechaHora(m.momento) }}</td>
              <td class="ca-nombre">{{ m.apellido }}, {{ m.nombre }}</td>
              <td><span class="ca-chip" :class="m.tipo === 'ENTRADA' ? 'chip-entrada' : 'chip-salida'">{{ m.tipo }}</span></td>
              <td class="ca-cc">{{ m.ccosto_nombre }}</td>
              <td>
                <div class="ca-anomalias">{{ m.anomalias }}</div>
                <div v-if="!m.pin_verificado" class="ca-nota-pin">No confirmó con PIN</div>
              </td>
              <td class="ca-acciones" @click.stop>
                <v-btn size="x-small" variant="text" color="success" @click="aprobar(m)">APROBAR</v-btn>
                <v-btn size="x-small" variant="text" color="error" @click="abrirAnular(m)">ANULAR</v-btn>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── RÁFAGAS ── -->
      <div v-show="tab === 'rafagas'" class="ca-card">
        <div class="ca-card-head">
          <span class="ca-card-sub">
            Parejas que marcaron en el mismo tag con segundos de diferencia, de forma repetida.
            Una coincidencia suelta es normal; la reincidencia sugiere que alguien carga dos celulares.
          </span>
        </div>
        <table class="ca-table">
          <thead>
            <tr><th>EMPLEADO A</th><th>EMPLEADO B</th><th>COINCIDENCIAS</th><th>ÚLTIMA</th></tr>
          </thead>
          <tbody>
            <tr v-if="!rafagas.length"><td colspan="4" class="ca-empty">SIN PATRONES SOSPECHOSOS</td></tr>
            <tr v-for="(r, i) in rafagas" :key="i">
              <td class="ca-nombre">{{ r.empleado_a_nombre }}</td>
              <td class="ca-nombre">{{ r.empleado_b_nombre }}</td>
              <td><span class="ca-chip chip-alerta">{{ r.coincidencias }}</span></td>
              <td class="ca-hora">{{ fechaHora(r.ultima) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <!-- DIALOG ANULAR -->
    <v-dialog v-model="dlgAnular" max-width="440">
      <v-card class="ca-dialog">
        <div class="ca-dialog-title">ANULAR MARCAJE</div>
        <div class="ca-dialog-body">
          <p class="ca-dialog-msg">
            El marcaje no se borra: queda anulado y con registro de quién lo hizo. Si escribes una hora
            corregida, se crea un marcaje nuevo que apunta al original.
          </p>
          <div class="ca-field">
            <label>MOTIVO</label>
            <input v-model="anularMotivo" class="ca-input" placeholder="Ej: marcó en el punto equivocado" />
          </div>
          <div class="ca-field">
            <label>HORA CORREGIDA (opcional)</label>
            <input v-model="anularMomento" type="datetime-local" class="ca-input" />
          </div>
          <div v-if="dlgErr" class="ca-error">{{ dlgErr }}</div>
        </div>
        <div class="ca-dialog-footer">
          <v-btn variant="text" @click="dlgAnular = false">CANCELAR</v-btn>
          <v-btn color="error" variant="flat" :loading="guardando" @click="confirmarAnular">ANULAR</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- DIALOG MARCAJE MANUAL -->
    <v-dialog v-model="dlgManual" max-width="440">
      <v-card class="ca-dialog">
        <div class="ca-dialog-title">MARCAJE MANUAL</div>
        <div class="ca-dialog-body">
          <p class="ca-dialog-msg">
            Respaldo para cuando el celular del empleado falló. Queda marcado como MANUAL en la bitácora.
          </p>
          <div class="ca-field">
            <label>EMPLEADO *</label>
            <v-select v-model="manual.empleado_id" :items="empleados" item-title="label" item-value="id"
                      density="compact" variant="outlined" />
          </div>
          <div class="ca-field">
            <label>TIPO *</label>
            <v-select v-model="manual.tipo" :items="[{title:'ENTRADA',value:'ENTRADA'},{title:'SALIDA',value:'SALIDA'}]"
                      density="compact" variant="outlined" />
          </div>
          <div class="ca-field">
            <label>CENTRO DE COSTO *</label>
            <v-select v-model="manual.ccosto" :items="ccostos" item-title="nombre" item-value="codigo"
                      density="compact" variant="outlined" />
          </div>
          <div class="ca-field">
            <label>FECHA Y HORA *</label>
            <input v-model="manual.momento" type="datetime-local" class="ca-input" />
          </div>
          <div class="ca-field">
            <label>MOTIVO</label>
            <input v-model="manual.motivo" class="ca-input" placeholder="Ej: se quedó sin batería" />
          </div>
          <div v-if="dlgErr" class="ca-error">{{ dlgErr }}</div>
        </div>
        <div class="ca-dialog-footer">
          <v-btn variant="text" @click="dlgManual = false">CANCELAR</v-btn>
          <v-btn color="secondary" variant="flat" :loading="guardando" @click="guardarManual">REGISTRAR</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack" :color="snackColor" timeout="3000">{{ snackMsg }}</v-snackbar>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const empresa = computed(() => authStore.empresa || authStore.user?.empresa || localStorage.getItem('empresaActual') || '')
const usuario = computed(() => authStore.user?.nombre || authStore.user?.usuario || 'supervisor')

const tabs = [
  { value: 'dia',         label: 'DÍA',         icon: 'mdi-calendar-today' },
  { value: 'excepciones', label: 'EXCEPCIONES', icon: 'mdi-alert-outline' },
  { value: 'rafagas',     label: 'RÁFAGAS',     icon: 'mdi-account-multiple-outline' },
]
const tab = ref('dia')

const fecha = ref(new Date().toISOString().slice(0, 10))
const marcajes = ref([])
const excepciones = ref([])
const rafagas = ref([])
const empleados = ref([])
const ccostos = ref([])
const cargandoDia = ref(false)
const consolidando = ref(false)
const guardando = ref(false)

const snack = ref(false)
const snackMsg = ref('')
const snackColor = ref('success')

const dlgAnular = ref(false)
const dlgManual = ref(false)
const dlgErr = ref('')
const marcajeSel = ref(null)
const anularMotivo = ref('')
const anularMomento = ref('')
const manual = ref({ empleado_id: '', tipo: 'ENTRADA', ccosto: '', momento: '', motivo: '' })

function aviso(msg, color = 'success') {
  snackMsg.value = msg; snackColor.value = color; snack.value = true
}

function soloHora(m) {
  return new Date(m).toLocaleTimeString('es-US', { hour: '2-digit', minute: '2-digit' })
}
function fechaHora(m) {
  return new Date(m).toLocaleString('es-US', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
function claseEstado(e) {
  if (e === 'VALIDO') return 'chip-valido'
  if (e === 'SOSPECHOSO') return 'chip-alerta'
  return 'chip-anulado'
}

async function cargarDia() {
  cargandoDia.value = true
  try {
    const r = await api.get('/asistencia/dia', { params: { empresa: empresa.value, fecha: fecha.value } })
    marcajes.value = r.data?.data || []
  } catch (e) { console.error(e) }
  finally { cargandoDia.value = false }
}

async function cargarExcepciones() {
  try {
    const r = await api.get('/asistencia/excepciones', { params: { empresa: empresa.value } })
    excepciones.value = r.data?.data || []
  } catch (e) { console.error(e) }
}

async function cargarRafagas() {
  try {
    const r = await api.get('/asistencia/rafagas', { params: { empresa: empresa.value } })
    rafagas.value = r.data?.data || []
  } catch (e) { console.error(e) }
}

async function cargarCatalogos() {
  try {
    const [empR, ccR] = await Promise.all([
      api.get('/nomina/empleados', { params: { empresa: empresa.value, estado: 'ACTIVO' } }),
      api.get('/ccostos', { params: { empresa: empresa.value } }),
    ])
    empleados.value = (empR.data?.data || []).map(e => ({ id: e.id, label: `${e.apellido}, ${e.nombre}` }))
    ccostos.value = ccR.data?.data || ccR.data || []
  } catch (e) { console.error(e) }
}

async function consolidar() {
  consolidando.value = true
  try {
    const r = await api.post('/asistencia/consolidar', { empresa: empresa.value, fecha: fecha.value })
    const hechos = (r.data?.data || []).filter(x => x.consolidado).length
    aviso(`${hechos} turno(s) volcados al cuadro semanal`)
  } catch (e) {
    aviso(e?.response?.data?.error || 'No se pudo consolidar', 'error')
  } finally { consolidando.value = false }
}

async function aprobar(m) {
  try {
    await api.post(`/asistencia/marcaje/${m.id}/aprobar`, { usuario: usuario.value })
    aviso('Marcaje aprobado')
    cargarExcepciones(); cargarDia()
  } catch (e) {
    aviso(e?.response?.data?.error || 'No se pudo aprobar', 'error')
  }
}

function abrirAnular(m) {
  marcajeSel.value = m
  anularMotivo.value = ''
  anularMomento.value = ''
  dlgErr.value = ''
  dlgAnular.value = true
}

async function confirmarAnular() {
  guardando.value = true
  dlgErr.value = ''
  try {
    await api.post(`/asistencia/marcaje/${marcajeSel.value.id}/anular`, {
      usuario: usuario.value,
      motivo: anularMotivo.value,
      momento_corregido: anularMomento.value || null,
    })
    aviso('Marcaje anulado')
    dlgAnular.value = false
    cargarDia(); cargarExcepciones()
  } catch (e) {
    dlgErr.value = e?.response?.data?.error || 'No se pudo anular'
  } finally { guardando.value = false }
}

function abrirManual() {
  manual.value = {
    empleado_id: '', tipo: 'ENTRADA', ccosto: '',
    momento: new Date().toISOString().slice(0, 16), motivo: '',
  }
  dlgErr.value = ''
  dlgManual.value = true
}

async function guardarManual() {
  dlgErr.value = ''
  const m = manual.value
  if (!m.empleado_id || !m.tipo || !m.ccosto || !m.momento) {
    dlgErr.value = 'Empleado, tipo, centro de costo y fecha son requeridos'
    return
  }
  guardando.value = true
  try {
    await api.post('/asistencia/marcaje-manual', { ...m, empresa: empresa.value, usuario: usuario.value })
    aviso('Marcaje manual registrado')
    dlgManual.value = false
    cargarDia()
  } catch (e) {
    dlgErr.value = e?.response?.data?.error || 'No se pudo registrar'
  } finally { guardando.value = false }
}

onMounted(() => {
  cargarDia(); cargarExcepciones(); cargarRafagas(); cargarCatalogos()
})
</script>

<style scoped>
.ca-wrap { display: flex; flex-direction: column; gap: 16px; }

.ca-tabs { display: flex; gap: 6px; }
.ca-tab {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 9px; border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: transparent; color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 11px; font-weight: 800; letter-spacing: 0.5px; cursor: pointer;
  transition: all 0.15s;
}
.ca-tab:hover { background: rgba(var(--v-theme-on-surface), 0.05); }
.ca-tab.active {
  background: color-mix(in srgb, var(--indigo) 14%, transparent);
  border-color: color-mix(in srgb, var(--indigo) 35%, transparent);
  color: var(--indigo);
}
.ca-tab-badge {
  background: var(--error); color: #fff; font-size: 9px; font-weight: 800;
  padding: 1px 6px; border-radius: 9px;
}

.ca-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-radius: 14px; overflow: hidden;
}
.ca-card-head {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 16px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07);
}
.ca-card-sub { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5); line-height: 1.5; }
.ca-input-fecha {
  height: 34px; padding: 0 10px; border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.2);
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: rgb(var(--v-theme-on-surface)); font-size: 12px; outline: none;
}
.ca-loading { display: flex; align-items: center; gap: 10px; padding: 24px; font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); }

.ca-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.ca-table thead { background: rgba(var(--v-theme-on-surface), 0.04); }
.ca-table th {
  padding: 10px 14px; text-align: left;
  font-size: 10px; font-weight: 800; letter-spacing: 0.8px;
  color: rgba(var(--v-theme-on-surface), 0.4); text-transform: uppercase;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.ca-table td { padding: 11px 14px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); }
.ca-empty { padding: 32px; text-align: center; color: rgba(var(--v-theme-on-surface), 0.3); }
.fila-anulada td { opacity: 0.45; text-decoration: line-through; }

.ca-hora { font-variant-numeric: tabular-nums; color: rgba(var(--v-theme-on-surface), 0.7); white-space: nowrap; }
.ca-nombre { font-weight: 600; }
.ca-cc, .ca-origen { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.6); }
.ca-anomalias { font-size: 10px; color: var(--warning); margin-top: 3px; font-weight: 600; }
.ca-nota-pin { font-size: 10px; color: var(--error); margin-top: 2px; }
.ca-acciones { display: flex; gap: 2px; white-space: nowrap; }

.ca-chip { font-size: 9px; font-weight: 800; padding: 3px 8px; border-radius: 5px; letter-spacing: 0.4px; display: inline-block; }
.chip-entrada { background: color-mix(in srgb, var(--success) 15%, transparent); color: var(--success); }
.chip-salida  { background: color-mix(in srgb, var(--error) 13%, transparent); color: var(--error); }
.chip-valido  { background: color-mix(in srgb, var(--success) 13%, transparent); color: var(--success); }
.chip-alerta  { background: color-mix(in srgb, var(--warning) 18%, transparent); color: var(--warning); }
.chip-anulado { background: rgba(var(--v-theme-on-surface), 0.08); color: rgba(var(--v-theme-on-surface), 0.45); }

.ca-dialog { padding: 20px; }
.ca-dialog-title { font-size: 15px; font-weight: 800; margin-bottom: 12px; }
.ca-dialog-msg { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.55); line-height: 1.5; margin: 0 0 12px; }
.ca-dialog-body { display: flex; flex-direction: column; gap: 12px; }
.ca-field { display: flex; flex-direction: column; gap: 4px; }
.ca-field label { font-size: 10px; font-weight: 700; color: rgba(var(--v-theme-on-surface), 0.5); text-transform: uppercase; letter-spacing: 0.4px; }
.ca-input {
  height: 38px; padding: 0 12px; border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.2);
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: rgb(var(--v-theme-on-surface)); font-size: 13px; outline: none;
}
.ca-input:focus { border-color: var(--indigo); }
.ca-error { color: var(--error); font-size: 12px; font-weight: 600; }
.ca-dialog-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; }
</style>
