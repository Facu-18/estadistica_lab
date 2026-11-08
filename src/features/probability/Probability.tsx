import { useMemo } from 'react'
import { Check, Dices, Plus, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { EmptyState, ErrorNotice, Procedure, SectionHeading } from '../../components/shared'
import { cardinality, classifyEvent, classicProbability, fraction, generateSpace, intersection } from '../../lib/math/probability'
import { formatNumber } from '../../lib/format'
import type { Outcome, ProbabilityEvent, SelectionConfig } from '../../types'
import { TeacherExplanation } from '../../components/TeacherExplanation'
export interface ExperimentState {
  text: string
  config: Pick<SelectionConfig, 'ordered' | 'k'>
  events: ProbabilityEvent[]
  selectedA: string
  selectedB: string
}
export function initialExperiment(): ExperimentState {
  return { text: '', config: { k: 2, ordered: false }, events: [], selectedA: '', selectedB: '' }
}

const explanations: Record<string, string> = {
  Imposible: 'No contiene resultados: no puede ocurrir.',
  Seguro: 'Contiene todos los resultados posibles.',
  Simple: 'Contiene exactamente un resultado.',
  Compuesto: 'Contiene dos o más resultados.',
}

export function Probability({ state, setState }: { state: ExperimentState; setState: (state: ExperimentState) => void }) {
  const { text, config, events } = state
  // Repetition is not an app option; explicitly construct the mathematical configuration.
  const selection = { k: config.k, ordered: config.ordered, repetition: false }
  const calculated = useMemo(() => {
    try {
      const labels = text.split(/[,\n]+/).map(s => s.trim()).filter(Boolean)
      if (labels.length > 40) throw new Error('El máximo es de 40 elementos. Cada elemento debe tener un nombre de hasta 40 caracteres.')
      if (labels.some(label => label.length > 40)) throw new Error('Cada nombre puede tener hasta 40 caracteres.')
      const elements = labels.map((label, i) => ({ id: `element-${i}`, label: labels.filter(other => other === label).length > 1 ? `${label} [${i + 1}]` : label }))
      return { ...generateSpace(elements, { k: config.k, ordered: config.ordered, repetition: false }), n: elements.length, error: '' }
    } catch (e) { return { count: 0n, outcomes: [] as Outcome[], limited: false, n: 0, error: (e as Error).message } }
  }, [text, config])
  const { outcomes, count, limited, n, error } = calculated
  const canBuild = outcomes.length > 0 && !limited && !error
  const eventA = events.find(e => e.id === state.selectedA) ?? events[0]
  const eventB = events.find(e => e.id === state.selectedB && e.id !== eventA?.id) ?? events.find(e => e.id !== eventA?.id)
  const shared = eventA && eventB ? intersection(eventA.outcomes, eventB.outcomes) : []
  const outcomeLabels = new Map(outcomes.map(o => [o.id, o.label]))
  const showSet = (ids: string[]) => ids.length ? `{ ${ids.map(id => outcomeLabels.get(id)).join('; ')} }` : '∅'

  function changeExperiment(change: { text?: string; config?: ExperimentState['config'] }) {
    setState({ ...state, ...change, events: [], selectedA: '', selectedB: '' })
  }
  function changeConfig(change: Partial<ExperimentState['config']>) { changeExperiment({ config: { ...config, ...change } }) }
  function updateEvent(id: string, outcomes: string[]) {
    setState({ ...state, events: events.map(event => event.id === id ? { ...event, outcomes } : event) })
  }
  function updateStatement(id: string, statement: string) {
    setState({ ...state, events: events.map(event => event.id === id ? { ...event, statement } : event) })
  }
  function addEvent() {
    const name = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find(name => !events.some(e => e.name === name))!
    setState({ ...state, events: [...events, { id: crypto.randomUUID(), name, outcomes: [], statement: '' }] })
  }

  return <div className="module-content">
    <div className="intro-line"><span className="eyebrow">ENTENDÉ EL AZAR</span><span className="live-label"><span />Exploración interactiva</span></div>
    <div className="page-title"><div><h1>Lo posible, en perspectiva<span>.</span></h1><p>Construí un experimento, explorá sus resultados y descubrí sus probabilidades.</p></div><span className="topic-tag"><Dices size={15} />Probabilidad clásica</span></div>

    <Card><CardContent>
      <SectionHeading plain index="01" title="Definí tu experimento" description="¿Qué elementos elegís y cómo los seleccionás?" action={<Button variant="ghost" size="sm" onClick={() => changeExperiment({ text: '' })}><Trash2 />Limpiar</Button>} />
      <div className="experiment-grid"><div><label className="input-label" htmlFor="elements-input">Elementos del espacio</label><textarea id="elements-input" value={text} onChange={e => changeExperiment({ text: e.target.value })} placeholder="Ingresá los nombres de tus elementos" className="elements-input" /><p className="helper">Separá nombres con comas o saltos de línea. Los nombres repetidos representan elementos distintos.</p></div><div className="experiment-options"><label className="input-label" htmlFor="selection-size">Cantidad a seleccionar (k)<input id="selection-size" type="number" min="1" max="12" step="1" value={Number.isNaN(config.k) ? '' : config.k} onChange={e => changeConfig({ k: Number(e.target.value) })} /></label><label className="checkbox-label"><input type="checkbox" aria-label="El orden importa" checked={config.ordered} onChange={e => changeConfig({ ordered: e.target.checked })} /><span>El orden importa</span></label><p className="helper">Siempre sin repetición: cada elemento se elige como máximo una vez.</p></div></div>
      <p className="helper mt-3">Al cambiar el experimento se reinician los eventos y sus enunciados.</p>
      {error && <ErrorNotice>{error}</ErrorNotice>}
    </CardContent></Card>

    <Card><CardContent>
      <SectionHeading plain index="02" title="Espacio muestral" description="Ω reúne todos los resultados posibles de tu experimento." action={<span className="cardinality-badge" data-testid="space-count">|Ω| = {count.toLocaleString('es-AR')}</span>} />
      {limited ? <div className="notice warning mt-5"><span>El espacio tiene {count.toLocaleString('es-AR')} resultados (cardinalidad exacta). Para mantener la aplicación ágil, solo enumeramos espacios de hasta 400 resultados: reducí los elementos o k para construir eventos.</span></div> : outcomes.length ? <div className="sample-space" aria-label="Resultados del espacio muestral"><span className="omega">Ω = {'{'}</span><div className="outcome-list">{outcomes.map(o => <span className="outcome-chip" key={o.id}>{o.label}</span>)}</div><span className="omega">{'}'}</span></div> : <EmptyState plain title="Un experimento por descubrir">{error ? 'Corregí la configuración para generar resultados.' : n && config.k > n ? 'No se pueden elegir más elementos de los disponibles sin repetición.' : 'Ingresá elementos para generar el espacio muestral.'}</EmptyState>}
      {!error && n > 0 && <Procedure title="Procedimiento: cardinalidad del espacio"><p>{config.ordered ? 'El orden importa: cada orden diferente cuenta como un resultado.' : 'El orden no importa: cada grupo se cuenta una sola vez.'} Cada elemento puede elegirse una sola vez.</p><code>{config.ordered ? '|Ω| = n! / (n − k)!' : '|Ω| = C(n, k)'} → n = {n}, k = {config.k} → {cardinality(n, selection).toString()}</code></Procedure>}
    </CardContent></Card>

    <Card><CardContent>
      <SectionHeading plain index="03" title="Constructor de eventos" description="Un evento es un conjunto de resultados del espacio muestral." action={<Button size="sm" onClick={addEvent} disabled={!canBuild || events.length >= 8}><Plus />Crear evento</Button>} />
      <div className="laplace-consent"><p className="helper">Se asume que todos los resultados son igualmente probables (regla de Laplace).</p><span className="formula-inline">P(A) = |A| / |Ω|</span></div>
      {!events.length && <div className="events-empty"><p>{canBuild ? 'Creá un evento y seleccioná sus resultados favorables.' : 'Primero necesitás un espacio muestral no vacío y de hasta 400 resultados.'}</p></div>}
      <div className="events-grid">{events.map(event => <div className="event-card" key={event.id} data-testid={`event-${event.name}`}>
        <div className="event-header"><span className="event-letter">{event.name}</span><div><h3>Evento {event.name}</h3><span>{event.outcomes.length} de {outcomes.length} resultados</span></div><Button variant="ghost" size="icon" aria-label={`Eliminar evento ${event.name}`} onClick={() => setState({ ...state, events: events.filter(e => e.id !== event.id) })}><Trash2 /></Button></div>
        <div className="event-statement"><label className="input-label" htmlFor={`event-statement-${event.id}`}>Enunciado del evento {event.name}</label><textarea id={`event-statement-${event.id}`} value={event.statement ?? ''} onChange={e => updateStatement(event.id, e.target.value)} placeholder="Escribí el enunciado de este evento" /></div>
        <div className="event-actions"><span>Seleccioná los casos favorables</span><button onClick={() => updateEvent(event.id, outcomes.map(o => o.id))}>Seleccionar todos</button><button onClick={() => updateEvent(event.id, [])}>Vaciar</button></div>
        <div className="event-outcomes">{outcomes.map(outcome => <button key={outcome.id} aria-pressed={event.outcomes.includes(outcome.id)} onClick={() => updateEvent(event.id, event.outcomes.includes(outcome.id) ? event.outcomes.filter(id => id !== outcome.id) : [...event.outcomes, outcome.id])} className={`outcome-chip ${event.outcomes.includes(outcome.id) ? 'chosen' : ''}`}>{event.outcomes.includes(outcome.id) && <Check size={12} />}{outcome.label}</button>)}</div>
        <p className="event-set">{event.name} = {showSet(event.outcomes)}</p>
        <div className="classification">{classifyEvent(event.outcomes.length, outcomes.length).map(c => <span key={c}>{c}</span>)}</div>        <div className="event-probability" data-testid={`event-probability-${event.name}`}><span>P({event.name})</span><strong>{formatNumber(classicProbability(event.outcomes.length, outcomes.length, true) * 100)}%</strong><span>{fraction(event.outcomes.length, outcomes.length)} · {formatNumber(event.outcomes.length / outcomes.length, 4)}</span></div>
        <Procedure title={`Ver procedimiento de ${event.name}`} teacher="facundo">{event.statement && <p className="event-statement-read"><strong>Enunciado:</strong> {event.statement}</p>}<p>{classifyEvent(event.outcomes.length, outcomes.length).map(c => `${c}: ${explanations[c]}`).join(' ')}</p><p>Casos favorables: <strong>{event.outcomes.length}</strong>. Casos posibles: <strong>{outcomes.length}</strong>.</p><code>P({event.name}) = {event.outcomes.length}/{outcomes.length} = {fraction(event.outcomes.length, outcomes.length)} = {formatNumber(event.outcomes.length / outcomes.length, 4)} = {formatNumber(event.outcomes.length / outcomes.length * 100)}%</code></Procedure>
      </div>)}</div>
      <p className="helper mt-4">Hasta 8 eventos simultáneos. Las clasificaciones pueden superponerse: en un espacio de un solo resultado, el evento seguro también es simple.</p>
    </CardContent></Card>

    <Card><CardContent>
      <SectionHeading plain index="04" title="¿Pueden ocurrir a la vez?" description="Compará dos eventos y explorá su intersección." />
      {events.length >= 2 && eventA && eventB ? <>
        <div className="intersection-selectors"><label>Primer evento<select value={eventA.id} onChange={e => setState({ ...state, selectedA: e.target.value, selectedB: e.target.value === eventB.id ? eventA.id : eventB.id })}>{events.map(event => <option key={event.id} value={event.id}>{event.name}</option>)}</select></label><span>∩</span><label>Segundo evento<select value={eventB.id} onChange={e => setState({ ...state, selectedA: eventA.id, selectedB: e.target.value })}>{events.filter(event => event.id !== eventA.id).map(event => <option key={event.id} value={event.id}>{event.name}</option>)}</select></label></div>
        <div className="set-diagram" aria-label="Representación de los conjuntos y su intersección"><div className="set-left"><h4>Solo {eventA.name}</h4><p>{showSet(eventA.outcomes.filter(id => !shared.includes(id)))}</p></div><div className="set-shared"><h4>{eventA.name} ∩ {eventB.name}</h4><p>{showSet(shared)}</p><span>{shared.length} compartidos</span></div><div className="set-right"><h4>Solo {eventB.name}</h4><p>{showSet(eventB.outcomes.filter(id => !shared.includes(id)))}</p></div></div>
        <div className={`notice ${shared.length ? 'info' : 'success'}`} data-testid="intersection-result" data-exclusive={shared.length === 0}><strong>{eventA.name} ∩ {eventB.name} = {showSet(shared)}</strong><TeacherExplanation title="Intersección de eventos" teacher="franco"><p>{shared.length === 0 ? 'Los eventos son mutuamente excluyentes porque no comparten resultados.' : `Los eventos no son mutuamente excluyentes porque comparten ${shared.length === 1 ? 'el resultado' : 'los resultados'} ${shared.map(id => outcomeLabels.get(id)).join('; ')}.`}<strong className="block mt-2">{eventA.name} ∩ {eventB.name} = {showSet(shared)}</strong></p></TeacherExplanation></div>
      </> : <div className="events-empty"><p>Creá al menos dos eventos para compararlos. Un evento vacío también es válido.</p></div>}
    </CardContent></Card>
  </div>
}
