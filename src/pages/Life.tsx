import { useState } from 'react'
import { useStore } from '../store'
import type { EventCategory, Goal, MediaItem, MediaKind, MediaStatus, Meal, SocialEvent } from '../types'
import { daysUntil, formatDate, formatTime, todayISO, uid } from '../utils'
import { Btn, Card, Chip, cx, DeleteBtn, EmptyState, Field, Modal, PageHeader, ProgressBar, Select, TextArea, TextInput } from '../components/ui'

type Tab = 'events' | 'goals' | 'lists' | 'meals'

const TABS: { key: Tab; emoji: string; label: string }[] = [
  { key: 'events', emoji: '🎉', label: 'Events' },
  { key: 'goals', emoji: '🎯', label: 'Goals' },
  { key: 'lists', emoji: '📚', label: 'Read & Watch' },
  { key: 'meals', emoji: '🍳', label: 'Meal Ideas' },
]

export default function Life() {
  const [tab, setTab] = useState<Tab>('events')

  return (
    <div className="pop-in">
      <PageHeader emoji="🎉" title="Social & Goals" subtitle="College is more than classes" />

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cx(
              'rounded-full px-4 py-2 text-sm font-bold transition',
              tab === t.key
                ? 'bg-gradient-to-r from-brand-500 to-bubble-500 text-white shadow-md shadow-brand-500/25'
                : 'text-slate-500 ring-1 ring-slate-900/5 [background:var(--card-bg)] hover:brightness-[0.98] dark:text-slate-400 dark:ring-white/10 dark:hover:brightness-110',
            )}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {tab === 'events' && <EventsTab />}
      {tab === 'goals' && <GoalsTab />}
      {tab === 'lists' && <ListsTab />}
      {tab === 'meals' && <MealsTab />}
    </div>
  )
}

