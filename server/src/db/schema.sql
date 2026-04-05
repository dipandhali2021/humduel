CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  creator_name TEXT NOT NULL DEFAULT 'Anonymous',
  audio_filename TEXT NOT NULL,
  waveform_data TEXT NOT NULL,
  song_title TEXT NOT NULL,
  song_artist TEXT NOT NULL,
  song_id TEXT,
  duration_seconds REAL NOT NULL DEFAULT 0,
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
  session_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  puzzle_number INTEGER NOT NULL,
  song_title TEXT NOT NULL,
  song_artist TEXT NOT NULL,
  song_id TEXT,
  spotify_preview_url TEXT,
  spotify_album_art TEXT
);

CREATE TABLE IF NOT EXISTS daily_guesses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT NOT NULL,
  guess_text TEXT NOT NULL,
  correct INTEGER NOT NULL DEFAULT 0,
  attempt_number INTEGER NOT NULL,
  time_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nickname TEXT UNIQUE NOT NULL,
  avatar TEXT DEFAULT 'default',
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_played_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_guesses_session ON guesses(challenge_id, session_id);
CREATE INDEX IF NOT EXISTS idx_daily_guesses_date ON daily_guesses(date, session_id);
CREATE INDEX IF NOT EXISTS idx_daily_guesses_user ON daily_guesses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(date);
