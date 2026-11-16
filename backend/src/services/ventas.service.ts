import ExcelJS from 'exceljs';
import { EstadoPago, MetodoPago, Prisma, TipoLimpieza } from '@prisma/client';
import prisma from '../config/db.js';

export class VentaError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export interface VentaFilters {
  estado?: EstadoPago;
  mes?: string;
  clienteId?: string;
  q?: string;
}

const ventaInclude = {
  cliente: { select: { id: true, nombre: true, apellido: true, telefono: true, email: true } },
  cita: { select: { id: true, codigo: true, fechaServicio: true, horaInicio: true, horaFin: true, estadoCita: true } },
  cotizacion: { select: { id: true, codigo: true, totalEstimado: true, estado: true } },
} satisfies Prisma.VentaInclude;

function randomCodigo(): string {
  return `VEN-${Math.random().toString(36).substring(2, 8).toUpperCase().padEnd(6, '0')}`;
}

async function generateCodigo(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const codigo = randomCodigo();
    const exists = await prisma.venta.findUnique({ where: { codigo }, select: { id: true } });
    if (!exists) return codigo;
  }
  throw new Error('No se pudo generar un código de venta único');
}

export function monthRange(mes: string): { gte: Date; lt: Date } {
  const match = /^(\d{4})-(\d{2})$/.exec(mes);
  if (!match) throw new VentaError('Mes inválido (usar formato YYYY-MM)');
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) throw new VentaError('Mes inválido (usar formato YYYY-MM)');
  return { gte: new Date(Date.UTC(year, month - 1, 1)), lt: new Date(Date.UTC(year, month, 1)) };
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function todayUTC(): Date {
  return new Date(new Date().toISOString().slice(0, 10));
}

function montoEsperado(v: { montoFinal: number | null; montoCotizado: number }) {
  return v.montoFinal ?? v.montoCotizado;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export async function crearDesdeCita(citaId: string) {
  const cita = await prisma.cita.findUnique({
    where: { id: citaId },
    include: { cotizacion: true, venta: { include: ventaInclude } },
  });
  if (!cita) throw new VentaError('Cita no encontrada', 404);
  if (cita.venta) return cita.venta;

  try {
    return await prisma.venta.create({
      data: {
        codigo: await generateCodigo(),
        origen: 'CITA',
        clienteId: cita.clienteId,
        citaId: cita.id,
        cotizacionId: cita.cotizacionId,
        tipoLimpieza: cita.cotizacion?.tipoLimpieza ?? 'ESTANDAR',
        fechaServicio: cita.fechaServicio,
        montoCotizado: cita.cotizacion?.totalEstimado ?? 0,
      },
      include: ventaInclude,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const existing = await prisma.venta.findUnique({ where: { citaId }, include: ventaInclude });
      if (existing) return existing;
    }
    throw err;
  }
}

export async function sincronizarCitasCompletadas() {
  const pendientes = await prisma.cita.findMany({
    where: { estadoCita: 'COMPLETADA', venta: { is: null } },
    select: { id: true },
  });
  for (const cita of pendientes) {
    await crearDesdeCita(cita.id);
  }
  return pendientes.length;
}

async function resolverCliente(data: {
  clienteId?: string;
  nombreCliente?: string;
  telefonoCliente?: string;
  emailCliente?: string;
  direccionCliente?: string;
}): Promise<string> {
  if (data.clienteId) {
    const cliente = await prisma.cliente.findUnique({ where: { id: data.clienteId }, select: { id: true } });
    if (!cliente) throw new VentaError('Cliente no encontrado', 404);
    return cliente.id;
  }

  if (!data.nombreCliente || !data.telefonoCliente) {
    throw new VentaError('Se requiere un clienteId o bien el nombre y teléfono del cliente');
  }

  const existing = await prisma.cliente.findFirst({
    where: {
      OR: [
        { telefono: data.telefonoCliente },
        ...(data.emailCliente ? [{ email: data.emailCliente }] : []),
      ],
    },
    select: { id: true },
  });
  if (existing) return existing.id;

  const nuevo = await prisma.cliente.create({
    data: {
      nombre: data.nombreCliente,
      telefono: data.telefonoCliente,
      email: data.emailCliente || undefined,
      direccion: data.direccionCliente?.trim() || 'St. Cloud, MN',
    },
  });
  return nuevo.id;
}

export async function create(data: {
  clienteId?: string;
  nombreCliente?: string;
  telefonoCliente?: string;
  emailCliente?: string;
  direccionCliente?: string;
  tipoLimpieza: TipoLimpieza;
  fechaServicio: string;
  montoCotizado: number;
  montoFinal?: number;
  notas?: string;
  pagado?: boolean;
  metodoPago?: MetodoPago;
  fechaPago?: string;
}) {
  const clienteId = await resolverCliente(data);

  return prisma.venta.create({
    data: {
      codigo: await generateCodigo(),
      origen: 'MANUAL',
      clienteId,
      tipoLimpieza: data.tipoLimpieza,
      fechaServicio: new Date(data.fechaServicio),
      montoCotizado: data.montoCotizado,
      montoFinal: data.pagado ? data.montoFinal ?? data.montoCotizado : data.montoFinal,
      notas: data.notas?.trim() || undefined,
      ...(data.pagado
        ? {
            estadoPago: 'PAGADO' as const,
            metodoPago: data.metodoPago,
            fechaPago: data.fechaPago ? new Date(data.fechaPago) : todayUTC(),
          }
        : {}),
    },
    include: ventaInclude,
  });
}

function buildWhere(filters: VentaFilters = {}): Prisma.VentaWhereInput {
  const where: Prisma.VentaWhereInput = {};
  if (filters.estado) where.estadoPago = filters.estado;
  if (filters.mes) where.fechaServicio = monthRange(filters.mes);
  if (filters.clienteId) where.clienteId = filters.clienteId;

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { codigo: { contains: q, mode: 'insensitive' } },
      { cliente: { nombre: { contains: q, mode: 'insensitive' } } },
      { cliente: { apellido: { contains: q, mode: 'insensitive' } } },
      { cliente: { telefono: { contains: q } } },
      { cliente: { email: { contains: q, mode: 'insensitive' } } },
      { cita: { codigo: { contains: q, mode: 'insensitive' } } },
      { cotizacion: { codigo: { contains: q, mode: 'insensitive' } } },
    ];
  }
  return where;
}

