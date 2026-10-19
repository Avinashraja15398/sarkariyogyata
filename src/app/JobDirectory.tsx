'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { jobKind, dedupeJobs } from '@/lib/jobKind';
import { browserClient } from '@/lib/browser';

export interface JobItem {
  id: string;
  slug: string;
  title: string;
  organization: string;
  job_type?: string | null;
  total_posts: number | null;
  last_date: string | null;
  min_age: number | null;
  max_age: number | null;
  age_limit?: string | null;
  min_qualification?: string | null;
  full_description?: string | null;
  application_fee?: string | null;
  admit_card_url?: string | null;
  result_url?: string | null;
}

export function BrandLogo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const isSm = size === 'sm';
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        className={`relative flex items-center justify-center rounded-full bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 text-white shadow-md ring-2 ring-blue-100 ${
          isSm ? 'h-8 w-8' : 'h-10 w-10'
        }`}
      >
        <svg
          viewBox="0 0 36 36"
          fill="none"
          className={isSm ? 'h-5 w-5' : 'h-6 w-6'}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18 3L6 8.2V17.3C6 24.8 11.1 31.6 18 33.5C24.9 31.6 30 24.8 30 17.3V8.2L18 3Z"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13 19.5L16.5 23L24 14.5"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="18" cy="9.5" r="1.5" fill="#FACC15" />
        </svg>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span
            className={`font-black tracking-tight text-slate-900 leading-none ${
              isSm ? 'text-base' : 'text-xl'
            }`}
          >
            sarkari<span className="text-blue-600">yogyata</span>
          </span>
          <span className="rounded bg-emerald-50 px-1 py-0.5 text-[9px] font-extrabold text-emerald-700 border border-emerald-200 leading-none">
            ✓
          </span>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 tracking-wide leading-none mt-1">
          INDIA&apos;S SMART GOVT PORTAL
        </span>
      </div>
    </div>
  );
}

