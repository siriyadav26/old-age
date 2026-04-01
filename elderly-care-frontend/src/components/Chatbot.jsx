import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

function Chatbot() {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([
    { sender: 'bot', text: t('Hello! I am your Care Companion. How are you feeling today? 🌼') }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text })
      });
      const data = await res.json();
      
      setIsTyping(false);
      setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
    } catch (err) {
      console.error(err);
      setIsTyping(false);
      setMessages(prev => [...prev, { sender: 'bot', text: t('Sorry, I am having trouble connecting right now.') }]);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="chat-container">
      <div className="chat-messages">
        <AnimatePresence>
        {messages.map((msg, idx) => (
          <motion.div 
            key={idx} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`chat-bubble-wrapper ${msg.sender}`}
          >
             <div className={`chat-avatar ${msg.sender === 'user' ? 'user-avatar' : ''}`}>
                {msg.sender === 'bot' ? <Bot size={24} /> : <User size={24} />}
             </div>
             <div className={`bubble ${msg.sender}`}>
                {msg.text}
             </div>
          </motion.div>
        ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="chat-bubble-wrapper bot">
             <div className="chat-avatar"><Bot size={24} /></div>
             <div className="bubble bot" style={{ display: 'flex', gap: '6px', alignItems: 'center', minHeight: '44px' }}>
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} style={{ width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%' }} />
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} style={{ width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%' }} />
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} style={{ width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%' }} />
             </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={sendMessage} className="chat-input-area">
        <input 
          type="text" 
          placeholder={t("Type message...")} 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isTyping}
        />
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} type="submit" disabled={isTyping} style={{ opacity: isTyping ? 0.5 : 1 }}>
          <Send size={24} />
        </motion.button>
      </form>
    </motion.div>
  );
}

export default Chatbot;
