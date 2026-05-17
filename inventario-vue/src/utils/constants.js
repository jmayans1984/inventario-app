export const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api'

export const MODULES = [
  {
    id: 'inicio',
    name: 'INICIO',
    icon: 'mdi-view-dashboard-outline',
    path: '/',
    children: [],
  },
  {
    id: 'contabilidad',
    name: 'CONTABILIDAD',
    icon: 'mdi-calculator-variant-outline',
    path: '/contabilidad',
    children: [
      {
        name: 'Configuración',
        icon: 'mdi-cog-outline',
        items: [
          { name: 'Proveedores', icon: 'mdi-truck-outline', path: '/contabilidad/configuracion/proveedores' },
          { name: 'Cuentas Contables', icon: 'mdi-book-outline', path: '/contabilidad/configuracion/cuentas-contables' },
          { name: 'Cuentas Bancarias', icon: 'mdi-bank-outline', path: '/contabilidad/configuracion/cuentas-bancarias' },
          { name: 'Centros de Costos', icon: 'mdi-sitemap-outline', path: '/contabilidad/configuracion/centros-costos' },
        ],
      },
      {
        name: 'Procesos',
        icon: 'mdi-cogs',
        items: [
          { name: 'Gestión de Gastos', icon: 'mdi-receipt-text-outline', path: '/contabilidad/procesos/gastos' },
        ],
      },
      {
        name: 'Reportes',
        icon: 'mdi-chart-bar',
        items: [
          { name: 'Reporte de Gastos', icon: 'mdi-file-chart-outline', path: '/contabilidad/reportes/gastos' },
          { name: 'Estado de Resultados', icon: 'mdi-trending-up', path: '/contabilidad/reportes/estado-resultados' },
        ],
      },
    ],
  },
  {
    id: 'tesoreria',
    name: 'TESORERÍA',
    icon: 'mdi-bank-outline',
    path: '/tesoreria',
    children: [
      { name: 'Configuración', icon: 'mdi-cog-outline', items: [
        { name: 'Configuración General', icon: 'mdi-tune', path: '/tesoreria/configuracion' },
      ]},
      { name: 'Procesos', icon: 'mdi-cogs', items: [
        { name: 'Movimientos', icon: 'mdi-swap-horizontal', path: '/tesoreria/procesos/movimientos' },
      ]},
      { name: 'Reportes', icon: 'mdi-chart-bar', items: [
        { name: 'Estado de Cuenta', icon: 'mdi-file-chart-outline', path: '/tesoreria/reportes/estado-cuenta' },
      ]},
    ],
  },
  {
    id: 'almacen',
    name: 'ALMACÉN',
    icon: 'mdi-warehouse',
    path: '/almacen',
    children: [
      { name: 'Configuración', icon: 'mdi-cog-outline', items: [
        { name: 'Productos', icon: 'mdi-package-variant', path: '/almacen/configuracion/productos' },
        { name: 'Categorías', icon: 'mdi-tag-outline', path: '/almacen/configuracion/categorias' },
      ]},
      { name: 'Procesos', icon: 'mdi-cogs', items: [
        { name: 'Órdenes de Compra', icon: 'mdi-clipboard-list-outline', path: '/almacen/procesos/ordenes' },
        { name: 'Recepciones', icon: 'mdi-truck-delivery-outline', path: '/almacen/procesos/recepciones' },
      ]},
      { name: 'Reportes', icon: 'mdi-chart-bar', items: [
        { name: 'Inventario Actual', icon: 'mdi-file-chart-outline', path: '/almacen/reportes/inventario' },
        { name: 'Movimientos', icon: 'mdi-swap-horizontal', path: '/almacen/reportes/movimientos' },
      ]},
    ],
  },
  {
    id: 'produccion',
    name: 'PRODUCCIÓN',
    icon: 'mdi-factory',
    path: '/produccion',
    children: [
      { name: 'Configuración', icon: 'mdi-cog-outline', items: [
        { name: 'Recetas / Fórmulas', icon: 'mdi-flask-outline', path: '/produccion/configuracion/recetas' },
      ]},
      { name: 'Procesos', icon: 'mdi-cogs', items: [
        { name: 'Órdenes de Producción', icon: 'mdi-clipboard-play-outline', path: '/produccion/procesos/ordenes' },
      ]},
      { name: 'Reportes', icon: 'mdi-chart-bar', items: [
        { name: 'Producción del Período', icon: 'mdi-file-chart-outline', path: '/produccion/reportes/periodo' },
      ]},
    ],
  },
  {
    id: 'nomina',
    name: 'NÓMINA',
    icon: 'mdi-account-group-outline',
    path: '/nomina',
    children: [
      { name: 'Configuración', icon: 'mdi-cog-outline', items: [
        { name: 'Empleados', icon: 'mdi-account-tie-outline', path: '/nomina/configuracion/empleados' },
        { name: 'Conceptos de Pago', icon: 'mdi-cash-multiple', path: '/nomina/configuracion/conceptos' },
      ]},
      { name: 'Procesos', icon: 'mdi-cogs', items: [
        { name: 'Liquidación de Nómina', icon: 'mdi-calculator', path: '/nomina/procesos/liquidacion' },
      ]},
      { name: 'Reportes', icon: 'mdi-chart-bar', items: [
        { name: 'Colilla de Pago', icon: 'mdi-file-document-outline', path: '/nomina/reportes/colilla' },
      ]},
    ],
  },
  {
    id: 'gerencia',
    name: 'GERENCIA',
    icon: 'mdi-chart-line',
    path: '/gerencia',
    children: [
      { name: 'Configuración', icon: 'mdi-cog-outline', items: [
        { name: 'Parámetros', icon: 'mdi-tune', path: '/gerencia/configuracion/parametros' },
      ]},
      { name: 'Procesos', icon: 'mdi-cogs', items: [
        { name: 'Análisis de Datos', icon: 'mdi-magnify-scan', path: '/gerencia/procesos/analisis' },
      ]},
      { name: 'Reportes', icon: 'mdi-chart-bar', items: [
        { name: 'Dashboard Ejecutivo', icon: 'mdi-view-dashboard-outline', path: '/gerencia/reportes/ejecutivo' },
        { name: 'KPIs', icon: 'mdi-gauge', path: '/gerencia/reportes/kpis' },
      ]},
    ],
  },
  {
    id: 'configuracion',
    name: 'CONFIGURACIÓN',
    icon: 'mdi-tune',
    path: '/configuracion',
    children: [],
  },
]
