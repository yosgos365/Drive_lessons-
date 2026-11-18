import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Car } from 'lucide-react';

export const TopNav: React.FC = () => {
  const { user, userProfile, signOutUser } = useAuth();

  const userInitial = (
    userProfile?.displayName ||
    user?.displayName ||
    user?.email ||
    'Y'
  )
    .charAt(0)
    .toUpperCase();

  // Extract ONLY first name without last name
  const fullName =
    userProfile?.displayName ||
    user?.displayName ||
    (user?.email ? user.email.split('@')[0] : '');
  const firstName = fullName.trim().split(/\s+/)[0] || '';

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#dadce0] shadow-[0_1px_2px_0_rgba(60,64,67,0.08)]">
      <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Right Corner (Start in RTL): Google Account Avatar + "שלום, {firstName}" */}
        <div className="flex items-center gap-2.5">
          {user ? (
            user.photoURL ? (
              <img
                src={user.photoURL}
                alt={firstName || 'משתמש Google'}
                className="w-9 h-9 rounded-full object-cover border border-[#dadce0] shadow-xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#1a73e8] flex items-center justify-center font-bold text-white text-sm shadow-xs font-['Roboto']">
                {userInitial}
              </div>
            )
          ) : (
            <div className="w-9 h-9 rounded-xl bg-[#e8f0fe] flex items-center justify-center text-[#1a73e8]">
              <Car className="w-5 h-5 text-[#1a73e8]" />
            </div>
          )}

          <h1 className="text-base font-bold text-[#202124]">
            {firstName ? `שלום ${firstName}` : 'מעקב שיעורי נהיגה'}
          </h1>
        </div>

        {/* Left Corner (End in RTL): Sign Out Button */}
        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={signOutUser}
              className="p-1.5 rounded-full hover:bg-slate-100 text-[#5f6368] hover:text-[#d93025] transition-colors cursor-pointer"
              title="התנתק"
            >
              <LogOut className="w-4 h-4 transform rotate-180" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
