import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus } from 'lucide-react';

interface ContributorModalProps {
  open: boolean;
  onClose: () => void;
  defaultName: string;
  defaultEmail: string;
  country: string;
  customTitle?: string;
  customMessage?: string;
  isAuthenticated?: boolean;
  onSignUpClick?: () => void;
}

const ContributorModal: React.FC<ContributorModalProps> = ({
  open,
  onClose,
  defaultName,
  defaultEmail,
  country,
  customTitle,
  customMessage,
  isAuthenticated = false,
  onSignUpClick
}) => {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSending(true);
    
    try {
      // Save to database
      const { error: dbError } = await supabase
        .from('contributor_requests')
        .insert({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          country: country
        });

      if (dbError) throw dbError;

      // Also send email notification via FormSubmit
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('message', message);
      formData.append('country', country);
      formData.append('_subject', `New Contributor Request for ${country}`);

      await fetch('https://formsubmit.co/ajax/vibol@zulu.group', {
        method: 'POST',
        body: formData,
      });

      toast.success('Thank you! Your request has been submitted.');
      onClose();
      setMessage('');
    } catch (error: unknown) {
      console.error('Error sending message:', error);
      toast.error('Failed to send request. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Reset form when modal opens with new defaults
  React.useEffect(() => {
    if (open) {
      setName(defaultName);
      setEmail(defaultEmail);
    }
  }, [open, defaultName, defaultEmail]);

  // Tier 1 (unauthenticated) view - encourage account creation
  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {customTitle || 'Join as a Member'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <p className="text-muted-foreground mb-6">
              {customMessage || `Create a free account to become a Member and start contributing to the ${country} media landscape data.`}
            </p>
            <Button onClick={() => {
              onClose();
              onSignUpClick?.();
            }} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Create Account
            </Button>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Authenticated user view - contributor request form
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {customTitle || 'We need your help'}
          </DialogTitle>
        </DialogHeader>
        
        {customMessage && (
          <p className="text-sm text-muted-foreground">{customMessage}</p>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="contributor-name">Name</Label>
            <Input
              id="contributor-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={defaultName || 'Your name'}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contributor-email">Email</Label>
            <Input
              id="contributor-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={defaultEmail || 'your@email.com'}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contributor-message">Message</Label>
            <Textarea
              id="contributor-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us how you can help."
              rows={4}
            />
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={sending}>
              Cancel
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? 'Sending...' : 'Become a contributor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContributorModal;
