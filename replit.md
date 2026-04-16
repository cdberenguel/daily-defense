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
- **AI**: Anthropic Claude (via Replit AI Integrations)

## Artifacts

### Daily Defense (mobile)
- **Kind**: Expo React Native mobile app
- **Preview path**: `/`
- **Description**: Catholic apologetics app with common objections and AI-generated answers via Claude

### API Server
- **Kind**: Express API server
- **Preview path**: `/api`
- **Routes**: `/api/anthropic/conversations` (CRUD + SSE streaming)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Key Features

- **Objections Library**: 20+ common Catholic apologetics objections across 6 categories
- **AI Responses**: Claude Sonnet generates charitable, well-sourced apologetics responses
- **Streaming**: Responses stream in real-time via Server-Sent Events
- **Conversation History**: All conversations stored in PostgreSQL, viewable in History tab
- **Follow-up Chat**: Continue exploring topics with follow-up questions

## Database Tables

- `conversations` — stores conversation title and timestamps
- `messages` — stores user/assistant messages linked to conversations

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
