import { useEffect, useState } from 'react'
import { useStore } from './store'
import { cx } from './components/ui'
import { SemesterManagerModal, semesterEmoji } from './components/SemesterManager'
import { formatDate } from './utils'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import Assignments from './pages/Assignments'
import Timetable from './pages/Timetable'
import CollegeCalendar from './pages/CollegeCalendar'
import Grades from './pages/Grades'
import Notes from './pages/Notes'
import Habits from './pages/Habits'
import Budget from './pages/Budget'
import Life from './pages/Life'
import Portfolio from './pages/Portfolio'
import Focus from './pages/Focus'
import SettingsPage from './pages/Settings'

export type PageKey =
  | 'dashboard' | 'courses' | 'assignments' | 'timetable' | 'calendar' | 'grades' | 'notes'
  | 'habits' | 'budget' | 'life' | 'portfolio' | 'focus' | 'settings'

const NAV: { key: PageKey; emoji: string; label: string; section?: string }[] = [
  { key: 'dashboard', emoji: '🏠', label: 'Dashboard' },
  { key: 'courses', emoji: '📚', label: 'Courses', section: 'Academics' },
  { key: 'assignments', emoji: '📝', label: 'Assignments' },
  { key: 'timetable', emoji: '🗓️', label: 'Timetable' },
  { key: 'calendar', emoji: '🏛️', label: 'College Calendar' },
  { key: 'grades', emoji: '🎯', label: 'Grades & GPA' },
  { key: 'notes', emoji: '📓', label: 'Notes' },
  { key: 'habits', emoji: '✅', label: 'Habits', section: 'Life' },
  { key: 'budget', emoji: '💰', label: 'Budget' },
  { key: 'life', emoji: '🎉', label: 'Social & Goals' },
  { key: 'portfolio', emoji: '💼', label: 'Portfolio' },
  { key: 'focus', emoji: '⏱️', label: 'Focus Timer' },
  { key: 'settings', emoji: '⚙️', label: 'Settings', section: '' },
]

const PAGES: Record<PageKey, (props: { go: (p: PageKey) => void }) => React.ReactNode> = {
  dashboard: ({ go }) => <Dashboard go={go} />,
  courses: () => <Courses />,
  assignments: () => <Assignments />,
  timetable: () => <Timetable />,
  calendar: () => <CollegeCalendar />,
  grades: () => <Grades />,
  notes: () => <Notes />,
  habits: () => <Habits />,
  budget: () => <Budget />,
  life: () => <Life />,
  portfolio: () => <Portfolio />,
  focus: () => <Focus />,
  settings: () => <SettingsPage />,
}

// Brand shade steps regenerated from the school's colors (mixed in OKLab for even steps)
const BRAND_STEPS: [string, string][] = [
  ['--color-brand-50', '6% , white'], ['--color-brand-100', '12%, white'], ['--color-brand-200', '25%, white'],
  ['--color-brand-300', '45%, white'], ['--color-brand-400', '72%, white'], ['--color-brand-500', '100%, white'],
  ['--color-brand-600', '88%, black'], ['--color-brand-700', '76%, black'], ['--color-brand-800', '62%, black'],
  ['--color-brand-900', '50%, black'],
]
const BUBBLE_STEPS: [string, string][] = [
  ['--color-bubble-100', '14%, white'], ['--color-bubble-400', '78%, white'], ['--color-bubble-500', '100%, white'],
]

function applyAccent(mode: 'default' | 'school', primary: string, secondary: string) {
  const root = document.documentElement
  const setSteps = (steps: [string, string][], color: string) => {
    for (const [name, mix] of steps) {
      if (mode === 'school') root.style.setProperty(name, `color-mix(in oklab, ${color} ${mix})`)
      else root.style.removeProperty(name)
    }
  }
  setSteps(BRAND_STEPS, primary)
  setSteps(BUBBLE_STEPS, secondary)
  // Surface theming (page gradient, sidebar, cards) keys off these — see index.css
  root.dataset.accent = mode
  if (mode === 'school') {
    root.style.setProperty('--sp', primary)
    root.style.setProperty('--ss', secondary)
  } else {
    root.style.removeProperty('--sp')
    root.style.removeProperty('--ss')
  }
}

