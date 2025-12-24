import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AnalysisReport {
  id: string;
  channel_id: string;
  channel_name: string;
  country: string;
  analyzed_by: string;
  analyzed_at: string;
  submitted_category: string | null;
  submitted_platform: string | null;
  submitted_content_type: string | null;
  cross_platform_audience: number | null;
  deduplicated_audience: number | null;
  political_lean: string | null;
  political_lean_justification: string | null;
  suggested_start_date: string | null;
  input_validation: {
    categoryCorrect?: boolean;
    suggestedCategory?: string | null;
    platformCorrect?: boolean;
    contentTypeCorrect?: boolean;
    validationNotes?: string;
  } | null;
  comparable_channels: string[] | null;
  platform_breakdown: Record<string, unknown> | null;
  raw_analysis: Record<string, unknown> | null;
  was_applied: boolean | null;
  created_at: string;
  analyzer_name?: string;
}

export function useAnalysisReports() {
  const { toast } = useToast();
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = useCallback(async (filters?: { country?: string; channelName?: string }) => {
    setLoading(true);
    try {
      let query = supabase
        .from('channel_analysis_reports')
        .select('*')
        .order('analyzed_at', { ascending: false });

      if (filters?.country && filters.country !== 'all') {
        query = query.eq('country', filters.country);
      }

      if (filters?.channelName) {
        query = query.ilike('channel_name', `%${filters.channelName}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch analyzer names
      const analyzerIds = [...new Set((data || []).map(r => r.analyzed_by))];
      let analyzerMap: Record<string, string> = {};

      if (analyzerIds.length > 0) {
        const { data: profiles } = await supabase
          .rpc('get_profiles_by_ids', { _user_ids: analyzerIds });
        
        if (profiles) {
          analyzerMap = profiles.reduce((acc: Record<string, string>, p: { id: string; full_name: string }) => {
            acc[p.id] = p.full_name;
            return acc;
          }, {});
        }
      }

      const reportsWithNames = (data || []).map(report => ({
        ...report,
        input_validation: report.input_validation as AnalysisReport['input_validation'],
        comparable_channels: report.comparable_channels as string[] | null,
        platform_breakdown: report.platform_breakdown as Record<string, unknown> | null,
        raw_analysis: report.raw_analysis as Record<string, unknown> | null,
        analyzer_name: analyzerMap[report.analyzed_by] || 'Unknown'
      }));

      setReports(reportsWithNames);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({ title: 'Failed to fetch reports', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateReport = async (id: string, updates: Partial<AnalysisReport>) => {
    try {
      const { error } = await supabase
        .from('channel_analysis_reports')
        .update(updates as never)
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Report updated' });
      return true;
    } catch (error) {
      console.error('Error updating report:', error);
      toast({ title: 'Failed to update report', variant: 'destructive' });
      return false;
    }
  };

  const deleteReport = async (id: string) => {
    try {
      const { error } = await supabase
        .from('channel_analysis_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReports(prev => prev.filter(r => r.id !== id));
      toast({ title: 'Report deleted' });
      return true;
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({ title: 'Failed to delete report', variant: 'destructive' });
      return false;
    }
  };

  return {
    reports,
    loading,
    fetchReports,
    updateReport,
    deleteReport,
    refetch: fetchReports
  };
}
