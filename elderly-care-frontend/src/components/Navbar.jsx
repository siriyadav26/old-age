import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import {
  ActivitySquare, CalendarHeart, MessageCircleHeart,
  BrainCircuit, AlertTriangle, LogOut, HeartPulse, Wind, Settings as SettingsIcon
} from 'lucide-react';

function Navbar({ setToken }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    navigate('/login');
  };

  const NavItem = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link to={to} className={`nav-item ${isActive ? 'active' : ''}`}>
        <Icon size={28} strokeWidth={isActive ? 2.5 : 2} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <motion.nav
      className="top-navbar"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 70, damping: 15 }}
    >
      <div className="nav-brand">
        <HeartPulse size={40} color="#FF0505" />
        <span style={{ fontWeight: 'bold', fontSize: '1.6rem', color: 'white', marginLeft: '12px' }}>{t('appTitle')}</span>
      </div>

      <div className="nav-links">
        <NavItem to="/" icon={ActivitySquare} label={t('Dashboard')} />
        <NavItem to="/medications" icon={CalendarHeart} label={t('Medications')} />
        <NavItem to="/chatbot" icon={MessageCircleHeart} label={t('Chatbot')} />
        <NavItem to="/games" icon={BrainCircuit} label={t('Mind Care')} />
        <NavItem to="/breathe" icon={Wind} label={t('Breathe')} />
        <NavItem to="/settings" icon={SettingsIcon} label={t('Settings')} />
        <NavItem to="/alerts" icon={AlertTriangle} label={t('Alerts')} />
      </div>

      <div className="nav-actions">
        <button className="nav-logout-btn" onClick={handleLogout}>
          <LogOut size={28} />
          <span>{t('Logout')}</span>
        </button>
      </div>
    </motion.nav>
  );
}

export default Navbar;
