import type { Locale } from '@/store/useAuthStore';

type TranslationKey =
  | 'tagline'
  | 'customerCta'
  | 'partnerCta'
  | 'googleCta'
  | 'phoneTitle'
  | 'phoneSubtitle'
  | 'phonePlaceholder'
  | 'sendOtp'
  | 'verifyTitle'
  | 'verifySubtitle'
  | 'resendOtp'
  | 'resendIn'
  | 'verify'
  | 'invalidPhone'
  | 'otpRequired'
  | 'otpInvalid'
  | 'authError'
  | 'step'
  | 'next'
  | 'back'
  | 'finish'
  | 'partnerStep1Title'
  | 'partnerStep2Title'
  | 'partnerStep3Title'
  | 'nameEn'
  | 'nameNp'
  | 'category'
  | 'address'
  | 'coverPhoto'
  | 'tapToUpload'
  | 'selectLocation'
  | 'saving'
  | 'partnerWelcomeTitle'
  | 'partnerBenefit1'
  | 'partnerBenefit2'
  | 'partnerBenefit3'
  | 'getStarted'
  | 'confirmLocation'
  | 'locationConfirmed'
  | 'listingPreview'
  | 'goLive'
  | 'takePhoto'
  | 'chooseGallery'
  | 'businessPhone';

const translations: Record<Locale, Record<TranslationKey, string>> = {
  en: {
    tagline: 'Save food. Save money.',
    customerCta: "I'm a customer",
    partnerCta: "I'm a restaurant / bakery",
    googleCta: 'Continue with Google',
    phoneTitle: 'Enter your phone',
    phoneSubtitle: "We'll send a one-time code to verify your number.",
    phonePlaceholder: '98XXXXXXXX',
    sendOtp: 'Send OTP',
    verifyTitle: 'Enter verification code',
    verifySubtitle: 'Sent to +977 {phone}',
    resendOtp: 'Resend code',
    resendIn: 'Resend in {seconds}s',
    verify: 'Verify',
    invalidPhone: 'Enter a valid Nepal mobile number (97 or 98).',
    otpRequired: 'Enter the 6-digit code.',
    otpInvalid: 'Invalid code. Please try again.',
    authError: 'Something went wrong. Please try again.',
    step: 'Step {current} of {total}',
    next: 'Continue',
    back: 'Back',
    finish: 'Complete setup',
    partnerStep1Title: 'Business basics',
    partnerStep2Title: 'Location',
    partnerStep3Title: 'Photo & finish',
    nameEn: 'Name (English)',
    nameNp: 'Name (Nepali)',
    category: 'Category',
    address: 'Address',
    coverPhoto: 'Cover photo',
    tapToUpload: 'Tap to upload a cover image',
    selectLocation: 'Drag the pin to your location',
    saving: 'Saving...',
    partnerWelcomeTitle: 'Grow your business, reduce waste',
    partnerBenefit1: 'Sell unsold food instead of throwing it away',
    partnerBenefit2: 'Get paid instantly via eSewa or Khalti',
    partnerBenefit3: 'Reach hundreds of nearby customers daily',
    getStarted: 'Get started',
    confirmLocation: 'Confirm location',
    locationConfirmed: 'Location confirmed',
    listingPreview: 'How your listing will look',
    goLive: 'Go live',
    takePhoto: 'Take photo',
    chooseGallery: 'Choose from gallery',
    businessPhone: 'Business phone number',
  },
  np: {
    tagline: 'खाना बचाऔं। पैसा बचाऔं।',
    customerCta: 'म ग्राहक हुँ',
    partnerCta: 'म रेस्टुरेन्ट / बेकरी हुँ',
    googleCta: 'Google बाट जारी राख्नुहोस्',
    phoneTitle: 'फोन नम्बर हाल्नुहोस्',
    phoneSubtitle: 'प्रमाणीकरणका लागि एक पटकको कोड पठाउँछौं।',
    phonePlaceholder: '98XXXXXXXX',
    sendOtp: 'OTP पठाउनुहोस्',
    verifyTitle: 'प्रमाणीकरण कोड हाल्नुहोस्',
    verifySubtitle: '+977 {phone} मा पठाइयो',
    resendOtp: 'कोड पुन: पठाउनुहोस्',
    resendIn: '{seconds}s मा पुन: पठाउन सकिन्छ',
    verify: 'प्रमाणित गर्नुहोस्',
    invalidPhone: 'मान्य नेपाली मोबाइल नम्बर हाल्नुहोस् (97 वा 98)।',
    otpRequired: '६ अङ्कको कोड हाल्नुहोस्।',
    otpInvalid: 'कोड गलत छ। फेरि प्रयास गर्नुहोस्।',
    authError: 'केही गडबड भयो। फेरि प्रयास गर्नुहोस्।',
    step: 'चरण {current} / {total}',
    next: 'अगाडि बढ्नुहोस्',
    back: 'पछाडि',
    finish: 'सेटअप पूरा गर्नुहोस्',
    partnerStep1Title: 'व्यवसायको आधारभूत विवरण',
    partnerStep2Title: 'स्थान',
    partnerStep3Title: 'फोटो र समापन',
    nameEn: 'नाम (अंग्रेजी)',
    nameNp: 'नाम (नेपाली)',
    category: 'श्रेणी',
    address: 'ठेगाना',
    coverPhoto: 'कभर फोटो',
    tapToUpload: 'कभर तस्बिर अपलोड गर्न ट्याप गर्नुहोस्',
    selectLocation: 'पिन तानेर आफ्नो स्थान छान्नुहोस्',
    saving: 'सेभ हुँदैछ...',
    partnerWelcomeTitle: 'व्यवसाय बढाऔं, फोहोर घटाऔं',
    partnerBenefit1: 'फाल्नुभन्दा नबिकेको खाना बेच्नुहोस्',
    partnerBenefit2: 'eSewa वा Khalti मार्फत तुरुन्तै भुक्तानी पाउनुहोस्',
    partnerBenefit3: 'दैनिक सयौं नजिकका ग्राहकहरूसम्म पुग्नुहोस्',
    getStarted: 'सुरु गर्नुहोस्',
    confirmLocation: 'स्थान पुष्टि गर्नुहोस्',
    locationConfirmed: 'स्थान पुष्टि भयो',
    listingPreview: 'तपाईंको लिस्टिङ कस्तो देखिनेछ',
    goLive: 'लाइभ जानुहोस्',
    takePhoto: 'फोटो खिच्नुहोस्',
    chooseGallery: 'ग्यालरीबाट छान्नुहोस्',
    businessPhone: 'व्यवसाय फोन नम्बर',
  },
};

export function t(locale: Locale, key: TranslationKey, vars?: Record<string, string | number>) {
  let text = translations[locale][key];
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  return text;
}
