
import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, ShieldAlert, Plus, Trash2, 
  Save, Check, Coffee, CalendarDays, Settings, X, Loader2, Sparkles, Mail, Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { Professional, ScheduleException, ExceptionType } from '../types';
import { api } from '../services/api';

const DAYS_OF_WEEK = [
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sábado' },
  { id: 0, name: 'Domingo' },
];

export const SchedulesPage: React.FC = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedProId, setSelectedProId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'WEEKLY' | 'EXCEPTIONS'>('WEEKLY');
  
  const [isEditProModalOpen, setIsEditProModalOpen] = useState(false);
  const [isCreateProModalOpen, setIsCreateProModalOpen] = useState(false);
  const [proFormData, setProFormData] = useState<Partial<Professional>>({});

  const [newException, setNewException] = useState<{
    startDate: string;
    endDate: string;
    type: ExceptionType;
    description: string;
  }>({
    startDate: '',
    endDate: '',
    type: 'UNAVAILABLE',
    description: ''
  });

  useEffect(() => {
    loadProfessionals();
  }, []);

  const loadProfessionals = async () => {
    setLoading(true);
    const data = await api.getProfessionals();
    setProfessionals(data);
    if (data.length > 0 && !selectedProId) {
      setSelectedProId(data[0].id);
    }
    setLoading(false);
  };

  const selectedPro = professionals.find(p => p.id === selectedProId) || professionals[0];

  const openEditProModal = () => {
    setProFormData({
        name: selectedPro.name,
        role: selectedPro.role,
        email: selectedPro.email,
        birthDate: selectedPro.birthDate || ''
    });
    setIsEditProModalOpen(true);
  };

  const openCreateProModal = () => {
    setProFormData({
      name: '',
      role: '',
      email: '',
      birthDate: ''
    });
    setIsCreateProModalOpen(true);
  };

  const handleSaveProData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPro && !isCreateProModalOpen) return;
    
    setSaving(true);
    
    if (isCreateProModalOpen) {
      const newPro: Omit<Professional, 'id'> = {
        name: proFormData.name || '',
        role: proFormData.role || '',
        email: proFormData.email || '',
        birthDate: proFormData.birthDate,
        weeklySchedule: DAYS_OF_WEEK.map(d => ({
          dayOfWeek: d.id,
          isEnabled: d.id !== 0 && d.id !== 6,
          slots: [{ start: '09:00', end: '18:00' }]
        })),
        exceptions: []
      };
      
      const res = await api.createProfessional(newPro);
      if (res.success) {
        await loadProfessionals();
        if (res.id) setSelectedProId(res.id);
        toast.success("Nuevo profesional integrado al ecosistema");
        setIsCreateProModalOpen(false);
      } else {
        toast.error("Error en la creación del nodo profesional");
      }
    } else {
      const updatedPro = { ...selectedPro, ...proFormData };
      setProfessionals(prev => prev.map(p => p.id === selectedProId ? updatedPro : p));
      const success = await api.updateProfessional(updatedPro);
      if (success) {
        setIsEditProModalOpen(false);
        toast.success("Perfil actualizado con éxito");
      } else {
        toast.error("Error sincronizando cambios");
        loadProfessionals();
      }
    }
    setSaving(false);
  };

  const handleToggleDay = (dayId: number) => {
    if (!selectedPro) return;
    const updatedSchedule = selectedPro.weeklySchedule.map(day => {
      if (day.dayOfWeek === dayId) {
        return { ...day, isEnabled: !day.isEnabled };
      }
      return day;
    });
    updateProfessionalLocal(updatedSchedule, 'weeklySchedule');
  };

  const handleTimeChange = (dayId: number, slotIndex: number, field: 'start' | 'end', value: string) => {
    if (!selectedPro) return;
    const updatedSchedule = selectedPro.weeklySchedule.map(day => {
      if (day.dayOfWeek === dayId) {
        const newSlots = [...day.slots];
        newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
        return { ...day, slots: newSlots };
      }
      return day;
    });
    updateProfessionalLocal(updatedSchedule, 'weeklySchedule');
  };

  const addSlot = (dayId: number) => {
    if (!selectedPro) return;
    const updatedSchedule = selectedPro.weeklySchedule.map(day => {
      if (day.dayOfWeek === dayId) {
        const lastSlot = day.slots[day.slots.length - 1];
        let newStart = '13:00';
        let newEnd = '14:00';
        
        if (lastSlot) {
             newStart = lastSlot.end;
             newEnd = '18:00'; 
        }

        return { ...day, slots: [...day.slots, { start: newStart, end: newEnd }] };
      }
      return day;
    });
    updateProfessionalLocal(updatedSchedule, 'weeklySchedule');
  };

  const removeSlot = (dayId: number, slotIndex: number) => {
    if (!selectedPro) return;
    const updatedSchedule = selectedPro.weeklySchedule.map(day => {
      if (day.dayOfWeek === dayId) {
        const newSlots = day.slots.filter((_, idx) => idx !== slotIndex);
        return { ...day, slots: newSlots };
      }
      return day;
    });
    updateProfessionalLocal(updatedSchedule, 'weeklySchedule');
  };

  const updateProfessionalLocal = (newData: any, field: keyof Professional) => {
    setProfessionals(prev => prev.map(p => 
      p.id === selectedProId ? { ...p, [field]: newData } : p
    ));
  };

  const handleSaveSchedule = async () => {
    if (!selectedPro) return;
    setSaving(true);
    const success = await api.updateProfessional(selectedPro);
    setSaving(false);
    if (success) {
      toast.success("Matriz de horarios sincronizada");
    } else {
      toast.error("Fallo en la comunicación con la infraestructura");
    }
  };

  const handleAddException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newException.startDate || !newException.endDate || !selectedPro) return;

    const exception: ScheduleException = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      startDate: new Date(newException.startDate).toISOString(),
      endDate: new Date(newException.endDate).toISOString(),
      type: newException.type,
      description: newException.description
    };

    const updatedExceptions = [...selectedPro.exceptions, exception];
    const updatedPro = { ...selectedPro, exceptions: updatedExceptions };
    setProfessionals(prev => prev.map(p => p.id === selectedProId ? updatedPro : p));

    setNewException({ startDate: '', endDate: '', type: 'UNAVAILABLE', description: '' });

    setSaving(true);
    await api.updateProfessional(updatedPro);
    setSaving(false);
    toast.success("Excepción de calendario registrada");
  };

  const removeException = async (exceptionId: string) => {
    if (!selectedPro) return;
    if (!window.confirm("¿Confirmar eliminación de excepción?")) return;

    const updatedExceptions = selectedPro.exceptions.filter(exc => exc.id !== exceptionId);
    const updatedPro = { ...selectedPro, exceptions: updatedExceptions };
    
    setProfessionals(prev => prev.map(p => p.id === selectedProId ? updatedPro : p));
    
    setSaving(true);
    await api.updateProfessional(updatedPro);
    setSaving(false);
    toast.success("Excepción eliminada");
  };

  const getExceptionLabel = (type: ExceptionType) => {
    switch (type) {
      case 'VACATION': return { label: 'Vacaciones', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
      case 'HOLIDAY': return { label: 'Festivo', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' };
      case 'UNAVAILABLE': return { label: 'Bloqueo Master', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
      default: return { label: type, color: 'bg-white/5' };
    }
  };

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center bg-black">
              <Loader2 className="animate-spin text-[#D4AF37]" size={48} />
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
            Schedule <span className="gold-text-gradient font-light">Architecture</span>
          </h1>
          <p className="text-slate-600 font-bold uppercase tracking-[0.4em] text-[10px] ml-5 mt-2">Personal Management • Aurum Operational Node</p>
        </div>
        <button 
          onClick={openCreateProModal}
          className="gold-btn text-black px-10 py-5 rounded-2xl flex items-center gap-3 font-black text-[9px] uppercase tracking-widest shadow-2xl"
        >
          <Plus size={18} /> Integrar Nuevo Especialista
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        
        <div className="lg:col-span-1">
          <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-white/5">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                <User size={16} className="text-[#D4AF37]" /> Staff Activo
              </h3>
            </div>
            <div className="divide-y divide-white/5">
              {professionals.map(pro => (
                <div 
                   key={pro.id}
                   className={`flex items-center justify-between p-6 transition-all cursor-pointer ${
                    selectedProId === pro.id ? 'bg-[#D4AF37]/5 border-l-4 border-[#D4AF37]' : 'border-l-4 border-transparent hover:bg-white/5'
                   }`}
                   onClick={() => setSelectedProId(pro.id)}
                >
                    <div className="text-left">
                        <p className={`font-black text-sm uppercase tracking-tight ${selectedProId === pro.id ? 'text-white' : 'text-slate-500'}`}>
                        {pro.name}
                        </p>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">{pro.role}</p>
                    </div>
                    {selectedProId === pro.id && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); openEditProModal(); }}
                            className="p-2 text-slate-600 hover:text-[#D4AF37] transition-colors"
                        >
                            <Settings size={14} />
                        </button>
                    )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {professionals.length === 0 ? (
              <div className="glass-card rounded-[3.5rem] border-dashed border-white/10 p-24 text-center">
                  <User size={64} className="mx-auto text-slate-800 mb-8" />
                  <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-[10px]">No se detectan nodos de personal activos</p>
                  <button onClick={openCreateProModal} className="text-[#D4AF37] font-black uppercase tracking-widest text-[9px] mt-6 border-b border-[#D4AF37]/30 pb-1">Iniciar Secuencia de Creación</button>
              </div>
          ) : (
            <div className="glass-card rounded-[3.5rem] border-white/5 min-h-[600px] overflow-hidden">
                <div className="flex border-b border-white/5 bg-white/5">
                <button
                    onClick={() => setActiveTab('WEEKLY')}
                    className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${
                    activeTab === 'WEEKLY' 
                        ? 'text-[#D4AF37] bg-[#D4AF37]/5' 
                        : 'text-slate-500 hover:text-white'
                    }`}
                >
                    <CalendarDays size={18} /> Disponibilidad Base
                </button>
                <button
                    onClick={() => setActiveTab('EXCEPTIONS')}
                    className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${
                    activeTab === 'EXCEPTIONS' 
                        ? 'text-[#D4AF37] bg-[#D4AF37]/5' 
                        : 'text-slate-500 hover:text-white'
                    }`}
                >
                    <ShieldAlert size={18} /> Bloqueos y Vacaciones
                </button>
                </div>

                {activeTab === 'WEEKLY' && selectedPro && (
                <div className="p-10 space-y-10">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black text-white tracking-tighter uppercase">Configuración de Turnos</h3>
                      <div className="bg-white/5 px-5 py-2 rounded-full border border-white/5 flex items-center gap-3">
                          <Coffee size={14} className="text-[#D4AF37]" />
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Soporta múltiples franjas horarias</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                    {DAYS_OF_WEEK.map((dayObj) => {
                        const schedule = selectedPro.weeklySchedule.find(d => d.dayOfWeek === dayObj.id);
                        const isEnabled = schedule?.isEnabled ?? false;
                        const slots = schedule?.slots || [];

                        return (
                        <div key={dayObj.id} className={`p-6 rounded-[2rem] border transition-all ${isEnabled ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5 opacity-40'}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-8">
                            
                            <div className="w-32 flex-shrink-0">
                                <label className="flex items-center gap-4 cursor-pointer group">
                                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${isEnabled ? 'bg-[#D4AF37] border-[#D4AF37]' : 'bg-black/40 border-white/10'}`}>
                                    <input 
                                      type="checkbox" 
                                      className="hidden" 
                                      checked={isEnabled}
                                      onChange={() => handleToggleDay(dayObj.id)}
                                    />
                                    {isEnabled && <Check size={14} className="text-black font-black" />}
                                </div>
                                <span className={`font-black text-xs uppercase tracking-widest transition-colors ${isEnabled ? 'text-white' : 'text-slate-700'}`}>
                                    {dayObj.name}
                                </span>
                                </label>
                            </div>

                            <div className="flex-grow">
                                {isEnabled ? (
                                <div className="flex flex-wrap gap-4 items-center">
                                    {slots.map((slot, index) => (
                                    <div key={index} className="flex items-center gap-4 bg-black/40 p-3 rounded-2xl border border-white/5">
                                        <input
                                          type="time"
                                          value={slot.start}
                                          onChange={(e) => handleTimeChange(dayObj.id, index, 'start', e.target.value)}
                                          className="bg-transparent text-white font-black text-xs outline-none focus:text-[#D4AF37] transition-colors"
                                        />
                                        <span className="text-slate-700 font-bold">—</span>
                                        <input
                                          type="time"
                                          value={slot.end}
                                          onChange={(e) => handleTimeChange(dayObj.id, index, 'end', e.target.value)}
                                          className="bg-transparent text-white font-black text-xs outline-none focus:text-[#D4AF37] transition-colors"
                                        />
                                        {slots.length > 1 && (
                                        <button 
                                            onClick={() => removeSlot(dayObj.id, index)}
                                            className="text-slate-600 hover:text-rose-500 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                        )}
                                    </div>
                                    ))}
                                    <button 
                                      onClick={() => addSlot(dayObj.id)}
                                      className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all"
                                    >
                                      <Plus size={16} />
                                    </button>
                                </div>
                                ) : (
                                <div className="text-[10px] text-slate-700 font-black uppercase tracking-widest italic flex items-center gap-2">
                                    <ShieldAlert size={14} /> Nodo Desactivado
                                </div>
                                )}
                            </div>
                            </div>
                        </div>
                        );
                    })}
                    </div>
                    
                    <div className="mt-12 flex justify-end">
                    <button 
                        onClick={handleSaveSchedule}
                        disabled={saving}
                        className="gold-btn text-black px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-4 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Sincronizar Matriz de Horarios
                    </button>
                    </div>
                </div>
                )}

                {activeTab === 'EXCEPTIONS' && selectedPro && (
                <div className="p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                      <div className="lg:col-span-5">
                          <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8">Nueva Excepción</h3>
                          <form onSubmit={handleAddException} className="space-y-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
                            <div>
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Categoría de Ausencia</label>
                                <select 
                                  className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37]"
                                  value={newException.type}
                                  onChange={(e) => setNewException({...newException, type: e.target.value as ExceptionType})}
                                >
                                  <option value="UNAVAILABLE">Bloqueo Horario</option>
                                  <option value="VACATION">Vacaciones</option>
                                  <option value="HOLIDAY">Día Festivo</option>
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Desde</label>
                                  <input 
                                    type="date"
                                    required
                                    className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37]"
                                    value={newException.startDate}
                                    onChange={(e) => setNewException({...newException, startDate: e.target.value})}
                                  />
                              </div>
                              
                              <div>
                                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Hasta</label>
                                  <input 
                                    type="date"
                                    required
                                    className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37]"
                                    value={newException.endDate}
                                    onChange={(e) => setNewException({...newException, endDate: e.target.value})}
                                  />
                              </div>
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Motivación Estratégica</label>
                                <input 
                                  type="text"
                                  placeholder="Ej: Congreso de Micropigmentación"
                                  className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37]"
                                  value={newException.description}
                                  onChange={(e) => setNewException({...newException, description: e.target.value})}
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={saving}
                                className="w-full bg-white/5 text-slate-400 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {saving ? <Loader2 className="animate-spin" size={16} /> : <ShieldAlert size={16} />} 
                                Registrar Bloqueo
                            </button>
                          </form>
                      </div>

                      <div className="lg:col-span-7">
                          <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8">Ausencias Planificadas</h3>
                          
                          {selectedPro.exceptions.length === 0 ? (
                            <div className="py-24 border border-dashed border-white/10 rounded-[3rem] text-center opacity-40">
                                <Calendar className="mx-auto text-slate-800 mb-6" size={48} />
                                <p className="text-[10px] font-black uppercase tracking-widest">Sin excepciones detectadas</p>
                            </div>
                          ) : (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                                {selectedPro.exceptions.map((exc) => {
                                  const style = getExceptionLabel(exc.type);
                                  return (
                                      <div key={exc.id} className="bg-white/5 p-6 rounded-[2rem] border border-white/5 flex justify-between items-center group hover:border-white/10 transition-all">
                                        <div className="flex items-start gap-5">
                                            <div className="p-3 bg-black/40 rounded-2xl text-slate-500 group-hover:text-[#D4AF37] transition-colors">
                                              <Calendar size={20} />
                                            </div>
                                            <div>
                                              <div className="flex items-center gap-3 mb-2">
                                                  <span className={`text-[8px] font-black px-3 py-1 rounded-full border ${style.color}`}>
                                                    {style.label}
                                                  </span>
                                                  {exc.description && <span className="text-xs font-black text-white uppercase tracking-tight">{exc.description}</span>}
                                              </div>
                                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                  {new Date(exc.startDate).toLocaleDateString()} <span className="text-slate-800 mx-2">➜</span> {new Date(exc.endDate).toLocaleDateString()}
                                              </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => removeException(exc.id)}
                                            disabled={saving}
                                            className="w-10 h-10 rounded-xl bg-white/5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all flex items-center justify-center"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                      </div>
                                  );
                                })}
                            </div>
                          )}
                      </div>
                    </div>
                </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL UNIFICADO: CREACIÓN / EDICIÓN */}
      {(isEditProModalOpen || isCreateProModalOpen) && (
          <div className="fixed inset-0 bg-[#050505]/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
              <div className="glass-card w-full max-w-xl rounded-[3.5rem] overflow-hidden border-[#D4AF37]/20 animate-scale-in">
                  <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                      <div className="flex items-center gap-4">
                        <Sparkles className="text-[#D4AF37]" size={24} />
                        <h3 className="font-black text-xl text-white tracking-tighter uppercase">
                          {isCreateProModalOpen ? 'Integrar Nodo Maestro' : 'Editar Especialista'}
                        </h3>
                      </div>
                      <button onClick={() => { setIsEditProModalOpen(false); setIsCreateProModalOpen(false); }} className="p-3 text-slate-500 hover:text-white transition-colors">
                          <X size={24} />
                      </button>
                  </div>
                  <form onSubmit={handleSaveProData} className="p-10 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Nombre Completo</label>
                            <div className="relative">
                              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
                              <input 
                                  required
                                  type="text"
                                  placeholder="Elena Valery"
                                  value={proFormData.name || ''}
                                  onChange={(e) => setProFormData({...proFormData, name: e.target.value})}
                                  className="w-full pl-14 pr-6 py-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37] transition-all"
                              />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Rol / Especialidad</label>
                            <div className="relative">
                              <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
                              <input 
                                  required
                                  type="text"
                                  placeholder="Master Artist"
                                  value={proFormData.role || ''}
                                  onChange={(e) => setProFormData({...proFormData, role: e.target.value})}
                                  className="w-full pl-14 pr-6 py-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37] transition-all"
                              />
                            </div>
                        </div>
                      </div>
                      
                      <div>
                          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Correo Institucional</label>
                          <div className="relative">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
                            <input 
                                type="email"
                                placeholder="elena@aurum.mx"
                                value={proFormData.email || ''}
                                onChange={(e) => setProFormData({...proFormData, email: e.target.value})}
                                className="w-full pl-14 pr-6 py-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37] transition-all"
                            />
                          </div>
                      </div>

                      <div>
                          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Fecha de Nacimiento</label>
                          <div className="relative">
                            <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
                            <input 
                                type="date"
                                value={proFormData.birthDate || ''}
                                onChange={(e) => setProFormData({...proFormData, birthDate: e.target.value})}
                                className="w-full pl-14 pr-6 py-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37] transition-all"
                            />
                          </div>
                      </div>

                      <div className="flex justify-end gap-6 pt-10 border-t border-white/5">
                          <button 
                            type="button" 
                            onClick={() => { setIsEditProModalOpen(false); setIsCreateProModalOpen(false); }}
                            className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors"
                          >
                              Abortar Operación
                          </button>
                          <button 
                            type="submit" 
                            disabled={saving}
                            className="gold-btn text-black px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3 disabled:opacity-50"
                          >
                              {saving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                              Confirmar Identidad
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
