// Informes PDF de los módulos de Gerencia que aún no tenían uno. Cada función recibe
// la misma respuesta que pinta la pantalla y arma KPIs, resumen y tablas.
import { generarInformeGerencial, pesos, numero, porcentaje, variacion, txtVar, colorVar } from './pdfInformeGenerico.js'
import { C } from './pdfInformeBase.js'

const num = v => parseFloat(v) || 0
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const mesLabel = m => {
  if (!m) return ''
  const [y, mo] = m.split('-')
  return `${MESES[parseInt(mo, 10) - 1]} ${String(y).slice(2)}`
}
const fechaCorta = iso => (iso ? iso.split('-').reverse().join('/') : '')
const ultimosMeses = n => {
  const out = []
  const d = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(d.getFullYear(), d.getMonth() - i, 1)
    out.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

// ── Dashboard ejecutivo ───────────────────────────────────────────
export function pdfDashboardEjecutivo(data, { periodo, empresaNombre, usuario }) {
  const f = data.facturacion || {}
  const mv = data.movimientos || {}
  const g = data.gastos || {}
  const fact = num(f.total_facturado)
  const cob = num(f.total_cobrado)
  const tasa = fact > 0 ? (cob / fact) * 100 : 0
  const saldo = num(mv.total_ingresos) - num(mv.total_egresos)
  const top = data.top_clientes || []

  const tendencia = ultimosMeses(6).map(m => {
    const x = (data.tendencia_facturacion || []).find(t => t.mes === m) || {}
    return { mes: m, facturado: num(x.valor_facturas), cobrado: num(x.valor_cobrado) }
  })

  return generarInformeGerencial({
    titulo: 'Dashboard Ejecutivo',
    pie: 'Dashboard ejecutivo',
    empresaNombre, usuario,
    periodo: `${fechaCorta(periodo.desde)} – ${fechaCorta(periodo.hasta)}`,
    kpis: [
      { label: 'Total facturado', value: pesos(fact), sub: `${f.count_total || 0} facturas`, color: C.accent },
      { label: 'Total cobrado', value: pesos(cob), sub: `${porcentaje(tasa, 0)} de cobro`, color: C.green },
      { label: 'Por cobrar', value: pesos(f.total_por_cobrar), sub: `${f.count_pendiente || 0} pendientes`, color: C.amber },
      { label: 'Clientes activos', value: numero(f.clientes_activos), sub: 'con facturas en el período', color: C.violet },
    ],
    puntos: [
      `Se facturaron ${pesos(fact)} en ${f.count_total || 0} facturas y se han cobrado ${pesos(cob)}, un ${porcentaje(tasa, 0)} de cobro.`,
      `Quedan ${pesos(f.total_por_cobrar)} por cobrar en ${f.count_pendiente || 0} facturas pendientes.`,
      `Gastos del período: ${pesos(g.total_gastos)} en ${g.count_gastos || 0} registros. Saldo de movimientos (ingresos menos egresos): ${pesos(saldo)}.`,
      top.length ? `${top[0].cliente_nombre} es el cliente con más facturación, con ${pesos(top[0].total_facturado)}.` : null,
    ].filter(Boolean),
    secciones: [
      {
        titulo: 'Facturas por estado',
        head: ['Estado', 'Cantidad'],
        body: [
          ['Pendiente', String(f.count_pendiente || 0)],
          ['Por verificar', String(f.count_por_verificar || 0)],
          ['Pagada', String(f.count_pagada || 0)],
        ],
      },
      {
        titulo: 'Órdenes por estado',
        head: ['Estado', 'Órdenes', 'Valor'],
        body: (data.ordenes || []).map(o => [o.estado, String(o.count), pesos(o.valor)]),
      },
      {
        titulo: 'Facturación últimos 6 meses',
        head: ['Mes', 'Facturado', 'Cobrado', '% cobrado'],
        body: tendencia.map(t => [mesLabel(t.mes), pesos(t.facturado), pesos(t.cobrado), porcentaje(t.facturado ? (t.cobrado / t.facturado) * 100 : 0)]),
      },
      {
        titulo: 'Top clientes',
        head: ['#', 'Cliente', 'Facturas', 'Total facturado'],
        body: top.map((c, i) => [String(i + 1), c.cliente_nombre, String(c.facturas_count || 0), pesos(c.total_facturado)]),
        columnStyles: { 0: { halign: 'center' }, 1: { halign: 'left' } },
      },
    ],
  })
}

// Colorea la celda que trae _color (ver generarInformeGerencial)
const celdaColor = d => {
  const c = d.cell.raw?._color
  if (d.section === 'body' && c) {
    d.cell.styles.textColor = c
    d.cell.styles.fontStyle = 'bold'
  }
}
const celda = (texto, color) => ({ content: texto, _color: color })

// ── Análisis de nómina ────────────────────────────────────────────
export function pdfAnalisisNomina(data, { empresaNombre, usuario, locales = 'Todos los locales' }) {
  const serie = data.serie || []          // viene en orden ascendente
  const k = data.kpis || {}
  const sing = data.agrupacion === 'mes' ? 'mes' : 'semana'
  const ultimo = serie[serie.length - 1]
  const previo = serie[serie.length - 2]
  const varUlt = ultimo && previo ? variacion(ultimo.costo_empresa, previo.costo_empresa) : null
  const top = data.topEmpleados || []
  const dist = data.distribucionCcosto || []
  const totalDist = dist.reduce((s, r) => s + num(r.costo_total), 0)

  const detalle = [...serie].reverse().map((r, i, arr) => {
    const prev = serie[serie.length - 2 - i]
    const v = prev ? variacion(r.costo_empresa, prev.costo_empresa) : null
    // Costo que baja es bueno, igual que en la pantalla
    return [
      r.label,
      String(r.empleados),
      numero(r.horas_regulares),
      num(r.horas_overtime) > 0 ? { content: numero(r.horas_overtime), _color: C.red } : numero(r.horas_overtime),
      pesos(r.total_bruto),
      pesos(r.total_deducciones),
      pesos(r.total_aportes_er),
      pesos(r.total_neto),
      pesos(r.costo_empresa),
      v === null ? '—' : celda(txtVar(v), colorVar(v, { mejorSiBaja: true })),
    ]
  })

  return generarInformeGerencial({
    titulo: 'Análisis de Nómina',
    pie: 'Análisis de nómina',
    orientacion: 'landscape',
    empresaNombre, usuario, locales,
    periodo: serie.length ? `${serie[0].label} – ${serie[serie.length - 1].label}` : '',
    kpis: [
      { label: 'Costo empresa total', value: pesos(k.totalCosto), sub: `${k.periodos || serie.length} ${sing}s`, color: C.accent },
      { label: `Promedio por ${sing}`, value: pesos(k.promedio), sub: 'costo empresa', color: C.amber },
      { label: `Último ${sing} vs anterior`, value: txtVar(varUlt), sub: ultimo ? `${ultimo.label}` : '', color: varUlt !== null && varUlt > 0 ? C.red : C.green },
      { label: 'Mayor costo', value: k.mayor ? pesos(k.mayor.valor) : '—', sub: k.mayor?.label || '', color: C.violet },
    ],
    puntos: [
      `Costo de nómina de ${pesos(k.totalCosto)} en ${k.periodos || serie.length} ${sing}s, con un promedio de ${pesos(k.promedio)} por ${sing}.`,
      k.mayor && k.menor ? `El ${sing} más caro fue ${k.mayor.label} (${pesos(k.mayor.valor)}) y el más barato ${k.menor.label} (${pesos(k.menor.valor)}).` : null,
      varUlt !== null ? `El último ${sing} (${ultimo.label}) costó ${txtVar(varUlt)} frente al anterior.` : null,
      top.length ? `${top[0].nombre} es el empleado con mayor costo en el período, con ${pesos(top[0].costo_empresa)}.` : null,
    ].filter(Boolean),
    secciones: [
      {
        titulo: `Detalle por ${sing}`,
        nota: 'Más reciente primero',
        head: ['Período', 'Empleados', 'Hrs reg.', 'Hrs OT', 'Bruto', 'Deducciones', 'Aportes ER', 'Neto', 'Costo empresa', 'vs anterior'],
        body: detalle,
        celda: celdaColor,
      },
      {
        titulo: 'Costo por local',
        nota: 'Costo empresa del período',
        head: ['Local', 'Costo', '% del total'],
        body: dist.map(r => [String(r.ccosto_nombre || r.ccosto), pesos(r.costo_total), porcentaje(totalDist ? (num(r.costo_total) / totalDist) * 100 : 0)]),
        columnStyles: { 0: { halign: 'left' } },
      },
      {
        titulo: 'Top empleados por costo',
        head: ['#', 'Empleado', 'Costo empresa'],
        body: top.map((r, i) => [String(i + 1), r.nombre, pesos(r.costo_empresa)]),
        columnStyles: { 0: { halign: 'center' }, 1: { halign: 'left' } },
      },
    ],
  })
}

// ── Labor cost (nómina sobre ventas) ──────────────────────────────
export function pdfLaborCost(data, { empresaNombre, usuario, umbral = 30, locales = 'Todos los locales' }) {
  const serie = data.serie || []
  const k = data.kpis || {}
  const centros = data.centros || []
  const sobre = centros.filter(c => c.labor_pct !== null && c.labor_pct > umbral)
  const sing = data.agrupacion === 'mes' ? 'mes' : data.agrupacion === 'anio' ? 'año' : 'semana'
  const estado = c => (c.labor_pct === null ? 'SIN VENTAS' : c.labor_pct > umbral ? 'SOBRE UMBRAL' : 'OK')
  const colorPct = p => (p === null ? C.muted : p > umbral ? C.red : C.greenDk)

  return generarInformeGerencial({
    titulo: 'Labor Cost',
    pie: 'Costo de nómina sobre ventas',
    orientacion: 'landscape',
    empresaNombre, usuario, locales,
    periodo: serie.length ? `${serie[0].label} – ${serie[serie.length - 1].label}` : '',
    kpis: [
      { label: 'Labor % global', value: porcentaje(k.pctGlobal), sub: `umbral ${umbral}%`, color: C.accent },
      { label: 'Ventas netas', value: pesos(k.totVentas), sub: `${k.periodos || serie.length} ${sing}s`, color: C.green },
      { label: 'Costo de nómina', value: pesos(k.totNomina), sub: 'en el período', color: C.amber },
      { label: 'Locales sobre umbral', value: String(sobre.length), sub: `de ${centros.length} con datos`, color: C.red },
    ],
    puntos: [
      `La nómina equivale a ${porcentaje(k.pctGlobal)} de las ventas netas del período (${pesos(k.totNomina)} sobre ${pesos(k.totVentas)}).`,
      k.mejorCC ? `Mejor local: ${k.mejorCC.nombre}, con ${porcentaje(k.mejorCC.pct)}.` : null,
      k.peorCC ? `Local más alto: ${k.peorCC.nombre}, con ${porcentaje(k.peorCC.pct)}.` : null,
      sobre.length ? `${sobre.length} local(es) superan el umbral de ${umbral}%: ${sobre.map(c => c.nombre).join(', ')}.` : `Ningún local supera el umbral de ${umbral}%.`,
    ].filter(Boolean),
    secciones: [
      {
        titulo: 'Labor % por local',
        nota: `Umbral ${umbral}%`,
        head: ['Local', 'Ventas netas', 'Costo nómina', 'Labor %', 'Estado'],
        body: centros.map(c => [
          c.nombre,
          pesos(c.ventas),
          pesos(c.nomina),
          celda(porcentaje(c.labor_pct), colorPct(c.labor_pct)),
          estado(c),
        ]),
        celda: celdaColor,
      },
      {
        titulo: `Detalle por ${sing}`,
        head: ['Período', 'Ventas netas', 'Costo nómina', 'Labor %'],
        body: [...serie].reverse().map(r => [
          r.label, pesos(r.ventas), pesos(r.costo_nomina),
          celda(porcentaje(r.labor_pct), colorPct(r.labor_pct)),
        ]),
        celda: celdaColor,
      },
    ],
  })
}

// ── Consumo de materia prima / food cost ──────────────────────────
export function pdfConsumoMP(data, { empresaNombre, usuario, umbral = 30, locales = 'Todos los locales' }) {
  const serie = data.serie || []
  const k = data.kpis || {}
  const centros = data.centros || []
  const grupos = (data.porGrupo || []).filter(g => num(g.consumo) > 0)
  const totG = grupos.reduce((s, g) => s + num(g.consumo), 0)
  const top = data.topRecetas || []
  const sobre = centros.filter(c => c.food_pct !== null && c.food_pct > umbral)
  const sing = data.agrupacion === 'mes' ? 'mes' : data.agrupacion === 'anio' ? 'año' : 'semana'
  const estado = c => (c.food_pct === null ? 'SIN VENTAS' : c.food_pct > umbral ? 'SOBRE UMBRAL' : 'OK')
  const colorPct = p => (p === null ? C.muted : p > umbral ? C.red : C.greenDk)

  return generarInformeGerencial({
    titulo: 'Consumo de Materia Prima',
    pie: 'Consumo de materia prima y food cost',
    orientacion: 'landscape',
    empresaNombre, usuario, locales,
    periodo: serie.length ? `${serie[0].label} – ${serie[serie.length - 1].label}` : '',
    kpis: [
      { label: 'Food cost % global', value: porcentaje(k.pctGlobal), sub: `umbral ${umbral}%`, color: C.accent },
      { label: 'Consumo de MP', value: pesos(k.totConsumo), sub: 'costo de recetas vendidas', color: C.amber },
      { label: 'Ventas netas', value: pesos(k.totVentas), sub: `${k.periodos || serie.length} ${sing}s`, color: C.green },
      { label: 'Ítems sin costo', value: String(k.itemsSinCosto || 0), sub: 'recetas sin valor de costo', color: C.violet },
    ],
    puntos: [
      `El consumo de materia prima es ${porcentaje(k.pctGlobal)} de las ventas netas (${pesos(k.totConsumo)} sobre ${pesos(k.totVentas)}).`,
      grupos.length ? `El grupo con más consumo es ${grupos[0].grupo}, con ${pesos(grupos[0].consumo)} (${porcentaje(totG ? (num(grupos[0].consumo) / totG) * 100 : 0)} del consumo).` : null,
      k.mejorCC ? `Mejor local: ${k.mejorCC.nombre}, con ${porcentaje(k.mejorCC.pct)}.` : null,
      k.peorCC ? `Local más alto: ${k.peorCC.nombre}, con ${porcentaje(k.peorCC.pct)}.` : null,
      sobre.length ? `${sobre.length} local(es) superan el umbral de ${umbral}%: ${sobre.map(c => c.nombre).join(', ')}.` : null,
      k.itemsSinCosto ? `${k.itemsSinCosto} ítems vendidos no tienen costo de receta; el consumo real puede ser mayor.` : null,
    ].filter(Boolean),
    secciones: [
      {
        titulo: 'Food cost % por local',
        nota: `Umbral ${umbral}%`,
        head: ['Local', 'Ventas netas', 'Consumo MP', 'Food %', 'Estado'],
        body: centros.map(c => [
          c.nombre, pesos(c.ventas), pesos(c.consumo),
          celda(porcentaje(c.food_pct), colorPct(c.food_pct)),
          estado(c),
        ]),
        celda: celdaColor,
      },
      {
        titulo: `Detalle por ${sing}`,
        head: ['Período', 'Ventas netas', 'Consumo MP', 'Food %'],
        body: [...serie].reverse().map(r => [
          r.label, pesos(r.ventas), pesos(r.consumo),
          celda(porcentaje(r.food_pct), colorPct(r.food_pct)),
        ]),
        celda: celdaColor,
      },
      {
        titulo: 'Consumo por grupo de receta',
        head: ['Grupo', 'Consumo MP', '% del consumo'],
        body: grupos.map(g => [String(g.grupo), pesos(g.consumo), porcentaje(totG ? (num(g.consumo) / totG) * 100 : 0)]),
        columnStyles: { 0: { halign: 'left' } },
      },
      {
        titulo: 'Top recetas por costo de MP',
        head: ['#', 'Receta', 'Cantidad', 'Vendido', 'Costo MP'],
        body: top.map((r, i) => [String(i + 1), String(r.nombre || r.codigo || ''), numero(r.cantidad), pesos(r.vendido), pesos(r.costo_mp)]),
        columnStyles: { 0: { halign: 'center' }, 1: { halign: 'left' } },
      },
    ],
  })
}

// ── Proveedores ───────────────────────────────────────────────────
export function pdfProveedores(data, { empresaNombre, usuario, locales = 'Todas las sedes' }) {
  const k = data.kpis || {}
  const provs = data.proveedores || []
  const meses = data.meses || []
  const top1 = provs[0]
  const mesDe = m => {
    const [y, mo] = String(m).split('-')
    return `${MESES[parseInt(mo, 10) - 1]} ${String(y).slice(2)}`
  }
  const concent = k.concentracion ? `Concentración ${k.concentracion.toLowerCase()} (índice HHI ${numero(k.hhi)}).` : null

  return generarInformeGerencial({
    titulo: 'Análisis de Proveedores',
    pie: 'Análisis de proveedores',
    orientacion: 'landscape',
    empresaNombre, usuario, locales,
    periodo: `${fechaCorta(data.periodo?.desde)} – ${fechaCorta(data.periodo?.hasta)}`,
    kpis: [
      { label: 'Total comprado', value: pesos(k.total_gasto), sub: `${k.total_compras || 0} compras`, color: C.accent },
      { label: 'Proveedores', value: String(k.num_proveedores || 0), sub: `concentración ${(k.concentracion || '').toLowerCase()}`, color: C.violet },
      { label: 'Top 1 del gasto', value: porcentaje(k.pct_top1), sub: top1 ? top1.proveedor_nombre : '', color: C.amber },
      { label: 'Top 3 del gasto', value: porcentaje(k.pct_top3), sub: `top 5: ${porcentaje(k.pct_top5)}`, color: C.green },
    ],
    puntos: [
      `Se compró ${pesos(k.total_gasto)} a ${k.num_proveedores || 0} proveedores en ${k.total_compras || 0} compras.`,
      top1 ? `${top1.proveedor_nombre} representa ${porcentaje(k.pct_top1)} de todo lo comprado.` : null,
      concent,
      k.inactivos_60d ? `${k.inactivos_60d} proveedor(es) no tienen compras hace más de 60 días.` : null,
    ].filter(Boolean),
    secciones: [
      {
        titulo: 'Ranking de proveedores',
        nota: 'Pareto: las filas del 80% acumulado son los que más pesan',
        head: ['#', 'Proveedor', 'Sedes', 'Total', '% total', '% acum.', 'Compras', 'Ticket prom.', 'Días sin comprar'],
        body: provs.map((p, i) => [
          String(i + 1),
          { content: p.proveedor_nombre, styles: { halign: 'left' } },
          String(p.num_sedes || 0),
          pesos(p.total),
          porcentaje(p.pct_del_total),
          porcentaje(p.pct_acumulado),
          String(p.num_compras || 0),
          pesos(p.ticket_promedio),
          celda(String(p.dias_sin_comprar ?? '—'), num(p.dias_sin_comprar) > 60 ? C.red : null),
        ]),
        columnStyles: { 0: { halign: 'center' }, 1: { halign: 'left' } },
        celda: celdaColor,
      },
      meses.length > 1 ? {
        titulo: 'Evolución mensual — top 8 proveedores',
        head: ['Proveedor', ...meses.map(mesDe)],
        body: provs.slice(0, 8).map(p => [p.proveedor_nombre, ...(p.serie || []).map(v => (num(v) > 0 ? pesos(v) : '—'))]),
        columnStyles: { 0: { halign: 'left' } },
      } : null,
    ].filter(Boolean),
  })
}

// ── Ingeniería de menú ────────────────────────────────────────────
const CUADRANTES_PDF = [
  { key: 'ESTRELLA', label: 'Estrellas', color: [34, 197, 94] },
  { key: 'CABALLO', label: 'Caballos de batalla', color: [14, 165, 233] },
  { key: 'ENIGMA', label: 'Enigmas', color: [139, 92, 246] },
  { key: 'PERRO', label: 'Perros', color: [239, 68, 68] },
]
export function pdfIngenieriaMenu(data, { empresaNombre, usuario, locales = 'Todos los locales' }) {
  const t = data.totales || {}
  const u = data.umbrales || {}
  const res = data.resumen || {}
  const platos = data.platos || []
  const sinCosto = data.platos_sin_costo || []
  const etiqueta = c => CUADRANTES_PDF.find(x => x.key === c)?.label || c

  return generarInformeGerencial({
    titulo: 'Ingeniería de Menú',
    pie: 'Ingeniería de menú',
    orientacion: 'landscape',
    empresaNombre, usuario, locales,
    periodo: `${fechaCorta(data.periodo?.desde)} – ${fechaCorta(data.periodo?.hasta)}`,
    kpis: [
      { label: 'Ingresos', value: pesos(t.ingresos), sub: `${t.num_platos || 0} platos · ${numero(t.unidades)} uds`, color: C.accent },
      { label: 'Margen total', value: pesos(t.margen), sub: `${porcentaje(t.margen_pct)} de los ingresos`, color: C.green },
      { label: 'Food cost global', value: porcentaje(t.food_cost_pct), sub: data.food_cost_sospechoso ? 'revisar recetas: valor alto' : 'costo de receta / ingresos', color: data.food_cost_sospechoso ? C.red : C.amber },
      { label: 'Platos sin costo', value: String(t.sin_costo || 0), sub: `${t.costo_invalido || 0} con costo inválido`, color: C.violet },
    ],
    puntos: [
      `Se vendieron ${numero(t.unidades)} unidades de ${t.num_platos || 0} platos, con ingresos de ${pesos(t.ingresos)} y margen de ${pesos(t.margen)}.`,
      ...CUADRANTES_PDF.filter(c => res[c.key]).map(c => `${c.label}: ${res[c.key].num} platos, con ${pesos(res[c.key].margen)} de margen.`),
      data.food_cost_sospechoso ? 'El food cost global supera 60%: revise si hay recetas con costo mal cargado.' : null,
      sinCosto.length ? `${sinCosto.length} plato(s) se vendieron sin costo de receta y no entran en el análisis de margen.` : null,
    ].filter(Boolean),
    secciones: [
      {
        titulo: 'Clasificación de platos',
        nota: `Popularidad ≥ ${porcentaje(u.popularidad_pct)} del mix · margen ≥ ${pesos(u.margen_unitario)} por unidad`,
        head: ['Plato', 'Clasificación', 'Unidades', 'Mix %', 'P. prom.', 'Costo u.', 'Margen u.', 'Food %', 'Margen total', 'Qué hacer'],
        body: platos.map(p => [
          { content: p.nombre, styles: { halign: 'left' } },
          celda(etiqueta(p.clase), (CUADRANTES_PDF.find(c => c.key === p.clase) || {}).color),
          numero(p.unidades),
          porcentaje(p.mix_pct),
          pesos(p.precio_promedio),
          pesos(p.costo_unitario),
          pesos(p.margen_unitario),
          porcentaje(p.food_cost_pct),
          pesos(p.margen_total),
          { content: p.accion || '', styles: { halign: 'left' } },
        ]),
        columnStyles: { 9: { halign: 'left', cellWidth: 70 } },
        celda: celdaColor,
      },
      sinCosto.length ? {
        titulo: 'Platos vendidos sin costo de receta',
        head: ['Plato', 'Unidades', 'Precio prom.', 'Ingresos'],
        body: sinCosto.map(p => [{ content: p.nombre, styles: { halign: 'left' } }, numero(p.unidades), pesos(p.precio_promedio), pesos(p.ingresos)]),
      } : null,
    ].filter(Boolean),
  })
}

// ── Análisis de costos (variación de precio de compra) ────────────
export function pdfAnalisisCostos(data, { empresaNombre, usuario }) {
  const k = data.kpis || {}
  const productos = data.productos || []
  const colorVarP = v => (v === null || v === undefined ? C.muted : v > 0 ? C.red : v < 0 ? C.greenDk : C.muted)

  return generarInformeGerencial({
    titulo: 'Análisis de Costos',
    pie: 'Análisis de costos de compra',
    orientacion: 'landscape',
    empresaNombre, usuario,
    periodo: `${fechaCorta(data.periodo?.desde)} – ${fechaCorta(data.periodo?.hasta)}`,
    kpis: [
      { label: 'Total comprado', value: pesos(k.totalComprado), sub: `${k.totalEntradas || 0} entradas`, color: C.accent },
      { label: 'Productos analizados', value: String(k.productosAnalizados || 0), sub: `${k.productosSinVariacion || 0} sin variación`, color: C.violet },
      { label: 'Con aumento de precio', value: String(k.productosConAumento || 0), sub: `${k.productosConDisminucion || 0} con disminución`, color: C.red },
      { label: 'Mayor incremento', value: k.mayorIncremento ? txtVar(k.mayorIncremento.variacion_pct) : '—', sub: k.mayorIncremento?.producto_nombre || '', color: C.amber },
    ],
    puntos: [
      `Se analizaron ${k.productosAnalizados || 0} productos con compras por ${pesos(k.totalComprado)}.`,
      k.mayorIncremento ? `El mayor aumento de precio fue en ${k.mayorIncremento.producto_nombre}, con ${txtVar(k.mayorIncremento.variacion_pct)}.` : null,
      k.mayorAhorro ? `La mayor baja fue en ${k.mayorAhorro.producto_nombre}, con ${txtVar(k.mayorAhorro.variacion_pct)}.` : null,
    ].filter(Boolean),
    secciones: [
      {
        titulo: 'Variación de precio por producto',
        nota: 'Del primer precio del período al último',
        head: ['Producto', 'Grupo', 'Compras', 'Precio inicial', 'Precio actual', 'Precio prom.', 'Variación', 'Último proveedor'],
        body: productos.map(p => [
          { content: p.producto_nombre, styles: { halign: 'left' } },
          { content: p.grupo_nombre || '', styles: { halign: 'left' } },
          String(p.num_compras || 0),
          pesos(p.precio_primero),
          pesos(p.precio_ultimo),
          pesos(p.precio_promedio),
          celda(p.variacion_pct === null || p.variacion_pct === undefined ? '—' : txtVar(p.variacion_pct), colorVarP(p.variacion_pct)),
          { content: p.proveedor_ultimo || '', styles: { halign: 'left' } },
        ]),
        celda: celdaColor,
      },
    ],
  })
}

// ── Sobrantes y faltantes de inventario ───────────────────────────
export function pdfFaltantesSobrantes(data, { empresaNombre, usuario, locales = 'Todos los locales' }) {
  const k = data.kpis || {}
  const productos = data.productos || []
  const serie = data.serieMensual || []
  const neto = num(k.neto)
  const mesDe = m => {
    const [y, mo] = String(m).split('-')
    return `${MESES[parseInt(mo, 10) - 1]} ${String(y).slice(2)}`
  }

  return generarInformeGerencial({
    titulo: 'Sobrantes y Faltantes',
    pie: 'Sobrantes y faltantes de inventario',
    orientacion: 'landscape',
    empresaNombre, usuario, locales,
    periodo: `${fechaCorta(data.periodo?.desde)} – ${fechaCorta(data.periodo?.hasta)}`,
    kpis: [
      { label: 'Faltante valorado', value: pesos(k.totalFaltante), sub: `${porcentaje(k.pctFaltanteVentas)} de las ventas`, color: C.red },
      { label: 'Sobrante valorado', value: pesos(k.totalSobrante), sub: 'producto que sobró en tomas', color: C.green },
      { label: 'Neto', value: pesos(neto), sub: `${porcentaje(k.pctNetoVentas)} de las ventas`, color: neto < 0 ? C.red : C.greenDk },
      { label: 'Productos afectados', value: String(k.productosAfectados || 0), sub: 'con diferencias en tomas', color: C.violet },
    ],
    puntos: [
      `El neto de diferencias en toma física es ${pesos(neto)}: faltantes por ${pesos(k.totalFaltante)} y sobrantes por ${pesos(k.totalSobrante)}.`,
      k.mayorFaltante ? `El mayor faltante es ${k.mayorFaltante.producto_nombre}, valorado en ${pesos(k.mayorFaltante.faltante_valor)}.` : null,
      k.mayorSobrante ? `El mayor sobrante es ${k.mayorSobrante.producto_nombre}, valorado en ${pesos(k.mayorSobrante.sobrante_valor)}.` : null,
    ].filter(Boolean),
    secciones: [
      {
        titulo: 'Diferencias por producto',
        nota: 'Ordenado por la pantalla',
        head: ['Código', 'Producto', 'Grupo', 'Und', 'Costo u.', 'Sobrante (cant.)', 'Faltante (cant.)', 'Diferencia (cant.)', 'Neto $', 'Tomas'],
        body: productos.map(p => [
          { content: String(p.producto_codigo || ''), styles: { halign: 'left' } },
          { content: p.producto_nombre, styles: { halign: 'left' } },
          { content: p.grupo_nombre || '', styles: { halign: 'left' } },
          { content: p.und || '', styles: { halign: 'center' } },
          pesos(p.precio_costo),
          numero(p.sobrante_cant),
          celda(numero(p.faltante_cant), num(p.faltante_cant) > 0 ? C.red : null),
          numero(p.diferencia_cant),
          celda(pesos(p.neto_valor), num(p.neto_valor) < 0 ? C.red : C.greenDk),
          String(p.num_tomas || 0),
        ]),
        celda: celdaColor,
      },
      serie.length ? {
        titulo: 'Evolución mensual',
        head: ['Mes', 'Sobrante', 'Faltante'],
        body: serie.map(r => [mesDe(r.periodo_key), pesos(r.sobrante_valor), celda(pesos(r.faltante_valor), num(r.faltante_valor) > 0 ? C.red : null)]),
        celda: celdaColor,
      } : null,
    ].filter(Boolean),
  })
}
