import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CartManager {
  constructor(cartPath, productManager) {
    this.cartPath = path.resolve(__dirname, cartPath); // Utilizamos path.resolve para asegurar la ruta absoluta.
    this.productManager = productManager;
    this.cart = this.readCart();
    console.log(`CartManager conectado a ${this.cartPath}. Actualmente tiene ${this.cart.length} ítems.`);
  }
   getCart() {
    return this.cart;
  }
  
  readCart() {
    try {
      if (!fs.existsSync(this.cartPath)) {
        fs.writeFileSync(this.cartPath, '[]');
        console.log(`Nuevo archivo de carrito creado en ${this.cartPath}.`);
        return [];
      }
      
      const data = fs.readFileSync(this.cartPath, 'utf8');
      return JSON.parse(data);
      
    } catch (error) {
      console.error('Error al leer el archivo del carrito:', error);
      return [];
    }
  }

  writeCart() {
    try {
      fs.writeFileSync(this.cartPath, JSON.stringify(this.cart, null, 2), 'utf8');
      console.log(`Datos del carrito escritos correctamente en ${this.cartPath}.`);
    } catch (error) {
      console.error(`Error al escribir en el archivo del carrito: ${error.message}`);
    }
  }

  clearCart() {
    this.cart = [];
    this.writeCart();
  }

  addItem(item) {
    const existingItem = this.cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.cart.push(item);
    }
    this.writeCart();
  }

  updateItem(id, quantity) {
    const item = this.cart.find(cartItem => cartItem.id === id);
    if (item) {
      item.quantity = quantity;
      this.writeCart();
    }
  }

  removeItem(id) {
    this.cart = this.cart.filter(item => item.id !== id);
    this.writeCart();
  }

  proceedToCheckout() {
    const cart = [...this.cart]; // Hacemos una copia del carrito actual para procesarlo.
    let total = 0;

    let ticketData = "Ticket de Compra\n\n";

    cart.forEach(item => {  
        const { id, quantity } = item;
        const product = this.productManager.getProductById(id);
        if (!product) {
          console.error(`Producto con ID ${id} no encontrado en el ProductManager.`);
          return;
        }
        const priceForItem = product.price * quantity;

        ticketData += `${product.title} - ${quantity} unidades - $${priceForItem}\n`;
        total += priceForItem;
    });

    ticketData += `\nTotal: $${total}`;

    const ticketPath = path.resolve(__dirname, `../tickets/Ticket_${Date.now()}.txt`);
    fs.writeFileSync(ticketPath, ticketData);

    this.clearCart();
  }
}

export default CartManager;
