import express from 'express';
import { Server } from 'socket.io'
import handlebars from 'express-handlebars'
import session from 'express-session';
import __dirname from './utils.js'
import fs from 'fs';
import path from 'path';
import { connectDB } from './dao/database.js'; 
import Message from './dao/models/MessageModel.js'; 
import MessageManagerDB from './dao/MessageManagerDB.js'
import {UserModel} from './dao/models/Usermodel.js';
import bcrypt from 'bcrypt';
import { authMiddleware } from './middlewares/auth.js';

const app = express();
connectDB();
const httpServer = app.listen(8080, () => console.log(`Server running`));

const messageManager = new MessageManagerDB
const io = new Server(httpServer);
export default io
//set up products
let products = [];

try {
    const data = fs.readFileSync(path.resolve(__dirname, './productos.json'), 'utf-8');
    products = JSON.parse(data);
} catch (err) {
    console.error('Error', err);
}
app.use(express.json());
app.use(express.urlencoded({extended: true}));


//setup handlebars
app.engine('handlebars', handlebars.engine({runtimeOptions: {
  allowProtoPropertiesByDefault: true
}}));
app.set('view engine', 'handlebars');
app.set('views', __dirname+'/views');
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false,
}));

// Rutas de vistas
app.get('/', async (req, res) => {
  res.render('main', { user: req.session ? req.session.user : undefined });
});

app.get('/login', (req, res) => {
  res.render('login'); 
});



app.get('/home', (req, res) => {
  // Verificar si el usuario está logueado
  if (req.session.user) {
    // Renderizar la vista de home y pasar los datos del usuario
    res.render('home', { user: req.session.user });
  } else {
    // Si no hay usuario logueado, redirigir al login
    res.redirect('/login');
  }
});


app.get('/chat', async (req, res) => {
  if (req.session.user) {
    res.render('chat', { user: req.session.user });
    let messages = await messageManager.getMessages();
    res.render('chat', { messages });
  } else {
    // Si no hay usuario logueado, redirigir al login
    res.redirect('/login');
}});


app.get('/realTimeProducts', (req, res) => {
  if (req.session.user) {
    res.render('realTimeProducts', {products: products});
    res.render('chat', { messages });
  } else {
    // Si no hay usuario logueado, redirigir al login
    res.redirect('/login');
}});


app.get('/register' , (req,res)=> {
  res.render('register')
})

app.get('/logout', authMiddleware, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).send('No se pudo cerrar la sesión');
    } else {
      res.redirect('/login');
    }
  });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // La contraseña de administrador debe ser un hash guardado de manera segura, 
  // no una cadena de texto en el código.
 

  const user = await UserModel.findOne({ username: username });

  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.user = user;
    return res.redirect('/home');
  } else {
    res.status(401).send('El usuario o la contraseña son incorrectos');
  }
});

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    const user = new UserModel({
      username: username,
      email: email,
      password: hashedPassword,
    });

    await user.save();
    res.redirect('/login');
  } catch (err) {
    if (err.code === 11000) {
      // Código de error de MongoDB para "Duplicate Key"
      if (err.keyPattern.email) {
        res.status(400).send('Este email ya existe');
      } else if (err.keyPattern.username) {
        res.status(400).send('Este usuario ya existe');
      }
    } else {
      // Si no es un error de duplicado, enviar el error completo
      res.status(500).send(err);
    }
  }
});





// Config de socket.io
io.on('connection', (socket) => {
  console.log('Nuevo usuario conectado');
  
  socket.on('newProduct', (product) => {
    pm.addProduct(product.title, product.description, product.price, product.thumbnail, product.code, product.stock);
    products = pm.getProducts();
    io.emit('updateProducts', products);
  });

  socket.on('deleteProduct', (productId) => {
    pm.deleteProduct(parseInt(productId));
    products = pm.getProducts();
    io.emit('updateProducts', products);
    console.log('Productos actualizados'+ products)
  });

  socket.on('chat message', async data => {
    let newMessage = await Message.create({ user: data.user, message: data.message });
    newMessage = newMessage.toObject();
    io.emit('chat message', newMessage);
    console.log(data.user);
    console.log(data.message)

  });


  
});
//Crear usuario de prueba
const adminEmail = 'adminCoder@coder.com';
const adminPassword = 'adminCod3r123';
const hashedPassword = bcrypt.hashSync(adminPassword, 10);

UserModel.findOne({ email: adminEmail }).then(user => {
  if (!user) {
    const adminUser = new UserModel({
      username: 'admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin'
    });

    adminUser.save().then(() => {
      console.log('Usuario administrador creado');
    }).catch(err => {
      console.error('No se pudo crear el usuario administrador', err);
    });
  } else {

    console.log('El usuario administrador ya existe');
  }
}).catch(err => {
  console.error('Error comprobando la existencia del usuario administrador', err);
});

