
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
              <Calendar className="text-indigo-600" size={20} />
              <h3 className="font-bold text-lg text-slate-800">Nueva Cita</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
               <Info size={14} className="text-slate-400" /> Título de la Cita
            </label>
            <input
              {...register('title')}
              className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${errors.title ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
              placeholder="Ej: Consulta de Ortodoncia"
            />
            {errors.title && <p className="text-[11px] text-red-500 font-medium pl-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                   <User size={14} className="text-slate-400" /> Cliente
                </label>
                <input
                  {...register('clientName')}
                  className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${errors.clientName ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                  placeholder="Nombre"
                />
                {errors.clientName && <p className="text-[11px] text-red-500 font-medium pl-1">{errors.clientName.message}</p>}
             </div>
             <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                   <PhoneIcon size={14} className="text-slate-400" /> Teléfono
                </label>
                <input
                  {...register('clientPhone')}
                  className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${errors.clientPhone ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                  placeholder="+52..."
                />
                {errors.clientPhone && <p className="text-[11px] text-red-500 font-medium pl-1">{errors.clientPhone.message}</p>}
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                 <Calendar size={14} className="text-slate-400" /> Fecha
              </label>
              <input
                type="date"
                {...register('date')}
                className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${errors.date ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
              />
              {errors.date && <p className="text-[11px] text-red-500 font-medium pl-1">{errors.date.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                 <Clock size={14} className="text-slate-400" /> Hora
              </label>
              <input
                type="time"
                {...register('time')}
                className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${errors.time ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
              />
              {errors.time && <p className="text-[11px] text-red-500 font-medium pl-1">{errors.time.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Duración Estándar</label>
             <select
              {...register('duration')}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={60}>1 hora</option>
              <option value={90}>1.5 horas</option>
              <option value={120}>2 horas</option>
            </select>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              Agendar Cita
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
