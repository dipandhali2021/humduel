# HumDuel — Wireframes & Visual Mockups

**Date:** 2026-04-04
**Author:** ui-designer (Stitch MCP)
**Tool:** Google Stitch MCP (generate_screen_from_text)

---

## Wireframe Overview

All wireframes were generated using Google Stitch MCP's AI-powered design tool. Each wireframe is a high-fidelity mockup rendered as HTML with the HumDuel Design System applied.

---

## 1. Home Page Wireframe

```
┌─────────────────────────────┐
│           Status Bar         │
├─────────────────────────────┤
│                              │
│     🎵 HumDuel              │
│     Hum a tune.             │
│     Challenge friends.       │
│                              │
│        ┌───────────┐        │
│        │           │        │
│        │   🎤 MIC  │        │
│        │   (glow)  │        │
│        └───────────┘        │
│        Tap to Hum           │
│                              │
│  ┌───────────┐ ┌──────────┐ │
│  │📊 Daily   │ │👥 Challenge│ │
│  │Challenge  │ │a Friend  │ │
│  │2.4K ▶     │ │  📤      │ │
│  └───────────┘ └──────────┘ │
│                              │
│                              │
├─────────────────────────────┤
│ 🏠  📅  🏆  👤             │
│ Home Daily Lead Profile      │
└─────────────────────────────┘
```

**Interactions:**
- Tap record button → navigate to Recording screen
- Tap "Daily Challenge" card → navigate to Daily page
- Tap "Challenge a Friend" → navigate to Recording with share intent
- Bottom nav → page navigation

---

## 2. Recording Screen Wireframe

```
┌─────────────────────────────┐
│  ← Back    Recording... 🔴  │
│            0:08 / 0:15       │
├─────────────────────────────┤
│                              │
│  ┌─────────────────────────┐│
│  │                         ││
│  │  ▁▃▅▇█▇▅▃▁▃▅▇█▇▅▃▁   ││
│  │  (live waveform)        ││
│  │  violet → blue → pink   ││
│  │                         ││
│  └─────────────────────────┘│
│                              │
│        ┌───────────┐        │
│        │   ⬛ STOP │        │
│        │   (red)   │        │
│        └───────────┘        │
│                              │
│   Hum clearly for 5-15s     │
│                              │
│  ── After Recording ──       │
│  [▶ Play] [↺ Redo] [→ Next] │
│                              │
├─────────────────────────────┤
│ 🏠  📅  🏆  👤             │
└─────────────────────────────┘
```

**States:**
1. **Pre-recording:** Record button visible (from home)
2. **Recording:** Live waveform + timer + Stop button
3. **Post-recording:** Preview with Play/Re-record/Continue

---

## 3. Challenge / Guessing Screen Wireframe

```
┌─────────────────────────────┐
│  ← Back                      │
│  👤 Alex challenged you!     │
│     Started 5s ago           │
├─────────────────────────────┤
│                              │
│  ┌─────────────────────────┐│
│  │                         ││
│  │  ▁▃▅▇█▇▅▃▁▃▅▇█▇▅▃▁   ││
│  │       [▶ PLAY]          ││
│  │                         ││
│  └─────────────────────────┘│
│                              │
│  ┌─────────────────────────┐│
│  │ 🔍 Search for a song...  ││
│  ├─────────────────────────┤│
│  │ 🎵 Bohemian Rhapsody    ││
│  │    Queen                 ││
│  │ 🎵 Someone Like You     ││
│  │    Adele                 ││
│  │ 🎵 Blinding Lights      ││
│  │    The Weeknd            ││
│  └─────────────────────────┘│
│                              │
│  ┌─────────────────────────┐│
│  │       GUESS (violet)     ││
│  └─────────────────────────┘│
│                              │
│  Attempt 2 of 6             │
│  ● ○ ○ ○ ○ ○               │
│                              │
├─────────────────────────────┤
│ 🏠  📅  🏆  👤             │
└─────────────────────────────┘
```

**Interactions:**
- Play button → plays the hum audio
- Search input → fetches Spotify song suggestions
- Song suggestion tap → fills search input
- Guess button → submits guess to server
- Result → navigate to Result screen (correct) or update attempt counter (wrong)

---

## 4. Result / Share Screen Wireframe

