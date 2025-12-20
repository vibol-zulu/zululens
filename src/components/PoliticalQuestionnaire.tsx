import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PoliticalQuestion {
  id: string;
  text: string;
  explanation: string;
  category: 'economic' | 'social' | 'governance';
  weight: number;
}

// Fallback questions if AI generation fails
const FALLBACK_QUESTIONS: PoliticalQuestion[] = [
  { id: 'q1', text: 'The government should play a larger role in regulating the economy.', explanation: 'This asks whether you believe government oversight of businesses and markets leads to better outcomes than letting the free market operate independently.', category: 'economic', weight: 1 },
  { id: 'q2', text: 'Traditional values and institutions are important to preserve.', explanation: 'This explores whether you prioritize maintaining established social norms and customs versus embracing progressive social changes.', category: 'social', weight: -1 },
  { id: 'q3', text: 'Wealthy individuals and corporations should pay significantly higher taxes.', explanation: 'This addresses income redistribution—whether higher earners should contribute more to fund public services and reduce inequality.', category: 'economic', weight: 1 },
  { id: 'q4', text: 'Immigration policies should prioritize national security over openness.', explanation: 'This weighs stricter border controls and vetting against more welcoming policies for migrants and refugees.', category: 'social', weight: -1 },
  { id: 'q5', text: 'Climate change requires immediate government intervention, even at economic cost.', explanation: 'This asks if environmental protection should take precedence over short-term economic considerations like jobs and industry profits.', category: 'governance', weight: 1 },
  { id: 'q6', text: 'Free markets are generally more effective than government programs at solving problems.', explanation: 'This tests your belief in private sector efficiency versus government-led solutions for societal challenges.', category: 'economic', weight: -1 },
  { id: 'q7', text: 'Social programs should be expanded to reduce inequality.', explanation: 'This asks whether government should provide more support (healthcare, education, welfare) to create a more equal society.', category: 'social', weight: 1 },
  { id: 'q8', text: 'Strong national defense is more important than diplomatic solutions.', explanation: 'This explores whether military strength or international cooperation should be the primary tool for national security.', category: 'governance', weight: -1 },
];

const SCALE_OPTIONS = [
  { value: -2, label: 'Strongly Disagree' },
  { value: -1, label: 'Disagree' },
  { value: 0, label: 'Neutral' },
  { value: 1, label: 'Agree' },
  { value: 2, label: 'Strongly Agree' },
];

const CALCULATING_MESSAGES = [
  'Analyzing your responses...',
  'Comparing political perspectives...',
  'Calculating your position...',
  'Finalizing results...',
];

