import fs from 'fs';


class CartManager {
  constructor(path) {
    this.path = path;
    this.cart = this.readCart();
  }

  readCart() {
    try {
      const data = fs.readFileSync(this.path);
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        fs.writeFileSync(this.path, '[]');
        return [];
      } else {
        console.log('Error al leer el archivo del carrito', error);
        return [];
      }
    }
  }

  writeCart() {
    fs.writeFileSync(this.path, JSON.stringify(this.cart, null, 2));
  }

  addItem(item) {
    const existingItem = this.cart.find(cartItem => cartItem.pid === item.pid);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.cart.push(item);
    }
    this.writeCart();
  }

  updateItem(pid, quantity) {
    const item = this.cart.find(cartItem => cartItem.pid === pid);
    if (item) {
      item.quantity = quantity;
      this.writeCart();
    }
  }

  removeItem(pid) {
    this.cart = this.cart.filter(item => item.pid !== pid);
    this.writeCart();
  }
}
export default CartManager;
