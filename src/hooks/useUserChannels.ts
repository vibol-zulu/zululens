import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BrandData, YearData, calcRadius, Category } from '@/types/media';
import { INITIAL_DATA } from '@/data/mediaData';

interface UserChannel {
  id: string;
  name: string;
  category: string;
  value_millions: number;
  start_date: string;
  platform: string;
  content_type: string;
  political_lean: string;
  country: string;
  year: number;
}

export const useUserChannels = (country: string) => {
  const [userChannels, setUserChannels] = useState<BrandData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUserChannels = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_channels')
        .select('*')
        .eq('country', country);

      if (error) {
        console.error('Error fetching user channels:', error);
        return;
      }

      // Transform database records to BrandData format
      const transformed: BrandData[] = (data as UserChannel[]).map(channel => ({
        id: `user_${channel.id}`,
        name: channel.name,
        category: channel.category as Category,
        valueMillions: Number(channel.value_millions),
        radiusPx: calcRadius(Number(channel.value_millions)),
        startDate: channel.start_date,
        platform: channel.platform,
        contentType: channel.content_type,
        politicalLean: channel.political_lean
      }));

      setUserChannels(transformed);
    } catch (err) {
      console.error('Error fetching user channels:', err);
    } finally {
      setLoading(false);
    }
  }, [country]);

  useEffect(() => {
    fetchUserChannels();
  }, [fetchUserChannels]);

  // Merge static data with user channels
  const getMergedData = useCallback((year: number): YearData => {
    const staticData = INITIAL_DATA[year];
    if (!staticData || country !== 'United States') {
      // For non-US countries, only show user-added channels
      const yearChannels = userChannels.filter(c => {
        // User channels have year stored, but we show all for now
        return true;
      });
      return {
        totalAudienceMillions: 0,
        usPopulationMillions: 0,
        usPopulationSource: '',
        totalRadiusPx: 0,
        brands: yearChannels
      };
    }

    // Merge static brands with user-added brands for the selected year
    const userBrandsForYear = userChannels.filter(c => {
      // Check if user channel matches the year (stored in the id or we can filter by year)
      return true; // Show all user channels for now
    });

    return {
      ...staticData,
      brands: [...staticData.brands, ...userBrandsForYear]
    };
  }, [country, userChannels]);

  return {
    userChannels,
    loading,
    refetch: fetchUserChannels,
    getMergedData
  };
};
