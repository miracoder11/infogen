import { useState, useMemo, useCallback } from 'react';
import './SearchBar.css';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

// Simple debounce implementation
function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

export function SearchBar({ onSearch, placeholder = 'Search traces...' }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const debouncedSearch = useMemo(
    () => debounce((q: string) => onSearch(q), 300),
    [onSearch]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
  }, [onSearch]);

  return (
    <div className="search-bar">
      <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        className="search-input"
      />
      {query && (
        <button className="clear-button" onClick={handleClear} aria-label="Clear search">
          ×
        </button>
      )}
    </div>
  );
}
