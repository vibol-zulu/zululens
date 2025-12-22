import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();
  const isAuthenticated = !!user;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl text-primary">
            Our Mission
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] px-6 pb-6">
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <h4 className="font-semibold text-foreground">Why We Exist</h4>
            <p>
              The Zulu Digital Microscope (by <a href="https://www.zulu.group" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">Zulu Group</a>) aims to provide unprecedented transparency into the media landscape. 
              By visualizing audience reach and ownership structures, we empower citizens, researchers, and 
              policymakers to understand how information flows through society and who controls the narrative.
            </p>

            <h4 className="font-semibold text-foreground mt-6">Building a Community of Contributors</h4>
            <p>
              No single team can map the global media landscape alone. We're building a community of 
              passionate contributors who can help us expand coverage to every country and refine data 
              accuracy over time. Whether you're a media researcher, journalist, or simply someone who 
              cares about media transparency, your knowledge is invaluable.
            </p>

            <h4 className="font-semibold text-foreground mt-6">Your Journey with Us</h4>
            
            <div className="space-y-3 mt-4">
              <div>
                <h5 className="font-medium text-foreground">Visitor</h5>
                <p>Explore the visualization. Create an account to become a Member.</p>
              </div>

              <div>
                <h5 className="font-medium text-foreground">Member</h5>
                <p>Suggest new channels and join discussions. Earn Contributor status by getting 10 suggestions approved.</p>
              </div>

              <div>
                <h5 className="font-medium text-foreground">Contributor</h5>
                <p>Contributors can apply to become Moderators and help review submissions!</p>
              </div>

              <div>
                <h5 className="font-medium text-foreground">Moderator</h5>
                <p>Moderators review and approve channel submissions, ensuring data quality and accuracy.</p>
              </div>
            </div>

            {/* CTA - Only show for Tier 1 (unauthenticated) users */}
            {!isAuthenticated && (
              <div className="text-center pt-6 mt-6 border-t">
                <p className="mb-4">Ready to join our community?</p>
                <Button onClick={() => {
                  onOpenChange(false);
                  onSignUpClick?.();
                }}>
                  Create an account
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 pt-0 flex justify-center">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MissionModal;
