import React from 'react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  disabled = false,
  ...props 
}) => {
  const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white',
    secondary: 'bg-secondary hover:bg-secondary-hover text-white',
    outline: 'border border-neutral-300 hover:border-neutral-400 text-neutral-700',
  };

  return (
    <button
      className={`
        ${variants[variant]}
        px-4 py-2
        rounded-lg font-medium
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};