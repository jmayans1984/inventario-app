# Fix para Problema de Descarga de Archivos en Soportes de Pago

## 🔍 Problema Identificado

**Síntoma:** Cuando se descargan soportes de pago (imágenes JPG) capturadas desde la app PWA en móvil, el navegador muestra error XML en lugar de la imagen.

**Diagnóstico:** El problema está en cómo PostgreSQL almacena y recupera datos bytea. Diferentes versiones de PostgreSQL pueden devolver el mismo dato en formatos distintos (escape, hex, base64), causando corrupción de datos binarios.

---

## ✅ Cambios Realizados

### 1. **Endpoint GET `/api/tesoreria/soportes/:id/descargar` (línea 1722)**

#### Antes:
```javascript
const result = await pool.query(
    'SELECT archivo_data, nombre_archivo, tipo_archivo FROM soportes_pago WHERE id = $1',
    [id]
);
```

#### Después:
```javascript
const result = await pool.query(
    'SELECT encode(archivo_data, \'base64\') as archivo_data, nombre_archivo, tipo_archivo FROM soportes_pago WHERE id = $1',
    [id]
);
```

**Ventaja:** PostgreSQL's `encode()` function garantiza que el bytea siempre se devuelve como base64, sin importar la configuración del servidor.

### 2. **Mejora en Decodificación de Buffer (línea 1748)**

Nuevo algoritmo para convertir diferentes formatos bytea a Buffer:

```javascript
if (Buffer.isBuffer(archivo_data)) {
    buffer = archivo_data;
} else if (typeof archivo_data === 'string') {
    // Esperamos base64 desde el SQL encode()
    try {
        buffer = Buffer.from(archivo_data, 'base64');
        
        if (buffer.length === 0) {
            // Fallback: intenta hex format
            if (archivo_data.startsWith('\\x')) {
                buffer = Buffer.from(archivo_data.slice(2), 'hex');
            } else {
                buffer = Buffer.from(archivo_data, 'binary');
            }
        }
    } catch (e) {
        // Si falla todo, intenta binary
        buffer = Buffer.from(archivo_data, 'binary');
    }
}
```

### 3. **Nuevo Endpoint Diagnóstico POST `/api/tesoreria/test-bytea` (línea 1832)**

Permite probar el round-trip de datos bytea:

```bash
curl -X POST http://localhost:3000/api/tesoreria/test-bytea \
  -H "Content-Type: application/json" \
  -d "{\"base64String\": \"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==\"}"
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "test_id": 1,
  "matches": true,
  "message": "Round-trip SUCCESS"
}
```

### 4. **Nuevo Endpoint Diagnóstico GET `/api/tesoreria/soportes/:id/info` (línea 1883)**

Información del soporte sin descargarlo:

```bash
curl http://localhost:3000/api/tesoreria/soportes/123/info
```

**Respuesta:**
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

El `hex_preview` muestra los primeros bytes (magic bytes) del archivo:
- `ffd8ffe0` o `ffd8ffe1` = JPEG ✅
- `89504e47` = PNG ✅
- `47494638` = GIF ✅
- `25504446` = PDF ✅

### 5. **Agregado Logging en Upload** (línea 1522)

```javascript
console.log(`[CARGA] Factura: ${codigo}, Archivo: ${nombre_archivo}, Tipo: ${tipo_archivo}, Tamaño: ${archivo_data.length} bytes`);
```

### 6. **Agregado Logging en Download** (línea 1802)

```javascript
console.log(`[DESCARGA] ID: ${id}, Archivo: ${nombre_archivo}, TipoArchivo: ${tipo_archivo}, BufferSize: ${buffer.length} bytes`);
```

---

## 🧪 Plan de Prueba

### Paso 1: Verificar Bytea Round-Trip

```bash
# Usar el endpoint de test para verificar que PostgreSQL puede almacenar y recuperar datos correctamente
curl -X POST http://localhost:3000/api/tesoreria/test-bytea \
  -H "Content-Type: application/json" \
  -d "{\"base64String\": \"$(base64 < /path/to/test.jpg)\"}"
```

**Resultado esperado:** `"matches": true`

### Paso 2: Verificar Información de Archivo Existente

