import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Sparkles, Star } from 'lucide-react';

interface ContributorCelebrationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
}

const ContributorCelebration: React.FC<ContributorCelebrationProps> = ({
  open,
  onOpenChange,
  userName
}) => {
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  useEffect(() => {
    if (open && !hasTriggeredConfetti) {
      // Trigger confetti explosion
      const duration = 3000;
      const animationEnd = Date.now() + duration;

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        // Confetti from the left
        confetti({
          particleCount: Math.floor(particleCount),
          startVelocity: 30,
          spread: 360,
          origin: {
            x: randomInRange(0.1, 0.3),
            y: Math.random() - 0.2
          },
          colors: ['#00564A', '#F8D4C8', '#FFD700', '#FF6B6B', '#4ECDC4']
        });

        // Confetti from the right
        confetti({
          particleCount: Math.floor(particleCount),
          startVelocity: 30,
          spread: 360,
          origin: {
            x: randomInRange(0.7, 0.9),
            y: Math.random() - 0.2
          },
          colors: ['#00564A', '#F8D4C8', '#FFD700', '#FF6B6B', '#4ECDC4']
        });
      }, 250);

      setHasTriggeredConfetti(true);

      return () => clearInterval(interval);
    }
  }, [open, hasTriggeredConfetti]);

  // Reset confetti trigger when modal closes
  useEffect(() => {
    if (!open) {
      setHasTriggeredConfetti(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg text-center">
        <DialogHeader className="items-center">
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center mx-auto">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            <Star className="w-5 h-5 text-yellow-400 absolute -bottom-1 -left-1 animate-pulse" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold">
            🎉 Congratulations, {userName}! 🎉
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            You've reached <span className="font-semibold text-primary">10 approved submissions</span>!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-base">New Member status:</span>
            <Badge className="text-base px-3 py-1 bg-primary/20 text-primary border border-primary/30 shimmer-text">Contributor</Badge>
          </div>
        </div>

        <Button onClick={() => onOpenChange(false)} className="w-full" size="lg">
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ContributorCelebration;
