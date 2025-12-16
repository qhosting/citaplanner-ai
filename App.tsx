import React from 'react';
import { MemoryRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarDays, Bell, Package, Clock, LogOut, User as UserIcon, Home, BriefcaseMedical, CreditCard, ChevronDown, List, Megaphone, Settings } from 'lucide-react';
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
import { LandingPage } from './pages/LandingPage';
import { POSPage } from './pages/POSPage';
import { MarketingPage } from './pages/MarketingPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Role } from './types';

// Protected Route Component
// Fix: Use React.ReactNode for children to ensure compatibility with JSX nesting and avoid "children missing" errors.
const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: Role[] }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location }, replace: true });
    } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      // Redirect based on role if trying to access unauthorized area
      if (user.role === 'CLIENT') navigate('/client-portal', { replace: true });
      else if (user.role === 'PROFESSIONAL') navigate('/professional-dashboard', { replace: true });
      else navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, user, allowedRoles, location, navigate]);

  // If not authenticated or authorized, return null while redirect happens
  if (!isAuthenticated) return null;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
};

// Navbar Component with Role Logic
const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  // Ocultar navbar en Login y Landing Page si no está logueado
  if (location.pathname === '/login') return null;
  if (location.pathname === '/' && !user) {
    // Podríamos retornar un navbar público simplificado aquí si quisiéramos
    return (
      <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
           <div className="flex h-16 items-center justify-between">
             <Link to="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600 tracking-tight">
                <CalendarDays className="h-6 w-6" />
                <span>CitaPlanner</span>
             </Link>
             <div className="flex items-center gap-4">
               <Link to="/book" className="text-sm font-medium text-slate-600 hover:text-indigo-600">Reservar</Link>
               <Link to="/login" className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
                 Iniciar Sesión
               </Link>
             </div>
           </div>
        </div>
      </nav>
    );
  }

  // Public booking page has its own header, but if logged in user navigates there...
  if (location.pathname === '/book' && !user) return null;

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50';
  };

  const isCatalogActive = () => {
    return ['/schedules', '/services', '/inventory'].includes(location.pathname);
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to={user?.role === 'CLIENT' ? '/client-portal' : user?.role === 'PROFESSIONAL' ? '/professional-dashboard' : '/admin'} className="flex items-center gap-2 font-bold text-xl text-indigo-600 tracking-tight">
              <CalendarDays className="h-6 w-6" />
              <span>CitaPlanner</span>
            </Link>
            
            {user && (
              <div className="hidden md:flex items-center gap-1">
                {/* ADMIN LINKS */}
                {user.role === 'ADMIN' && (
                  <>
                    <Link to="/admin" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/admin')}`}>
                      <div className="flex items-center gap-2">
                        <LayoutDashboard size={16} /> Panel
                      </div>
                    </Link>
                    <Link to="/pos" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/pos')}`}>
                      <div className="flex items-center gap-2 text-indigo-600 font-bold bg-indigo-50 border border-indigo-100">
                        <CreditCard size={16} /> POS
                      </div>
                    </Link>
                    
                    {/* MENÚ CATÁLOGO (DROPDOWN) */}
                    <div className="relative group">
                      <button className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isCatalogActive() ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                        <List size={16} /> Catálogo <ChevronDown size={14} />
                      </button>
                      
                      <div className="absolute left-0 mt-0 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 hidden group-hover:block animate-fade-in-up z-50">
                        <Link to="/schedules" className="block px-4 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600">
                          <div className="flex items-center gap-2">
                            <Clock size={16} /> Profesionales
                          </div>
                        </Link>
                        <Link to="/services" className="block px-4 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600">
                          <div className="flex items-center gap-2">
                            <BriefcaseMedical size={16} /> Servicios
                          </div>
                        </Link>
                        <Link to="/inventory" className="block px-4 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600">
                          <div className="flex items-center gap-2">
                            <Package size={16} /> Inventario
                          </div>
                        </Link>
                      </div>
                    </div>

                    <Link to="/clients" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/clients')}`}>
                      <div className="flex items-center gap-2">
                        <Users size={16} /> Clientes
                      </div>
                    </Link>

                    {/* MARKETING LINK */}
                    <Link to="/marketing" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/marketing')}`}>
                      <div className="flex items-center gap-2">
                        <Megaphone size={16} /> Marketing
                      </div>
                    </Link>
                  </>
                )}

                {/* PROFESSIONAL LINKS */}
                {user.role === 'PROFESSIONAL' && (
                  <Link to="/professional-dashboard" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/professional-dashboard')}`}>
                     <div className="flex items-center gap-2">
                      <LayoutDashboard size={16} /> Mi Agenda
                    </div>
                  </Link>
                )}

                {/* CLIENT LINKS */}
                {user.role === 'CLIENT' && (
                  <>
                    <Link to="/client-portal" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/client-portal')}`}>
                       <div className="flex items-center gap-2">
                        <LayoutDashboard size={16} /> Mis Citas
                      </div>
                    </Link>
                    <Link to="/book" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/book')}`}>
                       <div className="flex items-center gap-2">
                        <CalendarDays size={16} /> Reservar
                      </div>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                  <span className="text-sm font-medium text-slate-700 hidden sm:block">{user.name}</span>
                  {user.role === 'ADMIN' && (
                    <Link to="/settings" title="Configuración" className={`p-1.5 rounded-full transition-colors ${isActive('/settings')}`}>
                      <Settings size={20} />
                    </Link>
                  )}
                  <Link to="/profile" title="Mi Perfil" className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold hover:bg-indigo-200 transition-colors">
                    {user.avatar || user.name.charAt(0)}
                  </Link>
                  <button 
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Cerrar Sesión"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </>
            ) : (
              <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/book" element={<BookingPage />} /> 

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/pos" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <POSPage />
        </ProtectedRoute>
      } />
      <Route path="/clients" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <ClientsPage />
        </ProtectedRoute>
      } />
      <Route path="/marketing" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <MarketingPage />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <SettingsPage />
        </ProtectedRoute>
      } />
      
      {/* Catalog Routes */}
      <Route path="/services" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <ServicesPage />
        </ProtectedRoute>
      } />
      <Route path="/inventory" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <InventoryPage />
        </ProtectedRoute>
      } />
      <Route path="/schedules" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <SchedulesPage />
        </ProtectedRoute>
      } />

      {/* Professional Routes */}
      <Route path="/professional-dashboard" element={
        <ProtectedRoute allowedRoles={['PROFESSIONAL', 'ADMIN']}>
          <ProfessionalDashboard />
        </ProtectedRoute>
      } />

      {/* Client Routes */}
      <Route path="/client-portal" element={
        <ProtectedRoute allowedRoles={['CLIENT', 'ADMIN']}>
          <ClientPortal />
        </ProtectedRoute>
      } />

      {/* Shared Protected Routes */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MemoryRouter>
        <div className="min-h-screen bg-slate-50 pb-12">
          <Navbar />
          <AppRoutes />
        </div>
      </MemoryRouter>
    </AuthProvider>
  );
};

export default App;