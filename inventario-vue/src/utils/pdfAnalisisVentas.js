// Informe gerencial en PDF del módulo Gerencia > Análisis de Ventas.
// Recibe la misma respuesta de /api/gerencia/analisis-ventas que pinta la pantalla
// y dibuja las gráficas en vectores con jsPDF (no captura las de ApexCharts), así
// el PDF sale nítido y con los mismos colores aunque la app esté en modo oscuro.
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import {
  C, PALETTE, M, FOOTER_H, num, fmt, fmtNum, fmtK, fmtVar, varPct, promDiario, pctTxt, headerPrincipal, headerContinuacion, pies, tituloSeccion, kpiCards, resumenEjecutivo, graficoMensual, barrasHorizontales,
} from './pdfInformeBase.js'

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
