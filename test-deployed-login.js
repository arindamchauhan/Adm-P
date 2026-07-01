const https = require('https');
const data = JSON.stringify({ identifier: 'admin', password: 'admin123' });
const options = {
  hostname: 'adm-p.vercel.app',
  port: 443,
  path: '/api/auth/admin-login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};
const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('status', res.statusCode);
    console.log(body);
  });
});
req.on('error', (err) => { console.error('request error', err.message); });
req.write(data);
req.end();
