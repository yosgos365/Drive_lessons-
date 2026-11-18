import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { DrivingLesson, Payment, PaymentMethod } from '../types';

/**
 * Subscribes to real-time changes on user's driving lessons.
 */
export function subscribeToLessons(
  userId: string,
  onLessons: (lessons: DrivingLesson[]) => void,
  onError: (error: Error) => void
): () => void {
  const collectionPath = `users/${userId}/lessons`;
  const lessonsColRef = collection(db, 'users', userId, 'lessons');
  const lessonsQuery = query(lessonsColRef);

  return onSnapshot(
    lessonsQuery,
    (snapshot) => {
      const lessons: DrivingLesson[] = [];
      snapshot.forEach((docSnap) => {
        lessons.push({
          ...(docSnap.data() as DrivingLesson),
          id: docSnap.id,
        });
      });
      // Sort by date descending, then by createdAt descending
      lessons.sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      onLessons(lessons);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

/**
 * Creates a new driving lesson
 */
export async function createDrivingLesson(
  userId: string,
  payload: {
    date: string;
    startTime?: string;
    lessonCount: number;
    isCompleted: boolean;
    notes?: string;
  }
): Promise<DrivingLesson> {
  const lessonId = `lesson_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const docPath = `users/${userId}/lessons/${lessonId}`;
  const nowIso = new Date().toISOString();

  const newLesson: DrivingLesson = {
    id: lessonId,
    userId,
    date: payload.date,
    startTime: payload.startTime || '14:00',
    lessonCount: Number(payload.lessonCount) || 1,
    isCompleted: Boolean(payload.isCompleted),
    notes: payload.notes ? payload.notes.trim().slice(0, 1000) : '',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  try {
    const lessonRef = doc(db, 'users', userId, 'lessons', lessonId);
    await setDoc(lessonRef, newLesson);
    return newLesson;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

/**
 * Toggles or updates lesson completion (Critical: affects debt calculation!)
 */
export async function toggleLessonCompleted(
  userId: string,
  lessonId: string,
  isCompleted: boolean
): Promise<void> {
  const docPath = `users/${userId}/lessons/${lessonId}`;
  const nowIso = new Date().toISOString();

  try {
    const lessonRef = doc(db, 'users', userId, 'lessons', lessonId);
    await updateDoc(lessonRef, {
      isCompleted,
      updatedAt: nowIso,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

/**
 * Deletes a driving lesson
 */
export async function deleteDrivingLesson(userId: string, lessonId: string): Promise<void> {
  const docPath = `users/${userId}/lessons/${lessonId}`;
  try {
    const lessonRef = doc(db, 'users', userId, 'lessons', lessonId);
    await deleteDoc(lessonRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/**
 * Subscribes to real-time changes on user's payments.
 */
export function subscribeToPayments(
  userId: string,
  onPayments: (payments: Payment[]) => void,
  onError: (error: Error) => void
): () => void {
  const collectionPath = `users/${userId}/payments`;
  const paymentsColRef = collection(db, 'users', userId, 'payments');
  const paymentsQuery = query(paymentsColRef);

  return onSnapshot(
    paymentsQuery,
    (snapshot) => {
      const payments: Payment[] = [];
      snapshot.forEach((docSnap) => {
        payments.push({
          ...(docSnap.data() as Payment),
          id: docSnap.id,
        });
      });
      // Sort by date descending
      payments.sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      onPayments(payments);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

/**
 * Creates a new payment record
 */
export async function createPayment(
  userId: string,
  payload: {
    date: string;
    amount: number;
    method: PaymentMethod;
    notes?: string;
  }
): Promise<Payment> {
  const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const docPath = `users/${userId}/payments/${paymentId}`;
  const nowIso = new Date().toISOString();

  const newPayment: Payment = {
    id: paymentId,
    userId,
    date: payload.date,
    amount: Number(payload.amount),
    method: payload.method,
    notes: payload.notes ? payload.notes.trim().slice(0, 1000) : '',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  try {
    const paymentRef = doc(db, 'users', userId, 'payments', paymentId);
    await setDoc(paymentRef, newPayment);
    return newPayment;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

/**
 * Deletes a payment record
 */
export async function deletePayment(userId: string, paymentId: string): Promise<void> {
  const docPath = `users/${userId}/payments/${paymentId}`;
  try {
    const paymentRef = doc(db, 'users', userId, 'payments', paymentId);
    await deleteDoc(paymentRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/**
 * Updates user settings (lesson price, teacher name, target lessons)
 */
export async function updateUserSettings(
  userId: string,
  settings: {
    lessonPrice?: number;
    lessonDurationMinutes?: number;
    teacherName?: string;
    targetLessons?: number;
  }
): Promise<void> {
  const docPath = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...settings,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}
