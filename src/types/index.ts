export interface FrequencyRow {
  value: number
  fi: number
  Fi: number
  hi: number
  Hi: number
  percent: number
}

export interface ElementItem { id: string; label: string }
export interface Outcome { id: string; elements: ElementItem[]; label: string }
export interface SelectionConfig { ordered: boolean; repetition: boolean; k: number }
export interface ProbabilityEvent { id: string; name: string; outcomes: string[]; statement?: string }

export interface GraphNode { id: string; label: string; x: number; y: number }
/** An edge; `weight` is undefined for unweighted edges. A loop has source === target. */
export interface GraphEdge { id: string; source: string; target: string; directed: boolean; weight?: number }
export interface GraphData { nodes: GraphNode[]; edges: GraphEdge[] }
