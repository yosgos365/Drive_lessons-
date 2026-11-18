import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createDrivingLesson, createPayment } from '../services/drivingService';
import {
  FileText,
  CreditCard,
  Calendar,
  Clock,
  Car,
  AlertCircle,
  Save,
  CheckCircle2,
} from 'lucide-react';

interface NewEntryFormProps {
  onSuccess: () => void;
  lessonPrice: number;
  lessonDurationMinutes: number;
}

export const NewEntryForm: React.FC<NewEntryFormProps> = ({
  onSuccess,
  lessonPrice,
  lessonDurationMinutes,
}) => {
  const { user } = useAuth();
  const [entryType, setEntryType] = useState<'lesson' | 'payment'>('lesson');

  // Form states
  const todayStr = new Date().toISOString().split('T')[0];
  const [lessonDate, setLessonDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('14:00');
  // Strictly only 1 or 2
  const [lessonCount, setLessonCount] = useState<1 | 2>(1);

  // Payment form states - ONLY date and amount
  const [paymentDate, setPaymentDate] = useState(todayStr);
  const [paymentAmount, setPaymentAmount] = useState<string>('');

  // UI status
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


  const handleSubmitLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await createDrivingLesson(user.uid, {
        date: lessonDate,
        startTime,
        lessonCount,
        isCompleted: false,
        notes: '',
      });

      setSuccessToast(
        lessonCount === 1
          ? 'שיעור 1 נוסף בהצלחה'
          : '2 שיעורים נוספו בהצלחה'
      );

      setTimeout(() => {
        setSuccessToast(null);
        onSuccess();
      }, 1000);
    } catch (err) {
      console.error('Error saving lesson:', err);
      setErrorMessage('שגיאה בשמירת השיעור ב-Firestore');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage('אנא הזן סכום תשלום תקין');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await createPayment(user.uid, {
        date: paymentDate,
        amount: amountNum,
        method: 'cash',
        notes: '',
      });

      setSuccessToast(`תשלום ע״ס ₪${amountNum.toFixed(2)} נרשם בהצלחה`);
      setPaymentAmount('');
      setTimeout(() => {
        setSuccessToast(null);
        onSuccess();
      }, 1200);
    } catch (err) {
      console.error('Error saving payment:', err);
      setErrorMessage('שגיאה בשמירת התשלום ב-Firestore');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4" dir="rtl">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-3.5 rounded-2xl bg-[#e6f4ea] border border-[#ceead6] text-[#137333] text-xs font-semibold flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-[#188038] shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-[#fce8e6] border border-[#fad2cf] text-[#c5221f] text-xs font-semibold flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-5 h-5 text-[#d93025] shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Material 3 Card */}
      <div className="bg-white rounded-[28px] border border-[#dadce0] shadow-[0_1px_3px_0_rgba(60,64,67,0.12),0_4px_8px_3px_rgba(60,64,67,0.06)] p-5 sm:p-6 space-y-5">
        {/* Card Title */}
        <div className="flex items-center justify-between border-b border-[#e8eaed] pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#e8f0fe] text-[#1a73e8]">
              <FileText className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-[#202124]">דיווח חדש</h2>
          </div>
          <span className="text-[11px] px-3 py-1 rounded-full bg-[#f1f3f4] text-[#3c4043] font-semibold border border-[#dadce0]">
            עלות לשיעור: ₪{lessonPrice}
          </span>
        </div>

        {/* RED & GREEN SWITCH - EXACTLY AS IN USER'S SCREENSHOT (Google Colors) */}
        <div className="p-1.5 rounded-2xl bg-[#f1f3f4] grid grid-cols-2 gap-1.5 text-xs font-bold border border-[#e8eaed]">
          {/* שיעור נהיגה - אדום (כמו הוצאה בתמונה) */}
          <button
            type="button"
            onClick={() => setEntryType('lesson')}
            className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              entryType === 'lesson'
                ? 'bg-white text-[#d93025] font-black shadow-sm border border-[#fad2cf]'
                : 'text-[#d93025]/70 hover:text-[#d93025]'
            }`}
          >
            <Car className="w-3.5 h-3.5 text-[#d93025]" />
            <span>שיעור נהיגה</span>
          </button>

          {/* הזנת תשלום - ירוק (כמו הכנסה בתמונה) */}
          <button
            type="button"
            onClick={() => setEntryType('payment')}
            className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              entryType === 'payment'
                ? 'bg-white text-[#188038] font-black shadow-sm border border-[#ceead6]'
                : 'text-[#188038]/70 hover:text-[#188038]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-[#188038]" />
            <span>הזנת תשלום</span>
          </button>
        </div>

        {/* Form 1: שיעור נהיגה */}
        {entryType === 'lesson' ? (
          <form onSubmit={handleSubmitLesson} className="space-y-4">
            {/* Date input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#3c4043] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#1a73e8]" />
                <span>תאריך השיעור</span>
              </label>
              <input
                type="date"
                value={lessonDate}
                onChange={(e) => setLessonDate(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-2xl border border-[#dadce0] text-xs text-[#202124] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#d3e3fd] bg-[#f8fafd]"
              />
            </div>

            {/* Start Time input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#3c4043] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#1a73e8]" />
                <span>שעת התחלה *</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-2xl border border-[#dadce0] text-xs text-[#202124] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#d3e3fd] bg-[#f8fafd]"
              />
            </div>

            {/* Lesson Count: STRICTLY 1 OR 2 ONLY */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#3c4043]">
                כמות שיעורים (1 או 2 בלבד)
              </label>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setLessonCount(1)}
                  className={`py-3 px-4 rounded-2xl border-2 font-bold text-sm transition-all cursor-pointer flex items-center justify-center ${
                    lessonCount === 1
                      ? 'bg-[#e8f0fe] border-[#1a73e8] text-[#1a73e8] shadow-sm'
                      : 'border-[#dadce0] bg-[#f8fafd] text-[#5f6368] hover:border-[#bdc1c6]'
                  }`}
                >
                  <span>שיעור 1</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLessonCount(2)}
                  className={`py-3 px-4 rounded-2xl border-2 font-bold text-sm transition-all cursor-pointer flex items-center justify-center ${
                    lessonCount === 2
                      ? 'bg-[#e8f0fe] border-[#1a73e8] text-[#1a73e8] shadow-sm'
                      : 'border-[#dadce0] bg-[#f8fafd] text-[#5f6368] hover:border-[#bdc1c6]'
                  }`}
                >
                  <span>2 שיעורים</span>
                </button>
              </div>
            </div>

            {/* Google Blue Action Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-6 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] active:scale-[0.99] text-white font-medium text-sm shadow-[0_1px_3px_0_rgba(60,64,67,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'שומר שיעור...' : 'הזן שיעור נהיגה'}</span>
            </button>
          </form>
        ) : (
          /* Form 2: הזנת תשלום - ONLY DATE AND AMOUNT */
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#3c4043]">
                סכום התשלום (₪) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-2xl border border-[#dadce0] text-base font-bold text-[#202124] placeholder-[#80868b] focus:outline-none focus:border-[#188038] focus:ring-2 focus:ring-[#ceead6] bg-[#f8fafd] text-left"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#5f6368]">
                  ₪
                </span>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#3c4043] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#188038]" />
                <span>תאריך ביצוע התשלום</span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-2xl border border-[#dadce0] text-xs text-[#202124] focus:outline-none focus:border-[#188038] focus:ring-2 focus:ring-[#ceead6] bg-[#f8fafd]"
              />
            </div>

            {/* Google Green Action Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-6 rounded-full bg-[#188038] hover:bg-[#137333] active:scale-[0.99] text-white font-medium text-sm shadow-[0_1px_3px_0_rgba(60,64,67,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'שומר תשלום...' : 'הזן תשלום'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
