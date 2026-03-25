/**
 * Format cents as BRL currency string
 * @param cents - Amount in cents (ex: 3490 = R$ 34,90)
 * @returns Formatted string like "R$ 34,90"
 */
export const formatMoney = (cents: number | null | undefined): string => {
  if (cents === null || cents === undefined || isNaN(cents)) {
    return 'R$ 0,00'
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

/**
 * Parse a BRL formatted string to cents
 * @param value - String like "25,90" or "R$ 25,90"
 * @returns Amount in cents (ex: 2590) or null if invalid/empty
 */
export const parseMoney = (value: string): number | null => {
  if (!value || !value.trim()) return null

  // Remove currency symbol, spaces, and thousand separators
  const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.')
  const parsed = parseFloat(cleaned)

  if (isNaN(parsed)) return null

  return Math.round(parsed * 100)
}

/**
 * Convert float to cents
 * @param value - Float value (ex: 25.90)
 * @returns Amount in cents (ex: 2590)
 */
export const toCents = (value: number): number => {
  return Math.round(value * 100)
}

/**
 * Convert cents to float
 * @param cents - Amount in cents (ex: 2590)
 * @returns Float value (ex: 25.90)
 */
export const fromCents = (cents: number): number => {
  return cents / 100
}
