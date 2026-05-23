
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, ArrowRight, Loader2, Sparkles, ShieldCheck, Mail, ShieldAlert } from 'lucide-react';
import { Role } from '../types';
import { api } from '../services/api';

export const LoginPage: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState(() => {
    try {
      const saved = localStorage.getItem('citaPlannerLandingSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.businessName || 'Shula Studio';
      }
    } catch {}
    return 'Shula Studio';
  });
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isMaintenance = false;

  useEffect(() => {
    console.log('[LOGIN PAGE] Auth State Change:', { isAuthenticated, user });
    if (isAuthenticated && user) {
      console.log('[LOGIN PAGE] Redirecting based on role:', user.role);
      if (user.role === 'ADMIN' || user.role === 'STUDIO_OWNER') navigate('/admin');
      else if (user.role === 'PROFESSIONAL' || user.role === 'STAFF') navigate('/professional-dashboard');
      else if (user.role === 'CLIENT' || user.role === 'MEMBER') navigate('/client-portal');
      else if (user.role === 'GOD_MODE') navigate('/nexus');
      else {
        console.warn('[LOGIN PAGE] Unknown role, defaulting to home');
        navigate('/');
      }
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.getLandingSettings();
        if (response.success && response.value) {
          const name = response.value.businessName || 'Shula Studio';
          setBusinessName(name);
          // Sync settings to localStorage so they are immediately available next time
          localStorage.setItem('citaPlannerLandingSettings', JSON.stringify(response.value));
        }
      } catch (e) {
        console.error('Failed to load settings in login');
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(phone, password);
      if (!success) {
        setError('Acceso denegado. Credenciales no autorizadas.');
      }
    } catch (err) {
      setError('Falla crítica en la infraestructura.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-main">
      {/* Background Nodes */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute satellite-node"
            style={{
              top: `${Math.random() * 80 + 10}%`,
              left: `${Math.random() * 80 + 10}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${8 + Math.random() * 5}s`
            }}
          >
            <div className="w-1 h-1 bg-[#CE4676] rounded-full shadow-[0_0_10px_rgba(206,70,118,0.6)]" />
          </div>
        ))}
      </div>

      <div className="w-full max-w-md z-10 animate-entrance">
        <div className="glass-card p-8 md:p-10 rounded-[2.5rem] relative border-theme shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-card-theme">

          {isMaintenance && (
            <div className="mb-8 p-3 bg-[#CE4676]/5 border border-[#CE4676]/20 rounded-xl flex items-center gap-3">
              <ShieldAlert className="text-[#CE4676] shrink-0" size={18} />
              <p className="text-[9px] font-black text-[#CE4676] uppercase tracking-widest leading-tight">Mantenimiento Activo. <br />Solo personal autorizado.</p>
            </div>
          )}

          <div className="flex flex-col items-center mb-10">
            <div className="mb-4">
              <div className="w-16 h-16 rounded-[1.5rem] border border-[#CE4676]/30 flex items-center justify-center bg-input-theme shadow-xl relative group overflow-hidden">
                <Sparkles className="text-[#CE4676] group-hover:scale-110 transition-transform duration-500" size={28} />
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-main uppercase flex items-center gap-2">
              {businessName}
            </h1>
            <p className="text-[8px] font-bold text-muted uppercase tracking-[0.6em] mt-1.5 opacity-60">Elite Business Login</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-muted uppercase tracking-widest ml-1">Identidad</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-[#CE4676] transition-colors">
                  <Mail size={16} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="ID de Acceso"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-input-theme border border-theme rounded-xl outline-none focus:ring-1 focus:ring-[#CE4676]/30 transition-all font-bold text-main text-sm placeholder-muted"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-muted uppercase tracking-widest ml-1">Bóveda</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-[#CE4676] transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-input-theme border border-theme rounded-xl outline-none focus:ring-1 focus:ring-[#CE4676]/30 transition-all font-bold text-main text-sm placeholder-muted"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-500/5 p-3 rounded-lg border border-red-500/20 text-center">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bugambilia-btn py-5 rounded-xl font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 disabled:opacity-50 shadow-2xl active:scale-95 text-white"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <>Entrar <ArrowRight size={16} /></>}
              </button>
            </div>
          </form>

          <div className="mt-10 pt-6 border-t border-theme flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-input-theme rounded-full border border-theme">
              <ShieldCheck className="text-[#CE4676]" size={12} />
              <span className="text-[8px] font-black text-muted uppercase tracking-widest">Aurum Core Secured</span>
            </div>
            <p className="text-[8px] text-muted font-bold uppercase tracking-widest">© 2026 {businessName} Infrastructure</p>
          </div>
        </div>
      </div>
    </div>
  );
};
