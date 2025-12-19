import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, Loader2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { BrandData } from '@/types/media';
import { getSpectrumBinIndex } from '@/lib/BrandCircle';

interface SpectrumInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (result: PoliticalLeanResult) => void;
  userName: string;
  user: User | null;
  availableChannels: BrandData[];
  onRequestAddChannel?: () => void;
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
  selectedChannelIds: string[];
}

// Map bin index (0-4) to numeric value (-100 to +100)
const binToNumericValue = (binIndex: number): number => {
  // bin 0 = Far Left = -100
  // bin 1 = Left = -50
  // bin 2 = Center = 0
  // bin 3 = Right = +50
  // bin 4 = Far Right = +100
  return (binIndex - 2) * 50;
};

// Map bin index to label
const binToLabel = (binIndex: number): string => {
  switch (binIndex) {
    case 0: return 'Far Left';
    case 1: return 'Left / Progressive';
    case 2: return 'Center';
    case 3: return 'Right / Conservative';
    case 4: return 'Far Right';
    default: return 'Center';
  }
};

const SpectrumInputModal: React.FC<SpectrumInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userName,
  user,
  availableChannels,
  onRequestAddChannel
}) => {
  const [selectedChannels, setSelectedChannels] = useState<BrandData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Sign-up form state
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpFullName, setSignUpFullName] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Filter available channels based on search query (excluding already selected)
  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return availableChannels
      .filter(channel => 
        channel.name.toLowerCase().includes(query) &&
        !selectedChannels.some(sc => sc.id === channel.id)
      )
      .slice(0, 10); // Limit to 10 results
  }, [searchQuery, availableChannels, selectedChannels]);

  const addChannel = (channel: BrandData) => {
    if (!selectedChannels.some(c => c.id === channel.id)) {
      setSelectedChannels(prev => [...prev, channel]);
    }
    setSearchQuery('');
  };

  const removeChannel = (channelId: string) => {
    setSelectedChannels(prev => prev.filter(c => c.id !== channelId));
  };

  // Calculate political position locally based on selected channels
  const calculateLocalPosition = (): PoliticalLeanResult => {
    if (selectedChannels.length === 0) {
      return {
        channels: [],
        overallPosition: { label: 'Center', numericValue: 0, description: '' },
        diversityScore: 'low',
        diversityNote: '',
        selectedChannelIds: []
      };
    }

    // Get bin indices for all selected channels
    const binIndices = selectedChannels.map(c => getSpectrumBinIndex(c.politicalLean));
    
    // Calculate average bin index
    const avgBinIndex = binIndices.reduce((sum, idx) => sum + idx, 0) / binIndices.length;
    const roundedBinIndex = Math.round(avgBinIndex);
    
    // Convert to numeric value
    const numericValue = binToNumericValue(avgBinIndex);
    const label = binToLabel(roundedBinIndex);
    
    // Calculate diversity based on spread of bin indices
    const uniqueBins = new Set(binIndices);
    let diversityScore: 'low' | 'medium' | 'high' = 'low';
    let diversityNote = '';
    
    if (uniqueBins.size >= 4) {
      diversityScore = 'high';
      diversityNote = 'You consume news from across the political spectrum.';
    } else if (uniqueBins.size >= 2) {
      diversityScore = 'medium';
      diversityNote = 'You have some diversity in your news sources.';
    } else {
      diversityScore = 'low';
      diversityNote = 'Your news sources are fairly homogeneous politically.';
    }

    return {
      channels: selectedChannels.map(c => ({
        name: c.name,
        politicalLean: c.politicalLean,
        reasoning: `Based on dataset classification: ${c.politicalLean}`
      })),
      overallPosition: {
        label,
        numericValue,
        description: `Based on your ${selectedChannels.length} selected news source${selectedChannels.length !== 1 ? 's' : ''}, your media diet leans ${label.toLowerCase()}.`
      },
      diversityScore,
      diversityNote,
      selectedChannelIds: selectedChannels.map(c => c.id)
    };
  };

  const handleSubmit = () => {
    if (selectedChannels.length === 0) return;

    setIsAnalyzing(true);
    
    // Use local calculation instead of AI
    setTimeout(() => {
      const result = calculateLocalPosition();
      onSubmit(result);
      handleClose();
      setIsAnalyzing(false);
    }, 500); // Small delay for UX
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

  const handleAddChannelRequest = () => {
    handleClose();
    if (onRequestAddChannel) {
      onRequestAddChannel();
    }
  };

  // Check if search query matches no channels
  const noMatchesFound = searchQuery.trim().length >= 2 && filteredChannels.length === 0;

  // Show sign-up gate for Tier 1 users
  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md max-h-[85vh] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="text-xl">Create an Account</DialogTitle>
            <DialogDescription>
              Sign up to discover your political position on the media spectrum.
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
            Select the news sources, podcasts, or channels you consume regularly from our dataset. Your position will be calculated based on your selections.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for a channel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Search Results Dropdown */}
          {searchQuery.trim() && (
            <div className="mt-2 border rounded-md bg-card shadow-md max-h-[200px] overflow-y-auto">
              {filteredChannels.length > 0 ? (
                filteredChannels.map(channel => (
                  <button
                    key={channel.id}
                    onClick={() => addChannel(channel)}
                    className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between text-sm"
                  >
                    <span>{channel.name}</span>
                    <span className="text-xs text-muted-foreground">{channel.politicalLean}</span>
                  </button>
                ))
              ) : noMatchesFound ? (
                <div className="p-3 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    "{searchQuery}" is not in our dataset.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddChannelRequest}
                    className="gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Submit this channel
                  </Button>
                </div>
              ) : null}
            </div>
          )}
          
          <p className="text-xs text-muted-foreground mt-2">
            Only channels in our current dataset can be selected. If you don't see a channel, you can submit it for review.
          </p>

          {/* Selected Channels List */}
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">
              {selectedChannels.length === 0 
                ? "Your channels will appear here" 
                : `${selectedChannels.length} channel${selectedChannels.length !== 1 ? 's' : ''} selected`}
            </p>
            <ScrollArea className="h-[180px]">
              <div className="space-y-2">
                {selectedChannels.map(channel => (
                  <div 
                    key={channel.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm">{channel.name}</span>
                      <span className="text-xs text-muted-foreground">{channel.politicalLean}</span>
                    </div>
                    <button
                      onClick={() => removeChannel(channel.id)}
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
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Calculating...
              </>
            ) : (
              'Show My Position'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpectrumInputModal;
