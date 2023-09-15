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
import { isAdmin } from '../middlewares/isAdmin.js';
import { isUser } from '../middlewares/isUser.js';
import { userToDto } from '../middlewares/userToDto.js';
import CartManager from '../CartManager.js'
import TicketModel from '../dao/models/ticketModel.js';
import { generateMockProducts } from '../mocking.js';
import { CustomError, ErrorDictionary } from '../errorHandler.js';
import logger from '../config/logger.js';
import transporter from '../MailManager.js';
import session from 'express-session';
import { Strategy as LocalStrategy } from 'passport-local';

const pm = new ProductManager('../productos.json');
const cm = new CartManager('../carrito.json', pm);
let products = [];
let cartProducts = cm.getCart
const messageManager = new MessageManagerDB
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
router.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 7200000 } // 2 horas
}));
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  console.log("Autenticando usuario local con email:", email);
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      console.log("Usuario no encontrado:", email);
      return done(null, false);
    }
    if (!user.comparePassword(password)) {
      console.log("Contraseña incorrecta para el usuario:", email);
      return done(null, false);
    }
    console.log("Usuario autenticado exitosamente:", email);
    return done(null, user);
  } catch (err) {
    console.error("Error durante la autenticación:", err.message);
    done(err);
  }
}));



router.use(express.json());
router.use(express.urlencoded({extended: true}));

// setup express session


// Configuración de Passport
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});





router.use(passport.initialize());
router.use(passport.session());

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

////////////////////////
//RUTAS DOCUMENTCION
////////////////////////




  
router.get('/auth/github',
passport.authenticate('github', { scope: [ 'user:email' ] }));



router.get('/auth/github/callback', 
passport.authenticate('github', { failureRedirect: '/login' }),
function(req, res) {
  console.log("Usuario autenticado con GitHub. Usuario:", req.user);
  req.session.user = req.user;
  res.redirect('/');
});

router.get('/logout', authMiddleware, (req, res) => {
  console.log("Usuario solicitó cierre de sesión. Usuario:", req.session.user);
  req.session.destroy((err) => {
    if (err) {
      console.error("Error al cerrar sesión:", err.message);
      res.status().send('No se pudo cerrar la sesión');
    } else {
      res.redirect('/login');
    }
  });
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error("Error en la autenticación:", err);
      return next(err);
    }
    if (!user) {
      console.log("Autenticación fallida. Razón:", info.message);
      return res.redirect('/login');
    }
    req.logIn(user, function(err) {
      if (err) {
        console.error("Error al iniciar sesión:", err);
        return next(err);
      }
      console.log("Usuario autenticado exitosamente:", user);
      return res.redirect('/home');
    });
  })(req, res, next);
});


/**
 * @swagger
 * components:
 *   securitySchemes:
 *     userRole:
 *       type: apiKey
 *       in: header
 *       name: x-access-token
 *       description: Token JWT que contiene el rol del usuario
 * 
 * /productEditor:
 *   get:
 *     tags:
 *       - Product Management
 *     description: Página del editor de productos. Acceso solo para usuarios con rol de 'admin'.
 *     security:
 *       - userRole: []
 *     responses:
 *       200:
 *         description: Retorna la vista del editor de productos
 *       403:
 *         description: No autorizado
 */
router.get('/productEditor',isAdmin , (req,res)=> {
  res.render('productEditor');
})
/**
 * @swagger
 * /api/addProduct:
 *   post:
 *     tags:
 *       - Product Management
 *     description: Agregar un nuevo producto a través de la API
 *     parameters:
 *       - name: title
 *         description: Título del producto
 *         in: body
 *         required: true
 *         type: string
 *       - name: description
 *         description: Descripción del producto
 *         in: body
 *         required: true
 *         type: string
 *       - name: price
 *         description: Precio del producto
 *         in: body
 *         required: true
 *         type: number
 *       - name: thumbnail
 *         description: Miniatura del producto
 *         in: body
 *         type: string
 *       - name: code
 *         description: Código del producto
 *         in: body
 *         type: string
 *       - name: stock
 *         description: Stock del producto
 *         in: body
 *         required: true
 *         type: number
 *     responses:
 *       200:
 *         description: Producto agregado exitosamente
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *       500:
 *         description: Error al agregar el producto
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             message:
 *               type: string
 */


router.post('/api/addProduct', (req, res) => {
  const { title, description, price, thumbnail, code, stock } = req.body;

  try {
      pm.addProduct(title, description, price, thumbnail, code, stock);
      res.json({ success: true });
  } catch (error) {
      logger.error(error);
      res.status().json({ success: false, message: error.message });
  }
});



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
    res.status().json({ success: false, message: error.message });
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
/**
 * @swagger
 * /cart:
 *   post:
 *     tags:
 *       - Cart
 *     description: Añadir un producto al carrito
 *     parameters:
 *       - name: id
 *         description: ID del producto
 *         in: body
 *         required: true
 *         type: string
 *       - name: quantity
 *         description: Cantidad del producto
 *         in: body
 *         required: true
 *         type: number
 *     responses:
 *       200:
 *         description: Producto añadido al carrito exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error al añadir producto al carrito
 */
