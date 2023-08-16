import { Server } from 'socket.io';
import Message from '../dao/models/MessageModel.js';
import MessageManagerDB from '../dao/MessageManagerDB.js';

const messageManager = new MessageManagerDB();

const configureSockets = (httpServer) => {
  const io = new Server(httpServer);

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

  return io;
};

export default configureSockets;
