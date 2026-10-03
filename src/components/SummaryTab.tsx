import React from 'react';
import { AlertCircle, History, ArrowRightLeft } from 'lucide-react';
import { Member, MemberBalance, ActivityLog, RecommendedTransaction } from '../types';
import { formatBaht, formatDateTimeThai } from '../utils/currency';

interface SummaryTabProps {
  members: Member[];
  balances: MemberBalance[];
  transactions: RecommendedTransaction[];
  logs: ActivityLog[];
  currentUserId: string;
  onNavigateToSettle: () => void;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({
  members,
  balances,
  transactions,
  logs,
  currentUserId,
  onNavigateToSettle,
}) => {
  const currentUserOwes = transactions.some(t => t.fromId === currentUserId);

  return (
    <div className="p-4 space-y-5">
      {/* Quick Alert if User Owes Money */}
      {currentUserOwes && (
        <div className="bg-amber-950/40 border border-amber-500/40 p-3.5 rounded-2xl flex items-center justify-between text-xs text-amber-200 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-semibold block">คุณมียอดที่ต้องโอนคืนเพื่อน</span>
              <span className="text-[10px] text-amber-300/80">คลิกเพื่อดูบัญชีปลายทางและสแกน QR โอน</span>
            </div>
          </div>
          <button
            onClick={onNavigateToSettle}
            className="bg-amber-600 hover:bg-amber-500 active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition whitespace-nowrap"
          >
            กดโอนทันที
          </button>
        </div>
      )}

      {/* Individual Balances Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            สรุปยอดดุลสมาชิกทุกคน
          </h2>
          <span className="text-[10px] text-slate-500">สุทธิ = จ่าย - ใช้ + โอนคืน</span>
        </div>

        <div className="space-y-2.5">
          {balances.map(b => {
            const isCurrent = b.member_id === currentUserId;
            const isCreditor = b.net_balance > 0.05;
            const isDebtor = b.net_balance < -0.05;

            return (
              <div
                key={b.member_id}
                className={`p-3 rounded-xl border transition flex items-center justify-between ${
                  isCurrent
                    ? 'bg-slate-800/90 border-slate-700'
                    : 'bg-slate-950/50 border-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{b.avatar}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-white">{b.name}</span>
                      {isCurrent && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1 rounded font-medium">
                          คุณ
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      จ่าย ฿{formatBaht(b.total_paid)} | ใช้ ฿{formatBaht(b.total_consumed)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  {isCreditor ? (
                    <div>
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        +฿{formatBaht(b.net_balance)}
                      </span>
                      <span className="text-[9px] text-emerald-500 block">ได้คืน</span>
                    </div>
                  ) : isDebtor ? (
                    <div>
                      <span className="text-xs font-bold text-rose-400 font-mono">
                        -฿{formatBaht(Math.abs(b.net_balance))}
                      </span>
                      <span className="text-[9px] text-rose-500 block">ต้องจ่าย</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-bold text-slate-400 font-mono">฿0.00</span>
                      <span className="text-[9px] text-slate-500 block">เคลียร์แล้ว</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <History className="w-3.5 h-3.5 text-emerald-400" />
          <span>ประวัติกิจกรรมในกลุ่ม</span>
        </div>

        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {logs.length === 0 ? (
            <div className="text-center text-xs text-slate-500 py-3">ยังไม่มีกิจกรรม</div>
          ) : (
            logs.map(log => (
              <div
                key={log.id}
                className="text-xs text-slate-300 p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 flex items-start justify-between gap-2"
              >
                <span className="truncate">{log.text}</span>
                <span className="text-[10px] text-slate-500 whitespace-nowrap flex-shrink-0">
                  {formatDateTimeThai(log.created_at)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
