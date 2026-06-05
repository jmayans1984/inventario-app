<template>
  <MainLayout>
    <div class="cfg-wrap">

      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">CONFIGURACIÓN</span>
        <v-icon size="13" color="#06b6d4">mdi-chevron-right</v-icon>
        <span class="bc-cur">Configuración General</span>
      </div>

      <!-- HEADER -->
      <div class="cfg-header">
        <div class="cfg-header-icon">
          <v-icon size="26" color="white">mdi-tune</v-icon>
        </div>
        <div>
          <h1 class="cfg-title">CONFIGURACIÓN GENERAL</h1>
          <p class="cfg-sub">Parámetros contables, usuarios y logo de la empresa</p>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════
           SECCIÓN 1: CONFIGURACIÓN CONTABLE
      ══════════════════════════════════════════════ -->
      <div class="cfg-card">
        <div class="cfg-section-hdr">
          <div class="cfg-section-icon" style="background:rgba(6,182,212,0.12)">
            <v-icon size="16" color="#06b6d4">mdi-calculator</v-icon>
          </div>
          <span class="cfg-section-title">CONFIGURACIÓN GENERAL DE CONTABILIDAD</span>
        </div>

        <div v-if="loadingCfg" class="cfg-loading">
          <v-progress-circular indeterminate color="#06b6d4" size="28" />
          <span>Cargando configuración...</span>
        </div>

        <div v-else class="cfg-ctas-table">
          <div v-for="row in CFG_ROWS" :key="row.key" class="cfg-cta-row">
            <span class="cfg-cta-label">{{ row.label }}</span>

            <!-- Dropdown 1: Grupo de gastos -->
            <v-select
              v-model="selGrupo[row.key]"
              :items="grupos"
              item-title="nombre"
              item-value="codigo"
              density="compact"
              variant="outlined"
              hide-details
              placeholder="Grupo..."
              class="cfg-sel"
              bg-color="rgb(var(--v-theme-surface))"
              @update:modelValue="onGrupoChange(row.key)"
            />

            <!-- Dropdown 2: Cuenta contable (filtrada por grupo) -->
            <v-select
              v-model="selCuenta[row.key]"
              :items="cuentasFiltradas(row.key)"
              item-title="cuenta"
              item-value="codigo"
              density="compact"
              variant="outlined"
              hide-details
              placeholder="Cuenta..."
              :disabled="!selGrupo[row.key]"
              class="cfg-sel"
              bg-color="rgb(var(--v-theme-surface))"
            />
          </div>
        </div>

        <div v-if="!loadingCfg" class="cfg-ctas-actions">
          <span v-if="cfgSaveOk" class="cfg-ok-msg">
            <v-icon size="14" color="#10b981">mdi-check-circle</v-icon> Guardado correctamente
          </span>
          <span v-if="cfgSaveErr" class="cfg-err-msg">{{ cfgSaveErr }}</span>
          <v-btn
            color="#06b6d4"
            variant="flat"
            size="small"
            :loading="savingCfg"
            @click="guardarConfigContable"
          >
            <v-icon size="15" class="mr-1">mdi-content-save-outline</v-icon>
            Guardar Configuración
          </v-btn>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════
           SECCIÓN 2: GESTIÓN DE USUARIOS
      ══════════════════════════════════════════════ -->
      <div class="cfg-card">
        <div class="cfg-section-hdr">
          <div class="cfg-section-icon" style="background:rgba(139,92,246,0.12)">
            <v-icon size="16" color="#8b5cf6">mdi-account-cog-outline</v-icon>
          </div>
          <span class="cfg-section-title">GESTIÓN DE USUARIOS</span>
        </div>

        <div class="cfg-usr-layout">

          <!-- Formulario izquierda -->
          <div class="cfg-usr-form">
            <div class="cfg-field">
              <label class="cfg-field-lbl">CÓDIGO (Cédula)</label>
              <input v-model="formUsr.codigo" type="text" class="cfg-input" placeholder="Ej: 12345678" />
            </div>
            <div class="cfg-field">
              <label class="cfg-field-lbl">NOMBRE</label>
              <input v-model="formUsr.nombre" type="text" class="cfg-input" placeholder="Nombre completo" />
            </div>
            <div class="cfg-field">
              <label class="cfg-field-lbl">USUARIO</label>
              <input v-model="formUsr.usuario" type="text" class="cfg-input" placeholder="Login" />
            </div>
            <div class="cfg-field">
              <label class="cfg-field-lbl">CLAVE</label>
              <input v-model="formUsr.clave" type="password" class="cfg-input" placeholder="Contraseña" />
            </div>
            <div class="cfg-field">
              <label class="cfg-field-lbl">NIVEL</label>
              <input value="1" type="text" class="cfg-input cfg-input--disabled" readonly />
            </div>

            <div v-if="usrError" class="cfg-err-msg" style="margin-top:8px">{{ usrError }}</div>

            <div class="cfg-usr-btns">
              <v-btn
                color="#8b5cf6"
                variant="flat"
                size="small"
                :loading="savingUsr"
                @click="registrarUsuario"
              >
                <v-icon size="14" class="mr-1">mdi-account-plus-outline</v-icon>
                Registrar
              </v-btn>
              <v-btn
                color="#ef4444"
                variant="flat"
                size="small"
                :disabled="!selectedUsr"
                :loading="deletingUsr"
                @click="eliminarUsuario"
              >
                <v-icon size="14" class="mr-1">mdi-account-minus-outline</v-icon>
                Eliminar
              </v-btn>
              <v-btn
                variant="text"
                size="small"
                color="#94a3b8"
                @click="limpiarFormUsr"
              >
                Limpiar
              </v-btn>
            </div>
          </div>

          <!-- Grid derecha -->
          <div class="cfg-usr-grid-wrap">
            <div v-if="loadingUsrs" class="cfg-loading">
              <v-progress-circular indeterminate color="#8b5cf6" size="22" />
            </div>
            <table v-else class="cfg-usr-table">
              <thead>
                <tr>
                  <th>CÓDIGO</th>
                  <th>USUARIO</th>
                  <th>NOMBRE</th>
                  <th>NIVEL</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!usuarios.length">
                  <td colspan="4" class="cfg-empty">Sin usuarios registrados</td>
                </tr>
                <tr
                  v-for="u in usuarios"
                  :key="u.codigo"
                  class="cfg-usr-row"
                  :class="{ 'cfg-usr-row--selected': selectedUsr?.codigo === u.codigo }"
                  @click="selectUsr(u)"
                >
                  <td>{{ u.codigo }}</td>
                  <td>{{ u.usuario }}</td>
                  <td>{{ u.nombre }}</td>
                  <td class="cfg-nivel">{{ u.nivel }}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>

      <!-- ══════════════════════════════════════════════
           SECCIÓN 3: LOGO DE LA EMPRESA
      ══════════════════════════════════════════════ -->
      <div class="cfg-card">
        <div class="cfg-section-hdr">
          <div class="cfg-section-icon" style="background:rgba(16,185,129,0.12)">
            <v-icon size="16" color="#10b981">mdi-image-outline</v-icon>
          </div>
          <span class="cfg-section-title">LOGO DE LA EMPRESA</span>
        </div>

        <div class="cfg-logo-section">
          <div class="cfg-logo-preview-wrap">
            <img v-if="logoUrl" :src="logoUrl" class="cfg-logo-preview" alt="Logo empresa" />
            <div v-else class="cfg-logo-empty">
              <v-icon size="40" color="rgba(var(--v-theme-on-surface),0.15)">mdi-image-off-outline</v-icon>
              <span>Sin logo cargado</span>
            </div>
          </div>
          <div class="cfg-logo-info">
            <p class="cfg-logo-hint">Especifique el logo a utilizar de la empresa</p>
            <p class="cfg-logo-hint2">Formatos: PNG, JPG, GIF, WEBP · Máx. 2 MB</p>
            <div class="cfg-logo-btns">
              <v-btn
                color="#10b981"
                variant="flat"
                size="small"
                @click="$refs.logoInput.click()"
              >
                <v-icon size="15" class="mr-1">mdi-folder-open-outline</v-icon>
                Buscar
              </v-btn>
              <v-btn
                v-if="logoUrl"
                color="#ef4444"
                variant="outlined"
                size="small"
                @click="quitarLogo"
              >
                <v-icon size="14" class="mr-1">mdi-close</v-icon>
                Quitar
              </v-btn>
            </div>
            <span v-if="logoSaveOk" class="cfg-ok-msg" style="margin-top:10px">
              <v-icon size="13" color="#10b981">mdi-check-circle</v-icon> Logo guardado
            </span>
            <span v-if="logoSaveErr" class="cfg-err-msg" style="margin-top:10px">{{ logoSaveErr }}</span>
          </div>
          <input ref="logoInput" type="file" accept="image/*" hidden @change="onLogoChange" />
        </div>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import MainLayout from '../components/layouts/MainLayout.vue'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const empresa   = computed(() => authStore.empresa || authStore.user?.empresa || localStorage.getItem('empresaActual') || '')

