import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, HelpCircle, ChevronRight, Home, Users, Briefcase, Building2, Flag, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import QuestionnaireChat from './QuestionnaireChat';
import GovernanceRadarChart, { DomainScore } from './GovernanceRadarChart';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ExplanationStructured {
  summary: string;
  agreement: string;
  disagreement: string;
}

interface PoliticalQuestion {
  id: string;
  text: string;
  explanation: string | ExplanationStructured;
  category: 'economic' | 'social' | 'governance';
  weight: number;
  domain?: string;
  domainName?: string;
}

// Domain icons mapping
const DOMAIN_ICONS: Record<string, React.ReactNode> = {
  personal: <Home className="h-3 w-3" />,
  social: <Users className="h-3 w-3" />,
  professional: <Briefcase className="h-3 w-3" />,
  local: <Building2 className="h-3 w-3" />,
  national: <Flag className="h-3 w-3" />,
  international: <Globe className="h-3 w-3" />,
};

// Domain weights for composite score calculation
const DOMAIN_WEIGHTS: Record<string, number> = {
  personal: 0.10,
  social: 0.10,
  professional: 0.15,
  local: 0.15,
  national: 0.25,
  international: 0.25,
};

// Fallback questions if AI generation fails (now with domains)
const FALLBACK_QUESTIONS: PoliticalQuestion[] = [
  { id: 'q1', text: 'Parents should strictly control their children\'s screen time.', explanation: { summary: 'This explores personal governance in the home regarding technology.', agreement: 'Agreeing suggests you favor more parental authority and structure in home life.', disagreement: 'Disagreeing suggests you prefer giving children more autonomy.' }, category: 'social', weight: -1, domain: 'personal', domainName: 'Personal & Home' },
  { id: 'q2', text: 'Friend groups should openly challenge each other\'s beliefs.', explanation: { summary: 'This explores social dynamics and accountability among peers.', agreement: 'Agreeing suggests you value intellectual discourse and growth through challenge.', disagreement: 'Disagreeing suggests you prefer harmony and respecting personal boundaries.' }, category: 'social', weight: 1, domain: 'social', domainName: 'Social Circles' },
  { id: 'q3', text: 'Bosses should make final decisions without team consensus.', explanation: { summary: 'This explores workplace governance and authority structures.', agreement: 'Agreeing suggests you favor hierarchical efficiency in professional settings.', disagreement: 'Disagreeing suggests you prefer democratic workplace governance.' }, category: 'governance', weight: -1, domain: 'professional', domainName: 'Professional' },
  { id: 'q4', text: 'Pay should be primarily based on individual performance.', explanation: { summary: 'This explores merit-based vs equality-based professional compensation.', agreement: 'Agreeing suggests you favor meritocracy in the workplace.', disagreement: 'Disagreeing suggests you favor more equal pay structures.' }, category: 'economic', weight: -1, domain: 'professional', domainName: 'Professional' },
  { id: 'q5', text: 'HOAs should have strict enforcement powers.', explanation: { summary: 'This explores local governance and community rule enforcement.', agreement: 'Agreeing suggests you favor strong local community standards.', disagreement: 'Disagreeing suggests you prefer individual property rights.' }, category: 'governance', weight: -1, domain: 'local', domainName: 'Local & Civic' },
  { id: 'q6', text: 'Local taxes should fund extensive public services.', explanation: { summary: 'This explores local government size and service provision.', agreement: 'Agreeing suggests you support robust local government services.', disagreement: 'Disagreeing suggests you prefer smaller local government.' }, category: 'economic', weight: 1, domain: 'local', domainName: 'Local & Civic' },
  { id: 'q7', text: 'Government should regulate the economy more.', explanation: { summary: 'This asks whether government oversight leads to better outcomes.', agreement: 'Agreeing suggests you believe government intervention corrects market failures.', disagreement: 'Disagreeing suggests you prefer free market principles.' }, category: 'economic', weight: 1, domain: 'national', domainName: 'National' },
  { id: 'q8', text: 'The wealthy should pay much higher taxes.', explanation: { summary: 'This addresses income redistribution and tax policy.', agreement: 'Agreeing suggests you support using taxation to reduce inequality.', disagreement: 'Disagreeing suggests you believe lower taxes encourage growth.' }, category: 'economic', weight: 1, domain: 'national', domainName: 'National' },
  { id: 'q9', text: 'Immigration needs stricter controls.', explanation: { summary: 'This weighs border security against welcoming policies.', agreement: 'Agreeing suggests you prioritize national security and controlled immigration.', disagreement: 'Disagreeing suggests you favor more open borders.' }, category: 'social', weight: -1, domain: 'national', domainName: 'National' },
  { id: 'q10', text: 'International bodies should override national laws.', explanation: { summary: 'This explores sovereignty vs global governance.', agreement: 'Agreeing suggests you favor global cooperation over national sovereignty.', disagreement: 'Disagreeing suggests you prioritize national independence.' }, category: 'governance', weight: 1, domain: 'international', domainName: 'International' },
  { id: 'q11', text: 'Military intervention is justified to protect human rights abroad.', explanation: { summary: 'This explores interventionism in foreign policy.', agreement: 'Agreeing suggests you support active international engagement.', disagreement: 'Disagreeing suggests you prefer non-interventionist policies.' }, category: 'governance', weight: 1, domain: 'international', domainName: 'International' },
  { id: 'q12', text: 'Trade agreements benefit all participating nations equally.', explanation: { summary: 'This explores views on international economic cooperation.', agreement: 'Agreeing suggests you support free trade and globalization.', disagreement: 'Disagreeing suggests you favor protectionist policies.' }, category: 'economic', weight: 1, domain: 'international', domainName: 'International' },
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
  'Mapping governance philosophy...',
  'Calculating domain scores...',
  'Building your profile...',
  'Finalizing results...',
];

