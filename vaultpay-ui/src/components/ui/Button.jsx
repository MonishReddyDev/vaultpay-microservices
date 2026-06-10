import React from 'react';
import { motion as Motion } from 'framer-motion';

const Button = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  disabled = false, 
  type = 'button', 
  ...props 
}) => {
  const baseClass = `btn-${variant} ${className}`;

  return (
    <Motion.button
      type={type}
      className={baseClass}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      {...props}
    >
      {children}
    </Motion.button>
  );
};

export default Button;
