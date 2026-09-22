import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  
  loading?: boolean;
  
  loadingText?: string;
  
  icon?: LucideIcon;
  
  label?: string;
  
  variant?: 'primary' | 'secondary';
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  loading = false,
  loadingText = 'Sending...',
  icon: Icon,
  label,
  variant = 'primary',
  children,
  className = '',
  disabled,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type="submit"
      className={`submit-btn submit-btn--${variant} ${isDisabled ? 'submit-btn--disabled' : ''} ${className}`}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <>
          <div className="submit-btn__spinner" />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {Icon && <Icon size={18} />}
          {label && <span>{label}</span>}
          {children}
        </>
      )}
    </button>
  );
};
