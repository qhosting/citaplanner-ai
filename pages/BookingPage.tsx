
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, 
  CheckCircle2, User, Sparkles, MapPin, ArrowRight, Loader2, Home,
  Scissors, Wand2, Star, ShieldCheck, Heart, Phone, Mail, FileText
} from 'lucide-react';
import { Professional, Service, Appointment, AppointmentStatus, LandingSettings } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

// --- HELPERS ---
const generateTimeSlots = (date: Date, professional: Professional, serviceDuration: number, appointments: Appointment[]): string[] => {
  const dayOfWeek = date.getDay(); 
  const schedule = professional.weeklySchedule.find(d => d.dayOfWeek === dayOfWeek);

  if (!schedule || !schedule.isEnabled) return [];

  // Verificación de excepciones (bloqueos)
  const isBlocked = professional.exceptions.some(exc => {
    const start = new Date(exc.startDate);
    const end = new Date(exc.endDate);
    const checkDate = new Date(date);
    checkDate.setHours(0,0,0,0);
    const excStart = new Date(start);
    excStart.setHours(0,0,0,0);
    const excEnd = new Date(end);
    excEnd.setHours(23,59,59,999);
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

    // No permitir citas en el pasado para el día de hoy
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
  
  // Data State
  const [settings, setSettings] = useState<LandingSettings | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Flow State
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

  // Init Data
  useEffect(() => {
    const loadData = async () => {
        try {
            const [set, s, p, a] = await Promise.all([
                api.getLandingSettings(),
                api.getServices(),
                api.getProfessionals(),
                api.getAppointments() // Load all for availability check (optimization: fetch by pro/date)
            ]);
            setSettings(set);
            setServices(s);
            setProfessionals(p);
            setAppointments(a);
        } catch (error) {
            console.error("Error loading booking data", error);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, []);

  const availablePros = useMemo(() => {
    if (!selectedService) return [];
    return professionals.filter(p => p.serviceIds?.includes(selectedService.id) || p.serviceIds?.length === 0);
  }, [selectedService, professionals]);

  const availableSlots = useMemo(() => {
    if (!selectedPro || !selectedService) return [];
    // Filter appointments for the selected professional to optimize
    const proAppointments = appointments.filter(a => a.professionalId === selectedPro.id);
    return generateTimeSlots(selectedDate, selectedPro, selectedService.duration, proAppointments);
  }, [selectedDate, selectedPro, selectedService, appointments]);

  const primaryColor = settings?.primaryColor || '#db2777';
  const secondaryColor = primaryColor + '10';

  const handleDateChange = (daysToAdd: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + daysToAdd);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (newDate < today) return;
    setSelectedDate(newDate);
    setSelectedTime(null);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!selectedService || !selectedPro || !selectedTime) return;
    setSubmitting(true);

    const startDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    startDateTime.setHours(hours, minutes, 0, 0);

    const endDateTime = new Date(startDateTime.getTime() + selectedService.duration * 60000);

    const newAppointment: Omit<Appointment, 'id'> = {
      title: selectedService.name,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      clientName: clientDetails.name,
      clientPhone: clientDetails.phone,
      description: clientDetails.notes || 'Reserva Online Web',
      status: AppointmentStatus.SCHEDULED,
      professionalId: selectedPro.id,
      serviceId: selectedService.id
    };

    const result = await api.createAppointment(newAppointment);
    setSubmitting(false);
    if(result) setStep(5);
  };

  if(loading || !settings) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-white">
              <Loader2 className="animate-spin text-indigo-600" size={40}/>
          </div>
      );
  }

  // --- RENDERS ---

  const renderStep1 = () => {
    const categories = Array.from(new Set(services.map(s => s.category)));
    return (
      <div className="animate-fade-in-up">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-slate-900 mb-2">Selecciona un servicio</h2>
          <p className="text-slate-500">¿Qué tratamiento deseas realizar hoy?</p>
        </div>
        <div className="space-y-10">
          {categories.map(cat => (
            <div key={cat}>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-2">{cat}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.filter(s => s.category === cat).map(service => (
                  <button
                    key={service.id}
                    onClick={() => { setSelectedService(service); setStep(2); }}
                    className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-3xl hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div style={{ backgroundColor: secondaryColor, color: primaryColor }} className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        {cat === 'Uñas' ? <Scissors size={20} /> : <Wand2 size={20} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{service.name}</h4>
                        <p className="text-xs text-slate-400">{service.duration} min</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block font-black text-slate-900 text-lg">${service.price}</span>
                      <span style={{ color: primaryColor }} className="text-[10px] font-bold uppercase tracking-wider">Elegir</span>
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
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-slate-900 mb-2">Elige a tu especialista</h2>
        <p className="text-slate-500">Contamos con las mejores artistas para {selectedService?.name}.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {availablePros.map(pro => (
          <button
            key={pro.id}
            onClick={() => { setSelectedPro(pro); setStep(3); }}
            className="p-8 bg-white border border-slate-100 rounded-[2.5rem] hover:border-indigo-200 hover:shadow-2xl transition-all text-center group"
          >
            <div className="w-24 h-24 rounded-full bg-slate-100 mx-auto mb-6 flex items-center justify-center text-3xl font-black text-slate-300 group-hover:scale-105 transition-transform overflow-hidden border-4 border-white shadow-lg">
                {pro.name.charAt(0)}
            </div>
            <h4 className="font-black text-xl text-slate-900 mb-1">{pro.name}</h4>
            <p style={{ color: primaryColor }} className="text-sm font-bold uppercase tracking-widest mb-4">{pro.role}</p>
            <div className="flex justify-center text-yellow-400 mb-6">
                <Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/>
            </div>
            <div style={{ backgroundColor: primaryColor }} className="py-3 rounded-2xl text-white font-bold text-sm">
                Seleccionar
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="animate-fade-in-up">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-slate-900 mb-2">¿Cuándo te gustaría venir?</h2>
        <p className="text-slate-500">Selecciona el mejor momento para tu {selectedService?.name}.</p>
      </div>

      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-8 bg-slate-50 p-4 rounded-3xl border border-slate-100">
           <button onClick={() => handleDateChange(-1)} className="p-3 bg-white rounded-2xl hover:bg-slate-100 shadow-sm"><ChevronLeft size={20}/></button>
           <div className="text-center">
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{selectedDate.toLocaleString('es-ES', { weekday: 'long' })}</p>
             <p className="text-xl font-black text-slate-900">{selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
           </div>
           <button onClick={() => handleDateChange(1)} className="p-3 bg-white rounded-2xl hover:bg-slate-100 shadow-sm"><ChevronRight size={20}/></button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {availableSlots.length > 0 ? (
            availableSlots.map(time => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`py-4 rounded-2xl font-bold text-sm transition-all border-2 ${
                  selectedTime === time 
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-105' 
                    : 'border-slate-100 bg-white text-slate-600 hover:border-indigo-200'
                }`}
              >
                {time}
              </button>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-slate-400">
              <Clock className="mx-auto mb-3 opacity-20" size={40} />
              <p className="italic">Sin disponibilidad para esta fecha.</p>
            </div>
          )}
        </div>

        {selectedTime && (
          <button
            onClick={() => setStep(4)}
            style={{ backgroundColor: primaryColor }}
            className="w-full mt-10 py-5 rounded-3xl text-white font-black text-lg shadow-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
          >
            Continuar con las {selectedTime} <ArrowRight size={20}/>
          </button>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="animate-fade-in-up">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-slate-900 mb-2">Casi listo...</h2>
        <p className="text-slate-500">Completa tus datos para confirmar tu cita.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 max-w-4xl mx-auto">
        <div className="lg:col-span-3">
          <form onSubmit={handleBooking} className="space-y-4">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    required
                    type="text"
                    value={clientDetails.name}
                    onChange={e => setClientDetails({...clientDetails, name: e.target.value})}
                    placeholder="Tu nombre aquí"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      required
                      type="tel"
                      value={clientDetails.phone}
                      onChange={e => setClientDetails({...clientDetails, phone: e.target.value})}
                      placeholder="+52..."
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      required
                      type="email"
                      value={clientDetails.email}
                      onChange={e => setClientDetails({...clientDetails, email: e.target.value})}
                      placeholder="hola@tuemail.com"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Notas (Opcional)</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 text-slate-300" size={18} />
                  <textarea
                    rows={3}
                    value={clientDetails.notes}
                    onChange={e => setClientDetails({...clientDetails, notes: e.target.value})}
                    placeholder="Alergias, preferencias o detalles especiales..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium resize-none"
                  />
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              style={{ backgroundColor: primaryColor }}
              className="w-full py-5 rounded-[2rem] text-white font-black text-xl shadow-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              {submitting ? <Loader2 className="animate-spin" size={24} /> : <><ShieldCheck size={24}/> Confirmar Reserva</>}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl sticky top-24">
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-500 mb-6">Resumen de Cita</h3>
              <div className="space-y-6">
                 <div className="flex gap-4">
                    <div style={{ backgroundColor: secondaryColor, color: primaryColor }} className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0">
                       <Sparkles size={20} />
                    </div>
                    <div>
                       <p className="text-xs text-slate-500 font-bold uppercase">Servicio</p>
                       <p className="font-bold text-lg">{selectedService?.name}</p>
                       <p className="text-sm text-slate-400">${selectedService?.price} • {selectedService?.duration} min</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0">
                       <User size={20} />
                    </div>
                    <div>
                       <p className="text-xs text-slate-500 font-bold uppercase">Especialista</p>
                       <p className="font-bold text-lg">{selectedPro?.name}</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0">
                       <CalendarIcon size={20} />
                    </div>
                    <div>
                       <p className="text-xs text-slate-500 font-bold uppercase">Fecha y Hora</p>
                       <p className="font-bold text-lg capitalize">{selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                       <p className="text-indigo-400 font-black text-xl">{selectedTime}</p>
                    </div>
                 </div>
              </div>
              <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                    <Heart size={18} fill="currentColor"/>
                 </div>
                 <p className="text-xs text-slate-400">Recibirás un recordatorio por WhatsApp 2 horas antes de tu cita.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="animate-fade-in-up text-center py-20 max-w-lg mx-auto">
      <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
         <CheckCircle2 size={48} />
      </div>
      <h2 className="text-4xl font-black text-slate-900 mb-4">¡Cita Agendada!</h2>
      <p className="text-slate-500 text-lg leading-relaxed mb-10">
        Gracias <strong>{clientDetails.name}</strong>, tu cita para <strong>{selectedService?.name}</strong> ha sido registrada con éxito. Te esperamos el próximo <strong>{selectedDate.toLocaleDateString()}</strong> a las <strong>{selectedTime}</strong>.
      </p>
      <div className="space-y-4">
        <Link to="/" className="block w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2">
            <Home size={18} /> Volver al Inicio
        </Link>
        <button onClick={() => window.print()} className="block w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">
            Descargar Comprobante (PDF)
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Dynamic Nav */}
      <nav className="bg-white border-b border-slate-100 h-20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
           <div className="flex items-center gap-4">
              {step > 1 && step < 5 && (
                <button 
                  onClick={() => setStep(step - 1)}
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              <Link to="/" className="flex items-center gap-2">
                <div style={{ backgroundColor: primaryColor }} className="p-1.5 rounded-lg text-white">
                  <Sparkles size={20} />
                </div>
                <span className="font-black text-xl tracking-tighter text-slate-900">{settings.businessName}</span>
              </Link>
           </div>
           
           <div className="hidden md:flex items-center gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-2">
                   <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all ${
                     step >= i ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 text-slate-300'
                   }`}>
                     {i}
                   </div>
                   <span className={`text-[10px] font-bold uppercase tracking-widest ${step >= i ? 'text-slate-900' : 'text-slate-300'}`}>
                     {i === 1 && 'Servicio'}
                     {i === 2 && 'Especialista'}
                     {i === 3 && 'Fecha'}
                     {i === 4 && 'Confirmar'}
                   </span>
                </div>
              ))}
           </div>

           <div className="text-xs font-black text-slate-400 flex items-center gap-2">
              <MapPin size={14} style={{ color: primaryColor }} />
              <span className="hidden sm:inline">Av. Principal 123</span>
           </div>
        </div>
      </nav>

      {/* Steps Content */}
      <main className="max-w-7xl mx-auto px-6 pt-12">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </main>

      {/* Floating Info (Mobile Only) */}
      {step > 1 && step < 4 && (
        <div className="md:hidden fixed bottom-6 left-6 right-6 bg-slate-900 rounded-3xl p-5 text-white shadow-2xl animate-fade-in-up">
           <div className="flex justify-between items-center">
              <div>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tu selección</p>
                 <p className="font-bold text-sm truncate max-w-[200px]">{selectedService?.name}</p>
                 {selectedPro && <p style={{ color: primaryColor }} className="text-xs font-bold">{selectedPro.name}</p>}
              </div>
              <div className="text-right">
                 <p className="font-black text-lg">${selectedService?.price}</p>
                 <p className="text-[10px] text-slate-500">{selectedService?.duration} min</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
