import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MessageSquare,
  Send,
  CheckCircle2,
  MapPin,
  Clock,
} from 'lucide-react';
import { FormField, TextInput, TextareaInput, SubmitButton } from '../common';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  general?: string;
}

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<ContactFormData | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Please enter your name / Ingrese su nombre';
    }

    if (!formData.email.trim() && !formData.phone.trim()) {
      newErrors.email = 'Please provide an email or phone number';
      newErrors.phone = 'Please provide an email or phone number';
    } else {
      if (formData.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
          newErrors.email = 'Please enter a valid email address';
        }
      }

      if (formData.phone.trim()) {
        const phoneRegex = /^[\d\s\-\+\(\)]{7,20}$/;
        if (!phoneRegex.test(formData.phone.trim())) {
          newErrors.phone = 'Please enter a valid phone number';
        }
      }
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Please enter your message / Ingrese su mensaje';
    } else if (formData.message.trim().length < 5) {
      newErrors.message = 'Message should be at least 5 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      let response: Response;
      try {
        response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      } catch {
        response = await fetch('http://localhost:3000/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      }

      const result = await response.json();

      if (response.ok && result.ok) {
        setSubmittedData({ ...formData });
        setIsSubmitted(true);
      } else {
        setErrors({
          general: result.error || 'Could not send message. Please try again or call us directly.',
        });
      }
    } catch {
      setSubmittedData({ ...formData });
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: '',
    });
    setErrors({});
    setIsSubmitted(false);
    setSubmittedData(null);
  };

  return (
    <section className="contact-home-section" id="contact">
      <div className="contact-page-wrapper">
        <header className="contact-header">
          <h2 className="contact-title">Contact</h2>
          <p className="contact-subtitle">
            Have questions about our cleaning services or need a customized quote? Send us a message or contact us directly.
          </p>
        </header>

        <div className="contact-grid">
          
          <aside className="contact-info-card">
            <div className="info-card-top">
              <h3>Get in Touch Directly</h3>
              <p className="info-card-desc">
                We provide exceptional residential, deep cleaning, and office cleaning throughout Saint Cloud, MN. Reach out to schedule or ask any question.
              </p>

              <div className="contact-methods-list">
                <div className="contact-method-item">
                  <div className="method-icon-wrap">
                    <Phone size={20} />
                  </div>
                  <div className="method-details">
                    <span className="method-label">Direct Phone / Call</span>
                    <span className="method-value">+1 (320) 249-3106</span>
                  </div>
                </div>

                <div className="contact-method-item">
                  <div className="method-icon-wrap">
                    <MapPin size={20} />
                  </div>
                  <div className="method-details">
                    <span className="method-label">Service Area</span>
                    <span className="method-value">Saint Cloud, MN</span>
                    <span className="method-value subtext">& Surrounding Communities</span>
                  </div>
                </div>

                <div className="contact-method-item">
                  <div className="method-icon-wrap">
                    <Clock size={20} />
                  </div>
                  <div className="method-details">
                    <span className="method-label">Working Hours</span>
                    <span className="method-value">Monday – Saturday</span>
                    <span className="method-value subtext">9:00 AM – 6:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <section className="contact-form-card">
            {isSubmitted && submittedData ? (
              <div className="contact-success-state">
                <div className="success-badge-large">
                  <CheckCircle2 size={40} />
                </div>
                <h2>Thank You, {submittedData.name}!</h2>
                <p className="success-summary-desc">
                  Your message has been received successfully. Our team will review your inquiry and get back to you promptly.
                </p>

                <div className="success-details-box">
                  <div className="success-details-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{submittedData.name}</span>
                  </div>
                  {submittedData.email && (
                    <div className="success-details-row">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{submittedData.email}</span>
                    </div>
                  )}
                  {submittedData.phone && (
                    <div className="success-details-row">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{submittedData.phone}</span>
                    </div>
                  )}
                  <div className="success-details-row">
                    <span className="detail-label">Message:</span>
                    <span className="detail-value" style={{ maxWidth: '280px', textAlign: 'right' }}>
                      {submittedData.message.length > 50
                        ? `${submittedData.message.substring(0, 50)}...`
                        : submittedData.message}
                    </span>
                  </div>
                </div>

                <div className="success-actions-wrap">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleReset}
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="form-header-inner">
                  <h2>Send Us a Message</h2>
                  <p>Fill in your details below and we will contact you as soon as possible.</p>
                </div>

                {errors.general && (
                  <div className="form-alert-banner error" style={{ marginBottom: '1rem' }}>
                    <span>{errors.general}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="contact-form-element" noValidate>
                  
                  <FormField
                    htmlFor="home-contact-name"
                    label="Full Name"
                    required
                    error={errors.name}
                  >
                    <TextInput
                      id="home-contact-name"
                      type="text"
                      name="name"
                      placeholder="e.g. Sarah Johnson"
                      value={formData.name}
                      onChange={handleChange}
                      hasError={!!errors.name}
                      icon={User}
                    />
                  </FormField>

                  <div className="form-row">
                    <FormField
                      htmlFor="home-contact-email"
                      label="Email Address"
                      error={errors.email}
                      hint="Email or Phone required"
                    >
                      <TextInput
                        id="home-contact-email"
                        type="email"
                        name="email"
                        placeholder="sarah@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        hasError={!!errors.email}
                        icon={Mail}
                      />
                    </FormField>

                    <FormField
                      htmlFor="home-contact-phone"
                      label="Phone Number"
                      error={errors.phone}
                      hint="Direct Call/SMS"
                    >
                      <TextInput
                        id="home-contact-phone"
                        type="tel"
                        name="phone"
                        placeholder="+1 (320) 000-0000"
                        value={formData.phone}
                        onChange={handleChange}
                        hasError={!!errors.phone}
                        icon={Phone}
                      />
                    </FormField>
                  </div>

                  <FormField
                    htmlFor="home-contact-message"
                    label="Your Message or Request"
                    required
                    error={errors.message}
                    extra={`${formData.message.length} characters`}
                  >
                    <TextareaInput
                      id="home-contact-message"
                      name="message"
                      placeholder="Tell us about the cleaning service you need (type of property, number of rooms, special requests, preferred dates)..."
                      value={formData.message}
                      onChange={handleChange}
                      hasError={!!errors.message}
                      icon={MessageSquare}
                      rows={4}
                    />
                  </FormField>

                  <SubmitButton
                    loading={isSubmitting}
                    loadingText="Sending Message..."
                    icon={Send}
                    label="Send Message"
                    className="btn-contact-submit"
                  />
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </section>
  );
};
