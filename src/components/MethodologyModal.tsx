import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MethodologyModalProps {
  open: boolean;
  onClose: () => void;
}

const MethodologyModal: React.FC<MethodologyModalProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl text-primary">
            Methodology
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] px-6 pb-6">
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <h4 className="font-semibold text-foreground">What is UMA?</h4>
            <p>Unique Monthly Audience (UMA) is our cross-platform audience estimate. It combines publicly visible reach metrics from websites, YouTube, podcasts, and major social platforms into a single figure. The "Unique Monthly Audience" is an educated assumption, not a verified audit.</p>
            
            <h4 className="font-semibold text-foreground mt-6">Geographic Scope</h4>
            <p>All audience figures represent <strong className="text-foreground">global (worldwide) reach</strong>, not US-only audiences. The underlying sources (Social Blade, vidIQ, SimilarWeb, podcast charts, follower counts) report worldwide totals, and no geographic filtering is applied. While the visualization focuses on outlets in the US media ecosystem, their measured audiences include viewers, listeners, and readers from every country.</p>
            
            <h4 className="font-semibold text-foreground mt-6">Data Sources</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>YouTube Analytics (Social Blade, vidIQ)</li>
              <li>Website Traffic Estimates (SimilarWeb)</li>
              <li>Podcast Charts & Downloads</li>
              <li>Social Media Follower Counts & Engagement</li>
            </ul>
            
            <h4 className="font-semibold text-foreground mt-6">De-Duplication</h4>
            <p>We apply probabilistic de-duplication factors calibrated based on each outlet's main platform and media type (e.g., video-heavy vs. text/podcast-focused) to reduce audience overlap.</p>
            
            <h4 className="font-semibold text-foreground mt-6">Limitations</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Public data only - no access to internal analytics</li>
              <li>Third-party estimates have inherent margins of error</li>
              <li>Cross-platform overlap is modeled, not measured directly</li>
              <li>UMA is a directional indicator, not a census</li>
            </ul>

            <h4 className="font-semibold text-foreground mt-6">Circle Sizing</h4>
            <p>Circle radius is calculated linearly: Radius = Value (in millions) × 2.24 pixels. This ensures visual area scales proportionally to audience size.</p>

            <h4 className="font-semibold text-foreground mt-6">Political Lean Classification</h4>
            <p>Political lean is assigned based on public self-identification, content analysis, and editorial positioning. Classifications are simplified for visualization purposes.</p>

            <h4 className="font-semibold text-foreground mt-6">How It Differs for Corporate Conglomerates</h4>
            <p>For each conglomerate, Unique Monthly Audience was first estimated at the sub-brand level (e.g., CNN vs. HLN; NBC News vs. TODAY; Fox News vs. Fox Business) using the same 30-day, cross-platform, primary-platform/media-type framework as the independents.</p>
            <p>A second de-duplication pass was then applied across those sub-brands to account for the fact that many of the same individuals consume multiple properties within the same corporate family (e.g., watching cable plus clips on YouTube plus visiting the .com site), yielding a single conglomerate-level UMA.</p>
            <p>As a result, conglomerate figures are more heavily de-duplicated than single-brand independents, and should be interpreted as "unduplicated people reached by the overall corporate news portfolio" rather than a sum of its component channels.</p>
          </div>
        </ScrollArea>
        
        <div className="p-6 pt-0 flex justify-center">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MethodologyModal;