```
┌─────────────────────────────┐
│        🎊 Confetti 🎊       │
├─────────────────────────────┤
│                              │
│         ✅ You Got It!       │
│                              │
│  ┌─────────────────────────┐│
│  │ 🎵 Bohemian Rhapsody   ││
│  │    Queen                 ││
│  │    Guessed in 12s        ││
│  │    Attempt 2/6           ││
│  └─────────────────────────┘│
│                              │
│  ┌─────────────────────────┐│
│  │  HumDuel                ││
│  │  ▁▃▅▇█▇▅▃▁▃▅▇█▇▅▃▁   ││
│  │  "I guessed in 12s!"    ││
│  │  Can you beat me?        ││
│  └─────────────────────────┘│
│   ^ shareable card preview   │
│                              │
│  [🔗 Copy] [𝕏] [📱 WA]     │
│                              │
│  ┌─────────────────────────┐│
│  │    PLAY AGAIN (violet)   ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │    VIEW LEADERBOARD      ││
│  └─────────────────────────┘│
│                              │
├─────────────────────────────┤
│ 🏠  📅  🏆  👤             │
└─────────────────────────────┘
```

**Social Share Card Format:**
```
┌─────────────────────────┐
│  HumDuel 🎵              │
│                          │
│  ▁▃▅▇█▇▅▃▁▃▅▇█▇▅▃▁    │
│                          │
│  I guessed the melody    │
│  in 12 seconds!          │
│  🟩🟩⬜⬜⬜⬜ (2/6)      │
│                          │
│  Can you beat me?        │
│  humduel.com/c/AbC12345  │
└─────────────────────────┘
```

---

## 5. Daily Challenge Wireframe

```
┌─────────────────────────────┐
│  Daily Challenge #142        │
│  🔥 5-day streak            │
├─────────────────────────────┤
│                              │
│  ┌─────────────────────────┐│
│  │  Today's Melody          ││
│  │  ▁▃▅▇█▇▅▃▁▃▅▇█▇▅▃▁   ││
│  │       [▶ PLAY]          ││
│  └─────────────────────────┘│
│                              │
│  ┌─────────────────────────┐│
│  │ 🔍 Search for a song... ││
│  └─────────────────────────┘│
│                              │
│  ┌─────────────────────────┐│
│  │       GUESS (violet)     ││
│  └─────────────────────────┘│
│                              │
│  Attempt 1 of 6             │
│  ○ ○ ○ ○ ○ ○               │
│                              │
├─────────────────────────────┤
│ 🏠  📅  🏆  👤             │
└─────────────────────────────┘
```

---

## 6. Leaderboard Wireframe

```
┌─────────────────────────────┐
│  🏆 Today's Leaderboard     │
│     April 4, 2026            │
├─────────────────────────────┤
│                              │
│  🥇 MelodyMaster   8s  1/6  │
│  🥈 TuneQueen     10s  2/6  │
│  🥉 BeatDropper   12s  2/6  │
│  ─────────────────────────── │
│  4. SongBird99    15s  3/6   │
│  5. HumKing       18s  3/6   │
│  ┌─────────────────────────┐│
│  │ 12. You (highlighted)   ││
│  │     22s  4/6             ││
│  └─────────────────────────┘│
│  13. NoteNinja    25s  4/6   │
│  ...                         │
│                              │
│  ┌────┐ ┌────┐ ┌────┐      │
│  │ 42 │ │78% │ │ 12 │      │
│  │games│ │wins│ │strk│      │
│  └────┘ └────┘ └────┘      │
│                              │
├─────────────────────────────┤
│ 🏠  📅  🏆  👤             │
└─────────────────────────────┘
```

---

## 7. Profile / Stats Wireframe

```
┌─────────────────────────────┐
│  Profile              ⚙️    │
├─────────────────────────────┤
│                              │
│         👤 Avatar            │
│       MelodyMaster           │
│    Joined April 2026         │
│                              │
│  ┌────┐ ┌────┐ ┌────┐ ┌──┐ │
│  │ 42 │ │78% │ │ 12 │ │15s│ │
│  │play│ │win │ │strk│ │avg│ │
│  └────┘ └────┘ └────┘ └──┘ │
│                              │
│  Recent Challenges           │
│  ┌─────────────────────────┐│
│  │ 🟩 Bohemian Rhapsody 12s││
│  │ 🟥 Yesterday        --  ││
│  │ 🟩 Shape of You     8s  ││
│  │ 🟩 Blinding Lights  15s ││
│  └─────────────────────────┘│
│                              │
│  [🔓 Sign In for Stats]     │
│  (Sprint 3 — auth required)  │
│                              │
├─────────────────────────────┤
│ 🏠  📅  🏆  👤             │
└─────────────────────────────┘
```

---

## Design Generation Method

All high-fidelity mockups were generated using **Google Stitch MCP** with:
- **Model:** Gemini 3.1 Pro / Gemini 3 Flash
- **Design System:** HumDuel Design System (asset/2159400510209959013)
- **Device:** Mobile (780x1768px viewport)
- **Output:** HTML + CSS + Screenshot per screen

Each mockup includes production-ready HTML/CSS that can be used as a reference for React component implementation.
