## Phase 1 deployment on Railway

This document describes how to deploy the Eterny 2.0 Phase 1 stack (Postgres, API, MCP, and mobile app) on Railway.

### 1. Postgres

- **Create a Postgres service** in Railway (or reuse the one already created).
- Copy the `PostgreSQL connection URL` and use it as the `DATABASE_URL` for both the API and MCP services.
- Ensure the database has the `pgvector` extension enabled. In a Railway SQL console:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. API service (`services/api`)

1. **Create a new Railway service** from your GitHub repo and point it at the `services/api` directory.
2. In Railway → Variables for this service, set:
   - `DATABASE_URL` – your Postgres connection string.
   - `JWT_SECRET` – strong random string.
   - `REFRESH_TOKEN_SECRET` – strong random string (different from `JWT_SECRET`).
   - `OPENAI_API_KEY` – your OpenAI API key.
3. In Railway → Settings:
   - Build command: `npm install && npm run build`
   - Start command: `npm run start`
   - Root directory: `services/api`
4. After the first build, run:
   - `npx prisma migrate deploy` (can be configured as a Railway deploy hook) to apply Prisma migrations before `npm run start`.

The API will expose:
- `GET /health`
- `POST /auth/*`
- `GET/POST /chat/*`
- `POST /uploads`
- `GET /profile`

### 3. MCP service (`services/mcp`)

1. **Create another Railway service** from the same GitHub repo, pointing at `services/mcp`.
2. In Railway → Variables for this service, set:
   - `DATABASE_URL` – same Postgres URL.
   - `OPENAI_API_KEY` – your OpenAI API key (if MCP also calls OpenAI).
   - `MCP_PORT` – optional, or let Railway assign `PORT` and map it in code later if needed.
3. In Railway → Settings:
   - Build command: `npm install && npm run build`
   - Start command: `npm run start`
   - Root directory: `services/mcp`

The MCP HTTP surface exposes:
- `GET /health`
- `POST /tools/ingest-upload`
- `POST /tools/build-context-pack`

### 4. Expo mobile app (`apps/mobile`)

For local testing against Railway:

1. Take the public URL of the API service from Railway (e.g. `https://eterny-api.up.railway.app`).
2. In your local shell before running Expo:

```bash
export EXPO_PUBLIC_API_BASE_URL="https://YOUR-API-URL.up.railway.app"
```

3. From the project root:

```bash
cd apps/mobile
npm install
npx expo start
```

For EAS builds or production, configure `EXPO_PUBLIC_API_BASE_URL` in your Expo/EAS environment so release builds talk directly to the Railway API.

### 5. End-to-end validation checklist

- **API health**: `GET https://YOUR-API-URL.up.railway.app/health` returns `{ ok: true }`.
- **Auth**:
  - Sign up with phone + password on the mobile app.
  - Login and confirm you land on the `Conversations` screen.
- **Chat**:
  - Create a new conversation; confirm it appears in the list.
  - Send a message; an assistant reply should appear via `/chat/threads/:id/assistant`.
- **Profile**:
  - Visit the `Profile` screen; confirm it loads (data may be empty initially).

