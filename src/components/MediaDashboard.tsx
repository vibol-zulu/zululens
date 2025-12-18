import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { YearData, ViewMode } from '@/types/media';
import { COUNTRIES } from '@/data/mediaData';
import MediaCanvas from '@/components/MediaCanvas';
import { Badge } from '@/components/ui/badge';
import Sidebar from '@/components/MediaSidebar';
import InsightsModal from '@/components/InsightsModal';
import MethodologyModal from '@/components/MethodologyModal';
import ContactModal from '@/components/ContactModal';
import MissionModal from '@/components/MissionModal';
import ContributorModal from '@/components/ContributorModal';
import AdminModal from '@/components/AdminModal';
import SignInModal from '@/components/SignInModal';
import MemberDashboardModal from '@/components/MemberDashboardModal';
import ContributorDashboardModal from '@/components/ContributorDashboardModal';
import ModeratorDashboardModal from '@/components/ModeratorDashboardModal';
import CommentsSection from '@/components/CommentsSection';
import NewsModal from '@/components/NewsModal';
import SpectrumInputModal from '@/components/SpectrumInputModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, Check, ChevronsUpDown } from 'lucide-react';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { COLORS } from '@/types/media';
import { useUserChannels } from '@/hooks/useUserChannels';
import { useAuth } from '@/hooks/useAuth';
import { useAppSettings } from '@/hooks/useAppSettings';
import { supabase } from '@/integrations/supabase/client';
import { useTour } from '@/components/GuidedTour';

import WelcomeModal from '@/components/WelcomeModal';
import ContributorCelebration from '@/components/ContributorCelebration';

interface MediaDashboardProps {
  visitorName: string;
  visitorEmail: string;
  data: Record<number, YearData>;
  showWelcomeModal?: boolean;
}

