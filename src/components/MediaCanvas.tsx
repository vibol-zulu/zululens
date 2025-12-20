import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp, Info, RefreshCw } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { YearData, ViewMode, COLORS } from '@/types/media';
import { BrandCircle, INNER_CONTAINER_RADIUS, SPECTRUM_BIN_WIDTH, SPECTRUM_BIN_HEIGHT, getSpectrumBinIndex } from '@/lib/BrandCircle';
import PoliticalQuestionnaire, { RefinedResult } from '@/components/PoliticalQuestionnaire';
interface ChannelSuggestion {
  id: string;
  name: string;
  politicalLean: string;
  reason: string;
}

interface UserPositionResult {
  label: string;
  description: string;
  diversityScore: string;
  diversityNote: string;
  suggestedChannels?: ChannelSuggestion[];
  informationDiversityScore?: number;
}

interface MediaCanvasProps {
  year: number;
  yearData: YearData;
  selectedIds: Set<string>;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  onCircleClick: () => void;
  viewMode: ViewMode;
  country: string;
  userPoliticalScore?: number | null; // -100 to +100 from analysis
  userName?: string;
  visitorEmail?: string;
  personalizedChannelIds?: string[]; // Channels selected by user for their position
  userPositionResult?: UserPositionResult | null; // Result with reasoning
  pxFactorGlobal?: number;
  pxFactorAllCountries?: number;
  isAuthenticated?: boolean;
  onSignUpClick?: () => void;
  onContributeClick?: () => void;
  onMethodologyClick?: () => void;
  onReasoningPanelExpandedChange?: (expanded: boolean) => void;
}

// Country-specific insights data
interface CountryInfo {
  insights: string[];
}

const COUNTRY_INSIGHTS: Record<string, CountryInfo> = {
  'United States': {
    insights: [
      'The U.S. media landscape is dominated by a mix of legacy broadcast networks and digital-native platforms.',
      'Cable news channels remain influential despite declining viewership, with strong partisan alignment.',
      'Podcast and streaming platforms are rapidly growing, particularly among younger demographics.',
    ],
  },
  'United Kingdom': {
    insights: [
      'The BBC remains the dominant public broadcaster with significant reach across demographics.',
      'Tabloid newspapers continue to influence public discourse despite declining print circulation.',
      'Streaming services are reshaping traditional TV viewing habits.',
    ],
  },
  'Canada': {
    insights: [
      'CBC/Radio-Canada serves as the national public broadcaster in both English and French.',
      'Media consumption patterns show strong regional variations between provinces.',
      'Cross-border influence from U.S. media is significant but regulated.',
    ],
  },
  'Australia': {
    insights: [
      'Media ownership is highly concentrated among a few major conglomerates.',
      'The ABC (Australian Broadcasting Corporation) provides public broadcasting services.',
      'Regional and metropolitan media markets show distinct characteristics.',
    ],
  },
  'Global': {
    insights: [
      'This view aggregates media data from all available countries for a worldwide perspective.',
      'Bubble sizes are scaled down to prevent visual clutter as more countries contribute data.',
      'Cross-border media influence and international news organizations are represented.',
    ],
  },
  'All Countries': {
    insights: [
      'This view combines all country-specific datasets into a single visualization.',
      'Useful for comparing relative audience sizes across different national markets.',
      'Some channels may appear multiple times if they operate in multiple countries.',
    ],
  },
};

const METHODOLOGY_TEXT = `Audience estimates are derived from multiple data sources including industry reports, public filings, and third-party analytics platforms. For digital platforms, we use Unique Monthly Audience (UMA) metrics where available. Traditional broadcast audiences are estimated using ratings data and demographic surveys. All figures represent estimated reach rather than exact viewership counts. Political lean classifications are based on content analysis, editorial positioning, and audience demographic studies. Circle sizes are proportional to the square root of audience size to maintain visual clarity.`;

