import React from 'react';

const Input = React.forwardRef(({ 
  label, 
  error, 
  className = '', 
  wrapperClassName = '', 
  ...props 
}, ref) => {
  return (
    <div className={`input-group ${wrapperClassName}`}>
      {label && <label className="input-label">{label}</label>}
      <input 
        ref={ref}
        className={`input ${error ? 'border-red-500' : ''} ${className}`}
        {...props} 
      />
      {error && <span className="text-sm text-red-500 mt-1">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
