import { useMemo } from 'react'
import { Network, Shuffle } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { SectionHeading } from '../../components/shared'
import { GraphEngine } from '../../lib/graph/GraphEngine'
import { generateRandomGraph, graphTypes, type GraphFamily, type GraphType } from '../../lib/graph/generators'
import { edgeShapes } from '../../lib/graph/geometry'
import type { GraphData } from '../../types'
import { GraphCanvas } from './GraphCanvas'
import { GraphPaths, GraphResults } from './GraphResults'

export interface GraphState {
  data: GraphData
  type: GraphType
  size: number
  generated: GraphFamily | null
  /** Up to two tapped nodes: the endpoints u and v of the marked shortest path. */
  selected: string[]
  showEuler: boolean
}
export function initialGraphState(): GraphState {
  return { data: { nodes: [], edges: [] }, type: 'surprise', size: 6, generated: null, selected: [], showEuler: false }
}

export function Graphs({ state, setState }: { state: GraphState; setState: (state: GraphState) => void }) {
  const { data, selected } = state
  const shapes = useMemo(() => edgeShapes(data), [data])
  const engine = useMemo(() => new GraphEngine(data), [data])
  const path = selected.length === 2 ? engine.shortestPath(selected[0], selected[1], false) : null
  const euler = useMemo(() => engine.eulerTrail(), [engine])

  function generate() {
    const { type, data } = generateRandomGraph(state.type, state.size)
    setState({ ...state, data, generated: type, selected: [], showEuler: false })
  }
  function tapNode(id: string) {
    setState({ ...state, showEuler: false, selected: selected.length === 1 && selected[0] !== id ? [selected[0], id] : [id] })
  }

  return <div className="module-content">
    <div className="intro-line"><span className="eyebrow">GENERÁ · OBSERVÁ · ESTUDIÁ</span><span className="live-label"><span />Análisis automático</span></div>
    <div className="page-title"><div><h1>Puntos que se conectan<span>.</span></h1><p>Generá un grafo al azar y descubrí qué tipo de grafo es y cómo recorrerlo.</p></div><span className="topic-tag"><Network size={15} />Teoría de grafos</span></div>

    <div className="graph-layout">
      <Card><CardContent>
        <SectionHeading plain index="01" title="Tu grafo" description="Podés arrastrar los nodos para reacomodar el dibujo." />
        <div className="graph-generator">
          <label className="input-label">Tipo de grafo<select value={state.type} onChange={e => setState({ ...state, type: e.target.value as GraphType })}>{graphTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
          <label className="input-label">Cantidad de nodos<select value={state.size} onChange={e => setState({ ...state, size: Number(e.target.value) })}>{[4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
          <Button onClick={generate}><Shuffle />Generar grafo</Button>
        </div>
        <div className="graph-canvas-wrap">
          <GraphCanvas
            data={data}
            shapes={shapes}
            highlights={{
              selected,
              pathNodes: new Set(path?.nodes),
              pathEdges: new Set(path?.edges),
              eulerOrder: new Map(state.showEuler && euler ? euler.edges.map((id, i) => [id, i + 1]) : []),
            }}
            onNode={tapNode}
            onMove={(id, point) => setState({ ...state, data: { ...data, nodes: data.nodes.map(node => node.id === id ? { ...node, ...point } : node) } })}
          />
          {!data.nodes.length && <p className="graph-empty">Elegí un tipo y tocá “Generar grafo” para empezar.</p>}
        </div>
        {data.nodes.length > 0 && <GraphPaths
          data={data}
          selected={selected}
          path={path}
          euler={euler}
          showEuler={state.showEuler}
          onToggleEuler={() => setState({ ...state, showEuler: !state.showEuler, selected: [] })}
          onClearPath={() => setState({ ...state, selected: [] })}
        />}
      </CardContent></Card>

      {data.nodes.length > 0 && <GraphResults data={data} engine={engine} generated={state.generated} />}
    </div>
  </div>
}
