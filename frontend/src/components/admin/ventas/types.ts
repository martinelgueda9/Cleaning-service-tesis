import type { EstadoPago, MetodoPago } from '../../../utils/adminApi';

export interface ClienteRef {
  id: string;
  nombre: string;
  apellido?: string | null;
  telefono?: string | null;
  email?: string | null;
}

export interface Venta {
  id: string;
  codigo: string;
  origen: 'CITA' | 'MANUAL';
  tipoLimpieza: string;
  fechaServicio: string;
  montoCotizado: number;
  montoFinal: number | null;
  estadoPago: EstadoPago;
  metodoPago: MetodoPago | null;
  fechaPago: string | null;
  motivoAnulacion: string | null;
  notas: string | null;
  createdAt: string;
  cliente: ClienteRef;
  cita: {
    id: string;
    codigo: string;
    fechaServicio: string;
    horaInicio: string;
    horaFin: string;
    estadoCita: string;
  } | null;
  cotizacion: {
    id: string;
    codigo: string;
    totalEstimado: number | null;
    estado: string;
  } | null;
}

export interface ResumenVentas {
  mes: string;
  ingresosMes: number;
  ventasPagadas: number;
  porCobrar: number;
  ventasPendientes: number;
  serviciosRealizados: number;
  ticketPromedio: number;
}

export interface PuntoIngreso {
  mes: string;
  total: number;
  cantidad: number;
}
