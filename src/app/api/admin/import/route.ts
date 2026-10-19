import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getStaff } from '@/lib/admin';
import { JobInput } from '@/lib/jobSchema';
import { jobKind, coreKey } from '@/lib/jobKind';

// Sirf yehi columns DB me likhe jate hain (purane code jaise hi).
const COLS = [
  'slug', 'title', 'short_title', 'organization', 'category', 'job_type', 'total_posts',
  'full_description', 'application_start', 'last_date', 'fee_last_date', 'exam_date',
  'admit_card_date', 'age_as_on', 'min_age', 'max_age', 'age_limit', 'fee_gen_obc_ews',
  'fee_sc_st_ph', 'fee_female', 'application_fee', 'min_qualification', 'eligibility_summary',
  'source_url', 'official_website', 'apply_online_url', 'notification_pdf_url',
  'admit_card_url', 'result_url', 'status',
] as const;

// Agar DB me ye columns NOT NULL nikle to sirf tabhi (naye row par) purane defaults lagte hain.
const LEGACY_NOT_NULL_DEFAULTS: Record<string, unknown> = {
  min_age: 18, max_age: 30, fee_gen_obc_ews: 0, fee_sc_st_ph: 0, fee_female: 0,
  full_description: '', age_limit: '', application_fee: '', min_qualification: '',
  eligibility_summary: '', exam_date: 'As Per Schedule', admit_card_date: 'Before Exam',
};

export async function POST(req: Request) {
  // 1) Login + role check (pehle ye route bina login ke open tha)
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: 'Login required (admin/editor only).' }, { status: 401 });
  const db = staff.svc;

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }

  const raw: unknown[] = Array.isArray(body?.jobs) ? body.jobs : [];
  if (raw.length === 0) return NextResponse.json({ error: 'Koi job data nahi mila import ke liye.' }, { status: 400 });
  if (raw.length > 25) return NextResponse.json({ error: 'Ek baar me max 25 entries.' }, { status: 400 });
  const checkOnly = body?.check_only === true || body?.mode === 'check';

  // 2) Validation
  const parsedJobs: Record<string, any>[] = [];
  for (const item of raw) {
    const p = JobInput.safeParse(item);
    if (!p.success) {
      const slug = (item as any)?.slug || '(slug missing)';
      return NextResponse.json({ error: `Validation fail: ${slug}`, details: p.error.flatten().fieldErrors }, { status: 400 });
    }
    parsedJobs.push(p.data as Record<string, any>);
  }

  // 3) Existing rows (duplicate detection ke liye)
  const { data: existing, error: exErr } = await db
    .from('jobs').select('id, slug, title, job_type, admit_card_url, result_url').limit(2000);
  if (exErr) return NextResponse.json({ error: `DB read failed: ${exErr.message}` }, { status: 500 });
  const rows = existing || [];
  const bySlug = new Map(rows.map((r: any) => [r.slug, r]));
  const byTitle = new Map(rows.map((r: any) => [`${jobKind(r)}|${coreKey(r.title)}`, r]));

  const results: any[] = [];
  const touched: string[] = [];

  for (const job of parsedJobs) {
    const warnings: string[] = [];
    // Sirf wahi fields jo user ne di; '' url ko null bana do.
    const fields: Record<string, unknown> = {};
    for (const k of COLS) {
      let v = (job as any)[k];
      if (v === undefined) continue;
      if (v === '' && k.endsWith('_url')) v = null;
      fields[k] = v;
    }

    let target: any = bySlug.get(job.slug);
    let action: 'created' | 'updated' | 'merged' = target ? 'updated' : 'created';
    if (!target) {
      const dup = byTitle.get(`${jobKind(job as any)}|${coreKey(job.title)}`);
      if (dup) {
        target = dup;
        action = 'merged';
        warnings.push(`Same title/type pehle se hai (slug: ${dup.slug}) - naya row nahi banaya, wahi update hoga.`);
        fields.slug = dup.slug; // purana URL same rahe
      }
    }
    const finalSlug = (fields.slug as string) || job.slug;

    if (checkOnly) { results.push({ slug: finalSlug, action, warnings, saved: false }); continue; }

    if (target) {
      const { error } = await db.from('jobs').update({ ...fields, verified: true }).eq('id', target.id);
      if (error) return NextResponse.json({ error: `DB update failed (${finalSlug}): ${error.message}` }, { status: 500 });
    } else {
      const base = {
        short_title: job.title, category: 'Govt', job_type: 'Latest Jobs', status: 'published',
        source_url: 'https://sarkariyogyata.com', ...fields, verified: true,
      };
      let { error } = await db.from('jobs').insert(base);
      if (error && (error as any).code === '23502') {
        // NOT NULL column mila - purane defaults lagakar ek baar retry
        const filled: Record<string, unknown> = { ...base };
        for (const [k, v] of Object.entries(LEGACY_NOT_NULL_DEFAULTS)) if (filled[k] == null) filled[k] = v;
        warnings.push('DB me kuch columns NOT NULL hain, isliye default value lagayi gayi - page par check karein.');
        ({ error } = await db.from('jobs').insert(filled));
      }
      if (error) return NextResponse.json({ error: `DB insert failed (${finalSlug}): ${error.message}` }, { status: 500 });
      // Same request me aage duplicate na bane
      const row = { id: '', slug: finalSlug, title: job.title, job_type: job.job_type, admit_card_url: job.admit_card_url, result_url: job.result_url };
      bySlug.set(finalSlug, row);
      byTitle.set(`${jobKind(row)}|${coreKey(row.title)}`, row);
    }
    touched.push(finalSlug);
    results.push({ slug: finalSlug, action, warnings, saved: true });
  }

  if (!checkOnly) {
    try { revalidatePath('/'); touched.forEach((s) => revalidatePath(`/jobs/${s}`)); revalidatePath('/sitemap.xml'); } catch {}
  }

  const c = (a: string) => results.filter((r) => r.action === a).length;
  return NextResponse.json({
    success: true,
    message: `${checkOnly ? 'Check done' : 'Saved'}: ${c('created')} new, ${c('updated')} updated, ${c('merged')} duplicate merged.`,
    results,
  });
}
