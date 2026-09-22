import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

interface StepItem {
  number: number;
  label: string;
}

const STEPS: StepItem[] = [
  { number: 1, label: 'Service' },
  { number: 2, label: 'Details' },
  { number: 3, label: 'Your info' },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, onStepClick }) => {
  return (
    <div className="quote-step-indicator-wrapper" aria-label="Progress steps">
      <div className="quote-step-track">
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;
          const isClickable = isCompleted && onStepClick;

          return (
            <React.Fragment key={step.number}>
              <div
                className={`step-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${
                  isClickable ? 'clickable' : ''
                }`}
                onClick={() => isClickable && onStepClick(step.number)}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
              >
                <div className="step-badge">
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : step.number}
                </div>
                <span className="step-label">{step.label}</span>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  className={`step-connector ${currentStep > step.number ? 'filled' : ''}`}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
