import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Receipt,
  Users,
  QrCode,
  ArrowRight,
  Mail,
  Lock,
  User as UserIcon,
  Smartphone,
  Sparkles,
  CheckCircle2,
  KeyRound,
  CreditCard,
  Eye,
  EyeOff,
  Settings,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { User } from '../types';
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogleCredential,
  loginWithGoogleProfile,
  fetchTripInvitePreview,
} from '../api/client';
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

interface AuthLandingScreenProps {
  inviteCode?: string | null;
  googleClientId?: string;
  onUpdateGoogleClientId?: (clientId: string) => void;
  onAuthSuccess: (user: User) => void;
}

export const AuthLandingScreen: React.FC<AuthLandingScreenProps> = ({
  inviteCode,
  googleClientId,
  onUpdateGoogleClientId,
  onAuthSuccess,
}) => {
  const [authMode, setAuthMode] = useState<'google' | 'email_login' | 'email_register'>('google');
  
  // Google OAuth state
  const [activeClientId, setActiveClientId] = useState(googleClientId || '');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDirectGmail, setShowDirectGmail] = useState(false);

  useEffect(() => {
    if (googleClientId) setActiveClientId(googleClientId);
  }, [googleClientId]);

  // Google direct sign in fallback state
  const [googleEmail, setGoogleEmail] = useState(() => localStorage.getItem('hg_saved_gmail') || '');
  const [googleName, setGoogleName] = useState(() => localStorage.getItem('hg_saved_name') || '');
  const [googlePromptPay, setGooglePromptPay] = useState(() => localStorage.getItem('hg_saved_pp') || '');

  // Email / Password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [promptPay, setPromptPay] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Invited Trip Preview info if inviteCode is present
  const [invitedTrip, setInvitedTrip] = useState<{
    id: string;
    name: string;
    member_count: number;
  } | null>(null);

  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inviteCode) {
      fetchTripInvitePreview(inviteCode)
        .then(data => setInvitedTrip(data))
        .catch(err => console.error('Invite preview error:', err));
    }
  }, [inviteCode]);

  // Google GSI init (if Client ID is provided from .env)
  useEffect(() => {
    if (activeClientId && window.google?.accounts?.id && googleBtnRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: activeClientId,
          callback: async (res: any) => {
            if (res.credential) {
              setIsLoading(true);
              setErrorMsg('');
              try {
                const { user } = await loginWithGoogleCredential(res.credential);
                onAuthSuccess(user);
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
          width: 320,
        });
      } catch (e) {
        console.error('Google One Tap init error:', e);
      }
    }
  }, [activeClientId, onAuthSuccess]);

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
              setErrorMsg(tokenResponse.error_description || tokenResponse.error || 'การเข้าสู่ระบบ Google ไม่สำเร็จหรือถูกยกเลิก');
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
                onAuthSuccess(user);
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
      setErrorMsg('Google SDK กำลังโหลด กรุณารอสักครู่แล้วลองใหม่อีกครั้ง');
    }
  };

  // Real Google Profile Login Handler
  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      setErrorMsg('กรุณากรอกอีเมล Google / Gmail ของคุณ');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const cleanEmail = googleEmail.trim().toLowerCase();
      const displayName = googleName.trim() || cleanEmail.split('@')[0];
      const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`;

      // Save to localStorage for quick login next time
      localStorage.setItem('hg_saved_gmail', cleanEmail);
      localStorage.setItem('hg_saved_name', displayName);
      if (googlePromptPay.trim()) localStorage.setItem('hg_saved_pp', googlePromptPay.trim());

      const { user } = await loginWithGoogleProfile({
        email: cleanEmail,
        name: displayName,
        picture: avatar,
        googleId: `google-${Date.now()}`,
      });
      onAuthSuccess(user);
    } catch (err: any) {
      setErrorMsg(err.message || 'เข้าสู่ระบบด้วยบัญชี Google ไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  // Email & Password Handler
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (authMode === 'email_login') {
        const { user } = await loginWithEmail(email, password);
        onAuthSuccess(user);
      } else {
        const { user } = await registerWithEmail(email, password, name, promptPay);
        onAuthSuccess(user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-emerald-500 selection:text-white font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl shadow-lg shadow-emerald-950/60 mb-1">
            <Receipt className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            หารกัน <span className="text-emerald-400 font-bold">(Harngun)</span>
          </h1>
          <p className="text-xs text-slate-400">
            แอปบันทึกและหารค่าใช้จ่ายในชีวิตประจำวัน ตัดหนี้อัตโนมัติ สแกนจ่ายด้วย Thai PromptPay QR
          </p>
        </div>

        {/* Invitation Notification Card if user arrived via link */}
        {invitedTrip && (
          <div className="bg-emerald-950/60 border border-emerald-500/50 p-4 rounded-2xl space-y-1 text-center shadow-lg animate-pulse">
            <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block">
              🎉 คุณได้รับคำเชิญเข้าร่วมกลุ่ม
            </span>
            <h3 className="font-black text-base text-white truncate">"{invitedTrip.name}"</h3>
            <p className="text-xs text-emerald-200/80">
              สมาชิกปัจจุบัน {invitedTrip.member_count} คน • เข้าสู่ระบบเพื่อเข้าร่วมกลุ่มทันที
            </p>
          </div>
        )}

        {/* Error message banner */}
        {errorMsg && (
          <div className="bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs p-3 rounded-2xl text-center">
            {errorMsg}
          </div>
        )}

        {/* Auth Mode Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs gap-1">
          <button
            type="button"
            onClick={() => {
              setAuthMode('google');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 px-1 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              authMode === 'google'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0">
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
            <span>บัญชี Google</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('email_login');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 px-1 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              authMode === 'email_login'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>เข้าสู่ระบบ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('email_register');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 px-1 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              authMode === 'email_register'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>สมัครใหม่</span>
          </button>
        </div>

        {/* Tab 1: Real Google Account Login */}
        {authMode === 'google' && (
          <div className="space-y-3.5">
            {/* Real Google OAuth Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleTriggerGoogleOAuth}
                disabled={isLoading}
                className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-3 transition shadow-lg border border-slate-200 active:scale-[0.98]"
              >
                <GoogleGLogo />
                <span className="text-sm font-semibold">เข้าสู่ระบบด้วยบัญชี Google จริง</span>
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
                <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-3.5 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>ยังไม่ได้เชื่อมต่อ Google Client ID</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    ระบบต้องการ <b>Google Client ID</b> เพื่อเปิดหน้าต่างเลือกบัญชี Google ของแท้ (<span className="text-blue-300 font-mono">accounts.google.com</span>)
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(true)}
                    className="w-full bg-blue-600/90 hover:bg-blue-600 text-white font-semibold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>⚙️ ตั้งค่า Google Client ID ทันที (ฟรี 2 นาที)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Collapsible Direct Gmail Login Fallback */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowDirectGmail(!showDirectGmail)}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition py-1 flex items-center justify-center gap-1"
              >
                <span>{showDirectGmail ? 'ซ่อนการเข้าสู่ระบบด่วน' : '⚡ หรือเข้าสู่ระบบด่วนด้วย Gmail (ไม่ต้องตั้งค่า Google Cloud)'}</span>
                {showDirectGmail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showDirectGmail && (
                <form onSubmit={handleGoogleSubmit} className="space-y-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 mt-2 animate-in fade-in">
                  <div className="text-[11px] text-slate-400 text-center pb-1">
                    บันทึกโปรไฟล์เข้าสู่ฐานข้อมูล SQLite ในระบบโดยตรงทันที
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">อีเมล Gmail ของคุณ *</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="เช่น yourname@gmail.com"
                        value={googleEmail}
                        onChange={e => setGoogleEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">ชื่อที่ต้องการแสดงในระบบ *</label>
                    <div className="relative">
                      <UserIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="เช่น บอส, พลอย, เมฆ"
                        value={googleName}
                        onChange={e => setGoogleName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">เบอร์พร้อมเพย์ (ไม่บังคับ)</label>
                    <div className="relative">
                      <CreditCard className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="08xxxxxxxx (เว้นว่างได้)"
                        value={googlePromptPay}
                        onChange={e => setGooglePromptPay(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !googleEmail.trim()}
                    className="w-full bg-sky-600 hover:bg-sky-500 active:scale-98 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-sky-950/50 mt-2"
                  >
                    <span>{isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Gmail บันทึกลงระบบทันที'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Tab 2 & 3: Email & Password (Login or Register) */}
        {(authMode === 'email_login' || authMode === 'email_register') && (
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {authMode === 'email_register' && (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">ชื่อของคุณ *</label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="เช่น บอส, พลอย, เมฆ"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">อีเมลของคุณ *</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">รหัสผ่าน *</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {authMode === 'email_register' && (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  เบอร์พร้อมเพย์ (สำหรับรับเงินโอนคืน)
                </label>
                <div className="relative">
                  <CreditCard className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="08xxxxxxxx (เว้นว่างได้)"
                    value={promptPay}
                    onChange={e => setPromptPay(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email.trim() || !password}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950/60 mt-4"
            >
              <span>
                {isLoading
                  ? 'กำลังดำเนินการ...'
                  : authMode === 'email_login'
                  ? 'เข้าสู่ระบบและเริ่มใช้งาน'
                  : 'สร้างบัญชีและเริ่มใช้งาน'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Switch Link between Login & Register */}
            <div className="text-center pt-2">
              {authMode === 'email_login' ? (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('email_register');
                    setErrorMsg('');
                  }}
                  className="text-xs text-slate-400 hover:text-emerald-400 transition"
                >
                  ยังไม่มีบัญชีใช่ไหม? <span className="text-emerald-400 font-semibold underline underline-offset-2">กดสมัครสมาชิกที่นี่</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('email_login');
                    setErrorMsg('');
                  }}
                  className="text-xs text-slate-400 hover:text-emerald-400 transition"
                >
                  มีบัญชีอยู่แล้วใช่ไหม? <span className="text-emerald-400 font-semibold underline underline-offset-2">กดเข้าสู่ระบบที่นี่</span>
                </button>
              )}
            </div>
          </form>
        )}

        {/* Security & Database Guarantee Footer */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>ข้อมูลผู้ใช้จริงถูกจัดเก็บอย่างปลอดภัยในฐานข้อมูลระบบ Harngun</span>
        </div>
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
