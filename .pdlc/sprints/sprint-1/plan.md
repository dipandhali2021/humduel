# Sprint 1 Plan — Core Audio Engine

## Sprint Goal
Deliver a working browser-based hum recording experience with live waveform visualization, audio playback, and mobile-responsive UI following the Stitch design system.

## Duration
**Start:** 2026-04-04 | **End:** 2026-04-04

## Stories

| ID | Story | Description | Agent(s) | Points | Priority | Dependencies |
|----|-------|-------------|----------|--------|----------|--------------|
| S-1-01 | Project scaffolding + CI/CD | React+Vite+TS client, Express+TS server, Tailwind, GH Actions | devops-engineer | 3 | P0 | -- |
| S-1-02 | Hum recording with Web Audio API | useAudioRecorder hook, AudioRecorder component, RecordButton, Zustand store | frontend-developer | 5 | P0 | S-1-01 |
| S-1-03 | Waveform visualization with Canvas | WaveformCanvas, useWaveform hook, waveform utils, ChallengeCard | react-specialist | 5 | P0 | S-1-01 |
| S-1-04 | Audio playback controls | useAudioPlayer hook, AudioPlayer component, audio utils, gameStore | react-specialist | 3 | P1 | S-1-01 |
| S-1-05 | Mobile-responsive layout + landing page | Header, MobileNav, PageContainer, HomePage, RecordingPage, Card | ui-designer | 5 | P1 | S-1-01 |

**Total: 21 story points**

## Execution Order
1. S-1-01 (scaffolding) — blocks all others
2. S-1-02, S-1-03, S-1-04, S-1-05 — parallel after scaffolding
3. Integration: wire real WaveformCanvas into AudioRecorder + RecordingPage
4. Testing: 124 unit tests across 7 test files

## Definition of Done
- [x] Code written and compiles/runs
- [x] Unit tests written and passing (124/124)
- [x] Vite production build succeeds
- [x] TypeScript strict mode — zero errors
- [x] Mobile-responsive design following Stitch design system
- [x] Committed with conventional commit messages
