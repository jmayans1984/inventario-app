<template>
  <MainLayout>
    <div class="bcv-container">

      <PageHeader
        title="Impresión de Códigos de Barras"
        description="Etiquetas con nombre y código del producto"
        :crumbs="['Almacén', 'Configuración', 'Impresión de Códigos de Barras']"
      />

      <!-- OPCIONES DE IMPRESIÓN -->
      <div class="bcv-opciones">
        <v-select
          v-model="tipoCodigo"
          :items="[{ title: 'Código QR (recomendado para celular)', value: 'QR' }, { title: 'Código de Barras (CODE128)', value: 'BARRAS' }]"
          item-title="title"
          item-value="value"
          label="Tipo de código"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 280px"
        />
        <v-text-field
          v-model.number="cantidad"
          type="number"
          min="1"
          label="Cant. por etiqueta"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 160px"
        />
        <v-select
          v-model="porFila"
          :items="[2,3,4,5]"
          label="Etiquetas por fila"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 170px"
        />
      </div>

      <!-- FILTROS -->
      <div class="bcv-filtros">
        <div class="bcv-search">
          <v-icon size="18" style="color:rgba(var(--v-theme-on-surface),.4)">mdi-magnify</v-icon>
          <input
            v-model="search"
            type="text"
            placeholder="Buscar producto por nombre o código..."
            class="bcv-search-input"
          />
          <v-icon v-if="search" size="16" style="cursor:pointer;color:rgba(var(--v-theme-on-surface),.4)" @click="search=''">mdi-close</v-icon>
        </div>
        <v-btn variant="text" prepend-icon="mdi-refresh" :loading="loading" @click="cargar">
          Actualizar
        </v-btn>
      </div>

      <div class="bcv-contador">
        {{ productosFiltrados.length }} producto(s) · {{ seleccionados.size }} seleccionado(s)
      </div>

      <!-- LISTA -->
      <div class="bcv-lista-wrap">
        <div v-if="loading" class="bcv-empty">
          <v-progress-circular indeterminate color="var(--indigo)" size="36" />
          <p class="mt-3" style="color:rgba(var(--v-theme-on-surface),.5)">Cargando productos...</p>
        </div>
        <div v-else-if="productosFiltrados.length === 0" class="bcv-empty">
          <v-icon size="36" style="color:rgba(var(--v-theme-on-surface),.2)">mdi-inbox-outline</v-icon>
          <p style="color:rgba(var(--v-theme-on-surface),.4);margin:8px 0 0">No se encontraron productos</p>
        </div>
        <table v-else class="bcv-table">
          <thead>
            <tr>
              <th class="bcv-th-check"></th>
              <th class="bcv-th-cod">CODIGO</th>
              <th>PRODUCTO</th>
              <th class="bcv-th-und">UNIDAD</th>
              <th class="bcv-th-cant">CANTIDAD</th>
              <th class="bcv-th-estado">ESTADO</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in productosFiltrados"
              :key="p.codigo"
              class="bcv-row"
              :class="{ sel: seleccionados.has(p.codigo) }"
              @click="toggleProducto(p.codigo)"
            >
              <td class="bcv-check">
                <v-checkbox
                  :model-value="seleccionados.has(p.codigo)"
                  density="compact"
                  hide-details
                  color="var(--success)"
                  @click.stop="toggleProducto(p.codigo)"
                />
              </td>
              <td><span class="bcv-cod-badge">{{ p.codigo }}</span></td>
              <td class="bcv-producto">{{ p.nombre }}</td>
              <td class="bcv-und"><span v-if="p.und" class="bcv-und-badge">{{ p.und }}</span><span v-else class="bcv-empty-dash">-</span></td>
              <td class="bcv-cant mono">{{ cantidad }}</td>
              <td class="bcv-estado">
                <span :class="seleccionados.has(p.codigo) ? 'bcv-chip-on' : 'bcv-chip-off'">
                  {{ seleccionados.has(p.codigo) ? 'Seleccionado' : 'Pendiente' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- BARRA INFERIOR -->
      <div class="bcv-bottom-bar">
        <v-btn variant="outlined" @click="toggleSeleccionarTodos">☑️ Todos / Ninguno</v-btn>
        <v-btn color="var(--success)" variant="elevated" :disabled="seleccionados.size === 0" @click="imprimirSeleccionados">
          🖨️ Imprimir ({{ seleccionados.size }})
        </v-btn>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import { productosAlmacenService } from '../../services/productos-almacen.service'

const productos     = ref([])
const loading        = ref(false)
const search         = ref('')
const seleccionados  = ref(new Set())
const cantidad        = ref(1)
const porFila         = ref(3)
const tipoCodigo      = ref('QR')

const productosFiltrados = computed(() => {
  const q = search.value.trim().toUpperCase()
  if (!q) return productos.value
  return productos.value.filter(p =>
    p.nombre.toUpperCase().includes(q) || String(p.codigo).toUpperCase().includes(q)
  )
})

async function cargar() {
  loading.value = true
  try {
    const res = await productosAlmacenService.getProductos()
    productos.value = res.data || []
  } catch (e) {
    console.error('Error cargando productos:', e)
  } finally {
    loading.value = false
  }
}

function toggleProducto(codigo) {
  if (seleccionados.value.has(codigo)) seleccionados.value.delete(codigo)
  else seleccionados.value.add(codigo)
  seleccionados.value = new Set(seleccionados.value)
}

function toggleSeleccionarTodos() {
  const visibles = productosFiltrados.value
  const todosYaSeleccionados = visibles.every(p => seleccionados.value.has(p.codigo))
  if (todosYaSeleccionados) {
    visibles.forEach(p => seleccionados.value.delete(p.codigo))
  } else {
    visibles.forEach(p => seleccionados.value.add(p.codigo))
  }
  seleccionados.value = new Set(seleccionados.value)
}

async function generarImagenCodigo(codigo) {
  if (tipoCodigo.value === 'QR') {
    return await QRCode.toDataURL(String(codigo), {
      width: 240, margin: 1, errorCorrectionLevel: 'M',
    })
  }
  const canvas = document.createElement('canvas')
  JsBarcode(canvas, String(codigo), {
    format: 'CODE128', displayValue: true,
    fontSize: 14, textMargin: 3, height: 60, width: 2.4, margin: 8,
  })
  return canvas.toDataURL('image/png')
}

async function imprimirSeleccionados() {
  if (seleccionados.value.size === 0) return

  const cant   = Math.max(1, parseInt(cantidad.value) || 1)
  const fila   = parseInt(porFila.value) || 3
  const elegidos = productos.value.filter(p => seleccionados.value.has(p.codigo))
  const esQR = tipoCodigo.value === 'QR'

  let etiquetasHtml = ''
  for (const p of elegidos) {
    let img
    try {
      img = await generarImagenCodigo(p.codigo)
    } catch {
      continue
    }
    for (let i = 0; i < cant; i++) {
      etiquetasHtml += `
        <div class="etiqueta">
          <div class="etiqueta-nombre">${p.nombre}</div>
          <img src="${img}" class="etiqueta-img ${esQR ? 'etiqueta-img-qr' : ''}" />
          ${esQR ? `<div class="etiqueta-codigo">${p.codigo}</div>` : ''}
        </div>`
    }
  }

  const ventana = window.open('', '_blank')
  ventana.document.write(`
    <!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <title>Códigos de Barras</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: Arial, sans-serif; margin: 10px; }
      .grid { display: grid; grid-template-columns: repeat(${fila}, 1fr); gap: 8px; }
      .etiqueta { border: 1px dashed #999; border-radius: 6px; padding: 8px 6px; text-align: center; page-break-inside: avoid; }
      .etiqueta-nombre { font-size: 11px; font-weight: 700; margin-bottom: 4px; line-height: 1.2; min-height: 26px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
      .etiqueta-img { width: 100%; max-width: 220px; }
      .etiqueta-img-qr { max-width: 140px; }
      .etiqueta-codigo { font-size: 10px; font-family: monospace; margin-top: 3px; color: #333; }
      @media print { .etiqueta { border: none; } }
    </style>
    </head><body>
    <div class="grid">${etiquetasHtml}</div>
    <script>window.onload=()=>{window.print();}<\/script>
    </body></html>
  `)
  ventana.document.close()
}

onMounted(cargar)
</script>

<style scoped>
.bcv-container { padding: 24px; max-width: 1200px; margin: 0 auto; padding-bottom: 90px; }

.bcv-opciones { display: flex; gap: 14px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }

.bcv-filtros      { display: flex; gap: 12px; align-items: center; margin-bottom: 10px; flex-wrap: wrap; }
.bcv-search       { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: rgba(var(--v-theme-on-surface),.03); border-radius: 8px; border: 1px solid rgba(var(--v-theme-on-surface),.08); flex: 1; min-width: 260px; }
.bcv-search-input { flex: 1; border: none; background: transparent; outline: none; font-size: 14px; color: rgb(var(--v-theme-on-surface)); }
.bcv-search-input::placeholder { color: rgba(var(--v-theme-on-surface),.4); }

.bcv-contador { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); margin-bottom: 10px; }

.bcv-lista-wrap { background: rgb(var(--v-theme-surface)); border-radius: 12px; border: 1px solid rgba(var(--v-theme-on-surface),.08); overflow: hidden; }
.bcv-empty { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; }
.bcv-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.bcv-table thead { background: transparent; }
.bcv-table thead th { padding: 11px 14px; text-align: left; font-weight: 700; font-size: 10px; letter-spacing: .5px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.45); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); }
.bcv-row { cursor: pointer; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); transition: background-color .15s ease, box-shadow .15s ease; }
.bcv-row:last-child { border-bottom: none; }
.bcv-row:hover { background: rgba(var(--v-theme-on-surface),.02); }
.bcv-row.sel { background: var(--success-wash); box-shadow: inset 3px 0 0 var(--success); }
.bcv-table tbody td { padding: 10px 14px; color: rgb(var(--v-theme-on-surface)); }
.bcv-th-check { width: 54px; }
.bcv-th-cod { width: 120px; }
.bcv-th-und { width: 90px; text-align: center !important; }
.bcv-th-cant { width: 100px; text-align: right !important; }
.bcv-th-estado { width: 130px; text-align: center !important; }
.bcv-check { width: 54px; padding-top: 4px !important; padding-bottom: 4px !important; }
.bcv-producto { font-weight: 500; }
.bcv-und, .bcv-estado { text-align: center; }
.bcv-cant { text-align: right; font-weight: 700; color: var(--success) !important; }
.mono { font-variant-numeric: tabular-nums; }
.bcv-cod-badge { background: var(--success-wash); color: var(--success); padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 700; font-variant-numeric: tabular-nums; }
.bcv-und-badge { background: var(--success-wash); color: var(--success); padding: 2px 7px; border-radius: 5px; font-size: 11px; font-weight: 600; }
.bcv-empty-dash { color: rgba(var(--v-theme-on-surface),.3); }
.bcv-chip-on, .bcv-chip-off { display: inline-flex; align-items: center; justify-content: center; min-width: 86px; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
.bcv-chip-on { background: var(--success-wash); color: var(--success); }
.bcv-chip-off { background: rgba(var(--v-theme-on-surface),.05); color: rgba(var(--v-theme-on-surface),.48); }

.bcv-bottom-bar {
  position: fixed; bottom: 0; left: 0; right: 0; background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-theme-on-surface),.1); padding: 14px 16px; display: flex; gap: 10px;
  justify-content: center; z-index: 100;
}
.bcv-bottom-bar .v-btn { max-width: 280px; flex: 1; }
</style>
