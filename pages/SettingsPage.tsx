import React, { useState, useEffect } from 'react';
import { Settings, Save, Globe, Zap, MessageSquare, Database, Building2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'INTEGRATION' | 'BUSINESS'>('GENERAL');
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const data = await api.getSettings();
    setSettings(data);
    setLoading(false);
  };

  const handleInputChange = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    // Filtrar solo lo que cambió idealmente, pero enviamos todo por simplicidad en este batch
    const payload = settings.map(s => ({ key: s.key, value: s.value }));
    const success = await api.updateSettings(payload);
    setSaving(false);
    if (success) {
      alert("Configuración guardada correctamente.");
    } else {
      alert("Error al guardar la configuración.");
    }
  };

  const toggleTokenVisibility = (key: string) => {
    setShowTokens(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper para renderizar campos
  const renderField = (item: any) => {
    const isSecret = item.key.includes('token') || item.key.includes('secret') || item.key.includes('password');
    const isVisible = showTokens[item.key];

    return (
      <div key={item.key} className="mb-5">
        <label className="block text-sm font-medium text-slate-700 mb-1">{item.description || item.key}</label>
        <div className="relative">
          <input
            type={isSecret && !isVisible ? "password" : "text"}
            value={item.value}
            onChange={(e) => handleInputChange(item.key, e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          {isSecret && (
            <button
              type="button"
              onClick={() => toggleTokenVisibility(item.key)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1 font-mono">{item.key}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const generalSettings = settings.filter(s => s.category === 'GENERAL');
  const integrationSettings = settings.filter(s => s.category === 'INTEGRATION');
  // Si hubiera más categorías se filtran aquí

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="text-indigo-600" />
            Configuración del Sistema
          </h1>
          <p className="text-slate-500 mt-1">Personaliza integraciones, datos del negocio y parámetros globales.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 flex items-center gap-2 disabled:opacity-70 shadow-lg shadow-slate-200"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Guardar Cambios
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col md:flex-row">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-2 md:p-4">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('GENERAL')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${
                activeTab === 'GENERAL' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building2 size={18} /> General
            </button>
            <button
              onClick={() => setActiveTab('INTEGRATION')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${
                activeTab === 'INTEGRATION' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Zap size={18} /> Integraciones
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          
          {activeTab === 'GENERAL' && (
            <div className="animate-fade-in-up">
              <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Información del Negocio</h2>
              <div className="space-y-6">
                {generalSettings.length > 0 ? (
                  generalSettings.map(renderField)
                ) : (
                  <p className="text-slate-500 italic">No hay configuraciones generales disponibles.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'INTEGRATION' && (
            <div className="animate-fade-in-up">
              <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">APIs y Webhooks</h2>
              
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex gap-3 items-start">
                <Globe className="text-blue-600 mt-0.5 flex-shrink-0" size={18} />
                <div className="text-sm text-blue-800">
                  <p className="font-bold">Nota Importante</p>
                  <p>Asegúrate de que los Webhooks apuntan a servidores seguros (HTTPS). Los cambios en tokens de API tienen efecto inmediato en las nuevas solicitudes.</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Agrupar visualmente si es posible, por ahora lista plana */}
                
                {/* N8N Section */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Zap size={16} className="text-orange-500" /> Automatización (N8N)
                  </h3>
                  <div className="space-y-4 pl-4 border-l-2 border-slate-100">
                    {integrationSettings.filter(s => s.key.startsWith('n8n')).map(renderField)}
                  </div>
                </div>

                {/* Chatwoot Section */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <MessageSquare size={16} className="text-blue-500" /> CRM (Chatwoot)
                  </h3>
                  <div className="space-y-4 pl-4 border-l-2 border-slate-100">
                    {integrationSettings.filter(s => s.key.startsWith('chatwoot')).map(renderField)}
                  </div>
                </div>

                {/* Odoo Section */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Database size={16} className="text-purple-500" /> ERP (Odoo)
                  </h3>
                  <div className="space-y-4 pl-4 border-l-2 border-slate-100">
                    {integrationSettings.filter(s => s.key.startsWith('odoo')).map(renderField)}
                  </div>
                </div>

                {/* Others */}
                {integrationSettings.filter(s => !s.key.startsWith('n8n') && !s.key.startsWith('chatwoot') && !s.key.startsWith('odoo')).length > 0 && (
                   <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Otros</h3>
                      {integrationSettings.filter(s => !s.key.startsWith('n8n') && !s.key.startsWith('chatwoot') && !s.key.startsWith('odoo')).map(renderField)}
                   </div>
                )}

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};