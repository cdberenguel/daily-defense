# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: Anthropic Claude via Replit AI Integrations (claude-sonnet-4-6 standard, claude-opus-4-6 deepthink)

## Artifacts

### Daily Defense (mobile)
- **Kind**: Expo React Native mobile app
- **Preview path**: `/`
- **Description**: Full-featured Catholic apologetics app with 5-tab navigation

#### Features
- **Topics Tab**: 9 objections across 6 categories with difficulty ratings, clickable cards that navigate to full detail pages
- **Topic Detail Pages**: Tabbed view with Summary, Scripture passages, Main Arguments, Church Fathers quotes, and Practical Tips
- **Study Tab**: Hub for Bible Study (with AI explainer via bible-api.com), Catholic Library (Vatican docs/CCC/Encyclicals), Topic Generator, Notes
- **Practice Tab**: Apologetics AI chat, Faith Companion, Tactics Workshop (5 strategies), Practice Opponent (Muslim/Atheist/Protestant × 3 difficulties with AI session review)
- **Prayer Tab**: AI prayer generator (streaming) + traditional Catholic prayers
- **Profile Tab**: Avatar (expo-image-picker), level/XP system, 15 achievements with progress tracking, stats, notes access
- **DeepThink Mode**: Toggle in Apologetics/Faith Companion that switches from claude-sonnet-4-6 → claude-opus-4-6
- **Offline storage**: AsyncStorage for notes, saved topics, achievements, profile, stats
- **Topic Generator**: AI generates full topic pages (JSON) for any arbitrary objection with save-to-study feature

#### Key Files (mobile)
- `app/_layout.tsx` — root layout with AppProvider wrapping
- `app/(tabs)/_layout.tsx` — 5-tab layout (Topics/Study/Practice/Prayer/Profile)
- `app/(tabs)/index.tsx` — Topics list with search + category filter
- `app/(tabs)/study.tsx` — Study hub
- `app/(tabs)/practice.tsx` — Practice hub with stats
- `app/(tabs)/prayer.tsx` — Prayer generation + traditional prayers
- `app/(tabs)/profile.tsx` — Profile with avatar, XP, achievements
- `app/topic/[id].tsx` — Full topic detail (5 tabs)
- `app/apologetics.tsx` — AI chat with deepthink toggle
- `app/faith-companion.tsx` — Spiritual companion chat
- `app/tactics.tsx` — 5 apologetics strategies with AI coaching
- `app/opponent.tsx` — Practice debates with AI review at end
- `app/bible.tsx` — Bible lookup (bible-api.com) + AI explanation
- `app/library.tsx` — Catholic documents with external links
- `app/generator.tsx` — AI topic generator with tabbed output + save
- `app/notes.tsx` — CRUD notes with categories
- `app/achievement/[id].tsx` — Achievement detail with progress

#### Context / Utils
- `context/AppContext.tsx` — Global state: notes, savedTopics, achievements, profile, stats + AsyncStorage persistence
- `utils/topicContent.ts` — Rich apologetics data for 9 built-in topics (Scripture, Arguments, Fathers, Tips)
- `utils/streaming.ts` — SSE streaming utility + getApiBaseUrl()

### API Server
- **Kind**: Express API server
- **Preview path**: `/api`
- **Routes**:
  - `GET/POST /api/anthropic/conversations` — list/create conversations
  - `GET/DELETE /api/anthropic/conversations/:id` — get/delete conversation
  - `GET /api/anthropic/conversations/:id/messages` — list messages
  - `POST /api/anthropic/conversations/:id/messages` — send message (SSE stream, supports `model` and `systemPromptOverride`)
  - `POST /api/ai/pray` — generate personalized Catholic prayer (SSE)
  - `POST /api/ai/generate-topic` — generate full apologetics topic page (SSE, JSON output)
  - `POST /api/ai/review-session` — AI review of a practice debate session (SSE)

## Database Schema

- `conversations` — id, title, mode (apologetics|faith-companion|tactics|opponent|bible), createdAt
- `messages` — id, conversationId, role (user|assistant), content, createdAt

## Important Notes

### Codegen Pitfall
After running `pnpm --filter @workspace/api-spec run codegen`, the file `lib/api-zod/src/index.ts` gets overwritten to include `./generated/api.schemas` which doesn't exist. Always immediately overwrite it with:
```
export * from "./generated/api";
```

### DB Migrations
Run `pnpm --filter @workspace/db run push` after any schema changes.

### AI Models
- Standard mode: `claude-sonnet-4-6`
- DeepThink mode: `claude-opus-4-6` (sent as `model: "deepthink"` from frontend)

### Bible API
Using free `bible-api.com` — no auth required, supports KJV. Format: `https://bible-api.com/john+6:53?translation=kjv`
