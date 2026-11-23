import React, { useState, useEffect, useRef } from 'react';
import {
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
  BedDouble,
  Bath,
  Building2,
  Home as HomeIcon,
} from 'lucide-react';
import {
  PRICING,
  ADDONS,
  ServiceKey,
  SERVICE_KEY_TO_NAME,
  PROPERTY_TYPE_LABEL,
  type PropertyType,
  type SizeOption,
} from '../../data/pricing';
import { estimate } from '../../utils/estimate';
import { PropertyVisualizer } from './PropertyVisualizer';

interface StepDetailsProps {
  serviceKey: ServiceKey;
  propertyType: PropertyType;
  onChangePropertyType: (type: PropertyType) => void;
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
  propertyType,
  onChangePropertyType,
  selectedSizeId,
  onSelectSize,
  selectedAddons,
  onToggleAddon,
  onChangeAddonQty,
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

  const isSinglePrice = Boolean(selectedSizeId) && !isCustomQuote && targetMin === targetMax;

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

  const PROPERTY_TYPE_OPTIONS: { value: PropertyType; caption: string; icon: React.ReactNode }[] = [
    { value: 'apartment', caption: 'Condo, flat or unit', icon: <Building2 size={26} /> },
    { value: 'house', caption: 'Single-family or townhouse', icon: <HomeIcon size={26} /> },
  ];
  const [sizeNotice, setSizeNotice] = useState('');
  const typeRefs = useRef(new Map<PropertyType, HTMLDivElement>());

  const bedsOf = (o: SizeOption) => (o.beds ? parseInt(o.beds, 10) : 99);

  const changePropertyType = (type: PropertyType) => {
    if (type === propertyType) return;
    onChangePropertyType(type);
    setSizeNotice('');
    if (!selectedSizeObj || selectedSizeObj.propertyTypes.includes(type)) return;

    const candidates = serviceConfig.options.filter((o) => o.plan && o.propertyTypes.includes(type));
    if (candidates.length === 0) return;
    const target = bedsOf(selectedSizeObj);
    const closest = candidates.reduce((best, o) =>
      Math.abs(bedsOf(o) - target) < Math.abs(bedsOf(best) - target) ? o : best
    );
    onSelectSize(closest.id);
    setSizeNotice(`We adjusted your size for ${type === 'apartment' ? 'an apartment' : 'a house'}.`);
  };

