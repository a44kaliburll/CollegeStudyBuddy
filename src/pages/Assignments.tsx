import { useMemo, useState } from 'react'
import { useStore } from '../store'
import type { Assignment, AssignmentStatus, AssignmentType, Priority } from '../types'
import { courseColor, daysUntil, formatDateLong, formatTime, relativeDue, todayISO, uid } from '../utils'
import { Btn, Card, Chip, cx, DeleteBtn, EmptyState, Field, Modal, PageHeader, Select, TextArea, TextInput } from '../components/ui'

export const TYPE_META: Record<AssignmentType, { emoji: string; label: string }> = {
  assignment: { emoji: '📄', label: 'Assignment' },
  exam: { emoji: '🧪', label: 'Exam' },
  quiz: { emoji: '❓', label: 'Quiz' },
  project: { emoji: '🛠️', label: 'Project' },
  reading: { emoji: '📖', label: 'Reading' },
  lab: { emoji: '🔬', label: 'Lab' },
}

const PRIORITY_META: Record<Priority, { label: string; chip: string }> = {
  high: { label: '🔴 High', chip: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' },
  medium: { label: '🟡 Medium', chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
  low: { label: '🟢 Low', chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
}

export default function Assignments() {
  const s = useStore()
  const [editing, setEditing] = useState<Assignment | 'new' | null>(null)
  const [courseFilter, setCourseFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showDone, setShowDone] = useState(false)

  const courseById = new Map(s.courses.map((c) => [c.id, c]))

  const filtered = useMemo(() => {
    return s.assignments
      .filter((a) => courseFilter === 'all' || a.courseId === courseFilter)
      .filter((a) => typeFilter === 'all' || a.type === typeFilter)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || (a.dueTime ?? '').localeCompare(b.dueTime ?? ''))
  }, [s.assignments, courseFilter, typeFilter])

  const open = filtered.filter((a) => a.status !== 'done')
  const done = filtered.filter((a) => a.status === 'done')

  const groups: { title: string; items: Assignment[] }[] = [
    { title: '🚨 Overdue', items: open.filter((a) => daysUntil(a.dueDate) < 0) },
    { title: '📅 Today', items: open.filter((a) => daysUntil(a.dueDate) === 0) },
    { title: '🗓️ This week', items: open.filter((a) => daysUntil(a.dueDate) > 0 && daysUntil(a.dueDate) <= 7) },
    { title: '🌤️ Later', items: open.filter((a) => daysUntil(a.dueDate) > 7) },
  ]

  const cycleStatus = (a: Assignment) => {
    const next: Record<AssignmentStatus, AssignmentStatus> = { todo: 'in-progress', 'in-progress': 'done', done: 'todo' }
    s.update('assignments', a.id, { status: next[a.status] })
  }

  return (
    <div className="pop-in">
      <PageHeader
        emoji="📝"
        title="Assignments & Exams"
        subtitle={`${open.length} open · ${done.length} done`}
        actions={
          <>
            <Select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="!w-auto">
              <option value="all">All courses</option>
              {s.courses.filter((c) => c.status !== 'completed').map((c) => (
                <option key={c.id} value={c.id}>{c.code || c.name}</option>
              ))}
            </Select>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="!w-auto">
              <option value="all">All types</option>
              {Object.entries(TYPE_META).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </Select>
            <Btn variant="primary" onClick={() => setEditing('new')}>＋ Add</Btn>
          </>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          emoji="🎉"
          title="Nothing here"
          hint="Add assignments, exams, quizzes and projects so nothing sneaks up on you."
          action={<Btn variant="primary" onClick={() => setEditing('new')}>Add your first one</Btn>}
        />
      ) : (
        <div className="space-y-6">
          {groups.map(
            (g) =>
              g.items.length > 0 && (
                <div key={g.title}>
                  <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wider text-slate-400">{g.title}</h2>
                  <div className="space-y-2">
                    {g.items.map((a) => (
                      <Row key={a.id} a={a} courseById={courseById} onEdit={() => setEditing(a)} onCycle={() => cycleStatus(a)} onDelete={() => s.remove('assignments', a.id)} />
                    ))}
                  </div>
                </div>
              ),
          )}

          {done.length > 0 && (
            <div>
              <button className="mb-2 font-display text-sm font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600" onClick={() => setShowDone(!showDone)}>
                ✅ Done ({done.length}) {showDone ? '▾' : '▸'}
              </button>
              {showDone && (
                <div className="space-y-2 opacity-70">
                  {done.map((a) => (
                    <Row key={a.id} a={a} courseById={courseById} onEdit={() => setEditing(a)} onCycle={() => cycleStatus(a)} onDelete={() => s.remove('assignments', a.id)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {editing && <AssignmentModal a={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function Row({
  a, courseById, onEdit, onCycle, onDelete,
}: {
  a: Assignment
  courseById: Map<string, { code: string; name: string; color: string; emoji: string }>
  onEdit: () => void
  onCycle: () => void
  onDelete: () => void
}) {
  const course = a.courseId ? courseById.get(a.courseId) : undefined
  const cc = course ? courseColor(course.color) : null
  const overdue = a.status !== 'done' && daysUntil(a.dueDate) < 0

  return (
    <Card className="flex items-center gap-3 !p-3.5" onClick={onEdit}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onCycle()
        }}
        title={a.status === 'todo' ? 'Mark in progress' : a.status === 'in-progress' ? 'Mark done' : 'Mark to-do'}
        className={cx(
          'grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition',
          a.status === 'done'
            ? 'bg-emerald-500 text-white'
            : a.status === 'in-progress'
              ? 'bg-amber-400 text-white'
              : 'ring-2 ring-slate-300 hover:ring-brand-400 dark:ring-slate-600',
        )}
      >
        {a.status === 'done' ? '✓' : a.status === 'in-progress' ? '…' : ''}
      </button>
      <span className="text-xl">{TYPE_META[a.type].emoji}</span>
      <div className="min-w-0 flex-1">
        <div className={cx('truncate text-sm font-bold', a.status === 'done' && 'line-through text-slate-400')}>{a.title}</div>
        <div className="truncate text-xs font-semibold text-slate-400">
          {course ? `${course.code || course.name} · ` : ''}
          {formatDateLong(a.dueDate)}
          {a.dueTime ? ` · ${formatTime(a.dueTime)}` : ''}
          {a.notes ? ` · ${a.notes}` : ''}
        </div>
      </div>
      {cc && course && <Chip className={cx('hidden md:inline-flex', cc.bg)}>{course.emoji} {course.code || course.name}</Chip>}
      <Chip className={cx('hidden sm:inline-flex', PRIORITY_META[a.priority].chip)}>{PRIORITY_META[a.priority].label}</Chip>
      <Chip
        className={
          overdue
            ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
            : a.status === 'done'
              ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              : daysUntil(a.dueDate) <= 1
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
        }
      >
        {relativeDue(a.dueDate)}
      </Chip>
      <div onClick={(e) => e.stopPropagation()}>
        <DeleteBtn small onDelete={onDelete} />
      </div>
    </Card>
  )
}

function AssignmentModal({ a, onClose }: { a: Assignment | null; onClose: () => void }) {
  const s = useStore()
  const [title, setTitle] = useState(a?.title ?? '')
  const [courseId, setCourseId] = useState(a?.courseId ?? s.courses[0]?.id ?? '')
  const [type, setType] = useState<AssignmentType>(a?.type ?? 'assignment')
  const [dueDate, setDueDate] = useState(a?.dueDate ?? todayISO())
  const [dueTime, setDueTime] = useState(a?.dueTime ?? '')
  const [priority, setPriority] = useState<Priority>(a?.priority ?? 'medium')
  const [notes, setNotes] = useState(a?.notes ?? '')

  const save = () => {
    if (!title.trim()) return
    const data = {
      title: title.trim(),
      courseId: courseId || null,
      type,
      dueDate,
      dueTime: dueTime || undefined,
      priority,
      notes: notes.trim() || undefined,
    }
    if (a) s.update('assignments', a.id, data)
    else s.add('assignments', { id: uid(), status: 'todo', ...data })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={a ? 'Edit assignment' : 'Add assignment'} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" className="sm:col-span-2">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Problem set 4" autoFocus />
        </Field>
        <Field label="Course">
          <Select value={courseId ?? ''} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">(no course)</option>
            {s.courses.filter((c) => c.status !== 'completed').map((c) => (
              <option key={c.id} value={c.id}>{c.emoji} {c.code || c.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value as AssignmentType)}>
            {Object.entries(TYPE_META).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Due date">
          <TextInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="Due time (optional)">
          <TextInput type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
        </Field>
        <Field label="Priority">
          <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {Object.entries(PRIORITY_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Notes (optional)" className="sm:col-span-2">
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything to remember?" className="!min-h-16" />
        </Field>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={save} disabled={!title.trim()}>{a ? 'Save changes' : 'Add it'}</Btn>
      </div>
    </Modal>
  )
}
