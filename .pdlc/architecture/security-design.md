# HumDuel -- Security Architecture Design

**Date:** 2026-04-04
**Author:** security-engineer (Tier 3)
**Status:** Approved for implementation
**Risk Profile:** Low-to-moderate (browser game, no payment processing, optional PII)

---

## 1. Threat Model (STRIDE Analysis)

### 1.1 System Overview

HumDuel has four primary attack surfaces:

1. **Audio upload pipeline** -- user-submitted binary data flows from browser to server to disk
2. **Challenge integrity** -- the correct answer must remain hidden from the guesser
3. **API endpoints** -- public-facing Express routes accepting user input
4. **User authentication** -- JWT-based identity system introduced in Sprint 3

### 1.2 STRIDE per Component

#### Audio Upload (`POST /api/challenges`)

| Threat | Category | Risk | Mitigation |
|--------|----------|------|------------|
| Attacker uploads executable disguised as audio | **Spoofing** | Medium | Validate MIME type against allowlist; verify file magic bytes (not just Content-Type header) |
| Uploaded file is modified in transit | **Tampering** | Low | HTTPS enforced end-to-end; integrity check via file size validation on receipt |
| Attacker uploads malicious oversized file to exhaust disk | **Denial of Service** | Medium | Hard 500KB limit enforced at middleware layer before body parsing completes |
| Attacker uploads non-audio content (polyglot file, HTML) | **Elevation of Privilege** | Low | Serve uploads with `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`; never serve audio files inline from the application domain |

#### Challenge Integrity (`GET /api/challenges/:id`)

| Threat | Category | Risk | Mitigation |
|--------|----------|------|------------|
| Answer leaks in API response to guesser | **Information Disclosure** | High | Response payload for guessers NEVER includes `correctSong` or `correctArtist` fields; answer comparison happens server-side only |
| Attacker inspects network traffic or JS bundle for answer | **Information Disclosure** | High | Answer is never sent to the client before completion; no client-side answer validation |
| Attacker replays correct guess from another session | **Repudiation** | Low | Guess submissions tied to session fingerprint; each challenge tracks unique participants |
| Attacker enumerates challenge IDs to harvest answers | **Information Disclosure** | Low | Challenge IDs use nanoid (8 chars, alphanumeric = 2.8 trillion combinations); rate limiting on challenge lookup |

#### API Endpoints (All Routes)

| Threat | Category | Risk | Mitigation |
|--------|----------|------|------------|
| SQL injection via guess text or challenge fields | **Tampering** | High | All database queries use parameterized statements (prepared queries via better-sqlite3); zero string concatenation in SQL |
| XSS via song guess reflected in response | **Tampering** | Medium | All user input HTML-escaped on output; CSP blocks inline scripts |
| Brute-force guess submission | **Denial of Service** | Medium | Rate limit: 10 guesses/min per IP per challenge; max 6 guesses per challenge enforced server-side |
| DDoS against audio upload endpoint | **Denial of Service** | Medium | Separate stricter rate limit on upload (10 req/min per IP); request body size limit at reverse proxy |
| Mass automated challenge creation | **Denial of Service** | Medium | Rate limit on challenge creation; CAPTCHA consideration for v2 if abuse detected |

#### User Authentication (Sprint 3)

| Threat | Category | Risk | Mitigation |
|--------|----------|------|------------|
| Credential stuffing | **Spoofing** | Medium | Rate limit login attempts (5/min per IP); bcrypt with cost factor 12 |
| JWT token theft via XSS | **Spoofing** | Medium | JWT stored in httpOnly, Secure, SameSite=Strict cookie; never accessible to JavaScript |
| Session fixation | **Spoofing** | Low | New JWT issued on each login; session fingerprinting (UA + partial IP hash) embedded in token claims |
| Password brute-force | **Spoofing** | Medium | bcrypt cost factor 12 (~250ms per hash); account lockout after 10 failed attempts in 15 minutes |

---

## 2. Input Validation

All input validation is applied at the Express middleware layer before reaching business logic. Validation failures return `400 Bad Request` with a generic error message (no internal details leaked).

### 2.1 Audio File Upload

