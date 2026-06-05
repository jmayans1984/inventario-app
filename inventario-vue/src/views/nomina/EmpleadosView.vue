<template>
  <MainLayout>
    <div class="nom-wrap">

      <!-- HEADER -->
      <div class="nom-header">
        <div class="nom-header-icon"><v-icon size="22" color="white">mdi-account-tie-outline</v-icon></div>
        <div class="flex-1">
          <h1 class="nom-title">GESTIÓN DE EMPLEADOS</h1>
          <p class="nom-sub">{{ empleados.length }} empleados · Florida, USA</p>
        </div>
        <div class="nom-header-actions">
          <v-btn-toggle v-model="filtroEstado" mandatory density="compact" color="#8b5cf6">
            <v-btn value="TODOS"    size="small">Todos</v-btn>
            <v-btn value="ACTIVO"   size="small">Activos</v-btn>
            <v-btn value="INACTIVO" size="small">Inactivos</v-btn>
          </v-btn-toggle>
          <v-btn color="#8b5cf6" variant="flat" size="small" prepend-icon="mdi-plus" @click="nuevo">
            Nuevo Empleado
          </v-btn>
        </div>
      </div>

      <!-- TABLA -->
      <div class="nom-card">
        <div v-if="cargando" class="nom-loading">
          <v-progress-circular indeterminate color="#8b5cf6" size="28" /><span>Cargando...</span>
        </div>
        <table v-else class="nom-table">
          <thead>
            <tr>
              <th>#</th><th>NOMBRE</th><th>TIPO</th><th>CARGO</th>
              <th>CC</th><th>VALOR/HR</th><th>ESTADO</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!filtrados.length">
              <td colspan="8" class="nom-empty">Sin empleados</td>
            </tr>
            <tr v-for="e in filtrados" :key="e.id" class="nom-row" @click="editar(e)">
              <td class="nom-id">{{ e.id }}</td>
              <td>
                <div class="nom-nombre">{{ e.apellido }}, {{ e.nombre }}</div>
                <div class="nom-email">{{ e.email }}</div>
              </td>
              <td>
                <span class="nom-badge" :class="e.tipo_empleado === 'W2' ? 'badge-w2' : 'badge-1099'">
                  {{ e.tipo_empleado }}
                </span>
              </td>
              <td class="nom-cargo">{{ e.cargo_nombre || '—' }}</td>
              <td class="nom-cc">{{ e.ccosto_nombre || e.ccosto || '—' }}</td>
              <td class="nom-rate">
                <span v-if="e.es_por_horas">${{ fmtNum(e.valor_hora) }}/hr</span>
                <span v-else>${{ fmtNum(e.monto_fijo_semanal) }}/sem</span>
              </td>
              <td>
                <span class="nom-estado" :class="e.estado === 'ACTIVO' ? 'estado-activo' : 'estado-inactivo'">
                  {{ e.estado }}
                </span>
              </td>
              <td @click.stop>
                <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" color="#8b5cf6" @click="editar(e)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <!-- DRAWER FORMULARIO -->
    <v-navigation-drawer v-model="drawer" location="right" width="600" temporary>
      <div class="drw-wrap">
        <div class="drw-header">
          <span class="drw-title">{{ editando?.id ? 'Editar Empleado' : 'Nuevo Empleado' }}</span>
          <v-btn icon="mdi-close" size="small" variant="text" @click="drawer=false" />
        </div>

        <div class="drw-body">
          <!-- Foto -->
          <div class="drw-foto-row">
            <div class="drw-foto-wrap">
              <img v-if="fotoPreview" :src="fotoPreview" class="drw-foto" />
              <div v-else class="drw-foto-empty">
                <v-icon size="32" color="rgba(255,255,255,0.2)">mdi-account-circle</v-icon>
              </div>
              <v-btn size="x-small" variant="flat" color="#8b5cf6" class="drw-foto-btn"
                     @click="$refs.fotoInput.click()">
                <v-icon size="13">mdi-camera</v-icon>
              </v-btn>
              <input ref="fotoInput" type="file" accept="image/*" hidden @change="onFoto" />
            </div>
            <div class="drw-foto-info">
              <div class="drw-foto-nombre" v-if="editando?.id">ID #{{ editando.id }}</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.4)">{{ editando?.estado || 'ACTIVO' }}</div>
            </div>
          </div>

          <!-- Secciones del formulario -->
          <div class="drw-section">
            <div class="drw-section-title">INFORMACIÓN PERSONAL</div>
            <div class="drw-grid-2">
              <div class="drw-field"><label>NOMBRE *</label><input v-model="form.nombre" class="drw-input" /></div>
              <div class="drw-field"><label>APELLIDO *</label><input v-model="form.apellido" class="drw-input" /></div>
              <div class="drw-field"><label>FECHA NACIMIENTO</label><input v-model="form.fecha_nacimiento" type="date" class="drw-input" /></div>
              <div class="drw-field"><label>EMAIL</label><input v-model="form.email" type="email" class="drw-input" /></div>
              <div class="drw-field"><label>TELÉFONO</label><input v-model="form.telefono" class="drw-input" /></div>
              <div class="drw-field"><label>SSN (SOCIAL SECURITY)</label><input v-model="form.ssn" class="drw-input" placeholder="XXX-XX-XXXX" /></div>
            </div>
          </div>

          <div class="drw-section">
            <div class="drw-section-title">DIRECCIÓN</div>
            <div class="drw-grid-2">
              <div class="drw-field drw-span-2"><label>DIRECCIÓN</label><input v-model="form.direccion" class="drw-input" /></div>
              <div class="drw-field"><label>ESTADO *</label>
                <select v-model="form.estado_residencia" @change="form.ciudad=''" class="drw-select">
                  <option value="">— SELECCIONAR ESTADO —</option>
                  <option v-for="st in usaStates" :key="st.code" :value="st.code">{{ st.name }}</option>
                </select>
              </div>
              <div class="drw-field"><label>CIUDAD *</label>
                <select v-model="form.ciudad" class="drw-select" :disabled="!form.estado_residencia">
                  <option value="">— SELECCIONAR CIUDAD —</option>
                  <option v-for="city in ciudadesDelEstado" :key="city" :value="city">{{ city }}</option>
                </select>
              </div>
              <div class="drw-field"><label>ZIP CODE</label><input v-model="form.zipcode" class="drw-input" /></div>
            </div>
          </div>

          <div class="drw-section">
            <div class="drw-section-title">INFORMACIÓN LABORAL</div>
            <div class="drw-grid-2">
              <div class="drw-field"><label>TIPO EMPLEADO *</label>
                <select v-model="form.tipo_empleado" class="drw-select">
                  <option value="W2">W2 — EMPLEADO</option>
                  <option value="1099">1099 — CONTRATISTA</option>
                </select>
              </div>
              <div class="drw-field"><label>TIPO CONTRATO</label>
                <select v-model="form.tipo_contrato" class="drw-select">
                  <option value="FULL_TIME">FULL TIME</option>
                  <option value="PART_TIME">PART TIME</option>
                  <option value="TEMPORAL">TEMPORAL</option>
                  <option value="SEASONAL">SEASONAL</option>
                </select>
              </div>
              <div class="drw-field" v-if="form.tipo_empleado === '1099'">
                <label>EMPRESA CONTRATISTA</label>
                <input v-model="form.empresa_contratista" class="drw-input" />
              </div>
              <div class="drw-field"><label>CARGO</label>
                <select v-model="form.cargo_id" class="drw-select">
                  <option value="">— SELECCIONAR —</option>
                  <option v-for="c in cargos" :key="c.id" :value="c.id">{{ c.nombre }}</option>
                </select>
              </div>
              <div class="drw-field"><label>CENTRO DE COSTO</label>
                <select v-model="form.ccosto" class="drw-select">
                  <option value="">— SELECCIONAR —</option>
                  <option v-for="c in ccostos" :key="c.codigo" :value="c.codigo">{{ c.nombre }}</option>
                </select>
              </div>
              <div class="drw-field"><label>FECHA INGRESO *</label>
                <input v-model="form.fecha_ingreso" type="date" class="drw-input" />
              </div>
              <div class="drw-field"><label>ESTADO</label>
                <select v-model="form.estado" class="drw-select">
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                  <option value="LICENCIA">LICENCIA</option>
                </select>
              </div>
              <div class="drw-field" v-if="form.estado === 'INACTIVO'">
                <label>FECHA RETIRO</label>
                <input v-model="form.fecha_retiro" type="date" class="drw-input" />
              </div>
              <div class="drw-field" v-if="form.estado === 'INACTIVO'" style="grid-column:span 2">
                <label>MOTIVO RETIRO</label>
                <input v-model="form.motivo_retiro" class="drw-input" />
              </div>
              <div class="drw-field"><label># PERMISO DE TRABAJO</label>
                <input v-model="form.permiso_trabajo" class="drw-input" />
              </div>
              <div class="drw-field"><label>FECHA VENCIMIENTO PERMISO</label>
                <input v-model="form.fecha_vencimiento_permiso" type="date" class="drw-input" />
              </div>
            </div>
          </div>

          <div class="drw-section">
            <div class="drw-section-title">COMPENSACIÓN</div>
            <div class="drw-grid-2">
              <div class="drw-field"><label>TIPO DE PAGO</label>
                <select v-model="form.es_por_horas" class="drw-select">
                  <option :value="true">POR HORA</option>
                  <option :value="false">MONTO FIJO SEMANAL</option>
                </select>
              </div>
              <div class="drw-field" v-if="form.es_por_horas">
                <label>VALOR POR HORA ($)</label>
                <input v-model="form.valor_hora" type="number" step="0.01" min="0" class="drw-input" />
              </div>
              <div class="drw-field" v-else>
                <label>MONTO FIJO SEMANAL ($)</label>
                <input v-model="form.monto_fijo_semanal" type="number" step="0.01" min="0" class="drw-input" />
              </div>
              <div class="drw-field"><label>FRECUENCIA DE PAGO</label>
                <select v-model="form.frecuencia_pago" class="drw-select">
                  <option value="WEEKLY">SEMANAL</option>
                  <option value="BIWEEKLY">QUINCENAL</option>
                </select>
              </div>
            </div>
          </div>

          <!-- W4 solo para W2 -->
          <div class="drw-section" v-if="form.tipo_empleado === 'W2'">
            <div class="drw-section-title">INFORMACIÓN W-4 (RETENCIÓN FEDERAL)</div>
            <div class="drw-w4-note">
              <v-icon size="14" color="#f59e0b">mdi-information-outline</v-icon>
              Florida no tiene impuesto estatal. Los datos solicitados son del formulario W-4 federal 2024.
            </div>
            <div class="drw-grid-2">
              <div class="drw-field"><label>FILING STATUS</label>
                <select v-model="form.w4_filing_status" class="drw-select">
                  <option value="SINGLE">SINGLE / MARRIED FILING SEP.</option>
                  <option value="MARRIED_JOINTLY">MARRIED FILING JOINTLY</option>
                  <option value="HEAD_OF_HOUSEHOLD">HEAD OF HOUSEHOLD</option>
                </select>
              </div>
              <div class="drw-field">
                <label>EXENTO DE RETENCIÓN</label>
                <div class="drw-check-row">
                  <input type="checkbox" v-model="form.w4_exempt" class="drw-check" />
                  <span style="font-size:12px;color:rgba(255,255,255,0.6)">Marcar si el empleado es EXEMPT</span>
                </div>
              </div>
              <div class="drw-field">
                <label>CRÉDITO POR DEPENDIENTES ($)</label>
                <input v-model="form.w4_claim_dependents" type="number" step="1" min="0" class="drw-input"
                       placeholder="Ej: 2000 por hijo" />
              </div>
              <div class="drw-field">
                <label>RETENCIÓN EXTRA POR PERÍODO ($)</label>
                <input v-model="form.w4_extra_withholding" type="number" step="0.01" min="0" class="drw-input" />
              </div>
            </div>
          </div>

          <div class="drw-section">
            <div class="drw-section-title">WORKERS' COMPENSATION</div>
            <div class="drw-grid-2">
              <div class="drw-field"><label>CÓDIGO CLASIFICACIÓN WC</label>
                <input v-model="form.wc_code" class="drw-input" placeholder="Ej: 9082 (RESTAURANT)" />
              </div>
              <div class="drw-field"><label>TASA WC (%)</label>
                <input v-model="form.wc_rate" type="number" step="0.0001" min="0" class="drw-input"
                       placeholder="Ej: 0.0525" />
              </div>
            </div>
          </div>

          <div class="drw-section">
            <div class="drw-section-title">NOTAS</div>
            <textarea v-model="form.notas" class="drw-textarea" rows="3" placeholder="Observaciones internas..."></textarea>
          </div>

          <div v-if="formErr" class="drw-error">{{ formErr }}</div>
        </div>

        <div class="drw-footer">
          <v-btn variant="text" color="#94a3b8" @click="drawer=false">Cancelar</v-btn>
          <v-btn color="#8b5cf6" variant="flat" :loading="guardando" @click="guardar">
            <v-icon size="15" class="mr-1">mdi-content-save-outline</v-icon>
            {{ editando?.id ? 'Actualizar' : 'Registrar' }}
          </v-btn>
        </div>
      </div>
    </v-navigation-drawer>

    <!-- Snackbar -->
    <v-snackbar v-model="snack" color="#10b981" timeout="3000" location="bottom right">
      <v-icon class="mr-2">mdi-check-circle</v-icon> {{ snackMsg }}
    </v-snackbar>

  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const empresa   = computed(() => authStore.empresa || authStore.user?.empresa || localStorage.getItem('empresaActual') || '')

