# 🎒 Campus Hub — Student Planner

A fully featured, playful planner for college students. Everything lives **on your own computer** — no accounts, no cloud, works offline.

## ✨ Features

| Area | What you get |
|---|---|
| 🏠 **Dashboard** | Greeting + daily quote, due-soon list, today's classes, habit check-offs, budget snapshot, upcoming events, quick to-dos |
| 📚 **Courses** | DegreeWorks-style degree audit (major, degree, cumulative & semester GPA, credit progress), current courses, and completed courses grouped by semester — completing a class archives its final grade **and its notes** |
| 📝 **Assignments** | Assignments, exams, quizzes, projects, labs & readings — priorities, statuses, grouped by Overdue / Today / This week / Later |
| 🗓️ **Timetable** | Auto-built weekly schedule from your course meeting times, "now" line, due-date chips, weekend toggle |
| 🏛️ **College Calendar** | Per-semester academic dates (add/drop, breaks, registration, finals — with ranges), **.ics import** of your school's published calendar with auto-categorization, plus a week-by-week "this week at a glance" checklist with a starter guide and a semester week strip; the current week also shows on the dashboard |
| 🍂 **Semesters** | Sidebar semester switcher with one-click term presets — Fall & Spring (15 wk), Winter (4 wk), Summer (8 wk) — all editable (name and dates) |
| 🎯 **Grades & GPA** | Log graded items with weights per course; live course %, letter grade, and 4.0-scale GPA |
| 📓 **Notes** | Searchable notes per course (or general), pinning, autosave |
| ✅ **Habits** | Weekly habit grid with streaks and weekly goals |
| 💰 **Budget** | Income/expense tracking, monthly budget bar, spending-by-category donut chart, month-by-month browsing |
| 🎉 **Social & Goals** | Social events calendar, goals with milestones, read/watch lists with ratings, dorm-friendly meal ideas |
| 💼 **Portfolio** | Showcase projects, awards, internships, research & leadership with skills, links, and starred highlights |
| ⏱️ **Focus Timer** | Pomodoro timer (configurable) that logs study sessions per course, with weekly study-time stats |
| ⚙️ **Settings** | Name/school/major/degree, light & dark mode, **school-colors accent theme** (pick your school's two colors or a preset), budget amount, timer lengths, JSON backup export/import, sample data, full reset |

## 🚀 Running it

You need [Node.js](https://nodejs.org) installed. Then, in this folder:

```bash
npm install     # first time only
npm run dev     # starts the app at http://localhost:5173
```

Open **http://localhost:5173** in your browser. That's it.

### Production build (optional, faster)

```bash
npm run build
npm run preview   # serves the optimized build
```

### Desktop app (.exe)

```bash
npm run app:exe   # builds release/CampusHub-<version>.exe (portable, no install needed)
```

Double-click the exe and Campus Hub opens in its own window — no browser, no server. Note: the desktop app keeps its own copy of your data, separate from the browser version (use Settings → backup export/import to move data between them).

## 💾 Your data

- Everything is stored in your browser's `localStorage` on this PC — nothing is ever uploaded.
- **Settings → Download backup** saves a JSON file you can re-import anytime (or move to another computer).
- Clearing your browser's site data will erase the planner — keep a backup!
- The app ships with sample data so you can explore; hit **Settings → Erase all data** to start fresh.

## 🛠️ Tech

Vite + React 19 + TypeScript, Tailwind CSS 4, Zustand (persisted to localStorage). Chart colors follow a colorblind-safe validated palette in both light and dark mode.
