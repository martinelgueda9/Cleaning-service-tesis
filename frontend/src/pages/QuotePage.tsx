import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Check, 
  ArrowRight
} from 'lucide-react';
import { StepIndicator } from '../components/cotizacion/StepIndicator';
import { StepDetails } from '../components/cotizacion/StepDetails';
import { StepContactInfo, ContactFormData } from '../components/cotizacion/StepContactInfo';
import { SERVICE_ID_TO_KEY, ServiceKey, PRICING, ADDONS } from '../data/pricing';
import { estimate, formatEstimatePrice } from '../utils/estimate';

interface CleaningService {
  id: string;
  label: string;
  tagline: string;
  description: string;
}

const CLEANING_SERVICES: CleaningService[] = [
  {
    id: 'regular_cleaning',
    label: 'Standard Cleaning',
    tagline: 'Routine maintenance for homes in normal condition • From $135+',
    description: 'Upkeep of living spaces, kitchens, bathrooms, dusting, vacuuming, and floor mopping.',
  },
  {
    id: 'deep_cleaning',
    label: 'Deep Cleaning',
    tagline: 'More time, more detail, and a deeper clean • From $250+',
    description: 'First visit or seasonal clean: baseboards, detailed corners, fans, blinds, and scrubbed tile & grout.',
  },
  {
    id: 'move_in_cleaning',
    label: 'Move-In Cleaning',
    tagline: 'Fresh start & sanitized turnover • From $275+',
    description: 'Top-to-bottom clean before unpacking: inside empty cabinets, closets, drawers, and sanitized living areas.',
  },
  {
    id: 'move_out_cleaning',
    label: 'Move-Out Cleaning',
    tagline: 'Deposit & inspection ready • From $275+',
    description: 'Full turnover clean to leave empty properties spotless for landlords, inspectors, or upcoming buyers.',
  },
  {
    id: 'commercial_cleaning',
    label: 'Commercial Cleaning',
    tagline: 'Offices & professional workspaces • Custom quote',
    description: 'Direct corporate consultation & customized walkthrough for offices, facilities, and business spaces.',
  },
];

