import React from 'react';
import { ArrowRight, QrCode, CheckCircle2, History, RotateCcw } from 'lucide-react';
import { RecommendedTransaction, Settlement } from '../types';
import { formatBaht, formatDateTimeThai } from '../utils/currency';

interface SettleTabProps {
  transactions: RecommendedTransaction[];
  settlements: Settlement[];
  currentUserId: string;
  onOpenQR: (tx: RecommendedTransaction) => void;
  onUndoSettlement: (settlementId: string) => void;
}

export const SettleTab: React.FC<SettleTabProps> = ({
  transactions,
  settlements,
  currentUserId,
  onOpenQR,
  onUndoSettlement,
}) => {
  return (
    <div className="p-4 space-y-6">
      {/* Active Debt Resolution Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            วิธีเคลียร์เงินที่น้อยที่สุด ({transactions.length} รายการ)
          </h3>
          <span className="text-[11px] text-emerald-400">อัลกอริทึมจับคู่หนี้ต่ำสุด</span>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-6 text-center text-emerald-200 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="font-bold text-base text-white">ยอดเคลียร์ครบหมดแล้ว!</h4>
            <p className="text-xs text-emerald-300/80">ไม่มีใครติดหนี้ค้างคาในกลุ่มนี้แล้ว</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {transactions.map((tx, idx) => {
              const isMyDebt = tx.fromId === currentUserId;
              const isMyCredit = tx.toId === currentUserId;

              return (
                <div
                  key={`${tx.fromId}-${tx.toId}-${idx}`}
                  className={`p-3.5 rounded-2xl border transition shadow-sm ${
                    isMyDebt
                      ? 'bg-rose-950/30 border-rose-500/40 text-rose-100'
                      : isMyCredit
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
                      : 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* Debtor -> Creditor avatars & names */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xl">{tx.fromM?.avatar}</span>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold block truncate">
                            {tx.fromM?.name} {isMyDebt && '(คุณ)'}
                          </span>
                          <span className="text-[10px] text-rose-400">ผู้โอน</span>
                        </div>
                      </div>

                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />

                      <div className="flex items-center gap-1">
                        <span className="text-xl">{tx.toM?.avatar}</span>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold block truncate">
                            {tx.toM?.name} {isMyCredit && '(คุณ)'}
                          </span>
                          <span className="text-[10px] text-emerald-400">ผู้รับ</span>
                        </div>
                      </div>
                    </div>

                    {/* Amount & QR button */}
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <div className="text-sm font-bold text-white font-mono">
                          ฿{formatBaht(tx.amount)}
                        </div>
                        <span className="text-[10px] text-slate-400">ยอดสุทธิ</span>
                      </div>

                      <button
                        onClick={() => onOpenQR(tx)}
                        className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-3 py-1.5 rounded-xl font-medium text-xs flex items-center gap-1.5 shadow-sm transition"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>สแกน QR</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settle History Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <History className="w-3.5 h-3.5" />
          <span>ประวัติการโอนเคลียร์เงิน ({settlements.length})</span>
        </div>

        {settlements.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-4 bg-slate-900/40 rounded-xl border border-slate-800/60">
            ยังไม่มีประวัติการโอนชำระหนี้
          </div>
        ) : (
          <div className="space-y-2">
            {settlements.map(stl => (
              <div
                key={stl.id}
                className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5 font-medium text-white">
                    <span>{stl.from_avatar} {stl.from_name}</span>
                    <span className="text-slate-500">โอนให้</span>
                    <span>{stl.to_avatar} {stl.to_name}</span>
                    <span className="font-bold text-emerald-400">฿{formatBaht(stl.amount)}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {formatDateTimeThai(stl.settled_at)}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`ยกเลิกรายการโอน ฿${formatBaht(stl.amount)} ใช่หรือไม่?`)) {
                      onUndoSettlement(stl.id);
                    }
                  }}
                  className="flex items-center gap-1 text-slate-500 hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                  title="ยกเลิกรายการนี้"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="text-[10px]">ยกเลิก</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
