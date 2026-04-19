import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://samarra-doctors.com';

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/directory`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    // In a full production app, you might also hit Firebase here
    // to dynamically gather all doctor profiles and add them to this array
    // so Google immediately indexes every single doctor's direct link.
  ];
}
