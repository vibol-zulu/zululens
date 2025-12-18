import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { YearData, ViewMode, COLORS } from '@/types/media';
import { BrandCircle, INNER_CONTAINER_RADIUS, SPECTRUM_BIN_WIDTH, SPECTRUM_BIN_HEIGHT, getSpectrumBinIndex } from '@/lib/BrandCircle';

interface MediaCanvasProps {
  year: number;
  yearData: YearData;
  selectedIds: Set<string>;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  onCircleClick: () => void;
  viewMode: ViewMode;
  country: string;
  userPoliticalScore?: number | null; // -100 to +100 from AI analysis
  userName?: string;
}

const MediaCanvas: React.FC<MediaCanvasProps> = ({
  year,
  yearData,
  selectedIds,
  hoveredId,
  setHoveredId,
  onCircleClick,
  viewMode,
  country,
  userPoliticalScore,
  userName = 'You'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const circlesRef = useRef<BrandCircle[]>([]);
  const requestRef = useRef<number>(0);
  const scaleRef = useRef<number>(1);
  const userBubbleRef = useRef<{ x: number; y: number; vx: number; vy: number; binIndex: number } | null>(null);

  // Convert user's political score (-100 to +100) to bin index (0-8)
  const userPoliticalPosition = useMemo(() => {
    if (userPoliticalScore === null || userPoliticalScore === undefined) return null;
    
    // Map -100 to +100 to bin index 0-8
    // -100 = Far Left = bin 0
    // +100 = Far Right = bin 8
    const normalized = (userPoliticalScore + 100) / 200; // 0 to 1
    return Math.round(normalized * 8);
  }, [userPoliticalScore]);

  // Initialize user bubble position when personalized mode activates
  useEffect(() => {
    if (userPoliticalPosition !== null && viewMode === 'compass') {
      const targetX = (userPoliticalPosition - 2) * SPECTRUM_BIN_WIDTH;
      userBubbleRef.current = {
        x: targetX + (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        binIndex: userPoliticalPosition
      };
    } else {
      userBubbleRef.current = null;
    }
  }, [userPoliticalPosition, viewMode]);

  // Initialize circles when year or data changes
  useEffect(() => {
    if (!yearData || yearData.brands.length === 0) {
      circlesRef.current = [];
      return;
    }
    
    const boundaryRadius = yearData.totalRadiusPx || 385;
    
    // Use all brands - personalized mode just shows user position without filtering
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

      const scaledWidth = width / viewScale;
      const scaledHeight = height / viewScale;
      const cx = scaledWidth / 2;
      const cy = scaledHeight / 2;
      const boundaryRadius = yearData.totalRadiusPx || 385;

      // Draw faint background grid (masked outside the circle in microscope mode only)
      const gridSize = 20;
      ctx.save();
      
      // Create a clipping path that excludes the circle area (only in microscope mode)
      if (viewMode === 'default') {
        ctx.beginPath();
        ctx.rect(0, 0, scaledWidth, scaledHeight);
        ctx.arc(cx, cy, boundaryRadius + 5, 0, Math.PI * 2, true); // true = counter-clockwise (cuts out)
        ctx.clip();
      }
      
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.lineWidth = 1;
      
      // Vertical lines
      for (let x = 0; x <= scaledWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, scaledHeight);
        ctx.stroke();
      }
      
      // Horizontal lines
      for (let y = 0; y <= scaledHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(scaledWidth, y);
        ctx.stroke();
      }
      
      ctx.restore();

      // Draw boundaries (Default mode only)
      if (viewMode === 'default') {
        ctx.beginPath();
        ctx.arc(cx, cy, boundaryRadius, 0, Math.PI * 2);
        ctx.strokeStyle = '#e0e0e0';
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw circular line array (radial lines) inside the dashed circle
        const lineArrayOuterRadius = boundaryRadius - 6; // Gap from dashed circle
        const lineArrayInnerRadius = boundaryRadius - 46; // Line length
        const numLines = 300; // Number of radial lines
        ctx.strokeStyle = '#e0e0e0'; // Match dashed circle color
        ctx.lineWidth = 1;
        
        for (let i = 0; i < numLines; i++) {
          const angle = (i / numLines) * Math.PI * 2;
          const x1 = cx + Math.cos(angle) * lineArrayInnerRadius;
          const y1 = cy + Math.sin(angle) * lineArrayInnerRadius;
          const x2 = cx + Math.cos(angle) * lineArrayOuterRadius;
          const y2 = cy + Math.sin(angle) * lineArrayOuterRadius;
          
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

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

      // Draw user bubble in personalized spectrum mode
      if (viewMode === 'compass' && userBubbleRef.current && userPoliticalPosition !== null) {
        const ub = userBubbleRef.current;
        const userRadius = 35;
        
        // Update user bubble physics
        ub.x += ub.vx;
        ub.y += ub.vy;
        
        // Constrain to bin
        const targetX = (ub.binIndex - 2) * SPECTRUM_BIN_WIDTH;
        const halfW = (SPECTRUM_BIN_WIDTH / 2) - userRadius;
        const halfH = (SPECTRUM_BIN_HEIGHT / 2) - userRadius;
        
        if (ub.x < targetX - halfW) { ub.x = targetX - halfW; ub.vx *= -0.8; }
        if (ub.x > targetX + halfW) { ub.x = targetX + halfW; ub.vx *= -0.8; }
        if (ub.y < -halfH) { ub.y = -halfH; ub.vy *= -0.8; }
        if (ub.y > halfH) { ub.y = halfH; ub.vy *= -0.8; }
        
        // Gentle random motion
        if (Math.hypot(ub.vx, ub.vy) < 0.05) {
          ub.vx += (Math.random() - 0.5) * 0.1;
          ub.vy += (Math.random() - 0.5) * 0.1;
        }
        
        // Draw user bubble with purple color
        ctx.beginPath();
        ctx.arc(ub.x, ub.y, userRadius, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.userBubble;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        
        // White border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // User name label
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(userName, ub.x, ub.y);
      }
      
      ctx.restore();
      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(requestRef.current);
  }, [year, yearData, selectedIds, hoveredId, country, viewMode, userPoliticalScore, userPoliticalPosition, userName]);

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
