# HumDuel — Requirements Document

**Date:** 2026-04-04
**Author:** business-analyst

---

## Functional Requirements

### Sprint 1: Core Audio Engine

| ID | Requirement | Priority | Acceptance Criteria |
|----|------------|----------|-------------------|
| FR-001 | Record audio from user's microphone via Web Audio API | P0 | Audio stream captured at 44.1kHz, stored as Float32Array |
| FR-002 | Display real-time waveform during recording | P0 | Canvas renders at 60fps, amplitude bars update in real-time |
| FR-003 | Set recording duration limit (max 15 seconds) | P0 | Recording auto-stops at 15s, timer displayed |
| FR-004 | Generate static waveform visualization from recorded audio | P0 | Canvas renders colored waveform card from audio data |
| FR-005 | Play back recorded audio with start/stop controls | P1 | Playback with play/pause button, progress indicator |
| FR-006 | Mobile-responsive layout for all screen sizes | P1 | Renders correctly on 320px-1440px viewport widths |
| FR-007 | Landing page with game description and CTA | P1 | Hero section, how-it-works, start recording button |
| FR-008 | Request microphone permission with fallback | P0 | Progressive permission flow, demo mode if denied |

### Sprint 2: Social Challenge Loop

| ID | Requirement | Priority | Acceptance Criteria |
|----|------------|----------|-------------------|
| FR-009 | Create challenge from recorded hum with song answer | P0 | User selects correct song, generates unique challenge ID |
| FR-010 | Generate shareable URL for each challenge | P0 | URL format: /challenge/{id}, works as deep link |
| FR-011 | Song search with autocomplete for guessing | P0 | Search returns results within 200ms, fuzzy matching |
| FR-012 | Song guessing flow with attempt tracking | P0 | Max 6 guesses, feedback after each (correct/wrong) |
| FR-013 | OG meta tags for social sharing preview | P0 | Twitter card + Open Graph with waveform image |
| FR-014 | Result screen showing guess count + time | P1 | Displays "Guessed in X attempts, Y seconds" |
| FR-015 | Copy-to-clipboard share with result emoji grid | P1 | Wordle-style share format, clipboard API |
| FR-016 | Challenge expiry after 7 days | P2 | Expired challenges show message, not playable |

### Sprint 3: Daily Game + Community

| ID | Requirement | Priority | Acceptance Criteria |
|----|------------|----------|-------------------|
| FR-017 | Daily challenge — same song for all players | P0 | Server-side seed generation, resets at midnight UTC |
| FR-018 | Daily leaderboard ranked by speed + attempts | P0 | Real-time updates, shows top 100, user's rank |
| FR-019 | Optional user accounts (email or OAuth) | P1 | Sign up, log in, persist stats across devices |
| FR-020 | All-time leaderboard for registered users | P1 | Cumulative score, streak count, accuracy |
| FR-021 | Spotify API integration for song metadata | P1 | Song title, artist, album art, 30s preview URL |
| FR-022 | Streak tracking — consecutive daily plays | P2 | Current streak, best streak, streak recovery (1 miss) |
| FR-023 | Personal stats dashboard | P2 | Games played, win rate, avg time, avg attempts |

### Sprint 4: Polish + Launch

| ID | Requirement | Priority | Acceptance Criteria |
|----|------------|----------|-------------------|
| FR-024 | PWA manifest + service worker for offline | P1 | Installable on mobile, offline landing page |
| FR-025 | Analytics event tracking | P1 | Key events: record, guess, share, daily play |
| FR-026 | Error monitoring and reporting | P1 | Client-side errors captured and reported |
| FR-027 | Production deployment with custom domain | P0 | SSL, CDN, health checks, monitoring |
| FR-028 | SEO-optimized landing page | P1 | Meta tags, structured data, sitemap |

---

## Non-Functional Requirements

| ID | Category | Requirement | Target |
|----|----------|------------|--------|
| NFR-001 | Performance | Page load time | < 3 seconds on 4G |
| NFR-002 | Performance | Audio recording latency | < 100ms |
| NFR-003 | Performance | Waveform render time | < 50ms |
| NFR-004 | Performance | API response time | < 200ms (p95) |
| NFR-005 | Accessibility | WCAG 2.1 Level AA compliance | All interactive elements |
| NFR-006 | Security | OWASP Top 10 compliance | No critical/high vulnerabilities |
| NFR-007 | Security | Input validation on all endpoints | SQL injection, XSS prevention |
| NFR-008 | Security | Rate limiting on API endpoints | 100 req/min per IP |
| NFR-009 | Scalability | Concurrent users | 10,000 simultaneous |
| NFR-010 | Scalability | Database performance | < 50ms query time (p95) |
| NFR-011 | Compatibility | Browser support | Chrome, Safari, Firefox, Edge (latest 2 versions) |
| NFR-012 | Compatibility | Mobile support | iOS Safari 15+, Android Chrome 90+ |
| NFR-013 | Reliability | Uptime | 99.5% |
| NFR-014 | Data | Audio data retention | Audio stored 7 days, metadata indefinitely |

