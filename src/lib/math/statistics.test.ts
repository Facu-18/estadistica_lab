import { describe, expect, it } from 'vitest'
import { parseData, mean, median, modes, frequencyDictionary, frequencyTable, histogram } from './statistics'
import { formatNumber } from '../format'

const grades = [6, 7, 8, 6, 9, 7, 6, 10, 8, 7]

describe('descriptive statistics', () => {
  it('calculates the supplied ten grades without modifying their order', () => {
    expect(mean(grades)).toBe(7.4)
    expect(median(grades)).toBe(7)
    expect(modes(grades)).toEqual([6, 7])
    expect(grades[1]).toBe(7)
  })
  it('handles odd medians, negatives, decimals and a singleton', () => {
    expect(median([9, -2, 1])).toBe(1)
    expect(median([1, 2])).toBe(1.5)
    expect(mean([0.1, 0.2])).toBeCloseTo(0.15, 15)
    expect(modes([3])).toEqual([3])
    expect(modes([1, 2, 3])).toEqual([])
  })
  it('constructs sorted and exact cumulative frequencies', () => {
    const rows = frequencyTable(grades)
    expect(rows.map(r => r.value)).toEqual([6, 7, 8, 9, 10])
    expect(rows.map(r => r.fi)).toEqual([3, 3, 2, 1, 1])
    expect(rows.map(r => r.Fi)).toEqual([3, 6, 8, 9, 10])
    expect(rows.map(r => r.Hi)).toEqual([0.3, 0.6, 0.8, 0.9, 1])
    expect(rows.reduce((sum, r) => sum + r.fi, 0)).toBe(10)
    expect(rows.reduce((sum, r) => sum + r.hi, 0)).toBeCloseTo(1, 14)
    expect(rows[0].percent).toBe(30)
  })
  it('parses commas, whitespace, newlines, signed decimal and exponent notation', () => {
    expect(parseData('6, 7\n8   -2.5,1e2')).toEqual([6, 7, 8, -2.5, 100])
    expect(parseData(' , \n')).toEqual([])
    for (const input of ['1,abc,2', 'Infinity', 'NaN', '0x10', '1.2.3', '1e999', '1e13']) {
      expect(() => parseData(input)).toThrow()
    }
    expect(() => parseData(Array(5001).fill('1').join(','))).toThrow()
  })
  it('rejects missing and invalid numerical observations', () => {
    expect(frequencyTable([])).toEqual([])
    for (const fn of [mean, median, modes]) {
      expect(() => fn([])).toThrow()
      expect(() => fn([NaN])).toThrow()
    }
  })
  it('bins boundaries once, with a closed final interval', () => {
    const bins = histogram([0, 1, 2, 3, 4], 2)
    expect(bins.map(b => b.fi)).toEqual([2, 3])
    expect(bins[1].hi).toBe(0.6)
    expect(histogram([2, 2, 2], 5).map(b => b.fi)).toEqual([3])
    expect(histogram([], 5)).toEqual([])
    expect(() => histogram(grades, 0)).toThrow()
    expect(() => histogram(grades, 2.5)).toThrow()
  })
  it('uses a data-to-frequency dictionary and selects every maximum-frequency key', () => {
    const data = [5, -2, 5, 0.5, -2]
    const before = [...data]
    expect(frequencyDictionary(data)).toEqual(new Map([[5, 2], [-2, 2], [0.5, 1]]))
    expect(frequencyDictionary([])).toEqual(new Map())
    expect(() => frequencyDictionary([NaN])).toThrow()
    expect(modes(data)).toEqual([-2, 5])
    expect(data).toEqual(before)
  })
  it('weights each distinct value by its frequency before dividing by N', () => {
    const data = [1, 1, 1, 9, 9]
    const dictionary = frequencyDictionary(data)
    const weightedTotal = [...dictionary].reduce((sum, [value, count]) => sum + value * count, 0)
    expect(mean(data)).toBe(weightedTotal / data.length)
    expect(mean(data)).toBe(4.2)
    expect(mean([0.1, 0.1, 0.2])).toBeCloseTo(0.4 / 3, 15)
  })
  it('keeps the exact raw-data median for odd, even and repeated values', () => {
    expect(median([100, 2, 1])).toBe(2)
    expect(median([100, 2, 8, 1])).toBe(5)
    expect(median([5, 2, 2, 1])).toBe(2)
  })
  it('rounds only presentation with Spanish decimal separators', () => {
    expect(formatNumber(1 / 6, 4)).toBe('0,1667')
    expect(formatNumber(100 / 6, 2)).toBe('16,67')
    expect(formatNumber(0.00001, 4)).toBe('0,0000')
  })
})
