import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight, Check, UserPlus } from 'lucide-react';
import { INITIAL_DATA } from '@/data/mediaData';
import { supabase } from '@/integrations/supabase/client';
import welcomeIllustration from '@/assets/welcome-card-illustration.png';

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  onStartExploring?: () => void;
  onSignUpClick?: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({
  open,
  onOpenChange,
  userName,
  onStartExploring,
  onSignUpClick
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<'found' | 'not-found' | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [foundChannelName, setFoundChannelName] = useState('');

  // Get all channel names from static data
  const staticChannelNames = useMemo(() => {
    const names: string[] = [];
    Object.values(INITIAL_DATA).forEach(yearData => {
      yearData.brands.forEach(brand => {
        names.push(brand.name.toLowerCase());
      });
    });
    return names;
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchResult(null);
    
    const query = searchQuery.trim().toLowerCase();
    
    // Check static data first
    const foundInStatic = staticChannelNames.find(name => 
      name.includes(query) || query.includes(name)
    );
    
    if (foundInStatic) {
      setFoundChannelName(foundInStatic);
      setSearchResult('found');
      setIsSearching(false);
      return;
    }
    
    // Check database
    try {
      const { data, error } = await supabase
        .from('user_channels')
        .select('name')
        .ilike('name', `%${query}%`)
        .eq('status', 'approved')
        .limit(1);
      
      if (!error && data && data.length > 0) {
        setFoundChannelName(data[0].name);
        setSearchResult('found');
      } else {
        setSearchResult('not-found');
      }
    } catch (err) {
      setSearchResult('not-found');
    }
    
    setIsSearching(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    onStartExploring?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[470px] h-[680px] max-w-[95vw] max-h-[95vh] overflow-y-auto p-0 bg-background" 
        hideCloseButton
        overlayClassName="bg-black/50"
      >
        <div className="flex flex-col">
          {/* Illustration */}
          <div className="px-6 pt-6">
            <img 
              src={welcomeIllustration} 
              alt="Diverse group of media personalities illustration" 
              className="w-full h-auto"
            />
          </div>

          {/* Content - centered with max-width */}
          <div className="px-6 pt-4 pb-6 flex flex-col items-center">
            <div className="w-full max-w-[400px] flex flex-col gap-4">
              <div className="flex flex-col gap-[14px]">
                {/* Title */}
                <h2 className="text-[40px] font-bold" style={{ lineHeight: '1.1em' }}>
                  Where do you get your info from?
                </h2>

                {/* Body Copy */}
                <p className="text-[16px] text-muted-foreground" style={{ lineHeight: '1.7em' }}>
                  Welcome, <span className="font-semibold text-foreground">{userName}</span>. You now have access to the Zulu Digital Microscope — an interactive visualization mapping the media landscape, starting with the U.S.
                </p>
              </div>

              {/* Search Bar */}
              <div className="flex gap-2 mt-2">
                <Input
                  type="text"
                  placeholder="Search Channel"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchResult(null);
                  }}
                  onKeyPress={handleKeyPress}
                  className="flex-1 h-12 bg-muted border border-border rounded-full px-4 placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary"
                />
                <Button 
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-md"
                  size="icon"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Search Results */}
              {searchResult === 'found' && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                  <p className="text-sm text-green-700 dark:text-green-300">
                    <span className="font-semibold capitalize">{foundChannelName}</span> is already in our database!
                  </p>
                </div>
              )}

              {searchResult === 'not-found' && (
                <div className="flex flex-col gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    <span className="font-semibold">"{searchQuery}"</span> isn't in our database yet.
                  </p>
                  <Button 
                    onClick={() => {
                      onOpenChange(false);
                      onSignUpClick?.();
                    }}
                    variant="outline"
                    className="w-full border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create an account to add it
                  </Button>
                </div>
              )}

              {/* Skip Button */}
              <button
                onClick={handleClose}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors mt-2 underline underline-offset-2"
              >
                Skip and explore
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
