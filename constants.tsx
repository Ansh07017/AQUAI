
export const COLORS = {
  SAFE: '#00E676', 
  WARNING: '#FFD600', 
  CRITICAL: '#FF1744', 
  PRIMARY: '#2196F3', 
  SURFACE: '#0F141A',
  BACKGROUND: '#06090D',
  BORDER: '#1E262F',
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: '#8A949D',
};

export const SOURCE_LIMITS: Record<string, any> = {
  'River': { ph: [6.5, 8.5], bod: 3, tds: 500, fecal: 500 },
  'Ground Water': { ph: [6.5, 8.5], bod: 1, tds: 1000, fecal: 0 },
  'Drains': { ph: [5.5, 9.0], bod: 30, tds: 2100, fecal: 10000 },
  'Ponds/Lakes': { ph: [6.5, 8.5], bod: 5, tds: 500, fecal: 1000 },
  'Med Min Rivers': { ph: [6.0, 9.0], bod: 10, tds: 1500, fecal: 2500 }
};

export const MOCK_LOCATIONS = [
  { lat: 28.6139, lng: 77.2090, name: "Yamuna River - Nizamuddin, Delhi", state: "Delhi" },
  { lat: 26.8467, lng: 80.9462, name: "Gomti River - Lucknow", state: "Uttar Pradesh" },
  { lat: 25.3176, lng: 83.0061, name: "Ganga River - Varanasi", state: "Uttar Pradesh" }
];
