import { describe, expect, it } from 'vitest'
import { frequencyDictionary, frequencyTable, histogram, mean, median, modes, parseData } from './statistics'

describe('independent dictionary statistics regressions', () => {
  it('preserves number keys and weights every distinct value', () => {
    const data = [-2.5, -2.5, 0, 4.75]
    expect(frequencyDictionary(data)).toEqual(new Map([[-2.5, 2], [0, 1], [4.75, 1]]))
    expect(mean(data)).toBe(-0.0625)
    expect(modes(data)).toEqual([-2.5])
  })

  it('preserves ties, singleton and amodal conventions', () => {
    expect(modes([9, 1, 9, 1])).toEqual([1, 9])
    expect(modes([7])).toEqual([7])
    expect(modes([3, 1, 2])).toEqual([])
    expect(frequencyDictionary([-0, 0])).toEqual(new Map([[0, 2]]))
  })

  it('keeps exact median while grouping only the histogram', () => {
    const data = [100, 0, 99, 0, 1]
    expect(median(data)).toBe(1)
    expect(median([100, 0, 2, 4])).toBe(3)
    for (const count of [1, 2, 5, 20, 30]) {
      expect(histogram(data, count).reduce((n, bin) => n + bin.fi, 0)).toBe(data.length)
      expect(median(data)).toBe(1)
    }
    const rows = frequencyTable(data)
    expect(rows.map(row => [row.value, row.fi, row.Fi])).toEqual([
      [0, 2, 2], [1, 1, 3], [99, 1, 4], [100, 1, 5],
    ])
    expect(rows.at(-1)?.Hi).toBe(1)
  })

  it('rejects invalid input without mutating observations', () => {
    const data = [1, Number.NaN, 2]
    const before = [...data]
    for (const fn of [mean, median, modes, frequencyDictionary, frequencyTable]) {
      expect(() => fn(data)).toThrow('Se necesitan datos numéricos válidos (hasta 5.000 observaciones, magnitud ≤ 10¹²).')
      expect(data).toEqual(before)
    }
    expect(() => parseData('1 x')).toThrow('El dato 2 («x») no es un número válido. Usá punto para los decimales.')
    expect(frequencyTable([])).toEqual([])
    expect(mean(Array(5000).fill(1e12))).toBe(1e12)
    expect(() => mean(Array(5001).fill(1))).toThrow()
  })
})
