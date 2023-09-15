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
import { Strategy as GitHubStrategy } from 'passport-github2';
import dotenv from 'dotenv';
import routes from './routes/rutas.js';
import configureSockets from './config/socketconfig.js';
import { CustomError, ErrorDictionary } from './errorHandler.js';
import logger from './config/logger.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerOptions from './swagger.js';
const app = express();
// Rutas de vistas
app.use(routes); 


dotenv.config();

connectDB();
const httpServer = app.listen(8080, () => logger.info(`Server running`));

const messageManager = new MessageManagerDB
const io = configureSockets(httpServer);
export default io
//set up products
let products = fs.readFileSync(path.resolve(__dirname, './productos.json'), 'utf-8')
try {
  products = JSON.parse(fs.readFileSync(path.resolve(__dirname, './productos.json'), 'utf-8'));
} catch (err) {
  throw new CustomError("READ_FILE_ERROR", `Error al leer el archivo: ${err.message}`);
}


app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// setup express session
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 7200000 } // 2 horas
}));

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// app.js
passport.use(new GitHubStrategy({
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






// Config de socket.io


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
      logger.info('Usuario administrador creado');
    }).catch(err => {
      logger.error(`No se pudo crear el usuario administrador: ${err.message}`);
    });
  } else {
    logger.info('Usuario administrador ya existe');
  }
}).catch(err => {
  logger.error(`Buscando por el usuario administrador: ${err.message}`);
});

//test logger

