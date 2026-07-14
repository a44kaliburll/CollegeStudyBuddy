import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Assignment, CollegeEvent, Course, GradeItem, Goal, Habit, ID, MediaItem, Meal, Note, PortfolioItem,
  QuickTask, Semester, Settings, SocialEvent, StudySession, Transaction, WeekGuide,
} from './types'
import { addDays, toISODate, todayISO, uid } from './utils'

// Map of every persisted collection -> its item type, so CRUD actions are fully typed
export interface Collections {
  semesters: Semester
  courses: Course
  assignments: Assignment
  grades: GradeItem
  notes: Note
  habits: Habit
  transactions: Transaction
  events: SocialEvent
  goals: Goal
  media: MediaItem
  meals: Meal
  quickTasks: QuickTask
  sessions: StudySession
  portfolio: PortfolioItem
  collegeEvents: CollegeEvent
  weekGuides: WeekGuide
}

export type CollectionKey = keyof Collections

type CollectionState = { [K in CollectionKey]: Collections[K][] }

export interface AppState extends CollectionState {
  settings: Settings
  activeSemesterId: ID | null

  add: <K extends CollectionKey>(key: K, item: Collections[K]) => void
  update: <K extends CollectionKey>(key: K, id: ID, patch: Partial<Collections[K]>) => void
  remove: <K extends CollectionKey>(key: K, id: ID) => void

