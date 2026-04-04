# HumDuel — Screen Inventory

**Date:** 2026-04-04
**Author:** ui-designer (Stitch MCP)
**Stitch Project:** `projects/15759218275488447742`

---

## Generated Screens

All screens were designed using Google Stitch MCP with the HumDuel Design System applied. Each screen is mobile-first (780x1768px) with dark mode aesthetic.

### 1. Home / Landing Page

| Property | Value |
|----------|-------|
| **Screen ID** | `78278a8c5a0a49c3abe0a4975f5acffb` |
| **Device** | Mobile |
| **Route** | `/` |
| **Component** | `HomePage.tsx` |

**Key Elements:**
- HumDuel logo with violet music note icon
- Tagline: "Hum a tune. Challenge friends."
- Large circular record button (violet #7C3AED, mic icon, glow effect)
- "Tap to Hum" label
- Two action cards: "Daily Challenge" (with player count badge) and "Challenge a Friend"
- Bottom navigation bar (Home active)

**Screenshot:** [View in Stitch](https://stitch.googleapis.com/projects/15759218275488447742/screens/78278a8c5a0a49c3abe0a4975f5acffb)

---

### 2. Recording Screen

| Property | Value |
|----------|-------|
| **Screen ID** | `802aea5f7e084e3f984e022a85038d69` |
| **Device** | Mobile |
| **Route** | `/record` |
| **Component** | `RecordingPage.tsx` |

**Key Elements:**
- "Recording..." label with pulsing red dot and elapsed timer (0:08 / 0:15)
- Large real-time waveform visualization card (violet→blue→pink gradient)
- Stop button (red circle with square icon)
- Helper text: "Hum clearly for 5-15 seconds"
- Post-recording preview: Play / Re-record / Continue buttons

**Screenshot:** [View in Stitch](https://stitch.googleapis.com/projects/15759218275488447742/screens/802aea5f7e084e3f984e022a85038d69)

---

### 3. Challenge / Guessing Screen

| Property | Value |
|----------|-------|
| **Screen ID** | `10abf42e78cf4f34a1f8c87f3c92fea5` |
| **Device** | Mobile |
| **Route** | `/challenge/:id` |
| **Component** | `ChallengePage.tsx` |

**Key Elements:**
- Challenger info: avatar + "Alex challenged you!" + timer
- Waveform card with PLAY button overlay
- Song search input with autocomplete dropdown (album art + artist)
- "Guess" submit button (violet filled)
- Attempt counter: "Attempt 2 of 6" with progress dots

**Screenshot:** [View in Stitch](https://stitch.googleapis.com/projects/15759218275488447742/screens/10abf42e78cf4f34a1f8c87f3c92fea5)

---

### 4. Result / Share Screen

| Property | Value |
|----------|-------|
| **Screen ID** | `ab60a26cd16944de93e04bf0e5d8c840` |
| **Device** | Mobile |
| **Route** | `/challenge/:id/result` |
| **Component** | `ResultPage.tsx` |

**Key Elements:**
- Celebration: green checkmark + "You Got It!" headline
- Song info: album art, "Bohemian Rhapsody" by Queen
- Stats: "Guessed in 12s — Attempt 2/6"
- Shareable waveform card with HumDuel branding (social media optimized)
- Share buttons: Copy Link, X/Twitter, WhatsApp, Instagram Stories
- "Play Again" (violet) + "View Leaderboard" (outline) buttons

**Screenshot:** [View in Stitch](https://stitch.googleapis.com/projects/15759218275488447742/screens/ab60a26cd16944de93e04bf0e5d8c840)

---

### 5. Daily Challenge + Leaderboard (Planned)

| Property | Value |
|----------|-------|
| **Screen ID** | Pending (Stitch generation queued) |
| **Device** | Mobile |
| **Route** | `/daily` and `/leaderboard` |
| **Components** | `DailyPage.tsx`, `LeaderboardPage.tsx` |

**Planned Elements:**
- Daily Challenge #142 header with date
- Waveform card + PLAY button for daily hum
- Guessing interface (same as challenge screen)
- Leaderboard: ranked list, gold/silver/bronze medals for top 3
- User's rank highlighted in violet
- Streak badge with fire icon
- Stats cards: Games Played, Win Rate, Best Streak

---

### 6. Profile / Stats (Planned)

| Property | Value |
|----------|-------|
| **Screen ID** | Pending (Stitch generation queued) |
| **Device** | Mobile |
| **Route** | `/profile` |
| **Component** | `ProfilePage.tsx` |

**Planned Elements:**
- User avatar, display name, join date
- Stats grid: Games Played, Win Rate, Best Streak, Average Time
- Recent challenge history list
- Settings gear icon
- Logout option (Sprint 3)

---

## Screen Flow Map

```
┌──────────┐     ┌───────────┐     ┌─────────────┐     ┌──────────────┐
│  Home    │────▶│ Recording │────▶│  Challenge  │────▶│   Result     │
│  Page    │     │  Screen   │     │  Created    │     │  / Share     │
└────┬─────┘     └───────────┘     └─────────────┘     └──────┬───────┘
     │                                                         │
     │           ┌───────────┐     ┌─────────────┐            │
     ├──────────▶│   Daily   │────▶│ Leaderboard │◀───────────┘
     │           │ Challenge │     │             │
     │           └───────────┘     └─────────────┘
     │
     │           ┌───────────┐
     └──────────▶│  Profile  │
                 │  / Stats  │
                 └───────────┘
```

---

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile (default) | < 640px | Single column, bottom nav |
| Tablet | 640–1024px | Wider cards, 2-col grid |
| Desktop | > 1024px | Centered max-width 480px (phone-width), side nav optional |

The app is designed as a mobile-first PWA. Desktop users see a centered mobile layout for an authentic gaming experience.
