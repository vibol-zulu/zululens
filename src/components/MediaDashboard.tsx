import React, { useState, useRef, useEffect } from 'react';
import { YearData, ViewMode } from '@/types/media';
import { COUNTRIES } from '@/data/mediaData';
import MediaCanvas from '@/components/MediaCanvas';
import Sidebar from '@/components/MediaSidebar';
import InsightsModal from '@/components/InsightsModal';
import MethodologyModal from '@/components/MethodologyModal';
import ContactModal from '@/components/ContactModal';
import ContributorModal from '@/components/ContributorModal';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { COLORS } from '@/types/media';

interface MediaDashboardProps {
  visitorName: string;
  visitorEmail: string;
  data: Record<number, YearData>;
}

const MediaDashboard: React.FC<MediaDashboardProps> = ({
  visitorName,
  visitorEmail,
  data
}) => {
  const isMobile = useIsMobile();
  
  const [year, setYear] = useState<number>(2025);
  const [country, setCountry] = useState<string>('United States');
  const [viewMode, setViewMode] = useState<ViewMode>('default');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  
  const [showInsights, setShowInsights] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showContributor, setShowContributor] = useState(false);

  // Check if country has data (only United States has data currently)
  const countryHasData = country === 'United States';

  const handleCountryChange = (value: string) => {
    setCountry(value);
    setSelectedIds(new Set());
    
    // Show contributor modal if country has no data
    if (value !== 'United States') {
      setShowContributor(true);
    }
  };

  const toggleBrand = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = (category: string) => {
    const brands = data[year].brands.filter(b => b.category === category);
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
      <header className="h-14 border-b bg-card flex items-center px-4 justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          {/* Country Selector */}
          <Select value={country} onValueChange={handleCountryChange}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

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

          {/* View Toggle */}
          <div className="flex bg-muted rounded-full p-0.5 ml-2">
            <button 
              onClick={() => setViewMode('default')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                viewMode === 'default' 
                  ? 'bg-card shadow-sm text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Microscope
            </button>
            <button 
              onClick={() => setViewMode('compass')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                viewMode === 'compass' 
                  ? 'bg-card shadow-sm text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Spectrum
            </button>
          </div>
        </div>

        {/* Right side menu */}
        <div className="flex items-center gap-3">
          {!isMobile && (
            <span className="text-sm text-muted-foreground">
              Welcome, {visitorName}
            </span>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setShowInsights(true)}>
                Insights
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowMethodology(true)}>
                Methodology
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowContact(true)}>
                Contact
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main */}
      <main className={`flex-1 relative overflow-hidden bg-background ${isMobile ? 'flex flex-col' : ''}`}>
        {/* Canvas Container */}
        <div 
          className={`${
            isMobile 
              ? 'relative h-1/2 border-b' 
              : 'absolute top-0 bottom-0 z-[1] transition-all duration-300'
          }`}
          style={!isMobile ? {
            left: leftSidebarOpen ? '280px' : '0',
            right: rightSidebarOpen ? '280px' : '0'
          } : undefined}
        >
          <MediaCanvas
            year={year}
            data={data}
            selectedIds={selectedIds}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
            onCircleClick={handleCircleClick}
            viewMode={viewMode}
            country={country}
          />
        </div>

        {/* Mobile Sidebars */}
        {isMobile && (
          <div className="flex-1 flex w-full overflow-hidden z-10 bg-card">
            <Sidebar 
              category="corporate" 
              brands={country === 'United States' ? data[year].brands.filter(b => b.category === 'corporate') : []}
              selectedIds={selectedIds}
              onToggle={toggleBrand}
              onToggleAll={toggleAll}
              side="left"
              isOpen={true}
              onToggleSidebar={() => {}}
              isMobile={true}
            />
            <Sidebar 
              category="independent" 
              brands={country === 'United States' ? data[year].brands.filter(b => b.category === 'independent') : []}
              selectedIds={selectedIds}
              onToggle={toggleBrand}
              onToggleAll={toggleAll}
              side="right"
              isOpen={true}
              onToggleSidebar={() => {}}
              isMobile={true}
            />
          </div>
        )}

        {/* Desktop Floating Sidebars */}
        {!isMobile && (
          <>
            <Sidebar 
              category="corporate" 
              brands={country === 'United States' ? data[year].brands.filter(b => b.category === 'corporate') : []}
              selectedIds={selectedIds}
              onToggle={toggleBrand}
              onToggleAll={toggleAll}
              side="left"
              isOpen={leftSidebarOpen}
              onToggleSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
            />
            
            <Sidebar 
              category="independent" 
              brands={country === 'United States' ? data[year].brands.filter(b => b.category === 'independent') : []}
              selectedIds={selectedIds}
              onToggle={toggleBrand}
              onToggleAll={toggleAll}
              side="right"
              isOpen={rightSidebarOpen}
              onToggleSidebar={() => setRightSidebarOpen(!rightSidebarOpen)}
            />
          </>
        )}
      </main>
      
      <InsightsModal open={showInsights} onClose={() => setShowInsights(false)} />
      <MethodologyModal open={showMethodology} onClose={() => setShowMethodology(false)} />
      <ContactModal open={showContact} onClose={() => setShowContact(false)} />
      <ContributorModal 
        open={showContributor} 
        onClose={() => setShowContributor(false)}
        defaultName={visitorName}
        defaultEmail={visitorEmail}
        country={country}
      />
    </div>
  );
};

export default MediaDashboard;
