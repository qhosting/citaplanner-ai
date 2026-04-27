
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon, Clock, User, Plus, Mic, Activity,
  Sparkles, Send, DollarSign, Users, TrendingUp, MapPin, Loader2, Globe, Link2, MessageSquare,
  Zap, BrainCircuit, ShoppingBag, UserPlus, Package, Megaphone, BarChart3, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SmartScheduler } from '../components/SmartScheduler';
import { AppointmentModal } from '../components/AppointmentModal';
import { VoiceAssistant } from '../components/VoiceAssistant';
import { EnergyMonitor } from '../components/EnergyMonitor';
import { Skeleton } from '../components/Skeleton';
import { StatGrid } from '../components/dashboard/StatGrid';
import { SystemMonitor } from '../components/dashboard/SystemMonitor';
import { OperationsAgenda } from '../components/dashboard/OperationsAgenda';
import { Appointment, AppointmentStatus, Client } from '../types';
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

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: api.getServices,
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals'],
    queryFn: api.getProfessionals,
  });

  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: api.getClients,
  });

  // Sales Data
  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: api.getSales,
  });

  const isLoading = isLoadingAppointments || isLoadingClients;

  // Monitor de Integraciones Real
  const { data: integrationStatus = [] } = useQuery({
    queryKey: ['integrationStatus'],
    queryFn: async () => {
      const res = await fetch('/api/integrations/status');
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 10000
  });

  const createMutation = useMutation({
    mutationFn: api.createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['integrationStatus'] });
      toast.success("Cita sincronizada con éxito en la red global");
    }
  });

  const filteredAppointments = useMemo(() => {
    return [...appointments]
      .filter(a => a.status !== AppointmentStatus.CANCELLED)
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
      .slice(0, 5);
  }, [appointments]);

  const recentClients = useMemo(() => {
    return [...clients]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 4);
  }, [clients]);

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

      <div className="mb-16">
        <StatGrid appointments={appointments} clients={clients} services={services} sales={sales} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-16 mb-16">
        <div className="lg:col-span-1">
          <div className="glass-card p-10 rounded-[3rem] border-main h-full">
            <div className="flex items-center gap-4 mb-8">
              <Users size={20} className="text-[#D4AF37]" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-main">Recién Registrados</h3>
            </div>
            <div className="space-y-6">
              {recentClients.length > 0 ? recentClients.map(client => (
                <div key={client.id} className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/clients')}>
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:border-[#D4AF37]/40 group-hover:text-[#D4AF37] transition-all">
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-main uppercase tracking-tight line-clamp-1">{client.name}</span>
                    <span className="text-[8px] font-bold text-muted uppercase tracking-widest">{new Date(client.createdAt || 0).toLocaleDateString()}</span>
                  </div>
                </div>
              )) : (
                <p className="text-[9px] text-slate-700 font-bold uppercase py-10 text-center">Sin actividad reciente</p>
              )}
            </div>
          </div>
        </div>
        <div className="lg:col-span-3">
          <EnergyMonitor />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-16">
          <div className="glass-card p-1.5 rounded-[3.5rem] border-[#CE4676]/5">
            <SmartScheduler
              onAddAppointment={(apt) => createMutation.mutate(apt)}
              services={services}
              professionals={professionals}
            />
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-32 w-full rounded-[3rem]" />
              <Skeleton className="h-32 w-full rounded-[3rem]" />
            </div>
          ) : (
            <OperationsAgenda appointments={filteredAppointments} />
          )}
        </div>

        <div className="lg:col-span-1 h-full">
          <SystemMonitor logs={integrationStatus} />
        </div>
      </div>

      <AppointmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={(apt) => createMutation.mutate(apt)} />
      <VoiceAssistant isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} onAppointmentCreated={() => {
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        queryClient.invalidateQueries({ queryKey: ['integrationStatus'] });
      }} />
    </div>
  );
};
