# HumDuel — Social Melody Guessing Game

## Overview

A zero-install browser game where you hum a melody, it creates a shareable visual waveform card, and you challenge friends to guess the song. Daily ranked challenge format fills the gap left by Heardle (killed by Spotify, May 2023).

## Problem

- Heardle's death left 100K+ daily players without a home
- Bandle (successor) proves demand but lacks social/viral features
- No browser-first music game with Wordle-style shareability

## Solution

**HumDuel** combines:
1. **Hum-to-record** — Web Audio API captures user's hum
2. **Visual waveform card** — Canvas renders shareable "audio fingerprint"
3. **Challenge mode** — Send link to friends, they guess the song
4. **Daily puzzle** — Same song for everyone, ranked leaderboard
5. **Social sharing** — "I guessed it in 12s, can you beat me?"

## Target Users

- Casual music lovers (primary)
- Heardle refugees (immediate market)
- Social gamers who share Wordle results
- Gen Z/ Millennials who discover music socially

## Key Features

### MVP (Sprint 1-2)
- [ ] Hum recording with Web Audio API
- [ ] Waveform visualization (Canvas)
- [ ] Shareable challenge links
- [ ] Basic song guessing UI
- [ ] Mobile-responsive design

### V1.0 (Sprint 3-4)
- [ ] Daily puzzle with leaderboard
- [ ] User accounts (optional)
- [ ] Song library integration (Spotify API preview URLs)
- [ ] Challenge friends via social share
- [ ] Stats tracking (streaks, accuracy)

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind
- **Audio:** Web Audio API + Tone.js
- **Visualization:** Canvas API
- **Backend:** Node.js + Express (minimal)
- **Database:** SQLite (user stats, daily puzzles)
- **Deployment:** Vercel (frontend) + Railway (backend)
- **APIs:** Spotify Web API (song metadata + previews)

## Success Criteria

- 1,000 daily active users in first month
- 50%+ challenge completion rate
- Viral coefficient > 1.0 (users share challenges)
- < 3s average load time
- Mobile-first, works on any browser

## Differentiation

- **vs Bandle:** Shareable waveform cards, social challenge format
- **vs Heardle:** Still alive, browser-first, daily ranked mode
- **vs SongTrivia:** Hum input (not multiple choice), visual identity

## Risks

- Music licensing (mitigate: use Spotify preview URLs, 30s clips)
- Audio quality on mobile (mitigate: test early, provide recording tips)
- Game fatigue (mitigate: daily puzzle hooks, social features)

## Timeline

- **Sprint 1:** Core hum recording + waveform visualization
- **Sprint 2:** Challenge sharing + guessing UI
- **Sprint 3:** Daily puzzle + leaderboard + Spotify integration
- **Sprint 4:** Polish + deployment + launch

---

**Score:** 87/100 (Trend 22, Market 21, Feasibility 23, Differentiation 21)
**Source:** PDLC Research, 2026-04-04
