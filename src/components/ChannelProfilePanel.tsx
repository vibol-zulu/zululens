import React, { useState } from 'react';
import { Globe, Users, Calendar, MapPin, Building2, ExternalLink, Tv, Radio, Newspaper, Video, Podcast, Mail, Mic, HelpCircle, Link2, ImageIcon, PenLine } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useChannelProfile } from '@/hooks/useChannelProfile';
import { useAuth } from '@/hooks/useAuth';
import ProfileSuggestionModal from './ProfileSuggestionModal';

interface ChannelProfilePanelProps {
  channelId: string | null;
  category?: 'corporate' | 'independent';
  onClose: () => void;
}

interface SuggestionState {
  isOpen: boolean;
  fieldName: string;
  fieldLabel: string;
  currentValue: string | null;
  isTextarea: boolean;
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

const getMediaTypeIcon = (contentType: string) => {
  const type = contentType.toLowerCase();
  
  // TV / Video content
  if (type.includes('24h news') || type.includes('evening news') || type.includes('network news') || type.includes('news show')) {
    return { icon: Tv, label: 'Television' };
  }
  
  // Video / YouTube content
  if (type.includes('video') || type.includes('clips') || type.includes('documentary') || type.includes('comedy') || type.includes('prank') || type.includes('memes')) {
    return { icon: Video, label: 'Video' };
  }
  
  // Podcast content
  if (type.includes('podcast') || type.includes('long-form interview') || type.includes('interview show')) {
    return { icon: Podcast, label: 'Podcast' };
  }
  
  // Radio content
  if (type.includes('radio')) {
    return { icon: Radio, label: 'Radio' };
  }
  
  // Print / Newsletter content
  if (type.includes('newspaper') || type.includes('newsletter') || type.includes('digest') || type.includes('alt-weekly') || type.includes('wire service')) {
    return { icon: Newspaper, label: 'Print/Newsletter' };
  }
  
  // Online journalism / digital
  if (type.includes('online') || type.includes('digital') || type.includes('investigative')) {
    return { icon: Mail, label: 'Digital' };
  }
  
  // Multi-platform / Network
  if (type.includes('multi') || type.includes('network')) {
    return { icon: Mic, label: 'Multi-platform' };
  }
  
  // Default
  return { icon: Mic, label: 'Media' };
};

// Platform icon components
const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const TwitchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const SpotifyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const SubstackIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/>
  </svg>
);

const RumbleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M14.837 12.55l-4.168 2.407a.75.75 0 01-1.125-.65V9.5a.75.75 0 011.125-.65l4.168 2.407a.75.75 0 010 1.293zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z"/>
  </svg>
);

const getPlatformIcon = (platform: string) => {
  const p = platform.toLowerCase();
  
  if (p.includes('youtube')) {
    return { icon: YouTubeIcon, label: 'YouTube', color: 'text-red-500' };
  }
  if (p.includes('twitch')) {
    return { icon: TwitchIcon, label: 'Twitch', color: 'text-purple-500' };
  }
  if (p.includes('tiktok')) {
    return { icon: TikTokIcon, label: 'TikTok', color: 'text-foreground' };
  }
  if (p.includes('instagram')) {
    return { icon: InstagramIcon, label: 'Instagram', color: 'text-pink-500' };
  }
  if (p.includes('spotify')) {
    return { icon: SpotifyIcon, label: 'Spotify', color: 'text-green-500' };
  }
  if (p.includes('substack')) {
    return { icon: SubstackIcon, label: 'Substack', color: 'text-orange-500' };
  }
  if (p.includes('rumble')) {
    return { icon: RumbleIcon, label: 'Rumble', color: 'text-green-600' };
  }
  if (p === 'x' || p.includes('x/') || p.includes('/x')) {
    return { icon: XIcon, label: 'X (Twitter)', color: 'text-foreground' };
  }
  if (p.includes('cable') || p.includes('broadcast') || p.includes('satellite') || p.includes('public tv')) {
    return { icon: Tv, label: 'Television', color: 'text-muted-foreground' };
  }
  if (p.includes('radio')) {
    return { icon: Radio, label: 'Radio', color: 'text-muted-foreground' };
  }
  if (p.includes('print') || p.includes('newspaper') || p.includes('magazine')) {
    return { icon: Newspaper, label: 'Print', color: 'text-muted-foreground' };
  }
  if (p.includes('web') || p.includes('wire')) {
    return { icon: Globe, label: 'Web', color: 'text-muted-foreground' };
  }
  
  return { icon: Globe, label: 'Platform', color: 'text-muted-foreground' };
};

