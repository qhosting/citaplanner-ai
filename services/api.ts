
import { Appointment, User, Professional, Service, LandingSettings, NotificationPreferences, Product, Client, Branch, InventoryMovement, Campaign, AutomationRule, SaasPlan, Lead } from "../types";
import { AurumConnectorService } from "./aurumConnector";

const API_URL = '/api';

export const SOLUTION_TIMEOUT = 1000;
export const ERROR_PROTECTION_CODE = 'AUM-99';

// UTILS
const safeFetch = async (url: string, options: RequestInit = {}, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e: any) {
    clearTimeout(timer);
    if (e?.name === 'AbortError') {
      console.warn(`[TIMEOUT] ${url} no respondió en ${timeoutMs}ms`);
    } else {
      console.error(`[SAFE FETCH ERROR] ${url}:`, e);
    }
    throw e;
  }
};

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

// --- AUTH INTELLIGENCE (INTERCEPTOR) ---
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const userStr = localStorage.getItem('citaPlannerUser');
    if (!userStr) return null;

    const user = JSON.parse(userStr);
    if (!user.refreshToken) return null;

    console.log("🔄 Attempting Token Refresh...");
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: user.refreshToken })
    });

    const data = await res.json();
    if (data.success && data.token) {
      console.log("✅ Token Refreshed Successfully");
      const newUser = { ...user, token: data.token };
      localStorage.setItem('citaPlannerUser', JSON.stringify(newUser));
      return data.token;
    }

    // Fail: Clear session
    console.warn("⚠️ Refresh Failed: Session Expired");
    localStorage.removeItem('citaPlannerUser');
    return null;
  } catch (e) {
    console.error("❌ Refresh Error:", e);
    return null;
  }
};

const fetchWithAuth = async (url: string, options: RequestInit = {}, timeoutMs = 8000) => {
  let headers = getHeaders(options.body instanceof FormData);

  const makeRequest = async (hdrs: any) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, headers: hdrs, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (e: any) {
      clearTimeout(timer);
      if (e?.name === 'AbortError') console.warn(`[TIMEOUT] ${url}`);
      throw e;
    }
  };

  // 1. Try Original Request
  let res = await makeRequest(headers);

  // 2. Handle 401 / 403 (Token Expired)
  if (res.status === 401 || res.status === 403) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await makeRequest(headers);
    }
  }

  return res;
};

