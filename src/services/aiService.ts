import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateFinancialInsight(data: any) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this financial data and provide insights and recommendations. 
      Data: ${JSON.stringify(data)}
      
      Return the response in JSON format with the following structure:
      {
        "type": "CASHFLOW" | "INVENTORY" | "BUDGET" | "PROMO",
        "status": "HEALTHY" | "CAUTION" | "CRITICAL",
        "title": "string",
        "message": "string",
        "recommendation": "string"
      }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            status: { type: Type.STRING },
            title: { type: Type.STRING },
            message: { type: Type.STRING },
            recommendation: { type: Type.STRING }
          },
          required: ["type", "status", "title", "message", "recommendation"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Insight Error:", error);
    return null;
  }
}
