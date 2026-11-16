import React, { useEffect, useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import {
  apiJson,
  clienteNombre,
  formatDateLocal,
  formatDateUTC,
  formatMoney,
  paymentMethodLabel,
  serviceLabel,
  type EstadoPago,
  type MetodoPago,
} from '../../../utils/adminApi';
import { EstadoPagoBadge, Modal } from '../ventas/VentaModals';

interface Historial {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string | null;
  telefono: string;
  direccion: string;
  ciudad: string;
  notas: string | null;
  createdAt: string;
  resumen: {
    totalGastado: number;
    porCobrar: number;
    numServicios: number;
    ultimoServicio: string | null;
    ultimoServicioTipo: string | null;
  };
  ventas: {
    id: string;
    codigo: string;
    tipoLimpieza: string;
    fechaServicio: string;
    montoCotizado: number;
    montoFinal: number | null;
    estadoPago: EstadoPago;
    metodoPago: MetodoPago | null;
    fechaPago: string | null;
    cita: { codigo: string } | null;
    cotizacion: { codigo: string } | null;
  }[];
  citas: {
    id: string;
    codigo: string;
    fechaServicio: string;
    horaInicio: string;
    horaFin: string;
    estadoCita: string;
    direccionServicio: string;
    cotizacion: { codigo: string; tipoLimpieza: string; totalEstimado: number | null } | null;
  }[];
  cotizaciones: {
    id: string;
    codigo: string;
    tipoLimpieza: string;
    totalEstimado: number;
    estado: string;
    createdAt: string;
  }[];
}

type Tab = 'ventas' | 'citas' | 'cotizaciones';

const CITA_LABELS: Record<string, string> = {
  PROGRAMADA: 'Scheduled',
  EN_PROGRESO: 'In Progress',
  COMPLETADA: 'Completed',
  CANCELADA: 'Cancelled',
};

const COT_LABELS: Record<string, string> = {
  PENDIENTE: 'Pending',
  ACEPTADA: 'Accepted',
  RECHAZADA: 'Declined',
};

export const ClienteHistorialModal: React.FC<{
  clienteId: string;
  token: string;
  onClose: () => void;
}> = ({ clienteId, token, onClose }) => {
  const [data, setData] = useState<Historial | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('ventas');

  useEffect(() => {
    setData(null);
    setError(null);
    apiJson<Historial>(`/clientes/${clienteId}/historial`, token)
      .then(setData)
      .catch((err) => setError((err as Error).message));
  }, [clienteId, token]);

  if (error) {
    return (
      <Modal onClose={onClose}>
        <h3 className="adm-modal-title">Client history</h3>
        <div className="vta-form-error">{error}</div>
      </Modal>
    );
  }

  if (!data) {
    return (
      <Modal onClose={onClose} wide>
        <div className="adm-loading" style={{ border: 'none' }}>
          Loading client history…
        </div>
      </Modal>
    );
  }

  const r = data.resumen;
  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'ventas', label: 'Sales', count: data.ventas.length },
    { key: 'citas', label: 'Appointments', count: data.citas.length },
    { key: 'cotizaciones', label: 'Quotes', count: data.cotizaciones.length },
  ];

  return (
    <Modal onClose={onClose} wide>
      <h3 className="adm-modal-title">{clienteNombre(data)}</h3>
      <div className="crm-contact-row">
        <a href={`tel:${data.telefono}`} className="adm-client-phone-link">
          <Phone size={12} /> {data.telefono}
        </a>
        {data.email && (
          <a href={`mailto:${data.email}`} className="adm-client-phone-link">
            <Mail size={12} /> {data.email}
          </a>
        )}
        <span className="crm-contact-muted">
          <MapPin size={12} /> {data.direccion}
        </span>
        <span className="crm-contact-muted">Client since {formatDateLocal(data.createdAt)}</span>
      </div>

      <div className="crm-stats">
        <div className="crm-stat">
          <span className="crm-stat-label">Total spent</span>
          <strong className="crm-stat-value">{formatMoney(r.totalGastado)}</strong>
        </div>
        <div className="crm-stat">
          <span className="crm-stat-label">Services</span>
          <strong className="crm-stat-value">{r.numServicios}</strong>
        </div>
        <div className="crm-stat">
          <span className="crm-stat-label">Last service</span>
          <strong className="crm-stat-value crm-stat-value--sm">
            {r.ultimoServicio ? formatDateUTC(r.ultimoServicio) : '—'}
          </strong>
          {r.ultimoServicioTipo && (
            <span className="crm-stat-meta">{serviceLabel(r.ultimoServicioTipo)}</span>
          )}
        </div>
        <div className="crm-stat">
          <span className="crm-stat-label">Outstanding</span>
          <strong className={`crm-stat-value ${r.porCobrar > 0 ? 'crm-stat-value--warn' : ''}`}>
            {formatMoney(r.porCobrar)}
          </strong>
        </div>
      </div>

      {data.notas && <p className="crm-notes">“{data.notas}”</p>}

      <div className="crm-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`crm-tab ${tab === t.key ? 'crm-tab--active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label} <span className="crm-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="crm-tab-body">
        {tab === 'ventas' &&
          (data.ventas.length === 0 ? (
            <p className="crm-empty">No sales yet.</p>
          ) : (
            <table className="adm-table crm-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Service</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Charged</th>
                  <th>Status</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {data.ventas.map((v) => (
                  <tr key={v.id} className={v.estadoPago === 'ANULADO' ? 'vta-row--voided' : ''}>
                    <td className="adm-code">{v.codigo}</td>
                    <td>{serviceLabel(v.tipoLimpieza)}</td>
                    <td className="adm-date-cell">{formatDateUTC(v.fechaServicio)}</td>
                    <td className="vta-amount">
                      {formatMoney(v.montoFinal ?? v.montoCotizado)}
                      {v.estadoPago === 'PAGADO' && (
                        <div className="vta-cell-meta">{paymentMethodLabel(v.metodoPago)}</div>
                      )}
                    </td>
                    <td>
                      <EstadoPagoBadge estado={v.estadoPago} />
                    </td>
                    <td className="vta-cell-meta">
                      {[v.cita?.codigo, v.cotizacion?.codigo].filter(Boolean).join(' · ') || 'Manual'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

        {tab === 'citas' &&
          (data.citas.length === 0 ? (
            <p className="crm-empty">No appointments.</p>
          ) : (
            <table className="adm-table crm-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Service</th>
                  <th>Date & time</th>
                  <th>Status</th>
                  <th>Quote</th>
                </tr>
              </thead>
              <tbody>
                {data.citas.map((c) => (
                  <tr key={c.id}>
                    <td className="adm-code">{c.codigo}</td>
                    <td>{serviceLabel(c.cotizacion?.tipoLimpieza || 'Service')}</td>
                    <td className="adm-date-cell">
                      {formatDateUTC(c.fechaServicio)}
                      <div className="vta-cell-meta">
                        {c.horaInicio} – {c.horaFin}
                      </div>
                    </td>
                    <td>
                      <span className={`adm-badge adm-badge--cita-${c.estadoCita.toLowerCase()}`}>
                        {CITA_LABELS[c.estadoCita] ?? c.estadoCita}
                      </span>
                    </td>
                    <td className="vta-cell-meta">{c.cotizacion?.codigo ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

        {tab === 'cotizaciones' &&
          (data.cotizaciones.length === 0 ? (
            <p className="crm-empty">No quotes.</p>
          ) : (
            <table className="adm-table crm-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Service</th>
                  <th>Received</th>
                  <th style={{ textAlign: 'right' }}>Estimate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.cotizaciones.map((c) => (
                  <tr key={c.id}>
                    <td className="adm-code">{c.codigo}</td>
                    <td>{serviceLabel(c.tipoLimpieza)}</td>
                    <td className="adm-date-cell">{formatDateLocal(c.createdAt)}</td>
                    <td className="vta-amount">{formatMoney(c.totalEstimado)}</td>
                    <td>
                      <span className={`adm-badge adm-badge--${c.estado.toLowerCase()}`}>
                        {COT_LABELS[c.estado] ?? c.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
      </div>

      <div className="adm-modal-footer">
        <button className="adm-modal-btn adm-modal-btn--cancel" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
};
