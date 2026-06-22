<template>
  <MainLayout>
    <div class="nom-wrap">
      <div class="nom-header">
        <div class="nom-header-icon"><v-icon size="20" color="white">mdi-bank-outline</v-icon></div>
        <div class="flex-1">
          <h1 class="nom-title">CONFIGURACIÓN FISCAL</h1>
          <p class="nom-sub">Tasas federales y de Florida · IRS Publication 15-T</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <select v-model="anio" class="drw-select" @change="cargar" style="width:90px">
            <option v-for="a in anios" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>
      </div>

      <div class="nom-card pa-6">
        <div v-if="cargando" class="nom-loading"><v-progress-circular indeterminate color="#06b6d4" size="24"/></div>
        <div v-else>
          <!-- FICA -->
          <div class="cfg-section">
            <div class="cfg-section-title">FICA — FEDERAL INSURANCE CONTRIBUTIONS ACT</div>
            <div class="cfg-row">
              <div class="cfg-item">
                <label>Social Security Rate (Empleado + Empleador)</label>
                <div class="cfg-hint">Cada uno paga 6.2% (total 12.4%)</div>
                <input v-model="cfg.ss_rate" type="number" step="0.001" class="drw-input" />
              </div>
              <div class="cfg-item">
                <label>Social Security Wage Base ($)</label>
                <div class="cfg-hint">Límite salarial anual para SS (2024: $168,600)</div>
                <input v-model="cfg.ss_wage_base" type="number" class="drw-input" />
              </div>
              <div class="cfg-item">
                <label>Medicare Rate (Empleado + Empleador)</label>
                <div class="cfg-hint">Cada uno paga 1.45% (sin límite)</div>
                <input v-model="cfg.medicare_rate" type="number" step="0.001" class="drw-input" />
              </div>
              <div class="cfg-item">
                <label>Medicare Adicional Rate (solo empleado)</label>
                <div class="cfg-hint">0.9% sobre ingresos superiores al umbral</div>
                <input v-model="cfg.medicare_adicional_rate" type="number" step="0.001" class="drw-input" />
              </div>
              <div class="cfg-item">
                <label>Medicare Adicional Threshold ($)</label>
                <div class="cfg-hint">Umbral anual (2024: $200,000 soltero)</div>
                <input v-model="cfg.medicare_adicional_threshold" type="number" class="drw-input" />
              </div>
            </div>
          </div>

          <!-- FUTA / SUTA -->
          <div class="cfg-section">
            <div class="cfg-section-title">FUTA — FEDERAL UNEMPLOYMENT TAX (solo empleador)</div>
            <div class="cfg-info"><v-icon size="13" color="#06b6d4">mdi-information-outline</v-icon>
              Tasa bruta 6.0%, pero con crédito estatal efectiva es 0.6% en Florida.
            </div>
            <div class="cfg-row">
              <div class="cfg-item">
                <label>FUTA Rate (tasa efectiva)</label>
                <input v-model="cfg.futa_rate" type="number" step="0.001" class="drw-input" />
              </div>
              <div class="cfg-item">
                <label>FUTA Wage Base ($)</label>
                <div class="cfg-hint">Primeros $7,000 por empleado/año</div>
                <input v-model="cfg.futa_wage_base" type="number" class="drw-input" />
              </div>
            </div>
          </div>

          <div class="cfg-section">
            <div class="cfg-section-title">SUTA — FL REEMPLOYMENT TAX (solo empleador)</div>
            <div class="cfg-info"><v-icon size="13" color="#f59e0b">mdi-information-outline</v-icon>
              Florida Reemployment Tax. Nuevos empleadores: 2.7%. Varía según historial de la empresa.
            </div>
            <div class="cfg-row">
              <div class="cfg-item">
                <label>SUTA Rate</label>
                <input v-model="cfg.suta_rate" type="number" step="0.001" class="drw-input" />
              </div>
              <div class="cfg-item">
                <label>SUTA Wage Base ($)</label>
                <div class="cfg-hint">Primeros $7,000 por empleado/año (FL)</div>
                <input v-model="cfg.suta_wage_base" type="number" class="drw-input" />
              </div>
            </div>
          </div>

          <!-- CUENTA CONTABLE NÓMINA -->
          <div class="cfg-section">
            <div class="cfg-section-title">CONTABILIDAD — CUENTA DE GASTOS DE NÓMINA</div>
            <div class="cfg-info"><v-icon size="13" color="#8b5cf6">mdi-information-outline</v-icon>
              Selecciona la cuenta contable a la que se cargará el gasto de nómina al aprobar.
              Esta cuenta aparecerá en tu estado de pérdidas y ganancias.
            </div>
            <div class="cfg-row">
              <div class="cfg-item" style="grid-column: 1 / -1; max-width: 500px">
                <label>Cuenta contable de salarios / nómina</label>
                <div class="cfg-hint">Se usará automáticamente al aprobar cada nómina</div>
                <v-select
                  v-model="cfg.cuenta_nomina"
                  :items="[{ codigo: '', cuenta: '— Sin vincular (usará NOMINA como texto) —' }, ...cuentasContables]"
                  item-value="codigo"
                  item-title="cuenta"
                  density="compact"
                  variant="outlined"
                  hide-details
                  clearable
                  placeholder="Seleccionar cuenta..."
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template #title>
                        <span v-if="item.raw.codigo" style="font-size:12px">
                          <strong>{{ item.raw.codigo }}</strong> — {{ item.raw.cuenta }}
                        </span>
                        <span v-else style="font-size:12px;opacity:0.5">{{ item.raw.cuenta }}</span>
                      </template>
                    </v-list-item>
                  </template>
                  <template #selection="{ item }">
                    <span style="font-size:12px">
                      <strong v-if="item.raw.codigo">{{ item.raw.codigo }}</strong>
                      {{ item.raw.codigo ? ' — ' : '' }}{{ item.raw.cuenta }}
                    </span>
                  </template>
                </v-select>
                <div v-if="cfg.cuenta_nomina" style="margin-top:6px;font-size:11px;color:#10b981;display:flex;align-items:center;gap:4px">
                  <v-icon size="12" color="#10b981">mdi-check-circle</v-icon>
                  Al aprobar nóminas se usará: <strong>{{ cfg.cuenta_nomina }}</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- FIT TABLES -->
          <div class="cfg-section">
            <div class="cfg-section-title">FIT — TABLAS DE RETENCIÓN FEDERAL (IRS PUB. 15-T)</div>
            <div class="cfg-info"><v-icon size="13" color="#6366f1">mdi-information-outline</v-icon>
              Actualiza estos valores cada enero cuando el IRS publique las tablas del nuevo año.
              Las tasas (10%, 12%, 22%…) son fijas en la ley; solo cambian los límites y las deducciones estándar.
            </div>

            <div class="fit-sub-title">DEDUCCIONES ESTÁNDAR</div>
            <div class="cfg-row" style="margin-bottom:20px">
              <div class="cfg-item">
                <label>Single / Married Filing Sep. ($)</label>
                <div class="cfg-hint">2025: $15,000</div>
                <input v-model.number="fitCfg.sd_single" type="number" class="drw-input" />
              </div>
              <div class="cfg-item">
                <label>Married Filing Jointly ($)</label>
                <div class="cfg-hint">2025: $30,000</div>
                <input v-model.number="fitCfg.sd_mfj" type="number" class="drw-input" />
              </div>
              <div class="cfg-item">
                <label>Head of Household ($)</label>
                <div class="cfg-hint">2025: $22,500</div>
                <input v-model.number="fitCfg.sd_hoh" type="number" class="drw-input" />
              </div>
            </div>

            <div class="fit-brackets-grid">
              <div class="fit-bracket-col">
                <div class="fit-sub-title">TRAMOS — SINGLE &amp; MARRIED FILING SEP.</div>
                <div class="fit-br-table">
                  <div class="fit-br-head"><span>Tasa</span><span>Hasta ($)</span></div>
                  <div v-for="(_, i) in fitCfg.brackets_single" :key="'s'+i" class="fit-br-row">
                    <span class="fit-rate">{{ fitRateLabels[i] }}</span>
                    <input v-model.number="fitCfg.brackets_single[i]" type="number" class="drw-input fit-br-input" />
                  </div>
                  <div class="fit-br-row fit-br-last"><span class="fit-rate">37%</span><span class="fit-br-inf">sin límite</span></div>
                </div>
              </div>
              <div class="fit-bracket-col">
                <div class="fit-sub-title">TRAMOS — MARRIED FILING JOINTLY</div>
                <div class="fit-br-table">
                  <div class="fit-br-head"><span>Tasa</span><span>Hasta ($)</span></div>
                  <div v-for="(_, i) in fitCfg.brackets_mfj" :key="'m'+i" class="fit-br-row">
                    <span class="fit-rate">{{ fitRateLabels[i] }}</span>
                    <input v-model.number="fitCfg.brackets_mfj[i]" type="number" class="drw-input fit-br-input" />
                  </div>
                  <div class="fit-br-row fit-br-last"><span class="fit-rate">37%</span><span class="fit-br-inf">sin límite</span></div>
                </div>
              </div>
              <div class="fit-bracket-col">
                <div class="fit-sub-title">TRAMOS — HEAD OF HOUSEHOLD</div>
                <div class="fit-br-table">
                  <div class="fit-br-head"><span>Tasa</span><span>Hasta ($)</span></div>
                  <div v-for="(_, i) in fitCfg.brackets_hoh" :key="'h'+i" class="fit-br-row">
                    <span class="fit-rate">{{ fitRateLabels[i] }}</span>
                    <input v-model.number="fitCfg.brackets_hoh[i]" type="number" class="drw-input fit-br-input" />
                  </div>
                  <div class="fit-br-row fit-br-last"><span class="fit-rate">37%</span><span class="fit-br-inf">sin límite</span></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Overtime + WC + Min wage -->
          <div class="cfg-section">
            <div class="cfg-section-title">OVERTIME Y PARÁMETROS GENERALES</div>
            <div class="cfg-row">
              <div class="cfg-item">
                <label>Horas regulares antes de OT</label>
                <div class="cfg-hint">FLSA: 40 horas/semana</div>
                <input v-model="cfg.ot_threshold_hours" type="number" step="0.5" class="drw-input" />
              </div>
              <div class="cfg-item">
                <label>Multiplicador de Overtime</label>
                <div class="cfg-hint">FLSA: 1.5× la tarifa regular</div>
                <input v-model="cfg.ot_multiplier" type="number" step="0.1" class="drw-input" />
              </div>
              <div class="cfg-item">
                <label>Florida Minimum Wage ($/hr)</label>
                <div class="cfg-hint">2024: $13.00 · 2025: $14.00</div>
                <input v-model="cfg.fl_min_wage" type="number" step="0.01" class="drw-input" />
              </div>
              <div class="cfg-item">
                <label>Workers' Comp Rate por Defecto</label>
                <div class="cfg-hint">Tasa base si el empleado no tiene una específica</div>
                <input v-model="cfg.wc_default_rate" type="number" step="0.0001" class="drw-input" />
              </div>
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px">
            <span v-if="saved" style="font-size:12px;color:#10b981;display:flex;align-items:center;gap:4px">
              <v-icon size="14" color="#10b981">mdi-check-circle</v-icon> Guardado
            </span>
            <v-btn color="#06b6d4" variant="flat" size="small" :loading="guardando" @click="guardar">
              <v-icon size="14" class="mr-1">mdi-content-save-outline</v-icon> Guardar Configuración
            </v-btn>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'
