import { expect } from 'chai';
import request from 'supertest';
import { app } from '../app.js';

describe('Products Router', () => {
  it('should get products', async () => {
    const res = await request(app).get('/products');
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('status', 'success');
    expect(res.body).to.have.property('data');
    expect(res.body.data).to.be.an('array');

  });

  it('should get a specific product', async () => {
    const res = await request(app).get('/products/1');
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('title');
    expect(res.body).to.have.property('description');
    expect(res.body).to.have.property('price');
    expect(res.body).to.have.property('thumbnail');
    expect(res.body).to.have.property('code');
    expect(res.body).to.have.property('stock');

  });

  it('should add a product', async () => {
    const newProduct = {
      title: 'New Product',
      description: 'This is a new product.',
      price: 100,
      thumbnail: 'https://example.com/new-product.jpg',
      code: 'NP123',
      stock: 50,
      // ... otros campos si es necesario
    };
    const res = await request(app).post('/products').send(newProduct);
    expect(res.statusCode).to.equal(201);
    expect(res.body).to.have.property('title', newProduct.title);
    expect(res.body).to.have.property('description', newProduct.description);
    expect(res.body).to.have.property('price', newProduct.price);
    expect(res.body).to.have.property('thumbnail', newProduct.thumbnail);
    expect(res.body).to.have.property('code', newProduct.code);
    expect(res.body).to.have.property('stock', newProduct.stock);

  });
});
