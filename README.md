# 🎒 Campus Hub — Student Planner

[![Build and deploy Campus Hub](https://github.com/a44kaliburll/CollegeStudyBuddy/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/a44kaliburll/CollegeStudyBuddy/actions/workflows/deploy-pages.yml)

**Live app:** [https://a44kaliburll.github.io/CollegeStudyBuddy/](https://a44kaliburll.github.io/CollegeStudyBuddy/)

A fully featured, playful planner for college students. Campus Hub runs locally in your browser, works on desktop and Android, and stores your information on your device with no account required.

## ✨ Features

| Area | What you get |
|---|---|
| 🏠 **Dashboard** | Greeting + daily quote, due-soon list, today's classes, habit check-offs, budget snapshot, upcoming events, quick to-dos |
| 📚 **Courses** | DegreeWorks-style degree audit (major, degree, cumulative and current-term GPA, credit progress), current courses, and completed courses grouped by term; completing a class archives its final grade **and its notes** |
| 📝 **Assignments** | Assignments, exams, quizzes, projects, labs and readings with priorities, statuses, and Overdue / Today / This week / Later groupings |
| 🗓️ **Timetable** | Auto-built weekly schedule from course meeting times, a current-time line, due-date chips, weekend toggle, and horizontal scrolling on smaller screens |
| 🏛️ **College Calendar** | Per-term academic dates, **.ics import** with automatic categorization, week-by-week checklists, and a current-week summary on the dashboard |
| 🗂️ **Terms** | Switch between semesters, trimesters and shorter sessions. Presets include Fall, Winter, Spring, Summer, Trimester 1, Trimester 2 and Trimester 3. Every name and date remains editable |
| 🎯 **Grades & GPA** | Log graded items with weights per course and see live course percentages, letter grades and a 4.0-scale GPA |
| 📓 **Notes** | Searchable notes per course or general notes, with pinning and autosave |
| ✅ **Habits** | Weekly habit grid with streaks and weekly goals |
| 💰 **Budget** | Income and expense tracking, monthly budget progress, spending by category and month-by-month browsing |
| 🎉 **Social & Goals** | Social events calendar, goals with milestones, read/watch lists with ratings and dorm-friendly meal ideas |
| 💼 **Portfolio** | Showcase projects, awards, internships, research and leadership with skills, links and highlighted items |
| ⏱️ **Focus Timer** | Configurable Pomodoro timer that logs study sessions per course with weekly study-time statistics |
| ⚙️ **Settings** | Profile and degree details, light and dark mode, school-color themes, budget and timer settings, JSON backup/import, sample data and full reset |

## 📱 Android support

Campus Hub is a responsive progressive web app. It is designed to work in modern Android browsers without requiring a native APK.

To install a hosted copy on Android:

1. Open the app's HTTPS address in Chrome.
2. Open Chrome's menu.
3. Choose **Install app** or **Add to Home screen**.
4. Launch Campus Hub from the new home-screen icon.

After the first successful online visit, the app shell is cached so it can reopen without a connection. Your planner data remains in that browser's local storage. Back up your data before clearing browser storage, uninstalling the web app or changing devices.

## 🚀 Run locally

You need [Node.js](https://nodejs.org) installed. From the project folder:

```bash
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### Production build

```bash
npm run build
npm run preview
```

For Android installation and service-worker behavior, deploy the production build to an HTTPS host. Service workers are not enabled for the Electron `file:` build.

### Windows desktop app

```bash
npm run app:exe
```

This creates `release/CampusHub-<version>.exe`, a portable Windows application. The desktop app keeps a separate local copy of your data from browser and Android installations. Use **Settings → Download backup** and **Import backup** to move data between devices.

## 💾 Your data

- Campus Hub stores planner data in the current browser or desktop app using local storage.
- No Campus Hub account or cloud database is required.
- **Settings → Download backup** exports a JSON backup that can be imported on another device.
- Clearing site data, uninstalling the installed web app, or resetting the app can remove local data.
- The app includes sample data for exploration. Use **Settings → Erase all data** for a fresh start.

## 🛠️ Technology

Vite, React 19, TypeScript, Tailwind CSS 4 and Zustand with persisted local storage. The web version includes a manifest, responsive mobile navigation and offline app-shell caching. The Windows version is packaged with Electron.
