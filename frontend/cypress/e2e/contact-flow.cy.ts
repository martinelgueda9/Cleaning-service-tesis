describe('Flujo E2E 3 - Envío de Formulario de Contacto y Manejo de Estados', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('debe validar campos obligatorios y mostrar mensajes de error cuando el formulario está vacío', () => {
    cy.get('#contact').scrollIntoView();

    cy.get('.btn-contact-submit').click();

    cy.get('.form-field--error').should('have.length.at.least', 2);
    cy.get('.form-field__error').should('be.visible');
  });

  it('debe enviar satisfactoriamente el mensaje de contacto y permitir reiniciar el formulario', () => {
    cy.intercept('POST', '/api/contact', {
      statusCode: 201,
      body: {
        ok: true,
        data: {
          message: '¡Gracias por comunicarte con nosotros!',
          contact: {
            name: 'Carolina Soto',
            email: 'carolina@example.com',
            phone: '3205559876',
            receivedAt: new Date().toISOString(),
          },
        },
      },
    }).as('postContact');

    cy.get('#contact').scrollIntoView();

    cy.get('#home-contact-name').type('Carolina Soto');
    cy.get('#home-contact-email').type('carolina@example.com');
    cy.get('#home-contact-phone').type('3205559876');
    cy.get('#home-contact-message').type('Hola, solicito información sobre disponibilidad de limpieza profunda para este fin de semana.');

    cy.get('.btn-contact-submit').click();

    cy.wait('@postContact');

    cy.get('.contact-success-state', { timeout: 6000 }).should('be.visible');
    cy.get('.success-title').should('contain', 'Thank you, Carolina');
    cy.get('.success-channel-badge').should('contain', 'carolina@example.com');

    cy.get('.btn-send-another').click();

    cy.get('#home-contact-name').should('be.visible').and('have.value', '');
    cy.get('#home-contact-message').should('have.value', '');
  });
});