router.post('/cart', (req, res) => {
  logger.info("Inicio del endpoint /cart");

  const { id, quantity } = req.body;
  logger.info("Datos recibidos del cuerpo:", { id, quantity });

  if (!id || typeof quantity !== 'number') {
    logger.info("Datos inválidos recibidos");
    return res.status(400).json({ message: 'Datos inválidos' });
  }

  try {
    cm.addItem({ id, quantity }); // Cambiamos pid por id
    logger.info("Producto añadido al manager del carrito");
    res.json({ message: 'Producto añadido al carrito' });
    logger.info("Respuesta exitosa enviada");
  } catch (error) {
    logger.error('Error añadiendo al carrito:', error);
    res.status().json({ message: 'Error al añadir el producto al carrito' });
    logger.info("Error enviado en la respuesta");
  }
});

/**
 * @swagger
 * /cart:
 *   get:
 *     tags:
 *       - Cart
 *     description: Obtener detalles del carrito
 *     responses:
 *       200:
 *         description: Detalles del carrito
 */
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
  
  /**
 * @swagger
 * /realTimeProducts:
 *   get:
 *     tags:
 *       - Products
 *     description: Ver productos en tiempo real
 *     responses:
 *       200:
 *         description: Lista de productos en tiempo real
 *       302:
 *         description: Redirigido al login
 */
  
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
      logger.error(err);
      if (err.code === 11000) {
        // Código de error de MongoDB para "Duplicate Key"
        if (err.keyPattern.email) {
          res.status(400).send('Este email ya existe');
        }
      } else {
        // Si no es un error de duplicado, enviar el error completo
        res.status().send(err);
      }
    }
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
    res.status().json({
      status: 'error',
      message: 'Error al obtener los productos',
    });
  }
});


/**
 * @swagger
 * /{pid}:
 *   get:
 *     tags:
 *       - Products
 *     description: Obtener un producto específico por ID
 *     parameters:
 *       - name: pid
 *         description: ID del producto
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: Detalles del producto
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error al obtener el producto
 */
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
    res.status().send('Error al obtener el producto');
  }
});
/**
 * @swagger
 * /:
 *   post:
 *     tags:
 *       - Products
 *     description: Añadir un nuevo producto
 *     parameters:
 *       - name: title
 *         description: Título del producto
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 */
router.post('/', (req, res) => {
  const { title, description, price, thumbnail, code, stock } = req.body;
  pm.addProduct(title, description, price, thumbnail, code, stock);
  res.status(201).send('Producto agregado');
});
/**
 * @swagger
 * /:
 *   post:
 *     tags:
 *       - Products
 *     description: Añadir un nuevo producto
 *     parameters:
 *       - name: title
 *         description: Título del producto
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 */
router.put('/:pid', (req, res) => {
  const { title, description, price, thumbnail, code, stock } = req.body;
  pm.updateProduct(parseInt(req.params.pid), { title, description, price, thumbnail, code, stock });
  res.send('Producto actualizado');
});
/**
 * @swagger
 * /{pid}:
 *   delete:
 *     tags:
 *       - Products
 *     description: Eliminar un producto por ID
 *     parameters:
 *       - name: pid
 *         description: ID del producto
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 */
router.delete('/:pid', (req, res) => {
  pm.deleteProduct(parseInt(req.params.pid));
  res.send('Producto eliminado');
});

router.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new CustomError("USER_NOT_FOUND", "Usuario no encontrado");
    }

    const token = (Math.random() + 1).toString(36).substring(7);
    const hashedToken = await bcrypt.hash(token, 10);
    const now = new Date();
    const tokenExpiration = new Date(now.getTime() + 60 * 60 * 1000); // 1 hora

    user.resetToken = hashedToken;
    user.resetTokenExpiration = tokenExpiration;
    await user.save();

    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Restablecimiento de contraseña',
      html: `<a href="http://localhost:8080/reset-password?token=${token}">Click here to reset your password</a>`
    });
    
    res.send("Correo enviado exitosamente");
  } catch (err) {
    logger.error(err.message);
    res.status(500).send(`Error del servidor: ${err.message}`);

  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await UserModel.findOne({
      resetTokenExpiration: { $gt: Date.now() }
    });

    if (!user) {
      throw new CustomError("TOKEN_EXPIRED", "Token expirado");
    }

    const isValid = await bcrypt.compare(token, user.resetToken);

    if (!isValid) {
      throw new CustomError("INVALID_TOKEN", "Token inválido");
    }

    if (user.comparePassword(newPassword)) {
      throw new CustomError("SAME_PASSWORD", "La nueva contraseña no puede ser igual a la anterior");
    }

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.send("Contraseña actualizada exitosamente");
  } catch (err) {
    logger.error(err.message);
    res.status().send('Error del servidor');
  }
});
router.get('/reset-password', (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).send('Token no proporcionado');
  }
  res.render('password-reset', { token });
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


