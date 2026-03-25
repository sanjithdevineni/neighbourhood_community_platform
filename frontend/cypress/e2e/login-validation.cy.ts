describe('Login Page Validation', () => {
  it('shows required field errors when submitting empty form', () => {
    cy.visit('/login');
    cy.contains('button', 'Log in').click();

    cy.contains('Email is required.').should('be.visible');
    cy.contains('Password is required.').should('be.visible');
  });
});
