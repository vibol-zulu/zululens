import React from 'react';
import { X } from 'lucide-react';
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

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-primary border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-primary border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-primary border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-primary border-y-transparent border-l-transparent'
  };

  return (
    <div className={cn("relative inline-flex", className)}>
      {children}
      {isActive && (
        <div 
          className={cn(
            "absolute z-[100] w-64 p-4 rounded-lg shadow-lg bg-primary text-primary-foreground",
            positionClasses[position]
          )}
        >
          {/* Arrow */}
          <div className={cn("absolute w-0 h-0 border-8", arrowClasses[position])} />
          
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary-foreground text-primary text-xs font-bold">
                {stepNumber}
              </span>
              <h4 className="font-semibold text-sm">{content.title}</h4>
            </div>
            <button 
              onClick={onClose}
              className="p-0.5 hover:bg-primary-foreground/20 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
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
        </div>
      )}
    </div>
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
