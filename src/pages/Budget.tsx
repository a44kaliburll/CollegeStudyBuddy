import { useMemo, useState } from 'react'
import { useStore } from '../store'
import type { Transaction, TransactionType } from '../types'
import { fmtMoney, formatDate, monthKey, todayISO, uid } from '../utils'
import { Btn, Card, cx, DeleteBtn, EmptyState, Field, Modal, PageHeader, ProgressBar, SectionTitle, Select, StatTile, TextInput } from '../components/ui'

// Fixed category lists → fixed, stable series-color assignment (color follows the entity)
export const EXPENSE_CATEGORIES = ['Groceries', 'Food & drinks', 'School', 'Transport', 'Fun', 'Subscriptions', 'Health', 'Other'] as const
export const INCOME_CATEGORIES = ['Job', 'Family', 'Scholarship', 'Refund', 'Other'] as const

const CATEGORY_EMOJI: Record<string, string> = {
  Groceries: '🛒', 'Food & drinks': '🍕', School: '🎓', Transport: '🚌', Fun: '🎮',
  Subscriptions: '📺', Health: '💊', Other: '📦', Job: '💼', Family: '👨‍👩‍👧', Scholarship: '🏅', Refund: '↩️',
}

const seriesVar = (i: number) => `var(--series-${i + 1})`
const expenseColor = (category: string) => {
  const idx = EXPENSE_CATEGORIES.indexOf(category as (typeof EXPENSE_CATEGORIES)[number])
  return seriesVar(idx === -1 ? EXPENSE_CATEGORIES.length - 1 : idx)
}

