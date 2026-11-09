import React, { useState } from 'react';
import {
  Check,
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  PhoneCall
} from 'lucide-react';
import { PRICING, ADDONS, ServiceKey, SERVICE_KEY_TO_NAME } from '../../data/pricing';
import { estimate, formatEstimatePrice } from '../../utils/estimate';
import { FormField, TextInput, TextareaInput } from '../common';

export interface ContactFormData {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  frequency: string;
  preferredDate: string;
  preferredTime: string;
}

interface StepContactInfoProps {
  serviceKey: ServiceKey;
  selectedSizeId: string | null;
  selectedAddons: Record<string, number>;
  initialData?: ContactFormData | null;
  isSubmitting?: boolean;
  submitError?: string | null;
  onEditService: () => void;
  onEditDetails: () => void;
  onSubmit: (formData: ContactFormData) => void;
}

export const StepContactInfo: React.FC<StepContactInfoProps> = ({
  serviceKey,
  selectedSizeId,
  selectedAddons,
  initialData,
  isSubmitting = false,
  submitError = null,
  onEditService,
  onEditDetails,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<ContactFormData>(() => ({
    fullName: initialData?.fullName || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    notes: initialData?.notes || '',
    frequency: initialData?.frequency || 'one-time',
    preferredDate: initialData?.preferredDate || '',
    preferredTime: initialData?.preferredTime || 'flexible',
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  const serviceConfig = PRICING[serviceKey];
  const serviceName = SERVICE_KEY_TO_NAME[serviceKey] || 'Cleaning Service';
  const sizeOption = serviceConfig?.options.find((opt) => opt.id === selectedSizeId);

  const estimateResult = estimate(serviceKey, selectedSizeId, selectedAddons);
  const { display: priceDisplay, isCustomQuote } = formatEstimatePrice(
    estimateResult,
    Boolean(selectedSizeId)
  );

  const activeAddonsList = Object.entries(selectedAddons)
    .filter(([_, qty]) => qty > 0)
    .map(([id, qty]) => {
      const addon = ADDONS.find((a) => a.id === id);
      if (!addon) return null;
      let costText = '';
      if (addon.unit === 'flat') {
        costText = addon.min === addon.max ? `$${addon.min}` : `$${addon.min}–$${addon.max}`;
      } else if (addon.unit === 'each') {
        costText = `$${addon.min * qty}–$${addon.max * qty}`;
      } else if (addon.unit === 'hour') {
        costText = `$${addon.min * qty}`;
      }
      return { ...addon, qty, costText };
    })
    .filter(Boolean);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Please enter your full name';
    if (!formData.phone.trim()) newErrors.phone = 'Please enter your phone number';
    if (!formData.email.trim()) newErrors.email = 'Please enter your email address';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorKey = Object.keys(newErrors)[0];
      const el = document.getElementById(firstErrorKey);
      if (el) el.focus();
      return;
    }

    onSubmit(formData);
  };

  const formattedSelectedDate = formData.preferredDate
    ? new Date(formData.preferredDate + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="quote-step-details-container">

      <div className="quote-step-header">
        <h2 className="step-title">Your Contact & Property Info</h2>
        <p className="step-subtitle">
          Where should we send your official confirmation and schedule?
        </p>
      </div>

      <div className="step-details-config-layout">

        <div className="step-details-main-col">
          <form id="contact-step-form" onSubmit={handleSubmit} className="contact-form-sections">

            <div className="quote-section-block form-section-card">
              <div className="section-title-wrap">
                <span className="section-step-num">1</span>
                <div>
                  <span className="form-group-kicker">CONTACT INFORMATION</span>
                  <h3 className="section-title">How can we reach you?</h3>
                  <p className="section-caption">
                    We will send your quote breakdown and booking details here.
                  </p>
                </div>
              </div>

              <div className="form-fields-stack">
                <FormField
                  htmlFor="fullName"
                  label="Full Name"
                  required
                  error={errors.fullName}
                >
                  <TextInput
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Jane Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    hasError={!!errors.fullName}
                    autoComplete="name"
                  />
                </FormField>

                <div className="form-row-dual">
                  <FormField
                    htmlFor="phone"
                    label="Phone Number"
                    required
                    error={errors.phone}
                  >
                    <TextInput
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="(320) 555-0123"
                      value={formData.phone}
                      onChange={handleChange}
                      hasError={!!errors.phone}
                      autoComplete="tel"
                    />
                  </FormField>

                  <FormField
                    htmlFor="email"
                    label="Email Address"
                    required
                    error={errors.email}
                  >
                    <TextInput
                      id="email"
                      name="email"
                      type="email"
                      placeholder="jane@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      hasError={!!errors.email}
                      autoComplete="email"
                    />
                  </FormField>
                </div>
              </div>
            </div>

            <div className="quote-section-block form-section-card">
              <div className="section-title-wrap">
                <span className="section-step-num">2</span>
                <div>
                  <span className="form-group-kicker">SERVICE DETAILS</span>
                  <h3 className="section-title">When and where?</h3>
                  <p className="section-caption">
                    Select your preferred frequency, date, and service location.
                  </p>
                </div>
              </div>

              <div className="form-fields-stack">

                <div className="form-field-block">
                  <label className="form-label-custom">Preferred Frequency</label>
                  <div className="chips-selector-group" role="radiogroup" aria-label="Preferred Frequency">
                    {[
                      { id: 'one-time', label: 'One-time' },
                      { id: 'weekly', label: 'Weekly' },
                      { id: 'bi-weekly', label: 'Every 2 weeks' },
                      { id: 'monthly', label: 'Monthly' },
                    ].map((freq) => (
                      <button
                        key={freq.id}
                        type="button"
                        role="radio"
                        aria-checked={formData.frequency === freq.id}
                        className={`chip-btn ${formData.frequency === freq.id ? 'active' : ''}`}
                        onClick={() => setFormData((prev) => ({ ...prev, frequency: freq.id }))}
                      >
                        {formData.frequency === freq.id && (
                          <Check size={14} strokeWidth={3} className="chip-check-icon" />
                        )}
                        <span>{freq.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-row-dual date-time-row">
                  <div className="form-field-block">
                    <label htmlFor="preferredDate" className="form-label-custom">
                      Preferred Date <span className="field-optional">(optional)</span>
                    </label>
                    <div className="date-picker-wrapper">
                      <Calendar size={18} className="date-input-icon" />
                      <input
                        id="preferredDate"
                        name="preferredDate"
                        type="date"
                        lang="en-US"
                        min={todayStr}
                        value={formData.preferredDate}
                        onChange={handleChange}
                        className="styled-date-input"
                      />
                    </div>
                    {formattedSelectedDate && (
                      <span className="selected-date-preview">
                        Selected: <strong>{formattedSelectedDate}</strong>
                      </span>
                    )}
                  </div>

                  <div className="form-field-block">
                    <label className="form-label-custom">
                      Preferred Time <span className="field-optional">(optional)</span>
                    </label>
                    <div className="chips-selector-group time-chips" role="radiogroup" aria-label="Preferred Time">
                      {[
                        { id: 'morning', label: 'Morning', sub: '8am – 12pm' },
                        { id: 'afternoon', label: 'Afternoon', sub: '12pm – 4pm' },
                        { id: 'flexible', label: 'Flexible', sub: 'Anytime' },
                      ].map((timeOption) => (
                        <button
                          key={timeOption.id}
                          type="button"
                          role="radio"
                          aria-checked={formData.preferredTime === timeOption.id}
                          className={`chip-btn chip-btn-stacked ${formData.preferredTime === timeOption.id ? 'active' : ''}`}
                          onClick={() => setFormData((prev) => ({ ...prev, preferredTime: timeOption.id }))}
                        >
                          <span className="chip-primary-label">{timeOption.label}</span>
                          <span className="chip-secondary-label">{timeOption.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <FormField
                  htmlFor="address"
                  label="Service Address or City (St. Cloud & surrounding areas)"
                >
                  <TextInput
                    id="address"
                    name="address"
                    type="text"
                    placeholder="e.g. 123 Main St, St. Cloud, MN"
                    value={formData.address}
                    onChange={handleChange}
                    autoComplete="street-address"
                  />
                </FormField>
              </div>
            </div>

            <div className="quote-section-block form-section-card">
              <div className="section-title-wrap">
                <span className="section-step-num">3</span>
                <div>
                  <span className="form-group-kicker">ANYTHING ELSE?</span>
                  <h3 className="section-title">Special requests</h3>
                  <p className="section-caption">
                    Tell us about pets, priority areas, key/entry instructions, or special needs.
                  </p>
                </div>
              </div>

              <div className="form-fields-stack">
                <FormField
                  htmlFor="notes"
                  label="Notes or Property Condition Details"
                >
                  <TextareaInput
                    id="notes"
                    name="notes"
                    rows={3}
                    placeholder="e.g. Friendly dog at home, please focus on the master bathroom, gate code is #1234..."
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </FormField>
              </div>
            </div>

            {submitError && (
              <div className="quote-submit-error-banner" role="alert">
                <AlertCircle size={20} className="error-banner-icon" />
                <div className="error-banner-text">
                  <strong>Submission Error:</strong>
                  <p>{submitError}</p>
                  <a href="tel:+13202493106" className="error-call-link">
                    <PhoneCall size={14} /> Call Marcela directly at (320) 249-3106
                  </a>
                </div>
              </div>
            )}

            <div className="contact-form-actions-row">
              <button
                type="submit"
                className={`btn-quote-proceed btn-quote-confirm full-width ${isSubmitting ? 'submitting' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="spinner-icon" />
                    <span>Sending your quote request...</span>
                  </>
                ) : (
                  <>
                    <span>{isCustomQuote ? 'Submit Custom Quote Request' : 'Confirm & Request Quote'}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <aside className="step-details-summary-sidebar">
          <div className="live-summary-card">

            <div className="live-summary-header">
              <span className="live-summary-title">Booking Summary</span>
              <span className="live-summary-badge">Step 3 of 3</span>
            </div>

            <div className="live-summary-body">

              <div className="live-summary-row live-summary-row--editable">
                <div className="live-row-text">
                  <span className="live-row-label">Service</span>
                  <strong className="live-row-val">{serviceName}</strong>
                </div>
                <button
                  type="button"
                  className="btn-summary-edit"
                  onClick={onEditService}
                  aria-label="Edit selected service"
                >
                  Edit
                </button>
              </div>

              <div className="live-summary-row live-summary-row--editable">
                <div className="live-row-text">
                  <span className="live-row-label">Layout / Size</span>
                  <strong className="live-row-val">
                    {sizeOption ? sizeOption.label : 'Not selected'}
                  </strong>
                </div>
                <button
                  type="button"
                  className="btn-summary-edit"
                  onClick={onEditDetails}
                  aria-label="Edit size"
                >
                  Edit
                </button>
              </div>

              {sizeOption && sizeOption.basePrice !== null && (
                <div className="live-summary-row sub-row">
                  <span className="live-row-label">Base price</span>
                  <span className="live-row-val">${sizeOption.basePrice}</span>
                </div>
              )}

              {activeAddonsList.length > 0 && (
                <div className="live-addons-breakdown">
                  <div className="live-breakdown-header">
                    <span className="live-breakdown-title">Add-ons ({activeAddonsList.length})</span>
                    <button
                      type="button"
                      className="btn-summary-edit"
                      onClick={onEditDetails}
                      aria-label="Edit add-ons"
                    >
                      Edit
                    </button>
                  </div>
                  <ul className="live-addons-animated-list">
                    {activeAddonsList.map((item) => {
                      const qtySuffix =
                        item!.unit === 'each'
                          ? ` (${item!.qty} ${item!.qty === 1 ? 'window' : 'windows'})`
                          : item!.unit === 'hour'
                          ? ` (${item!.qty} ${item!.qty === 1 ? 'hr' : 'hrs'})`
                          : item!.qty > 1
                          ? ` (x${item!.qty})`
                          : '';

                      return (
                        <li key={item!.id} className="live-addon-pill-item">
                          <span className="live-addon-pill-label">
                            + {item!.label}{qtySuffix}
                          </span>
                          <strong className="live-addon-pill-price">{item!.costText}</strong>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <div className="live-summary-total-box">
              <span className="live-total-caption">Estimated total</span>
              <div className="live-animated-price-display">
                <span className="price-number">{priceDisplay}</span>
              </div>
              <span className="live-total-disclaimer">
                Final price depends on condition & scope of work.
              </span>
            </div>

            <button
              type="submit"
              form="contact-step-form"
              className={`btn-quote-proceed full-width ${isSubmitting ? 'submitting' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="spinner-icon" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>{isCustomQuote ? 'Submit Custom Quote' : 'Confirm & Request Quote'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="guarantee-micro-badge">
              <ShieldCheck size={16} />
              <span>100% Satisfaction Guarantee</span>
            </div>
          </div>
        </aside>
      </div>

      <div className="quote-live-bar-mobile">
        <div className="mobile-bar-price-info">
          <span className="mobile-bar-label">Total</span>
          <span className="mobile-bar-amount">{priceDisplay}</span>
        </div>
        <button
          type="submit"
          form="contact-step-form"
          className={`btn-quote-proceed btn-mobile-continue ${isSubmitting ? 'submitting' : ''}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span>Sending...</span>
          ) : (
            <>
              <span>{isCustomQuote ? 'Submit Quote' : 'Confirm'}</span>
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
