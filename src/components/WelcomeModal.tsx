import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import welcomeIllustration from '@/assets/welcome-card-illustration.png';

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
}) => {
  const handleStartExploring = () => {
    onOpenChange(false);
    onStartExploring?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[470px] max-w-[95vw] max-h-[95vh] overflow-y-auto p-0 bg-background" 
        hideCloseButton
        overlayClassName="bg-black/50"
      >
        <div className="flex flex-col">
          {/* Illustration */}
          <div className="px-6 py-6 flex justify-center">
            <img 
              src={welcomeIllustration} 
              alt="Diverse group of media personalities illustration" 
              className="w-[90%] h-auto"
            />
          </div>

          {/* Content - centered with max-width */}
          <div className="px-6 pb-6 flex flex-col items-center">
            <div className="w-full max-w-[400px] flex flex-col gap-4">
              <div className="flex flex-col gap-[14px]">
                {/* Title */}
                <h2 className="text-[40px] font-bold text-black dark:text-white" style={{ lineHeight: '1.1em' }}>
                  Where do you get your info from?
                </h2>

                {/* Body Copy */}
                <p className="text-[16px] text-muted-foreground" style={{ lineHeight: '1.7em' }}>
                  Welcome, <span className="font-semibold text-foreground">{userName}</span>. You now have access to the Zulu Digital Microscope — an <span className="font-semibold italic text-foreground">interactive visualization</span> mapping the media landscape, starting with the U.S.
                </p>
              </div>

              {/* Start Exploring Button */}
              <Button 
                onClick={handleStartExploring}
                className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-semibold shadow-lg"
              >
                Start Exploring
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
