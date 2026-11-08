import { useId, useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../../lib/graph/generators'
import { NODE_RADIUS, type EdgeShape, type Point } from '../../lib/graph/geometry'
import type { GraphData } from '../../types'

export interface CanvasHighlights {
  selected: string[]
  pathNodes: Set<string>
  pathEdges: Set<string>
  /** Edge id → its position(s) in the Euler trail, shown as numbers on the edge. */
  eulerOrder: Map<string, number>
}

interface GraphCanvasProps {
  data: GraphData
  shapes: Map<string, EdgeShape>
  highlights: CanvasHighlights
  onNode: (id: string) => void
  onMove: (id: string, point: Point) => void
}

const clamp = (value: number, max: number) => Math.min(max - NODE_RADIUS - 4, Math.max(NODE_RADIUS + 4, value))

/** Converts a pointer position to canvas coordinates; the SVG keeps its aspect ratio, so scaling is uniform. */
function toCanvasPoint(svg: SVGSVGElement, clientX: number, clientY: number): Point {
  const rect = svg.getBoundingClientRect()
  if (!rect.width || !rect.height) return { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }
  return { x: clamp((clientX - rect.left) * CANVAS_WIDTH / rect.width, CANVAS_WIDTH), y: clamp((clientY - rect.top) * CANVAS_HEIGHT / rect.height, CANVAS_HEIGHT) }
}

/** Presentational SVG: renders the graph, reports node taps and lets nodes be dragged to untangle the drawing. */
export function GraphCanvas({ data, shapes, highlights: h, onNode, onMove }: GraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<{ id: string; origin: Point; moved: boolean } | null>(null)
  const prefix = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const point = (event: PointerEvent) => toCanvasPoint(svgRef.current!, event.clientX, event.clientY)
  const activate = (id: string) => (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onNode(id) }
  }

  return <svg
    ref={svgRef}
    className="graph-canvas"
    viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
    role="group"
    aria-label="Grafo generado"
    onPointerMove={event => {
      const current = drag.current
      if (!current) return
      const next = point(event)
      if (!current.moved && Math.hypot(next.x - current.origin.x, next.y - current.origin.y) > 4) current.moved = true
      if (current.moved) onMove(current.id, next)
    }}
    onPointerUp={() => {
      const current = drag.current
      drag.current = null
      if (current && !current.moved) onNode(current.id)
    }}
    onPointerLeave={() => { drag.current = null }}
  >
    <defs><pattern id={`${prefix}-dots`} width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" className="graph-dot" /></pattern></defs>
    <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill={`url(#${prefix}-dots)`} />
    {data.edges.map(edge => {
      const shape = shapes.get(edge.id)
      if (!shape) return null
      const order = h.eulerOrder.get(edge.id)
      return <g key={edge.id}>
        <path d={shape.d} className={`graph-edge ${h.pathEdges.has(edge.id) ? 'on-path' : order ? 'on-euler' : ''}`} />
        {order && <text x={shape.label.x} y={shape.label.y} className="graph-weight">{order}</text>}
      </g>
    })}
    {data.nodes.map(node => <g
      key={node.id}
      className={`graph-node ${h.selected.includes(node.id) ? 'selected' : ''} ${h.pathNodes.has(node.id) ? 'on-path' : ''}`}
      transform={`translate(${node.x} ${node.y})`}
      role="button"
      tabIndex={0}
      aria-label={`Nodo ${node.label}`}
      onPointerDown={event => { event.stopPropagation(); drag.current = { id: node.id, origin: point(event), moved: false } }}
      onKeyDown={activate(node.id)}
    >
      <circle r={NODE_RADIUS} />
      <text className="graph-node-label">{node.label}</text>
    </g>)}
  </svg>
}
