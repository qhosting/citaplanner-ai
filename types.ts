export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export type Role = 'ADMIN' | 'PROFESSIONAL' | 'CLIENT';

export interface NotificationPreferences {
  whatsapp: boolean;
  sms: boolean;
  email: boolean;
}

export interface User {
  id: string;
  name: string;
  phone: string; // Used as login ID
  role: Role;
  relatedId?: string; // ID del Profesional o Cliente asociado
  avatar?: string;
  preferences?: NotificationPreferences;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  birthDate?: string; // ISO Date String YYYY-MM-DD
  userId?: string; // Link to auth user
  preferences?: NotificationPreferences;
}

export interface Service {
  id: string;
  name: string;
  duration: number; // en minutos
  price: number;
  description?: string;
  category: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Appointment {
  id: string;
  title: string;
  startDateTime: string; // ISO String
  endDateTime: string;   // ISO String
  clientId?: string;
  clientName?: string;   // For display/AI purposes
  clientPhone?: string;  // For notifications (WAHA/LabsMobile)
  description?: string;
  status: AppointmentStatus;
  professionalId?: string;
  serviceId?: string;
}

export interface AIParsedAppointment {
  title: string;
  startDateTime: string;
  endDateTime: string;
  clientName?: string;
  clientPhone?: string;
  description?: string;
}

// Módulo de Inventario
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number; // Precio de venta
  cost: number;  // Costo de adquisición
  stock: number;
  minStock: number; // Punto de reorden
  status: 'ACTIVE' | 'INACTIVE';
}

// Nuevo: Módulo de Horarios
export interface TimeSlot {
  start: string; // Formato "HH:mm"
  end: string;   // Formato "HH:mm"
}

export interface DailySchedule {
  dayOfWeek: number; // 0 (Domingo) - 6 (Sábado)
  isEnabled: boolean;
  slots: TimeSlot[]; // Array para permitir turnos partidos (ej: 9-13 y 15-19)
}

export type ExceptionType = 'VACATION' | 'HOLIDAY' | 'UNAVAILABLE';

export interface ScheduleException {
  id: string;
  startDate: string; // ISO Date String
  endDate: string;   // ISO Date String
  type: ExceptionType;
  description?: string;
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  email: string;
  birthDate?: string; // ISO Date String YYYY-MM-DD
  weeklySchedule: DailySchedule[];
  exceptions: ScheduleException[];
  serviceIds?: string[]; // IDs de servicios que puede realizar
  userId?: string; // Link to auth user
}

// --- POS TYPES ---

export type PaymentMethod = 'CASH' | 'SPEI' | 'CARD';

export interface CartItem {
  id: string; // Product ID or Service ID
  name: string;
  price: number;
  quantity: number;
  type: 'PRODUCT' | 'SERVICE';
  discount: number; // Porcentaje 0-100
  sku?: string; // Solo productos
}

export interface Sale {
  id: string;
  date: string;
  total: number;
  subtotal: number;
  discountTotal: number;
  paymentMethod: PaymentMethod;
  clientName?: string;
  items: CartItem[];
}

// --- MARKETING TYPES ---

export type MarketingChannel = 'EMAIL' | 'WHATSAPP' | 'SMS';
export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENT';

export interface Campaign {
  id: string;
  name: string;
  channel: MarketingChannel;
  subject?: string; // Solo para Email
  content: string;
  targetSegment: 'ALL' | 'ACTIVE_LAST_30_DAYS' | 'INACTIVE_90_DAYS';
  status: CampaignStatus;
  sentCount?: number;
  scheduledDate?: string;
}

export type AutomationTriggerType = 'APPOINTMENT_COMPLETED' | 'CLIENT_INACTIVE' | 'BIRTHDAY';

export interface AutomationRule {
  id: string;
  name: string;
  isActive: boolean;
  triggerType: AutomationTriggerType;
  delayHours?: number; // Retraso antes de enviar (ej: 2 horas después de la cita)
  channel: MarketingChannel;
  templateMessage: string;
}