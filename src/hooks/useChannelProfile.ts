import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChannelProfile {
  id: string;
  channel_id: string;
  description: string | null;
  website_url: string | null;
  parent_company: string | null;
  key_people: string[] | null;
  notable_events: string[] | null;
  founding_year: number | null;
  headquarters: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChannelWithProfile {
  id: string;
  name: string;
  category: string;
  platform: string;
  content_type: string;
  political_lean: string;
  value_millions: number;
  start_date: string;
  country: string;
  status: string;
  profile: ChannelProfile | null;
}

export const useChannelProfile = (channelId: string | null) => {
  const [channel, setChannel] = useState<ChannelWithProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!channelId) {
      setChannel(null);
      return;
    }

    const fetchChannelWithProfile = async () => {
      setLoading(true);
      setError(null);

      // Strip "user_" prefix if present (added by useUserChannels for frontend disambiguation)
      const rawChannelId = channelId.startsWith('user_') ? channelId.slice(5) : channelId;

      try {
        // Fetch channel data
        const { data: channelData, error: channelError } = await supabase
          .from('user_channels')
          .select('*')
          .eq('id', rawChannelId)
          .maybeSingle();

        if (channelError) throw channelError;
        if (!channelData) {
          setError('Channel not found');
          setChannel(null);
          return;
        }

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('channel_profiles')
          .select('*')
          .eq('channel_id', rawChannelId)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile fetch error:', profileError);
        }

        setChannel({
          id: channelData.id,
          name: channelData.name,
          category: channelData.category,
          platform: channelData.platform,
          content_type: channelData.content_type,
          political_lean: channelData.political_lean,
          value_millions: channelData.value_millions,
          start_date: channelData.start_date,
          country: channelData.country,
          status: channelData.status,
          profile: profileData as ChannelProfile | null,
        });
      } catch (err) {
        console.error('Error fetching channel profile:', err);
        setError('Failed to load channel data');
      } finally {
        setLoading(false);
      }
    };

    fetchChannelWithProfile();
  }, [channelId]);

  return { channel, loading, error };
};
