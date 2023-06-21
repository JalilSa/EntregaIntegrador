import Message from './models/Message.js';

class MessageManagerDB {
  async addMessage(messageData) {
    const message = new Message(messageData);
    await message.save();
  }

  async getMessages() {
    return await Message.find({});
  }

  async deleteMessage(id) {
    await Message.findByIdAndDelete(id);
  }

  async updateMessage(id, messageData) {
    await Message.findByIdAndUpdate(id, messageData);
  }
}

export default MessageManagerDB;
