# Eterny 2.0 — Phase 1 Tasks (Ultra-small, testable)

Each task is **one concern**, with a clear **start/end** and a quick **test**.

---

## 0. Repo & Tooling

### T0. Create monorepo folders
- Start: empty repo
- End: folders `apps/mobile`, `services/api`, `services/mcp`, `packages/shared`
- Test: tree matches architecture

### T1. Initialize API service (TypeScript + Express)
- Start: `services/api` empty
- End: TS build + Express server + `GET /health`
- Test: curl `/health` returns `{ ok: true }`

### T2. Initialize MCP service skeleton
- Start: `services/mcp` empty
- End: TS server + `GET /health`
- Test: curl MCP `/health` returns `{ ok: true }`

### T3. Initialize Expo app
- Start: `apps/mobile` empty
- End: Expo app runs on web and shows “Eterny 2.0”
- Test: `expo start --web` renders

---

## 1. Database & Prisma

### T4. Add Prisma to API service
- Start: API running
- End: Prisma installed, `schema.prisma` created, `prisma generate` works
- Test: `npx prisma validate` passes

### T5. Enable pgvector extension (migration)
- Start: Prisma ready
- End: migration enables `vector` extension
- Test: migration applies on local Postgres

### T6. Create base tables: User, RefreshToken
- Start: empty schema
- End: Prisma models + migration
- Test: create User via Prisma script

### T7. Add OTP table: OtpCode
- Start: User exists
- End: Prisma model + migration
- Test: insert OTP row

### T8. Add chat tables: ChatThread, ChatMessage
- Start: auth tables exist
- End: models + migration
- Test: create thread + message via script

### T9. Add upload tables: Upload, UploadChunk
- Start: schema has chat
- End: models + migration
- Test: insert Upload + chunks via script

### T10. Add MemoryChunk with vector column
- Start: pgvector enabled
- End: model supports vector embeddings
- Test: insert dummy vector row

### T11. Add UserProfileField model
- Start: schema ready
- End: profile model + migration
- Test: insert field and query it

### T12. Add MCP logs: McpRun, AiUsageLog
- Start: schema ready
- End: models + migration
- Test: insert a log row

---

## 2. Auth API (Phone + Password + OTP stub + social stubs)

### T13. Implement password hashing helpers
- Start: no helpers
- End: `hashPassword` + `verifyPassword`
- Test: unit test passes

### T14. Implement JWT helpers
- Start: none
- End: `signAccessToken`, `signRefreshToken`, `verifyAccessToken`
- Test: tokens verify successfully

### T15. POST /auth/signup (phone + password)
- Start: no routes
- End: creates user and returns tokens
- Test: signup returns 201 + tokens

### T16. POST /auth/login (phone + password)
- Start: signup works
- End: returns tokens for existing user
- Test: wrong password returns 401

### T17. POST /auth/refresh
- Start: refresh token stored hashed
- End: returns new access token
- Test: revoked token fails

### T18. POST /auth/logout
- Start: refresh exists
- End: revokes refresh token
- Test: refresh after logout fails

### T19. POST /auth/otp/request (stub)
- Start: no OTP
- End: creates OtpCode; returns code only in dev
- Test: response includes `sent: true`

### T20. POST /auth/otp/verify (stub)
- Start: otp/request exists
- End: validates OTP and returns tokens
- Test: valid OTP works, invalid fails

### T21. Social auth stubs
- Start: none
- End: `/auth/google`, `/auth/apple`, `/auth/microsoft` return 501
- Test: endpoints return 501

### T22. Auth middleware (JWT)
- Start: tokens issued
- End: `authenticate` middleware attaches userId to request
- Test: protected route blocks without token

---

## 3. Expo Auth UI

### T23. Add API client module
- Start: Expo running
- End: `apiClient` supports baseURL + auth header
- Test: app calls `/health` and shows ok

### T24. Create AuthStore/AuthContext
- Start: none
- End: holds tokens + userId + hydration on app boot
- Test: refresh page keeps logged in

### T25. Build Login (phone+password) screen
- Start: auth UI empty
- End: login calls API and stores tokens
- Test: navigates to chat after login

### T26. Build Signup screen
- Start: login exists
- End: signup creates account then logs in
- Test: new user can enter app

### T27. Build OTP stub screens
- Start: auth screens exist
- End: request+verify OTP screens wired to stub endpoints
- Test: OTP login succeeds in dev

### T28. Add social login stub buttons
- Start: login UI exists
- End: buttons call stub endpoints and show “coming soon”
- Test: no crash; message shown

---

## 4. Chat API (threads + messages)

### T29. POST /chat/threads
- Start: no chat routes
- End: creates a thread for user
- Test: returns threadId

### T30. GET /chat/threads
- Start: threads exist
- End: lists threads ordered by updatedAt
- Test: thread appears in list

### T31. POST /chat/threads/:id/messages (store user message)
- Start: messages not supported
- End: stores user message row
- Test: DB contains the message

