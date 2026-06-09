<template>
  <v-dialog v-model="show" max-width="320" :scrim="false"
    style="align-items:flex-start; justify-content:flex-end"
    content-class="calc-dialog">
    <v-card rounded="xl" elevation="16" class="calc-card" @keydown.stop>

      <!-- Header -->
      <div class="calc-header">
        <div class="calc-header-left">
          <v-icon size="15" color="#f59e0b">mdi-calculator-variant-outline</v-icon>
          <span>Calculadora</span>
        </div>
        <div style="display:flex;align-items:center;gap:4px">
          <span class="calc-f12-hint">F12</span>
          <v-btn icon size="x-small" variant="text" color="rgba(255,255,255,.5)" @click="show=false">
            <v-icon size="14">mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- Tabs -->
      <div class="calc-tabs">
        <button class="calc-tab" :class="{ active: tab==='calc' }" @click="tab='calc'">
          <v-icon size="13" class="mr-1">mdi-calculator</v-icon>Calculadora
        </button>
        <button class="calc-tab" :class="{ active: tab==='conv' }" @click="tab='conv'">
          <v-icon size="13" class="mr-1">mdi-swap-horizontal</v-icon>Conversor
        </button>
      </div>

      <!-- ══ CALCULADORA ══ -->
      <div v-if="tab==='calc'" class="calc-body">

        <!-- Display -->
        <div class="calc-display">
          <div class="calc-expr">{{ expression || '&nbsp;' }}</div>
          <div class="calc-value">{{ display }}</div>
        </div>

        <!-- Botones -->
        <div class="calc-grid">
          <!-- Fila 1 -->
          <button class="cb cb-fn" @click="clear">C</button>
          <button class="cb cb-fn" @click="toggleSign">±</button>
          <button class="cb cb-fn" @click="inputPercent">%</button>
          <button class="cb cb-op" @click="inputOperator('÷')">÷</button>
          <!-- Fila 2 -->
          <button class="cb" @click="inputDigit(7)">7</button>
          <button class="cb" @click="inputDigit(8)">8</button>
          <button class="cb" @click="inputDigit(9)">9</button>
          <button class="cb cb-op" @click="inputOperator('×')">×</button>
          <!-- Fila 3 -->
          <button class="cb" @click="inputDigit(4)">4</button>
          <button class="cb" @click="inputDigit(5)">5</button>
          <button class="cb" @click="inputDigit(6)">6</button>
          <button class="cb cb-op" @click="inputOperator('-')">−</button>
          <!-- Fila 4 -->
          <button class="cb" @click="inputDigit(1)">1</button>
          <button class="cb" @click="inputDigit(2)">2</button>
          <button class="cb" @click="inputDigit(3)">3</button>
          <button class="cb cb-op" @click="inputOperator('+')">+</button>
          <!-- Fila 5 -->
          <button class="cb cb-zero" @click="inputDigit(0)">0</button>
          <button class="cb" @click="inputDecimal">.</button>
          <button class="cb cb-backspace" @click="backspace">
            <v-icon size="16">mdi-backspace-outline</v-icon>
          </button>
          <button class="cb cb-eq" @click="equals">=</button>
        </div>

        <!-- Botón Aceptar -->
        <button class="calc-aceptar" @click="aceptar">
          <v-icon size="15" class="mr-1">mdi-check</v-icon>
          Insertar {{ fmtResult(calcResult) }} en campo
        </button>

      </div>

      <!-- ══ CONVERSOR ══ -->
      <div v-else class="calc-body">

        <!-- Categoría -->
        <div class="conv-cats">
          <button v-for="c in categorias" :key="c.key"
            class="conv-cat-btn" :class="{ active: categoria===c.key }"
            @click="categoria=c.key; resetConv()">
            <v-icon size="13">{{ c.icon }}</v-icon>
            <span>{{ c.label }}</span>
          </button>
        </div>

        <!-- Precio especial -->
        <template v-if="categoria==='precio'">
          <div class="conv-precio">
            <div class="conv-row">
              <label>Cantidad</label>
              <input v-model.number="precioCant" type="number" min="0" step="any" class="conv-input" @input="calcPrecio" />
            </div>
            <div class="conv-row">
              <label>Precio unitario</label>
              <input v-model.number="precioUnit" type="number" min="0" step="any" class="conv-input" @input="calcPrecio" />
            </div>
            <div class="conv-divider"></div>
            <div class="conv-row conv-result-row">
              <label>Total</label>
              <div class="conv-result-val">{{ fmtResult(precioTotal) }}</div>
            </div>
          </div>
        </template>

        <!-- Conversor genérico -->
        <template v-else>
          <div class="conv-generic">
            <div class="conv-row">
              <input v-model.number="convFrom" type="number" step="any" class="conv-input" @input="doConvert" />
              <select v-model="convUnitFrom" class="conv-select" @change="doConvert">
                <option v-for="u in unitsOf(categoria)" :key="u.key" :value="u.key">{{ u.label }}</option>
              </select>
            </div>
            <div class="conv-swap-row">
              <div class="conv-arrow">↓</div>
              <button class="conv-swap-btn" @click="swapUnits">
                <v-icon size="14">mdi-swap-vertical</v-icon>
              </button>
            </div>
            <div class="conv-row">
              <input :value="fmtConv(convResult)" readonly class="conv-input conv-input-result" />
              <select v-model="convUnitTo" class="conv-select" @change="doConvert">
                <option v-for="u in unitsOf(categoria)" :key="u.key" :value="u.key">{{ u.label }}</option>
              </select>
            </div>
          </div>
        </template>

        <!-- Aceptar -->
        <button class="calc-aceptar" @click="aceptarConv">
          <v-icon size="15" class="mr-1">mdi-check</v-icon>
          Insertar en campo
        </button>

      </div>

    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// ── Visibilidad ──────────────────────────────────────────────────
