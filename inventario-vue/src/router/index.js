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

  // TESORERÍA
  { path: '/tesoreria/:section?/:item?', component: () => import('../views/TesoreriaView.vue'), meta: { requiresAuth: true } },

  // ALMACÉN
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