// Base de datos de ciudades por estado USA
const usaStates = [
  { code: 'FL', name: 'FLORIDA' },
  { code: 'AL', name: 'ALABAMA' },
  { code: 'AK', name: 'ALASKA' },
  { code: 'AZ', name: 'ARIZONA' },
  { code: 'AR', name: 'ARKANSAS' },
  { code: 'CA', name: 'CALIFORNIA' },
  { code: 'CO', name: 'COLORADO' },
  { code: 'CT', name: 'CONNECTICUT' },
  { code: 'DE', name: 'DELAWARE' },
  { code: 'GA', name: 'GEORGIA' },
  { code: 'HI', name: 'HAWAII' },
  { code: 'ID', name: 'IDAHO' },
  { code: 'IL', name: 'ILLINOIS' },
  { code: 'IN', name: 'INDIANA' },
  { code: 'IA', name: 'IOWA' },
  { code: 'KS', name: 'KANSAS' },
  { code: 'KY', name: 'KENTUCKY' },
  { code: 'LA', name: 'LOUISIANA' },
  { code: 'ME', name: 'MAINE' },
  { code: 'MD', name: 'MARYLAND' },
  { code: 'MA', name: 'MASSACHUSETTS' },
  { code: 'MI', name: 'MICHIGAN' },
  { code: 'MN', name: 'MINNESOTA' },
  { code: 'MS', name: 'MISSISSIPPI' },
  { code: 'MO', name: 'MISSOURI' },
  { code: 'MT', name: 'MONTANA' },
  { code: 'NE', name: 'NEBRASKA' },
  { code: 'NV', name: 'NEVADA' },
  { code: 'NH', name: 'NEW HAMPSHIRE' },
  { code: 'NJ', name: 'NEW JERSEY' },
  { code: 'NM', name: 'NEW MEXICO' },
  { code: 'NY', name: 'NEW YORK' },
  { code: 'NC', name: 'NORTH CAROLINA' },
  { code: 'ND', name: 'NORTH DAKOTA' },
  { code: 'OH', name: 'OHIO' },
  { code: 'OK', name: 'OKLAHOMA' },
  { code: 'OR', name: 'OREGON' },
  { code: 'PA', name: 'PENNSYLVANIA' },
  { code: 'RI', name: 'RHODE ISLAND' },
  { code: 'SC', name: 'SOUTH CAROLINA' },
  { code: 'SD', name: 'SOUTH DAKOTA' },
  { code: 'TN', name: 'TENNESSEE' },
  { code: 'TX', name: 'TEXAS' },
  { code: 'UT', name: 'UTAH' },
  { code: 'VT', name: 'VERMONT' },
  { code: 'VA', name: 'VIRGINIA' },
  { code: 'WA', name: 'WASHINGTON' },
  { code: 'WV', name: 'WEST VIRGINIA' },
  { code: 'WI', name: 'WISCONSIN' },
  { code: 'WY', name: 'WYOMING' }
]