export default function App() {
  const [page, setPage] = useState<PageKey>('dashboard')
  const [manageSemesters, setManageSemesters] = useState(false)
  const semesters = useStore((s) => s.semesters)
  const activeSemesterId = useStore((s) => s.activeSemesterId)
  const setActiveSemester = useStore((s) => s.setActiveSemester)
  const theme = useStore((s) => s.settings.theme)
  const accentMode = useStore((s) => s.settings.accentMode)
  const schoolPrimary = useStore((s) => s.settings.schoolPrimary)
  const schoolSecondary = useStore((s) => s.settings.schoolSecondary)
  const updateSettings = useStore((s) => s.updateSettings)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    applyAccent(accentMode, schoolPrimary, schoolSecondary)
  }, [accentMode, schoolPrimary, schoolSecondary])

  return (
    <div className="flex h-full text-slate-800 [background:var(--page-bg)] dark:text-slate-100">
      {/* ---------- Sidebar ---------- */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200/70 backdrop-blur [background:var(--sidebar-bg)] dark:border-white/10">
        <div className="flex items-center gap-2.5 px-5 pb-4 pt-6">
          <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-bubble-500 text-xl shadow-lg shadow-brand-500/30">🎒</span>
          <div>
            <div className="font-display text-lg font-bold leading-tight">Campus Hub</div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-brand-400">student planner</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {NAV.map((item) => (
            <div key={item.key}>
              {item.section !== undefined && (
                <div className="mb-1 mt-4 px-3 text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-300 dark:text-slate-600">
                  {item.section}
                </div>
              )}
              <button
                onClick={() => setPage(item.key)}
                className={cx(
                  'mb-0.5 flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm font-bold transition',
                  page === item.key
                    ? 'bg-gradient-to-r from-brand-500 to-brand-400 text-white shadow-md shadow-brand-500/25'
                    : 'text-slate-500 hover:bg-brand-50 hover:text-brand-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200',
                )}
              >
                <span className="text-base">{item.emoji}</span>
                {item.label}
              </button>
            </div>
          ))}

          {/* ---------- Semesters ---------- */}
          <div className="mb-1 mt-5 px-3 text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-300 dark:text-slate-600">
            Semesters
          </div>
          {semesters
            .slice()
            .sort((a, b) => b.startDate.localeCompare(a.startDate))
            .map((sem) => {
              const active = sem.id === activeSemesterId
              return (
                <button
                  key={sem.id}
                  onClick={() => setActiveSemester(sem.id)}
                  title={`Switch to ${sem.name}`}
                  className={cx(
                    'mb-0.5 flex w-full items-center gap-2.5 rounded-2xl px-3 py-1.5 text-left transition',
                    active
                      ? 'bg-brand-100 dark:bg-brand-500/20'
                      : 'hover:bg-brand-50 dark:hover:bg-white/5',
                  )}
                >
                  <span className="text-sm">{semesterEmoji(sem.name)}</span>
                  <span className="min-w-0 flex-1">
                    <span className={cx('block truncate text-sm font-bold leading-tight', active ? 'text-brand-700 dark:text-brand-200' : 'text-slate-500 dark:text-slate-400')}>
                      {sem.name}
                    </span>
                    <span className="block truncate text-[10px] font-bold text-slate-300 dark:text-slate-600">
                      {formatDate(sem.startDate)} – {formatDate(sem.endDate)}
                    </span>
                  </span>
                  {active && <span className="size-1.5 shrink-0 rounded-full bg-brand-500" />}
                </button>
              )
            })}
          <button
            onClick={() => setManageSemesters(true)}
            className="mt-0.5 flex w-full items-center gap-2.5 rounded-2xl px-3 py-1.5 text-left text-xs font-bold text-slate-400 transition hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-white/5 dark:hover:text-slate-200"
          >
            <span className="text-sm">✏️</span> Manage semesters
          </button>
        </nav>

        <div className="border-t border-slate-100 p-3 dark:border-white/10">
          <button
            onClick={() => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' })}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-brand-50 hover:text-brand-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200"
          >
            <span className="text-base">{theme === 'dark' ? '☀️' : '🌙'}</span>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </aside>

      {/* ---------- Main ---------- */}
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-6 lg:p-8">{PAGES[page]({ go: setPage })}</div>
      </main>

      <SemesterManagerModal open={manageSemesters} onClose={() => setManageSemesters(false)} />
    </div>
  )
}
