const http = require('http');

const data = JSON.stringify({
  name: 'Test API User',
  email: 'testapi@example.com',
  subject: 'Test API Subject',
  message: 'This is a test message from local api script.'
});

const options = {
  hostname: 'localhost',
  port: 9007,
  path: '/api/contact',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  console.log(`Status Code: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('Response Body:', body);
  });
});

req.on('error', (error) => {
  console.error('Error connecting to NestJS:', error);
});

req.write(data);
req.end();
