import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
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
      'Dust furniture, shelves, and accessible surfaces',
      'Remove accessible cobwebs and clean mirrors',
      'Vacuum carpets, rugs, and mop hard floors',
      'Clean & disinfect kitchen counters, sink, faucet & stovetop',
      'Clean microwave exterior & visible cabinet fronts',
      'Clean & disinfect toilet, shower, tub, counters & faucets',
      'Empty trash cans & make beds when clean linens are ready',
    ],
    notIncluded: 'Heavy buildup, organizing, dishes, laundry, appliance or cabinet interiors.',
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
      'Includes everything in standard cleaning service, plus detailed tasks',
      'Detailed cleaning of baseboards, doors, frames & handles',
      'Remove dust buildup in corners, ceiling fans & light fixtures',
      'Clean blinds according to material and condition',
      'Clean interior window sills, tracks & frames',
      'Detailed cleaning of cabinet fronts & touchpoints',
      'Scrub showers, tubs, toilets & remove soap scum / mineral buildup',
      'Clean under & behind movable small furniture; detail microwave inside',
    ],
    notIncluded: 'Inside fridge, oven, or cabinets; full interior windows; organizing; full wall washing.',
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
      'Complete cleaning of all rooms, common areas & accessible surfaces',
      'Clean baseboards, doors, frames, handles, switches & outlets',
      'Clean inside and outside of empty cabinets, shelves & closets',
      'Clean countertops, sink, faucet, stovetop & appliance exteriors',
      'Deep clean bathrooms, showers, tubs & toilets',
      'Vacuum carpets; vacuum and mop hard floors',
      'Clean interior window sills, frames & tracks',
      'Remove small debris left after the move',
    ],
    notIncluded: 'Home should be empty of personal belongings. Inside oven, fridge & windows are add-ons.',
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
      'Inside refrigerator: $40 – $60',
      'Inside oven: $40 – $60',
      'Inside cabinets: From $40',
      'Interior windows: $8 – $12 each',
      'Light organizing: $35/hour (counters, bathroom, pantry, small closet)',
      'Heavy pet hair removal: $25 – $50',
    ],
    notIncluded: 'Published prices are starting prices for homes in normal condition.',
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
      'Desk, conference room & workstation sanitization',
      'High-traffic flooring & carpet vacuuming',
      'Restroom deep sanitization & hygiene supply refill',
      'Breakroom counters, sink & appliance exterior wiping',
      'Flexible schedules: daily, weekly, or after-hours',
    ],
    notIncluded: 'Serving Saint Cloud, MN and surrounding communities.',
  },
];

export const ServicesSection: React.FC = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    const cardWidth = firstChild.clientWidth || 340;
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
              return (
                <div
                  key={service.id}
                  className={`service-detail-card ${activeIndex === index ? 'card-active' : ''}`}
                >
                  <h3 className="service-card-title">{service.title}</h3>
                  <p className="service-card-tagline">{service.tagline}</p>
                  <p className="service-card-description">{service.description}</p>

                  <div className="service-checklist">
                    <h4 className="checklist-title">What's Included:</h4>
                    <ul>
                      {service.items.map((item, i) => (
                        <li key={i}>
                          <span className="checklist-dash">-</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
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
