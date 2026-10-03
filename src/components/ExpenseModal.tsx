import React, { useState, useMemo } from 'react';
import { X, Upload, Check, AlertCircle, Percent, Image as ImageIcon } from 'lucide-react';
import { Member, SplitType, ExpenseCategory, CATEGORIES } from '../types';
import { uploadReceiptFile } from '../api/client';
import { formatBaht } from '../utils/currency';

interface ExpenseModalProps {
  members: Member[];
  currentUserId: string;
  onClose: () => void;
  onSave: (payload: {
    title: string;
    category: ExpenseCategory;
    baseAmount: number;
    hasSC: boolean;
    hasVat: boolean;
    totalAmount: number;
    paidById: string;
    splitType: SplitType;
    splits: Record<string, number>;
    date: string;
    receiptImage?: string | null;
  }) => Promise<void>;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  members,
  currentUserId,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [amountStr, setAmountStr] = useState('');
  const [payerId, setPayerId] = useState(currentUserId || members[0]?.id || '');
  const [hasSC, setHasSC] = useState(false);
  const [hasVat, setHasVat] = useState(false);
  const [splitMode, setSplitMode] = useState<SplitType>('EQUAL');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Split details state
  const [selectedMembers, setSelectedMembers] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    members.forEach(m => (init[m.id] = true));
    return init;
  });
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [shareCounts, setShareCounts] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    members.forEach(m => (init[m.id] = 1));
    return init;
  });

  // Receipt image
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Net calculated total
  const calculatedTotal = useMemo(() => {
    const base = parseFloat(amountStr) || 0;
    let total = base;
    if (hasSC) total += base * 0.10;
    if (hasVat) total += base * 0.07;
    return Math.round(total * 100) / 100;
  }, [amountStr, hasSC, hasVat]);

  // Exact mode difference validation
  const exactSum = useMemo(() => {
    return Object.values(exactAmounts).reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
  }, [exactAmounts]);

  const exactDiff = Math.round((calculatedTotal - exactSum) * 100) / 100;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    try {
      const url = await uploadReceiptFile(file);
      setReceiptImage(url);
    } catch (err) {
      alert('ไม่สามารถอัปโหลดรูปภาพได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || calculatedTotal <= 0) return;

    let computedSplits: Record<string, number> = {};

    if (splitMode === 'EQUAL') {
      const activeIds = Object.keys(selectedMembers).filter(id => selectedMembers[id]);
      if (activeIds.length === 0) {
        alert('กรุณาเลือกสมาชิกอย่างน้อย 1 คนสำหรับหารบิล');
        return;
      }
      const share = Math.round((calculatedTotal / activeIds.length) * 100) / 100;
      activeIds.forEach((id, idx) => {
        if (idx === activeIds.length - 1) {
          const others = share * (activeIds.length - 1);
          computedSplits[id] = Math.round((calculatedTotal - others) * 100) / 100;
        } else {
          computedSplits[id] = share;
        }
      });
    } else if (splitMode === 'EXACT') {
      if (Math.abs(exactDiff) > 0.05) {
        alert(`ยอดเงินระบุรวม (${formatBaht(exactSum)} ฿) ไม่ตรงกับยอดสุทธิ (${formatBaht(calculatedTotal)} ฿)`);
        return;
      }
      members.forEach(m => {
        const val = parseFloat(exactAmounts[m.id]) || 0;
        if (val > 0) computedSplits[m.id] = val;
      });
    } else if (splitMode === 'SHARES') {
      const totalShares = members.reduce((acc, m) => acc + (shareCounts[m.id] || 0), 0);
      if (totalShares <= 0) {
        alert('จำนวนสัดส่วนรวมต้องมากกว่า 0');
        return;
      }
      members.forEach(m => {
        const count = shareCounts[m.id] || 0;
        if (count > 0) {
          computedSplits[m.id] = Math.round(((count / totalShares) * calculatedTotal) * 100) / 100;
        }
      });
    }

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        category,
        baseAmount: parseFloat(amountStr) || calculatedTotal,
        hasSC,
        hasVat,
        totalAmount: calculatedTotal,
        paidById: payerId,
        splitType: splitMode,
        splits: computedSplits,
        date,
        receiptImage,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'บันทึกบิลไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-5 shadow-2xl relative my-auto animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-bold text-lg text-white mb-1">เพิ่มบิลค่าใช้จ่ายใหม่</h3>
        <p className="text-xs text-slate-400 mb-4">บันทึกรายการบิลและคำนวณส่วนหารอัตโนมัติ</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">ชื่อรายการบิล *</label>
            <input
              type="text"
              required
              placeholder="เช่น หมูกระทะริมดอย, ค่าที่พักรีสอร์ท"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">หมวดหมู่</label>
            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-1.5 p-2 rounded-xl text-xs font-medium border transition ${
                    category === cat.id
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount and Taxes */}
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ยอดเงินตามบิล (บาท) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 text-sm">฿</span>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={amountStr}
                    onChange={e => setAmountStr(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">วันที่ชำระ</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* SC & VAT Toggles */}
            <div className="flex gap-2 pt-1 border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => setHasSC(!hasSC)}
                className={`flex-1 py-1.5 px-2.5 rounded-xl border text-xs flex items-center justify-center gap-1.5 transition ${
                  hasSC
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 font-semibold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Percent className="w-3 h-3" />
                <span>Service +10%</span>
              </button>

              <button
                type="button"
                onClick={() => setHasVat(!hasVat)}
                className={`flex-1 py-1.5 px-2.5 rounded-xl border text-xs flex items-center justify-center gap-1.5 transition ${
                  hasVat
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 font-semibold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Percent className="w-3 h-3" />
                <span>VAT +7%</span>
              </button>
            </div>

            {/* Calculated Total Display */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400">ยอดรวมสุทธิที่จะนำไปหาร:</span>
              <span className="text-base font-black text-emerald-400">
                ฿{formatBaht(calculatedTotal)}
              </span>
            </div>
          </div>

          {/* Paid By */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">ใครเป็นคนออกเงินก่อน? *</label>
            <select
              value={payerId}
              onChange={e => setPayerId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              {members.map(m => {
                const emoji = (!m.avatar || m.avatar.startsWith('http') || m.avatar.length > 8) ? '🧑‍💼' : m.avatar;
                return (
                  <option key={m.id} value={m.id}>
                    {emoji} {m.name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Split Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">รูปแบบการหาร</label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setSplitMode('EQUAL')}
                className={`py-1.5 rounded-lg font-medium transition ${
                  splitMode === 'EQUAL' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                หารเท่ากัน
              </button>
              <button
                type="button"
                onClick={() => setSplitMode('EXACT')}
                className={`py-1.5 rounded-lg font-medium transition ${
                  splitMode === 'EXACT' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ระบุยอดเป๊ะๆ
              </button>
              <button
                type="button"
                onClick={() => setSplitMode('SHARES')}
                className={`py-1.5 rounded-lg font-medium transition ${
                  splitMode === 'SHARES' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ตามส่วน (Shares)
              </button>
            </div>
          </div>

          {/* Split Details List */}
          <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80 max-h-48 overflow-y-auto space-y-2">
            {splitMode === 'EXACT' && (
              <div className={`p-2 rounded-xl text-[11px] flex items-center justify-between border ${
                Math.abs(exactDiff) < 0.05
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}>
                <span>ยอดรวมที่ระบุ: ฿{formatBaht(exactSum)}</span>
                <span>
                  {Math.abs(exactDiff) < 0.05
                    ? '✓ ยอดตรงเป๊ะ'
                    : exactDiff > 0
                    ? `ขาดอีก ฿${formatBaht(exactDiff)}`
                    : `เกินมา ฿${formatBaht(Math.abs(exactDiff))}`}
                </span>
              </div>
            )}

            {members.map(m => {
              const activeCount = Object.values(selectedMembers).filter(Boolean).length;
              const equalShare = activeCount > 0 ? Math.round((calculatedTotal / activeCount) * 100) / 100 : 0;

              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    {splitMode === 'EQUAL' && (
                      <input
                        type="checkbox"
                        checked={!!selectedMembers[m.id]}
                        onChange={e =>
                          setSelectedMembers({ ...selectedMembers, [m.id]: e.target.checked })
                        }
                        className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                      />
                    )}
                    <span>{m.avatar}</span>
                    <span className="font-medium text-white">{m.name}</span>
                  </div>

                  {splitMode === 'EQUAL' && (
                    <span className="text-slate-400 font-mono">
                      {selectedMembers[m.id] ? `฿${formatBaht(equalShare)}` : 'ไม่หาร'}
                    </span>
                  )}

                  {splitMode === 'EXACT' && (
                    <div className="flex items-center gap-1 w-28">
                      <span className="text-slate-500">฿</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="0"
                        value={exactAmounts[m.id] || ''}
                        onChange={e =>
                          setExactAmounts({ ...exactAmounts, [m.id]: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-right text-white font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {splitMode === 'SHARES' && (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        value={shareCounts[m.id] ?? 1}
                        onChange={e =>
                          setShareCounts({ ...shareCounts, [m.id]: Math.max(0, parseInt(e.target.value, 10) || 0) })
                        }
                        className="w-14 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center text-white font-mono focus:border-emerald-500 focus:outline-none"
                      />
                      <span className="text-slate-400">ส่วน</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Receipt Image Attachment */}
          <div className="border border-dashed border-slate-800 rounded-2xl p-3 bg-slate-950/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>แนบรูปสลิป / ใบเสร็จ</span>
              </div>
              <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingReceipt ? 'กำลังอัปโหลด...' : receiptImage ? 'เปลี่ยนรูป' : 'อัปโหลด'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingReceipt}
                />
              </label>
            </div>

            {receiptImage && (
              <div className="mt-2 relative inline-block">
                <img
                  src={receiptImage}
                  alt="Receipt Preview"
                  className="h-16 w-16 object-cover rounded-xl border border-slate-700 shadow"
                />
                <button
                  type="button"
                  onClick={() => setReceiptImage(null)}
                  className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || calculatedTotal <= 0}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:opacity-50 text-white font-bold py-3 rounded-2xl text-sm transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{isSubmitting ? 'กำลังบันทึก...' : `บันทึกบิลนี้ (฿${formatBaht(calculatedTotal)})`}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