### T32. GET /chat/threads/:id/messages
- Start: messages exist
- End: returns ordered messages
- Test: returns both user+assistant messages

---

## 5. OpenAI Chat (non-stream then stream)

### T33. Add OpenAI client wrapper
- Start: no AI client
- End: wrapper with `OPENAI_API_KEY`
- Test: simple call succeeds

### T34. Implement non-stream assistant reply for thread
- Start: messages stored
- End: API calls OpenAI with last N messages; stores assistant reply
- Test: assistant message persists

### T35. Implement streaming endpoint
- Start: non-stream works
- End: server streams tokens; stores final assistant message
- Test: curl/Expo receives stream

### T36. Persist token usage logs (AiUsageLog) for chat
- Start: chat works
- End: store tokens in/out and model
- Test: DB has usage rows

---

## 6. Expo Chat UI

### T37. Thread list screen
- Start: logged in
- End: list threads + create new thread
- Test: open created thread

### T38. Chat thread screen (message list + input)
- Start: thread list exists
- End: display messages; send message
- Test: message appears immediately

### T39. Streaming rendering in chat UI
- Start: assistant replies exist
- End: show streaming assistant text in real time
- Test: smooth stream then final persisted

---

## 7. Uploads (store file + extract text + chunks)

### T40. POST /uploads (file upload)
- Start: no upload route
- End: stores file + creates Upload row
- Test: returns uploadId

### T41. Implement text extraction for PDFs
- Start: upload stored
- End: extracted text produced
- Test: non-empty text extracted from sample

### T42. Implement chunking and store UploadChunk rows
- Start: extracted text exists
- End: chunk rows created with stable chunkIndex
- Test: DB has chunk rows

---

## 8. Embeddings + pgvector memory

### T43. Implement embeddings wrapper
- Start: OpenAI client exists
- End: `embedTexts(text[])` returns vectors
- Test: vectors returned

### T44. Store upload chunks as MemoryChunks with embeddings
- Start: UploadChunk exists
- End: MemoryChunk created per chunk with vector
- Test: memory rows exist

### T45. Implement similarity search for MemoryChunks
- Start: vectors exist
- End: `searchMemory(userId, query, topK)` returns chunks
- Test: query returns relevant chunks

---

## 9. MCP Profile extraction + upserts

### T46. Define ProfilePatch schema (packages/shared)
- Start: none
- End: zod schema for allowed buckets/fields
- Test: schema validates sample patches

### T47. MCP tool: extract_profile_patch_from_text
- Start: MCP skeleton
- End: tool returns validated ProfilePatch JSON from text
- Test: sample text produces correct bucket fields

### T48. MCP tool: upsert_profile_fields
- Start: profile table exists
- End: upsert logic respects bucket+key+effectiveAt and sources
- Test: repeated upserts don’t create unwanted duplicates

### T49. MCP tool: ingest_upload (multi-date biomarker aware)
- Start: upload chunks exist
- End: reads chunks, extracts biomarker results (grouped by dates if present), upserts profile fields
- Test: multi-date report creates multiple effectiveAt entries

### T50. Write McpRun logs for each ingest
- Start: MCP tools exist
- End: McpRun start/end status logged
- Test: DB shows run rows

---

## 10. Context assembly per chat turn

### T51. Build profile snapshot query
- Start: profile fields exist
- End: function returns latest value per bucket+key
- Test: snapshot returns expected keys

### T52. Build ContextPack builder
- Start: memory search exists
- End: builder returns:
  - last N messages
  - profile snapshot
  - topK memory chunks
- Test: logs show expected pack

### T53. Use ContextPack in OpenAI chat prompt
- Start: streaming chat works
- End: assistant uses retrieved memories + profile in response
- Test: assistant references uploaded labs without re-upload

---

## 11. Profile UI (read-only Phase 1)

### T54. GET /profile endpoint
- Start: none
- End: returns grouped snapshot (buckets)
- Test: response shape stable

### T55. Expo Profile screen (buckets list)
- Start: Expo app has chat
- End: shows buckets and fields
- Test: biomarkers visible after upload ingest

---

## 12. Railway deploy

### T56. Deploy Postgres + run prisma migrate deploy
- Start: local working
- End: Railway Postgres created and migrations applied
- Test: API connects in prod

### T57. Deploy API service
- Start: Railway config set
- End: `/health` works; auth works
- Test: login in prod

### T58. Deploy MCP service
- Start: MCP config set
- End: MCP `/health` works; ingest works
- Test: upload → ingest end-to-end in prod

---

## Definition of Done (Phase 1)
- Phone+password login works (OTP stub works in dev).
- Chat threads persist and resume per user.
- Upload a lab PDF → text extracted → chunks embedded into pgvector.
- MCP extracts biomarker history (multi-date) and upserts profile fields.
- Each chat turn uses ContextPack (messages + memory + profile).
