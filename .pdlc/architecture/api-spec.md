# HumDuel — REST API Specification

**Version:** 1.0.0
**Date:** 2026-04-04
**Author:** api-designer
**Base URL:** `https://api.humduel.io`
**Protocol:** HTTPS only

---

## Table of Contents

1. [Overview](#overview)
2. [Conventions](#conventions)
3. [Authentication](#authentication)
4. [Rate Limiting](#rate-limiting)
5. [Error Format](#error-format)
6. [Pagination Format](#pagination-format)
7. [Shared Types](#shared-types)
8. [Sprint 1 Endpoints](#sprint-1-endpoints)
9. [Sprint 2 Endpoints](#sprint-2-endpoints)
10. [Sprint 3 Endpoints](#sprint-3-endpoints)
11. [Status Code Reference](#status-code-reference)
12. [Changelog](#changelog)

---

## Overview

HumDuel's API is a resource-oriented REST API. All request and response bodies use `application/json` unless noted. Audio upload endpoints use `multipart/form-data`.

The API is organized into three sprint releases that ship incrementally. Sprint 1 covers infrastructure, Sprint 2 covers the core social challenge loop, and Sprint 3 covers daily gameplay, leaderboards, authentication, and Spotify integration.

### Design Principles

- Resource nouns in URI paths, HTTP verbs encode the action
- No answer data ever leaves the server in a challenge fetch response
- Anonymous play is fully supported through Sprint 2; accounts are opt-in in Sprint 3
- All timestamps are ISO 8601 UTC strings (`2026-04-04T12:00:00Z`)
- All IDs are 8-character nanoid strings unless otherwise specified
- Responses are always JSON objects at the top level (never bare arrays)

---

## Conventions

### URI Structure

```
/api/{resource}
/api/{resource}/{id}
/api/{resource}/{id}/{sub-resource}
```

### Naming

- URI path segments: `kebab-case`
- JSON keys: `camelCase`
- Enum values: `snake_case`

### HTTP Methods

| Method | Semantics |
|--------|-----------|
| GET    | Retrieve a resource or collection; safe and idempotent |
| POST   | Create a resource or submit an action; not idempotent |
| PATCH  | Partial update of a resource; idempotent |
| DELETE | Remove a resource; idempotent |

---

## Authentication

Authentication is **optional in Sprint 2** and **progressively required in Sprint 3** for leaderboard persistence and user stats.

### JWT Bearer Token

Authenticated requests include a JWT in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are issued by `POST /api/auth/login` and expire after **7 days**. There is no refresh token endpoint in v1.0.

### Auth Requirement Labels

Each endpoint is labeled:

| Label | Meaning |
|-------|---------|
| `public` | No token required or accepted |
| `optional` | Token accepted if present; anonymous play still allowed |
| `required` | 401 returned if no valid token |

---

## Rate Limiting

All endpoints are rate-limited per originating IP address. Limits are applied using a sliding window algorithm.

### Default Limits

| Endpoint Group | Limit | Window |
|----------------|-------|--------|
| General API | 100 requests | 60 seconds |
| `POST /api/challenges` (audio upload) | 10 requests | 60 seconds |
| `POST /api/challenges/:id/guess` | 20 requests | 60 seconds |
| `POST /api/daily/guess` | 10 requests | 60 seconds |
| `GET /api/songs/search` | 30 requests | 60 seconds |
| `POST /api/auth/register` | 5 requests | 60 seconds |
| `POST /api/auth/login` | 10 requests | 60 seconds |

### Rate Limit Response Headers

Every response includes the following headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1743764460
```

When a limit is exceeded, the API returns `429 Too Many Requests` with a `Retry-After` header (seconds until the window resets).

---

## Error Format

All errors use a consistent JSON body. HTTP status codes carry semantic meaning; the body provides machine-readable and human-readable detail.

```json
{
  "error": "Human-readable description of the problem.",
  "code": "MACHINE_READABLE_CODE"
}
```

### Error Code Catalog

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request body or query parameters failed validation |
| `AUDIO_TOO_LARGE` | 400 | Audio blob exceeds the 500 KB limit |
| `AUDIO_INVALID_FORMAT` | 400 | Audio is not a supported MIME type (webm, ogg, mp4) |
| `GUESS_ALREADY_SUBMITTED` | 400 | All allowed attempts have been used on this challenge |
| `CHALLENGE_EXPIRED` | 400 | Challenge is older than 7 days and is no longer playable |
| `DAILY_ALREADY_COMPLETED` | 400 | Authenticated user has already completed today's daily challenge |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT token |
| `TOKEN_EXPIRED` | 401 | JWT token has passed its expiry time |
| `FORBIDDEN` | 403 | Token is valid but the user lacks permission for this resource |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CHALLENGE_NOT_FOUND` | 404 | No challenge exists with the given ID |
| `USER_NOT_FOUND` | 404 | No user account found |
| `DAILY_NOT_FOUND` | 404 | No daily challenge is configured for today |
| `EMAIL_ALREADY_EXISTS` | 409 | Registration failed because the email is already in use |
| `RATE_LIMITED` | 429 | Originating IP has exceeded the rate limit for this endpoint |
| `INTERNAL_ERROR` | 500 | Unexpected server-side failure |
| `SPOTIFY_UNAVAILABLE` | 503 | Spotify API is unreachable; cached data may be returned |

### Validation Error Detail

When `code` is `VALIDATION_ERROR`, the response includes a `details` array:

```json
{
  "error": "Request validation failed.",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "guess", "message": "guess is required and must be a non-empty string" }
  ]
}
```

---

## Pagination Format

All paginated collection responses share a consistent envelope:

```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "limit": 20
}
```

| Field | Type | Description |
|-------|------|-------------|
| `data` | `T[]` | Array of resource objects |
| `total` | `number` | Total count of matching records across all pages |
| `page` | `number` | Current page number (1-indexed) |
| `limit` | `number` | Items per page for this response |

### Pagination Query Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | `integer` | `1` | — | Page number (1-indexed) |
| `limit` | `integer` | `20` | `100` | Items per page |

---

## Shared Types

### ChallengeId

An 8-character nanoid string using the URL-safe alphabet `[A-Za-z0-9_-]`.

Example: `"a3Bx9qTz"`

### WaveformData

A JSON array of amplitude values sampled from the recorded audio. Each value is a float in the range `[0.0, 1.0]`. The array length is fixed at 200 samples (one sample per 75ms for a 15s max recording).

```json
[0.12, 0.45, 0.87, 0.34, ...]
```

### SongMatch

```json
{
  "title": "string",
  "artist": "string",
  "spotifyId": "string | null",
  "albumArt": "string | null",
  "previewUrl": "string | null"
}
```

`spotifyId`, `albumArt`, and `previewUrl` are `null` if the Spotify lookup has not been performed or failed.

---

## Sprint 1 Endpoints

### GET /api/health

Health check for deployment verification and uptime monitoring.

**Auth:** `public`
**Rate limit:** General (100/min)

#### Response — 200 OK

```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-04-04T12:00:00Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"ok" \| "degraded"` | `"degraded"` if a non-critical dependency (e.g., Spotify) is down |
| `version` | `string` | API semver string |
| `timestamp` | `string` | ISO 8601 UTC timestamp of the response |

#### Status Codes

| Code | Condition |
|------|-----------|
| 200 | Server is running |
| 500 | Server is failing a critical health check |

---

## Sprint 2 Endpoints

### POST /api/challenges

Create a new challenge by uploading a hummed audio recording and providing the correct song answer. The answer is stored server-side and is never returned in GET challenge responses.

**Auth:** `optional`
**Rate limit:** 10 requests / 60 seconds per IP
**Content-Type:** `multipart/form-data`

#### Request — multipart/form-data

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `audio` | `File` | Yes | Max 500 KB; MIME: `audio/webm`, `audio/ogg`, `audio/mp4` | The recorded hum audio blob |
| `waveformData` | `string` (JSON) | Yes | JSON array of 200 floats, each in `[0.0, 1.0]` | Pre-computed waveform amplitude values from the client |
| `songTitle` | `string` | Yes | 1–200 characters | The correct song title |
| `songArtist` | `string` | Yes | 1–200 characters | The correct artist name |
| `durationSeconds` | `number` | Yes | `1`–`15` | Recorded audio duration in seconds |
| `creatorAlias` | `string` | No | 1–50 characters | Display name for the challenge creator (anonymous otherwise) |

#### Response — 201 Created

```json
{
  "id": "a3Bx9qTz",
  "challengeUrl": "https://humduel.io/challenge/a3Bx9qTz",
  "expiresAt": "2026-04-11T12:00:00Z",
  "createdAt": "2026-04-04T12:00:00Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | 8-character nanoid for this challenge |
| `challengeUrl` | `string` | Fully qualified shareable URL |
| `expiresAt` | `string` | ISO 8601 UTC; challenge is playable until this time (created + 7 days) |
| `createdAt` | `string` | ISO 8601 UTC creation timestamp |

#### Status Codes

| Code | Condition |
|------|-----------|
| 201 | Challenge created successfully |
| 400 | `VALIDATION_ERROR` — missing or invalid fields |
| 400 | `AUDIO_TOO_LARGE` — audio exceeds 500 KB |
| 400 | `AUDIO_INVALID_FORMAT` — unsupported MIME type |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |

---

### GET /api/challenges/:id

Retrieve a challenge for a guesser. Returns audio, waveform visualization data, and metadata. **Never returns the song title or artist.**

**Auth:** `public`
**Rate limit:** General (100/min)

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | 8-character challenge nanoid |

#### Response — 200 OK

```json
{
  "id": "a3Bx9qTz",
  "audioUrl": "https://cdn.humduel.io/audio/a3Bx9qTz.webm",
  "waveformData": [0.12, 0.45, 0.87],
  "durationSeconds": 8.4,
  "creatorAlias": "Alex",
  "guessCount": 14,
  "completionCount": 6,
  "maxAttempts": 6,
  "expiresAt": "2026-04-11T12:00:00Z",
  "createdAt": "2026-04-04T12:00:00Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Challenge ID |
| `audioUrl` | `string` | CDN URL for the audio blob; valid for the lifetime of the challenge |
| `waveformData` | `number[]` | 200-element amplitude array |
| `durationSeconds` | `number` | Audio duration in seconds |
| `creatorAlias` | `string \| null` | Creator's chosen display name; `null` if anonymous |
| `guessCount` | `number` | Total guess submissions across all players |
| `completionCount` | `number` | Number of players who guessed correctly |
| `maxAttempts` | `number` | Maximum allowed guesses per player (fixed at `6`) |
| `expiresAt` | `string` | ISO 8601 UTC expiry timestamp |
| `createdAt` | `string` | ISO 8601 UTC creation timestamp |

#### Status Codes

| Code | Condition |
|------|-----------|
| 200 | Challenge found and returned |
| 400 | `CHALLENGE_EXPIRED` — challenge is past its expiry date |
| 404 | `CHALLENGE_NOT_FOUND` |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |

---

### POST /api/challenges/:id/guess

Submit a song guess for a challenge. The server compares the guess against the stored answer using case-insensitive, punctuation-normalized string matching. Attempt history is tracked per session fingerprint (anonymous) or per user ID (authenticated).

**Auth:** `optional`
**Rate limit:** 20 requests / 60 seconds per IP

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | 8-character challenge nanoid |

#### Request Body

```json
{
  "guess": "Blinding Lights - The Weeknd"
}
```

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `guess` | `string` | Yes | 1–300 characters | Free-text guess in `"Song Title - Artist"` format; matching is tolerant |
| `sessionId` | `string` | No | UUID v4 | Anonymous session identifier for attempt tracking; ignored if authenticated |

#### Response — 200 OK

```json
{
  "correct": true,
  "attemptsUsed": 3,
  "attemptsRemaining": 3,
  "maxAttempts": 6,
  "timeTakenSeconds": 45,
  "song": {
    "title": "Blinding Lights",
    "artist": "The Weeknd",
    "spotifyId": "0VjIjW4GlUZAMYd2vXMi3b",
    "albumArt": "https://i.scdn.co/image/ab67616d0000b273...",
    "previewUrl": "https://p.scdn.co/mp3-preview/..."
  }
}
```

When `correct` is `false` and attempts remain:

```json
{
  "correct": false,
  "attemptsUsed": 2,
  "attemptsRemaining": 4,
  "maxAttempts": 6,
  "timeTakenSeconds": 28,
  "song": null
}
```

| Field | Type | Description |
|-------|------|-------------|
| `correct` | `boolean` | Whether this guess is correct |
| `attemptsUsed` | `number` | Total attempts used so far (including this one) |
| `attemptsRemaining` | `number` | Attempts left before the challenge is locked for this player |
| `maxAttempts` | `number` | Always `6` |
| `timeTakenSeconds` | `number` | Elapsed seconds since the player first loaded the challenge (server-computed) |
| `song` | `SongMatch \| null` | Song metadata; present only if `correct` is `true` or all attempts are exhausted |

When all attempts are exhausted and the final guess is wrong, `correct` is `false`, `attemptsRemaining` is `0`, and `song` is populated with the correct answer so the player can see it.

#### Status Codes

| Code | Condition |
|------|-----------|
| 200 | Guess evaluated; see `correct` field for result |
| 400 | `VALIDATION_ERROR` — `guess` field missing or empty |
| 400 | `GUESS_ALREADY_SUBMITTED` — player has exhausted all attempts |
| 400 | `CHALLENGE_EXPIRED` — challenge is past its expiry date |
| 404 | `CHALLENGE_NOT_FOUND` |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |

---

### GET /api/challenges/:id/result

Retrieve the final result for a completed challenge attempt. This is used to render the result screen and share card after guessing is complete.

**Auth:** `optional`
**Rate limit:** General (100/min)

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | 8-character challenge nanoid |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | `string` | No | Anonymous session ID; used to look up the player's attempt record if unauthenticated |

#### Response — 200 OK

```json
{
  "challengeId": "a3Bx9qTz",
  "completed": true,
  "correct": true,
  "attemptsUsed": 3,
  "maxAttempts": 6,
  "timeTakenSeconds": 45,
  "song": {
    "title": "Blinding Lights",
    "artist": "The Weeknd",
    "spotifyId": "0VjIjW4GlUZAMYd2vXMi3b",
    "albumArt": "https://i.scdn.co/image/ab67616d0000b273...",
    "previewUrl": "https://p.scdn.co/mp3-preview/..."
  },
  "shareText": "I guessed HumDuel in 3 attempts! Can you beat me? humduel.io/challenge/a3Bx9qTz\n🟩🟥🟥",
  "waveformData": [0.12, 0.45, 0.87],
  "creatorAlias": "Alex",
  "completionCount": 6,
  "guessCount": 14
}
```

| Field | Type | Description |
|-------|------|-------------|
| `challengeId` | `string` | Challenge ID |
| `completed` | `boolean` | Whether this player's attempt session is finished (all attempts used or correct) |
| `correct` | `boolean \| null` | Result of the player's session; `null` if `completed` is `false` |
| `attemptsUsed` | `number \| null` | Total attempts used; `null` if `completed` is `false` |
| `maxAttempts` | `number` | Always `6` |
| `timeTakenSeconds` | `number \| null` | Time from first load to completion; `null` if not completed |
| `song` | `SongMatch \| null` | Correct song; present only when `completed` is `true` |
| `shareText` | `string \| null` | Pre-formatted Wordle-style share string; present only when `completed` is `true` |
| `waveformData` | `number[]` | Amplitude array for rendering the share card |
| `creatorAlias` | `string \| null` | Challenge creator display name |
| `completionCount` | `number` | Total players who completed this challenge |
| `guessCount` | `number` | Total guess submissions across all players |

#### Status Codes

| Code | Condition |
|------|-----------|
| 200 | Result returned (check `completed` to determine if attempt is finished) |
| 404 | `CHALLENGE_NOT_FOUND` |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |

---

## Sprint 3 Endpoints

### GET /api/daily

Get today's daily challenge. The daily challenge rotates at midnight UTC. Every player worldwide receives the same challenge for a given UTC date. The answer is never included in the response.

**Auth:** `optional`
**Rate limit:** General (100/min)

#### Response — 200 OK

```json
{
  "date": "2026-04-04",
  "challengeId": "dY2wLkPn",
  "audioUrl": "https://cdn.humduel.io/daily/2026-04-04.webm",
  "waveformData": [0.22, 0.61, 0.79],
  "durationSeconds": 8.0,
  "maxAttempts": 6,
  "playerCount": 4821,
  "completionCount": 3107,
  "alreadyCompleted": false,
  "previousResult": null
}
```

When the authenticated user has already completed today's challenge, `alreadyCompleted` is `true` and `previousResult` is populated:

```json
{
  "date": "2026-04-04",
  "challengeId": "dY2wLkPn",
  "audioUrl": "https://cdn.humduel.io/daily/2026-04-04.webm",
  "waveformData": [0.22, 0.61, 0.79],
  "durationSeconds": 8.0,
  "maxAttempts": 6,
  "playerCount": 4821,
  "completionCount": 3107,
  "alreadyCompleted": true,
  "previousResult": {
    "correct": true,
    "attemptsUsed": 2,
    "timeTakenSeconds": 18,
    "rank": 47
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `date` | `string` | UTC date in `YYYY-MM-DD` format |
| `challengeId` | `string` | Internal reference ID for this daily challenge |
| `audioUrl` | `string` | CDN URL for the daily hum audio |
| `waveformData` | `number[]` | 200-element amplitude array |
| `durationSeconds` | `number` | Audio duration in seconds |
| `maxAttempts` | `number` | Always `6` |
| `playerCount` | `number` | Total unique players who have started today's challenge |
| `completionCount` | `number` | Total players who completed (correct or exhausted) |
| `alreadyCompleted` | `boolean` | `true` if the authenticated user has already finished today (always `false` for anonymous requests) |
| `previousResult` | `object \| null` | The authenticated user's result if `alreadyCompleted` is `true`; otherwise `null` |
| `previousResult.correct` | `boolean` | Whether they guessed correctly |
| `previousResult.attemptsUsed` | `number` | Number of guesses they used |
| `previousResult.timeTakenSeconds` | `number` | Their completion time |
| `previousResult.rank` | `number` | Their leaderboard rank for today |

#### Status Codes

| Code | Condition |
|------|-----------|
| 200 | Daily challenge returned |
| 404 | `DAILY_NOT_FOUND` — no challenge configured for today |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |

---

### POST /api/daily/guess

Submit a guess for today's daily challenge. Authenticated users have their result persisted to the leaderboard. Anonymous users can play but their result is not ranked.

**Auth:** `optional`
**Rate limit:** 10 requests / 60 seconds per IP

#### Request Body

```json
{
  "guess": "Blinding Lights - The Weeknd",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `guess` | `string` | Yes | 1–300 characters | Song guess in `"Title - Artist"` format |
| `sessionId` | `string` | No | UUID v4 | Anonymous session identifier; ignored if authenticated |

#### Response — 200 OK

Identical structure to `POST /api/challenges/:id/guess`, with one additional field:

```json
{
  "correct": true,
  "attemptsUsed": 2,
  "attemptsRemaining": 4,
  "maxAttempts": 6,
  "timeTakenSeconds": 18,
  "song": {
    "title": "Blinding Lights",
    "artist": "The Weeknd",
    "spotifyId": "0VjIjW4GlUZAMYd2vXMi3b",
    "albumArt": "https://i.scdn.co/image/ab67616d0000b273...",
    "previewUrl": "https://p.scdn.co/mp3-preview/..."
  },
  "rank": 47,
  "shareText": "HumDuel 2026-04-04\n🟩🟥 2/6\n⏱ 18s\n#HumDuel humduel.io/daily"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `correct` | `boolean` | Whether this guess is correct |
| `attemptsUsed` | `number` | Total attempts used including this one |
| `attemptsRemaining` | `number` | Attempts remaining |
| `maxAttempts` | `number` | Always `6` |
| `timeTakenSeconds` | `number` | Elapsed time since the player first loaded the daily challenge |
| `song` | `SongMatch \| null` | Song metadata; present when `correct` is `true` or attempts exhausted |
| `rank` | `number \| null` | Leaderboard rank after correct completion; `null` for anonymous users and incomplete attempts |
| `shareText` | `string \| null` | Wordle-style share string; present only on completion |

#### Status Codes

| Code | Condition |
|------|-----------|
| 200 | Guess evaluated |
| 400 | `VALIDATION_ERROR` — `guess` missing or empty |
| 400 | `DAILY_ALREADY_COMPLETED` — authenticated user has exhausted all attempts for today |
| 404 | `DAILY_NOT_FOUND` |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |

---

### GET /api/daily/leaderboard

Get the leaderboard for today's daily challenge. Ranked by: (1) correct first, (2) fewest attempts, (3) fastest time. Only authenticated users appear on the leaderboard.

**Auth:** `optional`
**Rate limit:** General (100/min)

#### Query Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `limit` | `integer` | `20` | `100` | Number of entries to return |
| `page` | `integer` | `1` | — | Page number |

#### Response — 200 OK

```json
{
  "date": "2026-04-04",
  "data": [
    {
      "rank": 1,
      "userId": "usr_7xKp2mQv",
      "displayName": "melodymaven",
      "attemptsUsed": 1,
      "timeTakenSeconds": 9,
      "correct": true,
      "completedAt": "2026-04-04T06:12:03Z"
    },
    {
      "rank": 2,
      "userId": "usr_3nBwL8Rx",
      "displayName": "hummingbird99",
      "attemptsUsed": 1,
      "timeTakenSeconds": 14,
      "correct": true,
      "completedAt": "2026-04-04T07:44:21Z"
    }
  ],
  "total": 3107,
  "page": 1,
  "limit": 20,
  "currentUserRank": 47
}
```

| Field | Type | Description |
|-------|------|-------------|
| `date` | `string` | UTC date this leaderboard corresponds to |
| `data` | `LeaderboardEntry[]` | Ranked entries for the current page |
| `data[].rank` | `number` | Rank position (1-indexed) |
| `data[].userId` | `string` | Opaque user identifier |
| `data[].displayName` | `string` | User's chosen display name |
| `data[].attemptsUsed` | `number` | Number of guesses used |
| `data[].timeTakenSeconds` | `number` | Time from first load to completion |
| `data[].correct` | `boolean` | Whether they guessed correctly |
| `data[].completedAt` | `string` | ISO 8601 UTC timestamp when they completed |
| `total` | `number` | Total number of ranked entries |
| `page` | `number` | Current page |
| `limit` | `number` | Page size |
| `currentUserRank` | `number \| null` | The authenticated user's rank; `null` if not authenticated or not yet completed |

#### Status Codes

| Code | Condition |
|------|-----------|
| 200 | Leaderboard returned |
| 404 | `DAILY_NOT_FOUND` |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |

---

### GET /api/leaderboard/alltime

Get the all-time leaderboard of registered users. Ranked by cumulative score: correct daily completions weighted by speed and attempts across all time. Only users who have opted into public ranking appear.

**Auth:** `optional`
**Rate limit:** General (100/min)

#### Query Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | `integer` | `1` | — | Page number |
| `limit` | `integer` | `20` | `100` | Items per page |

#### Response — 200 OK

```json
{
  "data": [
    {
      "rank": 1,
      "userId": "usr_7xKp2mQv",
      "displayName": "melodymaven",
      "totalScore": 9840,
      "gamesPlayed": 127,
      "correctGuesses": 119,
      "winRate": 0.937,
      "avgAttempts": 1.9,
      "avgTimeTakenSeconds": 22,
      "currentStreak": 41,
      "bestStreak": 41
    }
  ],
  "total": 8204,
  "page": 1,
  "limit": 20,
  "currentUserRank": 312
}
```

| Field | Type | Description |
|-------|------|-------------|
| `data[].rank` | `number` | All-time rank position |
| `data[].userId` | `string` | Opaque user identifier |
| `data[].displayName` | `string` | User's chosen display name |
| `data[].totalScore` | `number` | Cumulative score (proprietary formula; higher is better) |
| `data[].gamesPlayed` | `number` | Total daily challenges attempted |
| `data[].correctGuesses` | `number` | Total daily challenges guessed correctly |
| `data[].winRate` | `number` | Fraction correct; `correctGuesses / gamesPlayed`; `[0.0, 1.0]` |
| `data[].avgAttempts` | `number` | Average attempts per completed challenge |
| `data[].avgTimeTakenSeconds` | `number` | Average completion time in seconds |
| `data[].currentStreak` | `number` | Consecutive daily puzzle completions |
| `data[].bestStreak` | `number` | All-time longest consecutive streak |
| `total` | `number` | Total ranked users |
| `page` | `number` | Current page |
| `limit` | `number` | Page size |
| `currentUserRank` | `number \| null` | Authenticated user's all-time rank; `null` if not authenticated or not ranked |

#### Status Codes

| Code | Condition |
|------|-----------|
| 200 | Leaderboard returned |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |

---

### POST /api/auth/register

Register a new user account with email and password. Email addresses are stored in lowercase. Passwords are hashed with bcrypt (cost factor 12) before storage and are never returned.

**Auth:** `public`
**Rate limit:** 5 requests / 60 seconds per IP

#### Request Body

```json
{
  "email": "player@example.com",
  "password": "hunter2correcthorsebattery",
  "displayName": "melodymaven"
}
```

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `email` | `string` | Yes | Valid email; max 254 characters | User's email address |
| `password` | `string` | Yes | 8–72 characters | Plain-text password (HTTPS only) |
| `displayName` | `string` | Yes | 2–30 characters; alphanumeric, underscores, hyphens | Publicly visible display name |

#### Response — 201 Created

```json
{
  "userId": "usr_7xKp2mQv",
  "email": "player@example.com",
  "displayName": "melodymaven",
  "createdAt": "2026-04-04T12:00:00Z",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `userId` | `string` | Unique user identifier (prefixed with `usr_`) |
| `email` | `string` | Confirmed email address |
| `displayName` | `string` | Chosen display name |
| `createdAt` | `string` | ISO 8601 UTC registration timestamp |
| `token` | `string` | JWT bearer token; valid for 7 days |

#### Status Codes

| Code | Condition |
|------|-----------|
| 201 | Account created; token issued |
| 400 | `VALIDATION_ERROR` — fields missing, malformed, or do not meet constraints |
| 409 | `EMAIL_ALREADY_EXISTS` — email is already registered |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |

---

### POST /api/auth/login

Authenticate an existing user and receive a JWT token.

**Auth:** `public`
**Rate limit:** 10 requests / 60 seconds per IP

#### Request Body

```json
{
  "email": "player@example.com",
  "password": "hunter2correcthorsebattery"
}
```

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `email` | `string` | Yes | Valid email | Registered email address |
| `password` | `string` | Yes | 8–72 characters | Plain-text password |

#### Response — 200 OK

```json
{
  "userId": "usr_7xKp2mQv",
  "email": "player@example.com",
  "displayName": "melodymaven",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-04-11T12:00:00Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `userId` | `string` | Unique user identifier |
| `email` | `string` | Authenticated email address |
| `displayName` | `string` | User's display name |
| `token` | `string` | JWT bearer token; valid for 7 days |
| `expiresAt` | `string` | ISO 8601 UTC token expiry timestamp |

**Security note:** The API returns the same `401 UNAUTHORIZED` response for both an unknown email and a wrong password. This prevents user enumeration.

#### Status Codes

| Code | Condition |
|------|-----------|
| 200 | Credentials valid; token issued |
| 400 | `VALIDATION_ERROR` — fields missing or malformed |
| 401 | `UNAUTHORIZED` — email not found or password incorrect (intentionally generic) |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |

---

### GET /api/users/me/stats

Return stats and profile information for the currently authenticated user. This endpoint always reflects the requesting user's own data.

**Auth:** `required`
**Rate limit:** General (100/min)

#### Response — 200 OK

```json
{
  "userId": "usr_7xKp2mQv",
  "displayName": "melodymaven",
  "email": "player@example.com",
  "createdAt": "2026-04-04T12:00:00Z",
  "stats": {
    "gamesPlayed": 127,
    "correctGuesses": 119,
    "winRate": 0.937,
    "avgAttempts": 1.9,
    "avgTimeTakenSeconds": 22,
    "currentStreak": 41,
    "bestStreak": 41,
    "totalScore": 9840,
    "globalRank": 1,
    "lastPlayedAt": "2026-04-04T07:12:03Z"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `userId` | `string` | Unique user identifier |
| `displayName` | `string` | Public display name |
| `email` | `string` | Registered email address |
| `createdAt` | `string` | ISO 8601 UTC account creation timestamp |
| `stats.gamesPlayed` | `number` | Total daily challenges attempted |
| `stats.correctGuesses` | `number` | Total daily challenges guessed correctly |
| `stats.winRate` | `number` | Fraction correct; `[0.0, 1.0]` |
| `stats.avgAttempts` | `number` | Average guesses per completed challenge |
| `stats.avgTimeTakenSeconds` | `number` | Average seconds to completion |
| `stats.currentStreak` | `number` | Consecutive days with a completed daily challenge |
| `stats.bestStreak` | `number` | All-time longest streak |
| `stats.totalScore` | `number` | Cumulative all-time score |
| `stats.globalRank` | `number \| null` | Current rank on the all-time leaderboard; `null` if not yet ranked |
| `stats.lastPlayedAt` | `string \| null` | ISO 8601 UTC timestamp of most recent daily play; `null` if never played |

#### Status Codes

| Code | Condition |
|------|-----------|
| 200 | Stats returned |
| 401 | `UNAUTHORIZED` — missing or invalid JWT |
| 401 | `TOKEN_EXPIRED` — token has passed its 7-day expiry |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |

---

### GET /api/songs/search

Search the song catalog. Acts as a server-side proxy to the Spotify Search API with in-process caching (SQLite, 24-hour TTL per unique query string). Results include Spotify metadata when available.

**Auth:** `optional`
**Rate limit:** 30 requests / 60 seconds per IP

#### Query Parameters

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| `q` | `string` | Yes | 1–100 characters | Search query (song title, artist, or both) |
| `limit` | `integer` | No | Default `10`, max `20` | Number of results to return |

#### Response — 200 OK

```json
{
  "query": "blinding lights",
  "data": [
    {
      "title": "Blinding Lights",
      "artist": "The Weeknd",
      "spotifyId": "0VjIjW4GlUZAMYd2vXMi3b",
      "albumArt": "https://i.scdn.co/image/ab67616d0000b273...",
      "previewUrl": "https://p.scdn.co/mp3-preview/...",
      "albumName": "After Hours",
      "releaseYear": 2020
    }
  ],
  "total": 1,
  "cached": true,
  "source": "spotify"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `query` | `string` | The normalized query string used for the lookup |
| `data` | `SongResult[]` | Array of matching songs |
| `data[].title` | `string` | Song title |
| `data[].artist` | `string` | Primary artist name |
| `data[].spotifyId` | `string \| null` | Spotify track ID |
| `data[].albumArt` | `string \| null` | URL to album artwork (640x640 JPEG) |
| `data[].previewUrl` | `string \| null` | 30-second MP3 preview URL from Spotify; may be `null` if Spotify does not provide one for this track |
| `data[].albumName` | `string \| null` | Album or release name |
| `data[].releaseYear` | `number \| null` | Four-digit release year |
| `total` | `number` | Total results in the response (not paginated) |
| `cached` | `boolean` | `true` if this response was served from the SQLite cache |
| `source` | `"spotify" \| "local"` | `"local"` if Spotify was unavailable and a fallback catalog was used |

#### Status Codes

| Code | Condition |
|------|-----------|
| 200 | Results returned (may be empty array if no matches) |
| 400 | `VALIDATION_ERROR` — `q` parameter missing or empty |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |
| 503 | `SPOTIFY_UNAVAILABLE` — returned only if Spotify is down and no cache exists for the query |

---

## Status Code Reference

| Code | Usage in this API |
|------|-------------------|
| 200 OK | Successful GET, successful POST guess/login |
| 201 Created | Successful POST creating a new resource (challenge, user) |
| 400 Bad Request | Validation error, business rule violation (expired, already completed) |
| 401 Unauthorized | Missing, invalid, or expired JWT |
| 403 Forbidden | Valid JWT but insufficient permissions |
| 404 Not Found | Resource with the given ID does not exist |
| 409 Conflict | Uniqueness constraint violation (duplicate email) |
| 429 Too Many Requests | Rate limit exceeded |
| 500 Internal Server Error | Unexpected server failure |
| 503 Service Unavailable | Upstream dependency (Spotify) unreachable with no cache fallback |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-04 | Initial specification covering Sprint 1, 2, and 3 endpoints |