const authStore = useAuthStore()
const empresa = computed(() => authStore.empresa || authStore.user?.empresa || localStorage.getItem('empresaActual') || '')
const anioActual = new Date().getFullYear()
const anio = ref(anioActual)
const anios = [anioActual + 1, anioActual, anioActual - 1]
const cargando = ref(false)
const guardando = ref(false)
const saved = ref(false)
const cuentasContables = ref([])
const cfg = ref({
  ss_rate: 0.062, ss_wage_base: 168600,
  medicare_rate: 0.0145, medicare_adicional_rate: 0.009, medicare_adicional_threshold: 200000,
  futa_rate: 0.006, futa_wage_base: 7000, suta_rate: 0.027, suta_wage_base: 7000,
  ot_threshold_hours: 40, ot_multiplier: 1.5, fl_min_wage: 13.00, wc_default_rate: 0,
  cuenta_nomina: ''
})

const FIT_DEFAULTS = {
  sd_single: 15000, sd_mfj: 30000, sd_hoh: 22500,
  brackets_single: [11925, 48475, 103350, 197300, 250525, 626350],
  brackets_mfj:    [23850, 96950, 206700, 394600, 501050, 751600],
  brackets_hoh:    [17000, 64850, 103350, 197300, 250500, 626350]
}
const fitRateLabels = ['10%', '12%', '22%', '24%', '32%', '35%']
const fitCfg = ref({ ...FIT_DEFAULTS, brackets_single:[...FIT_DEFAULTS.brackets_single], brackets_mfj:[...FIT_DEFAULTS.brackets_mfj], brackets_hoh:[...FIT_DEFAULTS.brackets_hoh] })
async function cargar() {
  cargando.value = true
  try {
    const [cfgR, cuentasR] = await Promise.all([
      api.get('/nomina/config-fiscal', { params: { empresa: empresa.value, anio: anio.value } }),
      api.get('/gastos/cuentas-contables', { params: { empresa: empresa.value } })
    ])
    if (cfgR.data?.data) {
      cfg.value = { ...cfg.value, ...cfgR.data.data }
      const fc = cfgR.data.data.fit_config
      if (fc && typeof fc === 'object') {
        fitCfg.value = {
          sd_single: fc.sd_single ?? FIT_DEFAULTS.sd_single,
          sd_mfj:    fc.sd_mfj    ?? FIT_DEFAULTS.sd_mfj,
          sd_hoh:    fc.sd_hoh    ?? FIT_DEFAULTS.sd_hoh,
          brackets_single: fc.brackets_single ? [...fc.brackets_single] : [...FIT_DEFAULTS.brackets_single],
          brackets_mfj:    fc.brackets_mfj    ? [...fc.brackets_mfj]    : [...FIT_DEFAULTS.brackets_mfj],
          brackets_hoh:    fc.brackets_hoh    ? [...fc.brackets_hoh]    : [...FIT_DEFAULTS.brackets_hoh]
        }
      }
    }
    cuentasContables.value = cuentasR.data?.cuentas || []
  } finally { cargando.value = false }
}
async function guardar() {
  guardando.value = true
  try {
    await api.put('/nomina/config-fiscal', { ...cfg.value, fit_config: fitCfg.value, empresa: empresa.value, anio: anio.value })
    saved.value = true; setTimeout(() => saved.value = false, 3000)
  } finally { guardando.value = false }
}
onMounted(cargar)
</script>
<style scoped>
.nom-wrap { display: flex; flex-direction: column; gap: 16px; }
.nom-header { display: flex; align-items: center; gap: 14px; background: linear-gradient(135deg,#0f172a,#1e3a5f); border-radius: 14px; padding: 20px 24px; }
.nom-header-icon { width: 42px; height: 42px; border-radius: 10px; background: rgba(6,182,212,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nom-title { font-size: 17px; font-weight: 800; color: #fff; margin: 0; }
.nom-sub   { font-size: 12px; color: rgba(255,255,255,0.45); margin: 0; }
.drw-select-full { width: 100%; height: 36px; }
.flex-1 { flex: 1; }
.nom-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),0.07); border-radius: 14px; }
.pa-6 { padding: 24px; }
.nom-loading { display: flex; justify-content: center; padding: 32px; }
.cfg-section { margin-bottom: 24px; }
.cfg-section-title { font-size: 10px; font-weight: 800; letter-spacing: 1px; color: rgba(var(--v-theme-on-surface),0.45); text-transform: uppercase; padding-bottom: 8px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.07); margin-bottom: 14px; }
.cfg-info { display: flex; align-items: center; gap: 6px; font-size: 11px; color: rgba(var(--v-theme-on-surface),0.55); background: rgba(var(--v-theme-on-surface),0.03); border-radius: 8px; padding: 8px 12px; margin-bottom: 12px; }
.cfg-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr)); gap: 12px; }
.cfg-item { display: flex; flex-direction: column; gap: 4px; }
.cfg-item label { font-size: 11px; font-weight: 700; color: rgba(var(--v-theme-on-surface),0.65); }
.cfg-hint { font-size: 10px; color: rgba(var(--v-theme-on-surface),0.35); }
.drw-input { height: 34px; padding: 0 10px; border-radius: 7px; border: 1px solid rgba(var(--v-theme-on-surface),0.15); background: rgba(var(--v-theme-on-surface),0.03); color: rgb(var(--v-theme-on-surface)); font-size: 13px; outline: none; width: 100%; }
.drw-input:focus { border-color: #06b6d4; }
.drw-select { height: 34px; padding: 0 8px; border-radius: 7px; border: 1px solid rgba(var(--v-theme-on-surface),0.15); background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); font-size: 13px; outline: none; }
.fit-sub-title { font-size:10px; font-weight:800; letter-spacing:.8px; text-transform:uppercase; color:rgba(var(--v-theme-on-surface),0.5); margin-bottom:8px; }
.fit-brackets-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:20px; }
.fit-bracket-col { display:flex; flex-direction:column; }
.fit-br-table { border:1px solid rgba(var(--v-theme-on-surface),0.1); border-radius:8px; overflow:hidden; }
.fit-br-head { display:grid; grid-template-columns:56px 1fr; gap:8px; padding:6px 10px; background:rgba(var(--v-theme-on-surface),0.04); font-size:10px; font-weight:700; color:rgba(var(--v-theme-on-surface),0.45); text-transform:uppercase; letter-spacing:.5px; }
.fit-br-row { display:grid; grid-template-columns:56px 1fr; gap:8px; align-items:center; padding:5px 10px; border-top:1px solid rgba(var(--v-theme-on-surface),0.06); }
.fit-br-last { background:rgba(var(--v-theme-on-surface),0.02); }
.fit-rate { font-size:11px; font-weight:800; color:#6366f1; font-family:monospace; }
.fit-br-input { max-width:130px !important; height:28px !important; font-size:12px !important; }
.fit-br-inf { font-size:11px; color:rgba(var(--v-theme-on-surface),0.35); font-style:italic; }
</style>
