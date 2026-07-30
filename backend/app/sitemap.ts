import type { MetadataRoute } from 'next';

const BASE_URL = 'https://lastbag.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: BASE_URL, lastModified, changeFrequency: 'weekly', priority: 1 },
    {
      url: `${BASE_URL}/for-restaurants`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    { url: `${BASE_URL}/about`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    {
      url: `${BASE_URL}/legal/privacy`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    { url: `${BASE_URL}/legal/terms`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
