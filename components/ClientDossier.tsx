
import React, { useState, useEffect } from 'react';
import { 
  X, FileText, Activity, ShieldAlert, Sparkles, Plus, 
  Calendar, User, Beaker, Wand2, Loader2, History, TrendingUp, Info
} from 'lucide-react';
import { Client, TreatmentRecord } from '../types';
import { GoogleGenAI, Type } from '@google/genai';
import { toast } from 'sonner';

interface ClientDossierProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onUpdateClient: (updated: Client) => void;
}

export const ClientDossier: React.FC<ClientDossierProps> = ({ client, isOpen, onClose, onUpdateClient }) => {
  const [activeTab, setActiveTab] = useState<'RECORDS' | 'CLINICAL' | 'AI'>('RECORDS');
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<TreatmentRecord>>({
    serviceName: '',
    notes: '',
    pigmentsUsed: '',
    professionalName: 'Staff Shula'
  });
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const record: TreatmentRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      serviceName: newRecord.serviceName || 'Tratamiento Elite',
      notes: newRecord.notes || '',
      pigmentsUsed: newRecord.pigmentsUsed,
      professionalName: newRecord.professionalName || 'Staff Shula'
    };

    const updatedClient = {
      ...client,
      treatmentHistory: [record, ...client.treatmentHistory]
    };
    onUpdateClient(updatedClient);
    setIsAddingRecord(false);
    setNewRecord({ serviceName: '', notes: '', pigmentsUsed: '', professionalName: 'Staff Shula' });
    toast.success("Tratamiento registrado en el expediente");
  };

  const handleRunAIAnalysis = async () => {
    if (!process.env.API_KEY) return;
    setIsAnalyzing(true);
    setAiAnalysis(null);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      const prompt = `
        Analiza el expediente de este cliente de micropigmentación/estética avanzada:
        Nombre: ${client.name}
        Tipo de Piel: ${client.skinType || 'No especificado'}
        Alergias: ${client.allergies || 'Ninguna conocida'}
        Historial de Tratamientos: ${JSON.stringify(client.treatmentHistory)}
        
        Sugerencia técnica para su próxima sesión basándote en su historial. 
        Incluye precauciones si hay alergias. 
        Sé profesional y sofisticado. Máximo 60 palabras.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            systemInstruction: "Eres un Consultor Senior de Estética Avanzada para CitaPlanner."
        }
      });

      setAiAnalysis(response.text);
    } catch (error) {
      toast.error("Error en la conexión neuronal AI");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#050505]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-5xl rounded-[3.5rem] overflow-hidden flex flex-col max-h-[90vh] border-[#D4AF37]/20 shadow-[0_0_100px_rgba(212,175,55,0.1)]">
        
        {/* Header */}
        <div className="p-10 border-b border-white/5 flex justify-between items-start">
          <div className="flex gap-8">
            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-[#111] to-black border border-[#D4AF37]/30 flex items-center justify-center text-3xl font-black text-[#D4AF37] shadow-2xl">
              {client.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Expediente Clínico Master</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{client.name}</h2>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-2">ID Red: {client.phone}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-2xl transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-10 border-b border-white/5 bg-black/20">
          {[
            { id: 'RECORDS', label: 'Historial Sesiones', icon: History },
            { id: 'CLINICAL', label: 'Ficha Biométrica', icon: Activity },
            { id: 'AI', label: 'Análisis Estratégico AI', icon: Wand2 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] transition-all border-b-2 ${
                activeTab === tab.id ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5' : 'border-transparent text-slate-500 hover:text-white'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 bg-black/10">
          
          {activeTab === 'RECORDS' && (
            <div className="space-y-8 animate-entrance">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Sesiones Registradas</h3>
                <button 
                  onClick={() => setIsAddingRecord(true)}
                  className="gold-btn px-8 py-3 rounded-xl text-[9px] uppercase tracking-widest flex items-center gap-2"
                >
                  <Plus size={16} /> Registrar Nueva Sesión
                </button>
              </div>

              {isAddingRecord && (
                <div className="glass-card p-8 rounded-3xl border-[#D4AF37]/30 mb-8 animate-slide-up">
                   <form onSubmit={handleAddRecord} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Nombre del Tratamiento</label>
                        <input 
                          required
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#D4AF37] transition-all"
                          placeholder="Ej: Retoque Master Microblading"
                          value={newRecord.serviceName}
                          onChange={e => setNewRecord({...newRecord, serviceName: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Pigmentos / Agujas</label>
                        <input 
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#D4AF37]"
                          placeholder="Ej: Pigmento #302, Aguja 1R 0.25"
                          value={newRecord.pigmentsUsed}
                          onChange={e => setNewRecord({...newRecord, pigmentsUsed: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Especialista</label>
                        <input 
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#D4AF37]"
                          value={newRecord.professionalName}
                          onChange={e => setNewRecord({...newRecord, professionalName: e.target.value})}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Notas Técnicas Detalladas</label>
                        <textarea 
                          rows={3}
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#D4AF37] resize-none"
                          placeholder="Describe la evolución, profundidad, saturación..."
                          value={newRecord.notes}
                          onChange={e => setNewRecord({...newRecord, notes: e.target.value})}
                        />
                      </div>
                      <div className="md:col-span-2 flex justify-end gap-4 pt-4 border-t border-white/5">
                        <button type="button" onClick={() => setIsAddingRecord(false)} className="text-[9px] font-black uppercase text-slate-500 hover:text-white transition-colors">Cancelar</button>
                        <button type="submit" className="gold-btn px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Guardar en Ficha</button>
                      </div>
                   </form>
                </div>
              )}

              <div className="space-y-4">
                {client.treatmentHistory.length === 0 ? (
                  <div className="p-20 text-center glass-card rounded-[2.5rem] border-dashed border-white/5 opacity-50">
                    <History size={48} className="mx-auto mb-4 text-slate-700" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Sin historial registrado para este nodo cliente</p>
                  </div>
                ) : (
                  client.treatmentHistory.map(record => (
                    <div key={record.id} className="glass-card p-8 rounded-3xl border-white/5 hover:border-[#D4AF37]/20 transition-all group">
                       <div className="flex justify-between items-start mb-6">
                          <div className="flex gap-4 items-center">
                             <div className="w-12 h-12 bg-[#D4AF37]/10 text-[#D4AF37] rounded-2xl flex items-center justify-center">
                                <Activity size={20} />
                             </div>
                             <div>
                                <h4 className="font-black text-xl text-white tracking-tight">{record.serviceName}</h4>
                                <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                  <Calendar size={12} /> {new Date(record.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                             </div>
                          </div>
                          <span className="text-[9px] font-black px-4 py-2 bg-white/5 rounded-full text-slate-500 uppercase tracking-widest">Master Session</span>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div className="md:col-span-2">
                             <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Notas Técnicas</p>
                             <p className="text-slate-400 text-sm leading-relaxed italic">"{record.notes}"</p>
                          </div>
                          <div className="space-y-4">
                             <div>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Insumos</p>
                                <p className="text-xs text-slate-300 font-medium">{record.pigmentsUsed || 'N/A'}</p>
                             </div>
                             <div>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Especialista</p>
                                <p className="text-xs text-slate-300 font-medium">{record.professionalName}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'CLINICAL' && (
            <div className="animate-entrance space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="glass-card p-10 rounded-[3rem] border-[#D4AF37]/10">
                     <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                        <Activity className="text-[#D4AF37]" size={20} /> Ficha de Biometría
                     </h4>
                     <div className="space-y-6">
                        <div>
                           <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Tipo de Piel (Fitzpatrick)</label>
                           <input 
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#D4AF37]"
                              value={client.skinType || ''}
                              onChange={e => onUpdateClient({...client, skinType: e.target.value})}
                              placeholder="Ej: Tipo III - Mixta"
                           />
                        </div>
                        <div>
                           <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Alergias Conocidas</label>
                           <input 
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-red-500/50"
                              value={client.allergies || ''}
                              onChange={e => onUpdateClient({...client, allergies: e.target.value})}
                              placeholder="Látex, Níquel, Anestesia..."
                           />
                        </div>
                     </div>
                  </div>

                  <div className="glass-card p-10 rounded-[3rem] border-white/5 bg-gradient-to-tr from-black to-[#050505]">
                     <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                        <ShieldAlert className="text-red-500" size={20} /> Condición Médica
                     </h4>
                     <textarea 
                        rows={6}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-slate-400 outline-none focus:border-red-500/50 resize-none font-medium leading-relaxed"
                        value={client.medicalConditions || ''}
                        onChange={e => onUpdateClient({...client, medicalConditions: e.target.value})}
                        placeholder="Diabetes, Hipertensión, Embarazo, Queloides..."
                     />
                  </div>
               </div>
               
               <div className="p-8 bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded-[2.5rem] flex items-center gap-6">
                  <div className="p-4 bg-[#D4AF37]/10 text-[#D4AF37] rounded-2xl"><Info size={24} /></div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-2xl">Esta información es confidencial y solo accesible por personal autorizado de <b>{client.name}</b>. Los datos biométricos ayudan a prevenir reacciones adversas durante procedimientos invasivos.</p>
               </div>
            </div>
          )}

          {activeTab === 'AI' && (
            <div className="animate-entrance space-y-12 max-w-4xl mx-auto">
               <div className="text-center space-y-4 mb-12">
                  <div className="inline-flex p-4 rounded-[2rem] bg-gradient-to-tr from-[#D4AF37] to-[#B8860B] text-black shadow-2xl">
                     <Sparkles size={40} />
                  </div>
                  <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Análisis Neuronal <span className="gold-text-gradient font-light">Estratégico</span></h3>
                  <p className="text-slate-500 font-medium max-w-xl mx-auto">Gemini AI procesará el historial clínico y los datos biométricos para sugerir el protocolo óptimo para la próxima visita.</p>
               </div>

               <div className="relative">
                  <div className="absolute inset-0 bg-[#D4AF37]/5 rounded-[4rem] blur-[80px]" />
                  <div className="glass-card p-12 rounded-[4rem] relative z-10 border-[#D4AF37]/20 text-center">
                    {isAnalyzing ? (
                       <div className="py-20 flex flex-col items-center gap-6">
                          <Loader2 className="animate-spin text-[#D4AF37]" size={48} />
                          <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Sincronizando con base de conocimiento clínica...</p>
                       </div>
                    ) : aiAnalysis ? (
                       <div className="space-y-10 animate-fade-in">
                          <div className="flex justify-center gap-4 text-[#D4AF37]">
                             <TrendingUp size={32} /><Activity size={32} /><ShieldAlert size={32} />
                          </div>
                          <p className="text-3xl font-light text-slate-100 leading-tight italic tracking-tight">"{aiAnalysis}"</p>
                          <div className="pt-10 border-t border-white/5">
                             <button onClick={handleRunAIAnalysis} className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] hover:text-[#D4AF37] transition-all">Recalcular Estrategia</button>
                          </div>
                       </div>
                    ) : (
                       <div className="py-20 flex flex-col items-center gap-10">
                          <p className="text-slate-600 italic text-xl">Listo para procesar el expediente clínico...</p>
                          <button 
                            onClick={handleRunAIAnalysis}
                            className="gold-btn px-16 py-6 rounded-[2.5rem] text-xs font-black uppercase tracking-[0.4em] shadow-2xl active:scale-95"
                          >
                             Iniciar Consultoría IA
                          </button>
                       </div>
                    )}
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-black/40 border-t border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
             <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Sincronizado con Nodo Polanco</span>
          </div>
          <p className="text-[9px] text-slate-700 font-bold uppercase tracking-widest">© 2026 CitaPlanner Infrastructure • Secured by Aurum</p>
        </div>
      </div>
    </div>
  );
};