const ciudadesxEstado = {
  'FL': ['MIAMI', 'TAMPA', 'ORLANDO', 'JACKSONVILLE', 'FORT LAUDERDALE', 'MIAMI BEACH', 'TALLAHASSEE', 'PALM BEACH', 'NAPLES', 'PENSACOLA', 'CLEARWATER', 'DAYTONA BEACH', 'GAINESVILLE', 'LAKELAND', 'SARASOTA'],
  'AL': ['BIRMINGHAM', 'MONTGOMERY', 'MOBILE', 'HUNTSVILLE', 'AUBURN', 'DOTHAN', 'TUSCALOOSA', 'GADSDEN'],
  'GA': ['ATLANTA', 'SAVANNAH', 'AUGUSTA', 'COLUMBUS', 'MACON', 'ATHENS', 'MARIETTA', 'KENNESAW'],
  'TX': ['HOUSTON', 'DALLAS', 'AUSTIN', 'SAN ANTONIO', 'FORT WORTH', 'CORPUS CHRISTI', 'EL PASO', 'ARLINGTON', 'IRVING'],
  'NY': ['NEW YORK', 'BUFFALO', 'ALBANY', 'ROCHESTER', 'YONKERS', 'SYRACUSE', 'BROOKLYN', 'QUEENS'],
  'CA': ['LOS ANGELES', 'SAN FRANCISCO', 'SAN DIEGO', 'SACRAMENTO', 'LONG BEACH', 'OAKLAND', 'ANAHEIM', 'SANTA ANA'],
  // Agregar más ciudades según sea necesario
}

