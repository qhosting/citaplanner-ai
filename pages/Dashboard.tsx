import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon, Plus, Mic,
  ShoppingBag, UserPlus, Package, Megaphone, BarChart3, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppointmentModal } from '../components/AppointmentModal';
import { AppointmentDetailsModal } from '../components/AppointmentDetailsModal';
import { VoiceAssistant } from '../components/VoiceAssistant';
import { Skeleton } from '../components/Skeleton';
import { OperationsAgenda } from '../components/dashboard/OperationsAgenda';
import { AppointmentStatus, Appointment } from '../types';
import { api } from '../services/api';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  
  const [selectedAppointmentForDetails, setSelectedAppointmentForDetails] = useState<Appointment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Agenda Real
  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.getAppointments(),
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals'],
    queryFn: api.getProfessionals,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: api.getServices,
  });

  const createMutation = useMutation({
    mutationFn: api.createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success("Cita sincronizada con éxito en la red global");
    }
  });

  const filteredAppointments = useMemo(() => {
    return [...appointments]
      .filter(a => a.status !== AppointmentStatus.CANCELLED)
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
      .slice(0, 8);
  }, [appointments]);

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance relative">
      {/* 🔮 Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4AF37]/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#D4AF37]/5 blur-[100px] rounded-full -z-10 pointer-events-none" />


      {/* 🚀 QUICK ACTIONS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-16">
        {[
          { label: 'Punto de Venta', icon: ShoppingBag, path: '/pos', color: '#D4AF37' },
          { label: 'Nuevo Cliente', icon: UserPlus, path: '/clients', color: '#3B82F6' },
          { label: 'Inventario', icon: Package, path: '/inventory', color: '#8B5CF6' },
          { label: 'Marketing', icon: Megaphone, path: '/marketing', color: '#D4AF37' },
          { label: 'Analítica', icon: BarChart3, path: '/analytics', color: '#10B981' },
          { label: 'Configuración', icon: Settings, path: '/settings', color: '#64748b' },
        ].map((action, i) => (
          <button
            key={i}
            onClick={() => navigate(action.path)}
            className="glass-card p-6 rounded-3xl border-main flex flex-col items-center gap-4 group hover:border-current/30 transition-all bg-card-theme/40"
            style={{ color: action.color } as any}
          >
            <div className="p-4 rounded-2xl bg-current/10 transition-all group-hover:scale-110">
              <action.icon size={20} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-muted group-hover:text-main">{action.label}</span>
          </button>
        ))}
      </div>

      {/* 📅 AGENDA DE OPERACIONES ELITE */}
      <div className="max-w-4xl mx-auto">
        {isLoadingAppointments ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-[3rem]" />
            <Skeleton className="h-32 w-full rounded-[3rem]" />
            <Skeleton className="h-32 w-full rounded-[3rem]" />
          </div>
        ) : (
          <OperationsAgenda 
            appointments={filteredAppointments} 
            onSelectAppointment={(apt) => {
              setSelectedAppointmentForDetails(apt);
              setIsDetailsModalOpen(true);
            }}
          />
        )}
      </div>
    </div>
    {/* 🔮 FLOATING ACTION BUTTONS (FABs) */}
    <div className="fixed bottom-10 right-10 z-[600] flex flex-col gap-4">
      <button
        onClick={() => navigate('/schedules')}
        className="flex items-center justify-center gap-3 bg-zinc-950/80 backdrop-blur-md hover:bg-zinc-900 text-white px-6 py-4 rounded-full border border-zinc-800 hover:border-[#D4AF37]/50 shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 font-extrabold text-[10px] uppercase tracking-widest group"
      >
        <CalendarIcon size={18} className="text-[#D4AF37] group-hover:scale-110 transition-transform duration-300" />
        <span>Calendario</span>
      </button>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center justify-center gap-3 bg-[#D4AF37] hover:bg-[#AA7C11] text-black px-6 py-4 rounded-full shadow-[0_10px_30px_rgba(212,175,55,0.3)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 font-extrabold text-[10px] uppercase tracking-widest group"
      >
        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
        <span>Nueva Cita</span>
      </button>
    </div>

    <AppointmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={(apt) => createMutation.mutate(apt)} />
    <VoiceAssistant isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} onAppointmentCreated={() => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }} />
    <AppointmentDetailsModal
      isOpen={isDetailsModalOpen}
      onClose={() => setIsDetailsModalOpen(false)}
      appointment={selectedAppointmentForDetails}
      professionals={professionals}
      services={services}
    />
  </>);
};
