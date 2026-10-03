import React, { useState } from 'react';
import { PlusCircle, UserCheck, Trash2, Smartphone } from 'lucide-react';
import { Member, MemberBalance } from '../types';
import { formatBaht } from '../utils/currency';

interface MembersTabProps {
  members: Member[];
  balances: MemberBalance[];
  onAddMember: (name: string, promptPay: string, avatar: string) => Promise<void>;
  onDeleteMember?: (memberId: string) => Promise<void>;
}

export const MembersTab: React.FC<MembersTabProps> = ({
  members,
  balances,
  onAddMember,
}) => {
  const [name, setName] = useState('');
  const [promptPay, setPromptPay] = useState('');
  const [avatar, setAvatar] = useState('🎒');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emojis = ['🎒', '🍜', '🚗', '☕', '🏕️', '🍻', '🛵', '📷', '🏖️', '✈️', '🌸', '😎'];

  const balanceMap = new Map<string, MemberBalance>();
  balances.forEach(b => balanceMap.set(b.member_id, b));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddMember(name.trim(), promptPay.trim(), avatar);
      setName('');
      setPromptPay('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-5">
      {/* Add Member Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm"
      >
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>เพิ่มเพื่อนใหม่เข้ากลุ่ม</span>
        </h3>

        {/* Avatar emoji picker */}
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">เลือกไอคอนสมาชิก</label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {emojis.map(em => (
              <button
                key={em}
                type="button"
                onClick={() => setAvatar(em)}
                className={`p-1.5 text-base rounded-xl border transition ${
                  avatar === em ? 'border-emerald-500 bg-emerald-950/70 scale-105' : 'border-slate-800 bg-slate-950'
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="ชื่อเพื่อน (เช่น นุ่น, ท็อป)"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <input
            type="text"
            placeholder="เบอร์พร้อมเพย์ (08xxxxxxxx)"
            value={promptPay}
            onChange={e => setPromptPay(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:opacity-50 text-white font-semibold py-2 rounded-xl text-xs transition shadow-sm"
        >
          {isSubmitting ? 'กำลังเพิ่ม...' : '+ เพิ่มเพื่อนเข้ากลุ่ม'}
        </button>
      </form>

      {/* Members List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          สมาชิกในกลุ่มทั้งหมด ({members.length} คน)
        </h3>

        <div className="space-y-2">
          {members.map(m => {
            const bal = balanceMap.get(m.id);
            return (
              <div
                key={m.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-2 bg-slate-950 rounded-xl border border-slate-800">
                    {m.avatar}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-white">{m.name}</h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <Smartphone className="w-3 h-3 text-emerald-400" />
                      <span className="font-mono">{m.promptpay || 'ไม่ได้ระบุพร้อมเพย์'}</span>
                    </div>
                  </div>
                </div>

                {bal && (
                  <div className="text-right text-xs">
                    <span className="text-[10px] text-slate-500 block">ออกเงินไปแล้ว</span>
                    <span className="font-bold text-slate-200">฿{formatBaht(bal.total_paid)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
