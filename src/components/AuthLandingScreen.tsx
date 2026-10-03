import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { User } from '../types';
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogleProfile,
  fetchTripInvitePreview,
} from '../api/client';

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

interface AuthLandingScreenProps {
  inviteCode?: string | null;
  googleClientId?: string;
  onUpdateGoogleClientId?: (clientId: string) => void;
  onAuthSuccess: (user: User) => void;
}

export const AuthLandingScreen: React.FC<AuthLandingScreenProps> = ({
  inviteCode,
  onAuthSuccess,
}) => {
  const [authMode, setAuthMode] = useState<'google' | 'email_login' | 'email_register'>('google');

  // Google sign in state
  const savedEmail = localStorage.getItem('hg_saved_gmail') || '';
  const savedName = localStorage.getItem('hg_saved_name') || '';
  const savedPromptPay = localStorage.getItem('hg_saved_pp') || '';

  const [googleEmail, setGoogleEmail] = useState(savedEmail);
  const [googleName, setGoogleName] = useState(savedName);
  const [googlePromptPay, setGooglePromptPay] = useState(savedPromptPay);
  const [useOtherAccount, setUseOtherAccount] = useState(!savedEmail);

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

  useEffect(() => {
    if (inviteCode) {
      fetchTripInvitePreview(inviteCode)
        .then(data => setInvitedTrip(data))
        .catch(err => console.error('Invite preview error:', err));
    }
  }, [inviteCode]);

  // Execute Google Profile Sign In
  const executeGoogleLogin = async (targetEmail: string, targetName: string, targetPromptPay?: string) => {
    if (!targetEmail.trim()) {
      setErrorMsg('กรุณากรอกอีเมล Google / Gmail');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const cleanEmail = targetEmail.trim().toLowerCase();
      const displayName = targetName.trim() || cleanEmail.split('@')[0];
      const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`;

      // Save for quick 1-click login next time
      localStorage.setItem('hg_saved_gmail', cleanEmail);
      localStorage.setItem('hg_saved_name', displayName);
      if (targetPromptPay && targetPromptPay.trim()) {
        localStorage.setItem('hg_saved_pp', targetPromptPay.trim());
      }

      const { user } = await loginWithGoogleProfile({
        email: cleanEmail,
        name: displayName,
        picture: avatar,
        promptpay: targetPromptPay?.trim(),
        googleId: `google-${Date.now()}`,
      });
      onAuthSuccess(user);
    } catch (err: any) {
      setErrorMsg(err.message || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeGoogleLogin(googleEmail, googleName, googlePromptPay);
  };

  // Email / Password Login or Register
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (authMode === 'email_register') {
        const { user } = await registerWithEmail(
          email,
          password,
          name,
          promptPay.trim()
        );
        onAuthSuccess(user);
      } else {
        const { user } = await loginWithEmail(email, password);
        onAuthSuccess(user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-5 z-10">
        {/* App Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-3xl shadow-xl shadow-emerald-950/60 ring-1 ring-emerald-400/30 mb-1">
            <Receipt className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            หารกัน <span className="text-emerald-400 font-bold">(Harngun)</span>
          </h1>
          <p className="text-xs text-slate-400">
            แอปบันทึกและหารค่าใช้จ่ายในชีวิตประจำวัน ตัดหนี้อัตโนมัติ สแกนจ่ายด้วย Thai PromptPay QR
          </p>
        </div>

        {/* Invited Trip Preview Banner */}
        {invitedTrip && (
          <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/40 rounded-2xl p-3.5 shadow-lg flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> คุณได้รับคำเชิญเข้าร่วมกลุ่ม
              </span>
              <h3 className="font-bold text-sm text-white truncate mt-0.5">{invitedTrip.name}</h3>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Users className="w-3 h-3 text-slate-500" />
                <span>สมาชิกในกลุ่ม {invitedTrip.member_count} คน</span>
              </p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-2.5 py-1 rounded-xl font-semibold flex-shrink-0">
              พร้อมเข้าร่วม
            </div>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-800 text-xs font-semibold shadow-inner">
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
            <GoogleGLogo />
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

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-950/70 border border-rose-800/80 rounded-2xl text-rose-300 text-xs text-center animate-in fade-in">
            {errorMsg}
          </div>
        )}

        {/* Tab 1: Google Account Sign In */}
        {authMode === 'google' && (
          <div className="space-y-3">
            {savedEmail && !useOtherAccount ? (
              /* Quick 1-Click Continue Card */
              <div className="bg-slate-900/90 p-4 rounded-3xl border border-slate-800 space-y-3 text-center shadow-lg">
                <div className="flex items-center justify-center gap-2">
                  <GoogleGLogo />
                  <span className="font-bold text-xs text-white">เข้าสู่ระบบด้วยบัญชี Google</span>
                </div>

                <div className="bg-slate-950/90 p-3 rounded-2xl border border-slate-800/80 flex items-center gap-3 text-left">
                  <div className="w-9 h-9 rounded-full bg-sky-950 border border-sky-500/40 text-sky-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {savedName ? savedName.charAt(0).toUpperCase() : 'G'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-white truncate">{savedName || savedEmail.split('@')[0]}</div>
                    <div className="text-[11px] text-slate-400 truncate">{savedEmail}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => executeGoogleLogin(savedEmail, savedName, savedPromptPay)}
                  disabled={isLoading}
                  className="w-full bg-sky-600 hover:bg-sky-500 active:scale-98 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-sky-950/50"
                >
                  <GoogleGLogo />
                  <span>{isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบต่อด้วยบัญชีนี้'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setUseOtherAccount(true)}
                  className="text-xs text-slate-400 hover:text-slate-200 underline pt-1 block mx-auto"
                >
                  ใช้บัญชี Google / Gmail อื่น
                </button>
              </div>
            ) : (
              /* Google Sign In Form */
              <form onSubmit={handleGoogleSubmit} className="space-y-3 bg-slate-900/90 p-4 rounded-3xl border border-slate-800 shadow-lg">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <GoogleGLogo />
                  <h4 className="font-bold text-xs text-white">ลงชื่อเข้าใช้ด้วยบัญชี Google</h4>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">อีเมล Google (Gmail) *</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="เช่น yourname@gmail.com"
                      value={googleEmail}
                      onChange={e => setGoogleEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">ชื่อที่ต้องการแสดง *</label>
                  <div className="relative">
                    <UserIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="เช่น บอส, พลอย, เมฆ"
                      value={googleName}
                      onChange={e => setGoogleName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">เบอร์พร้อมเพย์ (สำหรับรับเงินโอนคืน)</label>
                  <div className="relative">
                    <CreditCard className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="08xxxxxxxx (เว้นว่างได้)"
                      value={googlePromptPay}
                      onChange={e => setGooglePromptPay(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !googleEmail.trim()}
                  className="w-full bg-sky-600 hover:bg-sky-500 active:scale-98 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-sky-950/50 mt-2"
                >
                  <GoogleGLogo />
                  <span>{isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {savedEmail && (
                  <button
                    type="button"
                    onClick={() => setUseOtherAccount(false)}
                    className="text-xs text-slate-400 hover:text-slate-200 underline pt-1 block mx-auto text-center"
                  >
                    กลับไปใช้บัญชีเดิม ({savedEmail})
                  </button>
                )}
              </form>
            )}
          </div>
        )}

        {/* Tab 2 & 3: Email & Password (Login or Register) */}
        {(authMode === 'email_login' || authMode === 'email_register') && (
          <form onSubmit={handleEmailSubmit} className="space-y-3.5 bg-slate-900/90 p-4 rounded-3xl border border-slate-800 shadow-lg">
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
                  เบอร์พร้อมเพย์ <span className="text-slate-500">(สำหรับรับเงินโอนคืน - เว้นว่างได้)</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="tel"
                    placeholder="เช่น 0812345678"
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
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-emerald-950/60 mt-3"
            >
              <span>
                {isLoading
                  ? 'กำลังดำเนินการ...'
                  : authMode === 'email_login'
                  ? 'เข้าสู่ระบบ'
                  : 'สร้างบัญชีและเริ่มใช้งาน'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Switch Link between Login & Register */}
            <div className="text-center pt-1">
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

        {/* Security & Privacy Clean Footer */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>ระบบบัญชี Harngun ปลอดภัยและเป็นส่วนตัว</span>
        </div>
      </div>
    </div>
  );
};
