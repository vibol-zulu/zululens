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

interface PxFactorSettings {
  pxFactorGlobal: number;
  pxFactorAllCountries: number;
}

export const useUserChannels = (
  country: string, 
  year: number, 
  pxFactors: PxFactorSettings = { pxFactorGlobal: 1.0, pxFactorAllCountries: 2.24 }
) => {
  const [userChannels, setUserChannels] = useState<BrandData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUserChannels = useCallback(async () => {
    setLoading(true);
    try {
      // Only fetch approved channels for visualization
      // For "Global", fetch all countries' data
      let query = supabase
        .from('user_channels')
        .select('*')
        .eq('year', year)
        .eq('status', 'approved');
      
      // Only filter by country if not "Global"
      if (country !== 'Global') {
        query = query.eq('country', country);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching user channels:', error);
        return;
      }

      // Transform database records to BrandData format
      // Use configurable radius factors from settings
      const radiusFactor = country === 'Global' ? pxFactors.pxFactorGlobal : pxFactors.pxFactorAllCountries;
      const calcRadiusWithFactor = (val: number) => Math.max(2, Math.round(val * radiusFactor));
      
      const transformed: BrandData[] = (data as UserChannel[]).map(channel => ({
        id: `user_${channel.id}`,
        name: channel.name,
        category: channel.category as Category,
        valueMillions: Number(channel.value_millions),
        radiusPx: calcRadiusWithFactor(Number(channel.value_millions)),
        startDate: channel.start_date,
        platform: channel.platform,
        contentType: channel.content_type,
        politicalLean: channel.political_lean,
        country: channel.country // Include country for Global view grouping
      }));

      setUserChannels(transformed);
    } catch (err) {
      console.error('Error fetching user channels:', err);
    } finally {
      setLoading(false);
    }
  }, [country, year, pxFactors.pxFactorGlobal, pxFactors.pxFactorAllCountries]);

  useEffect(() => {
    fetchUserChannels();
  }, [fetchUserChannels]);

  // Get data for the current year - always use database as source of truth
  const getMergedData = useCallback((): YearData => {
    const staticData = INITIAL_DATA[year];
    
    // Use database channels as the source of truth for all countries
    // This ensures deleted channels from admin panel are respected
    return {
      totalAudienceMillions: staticData?.totalAudienceMillions || 0,
      usPopulationMillions: staticData?.usPopulationMillions || 0,
      usPopulationSource: staticData?.usPopulationSource || '',
      totalRadiusPx: staticData?.totalRadiusPx || 0,
      brands: userChannels
    };
  }, [year, userChannels]);

  return {
    userChannels,
    loading,
    refetch: fetchUserChannels,
    getMergedData
  };
};
