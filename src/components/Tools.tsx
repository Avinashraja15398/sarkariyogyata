'use client';
import { useState } from 'react';
import { checkAge, type AgeRules } from '@/lib/age';
type PR = { min_kb?: number; max_kb: number; width?: number; height?: number; date_strip?: boolean };
const blob = (c: HTMLCanvasElement, q: number) => new Promise<Blob>(r => c.toBlob(b => r(b!), 'image/jpeg', q));
export default function Tools({ rules, asOn, photo }: { rules: AgeRules | null; asOn: string | null; photo: PR | null }) {
  const [dob, setDob] = useState(''), [cat, setCat] = useState('GEN'), [fem, setFem] = useState(false);
  const age = dob ? checkAge(dob, cat, fem, rules, asOn) : null;
  const [name, setName] = useState(''), [out, setOut] = useState<{ url: string; kb: number; note: string } | null>(null), [err, setErr] = useState('');
  const P: PR = photo ?? { min_kb: 20, max_kb: 50 };
  async function resize(f: File) {
    setErr(''); setOut(null);
    try {
      const img = await createImageBitmap(f);
      let W = P.width ?? 413, H = P.height ?? 531;
      for (let s = 1, i = 0; i < 7; i++, s *= 0.85) {
        const w = Math.round(W * s), h = Math.round(H * s), strip = P.date_strip ? Math.round(h * 0.08) : 0;
        const c = document.createElement('canvas'); c.width = w; c.height = h + strip; const x = c.getContext('2d')!;
        x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
        const k = Math.max(w / img.width, h / img.height), sw = w / k, sh = h / k;  // cover-crop, no stretching
        x.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 4, sw, sh, 0, 0, w, h);
        if (strip) { x.fillStyle = '#000'; x.font = `bold ${Math.round(strip * 0.55)}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
          x.fillText(`${name ? name + '  ' : ''}${new Date().toLocaleDateString('en-GB')}`, w / 2, h + strip / 2, w - 8); }
        let lo = 0.3, hi = 0.95, best: Blob | null = null;
        for (let n = 0; n < 7; n++) { const q = (lo + hi) / 2, b = await blob(c, q); if (b.size <= P.max_kb * 1024) { best = b; lo = q; } else hi = q; }
        if (best) {
          const kb = Math.round(best.size / 1024);
          setOut({ url: URL.createObjectURL(best), kb, note: P.min_kb && kb < P.min_kb ? `Size ${P.min_kb}KB se kam hai. Form reject ho sakta hai, bada original photo try karein.` : 'Size limit ke andar hai.' }); return;
        }
      }
      setErr('Is photo ko limit me laana possible nahi hua. Doosri photo try karein.');
    } catch { setErr('Photo open nahi ho payi. JPG ya PNG try karein.'); }
  }
  const inp = 'rounded-lg border border-line px-3 py-2';
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-line p-4">
        <h2 className="text-lg font-bold">Kya main eligible hoon? (Age)</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <input type="date" aria-label="Date of birth" value={dob} onChange={e => setDob(e.target.value)} className={inp} />
          <select aria-label="Category" value={cat} onChange={e => setCat(e.target.value)} className={inp}>{['GEN', 'EWS', 'OBC', 'SC', 'ST'].map(c => <option key={c}>{c}</option>)}</select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={fem} onChange={e => setFem(e.target.checked)} />Female</label>
        </div>
        {age && <p role="status" className={`mt-3 rounded-lg p-3 text-sm font-medium ${age.state === 'yes' ? 'bg-go/10 text-go' : age.state === 'no' ? 'bg-bad/10 text-bad' : 'bg-wash'}`}>
          {age.state === 'yes' ? 'Age ke hisaab se aap eligible lag rahe hain. ' : age.state === 'no' ? 'Age limit match nahi ho rahi. ' : ''}{age.text}</p>}
        <p className="mt-2 text-xs text-ink/60">Yeh sirf age ka andaza hai. Qualification, height aur baaki shartein notification me dekhein.</p>
      </section>
      <section className="rounded-xl border border-line p-4">
        <h2 className="text-lg font-bold">Photo resize ({P.min_kb ?? 0}-{P.max_kb} KB)</h2>
        <p className="mt-1 text-xs text-ink/60">Photo aapke browser me hi process hoti hai, kahin upload nahi hoti.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {P.date_strip && <input value={name} onChange={e => setName(e.target.value)} placeholder="Naam (photo ki strip par)" className={inp} />}
          <input type="file" accept="image/*" aria-label="Photo chunein" onChange={e => e.target.files?.[0] && resize(e.target.files[0])} className="text-sm" />
        </div>
        {err && <p role="alert" className="mt-3 text-sm text-bad">{err}</p>}
        {out && <div className="mt-3 flex items-center gap-4"><img src={out.url} alt="Resized photo" className="h-40 rounded border border-line" />
          <div className="text-sm"><p className="font-semibold">{out.kb} KB</p><p>{out.note}</p><a href={out.url} download="photo.jpg" className="mt-2 inline-block rounded-lg bg-ink px-4 py-2 font-semibold text-white">Download</a></div></div>}
      </section>
    </div>
  );
}
