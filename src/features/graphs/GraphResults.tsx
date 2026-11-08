import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { SectionHeading } from '../../components/shared'
import { graphTypes, type GraphFamily } from '../../lib/graph/generators'
import type { EulerTrail, GraphEngine, PathResult } from '../../lib/graph/GraphEngine'
import type { GraphData } from '../../types'

interface GraphResultsProps {
  data: GraphData
  engine: GraphEngine
  generated: GraphFamily | null
}

function Feature({ id, active, name, children }: { id: string; active: boolean; name: string; children: string }) {
  return <li className="graph-feature" data-testid={`feature-${id}`} data-active={active}>
    <span className="graph-feature-mark" aria-hidden="true">{active ? '✓' : '✗'}</span>
    <div><strong>{name}</strong><p>{children}</p></div>
  </li>
}

/** Presentational study panel: every value comes precomputed from GraphEngine. */
export function GraphResults({ data, engine, generated }: GraphResultsProps) {
  const label = (id: string) => data.nodes.find(node => node.id === id)?.label ?? ''
  const N = engine.order, S = engine.size
  const connected = engine.isConnected()
  const tree = engine.isTree()
  const cycles = engine.hasCycle()
  const complete = engine.completeOrder()
  const cube = engine.hypercube()
  const degrees = engine.degrees()
  const matrix = engine.adjacencyMatrix()

  return <div className="graph-results">
    <Card><CardContent>
      <SectionHeading plain index="02" title="Características" description={generated ? `Generaste un grafo de tipo “${graphTypes.find(t => t.id === generated)?.label}”.` : 'Así es tu grafo.'} />
      <div className="graph-stats"><div><span>Nodos (N)</span><strong>{N}</strong></div><div><span>Aristas (S)</span><strong>{S}</strong></div></div>
      <ul className="graph-features">
        <Feature id="connected" active={connected} name={connected ? 'Conexo' : 'No conexo'}>{connected ? 'Hay un camino entre cualquier par de nodos.' : 'Hay nodos a los que no se puede llegar desde otros.'}</Feature>
        <Feature id="tree" active={tree} name="Árbol">{tree ? `Es conexo y no tiene ciclos: S = N − 1 (${S} = ${N} − 1).` : 'Un árbol es conexo y sin ciclos, con S = N − 1.'}</Feature>
        <Feature id="cycles" active={cycles} name="Tiene ciclos">{cycles ? 'Se puede salir de un nodo y volver a él sin repetir aristas.' : 'No hay ningún recorrido cerrado.'}</Feature>
        <Feature id="complete" active={complete !== null} name={complete !== null ? `Completo K${complete}` : 'Completo'}>{complete !== null ? 'Cada par de nodos está unido por una arista.' : 'No todos los pares de nodos están unidos.'}</Feature>
        {cube && <Feature id="cube" active name={`nCubo Q${cube.dimension}`}>{`Sus nodos se pueden rotular con cadenas de ${cube.dimension} bits que difieren en un solo bit por arista.`}</Feature>}
      </ul>
    </CardContent></Card>

    <Card><CardContent>
      <SectionHeading plain index="03" title="Grados" description="Cada arista suma 1 al grado de sus dos extremos." />
      <div className="graph-degrees">{degrees.map(d => <span key={d.id}>g({label(d.id)}) = {d.degree}</span>)}</div>
      <details className="graph-matrix mt-4"><summary>Ver matriz de adyacencia</summary>
        <div className="table-scroll mt-3"><table aria-label="Matriz de adyacencia"><thead><tr><th scope="col" />{data.nodes.map(node => <th key={node.id} scope="col">{node.label}</th>)}</tr></thead>
          <tbody>{data.nodes.map((node, i) => <tr key={node.id}><th scope="row">{node.label}</th>{matrix[i].map((value, j) => <td key={data.nodes[j].id} className={value ? 'nonzero' : ''}>{value}</td>)}</tr>)}</tbody></table></div>
      </details>
    </CardContent></Card>
  </div>
}

interface GraphPathsProps {
  data: GraphData
  selected: string[]
  path: PathResult | null
  euler: EulerTrail | null
  showEuler: boolean
  onToggleEuler: () => void
  onClearPath: () => void
}

/** Path feedback shown right under the canvas: shortest path between two tapped nodes and the Euler trail. */
export function GraphPaths({ data, selected, path, euler, showEuler, onToggleEuler, onClearPath }: GraphPathsProps) {
  const label = (id: string) => data.nodes.find(node => node.id === id)?.label ?? ''
  const sequence = (ids: string[]) => ids.map(label).join(' → ')
  return <div className="graph-paths">
    {!selected.length && !showEuler && <p className="helper">Tocá dos nodos para marcar el camino más corto entre ellos.</p>}
    {selected.length === 1 && <p className="helper">Elegiste {label(selected[0])}. Tocá otro nodo.</p>}
    {path && <div data-testid="shortest-path"><p className="graph-formula">d({label(selected[0])}, {label(selected[1])}) = {path.length} · {sequence(path.nodes)}</p></div>}
    {selected.length === 2 && !path && <p className="helper" data-testid="shortest-path">No hay camino entre {label(selected[0])} y {label(selected[1])}: están en componentes distintas.</p>}
    {showEuler && euler && <div data-testid="euler-trail"><p className="graph-formula">{sequence(euler.nodes)}</p><p className="helper mt-2">Los números sobre las aristas indican el orden del recorrido.</p></div>}
    <div className="button-row mt-3">
      {euler && <Button variant="secondary" size="sm" onClick={onToggleEuler}>{showEuler ? 'Ocultar camino' : 'Marcar camino'}</Button>}
      {selected.length > 0 && <Button variant="ghost" size="sm" onClick={onClearPath}>Limpiar camino</Button>}
    </div>
  </div>
}
