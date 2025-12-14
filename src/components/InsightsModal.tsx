import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface InsightsModalProps {
  open: boolean;
  onClose: () => void;
}

const InsightsModal: React.FC<InsightsModalProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl text-primary">
            Zulu Digital Microscope: US Media 2000-2025
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] px-6 pb-6">
          <div className="space-y-4 text-sm text-foreground leading-relaxed">
            <p>This month, we are doing a deeper dive on US media dynamics and how the rise of independent media has (counter-intuitively) had a dramatic impact on the structure of US media generally - this effect has only taken hold in the last 5 years!</p>
            
            <h4 className="font-semibold text-primary mt-6">Here's what we did:</h4>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li><strong>Estimated a Unique Monthly Audience (UMA)</strong> for each outlet, combining publicly visible reach metrics from websites, YouTube, podcasts, and major social platforms into a single cross‑platform figure.</li>
              <li><strong>Standardized all figures</strong> to a 30-day rolling window, then applied probabilistic de-duplication factors—calibrated based on each outlet's main platform and media type—to model and reduce audience overlap.</li>
              <li><strong>Relied exclusively on public data</strong> and third-party analytics (e.g., Social Blade, vidIQ), which means UMA should be read as a consistent, directional indicator of relative scale and growth.</li>
            </ul>

            <h3 className="text-lg font-semibold text-primary mt-8 pb-2 border-b-2 border-secondary inline-block">
              A Media Network Becoming Wiser: Core Insights
            </h3>
            <p className="text-muted-foreground">One of the most surprising bits of research we put together during The Age of Wisdom series revealed a surprising and encouraging trend in the US media landscape: in the last 25 years, independent media outlets have multiplied and effectively swallowed up corporate outlets in terms of sheer audience size.</p>

            <h4 className="font-semibold mt-5">Diversity as an epistemic stabilizer.</h4>
            <p className="text-muted-foreground">More ideological variety and a greater number of distinct voices raise the probability of error-correction. When the network contains many independent nodes, contradictions surface sooner and bad information is harder to sustain.</p>

            <h4 className="font-semibold mt-5">Connectivity as a defence against disinformation.</h4>
            <p className="text-muted-foreground">High-link density between creators, platforms, and audiences accelerates feedback loops and makes coordinated disinformation campaigns—especially those driven by concentrated special interests—fundamentally more fragile.</p>

            <h4 className="font-semibold mt-5">The rise of the independent tier.</h4>
            <p className="text-muted-foreground">Independent creators now operate with formats (long-form interviews, livestreams, rich comment cultures) that embody rapid, diverse, audience-driven feedback.</p>

            <h4 className="font-semibold mt-5">Authenticity through long-form depth.</h4>
            <p className="text-muted-foreground">Independent channels rely on extended, minimally pre-packaged formats that correlate with greater epistemic openness.</p>

            <h3 className="text-lg font-semibold text-primary mt-8 pb-2 border-b-2 border-secondary inline-block">
              A New Pillar of Networked Sensemaking
            </h3>
            <p className="text-muted-foreground">The Zulu Digital Microscope is not merely media analytics; it is emerging as a piece of epistemic infrastructure for Networked Sensemaking. By quantifying how audience power, narrative formation, and media incentives have shifted from 2000 to 2025, it illuminates both the bottlenecks and the new leverage points of the collective brain.</p>
          </div>
        </ScrollArea>
        
        <div className="p-6 pt-0 flex justify-center">
          <Button onClick={onClose}>Close Insights</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InsightsModal;
