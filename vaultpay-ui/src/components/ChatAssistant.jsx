import React, { useState, useRef, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Bot, User, ChevronRight } from 'lucide-react';

const FAQ_OPTIONS = [
  { id: 'add_money', label: 'How to add money?', reply: 'To add money, navigate to the "Add Money" page from the bottom menu, enter your desired amount, and choose your payment method (Card or Bank).' },
  { id: 'transfer', label: 'How to transfer funds?', reply: 'To transfer funds, go to the "Transfer" section, enter the recipient\'s VaultPay email or phone number, enter the amount, and confirm the transaction.' },
  { id: 'bills', label: 'How to pay bills?', reply: 'You can pay bills in the "Bills" section. Select your biller (e.g., Internet, Electricity), enter your account details, and confirm the payment.' },
  { id: 'history', label: 'Where is my transaction history?', reply: 'Your complete transaction ledger is available under the "History" tab on the bottom navigation bar.' },
  { id: 'support', label: 'Talk to a human', reply: 'Please contact our 24/7 support team at support@vaultpay.com or call 1-800-VAULTPAY.' },
];

const INITIAL_MESSAGE = {
  id: Date.now(),
  type: 'bot',
  text: 'Hello! I am your VaultPay Assistant. How can I help you today?',
  options: FAQ_OPTIONS,
};

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleOptionClick = (option) => {
    // Add user message
    const userMsg = {
      // eslint-disable-next-line react-hooks/purity
      id: Date.now(),
      type: 'user',
      text: option.label,
    };
    
    setMessages((prev) => [...prev, userMsg]);

    // Simulate bot thinking then reply
    setTimeout(() => {
      const botReply = {
        id: Date.now() + 1,
        type: 'bot',
        text: option.reply,
        options: FAQ_OPTIONS, // Give them options again
      };
      setMessages((prev) => [...prev, botReply]);
    }, 600);
  };

  const handleReset = () => {
    setMessages([{...INITIAL_MESSAGE, id: Date.now()}]);
  };

  return (
    <div className="chat-assistant-container">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="chat-window"
          >
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="bot-avatar-header">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="chat-title">VaultPay Support</h3>
                  <span className="chat-status">Always online</span>
                </div>
              </div>
              <button className="chat-close-btn" onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="chat-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`message-wrapper ${msg.type}`}>
                  {msg.type === 'bot' && (
                    <div className="message-avatar bot-avatar">
                      <Bot size={16} />
                    </div>
                  )}
                  
                  <div className={`message-content ${msg.type}`}>
                    <p>{msg.text}</p>
                    
                    {msg.options && (
                      <div className="message-options">
                        {msg.options.map((opt) => (
                          <button
                            key={opt.id}
                            className="chat-option-btn"
                            onClick={() => handleOptionClick(opt)}
                          >
                            {opt.label}
                            <ChevronRight size={14} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.type === 'user' && (
                    <div className="message-avatar user-avatar">
                      <User size={16} />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {messages.length > 1 && (
               <div className="chat-footer">
                 <button className="chat-reset-btn" onClick={handleReset}>
                   Restart Conversation
                 </button>
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className="chat-fab"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>
    </div>
  );
}
