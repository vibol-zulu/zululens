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
            Zulu Digital Microscope: Networked media is taking over in the USA
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] px-6 pb-6">
          <div className="space-y-4 text-sm text-foreground leading-relaxed">
            <p className="font-semibold">One of the most surprising bits of research we put together during <a href="https://www.zulu.group/zephyr/issue-02" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">The Age of Wisdom series</a> revealed a surprising and encouraging trend in the US media landscape: analysis of US Media from 2000 to 2025 reveals a pivotal transition from a handful of corporate media to a multitude of independent, networked, media sources - in terms of both epistemic dynamism and sheer audience size. We believe this is good news for human information network health, and thus for truth.</p>
            
            <p>So this month we're doing a deeper dive on US media dynamics and on how this counter-intuitive trend impacted US media generally - incredible, also, that it only kicked into high gear after Covid (5 years).</p>
            
            <h4 className="font-semibold text-primary mt-6">Here's what we did:</h4>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li><strong>Estimated a Unique Monthly Audience (UMA)</strong> for each outlet, combining publicly visible reach metrics from websites, YouTube, podcasts, and major social platforms into a single cross‑platform figure.</li>
              <li><strong>Standardized all figures</strong> to a 30-day rolling window, then applied probabilistic de-duplication factors—calibrated based on each outlet's main platform and media type (e.g., video-heavy vs. text/podcast-focused)—to model and reduce audience overlap, producing a unified, comparable reach estimate.</li>
              <li><strong>Relied exclusively on public data</strong> and third-party analytics (e.g., Social Blade, vidIQ), which means UMA should be read as a consistent, directional indicator of relative scale and growth (especially for larger outlets), not a precise census.</li>
              <li><strong>Classifications:</strong> corporate media is XX; independent media is XX.</li>
            </ul>
            
            <p className="text-muted-foreground italic">More detail on the data below.</p>

            <h3 className="text-lg font-semibold text-primary mt-8 pb-2 border-b-2 border-secondary inline-block">
              A Media Network Becoming Wiser? Core Insights from the data
            </h3>
            <p className="text-muted-foreground">The modern information environment is becoming denser, faster, and—paradoxically—more self-correcting:</p>

            <h4 className="font-semibold mt-5">Diversity as an epistemic stabilizer</h4>
            <p className="text-muted-foreground">i.e. less risk of collective delusion. More ideological variety and a greater number of distinct voices raise the probability of error-correction. When the network contains many independent nodes, contradictions surface sooner and bad information is harder to sustain. Coherent hypotheses surface more easily.</p>

            <h4 className="font-semibold mt-5">Connectivity as a defence against disinformation</h4>
            <p className="text-muted-foreground">High-link density between creators, platforms, and audiences accelerates feedback loops and makes coordinated disinformation campaigns—especially those driven by concentrated special interests—fundamentally more fragile. It is far easier to make a call to the editors of 5 major news outlets than it is to rein in hundreds of independent journalists unpicking the same story.</p>

            <h4 className="font-semibold mt-5">The rise of the independent tier</h4>
            <p className="text-muted-foreground">Independent creators now operate with formats (long-form interviews, livestreams, rich comment cultures) that embody rapid, diverse, audience-driven feedback. Compared to the year 2000—an era defined by tight thought silos—today's ecosystem is structurally more conversational and less prone to gate-keeping.</p>

            <h4 className="font-semibold mt-5">Authenticity through long-form depth</h4>
            <p className="text-muted-foreground">Independent channels rely on extended, minimally pre-packaged formats that correlate with greater epistemic openness. Their narratives are less shaped by editorial boards, owners, or advertisers, and more by the need to maintain coherence before a highly interactive audience. Whereas TV news format is exemplified by short interviews and soundbites, typically in service of engagement and advertisers.</p>

            <h4 className="font-semibold mt-5">Different incentives, different truths</h4>
            <p className="text-muted-foreground">Corporate media maintains professional training and institutional structure, but these bring implicit agenda constraints tied to ownership and advertising pressures. Independent media, by contrast, is answerable mainly to followers and subscribers, encouraging adaptability and coherence rather than deference to external interests. The project's political-spectrum and ownership maps directly illuminate these contrasting incentive architectures.</p>

            <h4 className="font-semibold mt-5">Decentralized accountability</h4>
            <p className="text-muted-foreground">The proliferation of independent voices across the political spectrum—Democracy Now! and Mother Jones on the left; Crowder, Tucker, and others on the right; Rogan and Breaking Points in mixed territory—creates a mesh of "edge nodes" that publicly test the narratives of legacy institutions. This distributed interrogation system acts as a form of networked oversight and sense-checking.</p>

            <h4 className="font-semibold mt-5">Cross-tribal audience flow and epistemic independence</h4>
            <p className="text-muted-foreground">Audience-overlap data shows ideological silos eroding. Viewers increasingly consume both independent and legacy brands, achieving issue-by-issue independence rather than strict partisan alignment.</p>

            <h4 className="font-semibold mt-5">The rise of information density</h4>
            <p className="text-muted-foreground">Independent long-form video and audio creators now reach audiences comparable to or larger than many legacy brands. Their format—more exploratory, more dialogic—reflects a shift from sound-bite communication toward deeper narrative bandwidth.</p>

            <h3 className="text-lg font-semibold text-primary mt-8 pb-2 border-b-2 border-secondary inline-block">
              Staying vigilant: what to look out for
            </h3>
            <p className="text-muted-foreground">Understand the incentives: all outlets, from the smallest independent voices to the largest corporate machines, are subject to implicit bias of their teams or explicit distortion of the agendas they serve. A number of independent media outlets have hidden agendas, powered often by funding which is obscured from viewers. As independent media outlets grow, it becomes tempting to adopt corporate habits: advertising pressures, larger teams, corporate ownership. This is not necessarily always bad but adds risk.</p>

            <h3 className="text-lg font-semibold text-primary mt-8 pb-2 border-b-2 border-secondary inline-block">
              A New Pillar of Networked Sensemaking
            </h3>
            <p className="text-muted-foreground">The Zulu Digital Microscope is not merely media analytics; it is emerging as a piece of epistemic infrastructure for Networked Sensemaking. By quantifying how audience power, narrative formation, and media incentives have shifted from 2000 to 2025, it illuminates both the bottlenecks and the new leverage points of the collective brain. The result is a clearer view of where coherence is generated, where it is constrained, and how a more adaptive, truth-aligned information ecosystem may continue to evolve.</p>
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
