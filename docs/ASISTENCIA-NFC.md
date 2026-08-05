# Control de Asistencia NFC — Estructura de implementación

Marcaje de entrada/salida mediante tags NFC físicos, celular del empleado y selfie,
con volcado automático al cuadro semanal de nómina.

---

## 1. Principio de diseño: tres factores independientes

| Factor | Qué prueba | Cómo |
|---|---|---|
| **Tag NFC (NTAG 424 DNA)** | El celular estuvo a 4 cm del tag físico, en este momento | Firma CMAC + contador monotónico verificados en servidor |
| **Celular enrolado** | Es el teléfono de *este* empleado | Token permanente entregado tras validar el PIN una sola vez |
| **Selfie** | Quien lo usó fue *esa persona* | Cámara frontal disparada en cada marcaje |

Ninguno de los tres se puede suplantar con los otros dos. Un compañero parado frente
al tag no puede marcar: su celular no está enrolado. Si le prestan un celular
enrolado, la selfie lo delata.

> **El tag debe ser NTAG 424 DNA con SDM/SUN configurado.** Un NTAG213/215 común
> guarda una URL fija: cualquiera la copia y marca desde su casa. No sirve.

---

## 2. Modelo de datos

### 2.1 Tablas nuevas

```sql
-- ── Tags NFC físicos instalados en cada punto ──────────────────────────────
CREATE TABLE IF NOT EXISTS nom_nfc_tag (
    id SERIAL PRIMARY KEY,
    empresa INT4 NOT NULL,
    tag_uid VARCHAR(32) NOT NULL,          -- UID del chip, 7 bytes = 14 hex
    etiqueta VARCHAR(60),                  -- "Entrada cocina", "Barra"
    ccosto VARCHAR(3) NOT NULL,            -- centro de costo al que marca
    aes_key_cif VARCHAR(200) NOT NULL,     -- clave AES-128 del SDM, CIFRADA (ver §6.1)
    ultimo_contador INT4 DEFAULT 0,        -- antirreplay: solo acepta contador mayor
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (empresa, tag_uid)
);

-- ── Celulares enrolados por empleado ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS nom_dispositivo_empleado (
    id SERIAL PRIMARY KEY,
    empleado_id INT4 NOT NULL,
    token_hash VARCHAR(64) NOT NULL,       -- SHA-256 del token; el crudo solo vive en el celular
    etiqueta VARCHAR(80),                  -- "iPhone 15 · Safari"
    user_agent VARCHAR(300),
    enrolado_en TIMESTAMP DEFAULT NOW(),
    ultimo_uso TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    revocado_en TIMESTAMP,
    revocado_por VARCHAR(50),
    UNIQUE (token_hash)
);

-- ── Bitácora inmutable de marcajes ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nom_asistencia_marcaje (
    id SERIAL PRIMARY KEY,
    empresa INT4 NOT NULL,
    empleado_id INT4 NOT NULL,
    tipo VARCHAR(10) NOT NULL,             -- ENTRADA | SALIDA
    momento TIMESTAMPTZ NOT NULL,          -- hora del SERVIDOR, nunca la del celular
    ccosto VARCHAR(3) NOT NULL,
    -- procedencia y prueba
    origen VARCHAR(12) NOT NULL,           -- NFC | MANUAL | AUTO_CIERRE
    tag_id INT4,
    tag_contador INT4,
    dispositivo_id INT4,
    selfie BYTEA,
    selfie_mime VARCHAR(20),
    -- estado y auditoría
    estado VARCHAR(12) DEFAULT 'VALIDO',   -- VALIDO | SOSPECHOSO | ANULADO
    anomalias VARCHAR(300),                -- "ENTRADA_ANTICIPADA,SIN_SELFIE"
    corrige_a INT4,                        -- si corrige otro marcaje, apunta a su id
    creado_por VARCHAR(50) DEFAULT 'EMPLEADO',
    notas VARCHAR(300),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_marcaje_emp_fecha
    ON nom_asistencia_marcaje (empleado_id, momento);
CREATE INDEX IF NOT EXISTS ix_marcaje_empresa_fecha
    ON nom_asistencia_marcaje (empresa, momento);

-- ── Control de intentos fallidos de enrolamiento (rate limit) ──────────────
CREATE TABLE IF NOT EXISTS nom_enrolamiento_intento (
    id SERIAL PRIMARY KEY,
    empleado_id INT4,
    ip VARCHAR(45),
    exito BOOLEAN DEFAULT FALSE,
    momento TIMESTAMP DEFAULT NOW()
);
```

### 2.2 Columnas añadidas a `nom_empleados`

