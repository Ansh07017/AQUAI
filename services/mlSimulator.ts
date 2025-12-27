
import { SensorData, SafetyStatus, DiseaseRisk } from "../types";

export const SAMPLE_DATASET = [
  { ph: 7.2, do: 6.5, bod: 1.2, fecal: 450, severity: 10, status: SafetyStatus.SAFE },
  { ph: 6.1, do: 3.5, bod: 4.8, fecal: 3200, severity: 55, status: SafetyStatus.WARNING },
  { ph: 8.9, do: 2.1, bod: 12.5, fecal: 15000, severity: 92, status: SafetyStatus.CRITICAL },
  { ph: 7.0, do: 1.5, bod: 22.0, fecal: 45000, severity: 98, status: SafetyStatus.CRITICAL },
  { ph: 7.5, do: 5.8, bod: 2.5, fecal: 1200, severity: 25, status: SafetyStatus.SAFE },
];

/**
 * Enhanced Random Forest Regressor Simulation
 * Now accounts for B.O.D and Fecal Coliform counts
 */
export const randomForestRegressor = (data: SensorData): number => {
  let score = 0;
  
  // Weights based on standard water quality index
  score += (data.ph < 6.5 || data.ph > 8.5 ? 15 : 0);
  score += (data.dissolvedOxygen < 4 ? 20 : 0);
  score += (data.bod > 3 ? (data.bod > 10 ? 25 : 15) : 0);
  score += (data.fecalColiform > 2500 ? (data.fecalColiform > 10000 ? 30 : 20) : 0);
  score += (data.nitrate > 10 ? 10 : 0);
  
  // Normalizing to 0-100
  return Math.min(100, Math.max(5, score + (Math.random() * 5)));
};

/**
 * Enhanced Random Forest Classifier
 */
export const randomForestClassifier = (severity: number, data: SensorData): SafetyStatus => {
  if (severity > 75 || data.fecalColiform > 5000 || data.bod > 15 || data.dissolvedOxygen < 2) {
    return SafetyStatus.CRITICAL;
  }
  if (severity > 30 || data.fecalColiform > 1000 || data.bod > 3) {
    return SafetyStatus.WARNING;
  }
  return SafetyStatus.SAFE;
};

/**
 * Probabilistic Disease Prediction aligned with Fecal indicators
 */
export const predictDiseaseProbabilities = (data: SensorData): DiseaseRisk[] => {
  const fecalFactor = data.fecalColiform / 10000;
  
  return [
    {
      disease: "Cholera Outbreak Risk",
      probability: Math.min(0.99, fecalFactor * 1.2),
      description: "Direct correlation with high Fecal Coliform counts and low Dissolved Oxygen."
    },
    {
      disease: "Typhoid Fever",
      probability: Math.min(0.95, (data.fecalColiform / 15000) + (data.bod / 50)),
      description: "Risk high in domestic waste contaminated zones (high B.O.D)."
    },
    {
      disease: "Infectious Hepatitis",
      probability: Math.min(0.9, (data.totalColiform / 20000)),
      description: "Based on total biological contamination levels."
    }
  ];
};
