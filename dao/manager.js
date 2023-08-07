import Product from './models/productmon.js';

class ProductManagerDB {
  async addProduct(productData) {
    const product = new Product(productData);
    await product.save();
  }

  async getProducts() {
    return await Product.find({});
  }

  async deleteProduct(id) {
    await Product.findByIdAndDelete(id);
  }

  async updateProduct(id, productData) {
    await Product.findByIdAndUpdate(id, productData);
  }
}

export default ProductManagerDB;