```sql
ALTER TABLE nom_empleados ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(160);
ALTER TABLE nom_empleados ADD COLUMN IF NOT EXISTS pin_generado_en TIMESTAMP;
ALTER TABLE nom_empleados ADD COLUMN IF NOT EXISTS pin_usado_en TIMESTAMP;
ALTER TABLE nom_empleados ADD COLUMN IF NOT EXISTS marcaje_activo BOOLEAN DEFAULT TRUE;
```

### 2.3 Tabla que NO cambia

`nom_semana_detalle` ya tiene todo lo necesario: `real_inicio`, `real_fin`,
`real_horas`, `ccosto`, `ajustado`. El consolidador escribe ahí y toda la cadena
existente (`preliquidacion-actual`, `liquidaciones/:id/calcular`, recibos,
propinas) sigue funcionando sin un solo cambio.

**Convención de `ajustado`:**
- `FALSE` → las horas vinieron del reloj (marcajes NFC)
- `TRUE` → alguien las editó a mano

---

## 3. El PIN: cómo se guarda y para qué sirve

### 3.1 Es un secreto de enrolamiento, no una contraseña diaria

El PIN se usa **una sola vez en la vida** de cada empleado: para enrolar su celular.
Después de eso el celular queda identificado por su token y el PIN nunca se vuelve a
pedir. Esto es lo que permite que 4 dígitos sean suficientes — no es un secreto que
viaje todos los días.

### 3.2 Almacenamiento

**Nunca en texto plano.** Se guarda el hash con `scrypt` (nativo de Node, sin
dependencias nuevas):

```js
const crypto = require('crypto');

function hashPin(pin) {
    const salt = crypto.randomBytes(16);
    const hash = crypto.scryptSync(String(pin), salt, 32);
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

function verificarPin(pin, almacenado) {
    if (!almacenado) return false;
    const [saltHex, hashHex] = almacenado.split(':');
    const hash = crypto.scryptSync(String(pin), Buffer.from(saltHex, 'hex'), 32);
    // comparación en tiempo constante: evita timing attacks
    return crypto.timingSafeEqual(hash, Buffer.from(hashHex, 'hex'));
}
```

### 3.3 Ciclo de vida

1. En **Empleados**, el gerente pulsa "Generar PIN" → el servidor crea 4 dígitos
   aleatorios, guarda el hash y **devuelve el PIN en claro una única vez** para
   mostrarlo en pantalla o imprimirlo.
2. El empleado enrola su celular con ese PIN.
3. Al enrolar, se marca `pin_usado_en` y **el PIN queda inservible**. Un segundo
   enrolamiento exige que el gerente genere uno nuevo.
4. Si el empleado cambia de celular: el gerente revoca el dispositivo viejo y
   genera un PIN nuevo.

### 3.4 Protección contra fuerza bruta

4 dígitos son 10.000 combinaciones. Sin límite, se rompen en minutos. Reglas:

- Máximo **5 intentos fallidos por empleado por hora** (tabla `nom_enrolamiento_intento`).
- Máximo **10 intentos fallidos por IP por hora**.
- Superado el límite: bloqueo de enrolamiento y aviso en el panel de excepciones.
- El PIN caduca a las **72 horas** de generado si no se usó.

---

## 4. Verificación del tag NFC

### 4.1 Qué manda el tag

Con SDM en modo *plain mirroring*, cada toque produce una URL distinta:

```
https://tuapp.com/marcar?uid=04A1B2C3D4E580&ctr=000123&cmac=A1B2C3D4E5F60718
                              └ UID del chip   └ contador  └ firma de 8 bytes
```

El contador sube en cada toque, dentro del chip, y no se puede retroceder.

### 4.2 Algoritmo de validación (servidor)

```
1. Buscar tag por uid → si no existe o está inactivo, rechazar
2. Descifrar su clave AES (§6.1)
3. Derivar la clave de sesión:
     SV2  = 3C C3 00 01 00 80 || UID || contador
     Kses = AES-CMAC(K_sdm, SV2)
4. cmac_esperado = truncar_impares( AES-CMAC(Kses, "") )   → 8 bytes
5. Comparar con timingSafeEqual contra el cmac recibido → si no coincide, rechazar
6. Si contador <= ultimo_contador → REPLAY. Rechazar y registrar anomalía.
7. Actualizar ultimo_contador
```

**AES-CMAC sin dependencias**: se implementa sobre `crypto.createCipheriv('aes-128-cbc')`
siguiendo RFC 4493. Son unas 40 líneas en un helper `lib/aescmac.js`. No hace falta
instalar nada.

### 4.3 Modo simulado para desarrollo

