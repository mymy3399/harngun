import React, { useState } from 'react';
import { X, LogOut, Mail, Lock, User as UserIcon, ShieldCheck, KeyRound, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';
import { loginWithEmail, registerWithEmail } from '../api/client';

interface LoginModalProps {
  currentUser: User | null;
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
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [promptPay, setPromptPay] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (mode === 'register') {
        const { user } = await registerWithEmail(
          cleanEmail,
          password,
          name.trim() || cleanEmail.split('@')[0],
          promptPay.trim()
        );
        onLoginSuccess(user);
        onClose();
      } else {
        const { user } = await loginWithEmail(cleanEmail, password);
        onLoginSuccess(user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
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
          /* Login / Register Form */
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-10 h-10 bg-emerald-600/20 border border-emerald-500/30 rounded-2xl mx-auto flex items-center justify-center p-2 mb-2 text-emerald-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">
                {mode === 'login' ? 'เข้าสู่ระบบบัญชีของคุณ' : 'สมัครสมาชิกใหม่'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {mode === 'login' ? 'กรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งาน' : 'กรอกข้อมูลเพื่อสร้างบัญชี Harngun'}
              </p>
            </div>

            {errorMsg && (
              <div className="bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs p-2.5 rounded-xl text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">ชื่อของคุณ *</label>
                  <div className="relative">
                    <UserIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="เช่น บอส, พลอย"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">อีเมล *</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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

              {mode === 'register' && (
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">เบอร์พร้อมเพย์ (ไม่บังคับ)</label>
                  <input
                    type="tel"
                    placeholder="เช่น 0812345678"
                    value={promptPay}
                    onChange={e => setPromptPay(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !email.trim() || !password}
                className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-950/50 mt-2 disabled:opacity-50"
              >
                <span>{isLoading ? 'กำลังดำเนินการ...' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'}</span>
              </button>
            </form>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setErrorMsg('');
                }}
                className="text-xs text-slate-400 hover:text-emerald-400 transition"
              >
                {mode === 'login' ? (
                  <>ยังไม่มีบัญชีใช่ไหม? <span className="text-emerald-400 underline underline-offset-2">สมัครสมาชิกใหม่</span></>
                ) : (
                  <>มีบัญชีอยู่แล้วใช่ไหม? <span className="text-emerald-400 underline underline-offset-2">เข้าสู่ระบบที่นี่</span></>
                )}
              </button>
            </div>

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
