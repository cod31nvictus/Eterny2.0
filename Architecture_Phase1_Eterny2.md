# Eterny 2.0 — Phase 1 Architecture

Phase 1 builds the **foundation**: **Phone auth**, **ChatGPT-like chat threads**, **Uploads**, **Vector memory**, and an **MCP tool server** that extracts a structured **User Profile** from chats + uploads.

## Goals of Phase 1
- Phone login with **password** OR **OTP (stub)**.
- Social login buttons (Google/Microsoft/Apple) **stubbed**.
- Chat interface powered by **OpenAI APIs** with:
  - per-user threads
  - message persistence
  - context continuation (like ChatGPT)
- Upload lab reports and other docs:
  - store file
  - extract text
  - chunk + embed into pgvector
  - extract biomarkers and other profile data into Postgres
- MCP builds **context packs** per turn:
  - last N messages
  - relevant memories (vector retrieval)
  - profile snapshot
  - relevant upload excerpts

---

## Tech stack (Phase 1)
**Client**
- Expo (React Native) with Expo Web target (single codebase)

**Backend**
- Node.js + TypeScript + Express
- Railway deployment

**Data**
- Postgres (Railway managed)
- Prisma ORM
- pgvector extension for embeddings

**AI**
- OpenAI APIs
  - Chat responses (streaming)
  - Embeddings

**Storage**
- Phase 1: store uploads in one of:
  1) Object storage (recommended even in Phase 1; S3-compatible), OR
  2) Railway Volume (temporary)
- Postgres stores metadata + extracted text + chunk rows (not binary)

---

## System overview

```text
Expo App (Android/iOS/Web)
  |
  | REST/JSON + JWT
  v
Express API (Railway)
  |        \
  |         \----> OpenAI (Chat + Embeddings)
  v
Postgres (Railway)
  - Prisma models
  - pgvector embeddings
  - chat threads/messages
  - uploads + extracted chunks
  - user profile (structured)
  - MCP logs/usage
  |
  v
MCP Tool Server (Railway; can be same service initially)
  - profile extraction tools
  - memory retrieval tools
  - context pack builder
```

---

## Monorepo layout

```text
eterny2/
├─ apps/
│  └─ mobile/                         # Expo app (Android + Web in Phase 1)
│     ├─ app.config.ts
│     ├─ assets/
│     └─ src/
│        ├─ navigation/
│        ├─ screens/
│        │  ├─ auth/
│        │  ├─ chat/
│        │  └─ profile/
│        ├─ components/
│        ├─ services/                 # API client
│        ├─ store/                    # Zustand or Redux
│        ├─ utils/
│        └─ types/
│
├─ services/
│  ├─ api/                            # Express API service (Railway)
│  │  ├─ prisma/
│  │  │  ├─ schema.prisma
│  │  │  └─ migrations/
│  │  ├─ src/
│  │  │  ├─ index.ts
│  │  │  ├─ config/
│  │  │  ├─ middleware/
│  │  │  ├─ routes/
│  │  │  ├─ controllers/
│  │  │  ├─ services/
│  │  │  │  ├─ auth/
│  │  │  │  ├─ chat/
│  │  │  │  ├─ uploads/
│  │  │  │  ├─ profile/
│  │  │  │  └─ vector/
│  │  │  ├─ openai/
│  │  │  ├─ jobs/
│  │  │  └─ types/
│  │  └─ package.json
│  │
│  └─ mcp/                            # MCP tool server (Railway)
│     ├─ src/
│     │  ├─ index.ts                  # MCP HTTP server
│     │  ├─ tools/
│     │  ├─ openai/
│     │  ├─ auth/
│     │  └─ types/
│     └─ package.json
│
└─ packages/
   └─ shared/                         # shared types + zod schemas
      ├─ src/
      │  ├─ schemas/
      │  ├─ types/
      │  └─ constants/
      └─ package.json
```

---

## Data model (Phase 1 — minimal but scalable)

### Auth
- **User**
  - `id`
  - `phone` (unique)
  - `passwordHash` (nullable if OTP-only later)
  - `createdAt`, `updatedAt`
- **OtpCode** (stub)
  - `id`, `phone`, `code`, `expiresAt`, `consumedAt`
- **RefreshToken**
  - `id`, `userId`, `tokenHash`, `expiresAt`, `revokedAt`

Social login stubs (Phase 1):
- store placeholder fields on User for later linking:
  - `googleId?`, `appleId?`, `microsoftId?`

### Chat
- **ChatThread**
  - `id`, `userId`, `title`, `createdAt`, `updatedAt`
- **ChatMessage**
  - `id`, `threadId`, `userId`
  - `role` ('user' | 'assistant' | 'system')
  - `content` (text)
  - `createdAt`
  - `metadata` (json: uploadIds, model, token counts)