```
Field:          audio file (multipart/form-data)
Max size:       500KB (524,288 bytes)
Allowed MIME:   audio/webm, audio/ogg, audio/wav
Validation:     1. Check Content-Length header < 500KB before accepting body
                2. Validate MIME type from Content-Type header against allowlist
                3. Read first 12 bytes of file buffer and verify magic bytes:
                   - WAV:  52 49 46 46 (RIFF)
                   - OGG:  4F 67 67 53 (OggS)
                   - WebM: 1A 45 DF A3 (EBML)
                4. Reject if magic bytes do not match declared MIME type
                5. Store with randomized filename (nanoid), never preserve original name
                6. Strip all metadata (no ID3 tags, no EXIF-equivalent)
Storage:        /uploads/{nanoid}.{ext} -- served via static file middleware
                with Content-Disposition: attachment and X-Content-Type-Options: nosniff
```

Implementation (multer middleware):
```javascript
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 524_288 },  // 500KB hard limit
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/webm', 'audio/ogg', 'audio/wav'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Invalid audio format'), false);
    }
    cb(null, true);
  }
});
```

### 2.2 Song Guess

```
Field:          songGuess (string)
Max length:     200 characters
Validation:     1. Trim whitespace
                2. Reject if empty or exceeds 200 chars
                3. HTML-encode on output (defense-in-depth, not relied upon for storage)
                4. No regex filtering -- use parameterized queries for DB safety
Storage:        Stored as-is in SQLite via parameterized query
```

### 2.3 Challenge ID

```
Field:          challengeId (URL parameter)
Format:         8-character alphanumeric string (nanoid alphabet: A-Za-z0-9)
Validation:     /^[A-Za-z0-9]{8}$/ -- reject anything that does not match
Rejection:      Return 400 before any database lookup
```

### 2.4 User Registration Fields (Sprint 3)

```
email:          Valid email format (RFC 5322 simplified), max 254 chars
                Normalized to lowercase before storage
displayName:    2-30 chars, alphanumeric + spaces + hyphens only
                /^[A-Za-z0-9 -]{2,30}$/
password:       8-72 chars (bcrypt max input is 72 bytes)
                No complexity rules (length is the primary defense)
                Checked against top 10,000 breached passwords list
```

### 2.5 Parameterized Query Standard

Every database interaction uses prepared statements. This is enforced by linting rules and code review.

```javascript
// CORRECT -- parameterized
db.prepare('SELECT * FROM challenges WHERE id = ?').get(challengeId);

// FORBIDDEN -- string concatenation (caught by eslint-plugin-security)
db.prepare(`SELECT * FROM challenges WHERE id = '${challengeId}'`);
```

**Linting enforcement:** `eslint-plugin-security` with `detect-non-literal-query` rule set to `error`.

---

## 3. Authentication and Authorization (Sprint 3)

### 3.1 JWT Configuration

```
Algorithm:      HS256 (symmetric -- acceptable for single-service architecture)
Secret:         256-bit random value from crypto.randomBytes(32)
                Stored in environment variable JWT_SECRET (never committed)
Expiry:         24 hours (access token)
Storage:        httpOnly cookie
Cookie flags:   httpOnly=true, Secure=true, SameSite=Strict, Path=/api
Refresh:        No refresh tokens for MVP -- user re-authenticates after 24h
```

Token payload (claims):
```json
{
  "sub": "user_id",
  "iat": 1712188800,
  "exp": 1712275200,
  "fp": "sha256(userAgent + ipPrefix)"
}
```

### 3.2 Password Hashing

```
Algorithm:      bcrypt
Cost factor:    12 (approximately 250ms per hash on modern hardware)
Library:        bcryptjs (pure JS, no native dependency issues in deployment)
```

Password flow:
1. Client sends password over HTTPS
2. Server hashes with `bcrypt.hash(password, 12)`
3. Hash stored in `users.password_hash` column
4. Login: `bcrypt.compare(input, stored_hash)` -- constant-time comparison

### 3.3 Session Fingerprinting

Each JWT includes a fingerprint claim (`fp`) derived from:
- User-Agent header (full string)
- First two octets of client IP (e.g., `192.168.*.*` -> `192.168`)

```javascript
const fp = crypto
  .createHash('sha256')
  .update(req.headers['user-agent'] + ipPrefix(req.ip))
  .digest('hex')
  .substring(0, 16);
```

On each authenticated request, the server recomputes the fingerprint and compares it to the JWT claim. Mismatch triggers a `401 Unauthorized` and forces re-authentication. This mitigates token theft from a different device/network.

### 3.4 CORS Configuration

```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://humduel.com',
  credentials: true,       // required for httpOnly cookies
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  maxAge: 86400            // preflight cache: 24 hours
};

app.use(cors(corsOptions));
```

- Production: strict origin whitelist (single domain)
- Development: `http://localhost:5173` added via environment variable
- No wildcard (`*`) origins ever permitted when `credentials: true`

