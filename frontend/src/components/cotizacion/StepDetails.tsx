import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Minus,
  Sparkles,
  HelpCircle,
  Refrigerator,
  Flame,
  Archive,
  AppWindow,
  Layers,
  Dog,
  Clock,
  Info,
} from 'lucide-react';
import { PRICING, ADDONS, ServiceKey, SERVICE_KEY_TO_NAME } from '../../data/pricing';
import { estimate } from '../../utils/estimate';

interface StepDetailsProps {
  serviceKey: ServiceKey;
  selectedSizeId: string | null;
  onSelectSize: (sizeId: string) => void;
  selectedAddons: Record<string, number>;
  onToggleAddon: (addonId: string) => void;
  onChangeAddonQty: (addonId: string, qty: number) => void;
  onBack: () => void;
  onContinue: () => void;
}

const ADDON_ICONS: Record<string, React.ReactNode> = {
  inside_fridge: <Refrigerator size={24} />,
  inside_oven: <Flame size={24} />,
  inside_cabinets: <Archive size={24} />,
  interior_windows: <AppWindow size={24} />,
  light_organizing: <Layers size={24} />,
  pet_hair_removal: <Dog size={24} />,
};

const renderSizeIllustration = (id: string, isSelected: boolean) => {
  const stroke = isSelected ? '#16234D' : '#64748B';
  const accent = isSelected ? '#3FBFB5' : '#CBD5E1';
  const fill = isSelected ? 'rgba(63, 191, 181, 0.16)' : 'rgba(241, 245, 249, 0.6)';

  switch (id) {
    case '1bed_1bath':
    case 'small_apt':

      return (
        <svg width="48" height="40" viewBox="0 0 48 40" fill="none" className="size-illustration-svg">
          <rect x="12" y="10" width="24" height="26" rx="3" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <path d="M12 16H36" stroke={stroke} strokeWidth="1.5" />
          <rect x="16" y="20" width="6" height="6" rx="1" fill={accent} stroke={stroke} strokeWidth="1.2" />
          <rect x="26" y="20" width="6" height="6" rx="1" fill={accent} stroke={stroke} strokeWidth="1.2" />
          <path d="M21 36V30H27V36" stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case '2bed_1bath':
    case '2bed_1_5bath':
    case '1_2bed_apt':

      return (
        <svg width="48" height="40" viewBox="0 0 48 40" fill="none" className="size-illustration-svg">
          <path d="M7 19L24 6L41 19" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 16V35C12 35.5 12.5 36 13 36H35C35.5 36 36 35.5 36 35V16" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <rect x="17" y="21" width="5" height="5" rx="1" fill={accent} stroke={stroke} strokeWidth="1.2" />
          <path d="M26 36V27H31V36" stroke={stroke} strokeWidth="1.5" />
          <path d="M33 13V9H37V16" stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case '2bed_2bath':

      return (
        <svg width="48" height="40" viewBox="0 0 48 40" fill="none" className="size-illustration-svg">
          <path d="M6 18L21 6L36 18" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 15V35C10 35.5 10.5 36 11 36H31C31.5 36 32 35.5 32 35V15" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <rect x="14" y="17" width="5" height="5" rx="1" fill={accent} stroke={stroke} strokeWidth="1.2" />
          <rect x="23" y="17" width="5" height="5" rx="1" fill={accent} stroke={stroke} strokeWidth="1.2" />
          <rect x="14" y="25" width="5" height="5" rx="1" fill={accent} stroke={stroke} strokeWidth="1.2" />
          <path d="M23 36V27H28V36" stroke={stroke} strokeWidth="1.5" />
          <rect x="32" y="22" width="10" height="14" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case '3bed_2bath':
    case 'medium_home':
    case '3bed_home':

      return (
        <svg width="48" height="40" viewBox="0 0 48 40" fill="none" className="size-illustration-svg">
          <path d="M5 20L19 9L33 20" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 17V35C9 35.5 9.5 36 10 36H28C28.5 36 29 35.5 29 35V17" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <path d="M29 21L43 21V36H29V21Z" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <rect x="14" y="20" width="5" height="5" rx="1" fill={accent} stroke={stroke} strokeWidth="1.2" />
          <path d="M19 36V28H24V36" stroke={stroke} strokeWidth="1.5" />
          <rect x="33" y="26" width="6" height="5" rx="1" fill={accent} stroke={stroke} strokeWidth="1.2" />
          <path d="M28 8H31V14" stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case '4bed_2_3bath':
    case 'large_home':
    case 'larger_home':

      return (
        <svg width="48" height="40" viewBox="0 0 48 40" fill="none" className="size-illustration-svg">
          <path d="M4 17L17 7L30 17" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 15V36H27V15" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <path d="M27 15L39 15L44 19V36H27V15Z" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <rect x="11" y="18" width="5" height="5" rx="1" fill={accent} stroke={stroke} strokeWidth="1.2" />
          <rect x="19" y="18" width="5" height="5" rx="1" fill={accent} stroke={stroke} strokeWidth="1.2" />
          <rect x="31" y="21" width="5" height="5" rx="1" fill={accent} stroke={stroke} strokeWidth="1.2" />
          <path d="M15 36V28H21V36" stroke={stroke} strokeWidth="1.5" />
          <path d="M32 36V29H38V36" stroke={stroke} strokeWidth="1.5" />
          <path d="M24 6H27V12" stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'something_else':
    default:

      return (
        <div className="size-illustration-icon">
          <HelpCircle size={28} className="size-card-icon" />
        </div>
      );
  }
};

const useAnimatedNumber = (target: number, duration = 300) => {
  const [current, setCurrent] = useState(target);
  const startRef = useRef(target);
  const targetRef = useRef(target);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = current;
    targetRef.current = target;
    startTimeRef.current = null;

    let animationFrameId: number;
    const animate = (time: number) => {
      if (!startTimeRef.current) startTimeRef.current = time;
      const progress = Math.min((time - startTimeRef.current) / duration, 1);

      const ease = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(startRef.current + (targetRef.current - startRef.current) * ease);
      setCurrent(val);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [target]);

  return current;
};

export const StepDetails: React.FC<StepDetailsProps> = ({
  serviceKey,
  selectedSizeId,
  onSelectSize,
  selectedAddons,
  onToggleAddon,
  onChangeAddonQty,
  onBack,
  onContinue,
}) => {
  const serviceConfig = PRICING[serviceKey];
  const serviceName = SERVICE_KEY_TO_NAME[serviceKey] || 'Cleaning Service';

  const estimateResult = estimate(serviceKey, selectedSizeId, selectedAddons);
  const selectedSizeObj = serviceConfig?.options.find((opt) => opt.id === selectedSizeId);
  const isCustomQuote = Boolean(selectedSizeId && selectedSizeObj?.basePrice === null);

  const targetMin = estimateResult ? estimateResult.min : 0;
  const targetMax = estimateResult ? estimateResult.max : 0;
  const animatedMin = useAnimatedNumber(targetMin, 300);
  const animatedMax = useAnimatedNumber(targetMax, 300);

  const buttonText = isCustomQuote ? 'Request a quote' : 'Continue to Contact Info';
  const canProceed = Boolean(selectedSizeId);

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

  return (
    <div className="quote-step-details-container">

      <div className="quote-step-header">
        <div className="step-back-row">
          <button type="button" className="btn-back-step" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Change service</span>
          </button>
          <span className="current-service-badge">{serviceName}</span>
        </div>
        <h2 className="step-title">Customize Your Cleaning</h2>
        <p className="step-subtitle">
          Select the size of your space and any extra areas that need care.
        </p>
      </div>

      <div className="step-details-config-layout">

        <div className="step-details-main-col">

          <div className="quote-section-block">
            <div className="section-title-wrap">
              <span className="section-step-num">1</span>
              <div>
                <h3 className="section-title">How big is your home?</h3>
                <p className="section-caption">
                  Choose the layout that matches your property.
                </p>
              </div>
            </div>

            <div className={`size-cards-grid ${serviceConfig.options.length > 3 ? 'size-cards-grid--7' : 'size-cards-grid--3'}`}>
              {serviceConfig.options.map((option) => {
                const isSelected = selectedSizeId === option.id;
                const isSomethingElse = option.id === 'something_else' || option.id === 'larger_home';

                return (
                  <div
                    key={option.id}
                    role="button"
                    tabIndex={0}
                    className={`size-card-item size-option-row ${isSelected ? 'selected' : ''} ${isSomethingElse ? 'size-card-item--custom' : ''}`}
                    onClick={() => onSelectSize(option.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectSize(option.id);
                      }
                    }}
                  >
                    <div className="size-card-top">
                      <div className="size-card-illustration-wrap">
                        {renderSizeIllustration(option.id, isSelected)}
                      </div>
                      <div className={`size-radio-circle ${isSelected ? 'active' : ''}`}>
                        {isSelected && <Check size={13} strokeWidth={3} />}
                      </div>
                    </div>

                    <div className="size-card-body">

                      <span className="size-card-hero-label">
                        {option.shortLabel || option.label}
                      </span>
                      {isSomethingElse && (
                        <span className="size-card-note">We'll prepare a custom quote</span>
                      )}
                    </div>

                    <div className="size-card-footer">
                      <div className="size-card-price-row">
                        <span className={`size-card-price ${option.basePrice === null ? 'custom-price' : ''}`}>
                          {option.basePrice === null ? 'Custom' : `from $${option.basePrice}`}
                        </span>
                        {option.estimatedTime && (
                          <span className="size-card-time">
                            <Clock size={12} />
                            {option.estimatedTime}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="quote-section-block">
            <div className="section-title-wrap">
              <span className="section-step-num">2</span>
              <div>
                <h3 className="section-title">Add-On Services</h3>
                <p className="section-caption">
                  Add extra care for specific appliances and areas.
                </p>
              </div>
            </div>

            <div className="addons-compact-grid">
              {ADDONS.map((addon) => {
                const currentQty = selectedAddons[addon.id] || 0;
                const isActive = currentQty > 0;

                let priceText = '';
                if (addon.unit === 'flat') {
                  priceText = addon.min === addon.max ? `+$${addon.min}` : `+$${addon.min}–$${addon.max}`;
                } else if (addon.unit === 'each') {
                  priceText = `+$${addon.min}–$${addon.max} each`;
                } else if (addon.unit === 'hour') {
                  priceText = `+$${addon.min}/hr`;
                }

                return (
                  <div
                    key={addon.id}
                    className={`addon-compact-card addon-card ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (addon.unit === 'flat' || !isActive) {
                        onToggleAddon(addon.id);
                      }
                    }}
                  >

                    <div className="addon-compact-icon">
                      {ADDON_ICONS[addon.id] || <Sparkles size={22} />}
                    </div>

                    <div className="addon-compact-details">
                      <span className="addon-compact-title">{addon.label}</span>
                      <span className="addon-compact-price">{priceText}</span>
                    </div>

                    <div className="addon-compact-action" onClick={(e) => e.stopPropagation()}>
                      {isActive && (addon.unit === 'each' || addon.unit === 'hour') ? (
                        <div className="addon-compact-stepper" role="group" aria-label={`Adjust ${addon.label} quantity`}>
                          <button
                            type="button"
                            className="stepper-btn"
                            onClick={() => {
                              if (currentQty > 1) {
                                onChangeAddonQty(addon.id, currentQty - 1);
                              } else {
                                onToggleAddon(addon.id);
                              }
                            }}
                            aria-label="Decrease quantity"
                          >
                            <Minus size={13} strokeWidth={2.5} />
                          </button>
                          <span className="stepper-count">
                            {currentQty}{addon.unit === 'hour' ? 'h' : ''}
                          </span>
                          <button
                            type="button"
                            className="stepper-btn"
                            onClick={() => onChangeAddonQty(addon.id, currentQty + 1)}
                            aria-label="Increase quantity"
                          >
                            <Plus size={13} strokeWidth={2.5} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={`addon-toggle-btn ${isActive ? 'active' : ''}`}
                          onClick={() => onToggleAddon(addon.id)}
                          aria-pressed={isActive}
                          aria-label={`${isActive ? 'Remove' : 'Add'} ${addon.label}`}
                        >
                          {isActive ? (
                            <>
                              <Check size={13} strokeWidth={3} />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <Plus size={13} strokeWidth={2.5} />
                              <span>Add</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="quote-note-banner">
              <div className="note-icon-col">
                <Info size={19} />
              </div>
              <div className="note-text-col">
                <strong>Please Note:</strong> Our standard cleaning starting prices apply to homes in normal condition. Heavy buildup, pet hair, extra organizing, or unusually dirty conditions may cost more.
              </div>
            </div>
          </div>
        </div>

        <aside className="step-details-summary-sidebar">
          <div className="live-summary-card">
            <div className="live-summary-header">
              <div className="live-summary-header-left">
                <span className="live-summary-title">Live Estimate</span>
                <span className="live-summary-subtitle">Updates instantly</span>
              </div>
              <span className="live-summary-badge">No commitment</span>
            </div>

            <div className="live-summary-body">

              <div className="live-summary-row">
                <span className="live-row-label">Service</span>
                <strong className="live-row-val">{serviceName}</strong>
              </div>

              <div className="live-summary-row">
                <span className="live-row-label">Layout / Size</span>
                <strong className="live-row-val">
                  {selectedSizeObj ? (selectedSizeObj.shortLabel || selectedSizeObj.label) : <em className="live-placeholder-text">Select a size</em>}
                </strong>
              </div>

              {selectedSizeObj && selectedSizeObj.basePrice !== null && (
                <div className="live-summary-row sub-row">
                  <span className="live-row-label">Base service</span>
                  <span className="live-row-val">${selectedSizeObj.basePrice}</span>
                </div>
              )}
              {selectedSizeObj && selectedSizeObj.estimatedTime && (
                <div className="live-summary-row sub-row">
                  <span className="live-row-label">Estimated time</span>
                  <span className="live-row-val">{selectedSizeObj.estimatedTime}</span>
                </div>
              )}

              {activeAddonsList.length > 0 && (
                <div className="live-addons-breakdown">
                  <div className="live-breakdown-header">
                    <span className="live-breakdown-title">Included Add-ons</span>
                    <span className="live-breakdown-count">{activeAddonsList.length}</span>
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
              <span className="live-total-caption">Estimated Range</span>
              <div className="live-animated-price-display">
                {!selectedSizeId ? (
                  <span className="price-prompt">Select size above</span>
                ) : isCustomQuote ? (
                  <span className="price-custom">Custom quote</span>
                ) : targetMin === targetMax ? (
                  <span className="price-number">${animatedMin}</span>
                ) : (
                  <span className="price-number">${animatedMin} – ${animatedMax}</span>
                )}
              </div>
              <span className="live-total-disclaimer">
                {selectedSizeId
                  ? 'Guaranteed pricing confirmed before your appointment.'
                  : 'Instant preview calculated as you customize.'}
              </span>
            </div>

            <button
              type="button"
              className={`btn-quote-proceed full-width ${!canProceed ? 'disabled' : ''}`}
              disabled={!canProceed}
              onClick={onContinue}
            >
              <span>{buttonText}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </aside>
      </div>

      <div className="quote-live-bar-mobile">
        <div className="mobile-bar-price-info">
          <span className="mobile-bar-label">Estimated Total</span>
          <span className="mobile-bar-amount">
            {!selectedSizeId ? (
              'Select size'
            ) : isCustomQuote ? (
              'Custom quote'
            ) : targetMin === targetMax ? (
              `$${animatedMin}`
            ) : (
              `$${animatedMin}–$${animatedMax}`
            )}
          </span>
        </div>
        <button
          type="button"
          className={`btn-quote-proceed btn-mobile-continue ${!canProceed ? 'disabled' : ''}`}
          disabled={!canProceed}
          onClick={onContinue}
        >
          <span>{buttonText}</span>
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
};
