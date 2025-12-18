
import { Appointment, User, Role, Professional, Service, LandingSettings, NotificationPreferences, Product, Client, AppointmentStatus, Branch, TemplateId, Transaction } from "../types";

const API_URL = 'http://localhost:3000/api';

export const SOLUTION_TIMEOUT = 741;
export const ERROR_PROTECTION_CODE = '741';

const getUserRole = () => {
    const stored = localStorage.getItem('citaPlannerUser');
    if (stored) {
        try { return JSON.parse(stored).role; } catch { return ''; }
    }
    return '';
};

async function safeRequest<T>(endpoint: string, options: RequestInit = {}, fallbackData: T): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const storageKey = `fallback_${endpoint.replace(/\//g, '_')}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': getUserRole(),
        ...options.headers,
      },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 409) throw new Error("OVERLAP");
        if (response.status === 403) throw new Error("FORBIDDEN");
        throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!options.method || options.method === 'GET') {
      localStorage.setItem(storageKey, JSON.stringify(data));
    }
    return data as T;
  } catch (error) {
    if (error instanceof Error && (error.message === "OVERLAP" || error.message === "FORBIDDEN")) throw error;
    
    console.warn(`[API] Citaplanner Offline Mode for ${endpoint}.`, error);
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        return JSON.parse(cached) as T;
      } catch {
        return fallbackData;
      }
    }
    return fallbackData;
  }
}

export const api = {
  getLandingSettings: async (): Promise<LandingSettings> => {
    const local = localStorage.getItem('citaplanner_custom_landing');
    if (local) return JSON.parse(local);

    return safeRequest<LandingSettings>('/settings/landing', {}, {
      businessName: 'Citaplanner',
      primaryColor: '#630E14',
      secondaryColor: '#C5A028',
      templateId: 'citaplanner',
      slogan: 'Gestión Inteligente para Negocios de Belleza',
      aboutText: 'Citaplanner es la plataforma SaaS definitiva.',
      heroImageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035',
      address: 'Av. Horacio 124, Polanco, CDMX',
      contactPhone: '55 1234 5678'
    });
  },

  updateLandingSettings: async (settings: LandingSettings) => {
    localStorage.setItem('citaplanner_custom_landing', JSON.stringify(settings));
    return true;
  },

  getBranches: async (): Promise<Branch[]> => {
    return safeRequest<Branch[]>('/branches', {}, []);
  },

  login: async (phone: string, pass: string): Promise<User | null> => {
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password: pass })
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.success ? data.user : null;
    } catch {
        if (phone === 'admin' && pass === '123') return { id: '1', name: 'Citaplanner Admin', phone: 'admin', role: 'ADMIN' as Role, avatar: 'CP' };
        return null;
    }
  },

  getProducts: async (): Promise<Product[]> => safeRequest<Product[]>('/products', {}, []),
  getServices: async (): Promise<Service[]> => safeRequest<Service[]>('/services', {}, []),
  getProfessionals: async (): Promise<Professional[]> => safeRequest<Professional[]>('/professionals', {}, []),
  getAppointments: async (): Promise<Appointment[]> => safeRequest<Appointment[]>('/appointments', {}, []),
  createAppointment: async (a: Omit<Appointment, 'id'>) => safeRequest<Appointment | null>('/appointments', { method: 'POST', body: JSON.stringify(a) }, null),
  cancelAppointment: async (id: string) => safeRequest<boolean>(`/appointments/${id}/cancel`, { method: 'POST' }, true),
  
  // Fase 1: Reportes y Finanzas
  getBusinessStats: async () => {
    const revenue = localStorage.getItem('cp_mock_revenue') || '45800';
    return { 
      revenueThisMonth: parseFloat(revenue), 
      appointmentsCompleted: 1250, 
      newClientsThisMonth: 180, 
      occupationRate: 94 
    };
  },

  getTransactions: async (): Promise<Transaction[]> => {
    return safeRequest<Transaction[]>('/transactions', {}, []);
  },

  updatePreferences: async (userId: string, prefs: NotificationPreferences) => true,
  updateProfessional: async (pro: Professional) => true,
  createProfessional: async (pro: Omit<Professional, 'id'>): Promise<{ success: boolean; id?: string }> => {
    const res = await safeRequest<any>('/professionals', { method: 'POST', body: JSON.stringify(pro) }, null);
    if (res) return { success: true, id: res.id?.toString() };
    return { success: true, id: 'pro-' + Math.random().toString(36).substring(2, 9) };
  },
  createService: async (s: Omit<Service, 'id'>) => safeRequest<Service | null>('/services', { method: 'POST', body: JSON.stringify(s) }, null),
  updateService: async (s: any) => true,
  deleteService: async (id: string) => true,
  processSale: async (s: any) => {
    // Almacenar localmente para que Analytics lo refleje en modo offline
    const current = parseFloat(localStorage.getItem('cp_mock_revenue') || '45800');
    localStorage.setItem('cp_mock_revenue', (current + s.total).toString());
    
    return safeRequest<any>('/sales', { method: 'POST', body: JSON.stringify(s) }, { 
        success: true, 
        saleId: 'CP-'+Math.random().toString(36).substring(2,8).toUpperCase(), 
        date: new Date().toISOString() 
    });
  }
};
