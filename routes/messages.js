// routes/messages.js

import express from 'express';
import MessageManager from './MessageManager.js';
import path from 'path';
import io from 'socket.io';

const router = express.Router();
const messageManager = new MessageManager();

router.get('/', (req, res) => {
  const messages = messageManager.getMessages();
  res.render('chat', { messages });
});

router.post('/', (req, res) => {
  const { user, message } = req.body;
  messageManager.addMessage(user, message);
  io.emit('newMessage', {user, message});
  res.status(201).send('Mensaje agregado');
});

export default router;
