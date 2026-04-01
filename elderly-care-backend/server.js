require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize OpenAI conditionally
let openai;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-ijklmnopqrstuvwxijklmnopqrstuvwxijklmnop') {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Utility for face recognition (Euclidean Distance of 128D vectors)
const calculateFaceDistance = (desc1, desc2) => {
  if (!desc1 || !desc2 || desc1.length !== desc2.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    sum += Math.pow(desc1[i] - desc2[i], 2);
  }
  return Math.sqrt(sum);
};

// --- Mock Database ---
let db = {
  accounts: [], // for auth
  user: {
    streak: 5,
    lastCheckIn: null,
    isSafe: true,
  },
  medications: [
    { id: 1, name: 'Lisinopril', time: '08:00', takenToday: false, missedToday: false, missedCount: 0 },
    { id: 2, name: 'Aspirin', time: '12:00', takenToday: false, missedToday: false, missedCount: 0 }
  ],
  moodLogs: [
    { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], mood: 'Happy' },
    { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], mood: 'Neutral' },
    { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], mood: 'Neutral' }
  ],
  alerts: []
};

// --- AUTH API ---
app.post('/api/register', (req, res) => {
  const { name, email, password, faceDescriptor } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const existingUser = db.accounts.find(u => u.email === email);
  if (existingUser) return res.status(400).json({ error: 'User already exists' });

  const newUser = { id: Date.now(), name, email, password, faceDescriptor: faceDescriptor || null };
  db.accounts.push(newUser);
  res.json({ token: `mock-token-${newUser.id}`, user: { name, email } });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.accounts.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ token: `mock-token-${user.id}`, user: { name: user.name, email: user.email } });
});

app.post('/api/login-face', (req, res) => {
  const { faceDescriptor } = req.body;
  if (!faceDescriptor) return res.status(400).json({ error: 'No face data provided' });

  const MATCH_THRESHOLD = 0.5; // Stricter threshold for better security 

  let bestMatch = null;
  let lowestDistance = Infinity;

  for (const user of db.accounts) {
    if (user.faceDescriptor) {
      const distance = calculateFaceDistance(faceDescriptor, user.faceDescriptor);
      if (distance < lowestDistance) {
        lowestDistance = distance;
        bestMatch = user;
      }
    }
  }

  if (bestMatch && lowestDistance < MATCH_THRESHOLD) {
    return res.json({ token: `mock-token-${bestMatch.id}`, user: { name: bestMatch.name, email: bestMatch.email } });
  } else {
    return res.status(401).json({ error: 'Face not recognized' });
  }
});


// --- FEATURE API ---
app.get('/api/checkin', (req, res) => {
  res.json(db.user);
});

app.post('/api/checkin', (req, res) => {
  const { status, mood, note } = req.body;
  const today = new Date().toISOString().split('T')[0];
  db.user.lastCheckIn = today;

  if (status === 'safe') {
    db.user.streak += 1;
    db.user.isSafe = true;

    // Log the mood if explicitly provided by the new Dashboard MoodLogger
    if (mood) {
      const existingLog = db.moodLogs.find(log => log.date === today);
      if (existingLog) {
        existingLog.mood = mood;
        if (note) existingLog.note = note;
      } else {
        db.moodLogs.push({ date: today, mood, note: note || '' });
      }
    }

    res.json({ message: 'Checked in successfully!', streak: db.user.streak });
  } else {
    db.user.streak = 0;
    db.user.isSafe = false;
    db.alerts.push({ type: 'danger', message: 'User missed daily check-in!', time: new Date() });
    res.status(400).json({ message: 'Emergency Alert Triggered! Caregiver notified.' });
  }
});

app.get('/api/medications', (req, res) => {
  res.json(db.medications);
});

app.post('/api/medications', (req, res) => {
  const { name, time } = req.body;
  const newMed = {
    id: db.medications.length + 1,
    name,
    time,
    takenToday: false,
    missedToday: false,
    missedCount: 0
  };
  db.medications.push(newMed);
  res.json(newMed);
});

