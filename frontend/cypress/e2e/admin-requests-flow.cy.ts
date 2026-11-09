describe('Flujo E2E - Gestión del Panel de Solicitudes Administrativas', () => {
  beforeEach(() => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        ok: true,
        data: {
          token: 'jwt-fake-admin-token-12345',
          user: {
            id: 'usr-1',
            nombre: 'Marcela',
            email: 'admin@gmail.com',
            rol: 'PROPIETARIA',
          },
        },
      },
    }).as('postLogin');

    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        ok: true,
        data: {
          id: 'usr-1',
          nombre: 'Marcela',
          email: 'admin@gmail.com',
          rol: 'PROPIETARIA',
        },
      },
    }).as('getMe');

    cy.intercept('GET', '/api/cotizaciones*', {
      statusCode: 200,
      body: {
        ok: true,
        data: [
          {
            id: 'cot-1111',
            codigo: 'COT-8921',
            estado: 'PENDIENTE',
            totalEstimado: 210,
            motivoRechazo: null,
            createdAt: '2026-11-05T14:30:00.000Z',
            cliente: {
              id: 'cli-1',
              nombre: 'Carlos Mendoza',
              email: 'carlos@example.com',
              telefono: '3205550199',
              direccion: '123 4th Ave S, St. Cloud',
              ciudad: 'Saint Cloud',
            },
            tipoLimpieza: 'ESTANDAR',
            numHabitaciones: 3,
            numBanos: 2,
            serviciosExtra: 'Inside fridge',
            extras: 'Inside fridge',
            fechaPreferida: '2026-11-12',
            horaPreferida: '09:00',
            tamanio: '3 bed / 2 bath',
            frecuencia: 'Bi-weekly',
            zona: 'local',
            zonaLabel: 'In zone',
            ciudadReal: 'Saint Cloud',
          },
          {
            id: 'cot-2222',
            codigo: 'COT-7740',
            estado: 'ACEPTADA',
            totalEstimado: 350,
            motivoRechazo: null,
            createdAt: '2026-11-04T10:15:00.000Z',
            cliente: {
              id: 'cli-2',
              nombre: 'Beatriz Silva',
              email: 'beatriz@example.com',
              telefono: '3205550288',
              direccion: '456 County Rd, Cold Spring',
              ciudad: 'Cold Spring',
            },
            tipoLimpieza: 'PROFUNDA',
            numHabitaciones: 4,
            numBanos: 3,
            serviciosExtra: null,
            extras: null,
            fechaPreferida: '2026-11-15',
            horaPreferida: '14:00',
            tamanio: 'Large Home',
            frecuencia: 'One-time',
            zona: 'extended',
            zonaLabel: 'Extended zone',
            ciudadReal: 'Cold Spring',
          },
        ],
      },
    }).as('getCotizaciones');

    cy.visit('/login');
    cy.get('#admin-email').type('admin@gmail.com');
    cy.get('#admin-password').type('admin123');
    cy.get('.admin-login-btn').click();

    cy.wait('@postLogin');
    cy.url().should('include', '/admin');
    cy.wait('@getCotizaciones');
  });

  it('debe visualizar el panel de solicitudes con su tabla, tarjetas y contadores', () => {
    cy.get('.adm-header-title').should('contain', 'Quote Requests');
    cy.get('.adm-table').should('be.visible');
    cy.get('.adm-code').first().should('contain', 'COT-8921');
    cy.get('.adm-client-name').first().should('contain', 'Carlos Mendoza');
    cy.get('.adm-zone-badge').first().should('contain', 'In zone');
    cy.get('.adm-badge--pendiente').should('contain', 'Pending');
  });

  it('debe filtrar las solicitudes por texto de búsqueda en tiempo real', () => {
    cy.get('.adm-search-input').type('Beatriz');
    cy.get('.adm-table tbody tr').should('have.length', 1);
    cy.get('.adm-client-name').should('contain', 'Beatriz Silva');

    cy.get('.adm-search-clear').click();
    cy.get('.adm-table tbody tr').should('have.length', 2);
  });

  it('debe abrir el modal de detalles y permitir aceptar o agendar la solicitud', () => {
    cy.intercept('PATCH', '/api/cotizaciones/cot-1111/revisar', {
      statusCode: 200,
      body: {
        ok: true,
        data: {
          id: 'cot-1111',
          codigo: 'COT-8921',
          estado: 'ACEPTADA',
        },
      },
    }).as('patchRevisar');

    cy.get('.adm-action-btn--accept').first().click();

    cy.get('.adm-modal').should('be.visible');
    cy.get('.adm-modal-title').should('contain', 'Accept & Schedule');
    cy.get('.adm-form-card-summary').should('contain', 'Carlos Mendoza');

    cy.get('.adm-modal-btn--accept').click();

    cy.wait('@patchRevisar');
    cy.get('.adm-toast--ok', { timeout: 6000 }).should('be.visible');
  });
});
