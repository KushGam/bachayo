export type Area = {
  id: string;
  name: string;
  nameNp: string;
  latitude: number;
  longitude: number;
};

export type City = {
  id: string;
  name: string;
  nameNp: string;
  latitude: number;
  longitude: number;
  areas: Area[];
};

/** Major cities & towns across Nepal — partners can sign up from anywhere. */
export const CITIES: City[] = [
  {
    id: 'kathmandu',
    name: 'Kathmandu',
    nameNp: 'काठमाडौं',
    latitude: 27.7172,
    longitude: 85.324,
    areas: [
      { id: 'thamel', name: 'Thamel', nameNp: 'ठमेल', latitude: 27.715, longitude: 85.31 },
      { id: 'lazimpat', name: 'Lazimpat', nameNp: 'लाजिम्पाट', latitude: 27.724, longitude: 85.322 },
      { id: 'baneshwor', name: 'Baneshwor', nameNp: 'बानेश्वर', latitude: 27.692, longitude: 85.343 },
      { id: 'maharajgunj', name: 'Maharajgunj', nameNp: 'महाराजगञ्ज', latitude: 27.739, longitude: 85.333 },
      { id: 'baluwatar', name: 'Baluwatar', nameNp: 'बालुवाटार', latitude: 27.73, longitude: 85.327 },
      { id: 'newroad', name: 'New Road', nameNp: 'नयाँ सडक', latitude: 27.704, longitude: 85.309 },
      { id: 'bouddha', name: 'Bouddha', nameNp: 'बौद्ध', latitude: 27.7215, longitude: 85.3617 },
      { id: 'kalanki', name: 'Kalanki', nameNp: 'कलंकी', latitude: 27.693, longitude: 85.28 },
      { id: 'koteshwor', name: 'Koteshwor', nameNp: 'कोटेश्वर', latitude: 27.678, longitude: 85.35 },
      { id: 'kirtipur', name: 'Kirtipur', nameNp: 'कीर्तिपुर', latitude: 27.679, longitude: 85.272 },
    ],
  },
  {
    id: 'lalitpur',
    name: 'Lalitpur',
    nameNp: 'ललितपुर',
    latitude: 27.6588,
    longitude: 85.3247,
    areas: [
      { id: 'patan-durbar', name: 'Patan Durbar Square', nameNp: 'पाटन दरबार क्षेत्र', latitude: 27.6727, longitude: 85.325 },
      { id: 'jawalakhel', name: 'Jawalakhel', nameNp: 'जावलाखेल', latitude: 27.676, longitude: 85.312 },
      { id: 'pulchowk', name: 'Pulchowk', nameNp: 'पुल्चोक', latitude: 27.679, longitude: 85.317 },
      { id: 'kupondole', name: 'Kupondole', nameNp: 'कुपण्डोल', latitude: 27.685, longitude: 85.316 },
      { id: 'satdobato', name: 'Satdobato', nameNp: 'सातदोबाटो', latitude: 27.658, longitude: 85.327 },
      { id: 'lagankhel', name: 'Lagankhel', nameNp: 'लगनखेल', latitude: 27.666, longitude: 85.323 },
    ],
  },
  {
    id: 'bhaktapur',
    name: 'Bhaktapur',
    nameNp: 'भक्तपुर',
    latitude: 27.671,
    longitude: 85.4298,
    areas: [
      { id: 'durbar-square', name: 'Durbar Square', nameNp: 'दरबार स्क्वायर', latitude: 27.672, longitude: 85.428 },
      { id: 'thimi', name: 'Thimi', nameNp: 'थिमि', latitude: 27.68, longitude: 85.387 },
      { id: 'suryabinayak', name: 'Suryabinayak', nameNp: 'सूर्यविनायक', latitude: 27.666, longitude: 85.428 },
      { id: 'kamalbinayak', name: 'Kamalbinayak', nameNp: 'कमलविनायक', latitude: 27.675, longitude: 85.435 },
      { id: 'balkot', name: 'Balkot', nameNp: 'बालकोट', latitude: 27.666, longitude: 85.39 },
    ],
  },
  {
    id: 'pokhara',
    name: 'Pokhara',
    nameNp: 'पोखरा',
    latitude: 28.2096,
    longitude: 83.9856,
    areas: [
      { id: 'lakeside', name: 'Lakeside', nameNp: 'लेकसाइड', latitude: 28.209, longitude: 83.958 },
      { id: 'mahendrapul', name: 'Mahendrapul', nameNp: 'महेन्द्रपुल', latitude: 28.233, longitude: 83.988 },
      { id: 'newroad-pokhara', name: 'New Road', nameNp: 'नयाँ सडक', latitude: 28.22, longitude: 83.995 },
      { id: 'chipledhunga', name: 'Chipledhunga', nameNp: 'चिप्लेढुंगा', latitude: 28.226, longitude: 83.993 },
      { id: 'damside', name: 'Damside', nameNp: 'डमसाइड', latitude: 28.203, longitude: 83.957 },
      { id: 'zero-km', name: 'Zero KM', nameNp: 'जिरो केएम', latitude: 28.216, longitude: 83.986 },
    ],
  },
  {
    id: 'chitwan',
    name: 'Chitwan (Bharatpur)',
    nameNp: 'चितवन (भरतपुर)',
    latitude: 27.6833,
    longitude: 84.4333,
    areas: [
      { id: 'narayangarh', name: 'Narayangarh', nameNp: 'नारायणगढ', latitude: 27.7, longitude: 84.43 },
      { id: 'bharatpur-center', name: 'Bharatpur Center', nameNp: 'भरतपुर केन्द्र', latitude: 27.678, longitude: 84.434 },
      { id: 'pulchowk-chitwan', name: 'Pulchowk', nameNp: 'पुल्चोक', latitude: 27.685, longitude: 84.42 },
      { id: 'sauraha', name: 'Sauraha', nameNp: 'सौराहा', latitude: 27.585, longitude: 84.505 },
    ],
  },
  {
    id: 'biratnagar',
    name: 'Biratnagar',
    nameNp: 'विराटनगर',
    latitude: 26.4525,
    longitude: 87.2718,
    areas: [
      { id: 'biratnagar-main', name: 'Main Road', nameNp: 'मेन रोड', latitude: 26.455, longitude: 87.28 },
      { id: 'traffic-chowk', name: 'Traffic Chowk', nameNp: 'ट्राफिक चोक', latitude: 26.452, longitude: 87.272 },
      { id: 'rattan-chowk', name: 'Rattan Chowk', nameNp: 'रत्न चोक', latitude: 26.46, longitude: 87.275 },
    ],
  },
  {
    id: 'dharan',
    name: 'Dharan',
    nameNp: 'धरान',
    latitude: 26.812,
    longitude: 87.283,
    areas: [
      { id: 'dharan-bhanu', name: 'Bhanu Chowk', nameNp: 'भानु चोक', latitude: 26.812, longitude: 87.283 },
      { id: 'dharan-bp', name: 'BP Chowk', nameNp: 'बीपी चोक', latitude: 26.816, longitude: 87.28 },
      { id: 'dharan-putali', name: 'Putali Bazar', nameNp: 'पुतली बजार', latitude: 26.81, longitude: 87.285 },
    ],
  },
  {
    id: 'itahari',
    name: 'Itahari',
    nameNp: 'इटहरी',
    latitude: 26.663,
    longitude: 87.274,
    areas: [
      { id: 'itahari-center', name: 'Itahari Center', nameNp: 'इटहरी केन्द्र', latitude: 26.663, longitude: 87.274 },
      { id: 'itahari-line', name: 'Line Chowk', nameNp: 'लाइन चोक', latitude: 26.66, longitude: 87.27 },
    ],
  },
  {
    id: 'birgunj',
    name: 'Birgunj',
    nameNp: 'वीरगञ्ज',
    latitude: 27.0104,
    longitude: 84.877,
    areas: [
      { id: 'birgunj-ghantaghar', name: 'Ghantaghar', nameNp: 'घण्टाघर', latitude: 27.012, longitude: 84.877 },
      { id: 'birgunj-adhikari', name: 'Adhikari Chowk', nameNp: 'अधिकारी चोक', latitude: 27.015, longitude: 84.88 },
      { id: 'birgunj-link', name: 'Link Road', nameNp: 'लिंक रोड', latitude: 27.008, longitude: 84.875 },
    ],
  },
  {
    id: 'janakpur',
    name: 'Janakpur',
    nameNp: 'जनकपुर',
    latitude: 26.7288,
    longitude: 85.925,
    areas: [
      { id: 'janakpur-bhanu', name: 'Bhanu Chowk', nameNp: 'भानु चोक', latitude: 26.729, longitude: 85.925 },
      { id: 'janakpur-ramanand', name: 'Ramanand Chowk', nameNp: 'रामानन्द चोक', latitude: 26.732, longitude: 85.928 },
      { id: 'janakpur-station', name: 'Railway Station', nameNp: 'रेल्वे स्टेशन', latitude: 26.72, longitude: 85.92 },
    ],
  },
  {
    id: 'hetauda',
    name: 'Hetauda',
    nameNp: 'हेटौंडा',
    latitude: 27.428,
    longitude: 85.032,
    areas: [
      { id: 'hetauda-chowk', name: 'Hetauda Chowk', nameNp: 'हेटौंडा चोक', latitude: 27.428, longitude: 85.032 },
      { id: 'hetauda-industrial', name: 'Industrial Area', nameNp: 'औद्योगिक क्षेत्र', latitude: 27.435, longitude: 85.04 },
    ],
  },
  {
    id: 'butwal',
    name: 'Butwal',
    nameNp: 'बुटवल',
    latitude: 27.7006,
    longitude: 83.4483,
    areas: [
      { id: 'butwal-traffic', name: 'Traffic Chowk', nameNp: 'ट्राफिक चोक', latitude: 27.701, longitude: 83.448 },
      { id: 'butwal-golpark', name: 'Golpark', nameNp: 'गोलपार्क', latitude: 27.705, longitude: 83.455 },
      { id: 'butwal-milan', name: 'Milan Chowk', nameNp: 'मिलन चोक', latitude: 27.698, longitude: 83.445 },
    ],
  },
  {
    id: 'bhairahawa',
    name: 'Bhairahawa',
    nameNp: 'भैरहवा',
    latitude: 27.506,
    longitude: 83.45,
    areas: [
      { id: 'bhairahawa-bank', name: 'Bank Road', nameNp: 'बैंक रोड', latitude: 27.506, longitude: 83.45 },
      { id: 'bhairahawa-lumbini', name: 'Lumbini Gate', nameNp: 'लुम्बिनी गेट', latitude: 27.51, longitude: 83.455 },
    ],
  },
  {
    id: 'nepalgunj',
    name: 'Nepalgunj',
    nameNp: 'नेपालगञ्ज',
    latitude: 28.05,
    longitude: 81.6167,
    areas: [
      { id: 'nepalgunj-dhamboji', name: 'Dhamboji', nameNp: 'धम्बोजी', latitude: 28.05, longitude: 81.617 },
      { id: 'nepalgunj-triangle', name: 'Triangle', nameNp: 'ट्रायङ्गल', latitude: 28.053, longitude: 81.62 },
    ],
  },
  {
    id: 'dhangadhi',
    name: 'Dhangadhi',
    nameNp: 'धनगढी',
    latitude: 28.685,
    longitude: 80.608,
    areas: [
      { id: 'dhangadhi-main', name: 'Main Chowk', nameNp: 'मेन चोक', latitude: 28.685, longitude: 80.608 },
      { id: 'dhangadhi-hasanpur', name: 'Hasanpur', nameNp: 'हसनपुर', latitude: 28.69, longitude: 80.61 },
    ],
  },
  {
    id: 'surkhet',
    name: 'Surkhet',
    nameNp: 'सुर्खेत',
    latitude: 28.6,
    longitude: 81.6167,
    areas: [
      { id: 'surkhet-birendranagar', name: 'Birendranagar', nameNp: 'वीरेन्द्रनगर', latitude: 28.6, longitude: 81.617 },
      { id: 'surkhet-airport', name: 'Airport Area', nameNp: 'विमानस्थल क्षेत्र', latitude: 28.586, longitude: 81.636 },
    ],
  },
  {
    id: 'gorkha',
    name: 'Gorkha',
    nameNp: 'गोरखा',
    latitude: 28.0,
    longitude: 84.633,
    areas: [
      { id: 'gorkha-bazar', name: 'Gorkha Bazar', nameNp: 'गोरखा बजार', latitude: 28.0, longitude: 84.633 },
      { id: 'palungtar', name: 'Palungtar', nameNp: 'पालुङटार', latitude: 28.051, longitude: 84.485 },
      { id: 'thantipokhari', name: 'Thantipokhari', nameNp: 'ठान्तिपोखरी', latitude: 28.04, longitude: 84.5 },
    ],
  },
  {
    id: 'kavre',
    name: 'Kavre (Banepa)',
    nameNp: 'काभ्रे (बनेपा)',
    latitude: 27.633,
    longitude: 85.522,
    areas: [
      { id: 'banepa', name: 'Banepa', nameNp: 'बनेपा', latitude: 27.633, longitude: 85.522 },
      { id: 'dhulikhel', name: 'Dhulikhel', nameNp: 'धुलिखेल', latitude: 27.62, longitude: 85.55 },
      { id: 'panauti', name: 'Panauti', nameNp: 'पनौती', latitude: 27.585, longitude: 85.52 },
    ],
  },
  {
    id: 'damak',
    name: 'Damak',
    nameNp: 'दमक',
    latitude: 26.66,
    longitude: 87.7,
    areas: [
      { id: 'damak-center', name: 'Damak Center', nameNp: 'दमक केन्द्र', latitude: 26.66, longitude: 87.7 },
      { id: 'damak-highway', name: 'Highway Area', nameNp: 'हाइवे क्षेत्र', latitude: 26.655, longitude: 87.695 },
    ],
  },
  {
    id: 'tansen',
    name: 'Tansen (Palpa)',
    nameNp: 'तानसेन (पाल्पा)',
    latitude: 27.867,
    longitude: 83.547,
    areas: [
      { id: 'tansen-bazar', name: 'Tansen Bazar', nameNp: 'तानसेन बजार', latitude: 27.867, longitude: 83.547 },
      { id: 'tansen-sitalpati', name: 'Sitalpati', nameNp: 'सितलपाटी', latitude: 27.87, longitude: 83.55 },
    ],
  },
  {
    id: 'other-nepal',
    name: 'Other (Nepal)',
    nameNp: 'अन्य (नेपाल)',
    latitude: 28.3949,
    longitude: 84.124,
    areas: [
      {
        id: 'other-area',
        name: 'My restaurant area',
        nameNp: 'मेरो रेस्टुरेन्ट क्षेत्र',
        latitude: 28.3949,
        longitude: 84.124,
      },
    ],
  },
];

export const DEFAULT_CITY_ID = 'kathmandu';
export const DEFAULT_AREA_ID = 'thamel';
