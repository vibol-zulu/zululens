import React from 'react';
import { Globe, Users, Calendar, MapPin, Building2, ExternalLink, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useChannelProfile } from '@/hooks/useChannelProfile';
import { COLORS } from '@/types/media';

interface ChannelProfilePanelProps {
  channelId: string | null;
  category?: 'corporate' | 'independent';
  onClose: () => void;
}

const getPoliticalLeanColor = (lean: string) => {
  const lowerLean = lean.toLowerCase();
  if (lowerLean.includes('left')) return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
  if (lowerLean.includes('right')) return 'bg-red-500/20 text-red-700 dark:text-red-300';
  return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
};

const ChannelProfilePanel: React.FC<ChannelProfilePanelProps> = ({ channelId, category: _category, onClose }) => {
  const { channel, loading, error } = useChannelProfile(channelId);
  const isOpen = channelId !== null;

  const categoryColor = channel?.category === 'corporate' ? COLORS.corporate : COLORS.independent;
  const categoryTextColor = channel?.category === 'corporate' ? COLORS.independent : COLORS.corporate;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 overflow-hidden w-[calc(100%-2rem)] sm:max-w-xl">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Separator />
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ) : error ? (
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>Error</DialogTitle>
            </DialogHeader>
            <p className="text-destructive mt-4">{error}</p>
          </div>
        ) : channel ? (
          <>
            {/* Header with category color - full width */}
            <div style={{ backgroundColor: categoryColor }} className="w-full">
              <div className="p-6 pb-4">
                <DialogHeader className="p-0">
                  <DialogTitle
                    className="text-xl font-bold pr-8"
                    style={{ color: categoryTextColor }}
                  >
                    {channel.name}
                  </DialogTitle>
                </DialogHeader>

                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge
                    variant="secondary"
                    className="capitalize"
                    style={{ backgroundColor: `${categoryTextColor}20`, color: categoryTextColor }}
                  >
                    {channel.category}
                  </Badge>
                  <Badge className={getPoliticalLeanColor(channel.political_lean)}>
                    {channel.political_lean}
                  </Badge>
                </div>
              </div>
            </div>

            <ScrollArea className="max-h-[calc(100vh-16rem)]">
              <div className="p-6 space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{channel.value_millions}M</span>
                    <span className="text-muted-foreground">audience</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{channel.start_date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>{channel.platform}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{channel.country}</span>
                  </div>
                </div>

                <Separator />

                {/* Content Type */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Content Type
                  </h4>
                  <p className="text-sm text-muted-foreground">{channel.content_type}</p>
                </div>

                {/* Extended Profile Data */}
                {channel.profile ? (
                  <>
                    {channel.profile.description && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">About</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {channel.profile.description}
                        </p>
                      </div>
                    )}

                    {channel.profile.parent_company && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Parent Company
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {channel.profile.parent_company}
                        </p>
                      </div>
                    )}

                    {channel.profile.headquarters && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Headquarters</h4>
                        <p className="text-sm text-muted-foreground">
                          {channel.profile.headquarters}
                        </p>
                      </div>
                    )}

                    {channel.profile.founding_year && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Founded</h4>
                        <p className="text-sm text-muted-foreground">
                          {channel.profile.founding_year}
                        </p>
                      </div>
                    )}

                    {channel.profile.key_people && channel.profile.key_people.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Key People</h4>
                        <div className="flex flex-wrap gap-2">
                          {channel.profile.key_people.map((person, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {person}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {channel.profile.notable_events && channel.profile.notable_events.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Notable Events</h4>
                        <ul className="space-y-2">
                          {channel.profile.notable_events.map((event, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              {event}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {channel.profile.website_url && (
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => window.open(channel.profile!.website_url!, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Visit Website
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-sm italic">
                      Extended profile information coming soon.
                    </p>
                    <p className="text-xs mt-1">
                      Help us by contributing data about this channel.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default ChannelProfilePanel;
