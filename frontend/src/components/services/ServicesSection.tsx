import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import '../../styles/services.css';

export interface ServiceDetail {
  id: string;
  title: string;
  shortLabel: string;
  badge: string;
  startingPrice: string;
  tagline: string;
  description: string;
  items: string[];
  notIncluded?: string;
}

export const SERVICES_DATA: ServiceDetail[] = [
  {
    id: 'regular_cleaning',
    title: 'Standard Cleaning',
    shortLabel: 'Standard',
    badge: 'Routine Maintenance',
    startingPrice: '$135+',
    tagline: 'Routine maintenance for homes in normal condition',
    description: 'Regular upkeep for living spaces, kitchens, bathrooms, and bedrooms to maintain cleanliness and hygiene.',
    items: [
      'Dust accessible surfaces, furniture & wipe mirrors',
      'Vacuum carpets, rugs & mop all hard floors',
      'Clean & sanitize kitchen counters, sink & stovetop',
      'Disinfect bathrooms: toilet, shower, tub & vanity',
    ],
    notIncluded: 'Heavy buildup, inside appliances or cabinets.',
  },
  {
    id: 'deep_cleaning',
    title: 'Deep Cleaning',
    shortLabel: 'Deep Clean',
    badge: 'First Visit & Seasonal',
    startingPrice: '$250+',
    tagline: 'More time, more detail, and a deeper clean',
    description: 'Comprehensive restorative cleaning tackling accumulated dust, baseboards, corners, and hard-to-reach spaces.',
    items: [
      'Everything in Standard Cleaning included',
      'Detailed hand-wiping of baseboards, doors & doorframes',
      'Thorough dusting of ceiling fans, vents & blinds',
      'Deep scrub of bathroom tiles, grout & soap scum removal',
      'Interior window sills, tracks & switch plates detailed',
    ],
    notIncluded: 'Inside fridge/oven (available as add-on), wall washing.',
  },
  {
    id: 'move_in_cleaning',
    title: 'Move-In or Move-Out',
    shortLabel: 'Move-In / Move-Out',
    badge: 'Turnover & Deposit Ready',
    startingPrice: '$275+',
    tagline: 'For empty or nearly empty properties before or after moving',
    description: 'Top-to-bottom turnover clean designed to leave empty properties pristine for landlords, buyers, or inspections.',
    items: [
      'Wipe inside & outside of empty cabinets, drawers & closets',
      'Deep clean & sanitize all bathrooms and kitchen surfaces',
      'Detailed cleaning of baseboards, doors, frames & trim',
      'Vacuum all carpeting; thoroughly vacuum & mop hard floors',
    ],
    notIncluded: 'Property should be empty of personal belongings.',
  },
  {
    id: 'addons',
    title: 'Add-On Services',
    shortLabel: 'Add-Ons',
    badge: 'Custom Additions',
    startingPrice: 'Varies',
    tagline: 'Combine with any service for targeted deep care',
    description: 'Customize your cleaning with specific targeted tasks for appliance interiors, windows, or organization.',
    items: [
      'Inside refrigerator & oven deep cleaning',
      'Interior window cleaning (panes, tracks & frames)',
      'Inside kitchen/bathroom cabinets & pantry',
      'Pet hair removal & light room organization',
    ],
  },
  {
    id: 'commercial_cleaning',
    title: 'Commercial Cleaning',
    shortLabel: 'Commercial',
    badge: 'Offices & Facilities',
    startingPrice: 'Custom Quote',
    tagline: 'Offices & Professional Workspaces',
    description: 'Direct corporate consultation and customized walkthrough for offices, business facilities, and commercial workspaces.',
    items: [
      'Workstations, desks & common area disinfection',
      'Commercial restroom sanitation & restock support',
      'High-traffic floor care, sweeping & carpet vacuuming',
      'Breakroom counters, appliance exteriors & trash disposal',
    ],
  },
];

export const ServicesSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const scrollToCard = (index: number) => {
    setActiveIndex(index);
    if (scrollContainerRef.current) {
      const child = scrollContainerRef.current.children[index] as HTMLElement;
      if (child) {
        child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      }
    }
  };

  const handlePrev = () => {
    const newIndex = Math.max(0, activeIndex - 1);
    scrollToCard(newIndex);
  };

  const handleNext = () => {
    const newIndex = Math.min(SERVICES_DATA.length - 1, activeIndex + 1);
    scrollToCard(newIndex);
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const firstChild = container.children[0] as HTMLElement;
    if (!firstChild) return;
    const cardWidth = firstChild.clientWidth || 320;
    const newIndex = Math.round(scrollLeft / (cardWidth + 24));
    if (newIndex >= 0 && newIndex < SERVICES_DATA.length && newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  return (
    <section id="services" className="services-home-section">
      <div className="services-container">
        <div className="services-header">
          <h2 className="services-title">What We Offer</h2>
          <p className="services-subtitle">
            Professional residential and commercial cleaning services designed for homes, businesses, and move transitions in Saint Cloud, MN.
          </p>
        </div>

        <div className="services-carousel-wrapper">
          <button
            type="button"
            className={`carousel-arrow-btn prev ${activeIndex === 0 ? 'disabled' : ''}`}
            onClick={handlePrev}
            disabled={activeIndex === 0}
            aria-label="Previous service"
          >
            <ChevronLeft size={24} />
          </button>

          <div
            ref={scrollContainerRef}
            className="services-cards-carousel"
            onScroll={handleScroll}
          >
            {SERVICES_DATA.map((service, index) => {
              const isExpanded = expandedId === service.id;
              return (
                <div
                  key={service.id}
                  tabIndex={0}
                  className={`svc-card ${activeIndex === index ? 'card-active' : ''} ${isExpanded ? 'is-touch-open' : ''}`}
                >

                  <div className="svc-card-img-placeholder" />

                  <div className="svc-card-body">
                    <div className="svc-card-icon-row">
                      <span className="svc-card-badge">{service.badge}</span>
                      <span className="svc-card-price">{service.startingPrice}</span>
                    </div>
                    <h3 className="svc-card-title">{service.title}</h3>
                    <p className="svc-card-tagline">{service.tagline}</p>
                    <p className="svc-card-desc">{service.description}</p>

                    <button
                      type="button"
                      className="svc-card-expand-btn"
                      onClick={() => toggleExpand(service.id)}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <>Hide details <ChevronUp size={16} /></>
                      ) : (
                        <>See what's included <ChevronDown size={16} /></>
                      )}
                    </button>
                  </div>

                  <div className="svc-card-overlay-panel" aria-hidden={!isExpanded}>
                    <div className="svc-card-overlay-header">
                      <h4 className="svc-overlay-title">What's included</h4>
                      <button
                        type="button"
                        className="svc-overlay-close-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(service.id);
                        }}
                        aria-label="Close details"
                      >
                        ×
                      </button>
                    </div>

                    <ul className="svc-overlay-list">
                      {service.items.map((item, i) => (
                        <li key={i}>
                          <span className="svc-check">–</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    {service.notIncluded && (
                      <p className="svc-not-included">
                        <strong>Not included:</strong> {service.notIncluded}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className={`carousel-arrow-btn next ${activeIndex === SERVICES_DATA.length - 1 ? 'disabled' : ''}`}
            onClick={handleNext}
            disabled={activeIndex === SERVICES_DATA.length - 1}
            aria-label="Next service"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="services-pagination-dots">
          {SERVICES_DATA.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`dot ${activeIndex === index ? 'active' : ''}`}
              onClick={() => scrollToCard(index)}
              aria-label={`Go to service ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
