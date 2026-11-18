import React from 'react';
import { SquarePen, CalendarCheck, PieChart, SlidersHorizontal } from 'lucide-react';

export type TabType = 'new' | 'history' | 'reports' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  debtBadge?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab, debtBadge }) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'new',
      label: 'דיווח',
      icon: <SquarePen className="w-5 h-5" />,
    },
    {
      id: 'history',
      label: 'שיעורים שנקבעו',
      icon: <CalendarCheck className="w-5 h-5" />,
    },
    {
      id: 'reports',
      label: 'דוחות',
      icon: <PieChart className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'הגדרות',
      icon: <SlidersHorizontal className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#f0f4f9] border-t border-[#dadce0] shadow-md py-1 px-3">
      <div className="max-w-md mx-auto grid grid-cols-4 items-center">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className="flex flex-col items-center justify-center py-1 px-0.5 cursor-pointer transition-colors group"
            >
              {/* Material 3 Pill Indicator */}
              <div
                className={`relative px-4 py-1 rounded-full transition-all flex items-center justify-center ${
                  isActive
                    ? 'bg-[#d3e3fd] text-[#041e49] shadow-sm'
                    : 'text-[#444746] group-hover:bg-[#e1e3e1]'
                }`}
              >
                {tab.icon}
                {tab.id === 'reports' && debtBadge !== undefined && debtBadge > 0 && (
                  <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-[#ea4335] ring-2 ring-[#f0f4f9]" />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[11px] mt-1 tracking-tight text-center leading-tight transition-colors ${
                  isActive ? 'text-[#041e49] font-bold' : 'text-[#444746] font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
