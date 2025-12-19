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

export const COLORS = {
  corporate: '#00564A',
  independent: '#F8D4C8',
  userBubble: '#9333EA',
  boundary: '#cccccc',
  highlight: '#111111'
};

export const calcRadius = (val: number) => Math.max(2, Math.round(val * 2.24));
