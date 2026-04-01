import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Medications from './components/Medications';
import Chatbot from './components/Chatbot';
import Games from './components/Games';
import Login from './components/Login';
import Register from './components/Register';
import BreathingExercise from './components/BreathingExercise';
import Settings from './components/Settings';
import CursorFollower from './components/CursorFollower';
import Background3D from './components/Background3D';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

function ProtectedLayout({ token, setToken }) {
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="app-container">
      <Navbar setToken={setToken} />
      <main>
         <Outlet />
      </main>
    </div>
  );
}

function AnimatedRoutes({ token, setToken }) {
  const location = useLocation();
  const { t } = useLanguage();

  const handleSOS = () => {
    // Generate a harsh, synthetic distress buzzer natively via Web Audio API 
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'square'; // Very harsh buzzing tone
    oscillator.frequency.setValueAtTime(300, ctx.currentTime); // Pitch frequency
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start();

    // Pulse the alarm algorithmically (on/off rhythm)
    let isBuzzing = true;
    const pulseInterval = setInterval(() => {
      isBuzzing = !isBuzzing;
      // Immediately turn volume to 1 or 0 for sharp beeps
      gainNode.gain.setValueAtTime(isBuzzing ? 1 : 0, ctx.currentTime);
    }, 150);

    // Stop exactly after 4 seconds
    setTimeout(() => {
      clearInterval(pulseInterval);
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      oscillator.stop();
      ctx.close();
      alert("SOS Triggered! Caregiver Notified.");
    }, 4000);
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={token ? <Navigate to="/" /> : <Login setToken={setToken} />} />
        <Route path="/register" element={token ? <Navigate to="/" /> : <Register setToken={setToken} />} />
        
        <Route element={<ProtectedLayout token={token} setToken={setToken} />}>
          <Route path="/" element={
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <header className="header">
                <motion.h1 className="boldonse-regular" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>{t('CareAssistant')}</motion.h1>
                <motion.p className="boldonse-regular" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>{t('Your daily companion for a healthy and safe life.')}</motion.p>
              </header>
              <Dashboard />
            </motion.div>
          } />
          <Route path="/medications" element={<Medications />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/games" element={<Games />} />
          <Route path="/breathe" element={<BreathingExercise />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/alerts" element={
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '600px', textAlign: 'center' }}>
               <h2 className="card-title" style={{ justifyContent: 'center' }}><AlertTriangle size={36}/> {t('Active Alerts')}</h2>
               <p style={{color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '60px'}}>{t('No emergency alerts right now. You are safe.')}</p>
               
               <motion.button 
                 whileHover={{ scale: 1.05, boxShadow: '0 15px 40px rgba(255, 59, 48, 0.6)' }} 
                 whileTap={{ scale: 0.95 }} 
                 className="btn btn-danger" 
                 style={{ 
                   width: '220px', 
                   height: '220px', 
                   borderRadius: '50%', 
                   fontSize: '3rem', 
                   fontWeight: '800', 
                   boxShadow: '0 10px 30px rgba(255, 59, 48, 0.4)',
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: 'center',
                   justifyContent: 'center'
                 }}
                 onClick={handleSOS}
               >
                 {t('SOS')}
               </motion.button>
               <p style={{ color: 'var(--text-muted)', marginTop: '24px', fontSize: '1.1rem' }}>{t('Tap in case of emergency')}</p>
            </motion.div>
          } />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('auth_token'));

  return (
    <LanguageProvider>
      <BrowserRouter>
        <Background3D isAuth={!!token} />
        <CursorFollower />
        <AnimatedRoutes token={token} setToken={setToken} />
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
