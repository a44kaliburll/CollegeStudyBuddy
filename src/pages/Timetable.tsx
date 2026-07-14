import { useState } from 'react'
import { useStore } from '../store'
import { courseColor, DAY_NAMES, DAY_SHORT, formatTime, timeToMinutes, toISODate, addDays, weekdayIndex, weekStart } from '../utils'
import { Card, Chip, cx, EmptyState, PageHeader } from '../components/ui'

const HOUR_PX = 56

export default function Timetable() {
  const s = useStore()
  const [showWeekend, setShowWeekend] = useState(false)

  const courses = s.courses.filter((c) => c.status !== 'completed' && (!s.activeSemesterId || c.semesterId === s.activeSemesterId))
  const allMeetings = courses.flatMap((c) => c.meetings.map((m) => ({ course: c, m })))

  const days = showWeekend ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4]
  const hasWeekendClasses = allMeetings.some(({ m }) => m.day >= 5)

  const startHour = Math.min(8, ...allMeetings.map(({ m }) => Math.floor(timeToMinutes(m.start) / 60)))
  const endHour = Math.max(18, ...allMeetings.map(({ m }) => Math.ceil(timeToMinutes(m.end) / 60)))
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i)

  const now = new Date()
  const todayIdx = weekdayIndex(now)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const nowTop = ((nowMin - startHour * 60) / 60) * HOUR_PX

  // This week's due dates + events, as chips above each day column
  const ws = weekStart(now)
  const weekDates = days.map((d) => toISODate(addDays(ws, d)))
  const dueByDate = new Map<string, number>()
  for (const a of s.assignments) {
    if (a.status === 'done') continue
    dueByDate.set(a.dueDate, (dueByDate.get(a.dueDate) ?? 0) + 1)
  }
  const eventsByDate = new Map<string, string[]>()
  for (const e of s.events) {
    eventsByDate.set(e.date, [...(eventsByDate.get(e.date) ?? []), e.emoji])
  }

  return (
    <div className="pop-in">
      <PageHeader
        emoji="🗓️"
        title="Weekly Timetable"
        subtitle={`${courses.length} courses this semester`}
        actions={
          <button
            onClick={() => setShowWeekend(!showWeekend)}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {showWeekend ? 'Hide weekend' : `Show weekend${hasWeekendClasses ? ' •' : ''}`}
          </button>
        }
      />

      {allMeetings.length === 0 ? (
        <EmptyState
          emoji="🗓️"
          title="No class times yet"
          hint="Add meeting times to your courses and they'll appear here as a weekly schedule."
        />
      ) : (
        <Card className="overflow-x-auto !p-0">
          <div className="min-w-[720px]">
            {/* Header row */}
            <div className="grid border-b border-slate-100 dark:border-white/10" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
              <div />
              {days.map((d, i) => {
                const isToday = d === todayIdx
                const date = weekDates[i]
                const dueCount = dueByDate.get(date) ?? 0
                const evs = eventsByDate.get(date) ?? []
                return (
                  <div key={d} className={cx('border-l border-slate-100 px-2 py-3 text-center dark:border-white/10', isToday && 'bg-brand-50/60 dark:bg-brand-500/10')}>
                    <div className={cx('text-sm font-bold', isToday ? 'text-brand-600 dark:text-brand-300' : 'text-slate-600 dark:text-slate-300')}>
                      {DAY_NAMES[d]}
                    </div>
                    <div className="mt-0.5 flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-400">
                      {new Date(weekDates[i] + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {dueCount > 0 && <Chip className="bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">{dueCount} due</Chip>}
                      {evs.slice(0, 3).map((e, j) => <span key={j}>{e}</span>)}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Grid body */}
            <div className="relative grid" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
              {/* Time gutter */}
              <div>
                {hours.map((h) => (
                  <div key={h} className="relative border-b border-slate-50 pr-2 text-right dark:border-white/5" style={{ height: HOUR_PX }}>
                    <span className="relative -top-2 text-[10px] font-bold text-slate-300 dark:text-slate-600">{formatTime(`${h}:00`)}</span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map((d) => (
                <div key={d} className={cx('relative border-l border-slate-100 dark:border-white/10', d === todayIdx && 'bg-brand-50/40 dark:bg-brand-500/5')}>
                  {hours.map((h) => (
                    <div key={h} className="border-b border-slate-50 dark:border-white/5" style={{ height: HOUR_PX }} />
                  ))}

                  {/* Class blocks */}
                  {allMeetings
                    .filter(({ m }) => m.day === d)
                    .map(({ course, m }, i) => {
                      const cc = courseColor(course.color)
                      const top = ((timeToMinutes(m.start) - startHour * 60) / 60) * HOUR_PX
                      const height = ((timeToMinutes(m.end) - timeToMinutes(m.start)) / 60) * HOUR_PX
                      return (
                        <div
                          key={i}
                          className={cx('absolute inset-x-1 overflow-hidden rounded-xl border-l-4 px-2 py-1.5 shadow-sm', cc.block)}
                          style={{ top, height: Math.max(height, 28) }}
                          title={`${course.name} · ${formatTime(m.start)}–${formatTime(m.end)}${m.location ? ` · ${m.location}` : ''}`}
                        >
                          <div className="truncate text-xs font-extrabold leading-tight">{course.emoji} {course.code || course.name}</div>
                          {height > 40 && <div className="truncate text-[10px] font-bold opacity-75">{formatTime(m.start)}–{formatTime(m.end)}</div>}
                          {height > 58 && m.location && <div className="truncate text-[10px] font-semibold opacity-60">📍 {m.location}</div>}
                        </div>
                      )
                    })}

                  {/* Now line */}
                  {d === todayIdx && nowTop >= 0 && nowTop <= hours.length * HOUR_PX && (
                    <div className="pointer-events-none absolute inset-x-0 z-10" style={{ top: nowTop }}>
                      <div className="h-0.5 bg-bubble-500" />
                      <div className="absolute -left-1 -top-[3px] size-2 rounded-full bg-bubble-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Legend */}
      {courses.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {courses.map((c) => {
            const cc = courseColor(c.color)
            return (
              <Chip key={c.id} className={cc.bg}>
                {c.emoji} {c.code || c.name}
                <span className="opacity-60">
                  · {c.meetings.map((m) => DAY_SHORT[m.day]).join(', ') || 'no meetings'}
                </span>
              </Chip>
            )
          })}
        </div>
      )}
    </div>
  )
}