### 3.5 Authorization Model

HumDuel uses a simple two-tier model:

| Role | Capabilities |
|------|-------------|
| **Anonymous** | Create challenges, submit guesses, view leaderboards, play daily challenge |
| **Authenticated** | All anonymous capabilities + persistent stats, streak tracking, all-time leaderboard ranking |

There are no admin endpoints in the MVP. If admin functionality is needed later, it will be a separate service with its own authentication.

---

## 4. API Security

### 4.1 Rate Limiting

Rate limiting is implemented using `express-rate-limit` with an in-memory store (suitable for single-instance SQLite architecture).

| Endpoint Group | Limit | Window | Key | Response |
|---------------|-------|--------|-----|----------|
| General API (`/api/*`) | 100 requests | 1 minute | IP address | 429 Too Many Requests |
| Audio upload (`POST /api/challenges`) | 10 requests | 1 minute | IP address | 429 Too Many Requests |
| Guess submission (`POST /api/challenges/:id/guess`) | 10 requests | 1 minute | IP + challenge ID | 429 Too Many Requests |
| Login (`POST /api/auth/login`) | 5 requests | 1 minute | IP address | 429 Too Many Requests |
| Registration (`POST /api/auth/register`) | 3 requests | 1 minute | IP address | 429 Too Many Requests |

```javascript
import rateLimit from 'express-rate-limit';

const generalLimiter = rateLimit({
  windowMs: 60_000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' }
});

const uploadLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: { error: 'Upload limit reached, please try again later' }
});

app.use('/api', generalLimiter);
app.post('/api/challenges', uploadLimiter);
```

### 4.2 Security Headers (Helmet.js)

```javascript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],  // Tailwind requires inline styles
      imgSrc: ["'self'", "data:", "https://i.scdn.co"],  // Spotify album art
      mediaSrc: ["'self'", "blob:"],  // Web Audio API uses blob URLs
      connectSrc: ["'self'", "https://api.spotify.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,  // needed for cross-origin audio
  hsts: { maxAge: 31536000, includeSubDomains: true }
}));
```

Headers set by Helmet:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 0` (deprecated, CSP is the replacement)
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: <as configured above>`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Permitted-Cross-Domain-Policies: none`

### 4.3 Request Body Limits

```javascript
app.use(express.json({ limit: '16kb' }));   // JSON payloads (guesses, auth)
app.use(express.urlencoded({ extended: false, limit: '16kb' }));
// Audio upload uses multer with its own 500KB limit (see section 2.1)
```

### 4.4 Error Handling

```javascript
// Global error handler -- never leaks stack traces or internal details
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${err.message}`, {
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload too large' });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});
```

---

## 5. Data Protection

### 5.1 PII Handling

| Data Type | Sprint | PII? | Handling |
|-----------|--------|------|----------|
| Audio recordings | 2+ | No (voice is not treated as PII for gameplay) | Auto-deleted after 7 days; no metadata extraction |
| Song guesses | 2+ | No | Stored for gameplay analytics only |
| Anonymous fingerprint | 2+ | No | SHA-256 hash of browser characteristics; not reversible |
| Email address | 3+ | Yes | Stored only with explicit consent; not shared; used for auth only |
| Display name | 3+ | Mild | User-chosen; no real-name requirement |
| Password | 3+ | Yes | Never stored in plaintext; bcrypt hash only |

Privacy principles:
- No data collection before Sprint 3 user accounts (game is fully anonymous)
- No third-party tracking scripts
- No data sold or shared with third parties
- Audio recordings are not analyzed, transcribed, or processed beyond playback

### 5.2 Challenge Answer Protection

This is the single most important security property of the application: **the correct answer must never be accessible to the guesser before they complete the challenge.**

Implementation rules:

1. **Database schema:** The `challenges` table stores `correct_song` and `correct_artist` columns
2. **GET /api/challenges/:id response** must NEVER include `correct_song` or `correct_artist`
3. **POST /api/challenges/:id/guess** receives the guess, compares server-side, and returns only `{ correct: boolean, attempts: number }`
4. **After completion** (correct guess or max attempts reached), the response includes the answer for the results screen
5. **Code review rule:** Any PR that adds `correct_song` or `correct_artist` to a GET response payload triggers mandatory security review

