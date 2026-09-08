# Marcela's Cleaning Mn - Sistema de Gestión 

Sistema web en desarrollo como **Proyecto de Título** de la carrera de *Ingeniería en Ejecución en Computación e Informática* (Universidad del Bío-Bío), diseñado específicamente para la microempresa de servicios de limpieza a domicilio **MarcelasCleaningMn** (Saint Cloud, Minnesota, EE. UU.).

Este sistema busca digitalizar y centralizar los procesos clave del negocio, los cuales actualmente se gestionan de forma manual a través de WhatsApp, llamadas telefónicas y registros en papel.

---

##  Características Principales

El sistema se compone de tres módulos principales que interactúan entre sí:

*    **Agenda:** Administración de disponibilidad, horarios y programación de citas de servicio.
*   **Cotización:** Cálculo automatizado y dinámico del valor de un servicio en función del tipo de limpieza (regular, profunda, mudanza), tamaño del inmueble (pies cuadrados) y servicios adicionales requeridos.
*    **Ventas y CRM:** Registro, seguimiento de los servicios contratados, gestión de estados de pago e historial detallado de clientes.

---

##  Stack Tecnológico

El proyecto es un monorepositorio que separa la lógica del cliente (Frontend) y del servidor (Backend), utilizando tecnologías modernas y tipado estricto.

### Frontend
*   **Core:** React 
*   **Lenguaje:** TypeScript
*   **Bundler:** Vite

### Backend
*   **Entorno:** Node.js
*   **Framework:** Express.js
*   **Lenguaje:** TypeScript
*   **ORM:** Prisma
*   **Validación de Datos:** Zod

---

## Estructura del Proyecto

web-tesis/
│
├── frontend/          
│   ├── src/           
│   ├── package.json
│   └── tsconfig.json
│
└── backend/           
    ├── src/           
    ├── prisma/       
    ├── package.json
    └── tsconfig.json
```

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd web-tesis
```

### 2. Configurar el Backend
```bash
cd backend
# Instalar dependencias
npm install

# Configurar variables de entorno (crear archivo .env)

# Generar cliente de Prisma y ejecutar migraciones
npm run prisma:generate
npm run prisma:migrate

# Iniciar servidor en modo desarrollo
npm run dev
```

### 3. Configurar el Frontend
Abre una nueva terminal en la raíz del proyecto.
```bash
cd frontend
# Instalar dependencias
npm install

# Iniciar entorno de desarrollo
npm run dev
```
La aplicación cliente estará disponible típicamente en `http://localhost:5173`.

