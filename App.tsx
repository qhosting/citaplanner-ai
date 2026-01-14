
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { MemoryRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, CalendarDays, Package, Clock, LogOut, 
  Sparkles, ShoppingBag, Megaphone, Settings, 
  ChevronDown, BriefcaseMedical, Scissors, MapPin, Feather, Globe, BarChart3, Loader2,
  ShieldCheck, Activity, Cpu, Cloud, ShieldAlert, ArrowLeft
} from 'lucide-react';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Role } from './types';
import { api } from './services/api';
import { MaintenanceScreen } from './components/MaintenanceScreen';

// --- OPTIMIZACIÓN: Lazy Loading de Páginas ---
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const ClientsPage = lazy(() => import('./pages/ClientsPage').then(m => ({ default: m.ClientsPage })));
const InventoryPage = lazy(() => import('./pages/InventoryPage').then(m => ({ default: m.InventoryPage })));
const SchedulesPage = lazy(() => import('./pages/SchedulesPage').then(m => ({ default: m.SchedulesPage })));
const ServicesPage = lazy(() => import('./pages/ServicesPage').then(m => ({ default: m.ServicesPage })));
const BookingPage = lazy(() => import('./pages/BookingPage').then(m => ({ default: m.BookingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const ProfessionalDashboard = lazy(() => import('./pages/ProfessionalDashboard').then(m => ({ default: m.ProfessionalDashboard })));
const ClientPortal = lazy(() => import('./pages/ClientPortal').then(m => ({ default: m.ClientPortal })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const POSPage = lazy(() => import('./pages/POSPage').then(m => ({ default: m.POSPage })));
const MarketingPage = lazy(() => import('./pages/MarketingPage').then(m => ({ default: m.MarketingPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const BranchesPage = lazy(() => import('./pages/BranchesPage').then(m => ({ default: m.BranchesPage })));
const InsightsPage = lazy(() => import('./pages/InsightsPage').then(m => ({ default: m.InsightsPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })));

// --- OPTIMIZACIÓN: Caché de consultas ---
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutos de caché "fresca"
      gcTime: 1000 * 60 * 10,  // 10 minutos antes de eliminar de memoria
      retry: 1,
      refetchOnWindowFocus: false,
    }
  }
});

const LoadingScreen = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-[#050505]">
    <Loader2 className="animate-spin text-[#D4AF37] mb-4" size={40} />
    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sincronizando Nodo...</p>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: Role[] }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location }, replace: true });
    } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      if (user.role === 'GOD_MODE') navigate('/nexus', { replace: true });
      else if (user.role === 'STUDIO_OWNER') navigate('/admin', { replace: true });
      else if (user.role === 'STAFF') navigate('/professional-dashboard', { replace: true });
      else if (user.role === 'MEMBER') navigate('/client-portal', { replace: true });
      else navigate('/', { replace: true });
    }
  }, [isAuthenticated, user, allowedRoles, location, navigate]);

  if (!isAuthenticated) return null;
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
};

