# 📋 Guía de Implementación - Fix de Descarga de Archivos PWA

## Estado Actual

Se han implementado las siguientes mejoras para solucionar el problema de descarga de archivos capturados desde la app PWA del celular:

### ✅ Cambios Realizados en Backend

#### 1. **Endpoint GET `/api/tesoreria/soportes/:id/descargar`** (línea 1722)
- **Cambio clave:** Usar `encode(archivo_data, 'base64')` en la consulta SELECT
- **Beneficio:** Garantiza que PostgreSQL siempre devuelva base64 válido, independientemente de su configuración interna
- **Ubicación:** `server-modular-UNICO.js` línea 1729

```javascript
// ANTES
SELECT archivo_data, nombre_archivo, tipo_archivo FROM soportes_pago WHERE id = $1

// DESPUÉS
SELECT encode(archivo_data, 'base64') as archivo_data, nombre_archivo, tipo_archivo FROM soportes_pago WHERE id = $1
```

#### 2. **Mejora en Decodificación** (línea 1748)
- Mejor manejo de diferentes formatos bytea (base64, hex, escape)
- Fallbacks múltiples para máxima compatibilidad
- **Ubicación:** `server-modular-UNICO.js` líneas 1748-1775

#### 3. **Nuevo Endpoint Diagnóstico: POST `/api/tesoreria/test-bytea`** (línea 1832)
- Prueba round-trip de datos bytea en PostgreSQL
- Verifica que los datos se almacenan y recuperan correctamente
- **Ubicación:** `server-modular-UNICO.js` líneas 1832-1879

**Uso:**
```bash
curl -X POST http://localhost:3001/api/tesoreria/test-bytea \
  -H "Content-Type: application/json" \
  -d '{"base64String":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="}'
```

#### 4. **Nuevo Endpoint Diagnóstico: GET `/api/tesoreria/soportes/:id/info`** (línea 1883)
- Obtiene información del soporte sin descargarlo
- Detecta el tipo de archivo por magic bytes
- Muestra tamaño y preview hex
- **Ubicación:** `server-modular-UNICO.js` líneas 1883-1930

**Uso:**
```bash
curl http://localhost:3001/api/tesoreria/soportes/123/info
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "nombre_archivo": "recibo.jpg",
    "archivo_size": 524288,
    "archivo_size_mb": "0.50",
    "hex_preview": "ffd8ffe0...",
    "tipo_detectado": "JPEG",
    "fecha_subida": "2026-05-21T10:30:00Z"
  }
}
```

#### 5. **Logging Agregado**
- **Upload (línea 1522):** Registra tamaño del archivo al subir
- **Download (línea 1802):** Registra tamaño al descargar
- **Utilidad:** Detectar si hay pérdida/aumento de datos en la cadena

---

## 🚀 Próximos Pasos Para El Usuario

### 1. **Restart del Backend Server**

```bash
# Detener servidor actual (si está corriendo en puerto 3000)
pkill -f "node server-modular-UNICO.js"

# Iniciar con puerto 3000 (asegurar que .env esté configurado)
cd /C/Users/JUAN/Documents/GitHub/inventario-app
node server-modular-UNICO.js
```

**Debe ver en la consola:**
```
✅ Conectado a PostgreSQL (Aiven)
🚀 Servidor MODULAR corriendo en puerto 3000
📊 API disponible en http://localhost:3000
❤️  Health check: http://localhost:3000/health
```

### 2. **Verificar que los Endpoints Existen**

```bash
# Verificar que el endpoint de test-bytea existe
curl -X POST http://localhost:3000/api/tesoreria/test-bytea \
  -H "Content-Type: application/json" \
  -d '{"base64String":"test"}'

# Debe retornar: {"success":false,"error":"..."}
# NO: Cannot POST /api/tesoreria/test-bytea
```

### 3. **Prueba del Round-Trip Bytea**

Si hay un soporte existente en la BD (id=1):

```bash
curl http://localhost:3000/api/tesoreria/soportes/1/info
```

**Verificar:**
- ✅ `archivo_size` es > 0
- ✅ `tipo_detectado` muestra JPEG, PNG, GIF o PDF
- ✅ `hex_preview` muestra caracteres válidos (no "\x" escape sequence)

### 4. **Prueba de Descarga desde Web**

1. Abrir http://localhost:5173/tesoreria/procesos/facturas-compra
2. Hacer clic en una factura que tenga soportes
3. Hacer clic en el botón descargar
4. **Verificar:**
   - ✅ El archivo se descarga
   - ✅ Se abre con el visor de imágenes (no error XML)
   - ✅ La imagen se ve correctamente

