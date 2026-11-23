import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AppWindow, Archive, Box, Dog, Flame, Layers, Map as MapIcon, Refrigerator } from 'lucide-react';
import { ADDONS, PRICING, PROPERTY_TYPE_LABEL, type PropertyType, type ServiceKey } from '../../data/pricing';
import {
  buildLayout,
  DEFAULT_PREVIEW_PLAN,
  floorSVG,
  LAYERS,
  WALL_H,
  wallLayerSVG,
  type Layout,
  type Room,
} from './propertyPlan';

interface PropertyVisualizerProps {
  serviceKey: ServiceKey;
  propertyType: PropertyType;
  selectedSizeId: string | null;
  selectedAddons: Record<string, number>;
  previewSizeId?: string | null;
}

type View = 'iso' | 'top';

const ENABLE_3D = false;
const ISO_TILT = 57;

const EXTRA_ICONS: Record<string, React.ReactNode> = {
  inside_fridge: <Refrigerator size={16} />,
  inside_oven: <Flame size={16} />,
  inside_cabinets: <Archive size={16} />,
  interior_windows: <AppWindow size={16} />,
  light_organizing: <Layers size={16} />,
  pet_hair_removal: <Dog size={16} />,
};

const EXTRA_ROOM: Record<string, 'kitchen' | 'living'> = {
  inside_fridge: 'kitchen',
  inside_oven: 'kitchen',
  inside_cabinets: 'kitchen',
  light_organizing: 'living',
  pet_hair_removal: 'living',
};

const PIN_GAP = 38;

