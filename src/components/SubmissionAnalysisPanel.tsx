import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import perplexityLogo from '@/assets/perplexity-color.svg';

export interface SimilarChannel {
  id: string;
  name: string;
  category: string;
  country: string;
  similarity: number;
  match_type: string;
  status: string;
}

export interface SubmissionData {
  id: string;
  name: string;
  category: string;
  platform?: string;
  content_type?: string;
  political_lean?: string;
  country: string;
  status?: string;
  has_similarity_flag?: boolean;
  similar_channels?: SimilarChannel[] | unknown;
}

export interface EstimationProgress {
  currentRun: number;
  totalRuns: number;
  runResults: Array<{
    crossPlatformAudience: number;
    deduplicatedAudience: number;
  }>;
}

export interface EstimationResult {
  inputValidation?: {
    categoryCorrect: boolean;
    suggestedCategory: string | null;
    platformCorrect: boolean;
    contentTypeCorrect: boolean;
    validationNotes: string;
  } | null;
  politicalLean?: string | null;
  politicalLeanJustification?: string | null;
  crossPlatformAudience: number;
  deduplicatedAudience: number;
  reasoning: string;
  comparableChannels: string[];
  suggestedStartDate: string;
  runDetails?: Array<{
    crossPlatformAudience: number;
    deduplicatedAudience: number;
  }>;
  crossPlatformRange?: { min: number; max: number };
  deduplicatedRange?: { min: number; max: number };
}

interface SubmissionAnalysisPanelProps {
  submission: SubmissionData;
  isEstimating: boolean;
  estimationProgress: EstimationProgress | null;
  estimationResult: EstimationResult | null;
  onAnalyse: () => void;
  onAnalyzeComparableChannel?: (channelName: string) => void;
  showSimilarityWarning?: boolean;
}

