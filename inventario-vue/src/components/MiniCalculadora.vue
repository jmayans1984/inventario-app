<template>
  <Teleport to="body">
    <Transition name="calc-fade">
      <div v-if="show" class="mini-calc-wrap" @keydown.stop @keydown.esc="closeCalc()">

        <!-- Header -->
        <div class="calc-header">
          <div class="calc-header-left">
            <span class="material-symbols-outlined" style="font-size:15px;color:#f59e0b">calculate</span>
            Calculadora
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <span class="calc-f9-hint">F9</span>
            <button class="calc-close-btn" @click="closeCalc()">✕</button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="calc-tabs">
          <button class="calc-tab" :class="{ active: tab==='calc' }" @click="tab='calc'">
            🔢 Calculadora
          </button>
          <button class="calc-tab" :class="{ active: tab==='conv' }" @click="tab='conv'">
            ⇄ Conversor
          </button>
        </div>

        <!-- ══ CALCULADORA ══ -->
        <div v-if="tab==='calc'" class="calc-body">
          <div class="calc-display">
            <div class="calc-expr">{{ expression || ' ' }}</div>
            <div class="calc-value">{{ display }}</div>
          </div>

          <div class="calc-grid">
            <button class="cb cb-fn" @click="clear">C</button>
            <button class="cb cb-fn" @click="toggleSign">±</button>
            <button class="cb cb-fn" @click="inputPercent">%</button>
            <button class="cb cb-op" @click="inputOperator('÷')">÷</button>

            <button class="cb" @click="inputDigit(7)">7</button>
            <button class="cb" @click="inputDigit(8)">8</button>
            <button class="cb" @click="inputDigit(9)">9</button>
            <button class="cb cb-op" @click="inputOperator('×')">×</button>

            <button class="cb" @click="inputDigit(4)">4</button>
            <button class="cb" @click="inputDigit(5)">5</button>
            <button class="cb" @click="inputDigit(6)">6</button>
            <button class="cb cb-op" @click="inputOperator('-')">−</button>

            <button class="cb" @click="inputDigit(1)">1</button>
            <button class="cb" @click="inputDigit(2)">2</button>
            <button class="cb" @click="inputDigit(3)">3</button>
            <button class="cb cb-op" @click="inputOperator('+')">+</button>

            <button class="cb cb-zero" @click="inputDigit(0)">0</button>
            <button class="cb" @click="inputDecimal">.</button>
            <button class="cb" @click="backspace">⌫</button>
            <button class="cb cb-eq" @click="equals">=</button>
          </div>

          <button class="calc-aceptar" @click="aceptar">
            ✓ Insertar {{ fmtResult(calcResult) }} en campo
          </button>
        </div>

        <!-- ══ CONVERSOR ══ -->
        <div v-else class="calc-body">
          <div class="conv-cats">
            <button v-for="c in categorias" :key="c.key"
              class="conv-cat-btn" :class="{ active: categoria===c.key }"
              @click="selectCategoria(c.key)">
              <span>{{ c.icon }}</span>
              <span>{{ c.label }}</span>
            </button>
          </div>

          <template v-if="categoria==='precio'">
            <div class="conv-precio">
              <div class="conv-row">
                <label>Cantidad</label>
                <input v-model.number="precioCant" type="number" min="0" step="any"
                  class="conv-input" @input="calcPrecio" />
              </div>
              <div class="conv-row">
                <label>Precio unit.</label>
                <input v-model.number="precioUnit" type="number" min="0" step="any"
                  class="conv-input" @input="calcPrecio" />
              </div>
              <div class="conv-divider"></div>
              <div class="conv-row">
                <label style="font-weight:700;color:rgba(255,255,255,.8)">Total</label>
                <div class="conv-result-val">{{ fmtResult(precioTotal) }}</div>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="conv-generic">
              <div class="conv-row">
                <input v-model.number="convFrom" type="number" step="any"
                  class="conv-input" @input="doConvert" />
                <select v-model="convUnitFrom" class="conv-select" @change="doConvert">
                  <option v-for="u in unitsOf(categoria)" :key="u.key" :value="u.key">{{ u.label }}</option>
                </select>
              </div>
              <div class="conv-swap-row">
                <div style="flex:1;text-align:center;color:rgba(255,255,255,.2);font-size:14px">↓</div>
                <button class="conv-swap-btn" @click="swapUnits">⇅ intercambiar</button>
              </div>
              <div class="conv-row">
                <input :value="fmtConv(convResult)" readonly class="conv-input conv-input-result" />
                <select v-model="convUnitTo" class="conv-select" @change="doConvert">
                  <option v-for="u in unitsOf(categoria)" :key="u.key" :value="u.key">{{ u.label }}</option>
                </select>
              </div>
            </div>
          </template>

          <button class="calc-aceptar" @click="aceptarConv">
            ✓ Insertar en campo
          </button>
        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useCalculadora } from '../composables/useCalculadora'

