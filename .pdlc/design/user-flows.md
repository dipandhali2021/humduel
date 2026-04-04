# HumDuel — User Flows

**Date:** 2026-04-04
**Author:** ui-designer

---

## Core User Flows

### Flow 1: Create a Challenge (Hum & Share)

```
Home Page                Recording               Challenge Created         Share
   │                        │                         │                      │
   │  Tap Record Button     │  Hum into mic           │  Review waveform     │
   │ ──────────────────▶    │ ──────────────────▶     │ ──────────────────▶  │
   │                        │                         │                      │
   │                        │  Timer: 0-15s           │  Select song answer  │  Copy link
   │                        │  Live waveform          │  from Spotify search │  Share to X
   │                        │                         │                      │  Share to WA
   │                        │  Tap Stop               │  Tap "Create         │
   │                        │  OR auto-stop at 15s    │  Challenge"          │
   │                        │                         │                      │
   │                        │  Preview:               │  Challenge URL       │
   │                        │  Play / Re-record       │  generated           │
   │                        │  / Continue             │  (nanoid 8-char)     │
```

**Happy Path:** Home → Tap Record → Hum 5-15s → Stop → Preview → Set answer → Share link
**Time:** ~30 seconds end-to-end

### Flow 2: Guess a Challenge

```
Receive Link            Challenge Page           Guessing                  Result
   │                        │                         │                      │
   │  Open shared link      │  See challenger info     │  Listen to hum      │
   │ ──────────────────▶    │ ──────────────────▶     │ ──────────────────▶  │
   │                        │                         │                      │
   │  humduel.com/c/AbC123  │  Play waveform audio    │  Search for song    │  ✅ Correct!
   │                        │  See attempt counter    │  Select from results │  Time + attempts
   │                        │                         │  Submit guess        │  Share result
   │                        │                         │                      │
   │                        │                         │  If wrong:           │  ❌ Wrong (max):
   │                        │                         │  Shake animation     │  Reveal answer
   │                        │                         │  Update attempts     │  Share anyway
   │                        │                         │  Try again           │
```

**Happy Path:** Open link → Play hum → Search song → Guess → Correct → Share
**Max attempts:** 6 guesses before answer is revealed

### Flow 3: Daily Challenge

```
Home / Daily Tab         Daily Page               Guessing                  Leaderboard
   │                        │                         │                      │
   │  Tap Daily card        │  See today's puzzle     │  Same as Flow 2     │
   │  OR Daily nav tab      │  #142                   │  guessing mechanic   │
   │ ──────────────────▶    │ ──────────────────▶     │ ──────────────────▶  │
   │                        │                         │                      │
   │                        │  Play today's hum       │  6 max attempts     │  See rankings
   │                        │  See streak badge       │  Timer running      │  Your position
   │                        │                         │  from first listen   │  Share result
   │                        │                         │                      │  Come back tmrw
```

**Unique:** Same song for all players. Rankings by speed + attempts. Resets at midnight UTC.

### Flow 4: Social Sharing (Viral Loop)

```
Result Screen            Share Action             Friend Receives          Friend Plays
   │                        │                         │                      │
   │  Tap share button      │  Platform opens         │  Sees share card    │
   │ ──────────────────▶    │ ──────────────────▶     │ ──────────────────▶  │
   │                        │                         │                      │
   │  Choose platform:      │  Pre-filled message:    │  Waveform preview   │  Opens link
   │  - Copy Link           │  "I guessed the melody  │  Challenge text     │  Becomes guesser
   │  - X/Twitter           │   in 12s! Can you       │  "Can you beat me?" │  (Flow 2)
   │  - WhatsApp            │   beat me?"             │  Link to challenge  │
   │  - Instagram Stories   │  + Challenge URL        │                      │
   │                        │  + Waveform card image  │                      │
```

**Viral coefficient target:** > 1.0 (each player invites >1 friend)

---

## State Transitions

### Recording States

```
IDLE ──▶ PERMISSION_REQUEST ──▶ RECORDING ──▶ PREVIEW ──▶ CREATING_CHALLENGE
  │              │                  │            │
  │         ❌ Denied          Auto-stop       Re-record
  │              │              (15s max)         │
  └──────────────┘                 └──────────────┘
```

### Guessing States

```
LOADING ──▶ READY ──▶ LISTENING ──▶ SEARCHING ──▶ GUESSING ──▶ RESULT
              │                                       │           │
              │                                   Wrong guess  Correct
              │                                       │        OR max
              │                                       │       attempts
              └───────────────────────────────────────┘
```

### Daily Challenge States

```
NOT_STARTED ──▶ IN_PROGRESS ──▶ COMPLETED ──▶ RESULTS_VIEWED
                                    │
                              Midnight UTC
                                    │
                              NOT_STARTED (next day)
```

---

## Error States

| Error | Screen | User Action |
|-------|--------|-------------|
| Mic permission denied | Recording | Show explanation + "Enable in Settings" link |
| Audio too short (<2s) | Recording | "Hum a bit longer!" toast, stay on recording |
| Audio too long (>15s) | Recording | Auto-stop at 15s with preview |
| Network error (guess) | Challenge | "Couldn't submit. Check connection." + retry |
| Challenge expired | Challenge | "This challenge has expired." + play daily |
| Challenge not found | Challenge | "Challenge not found." + go home |
| Rate limited | Any | "Slow down! Try again in a moment." toast |
| Daily already played | Daily | Show today's result + "Come back tomorrow" |

---

## Navigation Model

### Bottom Navigation (Mobile)

| Tab | Icon | Route | Active Color |
|-----|------|-------|-------------|
| Home | 🏠 | `/` | Violet #7C3AED |
| Daily | 📅 | `/daily` | Violet #7C3AED |
| Leaderboard | 🏆 | `/leaderboard` | Violet #7C3AED |
| Profile | 👤 | `/profile` | Violet #7C3AED |

### Back Navigation

- Recording → Home (← arrow or back gesture)
- Challenge → Home (← arrow, no back to preserve answer integrity)
- Result → Home (Play Again) or Leaderboard (View Leaderboard)
- Deep links (challenge URLs) → Challenge page directly
