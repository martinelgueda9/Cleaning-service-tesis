import React from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Plus, 
  Minus, 
  AlertCircle,
  Info
} from 'lucide-react';
import { PRICING, ADDONS, ServiceKey, SERVICE_KEY_TO_NAME } from '../../data/pricing';
import { estimate, formatEstimatePrice } from '../../utils/estimate';

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
  const { display: priceDisplay, isCustomQuote } = formatEstimatePrice(
    estimateResult,
    Boolean(selectedSizeId)
  );

  const selectedSizeObj = serviceConfig?.options.find((opt) => opt.id === selectedSizeId);
  const isSizeNull = selectedSizeObj?.basePrice === null;
  const showCustomQuote = Boolean(selectedSizeId) && isSizeNull;

  const buttonText = showCustomQuote ? 'Request a quote' : 'Continue';
  const canProceed = Boolean(selectedSizeId);

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

      <div className="quote-section-block">
        <div className="section-title-wrap">
          <span className="section-step-num">1</span>
          <div>
            <h3 className="section-title">{serviceConfig.sizeLabel}</h3>
            <p className="section-caption">
              Choose the layout that matches your property.
            </p>
          </div>
        </div>

        <div className="size-options-grid">
          {serviceConfig.options.map((option) => {
            const isSelected = selectedSizeId === option.id;
            const priceLabel =
              option.basePrice === null ? 'Custom quote' : `from $${option.basePrice}`;

            return (
              <div
                key={option.id}
                role="button"
                tabIndex={0}
                className={`size-option-row ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectSize(option.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectSize(option.id);
                  }
                }}
              >
                <div className="size-option-left">
                  <div className={`size-radio-circle ${isSelected ? 'active' : ''}`}>
                    {isSelected && <Check size={13} strokeWidth={3} />}
                  </div>
                  <span className="size-option-label">{option.label}</span>
                </div>

                <div className="size-option-right">
                  <span
                    className={`size-option-price ${
                      option.basePrice === null ? 'custom-price' : ''
                    }`}
                  >
                    {priceLabel}
                  </span>
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
              Add-ons can be combined with any service for targeted deep care.
            </p>
          </div>
        </div>

        <div className="addons-grid">
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
                className={`addon-card ${isActive ? 'active' : ''}`}
              >
                <div className="addon-header-row">
                  <div
                    className="addon-clickable-area"
                    onClick={() => onToggleAddon(addon.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggleAddon(addon.id);
                      }
                    }}
                  >
                    <div className={`addon-checkbox ${isActive ? 'checked' : ''}`}>
                      {isActive && <Check size={14} strokeWidth={3} />}
                    </div>
                    <div className="addon-info">
                      <span className="addon-title">{addon.label}</span>
                      <span className="addon-price-tag">{priceText}</span>
                    </div>
                  </div>

                  {isActive && (addon.unit === 'each' || addon.unit === 'hour') && (
                    <div className="addon-counter-control" aria-label="Adjust quantity">
                      <button
                        type="button"
                        className="counter-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (currentQty > 1) {
                            onChangeAddonQty(addon.id, currentQty - 1);
                          } else {
                            onToggleAddon(addon.id);
                          }
                        }}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="counter-value">
                        {currentQty} {addon.unit === 'hour' ? (currentQty === 1 ? 'hr' : 'hrs') : ''}
                      </span>
                      <button
                        type="button"
                        className="counter-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeAddonQty(addon.id, currentQty + 1);
                        }}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="quote-note-banner">
        <div className="note-icon-col">
          <Info size={20} />
        </div>
        <div className="note-text-col">
          <strong>Please Note:</strong> Our standard cleaning starting prices apply to homes in normal condition. Heavy buildup, pet hair, extra organizing, or unusually dirty conditions may cost more.
        </div>
      </div>

      <div className="quote-live-estimate-bar">
        <div className="estimate-summary-col">
          <span className="estimate-label">Estimated Price</span>
          <div className="estimate-price-value">
            {priceDisplay}
          </div>
          <span className="estimate-disclaimer">
            Final price depends on size, condition, and scope of work.
          </span>
        </div>

        <div className="estimate-action-col">
          <button
            type="button"
            className={`btn-quote-proceed ${!canProceed ? 'disabled' : ''}`}
            disabled={!canProceed}
            onClick={onContinue}
          >
            <span>{buttonText}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
