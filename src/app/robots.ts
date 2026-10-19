import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // Fallback domain rakhna zaroori hai taaki env miss hone par sitemap khali na ho jaye
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariyogyata.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'], // Trailing slash lagane se sub-pages (/admin/dashboard etc.) pakke block hote hain
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}