import type { FrequencyRow } from '../../types'

export const MAX_OBSERVATIONS = 5000
export const MAX_MAGNITUDE = 1e12

export function parseData(text: string): number[] {
  const tokens = text.trim().split(/[,\s]+/).filter(Boolean)
  if (tokens.length > MAX_OBSERVATIONS) throw new Error('Podés ingresar hasta 5.000 observaciones.')
  return tokens.map((token, index) => {
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(token)) {
      throw new Error(`El dato ${index + 1} («${token.slice(0, 24)}») no es un número válido. Usá punto para los decimales.`)
    }
    const value = Number(token)
    if (!Number.isFinite(value) || Math.abs(value) > MAX_MAGNITUDE) {
      throw new Error(`El dato ${index + 1} debe ser finito y tener un valor absoluto de hasta 10¹².`)
    }
    return value
  })
}

function validate(data: number[], allowEmpty = false) {
  if ((!allowEmpty && data.length === 0) || data.length > MAX_OBSERVATIONS || data.some(n => !Number.isFinite(n) || Math.abs(n) > MAX_MAGNITUDE)) {
    throw new Error('Se necesitan datos numéricos válidos (hasta 5.000 observaciones, magnitud ≤ 10¹²).')
  }
}

export function mean(data: number[]): number {
  validate(data)
  const frequencies = frequencyDictionary(data)
  // Weighted arithmetic mean: sum(x_i * f_i) / N, using distinct observed values.
  // Compensated summation preserves precision when adding the weighted terms.
  let sum = 0
  let correction = 0
  for (const [value, frequency] of frequencies) {
    const adjusted = value * frequency - correction
    const next = sum + adjusted
    correction = (next - sum) - adjusted
    sum = next
  }
  return sum / data.length
}

export function median(data: number[]): number {
  validate(data)
  const sorted = [...data].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export function frequencyDictionary(data: number[]): Map<number, number> {
  validate(data, true)
  // Dictionary: the key is the observed value; the value is its absolute frequency.
  const frequencies = new Map<number, number>()
  for (const value of data) frequencies.set(value, (frequencies.get(value) ?? 0) + 1)
  return frequencies
}

export function frequencyTable(data: number[]): FrequencyRow[] {
  const frequencies = frequencyDictionary(data)
  let cumulative = 0
  return [...frequencies.entries()].sort(([a], [b]) => a - b).map(([value, fi]) => {
    cumulative += fi
    return { value, fi, Fi: cumulative, hi: fi / data.length, Hi: cumulative / data.length, percent: fi / data.length * 100 }
  })
}

export function modes(data: number[]): number[] {
  validate(data)
  const frequencies = frequencyDictionary(data)
  const highestFrequency = Math.max(...frequencies.values())
  // Convention: a non-singleton sample with no repeated value is amodal.
  if (highestFrequency === 1 && data.length > 1) return []
  // Like a filtered dictionary query: select all keys whose frequency is maximal.
  return [...frequencies.entries()]
    .filter(([, frequency]) => frequency === highestFrequency)
    .map(([value]) => value)
    .sort((a, b) => a - b)
}

export function histogram(data: number[], count: number) {
  validate(data, true)
  if (!Number.isInteger(count) || count < 1 || count > 30) throw new Error('Usá entre 1 y 30 intervalos enteros.')
  if (!data.length) return []
  const min = Math.min(...data)
  const max = Math.max(...data)
  const size = min === max ? 1 : count
  const width = (max - min) / size
  const bins = Array.from({ length: size }, (_, i) => ({
    lower: min + i * width,
    upper: i === size - 1 ? max : min + (i + 1) * width,
    fi: 0,
    hi: 0,
    last: i === size - 1,
  }))
  for (const value of data) {
    const index = width === 0 ? 0 : Math.min(size - 1, Math.floor((value - min) / width))
    bins[index].fi++
  }
  return bins.map(bin => ({ ...bin, hi: bin.fi / data.length }))
}