// ── Definición de filas de configuración contable ──────────────
const CFG_ROWS = [
  { key: 'cta_ventas',            label: 'CUENTA CONTABLE DE VENTAS' },
  { key: 'cta_comisiones',        label: 'CUENTA CONTABLE COMISIONES POS' },
  { key: 'cta_descuentos_ventas', label: 'CUENTA CONTABLE DESCUENTO VENTAS' },
  { key: 'cta_propinas',          label: 'CUENTA CONTABLE INGRESO PROPINAS' },
  { key: 'cta_impuestos',         label: 'CUENTA CONTABLE INGRESO IMPUESTOS' },
  { key: 'cta_egresos_propinas',  label: 'CUENTA CONTABLE EGRESO PROPINAS' },
  { key: 'cta_egresos_impuestos', label: 'CUENTA CONTABLE EGRESO IMPUESTOS' },
]

// ── Estado contabilidad ────────────────────────────────────────
const grupos    = ref([])
const cuentas   = ref([])  // todas las cuentas de la empresa (con grupo)
const selGrupo  = reactive({})
const selCuenta = reactive({})
const loadingCfg = ref(true)
const savingCfg  = ref(false)
const cfgSaveOk  = ref(false)
const cfgSaveErr = ref('')

function cuentasFiltradas(key) {
  const g = selGrupo[key]
  if (!g) return []
  const gTrim = String(g).trim()
  return cuentas.value.filter(c => String(c.grupo || '').trim() === gTrim)
}

