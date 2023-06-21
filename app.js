import express from 'express';
import { Server } from 'socket.io'
import handlebars from 'express-handlebars'
import productsRouter from './routes/products.js';
import cartsRouter from './routes/carts.js';
import __dirname from './utils.js'
import fs from 'fs';
import path from 'path';
import { connectDB } from './dao/database.js'; 
import Message from './dao/models/MessageModel.js'; 

const app = express();
connectDB();

const httpServer = app.listen(8080, () => console.log(`Server running`));

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

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Config de handlebars
app.set('views', __dirname+'/views');
app.use(express.static(__dirname+'/views'));
app.engine('handlebars', handlebars.engine());
app.set('view engine', 'handlebars');

app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Rutas de vistas
app.get('/', async (req, res) => {
  const messages = await Message.find();
  res.render('home', {products: products, messages: messages});
});

app.get('/realTimeProducts', (req, res) => {
  res.render('realTimeProducts', {products: products});
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

  socket.on('message', async data => {
    const newMessage = new Message(data);
    await newMessage.save();
    console.log(data.user);
    console.log(data.message)
  
    const allMessages = await Message.find();
    io.emit('Mensajes', allMessages);
  });
});
