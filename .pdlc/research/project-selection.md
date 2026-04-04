# Project Selection Report

**Date:** 2026-04-04
**Research Domain:** Fun, engaging consumer web apps
**Project Type:** Web app
**Research Cycles:** 1

## Selected Project

**Name:** HumDuel — Social Melody Guessing Game
**Description:** HumDuel is a zero-install browser game where players hum a melody into their microphone, which is converted into a shareable visual waveform card, and challenge friends or compete in a daily ranked challenge to identify the song. The core loop combines audio capture, real-time pitch detection, and Wordle-style social sharing mechanics into a daily habit game. It fills the documented gap left by Heardle's shutdown in May 2023 while introducing an entirely new input mechanic — humming as gameplay — that no existing competitor uses.
**Target Users:** Music fans aged 16-35 who play daily browser puzzle games (Wordle, Connections, Framed), nostalgia seekers who mourned Heardle's closure, and casual social gamers who share results on social media. Secondary audience: friend groups looking for async challenges.
**Key Differentiator:** The only browser game that uses humming as the core mechanic. Players generate and share visual waveform cards (analogous to Wordle result grids), creating an identity-expressive, inherently viral distribution loop that no existing music game has. Heardle's audience is documented, large, and currently unserved.
**Estimated Sprints:** 4

## Scoring

| Candidate | Trend Momentum | Market Size | Feasibility | Differentiation | Total |
|-----------|---------------|-------------|-------------|-----------------|-------|
| **HumDuel** | **22/25** | **21/25** | **23/25** | **21/25** | **87/100** |
| BodyParty | 21/25 | 20/25 | 17/25 | 22/25 | 80/100 |
| Mood Canvas | 18/25 | 13/25 | 21/25 | 24/25 | 76/100 |

## Selection Rationale

HumDuel scores highest across all four dimensions and carries the most favorable risk/reward profile in the candidate set.

**Why HumDuel over BodyParty (80/100):** BodyParty's concept is compelling and its SIGNIFICANT-NOVEL differentiation rating is earned — combining webcam, MediaPipe body tracking, and multiplayer in the browser is genuinely unexplored territory. However, its feasibility score is penalized for one concrete engineering risk: WebRTC latency when synchronizing body tracking data for 3-8 concurrent players. At 5 sprints, it sits at the upper boundary of the 4-6 sprint MVP window, and the latency problem is not just a sprint-count issue but a product quality issue — a laggy body-tracking game is worse than no body-tracking game. HumDuel's 4-sprint path uses exclusively mature, well-documented APIs (Web Audio API for pitch detection, Canvas API for waveform rendering, WebSockets for daily challenge state), reducing execution risk substantially.

**Why HumDuel over Mood Canvas (76/100):** Mood Canvas earns the highest differentiation score in the set (24/25, NOVEL) and its 4-sprint feasibility is solid. The limiting factor is market size: the competitive analysis explicitly flags "smaller addressable market" as a risk, and the market data confirms this — emotion-reactive ambient generative art is an aesthetic niche. There is no documented mass-market audience seeking this product in the way Heardle's former users are documented and measurable. Building a technically novel product for a small audience is a misallocation of a 4-6 sprint budget when a high-momentum, large-market alternative exists.

**Why HumDuel wins on the evidence:**
- The Heardle void is the clearest documented demand signal in the entire candidate set. Heardle was shut by Spotify in May 2023; Bandle (listening-only successor) runs 100K daily players, proving the segment is active and hungry.
- Zero-install social browser games are at +340% DAU growth in 2025. HumDuel is architecturally zero-install.
- Shareable output design drives 35% higher retention (market research finding). HumDuel's waveform cards are a first-class shareable output.
- Daily cadence is validated at industrial scale: NYT Games runs 11.2B puzzles/year.
- Trend Momentum score of 22/25 reflects converging signals: daily puzzle growth, music game nostalgia, and Wrapped culture (250M engaged, 575M shares) proving music + identity expression + sharing is mass consumer behavior.

## Key Research Findings

### Trend Data

