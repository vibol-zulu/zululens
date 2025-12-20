import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Globe, UserPlus, ChevronRight, ChevronLeft } from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  onStartExploring?: () => void;
  onSignUpClick?: () => void;
}

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    icon: <Globe className="h-8 w-8" />,
    title: "Map the Media Landscape",
    description: "Discover how media channels position themselves politically across countries. Compare audience sizes and explore the spectrum of news sources.",
  },
  {
    icon: <UserPlus className="h-8 w-8" />,
    title: "Join the Community",
    description: "Create an account to contribute channel suggestions, engage in discussions, and help build the most comprehensive media map in the world.",
  },
];

const WelcomeModal: React.FC<WelcomeModalProps> = ({
  open,
  onOpenChange,
  userName,
  onStartExploring,
  onSignUpClick
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const isLastStep = currentStep === onboardingSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onOpenChange(false);
      onSignUpClick?.();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto p-0" hideCloseButton>
        <div className="flex flex-col">
          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 pt-6 px-6">
            {onboardingSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'w-8 bg-primary' 
                    : index < currentStep 
                      ? 'w-4 bg-primary/50' 
                      : 'w-4 bg-muted'
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-primary/10 text-primary">
                {currentStepData.icon}
              </div>
            </div>

            {/* Title & Description */}
            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-semibold">
                {currentStepData.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            {/* Step Counter */}
            <p className="text-center text-xs text-muted-foreground">
              {currentStep + 1} of {onboardingSteps.length}
            </p>
          </div>

          {/* Navigation */}
          <div className="p-6 pt-0">
            <div className="flex gap-3">
              {!isFirstStep && (
                <Button 
                  variant="outline" 
                  onClick={handlePrevious}
                  className="flex-1"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button 
                onClick={handleNext} 
                className={isFirstStep ? "w-full" : "flex-1"}
              >
                {isLastStep ? (
                  <>
                    Create Account
                    <UserPlus className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
