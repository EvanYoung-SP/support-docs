export {}; // because of -isolatedModules

describe('Home page', () => {
  it('Should display without error', () => {
    cy.visit('/');
  });
});
