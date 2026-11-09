import { PrismaClient, Rol } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log(' Iniciando seed...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
  const adminPass = process.env.ADMIN_PASS || 'admin123';

  const existingAdmin = await prisma.usuario.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPass, 10);
    await prisma.usuario.create({
      data: {
        nombre: 'Marcela',
        email: adminEmail,
        password: hashedPassword,
        rol: Rol.PROPIETARIA,
      },
    });
    console.log(`   Usuario propietaria creado: ${adminEmail}`);
  } else {
    console.log(`    Usuario propietaria ya existe: ${adminEmail}`);
  }

  const servicios = [
    {
      clave: 'standard',
      nombre: 'Standard Cleaning',
      etiquetaTamanio: 'Bedrooms and bathrooms',
      orden: 1,
      opciones: [
        { clave: '1bed_1bath', etiqueta: '1 bedroom / 1 bath', precioBase: 135, orden: 1 },
        { clave: '2bed_1bath', etiqueta: '2 bedrooms / 1 bath', precioBase: 150, orden: 2 },
        { clave: '2bed_1_5bath', etiqueta: '2 bedrooms / 1.5 baths', precioBase: 165, orden: 3 },
        { clave: '2bed_2bath', etiqueta: '2 bedrooms / 2 baths', precioBase: 180, orden: 4 },
        { clave: '3bed_2bath', etiqueta: '3 bedrooms / 2 baths', precioBase: 210, orden: 5 },
        { clave: '4bed_2_3bath', etiqueta: '4 bedrooms / 2–3 baths', precioBase: 250, orden: 6 },
        { clave: 'something_else', etiqueta: 'Something else', precioBase: null, orden: 7 },
      ],
    },
    {
      clave: 'deep',
      nombre: 'Deep Cleaning',
      etiquetaTamanio: 'Home size',
      orden: 2,
      opciones: [
        { clave: 'small_apt', etiqueta: 'Small apartment', precioBase: 250, orden: 1 },
        { clave: 'medium_home', etiqueta: 'Medium home', precioBase: 325, orden: 2 },
        { clave: 'large_home', etiqueta: 'Large home', precioBase: 425, orden: 3 },
      ],
    },
    {
      clave: 'movein',
      nombre: 'Move-in Cleaning',
      etiquetaTamanio: 'Property size',
      orden: 3,
      opciones: [
        { clave: '1_2bed_apt', etiqueta: '1–2 bedroom apartment', precioBase: 275, orden: 1 },
        { clave: '3bed_home', etiqueta: '3 bedroom home', precioBase: 350, orden: 2 },
        { clave: 'larger_home', etiqueta: 'Larger home', precioBase: null, orden: 3 },
      ],
    },
    {
      clave: 'moveout',
      nombre: 'Move-out Cleaning',
      etiquetaTamanio: 'Property size',
      orden: 4,
      opciones: [
        { clave: '1_2bed_apt', etiqueta: '1–2 bedroom apartment', precioBase: 275, orden: 1 },
        { clave: '3bed_home', etiqueta: '3 bedroom home', precioBase: 350, orden: 2 },
        { clave: 'larger_home', etiqueta: 'Larger home', precioBase: null, orden: 3 },
      ],
    },
  ];

  for (const svc of servicios) {
    const existing = await prisma.servicioTipo.findUnique({ where: { clave: svc.clave } });
    if (existing) {
      console.log(`    Servicio "${svc.nombre}" ya existe`);
      continue;
    }

    await prisma.servicioTipo.create({
      data: {
        clave: svc.clave,
        nombre: svc.nombre,
        etiquetaTamanio: svc.etiquetaTamanio,
        orden: svc.orden,
        opciones: {
          create: svc.opciones,
        },
      },
    });
    console.log(`   Servicio "${svc.nombre}" creado con ${svc.opciones.length} opciones`);
  }

  const addons = [
    { clave: 'inside_fridge', etiqueta: 'Inside fridge', precioMin: 40, precioMax: 60, unidad: 'flat', orden: 1 },
    { clave: 'inside_oven', etiqueta: 'Inside oven', precioMin: 40, precioMax: 60, unidad: 'flat', orden: 2 },
    { clave: 'inside_cabinets', etiqueta: 'Inside cabinets', precioMin: 40, precioMax: 40, unidad: 'flat', orden: 3 },
    { clave: 'interior_windows', etiqueta: 'Interior windows', precioMin: 8, precioMax: 12, unidad: 'each', orden: 4 },
    { clave: 'light_organizing', etiqueta: 'Light organizing', precioMin: 35, precioMax: 35, unidad: 'hour', orden: 5 },
    { clave: 'pet_hair_removal', etiqueta: 'Heavy pet hair removal', precioMin: 25, precioMax: 50, unidad: 'flat', orden: 6 },
  ];

  for (const addon of addons) {
    const existing = await prisma.addonServicio.findUnique({ where: { clave: addon.clave } });
    if (existing) {
      console.log(`    Addon "${addon.etiqueta}" ya existe`);
      continue;
    }
    await prisma.addonServicio.create({ data: addon });
    console.log(`   Addon "${addon.etiqueta}" creado`);
  }

  console.log(' Seed completado.');
}

main()
  .catch((e) => {
    console.error(' Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
