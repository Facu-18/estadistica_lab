import { describe, expect, it } from 'vitest'
import { GraphEngine } from './GraphEngine'
import { generateHypercube, generateRandomGraph, graphTypes } from './generators'
import type { GraphData, GraphEdge } from '../../types'

type EdgeSpec = [string, string, { directed?: boolean; weight?: number }?]
/** Builds a graph; positions default to a circle so that drawings of small cycles do not cross. */
function graph(labels: string[], edges: EdgeSpec[], positions?: Record<string, [number, number]>): GraphData {
  return {
    nodes: labels.map((label, i) => {
      const [x, y] = positions?.[label] ?? [400 + 150 * Math.cos((2 * Math.PI * i) / labels.length), 240 + 150 * Math.sin((2 * Math.PI * i) / labels.length)]
      return { id: label, label, x, y }
    }),
    edges: edges.map(([source, target, options], i): GraphEdge => ({ id: `e${i}`, source, target, directed: options?.directed ?? false, weight: options?.weight })),
  }
}
const complete = (labels: string[]) => graph(labels, labels.flatMap((a, i) => labels.slice(i + 1).map(b => [a, b] as EdgeSpec)))

describe('GraphEngine adjacency matrix', () => {
  it('adds one per parallel edge, is asymmetric for directed edges and counts a loop once on the diagonal', () => {
    const engine = new GraphEngine(graph(['A', 'B', 'C'], [['A', 'B'], ['A', 'B'], ['B', 'C', { directed: true }], ['C', 'C']]))
    expect(engine.adjacencyMatrix()).toEqual([
      [0, 2, 0],
      [2, 0, 1],
      [0, 0, 1],
    ])
  })
})

