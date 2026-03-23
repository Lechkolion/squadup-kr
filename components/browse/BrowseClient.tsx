'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { calculateMatchScore, ProfileForMatching, GameRankForMatching } from '@/lib/matching/algorithm';
import { GamerCard } from '@/components/cards/GamerCard';
import { FilterSidebar } from '@/components/browse/FilterSidebar';
import { GamerCardSkeleton } from '@/components/ui/Skeleton';
import { GAMES } from '@/lib/games';
import { SlidersHorizontal } from 'lucide-react';

export interface FiltersState {
  search: string;
  games: string[];
  playStyles: string[];
  languages: string[];
  onlineOnly: boolean;
  sort: 'best_match' | 'recent' | 'online_first';
}

const DEFAULT_FILTERS: FiltersState = {
  search: '',
  games: [],
  playStyles: [],
  languages: [],
  onlineOnly: true,
  sort: 'best_match',
};

const PAGE_SIZE = 20;

export function BrowseClient({ myProfile, myRanks }: { myProfile: any; myRanks: any[] }) {
  const supabase = createClient();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [ranksMap, setRanksMap] = useState<Record<string, any[]>>({});
  const [myRequests, setMyRequests] = useState<Record<string, string>>({});
  const [myConnections, setMyConnections] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [mobileFilters, setMobileFilters] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchProfiles = useCallback(async (reset = false) => {
    const currentPage = reset ? 0 : page;
    setLoading(true);

    let query = supabase
      .from('profiles')
      .select('*, presence(last_heartbeat, current_game)')
      .neq('discord_id', myProfile?.discord_id || '')
      .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

    if (filters.onlineOnly) {
      const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      query = query.eq('is_online', true);
    }

    if (filters.games.length > 0) {
      query = query.overlaps('games', filters.games);
    }

    if (filters.languages.length > 0) {
      query = query.overlaps('languages', [...filters.languages, 'both']);
    }

    if (filters.search) {
      query = query.ilike('username', `%${filters.search}%`);
    }

    if (filters.sort === 'recent') {
      query = query.order('created_at', { ascending: false });
    } else if (filters.sort === 'online_first') {
      query = query.order('is_online', { ascending: false }).order('last_seen', { ascending: false });
    } else {
      query = query.order('last_seen', { ascending: false });
    }

    const { data, error } = await query;

    if (error) { setLoading(false); return; }

    const newProfiles = data || [];
    setHasMore(newProfiles.length === PAGE_SIZE);

    // Fetch ranks for these profiles
    if (newProfiles.length > 0) {
      const ids = newProfiles.map((p: any) => p.id);
      const { data: ranks } = await supabase
        .from('game_ranks')
        .select('*')
        .in('profile_id', ids);

      const rm: Record<string, any[]> = {};
      (ranks || []).forEach((r: any) => {
        if (!rm[r.profile_id]) rm[r.profile_id] = [];
        rm[r.profile_id].push(r);
      });
      setRanksMap(prev => reset ? rm : { ...prev, ...rm });
    }

    setProfiles(prev => reset ? newProfiles : [...prev, ...newProfiles]);
    setPage(reset ? 1 : currentPage + 1);
    setLoading(false);
  }, [filters, page, myProfile]);

  // Fetch my requests
  useEffect(() => {
    if (!myProfile) return;
    const fetchRequests = async () => {
      const { data } = await supabase
        .from('squad_requests')
        .select('to_profile_id, status')
        .eq('from_profile_id', myProfile.id);
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => { map[r.to_profile_id] = r.status; });
      setMyRequests(map);

      const { data: conns } = await supabase
        .from('connections')
        .select('profile_a_id, profile_b_id')
        .or(`profile_a_id.eq.${myProfile.id},profile_b_id.eq.${myProfile.id}`);
      const connSet = new Set<string>();
      (conns || []).forEach((c: any) => {
        connSet.add(c.profile_a_id === myProfile.id ? c.profile_b_id : c.profile_a_id);
      });
      setMyConnections(connSet);
    };
    fetchRequests();
  }, [myProfile]);

  // Initial load
  useEffect(() => {
    fetchProfiles(true);
  }, [filters]);

  // Realtime presence
  useEffect(() => {
    const channel = supabase
      .channel('browse-presence')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presence' }, () => {
        // Refresh online statuses silently
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Infinite scroll
  useEffect(() => {
    if (!loaderRef.current || !hasMore || loading) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) fetchProfiles(false);
    }, { threshold: 0.1 });
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, fetchProfiles]);

  // Sort by match score client-side if needed
  const displayProfiles = filters.sort === 'best_match' && myProfile
    ? [...profiles].sort((a, b) => {
        const scoreA = calculateMatchScore(myProfile as ProfileForMatching, a as ProfileForMatching, myRanks, ranksMap[a.id] || []).score;
        const scoreB = calculateMatchScore(myProfile as ProfileForMatching, b as ProfileForMatching, myRanks, ranksMap[b.id] || []).score;
        return scoreB - scoreA;
      })
    : profiles;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-orbitron font-bold text-2xl text-[var(--text)]">Find Gamers</h1>
          <p className="text-xs text-[var(--text-muted)] font-mono mt-1">게이머 찾기</p>
        </div>
        <button
          className="md:hidden btn btn-secondary text-xs px-4 py-2"
          onClick={() => setMobileFilters(v => !v)}
        >
          <SlidersHorizontal size={14} /> Filters
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className={`${mobileFilters ? 'block' : 'hidden'} md:block w-full md:w-64 lg:w-72 shrink-0`}>
          <FilterSidebar filters={filters} onChange={f => setFilters(f)} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {loading && profiles.length === 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <GamerCardSkeleton key={i} />)}
            </div>
          ) : displayProfiles.length === 0 ? (
            <div className="text-center py-20 text-[var(--text-muted)] font-mono text-sm">
              <div className="text-4xl mb-4">🎮</div>
              <p>No gamers found matching your filters.</p>
              <p className="text-xs mt-2">조건에 맞는 게이머가 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {displayProfiles.map(profile => {
                  const matchResult = myProfile
                    ? calculateMatchScore(
                        myProfile as ProfileForMatching,
                        profile as ProfileForMatching,
                        myRanks,
                        ranksMap[profile.id] || []
                      )
                    : null;

                  return (
                    <GamerCard
                      key={profile.id}
                      profile={profile}
                      ranks={ranksMap[profile.id] || []}
                      matchResult={matchResult}
                      requestStatus={myRequests[profile.id]}
                      isConnected={myConnections.has(profile.id)}
                      myProfileId={myProfile?.id}
                      onRequestSent={(toId, status) => {
                        setMyRequests(prev => ({ ...prev, [toId]: status }));
                      }}
                    />
                  );
                })}
              </div>
              <div ref={loaderRef} className="py-8 flex justify-center">
                {loading && (
                  <div className="font-orbitron text-[var(--cyan)] text-xs animate-pulse">Loading more...</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
