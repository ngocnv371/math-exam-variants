export interface MathProblem {
  id: string;
  originalText: string;
  type: 'multiple-choice' | 'short-answer';
  structure?: {
    equation?: string;
    variables?: string[];
    context?: string;
  };
}

export interface ProblemVariant {
  problemId: string;
  versionLabel: string; // A, B, C...
  text: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface ExamVersion {
  label: string;
  variants: ProblemVariant[];
}

export interface Exam {
  title: string;
  originalProblems: MathProblem[];
  versions: ExamVersion[];
}