const empleados   = ref([])
const cargos      = ref([])
const ccostos     = ref([])
const cargando    = ref(false)
const filtroEstado = ref('ACTIVO')
const drawer      = ref(false)
const guardando   = ref(false)
const formErr     = ref('')
const snack       = ref(false)
const snackMsg    = ref('')
const editando    = ref(null)
const fotoPreview = ref(null)
const fotoBase64  = ref(null)
const fotoNombre  = ref(null)

const filtrados = computed(() => {
  if (filtroEstado.value === 'TODOS') return empleados.value
  return empleados.value.filter(e => e.estado === filtroEstado.value)
})

const ciudadesDelEstado = computed(() => {
  return ciudadesxEstado[form.value.estado_residencia] || []
})

const formDefault = () => ({
  nombre:'', apellido:'', fecha_nacimiento:'', email:'', telefono:'',
  direccion:'', ciudad:'', estado_residencia:'FL', zipcode:'',
  cargo_id:'', ccosto:'', fecha_ingreso:'', fecha_retiro:'', motivo_retiro:'',
  estado:'ACTIVO', tipo_empleado:'W2', tipo_contrato:'FULL_TIME', empresa_contratista:'',
  es_por_horas:true, valor_hora:'', monto_fijo_semanal:'', frecuencia_pago:'WEEKLY',
  ssn:'', permiso_trabajo:'', fecha_vencimiento_permiso:'',
  w4_filing_status:'SINGLE', w4_claim_dependents:0,
  w4_extra_withholding:0, w4_exempt:false,
  wc_rate:'', wc_code:'', notas:''
})
const form = ref(formDefault())

