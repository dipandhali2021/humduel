# HumDuel — Tech Stack Decision

**Date:** 2026-04-04
**Author:** pdlc-orchestrator
**Status:** Accepted

---

## Decision Summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Language** | TypeScript | Full-stack type safety, shared types between client/server |
| **Frontend** | React 18 + Vite | Fast dev experience, huge ecosystem, Canvas API integration |
| **Styling** | Tailwind CSS | Utility-first, mobile-responsive, rapid prototyping |
| **Audio** | Web Audio API | Native browser API, no dependency, real-time processing |
| **Visualization** | Canvas API | Direct pixel control for waveform rendering, 60fps capable |
| **Backend** | Node.js + Express | Same language as frontend, minimal overhead, mature |
| **Database** | SQLite (better-sqlite3) | Zero-config, embedded, fast reads, good for MVP |
| **Auth** | JWT (jsonwebtoken + bcrypt) | Stateless, simple, works with Railway deployment |
| **Deployment** | Vercel (FE) + Railway (BE) | Free tiers, easy setup, auto-deploy from GitHub |
| **API Client** | Spotify Web API | Song metadata, album art, 30s preview URLs |

## Frontend Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| react | UI framework | ^18.3 |
| react-dom | DOM rendering | ^18.3 |
| react-router-dom | Client-side routing | ^6.20 |
| tailwindcss | Utility CSS | ^3.4 |
| nanoid | Short unique IDs | ^5.0 |
| zustand | Lightweight state management | ^4.5 |
| @vitejs/plugin-react | Vite React plugin | latest |

## Backend Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| express | HTTP server | ^4.18 |
| better-sqlite3 | SQLite driver (sync, fast) | ^11.0 |
| cors | Cross-origin resource sharing | ^2.8 |
| helmet | Security headers | ^7.1 |
| express-rate-limit | Rate limiting | ^7.1 |
| multer | File upload handling | ^1.4 |
| nanoid | Challenge ID generation | ^5.0 |
| jsonwebtoken | JWT auth (Sprint 3) | ^9.0 |
| bcrypt | Password hashing (Sprint 3) | ^5.1 |
| dotenv | Environment variables | ^16.3 |

## Dev Dependencies

| Package | Purpose |
|---------|---------|
| typescript | Type checking |
| vitest | Unit testing (Vite-native) |
| @testing-library/react | React component testing |
| playwright | E2E testing |
| eslint | Linting |
| prettier | Formatting |

## Agent Assignments

Based on tech stack, these agents are assigned for development:

| Agent | Specialization | Sprint(s) |
|-------|---------------|-----------|
| react-specialist | React components, hooks, Canvas | 1, 2, 3, 4 |
| frontend-developer | Web Audio API, share mechanics | 1, 2, 3 |
| backend-developer | Express API, SQLite, auth | 2, 3 |
| fullstack-developer | End-to-end features | 2, 3 |
| devops-engineer | CI/CD, deployment | 1, 4 |
| ui-designer | Layout, responsive design | 1 |
| performance-engineer | Core Web Vitals, optimization | 4 |

## Alternatives Considered

### Frontend Framework
- **Next.js** — Rejected. SSR adds complexity, not needed for SPA game. Vercel deployment is simpler with plain Vite.
- **Vue 3** — Viable but React has better Canvas/Audio ecosystem and library support.
- **Svelte** — Smaller ecosystem, fewer audio processing libraries.

### Database
- **PostgreSQL** — Overkill for MVP. Planned migration path if we exceed SQLite limits (10K concurrent writes/sec).
- **MongoDB** — Schema flexibility not needed; relational queries for leaderboard are simpler in SQL.
- **Supabase** — Nice but adds external dependency; SQLite keeps it self-contained.

### Audio Processing
- **Tone.js** — Originally in brief but removed. Web Audio API alone is sufficient for recording + playback. Tone.js adds 100KB for synthesizer features we don't need.
- **Pitchy** — Considered for pitch detection but not needed for MVP (waveform-only, no transcription).

### State Management
- **Redux** — Over-engineered for this app size.
- **Zustand** — Selected. Minimal API, no boilerplate, works well with React 18.
- **React Context** — Sufficient for auth/theme but awkward for audio state.

## Migration Path

When HumDuel outgrows SQLite (estimated at 50K+ DAU):
1. Switch from `better-sqlite3` to `pg` (node-postgres)
2. Move database to Railway PostgreSQL addon
3. SQL is already standard — minimal query changes needed
4. Audio blobs → S3-compatible object storage (Cloudflare R2)
