'use client';

import { useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { GAMES, PLAY_STYLES } from '@/lib/games';
import type { FiltersState } from './BrowseClient';
import { cn } from '@/lib/utils';

interface FilterSidebarProps {
  filters: FiltersState;
  onChange: (f: FiltersState) => void;
}

export function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const toggle = useCallback(<K extends keyof FiltersState>(
    key: K,
    value: FiltersState[K] extends (infer T)[] ? T : never
  ) => {
    const arr = filters[key] as string[];
    const next = arr.includes(value as string)
      ? arr.filter(v => v !== value)
      : [...arr, value as string];
    onChange({ ...filters, [key]: next });
  }, [filters, onChange]);

  const handleSearch = (v: string) => {
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      onChange({ ...filters, search: v });
    }, 300);
  };

  const clear = () => onChange({
    search: '',
    games: [],
    playStyles: [],
    languages: [],
    onlineOnly: false,
    sort: 'best_match',
  });

  const hasFilters = filters.games.length || filters.playStyles.length || filters.languages.length || !filters.onlineOnly || filters.search;

  return (
    <div className="card p-4 space-y-6 sticky top-20">
      {/* Search */}
      <div>
        <label className="block text-xs font-orbitron font-semibold text-[var(--text-dim)] tracking-wider uppercase mb-2">
          Search
        </label>
        <input
          className="input"
          placeholder="Username..."
          defaultValue={filters.search}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      {/* Online toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-orbitron font-semibold text-[var(--text-dim)] tracking-wider uppercase">
          Online Only
        </span>
        <button
          onClick={() => onChange({ ...filters, onlineOnly: !filters.onlineOnly })}
          className={cn(
            'relative w-10 h-5 rounded-full transition-colors',
            filters.onlineOnly ? 'bg-[var(--green)]' : 'bg-[var(--surface-3)]'
          )}
          style={{
            boxShadow: filters.onlineOnly ? 'var(--glow-green)' : 'none',
          }}
        >
          <span
            className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
              filters.onlineOnly ? 'left-5' : 'left-0.5'
            )}
          />
        </button>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-xs font-orbitron font-semibold text-[var(--text-dim)] tracking-wider uppercase mb-2">
          Sort By
        </label>
        <div className="space-y-1">
          {[
            { value: 'best_match', label: 'Best Match' },
            { value: 'recent', label: 'Most Recent' },
            { value: 'online_first', label: 'Online First' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...filters, sort: opt.value as FiltersState['sort'] })}
              className={cn(
                'w-full text-left px-3 py-2 rounded text-xs font-mono transition-colors',
                filters.sort === opt.value
                  ? 'bg-[var(--cyan-dim)] text-[var(--cyan)] border border-[var(--border-bright)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Games */}
      <div>
        <label className="block text-xs font-orbitron font-semibold text-[var(--text-dim)] tracking-wider uppercase mb-2">
          Games
        </label>
        <div className="flex flex-wrap gap-1.5">
          {Object.values(GAMES).map(game => (
            <button
              key={game.key}
              onClick={() => toggle('games', game.key)}
              className={cn(
                'tag cursor-pointer transition-all hover:scale-105',
                filters.games.includes(game.key) && 'border-[var(--border-bright)]'
              )}
              style={
                filters.games.includes(game.key)
                  ? { color: game.color, borderColor: `${game.color}60`, background: `${game.color}15` }
                  : undefined
              }
            >
              {game.emoji} {game.name.split(':')[0].split(' ').slice(0, 2).join(' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div>
        <label className="block text-xs font-orbitron font-semibold text-[var(--text-dim)] tracking-wider uppercase mb-2">
          Language
        </label>
        <div className="flex gap-2">
          {[{ key: 'ko', label: '🇰🇷 KO' }, { key: 'en', label: '🇺🇸 EN' }, { key: 'both', label: '🌐 Both' }].map(l => (
            <button
              key={l.key}
              onClick={() => toggle('languages', l.key)}
              className={cn(
                'tag cursor-pointer transition-all',
                filters.languages.includes(l.key) && 'text-[var(--cyan)] border-[var(--border-bright)] bg-[var(--cyan-dim)]'
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Play styles */}
      <div>
        <label className="block text-xs font-orbitron font-semibold text-[var(--text-dim)] tracking-wider uppercase mb-2">
          Play Style
        </label>
        <div className="flex flex-wrap gap-1.5">
          {PLAY_STYLES.map(style => (
            <button
              key={style.key}
              onClick={() => toggle('playStyles', style.key)}
              className={cn(
                'tag cursor-pointer transition-all hover:scale-105',
                filters.playStyles.includes(style.key) && 'text-[var(--purple)] border-purple-400/40 bg-purple-500/10'
              )}
            >
              {style.emoji} {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear */}
      {hasFilters ? (
        <button
          onClick={clear}
          className="btn btn-ghost w-full text-xs"
        >
          <X size={12} /> Clear Filters
        </button>
      ) : null}
    </div>
  );
}
