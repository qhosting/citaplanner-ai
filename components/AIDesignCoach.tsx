
import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Sparkles, Loader2, Palette, Wand2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface AIDesignCoachProps {
  businessDesc: string;
  onSuggest: (suggestions: { primary: string, slogan: string, about: string }) => void;
}

export const AIDesignCoach: React.FC<AIDesignCoachProps> = ({ businessDesc, onSuggest }) => {
  const [loading, setLoading] = useState(false);

  const getAISuggestions = async () => {
    if (!businessDesc || businessDesc.length < 10) {
      toast.error("Por favor, describe un poco más tu negocio primero.");
      return;
    }

    setLoading(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analiza esta descripción de un estudio de belleza y sugiere branding: "${businessDesc}"`,
        config: {
          systemInstruction: "Eres un consultor de branding experto en la industria del lujo y belleza. Tu tarea es generar una paleta de un solo color hex principal, un slogan pegajoso y un texto descriptivo 'Sobre nosotros' profesional y elegante en español.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              primaryColor: { type: Type.STRING, description: "Color HEX sugerido" },
              slogan: { type: Type.STRING },
              aboutText: { type: Type.STRING }
            },
            required: ["primaryColor", "slogan", "aboutText"]
          }
        }
      });

      const data = JSON.parse(response.text);
      onSuggest({
        primary: data.primaryColor,
        slogan: data.slogan,
        about: data.aboutText
      });
      toast.success("¡Gemini ha generado una propuesta de marca!");
    } catch (error) {
      toast.error("Error consultando al Coach IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={20} className="text-indigo-200" />
          <h3 className="font-bold">AI Brand Coach</h3>
        </div>
        <p className="text-sm text-indigo-100 mb-4">
          ¿No estás seguro del estilo? Deja que la IA analice tu descripción y proponga tu marca.
        </p>
        <button
          onClick={getAISuggestions}
          disabled={loading}
          className="w-full bg-white text-indigo-600 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
          {loading ? 'Analizando...' : 'Generar Propuesta de Marca'}
        </button>
      </div>
      <Palette className="absolute -bottom-4 -right-4 text-white/10" size={100} />
    </div>
  );
};