/* ================= RIGHT SIDEBAR COMPONENT (REAL SUPABASE LEADERBOARD) ================= */
function HomeQuizSidebar() {
  const [period, setPeriod] = useState<'day' | 'week' | 'all'>('day');
  const [scope, setScope] = useState<'india' | 'state'>('india');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userState, setUserState] = useState('Delhi');

  useEffect(() => {
    const sb = browserClient();
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.user_metadata?.state) {
        setUserState(session.user.user_metadata.state);
      }
    });
  }, []);

  useEffect(() => {
    let dead = false;
    setLoading(true);
    const targetState = scope === 'state' ? `&state=${encodeURIComponent(userState)}` : '';
    fetch(`/api/quiz/leaderboard?period=${period}&scope=${scope}${targetState}`)
      .then((r) => r.json())
      .then((d) => {
        if (!dead) {
          setRows(d.rows || []);
        }
      })
      .catch(() => {
        if (!dead) setRows([]);
      })
      .finally(() => {
        if (!dead) setLoading(false);
      });
    return () => {
      dead = true;
    };
  }, [period, scope, userState]);

  const medal = (r: number) => (r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `#${r}`);

  return (
    <aside className="space-y-5">
      <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-2xs">
            <span>🔥</span> Live Quiz
          </span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-800 border border-amber-200">
            24h Rule Active
          </span>
        </div>

        <h3 className="mt-3 text-sm font-black text-slate-900 leading-snug">
          Daily Govt Exam Aptitude & GK Challenge
        </h3>
        <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
          SSC, Railway, Bank, Police — 10 मिनट। 24 घंटे में सिर्फ 1 बार।
        </p>

        <div className="mt-3 flex items-center justify-between rounded-xl bg-white/80 border border-slate-200/80 p-2 text-[10px] font-bold text-slate-600">
          <span className="flex items-center gap-1 text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Low
          </span>
          <span className="flex items-center gap-1 text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span> Medium
          </span>
          <span className="flex items-center gap-1 text-rose-700">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span> High
          </span>
        </div>

        <Link
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-2.5 text-xs font-black text-white shadow-xs hover:bg-blue-700 transition-all"
          href="/quiz"
        >
          <span>🎯 Start Quiz & Check Rank</span>
          <span>→</span>
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-base">🏆</span>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-900">
                Top Achievers
              </h3>
              <span className="text-[10px] text-slate-400">All India Merit List</span>
            </div>
          </div>
          <Link className="text-[10px] font-bold text-blue-600 hover:underline" href="/quiz">
            View All →
          </Link>
        </div>

        <div className="mt-3 flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setScope('india')}
            className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
              scope === 'india' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
            }`}
          >
            🇮🇳 India
          </button>
          <button
            type="button"
            onClick={() => setScope('state')}
            className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
              scope === 'state' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
            }`}
          >
            📍 {userState}
          </button>
        </div>

        <div className="mt-2.5 flex items-center justify-between px-1 text-[10px] font-bold text-slate-500">
          <button
            type="button"
            onClick={() => setPeriod('day')}
            className={`transition ${period === 'day' ? 'text-blue-600 underline font-black' : 'hover:text-slate-800'}`}
          >
            आज
          </button>
          <button
            type="button"
            onClick={() => setPeriod('week')}
            className={`transition ${period === 'week' ? 'text-blue-600 underline font-black' : 'hover:text-slate-800'}`}
          >
            इस हफ़्ते
          </button>
          <button
            type="button"
            onClick={() => setPeriod('all')}
            className={`transition ${period === 'all' ? 'text-blue-600 underline font-black' : 'hover:text-slate-800'}`}
          >
            All-Time
          </button>
        </div>

        <div className="mt-3 divide-y divide-slate-100">
          {loading ? (
            <p className="py-6 text-center text-xs text-slate-400">Loading live ranks…</p>
          ) : rows.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-xs font-bold text-slate-700">अभी कोई रैंक नहीं है 🚀</p>
              <p className="text-[10px] text-slate-400 mt-0.5">क्विज़ पूरा करें और आज के #1 टॉपर बनें!</p>
            </div>
          ) : (
            rows.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2.5 gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 text-center text-xs font-black text-slate-600 shrink-0">
                    {medal(item.rank || idx + 1)}
                  </span>
                  <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 font-black text-[11px] flex items-center justify-center shrink-0 border border-blue-200">
                    {(item.name || 'P').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900 leading-tight">
                      {item.name}
                    </p>
                    <p className="truncate text-[10px] text-slate-400">
                      {item.state || 'India'}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-blue-600">
                    {item.points} pts
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50/60 to-yellow-50/30 p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white text-base shadow-xs">
            🎓
          </span>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wide text-amber-950">
              Verified Merit Certificate
            </h4>
            <p className="text-[11px] text-amber-900/80 mt-1 leading-snug">
              क्विज़ पास करें और तुरंत अपना प्रिंटेबल <strong>SarkariYogyata Certificate</strong> पाएं।
            </p>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[10px] font-bold text-amber-800">
          <span>📲 WhatsApp पर शेयर करें</span>
          <Link className="font-black text-amber-900 underline hover:text-amber-700" href="/quiz">
            Earn Yours →
          </Link>
        </div>
      </div>
    </aside>
  );
}