const SubmissionAnalysisPanel: React.FC<SubmissionAnalysisPanelProps> = ({
  submission,
  isEstimating,
  estimationProgress,
  estimationResult,
  onAnalyse,
  onAnalyzeComparableChannel,
  showSimilarityWarning = true,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Section: Submission Details Table (Left) | Methodology + Analyse Button (Right) */}
      <div className="flex gap-6">
        {/* Left: Submission Details Table */}
        <div className="w-1/2 rounded-md border text-[10px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3 py-1 h-6 text-[10px]">Field</TableHead>
                <TableHead className="py-1 h-6 text-[10px]">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-muted-foreground py-1 px-2">Channel Name</TableCell>
                <TableCell className="font-semibold py-1 px-2">{submission.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-muted-foreground py-1 px-2">Category</TableCell>
                <TableCell className="capitalize py-1 px-2">{submission.category}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-muted-foreground py-1 px-2">Country</TableCell>
                <TableCell className="py-1 px-2">{submission.country}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-muted-foreground py-1 px-2">Platform</TableCell>
                <TableCell className="py-1 px-2">{submission.platform || 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-muted-foreground py-1 px-2">Content Type</TableCell>
                <TableCell className="py-1 px-2">{submission.content_type || 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-muted-foreground py-1 px-2">Political Lean</TableCell>
                <TableCell className="py-1 px-2">{submission.political_lean || 'N/A'}</TableCell>
              </TableRow>
              {submission.status && (
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground py-1 px-2">Status</TableCell>
                  <TableCell className="py-1 px-2">
                    <Badge variant={
                      submission.status === 'pending' ? 'secondary' : 
                      submission.status === 'approved' ? 'default' : 'destructive'
                    } className="text-[10px]">
                      {submission.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Right: Methodology Description + Analyse Button */}
        <div className="w-1/2 flex flex-col justify-start space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">AI Analysis Methodology</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our analysis runs 3 independent AI evaluations using Perplexity's Sonar model. 
              Each run estimates audience reach, validates political lean, and identifies comparable channels. 
              Results are averaged to reduce variance and improve accuracy, with outliers flagged for review.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onAnalyse}
            disabled={isEstimating}
            className="h-10 px-5 font-semibold text-foreground border-2"
          >
            {isEstimating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {estimationProgress 
                  ? `Analysing (Run ${estimationProgress.currentRun}/${estimationProgress.totalRuns})...`
                  : 'Analysing...'
                }
              </>
            ) : (
              <>
                <img src={perplexityLogo} alt="Perplexity" className="h-4 w-4 mr-2" />
                Analyse Submission (3x Cross-Check)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Similarity Warning Section */}
      {showSimilarityWarning && submission.has_similarity_flag && Array.isArray(submission.similar_channels) && (submission.similar_channels as SimilarChannel[]).length > 0 && (
        <div className="rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h4 className="font-semibold text-amber-800 dark:text-amber-300">
              Potential Similar Channels Detected
            </h4>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
            Review these existing channels before approving to avoid duplicates:
          </p>
          <div className="space-y-2">
            {(submission.similar_channels as SimilarChannel[]).map((similar, idx) => (
              <div 
                key={similar.id || idx}
                className="flex items-center justify-between bg-background/80 rounded px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{similar.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {similar.category}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {similar.country}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={similar.match_type === 'exact' ? 'destructive' : similar.match_type === 'contains' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {similar.similarity}% {similar.match_type}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {similar.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {isEstimating && estimationProgress && (
        <div className="rounded-md border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Multi-Run Analysis Progress</span>
            <span className="text-xs text-muted-foreground">
              Run {estimationProgress.currentRun} of {estimationProgress.totalRuns}
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(estimationProgress.currentRun / estimationProgress.totalRuns) * 100}%` }}
            />
          </div>
          {estimationProgress.runResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Completed runs:</p>
              <div className="flex flex-wrap gap-2">
                {estimationProgress.runResults.map((result, idx) => (
                  <div key={idx} className="bg-background rounded px-2 py-1 text-xs border">
                    <span className="font-medium">Run {idx + 1}:</span>{' '}
                    {result.deduplicatedAudience.toFixed(2)}M
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estimation Results */}
      {estimationResult && (
        <div className="rounded-md border bg-muted/30 overflow-hidden">
          {/* Input Validation */}
          {estimationResult.inputValidation && (
            <div className="p-4 border-b">
              <h4 className="text-sm font-semibold mb-3">Input Validation</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <span className={estimationResult.inputValidation.categoryCorrect ? 'text-green-600' : 'text-amber-600'}>
                    {estimationResult.inputValidation.categoryCorrect ? '✓' : '⚠'}
                  </span>
                  <span className="text-sm">Category: {estimationResult.inputValidation.categoryCorrect ? 'Correct' : `Suggested: ${estimationResult.inputValidation.suggestedCategory}`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={estimationResult.inputValidation.platformCorrect ? 'text-green-600' : 'text-amber-600'}>
                    {estimationResult.inputValidation.platformCorrect ? '✓' : '⚠'}
                  </span>
                  <span className="text-sm">Platform: {estimationResult.inputValidation.platformCorrect ? 'Correct' : 'Review needed'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={estimationResult.inputValidation.contentTypeCorrect ? 'text-green-600' : 'text-amber-600'}>
                    {estimationResult.inputValidation.contentTypeCorrect ? '✓' : '⚠'}
                  </span>
                  <span className="text-sm">Content Type: {estimationResult.inputValidation.contentTypeCorrect ? 'Correct' : 'Review needed'}</span>
                </div>
              </div>
              {estimationResult.inputValidation.validationNotes && (
                <p className="text-sm text-muted-foreground mt-3 italic">{estimationResult.inputValidation.validationNotes}</p>
              )}
            </div>
          )}

          {/* Results */}
          <div className="p-4 border-t">
            <h4 className="text-sm font-semibold mb-3">Results</h4>
          </div>
          <Table>
            <TableBody>
              {estimationResult.politicalLean && (
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground w-1/3">Political Lean</TableCell>
                  <TableCell>
                    <span className="font-semibold text-primary">{estimationResult.politicalLean}</span>
                    {estimationResult.politicalLeanJustification && (
                      <p className="text-sm text-muted-foreground mt-1">{estimationResult.politicalLeanJustification}</p>
                    )}
                  </TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="font-medium text-muted-foreground">Cross-Platform Audience</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{estimationResult.crossPlatformAudience?.toFixed(2) || '0.00'}M</span>
                    <Badge variant="secondary" className="text-xs">Mean</Badge>
                  </div>
                  {estimationResult.crossPlatformRange && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Range: {estimationResult.crossPlatformRange.min.toFixed(2)}M – {estimationResult.crossPlatformRange.max.toFixed(2)}M
                    </p>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-muted-foreground">Deduplicated Audience</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">{estimationResult.deduplicatedAudience?.toFixed(2) || '0.00'}M</span>
                    <Badge variant="secondary" className="text-xs">Mean</Badge>
                  </div>
                  {estimationResult.deduplicatedRange && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Range: {estimationResult.deduplicatedRange.min.toFixed(2)}M – {estimationResult.deduplicatedRange.max.toFixed(2)}M
                    </p>
                  )}
                </TableCell>
              </TableRow>
              {estimationResult.runDetails && estimationResult.runDetails.length > 0 && (
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">Individual Runs</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {estimationResult.runDetails.map((run, idx) => (
                        <div key={idx} className="bg-muted rounded px-2 py-1 text-xs border">
                          <span className="font-medium">Run {idx + 1}:</span>{' '}
                          Cross: {run.crossPlatformAudience.toFixed(2)}M, Dedup: {run.deduplicatedAudience.toFixed(2)}M
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {estimationResult.suggestedStartDate && (
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">Suggested Start Date</TableCell>
                  <TableCell className="font-medium">{estimationResult.suggestedStartDate}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="font-medium text-muted-foreground">Reasoning</TableCell>
                <TableCell className="text-sm text-muted-foreground">{estimationResult.reasoning}</TableCell>
              </TableRow>
              {estimationResult.comparableChannels?.length > 0 && (
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">Comparable Channels</TableCell>
                  <TableCell className="text-sm">
                    <div className="flex flex-wrap gap-2">
                      {estimationResult.comparableChannels.map((channel, idx) => (
                        <Badge 
                          key={idx}
                          variant="outline"
                          className={onAnalyzeComparableChannel ? "cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors" : ""}
                          onClick={() => onAnalyzeComparableChannel?.(channel)}
                        >
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default SubmissionAnalysisPanel;
