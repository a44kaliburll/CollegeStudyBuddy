import { useMemo, useState } from 'react'
import { useStore } from '../store'
import type { Note } from '../types'
import { courseColor, uid } from '../utils'
import { Btn, Card, Chip, cx, DeleteBtn, EmptyState, PageHeader, Select, TextInput } from '../components/ui'

export default function Notes() {
  const s = useStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [courseFilter, setCourseFilter] = useState('all')

  const courseById = new Map(s.courses.map((c) => [c.id, c]))

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return s.notes
      .filter((n) => courseFilter === 'all' || (courseFilter === 'general' ? n.courseId === null : n.courseId === courseFilter))
      .filter((n) => !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt))
  }, [s.notes, query, courseFilter])

  const selected = s.notes.find((n) => n.id === selectedId) ?? null

  const createNote = () => {
    const note: Note = {
      id: uid(),
      title: 'Untitled note',
      courseId: courseFilter !== 'all' && courseFilter !== 'general' ? courseFilter : null,
      content: '',
      updatedAt: new Date().toISOString(),
      pinned: false,
    }
    s.add('notes', note)
    setSelectedId(note.id)
  }

  const touch = (id: string, patch: Partial<Note>) => s.update('notes', id, { ...patch, updatedAt: new Date().toISOString() })

  return (
    <div className="pop-in">
      <PageHeader
        emoji="📓"
        title="Notes"
        subtitle={`${s.notes.length} notes`}
        actions={<Btn variant="primary" onClick={createNote}>＋ New note</Btn>}
      />

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        {/* Note list */}
        <div className="space-y-3">
          <TextInput placeholder="🔍 Search notes…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            <option value="all">All notes</option>
            <option value="general">📌 General (no course)</option>
            {s.courses.map((c) => (
              <option key={c.id} value={c.id}>{c.emoji} {c.code || c.name}</option>
            ))}
          </Select>

          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {filtered.length === 0 && <p className="py-6 text-center text-sm font-semibold text-slate-400">No notes found</p>}
            {filtered.map((n) => {
              const course = n.courseId ? courseById.get(n.courseId) : undefined
              const cc = course ? courseColor(course.color) : null
              return (
                <button
                  key={n.id}
                  onClick={() => setSelectedId(n.id)}
                  className={cx(
                    'w-full rounded-2xl px-4 py-3 text-left transition',
                    selectedId === n.id
                      ? 'bg-brand-50 ring-2 ring-brand-300 dark:bg-brand-500/10 dark:ring-brand-500/40'
                      : 'ring-1 ring-slate-900/5 [background:var(--card-bg)] hover:brightness-[0.98] dark:ring-white/10 dark:hover:brightness-110',
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {n.pinned && <span className="text-xs">📌</span>}
                    <span className="truncate text-sm font-bold">{n.title || 'Untitled'}</span>
                  </div>
                  <div className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                    {n.content.split('\n')[0] || 'Empty note'}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    {course && cc && <Chip className={cc.bg}>{course.emoji} {course.code}</Chip>}
                    <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">
                      {new Date(n.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Editor */}
        {selected ? (
          <Card className="flex min-h-[60vh] flex-col">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <TextInput
                value={selected.title}
                onChange={(e) => touch(selected.id, { title: e.target.value })}
                className="!bg-transparent !px-0 !text-xl !font-extrabold focus:!ring-0"
                placeholder="Note title…"
              />
              <div className="ml-auto flex items-center gap-1.5">
                <Select
                  value={selected.courseId ?? ''}
                  onChange={(e) => touch(selected.id, { courseId: e.target.value || null })}
                  className="!w-auto !py-1.5 text-xs"
                >
                  <option value="">📌 General</option>
                  {s.courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.code || c.name}</option>
                  ))}
                </Select>
                <Btn
                  variant={selected.pinned ? 'soft' : 'ghost'}
                  className="!px-3"
                  onClick={() => touch(selected.id, { pinned: !selected.pinned })}
                  title={selected.pinned ? 'Unpin' : 'Pin to top'}
                >
                  📌
                </Btn>
                <DeleteBtn
                  onDelete={() => {
                    s.remove('notes', selected.id)
                    setSelectedId(null)
                  }}
                />
              </div>
            </div>
            <textarea
              value={selected.content}
              onChange={(e) => touch(selected.id, { content: e.target.value })}
              placeholder="Start typing… your note saves automatically ✨"
              className="flex-1 resize-none rounded-2xl bg-slate-50 p-4 text-sm font-medium leading-relaxed text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:bg-slate-800/60 dark:text-slate-200"
            />
            <p className="mt-2 text-right text-[11px] font-bold text-slate-300 dark:text-slate-600">
              Last edited {new Date(selected.updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </p>
          </Card>
        ) : (
          <EmptyState
            emoji="📝"
            title={s.notes.length === 0 ? 'No notes yet' : 'Pick a note to read or edit'}
            hint="Keep lecture notes, cheat sheets, and random ideas — organized by course."
            action={<Btn variant="primary" onClick={createNote}>Write your first note</Btn>}
          />
        )}
      </div>
    </div>
  )
}