function onGrupoChange(key) {
  selCuenta[key] = null  // reset cuenta cuando cambia el grupo
}

async function cargarConfigContable() {
  loadingCfg.value = true
  try {
    const [gruposRes, cuentasRes, cfgRes] = await Promise.all([
      api.get('/grupo-gastos'),
      api.get('/configuracion/cuentas', { params: { empresa: empresa.value } }),
      api.get('/config-general',        { params: { empresa: empresa.value } }),
    ])
    grupos.value  = gruposRes.data?.data  || []
    cuentas.value = cuentasRes.data?.data || []

    const cfg = cfgRes.data?.data || {}
    // Pre-seleccionar grupo y cuenta para cada fila
    for (const row of CFG_ROWS) {
      const codigoCuenta = cfg[row.key] ? String(cfg[row.key]).trim() : null
      selCuenta[row.key] = codigoCuenta
      if (codigoCuenta) {
        const cta = cuentas.value.find(c => String(c.codigo || '').trim() === codigoCuenta)
        selGrupo[row.key] = cta?.grupo ? String(cta.grupo).trim() : null
      } else {
        selGrupo[row.key] = null
      }
    }
  } catch (e) {
    console.error('cargarConfigContable:', e)
  } finally {
    loadingCfg.value = false
  }
}

async function guardarConfigContable() {
  savingCfg.value = true
  cfgSaveOk.value = false
  cfgSaveErr.value = ''
  try {
    const payload = { empresa: empresa.value }
    for (const row of CFG_ROWS) payload[row.key] = selCuenta[row.key] || null
    const res = await api.put('/config-general', payload)
    if (!res.data?.success) throw new Error(res.data?.error || 'Error al guardar')
    cfgSaveOk.value = true
    setTimeout(() => { cfgSaveOk.value = false }, 3000)
  } catch (e) {
    cfgSaveErr.value = e?.response?.data?.error || e.message
  } finally {
    savingCfg.value = false
  }
}

// ── Estado usuarios ────────────────────────────────────────────
const usuarios    = ref([])
const selectedUsr = ref(null)
const loadingUsrs = ref(false)
const savingUsr   = ref(false)
const deletingUsr = ref(false)
const usrError    = ref('')
const formUsr     = reactive({ codigo: '', nombre: '', usuario: '', clave: '' })

async function cargarUsuarios() {
  loadingUsrs.value = true
  try {
    const res = await api.get('/configuracion/usuarios', { params: { empresa: empresa.value } })
    usuarios.value = res.data?.data || []
  } catch (e) { console.error('cargarUsuarios:', e) }
  finally { loadingUsrs.value = false }
}

