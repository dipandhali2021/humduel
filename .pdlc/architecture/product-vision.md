# HumDuel Product Vision Document

**Project:** HumDuel — Social Melody Guessing Game
**Version:** 1.0
**Date:** 2026-04-04
**PM:** Tier 2 Product Manager
**Status:** Planning Phase

---

## 1. Vision Statement

HumDuel is a zero-install daily music guessing game that lets you hum a melody, instantly creates a shareable visual waveform card, and challenges friends to guess the song—filling the Heardle void with a browser-native, socially-driven experience.

---

## 2. Problem Statement

### The Opportunity
- **Heardle's death (May 2023)** left 100K+ daily players seeking an alternative
- **Bandle exists** but lacks social/viral features and shareable identity artifacts
- **No browser-first competitor** combines hum-input with Wordle-style sharing mechanics
- **Market validates demand:** Spotify Wrapped generates 575M shares annually, proving music + identity expression drives engagement

### The Gap
Music fans want:
1. A daily ritual with fresh content
2. A way to express identity through taste
3. Shareable moments to challenge friends
4. Zero friction (no app install)

**HumDuel uniquely solves all four.**

---

## 3. Target Audience

### Primary Persona: The Daily Player
- **Demographics:** Music fans, ages 16-35, Gen Z / Millennials
- **Psychographics:** Music discovery enthusiasts, social gamers, identity expressers
- **Behaviors:** Plays Wordle daily, shares Spotify Wrapped, hums along to songs
- **Pain Point:** Lost their Heardle habit; want a daily music ritual with social proof
- **TAM:** 100K+ existing Heardle players + 5M+ casual game players

### Secondary Personas

**Heardle Refugee:**
- Ages 25-40, played Heardle 3-5x/week
- Seeks exact replacement with equal or greater daily engagement
- Values leaderboards and challenge mechanics

**Casual Social Gamer:**
- Ages 18-32, plays Wordle, Quordle, NYT Games
- Motivated by streaks, friend competition, shareable moments
- High viral coefficient (shares results regularly)

**Gen Z Creator:**
- Ages 16-25, values music as identity marker
- Motivated by aesthetic, shareability, meme potential
- Driver of viral adoption if waveform card is "cool"

---

## 4. Core Value Proposition

### Unique Differentiators

