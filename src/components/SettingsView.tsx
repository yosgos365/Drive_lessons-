import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  SlidersHorizontal,
  DollarSign,
  Clock,
  Car,
  User,
  Save,
  CheckCircle2,
  LogOut,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user, userProfile, updateProfileSettings, signOutUser } = useAuth();

  const [priceInput, setPriceInput] = useState<string>(
    (userProfile?.lessonPrice ?? 220).toString()
  );
  const [durationInput, setDurationInput] = useState<string>(
    (userProfile?.lessonDurationMinutes ?? 40).toString()
  );
  const [targetInput, setTargetInput] = useState<string>(
    (userProfile?.targetLessons ?? 28).toString()
  );

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(priceInput);
    const durationNum = parseInt(durationInput, 10);
    const targetNum = parseInt(targetInput, 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      alert('אנא הזן עלות שיעור תקינה');
      return;
    }

    if (isNaN(durationNum) || durationNum <= 5 || durationNum > 180) {
      alert('אנא הזן משך שיעור תקין בדקות (למשל 40)');
      return;
    }

    setSaving(true);
    try {
      await updateProfileSettings({
        lessonPrice: priceNum,
        lessonDurationMinutes: durationNum,
        targetLessons: targetNum > 0 ? targetNum : 28,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4" dir="rtl">
      {/* Title Card */}
      <div className="bg-white rounded-[24px] border border-[#dadce0] p-4 shadow-[0_1px_2px_0_rgba(60,64,67,0.08)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#e8f0fe] text-[#1a73e8]">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#202124]">הגדרות</h2>
          </div>
        </div>
      </div>

      {/* Main Settings Form in Google Material 3 Style */}
      <form
        onSubmit={handleSaveSettings}
        className="bg-white rounded-[28px] border border-[#dadce0] p-5 sm:p-6 shadow-[0_1px_3px_0_rgba(60,64,67,0.12)] space-y-4"
      >
        {saveSuccess && (
          <div className="p-3 rounded-2xl bg-[#e6f4ea] border border-[#ceead6] text-[#137333] text-xs font-bold flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-[#188038]" />
            <span>ההגדרות נשמרו בהצלחה!</span>
          </div>
        )}

        {/* Lesson Price */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#3c4043] flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-[#1a73e8]" />
            <span>עלות לשיעור נהיגה (₪) *</span>
          </label>

          <div className="relative">
            <input
              type="number"
              min="10"
              max="2000"
              step="1"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-2xl border border-[#dadce0] text-sm font-bold text-[#202124] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#d3e3fd] bg-[#f8fafd]"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#5f6368]">
              ₪ / שיעור
            </span>
          </div>
        </div>

        {/* Lesson Duration in Minutes */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#3c4043] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#1a73e8]" />
            <span>זמן לכל שיעור (בדקות) *</span>
          </label>

          <div className="relative">
            <input
              type="number"
              min="15"
              max="180"
              step="5"
              value={durationInput}
              onChange={(e) => setDurationInput(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-2xl border border-[#dadce0] text-sm font-bold text-[#202124] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#d3e3fd] bg-[#f8fafd]"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#5f6368]">
              דקות
            </span>
          </div>
        </div>

        {/* Target Minimum Lessons */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#3c4043] flex items-center gap-1">
            <Car className="w-3.5 h-3.5 text-[#1a73e8]" />
            <span>יעד מינימום שיעורים לטסט (בישראל 28)</span>
          </label>
          <input
            type="number"
            min="1"
            max="150"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl border border-[#dadce0] text-xs text-[#202124] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#d3e3fd] bg-[#f8fafd]"
          />
        </div>

        {/* Google Blue Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 px-6 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] active:scale-[0.99] text-white font-medium text-sm shadow-[0_1px_3px_0_rgba(60,64,67,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'שומר...' : 'שמור הגדרות'}</span>
        </button>
      </form>

      {/* Google User Profile Card */}
      <div className="bg-white rounded-[24px] border border-[#dadce0] p-4 shadow-[0_1px_2px_0_rgba(60,64,67,0.08)] space-y-3">
        <div className="text-xs font-bold text-[#3c4043] flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-[#1a73e8]" />
          <span>חשבון Google מחובר</span>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f8fafd] border border-[#dadce0]">
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-[#1a73e8]/30 shadow-xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-bold text-sm shadow-xs font-['Roboto']">
                {(user?.displayName || 'U').charAt(0)}
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-[#202124]">
                {userProfile?.displayName || user?.displayName || 'משתמש Google'}
              </div>
              <div className="text-[11px] text-[#5f6368]">{user?.email}</div>
            </div>
          </div>

          <button
            onClick={signOutUser}
            className="px-3 py-1.5 rounded-full bg-white hover:bg-rose-50 text-[#d93025] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-[#fad2cf] shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>התנתק</span>
          </button>
        </div>
      </div>
    </div>
  );
};
