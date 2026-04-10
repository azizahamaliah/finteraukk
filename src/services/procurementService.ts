import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateProcurementInsight(data: any) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this sales and inventory data to provide procurement recommendations. 
      The goal is to optimize stock levels, reduce waste, and ensure efficient material usage.
      
      Data: ${JSON.stringify(data)}
      
      Return the response in JSON format with the following structure:
      {
        "summary": "string",
        "recommendations": [
          {
            "item_name": "string",
            "action": "RESTOCK" | "REDUCE" | "MAINTAIN",
            "reason": "string",
            "estimated_need": "number",
            "unit": "string"
          }
        ],
        "efficiency_score": "number (0-100)",
        "waste_risk_level": "LOW" | "MEDIUM" | "HIGH"
      }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item_name: { type: Type.STRING },
                  action: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  estimated_need: { type: Type.NUMBER },
                  unit: { type: Type.STRING }
                },
                required: ["item_name", "action", "reason", "estimated_need", "unit"]
              }
            },
            efficiency_score: { type: Type.NUMBER },
            waste_risk_level: { type: Type.STRING }
          },
          required: ["summary", "recommendations", "efficiency_score", "waste_risk_level"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Procurement Insight Error:", error);
    return null;
  }
}