Response schema enforcement:
```javascript
// Serializer for challenge responses -- guesser view
function serializeChallengeForGuesser(challenge) {
  return {
    id: challenge.id,
    audioUrl: `/uploads/${challenge.audio_filename}`,
    waveformData: challenge.waveform_data,
    createdAt: challenge.created_at,
    expiresAt: challenge.expires_at,
    guessCount: challenge.guess_count
    // NOTE: correct_song and correct_artist are intentionally excluded
  };
}
```

### 5.3 Audio File Security

- Files stored on disk with randomized names (nanoid), never original filenames
- Served via Express static middleware with restrictive headers
- No directory listing enabled
- Files auto-deleted after 7 days via scheduled cleanup job
- Audio files are never processed server-side (no FFmpeg, no transcoding) to eliminate media processing vulnerabilities

### 5.4 SQLite Security

- Database file stored outside the web root (never accessible via HTTP)
- WAL mode enabled for concurrent read safety
- `PRAGMA journal_mode=WAL;`
- `PRAGMA foreign_keys=ON;`
- Database file permissions: `0640` (owner read/write, group read, no world access)
- No SQLite extensions loaded (reduces attack surface)

---

## 6. OWASP Top 10 (2021) Checklist

| # | Category | Risk Level | How HumDuel Addresses It |
|---|----------|-----------|--------------------------|
| A01 | **Broken Access Control** | Medium | Challenge answers protected server-side; authorization checks on all authenticated endpoints (Sprint 3); no IDOR -- challenge IDs are unguessable nanoids; rate limiting prevents enumeration |
| A02 | **Cryptographic Failures** | Low | HTTPS enforced via HSTS; passwords hashed with bcrypt (cost 12); JWT secret is 256-bit random; no sensitive data in URL parameters; no custom cryptography |
| A03 | **Injection** | High (mitigated) | All SQL via parameterized prepared statements (better-sqlite3); no eval/exec of user input; HTML output encoding for XSS prevention; CSP blocks inline script execution; eslint-plugin-security in CI |
| A04 | **Insecure Design** | Low | Threat model documented (this document); answer never sent to client; challenge flow designed with security as a constraint; audio files treated as untrusted input |
| A05 | **Security Misconfiguration** | Medium | Helmet.js for security headers; no default credentials; error messages do not leak internals in production; unnecessary HTTP methods disabled; debug mode off in production |
| A06 | **Vulnerable and Outdated Components** | Medium | `npm audit` in CI pipeline (fail build on critical/high); Dependabot or Renovate for automated dependency updates; minimal dependency footprint; lockfile committed |
| A07 | **Identification and Authentication Failures** | Medium | bcrypt password hashing (cost 12); rate-limited login; JWT in httpOnly cookies; session fingerprinting; no credential exposure in logs; breached password check |
| A08 | **Software and Data Integrity Failures** | Low | Lockfile integrity (npm ci, not npm install, in CI); no deserialization of untrusted data; audio files validated by magic bytes, not just Content-Type |
| A09 | **Security Logging and Monitoring Failures** | Medium | All auth events logged (login, failed login, registration); rate limit violations logged; API errors logged with timestamp, path, and IP; structured logging with pino; log output to stdout for aggregation |
| A10 | **Server-Side Request Forgery (SSRF)** | Low | No user-controlled URLs fetched server-side; Spotify API calls use hardcoded base URL; no URL parameter accepted from users that triggers server-side HTTP requests |

---

## 7. Security Implementation by Sprint

### Sprint 1 (Foundation)
- [x] Helmet.js security headers
- [x] CORS configuration
- [x] Express body size limits
- [x] Error handler that does not leak internals
- [x] `npm audit` in CI

### Sprint 2 (Challenge Flow)
- [x] Audio file validation (MIME + magic bytes + size limit)
- [x] Rate limiting (general + upload-specific)
- [x] Input validation middleware (challenge ID, song guess)
- [x] Parameterized queries for all SQL
- [x] Challenge answer exclusion from GET responses
- [x] eslint-plugin-security added to linting

### Sprint 3 (Auth + Community)
- [x] JWT authentication with httpOnly cookies
- [x] bcrypt password hashing (cost factor 12)
- [x] Session fingerprinting
- [x] Login rate limiting (5/min)
- [x] Registration rate limiting (3/min)
- [x] Breached password check
- [x] CORS origin whitelist (production domain)

### Sprint 4 (Hardening + Launch)
- [x] Security headers audit (Observatory, SecurityHeaders.com)
- [x] Dependency audit (no critical/high vulnerabilities)
- [x] CSP report-only testing before enforcement
- [x] HTTPS-only with HSTS preload
- [x] Final penetration test (manual, against staging)
- [x] Security logging verified in production

