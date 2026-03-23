'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { type GameKey } from '@/lib/games';

export interface GameRankEntry {
  rank: string;
  hours: string;
}

export interface ProfileFormData {
  username: string;
  bio: string;
  region: string;
  languages: string[];
  selectedGames: string[];
  gameRanks: Record<string, GameRankEntry>;
  playStyles: string[];
  activeHoursStart: number;
  activeHoursEnd: number;
  showOnlineStatus: boolean;
  allowRequests: boolean;
}

const DEFAULT_FORM_DATA: ProfileFormData = {
  username: '',
  bio: '',
  region: 'Korea',
  languages: ['ko'],
  selectedGames: [],
  gameRanks: {},
  playStyles: [],
  activeHoursStart: 20,
  activeHoursEnd: 2,
  showOnlineStatus: true,
  allowRequests: true,
};

export function useProfileForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ProfileFormData>(DEFAULT_FORM_DATA);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const supabase = createClient();

  // Load existing profile on mount
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          id, username, bio, region, languages,
          games, play_styles, active_hours_start, active_hours_end,
          show_online_status,
          game_ranks (game_key, rank_label, hours_played)
        `)
        .eq('discord_id', user.id)
        .single();

      if (profile) {
        setProfileId(profile.id);

        const gameRanks: Record<string, GameRankEntry> = {};
        if (profile.game_ranks && Array.isArray(profile.game_ranks)) {
          for (const gr of profile.game_ranks as Array<{ game_key: string; rank_label: string | null; hours_played: number | null }>) {
            gameRanks[gr.game_key] = {
              rank: gr.rank_label ?? '',
              hours: gr.hours_played != null ? String(gr.hours_played) : '',
            };
          }
        }

        setFormData({
          username: profile.username ?? '',
          bio: profile.bio ?? '',
          region: profile.region ?? 'Korea',
          languages: profile.languages ?? ['ko'],
          selectedGames: profile.games ?? [],
          gameRanks,
          playStyles: profile.play_styles ?? [],
          activeHoursStart: profile.active_hours_start ?? 20,
          activeHoursEnd: profile.active_hours_end ?? 2,
          showOnlineStatus: profile.show_online_status ?? true,
          allowRequests: true,
        });
      }
    }

    loadProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = useCallback(<K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleGame = useCallback((gameKey: string) => {
    setFormData((prev) => {
      const already = prev.selectedGames.includes(gameKey);
      return {
        ...prev,
        selectedGames: already
          ? prev.selectedGames.filter((g) => g !== gameKey)
          : [...prev.selectedGames, gameKey],
      };
    });
  }, []);

  const updateGameRank = useCallback((gameKey: string, rank: string) => {
    setFormData((prev) => ({
      ...prev,
      gameRanks: {
        ...prev.gameRanks,
        [gameKey]: { ...(prev.gameRanks[gameKey] ?? { hours: '' }), rank },
      },
    }));
  }, []);

  const updateHoursPlayed = useCallback((gameKey: string, hours: string) => {
    setFormData((prev) => ({
      ...prev,
      gameRanks: {
        ...prev.gameRanks,
        [gameKey]: { ...(prev.gameRanks[gameKey] ?? { rank: '' }), hours },
      },
    }));
  }, []);

  const togglePlayStyle = useCallback((styleKey: string) => {
    setFormData((prev) => {
      const active = prev.playStyles.includes(styleKey);
      return {
        ...prev,
        playStyles: active
          ? prev.playStyles.filter((s) => s !== styleKey)
          : [...prev.playStyles, styleKey],
      };
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('로그인이 필요합니다.');
        setSaving(false);
        return;
      }

      const profilePayload = {
        discord_id: user.id,
        username: formData.username.trim(),
        bio: formData.bio.trim() || null,
        region: formData.region,
        languages: formData.languages,
        games: formData.selectedGames,
        play_styles: formData.playStyles,
        active_hours_start: formData.activeHoursStart,
        active_hours_end: formData.activeHoursEnd,
        show_online_status: formData.showOnlineStatus,
        profile_complete: formData.username.trim().length > 0 && formData.selectedGames.length > 0,
        updated_at: new Date().toISOString(),
      };

      const { data: upserted, error: profileError } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'discord_id' })
        .select('id')
        .single();

      if (profileError) throw profileError;

      const currentProfileId = upserted?.id ?? profileId;

      // Upsert game_ranks
      if (currentProfileId && formData.selectedGames.length > 0) {
        const rankRows = formData.selectedGames.map((gameKey) => {
          const entry = formData.gameRanks[gameKey];
          return {
            profile_id: currentProfileId,
            game_key: gameKey,
            rank_label: entry?.rank || null,
            hours_played: entry?.hours ? parseInt(entry.hours, 10) : null,
          };
        });

        const { error: rankError } = await supabase
          .from('game_ranks')
          .upsert(rankRows, { onConflict: 'profile_id,game_key' });

        if (rankError) throw rankError;

        // Delete removed game ranks
        const { error: deleteError } = await supabase
          .from('game_ranks')
          .delete()
          .eq('profile_id', currentProfileId)
          .not('game_key', 'in', `(${formData.selectedGames.join(',')})`);

        // Non-critical, ignore delete errors silently
        void deleteError;
      }

      toast.success('프로필이 저장되었습니다! ✓', {
        style: {
          background: 'var(--surface)',
          color: 'var(--green)',
          border: '1px solid rgba(57,255,20,0.3)',
          fontFamily: 'Space Mono, monospace',
          fontSize: '0.8rem',
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '저장에 실패했습니다.';
      toast.error(message, {
        style: {
          background: 'var(--surface)',
          color: 'var(--pink)',
          border: '1px solid rgba(255,45,120,0.3)',
          fontFamily: 'Space Mono, monospace',
          fontSize: '0.8rem',
        },
      });
    } finally {
      setSaving(false);
    }
  }, [formData, profileId, supabase]);

  return {
    step,
    formData,
    saving,
    setStep,
    updateField,
    toggleGame,
    updateGameRank,
    updateHoursPlayed,
    togglePlayStyle,
    handleSave,
  };
}

/* ─── Profile Completion Bar ─── */

interface ProfileCompletionProps {
  profile: {
    username?: string | null;
    bio?: string | null;
    games?: string[];
    play_styles?: string[];
    languages?: string[];
    show_online_status?: boolean;
    discord_server_joined?: boolean;
  };
}

const COMPLETION_ITEMS: Array<{ key: string; label: string; weight: number; check: (p: ProfileCompletionProps['profile']) => boolean }> = [
  { key: 'username', label: 'Username set', weight: 20, check: (p) => !!p.username && p.username.trim().length > 0 },
  { key: 'bio', label: 'Bio added', weight: 15, check: (p) => !!p.bio && p.bio.trim().length > 0 },
  { key: 'games', label: 'Games selected', weight: 25, check: (p) => !!p.games && p.games.length > 0 },
  { key: 'play_styles', label: 'Play styles', weight: 20, check: (p) => !!p.play_styles && p.play_styles.length > 0 },
  { key: 'languages', label: 'Languages', weight: 10, check: (p) => !!p.languages && p.languages.length > 0 },
  { key: 'discord', label: 'Discord joined', weight: 10, check: (p) => !!p.discord_server_joined },
];

export function ProfileCompletionBar({ profile }: ProfileCompletionProps) {
  const totalWeight = COMPLETION_ITEMS.reduce((sum, item) => sum + item.weight, 0);
  const earnedWeight = COMPLETION_ITEMS
    .filter((item) => item.check(profile))
    .reduce((sum, item) => sum + item.weight, 0);
  const pct = Math.round((earnedWeight / totalWeight) * 100);

  const color =
    pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--cyan)' : 'var(--amber)';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span
          className="text-xs font-orbitron font-bold tracking-wider"
          style={{ color: 'var(--text-dim)' }}
        >
          PROFILE COMPLETE
        </span>
        <span
          className="text-sm font-orbitron font-bold"
          style={{ color }}
        >
          {pct}%
        </span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}, ${color}bb)`,
          }}
        />
      </div>
      <div className="flex flex-wrap gap-1.5 mt-1">
        {COMPLETION_ITEMS.map((item) => {
          const done = item.check(profile);
          return (
            <span
              key={item.key}
              className="tag text-[9px]"
              style={
                done
                  ? { color: 'var(--green)', borderColor: 'rgba(57,255,20,0.3)', background: 'rgba(57,255,20,0.08)' }
                  : { color: 'var(--text-muted)' }
              }
            >
              {done ? '✓' : '·'} {item.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
