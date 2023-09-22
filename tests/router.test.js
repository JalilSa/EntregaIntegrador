
import { expect } from 'chai';
import request from 'supertest';
import { app } from '../app.js';


describe('Products Router', () => {
  it('should get products', async () => {
    const res = await request(app).get('/products');
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('status', 'success');
  });

 
});

// Bloque de pruebas para la ruta de carritos
describe('Carts Router', () => {
  it('should add item to cart', async () => {
    const res = await request(app).post('/cart').send({ id: '1', quantity: 2 });
    expect(res.statusCode).to.equal(200);

  });

});

// Bloque de pruebas para la ruta de sesiones
describe('Sessions Router', () => {
  it('should register a user', async () => {
    const res = await request(app).post('/register').send({ email: 'test@example.com', password: 'password123' });
    expect(res.statusCode).to.equal(200);

  });
});
