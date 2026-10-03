import React, { useState } from 'react';
import {
  X,
  Calendar,
  User,
  Users,
  Receipt,
  Trash2,
  ExternalLink,
  Tag,
  Percent,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Expense, Member, CATEGORIES } from '../types';

interface ExpenseDetailModalProps {
  expense: Expense;
  members: Member[];
  onClose: () => void;
  onDeleteExpense: (expenseId: string) => Promise<void>;
  onOpenReceiptViewer?: (imageUrl: string, title: string) => void;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  expense,
  members,
  onClose,
  onDeleteExpense,
  onOpenReceiptViewer,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const catInfo = CATEGORIES.find(c => c.id === expense.category) || {
    id: 'other',
    label: 'ทั่วไป',
    icon: '📦',
    color: 'from-slate-500/20 to-gray-500/20 text-slate-300 border-slate-500/30',
  };

  const payer = members.find(m => m.id === expense.paid_by_id);
  const payerName = expense.payer_name || payer?.name || 'สมาชิก';
  const payerAvatar = expense.payer_avatar || payer?.avatar || '😎';

  // Format currency
  const formatBaht = (amt: number) => {
    return Number(amt).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Format Thai date
  const formatDateThai = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Participant breakdown
  const splitEntries = Object.entries(expense.splits || {});
  const participantsCount = splitEntries.length;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteExpense(expense.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete expense:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="text-3xl p-2.5 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner flex-shrink-0">
            {catInfo.icon}
          </div>
          <div className="min-w-0 pr-6">
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30 inline-block mb-1">
              {catInfo.label}
            </span>
            <h3 className="font-bold text-lg text-white break-words leading-snug">
              {expense.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatDateThai(expense.date)}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Total Amount Card */}
          <div className="bg-gradient-to-br from-emerald-950/40 via-slate-950 to-teal-950/40 p-4 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">ยอดรวมทั้งบิล</span>
              <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                ฿{formatBaht(expense.total_amount)}
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              <span className="block font-medium">จ่ายโดย</span>
              <span className="font-bold text-white text-sm flex items-center gap-1 justify-end mt-0.5">
                <span>{payerAvatar}</span>
                <span>{payerName}</span>
              </span>
            </div>
          </div>

          {/* Tax / Surcharge Breakdown if applicable */}
          {(Boolean(expense.has_sc) || Boolean(expense.has_vat)) && (
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs space-y-1.5">
              <span className="font-semibold text-slate-300 block mb-1">รายละเอียดราคา:</span>
              <div className="flex justify-between text-slate-400">
                <span>ราคาเริ่มต้น (Base Amount):</span>
                <span className="font-mono">฿{formatBaht(expense.base_amount || expense.total_amount)}</span>
              </div>
              {Boolean(expense.has_sc) && (
                <div className="flex justify-between text-amber-300">
                  <span>+ Service Charge (10%):</span>
                  <span className="font-mono">+฿{formatBaht((expense.base_amount || expense.total_amount) * 0.1)}</span>
                </div>
              )}
              {Boolean(expense.has_vat) && (
                <div className="flex justify-between text-sky-300">
                  <span>+ VAT (7%):</span>
                  <span className="font-mono">+฿{formatBaht((expense.base_amount || expense.total_amount) * (expense.has_sc ? 1.1 : 1.0) * 0.07)}</span>
                </div>
              )}
            </div>
          )}

          {/* Participants & Split Breakdown */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>ผู้ร่วมหาร ({participantsCount} คน)</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {expense.split_type === 'EXACT' ? 'ระบุยอดตรงตัว' : 'หารเท่ากัน'}
              </span>
            </div>

            <div className="divide-y divide-slate-800/60 pt-1">
              {splitEntries.map(([memberId, shareAmount]) => {
                const mem = members.find(m => m.id === memberId);
                const isPayer = memberId === expense.paid_by_id;

                return (
                  <div key={memberId} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{mem?.avatar || '🧑‍💼'}</span>
                      <div>
                        <span className="font-medium text-white">{mem?.name || 'สมาชิก'}</span>
                        {isPayer && (
                          <span className="ml-1.5 text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded-full font-semibold">
                            คนจ่ายบิล
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-emerald-400 font-mono">
                        ฿{formatBaht(shareAmount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Receipt Image if present */}
          {expense.receipt_image && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span>รูปสลิป / ใบเสร็จ</span>
                </span>
                {onOpenReceiptViewer && (
                  <button
                    onClick={() => onOpenReceiptViewer(expense.receipt_image!, expense.title)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <span>ดูรูปเต็ม</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div
                onClick={() => onOpenReceiptViewer && onOpenReceiptViewer(expense.receipt_image!, expense.title)}
                className="cursor-pointer overflow-hidden rounded-xl border border-slate-800 max-h-48 group relative"
              >
                <img
                  src={expense.receipt_image}
                  alt={expense.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition flex items-center justify-center">
                  <span className="text-xs bg-slate-900/80 text-white px-2.5 py-1 rounded-full border border-slate-700">
                    แตะเพื่อซูมดูรูป
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 mt-2 border-t border-slate-800 flex items-center justify-between gap-2">
          {showConfirmDelete ? (
            <div className="flex items-center gap-2 w-full animate-in fade-in">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs font-medium transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2 rounded-xl text-xs font-bold transition shadow-md shadow-rose-950/50 flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'กำลังลบ...' : 'ยืนยันลบบิลนี้'}</span>
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 p-2 rounded-xl transition text-xs flex items-center gap-1"
                title="ลบบิลนี้"
              >
                <Trash2 className="w-4 h-4" />
                <span>ลบบิล</span>
              </button>

              <button
                onClick={onClose}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2 rounded-xl text-xs font-semibold transition"
              >
                ปิดหน้าต่าง
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
