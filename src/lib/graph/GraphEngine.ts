import type { GraphData, GraphEdge, GraphNode } from '../../types'
import { edgeShapes, polylinesIntersect } from './geometry'

export interface NodeDegree { id: string; degree: number; inDegree: number; outDegree: number }
export interface PathResult { nodes: string[]; edges: string[]; length: number; weight: number }
export interface EulerTrail { kind: 'circuit' | 'trail'; nodes: string[]; edges: string[] }
export type PlanarityVerdict = 'plane' | 'planar-redrawable' | 'nonplanar' | 'undetermined'
export interface Planarity { verdict: PlanarityVerdict; crossings: number; reason: string }

interface Step { edge: GraphEdge; to: string }

/**
 * All graph mathematics lives here; the UI only renders its results.
 * Mixed graphs are supported: an undirected edge can be traversed both ways, a directed edge only source → target.
 */
export class GraphEngine {
  readonly nodes: readonly GraphNode[]
  readonly edges: readonly GraphEdge[]
  private readonly index: Map<string, number>
  private readonly data: GraphData

  constructor(data: GraphData) {
    this.index = new Map(data.nodes.map((node, i) => [node.id, i]))
    const edges = data.edges.filter(edge => this.index.has(edge.source) && this.index.has(edge.target))
    for (const edge of edges)
      if (edge.weight !== undefined && !(Number.isFinite(edge.weight) && edge.weight >= 0)) throw new RangeError('El peso W(s) debe ser un número no negativo.')
    this.nodes = data.nodes
    this.edges = edges
    this.data = { nodes: data.nodes, edges }
  }

  /** N = |V| */
  get order() { return this.nodes.length }
  /** S = |E| */
  get size() { return this.edges.length }

  isDigraph() { return this.edges.some(edge => edge.directed) }
  isWeighted() { return this.edges.some(edge => edge.weight !== undefined) }
  hasLoops() { return this.edges.some(edge => edge.source === edge.target) }

  /** Parallel edges share their endpoints; two arcs in opposite directions are not parallel. */
  hasParallelEdges() {
    const seen: GraphEdge[] = []
    for (const edge of this.edges) {
      if (seen.some(other => this.parallel(edge, other))) return true
      seen.push(edge)
    }
    return false
  }
  isMultigraph() { return this.hasLoops() || this.hasParallelEdges() }

  private parallel(a: GraphEdge, b: GraphEdge) {
    const same = a.source === b.source && a.target === b.target
    const reversed = a.source === b.target && a.target === b.source
    if (!same && !reversed) return false
    return !(a.directed && b.directed && !same)
  }

  /** Adjacency matrix in node order; each parallel edge adds 1 and an undirected loop adds 1 to the diagonal. */
  adjacencyMatrix(): number[][] {
    const matrix = this.nodes.map(() => this.nodes.map(() => 0))
    for (const edge of this.edges) {
      const s = this.index.get(edge.source)!, t = this.index.get(edge.target)!
      matrix[s][t]++
      if (!edge.directed && s !== t) matrix[t][s]++
    }
    return matrix
  }

  /**
   * g(v) counts every incidence: an undirected loop adds 2, a directed loop adds one entry and one exit.
   * inDegree (gri) and outDegree (gro) count directed edges only.
   */
  degrees(): NodeDegree[] {
    return this.nodes.map(node => {
      let inDegree = 0, outDegree = 0, undirected = 0
      for (const edge of this.edges) {
        if (edge.directed) {
          if (edge.target === node.id) inDegree++
          if (edge.source === node.id) outDegree++
        } else {
          if (edge.source === node.id) undirected++
          if (edge.target === node.id) undirected++
        }
      }
      return { id: node.id, degree: inDegree + outDegree + undirected, inDegree, outDegree }
    })
  }

  /** Handshake theorem: Σ g(v) = 2|S|. */
  handshake() {
    const sum = this.degrees().reduce((total, d) => total + d.degree, 0)
    return { sum, edges: this.size, holds: sum === 2 * this.size }
  }

