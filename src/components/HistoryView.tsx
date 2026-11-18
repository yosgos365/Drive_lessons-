import React, { useState } from 'react';
import { DrivingLesson, Payment } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  toggleLessonCompleted,
  deleteDrivingLesson,
  deletePayment,
} from '../services/drivingService';
import { calculateLessonTimeRange } from '../utils/timeUtils';
import {
  CheckCircle2,
  Calendar,
  Clock,
  Car,
  CreditCard,
  Trash2,
  MoreVertical,
  CalendarPlus,
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
} from 'lucide-react';

interface HistoryViewProps {
  lessons: DrivingLesson[];
  payments: Payment[];
  lessonPrice: number;
  lessonDurationMinutes: number;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  lessons,
  payments,
  lessonDurationMinutes,
}) => {
  const { user } = useAuth();
  const [subView, setSubView] = useState<'lessons' | 'payments'>('lessons');
  const [lessonFilter, setLessonFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sort lessons ascending: earliest first at the top, latest at the bottom
  const sortedLessons = [...lessons].sort((a, b) => {
    const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    const timeDiff = (a.startTime || '14:00').localeCompare(b.startTime || '14:00');
    if (timeDiff !== 0) return timeDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Calculate sequential lesson numbering (שיעור 1, שיעור 2-3, שיעור 4...)
  let runningLessonNumber = 1;
  const lessonsWithNumbers = sortedLessons.map((lesson) => {
    const count = Number(lesson.lessonCount) || 1;
    const startNum = runningLessonNumber;
    const endNum = runningLessonNumber + count - 1;
    runningLessonNumber += count;

    const lessonNumberLabel =
      startNum === endNum
        ? `שיעור ${startNum}`
        : `שיעור ${startNum}-${endNum}`;

    const badgeLabel =
      startNum === endNum ? `${startNum}` : `${startNum}-${endNum}`;

    return {
      ...lesson,
      startNum,
      endNum,
      lessonNumberLabel,
      badgeLabel,
    };
  });

  // Filter lessons based on status: all / completed / pending
  const filteredLessons = lessonsWithNumbers.filter((l) => {
    if (lessonFilter === 'completed') return l.isCompleted;
    if (lessonFilter === 'pending') return !l.isCompleted;
    return true;
  });

  // Display lessons in requested sort direction (ascending or descending)
  const displayedLessons =
    sortDirection === 'asc' ? filteredLessons : [...filteredLessons].reverse();

  // Sort payments by date descending
  const sortedPayments = [...payments].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Helper to generate a 1-tap Google Calendar web URL ready with pre-filled exact hours
  const getGoogleCalendarUrl = (
    dateStr: string,
    startTime: string,
    lessonCount: number,
    durationMinutes: number,
    lessonLabel: string
  ) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, mins] = (startTime || '14:00').split(':').map(Number);
      const startDate = new Date(year, month - 1, day, hours, mins, 0);
      const totalMinutes = lessonCount * durationMinutes;
      const endDate = new Date(startDate.getTime() + totalMinutes * 60 * 1000);

      // ISO UTC formatted with Z for Google Calendar
      const toGoogleUtc = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const datesParam = `${toGoogleUtc(startDate)}/${toGoogleUtc(endDate)}`;

      const endHours = String(endDate.getHours()).padStart(2, '0');
      const endMins = String(endDate.getMinutes()).padStart(2, '0');

      const title = `${lessonLabel} - שיעור נהיגה`;
      const details = `שיעור נהיגה שנקבע באפליקציה\nשעות השיעור: ${startTime} עד ${endHours}:${endMins}\nמשך שיעור: ${totalMinutes} דקות`;

      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        title
      )}&dates=${datesParam}&details=${encodeURIComponent(details)}`;
    } catch {
      const cleanDate = dateStr.replace(/-/g, '');
      const [h, m] = (startTime || '14:00').split(':');
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        lessonLabel
      )}&dates=${cleanDate}T${h}${m}00/${cleanDate}T${h}${m}00`;
    }
  };

  // Toggle lesson completion checkmark
  const handleToggleCheckbox = async (lesson: DrivingLesson) => {
    if (!user) return;
    const newStatus = !lesson.isCompleted;
    try {
      await toggleLessonCompleted(user.uid, lesson.id, newStatus);

      if (newStatus) {
        setToastMessage('שיעור סומן כנעשה ונוסף לחישוב החוב בדוחות');
      } else {
        setToastMessage('סימון השיעור בוטל והוסר מחישוב החוב');
      }
      setTimeout(() => setToastMessage(null), 2000);
    } catch (err) {
      console.error('Error toggling lesson:', err);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!user) return;
    if (window.confirm('האם אתה בטוח שברצונך למחוק שיעור זה?')) {
      try {
        await deleteDrivingLesson(user.uid, lessonId);
        setActiveMenuId(null);
      } catch (err) {
        console.error('Error deleting lesson:', err);
      }
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!user) return;
    if (window.confirm('האם אתה בטוח שברצונך למחוק תשלום זה?')) {
      try {
        await deletePayment(user.uid, paymentId);
        setActiveMenuId(null);
      } catch (err) {
        console.error('Error deleting payment:', err);
      }
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-3.5" dir="rtl">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="p-3 rounded-2xl bg-[#e8f0fe] border border-[#d3e3fd] text-[#1a73e8] text-xs font-semibold flex items-center gap-2 shadow-md animate-in fade-in sticky top-16 z-30">
          <CheckCircle2 className="w-4 h-4 text-[#1a73e8] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card in Google Material 3 style */}
      <div className="bg-white rounded-[24px] border border-[#dadce0] p-4 shadow-[0_1px_2px_0_rgba(60,64,67,0.08)] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#202124]">שיעורים שנקבעו</h2>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#e8f0fe] text-[#1a73e8] border border-[#d3e3fd]">
            {sortedLessons.filter((l) => l.isCompleted).length} / {sortedLessons.length} בוצעו
          </span>
        </div>

        {/* View Switcher: Material Filter Chips */}
        <div className="flex items-center gap-2 p-1 bg-[#f1f3f4] rounded-full text-xs font-bold border border-[#e8eaed]">
          <button
            onClick={() => setSubView('lessons')}
            className={`flex-1 py-1.5 px-3 rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              subView === 'lessons'
                ? 'bg-white text-[#1a73e8] shadow-sm font-bold'
                : 'text-[#5f6368] hover:text-[#202124]'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>שיעורים ({sortedLessons.length})</span>
          </button>

          <button
            onClick={() => setSubView('payments')}
            className={`flex-1 py-1.5 px-3 rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              subView === 'payments'
                ? 'bg-white text-[#188038] shadow-sm font-bold'
                : 'text-[#5f6368] hover:text-[#202124]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>תשלומים ({sortedPayments.length})</span>
          </button>
        </div>

        {/* Sub-filter for Lessons: הכל / בוצעו / בהמתנה + לחצן סדר עולה/יורד (בלי טקסט רק לחצן) */}
        {subView === 'lessons' && (
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#f1f3f4]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setLessonFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  lessonFilter === 'all'
                    ? 'bg-[#1a73e8] text-white shadow-xs'
                    : 'bg-[#f1f3f4] text-[#5f6368] hover:text-[#202124] hover:bg-[#e8eaed]'
                }`}
              >
                הכל ({lessonsWithNumbers.length})
              </button>
              <button
                onClick={() => setLessonFilter('completed')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  lessonFilter === 'completed'
                    ? 'bg-[#188038] text-white shadow-xs'
                    : 'bg-[#f1f3f4] text-[#5f6368] hover:text-[#202124] hover:bg-[#e8eaed]'
                }`}
              >
                <span>בוצעו</span>
                <span>({lessonsWithNumbers.filter((l) => l.isCompleted).length})</span>
              </button>
              <button
                onClick={() => setLessonFilter('pending')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  lessonFilter === 'pending'
                    ? 'bg-[#ea8600] text-white shadow-xs'
                    : 'bg-[#f1f3f4] text-[#5f6368] hover:text-[#202124] hover:bg-[#e8eaed]'
                }`}
              >
                <span>בהמתנה</span>
                <span>({lessonsWithNumbers.filter((l) => !l.isCompleted).length})</span>
              </button>
            </div>

            {/* לחצן סדר עולה / יורד - בלי טקסט רק לחצן */}
            <button
              type="button"
              onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 shadow-2xs ${
                sortDirection === 'desc'
                  ? 'bg-[#e8f0fe] border-[#1a73e8] text-[#1a73e8]'
                  : 'bg-[#f8fafd] border-[#dadce0] text-[#5f6368] hover:border-[#1a73e8] hover:text-[#1a73e8]'
              }`}
              title={sortDirection === 'asc' ? 'סדר עולה' : 'סדר יורד'}
              aria-label={sortDirection === 'asc' ? 'סדר עולה' : 'סדר יורד'}
            >
              {sortDirection === 'asc' ? (
                <ArrowUpNarrowWide className="w-4 h-4" />
              ) : (
                <ArrowDownWideNarrow className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Content Stream */}
      {subView === 'lessons' ? (
        displayedLessons.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-[24px] border border-dashed border-[#dadce0] p-6 space-y-2 shadow-sm">
            <Car className="w-8 h-8 text-[#80868b] mx-auto" />
            <div className="text-sm font-bold text-[#202124]">
              {lessonFilter === 'completed'
                ? 'אין שיעורים שבוצעו עדיין'
                : lessonFilter === 'pending'
                ? 'אין שיעורים בהמתנה'
                : 'אין שיעורים שנקבעו'}
            </div>
            <p className="text-xs text-[#5f6368]">
              {lessonFilter === 'all'
                ? 'הזן שיעור נהיגה בלשונית "דיווח" כדי לראות אותו כאן.'
                : 'שנה את הסנן כדי לראות שיעורים אחרים.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedLessons.map((lesson) => {
              const isMenuOpen = activeMenuId === lesson.id;
              // Calculate start and end time range
              const timeRange = calculateLessonTimeRange(
                lesson.startTime || '14:00',
                lesson.lessonCount,
                lessonDurationMinutes
              );

              // 1-tap Google Calendar link ready with exact hours
              const calendarUrl = getGoogleCalendarUrl(
                lesson.date,
                lesson.startTime || '14:00',
                lesson.lessonCount,
                lessonDurationMinutes,
                lesson.lessonNumberLabel
              );

              return (
                <div
                  key={lesson.id}
                  className="rounded-2xl border border-[#dadce0] bg-white transition-all p-4 shadow-[0_1px_2px_0_rgba(60,64,67,0.08)] flex items-center justify-between gap-3 hover:border-[#bdc1c6]"
                >
                  {/* RIGHT SIDE (Start in RTL): 3 distinct lines (מס שיעור, תאריך, שעה) */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="min-w-11 px-2 h-11 rounded-2xl bg-[#e8f0fe] border border-[#d3e3fd] flex items-center justify-center text-[#1a73e8] font-bold text-sm shrink-0">
                      {lesson.badgeLabel}
                    </div>

                    <div className="text-right space-y-1 min-w-0">
                      {/* שורה 1: מס שיעור (שיעור 1, שיעור 2-3...) */}
                      <div className="text-base font-bold text-[#202124] truncate">
                        {lesson.lessonNumberLabel}
                      </div>

                      {/* שורה 2: תאריך */}
                      <div className="text-sm font-medium text-[#5f6368] flex items-center gap-1.5 whitespace-nowrap">
                        <Calendar className="w-4 h-4 text-[#80868b] shrink-0" />
                        <span>{formatDateDisplay(lesson.date)}</span>
                      </div>

                      {/* שורה 3: שעה (שורה רציפה ללא גלישה) */}
                      <div className="text-sm font-bold text-[#1a73e8] flex items-center gap-1.5 whitespace-nowrap">
                        <Clock className="w-4 h-4 text-[#1a73e8] shrink-0" />
                        <span className="font-mono whitespace-nowrap">{timeRange.formattedRange}</span>
                      </div>
                    </div>
                  </div>

                  {/* LEFT SIDE (End in RTL): Google Calendar & V Checkbox */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Add to Google Calendar */}
                    <a
                      href={calendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl text-[#1a73e8] bg-[#f8fafd] hover:bg-[#e8f0fe] border border-[#dadce0] hover:border-[#1a73e8] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                      title="הוסף ליומן Google"
                    >
                      <CalendarPlus className="w-4 h-4 text-[#1a73e8]" />
                    </a>

                    {/* Delete action */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuId(isMenuOpen ? null : lesson.id)}
                        className="p-1.5 rounded-full hover:bg-slate-100 text-[#5f6368] hover:text-[#202124] cursor-pointer"
                        title="אפשרויות"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute left-0 top-full mt-1 w-32 bg-white rounded-xl shadow-lg border border-[#dadce0] py-1 z-20 text-xs">
                          <a
                            href={calendarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full px-3 py-1.5 text-right text-[#1a73e8] hover:bg-[#e8f0fe] flex items-center gap-1.5 cursor-pointer border-b border-[#f1f3f4]"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                            <span>הוסף ליומן</span>
                          </a>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="w-full px-3 py-1.5 text-right text-[#d93025] hover:bg-[#fce8e6] flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>מחק שיעור</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* V Checkbox Button on the left */}
                    <button
                      type="button"
                      onClick={() => handleToggleCheckbox(lesson)}
                      className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer ${
                        lesson.isCompleted
                          ? 'bg-[#1a73e8] border-[#1a73e8] text-white shadow-sm'
                          : 'bg-white border-[#747775] hover:border-[#1a73e8] text-transparent'
                      }`}
                      title={lesson.isCompleted ? 'שיעור בוצע' : 'סמן וי על ביצוע השיעור'}
                    >
                      <CheckCircle2
                        className={`w-5 h-5 ${
                          lesson.isCompleted ? 'text-white' : 'opacity-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Payments list view */
        sortedPayments.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-[24px] border border-dashed border-[#dadce0] p-6 space-y-2 shadow-sm">
            <CreditCard className="w-8 h-8 text-[#80868b] mx-auto" />
            <div className="text-sm font-bold text-[#202124]">אין תשלומים שבוצעו</div>
            <p className="text-xs text-[#5f6368]">
              הזן תשלום בלשונית "דיווח" כדי להציגו כאן.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sortedPayments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-2xl border border-[#ceead6] bg-[#e6f4ea] p-4 shadow-sm flex items-center justify-between"
              >
                {/* Details on right */}
                <div className="text-right space-y-0.5">
                  <div className="text-base font-bold text-[#137333]">
                    תשלום ששולם
                  </div>
                  <div className="text-sm font-medium text-[#5f6368]">
                    {formatDateDisplay(payment.date)}
                  </div>
                </div>

                {/* Amount and delete on left */}
                <div className="flex items-center gap-3">
                  <div className="text-base font-black text-[#188038]">
                    +₪{payment.amount.toFixed(2)}
                  </div>
                  <button
                    onClick={() => handleDeletePayment(payment.id)}
                    className="p-1.5 rounded-full text-[#5f6368] hover:text-[#d93025] hover:bg-white/60 cursor-pointer transition-colors"
                    title="מחק תשלום"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