/* ================= MAIN JOB DIRECTORY COMPONENT ================= */
export default function JobDirectory({ jobs, today }: { jobs: JobItem[]; today: string }) {
  const [search, setSearch] = useState('');
  const [qualFilter, setQualFilter] = useState<string>('ALL');
  const [age, setAge] = useState<string>('');
  const [category, setCategory] = useState<string>('ALL');
  const [gender, setGender] = useState<string>('ALL');
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'JOBS' | 'ADMIT' | 'RESULT'>('ALL');

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const sb = browserClient();
    sb.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const sb = browserClient();
    await sb.auth.signOut();
    setUser(null);
    window.location.reload();
  };

  const resetAllFilters = () => {
    setSearch('');
    setQualFilter('ALL');
    setAge('');
    setCategory('ALL');
    setGender('ALL');
    setFilterActiveOnly(false);
    setActiveTab('ALL');
  };

  const hasActiveFilters =
    Boolean(search) ||
    qualFilter !== 'ALL' ||
    Boolean(age) ||
    category !== 'ALL' ||
    gender !== 'ALL' ||
    filterActiveOnly ||
    activeTab !== 'ALL';

  const safeJobs = useMemo(() => (Array.isArray(jobs) ? jobs : []), [jobs]);
  const uniqueJobs = useMemo(() => dedupeJobs(safeJobs), [safeJobs]);

  const filteredJobs = useMemo(() => {
    return uniqueJobs.filter((job) => {
      const fullText = `${job.title} ${job.organization} ${job.min_qualification || ''} ${
        job.full_description || ''
      }`.toLowerCase();

      if (search.trim()) {
        const q = search.toLowerCase();
        if (!fullText.includes(q)) return false;
      }

      if (qualFilter !== 'ALL') {
        if (
          qualFilter === '10TH' &&
          !fullText.includes('10th') &&
          !fullText.includes('matric') &&
          !fullText.includes('high school')
        )
          return false;
        if (
          qualFilter === '12TH' &&
          !fullText.includes('12th') &&
          !fullText.includes('10+2') &&
          !fullText.includes('intermediate')
        )
          return false;
        if (
          qualFilter === 'GRAD' &&
          !fullText.includes('degree') &&
          !fullText.includes('graduate') &&
          !fullText.includes('bachelor') &&
          !fullText.includes('cgl') &&
          !fullText.includes('ias')
        )
          return false;
      }

      const isClosed = job.last_date ? job.last_date < today : false;
      if (filterActiveOnly && isClosed) return false;

      if (gender === 'FEMALE') {
        if (
          fullText.includes('male only') ||
          fullText.includes('purush ummidwar') ||
          fullText.includes('unmarried male')
        )
          return false;
      }

      if (age && !isNaN(Number(age))) {
        const userAge = Number(age);
        let extraYears = 0;
        if (category === 'OBC') extraYears = 3;
        else if (category === 'SC' || category === 'ST') extraYears = 5;

        const effectiveMin = job.min_age ?? 16;
        const effectiveMax = (job.max_age ?? 35) + extraYears;

        if (userAge < effectiveMin || userAge > effectiveMax) return false;
      }

      return true;
    });
  }, [uniqueJobs, search, qualFilter, age, category, gender, filterActiveOnly, today]);

  const latestJobs = useMemo(() => filteredJobs.filter((j) => jobKind(j) === 'job'), [filteredJobs]);
  const admitCards = useMemo(() => filteredJobs.filter((j) => jobKind(j) === 'admit'), [filteredJobs]);
  const results = useMemo(() => filteredJobs.filter((j) => jobKind(j) === 'result'), [filteredJobs]);

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split('@')[0] : 'Candidate');

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* ================= 1. ENTERPRISE HEADER ================= */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-2xs">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 gap-4">
          <div className="flex items-center gap-7">
            <Link href="/" onClick={resetAllFilters}>
              <BrandLogo />
            </Link>

            <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`py-1 transition-colors border-b-2 ${
                  activeTab === 'ALL'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                All Updates
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('JOBS')}
                className={`relative py-1 transition-colors border-b-2 ${
                  activeTab === 'JOBS'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                Latest Jobs
                <span className="ml-1.5 rounded-full bg-rose-500 px-1.5 py-0.2 text-[9px] font-extrabold text-white">
                  {latestJobs.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ADMIT')}
                className={`py-1 transition-colors border-b-2 ${
                  activeTab === 'ADMIT'
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                Admit Card
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('RESULT')}
                className={`py-1 transition-colors border-b-2 ${
                  activeTab === 'RESULT'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                Results
              </button>
            </nav>
          </div>

          <div className="flex flex-1 max-w-md items-center rounded-full border border-slate-200 bg-slate-50 pl-4 pr-1.5 py-1 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 transition-all shadow-2xs">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs by department, 10th/12th, Army, SSC..."
              className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mr-1.5 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
            <button
              type="button"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
              title="Search"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 10.5a7.5 7.5 0 0013.15 6.15z" />
              </svg>
            </button>
          </div>

          {/* Right Header Area: Live Quiz + Real User Profile */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition shadow-2xs"
              href="/quiz"
            >
              <span>🧠 Daily Quiz</span>
              <span className="text-[9px] bg-rose-500 text-white px-1.5 py-0.5 rounded-full uppercase font-black">
                Live
              </span>
            </Link>

            {user ? (
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-2xs">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white">
                  {userName.charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:inline-block text-xs font-bold text-slate-800 max-w-[120px] truncate">
                  {userName}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="ml-1 text-[11px] font-bold text-slate-400 hover:text-rose-600 transition"
                  title="Logout"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-2xs"
                href="/login"
              >
                Sign In 👤
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ================= MAIN WORKSPACE ================= */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pt-6 space-y-6">
        <section className="rounded-3xl border border-blue-100 bg-gradient-to-r from-white via-blue-50/30 to-white p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-slate-200/70">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-black shadow-xs">
                360°
              </span>
              <div>
                <h2 className="text-sm font-black text-slate-900 leading-none">
                  स्मार्ट योग्यता (Eligibility) फ़िल्टर
                </h2>
                <span className="text-[11px] text-slate-500">
                  अपनी सटीक उम्र (जैसे 16.5 या 21) और वर्ग डालें — केवल आपके योग्य फॉर्म दिखेंगे
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: '10TH', label: '10th Pass' },
                  { id: '12TH', label: '12th / PCM' },
                  { id: 'GRAD', label: 'Graduate' },
                ].map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setQualFilter(q.id)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                      qualFilter === q.id
                        ? 'bg-white text-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors"
                >
                  Reset All ✕
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-2xs focus-within:border-blue-500">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                आपकी उम्र (Years)
              </label>
              <input
                type="number"
                step="0.5"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="उदा. 16.5, 19, 24"
                className="mt-0.5 w-full bg-transparent text-xs font-bold text-slate-900 placeholder-slate-300 focus:outline-none"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-2xs focus-within:border-blue-500">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                कैटेगरी (छूट सहित)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-0.5 w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="GEN">General / EWS</option>
                <option value="OBC">OBC (+3 वर्ष छूट)</option>
                <option value="SC">SC (+5 वर्ष छूट)</option>
                <option value="ST">ST (+5 वर्ष छूट)</option>
              </select>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-2xs focus-within:border-blue-500">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                लिंग (Gender)
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="mt-0.5 w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
              >
                <option value="ALL">All (Male & Female)</option>
                <option value="MALE">Male (पुरुष)</option>
                <option value="FEMALE">Female (महिला)</option>
              </select>
            </div>

            <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2 shadow-2xs cursor-pointer hover:bg-slate-50 select-none">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  स्टेटस
                </span>
                <span className="text-xs font-bold text-slate-800">केवल चालू फॉर्म</span>
              </div>
              <input
                type="checkbox"
                checked={filterActiveOnly}
                onChange={(e) => setFilterActiveOnly(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <div className="col-span-2 sm:col-span-4 lg:col-span-1 flex items-center justify-center rounded-xl bg-blue-600 px-3 py-2 text-white shadow-xs">
              <div className="text-center">
                <span className="block text-[10px] font-semibold text-blue-100 uppercase">
                  Matching Updates
                </span>
                <span className="text-sm font-black">{filteredJobs.length} Available</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 xl:col-span-9">
            <section
              className={`grid grid-cols-1 gap-5 ${
                activeTab === 'ALL'
                  ? 'md:grid-cols-2 xl:grid-cols-3'
                  : 'max-w-3xl mx-auto'
              }`}
            >
              {(activeTab === 'ALL' || activeTab === 'JOBS') && (
                <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs flex flex-col">
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-black text-sm border border-blue-100">
                        🏛️
                      </span>
                      <div>
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">
                          Latest Sarkari Jobs
                        </h2>
                        <span className="text-[11px] text-slate-400">ऑनलाइन फॉर्म और नई भर्तियां</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-extrabold text-blue-700 border border-blue-200">
                      {latestJobs.length}
                    </span>
                  </div>

                  <div className="mt-3 divide-y divide-slate-100 flex-1">
                    {latestJobs.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        इस फ़िल्टर में कोई नई भर्ती नहीं मिली।
                      </div>
                    ) : (
                      latestJobs.map((job) => {
                        const isClosed = job.last_date ? job.last_date < today : false;
                        return (
                          <Link
                            className="group block py-3.5 px-2.5 -mx-2 rounded-2xl transition-all hover:bg-slate-50/90"
                            href={`/jobs/${job.slug}`}
                            key={job.id}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold text-blue-600 truncate">
                                {job.organization}
                              </span>
                              {job.total_posts ? (
                                <span className="shrink-0 rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-extrabold text-white">
                                  {job.total_posts} Posts
                                </span>
                              ) : null}
                            </div>

                            <h3 className="mt-1 text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-blue-600 line-clamp-2 leading-snug transition-colors">
                              {job.title}
                            </h3>

                            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                              <div className="flex items-center gap-2 text-slate-500">
                                <span>
                                  अंतिम तिथि:{' '}
                                  <strong className="text-slate-700">{job.last_date || 'N/A'}</strong>
                                </span>
                                {job.min_age && job.max_age && (
                                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                    {job.min_age}-{job.max_age} Yrs
                                  </span>
                                )}
                              </div>

                              {isClosed ? (
                                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                                  Closed
                                </span>
                              ) : (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                                  ● Apply Now →
                                </span>
                              )}
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {(activeTab === 'ALL' || activeTab === 'ADMIT') && (
                <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs flex flex-col">
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 font-black text-sm border border-amber-100">
                        🎫
                      </span>
                      <div>
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">
                          Admit Card
                        </h2>
                        <span className="text-[11px] text-slate-400">हॉल टिकट और एग्जाम सिटी</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-extrabold text-amber-700 border border-amber-200">
                      {admitCards.length}
                    </span>
                  </div>

                  <div className="mt-3 divide-y divide-slate-100 flex-1">
                    {admitCards.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        अभी कोई नया एडमिट कार्ड उपलब्ध नहीं है।
                      </div>
                    ) : (
                      admitCards.map((job) => (
                        <Link
                          className="group block py-3.5 px-2.5 -mx-2 rounded-2xl transition-all hover:bg-amber-50/40"
                          href={`/jobs/${job.slug}`}
                          key={job.id}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-amber-700 truncate">
                              {job.organization}
                            </span>
                            <span className="shrink-0 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
                              Hall Ticket
                            </span>
                          </div>

                          <h3 className="mt-1 text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-amber-700 line-clamp-2 leading-snug transition-colors">
                            {job.title}
                          </h3>

                          <div className="mt-2.5 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">प्रवेश पत्र जारी</span>
                            <span className="font-extrabold text-amber-600 group-hover:underline">
                              Download Admit Card →
                            </span>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}

              {(activeTab === 'ALL' || activeTab === 'RESULT') && (
                <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs flex flex-col">
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 font-black text-sm border border-purple-100">
                        🎯
                      </span>
                      <div>
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">
                          Exam Results
                        </h2>
                        <span className="text-[11px] text-slate-400">मेरिट लिस्ट, कट-ऑफ व स्कोरकार्ड</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-extrabold text-purple-700 border border-purple-200">
                      {results.length}
                    </span>
                  </div>

                  <div className="mt-3 divide-y divide-slate-100 flex-1">
                    {results.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        अभी कोई नया परीक्षा परिणाम उपलब्ध नहीं है।
                      </div>
                    ) : (
                      results.map((job) => (
                        <Link
                          className="group block py-3.5 px-2.5 -mx-2 rounded-2xl transition-all hover:bg-purple-50/40"
                          href={`/jobs/${job.slug}`}
                          key={job.id}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-purple-700 truncate">
                              {job.organization}
                            </span>
                            <span className="shrink-0 rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-extrabold text-purple-800">
                              Merit Out
                            </span>
                          </div>

                          <h3 className="mt-1 text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-purple-700 line-clamp-2 leading-snug transition-colors">
                            {job.title}
                          </h3>

                          <div className="mt-2.5 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">चयन सूची और कट-ऑफ</span>
                            <span className="font-extrabold text-purple-600 group-hover:underline">
                              Check Result PDF →
                            </span>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-20">
            <HomeQuizSidebar />
          </div>
        </div>
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-white text-slate-600">
        <div className="mx-auto max-w-[1440px] px-4 py-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4 space-y-4">
              <BrandLogo />
              <p className="text-xs text-slate-500 leading-relaxed">
                अपनी योग्यता और उम्र के अनुसार 100% वेरिफ़ाइड सरकारी नौकरियां, एडमिट कार्ड और रिजल्ट सबसे तेज़ पाएं।
              </p>
              <div>
                <span className="block text-xs font-bold text-slate-900 mb-2.5">
                  Connect with us
                </span>
                <div className="flex items-center gap-2.5">
                  <a
                    href="https://www.instagram.com/sarkariyogta/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-pink-50 hover:text-pink-600 transition-colors font-bold text-xs"
                    title="Instagram @sarkariyogta"
                  >
                    IG
                  </a>
                  <a
                    href="https://t.me/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors font-bold text-xs"
                    title="Telegram"
                  >
                    TG
                  </a>
                  <a
                    href="https://whatsapp.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors font-bold text-xs"
                    title="WhatsApp"
                  >
                    WA
                  </a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:col-span-4 text-xs">
              <div className="space-y-2.5">
                <span className="font-bold text-slate-900 block">Portal Sections</span>
                <ul className="space-y-2 text-slate-500">
                  <li><button onClick={() => setActiveTab('JOBS')} className="hover:text-blue-600">Latest Jobs</button></li>
                  <li><button onClick={() => setActiveTab('ADMIT')} className="hover:text-blue-600">Admit Card</button></li>
                  <li><button onClick={() => setActiveTab('RESULT')} className="hover:text-blue-600">Exam Results</button></li>
                  <li><Link className="hover:text-blue-600" href="/quiz">Daily Quiz & Ranks</Link></li>
                  <li><button onClick={() => setQualFilter('10TH')} className="hover:text-blue-600">10th Pass Jobs</button></li>
                  <li><button onClick={() => setQualFilter('12TH')} className="hover:text-blue-600">12th Pass Jobs</button></li>
                </ul>
              </div>

              <div className="space-y-2.5">
                <span className="font-bold text-slate-900 block">Trust & Safety</span>
                <ul className="space-y-2 text-slate-500">
                  <li><span className="text-slate-400">100% Official Links</span></li>
                  <li><span className="text-slate-400">Zero Fake Notices</span></li>
                  <li><span className="text-slate-400">Privacy Policy</span></li>
                  <li><span className="text-slate-400">Terms of Service</span></li>
                </ul>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                <h3 className="text-sm font-black text-slate-900">
                  Get Instant Sarkari Alerts on the Go
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  नई भर्ती और रिजल्ट आते ही सीधे अपने मोबाइल पर अपडेट पाएं
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <a
                    href="https://www.instagram.com/sarkariyogta/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs"
                  >
                    <span>📸</span> @sarkariyogta
                  </a>
                  <a
                    href="https://t.me/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    <span>✈️</span> Join Telegram
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-400">
            <p>© 2026 SarkariYogyata.com • All trademarks and official notifications belong to their respective AVI departments.</p>
            <p className="font-semibold text-slate-500">Official Notification Hi Final Hai ✓</p>
          </div>
        </div>
      </footer>
    </div>
  );
}