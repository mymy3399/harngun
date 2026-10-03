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
} from 'lucide-react';
import { User } from '../types';
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogleCredential,
  loginWithGoogleProfile,
  fetchTripInvitePreview,
} from '../api/client';

interface AuthLandingScreenProps {
  inviteCode?: string | null;
  googleClientId?: string;
  onAuthSuccess: (user: User) => void;
}

export const AuthLandingScreen: React.FC<AuthLandingScreenProps> = ({
  inviteCode,
  googleClientId,
  onAuthSuccess,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  // Google GSI init
  useEffect(() => {
    if (googleClientId && window.google?.accounts?.id && googleBtnRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
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
          width: 300,
        });
      } catch (e) {
        console.error('Google One Tap init error:', e);
      }
    }
  }, [googleClientId, onAuthSuccess]);

  const handleGoogleQuick = async (testEmail: string, testName: string, picture: string) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { user } = await loginWithGoogleProfile({
        email: testEmail,
        name: testName,
        picture,
        googleId: `google-${Date.now()}`,
      });
      onAuthSuccess(user);
    } catch (err: any) {
      setErrorMsg(err.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (tab === 'login') {
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
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl shadow-lg shadow-emerald-950/60 mb-1">
            <Receipt className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            หารกัน <span className="text-emerald-400 font-bold">(Harbgun)</span>
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

        {/* Google Authentication Section */}
        <div className="space-y-2.5">
          {googleClientId && (
            <div className="flex justify-center">
              <div ref={googleBtnRef} />
            </div>
          )}

          <button
            onClick={() =>
              handleGoogleQuick(
                'somchai.tour@gmail.com',
                'สมชาย สายเที่ยว',
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
              )
            }
            disabled={isLoading}
            className="w-full bg-white hover:bg-slate-100 active:scale-98 text-slate-900 font-semibold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-3 transition shadow-md border border-slate-200"
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
            <span>{isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google ทันที'}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider">
            หรือใช้อีเมลและรหัสผ่าน
          </span>
        </div>

        {/* Tabs: Login vs Register */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`flex-1 py-2 rounded-xl font-bold transition ${
              tab === 'login' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`flex-1 py-2 rounded-xl font-bold transition ${
              tab === 'register' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            สมัครสมาชิกใหม่
          </button>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'register' && (
            <>
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

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">เบอร์พร้อมเพย์ (สำหรับรับเงินโอน)</label>
                <div className="relative">
                  <Smartphone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="08xxxxxxxx (ไม่บังคับ)"
                    value={promptPay}
                    onChange={e => setPromptPay(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">อีเมล *</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="email"
                required
                placeholder="yourname@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">รหัสผ่าน (อย่างน้อย 6 ตัวอักษร) *</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email.trim() || !password.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:opacity-50 text-white font-bold py-3 rounded-2xl text-xs transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
          >
            <span>
              {isLoading
                ? 'กำลังดำเนินการ...'
                : tab === 'login'
                ? 'เข้าสู่ระบบและเริ่มใช้งาน'
                : 'สร้างบัญชีและเริ่มใช้งาน'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Security & Privacy Guarantee Footer */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>ข้อมูลกลุ่ม สมาชิก และประวัติบิลถูกจัดเก็บปลอดภัยเฉพาะสมาชิกกลุ่ม</span>
        </div>
      </div>
    </div>
  );
};
