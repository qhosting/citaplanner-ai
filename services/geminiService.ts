import { GoogleGenAI, Type } from "@google/genai";
import { AIParsedAppointment } from "../types";

const apiKey = process.env.API_KEY;
// Initialize securely - assumes process.env.API_KEY is available in the environment
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const parseAppointmentRequest = async (input: string): Promise<AIParsedAppointment | null> => {
  if (!ai) {
    console.error("Gemini API Key is missing.");
    throw new Error("Falta la API Key");
  }

  const now = new Date().toISOString();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Instrucciones actualizadas para español
  const systemInstruction = `
    Eres un asistente inteligente de agenda para CitaPlanner.
    Tu tarea es extraer detalles de citas a partir de texto en lenguaje natural (principalmente en español).
    
    Hora de Referencia Actual: ${now}
    Zona Horaria del Usuario: ${timeZone}
    
    Reglas:
    1. Analiza fechas relativas (ej: "mañana", "el próximo viernes", "pasado mañana") basándote en la Hora de Referencia Actual.
    2. La duración predeterminada es de 1 hora si no se especifica.
    3. Devuelve las fechas en formato estricto ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ).
    4. Si el usuario menciona el nombre de una persona, asígnalo a 'clientName'.
    5. Si detectas un número de teléfono o mención de contacto, extráelo a 'clientPhone'.
    6. Traduce o mantén el título y la descripción en el idioma de entrada (preferiblemente español).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: input,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Resumen corto de la cita" },
            startDateTime: { type: Type.STRING, description: "Fecha y hora de inicio ISO 8601" },
            endDateTime: { type: Type.STRING, description: "Fecha y hora de fin ISO 8601" },
            clientName: { type: Type.STRING, description: "Nombre del cliente si se menciona" },
            clientPhone: { type: Type.STRING, description: "Número de teléfono del cliente" },
            description: { type: Type.STRING, description: "Detalles adicionales" },
          },
          required: ["title", "startDateTime", "endDateTime"],
        },
      },
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text) as AIParsedAppointment;
  } catch (error) {
    console.error("Error parsing appointment with Gemini:", error);
    return null;
  }
};