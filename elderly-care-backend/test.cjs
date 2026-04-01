

(async () => {
  const avg = new Float32Array(128);
  avg.fill(0.1234);
  const faceDescriptor = Array.from(avg);

  const res = await fetch('http://localhost:5000/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      name: 'Testy', 
      email: 'testy@example.com', 
      password: 'pwd', 
      faceDescriptor 
    })
  });
  
  const text = await res.text();
  console.log('STATUS:', res.status, res.statusText);
  console.log('RESPONSE TEXT:', text.slice(0, 150));
})();
