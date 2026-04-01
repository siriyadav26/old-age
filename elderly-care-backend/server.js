require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { CohereClient } = require('cohere-ai');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize Cohere
const COHERE_API_KEY = process.env.COHERE_API_KEY || 'dummy_key_placeholder';
const cohere = new CohereClient({ token: COHERE_API_KEY });

let transporter;
nodemailer.createTestAccount((err, account) => {
  if (err) {
    console.error('Failed to create a testing account. ' + err.message);
    return;
  }
  transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: { user: account.user, pass: account.pass },
  });
  console.log('Nodemailer test service ready (Ethereal Email).');
});

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
    emergencyContacts: []
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
  alerts: [],
  assessments: []
};

const fireSOS = async (reason) => {
  db.alerts.push({ type: 'danger', message: `SOS TRIGGERED: ${reason}`, time: new Date() });
  if (transporter && db.user.emergencyContacts && db.user.emergencyContacts.length > 0) {
    try {
       const info = await transporter.sendMail({
         from: '"CareAssistant Alert" <sos@careassistant.local>',
         to: db.user.emergencyContacts.join(', '),
         subject: "🚨 EMERGENCY ALERT: Action Required",
         text: `An emergency alert has been triggered for your loved one.\nReason: ${reason}\nPlease check on them immediately.`,
       });
       console.log('Emergency email sent! Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (e) {
       console.error("Failed to send SOS email:", e);
    }
  } else {
    console.log("SOS Fired, but no emergency contacts configured or transporter not ready.");
  }
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
    fireSOS("User missed daily check-in or reported unsafe status!");
    res.status(400).json({ message: 'Emergency Alert Triggered! Caregiver notified.' });
  }
});

app.get('/api/emergency-contacts', (req, res) => {
  res.json({ contacts: db.user.emergencyContacts });
});

app.post('/api/emergency-contacts', (req, res) => {
  const { emails } = req.body;
  if (Array.isArray(emails)) {
    db.user.emergencyContacts = emails;
    res.json({ success: true, contacts: db.user.emergencyContacts });
  } else {
    res.status(400).json({ error: 'Expected an array of emails' });
  }
});

app.post('/api/trigger-sos', (req, res) => {
  fireSOS("User manually triggered SOS button.");
  res.json({ success: true });
});

app.post('/api/health-assessment', (req, res) => {
  const { date, answers, metrics } = req.body;
  const existingIndex = db.assessments.findIndex(a => a.date === date);
  const newAssessment = { date, answers, metrics };
  
  if (existingIndex >= 0) {
    db.assessments[existingIndex] = newAssessment;
  } else {
    db.assessments.push(newAssessment);
  }

  // Also extract mood from answers to moodLogs if present
  if (answers && answers.mood) {
    let m = answers.mood;
    if (m === 'Very unhappy') m = 'Sad';
    if (m === 'Unhappy') m = 'Sad';
    if (m === 'Very happy') m = 'Happy';
    const logIdx = db.moodLogs.findIndex(l => l.date === date);
    if (logIdx >= 0) db.moodLogs[logIdx].mood = m;
    else db.moodLogs.push({ date, mood: m });
  }

  if (metrics && !metrics.safe) {
    fireSOS("Daily Health Check indicated unsafe condition (e.g. severe pain, falls).");
  }
  res.json({ success: true, assessments: db.assessments });
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

// --- COHERE API GENERATOR ---
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  const seedWord = message.toLowerCase().trim() || 'health';

  try {
    const prompt = `Give a paragraph of information based on this keyword ${seedWord} and its 5 most similar words. Please synthesize them together smoothly into the paragraph output.`;
    
    const response = await cohere.chat({
      model: 'command-r7b-12-2024',
      message: prompt,
      maxTokens: 200
    });
    
    // Strict replacement exactly mimicking the user's Python .replace('. ', '.\n')
    const parsedText = response.text.trim().split('. ').join('.\n');
    res.json({ reply: parsedText });
  } catch (error) {
    console.error('Cohere API Error:', error.message || 'Error occurred');
    res.json({ reply: "API Error: Unable to fetch generation from Cohere." });
  }
});

// --- DASHBOARD ---
app.get('/api/dashboard', (req, res) => {
  const totalMeds = db.medications.length;
  const takenMeds = db.medications.filter(m => m.takenToday).length;
  const missedPercent = totalMeds > 0 ? ((totalMeds - takenMeds) / totalMeds) * 100 : 0;

  // Calculate dynamic average health score from assessments
  let healthScore = 85; // default fallback
  if (db.assessments && db.assessments.length > 0) {
    const total = db.assessments.reduce((sum, a) => sum + (a.metrics ? a.metrics.healthScore : 0), 0);
    healthScore = Math.round(total / db.assessments.length);
  }

  // Update streak logic
  let streak = db.user.streak;
  if (db.assessments && db.assessments.length > 0) {
    // Sort descending
    const sorted = [...db.assessments].sort((a, b) => new Date(b.date) - new Date(a.date));
    let calculatedStreak = 0;
    for (const a of sorted) {
      if (a.metrics && a.metrics.safe) calculatedStreak++;
      else break;
    }
    streak = Math.max(streak, calculatedStreak);
  }

  res.json({
    streak: streak,
    medicationAdherence: Math.max(0, 100 - missedPercent),
    moodLogs: db.moodLogs.slice(-7),
    alerts: db.alerts,
    assessments: db.assessments,
    healthScore
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Elderly Care Backend running on http://localhost:${PORT}`);
});
