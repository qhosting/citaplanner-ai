
import { Type } from "@google/genai";
import { AIParsedAppointment, Service } from "../types";
import { api } from "./api";

// NO IMPORTAMOS GoogleGenAI aquí. Usamos api.generateAIContent.

export const parseAppointmentRequest = async (input: string): Promise<AIParsedAppointment | null> => {
  const now = new Date().toISOString();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const systemInstruction = `
    Eres "Citaplanner AI", el asistente inteligente de una plataforma SaaS líder para la gestión de negocios de belleza elite.
    Tu tarea es extraer detalles de citas que los administradores o clientes ingresan en lenguaje natural.
    
    Hora de Referencia Actual: ${now}
    Zona Horaria: ${timeZone}
    
    Reglas de Oro:
    1. Interpreta fechas relativas (mañana, próximo martes, etc.) con precisión.
    2. El tono es profesional, eficiente y sofisticado.
    3. Si el usuario no especifica servicio, asume "Tratamiento General Citaplanner".
    4. Formato de salida: JSON estricto.
  `;

  try {
    const response = await api.generateAIContent({
      model: "gemini-3-flash-preview",
      contents: input,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Servicio Citaplanner" },
            startDateTime: { type: Type.STRING, description: "ISO 8601" },
            endDateTime: { type: Type.STRING, description: "ISO 8601" },
            clientName: { type: Type.STRING },
            clientPhone: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ["title", "startDateTime", "endDateTime"],
        },
      },
    });

    return JSON.parse(response.text) as AIParsedAppointment;
  } catch (error) {
    console.error("Citaplanner AI Error:", error);
    return null;
  }
};

export const answerServiceQuery = async (customerMessage: string, catalog: Service[]): Promise<string> => {
  const catalogContext = catalog.map(s => `- ${s.name}: $${s.price} (Duración: ${s.duration} min). Desc: ${s.description}`).join('\n');

  const systemInstruction = `
    Eres el Concierge Digital de un prestigioso estudio de belleza avanzada.
    Tu objetivo es responder dudas sobre servicios y precios basándote EXCLUSIVAMENTE en el catálogo proporcionado.
    
    CATÁLOGO ACTUAL:
    ${catalogContext}
    
    REGLAS:
    1. Si el cliente pregunta por un precio, dáselo con elegancia.
    2. Si el servicio no está en el catálogo, indica que no lo tenemos pero ofrece el más parecido o invita a una valoración.
    3. Usa un tono extremadamente educado, lujoso y acogedor.
    4. Mantén la respuesta breve (máximo 50 palabras).
    5. No inventes precios ni servicios.
  `;

  try {
    const response = await api.generateAIContent({
      model: "gemini-3-flash-preview",
      contents: customerMessage,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text || "Lo siento, no he podido procesar tu solicitud en este momento. Por favor, contacta con un agente humano.";
  } catch (error) {
    console.error("AI Catalog Query Error:", error);
    return "Nuestras líneas digitales están experimentando alta demanda. Un especialista te atenderá en breve.";
  }
};
