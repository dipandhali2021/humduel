# Sprint 3 Plan — Daily Game + Community

## Sprint Goal
Deliver the daily puzzle system with leaderboard, Spotify API integration for real song metadata/preview URLs, and user stats tracking with streaks and accuracy.

## Sprint Metrics
| Parameter | Value |
|-----------|-------|
| Sprint number | 3 of 4 |
| Story points | 25 |
| Stories | 5 |
| Sprint capacity | 4 development agents |
| Start date | 2026-04-05 |

## Stories

### S-3-01: Daily Challenge System (5 pts)
**Agent:** backend-developer
**Description:** Build a seed-based daily puzzle system that selects a deterministic song each day from the catalog. Every player sees the same puzzle on a given date.

**Subtasks:**
1. Extend schema.sql with daily_guesses table and indexes
2. Create `dailyService.ts` with date-seeded puzzle generation using a simple hash of YYYY-MM-DD
3. Implement GET /api/daily — returns today's puzzle (puzzle number, song hint, audio placeholder)
4. Implement POST /api/daily/guess — submit a guess with session/user tracking
5. Implement GET /api/daily/result — get completed result with share text

**Acceptance Criteria:**
- Same song selected for all players on a given date
- Puzzle number increments daily from a fixed epoch
- 6-attempt limit per user per day
- Deterministic: same date always yields same song

### S-3-02: Leaderboard UI and API (5 pts)
**Agent:** react-specialist
**Description:** Build the leaderboard system showing ranked daily challenge completions.

**Subtasks:**
1. Create `leaderboardService.ts` with ranking query (by attempts asc, time asc)
2. Implement GET /api/leaderboard with date query parameter
3. Build LeaderboardPage with podium display for top 3
4. Add date navigation (today, yesterday, date picker)
5. Show player rank, attempts, time for each entry

**Acceptance Criteria:**
- Leaderboard shows all completions for a given date ranked by fewest attempts then fastest time
- Date navigation works (today/yesterday/specific date)
- Current user highlighted if present
- Empty state when no completions exist

### S-3-03: User Accounts — Nickname-Based (5 pts)
**Agent:** fullstack-developer
**Description:** Lightweight user system — anonymous users set a nickname, stored in localStorage with a server-side record.

**Subtasks:**
1. Create `userService.ts` with create/get/update user functions
2. Add user routes: POST /api/users, GET /api/users/:id, PUT /api/users/:id
3. Build ProfilePage with nickname form and avatar selection
4. Store userId in localStorage, attach to daily guesses and leaderboard entries
5. Add useUser hook for accessing current user state

**Acceptance Criteria:**
- Users can set a nickname (2-20 chars, alphanumeric + spaces)
- User ID persisted in localStorage across sessions
- Nickname displayed on leaderboard entries
- Profile page shows user info

### S-3-04: Spotify API Integration (5 pts)
**Agent:** backend-developer
**Description:** Integrate Spotify Web API for song search with real metadata (album art, preview URLs, Spotify IDs).

**Subtasks:**
1. Create `spotifyService.ts` with client credentials OAuth flow
2. Implement token caching with auto-refresh before expiry
3. Implement GET /api/songs/search proxying to Spotify search API
4. Return structured results: title, artist, album art URL, preview URL, Spotify ID
5. Fallback to local catalog when Spotify credentials not configured

**Acceptance Criteria:**
- Client credentials flow obtains and caches access token
- Song search returns up to 10 results with metadata
- Graceful fallback to local catalog if SPOTIFY_CLIENT_ID not set
- Preview URLs included when available from Spotify

### S-3-05: Stats Tracking (5 pts)
**Agent:** frontend-developer
**Description:** Track and display user statistics: games played, win rate, streaks, average time.

**Subtasks:**
1. Create `statsService.ts` computing stats from daily_guesses + users table
2. Implement GET /api/users/:id/stats endpoint
3. Build stats display in ProfilePage: games played, win rate, streaks, avg time
4. Add streak tracking logic (consecutive daily completions)
5. Add recent game history list

**Acceptance Criteria:**
- Stats computed from actual game data (not cached counters)
- Current streak and best streak tracked correctly
- Win rate = correct guesses / total games
- Average time computed from successful completions only
- Profile page displays all stats with visual indicators

## Dependencies
- S-3-01 must complete before S-3-02 (leaderboard needs daily challenge data)
- S-3-03 must complete before S-3-05 (stats need user identity)
- S-3-04 is independent (enhances song search, can run in parallel)

## Definition of Done
- [ ] All 5 stories implemented and integrated
- [ ] Unit tests written and passing
- [ ] Schema migrations applied cleanly
- [ ] API endpoints documented with types
- [ ] Frontend pages replace stubs with full implementations
- [ ] Conventional commits per story
