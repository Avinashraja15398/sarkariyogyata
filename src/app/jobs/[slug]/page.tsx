import { notFound } from 'next/navigation';
import Link from 'next/link';
import { pub, todayIST } from '@/lib/public';
import { jobKind } from '@/lib/jobKind';

export const revalidate = 60;

interface JobPageProps {
  params: Promise<{ slug: string }>;
}

export default async function JobDetailPage({ params }: JobPageProps) {
  const { slug } = await params;
  const supabase = pub();

  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !job) {
    notFound();
  }

  const today = todayIST();
  const districtWise = !job.last_date && /district wise|जिलेवार/i.test(job.full_description || '');

  // 1. Identify Page Type (Job vs Admit Card vs Result)
  const jobType = (job.job_type || '').toLowerCase();
  const titleLower = job.title.toLowerCase();

  const kind = jobKind(job);
  const isAdmitCard = kind === 'admit';
  const isResult = kind === 'result';

  const isJob = !isAdmitCard && !isResult;
  const isClosed = isJob && job.last_date ? job.last_date < today : false;

  // 2. Dynamic WhatsApp Share Text
  let shareMsg = '';
  if (isAdmitCard) {
    shareMsg = `*${job.title}*\n🎫 प्रवेश पत्र (Admit Card) जारी हो चुका है!\nडायरेक्ट डाउनलोड लिंक यहाँ देखें:\nhttps://sarkariyogyata.com/jobs/${job.slug}`;
  } else if (isResult) {
    shareMsg = `*${job.title}*\n🎯 परीक्षा परिणाम (Result & Merit List) घोषित हो चुका है!\nयहाँ अपना रिजल्ट चेक करें:\nhttps://sarkariyogyata.com/jobs/${job.slug}`;
  } else {
    shareMsg = `*${job.title}*\nकुल पद: ${job.total_posts || 'Notice देखें'}\nअंतिम तिथि: ${job.last_date || 'जल्द'}\nऑनलाइन आवेदन लिंक यहाँ देखें:\nhttps://sarkariyogyata.com/jobs/${job.slug}`;
  }
  const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMsg)}`;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 antialiased pb-20">
      {/* Breadcrumb Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <nav className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <span className="text-slate-600">{job.organization}</span>
            <span>/</span>
            <span className="text-slate-400 truncate max-w-xs">{job.title}</span>
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 pt-6 space-y-6">
        {/* Title Header Banner */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
              {job.organization}
            </span>

            {/* Smart Type Status Badge */}
            {isAdmitCard ? (
              <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 animate-pulse">
                🎫 प्रवेश पत्र (Admit Card) उपलब्ध
              </span>
            ) : isResult ? (
              <span className="rounded-md bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 animate-pulse">
                🎯 परीक्षा परिणाम (Result) घोषित
              </span>
            ) : isClosed ? (
              <span className="rounded-md bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                ● आवेदन बंद
              </span>
            ) : (
              <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 animate-pulse">
                ● ऑनलाइन आवेदन चालू
              </span>
            )}
          </div>

          <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-snug">
            {job.title}
          </h1>

          {job.full_description && (
            <p className="whitespace-pre-line mt-3 text-xs md:text-sm text-slate-600 leading-relaxed border-l-4 border-blue-600 pl-3 bg-slate-50 py-2 rounded-r-lg">
              {job.full_description}
            </p>
          )}

          {/* ================= HERO ACTION CARDS ================= */}
          {/* For Admit Card: 1-Click Direct Download Hero */}
          {isAdmitCard && (
            <div className="mt-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-amber-100 block">
                  Hall Ticket & Exam City Status
                </span>
                <p className="text-base font-bold">अपना एडमिट कार्ड सीधे यहाँ से डाउनलोड करें</p>
              </div>
              <a
                href={job.admit_card_url || job.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-white px-5 py-2.5 text-xs font-black text-amber-700 hover:bg-amber-50 shadow-sm transition-transform active:scale-95"
              >
                Download Admit Card Now ⚡
              </a>
            </div>
          )}

          {/* For Result: 1-Click Direct Scorecard Hero */}
          {isResult && (
            <div className="mt-5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-purple-200 block">
                  Scorecard & Merit List Released
                </span>
                <p className="text-base font-bold">मेरिट लिस्ट और परिणाम PDF यहाँ चेक करें</p>
              </div>
              <a
                href={job.result_url || job.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-white px-5 py-2.5 text-xs font-black text-purple-700 hover:bg-purple-50 shadow-sm transition-transform active:scale-95"
              >
                View Result & Cut-off 🏆
              </a>
            </div>
          )}

          {/* For Latest Job: Key Metrics Ribbon */}
          {isJob && (
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-[11px] font-semibold text-slate-400 block">कुल पद (Total Vacancy)</span>
                <span className="text-lg font-black text-slate-900">
                  {job.total_posts ? job.total_posts.toLocaleString('en-IN') : 'Check Notice'}
                </span>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-[11px] font-semibold text-slate-400 block">अंतिम तिथि (Last Date)</span>
                <span className={`text-base font-bold ${isClosed ? 'text-rose-600' : 'text-blue-700'}`}>
                  {job.last_date || (districtWise ? 'District Wise' : 'N/A')}
                </span>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-[11px] font-semibold text-slate-400 block">उम्र सीमा (Age Limit)</span>
                <span className="text-base font-bold text-slate-900">
                  {job.min_age && job.max_age ? `${job.min_age} - ${job.max_age} वर्ष` : (job.age_limit || 'Notice देखें')}
                </span>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-[11px] font-semibold text-slate-400 block">वेतनमान (Salary)</span>
                <span className="text-sm font-bold text-slate-900">{job.salary_range || 'Govt Rules'}</span>
              </div>
            </div>
          )}
        </div>

        {/* ================= CONDITIONAL SECTIONS ================= */}

        {/* 🅰️ ADMIT CARD SPECIFIC SECTIONS */}
        {isAdmitCard && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Exam Instructions */}
              <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100 uppercase tracking-wider">
                  <span>⚠️</span> परीक्षा केंद्र के लिए ज़रूरी निर्देश (Exam Guidelines)
                </h2>
                <ul className="mt-4 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>प्रवेश पत्र (Admit Card):</strong> A4 साइज पेपर पर स्पष्ट प्रिंट आउट लेकर जाएं।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>मूल पहचान पत्र (Original ID Proof):</strong> आधार कार्ड, पैन कार्ड, या वोटर कार्ड की मूल प्रति अवश्य रखें।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>पासपोर्ट साइज फोटो:</strong> 2 हालिया पासपोर्ट साइज रंगीन फोटो साथ लेकर जाएं।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold">✕</span>
                    <span><strong>प्रतिबंधित वस्तुएं:</strong> मोबाइल, स्मार्टवॉच, कैलकुलेटर, या कोई भी इलेक्ट्रॉनिक गैजेट ले जाना सख्त मना है।</span>
                  </li>
                </ul>
              </div>

              {/* How to Download Steps */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100 uppercase tracking-wider">
                  <span>📥</span> एडमिट कार्ड कैसे डाउनलोड करें? (Step-by-Step)
                </h2>
                <ol className="mt-4 space-y-2.5 text-xs text-slate-700 list-decimal list-inside leading-relaxed">
                  <li>नीचे दिए गए <strong>"Download Admit Card"</strong> लिंक पर क्लिक करें।</li>
                  <li>अपना <strong>रजिस्ट्रेशन नंबर / रोल नंबर</strong> और <strong>जन्म तिथि (DOB)</strong> दर्ज करें।</li>
                  <li>स्क्रीन पर दिख रहा कैप्चा कोड भरकर <strong>Login / Submit</strong> करें।</li>
                  <li>आपका एडमिट कार्ड स्क्रीन पर आ जाएगा, इसे <strong>PDF</strong> में सेव करके 2 प्रिंट निकाल लें।</li>
                </ol>
              </div>
            </div>
          </>
        )}

        {/* 🅱️ RESULT SPECIFIC SECTIONS */}
        {isResult && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* How to Check Result */}
              <div className="rounded-2xl border border-purple-200 bg-white p-5 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100 uppercase tracking-wider">
                  <span>🔍</span> रिजल्ट में अपना नाम व रोल नंबर कैसे चेक करें?
                </h2>
                <ol className="mt-4 space-y-2.5 text-xs text-slate-700 list-decimal list-inside leading-relaxed">
                  <li>नीचे दिए गए <strong>"Download Result / Merit List"</strong> लिंक पर क्लिक करें।</li>
                  <li>परिणाम की <strong>PDF फ़ाइल</strong> अपने मोबाइल या कंप्यूटर में डाउनलोड करें।</li>
                  <li>कंप्यूटर में <strong>Ctrl + F</strong> दबाएं (या मोबाइल में Search आइकन पर क्लिक करें)।</li>
                  <li>अपना <strong>Roll Number</strong> या <strong>Name</strong> टाइप करें।</li>
                  <li>यदि आपका नंबर हाइलाइट होता है, तो आप अगले चरण के लिए चयनित हैं। बधाई हो!</li>
                </ol>
              </div>

              {/* Next Stages */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100 uppercase tracking-wider">
                  <span>📌</span> चयन के अगले चरण (Next Process)
                </h2>
                <ul className="mt-4 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    <span><strong>Mains / Next Stage Exam:</strong> सफल उम्मीदवारों को मुख्य परीक्षा में शामिल होने का अवसर मिलेगा।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">2.</span>
                    <span><strong>Document Verification:</strong> अपने सभी शैक्षणिक प्रमाण पत्र व जाति प्रमाण पत्र तैयार रखें।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">3.</span>
                    <span><strong>Scorecard:</strong> कुछ दिनों बाद आधिकारिक साइट पर व्यक्तिगत अंक पत्र जारी किए जाएंगे।</span>
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}

        {/* 🅲 LATEST JOB SPECIFIC SECTIONS (Dates, Fee, Eligibility) */}
        {isJob && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dates */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100 uppercase tracking-wider">
                  <span>📅</span> महत्वपूर्ण तिथियां (Important Dates)
                </h2>
                <ul className="mt-4 space-y-2.5 text-xs">
                  <li className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">आवेदन शुरू तिथि:</span>
                    <span className="font-bold text-slate-800">{job.application_start || 'Notified Soon'}</span>
                  </li>
                  <li className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">ऑनलाइन आवेदन की अंतिम तिथि:</span>
                    <span className="font-bold text-rose-600">{job.last_date || (districtWise ? 'District Wise' : 'Notified Soon')}</span>
                  </li>
                  <li className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">परीक्षा शुल्क अंतिम तिथि:</span>
                    <span className="font-bold text-slate-800">{job.fee_last_date || job.last_date || (districtWise ? 'District Wise' : 'N/A')}</span>
                  </li>
                  <li className="flex justify-between py-1">
                    <span className="text-slate-500">परीक्षा तिथि:</span>
                    <span className="font-bold text-blue-700">{job.exam_date || 'As per schedule'}</span>
                  </li>
                </ul>
              </div>

              {/* Fees */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100 uppercase tracking-wider">
                  <span>💳</span> आवेदन शुल्क (Application Fee)
                </h2>
                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 font-semibold text-slate-700">
                    {job.application_fee || 'सामान्य / ओबीसी: नियमानुसार | एससी / एसटी: नियमानुसार'}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed pt-2">
                    ऑनलाइन डेबिट कार्ड, क्रेडिट कार्ड, नेट बैंकिंग या यूपीआई के माध्यम से शुल्क का भुगतान करें।
                  </p>
                </div>
              </div>
            </div>

            {/* Age Limit */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100 uppercase tracking-wider">
                <span>👤</span> आयु सीमा (Age Limit as on {job.age_as_on || 'Notice देखें'})
              </h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl bg-blue-50/60 p-3 border border-blue-100">
                  <span className="text-slate-500 block">न्यूनतम आयु</span>
                  <span className="text-base font-black text-blue-700">{job.min_age != null ? <>{job.min_age} वर्ष</> : 'Notice देखें'}</span>
                </div>
                <div className="rounded-xl bg-blue-50/60 p-3 border border-blue-100">
                  <span className="text-slate-500 block">अधिकतम आयु</span>
                  <span className="text-base font-black text-blue-700">{job.max_age != null ? <>{job.max_age} वर्ष</> : 'Notice देखें'}</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <span className="text-slate-500 block">आयु में छूट</span>
                  <span className="font-semibold text-slate-800">नियमानुसार ओबीसी/एससी/एसटी को अतिरिक्त छूट मान्य</span>
                </div>
              </div>
            </div>

            {/* Vacancy Table */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs overflow-hidden">
              <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between pb-3 border-b border-slate-100 uppercase tracking-wider">
                <span>📋 रिक्ति विवरण व शैक्षणिक योग्यता</span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                  कुल {job.total_posts || 0} पद
                </span>
              </h2>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">पद का नाम</th>
                      <th className="p-3 text-center">कुल पद</th>
                      <th className="p-3">शैक्षणिक व शारीरिक पात्रता</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    <tr className="hover:bg-slate-50/60">
                      <td className="p-3 font-bold text-blue-900 align-top">{job.title}</td>
                      <td className="p-3 text-center font-bold text-slate-900 align-top bg-slate-50/40">
                        {job.total_posts || 'Check Notice'}
                      </td>
                      <td className="p-3 leading-relaxed align-top">
                        <p className="font-semibold text-slate-900 mb-1">
                          {job.min_qualification || job.eligibility_summary || 'विस्तृत योग्यता के लिए अधिसूचना पढ़ें।'}
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* How to Fill Form */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100 uppercase tracking-wider">
                <span>📝</span> ऑनलाइन आवेदन कैसे करें (How to Apply)
              </h2>
              <ol className="mt-4 space-y-2 text-xs text-slate-700 list-decimal list-inside leading-relaxed">
                <li>उम्मीदवार {job.application_start || 'प्रारंभ तिथि'} से {job.last_date || 'अंतिम तिथि'} के बीच आवेदन करें।</li>
                <li>आवेदन से पहले आधिकारिक अधिसूचना को ध्यानपूर्वक पढ़ें।</li>
                <li>अपने सभी दस्तावेज़ (फोटो, हस्ताक्षर, पहचान पत्र) स्कैन करके तैयार रखें।</li>
                <li>फॉर्म सबमिट करने से पहले पूर्वावलोकन (Preview) में सभी विवरण जांच लें।</li>
                <li>यदि शुल्क लागू हो तो अनिवार्य रूप से भुगतान करें और फाइनल प्रिंट आउट सुरक्षित रखें।</li>
              </ol>
            </div>
          </>
        )}

        {/* ================= USEFUL LINKS SECTION (DYNAMIC) ================= */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100 uppercase tracking-wider">
            <span>🔗</span> महत्वपूर्ण उपयोगी लिंक्स (Useful Important Links)
          </h2>

          <div className="mt-4 divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {/* If Admit Card: Direct Admit Card Links */}
            {isAdmitCard && (
              <>
                <div className="flex items-center justify-between p-3.5 bg-amber-50/40 hover:bg-amber-50 transition-colors">
                  <span className="text-xs font-bold text-amber-900">
                    डाउनलोड एडमिट कार्ड (Download Admit Card)
                  </span>
                  <a
                    href={job.admit_card_url || job.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-xs"
                  >
                    Click Here ⚡
                  </a>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors">
                  <span className="text-xs font-bold text-slate-800">
                    एग्जाम सिटी / एप्लीकेशन स्टेटस (Check Status)
                  </span>
                  <a
                    href={job.admit_card_url || job.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Click Here
                  </a>
                </div>
              </>
            )}

            {/* If Result: Direct Result & Cutoff Links */}
            {isResult && (
              <>
                <div className="flex items-center justify-between p-3.5 bg-purple-50/40 hover:bg-purple-50 transition-colors">
                  <span className="text-xs font-bold text-purple-900">
                    डाउनलोड रिजल्ट व मेरिट लिस्ट (Download Result PDF)
                  </span>
                  <a
                    href={job.result_url || job.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 shadow-xs"
                  >
                    Click Here 🏆
                  </a>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors">
                  <span className="text-xs font-bold text-slate-800">
                    कट-ऑफ मार्क्स / स्कोरकार्ड (Cutoff Marks)
                  </span>
                  <a
                    href={job.result_url || job.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Click Here
                  </a>
                </div>
              </>
            )}

            {/* If Job: Apply Online Link */}
            {isJob && (
              <div className="flex items-center justify-between p-3.5 bg-emerald-50/30 hover:bg-emerald-50 transition-colors">
                <span className="text-xs font-bold text-slate-800">
                  ऑनलाइन आवेदन करें (Apply Online)
                </span>
                {job.apply_online_url ? (
                  <a
                    href={job.apply_online_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
                  >
                    Apply Online →
                  </a>
                ) : (
                  <span className="rounded bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-400">
                    Link Active Soon
                  </span>
                )}
              </div>
            )}

            {/* Common Links: Notification & Official Site */}
            <div className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors">
              <span className="text-xs font-bold text-slate-800">
                आधिकारिक अधिसूचना (Download Notification)
              </span>
              <a
                href={job.notification_pdf_url || job.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Download PDF 📄
              </a>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors">
              <span className="text-xs font-bold text-slate-800">
                आधिकारिक वेबसाइट (Official Website)
              </span>
              <a
                href={job.official_website || job.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Official Website 🌐
              </a>
            </div>
          </div>

          {/* Social Growth & Share Strip */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors border border-emerald-200"
            >
              <span>💬</span> WhatsApp पर शेयर करें
            </a>
            <a
              href="https://t.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-xs font-bold text-blue-800 hover:bg-blue-100 transition-colors border border-blue-200"
            >
              <span>✈️</span> Telegram चैनल से जुड़ें (Fast Alert)
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}