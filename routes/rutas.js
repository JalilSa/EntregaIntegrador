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
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { userToDto } from '../middlewares/userToDto.js';
import CartManager from '../CartManager.js'
import TicketModel from '../dao/models/ticketModel.js';
import { generateMockProducts } from '../mocking.js';
import { CustomError, ErrorDictionary } from '../errorHandler.js';
import logger from '../config/logger.js';;
import jwt from 'jsonwebtoken';
import { sendResetPasswordEmail } from '../mailer.js';

const isUser = (req, res, next) => {
  if (req.session && req.session.user) {
      next();
  } else {
      res.status(401).send('Acceso denegado: Inicie sesión primero.');
  }
};

const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
      next();
  } else {
      res.status(403).send('Acceso denegado: No tiene permisos de administrador.');
  }
};
const isAdminOrPremium = (req, res, next) => {
  if (req.session && req.session.user && (req.session.user.role === 'admin' || req.session.user.role === 'premium')) {
      next();
  } else {
      res.status(403).send('Acceso denegado: No tiene permisos suficientes.');
  }
};

const pm = new ProductManager('../productos.json');
const cm = new CartManager('../carrito.json', pm);

router.put('/api/users/premium/:uid', async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.uid);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Toggle user's role between 'user' and 'premium'
    if (user.role === 'user') {
      user.role = 'premium';
    } else if (user.role === 'premium') {
      user.role = 'user';
    }

    await user.save();
    res.json({ message: `Rol del usuario cambiado a ${user.role}` });
  } catch (error) {
    logger.error('Error cambiando el rol del usuario:', error);
    res.status(500).json({ message: 'Error al cambiar el rol del usuario' });
  }
});

router.get('/auth/request-reset-password', (req, res) => {
  console.log('Accediendo a la página de solicitud de restablecimiento de contraseña...');
  res.render('request-reset-password');
});

router.post('/request-reset-password', async (req, res) => {
  const { email } = req.body;
  console.log(`Recibiendo solicitud de restablecimiento de contraseña para el correo: ${email}`);
  
  const user = await UserModel.findOne({ email });

  if (!user) {
      console.log(`Usuario no encontrado para el correo: ${email}`);
      return res.status(400).send('Correo electrónico no encontrado.');
  }

  const token = jwt.sign({ id: user._id }, 'YOUR_SECRET_KEY', { expiresIn: '1h' });
  console.log(`Token generado para el usuario (ID: ${user._id}): ${token}`);

  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
  
  console.log(`Fecha y hora actuales: ${new Date(Date.now())}`);
  console.log(`Fecha y hora de expiración del token: ${new Date(user.resetPasswordExpires)}`);

  await user.save();
  console.log('Token y hora de expiración guardados en la base de datos.');

  await sendResetPasswordEmail(email, token);
  console.log('Correo de recuperación enviado.');

  res.send('Correo de recuperación enviado.');
});


router.get('/reset-password/:token', async (req, res) => {
  const token = req.params.token;
  const user = await UserModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
      return res.send('El token es inválido o ha expirado.');
  }

  // Aquí, redirige al usuario a una página de restablecimiento de contraseña
  res.render('reset-password');
});

router.get('/loggerTest', (req, res) => {
  logger.debug('This is a debug log');
  logger.http('This is a http log');
  logger.info('This is an info log');
  logger.error('This is an error log');
  res.send('Logs generated! Check your console and errors.log file.');
});


try {
  fs.writeFileSync('./test.json', JSON.stringify({ message: "Hello, World!" }, null, 2));
  logger.info("Archivo escrito exitosamente!");
} catch (error) {
  logger.error("Error al escribir el archivo:", error.message);
}
router.get('/mockingproducts', (req, res) => {
  const products = generateMockProducts();
  res.json(products);
});


