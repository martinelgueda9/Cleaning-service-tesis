import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  Phone,
  MapPin,
  Plus,
  Search,
  Check,
  X,
  ArrowUpDown,
  User,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import '../styles/admin.css';
import { apiFetch, serviceLabel } from '../utils/adminApi';
import { VentasPanel } from '../components/admin/ventas/VentasPanel';
import { ClientesPanel } from '../components/admin/clientes/ClientesPanel';

export { serviceLabel };

interface Cotizacion {
  id: string;
  codigo: string;
  estado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
  totalEstimado: number | null;
  motivoRechazo: string | null;
  createdAt: string;
  cliente: {
    id: string;
    nombre: string;
    email?: string;
    telefono: string;
    direccion: string;
    ciudad?: string;
  };
  tipoLimpieza: string;
  numHabitaciones?: number;
  numBanos?: number;
  serviciosExtra?: string | null;
  extras?: string | null;
  notas?: string | null;
  fechaPreferida?: string | null;
  horaPreferida?: string | null;
  tamanio?: string | null;
  frecuencia?: string | null;
  notasCliente?: string | null;
  zona?: 'local' | 'extended' | 'out_of_zone';
  zonaLabel?: string;
  ciudadReal?: string | null;
}

interface Cita {
  id: string;
  codigo: string;
  fechaServicio: string;
  horaInicio: string;
  horaFin: string;
  estadoCita: 'PROGRAMADA' | 'EN_PROGRESO' | 'COMPLETADA' | 'CANCELADA';
  personalAsignado?: string;
  direccionServicio: string;
  notas?: string;
  cliente?: {
    id: string;
    nombre: string;
    email?: string;
    telefono?: string;
  };
  cotizacion?: {
    id: string;
    codigo: string;
    tipoLimpieza: string;
    totalEstimado?: number;
  };
  venta?: {
    id: string;
    codigo: string;
    estadoPago: 'PENDIENTE' | 'PAGADO' | 'ANULADO';
  } | null;
}

type ActiveTab = 'solicitudes' | 'agenda' | 'ventas' | 'clientes';
type FilterView = 'mensual' | 'semanal';
type StartOfWeekDay = 'sunday' | 'monday';

const TAB_HEADERS: Record<ActiveTab, { title: string; sub: string }> = {
  solicitudes: {
    title: 'Quote Requests',
    sub: 'Review, accept and schedule appointments or decline customer requests.',
  },
  agenda: {
    title: 'Service Schedule',
    sub: 'View calendar, upcoming services, and schedule manual appointments.',
  },
  ventas: {
    title: 'Sales',
    sub: 'Track every completed service, record payments and export reports.',
  },
  clientes: {
    title: 'Clients',
    sub: 'Client history: total spent, services, sales, appointments and quotes.',
  },
};

function formatDate(iso: string) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatPreferredDate(dateStr?: string | null, timeStr?: string | null) {
  if (!dateStr) return 'To coordinate';
  try {
    const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00'));
    if (isNaN(d.getTime())) return dateStr;
    const dateFormatted = d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const timeLabel =
      timeStr === 'morning'
        ? 'Morning'
        : timeStr === 'afternoon'
        ? 'Afternoon'
        : timeStr === 'flexible'
        ? 'Flexible'
        : timeStr || '';
    return timeLabel ? `${dateFormatted} (${timeLabel})` : dateFormatted;
  } catch {
    return dateStr;
  }
}

function formatTime12h(timeStr?: string | null): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].slice(0, 2);
  if (isNaN(hours)) return timeStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

