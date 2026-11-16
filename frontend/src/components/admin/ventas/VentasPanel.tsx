import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Plus, Search } from 'lucide-react';
import {
  apiFetch,
  apiJson,
  clienteNombre,
  currentMonthKey,
  estadoPagoLabel,
  formatDateUTC,
  formatMoney,
  monthLabel,
  paymentMethodLabel,
  serviceLabel,
  shiftMonth,
  type EstadoPago,
} from '../../../utils/adminApi';
import { ClienteHistorialModal } from '../clientes/ClienteHistorialModal';
import { RevenueChart } from './RevenueChart';
import type { PuntoIngreso, ResumenVentas, Venta } from './types';
import {
  EditModal,
  EstadoPagoBadge,
  NewSaleModal,
  PaymentModal,
  VentaDetailModal,
  VoidModal,
} from './VentaModals';
import '../../../styles/ventas.css';

type ModalState =
  | { type: 'view' | 'pay' | 'edit' | 'void'; venta: Venta }
  | { type: 'new' }
  | null;

const ESTADO_FILTERS: ('' | EstadoPago)[] = ['', 'PENDIENTE', 'PAGADO', 'ANULADO'];

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export const VentasPanel: React.FC<{ token: string }> = ({ token }) => {
  const [mes, setMes] = useState(currentMonthKey());
  const [todosLosMeses, setTodosLosMeses] = useState(false);
  const [estado, setEstado] = useState<'' | EstadoPago>('');
  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim());

  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [resumen, setResumen] = useState<ResumenVentas | null>(null);
  const [serie, setSerie] = useState<PuntoIngreso[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  const [clienteAbierto, setClienteAbierto] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const showToast = (msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (!todosLosMeses) params.set('mes', mes);
    if (estado) params.set('estado', estado);
    if (q) params.set('q', q);
    return params.toString();
  }, [mes, todosLosMeses, estado, q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setListError(null);
    apiJson<Venta[]>(`/ventas?${buildQuery()}`, token)
      .then((list) => !cancelled && setVentas(list))
      .catch((err) => {
        if (!cancelled) {
          setVentas([]);
          setListError((err as Error).message);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [token, buildQuery, refreshKey]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiJson<ResumenVentas>(`/ventas/resumen?mes=${mes}`, token),
      apiJson<PuntoIngreso[]>(`/ventas/ingresos-mensuales?meses=12&hasta=${mes}`, token),
    ])
      .then(([r, s]) => {
        if (!cancelled) {
          setResumen(r);
          setSerie(s);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResumen(null);
          setSerie([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, mes, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const handleSaved = (venta: Venta, msg: string) => {
    showToast(msg, 'ok');
    setModal(modal && modal.type !== 'new' && modal.type !== 'view' ? { type: 'view', venta } : null);
    refresh();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await apiFetch(`/ventas/export?${buildQuery()}`, token);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Export failed');
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const filename = /filename="([^"]+)"/.exec(disposition)?.[1] || 'ventas.xlsx';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast((err as Error).message, 'err');
    } finally {
      setExporting(false);
    }
  };

  const goToMonth = (m: string) => {
    setMes(m);
    setTodosLosMeses(false);
  };

  const isCurrentMonth = mes === currentMonthKey();
  const periodo = todosLosMeses ? 'all months' : monthLabel(mes);

  const renderAcciones = (v: Venta, full = false) => (
    <>
      <button
        className={`adm-action-btn adm-action-btn--view ${full ? 'full-btn' : ''}`}
        onClick={() => setModal({ type: 'view', venta: v })}
      >
        View
      </button>
      {v.estadoPago === 'PENDIENTE' && (
        <button
          className={`adm-action-btn adm-action-btn--accept ${full ? 'full-btn' : ''}`}
          onClick={() => setModal({ type: 'pay', venta: v })}
        >
          Record payment
        </button>
      )}
      {v.estadoPago !== 'ANULADO' && (
        <button
          className={`adm-action-btn vta-action-btn--edit ${full ? 'full-btn' : ''}`}
          onClick={() => setModal({ type: 'edit', venta: v })}
        >
          Edit
        </button>
      )}
    </>
  );

  return (
    <div className="adm-panel">
      {toast && <div className={`adm-toast adm-toast--${toast.type}`}>{toast.msg}</div>}

      <div className="vta-topbar">
        <div className="adm-cal-nav-left">
          <button className="adm-cal-nav-btn" onClick={() => goToMonth(shiftMonth(mes, -1))} title="Previous month">
            <ChevronLeft size={16} />
          </button>
          <span className="adm-cal-month vta-month-label">{monthLabel(mes)}</span>
          <button className="adm-cal-nav-btn" onClick={() => goToMonth(shiftMonth(mes, 1))} title="Next month">
            <ChevronRight size={16} />
          </button>
          {!isCurrentMonth && (
            <button className="adm-filter-btn adm-filter-btn--today" onClick={() => goToMonth(currentMonthKey())}>
              This month
            </button>
          )}
        </div>
        <button className="adm-btn-new-cita" onClick={() => setModal({ type: 'new' })}>
          <Plus size={15} />
          <span>New manual sale</span>
        </button>
      </div>

      <div className="vta-kpis">
        <div className="vta-kpi">
          <span className="vta-kpi-label">Revenue · {monthLabel(mes, 'short')}</span>
          <strong className="vta-kpi-value">{resumen ? formatMoney(resumen.ingresosMes) : '—'}</strong>
          <span className="vta-kpi-meta">
            {resumen ? `${resumen.ventasPagadas} paid sale${resumen.ventasPagadas === 1 ? '' : 's'}` : ' '}
          </span>
        </div>
        <div className="vta-kpi">
          <span className="vta-kpi-label">Outstanding</span>
          <strong className={`vta-kpi-value ${resumen && resumen.porCobrar > 0 ? 'vta-kpi-value--warn' : ''}`}>
            {resumen ? formatMoney(resumen.porCobrar) : '—'}
          </strong>
          <span className="vta-kpi-meta">
            {resumen ? `${resumen.ventasPendientes} pending · all months` : ' '}
          </span>
        </div>
        <div className="vta-kpi">
          <span className="vta-kpi-label">Services done · {monthLabel(mes, 'short')}</span>
          <strong className="vta-kpi-value">{resumen ? resumen.serviciosRealizados : '—'}</strong>
          <span className="vta-kpi-meta">Voided sales excluded</span>
        </div>
        <div className="vta-kpi">
          <span className="vta-kpi-label">Average ticket · {monthLabel(mes, 'short')}</span>
          <strong className="vta-kpi-value">{resumen ? formatMoney(resumen.ticketPromedio) : '—'}</strong>
          <span className="vta-kpi-meta">Revenue ÷ paid sales</span>
        </div>
      </div>

      {serie.length > 0 && <RevenueChart serie={serie} selected={mes} onSelect={goToMonth} />}

      <div className="adm-filters-toolbar">
        <div className="adm-filters-group">
          <span className="adm-filters-label">Payment:</span>
          {ESTADO_FILTERS.map((e) => (
            <button
              key={e || 'all'}
              className={`adm-filter-btn ${estado === e ? 'adm-filter-btn--active' : ''}`}
              onClick={() => setEstado(e)}
            >
              {e === '' ? 'All' : estadoPagoLabel(e)}
            </button>
          ))}
          <span className="vta-filter-sep" />
          <button
            className={`adm-filter-btn ${!todosLosMeses ? 'adm-filter-btn--active' : ''}`}
            onClick={() => setTodosLosMeses(false)}
          >
            {monthLabel(mes, 'short')} only
          </button>
          <button
            className={`adm-filter-btn ${todosLosMeses ? 'adm-filter-btn--active' : ''}`}
            onClick={() => setTodosLosMeses(true)}
          >
            All months
          </button>
        </div>

        <div className="adm-search-sort-group">
          <div className="adm-search-box">
            <Search size={15} className="adm-search-icon" />
            <input
              type="text"
              placeholder="Search by client, phone or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="adm-search-input"
            />
            {search && (
              <button className="adm-search-clear" onClick={() => setSearch('')} title="Clear search">
                ×
              </button>
            )}
          </div>
          <button className="vta-export-btn" onClick={handleExport} disabled={exporting}>
            <Download size={14} />
            <span>{exporting ? 'Exporting…' : 'Export to Excel'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="adm-loading">Loading sales…</div>
      ) : listError ? (
        <div className="adm-empty">Couldn't load sales: {listError}</div>
      ) : ventas.length === 0 ? (
        <div className="adm-empty">
          No sales for {periodo}
          {estado ? ` with status "${estadoPagoLabel(estado)}"` : ''}
          {q ? ` matching "${q}"` : ''}.
        </div>
      ) : (
        <>
          <div className="vta-list-meta">
            {ventas.length} sale{ventas.length === 1 ? '' : 's'} · {periodo}
          </div>

          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Client</th>
                  <th>Service</th>
                  <th style={{ textAlign: 'right' }}>Quoted</th>
                  <th style={{ textAlign: 'right' }}>Final</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Source</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => {
                  const diff = v.montoFinal != null ? v.montoFinal - v.montoCotizado : 0;
                  return (
                    <tr key={v.id} className={v.estadoPago === 'ANULADO' ? 'vta-row--voided' : ''}>
                      <td>
                        <div className="adm-code">{v.codigo}</div>
                        <span className={`vta-origin vta-origin--${v.origen.toLowerCase()}`}>
                          {v.origen === 'CITA' ? 'Auto' : 'Manual'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="vta-link-btn adm-client-name"
                          onClick={() => setClienteAbierto(v.cliente.id)}
                          title="Open client history"
                        >
                          {clienteNombre(v.cliente)}
                        </button>
                        {v.cliente.telefono && <div className="adm-client-email">{v.cliente.telefono}</div>}
                      </td>
                      <td>
                        <strong className="adm-service-title">{serviceLabel(v.tipoLimpieza)}</strong>
                        <div className="vta-cell-meta">{formatDateUTC(v.fechaServicio)}</div>
                      </td>
                      <td className="vta-amount vta-amount--muted">{formatMoney(v.montoCotizado)}</td>
                      <td className="vta-amount">
                        {v.montoFinal != null ? formatMoney(v.montoFinal) : <span className="vta-muted">—</span>}
                        {diff !== 0 && (
                          <div className={`vta-diff ${diff > 0 ? 'vta-diff--up' : 'vta-diff--down'}`}>
                            {diff > 0 ? '+' : '−'}
                            {formatMoney(Math.abs(diff))}
                          </div>
                        )}
                      </td>
                      <td>
                        <EstadoPagoBadge estado={v.estadoPago} />
                      </td>
                      <td>
                        {v.estadoPago === 'PAGADO' ? (
                          <>
                            <div>{paymentMethodLabel(v.metodoPago)}</div>
                            <div className="vta-cell-meta">{formatDateUTC(v.fechaPago)}</div>
                          </>
                        ) : (
                          <span className="vta-muted">—</span>
                        )}
                      </td>
                      <td className="vta-cell-meta">
                        {v.cita && <div className="adm-code vta-code-sm">{v.cita.codigo}</div>}
                        {v.cotizacion && <div className="adm-code vta-code-sm">{v.cotizacion.codigo}</div>}
                        {!v.cita && !v.cotizacion && '—'}
                      </td>
                      <td className="adm-actions-td">
                        <div className="adm-actions-wrap vta-actions">{renderAcciones(v)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="adm-mobile-cards">
            {ventas.map((v) => (
              <div key={v.id} className={`adm-card-mobile ${v.estadoPago === 'ANULADO' ? 'vta-row--voided' : ''}`}>
                <div className="adm-card-mobile-header">
                  <span className="adm-code">{v.codigo}</span>
                  <EstadoPagoBadge estado={v.estadoPago} />
                </div>
                <div className="adm-card-mobile-body">
                  <button
                    type="button"
                    className="vta-link-btn adm-card-client-name"
                    onClick={() => setClienteAbierto(v.cliente.id)}
                  >
                    {clienteNombre(v.cliente)}
                  </button>
                  <div className="vta-card-line">
                    {serviceLabel(v.tipoLimpieza)} · {formatDateUTC(v.fechaServicio)}
                  </div>
                  <div className="vta-card-amounts">
                    <span>
                      Quoted <strong>{formatMoney(v.montoCotizado)}</strong>
                    </span>
                    <span>
                      Final <strong>{formatMoney(v.montoFinal)}</strong>
                    </span>
                  </div>
                  {v.estadoPago === 'PAGADO' && (
                    <div className="vta-card-line vta-muted">
                      {paymentMethodLabel(v.metodoPago)} · {formatDateUTC(v.fechaPago)}
                    </div>
                  )}
                </div>
                <div className="adm-card-mobile-actions">{renderAcciones(v, true)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {modal?.type === 'view' && (
        <VentaDetailModal
          venta={modal.venta}
          onClose={() => setModal(null)}
          onAction={(type) => setModal({ type, venta: modal.venta })}
          onOpenCliente={(id) => {
            setModal(null);
            setClienteAbierto(id);
          }}
        />
      )}
      {modal?.type === 'pay' && (
        <PaymentModal venta={modal.venta} token={token} onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {modal?.type === 'edit' && (
        <EditModal venta={modal.venta} token={token} onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {modal?.type === 'void' && (
        <VoidModal venta={modal.venta} token={token} onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {modal?.type === 'new' && (
        <NewSaleModal token={token} onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {clienteAbierto && (
        <ClienteHistorialModal clienteId={clienteAbierto} token={token} onClose={() => setClienteAbierto(null)} />
      )}
    </div>
  );
};