router.get('/productEditor',isAdminOrPremium, (req,res)=> {
  res.render('productEditor');
})
router.post('/api/addProduct', (req, res) => {
  const { title, description, price, thumbnail, code, stock } = req.body;

  const ownerId = req.currentUser && req.currentUser.role === 'premium' ? req.currentUser._id : null; 

  try {
      pm.addProduct(title, description, price, thumbnail, code, stock, ownerId);
      res.json({ success: true });
  } catch (error) {
      logger.error(error);
      res.status(500).json({ success: false, message: error.message });
  }
});



let products = [];
let cartProducts = cm.getCart
const messageManager = new MessageManagerDB
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Rutas de vistas
router.post('/create-ticket', async (req, res) => {
  try {
    logger.info("Inicio del endpoint /create-ticket");

    const { amount, purchaser } = req.body;

    logger.info("Datos recibidos:", { amount, purchaser });
    
    const code = `TCKT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    logger.info("Código generado:", code);

    const ticket = new TicketModel({ code, amount, purchaser });
    logger.info("Instancia de TicketModel creada:", ticket);

    await ticket.save();
    logger.info("Ticket guardado en la base de datos");

    cm.clearCart();
    logger.info("Carrito limpiado");

    res.json({ success: true });
    logger.info("Respuesta exitosa enviada");
  } catch (error) {
    logger.error('Error al crear el ticket:', error.message);
    res.status(500).json({ success: false, message: error.message });
    logger.info("Error enviado en la respuesta");
  }
});



router.get('/current', (req, res) => {
  const userDto = userToDto(req.user);
  res.json(userDto);
});
router.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

router.post('/cart', async (req, res) => {
  logger.info("Inicio del endpoint /cart");

  const { id, quantity } = req.body;
  logger.info("Datos recibidos del cuerpo:", { id, quantity });

  if (!id || typeof quantity !== 'number') {
    logger.info("Datos inválidos recibidos");
    return res.status(400).json({ message: 'Datos inválidos' });
  }

  // Check if the product exists and if it belongs to the user
  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ message: 'Producto no encontrado' });
  }

  if (req.session.user && req.session.user.role === 'premium' && String(product.owner) === req.session.user.email) {
    return res.status(403).json({ message: 'Un usuario premium no puede añadir a su carrito un producto que le pertenece' });
  }

  try {
    cm.addItem({ id, quantity }); // Cambiamos pid por id
    logger.info("Producto añadido al manager del carrito");
    res.json({ message: 'Producto añadido al carrito' });
    logger.info("Respuesta exitosa enviada");
  } catch (error) {
    logger.error('Error añadiendo al carrito:', error);
    res.status(500).json({ message: 'Error al añadir el producto al carrito' });
    logger.info("Error enviado en la respuesta");
  }
});



router.get('/cart', (req, res) => {
  const cartData = cm.getCart();
  const allProducts = products;

  const combinedCart = cartData.map(cartItem => {
    const productInfo = allProducts.find(product => String(product.id) === String(cartItem.id));

    
    if (!productInfo) {
      logger.error(`No se encontró producto con ID: ${cartItem.id}`);
      return cartItem
    }

    return {
      ...cartItem,
      productTitle: productInfo.title,
      productDescription: productInfo.description,
      productPrice: productInfo.price
    };
  });

  res.render('cart', { cart: combinedCart, user: req.session.user });
});


router.get('/', async (req, res) => {
  const user = req.session ? req.session.user : undefined;
  res.render('main', { 
      user: user, 
      isUserPremium: user && user.role === 'premium' 
  });
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
  
  
  
  router.get('/realTimeProducts', isUser, (req, res) => {
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
    const { first_name, last_name, email, age, password, is_premium } = req.body;
  
    if (!email || !password) {
      return res.status(400).send('El email y la contraseña son obligatorios');
    }
  
    // Establecer el rol en base al checkbox
    const role = is_premium ? 'premium' : 'user';
  
    try {
      const user = new UserModel({
        first_name,
        last_name,
        email,
        age,
        password,
        role  // Añadimos el rol al modelo
      });
  
      await user.save();
      res.redirect('/login');
    } catch (err) {
      logger.error(err);
      if (err.code === 11000) {
        // Código de error de MongoDB para "Duplicate Key"
        if (err.keyPattern && err.keyPattern.email) {
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
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).send('Se requieren tanto el email como la contraseña');
    }
  
    const user = await UserModel.findOne({ email });
  
    if (!user) {
      return res.status(401).send('El usuario no existe');
    }
  
    const isMatch = bcrypt.compareSync(password, user.password);
    
    if (!isMatch) {
      return res.status(401).send('La contraseña es incorrecta');
    }
  
    req.session.user = user;
    return res.redirect('/home');
  });
  
  
  
  


  try {
    const data = fs.readFileSync(path.resolve(__dirname, '../productos.json'), 'utf-8');
    products = JSON.parse(data);
} catch (err) {
    logger.error('Error', err);
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
    logger.error(error);
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
    logger.error(error);
    res.status(500).send('Error al obtener el producto');
  }
});

router.post('/', (req, res) => {
  const { title, description, price, thumbnail, code, stock } = req.body;
  pm.addProduct(title, description, price, thumbnail, code, stock);
  res.status(201).send('Producto agregado');
});

router.put('/:pid', async (req, res) => {
  const product = await pm.getProductById(parseInt(req.params.pid));

  if (!product) {
    return res.status(404).send('Producto no encontrado');
  }

  if (req.user.role === 'admin' || (req.user.role === 'premium' && req.user._id.toString() === product.owner.toString())) {
    const { title, description, price, thumbnail, code, stock } = req.body;
    await pm.updateProduct(parseInt(req.params.pid), { title, description, price, thumbnail, code, stock });
    res.send('Producto actualizado');
  } else {
    res.status(403).send('No tienes permiso para actualizar este producto');
  }
});


router.delete('/:pid', async (req, res) => {
  const product = await pm.getProductById(parseInt(req.params.pid));

  if (!product) {
    return res.status(404).send('Producto no encontrado');
  }

  if (req.user.role === 'admin' || (req.user.role === 'premium' && req.user._id.toString() === product.owner.toString())) {
    await pm.deleteProduct(parseInt(req.params.pid));
    res.send('Producto eliminado');
  } else {
    res.status(403).send('No tienes permiso para eliminar este producto');
  }
});


  
export default router;


try {
  // Intenta agregar los productos
  pm.addProduct('Producto 1', 'Descripción del producto 1', 10.99, 'https://ruta/imagen1.jpg', 'COD1', 100);
  pm.addProduct('Producto 2', 'Descripción del producto 2', 123.99, 'https://ruta/imagen2.jpg', 'COD2', 100);
  pm.addProduct('Producto 3', 'Descripción del producto 3', 132.99, 'https://ruta/imagen3.jpg', 'COD3', 50);

  // Muestra todos los productos
  logger.info(pm.getProducts());

  // Muestra un producto específico
  logger.info(pm.getProductById(1));

  // Actualiza un producto
  pm.updateProduct(1, { title: 'Nuevo título', price: 99.99 });
  logger.info(pm.getProductById(1));

  // Elimina un producto
  pm.deleteProduct(2);
  logger.info(pm.getProducts());

} catch (error) {
  // Si ocurre algún error en el bloque try, se manejará aquí
  if (error instanceof CustomError) {
    if (error.type === "PRODUCT_EXISTS") {
      logger.error("El producto ya existe, no se puede agregar de nuevo.");
    } else if (error.type === "MISSING_FIELDS") {
      logger.error("Faltan campos obligatorios para agregar el producto.");
    } // Aquí puedes continuar con más condicionales 'else if' para manejar otros tipos de errores personalizados si los tienes.
  } else {
    // Para cualquier otro tipo de error que no sea CustomError
    logger.error("Ocurrió un error:", error.message);
  }
}