app.post('/api/medications/:id/take', (req, res) => {
  const medId = parseInt(req.params.id);
  const med = db.medications.find(m => m.id === medId);
  if (med) {
    med.takenToday = true;
    med.missedToday = false;
    res.json(med);
  } else {
    res.status(404).json({ error: 'Medication not found' });
  }
});

app.post('/api/medications/:id/miss', (req, res) => {
  const medId = parseInt(req.params.id);
  const med = db.medications.find(m => m.id === medId);
  if (med) {
    med.takenToday = false;
    med.missedToday = true;
    med.missedCount += 1;
    if (med.missedCount >= 2) {
      db.alerts.push({ type: 'warning', message: `Repeatedly missed medication: ${med.name}`, time: new Date() });
    }
    res.json(med);
  } else {
    res.status(404).json({ error: 'Medication not found' });
  }
});

// --- OPENAI API CHATBOT ---
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  let detectedMood = 'Neutral';
  const msgLower = message.toLowerCase();

  // Basic keyword tracking backup logic
  if (msgLower.includes('lonely') || msgLower.includes('alone')) { detectedMood = 'Lonely'; db.alerts.push({ type: 'warning', message: 'User reported feeling lonely', time: new Date() }); }
  else if (msgLower.includes('sad') || msgLower.includes('depress') || msgLower.includes('bad')) { detectedMood = 'Sad'; db.alerts.push({ type: 'warning', message: 'User reported feeling down', time: new Date() }); }
  else if (msgLower.includes('pain') || msgLower.includes('hurt') || msgLower.includes('sick')) { detectedMood = 'Stressed'; db.alerts.push({ type: 'danger', message: 'User reported feeling pain/sick!', time: new Date() }); }
  else if (msgLower.includes('happy') || msgLower.includes('good') || msgLower.includes('great')) { detectedMood = 'Happy'; }

  // Save mood log for today
  const today = new Date().toISOString().split('T')[0];
  const existingLog = db.moodLogs.find(log => log.date === today);
  if (existingLog) {
    existingLog.mood = detectedMood !== 'Neutral' ? detectedMood : existingLog.mood;
  } else {
    db.moodLogs.push({ date: today, mood: detectedMood });
  }

  const fallbackLogic = (mood) => {
    let reply = "I'm here for you. Tell me more, dear.";
    if (mood === 'Lonely') reply = "I'm sorry you're feeling lonely. Remember I'm always here to chat! Would you like me to notify your family to call you?";
    else if (mood === 'Sad') reply = "It's okay to feel sad sometimes. I'm sending virtual hugs. Anything specific on your mind?";
    else if (mood === 'Stressed') reply = "I'm sorry to hear you're in pain or feeling unwell. Should I alert your caregiver?";
    else if (mood === 'Happy') reply = "I'm so glad to hear you're feeling good today! Keep up the great spirit.";
    return { reply, mood };
  };

  // Open AI integration
  try {
    if (openai) {
      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: "You are CareAI, a friendly, empathetic companion for elderly adults. Provide very short, warm, and highly supportive responses. Keep sentences simple." },
          { role: "user", content: message }
        ],
        model: "gpt-3.5-turbo",
      });
      res.json({ reply: completion.choices[0].message.content, mood: detectedMood });
    } else {
      res.json(fallbackLogic(detectedMood));
    }
  } catch (error) {
    console.error('OpenAI Error:', error.message || 'Error occurred');
    // Fallback automatically if API key quota exceeded
    res.json(fallbackLogic(detectedMood));
  }
});

// --- DASHBOARD ---
app.get('/api/dashboard', (req, res) => {
  const totalMeds = db.medications.length;
  const takenMeds = db.medications.filter(m => m.takenToday).length;
  const missedPercent = totalMeds > 0 ? ((totalMeds - takenMeds) / totalMeds) * 100 : 0;

  res.json({
    streak: db.user.streak,
    medicationAdherence: Math.max(0, 100 - missedPercent),
    moodLogs: db.moodLogs.slice(-7),
    alerts: db.alerts
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Elderly Care Backend running on http://localhost:${PORT}`);
});