export const QuotePage: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});
  const [contactInfo, setContactInfo] = useState<ContactFormData | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSelectService = (id: string) => {
    if (selectedService !== id) {
      setSelectedService(id);
      setSelectedSizeId(null);
      setSelectedAddons({});
    }
  };

  const handleStep1Continue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    if (selectedService === 'commercial_cleaning') {
      navigate('/contact');
      return;
    }

    setStep(2);
  };

  const handleToggleAddon = (addonId: string) => {
    setSelectedAddons((prev) => {
      const current = prev[addonId] || 0;
      if (current > 0) {
        const next = { ...prev };
        delete next[addonId];
        return next;
      }
      return { ...prev, [addonId]: 1 };
    });
  };

  const handleChangeAddonQty = (addonId: string, qty: number) => {
    if (qty <= 0) {
      handleToggleAddon(addonId);
      return;
    }
    setSelectedAddons((prev) => ({
      ...prev,
      [addonId]: qty,
    }));
  };

  const handleContactSubmit = async (formData: ContactFormData) => {
    setContactInfo(formData);
    setSubmitted(true);

    try {
      const activeAddonNames = Object.entries(selectedAddons)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => {
          const item = ADDONS.find((a) => a.id === id);
          return item ? `${item.label}${item.unit !== 'flat' ? ` (x${qty})` : ''}` : '';
        })
        .filter(Boolean);

      const payload = {
        serviceType: selectedService,
        sizeId: selectedSizeId,
        addons: activeAddonNames,
        serviceLabel: activeServiceObj?.label,
        sizeLabel: sizeOption?.label,
        estimatedPrice: finalPriceDisplay,
        nombre: formData.fullName,
        email: formData.email,
        telefono: formData.phone,
        direccion: formData.address || 'St. Cloud & surrounding areas',
        notas: `[Frecuencia: ${formData.frequency}]${formData.preferredDate ? ` [Fecha preferida: ${formData.preferredDate} (${formData.preferredTime})]` : ''} ${formData.notes || ''}`.trim(),
        frequency: formData.frequency,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
      };

      await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Error al registrar cotización en backend:', err);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setStep(1);
    setSelectedService('');
    setSelectedSizeId(null);
    setSelectedAddons({});
    setContactInfo(null);
  };

  const activeServiceObj = CLEANING_SERVICES.find((s) => s.id === selectedService);
  const rawKey = selectedService ? SERVICE_ID_TO_KEY[selectedService] : null;
  const serviceKey: ServiceKey | null = rawKey && rawKey !== 'commercial' ? rawKey : null;

  const currentPricing = serviceKey ? PRICING[serviceKey] : null;
  const sizeOption = currentPricing?.options.find((opt) => opt.id === selectedSizeId);
  const estimateResult = serviceKey
    ? estimate(serviceKey, selectedSizeId, selectedAddons)
    : null;
  const { display: finalPriceDisplay } = formatEstimatePrice(
    estimateResult,
    Boolean(selectedSizeId)
  );

  return (
    <div className="quote-page-wrapper">
      
      <div className="quote-nav-bar">
        <button
          className="btn-back"
          onClick={() => {
            if (step === 1) {
              navigate('/');
            } else if (step === 2) {
              setStep(1);
            } else if (step === 3) {
              setStep(2);
            }
          }}
        >
          <ArrowLeft size={18} />
          {step === 1 ? 'Back to Home' : step === 2 ? 'Back to Services' : 'Back to Details'}
        </button>
      </div>

      <div className="quote-card-modern">
        
        {!submitted && (
          <StepIndicator
            currentStep={step}
            onStepClick={(targetStep) => {
              if (targetStep < step) {
                setStep(targetStep);
              }
            }}
          />
        )}

        {submitted ? (
          
          <div className="quote-success-modern">
            <h2>Quote Request Received!</h2>
            <p className="success-summary">
              Thank you, <strong>{contactInfo?.fullName}</strong>! We have received your request for{' '}
              <strong>{activeServiceObj?.label}</strong>.
            </p>

            <div className="success-recap-box">
              <div className="recap-header">
                <span>Request Summary</span>
              </div>
              <div className="recap-row">
                <span>Service:</span>
                <strong>{activeServiceObj?.label}</strong>
              </div>
              {sizeOption && (
                <div className="recap-row">
                  <span>Layout / Size:</span>
                  <strong>{sizeOption.label}</strong>
                </div>
              )}
              {contactInfo?.preferredDate && (
                <div className="recap-row">
                  <span>Preferred Date:</span>
                  <strong>{contactInfo.preferredDate}</strong>
                </div>
              )}
              {Object.keys(selectedAddons).length > 0 && (
                <div className="recap-row">
                  <span>Add-ons:</span>
                  <strong>
                    {Object.entries(selectedAddons)
                      .map(([id, qty]) => {
                        const item = ADDONS.find((a) => a.id === id);
                        return item ? `${item.label}${item.unit !== 'flat' ? ` (x${qty})` : ''}` : '';
                      })
                      .filter(Boolean)
                      .join(', ')}
                  </strong>
                </div>
              )}
              <div className="recap-row recap-price-row">
                <span>Estimated Price:</span>
                <strong className="recap-price">{finalPriceDisplay}</strong>
              </div>
              <div className="recap-disclaimer">
                Final price depends on size, condition, and scope of work.
              </div>
            </div>

            <div className="success-contact-notice">
              <p>
                Our team will reach out to you shortly at <strong>{contactInfo?.phone}</strong> or{' '}
                <strong>{contactInfo?.email}</strong> with full availability and schedule confirmation.
              </p>
            </div>

            <div className="success-actions">
              <button type="button" className="btn-primary" onClick={() => navigate('/')}>
                Exit
              </button>
            </div>
          </div>
        ) : step === 1 ? (
          
          <form onSubmit={handleStep1Continue} className="quote-form-modern">
            <div className="quote-hero-header">
              <h1 className="quote-title">Select Type of Cleaning</h1>
              <p className="quote-subtitle">
                Choose the service that best matches your space to get started with your customized estimate.
              </p>
            </div>

            <div className="services-selection-list">
              {CLEANING_SERVICES.map((service) => {
                const isSelected = selectedService === service.id;

                return (
                  <div
                    key={service.id}
                    role="button"
                    tabIndex={0}
                    className={`service-card-executive ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectService(service.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectService(service.id);
                      }
                    }}
                  >
                    <div className="service-info-col">
                      <span className="service-tagline">{service.tagline}</span>
                      <h3 className="service-heading">{service.label}</h3>
                      <p className="service-desc">{service.description}</p>
                    </div>

                    <div className="service-check-col">
                      <div className="service-radio-indicator">
                        {isSelected && <Check size={14} className="check-svg" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="quote-footer-action">
              <button
                type="submit"
                className={`quote-submit-modern ${!selectedService ? 'disabled' : ''}`}
                disabled={!selectedService}
              >
                <span>
                  {selectedService === 'commercial_cleaning'
                    ? 'Contact for Commercial Quote'
                    : selectedService
                    ? `Continue with ${activeServiceObj?.label}`
                    : 'Select a Service to Continue'}
                </span>
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        ) : step === 2 && serviceKey ? (
          
          <StepDetails
            serviceKey={serviceKey}
            selectedSizeId={selectedSizeId}
            onSelectSize={(sizeId) => setSelectedSizeId(sizeId)}
            selectedAddons={selectedAddons}
            onToggleAddon={handleToggleAddon}
            onChangeAddonQty={handleChangeAddonQty}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        ) : step === 3 && serviceKey ? (
          
          <StepContactInfo
            serviceKey={serviceKey}
            selectedSizeId={selectedSizeId}
            selectedAddons={selectedAddons}
            onBack={() => setStep(2)}
            onSubmit={handleContactSubmit}
          />
        ) : null}
      </div>
    </div>
  );
};
