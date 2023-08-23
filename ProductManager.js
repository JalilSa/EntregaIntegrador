import fs from 'fs';
import { CustomError, ErrorDictionary } from './errorHandler.js';

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
      throw new CustomError("READ_FILE_ERROR");
    }
  }

  writeProducts() {
    try {
      const data = JSON.stringify(this.products);
      fs.writeFileSync(this.path, data);
    } catch (error) {
      throw new CustomError("WRITE_FILE_ERROR");
    }
  }

  addProduct(title, description, price, thumbnail, code, stock, status = true, category, thumbnails = []) {
    if (!title || !description || !price || !thumbnail || !code || !stock) {
        throw new CustomError("MISSING_FIELDS");
    }

    if (this.products.some(product => product.code === code)) {
        throw new CustomError("PRODUCT_EXISTS");
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
    return newProduct; // Retorna el producto agregado
  }
  getProducts(options = {}) {
    const { limit = 10, page = 1, sort, query } = options;
  
    // Aplica el filtro de categoría o disponibilidad si se especifica el query
    let filteredProducts = this.products;
    if (query) {
      filteredProducts = filteredProducts.filter((product) => {
        return (
          product.category.toLowerCase().includes(query.toLowerCase()) ||
          product.availability.toLowerCase().includes(query.toLowerCase())
        );
      });
    }
  
    // Ordena los productos por precio ascendente o descendente si se especifica el sort
    if (sort === 'asc') {
      filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sort === 'desc') {
      filteredProducts.sort((a, b) => b.price - a.price);
    }
  
    // Calcula la paginación
    const totalProducts = filteredProducts.length;
    const totalPages = Math.ceil(totalProducts / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const products = filteredProducts.slice(startIndex, endIndex);
  
    // Genera los enlaces de página previa y siguiente
    const prevPage = page > 1 ? page - 1 : null;
    const nextPage = page < totalPages ? page + 1 : null;
    const prevLink = prevPage ? `/api/products?limit=${limit}&page=${prevPage}&sort=${sort}&query=${query}` : null;
    const nextLink = nextPage ? `/api/products?limit=${limit}&page=${nextPage}&sort=${sort}&query=${query}` : null;
  
    // Devuelve los productos y la información de paginación
    return {
      products,
      pagination: {
        totalPages,
        prevPage,
        nextPage,
        hasPrevPage: prevPage !== null,
        hasNextPage: nextPage !== null,
        prevLink,
        nextLink,
      },
    };
  }
  

  getProductById(id) {
    const product = this.products.find(product => product.id === id);
    if (!product) {
      throw new CustomError("PRODUCT_NOT_FOUND");
    }
    return product;
  }

  updateProduct(id, fieldsToUpdate) {
    const product = this.getProductById(id); 

    const updatedProduct = { ...product, ...fieldsToUpdate };
    this.products = this.products.map(p => (p.id === id ? updatedProduct : p));
    this.writeProducts();
    return updatedProduct; 
  }

  deleteProduct(id) {
    const productIndex = this.products.findIndex(product => product.id === id);
    if (productIndex === -1) {
      throw new CustomError("PRODUCT_NOT_FOUND");
    }

    this.products.splice(productIndex, 1);
    this.writeProducts();
  }
}





export default ProductManager;
