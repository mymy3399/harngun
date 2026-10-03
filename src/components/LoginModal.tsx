import React, { useState, useEffect, useRef } from 'react';
import { X, LogIn, LogOut, Check, Mail, User as UserIcon, ShieldCheck, Settings, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { User } from '../types';
import { loginWithGoogleCredential, loginWithGoogleProfile } from '../api/client';
import { GoogleConfigModal } from './GoogleConfigModal';

const GoogleGLogo = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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

declare global {
  interface Window {
    google?: any;
  }
}

export const LoginModal: React.FC<LoginModalProps> = ({
  currentUser,
  googleClientId,
  onUpdateGoogleClientId,
  onLoginSuccess,
  onLogout,
  onClose,
}) => {
  const [activeClientId, setActiveClientId] = useState(googleClientId || '');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDirectGmail, setShowDirectGmail] = useState(false);

  useEffect(() => {
    if (googleClientId) setActiveClientId(googleClientId);
  }, [googleClientId]);

  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Initialize official Google Identity Services if client ID is provided
  useEffect(() => {
    if (activeClientId && window.google?.accounts?.id && googleBtnRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: activeClientId,
          callback: async (response: any) => {
            if (response.credential) {
              setIsLoading(true);
              setErrorMsg('');
              try {
                const { user } = await loginWithGoogleCredential(response.credential);
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
  }, [activeClientId, onLoginSuccess, onClose]);

  // Trigger Google OAuth2 Popup
  const handleTriggerGoogleOAuth = () => {
    if (!activeClientId) {
      setShowConfigModal(true);
      return;
    }

    if (window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: activeClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              console.error('Google OAuth error:', tokenResponse);
              setErrorMsg(tokenResponse.error_description || tokenResponse.error || 'การเข้าสู่ระบบ Google ถูกยกเลิกหรือไม่สำเร็จ');
              return;
            }
            if (tokenResponse.access_token) {
              setIsLoading(true);
              setErrorMsg('');
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลโปรไฟล์จาก Google ได้');
                const profile = await res.json();
                const { user } = await loginWithGoogleProfile({
                  email: profile.email,
                  name: profile.name || profile.given_name || profile.email.split('@')[0],
                  picture: profile.picture || '',
                  googleId: profile.sub,
                });
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
        tokenClient.requestAccessToken({ prompt: 'select_account' });
      } catch (err: any) {
        console.error('Error invoking Google token client:', err);
        setErrorMsg('เกิดข้อผิดพลาดในการเปิด Google Login: ' + err.message);
      }
    } else if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setErrorMsg('Google SDK กำลังโหลด กรุณารอสักครู่แล้วลองใหม่');
    }
  };

  const handleQuickGoogleLogin = async (email: string, name: string, picture: string) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { user } = await loginWithGoogleProfile({
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
                บันทึกข้อมูลกลุ่ม สมาชิก และบิลของคุณอย่างถาวรในฐานข้อมูล
              </p>
            </div>

            {errorMsg && (
              <div className="bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs p-2.5 rounded-xl text-center">
                {errorMsg}
              </div>
            )}

            {/* Primary Google OAuth Trigger Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleTriggerGoogleOAuth}
                disabled={isLoading}
                className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2.5 transition shadow-lg border border-slate-200 active:scale-[0.98]"
              >
                <GoogleGLogo />
                <span className="text-xs font-semibold">เข้าสู่ระบบด้วยบัญชี Google จริง</span>
              </button>

              {/* Status & GSI render */}
              {activeClientId ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Google OAuth พร้อมใช้งาน
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowConfigModal(true)}
                      className="text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                    >
                      <Settings className="w-3 h-3" />
                      <span>ตั้งค่า</span>
                    </button>
                  </div>

                  <div className="flex justify-center pt-1">
                    <div ref={googleBtnRef} />
                  </div>
                </div>
              ) : (
                <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-3 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>ยังไม่ได้เชื่อมต่อ Google Client ID</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    ระบบต้องการ Google Client ID เพื่อเปิดหน้าต่างเลือกบัญชี Google ของแท้
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(true)}
                    className="w-full bg-blue-600/90 hover:bg-blue-600 text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>⚙️ ตั้งค่า Google Client ID (1 นาที)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Collapsible Direct Gmail Login Fallback */}
            <div className="pt-1 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowDirectGmail(!showDirectGmail)}
                className="w-full text-center text-[11px] text-slate-400 hover:text-slate-200 transition py-1 flex items-center justify-center gap-1"
              >
                <span>{showDirectGmail ? 'ซ่อนการเข้าสู่ระบบด่วน' : '⚡ หรือเข้าสู่ระบบด่วนด้วย Gmail โดยตรง'}</span>
                {showDirectGmail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showDirectGmail && (
                <form onSubmit={handleCustomGoogleSubmit} className="space-y-2.5 bg-slate-950/80 p-3 rounded-xl border border-slate-800 mt-1 animate-in fade-in">
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
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
              )}
            </div>
          </div>
        )}
      </div>

      {/* Google Client ID Configuration Modal */}
      {showConfigModal && (
        <GoogleConfigModal
          currentClientId={activeClientId}
          onClose={() => setShowConfigModal(false)}
          onSaved={(newId) => {
            setActiveClientId(newId);
            if (onUpdateGoogleClientId) onUpdateGoogleClientId(newId);
          }}
        />
      )}
    </div>
  );
};
