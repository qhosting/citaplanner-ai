import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, Lock, Phone, ArrowRight, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(phone, password);
      if (success) {
        const userStr = localStorage.getItem('citaPlannerUser');
        if(userStr) {
            const u = JSON.parse(userStr);
            if(u.role === 'ADMIN') navigate('/admin');
            else if(u.role === 'PROFESSIONAL') navigate('/professional-dashboard');
            else if(u.role === 'CLIENT') navigate('/client-portal');
            else navigate('/');
        }
      } else {
        setError('Credenciales inválidas. Intente de nuevo.');
      }
    } catch (err) {
      setError('Ocurrió un error al intentar iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col md:flex-row">
        
        <div className="w-full p-8 md:p-10">
          <div className="flex items-center gap-2 font-bold text-2xl text-indigo-600 mb-8 justify-center">
            <CalendarDays className="h-8 w-8" />
            <span>CitaPlanner</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">Bienvenido</h2>
          <p className="text-slate-500 text-center mb-8">Ingresa a tu cuenta para gestionar tus citas.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono o Usuario</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  placeholder="Tu número de celular"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Iniciar Sesión <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400">
              ¿No tienes cuenta? <Link to="/book" className="text-indigo-600 font-medium hover:underline">Reserva una cita pública</Link>
            </p>
            <div className="mt-4 text-xs text-slate-300 border-t pt-4">
                <p>Credenciales Demo:</p>
                <p>Admin: admin / 123</p>
                <p>Prof: 5551001 / 123</p>
                <p>Cliente: 5512345678 / 123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};