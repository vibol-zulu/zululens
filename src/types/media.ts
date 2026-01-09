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

// Utilitarian color palette
export const COLORS = {
  corporate: '#1a1a1a',      // Near black
  independent: '#E85A4F',    // Coral/salmon accent
  userBubble: '#4A9ECC',     // Light blue
  boundary: '#1a1a1a',       // Black boundary
  highlight: '#E85A4F'       // Coral highlight
};

export const calcRadius = (val: number) => Math.max(2, Math.round(val * 2.24));