// ── Estado global compartido con App.vue ───────────────────────────
const { show, focusedEl, closeCalc } = useCalculadora()
const tab = ref('calc')

// ── CALCULADORA ───────────────────────────────────────────────────
const display    = ref('0')
const expression = ref('')
const prevValue  = ref(null)
const lastOp     = ref('')
const waiting    = ref(false)
const hasDecimal = ref(false)
const calcResult = ref(0)

function fmt(n) {
  if (n === null || n === undefined || isNaN(n)) return '0'
  const s = parseFloat(n.toFixed(10)).toString()
  return s.length > 14 ? parseFloat(n.toPrecision(8)).toString() : s
}

function inputDigit(d) {
  if (waiting.value) {
    display.value = String(d)
    waiting.value = false
    hasDecimal.value = false
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

function calcOp(a, b, op) {
  if (op === '+') return a + b
  if (op === '-') return a - b
  if (op === '×') return a * b
  if (op === '÷') return b !== 0 ? a / b : 0
  return b
}

function inputOperator(op) {
  const cur = parseFloat(display.value) || 0
  if (prevValue.value !== null && !waiting.value) {
    const res = calcOp(prevValue.value, cur, lastOp.value)
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
    const res = calcOp(prevValue.value, cur, lastOp.value)
    expression.value = expression.value + fmt(cur) + ' ='
    display.value = fmt(res); calcResult.value = res
    prevValue.value = null; lastOp.value = ''; waiting.value = true; hasDecimal.value = false
  }
}

function fmtResult(v) {
  if (v === null || v === undefined || isNaN(v)) return '—'
  return parseFloat(v.toFixed(6)).toLocaleString('es-CO', { maximumFractionDigits: 6 })
}

// ── CONVERSOR ─────────────────────────────────────────────────────
const categoria    = ref('peso')
const convFrom     = ref(1)
const convResult   = ref(null)
const convUnitFrom = ref('kg')
const convUnitTo   = ref('lb')

const precioCant  = ref(1)
const precioUnit  = ref(0)
const precioTotal = ref(0)
function calcPrecio() { precioTotal.value = (precioCant.value || 0) * (precioUnit.value || 0) }

const categorias = [
  { key: 'precio',   label: 'Precio',   icon: '💲' },
  { key: 'peso',     label: 'Peso',     icon: '⚖️' },
  { key: 'volumen',  label: 'Volumen',  icon: '🥛' },
  { key: 'longitud', label: 'Longitud', icon: '📏' },
  { key: 'temp',     label: 'Temp',     icon: '🌡️' },
]

const units = {
  peso: [
    { key: 'kg', label: 'Kilogramo (kg)', toBase: 1 },
    { key: 'g',  label: 'Gramo (g)',      toBase: 0.001 },
    { key: 'mg', label: 'Miligramo (mg)', toBase: 0.000001 },
    { key: 'lb', label: 'Libra (lb)',     toBase: 0.453592 },
    { key: 'oz', label: 'Onza (oz)',      toBase: 0.0283495 },
    { key: 't',  label: 'Tonelada (t)',   toBase: 1000 },
  ],
  volumen: [
    { key: 'l',   label: 'Litro (L)',      toBase: 1 },
    { key: 'ml',  label: 'Mililitro (mL)', toBase: 0.001 },
    { key: 'gal', label: 'Galón (gal)',    toBase: 3.78541 },
    { key: 'qt',  label: 'Cuarto (qt)',    toBase: 0.946353 },
    { key: 'fl',  label: 'Onza fl (oz)',   toBase: 0.0295735 },
    { key: 'cc',  label: 'cc / cm³',       toBase: 0.001 },
  ],
  longitud: [
    { key: 'm',  label: 'Metro (m)',       toBase: 1 },
    { key: 'cm', label: 'Centímetro (cm)', toBase: 0.01 },
    { key: 'mm', label: 'Milímetro (mm)',  toBase: 0.001 },
    { key: 'km', label: 'Kilómetro (km)',  toBase: 1000 },
    { key: 'ft', label: 'Pie (ft)',        toBase: 0.3048 },
    { key: 'in', label: 'Pulgada (in)',    toBase: 0.0254 },
    { key: 'yd', label: 'Yarda (yd)',      toBase: 0.9144 },
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
    const list  = unitsOf(categoria.value)
    const fromU = list.find(u => u.key === from)
    const toU   = list.find(u => u.key === to)
    if (!fromU || !toU) return
    convResult.value = val * fromU.toBase / toU.toBase
  }
}

function convertTemp(v, from, to) {
  const c = from === 'c' ? v : from === 'f' ? (v - 32) * 5 / 9 : v - 273.15
  return to === 'c' ? c : to === 'f' ? c * 9 / 5 + 32 : c + 273.15
}

function swapUnits() {
  const tmp = convUnitFrom.value
  convUnitFrom.value = convUnitTo.value
  convUnitTo.value = tmp
  doConvert()
}

function selectCategoria(key) {
  categoria.value = key
  const list = unitsOf(key)
  convUnitFrom.value = list[0]?.key || ''
  convUnitTo.value   = list[1]?.key || ''
  convFrom.value = 1; convResult.value = null
  precioCant.value = 1; precioUnit.value = 0; precioTotal.value = 0
  if (key !== 'precio') doConvert()
}

function fmtConv(v) {
  if (v === null || v === undefined) return ''
  return parseFloat(v.toFixed(8)).toString()
}

// ── Insertar en campo ──────────────────────────────────────────────
function insertarEnCampo(valor) {
  closeCalc()
  if (focusedEl.value) {
    const el = focusedEl.value
    try {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
      if (setter) setter.call(el, String(valor))
      el.dispatchEvent(new Event('input',  { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
      el.focus()
    } catch (e) { /* ignorar */ }
  }
}

function aceptar()     { insertarEnCampo(calcResult.value) }
function aceptarConv() {
  const v = categoria.value === 'precio' ? precioTotal.value : convResult.value
  insertarEnCampo(v ?? '')
}

// ── Teclado ────────────────────────────────────────────────────────
function onKeyDown(e) {
  if (!show.value || tab.value !== 'calc') return

  // No capturar si el foco está en un input/select del conversor
  const tag = document.activeElement?.tagName
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return

  const k = e.key
  if (k >= '0' && k <= '9')       { e.preventDefault(); inputDigit(parseInt(k)) }
  else if (k === '.')              { e.preventDefault(); inputDecimal() }
  else if (k === '+')              { e.preventDefault(); inputOperator('+') }
  else if (k === '-')              { e.preventDefault(); inputOperator('-') }
  else if (k === '*')              { e.preventDefault(); inputOperator('×') }
  else if (k === '/')              { e.preventDefault(); inputOperator('÷') }
  else if (k === '%')              { e.preventDefault(); inputPercent() }
  else if (k === 'Enter' || k === '=') { e.preventDefault(); equals() }
  else if (k === 'Backspace')      { e.preventDefault(); backspace() }
  else if (k === 'Delete' || k === 'c' || k === 'C') { e.preventDefault(); clear() }
  else if (k === 'Escape')         { e.preventDefault(); closeCalc() }
  else if (k === 'Enter' && e.ctrlKey) { e.preventDefault(); aceptar() }
}

watch(show, (val) => {
  if (val) document.addEventListener('keydown', onKeyDown, true)
  else     document.removeEventListener('keydown', onKeyDown, true)
})

</script>

<style scoped>
.mini-calc-wrap {
  position: fixed;
  right: 20px;
  top: 68px;
  width: 300px;
  background: #16162a;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.05);
  z-index: 99999;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Transición */
.calc-fade-enter-active, .calc-fade-leave-active { transition: opacity .15s, transform .15s; }
.calc-fade-enter-from, .calc-fade-leave-to { opacity: 0; transform: translateY(-8px) scale(.97); }

/* Header */
.calc-header { display:flex; align-items:center; justify-content:space-between; padding:10px 12px 8px; border-bottom:1px solid rgba(255,255,255,.07); background:rgba(255,255,255,.03); }
.calc-header-left { display:flex; align-items:center; gap:6px; font-size:11px; font-weight:700; color:rgba(255,255,255,.65); text-transform:uppercase; letter-spacing:.8px; }
.calc-f9-hint { font-size:9px; background:rgba(245,158,11,.2); color:#f59e0b; border:1px solid rgba(245,158,11,.35); border-radius:3px; padding:1px 5px; font-weight:700; }
.calc-close-btn { background:none; border:none; color:rgba(255,255,255,.35); cursor:pointer; font-size:12px; padding:2px 5px; border-radius:4px; line-height:1; }
.calc-close-btn:hover { background:rgba(255,255,255,.1); color:white; }

/* Tabs */
.calc-tabs { display:flex; border-bottom:1px solid rgba(255,255,255,.07); }
.calc-tab { flex:1; padding:8px 4px; font-size:11px; font-weight:600; color:rgba(255,255,255,.35); background:none; border:none; cursor:pointer; transition:.15s; }
.calc-tab:hover { color:rgba(255,255,255,.65); background:rgba(255,255,255,.04); }
.calc-tab.active { color:#f59e0b; border-bottom:2px solid #f59e0b; background:rgba(245,158,11,.05); }

/* Body */
.calc-body { padding:12px; }

/* Display */
.calc-display { background:#0c0c1e; border-radius:10px; padding:10px 14px 8px; margin-bottom:10px; text-align:right; min-height:62px; }
.calc-expr { font-size:11px; color:rgba(255,255,255,.3); min-height:15px; font-family:monospace; }
.calc-value { font-size:30px; font-weight:200; color:white; font-family:'Courier New', monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; line-height:1.2; }

/* Grid */
.calc-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:5px; margin-bottom:8px; }
.cb { border:none; border-radius:8px; height:50px; font-size:18px; font-weight:500; cursor:pointer; transition:background .1s, transform .08s; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.07); color:rgba(255,255,255,.85); }
.cb:hover { background:rgba(255,255,255,.14); }
.cb:active { transform:scale(.91); }
.cb-fn { background:rgba(255,255,255,.1); color:rgba(255,255,255,.6); font-size:15px; }
.cb-op { background:rgba(245,158,11,.2); color:#f59e0b; font-size:19px; }
.cb-op:hover { background:rgba(245,158,11,.35); }
.cb-eq { background:#f59e0b; color:#111; font-size:22px; font-weight:800; }
.cb-eq:hover { background:#fbbf24; }
.cb-zero { grid-column: span 2; }

/* Aceptar */
.calc-aceptar { width:100%; padding:9px 12px; border:1px solid rgba(20,184,166,.3); border-radius:8px; background:rgba(20,184,166,.15); color:#2dd4bf; font-size:12px; font-weight:700; cursor:pointer; transition:.15s; }
.calc-aceptar:hover { background:rgba(20,184,166,.28); }

/* Conversor – categorías */
.conv-cats { display:flex; gap:4px; margin-bottom:10px; flex-wrap:wrap; }
.conv-cat-btn { flex:1; min-width:44px; padding:5px 2px 4px; border:1px solid rgba(255,255,255,.08); border-radius:7px; background:rgba(255,255,255,.04); color:rgba(255,255,255,.45); font-size:9px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:2px; transition:.12s; }
.conv-cat-btn:hover { background:rgba(255,255,255,.09); color:rgba(255,255,255,.8); }
.conv-cat-btn.active { background:rgba(245,158,11,.18); border-color:rgba(245,158,11,.45); color:#f59e0b; }

/* Conversor – inputs */
.conv-row { display:flex; align-items:center; gap:6px; margin-bottom:7px; }
.conv-row label { font-size:11px; color:rgba(255,255,255,.45); width:80px; flex-shrink:0; }
.conv-input { flex:1; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1); border-radius:7px; padding:7px 9px; color:white; font-size:13px; font-family:monospace; outline:none; min-width:0; }
.conv-input:focus { border-color:#f59e0b; background:rgba(245,158,11,.06); }
.conv-input-result { background:rgba(20,184,166,.1); border-color:rgba(20,184,166,.25); color:#2dd4bf; cursor:default; }
.conv-select { background:#1a1a2e; border:1px solid rgba(255,255,255,.12); border-radius:7px; padding:6px 5px; color:white; font-size:10px; outline:none; flex-shrink:0; max-width:125px; cursor:pointer; }
.conv-swap-row { display:flex; align-items:center; gap:8px; margin:0 0 5px; }
.conv-swap-btn { background:rgba(245,158,11,.12); border:1px solid rgba(245,158,11,.22); border-radius:6px; padding:4px 10px; color:#f59e0b; cursor:pointer; font-size:10px; font-weight:600; flex:1; }
.conv-swap-btn:hover { background:rgba(245,158,11,.25); }

.conv-precio, .conv-generic { background:rgba(255,255,255,.02); border-radius:9px; padding:10px; margin-bottom:8px; }
.conv-divider { height:1px; background:rgba(255,255,255,.07); margin:7px 0; }
.conv-result-val { font-size:20px; font-weight:700; color:#f59e0b; font-family:monospace; flex:1; text-align:right; }
</style>
