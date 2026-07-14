import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { courseColor, formatDate, plural, toISODate, todayISO, uid, weekStart } from '../utils'
import { Btn, Card, cx, PageHeader, SectionTitle, Select, StatTile, TextInput } from '../components/ui'

type Mode = 'focus' | 'break' | 'longBreak'

const MODE_META: Record<Mode, { label: string; emoji: string; ring: string }> = {
  focus: { label: 'Focus', emoji: '🧠', ring: 'stroke-brand-500' },
  break: { label: 'Short break', emoji: '☕', ring: 'stroke-emerald-400' },
  longBreak: { label: 'Long break', emoji: '🌴', ring: 'stroke-sky-400' },
}

function beep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
    osc.start()
    osc.stop(ctx.currentTime + 0.8)
  } catch {
    // no audio available — that's fine
  }
}

export default function Focus() {
  const s = useStore()
  const durations: Record<Mode, number> = {
    focus: s.settings.pomodoroFocusMin * 60,
    break: s.settings.pomodoroBreakMin * 60,
    longBreak: s.settings.pomodoroLongBreakMin * 60,
  }

  const [mode, setMode] = useState<Mode>('focus')
  const [secondsLeft, setSecondsLeft] = useState(durations.focus)
  const [running, setRunning] = useState(false)
  const [completedFocus, setCompletedFocus] = useState(0)
  const [courseId, setCourseId] = useState('')
  const [label, setLabel] = useState('')
  const startedWith = useRef(durations.focus)

  const switchMode = (m: Mode) => {
    setMode(m)
    setRunning(false)
    setSecondsLeft(durations[m])
    startedWith.current = durations[m]
  }

  // countdown
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setSecondsLeft((x) => x - 1), 1000)
    return () => clearInterval(t)
  }, [running])

  // completion
  useEffect(() => {
    if (secondsLeft > 0 || !running) return
    setRunning(false)
    beep()
    if (mode === 'focus') {
      const minutes = Math.round(startedWith.current / 60)
      s.add('sessions', { id: uid(), date: todayISO(), minutes, courseId: courseId || null, label: label.trim() || undefined })
      const done = completedFocus + 1
      setCompletedFocus(done)
      switchMode(done % 4 === 0 ? 'longBreak' : 'break')
    } else {
      switchMode('focus')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, running])

  const logPartial = () => {
    const elapsed = startedWith.current - secondsLeft
    const minutes = Math.round(elapsed / 60)
    if (mode === 'focus' && minutes >= 1) {
      s.add('sessions', { id: uid(), date: todayISO(), minutes, courseId: courseId || null, label: label.trim() || undefined })
    }
    switchMode(mode)
  }

  const min = Math.floor(Math.max(0, secondsLeft) / 60)
  const sec = Math.max(0, secondsLeft) % 60
  const progress = 1 - secondsLeft / startedWith.current

  // ---- stats ----
  const today = todayISO()
  const ws = toISODate(weekStart(new Date()))
  const todayMin = s.sessions.filter((x) => x.date === today).reduce((sum, x) => sum + x.minutes, 0)
  const weekSessions = s.sessions.filter((x) => x.date >= ws)
  const weekMin = weekSessions.reduce((sum, x) => sum + x.minutes, 0)

  const byCourse = s.courses
    .map((c) => ({ course: c, minutes: weekSessions.filter((x) => x.courseId === c.id).reduce((sum, x) => sum + x.minutes, 0) }))
    .filter((x) => x.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)
  const noCourseMin = weekSessions.filter((x) => x.courseId === null).reduce((sum, x) => sum + x.minutes, 0)
  const maxCourseMin = Math.max(...byCourse.map((x) => x.minutes), noCourseMin, 1)

  const recent = s.sessions.slice().sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 8)
  const courseById = new Map(s.courses.map((c) => [c.id, c]))

  const R = 110
  const CIRC = 2 * Math.PI * R

  return (
    <div className="pop-in">
      <PageHeader emoji="⏱️" title="Focus Timer" subtitle="Pomodoro-style study sessions, logged automatically" />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile emoji="☀️" label="Today" value={todayMin >= 60 ? `${(todayMin / 60).toFixed(1)}h` : `${todayMin}m`} />
        <StatTile emoji="📅" label="This week" value={weekMin >= 60 ? `${(weekMin / 60).toFixed(1)}h` : `${weekMin}m`} />
        <StatTile emoji="🍅" label="Focus rounds today" value={String(completedFocus)} sub="this sitting" />
        <StatTile emoji="📚" label="Sessions logged" value={String(s.sessions.length)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Timer */}
        <Card className="flex flex-col items-center py-8">
          <div className="mb-5 flex gap-2 rounded-full bg-slate-100 p-1.5 dark:bg-slate-800">
            {(Object.keys(MODE_META) as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={cx('rounded-full px-4 py-1.5 text-sm font-bold transition', mode === m ? 'bg-white shadow dark:bg-slate-700' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300')}
              >
                {MODE_META[m].emoji} {MODE_META[m].label}
              </button>
            ))}
          </div>

          <div className="relative">
            <svg width="260" height="260" viewBox="0 0 260 260" className="-rotate-90">
              <circle cx="130" cy="130" r={R} fill="none" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="14" />
              <circle
                cx="130" cy="130" r={R} fill="none"
                className={cx('transition-all duration-1000', MODE_META[mode].ring)}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - progress)}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="font-display text-6xl font-bold tabular-nums">{min}:{String(sec).padStart(2, '0')}</div>
                <div className="mt-1 text-sm font-bold uppercase tracking-widest text-slate-400">{MODE_META[mode].label}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Btn variant="primary" className="!px-8 !py-3 !text-base" onClick={() => setRunning(!running)}>
              {running ? '⏸ Pause' : secondsLeft < startedWith.current ? '▶ Resume' : '▶ Start'}
            </Btn>
            <Btn variant="ghost" onClick={logPartial} title="Reset (logs elapsed focus time)">↺ Reset</Btn>
          </div>

          {mode === 'focus' && (
            <div className="mt-6 flex w-full max-w-sm flex-col gap-2 sm:flex-row">
              <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                <option value="">🧘 No course — just focus</option>
                {s.courses.filter((c) => c.status !== 'completed').map((c) => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.code || c.name}</option>
                ))}
              </Select>
              <TextInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder="What are you working on?" />
            </div>
          )}
        </Card>

        {/* Stats column */}
        <div className="space-y-6">
          <Card>
            <SectionTitle>📊 Study time this week</SectionTitle>
            {byCourse.length === 0 && noCourseMin === 0 ? (
              <p className="py-6 text-center text-sm font-semibold text-slate-400">No sessions yet this week — hit start! 🍅</p>
            ) : (
              <div className="space-y-2.5">
                {byCourse.map(({ course, minutes }) => {
                  const cc = courseColor(course.color)
                  return (
                    <div key={course.id}>
                      <div className="mb-1 flex items-center justify-between text-sm font-bold">
                        <span>{course.emoji} {course.code || course.name}</span>
                        <span className="tabular-nums text-slate-500 dark:text-slate-400">
                          {minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`}
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className={cx('h-full rounded-full', cc.dot)} style={{ width: `${(minutes / maxCourseMin) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
                {noCourseMin > 0 && (
                  <div>
                    <div className="mb-1 flex items-center justify-between text-sm font-bold">
                      <span>🧘 General</span>
                      <span className="tabular-nums text-slate-500 dark:text-slate-400">{noCourseMin}m</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-slate-400" style={{ width: `${(noCourseMin / maxCourseMin) * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle>🗒️ Recent sessions</SectionTitle>
            {recent.length === 0 ? (
              <p className="py-4 text-center text-sm font-semibold text-slate-400">Your finished focus rounds will appear here.</p>
            ) : (
              <div className="space-y-1.5">
                {recent.map((x) => {
                  const course = x.courseId ? courseById.get(x.courseId) : undefined
                  return (
                    <div key={x.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                      <span>{course?.emoji ?? '🧘'}</span>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-bold">{course ? course.code || course.name : 'General'}</span>
                        {x.label && <span className="ml-1.5 truncate text-xs font-semibold text-slate-400">· {x.label}</span>}
                      </div>
                      <span className="text-xs font-bold text-slate-400">{formatDate(x.date)}</span>
                      <span className="text-sm font-extrabold tabular-nums">{plural(x.minutes, 'min')}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