// Reasoning Panel Component with expand/collapse and refinement questionnaire
const ReasoningPanel: React.FC<{ 
  userPositionResult: UserPositionResult; 
  userName: string;
  visitorEmail?: string;
  originalScore: number;
  country: string;
  onRefinedResult?: (result: RefinedResult) => void;
  onExpandedChange?: (expanded: boolean) => void;
}> = ({ 
  userPositionResult, 
  userName,
  visitorEmail,
  originalScore,
  country,
  onRefinedResult,
  onExpandedChange
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [refinedResult, setRefinedResult] = useState<RefinedResult | null>(null);

  // Notify parent of initial expanded state
  useEffect(() => {
    onExpandedChange?.(true);
  }, []);

  const handleToggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpandedChange?.(newExpanded);
  };

  const handleQuestionnaireComplete = (result: RefinedResult) => {
    setRefinedResult(result);
    setShowQuestionnaire(false);
    onRefinedResult?.(result);
  };

  const displayResult = refinedResult || userPositionResult;
  const displayLabel = refinedResult ? refinedResult.label : userPositionResult.label;
  const displayDescription = refinedResult ? refinedResult.description : userPositionResult.description;

  return (
    <>
      <div className={`absolute top-4 right-4 bg-card/95 backdrop-blur-sm rounded-lg shadow-lg border z-10 transition-all ${isExpanded ? 'w-80' : 'max-w-xs'}`}>
        {/* Header - always visible */}
        <button
          onClick={handleToggleExpanded}
          className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors rounded-t-lg"
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: COLORS.userBubble }}
            />
            <span className="font-semibold text-sm">{userName}</span>
            <Badge 
              variant="secondary" 
              className="text-xs bg-primary/20 text-primary border-primary/30"
            >
              {displayLabel}
            </Badge>
            {refinedResult && (
              <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded">Refined</span>
            )}
          </div>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {/* Collapsible content - vertical layout */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-1 space-y-3">
            {/* Description */}
            <p className="text-sm text-muted-foreground">
              {displayDescription}
            </p>
            
            {/* Refined result confidence indicator */}
            {refinedResult && (
              <div className="p-2 bg-primary/10 rounded-md">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium">Confidence:</span>
                  <span className={`px-2 py-0.5 rounded-full ${
                    refinedResult.confidence === 'high' 
                      ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                      : refinedResult.confidence === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                      : 'bg-red-500/20 text-red-700 dark:text-red-400'
                  }`}>
                    {refinedResult.confidence}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Score: {refinedResult.numericValue > 0 ? '+' : ''}{refinedResult.numericValue}
                </p>
              </div>
            )}
            
            {/* Information Diversity Score - only show if not refined */}
            {!refinedResult && userPositionResult.informationDiversityScore !== undefined && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">Information Diversity Score</span>
                  <span className="font-bold">{userPositionResult.informationDiversityScore}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      userPositionResult.informationDiversityScore >= 70 
                        ? 'bg-green-500' 
                        : userPositionResult.informationDiversityScore >= 40 
                        ? 'bg-yellow-500' 
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${userPositionResult.informationDiversityScore}%` }}
                  />
                </div>
              </div>
            )}
            
            {!refinedResult && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className={`px-2 py-0.5 rounded-full ${
                  userPositionResult.diversityScore === 'high' 
                    ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                    : userPositionResult.diversityScore === 'medium'
                    ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                    : 'bg-red-500/20 text-red-700 dark:text-red-400'
                }`}>
                  {userPositionResult.diversityScore} diversity
                </span>
              </div>
            )}
            
            {!refinedResult && (
              <p className="text-xs text-muted-foreground">
                {userPositionResult.diversityNote}
              </p>
            )}

            {/* Channel Suggestions */}
            {!refinedResult && userPositionResult.suggestedChannels && userPositionResult.suggestedChannels.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs font-medium mb-2">Suggested to improve diversity:</p>
                <div className="space-y-1.5">
                  {userPositionResult.suggestedChannels.slice(0, 3).map((suggestion, i) => (
                    <div key={i} className="text-xs p-1.5 bg-muted/50 rounded">
                      <span className="font-medium">{suggestion.name}</span>
                      <span className="text-muted-foreground ml-1">({suggestion.politicalLean})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Further Refine Button */}
            <div className="border-t pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQuestionnaire(true)}
                className="w-full text-xs border-pink-400 bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 dark:border-pink-500/50"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                {refinedResult ? 'Refine Again' : 'Further Refine'}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {refinedResult 
                  ? 'Retake for accuracy.'
                  : 'Answer questions to refine.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Questionnaire Modal */}
      <Dialog open={showQuestionnaire} onOpenChange={setShowQuestionnaire}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <PoliticalQuestionnaire
            originalScore={originalScore}
            country={country}
            visitorName={userName}
            visitorEmail={visitorEmail}
            onComplete={handleQuestionnaireComplete}
            onCancel={() => setShowQuestionnaire(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

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
  userName = 'You',
  visitorEmail,
  personalizedChannelIds = [],
  userPositionResult,
  pxFactorGlobal = 1.0,
  pxFactorAllCountries = 2.24,
  isAuthenticated = false,
  onSignUpClick,
  onContributeClick,
  onMethodologyClick,
  onReasoningPanelExpandedChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const circlesRef = useRef<BrandCircle[]>([]);
  const requestRef = useRef<number>(0);
  const scaleRef = useRef<number>(1);
  const userBubbleRef = useRef<{ x: number; y: number; vx: number; vy: number; binIndex: number } | null>(null);

  // Convert user's political score (-100 to +100) to bin index (0-4)
  const userPoliticalPosition = useMemo(() => {
    if (userPoliticalScore === null || userPoliticalScore === undefined) return null;
    
    // Map -100 to +100 to bin index 0-4
    // -100 = Far Left = bin 0
    // 0 = Center = bin 2
    // +100 = Far Right = bin 4
    const normalized = (userPoliticalScore + 100) / 200; // 0 to 1
    return Math.round(normalized * 4); // 0-4 to match spectrum bins
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
    
    // Filter brands if in personalized mode (user has selected specific channels)
    const brandsToShow = personalizedChannelIds.length > 0
      ? yearData.brands.filter(b => personalizedChannelIds.includes(b.id))
      : yearData.brands;
    
    circlesRef.current = brandsToShow.map(b => new BrandCircle(b, boundaryRadius));
  }, [year, yearData, personalizedChannelIds]);

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
        const numLines = 500; // Number of radial lines
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

      // Compass Grid background line (Compass mode only)
      if (viewMode === 'compass') {
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(width / viewScale, cy);
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 2;
        ctx.stroke();
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

      // Draw spectrum labels ON TOP of bubbles (after restore to use screen coords)
      if (viewMode === 'compass') {
        const totalW = SPECTRUM_BIN_WIDTH * 5;
        const startX = cx - totalW / 2;
        const labels = ["Left", "Progressive", "Moderate", "Conservative", "Right"];

        for (let i = 0; i < 5; i++) {
          const x = startX + i * SPECTRUM_BIN_WIDTH;
          const labelText = labels[i];
          const textX = x + SPECTRUM_BIN_WIDTH / 2;
          const textY = cy;

          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const metrics = ctx.measureText(labelText);
          const bgH = 36;
          const bgW = metrics.width + 28;
          const bgX = textX - bgW / 2;
          const bgY = textY - bgH / 2;
          const radius = 6;
          
          // Draw rounded rectangle background
          ctx.beginPath();
          ctx.moveTo(bgX + radius, bgY);
          ctx.lineTo(bgX + bgW - radius, bgY);
          ctx.quadraticCurveTo(bgX + bgW, bgY, bgX + bgW, bgY + radius);
          ctx.lineTo(bgX + bgW, bgY + bgH - radius);
          ctx.quadraticCurveTo(bgX + bgW, bgY + bgH, bgX + bgW - radius, bgY + bgH);
          ctx.lineTo(bgX + radius, bgY + bgH);
          ctx.quadraticCurveTo(bgX, bgY + bgH, bgX, bgY + bgH - radius);
          ctx.lineTo(bgX, bgY + radius);
          ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
          ctx.closePath();
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.fill();

          ctx.fillStyle = '#555';
          ctx.fillText(labelText, textX, textY);
        }
      }
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

  const [countryInfoOpen, setCountryInfoOpen] = useState(false);

  // Get country insights (empty array if no data for this country)
  const countryInfo = COUNTRY_INSIGHTS[country];
  const hasInsights = countryInfo && countryInfo.insights.length > 0;

  return (
    <div className="relative w-full h-full">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        style={{ cursor: hoveredId ? 'pointer' : 'default' }}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={() => setHoveredId(null)}
        onClick={onCircleClick}
      />
      
      {/* Country Info Box - shows for all countries */}
      <Collapsible open={countryInfoOpen} onOpenChange={setCountryInfoOpen} className="absolute top-4 left-4 z-10">
        <CollapsibleTrigger className="flex items-center gap-1.5 px-3 py-2 text-xs bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-sm hover:bg-muted/50 transition-colors">
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{country === 'Global' ? 'Global View' : country}</span>
          {countryInfoOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-1 w-80 max-h-[60vh] overflow-y-auto p-3 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg">
          {/* Sign-up gate for tier 1 (unauthenticated) users */}
          {!isAuthenticated ? (
            <div className="text-center py-4">
              <div className="mb-3">
                <Info className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <h4 className="text-sm font-semibold text-foreground mb-1">Unlock Insights</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Create a free account to access detailed country insights and methodology information.
                </p>
              </div>
              <button
                onClick={onSignUpClick}
                className="px-4 py-2 text-xs font-medium text-white rounded-full transition-colors hover:opacity-90"
                style={{ backgroundColor: '#00564A' }}
              >
                Sign Up Free
              </button>
            </div>
          ) : (
            <>
              {/* Early stage note with call to action - at top */}
              <div className="mb-3 p-2.5 bg-primary/5 border border-primary/20 rounded-md">
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                  <span className="font-medium text-foreground">We're just getting started!</span>
                  <br />
                  Our insights are growing as we gather more data. Help us build a more complete picture of the media landscape.
                </p>
                <button
                  onClick={onContributeClick}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Find out more →
                </button>
              </div>
              
              {/* Insights Section */}
              {hasInsights && (
                <div className="mb-3">
                  <h4 className="text-xs font-semibold text-foreground mb-2">Insights</h4>
                  <ul className="space-y-1.5">
                    {countryInfo.insights.map((insight, i) => (
                      <li key={i} className="text-xs text-muted-foreground leading-relaxed flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Global-specific scaling info */}
              {country === 'Global' && (
                <div className="mb-3 p-2 bg-muted/50 rounded-md">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-medium">Scaling:</span> Bubble sizes are scaled to ~{Math.round((pxFactorGlobal || 1.0) / (pxFactorAllCountries || 2.24) * 100)}% of normal (radius factor: {pxFactorGlobal?.toFixed(2) || '1.00'} vs {pxFactorAllCountries?.toFixed(2) || '2.24'}).
                  </p>
                </div>
              )}
              
              {/* Methodology Link */}
              <div className={hasInsights ? 'pt-2 border-t border-border' : ''}>
                <button
                  onClick={onMethodologyClick}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Methodology →
                </button>
              </div>
            </>
          )}
        </CollapsibleContent>
      </Collapsible>
      
      {/* User Position Reasoning Panel */}
      {viewMode === 'compass' && userPositionResult && (
        <ReasoningPanel 
          userPositionResult={userPositionResult} 
          userName={userName} 
          visitorEmail={visitorEmail}
          originalScore={userPoliticalScore ?? 0}
          country={country}
          onExpandedChange={onReasoningPanelExpandedChange}
        />
      )}
    </div>
  );
};

export default MediaCanvas;
