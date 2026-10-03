import React from 'react';
import { Receipt, History, ArrowRightLeft, Users } from 'lucide-react';

export type TabType = 'summary' | 'expenses' | 'settle' | 'members';

interface NavigationTabsProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  expenseCount: number;
  transactionCount: number;
  memberCount: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onChangeTab,
  expenseCount,
  transactionCount,
  memberCount,
}) => {
  return (
    <div className="px-4 border-b border-slate-800">
      <nav className="flex space-x-1 bg-slate-900/90 p-1 rounded-2xl text-xs">
        <button
          onClick={() => onChangeTab('summary')}
          className={`flex-1 py-2 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
            activeTab === 'summary'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>ภาพรวม</span>
        </button>

        <button
          onClick={() => onChangeTab('expenses')}
          className={`flex-1 py-2 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
            activeTab === 'expenses'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>รายการ ({expenseCount})</span>
        </button>

        <button
          onClick={() => onChangeTab('settle')}
          className={`flex-1 py-2 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
            activeTab === 'settle'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>ตัดหนี้ ({transactionCount})</span>
        </button>

        <button
          onClick={() => onChangeTab('members')}
          className={`flex-1 py-2 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
            activeTab === 'members'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>สมาชิก ({memberCount})</span>
        </button>
      </nav>
    </div>
  );
};
