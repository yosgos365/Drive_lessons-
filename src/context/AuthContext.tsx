import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  clearError: () => void;
  updateProfileSettings: (settings: {
    lessonPrice?: number;
    lessonDurationMinutes?: number;
    teacherName?: string;
    targetLessons?: number;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const path = `users/${currentUser.uid}`;

        try {
          const docSnap = await getDoc(userDocRef);
          const nowIso = new Date().toISOString();

          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            // Update last login
            await setDoc(
              userDocRef,
              {
                lastLoginAt: nowIso,
                displayName: currentUser.displayName || data.displayName || 'משתמש Google',
                photoURL: currentUser.photoURL || data.photoURL || '',
              },
              { merge: true }
            );

            setUserProfile({
              ...data,
              displayName: currentUser.displayName || data.displayName || 'משתמש Google',
              photoURL: currentUser.photoURL || data.photoURL || '',
              lessonPrice: data.lessonPrice ?? 220,
              lessonDurationMinutes: data.lessonDurationMinutes ?? 40,
              targetLessons: data.targetLessons ?? 28,
              teacherName: data.teacherName ?? '',
              lastLoginAt: nowIso,
            });
          } else {
            // First time user registration
            const newProfile: UserProfile = {
              id: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'תלמיד נהיגה',
              photoURL: currentUser.photoURL || '',
              lessonPrice: 220,
              lessonDurationMinutes: 40,
              targetLessons: 28,
              teacherName: '',
              createdAt: nowIso,
              lastLoginAt: nowIso,
              role: 'user',
            };

            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (err) {
          console.error('Error syncing user profile:', err);
          // Only handle as fatal if permission error
          try {
            handleFirestoreError(err, OperationType.GET, path);
          } catch (wrapped) {
            setAuthError('שגיאה בסנכרון פרופיל המשתמש מול Firebase');
          }
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateProfileSettings = async (settings: {
    lessonPrice?: number;
    lessonDurationMinutes?: number;
    teacherName?: string;
    targetLessons?: number;
  }) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, settings, { merge: true });
    setUserProfile((prev) => (prev ? { ...prev, ...settings } : null));
  };

  const signInWithGoogle = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      console.error('Google Sign-In Error:', err);
      const message = err instanceof Error ? err.message : 'ההתחברות נכשלה';
      
      if (message.includes('popup-closed-by-user')) {
        setAuthError('חלון ההתחברות נסגר על ידי המשתמש');
      } else if (message.includes('popup-blocked')) {
        setAuthError('חלון קופץ נחסם על ידי הדפדפן. אנא אשר חלונות קופצים עבור אתר זה.');
      } else if (message.includes('cancelled-popup-request')) {
        setAuthError('בקשת ההתחברות בוטלה');
      } else {
        setAuthError(`שגיאה בהתחברות: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    setAuthError(null);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error('Sign Out Error:', err);
      setAuthError('שגיאה בעת ההתנתקות');
    }
  };

  const clearError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        authError,
        signInWithGoogle,
        signOutUser,
        clearError,
        updateProfileSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
