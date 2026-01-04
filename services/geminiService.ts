
import { GoogleGenAI, Type } from "@google/genai";
import { SensorData, PredictionResult, SafetyStatus, WaterSourceCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeWaterQuality = async (
  data: SensorData, 
  localStats: { severity: number; bioHazard: number; status: SafetyStatus; confidence: number; reliability: number }
): Promise<PredictionResult> => {
  const prompt = `Act as an Environmental Scientist and Policy Advisor.
    CATEGORY: ${data.category}
    STATUS: ${localStats.status}
    SEVERITY: ${localStats.severity}/100
    BIO-HAZARD POTENTIAL: ${localStats.bioHazard}/100
    
    TELEMETRY:
    - pH: ${data.ph}, BOD: ${data.bod}mg/l, Turbidity: ${data.turbidity}NTU
    - Fecal: ${data.fecalColiform} MPN, Nitrates: ${data.nitrate}mg/l, DO: ${data.dissolvedOxygen}mg/l

    TASK:
    1. INFER ROOT CAUSE: Analyze relationship between Bio-Hazard and Chemical Severity.
    2. COUNTERFACTUAL: State exactly what parameter change would make this SAFE.
    3. POLICY RECOMMENDATION: Provide a professional governance statement.
    4. DISEASE RISKS: 3 specific risks.
    5. SUMMARY: 2-sentence diagnostic.

    Format strictly as JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rootCause: { type: Type.STRING },
            counterfactual: { type: Type.STRING },
            policyRecommendation: { type: Type.STRING },
            aiSummary: { type: Type.STRING },
            diseaseRisks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  disease: { type: Type.STRING },
                  probability: { type: Type.NUMBER },
                  description: { type: Type.STRING }
                }
              }
            }
          },
          required: ["rootCause", "counterfactual", "policyRecommendation", "aiSummary", "diseaseRisks"]
        }
      }
    });

    const result = JSON.parse(response.text.trim());
    return {
      severityScore: localStats.severity,
      bioHazardScore: localStats.bioHazard,
      status: localStats.status,
      confidence: localStats.confidence,
      reliabilityIndex: localStats.reliability,
      ...result,
      modelType: data.category
    };
  } catch (error) {
    console.error("AI Diagnostic Failed:", error);
    return {
      severityScore: localStats.severity,
      bioHazardScore: localStats.bioHazard,
      status: localStats.status,
      confidence: localStats.confidence,
      reliabilityIndex: localStats.reliability,
      rootCause: "Data Pattern Inconclusive",
      counterfactual: "Standard filtration required",
      policyRecommendation: "Monitor station for next 24 hours",
      aiSummary: "AI analysis unavailable. Reverting to local heuristic models.",
      diseaseRisks: [],
      modelType: data.category
    };
  }
};
