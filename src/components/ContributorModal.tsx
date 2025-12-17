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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` }
      });
      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      toast.error('Google sign in failed');
    } finally {
      setIsGoogleLoading(false);
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

          <Button 
            type="button" 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or with email</span>
            </div>
          </div>
          
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
