import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'El correo electrónico es requerido' })
    .email('Formato de correo electrónico inválido')
    .transform((v) => v.trim().toLowerCase()),
  password: z
    .string({ required_error: 'La contraseña es requerida' })
    .min(1, 'La contraseña es requerida'),
});

export const contactSchema = z.object({
  name: z
    .string({ required_error: 'El nombre es obligatorio' })
    .min(1, 'El nombre es obligatorio')
    .transform((v) => v.trim()),
  email: z
    .string()
    .email('Formato de correo electrónico inválido')
    .transform((v) => v.trim())
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .transform((v) => v.trim())
    .optional()
    .or(z.literal('')),
  message: z
    .string({ required_error: 'El mensaje es obligatorio' })
    .min(5, 'El mensaje debe tener al menos 5 caracteres')
    .transform((v) => v.trim()),
}).refine(
  (data) => (data.email && data.email.length > 0) || (data.phone && data.phone.length > 0),
  { message: 'Debe ingresar al menos un medio de contacto (email o teléfono)', path: ['email'] }
);

const validServiceTypes = [
  'regular_cleaning',
  'deep_cleaning',
  'commercial_cleaning',
  'move_in_cleaning',
  'move_out_cleaning',
  'ESTANDAR',
  'PROFUNDA',
  'MUDANZA_ENTRADA',
  'MUDANZA_SALIDA',
  'POST_CONSTRUCCION',
  'OFICINA',
] as const;

export const cotizacionPublicSchema = z.object({
  serviceType: z
    .string({ required_error: 'El tipo de servicio es requerido' })
    .refine((v) => (validServiceTypes as readonly string[]).includes(v), {
      message: 'Tipo de servicio inválido',
    }),
  sizeId: z.string().optional(),
  addons: z.union([
    z.record(z.number().int().min(0)),
    z.array(z.string()),
  ]).optional(),
  estimatedPrice: z.string().optional(),
  nombre: z.string().optional(),
  fullName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  phone: z.string().optional(),
  direccion: z.string().optional(),
  address: z.string().optional(),
  notas: z.string().optional(),
  notes: z.string().optional(),
  serviceLabel: z.string().optional(),
  serviceName: z.string().optional(),
  sizeLabel: z.string().optional(),
  size: z.string().optional(),
  frequency: z.string().optional(),
});

const tipoLimpiezaEnum = z.enum([
  'ESTANDAR',
  'PROFUNDA',
  'MUDANZA_ENTRADA',
  'MUDANZA_SALIDA',
  'POST_CONSTRUCCION',
  'OFICINA',
]);

export const cotizacionAdminSchema = z.object({
  clienteId: z.string().uuid('ID de cliente inválido'),
  tipoLimpieza: tipoLimpiezaEnum,
  numHabitaciones: z.number().int().min(0).optional(),
  numBanos: z.number().int().min(0).optional(),
  piesCuadrados: z.number().min(0).optional(),
  tieneMascotas: z.boolean().optional(),
  serviciosExtra: z.string().optional(),
  totalEstimado: z.number().min(0, 'El total estimado debe ser mayor o igual a 0'),
  notas: z.string().optional(),
});

export const citaCreateSchema = z.object({
  clienteId: z.string().uuid('ID de cliente inválido'),
  cotizacionId: z.string().uuid().optional(),
  fechaServicio: z.string().refine(
    (v) => !isNaN(Date.parse(v)),
    { message: 'Fecha de servicio inválida (usar formato ISO)' }
  ),
  horaInicio: z.string().regex(
    /^\d{2}:\d{2}$/,
    'Hora de inicio inválida (usar formato HH:MM)'
  ),
  horaFin: z.string().regex(
    /^\d{2}:\d{2}$/,
    'Hora de fin inválida (usar formato HH:MM)'
  ),
  personalAsignado: z.string().optional(),
  direccionServicio: z.string().min(1, 'La dirección del servicio es requerida'),
  notas: z.string().optional(),
}).refine(
  (data) => data.horaInicio < data.horaFin,
  { message: 'La hora de inicio debe ser anterior a la hora de fin', path: ['horaInicio'] }
);

export const citaUpdateSchema = z.object({
  fechaServicio: z.string().refine(
    (v) => !isNaN(Date.parse(v)),
    { message: 'Fecha de servicio inválida' }
  ).optional(),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM').optional(),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM').optional(),
  personalAsignado: z.string().optional(),
  direccionServicio: z.string().min(1).optional(),
  notas: z.string().optional(),
});

export const clienteCreateSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').transform((v) => v.trim()),
  apellido: z.string().optional(),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  telefono: z.string().min(1, 'El teléfono es requerido'),
  direccion: z.string().min(1, 'La dirección es requerida'),
  ciudad: z.string().optional(),
  estadoRegion: z.string().optional(),
  codigoPostal: z.string().optional(),
  notas: z.string().optional(),
});

export const clienteUpdateSchema = clienteCreateSchema.partial();
