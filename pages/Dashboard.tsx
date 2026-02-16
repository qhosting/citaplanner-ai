
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon, Clock, User, Plus, Mic, Activity,
  Sparkles, Send, DollarSign, Users, TrendingUp, MapPin, Loader2, Globe, Link2, MessageSquare,
  Zap, BrainCircuit
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

  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: api.getClients,
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance">

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
            className="glass-card text-main px-8 py-5 rounded-2xl bg-card-theme hover:bg-input-theme transition-all flex items-center gap-3 font-black text-[9px] uppercase tracking-widest border border-theme shadow-lg"
          >
            <Mic size={18} className="text-[#CE4676]" /> AI Concierge
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bugambilia-btn text-white px-10 py-5 rounded-2xl flex items-center gap-3 font-black text-[9px] uppercase tracking-widest shadow-2xl"
          >
            <Plus size={18} /> Nueva Cita Elite
          </button>
        </div>
      </div>

      <div className="mb-16">
        <StatGrid appointments={appointments} clients={clients} />
      </div>

      <div className="mb-16">
        <EnergyMonitor />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-16">
          <div className="glass-card p-1.5 rounded-[3.5rem] border-[#CE4676]/5">
            <SmartScheduler onAddAppointment={(apt) => createMutation.mutate(apt)} />
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
