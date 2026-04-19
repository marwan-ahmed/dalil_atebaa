import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // Using an environment variable or default placeholder for the host. 
  // It's recommended to replace this with your actual production URL.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://samarra-doctors.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/_next/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
