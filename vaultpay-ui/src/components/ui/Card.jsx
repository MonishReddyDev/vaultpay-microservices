import React from 'react';
import { motion as Motion } from 'framer-motion';

const Card = ({ 
  children, 
  className = '', 
  animate = true,
  delay = 0,
  ...props 
}) => {
  const baseClass = `card ${className}`;
  
  if (!animate) {
    return (
      <div className={baseClass} {...props}>
        {children}
      </div>
    );
  }

  return (
    <Motion.div
      className={baseClass}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      {...props}
    >
      {children}
    </Motion.div>
  );
};

export default Card;