export const api = {
  // PROXY IA SEGURO (NUEVO)
  generateAIContent: async (params: { model?: string, contents: any, config?: any }) => {
    try {
      const res = await fetchWithAuth(`${API_URL}/ai/generate`, {
        method: 'POST',
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
        return { ...data.user, token: data.token, refreshToken: data.refreshToken };
      }
      return null;
    } catch { return null; }
  },

  // Settings & Landing
  getLandingSettings: async (): Promise<{ success: boolean, value: LandingSettings }> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/settings/landing`);
      return res.ok ? await res.json() : { success: false, value: {} as LandingSettings };
    } catch { return { success: false, value: {} as LandingSettings }; }
  },


  updateLandingSettings: async (s: LandingSettings): Promise<boolean> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/settings/landing`, {
        method: 'PUT',
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

  getWahaStatus: async (): Promise<any> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/integrations/waha/status`);
      return res.ok ? await res.json() : { success: false, status: 'ERROR' };
    } catch { return { success: false, status: 'ERROR' }; }
  },

  testWahaMessage: async (phone: string): Promise<any> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/integrations/waha/test`, {
        method: 'POST',
        body: JSON.stringify({ phone })
      });
      return await res.json();
    } catch (e: any) { return { success: false, error: e.message }; }
  },

  getIntegrationLogs: async (): Promise<any[]> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/integrations/status`);
      return res.ok ? await res.json() : [];
    } catch { return []; }
  },

  getCampaigns: async (): Promise<Campaign[]> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/marketing/campaigns`);
      return res.ok ? await res.json() : [];
    } catch { return []; }
  },

  createCampaign: async (data: any) => {
    const res = await fetchWithAuth(`${API_URL}/marketing/campaigns`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  getMarketingTemplates: async (): Promise<any[]> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/marketing/templates`);
      return res.ok ? await res.json() : [];
    } catch { return []; }
  },

  createMarketingTemplate: async (data: any) => {
    const res = await fetchWithAuth(`${API_URL}/marketing/templates`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  deleteMarketingTemplate: async (id: string) => {
    const res = await fetchWithAuth(`${API_URL}/marketing/templates/${id}`, {
      method: 'DELETE'
    });
    return res.ok;
  },

  getAutomations: async (): Promise<AutomationRule[]> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/marketing/automations`);
      return res.ok ? await res.json() : [];
    } catch { return []; }
  },

  updateSubdomain: async (subdomain: string) => {
    const res = await fetchWithAuth(`${API_URL}/settings/subdomain`, {
      method: 'PUT',
      body: JSON.stringify({ subdomain })
    });
    return await res.json();
  },

  addCustomDomain: async (domain: string) => {
    try {
      const res = await fetchWithAuth(`${API_URL}/settings/domain`, {
        method: 'POST',
        body: JSON.stringify({ domain })
      });
      return await res.json();
    } catch { return { success: false, error: "Network Error" }; }
  },

  checkDomainStatus: async () => {
    const res = await fetchWithAuth(`${API_URL}/settings/domain/status`);
    return await res.json();
  },

  removeCustomDomain: async (): Promise<boolean> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/settings/domain`, { method: 'DELETE' });
      return res.ok;
    } catch { return false; }
  },

  // Clients CRUD
  getClients: async (): Promise<Client[]> => {
    const res = await fetchWithAuth(`${API_URL}/clients`);
    return res.ok ? await res.json() : [];
  },

  updateClient: async (c: Client): Promise<boolean> => {
    const res = await fetchWithAuth(`${API_URL}/clients/${c.id}`, {
      method: 'PUT',
      body: JSON.stringify(c)
    });
    return res.ok;
  },

  createClient: async (c: Partial<Client>): Promise<boolean> => {
    const res = await fetchWithAuth(`${API_URL}/clients`, {
      method: 'POST',
      body: JSON.stringify(c)
    });
    return res.ok;
  },

  deleteClient: async (id: string): Promise<boolean> => {
    const res = await fetchWithAuth(`${API_URL}/clients/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  // Services CRUD
  getServices: async (): Promise<Service[]> => {
    const res = await fetchWithAuth(`${API_URL}/services`);
    return res.ok ? await res.json() : [];
  },

  updateService: async (s: Service): Promise<boolean> => {
    const res = await fetchWithAuth(`${API_URL}/services/${s.id}`, {
      method: 'PUT',
      body: JSON.stringify(s)
    });
    return res.ok;
  },

  createService: async (s: Omit<Service, 'id'>): Promise<Service | null> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/services`, {
        method: 'POST',
        body: JSON.stringify(s)
      });
      const data = await res.json();
      return data.success ? data.service : null;
    } catch { return null; }
  },

  deleteService: async (id: string): Promise<boolean> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/services/${id}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch { return false; }
  },

  exportServices: async (): Promise<Service[]> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/services/export`);
      return res.ok ? await res.json() : [];
    } catch { return []; }
  },

  importServices: async (services: any[]): Promise<{ success: boolean; count?: number; error?: string }> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/services/import`, {
        method: 'POST',
        body: JSON.stringify({ services })
      });
      return await res.json();
    } catch { return { success: false, error: "Network Error" }; }
  },

  // Appointments CRUD
  getAppointments: async (): Promise<Appointment[]> => {
    const res = await fetchWithAuth(`${API_URL}/appointments`);
    return res.ok ? await res.json() : [];
  },

  createAppointment: async (a: Omit<Appointment, 'id' | 'tenantId'>) => {
    const res = await fetchWithAuth(`${API_URL}/appointments`, {
      method: 'POST',
      body: JSON.stringify(a)
    });
    return await res.json();
  },

  completeAppointment: async (id: string, notes: string): Promise<boolean> => {
    const res = await fetchWithAuth(`${API_URL}/appointments/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    });
    return res.ok;
  },

  cancelAppointment: async (id: string): Promise<boolean> => {
    const res = await fetchWithAuth(`${API_URL}/appointments/${id}/cancel`, { method: 'POST' });
    return res.ok;
  },

  // Products CRUD
  getProducts: async (): Promise<Product[]> => {
    const res = await fetchWithAuth(`${API_URL}/products`);
    return res.ok ? await res.json() : [];
  },

  createProduct: async (p: Product): Promise<boolean> => {
    const res = await fetchWithAuth(`${API_URL}/products`, {
      method: 'POST',
      body: JSON.stringify(p)
    });
    return res.ok;
  },

  updateProduct: async (p: Product): Promise<boolean> => {
    const res = await fetchWithAuth(`${API_URL}/products/${p.id}`, {
      method: 'PUT',
      body: JSON.stringify(p)
    });
    return res.ok;
  },

  getInventoryMovements: async (): Promise<InventoryMovement[]> => {
    const res = await fetchWithAuth(`${API_URL}/inventory/movements`);
    return res.ok ? await res.json() : [];
  },

  exportProducts: async (): Promise<Product[]> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/products/export`);
      return res.ok ? await res.json() : [];
    } catch { return []; }
  },

  importProducts: async (products: any[]): Promise<{ success: boolean; count?: number; error?: string }> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/products/import`, {
        method: 'POST',
        body: JSON.stringify({ products })
      });
      return await res.json();
    } catch { return { success: false, error: "Network Error" }; }
  },

  // Professionals CRUD
  getProfessionals: async (): Promise<Professional[]> => {
    const res = await fetchWithAuth(`${API_URL}/professionals`);
    return res.ok ? await res.json() : [];
  },

  createProfessional: async (p: Omit<Professional, 'id'>): Promise<{ success: boolean; id?: string }> => {
    const res = await fetchWithAuth(`${API_URL}/professionals`, {
      method: 'POST',
      body: JSON.stringify(p)
    });
    return await res.json();
  },

  updateProfessional: async (p: Professional): Promise<boolean> => {
    const res = await fetchWithAuth(`${API_URL}/professionals/${p.id}`, {
      method: 'PUT',
      body: JSON.stringify(p)
    });
    return res.ok;
  },

  deleteProfessional: async (id: string): Promise<boolean> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/professionals/${id}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch { return false; }
  },

  getProfessionalAppointments: async (proId: string): Promise<Appointment[]> => {
    const res = await fetchWithAuth(`${API_URL}/professionals/${proId}/appointments`);
    return res.ok ? await res.json() : [];
  },

  getCalendarLink: async (proId: string): Promise<{ url: string, icalToken: string }> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/professionals/${proId}/calendar/link`);
      if (!res.ok) throw new Error("Falla al obtener link");
      return await res.json();
    } catch { return { url: '', icalToken: '' }; }
  },

  // User / Profile
  updatePassword: async (id: string, current: string, next: string): Promise<boolean> => {
    const res = await fetchWithAuth(`${API_URL}/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ current, next })
    });
    return res.ok;
  },

  updateProfile: async (id: string, data: any): Promise<boolean> => {
    const res = await fetchWithAuth(`${API_URL}/users/${id}/profile`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.ok;
  },

  updatePreferences: async (id: string, prefs: NotificationPreferences): Promise<boolean> => {
    const res = await fetchWithAuth(`${API_URL}/users/${id}/preferences`, {
      method: 'PUT',
      body: JSON.stringify(prefs)
    });
    return res.ok;
  },

  // Notifications
  getVapidPublicKey: async (): Promise<string | null> => {
    try {
      const res = await fetch(`${API_URL}/notifications/vapid-public-key`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        return data.publicKey;
      }
      return null;
    } catch { return null; }
  },

  subscribeToNotifications: async (subscription: any, userId: string): Promise<boolean> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/notifications/subscribe`, {
        method: 'POST',
        body: JSON.stringify({ subscription, userId })
      });
      return res.ok;
    } catch { return false; }
  },

  // Sales
  getSales: async (): Promise<any[]> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/sales`);
      return res.ok ? await res.json() : [];
    } catch { return []; }
  },

  processSale: async (saleData: any): Promise<{ success: boolean, saleId?: string, date?: string }> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/sales`, {
        method: 'POST',
        body: JSON.stringify(saleData)
      });
      if (!res.ok) return { success: false };
      return res.json();
    } catch { return { success: false }; }
  },

  // AI & Automation
  getServiceSuggestion: async (title: string, category: string): Promise<{ description: string, careInstructions: string } | null> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/ai/service-suggestion`, {
        method: 'POST',
        body: JSON.stringify({ title, category })
      });
      if (res.ok) {
        const result = await res.json();
        return result.data;
      }
      return null;
    } catch { return null; }
  },

  improveImage: async (title: string, category: string): Promise<{ imageUrl: string } | null> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/ai/visual-improve`, {
        method: 'POST',
        body: JSON.stringify({ title, category })
      });
      if (res.ok) {
        const result = await res.json();
        return result;
      }
      return null;
    } catch { return null; }
  },

  // Forgot Password
  requestPasswordReset: async (email: string, tenantId?: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tenantId })
      });
      return await res.json();
    } catch { return { success: false, error: "Error de red" }; }
  },

  resetPassword: async (email: string, token: string, newPassword: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword })
      });
      return await res.json();
    } catch { return { success: false, error: "Error de red" }; }
  },

  // Branches CRUD
  getBranches: async (): Promise<Branch[]> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/branches`);
      return res.ok ? await res.json() : [];
    } catch { return []; }
  },

  createBranch: async (b: Omit<Branch, 'id'>): Promise<{ success: boolean, id?: string }> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/branches`, {
        method: 'POST',
        body: JSON.stringify(b)
      });
      return await res.json();
    } catch { return { success: false }; }
  },

  updateBranch: async (b: Branch): Promise<boolean> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/branches/${b.id}`, {
        method: 'PUT',
        body: JSON.stringify(b)
      });
      return res.ok;
    } catch { return false; }
  },

  deleteBranch: async (id: string): Promise<boolean> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/branches/${id}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch { return false; }
  },

  // Media
  uploadImage: async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetchWithAuth(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
      return null;
    } catch { return null; }
  },

  // Leads CRUD
  getLeads: async (): Promise<Lead[]> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/leads`);
      return res.ok ? await res.json() : [];
    } catch { return []; }
  },

  createLead: async (l: Partial<Lead>): Promise<boolean> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/leads`, {
        method: 'POST',
        body: JSON.stringify(l)
      });
      return res.ok;
    } catch { return false; }
  },

  updateLead: async (l: Partial<Lead>): Promise<boolean> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/leads/${l.id}`, {
        method: 'PUT',
        body: JSON.stringify(l)
      });
      return res.ok;
    } catch { return false; }
  },

  convertLead: async (id: string): Promise<boolean> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/leads/${id}/convert`, {
        method: 'POST'
      });
      return res.ok;
    } catch { return false; }
  },

  deleteLead: async (id: string): Promise<boolean> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/leads/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch { return false; }
  },

  // Business Stats
  getBusinessStats: async (): Promise<any> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/business-stats`);
      if (!res.ok) throw new Error("Error al obtener estadísticas");
      return await res.json();
    } catch (error) {
      console.error("API getBusinessStats Error:", error);
      return {
        kpis: [],
        revenueFlow: [],
        serviceMix: [],
        topProducts: []
      };
    }
  },
  
  // Maintenance Tasks
  getMaintenanceTasks: async (): Promise<any[]> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/maintenance/tasks`);
      return res.ok ? await res.json() : [];
    } catch { return []; }
  },

  createMaintenanceTask: async (task: any): Promise<any | null> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/maintenance/tasks`, {
        method: 'POST',
        body: JSON.stringify(task)
      });
      return res.ok ? await res.json() : null;
    } catch { return null; }
  },

  deleteMaintenanceTask: async (id: string): Promise<boolean> => {
    try {
      const res = await fetchWithAuth(`${API_URL}/maintenance/tasks/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch { return false; }
  }
};
