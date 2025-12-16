import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, MessageSquare, PenLine, Shield } from 'lucide-react';
interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
}
const WelcomeModal: React.FC<WelcomeModalProps> = ({
  open,
  onOpenChange,
  userName
}) => {
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2 flex-wrap">
            Welcome, {userName}!
            <Badge variant="outline" className="text-xs">Visitor</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Mission */}
          <section>
            <h3 className="font-semibold text-sm mb-2 text-foreground">Our Mission</h3>
            <p className="text-sm text-muted-foreground">
              We’re building a community-driven map of the global media landscape. 
            </p>
          </section>

          {/* Tier Progression */}
          <section>
            <h3 className="font-semibold text-sm mb-3 text-foreground">Grow With Us</h3>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-2.5 rounded-md bg-muted/50 border border-border/50">
                <Eye className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Visitor (You)</p>
                  <p className="text-xs text-muted-foreground">Explore the visualization freely. Create an account to become a Member.      </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded-md bg-background border border-border/50">
                <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Member</p>
                  <p className="text-xs text-muted-foreground"> Add channel suggestions, join discussions, and earn Contributor status with 20 approved suggestions.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded-md bg-background border border-border/50">
                <PenLine className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Contributor</p>
                  <p className="text-xs text-muted-foreground"> Consistent contributors will be invited to become Moderators!</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded-md bg-background border border-border/50">
                <Shield className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Moderator</p>
                  <p className="text-xs text-muted-foreground">Help maintain quality and integrity by reviewing, verifying, and approving contributions from the community.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <Button onClick={() => onOpenChange(false)} className="w-full mt-2">
          Start Exploring
        </Button>
      </DialogContent>
    </Dialog>;
};
export default WelcomeModal;