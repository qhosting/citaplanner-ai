
import axios from 'axios';

async function testLogin() {
    const phone = '4271385455';
    const password = 'Shula24*';
    const host = 'shulastudio.mx';
    const baseUrl = 'http://127.0.0.1:3000'; // Backend port

    console.log(`🧪 Testing login for ${phone} on host ${host}...`);

    try {
        const res = await axios.post(`${baseUrl}/api/login`, {
            phone,
            password
        }, {
            headers: {
                'Host': host,
                'Content-Type': 'application/json'
            }
        });

        if (res.data.success) {
            console.log('✅ Login Successful!');
            console.log('👤 User:', res.data.user.name);
            console.log('🏢 Tenant:', res.data.user.tenantId);
            console.log('🔑 Role:', res.data.user.role);
        } else {
            console.error('❌ Login Failed:', res.data.message);
        }
    } catch (e) {
        console.error('❌ Request Error:', e.response?.data || e.message);
    }
}

testLogin();
