
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Calendar, Clock, User, Phone as PhoneIcon, Info } from 'lucide-react';
import { Appointment, AppointmentStatus } from '../types';
import { useAuth } from '../context/AuthContext';

const appointmentSchema = z.object({
  title: z.string().min(3, "El título es demasiado corto").max(100),
  clientName: z.string().min(2, "Ingresa el nombre del cliente"),
  clientPhone: z.string().regex(/^\+?[\d\s-]{8,}$/, "Número de teléfono inválido").optional().or(z.literal('')),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha inválida"),
  time: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Formato de hora inválido"),
  duration: z.coerce.number().min(5).max(480),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apt: Appointment) => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      duration: 60,
      date: new Date().toISOString().split('T')[0]
    }
  });

  if (!isOpen) return null;

  const onSubmit = (data: AppointmentFormValues) => {
    const start = new Date(`${data.date}T${data.time}`);
    const end = new Date(start.getTime() + data.duration * 60000);

    // Fixed: Included tenantId in newAppointment
    const newAppointment: Appointment = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      title: data.title,
      clientName: data.clientName,
      clientPhone: data.clientPhone || '',
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
      status: AppointmentStatus.SCHEDULED,
      description: 'Agendado manualmente',
      tenantId: user?.tenantId || '',
    };

    onSave(newAppointment);
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-card-theme rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border border-theme">
        <div className="flex justify-between items-center p-6 border-b border-theme bg-input-theme">
          <div className="flex items-center gap-3">
            <Calendar className="text-[#CE4676]" size={20} />
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-main">Sincronizar nueva Cita</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-main p-2 hover:bg-card-theme rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2 ml-1">
              <Info size={14} className="text-[#CE4676]" /> Título de la Cita
            </label>
            <input
              {...register('title')}
              className={`w-full p-4 bg-input-theme border rounded-2xl focus:ring-1 focus:ring-[#CE4676]/30 focus:outline-none transition-all text-main font-bold text-xs ${errors.title ? 'border-red-500 bg-red-500/5' : 'border-theme'}`}
              placeholder="Ej: Consulta de Ortodoncia"
            />
            {errors.title && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                <User size={14} className="text-[#CE4676]" /> Cliente
              </label>
              <input
                {...register('clientName')}
                className={`w-full p-4 bg-input-theme border rounded-2xl focus:ring-1 focus:ring-[#CE4676]/30 focus:outline-none transition-all text-main font-bold text-xs ${errors.clientName ? 'border-red-500 bg-red-500/5' : 'border-theme'}`}
                placeholder="Nombre"
              />
              {errors.clientName && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-1">{errors.clientName.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                <PhoneIcon size={14} className="text-[#CE4676]" /> Teléfono
              </label>
              <input
                {...register('clientPhone')}
                className={`w-full p-4 bg-input-theme border rounded-2xl focus:ring-1 focus:ring-[#CE4676]/30 focus:outline-none transition-all text-main font-bold text-xs ${errors.clientPhone ? 'border-red-300 bg-red-500/5' : 'border-theme'}`}
                placeholder="+52..."
              />
              {errors.clientPhone && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-1">{errors.clientPhone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                <Calendar size={14} className="text-[#CE4676]" /> Fecha
              </label>
              <input
                type="date"
                {...register('date')}
                className={`w-full p-4 bg-input-theme border rounded-2xl focus:ring-1 focus:ring-[#CE4676]/30 focus:outline-none transition-all text-main font-bold text-xs ${errors.date ? 'border-red-500 bg-red-500/5' : 'border-theme'}`}
              />
              {errors.date && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-1">{errors.date.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                <Clock size={14} className="text-[#CE4676]" /> Hora
              </label>
              <input
                type="time"
                {...register('time')}
                className={`w-full p-4 bg-input-theme border rounded-2xl focus:ring-1 focus:ring-[#CE4676]/30 focus:outline-none transition-all text-main font-bold text-xs ${errors.time ? 'border-red-500 bg-red-500/5' : 'border-theme'}`}
              />
              {errors.time && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-1">{errors.time.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">Duración Estándar</label>
            <select
              {...register('duration')}
              className="w-full p-4 bg-input-theme border border-theme rounded-2xl focus:ring-1 focus:ring-[#CE4676]/30 focus:outline-none text-main font-bold text-xs"
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={60}>1 hora</option>
              <option value={90}>1.5 horas</option>
              <option value={120}>2 horas</option>
            </select>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bugambilia-btn w-full text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              Sincronizar Cita
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