const ChannelProfilePanel: React.FC<ChannelProfilePanelProps> = ({ channelId, category: _category, onClose }) => {
  const { channel, loading, error } = useChannelProfile(channelId);
  const { user } = useAuth();
  const isOpen = channelId !== null;

  const [suggestionModal, setSuggestionModal] = useState<SuggestionState>({
    isOpen: false,
    fieldName: '',
    fieldLabel: '',
    currentValue: null,
    isTextarea: false,
  });

  const openSuggestion = (fieldName: string, fieldLabel: string, currentValue: string | null, isTextarea = false) => {
    setSuggestionModal({
      isOpen: true,
      fieldName,
      fieldLabel,
      currentValue,
      isTextarea,
    });
  };

  const closeSuggestion = () => {
    setSuggestionModal(prev => ({ ...prev, isOpen: false }));
  };

  // Helper component for fields with suggest button
  const ProfileField = ({ 
    fieldName, 
    label, 
    value, 
    icon: Icon,
    isTextarea = false 
  }: { 
    fieldName: string; 
    label: string; 
    value: string | number | null | undefined;
    icon?: React.ComponentType<{ className?: string }>;
    isTextarea?: boolean;
  }) => (
    <div className="group">
      <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </h4>
      <div className="flex items-start justify-between gap-2">
        {value ? (
          <p className="text-sm flex-1">{value}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic flex-1">Not available</p>
        )}
        {user && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 w-6 p-0 shrink-0 ${value ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} transition-opacity`}
                  onClick={() => openSuggestion(fieldName, label, value?.toString() || null, isTextarea)}
                >
                  <PenLine className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="text-xs">{value ? 'Suggest edit' : 'Suggest value'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );

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
              {/* Header with Logo */}
              <DialogHeader className="space-y-4">
                <div className="flex items-start gap-4">
                  {/* Channel Logo */}
                  {channel.profile?.logo_url ? (
                    <img 
                      src={channel.profile.logo_url} 
                      alt={`${channel.name} logo`}
                      className="w-16 h-16 rounded-lg object-contain bg-muted border border-border shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-xl font-semibold tracking-tight">
                      {channel.name}
                    </DialogTitle>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className={getCategoryStyle(channel.category)}>
                        {channel.category}
                      </Badge>
                      <Badge variant="outline" className={getPoliticalLeanColor(channel.political_lean)}>
                        {channel.political_lean}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <Separator />

              {/* Veracity / Bias Score - Coming Soon */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  Veracity / Bias Score
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                    Coming Soon
                  </Badge>
                </h4>
                
                {/* Blank Progress Meter */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden border border-border">
                      <div className="h-full w-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full transition-all duration-500" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground min-w-[40px] text-right">—%</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
                    <span>Low</span>
                    <span>Moderate</span>
                    <span>High</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This feature will enable <span className="font-medium text-foreground">Public Governance</span> over accuracy and bias standards for global news, media, and political commentator channels—empowering citizens to hold media accountable.
                </p>

                {/* Scroll indicator */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground animate-pulse">
                    <span>Scroll for more</span>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div className="flex items-center gap-2.5">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="text-sm flex items-center gap-1">
                    <span className="font-medium">{channel.value_millions}M</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors">
                            <span className="text-xs font-medium">UMA</span>
                            <HelpCircle className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-xs leading-relaxed">
                            <strong>Unique Monthly Audience</strong> — A cross-platform audience estimate combining reach metrics from websites, YouTube, podcasts, and social platforms with de-duplication applied.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">{channel.start_date}</span>
                </div>
                {(() => {
                  const { icon: PlatformIcon, label, color } = getPlatformIcon(channel.platform);
                  return (
                    <div className="flex items-center gap-2.5">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="shrink-0">
                              <PlatformIcon className={`h-4 w-4 ${color}`} />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p className="text-xs">{label}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="text-sm">{channel.platform}</span>
                    </div>
                  );
                })()}
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">{channel.country}</span>
                </div>
              </div>

              {/* Content Type with Media Icon */}
              {(() => {
                const { icon: MediaIcon, label } = getMediaTypeIcon(channel.content_type);
                return (
                  <div className="flex items-center gap-2.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="shrink-0">
                            <MediaIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p className="text-xs">{label}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="text-sm text-muted-foreground">{channel.content_type}</span>
                  </div>
                );
              })()}

              {/* Extended Profile Data - Always show all fields */}
              <div className="space-y-5 pt-2">
                {/* About / Description */}
                <Separator />
                <ProfileField
                  fieldName="description"
                  label="About"
                  value={channel.profile?.description}
                  isTextarea
                />

                {/* Website */}
                <Separator />
                <div className="group">
                  <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Link2 className="h-3 w-3" />
                    Website
                  </h4>
                  <div className="flex items-start justify-between gap-2">
                    {channel.profile?.website_url ? (
                      <a 
                        href={channel.profile.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline underline-offset-2 flex-1"
                      >
                        {channel.profile.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground italic flex-1">Not available</p>
                    )}
                    {user && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-6 w-6 p-0 shrink-0 ${channel.profile?.website_url ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} transition-opacity`}
                              onClick={() => openSuggestion('website_url', 'Website URL', channel.profile?.website_url || null)}
                            >
                              <PenLine className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p className="text-xs">{channel.profile?.website_url ? 'Suggest edit' : 'Suggest value'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>

                {/* Organization Details Grid */}
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <ProfileField
                    fieldName="parent_company"
                    label="Parent Company"
                    value={channel.profile?.parent_company}
                    icon={Building2}
                  />
                  <ProfileField
                    fieldName="headquarters"
                    label="Headquarters"
                    value={channel.profile?.headquarters}
                    icon={MapPin}
                  />
                  <ProfileField
                    fieldName="founding_year"
                    label="Founded"
                    value={channel.profile?.founding_year}
                    icon={Calendar}
                  />
                </div>

                {/* Key People */}
                <Separator />
                <div className="group">
                  <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2 flex items-center justify-between">
                    <span>Key People</span>
                    {user && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-6 w-6 p-0 ${channel.profile?.key_people?.length ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} transition-opacity`}
                              onClick={() => openSuggestion('key_people', 'Key People', channel.profile?.key_people?.join(', ') || null)}
                            >
                              <PenLine className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p className="text-xs">Suggest key people (comma-separated)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </h4>
                  {channel.profile?.key_people && channel.profile.key_people.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {channel.profile.key_people.map((person, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs font-normal">
                          {person}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Not available</p>
                  )}
                </div>

                {/* Notable Events */}
                <Separator />
                <div className="group">
                  <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2 flex items-center justify-between">
                    <span>Notable Events</span>
                    {user && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-6 w-6 p-0 ${channel.profile?.notable_events?.length ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} transition-opacity`}
                              onClick={() => openSuggestion('notable_events', 'Notable Events', channel.profile?.notable_events?.join('\n') || null, true)}
                            >
                              <PenLine className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p className="text-xs">Suggest notable events</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </h4>
                  {channel.profile?.notable_events && channel.profile.notable_events.length > 0 ? (
                    <ul className="space-y-1.5">
                      {channel.profile.notable_events.map((event, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{event}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Not available</p>
                  )}
                </div>

                {/* Sign in prompt for non-authenticated users */}
                {!user && (
                  <>
                    <Separator />
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Sign in to suggest edits to this profile
                    </p>
                  </>
                )}
              </div>

              {/* Profile Suggestion Modal */}
              {channel && (
                <ProfileSuggestionModal
                  isOpen={suggestionModal.isOpen}
                  onClose={closeSuggestion}
                  channelId={channel.id}
                  channelName={channel.name}
                  fieldName={suggestionModal.fieldName}
                  fieldLabel={suggestionModal.fieldLabel}
                  currentValue={suggestionModal.currentValue}
                  isTextarea={suggestionModal.isTextarea}
                />
              )}
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default ChannelProfilePanel;
