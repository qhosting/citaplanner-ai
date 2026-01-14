
import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, ShieldAlert, Plus, Trash2, 
  Save, Check, Coffee, CalendarDays, Settings, X, Loader2, Sparkles, Mail, Briefcase, Fingerprint, ChevronLeft, ChevronRight,
  // Added Activity to fixed missing import error
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { Professional, ScheduleException, ExceptionType, Appointment } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';

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
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        aurum_employee_id: proFormData.aurum_employee_id,
        weeklySchedule: DAYS_OF_WEEK.map(d => ({ dayOfWeek: d.id, isEnabled: true, slots: [{ start: '09:00', end: '18:00' }] })),
        exceptions: [],
        tenantId: user?.tenantId || ''
      };
      const res = await api.createProfessional(newPro);
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

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-[#D4AF37]" size={48} /></div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
        <div>
           <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Schedule <span className="gold-text-gradient font-light">Architecture</span></h1>
           <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.4em] mt-2">Matriz de Operaciones y Personal</p>
        </div>
        <div className="flex gap-4">
           <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
              <button onClick={() => setActiveTab('MATRIX')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'MATRIX' ? 'bg-[#D4AF37] text-black' : 'text-zinc-500'}`}>Matriz Hoy</button>
              <button onClick={() => setActiveTab('WEEKLY')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'WEEKLY' ? 'bg-[#D4AF37] text-black' : 'text-zinc-500'}`}>Horarios Base</button>
           </div>
           <button onClick={() => { setProFormData({ name: '', role: '', email: '', aurum_employee_id: '' }); setIsCreateProModalOpen(true); }} className="gold-btn text-black px-10 py-4 rounded-2xl text-[9px] uppercase tracking-widest font-black">Integrar Especialista</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden">
            <div className="p-6 bg-white/5 border-b border-white/5">
               <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nodos Profesionales</h3>
            </div>
            {professionals.map(pro => (
                <div key={pro.id} className={`p-6 cursor-pointer border-l-4 transition-all ${selectedProId === pro.id ? 'bg-[#D4AF37]/5 border-[#D4AF37]' : 'border-transparent hover:bg-white/5'}`} onClick={() => setSelectedProId(pro.id)}>
                    <p className={`font-black text-sm uppercase ${selectedProId === pro.id ? 'text-white' : 'text-zinc-500'}`}>{pro.name}</p>
                    <p className="text-[9px] text-zinc-600 font-bold uppercase mt-1">{pro.role}</p>
                    {selectedProId === pro.id && (
                       <button onClick={(e) => { e.stopPropagation(); setProFormData(pro); setIsEditProModalOpen(true); }} className="mt-4 text-[9px] font-black text-[#D4AF37] uppercase hover:underline flex items-center gap-2">
                         <Settings size={12}/> Configurar Perfil
                       </button>
                    )}
                </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-9">
           {activeTab === 'MATRIX' ? (
              <div className="glass-card rounded-[3.5rem] border-white/5 overflow-hidden animate-entrance">
                 <div className="p-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                       <button onClick={() => changeDate(-1)} className="p-3 bg-black/40 rounded-xl text-zinc-500 hover:text-white border border-white/5"><ChevronLeft size={20}/></button>
                       <div className="text-center min-w-[200px]">
                          <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest mb-1">{selectedDate.toLocaleDateString('es-ES', { weekday: 'long' })}</p>
                          <p className="text-xl font-black text-white uppercase tracking-tighter">{selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                       </div>
                       <button onClick={() => changeDate(1)} className="p-3 bg-black/40 rounded-xl text-zinc-500 hover:text-white border border-white/5"><ChevronRight size={20}/></button>
                    </div>
                    <div className="flex items-center gap-3 px-6 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                       <Activity size={14} className="text-emerald-500" />
                       <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Sincronización Live</span>
                    </div>
                 </div>

                 <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                       <div className="grid grid-cols-[100px_1fr] border-b border-white/5">
                          <div className="p-6 border-r border-white/5" />
                          <div className="p-6 font-black text-[10px] text-zinc-600 uppercase tracking-[0.4em]">Matrix Operativa • {selectedPro?.name}</div>
                       </div>
                       
                       <div className="divide-y divide-white/5">
                          {HOURS.map(hour => {
                             const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                             const apt = appointments.find(a => 
                               a.professionalId === selectedProId && 
                               new Date(a.startDateTime).toDateString() === selectedDate.toDateString() &&
                               new Date(a.startDateTime).getHours() === hour
                             );

                             return (
                                <div key={hour} className="grid grid-cols-[100px_1fr] group">
                                   <div className="p-6 border-r border-white/5 flex items-center justify-center">
                                      <span className="text-xs font-black text-zinc-500 group-hover:text-[#D4AF37] transition-colors">{timeStr}</span>
                                   </div>
                                   <div className="p-2 relative min-h-[80px] bg-black/20 group-hover:bg-white/[0.02] transition-all">
                                      {apt ? (
                                         <div className="absolute inset-2 bg-gradient-to-tr from-[#D4AF37] to-[#B8860B] rounded-2xl p-4 shadow-xl flex flex-col justify-center border border-white/20">
                                            <p className="text-[9px] font-black text-black/60 uppercase tracking-widest leading-none mb-1">Cita Confirmada</p>
                                            <h4 className="text-sm font-black text-black uppercase truncate">{apt.title}</h4>
                                            <p className="text-[10px] font-bold text-black/80 truncate">Cli: {apt.clientName}</p>
                                         </div>
                                      ) : (
                                         <div className="h-full w-full rounded-2xl border border-dashed border-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Plus size={20} className="text-zinc-800" />
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
              <div className="glass-card rounded-[3.5rem] border-white/5 p-12 animate-entrance text-center">
                 <Clock size={48} className="mx-auto mb-6 text-[#D4AF37] opacity-40" />
                 <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Configuración de Horarios</h3>
                 <p className="text-zinc-500 text-sm mb-10">Módulo de gestión de jornadas laborales en desarrollo.</p>
                 <button onClick={() => setActiveTab('MATRIX')} className="gold-btn px-10 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest">Volver a la Matriz</button>
              </div>
           )}
        </div>
      </div>

      {(isEditProModalOpen || isCreateProModalOpen) && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
              <div className="glass-card w-full max-w-xl rounded-[3.5rem] overflow-hidden border-[#D4AF37]/20 animate-scale-in">
                  <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/5">
                      <h3 className="font-black text-xl text-white uppercase tracking-tighter">{isCreateProModalOpen ? 'Integrar Nodo Maestro' : 'Editar Especialista'}</h3>
                      <button onClick={() => { setIsEditProModalOpen(false); setIsCreateProModalOpen(false); }} className="text-zinc-500 hover:text-white p-2 hover:bg-white/5 rounded-xl"><X size={24}/></button>
                  </div>
                  <form onSubmit={handleSaveProData} className="p-10 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div>
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 block ml-1">Nombre de Operación</label>
                            <input required type="text" value={proFormData.name || ''} onChange={e => setProFormData({...proFormData, name: e.target.value})} className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37]" placeholder="Ej: Dra. Valeria" />
                         </div>
                         <div>
                            <label className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest mb-3 block ml-1">Aurum Employee ID</label>
                            <div className="relative">
                                <Fingerprint className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700" size={18} />
                                <input placeholder="EMP-XXX" type="text" value={proFormData.aurum_employee_id || ''} onChange={e => setProFormData({...proFormData, aurum_employee_id: e.target.value})} className="w-full pl-14 pr-5 py-5 bg-black/40 border border-white/5 rounded-2xl text-white font-black text-xs placeholder-zinc-800 outline-none focus:border-[#D4AF37]" />
                            </div>
                         </div>
                         <div className="md:col-span-2">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 block ml-1">Rol / Especialidad</label>
                            <input required type="text" value={proFormData.role || ''} onChange={e => setProFormData({...proFormData, role: e.target.value})} className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37]" placeholder="Ej: Master Artist Microblading" />
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