// ================= Events =================
const EVENT_CATEGORIES: Record<EventCategory, { emoji: string; label: string; chip: string }> = {
  social: { emoji: '🎉', label: 'Social', chip: 'bg-bubble-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300' },
  club: { emoji: '🤝', label: 'Club', chip: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200' },
  sports: { emoji: '⚽', label: 'Sports', chip: 'bg-mint-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
  family: { emoji: '🏡', label: 'Family', chip: 'bg-sun-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
  other: { emoji: '✨', label: 'Other', chip: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
}

function EventsTab() {
  const s = useStore()
  const [editing, setEditing] = useState<SocialEvent | 'new' | null>(null)
  const today = todayISO()

  const upcoming = s.events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const past = s.events.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Btn variant="primary" onClick={() => setEditing('new')}>＋ Add event</Btn>
      </div>
      {s.events.length === 0 ? (
        <EmptyState emoji="🗓️" title="Nothing planned" hint="Parties, club meetings, games, calls home — put your fun on the calendar too." action={<Btn variant="primary" onClick={() => setEditing('new')}>Plan something</Btn>} />
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {upcoming.map((e) => {
              const cat = EVENT_CATEGORIES[e.category]
              const dd = daysUntil(e.date)
              return (
                <Card key={e.id} onClick={() => setEditing(e)} className="relative">
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{e.emoji}</span>
                    <div onClick={(ev) => ev.stopPropagation()}>
                      <DeleteBtn small onDelete={() => s.remove('events', e.id)} />
                    </div>
                  </div>
                  <h3 className="mt-2 font-bold leading-tight">{e.title}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {formatDate(e.date, { weekday: 'long', month: 'short', day: 'numeric' })}
                    {e.time && ` · ${formatTime(e.time)}`}
                    {e.location && ` · 📍 ${e.location}`}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Chip className={cat.chip}>{cat.emoji} {cat.label}</Chip>
                    <Chip className={dd <= 1 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}>
                      {dd === 0 ? 'today!' : dd === 1 ? 'tomorrow' : `in ${dd} days`}
                    </Chip>
                  </div>
                </Card>
              )
            })}
          </div>
          {past.length > 0 && (
            <details className="mt-6">
              <summary className="cursor-pointer font-display text-sm font-bold uppercase tracking-wider text-slate-400">Past events ({past.length})</summary>
              <div className="mt-3 grid gap-3 opacity-60 md:grid-cols-2 xl:grid-cols-3">
                {past.map((e) => (
                  <Card key={e.id} className="!p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{e.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold">{e.title}</div>
                        <div className="text-xs font-semibold text-slate-400">{formatDate(e.date)}</div>
                      </div>
                      <DeleteBtn small onDelete={() => s.remove('events', e.id)} />
                    </div>
                  </Card>
                ))}
              </div>
            </details>
          )}
        </>
      )}
      {editing && <EventModal e={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

const EVENT_EMOJI = ['🎉', '🍿', '🎂', '🎮', '⚽', '🏀', '🎵', '🍕', '☕', '🤖', '📞', '🏖️', '🎬', '💃', '🧗', '🎳']

function EventModal({ e, onClose }: { e: SocialEvent | null; onClose: () => void }) {
  const s = useStore()
  const [title, setTitle] = useState(e?.title ?? '')
  const [date, setDate] = useState(e?.date ?? todayISO())
  const [time, setTime] = useState(e?.time ?? '')
  const [location, setLocation] = useState(e?.location ?? '')
  const [emoji, setEmoji] = useState(e?.emoji ?? '🎉')
  const [category, setCategory] = useState<EventCategory>(e?.category ?? 'social')

  const save = () => {
    if (!title.trim()) return
    const data = { title: title.trim(), date, time: time || undefined, location: location.trim() || undefined, emoji, category }
    if (e) s.update('events', e.id, data)
    else s.add('events', { id: uid(), ...data })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={e ? 'Edit event' : 'Add event'}>
      <div className="grid gap-4">
        <Field label="What's happening?">
          <TextInput value={title} onChange={(ev) => setTitle(ev.target.value)} placeholder="e.g. Trivia night at the union" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><TextInput type="date" value={date} onChange={(ev) => setDate(ev.target.value)} /></Field>
          <Field label="Time (optional)"><TextInput type="time" value={time} onChange={(ev) => setTime(ev.target.value)} /></Field>
        </div>
        <Field label="Location (optional)">
          <TextInput value={location} onChange={(ev) => setLocation(ev.target.value)} placeholder="e.g. Student union" />
        </Field>
        <Field label="Type">
          <Select value={category} onChange={(ev) => setCategory(ev.target.value as EventCategory)}>
            {Object.entries(EVENT_CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Emoji">
          <div className="flex flex-wrap gap-1.5">
            {EVENT_EMOJI.map((em) => (
              <button key={em} type="button" onClick={() => setEmoji(em)} className={cx('grid size-9 place-items-center rounded-xl text-lg transition', emoji === em ? 'bg-brand-100 ring-2 ring-brand-400 dark:bg-brand-500/25' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700')}>
                {em}
              </button>
            ))}
          </div>
        </Field>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={save} disabled={!title.trim()}>{e ? 'Save' : 'Add event'}</Btn>
      </div>
    </Modal>
  )
}

// ================= Goals =================
const GOAL_CATEGORIES = {
  academic: { emoji: '🎓', label: 'Academic' },
  health: { emoji: '💪', label: 'Health' },
  career: { emoji: '💼', label: 'Career' },
  personal: { emoji: '🌱', label: 'Personal' },
  financial: { emoji: '🐷', label: 'Financial' },
} as const

function GoalsTab() {
  const s = useStore()
  const [adding, setAdding] = useState(false)

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Btn variant="primary" onClick={() => setAdding(true)}>＋ New goal</Btn>
      </div>
      {s.goals.length === 0 ? (
        <EmptyState emoji="🎯" title="No goals yet" hint="Dream a little! Dean's list, an internship, a savings target…" action={<Btn variant="primary" onClick={() => setAdding(true)}>Set a goal</Btn>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {s.goals.map((g) => {
            const done = g.milestones.filter((m) => m.done).length
            const pct = g.milestones.length > 0 ? (done / g.milestones.length) * 100 : 0
            const complete = g.milestones.length > 0 && done === g.milestones.length
            return (
              <Card key={g.id} className={cx(complete && 'ring-2 !ring-emerald-300 dark:!ring-emerald-500/50')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{g.emoji}</span>
                    <div>
                      <h3 className="font-bold leading-tight">{g.title} {complete && '🎊'}</h3>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        {GOAL_CATEGORIES[g.category].label}
                        {g.targetDate && ` · by ${formatDate(g.targetDate)}`}
                      </p>
                    </div>
                  </div>
                  <DeleteBtn small onDelete={() => s.remove('goals', g.id)} />
                </div>
                <div className="mt-3">
                  <ProgressBar value={pct} barClassName={complete ? '!bg-emerald-400 !bg-none' : undefined} />
                  <p className="mt-1 text-right text-[11px] font-bold text-slate-400">{done}/{g.milestones.length} milestones</p>
                </div>
                <div className="mt-2 space-y-1">
                  {g.milestones.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => s.update('goals', g.id, { milestones: g.milestones.map((x) => (x.id === m.id ? { ...x, done: !x.done } : x)) })}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                      <span className={cx('grid size-5 shrink-0 place-items-center rounded-full text-[10px]', m.done ? 'bg-emerald-500 text-white' : 'ring-2 ring-slate-300 dark:ring-slate-600')}>
                        {m.done ? '✓' : ''}
                      </span>
                      <span className={cx(m.done && 'text-slate-400 line-through')}>{m.text}</span>
                    </button>
                  ))}
                  <MilestoneAdder goal={g} />
                </div>
              </Card>
            )
          })}
        </div>
      )}
      {adding && <GoalModal onClose={() => setAdding(false)} />}
    </div>
  )
}

function MilestoneAdder({ goal }: { goal: Goal }) {
  const s = useStore()
  const [text, setText] = useState('')
  const submit = () => {
    const t = text.trim()
    if (!t) return
    s.update('goals', goal.id, { milestones: [...goal.milestones, { id: uid(), text: t, done: false }] })
    setText('')
  }
  return (
    <div className="flex items-center gap-2 pl-1 pt-1">
      <span className="grid size-5 place-items-center rounded-full text-slate-300 ring-2 ring-dashed ring-slate-200 dark:ring-slate-700">＋</span>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Add a milestone…"
        className="flex-1 bg-transparent text-sm font-semibold placeholder:text-slate-300 focus:outline-none dark:placeholder:text-slate-600"
      />
    </div>
  )
}

const GOAL_EMOJI = ['🎯', '🏆', '💼', '🐷', '💪', '🌱', '📚', '✈️', '🏃', '🧠', '🎸', '❤️']

function GoalModal({ onClose }: { onClose: () => void }) {
  const s = useStore()
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('🎯')
  const [category, setCategory] = useState<Goal['category']>('personal')
  const [targetDate, setTargetDate] = useState('')

  const save = () => {
    if (!title.trim()) return
    s.add('goals', { id: uid(), title: title.trim(), emoji, category, targetDate: targetDate || undefined, milestones: [] })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="New goal">
      <div className="grid gap-4">
        <Field label="Goal">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Run a 5K" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value as Goal['category'])}>
              {Object.entries(GOAL_CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Target date (optional)">
            <TextInput type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Emoji">
          <div className="flex flex-wrap gap-1.5">
            {GOAL_EMOJI.map((em) => (
              <button key={em} type="button" onClick={() => setEmoji(em)} className={cx('grid size-9 place-items-center rounded-xl text-lg transition', emoji === em ? 'bg-brand-100 ring-2 ring-brand-400 dark:bg-brand-500/25' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700')}>
                {em}
              </button>
            ))}
          </div>
        </Field>
        <p className="text-xs font-semibold text-slate-400">You can add milestones to break it down after creating it.</p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={save} disabled={!title.trim()}>Create goal</Btn>
      </div>
    </Modal>
  )
}

// ================= Read & Watch =================
const KIND_META: Record<MediaKind, { emoji: string; label: string }> = {
  book: { emoji: '📖', label: 'Book' },
  movie: { emoji: '🎬', label: 'Movie' },
  show: { emoji: '📺', label: 'Show' },
}
const STATUS_META: Record<MediaStatus, { label: string; chip: string }> = {
  planned: { label: 'Up next', chip: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
  'in-progress': { label: 'In progress', chip: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300' },
  done: { label: 'Finished', chip: 'bg-mint-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
}

function ListsTab() {
  const s = useStore()
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<MediaKind>('book')
  const [filter, setFilter] = useState<'all' | MediaKind>('all')

  const submit = () => {
    const t = title.trim()
    if (!t) return
    s.add('media', { id: uid(), title: t, kind, status: 'planned' })
    setTitle('')
  }

  const items = s.media.filter((m) => filter === 'all' || m.kind === filter)
  const cycle = (m: MediaItem) => {
    const next: Record<MediaStatus, MediaStatus> = { planned: 'in-progress', 'in-progress': 'done', done: 'planned' }
    s.update('media', m.id, { status: next[m.status] })
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="h-fit">
        <h3 className="mb-3 font-bold">Add to your list</h3>
        <div className="grid gap-3">
          <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
            {(Object.keys(KIND_META) as MediaKind[]).map((k) => (
              <button key={k} onClick={() => setKind(k)} className={cx('rounded-xl py-1.5 text-sm font-bold transition', kind === k ? 'bg-white shadow dark:bg-slate-700' : 'text-slate-400')}>
                {KIND_META[k].emoji} {KIND_META[k].label}
              </button>
            ))}
          </div>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder={kind === 'book' ? 'e.g. Dune' : kind === 'movie' ? 'e.g. Interstellar' : 'e.g. The Bear'} />
          <Btn variant="primary" onClick={submit} disabled={!title.trim()}>Add {KIND_META[kind].label.toLowerCase()}</Btn>
        </div>
      </Card>

      <div className="lg:col-span-2">
        <div className="mb-3 flex gap-2">
          {(['all', 'book', 'movie', 'show'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cx('rounded-full px-3 py-1.5 text-xs font-bold transition', filter === f ? 'bg-brand-500 text-white' : 'text-slate-500 ring-1 ring-slate-900/5 [background:var(--card-bg)] dark:ring-white/10')}>
              {f === 'all' ? '✨ All' : `${KIND_META[f].emoji} ${KIND_META[f].label}s`}
            </button>
          ))}
        </div>
        {items.length === 0 ? (
          <EmptyState emoji="🍿" title="List is empty" hint="Track books to read and things to watch when you finally have free time." />
        ) : (
          <div className="space-y-2">
            {items.map((m) => (
              <Card key={m.id} className="flex items-center gap-3 !p-3.5">
                <span className="text-xl">{KIND_META[m.kind].emoji}</span>
                <span className={cx('min-w-0 flex-1 truncate text-sm font-bold', m.status === 'done' && 'text-slate-400')}>{m.title}</span>
                {m.status === 'done' && (
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => s.update('media', m.id, { rating: n === m.rating ? undefined : n })} className="text-sm" title={`${n} star${n > 1 ? 's' : ''}`}>
                        {m.rating && n <= m.rating ? '⭐' : '☆'}
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => cycle(m)} title="Click to change status">
                  <Chip className={cx(STATUS_META[m.status].chip, 'cursor-pointer')}>{STATUS_META[m.status].label}</Chip>
                </button>
                <DeleteBtn small onDelete={() => s.remove('media', m.id)} />
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ================= Meals =================
const MEAL_CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
const MEAL_CAT_META: Record<Meal['category'], { emoji: string; label: string }> = {
  breakfast: { emoji: '🌅', label: 'Breakfast' },
  lunch: { emoji: '🥪', label: 'Lunch' },
  dinner: { emoji: '🍝', label: 'Dinner' },
  snack: { emoji: '🍎', label: 'Snacks' },
}
const MEAL_EMOJI = ['🍳', '🥣', '🥪', '🌯', '🍝', '🍕', '🥗', '🍜', '🍚', '🌮', '🍎', '🧇', '🥞', '🍗', '🍙', '🫐']

function MealsTab() {
  const s = useStore()
  const [adding, setAdding] = useState(false)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-400">Cheap, quick ideas for when the dining hall fails you 🍜</p>
        <Btn variant="primary" onClick={() => setAdding(true)}>＋ Add meal idea</Btn>
      </div>
      {s.meals.length === 0 ? (
        <EmptyState emoji="🍳" title="No meal ideas saved" hint="Save go-to recipes and dorm-friendly meals so 'what do I eat' is never a crisis." action={<Btn variant="primary" onClick={() => setAdding(true)}>Add one</Btn>} />
      ) : (
        <div className="space-y-6">
          {MEAL_CATEGORIES.map((cat) => {
            const meals = s.meals.filter((m) => m.category === cat)
            if (meals.length === 0) return null
            return (
              <div key={cat}>
                <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wider text-slate-400">
                  {MEAL_CAT_META[cat].emoji} {MEAL_CAT_META[cat].label}
                </h2>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {meals.map((m) => (
                    <Card key={m.id} className="!p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{m.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-bold">{m.name}</span>
                            <button onClick={() => s.update('meals', m.id, { favorite: !m.favorite })} title="Favorite">
                              {m.favorite ? '💛' : '🤍'}
                            </button>
                          </div>
                          {m.minutes !== undefined && <div className="text-xs font-semibold text-slate-400">⏱️ {m.minutes} min</div>}
                          {m.recipe && <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">{m.recipe}</p>}
                        </div>
                        <DeleteBtn small onDelete={() => s.remove('meals', m.id)} />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {adding && <MealModal onClose={() => setAdding(false)} />}
    </div>
  )
}

function MealModal({ onClose }: { onClose: () => void }) {
  const s = useStore()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🍳')
  const [category, setCategory] = useState<Meal['category']>('dinner')
  const [minutes, setMinutes] = useState('15')
  const [recipe, setRecipe] = useState('')

  const save = () => {
    if (!name.trim()) return
    s.add('meals', {
      id: uid(), name: name.trim(), emoji, category,
      minutes: minutes ? Number(minutes) : undefined,
      recipe: recipe.trim() || undefined, favorite: false,
    })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Add meal idea">
      <div className="grid gap-4">
        <Field label="Meal">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Microwave mac & cheese +" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="When">
            <Select value={category} onChange={(e) => setCategory(e.target.value as Meal['category'])}>
              {MEAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>{MEAL_CAT_META[c].emoji} {MEAL_CAT_META[c].label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Prep time (min)">
            <TextInput type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          </Field>
        </div>
        <Field label="Emoji">
          <div className="flex flex-wrap gap-1.5">
            {MEAL_EMOJI.map((em) => (
              <button key={em} type="button" onClick={() => setEmoji(em)} className={cx('grid size-9 place-items-center rounded-xl text-lg transition', emoji === em ? 'bg-brand-100 ring-2 ring-brand-400 dark:bg-brand-500/25' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700')}>
                {em}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Recipe / notes (optional)">
          <TextArea value={recipe} onChange={(e) => setRecipe(e.target.value)} placeholder="Ingredients, steps, hacks…" className="!min-h-20" />
        </Field>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={save} disabled={!name.trim()}>Save idea</Btn>
      </div>
    </Modal>
  )
}
