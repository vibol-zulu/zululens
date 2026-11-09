import { useEffect, useState } from 'react';
import { PauseCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { disabledFeatures, featureDisabledEvent, type DisabledFeature } from '@/lib/temporarilyDisabledFeatures';

export default function TemporarilyDisabledModal() {
  const [feature, setFeature] = useState<DisabledFeature | null>(null);

  useEffect(() => {
    const onDisabled = (event: Event) => {
      const requestedFeature = (event as CustomEvent<DisabledFeature>).detail;
      if (Object.prototype.hasOwnProperty.call(disabledFeatures, requestedFeature)) {
        setFeature(requestedFeature);
      }
    };
    window.addEventListener(featureDisabledEvent, onDisabled);
    return () => window.removeEventListener(featureDisabledEvent, onDisabled);
  }, []);

  return (
    <Dialog open={feature !== null} onOpenChange={(open) => { if (!open) setFeature(null); }}>
      <DialogContent className="max-w-md z-[100]" overlayClassName="z-[100]">
        <DialogHeader>
          <PauseCircle className="h-7 w-7 text-muted-foreground mb-2" aria-hidden="true" />
          <DialogTitle>Feature temporarily disabled</DialogTitle>
          <DialogDescription className="pt-2">
            {feature ? disabledFeatures[feature] : 'This feature'} is temporarily unavailable because its external service connections have been disabled.
            {' '}Please try again once these connections are restored.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setFeature(null)}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}