<template>
  <MainLayout>
    <div class="view-container">
      <PageHeader
        title="Movimientos Bancarios"
        description="Registro y control de movimientos bancarios por cuenta"
        :crumbs="['Tesorería', 'Procesos', 'Movimientos Bancarios']"
      >
        <template #actions>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="abrirFormulario"
            :disabled="!store.bancoSeleccionado"
          >
            Nuevo Movimiento
          </v-btn>
        </template>
      </PageHeader>

      <!-- SELECTOR DE CUENTA -->
      <div class="cuenta-selector-wrap">
        <div class="cuenta-selector-label">
          <v-icon size="16">mdi-bank-outline</v-icon>
          Cuenta Bancaria
        </div>
        <v-select
          v-model="store.bancoSeleccionado"
          :items="store.cuentasBancarias"
          item-title="nombre_cta"
          item-value="codigo"
          placeholder="Selecciona una cuenta bancaria..."
          hide-details
          density="compact"
          variant="outlined"
          class="cuenta-select"
          @update:model-value="onCuentaChange"
        />
      </div>

      <!-- KPI CARDS -->
      <div class="kpi-grid">
        <KpiCard :index="0" label="Total Movimientos" :value="String(store.totalMovimientos)" icon="mdi-format-list-numbered" color="var(--indigo)" hint="en la cuenta seleccionada" />
        <KpiCard :index="1" label="Total Ingresos" :value="formatMoneda(store.totalIngresos)" icon="mdi-arrow-down-circle-outline" color="var(--success)" :hint="`${store.movimientosIngresos.length} transacciones`" />
        <KpiCard :index="2" label="Total Egresos" :value="formatMoneda(store.totalEgresos)" icon="mdi-arrow-up-circle-outline" color="var(--gold)" :hint="`${store.movimientosEgresos.length} transacciones`" />
        <KpiCard
          :index="3"
          label="Saldo Neto"
          :value="formatMoneda(store.saldoNeto)"
          icon="mdi-scale-balance"
          :color="store.saldoNeto >= 0 ? 'var(--success)' : 'var(--error)'"
          :value-color="store.saldoNeto >= 0 ? 'var(--success)' : 'var(--error)'"
          hint="ingresos - egresos"
        />
      </div>

      <!-- FILTROS -->
      <div class="filtros-bar">
        <div class="tipo-tabs">
          <button
            v-for="tab in tipoTabs"
            :key="tab.value"
            class="tipo-tab"
            :class="{ active: store.filtros.tipo === tab.value }"
            @click="store.setFiltros({ tipo: tab.value })"
          >
            <v-icon size="14">{{ tab.icon }}</v-icon>
            {{ tab.label }}
          </button>
        </div>
        <div class="search-bar">
          <v-icon size="16" class="search-icon">mdi-magnify</v-icon>
          <input
            v-model="store.filtros.busqueda"
            type="text"
            placeholder="Buscar por concepto, beneficiario o número..."
            class="search-input"
          />
          <v-icon
            v-if="store.filtros.busqueda"
            size="16"
            class="clear-icon"
            @click="store.setFiltros({ busqueda: '' })"
          >mdi-close</v-icon>
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="store.loading" class="loading-wrap">
        <v-progress-circular indeterminate color="primary" size="40" />
        <p class="loading-text">Cargando movimientos...</p>
      </div>

      <!-- EMPTY STATE -->
      <div v-else-if="!store.bancoSeleccionado" class="empty-state">
        <v-icon size="48" class="empty-icon">mdi-bank-outline</v-icon>
        <p class="empty-title">Selecciona una cuenta bancaria</p>
        <p class="empty-sub">Elige una cuenta del selector para ver sus movimientos</p>
      </div>

      <!-- TABLA -->
      <div v-else class="tabla-container">
        <div class="tabla-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-numero">NÚMERO</th>
                <th class="col-fecha">FECHA</th>
                <th class="col-beneficiario">BENEFICIARIO</th>
                <th class="col-concepto">CONCEPTO</th>
                <th class="col-cheque">CHEQUE/REF</th>
                <th class="col-ingreso">INGRESO</th>
                <th class="col-egreso">EGRESO</th>
                <th class="col-conciliado">CONCILIADO</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="store.movimientosFiltrados.length === 0">
                <td colspan="8" class="tabla-empty">
                  <v-icon size="32" class="empty-icon-sm">mdi-inbox-outline</v-icon>
                  <p class="empty-text">No hay movimientos para mostrar</p>
                </td>
              </tr>
              <tr
                v-for="mov in store.movimientosFiltrados"
                :key="mov.numero"
                class="tabla-row"
              >
                <td class="col-numero">
                  <span class="numero-badge">{{ mov.numero }}</span>
                </td>
                <td class="col-fecha">{{ formatFecha(mov.fecha) }}</td>
                <td class="col-beneficiario">{{ mov.beneficia || '-' }}</td>
                <td class="col-concepto">{{ mov.concepto || '-' }}</td>
                <td class="col-cheque">{{ mov.cheque || '-' }}</td>
                <td class="col-ingreso">
                  <span v-if="parseFloat(mov.ingreso) > 0" class="ingreso-text">
                    {{ formatMoneda(mov.ingreso) }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td class="col-egreso">
                  <span v-if="parseFloat(mov.egreso) > 0" class="egreso-text">
                    {{ formatMoneda(mov.egreso) }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td class="col-conciliado">
                  <v-chip
                    :color="mov.conciliado === 'SI' ? 'success' : 'default'"
                    variant="flat"
                    size="x-small"
                  >
                    {{ mov.conciliado === 'SI' ? 'SI' : 'NO' }}
                  </v-chip>
                </td>
              </tr>
              <!-- FOOTER TOTALES -->
              <tr v-if="store.movimientosFiltrados.length > 0" class="tabla-footer">
                <td colspan="6" class="footer-label">TOTALES</td>
                <td class="col-ingreso">
                  <span class="total-text ingreso-text">
                    {{ formatMoneda(totalFiltradoIngresos) }}
                  </span>
                </td>
                <td class="col-egreso">
                  <span class="total-text egreso-text">
                    {{ formatMoneda(totalFiltradoEgresos) }}
                  </span>
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ERROR -->
      <v-alert
        v-if="store.error"
        type="error"
        closable
        class="mt-4"
        @click:close="store.clearError()"
      >
        {{ store.error }}
      </v-alert>
    </div>

    <!-- MODAL NUEVO MOVIMIENTO -->
    <v-dialog v-model="dialogOpen" max-width="580">
      <v-card class="form-card">
        <div class="form-header">
          <div class="form-header-left">
            <div class="form-header-icon">
              <v-icon size="18" color="white">mdi-bank-plus</v-icon>
            </div>
            <span class="form-title">NUEVO MOVIMIENTO</span>
          </div>
          <v-btn icon size="small" variant="text" @click="cerrarFormulario">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="form-body">
          <!-- Número (Auto) + Fecha -->
          <div class="form-row">
            <div class="form-field">
              <label class="field-label">NÚMERO</label>
              <div class="numero-auto">
                <v-icon size="14">mdi-auto-fix</v-icon>
                <span>Auto generado</span>
              </div>
            </div>
            <div class="form-field">
              <label class="field-label">FECHA <span class="req">*</span></label>
              <input
                v-model="form.fecha"
                type="date"
                class="field-input"
                :class="{ error: formErrors.fecha }"
              />
              <span v-if="formErrors.fecha" class="field-error">{{ formErrors.fecha }}</span>
            </div>
          </div>

          <!-- Tipo de movimiento -->
          <div class="form-row">
            <div class="form-field full-width">
              <label class="field-label">TIPO DE MOVIMIENTO <span class="req">*</span></label>
              <div class="tipo-selector">
                <button
                  v-for="t in tiposMovimiento"
                  :key="t.value"
                  class="tipo-btn"
                  :class="{ active: form.tipo === t.value, [t.css]: true }"
                  @click="form.tipo = t.value"
                  type="button"
                >
                  <v-icon size="16">{{ t.icon }}</v-icon>
                  {{ t.label }}
                </button>
              </div>
              <span v-if="formErrors.tipo" class="field-error">{{ formErrors.tipo }}</span>
            </div>
          </div>

          <!-- Concepto -->
          <div class="form-row">
            <div class="form-field full-width">
              <label class="field-label">CONCEPTO <span class="req">*</span></label>
              <input
                v-model="form.concepto"
                type="text"
                class="field-input"
                :class="{ error: formErrors.concepto }"
                placeholder="Descripción del movimiento"
                @input="toUpperCaseField('concepto')"
              />
              <span v-if="formErrors.concepto" class="field-error">{{ formErrors.concepto }}</span>
            </div>
          </div>

          <!-- Cheque / Ref + Monto -->
          <div class="form-row">
            <div class="form-field">
              <label class="field-label">CHEQUE / REFERENCIA</label>
              <input
                v-model="form.cheque"
                type="text"
                class="field-input"
                placeholder="Nro. cheque o referencia"
                @input="toUpperCaseField('cheque')"
              />
            </div>
            <div class="form-field">
              <label class="field-label">MONTO <span class="req">*</span></label>
              <input
                v-model="form.monto"
                type="number"
                min="0"
                step="0.01"
                class="field-input"
                :class="{ error: formErrors.monto }"
                placeholder="0.00"
              />
              <span v-if="formErrors.monto" class="field-error">{{ formErrors.monto }}</span>
            </div>
          </div>

          <!-- Cuenta Destino (solo si TRANSFERENCIA) -->
          <div v-if="form.tipo === 'TRA'" class="form-row">
            <div class="form-field full-width">
              <label class="field-label">CUENTA DESTINO <span class="req">*</span></label>
              <v-select
                v-model="form.banco_destino"
                :items="store.cuentasBancarias"
                item-title="nombre_cta"
                item-value="codigo"
                placeholder="Selecciona la cuenta destino..."
                hide-details
                density="compact"
                variant="outlined"
                :rules="form.tipo === 'TRA' ? [v => v || 'Requerido para transferencia'] : []"
              />
              <span v-if="formErrors.banco_destino" class="field-error">{{ formErrors.banco_destino }}</span>
            </div>
          </div>

          <!-- Info tipo -->
          <div v-if="form.tipo" class="tipo-info">
            <v-icon size="14" :color="getTipoColor(form.tipo)">mdi-information-outline</v-icon>
            <span>
              {{ form.tipo === 'ING' ? 'El monto se registrará como INGRESO (+)' :
                 form.tipo === 'EGR' ? 'El monto se registrará como EGRESO (-)' :
                 form.tipo === 'TRA' ? 'Se creará un egreso en esta cuenta y un ingreso en la cuenta destino' : '' }}
            </span>
          </div>
        </div>

        <div class="form-footer">
          <v-btn variant="text" @click="cerrarFormulario" :disabled="guardando">
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            @click="guardarMovimiento"
            :loading="guardando"
            prepend-icon="mdi-content-save"
          >
            Guardar
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import KpiCard from '../../components/common/KpiCard.vue'
import { useMovimientosBancariosStore } from '../../stores/movimientos-bancarios'
import { formatMoneda, formatFecha } from '../../utils/formatters'

const store = useMovimientosBancariosStore()

// ─── Tabs de tipo ────────────────────────────────────────────────
const tipoTabs = [
  { value: 'TODOS', label: 'Todos',         icon: 'mdi-view-list' },
  { value: 'ING',   label: 'Ingresos',      icon: 'mdi-arrow-down-circle-outline' },
  { value: 'EGR',   label: 'Egresos',       icon: 'mdi-arrow-up-circle-outline' },
  { value: 'TRA',   label: 'Transferencias',icon: 'mdi-swap-horizontal' },
]

const tiposMovimiento = [
  { value: 'ING', label: 'INGRESO',       icon: 'mdi-arrow-down-circle-outline', css: 'btn-green' },
  { value: 'EGR', label: 'EGRESO',        icon: 'mdi-arrow-up-circle-outline',   css: 'btn-amber' },
  { value: 'TRA', label: 'TRANSFERENCIA', icon: 'mdi-swap-horizontal',           css: 'btn-cyan'  },
]

function getTipoLabel(tipo) {
  const map = { ING: 'INGRESO', EGR: 'EGRESO', TRA: 'TRANSF.' }
  return map[tipo] || tipo
}

function getTipoColor(tipo) {
  const map = { ING: 'success', EGR: 'warning', TRA: 'info' }
  return map[tipo] || 'default'
}

// ─── Totales filtrados ───────────────────────────────────────────
const totalFiltradoIngresos = computed(() =>
  store.movimientosFiltrados.reduce((sum, m) => sum + parseFloat(m.ingreso || 0), 0)
)
const totalFiltradoEgresos = computed(() =>
  store.movimientosFiltrados.reduce((sum, m) => sum + parseFloat(m.egreso || 0), 0)
)

// ─── Cambio de cuenta ────────────────────────────────────────────
async function onCuentaChange(codigo) {
  store.setBanco(codigo)
  if (codigo) await store.fetchMovimientos()
}

// ─── Modal ───────────────────────────────────────────────────────
const dialogOpen = ref(false)
const guardando  = ref(false)
const formErrors = ref({})

const todayISO = new Date().toISOString().slice(0, 10)

const form = ref({
  tipo:          'ING',
  fecha:         todayISO,
  concepto:      '',
  cheque:        '',
  monto:         '',
  banco_destino: null,
})

// Convertir campos de texto a mayúsculas
function toUpperCaseField(field) {
  if (form.value[field] && typeof form.value[field] === 'string') {
    form.value[field] = form.value[field].toUpperCase()
  }
}

function abrirFormulario() {
  formErrors.value = {}
  form.value = {
    tipo:          'ING',
    fecha:         todayISO,
    concepto:      '',
    cheque:        '',
    monto:         '',
    banco_destino: null,
  }
  dialogOpen.value = true
}

function cerrarFormulario() {
  dialogOpen.value = false
}

function validarForm() {
  const errs = {}
  if (!form.value.fecha)             errs.fecha     = 'La fecha es requerida'
  if (!form.value.tipo)              errs.tipo      = 'El tipo es requerido'
  if (!form.value.concepto?.trim())  errs.concepto  = 'El concepto es requerido'
  const monto = parseFloat(form.value.monto)
  if (!form.value.monto || isNaN(monto) || monto <= 0) errs.monto = 'El monto debe ser mayor a 0'
  if (form.value.tipo === 'TRA' && !form.value.banco_destino) errs.banco_destino = 'La cuenta destino es requerida'
  formErrors.value = errs
  return Object.keys(errs).length === 0
}

async function guardarMovimiento() {
  if (!validarForm()) return
  guardando.value = true
  try {
    const monto = parseFloat(form.value.monto)
    const datos = {
      tipo:          form.value.tipo,
      fecha:         form.value.fecha,
      concepto:      form.value.concepto.trim().toUpperCase(),
      cheque:        (form.value.cheque?.trim() || '').toUpperCase(),
      ingreso:       form.value.tipo === 'ING' ? monto : 0,
      egreso:        form.value.tipo === 'EGR' || form.value.tipo === 'TRA' ? monto : 0,
      banco:         store.bancoSeleccionado,
    }
    if (form.value.tipo === 'TRA') {
      datos.banco_destino = form.value.banco_destino
    }
    await store.crearMovimiento(datos)
    dialogOpen.value = false
  } catch (err) {
    console.error('Error guardando movimiento:', err)
  } finally {
    guardando.value = false
  }
}

// ─── Inicialización ──────────────────────────────────────────────
onMounted(async () => {
  await store.fetchCuentasBancarias()
  if (store.bancoSeleccionado) await store.fetchMovimientos()
})
</script>

<style scoped>
.view-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* ── Filtros ── */
.filtros-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.tipo-tabs { display: flex; gap: 4px; }
.tipo-tab {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 8px; border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  font-size: 12px; font-weight: 600; cursor: pointer;
  background: transparent; color: rgba(var(--v-theme-on-surface), 0.6);
  transition: all 0.15s;
}
.tipo-tab:hover { background: rgba(var(--v-theme-on-surface), 0.04); }
.tipo-tab.active { background: var(--indigo); border-color: var(--indigo); color: #fff; }

.search-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; flex: 1; min-width: 260px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-radius: 8px; border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.search-icon { color: rgba(var(--v-theme-on-surface), 0.4); }
.search-input {
  flex: 1; border: none; background: transparent; outline: none;
  font-size: 13px; color: rgb(var(--v-theme-on-surface));
}
.search-input::placeholder { color: rgba(var(--v-theme-on-surface), 0.4); }
.clear-icon { cursor: pointer; color: rgba(var(--v-theme-on-surface), 0.4); }
.clear-icon:hover { color: rgba(var(--v-theme-on-surface), 0.7); }

/* ── Loading / Empty ── */
.loading-wrap { text-align: center; padding: 60px; }
.loading-text { color: rgba(var(--v-theme-on-surface), 0.5); font-size: 13px; margin-top: 12px; }
.empty-state {
  text-align: center; padding: 80px 24px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
}
.empty-icon { color: rgba(var(--v-theme-on-surface), 0.15); display: block; margin: 0 auto 12px; }
.empty-title { font-size: 16px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); margin: 0 0 4px; }
.empty-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.4); margin: 0; }

