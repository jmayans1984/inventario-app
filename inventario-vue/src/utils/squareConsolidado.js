// Parser del reporte consolidado de Square ("ventas_totales-<desde>-<hasta>.csv"),
// el que trae TODAS las sedes en un solo archivo. Reemplaza tener que exportar
// y cargar un archivo por centro de costo.
//
// El archivo viene en secciones, cada una precedida por su fila de encabezado:
//   Key Stats
//   Sales Summary       → "Sales Summary Displayed by Location,Gross Sales,..."
//   Item Sales          → "Location,Item Name,Item Variation,SKU,..."
//   Modifier Sales      → "Location,Modifier Set,Modifier,..."
//   Payment Methods     → "Location,Payment Method,Payments,..."
//
// Devuelve un bloque por sede con la misma forma que ya consume
// POST /api/square/importar-resumen, de modo que el guardado no cambia.

/** Divide una línea CSV respetando comillas: `"$1,602.64"` es UNA celda. */
function splitCSVLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes
    else if (ch === ',' && !inQuotes) { out.push(cur.trim()); cur = '' }
    else cur += ch
  }
  out.push(cur.trim())
  return out
}

/** Números en formato inglés ($1,108.06) o español (1.108,06). */
export function parseNum(str) {
  if (str === null || str === undefined || String(str).trim() === '') return 0
  let s = String(str).trim()
    .replace(/\s/g, '')
    .replace(/^-\$/, '-')
    .replace(/^\$/, '')
    .replace(/\$\s*$/, '')
  if (s.includes(',') && s.includes('.')) {
    s = s.lastIndexOf('.') > s.lastIndexOf(',')
      ? s.replace(/,/g, '')
      : s.replace(/\./g, '').replace(',', '.')
  } else if (s.includes(',')) {
    // Solo coma: en este reporte siempre es separador de miles ("1,602")
    s = /,\d{3}(\D|$)/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.')
  }
  return parseFloat(s) || 0
}

/** Normaliza para comparar nombres de sede vs centros de costo. */
export function normalizar(txt) {
  return String(txt || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase().replace(/[^A-Z0-9]/g, ' ')
    .replace(/\s+/g, ' ').trim()
}

/** Fechas del nombre del archivo: ventas_totales-2026-08-16-2026-08-17.csv */
export function fechasDelNombre(filename) {
  const m = String(filename || '').match(/(\d{4}-\d{2}-\d{2})-(\d{4}-\d{2}-\d{2})/)
  return m ? { desde: m[1], hasta: m[2] } : { desde: '', hasta: '' }
}

/** Localiza la fila de encabezado de cada sección por sus columnas. */
function buscarEncabezados(lines) {
  const idx = { resumen: -1, items: -1, mods: -1, pagos: -1 }
  lines.forEach((cells, i) => {
    const c0 = (cells[0] || '').toLowerCase()
    const fila = cells.map(c => (c || '').toLowerCase())
    if (c0.startsWith('sales summary displayed by location') ||
        c0.startsWith('resumen de ventas mostrado por ubicaci')) idx.resumen = i
    if (c0 === 'location' || c0 === 'ubicacion' || c0 === 'ubicación') {
      if (fila.some(h => h === 'item name' || h.includes('nombre del art'))) idx.items = i
      else if (fila.some(h => h === 'modifier set' || h.includes('grupo de modificador'))) idx.mods = i
      else if (fila.some(h => h === 'payment method' || h.includes('metodo de pago') || h.includes('método de pago'))) idx.pagos = i
    }
  })
  return idx
}

/** Filas de datos de una sección: desde el encabezado hasta la línea vacía. */
function filasDeSeccion(lines, headerIdx) {
  if (headerIdx < 0) return []
  const out = []
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cells = lines[i]
    const primera = (cells[0] || '').trim()
    if (primera === '') break            // línea en blanco = fin de sección
    out.push(cells)
  }
  return out
}

const buscarCol = (hdr, ...alternativas) =>
  hdr.findIndex(h => alternativas.some(a => (typeof a === 'string' ? h === a : a.test(h))))