function shiftMonth(mk: string, delta: number): string {
  const [y, m] = mk.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const monthLabel = (mk: string) => {
  const [y, m] = mk.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function Budget() {
  const s = useStore()
  const [adding, setAdding] = useState(false)
  const [month, setMonth] = useState(monthKey(todayISO()))

  const monthTx = useMemo(
    () => s.transactions.filter((t) => monthKey(t.date) === month).sort((a, b) => b.date.localeCompare(a.date)),
    [s.transactions, month],
  )
  const income = monthTx.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const spent = monthTx.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const budget = s.settings.monthlyBudget
  const budgetPct = budget > 0 ? (spent / budget) * 100 : 0

  // Spending by category (fixed category order keeps colors stable)
  const byCategory = EXPENSE_CATEGORIES.map((cat) => ({
    cat,
    total: monthTx.filter((t) => t.type === 'expense' && (t.category === cat || (cat === 'Other' && !EXPENSE_CATEGORIES.includes(t.category as never)))).reduce((sum, t) => sum + t.amount, 0),
  })).filter((x) => x.total > 0)

  const isCurrentMonth = month === monthKey(todayISO())

  return (
    <div className="pop-in">
      <PageHeader
        emoji="💰"
        title="Budget"
        subtitle="Know where your money goes"
        actions={
          <>
            <div className="flex items-center gap-1 rounded-full bg-slate-100 px-1 py-1 dark:bg-slate-800">
              <button className="grid size-7 place-items-center rounded-full font-bold text-slate-500 hover:bg-white dark:hover:bg-slate-700" onClick={() => setMonth(shiftMonth(month, -1))}>‹</button>
              <span className="px-2 text-sm font-bold">{monthLabel(month)}</span>
              <button
                className="grid size-7 place-items-center rounded-full font-bold text-slate-500 hover:bg-white disabled:opacity-30 dark:hover:bg-slate-700"
                onClick={() => setMonth(shiftMonth(month, 1))}
                disabled={isCurrentMonth}
              >
                ›
              </button>
            </div>
            <Btn variant="primary" onClick={() => setAdding(true)}>＋ Add transaction</Btn>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile emoji="💵" label="Income" value={fmtMoney(income)} />
        <StatTile emoji="💸" label="Spent" value={fmtMoney(spent)} />
        <StatTile emoji="🎯" label="Budget" value={fmtMoney(budget)} sub={budget > 0 ? `${Math.round(budgetPct)}% used` : 'set in Settings'} />
        <StatTile
          emoji={income - spent >= 0 ? '🐷' : '🚨'}
          label="Net this month"
          value={fmtMoney(income - spent)}
          sub={income - spent >= 0 ? 'in the green!' : 'spending > income'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: donut + budget bar */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <SectionTitle>Where it went</SectionTitle>
            {byCategory.length === 0 ? (
              <p className="py-8 text-center text-sm font-semibold text-slate-400">No expenses in {monthLabel(month)} 🎉</p>
            ) : (
              <Donut data={byCategory} total={spent} />
            )}
          </Card>

          <Card>
            <SectionTitle>Monthly budget</SectionTitle>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold">{fmtMoney(spent)}</span>
              <span className="text-sm font-bold text-slate-400">of {fmtMoney(budget)}</span>
            </div>
            <ProgressBar
              value={budgetPct}
              className="mt-3"
              barClassName={budgetPct > 100 ? '!bg-rose-500 !bg-none' : budgetPct > 80 ? '!bg-amber-400 !bg-none' : undefined}
            />
            <p className="mt-2 text-xs font-semibold text-slate-400">
              {budget === 0
                ? 'Set your monthly budget in Settings to track this.'
                : budgetPct > 100
                  ? `${fmtMoney(spent - budget)} over — time for ramen 🍜`
                  : `${fmtMoney(budget - spent)} left this month`}
            </p>
          </Card>
        </div>

        {/* Right: transactions */}
        <div className="lg:col-span-3">
          <Card>
            <SectionTitle>Transactions — {monthLabel(month)}</SectionTitle>
            {monthTx.length === 0 ? (
              <EmptyState emoji="🧾" title="No transactions yet" hint="Log what you earn and spend to see the picture." action={<Btn variant="primary" onClick={() => setAdding(true)}>Add one</Btn>} />
            ) : (
              <div className="space-y-1.5">
                {monthTx.map((t) => (
                  <div key={t.id} className="group flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-xl text-base"
                      style={t.type === 'expense' ? { backgroundColor: `color-mix(in oklab, ${expenseColor(t.category)} 18%, transparent)` } : { backgroundColor: 'color-mix(in oklab, var(--status-good) 15%, transparent)' }}
                    >
                      {CATEGORY_EMOJI[t.category] ?? (t.type === 'income' ? '💵' : '📦')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold">{t.description || t.category}</div>
                      <div className="text-xs font-semibold text-slate-400">{t.category} · {formatDate(t.date, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                    </div>
                    <span className={cx('text-sm font-extrabold tabular-nums', t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200')}>
                      {t.type === 'income' ? '+' : '−'}{fmtMoney(t.amount)}
                    </span>
                    <div className="opacity-0 transition group-hover:opacity-100">
                      <DeleteBtn small onDelete={() => s.remove('transactions', t.id)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {adding && <TxModal onClose={() => setAdding(false)} />}
    </div>
  )
}

// ---------------- Donut chart (validated categorical palette, hover + legend) ----------------
function Donut({ data, total }: { data: { cat: string; total: number }[]; total: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const R = 70
  const CIRC = 2 * Math.PI * R
  let acc = 0

  const active = hover !== null ? data[hover] : null

  return (
    <div>
      <div className="relative mx-auto w-fit">
        <svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label="Spending by category">
          {data.map((d, i) => {
            const frac = d.total / total
            const dash = Math.max(frac * CIRC - 3, 1) // 3px gap between segments
            const offset = -acc * CIRC
            acc += frac
            return (
              <circle
                key={d.cat}
                cx="100" cy="100" r={R}
                fill="none"
                stroke={expenseColor(d.cat)}
                strokeWidth={hover === i ? 26 : 20}
                strokeDasharray={`${dash} ${CIRC - dash}`}
                strokeDashoffset={offset - CIRC / 4}
                strokeLinecap="butt"
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            )
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-lg font-extrabold">{fmtMoney(active ? active.total : total)}</div>
            <div className="max-w-24 text-[11px] font-bold leading-tight text-slate-400">
              {active ? `${CATEGORY_EMOJI[active.cat] ?? ''} ${active.cat}` : 'total spent'}
            </div>
          </div>
        </div>
      </div>

      {/* Legend doubles as the value table */}
      <div className="mt-3 space-y-1">
        {data
          .slice()
          .sort((a, b) => b.total - a.total)
          .map((d) => {
            const i = data.indexOf(d)
            return (
              <div
                key={d.cat}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                className={cx('flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold', hover === i && 'bg-slate-50 dark:bg-slate-800/60')}
              >
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: expenseColor(d.cat) }} />
                <span className="flex-1 truncate">{CATEGORY_EMOJI[d.cat]} {d.cat}</span>
                <span className="tabular-nums text-slate-500 dark:text-slate-400">{fmtMoney(d.total)}</span>
                <span className="w-10 text-right text-xs tabular-nums text-slate-400">{Math.round((d.total / total) * 100)}%</span>
              </div>
            )
          })}
      </div>
    </div>
  )
}

// ---------------- Add transaction ----------------
function TxModal({ onClose }: { onClose: () => void }) {
  const add = useStore((s) => s.add)
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<string>('Groceries')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayISO())

  const cats = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  const save = () => {
    const amt = Number(amount)
    if (!amt || amt <= 0) return
    const tx: Transaction = { id: uid(), type, amount: amt, category, description: description.trim(), date }
    add('transactions', tx)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Add transaction">
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setType(t)
                setCategory(t === 'expense' ? 'Groceries' : 'Job')
              }}
              className={cx(
                'rounded-xl py-2 text-sm font-bold transition',
                type === t ? 'bg-white shadow dark:bg-slate-700' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300',
              )}
            >
              {t === 'expense' ? '💸 Expense' : '💵 Income'}
            </button>
          ))}
        </div>
        <Field label="Amount ($)">
          <TextInput type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" autoFocus />
        </Field>
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {cats.map((c) => (
              <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Description (optional)">
          <TextInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Coffee with Sam" />
        </Field>
        <Field label="Date">
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={save} disabled={!Number(amount)}>Add</Btn>
      </div>
    </Modal>
  )
}
