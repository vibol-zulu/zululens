import React from 'react';
import { Globe, Users, Calendar, MapPin, Building2, ExternalLink, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useChannelProfile } from '@/hooks/useChannelProfile';

interface ChannelProfilePanelProps {
  channelId: string | null;
  category?: 'corporate' | 'independent';
  onClose: () => void;
}

const getPoliticalLeanColor = (lean: string) => {
  const lowerLean = lean.toLowerCase();
  if (lowerLean.includes('left')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
  if (lowerLean.includes('right')) return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
  return 'bg-muted text-muted-foreground border-border';
};

const getCategoryStyle = (category: string) => {
  if (category === 'corporate') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
  return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800';
};

const ChannelProfilePanel: React.FC<ChannelProfilePanelProps> = ({ channelId, category: _category, onClose }) => {
  const { channel, loading, error } = useChannelProfile(channelId);
  const isOpen = channelId !== null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 overflow-hidden w-[calc(100%-2rem)] sm:max-w-lg">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <div className="pt-4 space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ) : error ? (
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>Error</DialogTitle>
              <DialogDescription>{error}</DialogDescription>
            </DialogHeader>
          </div>
        ) : channel ? (
          <ScrollArea className="max-h-[80vh]">
            <div className="p-6 space-y-5">
              {/* Header */}
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-xl font-semibold tracking-tight">
                  {channel.name}
                </DialogTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={getCategoryStyle(channel.category)}>
                    {channel.category}
                  </Badge>
                  <Badge variant="outline" className={getPoliticalLeanColor(channel.political_lean)}>
                    {channel.political_lean}
                  </Badge>
                </div>
              </DialogHeader>

              <Separator />

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div className="flex items-center gap-2.5">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="text-sm">
                    <span className="font-medium">{channel.value_millions}M</span>
                    <span className="text-muted-foreground ml-1">audience</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">{channel.start_date}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">{channel.platform}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">{channel.country}</span>
                </div>
              </div>

              {/* Content Type */}
              <div className="flex items-center gap-2.5">
                <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">{channel.content_type}</span>
              </div>

              {/* Extended Profile Data */}
              {channel.profile ? (
                <div className="space-y-5 pt-2">
                  {channel.profile.description && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">About</h4>
                        <p className="text-sm leading-relaxed">
                          {channel.profile.description}
                        </p>
                      </div>
                    </>
                  )}

                  {(channel.profile.parent_company || channel.profile.headquarters || channel.profile.founding_year) && (
                    <>
                      <Separator />
                      <div className="grid grid-cols-2 gap-4">
                        {channel.profile.parent_company && (
                          <div>
                            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1.5">
                              <Building2 className="h-3 w-3" />
                              Parent Company
                            </h4>
                            <p className="text-sm">{channel.profile.parent_company}</p>
                          </div>
                        )}
                        {channel.profile.headquarters && (
                          <div>
                            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Headquarters</h4>
                            <p className="text-sm">{channel.profile.headquarters}</p>
                          </div>
                        )}
                        {channel.profile.founding_year && (
                          <div>
                            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Founded</h4>
                            <p className="text-sm">{channel.profile.founding_year}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {channel.profile.key_people && channel.profile.key_people.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Key People</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {channel.profile.key_people.map((person, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs font-normal">
                              {person}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {channel.profile.notable_events && channel.profile.notable_events.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Notable Events</h4>
                        <ul className="space-y-1.5">
                          {channel.profile.notable_events.map((event, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              <span>{event}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  {channel.profile.website_url && (
                    <>
                      <Separator />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => window.open(channel.profile!.website_url!, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit Website
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <Separator />
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground italic">
                      Extended profile information coming soon.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Help us by contributing data about this channel.
                    </p>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default ChannelProfilePanel;
