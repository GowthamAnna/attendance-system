# Project Summary — Attendance System

A bilingual (Japanese/English) attendance request system for foreign employees at a
Japanese company (MORABU HANSHIN Industry). Employees submit attendance requests
(late arrival, early departure, leave, etc.) to their managers. The system
auto-generates JP/EN notification emails and can pre-fill the company's standard
届 (todoke) Excel form. Requests are **one-directional** — employees submit, admins
receive and track (no approve/reject).

**Live on Railway.** For full detail, see [CLAUDE.md](./CLAUDE.md) — this file is just a map.

---

## Monorepo Layout (npm workspaces)

```
attendance-system/
├── shared/     # Shared TypeScript types + bilingual message generator
├── server/     # Node.js + Express REST API + PostgreSQL
└── client/     # React 19 + Vite 8 frontend
```

| Package | Purpose |
|---|---|
| `shared/` | Common types (`types.ts`) and `generateMessage()` — turns form data into JP/EN email text |
| `server/` | Express API, PostgreSQL access, auth (JWT), email (Brevo/Nodemailer), todoke Excel generation |
| `client/` | React SPA — login, dashboards, request form, admin management |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 19, Vite 8, react-i18next (default `ja`), react-router-dom 7, inline CSS |
| Backend | Node.js + Express (REST) |
| Database | PostgreSQL 18 |
| Auth | JWT — 15-min access token (in memory) + 8-hr refresh token (httpOnly cookie) |
| Email | Brevo HTTP API (prod) / Nodemailer SMTP (local) |
| Excel | ExcelJS (fills xlsx template); hanko/stamp rendering present but disabled |
| Tests | Jest + Supertest (backend, real test DB), Vitest + RTL (frontend/shared) |

---

## Backend Map (`server/src/`)

| Area | Files | Notes |
|---|---|---|
| Entry | `app.ts` (createApp factory), `index.ts` (listen), `config.ts` | Tests import `createApp()` directly |
| Routes | `auth`, `users`, `requests`, `admin`, `attachments`, `employees`, `todoke` | REST endpoints under `/api` |
| Middleware | `authMiddleware`, `roleMiddleware`, `errorHandler` | JWT verify + role guard |
| DB | `pool.ts`, `migrate.ts`, `seed.ts`, `migrations/` (008 files), `queries/` | DATE columns returned as strings |
| Services | `email/` (auto-selects Brevo vs SMTP), `todoke/` (Excel fill + hanko), `cleanupJob.ts` | Cron cleanup of expired attachments |

---

## Frontend Map (`client/src/`)

| Area | Key files |
|---|---|
| Pages | `LoginPage`, `DashboardPage` (user), `RequestFormPage`, `ConfirmPage`, `AdminPage`, `AdminEmployeesPage` |
| Components | `Navbar` (drawer), `RequestDetailPanel`, `EmployeeDetailPanel`, `AttachmentPreviewModal` (PDF/XLSX), `PasswordRevealModal`, `Footer`, `Toast`, `ProtectedRoute`, `LanguageToggle` |
| Context | `AuthContext` (user/login/logout), `ToastContext` |
| Infra | `api/client.ts` (apiFetch, silent 401→refresh), `hooks/useRequests.ts`, `i18n.ts`, `locales/{en,ja}.json` |

---

## Core Features

- **Auth** — JWT access/refresh; self-service forgot-password (no account enumeration)
- **Request submission** — 7 request types with per-type reason lists and conditional fields
- **Bilingual email** — auto-generated JP/EN manager notifications (fire-and-forget send)
- **Admin dashboard** — per-admin read/unread tracking (Gmail-style), filters, hard-delete
- **Employee management** (`/admin/employees`) — full CRUD, temp passwords, manager assignment, audit trail
- **Todoke generation** — fills the company 届 Excel template from request data (attach on ConfirmPage)
- **Attachment preview** — in-browser PDF + XLSX preview

### 7 Request Types
`late` (遅刻), `early_departure` (早退), `absence`/leave (休暇), `other_request` (その他),
`chokko` (直行), `chokki` (直帰), `kyujitsu_shukkin` (休日出勤)

---

## Common Commands

```bash
npm run dev                  # Server (:4000) + client (:5173)
npm test                     # All tests (shared + server)
npm run build                # Build shared → server → client

cd server && npm run migrate # Run DB migrations
cd server && npm run seed    # Seed accounts
cd client && npm run lint    # ESLint (client only)
```

---

## Key Architecture Gotchas (see CLAUDE.md for full list)

- **Vite alias required** — `@attendance/shared` → TS source (shared compiles to CJS; browser can't run it)
- **`import type`** required for all shared type imports (`verbatimModuleSyntax: true`)
- **Access token in memory only** — never localStorage (XSS-safe)
- **Email is fire-and-forget** — not awaited, to avoid blocking the HTTP response
- **DATE columns return strings** — custom pg type parser avoids timezone shift
- **Per-admin read tracking** — `request_read_status` junction table; adminId always from JWT
- **`reason_category` is nullable** — `other_request` needs no reason
- Todoke template asset must be copied to `dist/` in the build (`cp -r src/assets`)
```
