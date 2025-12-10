import React from 'react';

const SimpleButton = ({ 
  children, 
  onClick, 
  style = {}, 
  variant = 'primary',
  className = '',
  ...props 
}) => {
  const baseStyles = {
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'center',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    outline: 'none',
    width: '100%'
  };

  const variantStyles = {
    primary: {
      backgroundColor: '#3b82f6',
      color: 'white',
    },
    secondary: {
      backgroundColor: '#6b7280',
      color: 'white',
    },
    success: {
      backgroundColor: '#10b981',
      color: 'white',
    }
  };

  const handleMouseEnter = (e) => {
    if (variant === 'primary') {
      e.target.style.backgroundColor = '#2563eb';
    } else if (variant === 'secondary') {
      e.target.style.backgroundColor = '#4b5563';
    } else if (variant === 'success') {
      e.target.style.backgroundColor = '#059669';
    }
    e.target.style.transform = 'translateY(-1px)';
    e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
  };

  const handleMouseLeave = (e) => {
    if (variant === 'primary') {
      e.target.style.backgroundColor = '#3b82f6';
    } else if (variant === 'secondary') {
      e.target.style.backgroundColor = '#6b7280';
    } else if (variant === 'success') {
      e.target.style.backgroundColor = '#10b981';
    }
    e.target.style.transform = 'translateY(0)';
    e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
  };

  const finalStyles = {
    ...baseStyles,
    ...variantStyles[variant],
    ...style
  };

  return (
    <div
      role="button"
      tabIndex={0}
      style={finalStyles}
      className={className}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick && onClick(e);
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
};

export default SimpleButton;
