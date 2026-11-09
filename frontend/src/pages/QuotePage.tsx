import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ArrowRight,
  Sparkles,
  Droplets,
  Truck,
  Building2,
  Home,
} from 'lucide-react';
import { StepIndicator } from '../components/cotizacion/StepIndicator';
import { StepDetails } from '../components/cotizacion/StepDetails';
import { StepContactInfo, ContactFormData } from '../components/cotizacion/StepContactInfo';
import { SERVICE_ID_TO_KEY, ServiceKey, PRICING, ADDONS } from '../data/pricing';
import { estimate, formatEstimatePrice } from '../utils/estimate';
import logoMNavy from '../assets/logo_m_navy.jpg';

const formatFullDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const formatPhoneNumber = (phoneStr?: string) => {
  if (!phoneStr) return '';
  const cleaned = phoneStr.replace(/\D/g, '');
  const num = cleaned.length === 11 && cleaned.startsWith('1') ? cleaned.slice(1) : cleaned;
  if (num.length === 10) {
    return `(${num.slice(0, 3)}) ${num.slice(3, 6)}-${num.slice(6)}`;
  }
  return phoneStr;
};

const formatTimeLabel = (timeStr?: string) => {
  if (!timeStr || timeStr === 'flexible') return 'Flexible (Anytime)';
  if (timeStr === 'morning') return 'Morning (8am – 12pm)';
  if (timeStr === 'afternoon') return 'Afternoon (12pm – 4pm)';
  return timeStr;
};

interface CleaningService {
  id: string;
  label: string;
  startingPrice: string;
  description: string;
  icon: React.ReactNode;
  isCommercial?: boolean;
}

