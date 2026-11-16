import React, { useMemo, useState } from 'react';
import { formatMoney, formatMoneyShort, monthLabel } from '../../../utils/adminApi';
import type { PuntoIngreso } from './types';

function niceScale(max: number, divisions = 4) {
  if (max <= 0) return { top: 400, step: 100 };
  const raw = max / divisions;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((s) => s >= raw) ?? 10 * mag;
  return { top: step * divisions, step };
}

export const RevenueChart: React.FC<{
  serie: PuntoIngreso[];
  selected: string;
  onSelect: (mes: string) => void;
}> = ({ serie, selected, onSelect }) => {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(0, ...serie.map((p) => p.total));
  const { top, step } = useMemo(() => niceScale(max), [max]);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step).reverse();
  const total = serie.reduce((acc, p) => acc + p.total, 0);
  const hovered = serie.find((p) => p.mes === hover);

  return (
    <section className="vta-chart-card" aria-labelledby="vta-chart-title">
      <div className="vta-chart-head">
        <div>
          <h3 id="vta-chart-title" className="vta-chart-title">
            Revenue by month
          </h3>
          <p className="vta-chart-sub">
            Paid sales, by payment date · last {serie.length} months ·{' '}
            <strong>{formatMoney(total)}</strong> total
          </p>
        </div>
        <span className="vta-chart-hint">Click a bar to view that month</span>
      </div>

      <div className="vta-chart">
        <div className="vta-chart-yaxis" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} style={{ top: `${(1 - t / top) * 100}%` }}>
              {formatMoneyShort(t)}
            </span>
          ))}
        </div>

        <div className="vta-chart-plot">
          <div className="vta-chart-grid" aria-hidden="true">
            {ticks.map((t) => (
              <span
                key={t}
                className={t === 0 ? 'vta-chart-baseline' : undefined}
                style={{ top: `${(1 - t / top) * 100}%` }}
              />
            ))}
          </div>

          {max === 0 && <div className="vta-chart-empty">No payments recorded in this period</div>}

          <div className="vta-chart-bars" role="list">
            {serie.map((p) => {
              const pct = top > 0 ? (p.total / top) * 100 : 0;
              const isSelected = p.mes === selected;
              return (
                <button
                  type="button"
                  role="listitem"
                  key={p.mes}
                  className={`vta-bar-slot ${isSelected ? 'vta-bar-slot--selected' : ''}`}
                  onClick={() => onSelect(p.mes)}
                  onMouseEnter={() => setHover(p.mes)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(p.mes)}
                  onBlur={() => setHover(null)}
                  aria-label={`${monthLabel(p.mes)}: ${formatMoney(p.total)} from ${p.cantidad} payment${
                    p.cantidad === 1 ? '' : 's'
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className="vta-bar-track">
                    <span
                      className="vta-bar"
                      style={{ height: p.total > 0 ? `max(${pct}%, 3px)` : 0 }}
                    />
                  </span>
                  <span className="vta-bar-label">{monthLabel(p.mes, 'short')}</span>
                  {hovered && hovered.mes === p.mes && (
                    <span className="vta-tooltip" role="tooltip">
                      <span className="vta-tooltip-title">{monthLabel(p.mes)}</span>
                      <strong>{formatMoney(p.total)}</strong>
                      <span className="vta-tooltip-meta">
                        {p.cantidad} payment{p.cantidad === 1 ? '' : 's'}
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
