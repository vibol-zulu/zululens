import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface InsightsModalProps {
  open: boolean;
  onClose: () => void;
}

const InsightsModal: React.FC<InsightsModalProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-2xl text-primary">
            Networked independent media is engulfing the USA
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Issue 06 · December 2025 · Alex Asseily | Founder, Zulu Group</p>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 text-sm text-foreground leading-relaxed pr-4">
            <h3 className="text-lg font-semibold text-primary">Introduction</h3>
            <p>One of the most surprising bits of research we assembled during <a href="https://www.zulu.group/zephyr/issue-02" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">The Age of Wisdom series</a> centered on US Media from 2000 to 2025; it reveals a pivotal transition (in dynamism and audience size) from a handful of corporate media to a multitude of independent, networked, media sources over the course of 25 years. We believe this is good news for human information network health, and thus for truth and progress.</p>
            
            <p>This month we're doing a deeper dive on US media dynamics and on how this counter-intuitive trend impacted US media generally - incredible, also, that it only kicked into high gear in the last 5 years (essentially since Covid, though no causation implied).</p>
            
            <p>We are also revealing our <a href="https://zululens.lovable.app/" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">Zulu Digital Microscope</a> - an interactive visualization that maps the evolving media network landscape, starting with a comparison of the U.S. media ecosystem in 2000 and 2025. The project's goal is to build a shared epistemic infrastructure that makes the health of our information networks visible, measurable, and ultimately improvable. It will grow as new data and members are added.</p>

            <h3 className="text-lg font-semibold text-primary mt-8">Here's how we collected the data:</h3>
            <p><strong>Corporate media definition:</strong> large, pre‑internet legacy news outlets owned by major conglomerates (TV networks, cable news, big newspapers) with institutional newsrooms and corporate control.</p>
            <p><strong>Independent media definition:</strong> editorial independence, digital‑first news and commentary created and controlled by individual creators, very small teams, or nonprofits.</p>
            <p className="text-muted-foreground">We estimated a Unique Monthly Audience (UMA) for each outlet by combining publicly visible reach metrics from websites, YouTube, podcasts, and social platforms into a single cross-platform figure using a standardized 30-day rolling window, then applied probabilistic de-duplication factors based on each outlet's main platform and media type to reduce audience overlap and produce comparable reach estimates.</p>
            <p className="text-muted-foreground">For corporate conglomerates, UMA is first estimated for each sub‑brand (e.g., CNN, HLN, NBC News, TODAY), then a second de‑duplication pass is applied across the whole family to account for overlapping audiences, producing a single portfolio‑level figure rather than a simple sum, informed by sources like Nielsen TV ratings, Nielsen DMA reports, Audit Bureau of Circulation/Editor & Publisher, and AP/wire‑usage research.</p>

            <h3 className="text-lg font-semibold text-primary mt-8">Essential insights from the data</h3>

            <div className="space-y-5">
              <div>
                <h4 className="font-semibold">1. Diversity as an epistemic stabilizer</h4>
                <p className="text-xs text-muted-foreground italic mb-1">TL;DR: More different voices make it harder for false ideas to survive.</p>
                <p className="text-muted-foreground">Greater ideological diversity reduces the risk of collective error by increasing the number of independent perspectives within an information network. When many distinct voices operate in parallel, contradictions emerge earlier, false claims are harder to sustain, and more coherent explanations are more likely to survive through iterative error-correction rather than consensus by conformity.</p>
              </div>

              <div>
                <h4 className="font-semibold">2. Connectivity as a defense against disinformation</h4>
                <p className="text-xs text-muted-foreground italic mb-1">TL;DR: When many people are connected, lies fall apart faster.</p>
                <p className="text-muted-foreground">Dense connectivity between creators, platforms, and audiences strengthens resilience against coordinated disinformation. High link density accelerates feedback loops and multiplies points of scrutiny, making it far more difficult for concentrated interests to control narratives across a dispersed network than to influence a small number of centralized editorial gatekeepers.</p>
              </div>

              <div>
                <h4 className="font-semibold">3. The rise of the independent tier</h4>
                <p className="text-xs text-muted-foreground italic mb-1">TL;DR: Independent creators changed how information gets challenged and discussed.</p>
                <p className="text-muted-foreground">The expansion of independent media has structurally reshaped the epistemic dynamics of the information ecosystem. Long-form interviews, livestreams, and interactive comment cultures enable rapid, audience-driven feedback and reduce hierarchical gatekeeping, creating a more conversational and permeable environment than the tightly siloed media landscape of the early 2000s.</p>
              </div>

              <div>
                <h4 className="font-semibold">4. Long-form depth and epistemic openness</h4>
                <p className="text-xs text-muted-foreground italic mb-1">TL;DR: Longer conversations reveal more truth than short clips.</p>
                <p className="text-muted-foreground">Extended, minimally pre-packaged formats promote epistemic openness by requiring sustained coherence under prolonged audience scrutiny. These formats support exploratory reasoning, revision, and clarification over time, while legacy television news (constrained by time slots and advertising incentives) relies more heavily on short interviews and soundbites that limit contextual depth.</p>
              </div>

              <div>
                <h4 className="font-semibold">5. Divergent incentive structures</h4>
                <p className="text-xs text-muted-foreground italic mb-1">TL;DR: Who pays the bills shapes what gets said, and not.</p>
                <p className="text-muted-foreground">Different incentive architectures shape how truth claims are produced and constrained. Corporate media benefits from professional training and institutional stability but operates within ownership and advertising pressures that narrow narrative range, whereas independent media is primarily accountable to audiences and subscribers, encouraging adaptability and internal consistency over deference to external interests.</p>
              </div>

              <div>
                <h4 className="font-semibold">6. Decentralized accountability</h4>
                <p className="text-xs text-muted-foreground italic mb-1">TL;DR: Many independent watchdogs are stronger than one official one.</p>
                <p className="text-muted-foreground">A broad distribution of independent voices across the political spectrum functions as a decentralized system of accountability. These edge nodes publicly test and challenge institutional narratives, creating a form of networked oversight in which claims are continuously interrogated without reliance on a single authoritative arbiter.</p>
              </div>

              <div>
                <h4 className="font-semibold">7. Cross-tribal audience flow</h4>
                <p className="text-xs text-muted-foreground italic mb-1">TL;DR: People are mixing news sources and ideologies more than before.</p>
                <p className="text-muted-foreground">Audience behavior increasingly reflects cross-tribal consumption rather than fixed ideological alignment. As viewers engage with both independent and legacy sources, issue-by-issue evaluation replaces strict partisan loyalty, weakening informational silos and supporting greater epistemic independence.</p>
              </div>

              <div>
                <h4 className="font-semibold">8. Rising information density</h4>
                <p className="text-xs text-muted-foreground italic mb-1">TL;DR: Media now carries more depth per hour than it used to.</p>
                <p className="text-muted-foreground">The growth of independent long-form audio and video has increased the overall information density of the media environment. Exploratory and dialogic formats transmit greater contextual and narrative bandwidth than sound-bite media, and their ability to attract audiences comparable to legacy outlets signals a systemic shift toward deeper modes of communication.</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-primary mt-8">Staying vigilant: what to look out for</h3>
            <p className="text-muted-foreground">Understand the incentives: all outlets, from the smallest independent voices to the largest corporate machines, are subject to implicit bias of their teams or explicit distortion of the agendas they serve. A number of independent media outlets have hidden agendas, powered often by funding which is obscured from viewers. As independent media outlets grow, it becomes tempting to adopt corporate habits: advertising pressures, larger teams, corporate ownership. This is not necessarily always bad but adds risk.</p>

            <h3 className="text-lg font-semibold text-primary mt-8">A New Pillar of Networked Sensemaking</h3>
            <p className="text-muted-foreground">The Zulu Digital Microscope is not merely media analytics; it is emerging as a piece of epistemic infrastructure for Networked Sensemaking. By quantifying how audience power, narrative formation, and media incentives have shifted from 2000 to 2025, it illuminates both the bottlenecks and the new leverage points of the collective brain. The result is a clearer view of where coherence is generated, where it is constrained, and how a more adaptive, truth-aligned information ecosystem may continue to evolve.</p>

            <blockquote className="border-l-4 border-primary pl-4 my-6 italic text-muted-foreground">
              "Truth emerges not from unanimity, but from the friction of differing views"
              <footer className="text-xs mt-1 not-italic">— Inspired by John Stuart Mill's argument in On Liberty</footer>
            </blockquote>
          </div>
        </ScrollArea>
        
      </DialogContent>
    </Dialog>
  );
};

export default InsightsModal;
