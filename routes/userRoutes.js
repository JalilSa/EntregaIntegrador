
import express from 'express';
const router = express.Router();



// Rutas de vistas
app.get('/', async (req, res) => {
    res.render('main', { user: req.session ? req.session.user : undefined });
  });
  
  app.get('/login', (req, res) => {
    res.render('login'); 
  });
  
  
  
  app.get('/home', (req, res) => {
    // Verificar si el usuario está logueado
    if (req.session.user) {
      // Renderizar la vista de home y pasar los datos del usuario
      res.render('home', { user: req.session.user });
    } else {
      // Si no hay usuario logueado, redirigir al login
      res.redirect('/login');
    }
  });
  
  
  app.get('/chat', async (req, res) => {
    if (req.session.user) {
      let messages = await messageManager.getMessages();
      res.render('chat', { user: req.session.user, messages: messages });
    } else {
      // Si no hay usuario logueado, redirigir al login
      res.redirect('/login');
    }
  });
  
  
  
  app.get('/realTimeProducts', (req, res) => {
    if (req.session.user) {
      res.render('realTimeProducts', { user: req.session.user, products: products });
    } else {
      // Si no hay usuario logueado, redirigir al login
      res.redirect('/login');
  }});
  
  
  app.get('/register' , (req,res)=> {
    res.render('register');
  })
  
  app.post('/register', async (req, res) => {
    const { first_name, last_name, email, age, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).send('El email y la contraseña son obligatorios');
    }
  
    try {
      const user = new UserModel({
        first_name,
        last_name,
        email,
        age,
        password,
      });
  
      await user.save();
      res.redirect('/login');
    } catch (err) {
      console.error(err);
      if (err.code === 11000) {
        // Código de error de MongoDB para "Duplicate Key"
        if (err.keyPattern.email) {
          res.status(400).send('Este email ya existe');
        }
      } else {
        // Si no es un error de duplicado, enviar el error completo
        res.status(500).send(err);
      }
    }
  });
  
  
  
  app.get('/auth/github',
    passport.authenticate('github', { scope: [ 'user:email' ] }));
  
  
  
  app.get('/auth/github/callback', 
    passport.authenticate('github', { failureRedirect: '/login' }),
    function(req, res) {
    req.session.user = req.user;
    res.redirect('/');
  });
  
  
  
  app.get('/logout', authMiddleware, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).send('No se pudo cerrar la sesión');
      } else {
        res.redirect('/login');
      }
    });
  });
  
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await UserModel.findOne({ username: username });
  
    if (user) {
      if (password && user.password && bcrypt.compareSync(password, user.password)) {
        req.session.user = user;
        return res.redirect('/home');
      } else {
        res.status(401).send('La contraseña es incorrecta');
      }
    } else {
      res.status(401).send('El usuario no existe');
    }
  });
  
  export default router;