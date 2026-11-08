import { useState, type RefObject } from 'react'
import { Download, LoaderCircle } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { exportChart } from './export'

export function ExportButton({ chartRef, filename, lines = [] }: { chartRef: RefObject<HTMLDivElement | null>; filename: string; lines?: string[] }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function download() {
    if (!chartRef.current) return
    setBusy(true)
    setError('')
    try { await exportChart(chartRef.current, filename, lines) }
    catch (error) { setError(error instanceof Error ? error.message : 'No se pudo exportar el gráfico.') }
    finally { setBusy(false) }
  }
  return <div className="export-control"><Button variant="outline" size="sm" onClick={download} disabled={busy}>{busy ? <LoaderCircle className="animate-spin" /> : <Download />}PNG</Button>{error && <span role="alert" className="text-destructive text-xs">{error}</span>}</div>
}
