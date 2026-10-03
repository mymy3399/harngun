import React, { useState } from 'react';
import { X, LogIn, LogOut, Mail, User as UserIcon, ShieldCheck } from 'lucide-react';
import { User } from '../types';
import { loginWithGoogleProfile } from '../api/client';

const GoogleGLogo = () => (
  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

interface LoginModalProps {
  currentUser: User | null;
  googleClientId?: string;
  onUpdateGoogleClientId?: (id: string) => void;
  onLoginSuccess: (user: User) => void;
  onLogout: () => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  currentUser,
  onLoginSuccess,
  onLogout,
  onClose,
}) => {
  const [email, setEmail] = useState(() => localStorage.getItem('hg_saved_gmail') || '');
  const [name, setName] = useState(() => localStorage.getItem('hg_saved_name') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('กรุณากรอกอีเมล Google / Gmail');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const cleanEmail = email.trim().toLowerCase();
      const displayName = name.trim() || cleanEmail.split('@')[0];
      const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`;

      localStorage.setItem('hg_saved_gmail', cleanEmail);
      localStorage.setItem('hg_saved_name', displayName);

      const { user } = await loginWithGoogleProfile({
        email: cleanEmail,
        name: displayName,
        picture: avatar,
        googleId: `google-${Date.now()}`,
      });
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-full hover:bg-slate-800 text-slate-400 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {currentUser ? (
          /* Profile & Logout View */
          <div className="space-y-4">
            <div className="text-center pt-2">
              <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-emerald-500/50 mx-auto overflow-hidden flex items-center justify-center text-2xl shadow-inner mb-2">
                {currentUser.picture && currentUser.picture.startsWith('http') ? (
                  <img
                    src={currentUser.picture}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{currentUser.picture || '😎'}</span>
                )}
              </div>
              <h3 className="font-bold text-base text-white">{currentUser.name}</h3>
              <p className="text-xs text-slate-400">{currentUser.email}</p>
              {currentUser.promptpay && (
                <span className="inline-block mt-1.5 text-[11px] font-mono bg-slate-950 text-emerald-400 px-2.5 py-0.5 rounded-full border border-slate-800">
                  พร้อมเพย์: {currentUser.promptpay}
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        ) : (
          /* Login View */
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-10 h-10 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg p-2 mb-2">
                <GoogleGLogo />
              </div>
              <h3 className="font-bold text-base text-white">ลงชื่อเข้าใช้ด้วย Google</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                เชื่อมโยงข้อมูลสมาชิกและบันทึกประวัติการใช้งานของคุณ
              </p>
            </div>

            {errorMsg && (
              <div className="bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs p-2.5 rounded-xl text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">อีเมล Google (Gmail) *</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="yourname@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">ชื่อที่แสดง *</label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="เช่น บอส, พลอย, เมฆ"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full bg-sky-600 hover:bg-sky-500 active:scale-98 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-sky-950/50 mt-2 disabled:opacity-50"
              >
                <GoogleGLogo />
                <span>{isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}</span>
              </button>
            </form>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 text-center">
              <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span>ระบบรักษาความปลอดภัยบัญชี Harngun</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
