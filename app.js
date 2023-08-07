import express from 'express';
import handlebars from 'express-handlebars'
import session from 'express-session';
import __dirname from './utils.js'
import fs from 'fs';
import path from 'path';
import { connectDB } from './dao/database.js'; 
import MessageManagerDB from './dao/MessageManagerDB.js'
import {UserModel} from './dao/models/usermodel.js';
import bcrypt from 'bcrypt';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GitHubStrategy } from 'passport-github2';
import dotenv from 'dotenv';
import routes from './routes/rutas.js';
import configureSockets from './config/socketconfig.js';


dotenv.config();
const app = express();
connectDB();
const httpServer = app.listen(8080, () => console.log(`Server running`));

const messageManager = new MessageManagerDB
const io = configureSockets(httpServer);
export default io
//set up products
let products = fs.readFileSync(path.resolve(__dirname, './productos.json'), 'utf-8')

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

// app.js
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
},
async (email, password, done) => {
  try {
    const user = await UserModel.findOne({ email });
    if (!user) return done(null, false);
    if (!user.comparePassword(password)) return done(null, false);
    return done(null, user);
  } catch (err) {
    done(err);
  }
}));

passport.use(new GitHubStrategy({
  clientID: "Iv1.6a7eeb5d8e282978",
  clientID: process.env.client_ID,
  clientSecret: process.env.clientSecret,
},
async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await UserModel.findOne({ githubId: profile.id });
    if (!user) {
      user = new UserModel({ 
        githubId: profile.id, 
        email: profile.emails[0].value,
        first_name: profile.displayName,
        last_name: '' 
      });
      await user.save();
    }
    return done(null, user);
  } catch (err) {
    done(err);
  }
}));


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
app.use(routes); 




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

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
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



