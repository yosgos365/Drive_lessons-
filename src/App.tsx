/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TopNav } from './components/TopNav';
import { BottomNav, TabType } from './components/BottomNav';
import { NewEntryForm } from './components/NewEntryForm';
import { HistoryView } from './components/HistoryView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { testFirebaseConnection } from './firebase';
import { subscribeToLessons, subscribeToPayments } from './services/drivingService';
import { DrivingLesson, Payment } from './types';
import { Car } from 'lucide-react';

function DrivingSchoolApp() {
  const { user, userProfile, loading, authError, signInWithGoogle, clearError } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('new');

  // Firestore real-time collections
  const [lessons, setLessons] = useState<DrivingLesson[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);

  // Initial connection probe per SKILL.md
  useEffect(() => {
    testFirebaseConnection();
  }, []);

  // Real-time Firestore subscriptions for lessons and payments
  useEffect(() => {
    if (!user) {
      setLessons([]);
      setPayments([]);
      return;
    }

    const unsubLessons = subscribeToLessons(
      user.uid,
      (newLessons) => setLessons(newLessons),
      (err) => {
        console.error('Lessons subscription error:', err);
        setDataError('שגיאה בסנכרון שיעורי הנהיגה מול Firebase');
      }
    );

    const unsubPayments = subscribeToPayments(
      user.uid,
      (newPayments) => setPayments(newPayments),
      (err) => {
        console.error('Payments subscription error:', err);
        setDataError('שגיאה בסנכרון תשלומים מול Firebase');
      }
    );

    return () => {
      unsubLessons();
      unsubPayments();
    };
  }, [user]);

  const lessonPrice = userProfile?.lessonPrice ?? 220;
  const lessonDurationMinutes = userProfile?.lessonDurationMinutes ?? 40;
  const targetLessons = userProfile?.targetLessons ?? 28;

  // Calculate debt for badge
  const completedLessonsCost = lessons
    .filter((l) => l.isCompleted)
    .reduce((sum, l) => sum + l.lessonCount * lessonPrice, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const debtBalance = Math.max(0, completedLessonsCost - totalPaid);

  return (
    <div className="min-h-screen bg-[#f8fafd] text-[#202124] pb-24 select-none flex flex-col font-sans" dir="rtl">
      {/* Google App Header */}
      <TopNav />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#e8f0fe] border border-[#d3e3fd] text-[#1a73e8] flex items-center justify-center mx-auto animate-pulse shadow-xs">
              <Car className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-[#5f6368]">מתחבר ל-Google & Firebase...</p>
          </div>
        ) : !user ? (
          /* Not Logged In - Clean Google Material 3 Auth Screen */
          <div className="p-4 sm:p-6 space-y-6 max-w-sm mx-auto text-center mt-8">
            {authError && (
              <div className="p-3.5 rounded-2xl bg-[#fce8e6] border border-[#fad2cf] text-[#d93025] text-xs font-semibold flex items-center justify-between text-right shadow-sm">
                <span>{authError}</span>
                <button onClick={clearError} className="text-[#d93025] font-bold p-1">
                  ✕
                </button>
              </div>
            )}

            {/* App Icon Card */}
            <div className="w-20 h-20 mx-auto">
              <div className="w-20 h-20 rounded-[28px] bg-[#e8f0fe] border border-[#d3e3fd] shadow-[0_2px_6px_0_rgba(60,64,67,0.15)] flex items-center justify-center text-[#1a73e8]">
                <Car className="w-10 h-10 text-[#1a73e8]" />
              </div>
            </div>

            <div className="pt-2">
              <h2 className="text-2xl font-black text-[#202124] tracking-tight">
                מעקב שיעורי נהיגה
              </h2>
            </div>

            {/* Google Sign In Button in Material 3 Style */}
            <div className="pt-2">
              <button
                onClick={signInWithGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-full bg-white hover:bg-[#f8fafd] active:scale-[0.99] border border-[#dadce0] text-[#3c4043] font-medium text-sm shadow-[0_1px_3px_0_rgba(60,64,67,0.15)] hover:shadow-[0_2px_6px_0_rgba(60,64,67,0.2)] transition-all cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>התחבר באמצעות חשבון Google</span>
              </button>
            </div>
          </div>
        ) : (
          /* Authenticated - Tab Views */
          <>
            {dataError && (
              <div className="m-4 p-3 rounded-2xl bg-[#fce8e6] border border-[#fad2cf] text-[#d93025] text-xs font-bold">
                {dataError}
              </div>
            )}

            {activeTab === 'new' && (
              <NewEntryForm
                lessonPrice={lessonPrice}
                lessonDurationMinutes={lessonDurationMinutes}
                onSuccess={() => setActiveTab('history')}
              />
            )}

            {activeTab === 'history' && (
              <HistoryView
                lessons={lessons}
                payments={payments}
                lessonPrice={lessonPrice}
                lessonDurationMinutes={lessonDurationMinutes}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                lessons={lessons}
                payments={payments}
                lessonPrice={lessonPrice}
                lessonDurationMinutes={lessonDurationMinutes}
                targetLessons={targetLessons}
              />
            )}

            {activeTab === 'settings' && <SettingsView />}
          </>
        )}
      </main>

      {/* Google Material 3 Navigation Bar */}
      {user && (
        <BottomNav
          activeTab={activeTab}
          onChangeTab={(tab) => setActiveTab(tab)}
          debtBadge={debtBalance}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DrivingSchoolApp />
    </AuthProvider>
  );
}
