import { useState } from 'react'
import type { PageKey } from '../App'
import { useStore } from '../store'
import type { QuickTask } from '../types'
import {
  courseColor, dailyPick, daysUntil, formatDate, formatTime, gpaFor, monthKey, fmtMoney,
  relativeDue, semesterTotalWeeks, semesterWeekOf, todayISO, uid, weekdayIndex, weekStart,
  toISODate, timeToMinutes, plural,
} from '../utils'
import { EVENT_CATEGORY_META } from './CollegeCalendar'
import { Btn, Card, Chip, cx, ProgressBar, SectionTitle, TextInput } from '../components/ui'

const QUOTES = [
  { text: 'The secret of getting ahead is getting started.', by: 'Mark Twain' },
  { text: 'It always seems impossible until it’s done.', by: 'Nelson Mandela' },
  { text: 'Little by little, one travels far.', by: 'J.R.R. Tolkien' },
  { text: 'You don’t have to be great to start, but you have to start to be great.', by: 'Zig Ziglar' },
  { text: 'Success is the sum of small efforts, repeated day in and day out.', by: 'Robert Collier' },
  { text: 'Focus on progress, not perfection.', by: 'Unknown' },
  { text: 'The future depends on what you do today.', by: 'Mahatma Gandhi' },
  { text: 'Dream big. Start small. Act now.', by: 'Robin Sharma' },
  { text: 'A year from now you may wish you had started today.', by: 'Karen Lamb' },
  { text: 'Done is better than perfect.', by: 'Sheryl Sandberg' },
]

