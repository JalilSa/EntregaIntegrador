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


const pm = new ProductManager('../productos.json');
const cm = new CartManager('../carrito.json', pm)

try {
  fs.writeFileSync('./test.json', JSON.stringify({ message: "Hello, World!" }, null, 2));
  console.log("Archivo escrito exitosamente!");
} catch (error) {
  console.error("Error al escribir el archivo:", error.message);
}
router.get('/mockingproducts', (req, res) => {
  const products = generateMockProducts();
  res.json(products);
});


router.get('/productEditor',isAdmin , (req,res)=> {
  res.render('productEditor');
})
router.post('/api/addProduct', (req, res) => {
  const { title, description, price, thumbnail, code, stock } = req.body;

  try {
      pm.addProduct(title, description, price, thumbnail, code, stock);
      res.json({ success: true });
  } catch (error) {
      console.error(error);
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
    console.log("Inicio del endpoint /create-ticket");

    const { amount, purchaser } = req.body;

    console.log("Datos recibidos:", { amount, purchaser });
    
    const code = `TCKT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    console.log("Código generado:", code);

    const ticket = new TicketModel({ code, amount, purchaser });
    console.log("Instancia de TicketModel creada:", ticket);

    await ticket.save();
    console.log("Ticket guardado en la base de datos");

    cm.clearCart();
    console.log("Carrito limpiado");

    res.json({ success: true });
    console.log("Respuesta exitosa enviada");
  } catch (error) {
    console.error('Error al crear el ticket:', error.message);
    res.status(500).json({ success: false, message: error.message });
    console.log("Error enviado en la respuesta");
  }
});



router.get('/current', (req, res) => {
  const userDto = userToDto(req.user);
  res.json(userDto);
});
router.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

router.post('/cart', (req, res) => {
  console.log("Inicio del endpoint /cart");

  const { id, quantity } = req.body;
  console.log("Datos recibidos del cuerpo:", { id, quantity });

  if (!id || typeof quantity !== 'number') {
    console.log("Datos inválidos recibidos");
    return res.status(400).json({ message: 'Datos inválidos' });
  }

  try {
    cm.addItem({ id, quantity }); // Cambiamos pid por id
    console.log("Producto añadido al manager del carrito");
    res.json({ message: 'Producto añadido al carrito' });
    console.log("Respuesta exitosa enviada");
  } catch (error) {
    console.error('Error añadiendo al carrito:', error);
    res.status(500).json({ message: 'Error al añadir el producto al carrito' });
    console.log("Error enviado en la respuesta");
  }
});


router.get('/cart', (req, res) => {
  const cartData = cm.getCart();
  const allProducts = products;

  const combinedCart = cartData.map(cartItem => {
    const productInfo = allProducts.find(product => String(product.id) === String(cartItem.id));

    
    if (!productInfo) {
      console.error(`No se encontró producto con ID: ${cartItem.id}`);
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
    const data = fs.readFileSync(path.resolve(__dirname, '../productos.json'), 'utf-8');
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


try {
  // Intenta agregar los productos
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

} catch (error) {
  // Si ocurre algún error en el bloque try, se manejará aquí
  if (error instanceof CustomError) {
    if (error.type === "PRODUCT_EXISTS") {
      console.error("El producto ya existe, no se puede agregar de nuevo.");
    } else if (error.type === "MISSING_FIELDS") {
      console.error("Faltan campos obligatorios para agregar el producto.");
    } // Aquí puedes continuar con más condicionales 'else if' para manejar otros tipos de errores personalizados si los tienes.
  } else {
    // Para cualquier otro tipo de error que no sea CustomError
    console.error("Ocurrió un error:", error.message);
  }
}