async function cargar() {
  cargando.value = true
  try {
    const [empR, carR, ccR] = await Promise.all([
      api.get('/nomina/empleados', { params: { empresa: empresa.value, estado: 'TODOS' } }),
      api.get('/nomina/cargos',    { params: { empresa: empresa.value } }),
      api.get('/ccostos',          { params: { empresa: empresa.value } }),
    ])
    empleados.value = empR.data?.data || []
    cargos.value    = carR.data?.data || []
    ccostos.value   = ccR.data?.data  || ccR.data || []
  } catch(e) { console.error(e) }
  finally { cargando.value = false }
}

function nuevo() {
  editando.value  = {}
  form.value      = formDefault()
  fotoPreview.value = null
  fotoBase64.value  = null
  formErr.value   = ''
  drawer.value    = true
}

function editar(e) {
  editando.value = e
  form.value = {
    nombre: e.nombre, apellido: e.apellido,
    fecha_nacimiento: e.fecha_nacimiento?.split('T')[0] || '',
    email: e.email||'', telefono: e.telefono||'',
    direccion: e.direccion||'', ciudad: e.ciudad||'',
    estado_residencia: e.estado_residencia||'FL', zipcode: e.zipcode||'',
    cargo_id: e.cargo_id||'', ccosto: e.ccosto||'',
    fecha_ingreso: e.fecha_ingreso?.split('T')[0]||'',
    fecha_retiro: e.fecha_retiro?.split('T')[0]||'',
    motivo_retiro: e.motivo_retiro||'',
    estado: e.estado||'ACTIVO',
    tipo_empleado: e.tipo_empleado||'W2', tipo_contrato: e.tipo_contrato||'FULL_TIME',
    empresa_contratista: e.empresa_contratista||'',
    es_por_horas: e.es_por_horas !== false,
    valor_hora: e.valor_hora||'', monto_fijo_semanal: e.monto_fijo_semanal||'',
    frecuencia_pago: e.frecuencia_pago||'WEEKLY',
    ssn: e.ssn||'', permiso_trabajo: e.permiso_trabajo||'', fecha_vencimiento_permiso: e.fecha_vencimiento_permiso?.split('T')[0]||'',
    w4_filing_status: e.w4_filing_status||'SINGLE',
    w4_claim_dependents: e.w4_claim_dependents||0,
    w4_extra_withholding: e.w4_extra_withholding||0,
    w4_exempt: e.w4_exempt||false,
    wc_rate: e.wc_rate||'', wc_code: e.wc_code||'', notas: e.notas||''
  }
  fotoPreview.value = null
  fotoBase64.value  = null
  formErr.value     = ''
  // Load photo
  if (e.id) {
    api.get(`/nomina/empleados/${e.id}/foto`, { responseType: 'blob' })
      .then(r => { fotoPreview.value = URL.createObjectURL(r.data) })
      .catch(() => {})
  }
  drawer.value = true
}