const Navbar = ({ maintenanceMode }: { maintenanceMode: boolean }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  if (location.pathname === '/' || location.pathname === '/book' || location.pathname === '/login') return null;
  if (maintenanceMode && !user) return null; 

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
          <Link to={user?.role === 'GOD_MODE' ? '/nexus' : user?.role === 'MEMBER' ? '/client-portal' : user?.role === 'STAFF' ? '/professional-dashboard' : '/admin'}>
            <div className="flex items-center gap-3 group">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-[#222] to-black border border-[#D4AF37]/30 group-hover:border-[#D4AF37]/60 transition-all shadow-lg">
                <Sparkles className="text-[#D4AF37] group-hover:scale-110 transition-transform" size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tighter text-white uppercase leading-none">Cita<span className="gold-text-gradient">Planner</span></span>
                <span className="text-[7px] font-bold text-[#D4AF37] uppercase tracking-[0.4em] mt-0.5 opacity-80">{user?.role === 'GOD_MODE' ? 'Nexus Infrastructure' : 'Aurum Ecosystem'}</span>
              </div>
            </div>
          </Link>
          
          {user && (user.role === 'STUDIO_OWNER' || user.role === 'GOD_MODE') && (
            <div className="hidden xl:flex items-center gap-1">
              {user.role === 'GOD_MODE' && <NavLink to="/nexus"><ShieldAlert size={14} className="text-red-500" /> Nexus God Mode</NavLink>}
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
          {user?.isImpersonated && (
             <button onClick={() => {
               const original = localStorage.getItem('citaPlannerOriginalAuth');
               if (original) {
                 localStorage.setItem('citaPlannerUser', original);
                 localStorage.removeItem('citaPlannerOriginalAuth');
                 window.location.href = '/nexus';
               }
             }} className="flex items-center gap-2 text-rose-500 bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all">
                <ArrowLeft size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Salir de Soporte</span>
             </button>
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
            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">Nexus SaaS v5.0</span>
          </div>
          <div className="flex items-center gap-3">
            <Cloud size={16} className="text-zinc-700" />
            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">Multi-Instance Active</span>
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
  }, [location.pathname]);

  if (appLoading) return <LoadingScreen />;

  const isStaff = user && ['STUDIO_OWNER', 'GOD_MODE', 'STAFF'].includes(user.role);
  const isLoginPage = location.pathname === '/login';
  
  if (maintenanceMode && !isStaff && !isLoginPage) {
    return <MaintenanceScreen contactPhone={settings?.contactPhone} brandName={settings?.businessName} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      <Toaster richColors position="top-right" theme="dark" />
      <Navbar maintenanceMode={maintenanceMode} />
      <div className="flex-grow">
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/book" element={<BookingPage />} /> 
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['STUDIO_OWNER', 'GOD_MODE']}><Dashboard /></ProtectedRoute>} />
            <Route path="/nexus" element={<ProtectedRoute allowedRoles={['GOD_MODE']}><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/pos" element={<ProtectedRoute allowedRoles={['STUDIO_OWNER', 'GOD_MODE']}><POSPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute allowedRoles={['STUDIO_OWNER', 'GOD_MODE']}><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute allowedRoles={['STUDIO_OWNER', 'GOD_MODE']}><ClientsPage /></ProtectedRoute>} />
            <Route path="/marketing" element={<ProtectedRoute allowedRoles={['STUDIO_OWNER', 'GOD_MODE']}><MarketingPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute allowedRoles={['STUDIO_OWNER', 'GOD_MODE']}><SettingsPage /></ProtectedRoute>} />
            <Route path="/branches" element={<ProtectedRoute allowedRoles={['STUDIO_OWNER', 'GOD_MODE']}><BranchesPage /></ProtectedRoute>} />
            <Route path="/services" element={<ProtectedRoute allowedRoles={['STUDIO_OWNER', 'GOD_MODE']}><ServicesPage /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute allowedRoles={['STUDIO_OWNER', 'GOD_MODE']}><InventoryPage /></ProtectedRoute>} />
            <Route path="/schedules" element={<ProtectedRoute allowedRoles={['STUDIO_OWNER', 'GOD_MODE']}><SchedulesPage /></ProtectedRoute>} />
            <Route path="/insights" element={<ProtectedRoute allowedRoles={['STUDIO_OWNER', 'GOD_MODE']}><InsightsPage /></ProtectedRoute>} />
            <Route path="/professional-dashboard" element={<ProtectedRoute allowedRoles={['STAFF', 'STUDIO_OWNER', 'GOD_MODE']}><ProfessionalDashboard /></ProtectedRoute>} />
            <Route path="/client-portal" element={<ProtectedRoute allowedRoles={['MEMBER', 'STUDIO_OWNER', 'GOD_MODE']}><ClientPortal /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          </Routes>
        </Suspense>
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
