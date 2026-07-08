# TaskFlow — MERN Todo Management System

A full-stack task management application built with the MERN stack. TaskFlow lets users create and organise tasks into projects, track progress through a Kanban board and calendar view, and review productivity trends through an analytics dashboard.

## Table of Contents

- [Live Demo](#live-demo)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Application Workflow](#application-workflow)
- [Security](#security)
- [Validation](#validation)
- [Performance](#performance)
- [Testing](#testing)
- [Deployment](#deployment)
- [Future Improvements](#future-improvements)
- [License](#license)
- [Author](#author)

---

## Live Demo

Coming soon

---

## 🚀 Features

- **Authentication** — Register, login, logout with JWT access + refresh token pair; persistent sessions via httpOnly cookie
- **Task Management** — Create, edit, delete tasks with title, description, due date, priority, category, tags, and subtasks
- **Task Status** — Three-state workflow: To Do → In Progress → Done; optimistic UI updates with server rollback
- **Quick Add** — Type-and-Enter task creation from the Dashboard without opening the full form
- **Projects** — Group tasks into colour-coded projects; deleting a project moves its tasks to Inbox rather than deleting them
- **Kanban Board** — Drag-and-drop task cards between To Do / In Progress / Done columns within each project
- **Calendar View** — Monthly calendar with task pills, day panel, and in-place task rescheduling by clicking a target date
- **Analytics Dashboard** — Completion rate donut, priority breakdown bar chart, per-category donut and bar charts, weekly completion trend (last 8 weeks), and consecutive-day streak counter
- **Filters & Search** — Filter tasks by status (Today / Upcoming / Overdue / All) and category; debounced full-text search across title, description, and category
- **Pagination** — Server-side pagination on task list (20 per page)
- **Activity Feed** — Chronological log of task and project events displayed on the Dashboard
- **Profile** — Update display name, change password, view account statistics
- **Responsive Layout** — Collapsible sidebar on mobile via hamburger menu; fixed sidebar on desktop

---

## 🛠️ Tech Stack

### Frontend (`/client`)

| Purpose | Library / Tool | Version |
|---|---|---|
| UI framework | React | ^19.2.7 |
| Routing | react-router-dom | ^7.18.1 |
| HTTP client | axios | ^1.18.1 |
| State management | zustand | ^5.0.14 |
| Forms | react-hook-form | ^7.81.0 |
| Schema validation | zod | ^4.4.3 |
| Form resolvers | @hookform/resolvers | ^5.4.0 |
| Charts | recharts | ^3.9.2 |
| Drag and drop | @dnd-kit/core, @dnd-kit/sortable | ^6.3.1 / ^10.0.0 |
| Icons | lucide-react | ^1.23.0 |
| Toast notifications | react-hot-toast | ^2.6.0 |
| Date utilities | date-fns | ^4.4.0 |
| Styling | Tailwind CSS v4 | ^4.3.2 |
| CSS helpers | clsx, tailwind-merge, class-variance-authority | latest |
| Build tool | Vite | ^8.x |
| Linter | oxlint | ^1.71.0 |

### Backend (`/server`)

| Purpose | Library / Tool | Version |
|---|---|---|
| Web framework | Express | ^4.19.2 |
| Database ODM | Mongoose | ^8.5.0 |
| Authentication | jsonwebtoken | ^9.0.2 |
| Password hashing | bcryptjs | ^2.4.3 |
| Schema validation | zod | ^3.23.8 |
| Rate limiting | express-rate-limit | ^7.4.0 |
| Security headers | helmet | ^7.1.0 |
| CORS | cors | ^2.8.5 |
| Cookie parsing | cookie-parser | ^1.4.7 |
| Environment config | dotenv | ^17.4.2 |
| Runtime TS execution | tsx | ^4.16.0 |

### Database

| Component | Technology |
|---|---|
| Database | MongoDB (MongoDB Atlas in production) |
| Local development | Docker Compose (`mongo:7` image) |

---

## Architecture

```
Browser (React + Vite)
       │
       │  /api/* (proxied in dev by Vite; direct HTTPS in production)
       ▼
Express.js API (Node.js + TypeScript)
       │  authenticate middleware (JWT Bearer token)
       │  authLimiter middleware (express-rate-limit on auth routes)
       │  errorHandler middleware (centralised JSON error responses)
       │
       ├── /api/auth        → AuthController
       ├── /api/tasks       → TasksController
       ├── /api/projects    → ProjectsController
       ├── /api/analytics   → AnalyticsController
       └── /api/activity    → ActivityController
                │
                ▼
         MongoDB Atlas (Mongoose ODM)
         Collections: users · tasks · projects · activities
```

**Token flow:** The frontend stores the short-lived access token (15 min) in Zustand memory only. The long-lived refresh token (7 days) is stored exclusively in an httpOnly cookie. The Axios response interceptor silently refreshes the access token on any 401 response and replays the original request.

---

## Folder Structure

```
taskflow/
├── docker-compose.yml          # MongoDB 7 local container
├── package.json                # Workspace root (npm workspaces)
├── client/                     # React frontend
│   ├── vite.config.ts
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/           # LoginPage, RegisterPage, authStore (Zustand)
│   │   │   ├── dashboard/      # DashboardPage, TaskListItem, ActivityFeed
│   │   │   ├── tasks/          # TaskDetailPage (create + edit form)
│   │   │   ├── projects/       # ProjectsPage, KanbanBoard
│   │   │   ├── calendar/       # CalendarPage
│   │   │   ├── analytics/      # AnalyticsPage
│   │   │   └── profile/        # ProfilePage
│   │   ├── components/
│   │   │   └── Layout.tsx      # Sidebar, mobile nav, outlet wrapper
│   │   ├── routes/
│   │   │   ├── AppRouter.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   └── lib/
│   │       ├── api.ts          # Axios instance + interceptors
│   │       ├── constants.ts    # CATEGORIES, CATEGORY_META
│   │       └── utils.ts        # cn() helper
└── server/                     # Express backend
    ├── src/
    │   ├── index.ts            # App entry point, MongoDB connect, server start
    │   ├── models/
    │   │   ├── User.ts
    │   │   ├── Task.ts
    │   │   ├── Project.ts
    │   │   └── Activity.ts
    │   ├── controllers/
    │   │   ├── auth.controller.ts
    │   │   ├── tasks.controller.ts
    │   │   ├── projects.controller.ts
    │   │   ├── analytics.controller.ts
    │   │   └── activity.controller.ts
    │   ├── routes/
    │   │   ├── auth.routes.ts
    │   │   ├── tasks.routes.ts
    │   │   ├── projects.routes.ts
    │   │   ├── analytics.routes.ts
    │   │   └── activity.routes.ts
    │   ├── middleware/
    │   │   ├── auth.middleware.ts
    │   │   ├── errorHandler.ts
    │   │   └── rateLimiter.ts
    │   └── services/
    │       └── activity.service.ts
    └── scripts/
        └── seedDemoData.ts     # Demo data seeder (git-ignored)
```

---

## Installation

**Prerequisites:** Node.js 20+, npm 10+, MongoDB (local via Docker or a MongoDB Atlas URI)

```bash
# 1. Clone the repository
git clone https://github.com/Tarun-sde/ToDo-List.git
cd ToDo-List

# 2. Install all workspaces
npm install

# 3. Configure environment
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and JWT secrets (see below)

# 4. (Optional) Start local MongoDB via Docker
docker-compose up -d

# 5. Start both client and server in development mode
npm run dev
```

The client runs at `http://localhost:5173` and the server at `http://localhost:5000`. Vite proxies all `/api/*` requests to the backend.

**Seed demo data** (optional):
```bash
npm run seed
```

---

## Environment Variables

Create `server/.env` based on `server/.env.example`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/taskflow
JWT_ACCESS_SECRET=                   # min 32 random characters
JWT_REFRESH_SECRET=                  # min 32 random characters, different from above
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```

Generate secure secrets with:
```bash
openssl rand -hex 32
```

---

## API Overview

All routes below `/api/auth` are rate-limited (15 requests per 15 minutes in production). All other routes require a valid `Authorization: Bearer <access_token>` header.

### Auth — `/api/auth`

| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create a new user account |
| POST | `/login` | Authenticate and receive access token + refresh cookie |
| POST | `/refresh` | Exchange refresh cookie for a new access token |
| POST | `/logout` | Clear the refresh token cookie |
| GET | `/me` | Return the authenticated user's profile |
| PUT | `/profile` | Update the authenticated user's display name |
| PUT | `/change-password` | Change the authenticated user's password |

### Tasks — `/api/tasks`

| Method | Path | Description |
|---|---|---|
| GET | `/` | List tasks with optional filters: `status`, `project`, `priority`, `category`, `search`, `dueBefore`, `dueAfter`, `page`, `limit` |
| POST | `/` | Create a new task |
| GET | `/:id` | Get a single task by ID |
| PUT | `/:id` | Update a task (full update) |
| PATCH | `/:id/status` | Update only the status field |
| DELETE | `/:id` | Delete a task |

### Projects — `/api/projects`

| Method | Path | Description |
|---|---|---|
| GET | `/` | List all projects with task counts |
| POST | `/` | Create a project |
| GET | `/:id` | Get a single project |
| PUT | `/:id` | Update project name or colour |
| DELETE | `/:id` | Delete project; nullifies task `project` references |

### Analytics — `/api/analytics`

| Method | Path | Description |
|---|---|---|
| GET | `/summary` | Aggregated stats: completion rate, tasks per week (last 8), priority breakdown, streak, tasks by category, completed by category |

### Activity — `/api/activity`

| Method | Path | Description |
|---|---|---|
| GET | `/` | Return recent activity records (`?limit=N`, max 50) |

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Returns `{ status: "ok" }` |

---

## Database Schema

### User

```
name          String   required
email         String   required, unique, lowercase
passwordHash  String   required
createdAt     Date     auto (timestamps)
updatedAt     Date     auto (timestamps)
```

### Task

```
title         String   required
description   String   optional
owner         ObjectId ref: User, required
project       ObjectId ref: Project, nullable
status        Enum     'todo' | 'in-progress' | 'done'  default: 'todo'
priority      Enum     'low' | 'medium' | 'high'         default: 'medium'
category      Enum     'Study' | 'Work' | 'Personal' | 'Fitness' | 'Shopping' | 'Other'
dueDate       Date     optional
tags          [String]
subtasks      [{ title: String, completed: Boolean }]
completedAt   Date     set automatically when status → 'done'
createdAt     Date     auto (timestamps)
updatedAt     Date     auto (timestamps)

Indexes: { owner, status }, { owner, dueDate }
```

### Project

```
name          String   required
owner         ObjectId ref: User, required
color         String   hex colour, default: '#6366f1'
createdAt     Date     auto (timestamps)
updatedAt     Date     auto (timestamps)

Index: { owner }
```

### Activity

```
user          ObjectId ref: User, required
type          Enum     TASK_CREATED | TASK_UPDATED | TASK_COMPLETED | TASK_DELETED |
                       PROJECT_CREATED | PROJECT_UPDATED | PROJECT_DELETED |
                       PROFILE_UPDATED | PASSWORD_CHANGED
message       String   required
referenceId   ObjectId optional
referenceType String   optional
createdAt     Date     auto (timestamps, updatedAt disabled)

Index: { user, createdAt: -1 }
```

---

## Authentication

The application uses a **dual-token JWT scheme**:

- **Access token** (15-minute expiry) — signed with `JWT_ACCESS_SECRET`, stored in Zustand state (memory only, cleared on tab close)
- **Refresh token** (7-day expiry) — signed with `JWT_REFRESH_SECRET`, stored in an httpOnly, SameSite=Lax cookie; never accessible to JavaScript

On every page load the `ProtectedRoute` component attempts to exchange the refresh cookie for a new access token. If the exchange fails the user is redirected to `/login`.

The Axios instance in `lib/api.ts` attaches the access token as a `Bearer` header on every request and queues concurrent requests during a token refresh to avoid duplicate refresh calls.

Passwords are hashed with **bcryptjs** at cost factor 12.

---

## Application Workflow

```
Register / Login
      ↓
Dashboard  ← quick-add · search · filter by status & category · activity feed
      ↓
Task Detail  ← full form: title · description · project · category · priority
             · due date · tags · subtasks
      ↓
Projects  ← project cards with task counts
      ↓
Kanban Board  ← drag-and-drop tasks between To Do / In Progress / Done
      ↓
Calendar  ← monthly view · click day for task panel · drag task to reschedule
      ↓
Analytics  ← completion donut · priority bars · category charts · weekly trend
      ↓
Profile  ← edit name · change password · view stats
```

---

## Security

| Measure | Implementation |
|---|---|
| Password hashing | bcryptjs, cost factor 12 |
| JWT verification | `jsonwebtoken` `verify()` on every protected request |
| httpOnly cookie | Refresh token inaccessible to JavaScript |
| Security headers | `helmet` middleware on all routes |
| CORS | Configured with explicit `CLIENT_ORIGIN` and `credentials: true` |
| Rate limiting | `express-rate-limit` on all `/api/auth/*` routes (15 req / 15 min in production) |
| Centralised error handler | Never leaks stack traces in production (`NODE_ENV === 'production'` guard) |

---

## Validation

**Server-side:** All request bodies are validated with **Zod** schemas in the controller layer before touching the database. Invalid requests receive a structured `400 VALIDATION_ERROR` JSON response.

**Client-side:** Auth forms use **react-hook-form** with **Zod** resolvers via `@hookform/resolvers/zod`. Errors are displayed inline per field.

---

## Performance

- **Server-side pagination** — Task list defaults to 20 results per page; page and limit are query parameters
- **Compound indexes** — `{ owner, status }` and `{ owner, dueDate }` on the Task collection accelerate dashboard queries
- **Debounced search** — 300 ms debounce on the search input before the API request fires
- **Optimistic updates** — Task status toggles update the UI immediately and roll back on API error
- **Parallel aggregations** — Analytics `getSummary` runs all six aggregation pipelines concurrently with `Promise.all`

---

## Testing

### Backend — Jest + Supertest

Framework: **Jest** with **ts-jest** transformer and **Supertest** for HTTP assertions.

Test files in `server/src/__tests__/`:

| File | Coverage |
|---|---|
| `auth.test.ts` | Register, login, duplicate email, invalid credentials |
| `tasks.test.ts` | Create, read, update, delete, status patch |
| `projects.test.ts` | Create, read, update, delete |
| `activity.test.ts` | Activity log retrieval |

Run server tests:
```bash
npm test
```

### Frontend — Vitest + Testing Library

Framework: **Vitest** with **@testing-library/react** and **jsdom**.

Test file: `client/src/__tests__/DashboardPage.test.tsx`

Run client tests:
```bash
npm test --workspace=client
```

---

## Deployment

No deployment configuration files (`vercel.json`, `render.yaml`, etc.) exist in the repository at this time.

**Recommended approach:**

- **Backend** — Deploy `server/` to Railway or Render; set all environment variables from `server/.env.example` in the platform dashboard
- **Frontend** — Deploy `client/` to Vercel; set the `VITE_API_URL` environment variable to the full backend base URL (e.g. `https://your-backend.railway.app/api`) and update `CLIENT_ORIGIN` in the backend environment to match the Vercel domain. The Axios client reads `VITE_API_URL` at build time and falls back to the relative `/api` path for local development.
- **Database** — MongoDB Atlas (already used in development via `MONGO_URI`)

The `docker-compose.yml` at the root provides a local MongoDB 7 container for development only.

---

## Future Improvements

Planned features not yet implemented:

- **Planned:** Task recurrence rules (daily / weekly / monthly repeating tasks)
- **Planned:** Email notifications for overdue tasks
- **Planned:** Team collaboration — shared projects and task assignment
- **Planned:** Dark / light theme toggle
- **Planned:** PWA support and offline mode
- **Planned:** Export tasks to CSV / PDF
- **Planned:** Full-text search index on MongoDB for faster search at scale

---

## Contributing

```bash
# 1. Fork the repository
# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Commit your changes
git commit -m "feat: describe the change"

# 4. Push and open a pull request
git push origin feature/your-feature-name
```

Please keep PRs focused on a single concern and include test coverage for new controller logic.

---

## License

This project does not yet include a LICENSE file. The author intends to release it under the **MIT License** — a LICENSE file will be added before public release.

---

## Author

**Tarun** — [github.com/Tarun-sde](https://github.com/Tarun-sde)

---

## Acknowledgements

Built with [React](https://react.dev), [Express](https://expressjs.com), [MongoDB](https://www.mongodb.com), [Mongoose](https://mongoosejs.com), [Tailwind CSS](https://tailwindcss.com), [Recharts](https://recharts.org), [@dnd-kit](https://dndkit.com), [Zustand](https://zustand-demo.pmnd.rs), [Zod](https://zod.dev), [Vite](https://vite.dev), and [date-fns](https://date-fns.org).