const show = ref(false)
const tab  = ref('calc')

// ── Campo enfocado (set desde App.vue) ───────────────────────────
const focusedEl = ref(null)

function open(el) {
  focusedEl.value = el
  show.value = true
}

// ── CALCULADORA ──────────────────────────────────────────────────
const display    = ref('0')
const expression = ref('')
const prevValue  = ref(null)
const lastOp     = ref('')
const waiting    = ref(false)
const hasDecimal = ref(false)
const calcResult = ref(0)

function fmt(n) {
  if (n === null || isNaN(n)) return '0'
  const s = parseFloat(n.toFixed(10)).toString()
  return s.length > 12 ? parseFloat(n.toPrecision(8)).toString() : s
}

function inputDigit(d) {
  if (waiting.value) {
    display.value = String(d); waiting.value = false; hasDecimal.value = false
  } else {
    display.value = display.value === '0' ? String(d) : display.value + String(d)
  }
  calcResult.value = parseFloat(display.value) || 0
}

function inputDecimal() {
  if (waiting.value) { display.value = '0.'; waiting.value = false; hasDecimal.value = true; return }
  if (!hasDecimal.value) { display.value += '.'; hasDecimal.value = true }
}

function backspace() {
  if (waiting.value) return
  display.value = display.value.length > 1 ? display.value.slice(0, -1) : '0'
  if (!display.value.includes('.')) hasDecimal.value = false
  calcResult.value = parseFloat(display.value) || 0
}

function clear() {
  display.value = '0'; expression.value = ''; prevValue.value = null
  lastOp.value = ''; waiting.value = false; hasDecimal.value = false; calcResult.value = 0
}

function toggleSign() {
  const v = parseFloat(display.value)
  if (v !== 0) { display.value = fmt(-v); calcResult.value = -v }
}

function inputPercent() {
  const v = parseFloat(display.value) / 100
  display.value = fmt(v); calcResult.value = v
}

