// ================================================================
// NTAG 424 DNA — Verificación SUN/SDM y cifrado de claves en reposo
//
// Sin dependencias externas: todo se construye sobre el módulo crypto
// nativo de Node. Ver docs/ASISTENCIA-NFC.md §4 y §6.1.
// ================================================================

const crypto = require('crypto');

const BLOQUE = 16;
const RB = 0x87; // constante del polinomio para AES-128 (RFC 4493)

function xor(a, b) {
    const out = Buffer.alloc(a.length);
    for (let i = 0; i < a.length; i++) out[i] = a[i] ^ b[i];
    return out;
}

// Desplaza un buffer un bit a la izquierda (necesario para las subclaves CMAC)
function desplazarIzquierda(buf) {
    const out = Buffer.alloc(buf.length);
    let acarreo = 0;
    for (let i = buf.length - 1; i >= 0; i--) {
        out[i] = ((buf[i] << 1) & 0xff) | acarreo;
        acarreo = (buf[i] & 0x80) ? 1 : 0;
    }
    return out;
}

function aesEcbBloque(clave, bloque) {
    const c = crypto.createCipheriv('aes-128-ecb', clave, null);
    c.setAutoPadding(false);
    return Buffer.concat([c.update(bloque), c.final()]);
}

// RFC 4493 §2.3 — derivación de subclaves K1 y K2
function generarSubclaves(clave) {
    const L = aesEcbBloque(clave, Buffer.alloc(16));
    const K1 = desplazarIzquierda(L);
    if (L[0] & 0x80) K1[15] ^= RB;
    const K2 = desplazarIzquierda(K1);
    if (K1[0] & 0x80) K2[15] ^= RB;
    return { K1, K2 };
}

// RFC 4493 — AES-CMAC de 16 bytes
function aesCmac(clave, mensaje) {
    const { K1, K2 } = generarSubclaves(clave);
    const n = Math.ceil(mensaje.length / BLOQUE);
    const bloquesCompletos = n === 0 ? 0 : n - 1;

    let ultimoBloque;
    if (n === 0) {
        // Mensaje vacío: bloque de padding puro contra K2
        ultimoBloque = xor(Buffer.concat([Buffer.from([0x80]), Buffer.alloc(15)]), K2);
    } else if (mensaje.length % BLOQUE === 0) {
        ultimoBloque = xor(mensaje.subarray(bloquesCompletos * BLOQUE), K1);
    } else {
        const resto = mensaje.subarray(bloquesCompletos * BLOQUE);
        const rellenado = Buffer.concat([resto, Buffer.from([0x80]), Buffer.alloc(BLOQUE - resto.length - 1)]);
        ultimoBloque = xor(rellenado, K2);
    }

    let X = Buffer.alloc(16);
    for (let i = 0; i < bloquesCompletos; i++) {
        X = aesEcbBloque(clave, xor(X, mensaje.subarray(i * BLOQUE, (i + 1) * BLOQUE)));
    }
    return aesEcbBloque(clave, xor(X, ultimoBloque));
}

// El SDMMAC que imprime el tag son los bytes impares del CMAC completo
function truncarSdmMac(cmacCompleto) {
    return Buffer.from([
        cmacCompleto[1], cmacCompleto[3], cmacCompleto[5], cmacCompleto[7],
        cmacCompleto[9], cmacCompleto[11], cmacCompleto[13], cmacCompleto[15],
    ]);
}

// Calcula el SDMMAC esperado para un (uid, contador) dado.
// NXP AN12196: SV2 = 3Ch C3h 00h 01h 00h 80h || UID(7) || SDMReadCtr(3)
function calcularSdmMac(claveSdm, uid, contador3Bytes) {
    const sv2 = Buffer.concat([
        Buffer.from([0x3c, 0xc3, 0x00, 0x01, 0x00, 0x80]),
        uid,
        contador3Bytes,
    ]);
    const claveSesion = aesCmac(claveSdm, sv2);
    return truncarSdmMac(aesCmac(claveSesion, Buffer.alloc(0)));
}

/**
 * Verifica la firma SUN de un tap.
 *
 * El orden de bytes del contador depende de cómo se haya configurado el
 * mirror en el tag, y varía entre proveedores. Se prueban ambos órdenes:
 * esto NO debilita la verificación (sin la clave AES sigue siendo
 * imposible forjar un CMAC válido), solo evita tener que adivinar la
 * configuración del lote de tags que se compre.
 *
 * @returns {{valido: boolean, contador: number|null}}
 */
function verificarSun(claveSdm, uidHex, ctrHex, cmacHex) {
    let uid, ctr, recibido;
    try {
        uid = Buffer.from(uidHex, 'hex');
        ctr = Buffer.from(ctrHex, 'hex');
        recibido = Buffer.from(cmacHex, 'hex');
    } catch {
        return { valido: false, contador: null };
    }
    if (uid.length !== 7 || ctr.length !== 3 || recibido.length !== 8) {
        return { valido: false, contador: null };
    }

    const candidatos = [
        { bytes: ctr, valor: (ctr[0] << 16) | (ctr[1] << 8) | ctr[2] },
        { bytes: Buffer.from([ctr[2], ctr[1], ctr[0]]), valor: (ctr[2] << 16) | (ctr[1] << 8) | ctr[0] },
    ];

    for (const c of candidatos) {
        const esperado = calcularSdmMac(claveSdm, uid, c.bytes);
        if (crypto.timingSafeEqual(esperado, recibido)) {
            return { valido: true, contador: c.valor };
        }
    }
    return { valido: false, contador: null };
}

// ── Cifrado de las claves AES de los tags en reposo ──────────────
// Si se filtra la base de datos, las claves siguen siendo inservibles
// sin ASISTENCIA_MASTER_KEY, que vive solo en el entorno.

function claveMaestra() {
    const hex = process.env.ASISTENCIA_MASTER_KEY;
    if (!hex) throw new Error('Falta ASISTENCIA_MASTER_KEY en el entorno');
    const buf = Buffer.from(hex, 'hex');
    if (buf.length !== 32) throw new Error('ASISTENCIA_MASTER_KEY debe ser de 32 bytes en hexadecimal (64 caracteres)');
    return buf;
}

function cifrarClaveTag(claveHex) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', claveMaestra(), iv);
    const cifrado = Buffer.concat([cipher.update(Buffer.from(claveHex, 'hex')), cipher.final()]);
    return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${cifrado.toString('hex')}`;
}

function descifrarClaveTag(almacenado) {
    const [ivHex, tagHex, cifradoHex] = String(almacenado).split(':');
    if (!ivHex || !tagHex || !cifradoHex) throw new Error('Clave de tag con formato inválido');
    const decipher = crypto.createDecipheriv('aes-256-gcm', claveMaestra(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(cifradoHex, 'hex')), decipher.final()]);
}

module.exports = { aesCmac, verificarSun, cifrarClaveTag, descifrarClaveTag };
