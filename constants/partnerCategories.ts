import type { PartnerCategory } from '@/types/database';

export const PARTNER_CATEGORIES: { value: PartnerCategory; labelEn: string; labelNp: string }[] =
  [
    { value: 'restaurant', labelEn: 'Restaurant', labelNp: 'रेस्टुरेन्ट' },
    { value: 'bakery', labelEn: 'Bakery', labelNp: 'बेकरी' },
    { value: 'hotel', labelEn: 'Hotel', labelNp: 'होटेल' },
    { value: 'dhaba', labelEn: 'Dhaba', labelNp: 'ढाबा' },
    { value: 'cafe', labelEn: 'Cafe', labelNp: 'क्याफे' },
    { value: 'supermarket', labelEn: 'Supermarket', labelNp: 'सुपरमार्केट' },
  ];
