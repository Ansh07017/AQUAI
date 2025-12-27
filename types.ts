
export interface SensorData {
  id: string;
  timestamp: Date;
  ph: number;
  turbidity: number;
  tds: number;
  temperature: number;
  dissolvedOxygen: number; // D.O.
  conductivity: number;
  bod: number; // B.O.D.
  nitrate: number; // Nitrate-N + Nitrite-N
  fecalColiform: number;
  totalColiform: number;
  location: {
    lat: number;
    lng: number;
    name: string;
    state?: string;
  };
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
  status: SafetyStatus;
  diseaseRisks: DiseaseRisk[];
  aiSummary: string;
  confidence: number;
}

export interface FeedbackLog {
  predictionId: string;
  actualStatus: SafetyStatus;
  isAccurate: boolean;
  notes: string;
  timestamp: Date;
}
