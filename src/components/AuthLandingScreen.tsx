import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Receipt,
  Users,
  ArrowRight,
  Mail,
  Lock,
  User as UserIcon,
  Sparkles,
  KeyRound,
  CreditCard,
  Eye,
  EyeOff,
} from 'lucide-react';
import { User } from '../types';
import {
  registerWithEmail,
  loginWithEmail,
  fetchTripInvitePreview,
} from '../api/client';

interface AuthLandingScreenProps {
  inviteCode?: string | null;
  onAuthSuccess: (user: User) => void;
}

export const AuthLandingScreen: React.FC<AuthLandingScreenProps> = ({
  inviteCode,
  onAuthSuccess,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Form state
  const [email, setEmail] = useState(() => localStorage.getItem('hg_saved_email') || '');
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

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      localStorage.setItem('hg_saved_email', cleanEmail);

      if (authMode === 'register') {
        const { user } = await registerWithEmail(
          cleanEmail,
          password,
          name.trim(),
          promptPay.trim()
        );
        onAuthSuccess(user);
      } else {
        const { user } = await loginWithEmail(cleanEmail, password);
        onAuthSuccess(user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'ดำเนินการไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองใหม่อีกครั้ง');
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

        {/* Mode Selector Tabs: เข้าสู่ระบบ vs สมัครสมาชิก */}
        <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-800 text-xs font-semibold shadow-inner">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 px-1 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              authMode === 'login'
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
              setAuthMode('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 px-1 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              authMode === 'register'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>สมัครสมาชิกใหม่</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-950/70 border border-rose-800/80 rounded-2xl text-rose-300 text-xs text-center animate-in fade-in">
            {errorMsg}
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 bg-slate-900/90 p-5 rounded-3xl border border-slate-800 shadow-xl">
          {authMode === 'register' && (
            <div>
              <label className="block text-[11px] text-slate-300 mb-1">ชื่อของคุณ *</label>
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
            <label className="block text-[11px] text-slate-300 mb-1">อีเมลของคุณ *</label>
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
            <label className="block text-[11px] text-slate-300 mb-1">รหัสผ่าน *</label>
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

          {authMode === 'register' && (
            <div>
              <label className="block text-[11px] text-slate-300 mb-1">
                เบอร์พร้อมเพย์ <span className="text-slate-500">(สำหรับรับเงินโอน - เว้นว่างได้)</span>
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
                : authMode === 'login'
                ? 'เข้าสู่ระบบ'
                : 'สร้างบัญชีและเริ่มใช้งาน'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick Switch Link */}
          <div className="text-center pt-1">
            {authMode === 'login' ? (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
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
                  setAuthMode('login');
                  setErrorMsg('');
                }}
                className="text-xs text-slate-400 hover:text-emerald-400 transition"
              >
                มีบัญชีอยู่แล้วใช่ไหม? <span className="text-emerald-400 font-semibold underline underline-offset-2">กดเข้าสู่ระบบที่นี่</span>
              </button>
            )}
          </div>
        </form>

        {/* Security & Privacy Clean Footer */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>ระบบบัญชี Harngun ปลอดภัยและเป็นส่วนตัว</span>
        </div>
      </div>
    </div>
  );
};
