import express from 'express';
import CartManager from '../CartManager.js';
const router = express.Router();

const cm = new CartManager('carrito.json');

router.get('/', (req, res) => {
  try {
    const cart = cm.readCart();
    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al obtener los elementos del carrito');
  }
});

router.get('/:cid', async (req, res) => {
  try {
    const cartId = req.params.cid;
    const cart = await Cart.findById(cartId).populate('products');
    if (!cart) {
      res.status(404).send('Carrito no encontrado');
    } else {
      res.render('cart', { cart });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al obtener el carrito');
  }
});


router.post('/:pid', (req, res) => {
  try {
    const { quantity } = req.body;
    const item = { pid: req.params.pid, quantity };
    cm.addItem(item);
    res.status(201).send('Producto agregado al carrito');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al agregar el producto al carrito');
  }
});


router.put('/:pid', (req, res) => {
  try {
    const { quantity } = req.body;
    cm.updateItem(req.params.pid, quantity);
    res.send('Producto actualizado en el carrito');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al actualizar el producto en el carrito');
  }
});

router.delete('/:pid', (req, res) => {
  try {
    cm.removeItem(req.params.pid);
    res.send('Producto eliminado del carrito');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al eliminar el producto del carrito');
  }
});
export default router;


cm.addItem({ pid: 1, quantity: 3 });  // Agrega 3 unidades del producto con id 1 al carrito
cm.addItem({ pid: 2, quantity: 5 });  // Agrega 5 unidades del producto con id 2 al carrito
console.log(cm.readCart());  // Muestra los items en el carrito

cm.updateItem(1, 2);  // Cambia la cantidad del producto con id 1 a 2 unidades
console.log(cm.readCart());  // Muestra los items en el carrito

cm.removeItem(2);  // Elimina el producto con id 2 del carrito
console.log(cm.readCart());  // Muestra los items en el carrito
