const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5173,
  path: '/api/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`BODY: ${data.slice(0, 200)}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(JSON.stringify({
  name: "Proxy Test",
  email: "proxy@test.com",
  password: "pwd",
  faceDescriptor: Array.from(new Float32Array(128).fill(0.123))
}));

req.end();
