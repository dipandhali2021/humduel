# Sprint 2 Plan — Social Challenge Loop

## Sprint Goal
Deliver the complete social challenge loop: create challenges from hum recordings, share via unique links, guess songs, and view/share results.

## Stories

| ID | Story | Points | Agent | Description |
|----|-------|--------|-------|-------------|
| S-2-01 | Challenge creation API + unique IDs | 5 | backend-developer | POST /api/challenges (multipart upload), GET /:id, POST /:id/guess, GET /:id/result. Nanoid IDs, multer upload, fuzzy guess matching, session-based attempt tracking. |
| S-2-02 | Song guessing UI + search | 5 | react-specialist | ChallengePage with waveform display, audio playback, song search autocomplete from 100-song local catalog, guess submission with 6-attempt limit. |
| S-2-03 | Shareable challenge links + OG meta | 5 | frontend-developer | Post-recording challenge creation form (song title + artist + alias), API client, ShareButton with Web Share API + clipboard fallback, RecordingPage 3-phase flow. |
| S-2-04 | Guess result screen + share | 5 | react-specialist | ResultPage with correct/incorrect outcome, Wordle-style emoji squares, song info, time taken, community stats, share button, "Create Your Own" CTA. |
| S-2-05 | End-to-end integration + tests | 3 | test-automator | Wire full flow, API client lib, shared types, 237 new tests (168 client + 69 server). |

## Total Points: 23

## Acceptance Criteria
- [ ] Challenge creation via audio upload works end-to-end
- [ ] Unique shareable URLs generated for each challenge
- [ ] Guessing UI with song search and 6-attempt limit
- [ ] Fuzzy string matching for guess evaluation
- [ ] Result screen with Wordle-style share text
- [ ] Web Share API with clipboard fallback
- [ ] Session-based attempt tracking (localStorage + server-side)
- [ ] All 361 tests passing (292 client + 69 server)
- [ ] Production build under 250KB JS