function onFoto(e) {
  const file = e.target.files?.[0]
  if (!file) return
  fotoNombre.value = file.name
  const reader = new FileReader()
  reader.onload = ev => {
    fotoPreview.value = ev.target.result
    fotoBase64.value  = ev.target.result.split(',')[1]
  }
  reader.readAsDataURL(file)
}

async function guardar() {
  formErr.value = ''
  if (!form.value.nombre || !form.value.apellido || !form.value.fecha_ingreso) {
    formErr.value = 'Nombre, apellido y fecha de ingreso son requeridos'
    return
  }
  guardando.value = true
  try {
    const payload = { ...form.value, empresa: empresa.value }
    if (editando.value?.id) {
      await api.put(`/nomina/empleados/${editando.value.id}`, payload)
    } else {
      const r = await api.post('/nomina/empleados', payload)
      editando.value = { id: r.data.data?.id }
    }
    // Save photo if changed
    if (fotoBase64.value && editando.value?.id) {
      await api.post(`/nomina/empleados/${editando.value.id}/foto`, {
        fotoBase64: fotoBase64.value, fotoNombre: fotoNombre.value
      })
    }
    snackMsg.value = editando.value?.id ? 'Empleado actualizado' : 'Empleado registrado'
    snack.value    = true
    drawer.value   = false
    cargar()
  } catch(e) {
    formErr.value = e?.response?.data?.error || e.message
  } finally { guardando.value = false }
}