/* ── Tabla ── */
.tabla-container {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px; overflow: hidden;
}
.tabla-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table thead { background: rgba(var(--v-theme-on-surface), 0.04); }
.data-table thead th {
  padding: 12px 10px; text-align: left; font-weight: 700;
  font-size: 11px; letter-spacing: 0.5px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.6);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  white-space: nowrap;
}
.data-table tbody tr { border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); }
.data-table tbody tr:hover { background: rgba(var(--v-theme-on-surface), 0.02); }
.data-table tbody td { padding: 11px 10px; color: rgb(var(--v-theme-on-surface)); }
.tabla-footer {
  background: rgba(var(--v-theme-on-surface), 0.06);
  font-weight: 700; border-top: 2px solid rgba(var(--v-theme-on-surface), 0.1);
  border-bottom: none !important;
}
.tabla-footer td { padding: 14px 10px !important; }

.col-numero       { width: 120px; }
.col-fecha        { width: 90px; white-space: nowrap; }
.col-beneficiario { width: 20%; }
.col-concepto     { width: 28%; }
.col-cheque       { width: 110px; }
.col-ingreso      { width: 110px; text-align: right !important; }
.col-egreso       { width: 110px; text-align: right !important; }
.col-conciliado   { width: 100px; text-align: center !important; }

