import { z } from 'zod';

const d = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date YYYY-MM-DD hona chahiye');
const url = z.string().url().or(z.string());

export const JobInput = z.object({
  title: z.string().min(5),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug: lowercase-hyphen'),
  short_title: z.string().optional().nullable(),
  organization: z.string().min(2),
  category: z.string().optional().nullable(),
  job_type: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  total_posts: z.number().int().nonnegative().optional().nullable(),
  brief_info: z.string().optional().nullable(),
  min_qualification: z.string().optional().nullable(),
  eligibility_summary: z.string().optional().nullable(),
  salary_range: z.string().optional().nullable(),
  in_hand_salary: z.string().optional().nullable(),

  // ✅ डेसिमल उम्र सपोर्ट (16.5, 19.5 आदि के लिए बिना .int() के)
  min_age: z.number().min(14).max(65).optional().nullable(),
  max_age: z.number().min(14).max(65).optional().nullable(),
  age_limit: z.string().optional().nullable(),
  age_as_on: d.optional().nullable(),
  age_rules: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    relax: z.record(z.number()).optional(),
    female_extra: z.number().optional(),
  }).optional().nullable(),

  // तारीखें (Dates)
  application_start: d.optional().nullable(),
  last_date: d.optional().nullable(),
  fee_last_date: d.optional().nullable(),
  exam_date: z.string().optional().nullable(),
  admit_card_date: z.string().optional().nullable(),

  // फ़ीस (Application Fees)
  application_fee: z.string().optional().nullable(),
  fee_gen_obc_ews: z.number().optional().nullable(),
  fee_sc_st_ph: z.number().optional().nullable(),
  fee_female: z.number().optional().nullable(),

  // लिंक्स (Links)
  source_url: url,
  official_website: url.optional().nullable(),
  notification_url: url.optional().nullable(),
  notification_pdf_url: url.optional().nullable(),
  apply_online_url: url.optional().nullable(),
  admit_card_url: url.optional().nullable(),
  result_url: url.optional().nullable(),

  // अतिरिक्त विवरण
  selection_steps: z.array(z.string()).optional().nullable(),
  exam_pattern: z.array(z.object({ subject: z.string(), questions: z.number(), marks: z.number() })).optional().nullable(),
  syllabus_hindi: z.string().optional().nullable(),
  previous_cutoff: z.record(z.string()).optional().nullable(),
  photo_rules: z.object({
    min_kb: z.number().optional(),
    max_kb: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    date_strip: z.boolean().optional(),
  }).optional().nullable(),
  photo_guidelines: z.string().optional().nullable(),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional().nullable(),
  full_description: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  district_wise: z.boolean().optional().nullable(),
  update_kind: z.string().optional().nullable(),
  update_note: z.string().optional().nullable(),
});

// ✅ mode और verified को optional बनाया गया ताकि एडमिन से सीधा पोस्ट हो सके
export const ImportBody = z.object({
  jobs: z.array(JobInput).min(1).max(25),
  mode: z.enum(['check', 'draft', 'publish']).optional().default('publish'),
  verified: z.boolean().optional().default(true),
  check_only: z.boolean().optional(),
});