function calc(a, b, op) {
  if (op === '+') return a + b
  if (op === '-') return a - b
  if (op === '×') return a * b
  if (op === '÷') return b !== 0 ? a / b : 0
  return b
}

function inputOperator(op) {
  const cur = parseFloat(display.value) || 0
  if (prevValue.value !== null && !waiting.value) {
    const res = calc(prevValue.value, cur, lastOp.value)
    display.value = fmt(res); calcResult.value = res; prevValue.value = res
    expression.value = fmt(res) + ' ' + op + ' '
  } else {
    prevValue.value = cur
    expression.value = fmt(cur) + ' ' + op + ' '
  }
  lastOp.value = op; waiting.value = true; hasDecimal.value = false
}

function equals() {
  const cur = parseFloat(display.value) || 0
  if (prevValue.value !== null && lastOp.value) {
    const res = calc(prevValue.value, cur, lastOp.value)
    expression.value = expression.value + fmt(cur) + ' ='
    display.value = fmt(res); calcResult.value = res
    prevValue.value = null; lastOp.value = ''; waiting.value = true; hasDecimal.value = false
  }
}

function fmtResult(v) {
  if (v === null || v === undefined || v === '' || isNaN(v)) return '—'
  return parseFloat(v.toFixed(6)).toLocaleString('es-CO', { maximumFractionDigits: 6 })
}

// ── CONVERSOR ───────────────────────────────────────────────────
const categoria   = ref('peso')
const convFrom    = ref(1)
const convResult  = ref(null)
const convUnitFrom = ref('kg')
const convUnitTo   = ref('lb')

// Precio
const precioCant  = ref(1)
const precioUnit  = ref(0)
const precioTotal = ref(0)
function calcPrecio() { precioTotal.value = (precioCant.value || 0) * (precioUnit.value || 0) }

const categorias = [
  { key: 'precio',   label: 'Precio',   icon: 'mdi-currency-usd' },
  { key: 'peso',     label: 'Peso',     icon: 'mdi-weight-kilogram' },
  { key: 'volumen',  label: 'Volumen',  icon: 'mdi-cup-water' },
  { key: 'longitud', label: 'Longitud', icon: 'mdi-ruler' },
  { key: 'temp',     label: 'Temp',     icon: 'mdi-thermometer' },
]

const units = {
  peso: [
    { key: 'kg', label: 'Kilogramo (kg)',  toBase: 1 },
    { key: 'g',  label: 'Gramo (g)',       toBase: 0.001 },
    { key: 'mg', label: 'Miligramo (mg)',  toBase: 0.000001 },
    { key: 'lb', label: 'Libra (lb)',      toBase: 0.453592 },
    { key: 'oz', label: 'Onza (oz)',       toBase: 0.0283495 },
    { key: 't',  label: 'Tonelada (t)',    toBase: 1000 },
  ],
  volumen: [
    { key: 'l',   label: 'Litro (L)',         toBase: 1 },
    { key: 'ml',  label: 'Mililitro (mL)',     toBase: 0.001 },
    { key: 'gal', label: 'Galón (gal)',        toBase: 3.78541 },
    { key: 'qt',  label: 'Cuarto (qt)',        toBase: 0.946353 },
    { key: 'fl',  label: 'Onza fl (fl oz)',    toBase: 0.0295735 },
    { key: 'cc',  label: 'Centímetro³ (cc)',  toBase: 0.001 },
  ],
  longitud: [
    { key: 'm',  label: 'Metro (m)',        toBase: 1 },
    { key: 'cm', label: 'Centímetro (cm)', toBase: 0.01 },
    { key: 'mm', label: 'Milímetro (mm)', toBase: 0.001 },
    { key: 'km', label: 'Kilómetro (km)', toBase: 1000 },
    { key: 'ft', label: 'Pie (ft)',         toBase: 0.3048 },
    { key: 'in', label: 'Pulgada (in)',    toBase: 0.0254 },
    { key: 'yd', label: 'Yarda (yd)',       toBase: 0.9144 },
  ],
  temp: [
    { key: 'c', label: 'Celsius (°C)' },
    { key: 'f', label: 'Fahrenheit (°F)' },
    { key: 'k', label: 'Kelvin (K)' },
  ],
}

