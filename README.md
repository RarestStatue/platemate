# Platemate

A recipe and meal planning web app.

## Prerequisites

- **Node.js** 18+ : [nodejs.org](https://nodejs.org)
- **npm** 9+ : included with Node.js
- **Docker** : [docker.com](https://www.docker.com)
- **Git**

Docker Desktop is required on macOS and Windows. On Linux, install Docker Engine and the `docker compose` plugin.

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/RarestStatue/platemate.git
cd platemate
```

### 2. Create the root environment file

Copy the example below into a file named `.env` in the project root:

```env
POSTGRES_USER=platemate
POSTGRES_PASSWORD=platemate_dev_password
POSTGRES_DB=platemate
REDIS_PASSWORD=redis_dev_password
```

### 3. Start the database and cache

```bash
docker compose up -d
```

This starts PostgreSQL on port `5433` and Redis on port `6379`.

### 4. Install frontend dependencies

```bash
cd frontend
npm install
```

### 5. Create the frontend environment file

Create `frontend/.env.local` with the following content, replacing passwords if you changed them in step 2:

```env
DATABASE_URL="postgresql://platemate:platemate_dev_password@localhost:5433/platemate"
AUTH_SECRET="replace-with-output-of-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
REDIS_URL="redis://:redis_dev_password@localhost:6379"
```

To generate `AUTH_SECRET`:

**Linux / macOS:**
```bash
openssl rand -base64 32
```

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 6. Apply the database schema and seed data

Run these from inside the `frontend` directory:

```bash
npx prisma db push
npx prisma db seed
```

### 7. Start the development server

```bash
npm run dev
```

Faster method
```bash
npm run build
npm run start
```


Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Stopping

```bash
docker compose down
```

To also delete stored data:

```bash
docker compose down -v
```

---

## Resetting the database

Run from the `frontend` directory:

```bash
npx prisma db push --force-reset
npx prisma db seed
```

---

## Frontend scripts

Run from the `frontend` directory:

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `next dev` | Start dev server |
| `npm run build` | `next build` | Production build |
| `npm run start` | `next start` | Run production build |
| `npm run lint` | `eslint .` | Lint code |
| `npm run typecheck` | `tsc --noEmit` | Type-check without emitting |
| `npm test` | `vitest run` | Run tests |
| `npm run db:up` | `docker compose -f ../docker-compose.yml up -d --wait && npx prisma migrate deploy` | Start DB via Docker + apply migrations |
