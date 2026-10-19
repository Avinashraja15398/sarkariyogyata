import type { MetadataRoute } from 'next';
import { pub } from '@/lib/public';
export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariyogyata.com';
  const { data } = await pub().from('jobs').select('slug,updated_at').eq('status', 'published').limit(5000);
  return [{ url: base }, ...(data ?? []).map(j => ({ url: `${base}/jobs/${j.slug}`, lastModified: j.updated_at }))];
}
