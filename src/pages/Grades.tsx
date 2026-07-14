import { useState } from 'react'
import { useStore } from '../store'
import type { Course, GradeItem } from '../types'
import { courseColor, coursePercent, gpaFor, letterForPercent, uid } from '../utils'
import { Btn, Card, Chip, cx, DeleteBtn, EmptyState, Field, Modal, PageHeader, StatTile, TextInput } from '../components/ui'

export default function Grades() {
  const s = useStore()
  const [adding, setAdding] = useState<Course | null>(null)

  const courses = s.courses.filter((c) => c.status !== 'completed' && (!s.activeSemesterId || c.semesterId === s.activeSemesterId))
  const gpa = gpaFor(courses, s.grades)
  const gradedCourses = courses.filter((c) => coursePercent(s.grades.filter((g) => g.courseId === c.id)) !== null)
  const credits = courses.reduce((sum, c) => sum + c.credits, 0)
  const gradedCredits = gradedCourses.reduce((sum, c) => sum + c.credits, 0)

  return (
    <div className="pop-in">
      <PageHeader emoji="🎯" title="Grades & GPA" subtitle="Track every graded item and see your GPA update live" />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile emoji="🎓" label="Semester GPA" value={gpa === null ? '—' : gpa.toFixed(2)} sub={gpa === null ? 'no grades yet' : letterAvgLabel(gpa)} />
        <StatTile emoji="📚" label="Courses graded" value={`${gradedCourses.length}/${courses.length}`} />
        <StatTile emoji="🧮" label="Credits" value={String(credits)} sub={`${gradedCredits} graded`} />
        <StatTile emoji="🏆" label="Dean's list" value={gpa !== null && gpa >= 3.5 ? 'On track!' : '3.50+'} sub={gpa !== null && gpa >= 3.5 ? 'keep it up ✨' : 'the goal'} />
      </div>

      {courses.length === 0 ? (
        <EmptyState emoji="🎯" title="No courses yet" hint="Add courses first, then log graded work here to see your GPA." />
      ) : (
        <div className="space-y-5">
          {courses.map((c) => {
            const items = s.grades.filter((g) => g.courseId === c.id)
            const pct = coursePercent(items)
            const cc = courseColor(c.color)
            const totalWeight = items.reduce((sum, i) => sum + i.weight, 0)
            return (
              <Card key={c.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={cx('grid size-11 place-items-center rounded-2xl text-xl', cc.bg)}>{c.emoji}</span>
                    <div>
                      <h3 className="font-bold">{c.name}</h3>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{c.code} · {c.credits} credits</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pct !== null ? (
                      <>
                        <span className="text-2xl font-extrabold">{pct.toFixed(1)}%</span>
                        <Chip className={cx('text-sm', cc.bg)}>{letterForPercent(pct).letter}</Chip>
                        <Chip className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">{letterForPercent(pct).points.toFixed(1)} pts</Chip>
                      </>
                    ) : (
                      <span className="text-sm font-semibold text-slate-400">no grades yet</span>
                    )}
                    <Btn onClick={() => setAdding(c)}>＋ Add grade</Btn>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                          <th className="pb-2 pr-3">Item</th>
                          <th className="pb-2 pr-3">Category</th>
                          <th className="pb-2 pr-3 text-right">Score</th>
                          <th className="pb-2 pr-3 text-right">%</th>
                          <th className="pb-2 pr-3 text-right">Weight</th>
                          <th className="pb-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((g) => (
                          <tr key={g.id} className="border-t border-slate-100 font-semibold dark:border-white/5">
                            <td className="py-2 pr-3">{g.name}</td>
                            <td className="py-2 pr-3">
                              <Chip className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">{g.category}</Chip>
                            </td>
                            <td className="py-2 pr-3 text-right tabular-nums">{g.score}/{g.total}</td>
                            <td className="py-2 pr-3 text-right tabular-nums">{g.total > 0 ? ((g.score / g.total) * 100).toFixed(1) : '—'}%</td>
                            <td className="py-2 pr-3 text-right tabular-nums text-slate-400">{g.weight}%</td>
                            <td className="py-2 text-right">
                              <DeleteBtn small onDelete={() => s.remove('grades', g.id)} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="mt-2 text-xs font-semibold text-slate-400">
                      {totalWeight}% of the final grade logged{totalWeight < 100 ? ` · ${100 - totalWeight}% still to come` : ''}
                    </p>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {adding && <GradeModal course={adding} onClose={() => setAdding(null)} />}
    </div>
  )
}

function letterAvgLabel(gpa: number): string {
  if (gpa >= 3.85) return 'A average 🌟'
  if (gpa >= 3.5) return 'A- average'
  if (gpa >= 3.15) return 'B+ average'
  if (gpa >= 2.85) return 'B average'
  if (gpa >= 2.5) return 'B- average'
  if (gpa >= 2.0) return 'C average'
  return 'keep pushing 💪'
}

function GradeModal({ course, onClose }: { course: Course; onClose: () => void }) {
  const s = useStore()
  const existingCategories = [...new Set(s.grades.filter((g) => g.courseId === course.id).map((g) => g.category))]
  const [name, setName] = useState('')
  const [category, setCategory] = useState(existingCategories[0] ?? 'Homework')
  const [score, setScore] = useState('')
  const [total, setTotal] = useState('100')
  const [weight, setWeight] = useState('10')

  const save = () => {
    if (!name.trim() || score === '' || total === '') return
    const item: GradeItem = {
      id: uid(),
      courseId: course.id,
      name: name.trim(),
      category: category.trim() || 'Other',
      score: Number(score),
      total: Number(total),
      weight: Number(weight) || 0,
    }
    s.add('grades', item)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={`Add grade — ${course.code || course.name}`}>
      <div className="grid gap-4">
        <Field label="What was graded?">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Midterm 1" autoFocus />
        </Field>
        <Field label="Category">
          <TextInput value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Exams" list="grade-categories" />
          <datalist id="grade-categories">
            {['Homework', 'Quizzes', 'Exams', 'Labs', 'Projects', 'Participation', ...existingCategories].map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Score">
            <TextInput type="number" value={score} onChange={(e) => setScore(e.target.value)} placeholder="87" />
          </Field>
          <Field label="Out of">
            <TextInput type="number" value={total} onChange={(e) => setTotal(e.target.value)} />
          </Field>
          <Field label="Weight %">
            <TextInput type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </Field>
        </div>
        <p className="text-xs font-semibold text-slate-400">
          Weight = how much of the final grade this item is worth. Your course grade is the weighted average of everything you log.
        </p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={save} disabled={!name.trim() || score === ''}>Add grade</Btn>
      </div>
    </Modal>
  )
}
