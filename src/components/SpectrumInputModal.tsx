import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import perplexityLogo from '@/assets/perplexity-color.svg';

interface SpectrumInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (result: PoliticalLeanResult) => void;
  userName: string;
  user: User | null;
}

export interface PoliticalLeanResult {
  channels: Array<{
    name: string;
    politicalLean: string;
    reasoning: string;
  }>;
  overallPosition: {
    label: string;
    numericValue: number;
    description: string;
  };
  diversityScore: string;
  diversityNote: string;
}

const SpectrumInputModal: React.FC<SpectrumInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userName,
  user
}) => {
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Sign-up form state
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpFullName, setSignUpFullName] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  const addChannel = (channelName: string) => {
    const trimmed = channelName.trim();
    if (trimmed && !selectedChannels.includes(trimmed)) {
      setSelectedChannels(prev => [...prev, trimmed]);
    }
    setSearchQuery('');
  };

  const removeChannel = (channelName: string) => {
    setSelectedChannels(prev => prev.filter(c => c !== channelName));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      addChannel(searchQuery);
    }
  };

  const handleSubmit = async () => {
    if (selectedChannels.length === 0) return;

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-political-lean', {
        body: { channels: selectedChannels }
      });

      if (error) {
        throw new Error(error.message || 'Failed to analyze');
      }

      if (data?.analysis) {
        onSubmit(data.analysis);
        handleClose();
      } else {
        throw new Error('No analysis returned');
      }
    } catch (err) {
      console.error('Error analyzing political lean:', err);
      toast.error('Failed to analyze your news sources. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      const { error } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: signUpFullName
          }
        }
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Account created! You can now analyze your political position.');
        // Clear the sign-up form
        setSignUpEmail('');
        setSignUpPassword('');
        setSignUpConfirmPassword('');
        setSignUpFullName('');
      }
    } catch (err) {
      console.error('Sign up error:', err);
      toast.error('Failed to create account. Please try again.');
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleClose = () => {
    setSelectedChannels([]);
    setSearchQuery('');
    setIsAnalyzing(false);
    setSignUpEmail('');
    setSignUpPassword('');
    setSignUpConfirmPassword('');
    setSignUpFullName('');
    onClose();
  };

  // Show sign-up gate for Tier 1 users
  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md max-h-[85vh] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="text-xl">Create an Account</DialogTitle>
            <DialogDescription>
              Sign up to discover your political position on the media spectrum using AI analysis.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSignUp} className="px-6 py-4 space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Full Name"
                value={signUpFullName}
                onChange={(e) => setSignUpFullName(e.target.value)}
                required
                disabled={isSigningUp}
              />
            </div>
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                required
                disabled={isSigningUp}
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                required
                disabled={isSigningUp}
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Confirm Password"
                value={signUpConfirmPassword}
                onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                required
                disabled={isSigningUp}
              />
            </div>
          </form>

          <div className="p-6 border-t bg-muted/30 flex items-center justify-between">
            <Button variant="outline" onClick={handleClose} disabled={isSigningUp}>
              Cancel
            </Button>
            <Button 
              onClick={handleSignUp}
              disabled={isSigningUp || !signUpEmail || !signUpPassword || !signUpFullName}
            >
              {isSigningUp ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl">Where Do You Get Your News?</DialogTitle>
          <DialogDescription>
            Type any news source, podcast, or channel you listen to regularly. We'll use AI to analyze your political position.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Type a channel name and press Enter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9 pr-9"
              disabled={isAnalyzing}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            Examples: CNN, Fox News, Joe Rogan, NYT, Breaking Points, Ben Shapiro, Rachel Maddow...
          </p>

          {/* Selected Channels List */}
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">
              {selectedChannels.length === 0 
                ? "Your channels will appear here" 
                : `${selectedChannels.length} channel${selectedChannels.length !== 1 ? 's' : ''} added`}
            </p>
            <ScrollArea className="h-[180px]">
              <div className="space-y-2">
                {selectedChannels.map(channel => (
                  <div 
                    key={channel}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  >
                    <span className="text-sm">{channel}</span>
                    <button
                      onClick={() => removeChannel(channel)}
                      className="text-muted-foreground hover:text-foreground p-1"
                      disabled={isAnalyzing}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="p-6 border-t bg-muted/30 flex items-center justify-between">
          <Button variant="outline" onClick={handleClose} disabled={isAnalyzing}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={selectedChannels.length === 0 || isAnalyzing}
            variant="outline"
            className="gap-2 text-foreground"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <img src={perplexityLogo} alt="Perplexity" className="h-4 w-4" />
                Show My Position
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpectrumInputModal;