export async function findAll(filters: VentaFilters = {}) {
  await sincronizarCitasCompletadas();
  return prisma.venta.findMany({
    where: buildWhere(filters),
    orderBy: [{ fechaServicio: 'desc' }, { createdAt: 'desc' }],
    include: ventaInclude,
  });
}

export async function findById(id: string) {
  return prisma.venta.findUnique({ where: { id }, include: ventaInclude });
}

async function getOrThrow(id: string) {
  const venta = await prisma.venta.findUnique({ where: { id } });
  if (!venta) throw new VentaError('Venta no encontrada', 404);
  return venta;
}

export async function update(id: string, data: {
  tipoLimpieza?: TipoLimpieza;
  fechaServicio?: string;
  montoCotizado?: number;
  montoFinal?: number | null;
  metodoPago?: MetodoPago | null;
  fechaPago?: string | null;
  notas?: string | null;
}) {
  const venta = await getOrThrow(id);
  if (venta.estadoPago === 'ANULADO') {
    throw new VentaError('No se puede editar una venta anulada');
  }
  if (venta.estadoPago === 'PAGADO') {
    if (data.montoFinal === null) throw new VentaError('Una venta pagada debe tener monto final');
    if (data.metodoPago === null) throw new VentaError('Una venta pagada debe tener método de pago');
    if (data.fechaPago === null) throw new VentaError('Una venta pagada debe tener fecha de pago');
  }

  return prisma.venta.update({
    where: { id },
    data: {
      tipoLimpieza: data.tipoLimpieza,
      fechaServicio: data.fechaServicio ? new Date(data.fechaServicio) : undefined,
      montoCotizado: data.montoCotizado,
      montoFinal: data.montoFinal,
      metodoPago: data.metodoPago,
      fechaPago: data.fechaPago === undefined ? undefined : data.fechaPago ? new Date(data.fechaPago) : null,
      notas: data.notas === undefined ? undefined : data.notas?.trim() || null,
    },
    include: ventaInclude,
  });
}

export async function registrarPago(id: string, data: {
  montoFinal: number;
  metodoPago: MetodoPago;
  fechaPago: string;
  notas?: string;
}) {
  const venta = await getOrThrow(id);
  if (venta.estadoPago === 'ANULADO') {
    throw new VentaError('No se puede registrar el pago de una venta anulada');
  }

  return prisma.venta.update({
    where: { id },
    data: {
      estadoPago: 'PAGADO',
      montoFinal: data.montoFinal,
      metodoPago: data.metodoPago,
      fechaPago: new Date(data.fechaPago),
      ...(data.notas !== undefined ? { notas: data.notas.trim() || null } : {}),
    },
    include: ventaInclude,
  });
}

