import { describe, expect, it } from 'vitest'
import { cardinality, generateSpace, classicProbability, intersection, classifyEvent, fraction } from './probability'
const elements = ['Lucas', 'Martina', 'Pedro', 'Sofía'].map((label, index) => ({ id: `e${index}`, label }))

describe('sample spaces', () => {
  it.each([
    [true, false, 12n], [true, true, 16n], [false, false, 6n], [false, true, 10n],
  ])('enumerates ordered=%s repetition=%s', (ordered, repetition, count) => {
    const config = { ordered, repetition, k: 2 }
    const space = generateSpace(elements, config)
    expect(space.count).toBe(count)
    expect(cardinality(4, config)).toBe(count)
    expect(space.outcomes).toHaveLength(Number(count))
    expect(new Set(space.outcomes.map(o => o.id)).size).toBe(Number(count))
    if (!repetition) expect(space.outcomes.every(o => new Set(o.elements.map(e => e.id)).size === 2)).toBe(true)
  })
  it('supports larger k and exact bigint counts with no partial enumeration', () => {
    expect(cardinality(5, { k: 3, ordered: false, repetition: false })).toBe(10n)
    expect(cardinality(40, { k: 12, ordered: true, repetition: true })).toBe(40n ** 12n)
    const result = generateSpace(elements, { k: 12, ordered: true, repetition: true })
    expect(result.limited).toBe(true)
    expect(result.outcomes).toEqual([])
  })
  it('uses collision-free IDs even with duplicate names or delimiters', () => {
    const input = [{ id: 'a|b', label: 'L' }, { id: 'a', label: 'L' }, { id: 'b|a', label: 'L' }]
    const result = generateSpace(input, { k: 2, ordered: true, repetition: true })
    expect(new Set(result.outcomes.map(o => o.id)).size).toBe(9)
    expect(() => generateSpace([input[0], input[0]], { k: 2, ordered: true, repetition: true })).toThrow()
  })
  it('handles no feasible selections and rejects unsupported configurations', () => {
    expect(cardinality(2, { k: 3, ordered: false, repetition: false })).toBe(0n)
    expect(generateSpace([], { k: 2, ordered: true, repetition: false }).count).toBe(0n)
    for (const k of [0, -1, 1.5, NaN, 13]) expect(() => cardinality(4, { k, ordered: true, repetition: false })).toThrow()
  })
})

describe('events and Laplace', () => {
  it('calculates only valid equiprobable events', () => {
    expect(classicProbability(2, 12, true)).toBe(1 / 6)
    expect(classicProbability(0, 12, true)).toBe(0)
    expect(classicProbability(12, 12, true)).toBe(1)
    for (const args of [[1, 0], [-1, 6], [7, 6], [1.5, 6], [NaN, 6]]) expect(() => classicProbability(args[0], args[1], true)).toThrow()
    expect(() => classicProbability(2, 10, false)).toThrow()
    expect(fraction(2, 12)).toBe('1/6')
    expect(fraction(0, 12)).toBe('0/1')
  })
  it('classifies overlapping certain/simple and certain/compound events', () => {
    expect(classifyEvent(0, 6)).toEqual(['Imposible'])
    expect(classifyEvent(1, 6)).toEqual(['Simple'])
    expect(classifyEvent(2, 6)).toEqual(['Compuesto'])
    expect(classifyEvent(6, 6)).toEqual(['Seguro', 'Compuesto'])
    expect(classifyEvent(1, 1)).toEqual(['Seguro', 'Simple'])
  })
  it('finds unique shared outcomes and detects mutual exclusion', () => {
    expect(intersection(['LM', 'LP'], ['MS', 'PS'])).toEqual([])
    expect(intersection(['LM', 'LP', 'LP'], ['LP', 'PS'])).toEqual(['LP'])
    expect(intersection([], ['LP'])).toEqual([])
  })
})
