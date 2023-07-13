import express from 'express';
import { Server } from 'socket.io'
import handlebars from 'express-handlebars'
import session from 'express-session';
import __dirname from './utils.js'
import fs from 'fs';
import path from 'path';
import { connectDB } from './dao/database.js'; 
import Message from './dao/models/MessageModel.js'; 
import MessageManagerDB from './dao/MessageManagerDB.js'
import {UserModel} from './dao/models/Usermodel.js';
import bcrypt from 'bcrypt';
import { authMiddleware } from './middlewares/auth.js';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GitHubStrategy } from 'passport-github2';

const app = express();
connectDB();
const httpServer = app.listen(8080, () => console.log(`Server running`));

const messageManager = new MessageManagerDB
const io = new Server(httpServer);
export default io
//set up products
let products = [];

try {
    const data = fs.readFileSync(path.resolve(__dirname, './productos.json'), 'utf-8');
    products = JSON.parse(data);
} catch (err) {
    console.error('Error', err);
}
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// setup express session
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 7200000 } // 2 horas
}));

//config de passport

passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await UserModel.findOne({ username });
      if (!user) return done(null, false);
      if (!bcrypt.compareSync(password, user.password)) return done(null, false);
      return done(null, user);
    } catch (err) {
      done(err);
    }
  }
));

passport.use(new GitHubStrategy({
  clientID: "Iv1.6a7eeb5d8e282978",
  clientSecret: "163ad5605b7342ce8e1836861d1d176d6af8432a",
  callbackURL: "http://localhost:8080/auth/github/callback"
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await UserModel.findOne({ githubId: profile.id });
      if (!user) {
        user = new UserModel({ 
          githubId: profile.id, 
          username: profile.username,
        });
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      done(err);
    }
  }
));


passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch(err) {
    done(err);
  }
});


app.use(passport.initialize());
app.use(passport.session());



//setup handlebars
app.engine('handlebars', handlebars.engine({runtimeOptions: {
  allowProtoPropertiesByDefault: true
}}));
app.set('view engine', 'handlebars');
app.set('views', __dirname+'/views');
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false,
}));

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
  res.render('register')
})

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = new UserModel({ username, email, password: hashedPassword });

  try {
    await user.save();
    res.redirect('/login');
  } catch (err) {
    res.status(400).send('Error al registrar');
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

  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.user = user;
    return res.redirect('/home');
  } else {
    res.status(401).send('El usuario o la contraseña son incorrectos');
  }
});

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('El correo electrónico y la contraseña son obligatorios');
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    const user = new UserModel({
      username: username,
      email: email,
      password: hashedPassword,
    });

    await user.save();
    res.redirect('/login');
  } catch (err) {
    if (err.code === 11000) {
      // Código de error de MongoDB para "Duplicate Key"
      if (err.keyPattern.email) {
        res.status(400).send('Este email ya existe');
      } else if (err.keyPattern.username) {
        res.status(400).send('Este usuario ya existe');
      }
    } else {
      // Si no es un error de duplicado, enviar el error completo
      res.status(500).send(err);
    }
  }
});






// Config de socket.io
io.on('connection', (socket) => {
  console.log('Nuevo usuario conectado');
  
  socket.on('newProduct', (product) => {
    pm.addProduct(product.title, product.description, product.price, product.thumbnail, product.code, product.stock);
    products = pm.getProducts();
    io.emit('updateProducts', products);
  });

  socket.on('deleteProduct', (productId) => {
    pm.deleteProduct(parseInt(productId));
    products = pm.getProducts();
    io.emit('updateProducts', products);
    console.log('Productos actualizados'+ products)
  });

  socket.on('chat message', async data => {
    let newMessage = await Message.create({ user: data.user, message: data.message });
    newMessage = newMessage.toObject();
    io.emit('chat message', newMessage);
    console.log(data.user);
    console.log(data.message)

  });


  
});
//Crear usuario de prueba, normalmente no agregaria el nombre de usuario y contraseña al ser un gran error de seguridad, pero no tengo otra forma de afectar la base de datos que se encuentra en la computadora donde se vaya a probar el codigo
const adminEmail = 'adminCoder@coder.com';
const adminPassword = 'adminCod3r123';
const hashedPassword = bcrypt.hashSync(adminPassword, 10);

UserModel.findOne({ email: adminEmail }).then(user => {
  if (!user) {
    const adminUser = new UserModel({
      username: 'admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin'
    });

    adminUser.save().then(() => {
      console.log('Usuario administrador creado');
    }).catch(err => {
      console.error('No se pudo crear el usuario administrador', err);
    });
  } else {

    console.log('El usuario administrador ya existe');
  }
}).catch(err => {
  console.error('Error comprobando la existencia del usuario administrador', err);
});



