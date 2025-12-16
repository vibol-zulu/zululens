import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';
interface MissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignUpClick?: () => void;
  onContributorClick?: () => void;
}
const MissionModal: React.FC<MissionModalProps> = ({
  open,
  onOpenChange,
  onSignUpClick,
  onContributorClick
}) => {
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="h-6 w-6" style={{
            color: '#F8D4C8'
          }} />
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
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              Building a Community of Contributors
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              No single team can map the global media landscape alone. We're building a community of 
              passionate contributors who can help us expand coverage to every country and refine data 
              accuracy over time. Whether you're a media researcher, journalist, or simply someone who 
              cares about media transparency, your knowledge is invaluable.
            </p>
          </section>

          {/* User Tiers Section */}
          <section>
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Your Journey with Us
            </h3>
            
            <div className="space-y-3">
              {/* Tier 1 */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-medium mb-1">Visitor</h4>
                <p className="text-sm text-muted-foreground">
                  Explore the visualization. Create an account to become a Member.      
                </p>
              </div>

              {/* Tier 2 */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-medium mb-1">Member</h4>
                <p className="text-sm text-muted-foreground">
                  Suggest new channels and join discussions. 
Earn Contributor status by getting 20 suggestions approved.



                </p>
              </div>

              {/* Tier 3 */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-medium mb-1">Contributor</h4>
                <p className="text-sm text-muted-foreground">
                  Consistent Contributors will be invited to become Moderators!
                </p>
              </div>

              {/* Tier 4 */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-medium mb-1">Moderator</h4>
                <p className="text-sm text-muted-foreground">
                  Moderators review and approve channel submissions, ensuring data quality and accuracy.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center pt-4 border-t space-y-4">
            <p className="text-muted-foreground">
              Ready to contribute? Sign up and apply to become a contributor today.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => {
              onOpenChange(false);
              onSignUpClick?.();
            }}>
                Sign Up
              </Button>
              <Button onClick={() => {
              onOpenChange(false);
              onContributorClick?.();
            }}>
                Become a Contributor
              </Button>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>;
};
export default MissionModal;