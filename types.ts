

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export type Role = 'ADMIN' | 'PROFESSIONAL' | 'CLIENT' | 'SUPERADMIN';
export type TemplateId = 'citaplanner' | 'beauty' | 'dentist' | 'barber';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  cloudflareId?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
  planType: 'FREE' | 'PRO' | 'ELITE';
  createdAt: string;
}

export interface OperatingHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface BusinessRule {
  id: string;
  label: string;
  value: string;
  enabled: boolean;
}

export interface HeroSlide {
  image: string;
  title: string;
  subtitle: string;
  text: string;
}

export interface LandingStat {
  value: string;
  label: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  avatar?: string;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  whatsapp?: string;
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
  operatingHours?: OperatingHours[];
  businessRules?: BusinessRule[];
  heroSlides?: HeroSlide[];
  stats?: LandingStat[];
  maintenanceMode?: boolean;
  showWhatsappButton?: boolean;
  socialLinks?: SocialLinks;
  testimonials?: Testimonial[];
  gallery?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  latitude?: string;
  longitude?: string;
  googleMapsUrl?: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: Role;
  tenantId: string;
  relatedId?: string;
  avatar?: string;
  preferences?: NotificationPreferences;
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
  tenantId: string;
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
  tenantId: string;
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
  tenantId: string;
  batchNumber?: string;
  expiryDate?: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  status: 'ACTIVE' | 'INACTIVE';
  tenantId: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  date: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  user: string;
  tenantId: string;
}

export interface NotificationPreferences {
  whatsapp: boolean;
  sms: boolean;
  email: boolean;
}

export interface AIParsedAppointment {
  title: string;
  startDateTime: string;
  endDateTime: string;
  clientName?: string;
  clientPhone?: string;
  description?: string;
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
  tenantId: string;
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  email: string;
  birthDate?: string;
  serviceIds?: string[];
  weeklySchedule: ProfessionalScheduleDay[];
  exceptions: ScheduleException[];
  tenantId: string;
}

export interface ProfessionalScheduleDay {
  dayOfWeek: number;
  isEnabled: boolean;
  slots: ScheduleSlot[];
}

export interface ScheduleSlot {
  start: string;
  end: string;
}

// Added ExceptionType export to fix error in SchedulesPage.tsx
export type ExceptionType = 'VACATION' | 'HOLIDAY' | 'UNAVAILABLE';

export interface ScheduleException {
  id: string;
  startDate: string;
  endDate: string;
  // Updated type to use the exported ExceptionType
  type: ExceptionType;
  description?: string;
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
