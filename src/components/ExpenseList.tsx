import React from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  Download,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';
import { Expense, Member, MemberBalance, CATEGORIES, ExpenseCategory } from '../types';
import { formatBaht, formatDateThai } from '../utils/currency';
import { exportTripToCsv } from '../utils/exportCsv';

interface ExpenseListProps {
  tripName: string;
  expenses: Expense[];
  members: Member[];
  balances: MemberBalance[];
  pagination: { page: number; limit: number; totalItems: number; totalPages: number };
  searchQuery: string;
  selectedCategory: string;
  selectedPayer: string;
  sortBy: 'date' | 'amount';
  order: 'asc' | 'desc';
  onSearchChange: (q: string) => void;
  onCategoryChange: (cat: string) => void;
  onPayerChange: (payer: string) => void;
  onSortChange: (sortBy: 'date' | 'amount', order: 'asc' | 'desc') => void;
  onPageChange: (page: number) => void;
  onDeleteExpense: (id: string) => void;
  onOpenNewModal: () => void;
  onOpenReceiptViewer: (imageUrl: string, title: string) => void;
  onSeedBulk: () => void;
  isSeedingBulk: boolean;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  tripName,
  expenses,
  members,
  balances,
  pagination,
  searchQuery,
  selectedCategory,
  selectedPayer,
  sortBy,
  order,
  onSearchChange,
  onCategoryChange,
  onPayerChange,
  onSortChange,
  onPageChange,
  onDeleteExpense,
  onOpenNewModal,
  onOpenReceiptViewer,
  onSeedBulk,
  isSeedingBulk,
}) => {
  const getCategoryInfo = (catId: ExpenseCategory) => {
    return CATEGORIES.find(c => c.id === catId) || CATEGORIES[5];
  };

  const handleExport = () => {
    exportTripToCsv(tripName, expenses, members, balances);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Top action row: Seed test bills & Export CSV */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          onClick={onSeedBulk}
          disabled={isSeedingBulk}
          className="flex items-center gap-1.5 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-800 hover:to-indigo-800 border border-purple-500/40 text-purple-200 px-3 py-1.5 rounded-xl text-xs font-medium transition shadow-sm active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-300" />
          <span>{isSeedingBulk ? 'กำลังสร้าง 50 บิล...' : '+ สุ่ม 50 บิลทดสอบ'}</span>
        </button>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium transition active:scale-95 shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>ส่งออก Excel/CSV</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="space-y-2 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="ค้นหาชื่อรายการบิล..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-white"
            >
              ล้าง
            </button>
          )}
        </div>

        {/* Category Pills (horizontal scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          <button
            onClick={() => onCategoryChange('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition border ${
              selectedCategory === 'all'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            ทั้งหมด
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition border ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Payer and Sort selectors */}
        <div className="flex items-center gap-2 pt-1 text-xs">
          <div className="flex-1">
            <select
              value={selectedPayer}
              onChange={e => onPayerChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="all">คนจ่าย: ทุกคน</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.avatar} {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <select
              value={`${sortBy}-${order}`}
              onChange={e => {
                const [sb, ord] = e.target.value.split('-');
                onSortChange(sb as any, ord as any);
              }}
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="date-desc">วันที่: ล่าสุดก่อน</option>
              <option value="date-asc">วันที่: เก่าสุดก่อน</option>
              <option value="amount-desc">ยอดเงิน: สูงสุดก่อน</option>
              <option value="amount-asc">ยอดเงิน: ต่ำสุดก่อน</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expense List header count */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>พบ {pagination.totalItems.toLocaleString()} รายการ</span>
        <button
          onClick={onOpenNewModal}
          className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>+ เพิ่มบิลใหม่</span>
        </button>
      </div>

      {/* Expenses Cards */}
      {expenses.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-8 text-center text-slate-400 space-y-3">
          <div className="text-3xl">🧾</div>
          <p className="text-sm font-medium">ไม่พบบิลค่าใช้จ่ายที่ตรงกับเงื่อนไข</p>
          <button
            onClick={onOpenNewModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow transition"
          >
            + บันทึกค่าใช้จ่ายรายการแรก
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {expenses.map(exp => {
            const cat = getCategoryInfo(exp.category);
            const splitParticipantCount = Object.keys(exp.splits || {}).length;

            return (
              <div
                key={exp.id}
                className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 rounded-2xl p-3.5 transition group shadow-sm flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="text-2xl p-1 bg-slate-950 rounded-xl border border-slate-800/80">
                      {cat.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-white truncate">{exp.title}</h4>
                        {exp.receipt_image && (
                          <button
                            onClick={() => onOpenReceiptViewer(exp.receipt_image!, exp.title)}
                            title="ดูรูปสลิป"
                            className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 p-0.5 rounded hover:bg-emerald-900 transition flex-shrink-0"
                          >
                            <ImageIcon className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                        <span>จ่ายโดย {exp.payer_avatar} {exp.payer_name}</span>
                        <span>•</span>
                        <span>{formatDateThai(exp.date)}</span>
                        {exp.has_sc ? (
                          <span className="bg-amber-950/60 text-amber-300 border border-amber-500/40 text-[9px] px-1 rounded">
                            SC 10%
                          </span>
                        ) : null}
                        {exp.has_vat ? (
                          <span className="bg-blue-950/60 text-blue-300 border border-blue-500/40 text-[9px] px-1 rounded">
                            VAT 7%
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-base text-white">
                      ฿{formatBaht(exp.total_amount)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {splitParticipantCount > 0 ? `หาร ${splitParticipantCount} คน` : 'ไม่มีคนหาร'}
                    </div>
                  </div>
                </div>

                {/* Sub-bar with delete button & split info */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1 truncate pr-2">
                    <span className="text-slate-500">ประเภท:</span>
                    <span>
                      {exp.split_type === 'EQUAL'
                        ? 'หารเท่ากัน'
                        : exp.split_type === 'EXACT'
                        ? 'ระบุยอดตรงตัว'
                        : 'ตามส่วน'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`คุณแน่ใจว่าต้องการลบบิล "${exp.title}" ใช่หรือไม่?`)) {
                        onDeleteExpense(exp.id);
                      }
                    }}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition opacity-80 group-hover:opacity-100"
                    title="ลบบิลนี้"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl disabled:opacity-40 hover:bg-slate-800 transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>ก่อนหน้า</span>
          </button>

          <span>
            หน้า {pagination.page} / {pagination.totalPages}
          </span>

          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl disabled:opacity-40 hover:bg-slate-800 transition"
          >
            <span>ถัดไป</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
