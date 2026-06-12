/**
 * ══════════════════════════════════════════════════
 *  FORMATEADORES GLOBALES — RestManager Pro
 *  Formatos estándar del sistema:
 *    Fecha   →  MM/DD/AAAA
 *    Número  →  1.234,55   (punto miles, coma decimal)
 *    Moneda  →  $ 1.234,55
 * ══════════════════════════════════════════════════
 */

// ── Locale base para formateo numérico (estilo europeo/latam) ──────────────
const NUM_LOCALE = 'de-DE'  // punto = miles, coma = decimal

// ─────────────────────────────────────────────────
//  FECHA
// ─────────────────────────────────────────────────

/**
 * Convierte cualquier fecha a string MM/DD/AAAA
 * @param {Date|string|null} value
 * @returns {string}
 */
export function formatFecha(value) {
  if (!value) return ''
  // Si es string tipo "YYYY-MM-DD..." extraer partes sin pasar por Date
  // para evitar desfase de zona horaria
  const str = typeof value === 'string' ? value : value.toISOString?.() ?? String(value)
  const datePart = str.split('T')[0]   // "YYYY-MM-DD"
  const parts = datePart.split('-')
  if (parts.length === 3) {
    const [aaaa, mm, dd] = parts
    return `${mm}/${dd}/${aaaa}`
  }
  // Fallback para objetos Date ya construidos
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return ''
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const aaaa = d.getFullYear()
  return `${mm}/${dd}/${aaaa}`
}

/**
 * Fecha + hora  MM/DD/AAAA HH:mm
 */
export function formatFechaHora(value) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return ''
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${formatFecha(d)} ${hh}:${min}`
}

/**
 * Fecha actual como string MM/DD/AAAA
 */
export function fechaHoy() {
  return formatFecha(new Date())
}

/**
 * Fecha en formato YYYY-MM-DD (para inputs type="date")
 * Usa zona horaria local, evita desfase con toISOString()
 * @param {Date|null} date - default: hoy
 * @returns {string} formato "YYYY-MM-DD"
 */
export function fechaInputLocal(date = null) {
  const d = date instanceof Date ? date : new Date()
  const año = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${año}-${mes}-${dia}`
}

/**
 * Parsea un string MM/DD/AAAA a objeto Date
 * Útil para validar lo que el usuario ingresó
 */
export function parseFecha(str) {
  if (!str || !/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return null
  const [mm, dd, aaaa] = str.split('/')
  const d = new Date(Number(aaaa), Number(mm) - 1, Number(dd))
  if (isNaN(d.getTime())) return null
  return d
}

// ─────────────────────────────────────────────────
//  NÚMEROS
// ─────────────────────────────────────────────────

/**
 * Número con punto de miles y coma decimal
 * Ej: 1234567.89  →  "1.234.567,89"
 * @param {number|string|null} value
 * @param {number} decimales  (default 2)
 */
export function formatNumero(value, decimales = 2) {
  const n = parseFloat(value)
  if (isNaN(n)) return '0,00'
  return new Intl.NumberFormat(NUM_LOCALE, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(n)
}

/**
 * Número entero sin decimales, con punto de miles
 * Ej: 1250  →  "1.250"
 */
export function formatEntero(value) {
  const n = parseInt(value)
  if (isNaN(n)) return '0'
  return new Intl.NumberFormat(NUM_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

/**
 * Porcentaje con 2 decimales y símbolo %
 * Ej: 18.4  →  "18,40%"
 */
export function formatPorcentaje(value, decimales = 2) {
  const n = parseFloat(value)
  if (isNaN(n)) return '0,00%'
  return formatNumero(n, decimales) + '%'
}

/**
 * Parsea un string con formato europeo a number
 * Ej: "1.234,55"  →  1234.55
 */
export function parseNumero(str) {
  if (!str) return 0
  // Remover puntos (miles) y reemplazar coma decimal por punto
  const clean = String(str).replace(/\./g, '').replace(',', '.')
  const n = parseFloat(clean)
  return isNaN(n) ? 0 : n
}

// ─────────────────────────────────────────────────
//  MONEDA
// ─────────────────────────────────────────────────

/**
 * Moneda con signo dólar y formato europeo
 * Ej: 1234.55  →  "$ 1.234,55"
 * @param {number|string|null} value
 * @param {number} decimales  (default 2)
 */
export function formatMoneda(value, decimales = 2) {
  return '$ ' + formatNumero(value, decimales)
}

/**
 * Moneda abreviada para KPIs (K = miles, M = millones)
 * Ej: 45200  →  "$ 45,2K"   |   1234567  →  "$ 1,2M"
 */
export function formatMonedaCorta(value) {
  const n = parseFloat(value)
  if (isNaN(n)) return '$ 0'
  if (Math.abs(n) >= 1_000_000) return `$ ${formatNumero(n / 1_000_000, 1)}M`
  if (Math.abs(n) >= 1_000)     return `$ ${formatNumero(n / 1_000, 1)}K`
  return formatMoneda(n, 0)
}

// ─────────────────────────────────────────────────
//  FECHA LARGA (para header del layout)
// ─────────────────────────────────────────────────

/**
 * Fecha en formato largo legible en español
 * Ej: "Sábado, 16 de mayo de 2026"
 */
export function formatFechaLarga(date = new Date()) {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  })
}
