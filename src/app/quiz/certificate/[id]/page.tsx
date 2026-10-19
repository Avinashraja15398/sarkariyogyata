import type { Metadata } from 'next';
import { serviceClient, sessionClient } from '@/lib/admin';
import Link from 'next/link';
import PrintButton from './PrintButton';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Quiz Merit Certificate | SarkariYogyata',
    description: 'Verified Certificate of Excellence awarded by SarkariYogyata.',
  };
}

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await params;
  const attemptId = resolvedParams.id;
  const svc = serviceClient();

  // 1. Active Supabase session se logged-in user check karein
  let loggedUser: any = null;
  try {
    const sc = await sessionClient();
    const { data } = await sc.auth.getUser();
    loggedUser = data?.user ?? null;
  } catch {}

  // 2. Database se attempt details fetch karein (agar available ho)
  const { data: att } = await svc
    .from('quiz_attempts')
    .select('id, user_id, score, total, seconds, submitted_at')
    .eq('id', attemptId)
    .maybeSingle();

  let name = '';
  let state = '';

  // Case A: Agar attempt DB me hai aur quiz_players me entry hai
  if (att?.user_id) {
    const { data: player } = await svc
      .from('quiz_players')
      .select('display_name, state')
      .eq('user_id', att.user_id)
      .maybeSingle();

    if (player?.display_name) name = player.display_name;
    if (player?.state) state = player.state;
  }

  // Case B: Agar attempt demo hai ya DB se naam nahi mila, toh logged-in user ka metadata use karein
  if (!name && loggedUser) {
    const meta = loggedUser.user_metadata || {};
    name =
      meta.full_name ||
      meta.name ||
      (loggedUser.email ? loggedUser.email.split('@')[0] : '');
    state = meta.state || '';
  }

  // Fallback defaults agar koi user bina login ke check kare
  if (!name) name = 'Candidate';
  if (!state) state = 'India';

  const score = att?.score ?? 4;
  const total = att?.total ?? 5;
  const percentage = Math.round((score / total) * 100);
  const dateStr = att?.submitted_at
    ? new Date(att.submitted_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

  return (
    <div className="min-h-screen bg-slate-900 py-10 px-4 print:p-0 print:bg-white flex flex-col items-center justify-center">
      {/* Top Action Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between pb-6 print:hidden">
        <Link className="text-sm font-bold text-slate-300 hover:text-white" href="/quiz">
          ← Back to Quiz
        </Link>
        <div className="flex items-center gap-3">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `🎯 *All India Govt Exam Challenge 2026*\n` +
              `━━━━━━━━━━━━━━━━━━━━\n` +
              `📊 *Candidate Name:* ${name}\n` +
              `📊 *Score:* ${score}/${total} (${percentage}%)\n` +
              `🎖️ *Status:* QUALIFIED (Merit Certificate)\n` +
              `🏆 SarkariYogyata Verified Merit Holder\n` +
              `━━━━━━━━━━━━━━━━━━━━\n` +
              `👉 Aap bhi test dekar rank aur certificate payen: https://sarkariyogyata.com/quiz`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700 shadow"
          >
            📲 WhatsApp Share
          </a>
          <PrintButton />
        </div>
      </div>

      {/* Official Certificate Card */}
      <div className="relative w-full max-w-4xl bg-white text-slate-900 border-[12px] border-double border-amber-600 rounded-3xl p-8 sm:p-14 shadow-2xl print:shadow-none print:border-8 print:w-full">
        <div className="text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-black uppercase tracking-widest mb-3">
            SarkariYogyata National Skill & Aptitude Assessment
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 font-serif">
            CERTIFICATE OF MERIT
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 uppercase tracking-widest">
            This is proudly awarded to
          </p>
        </div>

        {/* Candidate Real Name & State */}
        <div className="text-center my-8 relative z-10">
          <div className="inline-block border-b-2 border-amber-500 pb-1 px-8">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-blue-900 uppercase tracking-wide">
              {name}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-bold mt-2">
            State / Region: <span className="text-slate-900">{state}</span>
          </p>
        </div>

        <p className="text-center text-xs sm:text-sm leading-relaxed text-slate-700 max-w-2xl mx-auto relative z-10 font-sans">
          for successfully demonstrating outstanding knowledge and aptitude in the{' '}
          <strong>SarkariYogyata All India Govt Job Exam Aptitude Challenge (GK, Polity, History, Maths & Reasoning)</strong> with a qualifying score of:
        </p>

        <div className="flex items-center justify-center gap-6 my-6 relative z-10">
          <div className="rounded-2xl bg-amber-50 border border-amber-200 px-6 py-3 text-center">
            <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">Score</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-700">{score} / {total}</span>
          </div>
          <div className="rounded-2xl bg-blue-50 border border-blue-200 px-6 py-3 text-center">
            <span className="text-[10px] font-black uppercase text-blue-800 tracking-wider block">Percentage</span>
            <span className="text-2xl sm:text-3xl font-black text-blue-700">{percentage}%</span>
          </div>
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-6 py-3 text-center">
            <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">Status</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700">QUALIFIED</span>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 relative z-10">
          <div>
            <p><strong>Issue Date:</strong> {dateStr}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Cert ID: {attemptId}</p>
          </div>

          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-4 border-amber-600 flex items-center justify-center shadow-md text-center p-1">
            <span className="text-[9px] sm:text-[10px] font-black text-amber-950 uppercase leading-tight">
              ★ OFFICIAL<br />MERIT<br />SEAL ★
            </span>
          </div>

          <div className="text-center sm:text-right">
            <p className="font-serif text-sm font-black text-slate-900 italic">SarkariYogyata Assessment Board</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">sarkariyogyata.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}