  isolated() { return this.degrees().filter(d => d.degree === 0).map(d => d.id) }

  /** Sources: nonisolated nodes nothing can enter (gri = 0 and no undirected incidence). */
  sources() { return this.degrees().filter(d => d.degree > 0 && d.inDegree === 0 && d.degree === d.outDegree).map(d => d.id) }
  /** Sinks: nonisolated nodes nothing can leave (gro = 0 and no undirected incidence). */
  sinks() { return this.degrees().filter(d => d.degree > 0 && d.outDegree === 0 && d.degree === d.inDegree).map(d => d.id) }

  private steps(from: string): Step[] {
    const steps: Step[] = []
    for (const edge of this.edges) {
      if (edge.source === from) steps.push({ edge, to: edge.target })
      else if (!edge.directed && edge.target === from) steps.push({ edge, to: edge.source })
    }
    return steps
  }

  private reach(start: string, ignoreDirection: boolean, reverse = false) {
    const seen = new Set([start])
    const queue = [start]
    while (queue.length) {
      const current = queue.shift()!
      for (const edge of this.edges) {
        const forward = edge.source === current ? edge.target : undefined
        const backward = edge.target === current ? edge.source : undefined
        const allowForward = ignoreDirection || !edge.directed || !reverse
        const allowBackward = ignoreDirection || !edge.directed || reverse
        for (const next of [allowForward ? forward : undefined, allowBackward ? backward : undefined])
          if (next !== undefined && !seen.has(next)) { seen.add(next); queue.push(next) }
      }
    }
    return seen
  }

  /** Connected ("conexo"): a path exists between every pair, ignoring direction (weak connectivity). */
  isConnected() { return this.order > 0 && this.reach(this.nodes[0].id, true).size === this.order }

  /** Strong connectivity: every node reaches every other one following directions. */
  isStronglyConnected() {
    if (!this.order) return false
    const start = this.nodes[0].id
    return this.reach(start, false).size === this.order && this.reach(start, false, true).size === this.order
  }

  components() {
    const seen = new Set<string>()
    let count = 0
    for (const node of this.nodes) {
      if (seen.has(node.id)) continue
      count++
      for (const id of this.reach(node.id, true)) seen.add(id)
    }
    return count
  }

  private isSimpleUndirected() { return !this.isDigraph() && !this.isMultigraph() }

  /** Returns n when the graph is the complete graph Kn (simple, undirected, every pair adjacent). */
  completeOrder(): number | null {
    const n = this.order
    if (!n || !this.isSimpleUndirected()) return null
    return this.size === (n * (n - 1)) / 2 ? n : null
  }

  /**
   * Recognizes the n-cube Qn and returns a bit-string label per vertex.
   * Qn is vertex- and neighbour-transitive, so fixing a root and its neighbours' bits loses no generality;
   * every other vertex is labelled as the union of its neighbours one level closer to the root.
   */
  hypercube(): { dimension: number; labels: Map<string, string> } | null {
    const n = this.order
    const dimension = Math.log2(n)
    if (n < 2 || !Number.isInteger(dimension) || !this.isSimpleUndirected() || this.size !== dimension * 2 ** (dimension - 1)) return null
    if (this.degrees().some(d => d.degree !== dimension) || !this.isConnected()) return null
    const neighbours = new Map(this.nodes.map(node => [node.id, this.steps(node.id).map(step => step.to)]))
    const root = this.nodes[0].id
    const distance = new Map([[root, 0]])
    const order = [root]
    for (let i = 0; i < order.length; i++)
      for (const next of neighbours.get(order[i])!)
        if (!distance.has(next)) { distance.set(next, distance.get(order[i])! + 1); order.push(next) }
    const masks = new Map([[root, 0]])
    neighbours.get(root)!.forEach((id, bit) => masks.set(id, 1 << bit))
    for (const id of order) {
      if (masks.has(id)) continue
      const level = distance.get(id)!
      const lower = neighbours.get(id)!.filter(other => distance.get(other) === level - 1)
      if (lower.length !== level) return null
      masks.set(id, lower.reduce((mask, other) => mask | masks.get(other)!, 0))
    }
    const popcount = (m: number) => m.toString(2).split('').filter(bit => bit === '1').length
    if (new Set(masks.values()).size !== n || order.some(id => popcount(masks.get(id)!) !== distance.get(id))) return null
    if (this.edges.some(edge => popcount(masks.get(edge.source)! ^ masks.get(edge.target)!) !== 1)) return null
    return { dimension, labels: new Map([...masks].map(([id, mask]) => [id, mask.toString(2).padStart(dimension, '0')])) }
  }