  setActiveSemester: (id: ID | null) => void
  completeCourse: (id: ID, finalGrade: string) => void
  reopenCourse: (id: ID) => void
  deleteCourseCascade: (id: ID) => void
  deleteSemesterCascade: (id: ID) => void
  toggleHabitDay: (habitId: ID, dateISO: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  importData: (json: string) => string | null
  resetAll: () => void
  loadSample: () => void
}

export const DATA_KEYS: (CollectionKey | 'settings' | 'activeSemesterId')[] = [
  'settings', 'activeSemesterId', 'semesters', 'courses', 'assignments', 'grades', 'notes',
  'habits', 'transactions', 'events', 'goals', 'media', 'meals', 'quickTasks', 'sessions', 'portfolio',
  'collegeEvents', 'weekGuides',
]

const defaultSettings: Settings = {
  name: '',
  school: '',
  theme: 'light',
  monthlyBudget: 800,
  gradeScale: 'us-4.0',
  pomodoroFocusMin: 25,
  pomodoroBreakMin: 5,
  pomodoroLongBreakMin: 15,
  major: '',
  degree: '',
  gradTerm: '',
  creditsRequired: 120,
  accentMode: 'default',
  schoolPrimary: '#1e3a8a',
  schoolSecondary: '#f59e0b',
}

function emptyData(): CollectionState & { activeSemesterId: ID | null } {
  return {
    semesters: [], courses: [], assignments: [], grades: [], notes: [], habits: [],
    transactions: [], events: [], goals: [], media: [], meals: [], quickTasks: [], sessions: [],
    portfolio: [], collegeEvents: [], weekGuides: [], activeSemesterId: null,
  }
}

/** Demo data generated relative to today so the app always looks alive on first run */
function buildSeed(): CollectionState & { activeSemesterId: ID | null } {
  const now = new Date()
  const iso = (offsetDays: number) => toISODate(addDays(now, offsetDays))
  const month = now.getMonth()
  const season = month <= 4 ? 'Spring' : month <= 6 ? 'Summer' : 'Fall'

  const sem: Semester = {
    id: uid(),
    name: `${season} ${now.getFullYear()}`,
    startDate: iso(-30),
    endDate: iso(75),
  }

  // A finished semester so the completed-courses audit has history
  const prevSem: Semester = {
    id: uid(),
    name: month <= 4 ? `Fall ${now.getFullYear() - 1}` : `Spring ${now.getFullYear()}`,
    startDate: iso(-170),
    endDate: iso(-45),
  }

  const cs: Course = {
    id: uid(), semesterId: sem.id, name: 'Data Structures', code: 'CS 201',
    instructor: 'Dr. Chen', credits: 4, color: 'violet', emoji: '💻', status: 'current',
    meetings: [
      { day: 0, start: '10:00', end: '11:15', location: 'ENG 204' },
      { day: 2, start: '10:00', end: '11:15', location: 'ENG 204' },
      { day: 4, start: '14:00', end: '15:50', location: 'Lab B12' },
    ],
  }
  const psy: Course = {
    id: uid(), semesterId: sem.id, name: 'Intro to Psychology', code: 'PSY 110',
    instructor: 'Prof. Rivera', credits: 3, color: 'pink', emoji: '🧠', status: 'current',
    meetings: [
      { day: 1, start: '09:30', end: '10:45', location: 'HUM 130' },
      { day: 3, start: '09:30', end: '10:45', location: 'HUM 130' },
    ],
  }
  const math: Course = {
    id: uid(), semesterId: sem.id, name: 'Calculus II', code: 'MATH 152',
    instructor: 'Dr. Okafor', credits: 4, color: 'sky', emoji: '📐', status: 'current',
    meetings: [
      { day: 0, start: '13:00', end: '13:50', location: 'SCI 310' },
      { day: 2, start: '13:00', end: '13:50', location: 'SCI 310' },
      { day: 3, start: '13:00', end: '13:50', location: 'SCI 310' },
    ],
  }
  const eng: Course = {
    id: uid(), semesterId: sem.id, name: 'Creative Writing', code: 'ENG 105',
    instructor: 'Prof. Bell', credits: 3, color: 'amber', emoji: '✍️', status: 'current',
    meetings: [
      { day: 1, start: '15:00', end: '16:15', location: 'HUM 22' },
      { day: 3, start: '15:00', end: '16:15', location: 'HUM 22' },
    ],
  }

  const completed: Course[] = [
    {
      id: uid(), semesterId: prevSem.id, name: 'Intro to Programming', code: 'CS 101',
      instructor: 'Dr. Patel', credits: 4, color: 'teal', emoji: '💻', status: 'completed',
      finalGrade: 'A', meetings: [],
      archivedNotes: [
        { title: 'Loops & functions recap', content: 'for vs while — use for when you know the count.\nFunctions: keep them small, one job each.\nDon’t forget: Python is 0-indexed!' },
        { title: 'Final project ideas', content: 'Went with the budget CLI tool — got full marks on documentation.' },
      ],
    },
    {
      id: uid(), semesterId: prevSem.id, name: 'Calculus I', code: 'MATH 151',
      instructor: 'Dr. Okafor', credits: 4, color: 'sky', emoji: '📐', status: 'completed',
      finalGrade: 'B+', meetings: [],
      archivedNotes: [
        { title: 'Derivative rules', content: 'Power, product, quotient, chain.\nChain rule trips me up — work outside-in.' },
      ],
    },
    {
      id: uid(), semesterId: prevSem.id, name: 'College Composition', code: 'ENG 101',
      instructor: 'Prof. Nguyen', credits: 3, color: 'rose', emoji: '📝', status: 'completed',
      finalGrade: 'A-', meetings: [],
      archivedNotes: [],
    },
    {
      id: uid(), semesterId: prevSem.id, name: 'World History', code: 'HIST 110',
      instructor: 'Dr. Brooks', credits: 3, color: 'orange', emoji: '🌍', status: 'completed',
      finalGrade: 'B', meetings: [],
      archivedNotes: [{ title: 'Essay themes', content: 'Trade routes essay got an A — thesis-first structure worked well.' }],
    },
  ]

  const courses = [cs, psy, math, eng, ...completed]

  const assignments: Assignment[] = [
    { id: uid(), courseId: cs.id, title: 'Binary tree lab', type: 'lab', dueDate: iso(1), dueTime: '23:59', status: 'in-progress', priority: 'high' },
    { id: uid(), courseId: math.id, title: 'Problem set 6 — integration by parts', type: 'assignment', dueDate: iso(2), status: 'todo', priority: 'medium' },
    { id: uid(), courseId: psy.id, title: 'Chapter 7 reading + response', type: 'reading', dueDate: iso(0), status: 'todo', priority: 'medium' },
    { id: uid(), courseId: eng.id, title: 'Short story draft', type: 'project', dueDate: iso(6), status: 'todo', priority: 'high', notes: '1,500–2,500 words, any genre' },
    { id: uid(), courseId: cs.id, title: 'Midterm exam', type: 'exam', dueDate: iso(9), dueTime: '10:00', status: 'todo', priority: 'high', notes: 'Covers lists, stacks, queues, trees' },
    { id: uid(), courseId: math.id, title: 'Quiz — sequences', type: 'quiz', dueDate: iso(4), status: 'todo', priority: 'low' },
    { id: uid(), courseId: psy.id, title: 'Research participation form', type: 'assignment', dueDate: iso(-2), status: 'done', priority: 'low' },
    { id: uid(), courseId: eng.id, title: 'Poem workshop feedback', type: 'assignment', dueDate: iso(-1), status: 'todo', priority: 'medium' },
  ]

  const grades: GradeItem[] = [
    { id: uid(), courseId: cs.id, name: 'Lab 1', category: 'Labs', score: 47, total: 50, weight: 5 },
    { id: uid(), courseId: cs.id, name: 'Lab 2', category: 'Labs', score: 44, total: 50, weight: 5 },
    { id: uid(), courseId: cs.id, name: 'Homework 1', category: 'Homework', score: 92, total: 100, weight: 10 },
    { id: uid(), courseId: cs.id, name: 'Quiz 1', category: 'Quizzes', score: 17, total: 20, weight: 10 },
    { id: uid(), courseId: psy.id, name: 'Reading responses', category: 'Homework', score: 58, total: 60, weight: 20 },
    { id: uid(), courseId: psy.id, name: 'Exam 1', category: 'Exams', score: 84, total: 100, weight: 25 },
    { id: uid(), courseId: math.id, name: 'Problem sets 1–5', category: 'Homework', score: 236, total: 250, weight: 25 },
    { id: uid(), courseId: math.id, name: 'Midterm 1', category: 'Exams', score: 78, total: 100, weight: 30 },
    { id: uid(), courseId: eng.id, name: 'Poem portfolio', category: 'Portfolio', score: 19, total: 20, weight: 30 },
  ]

  const notes: Note[] = [
    {
      id: uid(), title: 'Big-O cheat sheet', courseId: cs.id, pinned: true,
      updatedAt: new Date().toISOString(),
      content: 'Array access O(1), search O(n)\nLinked list insert O(1) at head\nBST search/insert O(log n) average, O(n) worst\nHash map get/put O(1) average\n\nRemember: amortized analysis for dynamic arrays!',
    },
    {
      id: uid(), title: 'Memory & encoding (Ch. 7)', courseId: psy.id, pinned: false,
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      content: 'Encoding → storage → retrieval\nWorking memory ~7±2 items (Miller)\nElaborative rehearsal beats maintenance rehearsal\nSpacing effect: distributed practice > cramming',
    },
    {
      id: uid(), title: 'Story ideas', courseId: eng.id, pinned: false,
      updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      content: '- A campus radio DJ who only broadcasts at 3am\n- The last bookstore on Earth\n- Roommates who never meet (opposite schedules)',
    },
  ]

  const mkLog = (offsets: number[]): Record<string, true> =>
    Object.fromEntries(offsets.map((o) => [iso(o), true])) as Record<string, true>

  const habits: Habit[] = [
    { id: uid(), name: 'Gym / workout', emoji: '💪', target: 4, log: mkLog([-6, -4, -2, -1]) },
    { id: uid(), name: 'Read 20 minutes', emoji: '📖', target: 5, log: mkLog([-6, -5, -3, -2, -1, 0]) },
    { id: uid(), name: '8 hours of sleep', emoji: '😴', target: 7, log: mkLog([-5, -4, -3, -1]) },
    { id: uid(), name: 'No energy drinks', emoji: '🚫', target: 5, log: mkLog([-6, -5, -2]) },
  ]

  const transactions: Transaction[] = [
    { id: uid(), type: 'income', amount: 450, category: 'Job', description: 'Campus bookstore paycheck', date: iso(-6) },
    { id: uid(), type: 'income', amount: 200, category: 'Family', description: 'From mom & dad', date: iso(-12) },
    { id: uid(), type: 'expense', amount: 62.4, category: 'Groceries', description: 'Weekly groceries', date: iso(-5) },
    { id: uid(), type: 'expense', amount: 14.5, category: 'Food & drinks', description: 'Pizza night', date: iso(-4) },
    { id: uid(), type: 'expense', amount: 89.99, category: 'School', description: 'Chem lab goggles + notebook', date: iso(-10) },
    { id: uid(), type: 'expense', amount: 11.99, category: 'Subscriptions', description: 'Music streaming', date: iso(-8) },
    { id: uid(), type: 'expense', amount: 24, category: 'Fun', description: 'Movie tickets', date: iso(-2) },
    { id: uid(), type: 'expense', amount: 38.75, category: 'Groceries', description: 'Groceries top-up', date: iso(-1) },
    { id: uid(), type: 'expense', amount: 15, category: 'Transport', description: 'Rideshare to campus', date: iso(-3) },
  ]

  const events: SocialEvent[] = [
    { id: uid(), title: 'Movie night with roommates', date: iso(2), time: '20:00', location: 'Dorm lounge', emoji: '🍿', category: 'social' },
    { id: uid(), title: 'Robotics club meeting', date: iso(3), time: '18:00', location: 'ENG 110', emoji: '🤖', category: 'club' },
    { id: uid(), title: 'Intramural soccer game', date: iso(5), time: '16:00', location: 'South field', emoji: '⚽', category: 'sports' },
    { id: uid(), title: "Call grandma", date: iso(6), emoji: '📞', category: 'family' },
  ]

  const goals: Goal[] = [
    {
      id: uid(), title: 'Make Dean’s List this semester', emoji: '🏆', category: 'academic', targetDate: iso(75),
      milestones: [
        { id: uid(), text: 'Keep GPA above 3.5 at midterms', done: true },
        { id: uid(), text: 'Go to office hours every other week', done: false },
        { id: uid(), text: 'Finish every assignment on time', done: false },
      ],
    },
    {
      id: uid(), title: 'Land a summer internship', emoji: '💼', category: 'career', targetDate: iso(140),
      milestones: [
        { id: uid(), text: 'Polish resume', done: true },
        { id: uid(), text: 'Apply to 15 companies', done: false },
        { id: uid(), text: 'Do 3 mock interviews', done: false },
      ],
    },
    {
      id: uid(), title: 'Save $500 emergency fund', emoji: '🐷', category: 'financial', targetDate: iso(100),
      milestones: [
        { id: uid(), text: 'Save first $100', done: true },
        { id: uid(), text: 'Set up auto-transfer', done: false },
      ],
    },
  ]

  const media: MediaItem[] = [
    { id: uid(), title: 'Project Hail Mary', kind: 'book', status: 'in-progress' },
    { id: uid(), title: 'Atomic Habits', kind: 'book', status: 'done', rating: 4 },
    { id: uid(), title: 'Spirited Away', kind: 'movie', status: 'planned' },
    { id: uid(), title: 'Severance', kind: 'show', status: 'in-progress', rating: 5 },
  ]

  const meals: Meal[] = [
    { id: uid(), name: 'Overnight oats', emoji: '🥣', category: 'breakfast', minutes: 5, favorite: true, recipe: 'Oats + milk + peanut butter + banana. Fridge overnight.' },
    { id: uid(), name: 'Chicken burrito bowl', emoji: '🌯', category: 'dinner', minutes: 25, favorite: true, recipe: 'Rice, beans, grilled chicken, salsa, cheese.' },
    { id: uid(), name: 'Caprese sandwich', emoji: '🥪', category: 'lunch', minutes: 10, favorite: false },
    { id: uid(), name: 'Apple + peanut butter', emoji: '🍎', category: 'snack', minutes: 2, favorite: false },
  ]

  const quickTasks: QuickTask[] = [
    { id: uid(), title: 'Return library books', done: false, createdAt: new Date().toISOString() },
    { id: uid(), title: 'Email advisor about fall classes', done: false, createdAt: new Date().toISOString() },
    { id: uid(), title: 'Laundry', done: true, createdAt: new Date().toISOString() },
  ]

  const portfolio: PortfolioItem[] = [
    {
      id: uid(), title: 'Campus food-truck finder app', emoji: '🚚', type: 'project',
      date: iso(-60), featured: true,
      description: 'Built a web app that maps campus food trucks in real time. 300+ students used it during welcome week.',
      link: 'https://github.com/', skills: ['React', 'TypeScript', 'APIs'],
    },
    {
      id: uid(), title: '1st place — HackState 2026', emoji: '🏆', type: 'award',
      date: iso(-95), featured: true,
      description: 'Won best beginner hack out of 40 teams with a study-buddy matching tool built in 24 hours.',
      skills: ['Teamwork', 'Pitching', 'Node.js'],
    },
    {
      id: uid(), title: 'Peer tutor — intro programming', emoji: '🧑‍🏫', type: 'leadership',
      date: iso(-30), featured: false,
      description: 'Tutor 6 students weekly in CS 101 topics through the campus learning center.',
      skills: ['Communication', 'Python'],
    },
  ]

  // Academic calendar dates, anchored to the semester (start = iso(-30), end = iso(75))
  const collegeEvents: CollegeEvent[] = [
    { id: uid(), semesterId: sem.id, title: 'Classes begin', date: sem.startDate, category: 'academic' },
    { id: uid(), semesterId: sem.id, title: 'Add/drop period ends', date: iso(-20), category: 'deadline', notes: 'Last day to change your schedule without a "W"' },
    { id: uid(), semesterId: sem.id, title: 'Tuition payment due', date: iso(-15), category: 'deadline' },
    { id: uid(), semesterId: sem.id, title: 'Career & internship fair', date: iso(6), category: 'campus', notes: 'Student union ballroom — bring resumes!' },
    { id: uid(), semesterId: sem.id, title: 'Midterm exams', date: iso(12), endDate: iso(16), category: 'exams' },
    { id: uid(), semesterId: sem.id, title: 'Registration opens for next term', date: iso(20), category: 'registration', notes: 'Meet your advisor before your window opens' },
    { id: uid(), semesterId: sem.id, title: 'Fall break — no classes', date: iso(30), endDate: iso(31), category: 'holiday' },
    { id: uid(), semesterId: sem.id, title: 'Last day to withdraw with a "W"', date: iso(40), category: 'deadline' },
    { id: uid(), semesterId: sem.id, title: 'Reading day', date: iso(68), category: 'academic' },
    { id: uid(), semesterId: sem.id, title: 'Final exams', date: iso(69), endDate: iso(74), category: 'exams' },
    { id: uid(), semesterId: sem.id, title: 'Semester ends', date: sem.endDate, category: 'academic' },
  ]

  // "This week at a glance" guides (semester started 30 days ago → today is week 5)
  const mkItems = (texts: string[]): WeekGuide['items'] => texts.map((t) => ({ id: uid(), text: t, done: false }))
  const weekGuides: WeekGuide[] = [
    {
      id: uid(), semesterId: sem.id, week: 1, title: 'Welcome week',
      items: [
        { id: uid(), text: 'Classes begin — show up to everything', done: true },
        { id: uid(), text: 'Add/drop courses', done: true },
        { id: uid(), text: 'Connect with your advisor', done: true },
        { id: uid(), text: 'Get familiar with the help desk', done: true },
      ],
    },
    {
      id: uid(), semesterId: sem.id, week: 2, title: 'Settle in',
      items: [
        { id: uid(), text: 'Finalize textbooks & materials', done: true },
        { id: uid(), text: 'Block out a weekly study schedule', done: true },
        { id: uid(), text: 'Join a club or two', done: false },
      ],
    },
    {
      id: uid(), semesterId: sem.id, week: 5, title: 'Midterms ahead',
      items: mkItems([
        'Check every syllabus for midterm dates',
        'Book a library study room',
        'Start a review sheet per course',
        'Ask professors about exam format',
      ]),
    },
    {
      id: uid(), semesterId: sem.id, week: 6, title: 'Midterm week',
      items: mkItems(['Sleep — seriously', 'Review sessions > cramming', 'Treat yourself after the last exam']),
    },
    {
      id: uid(), semesterId: sem.id, week: 15, title: 'Finals week',
      items: mkItems(['Check the final exam schedule', 'Plan study blocks per exam', 'Back up your notes', 'Celebrate when it’s done 🎉']),
    },
  ]

  const sessions: StudySession[] = [
    { id: uid(), date: iso(-1), minutes: 50, courseId: cs.id, label: 'Tree traversal practice' },
    { id: uid(), date: iso(-1), minutes: 25, courseId: math.id },
    { id: uid(), date: iso(-2), minutes: 75, courseId: cs.id, label: 'Lab prep' },
    { id: uid(), date: iso(-3), minutes: 25, courseId: psy.id },
    { id: uid(), date: iso(-4), minutes: 50, courseId: math.id },
  ]

  return {
    semesters: [sem, prevSem], courses, assignments, grades, notes, habits, transactions,
    events, goals, media, meals, quickTasks, sessions, portfolio, collegeEvents, weekGuides,
    activeSemesterId: sem.id,
  }
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      ...buildSeed(),

      add: (key, item) => set((s) => ({ [key]: [...s[key], item] }) as Pick<AppState, typeof key>),

      update: (key, id, patch) =>
        set((s) => ({
          [key]: (s[key] as { id: ID }[]).map((x) => (x.id === id ? { ...x, ...patch } : x)),
        }) as Pick<AppState, typeof key>),

      remove: (key, id) =>
        set((s) => ({ [key]: (s[key] as { id: ID }[]).filter((x) => x.id !== id) }) as Pick<AppState, typeof key>),

      setActiveSemester: (id) => set({ activeSemesterId: id }),

      completeCourse: (id, finalGrade) =>
        set((s) => ({
          courses: s.courses.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status: 'completed' as const,
                  finalGrade,
                  // snapshot this course's notes so they live with the completed record
                  archivedNotes: s.notes.filter((n) => n.courseId === id).map((n) => ({ title: n.title, content: n.content })),
                }
              : c,
          ),
        })),

      reopenCourse: (id) =>
        set((s) => ({
          courses: s.courses.map((c) =>
            c.id === id ? { ...c, status: 'current' as const, finalGrade: undefined, archivedNotes: undefined } : c,
          ),
        })),

      deleteCourseCascade: (id) =>
        set((s) => ({
          courses: s.courses.filter((c) => c.id !== id),
          assignments: s.assignments.filter((a) => a.courseId !== id),
          grades: s.grades.filter((g) => g.courseId !== id),
          notes: s.notes.map((n) => (n.courseId === id ? { ...n, courseId: null } : n)),
          sessions: s.sessions.map((x) => (x.courseId === id ? { ...x, courseId: null } : x)),
        })),

      deleteSemesterCascade: (id) => {
        const s = get()
        const courseIds = new Set(s.courses.filter((c) => c.semesterId === id).map((c) => c.id))
        set({
          semesters: s.semesters.filter((x) => x.id !== id),
          courses: s.courses.filter((c) => c.semesterId !== id),
          assignments: s.assignments.filter((a) => !a.courseId || !courseIds.has(a.courseId)),
          grades: s.grades.filter((g) => !courseIds.has(g.courseId)),
          notes: s.notes.map((n) => (n.courseId && courseIds.has(n.courseId) ? { ...n, courseId: null } : n)),
          sessions: s.sessions.map((x) => (x.courseId && courseIds.has(x.courseId) ? { ...x, courseId: null } : x)),
          collegeEvents: s.collegeEvents.filter((e) => e.semesterId !== id),
          weekGuides: s.weekGuides.filter((g) => g.semesterId !== id),
          activeSemesterId: s.activeSemesterId === id ? (s.semesters.find((x) => x.id !== id)?.id ?? null) : s.activeSemesterId,
        })
      },

      toggleHabitDay: (habitId, dateISO) =>
        set((s) => ({
          habits: s.habits.map((h) => {
            if (h.id !== habitId) return h
            const log = { ...h.log }
            if (log[dateISO]) delete log[dateISO]
            else log[dateISO] = true
            return { ...h, log }
          }),
        })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      importData: (json) => {
        try {
          const data = JSON.parse(json)
          if (typeof data !== 'object' || data === null || !Array.isArray(data.courses)) {
            return 'That file doesn’t look like a Campus Hub backup.'
          }
          const patch: Record<string, unknown> = {}
          for (const key of DATA_KEYS) {
            if (key in data) patch[key] = data[key]
          }
          set(patch as Partial<AppState>)
          return null
        } catch {
          return 'Could not read that file — it isn’t valid JSON.'
        }
      },

      resetAll: () => set({ ...emptyData(), settings: { ...defaultSettings, theme: get().settings.theme } }),

      loadSample: () => set({ ...buildSeed() }),
    }),
    {
      name: 'campus-hub-data',
      version: 4,
      migrate: (persisted, version) => {
        const state = persisted as Partial<AppState>
        if (version < 2) {
          state.courses = (state.courses ?? []).map((c) => ({ ...c, status: c.status ?? ('current' as const) }))
          state.settings = { ...defaultSettings, ...state.settings }
          state.portfolio = state.portfolio ?? []
        }
        if (version < 3) {
          state.collegeEvents = state.collegeEvents ?? []
          state.weekGuides = state.weekGuides ?? []
        }
        if (version < 4) {
          // calendar entries become per-semester; adopt existing ones into the active semester
          const fallback = state.activeSemesterId ?? state.semesters?.[0]?.id ?? ''
          state.collegeEvents = (state.collegeEvents ?? []).map((e) => ({ ...e, semesterId: e.semesterId ?? fallback }))
          state.weekGuides = (state.weekGuides ?? []).map((g) => ({ ...g, semesterId: g.semesterId ?? fallback }))
        }
        return state
      },
    },
  ),
)

/** Everything worth backing up, as a JSON string */
export function exportData(): string {
  const s = useStore.getState()
  const out: Record<string, unknown> = {}
  for (const key of DATA_KEYS) out[key] = s[key]
  return JSON.stringify(out, null, 2)
}

// Convenience selectors
export const useActiveCourses = () => {
  const courses = useStore((s) => s.courses)
  const activeSemesterId = useStore((s) => s.activeSemesterId)
  return courses.filter((c) => c.status !== 'completed' && (!activeSemesterId || c.semesterId === activeSemesterId))
}

export const todayISOString = todayISO
