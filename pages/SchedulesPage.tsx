
import React, { useState, useEffect } from 'react';
import {
   Calendar, Clock, User, ShieldAlert, Plus, Trash2,
   Save, Check, Coffee, CalendarDays, Settings, X, Loader2, Sparkles, Mail, Briefcase, Fingerprint, ChevronLeft, ChevronRight,
   Activity, Copy, ExternalLink, Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { Professional, ScheduleException, ExceptionType, Appointment } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const DAYS_OF_WEEK = [
   { id: 1, name: 'Lunes' },
   { id: 2, name: 'Martes' },
   { id: 3, name: 'Miércoles' },
   { id: 4, name: 'Jueves' },
   { id: 5, name: 'Viernes' },
   { id: 6, name: 'Sábado' },
   { id: 0, name: 'Domingo' },
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

   const { data: appointments = [] } = useQuery({
      queryKey: ['appointments'],
      queryFn: api.getAppointments
   });

   useEffect(() => { loadProfessionals(); }, []);

   const loadProfessionals = async () => {
      setLoading(true);
      const data = await api.getProfessionals();
      setProfessionals(data);
      if (data.length > 0 && !selectedProId) setSelectedProId(data[0].id);
      setLoading(false);
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
            exceptions: [],
            tenantId: user?.tenantId || ''
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
               <h1 className="text-4xl font-black text-main uppercase tracking-tighter">Schedule <span className="bugambilia-text-gradient font-light">Architecture</span></h1>
               <p className="text-[10px] text-muted font-bold uppercase tracking-[0.4em] mt-2">Matriz de Operaciones y Personal</p>
            </div>
            <div className="flex gap-4">
               <div className="flex bg-card-theme p-1 rounded-2xl border border-theme">
                  <button onClick={() => setActiveTab('MATRIX')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'MATRIX' ? 'bg-[#CE4676] text-white shadow-lg' : 'text-muted hover:text-main'}`}>Matriz Hoy</button>
                  <button onClick={() => setActiveTab('WEEKLY')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'WEEKLY' ? 'bg-[#CE4676] text-white shadow-lg' : 'text-muted hover:text-main'}`}>Horarios Base</button>
               </div>
               <button onClick={() => { setProFormData({ name: '', role: '', email: '', aurumEmployeeId: '' }); setIsCreateProModalOpen(true); }} className="bugambilia-btn text-white px-10 py-4 rounded-2xl text-[9px] uppercase tracking-widest font-black shadow-2xl">Integrar Especialista</button>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-3 space-y-4">
               <div className="glass-card rounded-[2.5rem] border-theme overflow-hidden">
                  <div className="p-6 bg-input-theme border-b border-theme">
                     <h3 className="text-[10px] font-black text-muted uppercase tracking-widest">Nodos Profesionales</h3>
                  </div>
                  {professionals.map(pro => (
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

            <div className="lg:col-span-9">
               {activeTab === 'MATRIX' ? (
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
                           <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Sincronización Live</span>
                        </div>
                     </div>

                     <div className="overflow-x-auto">
                        <div className="min-w-[800px]">
                           <div className="grid grid-cols-[100px_1fr] border-b border-theme">
                              <div className="p-6 border-r border-theme" />
                              <div className="p-6 font-black text-[10px] text-muted uppercase tracking-[0.4em]">Matrix Operativa • {selectedPro?.name}</div>
                           </div>

                           <div className="divide-y border-theme">
                              {HOURS.map(hour => {
                                 const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                                 const apt = appointments.find(a =>
                                    a.professionalId === selectedProId &&
                                    new Date(a.startDateTime).toDateString() === selectedDate.toDateString() &&
                                    new Date(a.startDateTime).getHours() === hour
                                 );

                                 return (
                                    <div key={hour} className="grid grid-cols-[100px_1fr] group">
                                       <div className="p-6 border-r border-theme flex items-center justify-center">
                                          <span className="text-xs font-black text-muted group-hover:text-[#CE4676] transition-colors">{timeStr}</span>
                                       </div>
                                       <div className="p-2 relative min-h-[80px] bg-input-theme group-hover:bg-[#CE4676]/5 transition-all">
                                          {apt ? (
                                             <div className="absolute inset-2 bg-gradient-to-tr from-[#CE4676] to-[#9D2D51] rounded-2xl p-4 shadow-xl flex flex-col justify-center border border-white/20">
                                                <p className="text-[9px] font-black text-white/60 uppercase tracking-widest leading-none mb-1">Cita Confirmada</p>
                                                <h4 className="text-sm font-black text-white uppercase truncate">{apt.title}</h4>
                                                <p className="text-[10px] font-bold text-white/80 truncate">Cli: {apt.clientName}</p>
                                             </div>
                                          ) : (
                                             <div className="h-full w-full rounded-2xl border border-dashed border-theme flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Plus size={20} className="text-muted" />
                                             </div>
                                          )}
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     </div>
                  </div>
               ) : (
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

                        {DAYS_OF_WEEK.map(day => {
                           const schedule = (selectedPro?.weeklySchedule as any)?.find((s: any) => s.dayOfWeek === day.id) || { dayOfWeek: day.id, isEnabled: false, slots: [] };

                           return (
                              <div key={day.id} className={`p-6 rounded-[2rem] border transition-all ${schedule.isEnabled ? 'bg-input-theme border-theme shadow-sm' : 'bg-transparent border-theme/20 opacity-40'}`}>
                                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex items-center gap-6">
                                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all ${schedule.isEnabled ? 'bg-[#CE4676] text-white shadow-[0_0_20px_#CE4676]/30' : 'bg-card text-muted'}`}>
                                          {day.name.substring(0, 1)}
                                       </div>
                                       <div>
                                          <p className="text-sm font-black text-main uppercase">{day.name}</p>
                                          <p className="text-[9px] text-muted font-bold uppercase tracking-widest mt-1">{schedule.isEnabled ? 'Jornada Activa' : 'Día No Laboral'}</p>
                                       </div>
                                    </div>

                                    <div className="flex items-center gap-6 w-full md:w-auto">
                                       {schedule.isEnabled && (
                                          <div className="flex gap-4 items-center bg-card p-2 rounded-2xl border border-theme">
                                             <Clock size={14} className="text-[#CE4676] ml-2" />
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
                                                className="bg-transparent text-white font-bold text-xs outline-none"
                                             />
                                             <span className="text-zinc-700 text-xs">-</span>
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
                                                className="bg-transparent text-white font-bold text-xs outline-none"
                                             />
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
                                          className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${schedule.isEnabled ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20'}`}
                                       >
                                          {schedule.isEnabled ? 'Desactivar' : 'Activar'}
                                       </button>
                                    </div>
                                 </div>
                              </div>
                           );
                        })}
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
      </div>
   );
};
