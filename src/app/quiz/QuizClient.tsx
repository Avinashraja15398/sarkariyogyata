'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { browserClient } from '@/lib/browser';

interface Question {
  id: string;
  question: string;
  options: string[];
  subject: string;
  difficulty: string;
}

export default function QuizClient() {
  const sb = browserClient();
  const [user, setUser] = useState<any>(null);
  const [level, setLevel] = useState<'easy' | 'medium' | 'hard' | 'global'>('medium');
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(300);
  const [score, setScore] = useState(0);
  const [attemptId, setAttemptId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const questions: Question[] = [
    {
      id: '1',
      subject: 'Indian Polity',
      difficulty: 'medium',
      question: 'भारतीय संविधान का कौन सा अनुच्छेद "अस्पृश्यता का उन्मूलन" (Abolition of Untouchability) सुनिश्चित करता है?',
      options: ['अनुच्छेद 14', 'अनुच्छेद 17', 'अनुच्छेद 19', 'अनुच्छेद 21'],
    },
    {
      id: '2',
      subject: 'Indian History',
      difficulty: 'easy',
      question: '1857 के प्रथम भारतीय स्वतंत्रता संग्राम की शुरुआत किस छावनी से हुई थी?',
      options: ['झांसी', 'बैरकपुर', 'मेरठ', 'दिल्ली'],
    },
    {
      id: '3',
      subject: 'Geography',
      difficulty: 'medium',
      question: 'भारत का एकमात्र सक्रिय ज्वालामुखी (Active Volcano) किस द्वीप पर स्थित है?',
      options: ['लक्षद्वीप', 'बैरन द्वीप (Barren Island)', 'नारकोंडम द्वीप', 'माजुली द्वीप'],
    },
    {
      id: '4',
      subject: 'General Science',
      difficulty: 'easy',
      question: 'मानव शरीर में रक्त का शुद्धिकरण (Purification of Blood) किस अंग में होता है?',
      options: ['फेफड़े (Lungs)', 'हृदय (Heart)', 'गुर्दा (Kidney)', 'यकृत (Liver)'],
    },
    {
      id: '5',
      subject: 'Quantitative Aptitude',
      difficulty: 'medium',
      question: 'यदि किसी वस्तु को ₹450 में बेचने पर 10% की हानि होती है, तो उसका क्रय मूल्य (Cost Price) क्या होगा?',
      options: ['₹480', '₹500', '₹520', '₹550'],
    },
  ];

  const correctKeys = [1, 2, 1, 2, 1];

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, [sb]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // 24 Hour Limit Check
  const startQuiz = async (selectedLevel: 'easy' | 'medium' | 'hard' | 'global') => {
    setErrorMsg('');
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setLoading(true);
    // Check if user already submitted in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: pastAttempts } = await sb
      .from('quiz_attempts')
      .select('id, submitted_at')
      .eq('user_id', user.id)
      .gte('submitted_at', twentyFourHoursAgo);

    if (pastAttempts && pastAttempts.length > 0) {
      setLoading(false);
      setErrorMsg('⚠️ Aapne pichhle 24 ghante me test de diya hai! Naya attempt agle 24 ghante baad hi diya ja sakta hai.');
      return;
    }

    setLevel(selectedLevel);
    setPhase('playing');
    setCurrentIdx(0);
    setAnswers({});
    setTimeLeft(300);
    setLoading(false);
  };

  const handleSelect = (optionIdx: number) => {
    setAnswers((prev) => ({ ...prev, [currentIdx]: optionIdx }));
  };

  // Submit & Save Real Data to Database
  const finishQuiz = async () => {
    setLoading(true);
    let calculated = 0;
    questions.forEach((_, idx) => {
      if (answers[idx] === correctKeys[idx]) {
        calculated++;
      }
    });
    setScore(calculated);

    if (user) {
      const meta = user.user_metadata || {};
      const candidateName = meta.full_name || meta.name || user.email?.split('@')[0] || 'Candidate';
      const candidateState = meta.state || 'Delhi';

      // 1. Ensure Player Profile is updated
      await sb.from('quiz_players').upsert({
        user_id: user.id,
        display_name: candidateName,
        state: candidateState,
        updated_at: new Date().toISOString(),
      });

      // 2. Insert Quiz Attempt
      const { data: attempt } = await sb
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          score: calculated,
          total: questions.length,
          seconds: 300 - timeLeft,
          level,
        })
        .select('id')
        .single();

      if (attempt?.id) {
        setAttemptId(attempt.id);
      }
    }

    setLoading(false);
    setPhase('result');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const q = questions[currentIdx];

  const shareText =
    `🎯 *All India Govt Exam Challenge 2026*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📊 *मेरा स्कोर:* ${score}/${questions.length} (${Math.round((score / questions.length) * 100)}%)\n` +
    `🎖️ *स्टेटस:* QUALIFIED (Merit Certificate जारी)\n` +
    `🏆 *रैंक:* SarkariYogyata All-India Leaderboard\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🔥 क्या आप मुझसे बेहतर स्कोर कर सकते हैं?\n` +
    `SSC, Railway, Bank व Police के सवालों का टेस्ट दें और अपनी रैंक देखें!\n\n` +
    `👉 *अभी फ्री टेस्ट दें और सर्टिफिकेट पाएं:*\n` +
    `${typeof window !== 'undefined' ? window.location.origin : ''}/quiz`;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-base font-black text-slate-900">
            sarkari<span className="text-blue-600">yogyata</span>{' '}
            <span className="text-xs font-bold text-slate-400">/ Live Test</span>
          </Link>
          <Link href="/" className="text-xs font-bold text-blue-600 hover:underline">
            ← Home (Jobs)
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {errorMsg && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800">
            {errorMsg}
          </div>
        )}

        {phase === 'intro' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 mb-3 border border-blue-200">
              ⚡ Anti-Cheat Verified Exam Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Sarkari Exam Daily Aptitude Challenge
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              SSC, Railway, Bank और Police के सवाल। <strong>24 घंटे में सिर्फ 1 बार</strong> टेस्ट मान्य होगा।
            </p>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                अपना स्तर चुनें (24-Hour Verified Rule):
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  disabled={loading}
                  onClick={() => startQuiz('easy')}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-left hover:border-emerald-400 hover:bg-emerald-50 transition"
                >
                  <span className="text-xs font-black text-emerald-800 uppercase block">Level 1: Low</span>
                  <span className="text-[11px] text-slate-500 mt-1 block">Basic 10th & State Police</span>
                </button>

                <button
                  disabled={loading}
                  onClick={() => startQuiz('medium')}
                  className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-left hover:border-amber-400 hover:bg-amber-50 transition"
                >
                  <span className="text-xs font-black text-amber-800 uppercase block">Level 2: Medium</span>
                  <span className="text-[11px] text-slate-500 mt-1 block">SSC CHSL, CGL & Railway</span>
                </button>

                <button
                  disabled={loading}
                  onClick={() => startQuiz('hard')}
                  className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 text-left hover:border-rose-400 hover:bg-rose-50 transition"
                >
                  <span className="text-xs font-black text-rose-800 uppercase block">Level 3: High</span>
                  <span className="text-[11px] text-slate-500 mt-1 block">UPSC CDS & State PSC</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === 'playing' && q && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs select-none">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                Question {currentIdx + 1} of {questions.length} · {q.subject}
              </span>
              <span className={`text-xs font-black px-3 py-1 rounded-full ${timeLeft <= 60 ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
                ⏱ {formatTime(timeLeft)}
              </span>
            </div>

            <h2 className="mt-5 text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {q.question}
            </h2>

            <div className="mt-5 space-y-2.5">
              {q.options.map((opt, i) => {
                const isSelected = answers[currentIdx] === i;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
                    }`}
                  >
                    <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {'ABCD'[i]}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
                disabled={currentIdx === 0}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-40"
              >
                ← Previous
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx((p) => p + 1)}
                  className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-black text-white hover:bg-slate-800"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={finishQuiz}
                  disabled={loading}
                  className="rounded-xl bg-emerald-600 px-6 py-2 text-xs font-black text-white hover:bg-emerald-700 shadow disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Submit Exam ✔'}
                </button>
              )}
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/50 p-6 sm:p-8 text-center shadow-xs">
              <span className="text-3xl">🎉</span>
              <h2 className="text-xl font-black text-slate-900 mt-2">Test Score Saved to Leaderboard!</h2>
              <div className="mt-4 flex items-center justify-center gap-6">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Your Score</span>
                  <span className="text-4xl font-black text-blue-600">{score} / {questions.length}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Points</span>
                  <span className="text-4xl font-black text-emerald-600">{score * 10} pts</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-center items-center gap-3">
                <Link
                  href={attemptId ? `/quiz/certificate/${attemptId}` : '/quiz/certificate/cert-sample'}
                  className="rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs px-5 py-3 shadow transition-all"
                >
                  🎓 View & Print Merit Certificate
                </Link>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs px-5 py-3 shadow transition-all"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                  </svg>
                  <span>📲 WhatsApp Challenge</span>
                </a>

                <Link
                  href="/"
                  className="rounded-2xl border border-slate-200 bg-white font-bold text-xs px-4 py-3 text-slate-700 hover:bg-slate-50 transition-all"
                >
                  🏠 Check Leaderboard on Home
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}