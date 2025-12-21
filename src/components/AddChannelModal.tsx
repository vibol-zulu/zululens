import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Category, calcRadius } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Clock } from 'lucide-react';

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
  'Spotify',
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

const AVAILABLE_COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
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
  const [isCheckingSimilarity, setIsCheckingSimilarity] = useState(false);
  const [showPendingDialog, setShowPendingDialog] = useState(false);
  const [pendingChannelName, setPendingChannelName] = useState('');
  const [similarChannelsFound, setSimilarChannelsFound] = useState<Array<{
    id: string;
    name: string;
    similarity: number;
    match_type: string;
    country: string;
    category: string;
    status: string;
  }> | null>(null);
  const [selectedCountry, setSelectedCountry] = useState(country === 'Global' ? '' : country);
  const [formData, setFormData] = useState({
    name: '',
    platform: '',
    contentType: ''
  });
  const [otherPlatform, setOtherPlatform] = useState('');
  const [otherContentType, setOtherContentType] = useState('');
  const [otherCountry, setOtherCountry] = useState('');

  // Compute effective values (use custom "Other" values if selected)
  const effectivePlatform = formData.platform === 'Other' ? otherPlatform.trim() : formData.platform;
  const effectiveContentType = formData.contentType === 'Other' ? otherContentType.trim() : formData.contentType;
  const effectiveSelectedCountry = selectedCountry === 'Other' ? otherCountry.trim() : selectedCountry;

  // Determine the actual country to use for submission
  const effectiveCountry = country === 'Global' ? effectiveSelectedCountry : country;
  const isGlobalView = country === 'Global';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !effectivePlatform || !effectiveContentType) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    // Validate "Other" fields have values
    if (formData.platform === 'Other' && !otherPlatform.trim()) {
      toast({
        title: "Platform required",
        description: "Please specify the platform",
        variant: "destructive"
      });
      return;
    }

    if (formData.contentType === 'Other' && !otherContentType.trim()) {
      toast({
        title: "Content type required",
        description: "Please specify the content type",
        variant: "destructive"
      });
      return;
    }

    // Require country selection when in Global view
    if (isGlobalView && !effectiveSelectedCountry) {
      toast({
        title: "Country required",
        description: "Please select a country for this channel",
        variant: "destructive"
      });
      return;
    }

    if (isGlobalView && selectedCountry === 'Other' && !otherCountry.trim()) {
      toast({
        title: "Country required",
        description: "Please specify the country",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate channel name in database (any status)
    const trimmedName = formData.name.trim();
    
    const { data: existingChannel, error: checkError } = await supabase
      .from('user_channels')
      .select('id, name, status, country, year')
      .ilike('name', trimmedName)
      .eq('country', effectiveCountry)
      .eq('year', year)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking for duplicate:', checkError);
    }
    
    if (existingChannel) {
      const statusText = existingChannel.status === 'pending' 
        ? 'is pending approval' 
        : existingChannel.status === 'rejected'
        ? 'was previously submitted'
        : 'already exists';
      
      toast({
        title: "Channel already submitted",
        description: `"${existingChannel.name}" ${statusText} for ${effectiveCountry} (${year}).`,
        variant: "destructive"
      });
      return;
    }

    // Check for similar channels before submission
    setIsCheckingSimilarity(true);
    type SimilarChannel = {
      id: string;
      name: string;
      similarity: number;
      match_type: string;
      country: string;
      category: string;
      status: string;
    };
    let similarChannels: SimilarChannel[] = [];
    
    try {
      const { data: similarData, error: similarError } = await supabase
        .rpc('find_similar_channels', {
          _channel_name: trimmedName,
          _country: effectiveCountry,
          _category: category
        });
      
      if (similarError) {
        console.error('Error checking similarity:', similarError);
      } else if (similarData && Array.isArray(similarData) && similarData.length > 0) {
        similarChannels = similarData as SimilarChannel[];
        setSimilarChannelsFound(similarChannels);
      }
    } catch (err) {
      console.error('Similarity check failed:', err);
    } finally {
      setIsCheckingSimilarity(false);
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
          platform: effectivePlatform,
          content_type: effectiveContentType,
          political_lean: 'TBD', // To be analyzed by AI
          country: effectiveCountry,
          year,
          author_id: user?.id,
          status: canAutoApprove ? 'approved' : 'pending',
          approved_at: canAutoApprove ? new Date().toISOString() : null,
          approved_by: canAutoApprove ? user?.id : null,
          // Store similarity check results for moderator review
          similar_channels: similarChannels.length > 0 ? similarChannels : null,
          has_similarity_flag: similarChannels.length > 0
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
        setPendingChannelName(formData.name);
        setShowPendingDialog(true);
      }

      setFormData({
        name: '',
        platform: '',
        contentType: ''
      });
      setOtherPlatform('');
      setOtherContentType('');
      setOtherCountry('');
      // Reset country selection for next submission
      if (isGlobalView) {
        setSelectedCountry('');
      }
      
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

  const handlePendingDialogClose = () => {
    setShowPendingDialog(false);
    setPendingChannelName('');
  };

  return (
    <>
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
              {formData.platform === 'Other' ? (
                <Input
                  placeholder="Specify platform..."
                  value={otherPlatform}
                  onChange={(e) => setOtherPlatform(e.target.value)}
                  className="mt-2"
                  maxLength={50}
                />
              ) : null}
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
              {formData.contentType === 'Other' ? (
                <Input
                  placeholder="Specify content type..."
                  value={otherContentType}
                  onChange={(e) => setOtherContentType(e.target.value)}
                  className="mt-2"
                  maxLength={50}
                />
              ) : null}
            </div>

            {/* Country selector shown only when in Global view */}
            {isGlobalView && (
              <div className="space-y-2">
                <Label>Country *</Label>
                <Select 
                  value={selectedCountry} 
                  onValueChange={setSelectedCountry}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country for this channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_COUNTRIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCountry === 'Other' ? (
                  <Input
                    placeholder="Specify country..."
                    value={otherCountry}
                    onChange={(e) => setOtherCountry(e.target.value)}
                    className="mt-2"
                    maxLength={50}
                  />
                ) : null}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Adding to: {effectiveCountry || 'Select a country'} ({year}) - {category}
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

      {/* Centered Pending Approval Dialog */}
      <AlertDialog open={showPendingDialog} onOpenChange={handlePendingDialogClose}>
        <AlertDialogContent className="max-w-sm text-center">
          <AlertDialogHeader className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <AlertDialogTitle>Pending Approval</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Your suggestion "{pendingChannelName}" has been submitted and is awaiting review by a moderator or admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction onClick={handlePendingDialogClose}>
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AddChannelModal;
