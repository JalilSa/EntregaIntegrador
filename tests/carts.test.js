import { expect } from 'chai';
import request from 'supertest';
import { app } from '../app.js';

describe('Carts Router', () => {
  it('should add item to cart', async () => {
    const res = await request(app).post('/cart').send({ id: '1', quantity: 2 });
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('products');
    expect(res.body.products).to.be.an('array');
    expect(res.body.products[0]).to.equal('1');  // Asume que '1' es la ID del producto

  });

  it('should get cart', async () => {
    const res = await request(app).get('/cart');
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('products');
    expect(res.body.products).to.be.an('array');

  });
});
