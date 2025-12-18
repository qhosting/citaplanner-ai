import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, ShieldAlert, Plus, Trash2, 
  Save, Check, Coffee, CalendarDays, Settings, X, Loader2
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

  const handleSaveProData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPro) return;
    
    setSaving(true);
    const updatedPro = { ...selectedPro, ...proFormData };
    
    setProfessionals(prev => prev.map(p => p.id === selectedProId ? updatedPro : p));
    
    const success = await api.updateProfessional(updatedPro);
    setSaving(false);
    
    if (success) {
      setIsEditProModalOpen(false);
      toast.success("Profesional actualizado");
    } else {
      toast.error("Error al guardar cambios del profesional.");
      loadProfessionals(); 
    }
  };

  const handleCreatePro = async () => {
      const name = prompt("Nombre del nuevo profesional:");
      if(!name) return;
      const role = prompt("Rol/Especialidad:");
      if(!role) return;

      const newPro: Omit<Professional, 'id'> = {
          name, role, email: '', 
          weeklySchedule: DAYS_OF_WEEK.map(d => ({
            dayOfWeek: d.id,
            isEnabled: d.id !== 0 && d.id !== 6,
            slots: [{ start: '09:00', end: '18:00' }]
          })),
          exceptions: []
      };
      
      setLoading(true);
      const res = await api.createProfessional(newPro);
      if(res.success) {
          await loadProfessionals();
          if(res.id) setSelectedProId(res.id);
          toast.success("Profesional creado");
      } else {
          toast.error("Error creando profesional");
      }
      setLoading(false);
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
      toast.success("Horarios guardados correctamente.");
    } else {
      toast.error("Error al guardar en el servidor.");
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
    toast.success("Excepción añadida");
  };

  const removeException = async (exceptionId: string) => {
    if (!selectedPro) return;
    if (!window.confirm("¿Eliminar esta excepción?")) return;

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
      case 'VACATION': return { label: 'Vacaciones', color: 'bg-green-100 text-green-700 border-green-200' };
      case 'HOLIDAY': return { label: 'Festivo', color: 'bg-purple-100 text-purple-700 border-purple-200' };
      case 'UNAVAILABLE': return { label: 'Bloqueo / Ausencia', color: 'bg-red-100 text-red-700 border-red-200' };
      default: return { label: type, color: 'bg-slate-100' };
    }
  };

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
      );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Clock className="text-indigo-600" />
            Gestión de Horarios
          </h1>
          <p className="text-slate-500 mt-1">Configura disponibilidad, turnos y vacaciones del personal.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <User size={18} /> Profesionales
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {professionals.map(pro => (
                <div 
                   key={pro.id}
                   className={`flex items-center justify-between p-4 transition-colors ${
                    selectedProId === pro.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'border-l-4 border-transparent hover:bg-slate-50'
                   }`}
                >
                    <button
                        onClick={() => setSelectedProId(pro.id)}
                        className="text-left flex-grow"
                    >
                        <p className={`font-medium ${selectedProId === pro.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                        {pro.name}
                        </p>
                        <p className="text-xs text-slate-500">{pro.role}</p>
                    </button>
                    {selectedProId === pro.id && (
                        <button 
                            onClick={openEditProModal}
                            className="p-1.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-700 rounded-md transition-colors"
                            title="Editar Datos del Profesional"
                        >
                            <Settings size={16} />
                        </button>
                    )}
                </div>
              ))}
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100">
               <button 
                 onClick={handleCreatePro}
                 className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-slate-500 text-sm hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
               >
                 <Plus size={16} /> Agregar Profesional
               </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {professionals.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                  <User size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">No hay profesionales registrados.</p>
                  <button onClick={handleCreatePro} className="text-indigo-600 font-medium hover:underline mt-2">Crea el primero</button>
              </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm min-h-[600px]">
                <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('WEEKLY')}
                    className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'WEEKLY' 
                        ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <CalendarDays size={18} />
                    Horario Base Semanal
                </button>
                <button
                    onClick={() => setActiveTab('EXCEPTIONS')}
                    className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'EXCEPTIONS' 
                        ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <ShieldAlert size={18} />
                    Excepciones y Vacaciones
                </button>
                </div>

                {activeTab === 'WEEKLY' && selectedPro && (
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Configuración Recurrente</h3>
                    <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1">
                        <Coffee size={12} />
                        <span>Permite configurar pausas agregando múltiples franjas</span>
                    </div>
                    </div>

                    <div className="space-y-4">
                    {DAYS_OF_WEEK.map((dayObj) => {
                        const schedule = selectedPro.weeklySchedule.find(d => d.dayOfWeek === dayObj.id);
                        const isEnabled = schedule?.isEnabled ?? false;
                        const slots = schedule?.slots || [];

                        return (
                        <div key={dayObj.id} className={`p-4 rounded-lg border transition-all ${isEnabled ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-75'}`}>
                            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                            
                            <div className="w-32 flex-shrink-0 pt-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isEnabled ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                    <input 
                                    type="checkbox" 
                                    className="hidden" 
                                    checked={isEnabled}
                                    onChange={() => handleToggleDay(dayObj.id)}
                                    />
                                    {isEnabled && <Check size={12} className="text-white" />}
                                </div>
                                <span className={`font-medium ${isEnabled ? 'text-slate-800' : 'text-slate-400'}`}>
                                    {dayObj.name}
                                </span>
                                </label>
                            </div>

                            <div className="flex-grow">
                                {isEnabled ? (
                                <div className="space-y-3">
                                    {slots.map((slot, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <input
                                        type="time"
                                        value={slot.start}
                                        onChange={(e) => handleTimeChange(dayObj.id, index, 'start', e.target.value)}
                                        className="p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        />
                                        <span className="text-slate-400">-</span>
                                        <input
                                        type="time"
                                        value={slot.end}
                                        onChange={(e) => handleTimeChange(dayObj.id, index, 'end', e.target.value)}
                                        className="p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        />
                                        {slots.length > 1 && (
                                        <button 
                                            onClick={() => removeSlot(dayObj.id, index)}
                                            className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        )}
                                    </div>
                                    ))}
                                    <button 
                                    onClick={() => addSlot(dayObj.id)}
                                    className="text-xs text-indigo-600 font-medium flex items-center gap-1 hover:underline mt-2"
                                    >
                                    <Plus size={14} /> Agregar Turno / Pausa
                                    </button>
                                </div>
                                ) : (
                                <div className="pt-2 text-sm text-slate-400 italic flex items-center gap-2">
                                    <ShieldAlert size={16} /> No disponible
                                </div>
                                )}
                            </div>
                            </div>
                        </div>
                        );
                    })}
                    </div>
                    
                    <div className="mt-8 flex justify-end">
                    <button 
                        onClick={handleSaveSchedule}
                        disabled={saving}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 shadow-md shadow-indigo-200 flex items-center gap-2 disabled:opacity-70"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Guardar Cambios
                    </button>
                    </div>
                </div>
                )}

                {activeTab === 'EXCEPTIONS' && selectedPro && (
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                        <h3 className="font-bold text-slate-800 mb-4">Agregar Excepción</h3>
                        <form onSubmit={handleAddException} className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                            <select 
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                            value={newException.type}
                            onChange={(e) => setNewException({...newException, type: e.target.value as ExceptionType})}
                            >
                            <option value="UNAVAILABLE">Bloqueo Horario</option>
                            <option value="VACATION">Vacaciones</option>
                            <option value="HOLIDAY">Día Festivo</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Desde</label>
                            <input 
                            type="date"
                            required
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                            value={newException.startDate}
                            onChange={(e) => setNewException({...newException, startDate: e.target.value})}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Hasta</label>
                            <input 
                            type="date"
                            required
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                            value={newException.endDate}
                            onChange={(e) => setNewException({...newException, endDate: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Motivo (Opcional)</label>
                            <input 
                            type="text"
                            placeholder="Ej: Consulta Médica"
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                            value={newException.description}
                            onChange={(e) => setNewException({...newException, description: e.target.value})}
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={saving}
                            className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-70 flex justify-center"
                        >
                            {saving ? <Loader2 className="animate-spin" size={16} /> : 'Agregar Bloqueo'}
                        </button>
                        </form>
                    </div>

                    <div className="md:col-span-2">
                        <h3 className="font-bold text-slate-800 mb-4">Próximas Ausencias y Bloqueos</h3>
                        
                        {selectedPro.exceptions.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            <Calendar className="mx-auto text-slate-300 mb-2" size={32} />
                            <p className="text-slate-500 text-sm">No hay excepciones configuradas.</p>
                        </div>
                        ) : (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                            {selectedPro.exceptions.map((exc) => {
                            const style = getExceptionLabel(exc.type);
                            return (
                                <div key={exc.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center group">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                                    <Calendar size={20} />
                                    </div>
                                    <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${style.color}`}>
                                        {style.label}
                                        </span>
                                        {exc.description && <span className="text-sm font-medium text-slate-800">- {exc.description}</span>}
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        {new Date(exc.startDate).toLocaleDateString()} <span className="text-slate-300 mx-1">➜</span> {new Date(exc.endDate).toLocaleDateString()}
                                    </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => removeException(exc.id)}
                                    disabled={saving}
                                    className="text-slate-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={18} />
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

      {isEditProModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-scale-in">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-800">Editar Profesional</h3>
                      <button onClick={() => setIsEditProModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={20} />
                      </button>
                  </div>
                  <form onSubmit={handleSaveProData} className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                          <input 
                              required
                              type="text"
                              value={proFormData.name || ''}
                              onChange={(e) => setProFormData({...proFormData, name: e.target.value})}
                              className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Rol / Especialidad</label>
                          <input 
                              required
                              type="text"
                              value={proFormData.role || ''}
                              onChange={(e) => setProFormData({...proFormData, role: e.target.value})}
                              className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                          <input 
                              type="email"
                              value={proFormData.email || ''}
                              onChange={(e) => setProFormData({...proFormData, email: e.target.value})}
                              className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Nacimiento</label>
                          <input 
                              type="date"
                              value={proFormData.birthDate || ''}
                              onChange={(e) => setProFormData({...proFormData, birthDate: e.target.value})}
                              className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">Para enviar felicitaciones de cumpleaños.</p>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                          <button 
                            type="button" 
                            onClick={() => setIsEditProModalOpen(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                          >
                              Cancelar
                          </button>
                          <button 
                            type="submit" 
                            disabled={saving}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2"
                          >
                              {saving && <Loader2 className="animate-spin" size={16} />}
                              Guardar Cambios
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};