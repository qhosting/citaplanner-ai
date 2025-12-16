import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, 
  CheckCircle2, User, Sparkles, MapPin, ArrowRight, Loader2, Home
} from 'lucide-react';
import { Professional, Service, Appointment, AppointmentStatus } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

// --- HELPERS ---
const generateTimeSlots = (date: Date, professional: Professional, serviceDuration: number): string[] => {
  const dayOfWeek = date.getDay(); // 0-6
  const schedule = professional.weeklySchedule.find(d => d.dayOfWeek === dayOfWeek);

  if (!schedule || !schedule.isEnabled) return [];

  // Check exceptions (Simplified logic: checks if date is strictly inside an exception range)
  // En producción, esto debería comparar fechas completas (día, mes, año) ignorando hora si es tipo día completo
  const isBlocked = professional.exceptions.some(exc => {
    const start = new Date(exc.startDate);
    const end = new Date(exc.endDate);
    
    // Normalizar a medianoche para comparar fechas
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

    // Bucle para generar slots
    while (current.getTime() + serviceDuration * 60000 <= endTime.getTime()) {
      slots.push(current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
      // Incremento fijo de 30 minutos para opciones de inicio, independientemente de la duración
      current.setMinutes(current.getMinutes() + 30);
    }
  });

  return slots;
};

// --- COMPONENT ---
export const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Data State
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
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

  // Init Data
  useEffect(() => {
    const loadData = async () => {
        try {
            const [s, p] = await Promise.all([
                api.getServices(),
                api.getProfessionals()
            ]);
            setServices(s);
            setProfessionals(p);
        } catch (error) {
            console.error("Error loading booking data", error);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, []);

  // Filtrar profesionales que realizan el servicio seleccionado
  const availablePros = useMemo(() => {
    if (!selectedService) return [];
    return professionals.filter(p => p.serviceIds?.includes(selectedService.id));
  }, [selectedService, professionals]);

  // Generar slots disponibles
  const availableSlots = useMemo(() => {
    if (!selectedPro || !selectedService) return [];
    return generateTimeSlots(selectedDate, selectedPro, selectedService.duration);
  }, [selectedDate, selectedPro, selectedService]);

  const handleDateChange = (daysToAdd: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + daysToAdd);
    // Prevent going to past (allow today)
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
      description: clientDetails.notes || 'Reserva Web',
      status: AppointmentStatus.SCHEDULED,
      professionalId: selectedPro.id,
      serviceId: selectedService.id
    };

    const result = await api.createAppointment(newAppointment);
    
    setSubmitting(false);
    if(result) {
        setStep(5);
    } else {
        alert("Hubo un error al procesar tu reserva. Intenta de nuevo.");
    }
  };

  const resetBooking = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedPro(null);
    setSelectedDate(new Date());
    setSelectedTime(null);
    setClientDetails({
      name: '',
      email: '',
      phone: '',
      notes: ''
    });
  };

  if(loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <Loader2 className="animate-spin text-indigo-600" size={32}/>
          </div>
      );
  }

  // --- RENDER STEPS ---

  // STEP 1: Servicios
  const renderStep1 = () => (
    <div className="animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Selecciona un Servicio</h2>
        <Link to="/" className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1">
            <Home size={16} /> Volver al Inicio
        </Link>
      </div>
      
      {services.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
              No hay servicios disponibles en este momento.
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map(service => (
            <button
                key={service.id}
                onClick={() => { setSelectedService(service); setStep(2); }}
                className="text-left p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-500 hover:shadow-md hover:bg-indigo-50/30 transition-all group"
            >
                <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-slate-800 group-hover:text-indigo-700">{service.name}</h3>
                <span className="font-bold text-slate-900">${service.price}</span>
                </div>
                <p className="text-sm text-slate-500 mb-3 line-clamp-2">{service.description}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <Clock size={14} />
                {service.duration} min
                </div>
            </button>
            ))}
        </div>
      )}
    </div>
  );

  // STEP 2: Profesionales
  const renderStep2 = () => (
    <div className="animate-fade-in-up">
      <button onClick={() => setStep(1)} className="text-sm text-slate-500 hover:text-indigo-600 mb-6 flex items-center gap-1">
        <ChevronLeft size={16} /> Volver a servicios
      </button>
      
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-slate-200">
         <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
             <CheckCircle2 size={20} />
         </div>
         <div>
             <p className="text-xs text-slate-500 uppercase font-bold">Servicio Seleccionado</p>
             <p className="font-medium text-slate-800">{selectedService?.name}</p>
         </div>
      </div>

      <h2 className="text-xl font-bold text-slate-800 mb-6">Elige un Profesional</h2>
      
      {availablePros.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
          <p className="text-slate-500">No hay profesionales disponibles para este servicio actualmente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {availablePros.map(pro => (
             <button
              key={pro.id}
              onClick={() => { setSelectedPro(pro); setStep(3); }}
              className="text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-500 hover:shadow-md transition-all flex flex-col items-center text-center group"
             >
               <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-500 text-xl font-bold group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                 {pro.name.charAt(0)}
               </div>
               <h3 className="font-semibold text-slate-800">{pro.name}</h3>
               <p className="text-xs text-slate-500">{pro.role}</p>
             </button>
           ))}
        </div>
      )}
    </div>
  );

  // STEP 3: Fecha y Hora
  const renderStep3 = () => (
    <div className="animate-fade-in-up">
      <button onClick={() => setStep(2)} className="text-sm text-slate-500 hover:text-indigo-600 mb-6 flex items-center gap-1">
        <ChevronLeft size={16} /> Volver a profesionales
      </button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Calendario Simple */}
        <div>
          <h3 className="font-bold text-slate-800 mb-4">Selecciona Fecha</h3>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm inline-block w-full">
            <div className="flex justify-between items-center mb-4">
               <button onClick={() => handleDateChange(-1)} className="p-1 hover:bg-slate-100 rounded">
                 <ChevronLeft size={20} />
               </button>
               <div className="font-semibold text-slate-800 capitalize">
                 {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
               </div>
               <button onClick={() => handleDateChange(1)} className="p-1 hover:bg-slate-100 rounded">
                 <ChevronRight size={20} />
               </button>
            </div>
            {/* Visual representation of current date */}
            <div className="text-center py-8 bg-indigo-50 rounded-lg border border-indigo-100">
              <span className="block text-5xl font-bold text-indigo-600">{selectedDate.getDate()}</span>
              <span className="block text-sm text-indigo-400 uppercase font-bold mt-2">
                {selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Slots */}
        <div>
          <h3 className="font-bold text-slate-800 mb-4">Horarios Disponibles</h3>
          {availableSlots.length === 0 ? (
             <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 bg-white">
               No hay disponibilidad para esta fecha. <br/>
               <span className="text-xs">Prueba seleccionando otro día.</span>
             </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 max-h-[350px] overflow-y-auto pr-2">
              {availableSlots.map(slot => (
                <button
                  key={slot}
                  onClick={() => setSelectedTime(slot)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    selectedTime === slot 
                      ? 'bg-indigo-600 text-white shadow-md transform scale-105' 
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-400 hover:text-indigo-600'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 flex justify-end">
        <button 
          disabled={!selectedTime}
          onClick={() => setStep(4)}
          className="bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-lg shadow-slate-200"
        >
          Continuar <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );

  // STEP 4: Detalles y Confirmación
  const renderStep4 = () => (
    <div className="animate-fade-in-up">
      <button onClick={() => setStep(3)} className="text-sm text-slate-500 hover:text-indigo-600 mb-6 flex items-center gap-1">
        <ChevronLeft size={16} /> Volver a horarios
      </button>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Resumen */}
        <div className="md:col-span-1">
           <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl border border-indigo-100 shadow-sm sticky top-24">
             <h3 className="font-bold text-indigo-900 mb-6 border-b border-indigo-200 pb-2">Resumen de Cita</h3>
             
             <div className="space-y-5">
               <div>
                 <p className="text-xs text-indigo-400 font-bold uppercase mb-1">Servicio</p>
                 <p className="font-medium text-slate-800">{selectedService?.name}</p>
                 <p className="text-sm text-indigo-600 font-bold">${selectedService?.price}</p>
               </div>
               <div>
                 <p className="text-xs text-indigo-400 font-bold uppercase mb-1">Profesional</p>
                 <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-200 rounded-full flex items-center justify-center text-xs font-bold text-indigo-700">
                        {selectedPro?.name.charAt(0)}
                    </div>
                    <p className="font-medium text-slate-800 text-sm">{selectedPro?.name}</p>
                 </div>
               </div>
               <div>
                 <p className="text-xs text-indigo-400 font-bold uppercase mb-1">Fecha y Hora</p>
                 <p className="font-medium text-slate-800 capitalize">
                   {selectedDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long' })}
                 </p>
                 <p className="text-xl font-bold text-indigo-600 mt-1">{selectedTime}</p>
               </div>
               <div className="pt-4 border-t border-indigo-100">
                 <div className="flex items-center gap-2 text-slate-500 text-xs">
                   <MapPin size={14} />
                   <span>Av. Principal 123, Ciudad de México</span>
                 </div>
               </div>
             </div>
           </div>
        </div>

        {/* Formulario */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Tus Datos de Contacto</h2>
            <form onSubmit={handleBooking} className="space-y-5">
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input
                    required
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    value={clientDetails.name}
                    onChange={(e) => setClientDetails({...clientDetails, name: e.target.value})}
                />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                    required
                    type="email"
                    placeholder="juan@ejemplo.com"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    value={clientDetails.email}
                    onChange={(e) => setClientDetails({...clientDetails, email: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono Móvil</label>
                    <input
                    required
                    type="tel"
                    placeholder="+52 55 1234 5678"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    value={clientDetails.phone}
                    onChange={(e) => setClientDetails({...clientDetails, phone: e.target.value})}
                    />
                    <p className="text-xs text-slate-400 mt-1">Para enviar confirmación vía WhatsApp/SMS.</p>
                </div>
                </div>
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notas Adicionales (Opcional)</label>
                <textarea
                    placeholder="Alergias, preferencias o detalles importantes..."
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24 resize-none transition-all"
                    value={clientDetails.notes}
                    onChange={(e) => setClientDetails({...clientDetails, notes: e.target.value})}
                ></textarea>
                </div>

                <button 
                type="submit"
                disabled={submitting}
                className="w-full bg-slate-900 text-white py-4 rounded-lg font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 mt-4 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                {submitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
                {submitting ? 'Confirmando...' : 'Confirmar Reserva'}
                </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  // STEP 5: Success
  const renderStep5 = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-scale-in">
      <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <CheckCircle2 size={48} />
      </div>
      <h2 className="text-3xl font-bold text-slate-900 mb-4">¡Reserva Confirmada!</h2>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-md w-full mb-8 text-left">
          <div className="space-y-3">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Servicio:</span>
                  <span className="font-medium text-slate-800">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Fecha:</span>
                  <span className="font-medium text-slate-800">{selectedDate.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Hora:</span>
                  <span className="font-medium text-slate-800">{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                  <span className="text-slate-500">Profesional:</span>
                  <span className="font-medium text-slate-800">{selectedPro?.name}</span>
              </div>
          </div>
      </div>
      <p className="text-slate-500 max-w-md mx-auto mb-8">
        Hemos enviado un correo de confirmación a <strong>{clientDetails.email}</strong> y un mensaje a tu WhatsApp.
      </p>
      
      <div className="flex gap-4">
        <button onClick={resetBooking} className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium">
          Reservar otra cita
        </button>
        <Link to="/" className="px-6 py-3 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium">
          Volver al Inicio
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Public Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl text-indigo-600 tracking-tight">
            <CalendarIcon className="h-6 w-6" />
            <span>CitaPlanner</span>
          </div>
          {step < 5 && (
             <div className="flex items-center gap-2">
                 <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                     <div 
                        className="h-full bg-indigo-600 transition-all duration-500" 
                        style={{ width: `${(step / 4) * 100}%` }}
                     />
                 </div>
                 <span className="text-xs text-slate-500 font-medium">
                    Paso {step} de 4
                 </span>
             </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </main>
    </div>
  );
};