export type Category = 'corporate' | 'independent';
export type ViewMode = 'default' | 'compass';

export interface BrandData {
  id: string;
  name: string;
  category: Category;
  valueMillions: number;
  radiusPx: number;
  startDate: string;
  platform: string;
  contentType: string;
  politicalLean: string;
  country?: string;
}

export interface YearData {
  totalAudienceMillions: number;
  usPopulationMillions: number;
  usPopulationSource: string;
  totalRadiusPx: number;
  brands: BrandData[];
}

// Utilitarian color palette - Teal & Peach
export const COLORS = {
  corporate: '#00564A',      // Teal
  independent: '#F8D4C8',    // Peach
  userBubble: '#4A9ECC',     // Light blue
  boundary: '#1a1a1a',       // Black boundary
  highlight: '#00564A'       // Teal highlight
};

export const calcRadius = (val: number) => Math.max(2, Math.round(val * 2.24));
