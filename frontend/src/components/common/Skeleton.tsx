import React from 'react';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ width, height, radius, className = '', style }) => (
  <span
    className={`skel ${className}`}
    style={{ width, height, borderRadius: radius, ...style }}
    aria-hidden="true"
  />
);

const WIDTHS = ['72%', '55%', '84%', '63%', '48%', '77%', '58%', '90%'];
const cellWidth = (row: number, col: number) => WIDTHS[(row * 3 + col * 5) % WIDTHS.length];

interface TableSkeletonProps {
  headers: string[];
  rows?: number;
  label?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ headers, rows = 6, label = 'Loading…' }) => (
  <div className="skel-table" role="status" aria-busy="true">
    <span className="skel-sr-only">{label}</span>

    <div className="adm-table-wrap" aria-hidden="true">
      <table className="adm-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r}>
              {headers.map((h, c) => (
                <td key={h}>
                  <Skeleton className="skel--line" width={cellWidth(r, c)} />
                  {c < 2 && <Skeleton className="skel--line skel--sub" width="45%" />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="adm-mobile-cards" aria-hidden="true">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="adm-card-mobile skel-card">
          <div className="skel-card__head">
            <Skeleton className="skel--line" width="30%" />
            <Skeleton className="skel--pill" width={70} />
          </div>
          <Skeleton className="skel--line" width="60%" />
          <Skeleton className="skel--line" width="85%" />
          <Skeleton className="skel--line" width="40%" />
        </div>
      ))}
    </div>
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <section className="vta-chart-card" role="status" aria-busy="true">
    <span className="skel-sr-only">Loading revenue chart…</span>
    <div className="vta-chart-head" aria-hidden="true">
      <div className="skel-stack">
        <Skeleton className="skel--line" width={150} height={14} />
        <Skeleton className="skel--line" width={260} />
      </div>
    </div>
    <Skeleton className="vta-chart skel-chart" />
  </section>
);
