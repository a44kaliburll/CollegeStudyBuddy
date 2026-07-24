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
  const [menuOpen, setMenuOpen] = useState(false)
  const semesters = useStore((s) => s.semesters)
  const activeSemesterId = useStore((s) => s.activeSemesterId)
  const setActiveSemester = useStore((s) => s.setActiveSemester)
  const theme = useStore((s) => s.settings.theme)
  const accentMode = useStore((s) => s.settings.accentMode)
  const schoolPrimary = useStore((s) => s.settings.schoolPrimary)
  const schoolSecondary = useStore((s) => s.settings.schoolSecondary)
  const updateSettings = useStore((s) => s.updateSettings)
  const currentPage = NAV.find((item) => item.key === page)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    applyAccent(accentMode, schoolPrimary, schoolSecondary)
  }, [accentMode, schoolPrimary, schoolSecondary])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const go = (next: PageKey) => {
    setPage(next)
    setMenuOpen(false)
  }

  const sidebar = (
    <aside className="flex h-full w-[min(19rem,88vw)] shrink-0 flex-col border-r border-slate-200/70 backdrop-blur [background:var(--sidebar-bg)] dark:border-white/10 lg:w-60">
      <div className="flex items-center gap-2.5 px-5 pb-4 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-bubble-500 text-xl shadow-lg shadow-brand-500/30">🎒</span>
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg font-bold leading-tight">Campus Hub</div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-brand-400">student planner</div>
        </div>
        <button type="button" className="grid size-11 place-items-center rounded-full text-xl text-slate-500 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close navigation">✕</button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((item) => (
          <div key={item.key}>
            {item.section !== undefined && (
              <div className="mb-1 mt-4 px-3 text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-300 dark:text-slate-600">{item.section}</div>
            )}
            <button
              onClick={() => go(item.key)}
              className={cx(
                'mb-0.5 flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm font-bold transition',
                page === item.key
                  ? 'bg-gradient-to-r from-brand-500 to-brand-400 text-white shadow-md shadow-brand-500/25'
                  : 'text-slate-500 hover:bg-brand-50 hover:text-brand-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200',
              )}
            >
              <span className="text-base">{item.emoji}</span>{item.label}
            </button>
          </div>
        ))}

        <div className="mb-1 mt-5 px-3 text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-300 dark:text-slate-600">Terms</div>
        {semesters.slice().sort((a, b) => b.startDate.localeCompare(a.startDate)).map((sem) => {
          const active = sem.id === activeSemesterId
          return (
            <button
              key={sem.id}
              onClick={() => { setActiveSemester(sem.id); setMenuOpen(false) }}
              title={`Switch to ${sem.name}`}
              className={cx('mb-0.5 flex min-h-11 w-full items-center gap-2.5 rounded-2xl px-3 py-1.5 text-left transition', active ? 'bg-brand-100 dark:bg-brand-500/20' : 'hover:bg-brand-50 dark:hover:bg-white/5')}
            >
              <span className="text-sm">{semesterEmoji(sem.name)}</span>
              <span className="min-w-0 flex-1">
                <span className={cx('block truncate text-sm font-bold leading-tight', active ? 'text-brand-700 dark:text-brand-200' : 'text-slate-500 dark:text-slate-400')}>{sem.name}</span>
                <span className="block truncate text-[10px] font-bold text-slate-300 dark:text-slate-600">{formatDate(sem.startDate)} – {formatDate(sem.endDate)}</span>
              </span>
              {active && <span className="size-1.5 shrink-0 rounded-full bg-brand-500" />}
            </button>
          )
        })}
        <button onClick={() => { setManageSemesters(true); setMenuOpen(false) }} className="mt-0.5 flex min-h-11 w-full items-center gap-2.5 rounded-2xl px-3 py-1.5 text-left text-xs font-bold text-slate-400 transition hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-white/5 dark:hover:text-slate-200">
          <span className="text-sm">✏️</span> Manage terms
        </button>
      </nav>

      <div className="border-t border-slate-100 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] dark:border-white/10">
        <button onClick={() => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' })} className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-brand-50 hover:text-brand-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200">
          <span className="text-base">{theme === 'dark' ? '☀️' : '🌙'}</span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-full min-h-0 text-slate-800 [background:var(--page-bg)] dark:text-slate-100">
      <div className="hidden lg:block">{sidebar}</div>
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button className="absolute inset-0 bg-slate-950/50" onClick={() => setMenuOpen(false)} aria-label="Close navigation overlay" />
          <div className="relative h-full shadow-2xl">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 items-center gap-3 border-b border-slate-200/70 px-4 pt-[env(safe-area-inset-top)] backdrop-blur [background:var(--sidebar-bg)] dark:border-white/10 lg:hidden">
          <button type="button" className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-100 text-xl text-brand-700 dark:bg-brand-500/20 dark:text-brand-200" onClick={() => setMenuOpen(true)} aria-label="Open navigation">☰</button>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{currentPage?.label}</div>
            <div className="truncate text-xs font-semibold text-slate-400">Campus Hub</div>
          </div>
        </header>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto max-w-6xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6 lg:p-8">{PAGES[page]({ go })}</div>
        </main>
      </div>

      <SemesterManagerModal open={manageSemesters} onClose={() => setManageSemesters(false)} />
    </div>
  )
}
