import { useState } from 'react'
import { useStore } from '../store'
import type { Habit } from '../types'
import { addDays, DAY_SHORT, toISODate, todayISO, uid, weekdayIndex, weekStart } from '../utils'
import { Btn, Card, cx, DeleteBtn, EmptyState, Field, Modal, PageHeader, ProgressBar, StatTile, TextInput } from '../components/ui'

const HABIT_EMOJI = ['💪', '📖', '😴', '💧', '🧘', '🏃', '🥗', '🚫', '🦷', '📵', '☀️', '💊', '🎸', '🧹', '💌', '🪥']

/** Consecutive days ending today (or yesterday, if today unchecked) */
function streak(h: Habit): number {
  let count = 0
  let d = new Date()
  if (!h.log[toISODate(d)]) d = addDays(d, -1) // today not done yet doesn't break the streak
  while (h.log[toISODate(d)]) {
    count++
    d = addDays(d, -1)
  }
  return count
}

export default function Habits() {
  const s = useStore()
  const [adding, setAdding] = useState(false)
  const today = todayISO()
  const now = new Date()
  const ws = weekStart(now)
  const weekDates = Array.from({ length: 7 }, (_, i) => toISODate(addDays(ws, i)))
  const todayIdx = weekdayIndex(now)

  const doneToday = s.habits.filter((h) => h.log[today]).length
  const bestStreak = Math.max(0, ...s.habits.map(streak))
  const weekChecks = s.habits.reduce((sum, h) => sum + weekDates.filter((d) => h.log[d]).length, 0)
  const weekTarget = s.habits.reduce((sum, h) => sum + h.target, 0)

  return (
    <div className="pop-in">
      <PageHeader
        emoji="✅"
        title="Habit Tracker"
        subtitle="Small wins, every day"
        actions={<Btn variant="primary" onClick={() => setAdding(true)}>＋ New habit</Btn>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile emoji="☀️" label="Done today" value={`${doneToday}/${s.habits.length || 0}`} />
        <StatTile emoji="🔥" label="Best streak" value={`${bestStreak} day${bestStreak === 1 ? '' : 's'}`} />
        <StatTile emoji="📊" label="This week" value={weekTarget > 0 ? `${Math.round((weekChecks / weekTarget) * 100)}%` : '—'} sub={`${weekChecks} of ${weekTarget} check-ins`} />
        <StatTile emoji="🌱" label="Habits" value={String(s.habits.length)} />
      </div>

      {s.habits.length === 0 ? (
        <EmptyState
          emoji="🌱"
          title="No habits yet"
          hint="Pick a few small things to do consistently — workouts, reading, sleep, water…"
          action={<Btn variant="primary" onClick={() => setAdding(true)}>Start a habit</Btn>}
        />
      ) : (
        <Card className="overflow-x-auto">
          <div className="min-w-[660px]">
          {/* Week header */}
          <div className="grid items-center gap-2" style={{ gridTemplateColumns: '1fr repeat(7, 44px) 90px 40px' }}>
            <span />
            {weekDates.map((d, i) => (
              <div key={d} className="text-center">
                <div className={cx('text-[10px] font-extrabold uppercase', i === todayIdx ? 'text-brand-500 dark:text-brand-300' : 'text-slate-300 dark:text-slate-600')}>
                  {DAY_SHORT[i]}
                </div>
                <div className={cx('text-xs font-bold', i === todayIdx ? 'text-brand-600 dark:text-brand-300' : 'text-slate-400')}>
                  {Number(d.slice(8))}
                </div>
              </div>
            ))}
            <span className="text-center text-[10px] font-extrabold uppercase text-slate-300 dark:text-slate-600">week</span>
            <span />
          </div>

          <div className="mt-2 space-y-1">
            {s.habits.map((h) => {
              const weekCount = weekDates.filter((d) => h.log[d]).length
              const st = streak(h)
              return (
                <div
                  key={h.id}
                  className="grid items-center gap-2 rounded-2xl px-0 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  style={{ gridTemplateColumns: '1fr repeat(7, 44px) 90px 40px' }}
                >
                  <div className="min-w-0 pl-2">
                    <div className="truncate text-sm font-bold">{h.emoji} {h.name}</div>
                    <div className="text-[11px] font-semibold text-slate-400">
                      {st > 0 ? `🔥 ${st}-day streak` : 'no streak yet'} · goal {h.target}×/wk
                    </div>
                  </div>
                  {weekDates.map((d, i) => {
                    const done = !!h.log[d]
                    const future = i > todayIdx
                    return (
                      <button
                        key={d}
                        disabled={future}
                        onClick={() => s.toggleHabitDay(h.id, d)}
                        className={cx(
                          'mx-auto grid size-8 place-items-center rounded-xl text-sm font-bold transition',
                          done
                            ? 'bg-gradient-to-br from-mint-400 to-emerald-500 text-white shadow-sm'
                            : future
                              ? 'bg-slate-50 text-slate-200 dark:bg-slate-800/40 dark:text-slate-700'
                              : 'bg-slate-100 text-slate-300 hover:bg-mint-100 hover:text-emerald-500 dark:bg-slate-800 dark:text-slate-600 dark:hover:bg-emerald-500/20',
                        )}
                      >
                        {done ? '✓' : '·'}
                      </button>
                    )
                  })}
                  <div className="px-1">
                    <ProgressBar
                      value={(weekCount / h.target) * 100}
                      barClassName={weekCount >= h.target ? '!bg-emerald-400 !bg-none' : undefined}
                    />
                    <div className="mt-0.5 text-center text-[10px] font-bold text-slate-400">{weekCount}/{h.target}</div>
                  </div>
                  <DeleteBtn small onDelete={() => s.remove('habits', h.id)} />
                </div>
              )
            })}
          </div>
          </div>
        </Card>
      )}

      {adding && <HabitModal onClose={() => setAdding(false)} />}
    </div>
  )
}

function HabitModal({ onClose }: { onClose: () => void }) {
  const add = useStore((s) => s.add)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('💪')
  const [target, setTarget] = useState(5)

  const save = () => {
    if (!name.trim()) return
    add('habits', { id: uid(), name: name.trim(), emoji, target, log: {} })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="New habit">
      <div className="grid gap-4">
        <Field label="Habit">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Drink 2L of water" autoFocus />
        </Field>
        <Field label="Icon">
          <div className="flex flex-wrap gap-1.5">
            {HABIT_EMOJI.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={cx('grid size-9 place-items-center rounded-xl text-lg transition', emoji === e ? 'bg-brand-100 ring-2 ring-brand-400 dark:bg-brand-500/25' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700')}
              >
                {e}
              </button>
            ))}
          </div>
        </Field>
        <Field label={`Weekly goal: ${target}× per week`}>
          <input type="range" min={1} max={7} value={target} onChange={(e) => setTarget(Number(e.target.value))} className="w-full accent-brand-500" />
        </Field>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={save} disabled={!name.trim()}>Start tracking</Btn>
      </div>
    </Modal>
  )
}
