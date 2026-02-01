
import axios from 'axios';

const CF_API_URL = 'https://api.cloudflare.com/client/v4';
const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const BASE_DOMAIN = process.env.BASE_DOMAIN || 'citaplanner.com';

export const createSubdomain = async (subdomain, targetIp) => {
    if (!CF_TOKEN || !CF_ZONE_ID) {
        console.warn("⚠️ Cloudflare credentials missing. Mocking DNS creation.");
        return { success: true, mock: true, domain: `${subdomain}.${BASE_DOMAIN}` };
    }

    try {
        const response = await axios.post(
            `${CF_API_URL}/zones/${CF_ZONE_ID}/dns_records`,
            {
                type: 'A',
                name: subdomain,
                content: targetIp,
                ttl: 1, // Auto
                proxied: true
            },
            {
                headers: {
                    'Authorization': `Bearer ${CF_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return { success: true, record: response.data.result };
    } catch (error) {
        console.error("❌ Cloudflare API Error:", error.response?.data || error.message);
        throw new Error('Failed to create DNS record');
    }
};
