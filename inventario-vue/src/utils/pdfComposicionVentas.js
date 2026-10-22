// Informe gerencial en PDF de Gerencia > Composición de Ventas por Sede.
// Usa la misma respuesta de /api/gerencia/composicion-ventas que pinta la pantalla,
// ya filtrada por el selector de fechas (esta pantalla no tiene centro de costo).
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  C, M, FOOTER_H, num, fmt, pctTxt,
  headerPrincipal, headerContinuacion, pies, tituloSeccion, kpiCards, resumenEjecutivo,
} from './pdfInformeBase.js'

// Mismos colores por sede que la pantalla: un color significa siempre la misma sede.
const SEDE_RGB = [
  [79, 70, 229], [8, 145, 178], [184, 114, 11], [21, 128, 61], [220, 38, 38],
  [124, 58, 237], [219, 39, 119], [2, 132, 199], [101, 163, 13], [234, 88, 12],
]

// Escala del mapa de calor (igual que la pantalla)
const HEAT = [
  { hasta: 0.001, rgb: [148, 163, 184], texto: [30, 41, 59] },
  { hasta: 2,     rgb: [187, 247, 208], texto: [30, 41, 59] },
  { hasta: 6,     rgb: [134, 239, 172], texto: [30, 41, 59] },
  { hasta: 12,    rgb: [253, 224, 71],  texto: [30, 41, 59] },
  { hasta: 25,    rgb: [251, 146, 60],  texto: [30, 41, 59] },
  { hasta: Infinity, rgb: [239, 68, 68], texto: [255, 255, 255] },
]

const BASE = 'ventas_netas'
const pct = v => num(v).toFixed(1) + '%'
const fechaCorta = iso => (iso ? iso.split('-').reverse().join('/') : '')