const TIME_OPTIONS_12H = [
  { value: '06:00', label: '6:00 AM' },
  { value: '06:30', label: '6:30 AM' },
  { value: '07:00', label: '7:00 AM' },
  { value: '07:30', label: '7:30 AM' },
  { value: '08:00', label: '8:00 AM' },
  { value: '08:30', label: '8:30 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '09:30', label: '9:30 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '10:30', label: '10:30 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '11:30', label: '11:30 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '12:30', label: '12:30 PM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '13:30', label: '1:30 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '14:30', label: '2:30 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '15:30', label: '3:30 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '16:30', label: '4:30 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '17:30', label: '5:30 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '18:30', label: '6:30 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '19:30', label: '7:30 PM' },
  { value: '20:00', label: '8:00 PM' },
];

function getZoneBadge(c: Cotizacion): { type: 'local' | 'extended' | 'out'; label: string; city: string | null } {
  if (c.zona) {
    const type = c.zona === 'local' ? 'local' : c.zona === 'extended' ? 'extended' : 'out';
    const defaultLabel = c.zona === 'local' ? 'In zone' : c.zona === 'extended' ? 'Extended zone' : 'Out of zone';
    return {
      type,
      label: defaultLabel,
      city: c.ciudadReal || null,
    };
  }

  const addr = `${c.cliente?.direccion || ''} ${c.cliente?.ciudad || ''}`.toLowerCase();
  const LOCAL = [
    'saint cloud', 'st cloud', 'st. cloud', 'sartell', 'sauk rapids', 'waite park',
    'saint joseph', 'st joseph', 'st. joseph', 'saint augusta', 'st augusta', 'st. augusta',
    '56301', '56302', '56303', '56304', '56372', '56374', '56377', '56379', '56387', '56388', '56395'
  ];
  const EXTENDED = [
    'cold spring', 'avon', 'albany', 'rice', 'foley', 'clearwater',
    'rockville', 'kimball', 'becker', 'clear lake',
    '56320', '56310', '56307', '56367', '56329', '55320', '56369', '55353', '55308', '55319'
  ];

  for (const l of LOCAL) {
    if (addr.includes(l)) return { type: 'local', label: 'In zone', city: c.cliente?.ciudad || 'St. Cloud' };
  }
  for (const e of EXTENDED) {
    if (addr.includes(e)) return { type: 'extended', label: 'Extended zone', city: c.cliente?.ciudad || null };
  }
  return { type: 'out', label: 'Out of zone', city: null };
}

function formatCurrency(n: number | null | undefined) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function estadoLabel(e: string) {
  const norm = (e || '').toUpperCase();
  return { PENDIENTE: 'Pending', PENDING: 'Pending', ACEPTADA: 'Accepted', ACCEPTED: 'Accepted', RECHAZADA: 'Declined', DECLINED: 'Declined' }[norm] ?? e;
}

function isEstadoPendiente(e?: string | null): boolean {
  const norm = (e || '').toUpperCase();
  return norm === 'PENDIENTE' || norm === 'PENDING';
}

function citaEstadoLabel(e: string) {
  return (
    {
      PROGRAMADA: 'Scheduled',
      EN_PROGRESO: 'In Progress',
      COMPLETADA: 'Completed',
      CANCELADA: 'Cancelled',
    }[e] ?? e
  );
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

const SolicitudesPanel: React.FC<{
  token: string;
  onCitaCreated?: () => void;
  onPendingCountChange?: (count: number) => void;
}> = ({ token, onCitaCreated, onPendingCountChange }) => {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState<string>('PENDIENTE');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'preferred_date' | 'created_at' | 'price' | 'client'>(
    'preferred_date'
  );
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const toggleNote = (id: string) => {
    setExpandedNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [selected, setSelected] = useState<Cotizacion | null>(null);
  const [modalAction, setModalAction] = useState<'aceptar' | 'rechazar' | null>(null);

  const [citaFecha, setCitaFecha] = useState('');
  const [citaHoraInicio, setCitaHoraInicio] = useState('09:00');
  const [citaHoraFin, setCitaHoraFin] = useState('12:00');
  const [citaDireccion, setCitaDireccion] = useState('');
  const [citaPersonal, setCitaPersonal] = useState('');
  const [citaNotas, setCitaNotas] = useState('');

  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const showToast = (msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterEstado ? `/cotizaciones?estado=${filterEstado}` : '/cotizaciones';
      const res = await apiFetch(url, token);
      const data = await res.json();
      const list: Cotizacion[] = data.ok ? data.data : [];
      setCotizaciones(list);

      if (onPendingCountChange) {
        if (!filterEstado) {
          const pendCount = list.filter((c) => isEstadoPendiente(c.estado)).length;
          onPendingCountChange(pendCount);
        } else if (isEstadoPendiente(filterEstado)) {
          onPendingCountChange(list.length);
        }
      }
    } catch {
      setCotizaciones([]);
    } finally {
      setLoading(false);
    }
  }, [token, filterEstado, onPendingCountChange]);

  useEffect(() => {
    load();
  }, [load]);

  const openAceptarModal = (c: Cotizacion) => {
    setSelected(c);
    setModalAction('aceptar');

    const todayStr = new Date().toISOString().split('T')[0];
    const initialDate = c.fechaPreferida || todayStr;
    setCitaFecha(initialDate);

    if (c.horaPreferida === 'afternoon') {
      setCitaHoraInicio('13:00');
      setCitaHoraFin('16:00');
    } else {
      setCitaHoraInicio('09:00');
      setCitaHoraFin('12:00');
    }

    setCitaDireccion(c.cliente.direccion || 'St. Cloud, MN');
    setCitaPersonal('');
    setCitaNotas(c.notasCliente || (c.notas && !c.notas.includes('[Frecuencia:') ? c.notas : '') || '');
  };

  const openRechazarModal = (c: Cotizacion) => {
    setSelected(c);
    setModalAction('rechazar');
    setMotivo('');
  };

  const closeModal = () => {
    setSelected(null);
    setModalAction(null);
    setMotivo('');
  };

  const handleRevisar = async () => {
    if (!selected || !modalAction) return;
    setSubmitting(true);
    try {
      const body: any = { accion: modalAction };
      if (modalAction === 'rechazar') {
        body.motivo = motivo.trim() || undefined;
      } else if (modalAction === 'aceptar') {
        body.cita = {
          fechaServicio: citaFecha,
          horaInicio: citaHoraInicio,
          horaFin: citaHoraFin,
          direccionServicio: citaDireccion,
          personalAsignado: citaPersonal.trim() || undefined,
          notas: citaNotas.trim() || undefined,
        };
      }

      const res = await apiFetch(`/cotizaciones/${selected.id}/revisar`, token, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Error processing request');

      showToast(
        modalAction === 'aceptar'
          ? 'Request accepted and appointment scheduled on calendar '
          : 'Request declined',
        'ok'
      );
      closeModal();
      load();
      if (onCitaCreated && modalAction === 'aceptar') {
        onCitaCreated();
      }
    } catch (err) {
      showToast((err as Error).message || 'Error processing request', 'err');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCotizaciones = useMemo(() => {
    let list = [...cotizaciones];

    if (searchQuery.trim()) {
      const q = (searchQuery || '').toLowerCase().trim();
      list = list.filter(
        (c) =>
          (c.codigo || '').toLowerCase().includes(q) ||
          (c.cliente?.nombre || '').toLowerCase().includes(q) ||
          (c.cliente?.email && c.cliente.email.toLowerCase().includes(q)) ||
          (c.cliente?.telefono && c.cliente.telefono.includes(q)) ||
          serviceLabel(c.tipoLimpieza || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'preferred_date') {
        const dateA = a.fechaPreferida || '9999-12-31';
        const dateB = b.fechaPreferida || '9999-12-31';
        return dateA.localeCompare(dateB);
      }
      if (sortBy === 'created_at') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'price') {
        return (b.totalEstimado || 0) - (a.totalEstimado || 0);
      }
      if (sortBy === 'client') {
        return a.cliente.nombre.localeCompare(b.cliente.nombre);
      }
      return 0;
    });

    return list;
  }, [cotizaciones, searchQuery, sortBy]);

  return (
    <div className="adm-panel">
      {toast && <div className={`adm-toast adm-toast--${toast.type}`}>{toast.msg}</div>}

      <div className="adm-filters-toolbar">
        <div className="adm-filters-group">
          <span className="adm-filters-label">Status:</span>
          {['', 'PENDIENTE', 'ACEPTADA', 'RECHAZADA'].map((e) => (
            <button
              key={e}
              className={`adm-filter-btn ${filterEstado === e ? 'adm-filter-btn--active' : ''}`}
              onClick={() => setFilterEstado(e)}
            >
              {e === '' ? 'All' : estadoLabel(e)}
            </button>
          ))}
        </div>

        <div className="adm-search-sort-group">
          <div className="adm-search-box">
            <Search size={15} className="adm-search-icon" />
            <input
              type="text"
              placeholder="Search by client, phone, or code…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="adm-search-input"
            />
            {searchQuery && (
              <button
                className="adm-search-clear"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="adm-sort-box">
            <ArrowUpDown size={14} className="adm-sort-icon" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="adm-sort-select"
            >
              <option value="preferred_date">Preferred date (soonest)</option>
              <option value="created_at">Received date (newest)</option>
              <option value="price">Highest estimated total</option>
              <option value="client">Client name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="adm-loading">Loading requests…</div>
      ) : filteredCotizaciones.length === 0 ? (
        <div className="adm-empty">
          No requests found{searchQuery ? ` matching "${searchQuery}"` : ''}
          {filterEstado ? ` with status "${estadoLabel(filterEstado)}"` : ''}.
        </div>
      ) : (
        <>

          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Client & Contact</th>
                  <th>Service & Size</th>
                  <th>Extras</th>
                  <th>Location</th>
                  <th>Preferred Date</th>
                  <th>Received</th>
                  <th>Estimate</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCotizaciones.map((c) => (
                  <tr key={c.id}>
                    <td className="adm-code">{c.codigo}</td>
                    <td>
                      <div className="adm-client-name">{c.cliente.nombre}</div>
                      {c.cliente.telefono && (
                        <a href={`tel:${c.cliente.telefono}`} className="adm-client-phone-link">
                          <Phone size={12} />
                          <span>{c.cliente.telefono}</span>
                        </a>
                      )}
                      <div className="adm-client-email">{c.cliente.email || 'No email'}</div>
                    </td>
                    <td>
                      <strong className="adm-service-title">{serviceLabel(c.tipoLimpieza)}</strong>
                      <div className="adm-service-size">
                        {c.tamanio || (c.numHabitaciones ? `${c.numHabitaciones}b / ${c.numBanos}ba` : '—')}
                      </div>
                      {c.frecuencia && (
                        <span className="adm-frequency-tag">{c.frecuencia}</span>
                      )}
                      {c.notasCliente && (
                        <div className="adm-note-wrap">
                          <button
                            type="button"
                            className="adm-note-btn"
                            onClick={() => toggleNote(c.id)}
                          >
                            {expandedNotes[c.id] ? 'Hide note' : 'View note'}
                          </button>
                          {expandedNotes[c.id] && (
                            <div className="adm-client-note-inline">
                              "{c.notasCliente}"
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      {c.extras || c.serviciosExtra ? (
                        <div className="adm-extras-tags">
                          {(c.extras || c.serviciosExtra)!.split(',').map((ex, i) => (
                            <span key={i} className="adm-addon-badge">
                              {ex.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="adm-empty-dash">—</span>
                      )}
                    </td>
                    <td className="adm-location-cell">
                      {(() => {
                        const zone = getZoneBadge(c);
                        return (
                          <>
                            <div className="adm-location-top">
                              <span className={`adm-zone-badge adm-zone-badge--${zone.type}`}>
                                {zone.label}
                              </span>
                              {zone.city && <span className="adm-city-real">{zone.city}</span>}
                            </div>
                            <div className="adm-address-text" title={c.cliente.direccion}>
                              {c.cliente.direccion || 'No address'}
                            </div>
                          </>
                        );
                      })()}
                    </td>
                    <td>
                      <div className="adm-preferred-date-badge">
                        <CalendarIcon size={13} />
                        <span>{formatPreferredDate(c.fechaPreferida, c.horaPreferida)}</span>
                      </div>
                    </td>
                    <td className="adm-date-cell">{formatDate(c.createdAt)}</td>
                    <td className="adm-price-cell">{formatCurrency(c.totalEstimado)}</td>
                    <td>
                      <span className={`adm-badge adm-badge--${(c.estado || '').toLowerCase()}`}>
                        {estadoLabel(c.estado)}
                      </span>
                    </td>
                    <td className="adm-actions-td">
                      <div className="adm-actions-wrap">
                        <button
                          className="adm-action-btn adm-action-btn--view"
                          onClick={() => {
                            setSelected(c);
                            setModalAction(null);
                          }}
                          title="View full details"
                        >
                          View
                        </button>
                        {isEstadoPendiente(c.estado) && (
                          <>
                            <button
                              className="adm-action-btn adm-action-btn--accept"
                              onClick={() => openAceptarModal(c)}
                              title="Accept and schedule appointment"
                            >
                              Accept
                            </button>
                            <button
                              className="adm-action-btn adm-action-btn--reject"
                              onClick={() => openRechazarModal(c)}
                              title="Decline request"
                            >
                              Decline
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="adm-mobile-cards">
            {filteredCotizaciones.map((c) => (
              <div key={c.id} className="adm-card-mobile">
                <div className="adm-card-mobile-header">
                  <span className="adm-code">{c.codigo}</span>
                  <span className={`adm-badge adm-badge--${(c.estado || '').toLowerCase()}`}>
                    {estadoLabel(c.estado)}
                  </span>
                </div>

                <div className="adm-card-mobile-body">
                  <div className="adm-card-client-row">
                    <div>
                      <h4 className="adm-card-client-name">{c.cliente.nombre}</h4>
                      <div className="adm-card-zone-row">
                        {(() => {
                          const zone = getZoneBadge(c);
                          return (
                            <>
                              <span className={`adm-zone-badge adm-zone-badge--${zone.type}`}>
                                {zone.label}
                              </span>
                              {zone.city && <span className="adm-city-real">{zone.city}</span>}
                            </>
                          );
                        })()}
                      </div>
                      <p className="adm-card-address">{c.cliente.direccion}</p>
                    </div>
                    {c.cliente.telefono && (
                      <a href={`tel:${c.cliente.telefono}`} className="adm-mobile-call-btn">
                        <Phone size={14} />
                        <span>Call</span>
                      </a>
                    )}
                  </div>

                  <div className="adm-card-service-box">
                    <div className="adm-card-service-title">{serviceLabel(c.tipoLimpieza)}</div>
                    <div className="adm-card-service-meta">
                      <span>{c.tamanio || 'Size not specified'}</span>
                      {c.frecuencia && <span> • {c.frecuencia}</span>}
                    </div>
                    {c.notasCliente && (
                      <div className="adm-mobile-note-wrap">
                        <button
                          type="button"
                          className="adm-note-btn"
                          onClick={() => toggleNote(c.id)}
                        >
                          {expandedNotes[c.id] ? 'Hide note' : 'View note'}
                        </button>
                        {expandedNotes[c.id] && (
                          <div className="adm-card-client-note">
                            "{c.notasCliente}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {(c.extras || c.serviciosExtra) && (
                    <div className="adm-card-extras-row">
                      <span className="adm-meta-label">Extras:</span>
                      <div className="adm-extras-tags">
                        {(c.extras || c.serviciosExtra)!.split(',').map((ex, i) => (
                          <span key={i} className="adm-addon-badge">
                            {ex.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="adm-card-dates-grid">
                    <div className="adm-date-item">
                      <span className="adm-date-lbl">Preferred date:</span>
                      <strong className="adm-date-val">
                        {formatPreferredDate(c.fechaPreferida, c.horaPreferida)}
                      </strong>
                    </div>
                    <div className="adm-date-item">
                      <span className="adm-date-lbl">Received:</span>
                      <span className="adm-date-val">{formatDate(c.createdAt)}</span>
                    </div>
                  </div>

                  <div className="adm-card-price-row">
                    <span className="adm-price-lbl">Estimated price:</span>
                    <strong className="adm-price-amount">{formatCurrency(c.totalEstimado)}</strong>
                  </div>
                </div>

                <div className="adm-card-mobile-actions">
                  <button
                    className="adm-action-btn adm-action-btn--view full-btn"
                    onClick={() => {
                      setSelected(c);
                      setModalAction(null);
                    }}
                  >
                    View Details
                  </button>
                  {isEstadoPendiente(c.estado) && (
                    <>
                      <button
                        className="adm-action-btn adm-action-btn--accept full-btn"
                        onClick={() => openAceptarModal(c)}
                      >
                        Accept & Schedule
                      </button>
                      <button
                        className="adm-action-btn adm-action-btn--reject full-btn"
                        onClick={() => openRechazarModal(c)}
                      >
                        Decline
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selected && (
        <div className="adm-modal-overlay" onClick={closeModal}>
          <div className="adm-modal adm-modal--wide" onClick={(e) => e.stopPropagation()}>
            <button className="adm-modal-close" onClick={closeModal}>
              ×
            </button>

            {!modalAction ? (
              <>
                <h3 className="adm-modal-title">Quote Request {selected.codigo}</h3>
                <p className="adm-modal-subtitle">Full details of the received quote request.</p>

                <div className="adm-modal-grid">
                  <div className="adm-modal-row">
                    <span className="adm-modal-key">Client</span>
                    <strong className="adm-modal-val">{selected.cliente.nombre}</strong>
                  </div>
                  <div className="adm-modal-row">
                    <span className="adm-modal-key">Phone</span>
                    <span className="adm-modal-val">
                      {selected.cliente.telefono ? (
                        <a href={`tel:${selected.cliente.telefono}`} style={{ color: '#0284c7' }}>
                          {selected.cliente.telefono}
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </span>
                  </div>
                  <div className="adm-modal-row">
                    <span className="adm-modal-key">Email</span>
                    <span className="adm-modal-val">{selected.cliente.email || 'Not provided'}</span>
                  </div>
                  <div className="adm-modal-row">
                    <span className="adm-modal-key">Address & Zone</span>
                    <div className="adm-modal-val">
                      {(() => {
                        const zone = getZoneBadge(selected);
                        return (
                          <div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                              <span className={`adm-zone-badge adm-zone-badge--${zone.type}`}>
                                {zone.label}
                              </span>
                              {zone.city && <span style={{ fontWeight: 600, fontSize: '13px' }}>{zone.city}</span>}
                            </div>
                            <div>{selected.cliente.direccion}</div>
                            {zone.type === 'out' && (
                              <div className="adm-zone-alert-box">
                                <strong>Attention:</strong> This address is outside our standard local and extended service areas in Saint Cloud / Stearns / Benton.
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="adm-modal-row">
                    <span className="adm-modal-key">Service</span>
                    <strong className="adm-modal-val">{serviceLabel(selected.tipoLimpieza)}</strong>
                  </div>
                  <div className="adm-modal-row">
                    <span className="adm-modal-key">Size / Layout</span>
                    <span className="adm-modal-val">
                      {selected.tamanio ||
                        (selected.numHabitaciones
                          ? `${selected.numHabitaciones} bed / ${selected.numBanos} bath`
                          : 'Not specified')}
                    </span>
                  </div>
                  <div className="adm-modal-row">
                    <span className="adm-modal-key">Extras / Add-ons</span>
                    <span className="adm-modal-val">
                      {selected.extras || selected.serviciosExtra || 'None requested'}
                    </span>
                  </div>
                  <div className="adm-modal-row">
                    <span className="adm-modal-key">Preferred date</span>
                    <strong className="adm-modal-val" style={{ color: '#0284c7' }}>
                      {formatPreferredDate(selected.fechaPreferida, selected.horaPreferida)}
                    </strong>
                  </div>
                  <div className="adm-modal-row">
                    <span className="adm-modal-key">Frequency</span>
                    <span className="adm-modal-val">{selected.frecuencia || 'One-time'}</span>
                  </div>
                  <div className="adm-modal-row">
                    <span className="adm-modal-key">Estimated total</span>
                    <strong className="adm-modal-val" style={{ fontSize: '16px' }}>
                      {formatCurrency(selected.totalEstimado)}
                    </strong>
                  </div>
                  <div className="adm-modal-row">
                    <span className="adm-modal-key">Submission date</span>
                    <span className="adm-modal-val">{formatDate(selected.createdAt)}</span>
                  </div>
                  {selected.notasCliente ? (
                    <div className="adm-modal-row adm-modal-row--full">
                      <span className="adm-modal-key">Client notes</span>
                      <p className="adm-modal-text">"{selected.notasCliente}"</p>
                    </div>
                  ) : selected.notas && !selected.notas.includes('[Frecuencia:') ? (
                    <div className="adm-modal-row adm-modal-row--full">
                      <span className="adm-modal-key">Client notes</span>
                      <p className="adm-modal-text">{selected.notas}</p>
                    </div>
                  ) : null}
                  {selected.motivoRechazo && (
                    <div className="adm-modal-row adm-modal-row--full" style={{ background: '#fef2f2' }}>
                      <span className="adm-modal-key" style={{ color: '#dc2626' }}>
                        Decline reason
                      </span>
                      <p className="adm-modal-text">{selected.motivoRechazo}</p>
                    </div>
                  )}
                </div>

                <div className="adm-modal-footer">
                  {isEstadoPendiente(selected.estado) && (
                    <>
                      <button
                        className="adm-modal-btn adm-modal-btn--accept"
                        onClick={() => openAceptarModal(selected)}
                      >
                        Accept & Schedule Appointment
                      </button>
                      <button
                        className="adm-modal-btn adm-modal-btn--reject"
                        onClick={() => openRechazarModal(selected)}
                      >
                        Decline Request
                      </button>
                    </>
                  )}
                  <button className="adm-modal-btn adm-modal-btn--cancel" onClick={closeModal}>
                    Close
                  </button>
                </div>
              </>
            ) : modalAction === 'aceptar' ? (

              <>
                <h3 className="adm-modal-title">Accept & Schedule — {selected.codigo}</h3>
                <p className="adm-modal-subtitle">
                  Confirm the date and time to automatically schedule this service on the calendar.
                </p>

                <div className="adm-modal-appointment-form">
                  {getZoneBadge(selected).type === 'out' && (
                    <div className="adm-zone-alert-box" style={{ marginBottom: '1rem' }}>
                      <strong>Attention:</strong> The client's address ({selected.cliente.direccion}) is listed as <strong>Out of zone</strong>. Verify with the client whether a travel fee applies before confirming.
                    </div>
                  )}
                  <div className="adm-form-card-summary">
                    <div>
                      <strong>{selected.cliente.nombre}</strong> • {serviceLabel(selected.tipoLimpieza)}
                    </div>
                    <div className="adm-form-card-meta">
                      Estimated total: {formatCurrency(selected.totalEstimado)} | Phone:{' '}
                      {selected.cliente.telefono}
                    </div>
                  </div>

                  <div className="adm-form-row adm-form-row--dual">
                    <div className="adm-form-group">
                      <label className="adm-form-label">
                        Service date <span className="req">*</span>
                      </label>
                      <input
                        type="date"
                        className="adm-input"
                        value={citaFecha}
                        onChange={(e) => setCitaFecha(e.target.value)}
                        required
                      />
                    </div>
                    <div className="adm-form-group">
                      <label className="adm-form-label">
                        Service address <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        className="adm-input"
                        value={citaDireccion}
                        onChange={(e) => setCitaDireccion(e.target.value)}
                        placeholder="Street address or city"
                        required
                      />
                    </div>
                  </div>

                  <div className="adm-form-row adm-form-row--dual">
                    <div className="adm-form-group">
                      <label className="adm-form-label">
                        Start time <span className="req">*</span>
                      </label>
                      <select
                        className="adm-input"
                        value={citaHoraInicio}
                        onChange={(e) => setCitaHoraInicio(e.target.value)}
                        required
                      >
                        {TIME_OPTIONS_12H.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="adm-form-group">
                      <label className="adm-form-label">
                        End time <span className="req">*</span>
                      </label>
                      <select
                        className="adm-input"
                        value={citaHoraFin}
                        onChange={(e) => setCitaHoraFin(e.target.value)}
                        required
                      >
                        {TIME_OPTIONS_12H.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">Assigned staff (optional)</label>
                    <input
                      type="text"
                      className="adm-input"
                      value={citaPersonal}
                      onChange={(e) => setCitaPersonal(e.target.value)}
                      placeholder="e.g. Marcela + Team 1"
                    />
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">Access notes or instructions (optional)</label>
                    <textarea
                      className="adm-input adm-textarea"
                      rows={2}
                      value={citaNotas}
                      onChange={(e) => setCitaNotas(e.target.value)}
                      placeholder="Gate code, key under mat, pets in house, etc."
                    />
                  </div>
                </div>

                <div className="adm-modal-footer">
                  <button
                    className="adm-modal-btn adm-modal-btn--accept"
                    onClick={handleRevisar}
                    disabled={submitting || !citaFecha || !citaHoraInicio || !citaHoraFin}
                  >
                    {submitting ? 'Creating appointment…' : ' Confirm & Schedule on Calendar'}
                  </button>
                  <button className="adm-modal-btn adm-modal-btn--cancel" onClick={closeModal}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="adm-modal-title" style={{ color: '#dc2626' }}>
                  Decline Request — {selected.codigo}
                </h3>
                <p className="adm-modal-subtitle">
                  Are you sure you want to decline <strong>{selected.cliente.nombre}</strong>'s request?
                </p>

                <div className="adm-form-group" style={{ marginTop: '1rem' }}>
                  <label className="adm-form-label">Decline reason (optional):</label>
                  <textarea
                    className="adm-input adm-textarea"
                    placeholder="Enter reason (e.g. No availability on requested date, outside service area, etc.)"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    rows={4}
                  />
                  <span className="adm-field-hint">
                    If left blank, the client will be notified without a detailed reason.
                  </span>
                </div>

                <div className="adm-modal-footer">
                  <button
                    className="adm-modal-btn adm-modal-btn--reject"
                    onClick={handleRevisar}
                    disabled={submitting}
                  >
                    {submitting ? 'Processing…' : 'Confirm Decline'}
                  </button>
                  <button className="adm-modal-btn adm-modal-btn--cancel" onClick={closeModal}>
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AgendaPanel: React.FC<{ token: string }> = ({ token }) => {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<FilterView>('mensual');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDay, setStartDay] = useState<StartOfWeekDay>('sunday');

  const [showNewCitaModal, setShowNewCitaModal] = useState(false);
  const [newCitaNombre, setNewCitaNombre] = useState('');
  const [newCitaTelefono, setNewCitaTelefono] = useState('');
  const [newCitaEmail, setNewCitaEmail] = useState('');
  const [newCitaTipo, setNewCitaTipo] = useState('ESTANDAR');
  const [newCitaFecha, setNewCitaFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [newCitaHoraInicio, setNewCitaHoraInicio] = useState('09:00');
  const [newCitaHoraFin, setNewCitaHoraFin] = useState('12:00');
  const [newCitaDireccion, setNewCitaDireccion] = useState('St. Cloud, MN');
  const [newCitaPrecio, setNewCitaPrecio] = useState('');
  const [newCitaNotas, setNewCitaNotas] = useState('');
  const [creatingCita, setCreatingCita] = useState(false);

  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [updatingEstado, setUpdatingEstado] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const showToast = (msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadCitas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/agenda', token);
      const data = await res.json();
      setCitas(data.ok ? data.data : []);
    } catch {
      setCitas([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadCitas();
  }, [loadCitas]);

  const handleUpdateCitaEstado = async (id: string, nuevoEstado: string) => {
    setUpdatingEstado(true);
    try {
      const res = await apiFetch(`/agenda/${id}/estado`, token, {
        method: 'PATCH',
        body: JSON.stringify({ estadoCita: nuevoEstado }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Error updating status');

      const venta = data.data?.venta as Cita['venta'];
      showToast(
        nuevoEstado === 'COMPLETADA' && venta
          ? `Completed — sale ${venta.codigo} is in Sales`
          : `Status updated to ${citaEstadoLabel(nuevoEstado)} `,
        'ok'
      );
      if (selectedCita && selectedCita.id === id) {
        setSelectedCita({ ...selectedCita, estadoCita: nuevoEstado as any, venta: venta ?? selectedCita.venta });
      }
      loadCitas();
    } catch (err) {
      showToast((err as Error).message, 'err');
    } finally {
      setUpdatingEstado(false);
    }
  };

  const handleCreateManualCita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCitaNombre.trim() || !newCitaTelefono.trim() || !newCitaFecha) {
      showToast('Please fill in client name, phone number, and service date', 'err');
      return;
    }

    setCreatingCita(true);
    try {
      const payload = {
        nombreCliente: newCitaNombre.trim(),
        telefonoCliente: newCitaTelefono.trim(),
        emailCliente: newCitaEmail.trim() || undefined,
        tipoLimpieza: newCitaTipo,
        totalEstimado: newCitaPrecio ? parseFloat(newCitaPrecio) : 0,
        fechaServicio: newCitaFecha,
        horaInicio: newCitaHoraInicio,
        horaFin: newCitaHoraFin,
        direccionServicio: newCitaDireccion.trim() || 'St. Cloud, MN',
        notas: newCitaNotas.trim() || undefined,
      };

      const res = await apiFetch('/agenda', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Error creating appointment');

      showToast('Appointment created successfully ', 'ok');
      setShowNewCitaModal(false);
      setNewCitaNombre('');
      setNewCitaTelefono('');
      setNewCitaEmail('');
      setNewCitaPrecio('');
      setNewCitaNotas('');
      loadCitas();
    } catch (err) {
      showToast((err as Error).message || 'Error creating appointment', 'err');
    } finally {
      setCreatingCita(false);
    }
  };

  const { citasHoy, proximasCitas } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hoy: Cita[] = [];
    const proximas: Cita[] = [];

    citas.forEach((c) => {
      const cDate = new Date(c.fechaServicio);
      if (isSameDay(cDate, today)) {
        hoy.push(c);
      } else if (cDate > today) {
        proximas.push(c);
      }
    });

    hoy.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    proximas.sort((a, b) => {
      const dateDiff = new Date(a.fechaServicio).getTime() - new Date(b.fechaServicio).getTime();
      return dateDiff !== 0 ? dateDiff : a.horaInicio.localeCompare(b.horaInicio);
    });

    return { citasHoy: hoy, proximasCitas: proximas.slice(0, 5) };
  }, [citas]);

  const getCitasForDay = (day: Date) =>
    citas.filter((c) => isSameDay(new Date(c.fechaServicio), day));

  const renderMonthly = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const offset = startDay === 'sunday' ? firstDayOfMonth : firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const cells: (Date | null)[] = [
      ...Array(offset).fill(null),
      ...Array.from({ length: totalDays }, (_, i) => new Date(year, month, i + 1)),
    ];

    const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const headerDays =
      startDay === 'sunday'
        ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <div className="adm-cal">
        <div className="adm-cal-nav">
          <div className="adm-cal-nav-left">
            <button
              className="adm-cal-nav-btn"
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              title="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="adm-cal-month">{monthName}</span>
            <button
              className="adm-cal-nav-btn"
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              title="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            className="adm-filter-btn adm-filter-btn--today"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </button>
        </div>

        <div className="adm-cal-grid">
          {headerDays.map((d) => (
            <div key={d} className="adm-cal-header-cell">
              {d}
            </div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} className="adm-cal-cell adm-cal-cell--empty" />;
            const dayCitas = getCitasForDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={i}
                className={`adm-cal-cell ${isToday ? 'adm-cal-cell--today' : ''} ${
                  dayCitas.length > 0 ? 'adm-cal-cell--has-events' : ''
                }`}
              >
                <span className="adm-cal-day-num">{day.getDate()}</span>
                <div className="adm-cal-events-list">
                  {dayCitas.slice(0, 2).map((c) => (
                    <div
                      key={c.id}
                      className={`adm-cal-event adm-cal-event--${(c.estadoCita || '').toLowerCase()}`}
                      onClick={() => setSelectedCita(c)}
                      title={`${formatTime12h(c.horaInicio)} - ${c.cliente?.nombre || 'Client'} (${serviceLabel(
                        c.cotizacion?.tipoLimpieza || 'Service'
                      )})`}
                    >
                      <span className="adm-event-time">{formatTime12h(c.horaInicio)}</span>
                      <span className="adm-event-name">
                        {c.cliente?.nombre ? c.cliente.nombre.split(' ')[0] : 'Appointment'}
                      </span>
                    </div>
                  ))}
                  {dayCitas.length > 2 && (
                    <div
                      className="adm-cal-more"
                      onClick={() => setSelectedCita(dayCitas[2])}
                    >
                      +{dayCitas.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekly = () => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff =
      startDay === 'sunday'
        ? d.getDate() - day
        : d.getDate() - day + (day === 0 ? -6 : 1);

    d.setDate(diff);
    d.setHours(0, 0, 0, 0);

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(d, i));

    const prevWeek = () => setCurrentDate(addDays(currentDate, -7));
    const nextWeek = () => setCurrentDate(addDays(currentDate, 7));

    const rangeLabel = `${weekDays[0].toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })} – ${weekDays[6].toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;

    return (
      <div className="adm-cal">
        <div className="adm-cal-nav">
          <div className="adm-cal-nav-left">
            <button className="adm-cal-nav-btn" onClick={prevWeek} title="Previous week">
              <ChevronLeft size={16} />
            </button>
            <span className="adm-cal-month">{rangeLabel}</span>
            <button className="adm-cal-nav-btn" onClick={nextWeek} title="Next week">
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            className="adm-filter-btn adm-filter-btn--today"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </button>
        </div>

        <div className="adm-week-grid">
          {weekDays.map((wDay) => {
            const dayCitas = getCitasForDay(wDay);
            const isToday = isSameDay(wDay, new Date());
            const dayName = wDay.toLocaleDateString('en-US', { weekday: 'short' });

            return (
              <div
                key={wDay.toISOString()}
                className={`adm-week-col ${isToday ? 'adm-week-col--today' : ''}`}
              >
                <div className="adm-week-col-header">
                  <span className="adm-week-day-name">{dayName.toUpperCase()}</span>
                  <span className={`adm-week-day-num ${isToday ? 'adm-week-day-num--today' : ''}`}>
                    {wDay.getDate()}
                  </span>
                </div>
                <div className="adm-week-col-events">
                  {dayCitas.length === 0 ? (
                    <span className="adm-week-empty-day">—</span>
                  ) : (
                    dayCitas.map((c) => (
                      <div
                        key={c.id}
                        className={`adm-week-event adm-cal-event--${(c.estadoCita || '').toLowerCase()}`}
                        onClick={() => setSelectedCita(c)}
                      >
                        <div className="adm-week-event-time">
                          <Clock size={11} />
                          <span>
                            {formatTime12h(c.horaInicio)} – {formatTime12h(c.horaFin)}
                          </span>
                        </div>
                        <strong className="adm-week-event-service">
                          {serviceLabel(c.cotizacion?.tipoLimpieza || 'Service')}
                        </strong>
                        {c.cliente && (
                          <span className="adm-week-event-client">{c.cliente.nombre}</span>
                        )}
                        <span className={`adm-badge adm-badge--cita-${(c.estadoCita || '').toLowerCase()}`}>
                          {citaEstadoLabel(c.estadoCita)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="adm-panel">
      {toast && <div className={`adm-toast adm-toast--${toast.type}`}>{toast.msg}</div>}

      <div className="adm-upcoming-box">
        <div className="adm-upcoming-header">
          <div className="adm-upcoming-title-wrap">
            <h3 className="adm-upcoming-title">
              Today / Upcoming Services ({citasHoy.length} today)
            </h3>
          </div>
          <button
            className="adm-btn-new-cita"
            onClick={() => setShowNewCitaModal(true)}
          >
            <Plus size={15} />
            <span>+ New appointment</span>
          </button>
        </div>

        {citasHoy.length > 0 ? (
          <div className="adm-today-cards-grid">
            {citasHoy.map((c) => (
              <div
                key={c.id}
                className={`adm-today-card adm-today-card--${(c.estadoCita || '').toLowerCase()}`}
                onClick={() => setSelectedCita(c)}
              >
                <div className="adm-today-card-top">
                  <span className="adm-today-time-badge">
                    <Clock size={12} />
                    {formatTime12h(c.horaInicio)} – {formatTime12h(c.horaFin)}
                  </span>
                  <span className={`adm-badge adm-badge--cita-${(c.estadoCita || '').toLowerCase()}`}>
                    {citaEstadoLabel(c.estadoCita)}
                  </span>
                </div>
                <h4 className="adm-today-service">
                  {serviceLabel(c.cotizacion?.tipoLimpieza || 'Service')}
                </h4>
                <div className="adm-today-client">
                  <strong>{c.cliente?.nombre || 'Client'}</strong>
                  {c.cliente?.telefono && (
                    <a
                      href={`tel:${c.cliente.telefono}`}
                      onClick={(e) => e.stopPropagation()}
                      className="adm-today-phone-link"
                    >
                      <Phone size={12} />
                      {c.cliente.telefono}
                    </a>
                  )}
                </div>
                <div className="adm-today-address">
                  <MapPin size={12} />
                  <span>{c.direccionServicio}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="adm-upcoming-empty-note">
            <span>No services scheduled for today.</span>
            {proximasCitas.length > 0 && (
              <span> Next scheduled service: {formatDate(proximasCitas[0].fechaServicio)} ({formatTime12h(proximasCitas[0].horaInicio)})</span>
            )}
          </div>
        )}
      </div>

      <div className="adm-cal-controls-bar">
        <div className="adm-filters-group">
          <span className="adm-filters-label">View:</span>
          <button
            className={`adm-filter-btn ${view === 'mensual' ? 'adm-filter-btn--active' : ''}`}
            onClick={() => setView('mensual')}
          >
            Monthly
          </button>
          <button
            className={`adm-filter-btn ${view === 'semanal' ? 'adm-filter-btn--active' : ''}`}
            onClick={() => setView('semanal')}
          >
            Weekly
          </button>
        </div>

        <div className="adm-cal-options-right">
          <div className="adm-start-day-toggle">
            <span className="adm-start-day-label">Week starts on:</span>
            <button
              className={`adm-toggle-pill ${startDay === 'sunday' ? 'adm-toggle-pill--active' : ''}`}
              onClick={() => setStartDay('sunday')}
              title="Standard in the United States"
            >
              Sunday
            </button>
            <button
              className={`adm-toggle-pill ${startDay === 'monday' ? 'adm-toggle-pill--active' : ''}`}
              onClick={() => setStartDay('monday')}
            >
              Monday
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="adm-loading">Loading schedule…</div>
      ) : view === 'mensual' ? (
        renderMonthly()
      ) : (
        renderWeekly()
      )}

      <div className="adm-legend">
        <span className="adm-legend-title">Appointment statuses:</span>
        {[
          { key: 'programada', label: 'Scheduled' },
          { key: 'en_progreso', label: 'In Progress' },
          { key: 'completada', label: 'Completed' },
          { key: 'cancelada', label: 'Cancelled' },
        ].map((l) => (
          <span key={l.key} className={`adm-legend-item adm-cal-event--${l.key}`}>
            {l.label}
          </span>
        ))}
      </div>

      {selectedCita && (
        <div className="adm-modal-overlay" onClick={() => setSelectedCita(null)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <button className="adm-modal-close" onClick={() => setSelectedCita(null)}>
              ×
            </button>

            <h3 className="adm-modal-title">Appointment {selectedCita.codigo}</h3>
            <p className="adm-modal-subtitle">Scheduled service details on calendar.</p>

            <div className="adm-modal-grid">
              <div className="adm-modal-row">
                <span className="adm-modal-key">Client</span>
                <strong className="adm-modal-val">
                  {selectedCita.cliente?.nombre || 'Website Client'}
                </strong>
              </div>
              {selectedCita.cliente?.telefono && (
                <div className="adm-modal-row">
                  <span className="adm-modal-key">Phone</span>
                  <span className="adm-modal-val">
                    <a
                      href={`tel:${selectedCita.cliente.telefono}`}
                      style={{ color: '#0284c7', fontWeight: 600 }}
                    >
                      {selectedCita.cliente.telefono}
                    </a>
                  </span>
                </div>
              )}
              <div className="adm-modal-row">
                <span className="adm-modal-key">Service</span>
                <strong className="adm-modal-val">
                  {serviceLabel(selectedCita.cotizacion?.tipoLimpieza || 'Service')}
                </strong>
              </div>
              <div className="adm-modal-row">
                <span className="adm-modal-key">Date</span>
                <span className="adm-modal-val">{formatDate(selectedCita.fechaServicio)}</span>
              </div>
              <div className="adm-modal-row">
                <span className="adm-modal-key">Time</span>
                <span className="adm-modal-val">
                  {formatTime12h(selectedCita.horaInicio)} – {formatTime12h(selectedCita.horaFin)}
                </span>
              </div>
              <div className="adm-modal-row">
                <span className="adm-modal-key">Address</span>
                <span className="adm-modal-val">{selectedCita.direccionServicio}</span>
              </div>
              {selectedCita.personalAsignado && (
                <div className="adm-modal-row">
                  <span className="adm-modal-key">Staff</span>
                  <span className="adm-modal-val">{selectedCita.personalAsignado}</span>
                </div>
              )}
              {selectedCita.cotizacion?.totalEstimado != null && (
                <div className="adm-modal-row">
                  <span className="adm-modal-key">Estimated price</span>
                  <strong className="adm-modal-val">
                    {formatCurrency(selectedCita.cotizacion.totalEstimado)}
                  </strong>
                </div>
              )}
              {selectedCita.notas && (
                <div className="adm-modal-row adm-modal-row--full">
                  <span className="adm-modal-key">Notes</span>
                  <p className="adm-modal-text">{selectedCita.notas}</p>
                </div>
              )}
              {selectedCita.venta && (
                <div className="adm-modal-row">
                  <span className="adm-modal-key">Sale</span>
                  <span className="adm-modal-val">
                    <span className="adm-code">{selectedCita.venta.codigo}</span>{' '}
                    ({{ PENDIENTE: 'Pending payment', PAGADO: 'Paid', ANULADO: 'Voided' }[selectedCita.venta.estadoPago]})
                  </span>
                </div>
              )}
              <div className="adm-modal-row adm-modal-row--full">
                <span className="adm-modal-key">Current status</span>
                <span className={`adm-badge adm-badge--cita-${(selectedCita?.estadoCita || '').toLowerCase()}`}>
                  {citaEstadoLabel(selectedCita.estadoCita)}
                </span>
              </div>
            </div>

            <div className="adm-status-change-block">
              <span className="adm-status-change-label">Change appointment status:</span>
              <div className="adm-status-buttons-row">
                {selectedCita.estadoCita !== 'PROGRAMADA' && (
                  <button
                    className="adm-status-btn adm-status-btn--prog"
                    disabled={updatingEstado}
                    onClick={() => handleUpdateCitaEstado(selectedCita.id, 'PROGRAMADA')}
                  >
                    Mark Scheduled
                  </button>
                )}
                {selectedCita.estadoCita !== 'EN_PROGRESO' && (
                  <button
                    className="adm-status-btn adm-status-btn--progress"
                    disabled={updatingEstado}
                    onClick={() => handleUpdateCitaEstado(selectedCita.id, 'EN_PROGRESO')}
                  >
                    Start (In Progress)
                  </button>
                )}
                {selectedCita.estadoCita !== 'COMPLETADA' && (
                  <button
                    className="adm-status-btn adm-status-btn--complete"
                    disabled={updatingEstado}
                    onClick={() => handleUpdateCitaEstado(selectedCita.id, 'COMPLETADA')}
                  >
                     Completed
                  </button>
                )}
                {selectedCita.estadoCita !== 'CANCELADA' && (
                  <button
                    className="adm-status-btn adm-status-btn--cancel"
                    disabled={updatingEstado}
                    onClick={() => handleUpdateCitaEstado(selectedCita.id, 'CANCELADA')}
                  >
                    Cancel Appointment
                  </button>
                )}
              </div>
            </div>

            <div className="adm-modal-footer">
              <button
                className="adm-modal-btn adm-modal-btn--cancel"
                onClick={() => setSelectedCita(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewCitaModal && (
        <div className="adm-modal-overlay" onClick={() => setShowNewCitaModal(false)}>
          <div className="adm-modal adm-modal--wide" onClick={(e) => e.stopPropagation()}>
            <button className="adm-modal-close" onClick={() => setShowNewCitaModal(false)}>
              ×
            </button>

            <h3 className="adm-modal-title">+ New Manual Appointment</h3>
            <p className="adm-modal-subtitle">
              Directly schedule services received via WhatsApp or phone calls.
            </p>

            <form onSubmit={handleCreateManualCita} className="adm-modal-appointment-form">
              <div className="adm-form-row adm-form-row--dual">
                <div className="adm-form-group">
                  <label className="adm-form-label">
                    Client full name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="adm-input"
                    placeholder="e.g. Sarah Johnson"
                    value={newCitaNombre}
                    onChange={(e) => setNewCitaNombre(e.target.value)}
                    required
                  />
                </div>
                <div className="adm-form-group">
                  <label className="adm-form-label">
                    Client phone <span className="req">*</span>
                  </label>
                  <input
                    type="tel"
                    className="adm-input"
                    placeholder="e.g. (320) 555-0199"
                    value={newCitaTelefono}
                    onChange={(e) => setNewCitaTelefono(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="adm-form-row adm-form-row--dual">
                <div className="adm-form-group">
                  <label className="adm-form-label">Email (optional)</label>
                  <input
                    type="email"
                    className="adm-input"
                    placeholder="client@example.com"
                    value={newCitaEmail}
                    onChange={(e) => setNewCitaEmail(e.target.value)}
                  />
                </div>
                <div className="adm-form-group">
                  <label className="adm-form-label">Service type</label>
                  <select
                    className="adm-input"
                    value={newCitaTipo}
                    onChange={(e) => setNewCitaTipo(e.target.value)}
                  >
                    <option value="ESTANDAR">Standard Cleaning</option>
                    <option value="PROFUNDA">Deep Cleaning</option>
                    <option value="MUDANZA_ENTRADA">Move-In Cleaning</option>
                    <option value="MUDANZA_SALIDA">Move-Out Cleaning</option>
                    <option value="POST_CONSTRUCCION">Post-Construction</option>
                    <option value="OFICINA">Commercial / Office</option>
                  </select>
                </div>
              </div>

              <div className="adm-form-row adm-form-row--dual">
                <div className="adm-form-group">
                  <label className="adm-form-label">
                    Service date <span className="req">*</span>
                  </label>
                  <input
                    type="date"
                    className="adm-input"
                    value={newCitaFecha}
                    onChange={(e) => setNewCitaFecha(e.target.value)}
                    required
                  />
                </div>
                <div className="adm-form-group">
                  <label className="adm-form-label">Agreed price ($ USD)</label>
                  <input
                    type="number"
                    className="adm-input"
                    placeholder="e.g. 180"
                    value={newCitaPrecio}
                    onChange={(e) => setNewCitaPrecio(e.target.value)}
                  />
                </div>
              </div>

              <div className="adm-form-row adm-form-row--dual">
                <div className="adm-form-group">
                  <label className="adm-form-label">Start time <span className="req">*</span></label>
                  <select
                    className="adm-input"
                    value={newCitaHoraInicio}
                    onChange={(e) => setNewCitaHoraInicio(e.target.value)}
                    required
                  >
                    {TIME_OPTIONS_12H.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="adm-form-group">
                  <label className="adm-form-label">End time <span className="req">*</span></label>
                  <select
                    className="adm-input"
                    value={newCitaHoraFin}
                    onChange={(e) => setNewCitaHoraFin(e.target.value)}
                    required
                  >
                    {TIME_OPTIONS_12H.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="adm-form-group">
                <label className="adm-form-label">Service address</label>
                <input
                  type="text"
                  className="adm-input"
                  placeholder="Street, apt, city"
                  value={newCitaDireccion}
                  onChange={(e) => setNewCitaDireccion(e.target.value)}
                />
              </div>

              <div className="adm-form-group">
                <label className="adm-form-label">Notes / Special requests</label>
                <textarea
                  className="adm-input adm-textarea"
                  rows={2}
                  placeholder="Details agreed upon via phone or WhatsApp..."
                  value={newCitaNotas}
                  onChange={(e) => setNewCitaNotas(e.target.value)}
                />
              </div>

              <div className="adm-modal-footer">
                <button
                  type="submit"
                  className="adm-modal-btn adm-modal-btn--accept"
                  disabled={creatingCita}
                >
                  {creatingCita ? 'Saving…' : ' Save Appointment in Schedule'}
                </button>
                <button
                  type="button"
                  className="adm-modal-btn adm-modal-btn--cancel"
                  onClick={() => setShowNewCitaModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const { isAuthenticated, user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('solicitudes');
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    if (!token) return;
    const fetchPendingCount = async () => {
      try {
        const res = await apiFetch('/cotizaciones?estado=PENDIENTE', token);
        const data = await res.json();
        if (data.ok && Array.isArray(data.data)) {
          setPendingCount(data.data.length);
        }
      } catch {

      }
    };
    fetchPendingCount();
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated || !token) return null;

  return (
    <div className="adm-layout">

      <aside className="adm-sidebar">
        <div className="adm-sidebar-brand">
          <div className="adm-sidebar-logo">M</div>
          <span className="adm-sidebar-name">Marcela's Admin</span>
        </div>

        <nav className="adm-sidebar-nav">
          <button
            className={`adm-nav-item ${activeTab === 'solicitudes' ? 'adm-nav-item--active' : ''}`}
            onClick={() => setActiveTab('solicitudes')}
          >
            <span>Requests</span>
            {pendingCount > 0 && (
              <span className="adm-sidebar-badge" title={`${pendingCount} pending requests`}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            className={`adm-nav-item ${activeTab === 'agenda' ? 'adm-nav-item--active' : ''}`}
            onClick={() => setActiveTab('agenda')}
          >
            <span>Schedule</span>
          </button>
          <button
            className={`adm-nav-item ${activeTab === 'ventas' ? 'adm-nav-item--active' : ''}`}
            onClick={() => setActiveTab('ventas')}
          >
            <span>Sales</span>
          </button>
          <button
            className={`adm-nav-item ${activeTab === 'clientes' ? 'adm-nav-item--active' : ''}`}
            onClick={() => setActiveTab('clientes')}
          >
            <span>Clients</span>
          </button>
        </nav>

        <div className="adm-sidebar-footer">
          <div className="adm-sidebar-user">
            <div className="adm-sidebar-avatar">{user?.email?.[0]?.toUpperCase() ?? 'M'}</div>
            <span className="adm-sidebar-email">{user?.email}</span>
          </div>
          <button className="adm-logout-btn" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="adm-main">
        <header className="adm-header">
          <h1 className="adm-header-title">{TAB_HEADERS[activeTab].title}</h1>
          <p className="adm-header-sub">{TAB_HEADERS[activeTab].sub}</p>
        </header>

        {activeTab === 'ventas' ? (
          <VentasPanel token={token} />
        ) : activeTab === 'clientes' ? (
          <ClientesPanel token={token} />
        ) : activeTab === 'solicitudes' ? (
          <SolicitudesPanel
            token={token}
            onCitaCreated={() => {
              setPendingCount((prev) => Math.max(0, prev - 1));
            }}
            onPendingCountChange={(cnt) => setPendingCount(cnt)}
          />
        ) : (
          <AgendaPanel token={token} />
        )}
      </main>
    </div>
  );
};
export default AdminDashboard;
