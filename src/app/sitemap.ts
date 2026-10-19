import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Next.js ko prerender error se rokne ke liye
export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariyogta.com';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let jobUrls = '';

  // Agar build ke waqt supabase keys na milein toh crash na ho
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: jobs } = await supabase
        .from('jobs')
        .select('slug, updated_at')
        .limit(1000);

      if (jobs && jobs.length > 0) {
        jobUrls = jobs
          .map(
            (job) => `
    <url>
      <loc>${baseUrl}/jobs/${job.slug}</loc>
      <lastmod>${job.updated_at ? new Date(job.updated_at).toISOString() : new Date().toISOString()}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.8</priority>
    </url>`
          )
          .join('');
      }
    } catch {
      // ignore db error during build
    }
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/quiz</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/login</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>${jobUrls}
</urlset>`;

  return new NextResponse(sitemapXml.trim(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}