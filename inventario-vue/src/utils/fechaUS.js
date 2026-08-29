// ================================================================
// Conversión entre la fecha que se guarda y la que se muestra
//
// Dentro de la app una fecha SIEMPRE viaja como 'YYYY-MM-DD': es lo que
// espera Postgres, lo que devuelven los endpoints y lo que exige el atributo
// value de un <input type="date">. Lo que cambia es cómo se le presenta al
// usuario, y ahí el formato único es MM/DD/AAAA.
//
// Todo se hace con manipulación de cadenas, nunca construyendo un Date:
// new Date('2026-08-26') se interpreta como medianoche UTC, y en cualquier
// zona negativa (Colombia UTC-5, Orlando UTC-4) eso cae en el día anterior.
// Es la causa clásica de que una fecha se vea un día corrida.
// ================================================================

/** 'YYYY-MM-DD' → 'MM/DD/AAAA'. Devuelve '' si no hay fecha válida. */
export function isoAUsuario(iso) {
    if (!iso) return ''
    // Se exige la forma exacta: partir por guiones a secas convierte
    // "no-es-fecha" en "es/fecha/no", que parece una fecha y no lo es.
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso).split('T')[0])
    return m ? `${m[2]}/${m[3]}/${m[1]}` : ''
}

/** 'MM/DD/AAAA' → 'YYYY-MM-DD'. Devuelve '' si la fecha no existe. */
export function usuarioAIso(texto) {
    const partes = String(texto || '').trim().split('/')
    if (partes.length !== 3) return ''

    const mes  = parseInt(partes[0], 10)
    const dia  = parseInt(partes[1], 10)
    const anio = parseInt(partes[2], 10)
    if (!mes || !dia || !anio) return ''
    if (String(partes[2]).length !== 4) return ''
    if (mes < 1 || mes > 12) return ''

    // Se valida contra los días reales del mes: sin esto, un 02/31 se
    // guardaría y Postgres lo rechazaría recién al enviar el formulario.
    if (dia < 1 || dia > diasDelMes(anio, mes)) return ''

    const p = (n) => String(n).padStart(2, '0')
    return `${anio}-${p(mes)}-${p(dia)}`
}

/** Días que tiene un mes, contando años bisiestos. */
export function diasDelMes(anio, mes) {
    if (mes === 2) {
        const bisiesto = (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0
        return bisiesto ? 29 : 28
    }
    return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mes - 1] || 31
}

/**
 * Va poniendo las barras mientras se escribe: "0826" → "08/26".
 * No valida nada — corregir a medio teclear impide llegar a un valor válido,
 * porque "1" sería un mes imposible antes de poder escribir el "2" de "12".
 */
export function enmascarar(texto) {
    const d = String(texto || '').replace(/\D/g, '').slice(0, 8)
    if (d.length <= 2) return d
    if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
    return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

/** Hoy en 'YYYY-MM-DD', en hora local (no UTC). */
export function hoyIso() {
    const d = new Date()
    const p = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
