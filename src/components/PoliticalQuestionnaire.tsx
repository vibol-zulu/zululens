import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface PoliticalQuestion {
  id: string;
  text: string;
  category: 'economic' | 'social' | 'governance';
}

const POLITICAL_QUESTIONS: PoliticalQuestion[] = [
  {
    id: 'q1',
    text: 'The government should play a larger role in regulating the economy.',
    category: 'economic',
  },
  {
    id: 'q2',
    text: 'Traditional values and institutions are important to preserve.',
    category: 'social',
  },
  {
    id: 'q3',
    text: 'Wealthy individuals and corporations should pay significantly higher taxes.',
    category: 'economic',
  },
  {
    id: 'q4',
    text: 'Immigration policies should prioritize national security over openness.',
    category: 'social',
  },
  {
    id: 'q5',
    text: 'Climate change requires immediate government intervention, even at economic cost.',
    category: 'governance',
  },
  {
    id: 'q6',
    text: 'Free markets are generally more effective than government programs at solving problems.',
    category: 'economic',
  },
  {
    id: 'q7',
    text: 'Social programs should be expanded to reduce inequality.',
    category: 'social',
  },
  {
    id: 'q8',
    text: 'Strong national defense is more important than diplomatic solutions.',
    category: 'governance',
  },
];

// Scale: -2 = Strongly Disagree, -1 = Disagree, 0 = Neutral, 1 = Agree, 2 = Strongly Agree
const SCALE_OPTIONS = [
  { value: -2, label: 'Strongly Disagree' },
  { value: -1, label: 'Disagree' },
  { value: 0, label: 'Neutral' },
  { value: 1, label: 'Agree' },
  { value: 2, label: 'Strongly Agree' },
];

// Question weights: positive means left-leaning answer is "agree", negative means right-leaning answer is "agree"
const QUESTION_WEIGHTS: Record<string, number> = {
  q1: 1,   // Agree = more left
  q2: -1,  // Agree = more right
  q3: 1,   // Agree = more left
  q4: -1,  // Agree = more right
  q5: 1,   // Agree = more left
  q6: -1,  // Agree = more right
  q7: 1,   // Agree = more left
  q8: -1,  // Agree = more right
};

interface RefinedResult {
  numericValue: number;
  label: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

function calculateRefinedPosition(
  answers: Record<string, number>,
  originalScore: number
): RefinedResult {
  let totalScore = 0;
  let answeredCount = 0;

  Object.entries(answers).forEach(([questionId, answer]) => {
    const weight = QUESTION_WEIGHTS[questionId] || 0;
    // Apply the weight: positive weight means agree pushes left, negative weight means agree pushes right
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
  // Max possible score: 8 questions * 2 (max answer) * 1 (weight) = 16 (fully left)
  // Min possible score: -16 (fully right)
  const normalizedQuestionnaireScore = (totalScore / 16) * 100;

  // Blend original channel-based score with questionnaire score
  // Give 40% weight to original, 60% to questionnaire for refinement
  const blendedScore = originalScore * 0.4 + normalizedQuestionnaireScore * 0.6;

  // Clamp to valid range
  const finalScore = Math.max(-100, Math.min(100, blendedScore));

  // Determine confidence based on answer consistency
  const answerVariance = Object.values(answers).reduce((sum, a) => sum + Math.abs(a), 0) / answeredCount;
  const confidence: 'high' | 'medium' | 'low' = 
    answerVariance >= 1.5 ? 'high' : answerVariance >= 0.8 ? 'medium' : 'low';

  // Determine label based on final score
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
  onComplete: (result: RefinedResult) => void;
  onCancel: () => void;
}

const PoliticalQuestionnaire: React.FC<PoliticalQuestionnaireProps> = ({
  originalScore,
  onComplete,
  onCancel,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const currentQuestion = POLITICAL_QUESTIONS[currentIndex];
  const totalQuestions = POLITICAL_QUESTIONS.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  const handleAnswer = (value: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
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
    const result = calculateRefinedPosition(answers, originalScore);
    onComplete(result);
  };

  const currentAnswer = answers[currentQuestion.id];
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const canSubmit = Object.keys(answers).length === totalQuestions;

  return (
    <div className="space-y-4">
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
      <div className="py-3">
        <p className="text-sm font-medium leading-relaxed">
          {currentQuestion.text}
        </p>
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
