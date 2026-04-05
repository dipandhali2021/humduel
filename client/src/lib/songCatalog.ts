/**
 * songCatalog.ts
 *
 * A static bundled catalog of ~100 well-known songs used for the local
 * autocomplete/fuzzy search in the guessing form. No network request needed.
 */

export interface CatalogSong {
  title: string;
  artist: string;
}

export const SONG_CATALOG: CatalogSong[] = [
  // Classic Rock & Pop
  { title: 'Bohemian Rhapsody', artist: 'Queen' },
  { title: 'Don\'t Stop Me Now', artist: 'Queen' },
  { title: 'We Will Rock You', artist: 'Queen' },
  { title: 'Hotel California', artist: 'Eagles' },
  { title: 'Stairway to Heaven', artist: 'Led Zeppelin' },
  { title: 'Smells Like Teen Spirit', artist: 'Nirvana' },
  { title: 'Yesterday', artist: 'The Beatles' },
  { title: 'Let It Be', artist: 'The Beatles' },
  { title: 'Hey Jude', artist: 'The Beatles' },
  { title: 'Come Together', artist: 'The Beatles' },
  { title: 'Purple Haze', artist: 'Jimi Hendrix' },
  { title: 'Sweet Home Alabama', artist: 'Lynyrd Skynyrd' },
  { title: 'Born to Run', artist: 'Bruce Springsteen' },
  { title: 'Like a Rolling Stone', artist: 'Bob Dylan' },
  { title: 'Imagine', artist: 'John Lennon' },
  { title: 'Piano Man', artist: 'Billy Joel' },
  { title: 'Uptown Girl', artist: 'Billy Joel' },

  // 80s & 90s Pop / R&B
  { title: 'Billie Jean', artist: 'Michael Jackson' },
  { title: 'Thriller', artist: 'Michael Jackson' },
  { title: 'Beat It', artist: 'Michael Jackson' },
  { title: 'Man in the Mirror', artist: 'Michael Jackson' },
  { title: 'I Will Always Love You', artist: 'Whitney Houston' },
  { title: 'Greatest Love of All', artist: 'Whitney Houston' },
  { title: 'Like a Virgin', artist: 'Madonna' },
  { title: 'Material Girl', artist: 'Madonna' },
  { title: 'Papa Don\'t Preach', artist: 'Madonna' },
  { title: 'Take On Me', artist: 'a-ha' },
  { title: 'Don\'t You (Forget About Me)', artist: 'Simple Minds' },
  { title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses' },
  { title: 'November Rain', artist: 'Guns N\' Roses' },
  { title: 'Under the Bridge', artist: 'Red Hot Chili Peppers' },
  { title: 'Losing My Religion', artist: 'R.E.M.' },
  { title: 'Everybody Hurts', artist: 'R.E.M.' },
  { title: 'No Scrubs', artist: 'TLC' },
  { title: 'Waterfalls', artist: 'TLC' },
  { title: 'I Want It That Way', artist: 'Backstreet Boys' },
  { title: 'Baby One More Time', artist: 'Britney Spears' },

  // 2000s Hits
  { title: 'Crazy in Love', artist: 'Beyoncé' },
  { title: 'Single Ladies', artist: 'Beyoncé' },
  { title: 'Halo', artist: 'Beyoncé' },
  { title: 'Yeah!', artist: 'Usher' },
  { title: 'Confessions Part II', artist: 'Usher' },
  { title: 'In Da Club', artist: '50 Cent' },
  { title: 'Hey Ya!', artist: 'OutKast' },
  { title: 'Lose Yourself', artist: 'Eminem' },
  { title: 'Without Me', artist: 'Eminem' },
  { title: 'Rolling in the Deep', artist: 'Adele' },
  { title: 'Someone Like You', artist: 'Adele' },
  { title: 'Hello', artist: 'Adele' },
  { title: 'Umbrella', artist: 'Rihanna' },
  { title: 'We Found Love', artist: 'Rihanna' },
  { title: 'Diamonds', artist: 'Rihanna' },
  { title: 'Just Dance', artist: 'Lady Gaga' },
  { title: 'Poker Face', artist: 'Lady Gaga' },
  { title: 'Bad Romance', artist: 'Lady Gaga' },
  { title: 'Love Story', artist: 'Taylor Swift' },
  { title: 'You Belong with Me', artist: 'Taylor Swift' },

  // 2010s Modern Hits
  { title: 'Shape of You', artist: 'Ed Sheeran' },
  { title: 'Thinking Out Loud', artist: 'Ed Sheeran' },
  { title: 'Perfect', artist: 'Ed Sheeran' },
  { title: 'Photograph', artist: 'Ed Sheeran' },
  { title: 'Shake It Off', artist: 'Taylor Swift' },
  { title: 'Blank Space', artist: 'Taylor Swift' },
  { title: 'Anti-Hero', artist: 'Taylor Swift' },
  { title: 'Bad Guy', artist: 'Billie Eilish' },
  { title: 'Happier Than Ever', artist: 'Billie Eilish' },
  { title: 'Ocean Eyes', artist: 'Billie Eilish' },
  { title: 'Blinding Lights', artist: 'The Weeknd' },
  { title: 'Starboy', artist: 'The Weeknd' },
  { title: 'Save Your Tears', artist: 'The Weeknd' },
  { title: 'Can\'t Feel My Face', artist: 'The Weeknd' },
  { title: 'God\'s Plan', artist: 'Drake' },
  { title: 'Hotline Bling', artist: 'Drake' },
  { title: 'One Dance', artist: 'Drake' },
  { title: 'HUMBLE.', artist: 'Kendrick Lamar' },
  { title: 'All the Stars', artist: 'Kendrick Lamar' },
  { title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars' },
  { title: 'That\'s What I Like', artist: 'Bruno Mars' },
  { title: '24K Magic', artist: 'Bruno Mars' },
  { title: 'Locked Out of Heaven', artist: 'Bruno Mars' },
  { title: 'Happy', artist: 'Pharrell Williams' },
  { title: 'Get Lucky', artist: 'Daft Punk ft. Pharrell Williams' },
  { title: 'Somebody That I Used to Know', artist: 'Gotye ft. Kimbra' },
  { title: 'Call Me Maybe', artist: 'Carly Rae Jepsen' },
  { title: 'Stay', artist: 'Rihanna ft. Mikky Ekko' },

  // 2020s Hits
  { title: 'Levitating', artist: 'Dua Lipa' },
  { title: 'Don\'t Start Now', artist: 'Dua Lipa' },
  { title: 'Physical', artist: 'Dua Lipa' },
  { title: 'drivers license', artist: 'Olivia Rodrigo' },
  { title: 'good 4 u', artist: 'Olivia Rodrigo' },
  { title: 'brutal', artist: 'Olivia Rodrigo' },
  { title: 'Industry Baby', artist: 'Lil Nas X ft. Jack Harlow' },
  { title: 'Montero (Call Me By Your Name)', artist: 'Lil Nas X' },
  { title: 'As It Was', artist: 'Harry Styles' },
  { title: 'Watermelon Sugar', artist: 'Harry Styles' },
  { title: 'Heat Waves', artist: 'Glass Animals' },
  { title: 'Stay', artist: 'The Kid LAROI & Justin Bieber' },
  { title: 'Peaches', artist: 'Justin Bieber ft. Daniel Caesar & Giveon' },
  { title: 'Easy On Me', artist: 'Adele' },
  { title: 'abcdefu', artist: 'GAYLE' },

  // Country
  { title: 'Jolene', artist: 'Dolly Parton' },
  { title: 'Friends in Low Places', artist: 'Garth Brooks' },
  { title: 'Humble and Kind', artist: 'Tim McGraw' },
  { title: 'Old Town Road', artist: 'Lil Nas X ft. Billy Ray Cyrus' },
  { title: 'Body Like a Back Road', artist: 'Sam Hunt' },
];

/**
 * Search the local song catalog with a case-insensitive partial match
 * on either title or artist. Returns up to 8 results.
 *
 * @param query - The user's search string.
 * @returns     - Array of up to 8 matching CatalogSong objects.
 */
export function searchSongs(query: string): CatalogSong[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const lower = trimmed.toLowerCase();

  return SONG_CATALOG.filter(
    (song) =>
      song.title.toLowerCase().includes(lower) ||
      song.artist.toLowerCase().includes(lower),
  ).slice(0, 8);
}
