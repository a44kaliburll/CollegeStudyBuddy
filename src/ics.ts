import type { CollegeEventCategory } from './types'

export interface IcsEvent {
  title: string
  date: string // ISO yyyy-mm-dd
  endDate?: string
  description?: string
}

function icsDate(value: string): string {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : ''
}

function unescapeText(s: string): string {
  return s
    .replace(/\\n/gi, ' — ')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim()
}

function shiftISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

/**
 * Minimal iCalendar (.ics) parser for academic calendars.
 * Handles line unfolding, VEVENT blocks, all-day dates (VALUE=DATE, where
 * DTEND is exclusive per RFC 5545) and date-times.
 */
export function parseICS(text: string): IcsEvent[] {
  // Unfold: a line starting with a space/tab continues the previous line
  const unfolded = text.replace(/\r?\n[ \t]/g, '')
  const lines = unfolded.split(/\r?\n/)

  const events: IcsEvent[] = []
  let cur: Partial<IcsEvent> & { endWasDateOnly?: boolean } | null = null

  for (const line of lines) {
    if (/^BEGIN:VEVENT/i.test(line)) {
      cur = {}
      continue
    }
    if (/^END:VEVENT/i.test(line)) {
      if (cur?.title && cur.date) {
        // All-day DTEND is exclusive → pull it back one day
        let endDate = cur.endDate
        if (endDate && cur.endWasDateOnly) endDate = shiftISO(endDate, -1)
        if (endDate && endDate <= cur.date) endDate = undefined
        events.push({ title: cur.title, date: cur.date, endDate, description: cur.description })
      }
      cur = null
      continue
    }
    if (!cur) continue

    const colon = line.indexOf(':')
    if (colon === -1) continue
    const rawKey = line.slice(0, colon)
    const value = line.slice(colon + 1)
    const key = rawKey.split(';')[0].toUpperCase()
    const dateOnly = /VALUE=DATE(?!-TIME)/i.test(rawKey) || /^\d{8}$/.test(value.trim())

    if (key === 'SUMMARY') cur.title = unescapeText(value)
    else if (key === 'DESCRIPTION') cur.description = unescapeText(value).slice(0, 300)
    else if (key === 'DTSTART') cur.date = icsDate(value.trim())
    else if (key === 'DTEND') {
      cur.endDate = icsDate(value.trim())
      cur.endWasDateOnly = dateOnly
    }
  }

  return events.filter((e) => e.date).sort((a, b) => a.date.localeCompare(b.date))
}

/** Best-effort category from an event title */
export function guessCategory(title: string): CollegeEventCategory {
  const t = title.toLowerCase()
  if (/\b(final|midterm|exam)/.test(t)) return 'exams'
  if (/\b(break|holiday|recess|no class)/.test(t)) return 'holiday'
  if (/\b(regist|enroll|advis)/.test(t)) return 'registration'
  if (/\b(deadline|last day|due|drop|withdraw|payment|refund)/.test(t)) return 'deadline'
  if (/\b(fair|festival|orientation|welcome|homecoming|commencement|graduation|convocation)/.test(t)) return 'campus'
  return 'academic'
}