  /** Number of edge pairs that cross in the current drawing. Loops and parallel edges never cross each other. */
  crossings() {
    const shapes = edgeShapes(this.data)
    const drawn = this.edges.filter(edge => edge.source !== edge.target)
    let count = 0
    for (let i = 0; i < drawn.length; i++)
      for (let j = i + 1; j < drawn.length; j++) {
        const a = drawn[i], b = drawn[j]
        const samePair = (a.source === b.source && a.target === b.target) || (a.source === b.target && a.target === b.source)
        if (!samePair && polylinesIntersect(shapes.get(a.id)!.samples, shapes.get(b.id)!.samples)) count++
      }
    return count
  }

  /**
   * "Plano": the current drawing has no edge crossings. When it has crossings, the edge bounds S ≤ 3N − 6
   * (and S ≤ 2N − 4 without triangles) can prove non-planarity; otherwise the verdict stays undetermined.
   */
  planarity(): Planarity {
    const crossings = this.crossings()
    if (!crossings) return { verdict: 'plane', crossings, reason: 'El dibujo actual no tiene cruces de aristas.' }
    const pairs = new Set(this.edges.filter(e => e.source !== e.target).map(e => [e.source, e.target].sort().join('\u0000')))
    const n = this.order, s = pairs.size
    if (n >= 3 && s > 3 * n - 6) return { verdict: 'nonplanar', crossings, reason: `S = ${s} > 3N − 6 = ${3 * n - 6}: ningún dibujo evita los cruces.` }
    if (n >= 3 && !this.hasTriangle(pairs) && s > 2 * n - 4) return { verdict: 'nonplanar', crossings, reason: `Sin triángulos, S = ${s} > 2N − 4 = ${2 * n - 4}: ningún dibujo evita los cruces.` }
    if (n <= 4) return { verdict: 'planar-redrawable', crossings, reason: 'Todo grafo de hasta 4 vértices admite un dibujo sin cruces: mové los nodos para eliminarlos.' }
    return { verdict: 'undetermined', crossings, reason: 'El dibujo tiene cruces. Reubicá los nodos para intentar eliminarlos.' }
  }