function fmtNum(v) {
  return v ? parseFloat(v).toFixed(2) : '—'
}

onMounted(cargar)
</script>

<style scoped>
.nom-wrap { display: flex; flex-direction: column; gap: 16px; }

.nom-header {
  display: flex; align-items: center; gap: 14px;
  background: linear-gradient(135deg,#1e1b4b,#2d1b69);
  border-radius: 14px; padding: 20px 24px;
}
.nom-header-icon {
  width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0;
  background: rgba(139,92,246,0.3);
  display: flex; align-items: center; justify-content: center;
}
.nom-title { font-size: 18px; font-weight: 800; color: #fff; margin: 0; }
.nom-sub   { font-size: 12px; color: rgba(255,255,255,0.45); margin: 2px 0 0; }
.nom-header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.flex-1 { flex: 1; }

.nom-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface),0.07);
  border-radius: 14px; overflow: hidden;
}
.nom-loading { display: flex; align-items: center; gap: 10px; padding: 24px; font-size: 13px; color: rgba(var(--v-theme-on-surface),0.5); }

.nom-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.nom-table thead { background: rgba(var(--v-theme-on-surface),0.04); }
.nom-table th {
  padding: 10px 14px; text-align: left;
  font-size: 10px; font-weight: 800; letter-spacing: 0.8px;
  color: rgba(var(--v-theme-on-surface),0.4); text-transform: uppercase;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.08);
}
.nom-row { cursor: pointer; transition: background 0.12s; }
.nom-row:hover td { background: rgba(139,92,246,0.05) !important; }
.nom-row td { padding: 12px 14px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.05); }
.nom-row:last-child td { border-bottom: none; }
.nom-id    { font-weight: 700; color: rgba(var(--v-theme-on-surface),0.4); font-size: 12px; }
.nom-nombre { font-weight: 600; }
.nom-email  { font-size: 11px; color: rgba(var(--v-theme-on-surface),0.4); margin-top: 2px; }
.nom-cargo  { font-size: 12px; color: rgba(var(--v-theme-on-surface),0.6); }
.nom-cc     { font-size: 12px; color: rgba(var(--v-theme-on-surface),0.6); }
.nom-rate   { font-weight: 700; color: #10b981; font-size: 13px; }
.nom-empty  { padding: 32px; text-align: center; color: rgba(var(--v-theme-on-surface),0.3); }

.nom-badge { font-size: 9px; font-weight: 800; padding: 3px 7px; border-radius: 5px; letter-spacing: 0.5px; }
.badge-w2   { background: rgba(139,92,246,0.15); color: #8b5cf6; }
.badge-1099 { background: rgba(245,158,11,0.15); color: #f59e0b; }

.nom-estado { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
.estado-activo   { background: rgba(16,185,129,0.12); color: #10b981; }
.estado-inactivo { background: rgba(239,68,68,0.12); color: #ef4444; }

/* DRAWER */
.drw-wrap { display: flex; flex-direction: column; height: 100%; background: rgb(var(--v-theme-surface)); }
.drw-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.08);
  flex-shrink: 0;
}
.drw-title { font-size: 15px; font-weight: 700; }
.drw-body  { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 16px; }
.drw-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 14px 20px; border-top: 1px solid rgba(var(--v-theme-on-surface),0.08);
  flex-shrink: 0;
}

/* Foto */
.drw-foto-row { display: flex; align-items: center; gap: 16px; }
.drw-foto-wrap {
  width: 80px; height: 80px; border-radius: 50%; flex-shrink: 0;
  border: 2px solid rgba(139,92,246,0.4); position: relative; overflow: hidden;
  background: rgba(139,92,246,0.1);
  display: flex; align-items: center; justify-content: center;
}
.drw-foto { width: 100%; height: 100%; object-fit: cover; }
.drw-foto-empty { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
.drw-foto-btn { position: absolute; bottom: 2px; right: 2px; width: 24px !important; height: 24px !important; min-width: 0 !important; border-radius: 50% !important; }
.drw-foto-nombre { font-size: 13px; font-weight: 600; }

/* Form sections */
.drw-section { display: flex; flex-direction: column; gap: 10px; }
.drw-section-title {
  font-size: 10px; font-weight: 800; letter-spacing: 1px;
  color: rgba(var(--v-theme-on-surface),0.45); text-transform: uppercase;
  padding-bottom: 6px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.06);
}
.drw-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.drw-span-2 { grid-column: span 2; }

.drw-field { display: flex; flex-direction: column; gap: 4px; }
.drw-field label { font-size: 10px; font-weight: 700; color: rgba(var(--v-theme-on-surface),0.5); text-transform: uppercase; letter-spacing: 0.4px; }

.drw-input {
  height: 34px; padding: 0 10px; border-radius: 7px;
  border: 1px solid rgba(var(--v-theme-on-surface),0.2);
  background: rgba(var(--v-theme-on-surface),0.05);
  color: rgb(var(--v-theme-on-surface)); font-size: 12px;
  outline: none; transition: border-color 0.15s;
}
.drw-input:focus { border-color: #8b5cf6; background: rgba(var(--v-theme-on-surface),0.08); }

.drw-select {
  height: 34px; padding: 0 10px; border-radius: 7px;
  border: 1.5px solid rgba(var(--v-theme-on-surface),0.25);
  background: rgba(var(--v-theme-on-surface),0.06);
  color: rgb(var(--v-theme-on-surface)); font-size: 12px; font-weight: 500;
  outline: none; transition: all 0.15s; cursor: pointer;
  appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat; background-position: right 8px center; background-size: 16px;
  padding-right: 30px;
}
.drw-select:disabled { opacity: 0.5; cursor: not-allowed; }
.drw-select:focus { border-color: #8b5cf6; background-color: rgba(var(--v-theme-on-surface),0.09); }

.drw-textarea {
  padding: 8px 10px; border-radius: 7px; width: 100%;
  border: 1px solid rgba(var(--v-theme-on-surface),0.15);
  background: rgba(var(--v-theme-on-surface),0.03);
  color: rgb(var(--v-theme-on-surface)); font-size: 12px;
  outline: none; resize: vertical;
}

.drw-check-row { display: flex; align-items: center; gap: 8px; padding-top: 4px; }
.drw-check { width: 16px; height: 16px; cursor: pointer; }

.drw-w4-note {
  display: flex; align-items: center; gap: 6px;
  background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2);
  border-radius: 8px; padding: 8px 12px; font-size: 11px; color: rgba(var(--v-theme-on-surface),0.7);
}
.drw-error { color: #ef4444; font-size: 12px; font-weight: 600; }
</style>
