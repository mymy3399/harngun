import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Member, RecommendedTransaction } from '../types';
import { formatBaht } from '../utils/currency';

interface BalanceCardProps {
  currentUser: Member | undefined;
  currentUserBalance: number;
  totalGroupExpense: number;
  expenseCount: number;
  memberCount: number;
  transactions: RecommendedTransaction[];
  onNavigateToSettle: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  currentUser,
  currentUserBalance,
  totalGroupExpense,
  expenseCount,
  memberCount,
  transactions,
  onNavigateToSettle,
}) => {
  const isCreditor = currentUserBalance > 0.05;
  const isDebtor = currentUserBalance < -0.05;

  return (
    <section className="p-4">
      <div
        className={`p-4 rounded-3xl border transition-all duration-300 shadow-xl ${
          isCreditor
            ? 'bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border-emerald-500/40 text-emerald-100 shadow-emerald-950/30'
            : isDebtor
            ? 'bg-gradient-to-br from-rose-950/70 via-slate-900 to-slate-950 border-rose-500/40 text-rose-100 shadow-rose-950/30'
            : 'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-slate-200'
        }`}
      >
        <div className="flex justify-between items-start gap-2">
          <div>
            <span className="text-[11px] font-semibold tracking-wider uppercase opacity-75">
              สถานะบิลของคุณ ({currentUser?.name || 'สมาชิก'})
            </span>
            <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
              {isCreditor ? (
                <>
                  <span className="text-xs font-semibold text-emerald-400">คุณจะได้รับเงินคืน</span>
                  <span className="text-2xl font-black text-emerald-300 tracking-tight font-mono">
                    +฿{formatBaht(currentUserBalance)}
                  </span>
                </>
              ) : isDebtor ? (
                <>
                  <span className="text-xs font-semibold text-rose-400">คุณต้องจ่ายเพิ่ม</span>
                  <span className="text-2xl font-black text-rose-300 tracking-tight font-mono">
                    ฿{formatBaht(Math.abs(currentUserBalance))}
                  </span>
                </>
              ) : (
                <span className="text-base font-bold text-slate-300">
                  🎉 เคลียร์ยอดครบแล้ว สบายใจ!
                </span>
              )}
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-[11px] text-slate-400">ยอดรวมทั้งทริป</span>
            <div className="text-sm font-bold text-white mt-0.5 font-mono">
              ฿{formatBaht(totalGroupExpense)}
            </div>
            <span className="text-[10px] text-slate-400">
              {expenseCount.toLocaleString()} รายการ ({memberCount} สมาชิก)
            </span>
          </div>
        </div>

        {/* Quick settle shortcut */}
        <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-300 text-[11px]">
            {transactions.length > 0
              ? `เหลือ ${transactions.length} โอนเพื่อเคลียร์ยอด`
              : 'ไม่มีหนี้คั่งค้างในกลุ่ม'}
          </span>
          <button
            onClick={onNavigateToSettle}
            className="text-emerald-400 font-semibold hover:text-emerald-300 flex items-center gap-1 group transition"
          >
            <span>ดูวิธีเคลียร์เงิน</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};