interface RefinedResult {
  numericValue: number;
  label: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

function calculateRefinedPosition(
  answers: Record<string, number>,
  questions: PoliticalQuestion[],
  originalScore: number
): RefinedResult {
  let totalScore = 0;
  let answeredCount = 0;

  Object.entries(answers).forEach(([questionId, answer]) => {
    const question = questions.find(q => q.id === questionId);
    const weight = question?.weight || 0;
    totalScore += answer * weight;
    answeredCount++;
  });

  if (answeredCount === 0) {
    return {
      numericValue: originalScore,
      label: 'Unable to determine',
      description: 'Please answer at least one question to refine your position.',
      confidence: 'low',
    };
  }

  // Normalize the questionnaire score to -100 to +100 range
  const maxPossibleScore = questions.length * 2;
  const normalizedQuestionnaireScore = (totalScore / maxPossibleScore) * 100;

  // Blend original channel-based score with questionnaire score (40/60)
  const blendedScore = originalScore * 0.4 + normalizedQuestionnaireScore * 0.6;
  const finalScore = Math.max(-100, Math.min(100, blendedScore));

  // Determine confidence based on answer consistency
  const answerVariance = Object.values(answers).reduce((sum, a) => sum + Math.abs(a), 0) / answeredCount;
  const confidence: 'high' | 'medium' | 'low' = 
    answerVariance >= 1.5 ? 'high' : answerVariance >= 0.8 ? 'medium' : 'low';

  let label: string;
  let description: string;

  if (finalScore <= -60) {
    label = 'Far Left';
    description = 'Your responses indicate strong progressive values. You favor significant government intervention in the economy, robust social programs, and prioritize social equality and environmental protection.';
  } else if (finalScore <= -20) {
    label = 'Left-Leaning';
    description = 'Your responses suggest center-left values. You generally support government programs to address inequality while maintaining market-based solutions for some issues.';
  } else if (finalScore <= 20) {
    label = 'Center';
    description = 'Your responses reflect a balanced perspective. You draw from both progressive and conservative viewpoints depending on the specific issue, valuing pragmatic solutions.';
  } else if (finalScore <= 60) {
    label = 'Right-Leaning';
    description = 'Your responses indicate center-right values. You generally favor free market solutions, traditional institutions, and limited government intervention.';
  } else {
    label = 'Far Right';
    description = 'Your responses indicate strong conservative values. You favor minimal government intervention in the economy, traditional values, and prioritize national security and individual liberty.';
  }

  return {
    numericValue: Math.round(finalScore),
    label,
    description,
    confidence,
  };
}

interface PoliticalQuestionnaireProps {
  originalScore: number;
  country: string;
  onComplete: (result: RefinedResult) => void;
  onCancel: () => void;
}

const PoliticalQuestionnaire: React.FC<PoliticalQuestionnaireProps> = ({
  originalScore,
  country,
  onComplete,
  onCancel,
}) => {
  const [questions, setQuestions] = useState<PoliticalQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatingStep, setCalculatingStep] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [calculatedResult, setCalculatedResult] = useState<RefinedResult | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('generate-political-questions', {
          body: { country }
        });

        if (error) throw error;

