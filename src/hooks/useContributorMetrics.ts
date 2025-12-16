import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ContributorMetrics {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_suggestions: number;
  approved_suggestions: number;
  total_comments: number;
  total_interactions: number;
  engagement_score: number;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  user_email: string;
  current_streak: number;
  longest_streak: number;
  total_suggestions: number;
  approved_suggestions: number;
  engagement_score: number;
  last_activity_date: string | null;
}

export function useContributorMetrics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<ContributorMetrics | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMyMetrics = useCallback(async () => {
    if (!user) {
      setMetrics(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('contributor_metrics')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching metrics:', error);
        return;
      }

      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      // Fetch all contributor metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('contributor_metrics')
        .select('*')
        .order('engagement_score', { ascending: false });

      if (metricsError) {
        console.error('Error fetching leaderboard:', metricsError);
        return;
      }

      if (!metricsData || metricsData.length === 0) {
        setLeaderboard([]);
        return;
      }

      // Fetch user profiles for names
      const userIds = metricsData.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      // Only include users who have the contributor role
      const { data: contributorRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'contributor');

      const contributorUserIds = new Set(contributorRoles?.map(r => r.user_id) || []);

      const entries: LeaderboardEntry[] = metricsData
        .filter(m => contributorUserIds.has(m.user_id))
        .map((m, idx) => {
          const profile = profiles?.find(p => p.id === m.user_id);
          return {
            rank: idx + 1,
            user_id: m.user_id,
            user_name: profile?.full_name || 'Unknown',
            user_email: profile?.email || '',
            current_streak: m.current_streak,
            longest_streak: m.longest_streak,
            total_suggestions: m.total_suggestions,
            approved_suggestions: m.approved_suggestions,
            engagement_score: m.engagement_score,
            last_activity_date: m.last_activity_date
          };
        });

      setLeaderboard(entries);

      // Find current user's rank
      if (user) {
        const userEntry = entries.find(e => e.user_id === user.id);
        setUserRank(userEntry?.rank || null);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchMyMetrics();
  }, [fetchMyMetrics]);

  return {
    metrics,
    leaderboard,
    userRank,
    loading,
    refetch: fetchMyMetrics,
    fetchLeaderboard
  };
}
