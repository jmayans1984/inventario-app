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
      {
        name: 'Configuración',
        icon: 'mdi-cog-outline',
        items: [
          { name: 'Cuentas Bancarias', icon: 'mdi-bank-outline', path: '/tesoreria/configuracion/cuentas-bancarias' },
        ],
      },
      {
        name: 'Procesos',
        icon: 'mdi-cogs',
        items: [
          { name: 'Importar Ventas',         icon: 'mdi-file-import-outline',        path: '/tesoreria/procesos/importar-ventas' },
          { name: 'Conciliación de Cuentas', icon: 'mdi-bank-check',                 path: '/tesoreria/procesos/conciliacion-cuentas' },
          { name: 'Movimientos Bancarios',   icon: 'mdi-swap-horizontal',             path: '/tesoreria/procesos/movimientos-bancarios' },
          { name: 'Facturas de Compra',      icon: 'mdi-receipt-text-outline',        path: '/tesoreria/procesos/facturas-compra',  requiredTipo: 'CLIENTE' },
          { name: 'Facturas de Venta',       icon: 'mdi-receipt-outline',             path: '/tesoreria/procesos/facturas-venta',   requiredTipo: 'PROVEEDOR' },
        ],
      },
      {
        name: 'Reportes',
        icon: 'mdi-chart-bar',
        items: [
          { name: 'Conciliación Bancaria',              icon: 'mdi-file-chart-outline',        path: '/tesoreria/reportes/conciliacion-bancaria' },
          { name: 'Movimiento por Cuentas',             icon: 'mdi-chart-timeline-variant',    path: '/tesoreria/reportes/movimiento-cuentas' },
          { name: 'Ventas por Período',                 icon: 'mdi-trending-up',               path: '/tesoreria/reportes/ventas-periodo' },
          { name: 'Ventas de Productos por Período',    icon: 'mdi-package-variant-closed',    path: '/tesoreria/reportes/ventas-productos-periodo' },
        ],
      },
    ],
  },
  {
    id: 'almacen',
    name: 'ALMACÉN',
    icon: 'mdi-warehouse',
    path: '/almacen',
    children: [
      { name: 'Configuración', icon: 'mdi-cog-outline', items: [
        { name: 'Productos', icon: 'mdi-package-variant', path: '/almacen/configuracion/productos', requiredTipo: 'PROVEEDOR' },
        { name: 'Control de Inventario', icon: 'mdi-warehouse', path: '/almacen/configuracion/control-inventario' },
      ]},
      { name: 'Procesos', icon: 'mdi-cogs', items: [
        { name: 'Gestión de Inventario', icon: 'mdi-history', path: '/almacen/procesos/gestion-inventario' },
        { name: 'Toma Física', icon: 'mdi-counter', path: '/almacen/procesos/toma-fisica' },
        { name: 'Valoración Mensual', icon: 'mdi-calculator-variant', path: '/almacen/procesos/valoracion' },
        { name: 'Órdenes de Compra', icon: 'mdi-clipboard-list-outline', path: '/almacen/procesos/ordenes-compra' },
      ]},
      { name: 'Reportes', icon: 'mdi-chart-bar', items: [
        { name: 'Kardex por Período', icon: 'mdi-file-chart-outline', path: '/almacen/reportes/kardex' },
        { name: 'Consumos de Productos', icon: 'mdi-trending-down', path: '/almacen/reportes/consumos' },
      ]},
    ],
  },
  {
    id: 'produccion',
    name: 'PRODUCCIÓN',
    icon: 'mdi-store',
    path: '/produccion',
    requiredTipo: 'PROVEEDOR',
    children: [
      { name: 'Configuración', icon: 'mdi-cog-outline', items: [
        { name: 'Productos para Venta', icon: 'mdi-package-variant', path: '/produccion/configuracion/productos-venta' },
        { name: 'Grupo de Productos', icon: 'mdi-folder-multiple-outline', path: '/produccion/configuracion/grupo-productos' },
        { name: 'Lista de Precios', icon: 'mdi-list-box-outline', path: '/produccion/configuracion/lista-precios' },
        { name: 'Términos de Crédito', icon: 'mdi-file-document-outline', path: '/produccion/configuracion/terminos-credito' },
      ]},
      { name: 'Procesos', icon: 'mdi-cogs', items: [
        { name: 'Órdenes de Compra', icon: 'mdi-clipboard-list-outline', path: '/produccion/procesos/ordenes-compra' },
      ]},
      { name: 'Informes', icon: 'mdi-chart-bar', items: [
        { name: 'Lista de Precios', icon: 'mdi-file-chart-outline', path: '/produccion/informes/lista-precios' },
        { name: 'Órdenes de Compra', icon: 'mdi-file-text-outline', path: '/produccion/informes/ordenes-compra' },
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
