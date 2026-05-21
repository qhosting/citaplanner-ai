import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.API_KEY || "");

/**
 * Evalúa el riesgo de inasistencia ("No-Show") de una cita utilizando Gemini AI.
 * Analiza el historial real de comportamiento del cliente en base de datos.
 * 
 * @param {Object} appointment Datos de la cita actual.
 * @param {Object} clientHistory Historial de asistencia acumulado del cliente.
 * @returns {Promise<Object>} Resultado del análisis predictivo.
 */
export const predictNoShowRisk = async (appointment, clientHistory) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!apiKey) {
            console.warn("[GEMINI PREDICT] Missing GEMINI_API_KEY. Returning default safe evaluation.");
            return {
                noShowProbability: 0.1,
                riskLevel: "LOW",
                rationales: ["No se configuró la API key de Gemini. Evaluación por defecto."],
                actionPlan: "Proceder de forma regular."
            };
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Analiza el riesgo de que el cliente no asista a su cita ("No-Show").
        
        INFORMACIÓN DE LA CITA ACTUAL:
        - Título del servicio: ${appointment.title || "No especificado"}
        - Fecha y Hora de la Cita: ${appointment.startDateTime}
        - Notas de la cita: ${appointment.notes || "Ninguna"}

        HISTORIAL DEL CLIENTE:
        - Nombre: ${appointment.clientName || "Desconocido"}
        - Total citas completadas: ${clientHistory.completedCount || 0}
        - Total citas canceladas / inasistencias: ${clientHistory.cancelledCount || 0}
        
        INSTRUCCIONES:
        1. Evalúa críticamente si el cliente representa un riesgo de inasistencia ("No-Show").
        2. Clientes con cancelaciones previas altas representarán mayor riesgo.
        3. Citas en fines de semana o a última hora de la tarde pueden tener un perfil de riesgo diferente.
        4. Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura exacta:
        {
          "noShowProbability": <float entre 0 y 1>,
          "riskLevel": "<LOW, MEDIUM, o HIGH>",
          "rationales": ["razón 1", "razón 2"],
          "actionPlan": "<estrategia recomendada>"
        }
        Do not include markdown tags like \`\`\`json or \`\`\`. Return only the raw JSON.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        
        // Limpiar backticks si los hay
        const jsonStr = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("❌ [GEMINI PREDICT] Error:", e.message);
        return {
            noShowProbability: 0.2,
            riskLevel: "LOW",
            rationales: ["Falla en llamada a IA: " + e.message],
            actionPlan: "Proceder con verificación telefónica estándar."
        };
    }
};
