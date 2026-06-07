# inventario-app — Estado Actual

## Stack
- **Frontend:** Vue 3 + Vuetify (deployed en GitHub Pages)
- **Backend:** Node.js/Express (railway.app)
- **DB:** PostgreSQL (15.x)
- **Diseño:** Dark theme Vuetify, gradientes de colores por módulo

## Arquitectura
- **Monoproveedor-multicliente:** Una empresa PROVEEDOR vende a múltiples empresas CLIENTE
- **Modular:** Cada negocio (Almacén, Proveeduría, Nómina, Recetas, etc.) tiene su propio módulo
- **Centro de costos:** Control por ccosto en nómina, recetas, ventas
- **Auth:** JWT + Pinia stores (authStore, empresaStore)

## Módulos completados ✅

| Módulo | Estado | Notas |
|--------|--------|-------|
| **Almacén** | ✅ Completo | Kardex, valoración, toma física, órdenes de compra |
| **Proveeduría** | ⚠️ En desarrollo | Productos venta, listas precios, órdenes cliente (nuevo) |
| **Nómina** | ✅ Completo | Empleados, horarios, liquidación, reportes |
| **Recetas** | ✅ Completo | Catálogo jerárquico, subrecetas, costos |
| **Contabilidad** | ✅ Básico | Módulo de proveedores, movimientos bancarios |
| **Tesorería** | ⚠️ Parcial | Facturas compra cliente, reportes ventas |

## Bugs arreglados recientemente

### Órdenes de Compra (Almacén - Cliente)
- ✅ **Ruta mis-órdenes:** GET `/api/ordenes-compra/mis-ordenes` registrado ANTES de wildcard `/:codigo` (Express capturaba parámetro incorrectamente)
- ✅ **Dialog fullscreen → popup:** Cambio de `fullscreen persistent` a `max-width="1100" max-height:88vh`
- ✅ **Fecha entrega requerida:** Validación pre-envío + campo en rojo si vacío
- ✅ **Enter navega productos:** Función `navegarEnter()` con `data-codigo` en inputs cantidad
- ✅ **Footer rediseñado:** 2 filas (campos + acciones), botón Cancelar rojo, botón Enviar verde

### Soportes de Entrega
- ✅ **Imágenes no cargaban:** Backend retorna `archivo_data` como `data:mime;base64,...` — frontend estaba duplicando prefijo
- ✅ **UX mejorada:** Quitar botón Subir, agregar descargar al hover, botón Cerrar rojo en footer

### Código de Orden
- ✅ **Generación:** Cambio de `OC-{proveedor}-{seq}` a `OC-{cliente}-{seq}` (cada cliente tiene secuencia independiente)

### Detalle de Orden
- ✅ **Campo producto:** Backend retorna `producto_nombre`, frontend leía `nombre_producto` → fallback cascade

## Cambios recientes ✅

### Franquicia + Productos Unificados
- ✅ **Tabla `productos` expandida** con campos: `para_venta`, `precio_venta1/2/3`
- ✅ **GET /api/almacen/productos** filtra por `para_venta='SI'` si `tipo_empresa='CLIENTE'` (franquiciado)
- ✅ **PATCH /api/almacen/productos/:codigo/toggle-para-venta** permite MAYDO marcar qué productos vender a franquiciados
- ✅ **POST ordenes-compra/crear** valida que CLIENTEs solo ordenen productos con `para_venta='SI'`
- ✅ **Frontend:** Columna FRANQUICIA con toggle en ProductosView.vue
- ✅ **OrdenesCompraView** usa `/almacen/productos` (unificado) en lugar de `/produccion/productos-venta`

## Bugs conocidos pendientes ⚠️

### Proveeduría - Modelo simplificado ✅
- ✅ **Inventario bodega:** Un solo movimiento en `detalle_inventario` cuando se entrega orden
- ✅ **Separación catálogo:** Campo `para_venta` diferencia productos MAYDO vs franquiciados
- **Siguiente:** UI para que MAYDO marque precios por franquiciado (si aplica)

## Próximos pasos (Orden de prioridad)