function selectUsr(u) {
  selectedUsr.value = u
  formUsr.codigo  = u.codigo
  formUsr.nombre  = u.nombre
  formUsr.usuario = u.usuario
  formUsr.clave   = ''
}

function limpiarFormUsr() {
  selectedUsr.value = null
  formUsr.codigo = formUsr.nombre = formUsr.usuario = formUsr.clave = ''
  usrError.value = ''
}

async function registrarUsuario() {
  usrError.value = ''
  if (!formUsr.codigo || !formUsr.nombre || !formUsr.usuario || !formUsr.clave) {
    usrError.value = 'Todos los campos son requeridos'
    return
  }
  savingUsr.value = true
  try {
    const res = await api.post('/configuracion/usuarios', { ...formUsr, empresa: empresa.value })
    if (!res.data?.success) throw new Error(res.data?.error || 'Error')
    usuarios.value.unshift(res.data.data)
    limpiarFormUsr()
  } catch (e) {
    usrError.value = e?.response?.data?.error || e.message
  } finally { savingUsr.value = false }
}

async function eliminarUsuario() {
  if (!selectedUsr.value) return
  deletingUsr.value = true
  try {
    await api.delete(`/configuracion/usuarios/${selectedUsr.value.codigo}`, { params: { empresa: empresa.value } })
    usuarios.value = usuarios.value.filter(u => u.codigo !== selectedUsr.value.codigo)
    limpiarFormUsr()
  } catch (e) {
    usrError.value = e?.response?.data?.error || e.message
  } finally { deletingUsr.value = false }
}

// ── Estado logo ────────────────────────────────────────────────
const logoUrl     = ref(null)
const logoSaveOk  = ref(false)
const logoSaveErr = ref('')

async function cargarLogo() {
  try {
    const res = await api.get('/empresa/logo', {
      params: { empresa: empresa.value },
      responseType: 'blob'
    })
    logoUrl.value = URL.createObjectURL(res.data)
  } catch { logoUrl.value = null }
}

async function onLogoChange(e) {
  logoSaveOk.value  = false
  logoSaveErr.value = ''
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    logoSaveErr.value = 'El archivo excede 2 MB'
    return
  }
  const reader = new FileReader()
  reader.onload = async (ev) => {
    const base64 = ev.target.result.split(',')[1]
    try {
      const res = await api.post('/empresa/logo', {
        empresa: empresa.value,
        logoBase64: base64,
        logoNombre: file.name
      })
      if (!res.data?.success) throw new Error(res.data?.error)
      logoUrl.value = URL.createObjectURL(file)
      logoSaveOk.value = true
      setTimeout(() => { logoSaveOk.value = false }, 3000)
    } catch (err) {
      logoSaveErr.value = err?.response?.data?.error || err.message
    }
  }
  reader.readAsDataURL(file)
  e.target.value = ''  // reset input para permitir re-subir el mismo archivo
}

function quitarLogo() {
  logoUrl.value = null
}

// ── Inicialización ─────────────────────────────────────────────
onMounted(() => {
  cargarConfigContable()
  cargarUsuarios()
  cargarLogo()
})
</script>

<style scoped>
.cfg-wrap { display: flex; flex-direction: column; gap: 20px; }

/* BREADCRUMB */
.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.bc-root { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: rgba(var(--v-theme-on-surface),0.4); text-transform: uppercase; }
.bc-cur  { font-size: 11px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }

/* HEADER */
.cfg-header { display: flex; align-items: center; gap: 16px; }
.cfg-header-icon {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
  background: linear-gradient(135deg,#8b5cf6,#7c3aed);
  display: flex; align-items: center; justify-content: center;
}
.cfg-title { font-size: 22px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); margin: 0; letter-spacing: 0.3px; }
.cfg-sub   { font-size: 13px; color: rgba(var(--v-theme-on-surface),0.45); margin: 2px 0 0; }

/* CARD GENÉRICA */
.cfg-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface),0.07);
  border-radius: 16px;
  padding: 20px;
}

/* SECTION HEADER */
.cfg-section-hdr { display: flex; align-items: center; gap: 8px; margin-bottom: 18px; }
.cfg-section-icon {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.cfg-section-title {
  font-size: 11px; font-weight: 800; letter-spacing: 1.2px;
  color: rgba(var(--v-theme-on-surface),0.6); text-transform: uppercase;
}

/* LOADING */
.cfg-loading { display: flex; align-items: center; gap: 10px; padding: 16px 0; font-size: 13px; color: rgba(var(--v-theme-on-surface),0.5); }

/* ═══ CONFIGURACIÓN CONTABLE ═══ */
.cfg-ctas-table { display: flex; flex-direction: column; gap: 10px; }

.cfg-cta-row {
  display: grid;
  grid-template-columns: 1fr 200px 260px;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface),0.06);
  transition: background 0.15s;
}
.cfg-cta-row:hover { background: rgba(var(--v-theme-on-surface),0.02); }

