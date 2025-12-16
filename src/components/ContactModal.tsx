import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill name and email when user is logged in or modal opens
  useEffect(() => {
    if (open) {
      if (user) {
        setEmail(user.email || '');
        setName(user.user_metadata?.full_name || '');
      } else {
        setName('');
        setEmail('');
      }
      setMessage('');
      setError('');
      setSubmitted(false);
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('send-contact-email', {
        body: { name, email, message }
      });

      if (fnError) {
        throw fnError;
      }

      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setName('');
        setEmail('');
        setMessage('');
      }, 3000);
    } catch (err: any) {
      console.error('Contact form error:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary text-center">Contact Us</DialogTitle>
        </DialogHeader>
        
        {!submitted ? (
          <>
            <p className="text-center text-muted-foreground text-sm">
              Questions? Reach out to us directly.
            </p>
            
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <Input 
                type="text" 
                placeholder="Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
              <Input 
                type="email" 
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <Textarea 
                placeholder="Message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                required
              />
              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✓</div>
            <h3 className="text-lg font-semibold text-primary">Message Sent!</h3>
            <p className="text-muted-foreground mt-2">Thank you for reaching out. We'll get back to you soon.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContactModal;