export function generarPdfComposicionVentas(data, { empresaNombre = '', usuario = '' } = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const limite = H - FOOTER_H - 4

  const sedes = data.sedes || []
  const conceptos = data.conceptos || []
  const tot = data.totales || {}
  const diasTot = num(tot.dias_operados)
  const ventaDia = diasTot ? num(tot.ventas_netas) / diasTot : 0

  // Porcentaje de una fila (sede o consolidado) sobre ventas netas
  const pctDe = (fila, key) => {
    const b = num(fila?.[BASE])
    return b > 0 ? (num(fila?.[key]) / b) * 100 : 0
  }
  // Marca una celda cuando se aparta más de 15% relativo del consolidado
  const tono = (c, sede) => {
    const ref = pctDe(tot, c.key)
    if (!ref) return null
    const dif = pctDe(sede, c.key) - ref
    if (Math.abs(dif) < ref * 0.15) return null
    if (c.sentido === 'neutro') return 'dif'
    const peor = c.sentido === 'menos_mejor' ? dif > 0 : dif < 0
    return peor ? 'peor' : 'mejor'
  }

  const o = {
    titulo: 'Composición de Ventas',
    pie: 'Composición de ventas por sede',
    empresaNombre,
    usuario,
    periodo: `${fechaCorta(data.periodo?.desde)} – ${fechaCorta(data.periodo?.hasta)}`,
    locales: sedes.length === 1 ? sedes[0].nombre : `${sedes.length} sedes`,
    generado: new Date().toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  }

  let y = headerPrincipal(doc, o)
  const nueva = () => { doc.addPage(); return headerContinuacion(doc, o) }
  const asegurar = alto => { if (y + alto > limite) y = nueva() }

  // ── KPIs consolidados ────────────────────────────────────────────────────
  y = kpiCards(doc, y, [
    { label: 'Ventas netas', value: fmt(tot.ventas_netas), sub: `${sedes.length} sede(s) · ${diasTot} días`, color: C.accent },
    { label: 'Venta neta por día', value: fmt(ventaDia), sub: 'promedio consolidado', color: C.green },
    { label: 'Descuentos', value: pct(pctDe(tot, 'descuentos')), sub: `${fmt(tot.descuentos)} sobre ventas netas`, color: C.amber },
    { label: 'Comisiones', value: pct(pctDe(tot, 'comisiones')), sub: `${fmt(tot.comisiones)} sobre ventas netas`, color: C.violet },
  ]) + 9

  // ── Resumen ejecutivo ────────────────────────────────────────────────────
  const puntos = []
  if (sedes.length) {
    puntos.push(`Ventas netas de ${fmt(tot.ventas_netas)} entre ${sedes.length} sede(s) y ${diasTot} días operados, con un promedio de ${fmt(ventaDia)} por día.`)
  }
  if (sedes.length > 1) {
    const lider = sedes[0]
    const menor = sedes[sedes.length - 1]
    puntos.push(`${lider.nombre} concentra ${pctTxt(lider.ventas_netas, tot.ventas_netas)} de la venta neta; ${menor.nombre} es la más pequeña, con ${pctTxt(menor.ventas_netas, tot.ventas_netas)}.`)

    const brechas = conceptos.map(c => {
      const vals = sedes.map(s => ({ v: pctDe(s, c.key), nombre: s.nombre }))
      const min = vals.reduce((a, b) => (b.v < a.v ? b : a))
      const max = vals.reduce((a, b) => (b.v > a.v ? b : a))
      return { label: c.label, min: min.v, max: max.v, sedeMin: min.nombre, sedeMax: max.nombre, spread: max.v - min.v }
    })
      .filter(b => b.spread > 0.05)
      .sort((a, b) => b.spread - a.spread)
      .slice(0, 2)
    brechas.forEach(b => {
      puntos.push(`Mayor separación en ${b.label.toLowerCase()}: ${pct(b.min)} en ${b.sedeMin} frente a ${pct(b.max)} en ${b.sedeMax} (${b.spread.toFixed(1)} puntos).`)
    })
  }
  const recaudo = num(tot.tarjetas) + num(tot.efectivo) + num(tot.otros)
  if (recaudo > 0) {
    puntos.push(`Del dinero recaudado, ${pctTxt(tot.tarjetas, recaudo)} llega con tarjeta y ${pctTxt(tot.efectivo, recaudo)} en efectivo.`)
  }
  if (puntos.length) {
    y = tituloSeccion(doc, y, 'Resumen ejecutivo')
    y = resumenEjecutivo(doc, y + 1, puntos) + 9
  }

  // ── Tabla comparativa por concepto ───────────────────────────────────────
  asegurar(40)
  y = tituloSeccion(doc, y, 'Composición por concepto', `% sobre ventas netas`)

  const cabeza = ['Concepto', ...sedes.map(s => s.nombre), 'Consolidado']
  const ancho = sedes.length + 2
  const celdaPct = (fila, key, ref) => {
    const p = pctDe(fila, key)
    return { content: `${pct(p)}\n${fmt(fila[key])}`, _tono: ref }
  }

  const body = [
    [{ content: 'Ventas netas', styles: { fontStyle: 'bold' } },
      ...sedes.map(s => fmt(s.ventas_netas)),
      { content: fmt(tot.ventas_netas), styles: { fontStyle: 'bold' } }],
  ]
  const grupos = new Map()
  for (const c of conceptos) {
    if (!grupos.has(c.grupo)) grupos.set(c.grupo, [])
    grupos.get(c.grupo).push(c)
  }
  for (const [nombre, items] of grupos) {
    body.push([{ content: nombre.toUpperCase(), colSpan: ancho, styles: { fontStyle: 'bold', textColor: C.accent, fillColor: [241, 245, 249] } }])
    for (const c of items) {
      body.push([
        { content: c.label, styles: { halign: 'left' } },
        ...sedes.map(s => celdaPct(s, c.key, tono(c, s))),
        { content: `${pct(pctDe(tot, c.key))}\n${fmt(tot[c.key])}`, styles: { fontStyle: 'bold' } },
      ])
    }
  }
  body.push([{ content: 'OPERACIÓN', colSpan: ancho, styles: { fontStyle: 'bold', textColor: C.accent, fillColor: [241, 245, 249] } }])
  body.push([
    { content: 'Días operados', styles: { halign: 'left' } },
    ...sedes.map(s => String(s.dias_operados)),
    { content: String(diasTot), styles: { fontStyle: 'bold' } },
  ])
  body.push([
    { content: 'Venta neta por día', styles: { halign: 'left' } },
    ...sedes.map(s => fmt(s.dias_operados ? s.ventas_netas / s.dias_operados : 0)),
    { content: fmt(ventaDia), styles: { fontStyle: 'bold' } },
  ])
  body.push([
    { content: 'Participación en la venta', styles: { halign: 'left' } },
    ...sedes.map(s => pctTxt(s.ventas_netas, tot.ventas_netas)),
    { content: '100.0%', styles: { fontStyle: 'bold' } },
  ])

  const COLOR_TONO = { peor: C.red, mejor: C.greenDk, dif: C.navy }

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M, top: 22, bottom: FOOTER_H + 4 },
    head: [cabeza],
    body,
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 7, textColor: C.text, cellPadding: { top: 1.6, bottom: 1.6, left: 1.6, right: 1.6 }, halign: 'right', valign: 'middle', lineWidth: 0 },
    headStyles: { fillColor: C.navy, textColor: C.white, fontStyle: 'bold', fontSize: 6.8, halign: 'right' },
    alternateRowStyles: { fillColor: C.zebra },
    columnStyles: { 0: { halign: 'left', cellWidth: 40 } },
    willDrawPage: (d) => { if (d.pageNumber > 1) headerContinuacion(doc, o) },
    didParseCell: (d) => {
      if (d.section === 'head' && d.column.index === 0) d.cell.styles.halign = 'left'
      if (d.section !== 'body') return
      const raw = d.cell.raw
      if (raw && raw._tono) {
        d.cell.styles.textColor = COLOR_TONO[raw._tono]
        d.cell.styles.fontStyle = 'bold'
      }
      if (raw && raw.content && String(raw.content).includes('\n')) d.cell.styles.fontSize = 6.6
    },
  })
  y = doc.lastAutoTable.finalY + 4

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(6.6)
  doc.setTextColor(...C.muted)
  const notaTabla = doc.splitTextToSize(
    'Cada celda muestra el porcentaje sobre ventas netas y, debajo, el monto. Se marca en rojo o verde cuando una sede se aparta más de 15% relativo del consolidado; el color depende de si ese concepto es bueno o malo para el negocio.',
    W - 2 * M,
  )
  doc.text(notaTabla, M, y)
  y += notaTabla.length * 3 + 6

  // ── Cada concepto, sede contra sede ──────────────────────────────────────
  asegurar(40)
  y = tituloSeccion(doc, y, 'Cada concepto, sede contra sede', `% sobre ventas netas`)
  y = leyendaSedes(doc, y + 2, sedes)

  const x0 = M + 42
  const barraMax = W - M - x0 - 18
  const maxV = Math.max(1, ...conceptos.flatMap(c => sedes.map(s => pctDe(s, c.key))))
  const altoSede = 3.5
  for (const c of conceptos) {
    const alto = sedes.length * altoSede + 3
    if (y + alto > limite) y = nueva()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.4)
    doc.setTextColor(...C.text)
    doc.text(c.label, M + 2, y + 3)
    sedes.forEach((s, i) => {
      const v = pctDe(s, c.key)
      const yy = y + i * altoSede
      const w = Math.max((v / maxV) * barraMax, v > 0 ? 0.6 : 0)
      doc.setFillColor(...SEDE_RGB[i % SEDE_RGB.length])
      if (w > 0) doc.roundedRect(x0, yy, w, altoSede - 1, 0.6, 0.6, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.3)
      doc.setTextColor(...C.muted)
      doc.text(pct(v), x0 + w + 1.5, yy + 2.2)
    })
    y += alto
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.15)
    doc.line(M, y - 1.2, W - M, y - 1.2)
  }
  y += 6

  // ── Medios de pago ───────────────────────────────────────────────────────
  asegurar(14 + sedes.length * 8 + 8)
  y = tituloSeccion(doc, y, 'Con qué le pagan a cada sede', '% del recaudo')
  const medios = [
    { key: 'tarjetas', label: 'Tarjetas', rgb: [79, 70, 229] },
    { key: 'efectivo', label: 'Efectivo', rgb: [21, 128, 61] },
    { key: 'otros', label: 'Otros medios', rgb: [184, 114, 11] },
  ]
  y = leyendaMedios(doc, y + 2, medios)
  const xm0 = M + 50
  const anchoBarra = W - M - xm0 - 2
  for (const s of sedes) {
    const rec = medios.reduce((t, m) => t + num(s[m.key]), 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.8)
    doc.setTextColor(...C.text)
    doc.text(doc.splitTextToSize(s.nombre, 46)[0], M + 2, y + 4.6)
    let x = xm0
    if (rec > 0) {
      for (const m of medios) {
        const share = (num(s[m.key]) / rec) * 100
        const w = (share / 100) * anchoBarra
        if (w <= 0) continue
        doc.setFillColor(...m.rgb)
        doc.rect(x, y, w, 6, 'F')
        if (share >= 7) {
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(6.6)
          doc.setTextColor(...C.white)
          doc.text(`${share.toFixed(0)}%`, x + w / 2, y + 4, { align: 'center' })
        }
        x += w
      }
    }
    y += 8
  }
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(6.6)
  doc.setTextColor(...C.muted)
  doc.text('El recaudo suma tarjetas, efectivo y otros medios; incluye impuestos y propinas, por eso no es igual a la venta neta.', M, y + 1)
  y += 8

  // ── Mapa de calor concepto × sede ────────────────────────────────────────
  // Página propia: la tabla de calor no debe partirse y dejar una fila suelta
  y = nueva()
  y = tituloSeccion(doc, y, 'Mapa de calor concepto × sede', '% sobre ventas netas')
  const rangoDe = v => HEAT.find(r => v <= r.hasta)
  autoTable(doc, {
    startY: y + 3,
    margin: { left: M, right: M, top: 22, bottom: FOOTER_H + 4 },
    head: [['Concepto', ...sedes.map(s => s.nombre)]],
    body: conceptos.map(c => [
      { content: c.label, styles: { halign: 'left', fontStyle: 'bold' } },
      ...sedes.map(s => {
        const v = Number(pctDe(s, c.key).toFixed(2))
        const r = rangoDe(v)
        return { content: v > 0 ? pct(v) : '—', _heat: r }
      }),
    ]),
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 7.2, cellPadding: { top: 2, bottom: 2, left: 1.6, right: 1.6 }, halign: 'center', lineWidth: 0.6, lineColor: [255, 255, 255] },
    headStyles: { fillColor: C.navy, textColor: C.white, fontStyle: 'bold', fontSize: 6.8, halign: 'center' },
    columnStyles: { 0: { halign: 'left', cellWidth: 40 } },
    willDrawPage: (d) => { if (d.pageNumber > 1) headerContinuacion(doc, o) },
    didParseCell: (d) => {
      if (d.section !== 'body' || d.column.index === 0) return
      const r = d.cell.raw?._heat
      if (!r) return
      d.cell.styles.fillColor = r.rgb
      d.cell.styles.textColor = r.texto
      d.cell.styles.fontStyle = 'bold'
    },
  })
  y = doc.lastAutoTable.finalY + 4
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(6.6)
  doc.setTextColor(...C.muted)
  doc.text('Entre más intenso el color, mayor peso del concepto sobre la venta neta de la sede. "—" = sin registros.', M, y)

  pies(doc, o)
  return doc
}

// Leyenda de sedes con su color, en una o varias líneas
function leyendaSedes(doc, y, sedes) {
  const W = doc.internal.pageSize.getWidth()
  let x = M
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  sedes.forEach((s, i) => {
    const txt = s.nombre
    const ancho = doc.getTextWidth(txt) + 10
    if (x + ancho > W - M) { x = M; y += 5 }
    doc.setFillColor(...SEDE_RGB[i % SEDE_RGB.length])
    doc.rect(x, y - 2.3, 3, 3, 'F')
    doc.setTextColor(...C.text)
    doc.text(txt, x + 4.2, y)
    x += ancho
  })
  return y + 6
}

function leyendaMedios(doc, y, medios) {
  let x = M + 50
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  medios.forEach(m => {
    doc.setFillColor(...m.rgb)
    doc.rect(x, y - 2.3, 3, 3, 'F')
    doc.setTextColor(...C.text)
    doc.text(m.label, x + 4.2, y)
    x += doc.getTextWidth(m.label) + 14
  })
  return y + 6
}
