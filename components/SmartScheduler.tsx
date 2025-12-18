
import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2, CalendarPlus, Wand2, AlertTriangle } from 'lucide-react';
import { parseAppointmentRequest } from '../services/geminiService';
import { AIParsedAppointment, Appointment, AppointmentStatus } from '../types';
import { SOLUTION_TIMEOUT } from '../services/api';

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
      const [parsed] = await Promise.all([
        parseAppointmentRequest(input),
        new Promise(resolve => setTimeout(resolve, SOLUTION_TIMEOUT))
      ]);

      if (parsed) {
        const newAppointment: Appointment = {
          id: Date.now().toString(36) + Math.random().toString(36).substring(2),
          title: parsed.title,
          startDateTime: parsed.startDateTime,
          endDateTime: parsed.endDateTime,
          clientName: parsed.clientName || 'Cliente Shula AI',
          clientPhone: parsed.clientPhone || '',
          description: parsed.description || 'Experiencia solicitada vía Shula AI',
          status: AppointmentStatus.SCHEDULED,
        };
        
        try {
            await onAddAppointment(newAppointment);
            setInput('');
        } catch (err: any) {
            if (err.message === 'OVERLAP') {
                setError("Conflicto: El profesional ya tiene una cita agendada en ese horario.");
            } else {
                setError("Error al registrar en el servidor central.");
            }
        }
      } else {
        setError("Lo siento, no pude interpretar los detalles con claridad.");
      }
    } catch (err) {
      setError("Fallo en la comunicación con Citaplanner AI.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-[3rem] shadow-sm border border-slate-50 p-10 mb-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
      
      <div className="flex items-center gap-5 mb-8">
        <div className="bg-[#D4AF37] p-3 rounded-2xl text-black shadow-lg">
          <Wand2 size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Agenda AI</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Sincronización Natural con Aurum Ecosystem</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej: Retoque de Microblading para Valeria mañana a las 5pm"
          className="w-full pl-6 pr-40 py-6 bg-slate-50 border border-slate-50 rounded-3xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all text-lg font-medium text-slate-800 placeholder-slate-300"
          disabled={isProcessing}
        />
        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className="absolute right-3 top-3 bottom-3 px-8 bg-black rounded-2xl font-black text-[10px] uppercase tracking-widest text-white hover:bg-[#D4AF37] hover:text-black transition-all flex items-center gap-3 disabled:opacity-50"
        >
          {isProcessing ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              PROCESAR <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
      {error && (
        <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
          <AlertTriangle className="text-red-500" size={18} />
          <p className="text-xs font-black uppercase tracking-widest text-red-600">
            {error}
          </p>
        </div>
      )}
    </div>
  );
};
