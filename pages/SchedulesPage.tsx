
import React, { useState, useEffect, useMemo } from 'react';
import {
   Calendar, Clock, User, ShieldAlert, Plus, Trash2,
   Save, Check, Coffee, CalendarDays, Settings, X, Loader2, Sparkles, Mail, Briefcase, Fingerprint, ChevronLeft, ChevronRight,
   Activity, Copy, ExternalLink, Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { Professional, ScheduleException, ExceptionType, Appointment } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppointmentModal } from '../components/AppointmentModal';

const DAYS_OF_WEEK = [
   { id: 1, name: 'Lunes' },
   { id: 2, name: 'Martes' },
   { id: 3, name: 'Miércoles' },
   { id: 4, name: 'Jueves' },
   { id: 5, name: 'Viernes' },
   { id: 6, name: 'Sábado' },
   { id: 0, name: 'Domingo' },
];

const EXCEPTION_TYPES = [
   { label: 'Vacaciones/Descanso', value: ExceptionType.VACATION, color: 'bg-indigo-500', icon: Coffee },
   { label: 'Enfermedad', value: ExceptionType.SICKNESS, color: 'bg-red-500', icon: ShieldAlert },
   { label: 'Personal/Trámite', value: ExceptionType.PERSONAL, color: 'bg-amber-500', icon: User },
   { label: 'Otro Bloqueo', value: ExceptionType.OTHER, color: 'bg-slate-500', icon: Clock },
];

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8:00 to 22:00

