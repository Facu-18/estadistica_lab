export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: false,
  }).format(Object.is(value, -0) ? 0 : value)
}

export function displayValue(value: number): string {
  return new Intl.NumberFormat('es-AR', { maximumSignificantDigits: 12, useGrouping: false }).format(value)
}
