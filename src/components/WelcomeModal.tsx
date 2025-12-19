import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import welcomeIllustration from '@/assets/welcome-illustration.jpg';

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  onStartExploring?: () => void;
  onSignUpClick?: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({
  open,
  onOpenChange,
  userName,
  onStartExploring,
  onSignUpClick
}) => {
  const handleStartExploring = () => {
    onOpenChange(false);
    onStartExploring?.();
  };

  const handleVisitorClick = () => {
    onOpenChange(false);
    onSignUpClick?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2 flex-wrap">
            Welcome, {userName}!
            <Badge variant="outline" className="text-xs">Visitor</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Welcome Illustration */}
          <div className="w-full flex justify-center">
            <img 
              src={welcomeIllustration} 
              alt="People connecting and sharing ideas" 
              className="w-[90%] h-auto rounded-lg"
            />
          </div>

          {/* Mission */}
          <section>
            <h3 className="font-semibold text-sm mb-2 text-foreground">Our Mission</h3>
            <p className="text-sm text-muted-foreground">
              We're building a community-driven map of the global media landscape. 
            </p>
          </section>

          {/* Visitor Tier Info */}
          <section className="flex items-start gap-3 p-2.5 rounded-md bg-[#00564A]/10 border border-[#00564A]/30">
            <Eye className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">Visitor (You)</p>
              <p className="text-xs text-muted-foreground">Explore the visualization freely. <span className="font-semibold">Create an account</span> to become a Member.</p>
            </div>
          </section>

          {/* Create Account Button */}
          <Button onClick={handleVisitorClick} className="w-full" size="lg">
            Create Account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;