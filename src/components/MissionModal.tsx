import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Target, Users, TrendingUp, Shield, Star } from 'lucide-react';

interface MissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MissionModal: React.FC<MissionModalProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Our Mission
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Goal Section */}
          <section>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Why We Exist</h3>
            <p className="text-muted-foreground leading-relaxed">
              The Zulu Digital Microscope aims to provide unprecedented transparency into the media landscape. 
              By visualizing audience reach and ownership structures, we empower citizens, researchers, and 
              policymakers to understand how information flows through society and who controls the narrative.
            </p>
          </section>

          {/* Community Section */}
          <section>
            <h3 className="text-lg font-semibold mb-2 text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Building a Community of Contributors
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              No single team can map the global media landscape alone. We're building a community of 
              passionate contributors who can help us expand coverage to every country. Whether you're 
              a media researcher, journalist, or simply someone who cares about media transparency, 
              your knowledge is invaluable.
            </p>
          </section>

          {/* User Tiers Section */}
          <section>
            <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Your Journey with Us
            </h3>
            
            <div className="space-y-3">
              {/* Tier 1 */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-bold">1</span>
                  <h4 className="font-medium">Visitor</h4>
                </div>
                <p className="text-sm text-muted-foreground pl-8">
                  Explore the visualization, view media data, and join our newsletter. Apply to become a contributor.
                </p>
              </div>

              {/* Tier 2 */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">2</span>
                  <h4 className="font-medium">Member</h4>
                </div>
                <p className="text-sm text-muted-foreground pl-8">
                  Create an account to join discussions, leave comments, and engage with the community.
                </p>
              </div>

              {/* Tier 3 */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-primary/40 flex items-center justify-center text-sm font-bold text-primary">3</span>
                  <h4 className="font-medium">Contributor</h4>
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground pl-8">
                  Approved contributors can add new media channels to the visualization, helping expand our dataset.
                </p>
              </div>

              {/* Tier 4 */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-primary/60 flex items-center justify-center text-sm font-bold text-primary-foreground">4</span>
                  <h4 className="font-medium">Moderator</h4>
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground pl-8">
                  Moderators review and approve channel submissions, ensuring data quality and accuracy.
                </p>
              </div>

              {/* Tier 5 */}
              <div className="border rounded-lg p-4 bg-primary/10 border-primary/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">5</span>
                  <h4 className="font-medium">Admin</h4>
                  <Star className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground pl-8">
                  Full access to manage users, datasets, and platform settings. Responsible for overall data integrity.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center pt-4 border-t">
            <p className="text-muted-foreground">
              Ready to contribute? Sign up and apply to become a contributor today.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MissionModal;