/**
 * Parsea el CSV consolidado.
 * @returns {{ periodo, sedes: Array, aviso: string|null }}
 *   sedes[] = { location, ventas, pagos, items, modificadores, control }
 */
export function parseConsolidado(texto, filename = '') {
  const lines = String(texto).split(/\r?\n/).map(splitCSVLine)
  const idx = buscarEncabezados(lines)

  if (idx.resumen < 0) {
    throw new Error('No se encontró la sección "Sales Summary Displayed by Location". ¿Es el reporte de Ventas Totales de Square con "Display By Location" activado?')
  }

  // ── Resumen por sede ────────────────────────────────────────
  const hdrR = lines[idx.resumen].map(h => (h || '').toLowerCase())
  const cR = {
    brutas:      buscarCol(hdrR, 'gross sales', /ventas brutas/),
    articulos:   buscarCol(hdrR, 'items', /art[ií]culos/),
    cargos:      buscarCol(hdrR, 'service charges', /cargos/),
    devol:       buscarCol(hdrR, 'refunds', /devoluciones/),
    descuentos:  buscarCol(hdrR, 'discounts & comps', /descuentos/),
    netas:       buscarCol(hdrR, 'net sales', /ventas netas/),
    giftcard:    buscarCol(hdrR, 'gift card sales', /tarjetas? de regalo/),
    impuestos:   buscarCol(hdrR, 'tax', /impuestos/),
    propinas:    buscarCol(hdrR, 'tip', 'tips', /propinas/),
    parciales:   buscarCol(hdrR, 'partial refunds', /reembolsos parciales/),
    recibido:    buscarCol(hdrR, 'total collected', /total recibido/),
    comisiones:  buscarCol(hdrR, 'fees', /comisiones/),
    neto:        buscarCol(hdrR, 'net total', /total neto/),
  }

  const sedes = new Map()
  const nuevaSede = (location) => ({
    location,
    ventas: {
      ventasBrutas: 0, articulos: 0, cargosServicio: 0, devoluciones: 0,
      descuentos: 0, ventasNetas: 0, ventasTarjetaRegalo: 0, impuestos: 0,
      propinas: 0, reembolsos: 0, total: 0,
    },
    pagos: {
      totalRecibido: 0, efectivo: 0, tarjeta: 0, otro: 0,
      tarjetaRegalo: 0, comisiones: 0, totalNeto: 0,
    },
    items: [],
    modificadores: [],
    // Valores del resumen para cruzar contra la suma de métodos de pago
    control: { resumenRecibido: 0, resumenComisiones: 0, resumenPropinas: 0, pagosPropinas: 0, cuadra: true, diferencias: [] },
  })

  for (const cells of filasDeSeccion(lines, idx.resumen)) {
    const location = (cells[0] || '').trim()
    if (!location) continue
    const s = nuevaSede(location)
    const g = (i) => (i >= 0 ? parseNum(cells[i]) : 0)
    s.ventas.ventasBrutas        = g(cR.brutas)
    s.ventas.articulos           = g(cR.articulos)
    s.ventas.cargosServicio      = g(cR.cargos)
    s.ventas.devoluciones        = Math.abs(g(cR.devol))
    s.ventas.descuentos          = Math.abs(g(cR.descuentos))
    s.ventas.ventasNetas         = g(cR.netas)
    s.ventas.ventasTarjetaRegalo = g(cR.giftcard)
    s.ventas.impuestos           = g(cR.impuestos)
    s.ventas.propinas            = g(cR.propinas)
    s.ventas.reembolsos          = Math.abs(g(cR.parciales))
    s.ventas.total               = g(cR.recibido)
    s.control.resumenRecibido    = g(cR.recibido)
    s.control.resumenComisiones  = g(cR.comisiones)
    s.control.resumenPropinas    = g(cR.propinas)
    sedes.set(normalizar(location), s)
  }

  const sedePorNombre = (raw) => sedes.get(normalizar(raw)) || null

  // ── Artículos por sede ──────────────────────────────────────
  if (idx.items >= 0) {
    const hdr = lines[idx.items].map(h => (h || '').toLowerCase())
    const c = {
      nombre:    buscarCol(hdr, 'item name', /nombre del art/),
      variante:  buscarCol(hdr, 'item variation', /variante/),
      sku:       buscarCol(hdr, 'sku'),
      categoria: buscarCol(hdr, 'category', /categor/),
      cantidad:  buscarCol(hdr, 'items sold', /art[ií]culos vendidos/),
      brutas:    buscarCol(hdr, 'gross sales', /ventas brutas/),
      descuentos:buscarCol(hdr, 'discounts & comps', /descuentos/),
      netas:     buscarCol(hdr, 'net sales', /ventas netas/),
      impuestos: buscarCol(hdr, 'tax', /impuestos/),
    }
    for (const cells of filasDeSeccion(lines, idx.items)) {
      const sede = sedePorNombre(cells[0])
      if (!sede) continue
      const nombre = c.nombre >= 0 ? (cells[c.nombre] || '') : ''
      if (!nombre) continue
      sede.items.push({
        nombre,
        variante:     c.variante  >= 0 ? (cells[c.variante] || '') : '',
        sku:          c.sku       >= 0 ? (cells[c.sku] || '') : '',
        categoria:    c.categoria >= 0 ? (cells[c.categoria] || 'SIN CATEGORÍA') : 'SIN CATEGORÍA',
        cantidad:     c.cantidad  >= 0 ? (parseInt(cells[c.cantidad], 10) || 0) : 0,
        ventasBrutas: c.brutas    >= 0 ? parseNum(cells[c.brutas]) : 0,
        descuentos:   c.descuentos>= 0 ? parseNum(cells[c.descuentos]) : 0,
        ventasNetas:  c.netas     >= 0 ? parseNum(cells[c.netas]) : 0,
        impuestos:    c.impuestos >= 0 ? parseNum(cells[c.impuestos]) : 0,
        subtotal:     null,
        vrUnit:       null,
      })
    }
  }

  // ── Modificadores por sede ──────────────────────────────────
  // La forma de cada fila replica la del importador por sede, porque el cálculo
  // de consumo de inventario ya consume `modificador` y `cantidadNeta`.
  if (idx.mods >= 0) {
    const hdr = lines[idx.mods].map(h => (h || '').toLowerCase())
    const iMod = hdr.findIndex(h =>
      (h === 'modifier' || h.includes('modificador')) && !h.includes('set') && !h.includes('grupo')
    )
    const c = {
      grupo:     buscarCol(hdr, 'modifier set', /grupo de modificador/),
      cantNeta:  buscarCol(hdr, 'net qty sold', /monto neto/, /neto vendido/),
      netas:     buscarCol(hdr, 'net sales', /ventas netas/),
      cantB:     buscarCol(hdr, 'qty sold', /monto vendido/),
      brutas:    buscarCol(hdr, 'gross sales', /ventas brutas/),
    }
    for (const cells of filasDeSeccion(lines, idx.mods)) {
      const sede = sedePorNombre(cells[0])
      if (!sede) continue
      const modificador = iMod >= 0 ? (cells[iMod] || '') : ''
      if (!modificador) continue
      sede.modificadores.push({
        grupo:        c.grupo    >= 0 ? (cells[c.grupo] || '') : '',
        modificador,
        cantidadNeta: c.cantNeta >= 0 ? (parseInt(cells[c.cantNeta], 10) || 0) : 0,
        ventasNetas:  c.netas    >= 0 ? parseNum(cells[c.netas]) : 0,
        cantidadB:    c.cantB    >= 0 ? (parseInt(cells[c.cantB], 10) || 0) : 0,
        ventasBrutas: c.brutas   >= 0 ? parseNum(cells[c.brutas]) : 0,
      })
    }
  }

  // ── Métodos de pago por sede ────────────────────────────────
  if (idx.pagos >= 0) {
    const hdr = lines[idx.pagos].map(h => (h || '').toLowerCase())
    const c = {
      metodo:    buscarCol(hdr, 'payment method', /m[eé]todo de pago/),
      monto:     buscarCol(hdr, 'payment amount', /monto del pago/),
      propinas:  buscarCol(hdr, 'tips', 'tip', /propinas/),
      recibido:  buscarCol(hdr, 'total collected', /total recibido/),
      comisiones:buscarCol(hdr, 'fees', /comisiones/),
      neto:      buscarCol(hdr, 'net total', /total neto/),
    }
    for (const cells of filasDeSeccion(lines, idx.pagos)) {
      const sede = sedePorNombre(cells[0])
      if (!sede) continue
      const metodo = (c.metodo >= 0 ? (cells[c.metodo] || '') : '').toLowerCase()
      // Se usa "Total Collected" y NO "Payment Amount": el primero ya viene neto
      // de devoluciones. Con "Payment Amount" la suma de efectivo+tarjeta+otro
      // excede lo realmente recibido cuando hubo un reembolso, y el movimiento
      // bancario quedaría inflado por ese valor.
      const monto  = c.recibido >= 0 ? parseNum(cells[c.recibido])
                   : (c.monto >= 0 ? parseNum(cells[c.monto]) : 0)

      // Square desglosa la tarjeta en muchas variantes (Dipped, Tapped, Keyed,
      // on File, Other); el importador solo necesita el total de tarjeta.
      if (metodo.startsWith('card') || metodo.startsWith('tarjeta')) {
        if (metodo.includes('gift') || metodo.includes('regalo')) sede.pagos.tarjetaRegalo += monto
        else sede.pagos.tarjeta += monto
      } else if (metodo === 'cash' || metodo === 'efectivo') {
        sede.pagos.efectivo += monto
      } else if (metodo.includes('gift card') || metodo.includes('tarjeta de regalo')) {
        sede.pagos.tarjetaRegalo += monto
      } else {
        sede.pagos.otro += monto           // Other, Cash App, Open Ticket…
      }

      sede.pagos.totalRecibido += monto
      sede.pagos.comisiones    += c.comisiones >= 0 ? parseNum(cells[c.comisiones]) : 0
      sede.pagos.totalNeto     += c.neto       >= 0 ? parseNum(cells[c.neto])       : 0
      sede.control.pagosPropinas += c.propinas >= 0 ? parseNum(cells[c.propinas])   : 0
    }
  }

  // ── Validación cruzada: el resumen y los métodos de pago deben coincidir ──
  const cerca = (a, b) => Math.abs((a || 0) - (b || 0)) <= 0.02
  for (const sede of sedes.values()) {
    const d = []
    if (!cerca(sede.pagos.totalRecibido, sede.control.resumenRecibido)) {
      d.push(`Total recibido: resumen ${sede.control.resumenRecibido.toFixed(2)} vs pagos ${sede.pagos.totalRecibido.toFixed(2)}`)
    }
    if (!cerca(sede.pagos.comisiones, sede.control.resumenComisiones)) {
      d.push(`Comisiones: resumen ${sede.control.resumenComisiones.toFixed(2)} vs pagos ${sede.pagos.comisiones.toFixed(2)}`)
    }
    if (!cerca(sede.control.pagosPropinas, sede.control.resumenPropinas)) {
      d.push(`Propinas: resumen ${sede.control.resumenPropinas.toFixed(2)} vs pagos ${sede.control.pagosPropinas.toFixed(2)}`)
    }
    // El desglose por forma de pago debe sumar exactamente lo recibido, porque
    // de ahí salen los movimientos bancarios de la importación.
    const sumaFormas = sede.pagos.efectivo + sede.pagos.tarjeta + sede.pagos.otro + sede.pagos.tarjetaRegalo
    if (!cerca(sumaFormas, sede.pagos.totalRecibido)) {
      d.push(`Efectivo+tarjeta+otro suma ${sumaFormas.toFixed(2)} pero lo recibido es ${sede.pagos.totalRecibido.toFixed(2)}`)
    }
    sede.control.diferencias = d
    sede.control.cuadra = d.length === 0
    // Las comisiones se guardan como valor absoluto (el importador las resta)
    sede.pagos.comisiones = Math.abs(sede.pagos.comisiones)
  }

  const periodo = fechasDelNombre(filename)
  return {
    periodo,
    sedes: Array.from(sedes.values()),
    aviso: idx.pagos < 0
      ? 'El archivo no trae la sección de Métodos de Pago; no se puede desglosar efectivo/tarjeta.'
      : null,
  }
}

export default parseConsolidado
