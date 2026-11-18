import React from 'react';
import { DrivingLesson, Payment } from '../types';
import { calculateLessonTimeRange } from '../utils/timeUtils';
import {
  Car,
  Layers,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

interface ReportsViewProps {
  lessons: DrivingLesson[];
  payments: Payment[];
  lessonPrice: number;
  lessonDurationMinutes: number;
  targetLessons: number;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  lessons,
  payments,
  lessonPrice,
  lessonDurationMinutes,
  targetLessons,
}) => {
  // CRITICAL REQUIREMENT:
  // Only lessons where isCompleted === true are counted towards debt!
  const completedLessons = lessons.filter((l) => l.isCompleted);
  const totalLessonsCompleted = completedLessons.reduce(
    (acc, l) => acc + (Number(l.lessonCount) || 0),
    0
  );

  const totalLessonsScheduled = lessons.reduce(
    (acc, l) => acc + (Number(l.lessonCount) || 0),
    0
  );

  // Sort ascending chronologically and number sequentially
  const sortedLessons = [...lessons].sort((a, b) => {
    const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    const timeDiff = (a.startTime || '14:00').localeCompare(b.startTime || '14:00');
    if (timeDiff !== 0) return timeDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  let runningNumber = 1;
  const lessonsWithNumbers = sortedLessons.map((l) => {
    const count = Number(l.lessonCount) || 1;
    const startNum = runningNumber;
    const endNum = runningNumber + count - 1;
    runningNumber += count;
    const label = startNum === endNum ? `שיעור ${startNum}` : `שיעור ${startNum}-${endNum}`;
    return { ...l, lessonNumberLabel: label };
  });

  // Total cost of COMPLETED lessons
  const totalLessonsCost = totalLessonsCompleted * lessonPrice;

  // Total paid
  const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  // Debt balance: Completed Lessons Cost - Total Paid
  const debtBalance = totalLessonsCost - totalPaid;

  // Progress to driving test (Israel minimum standard is 28)
  const progressPercent = Math.min(
    100,
    Math.round((totalLessonsCompleted / (targetLessons || 28)) * 100)
  );

  const formatDateDisplay = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4" dir="rtl">
      {/* Header Card */}
      <div className="bg-white rounded-[24px] border border-[#dadce0] p-5 shadow-[0_1px_2px_0_rgba(60,64,67,0.08)]">
        <h2 className="text-base font-bold text-[#202124]">
          דוחות וניתוח כספי
        </h2>
      </div>

      {/* 4 Cards Grid with Google 4-Color Accents */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: יתרת חוב לתשלום */}
        {debtBalance > 0 ? (
          <div className="bg-[#4a0d0d] text-white rounded-[24px] p-4 shadow-md flex flex-col justify-between min-h-[105px]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#690005] text-[#ffdad6] font-bold border border-[#93000a] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff897d] animate-pulse" />
                יתרת חוב
              </span>
            </div>

            <div className="my-1">
              <div className="text-2xl font-black text-[#ffb4ab] tracking-tight">
                -₪{debtBalance.toFixed(2)}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#041e49] text-white rounded-[24px] p-4 shadow-md flex flex-col justify-between min-h-[105px]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-900 text-[#a8c7fa] font-bold border border-blue-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7fcfff] animate-pulse" />
                יתרת חוב
              </span>
            </div>

            <div className="my-1">
              <div className="text-2xl font-black text-[#7fcfff] tracking-tight">
                {debtBalance < 0
                  ? `+₪${Math.abs(debtBalance).toFixed(2)}`
                  : '₪0.00'}
              </div>
            </div>
          </div>
        )}

        {/* Card 2: כמות שיעורים שבוצעו (Google Blue Card) */}
        <div className="bg-[#e8f0fe] rounded-[24px] p-4 shadow-sm border border-[#d3e3fd] flex flex-col justify-between min-h-[105px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white text-[#1a73e8] font-bold shadow-xs">
              שיעורים שבוצעו
            </span>
            <Car className="w-4 h-4 text-[#1a73e8]" />
          </div>

          <div className="my-1">
            <div className="text-2xl font-black text-[#1a73e8] tracking-tight">
              {totalLessonsCompleted} שיעורים
            </div>
          </div>
        </div>

        {/* Card 3: סה״כ שולם (Google Green Card) */}
        <div className="bg-[#e6f4ea] rounded-[24px] p-4 shadow-sm border border-[#ceead6] flex flex-col justify-between min-h-[105px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white text-[#188038] font-bold shadow-xs flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-[#188038]" />
              סה״כ שולם
            </span>
          </div>

          <div className="my-1">
            <div className="text-2xl font-black text-[#188038] tracking-tight">
              ₪{totalPaid.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Card 4: עלות שיעורים שבוצעו (Google Red Card) */}
        <div className="bg-[#fce8e6] rounded-[24px] p-4 shadow-sm border border-[#fad2cf] flex flex-col justify-between min-h-[105px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white text-[#d93025] font-bold shadow-xs flex items-center gap-1">
              <ArrowDownLeft className="w-3 h-3 text-[#d93025]" />
              עלות שיעורים
            </span>
          </div>

          <div className="my-1">
            <div className="text-2xl font-black text-[#d93025] tracking-tight">
              -₪{totalLessonsCost.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Progress towards driving test in Google Style */}
      <div className="bg-white rounded-[24px] border border-[#dadce0] p-5 shadow-[0_1px_2px_0_rgba(60,64,67,0.08)] space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-[#202124] flex items-center gap-1.5">
            <Car className="w-4 h-4 text-[#1a73e8]" />
            <span>התקדמות לטסט ({targetLessons} שיעורים)</span>
          </span>
          <span className="text-[#1a73e8] font-black">{progressPercent}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-[#f1f3f4] rounded-full overflow-hidden p-0.5 border border-[#dadce0]">
          <div
            className="h-full bg-[#1a73e8] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-[#5f6368] pt-0.5">
          <span>{totalLessonsCompleted} שיעורים בוצעו</span>
          <span>נותרו עוד {Math.max(0, targetLessons - totalLessonsCompleted)} שיעורים</span>
        </div>
      </div>

      {/* List of lessons with start and end times in Google Material List style */}
      <div className="bg-white rounded-[24px] border border-[#dadce0] p-5 shadow-[0_1px_2px_0_rgba(60,64,67,0.08)] space-y-3">
        <div className="flex items-center justify-between border-b border-[#e8eaed] pb-2">
          <h3 className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#1a73e8]" />
            <span>שעות ומועדי השיעורים:</span>
          </h3>
        </div>

        {lessons.length === 0 ? (
          <p className="text-xs text-[#80868b] italic py-2 text-center">אין שיעורים מוקלטים עדיין.</p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {lessonsWithNumbers.map((l) => {
              const range = calculateLessonTimeRange(
                l.startTime || '14:00',
                l.lessonCount,
                lessonDurationMinutes
              );
              return (
                <div
                  key={l.id}
                  className="p-3 rounded-2xl bg-[#f8fafd] border border-[#e8eaed] space-y-1.5 hover:border-[#dadce0] transition-colors"
                >
                  {/* שורה 1: כותרת השיעור וסטטוס ביצוע */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-[#202124]">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          l.isCompleted ? 'bg-[#34A853]' : 'bg-[#FBBC05]'
                        }`}
                      />
                      <span>{l.lessonNumberLabel}</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        l.isCompleted
                          ? 'bg-[#e6f4ea] text-[#188038]'
                          : 'bg-[#fef7e0] text-[#b06000]'
                      }`}
                    >
                      {l.isCompleted ? 'בוצע' : 'טרם'}
                    </span>
                  </div>

                  {/* שורה 2: תאריך ושעות השיעור */}
                  <div className="flex items-center justify-between text-xs text-[#5f6368] pt-0.5 border-t border-[#f1f3f4]">
                    <span>{formatDateDisplay(l.date)}</span>
                    <span className="text-[#1a73e8] font-mono font-semibold">
                      {range.formattedRange}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Calculation Formula Card */}
      <div className="bg-white rounded-[24px] border border-[#dadce0] p-5 text-xs space-y-2 shadow-[0_1px_2px_0_rgba(60,64,67,0.08)]">
        <div className="font-bold text-[#202124] flex items-center gap-1.5 border-b border-[#e8eaed] pb-2">
          <Layers className="w-3.5 h-3.5 text-[#1a73e8]" />
          <span>פירוט חישוב החוב לתשלום:</span>
        </div>
        <div className="font-mono text-[11px] bg-[#f8fafd] p-3 rounded-2xl border border-[#e8eaed] text-[#3c4043] space-y-2">
          <div className="flex justify-between items-center">
            <span>שיעורים שבוצעו ({totalLessonsCompleted} × ₪{lessonPrice}):</span>
            <span className="font-bold text-[#d93025]">₪{totalLessonsCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>פחות סך התשלומים ששולמו:</span>
            <span className="font-bold text-[#188038]">-₪{totalPaid.toFixed(2)}</span>
          </div>
          <div className="border-t border-[#dadce0] pt-1.5 flex justify-between font-bold text-[#202124] text-xs">
            <span>יתרת חוב סופית:</span>
            <span className={debtBalance > 0 ? 'text-[#d93025]' : 'text-[#188038]'}>
              ₪{debtBalance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
