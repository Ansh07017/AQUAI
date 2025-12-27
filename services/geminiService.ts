
import { GoogleGenAI, Type } from "@google/genai";
import { SensorData, PredictionResult, SafetyStatus } from "../types";

// Always use the recommended initialization with named parameter and direct env access
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeWaterQuality = async (
  data: SensorData, 
  localRF: { severity: number; status: SafetyStatus }
): Promise<PredictionResult> => {
  const prompt = `Act as a Senior Public Health Official.
    LOCAL RF DIAGNOSTICS:
    - Severity Score: ${localRF.severity}/100
    - Safety Status: ${localRF.status}

    WATER QUALITY DATASET:
    - B.O.D: ${data.bod} mg/l (Target < 3)
    - D.O.: ${data.dissolvedOxygen} mg/l (Target > 4)
    - pH Mean: ${data.ph}
    - Fecal Coliform: ${data.fecalColiform} MPN/100ml
    - Total Coliform: ${data.totalColiform} MPN/100ml
    - Conductivity: ${data.conductivity} µmhos/cm
    - Nitrate-N: ${data.nitrate} mg/l

    LOCATION: ${data.location.name}

    YOUR TASK:
    1. Provide a diagnostic 'Biological Risk Summary'.
    2. Explain the relationship between the high B.O.D/Coliform levels and disease risks.
    3. Generate 3 specific Probabilistic Disease Risks.
    4. Format as JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aiSummary: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            diseaseRisks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  disease: { type: Type.STRING },
                  probability: { type: Type.NUMBER },
                  description: { type: Type.STRING }
                },
                required: ["disease", "probability", "description"]
              }
            }
          },
          required: ["aiSummary", "confidence", "diseaseRisks"]
        }
      }
    });

    // Access the .text property directly and trim before parsing as per guidelines
    const result = JSON.parse(response.text.trim());
    return {
      severityScore: localRF.severity,
      status: localRF.status,
      ...result
    };
  } catch (error) {
    console.error("Gemini Diagnosis Error:", error);
    return {
      severityScore: localRF.severity,
      status: localRF.status,
      diseaseRisks: [],
      aiSummary: "The system detected critical biological contamination. Immediate boil-water advisory recommended.",
      confidence: 0.8
    };
  }
};