Si ya hay un soporte cargado desde el móvil:

```bash
curl http://localhost:3000/api/tesoreria/soportes/123/info
```

Verificar:
- ✅ `archivo_size` es > 0
- ✅ `tipo_detectado` es correcto (JPEG, PNG, etc.)
- ✅ `hex_preview` muestra magic bytes válidos

### Paso 3: Prueba de Descarga Web

1. Abrir navegador en http://localhost:5173/tesoreria/procesos/facturas-compra
2. Hacer clic en una factura con soporte
3. Hacer clic en botón "Descargar" junto al soporte
4. Verificar que:
   - El archivo se descarga correctamente
   - Se abre en el visor de imágenes (no error XML)
   - La imagen se ve correctamente

### Paso 4: Prueba de Carga Móvil

1. Abrir app PWA en celular
2. Seleccionar una factura PENDIENTE
3. Cargar una imagen desde cámara
4. Guardar soporte
5. Volver a la web
6. Verificar que la imagen se descarga correctamente

### Paso 5: Verificar Logs del Servidor

Revisar consola del servidor para ver:

```
[CARGA] Factura: FAC-001, Archivo: IMG_001.JPG, Tipo: image/jpeg, Tamaño: 524288 bytes
[DESCARGA] ID: 45, Archivo: IMG_001.JPG, TipoArchivo: image/jpeg, BufferSize: 524288 bytes
```

Los tamaños deben coincidir (sin cambios entre upload y download).

---

## 🐛 Posibles Problemas y Soluciones

### Problema: "Buffer.length = 0 después de base64 decode"

**Causa:** La función `encode()` de PostgreSQL devuelve base64 inválido

**Solución:** 
1. Verificar que la tabla `soportes_pago` tiene bytea column: `\d soportes_pago` en psql
2. Ejecutar test-bytea endpoint
3. Si falla, revisar logs del servidor

### Problema: "hex_preview muestra caracteres raros"

**Causa:** La función `encode()` con parámetro 'hex' está fallando

**Solución:** El endpoint de info ya maneja esto, debería mostrar hex válido. Si no, hay un problema con PostgreSQL.

### Problema: "La imagen sigue sin verse en web pero funciona en móvil"

**Causa:** Posible Service Worker del PWA caché en diferente formato

**Solución:**
1. Limpiar caché de la app PWA: DevTools > Application > Clear storage
2. Recargar página
3. Si sigue fallando, revisar logs de descargas

---

## 📊 Diagnóstico Quick Checklist

- [ ] Backend iniciado sin errores de conexión a PostgreSQL
- [ ] Endpoint `/api/tesoreria/test-bytea` retorna `"matches": true`
- [ ] Endpoint `/api/tesoreria/soportes/:id/info` muestra `tipo_detectado` correcto
- [ ] Descargar archivo desde web no genera error XML
- [ ] Archivo descargado tiene mismo tamaño que muestra info endpoint
- [ ] Logs del servidor muestran tamaños consistentes entre CARGA y DESCARGA
- [ ] Imagen se abre correctamente en visor

---

## 🔧 Si Algo Sigue Fallando

1. **Recopilare datos:**
   - Ejecutar: `curl http://localhost:3000/api/tesoreria/soportes/XXX/info`
   - Copiar respuesta completa
   - Revisar logs: `console.log` en server-modular-UNICO.js

2. **Prueba SQL directa en Aiven:**
   ```sql
   -- En PgAdmin o psql
   SELECT id, nombre_archivo, LENGTH(archivo_data) as size,
          encode(archivo_data, 'base64') as base64_preview
   FROM soportes_pago
   LIMIT 1;
   ```

3. **Verificar configuración PostgreSQL:**
   ```sql
   SHOW bytea_output;  -- Debería ser 'hex' o 'escape', con encode() no importa
   ```

---

## 📝 Notas Técnicas

- `encode()` de PostgreSQL es más confiable que confiar en el formato que devuelve el cliente pg
- El fallback a múltiples formatos (base64 → hex → binary) cubre casi todos los casos
- El endpoint `/info` de diagnóstico no consume ancho de banda innecesario
- Los logs ayudan a correlacionar upload/download y detectar si hay pérdida de datos