Zero-install social browser games grew 340% DAU in 2025, with Gartic Phone reaching 50M+ players. The daily puzzle genre operates at scale — NYT Games processes 11.2B puzzles/year. Browser gaming is broadly resurgent: Poki reports 100M monthly players and 1B plays/month; the market is $8.01B in 2026. Spotify Wrapped 2025 generated 250M engaged users and 575M shares, confirming music-plus-identity-expression is mass consumer behavior. AI music creation hit escape velocity (Suno 12M+ users, $300M ARR). Vibe-coded browser games exploded (1,170 game jam submissions, fly.pieter.com $1M ARR in 3 weeks). WebGPU achieved full cross-browser support in late 2025. On-device AI matured: Kokoro TTS, WebLLM, and MediaPipe all run in-browser.

### Market Analysis

Combined TAM for fun/interactive consumer web apps: $28B-$47B, 10-19% CAGR. Browser games segment: $8-10B growing. AI consumer apps approaching $10B in spending by 2026. Creator economy: $250B, 26% CAGR. Key behavioral finding: apps with social sharing mechanics see 35% higher retention; daily cadence creates the strongest habit loops. NYT Games reported $11.2M in Q2 2024 in-app revenue from games acquired for under $1M (Wordle), demonstrating outsized ROI. Gen Z/Alpha treat the browser as first-class, prioritize shareability and identity expression.

### Competitive Landscape

The competitive analysis identified a high-confidence gap in the music game market:

- **Heardle** (DEAD — shut by Spotify, May 2023): Documented audience currently unserved
- **Bandle** (100K daily players): Listening-only successor, no humming mechanic
- **Google Hum to Search**: Utility, not a game, no social mechanics
- **SoundHound**: Pivoted to enterprise ($169M revenue)
- **AllKaraoke.Party**: Karaoke performance, not guessing

No product combines: (1) humming as input, (2) daily challenge format, (3) shareable visual output cards, and (4) async friend challenge mode. Each element is validated individually; their combination is the differentiated position.

**Runner-up competitive positions:**
- **BodyParty**: No polished webcam party game exists for browsers. Gap is real but technical execution risk higher (WebRTC latency for 3-8 players with body tracking).
- **Mood Canvas**: Zero direct competitors (emotion detection + generative art + ambient). Most novel idea but smallest addressable market.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Platform clone: Spotify or TikTok ships a humming game | Medium | High | Ship fast (4 sprints), establish user base before incumbents. Network effects from daily leaderboard and friend challenges create switching cost. |
| Microphone permission friction reduces activation | Medium | Medium | No-mic demo mode with pre-recorded hums for first-time visitors. Show social proof (share cards) on landing page before mic request. Progressive permission pattern. |
| Pitch detection accuracy on mobile microphones | Medium | Medium | Use established Web Audio API pitch detection libraries (Pitchy, ml5). Visual feedback loop (live waveform) so users see capture. Tune sensitivity thresholds per device class. |
| Content licensing for daily challenge songs | Low-Medium | High | Launch with royalty-free/CC music catalog. Use song titles only (no audio playback) in guessing UI to avoid reproduction rights. Design for licensed catalog expansion post-MVP. |
| DAU retention drop after novelty phase | Low-Medium | Medium | Streak mechanics (Duolingo model). Weekly themed challenge packs. Friend group leaderboards. Seasonal events (holiday song challenges). |
| Web Audio API latency on low-end devices | Low | Medium | WebAssembly pitch detector fallback. Minimum latency threshold in QA; simplified waveform-only mode below threshold. |

## Next Steps
- Proceed to PLANNING phase
- Focus on:
  - Define the daily challenge content pipeline and song catalog strategy (royalty-free first, licensed later)
  - Spike Web Audio API pitch detection accuracy on iOS Safari and Android Chrome
  - Design the shareable waveform card format as a product design priority (primary viral distribution surface)
  - Architect daily challenge state sync (WebSocket + server-side daily seed generation)
  - Define monetization path: ad-free subscription tier (NYT Games model), cosmetic waveform themes, or friend group premium rooms
