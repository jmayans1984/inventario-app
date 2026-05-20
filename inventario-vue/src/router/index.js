import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/LoginView.vue'), meta: { requiresAuth: false } },
  { path: '/', name: 'Inicio', component: () => import('../views/DashboardView.vue'), meta: { requiresAuth: true } },

  // CONTABILIDAD ESPECÍFICAS
  { path: '/contabilidad/configuracion/proveedores',     component: () => import('../views/contabilidad/ProveedoresView.vue'),     meta: { requiresAuth: true } },
  { path: '/contabilidad/configuracion/centros-costos',   component: () => import('../views/contabilidad/CentroCostosView.vue'),      meta: { requiresAuth: true } },
  { path: '/contabilidad/configuracion/cuentas-bancarias', component: () => import('../views/contabilidad/CuentasBancariasView.vue'), meta: { requiresAuth: true } },
  { path: '/contabilidad/configuracion/cuentas-contables', component: () => import('../views/contabilidad/CuentasContablesView.vue'), meta: { requiresAuth: true } },
  { path: '/contabilidad/procesos/gastos',                 component: () => import('../views/contabilidad/GestionGastosView.vue'),     meta: { requiresAuth: true } },
  { path: '/contabilidad/reportes/gastos',                 component: () => import('../views/contabilidad/ReporteGastosView.vue'),      meta: { requiresAuth: true } },

  // CONTABILIDAD — patrón general (captura /contabilidad, /contabilidad/configuracion, etc.)
  { path: '/contabilidad/:section?/:item?', component: () => import('../views/ContabilidadView.vue'), meta: { requiresAuth: true } },

  // TESORERÍA ESPECÍFICAS
  { path: '/tesoreria/configuracion/cuentas-bancarias',          component: () => import('../views/tesoreria/CuentasBancariasView.vue'),          meta: { requiresAuth: true } },
  { path: '/tesoreria/procesos/importar-ventas',                 component: () => import('../views/tesoreria/ImportarVentasView.vue'),             meta: { requiresAuth: true } },
  { path: '/tesoreria/procesos/conciliacion-cuentas',            component: () => import('../views/tesoreria/ConciliacionCuentasView.vue'),        meta: { requiresAuth: true } },
  { path: '/tesoreria/procesos/movimientos-bancarios',           component: () => import('../views/tesoreria/MovimientosBancariosView.vue'),       meta: { requiresAuth: true } },
  { path: '/tesoreria/procesos/facturas-compra',                 component: () => import('../views/tesoreria/FacturasCompraView.vue'),             meta: { requiresAuth: true } },
  { path: '/tesoreria/procesos/facturas-venta',                  component: () => import('../views/tesoreria/FacturasVentaView.vue'),              meta: { requiresAuth: true } },
  { path: '/tesoreria/reportes/conciliacion-bancaria',           component: () => import('../views/tesoreria/ReporteConciliacionView.vue'),        meta: { requiresAuth: true } },
  { path: '/tesoreria/reportes/movimiento-cuentas',              component: () => import('../views/tesoreria/ReporteMovimientoCuentasView.vue'),   meta: { requiresAuth: true } },
  { path: '/tesoreria/reportes/ventas-periodo',                  component: () => import('../views/tesoreria/ReporteVentasPeriodoView.vue'),       meta: { requiresAuth: true } },
  { path: '/tesoreria/reportes/ventas-productos-periodo',        component: () => import('../views/tesoreria/ReporteVentasProductosView.vue'),     meta: { requiresAuth: true } },

  // TESORERÍA — patrón general
  { path: '/tesoreria/:section?/:item?', component: () => import('../views/TesoreriaView.vue'), meta: { requiresAuth: true } },

  // ALMACÉN ESPECÍFICAS
  { path: '/almacen/configuracion/productos',          component: () => import('../views/almacen/ProductosView.vue'),          meta: { requiresAuth: true } },
  { path: '/almacen/configuracion/control-inventario', component: () => import('../views/almacen/ControlInventarioView.vue'),   meta: { requiresAuth: true } },
  { path: '/almacen/procesos/gestion-inventario',      component: () => import('../views/almacen/GestionInventarioView.vue'),  meta: { requiresAuth: true } },
  { path: '/almacen/procesos/toma-fisica',             component: () => import('../views/almacen/TomaFisicaView.vue'),        meta: { requiresAuth: true } },
  { path: '/almacen/procesos/valoracion',              component: () => import('../views/almacen/ValoracionView.vue'),        meta: { requiresAuth: true } },
  { path: '/almacen/procesos/ordenes-compra',          component: () => import('../views/almacen/OrdenesCompraView.vue'),     meta: { requiresAuth: true } },
  { path: '/almacen/reportes/kardex',                  component: () => import('../views/almacen/ReporteKardexView.vue'),     meta: { requiresAuth: true } },
  { path: '/almacen/reportes/consumos',                component: () => import('../views/almacen/ReporteConsumosView.vue'),   meta: { requiresAuth: true } },

  // ALMACÉN — patrón general
  { path: '/almacen/:section?/:item?', component: () => import('../views/AlmacenView.vue'), meta: { requiresAuth: true } },

  // PRODUCCIÓN
  { path: '/produccion/:section?/:item?', component: () => import('../views/ProduccionView.vue'), meta: { requiresAuth: true } },

  // NÓMINA
  { path: '/nomina/:section?/:item?', component: () => import('../views/NominaView.vue'), meta: { requiresAuth: true } },

  // GERENCIA
  { path: '/gerencia/:section?/:item?', component: () => import('../views/GerenciaView.vue'), meta: { requiresAuth: true } },

  // CONFIGURACIÓN
  { path: '/configuracion', component: () => import('../views/ConfiguracionView.vue'), meta: { requiresAuth: true } },

  // 404
  { path: '/:pathMatch(.*)*', component: () => import('../views/NotFoundView.vue') },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) authStore.loadFromLocalStorage()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
