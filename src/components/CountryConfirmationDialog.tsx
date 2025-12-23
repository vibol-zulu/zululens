import React, { useState, useEffect } from 'react';
import { MapPin, Globe, Loader2, Check, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface CountryConfirmationDialogProps {
  open: boolean;
  onConfirm: (country: string) => void;
  onCancel: () => void;
  currentCountry: string;
}

// Supported countries for the questionnaire
const SUPPORTED_COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'India',
  'Brazil',
  'Japan',
  'South Korea',
  'Mexico',
  'Italy',
  'Spain',
  'Netherlands',
  'Sweden',
  'Norway',
  'Denmark',
  'Finland',
  'Poland',
  'South Africa',
];

const CountryConfirmationDialog: React.FC<CountryConfirmationDialogProps> = ({
  open,
  onConfirm,
  onCancel,
  currentCountry,
}) => {
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState(currentCountry);
  const [isDetecting, setIsDetecting] = useState(true);
  const [detectionMessage, setDetectionMessage] = useState('');

  useEffect(() => {
    if (open) {
      detectCountry();
    }
  }, [open]);

  const detectCountry = async () => {
    setIsDetecting(true);
    setDetectionMessage('Detecting your location...');
    
    try {
      const { data, error } = await supabase.functions.invoke('detect-country');
      
      if (error) {
        console.error('Error detecting country:', error);
        setDetectionMessage('Could not detect location');
        setDetectedCountry(null);
        setSelectedCountry(currentCountry);
      } else if (data) {
        const detected = data.country;
        setDetectedCountry(data.detected ? detected : null);
        setDetectionMessage(data.message);
        
        // Only update selected country if detection was successful and country is supported
        if (data.detected && SUPPORTED_COUNTRIES.includes(detected)) {
          setSelectedCountry(detected);
        } else if (data.detected && !SUPPORTED_COUNTRIES.includes(detected)) {
          // Detected but not supported - keep current
          setDetectionMessage(`${detected} detected but using closest supported region`);
          setSelectedCountry(currentCountry);
        } else {
          setSelectedCountry(currentCountry);
        }
      }
    } catch (err) {
      console.error('Failed to detect country:', err);
      setDetectionMessage('Location detection unavailable');
      setDetectedCountry(null);
      setSelectedCountry(currentCountry);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedCountry);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Confirm Your Country
          </DialogTitle>
          <DialogDescription>
            The questionnaire will generate questions relevant to your country's political landscape.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Detection Status */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isDetecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{detectionMessage}</span>
              </>
            ) : detectedCountry ? (
              <>
                <MapPin className="h-4 w-4 text-green-500" />
                <span>Detected: <strong>{detectedCountry}</strong></span>
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{detectionMessage}</span>
              </>
            )}
            {!isDetecting && (
              <Button
                variant="ghost"
                size="sm"
                onClick={detectCountry}
                className="h-6 w-6 p-0 ml-auto"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Country Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select your country:</label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>
                    <span className="flex items-center gap-2">
                      {country}
                      {country === detectedCountry && (
                        <Check className="h-3 w-3 text-green-500" />
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Info message */}
          <p className="text-xs text-muted-foreground">
            Questions will be tailored to political topics and debates in{' '}
            <strong>{selectedCountry}</strong>.
          </p>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isDetecting}>
            <Check className="h-4 w-4 mr-2" />
            Confirm & Start
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CountryConfirmationDialog;
