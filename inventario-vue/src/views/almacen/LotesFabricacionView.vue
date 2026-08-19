<template>
  <MainLayout>
    <div class="pg-container">

      <PageHeader
        title="Lotes de Fabricación"
        description="Lotes de fabricación por etiqueta de producto"
        :crumbs="['Almacén', 'Procesos', 'Lotes de Fabricación']"
      >
        <template #actions>
          <v-btn color="success" variant="flat" prepend-icon="mdi-plus" @click="abrirModal()">
            Nuevo Lote
          </v-btn>
        </template>
      </PageHeader>

      <div class="toolbar">
        <div class="search-wrap">
          <v-icon size="17" color="rgba(var(--v-theme-on-surface),.4)">mdi-magnify</v-icon>
          <input v-model="busqueda" type="text" placeholder="Buscar por código, etiqueta o responsable..." class="search-input" />
        </div>
        <span class="count-badge">{{ filtrados.length }} lotes</span>
      </div>

      <div class="tabla-card">
        <div v-if="loading" class="loading-wrap">
          <v-progress-circular indeterminate color="success" size="36" />
        </div>
        <table v-else class="crud-table">
          <thead>
            <tr>
              <th>CÓDIGO LOTE</th>
              <th>PRODUCTO</th>
              <th class="col-center">FECHA FABRICACIÓN</th>
              <th class="col-center">FECHA VENCIMIENTO</th>
              <th>RESPONSABLE</th>
              <th class="col-acc">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filtrados.length === 0">
              <td colspan="6" class="empty-row">
                <v-icon size="40" color="rgba(var(--v-theme-on-surface),.15)">mdi-factory</v-icon>
                <p>No hay lotes registrados</p>
              </td>
            </tr>
            <tr v-for="l in filtrados" :key="l.codigo" class="data-row">
              <td><span class="cod-badge">{{ l.codigo }}</span></td>
              <td class="fw500">{{ l.etiqueta_nombre || '—' }}</td>
              <td class="col-center">{{ fmtFecha(l.fecha_fab) }}</td>
              <td class="col-center">
                <span :class="venceProximo(l.fecha_vence) ? 'chip-warn' : ''">
                  {{ fmtFecha(l.fecha_vence) }}
                </span>
              </td>
              <td>{{ l.responsable || '—' }}</td>
              <td class="col-acc">
                <v-btn icon="mdi-printer-outline" size="x-small" variant="text" color="success" @click="imprimirEtiqueta(l)" />
                <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" color="primary" @click="abrirModal(l)" />
                <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error"
                  :loading="eliminando === l.codigo" @click="eliminar(l)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MODAL -->
      <v-dialog v-model="modal" max-width="560">
        <v-card class="modal-card">
          <div class="modal-header">
            <v-icon color="success" class="mr-2">mdi-factory</v-icon>
            <span>{{ editando ? 'Editar Lote' : 'Nuevo Lote de Fabricación' }}</span>
            <v-spacer />
            <v-btn icon="mdi-close" size="small" variant="text" @click="modal = false" />
          </div>
          <div class="modal-body">

            <!-- CÓDIGO (auto-generado, editable) -->
            <div class="field-group">
              <label class="field-label">Código de Lote</label>
              <div class="cod-wrap">
                <input v-model="form.codigo" :disabled="editando" type="text" maxlength="20"
                  class="field-input cod-input" :class="{ 'field-error': err.codigo }" />
                <span class="cod-hint">Formato: MMDDAAXXX (ej. {{ ejemploCodigo }})</span>
              </div>
              <span v-if="err.codigo" class="error-txt">{{ err.codigo }}</span>
            </div>

            <!-- ETIQUETA (select de etiquetas_producto) -->
            <div class="field-group">
              <label class="field-label">Producto *</label>
              <select v-model="form.etiqueta" class="field-input field-select" :class="{ 'field-error': err.etiqueta }">
                <option value="">— Seleccionar —</option>
                <option v-for="e in etiquetas" :key="e.codigo" :value="e.codigo">
                  {{ e.codigo }} — {{ e.producto }}
                </option>
              </select>
              <span v-if="err.etiqueta" class="error-txt">{{ err.etiqueta }}</span>
            </div>

            <div class="form-row-2">
              <div class="field-group">
                <label class="field-label">Fecha de Fabricación *</label>
                <input v-model="form.fecha_fab" type="date" class="field-input" :class="{ 'field-error': err.fecha_fab }" />
                <span v-if="err.fecha_fab" class="error-txt">{{ err.fecha_fab }}</span>
              </div>
              <div class="field-group">
                <label class="field-label">Fecha de Vencimiento</label>
                <input v-model="form.fecha_vence" type="date" class="field-input" />
                <span class="hint-txt" v-if="diasVencimiento">
                  Sugerido: {{ fmtFecha(diasVencimientoStr) }} ({{ diasVencimiento }} días)
                </span>
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">Responsable</label>
              <select v-model="form.responsable" class="field-input field-select">
                <option value="">— Seleccionar —</option>
                <option v-for="emp in empleados" :key="emp.id" :value="`${emp.nombre} ${emp.apellido}`">
                  {{ emp.nombre }} {{ emp.apellido }}
                </option>
              </select>
            </div>

            <div class="field-group">
              <label class="field-label">Observaciones</label>
              <textarea v-model="form.observaciones" rows="2" class="field-input field-textarea" />
            </div>

            <div v-if="msgError" class="api-error">{{ msgError }}</div>
          </div>
          <div class="modal-footer">
            <v-btn variant="text" @click="modal = false">Cancelar</v-btn>
            <v-btn color="success" variant="flat" :loading="guardando" @click="guardar">
              {{ editando ? 'Guardar Cambios' : 'Crear Lote' }}
            </v-btn>
          </div>
        </v-card>
      </v-dialog>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import { useAuthStore } from '../../stores/auth.js'
