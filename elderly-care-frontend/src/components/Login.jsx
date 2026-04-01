import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, HeartPulse } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

function Login({ setToken }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
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

        <p style={{ marginTop: '32px', fontSize: '1.1rem' }}>
          {t("No account yet? ")} <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{t("Register Here")}</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
