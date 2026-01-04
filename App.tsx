
import React, { useState } from 'react';
import { MemoryRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, CalendarDays, Package, Clock, LogOut, 
  Sparkles, ShoppingBag, Megaphone, Settings, 
  ChevronDown, BriefcaseMedical, Scissors, MapPin, Feather, Globe, BarChart3
} from 'lucide-react';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from './pages/Dashboard';
import { ClientsPage } from './pages/ClientsPage';
import { InventoryPage } from './pages/InventoryPage';
import { SchedulesPage } from './pages/SchedulesPage';
import { ServicesPage } from './pages/ServicesPage';
import { BookingPage } from './pages/BookingPage';
import { LoginPage } from './pages/LoginPage';
import { ProfessionalDashboard } from './pages/ProfessionalDashboard';
import { ClientPortal } from './pages/ClientPortal';
import { ProfilePage } from './pages/ProfilePage';
import { LandingPage, LogoCitaplanner } from './pages/LandingPage';
import { POSPage } from './pages/POSPage';
import { MarketingPage } from './pages/MarketingPage';
import { SettingsPage } from './pages/SettingsPage';
import { BranchesPage } from './pages/BranchesPage';
import { InsightsPage } from './pages/InsightsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Role } from './types';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: Role[] }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location }, replace: true });
    } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      if (user.role === 'CLIENT') navigate('/client-portal', { replace: true });
      else if (user.role === 'PROFESSIONAL') navigate('/professional-dashboard', { replace: true });
      else navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, user, allowedRoles, location, navigate]);

  if (!isAuthenticated) return null;
  return <>{children}</>;
};

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  if (location.pathname === '/login') return null;
  if (location.pathname === '/' && !user) return null;

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-[#D4AF37]' : 'text-slate-400 hover:text-white';
  };

  const NavLink = ({ to, children }: { to: string, children?: React.ReactNode }) => (
    <Link to={to} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${isActive(to)}`}>
      {children}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 w-full bg-black/40 backdrop-blur-3xl border-b border-white/5 h-20">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link to={user?.role === 'CLIENT' ? '/client-portal' : user?.role === 'PROFESSIONAL' ? '/professional-dashboard' : '/admin'}>
            <div className="flex items-center gap-3 group">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-[#111] to-black border border-[#D4AF37]/20 group-hover:border-[#D4AF37]/50 transition-all">
                <Sparkles className="text-[#D4AF37]" size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tighter text-white uppercase leading-none">Cita<span className="gold-text-gradient">Planner</span></span>
                <span className="text-[7px] font-bold text-slate-600 uppercase tracking-[0.4em]">Aurum Ecosystem</span>
              </div>
            </div>
          </Link>
          
          {user && user.role === 'ADMIN' && (
            <div className="hidden lg:flex items-center gap-1">
              <NavLink to="/admin">Consola</NavLink>
              <NavLink to="/pos">VENTAS & POS</NavLink>
              <NavLink to="/analytics">REPORTES</NavLink>
              <NavLink to="/clients">Directorio</NavLink>
              <div className="relative group/catalog">
                <button className="px-4 py-2 text-slate-400 hover:text-white text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  Módulos <ChevronDown size={10} className="group-hover/catalog:rotate-180 transition-transform" />
                </button>
                <div className="absolute top-full left-0 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover/catalog:opacity-100 group-hover/catalog:translate-y-0 group-hover/catalog:pointer-events-auto transition-all duration-500">
                  <div className="glass-card w-64 rounded-3xl p-3 border border-white/10 shadow-2xl">
                    <Link to="/insights" className="flex items-center gap-3 px-4 py-3 text-[9px] font-black uppercase text-[#D4AF37] hover:bg-white/5 rounded-2xl transition-all"><BarChart3 size={14}/> Estrategia AI</Link>
                    <div className="h-px bg-white/5 my-2 mx-4" />
                    <Link to="/branches" className="flex items-center gap-3 px-4 py-3 text-[9px] font-black uppercase text-slate-400 hover:text-[#D4AF37] hover:bg-white/5 rounded-2xl transition-all"><MapPin size={14}/> Sedes</Link>
                    <Link to="/schedules" className="flex items-center gap-3 px-4 py-3 text-[9px] font-black uppercase text-slate-400 hover:text-[#D4AF37] hover:bg-white/5 rounded-2xl transition-all"><Clock size={14}/> Personal</Link>
                    <Link to="/services" className="flex items-center gap-3 px-4 py-3 text-[9px] font-black uppercase text-slate-400 hover:text-[#D4AF37] hover:bg-white/5 rounded-2xl transition-all"><Scissors size={14}/> Servicios</Link>
                    <Link to="/inventory" className="flex items-center gap-3 px-4 py-3 text-[9px] font-black uppercase text-slate-400 hover:text-[#D4AF37] hover:bg-white/5 rounded-2xl transition-all"><Package size={14}/> Inventario</Link>
                    <div className="h-px bg-white/5 my-2 mx-4" />
                    <Link to="/settings" className="flex items-center gap-3 px-4 py-3 text-[9px] font-black uppercase text-white bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 rounded-2xl transition-all"><Settings size={14}/> Configuración Master</Link>
                  </div>
                </div>
              </div>
              <NavLink to="/marketing">Growth</NavLink>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-[10px] font-black text-white uppercase tracking-tighter">{user.name}</p>
                <p className="text-[7px] font-bold text-[#D4AF37] uppercase tracking-[0.2em]">{user.role}</p>
              </div>
              <Link to="/profile" className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#222] to-[#111] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-black text-xs hover:scale-105 transition-transform overflow-hidden shadow-lg">
                {user.avatar || user.name.charAt(0)}
              </Link>
              <button onClick={logout} className="p-2 text-slate-600 hover:text-[#D4AF37] transition-colors">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37] hover:opacity-70">Iniciar Sesión</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

const InternalFooter = () => {
  const location = useLocation();
  if (location.pathname === '/' || location.pathname === '/login') return null;

  return (
    <footer className="w-full bg-black border-t border-white/5 py-10 px-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[8px] font-black uppercase tracking-[0.3em] text-slate-700">
        <p>© 2026 CitaPlanner Global Infrastructure</p>
        <p className="flex items-center gap-8">
          <span>Powered by <a href="https://aurumcapital.mx" target="_blank" className="text-slate-500 hover:text-[#D4AF37] transition-colors">Aurum Capital</a></span>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <span>Infrastructure by <a href="https://qhosting.com.mx" target="_blank" className="text-slate-500 hover:text-white transition-colors">QHosting</a></span>
        </p>
      </div>
    </footer>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="min-h-screen flex flex-col">
            <Toaster richColors position="top-right" theme="dark" />
            <Navbar />
            <div className="flex-grow">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/book" element={<BookingPage />} /> 
                <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><Dashboard /></ProtectedRoute>} />
                <Route path="/pos" element={<ProtectedRoute allowedRoles={['ADMIN']}><POSPage /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute allowedRoles={['ADMIN']}><AnalyticsPage /></ProtectedRoute>} />
                <Route path="/clients" element={<ProtectedRoute allowedRoles={['ADMIN']}><ClientsPage /></ProtectedRoute>} />
                <Route path="/marketing" element={<ProtectedRoute allowedRoles={['ADMIN']}><MarketingPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute allowedRoles={['ADMIN']}><SettingsPage /></ProtectedRoute>} />
                <Route path="/branches" element={<ProtectedRoute allowedRoles={['ADMIN']}><BranchesPage /></ProtectedRoute>} />
                <Route path="/services" element={<ProtectedRoute allowedRoles={['ADMIN']}><ServicesPage /></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute allowedRoles={['ADMIN']}><InventoryPage /></ProtectedRoute>} />
                <Route path="/schedules" element={<ProtectedRoute allowedRoles={['ADMIN']}><SchedulesPage /></ProtectedRoute>} />
                <Route path="/insights" element={<ProtectedRoute allowedRoles={['ADMIN']}><InsightsPage /></ProtectedRoute>} />
                <Route path="/professional-dashboard" element={<ProtectedRoute allowedRoles={['PROFESSIONAL', 'ADMIN']}><ProfessionalDashboard /></ProtectedRoute>} />
                <Route path="/client-portal" element={<ProtectedRoute allowedRoles={['CLIENT', 'ADMIN']}><ClientPortal /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              </Routes>
            </div>
            <InternalFooter />
          </div>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
