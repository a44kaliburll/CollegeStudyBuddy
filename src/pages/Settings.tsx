import { useRef, useState } from 'react'
import { exportData, useStore } from '../store'
import { todayISO } from '../utils'
import { Btn, Card, Field, PageHeader, SectionTitle, Select, TextInput } from '../components/ui'

// Classic school color pairings — one click, instant spirit
const SCHOOL_PRESETS = [
  { name: 'SUNY Poly Wildcats', primary: '#18468B', secondary: '#EDAC09' },
  { name: 'Navy & Gold', primary: '#1e3a8a', secondary: '#f59e0b' },
  { name: 'Crimson & Cream', primary: '#9f1239', secondary: '#fde68a' },
  { name: 'Forest & White', primary: '#166534', secondary: '#86efac' },
  { name: 'Purple & Gold', primary: '#6b21a8', secondary: '#fbbf24' },
  { name: 'Orange & Blue', primary: '#c2410c', secondary: '#3b82f6' },
  { name: 'Maroon & Gold', primary: '#7f1d1d', secondary: '#fcd34d' },
  { name: 'Scarlet & Gray', primary: '#b91c1c', secondary: '#9ca3af' },
  { name: 'Teal & Coral', primary: '#0f766e', secondary: '#fb7185' },
]

export default function SettingsPage() {
  const s = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const download = () => {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `campus-hub-backup-${todayISO()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('Backup downloaded ✅')
  }

  const onImportFile = async (file: File | undefined) => {
    if (!file) return
    const text = await file.text()
    const err = s.importData(text)
    setMessage(err ? `⚠️ ${err}` : 'Data imported ✅')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="pop-in max-w-2xl">
      <PageHeader emoji="⚙️" title="Settings" subtitle="Make it yours" />

      <div className="space-y-6">
        <Card>
          <SectionTitle>👤 Profile</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name">
              <TextInput value={s.settings.name} onChange={(e) => s.updateSettings({ name: e.target.value })} placeholder="What should we call you?" />
            </Field>
            <Field label="School">
              <TextInput value={s.settings.school} onChange={(e) => s.updateSettings({ school: e.target.value })} placeholder="e.g. State University" />
            </Field>
          </div>
        </Card>

        <Card>
          <SectionTitle>🎨 Appearance</SectionTitle>
          <div className="grid gap-4">
            <Field label="Theme">
              <Select value={s.settings.theme} onChange={(e) => s.updateSettings({ theme: e.target.value as 'light' | 'dark' })}>
                <option value="light">☀️ Light</option>
                <option value="dark">🌙 Dark</option>
              </Select>
            </Field>

            <Field label="Accent colors">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
                {(
                  [
                    ['default', '🎨 Campus Hub'],
                    ['school', '🏫 School colors'],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => s.updateSettings({ accentMode: mode })}
                    className={
                      s.settings.accentMode === mode
                        ? 'rounded-xl bg-white py-2 text-sm font-bold shadow dark:bg-slate-700'
                        : 'rounded-xl py-2 text-sm font-bold text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300'
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>

            {s.settings.accentMode === 'school' && (
              <div className="pop-in rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Primary color">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={s.settings.schoolPrimary}
                        onChange={(e) => s.updateSettings({ schoolPrimary: e.target.value })}
                        className="h-10 w-14 cursor-pointer rounded-xl border-0 bg-transparent"
                      />
                      <span className="text-xs font-bold uppercase text-slate-400">{s.settings.schoolPrimary}</span>
                    </div>
                  </Field>
                  <Field label="Secondary color">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={s.settings.schoolSecondary}
                        onChange={(e) => s.updateSettings({ schoolSecondary: e.target.value })}
                        className="h-10 w-14 cursor-pointer rounded-xl border-0 bg-transparent"
                      />
                      <span className="text-xs font-bold uppercase text-slate-400">{s.settings.schoolSecondary}</span>
                    </div>
                  </Field>
                </div>
                <p className="mb-2 mt-3 text-xs font-bold uppercase tracking-wide text-slate-400">Quick presets</p>
                <div className="flex flex-wrap gap-2">
                  {SCHOOL_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      title={p.name}
                      onClick={() => s.updateSettings({ schoolPrimary: p.primary, schoolSecondary: p.secondary })}
                      className="flex items-center gap-0 overflow-hidden rounded-full ring-1 ring-slate-900/10 transition hover:scale-110 dark:ring-white/20"
                    >
                      <span className="block h-7 w-5" style={{ backgroundColor: p.primary }} />
                      <span className="block h-7 w-5" style={{ backgroundColor: p.secondary }} />
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-400">
                  The whole app takes on your school's colors — buttons, gradients, and the page itself: light mode becomes a soft
                  gradient of your colors, dark mode a deep gradient of them. Tip: darker primaries read best.
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle>🎓 Academics</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Major">
              <TextInput value={s.settings.major} onChange={(e) => s.updateSettings({ major: e.target.value })} placeholder="e.g. Computer Science" />
            </Field>
            <Field label="Degree">
              <TextInput value={s.settings.degree} onChange={(e) => s.updateSettings({ degree: e.target.value })} placeholder="e.g. B.S." />
            </Field>
            <Field label="Expected graduation">
              <TextInput value={s.settings.gradTerm} onChange={(e) => s.updateSettings({ gradTerm: e.target.value })} placeholder="e.g. Spring 2028" />
            </Field>
            <Field label="Credits required for degree">
              <TextInput
                type="number"
                min="0"
                value={s.settings.creditsRequired}
                onChange={(e) => s.updateSettings({ creditsRequired: Math.max(0, Number(e.target.value)) })}
              />
            </Field>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-400">Shown in the degree-audit header on the Courses page.</p>
        </Card>

        <Card>
          <SectionTitle>💰 Budget</SectionTitle>
          <Field label="Monthly budget ($)">
            <TextInput
              type="number"
              min="0"
              value={s.settings.monthlyBudget}
              onChange={(e) => s.updateSettings({ monthlyBudget: Math.max(0, Number(e.target.value)) })}
            />
          </Field>
        </Card>

        <Card>
          <SectionTitle>🍅 Focus timer</SectionTitle>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Focus (min)">
              <TextInput type="number" min="1" max="120" value={s.settings.pomodoroFocusMin} onChange={(e) => s.updateSettings({ pomodoroFocusMin: Math.max(1, Number(e.target.value)) })} />
            </Field>
            <Field label="Break (min)">
              <TextInput type="number" min="1" max="60" value={s.settings.pomodoroBreakMin} onChange={(e) => s.updateSettings({ pomodoroBreakMin: Math.max(1, Number(e.target.value)) })} />
            </Field>
            <Field label="Long break (min)">
              <TextInput type="number" min="1" max="90" value={s.settings.pomodoroLongBreakMin} onChange={(e) => s.updateSettings({ pomodoroLongBreakMin: Math.max(1, Number(e.target.value)) })} />
            </Field>
          </div>
        </Card>

        <Card>
          <SectionTitle>💾 Your data</SectionTitle>
          <p className="mb-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
            Everything lives in your browser on this computer — nothing is uploaded anywhere.
            Download a backup now and then, especially before clearing browser data.
          </p>
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" onClick={download}>⬇️ Download backup</Btn>
            <Btn onClick={() => fileRef.current?.click()}>⬆️ Import backup</Btn>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onImportFile(e.target.files?.[0])} />
            <Btn onClick={() => { s.loadSample(); setMessage('Sample data loaded ✅') }}>🌱 Load sample data</Btn>
            {confirmReset ? (
              <Btn
                variant="danger"
                onClick={() => {
                  s.resetAll()
                  setConfirmReset(false)
                  setMessage('Everything cleared. Fresh start! 🧼')
                }}
              >
                ⚠️ Click again to erase everything
              </Btn>
            ) : (
              <Btn variant="danger" onClick={() => { setConfirmReset(true); setTimeout(() => setConfirmReset(false), 4000) }}>
                🗑️ Erase all data
              </Btn>
            )}
          </div>
          {message && <p className="mt-3 text-sm font-bold text-brand-600 dark:text-brand-300">{message}</p>}
        </Card>

        <p className="pb-4 text-center text-xs font-semibold text-slate-300 dark:text-slate-600">
          Campus Hub 🎒 — made for students, data stays on your device
        </p>
      </div>
    </div>
  )
}
