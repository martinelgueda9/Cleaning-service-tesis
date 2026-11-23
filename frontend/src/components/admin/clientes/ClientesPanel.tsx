import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, Phone, Search } from 'lucide-react';
import { apiJson, clienteNombre, formatDateUTC, formatMoney } from '../../../utils/adminApi';
import { ClienteHistorialModal } from './ClienteHistorialModal';
import { useMinDuration } from '../../../utils/useMinDuration';
import { TableSkeleton } from '../../common';
import '../../../styles/ventas.css';

interface ClienteCrm {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string | null;
  telefono: string;
  direccion: string;
  totalGastado: number;
  porCobrar: number;
  numServicios: number;
  ultimoServicio: string | null;
  numCitas: number;
  numCotizaciones: number;
}

type SortKey = 'gastado' | 'ultimo' | 'servicios' | 'nombre';

export const ClientesPanel: React.FC<{ token: string }> = ({ token }) => {
  const [clientes, setClientes] = useState<ClienteCrm[]>([]);
  const [loadingRaw, setLoading] = useState(true);
  const loading = useMinDuration(loadingRaw);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('gastado');
  const [abierto, setAbierto] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiJson<ClienteCrm[]>('/clientes/crm', token)
      .then(setClientes)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [token]);

  const lista = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? clientes.filter(
          (c) =>
            clienteNombre(c).toLowerCase().includes(q) ||
            c.telefono.includes(q) ||
            (c.email ?? '').toLowerCase().includes(q)
        )
      : [...clientes];

    return filtered.sort((a, b) => {
      if (sortBy === 'gastado') return b.totalGastado - a.totalGastado;
      if (sortBy === 'servicios') return b.numServicios - a.numServicios;
      if (sortBy === 'ultimo') return (b.ultimoServicio ?? '').localeCompare(a.ultimoServicio ?? '');
      return clienteNombre(a).localeCompare(clienteNombre(b));
    });
  }, [clientes, search, sortBy]);

  return (
    <div className="adm-panel">
      <div className="adm-filters-toolbar">
        <div className="vta-list-meta" style={{ margin: 0 }}>
          {clientes.length} client{clientes.length === 1 ? '' : 's'}
        </div>
        <div className="adm-search-sort-group">
          <div className="adm-search-box">
            <Search size={15} className="adm-search-icon" />
            <input
              type="text"
              placeholder="Search by name, phone or email…"
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
          <div className="adm-sort-box">
            <ArrowUpDown size={14} className="adm-sort-icon" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className="adm-sort-select">
              <option value="gastado">Total spent (highest)</option>
              <option value="ultimo">Last service (most recent)</option>
              <option value="servicios">Most services</option>
              <option value="nombre">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <TableSkeleton
          headers={['Client', 'Contact', 'Total spent', 'Outstanding', 'Services', 'Last service', 'Activity', 'Actions']}
          label="Loading clients…"
        />
      ) : error ? (
        <div className="adm-empty">Couldn't load clients: {error}</div>
      ) : lista.length === 0 ? (
        <div className="adm-empty">No clients found{search ? ` matching "${search}"` : ''}.</div>
      ) : (
        <>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact</th>
                  <th style={{ textAlign: 'right' }}>Total spent</th>
                  <th style={{ textAlign: 'right' }}>Outstanding</th>
                  <th style={{ textAlign: 'center' }}>Services</th>
                  <th>Last service</th>
                  <th style={{ textAlign: 'center' }}>Activity</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <button type="button" className="vta-link-btn adm-client-name" onClick={() => setAbierto(c.id)}>
                        {clienteNombre(c)}
                      </button>
                      <div className="adm-address-text" title={c.direccion}>
                        {c.direccion}
                      </div>
                    </td>
                    <td>
                      <a href={`tel:${c.telefono}`} className="adm-client-phone-link">
                        <Phone size={12} />
                        <span>{c.telefono}</span>
                      </a>
                      <div className="adm-client-email">{c.email || 'No email'}</div>
                    </td>
                    <td className="vta-amount">{formatMoney(c.totalGastado)}</td>
                    <td className={`vta-amount ${c.porCobrar > 0 ? 'vta-amount--warn' : 'vta-amount--muted'}`}>
                      {c.porCobrar > 0 ? formatMoney(c.porCobrar) : '—'}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{c.numServicios}</td>
                    <td className="adm-date-cell">{c.ultimoServicio ? formatDateUTC(c.ultimoServicio) : '—'}</td>
                    <td className="vta-cell-meta" style={{ textAlign: 'center' }}>
                      {c.numCitas} appt · {c.numCotizaciones} quote{c.numCotizaciones === 1 ? '' : 's'}
                    </td>
                    <td className="adm-actions-td">
                      <div className="adm-actions-wrap">
                        <button className="adm-action-btn adm-action-btn--view" onClick={() => setAbierto(c.id)}>
                          History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="adm-mobile-cards">
            {lista.map((c) => (
              <div key={c.id} className="adm-card-mobile">
                <div className="adm-card-mobile-body">
                  <h4 className="adm-card-client-name">{clienteNombre(c)}</h4>
                  <div className="vta-card-line">{c.telefono}</div>
                  <div className="vta-card-amounts">
                    <span>
                      Spent <strong>{formatMoney(c.totalGastado)}</strong>
                    </span>
                    <span>
                      Services <strong>{c.numServicios}</strong>
                    </span>
                  </div>
                  <div className="vta-card-line vta-muted">
                    Last service: {c.ultimoServicio ? formatDateUTC(c.ultimoServicio) : '—'}
                  </div>
                </div>
                <div className="adm-card-mobile-actions">
                  <button className="adm-action-btn adm-action-btn--view full-btn" onClick={() => setAbierto(c.id)}>
                    View history
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {abierto && <ClienteHistorialModal clienteId={abierto} token={token} onClose={() => setAbierto(null)} />}
    </div>
  );
};
