import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChannelDiscovery {
  id: string;
  name: string;
  description: string | null;
  category: string;
  content_type: string | null;
  platform: string | null;
  political_lean: string | null;
  country: string;
  website_url: string | null;
  parent_company: string | null;
  headquarters: string | null;
  founding_year: number | null;
  source_url: string | null;
  discovery_method: string;
  raw_data: Record<string, unknown>;
  status: string;
  discovered_at: string;
  discovered_by: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
}

export function useChannelDiscoveries(country?: string) {
  const [discoveries, setDiscoveries] = useState<ChannelDiscovery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDiscoveries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('channel_discoveries')
        .select('*')
        .order('discovered_at', { ascending: false });

      if (country) {
        query = query.eq('country', country);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setDiscoveries((data || []) as ChannelDiscovery[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch discoveries';
      setError(message);
      console.error('Fetch discoveries error:', err);
    } finally {
      setLoading(false);
    }
  }, [country]);

  useEffect(() => {
    fetchDiscoveries();
  }, [fetchDiscoveries]);

  const triggerDiscovery = async (
    targetCountry: string,
    category?: string,
    searchQuery?: string
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to trigger discovery');
      }

      const response = await supabase.functions.invoke('discover-channels', {
        body: { country: targetCountry, category, searchQuery },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Discovery failed');
      }

      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.error || 'Discovery failed');
      }

      toast({
        title: 'Discovery Complete',
        description: `Found ${result.discovered} channels. ${result.inserted} added, ${result.skipped} already existed.`,
      });

      // Refresh the list
      await fetchDiscoveries();

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Discovery failed';
      toast({
        title: 'Discovery Failed',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const approveDiscovery = async (discovery: ChannelDiscovery, edits?: Partial<ChannelDiscovery>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const channelData = {
        name: edits?.name || discovery.name,
        category: edits?.category || discovery.category,
        content_type: edits?.content_type || discovery.content_type || 'news',
        platform: edits?.platform || discovery.platform || 'online',
        political_lean: edits?.political_lean || discovery.political_lean || 'center',
        country: discovery.country,
        value_millions: 0, // Default value, can be edited later
        start_date: String(discovery.founding_year || new Date().getFullYear()),
        status: 'pending', // Goes through normal approval flow
        author_id: user.id,
      };

      // Insert into user_channels
      const { error: insertError } = await supabase
        .from('user_channels')
        .insert(channelData);

      if (insertError) throw insertError;

      // Update discovery status
      const { error: updateError } = await supabase
        .from('channel_discoveries')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', discovery.id);

      if (updateError) throw updateError;

      toast({
        title: 'Channel Approved',
        description: `${discovery.name} has been added to pending channels for final review.`,
      });

      await fetchDiscoveries();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Approval failed';
      toast({
        title: 'Approval Failed',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const rejectDiscovery = async (discoveryId: string, notes?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('channel_discoveries')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          review_notes: notes,
        })
        .eq('id', discoveryId);

      if (error) throw error;

      toast({
        title: 'Discovery Rejected',
        description: 'The channel has been marked as rejected.',
      });

      await fetchDiscoveries();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Rejection failed';
      toast({
        title: 'Rejection Failed',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteDiscovery = async (discoveryId: string) => {
    try {
      const { error } = await supabase
        .from('channel_discoveries')
        .delete()
        .eq('id', discoveryId);

      if (error) throw error;

      toast({
        title: 'Discovery Deleted',
        description: 'The discovery has been permanently removed.',
      });

      await fetchDiscoveries();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Deletion failed';
      toast({
        title: 'Deletion Failed',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    discoveries,
    loading,
    error,
    refetch: fetchDiscoveries,
    triggerDiscovery,
    approveDiscovery,
    rejectDiscovery,
    deleteDiscovery,
  };
}
