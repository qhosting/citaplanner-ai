
import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, ShieldAlert, Plus, Trash2, 
  Save, Check, Coffee, CalendarDays, Settings, X, Loader2, Sparkles, Mail, Briefcase, Fingerprint
} from 'lucide-react';
import { toast } from 'sonner';
import { Professional, ScheduleException, ExceptionType } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

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
  const { user } = useAuth();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedProId, setSelectedProId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'WEEKLY' | 'EXCEPTIONS'>('WEEKLY');
  
  const [isEditProModalOpen, setIsEditProModalOpen] = useState(false);
  const [isCreateProModalOpen, setIsCreateProModalOpen] = useState(false);
  const [proFormData, setProFormData] = useState<Partial<Professional>>({});

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

  if (loading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-[#D4AF37]" size={48} /></div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-black text-white uppercase">Schedule <span className="gold-text-gradient font-light">Architecture</span></h1>
        <button onClick={() => { setProFormData({ name: '', role: '', email: '', aurum_employee_id: '' }); setIsCreateProModalOpen(true); }} className="gold-btn text-black px-10 py-4 rounded-2xl text-[9px] uppercase tracking-widest font-black">Integrar Especialista</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-1">
          <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden">
            {professionals.map(pro => (
                <div key={pro.id} className={`p-6 cursor-pointer border-l-4 transition-all ${selectedProId === pro.id ? 'bg-[#D4AF37]/5 border-[#D4AF37]' : 'border-transparent hover:bg-white/5'}`} onClick={() => setSelectedProId(pro.id)}>
                    <p className={`font-black text-sm uppercase ${selectedProId === pro.id ? 'text-white' : 'text-zinc-500'}`}>{pro.name}</p>
                    <p className="text-[9px] text-zinc-600 font-bold uppercase mt-1">{pro.aurum_employee_id || 'SIN ID AURUM'}</p>
                    {selectedProId === pro.id && <button onClick={() => { setProFormData(pro); setIsEditProModalOpen(true); }} className="mt-4 text-[9px] font-black text-[#D4AF37] uppercase">Editar Perfil</button>}
                </div>
            ))}
          </div>
        </div>
        {/* Resto de UI de horarios... */}
      </div>

      {(isEditProModalOpen || isCreateProModalOpen) && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
              <div className="glass-card w-full max-w-xl rounded-[3.5rem] overflow-hidden border-[#D4AF37]/20 animate-scale-in">
                  <div className="p-10 border-b border-white/5 flex justify-between items-center">
                      <h3 className="font-black text-xl text-white uppercase">{isCreateProModalOpen ? 'Integrar Nodo Maestro' : 'Editar Especialista'}</h3>
                      <button onClick={() => { setIsEditProModalOpen(false); setIsCreateProModalOpen(false); }} className="text-zinc-500 hover:text-white"><X size={24}/></button>
                  </div>
                  <form onSubmit={handleSaveProData} className="p-10 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 block">Nombre de Operación</label>
                            <input required type="text" value={proFormData.name || ''} onChange={e => setProFormData({...proFormData, name: e.target.value})} className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs" />
                         </div>
                         <div>
                            <label className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest mb-3 block">Aurum Employee ID</label>
                            <div className="relative">
                                <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={16} />
                                <input placeholder="EMP-XXX" type="text" value={proFormData.aurum_employee_id || ''} onChange={e => setProFormData({...proFormData, aurum_employee_id: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-2xl text-white font-black text-xs placeholder-zinc-800" />
                            </div>
                         </div>
                      </div>
                      <div className="flex justify-end gap-6 pt-10 border-t border-white/5">
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
