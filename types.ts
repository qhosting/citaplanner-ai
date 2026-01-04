

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export type Role = 'ADMIN' | 'PROFESSIONAL' | 'CLIENT';
export type TemplateId = 'citaplanner' | 'beauty' | 'dentist' | 'barber';

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface LandingSettings {
  businessName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  templateId: TemplateId;
  slogan: string;
  aboutText: string;
  heroImageUrl?: string;
  contactPhone?: string;
  address?: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
  relatedId?: string;
  avatar?: string;
  preferences?: NotificationPreferences;
  branchId?: string;
}

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
  category: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Appointment {
  id: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  clientName?: string;
  clientPhone?: string;
  status: AppointmentStatus;
  professionalId?: string;
  serviceId?: string;
  description?: string;
  branchId?: string;
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  email: string;
  serviceIds?: string[];
  weeklySchedule: any[];
  exceptions: ScheduleException[];
  birthDate?: string;
}

export interface TreatmentRecord {
  id: string;
  date: string;
  serviceName: string;
  notes: string;
  pigmentsUsed?: string;
  needleType?: string;
  aftercareInstructions?: string;
  professionalName: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  birthDate?: string;
  skinType?: string;
  allergies?: string;
  medicalConditions?: string;
  treatmentHistory: TreatmentRecord[];
}

export interface AIParsedAppointment {
  title: string;
  startDateTime: string;
  endDateTime: string;
  clientName?: string;
  clientPhone?: string;
  description?: string;
}

export interface NotificationPreferences {
  whatsapp: boolean;
  sms: boolean;
  email: boolean;
}

export type MarketingChannel = 'EMAIL' | 'WHATSAPP' | 'SMS';

export interface Campaign {
  id: string;
  name: string;
  channel: MarketingChannel;
  status: 'DRAFT' | 'SENT';
  content: string;
  targetSegment: 'ALL' | 'ACTIVE_LAST_30_DAYS' | 'INACTIVE_90_DAYS';
  sentCount?: number;
  subject?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  isActive: boolean;
  triggerType: 'APPOINTMENT_COMPLETED' | 'CLIENT_INACTIVE' | 'BIRTHDAY';
  delayHours: number;
  channel: MarketingChannel;
  templateMessage: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  status: 'ACTIVE' | 'INACTIVE';
  usage: 'RETAIL' | 'INTERNAL';
}

export type ExceptionType = 'VACATION' | 'HOLIDAY' | 'UNAVAILABLE';

export interface ScheduleException {
  id: string;
  startDate: string;
  endDate: string;
  type: ExceptionType;
  description?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'PRODUCT' | 'SERVICE';
  discount: number;
  sku?: string;
}

export type PaymentMethod = 'CASH' | 'SPEI';

// Fase 1: Nuevos Tipos
export interface Transaction {
  id: string;
  date: string;
  clientName: string;
  total: number;
  paymentMethod: PaymentMethod;
  items: CartItem[];
  status: 'PAID' | 'REFUNDED';
}

export interface InventoryMovement {
  id: string;
  productId: string;
  date: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  user: string;
}