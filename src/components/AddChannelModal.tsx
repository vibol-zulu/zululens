import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Category, calcRadius } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
  country: string;
  year: number;
  onChannelAdded: () => void;
  existingChannelNames?: string[];
}

const PLATFORMS = [
  'YouTube',
  'Cable TV',
  'Broadcast TV',
  'Print/Digital',
  'Podcast',
  'X (Twitter)',
  'TikTok',
  'Instagram',
  'Rumble',
  'Substack',
  'Radio',
  'Web',
  'Other'
];

const CONTENT_TYPES = [
  '24h News',
  'Daily News Show',
  'Long-form Podcast',
  'Political Commentary',
  'Investigative',
  'Documentary',
  'Comedy/Political',
  'News Clips',
  'Newsletter',
  'Interview Show',
  'Other'
];


const AddChannelModal: React.FC<AddChannelModalProps> = ({
  isOpen,
  onClose,
  category,
  country,
  year,
  onChannelAdded,
  existingChannelNames = []
}) => {
  const { toast } = useToast();
  const { user, isAdmin, isModerator } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    platform: '',
    contentType: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.platform || !formData.contentType) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate channel name (case-insensitive)
    const trimmedName = formData.name.trim().toLowerCase();
    const isDuplicate = existingChannelNames.some(
      name => name.toLowerCase() === trimmedName
    );
    
    if (isDuplicate) {
      toast({
        title: "Channel already exists",
        description: `"${formData.name.trim()}" is already in the ${category} dataset for ${country} (${year}).`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Only admins can auto-approve, all other users (including moderators) submit as pending
      const canAutoApprove = isAdmin;
      
      const { data: channelData, error } = await supabase
        .from('user_channels')
        .insert({
          name: formData.name.trim(),
          category,
          value_millions: 0, // To be estimated by mods/admins
          start_date: 'TBD', // To be estimated by mods/admins
          platform: formData.platform,
          content_type: formData.contentType,
          political_lean: 'TBD', // To be analyzed by AI
          country,
          year,
          author_id: user?.id,
          status: canAutoApprove ? 'approved' : 'pending',
          approved_at: canAutoApprove ? new Date().toISOString() : null,
          approved_by: canAutoApprove ? user?.id : null
        })
        .select('id')
        .single();

      if (error) throw error;

      // Pending submissions don't create notifications - moderators/admins see red dot on Dashboard instead

      if (canAutoApprove) {
        toast({
          title: "Channel added!",
          description: `${formData.name} has been added to the ${category} list.`
        });
      } else {
        toast({
          title: "Pending Approval",
          description: `Your suggestion "${formData.name}" has been submitted and is awaiting review by a moderator or admin.`
        });
      }

      setFormData({
        name: '',
        platform: '',
        contentType: ''
      });
      
      onChannelAdded();
      onClose();
    } catch (error) {
      console.error('Error adding channel:', error);
      toast({
        title: "Error",
        description: "Failed to add channel. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="capitalize">Add {category} Channel</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Channel Name *</Label>
            <Input
              id="name"
              placeholder="e.g., The Daily Show"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Platform *</Label>
            <Select 
              value={formData.platform} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Content Type *</Label>
            <Select 
              value={formData.contentType} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, contentType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          <div className="text-xs text-muted-foreground">
            Adding to: {country} ({year}) - {category}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Adding...' : 'Add Channel'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddChannelModal;
