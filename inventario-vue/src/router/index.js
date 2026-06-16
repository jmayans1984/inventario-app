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
  { path: '/tesoreria/procesos/facturas-compra',                 component: () => import('../views/tesoreria/FacturasCompraClienteView.vue'),    meta: { requiresAuth: true, requiredTipo: 'CLIENTE' } },
  { path: '/tesoreria/procesos/facturas-venta',                  component: () => import('../views/tesoreria/FacturasVentaView.vue'),              meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/tesoreria/reportes/conciliacion-bancaria',           component: () => import('../views/tesoreria/ReporteConciliacionView.vue'),        meta: { requiresAuth: true } },
  { path: '/tesoreria/reportes/movimiento-cuentas',              component: () => import('../views/tesoreria/ReporteMovimientoCuentasView.vue'),   meta: { requiresAuth: true } },
  { path: '/tesoreria/reportes/ventas-periodo',                  component: () => import('../views/tesoreria/ReporteVentasPeriodoView.vue'),       meta: { requiresAuth: true } },
  { path: '/tesoreria/reportes/ventas-productos-periodo',        component: () => import('../views/tesoreria/ReporteVentasProductosView.vue'),     meta: { requiresAuth: true } },

  // TESORERÍA — patrón general
  { path: '/tesoreria/:section?/:item?', component: () => import('../views/TesoreriaView.vue'), meta: { requiresAuth: true } },

  // ALMACÉN ESPECÍFICAS
  { path: '/almacen/configuracion/productos',          component: () => import('../views/almacen/ProductosView.vue'),          meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/almacen/configuracion/precios',            component: () => import('../views/almacen/PreciosProductosView.vue'),    meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/almacen/configuracion/control-stock',      component: () => import('../views/almacen/ControlStockView.vue'),        meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/almacen/configuracion/control-inventario', component: () => import('../views/almacen/ControlInventarioView.vue'),   meta: { requiresAuth: true } },
  { path: '/almacen/configuracion/impresion-barcodes', component: () => import('../views/almacen/ImpresionBarcodesView.vue'), meta: { requiresAuth: true } },
  { path: '/almacen/configuracion/grupo-productos',    component: () => import('../views/almacen/GrupoProductosAlmacenView.vue'), meta: { requiresAuth: true } },
  { path: '/almacen/procesos/gestion-inventario',      component: () => import('../views/almacen/GestionInventarioView.vue'),  meta: { requiresAuth: true } },
  { path: '/almacen/procesos/toma-fisica',             component: () => import('../views/almacen/TomaFisicaView.vue'),        meta: { requiresAuth: true } },
  { path: '/almacen/procesos/valoracion',              component: () => import('../views/almacen/ValoracionView.vue'),        meta: { requiresAuth: true } },
  { path: '/almacen/procesos/ordenes-compra',          component: () => import('../views/almacen/OrdenesCompraView.vue'),     meta: { requiresAuth: true } },
  { path: '/almacen/procesos/despachos',               component: () => import('../views/almacen/DespachosBodegaView.vue'),   meta: { requiresAuth: true } },
  { path: '/almacen/reportes/kardex',                  component: () => import('../views/almacen/ReporteKardexView.vue'),     meta: { requiresAuth: true } },
  { path: '/almacen/reportes/consumos',                component: () => import('../views/almacen/ReporteConsumosView.vue'),   meta: { requiresAuth: true } },
  { path: '/almacen/reportes/consumo-insumos',         component: () => import('../views/almacen/ReporteConsumoInsumosView.vue'), meta: { requiresAuth: true } },
  { path: '/almacen/reportes/alertas-stock',            component: () => import('../views/almacen/ReporteAlertasStockView.vue'),        meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/almacen/reportes/movimiento-producto',      component: () => import('../views/almacen/ReporteMovimientoProductoView.vue'),   meta: { requiresAuth: true } },
  { path: '/almacen/reportes/kardex-consolidado',       component: () => import('../views/almacen/KardexConsolidadoView.vue'),            meta: { requiresAuth: true } },

  // ALMACÉN — patrón general
  { path: '/almacen/:section?/:item?', component: () => import('../views/AlmacenView.vue'), meta: { requiresAuth: true } },

  // PRODUCCIÓN ESPECÍFICAS (Solo para PROVEEDOR)
  // Alias de Almacén → abren las mismas vistas pero bajo ruta /produccion para que el menú resalte Proveeduría
  { path: '/produccion/configuracion/productos',         component: () => import('../views/almacen/ProductosView.vue'),           meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/produccion/configuracion/precios',           component: () => import('../views/almacen/PreciosProductosView.vue'),    meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/produccion/configuracion/control-stock',     component: () => import('../views/almacen/ControlStockView.vue'),        meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/produccion/configuracion/productos-venta',   component: () => import('../views/produccion/ProductosVentaView.vue'),   meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/produccion/configuracion/grupo-productos',   component: () => import('../views/produccion/GrupoProductosView.vue'),   meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/produccion/configuracion/lista-precios',     component: () => import('../views/produccion/ListaPreciosView.vue'),     meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/produccion/procesos/ordenes-compra',         component: () => import('../views/produccion/OrdenesCompraView.vue'),    meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/produccion/informes/lista-precios',          component: () => import('../views/produccion/ReporteListaPreciosView.vue'), meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/produccion/informes/ordenes-compra',         component: () => import('../views/produccion/ReporteOrdenesCompraView.vue'), meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },

  // PRODUCCIÓN — patrón general
  { path: '/produccion/:section?/:item?', component: () => import('../views/ProduccionView.vue'), meta: { requiresAuth: true } },

  // RECETAS ESPECÍFICAS
  { path: '/recetas/configuracion/catalogo',  component: () => import('../views/recetas/RecetasCatalogoView.vue'),  meta: { requiresAuth: true } },
  { path: '/recetas/configuracion/articulos', component: () => import('../views/recetas/RecetasArticulosView.vue'), meta: { requiresAuth: true } },
  { path: '/recetas/configuracion/precios',           component: () => import('../views/recetas/RecetasPreciosView.vue'),              meta: { requiresAuth: true } },
  { path: '/recetas/configuracion/precios-cv',        component: () => import('../views/recetas/RecetasPreciosCompraVentaView.vue'),   meta: { requiresAuth: true } },
  { path: '/recetas/configuracion/grupos-articulos',  component: () => import('../views/recetas/RecetasGruposArticulosView.vue'),      meta: { requiresAuth: true } },
  { path: '/recetas/reportes/valoracion-ventas',      component: () => import('../views/recetas/RecetasValoracionVentasView.vue'),     meta: { requiresAuth: true } },
  { path: '/recetas/procesos/costos',         component: () => import('../views/recetas/RecetasGestionView.vue'),   meta: { requiresAuth: true } },
  { path: '/recetas/reportes/costos',         component: () => import('../views/recetas/RecetasCostosView.vue'),    meta: { requiresAuth: true } },
  { path: '/recetas/reportes/fichas',         component: () => import('../views/recetas/RecetasFichasView.vue'),    meta: { requiresAuth: true } },

  // RECETAS — patrón general
  { path: '/recetas/:section?/:item?', component: () => import('../views/RecetasView.vue'), meta: { requiresAuth: true } },

  // NÓMINA — vistas específicas (antes del catch-all)
  { path: '/nomina/configuracion/empleados',      component: () => import('../views/nomina/EmpleadosView.vue'),         meta: { requiresAuth: true } },
  { path: '/nomina/configuracion/cargos',         component: () => import('../views/nomina/CargosView.vue'),            meta: { requiresAuth: true } },
  { path: '/nomina/configuracion/fiscal',         component: () => import('../views/nomina/ConfigFiscalNominaView.vue'), meta: { requiresAuth: true } },
  { path: '/nomina/configuracion/horario-config', component: () => import('../views/nomina/HorarioConfigView.vue'),     meta: { requiresAuth: true } },
  { path: '/nomina/procesos/horario',             component: () => import('../views/nomina/HorarioSemanalView.vue'),    meta: { requiresAuth: true } },
  { path: '/nomina/procesos/liquidacion',         component: () => import('../views/nomina/LiquidacionNominaView.vue'), meta: { requiresAuth: true } },
  { path: '/nomina/reportes/horario',             component: () => import('../views/nomina/ReporteHorarioView.vue'),    meta: { requiresAuth: true } },
  { path: '/nomina/reportes/recibos',             component: () => import('../views/nomina/RecibosNominaView.vue'),     meta: { requiresAuth: true } },
  { path: '/nomina/reportes/nomina',              component: () => import('../views/nomina/ReporteNominaView.vue'),     meta: { requiresAuth: true } },
  { path: '/nomina/:section?/:item?',             component: () => import('../views/NominaView.vue'),                   meta: { requiresAuth: true } },

  // GERENCIA ESPECÍFICAS
  { path: '/gerencia/reportes/ejecutivo',       component: () => import('../views/gerencia/DashboardEjecutivoView.vue'),    meta: { requiresAuth: true } },
  { path: '/gerencia/reportes/kpis',            component: () => import('../views/gerencia/KPIsView.vue'),                  meta: { requiresAuth: true } },
  { path: '/gerencia/reportes/analisis-ventas', component: () => import('../views/gerencia/GerenciaAnalisisVentasView.vue'), meta: { requiresAuth: true } },

  // GERENCIA — patrón general
  { path: '/gerencia/:section?/:item?', component: () => import('../views/GerenciaView.vue'), meta: { requiresAuth: true } },

  // FORMATOS / DOCUMENTOS
  { path: '/formatos/planilla-toma-fisica', component: () => import('../views/formatos/PlanillaTomaFisicaView.vue'), meta: { requiresAuth: true } },
  { path: '/formatos/:section?/:item?', component: () => import('../views/FormatosView.vue'), meta: { requiresAuth: true } },

  // CONFIGURACIÓN
  { path: '/configuracion/notificaciones', component: () => import('../views/NotificacionesView.vue'), meta: { requiresAuth: true } },
  { path: '/configuracion/bodega-maestra', component: () => import('../views/BodegaMaestraView.vue'), meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/configuracion/permisos-clientes', component: () => import('../views/PermisosClientesView.vue'), meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
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

  // Verificar autenticación
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }

  // Verificar tipo de empresa si la ruta lo requiere
  // Solo bloquea si el tipo está explícitamente definido Y no coincide
  if (to.meta.requiredTipo && authStore.empresa && authStore.empresaTipo) {
    const tipoEmpresa = authStore.empresaTipo
    if (tipoEmpresa !== to.meta.requiredTipo) {
      // Usuario no tiene permiso para esta ruta, redirecciona a inicio
      next('/')
      return
    }
  }

  // Redirigir login → home si ya está autenticado
  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
