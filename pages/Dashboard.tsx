import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon, Plus, Mic,
  ShoppingBag, UserPlus, Package, Megaphone, BarChart3, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppointmentModal } from '../components/AppointmentModal';
import { VoiceAssistant } from '../components/VoiceAssistant';
import { Skeleton } from '../components/Skeleton';
import { OperationsAgenda } from '../components/dashboard/OperationsAgenda';
import { AppointmentStatus } from '../types';
import { api } from '../services/api';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  // Agenda Real
  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: api.getAppointments,
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
    <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance relative">
      {/* 🔮 Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#CE4676]/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#D4AF37]/5 blur-[100px] rounded-full -z-10 pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-1 h-10 bg-gradient-to-b from-[#CE4676] to-transparent rounded-full shadow-[0_0_20px_#CE4676]"></div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none text-main">
              Console <span className="bugambilia-text-gradient font-light italic">Master</span>
            </h1>
          </div>
          <p className="text-muted font-bold uppercase tracking-[0.5em] text-[10px] ml-5">Network Operation Center • Aurum Infrastructure</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsVoiceOpen(true)}
            className="glass-card text-main px-8 py-5 rounded-2xl bg-card-theme hover:bg-input-theme transition-all flex items-center gap-3 font-black text-[9px] uppercase tracking-widest border border-theme shadow-lg group"
          >
            <Mic size={18} className="text-[#CE4676] group-hover:scale-110 transition-transform" /> AI Concierge
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bugambilia-btn text-white px-10 py-5 rounded-2xl flex items-center gap-3 font-black text-[9px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all"
          >
            <Plus size={18} /> Nueva Cita Elite
          </button>
        </div>
      </div>

      {/* 🚀 QUICK ACTIONS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-16">
        {[
          { label: 'Punto de Venta', icon: ShoppingBag, path: '/pos', color: '#D4AF37' },
          { label: 'Nuevo Cliente', icon: UserPlus, path: '/clients', color: '#3B82F6' },
          { label: 'Inventario', icon: Package, path: '/inventory', color: '#8B5CF6' },
          { label: 'Marketing', icon: Megaphone, path: '/marketing', color: '#CE4676' },
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
          <OperationsAgenda appointments={filteredAppointments} />
        )}
      </div>

      <AppointmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={(apt) => createMutation.mutate(apt)} />
      <VoiceAssistant isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} onAppointmentCreated={() => {
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
      }} />
    </div>
  );
};
