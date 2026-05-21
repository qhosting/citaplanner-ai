
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Calendar, Clock, User, Phone as PhoneIcon, Info, Scissors, UserCheck, Loader2 } from 'lucide-react';
import { Appointment, AppointmentStatus, Professional, Service } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const appointmentSchema = z.object({
  title: z.string().min(3, "El título es demasiado corto").max(100),
  clientName: z.string().min(2, "Ingresa el nombre del cliente"),
  clientPhone: z.string().regex(/^\+?[\d\s-]{8,}$/, "Número de teléfono inválido").optional().or(z.literal('')),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha inválida"),
  time: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Formato de hora inválido"),
  duration: z.coerce.number().min(5).max(480),
  professionalId: z.string().min(1, "Selecciona un especialista"),
  serviceId: z.string().min(1, "Selecciona un servicio"),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apt: Appointment) => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      duration: 60,
      date: new Date().toISOString().split('T')[0],
      title: '',
      clientName: '',
      clientPhone: '',
      time: '09:00'
    }
  });

  const selectedServiceId = watch('serviceId');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([api.getServices(), api.getProfessionals()])
        .then(([s, p]) => {
          setServices(s);
          setProfessionals(p);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedServiceId) {
      const service = services.find(s => s.id === selectedServiceId);
      if (service) {
        setValue('title', service.name);
        setValue('duration', service.duration);
      }
    }
  }, [selectedServiceId, services, setValue]);

  if (!isOpen) return null;

  const onSubmit = (data: AppointmentFormValues) => {
    const start = new Date(`${data.date}T${data.time}`);
    const end = new Date(start.getTime() + data.duration * 60000);

    const newAppointment: Appointment = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      title: data.title,
      clientName: data.clientName,
      clientPhone: data.clientPhone || '',
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
      status: AppointmentStatus.SCHEDULED,
      description: 'Agendado manualmente',
      professionalId: data.professionalId,
      serviceId: data.serviceId,
    };

    onSave(newAppointment);
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-card-theme rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in border border-theme">
        <div className="flex justify-between items-center p-6 border-b border-theme bg-input-theme">
          <div className="flex items-center gap-3">
            <Calendar className="text-[#CE4676]" size={20} />
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-main">Sincronizar nueva Cita</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-main p-2 hover:bg-card-theme rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-[#CE4676]" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Cargando Infraestructura...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Servicio */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                  <Scissors size={14} className="text-[#CE4676]" /> Servicio
                </label>
                <select
                  {...register('serviceId')}
                  className={`w-full p-4 bg-input-theme border rounded-2xl focus:ring-1 focus:ring-[#CE4676]/30 focus:outline-none transition-all text-main font-bold text-xs ${errors.serviceId ? 'border-red-500' : 'border-theme'}`}
                >
                  <option value="">Selecciona un servicio</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (${s.price})</option>
                  ))}
                </select>
                {errors.serviceId && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-1">{errors.serviceId.message}</p>}
              </div>

              {/* Especialista */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                  <UserCheck size={14} className="text-[#CE4676]" /> Especialista
                </label>
                <select
                  {...register('professionalId')}
                  className={`w-full p-4 bg-input-theme border rounded-2xl focus:ring-1 focus:ring-[#CE4676]/30 focus:outline-none transition-all text-main font-bold text-xs ${errors.professionalId ? 'border-red-500' : 'border-theme'}`}
                >
                  <option value="">Selecciona un especialista</option>
                  {professionals.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {p.role}</option>
                  ))}
                </select>
                {errors.professionalId && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-1">{errors.professionalId.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                <Info size={14} className="text-[#CE4676]" /> Título de la Cita (Auto-sync)
              </label>
              <input
                {...register('title')}
                className={`w-full p-4 bg-input-theme border rounded-2xl focus:ring-1 focus:ring-[#CE4676]/30 focus:outline-none transition-all text-main font-bold text-xs ${errors.title ? 'border-red-500 bg-red-500/5' : 'border-theme'}`}
                placeholder="Título de la sesión"
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
                  placeholder="Nombre completo"
                />
                {errors.clientName && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-1">{errors.clientName.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                  <PhoneIcon size={14} className="text-[#CE4676]" /> WhatsApp
                </label>
                <input
                  {...register('clientPhone')}
                  className={`w-full p-4 bg-input-theme border rounded-2xl focus:ring-1 focus:ring-[#CE4676]/30 focus:outline-none transition-all text-main font-bold text-xs ${errors.clientPhone ? 'border-red-300 bg-red-500/5' : 'border-theme'}`}
                  placeholder="Ej: +52..."
                />
                {errors.clientPhone && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-1">{errors.clientPhone.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                  <Calendar size={14} className="text-[#CE4676]" /> Fecha
                </label>
                <input
                  type="date"
                  {...register('date')}
                  className={`w-full p-4 bg-input-theme border rounded-2xl focus:ring-1 focus:ring-[#CE4676]/30 focus:outline-none transition-all text-main font-bold text-xs border-theme`}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                  <Clock size={14} className="text-[#CE4676]" /> Hora
                </label>
                <input
                  type="time"
                  {...register('time')}
                  className={`w-full p-4 bg-input-theme border rounded-2xl focus:ring-1 focus:ring-[#CE4676]/30 focus:outline-none transition-all text-main font-bold text-xs border-theme`}
                />
              </div>
              <div className="space-y-2 col-span-2 lg:col-span-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">Duración (min)</label>
                <input
                  type="number"
                  {...register('duration')}
                  className="w-full p-4 bg-input-theme border border-theme rounded-2xl focus:ring-1 focus:ring-[#CE4676]/30 focus:outline-none text-main font-bold text-xs"
                />
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bugambilia-btn w-full text-white py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Calendar size={18} />}
                Confirmar y Agendar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
