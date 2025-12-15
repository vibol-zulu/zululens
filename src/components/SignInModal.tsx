import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'signup';
}

const SignInModal: React.FC<SignInModalProps> = ({ open, onClose, defaultTab = 'signin' }) => {
  const { toast } = useToast();
  const { user, signIn, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(defaultTab);
  
  // Sign in state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Sign up state
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpFullName, setSignUpFullName] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Reset to default tab when modal opens
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  // Close modal when user signs in successfully
  useEffect(() => {
    if (user && open) {
      onClose();
    }
  }, [user, open, onClose]);

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({ title: 'Please enter email and password', variant: 'destructive' });
      return;
    }
    
    setIsSigningIn(true);
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({ title: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Signed in successfully' });
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast({ title: 'Sign in failed', variant: 'destructive' });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignUp = async () => {
    if (!signUpEmail || !signUpPassword) {
      toast({ title: 'Please enter email and password', variant: 'destructive' });
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    if (signUpPassword.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
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
          data: {
            full_name: signUpFullName
          }
        }
      });
      
      if (error) {
        toast({ title: error.message, variant: 'destructive' });
      } else {
        toast({ 
          title: 'Account created!', 
          description: 'You can now sign in with your credentials.'
        });
        setSignUpEmail('');
        setSignUpPassword('');
        setSignUpConfirmPassword('');
        setSignUpFullName('');
        setActiveTab('signin');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      toast({ title: 'Sign up failed', variant: 'destructive' });
    } finally {
      setIsSigningUp(false);
    }
  };

  if (authLoading) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-md">
          <div className="p-6 flex items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {activeTab === 'signin' ? 'Sign In' : 'Create Account'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Sign in to access comments, contributor, or admin features.
            </p>
            
            <form onSubmit={(e) => { e.preventDefault(); handleSignIn(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <DialogFooter className="flex gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSigningIn}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSigningIn}>
                  {isSigningIn ? 'Signing in...' : 'Sign In'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Create an account to join discussions and leave comments.
            </p>
            
            <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name (optional)</Label>
                <Input
                  id="signup-name"
                  type="text"
                  value={signUpFullName}
                  onChange={(e) => setSignUpFullName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm">Confirm Password</Label>
                <Input
                  id="signup-confirm"
                  type="password"
                  value={signUpConfirmPassword}
                  onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                />
              </div>

              <DialogFooter className="flex gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSigningUp}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSigningUp}>
                  {isSigningUp ? 'Creating account...' : 'Create Account'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SignInModal;
