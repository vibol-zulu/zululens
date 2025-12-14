import React, { useState, useMemo } from 'react';
import { BrandData, Category, COLORS } from '@/types/media';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AddChannelModal from './AddChannelModal';
import ContributorModal from './ContributorModal';
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
  isMobile?: boolean;
}

const BrandItem: React.FC<BrandItemProps> = ({ brand, isSelected, onToggle, isMobile }) => (
  <div 
    className={cn(
      "flex items-start gap-2 transition-opacity",
      isMobile ? "gap-2" : "gap-3",
      isSelected ? "opacity-100" : "opacity-70"
    )}
  >
    <Checkbox 
      id={`cb-${brand.id}`}
      checked={isSelected} 
      onCheckedChange={() => onToggle(brand.id)}
      className="mt-1"
    />
    <label 
      htmlFor={`cb-${brand.id}`}
      className={cn("cursor-pointer leading-tight flex-1", isMobile ? "text-xs" : "text-sm")}
    >
      <span className={cn("font-medium", isSelected && "font-semibold")}>
        {brand.name}
      </span>
      <span className={cn("text-muted-foreground ml-1", isMobile ? "text-xs" : "text-xs")}>({brand.valueMillions}M)</span>
      <div className={cn("text-muted-foreground italic mt-0.5", isMobile ? "text-[10px]" : "text-xs")}>{brand.platform}</div>
    </label>
  </div>
);

interface CollapsibleSectionProps {
  title: string;
  brands: BrandData[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  defaultOpen?: boolean;
  isMobile?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  brands,
  selectedIds,
  onToggle,
  defaultOpen = true,
  isMobile = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const sorted = [...brands].sort((a, b) => b.valueMillions - a.valueMillions);

  if (sorted.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-3">
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-2 bg-muted/50 rounded-md hover:bg-muted transition-colors">
        <span className={cn("font-semibold", isMobile ? "text-xs" : "text-sm")}>{title}</span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <div className={cn("space-y-2", isMobile ? "pl-2" : "pl-2 space-y-3")}>
          {sorted.map(b => (
            <BrandItem 
              key={b.id} 
              brand={b} 
              isSelected={selectedIds.has(b.id)} 
              onToggle={onToggle}
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
  visitorEmail = ''
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showContributorModal, setShowContributorModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isContributor } = useAuth();
  
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
    if (isContributor) {
      setShowAddModal(true);
    } else {
      setShowContributorModal(true);
    }
  };
  const allSelected = sorted.length > 0 && sorted.every(b => selectedIds.has(b.id));
  const color = category === 'corporate' ? COLORS.corporate : COLORS.independent;
  const textColorClass = category === 'corporate' ? 'text-corporate' : 'text-orange-600';

  // For corporate category, split into Big 6 and Others (use filtered brands for search)
  const isCorporate = category === 'corporate';
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

  if (isMobile) {
    return (
      <div className="flex-1 border-r last:border-r-0 border-border bg-card overflow-hidden flex flex-col">
        <div 
          className="p-3 border-b border-border"
          style={{ backgroundColor: headerBgColor }}
        >
          <h3 
            className="font-semibold capitalize text-sm text-center"
            style={{ color: headerTextColor }}
          >
            {category}
          </h3>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-3">
            <div className="flex gap-2 mb-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onToggleAll(category)}
                disabled={sorted.length === 0}
                className="flex-1 text-xs"
              >
                {allSelected && sorted.length > 0 ? 'Deselect All' : 'Select All'}
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddClick}
                      className="px-2"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add a new channel</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 h-8 text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            {sorted.length === 0 && (
              <p className="text-center text-muted-foreground text-xs italic py-4">
                No data available
              </p>
            )}
            {isCorporate ? (
              <>
                <CollapsibleSection 
                  title="Big 6" 
                  brands={big6Filtered} 
                  selectedIds={selectedIds} 
                  onToggle={onToggle}
                  isMobile={true}
                />
                <CollapsibleSection 
                  title="Others" 
                  brands={othersFiltered} 
                  selectedIds={selectedIds} 
                  onToggle={onToggle}
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
          customMessage="Become a contributor to add channels and help build the media landscape dataset."
        />
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "absolute top-0 bottom-0 z-10 w-[280px] bg-card/95 backdrop-blur-sm",
        "flex flex-col border-border transition-transform duration-300",
        side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
        !isOpen && (side === 'left' ? '-translate-x-[calc(100%-12px)]' : 'translate-x-[calc(100%-12px)]')
      )}
    >
      <div 
        className="p-4 border-b border-border/50"
        style={{ backgroundColor: headerBgColor }}
      >
        <h3 
          className="font-semibold capitalize text-center"
          style={{ color: headerTextColor }}
        >
          {category}
        </h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="flex gap-2 mb-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onToggleAll(category)}
            disabled={sorted.length === 0}
            className="flex-1"
          >
            {allSelected && sorted.length > 0 ? 'Deselect All' : 'Select All'}
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddClick}
                className="px-3"
              >
                <Plus className="h-4 w-4" />
              </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add a new channel</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        <div>
          {sorted.length === 0 && (
            <p className="text-center text-muted-foreground text-sm italic py-4">
              No data available
            </p>
          )}
          {isCorporate ? (
            <>
              <CollapsibleSection 
                title="Big 6" 
                brands={big6Filtered} 
                selectedIds={selectedIds} 
                onToggle={onToggle}
              />
              <CollapsibleSection 
                title="Others" 
                brands={othersFiltered} 
                selectedIds={selectedIds} 
                onToggle={onToggle}
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
        customMessage="Become a contributor to add channels and help build the media landscape dataset."
      />
    </div>
  );
};

export default Sidebar;
