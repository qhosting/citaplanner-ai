
export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export type Role = 'ADMIN' | 'PROFESSIONAL' | 'CLIENT';
export type TemplateId = 'citaplanner' | 'beauty' | 'dentist' | 'barber';

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

// --- INFRAESTRUCTURA DE ECOSISTEMA ---
export interface WahaConfig {
  serverUrl: string;
  sessionId: string;
  apiToken: string;
}

export interface N8NConfig {
  webhookUrl: string;
  apiKey: string;
}

export interface OdooConfig {
  host: string;
  db: string;
  username: string;
  apiKey: string;
}

export interface AiCoreConfig {
  model: string;
  creativity: number;
  tone: 'sophisticated' | 'friendly' | 'minimalist';
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
  waha?: WahaConfig;
  n8n?: N8NConfig;
  odoo?: OdooConfig;
  aiCore?: AiCoreConfig;
  maintenanceMode?: boolean;
  showWhatsappButton?: boolean;
  // Nuevos campos
  socialLinks?: SocialLinks;
  testimonials?: Testimonial[];
  gallery?: string[];
  // SEO & GEO
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
  // Campos de Consentimiento
  consentAccepted?: boolean;
  consentDate?: string;
  consentType?: string; 
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
  batchNumber?: string;
  expiryDate?: string;
}

export type ExceptionType = 'VACATION' | 'HOLIDAY' | 'UNAVAILABLE';

export interface ScheduleException {
  id: string;
  startDate: string;
  endDate: string;
  type: ExceptionType;
  description?: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  status: 'ACTIVE' | 'INACTIVE';
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
  productName: string;
  date: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  user: string;
}

export interface AIParsedAppointment {
  title: string;
  startDateTime: string;
  endDateTime: string;
  clientName?: string;
  clientPhone?: string;
  description?: string;
}
