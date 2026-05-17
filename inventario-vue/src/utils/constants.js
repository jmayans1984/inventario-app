export const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api'

export const MODULES = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: '📊',
    path: '/',
    description: 'Panel de control principal',
  },
  {
    id: 'contabilidad',
    name: 'Contabilidad',
    icon: '💼',
    path: '/contabilidad',
    description: 'Gestión contable y gastos',
  },
  {
    id: 'tesoreria',
    name: 'Tesorería',
    icon: '💰',
    path: '/tesoreria',
    description: 'Movimientos bancarios y pagos',
  },
  {
    id: 'almacen',
    name: 'Almacén',
    icon: '📦',
    path: '/almacen',
    description: 'Gestión de inventario y productos',
  },
  {
    id: 'produccion',
    name: 'Producción',
    icon: '🏭',
    path: '/produccion',
    description: 'Control de órdenes de producción',
  },
  {
    id: 'nomina',
    name: 'Nómina',
    icon: '👥',
    path: '/nomina',
    description: 'Gestión de sueldos y nómina',
  },
  {
    id: 'gerencia',
    name: 'Gerencia',
    icon: '📈',
    path: '/gerencia',
    description: 'Reportes ejecutivos y análisis',
  },
  {
    id: 'configuracion',
    name: 'Configuración',
    icon: '⚙️',
    path: '/configuracion',
    description: 'Parámetros y configuración del sistema',
  },
]

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
}

export const USER_LEVELS = {
  ADMIN: 1,
  GERENTE: 2,
  OPERARIO: 3,
  READONLY: 4,
}

export const STATUS_BADGES = {
  PENDIENTE: {
    color: 'bg-yellow-100 text-yellow-800',
    label: 'PENDIENTE',
  },
  ENTREGADA: {
    color: 'bg-green-100 text-green-800',
    label: 'ENTREGADA',
  },
  FACTURADA: {
    color: 'bg-blue-100 text-blue-800',
    label: 'FACTURADA',
  },
  CANCELADA: {
    color: 'bg-red-100 text-red-800',
    label: 'CANCELADA',
  },
}

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
}
