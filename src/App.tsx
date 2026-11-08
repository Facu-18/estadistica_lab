import { useEffect, useState } from 'react'
import { ArrowUpRight, BarChart3, CheckCheck, ChevronRight, Dices, GraduationCap, Moon, Network, PanelLeft, Sun, Users } from 'lucide-react'
import { Button } from './components/ui/button'
import { Statistics } from './features/statistics/Statistics'
import { Probability, initialExperiment } from './features/probability/Probability'
import { Graphs, initialGraphState } from './features/graphs/Graphs'
import { Teachers } from './features/teachers/Teachers'
import { TeacherExplanation } from './components/TeacherExplanation'

type Section = 'statistics' | 'probability' | 'graphs' | 'teachers'
const navigation = [
  { id: 'statistics' as const, label: 'Estadística descriptiva', description: 'Datos y frecuencias', icon: BarChart3, number: '01' },
  { id: 'probability' as const, label: 'Probabilidad', description: 'El lenguaje del azar', icon: Dices, number: '02' },
  { id: 'graphs' as const, label: 'Grafos', description: 'Vértices y aristas', icon: Network, number: '03' },
  { id: 'teachers' as const, label: 'Profesores', description: 'Facundo y Franco', icon: Users, number: '04' },
]

function initialTheme() {
  try { return localStorage.getItem('statistics-lab-theme') === 'dark' }
  catch { return false }
}

export default function App() {
  const [active, setActive] = useState<Section>('statistics')
  const [text, setText] = useState('')
  const [experiment, setExperiment] = useState(initialExperiment)
  const [graph, setGraph] = useState(initialGraphState)
  const [dark, setDark] = useState(initialTheme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try { localStorage.setItem('statistics-lab-theme', dark ? 'dark' : 'light') } catch { /* Theme still works when storage is unavailable. */ }
  }, [dark])

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Saltar al contenido</a>
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><BarChart3 size={24} strokeWidth={2.5} /></div><div><strong>estadística<span>lab</span></strong><small>EL CONOCIMIENTO EN PRÁCTICA</small></div></div>
      <div className="workspace-label">TU LABORATORIO</div>
      <nav aria-label="Secciones principales">{navigation.map(item => <button key={item.id} aria-label={item.label} aria-current={active === item.id ? 'page' : undefined} className={`nav-item ${active === item.id ? 'active' : ''}`} onClick={() => setActive(item.id)}><item.icon size={21} /><span><strong>{item.label}</strong><small>{item.description}</small></span>{active === item.id && <span className="nav-active-dot" />}</button>)}</nav>
      <div className="sidebar-bottom"><div className="academic-card"><div className="academic-symbol"><GraduationCap size={23} /><span>IEFI 2026</span></div><h3>Aprender haciendo.</h3><p>Estadística y Probabilidad Aplicada</p><div className="academic-divider" /><small>Instituto Técnico Superior<br />Córdoba</small><ArrowUpRight className="academic-arrow" size={17} /></div><div className="sidebar-foot"><span className="small-dot" />100% local. Tus datos son tuyos.</div></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumbs"><PanelLeft size={17} /><span>Laboratorio</span><ChevronRight size={14} /><strong>{navigation.find(n => n.id === active)?.label}</strong></div><div className="topbar-actions"><span className="local-badge"><span />Sin conexión requerida</span><span className="topbar-divider" /><Button variant="ghost" size="icon" aria-label="Cambiar tema" onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />}</Button><QuickGuide /></div></header>
      <main id="main-content" tabIndex={-1}>
        {active === 'statistics' && <Statistics text={text} setText={setText} />}
        {active === 'probability' && <Probability state={experiment} setState={setExperiment} />}
        {active === 'graphs' && <Graphs state={graph} setState={setGraph} />}
        {active === 'teachers' && <Teachers />}
        <footer className="page-footer"><span>Hecho para explorar, pensado para aprender.</span><span><CheckCheck size={14} />IEFI · Estadística y Probabilidad Aplicada</span></footer>
      </main>
    </div>
  </div>
}

function QuickGuide() {
  return <TeacherExplanation title="Guía rápida" teacher="facundo"><ol><li><strong>Estadística:</strong> ingresá tus datos, revisá las medidas y la tabla de frecuencias. Podés agrupar el gráfico en intervalos, alternar frecuencias y exportarlo como PNG.</li><li><strong>Probabilidad:</strong> ingresá tus elementos y la cantidad a seleccionar. Elegí si importa el orden; las selecciones son siempre sin repetición. Podés escribir un enunciado por evento y seleccionar sus resultados favorables manualmente. La probabilidad se calcula con la regla de Laplace, suponiendo resultados igualmente probables.</li><li><strong>Grafos:</strong> generá un grafo al azar (o elegí su tipo) y mirá sus características: conexo, árbol, ciclos y completo. Tocá dos nodos para marcar el camino más corto.</li><li><strong>Profesores:</strong> conocé a Facundo Moriconi y Franco Aguirre, las dos guías visuales del laboratorio.</li></ol><p>Las explicaciones de media, mediana y moda describen cómo las calcula el software. Los datos y enunciados se mantienen al cambiar de sección, pero no se guardan al recargar la página.</p></TeacherExplanation>
}
