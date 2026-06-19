# Taskmanagerabc

A full-stack Task Manager app deployed entirely on Netlify — React frontend + Netlify serverless functions (Express-style API) + MongoDB Atlas database.

🔗 Live app: https://taskmanagerabc.netlify.app

---

## Tech Stack

- **Frontend:** React 18, React Router, Axios, React Hot Toast
- **Backend:** Netlify Serverless Functions (Node.js, single bundled function)
- **Database:** MongoDB Atlas (via Mongoose)
- **Auth:** JWT (JSON Web Tokens), bcrypt password hashing
- **Hosting:** Netlify (frontend + functions in one deploy)

---

## Project Structure

```
Taskmanagerabc/
├── frontend/                  # React app
│   ├── public/
│   ├── src/
│   │   ├── components/        # TaskCard, TaskList, TaskModal, StatsBar, TaskFilters
│   │   ├── context/           # AuthContext, TaskContext
│   │   ├── pages/             # LoginPage, RegisterPage, DashboardPage
│   │   ├── services/api.js    # Axios instance, calls /api/*
│   │   └── App.js
│   └── package.json
├── netlify/
│   └── functions/
│       └── api.js             # All backend routes (auth + tasks) in one function
├── netlify.toml                # Build command, publish dir, redirects
├── package.json                 # Root deps — used by the function bundler (esbuild)
└── .env.example
```

---

## How It Works

- `netlify.toml` redirects all `/api/*` requests to the single serverless function at `/.netlify/functions/api`.
- That function is a router that handles both `/api/auth/*` (register, login, me) and `/api/tasks/*` (CRUD, stats, toggle, etc.), backed by Mongoose models for `User` and `Task`.
- MongoDB connection is cached across warm function invocations to avoid reconnecting on every request.
- The frontend calls relative path `/api` (no hardcoded backend URL needed) — works automatically on any Netlify domain.

---

## Environment Variables (set in Netlify, not committed to Git)

| Key | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string (includes DB name `Taskmanagerabc`) |
| `JWT_SECRET` | Secret used to sign/verify JWT auth tokens |
| `JWT_EXPIRE` | Token expiry, e.g. `7d` |

Set these under **Netlify → Project configuration → Environment variables**, using the "New environment variable" form (one at a time — avoid the "Import .env" box, which expects raw `KEY=value` lines, not labeled text).

⚠️ **Important:** changing environment variables does **not** apply to a function until you trigger a new deploy (Deploys → Trigger deploy → Clear cache and deploy site).

---

## Local Development

```bash
# Install root deps (used by the function)
npm install

# Install and run frontend
cd frontend
npm install
npm start
```

To test functions locally, use the [Netlify CLI](https://docs.netlify.com/cli/get-started/):
```bash
npm install -g netlify-cli
netlify dev
```

---

## Deployment Notes / Lessons Learned

A few real gotchas hit during setup, documented here so future-us doesn't repeat them:

1. **Repo folder structure matters.** Uploading a zip's parent folder into GitHub (instead of its *contents*) creates a nested duplicate folder (`Taskmanagerabc/Taskmanagerabc/...`), which breaks `cd frontend` in the build command. Always upload the contents of the extracted folder directly to the repo root.

2. **Netlify Function dependencies must live in the *root* `package.json`**, not in a separate `netlify/functions/package.json`. Netlify's esbuild bundler looks for `node_modules` at the root when bundling a function — a nested `package.json` there just causes "Cannot find module" or "Could not resolve" errors at build/runtime.

3. **`netlify.toml` build settings can silently fail to apply** if the Netlify UI's own Build & deploy settings show "Not set". Always confirm Build command / Publish directory show real values (not "Not set") under Project configuration → Build & deploy before assuming `netlify.toml` took effect.

4. **Use "New environment variable," not "Import environment variables," for single key/value pairs.** The import box expects raw `.env` syntax (`KEY=value` per line) — pasting labeled text like `Key: MONGO_URI` / `Value: ...` will fail silently or create garbage variables literally named `Key`/`Value`.

5. **Env var changes need a fresh deploy** to reach already-bundled functions — use "Clear cache and deploy site" after adding/editing variables.

---

## API Reference (quick)

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Create account |
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Current user |
| GET | `/api/tasks` | ✅ | List tasks (filter/search/sort via query params) |
| POST | `/api/tasks` | ✅ | Create task |
| GET | `/api/tasks/stats` | ✅ | Task counts (total/completed/pending/overdue) |
| GET | `/api/tasks/:id` | ✅ | Get one task |
| PUT | `/api/tasks/:id` | ✅ | Update task |
| PATCH | `/api/tasks/:id/toggle` | ✅ | Toggle completed |
| DELETE | `/api/tasks/:id` | ✅ | Delete one task |
| DELETE | `/api/tasks/completed/all` | ✅ | Delete all completed tasks |

All protected routes require header: `Authorization: Bearer <token>`
