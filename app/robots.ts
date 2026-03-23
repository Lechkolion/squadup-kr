import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://squadup-kr.up.railway.app';
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/me', '/dashboard', '/requests'] },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