  const handleTypeKeyDown = (e: React.KeyboardEvent, type: PropertyType) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      changePropertyType(type);
      return;
    }
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    const index = PROPERTY_TYPE_OPTIONS.findIndex((o) => o.value === type);
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
    const next = PROPERTY_TYPE_OPTIONS[(index + step + PROPERTY_TYPE_OPTIONS.length) % PROPERTY_TYPE_OPTIONS.length];
    changePropertyType(next.value);
    typeRefs.current.get(next.value)?.focus();
  };

  const typeOptions = serviceConfig.options.filter((o) => o.propertyTypes.includes(propertyType) || !o.plan);

  const layoutOptions = typeOptions.filter((o) => o.plan);
  const customOptions = typeOptions.filter((o) => !o.plan);
  const allSizeOptions = [...layoutOptions, ...customOptions];
  const tabStopId = allSizeOptions.some((o) => o.id === selectedSizeId) ? selectedSizeId : allSizeOptions[0]?.id;

  const [previewSizeId, setPreviewSizeId] = useState<string | null>(null);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());

  const handleCardKeyDown = (e: React.KeyboardEvent, option: SizeOption) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectSize(option.id);
      return;
    }
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const index = allSizeOptions.findIndex((o) => o.id === option.id);
    const next = allSizeOptions[(index + step + allSizeOptions.length) % allSizeOptions.length];
    onSelectSize(next.id);
    cardRefs.current.get(next.id)?.focus();
  };

  const sizeCardProps = (option: SizeOption) => {
    const isSelected = selectedSizeId === option.id;
    return {
      ref: (el: HTMLDivElement | null) => {
        if (el) cardRefs.current.set(option.id, el);
        else cardRefs.current.delete(option.id);
      },
      role: 'radio',
      'aria-checked': isSelected,
      tabIndex: option.id === tabStopId ? 0 : -1,
      onClick: () => {
        setSizeNotice('');
        onSelectSize(option.id);
      },
      onKeyDown: (e: React.KeyboardEvent) => handleCardKeyDown(e, option),
      onPointerEnter: (e: React.PointerEvent) => {
        if (e.pointerType === 'mouse') setPreviewSizeId(option.id);
      },
      onPointerLeave: () => setPreviewSizeId(null),
      onFocus: () => setPreviewSizeId(option.id),
      onBlur: () => setPreviewSizeId(null),
    };
  };

  const radioMark = (isSelected: boolean) => (
    <span className="size-radio-circle" aria-hidden="true">
      {isSelected && <Check size={13} strokeWidth={3} />}
    </span>
  );

  const renderSizeCard = (option: SizeOption) => {
    const isSelected = selectedSizeId === option.id;
    const priceText = option.basePrice === null ? 'Custom' : `$${option.basePrice}`;
    const caption = option.label.replace(' / ', ' · ');

    return (
      <div
        key={option.id}
        {...sizeCardProps(option)}
        aria-label={`${option.label}, ${option.basePrice === null ? 'custom quote' : `from ${priceText}`}${option.estimatedTime ? `, ${option.estimatedTime}` : ''}`}
        className={`size-card-item ${isSelected ? 'selected' : ''} ${option.popular ? 'size-card-item--popular' : ''}`}
      >
        {option.popular && <span className="size-popular-badge">Most popular</span>}
        {radioMark(isSelected)}

        <div className="size-card-body">
          {option.beds ? (
            <div className="size-card-counts" aria-hidden="true">
              <span className="size-card-count">
                <BedDouble size={20} />
                <strong>{option.beds}</strong>
              </span>
              {option.baths && (
                <span className="size-card-count">
                  <Bath size={20} />
                  <strong>{option.baths}</strong>
                </span>
              )}
            </div>
          ) : (
            <span className="size-card-hero-label">{option.shortLabel || option.label}</span>
          )}
          <span className="size-card-caption">
            {option.beds ? caption : "We'll prepare a custom quote"}
          </span>
        </div>

        <div className="size-card-footer">
          <span className="size-card-price-block">
            {option.basePrice !== null && <span className="size-card-from">From</span>}
            <strong className={`size-card-price ${option.basePrice === null ? 'custom-price' : ''}`}>{priceText}</strong>
          </span>
          {option.estimatedTime && (
            <span className="size-card-time">
              <Clock size={13} />
              {option.estimatedTime}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderCustomRow = (option: SizeOption) => {
    const isSelected = selectedSizeId === option.id;
    return (
      <div
        key={option.id}
        {...sizeCardProps(option)}
        aria-label="Not sure? Custom layout. We'll prepare a custom quote for your home."
        className={`size-card-item size-card-item--custom ${isSelected ? 'selected' : ''}`}
      >
        <span className="size-custom-icon" aria-hidden="true">
          <HelpCircle size={22} />
        </span>
        <div className="size-card-body">
          <span className="size-card-hero-label">Not sure? Custom layout</span>
          <span className="size-card-caption">We'll prepare a custom quote for your home.</span>
        </div>
        <span className="size-custom-tag">Custom quote</span>
        {radioMark(isSelected)}
      </div>
    );
  };

  const ADDON_GROUPS = [
    { title: 'Kitchen', ids: ['inside_fridge', 'inside_oven', 'inside_cabinets'] },
    { title: 'Around the home', ids: ['interior_windows', 'light_organizing', 'pet_hair_removal'] },
  ];
  const MAX_ADDON_QTY = 20;

  const addonPrice = (addon: (typeof ADDONS)[number], qty: number) => {
    const n = Math.max(qty, 1);
    const lo = addon.min * n;
    const hi = addon.max * n;
    const range = lo === hi ? `+$${lo}` : `+$${lo}–$${hi}`;
    if (qty > 0) return range;
    return addon.unit === 'each' ? `${range} each` : addon.unit === 'hour' ? `${range}/hr` : range;
  };

  const renderAddonTile = (addon: (typeof ADDONS)[number]) => {
    const qty = selectedAddons[addon.id] || 0;
    const isActive = qty > 0;
    const hasQty = addon.unit === 'each' || addon.unit === 'hour';
    const unitWord = addon.unit === 'each' ? (qty === 1 ? 'window' : 'windows') : qty === 1 ? 'hour' : 'hours';

    return (
      <div key={addon.id} className={`addon-tile ${isActive ? 'active' : ''}`}>
        <button
          type="button"
          className="addon-tile-toggle"
          aria-pressed={isActive}
          onClick={() => onToggleAddon(addon.id)}
        >
          <span className="addon-tile-check" aria-hidden="true">
            {isActive && <Check size={12} strokeWidth={3} />}
          </span>
          <span className="addon-tile-icon" aria-hidden="true">
            {ADDON_ICONS[addon.id] || <Sparkles size={22} />}
          </span>
          <span className="addon-tile-name">{addon.label}</span>
          <span className="addon-tile-price">{addonPrice(addon, qty)}</span>
        </button>

        {isActive && hasQty && (
          <div className="addon-tile-stepper" role="group" aria-label={`${addon.label} quantity`}>
            <button
              type="button"
              className="stepper-btn"
              onClick={() => onChangeAddonQty(addon.id, qty - 1)}
              disabled={qty <= 1}
              aria-label={`Fewer ${addon.unit === 'each' ? 'windows' : 'hours'}`}
            >
              <Minus size={13} strokeWidth={2.5} />
            </button>
            <span className="stepper-count" aria-live="polite">
              {qty} <span className="stepper-unit">{unitWord}</span>
            </span>
            <button
              type="button"
              className="stepper-btn"
              onClick={() => onChangeAddonQty(addon.id, Math.min(qty + 1, MAX_ADDON_QTY))}
              disabled={qty >= MAX_ADDON_QTY}
              aria-label={`More ${addon.unit === 'each' ? 'windows' : 'hours'}`}
            >
              <Plus size={13} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="quote-step-details-container">

      <div className="quote-step-header">
        <h2 className="step-title">Customize Your Cleaning</h2>
        <p className="step-subtitle">
          Select the size of your space and any extra areas that need care.
        </p>
      </div>

      <div className="step-details-config-layout">

        <div className="step-details-main-col">

          <div className="quote-preview-slot">
            <PropertyVisualizer
              serviceKey={serviceKey}
              propertyType={propertyType}
              selectedSizeId={selectedSizeId}
              selectedAddons={selectedAddons}
              previewSizeId={previewSizeId}
            />
          </div>

          <div className="quote-section-block">
            <div className="section-title-wrap">
              <span className="section-step-num">1</span>
              <div>
                <h3 className="section-title" id="property-type-title">What type of property?</h3>
                <p className="section-caption">
                  This helps us plan the visit. It doesn't change the price.
                </p>
              </div>
            </div>

            <div className="size-options property-type-grid" role="radiogroup" aria-label="Property type">
              {PROPERTY_TYPE_OPTIONS.map((opt) => {
                const isSelected = propertyType === opt.value;
                return (
                  <div
                    key={opt.value}
                    ref={(el) => {
                      if (el) typeRefs.current.set(opt.value, el);
                      else typeRefs.current.delete(opt.value);
                    }}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={isSelected ? 0 : -1}
                    className={`size-card-item property-type-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => changePropertyType(opt.value)}
                    onKeyDown={(e) => handleTypeKeyDown(e, opt.value)}
                  >
                    <span className="property-type-icon" aria-hidden="true">{opt.icon}</span>
                    <span className="property-type-text">
                      <span className="property-type-title">{PROPERTY_TYPE_LABEL[opt.value]}</span>
                      <span className="property-type-caption">{opt.caption}</span>
                    </span>
                    {radioMark(isSelected)}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="quote-section-block">
            <div className="section-title-wrap">
              <span className="section-step-num">2</span>
              <div>
                <h3 className="section-title" id="size-section-title">How big is your home?</h3>
                <p className="section-caption">
                  Choose the layout that matches your property.
                </p>
              </div>
            </div>

            <p className="size-adjust-notice" aria-live="polite">
              {sizeNotice}
            </p>

            <div className="size-options" role="radiogroup" aria-labelledby="size-section-title">
              <div className="size-cards-grid">{layoutOptions.map(renderSizeCard)}</div>
              {customOptions.map(renderCustomRow)}
            </div>
          </div>

          <div className="quote-section-block">
            <div className="section-title-wrap">
              <span className="section-step-num">3</span>
              <div>
                <h3 className="section-title">Add-On Services</h3>
                <p className="section-caption">
                  Add extra care for specific appliances and areas.
                </p>
              </div>
            </div>

            <div className="addon-groups">
              {ADDON_GROUPS.map((group) => (
                <div key={group.title} className="addon-group">
                  <h4 className="addon-group-title">{group.title}</h4>
                  <div className="addon-tiles-grid">
                    {group.ids
                      .map((id) => ADDONS.find((a) => a.id === id))
                      .filter((a): a is (typeof ADDONS)[number] => Boolean(a))
                      .map(renderAddonTile)}
                  </div>
                </div>
              ))}
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
                <span className="live-row-label">Property</span>
                <strong className="live-row-val">{PROPERTY_TYPE_LABEL[propertyType]}</strong>
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
                      const qtySuffix = item!.unit !== 'flat' || item!.qty > 1 ? ` ×${item!.qty}` : '';

                      return (
                        <li key={item!.id} className="live-addon-pill-item">
                          <span className="live-addon-pill-label">
                            {item!.label}{qtySuffix}
                          </span>
                          <strong className="live-addon-pill-price">+{item!.costText}</strong>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <div className="live-summary-total-box">
              <span className="live-total-caption">{isSinglePrice ? 'Starting at' : 'Estimated Range'}</span>
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
                  ? 'Final price confirmed before your appointment.'
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
          <span className="mobile-bar-label">{isSinglePrice ? 'Starting at' : 'Estimated Total'}</span>
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