**vs. Bandle (Spotify's successor):**
- Bandle requires Spotify premium, HumDuel is free and zero-friction
- HumDuel's waveform card is a shareable visual artifact (35% higher retention per research)
- Challenge mode emphasizes social competition, not passive listening

**vs. Legacy Heardle:**
- Alive and updated (Heardle was sunset by Spotify)
- Browser-native, cross-device seamless experience
- Enhanced social features: direct friend challenges, async gameplay

**vs. SongTrivia / Generic Music Games:**
- Hum input creates unique "fingerprint" identity
- Daily cadence ensures habit formation (vs. infinite play)
- Ranked leaderboard drives competitive motivation

### Key Benefits

1. **Identity Expression:** Your hummed melody as a visual card is uniquely yours
2. **Instant Sharing:** One-click share to friends, social media, messaging
3. **Daily Ritual:** Fresh puzzle every 24h ensures return visits
4. **Zero Friction:** Browser-based, no download, play anywhere
5. **Social Competition:** Async challenges with friends and global leaderboard

---

## 5. Key Features

### MVP Features (Sprint 1-2): Core Gameplay

#### 5.1.1 Hum Recording (Sprint 1)
**What:** Users record themselves humming a melody using Web Audio API

**Acceptance Criteria:**
- Record up to 15 seconds of audio on desktop and mobile browsers
- Real-time waveform visualization during recording
- Visual feedback: "Recording...", "Analyzing...", "Ready to share"
- Support for Chrome, Firefox, Safari, Edge on desktop and mobile
- <500ms latency from hum to waveform render
- Graceful error handling for browser permission denials

**Technical Notes:**
- Use Web Audio API + Tone.js for capture and analysis
- Store audio as IndexedDB blob for client-side persistence
- No server upload during MVP

#### 5.1.2 Waveform Visualization (Sprint 1)
**What:** Canvas-rendered visual "fingerprint" of hummed audio

**Acceptance Criteria:**
- Render frequency spectrum as vertical bar chart (animated)
- Color gradient: cool to warm based on frequency intensity
- Dimensions: 600x200px (landscape), responsive to mobile
- Animation: smooth 200ms render with no stuttering
- Export as PNG image (shareable)
- Display metadata: timestamp, duration, song title (after guess)

**Technical Notes:**
- FFT analysis via Web Audio API AnalyserNode
- Canvas 2D rendering, consider WebGL if performance needed
- Store PNG as image blob for immediate sharing

#### 5.1.3 Shareable Challenge Links (Sprint 2)
**What:** Generate and share unique URL containing hummed audio fingerprint + challenge metadata

**Acceptance Criteria:**
- URL format: `humduel.io/challenge/{challengeId}`
- Shareable via:
  - Copy link to clipboard (one-tap)
  - Direct messaging apps (WhatsApp, iMessage, Telegram)
  - Social media (Twitter, TikTok, Instagram Stories as image)
  - Email
- Challenge includes:
  - Hummed audio (8-second clip, loopable)
  - Waveform card image
  - Challenger's alias ("You got stumped by Alex")
  - Completion time display after guess

**Technical Notes:**
- Backend generates unique challengeId → SQLite
- Store audio + metadata in S3 or similar (or embed as data URI for MVP)
- Challenge URL includes hint: "Guess Alex's hum"

#### 5.1.4 Song Guessing UI (Sprint 2)
**What:** Interface where friends listen and guess the song

**Acceptance Criteria:**
- Audio playback button: tap to listen (loops 3x)
- Text input search field
- Autocomplete dropdown from song database (100+ songs MVP)
- "Submit guess" button
- Instant feedback:
  - Correct: "Correct! It was [Song Name]" + confetti + completion time
  - Incorrect: "Not quite. Try again" + remaining attempts display
- Allotted attempts: 5 guesses per challenge
- Display complete waveform card when correct

**Technical Notes:**
- Song database: JSON file with 100+ popular songs (Spotify, Billboard Hot 100)
- Autocomplete via client-side Fuse.js or similar
- No server-side guessing logic in MVP (validation in Sprint 3)

#### 5.1.5 Mobile-Responsive Design (Sprint 1-2)
**What:** Seamless experience across devices (mobile-first)

**Acceptance Criteria:**
- Responsive layouts: <480px (mobile), 480-1024px (tablet), >1024px (desktop)
- Touch-friendly buttons: min 48x48px tap targets
- Portrait and landscape modes supported
- Performance: <3s load time on 4G (Lighthouse audits)
- Tailwind CSS for responsive grid system
- Works offline (Service Worker for MVP assets)

---

### V1.0 Features (Sprint 3-4): Engagement & Scale

#### 5.2.1 Daily Puzzle (Sprint 3)
**What:** One shared puzzle for all players each day (Heardle-style)

**Acceptance Criteria:**
- Daily puzzle rotates at 12:00 UTC
- Same puzzle for all users worldwide
- Puzzle includes:
  - 8-second hummed clip (pre-recorded by creators or sampled)
  - Song: Billboard Hot 100 or Spotify Top 50 Global catalog
  - Multiple difficulty tiers:
    - Easy: Full melody
    - Medium: Partial/obscured melody
    - Hard: Heavily pitch-shifted or reversed
- Players complete once per day; resets at midnight UTC
- Leaderboard captures completion time + accuracy

**Technical Notes:**
- Pre-record 90-day cache of daily puzzles (12/4/2026 → 7/2/2027)
- Use Spotify API to fetch song metadata
- Seed randomization: daily PRNG ensures consistency

#### 5.2.2 User Accounts & Profiles (Sprint 3)
**What:** Optional sign-up for stats tracking and leaderboard

**Acceptance Criteria:**
- Lightweight auth: email + password (no social login MVP)
- Profile fields:
  - Display name (alias)
  - Avatar (avatar generator or upload)
  - Bio (optional)
  - Stats dashboard: total guesses, accuracy %, streak, best time
- Anonymous play supported (tracked via session ID)
- Leaderboard integration: tracks user by account or session

**Technical Notes:**
- SQLite: users table with hashed passwords (bcrypt)
- JWT tokens for session management
- Optional: Email verification via simple verification link

#### 5.2.3 Song Library Integration (Sprint 3)
**What:** Live Spotify integration for song metadata, previews, and artist links

**Acceptance Criteria:**
- On correct guess:
  - Display song title, artist, album art
  - Play 30s Spotify preview (if available)
  - Link to song on Spotify (open in app or web)
  - Display artist bio / related artists
- Search autocomplete pulls from Spotify search API
- Attribution: "Data provided by Spotify"
- Graceful fallback if Spotify API unavailable (local cache)

**Technical Notes:**
- Spotify Web API: `/v1/search`, `/v1/tracks/{id}`, `/v1/audio-features`
- Client-side OAuth flow for optional premium features later
- Cache metadata in SQLite (24h TTL)

#### 5.2.4 Challenge Friends Via Social Share (Sprint 4)
**What:** Structured challenge invites with friend tracking

**Acceptance Criteria:**
- "Challenge" button on completed puzzle or custom hum
- Pre-filled messages for platforms:
  - WhatsApp: "Beat my time of 12s!"
  - Twitter: "I crushed today's HumDuel in 8s. Can you? [link]"
  - iMessage: "Hum card + leaderboard link"
- Track challenge acceptance: who challenged, who accepted, result
- Leaderboard shows head-to-head metrics: "Avg time vs. friends"
- Gamification: "Challenge streak" badge (consecutive friend challenges completed)

**Technical Notes:**
- Backend: challenges table → (challenger_id, invitee_id, puzzle_id, result, timestamp)
- Social share via Web Share API + fallback to manual copy

#### 5.2.5 Stats Tracking (Sprint 4)
**What:** Detailed performance metrics and engagement insights

**Acceptance Criteria:**
- Dashboard includes:
  - Current streak (consecutive daily puzzles)
  - Longest streak (all-time)
  - Total guesses (cumulative)
  - Average completion time
  - Accuracy % (correct / total attempts)
  - Rank on global leaderboard
- Weekly/monthly aggregates (not in MVP)
- Export stats as image (shareable)
- Milestones: 10-day streak, 100 guesses, top 100 global, etc.

**Technical Notes:**
- Stats table: (user_id, puzzle_id, guesses, time, is_correct)
- Nightly batch job: compute streaks, leaderboard ranks
- Leaderboard: top 100 cached, updated hourly

---

## 6. Success Metrics

### Primary KPIs (North Star)

| Metric | Target (Month 1) | Target (Month 3) | Why It Matters |
|---|---|---|---|
| **Daily Active Users (DAU)** | 1,000 | 10,000 | Primary growth indicator; validates product-market fit |
| **Monthly Active Users (MAU)** | 5,000 | 50,000 | Retention signal; sustainable growth |
| **Day-7 Retention Rate** | 35% | 45% | Habit formation; daily games thrive with 40%+ D7R |
| **Day-30 Retention Rate** | 15% | 25% | Long-term viability; target: 20%+ for daily games |
| **Challenge Completion Rate** | 50% | 60% | Social mechanics engagement; >50% validates viral loop |
| **Viral Coefficient (k) ** | 1.0 | 1.2 | Share-driven growth; k>1.0 = exponential expansion |

### Secondary KPIs (Operational)

| Metric | Target | Why It Matters |
|---|---|---|
| **Average Session Length** | 3-5 min | Engagement proxy; daily puzzle should take 2-4 min |
| **Load Time (P90)** | <3s on 4G | Mobile UX; >3s causes 40% bounce |
| **Error Rate (API/Audio)** | <1% | Technical reliability; audio recording prone to failures |
| **Puzzle Completion Rate** | 80% | Product-market fit; >80% means puzzle difficulty right-sized |
| **Average Attempts per Puzzle** | 2.5 | Difficulty calibration; 2-3 = optimal challenge |
| **Shares per Player** | 2+ per week | Viral coefficient driver; daily players share 2-3x/week |

### Monetization KPIs (Sprint 4+)

| Metric | Target (Month 6) | Why It Matters |
|---|---|---|
| **Monthly Recurring Revenue (MRR)** | $1,000–$5,000 | Freemium conversion at 2–5% is healthy |
| **ARPU (Avg Revenue Per User)** | $0.20–$0.50 | Hybrid model (ads + subscription) target |
| **Upgrade Conversion Rate (Free → Premium)** | 2-3% | Freemium benchmark; avoid >5% hard paywall |
| **Ad CTR (Click-Through Rate)** | >1.5% | Desktop ads perform better; mobile lower |

### Technical / Quality KPIs

| Metric | Target | Why It Matters |
|---|---|---|
| **Mobile Recording Success Rate** | 98%+ | Audio permission, browser support |
| **Waveform Render Speed** | <500ms | Perceived performance; critical for UX |
| **Backend API Latency (P95)** | <200ms | Leaderboard, guessing feedback speed |
| **Crash Rate** | <0.1% | Stability; web apps must never crash |

---

## 7. Monetization Strategy

### Phase 1 (MVP, Sprint 1-2): Free
**Why:** Build user base, validate product-market fit, zero barrier to entry

**Revenue:** $0 (investment phase)

### Phase 2 (V1.0, Sprint 3-4): Freemium + Ad-Supported

**Free Tier Includes:**
- Daily puzzle (1/day)
- Custom hum challenges (unlimited)
- Friend challenges (unlimited)
- Public leaderboard access
- Basic stats dashboard

**Premium Subscription ($2.99/month or $19.99/year):**
- Unlimited daily puzzles (archive access, play previous days)
- Ad-free experience
- Advanced stats (weekly/monthly breakdowns)
- Custom challenge storage (10+ saved)
- Early access to new features
- Exclusive badges/profiles

**Ad Placements (Non-Intrusive):**
- Static banner ad (bottom of leaderboard) — CPM: $2-5
- After-puzzle interstitial (1/5 games) — CPM: $5-10
- Sponsored "song of the day" hint (1/day) — CPC: $0.10-0.30

**Target Revenue Mix (Month 6):**
- Subscriptions: 60% ($3K–$5K MRR at 2-3% conversion)
- Ads: 40% ($2K–$3K MRR at high volume)
- Total MRR Target: $5K–$8K

### Phase 3 (Post-Launch, Month 6+): Expansion

**Potential Monetization:**
- Spotify integration commission (1-2% if promoting Spotify Premium)
- Creator music submissions (paid upload)
- Branded daily puzzles (e.g., Taylor Swift challenge week)
- Tournament/leaderboard entry fees (premium events)
- B2B partnerships (Spotify, Apple Music, labels)

### Pricing Psychology
- Free tier removes friction; converts 2-5% to premium (industry standard for web games)
- $2.99/mo = $0.10/day perception (daily game users accept this)
- Annual discount (19.99 vs 35.88) targets long-term players
- No hard paywall; ads ensure free players remain valuable

---

## 8. Product Roadmap Summary

### Sprint 1: Core Recording & Visualization (Weeks 1-2)

**Goal:** Prove technical feasibility of audio capture and waveform rendering

**Features:**
- Web Audio API hum recording (desktop + mobile)
- Real-time waveform visualization (Canvas)
- Persistent storage (IndexedDB)

**Deliverables:**
- Functional prototype tested on 3+ browsers
- 15s max recording, <500ms waveform render
- Mobile responsive layout (Tailwind)

**Success Criteria:**
- Recording success rate >95% on test devices
- P90 render time <500ms
- Works offline (Service Worker)

**Risks:**
- Mobile audio permission flows inconsistent across OS
- Canvas rendering performance on older devices

---

### Sprint 2: Challenge Sharing & Guessing (Weeks 3-4)

**Goal:** Enable social gameplay loop and validate viral mechanics

**Features:**
- Challenge URL generation and sharing
- Song guessing interface (autocomplete + submit)
- Waveform card image export
- Leaderboard UI scaffold

**Deliverables:**
- Challenge links are shareable, unique, time-stamped
- Guessing UX is intuitive (autocomplete, 5 attempts, feedback)
- Basic leaderboard (top 100 in-memory or SQLite)
- Share buttons for WhatsApp, Twitter, copy link

**Success Criteria:**
- Challenge completion rate >50%
- Share rate >1.5 per player per week
- Avg guess attempts = 2-3 (difficulty calibration)

**Risks:**
- UX complexity if guessing UI is unclear
- Share link decay if backend unreliable

---

### Sprint 3: Daily Puzzle & Leaderboard (Weeks 5-6)

**Goal:** Establish daily habit loop and introduce core engagement mechanics

**Features:**
- Daily puzzle infrastructure (UTC-based rotation)
- User accounts (optional, lightweight)
- Spotify API integration (song metadata, previews)
- Leaderboard with streaks, global ranks
- Stats dashboard

**Deliverables:**
- Daily puzzle serves same song to all players
- User profiles with email signup
- Leaderboard updates real-time (or hourly batch)
- Spotify song data in autocomplete + result screens
- Stats show streak, accuracy, avg time

**Success Criteria:**
- DAU >1,000 by end of sprint
- Signups >30% of players
- D7 retention >35%
- Challenge completion >55%

**Risks:**
- Daily puzzle fatigue if song selection is poor
- Leaderboard latency or inaccuracy
- Spotify API rate limits or service issues

---

### Sprint 4: Polish, Launch & Optimization (Weeks 7-8)

**Goal:** Production-ready release with monetization, monitoring, and full feature set

**Features:**
- Monetization (ads + premium subscription)
- Social challenges (friend tracking)
- Bug fixes and performance optimization
- Analytics instrumentation (Mixpanel or Segment)
- Marketing site + SEO
- Monitoring and alerting (Sentry, Datadog)

**Deliverables:**
- Public launch at humduel.io
- Stripe billing integration
- Google Analytics + custom event tracking
- Twitter/social media launch campaign
- Help center and onboarding flow
- Uptime monitoring and alerting

**Success Criteria:**
- 99.9% uptime post-launch
- <1% error rate
- DAU reach 1,000–5,000 within 2 weeks
- NPS >40 from early players
- Zero critical bugs post-launch

**Risks:**
- Hacker News / Reddit attention causing DDoS
- Audio bugs under production load
- Premium integration complexity

---

## 9. Risks and Mitigations

### Risk 1: Music Licensing & Copyright Claims

**Risk:** Hummed melodies could be detected as copyrighted; DMCA takedowns possible

**Severity:** HIGH | **Probability:** MEDIUM

**Mitigation:**
- Use Spotify preview URLs (pre-licensed, 30s clips, legal safe harbor)
- Do not store full-length audio; only "fingerprints" (waveform analysis)
- Include copyright notices and "for entertainment use only"
- Monitor legal landscape; consult IP attorney if needed
- If issue arises, pivot to original compositions or user-created songs

**Acceptance:** Accept risk; launch with Spotify-only catalog

---

### Risk 2: Audio Quality & Mobile Recording Failures

**Risk:** Mobile browsers have inconsistent Web Audio API support; humid environments cause poor audio quality

**Severity:** MEDIUM | **Probability:** HIGH

**Mitigation:**
- Early testing on iOS Safari, Android Chrome, Samsung Internet
- Provide in-app recording tips (quiet room, phone near mouth)
- Graceful fallback if recording fails (retry, switch browsers)
- A/B test: noise-cancellation filters vs. raw audio
- Collect user feedback on audio quality; iterate quickly

**Acceptance:** Accept risk; prioritize Android/iOS testing in Sprint 1

---

### Risk 3: Daily Puzzle Fatigue & Content Drought

**Risk:** Song selection is stale, puzzle difficulty is off; players abandon daily habit

**Severity:** MEDIUM | **Probability:** MEDIUM

**Mitigation:**
- Pre-produce 90-day content calendar (variety: pop, hip-hop, indie, etc.)
- Difficulty tiers (easy/medium/hard) cater to all skill levels
- Incorporate user feedback: weekly polls on song choices
- Implement A/B testing on puzzle difficulty (completion rate target: 80%)
- Have 180-day backlog of songs ready; refresh monthly
- Monitor churn rate daily; adjust if D7R drops below 30%

**Acceptance:** Accept risk; validated by NYT Games model (11.2B puzzles/year)

---

### Risk 4: Low Viral Coefficient & Plateau

**Risk:** Challenge sharing does not drive network effects; k-factor stays <1.0; growth stalls

**Severity:** HIGH | **Probability:** MEDIUM

**Mitigation:**
- Implement referral system: "friend who guessed correctly → streak bonus"
- Track share metrics obsessively (shares per player, share sources, CTR)
- A/B test share messaging: urgency ("Can you beat me?") vs. fun ("Try this")
- Gamify sharing: badges for "challenge master" (5+ friends invited, 3+ correct)
- Leverage friend leaderboards: "You're behind 3 friends on today's puzzle"
- If k-factor is stagnant by week 4, pivot to ads or content partnerships

**Acceptance:** Accept risk; validate k-factor in Sprint 2 with 100 testers

---

### Risk 5: Technical Debt & Scaling Issues

**Risk:** Backend cannot handle 10K+ concurrent users; database queries slow; audio processing times out

**Severity:** MEDIUM | **Probability:** MEDIUM

**Mitigation:**
- Load test backend before launch: simulate 5K concurrent users
- Use SQLite for MVP; upgrade to PostgreSQL if >50K users
- Cache leaderboard rankings (hourly batch job, Redis)
- Use CDN for audio files and static assets (Vercel edge network)
- Implement rate limiting on APIs (100 req/min per IP)
- Monitor performance: P95 latency <200ms for guessing API
- If performance degrades, adopt async workers (Bull/BullMQ for guessing queue)

**Acceptance:** Accept risk; plan scaling before Sprint 4 launch

---

## 10. Product Strategy & Future Vision

### Post-Launch: Months 1-3

**Focus:** Retention, viral coefficient, and early monetization

**OKRs:**
- Objective 1: Establish daily habit (50%+ D7R)
  - KR: DAU >5,000 by week 4
  - KR: D7 retention >35%
  - KR: Challenge completion >55%

- Objective 2: Build sustainable revenue
  - KR: Premium signup rate 2-3% (500-1,500 premium users)
  - KR: Ad impressions >500K/month
  - KR: MRR >$1,000

- Objective 3: Community engagement
  - KR: NPS >45
  - KR: Viral coefficient k>1.0
  - KR: Avg shares per player >2/week

### Post-Launch: Months 4-6

**Focus:** Feature expansion, partnerships, and B2B

**Potential Initiatives:**
- **Creator studio:** Let musicians upload custom hummed clips as daily puzzles
- **Branded partnerships:** Artist challenges (e.g., "Taylor Swift week")
- **Social integration:** Leaderboards with Discord, TikTok links
- **Esports:** Monthly tournaments with prizes
- **Accessibility:** Text-to-melody alternative for deaf/hard-of-hearing players
- **Internationalization:** Translate UI; expand song library globally

### Long-Term Vision (Year 1+)

HumDuel aspires to be **the daily ritual for music fans**—a bridge between Wordle's simplicity, Spotify's catalog, and TikTok's shareability. Success looks like:
- 100K+ DAU within 12 months
- 20%+ D30 retention (top 10% of casual games)
- $100K+ MRR from freemium model
- Household name recognition among Gen Z ("What's your HumDuel streak?")
- Platform for emerging artists (exposure, partnerships)

---

## Appendix: Success Checklist

### Pre-Launch (Sprint 4)
- [ ] All Acceptance Criteria for Sprint 1-3 met
- [ ] 99.9% uptime on staging, 24-hour soak test passed
- [ ] Security audit completed (XSS, CSRF, Auth)
- [ ] Privacy policy & T&Cs drafted
- [ ] Monitoring & alerting configured (Sentry, Datadog, Uptime Kuma)
- [ ] Analytics instrumented (Mixpanel or Amplitude)
- [ ] Support email & FAQ created
- [ ] Marketing site live
- [ ] Changelog prepared

### Launch (Day 1)
- [ ] Deploy to production (Vercel + Railway)
- [ ] Enable monitoring dashboards
- [ ] Announce on Product Hunt, Reddit, Twitter
- [ ] Monitor error rates, load times, user feedback
- [ ] Be ready to scale backend if needed

### Post-Launch (Week 1-4)
- [ ] Weekly metrics review (DAU, retention, viral coefficient)
- [ ] Daily standup: bugs, user feedback, iterations
- [ ] A/B tests running (share messaging, puzzle difficulty)
- [ ] Premium conversion rate tracking
- [ ] Churn analysis: why do players drop off?
- [ ] Content calendar updated (next 30 songs)

### Month 2-3
- [ ] Hit DAU >5,000 milestone
- [ ] D7 retention >35%
- [ ] Premium MRR >$1,000
- [ ] Viral coefficient validated (k>0.8)
- [ ] Plan Sprint 5 roadmap (feature expansion)

---

**End of Product Vision Document**

---

**Approval Sign-Off:**

| Role | Name | Date | Sign-Off |
|---|---|---|---|
| Product Manager (Tier 2) | [Your Name] | 2026-04-04 | [ ] |
| Engineering Lead | [TBD] | [TBD] | [ ] |
| Design Lead | [TBD] | [TBD] | [ ] |
| CEO / Founder | [TBD] | [TBD] | [ ] |
