import { Server } from "socket.io";

class MessageManager {
  constructor() {
    this.messages = [];
  }

  addMessage(user, message) {
    this.messages.push({user, message});
  }

  getMessages() {
    return this.messages;
  }
}

export default MessageManager;