---

## User Stories

### Sprint 1

| ID | Story | Points | Priority |
|----|-------|--------|----------|
| US-001 | As a visitor, I want to record my humming so that I can create a melody challenge | 5 | P0 |
| US-002 | As a visitor, I want to see a live waveform while recording so I know it's capturing my voice | 3 | P0 |
| US-003 | As a visitor, I want to see a beautiful waveform card of my recording so I can share it | 5 | P0 |
| US-004 | As a visitor, I want to play back my recording so I can hear how it sounds | 2 | P1 |
| US-005 | As a visitor, I want the app to work on my phone so I can play anywhere | 5 | P1 |
| US-006 | As a visitor, I want a demo mode if I deny mic access so I can still explore the app | 3 | P1 |

### Sprint 2

| ID | Story | Points | Priority |
|----|-------|--------|----------|
| US-007 | As a player, I want to create a challenge with my hum and the correct answer so friends can guess | 5 | P0 |
| US-008 | As a player, I want to share a challenge link so my friends can try to guess my song | 5 | P0 |
| US-009 | As a guesser, I want to search for songs and submit guesses so I can try to identify the melody | 5 | P0 |
| US-010 | As a guesser, I want to see my result and share it so I can brag or challenge others | 3 | P1 |
| US-011 | As a player, I want the shared link to show a preview card so it looks good on social media | 3 | P1 |

### Sprint 3

| ID | Story | Points | Priority |
|----|-------|--------|----------|
| US-012 | As a daily player, I want a new challenge every day so I have a reason to come back | 5 | P0 |
| US-013 | As a daily player, I want to see the leaderboard so I can compare my speed with others | 5 | P0 |
| US-014 | As a returning player, I want to create an account so my stats persist across devices | 5 | P1 |
| US-015 | As a player, I want to see song info from Spotify so I can discover new music | 3 | P1 |
| US-016 | As a daily player, I want to track my streak so I'm motivated to play every day | 3 | P2 |

### Sprint 4

| ID | Story | Points | Priority |
|----|-------|--------|----------|
| US-017 | As a mobile user, I want to install the app on my home screen for quick access | 5 | P1 |
| US-018 | As a player, I want fast load times so I don't abandon the game | 5 | P0 |
| US-019 | As a new visitor, I want to find HumDuel through search so I can discover the game | 3 | P1 |

---

## API Requirements

### Core Endpoints

| Method | Path | Description | Sprint |
|--------|------|-------------|--------|
| POST | /api/challenges | Create a new challenge (upload audio + answer) | 2 |
| GET | /api/challenges/:id | Get challenge details (audio URL, metadata) | 2 |
| POST | /api/challenges/:id/guess | Submit a guess for a challenge | 2 |
| GET | /api/daily | Get today's daily challenge | 3 |
| POST | /api/daily/guess | Submit a guess for the daily challenge | 3 |
| GET | /api/leaderboard/daily | Get today's leaderboard | 3 |
| GET | /api/leaderboard/alltime | Get all-time leaderboard | 3 |
| POST | /api/auth/register | Create user account | 3 |
| POST | /api/auth/login | Log in | 3 |
| GET | /api/users/:id/stats | Get user stats | 3 |
| GET | /api/health | Health check | 1 |

---

## Data Requirements

### Challenge Data
- Challenge ID (UUID)
- Audio blob (binary, max 500KB)
- Waveform data (JSON array of amplitude values)
- Correct song title + artist
- Creator fingerprint (anonymous or user ID)
- Created timestamp
- Expiry timestamp (created + 7 days)
- Guess count, completion count

### Daily Challenge Data
- Date (YYYY-MM-DD, primary key)
- Song title + artist
- Pre-recorded hum audio
- Seed value for deterministic generation

### User Data (Sprint 3+)
- User ID, email, display name
- OAuth provider + provider ID (optional)
- Stats: games played, wins, avg time, avg attempts
- Current streak, best streak
- Created/updated timestamps

### Leaderboard Data
- Challenge ID or date
- User fingerprint or user ID
- Attempt count, time to solve
- Rank (computed)