export default function Dashboard({ go }: { go: (p: PageKey) => void }) {
  const s = useStore()
  const today = todayISO()
  const now = new Date()
  const quote = dailyPick(QUOTES)

  const activeCourses = s.courses.filter((c) => c.status !== 'completed' && (!s.activeSemesterId || c.semesterId === s.activeSemesterId))
  const courseById = new Map(s.courses.map((c) => [c.id, c]))

  // Today's classes
  const todayIdx = weekdayIndex(now)
  const todaysClasses = activeCourses
    .flatMap((c) => c.meetings.filter((m) => m.day === todayIdx).map((m) => ({ course: c, m })))
    .sort((a, b) => timeToMinutes(a.m.start) - timeToMinutes(b.m.start))

  // Assignments due soon (overdue + next 7 days, not done)
  const dueSoon = s.assignments
    .filter((a) => a.status !== 'done' && daysUntil(a.dueDate) <= 7)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 6)

  // Habits today
  const habitsDone = s.habits.filter((h) => h.log[today]).length

  // Study minutes this week
  const ws = toISODate(weekStart(now))
  const studyMin = s.sessions.filter((x) => x.date >= ws).reduce((sum, x) => sum + x.minutes, 0)

  // Budget this month
  const mk = monthKey(today)
  const spent = s.transactions.filter((t) => t.type === 'expense' && monthKey(t.date) === mk).reduce((sum, t) => sum + t.amount, 0)
  const budgetPct = s.settings.monthlyBudget > 0 ? (spent / s.settings.monthlyBudget) * 100 : 0

  // GPA
  const gpa = gpaFor(activeCourses, s.grades)

  // Events upcoming
  const upcoming = s.events
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4)

  const hour = now.getHours()
  const greeting = hour < 5 ? 'Burning the midnight oil' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="pop-in">
      {/* Hero */}
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-brand-500 via-brand-400 to-bubble-400 p-6 text-white shadow-lg shadow-brand-500/25">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm font-bold uppercase tracking-widest text-white/70">
              {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <h1 className="mt-1 text-3xl font-bold">
              {greeting}{s.settings.name ? `, ${s.settings.name}` : ''}! 👋
            </h1>
            <p className="mt-2 max-w-xl text-sm font-semibold text-white/85">
              “{quote.text}” <span className="text-white/60">— {quote.by}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Btn variant="soft" className="!bg-white/20 !text-white hover:!bg-white/30" onClick={() => go('focus')}>⏱️ Start focusing</Btn>
            <Btn variant="soft" className="!bg-white/20 !text-white hover:!bg-white/30" onClick={() => go('assignments')}>📝 Add assignment</Btn>
          </div>
        </div>
      </div>

      {/* Stat row */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat emoji="🔥" label="Due this week" value={String(dueSoon.filter((a) => daysUntil(a.dueDate) >= 0).length)} onClick={() => go('assignments')} />
        <MiniStat emoji="🏫" label="Classes today" value={String(todaysClasses.length)} onClick={() => go('timetable')} />
        <MiniStat emoji="🎯" label="Current GPA" value={gpa === null ? '—' : gpa.toFixed(2)} onClick={() => go('grades')} />
        <MiniStat emoji="📖" label="Study this week" value={studyMin >= 60 ? `${(studyMin / 60).toFixed(1)}h` : `${studyMin}m`} onClick={() => go('focus')} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* This week at a glance */}
          <WeekAtAGlance go={go} />

          {/* Due soon */}
          <Card>
            <div className="flex items-center justify-between">
              <SectionTitle className="!mb-0">⏳ Due soon</SectionTitle>
              <button className="text-xs font-bold text-brand-500 hover:underline dark:text-brand-300" onClick={() => go('assignments')}>view all →</button>
            </div>
            <div className="mt-3 space-y-2">
              {dueSoon.length === 0 && <p className="py-6 text-center text-sm font-semibold text-slate-400">Nothing due this week — you’re free! 🎉</p>}
              {dueSoon.map((a) => {
                const course = a.courseId ? courseById.get(a.courseId) : undefined
                const overdue = daysUntil(a.dueDate) < 0
                const cc = course ? courseColor(course.color) : null
                return (
                  <div key={a.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/60">
                    <span className="text-lg">{TYPE_EMOJI[a.type]}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold">{a.title}</div>
                      <div className="text-xs font-semibold text-slate-400">
                        {course ? `${course.code} · ` : ''}{a.dueTime ? `${formatTime(a.dueTime)} · ` : ''}{formatDate(a.dueDate, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    {cc && <span className={cx('hidden sm:inline-flex', 'rounded-full px-2.5 py-0.5 text-xs font-bold', cc.bg)}>{course!.code}</span>}
                    <Chip className={overdue ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' : daysUntil(a.dueDate) <= 1 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' : 'bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}>
                      {relativeDue(a.dueDate)}
                    </Chip>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Today's classes */}
          <Card>
            <div className="flex items-center justify-between">
              <SectionTitle className="!mb-0">🏫 Today’s classes</SectionTitle>
              <button className="text-xs font-bold text-brand-500 hover:underline dark:text-brand-300" onClick={() => go('timetable')}>full timetable →</button>
            </div>
            <div className="mt-3">
              {todaysClasses.length === 0 ? (
                <p className="py-6 text-center text-sm font-semibold text-slate-400">No classes today — perfect day for a study session 📚</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {todaysClasses.map(({ course, m }, i) => {
                    const cc = courseColor(course.color)
                    return (
                      <div key={i} className={cx('rounded-2xl border-l-4 px-4 py-3', cc.block)}>
                        <div className="text-sm font-bold">{course.emoji} {course.name}</div>
                        <div className="text-xs font-semibold opacity-75">
                          {formatTime(m.start)} – {formatTime(m.end)}{m.location ? ` · ${m.location}` : ''}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* Quick tasks */}
          <QuickTasks />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Habits today */}
          <Card>
            <div className="flex items-center justify-between">
              <SectionTitle className="!mb-0">✅ Today’s habits</SectionTitle>
              <span className="text-xs font-bold text-slate-400">{habitsDone}/{s.habits.length}</span>
            </div>
            <div className="mt-3 space-y-1.5">
              {s.habits.length === 0 && <p className="py-4 text-center text-sm font-semibold text-slate-400">No habits yet — add some!</p>}
              {s.habits.map((h) => {
                const done = !!h.log[today]
                return (
                  <button
                    key={h.id}
                    onClick={() => s.toggleHabitDay(h.id, today)}
                    className={cx(
                      'flex w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-left text-sm font-bold transition',
                      done ? 'bg-mint-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800',
                    )}
                  >
                    <span className={cx('grid size-6 place-items-center rounded-full text-xs', done ? 'bg-emerald-500 text-white' : 'bg-white ring-2 ring-slate-200 dark:bg-slate-700 dark:ring-slate-600')}>
                      {done ? '✓' : ''}
                    </span>
                    <span className="mr-auto">{h.emoji} {h.name}</span>
                  </button>
                )
              })}
            </div>
            <button className="mt-3 w-full text-center text-xs font-bold text-brand-500 hover:underline dark:text-brand-300" onClick={() => go('habits')}>see streaks →</button>
          </Card>

          {/* Budget snapshot */}
          <Card>
            <SectionTitle>💰 This month’s budget</SectionTitle>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold">{fmtMoney(spent)}</span>
              <span className="text-sm font-bold text-slate-400">of {fmtMoney(s.settings.monthlyBudget)}</span>
            </div>
            <ProgressBar
              value={budgetPct}
              className="mt-3"
              barClassName={budgetPct > 100 ? '!bg-rose-500 !bg-none' : budgetPct > 80 ? '!bg-amber-400 !bg-none' : undefined}
            />
            <p className="mt-2 text-xs font-semibold text-slate-400">
              {budgetPct > 100
                ? `${fmtMoney(spent - s.settings.monthlyBudget)} over budget 😬`
                : `${fmtMoney(s.settings.monthlyBudget - spent)} left to spend`}
            </p>
            <button className="mt-2 w-full text-center text-xs font-bold text-brand-500 hover:underline dark:text-brand-300" onClick={() => go('budget')}>open budget →</button>
          </Card>

          {/* Upcoming events */}
          <Card>
            <SectionTitle>🎉 Coming up</SectionTitle>
            <div className="space-y-2">
              {upcoming.length === 0 && <p className="py-4 text-center text-sm font-semibold text-slate-400">No events planned — go make some fun! 🌈</p>}
              {upcoming.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                  <span className="text-lg">{e.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{e.title}</div>
                    <div className="text-xs font-semibold text-slate-400">
                      {daysUntil(e.date) === 0 ? 'Today' : daysUntil(e.date) === 1 ? 'Tomorrow' : formatDate(e.date, { weekday: 'short', month: 'short', day: 'numeric' })}
                      {e.time ? ` · ${formatTime(e.time)}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-3 w-full text-center text-xs font-bold text-brand-500 hover:underline dark:text-brand-300" onClick={() => go('life')}>all events →</button>
          </Card>
        </div>
      </div>
    </div>
  )
}

const TYPE_EMOJI: Record<string, string> = {
  assignment: '📄', exam: '🧪', quiz: '❓', project: '🛠️', reading: '📖', lab: '🔬',
}

function MiniStat({ emoji, label, value, onClick }: { emoji: string; label: string; value: string; onClick?: () => void }) {
  return (
    <Card onClick={onClick} className="flex items-center gap-3 !p-4">
      <span className="text-2xl">{emoji}</span>
      <div>
        <div className="text-xl font-extrabold leading-tight">{value}</div>
        <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
      </div>
    </Card>
  )
}

function WeekAtAGlance({ go }: { go: (p: PageKey) => void }) {
  const s = useStore()
  const today = todayISO()
  const semester = s.semesters.find((x) => x.id === s.activeSemesterId) ?? s.semesters[0]
  if (!semester) return null

  const totalWeeks = semesterTotalWeeks(semester)
  const currentWeek = semesterWeekOf(semester, today)
  const inSemester = today >= semester.startDate && today <= semester.endDate
  const guide = s.weekGuides.find((g) => g.semesterId === semester.id && g.week === currentWeek)

  // Next academic dates (ongoing ranges first, then soonest)
  const nextDates = s.collegeEvents
    .filter((e) => e.semesterId === semester.id && (e.endDate ?? e.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3)

  if (!inSemester && nextDates.length === 0 && !guide) return null

  const toggle = (itemId: string) =>
    guide && s.update('weekGuides', guide.id, { items: guide.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) })

  return (
    <Card className="border-l-4 !rounded-l-2xl border-brand-400">
      <div className="flex items-center justify-between">
        <SectionTitle className="!mb-0">📌 This week at a glance</SectionTitle>
        {inSemester && (
          <Chip className="bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
            Week {currentWeek} of {totalWeeks}
          </Chip>
        )}
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {/* Week guide checklist */}
        <div>
          {guide ? (
            <>
              {guide.title && <p className="mb-1.5 text-sm font-extrabold">{guide.title}</p>}
              <div className="space-y-0.5">
                {guide.items.map((i) => (
                  <button
                    key={i.id}
                    onClick={() => toggle(i.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <span className={cx('grid size-4.5 shrink-0 place-items-center rounded-full text-[9px]', i.done ? 'bg-emerald-500 text-white' : 'ring-2 ring-slate-300 dark:ring-slate-600')}>
                      {i.done ? '✓' : ''}
                    </span>
                    <span className={cx('text-sm font-semibold', i.done && 'text-slate-400 line-through')}>{i.text}</span>
                  </button>
                ))}
                {guide.items.length === 0 && <p className="text-sm font-semibold text-slate-400">Nothing on this week's list yet.</p>}
              </div>
            </>
          ) : (
            <p className="text-sm font-semibold text-slate-400">
              {inSemester ? `No guide for week ${currentWeek} yet — set one up in the college calendar.` : 'Semester break — enjoy it! 🏖️'}
            </p>
          )}
        </div>

        {/* Next academic dates */}
        <div className="space-y-1.5">
          {nextDates.map((e) => {
            const meta = EVENT_CATEGORY_META[e.category]
            const ongoing = e.endDate && e.date <= today && e.endDate >= today
            const dd = daysUntil(e.date)
            return (
              <div key={e.id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800/60">
                <span>{meta.emoji}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold">{e.title}</span>
                <span className="shrink-0 text-xs font-bold text-slate-400">
                  {ongoing ? 'now' : dd === 0 ? 'today' : dd === 1 ? 'tomorrow' : `in ${dd}d`}
                </span>
              </div>
            )
          })}
          {nextDates.length === 0 && <p className="text-sm font-semibold text-slate-400">No academic dates coming up.</p>}
        </div>
      </div>

      <button className="mt-3 w-full text-center text-xs font-bold text-brand-500 hover:underline dark:text-brand-300" onClick={() => go('calendar')}>
        open college calendar →
      </button>
    </Card>
  )
}

function QuickTasks() {
  const quickTasks = useStore((s) => s.quickTasks)
  const add = useStore((s) => s.add)
  const update = useStore((s) => s.update)
  const remove = useStore((s) => s.remove)
  const [text, setText] = useState('')

  const submit = () => {
    const t = text.trim()
    if (!t) return
    const task: QuickTask = { id: uid(), title: t, done: false, createdAt: new Date().toISOString() }
    add('quickTasks', task)
    setText('')
  }

  const open = quickTasks.filter((t) => !t.done)
  const closed = quickTasks.filter((t) => t.done)

  return (
    <Card>
      <SectionTitle>⚡ Quick to-dos</SectionTitle>
      <div className="flex gap-2">
        <TextInput
          placeholder="Add a little task… (press Enter)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <Btn variant="primary" onClick={submit}>Add</Btn>
      </div>
      <div className="mt-3 space-y-1.5">
        {[...open, ...closed].slice(0, 8).map((t) => (
          <div key={t.id} className="group flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60">
            <button
              onClick={() => update('quickTasks', t.id, { done: !t.done })}
              className={cx(
                'grid size-5 shrink-0 place-items-center rounded-full text-[10px] transition',
                t.done ? 'bg-emerald-500 text-white' : 'ring-2 ring-slate-300 hover:ring-brand-400 dark:ring-slate-600',
              )}
            >
              {t.done ? '✓' : ''}
            </button>
            <span className={cx('flex-1 text-sm font-semibold', t.done && 'text-slate-400 line-through')}>{t.title}</span>
            <button
              onClick={() => remove('quickTasks', t.id)}
              className="hidden text-xs text-slate-300 hover:text-rose-500 group-hover:block"
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}
        {quickTasks.length === 0 && <p className="py-2 text-center text-sm font-semibold text-slate-400">All clear ✨</p>}
        {closed.length > 0 && (
          <button className="text-xs font-bold text-slate-400 hover:text-rose-500" onClick={() => closed.forEach((t) => remove('quickTasks', t.id))}>
            Clear {plural(closed.length, 'done task')}
          </button>
        )}
      </div>
    </Card>
  )
}
