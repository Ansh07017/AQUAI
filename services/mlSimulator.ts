
import { SensorData, SafetyStatus, DiseaseRisk, WaterSourceCategory } from "../types";

// Rolling Value Helper: Prevents erratic jumps in simulation
export const generateRollingValue = (prev: number, min: number, max: number, volatility: number = 0.05) => {
  const change = (Math.random() * 2 - 1) * volatility * (max - min);
  let next = prev + change;
  return Math.min(max, Math.max(min, next));
};

export const randomForestRegressor = (data: SensorData): number => {
  let score = 0;
  // Severity focuses on chemical/physical stability
  score += (Math.abs(data.ph - 7.2) * 12);
  score += (data.turbidity * 1.8);
  score += (data.tds / 120);
  score += (data.nitrate * 2.5);
  return Math.min(100, Math.max(5, score));
};

export const calculateBioHazardScore = (data: SensorData): number => {
  let score = 0;
  // Specialized logic for Biological Load
  score += (data.bod * 5.5);
  score += (Math.log10(data.fecalColiform + 1) * 14);
  const doDeficit = Math.max(0, 7.5 - data.dissolvedOxygen);
  score += (doDeficit * 6);
  return Math.min(100, Math.max(0, score));
};

export const randomForestClassifier = (severity: number, data: SensorData): SafetyStatus => {
  if (severity > 75) return SafetyStatus.CRITICAL;
  if (severity > 35) return SafetyStatus.WARNING;
  return SafetyStatus.SAFE;
};

export const calculateConfidence = (data: SensorData, severity: number): number => {
  let conf = 0.98;
  if (severity > 85) conf -= 0.1;
  if (data.ph < 5 || data.ph > 9.5) conf -= 0.05;
  return conf;
};

export const calculateReliabilityIndex = (history: any[]): number => {
  if (history.length === 0) return 94;
  const safeCount = history.filter(h => h.prediction.status === SafetyStatus.SAFE).length;
  return Math.round((safeCount / history.length) * 100);
};

export const predictDiseaseProbabilities = (data: SensorData): DiseaseRisk[] => {
  return [
    { disease: "Cholera", probability: Math.min(0.9, data.fecalColiform / 12000), description: "High risk in dense organic discharge." },
    { disease: "Typhoid", probability: Math.min(0.85, data.bod / 20), description: "Common in stagnant surface water." },
    { disease: "Hepatitis A", probability: Math.min(0.7, data.fecalColiform / 8000), description: "Viral load proxy in domestic runoff." }
  ];
};
