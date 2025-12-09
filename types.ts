export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface QuestionSegment {
  id: string | number;
  boundingBox: BoundingBox;
  text: string;
  cropUrl?: string; // Generated client-side

  // Metadata fields
  subject?: string;        // Predicted or Selected Subject
  chapter?: string;        // Selected Chapter
  correctAnswer?: string;  // Predicted or Input Answer
}

export interface AnalysisResult {
  questions: QuestionSegment[];
}

export interface Chapter {
  id: string;
  name: string;
}

export interface Subject {
  id: string;
  name: string;
  chapters: Chapter[];
}

// --- Analytics & Exam Types ---

export interface UserAnswer {
  questionId: string | number;
  selectedOption: string;
  isCorrect?: boolean; // Only set after submission or if immediate feedback
  timestamp?: any; // Firestore Timestamp
}

export interface DeviceInfo {
  userAgent: string;
  screenResolution: string;
  language: string;
  platform: string;
}

export interface ExamSession {
  id: string;
  userId: string;
  subjectId: string;
  chapterId?: string;

  // Metadata
  deviceInfo: DeviceInfo;
  createdAt: any; // Firestore Timestamp
  lastActiveAt: any; // Firestore Timestamp

  // State
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  startTime: any; // Firestore Timestamp
  endTime: any; // Firestore Timestamp (Absolute server time when exam ends)

  answers: { [key: string]: UserAnswer };
  score?: number;
  totalQuestions: number;
}

export enum AppState {
  HOME = 'HOME',                 // Student Landing
  TAKING_EXAM = 'TAKING_EXAM',   // Student Exam Interface
  EXAM_RESULT = 'EXAM_RESULT',   // Student Result

  ADMIN_LOGIN = 'ADMIN_LOGIN',   // Admin Gate
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD', // Admin Analytics
  ADMIN_UPLOAD = 'ADMIN_UPLOAD', // The original "Scanner" tool
  ADMIN_SUBJECTS = 'ADMIN_SUBJECTS' // Subject Manager
}