export const SchedulesPage: React.FC = () => {
   const { user } = useAuth();
   const queryClient = useQueryClient();
   const [professionals, setProfessionals] = useState<Professional[]>([]);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [generatingToken, setGeneratingToken] = useState(false);
   const [selectedDate, setSelectedDate] = useState(new Date());

   const [selectedProId, setSelectedProId] = useState<string>('');
   const [activeTab, setActiveTab] = useState<'MATRIX' | 'WEEKLY' | 'EXCEPTIONS'>('MATRIX');

   const [isEditProModalOpen, setIsEditProModalOpen] = useState(false);
   const [isCreateProModalOpen, setIsCreateProModalOpen] = useState(false);
   const [proFormData, setProFormData] = useState<Partial<Professional>>({});

   const [exceptionFormData, setExceptionFormData] = useState<Partial<ScheduleException>>({
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      type: ExceptionType.VACATION,
      note: ''
   });

   const [isAptModalOpen, setIsAptModalOpen] = useState(false);

   const { data: appointments = [] } = useQuery({
      queryKey: ['appointments'],
      queryFn: api.getAppointments
   });

   const createMutation = useMutation({
      mutationFn: api.createAppointment,
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['appointments'] });
         toast.success("Cita agendada y sincronizada.");
         setIsAptModalOpen(false);
      },
      onError: () => {
         toast.error("Error al sincronizar cita.");
      }
   });

   useEffect(() => { loadProfessionals(); }, []);

   const loadProfessionals = async () => {
      try {
         setLoading(true);
         const data = await api.getProfessionals();
         setProfessionals(data);
         if (data.length > 0 && !selectedProId) setSelectedProId(data[0].id);
      } catch (e) {
         console.error("Error loading professionals:", e);
         toast.error("Error de sincronización con el nodo de especialistas.");
      } finally {
         setLoading(false);
      }
   };

   const selectedPro = professionals.find(p => p.id === selectedProId) || professionals[0];

   const handleSaveProData = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      if (isCreateProModalOpen) {
         const newPro: Omit<Professional, 'id'> = {
            name: proFormData.name || '',
            role: proFormData.role || '',
            email: proFormData.email || '',
            aurumEmployeeId: proFormData.aurumEmployeeId,
            weeklySchedule: DAYS_OF_WEEK.map(d => ({ dayOfWeek: d.id, isEnabled: [1, 2, 3, 4, 5].includes(d.id), slots: [{ start: '09:00', end: '18:00' }] })),
            exceptions: []
         };
         const res = await api.createProfessional(newPro as any);
         if (res.success) {
            await loadProfessionals();
            setIsCreateProModalOpen(false);
            toast.success("Nodo profesional integrado.");
         }
      } else {
         const updatedPro = { ...selectedPro, ...proFormData };
         const success = await api.updateProfessional(updatedPro);
         if (success) {
            setProfessionals(prev => prev.map(p => p.id === selectedProId ? updatedPro : p));
            setIsEditProModalOpen(false);
            toast.success("Perfil sincronizado.");
         }
      }
      setSaving(false);
   };

   const handleDeletePro = async (id: string) => {
      if (!window.confirm("¿Seguro que desea eliminar este especialista?")) return;
      const success = await api.deleteProfessional(id);
      if (success) {
         toast.success("Especialista eliminado.");
         loadProfessionals();
      }
   };

   const handleSyncICal = async () => {
      if (!selectedProId) return;
      setGeneratingToken(true);
      try {
         const res = await api.getCalendarLink(selectedProId);
         if (res.icalToken) {
            // Update local state to show the token if needed, or just toast
            await loadProfessionals();
            toast.success("Sincronización iCal Activa");
         }
      } catch (e) {
         toast.error("Falla al activar iCal");
      } finally {
         setGeneratingToken(false);
      }
   };

   const copyICalUrl = () => {
      if (!selectedPro?.icalToken) return;
      const url = `${window.location.origin}/api/calendar/feed/${selectedPro.icalToken}.ics`;
      navigator.clipboard.writeText(url);
      toast.success("Enlace iCal copiado al portapapeles");
   };

   const handleAddException = async () => {
      if (!selectedProId) return;
      setSaving(true);
      try {
         const currentExceptions = [...(selectedPro?.exceptions || [])];
         const newEx = { ...exceptionFormData, id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` };
         const updatedPro = { ...selectedPro, exceptions: [...currentExceptions, newEx] };

         const success = await api.updateProfessional(updatedPro);
         if (success) {
            setProfessionals(prev => prev.map(p => p.id === selectedProId ? updatedPro : p));
            toast.success("Bloqueo de agenda programado");
            setExceptionFormData({
               startDate: new Date().toISOString().split('T')[0],
               endDate: new Date().toISOString().split('T')[0],
               type: ExceptionType.VACATION,
               note: ''
            });
         }
      } catch (e) {
         toast.error("Error al guardar excepción");
      } finally {
         setSaving(false);
      }
   };

   const removeException = async (exId: string) => {
      if (!selectedProId) return;
      setSaving(true);
      const updatedExceptions = selectedPro.exceptions.filter((ex: any) => ex.id !== exId);
      const updatedPro = { ...selectedPro, exceptions: updatedExceptions };

      const success = await api.updateProfessional(updatedPro);
      if (success) {
         setProfessionals(prev => prev.map(p => p.id === selectedProId ? updatedPro : p));
         toast.success("Bloqueo eliminado");
      }
      setSaving(false);
   };

   const isDateBlocked = (date: Date, pro?: Professional) => {
      if (!pro) return false;
      return pro.exceptions?.some(ex => {
         const start = new Date(ex.startDate);
         const end = new Date(ex.endDate);
         // Canonicalize dates to midnight for comparison
         const d = new Date(date);
         d.setHours(0, 0, 0, 0);
         start.setHours(0, 0, 0, 0);
         end.setHours(0, 0, 0, 0);
         return d >= start && d <= end;
      });
   };

  const stats = useMemo(() => {
    const totalSlots = professionals.length * HOURS.length;
    const occupiedSlots = appointments.filter(a => {
      const start = new Date(a.startDateTime);
      return start.toDateString() === selectedDate.toDateString() && a.status !== 'CANCELLED';
    }).length;
    const occupancy = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

    return {
      occupancy,
      totalApts: occupiedSlots,
      activePros: professionals.length,
      nextAvailable: "14:00" // Mock for now but displayed as premium info
    };
  }, [professionals, appointments, selectedDate]);

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

   if (loading) return <div className="h-screen flex items-center justify-center bg-main"><Loader2 className="animate-spin text-[#CE4676]" size={48} /></div>;

   return (
      <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
        <div>
          <h1 className="text-4xl font-black text-main uppercase tracking-tighter">
            Master <span className="bugambilia-text-gradient font-light">Matrix</span>
          </h1>
          <p className="text-[10px] text-muted font-bold uppercase tracking-[0.4em] mt-2">Arquitectura de Operaciones en Tiempo Real</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex bg-card-theme p-1 rounded-2xl border border-theme">
            <button onClick={() => setActiveTab('MATRIX')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'MATRIX' ? 'bg-[#CE4676] text-white shadow-lg' : 'text-muted hover:text-main'}`}>Operaciones</button>
            <button onClick={() => setActiveTab('WEEKLY')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'WEEKLY' ? 'bg-[#CE4676] text-white shadow-lg' : 'text-muted hover:text-main'}`}>Base</button>
            <button onClick={() => setActiveTab('EXCEPTIONS')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'EXCEPTIONS' ? 'bg-[#CE4676] text-white shadow-lg' : 'text-muted hover:text-main'}`}>Bloqueos</button>
          </div>
          <button onClick={() => { setProFormData({ name: '', role: '', email: '', aurumEmployeeId: '' }); setIsCreateProModalOpen(true); }} className="bugambilia-btn text-white px-8 py-4 rounded-2xl text-[9px] uppercase tracking-widest font-black shadow-2xl flex items-center gap-2">
            <Plus size={16} /> Nodo Maestro
          </button>
        </div>
      </div>

      {/* INTELLIGENCE HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="glass-card p-6 rounded-3xl border-theme flex flex-col justify-between">
          <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-3">Ocupación Hoy</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-main">{stats.occupancy}%</h3>
            <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
               <div style={{ width: `${stats.occupancy}%` }} className="h-full bg-emerald-500 shadow-[0_0_10px_#10B981]" />
            </div>
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl border-theme">
          <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-3">Citas Programadas</p>
          <h3 className="text-2xl font-black text-main">{stats.totalApts} <span className="text-[10px] text-muted font-bold tracking-normal uppercase">Node Hits</span></h3>
        </div>
        <div className="glass-card p-6 rounded-3xl border-theme">
          <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-3">Staff Operativo</p>
          <h3 className="text-2xl font-black text-main">{stats.activePros} <span className="text-[10px] text-muted font-bold tracking-normal uppercase">Unidades</span></h3>
        </div>
        <div className="glass-card p-6 rounded-3xl border-theme bg-gradient-to-tr from-[#CE4676]/5 to-transparent">
          <p className="text-[9px] font-black text-[#CE4676] uppercase tracking-widest mb-3">AI Recommendation</p>
          <p className="text-[10px] font-bold text-main leading-relaxed">
            {stats.occupancy > 70 ? "Capacidad crítica detectada. Considera activar Nodo de Refuerzo." : "Disponibilidad óptima para walk-ins."}
          </p>
        </div>
      </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* SIDEBAR - Only visible in Individual Tabs */}
            {activeTab !== 'MATRIX' && (
              <div className="lg:col-span-3 space-y-4">
                <div className="glass-card rounded-[2.5rem] border-theme overflow-hidden">
                    <div className="p-6 bg-input-theme border-b border-theme">
                        <h3 className="text-[10px] font-black text-muted uppercase tracking-widest">Nodos Profesionales</h3>
                    </div>
                    {professionals.length === 0 ? (
                        <div className="p-10 text-center">
                          <User className="mx-auto text-muted/20 mb-4" size={40} />
                          <p className="text-[9px] font-black text-muted uppercase tracking-widest">No hay nodos activos</p>
                        </div>
                    ) : professionals.map(pro => (
                        <div key={pro.id} className={`p-6 cursor-pointer border-l-4 transition-all ${selectedProId === pro.id ? 'bg-[#CE4676]/5 border-[#CE4676]' : 'border-transparent hover:bg-input-theme'}`} onClick={() => setSelectedProId(pro.id)}>
                          <div className="flex justify-between items-start">
                              <div>
                                <p className={`font-black text-sm uppercase ${selectedProId === pro.id ? 'text-main' : 'text-muted'}`}>{pro.name}</p>
                                <p className="text-[9px] text-muted font-bold uppercase mt-1">{pro.role}</p>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); handleDeletePro(pro.id); }} className="p-2 text-muted hover:text-red-500 transition-colors">
                                <Trash2 size={14} />
                              </button>
                          </div>
                          {selectedProId === pro.id && (
                              <button onClick={(e) => { e.stopPropagation(); setProFormData(pro); setIsEditProModalOpen(true); }} className="mt-4 text-[9px] font-black text-[#CE4676] uppercase hover:underline flex items-center gap-2">
                                <Settings size={12} /> Configurar Perfil
                              </button>
                          )}
                        </div>
                    ))}
                </div>
              </div>
            )}

            <div className={`${activeTab === 'MATRIX' ? 'lg:col-span-12' : 'lg:col-span-9'}`}>
               {professionals.length === 0 ? (
                  <div className="glass-card rounded-[3.5rem] border-theme p-20 flex flex-col items-center justify-center text-center animate-entrance">
                     <div className="w-24 h-24 bg-[#CE4676]/10 rounded-full flex items-center justify-center mb-8">
                        <Briefcase className="text-[#CE4676]" size={40} />
                     </div>
                     <h2 className="text-2xl font-black text-main uppercase tracking-tighter mb-4">Arquitectura Vacía</h2>
                     <p className="text-xs text-muted font-medium max-w-md mb-10 uppercase tracking-widest leading-loose text-center">
                        No se han detectado especialistas vinculados a este nodo. Integra tu primer "Nodo Maestro" para comenzar a gestionar horarios y citas.
                     </p>
                     <button onClick={() => { setProFormData({ name: '', role: '', email: '', aurumEmployeeId: '' }); setIsCreateProModalOpen(true); }} className="bugambilia-btn text-white px-12 py-5 rounded-2xl text-[10px] uppercase tracking-widest font-black shadow-2xl">
                        Integrar Especialista Ahora
                     </button>
                  </div>
               ) : activeTab === 'MATRIX' ? (
                   <div className="glass-card rounded-[3.5rem] border-theme overflow-hidden animate-entrance">
                      <div className="p-8 border-b border-theme bg-input-theme flex justify-between items-center">
                         <div className="flex items-center gap-6">
                            <button onClick={() => changeDate(-1)} className="p-3 bg-card rounded-xl text-muted hover:text-main border border-theme shadow-sm"><ChevronLeft size={20} /></button>
                            <div className="text-center min-w-[200px]">
                               <p className="text-[9px] font-black text-[#CE4676] uppercase tracking-widest mb-1">{selectedDate.toLocaleDateString('es-ES', { weekday: 'long' })}</p>
                               <p className="text-xl font-black text-main uppercase tracking-tighter">{selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                            <button onClick={() => changeDate(1)} className="p-3 bg-card rounded-xl text-muted hover:text-main border border-theme shadow-sm"><ChevronRight size={20} /></button>
                         </div>
                         <div className="flex items-center gap-3 px-6 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                            <Activity size={14} className="text-emerald-500" />
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Master Node Sync Active</span>
                         </div>
                      </div>

                      <div className="overflow-x-auto">
                        <div className="min-w-max">
                           {/* HEADER WITH PRO NAMES */}
                           <div className="grid grid-cols-[100px_repeat(auto-fit,minmax(200px,1fr))] border-b border-theme sticky top-0 bg-input-theme z-20">
                              <div className="p-6 border-r border-theme flex items-center justify-center">
                                 <span className="text-[9px] font-black text-muted uppercase tracking-widest">Time</span>
                              </div>
                              {professionals.map(pro => (
                                 <div key={pro.id} className="p-6 border-r border-theme last:border-0 text-center relative group">
                                    <p className="text-xs font-black text-main uppercase tracking-tighter">{pro.name}</p>
                                    <p className="text-[8px] text-muted font-bold uppercase tracking-widest mt-1">{pro.role}</p>
                                    {isDateBlocked(selectedDate, pro) && (
                                       <div className="absolute top-2 right-2 p-1 bg-red-500/10 rounded-full text-red-500">
                                          <ShieldAlert size={10} />
                                       </div>
                                    )}
                                 </div>
                              ))}
                           </div>

                           {/* MATRIX GRID */}
                           <div className="divide-y border-theme">
                              {HOURS.map(hour => {
                                 const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                                 
                                 return (
                                    <div key={hour} className="grid grid-cols-[100px_repeat(auto-fit,minmax(200px,1fr))] group hover:bg-white/[0.02] transition-colors">
                                       <div className="p-6 border-r border-theme flex items-center justify-center">
                                          <span className="text-xs font-black text-muted group-hover:text-[#CE4676] transition-colors">{timeStr}</span>
                                       </div>
                                       
                                       {professionals.map(pro => {
                                          const dayId = selectedDate.getDay();
                                          const schedule = pro.weeklySchedule?.find((s: any) => s.dayOfWeek === dayId);
                                          const isWorking = schedule?.isEnabled && schedule.slots?.some((slot: any) => {
                                             const startH = parseInt(slot.start.split(':')[0]);
                                             const endH = parseInt(slot.end.split(':')[0]);
                                             return hour >= startH && hour < endH;
                                          });
                                          const blocked = isDateBlocked(selectedDate, pro);
                                          const isAvailable = isWorking && !blocked;

                                          const apt = appointments.find(a => {
                                             if (a.professionalId !== pro.id || a.status === 'CANCELLED') return false;
                                             const start = new Date(a.startDateTime);
                                             const end = new Date(a.endDateTime);
                                             const currentHourStart = new Date(selectedDate);
                                             currentHourStart.setHours(hour, 0, 0, 0);
                                             const currentHourEnd = new Date(selectedDate);
                                             currentHourEnd.setHours(hour + 1, 0, 0, 0);
                                             return start < currentHourEnd && end > currentHourStart;
                                          });

                                          return (
                                             <div
                                                key={pro.id}
                                                onClick={() => isAvailable && !apt && setIsAptModalOpen(true)}
                                                className={`p-1 border-r border-theme last:border-0 min-h-[90px] relative transition-all ${apt ? 'bg-input-theme/50' : isAvailable ? 'hover:bg-[#CE4676]/5 cursor-pointer' : 'bg-black/10'}`}
                                             >
                                                {apt ? (
                                                   <div className="absolute inset-1.5 bg-gradient-to-tr from-[#CE4676] to-[#9D2D51] rounded-xl p-3 shadow-lg flex flex-col justify-center border border-white/10 z-10 group/apt overflow-hidden">
                                                      <div className="absolute top-0 right-0 p-2 opacity-10 scale-150">
                                                         <Calendar size={32} />
                                                      </div>
                                                      <p className="text-[8px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Confirmada</p>
                                                      <h4 className="text-[10px] font-black text-white uppercase truncate">{apt.title}</h4>
                                                      <p className="text-[9px] font-bold text-white/80 truncate mt-0.5">{apt.clientName}</p>
                                                   </div>
                                                ) : blocked ? (
                                                   <div className="h-full w-full flex items-center justify-center opacity-20">
                                                      <ShieldAlert size={12} className="text-red-500" />
                                                   </div>
                                                ) : isWorking ? (
                                                   <div className="h-full w-full rounded-xl border border-dashed border-theme flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                      <Plus size={16} className="text-[#CE4676]/40" />
                                                   </div>
                                                ) : null}
                                             </div>
                                          );
                                       })}
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                      </div>
                   </div>
               ) : activeTab === 'WEEKLY' ? (
                  <div className="glass-card rounded-[3.5rem] border-theme p-10 animate-entrance">
                     <div className="flex justify-between items-center mb-10">
                        <div>
                           <h3 className="text-2xl font-black text-main uppercase tracking-tighter">Horarios Base</h3>
                           <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Configuración de Jornada Semanal para {selectedPro?.name}</p>
                        </div>
                        <button
                           onClick={async () => {
                              setSaving(true);
                              const success = await api.updateProfessional(selectedPro);
                              if (success) toast.success("Horario base sincronizado.");
                              setSaving(false);
                           }}
                           disabled={saving}
                           className="bugambilia-btn text-white px-8 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl"
                        >
                           {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                           Sincronizar Cambios
                        </button>
                     </div>

                     <div className="space-y-4">
                        {/* iCal Integration Premium Section */}
                        <div className="bg-gradient-to-br from-black/40 to-black/60 p-8 rounded-[2.5rem] border border-[#D4AF37]/10 mb-8 overflow-hidden relative group">
                           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                              <Globe size={80} className="text-[#D4AF37]" />
                           </div>
                           <div className="relative z-10">
                              <div className="flex items-center gap-3 mb-4">
                                 <div className="p-2 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]">
                                    <CalendarDays size={18} />
                                 </div>
                                 <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Sincronización Externa (Apple / Outlook)</h4>
                              </div>
                              <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xl mb-6">
                                 Integra tu agenda operativa directamente en tu iPhone o Mac. El feed iCal mantiene tus citas actualizadas en tiempo real sin abrir el dashboard.
                              </p>

                              {selectedPro?.icalToken ? (
                                 <div className="flex flex-col sm:flex-row gap-4 items-center">
                                    <div className="flex-1 w-full bg-black/60 border border-white/5 p-4 rounded-xl flex items-center justify-between group/link">
                                       <code className="text-[10px] text-[#D4AF37] font-mono truncate mr-4">
                                          {window.location.origin}/api/calendar/feed/{selectedPro.icalToken}.ics
                                       </code>
                                       <button onClick={copyICalUrl} className="p-2 text-slate-500 hover:text-white transition-colors">
                                          <Copy size={14} />
                                       </button>
                                    </div>
                                    <button onClick={copyICalUrl} className="whitespace-nowrap bg-white/5 border border-white/10 px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all flex items-center gap-2">
                                       <ExternalLink size={14} /> Copiar URL de Feed
                                    </button>
                                 </div>
                              ) : (
                                 <button
                                    onClick={handleSyncICal}
                                    disabled={generatingToken}
                                    className="bg-[#D4AF37] text-black px-8 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-[#D4AF37]/10 flex items-center gap-2 hover:scale-105 transition-all"
                                 >
                                    {generatingToken ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    Activar Sincronización iCal
                                 </button>
                              )}
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {DAYS_OF_WEEK.map(day => {
                           const schedule = (selectedPro?.weeklySchedule as any)?.find((s: any) => s.dayOfWeek === day.id) || { dayOfWeek: day.id, isEnabled: false, slots: [] };

                           return (
                              <div key={day.id} className={`p-6 rounded-[2rem] border transition-all flex flex-col justify-between ${schedule.isEnabled ? 'bg-input-theme border-theme shadow-sm' : 'bg-transparent border-theme/20 opacity-40'}`}>
                                 <div className="flex items-center gap-4 mb-6">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all ${schedule.isEnabled ? 'bg-[#CE4676] text-white shadow-[0_0_15px_#CE4676]/30' : 'bg-card text-muted'}`}>
                                       {day.name.substring(0, 1)}
                                    </div>
                                    <div>
                                       <p className="text-xs font-black text-main uppercase">{day.name}</p>
                                       <p className="text-[8px] text-muted font-bold uppercase tracking-widest">{schedule.isEnabled ? 'Activo' : 'Cerrado'}</p>
                                    </div>
                                 </div>

                                 <div className="space-y-4">
                                    {schedule.isEnabled ? (
                                       <div className="flex flex-col gap-2">
                                          <div className="flex items-center gap-3 bg-card p-3 rounded-xl border border-theme">
                                             <Clock size={12} className="text-[#CE4676]" />
                                             <input
                                                type="time"
                                                value={schedule.slots[0]?.start || '09:00'}
                                                onChange={(e) => {
                                                   const updated = [...((selectedPro?.weeklySchedule as any[]) || [])];
                                                   const idx = updated.findIndex((s: any) => s.dayOfWeek === day.id);
                                                   if (idx > -1) {
                                                      updated[idx].slots[0].start = e.target.value;
                                                   } else {
                                                      updated.push({ dayOfWeek: day.id, isEnabled: true, slots: [{ start: e.target.value, end: '18:00' }] });
                                                   }
                                                   setProfessionals(prev => prev.map(p => p.id === selectedProId ? { ...p, weeklySchedule: updated } : p));
                                                }}
                                                className="bg-transparent text-white font-bold text-[10px] outline-none w-full"
                                             />
                                          </div>
                                          <div className="flex items-center gap-3 bg-card p-3 rounded-xl border border-theme">
                                             <Clock size={12} className="text-[#CE4676]" />
                                             <input
                                                type="time"
                                                value={schedule.slots[0]?.end || '18:00'}
                                                onChange={(e) => {
                                                   const updated = [...((selectedPro?.weeklySchedule as any[]) || [])];
                                                   const idx = updated.findIndex((s: any) => s.dayOfWeek === day.id);
                                                   if (idx > -1) {
                                                      updated[idx].slots[0].end = e.target.value;
                                                   } else {
                                                      updated.push({ dayOfWeek: day.id, isEnabled: true, slots: [{ start: '09:00', end: e.target.value }] });
                                                   }
                                                   setProfessionals(prev => prev.map(p => p.id === selectedProId ? { ...p, weeklySchedule: updated } : p));
                                                }}
                                                className="bg-transparent text-white font-bold text-[10px] outline-none w-full"
                                             />
                                          </div>
                                       </div>
                                    ) : (
                                       <div className="h-[84px] flex items-center justify-center border border-dashed border-theme rounded-xl">
                                          <Coffee size={16} className="text-muted/20" />
                                       </div>
                                    )}

                                    <button
                                       onClick={() => {
                                          let updated = [...((selectedPro?.weeklySchedule as any[]) || [])];
                                          const idx = updated.findIndex((s: any) => s.dayOfWeek === day.id);
                                          if (idx > -1) {
                                             updated[idx].isEnabled = !updated[idx].isEnabled;
                                          } else {
                                             updated.push({ dayOfWeek: day.id, isEnabled: true, slots: [{ start: '09:00', end: '18:00' }] });
                                          }
                                          setProfessionals(prev => prev.map(p => p.id === selectedProId ? { ...p, weeklySchedule: updated } : p));
                                       }}
                                       className={`w-full py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${schedule.isEnabled ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20'}`}
                                    >
                                       {schedule.isEnabled ? 'Bloquear' : 'Habilitar'}
                                    </button>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               </div>
            ) : (
                  <div className="glass-card rounded-[3.5rem] border-theme p-10 animate-entrance">
                     <div className="mb-12">
                        <h3 className="text-2xl font-black text-main uppercase tracking-tighter">Excepciones y Bloqueos</h3>
                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Gestión de Vacaciones, Permisos y Días Inactivos para {selectedPro?.name}</p>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-12">
                           <div className="bg-input-theme p-8 rounded-[2.5rem] border border-theme">
                              <h4 className="text-[10px] font-black text-muted uppercase tracking-widest mb-6">Programar Nueva Excepción</h4>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                                 <div className="md:col-span-1">
                                    <label className="text-[8px] font-black text-muted uppercase mb-3 block">Desde</label>
                                    <input
                                       type="date"
                                       value={exceptionFormData.startDate}
                                       onChange={e => setExceptionFormData({ ...exceptionFormData, startDate: e.target.value })}
                                       className="w-full bg-card p-4 rounded-xl text-xs font-bold text-white border border-theme outline-none focus:border-[#CE4676]"
                                    />
                                 </div>
                                 <div className="md:col-span-1">
                                    <label className="text-[8px] font-black text-muted uppercase mb-3 block">Hasta</label>
                                    <input
                                       type="date"
                                       value={exceptionFormData.endDate}
                                       onChange={e => setExceptionFormData({ ...exceptionFormData, endDate: e.target.value })}
                                       className="w-full bg-card p-4 rounded-xl text-xs font-bold text-white border border-theme outline-none focus:border-[#CE4676]"
                                    />
                                 </div>
                                 <div className="md:col-span-1">
                                    <label className="text-[8px] font-black text-muted uppercase mb-3 block">Tipo de Bloqueo</label>
                                    <select
                                       value={exceptionFormData.type}
                                       onChange={e => setExceptionFormData({ ...exceptionFormData, type: e.target.value as ExceptionType })}
                                       className="w-full bg-card p-4 rounded-xl text-xs font-bold text-white border border-theme outline-none focus:border-[#CE4676]"
                                    >
                                       {EXCEPTION_TYPES.map(t => (
                                          <option key={t.value} value={t.value}>{t.label}</option>
                                       ))}
                                    </select>
                                 </div>
                                 <div className="md:col-span-1">
                                    <button
                                       onClick={handleAddException}
                                       disabled={saving}
                                       className="w-full bugambilia-btn text-white py-4 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                    >
                                       {saving ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                                       Programar Bloqueo
                                    </button>
                                 </div>
                                 <div className="md:col-span-4">
                                    <label className="text-[8px] font-black text-muted uppercase mb-3 block">Nota / Motivo (Opcional)</label>
                                    <input
                                       type="text"
                                       placeholder="Ej: Congreso de Microblading"
                                       value={exceptionFormData.note}
                                       onChange={e => setExceptionFormData({ ...exceptionFormData, note: e.target.value })}
                                       className="w-full bg-card p-4 rounded-xl text-xs font-bold text-white border border-theme outline-none focus:border-[#CE4676]"
                                    />
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="lg:col-span-12 space-y-4">
                           <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.3em] ml-2">Agenda de Inactividad</h4>
                           {selectedPro?.exceptions?.length === 0 ? (
                              <div className="p-12 border border-dashed border-theme rounded-[2.5rem] flex flex-col items-center justify-center text-muted opacity-40">
                                 <Calendar size={40} strokeWidth={1} className="mb-4" />
                                 <p className="text-[9px] font-black uppercase tracking-widest">Sin bloqueos programados</p>
                              </div>
                           ) : (
                              selectedPro?.exceptions?.sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map((ex: any) => {
                                 const typeInfo = EXCEPTION_TYPES.find(t => t.value === ex.type) || EXCEPTION_TYPES[3];
                                 const Icon = typeInfo.icon;

                                 return (
                                    <div key={ex.id} className="glass-card p-6 border-theme rounded-3xl flex items-center justify-between group hover:border-[#CE4676]/30 transition-all">
                                       <div className="flex items-center gap-6">
                                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${typeInfo.color} shadow-lg shadow-black/20`}>
                                             <Icon size={20} />
                                          </div>
                                          <div>
                                             <p className="text-xs font-black text-main uppercase">{ex.note || typeInfo.label}</p>
                                             <p className="text-[9px] text-muted font-bold uppercase tracking-widest mt-1">
                                                {new Date(ex.startDate).toLocaleDateString()} - {new Date(ex.endDate).toLocaleDateString()}
                                             </p>
                                          </div>
                                       </div>
                                       <button
                                          onClick={() => removeException(ex.id)}
                                          className="p-4 bg-red-500/5 text-red-500/20 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                                       >
                                          <Trash2 size={16} />
                                       </button>
                                    </div>
                                 );
                              })
                           )}
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </div>

         {(isEditProModalOpen || isCreateProModalOpen) && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
               <div className="glass-card w-full max-w-xl rounded-[3.5rem] overflow-hidden border-[#D4AF37]/20 animate-scale-in">
                  <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/5">
                     <h3 className="font-black text-xl text-white uppercase tracking-tighter">{isCreateProModalOpen ? 'Integrar Nodo Maestro' : 'Editar Especialista'}</h3>
                     <button onClick={() => { setIsEditProModalOpen(false); setIsCreateProModalOpen(false); }} className="text-zinc-500 hover:text-white p-2 hover:bg-white/5 rounded-xl"><X size={24} /></button>
                  </div>
                  <form onSubmit={handleSaveProData} className="p-10 space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                           <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 block ml-1">Nombre de Operación</label>
                           <input required type="text" value={proFormData.name || ''} onChange={e => setProFormData({ ...proFormData, name: e.target.value })} className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37]" placeholder="Ej: Dra. Valeria" />
                        </div>
                        <div>
                           <label className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest mb-3 block ml-1">Aurum Employee ID</label>
                           <div className="relative">
                              <Fingerprint className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700" size={18} />
                              <input placeholder="EMP-XXX" type="text" value={proFormData.aurumEmployeeId || ''} onChange={e => setProFormData({ ...proFormData, aurumEmployeeId: e.target.value })} className="w-full pl-14 pr-5 py-5 bg-black/40 border border-white/5 rounded-2xl text-white font-black text-xs placeholder-zinc-800 outline-none focus:border-[#D4AF37]" />
                           </div>
                        </div>
                        <div className="md:col-span-2">
                           <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 block ml-1">Rol / Especialidad</label>
                           <input required type="text" value={proFormData.role || ''} onChange={e => setProFormData({ ...proFormData, role: e.target.value })} className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37]" placeholder="Ej: Master Artist Microblading" />
                        </div>
                     </div>
                     <div className="flex justify-end gap-6 pt-10 border-t border-white/5">
                        <button type="button" onClick={() => { setIsEditProModalOpen(false); setIsCreateProModalOpen(false); }} className="text-[10px] font-black uppercase text-zinc-600 hover:text-white transition-colors">Cancelar</button>
                        <button type="submit" disabled={saving} className="gold-btn px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3">
                           {saving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />} Confirmar Identidad
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         <AppointmentModal
            isOpen={isAptModalOpen}
            onClose={() => setIsAptModalOpen(false)}
            onSave={(apt) => createMutation.mutate(apt)}
         />
      </div >
   );
};

export default SchedulesPage;