export async function anular(id: string, motivo?: string) {
  const venta = await getOrThrow(id);
  if (venta.estadoPago === 'ANULADO') throw new VentaError('La venta ya está anulada');

  return prisma.venta.update({
    where: { id },
    data: { estadoPago: 'ANULADO', motivoAnulacion: motivo?.trim() || null },
    include: ventaInclude,
  });
}

export async function resumen(mes = currentMonth()) {
  const rango = monthRange(mes);

  const [pagadas, pendientes, serviciosRealizados] = await Promise.all([
    prisma.venta.aggregate({
      where: { estadoPago: 'PAGADO', fechaPago: rango },
      _sum: { montoFinal: true },
      _count: { _all: true },
    }),
    prisma.venta.findMany({
      where: { estadoPago: 'PENDIENTE' },
      select: { montoFinal: true, montoCotizado: true },
    }),
    prisma.venta.count({
      where: { estadoPago: { not: 'ANULADO' }, fechaServicio: rango },
    }),
  ]);

  const ingresosMes = pagadas._sum.montoFinal ?? 0;
  const ventasPagadas = pagadas._count._all;

  return {
    mes,
    ingresosMes: round2(ingresosMes),
    ventasPagadas,
    porCobrar: round2(pendientes.reduce((acc, v) => acc + montoEsperado(v), 0)),
    ventasPendientes: pendientes.length,
    serviciosRealizados,
    ticketPromedio: ventasPagadas > 0 ? round2(ingresosMes / ventasPagadas) : 0,
  };
}

export async function ingresosMensuales(meses = 12, hasta = currentMonth()) {
  const cantidad = Math.min(Math.max(Math.trunc(meses) || 12, 1), 36);
  const fin = monthRange(hasta).lt;
  const inicio = new Date(Date.UTC(fin.getUTCFullYear(), fin.getUTCMonth() - cantidad, 1));

  const ventas = await prisma.venta.findMany({
    where: { estadoPago: 'PAGADO', fechaPago: { gte: inicio, lt: fin } },
    select: { montoFinal: true, fechaPago: true },
  });

  const serie = Array.from({ length: cantidad }, (_, i) => {
    const d = new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth() + i, 1));
    return { mes: d.toISOString().slice(0, 7), total: 0, cantidad: 0 };
  });
  const porMes = new Map(serie.map((s) => [s.mes, s]));

  for (const v of ventas) {
    const punto = v.fechaPago && porMes.get(v.fechaPago.toISOString().slice(0, 7));
    if (punto) {
      punto.total += v.montoFinal ?? 0;
      punto.cantidad += 1;
    }
  }
  return serie.map((s) => ({ ...s, total: round2(s.total) }));
}

type VentaResumible = { estadoPago: EstadoPago; montoFinal: number | null; montoCotizado: number; fechaServicio: Date };

function resumenCliente(ventas: VentaResumible[]) {
  const validas = ventas.filter((v) => v.estadoPago !== 'ANULADO');
  const totalGastado = validas
    .filter((v) => v.estadoPago === 'PAGADO')
    .reduce((acc, v) => acc + (v.montoFinal ?? 0), 0);
  const porCobrar = validas
    .filter((v) => v.estadoPago === 'PENDIENTE')
    .reduce((acc, v) => acc + montoEsperado(v), 0);
  const ultimo = validas.reduce<Date | null>(
    (max, v) => (!max || v.fechaServicio > max ? v.fechaServicio : max),
    null
  );
  return {
    totalGastado: round2(totalGastado),
    porCobrar: round2(porCobrar),
    numServicios: validas.length,
    ultimoServicio: ultimo,
  };
}

