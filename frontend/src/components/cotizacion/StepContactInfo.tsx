import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { PRICING, ADDONS, ServiceKey, SERVICE_KEY_TO_NAME } from '../../data/pricing';
import { estimate, formatEstimatePrice } from '../../utils/estimate';
import { FormField, TextInput, TextareaInput, SelectInput, SubmitButton } from '../common';

interface StepContactInfoProps {
  serviceKey: ServiceKey;
  selectedSizeId: string | null;
  selectedAddons: Record<string, number>;
  onBack: () => void;
  onSubmit: (formData: ContactFormData) => void;
}

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

export const StepContactInfo: React.FC<StepContactInfoProps> = ({
  serviceKey,
  selectedSizeId,
  selectedAddons,
  onBack,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    frequency: 'one-time',
    preferredDate: '',
    preferredTime: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const serviceConfig = PRICING[serviceKey];
  const serviceName = SERVICE_KEY_TO_NAME[serviceKey] || 'Cleaning Service';
  const sizeOption = serviceConfig?.options.find((opt) => opt.id === selectedSizeId);

  const estimateResult = estimate(serviceKey, selectedSizeId, selectedAddons);
  const { display: priceDisplay, isCustomQuote } = formatEstimatePrice(
    estimateResult,
    Boolean(selectedSizeId)
  );

  const activeAddonList = Object.entries(selectedAddons)
    .filter(([_, qty]) => qty > 0)
    .map(([addonId, qty]) => {
      const addon = ADDONS.find((a) => a.id === addonId);
      return { ...addon, qty };
    })
    .filter((item): item is typeof item & { label: string } => Boolean(item && item.label));

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
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="quote-step-details-container">
      
      <div className="quote-step-header">
        <div className="step-back-row">
          <button type="button" className="btn-back-step" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Back to details</span>
          </button>
        </div>
        <h2 className="step-title">Your Contact & Property Info</h2>
        <p className="step-subtitle">
          Where should we send your official confirmation and schedule?
        </p>
      </div>

      <div className="contact-step-layout">
        
        <form onSubmit={handleSubmit} className="contact-step-form">
          <div className="form-row">
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
              />
            </FormField>

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
                placeholder="(320) 249-3106"
                value={formData.phone}
                onChange={handleChange}
                hasError={!!errors.phone}
              />
            </FormField>
          </div>

          <div className="form-row">
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
              />
            </FormField>

            <FormField
              htmlFor="frequency"
              label="Preferred Frequency"
            >
              <SelectInput
                id="frequency"
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
              >
                <option value="one-time">One-time Clean</option>
                <option value="weekly">Weekly (Recurring)</option>
                <option value="bi-weekly">Bi-weekly (Every 2 weeks)</option>
                <option value="monthly">Monthly</option>
              </SelectInput>
            </FormField>
          </div>

          <FormField
            htmlFor="preferredDate"
            label="Preferred Service Date"
          >
            <TextInput
              id="preferredDate"
              name="preferredDate"
              type="date"
              value={formData.preferredDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
            />
          </FormField>

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
            />
          </FormField>

          <FormField
            htmlFor="notes"
            label="Special Requests or Property Condition Details"
          >
            <TextareaInput
              id="notes"
              name="notes"
              rows={3}
              placeholder="Tell us about pets, focus areas, key lockbox info, or preferred times..."
              value={formData.notes}
              onChange={handleChange}
            />
          </FormField>

          <div className="contact-form-actions">
            <SubmitButton
              label={isCustomQuote ? 'Submit Custom Quote Request' : 'Confirm & Request Quote'}
              className="btn-quote-proceed btn-quote-confirm full-width"
            />
          </div>
        </form>

        <div className="quote-summary-sidebar">
          <div className="summary-card">
            <div className="summary-badge">
              <span>Summary</span>
            </div>

            <div className="summary-item">
              <span className="summary-label">Service</span>
              <span className="summary-value">{serviceName}</span>
            </div>

            {sizeOption && (
              <div className="summary-item">
                <span className="summary-label">{serviceConfig?.sizeLabel || 'Size'}</span>
                <span className="summary-value">{sizeOption.label}</span>
              </div>
            )}

            {formData.preferredDate && (
              <div className="summary-item">
                <span className="summary-label">Preferred Date</span>
                <span className="summary-value">{formData.preferredDate}</span>
              </div>
            )}

            {activeAddonList.length > 0 && (
              <div className="summary-addons-section">
                <span className="summary-label">Selected Add-ons</span>
                <ul className="summary-addons-list">
                  {activeAddonList.map((addon) => (
                    <li key={addon.id}>
                      <span className="addon-dash">-</span>
                      <span>
                        {addon.label}
                        {addon.unit !== 'flat' && ` (x${addon.qty})`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="summary-price-divider" />

            <div className="summary-price-box">
              <span className="price-tagline">Estimated Price</span>
              <span className="price-amount">{priceDisplay}</span>
              <span className="price-note">
                Final price depends on size, condition, and scope of work.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
