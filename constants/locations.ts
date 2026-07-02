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
    ],
  },
  {
    id: 'bharatpur',
    name: 'Bharatpur',
    nameNp: 'भरतपुर',
    latitude: 27.677,
    longitude: 84.435,
    areas: [
      { id: 'narayangarh', name: 'Narayangarh', nameNp: 'नारायणगढ', latitude: 27.685, longitude: 84.433 },
      { id: 'bharatpur-chowk', name: 'Bharatpur Chowk', nameNp: 'भरतपुर चोक', latitude: 27.677, longitude: 84.435 },
      { id: 'pulchowk-cht', name: 'Pulchowk', nameNp: 'पुलचोक', latitude: 27.67, longitude: 84.428 },
      { id: 'sauraha-rd', name: 'Sauraha Road', nameNp: 'सौराहा सडक', latitude: 27.65, longitude: 84.49 },
    ],
  },
];

export const DEFAULT_CITY_ID = 'kathmandu';
export const DEFAULT_AREA_ID = 'thamel';
