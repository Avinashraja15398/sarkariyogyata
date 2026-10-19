'use client';
import { useState } from 'react';
import { browserClient } from '@/lib/browser';
import { useRouter } from 'next/navigation';
type R = { slug: string; action: string; changes: string[]; warnings: string[]; error?: string; saved?: boolean; status?: string };
const site = process.env.NEXT_PUBLIC_SITE_URL || '';
export default function ImportConsole({ role }: { role: string }) {
  const [txt, setTxt] = useState(''), [ver, setVer] = useState(false), [busy, setBusy] = useState(false);
  const [res, setRes] = useState<R[]>([]), [msg, setMsg] = useState(''), [posts, setPosts] = useState<string[]>([]);
  const router = useRouter();
  async function run(mode: 'check' | 'draft' | 'publish') {
    setBusy(true); setMsg(''); setRes([]); setPosts([]);
    try {
      const raw = JSON.parse(txt); const jobs = Array.isArray(raw) ? raw : [raw];
      const r = await fetch('/api/admin/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobs, mode, verified: ver }) });
      const j = await r.json();
      if (!r.ok) { setMsg([j.error, ...(j.issues ?? [])].join('\n')); return; }
      setRes(j.results);
      if (mode === 'publish') setPosts(jobs.filter((x: any) => j.results.find((y: R) => y.slug === x.slug && y.saved)).map((x: any) =>
        `🔔 ${x.title}${x.job_type && x.job_type !== 'Latest Jobs' ? ` (${x.job_type})` : ''}\n🏢 ${x.organization}\n${x.total_posts ? `📌 Posts: ${x.total_posts}\n` : ''}${x.last_date ? `⏳ Last date: ${x.last_date}\n` : ''}\nAge check, syllabus aur apply link 👇\n${site}/jobs/${x.slug}`));
      setMsg(mode === 'check' ? 'Check complete. Kuch save nahi hua.' : 'Done.');
    } catch (e: any) { setMsg(e instanceof SyntaxError ? 'JSON valid nahi hai. Poora JSON copy karein.' : String(e.message)); }
    finally { setBusy(false); }
  }
  async function out() { await browserClient().auth.signOut(); router.push('/admin/login'); }
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Job import</h1><button onClick={out} className="text-sm underline">Sign out ({role})</button></div>
      <textarea value={txt} onChange={e => setTxt(e.target.value)} rows={14} spellCheck={false} placeholder="JSON paste karein (1 job ya array)" className="w-full rounded-lg border border-line p-3 font-mono text-xs" />
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={ver} onChange={e => setVer(e.target.checked)} className="mt-1" />Maine dates, posts, fee aur links official notification se match kiye hain.</label>
      <div className="flex flex-wrap gap-2">
        <button disabled={busy || !txt.trim()} onClick={() => run('check')} className="rounded-lg border border-ink px-4 py-2 font-semibold disabled:opacity-40">Check only</button>
        <button disabled={busy || !txt.trim()} onClick={() => run('draft')} className="rounded-lg border border-ink px-4 py-2 font-semibold disabled:opacity-40">Save as draft</button>
        <button disabled={busy || !txt.trim() || !ver} onClick={() => run('publish')} className="rounded-lg bg-go px-4 py-2 font-semibold text-white disabled:opacity-40">Publish</button>
      </div>
      {msg && <pre role="status" className="whitespace-pre-wrap rounded-lg bg-wash p-3 text-sm">{msg}</pre>}
      {res.map(r => (
        <div key={r.slug} className="rounded-lg border border-line p-3 text-sm">
          <p className="font-semibold">{r.slug} <span className="font-normal">- {r.action}{r.status ? `, ${r.status}` : ''}</span></p>
          {r.changes.length > 0 && <p>Fields: {r.changes.join(', ')}</p>}
          {r.warnings.map(w => <p key={w} className="text-warn">⚠ {w}</p>)}
          {r.error && <p className="text-bad">{r.error}</p>}
        </div>))}
      {posts.map((p, i) => (<div key={i} className="rounded-lg border border-line p-3"><pre className="whitespace-pre-wrap text-sm">{p}</pre><button onClick={() => navigator.clipboard.writeText(p)} className="mt-2 text-sm underline">WhatsApp / Telegram ke liye copy</button></div>))}
    </div>
  );
}
