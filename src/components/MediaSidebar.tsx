import React, { useState, useMemo } from 'react';
import { BrandData, Category, COLORS } from '@/types/media';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Search, SquareArrowOutUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AddChannelModal from './AddChannelModal';
import ContributorModal from './ContributorModal';
import ChannelProfilePanel from './ChannelProfilePanel';
import { useAuth } from '@/hooks/useAuth';

// The Big 6 are the corporate channels from 2000
const BIG_6_NAMES = [
  'FOX News',
  'Fox News',
  'CNN',
  'CNN (Warner Bros. Discovery)',
  'MSNBC',
  'MSNBC (NBCUniversal)',
  'NBC Nightly News',
  'NBC News (NBCUniversal)',
  'ABC World News Tonight',
  'ABC News (Disney)',
  'CBS Evening News',
  'CBS News (Paramount)',
];

interface SidebarProps {
  category: Category;
  brands: BrandData[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (category: string) => void;
  side: 'left' | 'right';
  isOpen: boolean;
  onToggleSidebar: () => void;
  isMobile?: boolean;
  country: string;
  year: number;
  onChannelAdded: () => void;
  visitorName?: string;
  visitorEmail?: string;
  onSignUpClick?: () => void;
  onMethodologyClick?: () => void;
}

const SidebarToggle: React.FC<{ side: 'left' | 'right'; isOpen: boolean; onClick: () => void }> = ({ side, isOpen, onClick }) => (
  <button 
    onClick={onClick}
    className={cn(
      "absolute top-1/2 -translate-y-1/2 w-6 h-16 flex items-center justify-center",
      "bg-card border border-border rounded-md shadow-sm hover:bg-muted transition-colors",
      "text-muted-foreground hover:text-foreground",
      side === 'left' ? '-right-3' : '-left-3'
    )}
    aria-label={isOpen ? `Close ${side} sidebar` : `Open ${side} sidebar`}
  >
    {side === 'left' ? (
      isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
    ) : (
      isOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
    )}
  </button>
);

interface BrandItemProps {
  brand: BrandData;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onShowProfile: (id: string) => void;
  isMobile?: boolean;
  isFirstItem?: boolean;
}

const BrandItem: React.FC<BrandItemProps> = ({ 
  brand, 
  isSelected, 
  onToggle, 
  onShowProfile,
  isMobile, 
  isFirstItem
}) => {
  return (
    <div 
      className={cn(
        "flex items-start gap-2 transition-opacity group",
        isMobile ? "gap-2" : "gap-3",
        isSelected ? "opacity-100" : "opacity-70"
      )}
    >
      <Checkbox 
        id={`cb-${brand.id}`}
        checked={isSelected} 
        onCheckedChange={() => onToggle(brand.id)}
        className="mt-1 shrink-0"
        data-tour={isFirstItem ? "channel-item" : undefined}
      />
      <div className={cn("leading-tight flex-1 font-geist", isMobile ? "text-[10px]" : "text-xs")}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onShowProfile(brand.id)}
            className={cn(
              "font-medium text-left hover:text-primary hover:underline underline-offset-2 transition-colors cursor-pointer",
              isSelected && "font-semibold"
            )}
          >
            {brand.name}
          </button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onShowProfile(brand.id)}
                  className={cn(
                    "opacity-0 group-hover:opacity-100 transition-all duration-200",
                    "p-1 rounded-md hover:bg-primary/10 hover:scale-110",
                    "text-muted-foreground hover:text-primary",
                    isMobile ? "h-5 w-5" : "h-6 w-6"
                  )}
                >
                  <SquareArrowOutUpRight className={cn(isMobile ? "h-3.5 w-3.5" : "h-4 w-4")} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>View profile</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className={cn("text-muted-foreground", isMobile ? "text-[9px]" : "text-[10px]")}>({brand.valueMillions}M)</span>
        <div className={cn("text-muted-foreground italic mt-0.5", isMobile ? "text-[9px]" : "text-[10px]")}>{brand.platform}</div>
      </div>
    </div>
  );
};

