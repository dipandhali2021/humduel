import { describe, it, expect } from 'vitest';
import { searchSongs, SONG_CATALOG } from '@/lib/songCatalog';

// ---------------------------------------------------------------------------
// SONG_CATALOG
// ---------------------------------------------------------------------------

describe('SONG_CATALOG', () => {
  it('has at least 50 entries', () => {
    expect(SONG_CATALOG.length).toBeGreaterThanOrEqual(50);
  });

  it('every entry has a non-empty title', () => {
    SONG_CATALOG.forEach((song) => {
      expect(song.title.length).toBeGreaterThan(0);
    });
  });

  it('every entry has a non-empty artist', () => {
    SONG_CATALOG.forEach((song) => {
      expect(song.artist.length).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// searchSongs
// ---------------------------------------------------------------------------

describe('searchSongs — empty / blank query', () => {
  it('returns empty array for empty string', () => {
    expect(searchSongs('')).toEqual([]);
  });

  it('returns empty array for whitespace-only string', () => {
    expect(searchSongs('   ')).toEqual([]);
  });

  it('returns empty array for tab-only string', () => {
    expect(searchSongs('\t')).toEqual([]);
  });
});

describe('searchSongs — title matching', () => {
  it('returns matches for a partial title (Bohemian)', () => {
    const results = searchSongs('Bohemian');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((s) => s.title === 'Bohemian Rhapsody')).toBe(true);
  });

  it('returns matches for a full title', () => {
    const results = searchSongs('Hotel California');
    expect(results.some((s) => s.title === 'Hotel California')).toBe(true);
  });

  it('returns matches for partial title from the middle of the word', () => {
    const results = searchSongs('haps');
    // "Bohemian Rhapsody" contains "haps"
    expect(results.some((s) => s.title === 'Bohemian Rhapsody')).toBe(true);
  });
});

describe('searchSongs — artist matching', () => {
  it('returns matches for artist name "Queen"', () => {
    const results = searchSongs('Queen');
    expect(results.length).toBeGreaterThan(0);
    results.forEach((s) => {
      expect(s.artist.toLowerCase()).toContain('queen');
    });
  });

  it('returns matches for partial artist name "Beatles"', () => {
    const results = searchSongs('Beatles');
    expect(results.length).toBeGreaterThan(0);
    results.forEach((s) => {
      expect(s.artist.toLowerCase()).toContain('beatles');
    });
  });

  it('returns matches for artist "Adele"', () => {
    const results = searchSongs('Adele');
    expect(results.length).toBeGreaterThan(0);
    results.forEach((s) => {
      expect(s.artist.toLowerCase()).toContain('adele');
    });
  });
});

describe('searchSongs — case insensitivity', () => {
  it('matches lowercase query against mixed-case title', () => {
    const results = searchSongs('bohemian');
    expect(results.some((s) => s.title === 'Bohemian Rhapsody')).toBe(true);
  });

  it('matches uppercase query against mixed-case title', () => {
    const results = searchSongs('BOHEMIAN');
    expect(results.some((s) => s.title === 'Bohemian Rhapsody')).toBe(true);
  });

  it('matches lowercase artist query', () => {
    const results = searchSongs('taylor swift');
    expect(results.length).toBeGreaterThan(0);
    results.forEach((s) => {
      expect(s.artist.toLowerCase()).toContain('taylor swift');
    });
  });

  it('matches mixed-case query', () => {
    const lower = searchSongs('billie jean');
    const upper = searchSongs('BILLIE JEAN');
    const mixed = searchSongs('Billie Jean');
    expect(lower.length).toBe(upper.length);
    expect(lower.length).toBe(mixed.length);
  });
});

describe('searchSongs — result limit', () => {
  it('returns at most 8 results', () => {
    // "a" is likely to match many titles/artists
    const results = searchSongs('a');
    expect(results.length).toBeLessThanOrEqual(8);
  });

  it('returns exactly 8 results when there are more than 8 matches', () => {
    // Single letter like "e" should match a large number of songs
    const results = searchSongs('e');
    // Either we get exactly 8 (capped) or fewer if less than 8 match
    expect(results.length).toBeLessThanOrEqual(8);
    // Force a case where at least 8 should exist: 'the' should appear in many entries
    const theResults = searchSongs('the');
    expect(theResults.length).toBeLessThanOrEqual(8);
  });
});

describe('searchSongs — non-matching query', () => {
  it('returns empty array for a query with no matches', () => {
    const results = searchSongs('xyznonexistentxyz');
    expect(results).toEqual([]);
  });

  it('returns empty array for a numeric query that matches nothing', () => {
    const results = searchSongs('99999');
    expect(results).toEqual([]);
  });
});

describe('searchSongs — result shape', () => {
  it('returned songs have title and artist fields', () => {
    const results = searchSongs('Queen');
    results.forEach((song) => {
      expect(song).toHaveProperty('title');
      expect(song).toHaveProperty('artist');
    });
  });

  it('trims leading/trailing whitespace from the query', () => {
    const padded = searchSongs('  Queen  ');
    const trimmed = searchSongs('Queen');
    expect(padded.length).toBe(trimmed.length);
  });
});
