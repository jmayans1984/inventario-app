export const PDF_COLORS = {
  black: [0, 0, 0],
  text: [22, 22, 22],
  muted: [72, 72, 72],
  rule: [0, 0, 0],
  softRule: [115, 115, 115],
}

export function drawReportHeader(doc, {
  title,
  subtitle = '',
  empresa = 'EMPRESA',
  usuario = 'Usuario',
  generatedAt = new Date(),
  margin = 10,
  moduleName = 'Modulo de tesoreria | Reportes',
} = {}) {
  const pageW = doc.internal.pageSize.getWidth()
  const top = 8
  const fecha = generatedAt.toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  doc.setDrawColor(...PDF_COLORS.rule)
  doc.setLineWidth(0.45)
  doc.line(margin, top, pageW - margin, top)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...PDF_COLORS.black)
  doc.text(String(empresa || 'EMPRESA').toUpperCase(), margin, top + 6)

  doc.setFontSize(10)
  doc.text(String(title || '').toUpperCase(), pageW - margin, top + 6, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...PDF_COLORS.text)
  if (subtitle) doc.text(String(subtitle), margin, top + 11.5)
  doc.text(`Generado: ${fecha}`, pageW - margin, top + 11.5, { align: 'right' })

  doc.setFontSize(6)
  doc.setTextColor(...PDF_COLORS.muted)
  doc.text(moduleName, margin, top + 16)
  doc.text(`Usuario: ${usuario || 'Usuario'}`, pageW - margin, top + 16, { align: 'right' })

  doc.setDrawColor(...PDF_COLORS.rule)
  doc.setLineWidth(0.32)
  doc.line(margin, top + 19, pageW - margin, top + 19)

  return top + 24
}

export function drawReportFooter(doc, {
  pageNumber,
  margin = 10,
} = {}) {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const page = pageNumber || doc.internal.getCurrentPageInfo().pageNumber
  const y = pageH - 9

  doc.setDrawColor(...PDF_COLORS.softRule)
  doc.setLineWidth(0.18)
  doc.line(margin, y - 2, pageW - margin, y - 2)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(...PDF_COLORS.muted)
  doc.text('Documento generado por el sistema', margin, y + 1.5)
  doc.text(`Pagina ${page}`, pageW - margin, y + 1.5, { align: 'right' })
}

export function summaryTableOptions(margin = 10) {
  return {
    theme: 'plain',
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      textColor: PDF_COLORS.text,
      fillColor: false,
      halign: 'center',
      cellPadding: { top: 1.4, right: 2, bottom: 1.4, left: 2 },
      lineWidth: 0,
    },
    headStyles: {
      fillColor: false,
      textColor: PDF_COLORS.black,
      fontStyle: 'bold',
      fontSize: 6.2,
      halign: 'center',
      lineWidth: { top: 0.25, bottom: 0.35 },
      lineColor: PDF_COLORS.rule,
    },
    bodyStyles: { fontStyle: 'bold', halign: 'center' },
    didParseCell: (data) => {
      data.cell.styles.fillColor = false
    },
  }
}

export function alignReportCell(data, alignments = {}) {
  data.cell.styles.fillColor = false
  const align = alignments[data.column.index]
  if (align) data.cell.styles.halign = align
}

export function detailTableOptions(margin = 10) {
  return {
    theme: 'plain',
    margin: { left: margin, right: margin, bottom: 13 },
    styles: {
      font: 'helvetica',
      fontSize: 7,
      textColor: PDF_COLORS.text,
      fillColor: false,
      cellPadding: { top: 1.2, right: 1.8, bottom: 1.2, left: 1.8 },
      lineWidth: 0,
    },
    headStyles: {
      fillColor: false,
      textColor: PDF_COLORS.black,
      fontStyle: 'bold',
      fontSize: 6.2,
      lineWidth: { top: 0.25, bottom: 0.35 },
      lineColor: PDF_COLORS.rule,
    },
    footStyles: {
      fillColor: false,
      textColor: PDF_COLORS.black,
      fontStyle: 'bold',
      lineWidth: { top: 0.45, bottom: 0.35 },
      lineColor: PDF_COLORS.rule,
    },
    alternateRowStyles: { fillColor: false },
    didParseCell: (data) => {
      data.cell.styles.fillColor = false
    },
  }
}
