import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, CreditCard, ShieldCheck, Download } from 'lucide-react';
import { Member, RecommendedTransaction } from '../types';
import { generatePromptPayPayload } from '../utils/promptpay';
import { formatBaht } from '../utils/currency';

interface PromptPayQRModalProps {
  transaction: RecommendedTransaction;
  onClose: () => void;
  onConfirmPaid: (tx: RecommendedTransaction) => void;
}

export const PromptPayQRModal: React.FC<PromptPayQRModalProps> = ({
  transaction,
  onClose,
  onConfirmPaid,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toM, fromM, amount } = transaction;
  const promptPayNumber = toM?.promptpay || '';

  // Generate real BOT EMVCo PromptPay payload
  const qrPayload = generatePromptPayPayload(promptPayNumber, amount);

  const handleCopy = () => {
    if (!promptPayNumber) return;
    navigator.clipboard?.writeText(promptPayNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirmPaid(transaction);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-5 text-center shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
          <CreditCard className="w-4 h-4" />
          <span>สแกนจ่ายผ่าน Thai PromptPay QR</span>
        </div>

        <h3 className="font-bold text-lg text-white">โอนให้ {toM?.name}</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          จาก {fromM?.name} ({fromM?.avatar})
        </p>

        {/* Real EMVCo PromptPay Visual Frame */}
        <div className="my-4 p-4 bg-white rounded-2xl mx-auto max-w-[240px] shadow-xl text-slate-900 border-4 border-[#0b3b60]">
          <div className="bg-[#0b3b60] text-white text-[10px] font-bold py-1.5 px-3 rounded-md mb-3 flex items-center justify-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-300" />
            <span className="tracking-wider">THAI QR PAYMENT</span>
          </div>

          <div className="relative aspect-square w-full bg-white flex items-center justify-center p-1">
            {promptPayNumber ? (
              <QRCodeSVG
                value={qrPayload}
                size={180}
                level="M"
                includeMargin={false}
              />
            ) : (
              <div className="text-xs text-rose-500 font-medium p-4">
                สมาชิกท่านนี้ยังไม่ได้ระบุเบอร์พร้อมเพย์
              </div>
            )}
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-200 text-center">
            <div className="text-[10px] text-slate-500">พร้อมเพย์ / PromptPay</div>
            <div className="text-xs font-mono font-bold text-slate-900 tracking-wider">
              {promptPayNumber || 'ไม่ระบุเบอร์'}
            </div>
          </div>
        </div>

        {/* Amount Display */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 mb-4">
          <span className="text-[11px] text-slate-400">ยอดเงินที่ต้องโอน (ระบุใน QR แล้ว)</span>
          <div className="text-2xl font-black text-emerald-400">
            ฿{formatBaht(amount)}
          </div>
          <span className="text-[10px] text-emerald-500/80">✨ แอปธนาคารจะกรอกยอดนี้ให้อัตโนมัติ</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'ก๊อปปี้แล้ว!' : 'คัดลอกเบอร์'}</span>
          </button>

          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-950/50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันว่าโอนแล้ว'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
