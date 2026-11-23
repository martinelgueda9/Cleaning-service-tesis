const API_BASE = '/api';

export async function apiFetch(url: string, token: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };
  try {
    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
    return res;
  } catch {
    return fetch(`http://localhost:3000${API_BASE}${url}`, { ...options, headers });
  }
}

export async function apiJson<T>(url: string, token: string, options: RequestInit = {}): Promise<T> {
  const res = await apiFetch(url, token, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) {
    const details = Array.isArray(body.details) ? `: ${body.details.join(', ')}` : '';
    throw new Error((body.error || 'Request failed') + details);
  }
  return body.data as T;
}

export function propertyTypeLabel(tipo?: string | null): string | null {
  if (tipo === 'DEPARTAMENTO') return 'Apartment';
  if (tipo === 'CASA') return 'House';
  return null;
}

export function serviceLabel(tipo: string): string {
  const map: Record<string, string> = {
    ESTANDAR: 'Standard Cleaning',
    standard: 'Standard Cleaning',
    regular_cleaning: 'Standard Cleaning',
    PROFUNDA: 'Deep Cleaning',
    deep: 'Deep Cleaning',
    deep_cleaning: 'Deep Cleaning',
    MUDANZA_ENTRADA: 'Move-In Cleaning',
    movein: 'Move-In Cleaning',
    move_in_cleaning: 'Move-In Cleaning',
    MUDANZA_SALIDA: 'Move-Out Cleaning',
    moveout: 'Move-Out Cleaning',
    move_out_cleaning: 'Move-Out Cleaning',
    POST_CONSTRUCCION: 'Post-Construction',
    post_construccion: 'Post-Construction',
    OFICINA: 'Commercial / Office',
    commercial_cleaning: 'Commercial / Office',
  };
  return map[tipo] || tipo;
}

export const SERVICE_OPTIONS = [
  { value: 'ESTANDAR', label: 'Standard Cleaning' },
  { value: 'PROFUNDA', label: 'Deep Cleaning' },
  { value: 'MUDANZA_ENTRADA', label: 'Move-In Cleaning' },
  { value: 'MUDANZA_SALIDA', label: 'Move-Out Cleaning' },
  { value: 'POST_CONSTRUCCION', label: 'Post-Construction' },
  { value: 'OFICINA', label: 'Commercial / Office' },
];

export type EstadoPago = 'PENDIENTE' | 'PAGADO' | 'ANULADO';
export type MetodoPago =
  | 'EFECTIVO'
  | 'ZELLE'
  | 'TARJETA'
  | 'TRANSFERENCIA'
  | 'VENMO'
  | 'CASHAPP'
  | 'CHEQUE'
  | 'OTRO';

export const PAYMENT_METHODS: { value: MetodoPago; label: string }[] = [
  { value: 'EFECTIVO', label: 'Cash' },
  { value: 'ZELLE', label: 'Zelle' },
  { value: 'TARJETA', label: 'Card' },
  { value: 'TRANSFERENCIA', label: 'Bank transfer' },
  { value: 'VENMO', label: 'Venmo' },
  { value: 'CASHAPP', label: 'Cash App' },
  { value: 'CHEQUE', label: 'Check' },
  { value: 'OTRO', label: 'Other' },
];

export function paymentMethodLabel(m?: MetodoPago | null) {
  return PAYMENT_METHODS.find((p) => p.value === m)?.label ?? '—';
}

export function estadoPagoLabel(e: EstadoPago) {
  return { PENDIENTE: 'Pending', PAGADO: 'Paid', ANULADO: 'Voided' }[e] ?? e;
}

export function formatMoney(n: number | null | undefined) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export function formatMoneyShort(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: n >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: n >= 10000 ? 1 : 0,
  }).format(n);
}

export function formatDateUTC(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function formatDateLocal(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function isoToInputDate(iso?: string | null) {
  return iso ? iso.slice(0, 10) : '';
}

export function todayInput() {
  return new Date().toLocaleDateString('en-CA');
}

export function currentMonthKey() {
  return todayInput().slice(0, 7);
}

export function shiftMonth(mes: string, delta: number) {
  const [y, m] = mes.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export function monthLabel(mes: string, style: 'long' | 'short' = 'long') {
  const [y, m] = mes.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', {
    month: style,
    year: style === 'long' ? 'numeric' : undefined,
    timeZone: 'UTC',
  });
}

export function clienteNombre(c?: { nombre: string; apellido?: string | null } | null) {
  if (!c) return 'Client';
  return [c.nombre, c.apellido].filter(Boolean).join(' ');
}
