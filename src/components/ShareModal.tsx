import React, { useState } from 'react';
import { X, Share2, Copy, Check } from 'lucide-react';
import { Trip } from '../types';

interface ShareModalProps {
  trip: Trip | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ trip, onClose }) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}${window.location.pathname}?tripId=${trip?.id || ''}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-5 text-center shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl w-fit mx-auto mb-2">
          <Share2 className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-base text-white">ชวนเพื่อนเข้ากลุ่ม</h3>
        <p className="text-xs text-slate-400 mt-1">
          แชร์ลิงก์นี้ให้เพื่อนใน LINE หรือกลุ่มแชท เพื่อเปิดทริป <strong>"{trip?.name}"</strong> บนอุปกรณ์ของพวกเขา
        </p>

        <div className="my-4 bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-left">
          <span className="text-xs text-slate-300 font-mono truncate mr-2">
            {shareUrl}
          </span>
          <button
            onClick={handleCopy}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 flex-shrink-0 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'ก๊อปแล้ว' : 'คัดลอก'}</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
          💡 ระบบใช้ฐานข้อมูล SQLite ประสิทธิภาพสูง ข้อมูลถูกบันทึกปลอดภัย รองรับการเพิ่มบิลและคำนวณตัดหนี้ได้ไม่จำกัด
        </div>
      </div>
    </div>
  );
};
