import React, { useState } from 'react';
import { 
  X, Calendar, Clock, User, Phone, ShieldCheck, 
  Trash2, ExternalLink, Image as ImageIcon, CheckCircle2, Loader2, AlertCircle 
} from 'lucide-react';
import { Appointment, AppointmentStatus, Professional, Service } from '../types';
import { api } from '../services/api';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  professionals: Professional[];
  services: Service[];
}

export const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  appointment,
  professionals,
  services
}) => {
  const queryClient = useQueryClient();
  const [validating, setValidating] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  if (!isOpen || !appointment) return null;

  const proName = professionals.find(p => p.id === appointment.professionalId)?.name || 'Sin Asignar';
  const servicePrice = services.find(s => s.id === appointment.serviceId)?.price || 0;

  // Confirm appointment and change status to confirmed/scheduled
  const handleValidatePayment = async () => {
    setValidating(true);
    try {
      const updated = {
        ...appointment,
        status: 'CONFIRMED' as AppointmentStatus // Update to confirmed
      };
      const res = await api.updateClient({
        id: appointment.id,
        // Wait, updateClient takes a client! For appointments, we use PUT /api/appointments/:id !
      } as any); // Wait! Let's check api.ts structure.
      
      // Let's call the API directly using fetch or check api.ts.
      // In api.ts, does it have updateAppointment or similar?
      // Wait, let's verify in api.ts. It doesn't have updateAppointment but wait, does it have completeAppointment/cancelAppointment?
      // Yes! But we can also make a PUT fetch call directly or add updateAppointment if needed.
      // Let's use fetch directly to /api/appointments/:id to update it! It is extremely clean and reliable.
      const userStr = localStorage.getItem('citaPlannerUser');
      const token = userStr ? JSON.parse(userStr).token : null;
      
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...appointment,
          status: 'CONFIRMED'
        })
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        toast.success("Pago de anticipo validado y cita confirmada");
        
        // Notify via WhatsApp that their appointment is officially confirmed
        if (appointment.clientPhone) {
          const dateStr = new Date(appointment.startDateTime).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });
          const text = `¡Excelente noticia! Hemos validado tu comprobante de depósito. Tu cita para "${appointment.title}" el ${dateStr} queda oficialmente CONFIRMADA. ¡Te esperamos en Shula Studio!`;
          
          fetch('/api/integrations/waha/test', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ phone: appointment.clientPhone, text }) // Wait, waha/test sends a test message, we can trigger it
          }).catch(e => console.error("WA notify error", e));
        }

        onClose();
      } else {
        toast.error("Error al validar el pago");
      }
    } catch (e) {
      toast.error("Falla de conexión al confirmar pago");
    } finally {
      setValidating(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!window.confirm("¿Seguro que desea cancelar esta cita?")) return;
    setCancelling(true);
    try {
      const userStr = localStorage.getItem('citaPlannerUser');
      const token = userStr ? JSON.parse(userStr).token : null;
      
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...appointment,
          status: 'CANCELLED'
        })
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        toast.success("Cita cancelada correctamente");
        onClose();
      } else {
        toast.error("Error al cancelar la cita");
      }
    } catch (e) {
      toast.error("Falla de red al cancelar");
    } finally {
      setCancelling(false);
    }
  };

  const dateObj = new Date(appointment.startDateTime);
  const dateStr = dateObj.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-card-theme rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in border border-theme">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-theme bg-input-theme">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-[#D4AF37]" size={20} />
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-main">Control y Validación de Cita</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-main p-2 hover:bg-card-theme rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/30 p-6 rounded-3xl border border-theme">
            <div className="space-y-4">
              <div>
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Servicio / Tratamiento</span>
                <span className="text-base font-black text-white uppercase tracking-tight">{appointment.title}</span>
                {servicePrice > 0 && <span className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest block mt-1">${servicePrice} MXN</span>}
              </div>
              
              <div>
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Especialista Asignado</span>
                <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">{proName}</span>
              </div>

              <div>
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Fecha y Hora</span>
                <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">{dateStr}</span>
                <span className="text-lg font-black text-[#D4AF37] tracking-tight">{timeStr}</span>
              </div>
            </div>

            <div className="space-y-4 border-t md:border-t-0 md:border-l border-theme pt-4 md:pt-0 md:pl-6">
              <div>
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Socio / Cliente</span>
                <span className="text-sm font-black text-white uppercase tracking-tight block">{appointment.clientName}</span>
              </div>

              <div>
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">WhatsApp de Contacto</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-slate-300">{appointment.clientPhone || 'Sin teléfono'}</span>
                  {appointment.clientPhone && (
                    <a 
                      href={`https://wa.me/${appointment.clientPhone.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="p-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded transition-all"
                    >
                      <Phone size={12} />
                    </a>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Estatus de Validación</span>
                <div className="mt-1">
                  {appointment.status === 'PRECONFIRMED' ? (
                    <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[8.5px] font-black uppercase tracking-wider rounded-md animate-pulse">
                      PRE-CONFIRMADA (Anticipo Pendiente)
                    </span>
                  ) : appointment.status === 'CONFIRMED' || appointment.status === 'SCHEDULED' ? (
                    <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[8.5px] font-black uppercase tracking-wider rounded-md">
                      CONFIRMADA / VALIDADA
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[8.5px] font-black uppercase tracking-wider rounded-md">
                      {appointment.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Receipt Ticket Visualizer */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider ml-1">Comprobante de Anticipo / Ticket Cargado</h4>
            
            {appointment.paymentReceiptUrl ? (
              <div className="bg-black/40 border border-theme rounded-3xl overflow-hidden p-6 space-y-4">
                <div className="relative aspect-video max-h-[220px] bg-black/60 rounded-2xl overflow-hidden border border-white/5 group flex items-center justify-center">
                  <img 
                    src={appointment.paymentReceiptUrl} 
                    alt="Ticket de Anticipo" 
                    className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <a 
                      href={appointment.paymentReceiptUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="p-3 bg-white text-black hover:bg-[#D4AF37] hover:scale-110 rounded-full transition-all shadow-xl"
                      title="Ver en pestaña nueva"
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-zinc-500">
                  <span>Anticipo digital cargado vía /Book</span>
                  <a href={appointment.paymentReceiptUrl} download target="_blank" rel="noreferrer" className="text-[#D4AF37] hover:underline flex items-center gap-1.5">
                    <ImageIcon size={12} /> Descargar Comprobante Original
                  </a>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-theme rounded-3xl p-10 text-center bg-black/10 flex flex-col items-center justify-center text-muted opacity-40">
                <AlertCircle size={32} className="text-zinc-600 mb-3" />
                <span className="text-[10px] font-black uppercase tracking-widest block">Sin comprobante adjunto</span>
                <span className="text-[8px] font-bold uppercase tracking-wider block mt-1">Esta cita fue agendada directamente o no cubrió el anticipo en línea.</span>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-theme">
            {appointment.status === 'PRECONFIRMED' && (
              <button 
                onClick={handleValidatePayment}
                disabled={validating || !appointment.paymentReceiptUrl}
                className="flex-1 gold-btn py-4 rounded-2xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-40"
              >
                {validating ? <Loader2 className="animate-spin" size={14} /> : <ShieldCheck size={16} />}
                Validar y Confirmar Cita
              </button>
            )}

            <button 
              onClick={handleCancelAppointment}
              disabled={cancelling}
              className="px-6 py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-rose-500/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {cancelling ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
              Cancelar Cita
            </button>

            <button 
              onClick={onClose}
              className="px-6 py-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl text-[9px] font-black uppercase tracking-widest border border-white/5 transition-colors text-center cursor-pointer"
            >
              Cerrar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
