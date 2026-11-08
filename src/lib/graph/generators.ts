import type { GraphData } from '../../types'

export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 480

/** Plane layouts: Q1 is a segment, Q2 a square and Q3 two nested squares joined at their corners. */
const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const
const squareOrder = ['00', '01', '11', '10']

function position(bits: string): [number, number] {
  const cx = CANVAS_WIDTH / 2, cy = CANVAS_HEIGHT / 2
  if (bits.length === 1) return [cx + (bits === '0' ? -150 : 150), cy]
  const corner = corners[squareOrder.indexOf(bits.slice(-2))]
  const half = bits.length === 2 ? 150 : bits[0] === '0' ? 190 : 80
  return [cx + corner[0] * half, cy + corner[1] * half]
}

/** Generates the n-cube Qn (1 ≤ n ≤ 3): vertices are bit strings, adjacent when they differ in one bit. */
export function generateHypercube(dimension: 1 | 2 | 3): GraphData {
  const labels = Array.from({ length: 2 ** dimension }, (_, i) => i.toString(2).padStart(dimension, '0'))
  const nodes = labels.map(label => {
    const [x, y] = position(label)
    return { id: `q${dimension}-${label}`, label, x, y }
  })
  const edges = labels.flatMap((a, i) => labels.slice(i + 1)
    .filter(b => [...a].filter((bit, k) => bit !== b[k]).length === 1)
    .map(b => ({ id: `q${dimension}-${a}-${b}`, source: `q${dimension}-${a}`, target: `q${dimension}-${b}`, directed: false })))
  return { nodes, edges }
}

export type GraphFamily = 'tree' | 'cycle' | 'complete' | 'general'
export type GraphType = GraphFamily | 'surprise'
export const graphTypes: { id: GraphType; label: string }[] = [
  { id: 'surprise', label: 'Sorpresa (aleatorio)' },
  { id: 'tree', label: 'Árbol' },
  { id: 'cycle', label: 'Ciclo' },
  { id: 'complete', label: 'Completo' },
  { id: 'general', label: 'Con ciclos' },
]
const families: GraphFamily[] = ['tree', 'cycle', 'complete', 'general']
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function circle(n: number): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n
    return [CANVAS_WIDTH / 2 + 185 * Math.cos(angle), CANVAS_HEIGHT / 2 + 185 * Math.sin(angle)]
  })
}

/** Layered layout: leaves are placed left to right in DFS order and parents above their children's centre, so no edges cross. */
function treeLayout(parents: number[]): [number, number][] {
  const n = parents.length
  const children = Array.from({ length: n }, () => [] as number[])
  parents.forEach((parent, child) => { if (parent >= 0) children[parent].push(child) })
  const x = new Array<number>(n), depth = new Array<number>(n).fill(0)
  let leaves = 0
  const visit = (node: number) => {
    for (const child of children[node]) { depth[child] = depth[node] + 1; visit(child) }
    x[node] = children[node].length ? children[node].reduce((sum, c) => sum + x[c], 0) / children[node].length : leaves++
  }
  visit(0)
  const maxDepth = Math.max(...depth)
  return x.map((value, i) => [70 + (leaves > 1 ? value / (leaves - 1) : 0.5) * (CANVAS_WIDTH - 140), 60 + (maxDepth ? depth[i] / maxDepth : 0) * (CANVAS_HEIGHT - 120)])
}

/** Generates a random simple undirected graph with n nodes (A, B, C…) of the requested family. */
export function generateRandomGraph(type: GraphType, n: number, random: () => number = Math.random): { type: GraphFamily; data: GraphData } {
  const family = type === 'surprise' ? families[Math.floor(random() * families.length)] : type
  const pick = (max: number) => Math.floor(random() * max)
  let pairs: [number, number][] = []
  let positions = circle(n)
  if (family === 'tree') {
    const parents = Array.from({ length: n }, (_, i) => (i === 0 ? -1 : pick(i)))
    pairs = parents.flatMap((parent, child) => (parent >= 0 ? [[parent, child] as [number, number]] : []))
    positions = treeLayout(parents)
  } else if (family === 'cycle') {
    const order = Array.from({ length: n }, (_, i) => i)
    pairs = order.map(i => [i, (i + 1) % n])
  } else if (family === 'complete') {
    pairs = Array.from({ length: n }, (_, i) => Array.from({ length: n - i - 1 }, (_, k) => [i, i + k + 1] as [number, number])).flat()
  } else {
    const order = Array.from({ length: n }, (_, i) => i)
    const ring = order.map(i => [i, (i + 1) % n] as [number, number])
    const chords = order.flatMap(a => order.slice(a + 2).filter(b => !(a === 0 && b === n - 1)).map(b => [a, b] as [number, number])).filter(() => random() < 0.3)
    pairs = [...ring.filter(() => random() < 0.8), ...chords]
    if (!pairs.length || pairs.length - n + 1 <= 0) pairs = [...ring, ...chords]
  }
  const id = (i: number) => `n${i}`
  return {
    type: family,
    data: {
      nodes: positions.map(([x, y], i) => ({ id: id(i), label: letters[i], x, y })),
      edges: pairs.map(([a, b], i) => ({ id: `e${i}`, source: id(a), target: id(b), directed: false })),
    },
  }
}
