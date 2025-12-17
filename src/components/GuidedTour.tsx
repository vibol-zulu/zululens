import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export type TourStep = 'select-all' | 'add-button' | 'channel-item' | 'country-year' | 'view-toggle' | 'comments-news' | null;

const TOUR_STEPS: Exclude<TourStep, null>[] = ['select-all', 'add-button', 'channel-item', 'country-year', 'view-toggle', 'comments-news'];

const TOUR_STORAGE_KEY = 'guided-tour-dismissed';

const tourContent: Record<Exclude<TourStep, null>, { title: string; description: string }> = {
  'select-all': {
    title: 'Select/Deselect All',
    description: 'Click here to quickly select or deselect all channels in this category to show or hide them on the visualization.'
  },
  'add-button': {
    title: 'Add Channel',
    description: 'Suggest new media channels to add to the dataset. Create an account to start contributing!'
  },
  'channel-item': {
    title: 'Individual Channels',
    description: 'Click on any checkbox to show or hide individual channels on the visualization. Each channel represents a media outlet.'
  },
  'country-year': {
    title: 'Country & Year',
    description: 'Use these dropdowns to explore media landscapes across different countries and compare how the landscape has changed between 2000 and 2025.'
  },
  'view-toggle': {
    title: 'View Modes',
    description: 'Switch between Microscope view (size-based visualization) and Spectrum view (political lean distribution).'
  },
  'comments-news': {
    title: 'Comments & News',
    description: 'Click here to expand the comments section where you can discuss the media landscape with others. News updates appear on the right.'
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
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentStep) return;

    const findTarget = () => {
      const target = document.querySelector(`[data-tour="${currentStep}"]`);
      if (target) {
        setTargetRect(target.getBoundingClientRect());
      }
    };

    findTarget();
    // Re-calculate on resize
    window.addEventListener('resize', findTarget);
    return () => window.removeEventListener('resize', findTarget);
  }, [currentStep]);

  if (!currentStep) return null;

  const content = tourContent[currentStep];
  const stepNumber = TOUR_STEPS.indexOf(currentStep) + 1;
  const totalSteps = TOUR_STEPS.length;
  const isLastStep = stepNumber === totalSteps;

  // Calculate arrow position
  const cardWidth = 384; // max-w-sm = 24rem = 384px
  const cardHeight = 220; // approximate
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  // Position card in center
  const cardX = (windowWidth - cardWidth) / 2;
  const cardY = (windowHeight - cardHeight) / 2;

  // Calculate arrow points if we have a target
  let arrowPath = '';
  if (targetRect) {
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    
    // Determine which edge of card to start from based on target position
    let startX: number, startY: number;
    
    if (targetCenterX < cardX) {
      // Target is to the left
      startX = cardX;
      startY = cardY + cardHeight / 2;
    } else if (targetCenterX > cardX + cardWidth) {
      // Target is to the right
      startX = cardX + cardWidth;
      startY = cardY + cardHeight / 2;
    } else if (targetCenterY < cardY) {
      // Target is above
      startX = cardX + cardWidth / 2;
      startY = cardY;
    } else {
      // Target is below
      startX = cardX + cardWidth / 2;
      startY = cardY + cardHeight;
    }

    // Create curved path
    const midX = (startX + targetCenterX) / 2;
    const midY = (startY + targetCenterY) / 2;
    
    // Add some curve
    const curveOffsetX = (targetCenterY - startY) * 0.2;
    const curveOffsetY = (startX - targetCenterX) * 0.2;
    
    arrowPath = `M ${startX} ${startY} Q ${midX + curveOffsetX} ${midY + curveOffsetY} ${targetCenterX} ${targetCenterY}`;
  }

  return createPortal(
    <>
      {/* Arrow SVG */}
      {targetRect && (
        <svg
          className="fixed inset-0 z-[10000] pointer-events-none"
          style={{ width: '100vw', height: '100vh' }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#F8D4C8" />
            </marker>
          </defs>
          <path
            d={arrowPath}
            stroke="#F8D4C8"
            strokeWidth="3"
            fill="none"
            markerEnd="url(#arrowhead)"
            className="animate-pulse"
          />
          {/* Target circle indicator */}
          <circle
            cx={targetRect.left + targetRect.width / 2}
            cy={targetRect.top + targetRect.height / 2}
            r={Math.max(targetRect.width, targetRect.height) / 2 + 8}
            stroke="#F8D4C8"
            strokeWidth="2"
            fill="none"
            strokeDasharray="5,5"
            className="animate-pulse"
          />
        </svg>
      )}
      
      {/* Center Card */}
      <div className="fixed inset-0 flex items-center justify-center z-[10001] pointer-events-none">
        <div 
          ref={cardRef}
          className="bg-card text-card-foreground rounded-lg shadow-2xl p-6 max-w-sm w-full mx-4 pointer-events-auto border border-border drop-shadow-2xl"
        >
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
