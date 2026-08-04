# BookWise

A booking platform with forms and AI chat.

## Structure

```
bookwise/
├── backend/    # Express API (Node.js, PostgreSQL)
└── frontend/   # Next.js app (App Router, Tailwind CSS)
```

## Prerequisites

- Node.js 20+
- PostgreSQL database (local or hosted, e.g. Supabase)

## Setup

1. Clone the repo and go to the project root:

```bash
cd bookwise
```

2. Install dependencies (root + workspaces):

```bash
npm install
```

3. Create environment files from the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

4. Fill in the values below in `backend/.env` and `frontend/.env.local`.

5. Start both apps:

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `4000` | Port the Express server listens on |
| `DATABASE_URL` | Yes | `postgresql://user:pass@host:5432/postgres` | PostgreSQL connection string |
| `JWT_SECRET` | Yes | `your-long-random-secret-string` | Secret used to sign JWT tokens |
| `MISTRAL_API_KEY` | Later | `your-mistral-api-key` | API key for Mistral AI chat (not needed for initial setup) |
| `FRONTEND_URL` | Yes | `http://localhost:3000` | Allowed CORS origin for the frontend |

Example `backend/.env`:

```env
PORT=4000
DATABASE_URL=postgresql://postgres:password@db.example.com:5432/postgres
JWT_SECRET=BookWise keeps your bookings safe with a strong secret key for every session.
MISTRAL_API_KEY=
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:4000/api` | Base URL for backend API requests |

Example `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

> Restart the dev server after changing env files.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend and frontend together |
| `npm run dev:backend` | Start backend only (port 4000) |
| `npm run dev:frontend` | Start frontend only (port 3000) |
| `npm run build` | Build backend for production |
| `npm run build:frontend` | Build frontend for production |
| `npm start` | Run backend production server |

## Deploy backend on Render

The repo includes a [`render.yaml`](./render.yaml) blueprint for **bookwise-api** (backend only).

### Option A — Blueprint (recommended)

1. In Render: **New → Blueprint** → connect this repo
2. Set secret env vars when prompted: `DATABASE_URL`, `JWT_SECRET`, `MISTRAL_API_KEY`, `FRONTEND_URL`
3. Deploy

### Option B — Manual web service

| Setting | Value |
|---------|-------|
| Root Directory | *(leave empty — repo root)* |
| Build Command | `npm install && npm run build --workspace=backend` |
| Start Command | `npm run start --workspace=backend` |

**Required env vars:**

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | `postgresql://...` (Supabase connection string) |
| `JWT_SECRET` | long random string |
| `FRONTEND_URL` | `http://localhost:3000` (or your frontend URL for CORS) |
| `MISTRAL_API_KEY` | your Mistral key (for chat) |

Optional: `JWT_EXPIRES_IN`, `DEFAULT_BUSINESS_ID`, `MISTRAL_MODEL`, `PORT` (Render sets `PORT` automatically).

> Do **not** use `npm` alone as the build command.

After deploy, test: `curl https://your-service.onrender.com/api/health`

Run the frontend locally and point `NEXT_PUBLIC_API_URL` at your Render API URL.

## Verify setup

- Open http://localhost:3000 — the home page should show **Backend status: connected**
- Or hit the health endpoint directly:

```bash
curl http://localhost:4000/api/health
# {"status":"ok"}
```
