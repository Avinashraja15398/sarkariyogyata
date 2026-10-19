'use client';
import { useState } from 'react';

export function QuizLeaderboardSidebar() {
  const [tab, setTab] = useState<'daily' | 'weekly' | 'alltime'>('daily');
  const [region, setRegion] = useState<'india' | 'state'>('india');

  // Dummy Leaderboard Data (इसे बाद में Supabase से जोड़ा जाएगा)
  const leaders = [
    { rank: 1, name: 'Rahul Sharma', state: 'Delhi', score: '98/100', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul' },
    { rank: 2, name: 'Priya Verma', state: 'Uttar Pradesh', score: '95/100', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya' },
    { rank: 3, name: 'Amit Kumar', state: 'Bihar', score: '92/100', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit' },
    { rank: 4, name: 'Sneha Patel', state: 'Maharashtra', score: '90/100', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha' },
  ];

  return (
    <aside className="w-full space-y-6">
      {/* 1. Daily Quiz Box */}
      <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-blue-100">
          <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-full">
            🔥 Live Govt Quiz
          </span>
          <span className="text-[11px] font-bold text-slate-500">10 Questions</span>
        </div>
        <h3 className="text-sm font-bold text-slate-900 mt-3">
          Daily SSC & Banking General Awareness Challenge 2026
        </h3>
        <p className="text-xs text-slate-600 mt-1">
          टेस्ट दें, अपनी ऑल-इंडिया रैंक जांचें और तुरंत **Merit Certificate** डाउनलोड करें!
        </p>
        <button 
          onClick={() => alert('Quiz Modal Open Hoga')}
          className="mt-4 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
        >
          <span>🎯 Start Quiz Now</span>
          <span>→</span>
        </button>
      </div>

      {/* 2. Leaderboard Box */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-xs font-black uppercase tracking-wide text-slate-900">
            🏆 Top Achievers Leaderboard
          </h3>
        </div>

        {/* Filters (India / State & Daily / Weekly) */}
        <div className="mt-3 flex items-center justify-between bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setRegion('india')}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${region === 'india' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'}`}
          >
            🇮🇳 India
          </button>
          <button 
            onClick={() => setRegion('state')}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${region === 'state' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'}`}
          >
            🗺️ State
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
          <button onClick={() => setTab('daily')} className={tab === 'daily' ? 'text-blue-600 underline' : ''}>Daily</button>
          <button onClick={() => setTab('weekly')} className={tab === 'weekly' ? 'text-blue-600 underline' : ''}>Weekly</button>
          <button onClick={() => setTab('alltime')} className={tab === 'alltime' ? 'text-blue-600 underline' : ''}>All-Time</button>
        </div>

        {/* Leaderboard List */}
        <div className="mt-3 space-y-2.5">
          {leaders.map((user) => (
            <div key={user.rank} className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all">
              <div className="flex items-center gap-2.5">
                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${user.rank === 1 ? 'bg-amber-400 text-white' : user.rank === 2 ? 'bg-slate-300 text-slate-800' : user.rank === 3 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {user.rank}
                </span>
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full bg-blue-100 border border-slate-200" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{user.name}</h4>
                  <span className="text-[10px] text-slate-500">{user.state}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-extrabold text-blue-600 block">{user.score}</span>
                <span className="text-[9px] text-emerald-600 font-bold">Certified 🎖️</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}