import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, User, Plus, Filter, X, ChevronDown, LayoutList, ChevronLeft, ChevronRight, MessageSquare, Send, Smartphone, MessageCircle, ExternalLink, RefreshCcw, Gift, Play } from 'lucide-react';
import { SmartScheduler } from '../components/SmartScheduler';
import { AppointmentModal } from '../components/AppointmentModal';
import { Appointment, AppointmentStatus } from '../types';
import { sendWhatsAppConfirmation, sendSMSReminder, syncToChatwoot } from '../services/integrationService';
import { api } from '../services/api';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // UI State for Notification Menu
  const [activeNotifyMenu, setActiveNotifyMenu] = useState<string | null>(null);
  
  // Birthday State
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [checkingBirthdays, setCheckingBirthdays] = useState(false);

  // View State
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  // Filter States
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'ALL'>('ALL');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  // Cargar citas desde API al montar
  useEffect(() => {
    fetchData();
    fetchBirthdays();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const data = await api.getAppointments();
    setAppointments(data);
    setLoading(false);
  };

  const fetchBirthdays = async () => {
      const bdays = await api.getBirthdaysToday();
      setBirthdays(bdays);
  };

  const handleRunBirthdayCheck = async () => {
      if(!window.confirm("¿Deseas ejecutar el proceso automático de felicitaciones ahora? Esto enviará mensajes reales según las preferencias de cada usuario.")) return;
      
      setCheckingBirthdays(true);
      const result = await api.runBirthdayCheck();
      setCheckingBirthdays(false);
      
      if(result.success) {
          alert(result.message);
      } else {
          alert("Error ejecutando proceso");
      }
  };

  const addAppointment = async (apt: Appointment) => {
    // Optimistic update
    const tempId = apt.id;
    setAppointments(prev => [...prev, apt]);

    const createdApt = await api.createAppointment(apt);
    if (createdApt) {
      // Reemplazar la cita temporal con la real de DB (que tiene ID correcto)
      setAppointments(prev => prev.map(a => a.id === tempId ? createdApt : a));
    } else {
      // Revertir si falla
      setAppointments(prev => prev.filter(a => a.id !== tempId));
      alert("Error guardando en base de datos");
    }
  };

  const updateStatus = async (id: string, newStatus: AppointmentStatus) => {
    // Optimistic Update
    setAppointments(prev => prev.map(apt => 
      apt.id === id ? { ...apt, status: newStatus } : apt
    ));

    const success = await api.updateAppointmentStatus(id, newStatus);
    if (!success) {
      alert("Error actualizando estado en servidor");
      fetchData(); // Revertir datos
    }
  };

  // Integration Handlers
  const handleNotify = async (type: 'whatsapp' | 'sms' | 'chatwoot', apt: Appointment) => {
    setActiveNotifyMenu(null);
    try {
      if (type === 'whatsapp') await sendWhatsAppConfirmation(apt);
      if (type === 'sms') await sendSMSReminder(apt);
      if (type === 'chatwoot') await syncToChatwoot(apt);
      
      alert(`Acción enviada correctamente vía ${type.toUpperCase()}`);
    } catch (error) {
      alert("Error al enviar notificación. Verifica que el cliente tenga teléfono.");
    }
  };

  // Filter Logic
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      // 1. Status Filter
      if (filterStatus !== 'ALL' && apt.status !== filterStatus) {
        return false;
      }

      const aptDate = new Date(apt.startDateTime);

      // Only apply Date Range filters in LIST mode
      if (viewMode === 'LIST') {
        // 2. Start Date Filter
        if (filterDateStart) {
          const startDate = new Date(filterDateStart);
          startDate.setHours(0, 0, 0, 0);
          if (aptDate < startDate) return false;
        }

        // 3. End Date Filter
        if (filterDateEnd) {
          const endDate = new Date(filterDateEnd);
          endDate.setHours(23, 59, 59, 999);
          if (aptDate > endDate) return false;
        }
      }

      return true;
    });
  }, [appointments, filterStatus, filterDateStart, filterDateEnd, viewMode]);

  const clearFilters = () => {
    setFilterStatus('ALL');
    setFilterDateStart('');
    setFilterDateEnd('');
  };

  const hasActiveFilters = filterStatus !== 'ALL' || filterDateStart !== '' || filterDateEnd !== '';

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es-ES', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch(status) {
      case AppointmentStatus.SCHEDULED: return 'bg-blue-100 text-blue-700';
      case AppointmentStatus.COMPLETED: return 'bg-green-100 text-green-700';
      case AppointmentStatus.CANCELLED: return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: AppointmentStatus) => {
    switch(status) {
      case AppointmentStatus.SCHEDULED: return 'Programada';
      case AppointmentStatus.COMPLETED: return 'Completada';
      case AppointmentStatus.CANCELLED: return 'Cancelada';
      default: return status;
    }
  };

  // Calendar Helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
    
    return { daysInMonth, firstDayOfMonth };
  };

  const handlePrevMonth = () => {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const { daysInMonth, firstDayOfMonth } = getDaysInMonth(currentCalendarDate);
    const days = [];
    const monthStart = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
    const monthEnd = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0);

    const monthAppointments = filteredAppointments.filter(apt => {
      const aptDate = new Date(apt.startDateTime);
      return aptDate >= monthStart && aptDate <= monthEnd;
    });

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-slate-50 border border-slate-100"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDayDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), day);
      const isToday = new Date().toDateString() === currentDayDate.toDateString();
      
      const dayAppointments = monthAppointments.filter(apt => 
        new Date(apt.startDateTime).getDate() === day
      );

      days.push(
        <div key={day} className={`h-32 border border-slate-100 p-2 overflow-y-auto hover:bg-slate-50 transition-colors ${isToday ? 'bg-indigo-50/30' : 'bg-white'}`}>
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-medium ${isToday ? 'bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-slate-700'}`}>
              {day}
            </span>
          </div>
          <div className="space-y-1">
            {dayAppointments.map(apt => (
              <div 
                key={apt.id} 
                className={`text-[10px] px-1.5 py-1 rounded border-l-2 truncate cursor-pointer hover:opacity-80 ${
                  apt.status === AppointmentStatus.SCHEDULED ? 'bg-blue-50 border-blue-500 text-blue-700' :
                  apt.status === AppointmentStatus.COMPLETED ? 'bg-green-50 border-green-500 text-green-700' :
                  'bg-red-50 border-red-500 text-red-700'
                }`}
                title={`${apt.title} - ${formatTime(apt.startDateTime)}`}
              >
                <span className="font-bold mr-1">{formatTime(apt.startDateTime)}</span>
                {apt.title}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Calendar Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 capitalize">
            {currentCalendarDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-2">
            <button onClick={handlePrevMonth} className="p-1.5 hover:bg-white rounded-md border border-transparent hover:border-slate-200 hover:shadow-sm transition-all text-slate-600">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setCurrentCalendarDate(new Date())} className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-white hover:shadow-sm rounded-md border border-transparent hover:border-slate-200 transition-all">
              Hoy
            </button>
            <button onClick={handleNextMonth} className="p-1.5 hover:bg-white rounded-md border border-transparent hover:border-slate-200 hover:shadow-sm transition-all text-slate-600">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" onClick={() => setActiveNotifyMenu(null)}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Panel CitaPlanner</h1>
          <p className="text-slate-500 mt-1">
            {loading ? 'Sincronizando con base de datos...' : 'Gestiona tu agenda eficientemente con IA'}
          </p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={fetchData} 
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Refrescar datos"
            >
                <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 font-medium"
            >
            <Plus size={18} />
            Nueva Cita
            </button>
        </div>
      </div>

      <SmartScheduler onAddAppointment={addAppointment} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (List or Calendar) */}
        <div className="lg:col-span-2">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon className="text-indigo-600" />
              Citas
            </h2>
            
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 p-1 rounded-lg flex items-center">
                <button 
                  onClick={() => setViewMode('LIST')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'LIST' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <LayoutList size={16} />
                  Lista
                </button>
                <button 
                  onClick={() => setViewMode('CALENDAR')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'CALENDAR' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <CalendarIcon size={16} />
                  Mes
                </button>
              </div>

              {hasActiveFilters && (
                 <button 
                  onClick={clearFilters}
                  className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 sm:hidden"
                 >
                   <X size={14} />
                 </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
              <div className="w-full md:w-auto flex-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Estado</label>
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Todos los estados</option>
                  <option value={AppointmentStatus.SCHEDULED}>Programada</option>
                  <option value={AppointmentStatus.COMPLETED}>Completada</option>
                  <option value={AppointmentStatus.CANCELLED}>Cancelada</option>
                </select>
              </div>
              
              {viewMode === 'LIST' && (
                <>
                  <div className="w-full md:w-auto flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Desde</label>
                    <input 
                      type="date" 
                      value={filterDateStart}
                      onChange={(e) => setFilterDateStart(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="w-full md:w-auto flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Hasta</label>
                    <input 
                      type="date" 
                      value={filterDateEnd}
                      onChange={(e) => setFilterDateEnd(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}

              {hasActiveFilters && (
                <button 
                  onClick={clearFilters}
                  className="hidden sm:flex items-center justify-center p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Limpiar Filtros"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
          
          {/* View Content */}
          {loading ? (
             <div className="flex justify-center items-center py-20">
                 <RefreshCcw className="animate-spin text-indigo-600" size={32} />
             </div>
          ) : viewMode === 'CALENDAR' ? (
            renderCalendar()
          ) : (
            <div className="space-y-4">
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                  <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <Filter className="text-slate-400" size={20} />
                  </div>
                  <p className="text-slate-500">No se encontraron citas.</p>
                  {hasActiveFilters ? (
                    <button onClick={clearFilters} className="text-indigo-600 font-medium mt-2 hover:underline">Limpiar filtros</button>
                  ) : (
                    <button onClick={() => setIsModalOpen(true)} className="text-indigo-600 font-medium mt-2 hover:underline">Crear una ahora</button>
                  )}
                </div>
              ) : (
                filteredAppointments.map((apt) => (
                  <div key={apt.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4 items-start sm:items-center group">
                    {/* Date Badge */}
                    <div className="flex-shrink-0 bg-slate-50 rounded-lg p-3 text-center min-w-[80px] border border-slate-100">
                      <span className="block text-xs font-bold text-indigo-600 uppercase">
                        {new Date(apt.startDateTime).toLocaleString('es-ES', { month: 'short' })}
                      </span>
                      <span className="block text-2xl font-bold text-slate-800">
                        {new Date(apt.startDateTime).getDate()}
                      </span>
                      <span className="block text-xs text-slate-400 capitalize">
                        {new Date(apt.startDateTime).toLocaleString('es-ES', { weekday: 'short' })}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-lg text-slate-800">{apt.title}</h3>
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${getStatusColor(apt.status)}`}>
                          {getStatusLabel(apt.status)}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 mt-2">
                        <div className="flex items-center gap-1.5">
                          <Clock size={16} className="text-slate-400" />
                          <span>{formatTime(apt.startDateTime)} - {formatTime(apt.endDateTime)}</span>
                        </div>
                        {apt.clientName && (
                          <div className="flex items-center gap-1.5">
                            <User size={16} className="text-slate-400" />
                            <span>{apt.clientName}</span>
                          </div>
                        )}
                        {apt.clientPhone && (
                           <div className="flex items-center gap-1.5">
                            <Smartphone size={16} className="text-slate-400" />
                            <span className="text-xs">{apt.clientPhone}</span>
                          </div>
                        )}
                      </div>
                      {apt.description && (
                        <p className="text-sm text-slate-500 mt-2 line-clamp-1">{apt.description}</p>
                      )}
                    </div>

                    {/* Actions Group */}
                    <div className="flex items-center gap-2 sm:self-center">
                      
                      {/* Notification Button */}
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveNotifyMenu(activeNotifyMenu === apt.id ? null : apt.id);
                          }}
                          className={`p-2 rounded-lg transition-colors ${activeNotifyMenu === apt.id ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'}`}
                          title="Enviar Notificación"
                        >
                          <Send size={18} />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {activeNotifyMenu === apt.id && (
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden animate-fade-in-down">
                            <div className="p-2 space-y-1">
                              <button 
                                onClick={() => handleNotify('whatsapp', apt)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors"
                              >
                                <MessageCircle size={16} /> WhatsApp (WAHA)
                              </button>
                              <button 
                                onClick={() => handleNotify('sms', apt)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
                              >
                                <MessageSquare size={16} /> SMS (LabsMobile)
                              </button>
                              <button 
                                onClick={() => handleNotify('chatwoot', apt)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors"
                              >
                                <User size={16} /> Sync Chatwoot
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Status Selector */}
                      <div className="relative">
                        <select
                          value={apt.status}
                          onChange={(e) => updateStatus(apt.id, e.target.value as AppointmentStatus)}
                          className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-800 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors shadow-sm"
                          aria-label="Cambiar estado de la cita"
                        >
                          <option value={AppointmentStatus.SCHEDULED}>Programada</option>
                          <option value={AppointmentStatus.COMPLETED}>Completada</option>
                          <option value={AppointmentStatus.CANCELLED}>Cancelada</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Mini Stats / Info Side */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
            <h3 className="font-semibold text-indigo-100 text-sm uppercase tracking-wide mb-2">Resumen Semanal</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{filteredAppointments.length}</span>
              <span className="text-indigo-200">eventos</span>
            </div>
            <div className="mt-4 pt-4 border-t border-indigo-500/30 flex gap-4 text-sm text-indigo-100">
              <div>
                <span className="block font-bold text-white">
                  {filteredAppointments.filter(a => a.status === AppointmentStatus.SCHEDULED).length}
                </span>
                <span>Programadas</span>
              </div>
              <div>
                <span className="block font-bold text-white">
                  {filteredAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length}
                </span>
                <span>Completadas</span>
              </div>
            </div>
          </div>
          
          {/* Birthdays Widget */}
          <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
             <div className="relative z-10">
                <h3 className="font-semibold text-pink-100 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Gift size={16} /> Cumpleaños de Hoy
                </h3>
                
                {birthdays.length === 0 ? (
                    <p className="text-sm text-pink-50 opacity-80">No hay cumpleaños registrados para hoy.</p>
                ) : (
                    <ul className="space-y-2 mb-4">
                        {birthdays.map(b => (
                            <li key={b.id} className="flex justify-between items-center text-sm font-medium">
                                <span>{b.name}</span>
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-pink-100">{b.role}</span>
                            </li>
                        ))}
                    </ul>
                )}

                <button 
                  onClick={handleRunBirthdayCheck}
                  disabled={checkingBirthdays}
                  className="w-full bg-white text-pink-600 py-2 rounded-lg text-sm font-bold hover:bg-pink-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    {checkingBirthdays ? <RefreshCcw size={14} className="animate-spin"/> : <Play size={14} />}
                    {checkingBirthdays ? 'Enviando...' : 'Enviar Felicitaciones'}
                </button>
                <p className="text-[10px] text-pink-200 mt-2 text-center opacity-80">Envía mensajes automáticos según las preferencias de cada usuario.</p>
             </div>
             
             {/* Background Decoration */}
             <Gift className="absolute -bottom-4 -right-4 text-white opacity-10" size={120} />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
             <h3 className="font-semibold text-slate-800 mb-4">Acciones Rápidas</h3>
             <div className="space-y-2">
               <button onClick={() => navigate('/book')} className="w-full text-left px-4 py-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-700 text-sm font-medium transition-colors border border-indigo-100 flex items-center justify-between group">
                 Ver Página de Reservas
                 <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
               </button>
               <button onClick={() => navigate('/clients')} className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 text-sm font-medium transition-colors border border-slate-100">
                 Añadir Nuevo Cliente
               </button>
               <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 text-sm font-medium transition-colors border border-slate-100">
                 Exportar Calendario
               </button>
             </div>
          </div>
        </div>
      </div>

      <AppointmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={addAppointment} 
      />
    </div>
  );
};