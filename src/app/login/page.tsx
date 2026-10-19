'use client';

import { useState } from 'react';
import Link from 'next/link';
import { browserClient } from '@/lib/browser';

export default function LoginPage() {
  const sb = browserClient();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [state, setState] = useState('Uttar Pradesh');
  const [category, setCategory] = useState('GEN');
  const [education, setEducation] = useState('GRAD');
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. Google One-Click Login
  const handleGoogleLogin = async () => {
    try {
      await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      });
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Google login failed' });
    }
  };

  // 2. Email / Password Login or Register
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
          // Hard reload so header immediately reads the active session
          window.location.href = '/';
        }
      } else if (mode === 'register') {
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              state,
              category,
              education,
            },
          },
        });
        if (error) throw error;

        // Agar session mil gaya toh direct login, warna message
        if (data.session) {
          window.location.href = '/';
        } else {
          setMsg({
            type: 'success',
            text: 'Account ban gaya hai! Ab apna email aur password daal kar login karein.',
          });
          setMode('login');
        }
      } else if (mode === 'forgot') {
        const { error } = await sb.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) throw error;
        setMsg({
          type: 'success',
          text: 'Password reset link aapki email par bhej diya gaya hai.',
        });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message || 'Login fail hua. Email ya password check karein.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-black text-slate-900">
              sarkari<span className="text-blue-600">yogyata</span>
            </span>
          </Link>
          <p className="mt-1 text-xs text-slate-500">
            {mode === 'login' && 'Apne account me login karein'}
            {mode === 'register' && 'Naya candidate account banayein (Free)'}
            {mode === 'forgot' && 'Password recover karein'}
          </p>
        </div>

        {mode !== 'forgot' && (
          <div className="mt-6">
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
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
              <span>Google Account se Continue karein</span>
            </button>

            <div className="relative my-4 flex items-center justify-center">
              <div className="w-full border-t border-slate-200"></div>
              <span className="absolute bg-white px-3 text-[10px] font-bold uppercase text-slate-400">
                या Email से
              </span>
            </div>
          </div>
        )}

        {msg && (
          <div
            className={`mb-4 rounded-xl p-3 text-xs font-bold ${
              msg.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-slate-600">पूरा नाम (Full Name)</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="उदा. राहुल शर्मा"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600">State</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-2 py-2 text-xs font-medium bg-white focus:outline-none"
                  >
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Haryana">Haryana</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600">वर्ग (Category)</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-2 py-2 text-xs font-medium bg-white focus:outline-none"
                  >
                    <option value="GEN">General / EWS</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-600">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-blue-500 focus:outline-none"
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-blue-600 py-2.5 text-xs font-black text-white hover:bg-blue-700 shadow transition disabled:opacity-50"
          >
            {loading ? 'Kripya intezar karein...' : mode === 'login' ? 'Log In' : mode === 'register' ? 'Register Account' : 'Reset Link Bhejein'}
          </button>
        </form>

        <div className="mt-5 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
          {mode === 'login' ? (
            <p>
              Naye candidate hain?{' '}
              <button onClick={() => setMode('register')} className="font-bold text-blue-600 underline">
                Create Free Account
              </button>
            </p>
          ) : (
            <p>
              Pehle se account hai?{' '}
              <button onClick={() => setMode('login')} className="font-bold text-blue-600 underline">
                Log In Karein
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}