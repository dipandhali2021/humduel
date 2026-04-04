# HumDuel — User Personas & Journey Maps

**Date:** 2026-04-04
**Author:** ux-researcher

---

## Primary Persona: "The Daily Puzzler"

**Name:** Maya, 22
**Occupation:** Marketing coordinator
**Location:** Brooklyn, NY

### Profile
Maya plays Wordle, Connections, and the NYT Mini every morning with coffee. She screenshots her results and posts them to her Instagram stories. She listens to music constantly — at work, commuting, at the gym. Spotify Wrapped is her favorite day of the year.

### Goals
- Quick daily brain exercise (< 5 minutes)
- Shareable results that express her music taste
- Something new to bond over with friends

### Frustrations
- "Heardle was perfect and Spotify killed it"
- Bandle exists but feels sterile — no sharing, no identity
- Too many apps requiring sign-up before you can try

### Tech Comfort
- High. Uses phone for everything. Shares content daily.
- Browser-first is fine — she won't install an app without trying it.

### Daily Routine with HumDuel
1. 8:15 AM — Opens HumDuel from bookmark
2. 8:16 AM — Plays today's daily challenge, listens to the hum
3. 8:17 AM — Guesses in 3 attempts
4. 8:18 AM — Screenshots result, shares to Instagram story
5. 8:19 AM — Checks leaderboard, sees she's top 20%

---

## Secondary Persona: "The Heardle Refugee"

**Name:** Jordan, 28
**Occupation:** Software engineer
**Location:** Austin, TX

### Profile
Jordan played Heardle religiously from launch until Spotify shut it down. Tried Bandle, SongTrivia, and others but nothing stuck — too passive, no social hook. Misses the "6/6" moment. Discovers music through social media and friend recommendations.

### Goals
- A music guessing game that scratches the Heardle itch
- Social features that make it competitive with friends
- Daily habit without heavy time commitment

### Frustrations
- "Every Heardle clone is just listening — I want something interactive"
- Hates mandatory sign-ups
- Annoyed by ad-heavy free games

### Tech Comfort
- Very high. Developer, comfortable with any web tech.
- Values performance and clean UI.

### Engagement Pattern
- Morning ritual: daily challenge
- Sends friend challenges via iMessage/Discord
- Checks leaderboard obsessively on first day, then weekly

---

## Tertiary Persona: "The Friend Challenger"

**Name:** Aisha, 19
**Occupation:** College student
**Location:** London, UK

### Profile
Aisha plays games primarily when friends send them. She discovered Wordle through a TikTok, played it for 3 months, then dropped off. Loves sending friends things that make them say "how did you know that song?!" Music is identity for her — she curates playlists and shares them.

### Goals
- Challenge friends with songs that are "their" songs
- Get reactions ("I can't believe you hummed THAT")
- Express her music knowledge and taste

### Frustrations
- Hates long onboarding
- Won't play if it requires an app download
- Abandons if sharing requires more than 2 taps

### Tech Comfort
- Moderate. Phone-native, browser-comfortable.
- Expects everything to work with one tap/link click.

### Engagement Pattern
- Sporadic but viral — plays in bursts when friends are active
- Creates 3-4 challenges per session, sends each to specific friends
- Returns when she gets a notification/link back

---

## Key User Journeys

### Journey 1: First-Time Visitor → First Challenge

```
Step 1: Lands on humduel.com (via friend's shared link or search)
Step 2: Sees landing page — animated waveform demo, "Hum a song" CTA
Step 3: Taps "Start Humming" — browser shows mic permission prompt
  → If grants: microphone activates, live waveform appears
  → If denies: demo mode activates with pre-recorded hums
Step 4: Hums for 5-15 seconds, sees live waveform feedback
Step 5: Taps "Done" — sees generated waveform card (beautiful, shareable)
Step 6: Types the song name (autocomplete search)
Step 7: Taps "Create Challenge" — gets shareable link
Step 8: Shares link via clipboard/native share to friends
Step 9: (Later) Gets notification that a friend guessed correctly in 2 attempts
```

**Critical moments:**
- Step 3: Mic permission is the biggest drop-off risk. Demo mode is essential.
- Step 5: The waveform card must look beautiful enough to screenshot.
- Step 8: Share must be < 2 taps. Native share sheet preferred.

### Journey 2: Daily Challenge Player

```
Step 1: Opens HumDuel (bookmark or home screen PWA)
Step 2: Daily challenge is front and center — "Today's Challenge"
Step 3: Taps play — listens to today's mystery hum
Step 4: Types a guess — gets feedback (wrong, try again)
Step 5: Guesses correctly on attempt 3 — celebration animation
Step 6: Sees result: "3/6 in 47 seconds" with shareable card
Step 7: Shares result to social (Wordle-style emoji grid)
Step 8: Checks leaderboard — sees rank, friends' times
Step 9: Streak counter increments: "🔥 12 day streak"
```

**Critical moments:**
- Step 2: Daily challenge must load instantly, no navigation needed
- Step 5: Celebration must feel rewarding (animation, sound, confetti)
- Step 7: Share format must be recognizable and compact

### Journey 3: Friend Receives Challenge Link

```
Step 1: Receives link in iMessage/WhatsApp/Discord
Step 2: Taps link — opens in browser, no app install needed
Step 3: Sees challenge page: waveform card + "Can you guess this song?"
Step 4: Taps play — hears the hum
Step 5: Types guess (autocomplete helps)
Step 6: Gets feedback (wrong/right) — up to 6 attempts
Step 7: On correct guess: sees "You guessed it in 4 attempts!"
Step 8: CTA: "Challenge them back" or "Try the daily challenge"
Step 9: Records own hum → creates own challenge → sends back
```

**Critical moments:**
- Step 2: Zero-install, instant load is the entire conversion model
- Step 4: Audio must play reliably across all mobile browsers
- Step 8: The "challenge back" loop is the viral engine

---

## Usability Requirements

### Zero-Friction Onboarding
- No account required for first 5 plays
- Microphone permission is progressive (explain value first, ask second)
- Demo mode available immediately if mic is denied

### Mobile-First Interactions
- All primary actions reachable with one thumb
- Tap targets minimum 44x44px
- No horizontal scrolling on any screen
- Bottom-aligned CTAs for recording and guessing

### Instant Feedback
- Live waveform during recording (no "processing" delay)
- Guess feedback within 200ms
- Share confirmation with haptic feedback on mobile

### Share Flow
- Maximum 2 taps from result to shared
- Clipboard + native share sheet
- Shareable content works on: iMessage, WhatsApp, Twitter, Instagram Stories, Discord, TikTok

### Accessibility
- Screen reader support for all interactive elements
- Keyboard navigation for desktop
- Sufficient color contrast (4.5:1 minimum)
- Audio transcription alternative for hearing-impaired users
