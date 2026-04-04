# HumDuel — Project Plan

## Project Overview

| Field | Value |
|-------|-------|
| **Project** | HumDuel — Social Melody Guessing Game |
| **Total Sprints** | 4 |
| **Sprint Duration** | 7 days each |
| **Team Size** | 4 development agents per sprint |
| **Target Completion** | 4 weeks |

## Work Breakdown Structure

### WBS Level 1: Product Milestones

| ID | Milestone | Sprint | Exit Criteria |
|----|-----------|--------|---------------|
| M1 | Core Audio Engine | Sprint 1 | Hum recording + waveform rendering working in browser |
| M2 | Social Challenge Loop | Sprint 2 | Users can create, share, and guess challenges |
| M3 | Daily Game + Community | Sprint 3 | Daily puzzle, leaderboard, Spotify integration live |
| M4 | Production Launch | Sprint 4 | Deployed, polished, performant, monitored |

### WBS Level 2: Sprint Breakdown

#### Sprint 1 — Core Audio Engine (Foundation)
| Story | Description | Points | Priority |
|-------|-------------|--------|----------|
| S-1-01 | Project scaffolding + CI/CD | 3 | P0 |
| S-1-02 | Hum recording with Web Audio API | 5 | P0 |
| S-1-03 | Waveform visualization with Canvas | 5 | P0 |
| S-1-04 | Audio playback controls | 3 | P1 |
| S-1-05 | Mobile-responsive layout + landing page | 5 | P1 |
| **Total** | | **21** | |

#### Sprint 2 — Social Challenge Loop
| Story | Description | Points | Priority |
|-------|-------------|--------|----------|
| S-2-01 | Challenge creation API + unique IDs | 5 | P0 |
| S-2-02 | Song guessing UI + search | 5 | P0 |
| S-2-03 | Shareable challenge links + OG cards | 5 | P0 |
| S-2-04 | Guess result screen + share | 3 | P1 |
| S-2-05 | Challenge flow end-to-end integration | 3 | P1 |
| **Total** | | **21** | |

#### Sprint 3 — Daily Game + Community
| Story | Description | Points | Priority |
|-------|-------------|--------|----------|
| S-3-01 | Daily challenge generation system | 5 | P0 |
| S-3-02 | Leaderboard (daily + all-time) | 5 | P0 |
| S-3-03 | User accounts (optional sign-up) | 5 | P1 |
| S-3-04 | Spotify API integration (song metadata) | 5 | P1 |
| S-3-05 | Stats tracking (streaks, accuracy) | 3 | P2 |
| **Total** | | **23** | |

#### Sprint 4 — Polish + Launch
| Story | Description | Points | Priority |
|-------|-------------|--------|----------|
| S-4-01 | Performance optimization (Core Web Vitals) | 5 | P0 |
| S-4-02 | PWA support + offline mode | 5 | P1 |
| S-4-03 | Analytics + error monitoring | 3 | P1 |
| S-4-04 | Production deployment + domain setup | 3 | P0 |
| S-4-05 | Landing page + SEO + social meta | 3 | P1 |
| **Total** | | **19** | |

## Estimated Velocity

| Sprint | Planned Points | Expected Velocity | Buffer |
|--------|---------------|-------------------|--------|
| Sprint 1 | 21 | 18-21 (first sprint, calibrating) | 15% |
| Sprint 2 | 21 | 19-21 | 10% |
| Sprint 3 | 23 | 20-23 | 10% |
| Sprint 4 | 19 | 17-19 | 10% |

## Dependencies

```
S-1-01 (scaffolding) → blocks all other Sprint 1 stories
S-1-02 (recording) → blocks S-2-01 (challenge creation needs audio data)
S-1-03 (waveform) → blocks S-2-03 (shareable cards need waveform render)
S-2-01 (challenge API) → blocks S-2-02, S-2-03
S-2-02 (guessing UI) → blocks S-3-01 (daily challenge uses same UI)
S-3-03 (user accounts) → blocks S-3-02 (leaderboard needs user identity)
```

## Risk Register

| Risk | Probability | Impact | Mitigation | Owner |
|------|------------|--------|------------|-------|
| Web Audio API inconsistency across browsers | Medium | High | Polyfill + progressive enhancement | frontend-developer |
| Microphone permission UX friction | Medium | Medium | Demo mode + progressive permission | react-specialist |
| SQLite scaling limitations | Low | Medium | Design for migration to PostgreSQL | backend-developer |
| Spotify API rate limits | Medium | Medium | Cache responses, use preview URLs | backend-developer |
| Mobile audio quality variance | Medium | Medium | Pitch detection tuning per device | frontend-developer |

## Definition of Done (project-level)

- [ ] All 4 sprint milestones achieved
- [ ] Test coverage > 70%
- [ ] No critical/high security issues
- [ ] Performance: < 3s load, < 100ms audio latency
- [ ] Mobile-responsive across target browsers
- [ ] Production deployment live and monitored
- [ ] README with install, usage, and feature docs
