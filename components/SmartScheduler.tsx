import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2, CalendarPlus } from 'lucide-react';
import { parseAppointmentRequest } from '../services/geminiService';
import { AIParsedAppointment, Appointment, AppointmentStatus } from '../types';

interface SmartSchedulerProps {
  onAddAppointment: (apt: Appointment) => void;
}

export const SmartScheduler: React.FC<SmartSchedulerProps> = ({ onAddAppointment }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const parsed: AIParsedAppointment | null = await parseAppointmentRequest(input);

      if (parsed) {
        const newAppointment: Appointment = {
          // Use Date + Math.random fallback for non-secure contexts
          id: Date.now().toString(36) + Math.random().toString(36).substring(2),
          title: parsed.title,
          startDateTime: parsed.startDateTime,
          endDateTime: parsed.endDateTime,
          clientName: parsed.clientName || 'Cliente Desconocido',
          clientPhone: parsed.clientPhone || '',
          description: parsed.description || 'Agendado vía CitaPlanner IA',
          status: AppointmentStatus.SCHEDULED,
        };
        onAddAppointment(newAppointment);
        setInput('');
      } else {
        setError("No pude entender la solicitud. Por favor, intenta de nuevo.");
      }
    } catch (err) {
      setError("Servicio de IA no disponible o falta la clave.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-1.5 rounded-lg text-white">
          <Sparkles size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Agendador Inteligente</h2>
          <p className="text-sm text-slate-500">Describe tu cita (ej: "Reunión con Sara (555-1234) mañana a las 2 PM")</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe aquí para auto-agendar..."
          className="w-full pl-4 pr-32 py-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-700 placeholder-slate-400"
          disabled={isProcessing}
        />
        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-4 rounded-md font-medium transition-colors flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Procesando
            </>
          ) : (
            <>
              Agendar
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
      {error && (
        <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
          <CalendarPlus size={14} />
          {error}
        </p>
      )}
    </div>
  );
};