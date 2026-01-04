
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, 
  CheckCircle2, User, Sparkles, MapPin, ArrowRight, Loader2, Home,
  Scissors, Wand2, Star, ShieldCheck, Heart, Phone, Mail, FileText, AlertCircle
} from 'lucide-react';
import { Professional, Service, Appointment, AppointmentStatus, LandingSettings } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

// --- HELPERS ---
const generateTimeSlots = (date: Date, professional: Professional, serviceDuration: number): string[] => {
  const dayOfWeek = date.getDay(); 
  const schedule = professional.weeklySchedule.find(d => d.dayOfWeek === dayOfWeek);

  if (!schedule || !schedule.isEnabled) return [];

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
  schedule.slots.forEach(range => {
    const [startH, startM] = range.start.split(':').map(Number);
    const [endH, endM] = range.end.split(':').map(Number);

    let current = new Date(date);
    current.setHours(startH, startM, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endH, endM, 0, 0);

    const now = new Date();
    
    while (current.getTime() + serviceDuration * 60000 <= endTime.getTime()) {
      if (current.getTime() > now.getTime()) {
        slots.push(current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
      }
      current.setMinutes(current.getMinutes() + 30);
    }
  });

  return slots;
};

export const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [settings, setSettings] = useState<LandingSettings | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    const loadData = async () => {
        try {
            const [set, s, p] = await Promise.all([
                api.getLandingSettings(),
                api.getServices(),
                api.getProfessionals()
            ]);
            setSettings(set);
            setServices(s || []);
            setProfessionals(p || []);
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
    return professionals.filter(p => p.serviceIds?.includes(selectedService.id) || !p.serviceIds || p.serviceIds.length === 0);
  }, [selectedService, professionals]);

  const availableSlots = useMemo(() => {
    if (!selectedPro || !selectedService) return [];
    return generateTimeSlots(selectedDate, selectedPro, selectedService.duration);
  }, [selectedDate, selectedPro, selectedService]);

  const primaryColor = settings?.primaryColor || '#D4AF37';
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
          <div className="min-h-screen flex items-center justify-center bg-[#FDFBF9]">
              <Loader2 className="animate-spin text-[#D4AF37]" size={40}/>
          </div>
      );
  }

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
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37] mb-4 block">Paso 1 de 4</span>
          <h2 className="text-5xl font-playfair font-black text-slate-900 mb-4 tracking-tighter">Selecciona tu Experiencia</h2>
          <p className="text-slate-500 text-lg">Tratamientos de alta tecnología diseñados para resaltar tu belleza natural.</p>
        </div>
        <div className="space-y-16 max-w-4xl mx-auto">
          {categories.map(cat => (
            <div key={cat}>
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 mb-8 border-b border-slate-100 pb-4">{cat}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {services.filter(s => s.category === cat).map(service => (
                  <button
                    key={service.id}
                    onClick={() => { setSelectedService(service); setStep(2); }}
                    className="flex items-center justify-between p-8 bg-white border border-slate-100 rounded-[2.5rem] hover:border-[#D4AF37]/30 hover:shadow-2xl hover:shadow-[#D4AF37]/5 transition-all text-left group relative overflow-hidden"
                  >
                    <div className="flex items-center gap-6 relative z-10">
                      <div style={{ backgroundColor: secondaryColor, color: primaryColor }} className="w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        {cat === 'Uñas' ? <Scissors size={24} /> : <Wand2 size={24} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-xl text-slate-800 tracking-tight">{service.name}</h4>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{service.duration} MINUTOS</p>
                      </div>
                    </div>
                    <div className="text-right relative z-10">
                      <span className="block font-black text-slate-900 text-2xl tracking-tighter">${service.price}</span>
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
        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37] mb-4 block">Paso 2 de 4</span>
        <h2 className="text-5xl font-playfair font-black text-slate-900 mb-4 tracking-tighter">Tu Especialista Aurum</h2>
        <p className="text-slate-500 text-lg">Nuestras artistas master transformarán tu visión en una realidad eterna.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {availablePros.map(pro => (
          <button
            key={pro.id}
            onClick={() => { setSelectedPro(pro); setStep(3); }}
            className="p-10 bg-white border border-slate-100 rounded-[3.5rem] hover:border-[#D4AF37]/30 hover:shadow-2xl transition-all text-center group"
          >
            <div className="w-32 h-32 rounded-full bg-slate-50 mx-auto mb-8 flex items-center justify-center text-4xl font-black text-slate-200 group-hover:scale-105 transition-transform overflow-hidden border-4 border-white shadow-xl">
                {pro.name.charAt(0)}
            </div>
            <h4 className="font-black text-2xl text-slate-900 mb-1 tracking-tight">{pro.name}</h4>
            <p style={{ color: primaryColor }} className="text-[11px] font-black uppercase tracking-[0.3em] mb-6">{pro.role}</p>
            <div className="flex justify-center text-[#D4AF37] mb-8 gap-1">
                <Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/>
            </div>
            <div style={{ backgroundColor: primaryColor }} className="py-4 rounded-full text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#D4AF37]/20 group-hover:translate-y-[-2px] transition-all">
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
        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37] mb-4 block">Paso 3 de 4</span>
        <h2 className="text-5xl font-playfair font-black text-slate-900 mb-4 tracking-tighter">Momento de Ritual</h2>
        <p className="text-slate-500 text-lg">El tiempo es el lujo más preciado. Selecciona tu espacio sagrado.</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-12 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <button onClick={() => handleDateChange(-1)} className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"><ChevronLeft size={24}/></button>
           <div className="text-center">
             <p className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.4em] mb-1">{selectedDate.toLocaleString('es-ES', { weekday: 'long' })}</p>
             <p className="text-2xl font-black text-slate-900 tracking-tight">{selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
           </div>
           <button onClick={() => handleDateChange(1)} className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"><ChevronRight size={24}/></button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          {availableSlots.length > 0 ? (
            availableSlots.map(time => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`py-5 rounded-3xl font-black text-sm transition-all border-2 ${
                  selectedTime === time 
                    ? 'border-[#D4AF37] bg-[#D4AF37] text-white shadow-2xl shadow-[#D4AF37]/20 scale-105' 
                    : 'border-slate-50 bg-white text-slate-400 hover:border-[#D4AF37]/20'
                }`}
              >
                {time}
              </button>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-slate-300">
              <Clock className="mx-auto mb-6 opacity-10" size={64} />
              <p className="italic font-medium uppercase tracking-widest text-[10px]">Sin disponibilidad neuronal para esta fecha</p>
            </div>
          )}
        </div>

        {selectedTime && (
          <button
            onClick={() => setStep(4)}
            style={{ backgroundColor: primaryColor }}
            className="w-full mt-12 py-6 rounded-full text-white font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.02] transition-transform"
          >
            Siguiente Paso <ArrowRight size={20}/>
          </button>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="animate-fade-in-up">
      <div className="text-center mb-16">
        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37] mb-4 block">Paso 4 de 4</span>
        <h2 className="text-5xl font-playfair font-black text-slate-900 mb-4 tracking-tighter">Últimos Detalles</h2>
        <p className="text-slate-500 text-lg">Confirma tu identidad para asegurar tu acceso exclusivo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 max-w-5xl mx-auto">
        <div className="lg:col-span-3">
          <form onSubmit={handleBooking} className="space-y-6">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Nombre y Apellido</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input
                    required
                    type="text"
                    value={clientDetails.name}
                    onChange={e => setClientDetails({...clientDetails, name: e.target.value})}
                    placeholder="Tu identidad"
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-50 rounded-2xl focus:ring-2 focus:ring-[#D4AF37] outline-none font-bold text-slate-800 placeholder-slate-300 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input
                      required
                      type="tel"
                      value={clientDetails.phone}
                      onChange={e => setClientDetails({...clientDetails, phone: e.target.value})}
                      placeholder="+52..."
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-50 rounded-2xl focus:ring-2 focus:ring-[#D4AF37] outline-none font-bold text-slate-800 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input
                      required
                      type="email"
                      value={clientDetails.email}
                      onChange={e => setClientDetails({...clientDetails, email: e.target.value})}
                      placeholder="hola@aurum.mx"
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-50 rounded-2xl focus:ring-2 focus:ring-[#D4AF37] outline-none font-bold text-slate-800 transition-all"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Especificaciones de Lujo (Opcional)</label>
                <div className="relative">
                  <FileText className="absolute left-5 top-6 text-slate-300" size={20} />
                  <textarea
                    rows={4}
                    value={clientDetails.notes}
                    onChange={e => setClientDetails({...clientDetails, notes: e.target.value})}
                    placeholder="Cuéntanos sobre tus preferencias, alergias o solicitudes especiales..."
                    className="w-full pl-14 pr-6 py-6 bg-slate-50 border border-slate-50 rounded-3xl focus:ring-2 focus:ring-[#D4AF37] outline-none font-bold text-slate-800 resize-none transition-all"
                  />
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              style={{ backgroundColor: primaryColor }}
              className="w-full py-7 rounded-full text-white font-black text-[14px] uppercase tracking-[0.5em] shadow-[0_30px_60px_-15px_rgba(197,160,40,0.4)] flex items-center justify-center gap-4 hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              {submitting ? <Loader2 className="animate-spin" size={24} /> : <><ShieldCheck size={28}/> Confirmar Mi Ritual</>}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
           <div className="bg-[#1A1A1A] rounded-[3.5rem] p-10 text-white shadow-2xl sticky top-32 overflow-hidden border border-white/5">
              <div className="absolute top-0 right-0 p-10 opacity-5">
                 <Sparkles size={120} />
              </div>
              <h3 className="font-black text-[10px] uppercase tracking-[0.4em] text-[#D4AF37] mb-10 border-b border-white/5 pb-6">Protocolo de Cita</h3>
              <div className="space-y-10 relative z-10">
                 <div className="flex gap-6">
                    <div style={{ backgroundColor: secondaryColor, color: primaryColor }} className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                       <Sparkles size={24} />
                    </div>
                    <div>
                       <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Tratamiento</p>
                       <p className="font-black text-xl tracking-tight leading-tight">{selectedService?.name}</p>
                       <p className="text-[10px] text-[#D4AF37] font-bold mt-2 uppercase tracking-widest">${selectedService?.price} • {selectedService?.duration} MIN</p>
                    </div>
                 </div>
                 <div className="flex gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                       <User size={24} />
                    </div>
                    <div>
                       <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Especialista Master</p>
                       <p className="font-black text-xl tracking-tight leading-tight">{selectedPro?.name}</p>
                    </div>
                 </div>
                 <div className="flex gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                       <CalendarIcon size={24} />
                    </div>
                    <div>
                       <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Fecha de Operación</p>
                       <p className="font-black text-xl tracking-tight capitalize leading-tight">{selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
                       <p className="text-[#D4AF37] font-black text-2xl mt-1 tracking-tighter">{selectedTime}</p>
                    </div>
                 </div>
              </div>
              <div className="mt-12 pt-10 border-t border-white/5 flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/10">
                    <Heart size={20} fill="currentColor"/>
                 </div>
                 <p className="text-[9px] text-slate-500 font-bold leading-relaxed uppercase tracking-widest">Sincronización segura con infraestructura Aurum.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="animate-fade-in-up text-center py-24 max-w-2xl mx-auto">
      <div className="w-32 h-32 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-10 animate-bounce border-2 border-emerald-100 shadow-2xl">
         <CheckCircle2 size={64} />
      </div>
      <h2 className="text-5xl font-playfair font-black text-slate-900 mb-6 tracking-tighter">Reserva Confirmada</h2>
      <p className="text-slate-500 text-xl leading-relaxed mb-14 max-w-lg mx-auto">
        Gracias <strong>{clientDetails.name}</strong>, tu cita ha sido cifrada y guardada en nuestra red. Recibirás un mensaje de nuestro concierge en breve.
      </p>
      <div className="space-y-6">
        <Link to="/" className="block w-full py-6 bg-slate-900 text-white rounded-full font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-4">
            <Home size={20} /> Volver al Studio
        </Link>
        <button onClick={() => window.print()} className="block w-full py-6 bg-white border border-slate-100 text-slate-600 rounded-full font-black text-[12px] uppercase tracking-[0.4em] hover:bg-slate-50 transition-all">
            Descargar Certificado de Cita
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF9] pb-32">
      <nav className="bg-white/80 backdrop-blur-2xl border-b border-slate-100 h-24 sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-8 h-full flex items-center justify-between">
           <div className="flex items-center gap-6">
              {step > 1 && step < 5 && (
                <button 
                  onClick={() => setStep(step - 1)}
                  className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"
                >
                  <ChevronLeft size={28} />
                </button>
              )}
              <Link to="/" className="flex items-center gap-3">
                <div style={{ backgroundColor: primaryColor }} className="p-2 rounded-xl text-white shadow-lg">
                  <Sparkles size={24} />
                </div>
                <span className="font-black text-2xl tracking-tighter text-slate-900 uppercase">Cita<span style={{ color: primaryColor }}>Planner</span></span>
              </Link>
           </div>
           
           <div className="hidden md:flex items-center gap-12">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all duration-500 ${
                     step >= i ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-100 text-slate-300'
                   }`}>
                     {i}
                   </div>
                   <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${step >= i ? 'text-slate-900' : 'text-slate-300'}`}>
                     {i === 1 && 'Servicio'}
                     {i === 2 && 'Especialista'}
                     {i === 3 && 'Fecha'}
                     {i === 4 && 'Identidad'}
                   </span>
                </div>
              ))}
           </div>

           <div className="text-[10px] font-black text-slate-400 flex items-center gap-3 uppercase tracking-widest">
              <MapPin size={18} style={{ color: primaryColor }} />
              <span className="hidden sm:inline">Node CDMX Polanco</span>
           </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 pt-20">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </main>

      {step > 1 && step < 4 && (
        <div className="md:hidden fixed bottom-10 left-8 right-8 bg-[#1A1A1A] rounded-[2.5rem] p-8 text-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] animate-fade-in-up border border-white/5">
           <div className="flex justify-between items-center">
              <div>
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Tu Selección Elite</p>
                 <p className="font-black text-lg tracking-tight truncate max-w-[200px]">{selectedService?.name}</p>
                 {selectedPro && <p style={{ color: primaryColor }} className="text-[10px] font-bold uppercase tracking-widest mt-1">{selectedPro.name}</p>}
              </div>
              <div className="text-right">
                 <p className="font-black text-2xl tracking-tighter">${selectedService?.price}</p>
                 <p className="text-[9px] text-[#D4AF37] font-black uppercase tracking-widest">{selectedService?.duration} MIN</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