### Uploads + extraction
- **Upload**
  - `id`, `userId`, `filename`, `mimeType`, `sizeBytes`
  - `storageUrl` (or path)
  - `status` ('uploaded'|'processing'|'processed'|'failed')
  - `createdAt`
- **UploadChunk**
  - `id`, `uploadId`, `userId`, `chunkIndex`, `text`
  - `createdAt`

### Vector memory (pgvector)
- **MemoryChunk**
  - `id`, `userId`
  - `sourceType` ('chat'|'upload'|'profile')
  - `sourceId` (threadId/messageId/uploadId/profileFieldId)
  - `text`
  - `embedding` (vector)
  - `createdAt`

### User Profile (Phase 1 buckets)
Store as flexible records, versionable later:
- **UserProfileField**
  - `id`, `userId`
  - `bucket` enum:
    - BasicInfo
    - MedicalProfile
    - Constraints
    - Biomarkers
    - BodyComposition
    - PersonalCare
    - Lifestyle
  - `key` (string; e.g., 'weight', 'hbA1c', 'allergy.gluten')
  - `value` (json)
  - `effectiveAt` (timestamp for “as of”)
  - `sourceType` ('user'|'upload'|'chat'|'ai')
  - `sourceId` (uploadId/messageId)
  - `createdAt`, `updatedAt`
  - indexes on `(userId, bucket, key, effectiveAt)`

### Biomarkers (time-series)
Phase 1 approach:
- Store biomarker rows as `UserProfileField` where:
  - `bucket = Biomarkers`
  - `key = biomarker canonical name` (e.g., `hba1c`, `ldl`, `tsh`)
  - `value = { value, unit, refLow, refHigh, flag, panel, measuredAt }`
This supports multi-date extraction without extra tables.

### MCP logs
- **McpRun**
  - `id`, `userId`, `threadId?`, `uploadId?`
  - `runType` ('chat_turn'|'upload_ingest')
  - `status`, `startedAt`, `endedAt`
  - `error` (text?)
- **AiUsageLog**
  - `id`, `userId`, `provider` ('openai')
  - `model`, `tokensIn`, `tokensOut`, `costUsd?`
  - `sourceType`, `sourceId`
  - `createdAt`

---

## Auth design (Phase 1)
- **Primary**: phone + password
- **Secondary**: phone + OTP (stub)
  - In dev: backend returns OTP in response for testing
  - In prod: placeholder integration point for SMS vendor
- **Social**: stub UI + stub endpoints returning 501

JWT strategy (Phase 1):
- Access token (short-lived) + refresh token (stored server-side as hashed)

---

## Chat + context design

### Message persistence
- Every user and assistant message is stored in `ChatMessage`.

### Context pack builder (MCP tool)
For each chat turn:
1. Fetch last **N** messages from thread.
2. Fetch profile snapshot (latest `UserProfileField` per key/bucket).
3. Retrieve top **K** relevant `MemoryChunk` via pgvector similarity search using the new user message embedding.
4. Compose a **ContextPack**:
   - `recentMessages`
   - `profileSummary`
   - `retrievedMemories`
   - `relevantUploadExcerpts`

### Streaming
- API streams assistant reply to client while also persisting the final message.

---

## Upload ingestion flow (PDF lab reports etc.)
1. Upload stored (file storage) + `Upload` row created.
2. Extract text (server parser).
3. Chunk text and store `UploadChunk` rows.
4. Embed chunks into `MemoryChunk` (sourceType='upload') with embeddings.
5. MCP extraction:
   - call OpenAI with a strict JSON schema
   - extract biomarker rows possibly across **multiple dates** if present
   - upsert into `UserProfileField` (bucket=Biomarkers)
6. Mark Upload status processed.

---

## MCP tool server design (Phase 1)

### MCP responsibilities
- Normalize and extract profile info from:
  - chat turns
  - uploads
- Upsert profile fields
- Manage memory embeddings + retrieval
- Provide tools used by API when building responses

### Suggested tools (Phase 1)
- `build_context_pack(userId, threadId, newMessageText)`
- `ingest_upload(userId, uploadId)`
- `extract_profile_patch_from_text(userId, text, sourceMeta)`
- `upsert_profile_fields(userId, patch)`
- `retrieve_memory(userId, queryText, topK)`

### Deployment shape
- Phase 1: MCP can run as a **separate service** (recommended) OR mounted under the API.
- Keep code isolated under `services/mcp/` regardless.

---

## Environment variables (Railway)
API:
- `DATABASE_URL`
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL_CHAT`
- `OPENAI_MODEL_EMBEDDING`
- `UPLOAD_STORAGE_DRIVER` (s3|volume)
- `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` (if s3)
- `CORS_ORIGIN`

MCP:
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `JWT_SECRET` (if MCP validates tokens directly)

---

## Non-goals for Phase 1
- Full schedule planner, calendar templates, todos, analytics dashboards
- Real SMS delivery for OTP
- Real social login OAuth flows
- Advanced PDF OCR (use basic extraction; upgrade later)
