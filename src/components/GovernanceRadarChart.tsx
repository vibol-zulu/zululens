import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export interface DomainScore {
  domain: string;
  domainName: string;
  score: number; // -100 to +100
  normalizedScore: number; // 0 to 100 for chart display
  questionsAnswered: number;
}

interface GovernanceRadarChartProps {
  domainScores: DomainScore[];
  className?: string;
}

const DOMAIN_ORDER = ['personal', 'social', 'professional', 'local', 'national', 'international'];

const GovernanceRadarChart: React.FC<GovernanceRadarChartProps> = ({
  domainScores,
  className = '',
}) => {
  // Sort by domain order and format for chart
  const chartData = DOMAIN_ORDER.map(domainId => {
    const score = domainScores.find(s => s.domain === domainId);
    return {
      domain: score?.domainName || domainId,
      // Convert -100 to +100 scale to 0-100 for radar (center = 50)
      value: score ? ((score.score + 100) / 2) : 50,
      rawScore: score?.score || 0,
      label: getScoreLabel(score?.score || 0),
    };
  });

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid 
            stroke="hsl(var(--muted-foreground))" 
            strokeOpacity={0.3}
          />
          <PolarAngleAxis 
            dataKey="domain" 
            tick={{ 
              fill: 'hsl(var(--foreground))', 
              fontSize: 10,
              fontWeight: 500,
            }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Political Position"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-popover border rounded-lg shadow-lg p-2 text-xs">
                    <p className="font-semibold">{data.domain}</p>
                    <p className="text-muted-foreground">
                      Score: {data.rawScore > 0 ? '+' : ''}{data.rawScore}
                    </p>
                    <p className={getScoreColor(data.rawScore)}>
                      {data.label}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex justify-center gap-4 text-xs text-muted-foreground mt-2">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          Left/Progressive
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-gray-400" />
          Center
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          Right/Conservative
        </span>
      </div>
    </div>
  );
};

function getScoreLabel(score: number): string {
  if (score <= -60) return 'Far Left';
  if (score <= -20) return 'Left-Leaning';
  if (score <= 20) return 'Center';
  if (score <= 60) return 'Right-Leaning';
  return 'Far Right';
}

function getScoreColor(score: number): string {
  if (score <= -20) return 'text-blue-500';
  if (score >= 20) return 'text-red-500';
  return 'text-gray-500';
}

export default GovernanceRadarChart;
