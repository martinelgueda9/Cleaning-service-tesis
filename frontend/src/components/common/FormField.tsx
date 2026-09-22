import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  
  htmlFor: string;
  
  label: string;
  
  required?: boolean;
  
  error?: string;
  
  hint?: string;
  
  extra?: React.ReactNode;
  
  children: React.ReactNode;
  
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  htmlFor,
  label,
  required = false,
  error,
  hint,
  extra,
  children,
  className = '',
}) => {
  return (
    <div className={`form-field ${error ? 'form-field--error' : ''} ${className}`}>
      <label htmlFor={htmlFor} className="form-field__label">
        <span>
          {label}
          {required && <span className="form-field__required"> *</span>}
        </span>
        {hint && <span className="form-field__hint">{hint}</span>}
        {extra && <span className="form-field__extra">{extra}</span>}
      </label>

      {children}

      {error && (
        <span className="form-field__error" role="alert">
          <AlertCircle size={12} />
          {error}
        </span>
      )}
    </div>
  );
};