import { API_BASE } from '../../utils/constants.js'

const auth    = useAuthStore()
const empresa = computed(() => auth.empresaCodigo)

const lotes    = ref([])
const etiquetas = ref([])
const empleados = ref([])
const busqueda  = ref('')
const formatoEtiqueta = ref('6x4')
const loading   = ref(false)
const guardando = ref(false)
const eliminando = ref(null)
const modal     = ref(false)
const editando  = ref(false)
const msgError  = ref('')
const err       = ref({})

const formVacio = () => ({
  codigo: '', etiqueta: '', fecha_fab: new Date().toISOString().split('T')[0],
  fecha_vence: '', responsable: '', observaciones: ''
})
const form = ref(formVacio())

const hoy = new Date()
const ejemploCodigo = computed(() => {
  const mm = String(hoy.getMonth() + 1).padStart(2, '0')
  const dd = String(hoy.getDate()).padStart(2, '0')
  const aa = String(hoy.getFullYear()).slice(-2)
  return `${mm}${dd}${aa}001`
})

// Auto-calcular fecha vencimiento cuando seleccionan etiqueta
const diasVencimiento = computed(() => {
  if (!form.value.etiqueta || !form.value.fecha_fab) return null
  const et = etiquetas.value.find(e => e.codigo === form.value.etiqueta)
  return et?.dias_vencimiento || null
})

const diasVencimientoStr = computed(() => {
  if (!diasVencimiento.value || !form.value.fecha_fab) return ''
  const d = new Date(form.value.fecha_fab + 'T12:00:00')
  d.setDate(d.getDate() + diasVencimiento.value)
  return d.toISOString().split('T')[0]
})

watch([() => form.value.etiqueta, () => form.value.fecha_fab], () => {
  if (diasVencimientoStr.value) {
    form.value.fecha_vence = diasVencimientoStr.value
  }
})

