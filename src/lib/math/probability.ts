import type { ElementItem, Outcome, SelectionConfig } from '../../types'

export const ENUMERATION_LIMIT = 400

function validateConfig(n: number, config: SelectionConfig) {
  if (!Number.isInteger(n) || n < 0 || n > 40 || !Number.isInteger(config.k) || config.k < 1 || config.k > 12) {
    throw new Error('Usá hasta 40 elementos y una selección entera de 1 a 12 elementos.')
  }
}

function choose(n: number, k: number): bigint {
  if (k > n) return 0n
  let result = 1n
  for (let i = 1; i <= Math.min(k, n - k); i++) result = result * BigInt(n - i + 1) / BigInt(i)
  return result
}

export function cardinality(n: number, config: SelectionConfig): bigint {
  validateConfig(n, config)
  const { k, ordered, repetition } = config
  if (n === 0 || (!repetition && k > n)) return 0n
  if (!ordered) return choose(repetition ? n + k - 1 : n, k)
  if (repetition) return BigInt(n) ** BigInt(k)
  let result = 1n
  for (let i = 0; i < k; i++) result *= BigInt(n - i)
  return result
}

export function generateSpace(elements: ElementItem[], config: SelectionConfig) {
  if (elements.some(e => !e.id || !e.label.trim()) || new Set(elements.map(e => e.id)).size !== elements.length) {
    throw new Error('Los elementos necesitan identificadores únicos y nombres no vacíos.')
  }
  const count = cardinality(elements.length, config)
  const outcomes: Outcome[] = []
  const limited = count > BigInt(ENUMERATION_LIMIT)
  if (limited || count === 0n) return { count, outcomes, limited }
  function visit(selected: number[], start: number) {
    if (selected.length === config.k) {
      const items = selected.map(i => elements[i])
      outcomes.push({ id: JSON.stringify(items.map(e => e.id)), elements: items, label: items.map(e => e.label).join(' · ') })
      return
    }
    for (let i = config.ordered ? 0 : start; i < elements.length; i++) {
      if (!config.repetition && selected.includes(i)) continue
      visit([...selected, i], config.repetition ? i : i + 1)
    }
  }
  visit([], 0)
  return { count, outcomes, limited }
}

function validateCounts(favorable: number, total: number) {
  if (!Number.isSafeInteger(total) || total <= 0 || !Number.isSafeInteger(favorable) || favorable < 0 || favorable > total) {
    throw new Error('El espacio debe ser no vacío y los casos favorables deben pertenecer a él.')
  }
}

export function classicProbability(favorable: number, total: number, equiprobable: boolean): number {
  validateCounts(favorable, total)
  if (!equiprobable) throw new Error('La regla de Laplace solo se aplica a resultados equiprobables.')
  return favorable / total
}

export function fraction(numerator: number, denominator: number): string {
  validateCounts(numerator, denominator)
  let a = numerator
  let b = denominator
  while (b) [a, b] = [b, a % b]
  return `${numerator / a}/${denominator / a}`
}

export function intersection(a: string[], b: string[]): string[] {
  const right = new Set(b)
  return [...new Set(a)].filter(id => right.has(id))
}

export function classifyEvent(favorable: number, total: number): string[] {
  validateCounts(favorable, total)
  const labels: string[] = []
  if (favorable === 0) labels.push('Imposible')
  if (favorable === total) labels.push('Seguro')
  if (favorable === 1) labels.push('Simple')
  if (favorable >= 2) labels.push('Compuesto')
  return labels
}
