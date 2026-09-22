import React from 'react';
import { LucideIcon } from 'lucide-react';

interface TextareaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  
  icon?: LucideIcon;
  
  hasError?: boolean;
}

export const TextareaInput: React.FC<TextareaInputProps> = ({
  icon: Icon,
  hasError = false,
  className = '',
  ...rest
}) => {
  if (Icon) {
    return (
      <div className={`input-with-icon textarea-wrap ${hasError ? 'input-with-icon--error' : ''}`}>
        <Icon size={18} className="input-icon" />
        <textarea
          className={`form-control form-control--textarea ${hasError ? 'form-control--error' : ''} ${className}`}
          {...rest}
        />
      </div>
    );
  }

  return (
    <textarea
      className={`form-control form-control--textarea ${hasError ? 'form-control--error' : ''} ${className}`}
      {...rest}
    />
  );
};