const filtrados = computed(() => {
  const q = busqueda.value.toLowerCase()
  return lotes.value.filter(l =>
    l.codigo.toLowerCase().includes(q) ||
    (l.etiqueta_nombre || '').toLowerCase().includes(q) ||
    (l.etiqueta || '').toLowerCase().includes(q) ||
    (l.responsable || '').toLowerCase().includes(q)
  )
})

function fmtFecha(f) {
  if (!f) return '—'
  const d = new Date(String(f).substring(0, 10) + 'T12:00:00')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${d.getFullYear()}`
}

function venceProximo(f) {
  if (!f) return false
  const d = new Date(String(f).substring(0, 10) + 'T12:00:00')
  const diff = (d - new Date()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= 7
}

async function cargar() {
  loading.value = true
  try {
    const [rLotes, rEtiq, rEmp, rFmt] = await Promise.all([
      fetch(`${API_BASE}/almacen/lotes-fabricacion?empresa=${empresa.value}`).then(r => r.json()),
      fetch(`${API_BASE}/almacen/etiquetas-producto?empresa=${empresa.value}`).then(r => r.json()),
      fetch(`${API_BASE}/nomina/empleados-basico?empresa=${empresa.value}`).then(r => r.json()),
      fetch(`${API_BASE}/empresas/formato-etiqueta-produccion?empresa=${empresa.value}`).then(r => r.json())
    ])
    lotes.value     = rLotes.data || []
    etiquetas.value = rEtiq.data || []
    empleados.value = rEmp.data || []
    formatoEtiqueta.value = rFmt.data?.formato_etiqueta_produccion || '6x4'
  } catch (e) { console.error(e) } finally { loading.value = false }
}

async function proximoCodigo() {
  try {
    const r = await fetch(`${API_BASE}/almacen/lotes-fabricacion/proximo-codigo`)
    const j = await r.json()
    return j.codigo || ejemploCodigo.value
  } catch { return ejemploCodigo.value }
}

async function abrirModal(l = null) {
  err.value = {}
  msgError.value = ''
  editando.value = !!l
  if (l) {
    form.value = {
      codigo:       l.codigo,
      etiqueta:     l.etiqueta,
      fecha_fab:    String(l.fecha_fab).substring(0, 10),
      fecha_vence:  l.fecha_vence ? String(l.fecha_vence).substring(0, 10) : '',
      responsable:  l.responsable || '',
      observaciones: l.observaciones || ''
    }
  } else {
    const cod = await proximoCodigo()
    form.value = { ...formVacio(), codigo: cod }
  }
  modal.value = true
}

function validar() {
  const e = {}
  if (!form.value.codigo.trim())   e.codigo    = 'Requerido'
  if (!form.value.etiqueta)        e.etiqueta  = 'Requerido'
  if (!form.value.fecha_fab)       e.fecha_fab = 'Requerido'
  err.value = e
  return Object.keys(e).length === 0
}

async function guardar() {
  if (!validar()) return
  guardando.value = true
  msgError.value = ''
  try {
    const url = editando.value
      ? `${API_BASE}/almacen/lotes-fabricacion/${form.value.codigo}`
      : `${API_BASE}/almacen/lotes-fabricacion`
    const r = await fetch(url, {
      method: editando.value ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    if (editando.value) {
      const idx = lotes.value.findIndex(x => x.codigo === form.value.codigo)
      if (idx >= 0) lotes.value[idx] = j.data
    } else {
      lotes.value.unshift(j.data)
    }
    modal.value = false
  } catch (e) {
    msgError.value = e.message
  } finally { guardando.value = false }
}

async function eliminar(l) {
  eliminando.value = l.codigo
  try {
    const r = await fetch(`${API_BASE}/almacen/lotes-fabricacion/${l.codigo}`, { method: 'DELETE' })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    lotes.value = lotes.value.filter(x => x.codigo !== l.codigo)
  } catch (e) {
    alert(e.message)
  } finally { eliminando.value = null }
}

function imprimirEtiqueta(l) {
  const empresaNombre = auth.empresaNombre || ''
  const fmtD = (f) => {
    if (!f) return '—'
    const d = new Date(String(f).substring(0, 10) + 'T12:00:00')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${mm}/${dd}/${d.getFullYear()}`
  }

  const barcodeVal = l.barcode || l.codigo
  const es3x4 = formatoEtiqueta.value === '3x4'
  const bcHeight = es3x4 ? 32 : 45
  const bcWidth  = es3x4 ? 1.3 : 1.8

  const stylesLbl = es3x4 ? `
  @page { size: 4in 3in; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; }
  body { width: 4in; min-height: 3in; background: #fff; color: #000; }

  .lbl { display: flex; flex-direction: column; min-height: 3in; border: 1.5px solid #000; }

  /* Top strip: icon box + badge type "FRAGILE" */
  .lbl-top { display: flex; align-items: stretch; border-bottom: 1.5px solid #000; }
  .top-icon-box { width: 22%; border-right: 1.5px solid #000; padding: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
  .top-icon { width: 18px; height: 18px; border: 1.5px solid #000; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 9pt; font-weight: 900; }
  .top-icon-cap { font-size: 5.5pt; text-align: center; line-height: 1.2; color: #333; text-transform: uppercase; }
  .top-badge { flex: 1; padding: 4px 6px; display: flex; flex-direction: column; align-items: flex-end; justify-content: center; text-align: right; }
  .badge-title { font-size: 7.5pt; font-weight: 900; text-transform: uppercase; line-height: 1.05; }
  .badge-sub   { font-size: 6pt; font-weight: 700; text-transform: uppercase; color: #333; margin-top: 1px; }

  /* Product title bar – centered, no lot reference (shown in footer) */
  .lbl-header-bar { padding: 4px 8px; border-bottom: 1.5px solid #000; text-align: center; }
  .prod-name { font-size: 12pt; font-weight: 900; text-transform: uppercase; line-height: 1.05; }

  /* Net weight / servings boxes */
  .weight-row { display: flex; gap: 4px; padding: 3px 8px; border-bottom: 1px solid #000; }
  .w-box { flex: 1; text-align: center; border: 1px solid #000; padding: 2px 3px; }
  .w-lbl { font-size: 5.5pt; text-transform: uppercase; font-weight: 700; }
  .w-val { font-size: 7.5pt; font-weight: 900; }

  /* From/To style dates section */
  .two-col { display: flex; border-bottom: 1px solid #000; }
  .col { flex: 1; padding: 3px 6px; }
  .col:first-child { border-right: 1px solid #000; }
  .col-title { font-size: 6pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
  .col-row { font-size: 6.5pt; line-height: 1.4; }
  .col-lbl { color: #555; }
  .col-val { font-weight: 700; margin-left: 2px; font-size: 8pt; }
  .col-warn { display: inline-block; margin-top: 2px; font-size: 5.5pt; font-weight: 900; text-transform: uppercase; border: 1px solid #000; padding: 1px 4px; border-radius: 3px; }

  /* Additional information */
  .lbl-extra { flex: 1; padding: 3px 8px; display: flex; flex-direction: column; gap: 2px; }
  .section-title { font-size: 6pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #000; padding-bottom: 1px; margin-bottom: 1px; }
  .section-txt   { font-size: 6.5pt; line-height: 1.2; }
  .alerg-txt     { font-size: 6.5pt; font-weight: 700; line-height: 1.15; }

  /* Footer: batch code + barcode */
  .lbl-barcode { padding: 3px 8px 5px; text-align: center; border-top: 1.5px solid #000; }
  .footer-title { font-size: 6.5pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1px; }
  .lbl-barcode svg { max-width: 100%; }
  .bc-num { font-size: 6.5pt; margin-top: 1px; font-family: monospace; letter-spacing: 0.5px; }
` : `
  @page { size: 4in 6in; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; }
  body { width: 4in; min-height: 6in; background: #fff; color: #000; }

  .lbl { display: flex; flex-direction: column; min-height: 6in; border: 1.5px solid #000; }

  /* Header: empresa – solo borde inferior, sin fondo */
  .lbl-header { padding: 7px 12px 5px; text-align: center; border-bottom: 2px solid #000; }
  .emp-name { font-size: 13pt; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; }
  .emp-sub  { font-size: 8.5pt; color: #333; margin-top: 1px; }

  /* Producto – centrado, sin fondo */
  .lbl-product { padding: 7px 12px 6px; text-align: center; border-bottom: 1.5px solid #000; }
  .prod-name { font-size: 16pt; font-weight: 900; text-transform: uppercase; line-height: 1.1; }
  .lot-tag   { font-size: 9pt; font-family: monospace; letter-spacing: 1.5px; margin-top: 3px; color: #333; }

  /* Cuerpo */
  .lbl-body { flex: 1; padding: 7px 12px; display: flex; flex-direction: column; gap: 6px; }

  /* Fechas */
  .dates-row { display: flex; gap: 8px; }
  .date-box  { flex: 1; border: 1px solid #000; padding: 4px 7px; }
  .date-lbl  { font-size: 8pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
  .date-val  { font-size: 14.5pt; font-weight: 900; }

  /* Pesos */
  .weight-row { display: flex; gap: 6px; }
  .w-box { flex: 1; text-align: center; border: 1px solid #000; padding: 3px 5px; }
  .w-lbl { font-size: 8pt; text-transform: uppercase; font-weight: 700; }
  .w-val { font-size: 11pt; font-weight: 900; }

  /* Secciones */
  .section-title { font-size: 8pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1px solid #000; padding-bottom: 1px; margin-bottom: 2px; }
  .section-txt   { font-size: 9pt; line-height: 1.35; }
  .alerg-txt     { font-size: 9pt; font-weight: 700; line-height: 1.3; }

  /* Barcode */
  .lbl-barcode { padding: 6px 12px 8px; text-align: center; border-top: 1.5px solid #000; }
  .lbl-barcode svg { max-width: 100%; }
  .bc-num { font-size: 8.5pt; margin-top: 1px; font-family: monospace; letter-spacing: 1px; }
`

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Label – ${l.etiqueta_nombre || l.etiqueta} – ${l.codigo}</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
<style>
${stylesLbl}
  /* Botón imprimir – solo pantalla */
  @media screen {
    .print-btn-wrap { text-align: center; padding: 12px; }
    .print-btn { background: #000; color: #fff; border: none; padding: 8px 24px; font-size: 11pt; font-weight: 700; cursor: pointer; border-radius: 4px; }
    .print-btn:hover { background: #333; }
  }
  @media print {
    .print-btn-wrap { display: none; }
    body { margin: 0; }
  }
</style>
</head><body>
<div class="print-btn-wrap">
  <button class="print-btn" onclick="window.print()">🖨 Print Label</button>
</div>
${es3x4 ? `
<div class="lbl">
  <div class="lbl-top">
    <div class="top-icon-box">
      <div class="top-icon">${(empresaNombre || 'P').charAt(0).toUpperCase()}</div>
      <div class="top-icon-cap">${empresaNombre}</div>
    </div>
    <div class="top-badge">
      <div class="badge-title">PRODUCTION<br>BATCH</div>
    </div>
  </div>

  <div class="lbl-header-bar">
    <div class="prod-name">${l.etiqueta_nombre || l.etiqueta}</div>
  </div>

  ${(l.peso_neto_oz || l.peso_neto_g || l.porciones || l.tamano_porcion) ? `
  <div class="weight-row">
    ${l.peso_neto_oz   ? `<div class="w-box"><div class="w-lbl">Net Weight</div><div class="w-val">${l.peso_neto_oz} oz</div></div>` : ''}
    ${l.peso_neto_g    ? `<div class="w-box"><div class="w-lbl">Net Weight</div><div class="w-val">${l.peso_neto_g} g</div></div>` : ''}
    ${l.porciones      ? `<div class="w-box"><div class="w-lbl">Servings</div><div class="w-val">${l.porciones}</div></div>` : ''}
    ${l.tamano_porcion ? `<div class="w-box"><div class="w-lbl">Serving Size</div><div class="w-val">${l.tamano_porcion}</div></div>` : ''}
  </div>` : ''}

  <div class="two-col">
    <div class="col">
      <div class="col-title">Manufactured</div>
      <div class="col-row"><span class="col-lbl">Date:</span><span class="col-val">${fmtD(l.fecha_fab)}</span></div>
    </div>
    <div class="col">
      <div class="col-title">Best By / Exp.</div>
      <div class="col-row"><span class="col-lbl">Date:</span><span class="col-val">${fmtD(l.fecha_vence)}</span></div>
      ${venceProximo(l.fecha_vence) ? `<div class="col-warn">Expiring Soon</div>` : ''}
    </div>
  </div>

  ${(l.ingredientes || l.alergenos) ? `
  <div class="lbl-extra">
    ${l.ingredientes ? `
    <div>
      <div class="section-title">Ingredients</div>
      <div class="section-txt">${l.ingredientes}</div>
    </div>` : ''}

    ${l.alergenos ? `
    <div>
      <div class="section-title">Contains / Allergens</div>
      <div class="alerg-txt">${l.alergenos}</div>
    </div>` : ''}

  </div>` : ''}

  <div class="lbl-barcode">
    <svg id="bc"></svg>
    <div class="bc-num">${barcodeVal}</div>
  </div>
</div>` : `
<div class="lbl">
  <div class="lbl-header">
    <div class="emp-name">${empresaNombre}</div>
  </div>

  <div class="lbl-product">
    <div class="prod-name">${l.etiqueta_nombre || l.etiqueta}</div>
    <div class="lot-tag">LOT: ${l.codigo}</div>
  </div>

  <div class="lbl-body">
    <div class="dates-row">
      <div class="date-box">
        <div class="date-lbl">Manufactured</div>
        <div class="date-val">${fmtD(l.fecha_fab)}</div>
      </div>
      <div class="date-box">
        <div class="date-lbl">Best By / Exp. Date</div>
        <div class="date-val">${fmtD(l.fecha_vence)}</div>
      </div>
    </div>

    ${(l.peso_neto_oz || l.peso_neto_g || l.porciones || l.tamano_porcion) ? `
    <div class="weight-row">
      ${l.peso_neto_oz   ? `<div class="w-box"><div class="w-lbl">Net Weight</div><div class="w-val">${l.peso_neto_oz} oz</div></div>` : ''}
      ${l.peso_neto_g    ? `<div class="w-box"><div class="w-lbl">Net Weight</div><div class="w-val">${l.peso_neto_g} g</div></div>` : ''}
      ${l.porciones      ? `<div class="w-box"><div class="w-lbl">Servings</div><div class="w-val">${l.porciones}</div></div>` : ''}
      ${l.tamano_porcion ? `<div class="w-box"><div class="w-lbl">Serving Size</div><div class="w-val">${l.tamano_porcion}</div></div>` : ''}
    </div>` : ''}

    ${l.ingredientes ? `
    <div>
      <div class="section-title">Ingredients</div>
      <div class="section-txt">${l.ingredientes}</div>
    </div>` : ''}

    ${l.alergenos ? `
    <div>
      <div class="section-title">Contains / Allergens</div>
      <div class="alerg-txt">${l.alergenos}</div>
    </div>` : ''}

  </div>

  <div class="lbl-barcode">
    <svg id="bc"></svg>
    <div class="bc-num">${barcodeVal}</div>
  </div>
</div>`}
<script>
  window.onload = function() {
    try {
      JsBarcode("#bc", "${barcodeVal}", {
        format: "CODE128", width: ${bcWidth}, height: ${bcHeight},
        displayValue: false, margin: 0, background: "#ffffff", lineColor: "#000000"
      });
    } catch(e) {}
  };
<\/script>
</body></html>`

  const w = window.open('', '_blank')
  w.document.write(html)
  w.document.close()
}

onMounted(cargar)
</script>

<style scoped>
.pg-container { padding: 24px; max-width: 1200px; margin: 0 auto; }



.toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.search-wrap { display: flex; align-items: center; gap: 8px; flex: 1; padding: 8px 12px; background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.1); border-radius: 8px; }
.search-input { flex: 1; border: none; background: transparent; outline: none; font-size: 13px; color: rgb(var(--v-theme-on-surface)); }
.search-input::placeholder { color: rgba(var(--v-theme-on-surface),.35); }
.count-badge { font-size: 12px; font-weight: 600; color: rgba(var(--v-theme-on-surface),.45); white-space: nowrap; }

.tabla-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 12px; overflow: hidden; }
.loading-wrap { display: flex; justify-content: center; padding: 40px; }
.crud-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.crud-table thead th { padding: 11px 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.45); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); text-align: left; }
.col-center { text-align: center !important; }
.col-acc { width: 115px; text-align: center !important; white-space: nowrap; }
.data-row td { padding: 10px 14px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); color: rgb(var(--v-theme-on-surface)); vertical-align: middle; }
.data-row:last-child td { border-bottom: none; }
.data-row:hover td { background: rgba(var(--v-theme-on-surface),.02); }
.cod-badge { background: rgba(16,185,129,.12); color: var(--success); padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 700; font-family: monospace; letter-spacing: 1px; }
.fw500 { font-weight: 500; }
.sub-txt { font-size: 11px; color: rgba(var(--v-theme-on-surface),.45); margin-top: 2px; font-family: monospace; }
.chip-warn { background: rgba(245,158,11,.12); color: var(--gold); padding: 2px 8px; border-radius: 5px; font-size: 12px; font-weight: 600; }
.empty-row { text-align: center !important; padding: 48px !important; color: rgba(var(--v-theme-on-surface),.35); }
.empty-row p { margin: 10px 0 0; font-size: 13px; }

.modal-card { border-radius: 14px !important; overflow: hidden; }
.modal-header { display: flex; align-items: center; padding: 16px 20px; background: rgba(var(--v-theme-on-surface),.03); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); font-weight: 700; font-size: 15px; }
.modal-body { padding: 20px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid rgba(var(--v-theme-on-surface),.07); }

.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field-group { margin-bottom: 14px; }
.field-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.5); margin-bottom: 6px; }
.field-input { width: 100%; padding: 9px 12px; border: 1px solid rgba(var(--v-theme-on-surface),.15); border-radius: 8px; font-size: 13px; background: rgba(var(--v-theme-on-surface),.03); color: rgb(var(--v-theme-on-surface)); outline: none; transition: border-color .2s; box-sizing: border-box; }
.field-input:focus { border-color: var(--success); }
.field-input.field-error { border-color: var(--error); }
.field-input:disabled { opacity: .55; cursor: not-allowed; }
.field-select { appearance: auto; cursor: pointer; background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); }
.field-textarea { resize: vertical; min-height: 60px; font-family: inherit; }
.cod-input { text-align: center; font-weight: 700; font-family: monospace; letter-spacing: 2px; font-size: 15px; }
.cod-wrap { position: relative; }
.cod-hint { font-size: 11px; color: rgba(var(--v-theme-on-surface),.4); margin-top: 3px; display: block; }
.error-txt { font-size: 11px; color: var(--error); margin-top: 3px; display: block; }
.hint-txt { font-size: 11px; color: var(--success); margin-top: 3px; display: block; font-weight: 600; }
.api-error { background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.2); border-radius: 8px; padding: 10px 14px; font-size: 12px; color: var(--error); margin-top: 8px; }
</style>
