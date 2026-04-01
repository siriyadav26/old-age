import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, HeartPulse, ScanFace } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useFaceApi } from '../hooks/useFaceApi';

function Login({ setToken }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Face Recognition State
  const { isLoaded, getFaceDescriptor } = useFaceApi();
  const [useFaceLogin, setUseFaceLogin] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = React.useRef(null);
  
  const navigate = useNavigate();

  React.useEffect(() => {
    let stream = null;
    let scanInterval = null;

    if (useFaceLogin) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((s) => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
          
          // Start scanning interval
          setScanning(true);
          scanInterval = setInterval(async () => {
            if (!isLoaded || !videoRef.current) return;
            const desc = await getFaceDescriptor(videoRef.current);
            if (desc) {
              clearInterval(scanInterval);
              setScanning(false);
              handleFaceLogin(desc);
            }
          }, 1000);
        })
        .catch((err) => {
          console.error("Camera error:", err);
          setError("Camera access denied or unavailable.");
          setUseFaceLogin(false);
        });
    }

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (scanInterval) clearInterval(scanInterval);
    };
  }, [useFaceLogin, isLoaded]);

  const handleFaceLogin = async (desc) => {
    setError('');
    try {
      const res = await fetch('/api/login-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faceDescriptor: desc })
      });
      
      const responseText = await res.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (err) {
        throw new Error('Server returned an invalid HTML response. Backend may be down.');
      }
      
      if (!res.ok) throw new Error(data.error || 'Face not recognized');

      localStorage.setItem('auth_token', data.token);
      setToken(data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
      setUseFaceLogin(false); // turn off camera on fail to let them try password
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const responseText = await res.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (err) {
        throw new Error('Server returned an invalid HTML response. Backend may be down.');
      }

      if (!res.ok) throw new Error(data.error || t('Login failed'));

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
        <HeartPulse size={80} color="#ff0505ff" style={{ margin: '0 auto 24px auto' }} />
        <h2 style={{ fontSize: '2.5rem', color: 'var(--primary)', marginBottom: '8px' }}>{t("Welcome Back")}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '40px' }}>{t("Sign in to CareAssistant")}</p>

        {error && <div className="alert-card danger" style={{ justifyContent: 'center' }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ background: 'var(--surface)', borderRadius: '20px', padding: '4px', display: 'flex', gap: '4px' }}>
            <button 
              onClick={() => setUseFaceLogin(false)}
              style={{ padding: '8px 16px', borderRadius: '16px', background: !useFaceLogin ? 'var(--primary)' : 'transparent', color: !useFaceLogin ? 'white' : 'var(--text-muted)', border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
            >
              Password
            </button>
            <button 
              onClick={() => setUseFaceLogin(true)}
              style={{ padding: '8px 16px', borderRadius: '16px', background: useFaceLogin ? 'var(--primary)' : 'transparent', color: useFaceLogin ? 'white' : 'var(--text-muted)', border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ScanFace size={18} /> Face Login
            </button>
          </div>
        </div>

        {useFaceLogin ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
             <div style={{ position: 'relative', width: '200px', height: '200px', borderRadius: '16px', overflow: 'hidden', border: '3px solid var(--primary)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
               <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
               {scanning && (
                 <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                   {isLoaded ? "Scanning Face..." : "Loading Models..."}
                 </div>
               )}
             </div>
             <p style={{ color: 'var(--text-muted)' }}>Position your face in the square to log in automatically.</p>
          </div>
        ) : (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ position: 'relative' }}>
              <User size={28} color="var(--primary)" style={{ position: 'absolute', top: '16px', left: '20px' }} />
              <input className="form-control" type="email" required placeholder={t("Email Address")}
                value={email} onChange={e => setEmail(e.target.value)} style={{ paddingLeft: '64px' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={28} color="var(--primary)" style={{ position: 'absolute', top: '16px', left: '20px' }} />
              <input className="form-control" type="password" required placeholder={t("Password")}
                value={password} onChange={e => setPassword(e.target.value)} style={{ paddingLeft: '64px' }} />
            </div>
            <button type="submit" className="btn btn-success" style={{ marginTop: '16px' }}>{t("Log In")}</button>
          </form>
        )}

        <p style={{ marginTop: '32px', fontSize: '1.1rem' }}>
          {t("No account yet? ")} <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{t("Register Here")}</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
