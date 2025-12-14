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

  // Merge static data with user channels (excluding duplicates)
  const getMergedData = useCallback((year: number): YearData => {
    const staticData = INITIAL_DATA[year];
    if (!staticData || country !== 'United States') {
      // For non-US countries, only show user-added channels
      return {
        totalAudienceMillions: 0,
        usPopulationMillions: 0,
        usPopulationSource: '',
        totalRadiusPx: 0,
        brands: userChannels
      };
    }

    // Get static brand names for deduplication (for this specific year)
    const staticBrandNames = new Set(staticData.brands.map(b => b.name.toLowerCase()));

    // Filter user channels to only include ones NOT in static data (truly user-added)
    // Note: We show static data as the source of truth, database is for NEW channels only
    const uniqueUserBrands = userChannels.filter(c => 
      !staticBrandNames.has(c.name.toLowerCase())
    );

    return {
      ...staticData,
      brands: [...staticData.brands, ...uniqueUserBrands]
    };
  }, [country, userChannels]);

  return {
    userChannels,
    loading,
    refetch: fetchUserChannels,
    getMergedData
  };
};
