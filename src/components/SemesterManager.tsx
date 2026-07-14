import { useState } from 'react'
import { useStore } from '../store'
import type { Semester } from '../types'
import { addDays, formatDate, parseISO, semesterTotalWeeks, todayISO, toISODate, uid } from '../utils'
import { Btn, cx, DeleteBtn, Field, Modal, TextInput } from './ui'

/** Typical US term shapes — picking one prefills name + length, everything stays editable */
const TERM_PRESETS = [
  { emoji: '🍂', season: 'Fall', weeks: 15 },
  { emoji: '❄️', season: 'Winter', weeks: 4 },
  { emoji: '🌸', season: 'Spring', weeks: 15 },
  { emoji: '☀️', season: 'Summer', weeks: 8 },
] as const

export function semesterEmoji(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('fall') || n.includes('autumn')) return '🍂'
  if (n.includes('winter')) return '❄️'
  if (n.includes('spring')) return '🌸'
  if (n.includes('summer')) return '☀️'
  return '🗂️'
}

export function SemesterManagerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [start, setStart] = useState(todayISO())
  const [end, setEnd] = useState(toISODate(addDays(new Date(), 104)))

  const applyPreset = (preset: (typeof TERM_PRESETS)[number]) => {
    const startDate = parseISO(start)
    setName(`${preset.season} ${startDate.getFullYear()}`)
    setEnd(toISODate(addDays(startDate, preset.weeks * 7 - 1)))
  }

  const create = () => {
    if (!name.trim()) return
    const sem: Semester = { id: uid(), name: name.trim(), startDate: start, endDate: end }
    s.add('semesters', sem)
    s.setActiveSemester(sem.id)
    setName('')
  }

  const semesters = s.semesters.slice().sort((a, b) => b.startDate.localeCompare(a.startDate))

  return (
    <Modal open={open} onClose={onClose} title="Semesters & terms" wide>
      <div className="space-y-2">
        {semesters.map((x) =>
          editingId === x.id ? (
            <SemesterEditor key={x.id} sem={x} onDone={() => setEditingId(null)} />
          ) : (
            <div
              key={x.id}
              className={cx(
                'flex items-center gap-3 rounded-2xl px-3.5 py-2.5',
                x.id === s.activeSemesterId
                  ? 'bg-brand-50 ring-2 ring-brand-300 dark:bg-brand-500/10 dark:ring-brand-500/40'
                  : 'bg-slate-50 dark:bg-slate-800/60',
              )}
            >
              <span className="text-lg">{semesterEmoji(x.name)}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold">
                  {x.name}
                  {x.id === s.activeSemesterId && <span className="ml-2 text-[10px] font-extrabold uppercase tracking-wide text-brand-500 dark:text-brand-300">active</span>}
                </div>
                <div className="text-xs font-semibold text-slate-400">
                  {formatDate(x.startDate)} – {formatDate(x.endDate)} · {semesterTotalWeeks(x)} weeks · {s.courses.filter((c) => c.semesterId === x.id).length} courses
                </div>
              </div>
              {x.id !== s.activeSemesterId && (
                <Btn variant="ghost" className="!px-2.5 !py-1 !text-xs" onClick={() => s.setActiveSemester(x.id)}>Switch</Btn>
              )}
              <Btn variant="ghost" className="!px-2.5 !py-1 !text-xs" onClick={() => setEditingId(x.id)} title="Edit name & dates">✏️</Btn>
              <DeleteBtn small onDelete={() => s.deleteSemesterCascade(x.id)} />
            </div>
          ),
        )}
        {semesters.length === 0 && <p className="py-2 text-center text-sm font-semibold text-slate-400">No semesters yet — create one below.</p>}
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">New semester or term</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {TERM_PRESETS.map((p) => (
            <button
              key={p.season}
              type="button"
              onClick={() => applyPreset(p)}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-900/10 transition hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-700 dark:text-slate-200 dark:ring-white/10 dark:hover:bg-slate-600"
              title={`${p.weeks}-week term from the start date`}
            >
              {p.emoji} {p.season} · {p.weeks} wk
            </button>
          ))}
        </div>
        <div className="grid gap-3">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fall 2026" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts"><TextInput type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
            <Field label="Ends"><TextInput type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
          </div>
          <Btn variant="primary" onClick={create} disabled={!name.trim() || end <= start}>Create {name.trim() || 'semester'}</Btn>
        </div>
      </div>
    </Modal>
  )
}

function SemesterEditor({ sem, onDone }: { sem: Semester; onDone: () => void }) {
  const update = useStore((s) => s.update)
  const [name, setName] = useState(sem.name)
  const [start, setStart] = useState(sem.startDate)
  const [end, setEnd] = useState(sem.endDate)

  const save = () => {
    if (!name.trim() || end <= start) return
    update('semesters', sem.id, { name: name.trim(), startDate: start, endDate: end })
    onDone()
  }

  return (
    <div className="rounded-2xl bg-brand-50 p-3 ring-2 ring-brand-300 dark:bg-brand-500/10 dark:ring-brand-500/40">
      <div className="grid gap-2">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Semester name" autoFocus />
        <div className="grid grid-cols-2 gap-2">
          <TextInput type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          <TextInput type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          <Btn variant="ghost" className="!px-3 !py-1.5 !text-xs" onClick={onDone}>Cancel</Btn>
          <Btn variant="primary" className="!px-3 !py-1.5 !text-xs" onClick={save} disabled={!name.trim() || end <= start}>Save</Btn>
        </div>
      </div>
    </div>
  )
}
