export type PaymentMethod =
  | 'cash'
  | 'bit'
  | 'paybox'
  | 'bank_transfer'
  | 'credit'
  | 'other';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  lessonPrice?: number;
  lessonDurationMinutes?: number; // duration in minutes, default 40
  teacherName?: string;
  targetLessons?: number;
  createdAt: string;
  lastLoginAt: string;
  role?: 'user' | 'admin';
}

export interface DrivingLesson {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // e.g. "14:00"
  lessonCount: number; // 1 or 2
  isCompleted: boolean; // Only if true does it count towards debt!
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  method: PaymentMethod;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SummaryStats {
  totalLessonsScheduled: number;
  totalLessonsCompleted: number;
  lessonPrice: number;
  lessonDurationMinutes: number;
  totalLessonsCost: number;
  totalPaid: number;
  debtBalance: number;
  targetLessons: number;
}