const CLEANING_SERVICES: CleaningService[] = [
  {
    id: 'regular_cleaning',
    label: 'Standard Cleaning',
    startingPrice: 'From $135+',
    description: 'Upkeep of living spaces, kitchens, bathrooms, dusting, vacuuming, and floor mopping.',
    icon: <Sparkles size={24} />,
  },
  {
    id: 'deep_cleaning',
    label: 'Deep Cleaning',
    startingPrice: 'From $250+',
    description: 'First visit or seasonal clean: baseboards, detailed corners, fans, blinds, and scrubbed grout.',
    icon: <Droplets size={24} />,
  },
  {
    id: 'move_in_cleaning',
    label: 'Move-In or Move-Out',
    startingPrice: 'From $275+',
    description: 'Top-to-bottom turnover clean: inside empty cabinets, closets, and fully sanitized property.',
    icon: <Truck size={24} />,
  },
  {
    id: 'commercial_cleaning',
    label: 'Commercial Cleaning',
    startingPrice: 'Custom quote',
    description: 'Direct corporate consultation & customized walkthrough for offices, facilities, and workspaces.',
    icon: <Building2 size={24} />,
    isCommercial: true,
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
  const [quoteReference, setQuoteReference] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSelectService = (id: string) => {
    if (selectedService !== id) {
      setSelectedService(id);
      setSelectedSizeId(null);
      setSelectedAddons({});
    }
  };

  const handleKeyDownRadiogroup = (e: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % CLEANING_SERVICES.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + CLEANING_SERVICES.length) % CLEANING_SERVICES.length;
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleSelectService(CLEANING_SERVICES[currentIndex].id);
      return;
    } else {
      return;
    }

    const nextService = CLEANING_SERVICES[nextIndex];
    handleSelectService(nextService.id);
    const el = document.getElementById(`service-radio-${nextService.id}`);
    if (el) el.focus();
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
    setIsSubmitting(true);
    setSubmitError(null);

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
        addons: selectedAddons,
        addonLabels: activeAddonNames,
        serviceLabel: activeServiceObj?.label,
        sizeLabel: sizeOption?.label,
        estimatedPrice: finalPriceDisplay,
        nombre: formData.fullName,
        email: formData.email,
        telefono: formData.phone,
        direccion: formData.address || 'St. Cloud & surrounding areas',
        notas: formData.notes || '',
        frequency: formData.frequency,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
      };

      const res = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || 'Server error occurred');
      }

      const resData = await res.json().catch(() => null);
      const generatedCode =
        resData?.data?.codigo ||
        resData?.codigo ||
        `COT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      setQuoteReference(generatedCode);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error al registrar cotización en backend:', err);
      setSubmitError(
        'We could not submit your quote due to a connection or server error. Please try again or call Marcela directly at (320) 249-3106.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setStep(1);
    setSelectedService('');
    setSelectedSizeId(null);
    setSelectedAddons({});
    setContactInfo(null);
    setQuoteReference(null);
    setSubmitError(null);
    setIsSubmitting(false);
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

      {!submitted && (
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
      )}

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

            <div className="success-logo-circle" aria-hidden="true">
              <img src={logoMNavy} alt="Marcela's Cleaning Services" className="success-logo-img" />
            </div>

            <h2 className="success-title">Quote Request Received!</h2>
            <p className="success-subtitle">
              Thank you, <strong>{contactInfo?.fullName}</strong>! Marcela has received your cleaning request and will review your property details.
            </p>

            <div className="success-recap-box">
              <div className="recap-header">
                <span>Summary of Your Request</span>
              </div>

              <div className="recap-row">
                <span className="recap-label">Service:</span>
                <strong className="recap-value">{activeServiceObj?.label}</strong>
              </div>

              {sizeOption && (
                <div className="recap-row">
                  <span className="recap-label">{currentPricing?.sizeLabel || 'Layout / Size'}:</span>
                  <strong className="recap-value">{sizeOption.label}</strong>
                </div>
              )}

              {contactInfo?.frequency && (
                <div className="recap-row">
                  <span className="recap-label">Frequency:</span>
                  <strong className="recap-value" style={{ textTransform: 'capitalize' }}>
                    {contactInfo.frequency === 'bi-weekly' ? 'Every 2 weeks' : contactInfo.frequency}
                  </strong>
                </div>
              )}

              {contactInfo?.preferredDate && (
                <div className="recap-row">
                  <span className="recap-label">Preferred Date:</span>
                  <strong className="recap-value">
                    {formatFullDate(contactInfo.preferredDate)}
                    {contactInfo.preferredTime && ` • ${formatTimeLabel(contactInfo.preferredTime)}`}
                  </strong>
                </div>
              )}

              {contactInfo?.address && (
                <div className="recap-row">
                  <span className="recap-label">Location:</span>
                  <strong className="recap-value">{contactInfo.address}</strong>
                </div>
              )}

              {Object.keys(selectedAddons).length > 0 && (
                <div className="recap-row recap-addons-row">
                  <span className="recap-label">Add-ons:</span>
                  <div className="recap-addons-pill-list">
                    {Object.entries(selectedAddons)
                      .filter(([_, qty]) => qty > 0)
                      .map(([id, qty]) => {
                        const item = ADDONS.find((a) => a.id === id);
                        if (!item) return null;
                        const qtyText =
                          item.unit === 'each'
                            ? ` (${qty} ${qty === 1 ? 'window' : 'windows'})`
                            : item.unit === 'hour'
                            ? ` (${qty} hrs)`
                            : qty > 1
                            ? ` (x${qty})`
                            : '';
                        return (
                          <span key={id} className="recap-addon-tag">
                            + {item.label}{qtyText}
                          </span>
                        );
                      })
                      .filter(Boolean)}
                  </div>
                </div>
              )}

              <div className="recap-price-highlight">
                <div className="recap-price-meta">
                  <span className="recap-price-title">Estimated Price</span>
                  <span className="recap-price-subtitle">Final price confirmed upon scheduling</span>
                </div>
                <strong className="recap-price-amount">{finalPriceDisplay}</strong>
              </div>
            </div>

            <div className="success-action-buttons">
              <button
                type="button"
                className="btn-success-primary"
                onClick={() => navigate('/')}
              >
                <Home size={18} />
                <span>Back to Home</span>
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

            <div
              className="services-selection-grid"
              role="radiogroup"
              aria-label="Cleaning services"
            >
              {CLEANING_SERVICES.map((service, index) => {
                const isSelected = selectedService === service.id;

                return (
                  <div
                    key={service.id}
                    id={`service-radio-${service.id}`}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={isSelected || (!selectedService && index === 0) ? 0 : -1}
                    className={`service-card-interactive service-card-executive ${service.isCommercial ? 'service-card--commercial' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectService(service.id)}
                    onKeyDown={(e) => handleKeyDownRadiogroup(e, index)}
                  >

                    <div className="svc-interactive-img-placeholder">
                      <span className="svc-interactive-price-tag">
                        {service.startingPrice}
                      </span>
                    </div>

                    <div className="svc-interactive-body">
                      <h3 className="svc-interactive-title">{service.label}</h3>
                      <p className="svc-interactive-desc">{service.description}</p>
                    </div>

                    {isSelected && (
                      <div className="svc-interactive-check-corner">
                        <div className="service-radio-indicator">
                          <Check size={14} className="check-svg" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="quote-footer-action sticky-mobile">
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
            initialData={contactInfo}
            isSubmitting={isSubmitting}
            submitError={submitError}
            onEditService={() => setStep(1)}
            onEditDetails={() => setStep(2)}
            onSubmit={handleContactSubmit}
          />
        ) : null}
      </div>
    </div>
  );
};