interface CollapsibleSectionProps {
  title: string;
  brands: BrandData[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onShowProfile: (id: string) => void;
  defaultOpen?: boolean;
  isMobile?: boolean;
  showFirstItemTour?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  brands,
  selectedIds,
  onToggle,
  onShowProfile,
  defaultOpen = true,
  isMobile = false,
  showFirstItemTour = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const sorted = [...brands].sort((a, b) => b.valueMillions - a.valueMillions);

  if (sorted.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-3">
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-2 bg-muted/50 rounded-md hover:bg-muted transition-colors">
        <span className={cn("font-semibold font-sans", isMobile ? "text-xs" : "text-sm")}>{title}</span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <div className={cn("space-y-2", isMobile ? "pl-2" : "pl-2 space-y-3")}>
          {sorted.map((b, index) => (
            <BrandItem 
              key={b.id} 
              brand={b} 
              isSelected={selectedIds.has(b.id)} 
              onToggle={onToggle}
              onShowProfile={onShowProfile}
              isMobile={isMobile}
              isFirstItem={showFirstItemTour && index === 0}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// Country grouping component for Global view
interface CountryGroupProps {
  countryName: string;
  brands: BrandData[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onShowProfile: (id: string) => void;
  isMobile?: boolean;
  category: Category;
}

const CountryGroup: React.FC<CountryGroupProps> = ({
  countryName,
  brands,
  selectedIds,
  onToggle,
  onShowProfile,
  isMobile = false,
  category
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const sorted = [...brands].sort((a, b) => b.valueMillions - a.valueMillions);

  if (sorted.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-2">
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-2 bg-muted/70 rounded-md hover:bg-muted transition-colors border border-border/50">
        <div className="flex items-center gap-1">
          <span className={cn("font-semibold font-sans", isMobile ? "text-xs" : "text-sm")}>{countryName}</span>
          <span className={cn("text-muted-foreground", isMobile ? "text-[10px]" : "text-xs")}>
            ({sorted.length})
          </span>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <div className={cn("space-y-2 border-l-2 border-primary/20 ml-2", isMobile ? "pl-2" : "pl-3 space-y-3")}>
          {sorted.map((b) => (
            <BrandItem 
              key={b.id} 
              brand={b} 
              isSelected={selectedIds.has(b.id)} 
              onToggle={onToggle}
              onShowProfile={onShowProfile}
              isMobile={isMobile}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  category,
  brands,
  selectedIds,
  onToggle,
  onToggleAll,
  side,
  isOpen,
  onToggleSidebar,
  isMobile = false,
  country,
  year,
  onChannelAdded,
  visitorName = '',
  visitorEmail = '',
  onSignUpClick,
  onMethodologyClick
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showContributorModal, setShowContributorModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedProfileCategory, setSelectedProfileCategory] = useState<'corporate' | 'independent'>('corporate');
  const { user, isContributor } = useAuth();
  
  const handleShowProfile = (id: string) => {
    // Gate channel profiles behind authentication
    if (!user) {
      onSignUpClick?.();
      return;
    }
    setSelectedProfileId(id);
    setSelectedProfileCategory(category);
  };
  
  // Filter brands by search query
  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brands;
    const query = searchQuery.toLowerCase();
    return brands.filter(b => 
      b.name.toLowerCase().includes(query) || 
      b.platform.toLowerCase().includes(query)
    );
  }, [brands, searchQuery]);
  
  const sorted = [...filteredBrands].sort((a, b) => b.valueMillions - a.valueMillions);

  const handleAddClick = () => {
    // Tier 2+ (any authenticated user) can suggest channels
    if (user) {
      setShowAddModal(true);
    } else {
      // Unauthenticated users see contributor modal
      setShowContributorModal(true);
    }
  };
  const allSelected = sorted.length > 0 && sorted.every(b => selectedIds.has(b.id));
  const color = category === 'corporate' ? COLORS.corporate : COLORS.independent;
  const textColorClass = category === 'corporate' ? 'text-corporate' : 'text-orange-600';

  // For corporate category, split into Big 6 and Others (use filtered brands for search)
  const isCorporate = category === 'corporate';
  const isGlobal = country === 'Global';
  
  // Group brands by country for Global view
  const countriesMap = useMemo(() => {
    if (!isGlobal) return new Map<string, BrandData[]>();
    
    const map = new Map<string, BrandData[]>();
    filteredBrands.forEach(brand => {
      const brandCountry = brand.country || 'Unknown';
      if (!map.has(brandCountry)) {
        map.set(brandCountry, []);
      }
      map.get(brandCountry)!.push(brand);
    });
    
    // Sort countries alphabetically, but put "United States" first
    return new Map([...map.entries()].sort((a, b) => {
      if (a[0] === 'United States') return -1;
      if (b[0] === 'United States') return 1;
      return a[0].localeCompare(b[0]);
    }));
  }, [isGlobal, filteredBrands]);
  
  const big6Brands = isCorporate ? filteredBrands.filter(b => BIG_6_NAMES.some(name => b.name.includes(name.split(' ')[0]) || name.includes(b.name.split(' ')[0]))) : [];
  const otherBrands = isCorporate ? filteredBrands.filter(b => !big6Brands.includes(b)) : [];

  // More accurate matching for Big 6
  const big6Filtered = isCorporate ? filteredBrands.filter(b => {
    const lowerName = b.name.toLowerCase();
    return (
      lowerName.includes('fox news') ||
      lowerName.includes('cnn') ||
      lowerName.includes('msnbc') ||
      lowerName.includes('nbc n') || lowerName.includes('nbc news') ||
      lowerName.includes('abc w') || lowerName.includes('abc news') ||
      lowerName.includes('cbs e') || lowerName.includes('cbs news')
    );
  }) : [];
  const othersFiltered = isCorporate ? filteredBrands.filter(b => !big6Filtered.includes(b)) : [];

  // Determine header colors - corporate gets teal bg with peach text, independent gets peach bg with teal text
  const headerBgColor = category === 'corporate' ? COLORS.corporate : COLORS.independent;
  const headerTextColor = category === 'corporate' ? COLORS.independent : COLORS.corporate;
  // Button text always uses corporate (green/teal) color
  const buttonTextColor = COLORS.corporate;

  if (isMobile) {
    return (
      <div className="w-1/2 border-r last:border-r-0 border-border bg-card overflow-hidden flex flex-col min-w-0">
        <div 
          className="px-3 py-3 shrink-0 relative z-10"
          style={{ backgroundColor: headerBgColor, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        >
          <h3 
            className="font-semibold capitalize text-base text-center mb-1 font-sans"
            style={{ color: headerTextColor }}
          >
            {category}
          </h3>
          <p 
            className="text-[10px] text-center mb-2 opacity-80 leading-tight"
            style={{ color: headerTextColor }}
          >
            {category === 'corporate' 
              ? 'Large media conglomerates owned by major corporations'
              : 'Creator-driven outlets operating outside traditional ownership'}
          </p>
          <div className="flex gap-1 mb-2">
            <Button 
              data-tour={side === 'left' ? "select-all" : undefined}
              variant="outline" 
              size="sm" 
              onClick={() => onToggleAll(category)}
              disabled={sorted.length === 0}
              className="flex-1 text-xs px-3 h-8 bg-background/90 hover:bg-background"
              style={{ color: buttonTextColor }}
            >
              {allSelected && sorted.length > 0 ? 'Deselect All' : 'Select All'}
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    data-tour={side === 'left' ? "add-button" : undefined}
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddClick}
                    className="flex-1 text-xs px-3 h-8 bg-background/90 hover:bg-background"
                  >
                    <span style={{ color: buttonTextColor }}>Add Channel</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add a new channel</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-8 text-xs focus-visible:ring-0 focus-visible:ring-offset-0 bg-background/90"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="px-2 pt-1 pb-24">
            {sorted.length === 0 && (
              <p className="text-center text-muted-foreground text-xs italic py-4">
                No data available
              </p>
            )}
            {isGlobal ? (
              // Global view: show country dropdowns
              <div className="space-y-2">
                {Array.from(countriesMap.entries()).map(([countryName, countryBrands]) => (
                  <CountryGroup
                    key={countryName}
                    countryName={countryName}
                    brands={countryBrands}
                    selectedIds={selectedIds}
                    onToggle={onToggle}
                    onShowProfile={handleShowProfile}
                    isMobile={true}
                    category={category}
                  />
                ))}
              </div>
            ) : isCorporate ? (
              <>
                <CollapsibleSection 
                  title="Big 6" 
                  brands={big6Filtered} 
                  selectedIds={selectedIds} 
                  onToggle={onToggle}
                  onShowProfile={handleShowProfile}
                  isMobile={true}
                  showFirstItemTour={side === 'left'}
                />
                <CollapsibleSection 
                  title="Others" 
                  brands={othersFiltered} 
                  selectedIds={selectedIds} 
                  onToggle={onToggle}
                  onShowProfile={handleShowProfile}
                  isMobile={true}
                />
              </>
            ) : (
              <div className="space-y-2">
                {sorted.map(b => (
                  <BrandItem 
                    key={b.id} 
                    brand={b} 
                    isSelected={selectedIds.has(b.id)} 
                    onToggle={onToggle}
                    onShowProfile={handleShowProfile}
                    isMobile={true}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
        
        <AddChannelModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          category={category}
          country={country}
          year={year}
          onChannelAdded={onChannelAdded}
          existingChannelNames={brands.map(b => b.name)}
        />
        
        <ContributorModal
          open={showContributorModal}
          onClose={() => setShowContributorModal(false)}
          defaultName={visitorName}
          defaultEmail={visitorEmail}
          country={country}
          customTitle="Want to add a channel?"
          customMessage="Create a free account to become a Member and start suggesting channels for the media landscape dataset."
          isAuthenticated={!!user}
          onSignUpClick={onSignUpClick}
        />
        
        <ChannelProfilePanel
          channelId={selectedProfileId}
          category={selectedProfileCategory}
          onClose={() => setSelectedProfileId(null)}
          onMethodologyClick={onMethodologyClick}
        />
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "absolute top-0 bottom-0 z-10 w-[280px] bg-card backdrop-blur-sm",
        "flex flex-col border-border transition-transform duration-300",
        side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
        !isOpen && (side === 'left' ? '-translate-x-[calc(100%-12px)]' : 'translate-x-[calc(100%-12px)]')
      )}
    >
      <div 
        className="px-3 py-3 relative z-10"
        style={{ backgroundColor: headerBgColor, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        <h3 
          className="font-semibold capitalize text-center text-lg mb-1 font-sans"
          style={{ color: headerTextColor }}
        >
          {category}
        </h3>
        <p 
          className="text-xs text-center mb-2 opacity-80 leading-tight"
          style={{ color: headerTextColor }}
        >
          {category === 'corporate' 
            ? <>Large media conglomerates<br />owned by major corporations</>
            : 'Creator-driven outlets operating outside traditional ownership'}
        </p>
        <div className="flex gap-1.5 mb-2">
          <button 
            data-tour={side === 'left' ? "select-all" : undefined}
            onClick={() => onToggleAll(category)}
            disabled={sorted.length === 0}
            className="flex-1 text-xs px-3 py-2 rounded bg-background/80 hover:bg-background/95 transition-colors disabled:opacity-50"
            style={{ color: buttonTextColor }}
          >
            {allSelected && sorted.length > 0 ? 'Deselect All' : 'Select All'}
          </button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  data-tour={side === 'left' ? "add-button" : undefined}
                  onClick={handleAddClick}
                  className="flex-1 text-xs px-3 py-2 rounded bg-background/80 hover:bg-background/95 transition-colors"
                >
                  <span style={{ color: buttonTextColor }}>Add Channel</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add a new channel</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <input
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-3 py-2 text-xs rounded bg-background/80 border-0 focus:outline-none focus:bg-background/95 placeholder:text-muted-foreground/70"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 pt-2 pb-24">
          {sorted.length === 0 && (
            <p className="text-center text-muted-foreground text-sm italic py-4">
              No data available
            </p>
          )}
          {isGlobal ? (
            // Global view: show country dropdowns
            <div className="space-y-2">
              {Array.from(countriesMap.entries()).map(([countryName, countryBrands]) => (
                <CountryGroup
                  key={countryName}
                  countryName={countryName}
                  brands={countryBrands}
                  selectedIds={selectedIds}
                  onToggle={onToggle}
                  onShowProfile={handleShowProfile}
                  isMobile={false}
                  category={category}
                />
              ))}
            </div>
          ) : isCorporate ? (
            <>
              <CollapsibleSection 
                title="Big 6" 
                brands={big6Filtered} 
                selectedIds={selectedIds} 
                onToggle={onToggle}
                onShowProfile={handleShowProfile}
                showFirstItemTour={side === 'left'}
              />
              <CollapsibleSection 
                title="Others" 
                brands={othersFiltered} 
                selectedIds={selectedIds} 
                onToggle={onToggle}
                onShowProfile={handleShowProfile}
              />
            </>
          ) : (
            <div className="space-y-3">
              {sorted.map(b => (
                <BrandItem 
                  key={b.id} 
                  brand={b} 
                  isSelected={selectedIds.has(b.id)} 
                  onToggle={onToggle}
                  onShowProfile={handleShowProfile}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
      
      <SidebarToggle side={side} isOpen={isOpen} onClick={onToggleSidebar} />
      
      <AddChannelModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        category={category}
        country={country}
        year={year}
        onChannelAdded={onChannelAdded}
        existingChannelNames={brands.map(b => b.name)}
      />
      
      <ContributorModal
        open={showContributorModal}
        onClose={() => setShowContributorModal(false)}
        defaultName={visitorName}
        defaultEmail={visitorEmail}
        country={country}
        customTitle="Want to add a channel?"
        customMessage="Create a free account to become a Member and start suggesting channels for the media landscape dataset."
        isAuthenticated={!!user}
        onSignUpClick={onSignUpClick}
      />
      
      <ChannelProfilePanel
        channelId={selectedProfileId}
        category={selectedProfileCategory}
        onClose={() => setSelectedProfileId(null)}
        onMethodologyClick={onMethodologyClick}
      />
    </div>
  );
};

export default Sidebar;
