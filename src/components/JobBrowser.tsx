'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { checkAge } from '@/lib/age';
const CATS = ['GEN', 'EWS', 'OBC', 'SC', 'ST'], TYPES = ['Latest Jobs', 'Admit Card', 'Result', 'Answer Key'];
export default function JobBrowser({ jobs }: { jobs: any[] }) {
  const [q, setQ] = useState(''), [type, setType] = useState(''), [state, setState] = useState('');
  const [p, setP] = useState({ dob: '', cat: 'GEN', female: false }), [today, setToday] = useState('');
  useEffect(() => { try { const s = localStorage.getItem('sy_profile'); if (s) setP(JSON.parse(s)); } catch {} setToday(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })); }, []);
  useEffect(() => { try { localStorage.setItem('sy_profile', JSON.stringify(p)); } catch {} }, [p]);
  const states = useMemo(() => [...new Set(jobs.map(j => j.state))].sort(), [jobs]);
  const rows = useMemo(() => jobs.filter(j => (!type || j.job_type === type) && (!state || j.state === state || j.state === 'All India') &&
    (!q || (j.title + j.organization).toLowerCase().includes(q.toLowerCase())))
    .map(j => ({ j, a: p.dob ? checkAge(p.dob, p.cat, p.female, j.age_rules, j.age_as_on) : null })), [jobs, q, type, state, p]);
  const inp = 'rounded-lg border border-line bg-white px-3 py-2';
  return (
    <section className="mt-6">
      <div className="grid gap-3 rounded-xl bg-wash p-4 sm:grid-cols-4">
        <label className="text-sm">Date of birth<input type="date" value={p.dob} onChange={e => setP({ ...p, dob: e.target.value })} className={inp + ' mt-1 w-full'} /></label>
        <label className="text-sm">Category<select value={p.cat} onChange={e => setP({ ...p, cat: e.target.value })} className={inp + ' mt-1 w-full'}>{CATS.map(c => <option key={c}>{c}</option>)}</select></label>
        <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={p.female} onChange={e => setP({ ...p, female: e.target.checked })} />Female candidate</label>
        <label className="text-sm">Search<input value={q} onChange={e => setQ(e.target.value)} placeholder="SSC, UP Police..." className={inp + ' mt-1 w-full'} /></label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <select aria-label="Type" value={type} onChange={e => setType(e.target.value)} className={inp}><option value="">Sab type</option>{TYPES.map(t => <option key={t}>{t}</option>)}</select>
        <select aria-label="State" value={state} onChange={e => setState(e.target.value)} className={inp}><option value="">Sab state</option>{states.map(s => <option key={s}>{s}</option>)}</select>
        <span className="self-center text-ink/70">{rows.length} results</span>
      </div>
      {rows.length === 0 && <p className="mt-8 text-ink/70">Is filter par koi bharti nahi mili. Search ya state hata kar dekhein.</p>}
      <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
        {rows.map(({ j, a }) => {
          const closed = j.last_date && today && j.last_date < today;
          return (<li key={j.slug}><Link href={`/jobs/${j.slug}`} className="block p-4 hover:bg-wash">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold">{j.organization}</span><span className="text-ink/60">{j.state}</span><span className="rounded bg-wash px-2 py-0.5">{j.job_type}</span>
              {closed && <span className="rounded bg-bad/10 px-2 py-0.5 text-bad">Closed</span>}
              {a?.state === 'yes' && !closed && <span className="rounded bg-go/10 px-2 py-0.5 font-semibold text-go">Age eligible</span>}
              {a?.state === 'no' && <span className="rounded bg-bad/10 px-2 py-0.5 text-bad">Age match nahi</span>}
            </div>
            <h2 className="mt-1 text-lg font-semibold">{j.title}</h2>
            <p className="text-sm text-ink/70">{[j.min_qualification, j.total_posts ? `${j.total_posts} posts` : null, j.last_date ? `Last date ${j.last_date}` : null].filter(Boolean).join('  |  ')}</p>
          </Link></li>);
        })}
      </ul>
    </section>
  );
}
