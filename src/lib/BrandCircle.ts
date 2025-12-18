import { BrandData, Category, ViewMode, COLORS } from '@/types/media';

const DEFAULT_RADIUS = 6;
const RADIUS_SCALE = 0.8;
export const INNER_CONTAINER_RADIUS = 200;
export const SPECTRUM_BIN_WIDTH = 200;
export const SPECTRUM_BIN_HEIGHT = 500;

export const getSpectrumBinIndex = (politicalLean: string) => {
  const lean = (politicalLean || '').toLowerCase();
  
  if (lean.includes('far left') || lean.includes('socialist') || lean.includes('communist')) {
    return 0;
  } 
  else if (lean.includes('far right') || lean.includes('conspiracy') || lean.includes('maga') || lean.includes('white') || lean.includes('alt-right')) {
    return 4;
  }
  else if (lean.includes('progressive') || lean.includes('liberal') || lean.includes('democrat')) {
    return 1;
  }
  else if (lean.includes('conservative') || lean.includes('republican')) {
    return 3;
  }
  else if (lean.includes('center-left') || lean.includes('lean left') || lean.includes('left-leaning')) {
    return 1;
  }
  else if (lean.includes('center-right') || lean.includes('lean right') || lean.includes('right-leaning')) {
    return 3;
  }
  else if (lean === 'right') {
    return 4; 
  }
  else if (lean === 'left') {
    return 0;
  }
  else {
    return 2;
  }
};

export class BrandCircle {
  id: string;
  name: string;
  category: Category;
  valueMillions: number;
  
  expandedRadius: number;
  currentRadius: number;
  
  x: number = 0;
  y: number = 0;
  vx: number = 0;
  vy: number = 0;
  
  baseColor: string;
  opacity: number = 0.6;
  
  startDate: string;
  platform: string;
  contentType: string;
  politicalLean: string;
  spectrumBinIndex: number;

  constructor(data: BrandData, boundaryRadius: number) {
    this.id = data.id;
    this.name = data.name;
    this.category = data.category;
    this.valueMillions = data.valueMillions;
    this.expandedRadius = data.radiusPx * RADIUS_SCALE;
    this.currentRadius = DEFAULT_RADIUS;
    this.baseColor = data.category === 'corporate' ? COLORS.corporate : COLORS.independent;
    
    this.startDate = data.startDate || 'N/A';
    this.platform = data.platform || 'N/A';
    this.contentType = data.contentType || 'N/A';
    this.politicalLean = data.politicalLean || 'N/A';
    this.spectrumBinIndex = getSpectrumBinIndex(data.politicalLean);

    const angle = Math.random() * Math.PI * 2;
    let dist = 0;

    if (this.category === 'corporate') {
      const safeMax = Math.max(10, INNER_CONTAINER_RADIUS - 30);
      dist = Math.random() * safeMax;
    } else {
      const safeMin = INNER_CONTAINER_RADIUS + 30;
      const safeMax = Math.max(safeMin + 10, boundaryRadius - 30);
      dist = safeMin + Math.random() * (safeMax - safeMin);
    }

    this.x = Math.cos(angle) * dist;
    this.y = Math.sin(angle) * dist;

    const speed = 0.05 + Math.random() * 0.1;
    const dir = Math.random() * Math.PI * 2;
    this.vx = Math.cos(dir) * speed;
    this.vy = Math.sin(dir) * speed;
  }

  update(
    width: number,
    height: number,
    boundaryRadius: number,
    selectedIds: Set<string>,
    hoveredId: string | null,
    allCircles: BrandCircle[],
    viewMode: ViewMode
  ) {
    const isSelected = selectedIds.has(this.id);
    const isHovered = hoveredId === this.id;
    const isExpanded = isSelected || isHovered;

    const targetR = isExpanded ? this.expandedRadius : DEFAULT_RADIUS;
    this.currentRadius += (targetR - this.currentRadius) * 0.15;
    
    const targetOpacity = 0.6;
    this.opacity += (targetOpacity - this.opacity) * 0.1;

    if (viewMode === 'compass') {
      const targetX = (this.spectrumBinIndex - 2) * SPECTRUM_BIN_WIDTH;
      
      // Same physics for both corporate and independent circles
      const speed = Math.hypot(this.vx, this.vy);
      const maxSpeed = 0.5;
      if (speed > maxSpeed) {
        this.vx = (this.vx / speed) * maxSpeed;
        this.vy = (this.vy / speed) * maxSpeed;
      }

      if (speed < 0.02) {
        const a = Math.random() * Math.PI * 2;
        this.vx += Math.cos(a) * 0.05;
        this.vy += Math.sin(a) * 0.05;
      }

      const halfW = (SPECTRUM_BIN_WIDTH / 2) + 10;
      const halfH = SPECTRUM_BIN_HEIGHT / 2;
      
      const minX = targetX - halfW + this.currentRadius;
      const maxX = targetX + halfW - this.currentRadius;
      const minY = -halfH + this.currentRadius;
      const maxY = halfH - this.currentRadius;

      const bounce = -1.0;

      if (minX < maxX) {
        if (this.x < minX) { this.x = minX; this.vx *= bounce; }
        else if (this.x > maxX) { this.x = maxX; this.vx *= bounce; }
      } else {
        this.x = targetX;
        this.vx = 0;
      }

      if (minY < maxY) {
        if (this.y < minY) { this.y = minY; this.vy *= bounce; }
        else if (this.y > maxY) { this.y = maxY; this.vy *= bounce; }
      } else {
        this.y = 0;
        this.vy = 0;
      }

    } else {
      // Default mode
      this.vx += (Math.random() - 0.5) * 0.02;
      this.vy += (Math.random() - 0.5) * 0.02;

      const maxSpeed = 0.3;
      const currentSpeed = Math.hypot(this.vx, this.vy);
      if (currentSpeed > maxSpeed) {
        this.vx = (this.vx / currentSpeed) * maxSpeed;
        this.vy = (this.vy / currentSpeed) * maxSpeed;
      }

      if (currentSpeed < 0.02) {
        const a = Math.random() * Math.PI * 2;
        this.vx += Math.cos(a) * 0.03;
        this.vy += Math.sin(a) * 0.03;
      }

      const dist = Math.hypot(this.x, this.y);

      if (this.category === 'corporate') {
        const targetMaxDist = INNER_CONTAINER_RADIUS - this.currentRadius;
        if (dist > targetMaxDist) {
          const nx = this.x / dist;
          const ny = this.y / dist;
          this.x = nx * targetMaxDist;
          this.y = ny * targetMaxDist;

          const dot = this.vx * nx + this.vy * ny;
          this.vx -= 2 * dot * nx;
          this.vy -= 2 * dot * ny;
          this.vx *= 0.9;
          this.vy *= 0.9;
        }
      } else {
        // Independents only have outer boundary constraint (no inner container)
        const targetMaxDist = boundaryRadius - this.currentRadius;

        if (dist > targetMaxDist) {
          const nx = this.x / dist;
          const ny = this.y / dist;
          this.x = nx * targetMaxDist;
          this.y = ny * targetMaxDist;

          const dot = this.vx * nx + this.vy * ny;
          this.vx -= 2 * dot * nx;
          this.vy -= 2 * dot * ny;
          this.vx *= 0.9;
          this.vy *= 0.9;
        }
      }
    }

    this.x += this.vx;
    this.y += this.vy;
  }

  contains(px: number, py: number): boolean {
    const d = Math.hypot(this.x - px, this.y - py);
    return d <= this.currentRadius;
  }
}
