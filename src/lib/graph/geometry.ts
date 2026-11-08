import type { GraphData, GraphEdge } from '../../types'

/** Pure drawing geometry shared by the canvas (rendering) and GraphEngine (crossing detection). */
export const NODE_RADIUS = 18
const PARALLEL_SPACING = 34
const CURVE_SAMPLES = 12

export interface Point { x: number; y: number }
export interface EdgeShape {
  kind: 'line' | 'curve' | 'loop'
  /** SVG path data, trimmed to the node borders so that arrowheads stay visible. */
  d: string
  /** Polyline approximation used for crossing detection; empty for loops. */
  samples: Point[]
  label: Point
}

const pairKey = (edge: GraphEdge) => [edge.source, edge.target].sort().join('\u0000')

function unit(from: Point, to: Point): Point {
  const dx = to.x - from.x, dy = to.y - from.y
  const length = Math.hypot(dx, dy)
  return length ? { x: dx / length, y: dy / length } : { x: 0, y: -1 }
}
const along = (p: Point, direction: Point, distance: number): Point => ({ x: p.x + direction.x * distance, y: p.y + direction.y * distance })
const quadratic = (p0: Point, c: Point, p2: Point, t: number): Point => ({
  x: (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * c.x + t ** 2 * p2.x,
  y: (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * c.y + t ** 2 * p2.y,
})
const round = (n: number) => Math.round(n * 100) / 100

/** Computes one shape per edge. Parallel edges fan out as curves; loops stack above their node. */
export function edgeShapes(data: GraphData): Map<string, EdgeShape> {
  const positions = new Map(data.nodes.map(node => [node.id, { x: node.x, y: node.y }]))
  const groups = new Map<string, GraphEdge[]>()
  for (const edge of data.edges) {
    if (!positions.has(edge.source) || !positions.has(edge.target)) continue
    const key = pairKey(edge)
    groups.set(key, [...(groups.get(key) ?? []), edge])
  }
  const shapes = new Map<string, EdgeShape>()
  for (const group of groups.values()) {
    group.forEach((edge, index) => {
      const source = positions.get(edge.source)!
      if (edge.source === edge.target) {
        const height = 22 + index * 13
        const start = { x: source.x - NODE_RADIUS * 0.5, y: source.y - NODE_RADIUS * 0.866 }
        const end = { x: source.x + NODE_RADIUS * 0.5, y: source.y - NODE_RADIUS * 0.866 }
        const top = source.y - NODE_RADIUS - height * 1.5
        shapes.set(edge.id, {
          kind: 'loop',
          d: `M ${round(start.x)} ${round(start.y)} C ${round(source.x - height)} ${round(top)} ${round(source.x + height)} ${round(top)} ${round(end.x)} ${round(end.y)}`,
          samples: [],
          label: { x: source.x, y: top + height * 0.35 - 8 },
        })
        return
      }
      const target = positions.get(edge.target)!
      // A canonical orientation keeps offsets consistent regardless of each edge's own direction.
      const [a, b] = edge.source < edge.target ? [source, target] : [target, source]
      const base = unit(a, b)
      const normal = { x: -base.y, y: base.x }
      const offset = (index - (group.length - 1) / 2) * PARALLEL_SPACING
      const middle = { x: (source.x + target.x) / 2, y: (source.y + target.y) / 2 }
      const control = along(middle, normal, offset * 2)
      const start = along(source, unit(source, control), NODE_RADIUS)
      const end = along(target, unit(target, control), NODE_RADIUS)
      if (offset === 0) {
        shapes.set(edge.id, { kind: 'line', d: `M ${round(start.x)} ${round(start.y)} L ${round(end.x)} ${round(end.y)}`, samples: [start, end], label: along(middle, normal, 13) })
      } else {
        const samples = Array.from({ length: CURVE_SAMPLES + 1 }, (_, i) => quadratic(start, control, end, i / CURVE_SAMPLES))
        shapes.set(edge.id, { kind: 'curve', d: `M ${round(start.x)} ${round(start.y)} Q ${round(control.x)} ${round(control.y)} ${round(end.x)} ${round(end.y)}`, samples, label: along(quadratic(start, control, end, 0.5), normal, Math.sign(offset) * 11) })
      }
    })
  }
  return shapes
}

const orientation = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
const EPSILON = 1e-9
const within = (a: Point, b: Point, p: Point) => Math.min(a.x, b.x) - EPSILON <= p.x && p.x <= Math.max(a.x, b.x) + EPSILON && Math.min(a.y, b.y) - EPSILON <= p.y && p.y <= Math.max(a.y, b.y) + EPSILON

/** True when two segments cross or overlap (touching collinearly counts as overlap). */
export function segmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const o1 = orientation(p1, p2, p3), o2 = orientation(p1, p2, p4), o3 = orientation(p3, p4, p1), o4 = orientation(p3, p4, p2)
  if (((o1 > EPSILON && o2 < -EPSILON) || (o1 < -EPSILON && o2 > EPSILON)) && ((o3 > EPSILON && o4 < -EPSILON) || (o3 < -EPSILON && o4 > EPSILON))) return true
  return (Math.abs(o1) <= EPSILON && within(p1, p2, p3)) || (Math.abs(o2) <= EPSILON && within(p1, p2, p4))
    || (Math.abs(o3) <= EPSILON && within(p3, p4, p1)) || (Math.abs(o4) <= EPSILON && within(p3, p4, p2))
}

export function polylinesIntersect(a: Point[], b: Point[]): boolean {
  for (let i = 0; i + 1 < a.length; i++)
    for (let j = 0; j + 1 < b.length; j++)
      if (segmentsIntersect(a[i], a[i + 1], b[j], b[j + 1])) return true
  return false
}