function unitsOf(cat) { return units[cat] || [] }

function doConvert() {
  const from = convUnitFrom.value
  const to   = convUnitTo.value
  const val  = convFrom.value || 0
  if (categoria.value === 'temp') {
    convResult.value = convertTemp(val, from, to)
  } else {
    const list   = unitsOf(categoria.value)
    const fromU  = list.find(u => u.key === from)
    const toU    = list.find(u => u.key === to)
    if (!fromU || !toU) return
    convResult.value = val * fromU.toBase / toU.toBase
  }
}

function convertTemp(v, from, to) {
  let c = from === 'c' ? v : from === 'f' ? (v-32)*5/9 : v-273.15
  return to === 'c' ? c : to === 'f' ? c*9/5+32 : c+273.15
}

function swapUnits() {
  const tmp = convUnitFrom.value
  convUnitFrom.value = convUnitTo.value
  convUnitTo.value = tmp
  doConvert()
}

function resetConv() {
  const list = unitsOf(categoria.value)
  convUnitFrom.value = list[0]?.key || ''
  convUnitTo.value   = list[1]?.key || ''
  convFrom.value = 1; convResult.value = null
  precioCant.value = 1; precioUnit.value = 0; precioTotal.value = 0
  doConvert()
}

function fmtConv(v) {
  if (v === null || v === undefined) return ''
  return parseFloat(v.toFixed(8)).toString()
}

watch(categoria, () => resetConv(), { immediate: false })

