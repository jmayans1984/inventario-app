export const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api'

export const APP_VERSION = __APP_VERSION__

export const MODULES = [
  {
    id: 'inicio',
    name: 'INICIO',
    icon: 'mdi-view-dashboard-outline',
    color: '#64748b',
    path: '/',
    children: [],
  },
  {
    id: 'contabilidad',
    name: 'CONTABILIDAD',
    icon: 'mdi-calculator-variant-outline',
    color: '#6d28d9',
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
    color: '#0369a1',
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
    color: '#047857',
    path: '/almacen',
    children: [
      { name: 'Configuración', icon: 'mdi-cog-outline', items: [
        { name: 'Productos', icon: 'mdi-package-variant', path: '/almacen/configuracion/productos', requiredTipo: 'PROVEEDOR' },
        { name: 'Control de Stock', icon: 'mdi-package-variant-closed', path: '/almacen/configuracion/control-stock', requiredTipo: 'PROVEEDOR' },
        { name: 'Impresión de Códigos de Barras', icon: 'mdi-barcode', path: '/almacen/configuracion/impresion-barcodes' },
        { name: 'Grupo de Productos', icon: 'mdi-folder-multiple-outline', path: '/almacen/configuracion/grupo-productos' },
        { name: 'Etiquetas de Producto', icon: 'mdi-label-outline', path: '/almacen/configuracion/etiquetas-producto' },
        { name: 'Ubicación de Productos en Bodega', icon: 'mdi-map-marker-outline', path: '/almacen/configuracion/ubicacion-productos' },
      ]},
      { name: 'Procesos', icon: 'mdi-cogs', items: [
        { name: 'Gestión de Inventario', icon: 'mdi-history', path: '/almacen/procesos/gestion-inventario' },
        { name: 'Toma Física', icon: 'mdi-counter', path: '/almacen/procesos/toma-fisica' },
        { name: 'Valoración Mensual', icon: 'mdi-calculator-variant', path: '/almacen/procesos/valoracion' },
        { name: 'Órdenes de Compra', icon: 'mdi-clipboard-list-outline', path: '/almacen/procesos/ordenes-compra' },
        { name: 'Despachos de Bodega', icon: 'mdi-truck-delivery-outline', path: '/almacen/procesos/despachos' },
        { name: 'Órdenes de Producción', icon: 'mdi-factory', path: '/almacen/procesos/ordenes-produccion' },
      ]},
      { name: 'Reportes', icon: 'mdi-chart-bar', items: [
        { name: 'Kardex por Período', icon: 'mdi-file-chart-outline', path: '/almacen/reportes/kardex' },
        { name: 'Consumos de Productos', icon: 'mdi-trending-down', path: '/almacen/reportes/consumos' },
        { name: 'Consumo de Insumos', icon: 'mdi-package-down', path: '/almacen/reportes/consumo-insumos' },
        { name: 'Alertas de Stock',        icon: 'mdi-alert-circle-outline',  path: '/almacen/reportes/alertas-stock',        requiredTipo: 'PROVEEDOR' },
        { name: 'Movimiento por Producto', icon: 'mdi-swap-vertical-bold',    path: '/almacen/reportes/movimiento-producto' },
        { name: 'Kardex Consolidado',      icon: 'mdi-table-multiple',         path: '/almacen/reportes/kardex-consolidado' },
        { name: 'Predicción Agotamiento',  icon: 'mdi-chart-box-outline',      path: '/almacen/reportes/prediccion-agotamiento' },
        { name: 'Faltantes y Sobrantes (Toma Física)', icon: 'mdi-clipboard-check-outline', path: '/almacen/reportes/toma-fisica' },
      ]},
    ],
  },
  {
    id: 'produccion',
    name: 'PROVEEDURÍA',
    icon: 'mdi-store',
    color: '#b45309',
    path: '/produccion',
    requiredTipo: 'PROVEEDOR',
    children: [
      { name: 'Configuración', icon: 'mdi-cog-outline', items: [
        { name: 'Productos para Venta', icon: 'mdi-package-variant', path: '/produccion/configuracion/productos-venta' },
        { name: 'Grupo de Productos', icon: 'mdi-folder-multiple-outline', path: '/produccion/configuracion/grupo-productos' },
        { name: 'Lista de Precios', icon: 'mdi-list-box-outline', path: '/produccion/configuracion/lista-precios' },
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
    id: 'recetas',
    name: 'RECETAS',
    icon: 'mdi-chef-hat',
    color: '#d97706',
    path: '/recetas',
    children: [
      { name: 'Configuración', icon: 'mdi-cog-outline', items: [
        { name: 'Artículos e Insumos',  icon: 'mdi-food-apple-outline',        path: '/recetas/configuracion/articulos' },
        { name: 'Precios de Venta',     icon: 'mdi-tag-edit-outline',          path: '/recetas/configuracion/precios' },
          { name: 'Precios Compra/Venta', icon: 'mdi-tag-multiple-outline',      path: '/recetas/configuracion/precios-cv' },
          { name: 'Grupos de Artículos',  icon: 'mdi-tag-multiple-outline',      path: '/recetas/configuracion/grupos-articulos' },
      ]},
      { name: 'Procesos', icon: 'mdi-cogs', items: [
        { name: 'Catálogo de Recetas', icon: 'mdi-book-open-variant-outline', path: '/recetas/configuracion/catalogo' },
        { name: 'Gestión de Costos',   icon: 'mdi-calculator-variant-outline', path: '/recetas/procesos/costos' },
      ]},
      { name: 'Reportes', icon: 'mdi-chart-bar', items: [
        { name: 'Resumen de Costos',        icon: 'mdi-file-chart-outline',    path: '/recetas/reportes/costos' },
        { name: 'Fichas Técnicas',          icon: 'mdi-file-document-outline', path: '/recetas/reportes/fichas' },
        { name: 'Valoración por Ventas',    icon: 'mdi-chart-bar',             path: '/recetas/reportes/valoracion-ventas' },
      ]},
    ],
  },
  {
    id: 'nomina',
    name: 'NÓMINA',
    icon: 'mdi-account-group-outline',
    color: '#be185d',
    path: '/nomina',
    children: [
      { name: 'Configuración', icon: 'mdi-cog-outline', items: [
        { name: 'Empleados',          icon: 'mdi-account-tie-outline',    path: '/nomina/configuracion/empleados' },
        { name: 'Cargos',             icon: 'mdi-briefcase-outline',       path: '/nomina/configuracion/cargos' },
        { name: 'Plantilla Horario',  icon: 'mdi-clock-outline',           path: '/nomina/configuracion/horario-config' },
        { name: 'Config. Fiscal',     icon: 'mdi-bank-outline',            path: '/nomina/configuracion/fiscal' },
      ]},
      { name: 'Procesos', icon: 'mdi-cogs', items: [
        { name: 'Horario Semanal',    icon: 'mdi-calendar-week',           path: '/nomina/procesos/horario' },
        { name: 'Liquidación',        icon: 'mdi-calculator-variant',      path: '/nomina/procesos/liquidacion' },
      ]},
      { name: 'Reportes', icon: 'mdi-chart-bar', items: [
        { name: 'Horario para Publicar', icon: 'mdi-calendar-clock',      path: '/nomina/reportes/horario' },
        { name: 'Recibos de Pago',    icon: 'mdi-file-document-outline',  path: '/nomina/reportes/recibos' },
        { name: 'Reporte de Nómina',  icon: 'mdi-chart-bar',              path: '/nomina/reportes/nomina' },
      ]},
    ],
  },
  {
    id: 'gerencia',
    name: 'GERENCIA',
    icon: 'mdi-chart-line',
    color: '#06b6d4',
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
        { name: 'KPIs',                icon: 'mdi-gauge',                  path: '/gerencia/reportes/kpis' },
        { name: 'Análisis de Ventas',  icon: 'mdi-chart-areaspline',       path: '/gerencia/reportes/analisis-ventas' },
      ]},
    ],
  },
  {
    id: 'formatos',
    name: 'FORMATOS / DOCS',
    icon: 'mdi-file-document-multiple-outline',
    color: '#8b5cf6',
    path: '/formatos',
    children: [
      { name: 'Inventario', icon: 'mdi-warehouse', items: [
        { name: 'Planilla Toma Física', icon: 'mdi-clipboard-list-outline', path: '/formatos/planilla-toma-fisica' },
      ]},
    ],
  },
  {
    id: 'configuracion',
    name: 'CONFIGURACIÓN',
    icon: 'mdi-tune',
    color: '#8b5cf6',
    path: '/configuracion',
    children: [
      { name: 'Configuración', icon: 'mdi-cog-outline', items: [
        { name: 'Configuración General', icon: 'mdi-tune', path: '/configuracion/general' },
        { name: 'Bodega Maestra / Proveeduría', icon: 'mdi-warehouse', path: '/configuracion/bodega-maestra', requiredTipo: 'PROVEEDOR' },
        { name: 'Preferencias de Notificaciones', icon: 'mdi-bell-cog', path: '/configuracion/notificaciones' },
        { name: 'Permisos por Cliente', icon: 'mdi-shield-account-outline', path: '/configuracion/permisos-clientes', requiredTipo: 'PROVEEDOR' },
        { name: 'Permisos de Usuarios', icon: 'mdi-account-lock-outline', path: '/configuracion/permisos-usuarios' },
      ]},
    ],
  },
]
