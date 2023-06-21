import express from 'express';
import ProductManager from '../ProductManager.js';
const router = express.Router();
import io from '../app.js'
import fs from "fs";
import path from 'path';
import __dirname from '../utils.js';

const pm = new ProductManager('productos.json');
let products = [];

try {
    const data = fs.readFileSync(path.resolve(__dirname, './productos.json'), 'utf-8');
    products = JSON.parse(data);
} catch (err) {
    console.error('Error', err);
}

router.get('/', async (req, res) => {
  try {
    const { limit = 10, page = 1, sort, query } = req.query;
    const options = {
      limit: parseInt(limit),
      page: parseInt(page),
      sort,
      query,
    };
    
    const result = await pm.getProducts(options);
    const { totalPages, prevPage, nextPage, hasPrevPage, hasNextPage, prevLink, nextLink } = result.pagination;
    
    res.json({
      status: 'success',
      payload: result.products,
      totalPages,
      prevPage,
      nextPage,
      page: parseInt(page),
      hasPrevPage,
      hasNextPage,
      prevLink,
      nextLink,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener los productos',
    });
  }
});

router.get('/:pid', async (req, res) => {
  try {
    const product = await pm.getProductById(parseInt(req.params.pid));
    if (!product) {
      res.status(404).send('Producto no encontrado');
    } else {
      res.json(product);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al obtener el producto');
  }
});

router.post('/', (req, res) => {
  const { title, description, price, thumbnail, code, stock } = req.body;
  pm.addProduct(title, description, price, thumbnail, code, stock);
  res.status(201).send('Producto agregado');
});

router.put('/:pid', (req, res) => {
  const { title, description, price, thumbnail, code, stock } = req.body;
  pm.updateProduct(parseInt(req.params.pid), { title, description, price, thumbnail, code, stock });
  res.send('Producto actualizado');
});

router.delete('/:pid', (req, res) => {
  pm.deleteProduct(parseInt(req.params.pid));
  res.send('Producto eliminado');
});

export default router;



// Agrega algunos productos
pm.addProduct('Producto 1', 'Descripción del producto 1', 10.99, 'https://ruta/imagen1.jpg', 'COD1', 100);
pm.addProduct('Producto 2', 'Descripción del producto 2', 123.99, 'https://ruta/imagen2.jpg', 'COD2', 100);
pm.addProduct('Producto 3', 'Descripción del producto 3', 132.99, 'https://ruta/imagen3.jpg', 'COD3', 50);


// Muestra todos los productos
console.log(pm.getProducts());

// Muestra un producto específico
console.log(pm.getProductById(1));

// Actualiza un producto
pm.updateProduct(1, { title: 'Nuevo título', price: 99.99 });
console.log(pm.getProductById(1));

// Elimina un producto
pm.deleteProduct(2);
console.log(pm.getProducts());

//Prueba de real time

setTimeout(() => {
    pm.addProduct('Producto 4', 'Descripción del producto 4', 10.99, 'https://ruta/imagen4.jpg', 'COD4', 100);
    pm.addProduct('Producto 5', 'Descripción del producto 5', 123.99, 'https://ruta/imagen5.jpg', 'COD5', 100);
    pm.addProduct('Producto 6', 'Descripción del producto 6', 132.99, 'https://ruta/imagen6.jpg', 'COD6', 50);
    products = pm.getProducts();
    io.emit('updateProducts', products);

}, 5000);