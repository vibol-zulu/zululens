import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export type TourStep = 'select-all' | 'add-button' | 'channel-item' | 'country-year' | 'view-toggle' | 'comments-news' | null;

const TOUR_STEPS: Exclude<TourStep, null>[] = ['select-all', 'add-button', 'channel-item', 'country-year', 'view-toggle', 'comments-news'];

const TOUR_STORAGE_KEY = 'guided-tour-dismissed';

const tourContent: Record<Exclude<TourStep, null>, { title: string; description: string; selector: string }> = {
  'select-all': {
    title: 'Select/Deselect All',
    description: 'Click here to quickly select or deselect all channels in this category to show or hide them on the visualization.',
    selector: '[data-tour="select-all"]'
  },
  'add-button': {
    title: 'Add Channel',
    description: 'Suggest new media channels to add to the dataset. Create an account to start contributing!',
    selector: '[data-tour="add-button"]'
  },
  'channel-item': {
    title: 'Individual Channels',
    description: 'Click on any checkbox to show or hide individual channels on the visualization. Each channel represents a media outlet.',
    selector: '[data-tour="channel-item"]'
  },
  'country-year': {
    title: 'Country & Year',
    description: 'Use these dropdowns to explore media landscapes across different countries and compare how the landscape has changed between 2000 and 2025.',
    selector: '[data-tour="country-year"]'
  },
  'view-toggle': {
    title: 'View Modes',
    description: 'Switch between Microscope view (size-based visualization) and Spectrum view (political lean distribution).',
    selector: '[data-tour="view-toggle"]'
  },
  'comments-news': {
    title: 'Comments & News',
    description: 'Click here to expand the comments section where you can discuss the media landscape with others. News updates appear on the right.',
    selector: '[data-tour="comments-news"]'
  }
};

interface GuidedTourCardProps {
  currentStep: TourStep;
  onNext: () => void;
  onSkip: () => void;
  dontShowAgain: boolean;
  onDontShowAgainChange: (checked: boolean) => void;
}

const GuidedTourCard: React.FC<GuidedTourCardProps> = ({
  currentStep,
  onNext,
  onSkip,
  dontShowAgain,
  onDontShowAgainChange
}) => {
  if (!currentStep) return null;

  const content = tourContent[currentStep];
  const stepNumber = TOUR_STEPS.indexOf(currentStep) + 1;
  const totalSteps = TOUR_STEPS.length;
  const isLastStep = stepNumber === totalSteps;

  return createPortal(
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[9998]" />
      
      {/* Center Card */}
      <div className="fixed inset-0 flex items-center justify-center z-[10001] pointer-events-none">
        <div className="bg-card text-card-foreground rounded-lg shadow-xl p-6 max-w-md w-full mx-4 pointer-events-auto border border-border">
          {/* Progress indicator */}
          <div className="flex gap-1 mb-4">
            {TOUR_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index < stepNumber ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <h3 className="text-lg font-semibold mb-2">{content.title}</h3>
          <p className="text-muted-foreground text-sm mb-6">{content.description}</p>

          {/* Don't show again checkbox */}
          <div className="flex items-center gap-2 mb-4">
            <Checkbox
              id="dont-show-again"
              checked={dontShowAgain}
              onCheckedChange={(checked) => onDontShowAgainChange(checked === true)}
            />
            <label
              htmlFor="dont-show-again"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Don't show this again
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Skip tour
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {stepNumber} of {totalSteps}
              </span>
              <Button size="sm" onClick={onNext}>
                {isLastStep ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

// Highlight component that wraps elements
export const TourHighlight: React.FC<{
  step: Exclude<TourStep, null>;
  currentStep: TourStep;
  children: React.ReactNode;
}> = ({ step, currentStep, children }) => {
  const isActive = currentStep === step;

  return (
    <div
      data-tour={step}
      className={`relative ${isActive ? 'z-[9999]' : ''}`}
      style={isActive ? {
        position: 'relative',
        boxShadow: '0 0 0 4px hsl(var(--primary))',
        borderRadius: '8px',
        background: 'hsl(var(--background))'
      } : undefined}
    >
      {children}
    </div>
  );
};

export const useTour = () => {
  const [currentStep, setCurrentStep] = useState<TourStep>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const startTour = () => {
    const dismissed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (dismissed === 'true') return;
    setCurrentStep('select-all');
  };

  const nextStep = () => {
    const currentIndex = currentStep ? TOUR_STEPS.indexOf(currentStep) : -1;
    if (currentIndex < TOUR_STEPS.length - 1) {
      setCurrentStep(TOUR_STEPS[currentIndex + 1]);
    } else {
      closeTour();
    }
  };

  const closeTour = () => {
    if (dontShowAgain) {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    }
    setCurrentStep(null);
    setDontShowAgain(false);
  };

  return {
    currentStep,
    startTour,
    nextStep,
    closeTour,
    dontShowAgain,
    setDontShowAgain,
    TourCard: () => (
      <GuidedTourCard
        currentStep={currentStep}
        onNext={nextStep}
        onSkip={closeTour}
        dontShowAgain={dontShowAgain}
        onDontShowAgainChange={setDontShowAgain}
      />
    )
  };
};
