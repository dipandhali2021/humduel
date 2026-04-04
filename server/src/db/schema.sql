CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  creator_name TEXT NOT NULL DEFAULT 'Anonymous',
  audio_filename TEXT NOT NULL,
  waveform_data TEXT NOT NULL,
  song_title TEXT NOT NULL,
  song_artist TEXT NOT NULL,
  song_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS guesses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challenge_id TEXT NOT NULL REFERENCES challenges(id),
  guesser_name TEXT DEFAULT 'Anonymous',
  song_title TEXT NOT NULL,
  song_artist TEXT NOT NULL,
  correct INTEGER NOT NULL DEFAULT 0,
  attempt_number INTEGER NOT NULL,
  time_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  puzzle_number INTEGER NOT NULL,
  audio_filename TEXT NOT NULL,
  waveform_data TEXT NOT NULL,
  song_title TEXT NOT NULL,
  song_artist TEXT NOT NULL,
  song_id TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