.numero-badge {
  background: var(--indigo-wash); color: var(--indigo);
  padding: 3px 8px; border-radius: 6px; font-weight: 600; font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.tipo-chip { text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; font-size: 10px !important; }
.ingreso-text { color: var(--success); font-weight: 600; font-variant-numeric: tabular-nums; }
.egreso-text  { color: var(--gold); font-weight: 600; font-variant-numeric: tabular-nums; }
.total-text   { font-variant-numeric: tabular-nums; font-weight: 700; }
.text-muted   { color: rgba(var(--v-theme-on-surface), 0.3); }
.footer-label { text-align: right; padding-right: 10px !important; font-weight: 700; font-size: 11px; letter-spacing: 0.5px; text-transform: uppercase; }

.tabla-empty { text-align: center !important; padding: 48px !important; }
.empty-icon-sm { color: rgba(var(--v-theme-on-surface), 0.2); display: block; margin: 0 auto 8px; }
.empty-text { color: rgba(var(--v-theme-on-surface), 0.4); font-size: 14px; margin: 0; }

/* ── Modal Form ── */
.form-card {
  border-radius: 16px !important;
  overflow: hidden;
}
.form-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, var(--indigo), var(--indigo));
}
.form-header-left { display: flex; align-items: center; gap: 10px; }
.form-header-icon {
  width: 32px; height: 32px; border-radius: 8px;
  background: rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
}
.form-title { font-size: 14px; font-weight: 700; letter-spacing: 0.5px; color: #fff; }

.form-body { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
.form-row { display: flex; gap: 12px; }
.form-field { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.form-field.full-width { flex: 0 0 100%; }

.field-label {
  font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
  text-transform: uppercase; color: rgba(var(--v-theme-on-surface), 0.6);
}
.req { color: var(--error); }
.field-input {
  padding: 9px 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.15);
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;
  text-transform: uppercase;
}
.field-input:focus { border-color: var(--indigo); }
.field-input.error { border-color: var(--error); }
.field-input.readonly { background: rgba(var(--v-theme-on-surface), 0.06); color: rgba(var(--v-theme-on-surface), 0.5); cursor: default; }
.field-error { font-size: 11px; color: var(--error); }

/* Tipo selector */
.tipo-selector { display: flex; gap: 8px; }
.tipo-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px 12px; border-radius: 8px; font-size: 12px; font-weight: 700;
  cursor: pointer; border: 2px solid rgba(var(--v-theme-on-surface), 0.12);
  background: transparent; color: rgba(var(--v-theme-on-surface), 0.6);
  transition: all 0.15s; letter-spacing: 0.5px;
}
.tipo-btn:hover { background: rgba(var(--v-theme-on-surface), 0.04); }
.tipo-btn.btn-green.active { background: var(--success); border-color: var(--success); color: #fff; }
.tipo-btn.btn-amber.active { background: var(--gold); border-color: var(--gold); color: #fff; }
.tipo-btn.btn-cyan.active  { background: var(--indigo); border-color: var(--indigo); color: #fff; }

/* Info tipo */
.tipo-info {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.6);
}

/* Número Auto */
.numero-auto {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 12px;
  border-radius: 8px;
  background: var(--indigo-wash);
  border: 1px solid var(--indigo-wash);
  font-size: 12px;
  color: var(--indigo);
  font-weight: 600;
}

.form-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
</style>