        if (data?.questions && Array.isArray(data.questions)) {
          setQuestions(data.questions);
          console.log(`Loaded ${data.questions.length} AI-generated questions for ${country}`);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Failed to fetch AI questions, using fallback:', error);
        toast.error('Using standard questions (AI generation unavailable)');
        setQuestions(FALLBACK_QUESTIONS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [country]);

  // Calculating animation effect
  useEffect(() => {
    if (isCalculating && calculatingStep < CALCULATING_MESSAGES.length) {
      const timer = setTimeout(() => {
        setCalculatingStep(prev => prev + 1);
      }, 700);
      return () => clearTimeout(timer);
    } else if (isCalculating && calculatingStep >= CALCULATING_MESSAGES.length) {
      // Show result after all messages
      setTimeout(() => {
        setIsCalculating(false);
        setShowResult(true);
      }, 400);
    }
  }, [isCalculating, calculatingStep]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  const handleAnswer = (value: number) => {
    if (currentQuestion) {
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    const result = calculateRefinedPosition(answers, questions, originalScore);
    setCalculatedResult(result);
    setIsCalculating(true);
    setCalculatingStep(0);
  };

  const handleRevealComplete = () => {
    if (calculatedResult) {
      onComplete(calculatedResult);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Generating questions for {country}...
        </p>
      </div>
    );
  }

  // Calculating animation screen
  if (isCalculating) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="relative">
          <div className="absolute inset-0 animate-ping">
            <Sparkles className="h-8 w-8 text-primary/30" />
          </div>
          <Sparkles className="h-8 w-8 text-primary animate-pulse" />
        </div>
        <div className="space-y-2 text-center">
          {CALCULATING_MESSAGES.slice(0, calculatingStep + 1).map((message, idx) => (
            <p 
              key={idx} 
              className={`text-sm transition-all duration-300 ${
                idx === calculatingStep 
                  ? 'text-foreground font-medium' 
                  : 'text-muted-foreground text-xs'
              }`}
              style={{
                opacity: idx === calculatingStep ? 1 : 0.5,
                transform: idx === calculatingStep ? 'scale(1)' : 'scale(0.95)',
              }}
            >
              {message}
            </p>
          ))}
        </div>
        <div className="flex gap-1 mt-2">
          {CALCULATING_MESSAGES.map((_, idx) => (
            <div 
              key={idx}
              className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                idx <= calculatingStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Result reveal screen
  if (showResult && calculatedResult) {
    return (
      <div className="py-4 space-y-4 animate-fade-in">
        {/* Result badge with glow effect */}
        <div className="text-center space-y-3">
          <div className="inline-block relative">
            <div 
              className="absolute inset-0 blur-xl opacity-50 rounded-full"
              style={{
                background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.5) 100%)`,
              }}
            />
            <div className="relative px-6 py-3 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 rounded-full border border-primary/30">
              <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1 animate-pulse" />
              <span className="text-lg font-bold text-primary">
                {calculatedResult.label}
              </span>
            </div>
          </div>
          
          {/* Score reveal with animation */}
          <div 
            className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent"
            style={{
              animation: 'scale-in 0.5s ease-out 0.2s both',
            }}
          >
            {calculatedResult.numericValue > 0 ? '+' : ''}{calculatedResult.numericValue}
          </div>

          {/* Confidence badge */}
          <div 
            className="inline-flex items-center gap-2"
            style={{
              animation: 'fade-in 0.5s ease-out 0.4s both',
            }}
          >
            <span className="text-xs text-muted-foreground">Confidence:</span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              calculatedResult.confidence === 'high' 
                ? 'bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30'
                : calculatedResult.confidence === 'medium'
                ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30'
                : 'bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30'
            }`}>
              {calculatedResult.confidence.charAt(0).toUpperCase() + calculatedResult.confidence.slice(1)}
            </span>
          </div>
        </div>

        {/* Description */}
        <p 
          className="text-sm text-muted-foreground text-center leading-relaxed"
          style={{
            animation: 'fade-in 0.5s ease-out 0.6s both',
          }}
        >
          {calculatedResult.description}
        </p>

        {/* Continue button */}
        <Button
          onClick={handleRevealComplete}
          className="w-full mt-4"
          style={{
            animation: 'fade-in 0.5s ease-out 0.8s both',
          }}
        >
          <Check className="h-4 w-4 mr-2" />
          Continue
        </Button>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">No questions available.</p>
        <Button variant="ghost" size="sm" onClick={onCancel} className="mt-2">
          Go Back
        </Button>
      </div>
    );
  }

  const currentAnswer = answers[currentQuestion.id];
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const canSubmit = Object.keys(answers).length === totalQuestions;

  return (
    <div className="space-y-4">
      {/* Region indicator */}
      <div className="text-xs text-muted-foreground text-center">
        Questions tailored for <span className="font-medium text-foreground">{country}</span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Question {currentIndex + 1} of {totalQuestions}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="py-3 space-y-2">
        <p className="text-sm font-medium leading-relaxed">
          {currentQuestion.text}
        </p>
        {currentQuestion.explanation && (
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            {currentQuestion.explanation}
          </p>
        )}
      </div>

      {/* Scale options */}
      <div className="space-y-2">
        {SCALE_OPTIONS.map(option => (
          <button
            key={option.value}
            onClick={() => handleAnswer(option.value)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all ${
              currentAnswer === option.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 hover:bg-muted text-foreground'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={currentIndex === 0 ? onCancel : handlePrev}
          className="text-xs"
        >
          <ArrowLeft className="h-3 w-3 mr-1" />
          {currentIndex === 0 ? 'Cancel' : 'Previous'}
        </Button>

        {isLastQuestion ? (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="text-xs"
          >
            <Check className="h-3 w-3 mr-1" />
            See Results
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleNext}
            disabled={currentAnswer === undefined}
            className="text-xs"
          >
            Next
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default PoliticalQuestionnaire;
export type { RefinedResult };
