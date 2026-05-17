import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresAuth: false, layout: 'auth' },
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true, layout: 'main' },
  },
  {
    path: '/almacen',
    name: 'Almacen',
    component: () => import('../views/AlmacenView.vue'),
    meta: { requiresAuth: true, layout: 'main' },
  },
  {
    path: '/contabilidad',
    name: 'Contabilidad',
    component: () => import('../views/ContabilidadView.vue'),
    meta: { requiresAuth: true, layout: 'main' },
  },
  {
    path: '/tesoreria',
    name: 'Tesoreria',
    component: () => import('../views/TesoreriaView.vue'),
    meta: { requiresAuth: true, layout: 'main' },
  },
  {
    path: '/produccion',
    name: 'Produccion',
    component: () => import('../views/ProduccionView.vue'),
    meta: { requiresAuth: true, layout: 'main' },
  },
  {
    path: '/nomina',
    name: 'Nomina',
    component: () => import('../views/NominaView.vue'),
    meta: { requiresAuth: true, layout: 'main' },
  },
  {
    path: '/gerencia',
    name: 'Gerencia',
    component: () => import('../views/GerenciaView.vue'),
    meta: { requiresAuth: true, layout: 'main' },
  },
  {
    path: '/configuracion',
    name: 'Configuracion',
    component: () => import('../views/ConfiguracionView.vue'),
    meta: { requiresAuth: true, layout: 'main' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundView.vue'),
    meta: { requiresAuth: false },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Load from localStorage if not already loaded
  if (!authStore.isAuthenticated && !authStore.usuario) {
    authStore.loadFromLocalStorage()
  }

  const requiresAuth = to.meta.requiresAuth
  const isAuthenticated = authStore.isAuthenticated

  if (requiresAuth && !isAuthenticated) {
    // Redirect to login if trying to access protected route
    next('/login')
  } else if (to.path === '/login' && isAuthenticated) {
    // Redirect to dashboard if already logged in
    next('/')
  } else {
    next()
  }
})

export default router