// ── Insertar en campo ─────────────────────────────────────────────
function insertarEnCampo(valor) {
  if (!focusedEl.value) return
  const el = focusedEl.value
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
  if (setter) setter.call(el, String(valor))
  el.dispatchEvent(new Event('input',  { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
  el.focus()
  show.value = false
}

function aceptar()     { insertarEnCampo(calcResult.value) }
function aceptarConv() {
  const v = categoria.value === 'precio' ? precioTotal.value : convResult.value
  insertarEnCampo(v ?? '')
}

// ── Exponer para App.vue ──────────────────────────────────────────
defineExpose({ open })
</script>

<style>
.calc-dialog { position: fixed !important; right: 24px !important; top: 72px !important; margin: 0 !important; }
.calc-dialog .v-overlay__content { margin: 0 !important; }
</style>

<style scoped>
.calc-card { background: #1a1a2e !important; border: 1px solid rgba(255,255,255,.1); user-select: none; width: 300px; }

/* Header */
.calc-header { display:flex; align-items:center; justify-content:space-between; padding:10px 12px 8px; border-bottom:1px solid rgba(255,255,255,.08); }
.calc-header-left { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:700; color:rgba(255,255,255,.7); text-transform:uppercase; letter-spacing:.8px; }
.calc-f12-hint { font-size:9px; background:rgba(245,158,11,.2); color:#f59e0b; border:1px solid rgba(245,158,11,.3); border-radius:3px; padding:1px 5px; font-weight:700; }

/* Tabs */
.calc-tabs { display:flex; border-bottom:1px solid rgba(255,255,255,.08); }
.calc-tab { flex:1; padding:8px; font-size:11px; font-weight:600; color:rgba(255,255,255,.4); background:none; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:.15s; }
.calc-tab:hover { color:rgba(255,255,255,.7); background:rgba(255,255,255,.04); }
.calc-tab.active { color:#f59e0b; border-bottom:2px solid #f59e0b; }

/* Body */
.calc-body { padding:12px; }

/* Display */
.calc-display { background:#0d0d1a; border-radius:10px; padding:12px 14px 10px; margin-bottom:10px; text-align:right; min-height:68px; }
.calc-expr { font-size:11px; color:rgba(255,255,255,.35); min-height:16px; font-family:monospace; }
.calc-value { font-size:28px; font-weight:300; color:white; font-family:'Courier New', monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

/* Grid botones */
.calc-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin-bottom:8px; }
.cb { border:none; border-radius:8px; height:52px; font-size:18px; font-weight:500; cursor:pointer; transition:.1s; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.08); color:white; }
.cb:hover { background:rgba(255,255,255,.16); }
.cb:active { transform:scale(.93); }
.cb-fn { background:rgba(255,255,255,.12); color:rgba(255,255,255,.7); font-size:16px; }
.cb-op { background:rgba(245,158,11,.25); color:#f59e0b; font-size:20px; }
.cb-op:hover { background:rgba(245,158,11,.4); }
.cb-eq { background:#f59e0b; color:#1a1a2e; font-size:22px; font-weight:700; }
.cb-eq:hover { background:#fbbf24; }
.cb-zero { grid-column: span 2; }
.cb-backspace { font-size:14px; }

/* Aceptar */
.calc-aceptar { width:100%; padding:10px; border:none; border-radius:8px; background:rgba(13,148,136,.25); color:#2dd4bf; font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px; transition:.15s; border:1px solid rgba(13,148,136,.3); }
.calc-aceptar:hover { background:rgba(13,148,136,.4); }

/* Conversor */
.conv-cats { display:flex; gap:4px; margin-bottom:12px; flex-wrap:wrap; }
.conv-cat-btn { flex:1; min-width:46px; padding:5px 2px; border:1px solid rgba(255,255,255,.1); border-radius:7px; background:rgba(255,255,255,.05); color:rgba(255,255,255,.5); font-size:10px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:2px; transition:.12s; }
.conv-cat-btn:hover { background:rgba(255,255,255,.1); color:white; }
.conv-cat-btn.active { background:rgba(245,158,11,.2); border-color:rgba(245,158,11,.5); color:#f59e0b; }

.conv-row { display:flex; align-items:center; gap:6px; margin-bottom:6px; }
.conv-row label { font-size:11px; color:rgba(255,255,255,.5); width:90px; flex-shrink:0; }
.conv-input { flex:1; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12); border-radius:7px; padding:7px 10px; color:white; font-size:14px; font-family:monospace; outline:none; min-width:0; }
.conv-input:focus { border-color:#f59e0b; }
.conv-input-result { background:rgba(13,148,136,.12); border-color:rgba(13,148,136,.3); color:#2dd4bf; }
.conv-select { background:#1a1a2e; border:1px solid rgba(255,255,255,.15); border-radius:7px; padding:7px 6px; color:white; font-size:11px; outline:none; flex-shrink:0; max-width:130px; }
.conv-swap-row { display:flex; align-items:center; gap:8px; margin:2px 0 4px; }
.conv-arrow { font-size:16px; color:rgba(255,255,255,.25); flex:1; text-align:center; }
.conv-swap-btn { background:rgba(245,158,11,.15); border:1px solid rgba(245,158,11,.25); border-radius:6px; padding:4px 10px; color:#f59e0b; cursor:pointer; font-size:12px; display:flex; align-items:center; }
.conv-swap-btn:hover { background:rgba(245,158,11,.3); }

.conv-precio { background:rgba(255,255,255,.03); border-radius:10px; padding:10px; }
.conv-divider { height:1px; background:rgba(255,255,255,.08); margin:8px 0; }
.conv-result-row label { color:rgba(255,255,255,.7); font-weight:700; }
.conv-result-val { font-size:20px; font-weight:700; color:#f59e0b; font-family:monospace; flex:1; text-align:right; }
.conv-generic { background:rgba(255,255,255,.03); border-radius:10px; padding:10px; }
</style>
