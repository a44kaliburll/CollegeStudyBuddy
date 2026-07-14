import { useState } from 'react'
import { useStore } from '../store'
import type { Course, CourseMeeting } from '../types'
import {
  COMPLETION_GRADES, COURSE_COLORS, courseColor, coursePercent, creditsEarned, cumulativeGpa,
  DAY_SHORT, formatTime, gpaFor, letterForPercent, pointsForLetter, uid,
} from '../utils'
import { Btn, Card, Chip, cx, DeleteBtn, EmptyState, Field, Modal, PageHeader, ProgressBar, SectionTitle, Select, TextInput } from '../components/ui'
import { SemesterManagerModal } from '../components/SemesterManager'

const COURSE_EMOJI = ['📚', '💻', '🧠', '📐', '✍️', '🧪', '🌍', '🎨', '🎵', '💼', '⚖️', '🏛️', '🔬', '📊', '🗣️', '❤️‍🩹']

export default function Courses() {
  const s = useStore()
  const [editing, setEditing] = useState<Course | 'new' | null>(null)
  const [semModal, setSemModal] = useState(false)
  const [infoModal, setInfoModal] = useState(false)
  const [completing, setCompleting] = useState<Course | null>(null)
  const [viewingNotes, setViewingNotes] = useState<Course | null>(null)

  const semester = s.semesters.find((x) => x.id === s.activeSemesterId) ?? s.semesters[0]
  const currentCourses = s.courses.filter((c) => c.status !== 'completed' && (!semester || c.semesterId === semester.id))
  const completedCourses = s.courses.filter((c) => c.status === 'completed')

  // ---- Degree audit numbers ----
  const cumGpa = cumulativeGpa(s.courses)
  const semGpa = gpaFor(currentCourses, s.grades)
  const earned = creditsEarned(s.courses)
  const inProgress = currentCourses.reduce((sum, c) => sum + c.credits, 0)
  const required = s.settings.creditsRequired
  const progressPct = required > 0 ? (earned / required) * 100 : 0

  // Completed grouped by semester, newest first
  const semById = new Map(s.semesters.map((x) => [x.id, x]))
  const completedBySem = [...new Set(completedCourses.map((c) => c.semesterId))]
    .map((id) => ({
      sem: semById.get(id),
      courses: completedCourses.filter((c) => c.semesterId === id),
    }))
    .sort((a, b) => (b.sem?.startDate ?? '').localeCompare(a.sem?.startDate ?? ''))

  return (
    <div className="pop-in">
      <PageHeader
        emoji="📚"
        title="Courses"
        subtitle="Your degree at a glance"
        actions={
          <>
            {s.semesters.length > 0 && (
              <Select value={semester?.id ?? ''} onChange={(e) => s.setActiveSemester(e.target.value)} className="!w-auto">
                {s.semesters.map((x) => (
                  <option key={x.id} value={x.id}>{x.name}</option>
                ))}
              </Select>
            )}
            <Btn onClick={() => setSemModal(true)}>🗂️ Semesters</Btn>
            <Btn variant="primary" onClick={() => setEditing('new')} disabled={s.semesters.length === 0}>＋ Add course</Btn>
          </>
        }
      />

      {/* ---------- Degree audit header (DegreeWorks-style) ---------- */}
      <Card className="mb-8 overflow-hidden !p-0">
        <div className="bg-gradient-to-r from-brand-500 to-bubble-500 px-6 py-4 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-white/70">Degree audit</div>
              <div className="font-display text-xl font-bold">
                {s.settings.name || 'Your name'} · {s.settings.major || 'Add your major'}
              </div>
              <div className="text-sm font-semibold text-white/80">
                {[s.settings.degree, s.settings.school, s.settings.gradTerm && `expected ${s.settings.gradTerm}`]
                  .filter(Boolean)
                  .join(' · ') || 'Degree, school & graduation term'}
              </div>
            </div>
            <Btn variant="soft" className="!bg-white/20 !text-white hover:!bg-white/30" onClick={() => setInfoModal(true)}>
              ✏️ Edit info
            </Btn>
          </div>
        </div>
        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">Cumulative GPA</div>
            <div className="text-2xl font-extrabold">{cumGpa === null ? '—' : cumGpa.toFixed(2)}</div>
            <div className="text-xs font-semibold text-slate-400">from completed courses</div>
          </div>
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">Semester GPA</div>
            <div className="text-2xl font-extrabold">{semGpa === null ? '—' : semGpa.toFixed(2)}</div>
            <div className="text-xs font-semibold text-slate-400">live, from current grades</div>
          </div>
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">Credits in progress</div>
            <div className="text-2xl font-extrabold">{inProgress}</div>
            <div className="text-xs font-semibold text-slate-400">{currentCourses.length} current courses</div>
          </div>
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">Degree progress</div>
            <div className="text-2xl font-extrabold">
              {earned}<span className="text-sm font-bold text-slate-400"> / {required} credits</span>
            </div>
            <ProgressBar value={progressPct} className="mt-1.5" />
          </div>
        </div>
      </Card>

      {/* ---------- Current courses ---------- */}
      <SectionTitle>📖 Current courses{semester ? ` — ${semester.name}` : ''}</SectionTitle>
      {s.semesters.length === 0 ? (
        <EmptyState
          emoji="🗂️"
          title="No semester yet"
          hint="Create your first semester, then add the courses you're taking."
          action={<Btn variant="primary" onClick={() => setSemModal(true)}>Create a semester</Btn>}
        />
      ) : currentCourses.length === 0 ? (
        <EmptyState
          emoji="📚"
          title="No current courses in this semester"
          hint="Add the classes you're taking — they'll show up in your timetable, assignments, and grades."
          action={<Btn variant="primary" onClick={() => setEditing('new')}>Add a course</Btn>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {currentCourses.map((c) => {
            const cc = courseColor(c.color)
            const pct = coursePercent(s.grades.filter((g) => g.courseId === c.id))
            const openCount = s.assignments.filter((a) => a.courseId === c.id && a.status !== 'done').length
            return (
              <Card key={c.id} className="relative flex flex-col" onClick={() => setEditing(c)}>
                <div className="flex items-start justify-between">
                  <span className={cx('grid size-12 place-items-center rounded-2xl text-2xl', cc.bg)}>{c.emoji}</span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <DeleteBtn onDelete={() => s.deleteCourseCascade(c.id)} />
                  </div>
                </div>
                <h3 className="mt-3 text-base font-bold leading-tight">{c.name}</h3>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  {c.code} · {c.credits} cr {c.instructor && `· ${c.instructor}`}
                </p>
                <div className="mt-3 space-y-1">
                  {c.meetings.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span className={cx('size-1.5 rounded-full', cc.dot)} />
                      {DAY_SHORT[m.day]} {formatTime(m.start)}–{formatTime(m.end)}
                      {m.location && <span className="text-slate-400">· {m.location}</span>}
                    </div>
                  ))}
                  {c.meetings.length === 0 && <p className="text-xs font-semibold text-slate-400">No scheduled meetings</p>}
                </div>
                <div className="mt-4 flex flex-1 items-end justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {pct !== null && <Chip className={cc.bg}>{letterForPercent(pct).letter} · {pct.toFixed(1)}%</Chip>}
                    {openCount > 0 && (
                      <Chip className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {openCount} open task{openCount === 1 ? '' : 's'}
                      </Chip>
                    )}
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Btn variant="ghost" className="!px-2.5 !py-1 !text-xs" onClick={() => setCompleting(c)} title="Move to completed courses">
                      🎓 Complete
                    </Btn>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ---------- Completed courses ---------- */}
      <div className="mt-10">
        <SectionTitle>🎓 Completed courses</SectionTitle>
        {completedCourses.length === 0 ? (
          <EmptyState
            emoji="🎓"
            title="Nothing completed yet"
            hint="When a class wraps up, hit “Complete” on its card — its final grade and notes get archived here."
          />
        ) : (
          <div className="space-y-5">
            {completedBySem.map(({ sem, courses }) => {
              const semGpaVal = cumulativeGpa(courses)
              const semCredits = creditsEarned(courses)
              return (
                <Card key={sem?.id ?? 'unknown'} className="!p-0 overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3 dark:border-white/10 dark:bg-slate-800/40">
                    <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                      {sem?.name ?? 'Past semester'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      {semGpaVal !== null && <Chip className="bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">GPA {semGpaVal.toFixed(2)}</Chip>}
                      <span>{semCredits} credits earned</span>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-50 dark:divide-white/5">
                    {courses.map((c) => {
                      const cc = courseColor(c.color)
                      const noteCount = c.archivedNotes?.length ?? 0
                      return (
                        <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                          <span className={cx('grid size-9 shrink-0 place-items-center rounded-xl text-lg', cc.bg)}>{c.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold">{c.name}</div>
                            <div className="text-xs font-semibold text-slate-400">
                              {c.code} · {c.credits} cr{c.instructor ? ` · ${c.instructor}` : ''}
                            </div>
                          </div>
                          {noteCount > 0 && (
                            <button
                              onClick={() => setViewingNotes(c)}
                              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 transition hover:bg-brand-100 hover:text-brand-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-brand-500/20"
                            >
                              📓 {noteCount} note{noteCount === 1 ? '' : 's'}
                            </button>
                          )}
                          <Chip
                            className={cx(
                              'min-w-9 justify-center text-sm',
                              c.finalGrade && pointsForLetter(c.finalGrade) !== null && pointsForLetter(c.finalGrade)! >= 3.7
                                ? 'bg-mint-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                                : cc.bg,
                            )}
                          >
                            {c.finalGrade ?? '—'}
                          </Chip>
                          <Btn variant="ghost" className="!px-2 !py-1 !text-xs" onClick={() => s.reopenCourse(c.id)} title="Move back to current courses">
                            ↩
                          </Btn>
                          <DeleteBtn small onDelete={() => s.deleteCourseCascade(c.id)} />
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {editing && <CourseModal course={editing === 'new' ? null : editing} semesterId={semester?.id ?? ''} onClose={() => setEditing(null)} />}
      {completing && <CompleteModal course={completing} onClose={() => setCompleting(null)} />}
      {viewingNotes && <ArchivedNotesModal course={viewingNotes} onClose={() => setViewingNotes(null)} />}
      <SemesterManagerModal open={semModal} onClose={() => setSemModal(false)} />
      {infoModal && <StudentInfoModal onClose={() => setInfoModal(false)} />}
    </div>
  )
}

// ---------------- Complete a course ----------------
function CompleteModal({ course, onClose }: { course: Course; onClose: () => void }) {
  const s = useStore()
  const pct = coursePercent(s.grades.filter((g) => g.courseId === course.id))
  const [grade, setGrade] = useState(pct !== null ? letterForPercent(pct).letter : 'A')
  const noteCount = s.notes.filter((n) => n.courseId === course.id).length

  return (
    <Modal open onClose={onClose} title={`Complete ${course.code || course.name} 🎓`}>
      <div className="grid gap-4">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          This moves the course to your completed list, counts its credits toward your degree, and archives its notes with it.
        </p>
        {pct !== null && (
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold dark:bg-slate-800/60">
            Current computed grade: <b>{pct.toFixed(1)}%</b> → suggested <b>{letterForPercent(pct).letter}</b>
          </div>
        )}
        <Field label="Final grade">
          <Select value={grade} onChange={(e) => setGrade(e.target.value)}>
            {COMPLETION_GRADES.map((g) => (
              <option key={g} value={g}>
                {g}{pointsForLetter(g) !== null ? ` (${pointsForLetter(g)!.toFixed(1)} pts)` : g === 'P' ? ' (pass — credits, no GPA)' : ' (no credits)'}
              </option>
            ))}
          </Select>
        </Field>
        <p className="text-xs font-semibold text-slate-400">
          {noteCount > 0 ? `📓 ${noteCount} note${noteCount === 1 ? '' : 's'} will be archived with this course.` : 'No notes to archive for this course.'}
        </p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn
          variant="primary"
          onClick={() => {
            s.completeCourse(course.id, grade)
            onClose()
          }}
        >
          🎓 Mark completed
        </Btn>
      </div>
    </Modal>
  )
}

// ---------------- Archived notes viewer ----------------
function ArchivedNotesModal({ course, onClose }: { course: Course; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title={`📓 Notes from ${course.code || course.name}`} wide>
      <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
        {(course.archivedNotes ?? []).map((n, i) => (
          <div key={i} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
            <h3 className="mb-1.5 text-sm font-bold">{n.title || 'Untitled'}</h3>
            <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">{n.content || '(empty note)'}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Btn variant="ghost" onClick={onClose}>Close</Btn>
      </div>
    </Modal>
  )
}

// ---------------- Student info (degree audit header) ----------------
function StudentInfoModal({ onClose }: { onClose: () => void }) {
  const s = useStore()
  return (
    <Modal open onClose={onClose} title="Student info">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <TextInput value={s.settings.name} onChange={(e) => s.updateSettings({ name: e.target.value })} placeholder="Your name" />
        </Field>
        <Field label="School">
          <TextInput value={s.settings.school} onChange={(e) => s.updateSettings({ school: e.target.value })} placeholder="e.g. State University" />
        </Field>
        <Field label="Major">
          <TextInput value={s.settings.major} onChange={(e) => s.updateSettings({ major: e.target.value })} placeholder="e.g. Computer Science" />
        </Field>
        <Field label="Degree">
          <TextInput value={s.settings.degree} onChange={(e) => s.updateSettings({ degree: e.target.value })} placeholder="e.g. B.S." />
        </Field>
        <Field label="Expected graduation">
          <TextInput value={s.settings.gradTerm} onChange={(e) => s.updateSettings({ gradTerm: e.target.value })} placeholder="e.g. Spring 2028" />
        </Field>
        <Field label="Credits required">
          <TextInput
            type="number"
            min={0}
            value={s.settings.creditsRequired}
            onChange={(e) => s.updateSettings({ creditsRequired: Math.max(0, Number(e.target.value)) })}
          />
        </Field>
      </div>
      <div className="mt-6 flex justify-end">
        <Btn variant="primary" onClick={onClose}>Done</Btn>
      </div>
    </Modal>
  )
}

// ---------------- Course add/edit ----------------
function CourseModal({ course, semesterId, onClose }: { course: Course | null; semesterId: string; onClose: () => void }) {
  const add = useStore((s) => s.add)
  const update = useStore((s) => s.update)

  const [name, setName] = useState(course?.name ?? '')
  const [code, setCode] = useState(course?.code ?? '')
  const [instructor, setInstructor] = useState(course?.instructor ?? '')
  const [credits, setCredits] = useState(course?.credits ?? 3)
  const [emoji, setEmoji] = useState(course?.emoji ?? '📚')
  const [color, setColor] = useState(course?.color ?? 'violet')
  const [meetings, setMeetings] = useState<CourseMeeting[]>(course?.meetings ?? [])

  const save = () => {
    if (!name.trim()) return
    const data = { name: name.trim(), code: code.trim(), instructor: instructor.trim(), credits, emoji, color, meetings }
    if (course) update('courses', course.id, data)
    else add('courses', { id: uid(), semesterId, status: 'current', ...data })
    onClose()
  }

  const setMeeting = (i: number, patch: Partial<CourseMeeting>) =>
    setMeetings((ms) => ms.map((m, j) => (j === i ? { ...m, ...patch } : m)))

  return (
    <Modal open onClose={onClose} title={course ? 'Edit course' : 'Add a course'} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Course name" className="sm:col-span-2">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Data Structures" autoFocus />
        </Field>
        <Field label="Course code">
          <TextInput value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CS 201" />
        </Field>
        <Field label="Instructor">
          <TextInput value={instructor} onChange={(e) => setInstructor(e.target.value)} placeholder="e.g. Dr. Chen" />
        </Field>
        <Field label="Credits">
          <TextInput type="number" min={0} max={10} value={credits} onChange={(e) => setCredits(Number(e.target.value))} />
        </Field>
        <Field label="Icon">
          <div className="flex flex-wrap gap-1.5">
            {COURSE_EMOJI.map((e) => (
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
        <Field label="Color" className="sm:col-span-2">
          <div className="flex flex-wrap gap-2">
            {Object.entries(COURSE_COLORS).map(([key, val]) => (
              <button
                key={key}
                type="button"
                title={val.name}
                onClick={() => setColor(key)}
                className={cx('size-8 rounded-full transition', val.dot, color === key ? 'ring-4 ring-slate-300 dark:ring-slate-500' : 'hover:scale-110')}
              />
            ))}
          </div>
        </Field>

        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Weekly meetings</span>
          <div className="space-y-2">
            {meetings.map((m, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 p-2 dark:bg-slate-800/60">
                <Select value={m.day} onChange={(e) => setMeeting(i, { day: Number(e.target.value) })} className="!w-24">
                  {DAY_SHORT.map((d, di) => (
                    <option key={di} value={di}>{d}</option>
                  ))}
                </Select>
                <TextInput type="time" value={m.start} onChange={(e) => setMeeting(i, { start: e.target.value })} className="!w-28" />
                <span className="text-xs font-bold text-slate-400">to</span>
                <TextInput type="time" value={m.end} onChange={(e) => setMeeting(i, { end: e.target.value })} className="!w-28" />
                <TextInput value={m.location ?? ''} onChange={(e) => setMeeting(i, { location: e.target.value })} placeholder="Room" className="!w-28 flex-1" />
                <button type="button" className="px-1 text-slate-400 hover:text-rose-500" onClick={() => setMeetings((ms) => ms.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
            <Btn onClick={() => setMeetings((ms) => [...ms, { day: 0, start: '09:00', end: '10:15', location: '' }])}>
              ＋ Add meeting time
            </Btn>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={save} disabled={!name.trim()}>{course ? 'Save changes' : 'Add course'}</Btn>
      </div>
    </Modal>
  )
}

