import React, { useRef, useEffect, useState, useCallback } from 'react';
import { YearData, ViewMode, COLORS } from '@/types/media';
import { BrandCircle, INNER_CONTAINER_RADIUS, SPECTRUM_BIN_WIDTH, SPECTRUM_BIN_HEIGHT } from '@/lib/BrandCircle';

interface MediaCanvasProps {
  year: number;
  yearData: YearData;
  selectedIds: Set<string>;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  onCircleClick: () => void;
  viewMode: ViewMode;
  country: string;
}

const MediaCanvas: React.FC<MediaCanvasProps> = ({
  year,
  yearData,
  selectedIds,
  hoveredId,
  setHoveredId,
  onCircleClick,
  viewMode,
  country
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const circlesRef = useRef<BrandCircle[]>([]);
  const requestRef = useRef<number>(0);
  const scaleRef = useRef<number>(1);

  // Initialize circles when year or data changes
  useEffect(() => {
    if (!yearData || yearData.brands.length === 0) {
      circlesRef.current = [];
      return;
    }
    
    const boundaryRadius = yearData.totalRadiusPx || 385;
    circlesRef.current = yearData.brands.map(b => new BrandCircle(b, boundaryRadius));
  }, [year, yearData]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      let viewScale = 1;
      let requiredWidth: number;
      let requiredHeight: number;

      if (viewMode === 'compass') {
        requiredWidth = (SPECTRUM_BIN_WIDTH * 5) + 60;
        requiredHeight = SPECTRUM_BIN_HEIGHT + 100;
      } else {
        const boundaryRadius = yearData.totalRadiusPx || 385;
        requiredWidth = (boundaryRadius * 2) + 60;
        requiredHeight = (boundaryRadius * 2) + 60;
      }

      const minDimW = width / requiredWidth;
      const minDimH = height / requiredHeight;
      viewScale = Math.min(minDimW, minDimH);
      scaleRef.current = viewScale;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr * viewScale, dpr * viewScale);

      const cx = (width / viewScale) / 2;
      const cy = (height / viewScale) / 2;
      const boundaryRadius = yearData.totalRadiusPx || 385;

      // Draw boundaries (Default mode only)
      if (viewMode === 'default') {
        ctx.beginPath();
        ctx.arc(cx, cy, boundaryRadius, 0, Math.PI * 2);
        ctx.strokeStyle = '#e0e0e0';
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(cx, cy, INNER_CONTAINER_RADIUS, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Compass Grid (Compass mode only)
      if (viewMode === 'compass') {
        const totalW = SPECTRUM_BIN_WIDTH * 5;
        const startX = cx - totalW / 2;
        const labels = ["Left", "Progressive", "Moderate", "Conservative", "Right"];

        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(width / viewScale, cy);
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 2;
        ctx.stroke();

        for (let i = 0; i < 5; i++) {
          const x = startX + i * SPECTRUM_BIN_WIDTH;
          const labelText = labels[i];
          const textX = x + SPECTRUM_BIN_WIDTH / 2;
          const textY = cy;

          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const metrics = ctx.measureText(labelText);
          const bgH = 24;
          const bgW = metrics.width + 14;
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.fillRect(textX - bgW/2, textY - bgH/2, bgW, bgH);

          ctx.fillStyle = '#666';
          ctx.fillText(labelText, textX, textY);
        }
      }

      // Update & Draw Circles
      ctx.save();
      ctx.translate(cx, cy);

      circlesRef.current.forEach(circle => {
        circle.update(width, height, boundaryRadius, selectedIds, hoveredId, circlesRef.current, viewMode);
        
        const contrastColor = circle.category === 'corporate' ? COLORS.independent : COLORS.corporate;

        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = circle.baseColor;
        ctx.globalAlpha = circle.opacity;
        ctx.fill();

        if (selectedIds.has(circle.id) || hoveredId === circle.id) {
          ctx.lineWidth = 1;
          ctx.strokeStyle = contrastColor;
          ctx.stroke();
          
          ctx.globalAlpha = 1;
          ctx.fillStyle = contrastColor;
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          if (circle.category === 'corporate') {
            ctx.shadowColor = '#002b25';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 1;
          }

          ctx.fillText(circle.name, circle.x, circle.y);
          ctx.font = '10px sans-serif';
          ctx.fillText(`${circle.valueMillions}M`, circle.x, circle.y + 14);

          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

        } else if (circle.currentRadius > 15) {
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = contrastColor;
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          if (circle.category === 'corporate') {
            ctx.shadowColor = '#002b25';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 1;
          }

          ctx.fillText(circle.name.slice(0, 10), circle.x, circle.y);

          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }
      });
      
      ctx.restore();
      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(requestRef.current);
  }, [year, yearData, selectedIds, hoveredId, country, viewMode]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = scaleRef.current || 1;
    
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    const scaledX = rawX / scale;
    const scaledY = rawY / scale;

    const centerX = (rect.width / scale) / 2;
    const centerY = (rect.height / scale) / 2;

    const x = scaledX - centerX;
    const y = scaledY - centerY;

    let found = null;
    for (let i = circlesRef.current.length - 1; i >= 0; i--) {
      if (circlesRef.current[i].contains(x, y)) {
        found = circlesRef.current[i].id;
        break;
      }
    }
    setHoveredId(found);
  }, [setHoveredId]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full"
      style={{ cursor: hoveredId ? 'pointer' : 'default' }}
      onMouseMove={handleCanvasMouseMove}
      onMouseLeave={() => setHoveredId(null)}
      onClick={onCircleClick}
    />
  );
};

export default MediaCanvas;
