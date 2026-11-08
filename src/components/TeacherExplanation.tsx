import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CircleHelp, X } from 'lucide-react'
import { teachers, type TeacherId } from '../features/teachers/data'

interface HelpProps { teacher?: TeacherId; children: ReactNode; title?: string; compact?: boolean }

function TeacherDialog({ teacher, title, children, onClose }: { teacher: TeacherId; title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const guide = teachers[teacher]
  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [])
  return <dialog ref={ref} className={`teacher-dialog teacher-${teacher}`} aria-labelledby={titleId} onClose={onClose} onClick={event => { event.stopPropagation(); if (event.target === event.currentTarget) ref.current?.close() }}>
    <div className="teacher-dialog-panel" data-teacher-id={teacher}>
      <button type="button" className="dialog-close" aria-label="Cerrar ayuda" autoFocus onClick={() => ref.current?.close()}><X size={20} /></button>
      <header className="teacher-dialog-header"><img src={guide.portrait} alt={guide.name} width={110} height={110} /><div><span className="eyebrow">TU PROFESOR TE ACOMPAÑA</span><strong>{guide.name}</strong><h2 id={titleId}>{title}</h2></div></header>
      <div className="teacher-dialog-content">{children}</div>
    </div>
  </dialog>
}

export function TeacherExplanation({ teacher = 'facundo', children, title = 'Información adicional', compact = false }: HelpProps) {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const guide = teachers[teacher]
  return <span className={`teacher-help ${compact ? 'teacher-help-compact' : ''}`}>
    <button ref={trigger} type="button" className="teacher-help-trigger" aria-label={`Ayuda: ${title}`} aria-haspopup="dialog" aria-expanded={open} onClick={event => { event.preventDefault(); event.stopPropagation(); setOpen(true) }}><img src={guide.portrait} alt="" width={28} height={28} loading="lazy" /><span>{compact ? 'Ayuda' : title}</span><CircleHelp size={16} /></button>
    {open && createPortal(<TeacherDialog teacher={teacher} title={title} onClose={() => { setOpen(false); trigger.current?.focus() }}>{children}</TeacherDialog>, document.body)}
  </span>
}

export function TeacherHint(props: Omit<HelpProps, 'compact'>) {
  return <TeacherExplanation {...props} compact />
}