.cfg-cta-label {
  font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface),0.65); text-transform: uppercase;
}

.cfg-sel { min-width: 0; }

.cfg-ctas-actions {
  display: flex; align-items: center; justify-content: flex-end; gap: 12px;
  margin-top: 16px; padding-top: 14px;
  border-top: 1px solid rgba(var(--v-theme-on-surface),0.07);
}

/* ═══ USUARIOS ═══ */
.cfg-usr-layout { display: grid; grid-template-columns: 280px 1fr; gap: 20px; }
@media (max-width: 768px) { .cfg-usr-layout { grid-template-columns: 1fr; } }

/* Formulario */
.cfg-usr-form { display: flex; flex-direction: column; gap: 10px; }

.cfg-field { display: flex; flex-direction: column; gap: 4px; }
.cfg-field-lbl {
  font-size: 10px; font-weight: 800; letter-spacing: 0.8px;
  color: rgba(var(--v-theme-on-surface),0.45); text-transform: uppercase;
}
.cfg-input {
  height: 36px; padding: 0 10px;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface),0.15);
  background: rgba(var(--v-theme-on-surface),0.03);
  color: rgb(var(--v-theme-on-surface));
  font-size: 13px; font-weight: 500;
  outline: none; transition: border-color 0.15s;
}
.cfg-input:focus { border-color: #8b5cf6; }
.cfg-input--disabled { opacity: 0.45; cursor: not-allowed; }

.cfg-usr-btns { display: flex; gap: 8px; margin-top: 4px; flex-wrap: wrap; }

/* Grid de usuarios */
.cfg-usr-grid-wrap { overflow: auto; border-radius: 10px; border: 1px solid rgba(var(--v-theme-on-surface),0.08); }

.cfg-usr-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.cfg-usr-table thead { background: rgba(var(--v-theme-on-surface),0.04); }
.cfg-usr-table th {
  padding: 10px 14px; text-align: left;
  font-size: 10px; font-weight: 800; letter-spacing: 0.8px;
  color: rgba(var(--v-theme-on-surface),0.4); text-transform: uppercase;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.08);
}
.cfg-usr-row {
  cursor: pointer; transition: background 0.12s;
}
.cfg-usr-row td { padding: 11px 14px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.05); }
.cfg-usr-row:last-child td { border-bottom: none; }
.cfg-usr-row:hover td { background: rgba(139,92,246,0.04); }
.cfg-usr-row--selected td { background: rgba(139,92,246,0.08); }
.cfg-nivel { text-align: center; font-weight: 700; color: #8b5cf6; }
.cfg-empty { padding: 24px; text-align: center; color: rgba(var(--v-theme-on-surface),0.3); font-size: 13px; }

/* ═══ LOGO ═══ */
.cfg-logo-section { display: flex; align-items: flex-start; gap: 24px; flex-wrap: wrap; }
.cfg-logo-preview-wrap {
  width: 180px; height: 120px; border-radius: 12px; flex-shrink: 0;
  border: 1px dashed rgba(var(--v-theme-on-surface),0.2);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; background: rgba(var(--v-theme-on-surface),0.02);
}
.cfg-logo-preview { max-width: 100%; max-height: 100%; object-fit: contain; }
.cfg-logo-empty {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  font-size: 11px; color: rgba(var(--v-theme-on-surface),0.3);
}
.cfg-logo-info { display: flex; flex-direction: column; gap: 8px; }
.cfg-logo-hint  { font-size: 13px; font-weight: 600; color: rgba(var(--v-theme-on-surface),0.7); margin: 0; }
.cfg-logo-hint2 { font-size: 11px; color: rgba(var(--v-theme-on-surface),0.35); margin: 0; }
.cfg-logo-btns  { display: flex; gap: 8px; }

/* Mensajes */
.cfg-ok-msg  { font-size: 12px; font-weight: 600; color: #10b981; display: flex; align-items: center; gap: 4px; }
.cfg-err-msg { font-size: 12px; font-weight: 600; color: #ef4444; }
</style>