const MediaDashboard: React.FC<MediaDashboardProps> = ({
  visitorName,
  visitorEmail,
  data,
  showWelcomeModal = false
}) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const useStackedLayout = isMobile || isTablet;
  
  // Welcome modal state
  const [showWelcome, setShowWelcome] = useState(showWelcomeModal);
  
  const [year, setYear] = useState<number>(2025);
  const [country, setCountry] = useState<string>('United States');
  const [viewMode, setViewMode] = useState<ViewMode>('default');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [countryOpen, setCountryOpen] = useState(false);
  
  const [showInsights, setShowInsights] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showContributor, setShowContributor] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showMission, setShowMission] = useState(false);
  const [showMemberDashboard, setShowMemberDashboard] = useState(false);
  const [showContributorDashboard, setShowContributorDashboard] = useState(false);
  const [showModeratorDashboard, setShowModeratorDashboard] = useState(false);
  const [showNews, setShowNews] = useState(false);
  const [signInDefaultTab, setSignInDefaultTab] = useState<'signin' | 'signup'>('signin');
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [pendingSubmissionsCount, setPendingSubmissionsCount] = useState(0);
  const [showContributorCelebration, setShowContributorCelebration] = useState(false);
  
  // Personalized spectrum state
  const [showSpectrumInput, setShowSpectrumInput] = useState(false);
  const [userPoliticalScore, setUserPoliticalScore] = useState<number | null>(null);

  const { settings: appSettings } = useAppSettings();
  
  // Guided tour state
  const { currentStep, startTour, nextStep, closeTour, dontShowAgain, setDontShowAgain, TourCard } = useTour(appSettings.guidedTourEnabled);

  // Auth state for contributor access
  const { user, isContributor, isModerator, isAdmin, signOut } = useAuth();
  
  // Fetch unread notifications count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadNotificationsCount(0);
      return;
    }

    try {
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (isAdmin) {
        query = query.or(
          `target_user_id.eq.${user.id},and(target_user_id.is.null,target_role.eq.admin)`
        );
      } else if (isModerator) {
        query = query.or(
          `target_user_id.eq.${user.id},and(target_user_id.is.null,target_role.eq.moderator)`
        );
      } else {
        query = query.eq('target_user_id', user.id);
      }

      const { count, error } = await query;

      if (!error && count !== null) {
        setUnreadNotificationsCount(count);
      }
    } catch (err) {
      console.error('Error fetching unread notifications:', err);
    }
  }, [user, isAdmin, isModerator]);

  // Fetch pending submissions count for moderators/admins
  const fetchPendingSubmissionsCount = useCallback(async () => {
    if (!user || (!isModerator && !isAdmin)) {
      setPendingSubmissionsCount(0);
      return;
    }
    
    try {
      const { count, error } = await supabase
        .from('user_channels')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (!error && count !== null) {
        setPendingSubmissionsCount(count);
      }
    } catch (err) {
      console.error('Error fetching pending submissions:', err);
    }
  }, [user, isModerator, isAdmin]);

  // Fetch unread count on mount and when dashboards close
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount, showMemberDashboard, showContributorDashboard, showModeratorDashboard, showAdmin]);

  // Fetch pending submissions count
  useEffect(() => {
    fetchPendingSubmissionsCount();
  }, [fetchPendingSubmissionsCount, showAdmin, showModeratorDashboard]);
  
  // Check if user is a Tier 2 member (authenticated but not contributor/moderator/admin)
  const isMember = user && !isContributor && !isModerator && !isAdmin;

  // Check if member has reached 10 approved submissions for celebration
  useEffect(() => {
    const checkContributorEligibility = async () => {
      if (!user || !isMember) return;
      
      // Check localStorage to see if user has already seen the celebration
      const celebrationKey = `contributor_celebration_${user.id}`;
      const hasSeenCelebration = localStorage.getItem(celebrationKey);
      
      if (hasSeenCelebration) return;
      
      try {
        // Count approved submissions for this user
        const { count, error } = await supabase
          .from('user_channels')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', user.id)
          .eq('status', 'approved');
        
        if (error) {
          console.error('Error checking approved submissions:', error);
          return;
        }
        
        // Show celebration if they have 10+ approved submissions
        if (count !== null && count >= 10) {
          setShowContributorCelebration(true);
          // Mark as seen so it doesn't show again
          localStorage.setItem(celebrationKey, 'true');
        }
      } catch (err) {
        console.error('Error checking contributor eligibility:', err);
      }
    };
    
    checkContributorEligibility();
  }, [user, isMember]);

  // Get user tier badge
  const getUserBadge = () => {
    if (isAdmin) return { label: 'Admin', variant: 'default' as const };
    if (isModerator) return { label: 'Moderator', variant: 'secondary' as const };
    if (isContributor) return { label: 'Contributor', variant: 'outline' as const };
    return { label: 'Member', variant: 'outline' as const };
  };

  // Fetch user-added channels and merge with static data
  const { getMergedData, refetch: refetchUserChannels } = useUserChannels(country, year);
  
  // Get merged data for current year (static + user-added)
  const mergedData = useMemo(() => getMergedData(), [getMergedData]);

  // Select all channels by default when data loads or changes
  useEffect(() => {
    if (mergedData.brands.length > 0) {
      setSelectedIds(new Set(mergedData.brands.map(b => b.id)));
    }
  }, [mergedData.brands]);

  // Countries with static data (don't show contributor modal)
  const countriesWithStaticData = ['United States'];

  const handleCountryChange = (value: string) => {
    setCountry(value);
    setSelectedIds(new Set());
  };

  // Show contributor modal after data loads if country has no data (only for Tier 1 visitors - unauthenticated)
  useEffect(() => {
    if (!countriesWithStaticData.includes(country) && mergedData.brands.length === 0 && !user) {
      setShowContributor(true);
    }
  }, [country, mergedData.brands.length, user]);

  const toggleBrand = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = (category: string) => {
    const brands = mergedData.brands.filter(b => b.category === category);
    const allSelected = brands.every(b => selectedIds.has(b.id));
    const newSet = new Set(selectedIds);
    
    brands.forEach(b => {
      if (allSelected) newSet.delete(b.id);
      else newSet.add(b.id);
    });
    setSelectedIds(newSet);
  };

  const handleCircleClick = () => {
    if (hoveredId) {
      const newSet = new Set(selectedIds);
      if (newSet.has(hoveredId)) newSet.delete(hoveredId);
      else newSet.add(hoveredId);
      setSelectedIds(newSet);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b bg-card dark:[background:var(--background-gradient)] flex items-center px-2 sm:px-4 justify-between shrink-0 z-20">
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Dark Mode Toggle - Hidden for now */}
          {/* <ThemeToggle /> */}

          {/* Country Selector - Desktop only */}
          {!isMobile && (
            <div data-tour="country-year" className="flex items-center gap-1">
              <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={countryOpen}
                    className="w-[160px] h-9 justify-between"
                  >
                    {country}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search country..." />
                    <CommandList>
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup>
                        {COUNTRIES.map((c) => (
                          <CommandItem
                            key={c}
                            value={c}
                            onSelect={() => {
                              handleCountryChange(c);
                              setCountryOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${country === c ? "opacity-100" : "opacity-0"}`}
                            />
                            {c}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Year Selector */}
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2000">Year: 2000</SelectItem>
                  <SelectItem value="2025">Year: 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Mobile Year Selector */}
          {isMobile && (
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger data-tour="country-year" className="w-[70px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2000">2000</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* View Toggle */}
          <div data-tour="view-toggle" className="flex bg-muted rounded-full p-0.5">
            <button 
              onClick={() => {
                setViewMode('default');
                setUserPoliticalScore(null);
              }}
              className={`${isMobile ? 'px-2 text-xs' : 'px-4 text-sm'} py-1.5 rounded-full font-medium transition-all ${
                viewMode === 'default' 
                  ? 'bg-card shadow-sm text-foreground' 
                  : 'shimmer-text hover:text-foreground'
              }`}
            >
              {isMobile ? 'Micro' : 'Microscope'}
            </button>
            <button 
              onClick={() => setViewMode('compass')}
              className={`${isMobile ? 'px-2 text-xs' : 'px-4 text-sm'} py-1.5 rounded-full font-medium transition-all ${
                viewMode === 'compass' 
                  ? 'bg-card shadow-sm text-foreground' 
                  : 'shimmer-text hover:text-foreground'
              }`}
            >
              {isMobile ? 'Spec' : 'Spectrum'}
            </button>
          </div>
        </div>

        {/* Right side menu */}
        <div className="flex items-center gap-1 sm:gap-3">
          {!isMobile && user && (
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              Welcome, {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
              <Badge variant={getUserBadge().variant} className="text-[10px] px-1.5 py-0 h-4">
                {getUserBadge().label}
              </Badge>
            </span>
          )}
          
          {/* Pill-shaped Sign Up button for Tier 1 users */}
          {!user && (
            <Button 
              onClick={() => {
                setSignInDefaultTab('signup');
                setShowSignIn(true);
              }}
              size="sm"
              className="rounded-full font-medium text-xs px-3 py-1 h-7 text-white hover:opacity-90"
              style={{ backgroundColor: '#00564A' }}
            >
              Sign Up
            </Button>
          )}


          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Menu className="h-5 w-5" />
                {(unreadNotificationsCount > 0 || pendingSubmissionsCount > 0) && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {user && isAdmin && (
                <DropdownMenuItem 
                  onClick={() => setShowAdmin(true)}
                  className="bg-primary/10 text-primary font-medium flex items-center justify-between"
                >
                  <span>Admin</span>
                  {pendingSubmissionsCount > 0 && (
                    <span className="h-2 w-2 rounded-full bg-destructive" />
                  )}
                </DropdownMenuItem>
              )}
              {user && isMember && (
                <DropdownMenuItem 
                  onClick={() => setShowMemberDashboard(true)}
                  className="bg-muted font-medium"
                >
                  Dashboard
                </DropdownMenuItem>
              )}
              {user && isContributor && !isAdmin && !isModerator && (
                <DropdownMenuItem 
                  onClick={() => setShowContributorDashboard(true)}
                  className="bg-muted font-medium"
                >
                  Dashboard
                </DropdownMenuItem>
              )}
              {user && isModerator && !isAdmin && (
                <DropdownMenuItem 
                  onClick={() => setShowModeratorDashboard(true)}
                  className="bg-muted font-medium flex items-center justify-between"
                >
                  <span>Dashboard</span>
                  {pendingSubmissionsCount > 0 && (
                    <span className="h-2 w-2 rounded-full bg-destructive" />
                  )}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setShowMission(true)}>
                Mission
              </DropdownMenuItem>
              {isMobile && (
                <DropdownMenuItem onClick={() => setShowNews(true)}>
                  News & Updates
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setShowInsights(true)}>
                Insights
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowMethodology(true)}>
                Methodology
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowContact(true)}>
                Contact
              </DropdownMenuItem>
              {!user && (
                <DropdownMenuItem onClick={() => {
                  setSignInDefaultTab('signin');
                  setShowSignIn(true);
                }}>
                  Sign In
                </DropdownMenuItem>
              )}
              {user && (
                <DropdownMenuItem onClick={() => signOut()}>
                  Sign Out
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main */}
      <main className={`flex-1 relative overflow-hidden bg-background dark:[background:var(--background-gradient)] ${useStackedLayout ? 'flex flex-col' : ''}`}>
        {/* Canvas Container */}
        <div 
          className={`${
            useStackedLayout 
              ? 'relative h-1/2 border-b' 
              : 'absolute top-0 bottom-0 z-[1] transition-all duration-300'
          }`}
          style={!useStackedLayout ? {
            left: leftSidebarOpen ? '280px' : '0',
            right: rightSidebarOpen ? '280px' : '0'
          } : undefined}
        >
          <MediaCanvas
            year={year}
            yearData={mergedData}
            selectedIds={selectedIds}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
            onCircleClick={handleCircleClick}
            viewMode={viewMode}
            country={country}
            userPoliticalScore={userPoliticalScore}
            userName={user?.user_metadata?.full_name || visitorName || 'You'}
          />
          
          {/* Spectrum Mode Button */}
          {viewMode === 'compass' && (
            <div className="absolute bottom-36 md:bottom-24 left-1/2 -translate-x-1/2 z-10">
              <Button
                onClick={() => setShowSpectrumInput(true)}
                variant="outline"
                className="bg-card/90 backdrop-blur-sm shadow-lg hover:bg-card"
              >
                My Political Position
              </Button>
            </div>
          )}
        </div>

        {/* Mobile/Tablet Sidebars */}
        {useStackedLayout && (
          <div className="flex-1 flex w-full overflow-hidden z-10 bg-card">
            <Sidebar 
              category="corporate" 
              brands={mergedData.brands.filter(b => b.category === 'corporate')}
              selectedIds={selectedIds}
              onToggle={toggleBrand}
              onToggleAll={toggleAll}
              side="left"
              isOpen={true}
              onToggleSidebar={() => {}}
              isMobile={true}
              country={country}
              year={year}
              onChannelAdded={refetchUserChannels}
              visitorName={visitorName}
              visitorEmail={visitorEmail}
            />
            <Sidebar 
              category="independent" 
              brands={mergedData.brands.filter(b => b.category === 'independent')}
              selectedIds={selectedIds}
              onToggle={toggleBrand}
              onToggleAll={toggleAll}
              side="right"
              isOpen={true}
              onToggleSidebar={() => {}}
              isMobile={true}
              country={country}
              year={year}
              onChannelAdded={refetchUserChannels}
              visitorName={visitorName}
              visitorEmail={visitorEmail}
            />
          </div>
        )}

        {/* Desktop Floating Sidebars */}
        {!useStackedLayout && (
          <>
            <Sidebar 
              category="corporate" 
              brands={mergedData.brands.filter(b => b.category === 'corporate')}
              selectedIds={selectedIds}
              onToggle={toggleBrand}
              onToggleAll={toggleAll}
              side="left"
              isOpen={leftSidebarOpen}
              onToggleSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
              country={country}
              year={year}
              onChannelAdded={refetchUserChannels}
              visitorName={visitorName}
              visitorEmail={visitorEmail}
              onSignUpClick={() => {
                setSignInDefaultTab('signup');
                setShowSignIn(true);
              }}
            />
            
            <Sidebar 
              category="independent" 
              brands={mergedData.brands.filter(b => b.category === 'independent')}
              selectedIds={selectedIds}
              onToggle={toggleBrand}
              onToggleAll={toggleAll}
              side="right"
              isOpen={rightSidebarOpen}
              onToggleSidebar={() => setRightSidebarOpen(!rightSidebarOpen)}
              country={country}
              year={year}
              onChannelAdded={refetchUserChannels}
              visitorName={visitorName}
              visitorEmail={visitorEmail}
              onSignUpClick={() => {
                setSignInDefaultTab('signup');
                setShowSignIn(true);
              }}
            />
          </>
        )}
      </main>
      
      <InsightsModal open={showInsights} onClose={() => setShowInsights(false)} />
      <MethodologyModal open={showMethodology} onClose={() => setShowMethodology(false)} />
      <ContactModal open={showContact} onClose={() => setShowContact(false)} visitorName={visitorName} visitorEmail={visitorEmail} />
      <MissionModal 
        open={showMission} 
        onOpenChange={setShowMission}
        onSignUpClick={() => {
          setSignInDefaultTab('signup');
          setShowSignIn(true);
        }}
        onContributorClick={() => setShowContributor(true)}
      />
      <ContributorModal 
        open={showContributor} 
        onClose={() => {
          setShowContributor(false);
          setCountry('United States');
        }}
        defaultName={visitorName}
        defaultEmail={visitorEmail}
        country={country}
        customTitle={`No data for ${country} yet`}
        customMessage={`We don't have media landscape data for ${country} yet. Create a free account to become a Member and help us build this dataset!`}
        isAuthenticated={!!user}
        onSignUpClick={() => {
          setSignInDefaultTab('signup');
          setShowSignIn(true);
        }}
      />
      <AdminModal open={showAdmin} onClose={() => setShowAdmin(false)} />
      <SignInModal 
        open={showSignIn} 
        onClose={() => setShowSignIn(false)} 
        defaultTab={signInDefaultTab}
      />
      <MemberDashboardModal
        open={showMemberDashboard}
        onOpenChange={setShowMemberDashboard}
        userName={user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member'}
      />
      <ContributorDashboardModal
        open={showContributorDashboard}
        onOpenChange={setShowContributorDashboard}
        userName={user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Contributor'}
      />
      <ModeratorDashboardModal
        open={showModeratorDashboard}
        onOpenChange={setShowModeratorDashboard}
        userName={user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Moderator'}
      />
      <NewsModal
        open={showNews}
        onOpenChange={setShowNews}
      />
      <WelcomeModal 
        open={showWelcome} 
        onOpenChange={setShowWelcome} 
        userName={visitorName}
        onStartExploring={startTour}
      />
      <ContributorCelebration
        open={showContributorCelebration}
        onOpenChange={setShowContributorCelebration}
        userName={user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member'}
      />
      <SpectrumInputModal
        isOpen={showSpectrumInput}
        onClose={() => setShowSpectrumInput(false)}
        onSubmit={(result) => {
          setUserPoliticalScore(result.overallPosition.numericValue);
          setViewMode('compass');
          setShowSpectrumInput(false);
        }}
        userName={user?.user_metadata?.full_name || visitorName || 'You'}
        user={user}
      />
      
      {/* Comments Section - visible for all users */}
      <CommentsSection 
        country={country} 
        onSignUpClick={() => {
          setSignInDefaultTab('signup');
          setShowSignIn(true);
        }}
      />
      
      {/* Guided Tour Card */}
      <TourCard />
    </div>
  );
};

export default MediaDashboard;
