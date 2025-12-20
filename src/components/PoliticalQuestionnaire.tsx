import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, HelpCircle, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import QuestionnaireChat from './QuestionnaireChat';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
interface PoliticalQuestion {
  id: string;
  text: string;
  explanation: string;
  category: 'economic' | 'social' | 'governance';
  weight: number;
}

// Fallback questions if AI generation fails
const FALLBACK_QUESTIONS: PoliticalQuestion[] = [
  { id: 'q1', text: 'Government should regulate the economy more.', explanation: 'This asks whether you believe government oversight of businesses and markets leads to better outcomes than letting the free market operate independently. Those on the left typically support more regulation while conservatives prefer less government involvement.', category: 'economic', weight: 1 },
  { id: 'q2', text: 'Traditional values should be preserved.', explanation: 'This explores whether you prioritize maintaining established social norms, customs, and institutions versus embracing progressive social changes. Conservatives typically value tradition while progressives favor reform.', category: 'social', weight: -1 },
  { id: 'q3', text: 'The wealthy should pay much higher taxes.', explanation: 'This addresses income redistribution—whether higher earners should contribute more to fund public services and reduce inequality. Left-leaning views typically support higher taxes on wealth while right-leaning views oppose them.', category: 'economic', weight: 1 },
  { id: 'q4', text: 'Immigration needs stricter controls.', explanation: 'This weighs stricter border controls and vetting against more welcoming policies for migrants and refugees. Conservative positions typically favor tighter restrictions while progressive positions favor more open policies.', category: 'social', weight: -1 },
  { id: 'q5', text: 'Climate action is worth economic costs.', explanation: 'This asks if environmental protection should take precedence over short-term economic considerations like jobs and industry profits. Left-leaning positions typically prioritize climate action while right-leaning positions emphasize economic concerns.', category: 'governance', weight: 1 },
  { id: 'q6', text: 'Free markets solve problems better than government.', explanation: 'This tests your belief in private sector efficiency versus government-led solutions for societal challenges. Conservative and libertarian views favor market solutions while progressive views prefer government intervention.', category: 'economic', weight: -1 },
  { id: 'q7', text: 'Social programs should be expanded.', explanation: 'This asks whether government should provide more support through healthcare, education, and welfare to create a more equal society. Left-leaning positions favor expansion while right-leaning positions prefer limiting government programs.', category: 'social', weight: 1 },
  { id: 'q8', text: 'Military strength matters more than diplomacy.', explanation: 'This explores whether military strength or international cooperation should be the primary tool for national security. Conservative positions typically favor strong defense while progressive positions emphasize diplomacy.', category: 'governance', weight: -1 },
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

// Add shimmer-slide keyframe to document if not already present (named differently to avoid conflict with shimmer-text)
if (typeof document !== 'undefined' && !document.getElementById('shimmer-slide-keyframes')) {
  const style = document.createElement('style');
  style.id = 'shimmer-slide-keyframes';
  style.textContent = `
    @keyframes shimmer-slide {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `;
  document.head.appendChild(style);
}

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
  visitorName?: string;
  visitorEmail?: string;
  onComplete: (result: RefinedResult) => void;
  onCancel: () => void;
}

const PoliticalQuestionnaire: React.FC<PoliticalQuestionnaireProps> = ({
  originalScore,
  country,
  visitorName,
  visitorEmail,
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
  const [isSaving, setIsSaving] = useState(false);

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

  const handleRevealComplete = async () => {
    if (calculatedResult && !isSaving) {
      setIsSaving(true);
      try {
        // Get current user if authenticated
        const { data: { user } } = await supabase.auth.getUser();
        
        // Save questionnaire response to database
        const responseData: any = {
          country,
          questions: JSON.stringify(questions.map(q => ({ id: q.id, text: q.text, category: q.category, weight: q.weight }))),
          answers: JSON.stringify(answers),
          original_score: originalScore,
          refined_score: calculatedResult.numericValue,
          position_label: calculatedResult.label,
          confidence: calculatedResult.confidence,
        };
        
        if (user) {
          responseData.user_id = user.id;
        } else if (visitorEmail) {
          responseData.visitor_name = visitorName || 'Anonymous';
          responseData.visitor_email = visitorEmail;
        }
        
        // Only save if we have either a user or visitor email
        if (user || visitorEmail) {
          const { error } = await supabase
            .from('questionnaire_responses')
            .insert([responseData]);
          
          if (error) {
            console.error('Failed to save questionnaire response:', error);
          } else {
            console.log('Questionnaire response saved successfully');
          }
        }
      } catch (err) {
        console.error('Error saving questionnaire response:', err);
      } finally {
        setIsSaving(false);
        onComplete(calculatedResult);
      }
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
    const confidenceTitle = `${calculatedResult.confidence.charAt(0).toUpperCase() + calculatedResult.confidence.slice(1)} Confidence`;
    const confidenceDescription = calculatedResult.confidence === 'high' 
      ? 'Strong opinions on most questions give high confidence in this result.'
      : calculatedResult.confidence === 'medium'
      ? 'A mix of strong and moderate opinions gives medium confidence in this result.'
      : 'Mostly neutral answers result in lower confidence in this result.';

    return (
      <div className="py-4 space-y-4 animate-fade-in">
        {/* Header with confidence info */}
        <div className="space-y-1.5 text-center">
          <h2 className="text-lg font-semibold leading-none tracking-tight">{confidenceTitle}</h2>
          <p className="text-sm text-muted-foreground">{confidenceDescription}</p>
        </div>

        {/* Result badge */}
        <div className="text-center">
          <div className="inline-block">
            <div className={`relative px-6 py-3 rounded-full overflow-hidden ${
              calculatedResult.confidence === 'high' 
                ? 'bg-green-500/20 border border-green-500/30'
                : calculatedResult.confidence === 'medium'
                ? 'bg-yellow-500/20 border border-yellow-500/30'
                : 'bg-red-500/20 border border-red-500/30'
            }`}>
              {/* Shimmer effect */}
              <span 
                className="absolute inset-0 -translate-x-full animate-[shimmer-slide_2s_infinite]"
                style={{
                  background: calculatedResult.confidence === 'high'
                    ? 'linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.3), transparent)'
                    : calculatedResult.confidence === 'medium'
                    ? 'linear-gradient(90deg, transparent, rgba(234, 179, 8, 0.3), transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.3), transparent)',
                }}
              />
              <span className={`relative z-10 text-lg font-bold ${
                calculatedResult.confidence === 'high' 
                  ? 'text-green-700 dark:text-green-400'
                  : calculatedResult.confidence === 'medium'
                  ? 'text-yellow-700 dark:text-yellow-400'
                  : 'text-red-700 dark:text-red-400'
              }`}>
                {calculatedResult.label}
              </span>
            </div>
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
      {/* Header */}
      <div className="space-y-1.5 text-center">
        <h2 className="text-lg font-semibold leading-none tracking-tight">Refine Your Political Position</h2>
        <p className="text-sm text-muted-foreground">Answer these questions to get a more accurate assessment of your political position.</p>
      </div>

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
        
        {/* Expandable explanation */}
        {currentQuestion.explanation && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group">
              <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />
              <span>Learn more</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <p className="text-xs text-muted-foreground leading-relaxed pl-4 border-l-2 border-muted">
                {currentQuestion.explanation}
              </p>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* AI Chat Helper */}
        <QuestionnaireChat
          question={currentQuestion.text}
          explanation={currentQuestion.explanation}
          category={currentQuestion.category}
        />
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