export async function clientesConResumen(q?: string) {
  await sincronizarCitasCompletadas();
  const query = q?.trim();

  const clientes = await prisma.cliente.findMany({
    where: query
      ? {
          OR: [
            { nombre: { contains: query, mode: 'insensitive' } },
            { apellido: { contains: query, mode: 'insensitive' } },
            { telefono: { contains: query } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: { nombre: 'asc' },
    include: {
      ventas: { select: { estadoPago: true, montoFinal: true, montoCotizado: true, fechaServicio: true } },
      _count: { select: { citas: true, cotizaciones: true } },
    },
  });

  return clientes.map(({ ventas, _count, ...cliente }) => ({
    ...cliente,
    ...resumenCliente(ventas),
    numCitas: _count.citas,
    numCotizaciones: _count.cotizaciones,
  }));
}

export async function historialCliente(id: string) {
  await sincronizarCitasCompletadas();

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      ventas: {
        orderBy: [{ fechaServicio: 'desc' }, { createdAt: 'desc' }],
        include: {
          cita: { select: { id: true, codigo: true } },
          cotizacion: { select: { id: true, codigo: true } },
        },
      },
      citas: {
        orderBy: { fechaServicio: 'desc' },
        include: { cotizacion: { select: { codigo: true, tipoLimpieza: true, totalEstimado: true } } },
      },
      cotizaciones: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!cliente) return null;

  const ultimaVenta = cliente.ventas.find((v) => v.estadoPago !== 'ANULADO') ?? null;

  return {
    ...cliente,
    resumen: {
      ...resumenCliente(cliente.ventas),
      ultimoServicioTipo: ultimaVenta?.tipoLimpieza ?? null,
    },
  };
}

const SERVICE_LABELS: Record<TipoLimpieza, string> = {
  ESTANDAR: 'Standard Cleaning',
  PROFUNDA: 'Deep Cleaning',
  MUDANZA_ENTRADA: 'Move-In Cleaning',
  MUDANZA_SALIDA: 'Move-Out Cleaning',
  POST_CONSTRUCCION: 'Post-Construction',
  OFICINA: 'Commercial / Office',
};

const ESTADO_LABELS: Record<EstadoPago, string> = {
  PENDIENTE: 'Pending',
  PAGADO: 'Paid',
  ANULADO: 'Voided',
};

const METODO_LABELS: Record<MetodoPago, string> = {
  EFECTIVO: 'Cash',
  ZELLE: 'Zelle',
  TARJETA: 'Card',
  TRANSFERENCIA: 'Bank transfer',
  VENMO: 'Venmo',
  CASHAPP: 'Cash App',
  CHEQUE: 'Check',
  OTRO: 'Other',
};

const ESTADO_FILLS: Record<EstadoPago, { bg: string; fg: string }> = {
  PENDIENTE: { bg: 'FFFEF3C7', fg: 'FF92400E' },
  PAGADO: { bg: 'FFD1FAE5', fg: 'FF065F46' },
  ANULADO: { bg: 'FFF3F4F6', fg: 'FF6B7280' },
};

const CURRENCY_FMT = '"$"#,##0.00';
const DATE_FMT = 'mm/dd/yyyy';
const NAVY = 'FF16234D';

function mesLabel(mes: string) {
  const { gte } = monthRange(mes);
  return gte.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function exportFileName(filters: VentaFilters) {
  const parts = ['ventas', filters.mes ?? 'todas'];
  if (filters.estado) parts.push(filters.estado.toLowerCase());
  return `${parts.join('_')}.xlsx`;
}

export async function exportarExcel(filters: VentaFilters = {}): Promise<Buffer> {
  const ventas = await findAll(filters);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Marcela's Cleaning Admin";
  wb.created = new Date();
  const ws = wb.addWorksheet('Sales', { views: [{ state: 'frozen', ySplit: 4 }] });

  const columns: { header: string; key: string; width: number; currency?: boolean; date?: boolean }[] = [
    { header: 'Code', key: 'codigo', width: 14 },
    { header: 'Client', key: 'cliente', width: 26 },
    { header: 'Phone', key: 'telefono', width: 16 },
    { header: 'Service', key: 'servicio', width: 22 },
    { header: 'Service date', key: 'fechaServicio', width: 14, date: true },
    { header: 'Quoted', key: 'montoCotizado', width: 13, currency: true },
    { header: 'Final charged', key: 'montoFinal', width: 15, currency: true },
    { header: 'Status', key: 'estado', width: 11 },
    { header: 'Payment method', key: 'metodo', width: 16 },
    { header: 'Payment date', key: 'fechaPago', width: 14, date: true },
    { header: 'Appointment', key: 'cita', width: 13 },
    { header: 'Quote', key: 'cotizacion', width: 13 },
    { header: 'Notes', key: 'notas', width: 42 },
  ];
  ws.columns = columns.map(({ key, width }) => ({ key, width }));
  const lastCol = columns.length;

  ws.mergeCells(1, 1, 1, lastCol);
  const title = ws.getCell(1, 1);
  title.value = `Sales report — ${filters.mes ? mesLabel(filters.mes) : 'All months'}`;
  title.font = { bold: true, size: 14, color: { argb: NAVY } };

  ws.mergeCells(2, 1, 2, lastCol);
  const sub = ws.getCell(2, 1);
  const filtros = [
    `Status: ${filters.estado ? ESTADO_LABELS[filters.estado] : 'All'}`,
    ...(filters.q?.trim() ? [`Search: "${filters.q.trim()}"`] : []),
    `Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
  ];
  sub.value = filtros.join('   ·   ');
  sub.font = { italic: true, size: 10, color: { argb: 'FF6B7280' } };

  const headerRowNum = 4;
  const header = ws.getRow(headerRowNum);
  columns.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    cell.alignment = { vertical: 'middle', horizontal: c.currency ? 'right' : 'left' };
    cell.border = { bottom: { style: 'thin', color: { argb: NAVY } } };
  });
  header.height = 22;

  const firstDataRow = headerRowNum + 1;
  ventas.forEach((v, i) => {
    const row = ws.getRow(firstDataRow + i);
    const nombre = [v.cliente.nombre, v.cliente.apellido].filter(Boolean).join(' ');
    row.values = {
      codigo: v.codigo,
      cliente: nombre,
      telefono: v.cliente.telefono,
      servicio: SERVICE_LABELS[v.tipoLimpieza],
      fechaServicio: v.fechaServicio,
      montoCotizado: v.montoCotizado,
      montoFinal: v.montoFinal ?? null,
      estado: ESTADO_LABELS[v.estadoPago],
      metodo: v.metodoPago ? METODO_LABELS[v.metodoPago] : '',
      fechaPago: v.fechaPago ?? null,
      cita: v.cita?.codigo ?? '',
      cotizacion: v.cotizacion?.codigo ?? '',
      notas: [v.notas, v.motivoAnulacion ? `Void reason: ${v.motivoAnulacion}` : null].filter(Boolean).join(' | '),
    };
    columns.forEach((c, ci) => {
      const cell = row.getCell(ci + 1);
      if (c.currency) cell.numFmt = CURRENCY_FMT;
      if (c.date) {
        cell.numFmt = DATE_FMT;
        cell.alignment = { horizontal: 'left' };
      }
      if (c.key === 'notas') cell.alignment = { wrapText: true, vertical: 'top' };
      cell.border = { bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } } };
    });
    const estadoCell = row.getCell('estado');
    const colors = ESTADO_FILLS[v.estadoPago];
    estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.bg } };
    estadoCell.font = { bold: true, color: { argb: colors.fg } };
    if (v.estadoPago === 'ANULADO') {
      ['montoCotizado', 'montoFinal'].forEach((k) => {
        row.getCell(k).font = { strike: true, color: { argb: 'FF9CA3AF' } };
      });
    }
  });

  const lastDataRow = firstDataRow + ventas.length - 1;
  const totalRow = ws.getRow(lastDataRow + 2);
  const validas = ventas.filter((v) => v.estadoPago !== 'ANULADO');
  const colLetter = (key: string) => ws.getColumn(key).letter;
  const estadoCol = colLetter('estado');

  totalRow.getCell('codigo').value = 'TOTAL';
  totalRow.getCell('cliente').value = `${validas.length} sale${validas.length === 1 ? '' : 's'} (voided excluded)`;

  (['montoCotizado', 'montoFinal'] as const).forEach((key) => {
    const col = colLetter(key);
    const result = round2(validas.reduce((acc, v) => acc + (v[key] ?? 0), 0));
    totalRow.getCell(key).value = ventas.length
      ? {
          formula: `SUMIFS(${col}${firstDataRow}:${col}${lastDataRow},${estadoCol}${firstDataRow}:${estadoCol}${lastDataRow},"<>${ESTADO_LABELS.ANULADO}")`,
          result,
        }
      : 0;
  });

  for (let c = 1; c <= lastCol; c++) {
    const cell = totalRow.getCell(c);
    cell.font = { bold: true, color: { argb: NAVY } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F4F3' } };
    cell.border = { top: { style: 'medium', color: { argb: NAVY } } };
    if (columns[c - 1].currency) cell.numFmt = CURRENCY_FMT;
  }
  totalRow.height = 20;

  if (ventas.length) {
    ws.autoFilter = {
      from: { row: headerRowNum, column: 1 },
      to: { row: lastDataRow, column: lastCol },
    };
  } else {
    ws.getCell(firstDataRow, 1).value = 'No sales match the selected filters.';
    ws.getCell(firstDataRow, 1).font = { italic: true, color: { argb: 'FF9CA3AF' } };
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}
