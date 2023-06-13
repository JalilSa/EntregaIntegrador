import fs from 'fs';


class ProductManager {
  constructor(path) {
    this.path = path;
    this.products = this.readProducts();
    this.lastId = this.products.length > 0 ? Math.max(...this.products.map(product => product.id)) : 0;
  }

  readProducts() {
    try {
      const data = fs.readFileSync(this.path);
      return JSON.parse(data);
    } catch (error) {
      console.log('Error al leer el archivo de productos', error);
      return [];
    }
  }

  writeProducts() {
    try {
      const data = JSON.stringify(this.products);
      fs.writeFileSync(this.path, data);
    } catch (error) {
      console.log('Error al escribir en el archivo de productos', error);
    }
  }

  addProduct(title, description, price, thumbnail, code, stock, status = true, category, thumbnails = []) {
    if (!title || !description || !price || !thumbnail || !code || !stock) {
      console.error('Todos los campos son obligatorios');
      return;
    }

    if (this.products.some(product => product.code === code)) {
      console.error('Ya existe un producto con ese código');
      return;
    }

    const newProduct = {
      id: ++this.lastId,
      title,
      description,
      price,
      thumbnail,
      code,
      stock,
      status,
      category,
      thumbnails,
    };

    this.products.push(newProduct);
    this.writeProducts();
    console.log('Producto agregado:', newProduct);
  }

  getProducts(limit) {
    if (limit) {
      return this.products.slice(0, limit);
    }
    return this.products;
  }

  getProductById(id) {
    const product = this.products.find(product => product.id === id);
    if (!product) {
      console.error('Producto no encontrado');
      return;
    }
    return product;
  }

  updateProduct(id, fieldsToUpdate) {
    const product = this.getProductById(id);
    if (!product) {
      console.error('Producto no encontrado');
      return;
    }

    const updatedProduct = { ...product, ...fieldsToUpdate };
    this.products = this.products.map(p => (p.id === id ? updatedProduct : p));
    this.writeProducts();
    console.log('Producto actualizado:', updatedProduct);
  }

  deleteProduct(id) {
    const productIndex = this.products.findIndex(product => product.id === id);
    if (productIndex === -1) {
      console.error('Producto no encontrado');
      return;
    }

    this.products.splice(productIndex, 1);
    this.writeProducts();
    console.log(`Producto con id ${id} eliminado`);
  }
}





export default ProductManager;