### P1 — Franquicia + Precios
1. ✅ Tabla productos unificada con para_venta y precio_venta1/2/3
2. ⚠️ **EN PROGRESO:** UI para que MAYDO marque qué productos vende a cada franquiciado
3. ⚠️ **TODO:** Validar que el descargue de inventario funciona cuando franquiciado hace orden
4. **TODO:** Crear centro de costos "PROVEEDURÍA" si no existe

### P2 — Centros de Costo + P&L
1. Crear 3 centros de costo en MAYDO:
   - FOOD TRUCK A
   - FOOD TRUCK B
   - PROVEEDURÍA (para franquicia)
2. Asignar `ccosto` automáticamente a facturas de venta según módulo
3. Reporte P&L por centro de costo (Ingresos - COGS - Gastos = Utilidad)

### P3 — Reportes por Centro de Costo
1. Reporte de ventas por producto/período (ya está en plan)
2. Kardex por ccosto
3. Consumo de materia prima distribuido (60/40 FT-A/FT-B, 100% Proveeduría)

### P4 — Facturas de Venta (Proveedor)
- Vista para que proveedor vea todas sus facturas a clientes
- Flujo de aprobación de pago + movimientos bancarios
- Saldo a favor de cliente (sobrepagos)

### P5 — Integración Contable
- Asiento automático al generar factura de venta
- Conciliación con MOVIBAN

## Archivos/Carpetas clave

```
inventario-app/
├── inventario-vue/
│   ├── src/
│   │   ├── views/
│   │   │   ├── almacen/
│   │   │   │   └── OrdenesCompraView.vue ← Cliente (NUEVO)
│   │   │   ├── produccion/
│   │   │   │   ├── ListaPreciosView.vue ← Margen % único por lista
│   │   │   │   ├── ProductosVentaView.vue ← Grid de venta
│   │   │   │   └── OrdenesCompraView.vue ← Proveedor (órdenes recibidas)
│   │   │   └── tesoreria/
│   │   │       ├── FacturasCompraClienteView.vue
│   │   │       └── ReporteVentasProductosView.vue (en plan)
│   │   ├── stores/
│   │   │   ├── auth.js ← empresaCodigo, tipo (PROVEEDOR/CLIENTE)
│   │   │   └── empresa.js
│   │   └── utils/
│   │       └── constants.js ← menú con requiredTipo
│   │
│   └── vite.config.js
│
└── server-modular-UNICO.js ← BACKEND (TODO en un archivo)
    ├── AUTO-MIGRATION: margen, nivel en config_listas_precios
    ├── GET /api/empresas/proveedor
    ├── GET /api/ordenes-compra/mis-ordenes ← ANTES de wildcard
    ├── PUT /api/empresas/clientes/:codigo/lista-precio
    ├── POST /api/ordenes-compra/crear
    ├── GET /api/ordenes-compra/:codigo/detalles
    ├── POST /api/produccion/productos-venta/recalcular-precios
    └── GET/POST /api/soportes-entrega/*
```

## Notas importantes

### Convenciones
- **Código empresa:** INT (1=MAYDO, 2+=clientes)
- **Código cliente en orden:** Mismo valor que `empresa.codigo` del cliente
- **Precio venta:** 3 niveles (PRECIO1, PRECIO2, PRECIO3) = 3 márgenes independientes
- **Estado orden:** PENDIENTE → ENTREGADA → FACTURADA
- **Estado factura venta:** PENDIENTE → POR VERIFICAR → PAGADA

### Migrations ejecutadas
- `ALTER TABLE productos_venta ADD COLUMN margen NUMERIC(5,2)`
- `ALTER TABLE config_listas_precios ADD COLUMN margen NUMERIC(5,2), nivel VARCHAR(10)`

### Rate limits / Consideraciones
- PostgreSQL: conexión única en pool (10 connections)
- Railway: redeployment automático en `git push`
- Vuetify theme: Material Design 3

### Debugging
- Backend logs: `console.error()` en routes, visible en Railway dashboard
- Frontend: DevTools Vue, Vuetify inspect, localStorage para empresaActual

### Próxima sesión
- **Decisión:** Modelo de bodega única (REVENTA vs CONSUMO en compras)
- **Luego:** Migrations para agregar `ccosto_id` a `ordenes_compra` + `factura_venta`
- **Build:** `npm run build` + `git add -A && git commit -m "..." && git push`