describe('GraphEngine classification', () => {
  it('detects multigraphs from parallel edges or loops but not from opposite arcs', () => {
    expect(new GraphEngine(graph(['A', 'B'], [['A', 'B'], ['B', 'A']])).isMultigraph()).toBe(true)
    expect(new GraphEngine(graph(['A'], [['A', 'A']])).isMultigraph()).toBe(true)
    expect(new GraphEngine(graph(['A', 'B'], [['A', 'B', { directed: true }], ['B', 'A', { directed: true }]])).isMultigraph()).toBe(false)
    expect(new GraphEngine(graph(['A', 'B'], [['A', 'B']])).isMultigraph()).toBe(false)
  })

  it('detects digraphs from any directed edge', () => {
    expect(new GraphEngine(graph(['A', 'B'], [['A', 'B']])).isDigraph()).toBe(false)
    expect(new GraphEngine(graph(['A', 'B', 'C'], [['A', 'B'], ['B', 'C', { directed: true }]])).isDigraph()).toBe(true)
  })

  it('evaluates connectivity, ignoring direction for weak connectivity', () => {
    expect(new GraphEngine(graph(['A', 'B', 'C'], [['A', 'B'], ['B', 'C']])).isConnected()).toBe(true)
    expect(new GraphEngine(graph(['A', 'B', 'C'], [['A', 'B']])).isConnected()).toBe(false)
    expect(new GraphEngine(graph(['A', 'B', 'C'], [['A', 'B']])).components()).toBe(2)
    const arcs = new GraphEngine(graph(['A', 'B'], [['A', 'B', { directed: true }]]))
    expect(arcs.isConnected()).toBe(true)
    expect(arcs.isStronglyConnected()).toBe(false)
    expect(new GraphEngine(graph(['A', 'B'], [['A', 'B', { directed: true }], ['B', 'A', { directed: true }]])).isStronglyConnected()).toBe(true)
    expect(new GraphEngine(graph([], [])).isConnected()).toBe(false)
  })

  it('identifies complete graphs Kn only when simple and undirected', () => {
    expect(new GraphEngine(complete(['A', 'B', 'C', 'D'])).completeOrder()).toBe(4)
    const missing = complete(['A', 'B', 'C', 'D'])
    missing.edges.pop()
    expect(new GraphEngine(missing).completeOrder()).toBeNull()
    const looped = complete(['A', 'B', 'C'])
    looped.edges.push({ id: 'loop', source: 'A', target: 'A', directed: false })
    expect(new GraphEngine(looped).completeOrder()).toBeNull()
  })

  it('recognizes hypercubes Qn and labels their vertices with bit strings', () => {
    const q3 = new GraphEngine(generateHypercube(3)).hypercube()
    expect(q3?.dimension).toBe(3)
    expect(new Set(q3?.labels.values())).toEqual(new Set(['000', '001', '010', '011', '100', '101', '110', '111']))
    expect(new GraphEngine(graph(['A', 'B', 'C', 'D'], [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A']])).hypercube()?.dimension).toBe(2)
    // Wagner graph: 8 vertices, 3-regular and connected, but not a cube.
    const wagner = graph(['0', '1', '2', '3', '4', '5', '6', '7'], [0, 1, 2, 3, 4, 5, 6, 7].flatMap(i => [[`${i}`, `${(i + 1) % 8}`] as EdgeSpec, ...(i < 4 ? [[`${i}`, `${i + 4}`] as EdgeSpec] : [])]))
    expect(new GraphEngine(wagner).hypercube()).toBeNull()
    expect(new GraphEngine(graph(['A', 'B', 'C', 'D', 'E', 'F'], [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'E'], ['E', 'F'], ['F', 'A']])).hypercube()).toBeNull()
  })
})

describe('GraphEngine degrees and handshake theorem', () => {
  it('counts an undirected loop twice and validates Σ g(v) = 2|S|', () => {
    const engine = new GraphEngine(graph(['A', 'B', 'C'], [['A', 'B'], ['A', 'A']]))
    expect(engine.degrees().map(d => d.degree)).toEqual([3, 1, 0])
    expect(engine.handshake()).toEqual({ sum: 4, edges: 2, holds: true })
    expect(engine.isolated()).toEqual(['C'])
  })

  it('separates in and out degree, counting a directed loop as one entry and one exit', () => {
    const engine = new GraphEngine(graph(['A', 'B', 'C', 'D'], [['A', 'B', { directed: true }], ['B', 'C', { directed: true }], ['C', 'C', { directed: true }]]))
    expect(engine.degrees().map(({ inDegree, outDegree }) => [inDegree, outDegree])).toEqual([[0, 1], [1, 1], [2, 1], [0, 0]])
    expect(engine.handshake().holds).toBe(true)
    expect(engine.sources()).toEqual(['A'])
    expect(engine.sinks()).toEqual([])
    expect(engine.isolated()).toEqual(['D'])
    const sink = new GraphEngine(graph(['A', 'B'], [['A', 'B', { directed: true }]]))
    expect(sink.sinks()).toEqual(['B'])
  })

  it('does not report sources or sinks through undirected edges', () => {
    const engine = new GraphEngine(graph(['A', 'B', 'C'], [['A', 'B'], ['B', 'C', { directed: true }]]))
    expect(engine.sources()).toEqual([])
    expect(engine.sinks()).toEqual(['C'])
  })
})

describe('GraphEngine planarity and Euler formula', () => {
  const square = { A: [0, 0], B: [100, 0], C: [100, 100], D: [0, 100] } as Record<string, [number, number]>

  it('counts crossings in the drawing and applies N − S + R = 2 only to connected plane drawings', () => {
    const cycle = new GraphEngine(graph(['A', 'B', 'C', 'D'], [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A']], square))
    expect(cycle.crossings()).toBe(0)
    expect(cycle.planarity().verdict).toBe('plane')
    expect(cycle.euler()).toEqual({ N: 4, S: 4, R: 2 })
    const k4 = new GraphEngine(graph(['A', 'B', 'C', 'D'], [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], ['A', 'C'], ['B', 'D']], square))
    expect(k4.crossings()).toBe(1)
    expect(k4.planarity().verdict).toBe('planar-redrawable')
    expect(k4.euler()).toBeNull()
    expect(new GraphEngine(graph(['A', 'B', 'C'], [['A', 'B']])).euler()).toBeNull()
  })

  it('draws parallel edges without counting them as crossings and counts loops as regions', () => {
    const engine = new GraphEngine(graph(['A', 'B'], [['A', 'B'], ['A', 'B'], ['A', 'A']]))
    expect(engine.crossings()).toBe(0)
    expect(engine.euler()).toEqual({ N: 2, S: 3, R: 3 })
  })

  it('generates plane drawings of Q2 and Q3', () => {
    expect(new GraphEngine(generateHypercube(2)).euler()).toEqual({ N: 4, S: 4, R: 2 })
    expect(new GraphEngine(generateHypercube(3)).euler()).toEqual({ N: 8, S: 12, R: 6 })
  })

  it('proves non-planarity of K5 and K3,3 with edge bounds', () => {
    expect(new GraphEngine(complete(['A', 'B', 'C', 'D', 'E'])).planarity().verdict).toBe('nonplanar')
    const k33 = graph(['A', 'B', 'C', 'X', 'Y', 'Z'], ['A', 'B', 'C'].flatMap(a => ['X', 'Y', 'Z'].map(b => [a, b] as EdgeSpec)))
    expect(new GraphEngine(k33).planarity().verdict).toBe('nonplanar')
  })
})

describe('GraphEngine paths', () => {
  it('computes d(u,v) with BFS respecting direction', () => {
    const engine = new GraphEngine(graph(['A', 'B', 'C', 'D'], [['A', 'B'], ['B', 'C'], ['C', 'D'], ['A', 'D', { directed: true }]]))
    expect(engine.shortestPath('A', 'D', false)).toMatchObject({ length: 1, nodes: ['A', 'D'], edges: ['e3'] })
    expect(engine.shortestPath('D', 'A', false)).toMatchObject({ length: 3, nodes: ['D', 'C', 'B', 'A'] })
    expect(new GraphEngine(graph(['A', 'B'], [['A', 'B', { directed: true }]])).shortestPath('B', 'A', false)).toBeNull()
    expect(engine.shortestPath('A', 'A', false)).toMatchObject({ length: 0, nodes: ['A'], edges: [] })
  })

  it('finds the minimum-weight path with Dijkstra, treating unweighted edges as weight 1', () => {
    const engine = new GraphEngine(graph(['A', 'B', 'C'], [['A', 'C', { weight: 10 }], ['A', 'B', { weight: 1 }], ['B', 'C']]))
    expect(engine.isWeighted()).toBe(true)
    expect(engine.shortestPath('A', 'C', true)).toMatchObject({ weight: 2, length: 2, nodes: ['A', 'B', 'C'] })
    expect(engine.shortestPath('A', 'C', false)).toMatchObject({ length: 1, nodes: ['A', 'C'] })
  })

  it('rejects negative weights', () => {
    expect(() => new GraphEngine(graph(['A', 'B'], [['A', 'B', { weight: -1 }]]))).toThrow(/no negativo/)
  })
})

describe('GraphEngine study characteristics', () => {
  const path4 = graph(['A', 'B', 'C', 'D'], [['A', 'B'], ['B', 'C'], ['C', 'D']])
  const square = graph(['A', 'B', 'C', 'D'], [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A']])
  const triangle = graph(['A', 'B', 'C'], [['A', 'B'], ['B', 'C'], ['C', 'A']])

  it('recognizes trees as connected graphs without cycles (S = N − 1)', () => {
    expect(new GraphEngine(path4).isTree()).toBe(true)
    expect(new GraphEngine(path4).hasCycle()).toBe(false)
    expect(new GraphEngine(square).isTree()).toBe(false)
    expect(new GraphEngine(square).hasCycle()).toBe(true)
    expect(new GraphEngine(graph(['A', 'B', 'C', 'D'], [['A', 'B'], ['C', 'D']])).isTree()).toBe(false)
    expect(new GraphEngine(graph(['A', 'B'], [['A', 'B'], ['A', 'B']])).hasCycle()).toBe(true)
  })

  it('splits bipartite graphs into two sides and rejects odd cycles', () => {
    const sides = new GraphEngine(square).bipartition()
    expect(sides).not.toBeNull()
    expect([...sides!.left].sort()).toEqual(['A', 'C'])
    expect(new GraphEngine(triangle).bipartition()).toBeNull()
  })

  it('reports the common degree of regular graphs', () => {
    expect(new GraphEngine(square).regularDegree()).toBe(2)
    expect(new GraphEngine(path4).regularDegree()).toBeNull()
  })

  it('finds Euler circuits and trails that use every edge exactly once', () => {
    const circuit = new GraphEngine(square).eulerTrail()
    expect(circuit?.kind).toBe('circuit')
    expect(circuit?.edges).toHaveLength(4)
    expect(new Set(circuit?.edges).size).toBe(4)
    expect(circuit?.nodes[0]).toBe(circuit?.nodes.at(-1))
    const trail = new GraphEngine(path4).eulerTrail()
    expect(trail?.kind).toBe('trail')
    expect([trail?.nodes[0], trail?.nodes.at(-1)].sort()).toEqual(['A', 'D'])
    const star = graph(['A', 'B', 'C', 'D'], [['A', 'B'], ['A', 'C'], ['A', 'D']])
    expect(new GraphEngine(star).eulerTrail()).toBeNull()
    expect(new GraphEngine(graph(['A', 'B', 'C', 'D'], [['A', 'B'], ['C', 'D']])).eulerTrail()).toBeNull()
  })
})

describe('random graph generator', () => {
  const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }

  it('generates each requested family with its defining characteristic', () => {
    for (let seed = 1; seed <= 20; seed++) {
      for (const n of [4, 6, 8]) {
        const tree = new GraphEngine(generateRandomGraph('tree', n, seeded(seed)).data)
        expect(tree.order).toBe(n)
        expect(tree.isTree()).toBe(true)
        expect(tree.crossings()).toBe(0)
        const cycle = new GraphEngine(generateRandomGraph('cycle', n, seeded(seed)).data)
        expect(cycle.regularDegree()).toBe(2)
        expect(cycle.isConnected()).toBe(true)
        expect(new GraphEngine(generateRandomGraph('complete', n, seeded(seed)).data).completeOrder()).toBe(n)
        const general = new GraphEngine(generateRandomGraph('general', n, seeded(seed)).data)
        expect(general.isMultigraph() || general.isDigraph()).toBe(false)
        expect(general.size).toBeGreaterThan(0)
      }
    }
  })

  it('picks a random family for the surprise option and labels nodes with letters', () => {
    const families = new Set(Array.from({ length: 40 }, (_, seed) => generateRandomGraph('surprise', 5, seeded((seed + 1) * 104729)).type))
    expect(families.size).toBeGreaterThan(2)
    expect([...families].every(type => graphTypes.some(option => option.id === type))).toBe(true)
    expect(generateRandomGraph('tree', 5, seeded(3)).data.nodes.map(node => node.label)).toEqual(['A', 'B', 'C', 'D', 'E'])
  })
})
