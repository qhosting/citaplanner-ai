import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Save, ShieldCheck, Bell, MessageSquare, Smartphone, Mail, Check } from 'lucide-react';
import { api } from '../services/api';
import { NotificationPreferences } from '../types';

export const ProfilePage: React.FC = () => {
  const { user, updatePassword } = useAuth();
  
  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
  const [msg, setMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Notification Preferences State
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    whatsapp: true,
    sms: true,
    email: true
  });
  const [prefLoading, setPrefLoading] = useState(false);
  const [prefMsg, setPrefMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Cargar preferencias iniciales del usuario
  useEffect(() => {
    if (user?.preferences) {
      setPreferences(user.preferences);
    }
  }, [user]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (passData.new !== passData.confirm) {
      setMsg({ type: 'error', text: 'Las contraseñas nuevas no coinciden.' });
      return;
    }

    if (passData.new.length < 3) {
      setMsg({ type: 'error', text: 'La contraseña es muy corta.' });
      return;
    }

    try {
      const success = await updatePassword(passData.current, passData.new);
      if (success) {
        setMsg({ type: 'success', text: 'Contraseña actualizada correctamente.' });
        setPassData({ current: '', new: '', confirm: '' });
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'Error al actualizar.' });
    }
  };

  const handlePreferencesSave = async () => {
    if (!user) return;
    setPrefLoading(true);
    setPrefMsg(null);
    try {
      const success = await api.updatePreferences(user.id, preferences);
      if (success) {
        setPrefMsg({ type: 'success', text: 'Preferencias guardadas.' });
        // Actualizar el objeto usuario localmente sería ideal aquí a través de context,
        // pero para esta demo asumimos que el backend está sync.
      } else {
        setPrefMsg({ type: 'error', text: 'Error guardando preferencias.' });
      }
    } catch (e) {
      setPrefMsg({ type: 'error', text: 'Error de conexión.' });
    } finally {
      setPrefLoading(false);
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-8">Mi Perfil</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Info Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-3xl font-bold text-indigo-600 mx-auto mb-4 border-4 border-white shadow-lg">
              {user.avatar || user.name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
            <p className="text-slate-500 text-sm mb-4">{user.role}</p>
            
            <div className="text-left border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center gap-3 text-slate-600">
                <User size={18} className="text-slate-400" />
                <span className="text-sm">ID: {user.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <ShieldCheck size={18} className="text-slate-400" />
                <span className="text-sm capitalize">{user.role.toLowerCase()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Column */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Notification Preferences */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Bell className="text-indigo-600" size={20} />
                    Preferencias de Notificación
                </h3>
            </div>
            
            <div className="space-y-4">
                <p className="text-sm text-slate-500 mb-4">Elige cómo quieres recibir recordatorios de tus citas y actualizaciones.</p>
                
                {/* WhatsApp Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <MessageSquare size={18} />
                        </div>
                        <div>
                            <p className="font-medium text-slate-800">WhatsApp</p>
                            <p className="text-xs text-slate-500">Recibir confirmaciones y alertas por chat.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => togglePreference('whatsapp')}
                        className={`w-12 h-6 rounded-full transition-colors relative ${preferences.whatsapp ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${preferences.whatsapp ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>

                {/* SMS Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Smartphone size={18} />
                        </div>
                        <div>
                            <p className="font-medium text-slate-800">SMS</p>
                            <p className="text-xs text-slate-500">Mensajes de texto para recordatorios urgentes.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => togglePreference('sms')}
                        className={`w-12 h-6 rounded-full transition-colors relative ${preferences.sms ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${preferences.sms ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>

                {/* Email Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <Mail size={18} />
                        </div>
                        <div>
                            <p className="font-medium text-slate-800">Email</p>
                            <p className="text-xs text-slate-500">Resúmenes de citas y promociones.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => togglePreference('email')}
                        className={`w-12 h-6 rounded-full transition-colors relative ${preferences.email ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${preferences.email ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                 <div className="text-sm">
                    {prefMsg && (
                        <span className={`${prefMsg.type === 'success' ? 'text-green-600' : 'text-red-600'} flex items-center gap-1`}>
                            {prefMsg.type === 'success' && <Check size={14} />} {prefMsg.text}
                        </span>
                    )}
                 </div>
                 <button 
                    onClick={handlePreferencesSave}
                    disabled={prefLoading}
                    className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-50"
                 >
                    {prefLoading ? 'Guardando...' : 'Guardar Preferencias'}
                 </button>
            </div>
          </div>

          {/* Password Form */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Lock className="text-indigo-600" size={20} />
              Cambiar Contraseña
            </h3>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña Actual</label>
                <input
                  type="password"
                  required
                  value={passData.current}
                  onChange={e => setPassData({...passData, current: e.target.value})}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nueva Contraseña</label>
                  <input
                    type="password"
                    required
                    value={passData.new}
                    onChange={e => setPassData({...passData, new: e.target.value})}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Nueva</label>
                  <input
                    type="password"
                    required
                    value={passData.confirm}
                    onChange={e => setPassData({...passData, confirm: e.target.value})}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {msg && (
                <div className={`p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {msg.text}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button type="submit" className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 flex items-center gap-2">
                  <Save size={18} /> Actualizar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};