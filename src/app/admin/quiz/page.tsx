'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminQuizPage() {
  const [status, setStatus] = useState<'draft' | 'approved' | 'rejected'>('draft');
  const [questions, setQuestions] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => {
    setLoading(true);
    fetch(`/api/admin/quiz?status=${status}`)
      .then((r) => r.json())
      .then((d) => {
        setQuestions(d.questions || []);
        setCounts(d.counts || {});
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [status]);

  const updateStatus = async (ids: string[], newStatus: string) => {
    setBusy(true);
    await fetch('/api/admin/quiz', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids, status: newStatus }),
    });
    setBusy(false);
    load();
  };

  const generateAI = async () => {
    setBusy(true);
    setMsg('AI Questions generate ho rahe hain...');
    const res = await fetch('/api/admin/quiz', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'generate', count: 20 }),
    });
    const d = await res.json();
    setBusy(false);
    setMsg(d.success ? `✅ ${d.inserted} naye sawal generate hue!` : `❌ Error: ${d.error}`);
    load();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Quiz Mission Control</h1>
            <p className="text-xs text-slate-500 mt-1">Review questions, generate with AI & verify answer keys.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={generateAI}
              disabled={busy}
              className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-black text-white hover:bg-purple-700 shadow disabled:opacity-50"
            >
              ✨ Generate 20 with AI
            </button>
            <Link href="/admin" className="text-xs font-bold text-slate-600 hover:text-slate-900">
              ← Admin Main
            </Link>
          </div>
        </div>

        {msg && <p className="mt-4 rounded-xl bg-blue-50 p-3 text-xs font-bold text-blue-700">{msg}</p>}

        {/* Tab Filters */}
        <div className="mt-6 flex gap-2">
          {(['draft', 'approved', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                status === s ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {s} ({counts[s] || 0})
            </button>
          ))}
        </div>

        {/* Questions List */}
        <div className="mt-6 space-y-4">
          {loading && <p className="text-xs text-slate-400">Loading...</p>}
          {!loading && questions.length === 0 && (
            <p className="rounded-2xl bg-white p-8 text-center text-xs text-slate-500 border border-slate-200">
              Koi question nahi mila.
            </p>
          )}
          {!loading &&
            questions.map((q) => (
              <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                    {q.subject} · {q.difficulty}
                  </span>
                  <div className="flex gap-2">
                    {status !== 'approved' && (
                      <button
                        onClick={() => updateStatus([q.id], 'approved')}
                        disabled={busy}
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
                      >
                        Approve ✓
                      </button>
                    )}
                    {status !== 'rejected' && (
                      <button
                        onClick={() => updateStatus([q.id], 'rejected')}
                        disabled={busy}
                        className="rounded-lg bg-red-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-red-700"
                      >
                        Reject ✗
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900">{q.question}</h3>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt: string, i: number) => (
                    <div
                      key={i}
                      className={`p-2 rounded-xl border ${
                        i === q.correct
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-bold'
                          : 'border-slate-100 bg-slate-50 text-slate-700'
                      }`}
                    >
                      {'ABCD'[i]}. {opt} {i === q.correct ? ' (Correct Answer)' : ''}
                    </div>
                  ))}
                </div>
                {q.explanation && (
                  <p className="mt-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    💡 <strong>Explanation:</strong> {q.explanation}
                  </p>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}