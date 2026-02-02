
import { Appointment, User, Professional, Service, LandingSettings, NotificationPreferences, Product, Client, Branch, InventoryMovement, Campaign, AutomationRule } from "../types";
import { AurumConnectorService } from "./aurumConnector";

const API_URL = '/api';

export const SOLUTION_TIMEOUT = 1000;
export const ERROR_PROTECTION_CODE = 'AUM-99';

// HELPER DE SEGURIDAD
const getHeaders = (isUpload = false) => {
  const userStr = localStorage.getItem('citaPlannerUser');
  const token = userStr ? JSON.parse(userStr).token : null;
  const headers: any = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isUpload) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

export const api = {
  // PROXY IA SEGURO (NUEVO)
  generateAIContent: async (params: { model?: string, contents: any, config?: any }) => {
    try {
      const res = await fetch(`${API_URL}/ai/generate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(params)
      });
      const data = await res.json();
      return data; // { text: "..." }
    } catch { return { text: "" }; }
  },

  // Provisionamiento SaaS (Público)
  registerNewStudio: async (data: { name: string, subdomain: string, adminPhone: string, adminPassword: string }) => {
    try {
      const res = await fetch(`${API_URL}/saas/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch { return { success: false, error: "Falla de red en provisionamiento" }; }
  },

  // Login (Público - Genera Token)
  login: async (phone: string, pass: string): Promise<User | null> => {
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password: pass })
        });
        const data = await res.json();
        if (data.success && data.user && data.token) {
            return { ...data.user, token: data.token }; 
        }
        return null;
    } catch { return null; }
  },

  uploadImage: async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API_URL}/upload`, { method: 'POST', headers: getHeaders(true), body: formData });
      const data = await res.json();
      return data.success ? data.url : null;
    } catch { return null; }
  },

  getLandingSettings: async (): Promise<LandingSettings> => {
    try {
        const res = await fetch(`${API_URL}/settings/landing`, { headers: getHeaders() });
        return await res.json();
    } catch { return {} as LandingSettings; }
  },

  updateLandingSettings: async (s: LandingSettings): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/settings/landing`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(s)
      });
      
      if (res.ok && s.businessName && s.contactPhone) {
        AurumConnectorService.syncTenant({
          commercialName: s.businessName,
          email: 'admin@system',
          phone: s.contactPhone,
          postalCode: '00000'
        }).catch(e => console.warn("Sync Tenant Warning", e));
      }

      return res.ok;
    } catch { return false; }
  },

  updateSubdomain: async (subdomain: string) => {
    const res = await fetch(`${API_URL}/settings/subdomain`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ subdomain })
    });
    return await res.json();
  },

  addCustomDomain: async (domain: string) => {
    try {
      const res = await fetch(`${API_URL}/settings/domain`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ domain })
      });
      return await res.json();
    } catch { return { success: false, error: "Network Error" }; }
  },

  checkDomainStatus: async () => {
    const res = await fetch(`${API_URL}/settings/domain/status`, { headers: getHeaders() });
    return await res.json();
  },

  removeCustomDomain: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/settings/domain`, { method: 'DELETE', headers: getHeaders() });
      return res.ok;
    } catch { return false; }
  },

  getClients: async (): Promise<Client[]> => {
    const res = await fetch(`${API_URL}/clients`, { headers: getHeaders() });
    return res.ok ? await res.json() : [];
  },

  updateClient: async (c: Client): Promise<boolean> => {
    const res = await fetch(`${API_URL}/clients/${c.id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(c)
    });
    return res.ok;
  },

  createClient: async (c: Partial<Client>): Promise<boolean> => {
    const res = await fetch(`${API_URL}/clients`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(c)
    });
    return res.ok;
  },

  deleteClient: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/clients/${id}`, { method: 'DELETE', headers: getHeaders() });
    return res.ok;
  },

  getServices: async (): Promise<Service[]> => {
    const res = await fetch(`${API_URL}/services`, { headers: getHeaders() });
    return res.ok ? await res.json() : [];
  },

  getAppointments: async (): Promise<Appointment[]> => {
    const res = await fetch(`${API_URL}/appointments`, { headers: getHeaders() });
    return res.ok ? await res.json() : [];
  },

  createAppointment: async (a: Omit<Appointment, 'id' | 'tenantId'>) => {
    const res = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(a)
    });
    return await res.json();
  },

  getProducts: async (): Promise<Product[]> => {
    const res = await fetch(`${API_URL}/products`, { headers: getHeaders() });
    return res.ok ? await res.json() : [];
  },

  getInventoryMovements: async (): Promise<InventoryMovement[]> => {
    const res = await fetch(`${API_URL}/inventory/movements`, { headers: getHeaders() });
    return res.ok ? await res.json() : [];
  },

  createProduct: async (p: Product): Promise<boolean> => {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(p)
    });
    return res.ok;
  },

  updateProduct: async (p: Product): Promise<boolean> => {
    const res = await fetch(`${API_URL}/products/${p.id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(p)
    });
    return res.ok;
  },

  getProfessionals: async (): Promise<Professional[]> => {
    const res = await fetch(`${API_URL}/professionals`, { headers: getHeaders() });
    return res.ok ? await res.json() : [];
  },

  createProfessional: async (p: Omit<Professional, 'id' | 'tenantId'>): Promise<{ success: boolean; id?: string }> => {
    const res = await fetch(`${API_URL}/professionals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(p)
    });
    return await res.json();
  },

  updateProfessional: async (p: Professional): Promise<boolean> => {
    const res = await fetch(`${API_URL}/professionals/${p.id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(p)
    });
    return res.ok;
  },

  updatePassword: async (id: string, current: string, next: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/users/${id}/password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ current, next })
    });
    return res.ok;
  },

  updateProfile: async (id: string, data: any): Promise<boolean> => {
    const res = await fetch(`${API_URL}/users/${id}/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.ok;
  },

  updatePreferences: async (id: string, prefs: NotificationPreferences): Promise<boolean> => {
    const res = await fetch(`${API_URL}/users/${id}/preferences`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(prefs)
    });
    return res.ok;
  },

  getProfessionalAppointments: async (proId: string): Promise<Appointment[]> => {
    const res = await fetch(`${API_URL}/professionals/${proId}/appointments`, { headers: getHeaders() });
    return res.ok ? await res.json() : [];
  },

  completeAppointment: async (id: string, notes: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/appointments/${id}/complete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ notes })
    });
    return res.ok;
  },

  cancelAppointment: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/appointments/${id}/cancel`, { method: 'POST', headers: getHeaders() });
    return res.ok;
  },

  updateService: async (s: Service): Promise<boolean> => {
    const res = await fetch(`${API_URL}/services/${s.id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(s)
    });
    return res.ok;
  },

  getVapidPublicKey: async (): Promise<string | null> => {
    try {
        const res = await safeFetch(`${API_URL}/notifications/vapid-public-key`, { headers: getHeaders() });
        if (res.ok) {
            const data = await res.json();
            return data.publicKey;
        }
        return null;
    } catch { return null; }
  },

  subscribeToNotifications: async (subscription: any, userId: string): Promise<boolean> => {
    try {
        const res = await safeFetch(`${API_URL}/notifications/subscribe`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ subscription, userId })
        });
        return res.ok;
    } catch { return false; }
  },

  processSale: async (saleData: any): Promise<{success: boolean, saleId?: string, date?: string}> => {
    try {
        const res = await safeFetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(saleData)
        });
        if (!res.ok) return { success: false };
        return res.json();
    } catch { return { success: false }; }
  }
};
