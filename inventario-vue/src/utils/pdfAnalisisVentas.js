// Informe gerencial en PDF del módulo Gerencia > Análisis de Ventas.
// Recibe la misma respuesta de /api/gerencia/analisis-ventas que pinta la pantalla
// y dibuja las gráficas en vectores con jsPDF (no captura las de ApexCharts), así
// el PDF sale nítido y con los mismos colores aunque la app esté en modo oscuro.
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const C = {
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
const PALETTE = [C.accent, C.amber, C.violet, C.green, [239, 68, 68], [249, 115, 22], [14, 165, 233], [168, 85, 247], [16, 185, 129], [236, 72, 153]]

const M = 14            // margen lateral
const FOOTER_H = 14     // espacio reservado para el pie

// ── Formatos ────────────────────────────────────────────────────────────────
const num = v => parseFloat(v) || 0
function fmt(v) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num(v))
}
function fmtNum(v) {
  return new Intl.NumberFormat('es-CO').format(Math.round(num(v)))
}
// Monto compacto para etiquetas de gráficas: $139K, $1,6M
function fmtK(v) {
  const n = num(v)
  const a = Math.abs(n)
  if (a >= 1e6) return '$' + (n / 1e6).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + 'M'
  if (a >= 1e3) return '$' + Math.round(n / 1e3).toLocaleString('es-CO') + 'K'
  return '$' + Math.round(n)
}
function fmtVar(p) {
  return (p >= 0 ? '+' : '-') + Math.abs(p).toFixed(1) + '%'
}
function varPct(val, base) {
  const b = num(base)
  if (val === null || val === undefined || !b) return null
  return ((num(val) - b) / b) * 100
}
function promDiario(m) {
  if (!m || !(m.dias_con_venta > 0)) return null
  return num(m.ventas_brutas) / m.dias_con_venta
}
function pctTxt(part, total) {
  return total ? (part / total * 100).toFixed(1) + '%' : '0.0%'
}