Con `ASISTENCIA_MODO_PRUEBA=true` en el entorno, el endpoint acepta un tag falso sin
verificar CMAC. Permite probar todo el ciclo y ver el cuadro semanal llenándose
**antes de comprar los tags**. Debe quedar apagado en producción.

---

## 5. Endpoints

### 5.1 Públicos (sin login — el empleado no tiene cuenta)

| Método | Ruta | Función |
|---|---|---|
| `GET` | `/api/asistencia/tap` | Entrada del NFC. Verifica CMAC y contador, resuelve identidad por token, redirige a `/marcar` |
| `POST` | `/api/asistencia/enrolar` | Recibe PIN → valida → entrega token de dispositivo |
| `GET` | `/api/asistencia/estado` | ¿El empleado está dentro o fuera? Último marcaje y turno programado |
| `POST` | `/api/asistencia/marcar` | Registra ENTRADA o SALIDA con selfie |

### 5.2 Administrativos (requieren login)

| Método | Ruta | Función |
|---|---|---|
| `GET` | `/api/asistencia/dia` | Marcajes del día con selfies, para el supervisor |
| `GET` | `/api/asistencia/excepciones` | Anomalías pendientes de resolver |
| `POST` | `/api/asistencia/marcaje/:id/anular` | Anula un marcaje creando el registro de corrección |
| `POST` | `/api/asistencia/marcaje-manual` | Marcaje a mano cuando falló el celular (queda como `origen=MANUAL`) |
| `POST` | `/api/asistencia/consolidar` | Fuerza el volcado a `nom_semana_detalle` |
| `GET/POST/DELETE` | `/api/asistencia/tags` | Alta y baja de tags NFC |
| `GET/DELETE` | `/api/asistencia/dispositivos` | Ver y revocar celulares enrolados |
| `POST` | `/api/nomina/empleados/:id/pin` | Generar PIN nuevo (devuelve el claro una vez) |

---

## 6. Seguridad

### 6.1 Claves AES de los tags

Las claves de los tags son el secreto más sensible del sistema: quien las tenga puede
fabricar marcajes válidos. **No se guardan en claro.** Se cifran con AES-256-GCM
usando una clave maestra que vive en el entorno, nunca en la base ni en el repo:

```
ASISTENCIA_MASTER_KEY=<32 bytes en hex>
```

Si se filtra la base de datos, las claves de los tags siguen siendo inservibles.

### 6.2 Token de dispositivo

- Se genera con `crypto.randomBytes(32)`.
- Se entrega al celular como **cookie httpOnly + Secure + SameSite=Lax**, 2 años.
  (`Lax` funciona porque el tap NFC es una navegación de primer nivel.)
- En la base se guarda **solo el SHA-256**. Igual que una contraseña.
- Copia de respaldo en `localStorage` por si el navegador purga la cookie.

### 6.3 Reglas transversales

- **La hora la pone el servidor**, siempre. La del celular se ignora — es
  manipulable.
- HTTPS obligatorio (ya lo tienes en Railway).
- La selfie se guarda comprimida a ~40 KB (JPEG, 480 px de ancho). Con 20 empleados
  × 2 marcajes × 250 días son ~400 MB al año.
- Los marcajes **nunca se editan ni se borran**. Una corrección anula el original
  (`estado=ANULADO`) y crea uno nuevo con `corrige_a` apuntando a él.

---

## 7. Consolidación: cómo se llena el cuadro solo

### 7.1 Emparejamiento

Para cada `empleado + fecha + ccosto`:

1. Ordenar los marcajes válidos por `momento`.
2. Emparejar ENTRADA → SALIDA en secuencia.
3. Sumar la duración de todos los pares (soporta salir a almorzar y volver).
4. Redondear a 5 minutos **al más cercano** — nunca siempre hacia abajo (§9).
5. Escribir en `nom_semana_detalle`:
   - `real_inicio` = primera ENTRADA
   - `real_fin` = última SALIDA
   - `real_horas` = suma de los pares
   - `ajustado` = FALSE

### 7.2 Casos especiales

| Caso | Tratamiento |
|---|---|
| Turno cruza medianoche | Se usa `prog_cruza_medianoche` para asignar las horas al día correcto |
| Olvidó marcar salida | Auto-cierre en `prog_fin`, marcaje con `origen=AUTO_CIERRE` y anomalía `SIN_SALIDA` |
| Marcó en dos centros el mismo día | Una fila por ccosto — `nom_semana_detalle` ya lo soporta |
| No tenía turno programado | Se registra igual, con anomalía `FUERA_DE_TURNO` |
| El supervisor ya editó la fila a mano | Si `ajustado=TRUE`, **no se sobrescribe**; se avisa en excepciones |

### 7.3 Cuándo corre

