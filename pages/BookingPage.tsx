
import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight,
  CheckCircle2, User, Sparkles, MapPin, ArrowRight, Loader2, Home,
  Scissors, Wand2, Star, ShieldCheck, Heart, Phone, Mail, FileText, AlertCircle, ShieldAlert
} from 'lucide-react';
import { Professional, Service, Appointment, AppointmentStatus, LandingSettings } from '../types';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LogoCitaplanner } from '../components/LogoCitaplanner';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';
import { toast } from 'sonner';

// --- HELPERS ---
const generateTimeSlots = (date: Date, professional: Professional, serviceDuration: number, appointments: Appointment[]): string[] => {
  const dayOfWeek = date.getDay();
  const schedule = professional.weeklySchedule.find(d => d.dayOfWeek === dayOfWeek);

  if (!schedule || !schedule.isEnabled) return [];

  const isBlocked = professional.exceptions.some(exc => {
    const start = new Date(exc.startDate);
    const end = new Date(exc.endDate);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const excStart = new Date(start);
    excStart.setHours(0, 0, 0, 0);
    const excEnd = new Date(end);
    excEnd.setHours(23, 59, 59, 999);
    return checkDate >= excStart && checkDate <= excEnd;
  });

  if (isBlocked) return [];

  const slots: string[] = [];

  // Filtrar citas del profesional para el día seleccionado
  const dayAppointments = appointments.filter(a => {
    const aptDate = new Date(a.startDateTime);
    return aptDate.getDate() === date.getDate() &&
      aptDate.getMonth() === date.getMonth() &&
      aptDate.getFullYear() === date.getFullYear() &&
      a.status !== AppointmentStatus.CANCELLED;
  });

  schedule.slots.forEach(range => {
    const [startH, startM] = range.start.split(':').map(Number);
    const [endH, endM] = range.end.split(':').map(Number);

    let current = new Date(date);
    current.setHours(startH, startM, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endH, endM, 0, 0);

    const now = new Date();

    while (current.getTime() + serviceDuration * 60000 <= endTime.getTime()) {
      const slotEnd = new Date(current.getTime() + serviceDuration * 60000);

      // Verificar colisión con citas existentes
      const isTaken = dayAppointments.some(apt => {
        const aptStart = new Date(apt.startDateTime);
        const aptEnd = new Date(apt.endDateTime);
        // Overlap logic: (StartA < EndB) and (EndA > StartB)
        return current < aptEnd && slotEnd > aptStart;
      });

      if (current.getTime() > now.getTime() && !isTaken) {
        slots.push(current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
      }
      current.setMinutes(current.getMinutes() + 30);
    }
  });

  return slots;
};

export const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [settings, setSettings] = useState<LandingSettings>(() => {
    try {
      const saved = localStorage.getItem('citaPlannerLandingSettings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      businessName: 'Shula Studio',
      primaryColor: '#D4AF37',
      secondaryColor: '#C5A028',
      slogan: 'Alta Tecnología en Belleza',
      aboutText: '',
      contactPhone: '',
      maintenanceMode: false
    } as any;
  });
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const [step, setStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [clientDetails, setClientDetails] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  // Pre-fill user data
  useEffect(() => {
    if (isAuthenticated && user) {
      setClientDetails(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    }
  }, [isAuthenticated, user]);

  const [searchParams] = useSearchParams();

  // Init Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [setRes, s, p, a] = await Promise.all([
          api.getLandingSettings(),
          api.getServices(),
          api.getProfessionals(),
          api.getAppointments()
        ]);
        
        if (setRes.success && setRes.value && Object.keys(setRes.value).length > 0) {
          const set = setRes.value;
          setSettings(set);
          localStorage.setItem('citaPlannerLandingSettings', JSON.stringify(set));
          // Update document title
          if (set.businessName) {
            document.title = `Reserva Tu Experiencia | ${set.businessName}`;
          }
        } else {
          // Default fallback to prevent infinite loading
          setSettings({
            businessName: 'Shula Studio',
            primaryColor: '#D4AF37',
            secondaryColor: '#C5A028',
            slogan: 'Alta Tecnología en Belleza',
            aboutText: '',
            contactPhone: '',
            maintenanceMode: false
          } as any);
        }
        
        if (Array.isArray(s)) {
          const activeServices = s.filter((srv: any) => srv.status === 'ACTIVE');
          setServices(activeServices);
          
          // === AUTO-SELECT SERVICE FROM URL ===
          const urlServiceId = searchParams.get('serviceId');
          if (urlServiceId) {
            const preselected = activeServices.find((srv: any) => srv.id === urlServiceId);
            if (preselected) {
              setSelectedService(preselected);
              setStep(2);
            }
          }
        }
        if (Array.isArray(p)) setProfessionals(p);
        if (Array.isArray(a)) setAppointments(a);
      } catch (error) {
        console.error("Error loading booking data", error);
        // Ensure settings is not null to exit loading state
        if (!settings) {
          setSettings({ businessName: 'Aurum Studio', primaryColor: '#D4AF37' } as any);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const availablePros = useMemo(() => {
    if (!selectedService) return [];
    return professionals.filter(p => {
      // If no serviceIds defined, pro is available for all
      if (!p.serviceIds || p.serviceIds.trim() === '') return true;
      return p.serviceIds.includes(selectedService.id);
    });
  }, [selectedService, professionals]);

  const availableSlots = useMemo(() => {
    if (!selectedPro || !selectedService) return [];
    // Filter appointments for the selected professional to optimize
    const proAppointments = appointments.filter(a => a.professionalId === selectedPro.id);
    return generateTimeSlots(selectedDate, selectedPro, selectedService.duration, proAppointments);
  }, [selectedDate, selectedPro, selectedService, appointments]);

  const primaryColor = settings?.primaryColor || '#D4AF37';
  const secondaryColor = primaryColor + '10';

  const handleDateChange = (daysToAdd: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + daysToAdd);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate < today) return;
    setSelectedDate(newDate);
    setSelectedTime(null);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedPro || !selectedTime) return;
    setSubmitting(true);

    const startDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    startDateTime.setHours(hours, minutes, 0, 0);

    const endDateTime = new Date(startDateTime.getTime() + selectedService.duration * 60000);

    const newAppointment: Omit<Appointment, 'id'> & { paymentReceiptUrl?: string } = {
      title: selectedService.name,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      clientName: clientDetails.name,
      clientPhone: clientDetails.phone,
      description: clientDetails.notes || 'Reserva Online Web',
      status: AppointmentStatus.SCHEDULED,
      professionalId: selectedPro.id,
      serviceId: selectedService.id,
      paymentReceiptUrl: paymentReceiptUrl || undefined
    };

    const result = await api.createAppointment(newAppointment);
    setSubmitting(false);
    if (result) setStep(5);
  };

  if (loading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
      </div>
    );
  }

  // NOTE: Maintenance logic moved to global App.tsx guard.

  const renderStep1 = () => {
    const categories = Array.from(new Set(services.map(s => s.category)));

    if (services.length === 0) {
      return (
        <div className="animate-fade-in-up text-center py-20">
          <AlertCircle className="mx-auto text-slate-300 mb-6" size={64} />
          <h2 className="text-3xl font-playfair font-black text-slate-900 mb-4">Agenda en Mantenimiento</h2>
          <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
            Estamos actualizando nuestro catálogo de servicios exclusivos. Por favor, vuelve a intentarlo en unos minutos o contacta directamente a nuestro concierge.
          </p>
          <Link to="/" className="mt-10 inline-block px-10 py-4 bg-slate-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest">Volver al Inicio</Link>
        </div>
      );
    }

    return (
      <div className="animate-fade-in-up">
        <div className="text-center mb-16">
          <span className="text-[10px] font-black uppercase tracking-[0.5em] mb-4 block" style={{ color: primaryColor }}>Paso 1 de 4</span>
          <h2 className="text-5xl font-playfair font-black text-white mb-4 tracking-tighter">Selecciona tu Experiencia</h2>
          <p className="text-zinc-400 text-lg">{settings.slogan || "Servicios de alta tecnología diseñados para resaltar tu esencia."}</p>
        </div>
        <div className="space-y-16 max-w-4xl mx-auto">
          {categories.map(cat => (
            <div key={cat}>
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-8 border-b border-white/5 pb-4">{cat}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {services.filter(s => s.category === cat).map(service => (
                  <button
                    key={service.id}
                    onClick={() => { setSelectedService(service); setStep(2); }}
                    className="flex items-center justify-between p-8 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] hover:border-[#D4AF37]/30 hover:bg-zinc-900/60 transition-all text-left group relative overflow-hidden"
                  >
                    <div className="flex items-center gap-6 relative z-10">
                      <div style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', color: primaryColor }} className="w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        {cat === 'Uñas' ? <Scissors size={24} /> : <Wand2 size={24} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-xl text-white tracking-tight">{service.name}</h4>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">{service.duration} MINUTOS</p>
                      </div>
                    </div>
                    <div className="text-right relative z-10">
                      <span className="block font-black text-white text-2xl tracking-tighter">${service.price}</span>
                      <span style={{ color: primaryColor }} className="text-[9px] font-black uppercase tracking-[0.2em]">Seleccionar</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStep2 = () => (
    <div className="animate-fade-in-up">
      <div className="text-center mb-16">
        <span className="text-[10px] font-black uppercase tracking-[0.5em] mb-4 block" style={{ color: primaryColor }}>Paso 2 de 4</span>
        <h2 className="text-5xl font-playfair font-black text-white mb-4 tracking-tighter">Tu Especialista</h2>
        <p className="text-zinc-400 text-lg">Nuestros especialistas master transformarán tu visión en una realidad.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {availablePros.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-zinc-900/20 rounded-[3.5rem] border border-dashed border-white/10">
            <User className="mx-auto text-zinc-800 mb-6" size={64} />
            <p className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">No hay especialistas vinculados a este servicio</p>
            <button onClick={() => setStep(1)} className="mt-6 text-[#D4AF37] text-[9px] font-black uppercase tracking-widest hover:underline">Cambiar Servicio</button>
          </div>
        ) : availablePros.map(pro => (
          <button
            key={pro.id}
            onClick={() => { setSelectedPro(pro); setStep(3); }}
            className="p-10 bg-zinc-900/40 border border-white/5 rounded-[3.5rem] hover:border-[#D4AF37]/30 transition-all text-center group"
            style={{borderColor: selectedPro?.id === pro.id ? primaryColor : undefined}}
          >
            <div className="w-32 h-32 rounded-full bg-zinc-800 mx-auto mb-8 flex items-center justify-center text-4xl font-black text-zinc-700 group-hover:scale-105 transition-transform overflow-hidden border-4 border-black shadow-xl">
              {pro.avatarUrl ? (
                <img src={pro.avatarUrl} className="w-full h-full object-cover" alt={pro.name} />
              ) : pro.name.charAt(0)}
            </div>
            <h4 className="font-black text-2xl text-white mb-1 tracking-tight">{pro.name}</h4>
            <p style={{ color: primaryColor }} className="text-[11px] font-black uppercase tracking-[0.3em] mb-6">{pro.role}</p>
            <div className="flex justify-center text-[#D4AF37] mb-8 gap-1">
              <Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" />
            </div>
            <div style={{ backgroundColor: '#CE467B' }} className="py-4 rounded-full text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-black/10 group-hover:translate-y-[-2px] transition-all">
              Reservar con {pro.name.split(' ')[0]}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="animate-fade-in-up">
      <div className="text-center mb-16">
        <span className="text-[10px] font-black uppercase tracking-[0.5em] mb-4 block" style={{ color: primaryColor }}>Paso 3 de 4</span>
        <h2 className="text-5xl font-playfair font-black text-white mb-4 tracking-tighter">Momento de tu Cita</h2>
        <p className="text-zinc-400 text-lg">Selecciona el horario que mejor se adapte a tu agenda.</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-12 bg-zinc-900/40 p-6 rounded-[2.5rem] border border-white/5 shadow-sm">
          <button onClick={() => handleDateChange(-1)} className="p-4 bg-zinc-800 rounded-2xl hover:bg-zinc-700 transition-colors text-white"><ChevronLeft size={24} /></button>
          <div className="text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] mb-1" style={{ color: primaryColor }}>{selectedDate.toLocaleString('es-ES', { weekday: 'long' })}</p>
            <p className="text-2xl font-black text-white tracking-tight">{selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
          </div>
          <button onClick={() => handleDateChange(1)} className="p-4 bg-zinc-800 rounded-2xl hover:bg-zinc-700 transition-colors text-white"><ChevronRight size={24} /></button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          {availableSlots.length > 0 ? (
            availableSlots.map(time => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`py-5 rounded-3xl font-black text-sm transition-all border-2 ${selectedTime === time
                  ? 'text-white shadow-2xl scale-105'
                  : 'border-white/5 bg-zinc-900/40 text-zinc-500 hover:border-[#D4AF37]/30'
                  }`}
                style={selectedTime === time ? { backgroundColor: '#CE467B', borderColor: '#CE467B' } : {}}
              >
                {time}
              </button>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-zinc-700">
              <Clock className="mx-auto mb-6 opacity-10" size={64} />
              <p className="italic font-medium uppercase tracking-widest text-[10px]">Sin disponibilidad para esta fecha</p>
            </div>
          )}
        </div>

        {selectedTime && (
          <button
            onClick={() => setStep(4)}
            style={{ backgroundColor: '#CE467B' }}
            className="w-full mt-12 py-6 rounded-full text-white font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.02] transition-transform"
          >
            Siguiente Paso <ArrowRight size={20} />
          </button>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="animate-fade-in-up">
      <div className="text-center mb-16">
        <span className="text-[10px] font-black uppercase tracking-[0.5em] mb-4 block" style={{ color: primaryColor }}>Paso 4 de 4</span>
        <h2 className="text-5xl font-playfair font-black text-white mb-4 tracking-tighter">Últimos Detalles</h2>
        <p className="text-zinc-400 text-lg">Confirma tus datos para asegurar tu cita.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 max-w-5xl mx-auto">
        <div className="lg:col-span-3">
          <form onSubmit={handleBooking} className="space-y-6">
            <div className="bg-zinc-900/40 p-10 rounded-[3rem] border border-white/5 shadow-sm space-y-8">
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 ml-2">Nombre y Apellido</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
                  <input
                    required
                    type="text"
                    value={clientDetails.name}
                    onChange={e => setClientDetails({ ...clientDetails, name: e.target.value })}
                    placeholder="Tu identidad"
                    className="w-full pl-14 pr-6 py-5 bg-zinc-800/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-[#D4AF37] outline-none font-bold text-white placeholder-zinc-700 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 ml-2">WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
                    <input
                      required
                      type="tel"
                      value={clientDetails.phone}
                      onChange={e => setClientDetails({ ...clientDetails, phone: e.target.value })}
                      placeholder="+52..."
                      className="w-full pl-14 pr-6 py-5 bg-zinc-800/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-[#D4AF37] outline-none font-bold text-white transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 ml-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
                    <input
                      required
                      type="email"
                      value={clientDetails.email}
                      onChange={e => setClientDetails({ ...clientDetails, email: e.target.value })}
                      placeholder="hola@aurum.mx"
                      className="w-full pl-14 pr-6 py-5 bg-zinc-800/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-[#D4AF37] outline-none font-bold text-white transition-all"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 ml-2">Especificaciones (Opcional)</label>
                <div className="relative">
                  <FileText className="absolute left-5 top-6 text-zinc-600" size={20} />
                  <textarea
                    rows={4}
                    value={clientDetails.notes}
                    onChange={e => setClientDetails({ ...clientDetails, notes: e.target.value })}
                    placeholder="Cuéntanos sobre tus preferencias o solicitudes especiales..."
                    className="w-full pl-14 pr-6 py-6 bg-zinc-800/50 border border-white/5 rounded-3xl focus:ring-2 outline-none font-bold text-white resize-none transition-all placeholder-zinc-700"
                    style={{'--tw-ring-color': primaryColor} as any}
                  />
                </div>
              </div>

              {/* Bank Transfer Advance Payment Section */}
              <div className="border-t border-white/5 pt-8 space-y-6">
                <div>
                  <h4 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Star size={14} className="text-[#D4AF37]" /> Anticipo para Asegurar tu Cita
                  </h4>
                  <p className="text-[10.5px] text-zinc-400 font-semibold leading-relaxed uppercase tracking-wider">
                    Para pre-confirmar y apartar tu espacio técnico, solicitamos un anticipo de **$200 MXN**. Por favor realiza la transferencia a la cuenta de Shula Studio y sube tu comprobante o ticket a continuación.
                  </p>
                </div>

                <div className="bg-black/60 border border-white/5 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-semibold text-zinc-300">
                  <div>
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Banco</span>
                    <span className="text-white uppercase font-black tracking-tight">BBVA Bancomer</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">CLABE Interbancaria</span>
                    <span className="text-white font-mono font-black tracking-tight">0121 8001 2345 6789 01</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Beneficiario</span>
                    <span className="text-white uppercase font-black tracking-tight">Shula Studio S.A. de C.V.</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Concepto de Pago</span>
                    <span className="text-[#D4AF37] uppercase font-black tracking-tight">{clientDetails.name || 'Anticipo Cita'}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-2">Sube tu Comprobante de Depósito / Ticket (Obligatorio)</label>
                  <div className="relative">
                    {paymentReceiptUrl ? (
                      <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/10 shrink-0">
                            <ShieldCheck size={24} />
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Comprobante Cargado Exitosamente</span>
                            <span className="text-[8.5px] text-zinc-500 font-bold uppercase tracking-wider block mt-0.5">Listo para validación técnica por el administrador</span>
                          </div>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto justify-end">
                          <a href={paymentReceiptUrl} target="_blank" rel="noreferrer" className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-[9px] font-black text-white uppercase tracking-widest rounded-lg border border-white/5 text-center shrink-0">Ver Ticket</a>
                          <button type="button" onClick={() => setPaymentReceiptUrl(null)} className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-[9px] font-black text-rose-500 uppercase tracking-widest rounded-lg border border-rose-500/10 text-center shrink-0 cursor-pointer">Eliminar</button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-[#D4AF37]/30 bg-zinc-900/20 rounded-3xl p-10 cursor-pointer transition-all text-center group">
                        <input 
                          type="file" 
                          accept="image/*,application/pdf"
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingReceipt(true);
                            try {
                              const url = await api.uploadImage(file);
                              if (url) {
                                setPaymentReceiptUrl(url);
                                toast.success("Comprobante de anticipo cargado");
                              } else {
                                toast.error("Error al cargar la imagen del ticket");
                              }
                            } catch (err) {
                              toast.error("Error al cargar comprobante");
                            } finally {
                              setUploadingReceipt(false);
                            }
                          }}
                        />
                        {uploadingReceipt ? (
                          <div className="space-y-3">
                            <Loader2 className="animate-spin text-[#D4AF37] mx-auto" size={32} />
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Subiendo archivo de pago...</span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="w-12 h-12 bg-white/5 group-hover:bg-[#D4AF37]/10 group-hover:text-[#D4AF37] rounded-2xl flex items-center justify-center mx-auto text-zinc-500 transition-all border border-white/5">
                              <FileText size={20} />
                            </div>
                            <div>
                              <span className="text-[10px] font-black text-white uppercase tracking-widest block">Seleccionar Comprobante o Tomar Foto</span>
                              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider block mt-1">Formatos JPG, PNG o PDF de tu banca móvil</span>
                            </div>
                          </div>
                        )}
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !paymentReceiptUrl}
              style={{ backgroundColor: '#CE467B' }}
              className="w-full py-7 rounded-full text-white font-black text-[14px] uppercase tracking-[0.5em] shadow-[0_30px_60px_-15px_rgba(206,70,123,0.3)] flex items-center justify-center gap-4 hover:scale-[1.02] transition-transform disabled:opacity-30 disabled:pointer-events-none"
            >
              {submitting ? <Loader2 className="animate-spin" size={24} /> : <><ShieldCheck size={28} /> Confirmar Mi Cita</>}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-[#1A1A1A] rounded-[3.5rem] p-10 text-white shadow-2xl sticky top-32 overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <Sparkles size={120} />
            </div>
            <h3 className="font-black text-[10px] uppercase tracking-[0.4em] mb-10 border-b border-white/5 pb-6" style={{color: primaryColor}}>Protocolo de Cita</h3>
            <div className="space-y-10 relative z-10">
              <div className="flex gap-6">
                <div style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', color: primaryColor }} className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Sparkles size={24} />
                </div>
                <div>
                  <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Tratamiento</p>
                  <p className="font-black text-xl tracking-tight leading-tight">{selectedService?.name}</p>
                  <p className="text-[10px] text-[#D4AF37] font-bold mt-2 uppercase tracking-widest">${selectedService?.price} • {selectedService?.duration} MIN</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <User size={24} className="text-zinc-400" />
                </div>
                <div>
                  <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Especialista Master</p>
                  <p className="font-black text-xl tracking-tight leading-tight">{selectedPro?.name}</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <CalendarIcon size={24} className="text-zinc-400" />
                </div>
                <div>
                  <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Fecha de Operación</p>
                  <p className="font-black text-xl tracking-tight capitalize leading-tight">{selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
                  <p className="text-[#D4AF37] font-black text-2xl mt-1 tracking-tighter">{selectedTime}</p>
                </div>
              </div>
            </div>
            <div className="mt-12 pt-10 border-t border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/10">
                <Heart size={20} fill="currentColor" />
              </div>
              <p className="text-[9px] text-zinc-500 font-bold leading-relaxed uppercase tracking-widest">Sincronización segura con {settings.businessName}.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="animate-fade-in-up text-center py-24 max-w-2xl mx-auto">
      <div className="mb-12 flex justify-center">
         <LogoCitaplanner size={40} color={primaryColor} businessName={settings.businessName} />
      </div>
      <div className="w-32 h-32 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-10 border-2 border-emerald-500/20 shadow-2xl relative">
        <CheckCircle2 size={64} />
        <div className="absolute -top-2 -right-2 animate-pulse text-emerald-500">
           <ShieldCheck size={32} fill="currentColor" className="text-black" />
        </div>
      </div>
      <h2 className="text-5xl font-playfair font-black text-white mb-6 tracking-tighter">Reserva Confirmada</h2>
      <p className="text-zinc-400 text-xl leading-relaxed mb-14 max-w-lg mx-auto">
        Gracias <strong className="text-white">{clientDetails.name}</strong>, tu cita en <strong className="text-white">{settings.businessName}</strong> ha sido agendada. Recibirás una notificación con los detalles de tu visita.
      </p>
      <div className="space-y-6">
        <Link 
          to="/" 
          className="block w-full py-6 text-white rounded-full font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-4"
          style={{ backgroundColor: '#CE467B' }}
        >
          <Home size={20} /> Finalizar y Salir
        </Link>
        <button onClick={() => window.print()} className="block w-full py-6 bg-zinc-900 border border-white/5 text-zinc-400 rounded-full font-black text-[12px] uppercase tracking-[0.4em] hover:bg-zinc-800 transition-all">
          Imprimir Comprobante
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-[#050505] pb-12 selection:bg-[#D4AF37] selection:text-black">
      <SEO settings={settings} pageTitle={`Reserva Tu Experiencia | ${settings.businessName}`} />
      {/* NAVEGACIÓN PREMIUM */}
      <nav className="fixed top-0 left-0 w-full z-[100] transition-all duration-500 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {step > 1 && step < 5 && (
              <button
                onClick={() => setStep(step - 1)}
                className="p-3 text-zinc-500 hover:text-[#D4AF37] bg-white/5 rounded-2xl transition-all"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <Link to="/" className="flex items-center gap-3">
              <LogoCitaplanner size={32} color={primaryColor} customUrl={settings.logoUrl} businessName={settings.businessName} />
            </Link>
          </div>

          {/* Stepper Progresivo Desktop */}
          <div className="hidden lg:flex items-center gap-12">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border transition-all duration-500 ${step >= i ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'border-white/10 text-zinc-700'
                  }`}>
                  {i}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-[0.3em] transition-colors ${step >= i ? 'text-white' : 'text-zinc-700'}`}>
                  {i === 1 && 'Servicio'}
                  {i === 2 && 'Especialista'}
                  {i === 3 && 'Fecha'}
                  {i === 4 && 'Identidad'}
                </span>
                {i < 4 && <div className={`w-8 h-px transition-colors duration-500 ${step > i ? 'bg-[#D4AF37]' : 'bg-white/5'}`} />}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-white/5 px-6 py-3 rounded-full border border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Secure Node</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 pt-44">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </main>

      {/* Floating Summary Mobile */}
      {step > 1 && step < 4 && (
        <div className="lg:hidden fixed bottom-10 left-8 right-8 bg-zinc-900/90 backdrop-blur-xl rounded-[2.5rem] p-8 text-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] animate-fade-in-up border border-[#D4AF37]/20 z-50">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest mb-1">Tu Selección</p>
              <p className="font-black text-lg tracking-tighter truncate max-w-[180px]">{selectedService?.name}</p>
              {selectedPro && <p className="text-[10px] font-bold text-zinc-400 mt-0.5">{selectedPro.name}</p>}
            </div>
            <div className="text-right">
              <p className="font-black text-2xl tracking-tighter">${selectedService?.price}</p>
              <button 
                onClick={() => setStep(step + 1)}
                className="mt-2 text-[9px] font-black uppercase tracking-widest text-[#D4AF37] border-b border-[#D4AF37]/30 pb-0.5"
              >
                Continuar →
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default BookingPage;
