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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ContributorModalProps {
  open: boolean;
  onClose: () => void;
  defaultName: string;
  defaultEmail: string;
  country: string;
}

const ContributorModal: React.FC<ContributorModalProps> = ({
  open,
  onClose,
  defaultName,
  defaultEmail,
  country
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
      const { error } = await supabase.functions.invoke('send-contributor-email', {
        body: { name, email, message, country }
      });

      if (error) throw error;

      toast.success('Thank you! Your message has been sent.');
      onClose();
      setMessage('');
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error('Failed to send message. Please try again.');
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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">We need your help</DialogTitle>
        </DialogHeader>
        
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
