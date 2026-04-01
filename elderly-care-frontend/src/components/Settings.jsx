import React from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

function Settings() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '800px', margin: '0 auto' }}
    >
      <div className="card" style={{ width: '100%' }}>
        <h2 className="card-title" style={{ marginBottom: '30px' }}>
          <SettingsIcon size={32} color="var(--primary)" /> {t('Settings')}
        </h2>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', background: 'rgba(255,255,255,0.5)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.7)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'var(--accent)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Globe size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '4px' }}>{t('Language')}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{t('Select translation language')}</p>
            </div>
          </div>
          
          <div>
            <select 
              className="form-control" 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              style={{ width: '200px', cursor: 'pointer', appearance: 'auto' }}
            >
              <option value="en">{t('English')}</option>
              <option value="hi">{t('हिन्दी (Hindi)')}</option>
            </select>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Settings;
