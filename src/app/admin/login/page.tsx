'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { browserClient } from '@/lib/browser';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const r = useRouter();

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);

    try {
      const { error } = await browserClient().auth.signInWithPassword({
        email: email.trim(),
        password: pw,
      });

      if (error) {
        console.error('Supabase Login Error:', error);
        // Supabase ka asli error screen par dikhayega taaki pata chale issue kahan hai
        setErr(error.message);
      } else {
        r.push('/admin');
        r.refresh();
      }
    } catch (unexpectedErr: any) {
      setErr(unexpectedErr?.message || 'Login request fail ho gayi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto mt-24 max-w-sm px-4">
      <h1 className="text-2xl font-bold">Admin sign in</h1>
      <form onSubmit={go} className="mt-6 space-y-3">
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-line p-3"
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          className="w-full rounded-lg border border-line p-3"
        />
        {err && <p role="alert" className="text-sm text-bad">{err}</p>}
        <button
          disabled={loading}
          className="w-full rounded-lg bg-ink p-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}