// Add shimmer-slide keyframe to document if not already present
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
  domainScores?: DomainScore[];
  consistencyScore?: number;
}

function calculateDomainScores(
  answers: Record<string, number>,
  questions: PoliticalQuestion[]
): DomainScore[] {
  const domainTotals: Record<string, { score: number; count: number; name: string }> = {};
  
  // Initialize domains
  questions.forEach(q => {
    if (q.domain && !domainTotals[q.domain]) {
      domainTotals[q.domain] = { score: 0, count: 0, name: q.domainName || q.domain };
    }
  });
  
  // Calculate scores per domain
  Object.entries(answers).forEach(([questionId, answer]) => {
    const question = questions.find(q => q.id === questionId);
    if (question?.domain) {
      const weight = question.weight || 0;
      domainTotals[question.domain].score += answer * weight;
      domainTotals[question.domain].count++;
    }
  });
  
  // Convert to DomainScore array
  return Object.entries(domainTotals).map(([domain, data]) => {
    const maxPossible = data.count * 2; // max answer is 2
    const normalizedScore = maxPossible > 0 ? (data.score / maxPossible) * 100 : 0;
    return {
      domain,
      domainName: data.name,
      score: Math.round(normalizedScore),
      normalizedScore: Math.round(((normalizedScore + 100) / 2)), // 0-100 for chart
      questionsAnswered: data.count,
    };
  });
}

function calculateConsistencyScore(domainScores: DomainScore[]): number {
  if (domainScores.length < 2) return 100;
  
  const scores = domainScores.map(d => d.score);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower std dev = higher consistency
  // Max std dev for -100 to +100 range is 100
  const consistencyRaw = Math.max(0, 100 - stdDev);
  return Math.round(consistencyRaw);
}

