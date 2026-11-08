import { useMemo, useRef, useState } from 'react'
import { BarChart3, Hash, ListOrdered, Maximize2, Sigma, Trash2, TrendingUp } from 'lucide-react'
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { EmptyState, ErrorNotice, Metric, SectionHeading } from '../../components/shared'
import { frequencyTable, histogram, mean, median, modes, parseData } from '../../lib/math/statistics'
import { displayValue, formatNumber } from '../../lib/format'
import { ExportButton } from '../charts/ExportButton'
import { TeacherExplanation, TeacherHint } from '../../components/TeacherExplanation'

export function Statistics({ text, setText }: { text: string; setText: (text: string) => void }) {
  const [grouped, setGrouped] = useState(false)
  const [relative, setRelative] = useState(false)
  const [intervals, setIntervals] = useState(5)
  const chartRef = useRef<HTMLDivElement>(null)
  const parsed = useMemo(() => {
    try { return { data: parseData(text), error: '' } }
    catch (e) { return { data: [] as number[], error: (e as Error).message } }
  }, [text])
  const { data, error } = parsed
  const rows = useMemo(() => frequencyTable(data), [data])
  const chartData = useMemo(() => grouped
    ? histogram(data, intervals).map(b => ({ label: `${b.last ? '[' : '['}${displayValue(b.lower)}; ${displayValue(b.upper)}${b.last ? ']' : ')'}`, fi: b.fi, hi: b.hi }))
    : rows.map(r => ({ label: displayValue(r.value), fi: r.fi, hi: r.hi })), [data, rows, grouped, intervals])
  const mode = data.length ? modes(data) : []
  const sumRelative = rows.reduce((sum, r) => sum + r.hi, 0)

  return <div className="module-content">
    <div className="intro-line"><span className="eyebrow">EXPLORÁ · CALCULÁ · COMPRENDÉ</span><span className="live-label"><span />Cálculo en tiempo real</span></div>
    <div className="page-title"><div><h1>De los datos a las ideas<span>.</span></h1><p>Descubrí qué cuenta tu muestra. Cada número tiene una historia.</p></div><span className="topic-tag"><BarChart3 size={15} />Estadística descriptiva</span></div>

    <Card>
      <CardContent>
        <SectionHeading index="01" title="Ingresá tus datos" description="El punto de partida de tu análisis." action={<Button variant="ghost" size="sm" onClick={() => setText('')}><Trash2 />Limpiar</Button>} />
        <label htmlFor="data-input" className="input-label mt-5">Serie de datos</label>
        <div className="data-input-wrap"><textarea id="data-input" className="data-input" value={text} onChange={e => setText(e.target.value)} placeholder="Ingresá tus valores numéricos" spellCheck={false} aria-describedby="data-help" aria-invalid={!!error} /><span className="data-count">{data.length} datos</span></div>
        <div className="input-footer"><p id="data-help"><TeacherHint title="Cómo ingresar los datos">Separá los valores con comas, espacios o saltos de línea. Para decimales, usá punto.</TeacherHint></p></div>
        {error && <ErrorNotice>{error}</ErrorNotice>}
      </CardContent>
    </Card>

    {data.length > 0 ? <>
      <div className="metrics-grid">
        <Metric label="Observaciones" value={data.length} detail="Tamaño de la muestra · N" icon={<Hash />} testId="metric-count" />
        <Metric label="Media aritmética" value={formatNumber(mean(data))} detail="El promedio de tus datos" icon={<Sigma />} testId="metric-mean" />
        <Metric label="Mediana" value={displayValue(median(data))} detail="El valor central ordenado" icon={<ListOrdered />} testId="metric-median" />
        <Metric label="Moda" value={mode.length ? mode.map(displayValue).join(' · ') : 'Sin moda'} detail={mode.length > 1 ? 'Distribución multimodal' : mode.length ? 'El valor más frecuente' : 'Ningún valor se repite'} icon={<TrendingUp />} testId="metric-mode" />
        <Metric label="Mínimo" value={displayValue(rows[0].value)} detail="Menor valor observado" icon={<Maximize2 />} />
        <Metric label="Máximo" value={displayValue(rows[rows.length - 1].value)} detail="Mayor valor observado" icon={<Maximize2 />} />
      </div>
      <div className="analysis-grid">
        <Card className="frequency-card"><CardContent>
          <SectionHeading index="02" title="Tabla de frecuencias" description="Tus datos, ordenados y organizados." />
          <div className="table-scroll mt-5"><table aria-label="Tabla de frecuencias"><thead><tr>{['Valor', 'fi', 'Fi', 'hi', 'Hi', '%'].map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{rows.map(r => <tr key={r.value}><th scope="row">{displayValue(r.value)}</th><td><span className="frequency-pill">{r.fi}</span></td><td>{r.Fi}</td><td>{formatNumber(r.hi, 4)}</td><td>{formatNumber(r.Hi, 4)}</td><td>{formatNumber(r.percent)}%</td></tr>)}</tbody><tfoot><tr><th scope="row">Total</th><td>{data.length}</td><td>—</td><td>{formatNumber(sumRelative, 4)}</td><td>—</td><td>100,00%</td></tr></tfoot></table></div>
        </CardContent></Card>

        <Card className="chart-card"><CardContent>
          <SectionHeading index="03" title={grouped ? 'Histograma' : 'Gráfico de frecuencias'} description="Una mirada visual a la distribución." action={<ExportButton chartRef={chartRef} filename="distribucion-frecuencias.png" lines={[`${grouped ? 'Histograma' : 'Frecuencias discretas'} · N = ${data.length} · ${relative ? 'Frecuencia relativa' : 'Frecuencia absoluta'}`]} />} />
          <div className="chart-toolbar"><div className="segmented" aria-label="Tipo de frecuencia"><button aria-pressed={!relative} className={!relative ? 'selected' : ''} onClick={() => setRelative(false)}>Absoluta (fi)</button><button aria-pressed={relative} className={relative ? 'selected' : ''} onClick={() => setRelative(true)}>Relativa (hi)</button></div><select aria-label="Tipo de gráfico" value={grouped ? 'grouped' : 'discrete'} onChange={e => setGrouped(e.target.value === 'grouped')}><option value="discrete">Datos discretos</option><option value="grouped">Agrupar en intervalos</option></select></div>
          {grouped && <label className="range-label">Intervalos: {intervals}<input aria-label="Cantidad de intervalos" type="range" min="1" max="20" value={intervals} onChange={e => setIntervals(Number(e.target.value))} /></label>}
          <div ref={chartRef} className="chart-area" role="img" aria-label={grouped ? 'Histograma por intervalos' : 'Gráfico de barras de frecuencias'}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={chartData} barCategoryGap={grouped ? 0 : '38%'} margin={{ top: 25, right: 15, left: 0, bottom: 30 }} accessibilityLayer>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: grouped ? 'Intervalos de clase' : 'Valor observado', position: 'insideBottom', offset: -20, fill: 'var(--muted-foreground)', fontSize: 11 }} />
                <YAxis width={52} allowDecimals={relative} tickFormatter={n => relative ? formatNumber(Number(n), 2) : String(n)} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} tickLine={false} axisLine={false} label={{ value: relative ? 'hi' : 'fi', angle: -90, position: 'insideLeft', fill: 'var(--muted-foreground)', fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'var(--accent)' }} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--foreground)' }} formatter={value => [relative ? formatNumber(Number(value), 4) : Number(value), relative ? 'Frecuencia relativa' : 'Frecuencia absoluta']} />
                <Bar dataKey={relative ? 'hi' : 'fi'} fill="var(--chart-bar)" radius={grouped ? [0, 0, 0, 0] : [6, 6, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-explanation"><TeacherExplanation title="Interpretar el gráfico" teacher="franco"><p>{grouped ? 'Los intervalos tienen la misma amplitud y sus barras son contiguas. Cada intervalo incluye el extremo izquierdo; solo el último incluye ambos extremos.' : 'Cada barra representa un valor distinto. Su altura indica cuántas veces aparece en la muestra (fi) o qué proporción representa (hi). Las barras se separan porque los valores son discretos.'}</p></TeacherExplanation></div>
        </CardContent></Card>
      </div>
    </> : <Card><EmptyState /></Card>}
    <Card><CardContent className="calculation-explanations">
      <TeacherExplanation title="Media aritmética" teacher="facundo"><h3>Procedimiento para la Media Aritmética</h3><p>El procedimiento para calcular la media aritmética utiliza la siguiente fórmula:</p><div className="weighted-formula" role="math" aria-label="Media aritmética: suma de cada valor por su frecuencia, dividida por n"><span>x̄ = </span><span className="formula-fraction"><span>x₁ · f₁ + x₂ · f₂ + x₃ · f₃ + …</span><span>n</span></span></div><p>Para resolverla, debes seguir estos pasos:</p><ol><li><strong>Multiplicar</strong> cada dato (xᵢ) por las veces que aparece o su frecuencia (fᵢ).</li><li><strong>Sumar</strong> todos los resultados de esas multiplicaciones.</li><li><strong>Dividir</strong> esa suma total por la cantidad total de datos (n).</li></ol></TeacherExplanation>
      <TeacherExplanation title="Mediana" teacher="franco"><h3>Procedimiento para la Mediana</h3><p>El procedimiento para calcular la mediana es muy simple:</p><ol><li><strong>Ordenar</strong> todos los números de menor a mayor.</li><li><strong>Ubicar el centro:</strong><ul><li>Si la cantidad de datos es impar, la mediana es el número que queda justo en el medio.</li><li>En caso de que la cantidad sea par, debes sumar los dos números centrales y dividirlos por 2.</li></ul></li></ol></TeacherExplanation>
      <TeacherExplanation title="Moda" teacher="facundo"><p>El procedimiento para obtener la moda consiste en contabilizar y comparar las frecuencias de todos los datos, para luego seleccionar el que más se repite. Al aplicar este proceso, el resultado puede ser único, múltiple si varios valores empatan en la frecuencia máxima (ej: 7 autos rojos y 7 azules), o incluso nulo si ningún dato destaca sobre el resto.</p></TeacherExplanation>
    </CardContent></Card>
  </div>
}