### 5. **Revisar Logs del Servidor**

En la consola donde está corriendo el servidor, buscar:

```
[CARGA] Factura: FAC-001, Archivo: IMG_001.JPG, Tipo: image/jpeg, Tamaño: 524288 bytes
[DESCARGA] ID: 45, Archivo: IMG_001.JPG, TipoArchivo: image/jpeg, BufferSize: 524288 bytes
```

**Validar:** Los tamaños deben ser idénticos (sin pérdida de datos).

---

## 📊 Matriz de Pruebas

| Prueba | Paso | Resultado Esperado |
|--------|------|---------------------|
| Test Bytea | POST /api/tesoreria/test-bytea | `"matches": true` |
| Info Soporte | GET /api/tesoreria/soportes/1/info | `"tipo_detectado": "JPEG"` |
| Descarga Web | Click botón descargar | Archivo se abre en visor |
| Descarga Móvil | Subir desde PWA, descargar en web | Misma imagen, mismo tamaño |
| Logs Sincronía | Revisar [CARGA] y [DESCARGA] | Tamaños iguales |

---

## 🐛 Troubleshooting

### Error: "Cannot POST /api/tesoreria/test-bytea"
**Causa:** Server no tiene los cambios nuevos (versión antigua)
**Solución:** Reiniciar servidor

### Error: "error": "" (vacío) en test-bytea
**Causa:** Database no conectada (falta .env)
**Solución:** Configurar archivo .env con credenciales Aiven:
```env
DB_HOST=your-aiven-host
DB_PORT=12345
DB_NAME=defaultdb
DB_USER=avnadmin
DB_PASSWORD=your-password
```

### Error: "tipo_detectado": "DESCONOCIDO" en info endpoint
**Causa:** El archivo no tiene magic bytes válidos (posible corrupción)
**Solución:**
1. Verificar tamaño no es 0
2. Ejecutar test-bytea para validar round-trip
3. Re-subir archivo desde web (no mobile)

### Descarga sigue mostrando error XML en web
**Causa:** Bytea corrupto en BD O Service Worker cacheando versión anterior
**Solución:**
1. Limpiar caché PWA:
   - DevTools > Application > Storage > Clear site data
2. Recargar página (Ctrl+Shift+R hard refresh)
3. Probar descargar nuevo archivo

---

## 📝 Archivos Modificados

```
server-modular-UNICO.js
├── línea 1472: POST /api/tesoreria/facturas-compra/:codigo/soportes
│   └── Agregado logging [CARGA]
├── línea 1722: GET /api/tesoreria/soportes/:id/descargar
│   ├── Cambio: SQL con encode()
│   ├── Mejorado: Decodificación de buffer
│   └── Agregado: Logging [DESCARGA]
├── línea 1832: POST /api/tesoreria/test-bytea (NUEVO)
│   └── Endpoint diagnóstico de round-trip
└── línea 1883: GET /api/tesoreria/soportes/:id/info (NUEVO)
    └── Endpoint diagnóstico de información
```

---

## 🔍 Validación Técnica

Las mejoras garantizan:

✅ **PostgreSQL Compatibility**
- Usa `encode()` nativa de PostgreSQL (soporta todas las versiones)
- No depende del bytea_output setting del servidor

✅ **Format Resilience**
- Fallback a 3 formatos diferentes (base64 → hex → binary)
- Covers todas las configuraciones conocidas de PostgreSQL

✅ **Data Integrity**
- Logging permite verificar tamaños entrada/salida
- Diagnóstico permite detectar corrupción en BD

✅ **Backward Compatibility**
- No requiere cambios en frontend
- No requiere cambios en PWA
- Endpoints nuevos son opcionales

---

## 📞 Validación Final

Una vez implementado, ejecutar este checklist:

```
[ ] Backend restartado con cambios
[ ] Test endpoint: POST /api/tesoreria/test-bytea retorna {"success":true}
[ ] Info endpoint: GET /api/tesoreria/soportes/1/info muestra tipo_detectado
[ ] Download web: Archivo se abre en visor (no error XML)
[ ] Logs sincronizados: [CARGA] y [DESCARGA] tamaños iguales
[ ] PWA upload: Subir desde móvil, descargar en web, funciona
```

Si todo pasa ✅ → **Fix completado exitosamente**

---

**Última actualización:** 2026-05-21
**Estado:** Ready for Testing
**Responsable:** Claude Code Assistant
