import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChannels = useMemo(() => {
    if (!searchQuery) return allChannels;
    const query = searchQuery.toLowerCase();
    return allChannels.filter(channel => 
      channel.name.toLowerCase().includes(query)
    );
  }, [allChannels, searchQuery]);

  const corporateChannels = useMemo(() => 
    filteredChannels.filter(c => c.category === 'corporate'),
    [filteredChannels]
  );

  const independentChannels = useMemo(() => 
    filteredChannels.filter(c => c.category === 'independent'),
    [filteredChannels]
  );

  const toggleChannel = (id: string) => {
    setSelectedChannels(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (selectedChannels.size > 0) {
      onSubmit(Array.from(selectedChannels));
    }
  };

  const handleClose = () => {
    setSelectedChannels(new Set());
    setSearchQuery('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl">Where Do You Get Your News?</DialogTitle>
          <DialogDescription>
            Select the channels you listen to or watch on a regular basis. We'll show you where you sit on the political spectrum.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
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
        </div>

        <ScrollArea className="flex-1 h-[400px]">
          <div className="p-6 space-y-6">
            {/* Corporate Channels */}
            {corporateChannels.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-corporate mb-3">Corporate Media</h3>
                <div className="grid grid-cols-2 gap-2">
                  {corporateChannels.map(channel => (
                    <label
                      key={channel.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedChannels.has(channel.id)}
                        onCheckedChange={() => toggleChannel(channel.id)}
                      />
                      <span className="text-sm truncate">{channel.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Independent Channels */}
            {independentChannels.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-independent mb-3">Independent Media</h3>
                <div className="grid grid-cols-2 gap-2">
                  {independentChannels.map(channel => (
                    <label
                      key={channel.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedChannels.has(channel.id)}
                        onCheckedChange={() => toggleChannel(channel.id)}
                      />
                      <span className="text-sm truncate">{channel.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 border-t bg-muted/30 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {selectedChannels.size} channel{selectedChannels.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={selectedChannels.size === 0}
              className="bg-primary hover:bg-primary/90"
            >
              Show My Position
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpectrumInputModal;