---

## 8. Security Testing Strategy

### Automated (CI Pipeline)

| Tool | Purpose | Stage | Fail Threshold |
|------|---------|-------|---------------|
| `npm audit` | Dependency vulnerabilities | Build | Critical or High |
| `eslint-plugin-security` | Static analysis for security anti-patterns | Lint | Any error |
| API integration tests | Verify answer is not leaked, rate limits work | Test | Any failure |

### Manual (Pre-Launch)

| Activity | Scope | Timing |
|----------|-------|--------|
| Challenge answer leak test | Verify no API endpoint or client bundle exposes the answer | Sprint 2 completion |
| Auth flow review | JWT handling, cookie flags, session management | Sprint 3 completion |
| Security header scan | Mozilla Observatory, securityheaders.com | Sprint 4 |
| Basic penetration test | SQL injection, XSS, file upload abuse, rate limit bypass | Sprint 4 |

### Test Cases for Challenge Integrity

These tests are mandatory and block release:

```
TEST: GET /api/challenges/:id must not contain correct_song
TEST: GET /api/challenges/:id must not contain correct_artist
TEST: POST /api/challenges/:id/guess returns only { correct, attempts }
TEST: POST /api/challenges/:id/guess with correct answer after max attempts returns 403
TEST: Challenge ID not matching /^[A-Za-z0-9]{8}$/ returns 400
TEST: Audio upload > 500KB returns 413
TEST: Audio upload with image/png MIME returns 400
TEST: Audio upload with audio/wav MIME but PNG magic bytes returns 400
TEST: More than 10 uploads per minute from same IP returns 429
TEST: More than 100 API requests per minute from same IP returns 429
```

---

## 9. Dependency Security Policy

### Allowed Dependencies (Security-Relevant)

| Package | Purpose | Version Policy |
|---------|---------|---------------|
| `helmet` | Security headers | Latest minor |
| `express-rate-limit` | Rate limiting | Latest minor |
| `multer` | File upload handling | Latest minor |
| `better-sqlite3` | SQLite with prepared statements | Latest minor |
| `bcryptjs` | Password hashing | Latest patch |
| `jsonwebtoken` | JWT signing/verification | Latest minor |
| `cors` | CORS configuration | Latest minor |
| `nanoid` | Secure random ID generation | Latest minor |
| `eslint-plugin-security` | Security linting | Latest minor |

### Dependency Rules

1. Run `npm audit` before every merge to main
2. No dependencies with known critical or high vulnerabilities
3. Prefer packages with > 1M weekly downloads and active maintenance
4. Lock all dependency versions via `package-lock.json` (committed to git)
5. Use `npm ci` (not `npm install`) in CI for reproducible builds

---

## 10. Incident Response (Lightweight)

For an MVP browser game, a full incident response plan is disproportionate. The following lightweight process covers the realistic threat scenarios:

### If Challenge Answers Are Leaking
1. Immediately disable the affected endpoint
2. Identify the leak vector (API response, client bundle, network log)
3. Patch and deploy
4. Invalidate affected challenges

### If Audio Upload Is Being Abused
1. Reduce upload rate limit to 1/min
2. Identify abusive IPs from logs
3. Add IP block at reverse proxy level
4. Investigate stored files for malicious content

### If User Credentials Are Compromised (Sprint 3+)
1. Force password reset for affected accounts
2. Invalidate all active JWTs by rotating JWT_SECRET
3. Notify affected users
4. Review access logs for unauthorized activity

### Contact
- Security issues: report via GitHub Security Advisories (private disclosure)
- No bug bounty program for MVP phase

---

## Design Decisions and Tradeoffs

| Decision | Rationale |
|----------|-----------|
| HS256 for JWT (not RS256) | Single service, no token sharing across services; symmetric key is simpler and sufficient |
| In-memory rate limit store (not Redis) | Single instance architecture with SQLite; no Redis dependency needed for MVP |
| No CAPTCHA on upload | Reduces friction for legitimate users; rate limiting is sufficient for MVP traffic levels |
| No WAF | Disproportionate for MVP; Helmet.js + rate limiting + input validation covers the realistic threat profile |
| bcryptjs over native bcrypt | Avoids native compilation issues in CI/deployment; performance difference is negligible at MVP scale |
| 8-char nanoid for challenge IDs | 62^8 = 2.18 trillion combinations; brute-force enumeration is infeasible within rate limits |
| Voice data not treated as PII | Audio recordings are short hums of melodies, not biometric voice prints; no speaker identification performed |
