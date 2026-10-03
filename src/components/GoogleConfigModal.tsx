import React, { useState } from 'react';
import { X, KeyRound, ExternalLink, CheckCircle2, ShieldCheck, Copy, Check } from 'lucide-react';
import { saveGoogleClientId } from '../api/client';

interface GoogleConfigModalProps {
  currentClientId?: string;
  onClose: () => void;
  onSaved: (clientId: string) => void;
}

export const GoogleConfigModal: React.FC<GoogleConfigModalProps> = ({
  currentClientId = '',
  onClose,
  onSaved,
}) => {
  const [clientId, setClientId] = useState(currentClientId);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedOrigin, setCopiedOrigin] = useState<string | null>(null);

  const currentOrigin = window.location.origin;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOrigin(text);
    setTimeout(() => setCopiedOrigin(null), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim()) {
      setErrorMsg('กรุณากรอก Google Client ID');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await saveGoogleClientId(clientId.trim());
      onSaved(res.googleClientId);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'บันทึก Google Client ID ไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-blue-950/80 border border-blue-500/30 rounded-2xl text-blue-400">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">ตั้งค่า Google Sign-In (OAuth จริง)</h3>
            <p className="text-xs text-slate-400">
              เชื่อมต่อกับเซิร์ฟเวอร์ของ Google เพื่อเปิดหน้าต่างล็อกอินแท้
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Explanation Alert */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>ทำไม Google ถึงต้องใช้ Client ID?</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Google กำหนดมาตรฐานความปลอดภัยว่า ทุกเว็บไซต์ที่ต้องการเปิดหน้าต่างล็อกอิน Google (OAuth 2.0 / accounts.google.com) จะต้องมี Client ID ที่ลงทะเบียนไว้กับ Google Cloud เพื่อยืนยันว่าไม่ใช่เว็บหลอกลวง (Phishing)
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs">
                Google Client ID
              </label>
              <input
                type="text"
                required
                placeholder="เช่น 123456789-abcdef.apps.googleusercontent.com"
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                ระบบจะบันทึกลงไฟล์ <span className="font-mono text-slate-400">.env</span> และเปิดใช้งานทันที
              </p>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !clientId.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30"
            >
              {isLoading ? (
                <span>กำลังบันทึก...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>บันทึกและเปิดใช้งาน Google Sign-In</span>
                </>
              )}
            </button>
          </form>

          {/* Step-by-step Setup Guide */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-slate-300 font-bold text-xs">
              <span>วิธีขอ Google Client ID ฟรี (ใช้เวลา 2 นาที):</span>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                <span>เปิด Google Cloud</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
              <li>
                เปิด <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-400 underline">Google Cloud Credentials</a> (เข้าด้วย Gmail ปกติ ฟรี)
              </li>
              <li>
                กด <b>Create Credentials</b> &gt; เลือก <b>OAuth client ID</b> &gt; เลือกประเภท <b>Web application</b>
              </li>
              <li>
                ในช่อง <b>Authorized JavaScript origins</b> ให้เพิ่มที่อยู่นี้:
              </li>
            </ol>

            {/* Quick Copy Origins */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono text-[11px]">
                <span className="text-slate-300">{currentOrigin}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(currentOrigin)}
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
                >
                  {copiedOrigin === currentOrigin ? (
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> คัดลอกแล้ว
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5">
                      <Copy className="w-3 h-3" /> คัดลอก
                    </span>
                  )}
                </button>
              </div>

              {currentOrigin.includes('192.168.') && (
                <div className="text-[10px] text-slate-500 bg-slate-900/60 p-2 rounded-lg border border-slate-800/50">
                  💡 <b>ข้อแนะนำสำหรับ Google Console:</b> หาก Google ไม่อนุญาตให้ใส่ IP ตรงๆ สามารถใช้ Origin: <span className="font-mono text-blue-300">{`http://${window.location.hostname}.nip.io:${window.location.port || '3001'}`}</span> หรือ <span className="font-mono text-blue-300">{`http://localhost:${window.location.port || '3001'}`}</span> ได้ครับ
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
