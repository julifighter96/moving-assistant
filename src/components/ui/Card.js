import React from 'react';

export const Card = ({ children, className = '', ...props }) => (
  <div 
    className={`bg-white rounded-lg shadow-sm ${className}`} 
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ title, subtitle, className = '', ...props }) => (
  <div className={`p-6 border-b border-gray-200 ${className}`} {...props}>
    <h2 className="text-xl font-semibold">{title}</h2>
    {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
  </div>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);