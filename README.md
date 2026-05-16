# CheckIn Terminal

A biometric-style employee check-in/check-out system. Employees log in, face the camera, and confirm — just like a fingerprint machine.

---

## Features

- **Terminal UI** — check in or check out with camera capture
- **Employee registration** — self-service, name + password only
- **Admin dashboard** — view last 48h records, photo thumbnails, download Excel sheet
- **Auto-cleanup** — records and images deleted every 48h via cron job
- **Deployable on Vercel free tier** or self-hosted via Docker

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Hono (TypeScript) |
| Database | Neon Postgres (serverless) |
| Image storage | Vercel Blob |
| Deployment | Vercel (serverless) or Docker |

---

## Local Development

### Prerequisites
- Node.js 20+
- A Neon Postgres database (free at https://neon.tech)
- A Vercel Blob store (or skip — images just won't upload locally)

### Setup

```bash
# 1. Clone and install
git clone <your-repo>
cd checkin-app
npm run install:all

# 2. Set up environment
cp .env.example .env
# Edit .env with your values

# 3. Run backend (port 3001)
npm run dev:backend

# 4. Run frontend (port 5173) — in a second terminal
npm run dev:frontend
```

Frontend proxies `/api/*` to the backend automatically via Vite config.

---

## Deploy on Vercel (Free Tier) — Recommended

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/checkin-app.git
git push -u origin main
```

### Step 2 — Create Vercel Project

1. Go to https://vercel.com → **Add New Project**
2. Import your GitHub repo
3. Vercel auto-detects the config from `vercel.json`
4. **Do NOT deploy yet** — set up storage first

### Step 3 — Add Neon Postgres

1. In your Vercel project → **Storage** tab → **Create Database**
2. Choose **Neon Postgres** → follow setup
3. Vercel automatically adds `DATABASE_URL` to your environment

> Alternative: Create a free DB at https://neon.tech and paste the connection string manually.

### Step 4 — Add Vercel Blob

1. In your Vercel project → **Storage** tab → **Create Store**
2. Choose **Blob** → follow setup
3. Vercel automatically adds `BLOB_READ_WRITE_TOKEN` to your environment

### Step 5 — Set Environment Variables

In Vercel project → **Settings** → **Environment Variables**, add:

```
JWT_SECRET          = <run: openssl rand -hex 32>
ADMIN_USERNAME      = admin
ADMIN_PASSWORD      = <your strong password>
CRON_SECRET         = <run: openssl rand -hex 16>
```

### Step 6 — Deploy

```bash
# Trigger deploy
git push origin main
```

Or click **Deploy** in the Vercel dashboard.

### Step 7 — Verify

Visit `https://your-app.vercel.app` — the terminal should load.
Check `https://your-app.vercel.app/api/health` — should return `{"status":"ok"}`.

---

## Deploy with Docker (Self-Hosted)

Use this if you want to host on your own server (VPS, AWS EC2, etc.).

### Prerequisites
- Docker + Docker Compose installed
- A Neon Postgres DB (or uncomment the local `db` service in `docker-compose.yml`)
- A Vercel Blob store (or swap for S3/MinIO — see note below)

### Setup

```bash
# 1. Clone repo on your server
git clone <your-repo>
cd checkin-app

# 2. Create .env from template
cp .env.example .env
nano .env   # fill in all values

# 3. Build and start
docker compose up -d --build

# 4. Check logs
docker compose logs -f
```

App runs on port `3001`. Put Nginx/Caddy in front for HTTPS.

### Nginx reverse proxy (example)

```nginx
server {
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }
}
```

Then run: `certbot --nginx -d your-domain.com`

### Cron job (Docker — manual setup)

Since Vercel crons don't exist in Docker mode, add a cron job on your server:

```bash
# Edit crontab
crontab -e

# Add this line — runs cleanup at 2am daily
0 2 * * * curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3001/api/cron/cleanup
```

### Update the app (Docker)

```bash
git pull origin main
docker compose up -d --build
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon Postgres connection string |
| `JWT_SECRET` | ✅ | Random hex string for JWT signing |
| `ADMIN_USERNAME` | ✅ | Admin login username |
| `ADMIN_PASSWORD` | ✅ | Admin login password |
| `CRON_SECRET` | ✅ | Secret to protect the cleanup endpoint |
| `BLOB_READ_WRITE_TOKEN` | ✅ | Vercel Blob token (auto-set on Vercel) |
| `FRONTEND_URL` | ❌ | CORS origin (optional, defaults to `*`) |

---

## How It Works

### Employee Flow
1. Open the app → Choose **Check In** or **Check Out**
2. Enter name + password
3. Camera activates → look at the lens
4. Click confirm → photo is captured and uploaded
5. Record saved → success screen → terminal resets

### Admin Flow
1. Go to `/admin`
2. Log in with admin credentials (set via env vars)
3. View all records from the last 48 hours
4. Click photo thumbnails to enlarge
5. Click **Download Sheet** to get `.xlsx`
6. Records auto-delete at 2am daily

### Cleanup
- Vercel cron hits `/api/cron/cleanup` at 2am every day
- Deletes all records + associated Blob images older than 48h
- Admin should download the sheet before this runs

---

## Project Structure

```
checkin-app/
├── api/
│   └── index.ts          ← Vercel serverless entry
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Terminal.tsx
│       │   ├── Register.tsx
│       │   └── Admin.tsx
│       ├── components/
│       │   └── Camera.tsx
│       └── lib/
│           └── api.ts
├── backend/
│   └── src/
│       ├── routes/
│       │   ├── auth.ts
│       │   ├── checkin.ts
│       │   ├── admin.ts
│       │   └── cron.ts
│       ├── db/
│       │   └── client.ts
│       ├── middleware/
│       │   └── auth.ts
│       ├── index.ts       ← Hono app
│       └── server.ts      ← Docker server (serves static + API)
├── vercel.json
├── Dockerfile
├── docker-compose.yml
└── .env.example
```
