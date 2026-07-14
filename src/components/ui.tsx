import { useEffect, type ReactNode } from 'react'

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

// ---------- Layout ----------
export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cx(
        'rounded-3xl p-5 shadow-[0_2px_12px_rgba(90,60,190,0.07)] ring-1 ring-slate-900/5 [background:var(--card-bg)]',
        'dark:ring-white/10',
        onClick && 'cursor-pointer transition hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(90,60,190,0.13)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function PageHeader({ emoji, title, subtitle, actions }: { emoji: string; title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-100 to-bubble-100 text-2xl dark:from-brand-500/25 dark:to-bubble-500/20">
          {emoji}
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
          {subtitle && <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cx('mb-3 font-display text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500', className)}>{children}</h2>
}

// ---------- Buttons ----------
type BtnVariant = 'primary' | 'soft' | 'ghost' | 'danger'

const btnStyles: Record<BtnVariant, string> = {
  primary:
    'bg-gradient-to-r from-brand-500 to-bubble-500 text-white shadow-md shadow-brand-500/25 hover:brightness-110 active:scale-95',
  soft: 'bg-brand-100 text-brand-700 hover:bg-brand-200 active:scale-95 dark:bg-brand-500/20 dark:text-brand-200 dark:hover:bg-brand-500/30',
  ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200',
  danger: 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-500/30',
}

export function Btn({
  children, onClick, variant = 'soft', className, type = 'button', disabled, title,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: BtnVariant
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50',
        btnStyles[variant],
        className,
      )}
    >
      {children}
    </button>
  )
}

export function IconBtn({ children, onClick, title, className }: { children: ReactNode; onClick?: () => void; title?: string; className?: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      className={cx(
        'grid size-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200',
        className,
      )}
    >
      {children}
    </button>
  )
}

// ---------- Modal ----------
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm dark:bg-black/60" onMouseDown={onClose}>
      <div
        className={cx('pop-in my-8 w-full rounded-3xl p-6 shadow-2xl [background:var(--card-bg)] dark:ring-1 dark:ring-white/10', wide ? 'max-w-2xl' : 'max-w-md')}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h2>
          <IconBtn onClick={onClose} title="Close">✕</IconBtn>
        </div>
        {children}
      </div>
    </div>
  )
}

// ---------- Form controls ----------
const inputBase =
  'w-full rounded-xl border-0 bg-slate-100 px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500'

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</span>
      {children}
    </label>
  )
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputBase, props.className)} />
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(inputBase, 'min-h-24 resize-y', props.className)} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(inputBase, 'cursor-pointer', props.className)} />
}

// ---------- Bits & bobs ----------
export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold', className)}>{children}</span>
}

export function ProgressBar({ value, className, barClassName }: { value: number; className?: string; barClassName?: string }) {
  return (
    <div className={cx('h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800', className)}>
      <div
        className={cx('h-full rounded-full bg-gradient-to-r from-brand-400 to-bubble-400 transition-all duration-500', barClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export function EmptyState({ emoji, title, hint, action }: { emoji: string; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center gap-2 rounded-3xl border-2 border-dashed border-slate-200 py-12 text-center dark:border-slate-700">
      <span className="text-4xl">{emoji}</span>
      <p className="font-bold text-slate-600 dark:text-slate-300">{title}</p>
      {hint && <p className="max-w-xs text-sm font-semibold text-slate-400 dark:text-slate-500">{hint}</p>}
      {action}
    </div>
  )
}

export function StatTile({ emoji, label, value, sub, className }: { emoji: string; label: string; value: ReactNode; sub?: string; className?: string }) {
  return (
    <Card className={cx('flex items-center gap-4 !p-4', className)}>
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-xl dark:bg-slate-800">{emoji}</span>
      <div className="min-w-0">
        <div className="truncate text-xl font-extrabold text-slate-800 dark:text-slate-100">{value}</div>
        <div className="truncate text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</div>
        {sub && <div className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{sub}</div>}
      </div>
    </Card>
  )
}

/** Confirm-then-delete inline button: first click arms it, second click deletes */
import { useState } from 'react'
export function DeleteBtn({ onDelete, small }: { onDelete: () => void; small?: boolean }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 2500)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <button
      type="button"
      title={armed ? 'Click again to confirm' : 'Delete'}
      onClick={(e) => {
        e.stopPropagation()
        if (armed) onDelete()
        else setArmed(true)
      }}
      className={cx(
        'grid place-items-center rounded-full transition',
        small ? 'size-7 text-xs' : 'size-8 text-sm',
        armed
          ? 'bg-rose-500 text-white'
          : 'text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/15',
      )}
    >
      {armed ? '❗' : '🗑️'}
    </button>
  )
}
