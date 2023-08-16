import express from 'express';
const router = express.Router();
import fs from 'fs';
import path from 'path';
import {UserModel} from '../dao/models/usermodel.js';
import bcrypt from 'bcrypt';
import { authMiddleware } from '../middlewares/auth.js';
import passport from 'passport';
import ProductManager from '../ProductManager.js';
import MessageManagerDB from '../dao/MessageManagerDB.js';
const pm = new ProductManager('../productos.json');
let products = [];
const messageManager = new MessageManagerDB


// Rutas de vistas

router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('¡Algo salió mal!');
});

router.get('/', async (req, res) => {
    res.render('main', { user: req.session ? req.session.user : undefined });
  });
  
  router.get('/login', (req, res) => {
    res.render('login'); 
  });
  
  
  
  router.get('/home', (req, res) => {
    // Verificar si el usuario está logueado
    if (req.session.user) {
      // Renderizar la vista de home y pasar los datos del usuario
      res.render('home', { user: req.session.user });
    } else {
      // Si no hay usuario logueado, redirigir al login
      res.redirect('/login');
    }
  });
  
  
  router.get('/chat', async (req, res) => {
    if (req.session.user) {
      let messages = await messageManager.getMessages();
      res.render('chat', { user: req.session.user, messages: messages });
    } else {
      // Si no hay usuario logueado, redirigir al login
      res.redirect('/login');
    }
  });
  
  
  
  router.get('/realTimeProducts', (req, res) => {
    if (req.session.user) {
      res.render('realTimeProducts', { user: req.session.user, products: products });
    } else {
      // Si no hay usuario logueado, redirigir al login
      res.redirect('/login');
  }});
  
  
  router.get('/register' , (req,res)=> {
    res.render('register');
  })
  
  router.post('/register', async (req, res) => {
    const { first_name, last_name, email, age, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).send('El email y la contraseña son obligatorios');
    }
  
    try {
      const user = new UserModel({
        first_name,
        last_name,
        email,
        age,
        password,
      });
  
      await user.save();
      res.redirect('/login');
    } catch (err) {
      console.error(err);
      if (err.code === 11000) {
        // Código de error de MongoDB para "Duplicate Key"
        if (err.keyPattern.email) {
          res.status(400).send('Este email ya existe');
        }
      } else {
        // Si no es un error de duplicado, enviar el error completo
        res.status(500).send(err);
      }
    }
  });
  
  
  
  router.get('/auth/github',
    passport.authenticate('github', { scope: [ 'user:email' ] }));
  
  
  
  router.get('/auth/github/callback', 
    passport.authenticate('github', { failureRedirect: '/login' }),
    function(req, res) {
    req.session.user = req.user;
    res.redirect('/');
  });
  
  
  
  router.get('/logout', authMiddleware, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).send('No se pudo cerrar la sesión');
      } else {
        res.redirect('/login');
      }
    });
  });
  
  router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await UserModel.findOne({ username: username });
  
    if (user) {
      if (password && user.password && bcrypt.compareSync(password, user.password)) {
        req.session.user = user;
        return res.redirect('/home');
      } else {
        res.status(401).send('La contraseña es incorrecta');
      }
    } else {
      res.status(401).send('El usuario no existe');
    }
  });
  


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



