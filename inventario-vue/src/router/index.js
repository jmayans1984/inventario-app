import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/LoginView.vue'), meta: { requiresAuth: false } },
  { path: '/', name: 'Inicio', component: () => import('../views/DashboardView.vue'), meta: { requiresAuth: true } },

  // CONTABILIDAD — captura /contabilidad, /contabilidad/configuracion/proveedores, etc.
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
  history: createWebHistory(),
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
