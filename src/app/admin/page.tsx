'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { browserClient } from '@/lib/browser';

export default function AdminConsole() {
  const [mode, setMode] = useState<'url' | 'text' | 'manual'>('url');
  const [targetUrl, setTargetUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err' | 'info'; text: string } | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [lastPublishedSlug, setLastPublishedSlug] = useState('');
  const router = useRouter();

  // 1. 1-Click Ready Templates for all 3 Types
  const loadTemplate = (type: 'job' | 'admit' | 'result') => {
    if (type === 'job') {
      const jobTpl = {
        slug: 'recruitment-2026-online-form',
        title: 'Department Recruitment 2026 Online Form for 500 Posts',
        short_title: 'Dept Recruitment 2026',
        organization: 'Govt Department',
        job_type: 'Latest Jobs',
        category: 'Govt',
        total_posts: 500,
        application_start: '2026-10-15',
        last_date: '2026-11-15',
        min_age: 18,
        max_age: 30,
        application_fee: 'General / OBC: ₹500/- | SC / ST: ₹250/-',
        min_qualification: '10th / 12th / Graduate from recognized board.',
        apply_online_url: 'https://example.gov.in',
        notification_pdf_url: 'https://example.gov.in',
        source_url: 'https://example.gov.in',
        status: 'published',
        verified: true,
      };
      setJsonText(JSON.stringify(jobTpl, null, 2));
      setStatusMsg({ type: 'info', text: '🏛️ Latest Job का टेम्पलेट लोड हो गया है।' });
    } else if (type === 'admit') {
      const admitTpl = {
        slug: 'ssc-cgl-2026-tier-1-admit-card',
        title: 'SSC CGL 2026 Tier 1 Exam Admit Card / Hall Ticket',
        short_title: 'SSC CGL 2026 Admit Card',
        organization: 'Staff Selection Commission (SSC)',
        job_type: 'Admit Card',
        category: 'Govt',
        admit_card_url: 'https://ssc.gov.in',
        source_url: 'https://ssc.gov.in',
        full_description: 'Staff Selection Commission has released the Tier 1 examination admit card and exam city details.',
        status: 'published',
        verified: true,
      };
      setJsonText(JSON.stringify(admitTpl, null, 2));
      setStatusMsg({ type: 'info', text: '🎫 Admit Card का टेम्पलेट लोड हो गया है।' });
    } else if (type === 'result') {
      const resultTpl = {
        slug: 'upsc-civil-services-ias-pre-result-2026',
        title: 'UPSC Civil Services IAS / IFS Pre Examination Result 2026 with Cutoff',
        short_title: 'UPSC IAS Pre Result 2026',
        organization: 'Union Public Service Commission (UPSC)',
        job_type: 'Result',
        category: 'Govt',
        result_url: 'https://upsc.gov.in',
        source_url: 'https://upsc.gov.in',
        full_description: 'Union Public Service Commission has officially announced the Preliminary Exam results, scorecards and merit list.',
        status: 'published',
        verified: true,
      };
      setJsonText(JSON.stringify(resultTpl, null, 2));
      setStatusMsg({ type: 'info', text: '🎯 Result का टेम्पलेट लोड हो गया है।' });
    }
  };

  // 2. Prettify
  const formatJSON = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setStatusMsg({ type: 'ok', text: 'JSON सही फॉर्मेट में सेट हो गया है।' });
    } catch (e: any) {
      setStatusMsg({ type: 'err', text: `JSON सिंटैक्स गलत है: ${e.message}` });
    }
  };

  // 3. Extract Agent
  const handleExtract = async () => {
    setStatusMsg(null);
    setLoading(true);

    try {
      const payload = mode === 'url' ? { url: targetUrl.trim() } : { rawContent: rawText.trim() };

      const res = await fetch('/api/admin/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'डेटा निकालने में दिक्कत आई।');
      }

      setJsonText(JSON.stringify(resJson.data, null, 2));
      setPreviewData(resJson.data);
      const w: string[] = resJson.warnings || [];
      setStatusMsg({
        type: w.length ? 'info' : 'ok',
        text: '✓ डेटा एक्सट्रैक्ट हो गया! नीचे प्रीव्यू चेक करें।' + (w.length ? ' ⚠ Manual bharna hai: ' + w.join(', ') : ''),
      });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Shared validator: Check aur Publish dono yahi use karte hain
  const missingFields = (target: any): string[] => {
    const jt = String(target?.job_type || 'Latest Jobs').toLowerCase();
    const m: string[] = [];
    if (!target?.slug) m.push('slug');
    if (!target?.title) m.push('title');
    if (!target?.organization) m.push('organization');
    if (!target?.source_url) m.push('source_url');
    if (jt.includes('admit')) { if (!target?.admit_card_url && !target?.source_url) m.push('admit_card_url'); }
    else if (jt.includes('result')) { if (!target?.result_url && !target?.source_url) m.push('result_url'); }
    else if (!target?.last_date && !target?.district_wise) m.push('last_date');
    return m;
  };

  // 4. Smart Dynamic Validator (Type-Aware)
  const handleCheckOnly = () => {
    setStatusMsg(null);
    try {
      if (!jsonText.trim()) throw new Error('कृपया पहले JSON डेटा भरें।');
      const parsed = JSON.parse(jsonText);
      const target = Array.isArray(parsed) ? parsed[0] : parsed;

      const jobType = (target.job_type || 'Latest Jobs').toLowerCase();
      const missing: string[] = [];

      // Basic fields needed by all
      if (!target.slug) missing.push('slug');
      if (!target.title) missing.push('title');
      if (!target.organization) missing.push('organization');
      if (!target.source_url) missing.push('source_url');

      // Type-specific validation
      if (jobType.includes('admit')) {
        if (!target.admit_card_url && !target.source_url) missing.push('admit_card_url');
      } else if (jobType.includes('result')) {
        if (!target.result_url && !target.source_url) missing.push('result_url');
      } else {
        // Only require last_date for Vacancies/Jobs
        if (!target.last_date && !target.district_wise) missing.push('last_date');
      }

      if (missing.length > 0) {
        setStatusMsg({
          type: 'err',
          text: `चेतावनी: ये ज़रूरी फ़ील्ड मिसिंग हैं: ${missing.join(', ')}`,
        });
      } else {
        setStatusMsg({
          type: 'ok',
          text: `✓ वैलिडेट सफल! "${target.title}" [${target.job_type || 'Latest Jobs'}] लाइव होने के लिए तैयार है।`,
        });
      }
      setPreviewData(target);
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: `JSON एरर: ${err.message}` });
      setPreviewData(null);
    }
  };

  // 5. Publish
  const handlePublish = async () => {
    setStatusMsg(null);
    if (!confirmed) {
      setStatusMsg({ type: 'err', text: 'कृपया नीचे दिए गए पुष्टि चेकबॉक्स पर टिक लगाएं।' });
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      const jobsArray = Array.isArray(parsed) ? parsed : [parsed];

      // Publish se pehle har entry ka required-field check (pehle sirf Check button karta tha)
      for (const j of jobsArray) {
        const miss = missingFields(j);
        if (miss.length) {
          setStatusMsg({ type: 'err', text: `Publish roka gaya - "${j?.slug || j?.title || 'entry'}" me missing: ${miss.join(', ')}` });
          return;
        }
      }

      setLoading(true);
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs: jobsArray, check_only: false }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        let err = resJson.error || 'पब्लिश करने में विफल।';
        if (resJson.details) {
          err += ' ➔ ' + JSON.stringify(resJson.details);
        }
        throw new Error(err);
      }

      setLastPublishedSlug(jobsArray[0]?.slug || '');
      setStatusMsg({
        type: 'ok',
        text: '🎉 ' + (resJson.message || 'Live ho gaya!') + (resJson.results?.some((r: any) => r.warnings?.length) ? ' ⚠ ' + resJson.results.flatMap((r: any) => r.warnings).join(' | ') : ''),
      });
      router.refresh();
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const isAdmitCard = previewData?.job_type?.toLowerCase().includes('admit');
  const isResult = previewData?.job_type?.toLowerCase().includes('result');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased pb-20">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-black text-white text-sm">
              SY
            </span>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-none">Admin Mission Control</h1>
              <span className="text-[10px] text-slate-400">Jobs, Admit Cards & Results Manager</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" target="_blank" className="text-xs font-semibold text-blue-600 hover:underline">
              लाइव साइट देखें ↗
            </Link>
            <button
              onClick={async () => {
                await browserClient().auth.signOut();
                router.push('/admin/login');
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-6 space-y-6">
        {/* Method Selector */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              डेटा इनपुट मोड चुनें
            </h2>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => loadTemplate('job')}
                className="rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100"
              >
                + Job Template
              </button>
              <button
                type="button"
                onClick={() => loadTemplate('admit')}
                className="rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-100"
              >
                + Admit Card Template
              </button>
              <button
                type="button"
                onClick={() => loadTemplate('result')}
                className="rounded-lg bg-purple-50 px-2 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-100"
              >
                + Result Template
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`rounded-xl p-3 text-left transition-all border ${
                mode === 'url'
                  ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="block text-sm font-bold text-slate-900">🔗 URL Scraper</span>
              <span className="text-[11px] text-slate-500">SarkariYogyata का सीधा लिंक डालें</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('text')}
              className={`rounded-xl p-3 text-left transition-all border ${
                mode === 'text'
                  ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="block text-sm font-bold text-slate-900">📋 Copy-Paste Text</span>
              <span className="text-[11px] text-slate-500">पेज का टेक्स्ट पेस्ट करें (प्रॉक्सी सेफ)</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`rounded-xl p-3 text-left transition-all border ${
                mode === 'manual'
                  ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="block text-sm font-bold text-slate-900">✍️ Pure Manual JSON</span>
              <span className="text-[11px] text-slate-500">ऊपर टेम्पलेट चुनें या खुद लिखें</span>
            </button>
          </div>

          {mode === 'url' && (
            <div className="mt-4 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">पेज का पूरा URL डालें:</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://www.sarkariyogyata.com..."
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleExtract}
                  disabled={loading}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'स्कैनिंग...' : 'Fetch & Auto-Fill ⚡'}
                </button>
              </div>
            </div>
          )}

          {mode === 'text' && (
            <div className="mt-4 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                SarkariYogyata के पेज से पूरा टेक्स्ट (Ctrl+A, Ctrl+C) यहाँ पेस्ट करें:
              </label>
              <textarea
                rows={5}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Name of Post: ... Important Dates: ... Application Fee: ..."
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleExtract}
                disabled={loading}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'टेक्स्ट प्रोसेस हो रहा है...' : 'Parse Text to JSON ⚡'}
              </button>
            </div>
          )}
        </div>

        {/* Live JSON Editor */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">डेटा JSON (एडिट / कस्टमाइज़)</h2>
              <p className="text-[11px] text-slate-400">job_type: 'Latest Jobs', 'Admit Card', या 'Result' सेट करें।</p>
            </div>
            <button
              type="button"
              onClick={formatJSON}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              फ़ॉर्मेट JSON (Prettify)
            </button>
          </div>

          <div className="mt-3">
            <textarea
              rows={12}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="यहाँ JSON कोड रहेगा..."
              className="w-full font-mono text-xs rounded-xl border border-slate-300 bg-slate-50/50 p-3 text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Status Alerts */}
        {statusMsg && (
          <div
            className={`rounded-xl p-3.5 text-xs font-semibold border ${
              statusMsg.type === 'ok'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : statusMsg.type === 'err'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            {statusMsg.text}
            {lastPublishedSlug && (
              <div className="mt-2">
                <Link
                  href={`/jobs/${lastPublishedSlug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-900 underline"
                >
                  लाइव पेज यहाँ देखें ↗
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Preview Card (Adapts to Job, Admit Card, or Result) */}
        {previewData && (
          <div
            className={`rounded-2xl border p-5 shadow-xs ${
              isAdmitCard
                ? 'border-amber-200 bg-amber-50/30'
                : isResult
                ? 'border-purple-200 bg-purple-50/30'
                : 'border-blue-200 bg-blue-50/30'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {isAdmitCard ? '🎫 एडमिट कार्ड प्रीव्यू' : isResult ? '🎯 रिजल्ट प्रीव्यू' : '🏛️ सरकारी नौकरी प्रीव्यू'}
              </span>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                  isAdmitCard
                    ? 'bg-amber-100 text-amber-800'
                    : isResult
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {previewData.job_type || 'Latest Jobs'}
              </span>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <span className="text-xs font-semibold text-slate-500">{previewData.organization}</span>
                <h3 className="text-base font-extrabold text-slate-900 leading-snug">{previewData.title}</h3>
              </div>

              {/* Conditional Metrics */}
              {isAdmitCard ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-white p-2.5 border border-amber-200">
                    <span className="text-[10px] text-slate-400 block">परीक्षा स्थिति</span>
                    <span className="font-bold text-amber-800">Admit Card / Hall Ticket Active</span>
                  </div>
                  <div className="rounded-lg bg-white p-2.5 border border-amber-200">
                    <span className="text-[10px] text-slate-400 block">डाउनलोड लिंक</span>
                    <span className="font-bold text-blue-600 truncate block">
                      {previewData.admit_card_url || previewData.source_url}
                    </span>
                  </div>
                </div>
              ) : isResult ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-white p-2.5 border border-purple-200">
                    <span className="text-[10px] text-slate-400 block">परिणाम स्थिति</span>
                    <span className="font-bold text-purple-800">Result / Merit List Out</span>
                  </div>
                  <div className="rounded-lg bg-white p-2.5 border border-purple-200">
                    <span className="text-[10px] text-slate-400 block">चेक करने का लिंक</span>
                    <span className="font-bold text-blue-600 truncate block">
                      {previewData.result_url || previewData.source_url}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="rounded-lg bg-white p-2 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">कुल पद</span>
                    <span className="font-bold text-slate-900">{previewData.total_posts || 'N/A'}</span>
                  </div>
                  <div className="rounded-lg bg-white p-2 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">अंतिम तिथि</span>
                    <span className="font-bold text-rose-600">{previewData.last_date || 'N/A'}</span>
                  </div>
                  <div className="rounded-lg bg-white p-2 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">उम्र सीमा</span>
                    <span className="font-bold text-slate-900">
                      {previewData.min_age && previewData.max_age
                        ? `${previewData.min_age} - ${previewData.max_age} Years`
                        : previewData.age_limit || 'N/A'}
                    </span>
                  </div>
                  <div className="rounded-lg bg-white p-2 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">सामान्य फीस</span>
                    <span className="font-bold text-slate-900">{previewData.fee_gen_obc_ews != null ? '₹' + previewData.fee_gen_obc_ews : 'N/A'}</span>
                  </div>
                </div>
              )}

              {previewData.full_description && (
                <div className="rounded-lg bg-white p-2.5 border border-slate-200 text-xs text-slate-600">
                  {previewData.full_description}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>मैंने तारीखें, लिंक्स और विवरण वेरिफ़ाई कर लिए हैं।</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCheckOnly}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              Check & Preview 👁️
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={loading}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? 'पब्लिश हो रहा है...' : 'Publish to Live Site 🚀'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}