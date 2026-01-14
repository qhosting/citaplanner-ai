
export type Role = 'SUPERADMIN' | 'ADMIN' | 'PROFESSIONAL' | 'CLIENT';

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export interface BridgeSettings {
  enabled: boolean;
  webhookUrl: string;
  apiKey: string;
  satelliteId: number;
}

export interface LandingSettings {
  businessName: string;
  primaryColor: string;
  secondaryColor?: string;
  templateId?: 'beauty' | 'medical' | 'spa';
  slogan?: string;
  aboutText?: string;
  address?: string;
  contactPhone?: string;
  logoUrl?: string;
  maintenanceMode?: boolean;
  subdomain?: string;
  bridge?: BridgeSettings;
  // Added properties for LandingSettings
  heroSlides?: Array<{ image: string; title: string; subtitle: string; text: string; }>;
  stats?: Array<{ label: string; value: string; }>;
  socialLinks?: { instagram?: string; facebook?: string; twitter?: string; linkedin?: string; };
  testimonials?: Array<{ name: string; text: string; rating: number; }>;
  gallery?: string[];
  showWhatsappButton?: boolean;
  googleMapsUrl?: string;
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  email: string;
  aurum_employee_id?: string; // ID para sincronización con nómina de Holding
  weeklySchedule: any[];
  exceptions: any[];
  serviceIds?: string[];
  tenantId?: string;
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
  tenantId?: string;
  // Added traceability fields
  batchNumber?: string;
  expiryDate?: string;
}

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: string;
  status: 'ACTIVE' | 'INACTIVE';
  tenantId?: string;
  // Added description and imageUrl
  description: string;
  imageUrl?: string;
}

export interface Appointment {
  id: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  clientName: string;
  clientPhone: string;
  status: AppointmentStatus;
  professionalId?: string;
  serviceId?: string;
  tenantId: string;
  description?: string;
}

export interface NotificationPreferences {
  whatsapp: boolean;
  sms: boolean;
  email: boolean;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
  token?: string;
  tenantId?: string;
  avatar?: string;
  preferences?: NotificationPreferences;
  relatedId?: string;
  email?: string;
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

export type PaymentMethod = 'CASH' | 'SPEI' | 'CARD';

// Added missing AIParsedAppointment
export interface AIParsedAppointment {
  title: string;
  startDateTime: string;
  endDateTime: string;
  clientName?: string;
  clientPhone?: string;
  description?: string;
}

// Added missing TreatmentRecord
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

// Added missing Client
export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  consentAccepted?: boolean;
  consentDate?: string;
  consentType?: string;
  skinType?: string;
  allergies?: string;
  medicalConditions?: string;
  notes?: string;
  birthDate?: string;
  treatmentHistory: TreatmentRecord[];
}

// Added missing InventoryMovement
export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  date: string;
  reason: string;
  user: string;
}

// Added missing ExceptionType and ScheduleException
export enum ExceptionType {
  VACATION = 'VACATION',
  SICKNESS = 'SICKNESS',
  PERSONAL = 'PERSONAL',
  OTHER = 'OTHER'
}

export interface ScheduleException {
  id: string;
  startDate: string;
  endDate: string;
  type: ExceptionType;
  note?: string;
}

// Added missing Marketing types
export type MarketingChannel = 'EMAIL' | 'WHATSAPP' | 'SMS';

export interface Campaign {
  id: string;
  name: string;
  channel: MarketingChannel;
  targetSegment: string;
  content: string;
  subject?: string;
  status: 'DRAFT' | 'SENT';
  sentCount?: number;
}

export interface AutomationRule {
  id: string;
  name: string;
  isActive: boolean;
  delayHours: number;
  channel: MarketingChannel;
  templateMessage: string;
}

// Added missing Branch
export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  status: 'ACTIVE' | 'INACTIVE';
  tenantId?: string;
}

// Added missing Aurum Connector types
export interface AurumClientPayload {
  commercialName: string;
  email: string;
  phone: string;
  postalCode: string;
}

export interface AurumCheckoutPayload {
  clientId: string;
  planId: string;
  amount: number;
  currency: string;
}

export interface AurumCheckoutResponse {
  checkoutUrl: string;
  orderId: string;
}

export interface AurumResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
