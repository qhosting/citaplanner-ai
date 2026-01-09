
export type Role = 'SUPERADMIN' | 'ADMIN' | 'PROFESSIONAL' | 'CLIENT';

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export interface AIParsedAppointment {
  title: string;
  startDateTime: string;
  endDateTime: string;
  clientName?: string;
  clientPhone?: string;
  description?: string;
}

export interface Appointment {
  id: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  clientName: string;
  clientPhone: string;
  description?: string;
  status: AppointmentStatus;
  professionalId?: string;
  serviceId?: string;
  tenantId: string;
}

export interface NotificationPreferences {
  whatsapp: boolean;
  sms: boolean;
  email: boolean;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: Role;
  avatar?: string;
  tenantId?: string;
  relatedId?: string;
  preferences?: NotificationPreferences;
  loyalty_points?: number;
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
  phone: string;
  email?: string;
  birthDate?: string;
  skinType?: string;
  allergies?: string;
  medicalConditions?: string;
  notes?: string;
  consentAccepted?: boolean;
  consentDate?: string;
  consentType?: string;
  treatmentHistory: TreatmentRecord[];
  tenantId?: string;
  loyalty_points?: number;
}

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
  category: string;
  status: 'ACTIVE' | 'INACTIVE';
  imageUrl?: string;
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
  batchNumber?: string;
  expiryDate?: string;
  tenantId?: string;
}

export interface InventoryMovement {
  id: string;
  date: string;
  productName: string;
  type: 'IN' | 'OUT';
  quantity: number;
  reason: string;
  user: string;
  tenantId?: string;
}

export interface WeeklySchedule {
  dayOfWeek: number;
  isEnabled: boolean;
  slots: { start: string; end: string }[];
}

export type ExceptionType = 'UNAVAILABLE' | 'VACATION' | 'HOLIDAY';

export interface ScheduleException {
  id: string;
  startDate: string;
  endDate: string;
  type: ExceptionType;
  description?: string;
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  email: string;
  birthDate?: string;
  weeklySchedule: WeeklySchedule[];
  exceptions: ScheduleException[];
  serviceIds?: string[];
  tenantId?: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  status: 'ACTIVE' | 'INACTIVE';
  tenantId?: string;
}

export type TemplateId = 'beauty' | 'medical' | 'spa';

export interface HeroSlide {
  image: string;
  title: string;
  subtitle: string;
  text: string;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string;
}

export interface LandingSettings {
  businessName: string;
  primaryColor: string;
  secondaryColor?: string;
  templateId?: TemplateId;
  slogan?: string;
  aboutText?: string;
  address?: string;
  contactPhone?: string;
  heroSlides?: HeroSlide[];
  stats?: any[];
  socialLinks?: SocialLinks;
  testimonials?: any[];
  gallery?: any[];
  showWhatsappButton?: boolean;
  logoUrl?: string;
  maintenanceMode?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  latitude?: string;
  longitude?: string;
  googleMapsUrl?: string;
  customDomain?: string;
  subdomain?: string;
}

export interface OperatingHours {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export type MarketingChannel = 'EMAIL' | 'WHATSAPP' | 'SMS';

export interface Campaign {
  id: string;
  name: string;
  channel: MarketingChannel;
  status: 'DRAFT' | 'SENT' | 'SCHEDULED';
  content: string;
  targetSegment: 'ALL' | 'ACTIVE_LAST_30_DAYS' | 'INACTIVE_90_DAYS';
  sentCount?: number;
  subject?: string;
  tenantId?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  isActive: boolean;
  triggerType: 'APPOINTMENT_COMPLETED' | 'CLIENT_INACTIVE' | 'BIRTHDAY';
  delayHours: number;
  channel: MarketingChannel;
  templateMessage: string;
  tenantId?: string;
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

// --- AURUM MASTER HUB INTEGRATION TYPES ---

export interface AurumClientPayload {
  commercialName: string;
  email: string;
  phone: string;
  rfc?: string;
  taxRegime?: string;
  postalCode?: string;
}

export interface AurumServicePayload {
  sku: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

export interface AurumCheckoutPayload {
  amount: number;
  currency: string;
  description: string;
  clientReference?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface AurumCheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

export interface AurumResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
