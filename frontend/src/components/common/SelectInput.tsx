import React from 'react';

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  
  hasError?: boolean;
  
  children: React.ReactNode;
}

export const SelectInput: React.FC<SelectInputProps> = ({
  hasError = false,
  className = '',
  children,
  ...rest
}) => {
  return (
    <select
      className={`form-control form-control--select ${hasError ? 'form-control--error' : ''} ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
};
