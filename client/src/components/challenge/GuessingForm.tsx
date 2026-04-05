import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { Button } from '@/components/ui/Button';
import { searchSongs } from '@/lib/songCatalog';
import type { CatalogSong } from '@/lib/songCatalog';
import type { GuessResponse } from '@/types';

// ---------------------------------------------------------------------------
// Icons — inline SVGs, zero external dependencies
// ---------------------------------------------------------------------------

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface GuessingFormProps {
  onSubmit: (guess: string) => void;
  disabled: boolean;
  attemptsRemaining: number;
  maxAttempts: number;
  previousGuesses: GuessResponse[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GuessingForm({
  onSubmit,
  disabled,
  attemptsRemaining,
  maxAttempts,
  previousGuesses,
}: GuessingFormProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<CatalogSong[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const attemptsUsed = maxAttempts - attemptsRemaining;

  // ---------------------------------------------------------------------------
  // Debounced search
  // ---------------------------------------------------------------------------

  const triggerSearch = useCallback((query: string) => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      const results = searchSongs(query);
      setSuggestions(results);
      setIsDropdownOpen(results.length > 0 && query.trim().length > 0);
      setActiveIndex(-1);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setInputValue(value);
    triggerSearch(value);
  }

  function handleSelectSuggestion(song: CatalogSong) {
    const label = `${song.title} — ${song.artist}`;
    setInputValue(label);
    setIsDropdownOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setInputValue('');
    setSuggestions([]);
    setIsDropdownOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isDropdownOpen) {
      if (e.key === 'Enter') handleSubmit();
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          const song = suggestions[activeIndex];
          if (song) handleSelectSuggestion(song);
        } else {
          handleSubmit();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        setActiveIndex(-1);
        break;
    }
  }

  const isSubmitDisabled = disabled || inputValue.trim().length === 0;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4">
      {/* Attempt counter */}
      <div className="flex items-center justify-between">
        <span className="font-label text-sm text-on-surface-muted">
          {attemptsRemaining === 0
            ? 'All attempts used'
            : `Attempt ${attemptsUsed + 1} of ${maxAttempts}`}
        </span>
        {/* Dots showing used/remaining */}
        <div className="flex items-center gap-1" aria-hidden="true">
          {Array.from({ length: maxAttempts }).map((_, i) => (
            <span
              key={i}
              className={[
                'w-2 h-2 rounded-full transition-colors duration-200',
                i < attemptsUsed
                  ? 'bg-error'
                  : i === attemptsUsed && !disabled
                  ? 'bg-primary'
                  : 'bg-surface-hover',
              ].join(' ')}
            />
          ))}
        </div>
      </div>

      {/* Search input + autocomplete */}
      <form onSubmit={handleSubmit} noValidate>
        <div ref={containerRef} className="relative">
          {/* Input row */}
          <div
            className={[
              'flex items-center gap-2 px-3 py-3 rounded-xl',
              'bg-surface-elevated border',
              isDropdownOpen
                ? 'border-primary/60 ring-1 ring-primary/30'
                : 'border-surface-hover',
              'transition-all duration-150',
              disabled ? 'opacity-50' : '',
            ].join(' ')}
          >
            <span className="text-on-surface-muted flex-shrink-0">
              <SearchIcon />
            </span>
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={isDropdownOpen}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={
                activeIndex >= 0 ? `${listboxId}-item-${activeIndex}` : undefined
              }
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0 && inputValue.trim().length > 0) {
                  setIsDropdownOpen(true);
                }
              }}
              disabled={disabled}
              placeholder="Search for a song..."
              className={[
                'flex-1 min-w-0 bg-transparent outline-none',
                'font-body text-base text-on-surface',
                'placeholder:text-on-surface-muted',
              ].join(' ')}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {/* Dropdown suggestions */}
          {isDropdownOpen && suggestions.length > 0 && (
            <ul
              id={listboxId}
              role="listbox"
              aria-label="Song suggestions"
              className={[
                'absolute left-0 right-0 top-full mt-1 z-50',
                'bg-surface-elevated border border-surface-hover rounded-xl',
                'shadow-lg overflow-hidden',
                'divide-y divide-surface-hover/50',
              ].join(' ')}
            >
              {suggestions.map((song, index) => (
                <li
                  key={`${song.title}-${song.artist}`}
                  id={`${listboxId}-item-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  onPointerDown={(e) => {
                    // Prevent blur on input before click fires
                    e.preventDefault();
                    handleSelectSuggestion(song);
                  }}
                  className={[
                    'flex flex-col px-4 py-3 cursor-pointer',
                    'transition-colors duration-100',
                    index === activeIndex
                      ? 'bg-primary/20 text-white'
                      : 'hover:bg-surface-hover',
                  ].join(' ')}
                >
                  <span className="font-label text-sm font-medium text-on-surface leading-tight">
                    {song.title}
                  </span>
                  <span className="font-body text-xs text-on-surface-muted leading-tight mt-0.5">
                    {song.artist}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Guess button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitDisabled}
          className="w-full mt-3"
        >
          Guess
        </Button>
      </form>

      {/* Previous guesses list */}
      {previousGuesses.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h3 className="font-label text-xs font-semibold text-on-surface-muted uppercase tracking-wide">
            Previous Guesses
          </h3>
          <ul className="flex flex-col gap-1.5" role="list">
            {previousGuesses.map((guess, index) => (
              <li
                key={index}
                className={[
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                  'border',
                  guess.correct
                    ? 'bg-success/10 border-success/30'
                    : 'bg-error/10 border-error/20',
                ].join(' ')}
              >
                {/* Status icon */}
                <span
                  className={[
                    'flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center',
                    guess.correct ? 'bg-success text-white' : 'bg-error text-white',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  {guess.correct ? <CheckIcon /> : <CrossIcon />}
                </span>

                {/* Guess text */}
                <div className="flex-1 min-w-0">
                  <span className="font-label text-sm text-on-surface leading-tight block truncate">
                    {guess.song
                      ? `${guess.song.title} — ${guess.song.artist}`
                      : `Guess ${index + 1}`}
                  </span>
                </div>

                {/* Attempt number badge */}
                <span className="font-label text-xs text-on-surface-muted flex-shrink-0">
                  #{index + 1}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default GuessingForm;
