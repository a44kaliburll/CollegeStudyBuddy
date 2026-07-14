import type { Course, GradeItem, Semester } from './types'

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

// ---------- Dates ----------
export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const todayISO = () => toISODate(new Date())

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Monday-based weekday index (0 = Monday … 6 = Sunday) */
export function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

/** Start of the week (Monday) containing d */
export function weekStart(d: Date): Date {
  return addDays(d, -weekdayIndex(d))
}

export function daysUntil(iso: string): number {
  const ms = parseISO(iso).getTime() - parseISO(todayISO()).getTime()
  return Math.round(ms / 86400000)
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }): string {
  return parseISO(iso).toLocaleDateString('en-US', opts)
}

export function formatDateLong(iso: string): string {
  return parseISO(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function relativeDue(iso: string): string {
  const n = daysUntil(iso)
  if (n < -1) return `${-n} days overdue`
  if (n === -1) return 'yesterday'
  if (n === 0) return 'today'
  if (n === 1) return 'tomorrow'
  if (n <= 7) return `in ${n} days`
  return formatDate(iso)
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${hr} ${ampm}` : `${hr}:${String(m).padStart(2, '0')} ${ampm}`
}

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7) // yyyy-mm
}

// ---------- Semester weeks ----------
export function semesterTotalWeeks(sem: Semester): number {
  const days = (parseISO(sem.endDate).getTime() - parseISO(sem.startDate).getTime()) / 86400000
  return Math.max(1, Math.ceil((days + 1) / 7))
}

/** 1-based week of the semester containing `date` (clamped to the semester's range) */
export function semesterWeekOf(sem: Semester, dateISO: string): number {
  const days = (parseISO(dateISO).getTime() - parseISO(sem.startDate).getTime()) / 86400000
  return clamp(Math.floor(days / 7) + 1, 1, semesterTotalWeeks(sem))
}

// ---------- Money ----------
export const fmtMoney = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: Math.abs(n) >= 1000 ? 0 : 2 })

// ---------- Course colors (playful UI accents for course chips/blocks) ----------
export interface CourseColor {
  name: string
  bg: string // tailwind classes for chip background + text
  block: string // timetable block classes
  dot: string
}

export const COURSE_COLORS: Record<string, CourseColor> = {
  violet: {
    name: 'Violet',
    bg: 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200',
    block: 'bg-violet-200/90 border-violet-400 text-violet-950 dark:bg-violet-500/30 dark:border-violet-400 dark:text-violet-100',
    dot: 'bg-violet-500',
  },
  pink: {
    name: 'Pink',
    bg: 'bg-pink-100 text-pink-800 dark:bg-pink-500/20 dark:text-pink-200',
    block: 'bg-pink-200/90 border-pink-400 text-pink-950 dark:bg-pink-500/30 dark:border-pink-400 dark:text-pink-100',
    dot: 'bg-pink-500',
  },
  amber: {
    name: 'Amber',
    bg: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
    block: 'bg-amber-200/90 border-amber-400 text-amber-950 dark:bg-amber-500/30 dark:border-amber-400 dark:text-amber-100',
    dot: 'bg-amber-500',
  },
  emerald: {
    name: 'Emerald',
    bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',
    block: 'bg-emerald-200/90 border-emerald-400 text-emerald-950 dark:bg-emerald-500/30 dark:border-emerald-400 dark:text-emerald-100',
    dot: 'bg-emerald-500',
  },
  sky: {
    name: 'Sky',
    bg: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200',
    block: 'bg-sky-200/90 border-sky-400 text-sky-950 dark:bg-sky-500/30 dark:border-sky-400 dark:text-sky-100',
    dot: 'bg-sky-500',
  },
  rose: {
    name: 'Rose',
    bg: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200',
    block: 'bg-rose-200/90 border-rose-400 text-rose-950 dark:bg-rose-500/30 dark:border-rose-400 dark:text-rose-100',
    dot: 'bg-rose-500',
  },
  teal: {
    name: 'Teal',
    bg: 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200',
    block: 'bg-teal-200/90 border-teal-400 text-teal-950 dark:bg-teal-500/30 dark:border-teal-400 dark:text-teal-100',
    dot: 'bg-teal-500',
  },
  orange: {
    name: 'Orange',
    bg: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200',
    block: 'bg-orange-200/90 border-orange-400 text-orange-950 dark:bg-orange-500/30 dark:border-orange-400 dark:text-orange-100',
    dot: 'bg-orange-500',
  },
}

export const courseColor = (key: string): CourseColor => COURSE_COLORS[key] ?? COURSE_COLORS.violet

// ---------- Grades / GPA ----------
export interface LetterGrade {
  letter: string
  minPercent: number
  points: number
}

export const GRADE_SCALE: LetterGrade[] = [
  { letter: 'A', minPercent: 93, points: 4.0 },
  { letter: 'A-', minPercent: 90, points: 3.7 },
  { letter: 'B+', minPercent: 87, points: 3.3 },
  { letter: 'B', minPercent: 83, points: 3.0 },
  { letter: 'B-', minPercent: 80, points: 2.7 },
  { letter: 'C+', minPercent: 77, points: 2.3 },
  { letter: 'C', minPercent: 73, points: 2.0 },
  { letter: 'C-', minPercent: 70, points: 1.7 },
  { letter: 'D+', minPercent: 67, points: 1.3 },
  { letter: 'D', minPercent: 63, points: 1.0 },
  { letter: 'D-', minPercent: 60, points: 0.7 },
  { letter: 'F', minPercent: 0, points: 0.0 },
]

export function letterForPercent(pct: number): LetterGrade {
  return GRADE_SCALE.find((g) => pct >= g.minPercent) ?? GRADE_SCALE[GRADE_SCALE.length - 1]
}

/** Letter options offered when completing a course (GPA letters + non-GPA outcomes) */
export const COMPLETION_GRADES = [...GRADE_SCALE.map((g) => g.letter), 'P', 'W', 'I']

/** 4.0-scale points for a letter, or null for non-GPA grades (P/W/I) */
export function pointsForLetter(letter: string): number | null {
  return GRADE_SCALE.find((g) => g.letter === letter)?.points ?? null
}

/** Cumulative GPA across completed courses with GPA letters */
export function cumulativeGpa(courses: Course[]): number | null {
  let qualityPoints = 0
  let credits = 0
  for (const c of courses) {
    if (c.status !== 'completed' || !c.finalGrade) continue
    const pts = pointsForLetter(c.finalGrade)
    if (pts === null) continue
    qualityPoints += pts * c.credits
    credits += c.credits
  }
  return credits === 0 ? null : qualityPoints / credits
}

/** Credits earned from completed courses (excludes F, W, I) */
export function creditsEarned(courses: Course[]): number {
  return courses
    .filter((c) => c.status === 'completed' && c.finalGrade && !['F', 'W', 'I'].includes(c.finalGrade))
    .reduce((sum, c) => sum + c.credits, 0)
}

/** Weighted course percent from grade items; null if no items */
export function coursePercent(items: GradeItem[]): number | null {
  const valid = items.filter((i) => i.total > 0 && i.weight > 0)
  if (valid.length === 0) return null
  const totalWeight = valid.reduce((s, i) => s + i.weight, 0)
  if (totalWeight === 0) return null
  const earned = valid.reduce((s, i) => s + (i.score / i.total) * i.weight, 0)
  return (earned / totalWeight) * 100
}

/** GPA across courses that have grades; null if none */
export function gpaFor(courses: Course[], grades: GradeItem[]): number | null {
  let qualityPoints = 0
  let credits = 0
  for (const c of courses) {
    const pct = coursePercent(grades.filter((g) => g.courseId === c.id))
    if (pct === null) continue
    qualityPoints += letterForPercent(pct).points * c.credits
    credits += c.credits
  }
  if (credits === 0) return null
  return qualityPoints / credits
}

// ---------- Misc ----------
export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

/** Deterministic pick from a list based on the current date (e.g. quote of the day) */
export function dailyPick<T>(list: T[]): T {
  const seed = Math.floor(parseISO(todayISO()).getTime() / 86400000)
  return list[seed % list.length]
}
