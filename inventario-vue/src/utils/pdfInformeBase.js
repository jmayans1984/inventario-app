// Piezas compartidas de los informes gerenciales en PDF (encabezados, pies, KPIs,
// resumen, barras y gráfica mensual). Las usan Análisis de Ventas y Composición de Ventas.
export const C = {
  navy:    [15, 23, 42],
  navy2:   [30, 41, 59],
  accent:  [6, 182, 212],
  amber:   [245, 158, 11],
  green:   [34, 197, 94],
  greenDk: [21, 128, 61],
  red:     [220, 38, 38],
  violet:  [139, 92, 246],
  text:    [30, 41, 59],
  muted:   [100, 116, 139],
  light:   [148, 163, 184],
  border:  [226, 232, 240],
  zebra:   [248, 250, 252],
  white:   [255, 255, 255],
}
export const PALETTE = [C.accent, C.amber, C.violet, C.green, [239, 68, 68], [249, 115, 22], [14, 165, 233], [168, 85, 247], [16, 185, 129], [236, 72, 153]]

export const M = 14            // margen lateral
export const FOOTER_H = 14     // espacio reservado para el pie

// ── Formatos ────────────────────────────────────────────────────────────────
export const num = v => parseFloat(v) || 0
export function fmt(v) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num(v))
}
export function fmtNum(v) {
  return new Intl.NumberFormat('es-CO').format(Math.round(num(v)))
}
// Monto compacto para etiquetas de gráficas: $139K, $1,6M
export function fmtK(v) {
  const n = num(v)
  const a = Math.abs(n)
  if (a >= 1e6) return '$' + (n / 1e6).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + 'M'
  if (a >= 1e3) return '$' + Math.round(n / 1e3).toLocaleString('es-CO') + 'K'
  return '$' + Math.round(n)
}
export function fmtVar(p) {
  return (p >= 0 ? '+' : '-') + Math.abs(p).toFixed(1) + '%'
}
export function varPct(val, base) {
  const b = num(base)
  if (val === null || val === undefined || !b) return null
  return ((num(val) - b) / b) * 100
}
export function promDiario(m) {
  if (!m || !(m.dias_con_venta > 0)) return null
  return num(m.ventas_brutas) / m.dias_con_venta
}
export function pctTxt(part, total) {
  return total ? (part / total * 100).toFixed(1) + '%' : '0.0%'
}

// ── Piezas de dibujo ────────────────────────────────────────────────────────
export function headerPrincipal(doc, o) {
  const W = doc.internal.pageSize.getWidth()
  doc.setFillColor(...C.navy)
  doc.rect(0, 0, W, 38, 'F')
  doc.setFillColor(...C.accent)
  doc.rect(0, 38, W, 1.2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C.accent)
  doc.text('INFORME GERENCIAL', M, 12)

  doc.setFontSize(20)
  doc.setTextColor(...C.white)
  doc.text(o.titulo || 'Análisis de Ventas', M, 21)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(203, 213, 225)
  doc.text(String(o.empresaNombre || '').toUpperCase(), M, 28.5)

  const rx = W - M
  doc.setFontSize(7.5)
  doc.setTextColor(...C.light)
  const filas = [
    ['Periodo', o.periodo],
    ['Locales', o.locales],
    ['Generado', o.generado],
    ['Usuario', o.usuario || '—'],
  ]
  filas.forEach(([k, v], i) => {
    const y = 12 + i * 5.2
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.white)
    doc.text(String(v), rx, y, { align: 'right' })
    const vw = doc.getTextWidth(String(v))
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.light)
    doc.text(k + ':', rx - vw - 2, y, { align: 'right' })
  })
  return 48
}

export function headerContinuacion(doc, o) {
  const W = doc.internal.pageSize.getWidth()
  doc.setFillColor(...C.navy)
  doc.rect(0, 0, W, 13, 'F')
  doc.setFillColor(...C.accent)
  doc.rect(0, 13, W, 0.8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...C.white)
  doc.text(o.titulo || 'Análisis de Ventas', M, 8.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(203, 213, 225)
  doc.text(`${String(o.empresaNombre || '').toUpperCase()}  ·  ${o.periodo}`, W - M, 8.5, { align: 'right' })
  return 22
}

export function pies(doc, o) {
  const total = doc.getNumberOfPages()
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.3)
    doc.line(M, H - 11, W - M, H - 11)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C.muted)
    doc.text(`${o.empresaNombre || ''}  ·  ${o.pie || 'Informe gerencial de ventas'}  ·  Uso interno`, M, H - 6.5)
    doc.text(`Página ${i} de ${total}`, W - M, H - 6.5, { align: 'right' })
  }
}

export function tituloSeccion(doc, y, titulo, nota) {
  const W = doc.internal.pageSize.getWidth()
  doc.setFillColor(...C.accent)
  doc.rect(M, y - 4, 1.4, 5.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...C.navy)
  doc.text(titulo, M + 4, y)
  if (nota) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...C.muted)
    doc.text(nota, W - M, y, { align: 'right' })
  }
  return y + 5
}

export function kpiCards(doc, y, cards) {
  const W = doc.internal.pageSize.getWidth()
  const gap = 4
  const w = (W - 2 * M - gap * (cards.length - 1)) / cards.length
  const h = 24
  cards.forEach((k, i) => {
    const x = M + i * (w + gap)
    doc.setFillColor(...C.white)
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, y, w, h, 2, 2, 'FD')
    doc.setFillColor(...k.color)
    doc.rect(x, y + 2, 1.2, h - 4, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.8)
    doc.setTextColor(...C.muted)
    doc.text(k.label.toUpperCase(), x + 5, y + 7)
    doc.setFontSize(13.5)
    doc.setTextColor(...C.navy)
    doc.text(k.value, x + 5, y + 15)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C.muted)
    doc.text(doc.splitTextToSize(k.sub || '', w - 8)[0] || '', x + 5, y + 20.5)
  })
  return y + h
}

