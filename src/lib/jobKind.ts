// Ek hi jagah par decide hota hai ki koi entry Job hai, Admit Card hai ya Result.
// Pehle har list apna alag rule use karti thi, isliye ek hi entry 2 columns me dikhti thi (duplicate).
export type JobKind = 'job' | 'admit' | 'result';

type KindInput = {
  job_type?: string | null;
  title?: string | null;
  admit_card_url?: string | null;
  result_url?: string | null;
};

export function jobKind(j: KindInput): JobKind {
  const t = (j.job_type || '').toLowerCase();
  // 1) Sirf specific type (Admit Card / Result) final hai. 'Latest Jobs' default hai
  //    (extractor har page ko Latest Jobs bana deta tha), isliye wo title se override ho sakta hai.
  if (t.includes('admit')) return 'admit';
  if (t.includes('result')) return 'result';
  // 2) Title se
  const title = (j.title || '').toLowerCase();
  if (/admit card|hall ticket|exam city|city intimation/.test(title)) return 'admit';
  if (/result|cut ?off|merit list|score ?card/.test(title)) return 'result';
  // 3) Links se (sirf jab type khali/unknown ho)
  if (!t.includes('latest')) {
    if (j.admit_card_url) return 'admit';
    if (j.result_url) return 'result';
  }
  return 'job';
}

export function normTitle(s: string | null | undefined): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9\u0900-\u097f]+/g, ' ').trim();
}

// Fuzzy key: "... Admit Card" aur "... Admit Card for 225 Post" ek hi cheez maani jayein.
// Noise words (online form, apply, for N post, exam date...) hata kar bacha hua core compare hota hai.
const NOISE = new Set([
  'recruitment', 'online', 'form', 'apply', 'for', 'post', 'posts',
  'vacancy', 'vacancies', 'exam', 'date', 'dates', 'admit', 'card',
  'hall', 'ticket', 'result', 'results', 'cut', 'off', 'cutoff',
  'merit', 'list', 'notification', 'official', 'out', 'released',
  'declared', 'the', 'of', 'and', 'new', 'latest', '2nd', '1st',
  'final', 'provisional'
]);

export function coreKey(s: string | null | undefined): string {
  return normTitle(s)
    .split(' ')
    .filter((w) => w && !NOISE.has(w) && !(/^\d+$/.test(w) && !/^20\d\d$/.test(w)))
    .join(' ');
}

// Display safety-net: same slug ya same (type + title) wali entry sirf ek baar dikhao.
// List newest-first aati hai, isliye sabse nayi entry rakhi jati hai.
export function dedupeJobs<T extends KindInput & { slug: string }>(jobs: T[]): T[] {
  // Safety guard: agar jobs array na mile toh crash na ho
  if (!jobs || !Array.isArray(jobs)) return [];

  const seenSlug = new Set<string>();
  const seenTitle = new Set<string>();
  const out: T[] = [];

  for (const j of jobs) {
    if (!j || !j.slug) continue;
    const tk = `${jobKind(j)}|${coreKey(j.title)}`;
    if (seenSlug.has(j.slug) || seenTitle.has(tk)) continue;
    seenSlug.add(j.slug);
    seenTitle.add(tk);
    out.push(j);
  }

  return out;
}