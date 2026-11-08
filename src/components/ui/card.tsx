import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

// shadcn/ui Card composition, adapted to the educational dashboard theme.
export function Card({ className, ...props }: ComponentProps<'section'>) {
  return <section data-slot="card" className={cn('rounded-2xl border border-border bg-card text-card-foreground shadow-xs', className)} {...props} />
}
export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-header" className={cn('flex items-start justify-between gap-3 p-5 pb-0', className)} {...props} />
}
export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('p-5', className)} {...props} />
}
