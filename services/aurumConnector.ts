
import { 
  AurumClientPayload, 
  AurumCheckoutPayload, 
  AurumCheckoutResponse,
  AurumResponse 
} from "../types";

const PROXY_URL = '/api/integrations/aurum';

export const AurumConnectorService = {
  /**
   * Sincroniza la IDENTIDAD DEL NEGOCIO (Ej: Shula Studio) con el Master Hub.
   * NO sincroniza a los clientes finales del negocio.
   */
  syncTenant: async (data: AurumClientPayload): Promise<AurumResponse<{ clientId: string }>> => {
    try {
      const response = await fetch(`${PROXY_URL}/sync/clients`, { // En el Hub, el Tenant es un "Cliente"
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error(`Aurum Hub Error: ${response.status}`);
      return await response.json();
    } catch (error: any) {
      console.error("Aurum Sync Tenant Error:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Genera un enlace de pago para SUSCRIPCIONES del SaaS (Ej: Shula pagando CitaPlanner).
   * NO usar para ventas POS.
   */
  generateSubscriptionCheckout: async (data: AurumCheckoutPayload): Promise<AurumResponse<AurumCheckoutResponse>> => {
    try {
      const response = await fetch(`${PROXY_URL}/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Error ${response.status}`);
      }
      return await response.json();
    } catch (error: any) {
      console.error("Aurum Subscription Checkout Error:", error);
      return { success: false, error: error.message };
    }
  }
};