export const PropertyVisualizer: React.FC<PropertyVisualizerProps> = ({
  serviceKey,
  propertyType,
  selectedSizeId,
  selectedAddons,
  previewSizeId = null,
}) => {
  const [view, setView] = useState<View>('top');
  const [box, setBox] = useState({ w: 0, h: 0 });
  const stageRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);

  const isPreviewing = Boolean(previewSizeId && previewSizeId !== selectedSizeId);
  const shownSizeId = isPreviewing ? previewSizeId : selectedSizeId;
  const option = PRICING[serviceKey]?.options.find((o) => o.id === shownSizeId);
  const plan = option?.plan ?? DEFAULT_PREVIEW_PLAN[propertyType];
  const isPlaceholder = !option?.plan;
  const furnished = serviceKey === 'standard' || serviceKey === 'deep';
  const planKey = `${propertyType}-${plan.beds}-${plan.baths}-${plan.half ? 1 : 0}`;

  const layout = useMemo<Layout>(() => buildLayout(plan, propertyType), [planKey]);
  const floorHtml = useMemo(() => floorSVG(layout, furnished), [layout, furnished]);
  const wallHtml = useMemo(
    () => Array.from({ length: LAYERS }, (_, i) => wallLayerSVG(layout, i)),
    [layout]
  );

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const Wt = layout.W + 2 * layout.m;
  const Dt = layout.D + 2 * layout.m;
  let u = 0;
  if (box.w && box.h) {
    if (view === 'iso') {
      const rad = (ISO_TILT * Math.PI) / 180;
      const diag = (Wt + Dt) * Math.SQRT1_2;
      const projH = diag * Math.cos(rad) + WALL_H * Math.sin(rad);
      u = Math.min((box.w * 0.96) / diag, (box.h * 0.84) / projH);
    } else {
      u = Math.min((box.w * 0.94) / Wt, (box.h * 0.9) / Dt);
    }
  }
  const planeW = Wt * u;
  const planeH = Dt * u;

  const windowQty = selectedAddons.interior_windows || 0;
  const litWindows = Math.min(windowQty, layout.windows.length);
  useEffect(() => {
    const el = planeRef.current;
    if (!el) return;
    el.querySelectorAll('.pv-glass, .pv-winmark').forEach((node) => {
      const n = Number(/pv-w(\d+)/.exec(node.getAttribute('class') || '')?.[1] ?? -1);
      node.classList.toggle('is-lit', n >= 0 && n < litWindows);
    });
  }, [litWindows, wallHtml]);

  const activeExtras = ADDONS.filter((a) => (selectedAddons[a.id] || 0) > 0);
  const byRoom: Record<'kitchen' | 'living', string[]> = { kitchen: [], living: [] };
  for (const a of activeExtras) {
    const room = EXTRA_ROOM[a.id];
    if (room) byRoom[room].push(a.id);
  }
  const pinStyle = (r: Room, index: number, count: number): React.CSSProperties => {
    const rowHalf = ((count - 1) * PIN_GAP + 32) / 2;
    const minX = layout.m * u + rowHalf;
    const maxX = (layout.m + layout.W) * u - rowHalf;
    const cx = (r.x + r.w / 2 + layout.m) * u;
    return {
      left: `${maxX > minX ? Math.min(Math.max(cx, minX), maxX) : cx}px`,
      top: `${(r.y + r.h * 0.55 + layout.m) * u}px`,
      ['--pv-dx' as string]: `${(index - (count - 1) / 2) * PIN_GAP}px`,
    };
  };

  const planeStyle = {
    width: planeW,
    height: planeH,
    marginLeft: -planeW / 2,
    marginTop: -planeH / 2,
    '--pv-lift': view === 'iso' ? `${(WALL_H * u) / (LAYERS - 1)}px` : '0.04px',
    '--pv-pin-z': view === 'iso' ? `${WALL_H * u + 6}px` : '1px',
    '--pv-bz': view === 'iso' ? '45deg' : '0deg',
    '--pv-bx': view === 'iso' ? `-${ISO_TILT}deg` : '0deg',
  } as React.CSSProperties;

  const kindText = PROPERTY_TYPE_LABEL[propertyType];
  const summary = isPlaceholder
    ? shownSizeId
      ? 'Custom layout · confirmed after your request'
      : 'Select a size to preview your home'
    : `${kindText} · ${plan.beds} bed · ${plan.baths}${plan.half ? '.5' : ''} bath${furnished ? '' : ' · empty home'}`;

  return (
    <section className="pv-card" aria-label="Home preview">
      <div className="pv-bar">
        <div className="pv-heading">
          <span className="pv-title">
            <MapIcon size={16} />
            Your home preview
          </span>
          <span className="pv-meta">{summary}</span>
        </div>
        {ENABLE_3D && (
          <div className="pv-seg" role="group" aria-label="Preview view">
            <button type="button" aria-pressed={view === 'iso'} onClick={() => setView('iso')}>
              <Box size={14} />
              3D
            </button>
            <button type="button" aria-pressed={view === 'top'} onClick={() => setView('top')}>
              <MapIcon size={14} />
              Top view
            </button>
          </div>
        )}
      </div>

      <div className="pv-stage" ref={stageRef}>
        {isPreviewing && (
          <span className="pv-previewing" aria-live="polite">
            Previewing · click to select
          </span>
        )}
        {u > 0 && (
          <div
            ref={planeRef}
            className={`pv-plane is-${view} ${isPlaceholder ? 'is-faded' : ''}`}
            style={planeStyle}
            role="img"
            aria-label={`${view === 'iso' ? '3D' : 'Top'} view of a typical ${option?.label ?? 'home'} layout`}
          >
            <div className="pv-ground" />
            <div className="pv-layer pv-floor-layer" key={`floor-${planKey}-${furnished}`} dangerouslySetInnerHTML={{ __html: floorHtml }} />
            {wallHtml.map((html, i) => (
              <div
                key={`wall-${planKey}-${i}`}
                className="pv-layer pv-wall-layer"
                style={{
                  transform: `translateZ(calc(var(--pv-lift) * ${i}))`,
                  animationDelay: `${layout.rooms.length * 45}ms`,
                }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ))}

            <div className="pv-pins">
              {(['kitchen', 'living'] as const).flatMap((roomKey) =>
                byRoom[roomKey].map((id, i) => {
                  const addon = ADDONS.find((a) => a.id === id)!;
                  return (
                    <div key={id} className="pv-pin" style={pinStyle(layout[roomKey], i, byRoom[roomKey].length)}>
                      <span className="pv-pin-inner">
                        <span className="pv-pin-dot" tabIndex={0} aria-label={addon.label}>
                          {EXTRA_ICONS[id]}
                        </span>
                        <span className="pv-tip" role="tooltip">{addon.label}</span>
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {isPlaceholder && (
          <p className="pv-note">
            {shownSizeId
              ? "No fixed layout for this size. Tell us about your home and we'll confirm the price."
              : 'Pick a size to see a typical layout.'}
          </p>
        )}
      </div>

      <div className="pv-legend">
        {activeExtras.length > 0 ? (
          <>
            <span className="pv-legend-label">Marked on the plan:</span>
            {activeExtras.map((a) => (
              <span key={a.id} className="pv-chip">
                {EXTRA_ICONS[a.id]}
                {a.id === 'interior_windows' ? `${windowQty} ${windowQty === 1 ? 'window' : 'windows'}` : a.label}
              </span>
            ))}
          </>
        ) : (
          <span className="pv-legend-label">Add extras below to see where the work happens.</span>
        )}
        <span className="pv-disclaimer">Typical layout for this size, for reference only.</span>
      </div>
    </section>
  );
};
