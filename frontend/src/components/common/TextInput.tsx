import React from 'react';
import { LucideIcon } from 'lucide-react';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  
  icon?: LucideIcon;
  
  hasError?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  icon: Icon,
  hasError = false,
  className = '',
  ...rest
}) => {
  if (Icon) {
    return (
      <div className={`input-with-icon ${hasError ? 'input-with-icon--error' : ''}`}>
        <Icon size={18} className="input-icon" />
        <input
          className={`form-control ${hasError ? 'form-control--error' : ''} ${className}`}
          {...rest}
        />
      </div>
    );
  }

  return (
    <input
      className={`form-control ${hasError ? 'form-control--error' : ''} ${className}`}
      {...rest}
    />
  );
};
