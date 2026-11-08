// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import App from '../../App'

vi.mock('recharts', () => {
  const Chart = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  return { ResponsiveContainer: Chart, BarChart: Chart, Bar: () => null, CartesianGrid: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null }
})
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new Event('close')) }
})
afterEach(cleanup)

async function generate(type: string, nodes: string) {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: /^Grafos/ }))
  await user.selectOptions(screen.getByLabelText('Tipo de grafo'), type)
  await user.selectOptions(screen.getByLabelText('Cantidad de nodos'), nodes)
  await user.click(screen.getByRole('button', { name: 'Generar grafo' }))
  return user
}
const feature = (id: string) => screen.getByTestId(`feature-${id}`)

describe('study-oriented graph section', () => {
  it('starts empty with only the generator controls', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /^Grafos/ }))
    expect(screen.queryByRole('button', { name: /^Nodo / })).not.toBeInTheDocument()
    expect(screen.queryByTestId('feature-tree')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Agregar nodo|Subgrafo|Ruta/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Generar grafo' })).toBeInTheDocument()
    expect(within(screen.getByLabelText('Tipo de grafo')).getAllByRole('option').map(option => option.textContent)).toEqual(['Sorpresa (aleatorio)', 'Árbol', 'Ciclo', 'Completo', 'Con ciclos'])
  })

  it('generates a random tree and lists its characteristics', async () => {
    await generate('tree', '5')
    expect(screen.getAllByRole('button', { name: /^Nodo / })).toHaveLength(5)
    expect(feature('tree')).toHaveAttribute('data-active', 'true')
    expect(feature('connected')).toHaveAttribute('data-active', 'true')
    expect(feature('cycles')).toHaveAttribute('data-active', 'false')
    for (const removed of ['bipartite', 'regular', 'plane', 'euler']) expect(screen.queryByTestId(`feature-${removed}`)).not.toBeInTheDocument()
    expect(feature('tree')).toHaveTextContent('S = N − 1')
    expect(screen.queryByText('Componentes')).not.toBeInTheDocument()
    expect(screen.getAllByText(/^g\([A-E]\) = \d$/)).toHaveLength(5)
    expect(screen.queryByText(/Σ g\(v\)/)).not.toBeInTheDocument()
  })

  it('marks the shortest path by touching two nodes and the Euler circuit of a cycle', async () => {
    const user = await generate('cycle', '4')
    expect(feature('tree')).toHaveAttribute('data-active', 'false')
    expect(feature('cycles')).toHaveAttribute('data-active', 'true')
    await user.click(screen.getByRole('button', { name: 'Nodo A' }))
    await user.click(screen.getByRole('button', { name: 'Nodo C' }))
    expect(screen.getByTestId('shortest-path')).toHaveTextContent('d(A, C) = 2')
    expect(screen.getByRole('button', { name: 'Nodo C' })).toHaveClass('on-path')
    await user.click(screen.getByRole('button', { name: 'Marcar camino' }))
    expect(screen.getByTestId('euler-trail')).toHaveTextContent('A → B → C → D → A')
    expect(screen.queryByTestId('shortest-path')).not.toBeInTheDocument()
  })

  it('recognizes complete graphs without an Euler trail and keeps the graph while navigating', async () => {
    const user = await generate('complete', '4')
    expect(feature('complete')).toHaveTextContent('K4')
    expect(feature('complete')).toHaveAttribute('data-active', 'true')
    expect(screen.queryByRole('button', { name: 'Marcar camino' })).not.toBeInTheDocument()
    await user.click(screen.getByText('Ver matriz de adyacencia'))
    expect(within(screen.getByRole('table', { name: 'Matriz de adyacencia' })).getAllByRole('row')[1]).toHaveTextContent(/^A0111$/)
    await user.click(screen.getByRole('button', { name: 'Profesores' }))
    await user.click(screen.getByRole('button', { name: /^Grafos/ }))
    expect(screen.getAllByRole('button', { name: /^Nodo / })).toHaveLength(4)
    expect(screen.getByLabelText('Tipo de grafo')).toHaveValue('complete')
  })
})
