import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Helper para generar rutas de submódulo
const subRoutes = (prefix, view) => [
  { path: `/${prefix}`, component: view, meta: { requiresAuth: true } },
  { path: `/${prefix}/configuracion`, component: view, meta: { requiresAuth: true } },
  { path: `/${prefix}/procesos`, component: view, meta: { requiresAuth: true } },
  { path: `/${prefix}/reportes`, component: view, meta: { requiresAuth: true } },
]

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/LoginView.vue'), meta: { requiresAuth: false } },
  { path: '/', name: 'Inicio', component: () => import('../views/DashboardView.vue'), meta: { requiresAuth: true } },

  ...subRoutes('contabilidad', () => import('../views/ContabilidadView.vue')),
  ...subRoutes('tesoreria', () => import('../views/TesoreriaView.vue')),
  ...subRoutes('almacen', () => import('../views/AlmacenView.vue')),
  ...subRoutes('produccion', () => import('../views/ProduccionView.vue')),
  ...subRoutes('nomina', () => import('../views/NominaView.vue')),
  ...subRoutes('gerencia', () => import('../views/GerenciaView.vue')),

  { path: '/configuracion', component: () => import('../views/ConfiguracionView.vue'), meta: { requiresAuth: true } },
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
