import { useState } from 'react'
import { useStore } from '../store'
import type { PortfolioItem, PortfolioType } from '../types'
import { formatDate, uid } from '../utils'
import { Btn, Card, Chip, cx, DeleteBtn, EmptyState, Field, Modal, PageHeader, Select, TextArea, TextInput } from '../components/ui'

const TYPE_META: Record<PortfolioType, { emoji: string; label: string; chip: string }> = {
  project: { emoji: '🛠️', label: 'Project', chip: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200' },
  award: { emoji: '🏆', label: 'Award', chip: 'bg-sun-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
  internship: { emoji: '💼', label: 'Internship', chip: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300' },
  research: { emoji: '🔬', label: 'Research', chip: 'bg-mint-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
  leadership: { emoji: '🧑‍🏫', label: 'Leadership', chip: 'bg-bubble-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300' },
  certification: { emoji: '📜', label: 'Certification', chip: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300' },
  other: { emoji: '✨', label: 'Other', chip: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
}

const PORTFOLIO_EMOJI = ['🛠️', '🏆', '💼', '🔬', '🧑‍🏫', '📜', '🚀', '🎨', '📱', '🌐', '🎤', '📊', '🤖', '📚', '🎬', '💡']

export default function Portfolio() {
  const s = useStore()
  const [editing, setEditing] = useState<PortfolioItem | 'new' | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | PortfolioType>('all')

  const items = s.portfolio
    .filter((p) => typeFilter === 'all' || p.type === typeFilter)
    .sort((a, b) => Number(b.featured) - Number(a.featured) || (b.date ?? '').localeCompare(a.date ?? ''))
  const featuredCount = s.portfolio.filter((p) => p.featured).length

  return (
    <div className="pop-in">
      <PageHeader
        emoji="💼"
        title="Portfolio"
        subtitle="The stuff you're proud of — ready for resumes and interviews"
        actions={<Btn variant="primary" onClick={() => setEditing('new')}>＋ Add accomplishment</Btn>}
      />

      {s.portfolio.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            onClick={() => setTypeFilter('all')}
            className={cx('rounded-full px-3 py-1.5 text-xs font-bold transition', typeFilter === 'all' ? 'bg-brand-500 text-white' : 'text-slate-500 ring-1 ring-slate-900/5 [background:var(--card-bg)] dark:ring-white/10')}
          >
            ✨ All ({s.portfolio.length})
          </button>
          {(Object.keys(TYPE_META) as PortfolioType[])
            .filter((t) => s.portfolio.some((p) => p.type === t))
            .map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cx('rounded-full px-3 py-1.5 text-xs font-bold transition', typeFilter === t ? 'bg-brand-500 text-white' : 'text-slate-500 ring-1 ring-slate-900/5 [background:var(--card-bg)] dark:ring-white/10')}
              >
                {TYPE_META[t].emoji} {TYPE_META[t].label}s
              </button>
            ))}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          emoji="🌟"
          title="Nothing in your portfolio yet"
          hint="Projects, hackathon wins, internships, research, club leadership — collect it all here so it's ready when opportunity knocks."
          action={<Btn variant="primary" onClick={() => setEditing('new')}>Add your first highlight</Btn>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => {
            const tm = TYPE_META[p.type]
            return (
              <Card
                key={p.id}
                onClick={() => setEditing(p)}
                className={cx('relative flex flex-col', p.featured && 'ring-2 !ring-sun-400/70')}
              >
                {p.featured && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-sun-400 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-900 shadow-sm">
                    ⭐ Highlight
                  </span>
                )}
                <div className="flex items-start justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-100 to-bubble-100 text-2xl dark:from-brand-500/25 dark:to-bubble-500/20">
                    {p.emoji}
                  </span>
                  <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="grid size-8 place-items-center rounded-full text-sm transition hover:bg-sun-100 dark:hover:bg-amber-500/15"
                      title={p.featured ? 'Remove from highlights' : 'Feature as a highlight'}
                      onClick={() => s.update('portfolio', p.id, { featured: !p.featured })}
                    >
                      {p.featured ? '⭐' : '☆'}
                    </button>
                    <DeleteBtn small onDelete={() => s.remove('portfolio', p.id)} />
                  </div>
                </div>
                <h3 className="mt-3 font-bold leading-tight">{p.title}</h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Chip className={tm.chip}>{tm.emoji} {tm.label}</Chip>
                  {p.date && <span className="text-xs font-bold text-slate-400">{formatDate(p.date, { month: 'short', year: 'numeric' })}</span>}
                </div>
                {p.description && (
                  <p className="mt-2.5 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">{p.description}</p>
                )}
                <div className="mt-auto pt-3">
                  {p.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {p.skills.map((skill) => (
                        <span key={skill} className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  {p.link && (
                    <a
                      href={p.link.startsWith('http') ? p.link : `https://${p.link}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-brand-500 hover:underline dark:text-brand-300"
                    >
                      🔗 View work →
                    </a>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {featuredCount > 0 && (
        <p className="mt-6 text-center text-xs font-semibold text-slate-400">
          💡 Tip: star your best {featuredCount === 1 ? 'item' : 'items'} — highlights float to the top, perfect for talking points in interviews.
        </p>
      )}

      {editing && <PortfolioModal item={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function PortfolioModal({ item, onClose }: { item: PortfolioItem | null; onClose: () => void }) {
  const s = useStore()
  const [title, setTitle] = useState(item?.title ?? '')
  const [emoji, setEmoji] = useState(item?.emoji ?? '🛠️')
  const [type, setType] = useState<PortfolioType>(item?.type ?? 'project')
  const [date, setDate] = useState(item?.date ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [link, setLink] = useState(item?.link ?? '')
  const [skills, setSkills] = useState(item?.skills.join(', ') ?? '')

  const save = () => {
    if (!title.trim()) return
    const data = {
      title: title.trim(),
      emoji,
      type,
      date: date || undefined,
      description: description.trim(),
      link: link.trim() || undefined,
      skills: skills.split(',').map((x) => x.trim()).filter(Boolean),
    }
    if (item) s.update('portfolio', item.id, data)
    else s.add('portfolio', { id: uid(), featured: false, ...data })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={item ? 'Edit accomplishment' : 'Add accomplishment'} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" className="sm:col-span-2">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Built the club's event website" autoFocus />
        </Field>
        <Field label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value as PortfolioType)}>
            {Object.entries(TYPE_META).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Date (optional)">
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Emoji" className="sm:col-span-2">
          <div className="flex flex-wrap gap-1.5">
            {PORTFOLIO_EMOJI.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setEmoji(em)}
                className={cx('grid size-9 place-items-center rounded-xl text-lg transition', emoji === em ? 'bg-brand-100 ring-2 ring-brand-400 dark:bg-brand-500/25' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700')}
              >
                {em}
              </button>
            ))}
          </div>
        </Field>
        <Field label="What did you do? Why does it matter?" className="sm:col-span-2">
          <TextArea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="1–3 sentences. Numbers impress: users, teammates, results…" />
        </Field>
        <Field label="Link (optional)">
          <TextInput value={link} onChange={(e) => setLink(e.target.value)} placeholder="github.com/you/project" />
        </Field>
        <Field label="Skills (comma-separated)">
          <TextInput value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. Python, Figma, public speaking" />
        </Field>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={save} disabled={!title.trim()}>{item ? 'Save changes' : 'Add it'}</Btn>
      </div>
    </Modal>
  )
}
