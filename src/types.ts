export type ID = string

export interface Semester {
  id: ID
  name: string
  startDate: string // ISO yyyy-mm-dd
  endDate: string
}

export interface CourseMeeting {
  day: number // 0 = Monday … 6 = Sunday
  start: string // "HH:MM" 24h
  end: string
  location?: string
}

export interface ArchivedNote {
  title: string
  content: string
}

export interface Course {
  id: ID
  semesterId: ID
  name: string
  code: string
  instructor: string
  credits: number
  color: string // one of COURSE_COLORS keys
  emoji: string
  meetings: CourseMeeting[]
  status: 'current' | 'completed'
  finalGrade?: string // letter grade once completed (A, B+, P, W, …)
  archivedNotes?: ArchivedNote[] // snapshot of the course's notes at completion time
}

export type AssignmentType = 'assignment' | 'exam' | 'quiz' | 'project' | 'reading' | 'lab'
export type AssignmentStatus = 'todo' | 'in-progress' | 'done'
export type Priority = 'low' | 'medium' | 'high'

export interface Assignment {
  id: ID
  courseId: ID | null
  title: string
  type: AssignmentType
  dueDate: string // ISO yyyy-mm-dd
  dueTime?: string
  status: AssignmentStatus
  priority: Priority
  notes?: string
}

export interface GradeItem {
  id: ID
  courseId: ID
  name: string
  category: string // e.g. "Homework", "Midterm"
  score: number
  total: number
  weight: number // % of final grade
}

export interface Note {
  id: ID
  title: string
  courseId: ID | null
  content: string
  updatedAt: string // ISO datetime
  pinned: boolean
}

export interface Habit {
  id: ID
  name: string
  emoji: string
  target: number // times per week
  log: Record<string, true> // dateISO -> done
}

export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: ID
  type: TransactionType
  amount: number
  category: string
  description: string
  date: string // ISO yyyy-mm-dd
}

export type EventCategory = 'social' | 'club' | 'sports' | 'family' | 'other'

export interface SocialEvent {
  id: ID
  title: string
  date: string
  time?: string
  location?: string
  emoji: string
  category: EventCategory
  notes?: string
}

export interface Milestone {
  id: ID
  text: string
  done: boolean
}

export interface Goal {
  id: ID
  title: string
  emoji: string
  category: 'academic' | 'health' | 'career' | 'personal' | 'financial'
  targetDate?: string
  milestones: Milestone[]
}

export type MediaKind = 'book' | 'movie' | 'show'
export type MediaStatus = 'planned' | 'in-progress' | 'done'

export interface MediaItem {
  id: ID
  title: string
  kind: MediaKind
  status: MediaStatus
  rating?: number // 1-5
}

export interface Meal {
  id: ID
  name: string
  emoji: string
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  minutes?: number // prep time
  recipe?: string
  favorite: boolean
}

export interface QuickTask {
  id: ID
  title: string
  done: boolean
  createdAt: string
}

export interface StudySession {
  id: ID
  date: string // ISO yyyy-mm-dd
  minutes: number
  courseId: ID | null
  label?: string
}

export type CollegeEventCategory = 'academic' | 'deadline' | 'exams' | 'holiday' | 'registration' | 'campus'

export interface CollegeEvent {
  id: ID
  semesterId: ID
  title: string
  date: string // ISO yyyy-mm-dd
  endDate?: string // for ranges like finals week
  category: CollegeEventCategory
  notes?: string
}

export interface WeekGuideItem {
  id: ID
  text: string
  done: boolean
}

/** "This week at a glance" — a checklist for one week of the semester */
export interface WeekGuide {
  id: ID
  semesterId: ID
  week: number // 1-based week of the semester
  title: string // e.g. "Welcome week"
  items: WeekGuideItem[]
}

export type PortfolioType = 'project' | 'award' | 'internship' | 'research' | 'leadership' | 'certification' | 'other'

export interface PortfolioItem {
  id: ID
  title: string
  emoji: string
  type: PortfolioType
  date?: string // ISO yyyy-mm-dd
  description: string
  link?: string
  skills: string[]
  featured: boolean
}

export interface Settings {
  name: string
  school: string
  theme: 'light' | 'dark'
  monthlyBudget: number
  gradeScale: 'us-4.0' // future: more scales
  pomodoroFocusMin: number
  pomodoroBreakMin: number
  pomodoroLongBreakMin: number
  // Degree audit info (DegreeWorks-style header)
  major: string
  degree: string // e.g. "B.S."
  gradTerm: string // e.g. "Spring 2028"
  creditsRequired: number
  // Accent theming
  accentMode: 'default' | 'school'
  schoolPrimary: string // hex
  schoolSecondary: string // hex
}
