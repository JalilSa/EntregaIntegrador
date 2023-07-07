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

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Busca al usuario
  const user = await UserModel.findOne({ username: username });

  // Verifica que el usuario/contraseña
  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.user = user;

    res.redirect('/home');
  } else {
    res.status(401).send('El usuario o la contraseña son incorrectos');
  }
});


app.get('/home', async (req, res) => {
  let messages = await messageManager.getMessages();
  res.render('home', { messages });
});

app.get('/chat', async (req, res) => {
  let messages = await messageManager.getMessages();
  res.render('chat', { messages });
});


app.get('/realTimeProducts', (req, res) => {
  res.render('realTimeProducts', {products: products});
});


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

  socket.on('register', async (data) => {
    const hashedPassword = bcrypt.hashSync(data.password, 10);
    const user = new UserModel({
      username: data.username,
      email: data.email,
      password: hashedPassword,
    });
    await user.save();
  });
});
