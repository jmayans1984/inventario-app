import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/LoginView.vue'), meta: { requiresAuth: false } },
  { path: '/', name: 'Inicio', component: () => import('../views/DashboardView.vue'), meta: { requiresAuth: true } },

  // MARCAJE DE ASISTENCIA — pública: el empleado no tiene cuenta en la app
  { path: '/marcar', name: 'Marcar', component: () => import('../views/MarcajeView.vue'), meta: { requiresAuth: false } },

  // CONTABILIDAD ESPECÍFICAS
  { path: '/contabilidad/dashboard',                      component: () => import('../views/contabilidad/ContabilidadDashboardView.vue'), meta: { requiresAuth: true } },
  { path: '/contabilidad/configuracion/proveedores',     component: () => import('../views/contabilidad/ProveedoresView.vue'),     meta: { requiresAuth: true } },
  { path: '/contabilidad/configuracion/centros-costos',   component: () => import('../views/contabilidad/CentroCostosView.vue'),      meta: { requiresAuth: true } },
  { path: '/contabilidad/configuracion/cuentas-bancarias', component: () => import('../views/contabilidad/CuentasBancariasView.vue'), meta: { requiresAuth: true } },
  { path: '/contabilidad/configuracion/cuentas-contables', component: () => import('../views/contabilidad/CuentasContablesView.vue'), meta: { requiresAuth: true } },
  { path: '/contabilidad/procesos/gastos',                 component: () => import('../views/contabilidad/GestionGastosView.vue'),     meta: { requiresAuth: true } },
  { path: '/contabilidad/reportes/gastos',                 component: () => import('../views/contabilidad/ReporteGastosView.vue'),      meta: { requiresAuth: true } },
  { path: '/contabilidad/reportes/estado-resultados',      component: () => import('../views/contabilidad/EstadoResultadosView.vue'),  meta: { requiresAuth: true } },

  // CONTABILIDAD — patrón general (captura /contabilidad, /contabilidad/configuracion, etc.)
  { path: '/contabilidad/:section?/:item?', component: () => import('../views/ContabilidadView.vue'), meta: { requiresAuth: true } },

  // TESORERÍA ESPECÍFICAS
  { path: '/tesoreria/configuracion/cuentas-bancarias',          component: () => import('../views/tesoreria/CuentasBancariasView.vue'),          meta: { requiresAuth: true } },
  { path: '/tesoreria/procesos/importar-ventas',                 component: () => import('../views/tesoreria/ImportarVentasView.vue'),             meta: { requiresAuth: true } },
  { path: '/tesoreria/procesos/importar-ventas-v2',              component: () => import('../views/tesoreria/ImportarVentasV2View.vue'),           meta: { requiresAuth: true } },
  { path: '/tesoreria/procesos/conciliacion-cuentas',            component: () => import('../views/tesoreria/ConciliacionCuentasView.vue'),        meta: { requiresAuth: true } },
  { path: '/tesoreria/procesos/movimientos-bancarios',           component: () => import('../views/tesoreria/MovimientosBancariosView.vue'),       meta: { requiresAuth: true } },
  { path: '/tesoreria/procesos/cuentas-por-pagar',               component: () => import('../views/tesoreria/CuentasPorPagarView.vue'),            meta: { requiresAuth: true } },
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
  { path: '/almacen/configuracion/costos-productos',   component: () => import('../views/almacen/CostosProductosView.vue'),     meta: { requiresAuth: true } },
  { path: '/almacen/configuracion/control-stock',      component: () => import('../views/almacen/ControlStockView.vue'),        meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/almacen/configuracion/control-inventario', component: () => import('../views/almacen/ControlInventarioView.vue'),   meta: { requiresAuth: true } },
  { path: '/almacen/configuracion/impresion-barcodes', component: () => import('../views/almacen/ImpresionBarcodesView.vue'), meta: { requiresAuth: true } },
  { path: '/almacen/configuracion/grupo-productos',    component: () => import('../views/almacen/GrupoProductosAlmacenView.vue'), meta: { requiresAuth: true } },
  { path: '/almacen/configuracion/etiquetas-producto',  component: () => import('../views/almacen/EtiquetasProductoView.vue'),  meta: { requiresAuth: true } },
  { path: '/almacen/configuracion/ubicacion-productos', component: () => import('../views/almacen/UbicacionProductosView.vue'), meta: { requiresAuth: true } },
  { path: '/almacen/configuracion/mapeo-receta-producto', component: () => import('../views/almacen/MapeoRecetaProductoView.vue'), meta: { requiresAuth: true } },
  { path: '/almacen/configuracion/mapeo-articulo-producto', component: () => import('../views/almacen/MapeoArticuloProductoView.vue'), meta: { requiresAuth: true } },
  { path: '/almacen/configuracion/presentaciones-compra', component: () => import('../views/almacen/PresentacionesCompraView.vue'), meta: { requiresAuth: true } },
  { path: '/almacen/procesos/gestion-inventario',      component: () => import('../views/almacen/GestionInventarioView.vue'),  meta: { requiresAuth: true } },
  { path: '/almacen/procesos/toma-fisica',             component: () => import('../views/almacen/TomaFisicaView.vue'),        meta: { requiresAuth: true } },
  // Misma pantalla que /almacen/reportes/valoracion-mensual — se mantiene la ruta
  // de Procesos por compatibilidad con enlaces existentes, pero apunta al mismo
  // componente para que no vuelvan a divergir (antes era una copia desactualizada).
  { path: '/almacen/procesos/valoracion',              component: () => import('../views/almacen/ReporteValoracionMensualView.vue'), meta: { requiresAuth: true } },
  { path: '/almacen/procesos/ordenes-compra',          component: () => import('../views/almacen/OrdenesCompraView.vue'),     meta: { requiresAuth: true } },
  { path: '/almacen/procesos/despachos',               component: () => import('../views/almacen/DespachosBodegaView.vue'),   meta: { requiresAuth: true } },
  { path: '/almacen/procesos/ordenes-produccion',      component: () => import('../views/almacen/OrdenesProduccionView.vue'),  meta: { requiresAuth: true } },
  { path: '/almacen/procesos/lotes-fabricacion',       component: () => import('../views/almacen/LotesFabricacionView.vue'),   meta: { requiresAuth: true } },
  { path: '/almacen/reportes/kardex',                  component: () => import('../views/almacen/ReporteKardexView.vue'),     meta: { requiresAuth: true } },
  { path: '/almacen/reportes/consumos',                component: () => import('../views/almacen/ReporteConsumosView.vue'),   meta: { requiresAuth: true } },
  { path: '/almacen/reportes/consumo-insumos',         component: () => import('../views/almacen/ReporteConsumoInsumosView.vue'), meta: { requiresAuth: true } },
  { path: '/almacen/reportes/alertas-stock',            component: () => import('../views/almacen/ReporteAlertasStockView.vue'),        meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/almacen/reportes/movimiento-producto',      component: () => import('../views/almacen/ReporteMovimientoProductoView.vue'),   meta: { requiresAuth: true } },
  { path: '/almacen/reportes/kardex-consolidado',       component: () => import('../views/almacen/KardexConsolidadoView.vue'),            meta: { requiresAuth: true } },
  { path: '/almacen/reportes/prediccion-agotamiento',   component: () => import('../views/almacen/PrediccionAgotamientoView.vue'),       meta: { requiresAuth: true } },
  { path: '/almacen/reportes/toma-fisica',              component: () => import('../views/almacen/ReporteTomaFisicaView.vue'),           meta: { requiresAuth: true } },
  { path: '/almacen/reportes/entradas-almacen',         component: () => import('../views/almacen/ReporteEntradasAlmacenView.vue'),       meta: { requiresAuth: true } },
  { path: '/almacen/reportes/valoracion-mensual',       component: () => import('../views/almacen/ReporteValoracionMensualView.vue'),     meta: { requiresAuth: true } },

  // ALMACÉN — patrón general
  { path: '/almacen/:section?/:item?', component: () => import('../views/AlmacenView.vue'), meta: { requiresAuth: true } },

  // RECETAS ESPECÍFICAS
  // Edición de la fórmula/catálogo compartido (recetas, ingredientes, artículos,
  // precios, grupos) es exclusiva del principal — los clientes solo consultan
  // sus propios costos vía los reportes (que ya resuelven COALESCE por empresa).
  { path: '/recetas/configuracion/catalogo',  component: () => import('../views/recetas/RecetasCatalogoView.vue'),  meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/recetas/configuracion/articulos', component: () => import('../views/recetas/RecetasArticulosView.vue'), meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/recetas/configuracion/precios',           component: () => import('../views/recetas/RecetasPreciosView.vue'),              meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/recetas/configuracion/precios-cv',        component: () => import('../views/recetas/RecetasPreciosCompraVentaView.vue'),   meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/recetas/configuracion/grupos-articulos',  component: () => import('../views/recetas/RecetasGruposArticulosView.vue'),      meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/recetas/procesos/costos',         component: () => import('../views/recetas/RecetasGestionView.vue'),   meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  // Reportes: de solo lectura y ya resueltos por empresa (COALESCE capa/base) — abiertos a clientes.
  { path: '/recetas/reportes/valoracion-ventas',      component: () => import('../views/recetas/RecetasValoracionVentasView.vue'),     meta: { requiresAuth: true } },
  { path: '/recetas/reportes/costos',         component: () => import('../views/recetas/RecetasCostosView.vue'),    meta: { requiresAuth: true } },
  { path: '/recetas/reportes/fichas',         component: () => import('../views/recetas/RecetasFichasView.vue'),    meta: { requiresAuth: true } },

  // RECETAS — patrón general
  { path: '/recetas/:section?/:item?', component: () => import('../views/RecetasView.vue'), meta: { requiresAuth: true } },

  // PRODUCCIÓN/PROVEEDURÍA ESPECÍFICAS
  { path: '/produccion/configuracion/productos-venta', component: () => import('../views/produccion/ProductosVentaView.vue'), meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/produccion/configuracion/grupo-productos', component: () => import('../views/produccion/GrupoProductosView.vue'), meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/produccion/configuracion/lista-precios', component: () => import('../views/produccion/ListaPreciosView.vue'), meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/produccion/procesos/ordenes-compra', component: () => import('../views/produccion/OrdenesCompraView.vue'), meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/produccion/informes/lista-precios', component: () => import('../views/produccion/ReporteListaPreciosView.vue'), meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/produccion/informes/ordenes-compra', component: () => import('../views/produccion/ReporteOrdenesCompraView.vue'), meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },

  // PRODUCCIÓN/PROVEEDURÍA — patrón general
  { path: '/produccion/:section?/:item?', component: () => import('../views/ProduccionView.vue'), meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },

  // NÓMINA — vistas específicas (antes del catch-all)
  { path: '/nomina/configuracion/empleados',      component: () => import('../views/nomina/EmpleadosView.vue'),         meta: { requiresAuth: true } },
  { path: '/nomina/configuracion/cargos',         component: () => import('../views/nomina/CargosView.vue'),            meta: { requiresAuth: true } },
  { path: '/nomina/configuracion/fiscal',         component: () => import('../views/nomina/ConfigFiscalNominaView.vue'), meta: { requiresAuth: true } },
  { path: '/nomina/configuracion/horario-config', component: () => import('../views/nomina/HorarioConfigView.vue'),     meta: { requiresAuth: true } },
  { path: '/nomina/configuracion/control-asistencia', component: () => import('../views/nomina/ControlAsistenciaView.vue'), meta: { requiresAuth: true } },
  { path: '/nomina/configuracion/tags-nfc',       component: () => import('../views/nomina/TagsNfcView.vue'),           meta: { requiresAuth: true } },
  { path: '/nomina/procesos/horario',             component: () => import('../views/nomina/HorarioSemanalView.vue'),    meta: { requiresAuth: true } },
  { path: '/nomina/procesos/liquidacion',         component: () => import('../views/nomina/LiquidacionNominaView.vue'), meta: { requiresAuth: true } },
  { path: '/nomina/procesos/propinas',            component: () => import('../views/nomina/PropinasView.vue'),          meta: { requiresAuth: true } },
  { path: '/nomina/reportes/horario',             component: () => import('../views/nomina/ReporteHorarioView.vue'),    meta: { requiresAuth: true } },
  { path: '/nomina/reportes/recibos',             component: () => import('../views/nomina/RecibosNominaView.vue'),     meta: { requiresAuth: true } },
  { path: '/nomina/reportes/nomina',              component: () => import('../views/nomina/ReporteNominaView.vue'),     meta: { requiresAuth: true } },
  { path: '/nomina/reportes/propinas',            component: () => import('../views/nomina/ReportePropinasView.vue'),   meta: { requiresAuth: true } },
  { path: '/nomina/:section?/:item?',             component: () => import('../views/NominaView.vue'),                   meta: { requiresAuth: true } },

  // GERENCIA ESPECÍFICAS
  { path: '/gerencia/reportes/ejecutivo',       component: () => import('../views/gerencia/DashboardEjecutivoView.vue'),    meta: { requiresAuth: true } },
  { path: '/gerencia/reportes/analisis-ventas', component: () => import('../views/gerencia/GerenciaAnalisisVentasView.vue'), meta: { requiresAuth: true } },
  { path: '/gerencia/reportes/reviews',         component: () => import('../views/gerencia/PuntuacionReviewsView.vue'),      meta: { requiresAuth: true } },
  { path: '/gerencia/reportes/analisis-nomina', component: () => import('../views/gerencia/GerenciaAnalisisNominaView.vue'), meta: { requiresAuth: true } },
  { path: '/gerencia/reportes/pyg-sedes',       component: () => import('../views/gerencia/GerenciaPygSedesView.vue'),      meta: { requiresAuth: true } },
  { path: '/gerencia/reportes/proveedores',     component: () => import('../views/gerencia/GerenciaProveedoresView.vue'),   meta: { requiresAuth: true } },
  { path: '/gerencia/reportes/ingenieria-menu', component: () => import('../views/gerencia/GerenciaIngenieriaMenuView.vue'), meta: { requiresAuth: true } },
  { path: '/gerencia/reportes/labor-cost',      component: () => import('../views/gerencia/GerenciaLaborCostView.vue'),      meta: { requiresAuth: true } },
  { path: '/gerencia/reportes/consumo-mp',      component: () => import('../views/gerencia/GerenciaConsumoMPView.vue'),      meta: { requiresAuth: true } },
  { path: '/gerencia/reportes/analisis-costos', component: () => import('../views/gerencia/GerenciaAnalisisCostosView.vue'), meta: { requiresAuth: true } },
  { path: '/gerencia/reportes/sobrantes-faltantes', component: () => import('../views/gerencia/GerenciaFaltantesSobrantesView.vue'), meta: { requiresAuth: true } },

  // GERENCIA — patrón general
  { path: '/gerencia/:section?/:item?', component: () => import('../views/GerenciaView.vue'), meta: { requiresAuth: true } },

  // FORMATOS / DOCUMENTOS
  { path: '/formatos/planilla-toma-fisica', component: () => import('../views/formatos/PlanillaTomaFisicaView.vue'), meta: { requiresAuth: true } },
  { path: '/formatos/:section?/:item?', component: () => import('../views/FormatosView.vue'), meta: { requiresAuth: true } },

  // CONFIGURACIÓN
  { path: '/configuracion/notificaciones', component: () => import('../views/NotificacionesView.vue'), meta: { requiresAuth: true } },
  { path: '/configuracion/bodega-maestra', component: () => import('../views/BodegaMaestraView.vue'), meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/configuracion/permisos-clientes', component: () => import('../views/PermisosClientesView.vue'), meta: { requiresAuth: true, requiredTipo: 'PROVEEDOR' } },
  { path: '/configuracion/permisos-usuarios', component: () => import('../views/PermisosUsuariosView.vue'), meta: { requiresAuth: true } },
  { path: '/configuracion/general', component: () => import('../views/ConfiguracionView.vue'), meta: { requiresAuth: true } },
  { path: '/configuracion', component: () => import('../views/ConfiguracionDashboardView.vue'), meta: { requiresAuth: true } },

  // 404
  { path: '/:pathMatch(.*)*', component: () => import('../views/NotFoundView.vue') },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  try {
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
  } catch (e) {
    // Si Pinia no está inicializado aún, solo continúa
    next()
  }
})

export default router
