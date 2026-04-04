# HumDuel — Product Roadmap

**Last Updated:** 2026-04-04
**Format:** Now / Next / Later with RICE Scoring
**Capacity:** 70% features, 20% tech health, 10% buffer

---

## NOW (Sprint 1-2) — Core Game Loop

### Sprint 1: Audio Engine + Visual Identity
**Goal:** Users can record a hum and see a beautiful waveform visualization

| Initiative | Reach | Impact | Confidence | Effort | RICE |
|-----------|-------|--------|------------|--------|------|
| Hum recording (Web Audio API) | 10 | 10 | 9 | 5 | 180 |
| Waveform visualization (Canvas) | 10 | 9 | 9 | 5 | 162 |
| Mobile-responsive layout | 10 | 8 | 10 | 3 | 267 |
| Audio playback controls | 8 | 7 | 10 | 3 | 187 |
| Project infrastructure + CI/CD | 10 | 6 | 10 | 3 | 200 |

### Sprint 2: Social Challenge Loop
**Goal:** Users can create challenges, share them, and friends can guess

| Initiative | Reach | Impact | Confidence | Effort | RICE |
|-----------|-------|--------|------------|--------|------|
| Shareable challenge links | 10 | 10 | 8 | 5 | 160 |
| Song guessing UI + search | 10 | 9 | 8 | 5 | 144 |
| Challenge creation API | 10 | 9 | 9 | 5 | 162 |
| Guess result + share screen | 9 | 8 | 9 | 3 | 216 |
| E2E challenge flow | 10 | 8 | 7 | 3 | 187 |

---

## NEXT (Sprint 3) — Daily Game + Community

**Goal:** Daily puzzle creates daily habit, leaderboard creates competition

| Initiative | Reach | Impact | Confidence | Effort | RICE |
|-----------|-------|--------|------------|--------|------|
| Daily challenge system | 10 | 10 | 8 | 5 | 160 |
| Leaderboard (daily + all-time) | 8 | 9 | 8 | 5 | 115 |
| User accounts (optional) | 7 | 7 | 9 | 5 | 88 |
| Spotify API integration | 6 | 8 | 7 | 5 | 67 |
| Stats + streaks | 7 | 7 | 9 | 3 | 147 |

---

## LATER (Sprint 4) — Polish + Launch

**Goal:** Production-ready, fast, reliable, discoverable

| Initiative | Reach | Impact | Confidence | Effort | RICE |
|-----------|-------|--------|------------|--------|------|
| Performance optimization | 10 | 8 | 9 | 5 | 144 |
| PWA + offline mode | 8 | 7 | 8 | 5 | 90 |
| Analytics + monitoring | 10 | 6 | 10 | 3 | 200 |
| Production deployment | 10 | 10 | 9 | 3 | 300 |
| SEO + social meta tags | 9 | 8 | 9 | 3 | 216 |

---

## FUTURE (Post-Launch)

- Song library curation tools
- Cosmetic waveform themes (monetization)
- Friend groups / rooms
- Seasonal challenge packs (holiday songs)
- Audio difficulty levels (short clips, distorted, etc.)
- Multiplayer real-time mode
- Mobile app (React Native wrapper)
- Creator tools (custom challenge packs)

---

## Dependency Map

```
Sprint 1 Foundation
├── S-1-01 Scaffolding ─────────┐
├── S-1-02 Hum Recording ──┐    │
├── S-1-03 Waveform Viz ──┐│    │
├── S-1-04 Playback ──────┘│    │
└── S-1-05 Layout ─────────┘    │
                                │
Sprint 2 Social Loop            │
├── S-2-01 Challenge API ◄──────┘
├── S-2-02 Guessing UI ◄── S-2-01
├── S-2-03 Share Links ◄── S-1-03
├── S-2-04 Results ◄── S-2-02
└── S-2-05 E2E Integration ◄── ALL

Sprint 3 Community
├── S-3-01 Daily Challenge ◄── S-2-02
├── S-3-02 Leaderboard ◄── S-3-03
├── S-3-03 User Accounts
├── S-3-04 Spotify API
└── S-3-05 Stats ◄── S-3-03

Sprint 4 Launch
├── S-4-01 Performance ◄── ALL Sprint 3
├── S-4-02 PWA
├── S-4-03 Analytics
├── S-4-04 Production Deploy ◄── ALL
└── S-4-05 SEO + Landing
```

## Risk Register

| Risk | Likelihood | Impact | Sprint | Mitigation |
|------|-----------|--------|--------|------------|
| Web Audio API cross-browser issues | Medium | High | 1 | Polyfill, progressive enhancement, test matrix |
| Mic permission drop-off | Medium | Medium | 1 | Demo mode, progressive permission UX |
| Challenge link sharing friction | Low | High | 2 | Deep link + OG meta + clipboard API |
| Daily content pipeline empty | Medium | High | 3 | Seed with royalty-free catalog, community submissions |
| Spotify API deprecation/limits | Low | Medium | 3 | Cache aggressively, design for API-agnostic song data |
