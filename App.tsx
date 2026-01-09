
import React, { useState, useEffect } from 'react';
import { MemoryRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, CalendarDays, Package, Clock, LogOut, 
  Sparkles, ShoppingBag, Megaphone, Settings, 
  ChevronDown, BriefcaseMedical, Scissors, MapPin, Feather, Globe, BarChart3, Loader2,
  ShieldCheck, Activity, Cpu, Cloud, ShieldAlert
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
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Role } from './types';
import { api } from './services/api';
import { MaintenanceScreen } from './components/MaintenanceScreen';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: Role[] }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
        if (!isAuthenticated) {
          navigate('/login', { state: { from: location }, replace: true });
        } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
          if (user.role === 'SUPERADMIN') navigate('/nexus', { replace: true });
          else if (user.role === 'CLIENT') navigate('/client-portal', { replace: true });
          else if (user.role === 'PROFESSIONAL') navigate('/professional-dashboard', { replace: true });
          else navigate('/admin', { replace: true });
        }
        setIsChecking(false);
    }, 50);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, allowedRoles, location, navigate]);

  if (!isAuthenticated && isChecking) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  return <>{children}</>;
};

const Navbar = ({ maintenanceMode }: { maintenanceMode: boolean }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  if (maintenanceMode && !user) return null; // Ocultar navbar en mantenimiento si no es staff
  if (location.pathname === '/login') return null;
  if (location.pathname === '/' && !user) return null;

  const isActive = (path: string) => location.pathname === path;

  const NavLink = ({ to, children }: { to: string, children?: React.ReactNode }) => (
    <Link to={to} className={`relative px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] transition-all flex items-center gap-2 ${
      isActive(to) ? 'text-[#D4AF37]' : 'text-zinc-300 hover:text-white hover:bg-white/5'
    }`}>
      {children}
      {isActive(to) && <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#D4AF37] rounded-full shadow-[0_0_10px_#D4AF37]" />}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 w-full bg-black/90 backdrop-blur-2xl border-b border-white/10 h-20 shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to={user?.role === 'SUPERADMIN' ? '/nexus' : user?.role === 'CLIENT' ? '/client-portal' : user?.role === 'PROFESSIONAL' ? '/professional-dashboard' : '/admin'}>
            <div className="flex items-center gap-3 group">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-[#222] to-black border border-[#D4AF37]/30 group-hover:border-[#D4AF37]/60 transition-all shadow-lg">
                <Sparkles className="text-[#D4AF37] group-hover:scale-110 transition-transform" size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tighter text-white uppercase leading-none">Cita<span className="gold-text-gradient">Planner</span></span>
                <span className="text-[7px] font-bold text-[#D4AF37] uppercase tracking-[0.4em] mt-0.5 opacity-80">{user?.role === 'SUPERADMIN' ? 'Nexus Infrastructure' : 'Aurum Ecosystem'}</span>
              </div>
            </div>
          </Link>
          
          {user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN') && (
            <div className="hidden xl:flex items-center gap-1">
              {user.role === 'SUPERADMIN' && <NavLink to="/nexus"><ShieldAlert size={14} className="text-red-500" /> Nexus God Mode</NavLink>}
              <NavLink to="/admin">Consola</NavLink>
              <NavLink to="/pos">Ventas & POS</NavLink>
              <NavLink to="/analytics">Reportes</NavLink>
              <NavLink to="/clients">Directorio</NavLink>
              <div className="relative group/catalog">
                <button className="px-4 py-2 text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-2 transition-all">
                  Módulos <ChevronDown size={10} className="group-hover/catalog:rotate-180 transition-transform" />
                </button>
                <div className="absolute top-full left-0 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover/catalog:opacity-100 group-hover/catalog:translate-y-0 group-hover/catalog:pointer-events-auto transition-all duration-300">
                  <div className="glass-card w-64 rounded-[2rem] p-3 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-black/95 backdrop-blur-xl">
                    <Link to="/insights" className="flex items-center gap-3 px-4 py-3.5 text-[9px] font-black uppercase tracking-widest text-[#D4AF37] hover:bg-white/10 rounded-2xl transition-all"><BarChart3 size={14}/> Estrategia AI</Link>
                    <div className="h-px bg-white/5 my-2 mx-4" />
                    <Link to="/branches" className="flex items-center gap-3 px-4 py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-300 hover:text-[#D4AF37] hover:bg-white/10 rounded-2xl transition-all"><MapPin size={14}/> Sedes</Link>
                    <Link to="/schedules" className="flex items-center gap-3 px-4 py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-300 hover:text-[#D4AF37] hover:bg-white/10 rounded-2xl transition-all"><Clock size={14}/> Personal</Link>
                    <Link to="/services" className="flex items-center gap-3 px-4 py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-300 hover:text-[#D4AF37] hover:bg-white/10 rounded-2xl transition-all"><Scissors size={14}/> Servicios</Link>
                    <Link to="/inventory" className="flex items-center gap-3 px-4 py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-300 hover:text-[#D4AF37] hover:bg-white/10 rounded-2xl transition-all"><Package size={14}/> Inventario</Link>
                    <div className="h-px bg-white/5 my-2 mx-4" />
                    <Link to="/settings" className="flex items-center gap-3 px-4 py-3.5 text-[9px] font-black uppercase tracking-widest text-white bg-[#D4AF37]/20 hover:bg-[#D4AF37]/40 rounded-2xl transition-all"><Settings size={14}/> Configuración</Link>
                  </div>
                </div>
              </div>
              <NavLink to="/marketing">Growth</NavLink>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          {maintenanceMode && !user && (
             <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/20">
               <ShieldAlert size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Modo Mantenimiento</span>
             </div>
          )}
          {user ? (
            <div className="flex items-center gap-5">
              <div className="hidden sm:block text-right">
                <p className="text-[10px] font-black text-white uppercase tracking-tighter mb-0.5">{user.name}</p>
                <div className="flex items-center gap-1 justify-end">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[7px] font-bold text-[#D4AF37] uppercase tracking-[0.2em]">{user.role}</p>
                </div>
              </div>
              <Link to="/profile" className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#333] to-[#111] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-black text-xs hover:scale-105 hover:border-[#D4AF37] transition-all overflow-hidden shadow-xl">
                {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : user.name.charAt(0)}
              </Link>
              <button onClick={logout} className="p-2.5 text-zinc-500 hover:text-[#D4AF37] hover:bg-white/5 rounded-xl transition-all">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] hover:opacity-70 border-b border-[#D4AF37]/30 pb-0.5">Iniciar Sesión</Link>
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
    <footer className="w-full bg-[#050505] border-t border-white/5 py-8 px-10">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <Cpu size={16} className="text-zinc-700" />
            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">Core Node v4.6.0</span>
          </div>
          <div className="flex items-center gap-3">
            <Cloud size={16} className="text-zinc-700" />
            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">SaaS Sync Active</span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck size={16} className="text-emerald-900" />
            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-emerald-900">Quantum Secured</span>
          </div>
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-700 text-center">© 2026 CitaPlanner Global Infrastructure • Product of Aurum Capital</p>
        <div className="flex items-center gap-12 text-[8px] font-black uppercase tracking-[0.3em]">
          <a href="https://aurumcapital.mx" target="_blank" className="flex items-center gap-2 text-zinc-600 hover:text-[#D4AF37] transition-all group">
            <span>Powered by</span><span className="text-zinc-400 group-hover:text-white">Aurum Capital</span>
          </a>
          <div className="w-1 h-1 rounded-full bg-white/10" />
          <a href="https://qhosting.com.mx" target="_blank" className="flex items-center gap-2 text-zinc-600 hover:text-white transition-all group">
             <span>Infra</span><span className="text-zinc-400 group-hover:text-white">QHosting</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

const MainLayout = () => {
  const { user } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [appLoading, setAppLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const data = await api.getLandingSettings();
        setSettings(data);
        setMaintenanceMode(!!data.maintenanceMode);
      } catch (e) {
        console.error("Failed to load settings");
      } finally {
        setAppLoading(false);
      }
    };
    checkMaintenance();
  }, [location.pathname]); // Re-check on navigation to ensure sync

  if (appLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#050505]">
        <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
      </div>
    );
  }

  // --- LOGICA DE BLOQUEO POR MANTENIMIENTO ---
  // Si está activo Y el usuario NO es staff (Admin, SuperAdmin, Pro), mostramos bloqueo.
  // Permitimos /login para que el staff pueda entrar.
  const isStaff = user && ['ADMIN', 'SUPERADMIN', 'PROFESSIONAL'].includes(user.role);
  const isLoginPage = location.pathname === '/login';
  
  if (maintenanceMode && !isStaff && !isLoginPage) {
    return <MaintenanceScreen contactPhone={settings?.contactPhone} brandName={settings?.businessName} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      <Toaster richColors position="top-right" theme="dark" />
      <Navbar maintenanceMode={maintenanceMode} />
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/book" element={<BookingPage />} /> 
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}><Dashboard /></ProtectedRoute>} />
          <Route path="/nexus" element={<ProtectedRoute allowedRoles={['SUPERADMIN']}><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/pos" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}><POSPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}><ClientsPage /></ProtectedRoute>} />
          <Route path="/marketing" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}><MarketingPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}><SettingsPage /></ProtectedRoute>} />
          <Route path="/branches" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}><BranchesPage /></ProtectedRoute>} />
          <Route path="/services" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}><ServicesPage /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}><InventoryPage /></ProtectedRoute>} />
          <Route path="/schedules" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}><SchedulesPage /></ProtectedRoute>} />
          <Route path="/insights" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}><InsightsPage /></ProtectedRoute>} />
          <Route path="/professional-dashboard" element={<ProtectedRoute allowedRoles={['PROFESSIONAL', 'ADMIN', 'SUPERADMIN']}><ProfessionalDashboard /></ProtectedRoute>} />
          <Route path="/client-portal" element={<ProtectedRoute allowedRoles={['CLIENT', 'ADMIN', 'SUPERADMIN']}><ClientPortal /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        </Routes>
      </div>
      <InternalFooter />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
           <MainLayout />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
