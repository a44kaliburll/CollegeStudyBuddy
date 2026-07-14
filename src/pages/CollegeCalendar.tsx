import { useRef, useState } from 'react'
import { useStore } from '../store'
import type { CollegeEvent, CollegeEventCategory, ID, WeekGuide } from '../types'
import { daysUntil, formatDate, parseISO, semesterTotalWeeks, semesterWeekOf, todayISO, uid } from '../utils'
import { guessCategory, parseICS, type IcsEvent } from '../ics'
import { Btn, Card, Chip, cx, DeleteBtn, EmptyState, Field, Modal, PageHeader, SectionTitle, Select, TextArea, TextInput } from '../components/ui'

export const EVENT_CATEGORY_META: Record<CollegeEventCategory, { emoji: string; label: string; chip: string }> = {
  academic: { emoji: '🎓', label: 'Academic', chip: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200' },
  deadline: { emoji: '⏰', label: 'Deadline', chip: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' },
  exams: { emoji: '📝', label: 'Exams', chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
  holiday: { emoji: '🏖️', label: 'Break', chip: 'bg-mint-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
  registration: { emoji: '🗓️', label: 'Registration', chip: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300' },
  campus: { emoji: '🎪', label: 'Campus', chip: 'bg-bubble-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300' },
}

export default function CollegeCalendar() {
  const s = useStore()
  const [editingEvent, setEditingEvent] = useState<CollegeEvent | 'new' | null>(null)
  const [addingWeek, setAddingWeek] = useState(false)
  const [showPast, setShowPast] = useState(false)
  const [icsEvents, setIcsEvents] = useState<IcsEvent[] | null>(null)
  const [icsError, setIcsError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const today = todayISO()

  const semester = s.semesters.find((x) => x.id === s.activeSemesterId) ?? s.semesters[0]
  const totalWeeks = semester ? semesterTotalWeeks(semester) : 16
  const currentWeek = semester ? semesterWeekOf(semester, today) : 1
  const inSemester = semester ? today >= semester.startDate && today <= semester.endDate : false

  // Everything on this page is scoped to the selected semester
  const semEvents = s.collegeEvents.filter((e) => semester && e.semesterId === semester.id)
  const guides = s.weekGuides
    .filter((g) => semester && g.semesterId === semester.id)
    .sort((a, b) => a.week - b.week)
  const currentGuide = guides.find((g) => g.week === currentWeek)

  const onIcsFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const parsed = parseICS(await file.text())
      if (parsed.length === 0) setIcsError('No events found in that file — is it a valid .ics calendar?')
      else setIcsEvents(parsed)
    } catch {
      setIcsError('Could not read that file.')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  // Events sorted; split into upcoming (incl. ongoing ranges) and past
  const sorted = semEvents.slice().sort((a, b) => a.date.localeCompare(b.date))
  const upcoming = sorted.filter((e) => (e.endDate ?? e.date) >= today)
  const past = sorted.filter((e) => (e.endDate ?? e.date) < today)

  // Group upcoming by month
  const byMonth: { label: string; events: CollegeEvent[] }[] = []
  for (const e of upcoming) {
    const label = parseISO(e.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const group = byMonth.find((g) => g.label === label)
    if (group) group.events.push(e)
    else byMonth.push({ label, events: [e] })
  }

  const addStarterGuides = () => {
    if (!semester) return
    const starter: [number, string, string[]][] = [
      [1, 'Welcome week', ['Classes begin — show up to everything', 'Add/drop courses', 'Connect with your advisor', 'Get familiar with the help desk']],
      [2, 'Settle in', ['Finalize textbooks & materials', 'Block out a weekly study schedule', 'Join a club or two']],
      [3, 'Find your rhythm', ['Visit each professor’s office hours once', 'Set up a study group', 'Check in on your budget']],
      [Math.max(4, Math.round(totalWeeks / 2)), 'Midterm season', ['Check every syllabus for midterm dates', 'Book a library study room', 'Start a review sheet per course']],
      [Math.max(5, totalWeeks - 1), 'Wrap-up', ['Register for next semester', 'Check what finals are cumulative', 'Plan your study schedule']],
      [totalWeeks, 'Finals week', ['Check the final exam schedule', 'Plan study blocks per exam', 'Back up your notes', 'Celebrate when it’s done 🎉']],
    ]
    for (const [week, title, items] of starter) {
      if (guides.some((g) => g.week === week)) continue
      s.add('weekGuides', { id: uid(), semesterId: semester.id, week, title, items: items.map((t) => ({ id: uid(), text: t, done: false })) })
    }
  }

  return (
    <div className="pop-in">
      <PageHeader
        emoji="🏛️"
        title="College Calendar"
        subtitle={
          semester
            ? inSemester
              ? `Week ${currentWeek} of ${totalWeeks} · ${semester.name}`
              : `${semester.name} · ${formatDate(semester.startDate)} – ${formatDate(semester.endDate)}`
            : 'Create a semester to track weeks'
        }
        actions={
          <>
            {s.semesters.length > 0 && (
              <Select value={semester?.id ?? ''} onChange={(e) => s.setActiveSemester(e.target.value)} className="!w-auto">
                {s.semesters
                  .slice()
                  .sort((a, b) => b.startDate.localeCompare(a.startDate))
                  .map((x) => (
                    <option key={x.id} value={x.id}>{x.name}</option>
                  ))}
              </Select>
            )}
            <Btn onClick={() => fileRef.current?.click()} title="Import your school's published academic calendar (.ics)">⬆️ Import .ics</Btn>
            <input ref={fileRef} type="file" accept=".ics,text/calendar" className="hidden" onChange={(e) => onIcsFile(e.target.files?.[0])} />
            <Btn variant="primary" onClick={() => setEditingEvent('new')} disabled={!semester}>＋ Add date</Btn>
          </>
        }
      />

      {icsError && (
        <div className="mb-4 flex items-center justify-between rounded-2xl bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
          <span>⚠️ {icsError}</span>
          <button className="text-xs underline" onClick={() => setIcsError(null)}>dismiss</button>
        </div>
      )}

      {/* Week progress strip */}
      {semester && (
        <div className="mb-6 flex items-center gap-1.5 overflow-x-auto pb-1">
          {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((w) => {
            const hasGuide = guides.some((g) => g.week === w)
            const isNow = inSemester && w === currentWeek
            return (
              <div
                key={w}
                title={`Week ${w}${hasGuide ? ' — has a guide' : ''}`}
                className={cx(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-extrabold transition',
                  isNow
                    ? 'bg-gradient-to-br from-brand-500 to-bubble-500 text-white shadow-md shadow-brand-500/30'
                    : w < currentWeek && inSemester
                      ? 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
                  hasGuide && !isNow && 'ring-2 ring-brand-300 dark:ring-brand-500/50',
                )}
              >
                {w}
              </div>
            )
          })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* ---------- This week at a glance + week guides ---------- */}
        <div className="space-y-4 lg:col-span-2">
          <SectionTitle>📌 This week at a glance</SectionTitle>

          {currentGuide ? (
            <WeekGuideCard guide={currentGuide} current />
          ) : (
            <Card className="border-2 border-dashed !shadow-none border-slate-200 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-400">
                No guide for week {currentWeek} yet — add one so future-you knows what matters this week.
              </p>
              <Btn className="mt-3" onClick={() => setAddingWeek(true)}>＋ Add week {currentWeek} guide</Btn>
            </Card>
          )}

          <div className="flex items-center justify-between pt-2">
            <SectionTitle className="!mb-0">🗓️ Week-by-week guide</SectionTitle>
            <div className="flex gap-1.5">
              {guides.length === 0 && <Btn variant="soft" className="!px-3 !py-1.5 !text-xs" onClick={addStarterGuides}>✨ Starter guide</Btn>}
              <Btn variant="ghost" className="!px-3 !py-1.5 !text-xs" onClick={() => setAddingWeek(true)}>＋ Add week</Btn>
            </div>
          </div>

          {guides.filter((g) => g.week !== currentWeek).length === 0 && guides.length <= (currentGuide ? 1 : 0) ? (
            <p className="text-sm font-semibold text-slate-400">
              Guides for other weeks appear here. Try the ✨ starter guide for a sensible semester rhythm.
            </p>
          ) : (
            guides.filter((g) => g.week !== currentWeek).map((g) => <WeekGuideCard key={g.id} guide={g} dim={inSemester && g.week < currentWeek} />)
          )}
        </div>

        {/* ---------- Important dates ---------- */}
        <div className="lg:col-span-3">
          <SectionTitle>⭐ Important dates{semester ? ` — ${semester.name}` : ''}</SectionTitle>
          {semEvents.length === 0 ? (
            <EmptyState
              emoji="🏛️"
              title={`No academic dates for ${semester?.name ?? 'this semester'} yet`}
              hint="Import your school's published academic calendar (.ics), or add dates by hand — add/drop, breaks, registration, finals."
              action={
                <div className="flex gap-2">
                  <Btn onClick={() => fileRef.current?.click()}>⬆️ Import .ics</Btn>
                  <Btn variant="primary" onClick={() => setEditingEvent('new')}>Add one by hand</Btn>
                </div>
              }
            />
          ) : (
            <div className="space-y-5">
              {byMonth.map((group) => (
                <div key={group.label}>
                  <h3 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-slate-300 dark:text-slate-600">{group.label}</h3>
                  <div className="space-y-2">
                    {group.events.map((e) => (
                      <EventRow key={e.id} e={e} onEdit={() => setEditingEvent(e)} onDelete={() => s.remove('collegeEvents', e.id)} />
                    ))}
                  </div>
                </div>
              ))}
              {upcoming.length === 0 && <p className="py-4 text-center text-sm font-semibold text-slate-400">No upcoming dates — add next semester's calendar!</p>}
              {past.length > 0 && (
                <div>
                  <button className="text-xs font-extrabold uppercase tracking-widest text-slate-300 hover:text-slate-500 dark:text-slate-600" onClick={() => setShowPast(!showPast)}>
                    Past dates ({past.length}) {showPast ? '▾' : '▸'}
                  </button>
                  {showPast && (
                    <div className="mt-2 space-y-2 opacity-60">
                      {past.slice().reverse().map((e) => (
                        <EventRow key={e.id} e={e} onEdit={() => setEditingEvent(e)} onDelete={() => s.remove('collegeEvents', e.id)} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {editingEvent && semester && (
        <EventModal e={editingEvent === 'new' ? null : editingEvent} semesterId={semester.id} onClose={() => setEditingEvent(null)} />
      )}
      {addingWeek && semester && (
        <WeekModal totalWeeks={totalWeeks} defaultWeek={currentWeek} semesterId={semester.id} taken={new Set(guides.map((g) => g.week))} onClose={() => setAddingWeek(false)} />
      )}
      {icsEvents && semester && (
        <IcsImportModal
          parsed={icsEvents}
          semester={semester}
          existing={semEvents}
          onClose={() => setIcsEvents(null)}
        />
      )}
    </div>
  )
}

// ---------------- ICS import preview ----------------
function IcsImportModal({
  parsed, semester, existing, onClose,
}: {
  parsed: IcsEvent[]
  semester: { id: ID; name: string; startDate: string; endDate: string }
  existing: CollegeEvent[]
  onClose: () => void
}) {
  const add = useStore((s) => s.add)
  const already = new Set(existing.map((e) => `${e.title}|${e.date}`))
  const inRange = (e: IcsEvent) => e.date >= semester.startDate && e.date <= semester.endDate

  // Pre-check dates inside the semester that aren't already on the calendar
  const [checked, setChecked] = useState<Set<number>>(
    () => new Set(parsed.map((e, i) => (inRange(e) && !already.has(`${e.title}|${e.date}`) ? i : -1)).filter((i) => i !== -1)),
  )

  const toggle = (i: number) =>
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  const importChecked = () => {
    for (const i of checked) {
      const e = parsed[i]
      add('collegeEvents', {
        id: uid(),
        semesterId: semester.id,
        title: e.title,
        date: e.date,
        endDate: e.endDate,
        category: guessCategory(e.title),
        notes: e.description || undefined,
      })
    }
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={`Import into ${semester.name}`} wide>
      <p className="mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
        Found <b>{parsed.length}</b> event{parsed.length === 1 ? '' : 's'}. Dates inside {semester.name} are pre-selected — categories are
        guessed from the titles and can be edited after import.
      </p>
      <div className="max-h-[50vh] space-y-1 overflow-y-auto pr-1">
        {parsed.map((e, i) => {
          const dup = already.has(`${e.title}|${e.date}`)
          const meta = EVENT_CATEGORY_META[guessCategory(e.title)]
          return (
            <button
              key={i}
              disabled={dup}
              onClick={() => toggle(i)}
              className={cx(
                'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition',
                dup ? 'opacity-40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60',
              )}
            >
              <span
                className={cx(
                  'grid size-5 shrink-0 place-items-center rounded-md text-[10px] font-bold',
                  checked.has(i) ? 'bg-brand-500 text-white' : 'ring-2 ring-slate-300 dark:ring-slate-600',
                )}
              >
                {checked.has(i) ? '✓' : ''}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{e.title}</div>
                <div className="truncate text-xs font-semibold text-slate-400">
                  {formatDate(e.date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  {e.endDate && ` – ${formatDate(e.endDate, { month: 'short', day: 'numeric' })}`}
                  {dup && ' · already on your calendar'}
                  {!dup && !inRange(e) && ' · outside this semester'}
                </div>
              </div>
              <Chip className={cx('hidden sm:inline-flex', meta.chip)}>{meta.emoji} {meta.label}</Chip>
            </button>
          )
        })}
      </div>
      <div className="mt-5 flex items-center justify-between gap-2">
        <button
          className="text-xs font-bold text-slate-400 hover:text-brand-500 dark:hover:text-brand-300"
          onClick={() =>
            setChecked(checked.size === parsed.filter((e) => !already.has(`${e.title}|${e.date}`)).length
              ? new Set()
              : new Set(parsed.map((e, i) => (already.has(`${e.title}|${e.date}`) ? -1 : i)).filter((i) => i !== -1)))
          }
        >
          {checked.size > 0 ? 'Clear selection' : 'Select all'}
        </button>
        <div className="flex gap-2">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={importChecked} disabled={checked.size === 0}>
            Import {checked.size} date{checked.size === 1 ? '' : 's'}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}

// ---------------- Week guide card ----------------
function WeekGuideCard({ guide, current, dim }: { guide: WeekGuide; current?: boolean; dim?: boolean }) {
  const s = useStore()
  const [text, setText] = useState('')
  const done = guide.items.filter((i) => i.done).length

  const toggle = (itemId: string) =>
    s.update('weekGuides', guide.id, { items: guide.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) })
  const removeItem = (itemId: string) =>
    s.update('weekGuides', guide.id, { items: guide.items.filter((i) => i.id !== itemId) })
  const addItem = () => {
    const t = text.trim()
    if (!t) return
    s.update('weekGuides', guide.id, { items: [...guide.items, { id: uid(), text: t, done: false }] })
    setText('')
  }

  return (
    <Card className={cx(current && 'ring-2 !ring-brand-400', dim && 'opacity-60')}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold">Week {guide.week}{guide.title ? ` — ${guide.title}` : ''}</h3>
            {current && <Chip className="bg-gradient-to-r from-brand-500 to-bubble-500 text-white">now</Chip>}
          </div>
          {guide.items.length > 0 && (
            <p className="text-xs font-semibold text-slate-400">{done}/{guide.items.length} done</p>
          )}
        </div>
        <DeleteBtn small onDelete={() => s.remove('weekGuides', guide.id)} />
      </div>
      <div className="mt-2.5 space-y-1">
        {guide.items.map((i) => (
          <div key={i.id} className="group flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60">
            <button
              onClick={() => toggle(i.id)}
              className={cx(
                'grid size-5 shrink-0 place-items-center rounded-full text-[10px] transition',
                i.done ? 'bg-emerald-500 text-white' : 'ring-2 ring-slate-300 hover:ring-brand-400 dark:ring-slate-600',
              )}
            >
              {i.done ? '✓' : ''}
            </button>
            <span className={cx('flex-1 text-sm font-semibold', i.done && 'text-slate-400 line-through')}>{i.text}</span>
            <button onClick={() => removeItem(i.id)} className="hidden text-xs text-slate-300 hover:text-rose-500 group-hover:block" title="Remove">✕</button>
          </div>
        ))}
        <div className="flex items-center gap-2 pl-2 pt-0.5">
          <span className="grid size-5 place-items-center rounded-full text-slate-300 ring-2 ring-dashed ring-slate-200 dark:ring-slate-700">＋</span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="Add something to know or do…"
            className="flex-1 bg-transparent text-sm font-semibold placeholder:text-slate-300 focus:outline-none dark:placeholder:text-slate-600"
          />
        </div>
      </div>
    </Card>
  )
}

// ---------------- Event row ----------------
function EventRow({ e, onEdit, onDelete }: { e: CollegeEvent; onEdit: () => void; onDelete: () => void }) {
  const meta = EVENT_CATEGORY_META[e.category]
  const today = todayISO()
  const ongoing = e.endDate && e.date <= today && e.endDate >= today
  const dd = daysUntil(e.date)
  const d = parseISO(e.date)

  return (
    <Card className="flex items-center gap-3.5 !p-3.5" onClick={onEdit}>
      <div className="grid w-12 shrink-0 place-items-center rounded-2xl bg-slate-50 py-1.5 dark:bg-slate-800/70">
        <span className="text-[10px] font-extrabold uppercase text-slate-400">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
        <span className="text-lg font-extrabold leading-5">{d.getDate()}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold">{meta.emoji} {e.title}</div>
        <div className="truncate text-xs font-semibold text-slate-400">
          {formatDate(e.date, { weekday: 'short', month: 'short', day: 'numeric' })}
          {e.endDate && ` – ${formatDate(e.endDate, { weekday: 'short', month: 'short', day: 'numeric' })}`}
          {e.notes && ` · ${e.notes}`}
        </div>
      </div>
      <Chip className={cx('hidden sm:inline-flex', meta.chip)}>{meta.label}</Chip>
      <Chip
        className={
          ongoing
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
            : dd < 0
              ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
              : dd <= 7
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
        }
      >
        {ongoing ? 'happening now' : dd === 0 ? 'today' : dd === 1 ? 'tomorrow' : dd > 1 ? `in ${dd} days` : 'passed'}
      </Chip>
      <div onClick={(ev) => ev.stopPropagation()}>
        <DeleteBtn small onDelete={onDelete} />
      </div>
    </Card>
  )
}

// ---------------- Event add/edit ----------------
function EventModal({ e, semesterId, onClose }: { e: CollegeEvent | null; semesterId: ID; onClose: () => void }) {
  const s = useStore()
  const [title, setTitle] = useState(e?.title ?? '')
  const [date, setDate] = useState(e?.date ?? todayISO())
  const [endDate, setEndDate] = useState(e?.endDate ?? '')
  const [category, setCategory] = useState<CollegeEventCategory>(e?.category ?? 'academic')
  const [notes, setNotes] = useState(e?.notes ?? '')

  const save = () => {
    if (!title.trim()) return
    const data = {
      title: title.trim(),
      date,
      endDate: endDate && endDate > date ? endDate : undefined,
      category,
      notes: notes.trim() || undefined,
    }
    if (e) s.update('collegeEvents', e.id, data)
    else s.add('collegeEvents', { id: uid(), semesterId, ...data })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={e ? 'Edit important date' : 'Add important date'}>
      <div className="grid gap-4">
        <Field label="What is it?">
          <TextInput value={title} onChange={(ev) => setTitle(ev.target.value)} placeholder="e.g. Last day to add/drop" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><TextInput type="date" value={date} onChange={(ev) => setDate(ev.target.value)} /></Field>
          <Field label="End date (optional)"><TextInput type="date" value={endDate} onChange={(ev) => setEndDate(ev.target.value)} /></Field>
        </div>
        <Field label="Category">
          <Select value={category} onChange={(ev) => setCategory(ev.target.value as CollegeEventCategory)}>
            {Object.entries(EVENT_CATEGORY_META).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Notes (optional)">
          <TextArea value={notes} onChange={(ev) => setNotes(ev.target.value)} placeholder="Details worth remembering" className="!min-h-16" />
        </Field>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={save} disabled={!title.trim()}>{e ? 'Save' : 'Add date'}</Btn>
      </div>
    </Modal>
  )
}

// ---------------- Add a week guide ----------------
function WeekModal({
  totalWeeks, defaultWeek, semesterId, taken, onClose,
}: {
  totalWeeks: number
  defaultWeek: number
  semesterId: ID
  taken: Set<number>
  onClose: () => void
}) {
  const s = useStore()
  const [week, setWeek] = useState(taken.has(defaultWeek) ? defaultWeek + 1 : defaultWeek)
  const [title, setTitle] = useState('')

  const save = () => {
    s.add('weekGuides', { id: uid(), semesterId, week, title: title.trim(), items: [] })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Add a week guide">
      <div className="grid gap-4">
        <Field label="Which week?">
          <Select value={week} onChange={(e) => setWeek(Number(e.target.value))}>
            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w} disabled={taken.has(w)}>
                Week {w}{taken.has(w) ? ' (already has a guide)' : ''}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Label (optional)">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Midterm season" />
        </Field>
        <p className="text-xs font-semibold text-slate-400">You can add checklist items right on the card after creating it.</p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={save} disabled={taken.has(week)}>Add guide</Btn>
      </div>
    </Modal>
  )
}
