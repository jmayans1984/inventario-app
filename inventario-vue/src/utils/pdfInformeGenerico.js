// Informe gerencial genérico en PDF. Los módulos de Gerencia le pasan sus KPIs,
// un resumen en puntos y sus tablas; el estilo (encabezado, pie, KPIs, títulos)
// es el mismo que el de Análisis de Ventas y Composición de Ventas.
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  C, M, FOOTER_H,
  headerPrincipal, headerContinuacion, pies, tituloSeccion, kpiCards, resumenEjecutivo,
} from './pdfInformeBase.js'

// secciones: [{ titulo, nota?, head, body, foot?, columnStyles?, celda? }]
//   celda(d): opcional, recibe el dato de didParseCell para colorear celdas.
// kpis: [{ label, value, sub?, color }] (hasta 4 por fila)
export function generarInformeGerencial({
  titulo, pie, empresaNombre = '', usuario = '', periodo = '', locales = 'Toda la empresa',
  orientacion = 'portrait', kpis = [], puntos = [], secciones = [],
}) {
  const doc = new jsPDF({ orientation: orientacion, unit: 'mm', format: 'letter' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const limite = H - FOOTER_H - 4

  const o = {
    titulo, pie, empresaNombre, usuario, periodo, locales,
    generado: new Date().toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  }
  let y = headerPrincipal(doc, o)
  const nueva = () => { doc.addPage(); return headerContinuacion(doc, o) }
  const asegurar = alto => { if (y + alto > limite) y = nueva() }

  if (kpis.length) {
    for (let i = 0; i < kpis.length; i += 4) {
      y = kpiCards(doc, y, kpis.slice(i, i + 4)) + 7
    }
  }

  if (puntos.length) {
    y = tituloSeccion(doc, y, 'Resumen ejecutivo')
    y = resumenEjecutivo(doc, y + 1, puntos) + 9
  }

  for (const s of secciones) {
    asegurar(30)
    y = tituloSeccion(doc, y, s.titulo, s.nota)
    autoTable(doc, {
      startY: y + 2,
      margin: { left: M, right: M, top: 22, bottom: FOOTER_H + 4 },
      head: [s.head],
      body: s.body,
      foot: s.foot ? [s.foot] : undefined,
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 7.2, textColor: C.text, cellPadding: { top: 1.7, bottom: 1.7, left: 1.8, right: 1.8 }, halign: 'right', valign: 'middle', lineWidth: 0 },
      headStyles: { fillColor: C.navy, textColor: C.white, fontStyle: 'bold', fontSize: 6.8, halign: 'right' },
      footStyles: { fillColor: [241, 245, 249], textColor: C.navy, fontStyle: 'bold', lineWidth: { top: 0.4 }, lineColor: C.navy },
      alternateRowStyles: { fillColor: C.zebra },
      columnStyles: { 0: { halign: 'left' }, ...(s.columnStyles || {}) },
      willDrawPage: (d) => { if (d.pageNumber > 1) headerContinuacion(doc, o) },
      didParseCell: (d) => {
        if (d.section === 'head' && d.column.index === 0) d.cell.styles.halign = 'left'
        if (d.section === 'foot' && d.column.index === 0) d.cell.styles.halign = 'left'
        if (s.celda) s.celda(d)
      },
    })
    y = doc.lastAutoTable.finalY + 9
  }

  pies(doc, o)
  return doc
}

// Formatos compartidos por los módulos
export const pesos = v => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(parseFloat(v) || 0)
export const numero = v => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(parseFloat(v) || 0)
export const porcentaje = (v, dec = 1) => (v === null || v === undefined || isNaN(parseFloat(v)) ? '—' : (parseFloat(v)).toFixed(dec) + '%')
export const variacion = (val, base) => {
  const b = parseFloat(base)
  if (!b || val === null || val === undefined) return null
  return ((parseFloat(val) - b) / b) * 100
}
export const txtVar = p => (p === null ? '—' : (p >= 0 ? '+' : '') + p.toFixed(1) + '%')
export const colorVar = (p, { mejorSiBaja = false } = {}) => {
  if (p === null) return null
  const bueno = mejorSiBaja ? p <= 0 : p >= 0
  return bueno ? C.greenDk : C.red
}
