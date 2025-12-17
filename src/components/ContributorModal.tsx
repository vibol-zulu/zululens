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
}) => {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Sign-up form state for Tier 1 users
  const [signUpEmail, setSignUpEmail] = useState(defaultEmail);
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpFullName, setSignUpFullName] = useState(defaultName);
  const [isSigningUp, setIsSigningUp] = useState(false);
  

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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signUpEmail || !signUpPassword) {
      toast.error('Please enter email and password');
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (signUpPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setIsSigningUp(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: signUpFullName }
        }
      });
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Account created! You are now signed in.');
        onClose();
      }
    } catch (error) {
      console.error('Sign up error:', error);
      toast.error('Sign up failed. Please try again.');
    } finally {
      setIsSigningUp(false);
    }
  };


  // Reset form when modal opens with new defaults
  React.useEffect(() => {
    if (open) {
      setName(defaultName);
      setEmail(defaultEmail);
      setSignUpEmail(defaultEmail);
      setSignUpFullName(defaultName);
      setSignUpPassword('');
      setSignUpConfirmPassword('');
    }
  }, [open, defaultName, defaultEmail]);

  // Tier 1 (unauthenticated) view - embedded sign-up form
  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {customTitle || 'Join as a Member'}
            </DialogTitle>
          </DialogHeader>
          
          <p className="text-sm text-muted-foreground">
            {customMessage || `Create a free account to become a Member and start contributing to the ${country} media landscape data.`}
          </p>

          
          <form onSubmit={handleSignUp} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="signup-name">Full Name (optional)</Label>
              <Input
                id="signup-name"
                type="text"
                value={signUpFullName}
                onChange={(e) => setSignUpFullName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-confirm">Confirm Password</Label>
              <Input
                id="signup-confirm"
                type="password"
                value={signUpConfirmPassword}
                onChange={(e) => setSignUpConfirmPassword(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isSigningUp} className="flex-1">
                {isSigningUp ? 'Creating...' : 'Create Account'}
              </Button>
            </div>
          </form>
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