  private hasTriangle(pairs: Set<string>) {
    const ids = this.nodes.map(node => node.id)
    const adjacent = (a: string, b: string) => pairs.has([a, b].sort().join('\u0000'))
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++)
        if (adjacent(ids[i], ids[j]))
          for (let k = j + 1; k < ids.length; k++)
            if (adjacent(ids[i], ids[k]) && adjacent(ids[j], ids[k])) return true
    return false
  }

  /** Euler formula N − S + R = 2, available only for connected graphs whose drawing has no crossings. */
  euler(): { N: number; S: number; R: number } | null {
    if (!this.isConnected() || this.crossings() > 0) return null
    return { N: this.order, S: this.size, R: 2 - this.order + this.size }
  }

  /**
   * Shortest route from u to v following edge directions. Without weights, BFS minimizes the number of edges
   * (d(u,v)); with weights, Dijkstra minimizes the total weight, counting unweighted edges as 1.
   */
  shortestPath(u: string, v: string, weighted: boolean): PathResult | null {
    if (!this.index.has(u) || !this.index.has(v)) return null
    const cost = (edge: GraphEdge) => weighted ? edge.weight ?? 1 : 1
    const best = new Map([[u, 0]])
    const previous = new Map<string, Step & { from: string }>()
    const done = new Set<string>()
    while (true) {
      let current: string | undefined
      for (const [id, value] of best) if (!done.has(id) && (current === undefined || value < best.get(current)!)) current = id
      if (current === undefined || current === v) break
      done.add(current)
      for (const step of this.steps(current)) {
        const candidate = best.get(current)! + cost(step.edge)
        if (!best.has(step.to) || candidate < best.get(step.to)!) { best.set(step.to, candidate); previous.set(step.to, { ...step, from: current }) }
      }
    }
    if (!best.has(v)) return null
    const nodes = [v], edges: string[] = []
    for (let at = v; at !== u;) {
      const step = previous.get(at)!
      edges.unshift(step.edge.id)
      nodes.unshift(step.from)
      at = step.from
    }
    return { nodes, edges, length: edges.length, weight: edges.reduce((total, id) => total + (this.edges.find(e => e.id === id)!.weight ?? 1), 0) }
  }

  /** Cyclomatic number S − N + C > 0 means the graph has a cycle (direction ignored; loops and parallels count). */
  hasCycle() { return this.size - this.order + this.components() > 0 }

  /** Tree: connected and without cycles, equivalently connected with S = N − 1. */
  isTree() { return this.order > 0 && this.isConnected() && this.size === this.order - 1 }

  /** Two-colours the vertices so that every edge joins both sides; null when an odd cycle (or loop) exists. */
  bipartition(): { left: string[]; right: string[] } | null {
    if (this.hasLoops()) return null
    const side = new Map<string, 0 | 1>()
    for (const node of this.nodes) {
      if (side.has(node.id)) continue
      side.set(node.id, 0)
      const queue = [node.id]
      while (queue.length) {
        const current = queue.shift()!
        for (const edge of this.edges) {
          const other = edge.source === current ? edge.target : edge.target === current ? edge.source : undefined
          if (other === undefined) continue
          if (!side.has(other)) { side.set(other, side.get(current) === 0 ? 1 : 0); queue.push(other) }
          else if (side.get(other) === side.get(current)) return null
        }
      }
    }
    return { left: this.nodes.filter(n => side.get(n.id) === 0).map(n => n.id), right: this.nodes.filter(n => side.get(n.id) === 1).map(n => n.id) }
  }

  /** k when every vertex has degree k (k-regular graph), otherwise null. */
  regularDegree(): number | null {
    const degrees = this.degrees().map(d => d.degree)
    return degrees.length && degrees.every(d => d === degrees[0]) ? degrees[0] : null
  }

  /**
   * Euler circuit (every edge once, closed) when all degrees are even, or Euler trail when exactly two are odd.
   * Requires an undirected graph whose edges lie in one connected component. Built with Hierholzer's algorithm.
   */
  eulerTrail(): EulerTrail | null {
    if (!this.size || this.isDigraph()) return null
    const active = this.nodes.filter(node => this.edges.some(e => e.source === node.id || e.target === node.id))
    if (this.reach(active[0].id, true).size !== active.length) return null
    const odd = this.degrees().filter(d => d.degree % 2 === 1).map(d => d.id)
    if (odd.length !== 0 && odd.length !== 2) return null
    const used = new Set<string>()
    const stack: { node: string; edge?: string }[] = [{ node: odd[0] ?? active[0].id }]
    const trail: { node: string; edge?: string }[] = []
    while (stack.length) {
      const top = stack.at(-1)!
      const edge = this.edges.find(e => !used.has(e.id) && (e.source === top.node || e.target === top.node))
      if (edge) {
        used.add(edge.id)
        stack.push({ node: edge.source === top.node ? edge.target : edge.source, edge: edge.id })
      } else trail.push(stack.pop()!)
    }
    trail.reverse()
    return { kind: odd.length ? 'trail' : 'circuit', nodes: trail.map(step => step.node), edges: trail.slice(1).map(step => step.edge!) }
  }
}
