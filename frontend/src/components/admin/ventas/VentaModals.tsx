import React, { useEffect, useState } from 'react';
import {
  apiJson,
  clienteNombre,
  estadoPagoLabel,
  formatDateUTC,
  formatMoney,
  isoToInputDate,
  paymentMethodLabel,
  PAYMENT_METHODS,
  serviceLabel,
  SERVICE_OPTIONS,
  todayInput,
  type MetodoPago,
} from '../../../utils/adminApi';
import type { Venta } from './types';
import { MopSpinner } from '../../common';

export const Modal: React.FC<{
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}> = ({ onClose, wide, children }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div
        className={`adm-modal ${wide ? 'adm-modal--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="adm-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

export const EstadoPagoBadge: React.FC<{ estado: Venta['estadoPago'] }> = ({ estado }) => (
  <span className={`adm-badge vta-badge--${estado.toLowerCase()}`}>{estadoPagoLabel(estado)}</span>
);

function parseAmount(v: string): number | undefined {
  if (v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : NaN;
}

const FormError: React.FC<{ msg: string | null }> = ({ msg }) =>
  msg ? <div className="vta-form-error">{msg}</div> : null;

interface MutationProps {
  venta: Venta;
  token: string;
  onClose: () => void;
  onSaved: (venta: Venta, msg: string) => void;
}

export const VentaDetailModal: React.FC<{
  venta: Venta;
  onClose: () => void;
  onAction: (action: 'pay' | 'edit' | 'void') => void;
  onOpenCliente: (clienteId: string) => void;
}> = ({ venta, onClose, onAction, onOpenCliente }) => {
  const diff = venta.montoFinal != null ? venta.montoFinal - venta.montoCotizado : null;

  return (
    <Modal onClose={onClose} wide>
      <h3 className="adm-modal-title">Sale {venta.codigo}</h3>
      <p className="adm-modal-subtitle">
        {venta.origen === 'CITA'
          ? 'Created automatically when the appointment was marked as completed.'
          : 'Manual sale (WhatsApp / phone).'}
      </p>

      <div className="adm-modal-grid">
        <div className="adm-modal-row">
          <span className="adm-modal-key">Client</span>
          <button
            type="button"
            className="vta-link-btn adm-modal-val"
            onClick={() => onOpenCliente(venta.cliente.id)}
          >
            {clienteNombre(venta.cliente)}
          </button>
        </div>
        <div className="adm-modal-row">
          <span className="adm-modal-key">Phone</span>
          <span className="adm-modal-val">
            {venta.cliente.telefono ? (
              <a href={`tel:${venta.cliente.telefono}`} className="adm-client-phone-link">
                {venta.cliente.telefono}
              </a>
            ) : (
              '—'
            )}
          </span>
        </div>
        <div className="adm-modal-row">
          <span className="adm-modal-key">Service</span>
          <strong className="adm-modal-val">{serviceLabel(venta.tipoLimpieza)}</strong>
        </div>
        <div className="adm-modal-row">
          <span className="adm-modal-key">Service date</span>
          <span className="adm-modal-val">{formatDateUTC(venta.fechaServicio)}</span>
        </div>
        <div className="adm-modal-row">
          <span className="adm-modal-key">Quoted amount</span>
          <span className="adm-modal-val">{formatMoney(venta.montoCotizado)}</span>
        </div>
        <div className="adm-modal-row">
          <span className="adm-modal-key">Final charged</span>
          <strong className="adm-modal-val" style={{ fontSize: '16px' }}>
            {formatMoney(venta.montoFinal)}
            {diff != null && diff !== 0 && (
              <span className={`vta-diff ${diff > 0 ? 'vta-diff--up' : 'vta-diff--down'}`}>
                {diff > 0 ? '+' : '−'}
                {formatMoney(Math.abs(diff))}
              </span>
            )}
          </strong>
        </div>
        <div className="adm-modal-row">
          <span className="adm-modal-key">Payment status</span>
          <span className="adm-modal-val">
            <EstadoPagoBadge estado={venta.estadoPago} />
          </span>
        </div>
        <div className="adm-modal-row">
          <span className="adm-modal-key">Payment</span>
          <span className="adm-modal-val">
            {venta.estadoPago === 'PAGADO'
              ? `${paymentMethodLabel(venta.metodoPago)} · ${formatDateUTC(venta.fechaPago)}`
              : '—'}
          </span>
        </div>
        <div className="adm-modal-row">
          <span className="adm-modal-key">Source appointment</span>
          <span className="adm-modal-val">
            {venta.cita ? (
              <>
                <span className="adm-code">{venta.cita.codigo}</span>{' '}
                <span className="vta-muted">· {formatDateUTC(venta.cita.fechaServicio)}</span>
              </>
            ) : (
              <span className="vta-muted">None (manual sale)</span>
            )}
          </span>
        </div>
        <div className="adm-modal-row">
          <span className="adm-modal-key">Source quote</span>
          <span className="adm-modal-val">
            {venta.cotizacion ? (
              <>
                <span className="adm-code">{venta.cotizacion.codigo}</span>{' '}
                <span className="vta-muted">· est. {formatMoney(venta.cotizacion.totalEstimado)}</span>
              </>
            ) : (
              <span className="vta-muted">None</span>
            )}
          </span>
        </div>
        {venta.notas && (
          <div className="adm-modal-row adm-modal-row--full">
            <span className="adm-modal-key">Notes</span>
            <p className="adm-modal-text">{venta.notas}</p>
          </div>
        )}
        {venta.estadoPago === 'ANULADO' && (
          <div className="adm-modal-row adm-modal-row--full" style={{ background: '#fef2f2' }}>
            <span className="adm-modal-key" style={{ color: '#dc2626' }}>
              Void reason
            </span>
            <p className="adm-modal-text">{venta.motivoAnulacion || 'No reason provided.'}</p>
          </div>
        )}
      </div>

      <div className="adm-modal-footer">
        {venta.estadoPago === 'PENDIENTE' && (
          <button className="adm-modal-btn adm-modal-btn--accept" onClick={() => onAction('pay')}>
            Record payment
          </button>
        )}
        {venta.estadoPago !== 'ANULADO' && (
          <>
            <button className="adm-modal-btn vta-btn--secondary" onClick={() => onAction('edit')}>
              Edit
            </button>
            <button className="adm-modal-btn adm-modal-btn--reject" onClick={() => onAction('void')}>
              Void sale
            </button>
          </>
        )}
        <button className="adm-modal-btn adm-modal-btn--cancel" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
};

export const PaymentModal: React.FC<MutationProps> = ({ venta, token, onClose, onSaved }) => {
  const [monto, setMonto] = useState(String(venta.montoFinal ?? venta.montoCotizado));
  const [metodo, setMetodo] = useState<MetodoPago>('EFECTIVO');
  const [fecha, setFecha] = useState(todayInput());
  const [notas, setNotas] = useState(venta.notas ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoFinal = parseAmount(monto);
    if (montoFinal === undefined || Number.isNaN(montoFinal)) {
      setError('Enter a valid final amount.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await apiJson<Venta>(`/ventas/${venta.id}/pago`, token, {
        method: 'PATCH',
        body: JSON.stringify({ montoFinal, metodoPago: metodo, fechaPago: fecha, notas }),
      });
      onSaved(updated, `Payment recorded for ${venta.codigo}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h3 className="adm-modal-title">Record payment — {venta.codigo}</h3>
      <p className="adm-modal-subtitle">
        {clienteNombre(venta.cliente)} · {serviceLabel(venta.tipoLimpieza)} · quoted{' '}
        {formatMoney(venta.montoCotizado)}
      </p>

      <form onSubmit={submit} className="adm-modal-appointment-form">
        <div className="adm-form-row adm-form-row--dual">
          <div className="adm-form-group">
            <label className="adm-form-label">
              Final amount charged ($) <span className="req">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="adm-input"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="adm-form-group">
            <label className="adm-form-label">
              Payment date <span className="req">*</span>
            </label>
            <input
              type="date"
              className="adm-input"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="adm-form-group">
          <label className="adm-form-label">
            Payment method <span className="req">*</span>
          </label>
          <div className="vta-method-grid">
            {PAYMENT_METHODS.map((m) => (
              <button
                type="button"
                key={m.value}
                className={`adm-filter-btn ${metodo === m.value ? 'adm-filter-btn--active' : ''}`}
                onClick={() => setMetodo(m.value)}
                aria-pressed={metodo === m.value}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="adm-form-group">
          <label className="adm-form-label">Notes</label>
          <textarea
            className="adm-input adm-textarea"
            rows={2}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="e.g. Extra charge for inside fridge, tip included…"
          />
        </div>

        <FormError msg={error} />

        <div className="adm-modal-footer">
          <button type="submit" className="adm-modal-btn adm-modal-btn--accept" disabled={saving}>
            {saving ? <><MopSpinner />Saving…</> : 'Mark as paid'}
          </button>
          <button type="button" className="adm-modal-btn adm-modal-btn--cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const EditModal: React.FC<MutationProps> = ({ venta, token, onClose, onSaved }) => {
  const pagada = venta.estadoPago === 'PAGADO';
  const [tipo, setTipo] = useState(venta.tipoLimpieza);
  const [fechaServicio, setFechaServicio] = useState(isoToInputDate(venta.fechaServicio));
  const [cotizado, setCotizado] = useState(String(venta.montoCotizado));
  const [final, setFinal] = useState(venta.montoFinal != null ? String(venta.montoFinal) : '');
  const [metodo, setMetodo] = useState<MetodoPago>(venta.metodoPago ?? 'EFECTIVO');
  const [fechaPago, setFechaPago] = useState(isoToInputDate(venta.fechaPago) || todayInput());
  const [notas, setNotas] = useState(venta.notas ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoCotizado = parseAmount(cotizado);
    const montoFinal = parseAmount(final);
    if (montoCotizado === undefined || Number.isNaN(montoCotizado)) {
      setError('Enter a valid quoted amount.');
      return;
    }
    if (Number.isNaN(montoFinal) || (pagada && montoFinal === undefined)) {
      setError('Enter a valid final amount.');
      return;
    }

    const payload: Record<string, unknown> = {
      tipoLimpieza: tipo,
      fechaServicio,
      montoCotizado,
      montoFinal: montoFinal ?? null,
      notas,
    };
    if (pagada) {
      payload.metodoPago = metodo;
      payload.fechaPago = fechaPago;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await apiJson<Venta>(`/ventas/${venta.id}`, token, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      onSaved(updated, `${venta.codigo} updated`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} wide>
      <h3 className="adm-modal-title">Edit sale — {venta.codigo}</h3>
      <p className="adm-modal-subtitle">
        {clienteNombre(venta.cliente)} · <EstadoPagoBadge estado={venta.estadoPago} />
      </p>

      <form onSubmit={submit} className="adm-modal-appointment-form">
        <div className="adm-form-row adm-form-row--dual">
          <div className="adm-form-group">
            <label className="adm-form-label">Service</label>
            <select className="adm-input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {SERVICE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="adm-form-group">
            <label className="adm-form-label">Service date</label>
            <input
              type="date"
              className="adm-input"
              value={fechaServicio}
              onChange={(e) => setFechaServicio(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="adm-form-row adm-form-row--dual">
          <div className="adm-form-group">
            <label className="adm-form-label">Quoted amount ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="adm-input"
              value={cotizado}
              onChange={(e) => setCotizado(e.target.value)}
              required
            />
          </div>
          <div className="adm-form-group">
            <label className="adm-form-label">
              Final amount charged ($) {pagada && <span className="req">*</span>}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="adm-input"
              value={final}
              onChange={(e) => setFinal(e.target.value)}
              placeholder={pagada ? '' : 'Leave blank until charged'}
              required={pagada}
            />
          </div>
        </div>

        {pagada && (
          <div className="adm-form-row adm-form-row--dual">
            <div className="adm-form-group">
              <label className="adm-form-label">Payment method</label>
              <select
                className="adm-input"
                value={metodo}
                onChange={(e) => setMetodo(e.target.value as MetodoPago)}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="adm-form-group">
              <label className="adm-form-label">Payment date</label>
              <input
                type="date"
                className="adm-input"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        <div className="adm-form-group">
          <label className="adm-form-label">Notes</label>
          <textarea
            className="adm-input adm-textarea"
            rows={3}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </div>

        <FormError msg={error} />

        <div className="adm-modal-footer">
          <button type="submit" className="adm-modal-btn adm-modal-btn--accept" disabled={saving}>
            {saving ? <><MopSpinner />Saving…</> : 'Save changes'}
          </button>
          <button type="button" className="adm-modal-btn adm-modal-btn--cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const VoidModal: React.FC<MutationProps> = ({ venta, token, onClose, onSaved }) => {
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await apiJson<Venta>(`/ventas/${venta.id}/anular`, token, {
        method: 'PATCH',
        body: JSON.stringify({ motivo: motivo.trim() || undefined }),
      });
      onSaved(updated, `${venta.codigo} voided`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h3 className="adm-modal-title" style={{ color: '#dc2626' }}>
        Void sale — {venta.codigo}
      </h3>
      <p className="adm-modal-subtitle">
        The sale stays in the history but is excluded from revenue, outstanding balance and
        totals. This can't be undone.
      </p>
      {venta.estadoPago === 'PAGADO' && (
        <div className="adm-zone-alert-box" style={{ marginBottom: '1rem' }}>
          <strong>Heads up:</strong> this sale is already paid ({formatMoney(venta.montoFinal)}).
          Voiding it removes that amount from this month's revenue.
        </div>
      )}
      <div className="adm-form-group">
        <label className="adm-form-label">Reason (optional)</label>
        <textarea
          className="adm-input adm-textarea"
          rows={3}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="e.g. Client cancelled, duplicate record, refunded…"
        />
      </div>
      <FormError msg={error} />
      <div className="adm-modal-footer">
        <button className="adm-modal-btn adm-modal-btn--reject" onClick={submit} disabled={saving}>
          {saving ? <><MopSpinner />Voiding…</> : 'Confirm void'}
        </button>
        <button className="adm-modal-btn adm-modal-btn--cancel" onClick={onClose}>
          Back
        </button>
      </div>
    </Modal>
  );
};

interface ClienteOption {
  id: string;
  nombre: string;
  apellido?: string | null;
  telefono: string;
}

export const NewSaleModal: React.FC<{
  token: string;
  onClose: () => void;
  onSaved: (venta: Venta, msg: string) => void;
}> = ({ token, onClose, onSaved }) => {
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [clienteId, setClienteId] = useState<string>('new');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState('ESTANDAR');
  const [fechaServicio, setFechaServicio] = useState(todayInput());
  const [cotizado, setCotizado] = useState('');
  const [notas, setNotas] = useState('');
  const [pagado, setPagado] = useState(false);
  const [final, setFinal] = useState('');
  const [metodo, setMetodo] = useState<MetodoPago>('EFECTIVO');
  const [fechaPago, setFechaPago] = useState(todayInput());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiJson<ClienteOption[]>('/clientes', token)
      .then((list) => setClientes([...list].sort((a, b) => a.nombre.localeCompare(b.nombre))))
      .catch(() => setClientes([]));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoCotizado = parseAmount(cotizado);
    const montoFinal = parseAmount(final);
    if (montoCotizado === undefined || Number.isNaN(montoCotizado)) {
      setError('Enter the agreed price.');
      return;
    }
    if (Number.isNaN(montoFinal)) {
      setError('Enter a valid final amount.');
      return;
    }
    if (clienteId === 'new' && (!nombre.trim() || !telefono.trim())) {
      setError('Enter the client name and phone, or pick an existing client.');
      return;
    }

    const payload: Record<string, unknown> = {
      tipoLimpieza: tipo,
      fechaServicio,
      montoCotizado,
      notas: notas.trim() || undefined,
      ...(clienteId === 'new'
        ? {
            nombreCliente: nombre.trim(),
            telefonoCliente: telefono.trim(),
            emailCliente: email.trim() || undefined,
          }
        : { clienteId }),
      ...(pagado ? { pagado: true, montoFinal: montoFinal ?? montoCotizado, metodoPago: metodo, fechaPago } : {}),
    };

    setSaving(true);
    setError(null);
    try {
      const venta = await apiJson<Venta>('/ventas', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      onSaved(venta, `Sale ${venta.codigo} created`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} wide>
      <h3 className="adm-modal-title">+ New manual sale</h3>
      <p className="adm-modal-subtitle">
        Record a service agreed via WhatsApp or phone that didn't go through the calendar.
      </p>

      <form onSubmit={submit} className="adm-modal-appointment-form">
        <div className="adm-form-group">
          <label className="adm-form-label">
            Client <span className="req">*</span>
          </label>
          <select className="adm-input" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="new">+ New client</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {clienteNombre(c)} — {c.telefono}
              </option>
            ))}
          </select>
        </div>

        {clienteId === 'new' && (
          <div className="adm-form-row vta-form-row--triple">
            <div className="adm-form-group">
              <label className="adm-form-label">
                Full name <span className="req">*</span>
              </label>
              <input
                className="adm-input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="e.g. Sarah Johnson"
              />
            </div>
            <div className="adm-form-group">
              <label className="adm-form-label">
                Phone <span className="req">*</span>
              </label>
              <input
                type="tel"
                className="adm-input"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="(320) 555-0199"
              />
            </div>
            <div className="adm-form-group">
              <label className="adm-form-label">Email</label>
              <input
                type="email"
                className="adm-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="optional"
              />
            </div>
          </div>
        )}

        <div className="adm-form-row vta-form-row--triple">
          <div className="adm-form-group">
            <label className="adm-form-label">Service</label>
            <select className="adm-input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {SERVICE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="adm-form-group">
            <label className="adm-form-label">
              Service date <span className="req">*</span>
            </label>
            <input
              type="date"
              className="adm-input"
              value={fechaServicio}
              onChange={(e) => setFechaServicio(e.target.value)}
              required
            />
          </div>
          <div className="adm-form-group">
            <label className="adm-form-label">
              Agreed price ($) <span className="req">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="adm-input"
              value={cotizado}
              onChange={(e) => setCotizado(e.target.value)}
              placeholder="e.g. 180"
              required
            />
          </div>
        </div>

        <label className="vta-checkbox">
          <input type="checkbox" checked={pagado} onChange={(e) => setPagado(e.target.checked)} />
          <span>Already paid</span>
        </label>

        {pagado && (
          <div className="adm-form-row vta-form-row--triple">
            <div className="adm-form-group">
              <label className="adm-form-label">Final charged ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="adm-input"
                value={final}
                onChange={(e) => setFinal(e.target.value)}
                placeholder={cotizado ? `Same as quoted (${formatMoney(Number(cotizado))})` : 'Same as quoted'}
              />
            </div>
            <div className="adm-form-group">
              <label className="adm-form-label">Method</label>
              <select
                className="adm-input"
                value={metodo}
                onChange={(e) => setMetodo(e.target.value as MetodoPago)}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="adm-form-group">
              <label className="adm-form-label">Payment date</label>
              <input
                type="date"
                className="adm-input"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        <div className="adm-form-group">
          <label className="adm-form-label">Notes</label>
          <textarea
            className="adm-input adm-textarea"
            rows={2}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Details agreed upon via phone or WhatsApp…"
          />
        </div>

        <FormError msg={error} />

        <div className="adm-modal-footer">
          <button type="submit" className="adm-modal-btn adm-modal-btn--accept" disabled={saving}>
            {saving ? <><MopSpinner />Saving…</> : 'Save sale'}
          </button>
          <button type="button" className="adm-modal-btn adm-modal-btn--cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};