// ── Piezas de dibujo ────────────────────────────────────────────────────────
function headerPrincipal(doc, o) {
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
  doc.text('Análisis de Ventas', M, 21)

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

function headerContinuacion(doc, o) {
  const W = doc.internal.pageSize.getWidth()
  doc.setFillColor(...C.navy)
  doc.rect(0, 0, W, 13, 'F')
  doc.setFillColor(...C.accent)
  doc.rect(0, 13, W, 0.8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...C.white)
  doc.text('Análisis de Ventas', M, 8.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(203, 213, 225)
  doc.text(`${String(o.empresaNombre || '').toUpperCase()}  ·  ${o.periodo}`, W - M, 8.5, { align: 'right' })
  return 22
}

function pies(doc, o) {
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
    doc.text(`${o.empresaNombre || ''}  ·  Informe gerencial de ventas  ·  Uso interno`, M, H - 6.5)
    doc.text(`Página ${i} de ${total}`, W - M, H - 6.5, { align: 'right' })
  }
}

function tituloSeccion(doc, y, titulo, nota) {
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

function kpiCards(doc, y, cards) {
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

function resumenEjecutivo(doc, y, puntos) {
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
function graficoMensual(doc, y, meses, promedio, mesActualYM) {
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
function barrasHorizontales(doc, y, filas, { anchoEtiqueta = 62, color = C.green, colorDe, alto = 6.4, extra, max: maxFijo, anchoTexto = 24 } = {}) {
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

function tablaDetalleMensual(doc, y, meses, mesActualYM, o) {
  const tot = meses.reduce((t, m) => ({
    b: t.b + num(m.ventas_brutas), d: t.d + num(m.devoluciones), n: t.n + num(m.ventas_netas), dias: t.dias + num(m.dias_con_venta),
  }), { b: 0, d: 0, n: 0, dias: 0 })

  const body = meses.map((m, i) => {
    const ant = meses[i - 1]
    const vNetas = m.mes !== mesActualYM && ant ? varPct(m.ventas_netas, ant.ventas_netas) : null
    const pd = promDiario(m)
    const vProm = varPct(pd, promDiario(ant))
    return [
      String(m.mes_label || m.mes) + (m.mes === mesActualYM ? ' *' : ''),
      fmt(m.ventas_brutas), fmt(m.devoluciones), fmt(m.ventas_netas),
      { content: vNetas === null ? '—' : fmtVar(vNetas), _var: vNetas },
      String(m.dias_con_venta ?? ''),
      pd === null ? '—' : fmt(pd),
      { content: vProm === null ? '—' : fmtVar(vProm), _var: vProm },
    ]
  })

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M, top: 22, bottom: FOOTER_H + 4 },
    head: [['Mes', 'Ventas brutas', 'Devoluciones', 'Ventas netas', 'Vs mes ant.', 'Días', 'Prom. diario', 'Vs mes ant.']],
    body,
    foot: [['TOTAL', fmt(tot.b), fmt(tot.d), fmt(tot.n), '', String(tot.dias), tot.dias ? fmt(tot.b / tot.dias) : '—', '']],
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 7.6, textColor: C.text, cellPadding: { top: 1.9, bottom: 1.9, left: 2, right: 2 }, halign: 'right' },
    headStyles: { fillColor: C.navy, textColor: C.white, fontStyle: 'bold', fontSize: 7 },
    footStyles: { fillColor: [241, 245, 249], textColor: C.navy, fontStyle: 'bold', lineWidth: { top: 0.4 }, lineColor: C.navy },
    alternateRowStyles: { fillColor: C.zebra },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold' }, 2: { textColor: C.muted }, 3: { fontStyle: 'bold' }, 5: { halign: 'center' } },
    didParseCell: (d) => {
      if (d.section === 'head' && d.column.index === 0) d.cell.styles.halign = 'left'
      if (d.section === 'head' && d.column.index === 5) d.cell.styles.halign = 'center'
      if (d.section === 'foot' && d.column.index === 5) d.cell.styles.halign = 'center'
      if (d.section === 'foot' && d.column.index === 0) d.cell.styles.halign = 'left'
      if (d.section === 'body' && (d.column.index === 4 || d.column.index === 7)) {
        const p = d.cell.raw?._var
        d.cell.styles.fontStyle = 'bold'
        d.cell.styles.textColor = p === null || p === undefined ? C.light : (p >= 0 ? C.greenDk : C.red)
      }
    },
    willDrawPage: (d) => { if (d.pageNumber > 1) headerContinuacion(doc, o) },
  })
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(6.8)
  doc.setTextColor(...C.muted)
  const yn = doc.lastAutoTable.finalY + 4
  doc.text('* Mes en curso (incompleto): su variación de ventas netas no se calcula. Prom. diario = ventas brutas / días con venta. "—" = sin mes anterior o base en cero.', M, yn)
  return yn + 2
}

// ── Generador ───────────────────────────────────────────────────────────────
export function generarPdfAnalisisVentas(data, { empresaNombre = '', usuario = '', locales = 'Todos los locales', ccostoFiltrado = false } = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const H = doc.internal.pageSize.getHeight()
  const W = doc.internal.pageSize.getWidth()
  const limite = H - FOOTER_H - 4

  const meses = data.ventasPorMes || []
  const mesActualYM = new Date().toISOString().slice(0, 7)
  const cerrados = meses.filter(m => m.mes !== mesActualYM)
  const enCurso = meses.find(m => m.mes === mesActualYM)
  const ultimoCerrado = cerrados[cerrados.length - 1]
  const penultimo = cerrados[cerrados.length - 2]
  const promNetasCerrados = (cerrados.length ? cerrados : meses).reduce((s, m) => s + num(m.ventas_netas), 0) / ((cerrados.length ? cerrados : meses).length || 1)
  const totalNetas = meses.reduce((s, m) => s + num(m.ventas_netas), 0)
  const kpis = data.kpis || {}

  const o = {
    empresaNombre,
    usuario,
    locales,
    periodo: meses.length ? `${meses[0].mes_label} – ${meses[meses.length - 1].mes_label}` : 'Últimos 12 meses',
    generado: new Date().toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  }

  let y = headerPrincipal(doc, o)
  const nueva = () => { doc.addPage(); return headerContinuacion(doc, o) }
  const asegurar = (alto) => { if (y + alto > limite) y = nueva() }

  // KPIs
  y = kpiCards(doc, y, [
    { label: 'Ventas brutas 12 meses', value: fmt(kpis.total12m), sub: `${meses.length} meses con ventas`, color: C.accent },
    { label: 'Ventas netas 12 meses', value: fmt(totalNetas), sub: `Devoluciones: ${fmt(meses.reduce((s, m) => s + num(m.devoluciones), 0))}`, color: C.green },
    { label: 'Promedio mensual', value: fmt(kpis.promedioMensual), sub: 'ventas brutas por mes', color: C.amber },
    { label: 'Mejor mes', value: kpis.mejorMes ? fmt(kpis.mejorMes.valor) : '—', sub: kpis.mejorMes?.label || '', color: C.violet },
  ]) + 9

  // Resumen ejecutivo
  const puntos = []
  if (ultimoCerrado) {
    const v = penultimo ? varPct(ultimoCerrado.ventas_netas, penultimo.ventas_netas) : null
    const vp = penultimo ? varPct(promDiario(ultimoCerrado), promDiario(penultimo)) : null
    puntos.push(`Último mes cerrado (${ultimoCerrado.mes_label}): ventas netas de ${fmt(ultimoCerrado.ventas_netas)}` +
      (v !== null ? `, ${fmtVar(v)} frente a ${penultimo.mes_label}` : '') +
      (vp !== null ? `; el promedio diario varió ${fmtVar(vp)}.` : '.'))
    const vsProm = varPct(ultimoCerrado.ventas_netas, promNetasCerrados)
    if (vsProm !== null) {
      puntos.push(Math.abs(vsProm) < 1
        ? `${ultimoCerrado.mes_label} quedó en línea con el promedio de ventas netas de los meses cerrados (${fmt(promNetasCerrados)}).`
        : `${ultimoCerrado.mes_label} quedó ${Math.abs(vsProm).toFixed(1)}% ${vsProm >= 0 ? 'por encima' : 'por debajo'} del promedio de ventas netas de los meses cerrados (${fmt(promNetasCerrados)}).`)
    }
  }
  if (enCurso) {
    const pd = promDiario(enCurso)
    const vp = varPct(pd, promDiario(ultimoCerrado))
    const [yy, mm] = enCurso.mes.split('-').map(Number)
    const diasMes = new Date(yy, mm, 0).getDate()
    const proy = enCurso.dias_con_venta > 0 ? num(enCurso.ventas_netas) / enCurso.dias_con_venta * diasMes : 0
    puntos.push(`Mes en curso (${enCurso.mes_label}, ${enCurso.dias_con_venta} días con venta): promedio diario de ${fmt(pd)}` +
      (vp !== null ? ` (${fmtVar(vp)} vs ${ultimoCerrado.mes_label})` : '') +
      `. A este ritmo cerraría en unos ${fmt(proy)} de ventas netas (estimado).`)
  }
  const dias = (data.ventasPorDiaSemana || []).map(r => ({ dow: parseInt(r.dow), v: num(r.avg_ventas) })).filter(r => r.v > 0)
  if (dias.length > 1) {
    const NOM = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
    const mx = dias.reduce((a, b) => (b.v > a.v ? b : a))
    const mn = dias.reduce((a, b) => (b.v < a.v ? b : a))
    puntos.push(`En los últimos 45 días el mejor día es el ${NOM[mx.dow]} (${fmt(mx.v)} en promedio) y el más flojo el ${NOM[mn.dow]} (${fmt(mn.v)}), una diferencia de ${(varPct(mx.v, mn.v) || 0).toFixed(0)}%.`)
  }
  const top = data.topProductos || []
  if (top.length && kpis.total12m) {
    const top3 = top.slice(0, 3).reduce((s, p) => s + num(p.total_ventas), 0)
    puntos.push(`El producto líder es ${top[0].nombre || top[0].codigo} con ${fmt(top[0].total_ventas)} (${pctTxt(num(top[0].total_ventas), num(kpis.total12m))} de las ventas brutas); los 3 primeros suman ${pctTxt(top3, num(kpis.total12m))}.`)
  }
  const dist = data.distribucionCcosto || []
  const totDist = dist.reduce((s, r) => s + num(r.total_ventas), 0)
  if (!ccostoFiltrado && dist.length > 1 && totDist) {
    puntos.push(`Por local, ${dist[0].ccosto_nombre || dist[0].ccosto} concentra el ${pctTxt(num(dist[0].total_ventas), totDist)} de las ventas de los últimos 12 meses.`)
  }
  if (puntos.length) {
    y = tituloSeccion(doc, y, 'Resumen ejecutivo')
    y = resumenEjecutivo(doc, y + 1, puntos) + 9
  }

  // Histórico mensual
  asegurar(72)
  y = tituloSeccion(doc, y, 'Histórico de ventas netas', 'Últimos 12 meses')
  y = graficoMensual(doc, y + 2, meses, promNetasCerrados, mesActualYM) + 8

  // Día de semana
  if (dias.length) {
    const ORDEN = [1, 2, 3, 4, 5, 6, 0]
    const NOM = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' }
    const mapa = Object.fromEntries((data.ventasPorDiaSemana || []).map(r => [parseInt(r.dow), num(r.avg_ventas)]))
    const filas = ORDEN.map(d => ({ etiqueta: NOM[d], valor: mapa[d] || 0, texto: fmt(mapa[d] || 0) }))
    const maxV = Math.max(...filas.map(f => f.valor))
    asegurar(14 + filas.length * 6.4)
    y = tituloSeccion(doc, y, 'Promedio de ventas por día de semana', 'Últimos 45 días · ventas brutas')
    y = barrasHorizontales(doc, y + 3, filas.map(f => ({ ...f, destacar: f.valor === maxV })), {
      anchoEtiqueta: 30, colorDe: f => (f.valor === maxV ? C.amber : C.accent),
    }) + 9
  }

  // Detalle mensual
  asegurar(40)
  y = tituloSeccion(doc, y, 'Detalle mensual')
  y = tablaDetalleMensual(doc, y + 1, meses, mesActualYM, o) + 8

  // Top 10 productos
  if (top.length) {
    asegurar(14 + top.length * 6.4)
    y = tituloSeccion(doc, y, 'Top 10 productos por ventas', 'Últimos 12 meses')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(...C.muted)
    doc.text('UNIDADES  ·  % VENTAS', W - M - 2, y + 1, { align: 'right' })
    y = barrasHorizontales(doc, y + 3, top.map((p, i) => ({
      etiqueta: `${i + 1}. ${p.nombre || p.codigo}`,
      valor: num(p.total_ventas),
      texto: fmt(p.total_ventas),
      cant: p.total_cant,
      destacar: i === 0,
    })), { anchoEtiqueta: 66, color: C.green, extra: f => `${fmtNum(f.cant)}  ·  ${pctTxt(f.valor, num(kpis.total12m))}` }) + 9
  }

  // Distribución por local y por categoría
  // La distribución por local siempre suma toda la empresa (el backend no aplica el filtro
  // de centro de costo a esa consulta), así que solo se imprime cuando no hay filtro.
  const bloques = [
    ...(ccostoFiltrado ? [] : [{ titulo: 'Distribución por local', filas: dist.map(r => ({ etiqueta: String(r.ccosto_nombre || r.ccosto), valor: num(r.total_ventas) })), total: totDist }]),
    { titulo: 'Distribución por categoría', filas: (data.ventasPorCategoria || []).map(r => ({ etiqueta: String(r.categoria), valor: num(r.total_ventas) })), total: (data.ventasPorCategoria || []).reduce((s, r) => s + num(r.total_ventas), 0) },
  ]
  bloques.forEach(b => {
    if (!b.filas.length) return
    asegurar(14 + Math.min(b.filas.length, 3) * 6.4)
    y = tituloSeccion(doc, y, b.titulo, 'Últimos 12 meses · ventas brutas')
    const maxB = Math.max(...b.filas.map(f => f.valor), 1)
    let yy = y + 3
    b.filas.forEach((f, i) => {
      if (yy + 6.4 > limite) yy = nueva()
      barrasHorizontales(doc, yy, [{ ...f, texto: `${fmt(f.valor)}  (${pctTxt(f.valor, b.total)})` }], {
        anchoEtiqueta: 62, max: maxB, anchoTexto: 34, colorDe: () => PALETTE[i % PALETTE.length],
      })
      yy += 6.4
    })
    y = yy + 9
  })

  pies(doc, o)
  return doc
}