export function resumenEjecutivo(doc, y, puntos) {
  const W = doc.internal.pageSize.getWidth()
  const ancho = W - 2 * M - 12
  doc.setFontSize(8.6)
  const lineas = puntos.map(p => doc.splitTextToSize(p, ancho))
  const alto = lineas.reduce((s, l) => s + l.length * 4.1 + 1.8, 0) + 6
  doc.setFillColor(...C.zebra)
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.roundedRect(M, y, W - 2 * M, alto, 2, 2, 'FD')
  let yy = y + 6.5
  lineas.forEach(l => {
    doc.setFillColor(...C.accent)
    doc.circle(M + 5, yy - 1.1, 0.9, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.6)
    doc.setTextColor(...C.text)
    doc.text(l, M + 9, yy)
    yy += l.length * 4.1 + 1.8
  })
  return y + alto
}

// Barras verticales por mes con línea punteada del promedio
export function graficoMensual(doc, y, meses, promedio, mesActualYM) {
  const W = doc.internal.pageSize.getWidth()
  const h = 62
  const x0 = M + 16
  const x1 = W - M
  const yBase = y + h - 8
  const yTop = y + 6
  const vals = meses.map(m => num(m.ventas_netas))
  const max = Math.max(...vals, promedio, 1) * 1.12
  const escala = v => yBase - (v / max) * (yBase - yTop)

  // Rejilla y eje
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...C.light)
  doc.setLineWidth(0.15)
  for (let i = 0; i <= 4; i++) {
    const v = (max / 4) * i
    const yy = escala(v)
    doc.setDrawColor(...C.border)
    doc.line(x0, yy, x1, yy)
    doc.text(fmtK(v), x0 - 2, yy + 1, { align: 'right' })
  }

  const n = meses.length || 1
  const slot = (x1 - x0) / n
  const bw = Math.min(slot * 0.58, 11)
  meses.forEach((m, i) => {
    const v = vals[i]
    const cx = x0 + slot * i + slot / 2
    const top = escala(v)
    const enCurso = m.mes === mesActualYM
    doc.setFillColor(...(enCurso ? C.light : C.accent))
    if (yBase - top > 0.3) doc.roundedRect(cx - bw / 2, top, bw, yBase - top, 0.8, 0.8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.3)
    doc.setTextColor(...C.navy2)
    doc.text(fmtK(v), cx, top - 1.5, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.muted)
    doc.text(String(m.mes_label || m.mes), cx, yBase + 4.5, { align: 'center' })
  })

  // Promedio
  const yp = escala(promedio)
  doc.setDrawColor(...C.amber)
  doc.setLineWidth(0.5)
  doc.setLineDashPattern([1.6, 1.2], 0)
  doc.line(x0, yp, x1, yp)
  doc.setLineDashPattern([], 0)

  // Leyenda
  const ly = y + 1
  doc.setFontSize(7)
  doc.setFillColor(...C.accent)
  doc.rect(x1 - 92, ly - 2.3, 3, 3, 'F')
  doc.setTextColor(...C.muted)
  doc.text('Ventas netas', x1 - 88, ly)
  doc.setFillColor(...C.light)
  doc.rect(x1 - 66, ly - 2.3, 3, 3, 'F')
  doc.text('Mes en curso', x1 - 62, ly)
  doc.setDrawColor(...C.amber)
  doc.setLineDashPattern([1.6, 1.2], 0)
  doc.line(x1 - 39, ly - 0.8, x1 - 33, ly - 0.8)
  doc.setLineDashPattern([], 0)
  doc.text(`Promedio ${fmtK(promedio)}`, x1 - 31, ly)
  return y + h
}

// Barras horizontales con etiqueta a la izquierda y valor a la derecha
export function barrasHorizontales(doc, y, filas, { anchoEtiqueta = 62, color = C.green, colorDe, alto = 6.4, extra, max: maxFijo, anchoTexto = 24 } = {}) {
  const W = doc.internal.pageSize.getWidth()
  const xL = M
  const xB = M + anchoEtiqueta
  const anchoExtra = extra ? 46 : 0
  const xMax = W - M - anchoTexto - anchoExtra
  const max = maxFijo || Math.max(...filas.map(f => f.valor), 1)
  filas.forEach((f, i) => {
    const yy = y + i * alto
    if (i % 2 === 0) {
      doc.setFillColor(...C.zebra)
      doc.rect(M, yy, W - 2 * M, alto, 'F')
    }
    const cy = yy + alto / 2
    doc.setFont('helvetica', f.destacar ? 'bold' : 'normal')
    doc.setFontSize(7.6)
    doc.setTextColor(...C.text)
    const etq = doc.splitTextToSize(f.etiqueta, anchoEtiqueta - 3)[0]
    doc.text(etq, xL + 2, cy + 1.2)
    const w = Math.max((f.valor / max) * (xMax - xB), 0.6)
    doc.setFillColor(...(colorDe ? colorDe(f, i) : color))
    doc.roundedRect(xB, cy - 1.9, w, 3.8, 0.8, 0.8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.2)
    doc.setTextColor(...C.navy2)
    doc.text(f.texto, xB + w + 2, cy + 1.2)
    if (extra) {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.muted)
      doc.text(extra(f), W - M - 2, cy + 1.2, { align: 'right' })
    }
  })
  return y + filas.length * alto
}