- **En cada marcaje**, incremental para ese empleado+fecha. El cuadro semanal está
  vivo, no hay que esperar al cierre.
- **Barrido nocturno** que aplica los auto-cierres del día.

---

## 8. Anomalías detectadas

| Código | Disparo |
|---|---|
| `ENTRADA_ANTICIPADA` | Marca más de N minutos antes de `prog_inicio` (N configurable) |
| `SALIDA_TARDIA` | Marca más de N minutos después de `prog_fin` |
| `SIN_SALIDA` | Cerró el día sin marcar salida |
| `DOBLE_ENTRADA` | Dos ENTRADA seguidas sin SALIDA en medio |
| `SIN_SELFIE` | El marcaje llegó sin foto (cámara denegada) |
| `DISPOSITIVO_NUEVO` | Enroló un celular distinto al habitual |
| `REPLAY_TAG` | Contador repetido o menor. **Se bloquea el marcaje** |
| `FUERA_DE_TURNO` | No tenía turno programado ese día |

Todas caen en el panel de excepciones. El supervisor resuelve; nada pasa en silencio.

---

## 9. Cumplimiento legal (EE.UU.)

- **FLSA**: los registros de nómina se conservan **3 años**; las tarjetas de tiempo y
  los cálculos de salario, **2 años**. La bitácora inmutable de marcajes cubre esto.
- **Redondeo**: la ley permite redondear, pero debe ser **neutral** — al intervalo más
  cercano, no siempre a favor del empleador. Por eso §7.1 redondea al más cercano.
- **Selfie ≠ biométrico**: guardar una foto como evidencia visual es muy distinto a
  generar una plantilla facial. Si más adelante se añade **reconocimiento facial
  automático**, eso sí crea un identificador biométrico y activa las leyes de
  privacidad biométrica de Illinois (BIPA), Texas y Washington, que exigen
  **consentimiento escrito previo**. Recomendación: quedarse en la foto.
- Conviene que cada empleado firme un consentimiento simple de uso de celular
  personal y captura de foto para control de asistencia.

---

## 10. Frontend

| Vista | Ruta | Auth | Función |
|---|---|---|---|
| `MarcajeView.vue` | `/marcar` | **Pública** | La que abre el NFC. Móvil, sin MainLayout. Enrolamiento, entrar/salir, selfie |
| `ControlAsistenciaView.vue` | `/nomina/configuracion/control-asistencia` | Sí | Deja de ser maqueta: panel del día, excepciones, correcciones |
| `TagsNfcView.vue` | `/nomina/configuracion/tags-nfc` | Sí | Alta de tags, asignación a centro de costo, revocación |
| `EmpleadosView.vue` | (existente) | Sí | Se le añade "Generar PIN" y "Dispositivos enrolados" |

> **Ojo con el router**: hoy todas las rutas llevan `meta: { requiresAuth: true }`.
> `/marcar` debe quedar fuera del guard, porque el empleado no tiene cuenta.

### Flujo del empleado (3 segundos)

```
Acerca el celular al tag
   → notificación → toca → abre /marcar
   → ¿primera vez? pide PIN una sola vez
   → ya identificado: botón grande "ENTRAR" o "SALIR" según su estado
   → selfie automática
   → confirmación con la hora registrada
```

---

## 11. Fases de entrega

**Fase 1 — Ciclo funcional** (se puede probar sin comprar tags, con `ASISTENCIA_MODO_PRUEBA`)
- Tablas y migraciones
- PIN: generación, hash, enrolamiento, rate limit
- Endpoints de marcar / estado / enrolar
- `MarcajeView.vue`
- Consolidador a `nom_semana_detalle`

**Fase 2 — NFC real**
- AES-CMAC en `lib/aescmac.js`
- Verificación de firma y contador
- Cifrado de claves con `ASISTENCIA_MASTER_KEY`
- `TagsNfcView.vue`

**Fase 3 — Supervisión**
- Panel del día con selfies
- Excepciones y correcciones con auditoría
- Auto-cierre nocturno
- Reporte de asistencia vs. horario programado

---

## 12. Compras y configuración previa

| Ítem | Detalle |
|---|---|
| **Tags** | NTAG 424 DNA **con SDM/SUN preconfigurado de fábrica**, y que el proveedor entregue las claves AES. En blanco requieren herramientas especializadas. 2–3 por punto (uno de repuesto). ~$1.50–3 c/u |
| **Montaje** | Sticker o disco a la altura del pecho, junto a la puerta. Superficie no metálica, o tag "on-metal" |
| **Variable de entorno** | `ASISTENCIA_MASTER_KEY` (32 bytes hex) en Railway |
| **Consentimiento** | Formato firmado por empleado (uso de celular personal + foto) |
