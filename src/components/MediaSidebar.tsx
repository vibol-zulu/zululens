import React from 'react';
import { BrandData, Category, COLORS } from '@/types/media';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
          <div className="p-3 space-y-2">
            {sorted.length === 0 && (
              <p className="text-center text-muted-foreground text-xs italic py-4">
                No data available
              </p>
            )}
            {sorted.map(b => (
              <div 
                key={b.id} 
                className={cn(
                  "flex items-start gap-2 transition-opacity",
                  selectedIds.has(b.id) ? "opacity-100" : "opacity-70"
                )}
              >
                <Checkbox 
                  id={`cb-${b.id}`}
                  checked={selectedIds.has(b.id)} 
                  onCheckedChange={() => onToggle(b.id)}
                  className="mt-1"
                />
                <label 
                  htmlFor={`cb-${b.id}`}
                  className="cursor-pointer text-xs leading-tight flex-1"
                >
                  <span className={cn("font-medium", selectedIds.has(b.id) && "font-semibold")}>
                    {b.name}
                  </span>
                  <span className="text-muted-foreground ml-1">({b.valueMillions}M)</span>
                  <div className="text-muted-foreground text-[10px] italic mt-0.5">{b.platform}</div>
                </label>
              </div>
            ))}
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

        <div className="space-y-3">
          {sorted.length === 0 && (
            <p className="text-center text-muted-foreground text-sm italic py-4">
              No data available
            </p>
          )}
          {sorted.map(b => (
            <div 
              key={b.id} 
              className={cn(
                "flex items-start gap-3 transition-opacity",
                selectedIds.has(b.id) ? "opacity-100" : "opacity-70"
              )}
            >
              <Checkbox 
                id={`cb-${b.id}`}
                checked={selectedIds.has(b.id)} 
                onCheckedChange={() => onToggle(b.id)}
                className="mt-1"
              />
              <label 
                htmlFor={`cb-${b.id}`}
                className="cursor-pointer text-sm leading-tight flex-1"
              >
                <span className={cn("font-medium", selectedIds.has(b.id) && "font-semibold")}>
                  {b.name}
                </span>
                <span className="text-muted-foreground ml-1 text-xs">({b.valueMillions}M)</span>
                <div className="text-muted-foreground text-xs italic mt-0.5">{b.platform}</div>
              </label>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <SidebarToggle side={side} isOpen={isOpen} onClick={onToggleSidebar} />
    </div>
  );
};

export default Sidebar;
