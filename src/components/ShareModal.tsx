import React, { useState } from 'react';
import { X, Share2, Copy, Check, Users, QrCode as QrIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Trip } from '../types';

interface ShareModalProps {
  trip: Trip | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ trip, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const inviteCode = trip?.invite_code || '';
  const shareUrl = `${window.location.origin}/?invite=${inviteCode}`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
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
        <h3 className="font-bold text-base text-white">เชิญเพื่อนเข้ากลุ่มทริป</h3>
        <p className="text-xs text-slate-400 mt-1">
          ทริป <strong>"{trip?.name}"</strong>
        </p>

        {/* Invite Code Box */}
        <div className="my-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">รหัสเชิญกลุ่ม (Invite Code)</span>
            <span className="text-lg font-black text-emerald-400 font-mono tracking-widest">
              {inviteCode}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'ก๊อปแล้ว' : 'คัดลอกรหัส'}</span>
          </button>
        </div>

        {/* Share Link Box */}
        <div className="my-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-left">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] text-slate-500 block">ลิงก์สมัครและเข้ากลุ่ม</span>
            <span className="text-xs text-slate-300 font-mono truncate block">
              {shareUrl}
            </span>
          </div>
          <button
            onClick={handleCopyLink}
            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 flex-shrink-0 transition shadow-sm"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'ก๊อปแล้ว' : 'คัดลอกลิงก์'}</span>
          </button>
        </div>

        {/* Toggle QR code */}
        <div className="pt-2">
          <button
            onClick={() => setShowQr(!showQr)}
            className="text-xs text-slate-400 hover:text-emerald-400 inline-flex items-center gap-1.5 transition"
          >
            <QrIcon className="w-3.5 h-3.5" />
            <span>{showQr ? 'ซ่อน QR เชิญ' : 'แสดง QR สแกนเข้ากลุ่ม'}</span>
          </button>

          {showQr && (
            <div className="mt-3 p-3 bg-white rounded-2xl mx-auto w-fit shadow-xl animate-in zoom-in-95">
              <QRCodeSVG value={shareUrl} size={150} level="M" />
              <span className="text-[10px] text-slate-700 font-bold block mt-1.5">
                สแกนเพื่อเข้าร่วมกลุ่ม
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 text-[11px] text-slate-400 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 text-left">
          ✨ <strong>วิธีใช้งาน:</strong> ส่งลิงก์นี้เข้า LINE กลุ่ม เมื่อเพื่อนคลิกเปิดและเข้าสู่ระบบด้วย Google หรือสมัครสมาชิก จะถูกเพิ่มเข้าเป็นสมาชิกกลุ่มนี้และเริ่มบันทึกบิลได้ทันที
        </div>
      </div>
    </div>
  );
};
