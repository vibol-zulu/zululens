import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type TourStep = 'select-all' | 'add-button' | 'country-year' | 'view-toggle' | null;

interface GuidedTourProps {
  currentStep: TourStep;
  onNext: () => void;
  onClose: () => void;
}

const tourContent: Record<Exclude<TourStep, null>, { title: string; description: string }> = {
  'select-all': {
    title: 'Select/Deselect All',
    description: 'Click here to quickly select or deselect all channels in this category to show or hide them on the visualization.'
  },
  'add-button': {
    title: 'Add Channel',
    description: 'Suggest new media channels to add to the dataset. Create an account to start contributing!'
  },
  'country-year': {
    title: 'Country & Year',
    description: 'Use these dropdowns to explore media landscapes across different countries and compare how the landscape has changed between 2000 and 2025.'
  },
  'view-toggle': {
    title: 'View Modes',
    description: 'Switch between Microscope view (size-based visualization) and Spectrum view (political lean distribution).'
  }
};

export const TourTooltip: React.FC<{
  step: Exclude<TourStep, null>;
  currentStep: TourStep;
  onNext: () => void;
  onClose: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  children: React.ReactNode;
}> = ({ step, currentStep, onNext, onClose, position = 'bottom', className, children }) => {
  const isActive = currentStep === step;
  const content = tourContent[step];
  const stepNumber = ['select-all', 'add-button', 'country-year', 'view-toggle'].indexOf(step) + 1;
  const triggerRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isActive && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const tooltipWidth = 256; // w-64 = 16rem = 256px
      const tooltipHeight = 160; // approximate height
      const gap = 8;

      let top = 0;
      let left = 0;

      switch (position) {
        case 'bottom':
          top = rect.bottom + gap;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'top':
          top = rect.top - tooltipHeight - gap;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + gap;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - gap;
          break;
      }

      // Keep tooltip within viewport
      left = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8));
      top = Math.max(8, top);

      setTooltipPos({ top, left });
    }
  }, [isActive, position]);

  const arrowStyles: Record<string, React.CSSProperties> = {
    top: { bottom: -8, left: '50%', transform: 'translateX(-50%)', borderWidth: 8, borderStyle: 'solid', borderColor: 'hsl(var(--primary)) transparent transparent transparent' },
    bottom: { top: -8, left: '50%', transform: 'translateX(-50%)', borderWidth: 8, borderStyle: 'solid', borderColor: 'transparent transparent hsl(var(--primary)) transparent' },
    left: { right: -8, top: '50%', transform: 'translateY(-50%)', borderWidth: 8, borderStyle: 'solid', borderColor: 'transparent transparent transparent hsl(var(--primary))' },
    right: { left: -8, top: '50%', transform: 'translateY(-50%)', borderWidth: 8, borderStyle: 'solid', borderColor: 'transparent hsl(var(--primary)) transparent transparent' }
  };

  return (
    <>
      <div ref={triggerRef} className={className} style={{ display: 'contents' }}>
        {children}
      </div>
      {isActive && createPortal(
        <div 
          className="fixed z-[9999] w-64 p-4 rounded-lg shadow-lg bg-primary text-primary-foreground"
          style={{ top: tooltipPos.top, left: tooltipPos.left }}
        >
          {/* Arrow */}
          <div className="absolute w-0 h-0" style={arrowStyles[position]} />
          
          {/* Header */}
          <h4 className="font-semibold text-sm mb-2">{content.title}</h4>
          
          {/* Content */}
          <p className="text-xs opacity-90 mb-3">{content.description}</p>
          
          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-xs opacity-70">{stepNumber} of 4</span>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={onNext}
              className="h-7 text-xs"
            >
              {stepNumber === 4 ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export const useTour = () => {
  const [currentStep, setCurrentStep] = React.useState<TourStep>(null);

  const startTour = () => setCurrentStep('select-all');
  
  const nextStep = () => {
    switch (currentStep) {
      case 'select-all':
        setCurrentStep('add-button');
        break;
      case 'add-button':
        setCurrentStep('country-year');
        break;
      case 'country-year':
        setCurrentStep('view-toggle');
        break;
      case 'view-toggle':
        setCurrentStep(null);
        break;
      default:
        setCurrentStep(null);
    }
  };

  const closeTour = () => setCurrentStep(null);

  return { currentStep, startTour, nextStep, closeTour };
};
