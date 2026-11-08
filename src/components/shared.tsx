import type { ReactNode } from 'react'
import { CircleAlert, Sparkles } from 'lucide-react'
import { TeacherExplanation, TeacherHint } from './TeacherExplanation'
import type { TeacherId } from '../features/teachers/data'

export function ErrorNotice({ children }: { children: ReactNode }) {
  return <div role="alert" className="notice error"><CircleAlert size={17} /><span>{children}</span></div>
}

export function EmptyState({ title = 'Tus datos, una nueva perspectiva', children, plain = false }: { title?: string; children?: ReactNode; plain?: boolean }) {
  const message = children ?? 'Ingresá tu serie de datos para empezar a explorar.'
  return <div className="empty-state"><div className="empty-icon"><Sparkles size={26} /></div><h3>{title}</h3><p>{plain ? message : <TeacherHint title="Cómo empezar" teacher="franco">{message}</TeacherHint>}</p></div>
}

export function Procedure({ title, children, teacher = 'franco' }: { title: string; children: ReactNode; teacher?: TeacherId }) {
  return <TeacherExplanation title={title} teacher={teacher}>{children}</TeacherExplanation>
}

export function Metric({ label, value, detail, icon, testId }: { label: string; value: ReactNode; detail: ReactNode; icon: ReactNode; testId?: string }) {
  return <div className="metric" data-testid={testId}><div className="metric-top"><span>{label}</span><span className="metric-icon">{icon}</span></div><div className="metric-value">{value}</div><div className="metric-detail"><TeacherHint title={`Qué significa ${label}`}>{detail}</TeacherHint></div></div>
}

export function SectionHeading({ index, title, description, action, plain = false }: { index: string; title: string; description: string; action?: ReactNode; plain?: boolean }) {
  return <div className="section-heading"><div className="section-label"><span className="step-number">{index}</span><div><h2>{title}</h2><p>{plain ? description : <TeacherHint title={title}>{description}</TeacherHint>}</p></div></div>{action}</div>
}
