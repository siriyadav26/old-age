import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Mail, HeartPulse, Camera } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useFaceApi } from '../hooks/useFaceApi';

function Register({ setToken }) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Face Recognition State
  const { isLoaded, getFaceDescriptor } = useFaceApi();
  const [useFace, setUseFace] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const videoRef = React.useRef(null);
  
  const navigate = useNavigate();

  React.useEffect(() => {
    let stream = null;
    if (useFace && !faceDescriptor) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((s) => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch((err) => console.error("Camera error:", err));
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [useFace, faceDescriptor]);

  const captureFace = async () => {
    if (!videoRef.current || !isLoaded) return;
    setCapturing(true);
    setProgress(0);
    setError('');

    const descriptors = [];
    const MAX_SAMPLES = 20;

    const captureInterval = setInterval(async () => {
      if (descriptors.length >= MAX_SAMPLES) {
        clearInterval(captureInterval);
        const avg = new Float32Array(128);
        for (let i = 0; i < 128; i++) {
          let sum = 0;
          for (let j = 0; j < descriptors.length; j++) {
            sum += descriptors[j][i];
          }
          avg[i] = sum / descriptors.length;
        }
        setFaceDescriptor(Array.from(avg));
        setCapturing(false);
        return;
      }

      const desc = await getFaceDescriptor(videoRef.current);
      if (desc) {
        descriptors.push(desc);
        setProgress(Math.round((descriptors.length / MAX_SAMPLES) * 100));
      }
    }, 300); // Check every 300ms
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, faceDescriptor })
      });
      
      const responseText = await res.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (err) {
        if (responseText.trim().startsWith('<')) {
          throw new Error('Server returned an HTML page (often means the backend is down or proxy failed).');
        }
        throw new Error('Server returned invalid data: ' + responseText.slice(0, 50));
      }

      if (!res.ok) throw new Error(data.error || t('Registration failed'));
      
      localStorage.setItem('auth_token', data.token);
      setToken(data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      background: 'transparent',
      padding: '24px'
    }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '50px 32px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        <HeartPulse size={80} color="#000000" style={{ margin: '0 auto 24px auto' }} />
        <h2 style={{ fontSize: '2.5rem', color: 'var(--primary)', marginBottom: '8px' }}>{t("Create an Account")}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '40px' }}>{t("Join CareAssistant for free")}</p>

        {error && <div className="alert-card danger" style={{ justifyContent: 'center' }}>{error}</div>}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
             <User size={28} color="var(--primary)" style={{ position: 'absolute', top: '16px', left: '20px' }} />
             <input className="form-control" type="text" required placeholder={t("Full Name")} 
                value={name} onChange={e => setName(e.target.value)} style={{ paddingLeft: '64px' }} />
          </div>
          <div style={{ position: 'relative' }}>
             <Mail size={28} color="var(--primary)" style={{ position: 'absolute', top: '16px', left: '20px' }} />
             <input className="form-control" type="email" required placeholder={t("Email")} 
                value={email} onChange={e => setEmail(e.target.value)} style={{ paddingLeft: '64px' }} />
          </div>
          <div style={{ position: 'relative' }}>
             <Lock size={28} color="var(--primary)" style={{ position: 'absolute', top: '16px', left: '20px' }} />
             <input className="form-control" type="password" required placeholder={t("Password")} 
                value={password} onChange={e => setPassword(e.target.value)} style={{ paddingLeft: '64px' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <input type="checkbox" id="useFace" checked={useFace} onChange={e => {setUseFace(e.target.checked); setFaceDescriptor(null);}} />
             <label htmlFor="useFace" style={{ color: 'var(--text-main)', cursor: 'pointer' }}>Enable Face Login (Optional)</label>
          </div>

          {useFace && !faceDescriptor && (
            <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid #ddd' }}>
               <p style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-muted)' }}>Position your face in the box and scan.</p>
               <video ref={videoRef} autoPlay muted playsInline style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '8px', margin: '0 auto', display: 'block', transform: 'scaleX(-1)' }} />
               
               <button type="button" onClick={captureFace} disabled={capturing || !isLoaded} className="btn" style={{ marginTop: '16px', background: 'var(--accent)', color: 'var(--primary)', width: '100%' }}>
                 <Camera size={20} /> {capturing ? `Scanning... ${progress}%` : (isLoaded ? "Start Face Scan" : "Loading Models...")}
               </button>
            </div>
          )}

          {faceDescriptor && (
            <div className="alert-card safe" style={{ justifyContent: 'center' }}>
               Face Scan Complete! ✅
            </div>
          )}

          <button type="submit" className="btn btn-success" disabled={useFace && !faceDescriptor} style={{ marginTop: '16px' }}>{t("Register")}</button>
        </form>

        <p style={{ marginTop: '32px', fontSize: '1.1rem' }}>
          {t("Already have an account? ")} <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{t("Login here")}</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
