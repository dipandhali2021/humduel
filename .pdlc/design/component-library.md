# HumDuel — Component Library

**Date:** 2026-04-04
**Author:** ui-designer (Stitch MCP)

---

## Component Hierarchy

```
App
├── Layout
│   ├── Header
│   ├── MobileNav (bottom tab bar)
│   └── PageContainer
├── Audio
│   ├── AudioRecorder
│   ├── AudioPlayer
│   └── WaveformCanvas
├── Challenge
│   ├── ChallengeCard
│   ├── GuessingForm
│   ├── GuessResult
│   ├── AttemptCounter
│   └── ShareButton
├── Daily
│   ├── DailyBanner
│   ├── StreakBadge
│   └── DailyCountdown
├── Leaderboard
│   ├── LeaderboardList
│   ├── LeaderboardRow
│   └── StatsGrid
├── Profile
│   ├── UserAvatar
│   ├── StatsCards
│   └── ChallengeHistory
└── UI (Primitives)
    ├── Button
    ├── Input
    ├── Card
    ├── Modal
    ├── Toast
    ├── Timer
    ├── Badge
    └── Skeleton
```

---

## Core Components

### RecordButton

The signature HumDuel element. Large circular button that initiates recording.

```
┌────────────────────────────────────┐
│  Props:                            │
│  - state: 'idle' | 'recording'    │
│  - onStart: () => void            │
│  - onStop: () => void             │
│  - disabled: boolean               │
│                                    │
│  Visual:                           │
│  - Idle: Violet circle, mic icon, │
│    breathing glow animation        │
│  - Recording: Red circle, stop    │
│    icon, pulsing border            │
│  - Size: 80px diameter             │
│  - Touch target: 96px (padding)   │
└────────────────────────────────────┘
```

**Tailwind Classes:**
```
idle:     bg-violet-600 rounded-full w-20 h-20 shadow-[0_0_30px_rgba(124,58,237,0.5)]
recording: bg-red-500 rounded-full w-20 h-20 animate-pulse
```

### WaveformCanvas

Canvas-based audio visualization using Web Audio API AnalyserNode data.

```
┌────────────────────────────────────┐
│  Props:                            │
│  - audioData: Float32Array         │
│  - isPlaying: boolean              │
│  - mode: 'live' | 'static'       │
│  - gradient: [start, mid, end]    │
│  - height: number                  │
│  - width: number                   │
│                                    │
│  Visual:                           │
│  - Bars or line waveform           │
│  - Gradient: violet → blue → pink  │
│  - Rounded bar tops               │
│  - 60fps rendering target         │
│  - Responsive to container width   │
└────────────────────────────────────┘
```

**Default Gradient:**
```typescript
const WAVEFORM_GRADIENT = ['#7C3AED', '#3B82F6', '#EC4899'];
```

### ChallengeCard

Displays a challenge with waveform preview and metadata.

```
┌────────────────────────────────────┐
│  Props:                            │
│  - challenge: Challenge            │
│  - showPlay: boolean               │
│  - onPlay: () => void             │
│                                    │
│  Visual:                           │
│  - Dark card (surface-elevated)    │
│  - Waveform preview (static mode) │
│  - Play button overlay (centered)  │
│  - Creator info (avatar + name)    │
│  - 12px border-radius             │
└────────────────────────────────────┘
```

### GuessingForm

Song search + guess submission with Spotify autocomplete.

```
┌────────────────────────────────────┐
│  Props:                            │
│  - onGuess: (songId) => void      │
│  - disabled: boolean               │
│  - maxAttempts: number             │
│  - currentAttempt: number          │
│                                    │
│  Children:                         │
│  - Search input with debounced    │
│    Spotify API search              │
│  - Autocomplete dropdown          │
│    (album art, song, artist)       │
│  - Submit button (violet)          │
│  - AttemptCounter component        │
└────────────────────────────────────┘
```

### ShareButton

Platform-specific share with pre-filled content and waveform card.

```
┌────────────────────────────────────┐
│  Props:                            │
│  - platform: 'copy' | 'x' |      │
│    'whatsapp' | 'instagram'       │
│  - challengeUrl: string            │
│  - resultText: string              │
│  - waveformImage: Blob             │
│                                    │
│  Visual:                           │
│  - Circular icon button            │
│  - Platform-colored accent         │
│  - Copies formatted text + URL     │
└────────────────────────────────────┘
```

### AttemptCounter

Visual progress showing guess attempts (Wordle-style dots).

```
┌────────────────────────────────────┐
│  Props:                            │
│  - current: number                 │
│  - max: number (default: 6)       │
│  - results: ('correct'|'wrong')[] │
│                                    │
│  Visual:                           │
│  - "Attempt 2 of 6" text          │
│  - Row of 6 dots:                  │
│    ● filled = used attempt         │
│    ○ outline = remaining           │
│    🟩 green = correct              │
│    🟥 red = wrong                  │
└────────────────────────────────────┘
```

---

## UI Primitives

### Button Variants

| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| Primary | `#7C3AED` | White | None | Main CTA (Guess, Play Again) |
| Secondary | Transparent | `#7C3AED` | 1px `#7C3AED` | Secondary actions |
| Danger | `#EF4444` | White | None | Stop recording |
| Ghost | Transparent | `#A0A0B8` | None | Tertiary actions |

**All buttons:** `h-12 px-6 rounded-xl font-medium text-base transition-all duration-100`

### Card

```
Base:     bg-[#2A2640] rounded-xl p-4
Elevated: bg-[#2A2640] rounded-xl p-4 shadow-lg
Active:   bg-[#2A2640] rounded-xl p-4 ring-2 ring-violet-500
```

### Input

```
Base:     bg-[#2A2640] rounded-xl px-4 py-3 text-white placeholder:text-gray-500
          border border-[#352F50] focus:border-violet-500 focus:ring-1 focus:ring-violet-500
```

### Toast

```
Success:  bg-green-900/80 text-green-100 border-green-500
Error:    bg-red-900/80 text-red-100 border-red-500
Info:     bg-blue-900/80 text-blue-100 border-blue-500
```

---

## Stitch-to-React Mapping

Each Stitch-generated screen maps to React components:

| Stitch Screen | React Page | Key Components Used |
|---------------|-----------|-------------------|
| Home | `HomePage.tsx` | RecordButton, ChallengeCard, MobileNav |
| Recording | `RecordingPage.tsx` | RecordButton, WaveformCanvas, AudioRecorder, Timer |
| Challenge | `ChallengePage.tsx` | ChallengeCard, AudioPlayer, GuessingForm, AttemptCounter |
| Result | `ResultPage.tsx` | GuessResult, ShareButton, WaveformCanvas |
| Daily | `DailyPage.tsx` | DailyBanner, StreakBadge, ChallengeCard, GuessingForm |
| Leaderboard | `LeaderboardPage.tsx` | LeaderboardList, LeaderboardRow, StatsGrid |
| Profile | `ProfilePage.tsx` | UserAvatar, StatsCards, ChallengeHistory |

During development, Stitch `react-components` tool can generate validated React component code from these designs.
