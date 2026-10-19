import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariyogta.com';

  const defaultRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/quiz`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return defaultRoutes;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: jobs } = await supabase
      .from('jobs')
      .select('slug, updated_at')
      .limit(1000);

    if (!jobs || jobs.length === 0) {
      return defaultRoutes;
    }

    const jobRoutes: MetadataRoute.Sitemap = jobs.map((job) => ({
      url: `${baseUrl}/jobs/${job.slug}`,
      lastModified: job.updated_at ? new Date(job.updated_at) : new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    return [...defaultRoutes, ...jobRoutes];
  } catch {
    return defaultRoutes;
  }
}