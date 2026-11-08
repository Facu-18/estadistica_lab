import { expect, test } from 'vitest'
import { parseData, mean, median, modes, frequencyTable, histogram } from './lib/math/statistics'
import { cardinality, generateSpace, classicProbability, fraction, classifyEvent, intersection } from './lib/math/probability'
import { formatNumber } from './lib/format'

// Regression probes independently derived from the educational examples.
test('mixed separators preserve observations and cumulative invariants', () => {
  const data = parseData('6, 7\n8 6,9 7 6 10 8 7')
  const before = [...data]
  expect(data.length).toBe(10)
  expect(mean(data)).toBe(7.4)
  expect(median(data)).toBe(7)
  expect(modes(data)).toEqual([6, 7])
  const rows = frequencyTable(data)
  expect(rows.map(r => r.fi)).toEqual([3, 3, 2, 1, 1])
  expect(rows.map(r => r.Fi)).toEqual([3, 6, 8, 9, 10])
  expect(rows.at(-1)?.Hi).toBe(1)
  expect(rows.reduce((sum, row) => sum + row.hi, 0)).toBeCloseTo(1, 14)
  expect(data).toEqual(before)
  expect(formatNumber(rows[0].hi, 4)).toBe('0,3000')
  expect(formatNumber(rows[0].percent)).toBe('30,00')
})

test('invalid tokens do not silently alter the sample', () => {
  expect(parseData(' ,\n ')).toEqual([])
  expect(frequencyTable([])).toEqual([])
  expect(() => parseData('1 nope')).toThrow('El dato 2 («nope») no es un número válido. Usá punto para los decimales.')
  expect(() => mean([])).toThrow()
  expect(parseData('-2 .5 +3 1e2')).toEqual([-2, 0.5, 3, 100])
})

test('histogram intervals conserve all observations', () => {
  expect(histogram([0, 1, 2, 3, 4], 2).map(b => b.fi)).toEqual([2, 3])
  expect(histogram([5, 5], 5).map(b => b.fi)).toEqual([2])
  expect(histogram([], 1)).toEqual([])
  for (const count of [0, 1.5, 31]) expect(() => histogram([1], count)).toThrow()
})

test('all selection modes agree between enumeration and exact cardinality', () => {
  const elements = ['A', 'B', 'C', 'D'].map((label, i) => ({ label, id: String(i) }))
  for (const [ordered, repetition, expected] of [[true, false, 12], [true, true, 16], [false, false, 6], [false, true, 10]] as const) {
    const space = generateSpace(elements, { k: 2, ordered, repetition })
    expect(space.count).toBe(BigInt(expected))
    expect(space.outcomes.length).toBe(expected)
    expect(new Set(space.outcomes.map(o => o.id)).size).toBe(expected)
  }
  expect(cardinality(4, { k: 5, ordered: true, repetition: false })).toBe(0n)
  expect(generateSpace(elements, { k: 12, ordered: true, repetition: true })).toMatchObject({ count: 16777216n, limited: true, outcomes: [] })
  expect(() => generateSpace([{ id: 'a', label: 'A' }, { id: 'a', label: 'B' }], { k: 1, ordered: true, repetition: false })).toThrow()
})

test('manual events have valid probabilities and exclusive or shared outcomes', () => {
  const elements = ['L', 'M', 'P', 'S'].map((label, i) => ({ id: `element-${i}`, label }))
  const space = generateSpace(elements, { k: 2, ordered: true, repetition: false })
  const eventA = space.outcomes.filter(o => o.elements.every(e => ['L', 'P'].includes(e.label))).map(o => o.id)
  const eventB = space.outcomes.filter(o => o.elements.every(e => ['M', 'S'].includes(e.label))).map(o => o.id)
  expect(space.count).toBe(12n)
  expect(eventA).toHaveLength(2)
  expect(classicProbability(eventA.length, space.outcomes.length, true)).toBe(1 / 6)
  expect(intersection(eventA, eventB)).toEqual([])
  expect(intersection(eventA, [...eventB, eventA[0]])).toEqual([eventA[0]])
  expect(fraction(2, 12)).toBe('1/6')
  expect(classifyEvent(0, 6)).toEqual(['Imposible'])
  expect(classifyEvent(6, 6)).toEqual(['Seguro', 'Compuesto'])
  expect(classifyEvent(1, 1)).toEqual(['Seguro', 'Simple'])
  expect(() => classicProbability(1, 2, false)).toThrow()
  expect(() => classicProbability(3, 2, true)).toThrow()
})
