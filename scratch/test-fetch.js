import http from 'http';

http.get('http://localhost:3000/api/settings/landing', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
    try {
      const parsed = JSON.parse(data);
      console.log('Success:', parsed.success);
      console.log('Value:', parsed.value ? Object.keys(parsed.value) : 'null');
      console.log('TemplateId:', parsed.value?.templateId);
      console.log('BusinessName:', parsed.value?.businessName);
    } catch (e) {
      console.log('Raw Data:', data);
    }
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
