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

### Módulo PRODUCCIÓN — Órdenes Multi-Receta (2026-06-17)
- ✅ **Paso 1 - Crear Orden:** Flujo dinámico para agregar múltiples recetas a UNA orden (mismo día)
  - Selector de receta (subproducto='SI') + cantidad + botón "Agregar Receta"
  - Tabla que muestra todas las recetas en la orden con opción eliminar
  - Campos de fecha inicio, vencimiento, observaciones
  - **Nuevo:** Muestra automáticamente:
    - 📦 Inventario Bodega (último saldo_final de DETALLE_INVENTARIO)
    - 📊 Consumo Últimos 7 Días (suma salidas en DETALLE_INVENTARIO)
    - ✅ Diferencia recomendada (consumo - stock = cuánto producir)

- ✅ **Paso 2 - Ingredientes:** Consolidados de TODAS las recetas
  - Tabla muestra ingrediente + receta de origen + cantidad necesaria + costo
  - Costo total es suma de todos los ingredientes de todas las recetas

- ✅ **Paso 3 - Registrar Producción:** Cantidad planeada = suma de todas las recetas
  - Campo cantidad real producida
  - Observaciones de producción

- ✅ **Paso 4 - Generar Etiquetas:** Label 4x6 (pendiente completar)

- ✅ **Endpoint Backend:** `GET /api/detalle-inventario/analisis/:codigo`
  - Retorna: `{ success, data: { codigo, stock_actual, consumo_7_dias } }`
  - stock_actual = último saldo_final
  - consumo_7_dias = SUM(salidas) últimos 7 días

- ✅ **UI:** Color uniforme #8b5cf6 (morado) para todo el módulo

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

### P0 — Módulo PRODUCCIÓN (EN PROGRESO)
1. ✅ Paso 1: Crear orden multi-receta con inventario/consumo
2. ✅ Paso 2: Ingredientes consolidados
3. ✅ Paso 3: Registrar producción real
4. ⚠️ **TODO:** Paso 4 - Generar etiquetas 4x6 (diseño completo)
5. ⚠️ **TODO:** Reportes de producción
6. ⚠️ **ISSUE:** GitHub Pages caché - v1.13 aún muestra v1.11 (necesita verificación)

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

### GitHub Pages — Arquitectura del Deployment (IMPORTANTE)

**Cómo funciona el sistema actual:**
- GitHub Pages publica desde la rama `gh-pages`
- El workflow `.github/workflows/build-deploy.yml` se dispara cuando hay cambios en `inventario-vue/**`
- El workflow: instala deps → build Vite → commitea `completa/` → pushea a `main` Y `gh-pages`
- `completa/index.html` es GENERADO por Vite desde `inventario-vue/index.html` (no editar manualmente)
- El script de auto-reload y la versión van en `inventario-vue/index.html` para que persistan en los builds

**Script de auto-reload (en `inventario-vue/index.html`):**
```html
<meta name="version" content="X.X" />
...
<script>
  (function(){
    var v='X.X';
    if(localStorage.getItem('_appv')!==v){
      fetch(location.href,{cache:'no-store'}).then(function(r){return r.text()}).then(function(html){
        if(html.indexOf('content="'+v+'"')<0)return;
        localStorage.setItem('_appv',v);
        location.reload(true);
      });
    }
  })();
</script>
```
- Busca `content="X.X"` en el HTML fetchado (sin caché)
- Solo recarga si el servidor YA tiene la nueva versión
- Para forzar nueva recarga: incrementar la versión en ambos lugares (`meta` y `var v=`)
- También actualizar `APP_VERSION` en `inventario-vue/src/utils/constants.js`

**Para forzar actualización en producción:**
```powershell
# Solo cambiar la versión en inventario-vue/index.html y constants.js
# El workflow hace el build y deploy automáticamente
# Después: abrir en incógnito la primera vez
```

**Problemas que tuvimos y sus soluciones:**

| Problema | Causa | Solución |
|----------|-------|----------|
| `gh-pages` desactualizado | El workflow solo pusheaba a `main` | Agregar `git push -f origin HEAD:gh-pages` al workflow |
| `npm ci` falla | `package-lock.json` está en `.gitignore` | Usar `npm install` en el workflow |
| `git push 403` en workflow | GITHUB_TOKEN sin permisos de escritura | Agregar `permissions: contents: write` al job |
| Workflow no se dispara | Cambio en `.github/` no cumple path filter `inventario-vue/**` | Hacer un cambio dummy en `inventario-vue/index.html` |
| `gh-pages` muy atrás | Fix del workflow no se ejecutó (sin cambios en `inventario-vue/`) | `git push -f origin main:gh-pages` manualmente |
| Página en caché | Browser sirve HTML viejo | Abrir en incógnito o Ctrl+Shift+R |

**Estado del workflow (`.github/workflows/build-deploy.yml`):**
```yaml
jobs:
  build:
    permissions:
      contents: write    # ← CRÍTICO para poder hacer git push
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: '24'  # sin cache (package-lock no está en git)
      - run: npm install      # no npm ci
      - run: npm run build
      - run: |
          git push origin HEAD:main
          git push -f origin HEAD:gh-pages  # ← pushea a las DOS ramas
```

### Próxima sesión
- **Completar:** Paso 4 - Generar etiquetas (diseño label 4x6)
- **Luego:** Franquicia + Precios (P1)
