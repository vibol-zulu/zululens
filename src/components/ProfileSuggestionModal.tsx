import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ProfileSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  channelName: string;
  fieldName: string;
  fieldLabel: string;
  currentValue: string | null;
  isTextarea?: boolean;
}

const ProfileSuggestionModal: React.FC<ProfileSuggestionModalProps> = ({
  isOpen,
  onClose,
  channelId,
  channelName,
  fieldName,
  fieldLabel,
  currentValue,
  isTextarea = false,
}) => {
  const [suggestedValue, setSuggestedValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!suggestedValue.trim()) {
      toast.error('Please enter a value');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be signed in to suggest edits');
        return;
      }

      const { error } = await supabase
        .from('channel_profile_suggestions')
        .insert({
          channel_id: channelId,
          suggested_by: user.id,
          field_name: fieldName,
          suggested_value: suggestedValue.trim(),
          current_value: currentValue,
        });

      if (error) throw error;

      toast.success('Thank you! Your suggestion has been submitted for review.');
      setSuggestedValue('');
      onClose();
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      toast.error('Failed to submit suggestion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Suggest {fieldLabel}</DialogTitle>
          <DialogDescription>
            Suggest a value for {fieldLabel} for {channelName}. Your suggestion will be reviewed by a moderator.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {currentValue && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Current Value</Label>
              <p className="text-sm bg-muted/50 p-2 rounded border text-muted-foreground">
                {currentValue}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="suggested-value">
              {currentValue ? 'Suggested New Value' : 'Suggested Value'}
            </Label>
            {isTextarea ? (
              <Textarea
                id="suggested-value"
                value={suggestedValue}
                onChange={(e) => setSuggestedValue(e.target.value)}
                placeholder={`Enter ${fieldLabel.toLowerCase()}...`}
                rows={4}
                maxLength={2000}
              />
            ) : (
              <Input
                id="suggested-value"
                value={suggestedValue}
                onChange={(e) => setSuggestedValue(e.target.value)}
                placeholder={`Enter ${fieldLabel.toLowerCase()}...`}
                maxLength={500}
              />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Suggestion
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSuggestionModal;