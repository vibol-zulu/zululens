import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X } from 'lucide-react';
import { BrandData } from '@/types/media';

interface SpectrumInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (selectedChannelIds: string[]) => void;
  allChannels: BrandData[];
  userName: string;
}

const SpectrumInputModal: React.FC<SpectrumInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  allChannels,
  userName
}) => {
  const [selectedChannels, setSelectedChannels] = useState<BrandData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allChannels
      .filter(channel => 
        channel.name.toLowerCase().includes(query) &&
        !selectedChannels.some(s => s.id === channel.id)
      )
      .slice(0, 8);
  }, [allChannels, searchQuery, selectedChannels]);

  const addChannel = (channel: BrandData) => {
    if (!selectedChannels.some(s => s.id === channel.id)) {
      setSelectedChannels(prev => [...prev, channel]);
    }
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const removeChannel = (channelId: string) => {
    setSelectedChannels(prev => prev.filter(c => c.id !== channelId));
  };

  const handleSubmit = () => {
    if (selectedChannels.length > 0) {
      onSubmit(selectedChannels.map(c => c.id));
    }
  };

  const handleClose = () => {
    setSelectedChannels([]);
    setSearchQuery('');
    setShowSuggestions(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredSuggestions.length > 0) {
      e.preventDefault();
      addChannel(filteredSuggestions[0]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl">Where Do You Get Your News?</DialogTitle>
          <DialogDescription>
            Search and add the channels you listen to or watch regularly. We'll show you where you sit on the political spectrum.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Type a channel name (e.g., CNN, Fox News, Joe Rogan...)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSuggestions(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Suggestions Dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                {filteredSuggestions.map(channel => (
                  <button
                    key={channel.id}
                    onClick={() => addChannel(channel)}
                    className="w-full px-3 py-2 text-left hover:bg-muted/50 flex items-center gap-2 text-sm"
                  >
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: channel.category === 'corporate' ? 'hsl(var(--corporate))' : 'hsl(var(--independent))' }}
                    />
                    {channel.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Channels List */}
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">
              {selectedChannels.length === 0 
                ? "Your channels will appear here" 
                : `${selectedChannels.length} channel${selectedChannels.length !== 1 ? 's' : ''} selected`}
            </p>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {selectedChannels.map(channel => (
                  <div 
                    key={channel.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: channel.category === 'corporate' ? 'hsl(var(--corporate))' : 'hsl(var(--independent))' }}
                      />
                      <span className="text-sm">{channel.name}</span>
                    </div>
                    <button
                      onClick={() => removeChannel(channel.id)}
                      className="text-muted-foreground hover:text-foreground p-1"
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
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={selectedChannels.length === 0}
            className="bg-primary hover:bg-primary/90"
          >
            Show My Position
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpectrumInputModal;
