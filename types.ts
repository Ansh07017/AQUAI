
export enum WaterSourceCategory {
  RIVER = 'River',
  GROUND_WATER = 'Ground Water',
  MED_MIN_RIVERS = 'Med Min Rivers',
  PONDS_LAKES = 'Ponds/Lakes',
  DRAINS = 'Drains'
}

export enum DataMode {
  SIMULATED = 'SIMULATED',
  MANUAL = 'MANUAL',
  HARDWARE = 'HARDWARE'
}

export enum HardwareStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export interface SensorData {
  id: string;
  timestamp: Date;
  ph: number;
  turbidity: number;
  tds: number;
  temperature: number;
  dissolvedOxygen: number;
  conductivity: number;
  bod: number;
  nitrate: number;
  fecalColiform: number;
  totalColiform: number;
  location: {
    lat: number;
    lng: number;
    name: string;
    state?: string;
  };
  category: WaterSourceCategory;
  rawBuffer?: string; // Hardware mode only
}

export enum SafetyStatus {
  SAFE = 'SAFE',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL'
}

export interface DiseaseRisk {
  disease: string;
  probability: number;
  description: string;
}

export interface PredictionResult {
  severityScore: number;
  bioHazardScore: number;
  status: SafetyStatus;
  confidence: number;
  rootCause: string;
  reliabilityIndex: number;
  counterfactual: string; 
  policyRecommendation: string;
  diseaseRisks: DiseaseRisk[];
  aiSummary: string;
  modelType: string;
}
