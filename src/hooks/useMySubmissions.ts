import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ChannelSubmission {
  id: string;
  name: string;
  country: string;
  year: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
}

export interface SubmissionStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  progressToContributor: number; // out of 20
}

export function useMySubmissions() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<ChannelSubmission[]>([]);
  const [stats, setStats] = useState<SubmissionStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    progressToContributor: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = useCallback(async () => {
    if (!user) {
      setSubmissions([]);
      setStats({ total: 0, pending: 0, approved: 0, rejected: 0, progressToContributor: 0 });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_channels')
        .select('id, name, country, year, status, created_at, approved_at, approved_by')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching submissions:', error);
        return;
      }

      const typedData = (data || []).map(item => ({
        ...item,
        status: item.status as 'pending' | 'approved' | 'rejected'
      }));

      setSubmissions(typedData);

      const pending = typedData.filter(s => s.status === 'pending').length;
      const approved = typedData.filter(s => s.status === 'approved').length;
      const rejected = typedData.filter(s => s.status === 'rejected').length;

      setStats({
        total: typedData.length,
        pending,
        approved,
        rejected,
        progressToContributor: Math.min(approved, 20)
      });
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return {
    submissions,
    stats,
    loading,
    refetch: fetchSubmissions
  };
}