function calculateRefinedPosition(
  answers: Record<string, number>,
  questions: PoliticalQuestion[],
  originalScore: number
): RefinedResult {
  const domainScores = calculateDomainScores(answers, questions);
  const consistencyScore = calculateConsistencyScore(domainScores);
  
  let answeredCount = Object.keys(answers).length;

  if (answeredCount === 0) {
    return {
      numericValue: originalScore,
      label: 'Unable to determine',
      description: 'Please answer at least one question to refine your position.',
      confidence: 'low',
      domainScores: [],
      consistencyScore: 0,
    };
  }

  // Calculate weighted composite score
  let weightedSum = 0;
  let totalWeight = 0;
  
  domainScores.forEach(ds => {
    const weight = DOMAIN_WEIGHTS[ds.domain] || 0.1;
    weightedSum += ds.score * weight;
    totalWeight += weight;
  });
  
  const questionnaireScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // Blend original channel-based score with questionnaire score (40/60)
  const blendedScore = originalScore * 0.4 + questionnaireScore * 0.6;
  const finalScore = Math.max(-100, Math.min(100, blendedScore));

  // Determine confidence based on answer variance and question count
  const answerVariance = Object.values(answers).reduce((sum, a) => sum + Math.abs(a), 0) / answeredCount;
  const confidence: 'high' | 'medium' | 'low' = 
    answerVariance >= 1.5 && answeredCount >= 10 ? 'high' : 
    answerVariance >= 0.8 && answeredCount >= 6 ? 'medium' : 'low';

  let label: string;
  let description: string;

  if (finalScore <= -60) {
    label = 'Far Left';
    description = 'Your responses indicate strong progressive values across governance scales. You favor collective decision-making, robust social programs, and prioritize equality and environmental protection.';
  } else if (finalScore <= -20) {
    label = 'Left-Leaning';
    description = 'Your responses suggest center-left values. You generally support collaborative governance and social programs while maintaining some preference for individual autonomy.';
  } else if (finalScore <= 20) {
    label = 'Center';
    description = 'Your responses reflect a balanced perspective across governance scales. You draw from both progressive and conservative viewpoints depending on the specific context and issue.';
  } else if (finalScore <= 60) {
    label = 'Right-Leaning';
    description = 'Your responses indicate center-right values. You generally favor individual autonomy, traditional structures, and limited external governance at various scales.';
  } else {
    label = 'Far Right';
    description = 'Your responses indicate strong conservative values across governance scales. You favor individual liberty, minimal external governance, and traditional institutional structures.';
  }

  return {
    numericValue: Math.round(finalScore),
    label,
    description,
    confidence,
    domainScores,
    consistencyScore,
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
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  // Helper to check if explanation is structured
  const isStructuredExplanation = (explanation: string | ExplanationStructured): explanation is ExplanationStructured => {
    return typeof explanation === 'object' && 'summary' in explanation;
  };

  // Helper to get explanation as string for QuestionnaireChat
  const getExplanationString = (explanation: string | ExplanationStructured): string => {
    if (isStructuredExplanation(explanation)) {
      return `${explanation.summary} ${explanation.agreement} ${explanation.disagreement}`;
    }
    return explanation;
  };

  // Handle cancel with confirmation
  const handleCancelClick = () => {
    if (Object.keys(answers).length > 0) {
      setShowExitConfirmation(true);
    } else {
      onCancel();
    }
  };

  const confirmExit = () => {
    setShowExitConfirmation(false);
    onCancel();
  };

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
          console.log(`Loaded ${data.questions.length} AI-generated multi-domain questions for ${country}`);
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
      }, 600);
      return () => clearTimeout(timer);
    } else if (isCalculating && calculatingStep >= CALCULATING_MESSAGES.length) {
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
        const { data: { user } } = await supabase.auth.getUser();
        
        const responseData: any = {
          country,
          questions: JSON.stringify(questions.map(q => ({ id: q.id, text: q.text, category: q.category, weight: q.weight, domain: q.domain }))),
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
          Generating multi-domain questions for {country}...
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
              className={`h-1.5 w-5 rounded-full transition-all duration-300 ${
                idx <= calculatingStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Result reveal screen with radar chart
  if (showResult && calculatedResult) {
    const confidenceTitle = `${calculatedResult.confidence.charAt(0).toUpperCase() + calculatedResult.confidence.slice(1)} Confidence`;
    const confidenceDescription = calculatedResult.confidence === 'high' 
      ? 'Strong opinions across domains give high confidence.'
      : calculatedResult.confidence === 'medium'
      ? 'Mixed strength of opinions gives medium confidence.'
      : 'Mostly neutral answers result in lower confidence.';

    return (
      <div className="py-4 space-y-4 animate-fade-in">
        {/* Header */}
        <div className="space-y-1.5 text-center">
          <h2 className="text-lg font-semibold leading-none tracking-tight">Your Governance Profile</h2>
          <p className="text-xs text-muted-foreground">{confidenceDescription}</p>
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
          <p className="text-xs text-muted-foreground mt-1">
            Composite Score: {calculatedResult.numericValue > 0 ? '+' : ''}{calculatedResult.numericValue}
          </p>
        </div>

        {/* Radar Chart */}
        {calculatedResult.domainScores && calculatedResult.domainScores.length > 0 && (
          <GovernanceRadarChart domainScores={calculatedResult.domainScores} />
        )}

        {/* Consistency Score */}
        {calculatedResult.consistencyScore !== undefined && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full text-xs">
              <span className="text-muted-foreground">Ideological Consistency:</span>
              <span className={`font-semibold ${
                calculatedResult.consistencyScore >= 70 ? 'text-green-600 dark:text-green-400' :
                calculatedResult.consistencyScore >= 40 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {calculatedResult.consistencyScore}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {calculatedResult.consistencyScore >= 70 
                ? 'Your views are highly consistent across governance scales.'
                : calculatedResult.consistencyScore >= 40
                ? 'Your views vary somewhat depending on the governance scale.'
                : 'Your governance philosophy differs significantly across scales.'}
            </p>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-muted-foreground text-center leading-relaxed">
          {calculatedResult.description}
        </p>

        {/* Continue button */}
        <Button
          onClick={handleRevealComplete}
          className="w-full mt-4"
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
        <p className="text-sm text-muted-foreground">Answer questions across 6 governance domains for a multi-dimensional profile.</p>
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

      {/* Domain indicator */}
      {currentQuestion.domain && (
        <div className="flex items-center justify-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
            {DOMAIN_ICONS[currentQuestion.domain]}
            <span>{currentQuestion.domainName || currentQuestion.domain}</span>
          </div>
        </div>
      )}

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
              <div className="text-xs text-muted-foreground leading-relaxed pl-4 border-l-2 border-muted space-y-2">
                {isStructuredExplanation(currentQuestion.explanation) ? (
                  <>
                    <p>{currentQuestion.explanation.summary}</p>
                    <p><span className="font-bold text-foreground">Agreement:</span> {currentQuestion.explanation.agreement}</p>
                    <p><span className="font-bold text-foreground">Disagreement:</span> {currentQuestion.explanation.disagreement}</p>
                  </>
                ) : (
                  <p>{currentQuestion.explanation}</p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* AI Chat Helper */}
        <QuestionnaireChat
          question={currentQuestion.text}
          explanation={getExplanationString(currentQuestion.explanation)}
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
          onClick={currentIndex === 0 ? handleCancelClick : handlePrev}
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

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitConfirmation} onOpenChange={setShowExitConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quit Questionnaire?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to quit? Your progress will be lost and you'll need to start over.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Questionnaire</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExit}>Yes, Quit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PoliticalQuestionnaire;
export type { RefinedResult, ExplanationStructured, DomainScore };
