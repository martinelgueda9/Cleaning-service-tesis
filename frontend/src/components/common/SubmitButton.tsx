import React from 'react';
import { LucideIcon } from 'lucide-react';
import { MopSpinner } from './MopSpinner';

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  icon?: LucideIcon;
  label?: string;
  variant?: 'primary' | 'secondary';
  spinner?: 'ring' | 'mop';
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  loading = false,
  loadingText = 'Sending...',
  icon: Icon,
  label,
  variant = 'primary',
  spinner = 'ring',
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
          {spinner === 'mop' ? <MopSpinner size={18} /> : <div className="submit-btn__spinner" />}
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
