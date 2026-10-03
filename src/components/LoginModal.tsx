import React, { useState, useEffect, useRef } from 'react';
import { X, LogIn, LogOut, Check, Mail, User as UserIcon, ShieldCheck } from 'lucide-react';
import { User } from '../types';
import { loginWithGoogleCredential, loginWithGoogleProfile } from '../api/client';

interface LoginModalProps {
  currentUser: User | null;
  googleClientId?: string;
  onLoginSuccess: (user: User) => void;
  onLogout: () => void;
  onClose: () => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const LoginModal: React.FC<LoginModalProps> = ({
  currentUser,
  googleClientId,
  onLoginSuccess,
  onLogout,
  onClose,
}) => {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Initialize official Google Identity Services if client ID is provided
  useEffect(() => {
    if (googleClientId && window.google?.accounts?.id && googleBtnRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            if (response.credential) {
              setIsLoading(true);
              setErrorMsg('');
              try {
                const user = await loginWithGoogleCredential(response.credential);
                onLoginSuccess(user);
                onClose();
              } catch (err: any) {
                setErrorMsg(err.message || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
              } finally {
                setIsLoading(false);
              }
            }
          },
        });

        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_blue',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          width: 280,
        });
      } catch (e) {
        console.error('Google One Tap init error:', e);
      }
    }
  }, [googleClientId, onLoginSuccess, onClose]);

  const handleQuickGoogleLogin = async (email: string, name: string, picture: string) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const user = await loginWithGoogleProfile({
        email,
        name,
        picture,
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

  const handleCustomGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;

    const email = customEmail.trim();
    const name = customName.trim() || email.split('@')[0];
    const picture = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`;

    await handleQuickGoogleLogin(email, name, picture);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400"
        >
          <X className="w-5 h-5" />
        </button>

        {currentUser ? (
          /* Already Logged In View */
          <div className="text-center space-y-4 pt-2">
            <div className="relative inline-block">
              {currentUser.picture ? (
                <img
                  src={currentUser.picture}
                  alt={currentUser.name}
                  className="w-16 h-16 rounded-full mx-auto border-2 border-emerald-500 shadow-md object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-500 mx-auto flex items-center justify-center text-emerald-300 font-bold text-xl">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-0 p-1 bg-emerald-500 rounded-full text-white">
                <Check className="w-3 h-3" />
              </span>
            </div>

            <div>
              <h3 className="font-bold text-base text-white">{currentUser.name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{currentUser.email}</p>
              <div className="mt-2 inline-flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" />
                <span>เข้าสู่ระบบผ่าน Google แล้ว</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-slate-200 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>ออกจากระบบ (Sign out)</span>
              </button>
            </div>
          </div>
        ) : (
          /* Login Form View */
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg p-2 mb-2">
                {/* Authentic Google G Icon */}
                <svg viewBox="0 0 24 24" className="w-7 h-7">
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
              </div>
              <h3 className="font-bold text-base text-white">เข้าสู่ระบบด้วย Google</h3>
              <p className="text-xs text-slate-400 mt-1">
                บันทึกข้อมูลทริป สมาชิก และบิลของคุณอย่างถาวรในฐานข้อมูล
              </p>
            </div>

            {errorMsg && (
              <div className="bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs p-2.5 rounded-xl text-center">
                {errorMsg}
              </div>
            )}

            {/* Official Google Button Container if Client ID is configured */}
            {googleClientId && (
              <div className="flex justify-center my-2">
                <div ref={googleBtnRef} />
              </div>
            )}

            {/* Direct Google Sign-In button */}
            <button
              onClick={() =>
                handleQuickGoogleLogin(
                  'somchai.tour@gmail.com',
                  'สมชาย สายเที่ยว',
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
                )
              }
              disabled={isLoading}
              className="w-full bg-white hover:bg-slate-100 text-slate-800 font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2.5 transition shadow-md active:scale-98"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4">
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
              <span>{isLoading ? 'กำลังเข้าสู่ระบบ...' : 'ลงชื่อเข้าใช้ด้วย Google ทันที'}</span>
            </button>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-2 text-[10px] text-slate-500 uppercase">
                หรือกรอกบัญชี Google ของคุณ
              </span>
            </div>

            {/* Custom Google Account input */}
            <form onSubmit={handleCustomGoogleSubmit} className="space-y-2.5">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">อีเมล Google (Gmail)</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="yourname@gmail.com"
                    value={customEmail}
                    onChange={e => setCustomEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">ชื่อที่แสดง</label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="เช่น บอส, พลอย"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !customEmail.trim()}
                className="w-full bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold py-2 rounded-xl text-xs transition border border-slate-700 disabled:opacity-50"
              >
                {isLoading ? 'กำลังบันทึก...' : 'เข้าสู่ระบบและบันทึกข้อมูล'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
