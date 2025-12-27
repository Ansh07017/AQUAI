
export const COLORS = {
  SAFE: '#10b981', 
  WARNING: '#f59e0b', 
  CRITICAL: '#ef4444', 
  DISEASE: '#8b5cf6', 
  PRIMARY: '#0ea5e9', 
  SECONDARY: '#64748b', 
};

export const SEVERITY_THRESHOLDS = {
  SAFE: 30,
  WARNING: 70
};

export const SENSOR_THRESHOLDS = {
  PH: { min: 6.5, max: 8.5 },
  DO: { min: 4 }, // D.O. should be > 4
  BOD: { max: 3 }, // B.O.D. should be < 3
  FECAL_COLIFORM: { max: 2500 }, // Threshold < 2500 MPN
  TOTAL_COLIFORM: { max: 5000 }, // Threshold < 5000 MPN
};

export const MOCK_LOCATIONS = [
  { lat: 28.6139, lng: 77.2090, name: "Yamuna River - Nizamuddin, Delhi", state: "Delhi" },
  { lat: 26.8467, lng: 80.9462, name: "Gomti River - Near Kudiya Ghat, Lucknow", state: "Uttar Pradesh" },
  { lat: 25.3176, lng: 83.0061, name: "Ganga River - Assi Ghat, Varanasi", state: "Uttar Pradesh" },
  { lat: 17.3850, lng: 78.4867, name: "Musi River - Hyderabad Metro Area", state: "Telangana" }
];

export const WATER_QUALITY_INDICATORS = [
  {
    name: "pH Value",
    description: "Measures how acidic or alkaline the water is. The neutral range (6.5 - 8.5) is essential for chemical balance and safe consumption.",
    impact: "Extreme values can corrode pipes and harm aquatic ecosystems."
  },
  {
    name: "B.O.D (Biochemical Oxygen Demand)",
    description: "Indicates the amount of organic pollution. High BOD means bacteria are consuming too much oxygen to break down waste.",
    impact: "Levels above 3 mg/l often indicate untreated sewage contamination."
  },
  {
    name: "D.O. (Dissolved Oxygen)",
    description: "The amount of gaseous oxygen dissolved in the water. Vital for the survival of fish and other aquatic organisms.",
    impact: "Low D.O. leads to 'dead zones' where nothing can survive."
  },
  {
    name: "Coliform Bacteria (Fecal/Total)",
    description: "Microscopic organisms that originate from human or animal waste. Used as a proxy for dangerous pathogens like Cholera.",
    impact: "High counts (>2500 MPN) represent a severe immediate health risk."
  },
  {
    name: "Conductivity",
    description: "Measures the water's ability to pass an electrical current, which correlates with dissolved salts and minerals.",
    impact: "Sudden spikes often indicate industrial discharge or agricultural runoff."
  }
];
