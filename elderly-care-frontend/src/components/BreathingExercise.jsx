import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Wind } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

function BreathingExercise() {
  const { t } = useLanguage();
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState('idle'); // 'idle', 'inhale', 'hold', 'exhale', 'completed'
  const [cycles, setCycles] = useState(0);

  // Settings
  const [inhaleTime, setInhaleTime] = useState(4);
  const [holdTime, setHoldTime] = useState(4);
  const [exhaleTime, setExhaleTime] = useState(4);
  const [targetCycles, setTargetCycles] = useState(5);

  const audioContextRef = useRef(null);

  // Simulated "whoosh" sound effect
  const playWhoosh = (type, durationInSeconds) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const bufferSize = ctx.sampleRate * durationInSeconds;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.value = 1;
      
      if (type === 'inhale') {
        filter.frequency.setValueAtTime(100, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + durationInSeconds);
      } else {
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + durationInSeconds);
      }

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.5);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + durationInSeconds);

      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      noise.start();
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  useEffect(() => {
    let timeout;
    let isCancelled = false;
    
    const runCycle = async () => {
      if (!isActive) return;
      
      if (cycles >= targetCycles) {
        setPhase('completed');
        setIsActive(false);
        return;
      }

      // Inhale
      if (!isCancelled) {
        setPhase('inhale');
        playWhoosh('inhale', inhaleTime);
        await new Promise(r => { timeout = setTimeout(r, inhaleTime * 1000) });
      }

      // Hold
      if (!isCancelled && isActive) {
        setPhase('hold');
        await new Promise(r => { timeout = setTimeout(r, holdTime * 1000) });
      }

      // Exhale
      if (!isCancelled && isActive) {
        setPhase('exhale');
        playWhoosh('exhale', exhaleTime);
        await new Promise(r => { timeout = setTimeout(r, exhaleTime * 1000) });
      }

      if (!isCancelled && isActive) {
        setCycles(c => c + 1);
      }
    };

    if (isActive) {
      runCycle();
    } else {
      clearTimeout(timeout);
    }

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [isActive, cycles, inhaleTime, holdTime, exhaleTime, targetCycles]);

  const handleStartStop = () => {
    if (isActive) {
      setIsActive(false);
      setPhase('idle');
      setCycles(0);
    } else {
      setCycles(0);
      setIsActive(true);
    }
  };

  // Phase message
  const getPhaseMessage = () => {
    switch(phase) {
      case 'idle': return t('Ready to relax?');
      case 'inhale': return t('Breathe In...');
      case 'hold': return t('Hold...');
      case 'exhale': return t('Breathe Out...');
      case 'completed': return t('Exercise Complete. Great job!');
      default: return '';
    }
  };

  // Circle properties based on phase
  const getCircleProps = () => {
    switch(phase) {
      case 'inhale': return { scale: 2, opacity: 1, backgroundColor: 'rgba(11, 60, 93, 0.3)', transition: { duration: inhaleTime, ease: 'easeInOut' } };
      case 'hold': return { scale: 2, opacity: 0.9, backgroundColor: 'rgba(52, 199, 89, 0.3)', transition: { duration: holdTime, ease: 'linear' } };
      case 'exhale': return { scale: 1, opacity: 1, backgroundColor: 'rgba(11, 60, 93, 0.3)', transition: { duration: exhaleTime, ease: 'easeInOut' } };
      case 'completed': return { scale: 1.2, opacity: 0.8, backgroundColor: 'rgba(52, 199, 89, 0.5)', transition: { duration: 1 } };
      default: return { scale: 1, opacity: 0.5, backgroundColor: 'rgba(11, 60, 93, 0.2)', transition: { duration: 1 } };
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '800px', margin: '0 auto' }}
    >
      <div className="card" style={{ width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden', padding: '40px 20px' }}>
        <h2 className="card-title" style={{ justifyContent: 'center', fontSize: '2.2rem', marginBottom: '10px' }}>
          <Wind size={36} color="var(--primary)" /> {t('Guided Breathing')}
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: '1.2rem' }}>
          {t('Relax and sync your breath with the circle.')}
        </p>
        
        {/* Breathing Animation Area */}
        <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', margin: '20px 0' }}>
          
          <h3 style={{ position: 'absolute', top: '0px', fontSize: '2rem', color: 'var(--primary)', fontWeight: '700', zIndex: 10 }}>
            {getPhaseMessage()}
          </h3>
          
          {/* Antigravity floating motion wrapper */}
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '250px', height: '250px' }}
          >
            {/* The expanding/contracting outer circle */}
            <motion.div
              animate={getCircleProps()}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backdropFilter: 'blur(12px)',
                border: '2px solid rgba(255,255,255,0.8)',
                boxShadow: '0 0 40px rgba(11, 60, 93, 0.1), inset 0 0 20px rgba(255,255,255,0.6)',
                position: 'absolute'
              }}
            />
            
            {/* Inner Core */}
            <motion.div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                boxShadow: '0 0 25px rgba(11, 60, 93, 0.5)',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}
            >
              {isActive && <Wind size={30} />}
            </motion.div>
          </motion.div>
          
          <div style={{ position: 'absolute', bottom: '0px', fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: '600' }}>
            {isActive || phase === 'completed' ? `${t('Cycle ')}${Math.min(cycles + 1, targetCycles)}${t(' of ')}${targetCycles}` : t('Set your durations below')}
          </div>
        </div>

        {/* Controls Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center' }}>
          {!isActive && phase !== 'completed' && (
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', background: 'rgba(255,255,255,0.6)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.8)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <label style={{ fontSize: '1rem', color: 'var(--secondary)', marginBottom: '8px', fontWeight: '600' }}>{t('Inhale (s)')}</label>
                <input type="number" min="1" max="10" value={inhaleTime} onChange={e => setInhaleTime(Number(e.target.value))} className="form-control" style={{ width: '80px', padding: '12px', textAlign: 'center', borderRadius: '12px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <label style={{ fontSize: '1rem', color: 'var(--secondary)', marginBottom: '8px', fontWeight: '600' }}>{t('Hold (s)')}</label>
                <input type="number" min="0" max="10" value={holdTime} onChange={e => setHoldTime(Number(e.target.value))} className="form-control" style={{ width: '80px', padding: '12px', textAlign: 'center', borderRadius: '12px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <label style={{ fontSize: '1rem', color: 'var(--secondary)', marginBottom: '8px', fontWeight: '600' }}>{t('Exhale (s)')}</label>
                <input type="number" min="1" max="10" value={exhaleTime} onChange={e => setExhaleTime(Number(e.target.value))} className="form-control" style={{ width: '80px', padding: '12px', textAlign: 'center', borderRadius: '12px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <label style={{ fontSize: '1rem', color: 'var(--secondary)', marginBottom: '8px', fontWeight: '600' }}>{t('Cycles')}</label>
                <input type="number" min="1" max="20" value={targetCycles} onChange={e => setTargetCycles(Number(e.target.value))} className="form-control" style={{ width: '80px', padding: '12px', textAlign: 'center', borderRadius: '12px' }} />
              </div>
            </div>
          )}

          <button 
            className={`btn ${isActive ? 'btn-danger' : 'btn-success'}`} 
            onClick={handleStartStop}
            style={{ width: '220px', height: '60px', fontSize: '1.3rem' }}
          >
            {isActive ? <><Square size={24} /> {t('Stop Exercise')}</> : phase === 'completed' ? <><Play size={24} /> {t('Restart')}</> : <><Play size={24} /> {t('Start Exercise')}</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default BreathingExercise;
