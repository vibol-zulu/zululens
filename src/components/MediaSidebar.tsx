import React, { useState } from 'react';
import { BrandData, Category, COLORS } from '@/types/media';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  isMobile = false
}) => {
  const sorted = [...brands].sort((a, b) => b.valueMillions - a.valueMillions);
  const allSelected = sorted.length > 0 && sorted.every(b => selectedIds.has(b.id));
  const color = category === 'corporate' ? COLORS.corporate : COLORS.independent;
  const textColorClass = category === 'corporate' ? 'text-corporate' : 'text-orange-600';

  // For corporate category, split into Big 6 and Others
  const isCorporate = category === 'corporate';
  const big6Brands = isCorporate ? brands.filter(b => BIG_6_NAMES.some(name => b.name.includes(name.split(' ')[0]) || name.includes(b.name.split(' ')[0]))) : [];
  const otherBrands = isCorporate ? brands.filter(b => !big6Brands.includes(b)) : [];

  // More accurate matching for Big 6
  const big6Filtered = isCorporate ? brands.filter(b => {
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
  const othersFiltered = isCorporate ? brands.filter(b => !big6Filtered.includes(b)) : [];

  if (isMobile) {
    return (
      <div className="flex-1 border-r last:border-r-0 border-border bg-card overflow-hidden flex flex-col">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: color }}
            />
            <h3 className={cn("font-semibold capitalize text-sm", textColorClass)}>
              {category}
            </h3>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onToggleAll(category)}
            disabled={sorted.length === 0}
            className="w-full text-xs"
          >
            {allSelected && sorted.length > 0 ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-3">
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
      <ScrollArea className="flex-1 p-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: color }}
          />
          <h3 className={cn("font-semibold capitalize", textColorClass)}>
            {category}
          </h3>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onToggleAll(category)}
          disabled={sorted.length === 0}
          className="w-full mb-4"
        >
          {allSelected && sorted.length > 0 ? 'Deselect All' : 'Select All'}
        </Button>

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
    </div>
  );
};

export default Sidebar;
