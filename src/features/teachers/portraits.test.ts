import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it.each(['facundo-moriconi', 'franco-aguirre'])('%s is a real path-based vector with a transparent exterior', name => {
  const svg = readFileSync(new URL(`../../assets/teachers/${name}.svg`, import.meta.url), 'utf8')
  expect(svg).toContain('viewBox="0 0 416 416"')
  expect((svg.match(/<path\b/g) ?? []).length).toBeGreaterThan(20)
  expect(svg).toContain('<clipPath')
  expect(svg).not.toMatch(/<image|data:image|<script|foreignObject|\sonload=|xlink:href=/i)
  expect(svg).not.toMatch(/<rect\b/)
})
